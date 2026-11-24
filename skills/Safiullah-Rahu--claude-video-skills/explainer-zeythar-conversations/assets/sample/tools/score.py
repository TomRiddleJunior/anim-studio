"""Synthesized soundtrack for a Conversations Beyond Time episode: voice post, late-night bed, clock, holo sounds, mix.

Reads  score/data/cues.json (tools/timeline.py), vo/audio/vo.wav (per-line windows, who speaks)
Writes score/audio/voice.wav  the processed voices (stereo): Zeythar with a warm hall reverb and a faint high shimmer
                              far down (never robotic); the girl dry with a small room
       score/audio/bed.wav    music + effects (stereo)
       score/audio/final.wav  the mix, two-pass loudnorm to -14 LUFS / -1.5 dBTP
       score/data/levels.json integrated loudness, true peak, voice-over-bed margin while speaking

Music: a soft late-night bed in F lydian (Fmaj9 - Am9 - Dm9 - Bbmaj9(#11), 62 BPM, two bars a chord): warm pads,
a slow sub pulse on the bar, a sparse celesta motif. It drops to a single pad for the quiet beat before the turn,
stays sparse under the honest exchange, and a warm swell comes in under the dawn line. Effects: a slow real-time
clock tick (firmer on the minute steps), a holographic chime per orb morph, soft taps on REVIEWED stamps and tally
marks, a light pluck on the marked punchlines, very low whooshes on cuts, a dry final tick on the last line, the
end-card bell. No samples anywhere.

usage: "$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/score.py
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = "ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe"
SR = 48000
RNG = np.random.default_rng(11)


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 200) / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], btype="band", output="sos"), x, axis=0)


def db(x):
    return 10 ** (x / 20)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(buf, sig, t0, gain=1.0):
    k = int(round(t0 * SR))
    if k >= len(buf) or k + len(sig) <= 0:
        return
    if k < 0:
        sig = sig[-k:]; k = 0
    n = min(len(sig), len(buf) - k)
    buf[k:k + n] += sig[:n] * gain


def ir(rt60, dur, bright, seed, predelay=0.02):
    r = np.random.default_rng(seed)
    t = tt(dur)
    n = r.standard_normal((len(t), 2)) * np.exp(-6.9 * t / rt60)[:, None]
    dark = lp(n, 1800); brightp = lp(n, bright)
    mix = np.exp(-t / (rt60 * 0.25))[:, None]          # brighter early, darker tail
    out = brightp * mix + dark * (1 - mix)
    out = np.concatenate([np.zeros((int(predelay * SR), 2)), out])
    return out / np.sqrt((out ** 2).sum(axis=0, keepdims=True))


def mod_delay(x, base_ms, depth_ms, rate, phase=0.0):
    n = np.arange(len(x))
    d = (base_ms + depth_ms * np.sin(2 * np.pi * rate * n / SR + phase)) * SR / 1000.0
    return np.interp(n - d, n, x, left=0.0)


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


# --------------------------------------------------------------------------------------------- voices
def voices(cues, dur):
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=True)
    v = v.mean(axis=1)
    N = int(dur * SR) + SR
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    stems = {"Z": np.zeros(N), "L": np.zeros(N)}
    for w in cues["voice"]:
        i0, i1 = int((w["start"] - 0.06) * SR), int((w["end"] + 0.12) * SR)
        m = np.zeros(N); m[max(0, i0):i1] = 1
        m = uniform_filter1d(m, int(0.012 * SR))
        stems[w["who"]] += v * m
    z, l = stems["Z"], stems["L"]
    # Zeythar: a little low warmth, a faint high shimmer far down, a warm hall (never a robot: no chorus, no pitch fx)
    zw = z + 0.22 * lp(z, 180)
    air = hp(mod_delay(zw, 11.0, 0.9, 0.33, 0.4), 5200)
    dryZ = zw + db(-31) * air
    hall = fftconvolve(np.stack([dryZ, dryZ], 1), ir(2.1, 2.8, 4200, 3, 0.028), axes=0)[:N]
    Z2 = np.stack([dryZ, dryZ], 1) + db(-17.5) * hall
    room = fftconvolve(np.stack([l, l], 1), ir(0.32, 0.5, 7000, 5, 0.006), axes=0)[:N]
    L2 = np.stack([l, l], 1) + db(-21) * room
    return Z2 + L2, z, l


def limit(x, ceil=0.89, look=0.004, rel=0.06):
    a = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    la = int(look * SR)
    pk = maximum_filter1d(a, size=2 * la + 1)       # sliding max over the look-ahead window
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    # release smoothing: hold the minimum over the release window, then smooth it (vectorised)
    from scipy.ndimage import minimum_filter1d
    rl = int(rel * SR)
    held = minimum_filter1d(g, size=rl, origin=-(rl // 2) + 1)
    out = np.minimum(g, uniform_filter1d(held, size=max(3, rl // 2)))
    return x * (out[:, None] if x.ndim == 2 else out)


# --------------------------------------------------------------------------------------------- instruments
def pad_note(f, d, bright=1.0, seed=0):
    t = tt(d)
    r = np.random.default_rng(seed)
    s = np.zeros((len(t), 2))
    for k, det in enumerate((-5, 0, 6)):
        ff = f * 2 ** (det / 1200)
        ph = r.uniform(0, 2 * np.pi)
        w = np.zeros(len(t))
        for h in range(1, 9):
            w += np.sin(2 * np.pi * ff * h * t + ph * h) / h ** 1.35
        s[:, k % 2] += w * (0.9 if k == 1 else 0.6)
        s[:, (k + 1) % 2] += w * 0.3
    s = lp(s, 900 + 900 * bright)
    a = min(1.6, d * 0.4)
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / min(2.0, d * 0.45))
    return s * np.clip(e, 0, 1)[:, None]


def musicbox(f, vel=1.0, d=2.2):
    t = tt(d)
    w = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.35) + 0.08 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t / 0.12)
    w *= env_ad(len(t), 0.003, 0.75) * vel
    click = RNG.standard_normal(len(t)) * np.exp(-t / 0.0025) * 0.05
    s = w + hp(click, 3000)
    return np.stack([s, s], 1)


def celesta(f, vel=1.0, d=2.6):
    t = tt(d)
    w = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t / 0.18) + 0.12 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.6)
    w *= env_ad(len(t), 0.002, 0.9) * vel
    return np.stack([w, w * 0.94], 1)


def sub(f, d=2.6):
    t = tt(d)
    w = np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.25) * np.exp(-t / 1.1)
    return np.stack([w, w], 1)


def pluck(f, d=1.4):
    t = tt(d)
    w = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.5 + 1.8 * k)) / k for k in range(1, 6))
    w *= np.minimum(1, t / 0.003)
    return np.stack([w * 0.9, w], 1)


def tap(d=0.12):
    t = tt(d)
    s = bp(RNG.standard_normal(len(t)) * np.exp(-t / 0.012), 300, 2600) + 0.6 * np.sin(2 * np.pi * 160 * t) * np.exp(-t / 0.03)
    return np.stack([s, s], 1)


def bell(f, d=5.0):
    t = tt(d)
    parts = [(1.0, 1.0, 3.2), (2.76, 0.55, 1.6), (5.40, 0.30, 0.9), (8.93, 0.16, 0.5), (0.5, 0.35, 4.0)]
    w = sum(a * np.sin(2 * np.pi * f * p * t + p) * np.exp(-t / dd) for p, a, dd in parts)
    w *= np.minimum(1, t / 0.004)
    return np.stack([w, w * 0.96], 1)


def chime(f=1568.0, d=1.1):
    t = tt(d)
    w = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 1) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t + 2)) * env_ad(len(t), 0.004, 0.32)
    sweep = bp(RNG.standard_normal(len(t)), 2500, 9000) * np.exp(-((t - 0.09) / 0.06) ** 2) * 0.25
    s = w + sweep
    return np.stack([s * 0.9, s], 1)


def tick(kind):
    d = 0.09; t = tt(d)
    f = {"tick": 2100.0, "tock": 1550.0, "restart": 1800.0}.get(kind, 2000.0)
    click = bp(RNG.standard_normal(len(t)) * np.exp(-t / 0.0018), 2500, 9000)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.018) * 0.6 + np.sin(2 * np.pi * f * 0.52 * t) * np.exp(-t / 0.03) * 0.35
    s = click * 0.8 + body
    return np.stack([s, s], 1)


def clunk():
    d = 2.6; t = tt(d)
    thump = np.sin(2 * np.pi * (52 + 30 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.22)
    ring = sum(a * np.sin(2 * np.pi * 196 * p * t + p) * np.exp(-t / dd) for p, a, dd in [(1, 0.5, 0.75), (2.32, 0.35, 0.5), (4.25, 0.22, 0.3), (6.63, 0.12, 0.2)])
    click = hp(RNG.standard_normal(len(t)) * np.exp(-t / 0.004), 1500) * 0.6
    s = thump * 1.0 + ring * 0.55 + click
    return np.stack([s, s * 0.97], 1)


def whoosh(d=0.42):
    t = tt(d)
    n = RNG.standard_normal(len(t))
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    s = bp(n, 300, 2200) * e
    return np.stack([s, s[::-1] * 0.3 + s * 0.7], 1)


def shimmer(d=1.6, f0=880.0):
    t = tt(d)
    s = np.zeros(len(t))
    for k, m in enumerate((1.0, 1.5, 2.0, 3.0)):
        f = f0 * m * (1 + 0.5 * t / d)
        ph = 2 * np.pi * np.cumsum(f) / SR
        s += np.sin(ph + k) * (0.5 / (k + 1))
    s *= np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    return np.stack([s, np.roll(s, 240)], 1)


def sparkle():
    out = np.zeros((int(0.6 * SR), 2))
    for k, f in enumerate((2637.0, 3136.0, 3951.0)):
        add(out, musicbox(f, 0.5, 0.5), k * 0.06)
    return out


# --------------------------------------------------------------------------------------------- the score
CHORDS = [  # (bass midi, chord tones midi): F lydian, soft and open
    (41, [60, 64, 65, 67, 69]),   # Fmaj9
    (45, [60, 64, 67, 69, 71]),   # Am9
    (38, [57, 60, 64, 65, 69]),   # Dm9
    (46, [58, 62, 64, 65, 69]),   # Bbmaj9(#11)
]


def music(cues, dur):
    N = int(dur * SR) + SR
    pad = np.zeros((N, 2)); cel = np.zeros((N, 2)); low = np.zeros((N, 2))
    bpm = 62.0; beat = 60 / bpm; bar = 4 * beat; clen = 2 * bar
    quiet = [b for b in cues.get("beats", []) if b.get("quiet")]
    q0 = quiet[0]["t0"] if quiet else 1e9                       # the beat before the turn: a single pad
    sw = cues.get("swell") or {}
    s0 = sw.get("t0", 1e9) - 0.6                                # the warm swell under the dawn line
    sparse = lambda t: q0 - 0.2 <= t < s0
    # chords on a fixed grid, but the grid restarts on the quiet beat and on the swell, so both land on a downbeat
    starts, t = [], 0.0
    marks = sorted(x for x in (q0 - 0.2, s0) if x < dur)
    for mk in marks + [dur]:
        while t < mk - 0.5:
            starts.append(t); t += clen
        t = mk
    starts.append(t) if t < dur else None
    for k, t in enumerate(starts):
        bass, tones = CHORDS[k % 4]
        nxt = starts[k + 1] if k + 1 < len(starts) else dur + 1
        d = min(nxt - t + 1.8, dur - t + 0.5)
        if sparse(t + 0.01):
            add(pad, pad_note(mtof(bass + 24), d, 0.25, seed=k * 10 + 1), t, 0.10)
            add(pad, pad_note(mtof(bass + 31), d, 0.25, seed=k * 10 + 2), t, 0.06)
        else:
            sw_on = t >= s0 - 0.01
            for j, m in enumerate(tones):
                add(pad, pad_note(mtof(m), d, 0.35 + (0.45 if sw_on else 0.0), seed=k * 10 + j), t, 0.15 * (1.3 if sw_on else 1.0))
            add(pad, pad_note(mtof(bass + 12), d, 0.2, seed=k + 99), t, 0.18)
            b = 0.0
            while b < min(nxt - t, 2 * bar) - 0.1:                # the slow sub pulse, once a bar
                add(low, sub(mtof(bass), 2.4), t + b, 0.20); b += bar
    # celesta: a sparse motif (3 notes every other chord), silent in the sparse stretch, back (every chord) under the swell
    motif = [(0.0, 2), (1.5, 4), (3.0, 3)]
    for k, t in enumerate(starts):
        bass, tones = CHORDS[k % 4]
        if sparse(t + 0.01) or not (k % 2 == 0 or t >= s0 - 0.01):
            continue
        for off, idx in motif:
            tn = t + 2 * beat + off * beat
            if tn < dur - 1.0 and not sparse(tn):
                add(cel, celesta(mtof(tones[idx] + 12), 0.55 + 0.2 * RNG.random()), tn, 0.10)
    hall = ir(2.8, 3.5, 6000, 9, 0.025)
    wet = fftconvolve(cel, hall, axes=0)[:N] * 0.55 + fftconvolve(pad, hall, axes=0)[:N] * 0.22
    return pad + cel * 0.9 + low + wet


def effects(cues, dur):
    N = int(dur * SR) + SR
    fx = np.zeros((N, 2)); dry = np.zeros((N, 2))
    fin = cues.get("final_tick")
    for x in cues["ticks"]:
        if fin and abs(x["t"] - fin) < 0.5:
            continue
        add(fx, tick(x["kind"]), x["t"], db(-33))
    for st in cues.get("steps", []):                              # a minute step: a firmer tick
        if fin and abs(st - fin) < 0.05:
            continue
        add(fx, tick("tock"), st, db(-27))
    if fin:
        add(dry, tick("tick") * 1.0 + tick("tock") * 0.6, fin + 0.02, db(-17))     # the dry final tick on "2:47"
    for t0 in cues.get("morphs", []):
        add(fx, chime(1568.0 if int(t0 * 10) % 2 else 1760.0), t0, db(-24))
    for t0 in cues.get("stamps", []):
        add(fx, tap(), t0, db(-27))
    for t0 in cues.get("bigstamp", []):
        add(fx, tap(0.2) * 1.6, t0, db(-22))
    for t0 in cues.get("tally", []):
        add(fx, tap(), t0, db(-28))
    for t0 in cues.get("plucks", []):
        add(fx, pluck(mtof(77)), t0, db(-23))
    if cues.get("tag"):
        add(fx, shimmer(1.0, 1320.0), cues["tag"] - 0.1, db(-30))
    for c in cues["cuts"]:
        add(fx, whoosh(0.36), c - 0.18, db(-40))
    if cues.get("endcard"):
        add(fx, bell(698.46), cues["endcard"] + 0.15, db(-17))
        add(fx, bell(1046.5, 4.0), cues["endcard"] + 0.17, db(-25))
    hall = ir(1.6, 2.2, 7000, 13, 0.015)
    return fx + 0.32 * fftconvolve(fx, hall, axes=0)[:N] + dry


def loudnorm(src, dst, I=-14.0, TP=-1.8):
    r = subprocess.run([FF, "-hide_banner", "-i", src, "-af", f"loudnorm=I={I}:TP={TP}:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    js = r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1]
    m = json.loads(js)
    af = (f"loudnorm=I={I}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
    r2 = subprocess.run([FF, "-hide_banner", "-y", "-i", src, "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", dst], capture_output=True, text=True, encoding="utf-8", errors="replace")
    js2 = r2.stderr[r2.stderr.rindex("{"): r2.stderr.rindex("}") + 1]
    return json.loads(js2)


def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    import re
    I = float(re.search(r"I:\s+(-?[0-9.]+) LUFS", tail).group(1))
    tp = float(re.search(r"Peak:\s+(-?[0-9.]+) dBFS", tail).group(1))
    return I, tp


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    cues = json.load(open(os.path.join(ROOT, "score", "data", "cues.json")))
    dur = cues["dur"]
    N = int(dur * SR) + SR
    voice, g, l = voices(cues, dur)
    mus = music(cues, dur)[:N]
    fx = effects(cues, dur)[:N]
    # levels: the bed sits ~18 dB under the voice while he/she speaks (a gentle duck), louder in the gaps and the end
    sp = np.zeros(N)
    for w in cues["voice"]:
        sp[int(w["start"] * SR): int(w["end"] * SR)] = 1
    sm = uniform_filter1d(sp, int(0.25 * SR))
    duck = 1.0 - 0.38 * sm
    vrms = np.sqrt((voice[sp > 0] ** 2).mean())
    mrms = np.sqrt((mus[sp > 0] ** 2).mean()) + 1e-9
    mus *= (vrms * db(-19.5)) / mrms
    bed = mus * duck[:, None] + fx * (vrms / (np.abs(fx).max() + 1e-9)) * 2.2
    voice = limit(voice / (np.abs(voice).max() + 1e-9) * 0.8, 0.8)
    # re-measure after the limiter so the margin is honest
    vr = np.sqrt((voice[sp > 0] ** 2).mean()); br = np.sqrt((bed[sp > 0] ** 2).mean()) + 1e-12
    mix = voice + bed
    end = int((dur) * SR)
    mix = mix[:end]
    f = int(0.25 * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]
    mix[: int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))[:, None]
    os.makedirs(os.path.join(ROOT, "score", "audio"), exist_ok=True)
    sf.write(os.path.join(ROOT, "score", "audio", "voice.wav"), voice[:end].astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(ROOT, "score", "audio", "bed.wav"), bed[:end].astype(np.float32), SR, subtype="FLOAT")
    pre = os.path.join(ROOT, "score", "audio", "mix_pre.wav")
    sf.write(pre, (mix / max(1.0, np.abs(mix).max() / 0.95)).astype(np.float32), SR, subtype="FLOAT")
    final = os.path.join(ROOT, "score", "audio", "final.wav")
    ln = loudnorm(pre, final)
    I, tp = measure(final)
    lv = {"integrated_lufs": I, "true_peak_dbtp": tp, "voice_over_bed_db_while_speaking": round(20 * math.log10(vr / br), 2),
          "loudnorm": {k: ln.get(k) for k in ("output_i", "output_tp", "output_lra", "normalization_type")}}
    json.dump(lv, open(os.path.join(ROOT, "score", "data", "levels.json"), "w"), indent=1)
    print(json.dumps(lv, indent=1))


if __name__ == "__main__":
    main()
