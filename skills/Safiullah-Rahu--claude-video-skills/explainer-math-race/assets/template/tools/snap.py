"""Snapshot stills through the shared render lock and build a labelled contact sheet.
usage: python -I tools/snap.py <outdir> [times t1,t2,...]   (no times: the middle of every shot in score/shots.json,
       plus 0.0 and 0.35 for the hook)
Run it as:  bash "tools/with_render_lock.sh" python -I tools/snap.py scratch/snap1
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(ROOT, sys.argv[1])
os.makedirs(out, exist_ok=True)
if len(sys.argv) > 2 and sys.argv[2]:
    times = [float(x) for x in sys.argv[2].split(",")]
    labels = [f"{t:.2f}" for t in times]
else:
    S = json.load(open(os.path.join(ROOT, "score", "shots.json"), encoding="utf-8"))
    sh, dur = S["shots"], S["dur"]
    times, labels = [0.0, 0.35], ["first", "hook"]
    for i, s in enumerate(sh):
        nxt = sh[i + 1]["t0"] if i + 1 < len(sh) else dur
        times.append(round(s["t0"] + (nxt - s["t0"]) * 0.62, 2)); labels.append(s["name"])
env = dict(os.environ)
env["PATH"] = r"engine\node_modules\ffmpeg-static;ffmpeg-bin\node_modules\ffprobe-static\bin\win32\x64;" + env["PATH"]
cmd = ["npx", "-y", "hyperframes@0.8.210", "snapshot", "--at", ",".join(str(t) for t in times), "--no-end", "--keep", "-o", out, "--timeout", "90000"]
r = subprocess.run(" ".join(f'"{c}"' if " " in c else c for c in cmd), cwd=ROOT, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
if r.returncode:
    print(r.stdout[-2000:], r.stderr[-2000:])
tw, th = 270, 480
cols = min(8, len(times))
rows = (len(times) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 24)), (14, 14, 14))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 16)
for n, (t, k) in enumerate(zip(times, labels)):
    p = os.path.join(out, f"at-{('%g' % t)}s.png")
    x, y = (n % cols) * tw, (n // cols) * (th + 24)
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS), (x, y + 24))
    d.text((x + 4, y + 3), f"{k}  {t:.2f}s", fill=(240, 220, 120), font=f)
sheet.save(os.path.join(out, "sheet.jpg"), quality=88)
print(os.path.join(out, "sheet.jpg"), len(times), "frames")
