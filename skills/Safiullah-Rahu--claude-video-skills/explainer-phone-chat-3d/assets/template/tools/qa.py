"""QA for the delivered files: stream durations and frame counts, loudness and true peak of both mixes, the edge
black-band scan, the largest brightness step between frames (the film has no cuts, so a big step is a bug), 2 fps sweep
sheets, and the sync check (the first key click's audio onset against its key-press time).
Writes out/qa/gates.json, bands.json, sweep_NN.jpg.   usage: python -X utf8 -I tools/qa.py
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.path.basename(ROOT)
FF, FP = paths.ffmpeg(), paths.ffprobe()
TM = json.load(open(os.path.join(ROOT, "score", "timing.json"), encoding="utf-8"))
QA = os.path.join(ROOT, "out", "qa")
os.makedirs(QA, exist_ok=True)
FULL = os.path.join(ROOT, "out", KEY + ".mp4")
NOM = os.path.join(ROOT, "out", KEY + "_nomusic.mp4")


def streams(p):
    r = subprocess.run([FP, "-v", "error", "-count_frames", "-show_entries", "stream=codec_type,duration,nb_read_frames,width,height", "-of", "json", p], capture_output=True, text=True)
    o = {}
    for s in json.loads(r.stdout)["streams"]:
        o[s["codec_type"]] = dict(duration=round(float(s["duration"]), 4), frames=int(s["nb_read_frames"]), size=f'{s.get("width")}x{s.get("height")}' if s["codec_type"] == "video" else None)
    return o


def loud(p):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", p, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    return dict(lufs=float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1)), true_peak_dbtp=float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1)))


def frames(p, fps, w, h, fmt):
    ch = 1 if fmt == "gray" else 3
    pr = subprocess.Popen([FF, "-v", "error", "-i", p, "-vf", f"fps={fps},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", fmt, "-"], stdout=subprocess.PIPE)
    while True:
        b = pr.stdout.read(w * h * ch)
        if len(b) < w * h * ch:
            break
        yield np.frombuffer(b, np.uint8).reshape((h, w) if ch == 1 else (h, w, 3))
    pr.wait()


def main():
    g = {}
    sf_, sn = streams(FULL), streams(NOM)
    g["streams"] = dict(full=sf_, nomusic=sn, composition=dict(duration=TM["dur"], frames=TM["frames"]),
                        gate="video frames = composition frames in both files; |video - audio| <= 0.05 s",
                        **{"pass": sf_["video"]["frames"] == TM["frames"] == sn["video"]["frames"] and all(abs(x["video"]["duration"] - x["audio"]["duration"]) <= 0.05 for x in (sf_, sn))})
    lf, ln = loud(FULL), loud(NOM)
    g["loudness_full"] = dict(**lf, gate="-14 +-1 LUFS, TP <= -1 dBTP", **{"pass": abs(lf["lufs"] + 14) <= 1 and lf["true_peak_dbtp"] <= -1})
    g["loudness_nomusic"] = dict(**ln, gate="effects alone at the level they have in the full mix (quieter by design); TP <= -1 dBTP", **{"pass": ln["true_peak_dbtp"] <= -1})
    # edge black bands + brightness steps (10 fps for bands, every frame for steps)
    worst, viol = [], []
    for i, f in enumerate(frames(FULL, 10, 270, 480, "gray")):
        a = f.astype(np.float32)
        rows = (a.mean(1) < 6) & (a.std(1) < 3)
        if rows.all():
            viol.append([round(i / 10, 1), "black frame"]); continue
        bot = next((k for k in range(480) if not rows[479 - k]), 480)
        top = next((k for k in range(480) if not rows[k]), 480)
        if max(bot, top) * 4 >= 24:
            viol.append([round(i / 10, 1), top * 4, bot * 4])
        worst.append(max(bot, top) * 4)
    json.dump(dict(fps=10, min_band_px=24, planned_dark=[], violations=viol, worst_px=max(worst) if worst else 0), open(os.path.join(QA, "bands.json"), "w"), indent=1)
    g["edge_black_bands"] = dict(violations=len(viol), worst_px=max(worst) if worst else 0, gate="no band >= 24 px (the film has no planned black beats)", **{"pass": not viol})
    prev, steps, ymin, ymax = None, [], 255, 0
    for i, f in enumerate(frames(FULL, 30, 135, 240, "gray")):
        y = float(f.mean())
        ymin, ymax = min(ymin, y), max(ymax, y)
        if prev is not None:
            steps.append((abs(y - prev), i / 30))
        prev = y
    steps.sort(reverse=True)
    g["brightness"] = dict(min=round(ymin, 1), max=round(ymax, 1), largest_step=round(steps[0][0], 1), at_s=round(steps[0][1], 2), gate="largest frame-to-frame step < 12 (no cuts, no flashes)", **{"pass": steps[0][0] < 12})
    # sync: the first key click in the effects-only audio against its key-press time
    r = subprocess.run([FF, "-v", "error", "-i", NOM, "-map", "0:a", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True)
    au = np.frombuffer(r.stdout, np.float32)
    k0 = TM["turns"][0]["keys"][0]["t"]
    seg = np.abs(au[: int((k0 + 0.3) * 48000)])
    onset = int(np.argmax(seg > 0.25 * seg.max())) / 48000
    g["sync"] = dict(first_key_s=k0, first_click_onset_s=round(onset, 4), offset_ms=round((onset - k0) * 1000, 1), gate="|offset| <= 1 frame (33 ms)", **{"pass": abs(onset - k0) <= 0.034})
    # 2 fps sweeps
    tw, th = 216, 384
    tiles = [Image.fromarray(f) for f in frames(FULL, 2, tw, th, "rgb24")]
    font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 16) if os.name == "nt" else ImageFont.load_default()
    for s in range(0, len(tiles), 40):
        chunk = tiles[s:s + 40]
        rows_ = (len(chunk) + 9) // 10
        sheet = Image.new("RGB", (10 * tw, rows_ * (th + 22)), (16, 16, 16))
        d = ImageDraw.Draw(sheet)
        for k, im in enumerate(chunk):
            x, y = (k % 10) * tw, (k // 10) * (th + 22)
            sheet.paste(im, (x, y + 22))
            d.text((x + 4, y + 3), f"{(s + k) / 2:.1f}s", fill=(230, 230, 230), font=font)
        sheet.save(os.path.join(QA, f"sweep_{s // 40 + 1:02d}.jpg"), quality=84)
    g["sweeps"] = dict(tiles=len(tiles), sheets=(len(tiles) + 39) // 40)
    g["all_pass"] = all(v.get("pass", True) for v in g.values() if isinstance(v, dict))
    json.dump(g, open(os.path.join(QA, "gates.json"), "w"), indent=1)
    print(json.dumps(g, indent=1))


if __name__ == "__main__":
    main()
