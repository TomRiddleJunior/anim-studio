"""Build the Bir Tawil / Hala'ib geometry for the film (schematic, from Wikipedia's figures).

No vendored source has the 1902 administrative boundary or a Bir Tawil polygon: world-atlas countries-10m draws the
de-facto Egypt–Sudan border along 22°N (21.996° after quantisation) with Halaib inside Egypt, Bir Tawil inside Sudan
and the Wadi Halfa salient inside Sudan. So the shapes are constructed from what Wikipedia states (2026-10-31):
  Bir Tawil: quadrilateral, 2,060 km², north edge = 22nd parallel (95 km), south 46 km, east 26 km, west 49 km,
             meets the Hala'ib Triangle at a quadripoint; it begins ~183 km east of the Wadi Halfa salient
             (Egypt–Sudan border article). world-atlas keeps topology vertices at 33.180°E and 34.083/34.091°E on 22°N,
             which match a 93–94 km north edge, so those are the corners used.
  Hala'ib:   20,580 km², south edge = 22°N, east = the Red Sea coast (world-atlas 10m), north-west edge "jagged",
             Alshalateen (23.1317°N, 35.5856°E) "on the northern administrative boundary".
The jagged edges are drawn by hand and scaled so the areas match Wikipedia's (printed below).

  python -I bir-tawil/tools/build_geo.py        → bir-tawil/data/geo.json (+ prints a JS block for story.js)
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "bir-tawil" / "data" / "geo.json"
R_EARTH = 6371.0088
LAT22 = 22.0
KM_LON = 111.320 * math.cos(math.radians(21.85))   # km per degree of longitude near 22°N
KM_LAT = 110.60                                     # km per degree of latitude near 22°N


def area_km2(ring):
    """Spherical polygon area (lon/lat degrees), km²."""
    s = 0.0
    for (l1, p1), (l2, p2) in zip(ring, ring[1:] + ring[:1]):
        s += math.radians(l2 - l1) * (2 + math.sin(math.radians(p1)) + math.sin(math.radians(p2)))
    return abs(s) * R_EARTH ** 2 / 2


def length_km(line):
    return sum(math.hypot((b[0] - a[0]) * KM_LON, (b[1] - a[1]) * KM_LAT) for a, b in zip(line, line[1:]))


def centroid(ring):
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        c = x1 * y2 - x2 * y1
        a += c
        cx += (x1 + x2) * c
        cy += (y1 + y2) * c
    return [cx / (3 * a), cy / (3 * a)]


def egypt_coast():
    """The Red Sea coast of Egypt's world-atlas 10m ring between 22°N and 23.3°N, south → north."""
    t = json.loads((ROOT / "_vendor/node_modules/world-atlas/countries-10m.json").read_text())
    sx, sy = t["transform"]["scale"]
    tx, ty = t["transform"]["translate"]
    arcs = []
    for a in t["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    g = next(g for g in t["objects"]["countries"]["geometries"] if g["properties"]["name"] == "Egypt")
    ring = []
    for i in g["arcs"][0][0]:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        ring.extend(a if not ring else a[1:])
    # walk from the coast point on 22°N northwards (decreasing index in this ring)
    k = min(range(len(ring)), key=lambda i: abs(ring[i][0] - 36.884) + abs(ring[i][1] - 21.996))
    out = []
    while ring[k][1] <= 23.30 and ring[k][0] > 35.4:
        out.append([round(ring[k][0], 4), round(ring[k][1], 4)])
        k -= 1
    return out


def km_to_ll(origin, pts):
    return [[round(origin[0] + x / KM_LON, 4), round(origin[1] + y / KM_LAT, 4)] for x, y in pts]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    # ── Bir Tawil: km from the NW corner (x east, y north) ─────────────────────────────────────────────────────
    NW = [33.180, LAT22]
    NE_X = (34.090 - 33.180) * KM_LON                     # ≈ 94 km (Wikipedia: 95 km)
    west = [(0, 0), (6.5, -5.5), (12, -8.6), (17.5, -13.5), (23, -15.4), (28.5, -19.5), (33.5, -21.4), (38, -26.5), (41.5, -29.5)]
    south = [(47, -30.9), (53, -30.0), (58.5, -32.6), (64, -30.8), (69.5, -32.0), (75, -29.6), (80.5, -30.3), (85.5, -26.6)]
    east = [(87.5, -21.5), (88.6, -16.2), (90.6, -11.0), (91.2, -5.6), (NE_X, 0)]
    bt_km = west + south + east
    bt = km_to_ll(NW, bt_km)
    bt[-1] = [34.090, LAT22]
    bt[0] = [33.180, LAT22]
    # ── Hala'ib: the quadripoint → jagged NW edge → the coast just north of Alshalateen; then the coast; then 22°N
    Q = [34.090, LAT22]
    coast = egypt_coast()                                 # south → north
    # where the 1902 line meets the coast (just north of Alshalateen, 23.1317°N)
    cut_lat = 23.165
    ci = next(i for i in range(1, len(coast)) if coast[i][1] >= cut_lat)
    a, b = coast[ci - 1], coast[ci]
    u = (cut_lat - a[1]) / (b[1] - a[1])
    C = [round(a[0] + (b[0] - a[0]) * u, 4), cut_lat]
    # NW edge in km from Q (hand-drawn jags; bulges north-west of the straight chord)
    nw_km = [(0, 0), (9, 8.5), (16, 21.0), (27, 27.5), (34, 41.0), (46, 50.5), (55, 63.0), (68, 72.0), (77, 85.5), (90, 93.5),
             (101, 106.0), (114, 112.5), (126, 122.0), (138, 127.2)]
    BULGE = 2.9                                           # km, pushes the inner vertices north-west of the chord
    n = len(nw_km) - 1
    nx, ny = -nw_km[-1][1], nw_km[-1][0]
    ln = math.hypot(nx, ny)
    nw_km = [(x + BULGE * math.sin(math.pi * i / n) * nx / ln, y + BULGE * math.sin(math.pi * i / n) * ny / ln) for i, (x, y) in enumerate(nw_km)]
    nw = km_to_ll(Q, nw_km)
    nw = nw + [C]
    coast_part = [p for p in coast[:ci]] + [C]           # 22°N → C, south → north
    halaib = [Q] + [[36.884, LAT22]] + coast_part[1:] + nw[::-1][1:-1]
    # ── report ─────────────────────────────────────────────────────────────────────────────────────────────────
    A_bt, A_h = area_km2(bt), area_km2(halaib)
    sides = {"north": length_km([bt[0], bt[-1]]), "west": length_km(km_to_ll(NW, west)),
             "south": length_km(km_to_ll(NW, [west[-1]] + south)), "east": length_km(km_to_ll(NW, [south[-1]] + east))}
    print(f"Bir Tawil: {A_bt:,.0f} km² (Wikipedia 2,060) · sides " + ", ".join(f"{k} {v:.0f} km" for k, v in sides.items())
          + " (Wikipedia N 95, S 46, E 26, W 49)")
    print(f"   centroid {centroid(bt)} (Wikipedia point 33.7478, 21.8692)")
    print(f"Hala'ib: {A_h:,.0f} km² (Wikipedia 20,580) · ratio {A_h / A_bt:.1f}× · coast end {C}")
    print(f"   centroid {centroid(halaib)} (Wikipedia point 35.5231, 22.4692)")
    line1902 = bt + nw[1:]                               # NW corner → round Bir Tawil → quadripoint → coast
    line1899 = [[24.998, LAT22], [36.884, LAT22]]
    data = {"birTawil": bt, "halaib": halaib, "line1902": line1902, "line1899": line1899, "coastEnd1902": C,
            "areas": {"birTawil": round(A_bt), "halaib": round(A_h)},
            "centroids": {"birTawil": [round(v, 4) for v in centroid(bt)], "halaib": [round(v, 4) for v in centroid(halaib)]}}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1), encoding="utf-8")
    js = (f"const BIR_TAWIL = {json.dumps(bt)};\nconst HALAIB = {json.dumps(halaib)};\nconst LINE_1902 = {json.dumps(line1902)};\n")
    (OUT.parent / "geo.js.txt").write_text(js, encoding="utf-8")
    print("wrote", OUT, "and geo.js.txt")


if __name__ == "__main__":
    main()
