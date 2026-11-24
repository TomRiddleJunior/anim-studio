"""Audio study of a source reel (for reference only): tempo / tempogram peaks, energy curve, bed level in the speech gaps.
usage: <venv python with librosa> -X utf8 -I audio_study.py <video.mp4> <transcript_whisper.txt> <out.json>
"""
import json
import os
import re
import subprocess
import sys

import librosa
import numpy as np

FF = os.environ.get("FFMPEG_PATH", "ffmpeg")


def main(mp4, tr, out):
    wav = out.replace(".json", ".wav")
    subprocess.run([FF, "-y", "-v", "error", "-i", mp4, "-vn", "-ac", "1", "-ar", "22050", wav], check=True)
    y, sr = librosa.load(wav, sr=22050)
    dur = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    oenv = librosa.onset.onset_strength(y=y, sr=sr)
    tg = librosa.feature.tempogram(onset_envelope=oenv, sr=sr)
    ac = tg.mean(axis=1)
    bpms = librosa.tempo_frequencies(tg.shape[0], sr=sr)
    cand = [(float(bpms[i]), float(ac[i])) for i in np.argsort(-ac) if 60 <= bpms[i] <= 180][:6]
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    db = 20 * np.log10(rms + 1e-9)
    # speech segments from whisper transcript
    segs = [(float(a), float(b)) for a, b in re.findall(r"\[\s*([\d.]+)-\s*([\d.]+)\]", open(tr, encoding="utf-8").read())]
    speech = np.zeros_like(t, dtype=bool)
    for a, b in segs:
        speech |= (t >= a) & (t <= b)
    dec = [round(float(np.mean(db[(t >= dur * k / 10) & (t < dur * (k + 1) / 10)])), 1) for k in range(10)]
    # low band (music bass) vs speech band energy
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = 20 * np.log10(S[(f > 30) & (f < 150)].mean(axis=0) + 1e-9)
    mid = 20 * np.log10(S[(f > 300) & (f < 3000)].mean(axis=0) + 1e-9)
    rep = {
        "dur": round(dur, 2), "beat_track_bpm": float(np.atleast_1d(tempo)[0]), "n_beats": int(len(beats)),
        "tempogram_peaks": cand,
        "rms_db_speech_p50": round(float(np.median(db[speech])), 1) if speech.any() else None,
        "rms_db_gaps_p50": round(float(np.median(db[~speech])), 1) if (~speech).any() else None,
        "rms_db_deciles": dec,
        "low_band_db_p50": round(float(np.median(low)), 1), "low_band_db_gaps_p50": round(float(np.median(low[~speech[:len(low)]])), 1),
        "mid_band_db_p50": round(float(np.median(mid)), 1),
        "beat_times_first16": [round(float(x), 2) for x in librosa.frames_to_time(beats, sr=sr)[:16]],
    }
    json.dump(rep, open(out, "w"), indent=1)
    os.remove(wav)
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main(*sys.argv[1:4])
