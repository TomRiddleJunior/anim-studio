"""out/cover.jpg: a frame of the render master with the series title on a dark lower band.
usage: python -X utf8 -I tools/cover.py <t> "<LINE 1>" "<LINE 2>" "<PILL>" [font.ttf]     (ffmpeg from $FFMPEG or PATH)"""
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
t = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
L1 = sys.argv[2] if len(sys.argv) > 2 else NAME.upper()
L2 = sys.argv[3] if len(sys.argv) > 3 else ""
PILL = sys.argv[4] if len(sys.argv) > 4 else ""
FONT = sys.argv[5] if len(sys.argv) > 5 else os.path.join(ROOT, "assets", "fonts", "Poppins-ExtraBold.ttf")
src = os.path.join(ROOT, "out", NAME + "_master.mp4")
p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
im = Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(1920, 1080, 3)).convert("RGBA")
ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(ov)
for y in range(1180, 1920):
    d.line([(0, y), (1080, y)], fill=(8, 6, 4, int(215 * min(1, (y - 1180) / 300))))
im = Image.alpha_composite(im, ov)
F1 = ImageFont.truetype(FONT, 118)
F2 = ImageFont.truetype(FONT, 60)
F3 = ImageFont.truetype(FONT, 42)
for f_ in (F1, F2, F3):  # variable fonts open at their lightest instance: ask for the heavy one
    try:
        f_.set_variation_by_axes([850])
    except Exception:
        pass
txt = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(txt)
d.text((540, 1430), L1, font=F1, fill=(251, 248, 240, 255), anchor="ms", stroke_width=10, stroke_fill=(43, 36, 32, 255))
if L2:
    d.text((540, 1520), L2, font=F2, fill=(244, 196, 48, 255), anchor="ms", stroke_width=7, stroke_fill=(43, 36, 32, 255))
if PILL:
    w = d.textlength(PILL, font=F3) + 70
    d.rounded_rectangle([540 - w / 2, 1570, 540 + w / 2, 1650], radius=16, fill=(217, 58, 51, 255), outline=(43, 36, 32, 255), width=5)
    d.text((540, 1625), PILL, font=F3, fill=(255, 255, 255, 255), anchor="ms")
sh = txt.split()[3].filter(ImageFilter.GaussianBlur(10))
shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); shadow.putalpha(sh.point(lambda v: int(v * 0.6)))
im = Image.alpha_composite(Image.alpha_composite(im, shadow), txt)
im.convert("RGB").save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print("out/cover.jpg")
