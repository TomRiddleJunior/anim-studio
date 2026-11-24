"""A world-only frame for the cover: copies the project into scratch/coverproj with the hud and the mix removed from
index.html, snapshots it at time t under the shared render lock, then runs tools/cover.py on it.
usage: python -I tools/cover_frame.py <t> "THE RIG" ["line"] [day=1] [odds=71 | ??]"""
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CP = os.path.join(ROOT, "scratch", "coverproj")
t, title = sys.argv[1], sys.argv[2]
line = sys.argv[3] if len(sys.argv) > 3 else "She has a plan. She forgot one thing."
day = sys.argv[4] if len(sys.argv) > 4 else "1"
odds = sys.argv[5] if len(sys.argv) > 5 else "71"
if os.path.isdir(CP):
    shutil.rmtree(CP)
os.makedirs(CP)
for d in ("assets", "compositions"):
    shutil.copytree(os.path.join(ROOT, d), os.path.join(CP, d), ignore=shutil.ignore_patterns("audio"))
for f in ("hyperframes.json", "meta.json", "package.json"):
    shutil.copy(os.path.join(ROOT, f), os.path.join(CP, f))
idx = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
idx = re.sub(r'\s*<div id="hud"[^\n]*</div>', "", idx)
idx = re.sub(r'\s*<audio id="mix"[^\n]*</audio>', "", idx)
open(os.path.join(CP, "index.html"), "w", encoding="utf-8").write(idx)
out = os.path.join(CP, "out")
lock = paths.lock()
r = subprocess.run(["bash", "-c", f'cd "{CP}" && bash "{lock}" npx -y hyperframes@0.8.210 snapshot --at {t} --no-end --keep -o "{out}" --timeout 180000'], capture_output=True, text=True, encoding="utf-8", errors="replace")
png = os.path.join(out, f"at-{float(t):g}s.png")
print(os.path.exists(png), png)
shutil.copy(png, os.path.join(ROOT, "scratch", "cover_world.png"))
subprocess.run([sys.executable, "-I", os.path.join(ROOT, "tools", "cover.py"), os.path.join(ROOT, "scratch", "cover_world.png"), title, day, odds, line])
