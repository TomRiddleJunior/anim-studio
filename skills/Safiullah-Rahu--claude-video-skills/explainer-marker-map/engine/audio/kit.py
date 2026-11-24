"""The map-films sound kit, synthesized in numpy (no downloads, no licences): a tense documentary bed and the SFX.

  python -I engine/audio/kit.py            renders engine/audio/kit/*.wav previews (and a 30 s bed) to listen to

SFX (48 kHz mono float, deterministic): marker(dur) · scribble(dur) · pen(dur) · highlight(dur) · slide() · page() ·
tape() · whoosh_out(dur) · whoosh_in(dur) · impact() · typing(dur) · tick(dur) · swish() · splash()
Bed: bed(duration, sections=[(t, energy 0-3)], hit=t, bpm=90) → stereo (n, 2): low pulse + clock tick, D-minor drone,
sparse piano, strings from energy 2, tremolo at 3, a low hit on `hit`, and a fade through the hold.
"""
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000


def rng(seed):
    return np.random.default_rng(seed)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def env(n, a, r, curve=2.0):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** curve
    e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


def norm(x, peak=0.5):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def sweep_bp(x, f0, f1, q=2.0, steps=48):
    """band-pass whose centre glides f0 → f1 (piecewise, crossfaded blocks)"""
    n = len(x)
    out = np.zeros(n)
    edges = np.linspace(0, n, steps + 1).astype(int)
    for i in range(steps):
        c = f0 * (f1 / f0) ** ((i + 0.5) / steps)
        lo, hi = max(40, c / (1 + 1 / q)), min(SR / 2 - 100, c * (1 + 1 / q))
        a, b = max(0, edges[i] - 512), min(n, edges[i + 1] + 512)
        seg = bp(x[a:b], lo, hi)
        w = np.ones(b - a)
        if edges[i] > 0:
            w[:1024] = np.linspace(0, 1, min(1024, b - a))[:len(w[:1024])]
        if edges[i + 1] < n:
            w[-1024:] = np.linspace(1, 0, min(1024, b - a))[-len(w[-1024:]):]
        out[a:b] += seg * w
    return out


def room(x, t60=1.2, mix=0.25, seed=3):
    n = int(t60 * SR)
    ir = rng(seed).standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
    ir = lp(ir, 6000)
    ir /= np.sqrt((ir ** 2).sum())
    return (1 - mix) * x + mix * fftconvolve(x, ir)[: len(x)]


# ── SFX ──────────────────────────────────────────────────────────────────────────────────────────────────
def marker(dur=0.6, seed=1):
    r = rng(seed)
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    tex = bp(r.standard_normal(n), 1200, 5500) * (0.75 + 0.25 * np.sin(2 * np.pi * (28 + 9 * r.random()) * t + r.random() * 6))
    sq_f = 2300 + 260 * np.sin(2 * np.pi * 1.3 * t / max(dur, 0.2)) + 40 * np.sin(2 * np.pi * 7 * t)
    squeak = np.sin(2 * np.pi * np.cumsum(sq_f) / SR) * (np.exp(-t / 0.07) + 0.6 * np.exp(-np.maximum(0, dur - t) / 0.05) * (t < dur))
    x = (tex + 0.12 * squeak) * env(n, 0.02, 0.07)
    return norm(x, 0.42)


def pen(dur=1.0, seed=2):
    r = rng(seed)
    n = int((dur + 0.05) * SR)
    x = bp(r.standard_normal(n), 3500, 11000) * (0.8 + 0.2 * np.sin(np.arange(n) / SR * 2 * np.pi * 33))
    return norm(x * env(n, 0.04, 0.08), 0.22)


def highlight(dur=0.4, seed=4):
    r = rng(seed)
    n = int((dur + 0.06) * SR)
    t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 900, 4200) * (0.7 + 0.3 * np.sin(2 * np.pi * 21 * t))
    x += 0.08 * np.sin(2 * np.pi * (1700 + 200 * t / dur) * t) * np.exp(-t / 0.1)
    return norm(x * env(n, 0.03, 0.08), 0.36)


def scribble(dur=0.5, seed=5):
    r = rng(seed)
    n = int((dur + 0.05) * SR)
    x = np.zeros(n)
    t = 0.0
    while t < dur:
        L = int((0.045 + 0.03 * r.random()) * SR)
        a = int(t * SR)
        seg = bp(r.standard_normal(L), 1500 + 1500 * r.random(), 6500) * np.hanning(L) * (0.6 + 0.4 * r.random())
        x[a:a + L] += seg[: max(0, min(L, n - a))]
        t += 0.055 + 0.03 * r.random()
    return norm(x, 0.4)


def slide(seed=6):
    """paper tag sliding in and slapping down"""
    r = rng(seed)
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    sw = sweep_bp(r.standard_normal(n), 700, 3200, 1.6) * np.clip(t / 0.16, 0, 1) ** 1.5 * np.exp(-np.maximum(0, t - 0.2) / 0.04)
    slap_t = t - 0.2
    slap = (np.sin(2 * np.pi * 170 * slap_t) * np.exp(-slap_t / 0.035) + 0.6 * bp(r.standard_normal(n), 1200, 5000) * np.exp(-slap_t / 0.012)) * (slap_t >= 0)
    return norm(room(0.6 * sw + slap, 0.5, 0.15), 0.55)


def page(seed=7):
    r = rng(seed)
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    flutter = 0.55 + 0.45 * np.sin(2 * np.pi * (16 - 8 * t) * t) ** 2
    body = sweep_bp(r.standard_normal(n), 600, 3800, 1.3) * flutter * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 1.2
    snap = bp(r.standard_normal(n), 1500, 7000) * np.exp(-np.maximum(0, t - 0.47) / 0.02) * (t > 0.47)
    return norm(room(body + 0.8 * snap, 0.5, 0.12), 0.5)


def tape(seed=8):
    r = rng(seed)
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    crackle = (r.random(n) < 0.03) * r.standard_normal(n)
    x = hp(crackle + 0.25 * r.standard_normal(n), 1200) * env(n, 0.01, 0.15)
    return norm(lp(x, 9000), 0.4)


def whoosh(dur=1.3, rising=False, seed=9):
    r = rng(seed)
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    f0, f1 = (250, 2600) if rising else (2600, 220)
    x = sweep_bp(r.standard_normal(n), f0, f1, 1.2)
    peak = 0.75 if rising else 0.5
    shape = np.exp(-((t / (dur + 0.35) - peak) ** 2) / 0.05)
    rumble = lp(r.standard_normal(n), 140) * 3
    y = (x + 0.5 * rumble) * shape
    st = np.stack([y, np.roll(y, int(0.004 * SR))], 1)
    return norm(st, 0.55)


def whoosh_out(dur=1.3):
    return whoosh(dur, False, 9)


def whoosh_in(dur=1.0):
    return whoosh(dur, True, 10)


def impact(seed=11):
    r = rng(seed)
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = 46 + 40 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32)
    knock = np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.05) * 0.5
    click = bp(r.standard_normal(n), 1500, 9000) * np.exp(-t / 0.006) * 0.8
    stamp = bp(r.standard_normal(n), 300, 2500) * np.exp(-t / 0.03) * 0.6
    return norm(room(boom + knock + click + stamp, 1.4, 0.22), 0.85)


def typing(dur=0.8, seed=12):
    r = rng(seed)
    n = int((dur + 0.1) * SR)
    x = np.zeros(n)
    t = 0.0
    while t < dur:
        a = int(t * SR)
        L = int(0.04 * SR)
        tt = np.arange(L) / SR
        f = 1200 + 700 * r.random()
        k = (bp(r.standard_normal(L), 2000, 9000) * np.exp(-tt / 0.004) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.018)) * (0.6 + 0.4 * r.random())
        x[a:a + L] += k[: max(0, min(L, n - a))]
        t += 1 / 24 + 0.02 * r.random()
    return norm(x, 0.38)


def tick(dur=0.9, seed=13):
    """counter rolling: fast clicks that slow to a stop"""
    r = rng(seed)
    n = int((dur + 0.1) * SR)
    x = np.zeros(n)
    t = 0.0
    while t < dur:
        a = int(t * SR)
        L = int(0.012 * SR)
        tt = np.arange(L) / SR
        k = np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt / 0.003) + 0.3 * r.standard_normal(L) * np.exp(-tt / 0.001)
        x[a:a + L] += k[: max(0, min(L, n - a))]
        u = t / max(dur, 1e-3)
        t += 0.035 + 0.11 * u ** 2
    return norm(x, 0.26)


def swish(seed=14):
    r = rng(seed)
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    y = sweep_bp(r.standard_normal(n), 1800, 6500, 1.5) * np.sin(np.pi * np.clip(t / 0.42, 0, 1)) ** 2
    st = np.stack([y * np.linspace(1, 0.3, n), y * np.linspace(0.3, 1, n)], 1)
    return norm(st, 0.42)


def splash(seed=15):
    r = rng(seed)
    n = int(1.3 * SR)
    t = np.arange(n) / SR
    plunge = np.sin(2 * np.pi * np.cumsum(300 * np.exp(-t / 0.15) + 90) / SR) * np.exp(-t / 0.12)
    wash = lp(r.standard_normal(n), 3500) * (np.exp(-t / 0.35) * 0.9 + 0.1)
    bubbles = np.zeros(n)
    for _ in range(26):
        a = int(r.random() * 0.9 * SR)
        L = int(0.03 * SR)
        tt = np.arange(L) / SR
        f = 500 + 1600 * r.random()
        b = np.sin(2 * np.pi * (f + 3000 * tt) * tt) * np.exp(-tt / 0.01)
        bubbles[a:a + L] += b * 0.4 * (1 - a / n)
    return norm(room(0.7 * plunge + wash + bubbles, 0.9, 0.2), 0.6)


SFX = {"marker": marker, "pen": pen, "highlight": highlight, "scribble": scribble, "slide": slide, "page": page,
       "tape": tape, "whoosh_out": whoosh_out, "whoosh_in": whoosh_in, "impact": impact, "typing": typing,
       "tick": tick, "swish": swish, "splash": splash}
TAKES_DUR = {"marker", "pen", "highlight", "scribble", "whoosh_out", "whoosh_in", "typing", "tick"}


def make(kind, dur=None, seed=0):
    f = SFX[kind]
    if kind in TAKES_DUR:
        args = [max(0.15, dur or 0.6)]
        try:
            return f(*args, seed=seed + 1) if kind not in ("whoosh_out", "whoosh_in") else f(*args)
        except TypeError:
            return f(*args)
    try:
        return f(seed=seed + 7)
    except TypeError:
        return f()


# ── music bed ────────────────────────────────────────────────────────────────────────────────────────────
NOTE = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "Bb": 1, "B": 2}


def hz(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave - 4)) / 12)


def piano(f, dur, vel=0.6, seed=0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        x += np.sin(2 * np.pi * fk * t + k) * (1 / k ** 1.3) * np.exp(-t * (0.9 + 0.55 * k))
    hammer = bp(rng(seed).standard_normal(n), 800, 5000) * np.exp(-t / 0.006) * 0.15
    return (x + hammer) * vel * np.minimum(1, t / 0.004)


def saw(f, n, phase=0.0):
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 12):
        x += np.sin(2 * np.pi * f * k * t + phase * k) / k
    return x


def bed(duration, sections=((0, 1),), hit=None, bpm=90, seed=21):
    n = int(duration * SR)
    t = np.arange(n) / SR
    beat = 60 / bpm
    secs = sorted(sections)

    def energy_at(tt):
        e = np.zeros_like(tt)
        for (a, en) in secs:
            e = np.where(tt >= a, en, e)
        return lp(e, 1.2, 1) if len(e) > 1000 else e
    E = energy_at(t)
    L = np.zeros(n)
    R = np.zeros(n)
    # drone: D2 + A2, slow breathing, darker when quiet
    drone = (saw(hz("D", 2), n) * 0.5 + saw(hz("A", 2), n, 1.1) * 0.35 + np.sin(2 * np.pi * hz("D", 1) * t) * 0.6)
    drone = lp(drone, 380) * (0.75 + 0.25 * np.sin(2 * np.pi * t / 7.3)) * np.minimum(1, t / 2.0)
    L += drone * 0.32
    R += lp(saw(hz("D", 2) * 1.003, n, 0.4) * 0.5 + saw(hz("A", 2) * 0.997, n) * 0.35, 380) * 0.3 * np.minimum(1, t / 2.0) + np.sin(2 * np.pi * hz("D", 1) * t) * 0.6 * 0.32 * np.minimum(1, t / 2)
    # low pulse on every beat + a clock tick-tock (time is the story)
    nb = int(duration / beat) + 1
    for i in range(nb):
        a = int(i * beat * SR)
        if a >= n:
            break
        e = float(E[min(a, n - 1)])
        if e < 0.5:
            continue
        m = min(int(0.45 * SR), n - a)
        tt = np.arange(m) / SR
        k = np.sin(2 * np.pi * (52 + 28 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.16) * (0.55 if i % 2 == 0 else 0.35) * min(1, e)
        L[a:a + m] += k
        R[a:a + m] += k
        m2 = min(int(0.03 * SR), n - a)
        tt2 = np.arange(m2) / SR
        tk = np.sin(2 * np.pi * (2400 if i % 2 else 1900) * tt2) * np.exp(-tt2 / 0.004) * 0.05 * min(1, e)
        L[a:a + m2] += tk * (1.2 if i % 2 else 0.6)
        R[a:a + m2] += tk * (0.6 if i % 2 else 1.2)
    # sparse piano: a falling minor motif every two bars, a tense semitone at energy 3
    motif = [("D", 5), ("A", 4), ("F", 4), ("E", 4)]
    tense = [("A", 4), ("Bb", 4), ("A", 4), ("E", 4)]
    bar = 4 * beat
    k = 0
    tb = bar * 0.5
    while tb < duration - 1.0:
        e = float(E[int(tb * SR)])
        notes = tense if e >= 2.5 else motif
        name, octv = notes[k % 4]
        p = piano(hz(name, octv), min(3.0, duration - tb), 0.22 + 0.06 * e, seed + k)
        a = int(tb * SR)
        m = min(len(p), n - a)
        pan = 0.4 + 0.2 * np.sin(k)
        L[a:a + m] += p[:m] * (1 - pan) * 1.2
        R[a:a + m] += p[:m] * pan * 1.2
        k += 1
        tb += bar if k % 4 else bar * 1.5
    # strings: D-minor pad from energy 2, tremolo A4 at energy 3
    pad = sum(saw(hz(nm, o), n, ph) for nm, o, ph in (("D", 3, 0.0), ("F", 3, 0.7), ("A", 3, 1.9)))
    pad = lp(pad, 1400) * 0.07
    gate = np.clip(E - 1, 0, 1)
    gate = lp(gate, 0.6, 1)
    L += pad * gate
    R += lp(sum(saw(hz(nm, o) * 1.004, n, ph) for nm, o, ph in (("D", 3, 0.3), ("F", 3, 1.2), ("A", 3, 2.5))), 1400) * 0.07 * gate
    trem = lp(saw(hz("A", 4), n), 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 8 * t)) * 0.035 * lp(np.clip(E - 2, 0, 1), 0.8, 1)
    L += trem * 0.8
    R += trem
    if hit is not None and hit < duration:
        h = impact(seed + 5) * 0.9
        a = int(hit * SR)
        m = min(len(h), n - a)
        L[a:a + m] += h[:m]
        R[a:a + m] += h[:m]
    out = np.stack([L, R], 1)
    fade = np.ones(n)
    fo = int(1.2 * SR)
    fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
    out *= fade[:, None]
    out = np.stack([room(out[:, 0], 2.2, 0.28, 1), room(out[:, 1], 2.2, 0.28, 2)], 1)
    return out / max(1e-6, np.abs(out).max()) * 0.7


if __name__ == "__main__":
    from scipy.io import wavfile
    out = Path(__file__).resolve().parent / "kit"
    out.mkdir(exist_ok=True)
    for name in SFX:
        x = make(name, 0.8)
        wavfile.write(out / f"{name}.wav", SR, x.astype(np.float32))
    b = bed(30, [(0, 1), (8, 2), (18, 3), (25, 2)], hit=27)
    wavfile.write(out / "bed_preview.wav", SR, b.astype(np.float32))
    print("wrote", len(SFX), "sfx + bed_preview.wav to", out)
    sys.exit(0)
