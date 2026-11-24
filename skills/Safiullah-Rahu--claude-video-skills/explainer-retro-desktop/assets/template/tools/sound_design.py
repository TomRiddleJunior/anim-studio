"""Sound for the retro-desktop reel, fully synthesized (no samples, no licences):

  - the voice (vo/audio/vo.wav, Kokoro) dry with a gentle presence lift;
  - retro-computer SFX on every visible action, from score/cues.json (written by tools/dump_cues.mjs from film.js):
    clicks, key taps, window "bloops", menu ticks, drag whooshes, drop thuds, hard-disk chatter, scramble bleeps, an
    original two-note error tone, success chimes, stamps, a GPU fan, a power-down sweep (the source: voice + ~140 SFX);
  - FULL mix only: a soft original chiptune bed (pulse-wave Rhodes-ish chords, a triangle bass and a quiet arpeggio at
    100 BPM, lo-fi kick/hat) ~24 dB under the voice, ducked 3 dB while she speaks, dropping out on the callouts
    (SIMPLE / PROBLEM / BUT WAIT / RECAP) and swelling on the outro. The source has no music bed; this is the variation.

Outputs: score/final.wav + assets/audio/final.m4a (full), score/nomusic.wav + score/nomusic.m4a (voice + SFX),
score/levels.json. Both mixes: two-pass loudnorm to -14 LUFS, true peak <= -1.5 dBTP (mix to -2: AAC adds ~0.5 dB).

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
SR = 48000
RNG = np.random.default_rng(42)
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
CJ = json.load(open(os.path.join(ROOT, "score", "cues.json"), encoding="utf-8"))
CUES, MUSIC = CJ["cues"], CJ.get("music")
DUR = VO["duration"]
N = int(round(DUR * SR))


def flt(x, kind, f, o=2):
    f = np.atleast_1d(f) / (SR / 2)
    return sosfilt(butter(o, f if len(f) > 1 else f[0], btype=kind, output="sos"), x, axis=0)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.003, k=20.0):
    t = tt(d)
    e = np.exp(-t * k)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def place(bus, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(bus) or i + len(x) <= 0:
        return
    j0 = max(0, -i)
    seg = x[j0: max(0, min(len(x), len(bus) - i))]
    bus[i + j0: i + j0 + len(seg)] += seg * g


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def pulse(f, d, duty=0.25):
    ph = np.cumsum(np.full(int(d * SR), f) / SR) % 1.0 if np.isscalar(f) else np.cumsum(f / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def tri(f, d):
    ph = np.cumsum(np.full(int(d * SR), f) / SR) % 1.0 if np.isscalar(f) else np.cumsum(f / SR) % 1.0
    return 4 * np.abs(ph - 0.5) - 1


def sine_sweep(f0, f1, d):
    f = np.geomspace(f0, f1, int(d * SR))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ------------------------------------------------------------------ SFX
def s_click(g=1.0):
    x = flt(RNG.standard_normal(int(0.012 * SR)), "band", [2500, 7000]) * env(0.012, 0.0005, 400)
    y = flt(RNG.standard_normal(int(0.010 * SR)), "band", [1800, 5000]) * env(0.010, 0.0005, 450) * 0.6
    o = np.zeros(int(0.09 * SR)); o[:len(x)] += x; o[int(0.055 * SR):int(0.055 * SR) + len(y)] += y
    return o * 0.9 * g


def s_key():
    f = 1 + RNG.uniform(-0.15, 0.15)
    x = flt(RNG.standard_normal(int(0.03 * SR)), "band", [1800 * f, 6000 * f]) * env(0.03, 0.0008, 160)
    th = np.sin(2 * np.pi * 160 * f * tt(0.03)) * env(0.03, 0.001, 120) * 0.5
    return (x + th) * 0.7


def s_open(g=1.0):
    d = 0.11
    x = pulse(np.geomspace(520, 1040, int(d * SR)), d, 0.3) * env(d, 0.002, 18)
    return flt(x, "low", 3200) * 0.35 * g


def s_close(g=1.0):
    d = 0.1
    x = pulse(np.geomspace(900, 420, int(d * SR)), d, 0.3) * env(d, 0.002, 20)
    return flt(x, "low", 3000) * 0.3 * g


def s_whoosh(d=0.45, g=1.0, up=True):
    n = int(d * SR)
    x = RNG.standard_normal(n)
    f = np.geomspace(500, 3500, n) if up else np.geomspace(3500, 400, n)
    out = np.zeros(n)
    blk = 512
    for i in range(0, n, blk):
        seg = x[i:i + blk]
        out[i:i + blk] = flt(seg, "band", [f[i] * 0.7, min(f[i] * 1.4, 20000)], 1)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return out * e * 0.45 * g


def s_thud(g=1.0):
    d = 0.22
    x = np.sin(2 * np.pi * np.cumsum(np.geomspace(140, 55, int(d * SR))) / SR) * env(d, 0.002, 16)
    c = flt(RNG.standard_normal(int(0.02 * SR)), "low", 1800) * env(0.02, 0.0005, 200) * 0.4
    x[:len(c)] += c
    return x * 0.8 * g


def s_pop(g=1.0):
    d = 0.09
    return np.sin(2 * np.pi * np.cumsum(np.geomspace(1100, 520, int(d * SR))) / SR) * env(d, 0.001, 30) * 0.55 * g


def s_chime(g=1.0, notes=(1046.5, 1318.5)):
    out = np.zeros(int(0.55 * SR))
    for k, f in enumerate(notes):
        d = 0.45
        x = (np.sin(2 * np.pi * f * tt(d)) + 0.25 * np.sin(2 * np.pi * 2 * f * tt(d))) * env(d, 0.002, 7)
        place(out, x, 0.075 * k)
    return out * 0.28 * g


def s_error(g=1.0):
    out = np.zeros(int(0.42 * SR))
    for k, f in enumerate((659.3, 493.9)):
        d = 0.16
        x = flt(pulse(f, d, 0.5), "low", 2600) * env(d, 0.002, 9)
        place(out, x, 0.14 * k)
    return out * 0.3 * g


def s_stamp(g=1.0):
    th = s_thud(0.9)
    sl = flt(RNG.standard_normal(int(0.06 * SR)), "band", [700, 4000]) * env(0.06, 0.0008, 60) * 0.5
    th[:len(sl)] += sl
    return th * g


def s_disk(d=0.8, g=1.0):
    out = np.zeros(int(d * SR) + 2000)
    t = 0.0
    while t < d:
        place(out, flt(RNG.standard_normal(int(0.006 * SR)), "band", [900, 4500]) * env(0.006, 0.0003, 600), t, RNG.uniform(0.3, 1.0))
        t += RNG.uniform(0.018, 0.07)
    hum = np.sin(2 * np.pi * 120 * tt(d)) * 0.05
    out[:len(hum)] += hum
    return out * 0.6 * g


def s_scramble(d=0.6, g=1.0):
    out = np.zeros(int(d * SR) + 2000)
    t = 0.0
    while t < d:
        f = RNG.choice([880, 1175, 1568, 1760, 2093, 2637])
        place(out, pulse(f, 0.03, 0.5) * env(0.03, 0.001, 60), t, 0.4)
        t += 0.032
    return flt(out, "low", 5000) * 0.3 * g


def s_alarm(g=1.0):
    d = 0.5
    f = np.where((tt(d) * 8) % 1 < 0.5, 880, 698)
    return flt(pulse(f, d, 0.5), "low", 2500) * env(d, 0.005, 3) * 0.16 * g


def s_unlock(g=1.0):
    c = s_click(1.2)
    b = s_pop(0.8)
    out = np.zeros(int(0.2 * SR)); place(out, c, 0); place(out, sine_sweep(600, 1400, 0.08) * env(0.08, 0.001, 30) * 0.35, 0.05)
    return out * g


def s_fan(d=3.6, g=1.0):
    n = int(d * SR)
    x = flt(RNG.standard_normal(n), "band", [300, 2400], 2)
    ramp = np.clip(np.linspace(0, 1.6, n), 0, 1) ** 1.5 * np.clip(np.linspace(6, 0, n), 0, 1)
    whine = np.sin(2 * np.pi * np.cumsum(np.linspace(300, 900, n)) / SR) * 0.15
    return (x * 0.35 + whine) * ramp * 0.5 * g


def s_riser(d=1.0, g=1.0):
    n = int(d * SR)
    return sine_sweep(300, 1500, d) * np.linspace(0, 1, n) ** 2 * 0.18 * g


def s_down(g=1.0):
    d = 0.6
    return flt(pulse(np.geomspace(900, 160, int(d * SR)), d, 0.4), "low", 2400) * env(d, 0.003, 4) * 0.25 * g


def s_gear(d=1.2, g=1.0):
    out = np.zeros(int(d * SR) + 2000)
    for k in range(int(d / 0.07)):
        place(out, s_click(0.5)[:int(0.02 * SR)], k * 0.07)
    return out * g


def s_noise(d=1.9, g=1.0):
    x = flt(RNG.standard_normal(int(d * SR)), "band", [1500, 9000]) * 0.06
    crack = np.zeros_like(x)
    for _ in range(int(d * 25)):
        i = RNG.integers(0, len(x) - 300)
        crack[i:i + 200] += RNG.standard_normal(200) * 0.25 * np.exp(-np.arange(200) / 40)
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 0.5
    return (x + flt(crack, "high", 1200)) * e * g


def s_page(g=1.0):
    x = flt(RNG.standard_normal(int(0.12 * SR)), "band", [800, 5000]) * np.sin(np.pi * np.linspace(0, 1, int(0.12 * SR))) * 0.2
    return x * g


def s_slide(g=1.0):
    out = np.zeros(int(0.7 * SR))
    for k in range(7):
        place(out, pulse(700 + k * 90, 0.025, 0.5) * env(0.025, 0.001, 80) * 0.25, k * 0.08)
    return flt(out, "low", 4000) * g


def s_mail(g=1.0):
    return s_chime(g * 0.9, notes=(783.99, 1174.66))


def s_zoom(d=1.2, g=1.0):
    w = s_whoosh(d, 1.2, False)
    sub = np.sin(2 * np.pi * np.cumsum(np.geomspace(90, 45, len(w))) / SR) * np.sin(np.pi * np.linspace(0, 1, len(w))) * 0.35
    return (w + sub) * g


def sfx_for(c):
    k, g, d = c["kind"], c.get("gain", 1.0), c.get("dur", None)
    return {
        "click": lambda: s_click(g), "key": lambda: s_key() * g, "open": lambda: s_open(g), "close": lambda: s_close(g),
        "menu": lambda: s_click(0.6 * g), "swoosh": lambda: s_whoosh(0.4, g * 0.8), "whoosh": lambda: s_whoosh(max(0.3, d or 0.45), g * 0.7),
        "grab": lambda: s_pop(0.6 * g), "drop": lambda: s_thud(g), "send": lambda: s_whoosh(0.35, g * 0.6),
        "ok": lambda: s_chime(g), "row": lambda: s_click(0.7 * g), "pop": lambda: s_pop(g), "alarm": lambda: s_alarm(g),
        "disk": lambda: s_disk(d or 0.8, g), "unlock": lambda: s_unlock(g), "tick": lambda: s_click(0.8 * g),
        "error": lambda: s_error(g), "stamp": lambda: s_stamp(g), "noise": lambda: s_noise(d or 1.9, g),
        "riser": lambda: s_riser(d or 1.0, g), "fan": lambda: s_fan(d or 3.6, g), "page": lambda: s_page(g),
        "gear": lambda: s_gear(d or 1.2, g), "slide": lambda: s_slide(g), "down": lambda: s_down(g), "mail": lambda: s_mail(g),
        "scramble": lambda: s_scramble(d or 0.6, g), "zoomout": lambda: s_zoom(d or 1.2, g),
    }[k]()


# ------------------------------------------------------------------ music bed (full mix only)
BPM = 100.0
BEAT = 60.0 / BPM
CHORDS = [  # Cmaj7, Am7, Fmaj7, G6 (MIDI)
    [48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 52, 59]]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def music(callouts, outro_t):
    out = np.zeros((N, 2))
    bar = 4 * BEAT
    nbars = int(DUR / bar) + 2
    for b in range(nbars):
        t0 = b * bar
        ch = CHORDS[b % 4]
        # pad: soft pulse chord, lowpassed, slow attack
        d = bar
        n = int(d * SR)
        if t0 * SR >= N:
            break
        pad = np.zeros(n)
        for m in ch[1:]:
            pad += pulse(midi(m + 12) * (1 + 0.002 * np.sin(np.arange(n) / SR * 3)), d, 0.4) * 0.22
        a = np.minimum(1, np.arange(n) / (0.25 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.2 * SR))
        pad = flt(pad * a, "low", 1300)
        bass = tri(midi(ch[0]), d) * 0.55 * np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
        seg = np.stack([pad * 0.9 + bass, pad + bass], axis=1)
        i0 = int(t0 * SR)
        seg = seg[: max(0, N - i0)]
        out[i0:i0 + len(seg)] += seg
        # arpeggio 8ths
        for k in range(8):
            tk = t0 + k * BEAT / 2
            m = ch[[1, 2, 3, 2, 1, 3, 2, 3][k]] + 24
            x = flt(pulse(midi(m), 0.16, 0.125), "low", 3000) * env(0.16, 0.002, 18) * 0.12
            place(out[:, 0 if k % 2 else 1], x, tk)
        # lo-fi kick + hat
        for k in range(4):
            tk = t0 + k * BEAT
            if k in (0, 2):
                place(out[:, 0], s_thud(0.35)[: int(0.18 * SR)], tk); place(out[:, 1], s_thud(0.35)[: int(0.18 * SR)], tk)
            h = flt(RNG.standard_normal(int(0.04 * SR)), "high", 7000) * env(0.04, 0.0005, 90) * 0.06
            place(out[:, 0], h, tk + BEAT / 2); place(out[:, 1], h, tk + BEAT / 2)
    # energy curve: soft intro, drop-outs on the callouts, swell on the outro
    g = np.full(N, 0.85)
    tm = np.arange(N) / SR
    g *= np.clip(0.55 + tm / 12, 0.55, 1.0)
    for a, b in callouts:
        k = np.clip(np.minimum((tm - a) / 0.08, (b - tm) / 0.25), 0, 1)
        g *= 1 - 0.85 * k
    g *= np.where(tm > outro_t, 1 + 0.5 * np.clip((tm - outro_t) / 1.5, 0, 1), 1)
    fade = int(1.2 * SR)
    g[-fade:] *= np.linspace(1, 0, fade)
    return out * g[:, None]


def loudnorm_to(mix, path_wav, path_m4a):
    raw = path_wav.replace(".wav", "_raw.wav")
    sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")

    def meas(p, extra=""):
        r = subprocess.run([FF, "-hide_banner", "-i", p, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json" + extra, "-f", "null", "-"],
                           capture_output=True, text=True, encoding="utf-8", errors="replace")
        return json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    m0 = meas(raw)
    mix = mix * 10 ** ((-14.0 - float(m0["input_i"])) / 20)
    ceil = 10 ** (-3.0 / 20)
    gl = np.minimum(1.0, ceil / np.maximum(np.abs(mix).max(axis=1), 1e-9))
    gl = uniform_filter1d(minimum_filter1d(gl, size=int(0.03 * SR)), size=int(0.01 * SR))
    sf.write(raw, (mix * gl[:, None]).astype(np.float32), SR, subtype="FLOAT")
    m = meas(raw)
    af = (f"loudnorm=I=-14:TP=-2:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
    r2 = subprocess.run([FF, "-y", "-hide_banner", "-i", raw, "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", path_wav],
                        capture_output=True, text=True, encoding="utf-8", errors="replace")
    m2 = json.loads(r2.stderr[r2.stderr.rindex("{"): r2.stderr.rindex("}") + 1])
    # pad/trim to the exact film length so the video and audio streams match
    a, _ = sf.read(path_wav, always_2d=True)
    a = np.pad(a, ((0, max(0, N - len(a))), (0, 0)))[:N]
    sf.write(path_wav, a, SR, subtype="PCM_24")
    subprocess.run([FF, "-y", "-v", "error", "-i", path_wav, "-c:a", "aac", "-b:a", "256k", path_m4a], check=True)
    os.remove(raw)
    return {"lufs": float(m2["output_i"]), "tp": float(m2["output_tp"]), "type": m2["normalization_type"], "limiter_gr_db": round(float(-20 * np.log10(gl.min())), 1)}


def main():
    v, sr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
    assert sr == SR
    if v.ndim > 1:
        v = v.mean(axis=1)
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    v = flt(v, "high", 80) + 0.25 * flt(v, "band", [2500, 5000])  # a little presence
    # gentle 3:1 compression above -16 dB (10 ms RMS) so the final limiter only trims rare peaks
    e = np.sqrt(uniform_filter1d(v ** 2, size=480) + 1e-12)
    edb = 20 * np.log10(e / (np.abs(v).max() + 1e-9))
    gr = np.maximum(0, edb + 16) * (1 - 1 / 3)
    gr = uniform_filter1d(np.maximum.accumulate(np.zeros(1)) if False else minimum_filter1d(-gr, size=240) * -1, size=960)
    v = v * 10 ** (-gr / 20)
    speech = np.zeros(N, bool)
    for l in VO["lines"]:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    sfx = np.zeros(N)
    for c in CUES:
        place(sfx, sfx_for(c), c["t"])
    vdb = rms_db(v[speech])
    act = np.abs(sfx) > 1e-4
    g_s = 10 ** ((vdb - 13.0 - rms_db(sfx[act])) / 20) if act.any() else 0
    g_s = min(g_s, 0.55 * np.abs(v).max() / (np.abs(sfx).max() + 1e-9))  # transients stay under the voice peaks
    sfx *= g_s
    T = {l["id"]: l for l in VO["lines"]}
    if MUSIC:  # exported by film.js: the bed cuts out under the centre-stage callouts and swells on the outro
        callouts, swell = [tuple(x) for x in MUSIC.get("cut", [])], MUSIC.get("swell", DUR)
    else:      # the sample's own line ids
        callouts = [(T[a]["start"] - 0.25, T[b]["end"] + 0.1) for a, b in [("l18", "l19"), ("l19", "l20"), ("l38", "l38"), ("l45", "l45")] if a in T and b in T]
        swell = T["l51"]["start"] - 0.1 if "l51" in T else DUR
    bed = music(callouts, swell)
    bed_db = rms_db(bed.mean(axis=1)[speech])
    g_b = 10 ** ((vdb - 24.0 - bed_db) / 20)
    a_r = np.exp(-1 / (0.3 * SR))
    from scipy.signal import lfilter
    actv = lfilter([1 - a_r], [1, -a_r], speech.astype(float))
    duck = 1 - (1 - 10 ** (-3 / 20)) * np.clip(actv * 1.4, 0, 1)
    bed = bed * g_b * duck[:, None]
    vs = np.stack([v, v], axis=1)
    ss = np.stack([sfx, sfx], axis=1)
    full = vs + ss + bed
    nomus = vs + ss
    out = os.path.join(ROOT, "score")
    os.makedirs(out, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "assets", "audio"), exist_ok=True)
    lv = {"voice_db": round(vdb, 1), "sfx_under_voice_db": round(vdb - rms_db(sfx[act]), 1),
          "bed_under_voice_db": round(vdb - rms_db(bed.mean(axis=1)[speech]), 1),
          "voice_over_bed_plus_sfx_db": round(vdb - rms_db((bed.mean(axis=1) + sfx)[speech]), 1), "bpm": BPM}
    lv["full"] = loudnorm_to(full, os.path.join(out, "final.wav"), os.path.join(ROOT, "assets", "audio", "final.m4a"))
    lv["nomusic"] = loudnorm_to(nomus, os.path.join(out, "nomusic.wav"), os.path.join(out, "nomusic.m4a"))
    json.dump(lv, open(os.path.join(out, "levels.json"), "w"), indent=1)
    print(json.dumps(lv, indent=1))


if __name__ == "__main__":
    main()
