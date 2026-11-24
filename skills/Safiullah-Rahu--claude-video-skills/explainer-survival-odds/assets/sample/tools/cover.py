"""out/cover.jpg — the Survival Odds cover template: a world-only hook frame + SURVIVAL ODDS · THE <PLACE> · DAY n + the
odds ring at the starting value + one line. Everything important sits inside the 3:4 grid crop (y 240-1680).
usage: python -I tools/cover.py <world_frame.png> "THE RIG" [day=1] [odds=71] ["She has a plan. She forgot one thing."]"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSW = os.path.join(ROOT, "assets", "fonts", "Oswald_wght_.ttf")
INTER = os.path.join(ROOT, "assets", "fonts", "Inter_opsz-wght_.ttf")
src, title = sys.argv[1], sys.argv[2]
day = sys.argv[3] if len(sys.argv) > 3 else "1"
odds = int(sys.argv[4]) if len(sys.argv) > 4 else 71
line = sys.argv[5] if len(sys.argv) > 5 else "She has a plan. She forgot one thing."
GREEN, AMBER, RED = (70, 212, 131), (247, 183, 51), (255, 90, 69)
oc = GREEN if odds >= 75 else AMBER if odds >= 45 else RED


def font(path, sz, wght=700):
    f = ImageFont.truetype(path, sz)
    try:
        f.set_variation_by_axes([wght] if path == OSW else [32, wght])
    except Exception:
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
    return f


bg = Image.open(src).convert("RGB").resize((1080, 1920), Image.LANCZOS)
shade = Image.new("L", (1080, 1920), 0)
sd = ImageDraw.Draw(shade)
for yy in range(0, 760):
    sd.line([(0, yy), (1080, yy)], fill=int(185 * (1 - yy / 760) ** 1.5))
bg = Image.composite(Image.new("RGB", (1080, 1920), (4, 6, 14)), bg, shade).convert("RGBA")


def text_c(img, txt, y, f, fill, spacing=0, x0=None, shadow=True):
    d = ImageDraw.Draw(img)
    w = sum(d.textlength(ch, font=f) for ch in txt) + spacing * (len(txt) - 1)
    x = (1080 - w) / 2 if x0 is None else x0
    for ch in txt:
        if shadow:
            d.text((x + 2, y + 3), ch, font=f, fill=(0, 0, 0, 200))
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + spacing
    return w


# SURVIVAL ODDS (series), THE <PLACE>, DAY n (left block) + the ring (right)
text_c(bg, "SURVIVAL ODDS", 268, font(INTER, 34, 800), AMBER + (255,), spacing=13, x0=96)
tf = font(OSW, 92, 600)
text_c(bg, title, 318, tf, (255, 255, 255, 255), spacing=8, x0=92)
glow = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.text((88, 410), f"DAY {day}", font=font(OSW, 220, 700), fill=RED + (255,))
bg = Image.alpha_composite(Image.alpha_composite(bg, glow.filter(ImageFilter.GaussianBlur(24))), glow)
# the ring (the identity device), at the episode's starting odds
R = 132
cx, cy = 1080 - 96 - R, 470
ring = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
rd = ImageDraw.Draw(ring)
rd.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(6, 10, 20, 170), outline=(255, 255, 255, 50), width=7)
rd.arc([cx - R + 4, cy - R + 4, cx + R - 4, cy + R - 4], -90, -90 + 360 * odds / 100, fill=oc + (255,), width=17)
a = math.radians(-90 + 360 * odds / 100)
for ang in (math.radians(-90), a):
    ex, ey = cx + (R - 12.5) * math.cos(ang), cy + (R - 12.5) * math.sin(ang)
    rd.ellipse([ex - 8.5, ey - 8.5, ex + 8.5, ey + 8.5], fill=oc + (255,))
halo = ring.filter(ImageFilter.GaussianBlur(10))
bg = Image.alpha_composite(Image.alpha_composite(bg, halo), ring)
d = ImageDraw.Draw(bg)
nf, pf = font(INTER, 96, 800), font(INTER, 40, 700)
nw, pw = d.textlength(str(odds), font=nf), d.textlength("%", font=pf)
x = cx - (nw + pw + 4) / 2
d.text((x + 2, cy - 58 + 3), str(odds), font=nf, fill=(0, 0, 0, 200)); d.text((x, cy - 58), str(odds), font=nf, fill=(255, 255, 255, 255))
d.text((x + nw + 4, cy - 2), "%", font=pf, fill=(230, 236, 246, 255))
lf = font(INTER, 26, 800)
lw = sum(d.textlength(ch, font=lf) for ch in "AI ODDS") + 9 * 6
xx = cx - lw / 2
for ch in "AI ODDS":
    d.text((xx, cy + R + 18), ch, font=lf, fill=(236, 241, 250, 255)); xx += d.textlength(ch, font=lf) + 9
# the line, in an amber band low in the grid crop
f3 = font(OSW, 54, 600)
w3 = d.textlength(line, font=f3)
band = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
ImageDraw.Draw(band).rounded_rectangle([(1080 - w3) / 2 - 30, 1452, (1080 + w3) / 2 + 30, 1544], 22, fill=(4, 6, 14, 165))
bg = Image.alpha_composite(bg, band)
d = ImageDraw.Draw(bg)
d.text(((1080 - w3) / 2 + 2, 1469), line, font=f3, fill=(0, 0, 0, 255))
d.text(((1080 - w3) / 2, 1467), line, font=f3, fill=AMBER + (255,))
bg.convert("RGB").save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
print(os.path.join(ROOT, "out", "cover.jpg"))
