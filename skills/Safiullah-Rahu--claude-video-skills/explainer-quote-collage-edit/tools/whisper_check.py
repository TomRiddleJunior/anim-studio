"""Whisper `small` (faster-whisper, int8 CPU) on the delivered full mix and on the no-music twin: every scripted line must
come back. Writes out/qa/whisper_small.txt and out/qa/whisper_check.json (per-line word recall).
Skips (writes a note) when film.json has "voice": false.
usage: python -X utf8 -I tools/whisper_check.py     (any interpreter with faster_whisper)"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "film.json"), encoding="utf-8"))
KEY = CFG["slug"]
QA = os.path.join(ROOT, "out", "qa")
os.makedirs(QA, exist_ok=True)
if not CFG.get("voice", True):
    json.dump({"note": "no voice in this film"}, open(os.path.join(QA, "whisper_check.json"), "w"), indent=1)
    raise SystemExit(0)
from faster_whisper import WhisperModel  # noqa: E402

model = WhisperModel("small", device="cpu", compute_type="int8")


def toks(s):
    return re.findall(r"[a-z0-9']+", s.lower().replace("-", " "))


script = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
out = {}
txt = []
for name in (KEY + ".mp4", KEY + "_nomusic.mp4"):
    path = os.path.join(ROOT, "out", name)
    segs, info = model.transcribe(path, language="en", beam_size=5, vad_filter=False, condition_on_previous_text=False)
    segs = list(segs)
    heard = " ".join(s.text for s in segs)
    txt.append(f"== {name}\n" + "\n".join(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}" for s in segs))
    H = set(toks(heard))
    rep = []
    for l in script["lines"]:
        words = toks(l["text"])
        joined = "".join(toks(heard))          # "under water" counts for "underwater"
        miss = [w for w in words if w not in H and w.rstrip("s") not in H and w + "s" not in H and not (len(w) > 6 and w in joined)]
        rep.append({"id": l["id"], "text": l["text"], "missing": miss, "recall": round(1 - len(miss) / max(1, len(words)), 3)})
    out[name] = {"lines": rep, "mean_recall": round(sum(r["recall"] for r in rep) / len(rep), 3), "all_heard": all(not r["missing"] for r in rep)}
open(os.path.join(QA, "whisper_small.txt"), "w", encoding="utf-8").write("\n\n".join(txt))
json.dump(out, open(os.path.join(QA, "whisper_check.json"), "w"), indent=1)
for k, v in out.items():
    print(k, "mean recall", v["mean_recall"], "all heard" if v["all_heard"] else [r for r in v["lines"] if r["missing"]])
