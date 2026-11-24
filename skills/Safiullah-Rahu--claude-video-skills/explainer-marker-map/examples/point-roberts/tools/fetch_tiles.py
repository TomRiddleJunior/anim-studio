"""Point Roberts imagery: the engine's satellite.py, run (1) slower and (2) with a land mask that suits the Pacific
Northwest. Everything here is film-specific, so it lives in this folder and only wraps engine/tools/satellite.py.

  python -I point-roberts/tools/fetch_tiles.py [--dry-run]

(1) Requests >= 0.6 s apart (<= 1.7 req/s; another film fetches from the same server). satellite.py still stops at
    the first error or rate-limit response, without retries.
(2) The engine's mask ("redder than blue") fails here: the conifer forest is dark teal (R - B ~ -24, about as blue as
    the sea at ~ -34) and the Fraser River plume is greenish. So the mask uses Natural Earth 1:10m land as a prior:
    deeper than BAND_KM inside its land = land (forest, snow and cloud on the North Shore mountains included), further
    than BAND_KM out to sea = water, and only the coastal band is decided by colour (blurred R - B > RB_T, or green and
    bright = fields/lawns). NE's coast is off by up to ~1 km here (Point Roberts' east shore), hence the 1.5 km band.
    Then the engine's own clean-up: open/close, specks removed, holes filled.
"""
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "engine" / "tools"))
import satellite  # noqa: E402
from mfcommon import dump_story, std_x_to_rot, world  # noqa: E402

satellite.MIN_GAP = 0.6
satellite.UA = "map-films/1.0 (code-made map explainer; one-off cached fetch of ~450 tiles, <=1.7 req/s)"

BAND_KM = 1.5
# colour + texture inside the coastal band (raw tile values; mask_lab.py prints them per box):
#   open water R-B -28..-31, sd < 2 · ripple shallows/flats R-B ~ -23, sd ~ 4 · forest R-B ~ -20, sd ~ 8
#   suburbs R-B ~ -6, sd ~ 14 · fields G-B ~ +12, lum ~ 66
RB_T, SD_T = -23.5, 4.5
GB_T, LUM_T = 5.0, 55.0
BLUR = 2.0
# Water the classifier can't tell from forest (wave-rippled sand shallows and haze off Point Roberts and Tsawwassen):
# polygons traced just offshore of the beach lines in z13 (mask_lab.py preview, 0.005° grid). lon, lat.
FORCE_WATER = [
    # Boundary Bay west: off Lily Point, Point Roberts' east beach, Tsawwassen/Beach Grove, and the bay's north dike
    [(-123.0205, 48.9748), (-123.0222, 48.980), (-123.0247, 48.985), (-123.0285, 48.990), (-123.0318, 48.995),
     (-123.0332, 49.000), (-123.0350, 49.005), (-123.0352, 49.010), (-123.0395, 49.017), (-123.0460, 49.0225),
     (-123.0535, 49.0285), (-123.0520, 49.035), (-123.0485, 49.040), (-123.0440, 49.045), (-123.0368, 49.0495),
     (-123.0275, 49.0532), (-123.0200, 49.0552), (-123.0010, 49.0600), (-122.9890, 49.0637), (-122.9750, 49.0660),
     (-122.9750, 49.000), (-122.9900, 48.9720)],
    # south of Point Roberts (haze over the shallows)
    [(-123.1200, 48.9695), (-123.0855, 48.9695), (-123.0790, 48.9702), (-123.0700, 48.9727), (-123.0600, 48.9732),
     (-123.0450, 48.9731), (-123.0350, 48.9731), (-123.0280, 48.9733), (-123.0215, 48.9745), (-122.9900, 48.9720),
     (-122.9900, 48.9400), (-123.1200, 48.9400)],
    # west of Point Roberts' south half
    [(-123.1200, 48.9695), (-123.0880, 48.9695), (-123.0885, 48.9820), (-123.1200, 48.9820)],
]

LON0 = -123.0         # the story's lon0
RECTS = {}            # mosaic shape → (z, wx0, wy0, lon0, lat)
_POLYS = None


def ne_land_polys(box=(-135.0, 44.0, -112.0, 56.0)):
    """Natural Earth 1:10m land polygons (world-atlas land-10m) inside a lon/lat box, as lists of rings."""
    d = json.loads((ROOT / "_vendor/node_modules/world-atlas/land-10m.json").read_text())
    sx, sy = d["transform"]["scale"]
    tx, ty = d["transform"]["translate"]
    cache = {}

    def arc(i):
        k = ~i if i < 0 else i
        if k not in cache:
            x = y = 0
            pts = []
            for dx, dy in d["arcs"][k]:
                x += dx
                y += dy
                pts.append((x * sx + tx, y * sy + ty))
            cache[k] = pts
        return cache[k][::-1] if i < 0 else cache[k]

    out = []
    for g in d["objects"]["land"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        for poly in polys:
            rings = []
            for ring in poly:
                pts = []
                for i in ring:
                    pts += arc(i)
                rings.append(pts)
            lam = [((p[0] - LON0 + 540) % 360) - 180 for p in rings[0]]
            if min(lam) < -150 and max(lam) > 150:      # crosses the film's cut meridian (Eurasia): never near here
                continue
            xs = [p[0] for p in rings[0]]
            ys = [p[1] for p in rings[0]]
            if max(xs) < box[0] or min(xs) > box[2] or max(ys) < box[1] or min(ys) > box[3]:
                continue
            out.append(rings)
    return out


def prior_mask(shape, rect):
    global _POLYS
    if _POLYS is None:
        _POLYS = ne_land_polys()
    z, wx0, wy0, lon0, _ = rect
    s = 2 ** z
    m = np.zeros(shape, np.uint8)
    for rings in _POLYS:
        cnts = []
        for r in rings:
            P = np.array([world(lon, lat, lon0) for lon, lat in r], np.float64)
            P[:, 0] = (P[:, 0] - wx0) * s
            P[:, 1] = (P[:, 1] - wy0) * s
            cnts.append(np.round(P * 4).astype(np.int32))   # 2 bits of sub-pixel precision
        cv2.fillPoly(m, cnts, 1, lineType=cv2.LINE_8, shift=2)
    return m


def raster_lonlat(shape, rect, polys):
    z, wx0, wy0, lon0, _ = rect
    s = 2 ** z
    m = np.zeros(shape, np.uint8)
    for poly in polys:
        P = np.array([world(lon, lat, lon0) for lon, lat in poly], np.float64)
        P[:, 0] = (P[:, 0] - wx0) * s
        P[:, 1] = (P[:, 1] - wy0) * s
        cv2.fillPoly(m, [np.round(P * 4).astype(np.int32)], 1, lineType=cv2.LINE_8, shift=2)
    return m


def land_mask_pnw(img, thr, min_area, weak=None):
    rect = RECTS.get(img.shape[:2])
    if rect is None:
        raise SystemExit(f"no mosaic rect for shape {img.shape[:2]}")
    z, _, _, _, lat = rect
    m_per_px = 40075016.686 * math.cos(math.radians(lat)) / (256 * 2 ** z)
    band = max(2, int(round(BAND_KM * 1000 / m_per_px)))
    prior = prior_mask(img.shape[:2], rect)
    d_in = cv2.distanceTransform(prior, cv2.DIST_L2, 5)
    d_out = cv2.distanceTransform((1 - prior).astype(np.uint8), cv2.DIST_L2, 5)
    b = cv2.GaussianBlur(img.astype(np.float32), (0, 0), BLUR)
    rb, gb, lum = b[..., 2] - b[..., 0], b[..., 1] - b[..., 0], b.mean(axis=2)
    g = img.astype(np.float32).mean(axis=2)
    mu = cv2.GaussianBlur(g, (0, 0), 3)
    sd = np.sqrt(np.maximum(cv2.GaussianBlur(g * g, (0, 0), 3) - mu * mu, 0))
    col = ((rb > RB_T) & ((sd > SD_T) | ((gb > GB_T) & (lum > LUM_T)))).astype(np.uint8)
    col = np.where(img.max(axis=2) == 0, prior, col)          # tiles not fetched (open sea): the prior decides
    m = np.where(d_in > band, 1, np.where(d_out > band, 0, col)).astype(np.uint8)
    m[raster_lonlat(img.shape[:2], rect, FORCE_WATER) > 0] = 0
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, np.uint8)
    keep[1:] = st[1:, cv2.CC_STAT_AREA] >= min_area
    m = keep[lab]
    inv = (1 - m).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0} if n > 1 else set()
    hole = np.ones(n, bool)
    hole[0] = False
    for i in border:
        hole[i] = False
    # only fill holes that are small next to the land (lakes stay as satellite pixels; big bays stay water)
    for i in range(1, n):
        if hole[i] and st[i, cv2.CC_STAT_AREA] > 0.02 * m.size:
            hole[i] = False
    m[hole[lab]] = 1
    return m


def main():
    cfg = dump_story("point-roberts")["story"]
    lon0 = cfg["lon0"]
    for L in cfg["sat"]["levels"]:
        z = L["z"]
        lon, lat = L["center"]
        kw, kh = L["km"]
        dlon = kw / 2 / (111.32 * math.cos(math.radians(lat)))
        dlat = kh / 2 / 110.57
        x0f, y0f = satellite.tile_xy(lon - dlon, lat + dlat, z)
        x1f, y1f = satellite.tile_xy(lon + dlon, lat - dlat, z)
        tx0, ty0, tx1, ty1 = int(math.floor(x0f)), int(math.floor(y0f)), int(math.floor(x1f)), int(math.floor(y1f))
        unit = 256 / 2 ** z
        shape = ((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256)
        if shape in RECTS:
            raise SystemExit(f"two levels share mosaic shape {shape}: change a level's km")
        RECTS[shape] = (z, std_x_to_rot(tx0 * unit, lon0), ty0 * unit, lon0, lat)
    satellite.land_mask = land_mask_pnw
    tmp = ROOT / "point-roberts" / "tiles" / "sat_config.json"
    tmp.write_text(json.dumps({"lon0": lon0, "sat": cfg["sat"]}), encoding="utf-8")
    sys.argv = [sys.argv[0], "point-roberts", "--config", str(tmp)] + sys.argv[1:]
    satellite.main()


if __name__ == "__main__":
    main()
