"""Sound design for "Level −4" (no music, no melody): everything synthesized with numpy, 48 kHz stereo, keyed to the
same narration words as the picture (tools/shots_table.word_t).

Layers (levels are set relative to the voice RMS while speaking; the bed stays >= 10 dB under the voice):
  room tone      ventilation rumble + air hiss + mains hum                                  -31 dB
  tube buzz      120 Hz + harmonics, crackle; follows the share of rows still white          -34 dB
  footsteps      concrete steps in the walking shots, garage reverb                          per step
  shutter        fall rattle + slam (thump + inharmonic clang + rattle) + 3 s tail; rise motor later
  phone / lift / clock   low-battery chirp, dead call-button click, midnight double beep
  row switches   relay clunk + flicker ticks + sub thump per row, louder as the red gets nearer
  red drone      beating 41/41.6 Hz + 55 Hz + low noise breath, creeping up from the first red
  wet drag       slow viscous pulls (band noise, irregular), approaching; cuts dead on "stops"
  heartbeat      from "Slow." to the reveal
  reveal         lamp drop-out zap, 0.2 s of near silence, low sting
  breathing      slow heavy breaths behind the hero from the reveal to the end
  drip           one close wet plip on "drips"
  final hit      a low hit under "do?" and a ring-out

usage: python -I tools/garage_bed.py     (writes score/audio/bed.wav, score/audio/vo.wav (limited), score/data/*.json,
                                         score/sound.json; then run the engine's sound.py score)
"""
import json
import os
import shutil
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shots_table as ST  # noqa: E402

ROOT = ST.ROOT
SR = 48000
DUR = ST.DUR
N = int((DUR + 0.3) * SR)
T = np.arange(N) / SR
rg = np.random.default_rng(404)
w = ST.word_t


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x, axis=0)


def lp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x, axis=0)


def rms(x):
    return float(np.sqrt(np.mean(np.square(x)) + 1e-20))


def ss(a, b, x):
    u = np.clip((x - a) / max(1e-6, b - a), 0, 1)
    return u * u * (3 - 2 * u)


def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]; i = 0
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    if x.ndim == 1:
        bus[i:i + len(x), 0] += x * gain * l * 1.414
        bus[i:i + len(x), 1] += x * gain * r * 1.414
    else:
        bus[i:i + len(x)] += x * gain


def garage_ir(rt60=2.6, dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = rg.standard_normal((n, 2)) * np.exp(-6.9 * t / rt60)[:, None]
    ir = lp(ir, 5200, 1)
    for d, g in ((0.011, 0.6), (0.023, 0.45), (0.037, 0.35), (0.052, 0.3)):  # early reflections off slab/columns
        k = int(d * SR); ir[k, 0] += g; ir[k + 37, 1] += g * 0.9
    ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR = garage_ir()


def verb(x, wet=0.35):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    y = np.stack([fftconvolve(x[:, 0], IR[:, 0])[: len(x)], fftconvolve(x[:, 1], IR[:, 1])[: len(x)]], 1)
    return x * (1 - wet) + y * wet * 0.5


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


# ---------------------------------------------------------------- one-shots
def step(heavy=1.0):
    n = int(0.22 * SR); t = np.arange(n) / SR
    heel = lp(rg.standard_normal(n), 900) * np.exp(-t / 0.018) * 1.0
    scuff = bp(rg.standard_normal(n), 1500, 5000) * np.exp(-((t - 0.035) / 0.03) ** 2) * 0.25
    thump = np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.03) * 0.6
    return (heel + scuff + thump) * heavy


def slam():
    n = int(1.6 * SR); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (52 + 30 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.22) * 1.2
    clang = sum(a * np.sin(2 * np.pi * f * t + rg.uniform(0, 6)) * np.exp(-t / d) for f, a, d in
                ((183, 0.5, 0.5), (412, 0.4, 0.42), (767, 0.32, 0.3), (1253, 0.22, 0.22), (1890, 0.14, 0.16), (2710, 0.1, 0.1)))
    crack = hp(rg.standard_normal(n), 1800) * np.exp(-t / 0.012) * 0.9
    rattle = bp(rg.standard_normal(n), 600, 4000) * (np.exp(-t / 0.35) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 23 * t)))) * 0.25
    return np.tanh((thump + clang + crack + rattle) * 1.3)


def fall_rattle(dur=0.26):
    n = int(dur * SR); t = np.arange(n) / SR
    clicks = (np.sin(2 * np.pi * (14 + 60 * t / dur) * t) > 0.6).astype(float)
    return bp(rg.standard_normal(n), 400, 3500) * clicks * ss(0, dur * 0.3, t) * 0.6


def clunk(gain=1.0):
    n = int(0.9 * SR); t = np.arange(n) / SR
    relay = hp(rg.standard_normal(n), 1200) * np.exp(-t / 0.006) * 0.8
    body = np.sin(2 * np.pi * (70 + 40 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.12) * 1.0
    hum = np.sin(2 * np.pi * 50 * t) * np.exp(-t / 0.4) * 0.25
    out = relay + body + hum
    for k in (0.04, 0.12, 0.2, 0.28):  # flicker ticks of the dying tubes
        i = int(k * SR); m = int(0.012 * SR)
        out[i:i + m] += hp(rg.standard_normal(m), 2500) * 0.35 * np.exp(-np.arange(m) / SR / 0.004)
    return out * gain


def beep(f=2400, dur=0.07):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * ss(0, 0.005, t) * (1 - ss(dur - 0.01, dur, t)) * 0.5


def click():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (hp(rg.standard_normal(n), 2000) * np.exp(-t / 0.003) + np.sin(2 * np.pi * 1600 * t) * np.exp(-t / 0.006) * 0.4) * 0.6


def plip():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 1500 * np.exp(-t / 0.035) + 380
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) + lp(rg.standard_normal(n), 2500) * np.exp(-t / 0.01) * 0.3) * 0.8


def sting():
    n = int(3.0 * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (46 - 10 * (1 - np.exp(-t / 0.6))) * t) * np.exp(-t / 1.0)
    clus = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((233.1, 0.3), (246.9, 0.3), (349.2, 0.18), (370.0, 0.18))) * np.exp(-t / 0.9) * ss(0, 0.03, t)
    air = bp(rg.standard_normal(n), 2000, 7000) * np.exp(-t / 0.5) * 0.12
    return np.tanh((sub * 1.4 + clus + air) * 1.2)


def breath(inhale=True, dur=1.3):
    n = int(dur * SR); t = np.arange(n) / SR
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** (1.5 if inhale else 0.8)
    x = bp(rg.standard_normal(n), 300 if inhale else 180, 2600 if inhale else 1600) * shape
    rasp = bp(rg.standard_normal(n), 90, 300) * shape * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t)) * 0.5
    return x + rasp


def heartbeat():
    n = int(0.6 * SR); t = np.arange(n) / SR
    lub = np.sin(2 * np.pi * 52 * t) * np.exp(-t / 0.06)
    dub = np.sin(2 * np.pi * 64 * (t - 0.24)) * np.exp(-np.clip(t - 0.24, 0, None) / 0.05) * (t > 0.24) * 0.7
    return np.tanh((lub + dub) * 2.2)


def main():
    out = {}
    # ---- room tone
    brown = np.cumsum(rg.standard_normal((N, 2)), 0); brown -= lp(brown, 6, 1)
    rumble = bp(brown, 25, 180); rumble /= rms(rumble)
    air = bp(rg.standard_normal((N, 2)), 400, 4500); air /= rms(air)
    mains = sum(a * np.sin(2 * np.pi * f * T) for f, a in ((50, 1.0), (100, 0.6), (150, 0.25)))[:, None]
    fan = (np.sin(2 * np.pi * 87 * T + 0.6 * np.sin(2 * np.pi * 0.13 * T)) * 0.6)[:, None]
    room = rumble + 0.25 * air + 0.18 * mains / rms(mains) + 0.15 * fan / rms(fan)
    room /= rms(room)
    out["room"] = room

    # ---- story cues: [line, word, k, "end"?]; vo/script.json "sound_cues" overrides these sample defaults.
    #      Lists of cues: "steps" = [[from-cue, to-cue, weight], ...], "rows" = {row: cue} (white -> red switches).
    CUES = {
        "rows": {"12": ["l16", "red"], "11": ["l17", "row"], "10": ["l17", "next", 1], "9": ["l17", "one"], "8": ["l17", "time"],
                 "7": ["l17", "coming"], "6": ["l17", "you", 0, "end"], "5": ["l19", "slow", 1], "4": ["l21", "row"]},
        "steps": [[["l02", "you"], ["l02", "and"], 0.9], [["l02", "and"], ["l02", "four"], 1.1], [["l14", "it's"], ["l15", "but"], 0.8]],
        "slam": ["l02", "slams"], "phone": ["l05", "two"], "button": ["l07", "locked"], "midnight": ["l15", "midnight"],
        "rise": ["l24", "starts"], "drag_from": ["l18", "it"], "drag_stop": ["l22", "stops"], "heart_from": ["l19", "slow"],
        "reveal": ["l22", "right"], "drip": ["l23", "drips"], "final": ["l28", "do"],
    }
    CUES.update(json.load(open(os.path.join(ROOT, "vo", "script.json"), encoding="utf-8")).get("sound_cues", {}))

    def cue(c):
        if c is None:
            return None
        try:
            return w(c[0], c[1], c[2] if len(c) > 2 else 0, end=len(c) > 3 and c[3] == "end")
        except (KeyError, IndexError):
            return None

    SW = {int(k): cue(v) for k, v in CUES.get("rows", {}).items()}
    SW = {k: v for k, v in SW.items() if v is not None}
    white_share = np.ones(N)
    for i_, t0 in SW.items():
        white_share -= (T >= t0) / 13.0
    # ---- tube buzz
    buzz = sum(a * np.sin(2 * np.pi * f * T + rg.uniform(0, 6)) for f, a in ((120, 1.0), (240, 0.5), (360, 0.3), (480, 0.18), (720, 0.1)))
    crackle = hp(rg.standard_normal(N), 3000) * (rg.random(N) < 0.002) * 3
    buzz = (buzz / rms(buzz) + crackle * 0.3) * (0.15 + 0.85 * white_share)
    out["buzz"] = np.stack([buzz, buzz * 0.92], 1)

    # ---- one-shots bus (reverberant) and close bus (drier)
    fx = np.zeros((N, 2)); close = np.zeros((N, 2))
    for a_c, b_c, g in CUES.get("steps", []):
        a, b = cue(a_c), cue(b_c)
        if a is None or b is None:
            continue
        k = 0; t = a + 0.06
        while t < b + 0.25:
            place(fx, step(g * (0.9 + 0.2 * rg.random())), t, 0.55, (-0.15 if k % 2 else 0.15)); t += 0.47 + rg.uniform(-0.02, 0.02); k += 1
    T_SLAM = cue(CUES.get("slam"))
    if T_SLAM is not None:
        T_SLAM += 0.02
        place(fx, fall_rattle(), T_SLAM - 0.24, 0.5, -0.1)
        place(fx, slam(), T_SLAM, 1.0, -0.05)
    t_ph = cue(CUES.get("phone"))
    if t_ph is not None:
        place(close, beep(1900, 0.06), t_ph - 0.05, 0.25, 0.1); place(close, beep(1500, 0.08), t_ph + 0.06, 0.25, 0.1)
    t_bt = cue(CUES.get("button"))
    if t_bt is not None:
        place(fx, click(), t_bt - 0.2, 0.5, -0.3)
    t_mid = cue(CUES.get("midnight"))
    if t_mid is not None:
        place(close, beep(2600, 0.05), t_mid, 0.3, 0.25); place(close, beep(2600, 0.05), t_mid + 0.12, 0.3, 0.25)
    for i_, t0 in SW.items():
        g = 0.35 + 0.65 * max(0, min(1, (12 - i_) / 8.0))          # nearer rows are louder
        place(fx, clunk(g), t0, 0.9, 0.0)
    T_RISE = cue(CUES.get("rise"))
    if T_RISE is not None:   # shutter rise: motor + chain, distant
        n = N - int(T_RISE * SR); tt = np.arange(n) / SR
        motor = (np.sin(2 * np.pi * 98 * tt) + 0.5 * np.sin(2 * np.pi * 196 * tt) + 0.3 * np.sin(2 * np.pi * 294 * tt)) * ss(0, 0.6, tt) * 0.25
        chain = bp(rg.standard_normal(n), 800, 3000) * (np.sin(2 * np.pi * 11 * tt) > 0.7) * ss(0, 0.4, tt) * 0.35
        place(fx, lp(motor + chain, 2400), T_RISE, 0.55, 0.2)
    fx = verb(fx, 0.42)

    # ---- red drone (from the first switch), dips on the reveal
    T_REV = cue(CUES.get("reveal"))
    if T_REV is not None:
        T_REV -= 0.02
    if SW:
        T_RED = min(SW.values())
        drone = sum(a * np.sin(2 * np.pi * f * T + rg.uniform(0, 6)) for f, a in ((41.2, 1.0), (41.6, 0.9), (55.0, 0.55), (82.4, 0.3), (110.3, 0.12)))
        drone = np.tanh(drone * 1.6) + 0.4 * lp(rg.standard_normal(N), 160) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.19 * T))
        t_last = max(SW.values())
        drone_env = ss(T_RED - 0.2, T_RED + 5, T) * (0.55 + 0.45 * ss(T_RED, t_last, T))
        if T_REV is not None:
            drone_env *= 1 - 0.85 * ss(T_REV - 0.16, T_REV - 0.12, T) * (1 - ss(T_REV + 0.06, T_REV + 0.5, T))
        out["drone"] = np.stack([drone * drone_env, drone * drone_env * 0.97], 1)

    # ---- wet drag: pulls every ~0.95 s, approaching (louder, brighter), dead stop
    T_D0, T_STOP = cue(CUES.get("drag_from")), cue(CUES.get("drag_stop"))
    if T_D0 is not None and T_STOP is not None:
        T_STOP += 0.12
        drag = np.zeros(N)
        t = T_D0 + 0.4
        while t < T_STOP:
            d = 0.55 + 0.25 * rg.random()
            n = int(d * SR); tt = np.arange(n) / SR
            near = (t - T_D0) / (T_STOP - T_D0)
            x = bp(rg.standard_normal(n), 120, 500 + 900 * near) * np.sin(np.pi * tt / d) ** 1.5
            sq = lp(rg.standard_normal(n), 700) * (np.sin(2 * np.pi * 7 * tt) > 0.85) * 0.6  # squelch
            ii = int(t * SR); m = max(0, min(n, N - ii)); drag[ii:ii + m] += (x + sq)[:m] * (0.25 + 0.75 * near ** 1.4)
            t += d + 0.25 + 0.25 * rg.random()
        drag[int(T_STOP * SR):] = 0
        out["drag"] = verb(drag, 0.25)

    # ---- heartbeat 72 -> 92 bpm until the reveal (or the end)
    t_h = cue(CUES.get("heart_from"))
    if t_h is not None:
        hb = np.zeros((N, 2)); t = t_h; t_end = (T_REV - 0.2) if T_REV is not None else DUR - 0.5
        while t < t_end:
            bpm = 72 + 20 * (t - t_h) / max(1, t_end - t_h)
            place(hb, heartbeat(), t, 1.0, 0.0); t += 60 / bpm
        out["heart"] = lp(hb, 200)

    # ---- reveal: zap + sting; breathing behind to the end; the drip; the final hit
    if T_REV is not None:
        zap = hp(rg.standard_normal(int(0.08 * SR)), 1500) * np.exp(-np.arange(int(0.08 * SR)) / SR / 0.02)
        place(close, zap, T_REV - 0.16, 0.5, 0.0)
        st = np.zeros((N, 2)); place(st, sting(), T_REV + 0.06, 1.0, 0.0); out["sting"] = verb(st, 0.3)
        br = np.zeros((N, 2)); t = T_REV + 0.4; inh = True
        while t < DUR - 0.5:
            d = 1.25 if inh else 1.7
            place(br, breath(inh, d), t, 1.0, 0.35); t += d + (0.15 if inh else 0.5); inh = not inh
        out["breath"] = lp(br, 3000)
    t_dr = cue(CUES.get("drip"))
    if t_dr is not None:
        place(close, plip(), t_dr + 0.04, 1.0, 0.3)
    t_fi = cue(CUES.get("final"))
    if t_fi is not None:
        fin = np.zeros((N, 2)); place(fin, sting() * 0.8, t_fi + 0.05, 1.0, 0.0); out["final"] = verb(fin, 0.4)
    out["fx"] = fx; out["close"] = close

    # ---- levels vs the (limited) voice
    vo, vsr = sf.read(os.path.join(ROOT, "vo", "audio", "vo.wav"), always_2d=False)
    assert vsr == SR
    v = np.zeros(N); v[: min(N, len(vo))] = vo[:N]
    v = hp(v, 70)
    # look-ahead peak limiter on the voice copy (Kokoro peaks push loudnorm into dynamic mode): gain = thr/peak over a
    # +-4 ms window (min filter), released over 60 ms
    from scipy.ndimage import minimum_filter1d
    from scipy.signal import lfilter
    pk = np.abs(v); thr = np.percentile(pk[pk > 1e-4], 99.7)
    la = int(0.004 * SR)
    g = minimum_filter1d(np.minimum(1, thr / np.maximum(pk, 1e-9)), size=2 * la + 1)
    a_rel = np.exp(-1 / (0.06 * SR))
    g = 1 - lfilter([1 - a_rel], [1, -a_rel], 1 - g)
    v = v * np.clip(g, 0, 1)
    speech = np.zeros(N, bool)
    for l in ST.VO["lines"]:
        speech[int(l["start"] * SR):int(l["end"] * SR)] = True
    vo_db = 20 * np.log10(rms(v[speech]))
    TARGET = {"room": -30, "buzz": -34, "drone": -22, "drag": -17, "heart": -22, "breath": -18, "sting": -5, "final": -6, "fx": -5, "close": -8}
    # reference windows for each layer's level (where it is active)
    def active(x):
        m = np.abs(x).mean(axis=1) if x.ndim == 2 else np.abs(x)
        e = np.convolve(m, np.ones(2400) / 2400, mode="same")
        return e > e.max() * 0.08
    bed = np.zeros((N, 2)); lv = {}
    for k, x in out.items():
        if np.abs(x).max() <= 0:
            continue
        if x.ndim == 1:
            x = np.stack([x, x], 1)
        a = active(x)
        if k in ("fx", "close", "sting", "final"):
            # one-shots: set by their peak 100 ms RMS
            m = x.mean(axis=1); wv = int(0.1 * SR); nw = len(m) // wv
            ref = np.percentile(np.sqrt((m[: nw * wv].reshape(nw, wv) ** 2).mean(axis=1)), 99.9)
        else:
            ref = rms(x.mean(axis=1)[a]) if a.any() else rms(x)
        gk = 10 ** ((vo_db + TARGET[k]) / 20) / max(ref, 1e-12)
        bed += x * gk
        lv[k] = TARGET[k]
    bed[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None] ** 1.5
    bed_under = 20 * np.log10(rms(bed.mean(axis=1)[speech])) - vo_db
    print(f"voice {vo_db:.1f} dBFS · bed under speech {bed_under:+.1f} dB re voice")
    sd = os.path.join(ROOT, "score")
    for d in ("data", "audio"):
        os.makedirs(os.path.join(sd, d), exist_ok=True)
    sf.write(os.path.join(sd, "audio", "bed.wav"), bed.astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(sd, "audio", "vo.wav"), v.astype(np.float32), SR, subtype="FLOAT")
    shutil.copy2(os.path.join(ROOT, "vo", "data", "vo.json"), os.path.join(sd, "data", "vo.json"))
    # sound.py measures the music where it plays under speech and scales it to music_under_voice_db: pass the value
    # that makes its gain 1 (same measurement), so the relative levels above survive
    mm = bed.mean(axis=1); w50 = int(0.05 * SR)
    e = np.sqrt(np.convolve(mm ** 2, np.ones(w50) / w50, mode="same"))
    playing = speech & (e > e.max() * 0.03)
    vv = np.stack([v, v], 1)  # sound.py measures its own (hp + reverb) copy; close enough at 0.05 wet
    muvd = round(20 * np.log10(rms(mm[playing])) - vo_db, 2)
    json.dump({"duration": round(DUR, 3), "sfx": []}, open(os.path.join(sd, "data", "cues.json"), "w"), indent=0)
    json.dump({"preset": "none", "music_file": "audio/bed.wav", "duck_db": 0, "music_under_voice_db": muvd, "sfx_db": -13, "lufs": -14.0,
               "reverb": 0.0, "levels_re_voice_db": lv, "bed_under_speech_db": round(bed_under, 2)}, open(os.path.join(sd, "sound.json"), "w"), indent=1)
    print("music_under_voice_db", muvd)


if __name__ == "__main__":
    main()
