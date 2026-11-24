"""Does a reel have a music bed under the voice? Prints the 50 ms RMS distribution (dB re full scale) and the spectrum of
the quietest 10 % of windows (a bed shows up as a steady floor with tonal/bass content; voice-only drops toward -60 dB),
plus a pitch estimate of the voice (median f0 via autocorrelation on voiced windows).

usage: python -I tools/floor_probe.py <media.mp4>
"""
import subprocess
import sys

import numpy as np

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 16000


def main(src):
    p = subprocess.run([FF, "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    y = np.frombuffer(p.stdout, np.float32)
    w = int(0.05 * SR)
    n = len(y) // w
    fr = y[: n * w].reshape(n, w)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
    print("RMS dB percentiles 5/10/25/50/75/95:", np.percentile(db, [5, 10, 25, 50, 75, 95]).round(1))
    q = fr[db <= np.percentile(db, 10)]
    spec = np.abs(np.fft.rfft(q * np.hanning(w), axis=1)).mean(axis=0)
    f = np.fft.rfftfreq(w, 1 / SR)
    bands = [(0, 150), (150, 500), (500, 2000), (2000, 8000)]
    tot = spec.sum() + 1e-12
    print("quietest-10% band shares:", {f"{a}-{b}": round(float(spec[(f >= a) & (f < b)].sum() / tot), 3) for a, b in bands})
    f0s = []
    for k in np.where(db > np.percentile(db, 60))[0]:
        x = fr[k] - fr[k].mean()
        ac = np.correlate(x, x, "full")[w - 1:]
        lo, hi = int(SR / 300), int(SR / 70)
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] > 0.35 * ac[0]:
            f0s.append(SR / lag)
    if f0s:
        print("voice f0 median/p10/p90 Hz:", round(float(np.median(f0s)), 1), np.percentile(f0s, [10, 90]).round(1), "n", len(f0s))


if __name__ == "__main__":
    main(sys.argv[1])
