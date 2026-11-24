"""Frame-by-frame source analysis: per-frame luma difference (cuts), brightness, dominant hue; audio beat grid + onsets.
usage: python analyze_src.py <video.mp4> <outdir>   (run with the generative-music-video venv: librosa + numpy + PIL)"""
import json
import os
import subprocess
import sys

import numpy as np

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

# video: decode at 30 fps, 96x96 rgb
W = 96
raw = subprocess.run([FF, "-v", "error", "-i", src, "-vf", f"fps=30,scale={W}:{W}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, W, W, 3).astype(np.float32) / 255
n = len(fr)
luma = fr @ np.array([0.299, 0.587, 0.114], np.float32)
bright = luma.mean(axis=(1, 2))
diff = np.r_[0, np.abs(np.diff(luma, axis=0)).mean(axis=(1, 2))]
# histogram distance between consecutive frames (8x8x8)
def hist(f):
    q = (f * 7.999).astype(int)
    idx = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
    h = np.bincount(idx.ravel(), minlength=512).astype(np.float32)
    return h / h.sum()
H = np.array([hist(f) for f in fr])
hd = np.r_[0, 0.5 * np.abs(np.diff(H, axis=0)).sum(1)]
cuts = [i for i in range(1, n) if (diff[i] > 0.09 and diff[i] > 3 * np.median(diff[max(0, i - 8):i + 8]) + 0.01) or hd[i] > 0.45]

# audio
import librosa  # noqa: E402
sr = 22050
y = np.frombuffer(subprocess.run([FF, "-v", "error", "-i", src, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32).copy()
# the decoded source audio stays in memory: never write it to disk
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units="time")
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
# rms per 0.5 s
dur = len(y) / sr
energy = [float(20 * np.log10(rms[(rt >= a) & (rt < a + 0.5)].mean() + 1e-9)) for a in np.arange(0, dur, 0.5)]
# spectral centroid per second
cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
ct = librosa.frames_to_time(np.arange(len(cent)), sr=sr)
centroid = [float(cent[(ct >= a) & (ct < a + 1)].mean()) for a in np.arange(0, dur, 1)]

res = {
    "frames": n, "fps": 30, "duration_s": dur,
    "cuts_frames": cuts, "cuts_s": [round(c / 30, 3) for c in cuts],
    "tempo_bpm": float(np.atleast_1d(tempo)[0]), "beats_s": [round(float(b), 3) for b in beats],
    "onsets_s": [round(float(o), 3) for o in onsets],
    "energy_db_per_0p5s": [round(e, 1) for e in energy],
    "centroid_hz_per_s": [round(c) for c in centroid],
    "brightness_per_s": [round(float(bright[i:i + 30].mean()), 3) for i in range(0, n, 30)],
    "diff_per_frame": [round(float(d), 4) for d in diff],
    "histdiff_per_frame": [round(float(d), 4) for d in hd],
}
json.dump(res, open(os.path.join(out, "src_analysis.json"), "w"), indent=1)
print("frames", n, "dur", round(dur, 2), "tempo", res["tempo_bpm"])
print("cuts", len(cuts), res["cuts_s"])
print("beats", len(beats), res["beats_s"][:40])
print("energy", res["energy_db_per_0p5s"])
print("bright", res["brightness_per_s"])
