"""QA on the finished mp4 (not the page): loudness, duration, a YAVG dip scan, frozen-frame scan, a 2 fps sweep sheet,
and full-size frames pulled from the file.

  python -I engine/tools/qa.py <slug> --fmt 16x9 [--frames 1.5,12.4,39.8]

Writes <slug>/out/qa/sweep_<fmt>_a.jpg / _b.jpg (2 fps, timestamped), mp4_<fmt>_<t>.png, qa_<fmt>.json, and prints:
  duration (video/audio), integrated LUFS + true peak, YAVG min/median and every sudden dip (> 25 % under the local
  median: black or flash frames — e.g. a global-name collision with the renderer renders black frames), freezes ≥ 0.5 s.
"""
import argparse
import json
import re
import subprocess
import sys
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import FFMPEG, FFPROBE, film_dir  # noqa: E402


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--fmt", default="16x9")
    ap.add_argument("--frames")
    ap.add_argument("--file")
    a = ap.parse_args()
    root = film_dir(a.slug)
    mp4 = Path(a.file) if a.file else root / "out" / f"{a.slug}_{a.fmt}.mp4"
    qa = root / "out" / "qa"
    qa.mkdir(parents=True, exist_ok=True)
    rep = {"file": str(mp4)}
    pr = json.loads(run([str(FFPROBE), "-v", "error", "-show_streams", "-show_format", "-of", "json", str(mp4)]).stdout)
    for s in pr["streams"]:
        rep[s["codec_type"]] = {"codec": s["codec_name"], "duration": float(s.get("duration", 0)),
                                **({"size": f"{s['width']}x{s['height']}", "fps": s["r_frame_rate"], "pix": s.get("pix_fmt")} if s["codec_type"] == "video" else {"rate": s.get("sample_rate"), "ch": s.get("channels")})}
    e = run([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(mp4), "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    summ = e[e.rfind("Summary:"):]
    I = re.search(r"I:\s+(-?[\d.]+) LUFS", summ)
    tp = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+) dBFS", summ, re.S)
    rep["lufs"] = float(I.group(1)) if I else None
    rep["truePeak"] = float(tp.group(1)) if tp else None
    # YAVG per frame
    y = run([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(mp4), "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-", "-an", "-f", "null", "-"]).stdout
    Y = np.array([float(v) for v in re.findall(r"YAVG=([\d.]+)", y)])
    dips = []
    for i in range(len(Y)):
        lo, hi = max(0, i - 15), min(len(Y), i + 16)
        med = np.median(np.r_[Y[lo:i], Y[i + 1:hi]]) if hi - lo > 1 else Y[i]
        if Y[i] < 0.75 * med or Y[i] < 8:
            dips.append({"frame": i, "t": round(i / 30, 3), "yavg": round(float(Y[i]), 1), "local": round(float(med), 1)})
    rep["yavg"] = {"frames": int(len(Y)), "min": round(float(Y.min()), 1), "median": round(float(np.median(Y)), 1), "max": round(float(Y.max()), 1), "dips": dips[:40]}
    fz = run([str(FFMPEG), "-hide_banner", "-nostats", "-i", str(mp4), "-vf", "freezedetect=n=-62dB:d=0.5", "-an", "-f", "null", "-"]).stderr
    rep["freezes"] = re.findall(r"freeze_start: ([\d.]+).*?freeze_duration: ([\d.]+)", fz, re.S)
    # 2 fps sweep sheets
    dur = rep["video"]["duration"]
    data =subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "error", "-i", str(mp4), "-vf", "fps=2,scale=iw/4:-1", "-f", "image2pipe", "-c:v", "png", "-"], capture_output=True).stdout
    ims, k = [], 0
    while True:
        j = data.find(b"\x89PNG", k + 1)
        chunk = data[k:j] if j > 0 else data[k:]
        if chunk:
            ims.append(Image.open(BytesIO(chunk)).convert("RGB"))
        if j < 0:
            break
        k = j
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except Exception:
        font = ImageFont.load_default()
    half = (len(ims) + 1) // 2
    cols = 8 if a.fmt == "16x9" else 10
    for tag, part, off in (("a", ims[:half], 0), ("b", ims[half:], half)):
        if not part:
            continue
        w, h = part[0].size
        rows = (len(part) + cols - 1) // cols
        S = Image.new("RGB", (cols * (w + 4) + 4, rows * (h + 22) + 4), (18, 18, 18))
        d = ImageDraw.Draw(S)
        for i, im in enumerate(part):
            r, c = divmod(i, cols)
            x, yy = 4 + c * (w + 4), 4 + r * (h + 22)
            S.paste(im, (x, yy + 20))
            d.text((x + 2, yy + 2), f"{(off + i) * 0.5 + 0.25:.2f}s", fill=(230, 230, 230), font=font)
        S.save(qa / f"sweep_{a.fmt}_{tag}.jpg", quality=85)
    for t in (a.frames.split(",") if a.frames else []):
        out = qa / f"mp4_{a.fmt}_{float(t):06.2f}.png"
        subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-ss", t, "-i", str(mp4), "-frames:v", "1", str(out)], check=True)
    (qa / f"qa_{a.fmt}.json").write_text(json.dumps(rep, indent=1), encoding="utf-8")
    v, au = rep.get("video", {}), rep.get("audio", {})
    print(f"{mp4.name}: video {v.get('size')} {v.get('fps')} {v.get('codec')} {v.get('duration', 0):.2f} s · audio {au.get('codec')} {au.get('rate')} Hz {au.get('duration', 0):.2f} s")
    print(f"loudness {rep['lufs']} LUFS, true peak {rep['truePeak']} dBFS")
    yv = rep["yavg"]
    print(f"YAVG min {yv['min']} median {yv['median']} max {yv['max']} · dips: {len(dips)}" + ("" if not dips else " → " + ", ".join(f"{x['t']}s ({x['yavg']} vs {x['local']})" for x in dips[:12])))
    print(f"freezes ≥0.5 s: {rep['freezes'] or 'none'}")
    print(f"sweep sheets: {qa / f'sweep_{a.fmt}_a.jpg'} + _b.jpg ({len(ims)} frames at 2 fps)")


if __name__ == "__main__":
    main()
