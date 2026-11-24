"""Land-mask experiments on the raw z13 mosaic (rebuilt from the tile cache): print feature stats in named boxes and
write an outline preview for a candidate rule.

  python -I point-roberts/tools/mask_lab.py stats
  python -I point-roberts/tools/mask_lab.py preview <out.jpg> [lon0 lat0 lon1 lat1]
"""
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "engine" / "tools"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import TILE_CACHE, world  # noqa: E402
import satellite  # noqa: E402

M = json.loads((ROOT / "point-roberts/tiles/mosaics.js").read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
LON0 = M["lon0"]


def raw_mosaic(z=13):
    L = next(l for l in M["levels"] if l["z"] == z)
    unit = 256 / 2 ** z
    # rotated x0 → standard tile index
    xs = (L["x0"] + LON0 * 256 / 360) % 256
    tx0, ty0 = int(round(xs / unit)), int(round(L["y0"] / unit))
    nx, ny = L["w"] // 256, L["h"] // 256
    mos = np.zeros((ny * 256, nx * 256, 3), np.uint8)
    for j in range(ny):
        for i in range(nx):
            p = TILE_CACHE / str(z) / str((tx0 + i) % 2 ** z) / f"{ty0 + j}.jpg"
            if p.exists():
                mos[j * 256:(j + 1) * 256, i * 256:(i + 1) * 256] = cv2.imread(str(p))
    return L, mos


def px(L, lon, lat):
    x, y = world(lon, lat, LON0)
    return int((x - L["x0"]) * 2 ** L["z"]), int((y - L["y0"]) * 2 ** L["z"])


def features(mos, blur=2.0):
    b = cv2.GaussianBlur(mos.astype(np.float32), (0, 0), blur)
    rb, gb, lum = b[..., 2] - b[..., 0], b[..., 1] - b[..., 0], b.mean(axis=2)
    g = mos.astype(np.float32).mean(axis=2)
    mu = cv2.GaussianBlur(g, (0, 0), 3)
    sd = np.sqrt(np.maximum(cv2.GaussianBlur(g * g, (0, 0), 3) - mu * mu, 0))
    return rb, gb, lum, sd


BOXES = {
    "open water W of PR": (-123.118, 48.985, -123.105, 49.01),
    "Boundary Bay open": (-123.0, 48.99, -122.985, 49.02),
    "bay flats N (Mud Bay)": (-122.98, 49.06, -122.94, 49.075),
    "bay flats W (E of Tsawwassen)": (-123.035, 49.02, -123.02, 49.035),
    "PR forest": (-123.06, 48.985, -123.045, 48.995),
    "Tsawwassen suburbs": (-123.09, 49.01, -123.07, 49.02),
    "Delta fields": (-123.0, 49.08, -122.96, 49.09),
    "Fraser plume": (-123.2, 49.06, -123.17, 49.08),
    "Fraser river": (-123.1, 49.105, -123.08, 49.11),
    "Semiahmoo bay water": (-122.83, 48.99, -122.80, 49.0),
}


def main():
    L, mos = raw_mosaic()
    rb, gb, lum, sd = features(mos)
    if sys.argv[1] == "stats":
        for name, (a, b_, c, d) in BOXES.items():
            x0, y1 = px(L, a, b_)
            x1, y0 = px(L, c, d)
            sl = (slice(max(0, y0), y1), slice(max(0, x0), x1))
            if mos[sl].max() == 0:
                print(f"{name:32s} (no tiles)")
                continue
            f = lambda v: f"{np.percentile(v[sl], 5):6.1f}/{np.median(v[sl]):6.1f}/{np.percentile(v[sl], 95):6.1f}"
            print(f"{name:32s} R-B {f(rb)}  G-B {f(gb)}  lum {f(lum)}  sd {f(sd)}")
        return
    out = sys.argv[2]
    rule = (rb > -23.5) & ((sd > 4.5) | ((gb > 5) & (lum > 55)))
    m = rule.astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    m = cv2.morphologyEx(cv2.morphologyEx(m, cv2.MORPH_OPEN, k), cv2.MORPH_CLOSE, k)
    box = [float(v) for v in sys.argv[3:7]] if len(sys.argv) > 6 else [-123.13, 48.96, -122.9, 49.1]
    x0, y1 = px(L, box[0], box[1])
    x1, y0 = px(L, box[2], box[3])
    chk = mos.copy()
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(chk, cnts, -1, (40, 40, 255), 1)
    step = float(sys.argv[7]) if len(sys.argv) > 7 else 0.01
    sc = float(sys.argv[8]) if len(sys.argv) > 8 else 1.0
    cr = chk[max(0, y0):y1, max(0, x0):x1]
    cr = cv2.resize(cr, None, fx=sc, fy=sc, interpolation=cv2.INTER_CUBIC) if sc != 1.0 else cr.copy()
    lon = math.ceil(box[0] / step) * step
    while lon < box[2]:
        gx = int((px(L, lon, box[1])[0] - max(0, x0)) * sc)
        cv2.line(cr, (gx, 0), (gx, cr.shape[0] - 1), (0, 255, 255), 1)
        cv2.putText(cr, f"{lon:.3f}", (gx + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 255), 1)
        lon += step
    la = math.ceil(box[1] / step) * step
    while la < box[3]:
        gy = int((px(L, box[0], la)[1] - max(0, y0)) * sc)
        cv2.line(cr, (0, gy), (cr.shape[1] - 1, gy), (0, 255, 255), 1)
        cv2.putText(cr, f"{la:.3f}", (2, gy - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 255), 1)
        la += step
    cv2.imwrite(out, cr, [cv2.IMWRITE_JPEG_QUALITY, 88])
    print("wrote", out)


if __name__ == "__main__":
    main()
