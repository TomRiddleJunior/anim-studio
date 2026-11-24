"""cover.jpg: both characters in the wide two-shot (the frame where the clock has restarted and the warm light swells,
no caption on screen) with the episode's question set above them in the girl's warm white.

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
    caps = F["captions"]
    for k in range(len(F["shots"]) - 1, -1, -1):
        sh = F["shots"][k]
        if sh["type"] != "WIDE":
            continue
        t1 = F["shots"][k + 1]["t0"] if k + 1 < len(F["shots"]) else F["dur"]
        t = t1 - 0.12
        while t > sh["t0"] + 0.3:
            if not any(c["t0"] <= t < c["t1"] for c in caps) and not (F.get("now") and F["now"]["t0"] <= t < F["now"]["t1"]):
                return t
            t -= 0.1
    return 0.0


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
    q = F["question"]["rows"]
    rows = [(" ".join(w["w"] for w in r["words"]).upper(), r["size"] + 8, r.get("weight", 800)) for r in q]
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    y = 250
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
