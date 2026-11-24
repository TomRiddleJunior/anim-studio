"""Snapshot stills at given times with hyperframes and build a labelled contact sheet (run it under the render lock).
usage: python -I tools/snap.py <outdir> t1,t2,...
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(ROOT, sys.argv[1])
times = [round(float(x), 2) for x in sys.argv[2].split(",")]
env = dict(os.environ)
env["PATH"] = r"engine\node_modules\ffmpeg-static;ffmpeg-bin\node_modules\ffprobe-static\bin\win32\x64;" + env["PATH"]
cmd = ["npx", "-y", "hyperframes@0.8.210", "snapshot", "--at", ",".join(str(t) for t in times), "--no-end", "--keep", "-o", out, "--timeout", "120000"]
r = subprocess.run(" ".join(f'"{c}"' if " " in c else c for c in cmd), cwd=ROOT, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
if r.returncode:
    print(r.stdout[-2000:], r.stderr[-2000:])
tw, th = 270, 480
cols = min(8, len(times))
rows = (len(times) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 24)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 16)
for n, t in enumerate(times):
    p = os.path.join(out, f"at-{('%g' % t)}s.png")
    x, y = (n % cols) * tw, (n // cols) * (th + 24)
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS), (x, y + 24))
    d.text((x + 4, y + 3), f"{t:.2f}s", fill=(240, 220, 120), font=f)
sheet.save(os.path.join(out, "sheet.jpg"), quality=88)
print(os.path.join(out, "sheet.jpg"), len(times), "frames")
