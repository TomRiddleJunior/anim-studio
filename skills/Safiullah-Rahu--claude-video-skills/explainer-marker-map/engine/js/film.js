/* map-films engine · film: camera, story compiler, frame renderer (motion-blur subframes accumulated in WebGL),
   paper/grain/vignette post, HUD, and the render API on window.__mf.

   Camera = focus point (world) + its screen offset + zoom Z (2^Z px per unit). Moves interpolate Z linearly under a
   quartic in-out ease; the focus moves zoom-aware (a fixed pivot), so pull-outs read like Google Earth.
   Every frame is a pure function of t. The page's globals are MF.* and window.__mf only (never a name a renderer
   might inject — a collision renders black frames while stills look fine). */
(function () {
  'use strict';
  const MF = window.MF;
  const Q = new URLSearchParams(location.search);
  const FMT = Q.get('fmt') === '9x16' ? '9x16' : '16x9';
  const V = FMT === '9x16';
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080, FPS = +(Q.get('fps') || 30);
  const SLUG = Q.get('story') || 'diomede';
  const DUMP = Q.get('dump') === '1';

  MF.fmt = FMT; MF.W = W; MF.H = H; MF.FPS = FPS;
  MF.story = (cfg) => { MF._story = cfg; };

  /* ── camera ─────────────────────────────────────────────────────────────────────────────────────────── */
  MF.Cam = class {
    constructor(W, H, F, Z, C, rot = 0, dx = 0, dy = 0) {
      this.W = W; this.H = H; this.F = F; this.Z = Z; this.S = Math.pow(2, Z); this.C = C;
      this.rot = rot; this.dx = dx; this.dy = dy; this.cs = Math.cos(rot); this.sn = Math.sin(rot);
    }
    toScreen(x, y) {
      const px = (x - this.F[0]) * this.S + this.C[0] - this.W / 2, py = (y - this.F[1]) * this.S + this.C[1] - this.H / 2;
      return [this.W / 2 + px * this.cs - py * this.sn + this.dx, this.H / 2 + px * this.sn + py * this.cs + this.dy];
    }
    fromScreen(sx, sy) {
      const qx = sx - this.W / 2 - this.dx, qy = sy - this.H / 2 - this.dy;
      const px = qx * this.cs + qy * this.sn, py = -qx * this.sn + qy * this.cs;
      return [(px - this.C[0] + this.W / 2) / this.S + this.F[0], (py - this.C[1] + this.H / 2) / this.S + this.F[1]];
    }
    shake(x, y) {   // a screen point carried by the handheld drift + shake only
      const px = x - this.W / 2, py = y - this.H / 2;
      return [this.W / 2 + px * this.cs - py * this.sn + this.dx, this.H / 2 + px * this.sn + py * this.cs + this.dy];
    }
    apply(ctx) {
      const S = this.S, c = this.cs, s = this.sn;
      const ux = this.C[0] - this.W / 2 - this.F[0] * S, uy = this.C[1] - this.H / 2 - this.F[1] * S;
      ctx.setTransform(S * c, S * s, -S * s, S * c, this.W / 2 + this.dx + c * ux - s * uy, this.H / 2 + this.dy + s * ux + c * uy);
    }
    worldBounds(m = 0) {
      const P = [[-m, -m], [this.W + m, -m], [-m, this.H + m], [this.W + m, this.H + m]].map(([x, y]) => this.fromScreen(x, y));
      return [Math.min(...P.map((p) => p[0])), Math.min(...P.map((p) => p[1])), Math.max(...P.map((p) => p[0])), Math.max(...P.map((p) => p[1]))];
    }
  };
  MF.Cam.identity = new MF.Cam(0, 0, [0, 0], 0, [0, 0]);
  MF.Cam.identity.shake = (x, y) => [x, y];

  /* ── the film ───────────────────────────────────────────────────────────────────────────────────────── */
  class Film {
    constructor(cfg, timing, mosaics) {
      this.raw = cfg;
      this.cfg = MF.resolveFmt(cfg, V);
      this.tm = timing ? new MF.Timing(timing) : null;
      this.mosaics = mosaics;
      this.W = W; this.H = H; this.fps = FPS;
      this.geo = new MF.Geo(this.cfg.lon0);
      this.cues = [];
      this.elements = [];
      this.stamps = [];
      this.camCache = new Map();
    }
    key(k) { return this.tm.key(k); }
    place(p) {
      if (Array.isArray(p)) return this.geo.w(p[0], p[1]);
      const ll = this.cfg.places && this.cfg.places[p];
      if (!ll) throw new Error(`unknown place "${p}"`);
      return this.geo.w(ll[0], ll[1]);
    }
    sfx(t, type, o = {}) { this.cues.push(Object.assign({ t: +t.toFixed(3), type }, o)); }

    /* named lines: {geo: '<NE geographic line name>', lat: [south, north], replace: [{lat: [a, b], lon}], coords: [[lon,lat]…]} */
    lineWorld(name) {
      this._lines = this._lines || {};
      if (this._lines[name]) return this._lines[name];
      const L = (this.cfg.lines || {})[name];
      if (!L) throw new Error(`unknown line "${name}"`);
      let ll;
      if (L.coords) ll = L.coords.slice();
      else {
        const f = MF_LINES.features.find((f) => f.properties.name === L.geo);
        if (!f) throw new Error(`no geographic line "${L.geo}"`);
        // join the parts into one polyline in the rotated frame, north → south
        const parts = (f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates]).map((p) => p.slice());
        parts.forEach((p) => { if (p[0][1] < p[p.length - 1][1]) p.reverse(); });
        parts.sort((a, b) => b[0][1] - a[0][1]);
        ll = [];
        for (const p of parts) for (const q of p) { const last = ll[ll.length - 1]; if (!last || Math.abs(last[1] - q[1]) > 1e-6 || Math.abs(((last[0] - q[0] + 540) % 360) - 180) > 1e-6) ll.push(q); }
        // drop the duplicate vertices where parts meet at ±180
        ll = ll.filter((q, i) => i === 0 || !(Math.abs(Math.abs(q[0]) - 180) < 1e-3 && Math.abs(Math.abs(ll[i - 1][0]) - 180) < 1e-3 && Math.abs(q[1] - ll[i - 1][1]) < 1e-3));
      }
      for (const r of L.replace || []) ll = ll.map(([lon, lat]) => (lat >= r.lat[0] && lat <= r.lat[1] ? [r.lon, lat] : [lon, lat]));
      if (L.lat) {   // clip to a latitude band, interpolating the cut points so adjacent bands meet exactly
        const [lo, hi] = L.lat, inb = (q) => q[1] >= lo && q[1] <= hi, o = [];
        const cut = (a, b, y) => { const u = (y - a[1]) / (b[1] - a[1]); let dl = ((b[0] - a[0] + 540) % 360) - 180; return [a[0] + dl * u, y]; };
        for (let i = 0; i < ll.length; i++) {
          const q = ll[i], p = ll[i - 1];
          if (p) for (const y of [hi, lo]) if ((p[1] - y) * (q[1] - y) < 0) o.push(cut(p, q, y));
          if (inb(q)) o.push(q);
        }
        ll = o;
      }
      if (L.reverse) ll.reverse();
      if (L.extend) { ll.unshift([ll[0][0], 85]); ll.push([ll[ll.length - 1][0], -85]); }
      const w = ll.map(([lon, lat]) => this.geo.w(lon, lat));
      // dense resample in lon/lat is unnecessary: mercator keeps meridian and parallel segments straight
      return (this._lines[name] = w);
    }

    /* ── camera track ─────────────────────────────────────────────────────────────────────────────────── */
    compileCamera() {
      const cams = this.cfg.camera;
      const init = cams[0];
      const st = (e, prev) => ({
        f: e.focus != null ? this.place(e.focus) : prev.f,
        z: e.z != null ? e.z : prev.z,
        c: e.off != null ? [W / 2 + e.off[0], H / 2 + e.off[1]] : prev.c,
      });
      this.cam0 = st(init, { f: [128, 128], z: 4, c: [W / 2, H / 2] });
      this.moves = [];
      for (const e of cams.slice(1)) {
        const t0 = this.key(e.at);
        const t1 = e.to != null ? this.key(e.to) : t0 + (e.dur != null ? e.dur : 1.3);
        const from = this.camState(t0);
        const to = st(e, from);
        const ease = e.ease || (Math.abs(to.z - from.z) > 0.6 ? 'quart' : 'sine');
        this.moves.push({ t0, t1: Math.max(t1, t0 + 0.05), from, to, ease });
        const dz = to.z - from.z;
        if (Math.abs(dz) > 1.5 && e.sfx !== false) this.sfx(t0, dz < 0 ? 'whoosh_out' : 'whoosh_in', { dur: t1 - t0 });
      }
    }
    camState(t) {
      let s = this.cam0;
      for (const m of this.moves || []) {
        if (t < m.t0) break;
        const u = MF.ease[m.ease](MF.clamp((t - m.t0) / (m.t1 - m.t0)));
        const A = m.from, B = m.to;
        const z = A.z + (B.z - A.z) * u;
        let w = u;
        if (Math.abs(B.z - A.z) > 0.05) w = (Math.pow(2, -z) - Math.pow(2, -A.z)) / (Math.pow(2, -B.z) - Math.pow(2, -A.z));
        s = { z, f: [A.f[0] + (B.f[0] - A.f[0]) * w, A.f[1] + (B.f[1] - A.f[1]) * w], c: [A.c[0] + (B.c[0] - A.c[0]) * u, A.c[1] + (B.c[1] - A.c[1]) * u] };
      }
      return s;
    }
    camAt(t) {
      const k = Math.round(t * 48000);
      let c = this.camCache.get(k);
      if (c) return c;
      const s = this.camState(t);
      const tau = Math.PI * 2;
      const D = this.cfg.drift || { px: 2, deg: 0.06 };
      let dx = D.px * (0.62 * Math.sin(tau * 0.11 * t + 1.3) + 0.38 * Math.sin(tau * 0.27 * t + 4.1));
      let dy = D.px * (0.6 * Math.sin(tau * 0.09 * t + 0.2) + 0.4 * Math.sin(tau * 0.23 * t + 2.6));
      let rot = (D.deg * Math.PI / 180) * (0.7 * Math.sin(tau * 0.07 * t + 0.5) + 0.3 * Math.sin(tau * 0.19 * t + 1.9));
      for (const ti of this.stamps) {   // 16 px decaying shake on every stamp impact
        const d = t - ti;
        if (d < 0 || d > 0.9) continue;
        const env = 16 * Math.exp(-d / 0.14);
        dx += env * MF.noise(t * 31, 11); dy += env * MF.noise(t * 31, 23); rot += env * 0.0006 * MF.noise(t * 23, 5);
      }
      c = new MF.Cam(W, H, s.f, s.z, s.c, rot, dx, dy);
      if (this.camCache.size > 4096) this.camCache.clear();
      this.camCache.set(k, c);
      return c;
    }

    /* ── events → elements ────────────────────────────────────────────────────────────────────────────── */
    compileEvents() {
      const E = this.elements, geo = this.geo;
      const out = (e) => (e.out != null ? this.key(e.out) : null);
      const anchorOf = (e) => (e.place != null ? this.place(e.place) : null);
      let seed = 1;
      for (const e of this.cfg.events) {
        seed++;
        const t0 = e.at != null ? this.key(e.at) : null;
        const s = e.seed || seed * 7;
        switch (e.type) {
          case 'circle': {
            const c = anchorOf(e);
            let pts, space = 'world';
            if (e.km) { const lat = geo.unw(c[0], c[1])[1]; const rx = geo.km(e.km[0], lat), ry = geo.km(e.km[1], lat); pts = MF.circlePts(rx, ry, e.turns || 1.12, s, e.tilt || 0).map(([x, y]) => [c[0] + x, c[1] + y]); }
            else { pts = MF.circlePts(e.px[0], e.px[1], e.turns || 1.12, s, e.tilt || 0); space = 'anchor'; }
            E.push({ layer: 3, el: new MF.Stroke({ pts, space, anchor: c, t0, dur: e.dur || 0.6, t1: out(e), width: e.width || 9, seed: s, ink: MF.inkSet(e.ink) }) });
            this.sfx(t0, 'marker', { dur: e.dur || 0.6 });
            break;
          }
          case 'write': {
            const ink = MF.inkSet(e.ink);
            const h = new MF.Hand(Object.assign({ text: e.text, t0, dur: e.dur, t1: out(e), size: e.size || 66, rot: e.rot != null ? e.rot : -5, anchor: anchorOf(e), screen: e.screen, off: e.off || [0, 0], align: e.align || 'center', seed: s }, ink ? { color: ink.core, under: ink.under, hi: ink.hi } : {}));
            E.push({ layer: 4, el: h });
            this.sfx(t0, 'scribble', { dur: h.o.dur });
            break;
          }
          case 'stroke': case 'border': {
            let pts;
            if (e.line) pts = this.lineWorld(e.line);
            else pts = e.coords.map(([lon, lat]) => geo.w(lon, lat));
            if (e.type === 'border') {
              E.push({ layer: 2, el: new MF.Stroke({ pts, t0, dur: e.dur || 1.0, t1: out(e), width: e.width || 2.4, seed: s, dash: e.dash || [9, 7], ease: 'inOut', alpha: 0.9, ink: MF.inkSet(e.ink) }), border: true });
              this.sfx(t0, 'pen', { dur: e.dur || 1.0 });
            } else {
              const origin = e.from != null ? this.fractionNear(pts, this.place(e.from)) : null;
              E.push({ layer: 3, el: new MF.Stroke({ pts, t0, dur: e.dur || 0.8, t1: out(e), width: e.width || 8, seed: s, dash: e.dash, ease: e.ease || 'inOut', origin, ink: MF.inkSet(e.ink) }) });
              if (e.sfx !== false) this.sfx(t0, 'marker', { dur: e.dur || 0.8 });
            }
            break;
          }
          case 'measure': {
            const a = this.place(e.from), b = this.place(e.to);
            const sx = b[0] - a[0], sy = b[1] - a[1], L = Math.hypot(sx, sy), nx = -sy / L, ny = sx / L;
            const lat = geo.unw(a[0], a[1])[1], tick = geo.km(e.tickKm || 0.45, lat);
            E.push({ layer: 3, el: new MF.Stroke({ pts: [a, b], t0, dur: e.dur || 0.6, t1: out(e), width: e.width || 7, seed: s, dash: [20, 15], ease: 'inOut', ink: MF.inkSet(e.ink) }) });
            E.push({ layer: 3, el: new MF.Stroke({ pts: [[a[0] - nx * tick, a[1] - ny * tick], [a[0] + nx * tick, a[1] + ny * tick]], t0: t0 - 0.12, dur: 0.14, t1: out(e), width: e.width || 7, seed: s + 1, ink: MF.inkSet(e.ink) }) });
            E.push({ layer: 3, el: new MF.Stroke({ pts: [[b[0] - nx * tick, b[1] - ny * tick], [b[0] + nx * tick, b[1] + ny * tick]], t0: t0 + (e.dur || 0.6), dur: 0.14, t1: out(e), width: e.width || 7, seed: s + 2, ink: MF.inkSet(e.ink) }) });
            this.sfx(t0, 'marker', { dur: (e.dur || 0.6) + 0.15 });
            break;
          }
          case 'tag': case 'count': case 'strip': case 'calendar': case 'stamp': case 'tracker': case 'endcard': case 'clock': case 'passport': case 'pricetag': {
            const o = Object.assign({}, e, { t0, t1: out(e), anchor: anchorOf(e), seed: s });
            if (e.sweepAt) o.sweepAt = this.key(e.sweepAt);                                         // clock
            if (e.sweepTo) o.sweepDur = this.key(e.sweepTo) - (o.sweepAt != null ? o.sweepAt : t0 + 0.25);
            if (e.stamps) o.stamps = e.stamps.map((st) => Object.assign({}, st, { t: st.at != null ? this.key(st.at) : null }));   // passport
            if (e.subAt) o.subAt = this.key(e.subAt);
            if (e.countAt) o.countAt = this.key(e.countAt);
            if (e.countTo) o.countDur = this.key(e.countTo) - (o.countAt != null ? o.countAt : t0);
            if (e.hlAt) o.hlAt = this.key(e.hlAt);
            if (e.flipAt) o.flipAt = this.key(e.flipAt);
            if (e.scribbleAt) o.scribbleAt = this.key(e.scribbleAt);
            if (e.replaceAt) o.replaceAt = this.key(e.replaceAt);
            if (e.rows) o.rows = e.rows.map((r) => Object.assign({}, r, r.timer ? { timer: Object.assign({}, r.timer, { t0: this.key(r.timer.at), t1: this.key(r.timer.end) }) } : {}, r.at ? { valueAt: this.key(r.at) } : {}));
            const cls = { tag: MF.Tag, count: MF.CountTag, strip: MF.Strip, calendar: MF.Calendar, stamp: MF.Stamp, tracker: MF.Tracker, endcard: MF.EndCard, clock: MF.Clock, passport: MF.Passport, pricetag: MF.PriceTag }[e.type];
            const el = new cls(o, this);
            E.push({ layer: e.type === 'stamp' ? 7 : 5, el, z: e.z || 0 });
            if (e.type === 'stamp') { this.stamps.push(t0); this.sfx(t0, 'impact'); }
            else this.sfx(t0, 'slide');
            if (e.sub && o.subAt != null) this.sfx(o.subAt, 'typing', { dur: e.sub.length / (o.cps || 26) });
            if (o.hlAt != null) this.sfx(o.hlAt, 'highlight', { dur: o.hlDur || 0.4 });
            if (o.flipAt != null) this.sfx(o.flipAt, 'page');
            if (o.scribbleAt != null) this.sfx(o.scribbleAt, 'scribble', { dur: 0.5 });
            if (o.replaceAt != null) this.sfx(o.replaceAt, 'scribble', { dur: 0.3 + 0.05 * (e.replace || '').length });
            if (e.type === 'count') this.sfx(o.countAt != null ? o.countAt : t0, 'tick', { dur: o.countDur || 0.9 });
            if (e.type === 'tracker') for (const r of o.rows) if (r.timer) this.sfx(r.timer.t0, 'tick', { dur: r.timer.t1 - r.timer.t0 });
            if (e.type === 'clock') this.sfx(el.o.sweepAt != null ? el.o.sweepAt : t0 + 0.25, 'tick', { dur: el.o.sweepDur });
            if (e.type === 'passport') el.stampT.forEach((ts) => this.sfx(ts, 'impact', { gain: e.stampGain != null ? e.stampGain : -13 }));
            break;
          }
          case 'path': {
            const pts = e.coords.map(([lon, lat]) => geo.w(lon, lat));
            const o = { pts, t0, tEnd: this.key(e.end), t1: out(e) };
            if (e.cross) {
              o.crossAt = this.key(e.cross.at);
              o.crossFrac = this.crossFraction(pts, this.lineWorld(e.cross.line));
            }
            E.push({ layer: 4, el: new MF.SwimPath(o) });
            this.sfx(t0, e.sfx || 'splash');
            break;
          }
          case 'split': {
            E.push({ layer: 1, el: new Split(this, e, t0, out(e)) });
            this.sfx(t0, 'swish');
            for (const lb of e.labels || []) this.sfx(this.key(lb.at || e.at) + 0.05, 'slide');
            break;
          }
          case 'area': {
            E.push({ layer: e.layer != null ? e.layer : 2, el: new Area(this, e, t0, out(e)) });
            if (e.sfx !== false) this.sfx(t0, e.sfx || 'highlight', { dur: e.fade || 0.35 });
            break;
          }
          case 'sfx': this.sfx(t0, e.sound, { dur: e.dur, gain: e.gain }); break;
          default: throw new Error(`unknown event type "${e.type}"`);
        }
      }
      E.forEach((x, i) => (x.i = i));
      E.sort((a, b) => a.layer - b.layer || (a.z || 0) - (b.z || 0) || a.i - b.i);
      this.cues.sort((a, b) => a.t - b.t);
    }
    fractionNear(path, p) {     // arc-length fraction of the point on `path` nearest to world point p
      let best = Infinity, at = 0, acc = 0;
      const segs = [];
      for (let i = 1; i < path.length; i++) segs.push(Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
      const total = segs.reduce((a, b) => a + b, 0);
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i], L = segs[i - 1];
        const u = L ? MF.clamp(((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (L * L)) : 0;
        const d = Math.hypot(a[0] + (b[0] - a[0]) * u - p[0], a[1] + (b[1] - a[1]) * u - p[1]);
        if (d < best) { best = d; at = acc + u * L; }
        acc += L;
      }
      return total ? at / total : 0;
    }
    crossFraction(path, line) {
      let acc = 0;
      const total = path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) : 0), 0);
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let j = 1; j < line.length; j++) {
          const c = line[j - 1], d = line[j];
          const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
          if (Math.abs(den) < 1e-15) continue;
          const u = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
          const v = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) return (acc + u * seg) / total;
        }
        acc += seg;
      }
      return 0.5;
    }

    async build() {
      const cfg = this.cfg;
      if (!DUMP) {
        this.atlas50 = new MF.Atlas(this.geo, MF_ATLAS50, cfg.paper || {});
        this.atlas10 = new MF.Atlas(this.geo, MF_ATLAS10, cfg.paper || {});
        this.paper = new MF.PaperMap(this.geo, this.atlas50, this.atlas10, (cfg.paper || {}).style);
        this.sat = await new MF.Satellite(this.mosaics, `../${SLUG}/tiles/`, W, H, cfg.satStyle).load();
        this.labels = ((cfg.paper || {}).labels || []).map((l) => Object.assign({}, l));
      }
      this.compileCamera();
      this.compileEvents();
      this.duration = this.tm.duration;
      if (!DUMP) this.setupCanvases();
    }

    /* ── rendering ────────────────────────────────────────────────────────────────────────────────────── */
    setupCanvases() {
      this.out = document.getElementById('out');
      this.out.width = W; this.out.height = H;
      this.ox = this.out.getContext('2d');
      this.scene = document.createElement('canvas'); this.scene.width = W; this.scene.height = H;
      this.sx = this.scene.getContext('2d');
      try { this.acc = new Accum(W, H); } catch (err) { console.warn('no WebGL accumulation: ' + err.message); this.acc = null; }
      const g = this.ox.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.56);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(236,214,186,0.5)'); g.addColorStop(1, 'rgba(176,138,98,1)');
      this.vignette = g;
      this.grainPat = this.ox.createPattern(this.grainImg, 'repeat');
    }
    /* music plan for the mixer: story.sound = {bpm, sections: [{at: key, energy 0-3}], hit: key} (keys → seconds) */
    soundPlan() {
      const S = this.cfg.sound || {};
      const sections = (S.sections || [{ at: 'START', energy: 1 }]).map((x) => ({ t: this.key(x.at), energy: x.energy }));
      return { bpm: S.bpm || 90, sections, hit: S.hit ? this.key(S.hit) : null, bedDb: S.bedDb, duck: S.duck };
    }
    satAlpha(Z) { return MF.smooth(7.3, 9.3, Z); }
    drawScene(ctx, t) {
      const cam = this.camAt(t);
      const sa = this.satAlpha(cam.Z);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (sa < 0.999) {
        ctx.fillStyle = this.paper.st.ocean; ctx.fillRect(0, 0, W, H);
        this.paper.draw(ctx, cam);
        MF.drawMapLabels(ctx, cam, this.labels, 1 - sa, this.geo);
      }
      if (sa > 0.001) this.sat.draw(ctx, cam, sa);
      for (const x of this.elements) {
        ctx.save();
        x.el.draw(ctx, t, this, cam);
        ctx.restore();
      }
      return cam;
    }
    samplesAt(t) {
      const sh = 0.5 / this.fps, a = this.camAt(t - sh / 2), b = this.camAt(t + sh / 2);
      let d = 0;
      for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) {
        const w = a.fromScreen(x, y), q = b.toScreen(w[0], w[1]);
        d = Math.max(d, Math.hypot(q[0] - x, q[1] - y));
      }
      return { n: Math.round(MF.clamp(Math.ceil(d / 2.5), 8, 40)), disp: d };
    }
    frame(t, opt = {}) {
      const { n: N0, disp } = this.samplesAt(t);
      const N = opt.samples || (this.acc ? N0 : 1);
      let cam;
      if (N > 1 && this.acc) {
        const sh = 0.5 / this.fps;
        this.acc.begin();
        for (let i = 0; i < N; i++) {
          const ti = t - sh / 2 + ((i + 0.5) / N) * sh;
          const c = this.drawScene(this.sx, ti);
          if (i === (N >> 1)) cam = c;
          this.acc.add(this.scene, 1 / N);
        }
        this.acc.resolve();
        this.ox.setTransform(1, 0, 0, 1, 0, 0); this.ox.globalAlpha = 1; this.ox.globalCompositeOperation = 'source-over';
        this.ox.drawImage(this.acc.c, 0, 0);
      } else {
        cam = this.drawScene(this.sx, t);
        this.ox.setTransform(1, 0, 0, 1, 0, 0); this.ox.globalAlpha = 1; this.ox.globalCompositeOperation = 'source-over';
        this.ox.drawImage(this.scene, 0, 0);
      }
      this.post(this.ox, t, cam || this.camAt(t));
      return { samples: N, disp: +disp.toFixed(1), Z: +(cam || this.camAt(t)).Z.toFixed(3) };
    }
    post(x, t, cam) {
      const sa = this.satAlpha(cam.Z);
      const fi = Math.round(t * this.fps);
      // paper texture multiplied over everything: 85 % on paper, 22 % on satellite
      x.globalCompositeOperation = 'multiply';
      x.globalAlpha = MF.lerp(0.85, 0.22, sa);
      x.drawImage(this.paperImg, 0, 0, W, H, 0, 0, W, H);
      // warm vignette
      x.globalAlpha = 0.55; x.fillStyle = this.vignette; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      this.hud(x, t, cam, sa);
      // 7 % film grain (overlay, new offset every frame)
      x.save();
      x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.34;
      x.translate(-Math.floor(MF.hash(fi * 3 + 1) * 512), -Math.floor(MF.hash(fi * 3 + 2) * 512));
      x.fillStyle = this.grainPat; x.fillRect(0, 0, W + 512, H + 512);
      x.restore();
    }
    hud(x, t, cam, sa) {
      const h = this.cfg.hud || {};
      if (sa > 0.02) {
        const [wx, wy] = cam.fromScreen(W / 2, H / 2);
        const [lon, lat] = this.geo.unw(wx, wy);
        const dms = (v, p, n) => { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.floor(((a - d) * 60 - m) * 60); return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″ ${v >= 0 ? p : n}`; };
        const txt = `${dms(lat, 'N', 'S')}   ${dms(((lon + 540) % 360) - 180, 'E', 'W')}`;
        x.save();
        x.globalAlpha = sa;
        if (h.shade) {   // opt-in (story hud: {shade: 0-1}): darken (multiply, keeps the hue) a band behind the bottom row
          const bh = V ? 380 : 120, g = x.createLinearGradient(0, H - bh, 0, H);
          const v = (k) => [0.72, 0.86, 1].map((c) => Math.round(255 * (1 - c * k * h.shade))).join(',');   // warm: sand → brown, not olive
          g.addColorStop(0, 'rgb(255,255,255)'); g.addColorStop(0.45, `rgb(${v(0.7)})`); g.addColorStop(1, `rgb(${v(1)})`);
          x.globalCompositeOperation = 'multiply'; x.fillStyle = g; x.fillRect(0, H - bh, W, bh); x.globalCompositeOperation = 'source-over';
        }
        x.font = `${V ? 30 : 26}px "Special Elite"`; x.textBaseline = 'alphabetic';
        const [rx, ry] = V ? [64, H - 300] : [56, H - 52];
        x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillText(txt, rx + 2, ry + 2);
        x.fillStyle = '#F2EAD6'; x.fillText(txt, rx, ry);
        x.font = `400 ${V ? 15 : 14}px "Oswald"`; x.letterSpacing = '0.5px'; x.textAlign = 'right';
        x.fillStyle = 'rgba(240,234,220,0.78)';
        if (h.shade) { x.fillStyle = 'rgba(244,238,226,0.92)'; x.shadowColor = 'rgba(0,0,0,0.75)'; x.shadowBlur = 3; x.shadowOffsetY = 1; }
        const cr = 'Imagery: Sentinel-2 cloudless 2016 by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016), CC BY 4.0';
        if (V) { x.fillText('Imagery: Sentinel-2 cloudless 2016 by EOX IT Services GmbH', W - 40, H - 52); x.fillText('(contains modified Copernicus Sentinel data 2016), CC BY 4.0', W - 40, H - 32); }
        else x.fillText(cr, W - 40, H - 24);
        x.restore();
      }
      if (sa < 0.98) {
        x.save();
        x.globalAlpha = (1 - sa) * 0.85;
        x.font = `400 ${V ? 15 : 14}px "Oswald"`; x.letterSpacing = '0.6px'; x.textAlign = 'right'; x.fillStyle = '#5A4632';
        x.fillText('Map data: Natural Earth', W - 40, V ? H - 32 : H - 24);
        x.restore();
      }
    }
  }

  /* area: a tinted region of the map (`coords` [[lon, lat]…] or a `line`), fading in at `at`, optionally hatched in
     45° screen-space lines (`hatch` = spacing px, `hatchColor`, `hatchAlpha`, `hatchW`) and edged (`edge` colour,
     `edgeW`); `alpha` (0.3) is the fill, `fade` (0.35 s) the fade-in; exits fade over 0.3 s */
  class Area {
    constructor(film, e, t0, t1) {
      this.e = e; this.t0 = t0; this.t1 = t1;
      this.pts = e.line ? film.lineWorld(e.line) : e.coords.map(([lon, lat]) => film.geo.w(lon, lat));
    }
    draw(ctx, t, film, cam) {
      if (t < this.t0) return;
      const e = this.e;
      let a = MF.ease.out(MF.clamp((t - this.t0) / (e.fade || 0.35)));
      if (this.t1 != null && t > this.t1) a *= 1 - MF.clamp((t - this.t1) / 0.3);
      if (a <= 0.003) return;
      const P = this.pts.map(([x, y]) => cam.toScreen(x, y));
      const path = new Path2D();
      P.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
      path.closePath();
      ctx.save();
      ctx.globalAlpha = a * (e.alpha != null ? e.alpha : 0.3);
      ctx.fillStyle = e.color || MF.INK.core;
      ctx.fill(path);
      if (e.hatch) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        x0 = Math.max(x0, -60); y0 = Math.max(y0, -60); x1 = Math.min(x1, W + 60); y1 = Math.min(y1, H + 60);
        if (x1 > x0 && y1 > y0) {
          ctx.clip(path);
          ctx.globalAlpha = a * (e.hatchAlpha != null ? e.hatchAlpha : 0.6);
          ctx.strokeStyle = e.hatchColor || e.color || MF.INK.core; ctx.lineWidth = e.hatchW || 3; ctx.lineCap = 'round';
          const h = y1 - y0, g = e.hatch;
          ctx.beginPath();
          for (let s = Math.floor((x0 - h) / g) * g; s < x1; s += g) { ctx.moveTo(s, y1); ctx.lineTo(s + h, y0); }
          ctx.stroke();
        }
      }
      ctx.restore();
      if (e.edge) { ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = e.edge; ctx.lineWidth = e.edgeW || 2; ctx.lineJoin = 'round'; ctx.stroke(path); ctx.restore(); }
    }
  }

  /* split frame: two tinted sides divided by a real line, with paper tags naming each side */
  class Split {
    constructor(film, e, t0, t1) {
      this.f = film; this.e = e; this.t0 = t0; this.t1 = t1;
      this.line = film.lineWorld(e.line);
      this.holes = e.holes ? e.holes.map((ring) => ring.map(([lon, lat]) => film.geo.w(lon, lat))) : null;   // left untinted
      this.tags = (e.labels || []).map((lb, i) => {
        const tag = new MF.Tag({ title: lb.text, sub: lb.sub, color: (e[lb.side] || (lb.side === 'west' ? e.west : e.east)).color, tsize: lb.size || 40, ssize: 24, t0: film.key(lb.at || e.at) + 0.05 * (i + 1), t1: lb.out != null ? film.key(lb.out) : t1, rot: lb.rot != null ? lb.rot : (lb.side === 'west' || lb.side === 'north' ? -2.5 : 2), seed: 40 + i, tape: true, screen: [0, 0] }, film);
        tag.lb = lb;
        return tag;
      });
    }
    /* optional `holes: [[[lon, lat]…]…]`: regions both tints leave out (no-op without holes) */
    clipHoles(ctx, cam) {
      if (!this.holes) return;
      const p = new Path2D();
      p.rect(-7 * W, -7 * H, 15 * W, 15 * H);
      for (const ring of this.holes) ring.forEach(([x, y], i) => { const [sx, sy] = cam.toScreen(x, y); if (i) p.lineTo(sx, sy); else p.moveTo(sx, sy); });
      ctx.clip(p, 'evenodd');
    }
    screenLine(cam) {
      const P = this.line.map(([x, y]) => cam.toScreen(x, y)).map(([x, y]) => [MF.clamp(x, -4 * W, 5 * W), MF.clamp(y, -4 * H, 5 * H)]);
      return P;
    }
    xAt(P, y) {
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i];
        if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
      }
      return W / 2;
    }
    /* y of the line at screen x (the crossing nearest the frame's middle) — for north/south splits */
    yAt(P, x) {
      let best = null;
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i];
        if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) {
          const y = a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
          if (best == null || Math.abs(y - H / 2) < Math.abs(best - H / 2)) best = y;
        }
      }
      return best == null ? H / 2 : best;
    }
    /* north/south split (story gives north: {…}, south: {…}): the line runs west → east (it may start at the top, like
       141°W); north = the line closed over the top, south = the line closed under the bottom and around the left */
    drawNS(ctx, t, film, cam, a, u, P, alpha) {
      const reach = u * 1.25 * Math.max(W, H), F = P[0], L = P[P.length - 1];
      for (const [side, sign] of [['north', -1], ['south', 1]]) {
        ctx.save();
        this.clipHoles(ctx, cam);
        if (u < 1) {          // reveal: the band between the line and the line shifted `reach` towards this side
          ctx.beginPath();
          ctx.moveTo(F[0], F[1]);
          for (const p of P) ctx.lineTo(p[0], p[1]);
          for (let i = P.length - 1; i >= 0; i--) ctx.lineTo(P[i][0], P[i][1] + sign * reach);
          ctx.closePath();
          ctx.clip();
        }
        ctx.beginPath();
        ctx.moveTo(F[0], F[1]);
        for (const p of P) ctx.lineTo(p[0], p[1]);
        if (side === 'north') { ctx.lineTo(L[0], -6 * H); ctx.lineTo(F[0], -6 * H); }
        else { ctx.lineTo(L[0], 7 * H); ctx.lineTo(-6 * W, 7 * H); ctx.lineTo(-6 * W, -6 * H); ctx.lineTo(F[0], -6 * H); }
        ctx.closePath();
        ctx.globalAlpha = this.e[side].alpha != null ? a * this.e[side].alpha : alpha;
        ctx.fillStyle = this.e[side].color;
        ctx.fill();
        ctx.restore();
      }
      for (const tag of this.tags) {
        const lb = tag.lb, x = lb.x != null ? lb.x : W / 2;
        const y = this.yAt(P, x) + (lb.side === 'north' ? -1 : 1) * (lb.dy != null ? lb.dy : (V ? 150 : 110));
        tag.o.screen = [x, y];
        ctx.save(); tag.draw(ctx, t, film, cam); ctx.restore();
      }
    }
    draw(ctx, t, film, cam) {
      if (t < this.t0) return;
      let a = 1;
      if (this.t1 != null && t > this.t1) { a = 1 - MF.clamp((t - this.t1) / 0.3); if (a <= 0) return; }
      const u = MF.ease.out(MF.clamp((t - this.t0) / 0.45));
      const P = this.screenLine(cam);
      const sa = film.satAlpha(cam.Z);
      const alpha = a * MF.lerp(this.e.alphaPaper || 0.26, this.e.alphaSat || 0.24, sa);
      if (this.e.north && this.e.south) return this.drawNS(ctx, t, film, cam, a, u, P, alpha);
      const reach = u * 1.25 * Math.max(W, H);
      for (const [side, sign] of [['west', -1], ['east', 1]]) {
        ctx.save();
        this.clipHoles(ctx, cam);
        ctx.beginPath();
        ctx.moveTo(P[0][0], -5 * H);
        for (const p of P) ctx.lineTo(p[0], p[1]);
        ctx.lineTo(P[P.length - 1][0], 6 * H);
        ctx.lineTo(P[P.length - 1][0] + sign * reach, 6 * H);
        for (let i = P.length - 1; i >= 0; i--) ctx.lineTo(P[i][0] + sign * reach, P[i][1]);
        ctx.lineTo(P[0][0] + sign * reach, -5 * H);
        ctx.closePath();
        ctx.globalAlpha = this.e[side].alpha != null ? a * this.e[side].alpha : alpha;
        ctx.fillStyle = this.e[side].color;
        ctx.fill();
        ctx.restore();
      }
      for (const tag of this.tags) {
        const lb = tag.lb, y = lb.y != null ? lb.y : (V ? 260 : 150);
        const x = this.xAt(P, y) + (lb.side === 'west' ? -1 : 1) * (lb.dx != null ? lb.dx : (V ? 250 : 260));
        tag.o.screen = [x, y];
        ctx.save(); tag.draw(ctx, t, film, cam); ctx.restore();
      }
    }
  }

  /* ── WebGL2 float accumulation for the motion-blur subframes ─────────────────────────────────────────── */
  class Accum {
    constructor(W, H) {
      const c = (this.c = document.createElement('canvas'));
      c.width = W; c.height = H;
      const gl = (this.gl = c.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false }));
      if (!gl) throw new Error('webgl2 unavailable');
      if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
      gl.getExtension('EXT_float_blend');
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = (fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
      const VS = '#version 300 es\nout vec2 uv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}';
      this.pAdd = prog('#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D s;uniform float w;out vec4 o;void main(){o=vec4(texture(s,uv).rgb*w,w);}');
      this.pRes = prog('#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D s;out vec4 o;void main(){vec4 a=texture(s,uv);o=vec4(a.rgb/max(a.a,1e-6),1.0);}');
      const tex = (fmt, type, ifmt) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); if (ifmt) gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, W, H, 0, fmt, type, null); return t; };
      this.src = tex();
      this.accT = tex(gl.RGBA, gl.FLOAT, gl.RGBA32F);
      this.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.accT, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('float framebuffer incomplete');
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.W = W; this.H = H;
    }
    begin() { const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, this.W, this.H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    add(canvas, w) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.src);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.useProgram(this.pAdd);
      gl.uniform1i(gl.getUniformLocation(this.pAdd, 's'), 0);
      gl.uniform1f(gl.getUniformLocation(this.pAdd, 'w'), w);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    resolve() {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.W, this.H);
      gl.disable(gl.BLEND);
      gl.useProgram(this.pRes);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.accT);
      gl.uniform1i(gl.getUniformLocation(this.pRes, 's'), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  /* ── boot + API ─────────────────────────────────────────────────────────────────────────────────────── */
  const loadScript = (src, optional) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => res(true); s.onerror = () => (optional ? res(false) : rej(new Error('script ' + src)));
    document.head.appendChild(s);
  });
  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image ' + src)); im.src = src; });

  const api = (window.__mf = { state: 'loading', error: null });
  MF.boot = async function () {
    try {
      if (!DUMP) for (const f of ['data/atlas-50m.js', 'data/atlas-10m.js']) await loadScript(f);
      await loadScript('data/lines.js');
      const hasT = await loadScript(`../${SLUG}/vo/timing.js`, true);
      if (!DUMP) await loadScript(`../${SLUG}/tiles/mosaics.js`, true);
      await loadScript(`../${SLUG}/story.js`);
      if (!MF._story) throw new Error('story.js did not call MF.story({...})');
      if (DUMP && !hasT) { api.story = MF._story; api.info = () => ({ story: MF._story, fmt: FMT, W, H }); api.state = 'ready'; return; }
      if (!hasT) throw new Error(`no ${SLUG}/vo/timing.js — run engine/tools/stub.py ${SLUG} (or voice.py + align.py)`);
      const fonts = ['700 54px "Oswald"', '600 24px "Oswald"', '400 14px "Oswald"', '28px "Special Elite"', '64px "Permanent Marker"', '700 14px "Cormorant Garamond"'];
      await Promise.all(fonts.map((f) => document.fonts.load(f)));
      const film = new Film(MF._story, window.MF_TIMING, window.MF_MOSAICS);
      if (!DUMP) [film.paperImg, film.grainImg] = await Promise.all([loadImg('assets/paper.png'), loadImg('assets/grain.png')]);
      await film.build();
      MF.film = film;
      api.film = film;
      api.info = () => ({
        fmt: FMT, W, H, fps: FPS, duration: film.duration, speechEnd: film.tm.speechEnd, stub: !!film.tm.tm.stub,
        story: { slug: film.raw.slug, title: film.raw.title, lon0: film.raw.lon0, sat: film.raw.sat },
        cues: film.cues, words: film.tm.words.map((w) => ({ w: w.w, line: w.line, start: w.start, end: w.end })),
        webgl: !!film.acc,
        sound: film.soundPlan(),
      });
      api.frame = (t, o) => film.frame(t, o || {});
      api.grab = (type = 'image/png', q = 0.95) => film.out.toDataURL(type, q);
      api.frameData = (i, o) => { const r = film.frame(i / FPS, o || {}); return { r, d: film.out.toDataURL((o && o.type) || 'image/png', 0.95) }; };
      api.state = 'ready';
    } catch (err) {
      console.error(err);
      api.error = String(err && err.stack ? err.stack : err);
      api.state = 'error';
    }
  };
})();
