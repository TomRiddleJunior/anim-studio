"""Soft felt-piano bed for layer-stack-emotional (fully synthesized, no samples).

F major, 64 bpm, Fmaj9 - Am7 - Dm7 - Bbmaj7, a sparse broken-chord pattern in the middle register; it fades in over
1.5 s, rises about 3.5 dB from the callback chapter (c14) with a quiet melody on top, and ends on one rolled F chord
on the "SHE'S HOME" stamp that rings out alone. Timing is read from data/vo.json.

  ~/.generative-music-video/venv/Scripts/python.exe -I tools/bed.py <project>   ->  <project>/audio/bed.wav
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
RNG = np.random.default_rng(11)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100) / (SR / 2), btype="low", output="sos"), x)


def felt(m, dur=3.0, vel=0.4):
    """Felt piano: inharmonic partials with pitch-dependent decay, a soft attack, a muffled low-pass and a hammer thud."""
    f = mtof(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    B = 0.00035
    for k in range(1, 9):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 6000:
            break
        amp = (1 / k ** 1.4) * np.exp(-0.28 * k)
        tau = 2.6 / (1 + 0.55 * k) * (261.6 / f) ** 0.45
        x += amp * np.sin(2 * np.pi * fk * t + RNG.uniform(0, 6.28)) * np.exp(-t / tau)
    att = int(0.012 * SR)
    x[:att] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, att))
    th = lp(RNG.standard_normal(int(0.04 * SR)), 300) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.012) * 0.05
    x[: len(th)] += th
    x = lp(x, 900 + 2.2 * f + 900 * vel)
    rel = int(0.25 * SR)
    x[-rel:] *= np.linspace(1, 0, rel)
    return x * vel


def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(bus):
        return
    k = min(len(x), len(bus) - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + k, 0] += x[:k] * gain * l
    bus[i:i + k, 1] += x[:k] * gain * r


def main(project):
    root = Path(project).resolve()
    vo = json.loads((root / "data" / "vo.json").read_text(encoding="utf-8"))
    dur = vo["duration"] + 0.5
    lines = {l["id"]: l for l in vo["lines"]}
    t_cb = lines["c14"]["start"] - 0.1
    rings = [w for w in lines["c14"]["words"] if w["w"].lower().startswith("rings")][-1]
    t_end = rings["start"] + 0.75  # the stamp
    N = int(dur * SR)
    bus = np.zeros((N, 2))
    beat = 60 / 64
    bar = 4 * beat
    prog = [  # (bass, fifth, right-hand tones)
        (41, 48, [57, 60, 64, 67]),  # Fmaj9
        (45, 52, [55, 60, 64]),      # Am7
        (38, 45, [57, 60, 65]),      # Dm7
        (46, 53, [57, 62, 65]),      # Bbmaj7
    ]
    melody = [69, 67, 65, 64, 65, 67, 69, 72]
    b = 0
    while True:
        t0 = 0.25 + b * bar
        if t0 > t_end - 0.4:
            break
        bass, fifth, rh = prog[b % 4]
        cb = t0 >= t_cb
        v = 1.0 if not cb else 1.3
        place(bus, felt(bass, bar * 1.3, 0.42 * v), t0, pan=-0.15)
        place(bus, felt(fifth, bar * 1.1, 0.26 * v), t0 + 0.03, pan=-0.05)
        for k, (bt, idx, vel) in enumerate([(0.02, 0, 0.26), (1.5, 1, 0.22), (2.5, 2 % len(rh), 0.2), (3.25, 1, 0.16)]):
            tt = t0 + bt * beat
            if tt < t_end - 0.3:
                place(bus, felt(rh[idx], 2.6, vel * v), tt, pan=0.12 + 0.08 * k)
        if b % 2 == 1 and t0 + 3 * beat < t_end - 0.3:
            place(bus, felt(rh[-1] + 12, 2.4, 0.09 * v), t0 + 3 * beat, pan=0.3)
        if cb:
            for k in range(2):
                tt = t0 + (0.5 + 2 * k) * beat
                if tt < t_end - 0.3:
                    place(bus, felt(melody[(2 * b + k) % len(melody)], 2.6, 0.24), tt, pan=0.25)
        b += 1
    # the final rolled chord on the stamp, alone
    for k, m in enumerate([41, 48, 57, 60, 64, 67, 72]):
        place(bus, felt(m, 6.0, [0.45, 0.32, 0.28, 0.26, 0.24, 0.22, 0.14][k]), t_end + k * 0.055, pan=-0.3 + 0.1 * k)
    # room: a short dark plate
    ir_n = int(2.4 * SR)
    ti = np.arange(ir_n) / SR
    ir = lp(RNG.standard_normal(ir_n), 3500) * np.exp(-ti / 0.55)
    ir /= np.sqrt((ir ** 2).sum())
    wet = np.stack([fftconvolve(bus[:, c], ir)[:N] for c in range(2)], axis=1)
    out = bus * 0.75 + wet * 0.32
    # level shape: fade in, +3.5 dB from the callback, gentle fade at the very end
    env = np.ones(N)
    tt = np.arange(N) / SR
    env *= np.clip(tt / 1.5, 0, 1)
    env *= 10 ** (3.5 * np.clip((tt - t_cb) / 1.5, 0, 1) / 20)
    out *= env[:, None]
    out /= np.abs(out).max() + 1e-9
    out *= 0.8
    (root / "audio").mkdir(exist_ok=True)
    sf.write(root / "audio" / "bed.wav", out.astype(np.float32), SR, subtype="FLOAT")
    print(json.dumps({"duration": round(dur, 2), "bars": b, "t_callback": round(t_cb, 2), "t_final_chord": round(t_end, 2)}))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
