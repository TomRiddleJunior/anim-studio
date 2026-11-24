"""Shared synth + mix helpers for the batch-8 reels (numpy/scipy only, no samples).
Import from a film's tools/sound_design.py:  sys.path.insert(0, HERE); from audio_kit import *
"""
import json
import os
import re
import subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 48000
RNG = np.random.default_rng(11)


def tt(d):
    return np.arange(int(max(d, 0.001) * SR)) / SR


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band", output="sos"), x, axis=0)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def place(bus, x, t, g=1.0, pan=0.0):
    """add mono x into the stereo bus at time t (s), equal-power pan -1..1"""
    i = int(round(t * SR))
    if i < 0:
        x = x[-i:]
        i = 0
    if i >= len(bus) or len(x) == 0:
        return
    x = x[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(x), 0] += x * g * l * 1.414
    bus[i:i + len(x), 1] += x * g * r * 1.414


def env_pw(t_, points):
    ts, vs = zip(*points)
    return np.interp(t_, ts, vs)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    a_, d_, r_ = int(a * SR), int(d * SR), int(r * SR)
    e = np.ones(n) * s
    e[:a_] = np.linspace(0, 1, a_) if a_ else e[:a_]
    e[a_:a_ + d_] = np.linspace(1, s, len(e[a_:a_ + d_]))
    if r_:
        e[-r_:] *= np.linspace(1, 0, len(e[-r_:]))
    return e


def reverb(x, rt=1.6, wet=0.25, seed=3, tone=5000):
    n = int(rt * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, tone)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- instruments
def pad_note(f, d, bright=900, det=0.004, att=1.2, rel=1.6):
    x = tt(d)
    y = np.zeros_like(x)
    for k, dt in enumerate((-det, 0, det)):
        ph = RNG.uniform(0, 6.28)
        saw = sum(np.sin(2 * np.pi * f * (1 + dt) * h * x + ph * h) / h for h in range(1, 7))
        y += saw
    y = lp(y, bright)
    return y * adsr(len(x), att, 0.4, 0.85, rel) / 3


def felt(f, d=2.4, bright=1800):
    """soft felt-piano-ish note: a few decaying partials + a hammer tick"""
    x = tt(d)
    y = np.zeros_like(x)
    for h, a, dec in ((1, 1.0, 1.4), (2, 0.42, 2.4), (3, 0.18, 3.6), (4, 0.08, 5.0)):
        y += a * np.sin(2 * np.pi * f * h * x * (1 + 0.0004 * h)) * np.exp(-x * dec)
    y += 0.05 * RNG.standard_normal(len(x)) * np.exp(-x * 120)
    y = lp(y, bright)
    y *= np.minimum(1, x / 0.006)
    return y * 0.5


def bell(f, d=2.0):
    x = tt(d)
    y = sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * dk) for r, a, dk in ((1, 1, 1.6), (2.76, 0.35, 3.2), (5.4, 0.18, 5.5), (8.9, 0.08, 8)))
    return y * np.minimum(1, x / 0.003) * 0.4


def pluck(f, d=0.5, bright=3000):
    x = tt(d)
    y = sum((0.6 ** h) * np.sin(2 * np.pi * f * (h + 1) * x) for h in range(5)) * np.exp(-x * 7)
    return lp(y, bright) * np.minimum(1, x / 0.002) * 0.6


def marimba(f, d=0.45):
    x = tt(d)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x * 9) + 0.35 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x * 26)
    return y * np.minimum(1, x / 0.002) * 0.7


def bass(f, d=0.4):
    x = tt(d)
    y = np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 2 * f * x)
    return lp(y, 600) * adsr(len(x), 0.005, 0.08, 0.6, 0.12) * 0.8


def kick(d=0.35):
    x = tt(d)
    f = 110 * np.exp(-x * 25) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9)


def hat(d=0.06):
    x = tt(d)
    return hp(RNG.standard_normal(len(x)), 7000) * np.exp(-x * 70) * 0.35


def shaker(d=0.09):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), 4000, 9000) * np.sin(np.pi * np.minimum(1, x / d)) * 0.3


# ---------------------------------------------------------------- SFX
def thump(f=55, d=0.6):
    x = tt(d)
    fr = f * 1.8 * np.exp(-x * 18) + f
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-x * 6) + 0.2 * lp(RNG.standard_normal(len(x)), 400) * np.exp(-x * 30)


def boom(d=2.2):
    x = tt(d)
    f = 52 * np.exp(-x * 1.1) + 30
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.7) + 0.25 * lp(RNG.standard_normal(len(x)), 160) * np.exp(-x * 3)


def knock(f=180, d=0.25):
    x = tt(d)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x * 30) + 0.5 * bp(RNG.standard_normal(len(x)), 300, 2500) * np.exp(-x * 60)
    return y


def creak(d=0.8, f=9, lo=500, hi=1600):
    x = tt(d)
    n = bp(RNG.standard_normal(len(x)), lo, hi)
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * f * x * (1 + 0.3 * np.sin(2 * np.pi * 0.7 * x))))
    return n * am * np.sin(np.pi * np.minimum(1, x / d)) * 0.8


def whoosh(d=0.6, lo=300, hi=3000):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    env = np.sin(np.pi * x / d) ** 2
    return bp(n, lo, hi) * env


def riser(d=2.0):
    x = tt(d)
    n = RNG.standard_normal(len(x))
    y = np.zeros_like(x)
    seg = int(0.05 * SR)
    for i in range(0, len(x), seg):
        q = i / len(x)
        y[i:i + seg] = bp(n[i:i + seg], 200 + 2600 * q, 400 + 5200 * q)
    return y * (x / d) ** 2


def buzz(d=0.12, f=120):
    x = tt(d)
    y = np.sign(np.sin(2 * np.pi * f * x)) * 0.5 + 0.3 * np.sign(np.sin(2 * np.pi * f * 3.01 * x))
    return bp(y, 150, 3000) * np.sin(np.pi * x / d)


def pop(f0=600, f1=900, d=0.09):
    x = tt(d)
    f = np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 40)


def click(f=2500, d=0.02):
    x = tt(d)
    return np.sin(2 * np.pi * f * x) * np.exp(-x * 300)


def tick(f=3000):
    a = click(f, 0.03)
    a[:960] += 0.4 * click(f * 1.5, 0.02)
    return a


def noise_burst(d=0.5, lo=200, hi=2000):
    x = tt(d)
    return bp(RNG.standard_normal(len(x)), lo, hi) * np.exp(-x * 6)


def trumpet(d=0.8, f0=330, f1=470):
    """a soft, filtered 'baby elephant' call: a gliding saw with vibrato, bandpassed"""
    x = tt(d)
    f = np.interp(x, [0, d * 0.3, d], [f0, f1, f1 * 0.92]) * (1 + 0.025 * np.sin(2 * np.pi * 6 * x))
    ph = np.cumsum(f) / SR
    y = sum(np.sin(2 * np.pi * h * ph) / h for h in range(1, 9))
    y = bp(y, 500, 2600)
    return y * np.sin(np.pi * np.minimum(1, x / d)) ** 0.7 * 0.5


def ring(d=1.2, f=1300):
    """old phone bell ring: two-tone tremolo"""
    x = tt(d)
    y = (np.sin(2 * np.pi * f * x) + 0.6 * np.sin(2 * np.pi * f * 1.5 * x)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 20 * x)))
    return y * np.exp(-x * 0.8) * 0.4


def snore(d=1.6, f=70):
    """a snore: low buzzy inhale (rough, amplitude-modulated) then a soft exhale"""
    x = tt(d)
    inh = x < d * 0.62
    fr = f * (1 + 0.15 * np.sin(2 * np.pi * 0.8 * x))
    saw = sum(np.sin(2 * np.pi * h * np.cumsum(fr) / SR) / h for h in range(1, 12))
    rough = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 28 * x))
    y = lp(saw * rough, 900) * np.where(inh, np.sin(np.pi * x / (d * 0.62)), 0)
    ex = bp(RNG.standard_normal(len(x)), 300, 1400) * np.where(~inh, np.sin(np.pi * (x - d * 0.62) / (d * 0.38)), 0) * 0.35
    return (y + ex) * 0.7


# ---------------------------------------------------------------- loudness + export
def loudnorm(src, dst_wav, dst_m4a, target=-14.0, tp=-2.0):
    r = subprocess.run([FF, "-hide_banner", "-i", src, "-af", f"loudnorm=I={target}:TP={tp}:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    af = (f"loudnorm=I={target}:TP={tp}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", src, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", dst_wav], check=True)
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", dst_wav, "-c:a", "aac", "-b:a", "256k", dst_m4a], check=True)
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", dst_m4a, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    I_ = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    TP_ = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    return {"lufs": float(I_[-1]) if I_ else None, "true_peak_dbtp": float(TP_[-1]) if TP_ else None, "input_lufs": m["input_i"]}


def mixdown(root, voc, bed, sfx, speech, bed_db_under=22.0, sfx_db=-3.0, fade_s=1.0, name="final"):
    """voice + bed (set to bed_db_under below the voice under speech) + sfx (loudest 100 ms ~ sfx_db re the voice peak);
    writes score/audio/*.wav, assets/audio/final.m4a and assets/audio/nomusic.m4a (voice + sfx), returns the level report"""
    N = len(voc)
    vo_db = rms_db(voc[speech, 0])
    bed_db = rms_db(bed[speech, 0]) if np.any(bed) else -120
    bed = bed * (10 ** ((vo_db - bed_db_under - bed_db) / 20) if np.any(bed) else 0)
    w = int(0.1 * SR)
    sm = sfx.mean(axis=1)
    nwin = len(sm) // w
    loud = np.percentile(np.sqrt((sm[: nwin * w].reshape(nwin, w) ** 2).mean(axis=1)), 99.8)
    vp = np.percentile(np.sqrt((voc[: nwin * w, 0].reshape(nwin, w) ** 2).mean(axis=1)), 99.5)
    g_sfx = (vp / (loud + 1e-12)) * 10 ** (sfx_db / 20)
    sfx = sfx * g_sfx
    fade = np.ones(N)
    fl = int(fade_s * SR)
    fade[-fl:] = np.linspace(1, 0, fl) ** 1.6
    out = os.path.join(root, "score", "audio")
    os.makedirs(out, exist_ok=True)
    os.makedirs(os.path.join(root, "assets", "audio"), exist_ok=True)
    full = (voc + bed + sfx) * fade[:, None]
    dry = (voc + sfx) * fade[:, None]
    k = 0.89 / (np.abs(full).max() + 1e-9)
    for nm, x in (("vo", voc), ("bed", bed), ("sfx", sfx)):
        sf.write(os.path.join(out, nm + ".wav"), (x * k).astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(out, "mix_raw.wav"), (full * k).astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(out, "nomusic_raw.wav"), (dry * k).astype(np.float32), SR, subtype="FLOAT")
    rep = {"vo_rms_db_speech": round(vo_db, 2), "bed_re_vo_db": round(rms_db(bed[speech, 0]) - vo_db, 2) if np.any(bed) else None,
           "bed_plus_sfx_re_vo_db": round(rms_db(((bed + sfx) * fade[:, None])[speech, 0]) - vo_db, 2),
           "sfx_re_vo_db": round(rms_db(sfx[speech, 0]) - vo_db, 2), "sfx_gain_db": round(20 * np.log10(g_sfx), 2)}
    rep["final"] = loudnorm(os.path.join(out, "mix_raw.wav"), os.path.join(out, "final.wav"), os.path.join(root, "assets", "audio", "final.m4a"))
    rep["nomusic"] = loudnorm(os.path.join(out, "nomusic_raw.wav"), os.path.join(out, "nomusic.wav"), os.path.join(root, "assets", "audio", "nomusic.m4a"))
    json.dump(rep, open(os.path.join(root, "score", "levels.json"), "w"), indent=1)
    return rep
