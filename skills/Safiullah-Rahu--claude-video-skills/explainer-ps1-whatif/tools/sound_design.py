"""Sound for "Rewind" (PS1 what-if): an original synthesized music bed + tape/VHS SFX + the voice, mastered to -14 LUFS.
Writes assets/audio/final.m4a (full mix), assets/audio/nomusic.m4a (voice + SFX, same gain), score/levels.json.
usage: <python with numpy/scipy/soundfile> -X utf8 -I tools/sound_design.py
Bed (measured on the source: no steady pulse, a tonal pad in D minor about 14 dB under the voice): a warm detuned pad
Dm - Bb - F - C, a sparse FM-bell melody on a slow 72 BPM grid, tape wow and hiss. Energy follows the beat map.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audiolib import SR, bp, delay, env, hp, limiter, lp, master, mtof, noise, place, reverb, rms_db, sweep, to_m4a, tt  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
LINES = {l["id"]: l for l in VO["lines"]}
FV = open(os.path.join(ROOT, "assets", "lib", "film-vo.js"), encoding="utf-8").read()
DUR = json.loads(FV[FV.index("{"):FV.rindex("}") + 1])["dur"]
N = int(DUR * SR)


def S(i):
    return LINES[i]["start"]


def E(i):
    return LINES[i]["end"]


def W(i, word, k=0):
    hits = [w for w in LINES[i]["words"] if w["w"].lower().strip(".,?!'").startswith(word.lower())]
    return hits[min(k, len(hits) - 1)]["start"]


def bus():
    return np.zeros((N, 2))


# ---------------- music bed ----------------
def pad_chord(notes, d, seed=0):
    t = tt(d)
    y = np.zeros(len(t))
    r = np.random.default_rng(seed)
    for m in notes:
        for det in (-0.09, 0.0, 0.08):
            f = mtof(m + det)
            ph = r.uniform(0, 2 * np.pi)
            y += np.sin(2 * np.pi * f * t + ph) * 0.5 + 0.18 * np.sin(4 * np.pi * f * t + ph)  # soft saw-ish
    y = lp(y, 1600)
    a = min(1.4, d / 3)
    e = np.minimum(1, np.minimum(t / a, (d - t) / a))
    return y * e / (len(notes) * 3)


def bell(m, d=1.6):
    t = tt(d)
    f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 5)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.8) * 0.5


def music():
    b = bus()
    chords = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 53, 57, 60], [48, 55, 60, 64]]  # Dm Bb F C
    bar = 60 / 72 * 4
    seg = bar * 2
    i, t0 = 0, 0.0
    while t0 < DUR:
        c = pad_chord(chords[i % 4], seg + 1.2, seed=i)
        place(b, c, t0, 0.55)
        place(b, pad_chord([chords[i % 4][0] - 12], seg + 1.2, seed=100 + i) * 1.2, t0, 0.5)
        i += 1
        t0 += seg
    # bell melody (sparse, a little PS1 sound-chip flavour)
    mel = [74, 72, 69, 72, 74, 77, 76, 72, 69, 67, 69, 72]
    beat = 60 / 72
    k, t0 = 0, 12.5
    while t0 < DUR - 3.5:
        if (k % 8) in (0, 3, 5) and not (99.5 < t0 < 113.5):
            place(b, bell(mel[k % len(mel)]), t0, 0.16, pan=0.25 if k % 2 else -0.25)
        k += 1
        t0 += beat
    b = delay(b, beat * 0.75, fb=0.3, mix=0.22)
    b = reverb(b, rt=2.6, wet=0.35)
    # tape wow: a slow pitch wobble done as a varying fractional delay
    t = np.arange(N) / SR
    dl = (0.0025 + 0.0012 * np.sin(2 * np.pi * 0.55 * t) + 0.0006 * np.sin(2 * np.pi * 3.1 * t)) * SR
    idx = np.clip(np.arange(N) - dl, 0, N - 1)
    i0 = np.floor(idx).astype(int); fr = idx - i0; i1 = np.minimum(i0 + 1, N - 1)
    b = b[i0] * (1 - fr)[:, None] + b[i1] * fr[:, None]
    hiss = hp(noise(N, 5), 4000) * 0.006
    b[:, 0] += hiss; b[:, 1] += np.roll(hiss, 999)
    # energy curve (beat map): intro, montage, cost, loop, twist, last line, end card
    pts = [(0, 0.75), (12, 0.6), (37, 0.75), (46, 0.65), (71, 0.55), (84.8, 0.8), (95, 0.9), (99.6, 0.35), (106.8, 0.6), (113.8, 0.45), (116.5, 0.3), (118.6, 0.95), (DUR, 0.9)]
    xs, ys = zip(*pts)
    g = np.interp(t, xs, ys)
    g[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
    return b * g[:, None]


# ---------------- SFX ----------------
def clunk():  # a VCR transport button: thump + plastic click
    t = tt(0.22)
    th = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 28) * 0.8
    ck = hp(noise(len(t), 3), 2500) * np.exp(-t * 120) * 0.6
    return th + ck


def rewind_whirr(d):  # tape running backwards: rising motor whine + flutter + noise
    t = tt(d)
    f = np.linspace(380, 1150, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sign(np.sin(ph)) * 0.2 + np.sin(ph * 2.01) * 0.15
    y = bp(y, 300, 3500)
    y *= 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)
    y += bp(noise(len(t), 9), 800, 6000) * 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t))
    a = int(0.03 * SR)
    e = np.ones(len(t)); e[:a] = np.linspace(0, 1, a); e[-a * 2:] = np.linspace(1, 0, a * 2)
    return y * e * 0.55


def beep(d=0.09, f=2100):
    t = tt(d)
    return np.sign(np.sin(2 * np.pi * f * t)) * 0.25 * env(len(t), 0.002, 0.02, 0.8, 0.01)


def thud(f=55, d=0.35):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t * (1 + 0.6 * np.exp(-t * 20))) * np.exp(-t * 11) + lp(noise(len(t), 4), 400) * np.exp(-t * 25) * 0.6) * 0.9


def clank():  # rim
    t = tt(0.6)
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in ((523, 7), (1187, 9), (1903, 12), (2840, 16)))
    return y * 0.25


def swish():
    t = tt(0.35)
    return bp(noise(len(t), 12), 1500, 9000) * np.sin(np.pi * np.minimum(1, t / 0.35)) * 0.5


def blip(f=1500):
    t = tt(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 60) * 0.3


def murmur(d, seed=1):
    y = bp(noise(int(d * SR), seed), 250, 1800)
    t = tt(d)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * t + 1) * np.sin(2 * np.pi * 0.43 * t)
    a = int(0.6 * SR); e = np.ones(len(t)); e[:a] = np.linspace(0, 1, a); e[-a:] = np.linspace(1, 0, a)
    return y * am * e * 0.25


def chime(m):
    return bell(m, 2.5) + bell(m + 7, 2.5) * 0.5


def honk():
    t = tt(0.35)
    return (np.sign(np.sin(2 * np.pi * 410 * t)) + np.sign(np.sin(2 * np.pi * 520 * t))) * 0.12 * env(len(t), 0.01, 0.05, 0.9, 0.05)


def sfx():
    b = bus()
    # rewinds (button + whirr) and plays (button)
    rws = [(S("h3") - 0.05, S("h4") - 0.05), (S("a2") - 0.05, S("a3") - 0.1), (S("j2") - 0.05, W("j2", "New") - 0.1),
           (W("i1", "twice") - 0.05, W("i1", "twice") + 0.5), (S("g3") - 0.05, S("g4") - 0.12), (S("t2") - 0.05, S("t3") - 0.1), (S("t4") - 0.05, S("t5") - 0.1)]
    for a, z in rws:
        place(b, clunk(), a, 0.55)
        place(b, rewind_whirr(z - a), a + 0.04, 0.5)
        place(b, clunk(), z, 0.45, pan=0.1)
    # trip: scuff + thud + crowd gasp swell
    place(b, murmur(12.0, 3), 0.0, 0.5)
    place(b, thud(60), W("h2", "stairs") + 0.15, 0.7)
    place(b, thud(48, 0.4), W("h2", "stairs") + 0.45, 0.55)
    # alarm
    for k in range(10):
        place(b, beep(), S("a1") - 0.1 + k * 0.17, 0.35 if k % 2 == 0 else 0)
    # takes ticking (alarm 60, joke, b-ball, hello, loop, 200 takes): soft blips, rate-limited
    for a, z, n in [(S("a3"), W("a4", "times"), 22), (S("j2"), S("j3"), 8), (S("g3"), S("g4"), 10), (S("t5"), W("t5", "same"), 16)]:
        for k in range(n):
            place(b, blip(1300 + 40 * (k % 5)), a + (z - a) * k / n, 0.35, pan=0.3)
    # office murmur, laugh-like swell
    place(b, murmur(4.5, 7), S("j1") - 0.2, 0.35)
    place(b, murmur(2.4, 8) * 1.6, W("j3", "whole") - 0.1, 0.6)
    # basketball: dribble, misses (clank + rewind chirp), the swish
    for k in range(3):
        place(b, thud(90, 0.2), S("b1") - 0.05 + k * 0.42, 0.45)
    cyc = 0.62
    t0 = S("b2") - 0.1
    k = 0
    while t0 + k * cyc < S("b3") - 0.15:
        place(b, clank(), t0 + k * cyc + 0.6 * cyc * 0.75, 0.5)
        place(b, rewind_whirr(0.22), t0 + k * cyc + 0.6 * cyc, 0.35)
        k += 1
    place(b, swish(), S("b3") - 0.1 + 0.9, 0.7)
    # phone taps, car honk, cafe murmur
    for k in range(6):
        place(b, blip(2600) * 0.6, S("m1") - 0.05 + k * 0.13, 0.4)
    place(b, rewind_whirr(0.25), S("m1") + 0.42, 0.35)
    place(b, honk(), S("m2") + 0.55, 0.45)
    place(b, rewind_whirr(0.3), S("m2") - 0.1 + 0.45 * 1.85, 0.35)
    place(b, murmur(2.2, 11), S("m3") - 0.1, 0.35)
    place(b, rewind_whirr(0.3), S("m3") + 0.55, 0.35)
    # street ambience
    place(b, murmur(4.0, 13) * 0.8, S("m4") - 0.1, 0.4)
    place(b, murmur(11.5, 14) * 0.7, S("g1") - 0.1, 0.35)
    # date: micro-rewind ticks
    for word in ("test", "sentence", "she"):
        place(b, rewind_whirr(0.25), W("d1", word) - 0.25, 0.25)
    # wedding chimes
    place(b, chime(74), S("w1") - 0.05, 0.35)
    place(b, chime(79), S("w2") - 0.05, 0.3)
    # loop: a short rewind chirp each loop
    lp0 = S("l3") - 0.08
    k = 0
    while lp0 + k * 0.55 < S("l5") - 0.1:
        place(b, rewind_whirr(0.12), lp0 + k * 0.55 + 0.43, 0.22 if lp0 + k * 0.55 < S("l4") else 0.15)
        k += 1
    # door shuts after she leaves
    place(b, thud(70, 0.5), S("t6") - 0.1 + 0.6, 0.6)
    # end card: low hit + chime
    end = E("t8") + 0.2
    place(b, thud(45, 0.9), end, 0.55)
    place(b, chime(69), end + 0.05, 0.4)
    return reverb(b, rt=1.0, wet=0.15)


def voice():
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
    assert sr == SR
    if v.ndim > 1:
        v = v.mean(axis=1)
    v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
    v = hp(v, 70)
    st = np.stack([v, v], axis=1)
    return limiter(st * 1.0, -6.0, look=0.004, rel=0.06)


def main():
    v = voice()
    m = music()
    s = sfx()
    # levels: voice >= 10 dB over bed + SFX while speaking
    speech = np.zeros(N, bool)
    for l in VO["lines"]:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    vdb = rms_db(v[speech])
    for target in (17.0,):
        m *= 10 ** ((vdb - target - rms_db(m[speech])) / 20)
    s *= 10 ** ((vdb - 19.0 - rms_db(s[speech])) / 20)
    bed = m + s
    over = vdb - rms_db(bed[speech])
    out = os.path.join(ROOT, "score")
    rep = master({"voice": v, "music": m, "sfx": s}, out, target=-14.0, ceiling=-2.0)
    rep["voice_over_bed_db"] = round(float(over), 2)
    rep["voice_over_music_db"] = round(float(vdb - rms_db(m[speech])), 2)
    rep["music_bed"] = "original, synthesized in code (D minor pad + FM bell, 72 BPM grid, no pulse)"
    json.dump(rep, open(os.path.join(out, "levels.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    to_m4a(os.path.join(out, "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    to_m4a(os.path.join(out, "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
