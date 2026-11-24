"""Whisper `small` on the delivered mp4: every line of vo/script.json must come back (numbers may return as digits).
Writes out/qa/whisper_small.txt and out/qa/whisper_check.json.
usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/whisper_check.py
"""
import json
import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ["PATH"] = r"engine\node_modules\ffmpeg-static" + os.pathsep + os.environ["PATH"]
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
NUM = {"one": "1", "two": "2", "three": "3", "ten": "10", "fifty": "50", "twelve": "12", "half": "50"}


def toks(s):
    s = s.lower().replace("-", " ").replace(":", " ")
    return re.findall(r"[a-z0-9']+", s)


heard = " ".join(sg["text"] for sg in res["segments"])
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
def n2w(n):
    n = int(n)
    if n < 20: return ONES[n]
    return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
def spell(m):  # 25 -> twenty five, 1.55 / 1:55 -> one fifty five, 05 -> zero five
    parts = re.split(r"[.:]", m.group(0))
    return " ".join(("zero " + n2w(p[1]) if len(p) == 2 and p[0] == "0" else n2w(p)) for p in parts if p.isdigit() and int(p) < 100)
heard_words = re.sub(r"\d+(?:[.:]\d+)?", spell, heard)
heard = heard + " " + heard_words + " " + heard.lower().replace("a.m.", "am").replace("hannah", "hana").replace("hick", "hic").replace("tee", "tea")
H = set(toks(heard)) | {w.replace("'", "") for w in toks(heard)}
script = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
rep = []
for l in script["lines"]:
    words = toks(l["text"])
    miss = []
    for w in words:
        alts = {w, w.replace("'", ""), NUM.get(w, ""), w.rstrip("s"), w + "s", w.replace("our", "or")}
        if any(a and a in H for a in alts):
            continue
        if re.fullmatch(r"\d+", w) and (w in heard.replace(",", "")):
            continue
        miss.append(w)
    rep.append({"id": l["id"], "text": l["text"], "missing": miss, "recall": round(1 - len(miss) / max(1, len(words)), 3)})
json.dump({"lines": rep, "all_lines_heard": all(r["recall"] >= 0.85 for r in rep), "mean_recall": round(sum(r["recall"] for r in rep) / len(rep), 3)},
          open(os.path.join(QA, "whisper_check.json"), "w", encoding="utf-8"), indent=1)
for r in rep:
    print(f"{r['id']} {r['recall']:.2f} missing={r['missing']}")
