"""Voice vs music from a stem split (e.g. a separated vocals.wav / music.wav pair): voice active fraction and level,
music level under the voice, voice f0 (median, p10, p90), music onsets and their median spacing (triplets vs straight).
usage: python stems_probe.py <vocals file> <music file>      (FFMPEG env var or ffmpeg on PATH)"""
import os
import subprocess
import sys

import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
SR = 22050


def load(p):
    r = subprocess.run([FF, "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.float32)


v, m = load(sys.argv[1]), load(sys.argv[2])
win = SR // 4
rmsdb = lambda x: np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + win] ** 2)) + 1e-9) for i in range(0, len(x) - win, win)])  # noqa: E731
rv, rm = rmsdb(v), rmsdb(m)
act = rv > rv.max() - 25
print(f"voice active {act.mean():.2f}; voice {np.median(rv[act]):.1f} dB while speaking; music {np.median(rm):.1f} dB "
      f"({np.median(rm[act[:len(rm)]]):.1f} under speech)")
f0s, n = [], 1024
for i in range(0, len(v) - n, 512):
    fr = v[i:i + n] - v[i:i + n].mean()
    if np.sqrt(np.mean(fr ** 2)) < 10 ** ((rv.max() - 20) / 20):
        continue
    ac = np.correlate(fr, fr, "full")[n - 1:]
    lo, hi = SR // 400, SR // 70
    k = lo + np.argmax(ac[lo:hi])
    if ac[k] > 0.4 * ac[0]:
        f0s.append(SR / k)
f0s = np.array(f0s)
print(f"voice f0 median {np.median(f0s):.0f} Hz (p10 {np.percentile(f0s, 10):.0f}, p90 {np.percentile(f0s, 90):.0f})")
hop = 256
S = np.abs(np.fft.rfft(np.lib.stride_tricks.sliding_window_view(m, 2048)[::hop] * np.hanning(2048), axis=1))
flux = np.maximum(0, np.diff(np.log1p(S * 10), axis=0)).sum(1)
flux = (flux - flux.mean()) / flux.std()
ts = (np.arange(len(flux)) + 1) * hop / SR
pk = [i for i in range(3, len(flux) - 3) if flux[i] > 1.5 and flux[i] == flux[i - 3:i + 4].max()]
print("music onsets:", " ".join(f"{ts[i]:.2f}" for i in pk[:60]))
print(f"median onset spacing {np.median(np.diff(ts[pk])):.3f} s")
