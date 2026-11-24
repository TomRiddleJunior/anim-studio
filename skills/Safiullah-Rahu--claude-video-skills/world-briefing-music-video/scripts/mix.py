"""The soundtrack: narration (audio/vo.wav) over a score assembled from three MiniMax-Music3 takes, cut on bar lines at
the film's turns, with speech-driven ducking, a few restrained effects and a two-pass loudness normalisation.

  ~/.generative-music-video/venv/Scripts/python.exe tools/mix.py
Writes audio/mix.wav (48 kHz stereo, -16 LUFS integrated, -1.5 dBTP), audio/score.wav, audio/sfx.wav and data/audio.json.

Score plan (data/vo.json scene ids):
  A  score/candidates/seed_19.flac   serious opening        from the start            → until scene 'aid'
  B  score/seed_7_inst.wav           investigative middle   (vocalise removed)        → until scene 'hope'
  C  score/candidates/seed_31.flac   the hopeful lift       through the close
Each part enters on its own downbeat exactly at its boundary (2.5 s crossfade); a part shorter than its window loops
back by whole bars with a crossfade.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import audiojson  # noqa: E402

SR = 48000
FF = r"ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe"
PARTS = [("A", "score/candidates/seed_19.flac", None), ("B", "score/seed_7_inst.wav", "gaza"),
         ("D", "score/seed_43_inst.wav", "economy"), ("C", "score/candidates/seed_31.flac", "climate")]


def load(p):
    y, sr = sf.read(ROOT / p, always_2d=True)
    y = y.astype(np.float32)
    if sr != SR:
        g = np.gcd(sr, SR)
        y = resample_poly(y, SR // g, sr // g, axis=0).astype(np.float32)
    return y


def downbeats(y):
    m = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
    tempo, beats = librosa.beat.beat_track(y=m, sr=22050, units="time")
    bpm = float(np.atleast_1d(tempo)[0])
    # pick the beat phase whose beats carry the most low-frequency energy as bar 1
    S = np.abs(librosa.stft(m, n_fft=2048, hop_length=512))[:20].sum(0)
    t = librosa.frames_to_time(np.arange(len(S)), sr=22050, hop_length=512)
    best = max(range(4), key=lambda k: sum(np.interp(b, t, S) for b in beats[k::4]))
    return bpm, beats, beats[best::4]


def fit(y, n, db):
    """Length-n music from y: loop back by whole bars (crossfade 1.5 s) when y is too short."""
    out = np.zeros((n, 2), np.float32)
    pos, src = 0, 0
    xf = int(1.5 * SR)
    loop_from = int(db[min(len(db) - 1, max(1, len(db) // 3))] * SR) if len(db) > 4 else 0
    end = int(db[-2] * SR) if len(db) > 2 else len(y)
    while pos < n:
        seg = y[src:end]
        take = min(len(seg), n - pos)
        if pos > 0 and take > xf:  # crossfade the loop seam
            r = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
            out[pos - xf:pos] = out[pos - xf:pos] * (1 - r) + seg[:xf] * r
            out[pos:pos + take - xf] = seg[xf:take]
            pos += take - xf
        else:
            out[pos:pos + take] = seg[:take]
            pos += take
        src = loop_from
    return out


def env(x, attack=0.03, release=0.35, hop=480):
    m = np.abs(x if x.ndim == 1 else x.mean(1))
    n = len(m) // hop
    r = np.sqrt((m[: n * hop].reshape(n, hop) ** 2).mean(1))
    out, v = np.zeros(n), 0.0
    a, rl = np.exp(-1 / (attack * SR / hop)), np.exp(-1 / (release * SR / hop))
    for i, s in enumerate(r):
        k = a if s > v else rl
        v = k * v + (1 - k) * s
        out[i] = v
    return np.repeat(out, hop)[: len(m)]


def whoosh(dur=0.9, seed=0):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n).astype(np.float32)
    S = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    S *= 1 / (1 + (f / 1800) ** 2)
    x = np.fft.irfft(S, n).astype(np.float32)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2.2
    x *= e / (np.abs(x).max() + 1e-9)
    pan = np.linspace(-0.6, 0.6, n)
    return np.stack([x * (1 - pan) / 2, x * (1 + pan) / 2], 1) * 0.5


def hit(dur=2.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 46 * t) * np.exp(-t * 2.2) + 0.35 * np.sin(2 * np.pi * 92 * t) * np.exp(-t * 4)).astype(np.float32)
    return np.stack([x, x], 1) * 0.6


def loudnorm(src, dst, target=-16.0):
    r = subprocess.run([FF, "-hide_banner", "-i", str(src), "-af", f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    j = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
          f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run([FF, "-y", "-v", "error", "-i", str(src), "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", str(dst)], check=True)
    return j


def main():
    vo = json.loads((ROOT / "data" / "vo.json").read_text(encoding="utf-8"))
    voice, sr = sf.read(ROOT / "audio" / "vo.wav")
    assert sr == SR
    dur = vo["duration"]
    n = int(dur * SR)
    voice = np.pad(voice.astype(np.float32), (0, max(0, n - len(voice))))[:n]
    scene_t0 = {s["id"]: s["t0"] for s in vo["scenes"]}
    bounds = [0.0] + [scene_t0[p[2]] - 0.5 for p in PARTS[1:]] + [dur]
    score = np.zeros((n, 2), np.float32)
    xf = int(2.5 * SR)
    h = xf // 2
    for i, (name, path, _) in enumerate(PARTS):
        y = load(path)
        # loudness-match the parts (they were generated separately): active-passage RMS to a common level
        mono = np.abs(y.mean(1))
        act = mono[mono > np.percentile(mono, 60)]
        y = y * (0.12 / (np.sqrt(np.mean(act ** 2)) + 1e-9))
        bpm, beats, db = downbeats(y)
        first, last = i == 0, i == len(PARTS) - 1
        a, b = int(bounds[i] * SR), int(bounds[i + 1] * SR)
        lo = a if first else a - h                       # crossfades are centred on the boundaries
        hi = b if last else b + h
        # the part's chosen downbeat lands exactly on its boundary (the first part starts at its beginning)
        anchor = 0.0 if first else (db[1] if len(db) > 1 else 0.0)
        src0 = max(0, int(anchor * SR) - (a - lo))
        seg = fit(y[src0:], hi - lo, db - src0 / SR)
        ramp = np.ones(hi - lo, np.float32)
        if not first:
            ramp[:xf] = np.linspace(0, 1, xf)
        if not last:
            ramp[-xf:] *= np.linspace(1, 0, xf)
        m = min(n, hi) - lo
        score[lo:lo + m] += seg[:m] * ramp[:m, None]
        print(f"part {name}: {path}  {bpm:.1f} bpm  {bounds[i]:.1f}-{bounds[i + 1]:.1f}s  (enters on source downbeat {anchor:.2f}s)")
    # fades at the very start/end
    fi_, fo = int(1.2 * SR), int(3.5 * SR)
    score[:fi_] *= np.linspace(0, 1, fi_)[:, None]
    score[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    # ducking: up to -11 dB under speech
    e = env(voice)
    e = e / (np.percentile(e[e > 1e-4], 90) + 1e-9) if (e > 1e-4).any() else e
    gain_db = -9.0 * np.clip(e * 1.6, 0, 1)
    duck = 10 ** (gain_db / 20)
    score_bed = score * 10 ** (-1 / 20) / (np.abs(score).max() + 1e-9) * duck[:, None]
    # effects
    sfx = np.zeros((n, 2), np.float32)
    for k, s in enumerate(vo["scenes"]):
        if s["id"] in ("cold",):
            continue
        i0 = int(max(0, s["t0"] - 0.55) * SR)
        w = whoosh(0.9, k)
        sfx[i0:i0 + len(w)] += w[: n - i0] * 0.35
    cold = next((s for s in vo["scenes"] if s["id"] == "cold"), None)
    if cold:
        t_title = [l for l in vo["lines"] if l["scene"] == "cold"][-1]["start"] - 0.1
        h = hit()
        i0 = int(t_title * SR)
        sfx[i0:i0 + len(h)] += h[: n - i0] * 0.5
    voice_st = np.stack([voice, voice], 1) * 10 ** (-1.0 / 20) / (np.abs(voice).max() + 1e-9)
    mix = voice_st + score_bed + sfx
    pk = np.abs(mix).max()
    if pk > 0.98:
        mix *= 0.98 / pk
    tmp = ROOT / "audio" / "_mix_pre.wav"
    sf.write(tmp, mix, SR, subtype="FLOAT")
    sf.write(ROOT / "audio" / "score.wav", score_bed, SR, subtype="FLOAT")
    sf.write(ROOT / "audio" / "sfx.wav", sfx, SR, subtype="FLOAT")
    j = loudnorm(tmp, ROOT / "audio" / "mix.wav")
    tmp.unlink()
    print(f"mix: measured {j['input_i']} LUFS / {j['input_tp']} dBTP -> -16 LUFS")
    words = [w["start"] for l in vo["lines"] for w in l["words"]]
    audiojson.build(dur, {"vocal": voice, "music": score_bed.mean(1), "sfx": sfx.mean(1), "mix": mix.mean(1)}, SR, bpm=92.0,
                    word_onsets=words, scenes=vo["scenes"])
    print("wrote audio/mix.wav and data/audio.json")


if __name__ == "__main__":
    main()
