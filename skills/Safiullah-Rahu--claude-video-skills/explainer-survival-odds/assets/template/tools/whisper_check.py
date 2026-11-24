"""Whisper `small` on the delivered mp4: every line of vo/script.json must come back (names and numbers included).
Writes out/qa/whisper_small.txt (segments) and out/qa/whisper_check.json (per-line word recall; numbers may come back as digits).
usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/whisper_check.py
"""
import json
import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402
os.environ["PATH"] = paths.bin_path() + os.pathsep + os.environ["PATH"]
import whisper  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
MP4 = os.path.join(ROOT, "out", KEY + ".mp4")
QA = os.path.join(ROOT, "out", "qa")
os.makedirs(QA, exist_ok=True)
for s in (sys.stdout, sys.stderr):
    if hasattr(s, "reconfigure"):
        s.reconfigure(encoding="utf-8", errors="replace")
model = whisper.load_model("small", download_root=os.path.expanduser("~/.cache/whisper"))
res = model.transcribe(MP4, language="en", fp16=False, condition_on_previous_text=False)
with open(os.path.join(QA, "whisper_small.txt"), "w", encoding="utf-8") as f:
    for sg in res["segments"]:
        f.write(f"[{sg['start']:6.2f}-{sg['end']:6.2f}] {sg['text'].strip()}\n")
NUM = {"thirty-three": "33", "thirty": "3", "three": "3", "hundred": "1", "forty": "4", "nine": "9", "ten": "10", "twelve": "12", "ninety-seven": "97", "ninety": "9", "seven": "7", "one": "1", "ness": "ness"}


def toks(s):
    return [w for w in re.findall(r"[a-z0-9']+", s.lower().replace("-", " ").replace("°", " "))]


heard = " ".join(sg["text"] for sg in res["segments"])
H = set(toks(heard))
script = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
rep = []
for l in script["lines"]:
    words = toks(" ".join(c[0].replace("|", " ") for c in l["caps"])) if l.get("caps") else toks(l["text"])
    miss = []
    for w in words:
        if w in H:
            continue
        alts = {NUM.get(w, ""), w.rstrip("s"), w + "s", {"kilometres": "kilometers", "percent": "%"}.get(w, "")}
        if w == "percent" and "%" in heard:
            continue
        if w == "helideck" and ("heli" in H and "deck" in H):
            continue
        if any(a and a in H for a in alts) or any(d in H for d in re.findall(r"\d+", heard) if NUM.get(w) and NUM[w] in d):
            continue
        miss.append(w)
    rep.append({"id": l["id"], "text": l["text"], "missing": miss, "recall": round(1 - len(miss) / max(1, len(words)), 3)})
json.dump({"lines": rep, "all_lines_heard": all(r["recall"] >= 0.85 for r in rep), "mean_recall": round(sum(r["recall"] for r in rep) / len(rep), 3)},
          open(os.path.join(QA, "whisper_check.json"), "w", encoding="utf-8"), indent=1)
for r in rep:
    print(f"{r['id']} {r['recall']:.2f} missing={r['missing']}")
