"""World test: snapshot a throwaway shot list (one view per second) in scratch/wt, under the shared render lock, and tile
the frames into scratch/wt_<name>.jpg.   usage: python -I tools/wt.py <film_js> <name> [n_views] [module,module]
The film file defines FILM_CREATE / FILM_BUILD / FILM like assets/lib/film.js, with one shot per second."""
import os
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WT = os.path.join(ROOT, "scratch", "wt")
film, name = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
mods = sys.argv[4].split(",") if len(sys.argv) > 4 else ["survival-rig"]
lib = os.path.join(WT, "assets", "lib")
for f in ["survival-kit.js"] + [m + ".js" for m in mods]:
    shutil.copy(os.path.join(ROOT, "assets", "lib", f), os.path.join(lib, f))
shutil.copy(film, os.path.join(lib, "film.js"))
open(os.path.join(lib, "film-vo.js"), "w").write("window.FILM_VO = {dur: %d, fps: 30, T: {}, lines: {}};\n" % n)
tags = "\n".join(f'    <script src="assets/lib/{m}.js"></script>' for m in mods)
open(os.path.join(WT, "index.html"), "w", encoding="utf-8").write(f"""<!doctype html>
<html lang="en" data-size="1080x1920">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="assets/lib/three.global.js"></script>
    <script src="assets/lib/survival-kit.js"></script>
{tags}
    <script src="assets/lib/film-vo.js"></script>
    <script src="assets/lib/film.js"></script>
    <style>* {{ margin: 0; padding: 0; box-sizing: border-box; }} html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #03050b; }} #root {{ position: relative; width: 100%; height: 100%; }}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{n}" data-width="1080" data-height="1920">
      <div id="world" data-composition-id="world" data-composition-src="compositions/world.html" data-start="0" data-duration="{n}" data-track-index="0" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 1"></div>
    </div>
    <script>window.__timelines = window.__timelines || {{}}; window.__timelines["main"] = gsap.timeline({{ paused: true }});</script>
  </body>
</html>
""")
out = os.path.join(WT, "out_" + name)
if os.path.isdir(out):
    shutil.rmtree(out)
times = [k + 0.5 for k in range(n)]
lock = paths.lock()
cmd = f'bash "{lock}" npx -y hyperframes@0.8.210 snapshot --at {",".join(str(t) for t in times)} --no-end --keep -o "{out}" --timeout 180000'
env = dict(os.environ)
r = subprocess.run(["bash", "-c", f'cd "{WT}" && {cmd}'], env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
print((r.stdout[-1500:] + r.stderr[-1500:]).encode("ascii", "replace").decode())
cols = min(4, n)
rows = (n + cols - 1) // cols
tw, th = 360, 640
sheet = Image.new("RGB", (cols * tw, rows * th), (10, 10, 10))
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 18)
for i, t in enumerate(times):
    p = os.path.join(out, f"at-{t:g}s.png")
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS), ((i % cols) * tw, (i // cols) * th))
    d.text(((i % cols) * tw + 6, (i // cols) * th + 6), str(i), fill=(255, 220, 120), font=f)
dst = os.path.join(ROOT, "scratch", f"wt_{name}.jpg")
sheet.save(dst, quality=88)
print(dst)
