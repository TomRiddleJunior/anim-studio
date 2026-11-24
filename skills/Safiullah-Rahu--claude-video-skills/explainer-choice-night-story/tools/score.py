"""Soundtrack for the choice night story, fully synthesized (no samples, no licences), on the voice-over clock.

Stems (48 kHz stereo):
  voice   narrator close and dry (small room); "pell" shouting outdoors with a two-tap mountain echo; "voice" muffled
          through a door (low-pass 2.4 kHz, small room)
  amb     wind with slow gusts (muffled indoors), the cable-car motor while it is near, room tone indoors
  sfx     story foley on visible actions: snow footsteps, the cable car, paper, pencil, the scratch-out, the step-120 hit,
          the lever + lamp thunk and hum, writing, clock ticks, the fog swell, three knocks, a heartbeat, the rule-card
          sting, the vote-card pop
  music   (full mix only) a sparse original suspense bed at 76 BPM in D minor: low pad, a five-note music-box motif,
          a soft pulse through the rules and the ritual, a swell on the lamp, silence under the clock, a dissonant
          drone under the knock, the motif once more on the vote card, then air
Two masters: assets/audio/final.m4a (everything) and score/final_nomusic.wav -> out/<name>_nomusic.mp4 (voice + sfx + amb).
Each is levelled on its own: pre-gain, look-ahead limiter, two-pass linear loudnorm to -14 LUFS, true peak -2.0 dBTP
(AAC adds ~0.5 dB).

The shot times below mirror assets/lib/film.js (keep them in sync).
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
NAME = os.path.basename(ROOT)
sys.path.insert(0, r"engine\audio")
import sound as S  # noqa: E402  (engine primitives: bp/lp/hp, bell, epiano, pad, fx …)

FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
SR = 48000
RNG = np.random.default_rng(23)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
SPEC = json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8"))
WHO = {l["id"]: l.get("who", "narrator") for l in SPEC["lines"]}
L = {l["id"]: l for l in VO["lines"]}
DUR = VO["duration"]
N = int(DUR * SR)


def w(lid, word, k=0):
    hits = [x for x in L[lid]["words"] if x["w"].lower().strip(",.?!…").startswith(word.lower())]
    return hits[min(k, len(hits) - 1)]["start"]


# ---- the shot clock (mirror of film.js)
T = {}
T["s2"] = L["pell1"]["start"] - 0.75
T["s3"] = L["ida1"]["start"] - 0.35
T["s4"] = L["taped"]["start"] - 0.3
T["s5"] = L["r1"]["start"] - 0.35
T["s6"] = L["steps"]["start"] - 0.45
T["s7"] = w("steps", "Count") - 0.1
T["s8"] = L["always"]["start"] - 0.2
T["s9"] = L["always"]["end"] + 0.3
T["s10"] = L["nine"]["start"] - 0.55
T["flash"] = w("nine", "Lamp") - 0.05
T["s11"] = L["log"]["start"] - 0.35
T["s12"] = L["log"]["end"] + 0.45
T["two"] = w("fog", "two")
T["s13"] = w("fog", "fog") - 0.3
T["knock"] = L["v1"]["start"] - 2.1
T["s14"] = T["knock"] - 0.45
T["s15"] = L["car"]["start"] - 0.3
T["s16"] = L["v2"]["start"] - 0.35
T["card"] = L["v2"]["end"] + 0.35
T["s17"] = L["ask"]["start"] - 0.45
T["vote"] = L["ask"]["start"] - 0.15
KNOCKS = [T["knock"], T["knock"] + 0.42, T["knock"] + 0.84]
INDOOR = [(T["s4"], T["s6"]), (T["s11"], T["s15"]), (T["s16"], DUR + 1)]


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


def room(x, rt=0.5, wet=0.12, seed=3):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    t = np.arange(n) / SR
    ir = S.lp(r.standard_normal(n), 4200) * np.exp(-6.9 * t / rt)
    ir[: int(0.01 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - wet) + fftconvolve(x, ir)[: len(x)] * wet * 2.0


def compress(x, crest_db=11.0):
    """Tame Kokoro's syllable peaks: a look-ahead peak limiter on the mono voice stem whose ceiling sits crest_db above the
    stem's speech RMS (5 ms look-ahead, 60 ms release), so the master limiter only trims what is left."""
    m = np.abs(x) > 1e-4
    if not m.any():
        return x
    ceil = 10 ** ((rms_db(x[m]) + crest_db) / 20)
    g = np.minimum(1.0, ceil / np.maximum(np.abs(x), 1e-9))
    g = minimum_filter1d(g, size=int(0.01 * SR))
    g = uniform_filter1d(g, size=int(0.005 * SR))
    a_r = np.exp(-1 / (0.06 * SR))
    gs = lfilter([1 - a_r], [1, -a_r], g - 1) + 1  # smooth recovery
    return x * np.minimum(g, gs)


def env_on(spans, fade=0.3):
    e = np.zeros(N)
    for a, b in spans:
        i, j = max(0, int(a * SR)), min(N, int(b * SR))
        if j > i:
            e[i:j] = 1
    k = int(fade * SR)
    return uniform_filter1d(e, size=max(1, k))


# ---------------------------------------------------------------- foley
def crunch(g=1.0, dur=0.16):
    t = tt(dur)
    grains = (RNG.random(len(t)) < 0.08) * RNG.standard_normal(len(t))
    x = S.bp(grains + 0.25 * RNG.standard_normal(len(t)), 900, 6000) * np.exp(-t / (dur * 0.35))
    x += S.lp(RNG.standard_normal(len(t)), 300) * np.exp(-t / 0.03) * 0.5
    return x * g * 0.6


def knock(g=1.0):
    t = tt(0.5)
    body = (np.sin(2 * np.pi * 105 * t) * 0.9 + np.sin(2 * np.pi * 178 * t) * 0.5 + np.sin(2 * np.pi * 262 * t) * 0.25) * np.exp(-t / 0.07)
    hit = S.lp(RNG.standard_normal(len(t)), 1800) * np.exp(-t / 0.012)
    return np.tanh((body + hit * 0.8) * 1.6) * g * 0.7


def clunk(g=1.0):
    t = tt(0.4)
    x = S.bp(RNG.standard_normal(len(t)), 300, 3000) * np.exp(-t / 0.02) + np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.08) * 0.8
    x2 = np.zeros(len(t)); i = int(0.06 * SR); x2[i:] = x[: len(t) - i] * 0.6
    return (x + x2) * g * 0.6


def hum(dur, g=1.0, f=60):
    t = tt(dur)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 + np.sin(2 * np.pi * 2 * f * t) * 0.5
    return S.lp(x, 700) * g * 0.12


def tick(g=1.0, f=2400):
    t = tt(0.06)
    return (np.sin(2 * np.pi * f * t) * 0.5 + S.bp(RNG.standard_normal(len(t)), 2000, 7000)) * np.exp(-t / 0.006) * g * 0.5


def motor(dur, g=1.0):
    t = tt(dur)
    f = 48 + 3 * np.sin(2 * np.pi * 0.3 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * 0.6 + np.sin(2 * ph) * 0.35 + np.sin(3 * ph) * 0.2 + S.bp(RNG.standard_normal(len(t)), 200, 900) * 0.25
    return S.lp(x, 900) * g * 0.35


def wind(n, seed=5):
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    gust = 0.55 + 0.25 * np.sin(2 * np.pi * 0.07 * t + 1) + 0.2 * np.sin(2 * np.pi * 0.19 * t + 2.3)
    x = S.bp(r.standard_normal(n), 180, 1600) * gust + S.bp(r.standard_normal(n), 1200, 3800) * 0.25 * gust ** 2
    whistle = np.sin(2 * np.pi * np.cumsum(620 + 90 * np.sin(2 * np.pi * 0.11 * t)) / SR) * 0.02 * np.clip(gust - 0.6, 0, 1)
    return x + whistle


# ---------------------------------------------------------------- music (66 BPM, D minor)
BPM = 76.0
BEAT = 60 / BPM


def music_bed():
    m = np.zeros((N, 2))
    # sections: (t0, t1, energy) on the story clock
    secs = [(0.0, T["s5"], 1), (T["s5"], T["s6"], 2), (T["s6"], T["s10"], 3), (T["s10"], T["s12"], 2), (T["s12"], T["knock"] - 0.2, 0),
            (T["knock"] - 0.2, T["vote"], 4), (T["vote"], DUR, 1)]
    D = 50  # D3
    chords = [[D - 12, D, D + 3, D + 7], [D - 14, D - 2, D + 2, D + 5], [D - 16, D - 4, D, D + 3], [D - 19, D - 7, D - 3, D + 2]]  # i, VII(6), VI, iv-ish
    bar = 4 * BEAT
    for a, b, e in secs:
        if e == 0:
            continue
        t = a
        k = 0
        while t < b - 0.2:
            d = min(2 * bar, b - t)
            notes = chords[k % 4] if e != 4 else [D - 12, D - 11, D + 3]
            p = S.pad(notes, d + 1.2, vel=0.9 if e < 4 else 1.1, cutoff=900 if e < 3 else 1300, attack=1.2, release=1.2)
            place(m, p, t, 1.0)
            t += 2 * bar
            k += 1
        # soft pulse in the rules / ritual (low felt thump + tick on the off-beat)
        if e in (2, 3):
            t = a + 0.05
            while t < b - 0.1:
                place(m, S.lp(S.kick(0.35), 500), t, 0.5 if e == 2 else 0.75)
                if e == 3:
                    place(m, S.hat(0.25), t + BEAT / 2, 0.5, 0.3)
                t += BEAT
        if e == 4:  # dissonant tremolo drone + a glassy high tone
            n = int((b - a) * SR)
            tt_ = np.arange(n) / SR
            dr = (np.sin(2 * np.pi * S.mtof(D - 24) * tt_) + 0.7 * np.sin(2 * np.pi * S.mtof(D - 23) * tt_)) * (0.75 + 0.25 * np.sin(2 * np.pi * 5.5 * tt_))
            gl = np.sin(2 * np.pi * S.mtof(D + 26) * tt_) * 0.08 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * tt_))
            fade = np.minimum(1, tt_ / 1.5) * np.minimum(1, (tt_[-1] - tt_ + 1e-3) / 0.8)
            place(m, (dr * 0.06 + gl) * fade, a)
    # the music-box motif (D A F E D) — the hook, the ritual's top, the vote card
    motif = [(0, 74), (0.5, 81), (1.0, 77), (1.5, 76), (2.25, 74)]
    for t0, g in ((1.0, 0.8), (T["s5"] + 0.4, 0.55), (T["s9"] + 0.2, 0.6), (T["vote"] + 1.0, 0.7)):
        for dt, n_ in motif:
            place(m, S.bell(S.mtof(n_), 0.8, 2.4, ratio=4.0, index=1.2, tau=0.9), t0 + dt * BEAT, g * 0.55, 0.2)
    # the lamp swell
    place(m, S.fx("riser", 1.4), T["flash"] - 1.4, 0.35)
    place(m, S.pad([D, D + 7, D + 12, D + 16], 3.0, vel=1.2, cutoff=2400, attack=0.05, release=2.0), T["flash"], 0.9)
    m = S.reverb(m, 2.4, 0.35, damp=5000, seed=4)
    return m


def main():
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
    assert sr == SR
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    narr, pell, door = np.zeros(N), np.zeros(N), np.zeros(N)
    for l in VO["lines"]:
        a, b = int((l["start"] - 0.08) * SR), int((l["end"] + 0.2) * SR)
        {"narrator": narr, "pell": pell, "voice": door}[WHO.get(l["id"], "narrator")][a:b] += v[a:b]
    narr = room(S.hp(narr, 80), 0.4, 0.06)
    # Pell: outdoors, a little grit, two echoes off the ridge
    pell = np.tanh(S.hp(pell, 140) * 1.5) / 1.5 * 1.2
    pe = np.zeros(N)
    for d, g in ((0.42, 0.16), (0.84, 0.08)):
        i = int(d * SR); pe[i:] += S.lp(pell[: N - i], 2500) * g
    pell = pell + pe
    # the voice outside: through a timber door
    door = room(S.lp(S.hp(door, 160), 2400, order=4) * 1.25, 0.35, 0.2, seed=8)
    # match each character's speaking level to the narrator (Pell +1 dB, shouting; the door voice -1.5 dB)
    def spk(lines_of):
        m = np.zeros(N, bool)
        for l in VO["lines"]:
            if WHO.get(l["id"], "narrator") == lines_of:
                m[int(l["start"] * SR):int(l["end"] * SR)] = True
        return m
    nref = rms_db(narr[spk("narrator")])
    pell = pell * 10 ** ((nref + 1.0 - rms_db(pell[spk("pell")])) / 20)
    door = door * 10 ** ((nref - 1.5 - rms_db(door[spk("voice")])) / 20)
    voice = st(compress(narr)) + st(compress(pell), -0.1) + st(compress(door), 0.12)

    # ---- ambience
    amb = np.zeros((N, 2))
    wd = wind(N)
    ind = env_on(INDOOR, 0.25)
    wout = wd * (1 - ind)
    win = S.lp(wd, 500) * ind * 0.45
    vote_k = env_on([(T["s17"], DUR + 1)], 0.6)
    amb += st((wout + win) * (1 - 0.6 * vote_k))
    tone = S.lp(RNG.standard_normal(N), 220) * 0.08 * ind
    amb += st(tone)
    # cable car motor: docked hum in S1, departing in S2
    mo = motor(T["s3"] + 0.5)
    tm = np.arange(len(mo)) / SR
    km = np.where(tm < T["s2"], 0.55, np.clip(1 - (tm - T["s2"]) / (T["s3"] - T["s2"]), 0, 1) ** 1.3 * 1.1)
    place(amb, mo * km, 0.0, 1.0, 0.25)

    # ---- sfx
    fxb = np.zeros((N, 2))
    place(fxb, S.fx("woosh_low", 0.8), T["s2"] - 0.25, 0.25)
    for k in range(3):  # wire clatter as the cabin leaves the wheel
        place(fxb, clunk(0.6), T["s2"] + 0.25 + k * 0.17, 0.35, 0.3)
    # S3 footsteps (walk phase lt*7 between 0.6 and 2.5 s)
    t = T["s3"] + 0.6
    while t < T["s3"] + 2.45:
        place(fxb, crunch(1.0), t, 0.55, 0.35); t += np.pi / 7
    place(fxb, S.fx("paper", 0.5), T["s5"] + 0.05, 0.35)
    # pencil while each rule is typed
    for lid, word, to in (("r1", "Read", "r1"), ("r2", "Never", "r2"), ("r3", "Nobody", "r3"), ("r4", "There", "r4b")):
        a, b = w(lid, word) - 0.05, L[to]["end"] - 0.1
        place(fxb, S.fx("scribble", b - a), a, 0.22)
    r5 = L["r5"]["start"]; tw = w("r5", "Twice")
    place(fxb, S.fx("scribble", 0.75), r5 - 0.2, 0.75); place(fxb, S.fx("scribble", 0.45), tw - 0.05, 0.9)
    place(fxb, S.fx("thud", 0.35), tw, 0.3)
    # S6 / S7 steps
    t = T["s6"] + 0.2
    while t < T["s7"] - 0.1:
        place(fxb, crunch(0.8), t, 0.45, -0.2); t += np.pi / 6
    span = T["s8"] - T["s7"]
    for k in range(1, 5):
        place(fxb, crunch(1.1, 0.2), T["s7"] + span * k / 4.2, 0.6)
    place(fxb, crunch(1.4, 0.25), T["s8"] + 0.5, 0.8)
    place(fxb, S.fx("impact", 0.9), T["s8"] + 0.52, 0.28)
    t = T["s9"] + 0.1
    while t < T["s9"] + 1.1:
        place(fxb, crunch(0.9), t, 0.5, 0.3); t += np.pi / 7
    # the lever, the lamp
    place(fxb, clunk(1.0), T["flash"] - 0.1, 0.9, 0.2)
    place(fxb, S.fx("impact", 1.0), T["flash"], 0.4)
    place(fxb, hum(T["s11"] - T["flash"]) * np.minimum(1, tt(T["s11"] - T["flash"]) / 0.3), T["flash"], 0.8, -0.2)
    # writing the log
    place(fxb, S.fx("scribble", 1.7), L["log"]["start"], 0.3)
    # the clock: ticks each second, the 2:00 tick heavier
    two = T["two"] - 0.05
    t = T["s12"] + 0.1
    while t < two:
        place(fxb, tick(1.0), t, 0.55); t += (two - T["s12"]) / 3.0
    place(fxb, tick(1.4, 1600), two, 0.9); place(fxb, S.fx("thud", 0.5), two, 0.45)
    t = two + 1.0
    while t < T["s13"]:
        place(fxb, tick(0.8), t, 0.4); t += 1.0
    # the fog
    place(fxb, S.fx("whoosh", 1.6, 0.7), T["s13"] - 0.1, 0.35)
    place(fxb, S.lp(RNG.standard_normal(int(1.8 * SR)), 2500) * np.sin(np.pi * np.linspace(0, 1, int(1.8 * SR))) * 0.15, T["s13"], 1.0)
    # the knocks
    for kt in KNOCKS:
        place(fxb, room(knock(1.0), 0.6, 0.25), kt, 0.7)
    # heartbeat under the second plea
    t = L["v2"]["start"] - 0.2
    while t < T["s17"]:
        place(fxb, S.fx("heartbeat", 0.5), t, 0.32); t += 0.86
    place(fxb, S.fx("impact", 1.2, 0.8), T["card"], 0.4)
    place(fxb, S.fx("pop", 0.25), T["vote"], 0.3)
    place(fxb, S.fx("woosh_low", 0.6), T["s17"] - 0.1, 0.25)

    mus = music_bed()

    # ---- levels
    speech = np.zeros(N, bool)
    for l in VO["lines"]:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    vdb = rms_db(voice[speech].mean(axis=1))

    def lvl(x, target_db, mask=None):
        mm = mask if mask is not None else speech
        r = rms_db(x[mm].mean(axis=1)) if mm.any() else -120
        return x * 10 ** ((vdb + target_db - r) / 20)
    amb = lvl(amb, -24.0)
    nz = np.abs(fxb).max(axis=1) > 1e-4
    fxb = fxb * 10 ** ((vdb - 13.0 - rms_db(fxb[nz].mean(axis=1))) / 20)
    mus = lvl(mus, -17.0)
    a_r = np.exp(-1 / (0.3 * SR))
    act = lfilter([1 - a_r], [1, -a_r], speech.astype(float))
    duck = 1 - (1 - 10 ** (-3 / 20)) * np.clip(act * 1.4, 0, 1)
    mus = mus * duck[:, None]

    under = amb + fxb
    lv = {"voice_db": round(vdb, 1),
          "music_under_voice_db": round(vdb - rms_db(mus[speech].mean(axis=1)), 1),
          "bed_under_voice_db": round(vdb - rms_db((amb + mus)[speech].mean(axis=1)), 1),
          "all_under_voice_db": round(vdb - rms_db((under + mus)[speech].mean(axis=1)), 1),
          "nomusic_under_voice_db": round(vdb - rms_db(under[speech].mean(axis=1)), 1)}
    out = os.path.join(ROOT, "score")
    os.makedirs(out, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    sf.write(os.path.join(out, "stem_music.wav"), mus.astype(np.float32), SR)

    def master(mix, path):
        fl = int(0.5 * SR)
        mix = mix.copy(); mix[-fl:] *= np.linspace(1, 0, fl)[:, None] ** 1.5
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
        hot = np.where(g < 10 ** (-3 / 20))[0]
        if len(hot):
            secs = sorted(set(np.round(hot / SR, 1)))
            print("  limiter > 3 dB at", secs[:12], "…" if len(secs) > 12 else "")
        sf.write(raw, (mix * g[:, None]).astype(np.float32), SR, subtype="FLOAT")
        m = ln(raw)
        af = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
              f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
        r2 = subprocess.run([FF, "-y", "-hide_banner", "-i", raw, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", path],
                            capture_output=True, text=True, encoding="utf-8", errors="replace")
        m2 = json.loads(r2.stderr[r2.stderr.rindex("{"): r2.stderr.rindex("}") + 1])
        os.remove(raw)
        return {"lufs": m2["output_i"], "tp": m2["output_tp"], "type": m2["normalization_type"], "limiter_gr_db": round(float(-20 * np.log10(g.min())), 1)}

    lv["full"] = master(voice + under + mus, os.path.join(out, "final.wav"))
    lv["nomusic"] = master(voice + under, os.path.join(out, "final_nomusic.wav"))
    subprocess.run([FF, "-y", "-v", "error", "-i", os.path.join(out, "final.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "audio", "final.m4a")], check=True)
    subprocess.run([FF, "-y", "-v", "error", "-i", os.path.join(out, "final_nomusic.wav"), "-c:a", "aac", "-b:a", "256k", os.path.join(out, "final_nomusic.m4a")], check=True)
    lv["times"] = {k: round(v, 3) for k, v in T.items()}
    json.dump(lv, open(os.path.join(out, "levels.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in lv.items() if k != "times"}, indent=1))


if __name__ == "__main__":
    main()
