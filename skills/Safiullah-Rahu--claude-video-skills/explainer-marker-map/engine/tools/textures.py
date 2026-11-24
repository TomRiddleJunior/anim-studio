"""Procedural textures for the engine (run once; deterministic): engine/assets/paper.png and grain.png

  python -I engine/tools/textures.py

paper.png  2048² warm paper (mean ≈ 0.95): mottling, fibres, fine tooth, two faint fold creases. The page multiplies
           it over the whole frame (85 % on paper shots, 22 % on satellite) and fills every paper prop with it.
grain.png  512² neutral film grain around mid-grey; the page overlays it at a per-frame random offset (≈ 7 %).
"""
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import ENGINE  # noqa: E402

rng = np.random.default_rng(1987)
N = 2048


def octave_noise(n, scales, weights):
    out = np.zeros((n, n), np.float32)
    for s, w in zip(scales, weights):
        k = max(2, n // s)
        small = rng.standard_normal((k, k)).astype(np.float32)
        out += w * cv2.resize(small, (n, n), interpolation=cv2.INTER_CUBIC)
    return out / max(1e-6, out.std())


mott = octave_noise(N, [512, 256, 96, 40], [1.0, 0.7, 0.45, 0.3])
tooth = rng.standard_normal((N, N)).astype(np.float32)
tooth = cv2.GaussianBlur(tooth, (0, 0), 0.7)
tooth /= tooth.std()
fib = np.zeros((N, N), np.float32)                 # fibres: short random strokes
for _ in range(9000):
    x, y = rng.integers(0, N, 2)
    a = rng.uniform(0, np.pi)
    L = rng.uniform(6, 26)
    x2, y2 = int(x + L * np.cos(a)), int(y + L * np.sin(a))
    cv2.line(fib, (int(x), int(y)), (x2, y2), float(rng.choice([-1, 1]) * rng.uniform(0.4, 1.0)), 1, cv2.LINE_AA)
fib = cv2.GaussianBlur(fib, (0, 0), 0.6)
lum = 0.955 + 0.022 * mott + 0.010 * tooth + 0.018 * fib
for pos, axis in ((int(N * 0.41), 1), (int(N * 0.63), 0)):  # faint fold creases
    d = np.abs(np.arange(N) - pos).astype(np.float32)
    crease = (0.012 * np.exp(-(d / 2.0) ** 2) - 0.006 * np.exp(-((d - 4) / 6.0) ** 2))
    lum += crease[None, :] if axis == 1 else crease[:, None]
lum = np.clip(lum, 0.78, 1.0)
rgb = np.dstack([lum * 0.995, lum * 0.975, lum * 0.93])   # warm
rgb = np.clip(rgb + 0.004 * mott[..., None], 0, 1)
(ENGINE / "assets").mkdir(parents=True, exist_ok=True)
cv2.imwrite(str(ENGINE / "assets" / "paper.png"), (rgb[..., ::-1] * 255).astype(np.uint8))

g = rng.standard_normal((512, 512)).astype(np.float32)
g = cv2.GaussianBlur(g, (0, 0), 1.1)   # ~2 px grain: reads as film, and H.264 can still compress it
g = g / g.std() * 0.16 + 0.5
cv2.imwrite(str(ENGINE / "assets" / "grain.png"), (np.clip(g, 0, 1) * 255).astype(np.uint8))
print("paper.png mean", round(float(rgb.mean()), 3), "· grain.png std", round(float(g.std()), 3))
