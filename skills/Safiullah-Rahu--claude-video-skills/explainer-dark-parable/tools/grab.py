"""Full-size grabs at given times + a labelled sheet: python -I grab.py <video> <out_prefix> <tile_w> <cols> t1 t2 ..."""
import os
import subprocess
import sys

from PIL import Image, ImageDraw

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
vid, pre, tw, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ts = [float(x) for x in sys.argv[5:]]
os.makedirs(os.path.dirname(pre) or ".", exist_ok=True)
ims = []
for t in ts:
    p = f"{pre}_{t:06.2f}.png"
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", vid, "-frames:v", "1", p], check=True)
    ims.append((t, Image.open(p).convert("RGB")))
w, h = ims[0][1].size
th = int(h * tw / w)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 20)), (40, 40, 40))
dr = ImageDraw.Draw(sheet)
for k, (t, im) in enumerate(ims):
    x, y = (k % cols) * tw, (k // cols) * (th + 20)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 20))
    dr.text((x + 4, y + 4), f"{t:.2f}s", fill=(255, 230, 80))
sheet.save(pre + "_sheet.jpg", quality=90)
print(pre + "_sheet.jpg")
