"""Original music + SFX for the math race, fully synthesized (the source uses a commercial song uploaded as original
audio; nothing of it is used). 103 BPM and F major like the source (rea: 103.4 BPM, F major), first beat at -0.26 s (the reel opens mid-phrase), 4/4:

  bars 0-1 (-0.26-4.40 s) intro: warm pad + felt-pluck arpeggio (Am - F), a light kick/hat enters in bar 1 (the source's
                          energy rises at ~3.5 s), a riser into the drop;
  bar 2 (4.40 s)         the drop with the background reveal: sub hit, kick/clap/hats, sub bass, open pad, a bell hook;
  bars 2-5               C - G - Am - F, full;
  bar 6 (13.72 s)        the final reveal: C(add9) with a shimmer swell, a short fade at the very end (loop-friendly).
SFX (also the whole of the no-music mix): a bright bell + sparkle at each lead change (4.40 = the drop and the reveal, 9.06, 11.97 s), the iris
whoosh at the drop, a soft shimmer on the final reveal.

Outputs: score/final.wav + assets/audio/final.m4a (full mix, -14 LUFS, TP <= -1.5 dBTP), score/nomusic.wav +
score/nomusic.m4a (SFX only, at the SAME gain as in the full mix, so a library track added in the app sits under them),
score/levels.json.

usage: <venv python> -I tools/sound_design.py
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"engine\node_modules\ffmpeg-static\ffmpeg.exe"
CFG = json.load(open(os.path.join(ROOT, "score", "config.json")))
SR = 48000
DUR = CFG["dur"]
N = int(round(DUR * SR))
BEAT = 60.0 / CFG["bpm"]
B0 = CFG["beat0"]
RNG = np.random.default_rng(7)


def bt(k):
    return B0 + k * BEAT


def flt(x, kind, f, o=2):
    f = np.atleast_1d(f) / (SR / 2)
    return sosfilt(butter(o, f if len(f) > 1 else f[0], btype=kind, output="sos"), x, axis=0)


def tt(d):
    return np.arange(int(d * SR)) / SR


def adsr(d, a=0.005, dec=0.2, s=0.6, r=0.1):
    n = int(d * SR)
    e = np.ones(n)
    na, nd, nr = int(a * SR), int(dec * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, max(1, na))[:na]
    e[na:na + nd] = np.linspace(1, s, max(1, nd))[: len(e[na:na + nd])]
    e[na + nd:] = s
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(bus, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(bus):
        return
    j0 = max(0, -i)
    seg = x[j0: max(0, min(len(x), len(bus) - i))]
    bus[i + j0: i + j0 + len(seg)] += seg * g


KEY = 5  # written in A minor / C; sounds in D minor / F major, the source track's measured key (F major)


def midi(m):
    return 440.0 * 2 ** ((m + KEY - 69) / 12)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


# ------------------------------------------------------------------ instruments
def saw(f, d, det=(0.0, 0.07, -0.07)):
    t = tt(d)
    out = np.zeros_like(t)
    for c in det:
        ph = (f * 2 ** (c / 12) * t + RNG.random()) % 1.0
        out += 2 * ph - 1
    return out / len(det)


def pad(notes, d, cutoff):
    x = sum(saw(midi(m), d) for m in notes) / len(notes)
    return flt(x, "low", cutoff, 2) * adsr(d, 0.35, 0.3, 0.85, 0.3)


def pluck(m, d=0.5, bright=1.0):
    t = tt(d)
    f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(4 * np.pi * f * t) + 0.12 * bright * np.sin(6 * np.pi * f * t)
    return x * np.exp(-t * 7) * np.minimum(1, t / 0.004)


def bell(m, d=1.4, g=1.0):
    t = tt(d)
    f = midi(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 5)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.2) * np.minimum(1, t / 0.002) * g


def kick(g=1.0):
    d = 0.32
    f = np.geomspace(150, 45, int(d * SR))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt(d) * 9)
    c = flt(RNG.standard_normal(int(0.01 * SR)), "band", [1500, 6000]) * np.exp(-tt(0.01) * 300) * 0.3
    x[:len(c)] += c
    return x * g


def clap(g=1.0):
    d = 0.22
    n = flt(RNG.standard_normal(int(d * SR)), "band", [900, 4200])
    e = np.zeros(int(d * SR))
    for k, o in enumerate((0, 0.011, 0.022)):
        i = int(o * SR)
        e[i:] += np.exp(-tt(d - o) * (55 if k < 2 else 16)) * (0.6 if k < 2 else 1)
    return n * e * 0.55 * g


def hat(g=1.0, d=0.05):
    return flt(RNG.standard_normal(int(d * SR)), "high", 7500) * np.exp(-tt(d) * 70) * 0.22 * g


def sub(m, d, g=1.0):
    t = tt(d)
    return np.sin(2 * np.pi * midi(m) * t) * adsr(d, 0.004, 0.08, 0.8, 0.04) * g


def noise_swell(d, lo=2000, hi=12000, g=1.0, rise=True):
    n = int(d * SR)
    x = flt(RNG.standard_normal(n), "band", [lo, hi])
    e = (np.linspace(0, 1, n) ** 2) if rise else np.exp(-np.linspace(0, 6, n))
    return x * e * g


def whoosh(d=0.7, g=1.0):
    n = int(d * SR)
    x = RNG.standard_normal(n)
    f = np.geomspace(300, 5000, n)
    out = np.zeros(n)
    for i in range(0, n, 512):
        out[i:i + 512] = flt(x[i:i + 512], "band", [f[i] * 0.7, min(f[i] * 1.4, 20000)], 1)
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.4 * 0.5 * g


def sparkle(g=1.0):
    out = np.zeros(int(1.2 * SR))
    for k in range(9):
        m = 96 + [0, 3, 7, 10, 12, 15, 19, 22, 24][k]
        place(out, np.sin(2 * np.pi * midi(m) * tt(0.25)) * np.exp(-tt(0.25) * 14) * 0.18, 0.035 * k)
    return out * g


# ------------------------------------------------------------------ arrangement
PROG = [  # (root for the bass, pad notes, arp notes)
    (45, [57, 60, 64], [69, 72, 76, 79]),   # Am(add b7)
    (41, [53, 57, 60], [65, 69, 72, 76]),   # F(maj7)
    (48, [55, 60, 64], [67, 72, 76, 79]),   # C
    (43, [55, 59, 62], [67, 71, 74, 79]),   # G
    (45, [57, 60, 64], [69, 72, 76, 81]),   # Am
    (41, [53, 57, 60], [65, 69, 72, 77]),   # F
    (48, [55, 60, 64, 62], [67, 72, 74, 79]),  # C(add9)
]
HOOK = {2: [(0, 76), (1, 79), (2, 81), (3, 79)], 3: [(0, 79), (1.5, 74), (2, 76), (3, 74)], 4: [(0, 76), (1, 79), (2, 84), (3, 81)], 5: [(0, 79), (1.5, 77), (2, 76), (3, 72)]}


def music():
    L = np.zeros(N); Rr = np.zeros(N)
    bar = 4 * BEAT
    for b, (root, pn, arp) in enumerate(PROG):
        t0 = bt(4 * b)
        if t0 >= DUR:
            break
        full = b >= 2
        d = bar + (0.6 if b == len(PROG) - 1 else 0.05)
        p = pad(pn, d, 2600 if full else 900 + 500 * b)
        place(L, p, t0, 0.42 if full else 0.48); place(Rr, p, t0, 0.42 if full else 0.48)
        # felt pluck arpeggio, 8ths
        for k in range(8):
            m = arp[[0, 1, 2, 3, 2, 1, 2, 3][k]]
            x = pluck(m, 0.6, 1.0 if full else 0.6)
            place(L if k % 2 else Rr, x, t0 + k * BEAT / 2, 0.16 if full else 0.22)
            place(Rr if k % 2 else L, x, t0 + k * BEAT / 2, 0.07)
        if b >= 1:
            g = 1.0 if full else 0.75
            for k in range(4):
                tb = t0 + k * BEAT
                if k in (0, 2) or (full and k == 3 and b % 2):
                    place(L, kick(0.95 * g), tb + (0.5 * BEAT if (full and k == 3) else 0)); place(Rr, kick(0.95 * g), tb + (0.5 * BEAT if (full and k == 3) else 0))
                if full and k in (1, 3):
                    place(L, clap(0.8), tb); place(Rr, clap(0.8), tb)
                for h in (0, 0.5):
                    place(L if h else Rr, hat(g * (1 if h else 0.6)), tb + h * BEAT)
            if True:
                for k in range(8):
                    s = sub(root - 12 + (12 if k % 4 == 3 else 0), BEAT / 2 * 0.9, 0.5 if full else 0.3)
                    place(L, s, t0 + k * BEAT / 2); place(Rr, s, t0 + k * BEAT / 2)
        if b in HOOK:
            for (beat, m) in HOOK[b]:
                x = bell(m, 1.0, 0.16)
                place(L, x, t0 + beat * BEAT, 0.9); place(Rr, x, t0 + beat * BEAT + 0.012, 0.9)
    # riser into the drop, sub hit on the drop, shimmer on the reveal
    r = noise_swell(bt(8) - bt(5), 1500, 9000, 0.12)
    place(L, r, bt(5)); place(Rr, r, bt(5))
    hit = np.sin(2 * np.pi * np.cumsum(np.geomspace(80, 32, int(1.2 * SR))) / SR) * np.exp(-tt(1.2) * 3.5) * 0.9
    place(L, hit, bt(8)); place(Rr, hit, bt(8))
    sh = noise_swell(1.6, 5000, 14000, 0.1, rise=False)
    place(L, sh, bt(24)); place(Rr, sh, bt(24))
    m = np.stack([L, Rr], axis=1)
    m[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))[:, None]
    return m


def sfx():
    L = np.zeros(N); Rr = np.zeros(N)
    for i, t in enumerate([bt(k) for k in CFG["crossBeats"]]):
        b = bell([88, 91, 93, 95][i % 4], 1.6, 0.5)
        b[: int(1.0 * SR)] += bell([100, 103, 105, 107][i % 4], 1.0, 0.18)
        place(L, b, t); place(Rr, b, t + 0.01)
        s = sparkle(0.8)
        place(L, s, t + 0.03); place(Rr, s, t + 0.05)
    w = whoosh(0.8, 0.8)
    place(L, w, bt(CFG["dropBeat"]) - 0.25); place(Rr, w, bt(CFG["dropBeat"]) - 0.22)
    s = sparkle(0.7)
    place(L, s, bt(CFG["revealBeat"]) + 0.1); place(Rr, s, bt(CFG["revealBeat"]) + 0.14)
    return np.stack([L, Rr], axis=1)


def meas(p, extra=""):
    r = subprocess.run([FF, "-hide_banner", "-i", p, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json" + extra, "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    return json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])


def write(a, wav, m4a):
    a = np.pad(a, ((0, max(0, N - len(a))), (0, 0)))[:N]
    sf.write(wav, a.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run([FF, "-y", "-v", "error", "-i", wav, "-c:a", "aac", "-b:a", "256k", m4a], check=True)


def main():
    mus, fx = music(), sfx()
    mus *= 10 ** ((-20 - rms_db(mus)) / 20)
    act = np.abs(fx).max(axis=1) > 1e-4
    fx *= 10 ** ((-20 - 5.0 - rms_db(fx[act])) / 20)   # chimes ride ~5 dB under the music's average level while they ring
    full = mus + fx
    out = os.path.join(ROOT, "score")
    raw = os.path.join(out, "full_raw.wav")
    sf.write(raw, full.astype(np.float32), SR, subtype="FLOAT")
    g = 10 ** ((-14.0 - float(meas(raw)["input_i"])) / 20)
    full, fxg = full * g, fx * g
    full0, fx0 = full, fxg
    for ceil_db in (-3.0, -3.5, -4.0, -4.5, -5.0):   # sample-peak ceiling low enough that the true peak lands <= -2 dBTP
        ceil = 10 ** (ceil_db / 20)
        gl = np.minimum(1.0, ceil / np.maximum(np.abs(full0).max(axis=1), 1e-9))
        gl = uniform_filter1d(minimum_filter1d(gl, size=int(0.02 * SR)), size=int(0.008 * SR))
        full, fxg = full0 * gl[:, None], fx0 * gl[:, None]
        fade = int(0.25 * SR)
        full[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
        fxg[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
        sf.write(raw, full.astype(np.float32), SR, subtype="FLOAT")
        m = meas(raw)
        trim = 10 ** ((-14.0 - float(m["input_i"])) / 20)
        full, fxg = full * trim, fxg * trim   # final trim (linear)
        sf.write(raw, full.astype(np.float32), SR, subtype="FLOAT")
        if float(meas(raw)["input_tp"]) <= -2.0:
            break
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    write(full, os.path.join(out, "final.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    write(fxg, os.path.join(out, "nomusic.wav"), os.path.join(out, "nomusic.m4a"))
    os.remove(raw)
    mf, mn = meas(os.path.join(out, "final.wav")), meas(os.path.join(out, "nomusic.wav"))
    lv = {"bpm": CFG["bpm"], "beat0": B0, "limiter_gr_db": round(float(-20 * np.log10(gl.min())), 1),
          "full": {"lufs": float(mf["input_i"]), "tp": float(mf["input_tp"])}, "nomusic_sfx_only": {"lufs": float(mn["input_i"]), "tp": float(mn["input_tp"])},
          "sfx_under_music_db_while_ringing": 5.0, "ceiling_db": ceil_db}
    json.dump(lv, open(os.path.join(out, "levels.json"), "w"), indent=1)
    print(json.dumps(lv, indent=1))


if __name__ == "__main__":
    main()
