"""Whisper `small` read-back of the voice (or the final mp4): prints every segment next to the script line it overlaps,
so misread names and numbers show up. Writes out/qa/whisper_small.txt.

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/whisper_check.py [vo/audio/vo.wav | out/money-news.mp4]
"""
import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ["PATH"] = r"ffmpeg-bin\node_modules\ffmpeg-static" + os.pathsep + os.environ["PATH"]
import whisper  # noqa: E402

src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "vo", "audio", "vo.wav")
if not os.path.isabs(src):
    src = os.path.join(ROOT, src)
vo = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
m = whisper.load_model("small")
r = m.transcribe(src, language="en", word_timestamps=False, condition_on_previous_text=False, temperature=0)
out = []
for s in r["segments"]:
    mid = 0.5 * (s["start"] + s["end"])
    line = min(vo["lines"], key=lambda l: 0 if l["start"] <= mid <= l["end"] else min(abs(mid - l["start"]), abs(mid - l["end"])))
    out.append(f"[{s['start']:6.2f}-{s['end']:6.2f}] {s['text'].strip()}\n        script {line['id']}: {line['text']}")
txt = "\n".join(out)
os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
open(os.path.join(ROOT, "out", "qa", "whisper_small.txt"), "w", encoding="utf-8").write(txt + "\n")
print(txt)
