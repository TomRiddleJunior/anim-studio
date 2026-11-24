/* film.js — template: the format in five beats (lit room -> lamp dies, a text thread, RULE over the city, the vote
   stack, the follow card). Copy more sets from assets/sample/assets/lib/film.js (the facade going dark, the building
   section, the last light). Shot: { id, t0, xf (dissolve s), cam(u, lt, t) -> {z, cx, cy}, draw(lt, u, t), post }.
   window.SM_FILM(K, V) -> { draw(t), T, shots }. */
window.SM_FILM = function (K, V) {
  const { ctx, W, H, clamp, lerp, sstep, eio, eout, back, rng } = K;
  const C = K.COL;
  const L = (id) => V.L(id);
  const w = (id, word, k) => V.w(id, word, k);
  const END = V.duration;
  const on = (t, t0, d = 0.2) => sstep(t0, t0 + d, t);
  const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : back(clamp((t - t0) / d, 0, 1), 2.2));
  const T = {};
  T.lampOff = 0.13;   // frames 0-3 lit: one analyzer cut, no scene change (see SKILL.md §2)
  T.thread = L("k2").start - 0.19; T.city = L("k3").start - 0.24; T.vote = L("k4").start - 0.15; T.end = L("k4").end + 0.9;
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
    const ek = on(t, w("k1", "four") - 0.05, 0.3) * (1 - on(t, w("k1", "four") + 1.2, 0.8)) + on(t, w("k1", "night") - 0.1, 0.2) * (1 - on(t, L("k1").end + 0.3, 0.6));
    if (ek > 0) [[-90, 0.18], [-180, 0.11], [-270, 0.06]].forEach(([dx, a]) => { ctx.save(); ctx.globalAlpha = a * ek; K.stick(Object.assign({}, fig, { x: fig.x + dx, phoneLit: false })); ctx.restore(); });
    const f = K.stick(fig);
    K.glow(f.hand[0], f.hand[1] - 20, 420, "rgba(150,170,230,0.20)", glowA); K.glow(f.hand[0], f.hand[1] - 20, 140, "rgba(200,215,255,0.35)", glowA);
  } });
  // R2 midnight resets everything (rewind glitch), except your phone
  add({ id: "thread", t0: T.thread, xf: 0.25, cam: (u) => camL(CAM(1.0, 540, 1000), CAM(1.05, 540, 990), u), draw(lt, u, t) {
    night();
    const bz = L("k2").start - 0.1;
    K.phone({ x: 540, y: 1080, s: 0.98, rot: 0.035, screen: "thread", t: lt, thread: { name: "Me", sub: "this number · scheduled", msgs: [
      { me: false, t: "It's you. Loop 3.", k: clamp((t - bz) / 0.3, 0, 1) }, { me: false, t: "Rule one is wrong.", k: clamp((t - (w("k2", "own") - 0.1)) / 0.3, 0, 1) }] } });
  } });
  add({ id: "city", t0: T.city, xf: 0.3, cam: (u) => camL(CAM(1.0, 540, 1080), CAM(1.1, 560, 1120), u), draw(lt) { city(lt, {}); }, post(lt, u, t) {
    const r0 = w("k3", "Rule") - 0.06; K.ruleTag("RULE #1", 380, 640, { a: on(t, r0, 0.08), s: lerp(1.4, 1, pop(t, r0, 0.3)), px: 70 });
  } });
  add({ id: "vote", t0: T.vote, xf: 0.3, cam: () => CAM(1, 540, 960), draw(lt) { night(); K.glow(540, 1050, 900, "rgba(40,60,120,0.25)"); }, post(lt, u, t) {
    K.voteStack({ y0: 800, q: "WHAT DO YOU DO?", qk: on(t, w("k4", "What") - 0.05, 0.15),
      A: { t: "FREEZE", k: on(t, w("k4", "A") - 0.08, 0.15), tk: clamp((t - (w("k4", "freeze") - 0.05)) / 0.35, 0, 1) },
      B: { t: "RUN", k: on(t, w("k4", "B") - 0.08, 0.15), tk: clamp((t - (w("k4", "run") - 0.05)) / 0.3, 0, 1) },
      fk: on(t, w("k4", "Comment") - 0.05, 0.15), sk: on(t, w("k4", "Comment") + 0.4, 0.2), pk: on(t, L("k4").end + 0.2, 0.3), part: "LOOP 5" });
  } });
  add({ id: "end", t0: T.end, cam: () => CAM(1, 540, 960), draw(lt) { ctx.fillStyle = "#020306"; ctx.fillRect(-100, -100, 1300, 2200); }, post(lt, u, t) {
    const k = on(t, T.end + 0.15, 0.3);
    K.text("SAME NIGHT", 540, 1000, { w: 500, px: 24, fam: "mono", col: "#8d93a0", align: "center", ls: 14, a: k });
    const p1 = "FOLLOW FOR ", p2 = "PART 2", px = 84, w1 = K.measure(p1, 600, px), w2 = K.measure(p2, 600, px), x0 = 540 - (w1 + w2) / 2;
    K.text(p1, x0, 1095, { w: 600, px, col: "#f2f2ec", a: k }); K.text(p2, x0 + w1, 1095, { w: 600, px, col: C.red, a: k });
    K.text("COMMENT A OR B", 540, 1160, { w: 500, px: 22, fam: "mono", col: "#8d93a0", align: "center", ls: 8, a: k });
  } });

  for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : END + 1;
  window.SM_SHOTS = shots.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), t1: +Math.min(s.t1, END).toFixed(3) }));


  for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : END + 1;
  window.SM_SHOTS = shots.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), t1: +Math.min(s.t1, END).toFixed(3) }));

  function hud(t) {
    const time = t >= T.city ? "11:53" : "11:48";
    const g = t > T.end + 1.0 ? (Math.floor(t * 12) % 3 === 0 ? 1 : 0) : 0;
    return { a: 1, day: "DAY 1", time, ampm: "PM", dot: 0.6 + 0.4 * Math.sin(t * 4),
      rows: [["BATTERY", t >= T.thread ? "30%" : "31%"], ["LOOP", t > T.end + 0.9 ? (g ? "4" : "5?") : "4", C.red]] };
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

