/* film.js — template: the format in three shots (threat-count hook, the rule title, the two-button vote).
   Copy the sets you need from assets/sample/assets/lib/film.js (the mountain section, the chamber, the interior
   cutaway, the route map …). Shot: { id, t0, cam(u, lt, t) -> {z, cx, cy}, draw(lt, u, t), post(lt, u, t) }.
   window.SV_FILM(K, V) -> { draw(t), T, shots }. */
window.SV_FILM = function (K, V) {
  const { ctx, W, H, clamp, lerp, sstep, eio, eout, back, rng } = K;
  const INK = K.INK, C = K.COL;
  const L = (id) => V.L(id);
  const w = (id, word, k) => V.w(id, word, k);
  const END = V.duration;
  const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : back(clamp((t - t0) / d, 0, 1), 2.2));
  const on = (t, t0, d = 0.2) => sstep(t0, t0 + d, t);
  const T = { title: L("t2").start - 0.25, vote: L("t3").start - 0.15 };
  window.SV_TIMES = Object.assign({}, T, { dur: END });
  // ------------------------------------------------------------------ helpers
  function horde(n, seed, x0, x1, y0, y1, s0 = 0.82, s1 = 1.0) {
    const r = rng(seed), out = [];
    for (let i = 0; i < n; i++) { const y = lerp(y0, y1, r()); out.push({ x: lerp(x0, x1, r()), y, s: lerp(s0, s1, (y - y0) / Math.max(1, y1 - y0)), seed: seed * 100 + i, ph: r() * 6.28, sp: 0.85 + r() * 0.3 }); }
    return out;
  }
  function drawHorde(list, t, o = {}) {
    list.slice().sort((a, b) => a.y - b.y).forEach((d) => {
      const x = d.x + (o.vx || 0) * d.sp * (o.mt == null ? t : o.mt);
      K.dead({ x, y: d.y, s: d.s * (o.s || 1), seed: d.seed, dir: o.dir == null ? 1 : o.dir, walk: o.still ? null : t * (o.rate || 6.5) * d.sp + d.ph, t: t + d.ph, dark: o.dark || 0, arms: o.arms, lean: o.lean });
    });
  }
  function sky(kind, y0 = -2000, y1 = 1150) {
    if (kind === "sunset") K.sunsetSky(y0, y1);
    else if (kind === "night") { ctx.fillStyle = K.vgrad(y0, y1, [[0, "#0d1428"], [0.7, "#1b2744"], [1, "#2c3a5c"]]); ctx.fillRect(-4000, y0 - 2000, W + 8000, y1 - y0 + 2000); }
    else if (kind === "day") { ctx.fillStyle = K.vgrad(y0, y1, [[0, "#6fa8d8"], [1, "#cfe4ef"]]); ctx.fillRect(-4000, y0 - 2000, W + 8000, y1 - y0 + 2000); }
  }
  function stars(seed, n, area, a = 1) { const r = rng(seed); ctx.save(); ctx.fillStyle = "#e8eeff"; for (let i = 0; i < n; i++) { ctx.globalAlpha = a * (0.4 + 0.6 * r()); const s = 1.5 + r() * 2.5; ctx.fillRect(lerp(area[0], area[2], r()), lerp(area[1], area[3], r()), s, s); } ctx.restore(); }
  function hills(yb, seed, col, amp, x0 = -1500, x1 = 2600) {
    const r = rng(seed); const pts = [[x0, yb + 600], [x0, yb]]; let x = x0;
    while (x < x1) { x += 140 + r() * 200; pts.push([x, yb - r() * amp]); }
    pts.push([x1, yb + 600]);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; ctx.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2); }
    ctx.lineTo(x1, yb + 600); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function headframe(x, yg, s = 1, col = "#5a3c4c", lit = 0) {
    ctx.save(); ctx.translate(x, yg); ctx.scale(s, s);
    ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-80, 0); ctx.lineTo(-30, -520); ctx.moveTo(80, 0); ctx.lineTo(30, -520); ctx.moveTo(-30, -500); ctx.lineTo(180, 0); ctx.stroke();
    ctx.lineWidth = 6; for (let k = 0; k < 6; k++) { const y = -60 - k * 80, hw = lerp(80, 30, (k * 80 + 60) / 520); ctx.beginPath(); ctx.moveTo(-hw, y); ctx.lineTo(hw, y - 70); ctx.moveTo(hw, y); ctx.lineTo(-hw, y - 70); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -540, 58, 0, 6.283); ctx.lineWidth = 9; ctx.stroke();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3; ctx.beginPath(); ctx.moveTo(0, -540); ctx.lineTo(Math.cos(a) * 58, -540 + Math.sin(a) * 58); ctx.lineWidth = 4; ctx.stroke(); }
    ctx.fillStyle = col; ctx.fillRect(-120, -110, 90, 110); ctx.fillRect(-150, -120, 150, 14);
    if (lit) { ctx.fillStyle = "#ffcf7a"; ctx.fillRect(-100, -80, 22, 22); K.glow(-89, -69, 60, "rgba(255,190,110,0.5)", lit); }
    ctx.restore();
  }
  function fanHouse(x, yg, s = 1, t = 0, spin = 1, lit = 0) {
    ctx.save(); ctx.translate(x, yg); ctx.scale(s, s);
    // brick house
    ctx.beginPath(); ctx.rect(-170, -260, 260, 260); K.fs("#9a5a44", INK, 5);
    ctx.save(); ctx.beginPath(); ctx.rect(-170, -260, 260, 260); ctx.clip(); ctx.strokeStyle = "rgba(43,36,32,0.35)"; ctx.lineWidth = 2;
    for (let y = -250; y < 0; y += 22) { ctx.beginPath(); ctx.moveTo(-170, y); ctx.lineTo(90, y); ctx.stroke(); for (let x = -170 + ((y / 22) % 2 ? 0 : 20); x < 90; x += 40) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); } }
    ctx.restore();
    K.poly([[-190, -260], [-40, -340], [110, -260]], "#6a3c30", INK, 5);
    ctx.fillStyle = lit ? "#ffcf7a" : "#3a2c30"; ctx.fillRect(-130, -200, 50, 60); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-130, -200, 50, 60);
    if (lit) K.glow(-105, -170, 80, "rgba(255,190,110,0.45)", lit);
    // fan housing (big round) on the right
    K.circle(170, -150, 120, "#8a9098", INK, 6); K.circle(170, -150, 98, "#3a3f46", INK, 4);
    for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(170, -150); ctx.rotate(t * 9 * spin + k * 1.2566); ctx.beginPath(); ctx.ellipse(0, -46, 18, 44, 0.35, 0, 6.283); K.fs("#b9c0c8", INK, 3.5); ctx.restore(); }
    K.circle(170, -150, 16, "#5a6068", INK, 3);
    // duct down into the ground
    ctx.beginPath(); ctx.rect(130, -30, 80, 34); K.fs("#7a8088", INK, 4);
    ctx.restore();
  }
  function ground(y, x0 = -2000, x1 = 3000, col = "#a07a55", col2 = "#8a6646") {
    ctx.fillStyle = col; ctx.fillRect(x0, y - 8, x1 - x0, 60); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, y - 8); ctx.lineTo(x1, y - 8); ctx.stroke();
    ctx.fillStyle = col2; ctx.fillRect(x0, y + 50, x1 - x0, 30);
  }
  // the world below the yard: strata from y to y+h
  function under(y, h = 900, seed = 4, x0 = -2000, x1 = 3000, dark = 0, lt = 0) {
    const cols = dark ? ["#6e5038", "#5c422f", "#4c3628", "#3e2c21", "#322319"] : ["#a77a52", "#94694a", "#83603f", "#6f4f36", "#5c412e"];
    K.strata(x0, y, x1, y + h, { seed, cols, floor: true });
    // roots under the surface
    const r = rng(seed + 7);
    ctx.save(); ctx.strokeStyle = "rgba(60,40,28,0.55)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < 26; i++) { let x = lerp(x0, x1, r()), yy = y + 4; ctx.beginPath(); ctx.moveTo(x, yy); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 30; yy += 10 + r() * 18; ctx.lineTo(x, yy); } ctx.stroke(); }
    ctx.restore();
    // the old level: a timbered gallery with rails, a lamp line and a cart — the mine under everything
    const gy = y + 190, gh = 150;
    ctx.fillStyle = dark ? "#16100c" : "#2a1f18"; ctx.fillRect(x0, gy, x1 - x0, gh); K.line([[x0, gy], [x1, gy]], INK, 5); K.line([[x0, gy + gh], [x1, gy + gh]], INK, 5);
    for (let x = x0 + 80; x < x1; x += 260) { ctx.fillStyle = dark ? "#3c281a" : "#6a4428"; ctx.fillRect(x - 10, gy, 20, gh); ctx.fillRect(x - 70, gy, 140, 18); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x - 10, gy, 20, gh); ctx.strokeRect(x - 70, gy, 140, 18); }
    K.rails(x0, x1, gy + gh - 4, "#55585c", 0.7);
    for (let x = x0 + 210; x < x1; x += 520) { K.line([[x, gy + 18], [x, gy + 34]], INK, 3); K.circle(x, gy + 40, 7, dark ? "#6b6253" : "#ffd27a", INK, 2.5); if (!dark) K.glow(x, gy + 40, 70, "rgba(255,200,120,0.35)"); }
    const cx = x0 + ((seed * 337) % Math.max(1, x1 - x0 - 400)) + 200; K.rr(cx, gy + gh - 64, 110, 50, 6); K.fs("#7a6a5a", INK, 4); K.circle(cx + 24, gy + gh - 10, 11, "#3a3d44", INK, 3); K.circle(cx + 86, gy + gh - 10, 11, "#3a3d44", INK, 3);
    // a water pocket and a few crystals deeper down
    const wx = x0 + (x1 - x0) * 0.47; K.ell(wx, y + 520, 120, 34, "#3d6f9a", INK, 4); K.line([[wx - 60, y + 512], [wx + 10, y + 512]], "rgba(255,255,255,0.5)", 3);
    for (let i = 0; i < 8; i++) { const cx2 = lerp(x0, x1, r()), cy2 = y + 420 + r() * 300; K.poly([[cx2, cy2 - 22], [cx2 + 9, cy2], [cx2, cy2 + 6], [cx2 - 9, cy2]], dark ? "#4a5a6a" : "#8fb8c8", INK, 2.5); }
  }

  // ---- the yard (S1, S2): sunset, hills, headframe, fan house, the mine below
  function yard(lt, o = {}) {
    sky("sunset", -1200, 1100);
    K.sun(o.sunX || 760, 930, 70);
    K.cloud(240, 330, 1.35, "#7a5482"); K.cloud(900, 200, 1.1, "#80588a"); K.cloud(1500, 420, 1.3, "#7a5482"); K.cloud(-300, 520, 1.2, "#86607e");
    K.birds(lt, [[380, 520, 1.2], [430, 545, 0.9], [980, 420, 1]]);
    hills(1010, 3, "#7b5670", 120); hills(1060, 8, "#8e5f68", 80);
    headframe(o.hfX == null ? 120 : o.hfX, 1100, 1.05, "#5a3a4a", 1);
    fanHouse(o.fhX == null ? 1500 : o.fhX, 1100, 0.9, lt, 1, 1);
    // yard surface (slight perspective band) + fence + ore cart
    ctx.fillStyle = K.vgrad(1080, 1170, [[0, "#b98d62"], [1, "#a77d55"]]); ctx.fillRect(-2000, 1086, 5000, 86);
    K.line([[-2000, 1088], [3000, 1088]], INK, 4);
    for (let x = -1900; x < 3000; x += 120) K.line([[x, 1088], [x, 1050]], "#6a4a3a", 5);
    K.line([[-1900, 1060], [3000, 1060]], "#6a4a3a", 4);
    K.rails(-2000, 3000, 1170, "#6c6f74", 1);
    ground(1176, -2000, 3000, "#8d6a4c", "#7a5a40");
    under(1250, 900, 12, -2000, 3000, 0, lt);
  }
  // ---- the horizontal tunnel cross-section (S3, S4, S5, S8); entrance at world x = ex (daylight to the left)
  function tunnel(lt, o) {
    const ex = o.ex == null ? -2000 : o.ex, dayEnd = o.dayEnd == null ? ex + 1000 : o.dayEnd;
    K.strata(-2600, -400, 3600, 770, { seed: 31, cols: ["#94694a", "#86603f", "#7a573a", "#6f4f36"] });
    under(1200, 1100, 32, -2600, 3600, 1, lt);
    // tunnel space
    ctx.fillStyle = "#3b2c22"; ctx.fillRect(-2600, 770, 6200, 430);
    ctx.save(); ctx.beginPath(); ctx.rect(-2600, 770, 6200, 430); ctx.clip();
    K.strata(-2600, 770, 3600, 1200, { seed: 33, cols: ["#4a372a", "#42311f"], dens: 0.7 });
    if (o.entrance) { // daylight opening at the left end
      ctx.fillStyle = K.vgrad(770, 1200, [[0, "#f4b27c"], [1, "#e8935e"]]); ctx.fillRect(ex - 600, 770, 600, 430);
      K.sun(ex - 260, 930, 40); hills(1120, 5, "#8e5f68", 40, ex - 600, ex);
      ctx.fillStyle = "#a77d55"; ctx.fillRect(ex - 600, 1150, 600, 50);
    }
    for (let x = Math.ceil((-2600 - ex) / 330) * 330 + ex; x < 3600; x += 330) if (x > ex + 60) K.timberSet(x, 1176, 250, 360, 1, 1);
    K.rails(ex, 3600, 1186, "#62656a", 1);
    if (o.pipe) { K.line([[ex, 900], [3600, 900]], "#7a7f86", 12); K.line([[ex, 900], [3600, 900]], INK, 2); for (let x = ex + 100; x < 3600; x += 400) K.rr(x, 890, 18, 20, 3), K.fs("#5a5f66", INK, 2); }
    ctx.restore();
    // floor/roof edge lines
    K.line([[-2600, 770], [3600, 770]], INK, 5); K.line([[-2600, 1198], [3600, 1198]], INK, 5);
    o._dark = (x) => sstep(dayEnd - 380, dayEnd + 260, x);
  }
  // darkness over the tunnel interior from dayEnd to the right (drawn after the characters)
  function tunnelDark(o, a = 0.88, x1 = 3600) {
    const dayEnd = o.dayEnd;
    ctx.save(); ctx.beginPath(); ctx.rect(-2600, 772, 6200, 425); ctx.clip();
    const g = ctx.createLinearGradient(dayEnd - 380, 0, dayEnd + 260, 0); g.addColorStop(0, "rgba(6,4,3,0)"); g.addColorStop(1, `rgba(6,4,3,${a})`);
    ctx.fillStyle = g; ctx.fillRect(dayEnd - 380, 770, 640, 430); ctx.fillStyle = `rgba(6,4,3,${a})`; ctx.fillRect(dayEnd + 259, 770, x1 - dayEnd, 430);
    ctx.restore();
  }

  function shaftUp(lt, o = {}) {
    K.strata(-400, -400, 1500, 2400, { seed: 101, cols: ["#4a3526", "#3f2d20", "#36261c", "#2e2018"], dens: 1.0 });
    // the shaft walls converge to a circle of sky at the top
    const cx = 540, cy = o.cy || 640, R = o.R || 300;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
    if (o.kind === "night") { ctx.fillStyle = "#1b2744"; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); stars(31, 40, [cx - R, cy - R, cx + R, cy + R]); K.circle(cx + 90, cy - 80, 40, "#efe9d2", null); K.glow(cx + 90, cy - 80, 160, "rgba(200,210,255,0.3)"); }
    else { ctx.fillStyle = K.vgrad(cy - R, cy + R, [[0, "#ffe9c2"], [1, "#f2b67c"]]); ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); K.glow(cx, cy, R * 1.2, "rgba(255,240,210,0.8)"); }
    ctx.restore();
    // ladder rungs converging
    for (let k = 0; k < 14; k++) { const u = k / 14, y = lerp(1900, cy + R * 0.9, Math.pow(u, 0.7)), hw = lerp(260, 50, Math.pow(u, 0.7)); K.line([[cx - hw, y], [cx + hw, y]], "#8a7a6a", lerp(12, 3, u)); }
    K.line([[cx - 260, 1900], [cx - 50, cy + R * 0.9]], "#8a7a6a", 10); K.line([[cx + 260, 1900], [cx + 50, cy + R * 0.9]], "#8a7a6a", 10);
    K.circle(cx, cy, R, null, INK, 10);
    // heads around the rim, looking down
    const n = o.heads || 0;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * (2 * Math.PI / Math.max(n, 12)) * 0.95; const hx = cx + Math.cos(a) * R * 0.86, hy = cy + Math.sin(a) * R * 0.86;
      const hr = o.hr || 58; K.circle(hx, hy, hr, o.kind === "night" ? "#4a5246" : "#a9b496", INK, 5); const ex = Math.cos(a) * -hr * 0.25, ey = Math.sin(a) * -hr * 0.25;
      K.circle(hx + ex - hr * 0.3, hy + ey, hr * 0.22, "#eef0ea", INK, 3); K.circle(hx + ex + hr * 0.3, hy + ey, hr * 0.22, "#eef0ea", INK, 3); K.glow(hx + ex, hy + ey, 30, "rgba(230,240,230,0.35)", o.kind === "night" ? 1 : 0); }
    return { cx, cy, R };
  }

  const shots = [];
  const add = (s) => { s.fadeIn = s.fadeIn || 0; shots.push(s); };
  const CAM = (z, cx, cy) => ({ z, cx, cy });
  const camL = (a, b, u, e = eio) => ({ z: lerp(a.z, b.z, e(u)), cx: lerp(a.cx, b.cx, e(u)), cy: lerp(a.cy, b.cy, e(u)) });
  const H1 = horde(24, 1, -700, 250, 1150, 1185, 0.92, 1.06);
  add({ id: "yard", t0: 0, cam: (u) => camL(CAM(1.08, 520, 1000), CAM(1.12, 640, 1000), u, (x) => x), draw(lt) {
    yard(lt, { hfX: 80, fhX: 1650 });
    drawHorde(H1, lt, { vx: 105, rate: 8 });
    K.hero({ x: 640 + lt * 150, y: 1172, s: 1.08, dir: 1, walk: lt * 11, run: true, expr: "worried", t: lt });
  }, post(lt, u, t) { K.tagRed("40 DEAD", 540, 430, { a: 1 - sstep(1.75, 2.1, t), rot: -0.035 }); } });
  const tun = { ex: -900, dayEnd: 420, entrance: false, pipe: true };
  const H4 = horde(9, 4, 80, 560, 1172, 1188, 0.9, 1.0);
  add({ id: "title", t0: T.title, cam: (u) => camL(CAM(1.25, 430, 1000), CAM(1.32, 440, 1010), u), draw(lt, u, t) {
    tunnel(lt, tun); drawHorde(H4, 1.2, { vx: 70, still: true, arms: [[1.9, 2.1], [1.1, 1.0]], dark: 0.45 }); tunnelDark(tun, 0.86);
  }, post(lt, u, t) {
    K.title2("THE DEAD", "CAN'T SEE IN THE DARK", 540, 470, { a: on(t, L("t2").start - 0.05, 0.08), s: 0.86 + 0.14 * pop(t, L("t2").start - 0.05), k2: on(t, w("t2", "can't") - 0.05, 0.1), px1: 96, px2: 78 });
  } });
  add({ id: "vote", t0: T.vote, cam: () => CAM(1.0, 540, 960), draw(lt) {
    ctx.save(); ctx.filter = "blur(6px)"; shaftUp(lt, { kind: "night", heads: 11, R: 330, cy: 760 }); ctx.restore();
    ctx.fillStyle = "rgba(8,8,12,0.5)"; ctx.fillRect(-100, -100, 1300, 2200);
  }, post(lt, u, t) {
    K.vote({ q: "HOW DO YOU GET AIR?", medal: true, mk: lerp(0.6, 1, pop(t, T.vote + 0.1)), a: on(t, T.vote + 0.02, 0.15),
      k1: clamp((t - (w("t3", "call") - 0.08)) / 0.35, 0, 1), k2: clamp((t - (w("t3", "alone") - 0.08)) / 0.35, 0, 1), kf: clamp((t - (w("t3", "Comment") - 0.08)) / 0.3, 0, 1),
      b1: { t: "CALL", sub: "THEY'LL KNOW YOU'RE HERE", icon: "radio" }, b2: { t: "ALONE", sub: "600 M THROUGH THE DEAD", icon: "pick" },
      foot: "COMMENT “CALL” OR “ALONE”", pulse: t > L("t3").end + 0.2 ? t - L("t3").end : 0 });
  } });
  for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : END + 1;
  window.SV_SHOTS = shots.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), t1: +Math.min(s.t1, END).toFixed(3) }));

  function draw(t) {
    let i = 0; while (i + 1 < shots.length && t >= shots[i + 1].t0) i++;
    const s = shots[i], lt = t - s.t0, dur = Math.max(0.01, s.t1 - s.t0), u = clamp(lt / dur, 0, 1);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const c = s.cam(u, lt, t);
    ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
    s.draw(lt, u, t);
    ctx.restore();
    ctx.save(); if (s.post) s.post(lt, u, t); ctx.restore();
    K.vignette(0.32, 0.5);
    K.grain(0.07);
    if (s.fadeIn > 0) K.fade(1 - clamp(lt / s.fadeIn, 0, 1));
  }
  return { draw, T, shots };
};

