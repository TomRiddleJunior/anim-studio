"""Soundtrack for the news-noir reel: an original dark minimal bed at 72 BPM (ticking 16ths read as ~144), D minor:
a sub drone, a low muted-piano motif, a heartbeat kick, clock-tick hats; it thins under the document shot and
swells for the number and the quotes. SFX on every visual event (shutter clicks on rings, paper slide, typewriter
keys on labels, map whoosh, tape-reel whir and clunk, counter roll, low booms, drawer slide). Kokoro voice on top,
the bed ducks under it.
  out  score/{full,nomusic,stem_*}.wav, score/levels.json, assets/audio/final.m4a, assets/audio/nomusic.m4a
usage: python -X utf8 -I tools/sound_design.py
"""
import json
import os
import sys
from collections import defaultdict

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import SR, bp, env, hp, lp, master, mtof, noise, place, reverb, rms_db, sweep, to_m4a, tt  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js = open(os.path.join(ROOT, "assets", "lib", "timing.js"), encoding="utf-8").read()
V = json.loads(js[js.index("=") + 1:].strip().rstrip(";"))
DUR = V["dur"]
# unknown line ids (e.g. in the 3-shot template) map to times past the end, so their events never sound
W = defaultdict(lambda: [1e6] * 64, V["W"])
T = defaultdict(lambda: 1e6, V["T"])
N = int(DUR * SR)
BPM = 72.0
BEAT = 60 / BPM
K = 0.08
CUT_IDS = ["names", "card", "archive", "network", "tape", "promise", "register", "proof", "lost", "scale", "quotes", "reports", "next"]
CUTS = [T[k] - K for k in CUT_IDS]


def st(n=N):
    return np.zeros((n, 2))


def energy(t):
    pts = [(0, 0.6), (8.8, 0.6), (9.0, 0.35), (13.7, 0.4), (13.9, 0.7), (28.0, 0.75), (45.3, 0.8), (50.3, 1.0),
           (56.0, 0.85), (62.2, 0.6), (65.0, 0.9), (DUR - 2.0, 0.8), (DUR, 0.0)]
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)


def piano(n, d=1.6):
    t = tt(d)
    f = mtof(n)
    x = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2.5 + h * 1.5)) / h for h in (1, 2, 3, 4))
    x += 0.2 * hp(noise(len(t), int(n)), 2000) * np.exp(-t * 60)
    return lp(x, 2200) * 0.5


def music():
    m = st()
    t = np.arange(N) / SR
    en = energy(t)
    # sub drone D1/A1 with slow beating
    dr = 0.5 * np.sin(2 * np.pi * mtof(26) * t) + 0.3 * np.sin(2 * np.pi * mtof(33) * 1.003 * t) + 0.15 * np.sin(2 * np.pi * mtof(38) * 0.997 * t)
    dr *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) ** 2
    m += np.stack([dr, dr], 1) * 0.22
    # piano motif: D minor, one note per beat in a 2-bar loop (low register)
    motif = [50, 53, 57, 52, 50, 53, 58, 57]
    tb, i = 0.0, 0
    while tb < DUR - 2.0:
        if not (9.0 <= tb < 13.7):
            place(m, piano(motif[i % 8] + (12 if (i // 16) % 2 and tb > 45 else 0)), tb, 0.55 * float(energy(tb)), -0.3 + 0.6 * ((i % 4) / 3))
        tb += BEAT
        i += 1
    # heartbeat kick (two hits per bar) + 16th clock ticks
    def kick():
        d = 0.5
        k = tt(d)
        f = 42 + 70 * np.exp(-k * 28)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 7)

    tb, i = 0.0, 0
    while tb < DUR - 2.0:
        if i % 4 in (0, 1) and not (9.0 <= tb < 13.7) and tb > 13.7 or (tb < 8.8 and i % 4 == 0):
            place(m, kick() * (0.55 if i % 4 == 0 else 0.35), tb + (0 if i % 4 == 0 else BEAT * 0.25), 1.0, 0)
        tb += BEAT
        i += 1
    tb, i = 0.0, 0
    while tb < DUR - 2.0:
        x = hp(noise(int(0.02 * SR), i % 64), 6000) * np.exp(-tt(0.02) * 160)
        place(m, x * (0.14 if i % 4 == 0 else 0.07) * float(energy(tb)), tb, 1.0, 0.3 if i % 2 else -0.3)
        tb += BEAT / 4
        i += 1
    m *= (0.5 + 0.5 * en)[:, None]
    return m


def duck(m, vo):
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    e = uniform_filter1d(maximum_filter1d(np.abs(vo), int(0.05 * SR)), int(0.12 * SR))
    g = 1 - 0.4 * np.clip(e / (np.percentile(e, 95) + 1e-9), 0, 1)
    return m * g[:, None]


# ---------------------------------------------------------------- SFX
def shutter():
    a = hp(noise(int(0.03 * SR), 3), 2500) * np.exp(-tt(0.03) * 140)
    b = hp(noise(int(0.04 * SR), 4), 1500) * np.exp(-tt(0.04) * 90)
    return np.concatenate([a, np.zeros(int(0.05 * SR)), b])


def typekey(seed):
    x = bp(noise(int(0.035 * SR), seed), 1200, 6000) * np.exp(-tt(0.035) * 120)
    x[:int(0.004 * SR)] += 0.6
    return x


def paper(d=0.7):
    x = bp(noise(int(d * SR), 8), 800, 7000)
    return x * env(len(x), a=0.05, d=0.1, s=0.6, r=d * 0.6)


def whoosh(d=0.5):
    x = bp(noise(int(d * SR), 5), 200, 4000)
    return x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2


def boom(d=2.2):
    t = tt(d)
    f = 34 + 40 * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8) + 0.25 * lp(noise(len(t), 11), 150) * np.exp(-t * 3)


def whir(d):
    t = tt(d)
    f = 180 + 40 * np.sin(2 * np.pi * 0.5 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + bp(noise(len(t), 21), 400, 1800) * 0.4
    return x * env(len(t), a=0.3, d=0.1, s=0.8, r=0.4)


def clunk():
    t = tt(0.25)
    return (np.sin(2 * np.pi * 120 * t) + bp(noise(len(t), 33), 300, 2500)) * np.exp(-t * 26)


def tick(seed):
    return hp(noise(int(0.01 * SR), seed), 3000) * np.exp(-tt(0.01) * 400)


def drawer(d=0.8):
    x = bp(noise(int(d * SR), 44), 150, 1500)
    return x * env(len(x), a=0.05, d=0.1, s=0.7, r=0.25)


def sfx():
    s = st()
    hardcuts = [c for k, c in zip(CUT_IDS, CUTS) if k not in ("names",)]
    for c in hardcuts:
        place(s, whoosh(0.4), c - 0.2, 0.22, 0)
    # hook: shutter at the punch-in, ring locks
    place(s, shutter(), W["hook"][3] - 0.05, 0.55, -0.2)
    place(s, typekey(1), W["hook"][5], 0.4, 0.3)
    place(s, shutter(), W["open"][4] - 0.05, 0.5, 0.2)
    place(s, typekey(2), W["open"][10], 0.4, -0.3)
    # desk: paper slide on the dissolve
    place(s, paper(0.9), T["names"] - K, 0.5, 0)
    place(s, typekey(3), W["names"][1], 0.35, 0)
    # card labels: typewriter keys
    for k, w in enumerate([W["card"][1], W["card"][5], W["card"][7], W["card"][10]]):
        for j in range(5):
            place(s, typekey(10 + k * 5 + j), w - 0.1 + j * 0.045, 0.35, -0.4 + 0.2 * j)
    # map: white whoosh + pin
    place(s, whoosh(0.6), T["archive"] - K - 0.1, 0.35, 0)
    place(s, typekey(30), W["archive"][4], 0.4, 0.2)
    # network: ring, dashed links
    place(s, shutter(), W["network"][4] - 0.05, 0.4, 0.3)
    place(s, typekey(31), W["network"][6], 0.35, -0.2)
    place(s, typekey(32), W["network"][10], 0.35, 0.2)
    # tape: whir + clunk on the lift
    place(s, whir(T["promise"] - T["tape"]), T["tape"] - K, 0.45, 0)
    place(s, clunk(), W["tape"][7] - 0.08, 0.6, -0.2)
    # portrait labels
    place(s, typekey(40), W["promise"][2], 0.35, 0)
    place(s, typekey(41), W["promise"][4], 0.35, 0.3)
    # register + link X
    for w in (W["register"][5], W["register"][7]):
        place(s, typekey(int(w * 10)), w, 0.35, 0)
    place(s, shutter(), W["proof"][8] - 0.04, 0.5, 0)
    # globe date pins
    place(s, typekey(50), W["lost"][5], 0.35, -0.3)
    place(s, typekey(51), W["lost"][9], 0.35, 0.3)
    # corridor: boom + counter roll
    place(s, boom(), T["scale"] - K, 0.5, 0)
    tt_, k = W["scale"][5], 0
    while tt_ < W["scale"][5] + 1.1:
        place(s, tick(k + 70), tt_, 0.18, 0.1)
        tt_ += 0.06
        k += 1
    # quotes + zero: low booms
    place(s, boom(1.8), T["quotes"] - K, 0.35, 0)
    place(s, boom(1.8), W["quotes"][9] - K, 0.3, 0)
    place(s, boom(2.0), W["reports"][2] - 0.05, 0.45, 0)
    # cabinet: drawer slide, tags
    place(s, drawer(), W["next"][1] - 0.1, 0.6, 0.2)
    place(s, typekey(80), W["next"][2], 0.35, -0.2)
    place(s, typekey(81), W["next"][7], 0.35, 0.2)
    place(s, boom(2.4), W["next"][8] + 0.4, 0.4, 0)
    return s


def main():
    vo, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"))
    if sr != SR:
        vo = resample_poly(vo, SR, sr)
    if vo.ndim > 1:
        vo = vo.mean(axis=1)
    v = np.zeros(N)
    v[:min(N, len(vo))] = vo[:N]
    voice = np.stack([v, v], axis=1)
    mu = duck(reverb(music(), rt=2.4, wet=0.22), voice[:, 0])
    fx = reverb(sfx(), rt=1.4, wet=0.18)
    fade = np.ones(N)
    fl = int(1.8 * SR)
    fade[-fl:] = np.linspace(1, 0, fl)
    mu *= fade[:, None]
    stems = {"voice": voice, "music": mu * 0.4, "sfx": fx * 0.3}
    out = os.path.join(ROOT, "score")
    rep = master(stems, out, target=-14.0, music_key="music", ceiling=-2.0)
    from scipy.ndimage import uniform_filter1d
    sv = sf.read(os.path.join(out, "stem_voice.wav"))[0][:, 0]
    smu = sf.read(os.path.join(out, "stem_music.wav"))[0][:, 0]
    sb = smu + sf.read(os.path.join(out, "stem_sfx.wav"))[0][:, 0]
    act = uniform_filter1d((np.abs(sv) > 0.01).astype(float), int(0.2 * SR)) > 0.3
    rep["voice_over_bed_db"] = round(rms_db(sv[act]) - rms_db(sb[act]), 2)
    rep["voice_over_music_db"] = round(rms_db(sv[act]) - rms_db(smu[act]), 2)
    rep["bpm"] = BPM
    json.dump(rep, open(os.path.join(out, "levels.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    to_m4a(os.path.join(out, "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    to_m4a(os.path.join(out, "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
    print(json.dumps(rep, indent=1))


main()
