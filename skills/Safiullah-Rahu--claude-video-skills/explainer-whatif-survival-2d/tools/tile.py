"""Tile at-<t>s.png stills of a snapshot folder into one labelled sheet.  usage: python tile.py <dir> <out.jpg> [cols] [w]"""
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 300
th = int(tw * 16 / 9)
fs = [f for f in os.listdir(d) if re.fullmatch(r"at-[0-9.]+s\.png", f)]
fs.sort(key=lambda f: float(f[3:-5]))
if not fs:
    sys.exit("no stills")
rows = (len(fs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 4), rows * (th + 24)), (20, 20, 22))
dr = ImageDraw.Draw(sheet)
try:
    F = ImageFont.truetype("arialbd.ttf", 16)
except OSError:
    F = ImageFont.load_default()
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert("RGB").resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * (tw + 4), (i // cols) * (th + 24)
    sheet.paste(im, (x, y + 22))
    dr.text((x + 4, y + 2), f[3:-5] + " s", fill=(255, 220, 90), font=F)
sheet.save(out, quality=88)
print(out, len(fs), "stills")
