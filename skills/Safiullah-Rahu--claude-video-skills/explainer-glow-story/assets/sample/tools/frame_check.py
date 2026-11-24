"""Framing QA on mask renders: every object drawn white on black (glow-kit mask mode), captions hidden. Checks
  1. the caption band (centre y 1262 px +- 40) never has object pixels under the caption line (x 130-950), at any frame;
  2. on held frames (inside a hold() key pair, 0.15 s after it starts), no object touches any frame edge; transit
     frames that touch an edge are listed (an object scaling out or popping in).

usage:
  python -I tools/build.py --mask            # index.html in mask mode (window.GLOW_MASK, captions hidden)
  npx hyperframes snapshot -o scratch/mask --at <every 0.25 s> --no-end
  python -I tools/frame_check.py scratch/mask   # prints offending times, writes out/qa/frame_check.json
  python -I tools/build.py                   # back to the normal index.html
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAND = (1222, 1302)
BAND_X = (130, 950)
EDGE = 4


def holds():
    src = open(os.path.join(ROOT, "assets", "lib", "film.js"), encoding="utf-8").read()
    return [(float(a), float(b)) for a, b in re.findall(r"hold\(A\w+, ([0-9.]+), ([0-9.]+),", src)]


def main():
    d = sys.argv[1]
    H = holds()
    rows = []
    for f in sorted(os.listdir(d)):
        m = re.search(r"at-([0-9.]+)s\.png$", f)
        if not m:
            continue
        t = float(m.group(1))
        a = np.asarray(Image.open(os.path.join(d, f)).convert("L"))
        band = int((a[BAND[0]:BAND[1], BAND_X[0]:BAND_X[1]] > 24).sum())
        band_full = int((a[BAND[0]:BAND[1], :] > 24).sum())
        left = int((a[:, :EDGE] > 24).sum())
        right = int((a[:, -EDGE:] > 24).sum())
        top = int((a[:EDGE, :] > 24).sum())
        bottom = int((a[-EDGE:, :] > 24).sum())
        held = any(t0 + 0.15 <= t <= t1 for t0, t1 in H)
        rows.append({"t": t, "band": band, "band_full_width": band_full, "edge_left": left, "edge_right": right,
                     "edge_top": top, "edge_bottom": bottom, "held": held})
    edge = lambda r: r["edge_left"] or r["edge_right"] or r["edge_top"] or r["edge_bottom"]
    bad_band = [r for r in rows if r["band"] > 0]
    bad_edge = [r for r in rows if r["held"] and edge(r)]
    out = {"frames": len(rows), "caption_band_hits": bad_band, "held_edge_hits": bad_edge,
           "transit_edge_frames": [r["t"] for r in rows if not r["held"] and edge(r)]}
    os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, "out", "qa", "frame_check.json"), "w"), indent=1)
    print(f"{len(rows)} mask frames · caption-band hits {len(bad_band)} · held frames touching an edge {len(bad_edge)} · "
          f"transit frames touching an edge {len(out['transit_edge_frames'])} {out['transit_edge_frames']}")
    for r in bad_band:
        print(f"  BAND  {r['t']:6.2f}s  {r['band']} px")
    for r in bad_edge:
        print(f"  EDGE  {r['t']:6.2f}s  left {r['edge_left']} right {r['edge_right']} top {r['edge_top']} bottom {r['edge_bottom']}")


if __name__ == "__main__":
    main()
