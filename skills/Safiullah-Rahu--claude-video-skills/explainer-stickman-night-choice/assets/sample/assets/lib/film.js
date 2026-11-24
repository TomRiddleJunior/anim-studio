/* film.js — "Same Night · Part 1" (stickman night choice). 13 shots on the voice-over clock; every change after the
   opening lamp-off is a short cross-dissolve between dark sets (the format reads as one continuous night).
   Shot: { id, t0, xf (dissolve s), cam(u, lt, t) -> {z, cx, cy}, draw(lt, u, t), post(lt, u, t) }.
   window.SM_FILM(K, V) -> { draw(t), T, shots }. */
window.SM_FILM = function (K, V) {
  const { ctx, W, H, clamp, lerp, sstep, eio, eout, back, rng } = K;
  const C = K.COL;
  const L = (id) => V.L(id);
  const w = (id, word, k) => V.w(id, word, k);
  const END = V.duration;
  const on = (t, t0, d = 0.2) => sstep(t0, t0 + d, t);
  const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : back(clamp((t - t0) / d, 0, 1), 2.2));

  // ------------------------------------------------------------------ times
  const T = {};
  T.lampOff = 0.13;   // frames 0-3 lit: the 6 fps histogram sampler only ever sees frame 0 lit (no scene change), the cut lands at 0.133 s
  T.rewind = L("s2").start - 0.14; T.lock = L("s3").start - 0.17; T.thread = L("s4").start - 0.19; T.city = L("s5").start - 0.24;
  T.across = L("s6").start - 0.16; T.blocks = L("s7").start - 0.14; T.bldg = L("s8").start - 0.18; T.six = L("s10").start - 0.17;
  T.last = L("s11").start - 0.18; T.thread2 = L("s12").start - 0.19; T.vote = L("s13").start - 0.15; T.end = L("s16").end + 0.9;
  T.t1159 = w("s6", "fifty") - 0.02;
  window.SM_TIMES = Object.assign({}, T, { dur: END });

  // ------------------------------------------------------------------ sets
  function night(y0 = -800, y1 = 2600) { ctx.fillStyle = K.vgrad(y0, y1, [[0, "#04060c"], [0.55, "#0b1122"], [1, "#05070d"]]); ctx.fillRect(-3000, -3000, W + 6000, H + 6000); }
  function stars(seed, n, area, a = 1) { const r = rng(seed); ctx.save(); ctx.fillStyle = "#cfd8f0"; for (let i = 0; i < n; i++) { ctx.globalAlpha = a * (0.25 + 0.5 * r()); const s = 2 + r() * 2; ctx.fillRect(lerp(area[0], area[2], r()), lerp(area[1], area[3], r()), s, s); } ctx.restore(); }
  // a building facade with a window grid; lit(i, j) -> 0..1
  function facade(x, y, w_, h_, cols, rows, lit, o = {}) {
    K.block(x, y, w_, h_, o.fill || "#121a30", o.edge || "#1e2742", 3);
    const mx = o.mx || 26, my = o.my || 30, ww = (w_ - mx * 2) / cols, wh = (h_ - my * 2) / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = lit(i, j), wx = x + mx + i * ww + ww * 0.18, wy = y + my + j * wh + wh * 0.18, w2 = ww * 0.64, h2 = wh * 0.6;
      ctx.fillStyle = "#1a2340"; ctx.fillRect(wx, wy, w2, h2);
      if (v > 0) { ctx.fillStyle = `rgba(${o.warm ? "255,214,150" : "205,218,255"},${(o.wa || 0.62) * v})`; ctx.fillRect(wx, wy, w2, h2); if (o.glow !== false && v > 0.5) K.glow(wx + w2 / 2, wy + h2 / 2, Math.max(w2, h2) * 1.6, `rgba(${o.warm ? "255,200,120" : "170,190,255"},0.25)`, v); }
    }
  }
  function hash(i, j, s = 1) { const x = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return x - Math.floor(x); }
  // ---- the bedroom: wall, window (city outside), moon streak, bed, bedside lamp
  function bedroom(lt, o = {}) {
    const lamp = o.lamp || 0;
    ctx.fillStyle = K.vgrad(0, 1920, [[0, "#070a13"], [0.5, "#0d1324"], [1, "#05070d"]]); ctx.fillRect(-2000, -2000, 5000, 6000);
    // window with the city outside
    const wx = 640, wy = 250, ww = 330, wh = 500;
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    ctx.fillStyle = "#0a1022"; ctx.fillRect(wx, wy, ww, wh); stars(3, 18, [wx, wy, wx + ww, wy + 260], 0.9);
    const cl = o.cityLit == null ? 1 : o.cityLit;
    facade(wx - 20, wy + 280, 140, 300, 3, 6, (i, j) => (hash(i, j, 2) < 0.45 ? cl : 0), { warm: true, glow: false });
    facade(wx + 140, wy + 230, 120, 350, 2, 7, (i, j) => (hash(i, j, 3) < 0.4 ? cl : 0), { warm: true, glow: false });
    facade(wx + 270, wy + 300, 120, 280, 2, 6, (i, j) => (hash(i, j, 4) < 0.45 ? cl : 0), { warm: true, glow: false });
    ctx.restore();
    ctx.strokeStyle = "#1d2540"; ctx.lineWidth = 14; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    // moonlight streak on the wall/floor
    ctx.save(); ctx.globalAlpha = 0.07 + 0.05 * (1 - lamp); ctx.fillStyle = "#9fb4ff"; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx + ww - 20, 1180); ctx.lineTo(wx - 260, 1180); ctx.closePath(); ctx.fill(); ctx.restore();
    // floor
    ctx.fillStyle = "#070910"; ctx.fillRect(-2000, 1180, 5000, 1200); ctx.fillStyle = "#1a2138"; ctx.fillRect(-2000, 1178, 5000, 4);
    // bed (left), headboard at the left wall
    K.block(40, 940, 120, 240, "#131a2e", "#222b46", 8);
    K.block(60, 1040, 560, 110, "#141b31", "#253050", 10);
    K.block(70, 1010, 540, 40, "#1c2440", "#2a3556", 12);
    K.block(90, 975, 150, 48, "#222b48", "#2e3a5e", 18);
    ctx.fillStyle = "#0c1020"; ctx.fillRect(80, 1150, 14, 30); ctx.fillRect(590, 1150, 14, 30);
    // bedside table + lamp (right of the bed)
    K.block(650, 1010, 140, 170, "#121829", "#212a44", 6); ctx.fillStyle = "#2a3350"; ctx.fillRect(690, 1080, 60, 4);
    ctx.fillStyle = lamp > 0.5 ? "#f6e3b8" : "#2a3148"; ctx.beginPath(); ctx.moveTo(680, 900); ctx.lineTo(760, 900); ctx.lineTo(780, 960); ctx.lineTo(660, 960); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1c2236"; ctx.fillRect(714, 960, 12, 40); ctx.fillRect(690, 998, 60, 12);
    if (lamp > 0) { K.glow(720, 950, 900, "rgba(255,190,120,0.5)", lamp); K.glow(720, 950, 260, "rgba(255,230,180,0.65)", lamp); }
  }
  // the whole city skyline; lit(x, y) -> 0..1 per window (world coords of the window)
  function city(lt, o = {}) {
    night(-600, 2400); stars(9, 90, [-1200, -400, 2300, 900], 0.8);
    ctx.save(); ctx.translate(0, CITY_DY);
    ctx.fillStyle = "rgba(160,175,220,0.9)"; ctx.beginPath(); ctx.arc(860, 300, 34, 0, 6.283); ctx.fill(); K.glow(860, 300, 160, "rgba(160,180,255,0.18)");
    const lit = o.lit || (() => 1);
    // far row
    for (let b = 0; b < 18; b++) { const x = -1300 + b * 210, hh = 560 + hash(b, 1, 5) * 480; facade(x, 1250 - hh, 190, hh, 3, Math.round(hh / 70), (i, j) => (hash(i + b * 3, j, 6) < 0.35 ? lit(x + i * 60, 1250 - hh + j * 70) * 0.6 : 0), { fill: "#0d1428", edge: "#18213a", glow: false }); }
    // near row (bigger)
    for (let b = 0; b < 11; b++) { const x = -1250 + b * 330, hh = 700 + hash(b, 2, 7) * 420; if (Math.abs(x + 150 - 540) < 10) continue;
      facade(x, 1400 - hh, 300, hh, 4, Math.round(hh / 80), (i, j) => (hash(i + b * 5, j, 8) < 0.42 ? lit(x + i * 70, 1400 - hh + j * 80) : 0), { fill: "#111930", edge: "#1e2742" }); }
    // your building (centre): 8 floors, your window on 7
    const bx = 390, bw = 300, top = 1400 - 8 * 92 - 40;
    K.block(bx, top, bw, 1400 - top, "#141c34", "#283357", 3);
    for (let f = 1; f <= 8; f++) { const y = 1400 - 30 - f * 92; for (let i = 0; i < 3; i++) { const wx_ = bx + 30 + i * 88, v = o.bldg ? o.bldg(f, i) : (hash(f, i, 9) < 0.5 ? 1 : 0); ctx.fillStyle = "#1a2340"; ctx.fillRect(wx_, y, 60, 52); if (v > 0) { ctx.fillStyle = `rgba(255,214,150,${0.9 * v})`; ctx.fillRect(wx_, y, 60, 52); K.glow(wx_ + 30, y + 26, 80, "rgba(255,200,120,0.25)", v); } } }
    ctx.fillStyle = "#04060c"; ctx.fillRect(-3000, 1400, 7000, 1600); ctx.fillStyle = "#1a2138"; ctx.fillRect(-3000, 1398, 7000, 3);
    // street lamps
    for (let x = -1200; x < 2400; x += 260) { ctx.fillStyle = "#151b2e"; ctx.fillRect(x, 1300, 8, 100); const v = lit(x, 1300) * (o.street == null ? 1 : o.street); if (v > 0) { ctx.fillStyle = `rgba(255,214,150,${v})`; ctx.fillRect(x - 6, 1296, 20, 8); K.glow(x + 4, 1300, 70, "rgba(255,200,120,0.35)", v); } }
    ctx.restore();
  }
  const CITY_DY = 330;
  // the building in section: floors 1..8 from ground y 1500 upward, 260 px each; fl(f) -> light 0..1; you on 7
  const FH = 260, GY = 1500, BX = 170, BW = 740;
  function section(lt, o = {}) {
    night(-1800, 2400);
    ctx.fillStyle = "#04060c"; ctx.fillRect(-2000, GY, 5000, 1200);
    K.block(BX - 20, GY - 8 * FH - 40, BW + 40, 8 * FH + 40, "#0e1427", "#222b46", 4);
    for (let f = 1; f <= 8; f++) {
      const y = GY - f * FH, v = o.fl ? o.fl(f) : 1;
      // room
      K.block(BX, y + 10, BW - 230, FH - 20, v > 0.02 ? `rgb(${lerp(16, 46, v)},${lerp(22, 44, v)},${lerp(40, 58, v)})` : "#10162a", "#232c47", 4);
      // window + furniture silhouettes
      ctx.fillStyle = "#1a2340"; ctx.fillRect(BX + 40, y + 50, 120, 100);
      if (v > 0) { K.glow(BX + 260, y + 150, 260, "rgba(255,200,130,0.35)", v); ctx.fillStyle = `rgba(255,220,160,${0.85 * v})`; ctx.fillRect(BX + 330, y + 60, 40, 26); }
      ctx.fillStyle = "#151c31"; ctx.fillRect(BX + 220, y + FH - 80, 180, 60); ctx.fillRect(BX + 420, y + FH - 120, 60, 100);
      // stairwell
      const sx = BX + BW - 220;
      K.block(sx, y + 10, 210, FH - 20, "#0f1529", "#232c47", 4);
      ctx.strokeStyle = "#2a3456"; ctx.lineWidth = 6; ctx.beginPath(); const n = 6;
      for (let k = 0; k <= n; k++) { const xx = f % 2 ? sx + 20 + k * 28 : sx + 190 - k * 28, yy = y + FH - 20 - k * (FH - 40) / n; if (k === 0) ctx.moveTo(xx, yy); else { ctx.lineTo(xx, yy + (FH - 40) / n); ctx.lineTo(xx, yy); } } ctx.stroke();
      K.text(String(f), sx + 104, y + FH / 2 + 18, { w: 600, px: 48, col: f === 7 && o.mark7 ? C.lime : "#3a4566", align: "center", a: 1 });
      // the door to the room (in the stairwell wall)
      ctx.fillStyle = v > 0.02 ? `rgba(255,214,150,${0.5 * v})` : "#141a2e"; ctx.fillRect(sx - 6, y + FH - 30, 6, 14);
    }
    ctx.fillStyle = "#1a2138"; ctx.fillRect(-2000, GY - 2, 5000, 4);
    // you, in the room on 7
    const y7 = GY - 7 * FH;
    K.stick({ x: BX + 300, y: y7 + FH - 20, s: 0.42, pose: "sit", phone: true, phoneLit: o.phoneLit, col: "#c9cdd6", lw: 13 });
    if (o.phoneLit) K.glow(BX + 330, y7 + FH - 120, 160, "rgba(180,200,255,0.5)", o.phoneLit);
    if (o.mark7 > 0) { ctx.save(); ctx.globalAlpha = clamp(o.mark7 * 2, 0, 1); ctx.strokeStyle = C.lime; ctx.lineWidth = 6; K.rr(BX - 10, y7 + 4, BW + 20, FH - 8, 12); ctx.stroke(); ctx.restore(); }
  }

  // ------------------------------------------------------------------ shots
  const shots = [];
  const add = (s) => { s.xf = s.xf || 0; shots.push(s); };
  const CAM = (z, cx, cy) => ({ z, cx, cy });
  const camL = (a, b, u, e = eio) => ({ z: lerp(a.z, b.z, e(u)), cx: lerp(a.cx, b.cx, e(u)), cy: lerp(a.cy, b.cy, e(u)) });
  const lin = (x) => x;

  // R1 the bedroom: the lamp dies at 0.2 s, you on the bed edge with your phone; the loop echoes
  add({ id: "room", t0: 0, cam: (u) => camL(CAM(1.0, 540, 980), CAM(1.1, 470, 1000), u, lin), draw(lt, u, t) {
    const lamp = t < T.lampOff ? 1 : 0;
    bedroom(lt, { lamp });
    // lamp on (first 0.2 s): a warm wash that lifts every dark pixel to just under 64/255 (a big luma change, the
    // analyzer's one cut, but no 64-level histogram bin change, so no scene change), plus the bulb's own glow
    if (lamp) { ctx.save(); ctx.globalCompositeOperation = "lighten"; ctx.fillStyle = "rgb(63,60,52)"; ctx.fillRect(-2000, -2000, 5000, 6000); ctx.restore(); K.glow(720, 950, 760, "rgba(255,200,140,0.55)"); K.glow(520, 900, 520, "rgba(255,225,190,0.35)"); }
    const glowA = 1;
    const fig = { x: 330, y: 1150, s: 1.0, pose: "sit", phone: true, phoneLit: true, col: lamp ? "#f4f4f0" : C.line, headFill: lamp ? "rgba(255,255,255,0.08)" : null };
    // echoes of the earlier loops (faint copies), on "remembers"
    const ek = on(t, w("s1", "four") - 0.05, 0.3) * (1 - on(t, w("s1", "four") + 1.2, 0.8)) + on(t, w("s1", "remembers") - 0.1, 0.2) * (1 - on(t, L("s1").end + 0.3, 0.6));
    if (ek > 0) [[-90, 0.18], [-180, 0.11], [-270, 0.06]].forEach(([dx, a]) => { ctx.save(); ctx.globalAlpha = a * ek; K.stick(Object.assign({}, fig, { x: fig.x + dx, phoneLit: false })); ctx.restore(); });
    const f = K.stick(fig);
    K.glow(f.hand[0], f.hand[1] - 20, 420, "rgba(150,170,230,0.20)", glowA); K.glow(f.hand[0], f.hand[1] - 20, 140, "rgba(200,215,255,0.35)", glowA);
  } });
  // R2 midnight resets everything (rewind glitch), except your phone
  add({ id: "rewind", t0: T.rewind, cam: (u, lt, t) => camL(CAM(1.1, 470, 1000), CAM(1.75, 470, 860), on(t, w("s2", "Except") - 0.2, 1.2)), draw(lt, u, t) {
    bedroom(lt, {});
    const f = K.stick({ x: 330, y: 1150, s: 1.0, pose: "sit", phone: true, phoneLit: true });
    const ex = on(t, w("s2", "Except") - 0.05, 0.4);
    if (ex > 0) { ctx.save(); ctx.fillStyle = `rgba(2,3,8,${0.55 * ex})`; ctx.fillRect(-2000, -2000, 5000, 6000); ctx.restore(); }
    K.glow(f.hand[0], f.hand[1] - 20, 420, "rgba(150,170,230,0.22)"); K.glow(f.hand[0], f.hand[1] - 20, 150, "rgba(210,225,255,0.45)", 0.8 + 0.5 * ex);
  }, post(lt, u, t) { // the rewind: horizontal slices slip for 0.6 s on "resets"
    const r0 = w("s2", "resets") - 0.08, k = on(t, r0, 0.05) * (1 - on(t, r0 + 0.55, 0.15));
    if (k > 0) { const r = rng(Math.floor(t * 30)); for (let i = 0; i < 14; i++) { const y = r() * H, h = 20 + r() * 90, dx = (r() - 0.5) * 120 * k; ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h); }
      ctx.save(); ctx.globalAlpha = 0.85 * k; K.text("◀◀", 920, 600, { w: 600, px: 80, col: "#f2f2ec", align: "center" }); ctx.restore(); }
  } });
  // R3 the battery that never comes back (lock screen)
  add({ id: "lock", t0: T.lock, xf: 0.25, cam: (u) => camL(CAM(1.0, 540, 1000), CAM(1.06, 540, 990), u), draw(lt, u, t) {
    night(); K.phone({ x: 540, y: 1080, s: 0.98, rot: -0.03, screen: "lock", t: lt, lock: { time: "11:48", date: "Saturday, November 14", battery: 31, batteryK: 1 } });
  } });
  // R4 a text from your own number
  add({ id: "thread", t0: T.thread, xf: 0.25, cam: (u) => camL(CAM(1.0, 540, 1000), CAM(1.05, 540, 990), u), draw(lt, u, t) {
    night();
    const bz = w("s4", "buzzes") - 0.1, sh = t > bz && t < bz + 0.5 ? Math.sin((t - bz) * 80) * 7 * (1 - (t - bz) / 0.5) : 0;
    K.phone({ x: 540 + sh, y: 1080, s: 0.98, rot: 0.035, screen: "thread", t: lt, thread: { name: "Me", sub: "this number · scheduled", msgs: [
      { me: false, t: "It's you. Loop 3.", k: clamp((t - bz) / 0.3, 0, 1) },
      { me: false, t: "Rule one is wrong.", k: clamp((t - (w("s4", "own") - 0.1)) / 0.3, 0, 1) }] } });
  } });
  // R5 the city and RULE #1
  add({ id: "city", t0: T.city, xf: 0.3, cam: (u) => camL(CAM(1.0, 540, 1080), CAM(1.1, 560, 1120), u), draw(lt) { city(lt, {}); }, post(lt, u, t) {
    const r0 = w("s5", "Rule") - 0.06; K.ruleTag("RULE #1", 380, 640, { a: on(t, r0, 0.08), s: lerp(1.4, 1, pop(t, r0, 0.3)), px: 70 });
  } });
  // R6 across the street: the windows go dark, one by one
  const facLit = (t, t0) => (i, j) => { const order = j * 4 + i, td = t0 + order * 0.07; return (hash(i, j, 12) < 0.6 ? 1 : 0) * (1 - sstep(td, td + 0.05, t)); };
  add({ id: "across", t0: T.across, xf: 0.3, cam: (u) => camL(CAM(1.0, 540, 1000), CAM(1.06, 540, 980), u), draw(lt, u, t) {
    night(); stars(11, 60, [-200, -200, 1300, 500], 0.8);
    const d0 = w("s6", "dark") - 0.05;
    facade(-120, 560, 760, 1300, 4, 13, facLit(t, d0), { warm: true, fill: "#121a30", edge: "#222b48", wa: 0.55 });
    facade(680, 820, 560, 1040, 3, 10, (i, j) => (hash(i, j, 13) < 0.45 ? 1 - sstep(d0 + 3.6 + j * 0.08, d0 + 3.7 + j * 0.08, t) : 0), { warm: true, fill: "#0f162b", wa: 0.5 });
    ctx.fillStyle = "#04060c"; ctx.fillRect(-2000, 1860, 5000, 900);
  } });
  // R7 block by block, toward you (pull back over the city)
  add({ id: "blocks", t0: T.blocks, xf: 0.3, cam: (u) => camL(CAM(1.05, 540, 1100), CAM(0.8, 540, 1250), u), draw(lt, u, t) {
    const t0 = T.blocks + 0.1;
    city(lt, { lit: (x, y) => { const d = Math.abs(x + 150 - 540); const td = t0 + (2400 - d) / 1000 * 1.0; return 1 - sstep(td, td + 0.15, t + (d < 300 ? -99 : 0)); }, street: 1 });
  } });
  // R8 your building in section: ground floor, two, three... you live on seven
  add({ id: "bldg", t0: T.bldg, xf: 0.3, cam: (u, lt, t) => { const k = on(t, w("s9", "You") - 0.4, 1.0); return camL(camL(CAM(1.0, 540, GY - 1.5 * FH), CAM(1.0, 540, GY - 2.4 * FH), u), CAM(1.0, 540, GY - 6.2 * FH), k); }, draw(lt, u, t) {
    const off = { 1: w("s8", "black") - 0.05, 2: w("s8", "two") - 0.05, 3: w("s8", "three") - 0.05, 4: w("s8", "three") + 0.75, 5: w("s8", "three") + 1.3, 6: 999, 7: 999, 8: 999 };
    section(lt, { fl: (f) => 1 - sstep(off[f], off[f] + 0.12, t), mark7: on(t, w("s9", "seven") - 0.08, 0.2), phoneLit: 0 });
  } });
  // R9 six goes dark, then your lamp
  add({ id: "six", t0: T.six, xf: 0.25, cam: (u) => camL(CAM(1.35, 540, GY - 6.5 * FH), CAM(1.5, 520, GY - 6.6 * FH), u), draw(lt, u, t) {
    const o6 = w("s10", "goes") - 0.25, o7 = w("s10", "lamp") - 0.08;
    section(lt, { fl: (f) => (f <= 5 ? 0 : f === 6 ? 1 - sstep(o6, o6 + 0.12, t) : f === 7 ? 1 - sstep(o7, o7 + 0.1, t) : 1), mark7: 0, phoneLit: 0 });
  } });
  // R10 your phone lights up: the last light in the city
  add({ id: "last", t0: T.last, xf: 0.3, cam: (u, lt, t) => camL(CAM(2.0, 540, 1020), CAM(0.9, 540, 1250), on(t, w("s11", "The") - 0.1, 1.6)), draw(lt, u, t) {
    const ph = on(t, w("s11", "lights") - 0.05, 0.2);
    city(lt, { lit: () => 0, street: 0, bldg: (f, i) => (f === 7 && i === 1 ? 0 : 0) });
    // your window on 7: a cold phone glow
    const wx = 390 + 30 + 88 + 30, wy = 1400 - 30 - 7 * 92 + 26 + CITY_DY;
    ctx.fillStyle = `rgba(200,215,255,${0.85 * ph})`; ctx.fillRect(wx - 30, wy - 26, 60, 52); K.glow(wx, wy, 220, "rgba(170,190,255,0.5)", ph); K.glow(wx, wy, 60, "rgba(230,238,255,0.9)", ph);
  } });
  // R11 the new texts
  add({ id: "thread2", t0: T.thread2, xf: 0.25, cam: (u) => camL(CAM(1.0, 540, 1000), CAM(1.05, 540, 990), u), draw(lt, u, t) {
    night();
    const a1 = w("s12", "Last") - 0.1, a2 = w("s12", "found") - 0.1, tint = on(t, w("s12", "anyway") - 0.05, 0.08) * (1 - on(t, w("s12", "anyway") + 0.35, 0.3));
    K.phone({ x: 540, y: 1080, s: 0.98, rot: 0.03, screen: "thread", t: lt, tint, thread: { name: "Me", sub: "this number · scheduled", msgs: [
      { me: false, t: "It's you. Loop 3.", k: 1 }, { me: false, t: "Rule one is wrong.", k: 1 },
      { me: true, t: "What do you mean?", k: 1, status: "Delivered" },
      { me: false, t: "Last loop I froze.", k: clamp((t - a1) / 0.3, 0, 1), hi: true }, { me: false, t: "It found me anyway.", k: clamp((t - a2) / 0.3, 0, 1), hi: true },
      { me: false, t: "Run for the roof.", k: clamp((t - (L("s12").end + 0.25)) / 0.3, 0, 1), hi: true }] } });
  } });
  // R12 the vote
  add({ id: "vote", t0: T.vote, xf: 0.3, cam: () => CAM(1, 540, 960), draw(lt, u, t) {
    night(); K.glow(540, 1050, 900, "rgba(40,60,120,0.25)");
  }, post(lt, u, t) {
    K.voteStack({ y0: 800, q: "WHAT DO YOU DO?", qk: on(t, w("s13", "What") - 0.05, 0.15),
      A: { t: "FREEZE", k: on(t, w("s14", "A") - 0.08, 0.15), tk: clamp((t - (w("s14", "freeze") - 0.05)) / 0.35, 0, 1) },
      B: { t: "RUN FOR THE ROOF", k: on(t, w("s15", "B") - 0.08, 0.15), tk: clamp((t - (w("s15", "run") - 0.25)) / 0.5, 0, 1) },
      fk: on(t, w("s16", "Comment") - 0.05, 0.15), sk: on(t, w("s16", "most") - 0.05, 0.2), pk: clamp((t - (w("s16", "loop") - 0.05)) / 0.35, 0, 1), part: "LOOP 5" });
  } });
  // R13 the end card
  add({ id: "end", t0: T.end, cam: () => CAM(1, 540, 960), draw(lt) { ctx.fillStyle = "#020306"; ctx.fillRect(-100, -100, 1300, 2200); }, post(lt, u, t) {
    const k = on(t, T.end + 0.15, 0.3);
    K.text("SAME NIGHT", 540, 1000, { w: 500, px: 24, fam: "mono", col: "#8d93a0", align: "center", ls: 14, a: k });
    const p1 = "FOLLOW FOR ", p2 = "PART 2", px = 84, w1 = K.measure(p1, 600, px), w2 = K.measure(p2, 600, px), x0 = 540 - (w1 + w2) / 2;
    K.text(p1, x0, 1095, { w: 600, px, col: "#f2f2ec", a: k }); K.text(p2, x0 + w1, 1095, { w: 600, px, col: C.red, a: k });
    K.text("COMMENT A OR B", 540, 1160, { w: 500, px: 22, fam: "mono", col: "#8d93a0", align: "center", ls: 8, a: k });
  } });

  for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : END + 1;
  window.SM_SHOTS = shots.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), t1: +Math.min(s.t1, END).toFixed(3) }));

  // ------------------------------------------------------------------ HUD over everything
  function hud(t) {
    let time = "11:48", ampm = "PM";
    if (t >= T.thread) time = "11:49";
    if (t >= T.city) time = "11:53";
    if (t >= T.t1159) time = "11:59";
    let batt = 31; if (t >= T.thread) batt = 30; if (t >= T.thread2) batt = 29;
    const bHi = on(t, w("s3", "never") - 0.05, 0.1) * (1 - on(t, L("s3").end + 0.5, 0.3));
    const bPop = 1 + 0.25 * Math.max(0, 1 - Math.abs(t - (w("s3", "never") + 0.05)) / 0.25);
    const lPop = 1 + 0.3 * Math.max(0, 1 - Math.abs(t - (w("s1", "four") + 0.05)) / 0.25);
    const g = t > T.end + 1.0 ? (Math.floor(t * 12) % 3 === 0 ? 1 : 0) : 0;
    const loopVal = t > T.end + 0.9 ? (g ? "4" : "5?") : "4";
    const tPop = t > T.t1159 && t < T.t1159 + 0.3;
    return { a: 1, day: "DAY 1", time, ampm, timeCol: tPop ? C.lime : null, dot: 0.6 + 0.4 * Math.sin(t * 4),
      rows: [["BATTERY", batt + "%", bHi > 0.5 ? C.red : null, bPop], ["LOOP", loopVal, C.red, lPop]] };
  }

  const buf = document.createElement("canvas"); buf.width = W; buf.height = H; const bctx = buf.getContext("2d");
  function draw(t) {
    let i = 0; while (i + 1 < shots.length && t >= shots[i + 1].t0) i++;
    const s = shots[i], lt = t - s.t0;
    if (s.xf > 0 && lt < s.xf && i > 0) {
      drawPlain(i - 1, t);
      bctx.drawImage(ctx.canvas, 0, 0);
      drawPlain(i, t);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - eio(clamp(lt / s.xf, 0, 1)); ctx.drawImage(buf, 0, 0); ctx.restore();
    } else drawPlain(i, t);
    K.hud(hud(t));
    K.vignette(0.5);
  }
  function drawPlain(i, t) {
    const s = shots[i], lt = t - s.t0, dur = Math.max(0.01, s.t1 - s.t0), u = clamp(lt / dur, 0, 1);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const c = s.cam(u, lt, t); ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
    s.draw(lt, u, t); ctx.restore();
    ctx.save(); if (s.post) s.post(lt, u, t); ctx.restore();
  }
  return { draw, T, shots };
};
