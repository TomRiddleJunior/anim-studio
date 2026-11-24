"""Spectrogram + onset/beat strip of an analysed source (audio decoded in memory, never saved).
usage: python spec.py <srcA_dir> <source.mp4> <out.png>"""
import json
import os
import sys

import librosa
import librosa.display  # noqa: F401
import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

import subprocess
d, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
sr = 22050
FF = "engine/node_modules/ffmpeg-static/ffmpeg.exe"
y = np.frombuffer(subprocess.run([FF, "-v", "error", "-i", src, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32).copy()
a = json.load(open(os.path.join(d, "src_analysis.json")))
S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=256)), ref=np.max)
fig, ax = plt.subplots(3, 1, figsize=(22, 10), sharex=True, gridspec_kw={"height_ratios": [3, 1, 1]})
librosa.display.specshow(S, sr=sr, hop_length=256, x_axis="time", y_axis="log", ax=ax[0], cmap="magma")
for b in a["beats_s"]:
    ax[0].axvline(b, color="cyan", lw=0.5, alpha=0.6)
for c in a["cuts_s"]:
    ax[0].axvline(c, color="lime", lw=1.5)
# low band (kick) and high band (hats) envelopes
D = np.abs(librosa.stft(y, n_fft=1024, hop_length=256))
f = librosa.fft_frequencies(sr=sr, n_fft=1024)
t = librosa.frames_to_time(np.arange(D.shape[1]), sr=sr, hop_length=256)
low = D[(f > 30) & (f < 120)].sum(0)
mid = D[(f > 150) & (f < 2000)].sum(0)
hi = D[(f > 6000)].sum(0)
ax[1].plot(t, low / low.max(), lw=0.7, label="30-120 Hz")
ax[1].plot(t, hi / hi.max(), lw=0.7, label=">6 kHz")
ax[1].legend(loc="upper right")
ax[2].plot(t, mid / mid.max(), lw=0.7, color="orange", label="150-2k")
ax[2].legend(loc="upper right")
ax[2].set_xticks(np.arange(0, t[-1], 1.0))
plt.tight_layout()
plt.savefig(out, dpi=70)
print(out)
