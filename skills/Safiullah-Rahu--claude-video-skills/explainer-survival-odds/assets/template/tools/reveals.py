"""List the reveals (cuts, tags, chips, panel lines, clock rolls, card, checks, end cards + story events given on the
command line as name=time) and the longest gap between them. usage: python -I tools/reveals.py [name=t ...]"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
ev = [(v, "cut " + k) for k, v in TM["T"].items()]
ev += [(c["t"], c["type"] + (" " + c.get("col", "") if c.get("col") else "")) for c in TM["cues"]]
for a in sys.argv[1:]:
    k, v = a.split("=")
    ev.append((float(v), k))
ev = sorted(ev)
ev = [e for e in ev if e[0] < TM["dur"] - 0.5]
gaps = sorted(((ev[i + 1][0] - ev[i][0], ev[i][0], ev[i + 1][0], ev[i][1], ev[i + 1][1]) for i in range(len(ev) - 1)), reverse=True)
print("events", len(ev))
for g in gaps[:5]:
    print(f"gap {g[0]:.2f}s  {g[1]:.2f} ({g[3]}) -> {g[2]:.2f} ({g[4]})")
print(" ".join(f"{t:.1f} {n}" for t, n in ev))
