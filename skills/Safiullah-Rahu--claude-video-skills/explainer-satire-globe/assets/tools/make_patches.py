"""Dive patches from NASA Blue Marble Next Generation 21600 px tiles (public domain, NASA Earth Observatory).

usage: python -I make_patches.py <tiles_dir> <out_dir> <hotspots.json>
hotspots.json: [{"id": "hormuz", "lat": 26.6, "lon": 56.3}, ...]
Tiles (world.topo.bathy.200412.3x21600x21600.<T>.jpg) are 90 x 90 degrees at 240 px/deg:
A1..D1 = north (90..0 lat), A2..D2 = south (0..-90); A = 180W..90W, B = 90W..0, C = 0..90E, D = 90E..180.
Each patch spans 17 deg of latitude and 17/cos(lat) deg of longitude (equal ground size), shifted 2.2 deg of arc
east of the hotspot (the film frames the hotspot left of centre), resampled to 4096 x 4096.
Prints the patch bounds as JSON for the globe kit.
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
tiles, out, spots = Path(sys.argv[1]), Path(sys.argv[2]), json.loads(Path(sys.argv[3]).read_text())
out.mkdir(parents=True, exist_ok=True)
PX = 240
SIZE = 4096
LAT_SPAN = 17.0
EAST_SHIFT = 2.2


def tile_of(lat, lon):
    col = "ABCD"[min(3, int((lon + 180) // 90))]
    row = "1" if lat >= 0 else "2"
    return col + row, -180 + "ABCD".index(col) * 90, 90 if row == "1" else 0


cache = {}
res = []
for s in sorted(spots, key=lambda s: tile_of(s["lat"], s["lon"])[0]):
    lat, lon = s["lat"], s["lon"]
    k = 1 / math.cos(math.radians(lat))
    lon_c = lon + EAST_SHIFT * k
    lon_span = LAT_SPAN * k
    b = dict(latMin=lat - LAT_SPAN / 2, latMax=lat + LAT_SPAN / 2, lonMin=lon_c - lon_span / 2, lonMax=lon_c + lon_span / 2)
    name, lon0, lat0 = tile_of(lat, lon)
    if name not in cache:
        cache.clear()
        im = Image.open(tiles / f"world.topo.bathy.200412.3x21600x21600.{name}.jpg")
        im.load()
        cache[name] = im
    im = cache[name]
    box = tuple(round(v) for v in ((b["lonMin"] - lon0) * PX, (lat0 - b["latMax"]) * PX, (b["lonMax"] - lon0) * PX, (lat0 - b["latMin"]) * PX))
    assert box[0] >= 0 and box[1] >= 0 and box[2] <= 21600 and box[3] <= 21600, (s["id"], box)
    # snap the bounds to the integer pixel box actually cut
    b = dict(lonMin=lon0 + box[0] / PX, lonMax=lon0 + box[2] / PX, latMax=lat0 - box[1] / PX, latMin=lat0 - box[3] / PX)
    patch = im.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
    dst = out / f"patch-{s['id']}.jpg"
    patch.save(dst, quality=88, optimize=True)
    res.append(dict(id=s["id"], lat=lat, lon=lon, tile=name, src_px=[box[2] - box[0], box[3] - box[1]], **{k2: round(v, 5) for k2, v in b.items()}))
    print(s["id"], name, box, file=sys.stderr)
print(json.dumps(sorted(res, key=lambda r: [x["id"] for x in spots].index(r["id"])), indent=1))
