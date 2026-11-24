"""Dense sweep sheets with timestamps.
usage: python sweep.py <mp4> <outdir> <fps> <t0> <t1> [cols] [tile_w] [prefix]
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FF = os.environ.get("FFMPEG", "ffmpeg")
mp4, out, fps, t0, t1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 8
tw = int(sys.argv[7]) if len(sys.argv) > 7 else 200
prefix = sys.argv[8] if len(sys.argv) > 8 else "sweep"
th = int(round(tw * 16 / 9))
os.makedirs(out, exist_ok=True)
p = subprocess.run([FF, "-v", "error", "-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", mp4, "-vf",
                    f"fps={fps},scale={tw}:{th}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, th, tw, 3)
try:
    F = ImageFont.truetype("arialbd.ttf", 13)
except OSError:
    F = ImageFont.load_default()
per = cols * 4
for s in range(0, len(fr), per):
    chunk = fr[s:s + per]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 16)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        x, y = (i % cols) * tw, (i // cols) * (th + 16)
        sheet.paste(Image.fromarray(f), (x, y + 16))
        d.text((x + 3, y + 1), f"{t0 + (s + i) / fps:.2f}s", fill=(255, 230, 80), font=F)
    sheet.save(os.path.join(out, f"{prefix}_{s // per:02d}.jpg"), quality=85)
print(len(fr), "frames")
