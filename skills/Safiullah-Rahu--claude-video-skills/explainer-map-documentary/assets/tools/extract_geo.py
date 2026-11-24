"""Natural Earth (public domain) → window.GEO for the map-documentary kit: clip + project one region to plate units.

usage:  python -I extract_geo.py <ne_dir> <out_geo.js> [preview.png]
<ne_dir> holds Natural Earth 10m GeoJSON downloaded from github.com/martynafford/natural-earth-geojson
(10m/cultural/ne_10m_admin_0_countries.json, 10m/physical/ne_10m_lakes.json,
 10m/physical/ne_10m_rivers_lake_centerlines.json, 10m/cultural/ne_10m_admin_1_states_provinces.json).
Edit CONFIG for your region. Projection: equirectangular with cos(lat0) x-scaling (fine at country/region scale).
Output keys: W, H, bbox, scale, kx, focus (key of the subject country = first entry of CONFIG.countries), others,
one path per country key, lakes (evenodd: holes are islands/polders), rivers {name: d}, provinces by lower-case name, pts.
Every geometry is an SVG path string in plate units (1 decimal). Rings are clipped exactly to the plate edge.
"""
import json, math, os, sys

CONFIG = dict(
    plate=(1600, 1200),                 # plate units (the kit's K.plate size)
    lat=(50.45, 53.95), lat0=52.15,     # latitude window (plate height) and projection latitude
    lon_c=5.25,                         # centre longitude (plate width follows from the aspect)
    countries={'Netherlands': 'nl', 'Belgium': 'be', 'Germany': 'de', 'United Kingdom': 'uk', 'France': 'fr'},
    lakes=('IJsselmeer', 'Lauwerszee'),
    rivers=('IJssel', 'Nederrijn', 'Lek', 'Rhine', 'Waal', 'Maas', 'Schelde', 'Ems'),
    provinces={'Netherlands': ('Flevoland', 'Zeeland', 'Noord-Holland', 'Zuid-Holland')},
    pts={  # (lon, lat) of real places you will label or aim the camera at
        'amsterdam': (4.90, 52.37), 'rotterdam': (4.48, 51.92), 'schiphol': (4.76, 52.31), 'zuidplas': (4.62, 51.99),
        'northsea': (3.7, 52.85), 'ijsselmeer': (5.33, 52.78), 'flevoland': (5.55, 52.5), 'zeeland': (3.85, 51.5),
        'germany': (7.0, 52.2), 'belgium': (4.6, 51.0)},
    tol=0.35,                           # Douglas-Peucker tolerance in plate units
)

NE, OUT = sys.argv[1], sys.argv[2]
PREV = sys.argv[3] if len(sys.argv) > 3 else None
PW, PH = CONFIG['plate']
LAT_MIN, LAT_MAX = CONFIG['lat']
KX = math.cos(math.radians(CONFIG['lat0']))
SCALE = PH / (LAT_MAX - LAT_MIN)
LON_SPAN = PW / SCALE / KX
LON_MIN, LON_MAX = CONFIG['lon_c'] - LON_SPAN / 2, CONFIG['lon_c'] + LON_SPAN / 2
BOX = (LON_MIN, LAT_MIN, LON_MAX, LAT_MAX)


def P(lon, lat):
    return ((lon - LON_MIN) * KX * SCALE, (LAT_MAX - lat) * SCALE)


def clip_ring(ring):
    x0, y0, x1, y1 = BOX
    def clip(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out
    ix = lambda xc: (lambda a, b: (xc, a[1] + (b[1] - a[1]) * (xc - a[0]) / (b[0] - a[0])))
    iy = lambda yc: (lambda a, b: (a[0] + (b[0] - a[0]) * (yc - a[1]) / (b[1] - a[1]), yc))
    pts = [tuple(p[:2]) for p in ring]
    for inside, inter in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
                          (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts: break
        pts = clip(pts, inside, inter)
    return pts


def dp(pts, tol):
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (ax, ay), (bx, by) = pts[i], pts[j]
        dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1e-9
        best, bi = -1, -1
        for k in range(i + 1, j):
            d = abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / L
            if d > best: best, bi = d, k
        if best > tol:
            keep[bi] = True; stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]


def ring_path(ring, tol):
    c = clip_ring(ring)
    if len(c) < 3: return ''
    pts = [P(*p) for p in c]
    if pts[0] == pts[-1]: pts = pts[:-1]
    if len(pts) < 3: return ''
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    pts = dp(pts[:k + 1], tol) + dp(pts[k:] + [pts[0]], tol)[1:-1]   # closed ring: split so D-P has distinct ends
    return 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z' if len(pts) >= 3 else ''


def poly_path(geom, tol):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    out = []
    for poly in polys:
        for ring in poly:
            xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
            if max(xs) < BOX[0] or min(xs) > BOX[2] or max(ys) < BOX[1] or min(ys) > BOX[3]: continue
            out.append(ring_path(ring, tol))
    return ''.join(out)


def line_path(geom, tol):
    lines = geom['coordinates'] if geom['type'] == 'MultiLineString' else [geom['coordinates']]
    segs, s = [], ''
    for ln in lines:
        seg = []
        for lon, lat, *_ in ln:
            if BOX[0] <= lon <= BOX[2] and BOX[1] <= lat <= BOX[3]: seg.append(P(lon, lat))
            elif seg: segs.append(seg); seg = []
        if seg: segs.append(seg)
    for seg in segs:
        seg = dp(seg, tol)
        if len(seg) > 1: s += 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in seg)
    return s


def load(fn):
    return json.load(open(os.path.join(NE, fn), encoding='utf-8'))['features']


tol = CONFIG['tol']
G = {'W': PW, 'H': PH, 'bbox': [LON_MIN, LAT_MIN, LON_MAX, LAT_MAX], 'lat0': CONFIG['lat0'], 'scale': SCALE, 'kx': KX}
for f in load('ne_10m_admin_0_countries.json'):
    key = CONFIG['countries'].get(f['properties'].get('ADMIN'))
    if key: G[key] = poly_path(f['geometry'], tol)
G['lakes'] = ''.join(poly_path(f['geometry'], tol) for f in load('ne_10m_lakes.json') if f['properties'].get('name') in CONFIG['lakes'])
G['rivers'] = {}
for f in load('ne_10m_rivers_lake_centerlines.json'):
    n = f['properties'].get('name')
    if n in CONFIG['rivers']: G['rivers'][n] = G['rivers'].get(n, '') + line_path(f['geometry'], tol + 0.05)
for f in load('ne_10m_admin_1_states_provinces.json'):
    p = f['properties']
    if p.get('name') in CONFIG['provinces'].get(p.get('admin'), ()):
        G[p['name'].lower().replace('-', '')] = poly_path(f['geometry'], tol * 0.85)
G['pts'] = {k: [round(c, 1) for c in P(*v)] for k, v in CONFIG['pts'].items()}
keys = list(CONFIG['countries'].values())
G['focus'], G['others'] = keys[0], keys[1:]          # kit: K.focus() = subject land, K.others() = context land
with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write('/* Natural Earth 10m (public domain), projected for the map plates by extract_geo.py */\n')
    fh.write('window.GEO = ' + json.dumps(G, separators=(',', ':')) + ';\n')
print('wrote', OUT, os.path.getsize(OUT), 'bytes; lon window', round(LON_MIN, 2), round(LON_MAX, 2))

if PREV:   # quick check of the outlines (holes drawn as outlines only)
    import re
    from PIL import Image, ImageDraw
    im = Image.new('RGB', (PW, PH), (18, 16, 18)); d = ImageDraw.Draw(im)
    rings = lambda s: [[tuple(map(float, q.split(','))) for q in sub[1:-1].split('L')] for sub in re.findall(r'M[^MZ]+Z', s)]
    for k in CONFIG['countries'].values():
        for r in rings(G.get(k, '')): d.polygon(r, fill=(227, 177, 156) if k == list(CONFIG['countries'].values())[0] else (60, 54, 56), outline=(255, 255, 255))
    for r in rings(G['lakes']): d.line(r + [r[0]], fill=(90, 160, 255), width=2)
    for k, (x, y) in G['pts'].items(): d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(255, 120, 40)); d.text((x + 6, y - 6), k, fill=(255, 255, 255))
    im.save(PREV)
