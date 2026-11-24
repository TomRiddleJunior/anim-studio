/* lofi-kit.js — painterly lo-fi night scenes in Canvas 2D (1080x1920), for "lofi mascot lines" reels.
   Painterly = soft value gradients inside every shape, a brush-stroke texture laid only over painted pixels
   (source-atop), light that bleeds (additive glows, bokeh), atmospheric depth (blurred far layers), rain and grain.
   Static layers are painted once into offscreen canvases (seeded, so every worker paints the same pixels) and composited
   per frame with parallax; living things (rain, steam, ripples, crowd, the mascot's breath and tail) are drawn per frame.
   The mascot: a small river otter (LOFI.otter(ctx, pose, o)) in six poses: cafe, float, curl, stand, sprawl, sill. */
(function () {
  const LOFI = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const eio = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  LOFI.util = { clamp, lerp, sstep, eio, rng };
  const W = 1080, H = 1920;
  LOFI.W = W; LOFI.H = H;

  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  LOFI.canvas = canvas;

  // ------------------------------------------------------------------ textures (made once, seeded)
  let BRUSH_D = null, BRUSH_L = null, GRAIN = [];
  function makeTextures() {
    if (BRUSH_D) return;
    const mk = (seed, col, n, lw) => {
      const c = canvas(512, 512), x = c.getContext("2d"), r = rng(seed);
      x.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const cx = r() * 512, cy = r() * 512, len = 14 + r() * 46, a = -0.9 + r() * 0.5 + (r() < 0.2 ? 1.4 : 0);
        x.strokeStyle = col.replace("A", (0.05 + r() * 0.12).toFixed(3)); x.lineWidth = lw * (0.4 + r());
        x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a) * len * 0.5 + (r() - 0.5) * 8, cy + Math.sin(a) * len * 0.5 + (r() - 0.5) * 8, cx + Math.cos(a) * len, cy + Math.sin(a) * len); x.stroke();
        // wrap copies so the tile is seamless
        for (const [dx, dy] of [[512, 0], [-512, 0], [0, 512], [0, -512]]) {
          if ((dx > 0 && cx + len < 512) || (dx < 0 && cx - len > 0) || (dy > 0 && cy + len < 512) || (dy < 0 && cy - len > 0)) continue;
          x.beginPath(); x.moveTo(cx - dx, cy - dy); x.lineTo(cx - dx + Math.cos(a) * len, cy - dy + Math.sin(a) * len); x.stroke();
        }
      }
      return c;
    };
    BRUSH_D = mk(11, "rgba(20,12,30,A)", 2600, 7);
    BRUSH_L = mk(23, "rgba(255,245,225,A)", 1600, 5);
    for (let k = 0; k < 4; k++) {
      const c = canvas(256, 256), x = c.getContext("2d"), img = x.createImageData(256, 256), r = rng(100 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      x.putImageData(img, 0, 0); GRAIN.push(c);
    }
  }
  /* lay the brush texture over everything already painted on ctx's canvas (only on painted pixels) */
  LOFI.brush = function (ctx, kd = 0.55, kl = 0.35, off = [0, 0]) {
    makeTextures();
    ctx.save(); ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = kd * 0.42; ctx.fillStyle = ctx.createPattern(BRUSH_D, "repeat"); ctx.translate(off[0], off[1]); ctx.fillRect(-off[0], -off[1], ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = kl * 0.42; ctx.fillStyle = ctx.createPattern(BRUSH_L, "repeat"); ctx.translate(97, 211); ctx.fillRect(-off[0] - 97, -off[1] - 211, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  };
  LOFI.grain = function (ctx, t, a = 0.06) {
    makeTextures();
    const k = Math.floor(t * 24) % 4, r = rng(Math.floor(t * 24) + 7);
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = a;
    ctx.fillStyle = ctx.createPattern(GRAIN[k], "repeat"); ctx.translate(Math.floor(r() * 256), Math.floor(r() * 256));
    ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore();
  };
  LOFI.vignette = function (ctx, k = 0.5, cx = W / 2, cy = H * 0.5) {
    const g = ctx.createRadialGradient(cx, cy, H * 0.22, cx, cy, H * 0.78);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(5,6,14,${k})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  LOFI.glow = function (ctx, x, y, r, col, a = 1, mode = "lighter") {
    ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
  };
  LOFI.lin = function (ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  LOFI.rad = function (ctx, x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  LOFI.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  /* a wobbly closed blob through points (Catmull-Rom), for hand-painted edges */
  LOFI.blob = function (ctx, pts, jit = 0, seed = 1) {
    const r = rng(seed), p = pts.map(([x, y]) => [x + (r() - 0.5) * jit, y + (r() - 0.5) * jit]), n = p.length;
    ctx.beginPath(); ctx.moveTo((p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2);
    for (let i = 1; i <= n; i++) { const a = p[i % n], b = p[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  };
  /* rain streaks (falling), seeded; area [x0,y0,x1,y1] */
  LOFI.rain = function (ctx, t, o = {}) {
    const r = rng(o.seed || 3), n = o.n || 120, A = o.area || [-100, -100, W + 100, H + 100], h = A[3] - A[1], wd = A[2] - A[0];
    ctx.save(); ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const x0 = r() * wd, y0 = r() * h, sp = lerp(o.speed ? o.speed[0] : 1300, o.speed ? o.speed[1] : 2000, r()), len = lerp(o.len ? o.len[0] : 30, o.len ? o.len[1] : 70, r());
      let y = (y0 + sp * t) % (h + len); const x = A[0] + ((x0 + (o.slant || -0.12) * (y0 + sp * t)) % wd + wd) % wd;
      ctx.strokeStyle = o.col || "rgba(200,215,240,0.35)"; ctx.globalAlpha = 0.4 + 0.6 * r(); ctx.lineWidth = o.lw ? o.lw * (0.6 + r() * 0.8) : 1.6 + r() * 1.4;
      ctx.beginPath(); ctx.moveTo(x, A[1] + y - len); ctx.lineTo(x + (o.slant || -0.12) * len, A[1] + y); ctx.stroke();
    }
    ctx.restore();
  };
  /* drops on glass: static beads + a few sliding trails */
  LOFI.drops = function (ctx, t, o = {}) {
    const r = rng(o.seed || 9), A = o.area || [0, 0, W, H];
    ctx.save();
    for (let i = 0; i < (o.n || 90); i++) {
      const x = lerp(A[0], A[2], r()), y = lerp(A[1], A[3], r()), s = 2 + r() * 6;
      ctx.fillStyle = `rgba(220,235,255,${0.12 + r() * 0.2})`; ctx.beginPath(); ctx.ellipse(x, y, s * 0.8, s, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.arc(x - s * 0.25, y - s * 0.35, s * 0.25, 0, 6.283); ctx.fill();
    }
    for (let i = 0; i < (o.trails || 8); i++) {
      const x = lerp(A[0], A[2], r()), sp = 60 + r() * 140, y0 = A[1] + r() * (A[3] - A[1]), y = A[1] + ((y0 - A[1] + sp * t) % (A[3] - A[1]));
      ctx.strokeStyle = "rgba(210,228,255,0.18)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 90 - r() * 120); ctx.lineTo(x + Math.sin(y * 0.02) * 4, y); ctx.stroke();
      ctx.fillStyle = "rgba(230,240,255,0.4)"; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  };
  LOFI.bokeh = function (ctx, t, o = {}) {
    const r = rng(o.seed || 5), A = o.area || [0, 0, W, H];
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < (o.n || 30); i++) {
      const x = lerp(A[0], A[2], r()), y = lerp(A[1], A[3], r()), s = lerp(o.size ? o.size[0] : 10, o.size ? o.size[1] : 40, r());
      const cols = o.cols || ["255,190,110", "255,150,90", "150,190,255"], c = cols[Math.floor(r() * cols.length)];
      const a = (o.a || 0.35) * (0.5 + 0.5 * r()) * (0.85 + 0.15 * Math.sin(t * (0.5 + r()) + r() * 6));
      const g = ctx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(0.7, `rgba(${c},${a * 0.6})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  };
  LOFI.steam = function (ctx, t, x, y, o = {}) {
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < (o.n || 3); k++) {
      const ph = (t * 0.55 + k / (o.n || 3)) % 1;
      const yy = y - ph * (o.h || 150), xx = x + Math.sin(ph * 6 + k * 2 + t) * 14 * ph;
      const s = (o.s || 22) * (0.6 + ph * 1.4);
      ctx.globalAlpha = (o.a || 0.35) * Math.sin(ph * Math.PI);
      const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, s); g.addColorStop(0, "rgba(240,235,225,0.8)"); g.addColorStop(1, "rgba(240,235,225,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(xx, yy, s * 0.7, s, 0, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------ the otter
  const OT = { fur: "#7b5134", furD: "#55361f", furL: "#a37650", cream: "#e8d6b8", creamD: "#cdb592", nose: "#2a1a12", ink: "#3a2518", pad: "#4a2f1e" };
  LOFI.OT = OT;
  /* head at origin, radius ~60; o.eyes "closed" | "open" | "half"; o.rot; o.light ("warm"|"cool"); o.tilt for ears */
  function head(ctx, o = {}) {
    ctx.save(); ctx.rotate(o.rot || 0);
    const warm = o.light !== "cool";
    // ears
    [[-48, -34], [48, -34]].forEach(([x, y], i) => {
      ctx.fillStyle = OT.furD; ctx.beginPath(); ctx.ellipse(x, y + (o.ear || 0) * (i ? 1 : -1), 17, 15, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#3b2416"; ctx.beginPath(); ctx.ellipse(x * 0.96, y + 3, 9, 8, 0, 0, 6.283); ctx.fill();
    });
    // skull
    ctx.fillStyle = LOFI.rad(ctx, -14, -24, 6, 80, [[0, warm ? "#a27250" : "#8b6a58"], [0.6, OT.fur], [1, OT.furD]]);
    ctx.beginPath(); ctx.ellipse(0, 0, 63, 54, 0, 0, 6.283); ctx.fill();
    // muzzle + cheeks
    ctx.fillStyle = LOFI.rad(ctx, 0, 10, 4, 60, [[0, "#f4e6cc"], [1, OT.creamD]]);
    ctx.beginPath(); ctx.ellipse(-20, 22, 26, 22, 0, 0, 6.283); ctx.ellipse(20, 22, 26, 22, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 30, 30, 22, 0, 0, 6.283); ctx.fill();
    // brow patches
    ctx.fillStyle = "rgba(232,214,184,0.55)"; ctx.beginPath(); ctx.ellipse(-25, -22, 11, 6, -0.3, 0, 6.283); ctx.ellipse(25, -22, 11, 6, 0.3, 0, 6.283); ctx.fill();
    // nose
    ctx.fillStyle = OT.nose; ctx.beginPath(); ctx.moveTo(-13, 8); ctx.quadraticCurveTo(0, 2, 13, 8); ctx.quadraticCurveTo(10, 22, 0, 24); ctx.quadraticCurveTo(-10, 22, -13, 8); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(-4, 10, 4, 2.5, -0.3, 0, 6.283); ctx.fill();
    // mouth
    ctx.strokeStyle = OT.ink; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(0, 30); ctx.quadraticCurveTo(-6, 37, -12, 32); ctx.moveTo(0, 30); ctx.quadraticCurveTo(6, 37, 12, 32); ctx.stroke();
    // eyes
    const ey = -6;
    if (o.eyes === "open" || o.eyes === "half") {
      [-25, 25].forEach((x) => {
        ctx.fillStyle = "#170e0a"; ctx.beginPath(); ctx.ellipse(x, ey, 7.5, o.eyes === "half" ? 4 : 8.5, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(x - 2.5, ey - (o.eyes === "half" ? 1 : 3), 2.4, 0, 6.283); ctx.fill();
        if (o.eyes === "half") { ctx.strokeStyle = OT.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, ey - 3); ctx.lineTo(x + 9, ey - 3); ctx.stroke(); }
      });
    } else {
      ctx.strokeStyle = "#20140d"; ctx.lineWidth = 3.4;
      [-25, 25].forEach((x) => { ctx.beginPath(); ctx.arc(x, ey - 4, 9, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke(); });
    }
    // whiskers
    ctx.strokeStyle = "rgba(245,235,215,0.55)"; ctx.lineWidth = 1.4;
    [[1, 0], [1, 7], [1, -6]].forEach(([s, dy]) => { [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * 30, 26 + dy * 0.5); ctx.quadraticCurveTo(sd * 60, 22 + dy, sd * 84, 24 + dy * 1.8); ctx.stroke(); }); });
    // whisker dots
    ctx.fillStyle = "rgba(60,35,20,0.5)"; [[-22, 30], [-28, 26], [-18, 36], [22, 30], [28, 26], [18, 36]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.283); ctx.fill(); });
    // blush
    LOFI.glow(ctx, -36, 20, 18, "rgba(230,120,100,0.25)", 1, "source-over"); LOFI.glow(ctx, 36, 20, 18, "rgba(230,120,100,0.25)", 1, "source-over");
    ctx.restore();
  }
  LOFI.head = head;
  LOFI.paw = (ctx, x, y, s, rot) => paw(ctx, x, y, s, rot);
  function paw(ctx, x, y, s = 1, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = OT.furD; ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = "rgba(30,18,10,0.6)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(-5, -2); ctx.moveTo(4, -9); ctx.lineTo(4, -2); ctx.stroke();
    ctx.restore();
  }
  function tail(ctx, pts, w0 = 26, col = OT.fur) {
    // tapered tube along a quadratic curve p0 -> p1 (control) -> p2
    const [p0, c, p2] = pts, n = 18, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p2[0], y = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p2[1];
      const dx = 2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p2[0] - c[0]), dy = 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p2[1] - c[1]), d = Math.hypot(dx, dy) || 1;
      const wd = w0 * (1 - u * 0.85);
      L.push([x - dy / d * wd, y + dx / d * wd]); R.push([x + dy / d * wd, y - dx / d * wd]);
    }
    ctx.fillStyle = col; ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); R.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.fill();
  }
  LOFI.tail = tail;
  function bodyBean(ctx, x, y, rx, ry, rot, top = OT.furL, bot = OT.furD) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = LOFI.lin(ctx, -rx, -ry, rx, ry, [[0, top], [0.55, OT.fur], [1, bot]]);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.283); ctx.fill(); ctx.restore();
  }
  function headphones(ctx, col = "#d9a441", onNeck = false) {
    ctx.save(); ctx.strokeStyle = "#2f2a2e"; ctx.lineWidth = 9; ctx.lineCap = "round";
    if (!onNeck) { ctx.beginPath(); ctx.arc(0, -6, 66, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
    [-1, 1].forEach((s) => { ctx.fillStyle = col; LOFI.rr(ctx, s * 66 - 14, onNeck ? 50 : -12, 28, 40, 10); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,0.25)"; LOFI.rr(ctx, s * 66 - 14 + (s > 0 ? 0 : 18), onNeck ? 50 : -12, 10, 40, 5); ctx.fill(); });
    if (onNeck) { ctx.beginPath(); ctx.moveTo(-62, 68); ctx.quadraticCurveTo(0, 120, 62, 68); ctx.stroke(); }
    ctx.restore();
  }
  LOFI.headphones = headphones;

  /* draw the otter in a pose. o: x, y, s, t (seconds, for breath/tail), eyes, plus pose options */
  LOFI.otter = function (ctx, pose, o) {
    const t = o.t || 0, br = Math.sin(t * 2.0) * 0.012;
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s || 1, o.s || 1);
    if (pose === "cafe") {
      // sitting at a table, 3/4 view toward the window (right), paws around a mug on the table (table drawn by the scene)
      tail(ctx, [[-40, 150], [-130, 190], [-150, 120]], 22);
      ctx.save(); ctx.scale(1, 1 + br); bodyBean(ctx, 0, 70, 78, 118, 0.08, "#9a6c48", "#4b2f1c"); ctx.restore();
      ctx.fillStyle = LOFI.rad(ctx, 18, 60, 4, 90, [[0, "#f1e2c6"], [1, OT.creamD]]); ctx.beginPath(); ctx.ellipse(18, 70, 46, 86, 0.08, 0, 6.283); ctx.fill();
      // scarf
      ctx.fillStyle = "#3d6a7a"; LOFI.rr(ctx, -70, -12, 140, 34, 16); ctx.fill(); ctx.fillStyle = "#2f5562"; LOFI.rr(ctx, 30, 6, 30, 74, 10); ctx.fill();
      ctx.save(); ctx.translate(14, -66); head(ctx, { eyes: o.eyes || "half", rot: 0.12 + Math.sin(t * 0.8) * 0.02, light: "warm" }); ctx.restore();
      // arms to the mug
      ctx.fillStyle = OT.fur; ctx.save(); ctx.translate(-30, 40); ctx.rotate(-0.9); LOFI.rr(ctx, -16, 0, 32, 100, 16); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(58, 44); ctx.rotate(-0.35); LOFI.rr(ctx, -16, 0, 32, 92, 16); ctx.fill(); ctx.restore();
      if (o.paws !== false) { paw(ctx, 52, 126, 1.1, 0.4); paw(ctx, 100, 128, 1.1, -0.3); }
    } else if (pose === "float") {
      // on its back in water, seen from above; head at the top
      const bob = Math.sin(t * 1.6) * 0.02;
      ctx.rotate((o.rot || -0.32) + bob);
      tail(ctx, [[0, 230], [30 * Math.sin(t * 1.2), 330], [-20, 400]], 30, OT.furD);
      // feet
      [-1, 1].forEach((s) => { ctx.fillStyle = OT.furD; ctx.beginPath(); ctx.ellipse(s * 52, 238, 24, 34, s * 0.4, 0, 6.283); ctx.fill(); });
      ctx.save(); ctx.scale(1 + br, 1); bodyBean(ctx, 0, 90, 92, 160, 0, "#97694a", "#4f3220"); ctx.restore();
      ctx.fillStyle = LOFI.rad(ctx, 0, 60, 6, 140, [[0, "#f6e9d2"], [1, OT.creamD]]); ctx.beginPath(); ctx.ellipse(0, 80, 60, 128, 0, 0, 6.283); ctx.fill();
      // the music player on the belly + cable
      ctx.strokeStyle = "#2f2a2e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, 70); ctx.bezierCurveTo(-70, 20, -90, -40, -66, -86); ctx.stroke();
      ctx.save(); ctx.translate(0, 82); ctx.rotate(0.15);
      ctx.fillStyle = "#c9c2b4"; LOFI.rr(ctx, -26, -38, 52, 76, 10); ctx.fill(); ctx.fillStyle = "#2b2b33"; LOFI.rr(ctx, -19, -30, 38, 30, 4); ctx.fill();
      ctx.fillStyle = "#e7b34c"; ctx.fillRect(-15, -26, 30 * ((t * 0.08) % 1), 3);
      ctx.fillStyle = "#9b958a"; ctx.beginPath(); ctx.arc(0, 18, 12, 0, 6.283); ctx.fill(); ctx.restore();
      // arms over the player
      [-1, 1].forEach((s) => { ctx.fillStyle = OT.fur; ctx.save(); ctx.translate(s * 66, 20); ctx.rotate(s * 0.9); LOFI.rr(ctx, -15, 0, 30, 80, 15); ctx.fill(); ctx.restore(); });
      paw(ctx, -22, 66, 1.0, 0.3); paw(ctx, 22, 70, 1.0, -0.3);
      ctx.save(); ctx.translate(0, -88); head(ctx, { eyes: "closed", light: "cool" }); headphones(ctx, "#d9a441"); ctx.restore();
    } else if (pose === "curl") {
      // under a blanket, from above: only the head on the pillow and one paw over the blanket edge (scene draws blanket)
      ctx.save(); ctx.rotate(o.rot || 0.5); head(ctx, { eyes: "closed", light: "cool", ear: Math.sin(t * 3) > 0.97 ? 3 : 0 }); ctx.restore();
      paw(ctx, 70, 92, 1.1, 0.6);
    } else if (pose === "stand") {
      // front view in a yellow raincoat with the hood up, eyes closed, still
      [-1, 1].forEach((s) => { ctx.fillStyle = OT.furD; ctx.beginPath(); ctx.ellipse(s * 34, 262, 30, 15, 0, 0, 6.283); ctx.fill(); });
      tail(ctx, [[60, 200], [120, 230], [140, 160]], 18, OT.furD);
      ctx.save(); ctx.scale(1, 1 + br);
      ctx.fillStyle = LOFI.lin(ctx, -90, 0, 90, 0, [[0, "#c9922a"], [0.45, "#e9b33f"], [1, "#a6731c"]]);
      ctx.beginPath(); ctx.moveTo(-58, -40); ctx.quadraticCurveTo(-96, 120, -84, 240); ctx.quadraticCurveTo(0, 262, 84, 240); ctx.quadraticCurveTo(96, 120, 58, -40); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(90,55,10,0.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 248); ctx.stroke();
      ctx.fillStyle = "#7a5016"; [40, 100, 160].forEach((y) => { ctx.beginPath(); ctx.arc(-10, y, 5, 0, 6.283); ctx.fill(); });
      ctx.fillStyle = "rgba(120,75,15,0.5)"; LOFI.rr(ctx, -70, 130, 40, 30, 6); ctx.fill(); LOFI.rr(ctx, 30, 130, 40, 30, 6); ctx.fill();
      ctx.restore();
      // hood behind the head
      ctx.fillStyle = LOFI.rad(ctx, -20, -110, 10, 120, [[0, "#f0c04d"], [1, "#a8741c"]]); ctx.beginPath(); ctx.ellipse(0, -96, 92, 96, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#3e2a14"; ctx.beginPath(); ctx.ellipse(0, -88, 74, 78, 0, 0, 6.283); ctx.fill();
      ctx.save(); ctx.translate(0, -84); head(ctx, { eyes: "closed", light: "cool", rot: Math.sin(t * 0.7) * 0.02 }); ctx.restore();
      // hood brim over the forehead
      ctx.fillStyle = "#e1ab3c"; ctx.beginPath(); ctx.ellipse(0, -150, 80, 30, 0, Math.PI, 0); ctx.fill();
    } else if (pose === "sprawl") {
      // on its back across the bed, side view; head on the pillow at left, arms up, one foot kicking, tail over the edge
      const kick = Math.sin(t * 2.2) * 0.25;
      tail(ctx, [[200, 40], [290, 60 + Math.sin(t * 1.5) * 20], [330, 170 + Math.sin(t * 1.5 + 1) * 30]], 24, OT.furD);
      ctx.save(); ctx.translate(176, -10); ctx.rotate(-0.9 + kick); ctx.fillStyle = OT.fur; LOFI.rr(ctx, -16, -110, 32, 110, 16); ctx.fill(); ctx.fillStyle = OT.furD; ctx.beginPath(); ctx.ellipse(0, -118, 22, 16, 0, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.save(); ctx.scale(1, 1 + br * 2); bodyBean(ctx, 40, 20, 170, 74, 0.05, "#a07250", "#4f3220");
      // the belly faces up: a cream crescent along the top of the body (clipped to the body)
      ctx.save(); ctx.translate(40, 20); ctx.rotate(0.05); ctx.beginPath(); ctx.ellipse(0, 0, 170, 74, 0, 0, 6.283); ctx.clip();
      ctx.fillStyle = LOFI.lin(ctx, 0, -80, 0, -10, [[0, "#f6e9d2"], [1, OT.creamD]]); ctx.beginPath(); ctx.ellipse(-10, -62, 150, 46, 0, 0, 6.283); ctx.fill();
      ctx.restore(); ctx.restore();
      // arms up over the head
      ctx.fillStyle = OT.fur; ctx.save(); ctx.translate(-110, -20); ctx.rotate(-2.2 + Math.sin(t * 0.9) * 0.05); LOFI.rr(ctx, -15, 0, 30, 120, 15); ctx.fill(); ctx.restore();
      paw(ctx, -205, -96, 1.1, 0.5);
      ctx.save(); ctx.translate(-168, 0); ctx.rotate(-1.75); ctx.scale(1.25, 1.25); head(ctx, { eyes: "closed", light: "warm" }); ctx.restore();
    } else if (pose === "sill") {
      // front view on the window seat, wrapped in a plaid blanket, headphones round the neck
      ctx.save(); ctx.scale(1, 1 + br);
      bodyBean(ctx, 0, 110, 104, 120, 0, "#94694a", "#4f3220");
      ctx.fillStyle = LOFI.rad(ctx, 0, 90, 6, 110, [[0, "#f6e9d2"], [1, OT.creamD]]); ctx.beginPath(); ctx.ellipse(0, 110, 56, 92, 0, 0, 6.283); ctx.fill();
      ctx.restore();
      // the blanket over the shoulders (plaid)
      ctx.save();
      ctx.beginPath(); ctx.moveTo(-60, -10); ctx.quadraticCurveTo(-170, 60, -190, 250); ctx.lineTo(-120, 262); ctx.quadraticCurveTo(-90, 130, -40, 60); ctx.lineTo(40, 60); ctx.quadraticCurveTo(90, 130, 120, 262); ctx.lineTo(190, 250); ctx.quadraticCurveTo(170, 60, 60, -10); ctx.closePath();
      ctx.fillStyle = "#a8432c"; ctx.fill(); ctx.clip();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = "#5e2116"; ctx.lineWidth = 12; for (let x = -220; x < 220; x += 46) { ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x + 30, 300); ctx.stroke(); }
      for (let y = -20; y < 300; y += 46) { ctx.beginPath(); ctx.moveTo(-220, y); ctx.lineTo(220, y + 10); ctx.stroke(); }
      ctx.strokeStyle = "#e3a04e"; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; for (let x = -200; x < 220; x += 46) { ctx.beginPath(); ctx.moveTo(x + 14, -40); ctx.lineTo(x + 44, 300); ctx.stroke(); }
      ctx.restore();
      // feet
      [-1, 1].forEach((s) => { ctx.fillStyle = OT.furD; ctx.beginPath(); ctx.ellipse(s * 40, 232, 26, 16, 0, 0, 6.283); ctx.fill(); });
      paw(ctx, -38, 150, 1.1, 0.3); paw(ctx, 38, 150, 1.1, -0.3);
      ctx.save(); ctx.translate(0, -60); head(ctx, { eyes: "closed", light: "cool", rot: Math.sin(t * 0.6) * 0.025 }); headphones(ctx, "#8fb3a8", true); ctx.restore();
    }
    ctx.restore();
  };


  /* draw a character into a screen-size buffer under ctx's current transform, then texture it like the painted layers
     and light it (source-atop radial washes in screen space: warm practicals, cool rims), then composite. */
  let CH = null;
  LOFI.char = function (ctx, draw, o = {}) {
    if (!CH) CH = canvas(W, H);
    const x = CH.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.clearRect(0, 0, W, H);
    x.setTransform(ctx.getTransform()); draw(x); x.setTransform(1, 0, 0, 1, 0, 0);
    LOFI.brush(x, o.kd == null ? 0.45 : o.kd, o.kl == null ? 0.3 : o.kl);
    (o.lights || []).forEach(([lx, ly, r, col, mode]) => {
      x.save(); x.globalCompositeOperation = "source-atop";
      const g = x.createRadialGradient(lx, ly, 0, lx, ly, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
    });
    if (o.shade) { x.save(); x.globalCompositeOperation = "source-atop"; x.fillStyle = o.shade; x.fillRect(0, 0, W, H); x.restore(); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CH, 0, 0); ctx.restore();
  };

  LOFI.ready = function () { makeTextures(); return Promise.resolve(true); };
  window.LOFI = LOFI;
})();
