"""Loudness gates for the mix: integrated LUFS and true peak of a file (default: the rendered mp4), and voice-over-bed
level during speech from the score stems (vo.wav vs music.wav + sfx.wav, same gain staging as the mix).
Writes out/qa/audio_qa.json.

usage: ~/.generative-music-video/venv/Scripts/python.exe -I tools/audio_qa.py [out/money-news.mp4]
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", os.path.basename(ROOT) + ".mp4")
if not os.path.isabs(src):
    src = os.path.join(ROOT, src)
err = subprocess.run([FF, "-hide_banner", "-nostats", "-i", src, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"],
                     capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])
TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])
vo = json.load(open(os.path.join(ROOT, "score", "data", "vo.json"), encoding="utf-8"))
v, sr = sf.read(os.path.join(ROOT, "score", "audio", "vo.wav"), always_2d=False)
m, _ = sf.read(os.path.join(ROOT, "score", "audio", "music.wav"), always_2d=True)
s, _ = sf.read(os.path.join(ROOT, "score", "audio", "sfx.wav"), always_2d=True)
mix_raw, _ = sf.read(os.path.join(ROOT, "score", "audio", "mix_raw.wav"), always_2d=True)
n = min(len(v), len(m), len(mix_raw))
# the vo stem is pre-gain; recover its gain in mix_raw by least squares: mix - music - sfx = g * vo (reverb aside)
bed = (m[:n] + s[:n]).mean(axis=1)
res = mix_raw[:n].mean(axis=1) - bed
g = float(np.dot(res, v[:n]) / max(np.dot(v[:n], v[:n]), 1e-12))
speech = np.zeros(n, bool)
for l in vo["lines"]:
    speech[int(l["start"] * sr):min(n, int(l["end"] * sr))] = True


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


v_db, mus_db, bed_db = db(g * v[:n][speech]), db(m[:n].mean(axis=1)[speech]), db(bed[speech])
out = {"file": os.path.basename(src), "integrated_lufs": I, "true_peak_dbtp": TP, "voice_minus_music_db": round(v_db - mus_db, 1),
       "voice_minus_music_plus_sfx_db": round(v_db - bed_db, 1),
       "gates": {"lufs_-14_pm1": bool(abs(I + 14) <= 1), "true_peak_le_-1": bool(TP <= -1.0), "voice_10db_over_music": bool(v_db - mus_db >= 10)}}
os.makedirs(os.path.join(ROOT, "out", "qa"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "out", "qa", "audio_qa.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
