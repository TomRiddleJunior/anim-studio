"""Snapshot a caption-free world frame (for the cover): temporarily drops the captions host from index.html, runs
hyperframes snapshot at time t, restores index.html. Run it under the render lock.
usage: python -I tools/world_frame.py <t> <out.png>"""
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t, out = float(sys.argv[1]), os.path.abspath(sys.argv[2])
idx = os.path.join(ROOT, "index.html")
bak = idx + ".bak"
shutil.copy(idx, bak)
try:
    html = open(bak, encoding="utf-8").read()
    html = re.sub(r'\s*<div id="captions"[^>]*></div>', "", html)
    open(idx, "w", encoding="utf-8").write(html)
    env = dict(os.environ)
    env["PATH"] = r"engine\node_modules\ffmpeg-static;ffmpeg-bin\node_modules\ffprobe-static\bin\win32\x64;" + env["PATH"]
    tmp = os.path.join(ROOT, "scratch", "worldframe")
    r = subprocess.run(f'npx -y hyperframes@0.8.210 snapshot --at {t} --no-end --keep -o "{tmp}" --timeout 120000', cwd=ROOT, env=env, shell=True,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    src = os.path.join(tmp, f"at-{'%g' % t}s.png")
    if not os.path.exists(src):
        print(r.stdout[-1500:], r.stderr[-1500:])
        raise SystemExit("no frame")
    shutil.copy(src, out)
    print(out)
finally:
    shutil.move(bak, idx)
