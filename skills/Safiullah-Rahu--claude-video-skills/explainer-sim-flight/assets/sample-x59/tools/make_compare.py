"""compare.jpg — matched beats, reference frame left, ours right, same scale, timestamps printed.

usage: python -I tools/make_compare.py <reference.mp4> <ours.mp4> <out.jpg>
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
PAIRS = [  # (beat, reference t, ours t)
    ("hook: desert chase", 1.0, 1.0),
    ("reveal + info card + note", 7.0, 6.4),
    ("comparison 1 (wide, hills)", 11.0, 10.8),
    ("comparison 2: jet on afterburner", 14.5, 13.4),
    ("dawn pines, low in the grass", 20.5, 19.4),
    ("planform from above, canopy", 25.0, 24.1),
    ("mechanism close-up over clouds", 37.0, 36.4),
    ("picture-in-picture card", 46.0, 51.0),
    ("dusk illustration + tag", 53.0, 60.4),
    ("snowy mountains", 68.5, 68.6),
    ("recreation + card + tag", 73.0, 72.0),
    ("ending: loops to the opening shot", 97.0, 97.6),
]
W, H = 360, 640


def grab(path, t):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8)[: W * H * 3].reshape(H, W, 3))


def main(src, ours, out):
    cols, pad, top = 4, 10, 30
    cw, ch = 2 * W + 4, H + top
    sheet = Image.new("RGB", (cols * cw + (cols + 1) * pad, 3 * ch + 4 * pad + 40), (14, 14, 16))
    d = ImageDraw.Draw(sheet)
    try:
        f = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 18)
        fb = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 24)
    except OSError:
        f = fb = ImageFont.load_default()
    d.text((pad, 8), "sim-flight — LEFT: reference, RIGHT: ours (each pair), same scale", fill=(240, 240, 235), font=fb)
    for i, (beat, ts, to) in enumerate(PAIRS):
        x = pad + (i % cols) * (cw + pad)
        y = 40 + pad + (i // cols) * (ch + pad)
        sheet.paste(grab(src, ts), (x, y + top))
        sheet.paste(grab(ours, to), (x + W + 4, y + top))
        d.text((x, y + 4), f"{i + 1}. {beat}", fill=(255, 220, 90), font=f)
        d.text((x + 6, y + top + 6), f"ref {ts:.1f}s", fill=(255, 255, 0), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
        d.text((x + W + 10, y + top + 6), f"ours {to:.1f}s", fill=(120, 255, 160), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
    sheet.save(out, quality=90)
    print(out, sheet.size)


if __name__ == "__main__":
    main(*sys.argv[1:4])
