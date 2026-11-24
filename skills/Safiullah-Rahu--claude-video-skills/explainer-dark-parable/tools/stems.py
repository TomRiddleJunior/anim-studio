"""Level and character of rea stems: python -I stems.py <stems_dir>"""
import os
import sys

import numpy as np
import soundfile as sf

d = sys.argv[1]
out = {}
for n in ("vocals", "music", "original"):
    p = os.path.join(d, n + ".wav")
    if not os.path.exists(p):
        continue
    a, sr = sf.read(p, always_2d=True)
    a = a.mean(1)
    hop = sr // 2
    rms = np.array([np.sqrt(np.mean(a[i:i + hop] ** 2) + 1e-12) for i in range(0, len(a) - hop, hop)])
    db = 20 * np.log10(rms + 1e-9)
    out[n] = db
    # spectral centroid + band energy of the whole stem
    spec = np.abs(np.fft.rfft(a[: sr * 60] if len(a) > sr * 60 else a))
    f = np.fft.rfftfreq(len(a[: sr * 60] if len(a) > sr * 60 else a), 1 / sr)
    cen = (spec * f).sum() / spec.sum()
    bands = [(20, 120), (120, 400), (400, 1500), (1500, 5000), (5000, 16000)]
    be = [10 * np.log10((spec[(f >= lo) & (f < hi)] ** 2).sum() + 1e-9) for lo, hi in bands]
    mx = max(be)
    print(f"{n:9s} sr={sr} median {np.median(db):6.1f} dB  p90 {np.percentile(db, 90):6.1f}  centroid {cen:6.0f} Hz  bands " +
          " ".join(f"{lo}-{hi}:{b - mx:5.1f}" for (lo, hi), b in zip(bands, be)))
if "vocals" in out and "music" in out:
    v, m = out["vocals"], out["music"]
    n = min(len(v), len(m))
    speech = v[:n] > np.percentile(v[:n], 50)
    print("voice over music while speaking: %.1f dB" % np.median(v[:n][speech] - m[:n][speech]))
    print("music level per 5 s (dB):", " ".join(f"{np.median(m[i:i + 10]):.0f}" for i in range(0, n, 10)))
    print("voice level per 5 s (dB):", " ".join(f"{np.median(v[i:i + 10]):.0f}" for i in range(0, n, 10)))
