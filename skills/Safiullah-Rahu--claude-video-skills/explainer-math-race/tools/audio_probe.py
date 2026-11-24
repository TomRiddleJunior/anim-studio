"""Probe a source reel's audio: tempo (librosa beat tracker), onset density, loudness curve per second, spectral
centroid and a crude 'voice band vs rest' ratio, so the original bed can match the source's BPM and energy curve.

usage: <venv python> -I tools/audio_probe.py <media.mp4> [out.json]
"""
import json
import subprocess
import sys
import tempfile
import os

import numpy as np
import librosa

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"


def main(src, out=None):
    tmp = os.path.join(tempfile.gettempdir(), "probe_%d.wav" % os.getpid())
    subprocess.run([FF, "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "22050", tmp], check=True)
    y, sr = librosa.load(tmp, sr=22050)
    os.remove(tmp)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    bt = librosa.frames_to_time(beats, sr=sr)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units="time")
    hop = sr // 2
    rms = [float(20 * np.log10(np.sqrt(np.mean(y[i:i + hop] ** 2)) + 1e-9)) for i in range(0, len(y) - hop, hop)]
    cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    S = np.abs(librosa.stft(y, n_fft=2048))
    f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = S[f < 150].sum(); mid = S[(f >= 150) & (f < 4000)].sum(); hi = S[f >= 4000].sum()
    res = {
        "duration": round(len(y) / sr, 2),
        "tempo_bpm": round(float(np.atleast_1d(tempo)[0]), 1),
        "beats": [round(float(b), 3) for b in bt],
        "onsets_per_s": round(len(onsets) / (len(y) / sr), 2),
        "rms_db_per_half_s": [round(r, 1) for r in rms],
        "centroid_hz_mean": round(float(cent.mean()), 0),
        "band_share": {"<150": round(float(low / (low + mid + hi)), 3), "150-4k": round(float(mid / (low + mid + hi)), 3),
                       ">4k": round(float(hi / (low + mid + hi)), 3)},
    }
    txt = json.dumps(res, indent=1)
    if out:
        open(out, "w", encoding="utf-8").write(txt)
    print(json.dumps({k: v for k, v in res.items() if k != "beats"}, indent=1))
    print("first beats", res["beats"][:12])


if __name__ == "__main__":
    main(*sys.argv[1:])
