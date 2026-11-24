import sys, numpy as np, soundfile as sf, librosa, librosa.display, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
fs = sys.argv[1:-1]; out = sys.argv[-1]
fig, ax = plt.subplots(len(fs), 1, figsize=(22, 4 * len(fs)), sharex=True)
ax = np.atleast_1d(ax)
for a, f in zip(ax, fs):
    y, sr = sf.read(f); y = y.mean(axis=1) if y.ndim > 1 else y
    y = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=22050)
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=256)), ref=np.max)
    librosa.display.specshow(S, sr=22050, hop_length=256, x_axis="time", y_axis="log", ax=a, cmap="magma"); a.set_title(f[-40:])
ax[-1].set_xticks(np.arange(0, len(y) / 22050, 1.0))
plt.tight_layout(); plt.savefig(out, dpi=60)
