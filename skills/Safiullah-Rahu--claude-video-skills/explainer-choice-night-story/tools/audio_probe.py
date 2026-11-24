"""Probe a source's audio: loudness per 0.5 s, noise floor in pauses, spectral balance, onset-based tempo, and a PNG
of the spectrogram + RMS envelope.   usage: python audio_probe.py <video> <out_png>"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.signal import stft, butter, sosfilt

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
src, png = sys.argv[1], sys.argv[2]
SR = 22050
p = subprocess.run([FF, "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
x = np.frombuffer(p.stdout, np.float32).astype(np.float64)
dur = len(x) / SR
hop = int(0.05 * SR)
n = len(x) // hop
rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
db = 20 * np.log10(rms + 1e-9)
print(f"dur {dur:.2f}s  rms dB: p5 {np.percentile(db, 5):.1f} p25 {np.percentile(db, 25):.1f} p50 {np.percentile(db, 50):.1f} p95 {np.percentile(db, 95):.1f}")
# bands
def band(lo, hi):
    sos = butter(4, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    y = sosfilt(sos, x)
    r = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    return 20 * np.log10(r + 1e-9)
lo = band(40, 200); mid = band(300, 3000); hi = band(5000, 10000)
print(f"band medians dB: low {np.median(lo):.1f} mid {np.median(mid):.1f} high {np.median(hi):.1f}")
# quiet frames (pauses): what remains
q = db < np.percentile(db, 15)
print(f"quietest 15%: low {np.median(lo[q]):.1f} mid {np.median(mid[q]):.1f} high {np.median(hi[q]):.1f} (overall {np.median(db[q]):.1f})")
# per-second loudness line
sec = [np.max(db[int(s / 0.05):int((s + 1) / 0.05)]) if int((s + 1) / 0.05) <= n else -99 for s in range(int(dur))]
print("per-second max dB:", " ".join(f"{v:.0f}" for v in sec))
# onset tempo from low+mid flux
f, t, Z = stft(x, SR, nperseg=1024, noverlap=1024 - 256)
S = np.abs(Z)
flux = np.maximum(np.diff(S, axis=1), 0).sum(axis=0)
flux = (flux - flux.mean()) / (flux.std() + 1e-9)
fr = SR / 256
ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
lags = np.arange(len(ac)) / fr
best = []
for bpm in np.arange(50, 180, 0.5):
    L = 60 / bpm * fr
    s = sum(ac[int(round(L * k))] for k in (1, 2, 3, 4) if int(round(L * k)) < len(ac))
    best.append((s, bpm))
best.sort(reverse=True)
print("tempo candidates:", [b for _, b in best[:6]])
# spectrogram png
Sd = 20 * np.log10(S + 1e-6)
Sd = np.clip((Sd - Sd.max() + 80) / 80, 0, 1)
fmax = np.searchsorted(f, 8000)
img = (Sd[:fmax][::-1] * 255).astype(np.uint8)
W = min(2400, img.shape[1])
im = Image.fromarray(img).resize((W, 300))
canvas = Image.new("RGB", (W, 420), (10, 10, 12))
canvas.paste(im.convert("RGB"), (0, 0))
d = ImageDraw.Draw(canvas)
for i in range(n - 1):
    x0, x1 = i / n * W, (i + 1) / n * W
    y0 = 410 - (db[i] + 70) / 70 * 100
    y1 = 410 - (db[i + 1] + 70) / 70 * 100
    d.line([(x0, y0), (x1, y1)], fill=(255, 200, 80))
for s in range(0, int(dur) + 1, 5):
    xx = s / dur * W
    d.line([(xx, 300), (xx, 420)], fill=(80, 80, 90))
    d.text((xx + 2, 302), f"{s}", fill=(200, 200, 200))
canvas.save(png)
print("wrote", png)
