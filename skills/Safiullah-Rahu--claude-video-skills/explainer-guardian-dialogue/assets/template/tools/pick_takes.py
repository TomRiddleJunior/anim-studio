"""Pick one take per line: every word right (faster-whisper small.en) and the closest voice to the character's anchor
(Chatterbox VoiceEncoder speaker-embedding cosine).

1. Anchor per character: among vo/anchors/<who>_s*.wav, the candidate whose embedding has the highest mean cosine to
   ALL of that character's line takes (the most typical voice of the seeds) -> vo/anchors/<who>_anchor.wav.
   An existing vo/anchors/<who>_anchor.wav (e.g. copied from the skill for a new episode) is kept as is: pass --reanchor
   to choose again.
2. Per line: transcribe every take; a take passes when its normalised words equal the script's (digits = words). Among
   passing takes, the highest cosine to the anchor wins; if none pass, the lowest word-error take wins and is flagged.
3. Writes vo/lines/<id>.wav (copies) and vo/data/picks.json (every take: cosine, WER, heard text, F0 median, duration).

usage: "tts-bench/venvs/chatterbox/Scripts/python.exe" -I tools/pick_takes.py [--reanchor] [--only l01,l10]
"""
import argparse
import glob
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("HF_HOME", r"tts-bench\hf")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

VE = glob.glob(os.path.join(os.environ["HF_HOME"], "hub", "models--ResembleAI--chatterbox", "snapshots", "*", "ve.safetensors"))
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()


def toks(s):
    s = s.lower().replace("\u2019", "'").replace("-", " ")
    s = re.sub(r"(\d+),000", lambda m: m.group(1) + " thousand", s)
    out = []
    for w in re.findall(r"[a-z0-9']+", s):
        if w.isdigit() and int(w) < 20:
            out.append(ONES[int(w)])
        else:
            out.append(w)
    return out


def wer(ref, hyp):
    import difflib
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    err = sum(max(a1 - a0, b1 - b0) for op, a0, a1, b0, b1 in sm.get_opcodes() if op != "equal")
    return err / max(1, len(ref))


def load16(p):
    import librosa
    a, sr = sf.read(p, always_2d=True)
    a = a.mean(axis=1).astype(np.float32)
    return a, sr, librosa.resample(a, orig_sr=sr, target_sr=16000) if sr != 16000 else a


def f0_median(a16):
    import librosa
    f0 = librosa.yin(a16, fmin=60, fmax=600, sr=16000, frame_length=1024)
    rms = librosa.feature.rms(y=a16, frame_length=1024, hop_length=256)[0]
    n = min(len(f0), len(rms))
    voiced = f0[:n][rms[:n] > 0.25 * rms.max()]
    return float(np.median(voiced)) if len(voiced) else 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reanchor", action="store_true")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    import torch
    from safetensors.torch import load_file
    from chatterbox.models.voice_encoder import VoiceEncoder
    from faster_whisper import WhisperModel
    torch.set_num_threads(8)
    ve = VoiceEncoder(); ve.load_state_dict(load_file(VE[0])); ve.eval()
    asr = WhisperModel("small.en", device="cpu", compute_type="int8")
    spec = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
    only = [x for x in a.only.split(",") if x]

    def emb(a16):
        return ve.embeds_from_wavs([a16], sample_rate=16000, as_spk=True)

    takes = {}
    for ln in spec["lines"]:
        for p in sorted(glob.glob(os.path.join(ROOT, "vo", "takes", ln["id"] + "_s*.wav"))):
            raw, sr, a16 = load16(p)
            segs, _ = asr.transcribe(a16, language="en", beam_size=5, vad_filter=False)
            heard = " ".join(s.text.strip() for s in segs)
            takes.setdefault(ln["id"], []).append({"file": os.path.relpath(p, ROOT).replace("\\", "/"), "seed": int(re.search(r"_s(\d+)", p).group(1)),
                                                  "emb": emb(a16), "heard": heard, "wer": round(wer(toks(ln["text"]), toks(heard)), 3),
                                                  "f0": round(f0_median(a16), 1), "dur": round(len(raw) / sr, 2)})
            t = takes[ln["id"]][-1]
            print(f"{ln['id']} s{t['seed']}  wer {t['wer']:.2f}  f0 {t['f0']:5.0f}  {t['dur']:5.2f}s  heard: {heard}", flush=True)

    anchors = {}
    for who in spec["voices"]:
        fixed = os.path.join(ROOT, "vo", "anchors", f"{who}_anchor.wav")
        mine = [t["emb"] for ln in spec["lines"] if ln["who"] == who for t in takes.get(ln["id"], [])]
        if os.path.exists(fixed) and not a.reanchor:
            anchors[who] = {"file": os.path.relpath(fixed, ROOT), "emb": emb(load16(fixed)[2]), "kept": True}
        else:
            best = None
            for p in sorted(glob.glob(os.path.join(ROOT, "vo", "anchors", f"{who}_s*.wav"))):
                e = emb(load16(p)[2])
                score = float(np.mean([e @ m for m in mine])) if mine else 0.0
                print(f"anchor {who} {os.path.basename(p)}: mean cos to {len(mine)} takes {score:.4f}")
                if best is None or score > best[0]:
                    best = (score, p, e)
            shutil.copy(best[1], fixed)
            anchors[who] = {"file": os.path.relpath(fixed, ROOT), "from": os.path.basename(best[1]), "mean_cos": round(best[0], 4), "emb": best[2]}
        print(f"anchor {who}: {anchors[who]['file']}")

    os.makedirs(os.path.join(ROOT, "vo", "lines"), exist_ok=True)
    picks = {"anchors": {k: {kk: vv for kk, vv in v.items() if kk != "emb"} for k, v in anchors.items()}, "lines": []}
    for ln in spec["lines"]:
        if only and ln["id"] not in only:
            continue
        cand = takes.get(ln["id"], [])
        if not cand:
            print("NO TAKES for", ln["id"]); continue
        ae = anchors[ln["who"]]["emb"]
        for t in cand:
            t["cos"] = round(float(t["emb"] @ ae), 4)
        ok = [t for t in cand if t["wer"] == 0]
        win = max(ok, key=lambda t: t["cos"]) if ok else min(cand, key=lambda t: (t["wer"], -t["cos"]))
        shutil.copy(os.path.join(ROOT, win["file"]), os.path.join(ROOT, "vo", "lines", ln["id"] + ".wav"))
        picks["lines"].append({"id": ln["id"], "who": ln["who"], "pick": win["file"], "seed": win["seed"], "flag": None if ok else "no take passed whisper",
                               "takes": [{k: v for k, v in t.items() if k != "emb"} for t in cand]})
        print(f"PICK {ln['id']} seed {win['seed']}  cos {win['cos']:.4f}  wer {win['wer']}  ({len(ok)}/{len(cand)} passed)")
    json.dump(picks, open(os.path.join(ROOT, "vo", "data", "picks.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
