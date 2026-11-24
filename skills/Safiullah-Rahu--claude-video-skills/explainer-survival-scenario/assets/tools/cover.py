"""out/cover.jpg: a clean world-only frame (hyperframes snapshot --composition world) + the series title, bottom 20 % clear.
usage: python -I tools/cover.py <world_frame.png> "THE VAULT" ["She has a plan. Can you spot the flaw?"]"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSW = os.path.join(ROOT, "assets", "fonts", "Oswald_wght_.ttf")
src, title = sys.argv[1], sys.argv[2]
line = sys.argv[3] if len(sys.argv) > 3 else "She has a plan. Can you spot the flaw?"


def font(sz, wght=700):
    f = ImageFont.truetype(OSW, sz)
    try:
        f.set_variation_by_axes([wght])
    except Exception:
        pass
    return f


bg = Image.open(src).convert("RGB").resize((1080, 1920), Image.LANCZOS)
top = Image.new("L", (1080, 1920), 0)
td = ImageDraw.Draw(top)
for yy in range(0, 700):
    td.line([(0, yy), (1080, yy)], fill=int(170 * (1 - yy / 700) ** 1.6))
bg = Image.composite(Image.new("RGB", (1080, 1920), (4, 6, 14)), bg, top)
c = ImageDraw.Draw(bg)


def centred(txt, y, f, fill, spacing=0):
    w = sum(c.textlength(ch, font=f) for ch in txt) + spacing * (len(txt) - 1)
    x = (1080 - w) / 2
    for ch in txt:
        c.text((x + 2, y + 2), ch, font=f, fill=(0, 0, 0))
        c.text((x, y), ch, font=f, fill=fill)
        x += c.textlength(ch, font=f) + spacing


centred(title, 200, font(64, 600), (255, 255, 255), spacing=12)
glow = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
f2 = font(250, 700)
w2 = gd.textlength("DAY 1", font=f2)
gd.text(((1080 - w2) / 2, 260), "DAY 1", font=f2, fill=(255, 74, 53, 255))
halo = glow.filter(ImageFilter.GaussianBlur(26))
bg = Image.alpha_composite(Image.alpha_composite(bg.convert("RGBA"), halo), glow).convert("RGB")
c = ImageDraw.Draw(bg)
f3 = font(54, 600)
w3 = c.textlength(line, font=f3)
band = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
ImageDraw.Draw(band).rounded_rectangle([(1080 - w3) / 2 - 30, 1330, (1080 + w3) / 2 + 30, 1422], 22, fill=(4, 6, 14, 150))
bg = Image.alpha_composite(bg.convert("RGBA"), band).convert("RGB")
c = ImageDraw.Draw(bg)
c.text(((1080 - w3) / 2 + 2, 1347), line, font=f3, fill=(0, 0, 0))
c.text(((1080 - w3) / 2, 1345), line, font=f3, fill=(247, 183, 51))
bg.save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print(os.path.join(ROOT, "out", "cover.jpg"))
