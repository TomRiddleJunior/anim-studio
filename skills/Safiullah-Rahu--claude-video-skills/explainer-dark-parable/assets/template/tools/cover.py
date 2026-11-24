"""out/cover.jpg for a dark-parable reel: a caption-free frame of the delivered mp4 (default t = 0.1 s, before the first word)
plus the title in the film's caption face, the bottom 20 % kept clear for the app UI.
usage: python -I tools/cover.py "LEARNED HELPLESSNESS" "explained in 90 seconds" [t]"""
import os
import subprocess
import sys
from io import BytesIO

from PIL import Image, ImageDraw, ImageFilter, ImageFont

p = __file__
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
title, sub = sys.argv[1], sys.argv[2]
arg = sys.argv[3] if len(sys.argv) > 3 else None
t = float(arg) if arg and not arg.endswith('.png') else (0.1 if 'parable' in p else 0.0)
if arg and arg.endswith('.png'):
    im = Image.open(arg).convert('RGB').resize((1080, 1920))
else:
    r = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", os.path.join(ROOT, "out", KEY + ".mp4"), "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    im = Image.open(BytesIO(r.stdout)).convert("RGB").resize((1080, 1920))
font = os.path.join(ROOT, "assets", "fonts", "Inter_opsz-wght_.ttf")


def f(sz, wght):
    x = ImageFont.truetype(font, sz)
    try:
        x.set_variation_by_axes([32, wght])
    except Exception:
        pass
    return x


d = ImageDraw.Draw(im)
ft, fs = f(92, 800), f(46, 500)
words = title.split()
lines, cur = [], ""
for w_ in words:  # wrap to <= 900 px
    test = (cur + " " + w_).strip()
    if d.textlength(test, font=ft) > 900 and cur:
        lines.append(cur); cur = w_
    else:
        cur = test
lines.append(cur)
y = 230
glow = Image.new("RGBA", im.size, (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for ln in lines:
    w = d.textlength(ln, font=ft)
    gd.text(((1080 - w) / 2, y), ln, font=ft, fill=(242, 182, 48, 160))
    y += 108
glow = glow.filter(ImageFilter.GaussianBlur(14))
im = Image.alpha_composite(im.convert("RGBA"), glow).convert("RGB")
d = ImageDraw.Draw(im)
y = 230
for ln in lines:
    w = d.textlength(ln, font=ft)
    d.text(((1080 - w) / 2, y), ln, font=ft, fill=(243, 241, 236))
    y += 108
d.line([(390, y + 18), (690, y + 18)], fill=(242, 182, 48), width=5)
w = d.textlength(sub, font=fs)
d.text(((1080 - w) / 2, y + 44), sub, font=fs, fill=(170, 165, 156))
im.save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print(os.path.join(ROOT, "out", "cover.jpg"))
