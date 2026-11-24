"""Filmstrips around given times: for each centre t, frames from t-a to t+b at `fps`, one row per centre.
usage: python strip.py <video> <out.jpg> <fps> <a> <b> <w> t1 t2 ..."""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
src, out, fps, a, b, w = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
ts = [float(x) for x in sys.argv[7:]]
h = int(w * 16 / 9)
F = ImageFont.truetype("arial.ttf", 13)
rows = []
for t in ts:
    s = max(0, t - a)
    p = subprocess.run([FF, "-v", "error", "-ss", f"{s:.3f}", "-i", src, "-t", f"{a + b:.3f}", "-vf", f"fps={fps},scale={w}:{h}:flags=area",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w, 3)
    rows.append((s, fr))
n = max(len(r[1]) for r in rows)
im = Image.new("RGB", (n * (w + 2), len(rows) * (h + 16)), (20, 20, 22))
d = ImageDraw.Draw(im)
for i, (s, fr) in enumerate(rows):
    for j, f in enumerate(fr):
        im.paste(Image.fromarray(f), (j * (w + 2), i * (h + 16) + 16))
        d.text((j * (w + 2) + 2, i * (h + 16) + 1), f"{s + j / fps:.2f}", fill=(255, 220, 90), font=F)
im.save(out, quality=88)
print(out, im.size)
