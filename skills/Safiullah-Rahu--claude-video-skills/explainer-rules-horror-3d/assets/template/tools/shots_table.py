"""Shot starts for the template film, mirrored from assets/lib/film-shots.js (each shot starts 0.06 s before a narration word).
Used by the QA tools (snapshot times, compare.jpg, sound cues).   python -I tools/shots_table.py  -> prints the table
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
LINES = {l["id"]: l for l in VO["lines"]}
DUR = VO["duration"]

# (shot, line, word, k, label)
SHOTS = [
    (1, None, None, 0, "one-point wide behind the lone figure (hook)"), (2, "l02", "at", 0, "clock 23:59 -> 00:00"),
    (3, "l02", "the", 0, "POV: the far row turns red"), (4, "l03", "then", 0, "frontal: red closing in"),
    (5, "l04", "you", 0, "choice labels in scene"), (6, "l04", "so", 0, "final ECU, labels top"),
]


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower())


def word_t(line, word, k=0, end=False):
    hits = [w for w in LINES[line]["words"] if norm(w["w"]).startswith(norm(word))]
    h = hits[min(k, len(hits) - 1)]
    return h["end"] if end else h["start"]


def starts():
    out = []
    for n, line, word, k, lab in SHOTS:
        t0 = 0.0 if line is None else word_t(line, word, k) - 0.06
        out.append((n, round(t0, 3), lab))
    return out


def table():
    st = starts()
    rows = []
    for i, (n, t0, lab) in enumerate(st):
        t1 = st[i + 1][1] if i + 1 < len(st) else DUR
        rows.append({"shot": n, "t0": t0, "t1": round(t1, 3), "mid": round((t0 + t1) / 2, 2), "label": lab})
    return rows


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    for r in table():
        print(f"S{r['shot']:02d} {r['t0']:6.2f}-{r['t1']:6.2f} ({r['t1'] - r['t0']:4.2f}s)  {r['label']}")
