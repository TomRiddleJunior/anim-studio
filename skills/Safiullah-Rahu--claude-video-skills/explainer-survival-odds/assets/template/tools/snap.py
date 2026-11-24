"""Snapshot one still per shot (at a fraction of each shot, from score/timing.json) and build a labelled contact sheet.
usage: python -I tools/snap.py <outdir> [frac=0.5] [keys=A1,B,...] [extra times t1,t2,...]
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
T, DUR = TM["T"], TM["dur"]
out = os.path.join(ROOT, sys.argv[1])
frac = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
keys = sys.argv[3].split(",") if len(sys.argv) > 3 and sys.argv[3] else None
extra = [float(x) for x in sys.argv[4].split(",")] if len(sys.argv) > 4 and sys.argv[4] else []
order = sorted(T.items(), key=lambda kv: kv[1])
times, labels = [], []
for i, (k, v) in enumerate(order):
    if keys and k not in keys:
        continue
    nxt = order[i + 1][1] if i + 1 < len(order) else DUR
    t = round(v + (nxt - v) * frac, 2)
    times.append(t); labels.append(k)
for t in extra:
    times.append(round(t, 2)); labels.append(f"{t:.2f}")
env = dict(os.environ)
env["PATH"] = paths.bin_path() + os.pathsep + env["PATH"]
# under the shared render lock (three agents share the machine)
lock = paths.lock()
cmd = f'cd "{ROOT}" && bash "{lock}" npx -y hyperframes@0.8.210 snapshot --at {",".join(str(t) for t in times)} --no-end --keep -o "{out}" --timeout 180000'
r = subprocess.run(["bash", "-c", cmd], env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
if r.returncode:
    print((r.stdout[-2000:] + r.stderr[-2000:]).encode("ascii", "replace").decode())
tw, th = 270, 480
cols = min(8, len(times))
rows = (len(times) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 24)), (14, 14, 14))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 16)
for n, (t, k) in enumerate(zip(times, labels)):
    name = f"at-{('%g' % t)}s.png"
    p = os.path.join(out, name)
    x, y = (n % cols) * tw, (n // cols) * (th + 24)
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS), (x, y + 24))
    d.text((x + 4, y + 3), f"{k}  {t:.2f}s", fill=(240, 220, 120), font=f)
sheet.save(os.path.join(out, "sheet.jpg"), quality=88)
print(os.path.join(out, "sheet.jpg"), len(times), "frames")
