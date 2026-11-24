"""Grab full-size frames of a source at given times and tile them 4-up with a time label.
usage: python -X utf8 -I grab.py <video> <out_prefix> <scale_w> t1 t2 ...  (tiles of 4)"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
src, pref, sw = sys.argv[1], sys.argv[2], int(sys.argv[3])
ts = [float(x) for x in sys.argv[4:]]
sh = int(sw * 16 / 9)
try:
    F = ImageFont.truetype("arialbd.ttf", 22)
except OSError:
    F = ImageFont.load_default()


def grab(t):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-vf", f"scale={sw}:{sh}:flags=lanczos",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(sh, sw, 3))


for k in range(0, len(ts), 4):
    chunk = ts[k:k + 4]
    im = Image.new("RGB", (len(chunk) * (sw + 6), sh + 30), (25, 25, 28))
    d = ImageDraw.Draw(im)
    for i, t in enumerate(chunk):
        im.paste(grab(t), (i * (sw + 6), 30))
        d.text((i * (sw + 6) + 6, 4), f"{t:.2f}s", fill=(255, 220, 90), font=F)
    im.save(f"{pref}_{k // 4 + 1:02d}.jpg", quality=90)
    print(f"{pref}_{k // 4 + 1:02d}.jpg", chunk)
