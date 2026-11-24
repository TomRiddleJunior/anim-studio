"""out/cover.jpg: a caption-free still (snapshot a copy of the project with window.SK_NO_CAPTIONS = true) plus a title.
usage: python -X utf8 -I tools/cover.py <still.png> ["TITLE"] ["subtitle"]"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
still = sys.argv[1]
T1 = sys.argv[2] if len(sys.argv) > 2 else "THE 101ST TURN"
T2 = sys.argv[3] if len(sys.argv) > 3 else ""
im = Image.open(still).convert("RGBA").resize((1080, 1920))
F = os.path.join(ROOT, "assets", "fonts", "Inter_opsz-wght_.ttf")
f1 = ImageFont.truetype(F, 84)
try:
    f1.set_variation_by_axes([32, 800])
except Exception:
    pass
f2 = ImageFont.truetype(F, 40)
try:
    f2.set_variation_by_axes([32, 600])
except Exception:
    pass
txt = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(txt)
d.text((540, 1500), T1, font=f1, fill=(243, 243, 243, 255), anchor="ms")
if T2:
    d.text((540, 1570), T2, font=f2, fill=(243, 183, 83, 255), anchor="ms")
sh = txt.split()[3].filter(ImageFilter.GaussianBlur(12))
shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); shadow.putalpha(sh.point(lambda v: int(v * 0.8)))
im = Image.alpha_composite(Image.alpha_composite(im, shadow), txt)
im.convert("RGB").save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print("out/cover.jpg")
