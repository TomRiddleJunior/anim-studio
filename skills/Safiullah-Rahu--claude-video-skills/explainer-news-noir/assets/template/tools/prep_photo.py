"""Black-and-white prep for a licensed news photo (do this offline, not with CSS filters).
usage: python -X utf8 -I tools/prep_photo.py <in.jpg> <out.jpg> [x0 y0 w h] [--vertical]
  x0 y0 w h   crop box in source pixels (optional)
  --vertical  crop the largest centred 9:16 box (after the optional crop) and resize to 1080x1920
Greyscale, contrast x1.12. Record the author and licence in FACTS.md and draw the credit line on screen.
"""
import sys

from PIL import Image, ImageEnhance, ImageOps

a = [x for x in sys.argv[1:] if not x.startswith("--")]
src, dst = a[0], a[1]
im = Image.open(src).convert("RGB")
if len(a) >= 6:
    x0, y0, w, h = map(int, a[2:6])
    im = im.crop((x0, y0, x0 + w, y0 + h))
if "--vertical" in sys.argv:
    W, H = im.size
    cw = min(W, int(H * 9 / 16))
    ch = int(cw * 16 / 9)
    im = im.crop(((W - cw) // 2, (H - ch) // 2, (W - cw) // 2 + cw, (H - ch) // 2 + ch)).resize((1080, 1920), Image.LANCZOS)
g = ImageEnhance.Contrast(ImageOps.grayscale(im)).enhance(1.12)
g.save(dst, quality=90)
print(dst, g.size)
