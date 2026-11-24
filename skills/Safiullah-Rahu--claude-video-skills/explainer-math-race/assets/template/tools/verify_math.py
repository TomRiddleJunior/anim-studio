"""Check the race's maths before rendering: find every crossing of f1 and f2 on [xStart, xEnd] by a sign scan and
bisection, check that each is a real crossing (the lead changes) and not a tangency, check the leader at the start,
and compare with the crossings written in assets/lib/race.js. Mirror race.js's f1/f2 here (Python syntax).

usage: python -I tools/verify_math.py     -> prints a report, writes scratch/math_check.json, exits 1 on a mismatch
"""
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F1 = lambda x: 2.0 ** x          # noqa: E731  (race.js f1)
F2 = lambda x: x * x             # noqa: E731  (race.js f2)


def main():
    js = open(os.path.join(ROOT, "assets", "lib", "race.js"), encoding="utf-8").read()
    x0 = float(re.search(r"xStart:\s*(-?[\d.]+)", js).group(1))
    x1 = float(re.search(r"xEnd:\s*(-?[\d.]+)", js).group(1))
    first = int(re.search(r"firstLead:\s*(\d)", js).group(1))
    claimed = [float(v) for v in re.findall(r"\{\s*x:\s*(-?[\d.]+)", js.split("crossings:")[1])]
    g = lambda x: F1(x) - F2(x)  # noqa: E731
    roots, n = [], 200000
    xs = [x0 + (x1 - x0) * i / n for i in range(n + 1)]
    for a, b in zip(xs, xs[1:]):
        if g(a) == 0 or g(a) * g(b) < 0:
            lo, hi = a, b
            for _ in range(200):
                m = (lo + hi) / 2
                if g(lo) * g(m) <= 0:
                    hi = m
                else:
                    lo = m
            r = (lo + hi) / 2
            if not roots or abs(r - roots[-1]) > 1e-9:
                roots.append(r)
    rep = {"interval": [x0, x1], "roots": roots, "claimed": claimed, "checks": []}
    ok = len(roots) == len(claimed) and all(abs(a - b) < 1e-9 for a, b in zip(roots, claimed))
    for r in roots:
        d = (g(r + 1e-6) - g(r - 1e-6)) / 2e-6
        sides = (math.copysign(1, g(r - 1e-4)), math.copysign(1, g(r + 1e-4)))
        rep["checks"].append({"x": r, "f1": F1(r), "f2": F2(r), "slope_of_difference": d, "lead_changes": sides[0] != sides[1]})
        ok = ok and sides[0] != sides[1]
    lead_at_start = 1 if F1(x0) > F2(x0) else 2
    rep["leader_at_start"] = lead_at_start
    ok = ok and lead_at_start == first
    rep["ok"] = ok
    os.makedirs(os.path.join(ROOT, "scratch"), exist_ok=True)
    json.dump(rep, open(os.path.join(ROOT, "scratch", "math_check.json"), "w"), indent=1)
    print(json.dumps(rep, indent=1))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
