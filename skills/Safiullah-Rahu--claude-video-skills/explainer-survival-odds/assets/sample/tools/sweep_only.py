"""A quick 2 fps sweep of any mp4 into scratch/<name>_NN.jpg (40 tiles a sheet) — for a first look at a master.
usage: python -I tools/sweep_only.py <mp4> <name>"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = paths.ffmpeg()
mp4, name = sys.argv[1], sys.argv[2]
tw, th = 216, 384
frames = []
p = subprocess.Popen([FF, "-v", "error", "-i", mp4, "-vf", f"fps=2,scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
while True:
    buf = p.stdout.read(tw * th * 3)
    if len(buf) < tw * th * 3:
        break
    frames.append(Image.frombytes("RGB", (tw, th), buf))
p.wait()
f = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 16)
for s in range(0, len(frames), 40):
    chunk = frames[s:s + 40]
    rows = (len(chunk) + 9) // 10
    sheet = Image.new("RGB", (10 * tw, rows * (th + 22)), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(chunk):
        x, y = (k % 10) * tw, (k // 10) * (th + 22)
        sheet.paste(im, (x, y + 22))
        d.text((x + 4, y + 3), f"{(s + k) / 2:.1f}s", fill=(230, 230, 230), font=f)
    sheet.save(os.path.join(ROOT, "scratch", f"{name}_{s // 40 + 1:02d}.jpg"), quality=84)
print(len(frames), "frames")
