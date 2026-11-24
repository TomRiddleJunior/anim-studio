"""Labelled contact sheet of a snapshot folder: python -X utf8 -I tools/sheet.py <dir> [cols] [tile_w]"""
import glob, os, re, sys
from PIL import Image, ImageDraw, ImageFont


def _font(n):
    try:
        return ImageFont.truetype("arialbd.ttf", n)
    except OSError:
        return ImageFont.load_default()
d = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 10; tw = int(sys.argv[3]) if len(sys.argv) > 3 else 216
fs = sorted(glob.glob(os.path.join(d, "frame-*.png")))
im0 = Image.open(fs[0]); th = round(tw * im0.size[1] / im0.size[0])
rows = (len(fs) + cols - 1) // cols
S = Image.new("RGB", (cols * tw, rows * th), (16, 16, 16)); dr = ImageDraw.Draw(S)
f = _font(15)
for i, p in enumerate(fs):
    im = Image.open(p).convert("RGB").resize((tw, th), Image.BILINEAR)
    S.paste(im, ((i % cols) * tw, (i // cols) * th))
    m = re.search(r"frame-(\d+)-at-([\d.]+)s", p)
    dr.rectangle([(i % cols) * tw, (i // cols) * th, (i % cols) * tw + 92, (i // cols) * th + 18], fill=(0, 0, 0))
    dr.text(((i % cols) * tw + 3, (i // cols) * th + 1), f"{int(m.group(1))} {float(m.group(2)):.1f}s", font=f, fill=(255, 230, 0))
S.save(os.path.join(d, "sheet.jpg"), quality=88); print(os.path.join(d, "sheet.jpg"), S.size)
