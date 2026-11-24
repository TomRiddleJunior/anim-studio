"""Voice every line of vo/script.json with Qwen3-TTS 1.7B VoiceDesign, several seeds per line.

Writes
  vo/anchors/<who>_s<seed>.wav     anchor candidates: the character's description + its anchor_text (no delivery)
  vo/takes/<id>_s<seed>.wav        one take per line and seed: description + the line's delivery as the instruct
Existing files are skipped, so the job resumes. Pick the takes with tools/pick_takes.py (speaker-embedding cosine to
the anchor + faster-whisper word check), which copies the winners to vo/lines/<id>.wav.

usage (from the project folder):
  set HF_HOME=tts-bench\\hf ; set TORCH_THREADS=8
  "tts-bench/venvs/qwen/Scripts/python.exe" -I tools/voice_qwen.py [--seeds 1,2,3] [--anchor-seeds 1,2,3,4]
        [--only l01,l10] [--no-anchors] [--skip-lines]
The tts-bench scripts are not imported or modified; this file only reuses the same model and venv.
"""
import argparse
import json
import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("HF_HOME", r"tts-bench\hf")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
import torch  # noqa: E402

REPO = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"


def tts_text(s):
    return s.replace("\u2026", "...").replace("\u2019", "'")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="1,2,3")
    ap.add_argument("--anchor-seeds", default="1,2,3,4")
    ap.add_argument("--only", default="")
    ap.add_argument("--no-anchors", action="store_true")
    ap.add_argument("--skip-lines", action="store_true")
    ap.add_argument("--script", default=os.path.join(ROOT, "vo", "script.json"))
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    torch.set_num_threads(int(os.environ.get("TORCH_THREADS", "8")))
    spec = json.load(open(a.script, encoding="utf-8"))
    voices = spec["voices"]
    only = [x for x in a.only.split(",") if x]
    tdir = os.path.join(ROOT, "vo", "takes"); adir = os.path.join(ROOT, "vo", "anchors")
    os.makedirs(tdir, exist_ok=True); os.makedirs(adir, exist_ok=True)

    from qwen_tts import Qwen3TTSModel
    t0 = time.perf_counter()
    model = Qwen3TTSModel.from_pretrained(REPO, device_map="cpu", dtype=torch.float32, attn_implementation="sdpa")
    print(f"loaded {REPO} in {time.perf_counter() - t0:.1f} s · threads {torch.get_num_threads()}", flush=True)
    log = os.path.join(ROOT, "vo", "takes", "log.jsonl")

    def gen(text, instruct, seed, path, tag):
        if os.path.exists(path):
            return
        torch.manual_seed(seed); np.random.seed(seed)
        t = time.perf_counter()
        with torch.inference_mode():
            wavs, sr = model.generate_voice_design(text=tts_text(text), language="English", instruct=instruct)
        w = np.asarray(wavs[0], dtype="float32").reshape(-1)
        sf.write(path, w, sr)
        el = time.perf_counter() - t
        print(f"  {tag} seed {seed}: {el:.1f} s for {len(w) / sr:.2f} s audio (RTF {el / max(1e-6, len(w) / sr):.2f})", flush=True)
        with open(log, "a", encoding="utf-8") as f:
            f.write(json.dumps({"tag": tag, "seed": seed, "file": os.path.basename(path), "audio_s": round(len(w) / sr, 3),
                                "synth_s": round(el, 1), "instruct": instruct, "text": text}) + "\n")

    if not a.no_anchors:
        for who, v in voices.items():
            for s in [int(x) for x in a.anchor_seeds.split(",") if x]:
                gen(v["anchor_text"], v["description"], s, os.path.join(adir, f"{who}_s{s}.wav"), f"anchor {who}")
    if not a.skip_lines:
        for s in [int(x) for x in a.seeds.split(",") if x]:
            for ln in spec["lines"]:
                if only and ln["id"] not in only:
                    continue
                v = voices[ln["who"]]
                gen(ln["text"], f'{v["description"]} {ln["delivery"]}', s, os.path.join(tdir, f'{ln["id"]}_s{s}.wav'), ln["id"])
    print("done", flush=True)


if __name__ == "__main__":
    main()
