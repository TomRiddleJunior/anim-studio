"""Remove an unwanted vocal moment from the take by subtracting the Demucs vocal stem inside a window (raised-cosine
ramps), keeping the music under it. Used for a 1.6 s ad-lib MiniMax added between the dates chant and the last chorus
(not in the lyrics; Whisper heard nonsense).

  ~/.generative-music-video/venv/Scripts/python.exe tools/mute_vocal.py --take audio/take.wav --out audio/take_clean.wav --win 136.30 138.45
Needs analysis/stems/vocals.wav of the same timeline (gmv analyze on the take, tail-padded only).
"""
import argparse, json
from pathlib import Path
import numpy as np, soundfile as sf, librosa

ROOT = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser(); ap.add_argument("--take", default="audio/take.wav"); ap.add_argument("--out", default="audio/take_clean.wav")
ap.add_argument("--win", type=float, nargs=2, action="append", required=True); ap.add_argument("--ramp", type=float, default=0.06)
ap.add_argument("--swell-from", type=float, help="fill each window with a reversed swell of the instrumental (mix minus vocals) starting at this time (a chorus downbeat)")
a = ap.parse_args()
y, sr = sf.read(ROOT / a.take, always_2d=True)
v, vsr = sf.read(ROOT / "analysis" / "stems" / "vocals.wav", always_2d=True)
if vsr != sr:
    v = librosa.resample(v.T, orig_sr=vsr, target_sr=sr).T
off = json.loads((ROOT / "analysis" / "work" / "stem_offset.json").read_text())["samples"]
v = v[off:]
v = np.pad(v, ((0, max(0, len(y) - len(v))), (0, 0)))[: len(y)]
if v.shape[1] != y.shape[1]:
    v = np.repeat(v.mean(1, keepdims=True), y.shape[1], 1)
g = np.zeros(len(y))
for t0, t1 in a.win:
    i0, i1, r = int(t0 * sr), int(t1 * sr), int(a.ramp * sr)
    g[i0:i1] = 1
    g[i0 - r:i0] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, r))
    g[i1:i1 + r] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, r))
out = y - v * g[:, None]
if a.swell_from is not None:
    # the window was an a-cappella break: fill it with the song's own chorus instrumental, reversed, swelling into the downbeat
    inst = y - v
    for t0, t1 in a.win:
        n = int((t1 - t0) * sr); i0 = int(a.swell_from * sr)
        sw = inst[i0:i0 + n][::-1].copy()
        u = np.linspace(0, 1, n)[:, None]
        sw *= (10 ** ((-34 + 30 * u ** 2.2) / 20)) / (np.sqrt(np.mean(sw ** 2)) + 1e-9) * 0.25
        k = int(t0 * sr)
        out[k:k + n] += sw * g[k:k + n, None]
before = np.sqrt(np.mean(y[g > 0.99] ** 2)); after = np.sqrt(np.mean(out[g > 0.99] ** 2))
sf.write(ROOT / a.out, out.astype(np.float32), sr, subtype="PCM_24")
print(f"{a.out}: windows {a.win}; rms in window {20*np.log10(before+1e-9):.1f} -> {20*np.log10(after+1e-9):.1f} dBFS")
