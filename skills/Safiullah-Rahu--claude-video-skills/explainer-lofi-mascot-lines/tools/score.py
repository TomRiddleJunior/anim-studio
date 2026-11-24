"""Soundtrack for the lofi mascot reel, fully synthesized (no samples, no licences).

  music (full mix only): an original lo-fi bed at 70 BPM (the source's measured tempo), one chord per bar (= one scene),
         F major colour: Bbmaj9 - Am7 - Gm9 - C9sus4 - Fmaj9 - Dm9 - Bbmaj9; a tremolo electric piano through a low-pass,
         a sine bass on the roots, a soft boom-bap kit (kick on 1 and the 'and' of 2, a brushed rim on 2 and 4, swung hats),
         a few sparse bell notes, tape wow, vinyl crackle; drums drop for the last bar so the end loops into the start
  amb + sfx (both mixes): per-scene rain (behind glass / outdoors / on the window), room tone, and small foley on visible
         actions: the cup set down, water lapping and drips, a blanket rustle, the crowd's footsteps and murmur, a page
         turn and the lamp's hum, the mug on the sill
  voice: Kokoro am_michael, close, a touch of room, 10+ dB over everything under it
Two masters: score/final.wav (+ assets/audio/final.m4a) and score/final_nomusic.wav, each -14 LUFS, TP -2 dBTP.
usage: ~/.generative-music-video/venv/Scripts/python.exe -X utf8 -I tools/score.py
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import fftconvolve, lfilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, r"engine\audio")
import sound as S  # noqa: E402

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 48000
END = 22.3
N = int(END * SR)
BPM = 70.0
BEAT = 60 / BPM
BAR = 4 * BEAT
CUTS = [0, BAR, 2 * BAR, 3 * BAR, 4.5 * BAR, 5.5 * BAR, END]
RNG = np.random.default_rng(70)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def st(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], axis=1)


def place(bus, x, t, g=1.0, pan=0.0):
    if x.ndim == 1:
        x = st(x, pan)
    i = int(round(t * SR))
    if i >= len(bus) or i + len(x) <= 0:
        return
    if i < 0:
        x, i = x[-i:], 0
    k = min(len(x), len(bus) - i)
    bus[i:i + k] += x[:k] * g


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def rhodes(f, dur, vel=0.8):
    t = tt(dur)
    mod = 1.6 * vel * np.exp(-t / 0.5) * np.sin(2 * np.pi * f * t)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 2.2) + 0.2 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.6)
    x += 0.06 * np.sin(2 * np.pi * f * 7.1 * t) * np.exp(-t / 0.05)  # tine
    trem = 1 - 0.18 * (0.5 + 0.5 * np.sin(2 * np.pi * 4.6 * t))
    return x * trem * S.adsr(len(t), 0.006, 0, 1, 0.4) * vel * 0.3


CHORDS = [  # midi notes (voicings around middle C), one per bar
    [46, 57, 62, 65, 69], [45, 55, 60, 64, 67], [43, 53, 57, 62, 65], [48, 53, 58, 62, 64],
    [41, 52, 55, 60, 64], [38, 53, 57, 60, 64], [46, 57, 62, 65, 69]]


def music():
    m = np.zeros((N + SR * 3, 2))
    nb = int(np.ceil(END / BAR)) + 1
    for b in range(nb):
        t0 = b * BAR
        ch = CHORDS[b % len(CHORDS)]
        # piano: a rolled chord on 1, a softer re-strike on the 'and' of 3
        for k, n in enumerate(ch[1:]):
            place(m, rhodes(S.mtof(n), BAR + 0.6, 0.75), t0 + k * 0.018, 1.0, -0.25 + 0.12 * k)
            place(m, rhodes(S.mtof(n), BAR * 0.5, 0.45), t0 + 2.5 * BEAT + 0.04 + k * 0.012, 0.8, -0.2 + 0.1 * k)
        # bass
        place(m, S.bass(S.mtof(ch[0]), 1.6 * BEAT, 0.9), t0, 1.0)
        place(m, S.bass(S.mtof(ch[0]), 1.2 * BEAT, 0.7), t0 + 2.5 * BEAT, 0.9)
        # drums (not in the last bar)
        if t0 < 6 * BAR - 0.01:
            sw = 0.18 * BEAT  # swing on the off-8ths
            place(m, S.lp(S.kick(0.9), 2500), t0, 0.9)
            place(m, S.lp(S.kick(0.7), 2500), t0 + 1.5 * BEAT + sw * 0.5, 0.7)
            place(m, S.lp(S.kick(0.6), 2500), t0 + 2.75 * BEAT, 0.5)
            for bt in (1, 3):
                place(m, S.lp(S.snare(0.55), 5200), t0 + bt * BEAT + 0.012, 0.8, 0.1)
            for e in range(8):
                place(m, S.lp(S.hat(0.5 if e % 2 == 0 else 0.32), 9000), t0 + e * BEAT / 2 + (sw if e % 2 else 0), 0.55, 0.3)
        # sparse bell melody
        mel = {0: [(1.0, 81), (2.0, 79)], 1: [(0.5, 76)], 2: [(1.5, 77), (3.0, 74)], 3: [(1.0, 76)], 4: [(0.5, 81), (2.5, 79)], 5: [(1.5, 76), (3.0, 72)], 6: [(0.5, 77)]}
        for at, n in mel.get(b, []):
            place(m, S.bell(S.mtof(n), 0.55, 2.4, ratio=2.0, index=0.6, tau=0.9), t0 + at * BEAT, 0.45, 0.25)
    m = m[:N]
    # tape wow + low-pass + vinyl crackle
    t = np.arange(N) / SR
    wow = 0.0016 * np.sin(2 * np.pi * 0.55 * t) + 0.0006 * np.sin(2 * np.pi * 3.1 * t)
    idx = np.clip(np.arange(N) * (1 + 0) + (wow * SR), 0, N - 1)
    m = np.stack([np.interp(idx, np.arange(N), m[:, 0]), np.interp(idx, np.arange(N), m[:, 1])], axis=1)
    m = np.stack([S.lp(m[:, 0], 5200), S.lp(m[:, 1], 5200)], axis=1)
    crackle = (RNG.random(N) < 0.0009) * RNG.standard_normal(N) * 0.35 + S.bp(RNG.standard_normal(N), 800, 5000) * 0.004
    m += st(S.hp(crackle, 600))
    m = S.reverb(m, 1.6, 0.22, damp=4500, seed=3)
    return m


def rain(n, lo, hi, seed, drip=0.0):
    r = np.random.default_rng(seed)
    x = S.bp(r.standard_normal(n), lo, hi)
    if drip:
        d = (r.random(n) < drip) * r.standard_normal(n)
        x += S.bp(d, 1500, 6000) * 3
    return x


def main():
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
    assert sr == SR
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    n_ = int(0.4 * SR); tir = np.arange(n_) / SR
    ir = S.lp(RNG.standard_normal(n_), 4000) * np.exp(-6.9 * tir / 0.4); ir[: int(0.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
    voice = S.hp(v, 90)
    voice = voice * 0.92 + fftconvolve(voice, ir)[:N] * 0.12
    # look-ahead peak limiter on the voice (crest ~11 dB over its speech RMS)
    m_ = np.abs(voice) > 1e-4
    ceil = 10 ** ((rms_db(voice[m_]) + 11) / 20)
    g = np.minimum(1.0, ceil / np.maximum(np.abs(voice), 1e-9))
    g = uniform_filter1d(minimum_filter1d(g, size=int(0.01 * SR)), size=int(0.005 * SR))
    voice = st(voice * g)

    # ---- ambience per scene
    amb = np.zeros((N, 2))
    sc = [(CUTS[i], CUTS[i + 1]) for i in range(6)]
    beds = [rain(N, 300, 2500, 1) * 0.5,                           # café: rain behind glass (dull)
            rain(N, 600, 9000, 2, drip=0.004) * 1.0,               # puddle: outdoors, drips into water
            rain(N, 400, 3500, 3) * 0.45,                          # bed: rain on the window
            rain(N, 500, 8000, 4) * 0.85,                          # street: outdoors
            rain(N, 350, 3000, 5) * 0.45,                          # cosy bed: on the window
            S.lp(RNG.standard_normal(N), 900) * 0.25]              # window seat: snow — quiet room, soft wind
    for i, (a, b) in enumerate(sc):
        e = np.zeros(N); e[int(a * SR):int(b * SR)] = 1
        e = uniform_filter1d(e, size=int(0.06 * SR))
        amb += st(beds[i] * e, (-0.2, 0.2, 0.0, -0.1, 0.15, 0.0)[i])
    amb += st(S.lp(RNG.standard_normal(N), 180) * 0.15)  # room tone throughout

    fxb = np.zeros((N, 2))
    # café: the cup set on its saucer
    place(fxb, S.fx("tick", 0.08, 0.6), 0.55, 0.6, 0.2); place(fxb, S.bell(2600, 0.3, 0.5, ratio=2.7, index=0.4, tau=0.12), 0.56, 0.25, 0.2)
    # puddle: water lapping, a few plinks
    lap = S.lp(RNG.standard_normal(int(3.3 * SR)), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * tt(3.3)))
    place(fxb, lap * 0.8, CUTS[1] + 0.05, 1.0)
    for k in range(7):
        place(fxb, S.fx("bubble", 0.12, 1.2 + 0.4 * RNG.random()), CUTS[1] + 0.3 + k * 0.45 + 0.1 * RNG.random(), 0.25, RNG.uniform(-0.5, 0.5))
    # bed: blanket rustle
    place(fxb, S.fx("paper", 0.9, 0.5), CUTS[2] + 0.3, 0.5)
    # street: many footsteps + murmur
    for k in range(26):
        place(fxb, S.lp(S.fx("tock", 0.06, 0.5 + 0.3 * RNG.random()), 2200), CUTS[3] + 0.1 + k * 0.19 + 0.05 * RNG.random(), 0.35, RNG.uniform(-0.8, 0.8))
    mur = S.bp(RNG.standard_normal(int((CUTS[4] - CUTS[3]) * SR)), 250, 1100) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tt(CUTS[4] - CUTS[3])))
    place(fxb, mur, CUTS[3], 1.0)
    for k in range(4):
        place(fxb, S.fx("woosh_low", 0.7), CUTS[3] + 0.4 + k * 1.15, 0.25, (-1) ** k * 0.6)
    # cosy bed: a page turn, the lamp's hum
    place(fxb, S.fx("paper", 0.45), CUTS[4] + 0.5, 0.45, -0.2)
    hm = np.sin(2 * np.pi * 120 * tt(CUTS[5] - CUTS[4])) * 0.01
    place(fxb, hm, CUTS[4], 1.0, -0.4)
    # window seat: the mug on the sill
    place(fxb, S.fx("tick", 0.08, 0.5), CUTS[5] + 0.35, 0.55, 0.35)

    mus = music()

    speech = np.zeros(N, bool)
    for l in VO["lines"]:
        speech[int(l["start"] * SR):min(N, int(l["end"] * SR))] = True
    vdb = rms_db(voice[speech].mean(axis=1))

    def lvl(x, target):
        return x * 10 ** ((vdb + target - rms_db(x[speech].mean(axis=1))) / 20)
    amb = lvl(amb, -22.0)
    nz = np.abs(fxb).max(axis=1) > 1e-4
    fxb = fxb * 10 ** ((vdb - 16.0 - rms_db(fxb[nz].mean(axis=1))) / 20)
    mus = lvl(mus, -11.0)
    a_r = np.exp(-1 / (0.35 * SR))
    act = lfilter([1 - a_r], [1, -a_r], speech.astype(float))
    duck = 1 - (1 - 10 ** (-2.5 / 20)) * np.clip(act * 1.4, 0, 1)
    mus = mus * duck[:, None]
    under = amb + fxb
    lv = {"voice_db": round(vdb, 1), "music_under_voice_db": round(vdb - rms_db(mus[speech].mean(axis=1)), 1),
          "all_under_voice_db": round(vdb - rms_db((under + mus)[speech].mean(axis=1)), 1),
          "nomusic_under_voice_db": round(vdb - rms_db(under[speech].mean(axis=1)), 1),
          "music_alone_vs_voice_db": round(rms_db(mus[~speech].mean(axis=1)) - vdb, 1)}
    out = os.path.join(ROOT, "score")
    os.makedirs(out, exist_ok=True)

    def master(mix, path):
        mix = mix.copy()
        fl = int(0.03 * SR); mix[:fl] *= np.linspace(0, 1, fl)[:, None]; mix[-fl:] *= np.linspace(1, 0, fl)[:, None]
        mix = mix / (np.abs(mix).max() + 1e-9) * 0.7
        raw = path.replace(".wav", "_raw.wav")
        sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")

        def ln(p, extra=""):
            r = subprocess.run([FF, "-hide_banner", "-i", p, "-af", "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json" + extra, "-f", "null", "-"],
                               capture_output=True, text=True, encoding="utf-8", errors="replace")
            return json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
        m0 = ln(raw)
        mix = mix * 10 ** ((-14.0 - float(m0["input_i"])) / 20)
        ceil = 10 ** (-3.4 / 20)
        g = np.minimum(1.0, ceil / np.maximum(np.abs(mix).max(axis=1), 1e-9))
        g = uniform_filter1d(minimum_filter1d(g, size=int(0.03 * SR)), size=int(0.01 * SR))
        sf.write(raw, (mix * g[:, None]).astype(np.float32), SR, subtype="FLOAT")
        m = ln(raw)
        af = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
              f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
        r2 = subprocess.run([FF, "-y", "-hide_banner", "-i", raw, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", path], capture_output=True, text=True, encoding="utf-8", errors="replace")
        m2 = json.loads(r2.stderr[r2.stderr.rindex("{"): r2.stderr.rindex("}") + 1])
        os.remove(raw)
        return {"lufs": m2["output_i"], "tp": m2["output_tp"], "type": m2["normalization_type"], "limiter_gr_db": round(float(-20 * np.log10(g.min())), 1)}
    lv["full"] = master(voice + under + mus, os.path.join(out, "final.wav"))
    lv["nomusic"] = master(voice + under, os.path.join(out, "final_nomusic.wav"))
    sf.write(os.path.join(out, "stem_music.wav"), mus.astype(np.float32), SR)
    subprocess.run([FF, "-y", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
    json.dump(lv, open(os.path.join(out, "levels.json"), "w"), indent=1)
    print(json.dumps(lv, indent=1))


if __name__ == "__main__":
    main()
