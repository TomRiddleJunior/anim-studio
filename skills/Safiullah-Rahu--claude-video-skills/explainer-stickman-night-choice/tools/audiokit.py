"""audiokit — numpy synth + mixing kit for the 2D story reels (no samples, no licences).
Primitives return mono float arrays at SR; place() adds them into a stereo bus. master() levels a mix to -14 LUFS with
a true-peak-aware look-ahead limiter; each delivery mix (full, no-music) is levelled on its own.
ffmpeg comes from $FFMPEG or the PATH.
"""
import json
import os
import re
import shutil
import subprocess

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

SR = 48000
FF = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"


def mix(*xs):
    """sum mono arrays of different lengths (padded to the longest)"""
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100) / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band", output="sos"), x, axis=0)


def noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n)


def env(n, a=0.005, d=0.2, s=0.0, r=0.05, hold=None):
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    Hh = n - A - D - R if hold is None else int(hold * SR)
    e = np.concatenate([np.linspace(0, 1, max(1, A)), np.linspace(1, s, max(1, D)), np.full(max(0, Hh), s), np.linspace(s, 0, max(1, R))])
    return np.concatenate([e, np.zeros(max(0, n - len(e)))])[:n]


def expd(d, tau):
    t = tt(d)
    return np.exp(-t / tau)


def sweep(f0, f1, d, geo=True):
    n = int(d * SR)
    f = np.geomspace(f0, f1, n) if geo else np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(bus) or g == 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: len(bus) - i]
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.4142, np.sin((pan + 1) * np.pi / 4) * 1.4142
        bus[i:i + len(x), 0] += x * g * l
        bus[i:i + len(x), 1] += x * g * r
    else:
        bus[i:i + len(x)] += x * g


def reverb(x, rt=1.6, wet=0.25, seed=3, lpf=6000, pre=0.012):
    n = int(rt * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, lpf)
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def env_spans(n, spans, fade=0.3):
    e = np.zeros(n)
    for a, b in spans:
        i, j = max(0, int(a * SR)), min(n, int(b * SR))
        if j > i:
            e[i:j] = 1
    return uniform_filter1d(e, size=max(1, int(fade * SR)))


def curve(n, pts):
    """piecewise-linear automation from [(t, v), ...]"""
    ts = np.array([p[0] for p in pts]) * SR
    vs = np.array([p[1] for p in pts])
    return np.interp(np.arange(n), ts, vs)


def compress(x, crest_db=11.0):
    """look-ahead peak limiting of a mono voice stem, ceiling crest_db above its speech RMS (tames TTS syllable peaks)."""
    m = np.abs(x) > 1e-4
    if not m.any():
        return x
    ceil = 10 ** ((rms_db(x[m]) + crest_db) / 20)
    g = np.minimum(1.0, ceil / np.maximum(np.abs(x), 1e-9))
    g = minimum_filter1d(g, size=int(0.01 * SR))
    g = uniform_filter1d(g, size=int(0.005 * SR))
    a_r = np.exp(-1 / (0.06 * SR))
    gs = lfilter([1 - a_r], [1, -a_r], g - 1) + 1
    return x * np.minimum(g, gs)


# ---------------------------------------------------------------- instruments
def pluck(f, d=0.6, bright=0.5, seed=0):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * k * t + k) * (bright ** (k - 1)) / k for k in range(1, 6))
    return x * np.exp(-t / (d * 0.28)) * env(len(t), 0.002, d, 0, 0.02)


def marimba(f, d=0.9):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.05)) * np.exp(-t / 0.22)


def bell(f, d=2.0, ratio=3.5, index=2.0):
    t = tt(d)
    m = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t / 0.6)
    return np.sin(2 * np.pi * f * t + m) * np.exp(-t / 0.8)


def pad(freqs, d, cutoff=1400, attack=0.8, release=1.2, seed=0):
    t = tt(d)
    r = np.random.default_rng(seed)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ph = r.random() * 6.28
            x += 2 * ((f * (1 + det / 100) * t + ph / 6.28) % 1) - 1
    x = lp(x / (len(freqs) * 3), cutoff, 2)
    return x * env(len(t), attack, 0.1, 1.0, release)


def sub(f, d, a=0.02, r=0.3):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * env(len(t), a, 0.05, 1.0, r)


def kick(g=1.0):
    t = tt(0.4)
    f = 48 + 90 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * g


def shaker(g=1.0, seed=0):
    t = tt(0.09)
    return hp(noise(len(t), seed), 6000) * np.exp(-t / 0.025) * g


def drone(d, f0=55.0, beat=0.35, seed=0):
    t = tt(d)
    x = np.sin(2 * np.pi * f0 * t) + 0.7 * np.sin(2 * np.pi * (f0 + beat) * t) + 0.25 * np.sin(2 * np.pi * f0 * 1.5 * t)
    x += 0.15 * lp(noise(len(t), seed), 300)
    return x / 2.2


# ---------------------------------------------------------------- foley / UI
def whoosh(d=0.45, lo=300, hi=3000, seed=1):
    n = int(d * SR)
    x = noise(n, seed)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return bp(x, lo, hi) * e


def pop(f=900, d=0.08):
    t = tt(d)
    return np.sin(2 * np.pi * (f + 600 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.02)


def thud(f=70, d=0.35, g=1.0, seed=0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t * (1 + 0.6 * np.exp(-t / 0.03))) * np.exp(-t / 0.09) + 0.3 * lp(noise(len(t), seed), 800) * np.exp(-t / 0.03)) * g


def click(seed=0, f=3000):
    t = tt(0.03)
    return bp(noise(len(t), seed), f * 0.6, f * 1.6) * np.exp(-t / 0.004)


def tick(f=2400):
    t = tt(0.04)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006)


def drip(seed=0):
    t = tt(0.18)
    f = 900 + 1400 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04) * 0.8


def step(seed=0, surface="stone"):
    t = tt(0.14)
    x = noise(len(t), seed)
    if surface == "stone":
        return (bp(x, 300, 2400) * np.exp(-t / 0.018) + 0.6 * np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.03))
    return lp(x, 900) * np.exp(-t / 0.03)


def shuffle(seed=0):
    t = tt(0.32)
    return bp(noise(len(t), seed), 200, 1500) * env(len(t), 0.06, 0.15, 0.3, 0.1)


def groan(d=1.2, f=95, seed=0):
    """a low wordless moan (PG): a buzzy source through two vowel formants, slow pitch sag"""
    t = tt(d)
    fr = f * (1 - 0.12 * t / d) * (1 + 0.02 * np.sin(2 * np.pi * 5 * t))
    src = (2 * ((np.cumsum(fr) / SR) % 1) - 1) + 0.3 * noise(len(t), seed)
    v = bp(src, 450, 800) * 1.0 + bp(src, 900, 1300) * 0.5
    return lp(v, 1600) * env(len(t), 0.25, 0.3, 0.7, 0.4)


def spark(seed=0, d=0.5):
    t = tt(d)
    r = np.random.default_rng(seed)
    x = np.zeros(len(t))
    for _ in range(26):
        i = int(r.random() * (len(t) - 2000))
        x[i:i + 600] += hp(noise(600, int(r.random() * 1e6)), 3000) * np.exp(-np.arange(600) / 120)
    return x * 0.5


def stamp(g=1.0):
    return mix(thud(110, 0.3, 1.0) * 0.9 * g, click(3, 1500) * 0.6 * g)


def ding(f=1320, d=0.8):
    return bell(f, d, 2.0, 1.2) * 0.6


def radio_crackle(d, seed=0):
    n = int(d * SR)
    r = np.random.default_rng(seed)
    x = bp(noise(n, seed), 800, 4000) * 0.3
    pops = np.zeros(n)
    for i in r.integers(0, n - 200, int(d * 40)):
        pops[i:i + 120] += r.normal(0, 1.0, 120) * np.exp(-np.arange(120) / 25)
    return (x + pops) * env(n, 0.02, 0.1, 1.0, 0.1)


def hum(d, f=50, g=1.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)) * g / 1.75


def fan_noise(d, seed=0):
    n = int(d * SR)
    t = tt(d)
    return lp(noise(n, seed), 900) * 0.6 + 0.25 * np.sin(2 * np.pi * 37 * t) * (1 + 0.3 * np.sin(2 * np.pi * 8 * t))


def powerdown(d=1.6):
    t = tt(d)
    f = 120 * np.exp(-t / (d * 0.5)) + 20
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 3) / SR)) * np.exp(-t / (d * 0.6))


def buzz(d=0.5, seed=0):
    """a phone vibrating on a surface"""
    t = tt(d)
    x = np.sin(2 * np.pi * 165 * t) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 12 * t)))
    return lp(x + 0.2 * noise(len(t), seed), 900) * env(len(t), 0.01, 0.05, 1.0, 0.05)


def notify(f1=1175, f2=1568):
    a = bell(f1, 0.5, 2.0, 0.8) * 0.5
    b = bell(f2, 0.9, 2.0, 0.8) * 0.5
    out = np.zeros(len(a) // 2 + len(b))
    out[: len(a)] += a
    out[len(a) // 2: len(a) // 2 + len(b)] += b
    return out


def heartbeat(g=1.0):
    a = thud(48, 0.25, 1.0)
    out = np.zeros(int(0.6 * SR))
    out[: len(a)] += a
    out[int(0.24 * SR): int(0.24 * SR) + len(a)] += a * 0.7
    return out * g


def relay(seed=0):
    """a heavy breaker clunk (lights going off)"""
    return mix(thud(60, 0.4, 1.0, seed), click(seed, 900) * 0.8)


def rewind(d=0.7):
    t = tt(d)
    f = np.geomspace(300, 2400, len(t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(noise(len(t), 9), 1500, 6000) * 0.4
    return x * env(len(t), 0.02, 0.1, 1.0, 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t))


def whine(d, f=4400):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t))


# ---------------------------------------------------------------- loudness + mastering
def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return (float(I_[-1]) if I_ else None, float(TP_[-1]) if TP_ else None)


def limiter(x, ceiling_db=-2.0, look=0.004, rel=0.08):
    c = 10 ** (ceiling_db / 20)
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up.reshape(-1, 4).max(axis=1)[: len(x)]
    if len(pk) < len(x):
        pk = np.concatenate([pk, np.zeros(len(x) - len(pk))])
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    L = int(look * SR)
    g = minimum_filter1d(need, size=2 * L + 1)
    a = np.exp(-1 / (rel * SR))
    rec = lfilter([1 - a], [1, -a], g - 1) + 1  # smooth recovery
    return x * np.minimum(g, rec)[:, None]


def level(mix, path, target=-14.0, ceiling=-2.0):
    """gain + limiter iterations until the file measures target LUFS; returns (lufs, tp, gain_db)"""
    tmp = path + ".probe.wav"
    sf.write(tmp, mix.astype(np.float32), SR, subtype="FLOAT")
    I0, _ = measure(tmp)
    g = 10 ** ((target - I0) / 20)
    out = mix
    for _ in range(4):
        out = limiter(mix * g, ceiling)
        sf.write(tmp, out.astype(np.float32), SR, subtype="FLOAT")
        I1, TP1 = measure(tmp)
        if abs(I1 - target) < 0.2:
            break
        g *= 10 ** ((target - I1) / 20)
    os.replace(tmp, path)
    I2, TP2 = measure(path)
    return I2, TP2, round(20 * np.log10(g), 2)


def to_m4a(wav, m4a):
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", wav, "-c:a", "aac", "-b:a", "256k", "-ar", "48000", m4a], check=True)


def voice_over_rest(voice, rest, vo_lines):
    """RMS of the voice while it speaks vs the RMS of everything else over the same spans (dB)"""
    m = np.zeros(len(voice), bool)
    for l in vo_lines:
        m[int(l["start"] * SR): int(l["end"] * SR)] = True
    v = voice[m].mean(axis=1) if voice.ndim == 2 else voice[m]
    r = rest[m].mean(axis=1) if rest.ndim == 2 else rest[m]
    return round(rms_db(v) - rms_db(r), 1)
