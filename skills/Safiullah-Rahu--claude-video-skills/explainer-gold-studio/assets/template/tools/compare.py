"""Side-by-side proof sheet: matched beats, reference frame on the left, ours on the right, same scale, times printed.

usage: python -I tools/compare.py <reference.mp4> <ours.mp4> <out.jpg> [beats.json]
beats.json: [["label", src_t, our_t], ...]  (defaults to the gold-studio sample's beats below)
"""
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
if not os.path.exists(FF):
    FF = "ffmpeg"
BEATS = [
    ["two-up open", 1.5, 1.5],
    ["stack + gold label", 7.0, 6.6],
    ["serif title card", 11.2, 10.55],
    ["people turn gold", 15.3, 14.9],
    ["ring gauge", 18.5, 17.9],
    ["coins pour into safe", 20.3, 20.0],
    ["green chart + count + tiles", 30.5, 30.1],
    ["dotted map + routes", 38.5, 38.7],
    ["coin grid -> cents", 45.6, 44.7],
    ["red serif title card", 47.6, 46.75],
    ["plant + red $0", 52.5, 50.6],
    ["ending: stacks", 60.5, 59.6],
]
TW, TH = 300, 533


def grab(video, t):
    fd, p = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1",
                    "-vf", f"scale={TW}:{TH}:flags=lanczos", p], check=True)
    im = Image.open(p).convert("RGB")
    im.load()
    os.remove(p)
    return im


def main():
    src, ours, out = sys.argv[1], sys.argv[2], sys.argv[3]
    beats = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else BEATS
    cols = 4
    pw, ph = TW * 2 + 6, TH + 44
    rows = (len(beats) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * pw + (cols + 1) * 14, rows * ph + (rows + 1) * 14 + 40), (24, 24, 26))
    d = ImageDraw.Draw(sheet)
    try:
        f1, f2 = ImageFont.truetype("arialbd.ttf", 22), ImageFont.truetype("arial.ttf", 17)
    except Exception:
        f1 = f2 = None
    d.text((14, 10), "gold-studio — LEFT: reference, RIGHT: ours, matched beats", fill=(240, 220, 160), font=f1)
    for i, (lab, ts, to) in enumerate(beats):
        x, y = 14 + (i % cols) * (pw + 14), 54 + (i // cols) * (ph + 14)
        d.text((x, y), f"{i + 1}. {lab}", fill=(255, 255, 255), font=f2)
        d.text((x, y + 20), f"reference {ts:.2f}s", fill=(170, 170, 170), font=f2)
        d.text((x + TW + 6, y + 20), f"ours {to:.2f}s", fill=(240, 200, 110), font=f2)
        sheet.paste(grab(src, ts), (x, y + 42))
        sheet.paste(grab(ours, to), (x + TW + 6, y + 42))
    sheet.save(out, quality=90)
    print(out, sheet.size)


if __name__ == "__main__":
    main()
