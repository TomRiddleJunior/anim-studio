"""Contact sheet from a folder of frames at a known fps: python -I sheet.py <dir> <fps> <out_prefix> [cols] [rows]"""
import os
import sys

from PIL import Image, ImageDraw

d, fps, pre = sys.argv[1], float(sys.argv[2]), sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 10
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 6
fs = sorted(f for f in os.listdir(d) if f.endswith(".jpg") or f.endswith(".png"))
im0 = Image.open(os.path.join(d, fs[0]))
w, h = im0.size
per = cols * rows
for p in range(0, len(fs), per):
    sheet = Image.new("RGB", (cols * w, rows * (h + 18)), (40, 40, 40))
    dr = ImageDraw.Draw(sheet)
    for k, f in enumerate(fs[p:p + per]):
        im = Image.open(os.path.join(d, f)).convert("RGB")
        x, y = (k % cols) * w, (k // cols) * (h + 18)
        sheet.paste(im, (x, y + 18))
        t = (p + k) / fps
        dr.text((x + 4, y + 3), f"{t:5.1f}s", fill=(255, 230, 80))
    sheet.save(f"{pre}_{p // per + 1:02d}.jpg", quality=86)
    print(f"{pre}_{p // per + 1:02d}.jpg")
