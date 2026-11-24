"""The QA's look numbers (analyze_video.look_stats: 480x270 area scale, brightness = mean of max(R,G,B)/255, Hasler-
Suesstrunk colourfulness) on snapshot PNGs, so the grade can be matched to the source before any full render.

usage: python -I tools/look_metrics.py <png or dir> [...]
"""
import os
import sys

import numpy as np
from PIL import Image


def stats(path):
    a = np.asarray(Image.open(path).convert("RGB").resize((480, 270), Image.BOX)).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    rg, yb = r - g, 0.5 * (r + g) - b
    colf = float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))
    return float(a.max(axis=2).mean() / 255), colf


def main():
    files = []
    for p in sys.argv[1:]:
        files += sorted(os.path.join(p, f) for f in os.listdir(p) if f.endswith(".png")) if os.path.isdir(p) else [p]
    bs, cs = [], []
    for f in files:
        b, c = stats(f)
        bs.append(b); cs.append(c)
        print(f"{os.path.basename(f):28s} bright {b:.3f}  colour {c:5.1f}")
    if files:
        print(f"MEAN bright {np.mean(bs):.3f} (source 0.155)  colour {np.mean(cs):.1f} (source 12.0)")


if __name__ == "__main__":
    main()
