"""Pick one take per line: every word right (faster-whisper small.en) and the closest voice to the character's anchor
(Chatterbox VoiceEncoder speaker-embedding cosine).

1. Anchor per character: among vo/anchors/<who>_s*.wav, the candidate whose embedding has the highest mean cosine to
   ALL of that character's line takes (the most typical voice of the seeds) -> vo/anchors/<who>_anchor.wav.
   An existing vo/anchors/<who>_anchor.wav (e.g. copied from the skill for a new episode) is kept as is: pass --reanchor
   to choose again.
2. Per line: transcribe every take (the series name, times, numbers and a laugh's "ha" are normalised); a take passes when its normalised words equal the script's (digits = words). Among
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
TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety"}
NAME = "zeythar"          # the series name: Whisper spells it many ways (zaythar, zethar, the, zeitar...)
FILLERS = {"ha", "haha", "hahaha", "hah", "heh", "hehe", "mm", "um", "uh", "hmm"}


def num_words(n):
    n = int(n)
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if 100 <= n <= 1259 and n % 100 < 60 and not (1900 <= n <= 2099):   # a time heard as digits: 247 -> two forty seven
        return num_words(n // 100) + (num_words(n % 100) if n % 100 else ["o'clock"])
    if 1900 <= n <= 2099:      # years: 2019 -> twenty nineteen
        return num_words(n // 100) + (num_words(n % 100) if n % 100 >= 10 else (["oh"] + num_words(n % 100) if n % 100 else ["hundred"]))
    return [str(n)]


def namelike(w):
    import difflib
    r = difflib.SequenceMatcher(None, w, NAME).ratio()
    return w == NAME or (w[:1] == "z" and r >= 0.4) or (w[:1] in "xsc" and r >= 0.6)


def toks(s, heard=False):
    """normalised tokens: lower case, times and numbers spelt out (2:30 -> two thirty, 2019 -> twenty nineteen),
    a.m. -> am, the series name folded (Whisper spells it many ways), laughs/fillers dropped from what was heard"""
    import re
    s = s.lower().replace("’", "'").replace("…", " ").replace("-", " ")
    s = re.sub(r"\ba\.\s?m\.?", " am ", s); s = re.sub(r"\bp\.\s?m\.?", " pm ", s)
    s = re.sub(r"(\d+),000", lambda m: m.group(1) + " thousand", s)
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\bgood night\b", "goodnight", s)
    s = re.sub(r"(\d{1,2})[:.](\d\d)", lambda m: " " + " ".join(num_words(m.group(1)) + (num_words(m.group(2)) if m.group(2) != "00" else ["o'clock"])) + " ", s)
    raw = []
    for w in re.findall(r"[a-z0-9']+", s):
        if w.isdigit():
            raw += num_words(w)
        elif heard and w in FILLERS:
            continue
        else:
            raw.append(w)
    # fold the series name (Whisper sometimes splits it: "zay thar")
    res, i = [], 0
    while i < len(raw):
        if i + 1 < len(raw) and raw[i][:1] in "zxsc" and len(raw[i]) <= 4 and namelike(raw[i] + raw[i + 1]):
            res.append(NAME); i += 2
        else:
            res.append(NAME if namelike(raw[i]) else raw[i]); i += 1
    return res


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


def f0_range(a16):
    """pitch range in semitones (10th-90th percentile of voiced frames): the deadpan lines want the flattest read"""
    import librosa
    f0, vf, _ = librosa.pyin(a16, fmin=60, fmax=600, sr=16000, frame_length=1024)
    f = f0[vf & ~np.isnan(f0)]
    if len(f) < 6:
        return 0.0
    st = 12 * np.log2(f / np.median(f))
    return float(np.percentile(st, 90) - np.percentile(st, 10))


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
                                                  "emb": emb(a16), "heard": heard, "wer": round(wer(toks(ln["text"]), toks(heard, heard=True)), 3),
                                                  "f0": round(f0_median(a16), 1), "f0_range": round(f0_range(a16), 2), "dur": round(len(raw) / sr, 2)})
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
        # deadpan lines: the flattest passing read (smallest pitch range) among those within 0.07 cosine of the best
        if ok and "deadpan" in ln.get("delivery", "").lower():
            near = [t for t in ok if t["cos"] >= win["cos"] - 0.07]
            win = min(near, key=lambda t: t["f0_range"])
        shutil.copy(os.path.join(ROOT, win["file"]), os.path.join(ROOT, "vo", "lines", ln["id"] + ".wav"))
        picks["lines"].append({"id": ln["id"], "who": ln["who"], "pick": win["file"], "seed": win["seed"], "flag": None if ok else "no take passed whisper",
                               "takes": [{k: v for k, v in t.items() if k != "emb"} for t in cand]})
        print(f"PICK {ln['id']} seed {win['seed']}  cos {win['cos']:.4f}  wer {win['wer']}  f0 range {win['f0_range']:.1f} st  ({len(ok)}/{len(cand)} passed)")
    json.dump(picks, open(os.path.join(ROOT, "vo", "data", "picks.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
