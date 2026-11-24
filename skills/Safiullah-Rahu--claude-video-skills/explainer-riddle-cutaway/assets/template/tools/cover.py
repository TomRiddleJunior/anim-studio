"""out/cover.jpg for a riddle-cutaway reel: a pill-free frame of the delivered mp4 (default t = 0.0 s, before the first pill)
plus the question as a big navy pill and an amber sub-pill in the film's slab serif; the bottom 20 % kept clear.
usage: python -I tools/cover.py "Why does he call 306?" "Can you solve it?" [t | frame.png] [title_y sub_y]"""
import os
import subprocess
import sys
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

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
slab = os.path.join(ROOT, "assets", "fonts", "RobotoSlab_wght_.ttf")  # Roboto Slab (OFL), not shipped: assets/fonts/README.md
d = ImageDraw.Draw(im)


def slab_font(size):
    f = ImageFont.truetype(slab, size)
    try:
        f.set_variation_by_axes([700])  # the bold instance of the variable font
    except (OSError, AttributeError, ValueError):
        pass
    return f


def pill(txt, cy, size, col, bg=(31, 38, 51)):
    f = slab_font(size)
    w = d.textlength(txt, font=f)
    while w + size * 1.1 > 1000 and size > 30:  # shrink long titles so the pill keeps a 40 px margin
        size -= 2
        f = slab_font(size)
        w = d.textlength(txt, font=f)
    h = size * 1.55
    d.rounded_rectangle([(1080 - w) / 2 - size * 0.55, cy - h / 2, (1080 + w) / 2 + size * 0.55, cy + h / 2], radius=int(h * 0.22), fill=bg)
    d.text(((1080 - w) / 2, cy - size * 0.58), txt, font=f, fill=col)


COVER_Y = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (560, 700)  # keep the key prop clear
pill(title, COVER_Y[0], 74, (251, 248, 241))
pill(sub, COVER_Y[1], 48, (232, 165, 58))
im.save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print(os.path.join(ROOT, "out", "cover.jpg"))
