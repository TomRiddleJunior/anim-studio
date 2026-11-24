"""Score a list of change times against a source reel's onsets (after the lead's endure_offset.py): for each start
offset of the source audio, the mean z-scored spectral flux within ±30 ms of each change. Audio stays in memory.
usage: python -X utf8 -I tools/onset_score.py <source.mp4> <times.json>   (times.json: {"name": [t, ...], ...})
       optional third arg: an mp4 of ours -> also detect its visual change times from frame differences and score them"""
import json
import subprocess
import sys

import numpy as np

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR, HOP, N = 22050, 110, 1024

raw = subprocess.run([FF, "-v", "error", "-i", sys.argv[1], "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
fr = np.lib.stride_tricks.sliding_window_view(np.pad(x, (N // 2, N // 2)), N)[::HOP] * np.hanning(N)
mag = np.abs(np.fft.rfft(fr, axis=1))
flux = np.concatenate([[0], np.maximum(np.diff(np.log1p(mag), axis=0), 0).sum(axis=1)])
flux = (flux - flux.mean()) / flux.std()
W = int(0.03 * SR / HOP)


def score(times, off):
    idx = np.clip(((np.array(times) + off) / (HOP / SR)).astype(int), 0, len(flux) - 1)
    return float(np.mean([flux[max(0, i - W):i + W + 1].max() for i in idx]))


def report(name, times):
    offs = np.arange(0, 2.5, 0.01)
    sc = np.array([score(times, o) for o in offs])
    best = np.argsort(sc)[::-1][:3]
    print(f"{name:28s} n={len(times):2d}  offset 0.00: {sc[0]:.2f}   best: " + ", ".join(f"{offs[i]:.2f} s ({sc[i]:.2f})" for i in best))
    return {"n": len(times), "score_at_0": round(float(sc[0]), 3), "best": [[round(float(offs[i]), 2), round(float(sc[i]), 3)] for i in best]}


T = json.load(open(sys.argv[2], encoding="utf-8"))
out = {k: report(k, v) for k, v in T.items()}
if len(sys.argv) > 3:
    # visual change times of our mp4: frames whose mean abs luma step is a local peak above 6 (of 255)
    raw = subprocess.run([FF, "-v", "error", "-i", sys.argv[3], "-vf", "scale=180:320,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, 320, 180).astype(np.int16)
    d = np.r_[0, np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))]
    ev, last = [], -9
    for i in range(1, len(d) - 1):
        if d[i] > 6 and d[i] >= d[i - 1] and d[i] >= d[i + 1] and (i / 30 - last) > 0.2:
            ev.append(round(i / 30, 3))
            last = i / 30
    print("visual changes detected in our mp4:", ev)
    out["detected_in_mp4"] = dict(report("detected in our mp4", ev), times=ev)
json.dump(out, open(sys.argv[2].replace(".json", "_score.json"), "w"), indent=1)
