"""Sound for "The Rusted Lock" (strike-counter format): every sound is synthesized here with numpy (no samples).

Two stems, mastered twice:
  sfx    rusty creaks on the slow turns, a clunk on each slow count, a ratchet click on every counted turn in the race
         (~30/s) over a crank whir that follows the turn speed, panting while the figure rests, the scan sweep, a faint
         crackle inside the lock, the 101st turn's snap + shackle clack + sub boom + falling flakes, the counter roll and
         the new lock's thud.
  music  an original bed: a low drone that swells with the race, a drop to near silence on turn 100, a suspended
         heartbeat + riser under the reveal, then a warm D-major chord and bell on the release that fades out by the
         loop point (so frame 0 follows the last frame without a seam).
Writes score/final.wav (music + sfx) and score/final_nomusic.wav (sfx only), each -14 LUFS integrated, true peak
<= -2 dBTP before AAC; assets/audio/final.m4a; score/levels.json.

usage: python -X utf8 -I tools/score.py        (FFMPEG env var or ffmpeg on PATH, for loudness and the m4a)
"""
import json
import os
import re
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from scipy.ndimage import minimum_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = os.environ.get("FFMPEG", "ffmpeg")
SR = 48000
DUR = 14.0
N = int(DUR * SR)


# ---------------------------------------------------------------- synth helpers
def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100) / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band", output="sos"), x, axis=0)


def noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def place(bus, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(bus) or g == 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: len(bus) - i]
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.4142, np.sin((pan + 1) * np.pi / 4) * 1.4142
    bus[i:i + len(x), 0] += x * g * l
    bus[i:i + len(x), 1] += x * g * r


def reverb(x, rt=1.4, wet=0.25, seed=3, lpf=5000):
    n = int(rt * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = lp(ir, lpf)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True)) + 1e-9
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- the film's clock (mirrors assets/lib/film.js)
RACE = [[1.5, 2], [1.83, 4], [2.0, 7], [2.17, 11], [2.33, 16], [2.5, 21], [4.67, 85], [4.83, 89], [5.0, 92],
        [5.17, 95], [5.33, 97], [5.5, 98], [5.67, 99], [5.999, 99], [6.0, 100]]


def count(t):
    if t < 0.5:
        return 0
    if t < 1.5:
        return 1
    if t < 6.0:
        for (a, na), (b, nb) in zip(RACE, RACE[1:]):
            if a <= t < b:
                return int(np.floor(na + (nb - na) * (t - a) / (b - a) + 1e-6))
        return 99
    return 100 if t < 10.0 else 101


INC = []
last = 0
for ms in range(0, 10051):
    n = count(ms / 1000)
    while n > last:
        last += 1
        INC.append((last, ms / 1000))


def race_speed(t):
    if t < 2.1:
        return 2.5 + (5 - 2.5) * (t - 1.5) / 0.6
    if t < 4.6:
        return 5.0
    if t < 5.75:
        return 5 + (2.2 - 5) * (t - 4.6) / 1.15
    return 2.2 + (1.6 - 2.2) * (t - 5.75) / 0.25


acc, raw = 0.0, [0.0]
for ms in range(1500, 6000):
    acc += race_speed(ms / 1000) / 1000
    raw.append(acc)
scale = round(acc) / acc
TURN_ENDS = [1500 / 1000 + i / 1000 for i in range(1, len(raw)) if int(raw[i] * scale) > int(raw[i - 1] * scale)]
SPEED = lambda t: race_speed(t) * scale if 1.5 <= t < 6.0 else 0.0  # noqa: E731


# ---------------------------------------------------------------- sound design
def creak(d, f0=170, f1=250, seed=1, rough=32):
    """rusty bowed-metal creak: stick-slip pulses through resonances that glide in pitch"""
    t = tt(d)
    f = np.geomspace(f0, f1, len(t)) * (1 + 0.03 * np.sin(2 * np.pi * 3.1 * t))
    ph = np.cumsum(f) / SR
    pulse = (np.mod(ph, 1.0) < 0.12).astype(float)                    # stick-slip impulses at the creak pitch
    am = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * rough * t + noise(len(t), seed).cumsum() * 0.002))
    x = pulse * am + 0.15 * noise(len(t), seed + 1)
    y = sum(g * bp(x, fc * 0.92, fc * 1.08) for fc, g in [(f0 * 3.1, 1.0), (f0 * 5.3, 0.6), (f0 * 8.7, 0.35), (1900, 0.25)])
    e = np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.06)
    return y * e / (np.abs(y).max() + 1e-9)


def clunk(seed=2, big=1.0):
    d = 0.6
    t = tt(d)
    thud = np.sin(2 * np.pi * np.cumsum(np.geomspace(95, 48, len(t))) / SR) * env_exp(len(t), 0.07)
    metal = sum(a * np.sin(2 * np.pi * f * t + p) * env_exp(len(t), tau) for f, a, tau, p in
                [(410, 0.5, 0.09, 0.3), (1130, 0.35, 0.06, 1.1), (2270, 0.22, 0.035, 2.0), (3410, 0.12, 0.02, 0.7)])
    rattle = bp(noise(len(t), seed), 900, 5000) * env_exp(len(t), 0.03)
    x = 1.0 * thud + 0.55 * metal * big + 0.5 * rattle
    return x / np.abs(x).max()


def click(seed):
    d = 0.03
    x = bp(noise(int(d * SR), seed), 1800, 7000) * env_exp(int(d * SR), 0.0045)
    tick = np.sin(2 * np.pi * (2600 + 600 * np.random.default_rng(seed).random()) * tt(d)) * env_exp(int(d * SR), 0.006)
    x = x + 0.5 * tick
    return x / np.abs(x).max()


def breath(d, seed, inhale=False):
    t = tt(d)
    x = bp(noise(len(t), seed), 500, 2600 if inhale else 1800)
    e = np.sin(np.pi * np.minimum(1, t / d)) ** (1.5 if inhale else 2.2)
    return x * e / (np.abs(x).max() + 1e-9)


def snap():
    d = 1.4
    t = tt(d)
    crack_ = hp(noise(len(t), 77), 1500) * env_exp(len(t), 0.012)
    ring = sum(a * np.sin(2 * np.pi * f * t) * env_exp(len(t), tau) for f, a, tau in [(620, 0.6, 0.35), (1475, 0.45, 0.25), (2930, 0.3, 0.18), (4410, 0.18, 0.1)])
    clack = bp(noise(len(t), 78), 700, 3500) * env_exp(len(t), 0.05)
    spring = np.sin(2 * np.pi * np.cumsum(330 + 140 * np.sin(2 * np.pi * 26 * t) * env_exp(len(t), 0.2)) / SR) * env_exp(len(t), 0.28) * np.minimum(1, t / 0.02)
    x = 1.4 * crack_ + 0.8 * ring + 0.8 * clack + 0.35 * spring
    return x / np.abs(x).max()


def boom():
    d = 3.2
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(np.geomspace(72, 38, len(t))) / SR) * env_exp(len(t), 0.9) * np.minimum(1, t / 0.006)
    body = lp(noise(len(t), 91), 220) * env_exp(len(t), 0.35)
    x = sub + 0.6 * body / (np.abs(body).max() + 1e-9)
    return x / np.abs(x).max()


def shimmer(d=2.6, seed=5):
    t = tt(d)
    x = hp(noise(len(t), seed), 5000) * np.exp(-t / 0.9) * np.minimum(1, t / 0.05)
    tw = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.4 + 0.3 * k)) for k, f in enumerate([2349, 2960, 3520, 4699]))
    return (x / (np.abs(x).max() + 1e-9)) * 0.6 + 0.4 * tw / np.abs(tw).max()


def tinkle(seed):
    d = 0.12
    t = tt(d)
    f = 3000 + 3000 * np.random.default_rng(seed).random()
    return np.sin(2 * np.pi * f * t) * env_exp(len(t), 0.02) + 0.4 * bp(noise(len(t), seed), 3000, 9000) * env_exp(len(t), 0.008)


def sweep_up(d=0.75):
    t = tt(d)
    f = np.geomspace(260, 1500, len(t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    x = x * np.sin(np.pi * t / d) ** 1.2
    air = hp(noise(len(t), 33), 4000) * np.sin(np.pi * t / d) ** 2
    return 0.8 * x + 0.25 * air


def build_sfx():
    bus = np.zeros((N, 2))
    # slow turns: creak while turning, clunk on the count
    cr = creak(0.48, 150, 230, 1); cr *= np.minimum(1, np.arange(len(cr)) / SR / 0.25) ** 2
    place(bus, cr, 0.0, 0.55, -0.2)
    place(bus, creak(0.5, 140, 210, 3, 26), 1.0, 0.55, -0.2)
    place(bus, clunk(2), 0.5, 0.9, -0.15)
    place(bus, clunk(4), 1.5, 0.85, -0.15)
    # the race: a ratchet click on every counted turn, a crank whir with the speed, soft clunks per visible turn
    for n, t0 in INC:
        if 2 < n < 100:
            place(bus, click(100 + n), t0, 0.52 + 0.1 * np.sin(n), -0.25 + 0.1 * np.sin(n * 1.7))
    t = np.arange(N) / SR
    sp = np.array([SPEED(x) for x in t[::480]])
    spe = np.interp(t, t[::480], sp)
    whir = bp(noise(N, 61), 160, 900) * (spe / 6.0) ** 1.3
    whir += 0.5 * bp(noise(N, 62), 1200, 3200) * (spe / 6.0) ** 2
    bus[:, 0] += whir * 0.34
    bus[:, 1] += whir * 0.28
    for k, t0 in enumerate(TURN_ENDS[:-1]):
        place(bus, clunk(200 + k, big=0.4), t0, 0.42, -0.15)
    place(bus, clunk(9, big=1.3), 6.0, 1.0, -0.1)                    # turn 100
    # rest: panting (out-in pairs at ~1.4 Hz, slowing)
    tb = 6.25
    k = 0
    while tb < 8.55:
        place(bus, breath(0.32, 300 + k), tb, 0.12, -0.35)
        place(bus, breath(0.28, 400 + k, inhale=True), tb + 0.36, 0.08, -0.35)
        tb += 0.72 + 0.05 * k
        k += 1
    # the scan, the hum of the reveal, the crackle inside
    place(bus, sweep_up(0.7), 6.78, 0.32, 0.15)
    hum_t = tt(2.5)
    hum = (np.sin(2 * np.pi * 120 * hum_t) + 0.4 * np.sin(2 * np.pi * 240 * hum_t)) * np.minimum(1, hum_t / 0.3) * np.minimum(1, (2.5 - hum_t) / 0.4)
    place(bus, hum, 7.35, 0.02, 0.1)
    r = np.random.default_rng(8)
    for i in range(28):
        place(bus, click(500 + i) * 0.6, 7.45 + r.random() * 2.3, 0.07 + 0.05 * r.random(), 0.2 + 0.3 * r.random())
    # grip, wind-up breath, the final creak
    place(bus, breath(0.5, 700, inhale=True), 9.22, 0.16, -0.35)
    place(bus, creak(0.24, 200, 300, 11, 40), 9.76, 0.6, -0.2)
    # the release
    place(bus, snap(), 10.0, 1.25, 0.05)
    place(bus, boom(), 10.0, 1.25, 0.0)
    place(bus, shimmer(), 10.02, 0.25, 0.2)
    for i in range(26):                                               # flakes and chips landing
        place(bus, tinkle(900 + i), 10.35 + r.random() * 0.9, 0.06 + 0.06 * r.random(), -0.4 + 0.8 * r.random())
    # the loop: counter roll ticks, the next lock's soft thud
    for i in range(5):
        place(bus, click(950 + i) * 0.7, 13.36 + i * 0.055, 0.14, 0.0)
    place(bus, clunk(13, big=0.3), 13.66, 0.32, 0.1)
    bus = reverb(bus, rt=1.1, wet=0.18, seed=4)
    # room tone, filtered circularly so the end wraps into the start without a seam
    spec = np.fft.rfft(noise(N, 999))
    f = np.fft.rfftfreq(N, 1 / SR)
    spec *= 1 / (1 + (f / 260) ** 2) * (f > 30)
    room = np.fft.irfft(spec, N)
    room /= np.abs(room).max()
    bus[:, 0] += 0.012 * room
    bus[:, 1] += 0.012 * np.roll(room, 2400)
    return bus


def pad_voice(f, t, bright=0.4, seed=0):
    """warm detuned saw-ish pad voice (additive, 8 partials)"""
    r = np.random.default_rng(seed)
    x = np.zeros_like(t)
    for det in (-0.004, 0.0, 0.0045):
        ph = r.random() * 6.28
        for k in range(1, 9):
            x += (1 / k) * (bright ** (k - 1)) ** 0.6 * np.sin(2 * np.pi * f * (1 + det) * k * t + ph * k)
    return x / (np.abs(x).max() + 1e-9)


def bell(f, d=3.5):
    t = tt(d)
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (tau)) for m, a, tau in [(1, 1.0, 1.6), (2.01, 0.45, 0.9), (3.0, 0.25, 0.6), (4.2, 0.18, 0.35), (5.4, 0.1, 0.2)])
    return x * np.minimum(1, t / 0.004)


def build_music():
    bus = np.zeros((N, 2))
    t = np.arange(N) / SR
    # 1) drone that swells with the race (D2 + A2), opening filter; drops out at turn 100
    dr = pad_voice(mtof(38), t, 0.5, 1) + 0.7 * pad_voice(mtof(45), t, 0.5, 2)
    swell = np.clip(t / 6.0, 0, 1) ** 1.6
    gate = np.where(t < 5.9, 1.0, np.clip(1 - (t - 5.9) / 0.12, 0, 1))
    fade_in = np.clip(t / 0.6, 0, 1)
    drone = lp(dr, 500) * (0.25 + 0.75 * swell) * gate * fade_in
    drone_hi = bp(dr, 500, 2400) * swell ** 2 * gate
    bus[:, 0] += 0.13 * drone + 0.045 * drone_hi
    bus[:, 1] += 0.12 * drone + 0.05 * drone_hi
    # 2) pulse: soft low hits locked to the visible turns during the race (felt more than heard)
    for k, t0 in enumerate(TURN_ENDS):
        d = 0.35
        tk = tt(d)
        kick = np.sin(2 * np.pi * np.cumsum(np.geomspace(110, 42, len(tk))) / SR) * env_exp(len(tk), 0.08)
        place(bus, kick, t0, 0.15 * min(1, (t0 - 1.4) / 2.0), 0)
    # 3) suspense under the reveal: high suspended cluster (A4, D5, E5) + heartbeat, riser into the last turn
    sus_t = tt(3.4)
    sus = sum(np.sin(2 * np.pi * mtof(m) * sus_t + i) * (1 + 0.3 * np.sin(2 * np.pi * (0.4 + 0.1 * i) * sus_t)) for i, m in enumerate([69, 74, 76]))
    sus *= np.minimum(1, sus_t / 0.8) * np.minimum(1, (3.4 - sus_t) / 0.15)
    place(bus, lp(sus, 3000), 6.45, 0.028, -0.2)
    place(bus, lp(sus, 3000), 6.45, 0.028, 0.2)
    for i, tb in enumerate(np.arange(6.6, 9.7, 0.86)):
        for dt_, g in [(0, 1.0), (0.17, 0.6)]:
            d = 0.3
            tk = tt(d)
            hb = np.sin(2 * np.pi * np.cumsum(np.geomspace(70, 40, len(tk))) / SR) * env_exp(len(tk), 0.07)
            place(bus, lp(hb, 200), tb + dt_, 0.13 * g * (0.7 + 0.1 * i), 0)
    rs_t = tt(0.9)
    riser = hp(noise(len(rs_t), 12), 1500) * (rs_t / 0.9) ** 3 + 0.4 * np.sin(2 * np.pi * np.cumsum(np.geomspace(200, 900, len(rs_t))) / SR) * (rs_t / 0.9) ** 2
    place(bus, riser, 9.1, 0.16, 0)
    # 4) release: warm D-major chord pad + bells, fading to silence by the loop point
    rel_t = tt(DUR - 10.0)
    chord = sum(pad_voice(mtof(m), rel_t, 0.35, 10 + i) * g for i, (m, g) in enumerate([(38, 0.8), (50, 0.6), (57, 0.55), (62, 0.5), (66, 0.45), (69, 0.4), (74, 0.25)]))
    a_env = np.minimum(1, rel_t / 0.08)
    f_env = np.clip((DUR - 10.0 - 0.05 - rel_t) / 0.75, 0, 1) ** 2                       # gone by ~13.95 s
    ch = lp(chord, 2600) * a_env * f_env * (0.85 + 0.15 * np.exp(-rel_t / 0.5))
    place(bus, ch, 10.0, 0.11, -0.1)
    place(bus, ch, 10.0, 0.11, 0.1)
    for m, dt_, g in [(74, 0.0, 0.16), (78, 0.04, 0.12), (81, 0.08, 0.1), (86, 0.5, 0.06), (90, 1.4, 0.05)]:
        b = bell(mtof(m))
        b = b[: int((DUR - 10.0 - dt_) * SR)]
        b = b * np.clip((DUR - 10.0 - 0.05 - dt_ - np.arange(len(b)) / SR) / 0.75, 0, 1) ** 2
        place(bus, b, 10.0 + dt_, g, 0.3 if m % 2 else -0.3)
    bus = reverb(bus, rt=2.2, wet=0.3, seed=6, lpf=4500)
    end = int((DUR - 0.06) * SR)
    bus[end:] = 0                                                                   # dead silent at the seam
    return bus


# ---------------------------------------------------------------- mastering
def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    s = r.stderr[r.stderr.rindex("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))


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
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return x * out[:, None]


def master(x, path, target=-14.0):
    tmp = path + ".probe.wav"
    wavfile.write(tmp, SR, x.astype(np.float32))
    i0, _ = measure(tmp)
    g = 10 ** ((target - i0) / 20)
    for _ in range(4):
        y = limiter(x * g)
        wavfile.write(tmp, SR, y.astype(np.float32))
        i1, tp1 = measure(tmp)
        if abs(i1 - target) < 0.2:
            break
        g *= 10 ** ((target - i1) / 20)
    os.replace(tmp, path)
    return {"lufs": i1, "tp_dbtp": tp1, "gain_db": round(20 * np.log10(g), 2)}


def main():
    os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
    sfx, mus = build_sfx(), build_music()
    full = sfx + mus
    rep = {"full": master(full, os.path.join(ROOT, "score", "final.wav")),
           "nomusic": master(sfx.copy(), os.path.join(ROOT, "score", "final_nomusic.wav"))}
    wavfile.write(os.path.join(ROOT, "score", "stem_sfx.wav"), SR, sfx.astype(np.float32))
    wavfile.write(os.path.join(ROOT, "score", "stem_music.wav"), SR, mus.astype(np.float32))
    seg = lambda x, a, b: 20 * np.log10(np.sqrt(np.mean(x[int(a * SR):int(b * SR)] ** 2)) + 1e-12)  # noqa: E731
    rep["sfx_vs_music_db"] = {k: round(seg(sfx, a, b) - seg(mus, a, b), 1) for k, (a, b) in
                              {"race 2-5.5": (2, 5.5), "reveal 7-9.5": (7, 9.5), "release 10-12": (10, 12)}.items()}
    rep["seam_db"] = {"last_50ms": round(seg(full, DUR - 0.05, DUR), 1), "first_50ms": round(seg(full, 0, 0.05), 1)}
    rep["counted_turns"] = len(INC)
    rep["visible_turns_in_race"] = len(TURN_ENDS)
    json.dump(rep, open(os.path.join(ROOT, "score", "levels.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    subprocess.run([FF, "-y", "-hide_banner", "-v", "error", "-i", os.path.join(ROOT, "score", "final.wav"), "-c:a", "aac", "-b:a", "256k",
                    os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
