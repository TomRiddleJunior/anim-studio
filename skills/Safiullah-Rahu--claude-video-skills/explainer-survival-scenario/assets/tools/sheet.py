"""Pose sheet: snapshot scratch/sheet at 0.5..7.5 s (8 views) and tile them.
Optional: a JSON of pose overrides is written to scratch/sheet/assets/lib/pose.js as window.SHEET_POSE.
usage: python -I tools/sheet.py <out_name> ['{"floor": {...}}']"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "scratch", "sheet")
name = sys.argv[1]
pose = sys.argv[2] if len(sys.argv) > 2 else "{}"
open(os.path.join(S, "assets", "lib", "pose.js"), "w").write("window.SHEET_POSE = " + json.dumps(json.loads(pose)) + ";\n")
idx = open(os.path.join(S, "index.html"), encoding="utf-8").read()
if "pose.js" not in idx:
    idx = idx.replace('<script src="assets/lib/film.js"></script>', '<script src="assets/lib/pose.js"></script>\n    <script src="assets/lib/film.js"></script>')
    open(os.path.join(S, "index.html"), "w", encoding="utf-8").write(idx)
out = os.path.join(S, "out_" + name)
env = dict(os.environ)
env["PATH"] = r"engine\node_modules\ffmpeg-static;" + env["PATH"]
times = [k + 0.5 for k in range(8)]
subprocess.run("npx -y hyperframes@0.8.210 snapshot --at " + ",".join(str(t) for t in times) + f' --no-end --keep -o "{out}" --timeout 90000', cwd=S, env=env, shell=True, capture_output=True)
tw, th = 300, 534
sheet = Image.new("RGB", (4 * tw, 2 * th), (10, 10, 10))
for i, t in enumerate(times):
    p = os.path.join(out, f"at-{t:g}s.png")
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS), ((i % 4) * tw, (i // 4) * th))
ImageDraw.Draw(sheet).text((6, 6), name, fill=(255, 220, 120), font=ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 18))
sheet.save(os.path.join(ROOT, "scratch", f"sheet_{name}.jpg"), quality=88)
print(os.path.join(ROOT, "scratch", f"sheet_{name}.jpg"))
