"""Small numpy synth + mixing kit shared by the batch-8 edit reels (no samples, no licences).
Primitives return mono float arrays at SR; `place` adds them into a stereo bus at a time with gain and pan.
Mastering: `master(stems, out_dir)` -> full mix and the no-music mix at the SAME gain (the no-music file is the full mix
minus the music stem), -14 LUFS integrated on the full mix, true peak <= -1.5 dBTP via a 4x-oversampled look-ahead limiter.
"""
import json
import os
import re
import subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

SR = 48000
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"


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
    """attack/decay/sustain/release envelope over n samples (hold = sustain length in s, else fills)."""
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    H = n - A - D - R if hold is None else int(hold * SR)
    H = max(0, H)
    e = np.concatenate([np.linspace(0, 1, max(1, A)), np.linspace(1, s, max(1, D)), np.full(H, s), np.linspace(s, 0, max(1, R))])
    if len(e) < n:
        e = np.concatenate([e, np.zeros(n - len(e))])
    return e[:n]


def sweep(f0, f1, d, geo=True):
    n = int(d * SR)
    f = np.geomspace(f0, f1, n) if geo else np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(bus):
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: len(bus) - i]
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.4142, np.sin((pan + 1) * np.pi / 4) * 1.4142
    if x.ndim == 1:
        bus[i:i + len(x), 0] += x * g * l
        bus[i:i + len(x), 1] += x * g * r
    else:
        bus[i:i + len(x)] += x * g


def reverb(x, rt=1.6, wet=0.25, seed=3, lpf=6000, pre=0.012):
    """stereo noise-IR reverb; x is (n, 2)"""
    n = int(rt * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, lpf)
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def delay(x, t, fb=0.35, mix=0.3, n_taps=5, lpf=3500):
    """feedback-style echo built from taps (stereo ping-pong)"""
    y = np.zeros_like(x)
    d = int(t * SR)
    g = 1.0
    src = x.copy()
    for k in range(1, n_taps + 1):
        g *= fb
        src = lp(src, lpf, 1)
        sh = np.zeros_like(x)
        if d * k < len(x):
            sh[d * k:] = src[: len(x) - d * k]
        if k % 2:
            sh = sh[:, ::-1]
        y += sh * g
    return x + y * mix / max(fb, 1e-6)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return (float(I_[-1]) if I_ else None, float(TP_[-1]) if TP_ else None)


def limiter(x, ceiling_db=-1.5, look=0.004, rel=0.08):
    """look-ahead peak limiter on a 4x-oversampled envelope (true-peak aware); x (n, 2)"""
    c = 10 ** (ceiling_db / 20)
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up.reshape(-1, 4).max(axis=1)[: len(x)]
    if len(pk) < len(x):
        pk = np.concatenate([pk, np.zeros(len(x) - len(pk))])
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    L = int(look * SR)
    # look-ahead: min over the window ahead
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * L + 1, origin=0)
    # release smoothing (one-pole, only when gain rises)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return x * out[:, None]


def master(stems, out_dir, target=-14.0, music_key="music", ceiling=-1.5):
    """stems: dict name -> (n, 2). Writes full.wav, nomusic.wav (same gain, music removed), stems/*.wav, levels.json."""
    os.makedirs(out_dir, exist_ok=True)
    full = sum(stems.values())
    nom = sum(v for k, v in stems.items() if k != music_key)
    tmp = os.path.join(out_dir, "_probe.wav")
    sf.write(tmp, full.astype(np.float32), SR, subtype="FLOAT")
    I0, _ = measure(tmp)
    g = 10 ** ((target - I0) / 20)
    rep = {"pre_lufs": I0, "gain_db": round(20 * np.log10(g), 2)}
    for it in range(3):
        f = limiter(full * g, ceiling)
        sf.write(tmp, f.astype(np.float32), SR, subtype="FLOAT")
        I1, TP1 = measure(tmp)
        if abs(I1 - target) < 0.25:
            break
        g *= 10 ** ((target - I1) / 20)
    n = limiter(nom * g, ceiling)
    sf.write(os.path.join(out_dir, "full.wav"), f.astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(out_dir, "nomusic.wav"), n.astype(np.float32), SR, subtype="FLOAT")
    for k, v in stems.items():
        sf.write(os.path.join(out_dir, f"stem_{k}.wav"), (v * g).astype(np.float32), SR, subtype="FLOAT")
    os.remove(tmp)
    I2, TP2 = measure(os.path.join(out_dir, "full.wav"))
    I3, TP3 = measure(os.path.join(out_dir, "nomusic.wav"))
    rep.update({"full_lufs": I2, "full_tp_dbtp": TP2, "nomusic_lufs": I3, "nomusic_tp_dbtp": TP3, "final_gain_db": round(20 * np.log10(g), 2)})
    return rep


def to_m4a(wav, m4a):
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", wav, "-c:a", "aac", "-b:a", "256k", m4a], check=True)
