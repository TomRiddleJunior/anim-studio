"""The chat as an SRT (out/<key>.srt): each user message from the moment it is sent, each reply paragraph from its
first streamed word. For the kit's scripts PDF and for platforms that take a caption file.
usage: python -X utf8 -I tools/make_srt.py"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


rows = []
for tn in TM["turns"]:
    rows.append([tn["send"], tn["words"][0], "User: " + " ".join(tn["user"].split())])
    k = 0
    for pi, para in enumerate(tn["reply"]):
        t0 = tn["words"][k]
        k += len(para)
        t1 = tn["words"][k] if k < len(tn["words"]) else tn["end"]
        text = " ".join("".join(seg[0] for seg in w) for w in para)
        rows.append([t0, t1, ("Assistant: " if pi == 0 else "") + text])
with open(os.path.join(ROOT, "out", KEY + ".srt"), "w", encoding="utf-8") as f:
    for i, (a, b, text) in enumerate(rows, 1):
        f.write(f"{i}\n{ts(a)} --> {ts(max(b, a + 0.5))}\n{text}\n\n")
print(len(rows), "cues")
