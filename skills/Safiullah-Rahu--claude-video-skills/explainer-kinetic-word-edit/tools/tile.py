"""Tile extracted frames into a timestamped sheet.
usage: python tile.py <frames_dir> <src_fps> <t0> <t1> <step_s> <cols> <tile_px> <out.jpg>"""
import os
import sys

from PIL import Image, ImageDraw

d, fps, t0, t1, step, cols, px, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), \
    float(sys.argv[5]), int(sys.argv[6]), int(sys.argv[7]), sys.argv[8]
files = sorted(f for f in os.listdir(d) if f.endswith(".jpg"))
ts = []
t = t0
while t <= t1 + 1e-6:
    ts.append(t)
    t += step
ims = []
for t in ts:
    i = int(round(t * fps))
    if i >= len(files):
        break
    im = Image.open(os.path.join(d, files[i])).convert("RGB")
    w, h = im.size
    im = im.resize((px, int(px * h / w)))
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, 52, 14], fill=(0, 0, 0))
    dr.text((2, 1), f"{t:6.2f}", fill=(255, 255, 0))
    ims.append(im)
rows = (len(ims) + cols - 1) // cols
th = ims[0].size[1]
sheet = Image.new("RGB", (cols * px, rows * th), (40, 40, 40))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * px, (k // cols) * th))
sheet.save(out, quality=88)
print(out, len(ims))
