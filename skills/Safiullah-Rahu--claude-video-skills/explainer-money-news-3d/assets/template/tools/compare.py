"""out/qa/compare.jpg: a reference video (left) next to our film (right) at 15 matched beats of the format
(hook prop, second hook prop, ticker card, % drop chart, "worst day", stat cards, the question, the receipt, the bar /
stack, "TWIST", the second 3D set, the two-card logic, the slider, the split-flap close, the phone CTA).

usage: python -I tools/compare.py [out/<key>.mp4] [out/qa/compare.jpg] --ref <reference.mp4>
       (the reference is optional; without it nothing is compared)
"""
import argparse
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
BEATS = [(1.2, 1.0, "hook: pallets of cash"), (5.0, 5.3, "hook 2: 3D prop"), (9.5, 8.1, "cream ticker card"),
         (11.8, 9.9, "dark % drop chart"), (15.5, 12.7, "worst day + timeline"), (23.0, 21.3, "'The strange part?' stat cards"),
         (25.6, 23.2, "the question (photo / 3D board)"), (28.6, 32.2, "the receipt total"), (38.0, 39.2, "bar flip / stacks"),
         (40.6, 41.4, "'TWIST' tape card"), (49.5, 47.4, "second company / the wing"), (56.0, 58.95, "two-card logic"),
         (60.5, 62.9, "slider"), (67.5, 69.0, "split-flap close"), (72.5, 74.6, "phone CTA")]
TW, TH = 216, 384


def grab(path, t):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={TW}:{TH}:flags=area",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(TH, TW, 3))


def main():
    ap = argparse.ArgumentParser(description="side-by-side compare sheet: reference (left) vs ours (right)")
    ap.add_argument("ours", nargs="?", default=os.path.join(ROOT, "out", os.path.basename(ROOT) + ".mp4"))
    ap.add_argument("out", nargs="?", default=os.path.join(ROOT, "out", "qa", "compare.jpg"))
    ap.add_argument("--ref", default=None, help="reference video (optional)")
    args = ap.parse_args()
    if not args.ref:
        print("compare.jpg skipped (no --ref)")
        return
    ours, out, src = args.ours, args.out, args.ref
    cols = 5
    rows = (len(BEATS) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (2 * TW + 14), rows * (TH + 40) + 34), (22, 22, 24))
    d = ImageDraw.Draw(sheet)
    try:
        f, fs = ImageFont.truetype("arialbd.ttf", 14), ImageFont.truetype("arial.ttf", 12)
    except OSError:
        f = fs = ImageFont.load_default()
    d.text((8, 8), f"LEFT: reference   RIGHT: ours ({os.path.basename(ours)})  — matched by beat", fill=(230, 230, 230), font=f)
    for k, (ts, to, lab) in enumerate(BEATS):
        x, y = (k % cols) * (2 * TW + 14), 34 + (k // cols) * (TH + 40)
        sheet.paste(grab(src, ts), (x, y + 36))
        sheet.paste(grab(ours, to), (x + TW, y + 36))
        d.text((x + 4, y + 2), lab, fill=(255, 255, 255), font=f)
        d.text((x + 4, y + 20), f"reference {ts:5.2f} s", fill=(255, 214, 90), font=fs)
        d.text((x + TW + 4, y + 20), f"ours {to:5.2f} s", fill=(120, 220, 255), font=fs)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out, quality=90)
    print(out)


if __name__ == "__main__":
    main()
