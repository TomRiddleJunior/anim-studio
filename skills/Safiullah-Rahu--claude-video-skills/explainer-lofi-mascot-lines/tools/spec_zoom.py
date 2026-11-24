"""High-resolution spectrogram of a span (0-fmax Hz) to see a quiet voice under music.
usage: python spec_zoom.py <video> <a> <b> <fmax> <out.png>"""
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy.signal import stft

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
src, a, b, fmax, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
SR = 22050
p = subprocess.run([FF, "-v", "error", "-ss", str(a), "-t", str(b - a), "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
x = np.frombuffer(p.stdout, np.float32).astype(np.float64)
f, t, Z = stft(x, SR, nperseg=2048, noverlap=2048 - 128)
S = 20 * np.log10(np.abs(Z) + 1e-7)
k = np.searchsorted(f, fmax)
S = S[:k][::-1]
S = np.clip((S - S.max() + 70) / 70, 0, 1)
im = Image.fromarray((S * 255).astype(np.uint8)).resize((1600, 600))
im.save(out)
print(out)
