/* map-films engine · ink: the boiling red marker (#D9291D) and the handwriting.
   A stroke resamples every ~26 px, wobbles ±1.5 px along its normal (sine + noise re-rolled 8×/s) and is drawn as a
   dark-red underlay 1.6 px wider, the red core, and a 30 % pink highlight offset up-left. Sample positions are fixed
   within each 1/8 s boil step (spacing comes from the camera at the boil time), so zooms carry the ink smoothly and
   it only re-rolls on the boil. */
(function () {
  'use strict';
  const MF = window.MF;
  MF.INK = { core: '#D9291D', under: '#7C120C', hi: 'rgba(255,190,180,0.30)', boilFps: 8, spacing: 26, wobble: 1.5 };

  /* a second marker colour (events' optional `ink`): '#hex' → {core, under (45 % as bright), hi (70 % towards white,
     30 % alpha)}; an object passes through; null/undefined → undefined (the red marker, unchanged) */
  MF.inkSet = function (ink) {
    if (ink == null) return undefined;
    if (typeof ink !== 'string') return ink;
    const n = parseInt(ink.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const hex = (v) => Math.round(v).toString(16).padStart(2, '0');
    const hi = c.map((v) => Math.round(v + (255 - v) * 0.7));
    return { core: ink, under: '#' + c.map((v) => hex(v * 0.45)).join(''), hi: `rgba(${hi.join(',')},0.30)` };
  };

  MF.circlePts = function (rx, ry, turns = 1.12, seed = 1, tilt = 0, start = -1.9) {
    const pts = [], n = Math.max(48, Math.round(90 * turns)), r0 = MF.rng(seed);
    const ph = r0() * 6.28, ph2 = r0() * 6.28, grow = 0.07 + r0() * 0.04;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let i = 0; i <= n; i++) {
      const u = i / n, th = start - u * Math.PI * 2 * turns;           // counter-clockwise on screen, like a hand
      const r = 1 - 0.045 + grow * u + 0.035 * Math.sin(2 * th + ph) + 0.02 * Math.sin(3 * th + ph2);
      const x = rx * r * Math.cos(th), y = ry * r * Math.sin(th);
      pts.push([x * ct - y * st, x * st + y * ct]);
    }
    return pts;
  };

  MF.scribblePts = function (w, h, n = 7, seed = 3) {
    const r = MF.rng(seed), pts = [];
    for (let i = 0; i <= n * 2; i++) {
      const u = i / (n * 2);
      pts.push([-w / 2 + w * u + (r() - 0.5) * 10, (i % 2 ? h / 2 : -h / 2) + (r() - 0.5) * h * 0.18]);
    }
    return pts;
  };

  /* path through points with quadratic smoothing */
  function trace(ctx, P) {
    ctx.moveTo(P[0][0], P[0][1]);
    if (P.length === 2) { ctx.lineTo(P[1][0], P[1][1]); return; }
    for (let i = 1; i < P.length - 1; i++) {
      const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
      ctx.quadraticCurveTo(P[i][0], P[i][1], mx, my);
    }
    const L = P[P.length - 1];
    ctx.lineTo(L[0], L[1]);
  }

  MF.inkPaths = function (ctx, runs, width, alpha, dash, ink) {
    if (!runs.length || alpha <= 0.01) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const I = ink || MF.INK;
    const passes = [[I.under, width + 1.6, 0, 0, 0.95], [I.core, width, 0, 0, 1], [I.hi, width * 0.36, -width * 0.17, -width * 0.2, 1]];
    for (const [col, lw, dx, dy, a] of passes) {
      ctx.globalAlpha = alpha * a;
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      for (const R of runs) if (R.length > 1) { ctx.save(); ctx.translate(dx, dy); trace(ctx, R); ctx.restore(); }
      ctx.stroke();
    }
    ctx.restore();
  };

  MF.Stroke = class {
    /* o: {pts, space: 'world'|'anchor'|'screen', anchor:[wx,wy], t0, dur, t1, width, seed, dash, ease, alpha} */
    constructor(o) {
      this.o = Object.assign({ space: 'world', width: 8, seed: 1, ease: 'inOut', dur: 0.6, t1: null, alpha: 1 }, o);
      const P = this.o.pts;
      this.cum = [0];
      for (let i = 1; i < P.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      this.L = this.cum[this.cum.length - 1];
    }
    progress(t) { const o = this.o; return o.dur <= 0 ? 1 : MF.ease[o.ease](MF.clamp((t - o.t0) / o.dur)); }
    alphaAt(t) {
      const o = this.o;
      if (t < o.t0) return 0;
      let a = o.alpha;
      if (o.t1 != null && t > o.t1) a *= 1 - MF.clamp((t - o.t1) / 0.22);
      return a;
    }
    /* screen-space runs of the drawn part at time t */
    runs(t, film, cam) {
      const o = this.o, P = o.pts, I = MF.INK;
      const b = Math.floor(t * I.boilFps + 1e-6), tb = b / I.boilFps;
      let sp = I.spacing, bounds = null, toS;
      if (o.space === 'world') {
        sp = I.spacing / film.camAt(tb).S;
        bounds = cam.worldBounds(60);
        toS = (x, y) => cam.toScreen(x, y);
      } else if (o.space === 'anchor') {
        const [ax, ay] = cam.toScreen(o.anchor[0], o.anchor[1]), c = Math.cos(cam.rot), s = Math.sin(cam.rot);
        toS = (x, y) => [ax + x * c - y * s, ay + x * s + y * c];
      } else toS = (x, y) => [x, y];
      const p = this.progress(t);
      if (p <= 0) return [];
      // drawn interval: from the start, or outward both ways from an origin fraction (two pen tips)
      const og = o.origin != null ? o.origin * this.L : 0;
      const lo = og * (1 - p), hi = og + (this.L - og) * p;
      if (bounds) { const vis = (bounds[2] - bounds[0]) + (bounds[3] - bounds[1]); if (vis / sp > 6000) sp = vis / 6000; }
      const runs = []; let run = null, lastK = -2;
      const seed = o.seed, ph = seed * 1.7 + b * 2.3;
      const wob = (kf) => I.wobble * (0.6 * Math.sin(kf * 0.9 + ph) + 0.4 * MF.noise(kf * 0.45 + b * 7.13, seed));
      const push = (x, y, kf, k) => {
        if (!run || k !== lastK + 1) { run = []; runs.push(run); }
        run.push([x, y, kf]); lastK = k;
      };
      const lerpP = (i, s) => { const s0 = this.cum[i], s1 = this.cum[i + 1], u = (s - s0) / (s1 - s0); return [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u]; };
      for (let i = 0; i < P.length - 1; i++) {
        const s0 = this.cum[i], s1 = this.cum[i + 1];
        if (s0 > hi) break;
        if (s1 < lo || s1 === s0) continue;
        if (bounds) {
          const bx0 = Math.min(P[i][0], P[i + 1][0]), bx1 = Math.max(P[i][0], P[i + 1][0]);
          const by0 = Math.min(P[i][1], P[i + 1][1]), by1 = Math.max(P[i][1], P[i + 1][1]);
          if (bx1 < bounds[0] || bx0 > bounds[2] || by1 < bounds[1] || by0 > bounds[3]) continue;
        }
        const a = Math.max(s0, lo), e = Math.min(s1, hi);
        let k0 = Math.ceil(a / sp - 1e-9);
        if (lo > s0) {                              // the trailing pen tip (origin strokes)
          const q = lerpP(i, lo);
          run = [[q[0], q[1], lo / sp]]; runs.push(run); lastK = k0 - 1;
        }
        for (let k = k0; k * sp <= e + 1e-9; k++) { const q = lerpP(i, k * sp); push(q[0], q[1], k, k); }
        if (hi < s1 && run) { const q = lerpP(i, hi); run.push([q[0], q[1], hi / sp]); }   // the leading pen tip
      }
      // to screen + normal wobble
      return runs.filter((R) => R.length > 1).map((R) => {
        const S = R.map((p) => toS(p[0], p[1]));
        return S.map((q, i) => {
          const a = S[Math.max(0, i - 1)], c = S[Math.min(S.length - 1, i + 1)];
          let nx = -(c[1] - a[1]), ny = c[0] - a[0];
          const l = Math.hypot(nx, ny) || 1;
          const w = wob(R[i][2]);
          return [q[0] + (nx / l) * w, q[1] + (ny / l) * w];
        });
      });
    }
    draw(ctx, t, film, cam) {
      const a = this.alphaAt(t);
      if (a <= 0.01) return;
      MF.inkPaths(ctx, this.runs(t, film, cam), this.o.width, a, this.o.dash, this.o.ink);
    }
  };

  /* handwriting in Permanent Marker, written on left to right, boiling at 8 fps */
  MF.Hand = class {
    /* o: {text, t0, dur, t1, size, anchor:[wx,wy] | screen:[x,y], off:[dx,dy], rot (deg), align, seed, color} */
    constructor(o) {
      this.o = Object.assign({ size: 64, rot: -5, align: 'center', seed: 7, off: [0, 0], t1: null }, o);
      if (this.o.dur == null) this.o.dur = 0.3 + 0.05 * this.o.text.length;
    }
    pos(cam) {
      const o = this.o;
      let x, y;
      if (o.anchor) [x, y] = cam.toScreen(o.anchor[0], o.anchor[1]); else [x, y] = cam.shake(o.screen[0], o.screen[1]);
      return [x + o.off[0], y + o.off[1]];
    }
    draw(ctx, t, film, cam) {
      const o = this.o;
      if (t < o.t0) return;
      let a = 1;
      if (o.t1 != null && t > o.t1) { a = 1 - MF.clamp((t - o.t1) / 0.22); if (a <= 0) return; }
      const p = MF.ease.outQuad(MF.clamp((t - o.t0) / o.dur));
      const b = Math.floor(t * MF.INK.boilFps + 1e-6);
      const [x, y] = this.pos(cam);
      ctx.save();
      ctx.font = `${o.size}px "Permanent Marker"`;
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '1px';
      const w = ctx.measureText(o.text).width;
      const jx = 0.8 * MF.noise(b * 1.31, o.seed), jy = 0.8 * MF.noise(b * 1.31 + 40, o.seed), jr = 0.005 * MF.noise(b * 0.77 + 9, o.seed);
      ctx.translate(x + jx, y + jy);
      ctx.rotate((o.rot * Math.PI) / 180 + jr + cam.rot);
      const left = o.align === 'left' ? 0 : o.align === 'right' ? -w : -w / 2;
      ctx.beginPath();
      ctx.rect(left - 20, -o.size, (w + 40) * p, o.size * 2);
      ctx.clip();
      ctx.globalAlpha = a;
      ctx.lineJoin = 'round';
      ctx.fillStyle = o.under || MF.INK.under; ctx.strokeStyle = o.under || MF.INK.under; ctx.lineWidth = 1.6;
      ctx.strokeText(o.text, left + 0.6, 0.8); ctx.fillText(o.text, left + 0.6, 0.8);
      ctx.fillStyle = o.color || MF.INK.core; ctx.fillText(o.text, left, 0);
      ctx.fillStyle = o.hi || MF.INK.hi; ctx.fillText(o.text, left - 1.1, -1.2);
      ctx.restore();
    }
  };
})();
