"""Audio probe: RMS curve (dB per 0.25 s), onset times, tempo candidates by autocorrelation, band energies per 2 s and
a chroma ranking. usage: python audio_probe.py <media file>      (FFMPEG env var or ffmpeg on PATH)"""
import os
import subprocess
import sys

import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
SR = 22050
p = subprocess.run([FF, "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
x = np.frombuffer(p.stdout, np.float32)
dur = len(x) / SR
print(f"dur {dur:.2f}s")
win = int(SR * 0.25)
rms = [20 * np.log10(np.sqrt(np.mean(x[i:i + win] ** 2)) + 1e-9) for i in range(0, len(x) - win, win)]
print("RMS dB per 0.25 s:")
for i in range(0, len(rms), 8):
    print(f"{i * 0.25:6.2f}: " + " ".join(f"{v:6.1f}" for v in rms[i:i + 8]))
n, hop = 1024, 256
frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
S = np.abs(np.fft.rfft(frames, axis=1))
flux = np.maximum(0, np.diff(np.log1p(S * 10), axis=0)).sum(1)
flux = (flux - flux.mean()) / (flux.std() + 1e-9)
ts = (np.arange(len(flux)) + 1) * hop / SR
pk = [i for i in range(2, len(flux) - 2) if flux[i] > 2.0 and flux[i] == flux[i - 2:i + 3].max()]
print("onsets (z>2):", " ".join(f"{t:.2f}" for t in ts[pk]))
ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
lags = np.arange(len(ac)) * hop / SR
m = (lags > 0.3) & (lags < 1.5)
print("tempo candidates (BPM):", " ".join(f"{60 / l:.1f}" for l in lags[m][np.argsort(ac[m])[::-1][:5]]))
freqs = np.fft.rfftfreq(n, 1 / SR)
bands = [(20, 120), (120, 400), (400, 2000), (2000, 6000), (6000, 11000)]
print("band dB per 2 s  [sub, low, mid, hi, air]")
fr_t = np.arange(len(S)) * hop / SR
for t0 in np.arange(0, dur, 2.0):
    sel = (fr_t >= t0) & (fr_t < t0 + 2)
    if not sel.any():
        continue
    e = [10 * np.log10(np.mean(S[sel][:, (freqs >= a) & (freqs < b)] ** 2) + 1e-12) for a, b in bands]
    cen = (S[sel] * freqs).sum(1) / (S[sel].sum(1) + 1e-9)
    print(f"{t0:5.1f}: " + " ".join(f"{v:6.1f}" for v in e) + f"   centroid {np.median(cen):6.0f} Hz")
chroma = np.zeros(12)
for k, f in enumerate(freqs):
    if 60 < f < 2000:
        chroma[int(round(12 * np.log2(f / 261.63))) % 12] += (S[:, k] ** 2).sum()
names = "C C# D D# E F F# G G# A A# B".split()
print("chroma rank:", " ".join(f"{names[i]}:{chroma[i] / chroma.max():.2f}" for i in np.argsort(chroma)[::-1][:7]))
