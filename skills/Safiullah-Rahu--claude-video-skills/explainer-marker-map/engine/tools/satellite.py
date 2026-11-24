"""Satellite close-ups: fetch EOX Sentinel-2 cloudless **2016** tiles politely, stitch one mosaic per zoom level,
cut the land out (OpenCV) and write the page's mosaic table.

  python -I engine/tools/satellite.py <slug> [--dry-run] [--remask]

Reads `sat` from <slug>/story.js (via the page's dump):
  sat: {levels: [{z: 9, center: [lon, lat], km: [w, h]},
                 {z: 11, center: [...], km: [...], landOnly: true, padKm: 6},
                 {z: 13, ..., landOnly: true, padKm: 2, weak: -12}],
        threshold: 5}           # land = (R - B) > threshold after a 1.5 px blur
  weak (per level, optional): hysteresis floor — R - B > weak counts when connected to R - B > threshold
  (use it where shaded/snowy cliffs come out bluish; leave it off where turbid water or sea ice touches land).
  landOnly: fetch only the tiles that the previous (coarser) level's land mask, grown by padKm, touches.

Writes
  _vendor/tiles/2016/{z}/{x}/{y}.jpg     the tile cache (shared by every film; never re-fetched)
  <slug>/tiles/z{z}_land.png              RGBA: the land, feathered mask edge × feathered mosaic edge
  <slug>/tiles/z{z}_halo.png              RGBA: the teal shallow-water halo (#2A6274)
  <slug>/tiles/z{z}_check.jpg             raw mosaic with the mask outline in red (look at it)
  <slug>/tiles/mosaics.js                 window.MF_MOSAICS = {lon0, levels: [{z, x0, y0, x1, y1, w, h, land, halo}]}

Politeness: one descriptive User-Agent, sequential requests, ≥ 0.3 s apart (≤ 3.3 req/s), cache everything,
stop at the first error or rate-limit response (no retries).
Licence: s2cloudless_3857 = Sentinel-2 cloudless 2016 by EOX IT Services GmbH, CC BY 4.0. Later years are
CC BY-NC-SA: never use them.
"""
import argparse
import json
import math
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import TILE_CACHE, dump_story, film_dir, std_x_to_rot, write_js_global  # noqa: E402

TEMPLATE = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"
UA = "map-films/1.0 (code-made map explainer; one-off cached fetch of ~100-300 tiles, <=3 req/s)"
MIN_GAP = 0.3
HALO_RGB = (0x2A, 0x62, 0x74)
_last = [0.0]


def tile_xy(lon, lat, z):
    n = 2 ** z
    la = math.radians(lat)
    return (lon + 180) / 360 * n, (1 - math.log(math.tan(la) + 1 / math.cos(la)) / math.pi) / 2 * n


def fetch(z, x, y, dry):
    n = 2 ** z
    xw = x % n
    p = TILE_CACHE / str(z) / str(xw) / f"{y}.jpg"
    if p.exists():
        return p, False
    if dry:
        return None, True
    wait = MIN_GAP - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    req = urllib.request.Request(TEMPLATE.format(z=z, x=xw, y=y), headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            if r.status != 200:
                raise SystemExit(f"stop: HTTP {r.status} for {z}/{xw}/{y}")
            data = r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"stop: HTTP {e.code} for {z}/{xw}/{y} (no retry)")
    except Exception as e:  # network trouble: stop, don't hammer
        raise SystemExit(f"stop: {e!r} for {z}/{xw}/{y}")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data)
    return p, True


def land_mask(img, thr, min_area, weak=None):
    """Land = redder than blue by `thr` levels after a 1.5 px blur; opened, closed, specks removed, holes filled.
    weak (optional, < thr): hysteresis — pixels redder-than-blue by only `weak` count as land when they connect to a
    `thr` pixel. Recovers shaded or snowy cliffs (R ≈ B) without letting blue water in."""
    b = cv2.GaussianBlur(img.astype(np.float32), (0, 0), 1.5)
    rb = b[..., 2] - b[..., 0]  # BGR: R - B
    m = (rb > thr).astype(np.uint8)
    if weak is not None and weak < thr:
        n, lab = cv2.connectedComponents((rb > weak).astype(np.uint8), connectivity=8)
        seeded = np.zeros(n, np.uint8)
        seeded[np.unique(lab[m > 0])] = 1
        seeded[0] = 0
        m = seeded[lab]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, np.uint8)
    keep[1:] = st[1:, cv2.CC_STAT_AREA] >= min_area
    m = keep[lab]
    inv = (1 - m).astype(np.uint8)  # holes = water not connected to the mosaic border
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0} if n > 1 else set()
    hole = np.ones(n, bool)
    hole[0] = False
    for i in border:
        hole[i] = False
    m[hole[lab]] = 1
    return m


def edge_feather(h, w, px):
    yy = np.minimum(np.arange(h), np.arange(h)[::-1]).astype(np.float32)
    xx = np.minimum(np.arange(w), np.arange(w)[::-1]).astype(np.float32)
    f = np.minimum.outer(yy, xx) / max(px, 1)
    f = np.clip(f, 0, 1)
    return f * f * (3 - 2 * f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--dry-run", action="store_true", help="list what would be fetched")
    ap.add_argument("--config", help="JSON file with {lon0, sat} instead of the story dump")
    a = ap.parse_args()
    root = film_dir(a.slug)
    if a.config:
        cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
    else:
        cfg = dump_story(a.slug)["story"]
    lon0, sat = cfg["lon0"], cfg["sat"]
    thr = sat.get("threshold", 5)
    out = root / "tiles"
    out.mkdir(exist_ok=True)
    levels, prev, data = [], None, []
    new_total = 0
    for L in sat["levels"]:
        z = L["z"]
        lon, lat = L["center"]
        kw, kh = L["km"]
        dlon = kw / 2 / (111.32 * math.cos(math.radians(lat)))
        dlat = kh / 2 / 110.57
        x0f, y0f = tile_xy(lon - dlon, lat + dlat, z)
        x1f, y1f = tile_xy(lon + dlon, lat - dlat, z)
        tx0, ty0, tx1, ty1 = int(math.floor(x0f)), int(math.floor(y0f)), int(math.floor(x1f)), int(math.floor(y1f))
        nx, ny = tx1 - tx0 + 1, ty1 - ty0 + 1
        unit = 256 / 2 ** z                      # world units per tile
        wx0 = std_x_to_rot(tx0 * unit, lon0)     # rotated world rect of the mosaic
        wy0 = ty0 * unit
        want = []
        for ty in range(ty0, ty1 + 1):
            for tx in range(tx0, tx1 + 1):
                if L.get("landOnly") and prev is not None:
                    pm, pr = prev
                    pad = L.get("padKm", 3) / 40075.016686 * 256 / math.cos(math.radians(lat))
                    rx0 = wx0 + (tx - tx0) * unit - pad
                    ry0 = wy0 + (ty - ty0) * unit - pad
                    sc = pm.shape[1] / (pr["x1"] - pr["x0"])
                    c0 = int(math.floor((rx0 - pr["x0"]) * sc))
                    r0 = int(math.floor((ry0 - pr["y0"]) * sc))
                    c1 = int(math.ceil((rx0 + unit + 2 * pad - pr["x0"]) * sc))
                    r1 = int(math.ceil((ry0 + unit + 2 * pad - pr["y0"]) * sc))
                    c0, r0 = max(c0, 0), max(r0, 0)
                    c1, r1 = min(c1, pm.shape[1]), min(r1, pm.shape[0])
                    if c1 <= c0 or r1 <= r0 or not pm[r0:r1, c0:c1].any():
                        continue
                want.append((tx, ty))
        news = sum(1 for tx, ty in want if not (TILE_CACHE / str(z) / str(tx % 2 ** z) / f"{ty}.jpg").exists())
        print(f"z{z}: {nx}x{ny} grid, {len(want)} tiles wanted, {news} to fetch")
        new_total += news
        if a.dry_run:
            prev = None
            continue
        mos = np.zeros((ny * 256, nx * 256, 3), np.uint8)
        have = np.zeros((ny * 256, nx * 256), np.uint8)
        for tx, ty in want:
            p, _ = fetch(z, tx, ty, False)
            im = cv2.imread(str(p), cv2.IMREAD_COLOR)
            if im is None or im.shape[:2] != (256, 256):
                raise SystemExit(f"bad tile {p}")
            r, c = (ty - ty0) * 256, (tx - tx0) * 256
            mos[r:r + 256, c:c + 256] = im
            have[r:r + 256, c:c + 256] = 1
        min_area = {9: 10, 10: 16, 11: 24, 12: 40, 13: 60}.get(z, 30)
        m = land_mask(mos, L.get("threshold", thr), min_area, L.get("weak")) * have
        if L.get("landOnly") and prev is not None:
            # keep only land that the coarser level also calls land (drops clouds and ice the hysteresis let in)
            pm, pr = prev
            k = 2.0 ** (pr["z"] - z)
            M = np.float32([[k, 0, (wx0 - pr["x0"]) * 2 ** pr["z"]], [0, k, (wy0 - pr["y0"]) * 2 ** pr["z"]]])
            grow = cv2.dilate(pm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
            ref = cv2.warpAffine(grow, M, (m.shape[1], m.shape[0]), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP)
            n, lab = cv2.connectedComponents(m, connectivity=8)
            ok = np.zeros(n, np.uint8)
            ok[np.unique(lab[(ref > 0) & (m > 0)])] = 1
            ok[0] = 0
            m = ok[lab]
        rec = {"z": z, "x0": wx0, "y0": wy0, "x1": wx0 + nx * unit, "y1": wy0 + ny * unit,
               "w": nx * 256, "h": ny * 256, "land": f"z{z}_land.png", "halo": f"z{z}_halo.png"}
        data.append({"mos": mos, "have": have, "m": m})
        levels.append(rec)
        prev = (m, rec)
    if a.dry_run:
        print(f"total to fetch: {new_total}")
        return
    # finer masks refine the coarser ones inside their coverage (so a coarse mosaic never shows a worse coastline
    # than the fine one it hands over to during a zoom)
    for k in range(len(levels) - 2, -1, -1):
        fine, coarse, fd, cd = levels[k + 1], levels[k], data[k + 1], data[k]
        q = 2 ** (fine["z"] - coarse["z"])
        fm = cv2.resize(fd["m"].astype(np.float32), (fine["w"] // q, fine["h"] // q), interpolation=cv2.INTER_AREA)
        fh = cv2.resize(fd["have"].astype(np.float32), (fine["w"] // q, fine["h"] // q), interpolation=cv2.INTER_AREA)
        ox, oy = int(round((fine["x0"] - coarse["x0"]) * 2 ** coarse["z"])), int(round((fine["y0"] - coarse["y0"]) * 2 ** coarse["z"]))
        H, W = cd["m"].shape
        x0, y0, x1, y1 = max(0, ox), max(0, oy), min(W, ox + fm.shape[1]), min(H, oy + fm.shape[0])
        if x1 > x0 and y1 > y0:
            sub_m, sub_h = fm[y0 - oy:y1 - oy, x0 - ox:x1 - ox], fh[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
            reg = cd["m"][y0:y1, x0:x1]
            cd["m"][y0:y1, x0:x1] = np.where(sub_h > 0.99, (sub_m > 0.5).astype(np.uint8), reg)
    for rec, d in zip(levels, data):
        z, m, mos = rec["z"], d["m"], d["mos"]
        # gentle grade: a touch of contrast and saturation (Sentinel-2 composites are flat)
        f = mos.astype(np.float32) / 255
        f = np.clip((f - 0.5) * 1.08 + 0.5 + 0.01, 0, 1)
        g = f.mean(axis=2, keepdims=True)
        f = np.clip(g + (f - g) * 1.12, 0, 1)
        soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.9)
        soft = np.clip((soft - 0.15) / 0.7, 0, 1)
        feather = edge_feather(*m.shape, 40)
        alpha = soft * feather
        land = np.dstack([(f * 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
        cv2.imwrite(str(out / f"z{z}_land.png"), land)
        # two-layer shallow-water halo: a brighter narrow band hugging the coast + a wide soft glow
        near = cv2.GaussianBlur(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))).astype(np.float32), (0, 0), 5)
        far = cv2.GaussianBlur(cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))).astype(np.float32), (0, 0), 16)
        halo = np.maximum(np.clip(near * 1.6, 0, 1) * 0.95, np.clip(far * 1.4, 0, 1) * 0.6) * feather
        hb = np.zeros((*m.shape, 4), np.uint8)
        hb[..., 0], hb[..., 1], hb[..., 2] = HALO_RGB[2], HALO_RGB[1], HALO_RGB[0]
        hb[..., 3] = (halo * 255).astype(np.uint8)
        cv2.imwrite(str(out / f"z{z}_halo.png"), hb)
        chk = mos.copy()
        cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(chk, cnts, -1, (40, 40, 255), 1)
        cv2.imwrite(str(out / f"z{z}_check.jpg"), chk, [cv2.IMWRITE_JPEG_QUALITY, 88])
        rec["landFrac"] = round(float(m.mean()), 4)
        print(f"   z{z}: mosaic {rec['w']}x{rec['h']}  land {rec['landFrac']*100:.1f} %  world x {rec['x0']:.4f}…{rec['x1']:.4f}")
    write_js_global(out / "mosaics.js", "MF_MOSAICS", {"lon0": lon0, "levels": levels})
    print("wrote", out / "mosaics.js")


if __name__ == "__main__":
    main()
