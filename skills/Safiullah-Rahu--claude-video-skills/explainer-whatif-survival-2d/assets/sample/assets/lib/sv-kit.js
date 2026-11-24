/* sv-kit.js — "what-if survival 2D" drawing kit (flat inked cartoon, Canvas 2D, 1080x1920).
   Pure functions of their arguments (seek-exact). The look: flat fills, dark brown ink outlines (4-6 px, round joins,
   a slight seeded wobble that never boils), a static paper grain over the frame, light diagonal scratch hatching on
   cards and tags, stick-limbed characters with big round heads.
   Fonts (registered by compositions/world.html): SVPop = Poppins 600/700/800 (titles, tags, cards), SVHand = Patrick Hand.
   SV.create({canvas}) -> K. */
(function () {
  const SV = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const eout = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const back = (u, k = 1.9) => { u = clamp(u, 0, 1); const c3 = k + 1; return 1 + c3 * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2); };
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  SV.util = { clamp, lerp, sstep, eio, eout, back, rng };

  SV.create = function ({ canvas, width = 1080, height = 1920 }) {
    const ctx = canvas.getContext("2d");
    const W = width, H = height;
    const K = { ctx, W, H, clamp, lerp, sstep, eio, eout, back, rng };
    const fonts = ["800 80px SVPop", "700 40px SVPop", "600 40px SVPop", "400 40px SVHand"];
    K.ready = (document.fonts ? Promise.all(fonts.map((f) => document.fonts.load(f))) : Promise.resolve()).then(() => true);
    const INK = (K.INK = "#2b2420");
    K.COL = { ink: INK, cream: "#efe7d3", cream2: "#e4dbc4", red: "#d93a33", redD: "#a92a25", green: "#2f9e48", greenD: "#23793a",
      yellow: "#f2c230", yellowD: "#c99a1c", blue: "#3b62a8", blueD: "#2b4a85", white: "#f7f4ec", grey: "#8b857a", dark: "#22262c" };

    // ------------------------------------------------------------ grain + hatch textures (built once)
    const grainC = document.createElement("canvas"); grainC.width = grainC.height = 256;
    (function () {
      const g = grainC.getContext("2d"), id = g.createImageData(256, 256), r = rng(99);
      for (let i = 0; i < 256 * 256; i++) { const v = 128 + (r() - 0.5) * 120; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
      g.putImageData(id, 0, 0);
      const r2 = rng(7); g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const x = r2() * 256, y = r2() * 256, l = 6 + r2() * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.7, y - l * 0.7); g.stroke(); }
    })();
    let grainPat = null;
    K.grain = function (a = 0.075) {
      if (!grainPat) grainPat = ctx.createPattern(grainC, "repeat");
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W, H); ctx.restore();
    };
    /* light diagonal scratch strokes (the hand-made texture on tags, cards, walls) clipped to the current path */
    K.hatch = function (x, y, w, h, col = "rgba(255,255,255,0.16)", seed = 3, dens = 1, lw = 2) {
      const r = rng(seed); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round";
      const n = Math.round((w * h) / 2600 * dens);
      for (let i = 0; i < n; i++) {
        const x0 = x + r() * w, y0 = y + r() * h, l = 14 + r() * 46;
        ctx.globalAlpha = 0.4 + r() * 0.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + l * 0.75, y0 - l * 0.75); ctx.stroke();
      }
      ctx.restore();
    };

    // ------------------------------------------------------------ primitives
    K.rr = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    /* a rounded rect with a seeded hand wobble on its edges (never changes over time) */
    K.rrough = function (x, y, w, h, r, seed = 1, amp = 2.2) {
      const R = rng(seed), pts = [], seg = 14;
      const corner = (cx, cy, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + (k / 4) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
      const edge = (x0, y0, x1, y1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 60)); for (let k = 1; k < n; k++) { const u = k / n; pts.push([lerp(x0, x1, u) + (R() - 0.5) * amp, lerp(y0, y1, u) + (R() - 0.5) * amp]); } };
      r = Math.min(r, w / 2, h / 2);
      corner(x + w - r, y + r, -Math.PI / 2); edge(x + w, y + r, x + w, y + h - r);
      corner(x + w - r, y + h - r, 0); edge(x + w - r, y + h, x + r, y + h);
      corner(x + r, y + h - r, Math.PI / 2); edge(x, y + h - r, x, y + r);
      corner(x + r, y + r, Math.PI); edge(x + r, y, x + w - r, y);
      ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); void seg;
    };
    K.poly = function (pts, fill, stroke, lw = 4) {
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = "round"; ctx.stroke(); }
    };
    K.line = function (pts, col = INK, lw = 4, dash) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
    };
    K.fs = function (fill, stroke = INK, lw = 4) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = "round"; ctx.stroke(); } };
    K.circle = function (x, y, r, fill, stroke = INK, lw = 4) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); K.fs(fill, stroke, lw); };
    K.ell = function (x, y, rx, ry, fill, stroke = INK, lw = 4, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 6.2832); K.fs(fill, stroke, lw); };
    K.font = (w, px, fam) => `${w} ${px}px ${fam === "hand" ? "SVHand" : "SVPop"}`;
    K.text = function (s, x, y, o = {}) {
      ctx.save();
      ctx.font = K.font(o.w || 800, o.px || 40, o.fam);
      ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "alphabetic";
      if ("letterSpacing" in ctx) ctx.letterSpacing = (o.ls || 0) + "px";
      ctx.globalAlpha *= o.a == null ? 1 : o.a;
      if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
      if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 0; ctx.shadowOffsetY = o.sy == null ? 5 : o.sy; ctx.shadowOffsetX = o.sx || 0; }
      if (o.stroke) { ctx.lineJoin = "round"; ctx.lineWidth = o.sw || 8; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); ctx.shadowColor = "rgba(0,0,0,0)"; }
      ctx.fillStyle = o.col || "#fff"; ctx.fillText(s, x, y);
      ctx.restore();
    };
    K.measure = function (s, w, px, fam, ls) {
      ctx.save(); ctx.font = K.font(w, px, fam); if ("letterSpacing" in ctx) ctx.letterSpacing = (ls || 0) + "px";
      const m = ctx.measureText(s).width; ctx.restore(); return m;
    };
    K.glow = function (x, y, r, col, a = 1, mode = "lighter") {
      if (a <= 0) return;
      ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= a;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    };
    K.vgrad = function (y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
    K.fill = function (col, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.fillRect(-3000, -3000, W + 6000, H + 6000); ctx.restore(); };
    K.fade = function (a, col = "#000") { if (a > 0.001) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); } };
    K.vignette = function (k = 0.45, inner = 0.42) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createRadialGradient(W / 2, H * 0.47, H * inner * 0.5, W / 2, H * 0.47, H * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(10,6,4,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    };
    K.arrow = function (x0, y0, x1, y1, col = INK, lw = 8, head = 26, outline = INK) {
      const a = Math.atan2(y1 - y0, x1 - x0), hx = x1 - Math.cos(a) * head * 0.8, hy = y1 - Math.sin(a) * head * 0.8;
      const tri = [[x1, y1], [x1 - Math.cos(a - 0.5) * head, y1 - Math.sin(a - 0.5) * head], [x1 - Math.cos(a + 0.5) * head, y1 - Math.sin(a + 0.5) * head]];
      if (outline) { K.line([[x0, y0], [hx, hy]], outline, lw + 6); K.poly(tri, null, outline, 6); }
      K.line([[x0, y0], [hx, hy]], col, lw); K.poly(tri, col, outline ? outline : null, outline ? 3 : 0);
    };
    /* dashed polyline drawn up to fraction k of its length */
    K.dashed = function (pts, k, col, lw = 7, dash = [26, 18], outline) {
      if (k <= 0) return;
      let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
      let left = L * clamp(k, 0, 1); const out = [pts[0]];
      for (let i = 1; i < pts.length && left > 0; i++) { const d = seg[i - 1]; if (left >= d) { out.push(pts[i]); left -= d; } else { const u = left / d; out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]); left = 0; } }
      if (outline) K.line(out, outline, lw + 5, dash);
      K.line(out, col, lw, dash);
      return out[out.length - 1];
    };

    // ------------------------------------------------------------ scenery helpers
    K.sunsetSky = function (y0 = 0, y1 = 1200, stops) {
      ctx.fillStyle = K.vgrad(y0, y1, stops || [[0, "#5d4a7e"], [0.38, "#a8607a"], [0.72, "#e98c64"], [1, "#f6c37c"]]);
      ctx.fillRect(-3000, -3000, W + 6000, y1 + 3000);
    };
    K.sun = function (x, y, r, a = 1) { K.glow(x, y, r * 4, "rgba(255,214,150,0.5)", a); ctx.save(); ctx.globalAlpha *= a; K.circle(x, y, r, "#fff1cf", null); ctx.restore(); };
    K.cloud = function (x, y, s, col = "#8a5a7a", hi = "rgba(255,190,150,0.55)") {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(-220, 0); ctx.bezierCurveTo(-200, -30, -120, -34, -90, -22); ctx.bezierCurveTo(-60, -46, 40, -48, 70, -24);
      ctx.bezierCurveTo(120, -34, 200, -20, 230, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = hi; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-205, 3); ctx.lineTo(220, 3); ctx.stroke();
      ctx.restore();
    };
    K.birds = function (t, list) { ctx.save(); ctx.strokeStyle = "#3a2a3a"; ctx.lineWidth = 3; list.forEach(([x, y, s], i) => { const f = Math.sin(t * 7 + i) * 4; ctx.beginPath(); ctx.moveTo(x - 10 * s, y + f * 0.3); ctx.quadraticCurveTo(x - 4 * s, y - 6 * s - f, x, y); ctx.quadraticCurveTo(x + 4 * s, y - 6 * s - f, x + 10 * s, y + f * 0.3); ctx.stroke(); }); ctx.restore(); };
    /* rock strata between x0..x1 / y0..y1: bands of brown, speckles, short cracks (seeded, static) */
    K.strata = function (x0, y0, x1, y1, o = {}) {
      const cols = o.cols || ["#a77a52", "#94694a", "#83603f", "#6f4f36", "#5c412e"];
      const r = rng(o.seed || 4), n = cols.length, h = (y1 - y0) / n;
      for (let i = 0; i < n; i++) {
        const ya = y0 + i * h, yb = ya + h + 2;
        ctx.beginPath(); ctx.moveTo(x0, yb);
        for (let x = x0; x <= x1 + 60; x += 60) ctx.lineTo(x, ya + Math.sin(x * 0.006 + i * 1.7) * 14 + (i ? 0 : 0));
        ctx.lineTo(x1, yb); ctx.closePath(); ctx.fillStyle = cols[i]; ctx.fill();
        if (i) { ctx.strokeStyle = "rgba(43,36,32,0.35)"; ctx.lineWidth = 3; ctx.beginPath(); for (let x = x0; x <= x1 + 60; x += 60) { const yy = ya + Math.sin(x * 0.006 + i * 1.7) * 14; x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      }
      // speckles + pebbles
      const area = (x1 - x0) * (y1 - y0), ns = Math.round(area / 9000 * (o.dens || 1));
      for (let i = 0; i < ns; i++) {
        const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), s = 2 + r() * 7;
        ctx.fillStyle = r() < 0.5 ? "rgba(43,36,32,0.22)" : "rgba(255,235,200,0.14)";
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s, r() * 3, 0, 6.28); ctx.fill();
      }
      const nc = Math.round(area / 90000 * (o.dens || 1));
      ctx.strokeStyle = "rgba(43,36,32,0.38)"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      for (let i = 0; i < nc; i++) { let x = lerp(x0, x1, r()), y = lerp(y0, y1, r()); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 3; k++) { x += (r() - 0.5) * 40; y += 8 + r() * 18; ctx.lineTo(x, y); } ctx.stroke(); }
      // o.floor: the deepest band never ends. A section seen from far away (zoom < 1) or low in the frame must not show
      // the canvas black under it: continue the last colour 12,000 px down and 6,000 px to each side, with its own
      // speckles and cracks (a separate seed, so everything above y1 stays pixel-identical)
      if (o.floor) {
        const fx0 = x0 - 6000, fx1 = x1 + 6000, fy0 = y1 + 1, fy1 = y1 + 12000;
        ctx.fillStyle = cols[n - 1]; ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
        const rf = rng((o.seed || 4) + 101), fw = x1 - x0 + 4000, fh = 4500, nf = Math.round(fw * fh / 9000 * (o.floorDens || 0.3));
        for (let i = 0; i < nf; i++) {
          const x = x0 - 2000 + rf() * fw, y = fy0 + rf() * fh, s = 2 + rf() * 7;
          ctx.fillStyle = rf() < 0.5 ? "rgba(43,36,32,0.22)" : "rgba(255,235,200,0.12)";
          ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s, rf() * 3, 0, 6.28); ctx.fill();
        }
        ctx.strokeStyle = "rgba(43,36,32,0.38)"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        for (let i = 0; i < Math.round(nf / 10); i++) { let x = x0 - 2000 + rf() * fw, y = fy0 + rf() * fh; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 3; k++) { x += (rf() - 0.5) * 40; y += 8 + rf() * 18; ctx.lineTo(x, y); } ctx.stroke(); }
      }
    };
    /* timber tunnel support (two posts + cap) */
    K.timberSet = function (x, yFloor, w, h, s = 1, dark = 0) {
      const wood = dark ? "#5a3c26" : "#8e5f38", woodD = dark ? "#3c281a" : "#6a4428";
      ctx.save(); ctx.translate(x, yFloor); ctx.scale(s, s);
      [[-w / 2 - 14, -h, 28, h], [w / 2 - 14, -h, 28, h]].forEach(([a, b, c, d]) => { K.rr(a, b, c, d, 4); K.fs(wood, INK, 4); ctx.strokeStyle = woodD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a + 9, b + 10); ctx.lineTo(a + 9, b + d - 10); ctx.stroke(); });
      K.rr(-w / 2 - 34, -h - 30, w + 68, 34, 5); K.fs(wood, INK, 4);
      ctx.strokeStyle = woodD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2 - 20, -h - 14); ctx.lineTo(w / 2 + 20, -h - 14); ctx.stroke();
      ctx.restore();
    };
    K.rails = function (x0, x1, y, col = "#7c7f84", s = 1) {
      ctx.save(); ctx.fillStyle = "#4a3424"; for (let x = x0; x < x1; x += 46 * s) { K.rr(x, y - 4 * s, 30 * s, 12 * s, 2); ctx.fill(); }
      K.line([[x0, y - 6 * s], [x1, y - 6 * s]], col, 6 * s); K.line([[x0, y - 8 * s], [x1, y - 8 * s]], "rgba(255,255,255,0.3)", 2 * s);
      ctx.restore();
    };
    K.lampBulb = function (x, y, on = 1, col = "#ffd27a") {
      K.line([[x, y - 40], [x, y - 8]], INK, 3); K.circle(x, y, 9, on ? col : "#6b6253", INK, 3);
      if (on) K.glow(x, y, 120, "rgba(255,200,120,0.45)", on);
    };

    // ------------------------------------------------------------ characters
    /* limb with two segments from (x,y) with absolute angles a1, a2 (0 = straight down, + = toward +x) */
    function limb(x, y, l1, a1, l2, a2, lw, col) {
      const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
      const fx = kx + Math.sin(a2) * l2, fy = ky + Math.cos(a2) * l2;
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      return [fx, fy, kx, ky];
    }
    function pose(o, t) {
      // returns joint angles: legs [thigh, shin] x2, arms [upper, fore] x2 (side view, facing +x), torso lean
      const P = { lean: 0, bob: 0, legs: [[0.05, 0.05], [-0.05, -0.05]], arms: [[0.15, 0.05], [-0.1, 0]], sit: 0 };
      const ph = o.walk;
      if (o.pose === "run" || (ph != null && o.run)) {
        const s = Math.sin(ph), c = Math.cos(ph);
        P.lean = 0.22; P.bob = -Math.abs(Math.sin(ph)) * 10;
        P.legs = [[0.75 * s, 0.75 * s - 0.9 * Math.max(0, -c) - 0.3], [-0.75 * s, -0.75 * s - 0.9 * Math.max(0, c) - 0.3]];
        P.arms = [[-0.9 * s, -0.9 * s + 1.4], [0.9 * s, 0.9 * s + 1.4]];
      } else if (ph != null) {
        const s = Math.sin(ph), c = Math.cos(ph);
        P.lean = 0.06; P.bob = -Math.abs(Math.sin(ph)) * 5;
        P.legs = [[0.42 * s, 0.42 * s - 0.5 * Math.max(0, -c)], [-0.42 * s, -0.42 * s - 0.5 * Math.max(0, c)]];
        P.arms = [[-0.4 * s, -0.4 * s + 0.35], [0.4 * s, 0.4 * s + 0.35]];
      }
      if (o.pose === "climb") {
        const s = Math.sin(o.climb || 0);
        P.lean = 0; P.legs = [[0.7 + 0.35 * s, -0.3], [0.7 - 0.35 * s, -0.3]];
        P.arms = [[2.75 + 0.25 * s, 2.9], [2.75 - 0.25 * s, 2.9]];
      }
      if (o.pose === "sit") { P.sit = 1; P.legs = [[1.5, 0.05], [1.45, 0.0]]; P.arms = [[0.35, 1.2], [0.25, 1.0]]; }
      if (o.pose === "crouch") { P.lean = 0.4; P.bob = 34; P.legs = [[1.2, -0.5], [0.9, -0.7]]; P.arms = [[0.9, 1.5], [0.6, 1.3]]; }
      if (o.pose === "shield") { P.arms = [[2.4, 3.2], [2.2, 3.0]]; P.lean = -0.08; }
      if (o.pose === "reach") { P.arms = [[1.45, 1.6], [0.1, 0.05]]; }
      if (o.pose === "radio") { P.arms = [[2.1, 3.1], [0.15, 0.1]]; }
      if (o.pose === "zombie") { P.lean = 0.12; P.arms = [[1.45 + Math.sin(t * 3 + (o.seed || 0)) * 0.08, 1.55], [1.35 + Math.cos(t * 3 + (o.seed || 0)) * 0.08, 1.5]]; }
      if (o.arms) P.arms = o.arms; if (o.legs) P.legs = o.legs; if (o.lean != null) P.lean = o.lean;
      return P;
    }
    /* the hero: a miner. o: x,y (feet), s, dir (+1 faces right / -1 left / 0 front), walk (phase), run, pose
       ("stand"|"run"|"climb"|"sit"|"crouch"|"shield"|"reach"|"radio"), lamp 0..1 (headlamp light), beam 0..1, expr, blink, dark 0..1 */
    K.HERO = { hat: "#f2b632", hatD: "#c98e1a", vest: "#ef7b2a", vestD: "#c45f1c", stripe: "#e9eef0", jacket: "#33496e", jacketD: "#22324d", head: "#f7f4ec", boot: "#3a2c24", limb: INK };
    K.hero = function (o) {
      const C = Object.assign({}, K.HERO, o.colors || {});
      return figure(o, C, "hero");
    };
    /* one of the dead: o.seed picks hair + clothes; arms forward, shuffle; milky eyes */
    const DEAD_CLOTH = [["#6f8a55", "#526b3d"], ["#8a6a92", "#6a4f72"], ["#b88d3a", "#8f6b26"], ["#5f8a96", "#466b76"], ["#a2523f", "#7d3b2d"], ["#7c7f86", "#5d6067"], ["#c27a8a", "#9a5a6a"], ["#4f6b8f", "#3a5170"]];
    const DEAD_HAIR = ["#3a2a22", "#5a3a26", "#2a2a2e", "#7a5a3a", "#b08850", "#4a3a3a"];
    K.dead = function (o) {
      const r = rng((o.seed || 1) * 977 + 13);
      const cl = DEAD_CLOTH[Math.floor(r() * DEAD_CLOTH.length)];
      const C = { jacket: cl[0], jacketD: cl[1], head: r() < 0.5 ? "#a9b496" : "#b3b99c", hair: DEAD_HAIR[Math.floor(r() * DEAD_HAIR.length)], hairStyle: Math.floor(r() * 5), boot: "#2e2622", limb: INK };
      return figure(Object.assign({ pose: "zombie" }, o), C, "dead");
    };
    function figure(o, C, kind) {
      const s = o.s || 1, dir = o.dir == null ? 1 : o.dir, t = o.t || 0;
      const P = pose(o, t);
      ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (dir < 0 ? -1 : 1), s);
      if (o.dark) ctx.filter = `brightness(${1 - 0.75 * o.dark})`;
      const hipY = -100 + P.bob + (P.sit ? 44 : 0), shY = hipY - 86, headY = shY - 56;
      const lean = P.lean;
      // back leg + back arm first
      const legL = 54, armL = 44;
      const leg = (i) => { const [a1, a2] = P.legs[i]; const [fx, fy] = limb(4, hipY, legL, a1, legL, a2, 7, C.limb); ctx.fillStyle = C.boot; ctx.beginPath(); ctx.ellipse(fx + 9, fy + 1, 15, 8, 0, 0, 6.283); ctx.fill(); };
      const shx = Math.sin(lean) * 86 + 2, shy = shY;
      const arm = (i) => { const [a1, a2] = P.arms[i]; return limb(shx - 2, shy + 8, armL, a1, armL - 2, a2, 7, C.limb); };
      leg(1); const handB = arm(1);
      // torso (jacket) leaning
      ctx.save(); ctx.translate(2, hipY); ctx.rotate(lean);
      const tw = kind === "hero" ? 58 : 56, th = 96;
      K.rrough(-tw / 2, -th, tw, th + 6, 16, (o.seed || 2) + 5, 1.5); K.fs(C.jacket, INK, 4.5);
      if (kind === "hero") {
        // hi-vis vest with a reflective stripe + pocket
        K.rrough(-tw / 2 + 3, -th + 10, tw - 6, th - 6, 12, 41, 1.2); K.fs(C.vest, INK, 3.5);
        ctx.fillStyle = C.stripe; ctx.fillRect(-tw / 2 + 5, -th * 0.42, tw - 10, 9); ctx.strokeStyle = "rgba(43,36,32,0.4)"; ctx.lineWidth = 2; ctx.strokeRect(-tw / 2 + 5, -th * 0.42, tw - 10, 9);
        K.rr(6, -th * 0.3, 16, 18, 3); K.fs(C.vestD, INK, 2.5);
      } else {
        ctx.strokeStyle = C.jacketD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, -th + 12); ctx.lineTo(4, -6); ctx.stroke();
        const r = rng((o.seed || 1) * 31); if (r() < 0.6) { K.rr(-18, -th * 0.42, 14, 14, 3); K.fs(C.jacketD, INK, 2); }
        if (r() < 0.5) { ctx.strokeStyle = "rgba(43,36,32,0.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(-4, -18); ctx.moveTo(10, -60); ctx.lineTo(16, -50); ctx.stroke(); }
      }
      ctx.restore();
      leg(0);
      // head
      const hx = shx + Math.sin(lean) * 50 + 6, hy = headY + (P.sit ? 0 : 0);
      const R = 46;
      K.circle(hx, hy, R, C.head, INK, 4.5);
      if (kind === "hero") {
        // face (side 3/4): two dot eyes toward +x, brows by expr, small mouth
        const ex = hx + 16, ey = hy - 2, bl = clamp(o.blink || 0, 0, 1), ex2 = ex + 22;
        const expr = o.expr || "neutral";
        ctx.fillStyle = INK;
        if (o.lampGlare) { // squeezed shut
          K.line([[ex - 6, ey], [ex + 6, ey + 2]], INK, 3.5); K.line([[ex2 - 5, ey], [ex2 + 5, ey + 2]], INK, 3.5);
        } else {
          [ex, ex2].forEach((x) => { ctx.beginPath(); ctx.ellipse(x + (o.look || 0) * 4, ey, 5.5, 6.5 * (1 - bl * 0.9), 0, 0, 6.283); ctx.fill(); });
        }
        ctx.lineWidth = 3.2; ctx.strokeStyle = INK; ctx.lineCap = "round";
        const by = ey - 15;
        if (expr === "worried") { ctx.beginPath(); ctx.moveTo(ex - 7, by + 1); ctx.lineTo(ex + 6, by - 4); ctx.moveTo(ex2 - 6, by - 4); ctx.lineTo(ex2 + 7, by + 1); ctx.stroke(); }
        else if (expr === "determined") { ctx.beginPath(); ctx.moveTo(ex - 7, by - 4); ctx.lineTo(ex + 6, by + 1); ctx.moveTo(ex2 - 6, by + 1); ctx.lineTo(ex2 + 7, by - 4); ctx.stroke(); }
        else if (expr === "shock") { ctx.beginPath(); ctx.moveTo(ex - 6, by - 5); ctx.lineTo(ex + 6, by - 6); ctx.moveTo(ex2 - 6, by - 6); ctx.lineTo(ex2 + 6, by - 5); ctx.stroke(); }
        const mx = hx + 24, my = hy + 20;
        if (expr === "shock") K.ell(mx, my + 2, 6, 8, INK, null);
        else if (expr === "worried") { ctx.beginPath(); ctx.moveTo(mx - 8, my + 2); ctx.quadraticCurveTo(mx, my - 4, mx + 8, my + 2); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(mx - 7, my); ctx.lineTo(mx + 6, my); ctx.stroke(); }
        // hard hat + headlamp
        ctx.beginPath(); ctx.moveTo(hx - R - 4, hy - 10); ctx.bezierCurveTo(hx - R, hy - R - 34, hx + R, hy - R - 34, hx + R + 4, hy - 10); ctx.closePath(); K.fs(C.hat, INK, 4.5);
        ctx.strokeStyle = C.hatD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx - 4, hy - R - 18); ctx.lineTo(hx - 2, hy - 14); ctx.stroke();
        K.rr(hx - R - 10, hy - 16, 2 * R + 26, 12, 6); K.fs(C.hat, INK, 4);
        const lx = hx + R - 2, ly = hy - 30;
        K.rr(lx - 6, ly - 12, 22, 22, 6); K.fs("#3a3d44", INK, 3.5);
        K.circle(lx + 12, ly - 1, 7, o.lamp > 0 ? "#fff6c8" : "#9a9a8a", INK, 3);
        if (o.lamp > 0) K.glow(lx + 14, ly, 60, "rgba(255,240,180,0.8)", o.lamp);
        o._lamp = [o.x + (lx + 14) * s * (dir < 0 ? -1 : 1), o.y + ly * s];
      } else {
        // the dead: messy hair, milky eyes (no pupils), slack mouth
        const st = C.hairStyle;
        ctx.fillStyle = C.hair; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        ctx.beginPath();
        if (st === 0) { ctx.moveTo(hx - R + 4, hy - 18); for (let k = 0; k <= 8; k++) { const a = Math.PI + (k / 8) * Math.PI; ctx.lineTo(hx + Math.cos(a) * (R + (k % 2 ? 12 : 2)), hy + Math.sin(a) * (R + (k % 2 ? 12 : 2)) - 4); } ctx.lineTo(hx + R - 4, hy - 18); }
        else if (st === 1) { ctx.arc(hx - 4, hy - 8, R + 4, Math.PI * 1.02, Math.PI * 1.95); ctx.lineTo(hx + 18, hy - 26); ctx.lineTo(hx - R + 2, hy - 8); }
        else if (st === 2) { for (let k = 0; k < 6; k++) { const a = Math.PI * (1.05 + k * 0.17); ctx.moveTo(hx + Math.cos(a) * R, hy + Math.sin(a) * R); ctx.arc(hx + Math.cos(a) * (R - 4), hy + Math.sin(a) * (R - 4) - 2, 16, 0, 6.283); } }
        else if (st === 3) { ctx.arc(hx, hy - 4, R + 2, Math.PI * 1.08, Math.PI * 1.92); ctx.lineTo(hx + R - 10, hy - 30); ctx.lineTo(hx - R + 10, hy - 30); }
        else { ctx.moveTo(hx - R + 6, hy - 22); ctx.lineTo(hx - 20, hy - R - 14); ctx.lineTo(hx - 4, hy - R - 2); ctx.lineTo(hx + 10, hy - R - 16); ctx.lineTo(hx + 22, hy - R); ctx.lineTo(hx + R - 2, hy - 20); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // eyes: milky white discs with a soft grey film
        const ex = hx + 14, ey = hy + 2;
        [ex, ex + 22].forEach((x, i) => { K.circle(x, ey + (i ? 1 : 0), 8.5, "#eef0ea", INK, 3); ctx.fillStyle = "rgba(160,170,165,0.45)"; ctx.beginPath(); ctx.arc(x + 1, ey + 2, 5, 0, 6.283); ctx.fill(); });
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx + 18, hy + 26); ctx.quadraticCurveTo(hx + 26, hy + 22, hx + 34, hy + 27); ctx.stroke();
        ctx.strokeStyle = "rgba(43,36,32,0.3)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx - 24, hy + 8); ctx.lineTo(hx - 14, hy + 16); ctx.stroke();
      }
      arm(0);
      ctx.restore();
      return { head: [o.x + hx * s * (dir < 0 ? -1 : 1), o.y + hy * s], r: R * s, lamp: o._lamp };
    }
    /* a crowd of the dead: list of {x, y, s, seed, dir, walk}, sorted by y */
    K.horde = function (list, t, extra = {}) {
      list.slice().sort((a, b) => a.y - b.y).forEach((d) => K.dead(Object.assign({ t }, extra, d)));
    };
    /* the hero's headlamp beam from point p in direction ang (rad), length L, half-angle hw */
    K.beam = function (p, ang, L = 700, hw = 0.32, a = 1, col = "255,244,200") {
      if (!p || a <= 0) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], L);
      g.addColorStop(0, `rgba(${col},${0.55 * a})`); g.addColorStop(0.6, `rgba(${col},${0.18 * a})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.arc(p[0], p[1], L, ang - hw, ang + hw); ctx.closePath(); ctx.fill(); ctx.restore();
    };

    // ------------------------------------------------------------ overlays: tags, title, cards
    /* big red tag ("40 DEAD"): x,y centre, rot, s scale, a alpha */
    K.tagRed = function (txt, x, y, o = {}) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const px = o.px || 118, w = K.measure(txt, 800, px) + 90, h = px * 1.3;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.03 : o.rot); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      ctx.fillStyle = "rgba(20,10,10,0.35)"; K.rr(-w / 2 + 8, -h / 2 + 10, w, h, 18); ctx.fill();
      K.rrough(-w / 2, -h / 2, w, h, 18, 11, 2); K.fs(o.col || K.COL.red, INK, 7);
      ctx.save(); K.rrough(-w / 2, -h / 2, w, h, 18, 11, 2); ctx.clip(); K.hatch(-w / 2, -h / 2, w, h, "rgba(255,255,255,0.22)", 5, 1.2, 2.5); ctx.restore();
      K.text(txt, 0, px * 0.36, { w: 800, px, col: "#fbf7ef", align: "center", ls: 1 });
      ctx.restore();
    };
    /* dark rounded tag ("100 M", "DAY 5") */
    K.tagDark = function (txt, x, y, o = {}) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const px = o.px || 64, w = K.measure(txt, 800, px) + 64, h = px * 1.42;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc); if (o.rot) ctx.rotate(o.rot);
      ctx.fillStyle = "rgba(0,0,0,0.3)"; K.rr(-w / 2 + 5, -h / 2 + 7, w, h, 16); ctx.fill();
      K.rr(-w / 2, -h / 2, w, h, 16); K.fs(o.col || "#23272d", "#f2efe6", 4);
      K.text(txt, 0, px * 0.36, { w: 800, px, col: o.tc || "#fbf8f0", align: "center", ls: 0.5 });
      ctx.restore();
    };
    /* yellow label tag ("AIR: 1 SHAFT", "3 KM") with an optional leader line to (lx, ly) */
    K.tagYellow = function (txt, x, y, o = {}) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const px = o.px || 46, w = K.measure(txt, 800, px) + 40, h = px * 1.36;
      if (o.leader) { ctx.save(); ctx.globalAlpha *= a; K.line([[x, y], o.leader], INK, 4); ctx.restore(); }
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot || 0); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      K.rr(-w / 2, -h / 2, w, h, 6); K.fs(o.col || K.COL.yellow, INK, 4.5);
      K.text(txt, 0, px * 0.36, { w: 800, px, col: o.tc || INK, align: "center" });
      ctx.restore();
    };
    /* small round-ended label pill ("AIR", "BAD AIR") */
    K.pill = function (txt, x, y, o = {}) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const px = o.px || 34, w = K.measure(txt, 800, px) + 36, h = px * 1.45;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      K.rr(-w / 2, -h / 2, w, h, h / 2); K.fs(o.col || "#3a7bd5", "#f4f1e8", 4);
      K.text(txt, 0, px * 0.36, { w: 800, px, col: o.tc || "#fff", align: "center" });
      ctx.restore();
    };
    /* the two-line title ("THE DEAD" / "CAN'T SEE IN THE DARK"), white + yellow, heavy outline */
    K.title2 = function (l1, l2, x, y, o = {}) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.035 : o.rot); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      const p1 = o.px1 || 92, p2 = o.px2 || 104;
      K.text(l1, 0, 0, { w: 800, px: p1, col: "#fbf8f0", align: "center", stroke: INK, sw: 16, shadow: "rgba(0,0,0,0.45)", sy: 8 });
      if (o.k2 == null || o.k2 > 0) K.text(l2, 0, p2 * 1.04, { w: 800, px: p2, col: K.COL.yellow, align: "center", stroke: INK, sw: 16, shadow: "rgba(0,0,0,0.45)", sy: 8, a: o.k2 == null ? 1 : o.k2 });
      ctx.restore();
    };
    /* simple icons, drawn in a circle of radius r */
    K.icon = function (name, x, y, r, o = {}) {
      ctx.save(); ctx.translate(x, y);
      if (o.ring !== false) { K.circle(0, 0, r, o.bg || "#f6f0e0", INK, 4.5); }
      const s = r / 50; ctx.scale(s, s);
      if (name === "ration") { K.rr(-24, -30, 48, 60, 8); K.fs("#7a8a4a", INK, 4); K.rr(-24, -10, 48, 22, 3); K.fs("#efe0b8", INK, 3); K.text("MRE", 0, 7, { w: 800, px: 13, col: INK, align: "center" }); }
      else if (name === "drop") { ctx.beginPath(); ctx.moveTo(0, -32); ctx.bezierCurveTo(24, -4, 26, 30, 0, 30); ctx.bezierCurveTo(-26, 30, -24, -4, 0, -32); K.fs("#4aa3e0", INK, 4); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.ellipse(-8, 8, 5, 9, -0.3, 0, 6.28); ctx.fill(); }
      else if (name === "bolt") { K.poly([[6, -34], [-18, 4], [-2, 4], [-8, 34], [18, -6], [2, -6]], "#f2c230", INK, 4); }
      else if (name === "cross") { K.rr(-30, -22, 60, 44, 8); K.fs("#2f9e48", INK, 4); K.poly([[-6, -14], [6, -14], [6, -6], [14, -6], [14, 6], [6, 6], [6, 14], [-6, 14], [-6, 6], [-14, 6], [-14, -6], [-6, -6]], "#fff", null); }
      else if (name === "pick") { K.line([[-22, 30], [16, -20]], "#8e5f38", 8); K.line([[-22, 30], [16, -20]], INK, 2); ctx.beginPath(); ctx.moveTo(-14, -30); ctx.quadraticCurveTo(14, -36, 34, -8); ctx.lineTo(28, -6); ctx.quadraticCurveTo(14, -26, -12, -22); ctx.closePath(); K.fs("#9aa3ad", INK, 4); }
      else if (name === "fan") { K.circle(0, 0, 30, "#c9ccc8", INK, 4); for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(k * Math.PI / 2 + (o.spin || 0)); ctx.beginPath(); ctx.ellipse(0, -14, 8, 15, 0.4, 0, 6.28); K.fs("#6b7380", INK, 3); ctx.restore(); } K.circle(0, 0, 6, INK, null); }
      else if (name === "eye") { ctx.beginPath(); ctx.moveTo(-36, 0); ctx.quadraticCurveTo(0, -30, 36, 0); ctx.quadraticCurveTo(0, 30, -36, 0); K.fs("#fff", INK, 4); K.circle(0, 0, 13, o.milky ? "#d8dcd6" : "#5a8a6a", INK, 3); if (!o.milky) K.circle(0, 0, 6, INK, null); }
      else if (name === "sun") { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; K.line([[Math.cos(a) * 22, Math.sin(a) * 22], [Math.cos(a) * 34, Math.sin(a) * 34]], INK, 5); } K.circle(0, 0, 17, "#f2c230", INK, 4); }
      else if (name === "radio") { K.rr(-26, -30, 52, 62, 8); K.fs("#3a3d44", INK, 4); K.rr(-17, -20, 34, 16, 3); K.fs("#9fe0a0", INK, 2.5); K.line([[18, -30], [24, -48]], INK, 4); [-10, 0, 10].forEach((yy) => K.line([[-14, yy + 10], [14, yy + 10]], "#8a8f99", 3)); }
      else if (name === "mine") { // mini cross-section: hill, shaft, the chamber
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 48, 0, 6.283); ctx.clip();
        // a little landscape in section: sunset sky, a headframe, the dead on the yard, the shaft, the chamber
        ctx.fillStyle = K.vgrad(-50, -18, [[0, "#c8708a"], [1, "#f4b07a"]]); ctx.fillRect(-60, -60, 120, 44);
        K.circle(28, -30, 6, "#fff1cf", null);
        ctx.fillStyle = "#a77a52"; ctx.fillRect(-60, -16, 120, 30); ctx.fillStyle = "#7b5a3d"; ctx.fillRect(-60, 14, 120, 50);
        K.line([[-60, -16], [60, -16]], INK, 2.5);
        ctx.strokeStyle = "#4a3040"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-40, -16); ctx.lineTo(-33, -44); ctx.lineTo(-26, -16); ctx.stroke(); ctx.beginPath(); ctx.arc(-33, -46, 5, 0, 6.28); ctx.stroke();
        // the dead on the yard: tiny stick figures with arms out
        [-12, -2, 10, 20, 32, 42].forEach((xx, i) => { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xx - 2, -16); ctx.lineTo(xx, -22); ctx.lineTo(xx + 2, -16); ctx.moveTo(xx, -22); ctx.lineTo(xx, -28); ctx.lineTo(xx + 5, -27); ctx.stroke(); ctx.fillStyle = "#a9b496"; ctx.beginPath(); ctx.arc(xx, -31, 3, 0, 6.28); ctx.fill(); ctx.stroke(); });
        // the shaft down to the chamber with its green light
        ctx.fillStyle = "#1e1612"; ctx.fillRect(-33, -16, 8, 44); K.line([[-33, -16], [-33, 28]], INK, 1.8); K.line([[-25, -16], [-25, 28]], INK, 1.8);
        K.rr(-42, 26, 52, 16, 6); K.fs("#d9dcd6", INK, 2.5); K.circle(-33, 34, 2.8, "#f2c230", null); K.circle(-23, 34, 2.8, "#f2c230", null); K.circle(-13, 34, 2.8, "#f2c230", null);
        K.circle(4, 22, 3, "#6dff8a", null);
        ctx.restore(); K.circle(0, 0, 48, null, INK, 4);
      }
      ctx.restore();
    };
    /* cream info card: x,y (top-left), w, h, rot, icon, label (small grey caps), lines [{t, col, px}], a, s */
    K.card = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(o.rot == null ? -0.012 : o.rot); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc); ctx.translate(-o.w / 2, -o.h / 2);
      ctx.fillStyle = "rgba(20,14,10,0.35)"; K.rr(10, 14, o.w, o.h, 10); ctx.fill();
      K.rrough(0, 0, o.w, o.h, 10, o.seed || 21, 2.4); K.fs(K.COL.cream, INK, 5.5);
      ctx.save(); K.rrough(0, 0, o.w, o.h, 10, o.seed || 21, 2.4); ctx.clip();
      // scratchy edge hatching (bottom + right), like a pencil-shaded card
      K.hatch(0, o.h - 26, o.w, 26, "rgba(43,36,32,0.22)", 8, 3, 1.6); K.hatch(o.w - 24, 0, 24, o.h, "rgba(43,36,32,0.2)", 9, 3, 1.6);
      ctx.restore();
      let tx = 40;
      if (o.icon) { K.icon(o.icon, 104, o.iconY || 112, 62, o.iconOpt || {}); tx = 196; }
      let y = o.labelY || 76;
      if (o.label) { K.text(o.label, tx, y, { w: 700, px: 40, col: "#7a7266", ls: 3 }); y += 14; }
      (o.lines || []).forEach((ln) => {
        if (ln.k != null && ln.k <= 0) { y += (ln.px || 80) * 1.08; return; }
        const px = ln.px || 80; y += px * 1.04;
        ctx.save(); if (ln.k != null && ln.k < 1) { ctx.globalAlpha *= ln.k; }
        K.text(ln.t, ln.x == null ? tx : ln.x, y, { w: 800, px, col: ln.col || INK, align: ln.align || "left" });
        ctx.restore();
      });
      ctx.restore();
    };
    /* RULE n card with an optional red stamped line */
    K.ruleCard = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(o.x, o.y); ctx.rotate(o.rot == null ? -0.01 : o.rot); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc);
      const w = o.w || 700, h = o.h || 320;
      ctx.fillStyle = "rgba(20,14,10,0.35)"; K.rr(-w / 2 + 10, -h / 2 + 14, w, h, 10); ctx.fill();
      K.rrough(-w / 2, -h / 2, w, h, 10, 31, 2.4); K.fs(K.COL.cream, INK, 5.5);
      K.text("RULE", -40, -h / 2 + 128, { w: 800, px: 100, col: INK, align: "center" });
      const bx = 130; K.rr(bx - 46, -h / 2 + 46, 92, 96, 10); K.fs(K.COL.red, INK, 5); K.text(String(o.n || 1), bx, -h / 2 + 128, { w: 800, px: 86, col: "#fff", align: "center" });
      if (o.stampK > 0) K.stamp(o.stamp, 0, h / 2 - 82, { k: o.stampK, px: 70, rot: -0.04 });
      ctx.restore();
    };
    /* red stamp: text in a double red box, scale-slammed in with k 0..1 */
    K.stamp = function (txt, x, y, o = {}) {
      const k = o.k == null ? 1 : o.k; if (k <= 0) return;
      const px = o.px || 76, w = K.measure(txt, 800, px) + 60, h = px * 1.38;
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.05 : o.rot);
      const sc = lerp(1.6, 1, back(clamp(k * 1.4, 0, 1), 1.4)); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(k * 3, 0, 1);
      ctx.fillStyle = o.bg || "rgba(255,255,255,0.0)"; K.rr(-w / 2, -h / 2, w, h, 10); ctx.fill();
      ctx.strokeStyle = o.col || K.COL.red; ctx.lineWidth = 6; K.rr(-w / 2, -h / 2, w, h, 10); ctx.stroke(); ctx.lineWidth = 3; K.rr(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 6); ctx.stroke();
      K.text(txt, 0, px * 0.36, { w: 800, px, col: o.col || K.COL.red, align: "center" });
      // worn ink: knock out a few specks
      const r = rng(17); ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * w, (r() - 0.5) * h, 1 + r() * 3, 0, 6.28); ctx.fill(); }
      ctx.restore();
    };
    /* checklist card: rows [{icon, t, mark: null|"ok"|"?"|{tag, col}, k}] */
    K.checklist = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(-0.008); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc); ctx.translate(-o.w / 2, -o.h / 2);
      ctx.fillStyle = "rgba(20,14,10,0.35)"; K.rr(10, 14, o.w, o.h, 10); ctx.fill();
      K.rrough(0, 0, o.w, o.h, 10, 51, 2.4); K.fs(K.COL.cream, INK, 5.5);
      K.text(o.title || "YOUR PLAN", o.w / 2, 82, { w: 800, px: 52, col: INK, align: "center" });
      K.line([[50, 108], [o.w - 50, 108]], "rgba(43,36,32,0.35)", 3);
      o.rows.forEach((rw, i) => {
        const y = 178 + i * 96;
        K.icon(rw.icon, 92, y - 16, 28, { ring: false });
        K.text(rw.t, 150, y, { w: 800, px: 58, col: INK });
        const m = rw.mark, mk = rw.k == null ? 1 : rw.k;
        if (!m || mk <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(mk * 2, 0, 1);
        if (m === "ok") { const L = clamp(mk, 0, 1); K.line([[o.w - 120, y - 18], [o.w - 100, y + 2], [lerp(o.w - 100, o.w - 60, L), lerp(y + 2, y - 44, L)]], K.COL.green, 11); }
        else if (m === "?") { K.text("?", o.w - 92, y + 4, { w: 800, px: 74, col: K.COL.red, align: "center" }); }
        else if (m.tag) { const tw = K.measure(m.tag, 800, 46) + 36, sc2 = lerp(1.4, 1, back(mk, 2)); ctx.translate(o.w - 60 - tw / 2, y - 18); ctx.scale(sc2, sc2); K.rr(-tw / 2, -32, tw, 64, 8); K.fs(m.col || K.COL.red, INK, 4); K.text(m.tag, 0, 16, { w: 800, px: 46, col: "#fff", align: "center" }); }
        ctx.restore();
      });
      ctx.restore();
    };
    /* GOOD..BAD arc gauge on a cream card; v 0 (good) .. 1 (bad) */
    K.gauge = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(-0.01); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc); ctx.translate(-o.w / 2, -o.h / 2);
      ctx.fillStyle = "rgba(20,14,10,0.35)"; K.rr(10, 14, o.w, o.h, 10); ctx.fill();
      K.rrough(0, 0, o.w, o.h, 10, 61, 2.4); K.fs(K.COL.cream, INK, 5.5);
      K.icon("fan", 92, o.h / 2 - 6, 34, { ring: false, spin: o.spin || 0 });
      K.text(o.label || "AIR", 92, o.h / 2 + 62, { w: 800, px: 40, col: INK, align: "center" });
      const cx = o.w / 2 + 70, cy = o.h - 62, R = 160;
      const seg = 40; for (let i = 0; i < seg; i++) {
        const u0 = i / seg, u1 = (i + 1.02) / seg, a0 = Math.PI + u0 * Math.PI, a1 = Math.PI + u1 * Math.PI;
        const col = `hsl(${lerp(120, 0, u0)},62%,${lerp(42, 50, u0)}%)`;
        ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.arc(cx, cy, R - 46, a1, a0, true); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.arc(cx, cy, R - 46, 0, Math.PI, true); ctx.closePath(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      K.text("GOOD", cx - R + 20, cy + 40, { w: 800, px: 28, col: K.COL.green, align: "center" }); K.text("BAD", cx + R - 22, cy + 40, { w: 800, px: 28, col: K.COL.red, align: "center" });
      const ang = Math.PI + clamp(o.v, 0, 1) * Math.PI;
      K.line([[cx, cy], [cx + Math.cos(ang) * (R - 20), cy + Math.sin(ang) * (R - 20)]], INK, 10); K.circle(cx, cy, 13, INK, null);
      ctx.restore();
    };
    /* bar meter card: rows [{t, icon, v 0..1, col, x: 0..1 (red X)}] */
    K.meter = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(-0.01); const sc = o.s == null ? 1 : o.s; ctx.scale(sc, sc); ctx.translate(-o.w / 2, -o.h / 2);
      ctx.fillStyle = "rgba(20,14,10,0.35)"; K.rr(10, 14, o.w, o.h, 10); ctx.fill();
      K.rrough(0, 0, o.w, o.h, 10, 71, 2.4); K.fs(K.COL.cream, INK, 5.5);
      o.rows.forEach((rw, i) => {
        const y = 92 + i * 118;
        K.icon(rw.icon, 74, y - 4, 30, { ring: false, spin: rw.spin || 0 });
        K.text(rw.t, 124, y + 14, { w: 800, px: 42, col: INK });
        const bx = 360, bw = o.w - bx - 50;
        K.rr(bx, y - 22, bw, 44, 22); K.fs("#e6dcc4", INK, 4.5);
        if (rw.v > 0) { ctx.save(); K.rr(bx, y - 22, bw, 44, 22); ctx.clip(); ctx.fillStyle = rw.col || K.COL.yellow; ctx.fillRect(bx, y - 22, bw * clamp(rw.v, 0, 1), 44); ctx.restore(); K.rr(bx, y - 22, bw, 44, 22); K.fs(null, INK, 4.5); }
        if (rw.x > 0) { const k = clamp(rw.x, 0, 1), c = bx + 60; ctx.save(); ctx.globalAlpha *= clamp(k * 2, 0, 1); const sz = 34 * lerp(1.6, 1, back(k)); K.line([[c - sz, y - sz], [c + sz, y + sz]], K.COL.red, 12); K.line([[c + sz, y - sz], [c - sz, y + sz]], K.COL.red, 12); ctx.restore(); }
      });
      ctx.restore();
    };
    /* analog clock icon (white face) */
    K.clockFace = function (x, y, r, h, m) {
      K.circle(x, y, r, "#fbf8f0", INK, 4);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; K.line([[x + Math.sin(a) * r * 0.74, y - Math.cos(a) * r * 0.74], [x + Math.sin(a) * r * 0.86, y - Math.cos(a) * r * 0.86]], INK, i % 3 ? 2 : 4); }
      const ah = ((h % 12) + m / 60) / 12 * 6.283, am = m / 60 * 6.283;
      K.line([[x, y], [x + Math.sin(ah) * r * 0.45, y - Math.cos(ah) * r * 0.45]], INK, 5); K.line([[x, y], [x + Math.sin(am) * r * 0.7, y - Math.cos(am) * r * 0.7]], INK, 4); K.circle(x, y, 4, INK, null);
    };
    /* the vote card: q, b1 {t, sub, icon}, b2, foot, k1/k2/kf reveal 0..1, pulse t */
    K.vote = function (o) {
      const a = o.a == null ? 1 : o.a; if (a <= 0) return;
      const L = Object.assign({ q: 214, medal: 420, mr: 112, b1: 566, b2: 838, bh: 246, foot: 1112 }, o.layout || {});
      ctx.save(); ctx.globalAlpha *= a;
      K.text(o.q, 540, L.q, { w: 800, px: o.qpx || 64, col: "#fbf8f0", align: "center", stroke: INK, sw: 12, shadow: "rgba(0,0,0,0.5)", sy: 6, rot: -0.012 });
      if (o.medal) { const mk = o.mk == null ? 1 : o.mk; ctx.save(); ctx.translate(540, L.medal); ctx.scale(mk, mk); K.circle(0, 0, L.mr, "#f2c230", INK, 6); ctx.scale(L.mr / 62, L.mr / 62); K.icon("mine", 0, 0, 50, {}); ctx.restore(); }
      const bh = L.bh;
      const btn = (y, k, col, b, pulse) => {
        if (k <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(k * 2.5, 0, 1);
        const sc = lerp(0.84, 1, back(clamp(k, 0, 1), 2)) * (1 + 0.025 * pulse);
        ctx.translate(540, y + bh / 2); ctx.scale(sc, sc); ctx.translate(-540, -(y + bh / 2));
        ctx.fillStyle = "rgba(10,8,6,0.4)"; K.rr(98, y + 14, 904, bh, 26); ctx.fill();
        K.rrough(88, y, 904, bh, 26, y | 0, 2); K.fs(col, INK, 6);
        ctx.save(); K.rrough(88, y, 904, bh, 26, y | 0, 2); ctx.clip(); K.hatch(88, y, 904, bh, "rgba(255,255,255,0.2)", (y | 0) + 3, 1.6, 3); ctx.restore();
        K.icon(b.icon, 200, y + bh / 2, 58, { ring: false });
        K.text(b.t, 320, y + bh * 0.47, { w: 800, px: 96, col: "#fbf8f0" });
        K.circle(340, y + bh * 0.72, 20, "#f6f0e0", INK, 3.5); K.line([[330, y + bh * 0.72], [337, y + bh * 0.72 + 8], [350, y + bh * 0.72 - 9]], K.COL.green, 5);
        K.text(b.sub, 374, y + bh * 0.72 + 14, { w: 800, px: 38, col: "#fbf8f0" });
        ctx.restore();
      };
      const pt = o.pulse || 0;
      btn(L.b1, o.k1 == null ? 1 : o.k1, K.COL.green, o.b1, pt > 0 ? Math.max(0, Math.sin(pt * 3.2)) : 0);
      btn(L.b2, o.k2 == null ? 1 : o.k2, K.COL.blue, o.b2, pt > 0 ? Math.max(0, Math.sin(pt * 3.2 + Math.PI)) : 0);
      if ((o.kf || 0) > 0) {
        ctx.save(); ctx.globalAlpha *= clamp(o.kf * 2, 0, 1);
        ctx.fillStyle = "rgba(18,16,16,0.82)"; K.rr(88, L.foot, 904, 100, 16); ctx.fill();
        K.text(o.foot, 540, L.foot + 68, { w: 800, px: 48, col: K.COL.yellow, align: "center" });
        ctx.restore();
      }
      ctx.restore();
    };
    return K;
  };
  window.SV = SV;
})();
