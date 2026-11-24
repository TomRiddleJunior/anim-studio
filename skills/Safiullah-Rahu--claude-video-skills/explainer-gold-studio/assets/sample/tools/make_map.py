"""Dotted-map data for the map beat: a hex grid of dots over land (Natural Earth, public domain), the highlighted
region in gold, plus dotted routes and label anchors, written to assets/lib/gold-map.js.

The Natural Earth 1:10m GeoJSON (ne_10m_admin_0_countries.json, ne_10m_admin_1_states_provinces.json; public domain,
naturalearthdata.com) is read from the folder given as the second argument, else $GOLD_NE, else <project>/data/ne/.
Orthographic projection centred on the region; map units = radians x SCALE; x = east, z = south.

usage: python -I tools/make_map.py [region] [natural-earth-dir]      (default: Alberta; set LON0/LAT0 below for another region)
"""
import json
import math
import os
import sys

import numpy as np
from matplotlib.path import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGION = sys.argv[1] if len(sys.argv) > 1 else "Alberta"
# Natural Earth 1:10m GeoJSON folder (admin_0 countries + admin_1 states/provinces); default: <project>/data/ne
NE = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("GOLD_NE", os.path.join(ROOT, "data", "ne"))
LON0, LAT0 = -116.0, 54.5          # projection centre (a little west of Alberta so the coast is in frame)
SCALE = 16.0                       # world units per radian
SP = 0.085                         # dot spacing (world units)
X_RANGE, Y_RANGE = (-0.62, 0.42), (-0.42, 0.40)   # radians, around the centre


def proj(lon, lat):
    lam, phi = math.radians(lon - LON0), math.radians(lat)
    p0 = math.radians(LAT0)
    x = math.cos(phi) * math.sin(lam)
    y = math.cos(p0) * math.sin(phi) - math.sin(p0) * math.cos(phi) * math.cos(lam)
    return x * SCALE, -y * SCALE      # z points south


def rings(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    if geom["type"] == "MultiPolygon":
        return [p[0] for p in geom["coordinates"]]
    return []


def paths(features, keep):
    out = []
    for f in features:
        if not keep(f["properties"]):
            continue
        for r in rings(f["geometry"]):
            lons = np.array([c[0] for c in r])
            lats = np.array([c[1] for c in r])
            if lons.max() < LON0 - 75 or lons.min() > LON0 + 60 or lats.max() < 15:
                continue
            pts = [proj(lo, la) for lo, la in zip(lons, lats)]
            out.append(Path(np.array(pts)))
    return out


def main():
    print("reading Natural Earth …")
    countries = json.load(open(os.path.join(NE, "ne_10m_admin_0_countries.json"), encoding="utf-8"))["features"]
    states = json.load(open(os.path.join(NE, "ne_10m_admin_1_states_provinces.json"), encoding="utf-8"))["features"]
    land = paths(countries, lambda p: p.get("CONTINENT") in ("North America", "Asia", "Europe") or p.get("ADMIN") in ("Russia", "Greenland"))
    gold = paths(states, lambda p: p.get("name") == REGION)
    other = paths(states, lambda p: p.get("name") == "Alaska")
    xs = np.arange(X_RANGE[0] * SCALE, X_RANGE[1] * SCALE, SP)
    zs = np.arange(-Y_RANGE[1] * SCALE, -Y_RANGE[0] * SCALE, SP * math.sqrt(3) / 2)
    pts = []
    for j, z in enumerate(zs):
        for x in xs:
            pts.append((x + (SP / 2 if j % 2 else 0), z))
    pts = np.array(pts)
    is_land = np.zeros(len(pts), bool)
    for p in land:
        bb = p.get_extents()
        sel = (pts[:, 0] >= bb.x0) & (pts[:, 0] <= bb.x1) & (pts[:, 1] >= bb.y0) & (pts[:, 1] <= bb.y1)
        if sel.any():
            is_land[sel] |= p.contains_points(pts[sel])
    is_gold = np.zeros(len(pts), bool)
    for p in gold:
        is_gold |= p.contains_points(pts)
    is_ak = np.zeros(len(pts), bool)
    for p in other:
        is_ak |= p.contains_points(pts)
    dots = [[round(float(x), 3), round(float(z), 3), 1 if g else (2 if a else 0)]
            for (x, z), l, g, a in zip(pts, is_land, is_gold, is_ak) if l or g]
    print(len(dots), "dots,", int(is_gold.sum()), "gold")

    def line(ll):
        return [[round(v, 3) for v in proj(lo, la)] for lo, la in ll]
    # dotted routes (schematic): pipelines out of the Edmonton/Hardisty hub, a tanker lane out of the Burrard Inlet
    routes = {
        "west": line([(-111.9, 52.7), (-113.5, 53.5), (-116.5, 53.2), (-119.5, 51.4), (-121.6, 49.6), (-122.95, 49.29)]),
        "south": line([(-111.9, 52.7), (-110.4, 50.6), (-108.5, 48.9), (-104.0, 46.7), (-99.0, 44.2)]),
        "east": line([(-111.9, 52.7), (-108.0, 51.9), (-104.0, 50.6), (-99.5, 49.6)]),
        "sea": line([(-122.95, 49.29), (-123.6, 48.4), (-126.0, 47.8), (-131.0, 48.6), (-139.0, 50.5)]),
        "seaS": line([(-123.6, 48.4), (-125.4, 46.5), (-125.6, 42.0), (-124.0, 37.0)]),
    }
    labels = {
        "region": [round(v, 3) for v in proj(-114.6, 54.2)],
        "alaska": [round(v, 3) for v in proj(-147.0, 63.0)],
        "us": [round(v, 3) for v in proj(-108.0, 45.5)],
        "bc": [round(v, 3) for v in proj(-124.5, 54.0)],
    }
    out = os.path.join(ROOT, "assets", "lib", "gold-map.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* generated by tools/make_map.py from Natural Earth 1:10m (public domain) */\n")
        f.write("window.GOLD_MAP = " + json.dumps({"region": REGION, "spacing": SP, "dots": dots, "routes": routes, "labels": labels},
                                                  separators=(",", ":")) + ";\n")
    print("wrote", out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
