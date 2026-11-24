"""A quiet synthesized felt piano for the glow story ("Unheard"). numpy only, seeded, no samples. The note model and the
reverb follow the user's own lowpoly-skit emotional variant (tools/felt_piano.py); the progression, tempo and dynamics
are this film's.

felt_piano(dur, t_in, t_final, sr, dyn) -> (main, final): two stereo stems
  main  = slow broken chords in A minor from t_in, looping an 8-bar progression
          (Am(add9) . Fmaj7 . C/E . G(add9) . Dm7 . Fmaj7 . Am/E . Esus4-E), bar length chosen so that the final chord
          lands exactly on t_final;
  final = an open Fmaj(add9) that rings over the last hold (warm, not resolved to the minor: a door left open).
dyn = [(t, velocity scale), ...] piecewise-constant dynamics (thinner under the rule-break, open at the twist).
"""
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def note(f, dur, vel, sr, rng):
    n = int(dur * sr)
    t = np.arange(n) / sr
    x = np.zeros(n)
    B = 0.00035
    for k in range(1, 11):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 7000:
            break
        amp = 1.0 / k ** 1.45
        if k == 1:
            amp *= 0.85
        tau = 2.6 / (1 + 0.6 * (k - 1)) * (196.0 / f) ** 0.3
        for det in (-0.00035, 0.00035):
            x += 0.5 * amp * np.exp(-t / tau) * np.sin(2 * np.pi * fk * (1 + det) * t + rng.uniform(0, 2 * np.pi))
    att = int(0.012 * sr)
    x[:att] *= np.linspace(0, 1, att) ** 1.4
    th = int(0.045 * sr)
    thump = rng.standard_normal(th) * np.exp(-np.arange(th) / (0.009 * sr))
    thump = sosfilt(butter(2, 260 / (sr / 2), btype="low", output="sos"), thump)
    x[:th] += 0.35 * thump / (np.abs(thump).max() + 1e-9) * 0.25
    lp = 650 + 1500 * vel
    x = sosfilt(butter(2, lp / (sr / 2), btype="low", output="sos"), x)
    rel = int(0.3 * sr)
    x[-rel:] *= np.linspace(1, 0, rel)
    return x * vel


def reverb(x, sr, rt60=2.8, wet=0.36, seed=3):
    rng = np.random.default_rng(seed)
    n = int(rt60 * sr)
    t = np.arange(n) / sr
    out = np.zeros((len(x) + n - 1, 2))
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt60)
        ir = sosfilt(butter(2, 3000 / (sr / 2), btype="low", output="sos"), ir)
        ir[: int(0.015 * sr)] = 0
        ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = fftconvolve(x[:, c], ir) * wet
    out[: len(x)] += x * (1 - wet)
    return out[: len(x)]


BARS = [
    (45, [64, 67, 71]),        # Am(add9): A2 | E4 G4 B4
    (41, [64, 69, 72]),        # Fmaj7
    (40, [60, 64, 67]),        # C/E
    (43, [62, 67, 69]),        # G(add9)
    (38, [60, 65, 69]),        # Dm7
    (41, [64, 69, 72]),        # Fmaj7
    (40, [60, 64, 69]),        # Am/E
    (40, [64, 69, 71, 68]),    # Esus4 -> E
]
FINAL = (41, [53, 60, 67, 69, 76])  # Fmaj(add9), open


def felt_piano(dur, t_in, t_final, sr=48000, seed=21, dyn=None):
    rng = np.random.default_rng(seed)
    n = int(dur * sr)
    main = np.zeros((n, 2))
    final = np.zeros((n, 2))
    target = 3.7
    nb = max(1, int(round((t_final - t_in) / target)))
    bar = (t_final - t_in) / nb
    beat = bar / 4
    dyn = dyn or [(0, 1.0)]

    def dv(t):
        v = dyn[0][1]
        for tt, vv in dyn:
            if t >= tt:
                v = vv
        return v

    def put(bus, m, t, vel, ring, pan):
        if t >= dur:
            return
        x = note(mtof(m), min(ring, dur - t + 0.01), vel, sr, rng)
        i = int(t * sr)
        k = min(len(x), n - i)
        gl, gr = np.sqrt(0.5 - pan / 2), np.sqrt(0.5 + pan / 2)
        bus[i:i + k, 0] += x[:k] * gl
        bus[i:i + k, 1] += x[:k] * gr

    for b in range(nb):
        bass, rh = BARS[b % len(BARS)]
        t0 = t_in + b * bar
        d = dv(t0)
        put(main, bass, t0 + 0.02, 0.5 * d, bar * 1.6, -0.15)
        offs = [1.0, 2.0, 3.0] if len(rh) == 3 else [1.0, 2.0, 2.75, 3.4]
        thin = d < 0.65  # under the rule-break: bass + one high note only
        for j, (m, o) in enumerate(zip(rh, offs)):
            if thin and j not in (len(rh) - 1,):
                continue
            hum = rng.uniform(-0.03, 0.03)
            put(main, m, t0 + o * beat + hum, (0.4 + 0.1 * (j == len(rh) - 1) + rng.uniform(-0.04, 0.04)) * d, bar * 1.3, 0.1 + 0.08 * j)
    bass, rh = FINAL
    put(final, bass, t_final, 0.5, 6.0, -0.15)
    for j, m in enumerate(rh):
        put(final, m, t_final + 0.1 * j + (0.4 if j == len(rh) - 1 else 0), 0.44 - 0.05 * (j == len(rh) - 1), 6.0, -0.1 + 0.08 * j)
    return reverb(main, sr), reverb(final, sr, seed=4)
