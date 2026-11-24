"""Full-size frames of a reference clip at given times (analysed locally for reference only).
usage: python -X utf8 -I grab.py <clip.mp4> <out_dir> 0.5,7.5,12 [--sheet cols]   (ffmpeg from $FFMPEG or PATH)
Writes <out_dir>/t<time>.png and, with --sheet, a labelled half-size sheet keys.jpg."""
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

clip, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3].split(",")]
cols = int(sys.argv[sys.argv.index("--sheet") + 1]) if "--sheet" in sys.argv else 0
ff = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
os.makedirs(out, exist_ok=True)
paths = []
for t in ts:
    p = os.path.join(out, f"t{t:07.2f}.png")
    subprocess.run([ff, "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", clip, "-frames:v", "1", p], check=True)
    paths.append((t, p))
if cols:
    try:
        font = ImageFont.truetype("arialbd.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    ims = [(t, Image.open(p).convert("RGB")) for t, p in paths]
    w, h = ims[0][1].size
    tw, th = w // 2, h // 2
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 28)), (16, 16, 18))
    d = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(ims):
        x, y = (i % cols) * tw, (i // cols) * (th + 28)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 28))
        d.text((x + 4, y + 2), f"{t:.2f} s", fill=(255, 220, 80), font=font)
    sheet.save(os.path.join(out, "keys.jpg"), quality=88)
print(len(paths), "frames ->", out)
