"""Soundtrack for the engineering-HUD reel: an original ~117 BPM dark synth bed (A minor -> C major resolve), fully
synthesized in numpy, that builds from a pulse into a full beat at the closing and resolves on the payoff; SFX on
every visual event (cut whooshes, status beeps, sonar pings, panel blips, water rush, gate groan, sink thud, counter
ticks, tile pops, chime); the Kokoro voice. The bed ducks under the voice.
  out  score/{full,nomusic,stem_*}.wav, score/levels.json, assets/audio/final.m4a, assets/audio/nomusic.m4a
usage: python -X utf8 -I tools/sound_design.py   (numpy, scipy, soundfile; ffmpeg path in audiolib.FF or $FFMPEG)
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
BPM = 117.0
BEAT = 60 / BPM
K = 0.08
CUTS = [T["storm"] - K, W["channel"][11] - K, T["parts"] - K, T["agency"] - K, W["agency"][9] - 0.1, T["rule"] - K,
        T["evening"] - K, W["halt"][3] - K, W["gates"][6] - K, T["time"] - K, T["sink"] - K, T["six"] - K]


def st(n=N):
    return np.zeros((n, 2))


def saw(f, d, det=0.0):
    t = tt(d)
    ph = (f * (1 + det)) * t
    return 2 * (ph - np.floor(ph + 0.5))


# ---------------------------------------------------------------- energy curve (0..1) by section
def energy(t):
    pts = [(0, 0.55), (7.3, 0.62), (7.4, 0.45), (17.3, 0.5), (17.4, 0.4), (27.2, 0.55), (38.7, 0.75), (40.1, 0.85),
           (48.2, 0.95), (56.4, 1.0), (58.1, 0.7), (DUR - 2.5, 0.55), (DUR, 0.0)]
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)


def music():
    m = st()
    t = np.arange(N) / SR
    en = energy(t)
    # chords: Am - F - C - G (two bars each); after 58.1 C - G - Am - F, brighter
    prog_a = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]
    prog_b = [(48, [48, 52, 55, 59]), (55, [55, 59, 62]), (57, [57, 60, 64]), (53, [53, 57, 60, 64])]
    bar = 4 * BEAT
    # pad (detuned saws, low-passed), 2 bars per chord
    k = 0
    tc = 0.0
    while tc < DUR:
        prog = prog_b if tc >= T["six"] - K else prog_a
        root, notes = prog[k % 4]
        d = 2 * bar
        x = sum(saw(mtof(n), d + 0.6, det) for n in notes for det in (-0.004, 0.004)) / (2 * len(notes))
        x = lp(x, 900 if tc < 38 else 1500)
        e = env(len(x), a=0.6, d=0.1, s=1.0, r=0.6)
        place(m, x * e * 0.16, tc, 1.0, 0)
        # sub bass on the root, pulsing 8ths with a side-chain feel
        for b in range(int(d / (BEAT / 2))):
            tb = tc + b * BEAT / 2
            if tb >= DUR:
                break
            bt = tt(BEAT / 2 * 0.9)
            bx = np.sin(2 * np.pi * mtof(root - 12) * bt) * np.exp(-bt * 5)
            place(m, bx * 0.34 * float(energy(tb)), tb, 1.0, 0)
        tc += d
        k += 1
    # arpeggio (16ths, filtered square-ish), enters at 7.4, brighter after 27
    tb = 7.4
    i = 0
    while tb < DUR - 2.4:
        prog = prog_b if tb >= T["six"] - K else prog_a
        root, notes = prog[int((tb // (2 * bar)) % 4)]
        n = notes[i % len(notes)] + (12 if (i // 4) % 2 else 0)
        d = BEAT / 4
        x = np.sign(np.sin(2 * np.pi * mtof(n) * tt(d))) * np.exp(-tt(d) * 18)
        x = lp(x, 1600 + 2400 * float(energy(tb)))
        place(m, x * 0.05 * float(energy(tb)), tb, 1.0, 0.35 * np.sin(i * 0.7))
        tb += d
        i += 1
    # drums: kick from 17.4 (half-time) and full four-on-the-floor 38.7-58; hats from 27.2
    def kick():
        d = 0.38
        tk = tt(d)
        f = 44 + 100 * np.exp(-tk * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tk * 8)

    tb = 0.0
    while tb < DUR - 2.0:
        beat_i = int(round(tb / BEAT))
        if 38.7 <= tb < 58.0 or (17.4 <= tb < 38.7 and beat_i % 2 == 0) or (tb < 7.3 and beat_i % 2 == 0):
            place(m, kick() * 0.5, tb, 1.0, 0)
        if 27.2 <= tb < 58.0:
            for h in (0.5, ):
                th = tb + h * BEAT
                hx = hp(noise(int(0.05 * SR), beat_i), 7000) * np.exp(-tt(0.05) * 70)
                place(m, hx * 0.09, th, 1.0, 0.2)
        tb += BEAT
    # ride the energy curve and duck under the voice
    m *= (0.55 + 0.45 * en)[:, None]
    return m


def duck(m, vo):
    envv = np.abs(vo)
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    e = uniform_filter1d(maximum_filter1d(envv, int(0.05 * SR)), int(0.12 * SR))
    g = 1 - 0.45 * np.clip(e / (np.percentile(e, 95) + 1e-9), 0, 1)
    return m * g[:, None]


# ---------------------------------------------------------------- SFX
def whoosh(d=0.45, up=True):
    x = bp(noise(int(d * SR), 4), 300, 5000)
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2
    s = sweep(400 if up else 2000, 2000 if up else 300, d) * 0.15
    return (x * e + s * e) * 0.5


def beep(f1, f2, d=0.09):
    a = np.sin(2 * np.pi * f1 * tt(d)) * env(int(d * SR), 0.003, d * 0.8, 0, 0.01)
    b = np.sin(2 * np.pi * f2 * tt(d)) * env(int(d * SR), 0.003, d * 0.8, 0, 0.01)
    return np.concatenate([a, np.zeros(int(0.02 * SR)), b])


def ping(f=1400, d=1.2):
    t = tt(d)
    x = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 4)
    return x


def blip(f=1800, d=0.06):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 60)


def tick(seed=0):
    return hp(noise(int(0.012 * SR), seed), 3000) * np.exp(-tt(0.012) * 400)


def thud(d=1.4):
    t = tt(d)
    f = 38 + 50 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6) + 0.3 * lp(noise(len(t), 9), 200) * np.exp(-t * 5)


def rush(d):
    x = bp(noise(int(d * SR), 12), 200, 2600)
    e = env(len(x), a=d * 0.25, d=0.1, s=0.8, r=d * 0.4)
    return x * e


def groan(d):
    t = tt(d)
    f = 62 + 6 * np.sin(2 * np.pi * 0.7 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f * 2.02) / SR) * 0.3
    return lp(x, 380) * env(len(t), a=0.4, d=0.1, s=0.8, r=0.8)


def rumble(d):
    x = lp(noise(int(d * SR), 31), 120)
    return x * env(len(x), a=0.8, d=0.1, s=1.0, r=1.0) * 2.2


def chime():
    out = np.zeros(int(1.6 * SR))
    for k, n in enumerate([72, 76, 79, 84]):
        t = tt(1.6 - k * 0.07)
        x = np.sin(2 * np.pi * mtof(n) * t) * np.exp(-t * 3)
        out[int(k * 0.07 * SR):int(k * 0.07 * SR) + len(x)] += x
    return out * 0.5


def sfx():
    s = st()
    for c in CUTS:
        place(s, whoosh(0.42), c - 0.22, 0.32, 0.0)
    # hook: BOS arc + status flip
    place(s, ping(1500, 1.0), 0.35, 0.22, 0.3)
    place(s, beep(880, 660), W["hook"][5] - 0.02, 0.28, 0)
    place(s, groan(3.6), W["hook"][5] + 0.2, 0.16, -0.2)
    # map: storm rumble, photo pop
    place(s, rumble(6.0), CUTS[0], 0.5, 0)
    place(s, blip(1600), W["channel"][3] - 0.05, 0.3, 0.3)
    # channel: bracket tick
    place(s, blip(2200), W["channel"][11], 0.25, 0)
    # section: tide swell, wind on the surge
    place(s, rush(2.6) * 0.5, W["tide"][1], 0.22, -0.3)
    place(s, hp(rush(3.4), 900), W["surge"][2], 0.3, 0.3)
    # agency card + BOS ping + gauge pulse
    place(s, blip(1300), W["agency"][2] - 0.05, 0.3, 0)
    for k in range(9):
        place(s, blip(2400 + 120 * k, 0.04), CUTS[4] + 0.15 + k * 0.17, 0.12, -0.6 + 0.15 * k)
    place(s, ping(1200, 1.4), W["agency"][12] + 0.1, 0.32, 0)
    place(s, ping(900, 1.8), W["rule"][13] + 0.05, 0.4, 0)
    place(s, beep(660, 990), W["rule"][13] + 0.05, 0.2, 0)
    # evening: status CLOSING, halted tag
    place(s, beep(880, 660), W["evening"][4], 0.3, 0)
    place(s, blip(700, 0.1), W["halt"][2] - 0.1, 0.3, 0.4)
    # docks flood, gate groan, joint
    place(s, rush(2.0), W["halt"][5] - 0.1, 0.35, -0.2)
    place(s, blip(2200), W["gates"][4] - 0.05, 0.22, 0)
    place(s, groan(5.5), W["gates"][6], 0.32, 0.1)
    # panel: blips + the 2 h stamp
    place(s, blip(1500), T["time"] - 0.02, 0.28, 0)
    place(s, thud(0.8) * 0.6, W["time"][5], 0.5, 0)
    # gap countdown ticks
    t0, t1 = W["gates"][6] + 0.6, W["sink"][8] + 0.25
    tt_ = t0
    k = 0
    while tt_ < t1:
        place(s, tick(k), tt_, 0.12, 0.2)
        tt_ += 0.11
        k += 1
    # sink + seal
    place(s, thud(1.8), W["sink"][7], 0.75, 0)
    place(s, beep(660, 440), W["sink"][8], 0.3, 0)
    # six tiles + chime
    for k in range(6):
        tk = W["six"][2] + (W["six"][10] - W["six"][2]) * k / 5
        place(s, blip(1200 + 150 * k), tk, 0.3, -0.5 + 0.2 * k)
    place(s, chime(), W["six"][11], 0.32, 0)
    # counters
    tt_ = W["end"][1]
    k = 0
    while tt_ < W["end"][1] + 0.9:
        place(s, tick(k + 50), tt_, 0.1, -0.2)
        tt_ += 0.07
        k += 1
    place(s, blip(1700), W["end"][3], 0.28, -0.2)
    place(s, chime() * 0.8, W["end"][14] + 0.05, 0.3, 0.2)
    return s


def main():
    vo, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"))
    if sr != SR:
        vo = resample_poly(vo, SR, sr)
    if vo.ndim > 1:
        vo = vo.mean(axis=1)
    v = np.zeros(N)
    v[:min(N, len(vo))] = vo[:N]
    voice = np.stack([v, v], axis=1) * 1.0
    mu = duck(reverb(music(), rt=1.8, wet=0.18), voice[:, 0])
    fx = reverb(sfx(), rt=1.2, wet=0.15)
    # fade the tail
    fade = np.ones(N)
    fl = int(1.6 * SR)
    fade[-fl:] = np.linspace(1, 0, fl)
    mu *= fade[:, None]
    stems = {"voice": voice, "music": mu * 0.2, "sfx": fx * 0.26}
    out = os.path.join(ROOT, "score")
    rep = master(stems, out, target=-14.0, music_key="music", ceiling=-2.0)
    # voice vs bed+sfx on voiced samples
    sv = sf.read(os.path.join(out, "stem_voice.wav"))[0][:, 0]
    sb = sf.read(os.path.join(out, "stem_music.wav"))[0][:, 0] + sf.read(os.path.join(out, "stem_sfx.wav"))[0][:, 0]
    mask = np.abs(sv) > 0
    from scipy.ndimage import uniform_filter1d
    act = uniform_filter1d((np.abs(sv) > 0.01).astype(float), int(0.2 * SR)) > 0.3
    rep["voice_over_bed_db"] = round(rms_db(sv[act]) - rms_db(sb[act]), 2)
    rep["voice_over_music_db"] = round(rms_db(sv[act]) - rms_db(sf.read(os.path.join(out, "stem_music.wav"))[0][:, 0][act]), 2)
    rep["bpm"] = BPM
    json.dump(rep, open(os.path.join(out, "levels.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    to_m4a(os.path.join(out, "full.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    to_m4a(os.path.join(out, "nomusic.wav"), os.path.join(ROOT, "assets", "audio", "nomusic.m4a"))
    print(json.dumps(rep, indent=1))


main()
