"""Frame-by-frame study of a source reel (for reference only): cut list, scene events, a labelled sweep and cut strips.
usage: python -X utf8 -I study.py <absolute path to video.mp4> <absolute out_dir> [fps=2]
Writes: cuts.json (scene-score cuts > 0.33, histogram scene events), sweep_NN.jpg (labelled tiles at <fps>),
        and per-cut 8 fps strips around every cut (cutstrip_NN.jpg).
"""
import json
import os
import re
import subprocess
import sys
from io import BytesIO

import numpy as np
from PIL import Image, ImageDraw, ImageFont

def _engine_qa():
    """EXPLAINER_ENGINE (the explainer engine folder) or an engine/qa folder found upward from this file."""
    if os.environ.get("EXPLAINER_ENGINE"):
        return os.path.join(os.environ["EXPLAINER_ENGINE"], "qa")
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(7):
        for c in (os.path.join(d, "engine", "qa"), os.path.join(d, "explainer-engine", "engine", "qa")):
            if os.path.exists(os.path.join(c, "analyze_video.py")):
                return c
        d = os.path.dirname(d)
    raise SystemExit("set EXPLAINER_ENGINE to the explainer engine folder")


sys.path.insert(0, _engine_qa())
import analyze_video as AV  # noqa: E402

FF = AV.FF
try:
    FONT = ImageFont.truetype("arialbd.ttf", 15)
except OSError:
    FONT = ImageFont.load_default()


def frames(path, vf):
    r = subprocess.run([FF, "-hide_banner", "-v", "error", "-i", path, "-vf", vf, "-f", "image2pipe", "-vcodec", "mjpeg", "-q:v", "3", "-"],
                       capture_output=True)
    data, out, i = r.stdout, [], 0
    while True:
        a = data.find(b"\xff\xd8", i)
        if a < 0:
            break
        b = data.find(b"\xff\xd9", a)
        out.append(Image.open(BytesIO(data[a:b + 2])).convert("RGB"))
        i = b + 2
    return out


def sheet(tiles, labels, cols, out_path):
    w, h = tiles[0].size
    rows = (len(tiles) + cols - 1) // cols
    S = Image.new("RGB", (cols * w, rows * h), (16, 16, 16))
    for k, (im, lb) in enumerate(zip(tiles, labels)):
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 70, 19], fill=(0, 0, 0))
        d.text((3, 2), lb, font=FONT, fill=(255, 230, 0))
        S.paste(im, ((k % cols) * w, (k // cols) * h))
    S.save(out_path, quality=85)


def main(path, out, fps=2.0):
    os.makedirs(out, exist_ok=True)
    dur, w, h, vfps = AV.probe(path)
    diffs, cuts = AV.motion_and_cuts(path, out)
    scs = AV.scene_changes(AV.motion_and_cuts.hists, cuts)
    json.dump({"dur": dur, "w": w, "h": h, "cuts": cuts, "scene_events": scs,
               "motion_6fps": [round(float(x), 2) for x in diffs]}, open(os.path.join(out, "cuts.json"), "w"), indent=1)
    portrait = h > w
    tw, th = (180, 320) if portrait else (320, 180)
    fr = frames(path, f"fps={fps},scale={tw}:{th}")
    per, cols = (60, 12) if portrait else (48, 6)
    for s in range(0, len(fr), per):
        chunk = fr[s:s + per]
        sheet(chunk, [f"{(s + k) / fps:.1f}s" for k in range(len(chunk))], cols, os.path.join(out, f"sweep_{s // per + 1:02d}.jpg"))
    # strips: 8 fps, 1.0 s around each cut, 6 cuts per sheet
    rows = []
    for c in cuts:
        st = frames(path, f"trim=start={max(0, c - 0.5):.3f}:duration=1.0,setpts=PTS-STARTPTS,fps=8,scale={tw // 2 if portrait else tw // 2}:{th // 2 if portrait else th // 2}")[:8]
        rows.append((c, st))
    for k in range(0, len(rows), 6):
        tiles, labels = [], []
        for c, st in rows[k:k + 6]:
            for j, im in enumerate(st):
                tiles.append(im)
                labels.append(f"{c - 0.5 + j / 8:.2f}")
            for _ in range(8 - len(st)):
                tiles.append(Image.new("RGB", st[0].size if st else (90, 160)))
                labels.append("")
        if tiles:
            sheet(tiles, labels, 8, os.path.join(out, f"cutstrip_{k // 6 + 1:02d}.jpg"))
    print(json.dumps({"dur": dur, "n_cuts": len(cuts), "cuts": cuts, "n_scene": len(scs), "scene": scs}))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 2.0)
