"""Survival Odds · the identity sounds of the AI odds ring, synthesized (numpy only, deterministic: the same sting in every
episode). Mono float arrays at the given sample rate.

    from odds_sound import sting, tick, delta, pulse, glitch, land
    sting(48000)            0.62 s: soft rising "calculating" blips into a low click (frame 1; quietly on end card 1)
    tick(48000, up, i, n)   one soft counter tick per digit step (pitch climbs with the roll when up, falls when down)
    delta(48000, up)        the delta chip: a rising two-tone with a glint (+), a falling, slightly sour two-tone (-)
    pulse(48000)            the ring at its biggest (a soft swell + chime)
    glitch(48000, 0.6)      the ring scrambles: gated digital noise, a falling sine, bit-crushed
    land(48000)             the ring lands on ??: a low thud with a short dark tail
"""
import numpy as np


def _t(sr, d):
    return np.arange(int(d * sr)) / sr


def _bp(x, sr, lo, hi):
    # a simple FFT band-pass (no scipy needed)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / sr)
    m = ((f >= lo) & (f <= hi)).astype(float)
    m = np.convolve(m, np.hanning(9) / np.hanning(9).sum(), mode="same")
    return np.fft.irfft(X * m, n=len(x))


def _blip(sr, f0, f1, d, decay):
    x = _t(sr, d)
    f = np.linspace(f0, f1, len(x))
    ph = 2 * np.pi * np.cumsum(f) / sr
    s = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph + 0.4)
    env = np.clip(x / 0.004, 0, 1) * np.exp(-x * decay)
    return s * env


def sting(sr=48000):
    rng = np.random.default_rng(2026)
    D = 0.62
    out = np.zeros(int(D * sr))
    notes = [(587.3, 0.0), (783.99, 0.075), (987.77, 0.15), (1318.5, 0.225)]      # D5 G5 B5 E6: rising, unresolved
    for i, (f, t0) in enumerate(notes):
        b = _blip(sr, f * 0.985, f * 1.01, 0.12, 34 - i * 3) * (0.42 + 0.12 * i)
        a = int(t0 * sr)
        out[a:a + len(b)] += b[: len(out) - a]
    # a faint data shimmer under the blips
    x = _t(sr, 0.32)
    sh = _bp(rng.standard_normal(len(x)), sr, 3500, 7000) * np.sin(np.pi * x / 0.32) ** 2 * 0.05
    out[: len(sh)] += sh
    # the low click that "locks" the value
    tc = 0.33
    x = _t(sr, 0.28)
    thump = np.sin(2 * np.pi * 92 * x * (1 - 0.25 * x / 0.28)) * np.exp(-x * 22) * 0.9
    clk = _bp(rng.standard_normal(len(x)), sr, 1800, 5200) * np.exp(-x * 260) * 0.7
    ring_ = np.sin(2 * np.pi * 1975.5 * x) * np.exp(-x * 14) * 0.12                # a short B6 glint on top
    a = int(tc * sr)
    seg = thump + clk + ring_
    out[a:a + len(seg)] += seg[: len(out) - a]
    out *= np.clip((D - _t(sr, D)) / 0.05, 0, 1)
    return out / (np.abs(out).max() + 1e-9) * 0.9


def tick(sr=48000, up=True, i=0, n=10):
    rng = np.random.default_rng(100 + i)
    x = _t(sr, 0.03)
    k = i / max(1, n - 1)
    f = (1700 + 700 * k) if up else (2300 - 700 * k)
    s = np.sin(2 * np.pi * f * x) * np.exp(-x * 160) * 0.55
    s += _bp(rng.standard_normal(len(x)), sr, 2600, 6000) * np.exp(-x * 600) * 0.45
    return s


def delta(sr=48000, up=True):
    a = _blip(sr, 523.25, 530, 0.11, 18) * 0.8
    b = _blip(sr, 783.99, 790, 0.22, 11) * 0.8
    if not up:
        a = _blip(sr, 466.16, 460, 0.11, 18) * 0.8
        b = _blip(sr, 311.13, 300, 0.26, 9) * 0.85 + _blip(sr, 329.63, 318, 0.26, 9) * 0.3   # a sour minor-second rub
    out = np.zeros(int(0.32 * 48000 * sr / 48000))
    out[: len(a)] += a
    o = int(0.07 * sr)
    out[o:o + len(b)] += b[: len(out) - o]
    if up:
        g = _blip(sr, 2093, 2100, 0.18, 16) * 0.18
        o = int(0.1 * sr)
        out[o:o + len(g)] += g[: len(out) - o]
    return out


def pulse(sr=48000):
    x = _t(sr, 1.4)
    sw = (np.sin(2 * np.pi * 146.83 * x) + 0.5 * np.sin(2 * np.pi * 220 * x) + 0.3 * np.sin(2 * np.pi * 293.66 * x)) * np.sin(np.pi * np.clip(x / 1.4, 0, 1)) ** 2 * 0.35
    ch = np.sin(2 * np.pi * 1174.66 * x) * np.exp(-x * 4) * np.clip(x / 0.01, 0, 1) * 0.25 + np.sin(2 * np.pi * 1760 * x) * np.exp(-x * 5) * 0.12
    return sw + ch


def glitch(sr=48000, dur=0.6):
    rng = np.random.default_rng(404)
    x = _t(sr, dur)
    gate = np.zeros(len(x))
    k = 0
    while k < len(x):
        L = int(rng.uniform(0.015, 0.05) * sr)
        gate[k:k + L] = rng.uniform(0.3, 1.0) if rng.random() > 0.25 else 0
        k += L
    noise = _bp(rng.standard_normal(len(x)), sr, 900, 7000)
    noise = np.round(noise * 6) / 6                                          # bit-crush
    f = 1300 * np.exp(-x * 4.0) + 140
    sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / sr)) * 0.35
    hold = np.repeat(rng.uniform(-1, 1, len(x) // 120 + 1), 120)[: len(x)] * 0.25  # sample-and-hold buzz
    s = (noise * 0.6 + sq + hold) * gate
    return s * np.clip((dur - x) / 0.04, 0, 1)


def land(sr=48000):
    rng = np.random.default_rng(7)
    x = _t(sr, 0.9)
    th = np.sin(2 * np.pi * 58 * x * (1 - 0.2 * x)) * np.exp(-x * 7) * 0.9
    tail = _bp(rng.standard_normal(len(x)), sr, 80, 600) * np.exp(-x * 5) * 0.35
    low = np.sin(2 * np.pi * 73.4 * x) * np.exp(-x * 3) * 0.25 + np.sin(2 * np.pi * 77.8 * x) * np.exp(-x * 3) * 0.2   # D2 + a sour Eb2
    return th + tail + low
