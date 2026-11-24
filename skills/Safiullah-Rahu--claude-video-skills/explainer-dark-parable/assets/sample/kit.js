/* dark-parable kit: a seek-safe Canvas2D shot player + flat line-art primitives for the "dark parable" reel format.
   Everything drawn is a pure function of t (no Math.random at draw time, no timers).
   DP.create({canvas, width, height}) -> K ; K.play(shots) ; K.render(t)
   shot = {t0, xf (cross-dissolve seconds into this shot, 0 = cut), draw(ctx, lt, u, t)}  (t1 = next shot's t0) */
(function () {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    lin: (t) => t,
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    o: (t) => 1 - Math.pow(1 - t, 3),
    i: (t) => t * t * t,
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const ramp = (t, a, b, e) => { const u = clamp((t - a) / Math.max(1e-6, b - a)); return e ? e(u) : u; };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }

  // palette (measured on the source, see SKILL.md §4)
  const P = {
    bg: "#0e0e0f", grid: "#1d1d20", arch: "#18181a", line: "#e8e2d6", lineDim: "#8d8a84",
    robe: "#4e1a20", robeDk: "#2a0e12", skin: "#b8826a", skinDk: "#9a6a55", cuff: "#d9cfbf", hat: "#8b9096",
    ele: "#a9857d", eleDk: "#8b6b66", eleEar: "#9a7871", nail: "#d9cfbf",
    wood: "#6e4b35", gold: "#f2b630", goldHi: "#ffd76a", suit: "#1f293b", shoe: "#3a2a24", cream: "#d8ccb4",
  };

  function create({ canvas, width, height }) {
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    off.width = width; off.height = height;
    const octx = off.getContext("2d");
    let shots = [];
    const K = {
      W: width, H: height, ctx, P, E, D, ramp, clamp, lerp, rng,
      ready: Promise.all([
        document.fonts ? document.fonts.load('700 44px "DPInter"') : Promise.resolve(),
        document.fonts ? document.fonts.load('500 30px "DPMono"') : Promise.resolve(),
      ]).catch(() => {}),
      play(list) { shots = list.slice().sort((a, b) => a.t0 - b.t0); },
      shotAt(t) { let k = 0; for (let i = 0; i < shots.length; i++) if (shots[i].t0 <= t) k = i; return k; },
      render(t) {
        const k = K.shotAt(t);
        const s = shots[k];
        const t1 = k + 1 < shots.length ? shots[k + 1].t0 : 1e9;
        const xf = s.xf || 0;
        if (k > 0 && xf > 0 && t < s.t0 + xf) {
          const p = shots[k - 1];
          drawShot(ctx, p, t, s.t0 + xf);
          drawShot(octx, s, t, t1);
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = E.sine(clamp((t - s.t0) / xf));
          ctx.drawImage(off, 0, 0); ctx.restore();
        } else drawShot(ctx, s, t, t1);
        if (!s.noMotes) motes(ctx, t);
      },
    };
    const MR = rng(91), M = Array.from({ length: 40 }, () => ({ x: MR() * width, y: MR() * height, v: 8 + MR() * 18, r: 1.2 + MR() * 2.2, ph: MR() * 6.28, a: 0.10 + MR() * 0.16 }));
    function motes(c, t) { // slow dust drifting up through the dark (seek-safe: position from t)
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      for (const m of M) {
        const y = ((m.y - m.v * t) % height + height) % height, x = m.x + Math.sin(t * 0.4 + m.ph) * 14;
        c.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(t * 0.9 + m.ph)); c.fillStyle = "#d8cdb8"; c.beginPath(); c.arc(x, y, m.r, 0, 6.283); c.fill();
      }
      c.restore();
    }
    function drawShot(c, s, t, t1) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      c.fillStyle = s.bg || P.bg; c.fillRect(0, 0, width, height);
      const lt = t - s.t0, u = clamp(lt / Math.max(0.01, t1 - s.t0));
      s.draw(c, lt, u, t);
      c.restore();
    }
    return K;
  }

  // ---------------------------------------------------------------- drawing helpers (all take ctx first)
  const D = {};
  D.push = (c, fx, fy, s = 1) => c.setTransform(s, 0, 0, s, fx - fx * s, fy - fy * s); // scale about a fixed screen point
  D.cam = (c, x, y, s = 1, rot = 0, W = 1080, H = 1920) => { // world point (x, y) to the frame centre, scale s
    c.setTransform(s, 0, 0, s, W / 2 - x * s, H / 2 - y * s);
    if (rot) { c.translate(x, y); c.rotate(rot); c.translate(-x, -y); }
  };
  D.st = (c, col = P.line, lw = 2.6) => { c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); };
  D.fs = (c, fill, col = P.line, lw = 2.6) => { if (fill) { c.fillStyle = fill; c.fill(); } if (col) D.st(c, col, lw); };
  D.ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); };
  D.rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  D.poly = (c, pts, close) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath(); };
  D.glow = (c, col, blur) => { c.shadowColor = col; c.shadowBlur = blur; };
  D.noglow = (c) => { c.shadowColor = "transparent"; c.shadowBlur = 0; };
  D.radial = (c, x, y, r, col, a) => { // soft halo (the source's grey glow behind a power figure's head)
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.55, `rgba(${col},${a * 0.45})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  // perspective ground grid in SCREEN space: horizon y, vanishing x, alpha
  D.grid = (c, hy, vx = 540, a = 1, W = 1080, H = 1920, col = P.grid) => {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = 1.6;
    for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(vx, hy); c.lineTo(vx + i * 260, H + 40); c.stroke(); }
    for (let k = 1; k < 16; k++) { const y = hy + (H - hy) * Math.pow(k / 15, 2.2); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore();
  };
  // faint vertical "pillars" / far shapes (the hall-architecture layer of the source; ours: camp posts and tents)
  D.camp = (c, hy, a = 1, W = 1080) => {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= a; c.strokeStyle = P.arch; c.lineWidth = 3;
    const posts = [70, 250, 830, 1010];
    for (const x of posts) { c.beginPath(); c.moveTo(x, hy - 520); c.lineTo(x, hy + 30); c.stroke(); }
    for (const [x, w] of [[160, 260], [920, 240]]) { // two tent outlines
      c.beginPath(); c.moveTo(x - w / 2, hy); c.lineTo(x, hy - w * 0.7); c.lineTo(x + w / 2, hy); c.stroke();
      c.beginPath(); c.moveTo(x, hy - w * 0.7); c.lineTo(x, hy); c.stroke();
    }
    c.beginPath(); c.moveTo(0, hy - 520); c.quadraticCurveTo(W / 2, hy - 600, W, hy - 520); c.stroke(); // canopy line
    c.restore();
  };

  // ---------------------------------------------------------------- characters
  // elephant, side view, origin = ground under the body centre, facing right when f = 1. o:
  //  s scale (1 = adult body ~300 px long), baby (0..1 head/leg proportions), lean (-1 pull back .. 1), trunk (0 down .. 1 raised),
  //  head (tilt rad), leg (front-leg lift 0..1), ear (flap 0..1), eye ("open" | "closed" | "sad" | "wide"), fill, alpha
  D.elephant = (c, o) => {
    const s = o.s || 1, f = o.f || 1, b = o.baby || 0, lean = o.lean || 0, tr = o.trunk || 0;
    const fill = o.fill || P.ele, dk = o.dark || P.eleDk, ear = o.earFill || P.eleEar, lw = (o.lw || 2.6) / s;
    c.save(); c.translate(o.x, o.y); c.scale(s * f, s); c.rotate(-lean * 0.08 * f * f);
    const legH = lerp(78, 62, b), bodyY = -legH - lerp(70, 62, b);
    const hr = lerp(58, 70, b); // head radius
    const hx = lerp(118, 108, b), hy = bodyY - lerp(18, 4, b);
    const leg = (x, lift, col) => { // pillar leg with toenails
      c.save(); c.translate(x, -legH - 6); c.rotate(-lift * 0.5);
      D.rr(c, -19, 0, 38, legH + 6 - lift * 10, 14); D.fs(c, col, P.line, lw);
      for (const nx of [-9, 4]) { D.ell(c, nx, legH + 2 - lift * 10, 5.5, 4); D.fs(c, P.nail, null); }
      c.restore();
    };
    leg(-72, 0, dk); leg(lerp(58, 50, b) + 22, 0, dk); // far legs
    // tail
    c.beginPath(); c.moveTo(-128, bodyY - 26); c.quadraticCurveTo(-150, bodyY + 10, -142, bodyY + 40); D.st(c, P.line, lw);
    D.ell(c, -141, bodyY + 46, 5, 9); D.fs(c, P.line, null);
    // body
    c.beginPath();
    c.moveTo(-130, bodyY + 10);
    c.bezierCurveTo(-140, bodyY - 70, -40, bodyY - lerp(98, 84, b), 40, bodyY - lerp(86, 74, b));
    c.bezierCurveTo(100, bodyY - 70, 120, bodyY - 20, 110, bodyY + 30);
    c.bezierCurveTo(100, bodyY + 70, 40, bodyY + 78, -20, bodyY + 76);
    c.bezierCurveTo(-90, bodyY + 74, -128, bodyY + 60, -130, bodyY + 10);
    c.closePath(); D.fs(c, fill, P.line, lw);
    leg(-96, 0, fill); leg(lerp(58, 50, b), o.leg || 0, fill); // near legs
    // head
    c.save(); c.translate(hx, hy); c.rotate((o.head || 0) * f);
    // trunk: tapered tube from the face down / forward / up
    const tx = lerp(52, 104, tr), ty = lerp(150, -96, tr) * lerp(1, 0.86, b);
    const c1x = lerp(70, 84, tr), c1y = lerp(40, 46, tr), c2x = lerp(60, 140, tr), c2y = lerp(110, -6, tr);
    const N = 18, wl = [], wr = [];
    for (let i = 0; i <= N; i++) {
      const q = i / N, mq = 1 - q;
      const px = mq * mq * mq * 30 + 3 * mq * mq * q * c1x + 3 * mq * q * q * c2x + q * q * q * tx;
      const py = mq * mq * mq * 6 + 3 * mq * mq * q * c1y + 3 * mq * q * q * c2y + q * q * q * ty;
      const dx = 3 * mq * mq * (c1x - 30) + 6 * mq * q * (c2x - c1x) + 3 * q * q * (tx - c2x);
      const dy = 3 * mq * mq * (c1y - 6) + 6 * mq * q * (c2y - c1y) + 3 * q * q * (ty - c2y);
      const L = Math.hypot(dx, dy) || 1, w = lerp(30, 11, q);
      wl.push([px - (dy / L) * w, py + (dx / L) * w]); wr.push([px + (dy / L) * w, py - (dx / L) * w]);
    }
    D.poly(c, wl.concat(wr.reverse()), true); D.fs(c, fill, P.line, lw);
    for (let i = 4; i < N; i += 3) { const a = wl[i], bb = wr[N - i]; c.beginPath(); c.moveTo(lerp(a[0], bb[0], 0.25), lerp(a[1], bb[1], 0.25)); c.lineTo(lerp(a[0], bb[0], 0.6), lerp(a[1], bb[1], 0.6)); D.st(c, P.line, lw * 0.55); }
    D.ell(c, 0, 0, hr, hr * 0.92); D.fs(c, fill, P.line, lw);
    // ear (flap on the near side, behind the eye)
    const ef = 1 + (o.ear || 0) * 0.12;
    c.beginPath(); c.moveTo(-6, -hr * 0.62);
    c.bezierCurveTo(-hr * 1.25 * ef, -hr * 0.95, -hr * 1.35 * ef, hr * 0.55, -hr * 0.55, hr * 0.78);
    c.bezierCurveTo(-hr * 0.15, hr * 0.62, 4, hr * 0.2, -6, -hr * 0.62); c.closePath(); D.fs(c, ear, P.line, lw);
    // eye
    const ex = hr * 0.42, ey = -hr * 0.18, eye = o.eye || "open";
    if (eye === "closed") { c.beginPath(); c.arc(ex, ey - 2, 7, 0.15 * Math.PI, 0.85 * Math.PI); D.st(c, P.line, lw * 0.9); }
    else if (eye === "sad") { D.ell(c, ex, ey, 4.4, 4.4); D.fs(c, "#1a1414", null); c.beginPath(); c.moveTo(ex - 10, ey - 13); c.lineTo(ex + 7, ey - 9); D.st(c, P.line, lw * 0.8); }
    else { const r = eye === "wide" ? 6 : 4.6; D.ell(c, ex, ey, r, r); D.fs(c, "#1a1414", P.line, lw * 0.6); }
    // cheek line + mouth
    c.beginPath(); c.moveTo(hr * 0.55, hr * 0.42); c.quadraticCurveTo(hr * 0.42, hr * 0.62, hr * 0.25, hr * 0.6); D.st(c, P.line, lw * 0.7);
    c.restore();
    c.restore();
    // world positions of the ankle (rope tie) and the head, for other code
    const ank = { x: o.x + f * s * (lerp(58, 50, b)), y: o.y - s * 12 };
    const back = { x: o.x + f * s * -96, y: o.y - s * 12 };
    return { ankle: ank, back, head: { x: o.x + f * s * hx, y: o.y + s * hy }, hr: hr * s };
  };

  // the trainer: maroon long coat, plain tan head, grey wide-brim hat (front or profile)
  D.trainer = (c, o) => {
    const s = o.s || 1, f = o.f || 1, lw = 2.6 / s, view = o.view || "front";
    c.save(); c.translate(o.x, o.y); c.scale(s * f, s);
    if (o.halo) D.radial(c, 0, -330, 190, "200,200,205", 0.13 * o.halo);
    if (view === "front") {
      // boots
      for (const x of [-30, 12]) { D.rr(c, x, -16, 26, 18, 5); D.fs(c, P.shoe, P.line, lw); }
      // coat (trapezoid, slightly flared)
      c.beginPath(); c.moveTo(-58, -250); c.lineTo(58, -250); c.lineTo(86, -14); c.lineTo(-86, -14); c.closePath(); D.fs(c, o.coat || P.robe, P.line, lw);
      c.beginPath(); c.moveTo(0, -246); c.lineTo(0, -16); D.st(c, P.line, lw * 0.7);
      for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-2, -220 + k * 34); c.lineTo(2, -212 + k * 34); D.st(c, P.cuff, lw); }
      // arms
      const ar = o.arm || 0;
      for (const sx of [-1, 1]) {
        c.save(); c.translate(sx * 62, -238); c.rotate(sx * (0.12 + (sx > 0 ? ar : 0)));
        D.rr(c, -15, 0, 30, 150, 14); D.fs(c, o.coat || P.robe, P.line, lw);
        D.ell(c, 0, 158, 14, 16); D.fs(c, P.skin, P.line, lw);
        c.restore();
      }
      // collar + head + hat
      D.ell(c, 0, -252, 44, 13); D.fs(c, P.cuff, P.line, lw);
      D.ell(c, 0, -300, 38, 40); D.fs(c, o.skin || P.skin, P.line, lw);
      D.ell(c, 0, -330, 76, 15); D.fs(c, o.hat || P.hat, P.line, lw);
      c.beginPath(); c.moveTo(-38, -330); c.bezierCurveTo(-40, -392, 40, -392, 38, -330); c.closePath(); D.fs(c, o.hat || P.hat, P.line, lw);
      c.beginPath(); c.moveTo(-38, -342); c.lineTo(38, -342); D.st(c, P.robeDk, 5 / s);
    } else { // profile, facing right
      const st = o.step || 0;
      for (const [x, k] of [[-18, 1], [6, -1]]) { D.rr(c, x + k * st * 10, -16, 34, 18, 6); D.fs(c, P.shoe, P.line, lw); }
      c.beginPath(); c.moveTo(-34, -250); c.lineTo(30, -250); c.lineTo(46, -14); c.lineTo(-52, -14); c.closePath(); D.fs(c, o.coat || P.robe, P.line, lw);
      c.save(); c.translate(-2, -236); c.rotate(-0.05 - (o.arm || 0));
      D.rr(c, -14, 0, 28, 146, 13); D.fs(c, o.coat || P.robe, P.line, lw); D.ell(c, 0, 154, 13, 15); D.fs(c, o.skin || P.skin, P.line, lw); c.restore();
      D.ell(c, -2, -252, 32, 10); D.fs(c, o.skin ? o.coat : P.cuff, P.line, lw);
      D.ell(c, 2, -298, 36, 39); D.fs(c, o.skin || P.skin, P.line, lw);
      D.ell(c, 4, -328, 72, 13); D.fs(c, o.hat || P.hat, P.line, lw);
      c.beginPath(); c.moveTo(-32, -328); c.bezierCurveTo(-34, -386, 40, -386, 38, -328); c.closePath(); D.fs(c, o.hat || P.hat, P.line, lw);
      if (o.smile) { c.beginPath(); c.arc(22, -290, 10, 0.1 * Math.PI, 0.6 * Math.PI); D.st(c, "#5a3a2e", lw); }
    }
    c.restore();
  };

  // a white line-art person (camp worker / traveller / modern figure): round head, two dot eyes, capsule body
  D.person = (c, o) => {
    const s = o.s || 1, lw = (o.lw || 2.6) / s, col = o.col || P.line, fill = o.fill || null;
    c.save(); c.translate(o.x, o.y); c.scale(s * (o.f || 1), s);
    const pose = o.pose || "stand";
    if (pose === "bust") { // head + shoulders (crowd rows)
      c.beginPath(); c.moveTo(-58, 0); c.bezierCurveTo(-58, -70, 58, -70, 58, 0); D.fs(c, fill || P.bg, col, lw);
      D.ell(c, 0, -96, 38, 38); D.fs(c, fill || P.bg, col, lw);
      for (const ex of [-11, 11]) { D.ell(c, ex, -98 + (o.look || 0), 2.8, 2.8); D.fs(c, col, null); }
      if (o.wrap) { c.beginPath(); c.moveTo(-36, -112); c.quadraticCurveTo(0, -150, 36, -112); D.st(c, col, lw); }
      c.restore(); return;
    }
    const sl = o.slump || 0;
    // legs
    if (pose === "kneel") {
      c.beginPath(); c.moveTo(-6, -100); c.lineTo(-30, -48); c.lineTo(-70, -40); c.moveTo(4, -100); c.lineTo(30, -40); c.lineTo(34, 0); D.st(c, col, lw * 1.6);
    } else if (pose === "sit") {
      c.beginPath(); c.moveTo(-6, -110); c.lineTo(40, -110); c.lineTo(40, -50); c.moveTo(4, -112); c.lineTo(52, -112); c.lineTo(52, -50); D.st(c, col, lw * 1.6);
    } else {
      const w = o.walk || 0;
      c.beginPath(); c.moveTo(-8, -120); c.lineTo(-10 - w * 14, 0); c.moveTo(8, -120); c.lineTo(10 + w * 14, 0); D.st(c, col, lw * 1.6);
    }
    // body (capsule), bends forward with slump
    c.save(); c.translate(0, pose === "sit" ? -110 : -118); c.rotate(sl * 0.45);
    D.rr(c, -26, -150, 52, 158, 26); D.fs(c, fill || P.bg, col, lw);
    if (o.pack) { D.rr(c, -50, -140, 28, 80, 10); D.fs(c, P.bg, col, lw); }
    // arm
    c.save(); c.translate(6, -128); c.rotate(o.arm != null ? o.arm : 0.12);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 108); D.st(c, col, lw * 1.6); D.ell(c, 0, 112, 7, 7); D.fs(c, fill || P.bg, col, lw);
    c.restore();
    // head
    D.ell(c, 4 + sl * 12, -186, 34, 34); D.fs(c, fill || P.bg, col, lw);
    D.ell(c, 18 + sl * 12, -190 + sl * 6, 2.8, 2.8); D.fs(c, col, null);
    c.restore();
    if (o.stick) { c.beginPath(); c.moveTo(46, -200); c.lineTo(58, 0); D.st(c, col, lw * 1.3); }
    c.restore();
  };

  // wooden stake (with a gold rope coil); x, y = where it enters the ground; h height above ground; tilt rad
  D.stake = (c, x, y, h, o = {}) => {
    c.save(); c.translate(x, y); c.rotate(o.tilt || 0);
    const w = o.w || h * 0.16;
    c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h); c.lineTo(-w * 0.35, -h - w * 0.3); c.lineTo(w * 0.35, -h - w * 0.3); c.lineTo(w / 2, -h); c.lineTo(w / 2, 0);
    if (o.below) { c.lineTo(w / 2, o.below * 0.8); c.lineTo(0, o.below); c.lineTo(-w / 2, o.below * 0.8); }
    c.closePath(); D.fs(c, P.wood, P.line, o.lw || 2.6);
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-w * 0.2, -h * k / 4); c.lineTo(w * 0.1, -h * k / 4 - w * 0.25); D.st(c, "#4a3222", (o.lw || 2.6) * 0.8); }
    c.restore();
  };
  // the gold rope: a glowing curve from a to b, sag (px) for slack, taut 0..1 straightens it
  D.rope = (c, ax, ay, bx, by, o = {}) => {
    const sag = (o.sag == null ? 40 : o.sag) * (1 - (o.taut || 0));
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + sag;
    c.save();
    D.glow(c, "rgba(242,182,48,0.8)", o.blur == null ? 16 : o.blur);
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by);
    c.strokeStyle = P.gold; c.lineWidth = o.w || 5; c.lineCap = "round"; c.stroke();
    D.noglow(c);
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by); c.strokeStyle = P.goldHi; c.lineWidth = (o.w || 5) * 0.35; c.stroke();
    c.restore();
  };
  // hand from above (the source's scale cut): sleeve + cuff + fist, pointing down; x, y = knuckles
  D.handDown = (c, x, y, s = 1, o = {}) => {
    const lw = 2.6 / s;
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(o.rot || 0);
    D.rr(c, -62, -560, 124, 420, 10); D.fs(c, o.sleeve || P.robe, P.line, lw);
    D.rr(c, -70, -170, 140, 70, 14); D.fs(c, P.cuff, P.line, lw);
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-40 + k * 26, -142); c.lineTo(-36 + k * 26, -132); D.st(c, "#a99c88", lw); }
    c.beginPath(); c.moveTo(-50, -100); c.lineTo(50, -100); c.bezierCurveTo(70, -40, 60, 30, 20, 40); c.lineTo(-40, 40); c.bezierCurveTo(-70, 10, -66, -60, -50, -100); c.closePath();
    D.fs(c, P.skin, P.line, lw);
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-36 + k * 22, 0); c.quadraticCurveTo(-26 + k * 22, 26, -14 + k * 22, 4); D.st(c, P.skinDk, lw); }
    c.beginPath(); c.moveTo(48, -40); c.quadraticCurveTo(80, -10, 50, 14); D.st(c, P.skinDk, lw);
    c.restore();
  };
  // a cupped hand from below holding something glowing (the closing beat)
  D.handUp = (c, x, y, s = 1, o = {}) => {
    const lw = 2.6 / s;
    c.save(); c.translate(x, y); c.scale(s, s);
    D.rr(c, -78, 40, 156, 420, 8); D.fs(c, o.sleeve || P.suit, P.line, lw);
    c.beginPath(); c.moveTo(-70, 60); c.lineTo(70, 60); D.st(c, P.line, lw * 0.7);
    c.beginPath(); c.moveTo(-74, 46); c.bezierCurveTo(-96, -60, -80, -170, -40, -190); c.lineTo(50, -196); c.bezierCurveTo(86, -150, 92, -40, 74, 46); c.closePath(); D.fs(c, P.skin, P.line, lw);
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-36 + k * 30, -186); c.lineTo(-30 + k * 28, -100); D.st(c, P.skinDk, lw * 0.8); }
    c.beginPath(); c.moveTo(-80, -40); c.bezierCurveTo(-170, -70, -180, -20, -130, -6); c.bezierCurveTo(-110, 4, -90, 0, -74, 10); D.fs(c, P.skin, P.line, lw);
    c.restore();
  };
  // a line-art dog (the 1967 experiment), lying ("lie") or standing ("stand")
  D.dog = (c, o) => {
    const s = o.s || 1, lw = 2.6 / s, col = o.col || P.line;
    c.save(); c.translate(o.x, o.y); c.scale(s * (o.f || 1), s);
    if (o.pose === "lie") {
      D.ell(c, 0, -30, 90, 30); D.fs(c, P.bg, col, lw);
      c.beginPath(); c.moveTo(80, -8); c.lineTo(150, -6); c.moveTo(70, -2); c.lineTo(140, 2); D.st(c, col, lw);
      D.ell(c, 120, -30, 30, 24); D.fs(c, P.bg, col, lw);
      c.beginPath(); c.moveTo(106, -48); c.quadraticCurveTo(96, -20, 104, -10); D.st(c, col, lw);
      c.beginPath(); c.arc(132, -34, 6, 0.1 * Math.PI, 0.9 * Math.PI); D.st(c, col, lw * 0.8);
      c.beginPath(); c.moveTo(-88, -36); c.quadraticCurveTo(-120, -30, -130, -6); D.st(c, col, lw);
    } else {
      D.ell(c, 0, -80, 80, 32); D.fs(c, P.bg, col, lw);
      for (const x of [-56, -36, 40, 60]) { c.beginPath(); c.moveTo(x, -60); c.lineTo(x + (o.jump ? -10 : 0), 0); D.st(c, col, lw); }
      D.ell(c, 98, -118, 30, 26); D.fs(c, P.bg, col, lw);
      c.beginPath(); c.moveTo(84, -136); c.quadraticCurveTo(72, -110, 80, -96); D.st(c, col, lw);
      D.ell(c, 108, -122, 3, 3); D.fs(c, col, null);
      c.beginPath(); c.moveTo(-78, -90); c.quadraticCurveTo(-110, -120, -118, -140); D.st(c, col, lw);
    }
    c.restore();
  };

  window.DP = { create, D, P, E, ramp, clamp, lerp, rng };
})();
