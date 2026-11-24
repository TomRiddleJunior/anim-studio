"""Land dots for the dotted orb: a Fibonacci sphere masked to land.

usage: python -I make_land_dots.py <ne_countries.geojson> <out.js> [N=42000]
Rasterises every Natural Earth country polygon into a 4096x2048 equirectangular mask, keeps the
Fibonacci points that fall on land and writes  window.LAND_DOTS = new Float32Array([lat, lon, ...]).
"""
import json
import math
import sys

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 42000
W, H = 4096, 2048
mask = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(mask)


def px(lon, lat):
    return ((lon + 180) / 360 * W, (90 - lat) / 180 * H)


gj = json.load(open(src, encoding="utf-8"))
for f in gj["features"]:
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for poly in polys:
        for k, ring in enumerate(poly):
            pts = [px(x, y) for x, y in ring]
            if len(pts) > 2:
                d.polygon(pts, fill=255 if k == 0 else 0)
m = mask.load()
golden = math.pi * (3 - math.sqrt(5))
vals = []
for i in range(N):
    y = 1 - (i + 0.5) / N * 2
    lat = math.degrees(math.asin(y))
    lon = math.degrees((i * golden) % (2 * math.pi)) - 180
    x_, y_ = px(lon, lat)
    if m[min(W - 1, int(x_)), min(H - 1, int(y_))] > 0:
        vals += [round(lat, 3), round(lon, 3)]
with open(out, "w", encoding="utf-8") as fo:
    fo.write("/* Land dots: Fibonacci sphere (N=%d) masked by Natural Earth 10m countries (public domain). */\n" % N)
    fo.write("window.LAND_DOTS = new Float32Array([" + ",".join(f"{v:g}" for v in vals) + "]);\n")
print(len(vals) // 2, "land dots")
