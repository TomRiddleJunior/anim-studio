"""QA sheets for the rendered reel (reads the REAL mp4).
  sweep   out/qa/sweep_2fps_<k>.jpg   every frame at 2 fps, two sheets, timestamps
  faces   out/qa/faces_lines.jpg      the girl's face (shot camera -> face box) at 6 moments of each of her lines
          out/qa/faces_blinks.jpg     her face at every blink inside a girl shot: before / closing / closed / opening
  hood    out/qa/hood.jpg             the hood opening at 8 moments (faceless check)
  yavg    out/qa/yavg.json            per-frame mean luma; flags v[i] < 0.6*min(neighbours) or a drop > 50

usage: python -I tools/qa_sheets.py [sweep|faces|hood|yavg|all]      (QA_MP4 env overrides the mp4)
"""
import json
import math
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
MP4 = os.environ.get("QA_MP4") or os.path.join(ROOT, "out", NAME + ".mp4")
QA = os.path.join(ROOT, "out", "qa")
os.makedirs(QA, exist_ok=True)
try:
    FB = ImageFont.truetype("arialbd.ttf", 15); FS = ImageFont.truetype("arial.ttf", 13)
except OSError:
    FB = FS = ImageFont.load_default()
s = open(os.path.join(ROOT, "assets", "lib", "film-data.js"), encoding="utf-8").read()
F = json.loads(s[s.index("=") + 1: s.rindex(";")])


def grab(t, w=1080, h=1920):
    p = subprocess.run([FF, "-v", "error", "-ss", f"{t:.3f}", "-i", MP4, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return Image.fromarray(np.frombuffer(p.stdout, np.uint8).reshape(h, w, 3))


def cam(t):
    S = F["shots"]; i = 0
    while i < len(S) - 1 and t >= S[i + 1]["t0"]:
        i += 1
    sh = S[i]; t1 = S[i + 1]["t0"] if i + 1 < len(S) else F["dur"]
    u = min(1, max(0, (t - sh["t0"]) / max(0.01, t1 - sh["t0"]))); e = -(math.cos(math.pi * u) - 1) / 2
    c = {k: sh["cam0"][k] + (sh["cam1"][k] - sh["cam0"][k]) * e for k in ("x", "y", "z")}
    if not sh["sky"]:
        hw, hh = 540 / c["z"], 960 / c["z"]
        c["x"] = min(max(c["x"], hw), 1402 - hw); c["y"] = min(max(c["y"], hh), 1122 - hh)
    return sh, c


def crop_world(im, c, box, out=(360, 300)):
    x0 = 540 + (box[0] - c["x"]) * c["z"]; y0 = 960 + (box[1] - c["y"]) * c["z"]
    x1 = 540 + (box[2] - c["x"]) * c["z"]; y1 = 960 + (box[3] - c["y"]) * c["z"]
    return im.crop((int(x0), int(y0), int(x1), int(y1))).resize(out, Image.LANCZOS)


def sheet(tiles, cols, title, path):
    tw, th = tiles[0][0].size
    rows = (len(tiles) + cols - 1) // cols
    S = Image.new("RGB", (cols * tw, rows * (th + 18) + 26), (18, 18, 20)); d = ImageDraw.Draw(S)
    d.text((6, 5), title, fill=(235, 235, 235), font=FB)
    for i, (im, lab) in enumerate(tiles):
        x, y = (i % cols) * tw, 26 + (i // cols) * (th + 18)
        S.paste(im, (x, y + 18)); d.text((x + 4, y + 2), lab, fill=(255, 214, 90), font=FS)
    S.save(path, quality=88); print(path, len(tiles))


def sweep():
    tw, th, cols = 162, 288, 10
    p = subprocess.run([FF, "-v", "error", "-i", MP4, "-vf", f"fps=2,scale={tw}:{th}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, th, tw, 3)
    half = (len(fr) + 1) // 2
    for k, chunk in enumerate((fr[:half], fr[half:])):
        sheet([(Image.fromarray(f), f"{(i + k * half) / 2:5.1f}s") for i, f in enumerate(chunk)], cols,
              f"{NAME} · 2 fps sweep of the rendered mp4 · part {k + 1}/2", os.path.join(QA, f"sweep_2fps_{k + 1}.jpg"))


GIRL_FACE = (928, 360, 1124, 600)


def faces():
    tiles = []
    for l in F["captions"] + [{"line": "l01", "t0": 0.05, "t1": 3.0}]:
        pass
    vo = {}
    for c in F["captions"]:
        vo.setdefault(c["line"], [c["t0"], c["t1"]]); vo[c["line"]][1] = c["t1"]
    q = F["question"]["rows"]
    girl_lines = [("l01", q[0]["words"][0]["t0"], q[-1]["words"][-1]["t0"] + 0.5)] + [(k, v[0], v[1]) for k, v in vo.items() if any(c["who"] == "L" and c["line"] == k for c in F["captions"])]
    for lid, a, b in girl_lines:
        for j in range(6):
            t = a + (b - a) * j / 5
            sh, c = cam(t)
            if sh["type"] not in ("GIRL_Q", "GIRL_MCU", "END", "OTS_GIRL", "CARD_GAP"):
                continue
            tiles.append((crop_world(grab(t), c, GIRL_FACE), f"{lid} {t:5.2f}s {sh['type']}"))
    sheet(tiles, 6, "the girl at her lines (lip-sync): face box through the shot camera, from the mp4", os.path.join(QA, "faces_lines.jpg"))
    tiles = []
    for tb in F["acting"]["blinks"]:
        sh, c = cam(tb)
        if sh["type"] not in ("GIRL_Q", "GIRL_MCU", "END", "OTS_GIRL", "CARD_GAP"):
            continue
        for dt, lab in ((-0.1, "open"), (0.05, "closing"), (0.1, "closed"), (0.2, "opening")):
            tiles.append((crop_world(grab(tb + dt), c, GIRL_FACE, (300, 250)), f"{tb + dt:5.2f}s {lab}"))
    sheet(tiles, 8, "the girl's blinks inside girl shots: open / closing / closed / opening", os.path.join(QA, "faces_blinks.jpg"))


def hood():
    tiles = []
    ts = [s["t0"] + 0.6 for s in F["shots"] if s["type"] in ("HOOD", "HOOD_PUSH", "HANDS", "CLOCK_FROZEN")]
    ts += [F["shots"][-2]["t0"] + 0.5]
    for t in ts[:10]:
        sh, c = cam(t)
        tiles.append((crop_world(grab(t), c, (440, 180, 740, 480), (300, 300)), f"{t:5.2f}s {sh['type']}"))
    sheet(tiles, 5, "the hood opening (must stay faceless: darkness + faint particles only)", os.path.join(QA, "hood.jpg"))


def yavg():
    r = subprocess.run([FF, "-hide_banner", "-i", MP4, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-an", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    v = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", r.stderr)]
    flags = []
    for i in range(1, len(v) - 1):
        a = v[i] < 0.6 * min(v[i - 1], v[i + 1]); b = v[i] < v[i - 1] - 50
        if a or b:
            flags.append({"frame": i, "t": round(i / 30, 3), "prev": round(v[i - 1], 1), "v": round(v[i], 1), "next": round(v[i + 1], 1)})
    out = {"frames": len(v), "min": round(min(v), 1), "max": round(max(v), 1), "mean": round(sum(v) / len(v), 1), "flags": flags}
    json.dump(out, open(os.path.join(QA, "yavg.json"), "w"), indent=1)
    print(f"{len(v)} frames · YAVG min {out['min']} mean {out['mean']} max {out['max']} · {len(flags)} flagged")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    for k, fn in (("sweep", sweep), ("faces", faces), ("hood", hood), ("yavg", yavg)):
        if what in (k, "all"):
            fn()
