/* map-films engine · geo: the rotated d3 mercator in world units, atlas → Path2D, the vintage paper map as a
   cached tile pyramid (half-zoom levels, cross-faded), and screen-space map labels.

   World units: 256 = the globe (web mercator), the projection rotated so the story's lon0 sits at x = 128, far from
   the antimeridian cut. Camera zoom Z draws 2^Z px per unit (Z = slippy-map zoom). */
(function () {
  'use strict';
  const MF = window.MF;
  const TAU = Math.PI * 2;

  /* d3 canvas-context recorder: projected rings in world units */
  class Rec {
    constructor() { this.rings = []; this.cur = null; }
    moveTo(x, y) { this.cur = [x, y]; this.rings.push(this.cur); }
    lineTo(x, y) { this.cur.push(x, y); }
    closePath() { if (this.cur) this.cur.closed = true; }
    arc() {}
    beginPath() {}
  }
  const bboxOf = (rings) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rings) for (let i = 0; i < r.length; i += 2) {
      if (r[i] < x0) x0 = r[i]; if (r[i] > x1) x1 = r[i];
      if (r[i + 1] < y0) y0 = r[i + 1]; if (r[i + 1] > y1) y1 = r[i + 1];
    }
    return [x0, y0, x1, y1];
  };
  const toPath = (rings) => {
    const p = new Path2D();
    for (const r of rings) {
      p.moveTo(r[0], r[1]);
      for (let i = 2; i < r.length; i += 2) p.lineTo(r[i], r[i + 1]);
      if (r.closed) p.closePath();
    }
    return p;
  };
  const hits = (b, x0, y0, x1, y1) => !(b[2] < x0 || b[0] > x1 || b[3] < y0 || b[1] > y1);

  MF.Geo = class {
    constructor(lon0) {
      this.lon0 = lon0;
      this.proj = d3.geoMercator().rotate([-lon0, 0]).scale(256 / TAU).translate([128, 128]).precision(0);
    }
    w(lon, lat) { return this.proj([lon, lat]); }
    unw(x, y) { return this.proj.invert([x, y]); }
    /* km on the ground → world units at a latitude */
    km(km, lat) { return (km / 40075.016686) * 256 / Math.cos((lat * Math.PI) / 180); }
    record(geojson) {
      const rec = new Rec();
      d3.geoPath(this.proj, rec)(geojson);
      return rec.rings.filter((r) => r.length >= 4);
    }
    shape(geojson) { const rings = this.record(geojson); return rings.length ? { path: toPath(rings), bbox: bboxOf(rings), rings } : null; }
    /* a GeoJSON line → world polyline(s) [[x,y],…] (antimeridian-cut in the rotated frame, so story lines stay whole) */
    polylines(geojson) { return this.record(geojson).map((r) => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i], r[i + 1]]); return o; }); }

    /* Gotcha: d3's mercator clip extent paints land over the whole sea when a polygon reaches the pole or is read as
       inverted — so drop Antarctica and every polygon whose d3.geoArea is over 2π. */
    static cleanPolys(geom) {
      const ok = (poly) => d3.geoArea({ type: 'Polygon', coordinates: poly }) <= TAU && !poly[0].some((p) => p[1] < -60);
      if (geom.type === 'Polygon') return ok(geom.coordinates) ? geom : null;
      if (geom.type === 'MultiPolygon') { const c = geom.coordinates.filter(ok); return c.length ? { type: 'MultiPolygon', coordinates: c } : null; }
      return geom;
    }
  };

  /* ── atlas: countries (coloured), land polygons (coast), borders, graticule ───────────────────────────── */
  MF.Atlas = class {
    constructor(geo, topo, opts = {}) {
      this.geo = geo;
      const pal = opts.palette || ['#E6C1A7', '#EEDAA4', '#D2DEB8'];
      const geoms = topo.countries.objects.countries.geometries;
      const feats = topojson.feature(topo.countries, topo.countries.objects.countries).features;
      const nb = topojson.neighbors(geoms);
      // greedy 3-colouring by neighbour count; the story can pin colours by country name
      const order = feats.map((_, i) => i).sort((a, b) => nb[b].length - nb[a].length);
      const col = new Array(feats.length).fill(-1);
      const pin = opts.colors || {};
      feats.forEach((f, i) => { if (pin[f.properties.name] != null) col[i] = pin[f.properties.name]; });
      for (const i of order) {
        if (col[i] >= 0) continue;
        const used = new Set(nb[i].map((j) => col[j]));
        let c = [0, 1, 2].find((k) => !used.has(k));
        if (c == null) c = i % 3;
        col[i] = c;
      }
      this.countries = [];
      feats.forEach((f, i) => {
        if (f.id === '010' || f.properties.name === 'Antarctica') return;
        const g = MF.Geo.cleanPolys(f.geometry);
        if (!g) return;
        const s = geo.shape(g);
        if (s) this.countries.push({ name: f.properties.name, id: f.id, color: pal[col[i]], ...s });
      });
      this.land = [];
      const land = topojson.feature(topo.land, topo.land.objects.land);
      const lgeoms = land.type === 'FeatureCollection' ? land.features.map((f) => f.geometry) : [land.geometry || land];
      for (const lg of lgeoms) {
        const polys = lg.type === 'MultiPolygon' ? lg.coordinates : lg.type === 'Polygon' ? [lg.coordinates] : [];
        for (const poly of polys) {
          const g = MF.Geo.cleanPolys({ type: 'Polygon', coordinates: poly });
          if (!g) continue;
          const s = geo.shape(g);
          if (s) this.land.push(s);
        }
      }
      const mesh = topojson.mesh(topo.countries, topo.countries.objects.countries, (a, b) => a !== b);
      this.borders = geo.shape(mesh);
      const grat = d3.geoGraticule().step([10, 10]).extent([[-180, -80], [180, 80.0001]]).precision(1);
      this.graticule = geo.shape(grat());
    }
  };

  /* ── the paper map tile pyramid ────────────────────────────────────────────────────────────────────────
     512 px tiles at half-zoom levels (2^L px per unit), each with a 3 px bleed so neighbours overlap (no seams).
     A frame at zoom Z draws level ceil(2Z)/2 and cross-fades the level below on top, so line widths and labels never
     pop. Tiles are pure functions of (level, i, j) and are cached (LRU). */
  const TS = 512, BLEED = 3;
  MF.PaperMap = class {
    constructor(geo, atlas50, atlas10, style = {}) {
      this.geo = geo; this.a50 = atlas50; this.a10 = atlas10;
      this.st = Object.assign({
        ocean: '#A9C2C4', land: '#ECE2CA', coast: '#4B3626', coastW: 1.25,
        waterline: [[30, 'rgba(58,98,108,0.085)'], [19, 'rgba(58,98,108,0.11)'], [10, 'rgba(58,98,108,0.15)']],
        border: 'rgba(120,86,56,0.85)', borderW: 1.1, borderDash: [5, 3.5],
        grat: 'rgba(52,72,78,1)', gratAlpha: 0.26, gratW: 0.9, countryAlpha: 0.78,
        res10From: 5.5,
      }, style);
      this.cache = new Map();
      this.maxTiles = 360;
      this.extras = [];   // story overlays baked into tiles: [{path, stroke, width, dash, fill}]
    }
    atlasFor(L) { return L >= this.st.res10From || !this.a50 ? this.a10 : this.a50; }
    tile(L, i, j) {
      const key = L + ':' + i + ':' + j;
      let c = this.cache.get(key);
      if (c) { this.cache.delete(key); this.cache.set(key, c); return c; }
      c = this.render(L, i, j);
      this.cache.set(key, c);
      if (this.cache.size > this.maxTiles) this.cache.delete(this.cache.keys().next().value);
      return c;
    }
    render(L, i, j) {
      const s = Math.pow(2, L), st = this.st, A = this.atlasFor(L);
      const c = document.createElement('canvas');
      c.width = c.height = TS + 2 * BLEED;
      const x = c.getContext('2d');
      x.fillStyle = st.ocean; x.fillRect(0, 0, c.width, c.height);
      const ox = i * TS - BLEED, oy = j * TS - BLEED;
      x.setTransform(s, 0, 0, s, -ox, -oy);
      const m = 34 / s;  // widest stroke reach
      const wx0 = ox / s - m, wy0 = oy / s - m, wx1 = (ox + c.width) / s + m, wy1 = (oy + c.height) / s + m;
      const land = A.land.filter((p) => hits(p.bbox, wx0, wy0, wx1, wy1));
      x.lineJoin = 'round'; x.lineCap = 'round';
      for (const [w, col] of st.waterline) {          // 3 soft water-lining strokes under the land
        x.strokeStyle = col; x.lineWidth = w / s;
        for (const p of land) x.stroke(p.path);
      }
      x.fillStyle = st.land;
      for (const p of land) x.fill(p.path);
      x.globalAlpha = st.countryAlpha;
      for (const cn of A.countries) if (hits(cn.bbox, wx0, wy0, wx1, wy1)) { x.fillStyle = cn.color; x.fill(cn.path); }
      x.globalAlpha = 1;
      for (const e of this.extras) if (!e.bbox || hits(e.bbox, wx0, wy0, wx1, wy1)) {
        if (e.fill) { x.fillStyle = e.fill; x.fill(e.path); }
        if (e.stroke) { x.strokeStyle = e.stroke; x.lineWidth = e.width / s; x.setLineDash((e.dash || []).map((d) => d / s)); x.stroke(e.path); x.setLineDash([]); }
      }
      if (A.borders) {
        x.strokeStyle = st.border; x.lineWidth = st.borderW / s; x.setLineDash(st.borderDash.map((d) => d / s));
        x.stroke(A.borders.path); x.setLineDash([]);
      }
      x.strokeStyle = st.coast; x.lineWidth = st.coastW / s;
      for (const p of land) x.stroke(p.path);
      x.globalAlpha = st.gratAlpha; x.strokeStyle = st.grat; x.lineWidth = st.gratW / s;
      x.stroke(A.graticule.path);
      x.globalAlpha = 1;
      return c;
    }
    /* draw at camera `cam` (MF.Cam) */
    draw(ctx, cam) {
      const Z = cam.Z;
      const hi = Math.ceil(Z * 2 - 1e-6) / 2, lo = hi - 0.5;
      const wLo = MF.clamp((hi - Z) / 0.5);
      this.drawLevel(ctx, cam, hi, 1);
      if (wLo > 0.004) this.drawLevel(ctx, cam, lo, wLo);
    }
    drawLevel(ctx, cam, L, alpha) {
      const s = Math.pow(2, L), tw = TS / s, b = BLEED / s;
      const [x0, y0, x1, y1] = cam.worldBounds(4);
      const i0 = Math.floor(x0 / tw), i1 = Math.floor(x1 / tw), j0 = Math.max(0, Math.floor(y0 / tw)), j1 = Math.min(Math.floor(y1 / tw), Math.ceil(256 / tw) - 1);
      ctx.save();
      cam.apply(ctx);
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingQuality = 'high';
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        ctx.drawImage(this.tile(L, i, j), i * tw - b, j * tw - b, tw + 2 * b, tw + 2 * b);
      }
      ctx.restore();
    }
  };

  /* ── map labels: Cormorant Garamond 700, letter-spaced, 8–16 px, constant size on screen ──────────────── */
  MF.drawMapLabels = function (ctx, cam, labels, alpha, geo) {
    if (alpha <= 0.01) return;
    for (const lb of labels) {
      const [zmin, zmax] = lb.z || [-99, 99];
      const a = alpha * MF.smooth(zmin - 0.35, zmin + 0.15, cam.Z) * (1 - MF.smooth(zmax - 0.15, zmax + 0.35, cam.Z)) * (lb.alpha == null ? 1 : lb.alpha);
      if (a <= 0.01) continue;
      if (!lb._w) lb._w = geo.w(lb.at[0], lb.at[1]);
      const [sx, sy] = cam.toScreen(lb._w[0], lb._w[1]);
      if (sx < -400 || sy < -100 || sx > cam.W + 400 || sy > cam.H + 100) continue;
      const size = (lb.size || 12) * (MF.fmt === '9x16' ? 1.2 : 1);   // 8–16 px; ×1.2 on the 1080-wide reel
      const kind = lb.kind || 'place';
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(sx, sy);
      ctx.rotate(((lb.rot || 0) * Math.PI) / 180 + cam.rot);
      ctx.font = `700 ${size}px "Cormorant Garamond"`;
      ctx.letterSpacing = `${(lb.spacing != null ? lb.spacing : kind === 'sea' ? 0.42 : kind === 'country' ? 0.34 : 0.12) * size}px`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = lb.color || (kind === 'sea' ? '#3F626B' : kind === 'country' ? '#5A4030' : '#4A3828');
      const lines = String(lb.text).split('\n');
      const dot = kind === 'place' && lb.dot !== false;
      const dy = dot ? -size * 1.0 : 0;
      lines.forEach((t, k) => {
        ctx.fillText(lb.caps === false ? t : t.toUpperCase(), 0, dy + (k - (lines.length - 1) / 2) * size * 1.25);
      });
      if (dot) { ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  };
})();
