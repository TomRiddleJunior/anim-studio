"""Synthesized soundtrack for a Guardian episode: voice post, music bed, clock and card sounds, mix, -14 LUFS.

Reads  score/data/cues.json (tools/timeline.py), vo/audio/vo.wav + vo/data/join.json (per-line windows, who speaks)
Writes score/audio/voice.wav  the processed voices (stereo): the Guardian with a warm clock-tower reverb, a light
                              chorus and a faint high "air" shimmer far down; the girl dry with a small room
       score/audio/bed.wav    music + effects (stereo)
       score/audio/final.wav  the mix, two-pass loudnorm to -14 LUFS / -1.5 dBTP
       score/data/levels.json integrated loudness, true peak, voice-over-bed margin while speaking

Music: warm pads on a slow D-major progression (Dmaj9 - Bm9 - Gmaj9 - Asus) with a sparse music-box motif; it
drops to silence with the clock's clunk before rule one, returns as a low drone under rule one, and swells warm on
the last "Now." Effects: ticks/tocks on the clock schedule (speeding up), a mechanism whirr while the hands blur,
the clunk, a holographic chime per card, soft whooshes on cuts, a sparkle for the medallion's wink, a shimmer on
"now", a bell swell on the end card. No samples anywhere.

usage: "$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/score.py
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = "ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe"
SR = 48000
RNG = np.random.default_rng(11)


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 200) / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], btype="band", output="sos"), x, axis=0)


def db(x):
    return 10 ** (x / 20)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(buf, sig, t0, gain=1.0):
    k = int(round(t0 * SR))
    if k >= len(buf) or k + len(sig) <= 0:
        return
    if k < 0:
        sig = sig[-k:]; k = 0
    n = min(len(sig), len(buf) - k)
    buf[k:k + n] += sig[:n] * gain


def ir(rt60, dur, bright, seed, predelay=0.02):
    r = np.random.default_rng(seed)
    t = tt(dur)
    n = r.standard_normal((len(t), 2)) * np.exp(-6.9 * t / rt60)[:, None]
    dark = lp(n, 1800); brightp = lp(n, bright)
    mix = np.exp(-t / (rt60 * 0.25))[:, None]          # brighter early, darker tail
    out = brightp * mix + dark * (1 - mix)
    out = np.concatenate([np.zeros((int(predelay * SR), 2)), out])
    return out / np.sqrt((out ** 2).sum(axis=0, keepdims=True))


def mod_delay(x, base_ms, depth_ms, rate, phase=0.0):
    n = np.arange(len(x))
    d = (base_ms + depth_ms * np.sin(2 * np.pi * rate * n / SR + phase)) * SR / 1000.0
    return np.interp(n - d, n, x, left=0.0)


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


# --------------------------------------------------------------------------------------------- voices
def voices(cues, dur):
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=True)
    v = v.mean(axis=1)
    N = int(dur * SR) + SR
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    stems = {"G": np.zeros(N), "L": np.zeros(N)}
    for w in cues["voice"]:
        i0, i1 = int((w["start"] - 0.06) * SR), int((w["end"] + 0.12) * SR)
        m = np.zeros(N); m[max(0, i0):i1] = 1
        m = uniform_filter1d(m, int(0.012 * SR))
        stems[w["who"]] += v * m
    g, l = stems["G"], stems["L"]
    # Guardian: warmth, light chorus, faint air shimmer, clock-tower reverb
    gw = g + 0.30 * lp(g, 170)
    ch = 0.5 * (mod_delay(gw, 14.0, 1.6, 0.27) + mod_delay(gw, 19.5, 2.1, 0.19, 1.3))
    air = hp(mod_delay(gw, 9.0, 1.2, 0.41, 0.4), 4200)
    dryG = gw + db(-19) * ch + db(-27) * air
    tower = fftconvolve(np.stack([dryG, dryG], 1), ir(2.5, 3.2, 5200, 3, 0.032), axes=0)[:N]
    G2 = np.stack([dryG, dryG], 1) + db(-15.5) * tower
    # girl: dry with a small room
    room = fftconvolve(np.stack([l, l], 1), ir(0.38, 0.6, 7000, 5, 0.008), axes=0)[:N]
    L2 = np.stack([l, l], 1) * 1.0 + db(-19) * room
    out = G2 + L2
    return out, g, l


def limit(x, ceil=0.89, look=0.004, rel=0.06):
    a = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    la = int(look * SR)
    pk = maximum_filter1d(a, size=2 * la + 1)       # sliding max over the look-ahead window
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    # release smoothing: hold the minimum over the release window, then smooth it (vectorised)
    from scipy.ndimage import minimum_filter1d
    rl = int(rel * SR)
    held = minimum_filter1d(g, size=rl, origin=-(rl // 2) + 1)
    out = np.minimum(g, uniform_filter1d(held, size=max(3, rl // 2)))
    return x * (out[:, None] if x.ndim == 2 else out)


# --------------------------------------------------------------------------------------------- instruments
def pad_note(f, d, bright=1.0, seed=0):
    t = tt(d)
    r = np.random.default_rng(seed)
    s = np.zeros((len(t), 2))
    for k, det in enumerate((-5, 0, 6)):
        ff = f * 2 ** (det / 1200)
        ph = r.uniform(0, 2 * np.pi)
        w = np.zeros(len(t))
        for h in range(1, 9):
            w += np.sin(2 * np.pi * ff * h * t + ph * h) / h ** 1.35
        s[:, k % 2] += w * (0.9 if k == 1 else 0.6)
        s[:, (k + 1) % 2] += w * 0.3
    s = lp(s, 900 + 900 * bright)
    a = min(1.6, d * 0.4)
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / min(2.0, d * 0.45))
    return s * np.clip(e, 0, 1)[:, None]


def musicbox(f, vel=1.0, d=2.2):
    t = tt(d)
    w = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.35) + 0.08 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t / 0.12)
    w *= env_ad(len(t), 0.003, 0.75) * vel
    click = RNG.standard_normal(len(t)) * np.exp(-t / 0.0025) * 0.05
    s = w + hp(click, 3000)
    return np.stack([s, s], 1)


def bell(f, d=5.0):
    t = tt(d)
    parts = [(1.0, 1.0, 3.2), (2.76, 0.55, 1.6), (5.40, 0.30, 0.9), (8.93, 0.16, 0.5), (0.5, 0.35, 4.0)]
    w = sum(a * np.sin(2 * np.pi * f * p * t + p) * np.exp(-t / dd) for p, a, dd in parts)
    w *= np.minimum(1, t / 0.004)
    return np.stack([w, w * 0.96], 1)


def chime(f=1568.0, d=1.1):
    t = tt(d)
    w = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 1) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t + 2)) * env_ad(len(t), 0.004, 0.32)
    sweep = bp(RNG.standard_normal(len(t)), 2500, 9000) * np.exp(-((t - 0.09) / 0.06) ** 2) * 0.25
    s = w + sweep
    return np.stack([s * 0.9, s], 1)


def tick(kind):
    d = 0.09; t = tt(d)
    f = {"tick": 2100.0, "tock": 1550.0, "restart": 1800.0}.get(kind, 2000.0)
    click = bp(RNG.standard_normal(len(t)) * np.exp(-t / 0.0018), 2500, 9000)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.018) * 0.6 + np.sin(2 * np.pi * f * 0.52 * t) * np.exp(-t / 0.03) * 0.35
    s = click * 0.8 + body
    return np.stack([s, s], 1)


def clunk():
    d = 2.6; t = tt(d)
    thump = np.sin(2 * np.pi * (52 + 30 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.22)
    ring = sum(a * np.sin(2 * np.pi * 196 * p * t + p) * np.exp(-t / dd) for p, a, dd in [(1, 0.5, 0.75), (2.32, 0.35, 0.5), (4.25, 0.22, 0.3), (6.63, 0.12, 0.2)])
    click = hp(RNG.standard_normal(len(t)) * np.exp(-t / 0.004), 1500) * 0.6
    s = thump * 1.0 + ring * 0.55 + click
    return np.stack([s, s * 0.97], 1)


def whoosh(d=0.42):
    t = tt(d)
    n = RNG.standard_normal(len(t))
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    s = bp(n, 300, 2200) * e
    return np.stack([s, s[::-1] * 0.3 + s * 0.7], 1)


def shimmer(d=1.6, f0=880.0):
    t = tt(d)
    s = np.zeros(len(t))
    for k, m in enumerate((1.0, 1.5, 2.0, 3.0)):
        f = f0 * m * (1 + 0.5 * t / d)
        ph = 2 * np.pi * np.cumsum(f) / SR
        s += np.sin(ph + k) * (0.5 / (k + 1))
    s *= np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    return np.stack([s, np.roll(s, 240)], 1)


def sparkle():
    out = np.zeros((int(0.6 * SR), 2))
    for k, f in enumerate((2637.0, 3136.0, 3951.0)):
        add(out, musicbox(f, 0.5, 0.5), k * 0.06)
    return out


# --------------------------------------------------------------------------------------------- the score
CHORDS = [  # (bass midi, chord tones midi) — D major, warm
    (38, [62, 66, 69, 73, 76]),   # Dmaj9
    (35, [59, 62, 66, 69, 73]),   # Bm9
    (31, [59, 62, 66, 67, 71]),   # Gmaj9 (voiced high)
    (33, [57, 62, 64, 69, 71]),   # Asus
]


def music(cues, dur, vo_env):
    N = int(dur * SR) + SR
    pad = np.zeros((N, 2)); box = np.zeros((N, 2)); drone = np.zeros((N, 2))
    bpm = 68.0; beat = 60 / bpm; bar = 4 * beat; clen = 2 * bar
    stop, restart = cues["stop"] or 1e9, cues["restart"] or 1e9
    rule1 = cues.get("rule1") or stop + 1.2
    rehook = (cues.get("rehook") or [1e9])[0]
    # pads, chord by chord, until the stop
    t, k = 0.0, 0
    while t < min(stop, dur):
        bass, tones = CHORDS[k % 4]
        d = min(clen + 1.6, stop - t + 0.05)
        bright = 0.35 + 0.65 * min(1.0, t / max(1.0, stop))
        for j, m in enumerate(tones):
            add(pad, pad_note(mtof(m), d, bright, seed=k * 10 + j), t, 0.16)
        add(pad, pad_note(mtof(bass + 12), d, 0.2, seed=k + 99), t, 0.22)
        t += clen; k += 1
    # music box: sparse arpeggios, a little denser after the re-hook; silent under rule one
    pat = [0, 1.5, 3, 4.5, 6]                    # beats inside each 2-bar chord
    t, k = 2.0 * beat, 0
    while t < stop - 0.4:
        bass, tones = CHORDS[int(t // clen) % 4]
        dense = t > rehook
        for b in (pat if dense else pat[::2]):
            tn = t + b * beat
            if tn >= stop - 0.4:
                break
            note = tones[(k * 3 + int(b * 2)) % len(tones)] + 12 + (12 if (k + int(b)) % 5 == 0 else 0)
            add(box, musicbox(mtof(note), 0.55 + 0.25 * RNG.random()), tn, 0.12)
            k += 1
        t += clen
    # hard stop: everything before `stop` is faded in 60 ms, silence follows
    fade = np.ones(N); i0 = int(stop * SR); f = int(0.06 * SR)
    if i0 < N:
        fade[i0:i0 + f] = np.linspace(1, 0, min(f, N - i0)); fade[i0 + f:] = 0
    pad *= fade[:, None]; box *= fade[:, None]
    # rule one: a low warm drone fading in, rising toward "now"
    # the drone ends in a hush as the girl echoes "Now?", so the last "Now." stands nearly alone before the swell
    hush = max([w["start"] for w in cues["voice"] if w["who"] == "L" and w["start"] < restart] + [restart - 1.0]) + 0.35
    if rule1 < dur:
        d = max(0.5, hush - rule1 + 0.5)
        tdr = tt(d)
        dr = (np.sin(2 * np.pi * mtof(38) * tdr) + 0.5 * np.sin(2 * np.pi * mtof(45) * tdr + 1) + 0.25 * np.sin(2 * np.pi * mtof(50) * tdr + 2))
        dr *= np.minimum(1, tdr / 2.5) * (0.6 + 0.4 * tdr / d) * np.clip((d - tdr) / 0.9, 0, 1)
        add(drone, np.stack([dr, dr], 1), rule1 - 0.15, 0.09)
        add(drone, pad_note(mtof(62), d, 0.25, 7) + pad_note(mtof(69), d, 0.25, 8), rule1 + 1.0, 0.07)
    # the warm swell on the last "Now." and to the end
    if restart < dur:
        d = dur - restart + 0.5
        for j, m in enumerate([50, 57, 62, 66, 69, 74, 76]):
            add(pad, pad_note(mtof(m), d, 0.8, 50 + j), restart + 0.15, 0.14)
        for j, m in enumerate([74, 78, 81, 86]):
            add(box, musicbox(mtof(m), 0.7), restart + 0.25 + j * 0.42, 0.13)
    hall = ir(2.8, 3.5, 6000, 9, 0.025)
    wet = fftconvolve(box, hall, axes=0)[:N] * 0.5 + fftconvolve(pad, hall, axes=0)[:N] * 0.25
    return pad + box * 0.9 + drone + wet


def effects(cues, dur):
    N = int(dur * SR) + SR
    fx = np.zeros((N, 2))
    stop = cues["stop"] or 1e9
    tk = cues["ticks"]
    for x in tk:
        g = db(-28) if x["kind"] != "clunk" else 0.0
        if x["kind"] == "restart":
            g = db(-20)
        if x["t"] > stop and x["kind"] not in ("restart",) and x["t"] < (cues["restart"] or 0):
            continue
        if x["kind"] == "clunk":
            add(fx, clunk(), x["t"], db(-9))
        else:
            add(fx, tick(x["kind"]), x["t"], g)
    # mechanism whirr while the hands blur (the last ~10 s before the stop)
    blur_from = None
    rules = [c for c in cues["cards"]]
    if len(rules) >= 3:
        blur_from = sorted(rules)[-3]
    if blur_from and blur_from < stop:
        d = stop - blur_from; t = tt(d)
        n = RNG.standard_normal(len(t))
        w = bp(n, 240, 1100) * (0.4 + 0.6 * (t / d)) * np.minimum(1, t / 2.0)
        w *= 0.7 + 0.3 * np.sin(2 * np.pi * (4 + 6 * t / d) * t)
        add(fx, np.stack([w, w * 0.9], 1), blur_from, db(-37))
    for c in cues["cards"]:
        add(fx, chime(1568.0 if int(c * 10) % 2 else 1760.0), c, db(-21))
    for c in cues["cuts"]:
        add(fx, whoosh(), c - 0.2, db(-33))
    if cues.get("counter_in"):
        add(fx, chime(2093.0, 0.8), cues["counter_in"], db(-24))
    if cues.get("wink"):
        add(fx, sparkle(), cues["wink"], db(-20))
    if cues.get("now"):
        add(fx, shimmer(1.8, 660.0), cues["now"] - 0.2, db(-19))
    if cues.get("restart"):
        add(fx, shimmer(2.2, 880.0), cues["restart"] + 0.5, db(-24))
    if cues.get("endcard"):
        sw = shimmer(1.0, 440.0)[::-1]
        add(fx, sw, cues["endcard"] - 1.0, db(-22))
        add(fx, bell(587.33), cues["endcard"], db(-14))
        add(fx, bell(880.0, 4.0), cues["endcard"] + 0.02, db(-22))
    hall = ir(1.6, 2.2, 7000, 13, 0.015)
    return fx + 0.35 * fftconvolve(fx, hall, axes=0)[:N]


def loudnorm(src, dst, I=-14.0, TP=-1.5):
    r = subprocess.run([FF, "-hide_banner", "-i", src, "-af", f"loudnorm=I={I}:TP={TP}:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    js = r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1]
    m = json.loads(js)
    af = (f"loudnorm=I={I}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
    r2 = subprocess.run([FF, "-hide_banner", "-y", "-i", src, "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", dst], capture_output=True, text=True, encoding="utf-8", errors="replace")
    js2 = r2.stderr[r2.stderr.rindex("{"): r2.stderr.rindex("}") + 1]
    return json.loads(js2)


def measure(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    import re
    I = float(re.search(r"I:\s+(-?[0-9.]+) LUFS", tail).group(1))
    tp = float(re.search(r"Peak:\s+(-?[0-9.]+) dBFS", tail).group(1))
    return I, tp


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    cues = json.load(open(os.path.join(ROOT, "score", "data", "cues.json")))
    dur = cues["dur"]
    N = int(dur * SR) + SR
    voice, g, l = voices(cues, dur)
    venv = np.abs(g + l)
    mus = music(cues, dur, venv)[:N]
    fx = effects(cues, dur)[:N]
    # levels: the bed sits ~18 dB under the voice while he/she speaks (a gentle duck), louder in the gaps and the end
    sp = np.zeros(N)
    for w in cues["voice"]:
        sp[int(w["start"] * SR): int(w["end"] * SR)] = 1
    sm = uniform_filter1d(sp, int(0.25 * SR))
    duck = 1.0 - 0.38 * sm
    vrms = np.sqrt((voice[sp > 0] ** 2).mean())
    mrms = np.sqrt((mus[sp > 0] ** 2).mean()) + 1e-9
    mus *= (vrms * db(-19.5)) / mrms
    bed = mus * duck[:, None] + fx * (vrms / (np.abs(fx).max() + 1e-9)) * 2.2
    voice = limit(voice / (np.abs(voice).max() + 1e-9) * 0.8, 0.8)
    # re-measure after the limiter so the margin is honest
    vr = np.sqrt((voice[sp > 0] ** 2).mean()); br = np.sqrt((bed[sp > 0] ** 2).mean()) + 1e-12
    mix = voice + bed
    end = int((dur) * SR)
    mix = mix[:end]
    f = int(0.25 * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]
    mix[: int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))[:, None]
    os.makedirs(os.path.join(ROOT, "score", "audio"), exist_ok=True)
    sf.write(os.path.join(ROOT, "score", "audio", "voice.wav"), voice[:end].astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(ROOT, "score", "audio", "bed.wav"), bed[:end].astype(np.float32), SR, subtype="FLOAT")
    pre = os.path.join(ROOT, "score", "audio", "mix_pre.wav")
    sf.write(pre, (mix / max(1.0, np.abs(mix).max() / 0.95)).astype(np.float32), SR, subtype="FLOAT")
    final = os.path.join(ROOT, "score", "audio", "final.wav")
    ln = loudnorm(pre, final)
    I, tp = measure(final)
    lv = {"integrated_lufs": I, "true_peak_dbtp": tp, "voice_over_bed_db_while_speaking": round(20 * math.log10(vr / br), 2),
          "loudnorm": {k: ln.get(k) for k in ("output_i", "output_tp", "output_lra", "normalization_type")}}
    json.dump(lv, open(os.path.join(ROOT, "score", "data", "levels.json"), "w"), indent=1)
    print(json.dumps(lv, indent=1))


if __name__ == "__main__":
    main()
