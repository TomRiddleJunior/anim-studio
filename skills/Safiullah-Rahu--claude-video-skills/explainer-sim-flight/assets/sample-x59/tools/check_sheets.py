"""Shot check: every frame at N fps of a video (or a folder of frames) in timestamped contact sheets, for looking for
occluders, empty frames, cropped aircraft and cameras inside terrain.

usage: python -I tools/check_sheets.py <video.mp4 | frames_dir> <out_prefix> [fps=2] [cols=10] [rows=4] [t0] [t1]
"""
import glob
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
src, prefix = sys.argv[1], sys.argv[2]
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 2
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 10
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 4
t0 = float(sys.argv[6]) if len(sys.argv) > 6 else 0
t1 = float(sys.argv[7]) if len(sys.argv) > 7 else 1e9
tw, th = 180, 320
frames = []
if os.path.isdir(src):
    files = sorted(glob.glob(os.path.join(src, "*.jpg")))
    for i, f in enumerate(files):
        t = i / fps
        if t0 <= t <= t1:
            frames.append((t, Image.open(f).convert("RGB").resize((tw, th), Image.BOX)))
else:
    p = subprocess.run([FF, "-v", "error", "-ss", str(t0), "-i", src, "-t", str(min(t1, 1e5) - t0), "-vf", f"fps={fps},scale={tw}:{th}",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    a = np.frombuffer(p.stdout, np.uint8).reshape(-1, th, tw, 3)
    frames = [(t0 + i / fps, Image.fromarray(x)) for i, x in enumerate(a)]
per = cols * rows
for s in range(0, len(frames), per):
    chunk = frames[s:s + per]
    sheet = Image.new("RGB", (cols * tw, rows * (th + 14)), (0, 0, 0))
    d = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(chunk):
        x, y = (i % cols) * tw, (i // cols) * (th + 14)
        sheet.paste(im, (x, y + 14))
        d.text((x + 2, y + 1), f"{t:.1f}s", fill=(255, 255, 0))
    out = f"{prefix}_{s // per + 1:02d}.jpg"
    sheet.save(out, quality=85)
    print(out)
