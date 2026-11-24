"""Median f0 (autocorrelation) of voiced 40 ms frames in given spans.  usage: python pitch.py <video> a-b a-b ..."""
import subprocess
import sys

import numpy as np

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 16000
p = subprocess.run([FF, "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
x = np.frombuffer(p.stdout, np.float32).astype(np.float64)
for span in sys.argv[2:]:
    a, b = (float(v) for v in span.split("-"))
    seg = x[int(a * SR):int(b * SR)]
    n = int(0.04 * SR)
    f0s = []
    for i in range(0, len(seg) - n, n // 2):
        fr = seg[i:i + n] * np.hanning(n)
        if np.sqrt(np.mean(fr ** 2)) < 0.02:
            continue
        ac = np.correlate(fr, fr, "full")[n - 1:]
        lo, hi = int(SR / 350), int(SR / 60)
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] / (ac[0] + 1e-9) > 0.45:
            f0s.append(SR / k)
    f0s = np.array(f0s)
    if len(f0s):
        print(f"{span}: n={len(f0s)} median {np.median(f0s):.0f} Hz  p10 {np.percentile(f0s, 10):.0f}  p90 {np.percentile(f0s, 90):.0f}")
    else:
        print(span, "no voiced frames")
