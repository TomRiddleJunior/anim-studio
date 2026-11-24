"""out/cover.jpg: a caption-free frame of the master (default t = 0.0, the hero still) with the series title.
usage: python -X utf8 -I tools/cover.py [t] [title line 1] [title line 2] [pill]"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
t = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
L1 = sys.argv[2] if len(sys.argv) > 2 else "SEVEN NIGHTS"
L2 = sys.argv[3] if len(sys.argv) > 3 else "AT THE WEATHER STATION"
PILL = sys.argv[4] if len(sys.argv) > 4 else "NIGHT 1 / 7"
src = os.path.join(ROOT, "out", NAME + "_master.mp4")
p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
im = Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(1920, 1080, 3)).convert("RGBA")
ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(ov)
for y in range(1150, 1920):  # darken the lower part for the title
    d.line([(0, y), (1080, y)], fill=(5, 8, 18, int(200 * min(1, (y - 1150) / 380))))
im = Image.alpha_composite(im, ov)
osw = os.path.join(ROOT, "assets", "fonts", "Oswald_wght_.ttf")
F1 = ImageFont.truetype(osw, 150); F1.set_variation_by_axes([700])
F2 = ImageFont.truetype(osw, 66); F2.set_variation_by_axes([600])
F3 = ImageFont.truetype(osw, 44); F3.set_variation_by_axes([600])
txt = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(txt)
d.text((540, 1395), L1, font=F1, fill=(255, 255, 255, 255), anchor="ms")
d.text((540, 1480), L2, font=F2, fill=(245, 181, 46, 255), anchor="ms")
w = d.textlength(PILL, font=F3) + 60
d.rounded_rectangle([540 - w / 2, 1530, 540 + w / 2, 1606], radius=38, fill=(239, 90, 74, 255))
d.text((540, 1584), PILL, font=F3, fill=(255, 255, 255, 255), anchor="ms")
sh = txt.split()[3].filter(ImageFilter.GaussianBlur(10))
shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); shadow.putalpha(sh.point(lambda v: int(v * 0.7)))
im = Image.alpha_composite(Image.alpha_composite(im, shadow), txt)
im.convert("RGB").save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print("out/cover.jpg")
