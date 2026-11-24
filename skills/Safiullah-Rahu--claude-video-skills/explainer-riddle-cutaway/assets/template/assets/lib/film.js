/* TEMPLATE derived from "The 1:12 Call" (riddle-hotel): a classic lateral-thinking riddle (the hotel guest who phones the next room, says
   nothing, hangs up and falls asleep) in the cutaway-building riddle format. window.RC_FILM(K, V) -> {shots, T}.
   V.L(id) = line {start, end}, V.w(id, word, k) = word start. Every shot is a pure function of time. */
window.RC_FILM = function (K, V) {
  const { D, P, E, ramp, clamp, lerp, rng } = K;
  const L = (id) => V.L(id).start, Le = (id) => V.L(id).end, w = V.w;
  const W = 1080, H = 1920;
  const osc = (t, f, a) => Math.sin(t * Math.PI * 2 * f) * a;

  // ---------------------------------------------------------------- the building (world units, floor 1 = lobby)
  const BASE = 2400, FH = 340, Y = (n) => BASE - (n - 1) * FH;   // Y(n) = floor surface of floor n
  const XA0 = 24, XA1 = 452, XB0 = 468, XB1 = 862, XS0 = 878, XS1 = 1080;
  const ROOMCOL = { 2: [P.rooms[0], P.rooms[3]], 3: [P.rooms[4], P.rooms[2]], 4: [P.rooms[1], P.rooms[5]], 5: [P.rooms[3], P.rooms[0]] };
  const GUEST = { skin: "#f2cfa8", hair: "bald", glasses: true, shirt: "#5fa3a0", stripes: "#e6f2ee", r: 44 };   // Room 305
  const SNORER = { skin: "#a8714f", hair: "beard", shirt: "#c9524a", stripes: "#f1d2cc", r: 48, blanket: "#7b8f5a" }; // Room 306
  const NADIA = { skin: "#b07850", hair: "bun", shirt: "#fbf8f1", vest: "#d9a33a", pants: "#3b3f4c" };
  const stars = (() => { const r = rng(5); return Array.from({ length: 60 }, () => [r(), r(), 0.6 + r() * 1.6]); })();

  let DAY = false;
  const nightWin = (c, x, y, w, h, o = {}) => { // a back-wall window at night (or day)
    const day = o.day || DAY;
    D.rect(c, x, y, w, h, day ? P.skyDay : P.night);
    if (!day) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); for (const [sx, sy, r] of stars.slice(0, 8)) D.ell(c, x + sx * w, y + sy * h, r, r, "#e8ecf6", null); if (o.moon) D.ell(c, x + w * 0.7, y + h * 0.32, 14, 14, "#f6efd2", null); c.restore(); }
    D.line(c, x + w / 2, y, x + w / 2, y + h); D.line(c, x, y + h / 2, x + w, y + h / 2); D.rect(c, x, y, w, h, null);
  };
  const door = (c, x, y, w, h, num) => { D.rect(c, x, y, w, h, "#9b6a3e"); D.ell(c, x + w - 12, y + h / 2, 4, 4, P.amber, null); if (num) { D.rect(c, x + w / 2 - 20, y + 22, 40, 22, P.cream, P.ink, 2); D.text(c, num, x + w / 2, y + 34, 15, P.ink); } };
  const stairs = (c, n) => { // the stair core of floor n (two flights per floor), sign + big floor number
    const y = Y(n);
    D.rect(c, XS0, y - FH, XS1 - XS0, FH, P.stair, null);
    const flight = (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0, y0); const N = 7; for (let k = 1; k <= N; k++) { const xa = lerp(x0, x1, (k - 0.5) / N), xb = lerp(x0, x1, k / N); c.lineTo(xa, lerp(y0, y1, (k - 1) / N)); c.lineTo(xa, lerp(y0, y1, k / N)); c.lineTo(xb, lerp(y0, y1, k / N)); }
      c.lineTo(x1, y1 + 26); c.lineTo(x0, y0 + 26); c.closePath(); D.fs(c, P.stairDk, P.ink, 2.4); D.line(c, x0, y0 - 40, x1, y1 - 40, P.ink, 2.4); };
    flight(XS0 + 20, y, XS1 - 30, y - FH / 2);
    D.rect(c, XS1 - 40, y - FH / 2, 40, 14, P.stairDk, P.ink, 2.4);
    flight(XS1 - 40, y - FH / 2, XS0 + 30, y - FH + 14);
    D.text(c, String(n), XS0 + 60, y - FH * 0.72, 54, "#9b8a73");
    D.rr(c, XS0 + 24, y - FH + 30, 74, 26, 4, P.cream, P.ink, 2); D.text(c, "Stairs", XS0 + 61, y - FH + 43, 15, P.ink);
  };
  const slab = (c, y) => { D.rect(c, 0, y, W, 16, P.grey); };
  // a guest room: colour, window, door, bed (with occupant opts), shelf + phone, picture frame (rattle)
  const room = (c, n, side, o = {}) => {
    const y = Y(n), x0 = side ? XB0 : XA0, x1 = side ? XB1 : XA1;
    D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, (ROOMCOL[n] || P.rooms)[side], null);
    const num = `${n}0${side ? 6 : 5}`;
    if (side) { nightWin(c, 620, y - 270, 110, 100, { day: o.day, moon: o.moon }); door(c, 760, y - 230, 74, 230, num); }
    else { nightWin(c, 120, y - 270, 110, 100, { day: o.day, moon: o.moon }); door(c, 40, y - 230, 70, 230, num); }
    // picture frame on the back wall near the shared wall (305 side) - rattles with the snore
    if (!side) { c.save(); c.translate(300, y - 280); c.rotate(o.rattle ? Math.sin(o.t * 70) * 0.08 * o.rattle : 0); D.rect(c, -34, -26, 68, 52, "#c9b28a"); D.rect(c, -26, -18, 52, 36, "#8fb3c9", P.ink, 2); D.line(c, -26, 10, -6, -4, P.ink, 2); D.line(c, -6, -4, 10, 8, P.ink, 2); c.restore(); }
    else { D.rect(c, 680, y - 330 + 40, 0, 0, null, null); }
    // shelf + phone above the headboard
    const sx = side ? XB0 + 8 : XA1 - 120;
    D.rect(c, sx, y - 208, 112, 12, "#8a5a36");
    if (o.lampOn) { c.save(); c.globalAlpha = 0.25; const g = c.createRadialGradient(sx + (side ? 92 : 20), y - 250, 4, sx + (side ? 92 : 20), y - 250, 160); g.addColorStop(0, "rgba(255,220,140,1)"); g.addColorStop(1, "rgba(255,220,140,0)"); c.fillStyle = g; c.fillRect(sx - 160, y - 420, 440, 340); c.restore(); }
    D.rr(c, sx + (side ? 76 : 4), y - 250, 30, 40, 6, o.lampOn ? "#ffe6a8" : "#e9dcc0"); D.line(c, sx + (side ? 91 : 19), y - 210, sx + (side ? 91 : 19), y - 222);
    D.phone(c, sx + (side ? 36 : 76), y - 208, 0.9, { ring: o.ring || 0, t: o.t || 0, lifted: o.lifted, col: side ? "#c9544a" : "#4f7fb0" });
    // bed (head at the shared wall)
    if (side) D.bed(c, XB0 + 6, XB0 + 250, y, Object.assign({ head: -1 }, SNORER, o.bed || {}));
    else D.bed(c, XA1 - 250, XA1 - 6, y, Object.assign({ head: 1 }, GUEST, o.bed || {}));
    if (o.dark) D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, `rgba(20,26,48,${o.dark})`, null);
  };
  const genericRoom = (c, n, side, lit) => {
    const y = Y(n), x0 = side ? XB0 : XA0, x1 = side ? XB1 : XA1;
    D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, (ROOMCOL[n] || P.rooms)[side], null);
    if (side) { nightWin(c, 620, y - 270, 110, 100); door(c, 760, y - 230, 74, 230, `${n}06`); } else { nightWin(c, 120, y - 270, 110, 100); door(c, 40, y - 230, 70, 230, `${n}05`); }
    const bx = side ? XB0 + 6 : XA1 - 250;
    D.rr(c, bx, y - 70, 244, 70, 6, "#8a5a36"); D.rr(c, bx + 6, y - 112, 232, 46, 14, P.white); D.rr(c, bx + 10, y - 124, 224, 58, 10, side ? "#c98a5a" : "#7a9ac0");
    if (n % 2 && !side) { D.rect(c, 250, y - 150, 70, 150, "#a8743f"); D.rect(c, 258, y - 140, 54, 60, "#c9a070", P.ink, 2); }
    if (!lit) D.rect(c, x0, y - FH + 16, x1 - x0, FH - 16, "rgba(20,26,48,0.32)", null);
  };
  // lobby (floor 1): entrance, plant, wall clock, switchboard, the desk with Nadia
  const lobby = (c, t, o = {}) => {
    const y = Y(1);
    D.rect(c, XA0, y - FH + 16, XB1 - XA0, FH - 16, "#ece2c8", null);
    D.rect(c, 40, y - 250, 150, 250, P.sky); D.line(c, 115, y - 250, 115, y); D.rect(c, 40, y - 250, 150, 250, null);
    D.rect(c, 250, y - 90, 60, 90, "#b56a3a"); for (const [dx, dy, r] of [[-20, -120, 34], [22, -128, 36], [0, -160, 34]]) D.ell(c, 280 + dx, y + dy, r, r * 0.8, "#6a9a5a");
    // wall clock
    D.rr(c, 390, y - 300, 140, 60, 10, "#1f2633"); D.text(c, o.clock || "1:12", 460, y - 269, 38, P.amber);
    // switchboard: 8 lamps, floors 2..5 x rooms 05/06
    const bx = 580, by = y - 310;
    D.rr(c, bx, by, 240, 170, 10, "#3a4152"); D.text(c, "ROOM CALLS", bx + 120, by + 20, 16, "#c9ccd6");
    for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
      const fl = 5 - r, rn = `${fl}0${5 + k}`, lx = bx + 46 + k * 110, ly = by + 52 + r * 31;
      const on = (o.lit || {})[rn] || 0;
      if (on > 0) { c.save(); c.globalAlpha = on * 0.6; const g = c.createRadialGradient(lx, ly, 2, lx, ly, 34); g.addColorStop(0, "rgba(255,190,80,1)"); g.addColorStop(1, "rgba(255,190,80,0)"); c.fillStyle = g; c.fillRect(lx - 34, ly - 34, 68, 68); c.restore(); }
      D.ell(c, lx, ly, 10, 10, on > 0.5 ? "#ffc65a" : "#5a6070", P.ink, 2);
      D.text(c, rn, lx + 40, ly + 1, 17, on > 0.5 ? "#ffe2a0" : "#aeb3c0");
    }
    if (o.patch) { c.save(); c.globalAlpha = o.patch; c.beginPath(); c.moveTo(bx + 56, by + 114); c.quadraticCurveTo(bx + 110, by + 150, bx + 156, by + 114); D.st(c, P.amber, 4); c.restore(); }
    // Nadia behind the desk
    if (!o.noNadia) D.person(c, Object.assign({ x: 560, y: y - 6, s: 0.66, arm: o.arm != null ? o.arm : 0.4, armL: o.armL != null ? o.armL : -0.4, eyes: o.eyes, mouth: o.mouth, look: o.look }, NADIA));
    if (o.receiver && !o.noNadia) { c.save(); c.translate(530, y - 236); D.rr(c, -9, -28, 18, 56, 8, "#2e3440"); c.restore(); }
    // desk
    D.rect(c, 380, y - 150, 360, 150, P.wood); D.rect(c, 380, y - 162, 360, 16, P.brownLt);
    D.rr(c, 470, y - 110, 160, 40, 6, "#e8c24a"); D.text(c, "Reception", 550, y - 89, 24, P.ink);
    D.phone(c, 700, y - 162, 0.85, { col: "#2e3440", lifted: o.receiver, t, ring: 0 });
    D.ell(c, 420, y - 168, 16, 8, "#d8d0c0");
    if (o.pen != null) { c.save(); c.translate(lerp(640, 690, o.pen), lerp(y - 175, y + 40, o.pen * o.pen)); c.rotate(o.pen * 4); D.rr(c, -26, -4, 52, 8, 3, "#3a6ab0"); c.restore(); }
  };
  // the whole cutaway: floors 1..5, rooms, stairs, roof, street; st = state for floor 3 + lobby + people
  const hotel = (c, t, st = {}) => {
    DAY = !!st.day;
    // sky behind the roof + street
    D.rect(c, -600, 0, 2400, Y(5) - FH, st.day ? P.skyDay : P.night, null);
    if (!st.day) for (const [sx, sy, r] of stars) D.ell(c, -300 + sx * 1700, sy * (Y(5) - FH - 40), r, r, "#dfe6f5", null);
    D.rect(c, -600, BASE + 16, 2400, 600, "#3a3f4a", null);
    for (let k = -4; k < 10; k++) D.rect(c, k * 220, BASE + 150, 110, 10, "#e8e2d0", null);
    D.rect(c, -600, BASE + 16, 2400, 40, "#9a9ea6", P.ink, 2);
    // structure
    D.rect(c, 0, Y(5) - FH - 40, W, BASE - (Y(5) - FH - 40) + 16, P.slate, null);
    D.rect(c, 120, Y(5) - FH - 100, 160, 60, P.slateLt); D.rect(c, 700, Y(5) - FH - 90, 90, 50, P.slateLt);
    for (let n = 1; n <= 5; n++) {
      if (n === 1) lobby(c, t, st.lobby || {});
      else if (n === 3) { room(c, 3, 0, Object.assign({ t }, st.r305 || {})); room(c, 3, 1, Object.assign({ t }, st.r306 || {})); }
      else { genericRoom(c, n, 0, (st.lit || {})[`${n}05`]); genericRoom(c, n, 1, (st.lit || {})[`${n}06`]); }
      stairs(c, n);
      slab(c, Y(n)); slab(c, Y(n) - FH);
      if (n > 1) D.rect(c, XA1, Y(n) - FH, XB0 - XA1, FH, P.slate, null);
      D.rect(c, XB1, Y(n) - FH, XS0 - XB1, FH, P.slate, null);
    }
    if (st.people) st.people(c);
  };
  // the man / Nadia on the stairs: p in floors from floor 1 (0 = bottom of floor 1, 1 = floor 2 ...)
  const stairPos = (p) => {
    const k = Math.floor(p), f = p - k, y = Y(1 + k);
    if (f < 0.5) { const q = f / 0.5; return { x: lerp(XS0 + 40, XS1 - 50, q), y: lerp(y, y - FH / 2, q), face: 1 }; }
    const q = (f - 0.5) / 0.5; return { x: lerp(XS1 - 50, XS0 + 40, q), y: lerp(y - FH / 2, y - FH, q), face: -1 };
  };
  const counter = (c, txt, a = 1) => D.pill(c, txt, 540, 219, 52, { col: P.amber, a });
  const clockTxt = (t, tA, tB, from, to) => { const m = Math.round(lerp(from, to, ramp(t, tA, tB))); return `1:${String(m).padStart(2, "0")}`; };
  // an x-ray / CCTV frame (corner brackets, label, timestamp) in screen space
  const xray = (c, label, stamp) => {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "color"; c.fillStyle = "rgba(70,190,160,0.62)"; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "source-over"; c.fillStyle = "rgba(10,40,34,0.10)"; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 2);
    for (const [x, y, sx, sy] of [[60, 470, 1, 1], [1020, 470, -1, 1], [60, 1760, 1, -1], [1020, 1760, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 70); c.lineTo(x, y); c.lineTo(x + sx * 70, y); D.st(c, P.white, 6); }
    D.rr(c, 70, 485, 360, 46, 8, "rgba(31,38,51,0.92)", null); D.ell(c, 96, 508, 9, 9, P.red, null); D.text(c, label, 112, 509, 24, P.white, { align: "left" });
    D.rr(c, 700, 1690, 300, 46, 8, "rgba(31,38,51,0.92)", null); D.text(c, stamp, 850, 1714, 24, P.white);
    c.restore();
  };
  // a dashed gold call line from 305's phone to 306's phone (k = drawn fraction)
  const callLine = (c, y, k, t) => {
    if (k <= 0) return;
    const x0 = XA1 - 44, x1 = XB0 + 44, yy = y - 250;
    c.save(); c.setLineDash([16, 12]); c.lineDashOffset = -t * 60;
    c.beginPath(); const N = 30; for (let i = 0; i <= N * k; i++) { const q = i / N; const xx = lerp(x0, x1, q), yv = yy - 110 * 4 * q * (1 - q); i ? c.lineTo(xx, yv) : c.moveTo(xx, yv); }
    D.st(c, P.gold, 7); c.restore();
  };

  // ---------------------------------------------------------------- timing (anchored to the voice)
  const CD_N = 3;                    // the template counts 3; the format counts 10
  const cd0 = Le("r10") - 0.25;
  const T = { o1: 0, o4: L("r04") - 0.25, card: L("r10") - 0.15 };
  const F3 = Y(3);
  const shots = [
    { // hook: rising up the cutaway with the man climbing the stairs (floor counter 1 -> 3)
      t0: T.o1, draw(c, lt, u, t) {
        const p = ramp(t, 0, L("r04") - 0.4, E.io) * 2;
        const pos = stairPos(Math.min(p, 1.999));
        D.cam(c, 540, lerp(Y(1) - 560, F3 - 330, ramp(t, 0.05, L("r04") - 0.3, E.io)), 1.12);
        hotel(c, t, { lit: { "205": 1, "206": 1, "405": 1, "506": 1 }, r305: { bed: { occupied: false } }, r306: { bed: { sit: 0, eyes: "closed" }, dark: 0.3 },
          people: (c) => D.person(c, Object.assign({ x: pos.x, y: pos.y, s: 0.62, f: pos.face, walk: Math.sin(t * 9), carry: "case" }, GUEST)) });
        counter(c, String(Math.min(3, 1 + Math.floor(p + 0.05))));
      } },
    { // the observer: the switchboard lights 305 -> 306, "?" marks
      t0: T.o4, draw(c, lt, u, t) {
        D.cam(c, 600, Y(1) - 175, 2.0 + lt * 0.012);
        const lit = ramp(t, w("r04", "light") - 0.2, w("r04", "light") + 0.2), q = ramp(t, w("r04", "crazy") - 0.5, w("r04", "crazy"));
        hotel(c, t, { lobby: { lit: { "305": lit, "306": lit }, patch: lit, look: 1 - q * 0.5, armL: q > 0.5 ? -2.6 : -0.4, eyes: q > 0.5 ? "wide" : "open", mouth: q > 0.5 ? "o" : "flat", clock: "1:12" } });
        if (q > 0) for (let k = 0; k < 3; k++) D.qmark(c, 500 + k * 44, Y(1) - 290 - Math.abs(Math.sin(t * 5 + k)) * 12, 40, q);
      } },
    { // the countdown card
      t0: T.card, bg: P.cream, draw(c, lt, u, t) { card(c, t); } },
  ];

  // ---------------------------------------------------------------- exterior and card (screen-space drawings)
  function exterior(c, t, o) {
    c.setTransform(o.zoom || 1, 0, 0, o.zoom || 1, 540 - 540 * (o.zoom || 1), 1100 - 1100 * (o.zoom || 1));
    const day = o.day;
    D.rect(c, -100, -100, 1300, 2200, day ? P.skyDay : P.night, null);
    if (!day) { for (const [sx, sy, r] of stars) D.ell(c, sx * 1080, sy * 1100, r, r, "#dfe6f5", null); D.ell(c, 860, 380, 54, 54, "#f6efd2"); }
    else { D.ell(c, 860, 380, 70, 70, "#ffd65a"); for (const [x, y, s] of [[180, 300, 1], [700, 520, 0.8]]) { for (const [dx, dy, r] of [[0, 0, 50], [50, -20, 60], [100, 0, 48]]) D.ell(c, x + dx * s, y + dy * s, r * s, r * 0.8 * s, "#ffffff", null); } }
    D.rect(c, 140, 1150, 120, 600, day ? "#9fb6c8" : "#2f3a58", null); D.rect(c, 860, 1250, 160, 500, day ? "#a9bdcc" : "#344064", null);
    // the hotel facade: 5 floors x 3 window columns, a roof sign
    const bx = 300, bw = 480, top = 760, fh = 190;
    D.rect(c, bx, top, bw, 1750 - top, day ? "#e9dcc0" : "#5a5f7a");
    D.rr(c, bx + 120, top - 90, 240, 70, 8, P.pill); D.text(c, "HOTEL", bx + 240, top - 54, 46, day ? P.white : P.amber);
    for (let f = 0; f < 5; f++) for (let k = 0; k < 3; k++) {
      const fl = 5 - f, x = bx + 40 + k * 150, y = top + 30 + f * fh;
      let lit = !day && ((f * 3 + k) % 4 !== 1);
      if (fl === 3 && k === 1) lit = !day;                         // 305
      if (fl === 3 && k === 2) lit = !day && (o.dark306 || 0) < 0.5; // 306
      if (fl === 1) { continue; }
      D.rect(c, x, y, 110, 120, lit ? "#ffd889" : (day ? P.sky : "#2a3350"));
      D.line(c, x + 55, y, x + 55, y + 120); D.line(c, x, y + 60, x + 110, y + 60);
      if (fl === 3 && k === 2 && !day && o.dark306 > 0.5) { D.rr(c, x + 8, y + 42, 94, 34, 4, P.red, P.ink, 2); D.text(c, "EMPTY", x + 55, y + 60, 20, P.white); }
      if (day && o.move > 0 && fl === 5 && k === 1) { const mx = lerp(x - 40, x + 50, o.move); c.save(); c.beginPath(); c.rect(x, y, 110, 120); c.clip(); D.person(c, Object.assign({ x: mx, y: y + 150, s: 0.28, f: 1, carry: "case", walk: Math.sin(t * 9) }, GUEST)); c.restore(); }
    }
    D.rect(c, bx + 170, 1600, 140, 150, "#9b6a3e"); D.rect(c, bx + 160, 1570, 160, 30, P.amber);
    D.rect(c, -100, 1750, 1300, 400, "#3a3f4a", null); D.rect(c, -100, 1750, 1300, 30, "#9a9ea6", P.ink, 2);
    for (let k = 0; k < 6; k++) D.rect(c, k * 220 - 40, 1880, 110, 10, "#e8e2d0", null);
    for (const x of [120, 960]) { D.rect(c, x - 8, 1620, 16, 130, "#6b4a2e"); D.ell(c, x, 1600, 46, 46, "#5f8f5a"); }
    D.rect(c, 860, 1500, 10, 250, "#2b2f38"); D.ell(c, 865, 1500, 20, 12, day ? "#ddd" : "#ffe6a0", P.ink, 2);
  }
  function card(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    D.rect(c, 0, 0, W, H, P.cream, null);
    // two mini cutaways (the source's "Dry day / Rainy day" bars): "306 booked" vs "306 empty"
    const mini = (x, title, booked) => {
      D.rr(c, x, 300, 380, 560, 16, booked ? "#dfe8f2" : "#c9d0dc", P.ink, 4);
      D.rr(c, x + 40, 280, 300, 56, 10, P.pill, null); D.text(c, title, x + 190, 308, 30, P.white);
      for (let f = 0; f < 4; f++) { const y = 400 + f * 110; D.rect(c, x + 30, y, 320, 100, f === 1 ? (booked ? "#f2e8c8" : "#f2e8c8") : "#eef0f4", P.ink, 3); D.line(c, x + 190, y, x + 190, y + 100, P.ink, 5); }
      const y = 510; // floor 3 row
      D.text(c, "305", x + 110, y + 18, 20, P.ink); D.text(c, "306", x + 270, y + 18, 20, P.ink);
      D.head(c, { x: x + 150, y: y + 66, r: 18, skin: GUEST.skin, hair: "bald", eyes: "closed" });
      if (booked) { D.head(c, { x: x + 232, y: y + 66, r: 20, skin: SNORER.skin, hair: "beard", eyes: "closed", mouth: "snore" });
        c.save(); c.setLineDash([10, 8]); c.beginPath(); c.moveTo(x + 150, y + 40); c.quadraticCurveTo(x + 190, y - 20, x + 232, y + 40); D.st(c, P.gold, 5); c.restore();
        D.text(c, "1 call", x + 190, 880, 30, P.ink); }
      else { D.rect(c, x + 192, y + 2, 156, 96, "rgba(30,38,60,0.45)", null); D.text(c, "no call", x + 190, 880, 30, P.ink); }
    };
    mini(80, "306 booked", true); mini(620, "306 empty", false);
    // ring timer
    const sec = t < cd0 ? 0 : Math.min(CD_N, t - cd0);
    const shown = Math.max(0, CD_N - Math.floor(sec));
    const frac = sec >= CD_N ? 0 : 1 - (sec % 1);
    const pulse = 1 + 0.08 * Math.max(0, 1 - (sec % 1) * 5) * (sec > 0 && sec < CD_N ? 1 : 0);
    c.save(); c.translate(540, 1180); c.scale(pulse, pulse);
    D.ell(c, 0, 0, 110, 110, P.white, P.ink, 4);
    if (shown > 0) { c.beginPath(); c.arc(0, 0, 100, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (t < cd0 ? 1 : frac)); D.st(c, P.red, 14); }
    D.text(c, String(shown), 0, 6, 110, P.ink);
    c.restore();
    const up = ramp(t, L("r11") - 0.25, L("r11") + 0.05, E.back);
    if (up < 0.5) { D.rr(c, 300, 1360, 64, 50, 12, P.amber, P.ink, 3); c.beginPath(); c.moveTo(316, 1406); c.lineTo(308, 1428); c.lineTo(334, 1408); D.fs(c, P.amber); D.text(c, "Comment your answer", 640, 1386, 46, P.ink, { weight: 700 }); }
    else D.pill(c, "Time's up", 540, 1390, 64, { col: P.amber, scale: up });
  }

  return { shots, T, cd0 };
};
