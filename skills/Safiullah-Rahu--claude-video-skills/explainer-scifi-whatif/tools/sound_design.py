"""Sound for "One Year Away" (16:9 sci-fi what-if): an original synthesized ambient score + UI/space SFX + the voice,
mastered to -14 LUFS. Writes assets/audio/final.m4a, assets/audio/nomusic.m4a (voice + SFX at the same gain) and
score/levels.json.  usage: <python with numpy/scipy/soundfile> -X utf8 -I tools/sound_design.py
Bed (measured on the source: no steady pulse, a tonal pad in D minor ~14 dB under the voice, a fuller intro and a swell
at the end): drone D2/A2, pads i-VI-iv-V (Dm9 - Bbmaj7 - Gm - A) every 8 s, sparse soft-piano notes, a 120 BPM eighth
arpeggio that enters for the reveal, and a D-major lift on the gate.  Nothing sampled, nothing licensed.
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


def pad(notes, d, seed=0, bright=1800):
    t = tt(d)
    y = np.zeros(len(t))
    r = np.random.default_rng(seed)
    for m in notes:
        for det in (-0.07, 0.0, 0.06):
            f = mtof(m + det)
            ph = r.uniform(0, 6.28)
            y += np.sin(2 * np.pi * f * t + ph) + 0.25 * np.sin(4 * np.pi * f * t + ph) + 0.08 * np.sin(6 * np.pi * f * t + ph)
    y = lp(y, bright)
    a = min(2.0, d / 3)
    return y * np.minimum(1, np.minimum(t / a, (d - t) / a)) / (len(notes) * 3)


def piano(m, d=2.6, v=1.0):
    t = tt(d)
    f = mtof(m)
    y = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + k * 1.3)) / k ** 1.4 for k in range(1, 6))
    return y * env(len(t), 0.004, 0.2, 0.6, 0.4) * 0.5 * v


def drone(d):
    t = tt(d)
    y = np.sin(2 * np.pi * mtof(38) * t) + 0.6 * np.sin(2 * np.pi * mtof(45) * t) + 0.2 * np.sin(2 * np.pi * mtof(50) * t * 1.002)
    return lp(y, 600) * 0.3


def music():
    b = bus()
    place(b, drone(DUR) * 0.8, 0, 0.6)
    prog = [[50, 57, 64, 65, 69], [46, 53, 57, 62, 65], [43, 50, 58, 62, 67], [45, 52, 57, 61, 64]]  # Dm9 Bbmaj7 Gm A
    seg = 8.0
    t0, i = 0.0, 0
    gate = S("e1") - 0.15
    while t0 < DUR:
        ch = prog[i % 4]
        if t0 >= gate - 1:  # the gate: lift to D major
            ch = [50, 57, 62, 66, 69]
        place(b, pad(ch, seg + 2.0, seed=i, bright=2200 if t0 > S("x1") else 1600), t0, 0.6)
        i += 1
        t0 += seg
    # sparse soft-piano line (original), denser in the cold open and the reveal
    mel = [69, 72, 74, 72, 69, 67, 65, 67, 69, 74, 72, 69]
    beat = 1.0
    k, t = 0, 0.3
    while t < DUR - 6:
        dense = t < 12.5 or (S("x1") - 1 < t < S("e1"))
        if (k % 2 == 0) or dense:
            place(b, piano(mel[k % len(mel)], v=0.8), t, 0.25, pan=0.2 if k % 2 else -0.2)
        k += 1
        t += beat * (1 if dense else 2)
    # 120 BPM eighth arpeggio under the reveal
    arp = [62, 65, 69, 74, 69, 65]
    t, k = S("x1") - 0.2, 0
    while t < S("e1") - 0.3:
        place(b, piano(arp[k % len(arp)] + 12, 0.5, 0.5), t, 0.18, pan=0.35 if k % 2 else -0.35)
        k += 1
        t += 0.25
    # shimmer on the gate
    place(b, pad([74, 78, 81, 86], DUR - gate, seed=77, bright=5000) * 0.6, gate, 0.4)
    b = delay(b, 0.75, fb=0.32, mix=0.2)
    b = reverb(b, rt=3.4, wet=0.4)
    tl = np.arange(N) / SR
    pts = [(0, 0.95), (12.8, 0.7), (22.2, 0.6), (37.7, 0.65), (72.9, 0.7), (88.5, 0.55), (108.3, 0.8), (124.3, 0.65), (138.0, 0.8), (158.6, 1.0), (170.9, 0.9), (DUR, 0.85)]
    xs, ys = zip(*pts)
    g = np.interp(tl, xs, ys)
    g[-int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))
    return b * g[:, None]


# ---------------- SFX ----------------
def pop(f=900):
    t = tt(0.12)
    return np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t * 40))) * np.exp(-t * 30) * 0.5


def tick(f=3000):
    t = tt(0.03)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 200) * 0.5


def whoosh(d=0.8, lo=300, hi=4000, up=True):
    t = tt(d)
    y = noise(len(t), 3)
    y = bp(y, lo, hi)
    e = np.sin(np.pi * t / d) ** 2
    return y * e * 0.5


def boom(f=40, d=2.5):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t * (1 + 0.8 * np.exp(-t * 6))) * np.exp(-t * 1.6) + lp(noise(len(t), 8), 200) * np.exp(-t * 4) * 0.5) * 0.9


def chime2(a=76, b2=81):
    return np.concatenate([piano(a, 0.35, 1.0)[: int(0.18 * SR)], piano(b2, 1.2, 1.0)])


def chirp(f0, f1, d=0.18):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f1, len(t))) / SR) * env(len(t), 0.005, 0.05, 0.6, 0.06) * 0.35


def servo(d=0.8):
    t = tt(d)
    f = 180 + 60 * np.sin(np.pi * t / d)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.12 + bp(noise(len(t), 5), 800, 3000) * 0.08
    return lp(y, 2500) * np.sin(np.pi * t / d)


def ping(f=1200, d=0.9):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 5) * 0.35


def hum_melody(t0, b, gain):
    """OTTO hums the lullaby (an original 6-note tune) as a soft sine with vibrato."""
    notes = [(72, 0.4), (74, 0.4), (76, 0.8), (74, 0.4), (72, 0.4), (69, 1.0)]
    t = t0
    for m, d in notes:
        x = tt(d)
        f = mtof(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * x))
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.04, 0.1, 0.8, 0.1) * 0.25
        place(b, y, t, gain, pan=0.15)
        t += d


def glitch(d=0.5):
    t = tt(d)
    y = np.sign(noise(len(t), 21)) * (np.floor(t * 40) % 2) * 0.2
    return hp(y, 1500) * env(len(t), 0.005, 0.1, 0.7, 0.1)


def door(d=1.4):
    t = tt(d)
    return (bp(noise(len(t), 31), 400, 6000) * np.exp(-t * 2.5) * 0.4 + np.sin(2 * np.pi * 60 * t) * np.exp(-t * 6) * 0.4)


def sfx():
    b = bus()
    place(b, boom(), 0.0, 0.5)
    for k in range(14):
        place(b, tick(2400), S("o2") - 0.1 + k * 0.1, 0.35)
    hum_melody(S("o3") + 1.2, b, 0.55)
    place(b, whoosh(0.5, 500, 5000), S("o4") - 0.2, 0.4)
    # docking
    place(b, chime2(), W("o5", "green") - 0.05, 0.45)
    place(b, servo(0.9), W("o5", "turns") - 0.05, 0.5)
    for k in range(28):
        place(b, tick(3200), S("o6") - 0.1 + k * 0.038, 0.18)
    # rewind
    t = W("o7", "back") - 0.25
    place(b, whoosh(1.9, 200, 6000), t, 0.6)
    x = tt(1.9)
    place(b, np.sin(2 * np.pi * np.cumsum(np.geomspace(900, 220, len(x))) / SR) * 0.15 * np.sin(np.pi * x / 1.9), t, 0.5)
    # now hiring
    place(b, pop(700), S("n1") - 0.1, 0.5)
    for k in range(18):
        place(b, tick(2600 + k * 40), W("n1", "five") - 0.1 + k * 0.06, 0.3)
    for word in ("pilot", "robot", "trip"):
        place(b, pop(1100), W("n2", word) - 0.15, 0.45)
    place(b, whoosh(1.2, 200, 2500), S("n3") - 0.1, 0.4)
    place(b, chirp(600, 300, 0.35), W("n4", "Earth") - 0.15, 0.5)
    # physics: clocks, GPS, twins, speed
    tc = S("p1") - 0.15
    k = 0
    while tc + k * 0.25 < S("p3") - 0.2:
        place(b, tick(1800), tc + k * 0.25, 0.25, pan=-0.4)
        k += 1
    k = 0
    while tc + k * 0.9 < S("p3") - 0.2:
        place(b, tick(1400), tc + k * 0.9, 0.25, pan=0.4)
        k += 1
    for k in range(4):
        place(b, ping(1700, 0.4), S("p3") + k * 1.6, 0.3)
    place(b, pop(900), W("p3", "correct") - 0.1, 0.45)
    place(b, whoosh(1.6, 300, 3000), W("p3", "drift"), 0.35)
    place(b, pop(800), W("p4", "younger") - 0.1, 0.45)
    place(b, whoosh(2.4, 150, 7000), W("p6", "ninety") - 0.1, 0.6)
    for k in range(30):
        place(b, tick(2200), W("p7", "seventy") - 0.3 + k * 0.05, 0.25)
    # Mia at dusk: wind, paper
    place(b, lp(noise(int(15.5 * SR), 41), 700) * 0.12, S("m1") - 0.15, 1.0)
    place(b, whoosh(0.6, 1200, 8000), W("m4", "robot") - 0.25, 0.35)
    # OTTO says three things
    for word, (f0, f1) in zip(("exactly", "three", "things"), ((900, 1400), (1400, 800), (700, 1100))):
        place(b, chirp(f0, f1), W("r2", word) - 0.1 + (0.25 if word == "things" else 0), 0.5)
    # doppler pings (sparse), then dense on the way home
    for k in range(5):
        place(b, ping(600, 1.2), S("r3") + k * 2.0, 0.3, pan=-0.3)
    place(b, whoosh(2.0, 100, 2500), S("u1") - 0.2, 0.7)
    place(b, boom(32, 3.0), S("u1") + 0.2, 0.4)
    for k in range(40):
        place(b, ping(900 + (k % 5) * 60, 0.25), S("u2") + k * 0.18, 0.18, pan=0.3)
    for word in ("twelve", "eighteen", "twenty"):
        place(b, pop(1000), W("u4", word) - 0.2, 0.45)
    # OTTO changes
    hum_melody(S("c2") - 0.05, b, 0.6)
    t = S("c4") - 0.25  # ba-dum-tss after the joke
    place(b, lp(noise(int(0.1 * SR), 51), 900) * 0.6 * np.exp(-tt(0.1) * 30), t, 0.35)
    place(b, hp(noise(int(0.6 * SR), 52), 6000) * np.exp(-tt(0.6) * 6) * 0.4, t + 0.22, 0.3)
    for k in range(3):
        place(b, chirp(1800, 2600, 0.12), W("c4", "flowers") - 0.3 + k * 0.33, 0.35)
    place(b, glitch(0.7), S("c5") - 0.1, 0.4)
    # the log
    for k in range(60):
        place(b, tick(3600), S("x2") - 0.3 + k * 0.11, 0.12)
    place(b, pop(700), W("x2", "same") - 0.1, 0.45)
    place(b, whoosh(3.2, 300, 3000), W("x4", "fifty") - 0.2, 0.3)
    for k in range(8):
        place(b, chirp(1400, 2200, 0.08), W("x4", "sent") + k * 0.4, 0.2)
    for word in ("joke", "song", "flower"):
        place(b, pop(1200), W("x5", word) - 0.15, 0.45)
    # gate
    go = W("e1", "opens") + 0.1
    for k in range(3):
        place(b, chirp(1000, 1000, 0.1), go - 1.6 + k * 0.5, 0.35)
    place(b, door(), go, 0.6)
    place(b, chime2(74, 78), go + 0.2, 0.4)
    place(b, pop(800), S("e4") - 0.1, 0.4)
    place(b, pop(900), E("e4") + 0.25, 0.45)
    place(b, chime2(81, 86), E("e4") + 2.55, 0.35)
    return reverb(b, rt=1.2, wet=0.18)


def voice():
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), dtype="float64")
    assert sr == SR
    if v.ndim > 1:
        v = v.mean(axis=1)
    v = v[:N] if len(v) >= N else np.concatenate([v, np.zeros(N - len(v))])
    v = hp(v, 70)
    return limiter(np.stack([v, v], axis=1), -6.0, look=0.004, rel=0.06)


def main():
    v, m, s = voice(), music(), sfx()
    speech = np.zeros(N, bool)
    for l in VO["lines"]:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    vdb = rms_db(v[speech])
    m *= 10 ** ((vdb - 16.0 - rms_db(m[speech])) / 20)
    s *= 10 ** ((vdb - 20.0 - rms_db(s[speech])) / 20)
    over = vdb - rms_db((m + s)[speech])
    out = os.path.join(ROOT, "score")
    rep = master({"voice": v, "music": m, "sfx": s}, out, target=-14.0, ceiling=-2.0)
    rep["voice_over_bed_db"] = round(float(over), 2)
    rep["voice_over_music_db"] = round(float(vdb - rms_db(m[speech])), 2)
    rep["music_bed"] = "original, synthesized in code (D minor ambient: drone, i-VI-iv-V pads, soft piano, 120 BPM arpeggio in the reveal, D major on the gate)"
    json.dump(rep, open(os.path.join(out, "levels.json"), "w"), indent=1)
    to_m4a(os.path.join(out, "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    to_m4a(os.path.join(out, "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
