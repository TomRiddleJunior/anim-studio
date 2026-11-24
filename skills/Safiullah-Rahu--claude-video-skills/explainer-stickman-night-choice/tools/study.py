"""Frame-by-frame study of a reference reel (analysed locally for reference only).

Decodes the clip at --fps (default 10) into small greyscale/RGB frames and writes, into <out>:
  sweep_NN.jpg     labelled contact sheets at --sheet-fps (default 2) of the real frames
  diffs.json       per-frame mean absolute difference (full frame and per horizontal band), frame times
  cuts.txt         hard-cut candidates (full-frame diff spike over its neighbours) and soft changes
  bands.txt        change events per band (caption band, HUD band …) = when on-screen text appears/changes
usage: python -X utf8 -I study.py <clip.mp4> <out_dir> [--fps 10] [--sheet-fps 2] [--bands "cap:0.62:0.74,hud:0.03:0.17"]
ffmpeg comes from $FFMPEG or the PATH.
"""
import argparse
import json
import os
import shutil
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def ffmpeg():
    return os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"


def decode(path, fps, w, h):
    p = subprocess.run([ffmpeg(), "-v", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h}:flags=area", "-f", "rawvideo",
                        "-pix_fmt", "rgb24", "-"], capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip")
    ap.add_argument("out")
    ap.add_argument("--fps", type=float, default=10)
    ap.add_argument("--sheet-fps", type=float, default=2)
    ap.add_argument("--bands", default="cap:0.60:0.80,hud:0.02:0.18,mid:0.25:0.55")
    ap.add_argument("--cols", type=int, default=10)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    try:
        font = ImageFont.truetype("arialbd.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
    # analysis frames
    W, H = 108, 192
    fr = decode(a.clip, a.fps, W, H).astype(np.float32)
    g = fr.mean(axis=3)
    n = len(g)
    t = [round(i / a.fps, 3) for i in range(n)]
    full = [0.0] + [float(np.abs(g[i] - g[i - 1]).mean()) for i in range(1, n)]
    bands = {}
    for spec in a.bands.split(","):
        name, y0, y1 = spec.split(":")
        r0, r1 = int(float(y0) * H), int(float(y1) * H)
        bands[name] = [0.0] + [float(np.abs(g[i, r0:r1] - g[i - 1, r0:r1]).mean()) for i in range(1, n)]
    json.dump({"fps": a.fps, "t": t, "full": full, "bands": bands, "yavg": [float(x.mean()) for x in g]},
              open(os.path.join(a.out, "diffs.json"), "w"))
    # cuts: a spike that stands over the local median
    med = np.median(full)
    cuts, soft = [], []
    for i in range(1, n):
        lo, hi = max(1, i - 5), min(n, i + 6)
        loc = sorted(full[lo:hi])
        base = loc[len(loc) // 2]
        if full[i] > max(12, 3.0 * base + 4):
            cuts.append((t[i], round(full[i], 1)))
        elif full[i] > max(5, 2.0 * base + 2):
            soft.append((t[i], round(full[i], 1)))
    with open(os.path.join(a.out, "cuts.txt"), "w") as f:
        f.write(f"# {a.clip}\n# frames {n} at {a.fps} fps, median diff {med:.2f}\n# HARD (t, diff)\n")
        for c in cuts:
            f.write(f"{c[0]:8.2f}  {c[1]}\n")
        f.write("# SOFT (t, diff)\n")
        for c in soft:
            f.write(f"{c[0]:8.2f}  {c[1]}\n")
    with open(os.path.join(a.out, "bands.txt"), "w") as f:
        for name, d in bands.items():
            ev = [t[i] for i in range(1, n) if d[i] > 6 and d[i] > 2.5 * (d[i - 1] + 0.5)]
            f.write(f"{name}: {len(ev)} events\n  " + " ".join(f"{x:.1f}" for x in ev) + "\n")
    # contact sheets
    TW, TH = 216, 384
    sh = decode(a.clip, a.sheet_fps, TW, TH)
    per = a.cols * 5
    for k in range(0, len(sh), per):
        chunk = sh[k:k + per]
        rows = (len(chunk) + a.cols - 1) // a.cols
        im = Image.new("RGB", (a.cols * TW, rows * (TH + 18)), (16, 16, 18))
        d = ImageDraw.Draw(im)
        for i, f_ in enumerate(chunk):
            x, y = (i % a.cols) * TW, (i // a.cols) * (TH + 18)
            im.paste(Image.fromarray(f_), (x, y + 18))
            d.text((x + 3, y + 1), f"{(k + i) / a.sheet_fps:6.1f}s", fill=(255, 220, 80), font=font)
        im.save(os.path.join(a.out, f"sweep_{k // per + 1:02d}.jpg"), quality=86)
    print(f"{n} frames · {len(cuts)} hard · {len(soft)} soft · sheets {(len(sh) + per - 1) // per}")


if __name__ == "__main__":
    main()
