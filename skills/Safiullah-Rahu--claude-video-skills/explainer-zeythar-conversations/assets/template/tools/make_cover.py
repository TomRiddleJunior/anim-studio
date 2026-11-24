"""cover.jpg: both characters in the quiet two-shot (Zeythar's name tag on, no caption on screen) with the episode's
hook line set above them in the girl's warm white.

usage: python -I tools/make_cover.py [time_s]      (anaconda python: PIL + numpy; reads out/<name>.mp4)
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
s = open(os.path.join(ROOT, "assets", "lib", "film-data.js"), encoding="utf-8").read()
F = json.loads(s[s.index("=") + 1: s.rindex(";")])


def pick_time():
    """the quiet two-shot (both characters, the name tag, no caption); else the latest caption-free moment in a wide
    before the end card; else the frame just before the end card"""
    caps = F["captions"]
    end0 = F["endcard"]["t0"]
    free = lambda t: not any(c["t0"] <= t < c["t1"] for c in caps) and t < end0 - 0.03
    order = sorted(range(len(F["shots"])), key=lambda k: (F["shots"][k]["type"] != "WIDE_QUIET", -k))
    for k in order:
        sh = F["shots"][k]
        if sh["type"] not in ("WIDE_QUIET", "WIDE"):
            continue
        t1 = min(F["shots"][k + 1]["t0"] if k + 1 < len(F["shots"]) else F["dur"], end0) - 0.04
        t = t1
        while t > sh["t0"] + 0.2:
            if free(t) and (sh["type"] != "WIDE_QUIET" or t <= (sh["t0"] + t1) / 2 + 0.3):
                return t
            t -= 0.02
    return max(0.0, end0 - 0.1)


def font(size, wght):
    f = ImageFont.truetype(os.path.join(ROOT, "assets", "fonts", "Montserrat_wght_.ttf"), size)
    try:
        f.set_variation_by_axes([wght])
    except Exception:
        pass
    return f


def main():
    t = float(sys.argv[1]) if len(sys.argv) > 1 else pick_time()
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", os.path.join(ROOT, "out", NAME + ".mp4"), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    im = Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(1920, 1080, 3)).convert("RGBA")
    hook = F.get("cover_hook") or ["IT'S 2:30 AM.", "I SAID I'D SLEEP AT TEN."]
    rows = [(hook[0], 104, 900), (hook[1], 62, 800)] if len(hook) > 1 else [(hook[0], 90, 900)]
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    y = 236
    for text, size, wght in rows:
        f = font(size, wght)
        w = d.textlength(text, font=f)
        while w > 930 and size > 40:          # keep the title inside the 90 % action-safe width
            size -= 2; f = font(size, wght); w = d.textlength(text, font=f)
        x = (1080 - w) / 2
        g.text((x, y), text, font=f, fill=(255, 170, 90, 210))
        d.text((x + 3, y + 5), text, font=f, fill=(0, 0, 0, 170))
        d.text((x, y), text, font=f, fill=(255, 241, 220, 255))
        y += int(size * 1.12)
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    out = Image.alpha_composite(Image.alpha_composite(im, glow), layer).convert("RGB")
    out.save(os.path.join(ROOT, "out", "cover.jpg"), quality=92)
    print("cover from", round(t, 2), "s ->", os.path.join(ROOT, "out", "cover.jpg"))


if __name__ == "__main__":
    main()
