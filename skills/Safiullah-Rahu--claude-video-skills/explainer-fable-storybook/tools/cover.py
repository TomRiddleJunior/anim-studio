"""out/cover.jpg: a caption-free still (snapshot a copy of the project with window.FB_NO_CAPTIONS = true) + a title card.
usage: python -X utf8 -I tools/cover.py <still.png> ["TITLE"] ["subtitle"]"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
still = sys.argv[1]
T1 = sys.argv[2] if len(sys.argv) > 2 else "THE FOX AT THE DOOR"
T2 = sys.argv[3] if len(sys.argv) > 3 else "one small yes at a time"
im = Image.open(still).convert("RGBA").resize((1080, 1920))
F = os.path.join(ROOT, "assets", "fonts", "Nunito_wght_.ttf")


def font(px, wt):
    f = ImageFont.truetype(F, px)
    try:
        f.set_variation_by_axes([wt])
    except Exception:
        pass
    return f


f1, f2 = font(96, 900), font(48, 800)
px = 96
while px > 40 and f1.getlength(T1) > 960:          # fit the title to the frame
    px -= 4
    f1 = font(px, 900)
txt = Image.new("RGBA", im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(txt)
for dx, dy in [(-5, 0), (5, 0), (0, -5), (0, 5), (-4, -4), (4, 4), (-4, 4), (4, -4)]:
    d.text((540 + dx, 1440 + dy), T1, font=f1, fill=(34, 22, 44, 255), anchor="ms")
d.text((540, 1440), T1, font=f1, fill=(251, 243, 230, 255), anchor="ms")
for dx, dy in [(-4, 0), (4, 0), (0, -4), (0, 4)]:
    d.text((540 + dx, 1520 + dy), T2, font=f2, fill=(34, 22, 44, 255), anchor="ms")
d.text((540, 1520), T2, font=f2, fill=(242, 193, 78, 255), anchor="ms")
sh = txt.split()[3].filter(ImageFilter.GaussianBlur(10))
shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); shadow.putalpha(sh.point(lambda v: int(v * 0.6)))
im = Image.alpha_composite(Image.alpha_composite(im, shadow), txt)
im.convert("RGB").save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print("out/cover.jpg")
