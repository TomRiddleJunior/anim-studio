"""Estimate QA metrics (motion mean, colourfulness, saturation, brightness, scene changes) from 6 fps frames, with the
same formulas as engine/qa/analyze_video.py. usage: estimate.py <frames_dir | video.mp4>"""
import glob
import os
import subprocess
import sys

import numpy as np
from PIL import Image

FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
src = sys.argv[1]
if os.path.isdir(src):
    files = sorted(glob.glob(os.path.join(src, "f_*.jpg")))
    frames = [np.asarray(Image.open(f).convert("RGB")) for f in files]
else:
    p = subprocess.run([FF, "-v", "error", "-i", src, "-vf", "fps=6,scale=540:960", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    frames = list(np.frombuffer(p.stdout, np.uint8).reshape(-1, 960, 540, 3))
fps = 6
diffs, hists, prev = [], [], None
cf, sat, val = [], [], []
for i, f in enumerate(frames):
    sm = np.asarray(Image.fromarray(f).resize((160, 90), Image.BOX)).astype(np.int16)
    g = (sm[..., 0] * 0.299 + sm[..., 1] * 0.587 + sm[..., 2] * 0.114).astype(np.int16)
    diffs.append(0.0 if prev is None else float(np.abs(g - prev).mean()))
    prev = g
    q = (sm.astype(np.uint8) >> 6).astype(np.int32)
    hists.append(np.bincount((q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]).ravel(), minlength=64) / q[..., 0].size)
    if i % fps == 0:
        a = np.asarray(Image.fromarray(f).resize((480, 270), Image.BOX)).astype(np.int16)
        r, gg, b = a[..., 0], a[..., 1], a[..., 2]
        rg, yb = r - gg, 0.5 * (r + gg) - b
        cf.append(float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)))
        mx, mn = a.max(axis=2), a.min(axis=2)
        sat.append(float(((mx - mn) / np.maximum(mx, 1)).mean()))
        val.append(float(mx.mean() / 255))
hists = np.array(hists)
d = 0.5 * np.abs(hists[fps:] - hists[:-fps]).sum(axis=1)
ev, last = [], -9.0
for i in range(1, len(d) - 1):
    t = (i + fps / 2) / fps
    if d[i] >= 0.28 and d[i] >= d[i - 1] and d[i] >= d[i + 1] and t - last >= 1.5:
        ev.append(t); last = t
dur = len(frames) / fps
lens = np.diff([0] + ev + [dur])
print(f"frames {len(frames)} dur {dur:.1f}s  motion_mean {np.mean(diffs):.2f}  p90 {np.percentile(diffs, 90):.2f}  colourfulness {np.mean(cf):.1f}  "
      f"saturation {np.mean(sat):.3f}  brightness {np.mean(val):.3f}  scene_changes/min {len(ev) / dur * 60:.1f}  scene_len_median {np.median(lens):.2f}")
print("per-10s brightness:", [round(float(np.mean(val[i:i + 10])), 2) for i in range(0, len(val), 10)])
print("per-10s colourf:", [round(float(np.mean(cf[i:i + 10])), 1) for i in range(0, len(cf), 10)])
print("per-10s motion:", [round(float(np.mean(diffs[i:i + 60])), 1) for i in range(0, len(diffs), 60)])
