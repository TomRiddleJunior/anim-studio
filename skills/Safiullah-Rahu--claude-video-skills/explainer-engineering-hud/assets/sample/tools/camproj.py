"""Project named world points through a lookAt camera (three.js conventions), print 1080x1920 px coords.
python camproj.py "px,py,pz" "tx,ty,tz" fov [name=x,y,z ...]"""
import math
import sys

import numpy as np


def proj(pos, tgt, fov, pts, W=1080, H=1920):
    pos, tgt = np.array(pos, float), np.array(tgt, float)
    f = tgt - pos
    f /= np.linalg.norm(f)
    up = np.array([0, 1, 0.0])
    r = np.cross(f, up)
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    th = math.tan(math.radians(fov) / 2)
    asp = W / H
    out = {}
    for n, p in pts.items():
        d = np.array(p, float) - pos
        x, y, z = d @ r, d @ u, d @ f
        if z <= 0:
            out[n] = None
            continue
        sx = x / (z * th * asp)
        sy = y / (z * th)
        out[n] = (round((sx + 1) * W / 2), round((1 - sy) * H / 2), round(z, 1))
    return out


if __name__ == "__main__":
    pos = [float(v) for v in sys.argv[1].split(",")]
    tgt = [float(v) for v in sys.argv[2].split(",")]
    fov = float(sys.argv[3])
    pts = {}
    for a in sys.argv[4:]:
        n, v = a.split("=")
        pts[n] = [float(x) for x in v.split(",")]
    for n, v in proj(pos, tgt, fov, pts).items():
        flag = "" if v and 0 <= v[0] <= 1080 and 0 <= v[1] <= 1920 else "  <- OUT"
        print(f"{n:>10}: {v}{flag}")
