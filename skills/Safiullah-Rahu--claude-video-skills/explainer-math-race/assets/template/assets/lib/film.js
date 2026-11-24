/* film.js — a two-curve race (the curves, labels and crossings come from window.RACE in race.js; the beats from cfg):
   the camera follows the heads, the first crossing triggers the iris reveal on the music's drop, every crossing gets a
   split-colour dot and its exact x, and the end pulls back to show the whole race. Pure function of t on one
   1080x1920 canvas. */
window.MATH_FILM = function (canvas, cfg) {
  "use strict";
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;
  const PL = { x: 0, y: 300, w: 1080, h: 1552 };
  const DUR = cfg.dur;
  const BEAT = 60 / cfg.bpm, B0 = cfg.beat0;
  const bt = (k) => B0 + k * BEAT;
  const RC = cfg.race || window.RACE;
  const f1 = RC.f1, f2 = RC.f2, COL1 = RC.col1, COL2 = RC.col2;
  const CROSS = RC.crossings.map((c, i) => ({ x: c.x, lab: c.lab, t: bt(cfg.crossBeats[i]) }));
  const T_X1 = CROSS[0].t, T_DROP = bt(cfg.dropBeat != null ? cfg.dropBeat : cfg.crossBeats[0]), T_REV = bt(cfg.revealBeat);
  const ROOT1 = CROSS[0].x;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const eo = (k) => { k = clamp(k, 0, 1); return 1 - Math.pow(1 - k, 3); };
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  const rnd = (i, j) => hash((i | 0) * 7919 + (j | 0) * 104729 + 17);

  // ---------------------------------------------------------------- head position x(t): monotone cubic (Fritsch-Carlson)
  const KN = [[0, RC.xStart]].concat(CROSS.map((c) => [c.t, c.x]), [[T_REV, RC.xReveal], [DUR, RC.xEnd]]);
  const m = [];
  const d = KN.slice(1).map((p, i) => (p[1] - KN[i][1]) / (p[0] - KN[i][0]));
  for (let i = 0; i < KN.length; i++) {
    if (i === 0) m.push(d[0]); else if (i === KN.length - 1) m.push(d[d.length - 1]);
    else m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  }
  function xh(t) {
    t = clamp(t, 0, DUR);
    let i = 0;
    while (i < KN.length - 2 && t > KN[i + 1][0]) i++;
    const [t0, x0] = KN[i], [t1, x1] = KN[i + 1], h = t1 - t0, s = (t - t0) / h;
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
    return h00 * x0 + h10 * h * m[i] + h01 * x1 + h11 * h * m[i + 1];
  }

  // ---------------------------------------------------------------- camera: targets, then a one-pole smoother run once at init
  function target(t) {
    const x = xh(t), y1 = f1(x), y2 = f2(x), mid = (y1 + y2) / 2, gap = Math.abs(y1 - y2);
    const asp = PL.h / PL.w;
    if (t < T_DROP - 0.15) {
      const sy = Math.max(1.05, gap * 1.9 + 0.45);
      return { cx: x, cy: mid, sx: sy / asp, sy };
    }
    const k = sm((t - T_DROP + 0.15) / 0.75);
    const sx = lerp(2.2, 3.0, k) + 0.24 * Math.max(0, t - T_DROP);
    const dv = (f) => Math.abs(f(x + 1e-3) - f(x - 1e-3)) / 2e-3, slope = (dv(f1) + dv(f2)) / 2;
    let sy = Math.max(sx * asp, slope * sx * asp / 1.7, gap * 2.5 + 0.8);
    let cx = x, cy = mid;
    if (t > T_REV - 0.2) {
      const r = sm((t - T_REV + 0.2) / 1.0);
      let lo = 0, hi = 0;
      for (let i = 0; i <= 60; i++) { const q = lerp(RC.xStart, x, i / 60); lo = Math.min(lo, f1(q), f2(q)); hi = Math.max(hi, f1(q), f2(q)); }
      const fx0 = RC.xStart - 0.7, fx1 = x + 0.3 * (x - RC.xStart), fy0 = lo - 0.36 * (hi - lo), fy1 = hi + 0.2 * (hi - lo); // room below: the bottom 18 % is under the app's caption UI
      cx = lerp(cx, (fx0 + fx1) / 2 + 0.1, r); cy = lerp(cy, (fy0 + fy1) / 2, r);
      return { cx, cy, sx: Math.exp(lerp(Math.log(sx), Math.log(fx1 - fx0), r)), sy: Math.exp(lerp(Math.log(sy), Math.log(fy1 - fy0), r)) };
    }
    return { cx, cy, sx, sy };
  }
  const CAM = [], DT = 1 / 120;
  {
    let c = target(0);
    c = { cx: c.cx, cy: c.cy, lsx: Math.log(c.sx), lsy: Math.log(c.sy) };
    for (let i = 0; i <= Math.ceil(DUR / DT) + 2; i++) {
      const t = i * DT, g = target(t);
      const tau = t > T_REV - 0.2 ? 0.25 : t < T_DROP ? 0.22 : 0.32;
      const a = 1 - Math.exp(-DT / tau);
      c.cx += (g.cx - c.cx) * Math.min(1, a * 2.2); c.cy += (g.cy - c.cy) * a; c.lsx += (Math.log(g.sx) - c.lsx) * a; c.lsy += (Math.log(g.sy) - c.lsy) * a;
      // keep the heads' x exactly centred until the reveal (the source's follow-cam)
      CAM.push({ cx: t < T_REV - 0.2 ? xh(t) : c.cx, cy: c.cy, sx: Math.exp(c.lsx), sy: Math.exp(c.lsy) });
    }
  }
  function cam(t) { const f = clamp(t / DT, 0, CAM.length - 1.001), i = Math.floor(f), k = f - i, a = CAM[i], b = CAM[i + 1]; return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), sx: lerp(a.sx, b.sx, k), sy: lerp(a.sy, b.sy, k) }; }

  // ---------------------------------------------------------------- particles (stars + sparkles), seeded
  const STARS = [], SPARK = [];
  for (let i = 0; i < 74; i++) STARS.push({ x: rnd(i, 1) * W, y: rnd(i, 2) * H, s: 9 + rnd(i, 3) ** 2 * 26, v: 14 + rnd(i, 4) * 30, ph: rnd(i, 5) * 6.28, c: ["#ffd36e", "#ffd36e", "#ffb3d1", "#c5b3ff", "#fff3d6"][Math.floor(rnd(i, 6) * 5)], rot: rnd(i, 7) * 6.28, sw: 6 + rnd(i, 8) * 16 });
  for (let i = 0; i < 34; i++) SPARK.push({ x: rnd(i, 11) * W, y: rnd(i, 12) * H, s: 8 + rnd(i, 13) * 20, ph: rnd(i, 14) * 6.28, f: 0.7 + rnd(i, 15) * 1.6, v: 6 + rnd(i, 16) * 12 });
  const glowCache = new Map();
  function glowSprite(col, r) {
    const key = col + r;
    let c = glowCache.get(key);
    if (c) return c;
    c = document.createElement("canvas"); c.width = c.height = r * 2;
    const g = c.getContext("2d"), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.5; g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    glowCache.set(key, c);
    return c;
  }
  function star5(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function particles(t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    for (const p of STARS) {
      const y = ((p.y - p.v * t) % (H + 80) + H + 80) % (H + 80) - 40, x = p.x + Math.sin(t * 0.6 + p.ph) * p.sw;
      const tw = 0.62 + 0.38 * Math.sin(t * 2.1 + p.ph * 3);
      ctx.globalAlpha = alpha * tw;
      const gs = glowSprite(p.c, Math.round(p.s * 1.9));
      ctx.drawImage(gs, x - p.s * 1.9, y - p.s * 1.9);
      star5(x, y, p.s * 0.55, p.rot + Math.sin(t * 0.5 + p.ph) * 0.3);
      ctx.fillStyle = p.c; ctx.fill();
    }
    ctx.strokeStyle = "#ffffff"; ctx.lineCap = "round";
    for (const p of SPARK) {
      const k = Math.max(0, Math.sin(t * p.f * 2.4 + p.ph)) ** 2;
      if (k < 0.02) continue;
      const y = ((p.y - p.v * t) % H + H) % H, s = p.s * (0.4 + 0.6 * k);
      ctx.globalAlpha = alpha * k;
      ctx.drawImage(glowSprite("#ffffff", Math.round(s)), p.x - s, y - s);
      ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(p.x - s, y); ctx.lineTo(p.x + s, y); ctx.moveTo(p.x, y - s); ctx.lineTo(p.x, y + s); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- grid, axes, ticks
  const STEPS = [];
  for (let e = -3; e <= 4; e++) for (const b of [1, 2, 5]) STEPS.push(b * Math.pow(10, e));
  function fmt(v, step) {
    const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    let s = Math.abs(v) < step / 1000 ? "0" : v.toFixed(dec);
    return s.replace("-", "−");
  }
  function grid(t, C, alpha) {
    const ux = PL.w / C.sx, uy = PL.h / C.sy;
    const X = (x) => PL.x + PL.w / 2 + (x - C.cx) * ux, Y = (y) => PL.y + PL.h / 2 - (y - C.cy) * uy;
    const x0 = C.cx - C.sx / 2, x1 = C.cx + C.sx / 2, y0 = C.cy - C.sy / 2, y1 = C.cy + C.sy / 2;
    ctx.save(); ctx.globalAlpha = alpha;
    // minor + major lines
    const lines = (u, a0, a1, horiz) => {
      for (const st of STEPS) {
        const p = st * u;
        if (p < 26) continue;
        const al = clamp((p - 26) / 60, 0, 1) * 0.11 + (p > 140 ? 0.06 : 0);
        if (p > 1600) break;
        ctx.strokeStyle = `rgba(150,140,190,${al})`; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let v = Math.ceil(a0 / st) * st; v <= a1; v += st) {
          if (horiz) { const yy = Math.round(Y(v)) + 0.5; ctx.moveTo(PL.x, yy); ctx.lineTo(PL.x + PL.w, yy); }
          else { const xx = Math.round(X(v)) + 0.5; ctx.moveTo(xx, PL.y); ctx.lineTo(xx, PL.y + PL.h); }
        }
        ctx.stroke();
        break;
      }
    };
    lines(ux, x0, x1, false); lines(uy, y0, y1, true);
    // labelled level: finest step with spacing >= 100 px fading in, the next coarser at full
    const labelSet = (u) => { let i = STEPS.findIndex((s) => s * u >= 100); if (i < 0) i = STEPS.length - 1; return [[STEPS[i], clamp((STEPS[i] * u - 100) / 45, 0, 1)], [STEPS[Math.min(i + 1, STEPS.length - 1)], 1]]; };
    ctx.strokeStyle = "rgba(160,150,200,0.22)"; ctx.lineWidth = 2;
    const [lx, ly] = [labelSet(ux), labelSet(uy)];
    ctx.beginPath();
    for (let v = Math.ceil(x0 / lx[1][0]) * lx[1][0]; v <= x1; v += lx[1][0]) { const xx = Math.round(X(v)) + 0.5; ctx.moveTo(xx, PL.y); ctx.lineTo(xx, PL.y + PL.h); }
    for (let v = Math.ceil(y0 / ly[1][0]) * ly[1][0]; v <= y1; v += ly[1][0]) { const yy = Math.round(Y(v)) + 0.5; ctx.moveTo(PL.x, yy); ctx.lineTo(PL.x + PL.w, yy); }
    ctx.stroke();
    // axes
    ctx.strokeStyle = "rgba(225,220,240,0.62)"; ctx.lineWidth = 2.5;
    const ax = clamp(Y(0), PL.y - 10, PL.y + PL.h + 10), ay = clamp(X(0), -10, W + 10);
    ctx.beginPath(); ctx.moveTo(0, ax); ctx.lineTo(W, ax); ctx.moveTo(ay, PL.y); ctx.lineTo(ay, PL.y + PL.h); ctx.stroke();
    // tick labels
    ctx.font = "500 25px MPoppins"; ctx.fillStyle = "#7b7688"; ctx.textBaseline = "top";
    const lyX = clamp(Y(0) + 12, PL.y + 8, PL.y + PL.h - 40);
    for (const [st, a] of lx) {
      if (a <= 0) continue;
      ctx.globalAlpha = alpha * a; ctx.textAlign = "center";
      for (let v = Math.ceil(x0 / st) * st; v <= x1; v += st) { if (Math.abs(v) < st / 1000) continue; const xx = X(v); if (xx < 30 || xx > W - 30) continue; ctx.fillText(fmt(v, st), xx, lyX); }
    }
    ctx.textBaseline = "middle";
    const lxY = X(0) + 14 < 0 || X(0) > W - 90 ? 16 : X(0) + 14;
    for (const [st, a] of ly) {
      if (a <= 0) continue;
      ctx.globalAlpha = alpha * a; ctx.textAlign = "left";
      for (let v = Math.ceil(y0 / st) * st; v <= y1; v += st) { if (Math.abs(v) < st / 1000) continue; const yy = Y(v); if (yy < PL.y + 20 || yy > PL.y + PL.h - 20) continue; ctx.fillText(fmt(v, st), lxY, yy); }
    }
    ctx.restore();
    return { X, Y, ux, uy };
  }

  // ---------------------------------------------------------------- curves, heads, labels, crossings
  const X_START = RC.xStart;
  function curve(f, col, P, xEnd, C) {
    const xs0 = Math.max(X_START, C.cx - C.sx / 2 - 0.05), step = C.sx / PL.w * 2.5;
    if (xEnd <= xs0) return;
    ctx.beginPath();
    let first = true;
    for (let x = xs0; ; x += step) {
      const xx = Math.min(x, xEnd), yy = P.Y(f(xx));
      if (first) { ctx.moveTo(P.X(xx), clamp(yy, -4000, 6000)); first = false; } else ctx.lineTo(P.X(xx), clamp(yy, -4000, 6000));
      if (x >= xEnd) break;
    }
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = col; ctx.globalAlpha = 0.16; ctx.lineWidth = 16; ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.lineWidth = 8; ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 4.2; ctx.stroke();
  }
  function head(x, y, col, t) {
    const pulse = 1 + 0.08 * Math.sin(t * 7);
    ctx.drawImage(glowSprite(col, 58), x - 58, y - 58);
    ctx.fillStyle = col; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(x, y, 22 * pulse, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 10.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
  }
  // "y = 2^x" / "y = x^2" with a LaTeX feel: italic serif letters, upright digits and "=", raised exponent
  function mathLabel(x, y, which, col, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 8;
    const FONTS = { i: "italic 400 44px MBask", u: "400 44px MBaskR", si: "italic 400 30px MBask", su: "400 30px MBaskR" };
    let cx = x;
    for (const [s, st] of (which === 1 ? RC.lab1 : RC.lab2)) {
      const sup = st === "si" || st === "su";
      ctx.font = FONTS[st] || FONTS.u; ctx.fillText(s, cx + (sup ? 2 : 0), y - (sup ? 20 : 0)); cx += ctx.measureText(s).width + (sup ? 2 : 0);
    }
    ctx.restore();
  }
  function crossMark(P, c, t) {
    if (t < c.t) return;
    const x = P.X(c.x), y = P.Y(f1(c.x)), k = (t - c.t) / 0.9;
    if (k < 1) { ctx.strokeStyle = "rgba(255,255,255," + (1 - k) * 0.8 + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 14 + eo(k) * 90, 0, 7); ctx.stroke(); }
    ctx.drawImage(glowSprite("#ffffff", 34), x - 34, y - 34);
    ctx.fillStyle = COL1; ctx.beginPath(); ctx.arc(x, y, 12, Math.PI / 2, Math.PI * 1.5); ctx.fill();
    ctx.fillStyle = COL2; ctx.beginPath(); ctx.arc(x, y, 12, -Math.PI / 2, Math.PI / 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.stroke();
    const a = clamp((t - c.t - 0.15) / 0.35, 0, 1);
    ctx.save(); ctx.globalAlpha = a; ctx.font = "600 28px MPoppins"; ctx.fillStyle = "#f4f0ff"; ctx.textAlign = "right"; ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 6;
    const wlab = ctx.measureText(c.lab).width;
    if (x - 22 - wlab < 16) { ctx.textAlign = "left"; ctx.fillText(c.lab, x + 22, y + 18); } else ctx.fillText(c.lab, x - 22, y + 18);
    ctx.restore();
  }

  // ---------------------------------------------------------------- header
  function header(t) {
    ctx.fillStyle = "#0b0a0f"; ctx.fillRect(0, 0, W, PL.y); ctx.fillRect(0, PL.y + PL.h, W, H - PL.y - PL.h);
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "500 22px MPoppins"; ctx.fillStyle = "#6f6a7a";
    const brand = RC.brand; let wsum = 0; const sp = 7;
    for (const ch of brand) wsum += ctx.measureText(ch).width + sp;
    let bx = W / 2 - (wsum - sp) / 2; ctx.textAlign = "left";
    for (const ch of brand) { ctx.fillText(ch, bx, 126); bx += ctx.measureText(ch).width + sp; }
    // title: 2^x  vs  x^2
    const big = "600 48px MPoppins", sup = "600 30px MPoppins";
    const parts = RC.title.map((q) => [q[0], q[1] ? sup : big, q[1] ? 1 : 0]);
    ctx.font = big; let tw = 0;
    for (const [s, f, u] of parts) { ctx.font = f; tw += ctx.measureText(s).width + (u ? 3 : 0); }
    let x = W / 2 - tw / 2; ctx.fillStyle = "#f5f3fa";
    for (const [s, f, u] of parts) { ctx.font = f; ctx.fillText(s, x + (u ? 3 : 0), 190 - (u ? 20 : 0)); x += ctx.measureText(s).width + (u ? 3 : 0); }
    // lead chip (upgrade): who is ahead, and how many lead changes so far
    const swaps = CROSS.filter((c) => t >= c.t).length;
    ctx.font = "500 24px MPoppins"; ctx.fillStyle = "#8c8799"; ctx.textAlign = "center";
    ctx.fillText(`lead changes: ${swaps} / ${CROSS.length}`, W / 2, 252);
    ctx.restore();
  }

  // ---------------------------------------------------------------- frame
  function draw(t) {
    if (ctx.reset) ctx.reset(); // a fresh state every frame: no leaked clip or alpha
    const C = cam(t);
    // background: dark plot, faint centre glow
    ctx.fillStyle = "#0d0c12"; ctx.fillRect(0, 0, W, H);
    const cg = ctx.createRadialGradient(540, 1076, 60, 540, 1076, 520);
    cg.addColorStop(0, "rgba(40,34,52,.55)"); cg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cg; ctx.fillRect(0, PL.y, W, PL.h);
    // the reveal (iris) at the drop: gradient + stars
    const rk = eo((t - T_DROP + 0.04) / 0.7), R = rk * 1900;
    const C0 = cam(T_DROP), IX = PL.x + PL.w / 2 + (ROOT1 - C0.cx) * PL.w / C0.sx, IY = PL.y + PL.h / 2 - (f1(ROOT1) - C0.cy) * PL.h / C0.sy;
    if (R > 0) {
      ctx.save(); ctx.beginPath(); ctx.arc(IX, IY, R, 0, 7); ctx.clip();
      ctx.fillStyle = "#120e1b"; ctx.fillRect(0, PL.y, W, PL.h);
      const g1 = ctx.createRadialGradient(120, 1900, 50, 120, 1900, 1500);
      g1.addColorStop(0, "rgba(128,40,120,.85)"); g1.addColorStop(0.45, "rgba(80,30,100,.45)"); g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1; ctx.fillRect(0, PL.y, W, PL.h);
      const g2 = ctx.createRadialGradient(980, 420, 20, 980, 420, 900);
      g2.addColorStop(0, "rgba(70,40,120,.45)"); g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, PL.y, W, PL.h);
      particles(t, clamp((t - T_DROP) / 0.5 + 0.4, 0, 1));
      ctx.restore();
      if (rk < 1) {
        ctx.save(); ctx.shadowColor = "rgba(200,190,255,.9)"; ctx.shadowBlur = 24;
        ctx.strokeStyle = `rgba(230,225,255,${0.85 * (1 - rk)})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(IX, IY, R, 0, 7); ctx.stroke(); ctx.restore();
        const fl = Math.max(0, 1 - (t - T_DROP) / 0.35);
        if (fl > 0) { ctx.globalAlpha = fl; ctx.drawImage(glowSprite("#ffffff", 220), IX - 220, IY - 220); ctx.globalAlpha = 1; }
      }
    }
    ctx.save(); ctx.beginPath(); ctx.rect(PL.x, PL.y, PL.w, PL.h); ctx.clip();
    const P = grid(t, C, 1);
    const x = xh(t);
    curve(f2, COL2, P, x, C);
    curve(f1, COL1, P, x, C);
    for (const c of CROSS) crossMark(P, c, t);
    const h1 = [P.X(x), P.Y(f1(x))], h2 = [P.X(x), P.Y(f2(x))];
    head(h2[0], h2[1], COL2, t); head(h1[0], h1[1], COL1, t + 0.4);
    // labels: the leader's label sits above its head, the trailer's below; they swap smoothly at each crossing
    // the leader flips at every crossing; the swap runs 0.32 s, the new trailer's label arcs out to the right and dims
    let lead1 = RC.firstLead === 1 ? 1 : 0, swapK = 1, last = -1;
    for (const c of CROSS) if (t >= c.t) { lead1 = 1 - lead1; last = c.t; }
    if (last >= 0) swapK = sm((t - last) / 0.32);
    const from1 = 1 - lead1, up1 = lerp(from1, lead1, swapK), arc = Math.sin(Math.PI * swapK) * (last >= 0 && swapK < 1 ? 1 : 0);
    const lab = (h, up, push) => [h[0] + 30 + push * 250 * arc, h[1] + lerp(66, -28, up)];
    const l1 = lab(h1, up1, lead1 ? 0 : 1), l2 = lab(h2, 1 - up1, lead1 ? 1 : 0);
    mathLabel(l2[0], l2[1], 2, COL2, lead1 ? 1 - 0.5 * arc : 1); mathLabel(l1[0], l1[1], 1, COL1, lead1 ? 1 : 1 - 0.5 * arc);
    ctx.restore();
    // soft edges of the plot area
    const e1 = ctx.createLinearGradient(0, PL.y, 0, PL.y + 70); e1.addColorStop(0, "rgba(11,10,15,1)"); e1.addColorStop(1, "rgba(11,10,15,0)");
    ctx.fillStyle = e1; ctx.fillRect(0, PL.y, W, 70);
    const e2 = ctx.createLinearGradient(0, PL.y + PL.h - 70, 0, PL.y + PL.h); e2.addColorStop(0, "rgba(11,10,15,0)"); e2.addColorStop(1, "rgba(11,10,15,1)");
    ctx.fillStyle = e2; ctx.fillRect(0, PL.y + PL.h - 70, W, 70);
    header(t);
  }
  return { draw, T: { cross: CROSS.map((c) => c.t), DROP: T_DROP, REV: T_REV }, xh, cam };
};
