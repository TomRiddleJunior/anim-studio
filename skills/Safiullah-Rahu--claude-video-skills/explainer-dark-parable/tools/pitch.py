"""Median f0 of a voice track (autocorrelation on voiced 40 ms frames): python -I pitch.py <wav> [t0 t1]"""
import sys

import numpy as np
import soundfile as sf

a, sr = sf.read(sys.argv[1], always_2d=True)
a = a.mean(1)
if len(sys.argv) > 3:
    a = a[int(float(sys.argv[2]) * sr):int(float(sys.argv[3]) * sr)]
n = int(0.04 * sr)
f0s = []
lev = []
for i in range(0, len(a) - n, n // 2):
    x = a[i:i + n] * np.hanning(n)
    e = np.sqrt(np.mean(x ** 2))
    lev.append(e)
lev = np.array(lev)
thr = np.percentile(lev, 70) * 0.5
for k, i in enumerate(range(0, len(a) - n, n // 2)):
    if lev[k] < thr:
        continue
    x = a[i:i + n] - a[i:i + n].mean()
    r = np.correlate(x, x, "full")[n - 1:]
    lo, hi = int(sr / 350), int(sr / 60)
    j = lo + np.argmax(r[lo:hi])
    if r[j] > 0.45 * r[0]:
        f0s.append(sr / j)
f0s = np.array(f0s)
print(f"voiced frames {len(f0s)}  median f0 {np.median(f0s):.0f} Hz  p10/p90 {np.percentile(f0s, 10):.0f}/{np.percentile(f0s, 90):.0f}")
