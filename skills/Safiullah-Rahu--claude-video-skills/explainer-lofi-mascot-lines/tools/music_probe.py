"""Tempo from percussive onsets (high band) and a chroma profile (key guess) of a music track.
usage: python music_probe.py <video>"""
import subprocess
import sys

import numpy as np
from scipy.signal import stft, butter, sosfilt

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 22050
p = subprocess.run([FF, "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
x = np.frombuffer(p.stdout, np.float32).astype(np.float64)
for lo, hi, name in ((40, 150, "kick band"), (1500, 5000, "snare band"), (6000, 10000, "hat band")):
    y = sosfilt(butter(4, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)
    hop = 256
    e = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)])
    on = np.maximum(np.diff(np.log(e + 1e-6)), 0)
    on = (on - on.mean()) / (on.std() + 1e-9)
    fr = SR / hop
    ac = np.correlate(on, on, "full")[len(on) - 1:]
    res = []
    for bpm in np.arange(55, 190, 0.5):
        L = 60 / bpm * fr
        sc = sum(ac[int(round(L * k))] / k ** 0.3 for k in (1, 2, 3, 4, 6, 8) if int(round(L * k)) < len(ac))
        res.append((sc, bpm))
    res.sort(reverse=True)
    peaks = np.where(on > 2.5)[0] / fr
    print(f"{name}: tempo candidates {[b for _, b in res[:5]]}; strong onsets {np.round(peaks[:24], 2).tolist()}")
f, t, Z = stft(x, SR, nperseg=8192, noverlap=8192 - 2048)
S = np.abs(Z)
chroma = np.zeros(12)
for i, fr_ in enumerate(f):
    if 60 < fr_ < 2000:
        m = 69 + 12 * np.log2(fr_ / 440)
        chroma[int(round(m)) % 12] += S[i].sum()
chroma /= chroma.max()
names = "C C# D D# E F F# G G# A A# B".split()
print("chroma:", " ".join(f"{n}:{c:.2f}" for n, c in zip(names, chroma)))
maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
sc = [(np.corrcoef(chroma, np.roll(maj, k))[0, 1], names[k] + " major") for k in range(12)] + [(np.corrcoef(chroma, np.roll(mnr, k))[0, 1], names[k] + " minor") for k in range(12)]
sc.sort(reverse=True)
print("key guesses:", [(n, round(c, 2)) for c, n in sc[:4]])
