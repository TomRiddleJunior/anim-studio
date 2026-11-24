"""Bookend the generated song for the film: a 4-bar pre-roll built from the song's own instrumental stems (a low-pass
build on the chorus groove that lands exactly on the song's first downbeat) and a quiet tail for END OF SHOW.

  ~/.generative-music-video/venv/Scripts/python.exe tools/bookend_audio.py --take audio/take.wav [--bars 4] [--tail 6.5]

Needs the take's analysis (analysis/stems/*.wav, data/audio.json) — run it on the bare take first, then re-run
`gmv.py analyze` on the bookended audio/song.wav. Writes audio/song.wav and audio/bookends.json (the offset).
"""
import argparse, json
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa

ROOT = Path(__file__).resolve().parents[1]


def sweep_lowpass(x, sr, fc0, fc1, order=4, n_fft=4096, hop=512):
    """Time-varying low-pass (exponential cutoff sweep fc0 → fc1) by STFT masking, per channel."""
    out = []
    for ch in x.T:
        S = librosa.stft(ch, n_fft=n_fft, hop_length=hop)
        f = librosa.fft_frequencies(sr=sr, n_fft=n_fft)[:, None]
        u = np.linspace(0, 1, S.shape[1])[None, :]
        fc = fc0 * (fc1 / fc0) ** (u ** 1.6)
        mask = 1.0 / np.sqrt(1.0 + (f / fc) ** (2 * order))
        out.append(librosa.istft(S * mask, hop_length=hop, length=len(ch)))
    return np.stack(out, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--take", default="audio/take.wav"); ap.add_argument("--bars", type=int, default=4)
    ap.add_argument("--tail", type=float, default=6.5)
    a = ap.parse_args()
    au = json.loads((ROOT / "data" / "audio.json").read_text(encoding="utf-8"))
    song, sr = sf.read(ROOT / a.take, always_2d=True)
    stems = {k: sf.read(ROOT / "analysis" / "stems" / f"{k}.wav", always_2d=True)[0] for k in ("drums", "bass", "other")}
    bar = 4 * 60.0 / au["bpm"]
    db0 = au["downbeats"][0]
    # the chorus groove: the first downbeat of the first chorus
    ch = next(s for s in au["sections"] if s["name"].startswith("chorus"))
    # (skipping bars where the groove drops out: the first downbeat whose bar has drums and bass going)
    def live(d):
        j0, j1 = int(d * sr), int((d + bar) * sr)
        return all(np.sqrt(np.mean(stems[k][j0:j1] ** 2)) > 0.02 for k in ("drums", "bass"))
    src = next(d for d in au["downbeats"] if d >= ch["start"] - 0.05 and live(d))
    n = int(round(a.bars * bar * sr))
    i0 = int(round(src * sr))
    seg = lambda k: stems[k][i0:i0 + n]
    t = np.arange(n) / sr
    u = t / (a.bars * bar)
    # bars 1-2: bass + synths only, opening up; bars 3-4: drums join; the last beat drops the drums for the entrance
    music = seg("other") + seg("bass")
    drums = seg("drums") * np.clip((u - 0.5) / 0.08, 0, 1)[:, None]
    last_beat = u > 1 - 1 / (4 * a.bars)
    drums[last_beat] *= np.linspace(1, 0, int(last_beat.sum()))[:, None] ** 3
    pre = sweep_lowpass(music, sr, 220, 3200) + sweep_lowpass(drums, sr, 120, 1800)
    gain = (0.06 + 0.94 * u ** 1.8)[:, None]
    pre *= gain * 0.85
    # place: the pre-roll ends exactly on the song's first downbeat
    D = a.bars * bar - db0
    off = int(round(D * sr))
    tail = int(round(a.tail * sr))
    total = off + len(song) + tail
    out = np.zeros((total, song.shape[1]))
    out[:n] += pre
    out[off:off + len(song)] += song
    # tail: the song's own last moment decays into a faint room tone
    rng = np.random.default_rng(27)
    pink = np.cumsum(rng.standard_normal((tail, song.shape[1])), 0)
    pink -= np.linspace(pink[0], pink[-1], tail)
    pink = pink / (np.abs(pink).max() + 1e-9) * 10 ** (-58 / 20)
    out[off + len(song):] += pink * np.linspace(1, 0, tail)[:, None] ** 2
    peak = np.abs(out).max()
    if peak > 0.99:
        out *= 0.99 / peak
    sf.write(ROOT / "audio" / "song.wav", out.astype(np.float32), sr, subtype="PCM_16")
    (ROOT / "audio" / "bookends.json").write_text(json.dumps({"take": a.take, "offset": round(D, 4), "preroll_bars": a.bars, "bar": bar,
                                                               "source_downbeat": src, "tail": a.tail, "duration": round(total / sr, 3)}, indent=1), encoding="utf-8")
    print(f"song.wav: {total / sr:.2f}s  (pre-roll {a.bars} bars = {a.bars * bar:.3f}s from {src:.2f}s, song offset {D:.3f}s, tail {a.tail}s)")


if __name__ == "__main__":
    main()
