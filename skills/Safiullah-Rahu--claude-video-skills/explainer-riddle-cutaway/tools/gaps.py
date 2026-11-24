"""Gaps in a soundtrack: level and spectral centroid in each pause. python -I gaps.py <wav|mp4-extracted wav>"""
import sys

import numpy as np
import soundfile as sf

a, sr = sf.read(sys.argv[1], always_2d=True)
a = a.mean(1)
hop = int(sr * 0.05)
fr = [a[i:i + hop] for i in range(0, len(a) - hop, hop)]
db = np.array([20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9) for x in fr])
thr = np.percentile(db, 60) - 18
quiet = db < thr
runs, s = [], None
for i, q in enumerate(quiet):
    if q and s is None:
        s = i
    if not q and s is not None:
        if i - s >= 6:
            runs.append((s, i))
        s = None
print(f"speech-level p60 {np.percentile(db, 60):.1f} dB, gap threshold {thr:.1f} dB")
for s, e in runs:
    seg = np.concatenate(fr[s:e])
    sp = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(len(seg), 1 / sr)
    cen = (sp * f).sum() / (sp.sum() + 1e-12)
    print(f"gap {s * 0.05:6.2f}-{e * 0.05:6.2f}s  level {np.median(db[s:e]):6.1f} dB  max {db[s:e].max():6.1f}  centroid {cen:6.0f} Hz")
