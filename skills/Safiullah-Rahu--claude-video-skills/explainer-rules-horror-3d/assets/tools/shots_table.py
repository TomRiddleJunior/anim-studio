"""Shot starts for "Level −4", mirrored from assets/lib/film-shots.js (each shot starts 0.06 s before a narration word).
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
    (1, None, None, 0, "one-point wide behind the hero (hook)"), (2, "l02", "you", 0, "down the ramp, backlit"),
    (3, "l02", "and", 0, "feet step onto −4"), (4, "l02", "the", 1, "shutter slams behind him"), (5, "l03", "level", 0, "LEVEL −4 stencil"),
    (6, "l03", "you're", 0, "high corner wide: alone"), (7, "l04", "and", 0, "push toward the booth"), (8, "l05", "you", 0, "phone comes up"),
    (9, "l05", "two", 0, "phone insert 2 %"), (10, "l06", "no", 0, "ECU annoyed"), (11, "l07", "the", 0, "lift call button"),
    (12, "l07", "the", 1, "barrier + board 06:00"), (13, "l08", "so", 0, "sits on the plinth"), (14, "l09", "but", 0, "3/4 close: head comes up"),
    (15, "l10", "a", 0, "dolly to the booth, onto the card, rule 1"), (17, "l12", "if", 0, "rule 1 tight -> torn edge"),
    (18, "l14", "you", 0, "smile through the glass, shrugs, walks off"), (20, "l15", "but", 0, "clock 23:59 -> 00:00"),
    (21, "l16", "the", 0, "far row turns red"), (22, "l17", "then", 0, "POV: rows switching"), (23, "l17", "one", 0, "frontal: red closing in"),
    (24, "l18", "and", 0, "floor level: the wet trail"), (25, "l19", "slow", 0, "frozen, orbit"), (26, "l20", "you", 0, "card again, rule circled"),
    (27, "l21", "the", 0, "high angle: red reaches his row"), (28, "l22", "and", 0, "two-shot: it is behind him"), (29, "l23", "something", 0, "drip on the shoulder"),
    (30, "l24", "then", 0, "long lens: shutter rises"), (31, "l25", "you", 0, "choice labels in scene"), (32, "l27", "or", 0, "his face, labels top"),
    (33, "l27", "with", 0, "the black head breathing"), (34, "l28", "so", 0, "final ECU, hold"),
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
