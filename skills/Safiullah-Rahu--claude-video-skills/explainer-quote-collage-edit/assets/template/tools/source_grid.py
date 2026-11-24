"""Read a source reel's beat grid from its audio, IN MEMORY ONLY (no audio is ever written to disk).
Prints and saves (numbers only) the tempo, beat times and phase, onset strengths at each beat, the strongest hits,
low-band (kick/808) jumps, the drop and where the beat stops.
usage: ~/.generative-music-video/venv/Scripts/python.exe -X utf8 -I tools/source_grid.py <source.mp4> <out.json>"""
import json
import subprocess
import sys

import numpy as np

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR, HOP, N = 22050, 110, 1024          # 5 ms hop

src, outp = sys.argv[1], sys.argv[2]
x = np.frombuffer(subprocess.run([FF, "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, dtype=np.float32)
dur = len(x) / SR
fr = np.lib.stride_tricks.sliding_window_view(np.pad(x, (N // 2, N // 2)), N)[::HOP] * np.hanning(N)
mag = np.abs(np.fft.rfft(fr, axis=1))
flux = np.concatenate([[0], np.maximum(np.diff(np.log1p(mag), axis=0), 0).sum(axis=1)])
flux = (flux - flux.mean()) / flux.std()
lowb = int(150 / (SR / N))
low = np.log1p(mag[:, 1:lowb].sum(axis=1))
lowflux = np.concatenate([[0], np.maximum(np.diff(low), 0)])
rms = np.sqrt((fr ** 2).mean(axis=1))
t = np.arange(len(flux)) * HOP / SR

# tempo from the flux autocorrelation, refined to 0.1 ms
ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
lags = np.arange(len(ac)) * HOP / SR
sel = (lags > 60 / 180) & (lags < 60 / 80)
period = lags[sel][np.argmax(ac[sel])]
# refine the period by comb scoring around it, and find the phase of beat 0
def comb(p, ph):
    ts = np.arange(ph, dur - 0.05, p)
    idx = np.clip((ts / (HOP / SR)).round().astype(int), 0, len(flux) - 1)
    w = 4
    return float(np.mean([flux[max(0, i - w):i + w + 1].max() for i in idx]))
best = (-9, None, None)
for p in np.arange(period - 0.012, period + 0.012, 0.0005):
    for ph in np.arange(0, p, 0.005):
        s = comb(p, ph)
        if s > best[0]:
            best = (s, p, ph)
_, P, PH = best
beats = np.arange(PH, dur, P)
w = int(0.03 * SR / HOP)
def local(arr, tt):
    i = int(round(tt / (HOP / SR)))
    return float(arr[max(0, i - w):i + w + 1].max())
beat_flux = [round(local(flux, b), 2) for b in beats]
beat_low = [round(local(lowflux, b), 3) for b in beats]
# strongest onsets (peaks of flux, >= 0.12 s apart)
pk = [i for i in range(1, len(flux) - 1) if flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1] and flux[i] > 2.0]
pk = sorted(pk, key=lambda i: -flux[i])
hits = []
for i in pk:
    if all(abs(t[i] - h[0]) > 0.12 for h in hits):
        hits.append((round(float(t[i]), 3), round(float(flux[i]), 2)))
    if len(hits) >= 30:
        break
hits.sort()
# low-band energy steps (1 s smoothed rise) and where the music stops (rms falls under 10 % of its median for > 0.15 s)
k = int(0.5 * SR / HOP)
sm = np.convolve(low, np.ones(k) / k, "same")
rise = np.zeros_like(sm)
rise[k:-k] = sm[2 * k:] - sm[:-2 * k]
drops = []
for i in np.argsort(rise)[::-1]:
    if all(abs(t[i] - d) > 1.0 for d in drops):
        drops.append(float(t[i]))
    if len(drops) >= 3:
        break
med = np.median(rms[(t > 1) & (t < dur - 1)])
quiet = rms < 0.1 * med
stop = None
for i in range(int(2 / (HOP / SR)), len(rms) - 30):
    if quiet[i:i + 30].all():
        stop = float(t[i])
        break
# low-band 808 envelope per beat (how much bass each beat carries) to mark break vs drop
seg_low = [round(float(sm[min(len(sm) - 1, int(round(b / (HOP / SR))))]), 2) for b in beats]
res = {"duration_s": round(dur, 3), "tempo_bpm": round(60 / P, 2), "period_s": round(P, 4), "beat0_s": round(PH, 4),
       "beats_s": [round(float(b), 3) for b in beats], "beat_flux_z": beat_flux, "beat_lowflux": beat_low, "beat_lowband": seg_low,
       "top_onsets": hits, "low_rises_s": [round(d, 2) for d in drops], "music_stops_s": round(stop, 3) if stop else None}
json.dump(res, open(outp, "w"), indent=1)
print(f"dur {dur:.2f}  tempo {60 / P:.2f} BPM  period {P:.4f}  beat0 {PH:.3f}  comb {best[0]:.2f}")
print("beats:", " ".join(f"{b:.2f}" for b in beats))
print("flux@beats:", beat_flux)
print("lowband@beats:", seg_low)
print("top onsets:", hits)
print("low rises:", [round(d, 2) for d in drops], " stop:", stop)
