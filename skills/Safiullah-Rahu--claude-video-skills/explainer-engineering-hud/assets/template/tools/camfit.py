"""Random-search a lookAt camera so named world points land near wanted screen spots (1080x1920).
spec json: {"want": {"name": [x,y,z, sx, sy]}, "visible": {"name": [x,y,z]}, "fov": [30, 44], "dist": [40, 140],
            "elev": [20, 65], "azim": [0, 360], "tgt": [[x0,x1],[y0,y1],[z0,z1]]}
python camfit.py spec.json"""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camproj import proj  # noqa: E402

spec = json.load(open(sys.argv[1]))
rng = np.random.default_rng(3)
best = None


def score(pos, tgt, fov):
    pts = {k: v[:3] for k, v in spec["want"].items()}
    pts.update(spec.get("visible", {}))
    pr = proj(pos, tgt, fov, pts)
    s = 0.0
    for k, v in spec["want"].items():
        p = pr[k]
        if p is None:
            return 1e12
        s += (p[0] - v[3]) ** 2 + (p[1] - v[4]) ** 2
    for k in spec.get("visible", {}):
        p = pr[k]
        if p is None:
            return 1e12
        ox = max(0, 40 - p[0], p[0] - 1040)
        oy = max(0, 230 - p[1], p[1] - 1880)
        s += 25 * (ox * ox + oy * oy)
    return s


for it in range(60000):
    fov = rng.uniform(*spec.get("fov", [30, 44]))
    d = rng.uniform(*spec.get("dist", [40, 140]))
    el = math.radians(rng.uniform(*spec.get("elev", [20, 65])))
    az = math.radians(rng.uniform(*spec.get("azim", [0, 360])))
    tg = [rng.uniform(*r) for r in spec["tgt"]]
    pos = [tg[0] + d * math.cos(el) * math.cos(az), tg[1] + d * math.sin(el), tg[2] + d * math.cos(el) * math.sin(az)]
    s = score(pos, tg, fov)
    if best is None or s < best[0]:
        best = (s, pos, tg, fov)
s, pos, tg, fov = best
print("score", round(math.sqrt(s / max(1, len(spec["want"])))), "pos", [round(v, 1) for v in pos], "tgt", [round(v, 1) for v in tg], "fov", round(fov, 1))
pts = {k: v[:3] for k, v in spec["want"].items()}
pts.update(spec.get("visible", {}))
for k, v in proj(pos, tg, fov, pts).items():
    w = spec["want"].get(k)
    print(f"  {k:>8}: {v}" + (f"  want ({w[3]},{w[4]})" if w else ""))
