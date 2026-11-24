/* "The Rope" (parable-elephant): learned helplessness told through the elephant-and-stake parable, in the dark-parable
   format. window.DP_FILM(K, V) -> shot list for K.play(). V.L(id) = line {start, end}, V.w(id, word, k) = word start,
   V.we(...) = word end. Every shot is a pure function of time. */
window.DP_FILM = function (K, V) {
  const { D, P, E, ramp, clamp, lerp, rng } = K;
  const L = (id) => V.L(id).start, Le = (id) => V.L(id).end, w = V.w, we = V.we;
  const W = 1080, H = 1920;
  const osc = (t, f, a) => Math.sin(t * Math.PI * 2 * f) * a;

  // ---------------------------------------------------------------- local props
  const tree = (c, x, y, s, rot) => { // line-art tree: trunk + round canopy (rotates about its base)
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
    c.beginPath(); c.moveTo(-14, 0); c.lineTo(-10, -170); c.lineTo(10, -170); c.lineTo(14, 0); D.fs(c, P.bg, P.line, 2.6 / s);
    c.beginPath(); c.moveTo(-6, -120); c.lineTo(-40, -170); c.moveTo(4, -140); c.lineTo(36, -190); D.st(c, P.line, 2.6 / s);
    for (const [cx, cy, r] of [[0, -250, 90], [-70, -200, 60], [70, -205, 62]]) { D.ell(c, cx, cy, r, r * 0.86); D.fs(c, P.bg, P.line, 2.6 / s); }
    c.restore();
  };
  const dust = (c, x, y, k, s = 1) => { // little dust puffs (stroke circles), k 0..1
    if (k <= 0 || k >= 1) return;
    c.save(); c.globalAlpha *= (1 - k) * 0.9;
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + 0.8 * i / 6); D.ell(c, x + Math.cos(a) * 70 * k * s * (i % 2 ? 1.3 : 1), y - Math.sin(a) * 40 * k * s, 9 * s * (1 + k), 7 * s * (1 + k)); D.st(c, P.lineDim, 2); }
    c.restore();
  };
  const scuffs = (c, x, y, n, s = 1) => { // drag marks in the dirt
    const r = rng(17);
    for (let i = 0; i < n; i++) { const xx = x + (r() - 0.3) * 260 * s, yy = y + (r() - 0.5) * 40 * s; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + (40 + r() * 50) * s, yy + (r() - 0.5) * 6); D.st(c, "#3a3632", 2.4); }
  };
  const label = (c, txt, x, y, a = 1, size = 34) => { // the dim mono source tag (our upgrade: the claim's source on screen)
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= a; c.font = `500 ${size}px "DPMono", monospace`; c.textAlign = "center"; c.fillStyle = "#97928a";
    c.fillText(txt, x, y); c.restore();
  };
  const box = (c, x, y, wd, ht, o = {}) => { // shuttle box (front view): two chambers, optional barrier, shock zigzags
    c.save(); c.translate(x, y);
    D.rr(c, -wd / 2, -ht, wd, ht, 6); D.fs(c, "#121213", P.line, 2.6);
    c.beginPath(); c.moveTo(-wd / 2, -ht * 0.84); c.lineTo(wd / 2, -ht * 0.84); D.st(c, P.lineDim, 1.6);
    if (o.wall) { c.beginPath(); c.moveTo(0, -ht); c.lineTo(0, 0); D.st(c, P.line, 3.2); }
    if (o.barrier) { D.rr(c, -8, -ht * o.barrier, 16, ht * o.barrier, 3); D.fs(c, "#121213", P.line, 2.6); }
    if (o.shock) { // zigzags on the left floor, flicker with t
      c.save(); c.globalAlpha *= o.shock;
      const nz = o.full ? 9 : 4, span = o.full ? wd - 48 : wd / 2 - 40;
      for (let k = 0; k < nz; k++) { const x0 = -wd / 2 + 24 + k * span / nz; c.beginPath(); c.moveTo(x0, -10); c.lineTo(x0 + 10, -26); c.lineTo(x0 + 18, -12); c.lineTo(x0 + 28, -30); D.st(c, "#cfc6b4", 2.2); }
      c.restore();
    }
    c.restore();
  };
  const desk = (c, x, y, s = 1, o = {}) => { // line-art school desk / office desk
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-90, -120); c.lineTo(90, -120); c.moveTo(-80, -120); c.lineTo(-80, 0); c.moveTo(80, -120); c.lineTo(80, 0); D.st(c, o.col || P.line, 2.6 / s);
    if (o.monitor) { D.rr(c, -40, -200, 80, 60, 4); D.st(c, o.col || P.line, 2.6 / s); c.beginPath(); c.moveTo(0, -140); c.lineTo(0, -120); D.st(c, o.col || P.line, 2.6 / s); }
    if (o.paper) { c.save(); c.translate(20, -126); c.rotate(-0.08); D.rr(c, -26, -8, 52, 8, 1); D.fs(c, P.bg, P.line, 2 / s); c.restore(); }
    c.restore();
  };
  const bigFoot = (c, x, y, s, lift, col) => { // giant elephant legs seen low (the scale shot): far leg, belly, near leg
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-260, -2600); c.lineTo(-250, -1200); c.quadraticCurveTo(80, -1080, 560, -1150); c.lineTo(600, -2600); c.closePath(); D.fs(c, P.eleDk, P.line, 2.6 / s);
    c.beginPath(); c.moveTo(260, -1180); c.lineTo(270, -40); c.quadraticCurveTo(262, 2, 300, 4); c.lineTo(470, 4); c.quadraticCurveTo(505, 2, 498, -40); c.lineTo(520, -1170); D.fs(c, P.eleDk, P.line, 2.6 / s);
    c.beginPath(); c.moveTo(-250, -1200); c.quadraticCurveTo(80, -1080, 560, -1150); D.st(c, P.line, 2.6 / s);
    c.restore();
    c.save(); c.translate(x, y - lift); c.scale(s, s);
    c.beginPath(); c.moveTo(-150, -2600); c.lineTo(-140, -60); c.quadraticCurveTo(-150, 0, -110, 4); c.lineTo(110, 4); c.quadraticCurveTo(150, 0, 140, -60); c.lineTo(150, -2600); c.closePath();
    D.fs(c, col || P.ele, P.line, 2.6 / s);
    for (const nx of [-80, -10, 60]) { D.ell(c, nx, -6, 26, 16); D.fs(c, P.nail, P.line, 1.6 / s); }
    for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-120 + (k % 2) * 30, -200 - k * 120); c.quadraticCurveTo(0, -180 - k * 120, 110 - (k % 2) * 30, -205 - k * 120); D.st(c, P.eleDk, 2.2 / s); }
    c.restore();
  };
  const headProfile = (c, x, y, s, glowK, a = 1) => { // line-art head in profile with a lamp inside
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= a;
    c.beginPath(); c.moveTo(-60, 260); c.lineTo(-60, 140); c.bezierCurveTo(-200, 90, -190, -230, 10, -240); c.bezierCurveTo(170, -245, 210, -100, 170, -10);
    c.lineTo(205, 50); c.lineTo(170, 62); c.bezierCurveTo(175, 120, 160, 150, 90, 145); c.lineTo(90, 260); D.st(c, P.line, 2.6 / s);
    c.restore();
  };
  const boss = (c, x, y, s) => { // a giant navy-suited figure, cropped by the frame (the modern power figure)
    c.save(); c.translate(x, y); c.scale(s, s);
    for (const lx of [-34, 8]) { D.rr(c, lx, -230, 30, 230, 6); D.fs(c, P.suit, P.line, 2.6 / s); D.rr(c, lx - 4, -10, 40, 14, 5); D.fs(c, P.shoe, P.line, 2.6 / s); }
    D.rr(c, -62, -560, 124, 340, 14); D.fs(c, P.suit, P.line, 2.6 / s);
    c.beginPath(); c.moveTo(0, -560); c.lineTo(-16, -470); c.lineTo(0, -380); c.lineTo(16, -470); c.closePath(); D.fs(c, "#141a26", P.line, 2 / s);
    for (const sx of [-1, 1]) { c.save(); c.translate(sx * 66, -540); c.rotate(sx * 0.06); D.rr(c, -15, 0, 30, 250, 13); D.fs(c, P.suit, P.line, 2.6 / s); D.ell(c, 0, 260, 15, 18); D.fs(c, P.skin, P.line, 2.6 / s); c.restore(); }
    D.ell(c, 0, -620, 46, 50); D.fs(c, P.skin, P.line, 2.6 / s);
    c.restore();
  };
  const groundLine = (c, y, a = 1) => { c.save(); c.globalAlpha *= a; c.beginPath(); c.moveTo(-200, y); c.lineTo(1300, y); D.st(c, "#2a2a2c", 2); c.restore(); };

  // ---------------------------------------------------------------- shot timing (anchored to the voice)
  const T = {
    s01: 0,
    s02: w("p01", "baby") - 0.25,
    s03: L("p02") - 0.15,
    s04: L("p05") - 0.12,
    s05: L("p06") - 0.15,
    s06: L("p07") - 0.15,
    s07: L("p08") - 0.2,
    s08: L("p09") - 0.25,
    s08b: w("p09", "three") - 0.12,
    s09: L("p11") - 0.2,
    s10: L("p13") - 0.15,
    s11: L("p14") - 0.15,
    s12: L("p15") - 0.2,
    s13: L("p16") - 0.2,
    s14: L("p17") - 0.3,
    s15: L("p18") - 0.2,
    s16: L("p19") - 0.12,
    s17: L("p20") - 0.12,
    s18: L("p21") - 0.15,
    s19a: L("p22") - 0.2,
    s19b: w("p22", "classrooms") + 0.42,
    s19c: w("p22", "home") - 0.2,
    s20: L("p23") - 0.15,
    s21: L("p24") - 0.12,
    s22: L("p25") - 0.2,
    s23: L("p26") - 0.12,
    s24: L("p27") - 0.25,
    s25: L("p28") - 0.15,
    s26: L("p28") + 1.3,
  };

  // the baby elephant + stake used in the opening shots (stake at sx, elephant facing right, rope to the near hind leg)
  const babyScene = (c, t, o) => {
    const e = D.elephant(c, Object.assign({ baby: 1, eye: "open" }, o.ele));
    D.stake(c, o.sx, o.sy, o.sh || 120, { below: 0 });
    D.rope(c, o.sx + 4, o.sy - (o.sh || 120) * 0.75, e.back.x, e.back.y, { taut: o.taut == null ? 1 : o.taut, sag: o.sag || 40, w: o.rw || 5 });
    return e;
  };

  const shots = [
    { // S01 hook: the hand from above drives the stake in; the rope is tied to the baby elephant (frame 1 = a still)
      t0: T.s01, draw(c, lt) {
        D.grid(c, 1180, 540, 1); D.camp(c, 1180, 0.8);
        D.push(c, 540, 1400, 1 + lt * 0.0288);
        const drive = ramp(lt, 0.0, 1.2, E.o), sy = 1600, sx = 250;
        const e = D.elephant(c, { x: 640, y: 1640, s: 2.05, baby: 1, eye: "open", trunk: 0.15, head: osc(lt, 0.4, 0.03) });
        const sh = lerp(300, 200, drive);
        D.stake(c, sx, sy, sh, { below: 30, lw: 3 });
        const tie = ramp(lt, 0.25, 1.4, E.io);
        const ax = lerp(sx + 10, e.back.x, tie), ay = lerp(sy - 150, e.back.y, tie);
        D.rope(c, sx + 8, sy - 150, ax, ay, { sag: 70, taut: 0.2, w: 7, blur: 20 });
        D.handDown(c, sx, sy - sh - 40 - ramp(lt, 1.5, 2.4, E.io) * 1100, 1.45);
      } },
    { // S02 the camp wide: one-point perspective, the trainer in the centre, workers on both sides
      t0: T.s02, xf: 0.45, draw(c, lt) {
        D.grid(c, 1100, 540, 1); D.camp(c, 1100, 1);
        D.push(c, 540, 1200, 1 + lt * 0.048);
        for (let i = 0; i < 4; i++) { // two rows of workers receding to the vanishing point
          const k = 1 - i * 0.2, y = 1100 + 380 * k * k;
          for (const sd of [-1, 1]) D.person(c, { x: 540 + sd * (170 + 260 * k * k), y, s: 0.75 * k * k + 0.15, f: -sd, wrap: i % 2 });
        }
        D.trainer(c, { x: 470, y: 1390, s: 0.62 });
        const e = D.elephant(c, { x: 640, y: 1395, s: 0.42, baby: 1, eye: "open" });
        D.stake(c, 560, 1400, 34, { lw: 1.8 }); D.rope(c, 561, 1374, e.back.x, e.back.y, { taut: 0.6, sag: 10, w: 2.6, blur: 8 });
      } },
    { // S03 she pulled / she cried / until her leg ached (medium, the rope taut)
      t0: T.s03, draw(c, lt, u, t) {
        D.grid(c, 1180, 540, 1); D.camp(c, 1180, 0.6);
        D.push(c, 560, 1450, 1.16 + lt * 0.036);
        const cry = ramp(t, w("p03", "cried") - 0.2, w("p03", "cried") + 0.25, E.o) * (1 - ramp(t, L("p04") - 0.1, L("p04") + 0.3));
        const ache = ramp(t, L("p04"), Le("p04"), E.io);
        const tug = 0.5 + 0.5 * Math.sin(lt * 5.2);
        const lean = 0.35 + 0.65 * Math.max(tug * (1 - cry), ache);
        const e = babyScene(c, t, { sx: 150, sy: 1530, sh: 130, ele: { x: 545 + lean * 18, y: 1560, s: 1.55, lean, trunk: cry * 1.0, eye: cry > 0.3 ? "wide" : ache > 0.3 ? "sad" : "open", head: -cry * 0.25 } });
        if (cry > 0.05) { c.save(); c.globalAlpha *= cry; for (let k = 0; k < 3; k++) { c.beginPath(); const a = -0.9 + k * 0.35; c.moveTo(e.head.x + 180 + Math.cos(a) * 40, e.head.y - 160 + Math.sin(a) * 40); c.lineTo(e.head.x + 180 + Math.cos(a) * 80, e.head.y - 160 + Math.sin(a) * 80); D.st(c, P.line, 3); } c.restore(); }
        scuffs(c, 600, 1590, Math.floor(4 + ache * 8), 1);
        dust(c, e.back.x - 20, 1560, (lt * 5.2 / (2 * Math.PI)) % 1, 1.1);
      } },
    { // S04 the stake didn't move (close-up: rope trembles, stake still)
      t0: T.s04, draw(c, lt) {
        D.grid(c, 1050, 540, 0.8);
        D.push(c, 540, 1350, 1.0 + lt * 0.048);
        D.stake(c, 470, 1450, 330, { below: 0, lw: 3.2 });
        const tr = osc(lt, 7, 4);
        D.rope(c, 482, 1450 - 250, 1180, 1330 + tr, { taut: 1, w: 9, blur: 22 });
        groundLine(c, 1452);
        scuffs(c, 700, 1500, 9, 1.4);
      } },
    { // S05 the whole camp watched, nobody helped (a row of faces, slow pan)
      t0: T.s05, draw(c, lt) {
        c.save(); c.globalAlpha = 0.5; for (const x of [120, 400, 680, 960]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); D.st(c, P.arch, 3); } c.restore();
        const x0 = -lt * 62;
        for (let i = 0; i < 9; i++) D.person(c, { x: 60 + x0 + i * 170, y: 1290, s: 1.15, pose: "bust", look: 2, wrap: (i * 7) % 3 === 0 });
        for (let i = 0; i < 9; i++) D.person(c, { x: -25 + x0 * 0.7 + i * 170, y: 1600, s: 1.15, pose: "bust", look: 2, wrap: (i * 5) % 4 === 0 });
      } },
    { // S06 day after day, the rope won (time-lapse: the sun arcs over twice, a moon, scuffs pile up)
      t0: T.s06, draw(c, lt, u) {
        D.grid(c, 1260, 540, 1);
        const days = u * 2.2;
        for (let d = 0; d < 3; d++) {
          const ph = days - d; if (ph < 0 || ph > 1) continue;
          const a = Math.PI * (1 - ph), sx = 540 + Math.cos(a) * 470, sy = 1250 - Math.sin(a) * 640;
          D.ell(c, sx, sy, 46, 46); D.fs(c, d === 1 ? null : "#1a1a1b", P.lineDim, 2.4);
          if (d === 1) { c.beginPath(); c.arc(sx + 14, sy - 8, 40, 0, Math.PI * 2); c.fillStyle = P.bg; c.fill(); }
        }
        const pull = Math.max(0, Math.sin(lt * 7));
        const e = babyScene(c, 0, { sx: 420, sy: 1440, sh: 60, rw: 3.4, ele: { x: 640 + pull * 8, y: 1460, s: 0.75, lean: pull, eye: "open" } });
        scuffs(c, 560, 1475, Math.floor(3 + u * 18), 0.6);
      } },
    { // S07 then one morning, she stopped pulling (tiny in the dark, rope slack)
      t0: T.s07, draw(c, lt, u, t) {
        D.grid(c, 1180, 540, 0.7);
        D.push(c, 560, 1330, 1 + lt * 0.085);
        const stop = ramp(t, w("p08", "stopped") - 0.2, w("p08", "stopped") + 0.6, E.io);
        babyScene(c, t, { sx: 470, sy: 1340, sh: 38, rw: 2.6, taut: 1 - stop, sag: 26, ele: { x: 600, y: 1352, s: 0.42, lean: 0.6 * (1 - stop), eye: stop > 0.5 ? "sad" : "open", head: stop * 0.18, trunk: 0 } });
        scuffs(c, 560, 1362, 12, 0.3);
      } },
    { // S08 years went by: she grows (the stake does not)
      t0: T.s08, xf: 0.4, draw(c, lt, u, t) {
        D.grid(c, 1240, 540, 1);
        const g = ramp(t, L("p09"), w("p09", "three"), E.io);
        D.push(c, 540, 1500, lerp(1.05, 0.92, g));
        const e = D.elephant(c, { x: lerp(640, 690, g), y: 1520, s: lerp(0.8, 1.9, g), baby: 1 - g, eye: "open", trunk: 0.1 });
        D.stake(c, 300, 1525, 70, { below: 0 });
        D.rope(c, 304, 1470, e.back.x, e.back.y, { taut: 0, sag: 30 + g * 10, w: 4 });
      } },
    { // S08b three tons, strong enough to push over a tree (low angle, giant)
      t0: T.s08b, draw(c, lt, u, t) {
        D.grid(c, 1580, 540, 1);
        const push = ramp(t, w("p10", "push") - 0.1, w("p10", "tree") + 0.4, E.io);
        D.push(c, 540, 1700, 1.0 + lt * 0.024);
        D.elephant(c, { x: 1060 - push * 60, y: 1760, s: 3.4, f: -1, baby: 0, trunk: 0.45 + push * 0.35, lean: push * 0.5, eye: "open", head: 0.05 });
        tree(c, 400, 1740, 1.3, -push * 0.62);
        dust(c, 220, 1740, ramp(t, w("p10", "tree") + 0.4, w("p10", "tree") + 1.6), 2);
      } },
    { // S09 but she still stood beside that same small stake, on the same thin rope (tilt down the giant leg)
      t0: T.s09, draw(c, lt, u, t) {
        const tilt = ramp(t, T.s09, w("p11", "stake") + 0.3, E.io);
        c.save(); c.setTransform(1, 0, 0, 1, 0, lerp(-700, 0, tilt));
        D.grid(c, 1450 + lerp(700, 0, tilt), 540, 1);
        c.restore();
        c.setTransform(1, 0, 0, 1, 0, lerp(-700, 0, tilt));
        bigFoot(c, 760, 1640, 1.05, 0);
        D.stake(c, 330, 1650, 64, { below: 0, lw: 2.2 });
        D.rope(c, 333, 1606, 640, 1620, { taut: 0, sag: 24, w: 4, blur: 14 });
        groundLine(c, 1652, 0.8);
      } },
    { // S10 one step would have pulled it out (a dashed ghost of the stake rising)
      t0: T.s10, draw(c, lt, u, t) {
        D.grid(c, 1100, 540, 0.7);
        D.push(c, 540, 1350, 1 + lt * 0.048);
        D.stake(c, 540, 1460, 220, { below: 0, lw: 3 });
        D.rope(c, 548, 1300, 1150, 1350, { taut: 0, sag: 40, w: 7, blur: 18 });
        groundLine(c, 1462);
        const g = ramp(t, w("p13", "pulled") - 0.2, w("p13", "ground") + 0.2, E.io) * (1 - ramp(t, Le("p13"), Le("p13") + 0.5));
        if (g > 0.01) { // ghost: dashed outline of the stake lifted out, with its buried point, + an arrow
          c.save(); c.globalAlpha *= g; c.setLineDash([12, 12]);
          c.save(); c.translate(540 + g * 60, 1460 - g * 330); c.rotate(g * 0.5);
          c.beginPath(); c.moveTo(-18, 0); c.lineTo(-18, -220); c.lineTo(18, -220); c.lineTo(18, 0); c.lineTo(0, 60); c.closePath(); D.st(c, P.line, 2.4); c.restore();
          c.beginPath(); c.moveTo(640, 1380); c.quadraticCurveTo(700, 1200, 640, 1080); D.st(c, P.lineDim, 2.4);
          c.setLineDash([]); c.restore();
        }
      } },
    { // S11 she never took it (the grown elephant standing still, head low)
      t0: T.s11, draw(c, lt) {
        D.grid(c, 1260, 540, 1);
        D.push(c, 560, 1420, 1 + lt * 0.072);
        const e = D.elephant(c, { x: 640, y: 1600, s: 1.55, baby: 0, eye: "sad", head: 0.14, trunk: 0 });
        D.stake(c, 210, 1605, 48, { below: 0, lw: 2 });
        D.rope(c, 212, 1572, e.back.x, e.back.y, { taut: 0, sag: 22, w: 3.4 });
      } },
    { // S12 a traveller asked how a rope could hold her
      t0: T.s12, draw(c, lt) {
        D.grid(c, 1300, 540, 1); D.camp(c, 1300, 0.6);
        D.push(c, 540, 1500, 1 + lt * 0.036);
        c.save(); c.globalAlpha = 0.45; D.elephant(c, { x: 330, y: 1330, s: 1.0, f: 1, eye: "sad", head: 0.12 }); c.restore();
        D.person(c, { x: 230, y: 1660, s: 1.0, pack: 1, stick: 1, arm: -0.5 + osc(lt, 0.8, 0.08) });
        D.trainer(c, { x: 800, y: 2150, s: 3.1, view: "profile", f: -1 });
      } },
    { // S13 the trainer smiled: "I don't hold her. Her memory does." (low angle, halo; a ghost of the baby pulling)
      t0: T.s13, draw(c, lt, u, t) {
        D.grid(c, 1820, 540, 0.8);
        const mem = ramp(t, w("p16", "memory") - 0.3, w("p16", "memory") + 0.6, E.io);
        if (mem > 0) { c.save(); c.globalAlpha = 0.28 * mem; D.elephant(c, { x: 760, y: 1500, s: 1.2, baby: 1, lean: 0.8 + osc(lt, 0.9, 0.2), eye: "wide", trunk: 0.8 }); D.stake(c, 360, 1490, 90); c.restore(); }
        D.push(c, 540, 1920, 1 + lt * 0.048);
        D.trainer(c, { x: 540, y: 2170, s: 3.0, halo: 1, arm: 0, smile: 1 });
        c.save(); c.translate(540, 2170); c.scale(3, 3); c.beginPath(); c.arc(0, -292, 14, 0.15 * Math.PI, 0.85 * Math.PI); D.st(c, "#5a3a2e", 1.1); c.restore();
      } },
    { // S14 psychologists call it learned helplessness (the trainer drains to black; the elephant and the gold rope stay)
      t0: T.s14, xf: 0.55, draw(c, lt, u, t) {
        D.grid(c, 1300, 540, 0.8);
        D.push(c, 600, 1500, 1 + lt * 0.048);
        const k = ramp(t, L("p17"), w("p17", "learned"), E.io);
        const coat = `rgb(${Math.round(lerp(78, 10, k))},${Math.round(lerp(26, 9, k))},${Math.round(lerp(32, 10, k))})`;
        const hat = `rgb(${Math.round(lerp(139, 14, k))},${Math.round(lerp(144, 14, k))},${Math.round(lerp(150, 15, k))})`;
        const skin = `rgb(${Math.round(lerp(184, 12, k))},${Math.round(lerp(130, 11, k))},${Math.round(lerp(106, 11, k))})`;
        c.save(); D.trainer(c, { x: 230, y: 1700, s: 1.75, coat, hat, skin, view: "profile" }); c.restore();
        const e = D.elephant(c, { x: 720, y: 1700, s: 1.75, f: 1, eye: ramp(t, w("p17", "helplessness") - 0.1, w("p17", "helplessness") + 0.2) > 0.5 ? "closed" : "sad", head: 0.14 });
        D.stake(c, 420, 1705, 52, { below: 0, lw: 2 });
        D.rope(c, 422, 1670, e.back.x, e.back.y, { taut: 0, sag: 18, w: 3.6 });
      } },
    { // S15 1967: dogs given shocks they could not stop (closed box, zigzags)
      t0: T.s15, draw(c, lt, u, t) {
        label(c, "SELIGMAN & MAIER, 1967", 540, 360, ramp(t, T.s15, T.s15 + 0.5));
        D.push(c, 540, 1300, 1 + lt * 0.0288);
        box(c, 540, 1500, 760, 420, { shock: Math.floor(lt * 6) % 2 ? 1 : 0.35, full: true });
        D.dog(c, { x: 520, y: 1470, s: 1.05 });
      } },
    { // S16 later, one jump over a barrier would have ended them (shuttle box + dashed jump arc)
      t0: T.s16, draw(c, lt, u, t) {
        label(c, "SHUTTLE BOX", 540, 360, 1);
        D.push(c, 540, 1300, 1.02 + lt * 0.0288);
        box(c, 540, 1500, 760, 420, { barrier: 0.28, shock: Math.floor(lt * 6) % 2 ? 1 : 0.35 });
        D.dog(c, { x: 340, y: 1470, s: 0.95 });
        const d = ramp(t, w("p19", "jump") - 0.15, w("p19", "barrier") + 0.3, E.io);
        if (d > 0) { c.save(); c.setLineDash([14, 12]); c.beginPath();
          const N = 30; for (let i = 0; i <= N * d; i++) { const q = i / N, x = lerp(440, 700, q), y = 1400 - Math.sin(q * Math.PI) * 300; i ? c.lineTo(x, y) : c.moveTo(x, y); }
          D.st(c, P.gold, 4); c.setLineDash([]); c.restore(); }
      } },
    { // S17 most of the dogs didn't even try (three boxes: two dogs lie down, one jumped)
      t0: T.s17, draw(c, lt, u, t) {
        label(c, "MOST DID NOT TRY", 540, 360, 1);
        const lie = ramp(t, w("p20", "didn't") - 0.3, w("p20", "try") + 0.2, E.io);
        D.push(c, 540, 1400, 1 + lt * 0.024);
        for (let k = 0; k < 3; k++) {
          const y = 1180 + k * 300, sh = Math.floor(lt * 6 + k) % 2 ? 0.9 : 0.3;
          box(c, 540, y, 600, 250, { barrier: 0.3, shock: sh });
          if (k === 1) D.dog(c, { x: 680, y: y - 20, s: 0.6 });
          else if (lie > 0.5) D.dog(c, { x: 380, y: y - 10, s: 0.6, pose: "lie" });
          else D.dog(c, { x: 380, y: y - 20, s: 0.6 });
        }
      } },
    { // S18 pain had taught them one rule: nothing I do matters (close: the dog lying, an invisible rope appears)
      t0: T.s18, draw(c, lt, u, t) {
        D.grid(c, 1200, 540, 0.6);
        D.push(c, 540, 1350, 1 + lt * 0.072);
        D.dog(c, { x: 480, y: 1420, s: 2.2, pose: "lie" });
        const r = ramp(t, w("p21", "nothing") - 0.2, w("p21", "matters") + 0.2, E.io);
        if (r > 0) { c.save(); c.globalAlpha *= r; D.stake(c, 180, 1440, 60, { below: 0, lw: 2 }); D.rope(c, 183, 1400, lerp(183, 380, r), 1400, { taut: 0, sag: 24, w: 4 }); c.restore(); }
        groundLine(c, 1442, 0.7);
      } },
    { // S19a/b/c classrooms, at work, at home (three quick line-art rooms)
      t0: T.s19a, xf: 0.35, draw(c, lt) {
        D.grid(c, 1060, 540, 0.8);
        D.push(c, 540, 1300, 1 + lt * 0.072);
        D.rr(c, 300, 980, 480, 200, 6); D.fs(c, "#141615", P.line, 2.6);
        c.beginPath(); c.moveTo(340, 1040); c.lineTo(520, 1040); c.moveTo(340, 1090); c.lineTo(600, 1090); D.st(c, P.lineDim, 2.2);
        for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) desk(c, 260 + k * 280 - r * 30 + r * 30, 1420 + r * 170, 0.7 + r * 0.12);
      } },
    { t0: T.s19b, draw(c, lt) {
        D.grid(c, 1060, 540, 0.8);
        D.push(c, 540, 1300, 1 + lt * 0.072);
        for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) desk(c, 330 + k * 420, 1360 + r * 190, 0.75 + r * 0.12, { monitor: true });
        boss(c, 540, 1240, 0.95);
      } },
    { t0: T.s19c, draw(c, lt) {
        D.grid(c, 1200, 540, 0.6);
        D.push(c, 540, 1300, 1 + lt * 0.072);
        c.beginPath(); c.moveTo(160, 1200); c.lineTo(160, 760); c.lineTo(540, 520); c.lineTo(920, 760); c.lineTo(920, 1200); D.st(c, P.line, 2.6);
        D.rr(c, 620, 820, 160, 140, 4); D.st(c, P.line, 2.4); c.beginPath(); c.moveTo(700, 820); c.lineTo(700, 960); c.moveTo(620, 890); c.lineTo(780, 890); D.st(c, P.line, 2);
        D.rr(c, 250, 960, 120, 240, 4); D.st(c, P.line, 2.4);
        D.person(c, { x: 480, y: 1520, s: 0.95, slump: 0.6 }); D.person(c, { x: 700, y: 1520, s: 1.25, col: P.lineDim });
      } },
    { // S20 the kid who failed once and stopped raising her hand (the gold thread pulls the hand down)
      t0: T.s20, draw(c, lt, u, t) {
        D.grid(c, 1180, 540, 0.7);
        D.push(c, 540, 1420, 1 + lt * 0.048);
        const raise = ramp(t, w("p23", "failed") - 0.6, w("p23", "failed"), E.o) * (1 - ramp(t, w("p23", "stopped"), w("p23", "hand"), E.io));
        desk(c, 620, 1600, 1.4, { paper: true });
        c.save(); c.translate(648, 1424); c.rotate(-0.08); c.beginPath(); c.moveTo(-14, -10); c.lineTo(10, 6); c.moveTo(10, -10); c.lineTo(-14, 6); D.st(c, P.line, 2.4); c.restore();
        D.person(c, { x: 470, y: 1600, s: 1.25, pose: "sit", arm: lerp(0.5, -2.9, raise), slump: (1 - raise) * 0.35 });
        const th = ramp(t, w("p23", "stopped"), w("p23", "hand") + 0.2, E.io);
        if (th > 0) { c.save(); c.globalAlpha *= th; D.stake(c, 300, 1610, 34, { below: 0, lw: 1.8 }); D.rope(c, 302, 1588, 500, 1430, { taut: 0, sag: 30, w: 3 }); c.restore(); }
      } },
    { // S21 the worker who stopped speaking up (the speech bubble shrinks away)
      t0: T.s21, draw(c, lt, u, t) {
        D.grid(c, 1180, 540, 0.7);
        D.push(c, 540, 1420, 1 + lt * 0.048);
        c.beginPath(); c.moveTo(120, 1500); c.lineTo(960, 1500); c.moveTo(160, 1500); c.lineTo(160, 1640); c.moveTo(920, 1500); c.lineTo(920, 1640); D.st(c, P.line, 2.6);
        boss(c, 1010, 1660, 2.6);
        for (const [x, s] of [[230, 0.9], [420, 0.9], [830, 0.9]]) D.person(c, { x, y: 1520, s, col: P.lineDim, pose: "bust" });
        D.person(c, { x: 640, y: 1520, s: 0.95, pose: "bust", look: 4 });
        const b = 1 - ramp(t, w("p24", "stopped"), w("p24", "up") + 0.1, E.io);
        if (b > 0.02) { c.save(); c.translate(720, 1290); c.scale(b, b); D.rr(c, -10, -110, 220, 110, 30); D.fs(c, P.bg, P.line, 2.6 / Math.max(b, 0.2)); c.beginPath(); c.moveTo(20, 0); c.lineTo(0, 30); c.lineTo(50, 0); D.fs(c, P.bg, P.line, 2.6);
          for (let k = 0; k < 3; k++) { D.ell(c, 50 + k * 50, -55, 9, 9); D.fs(c, P.line, null); } c.restore(); }
        const th = ramp(t, w("p24", "speaking") - 0.1, Le("p24") + 0.3, E.io);
        if (th > 0) { c.save(); c.globalAlpha *= th; D.stake(c, 560, 1660, 34, { below: 0, lw: 1.8 }); D.rope(c, 562, 1638, 640, 1560, { taut: 0, sag: 20, w: 3 }); c.restore(); }
      } },
    { // S22 half a century later, the same scientists found the twist (the year rolls 1967 -> 2016)
      t0: T.s22, draw(c, lt, u, t) {
        const yr = Math.round(lerp(1967, 2016, ramp(t, L("p25"), w("p25", "later") + 0.4, E.io)));
        label(c, `MAIER & SELIGMAN, ${yr}`, 540, 360, 1);
        D.push(c, 540, 1300, 1 + lt * 0.048);
        headProfile(c, 540, 1360, 1.5, 0, ramp(lt, 0, 0.4));
        D.person(c, { x: 520, y: 1330, s: 0.75, slump: 0.8, col: P.lineDim });
      } },
    { // S23 giving up is the default; control is what we learn (a gold lamp turns on, the little figure stands up)
      t0: T.s23, draw(c, lt, u, t) {
        label(c, "LEARNED HELPLESSNESS AT FIFTY, 2016", 540, 360, 1, 30);
        D.push(c, 540, 1300, 1.03 + lt * 0.036);
        headProfile(c, 540, 1360, 1.5, 0, 1);
        const k = ramp(t, w("p26", "control") - 0.1, w("p26", "learn") + 0.2, E.io);
        if (k > 0) { c.save(); c.globalAlpha *= k; D.radial(c, 560, 1050, 230, "242,182,48", 0.32); D.glow(c, "rgba(242,182,48,0.9)", 24); D.ell(c, 560, 1050, 26, 26); D.fs(c, P.gold, P.goldHi, 3); D.noglow(c); c.restore(); }
        D.person(c, { x: 520, y: 1330, s: 0.75, slump: lerp(0.8, 0, k), col: k > 0.5 ? P.line : P.lineDim, arm: lerp(0.12, -2.6, k) });
      } },
    { // S24 so before you stop pulling, look at the stake (back to the giant leg; push in to the stake)
      t0: T.s24, xf: 0.5, draw(c, lt, u, t) {
        D.grid(c, 1450, 540, 1);
        const p = ramp(t, w("p27", "look") - 0.4, Le("p27") + 0.3, E.io);
        D.push(c, 360, 1620, lerp(1.0, 1.55, p));
        bigFoot(c, 760, 1640, 1.05, 0);
        D.stake(c, 330, 1650, 64, { below: 0, lw: 2.2 });
        D.rope(c, 333, 1606, 640, 1620, { taut: 0, sag: 24, w: 4, blur: 14 });
        groundLine(c, 1652, 0.8);
      } },
    { // S25 it's smaller than you remember: the foot lifts, the stake pops out and tips over; hold (callback image)
      t0: T.s25, draw(c, lt, u, t) {
        D.grid(c, 1450, 540, 1);
        const lift = ramp(t, L("p28"), L("p28") + 0.9, E.io);
        const pop = ramp(t, L("p28") + 0.55, L("p28") + 1.2, E.o);
        const fall = ramp(t, L("p28") + 0.9, L("p28") + 1.8, E.i);
        D.push(c, 420, 1600, lerp(1.4, 1.25, ramp(lt, 0, 3, E.io)));
        bigFoot(c, 760 + lift * 120, 1640, 1.05, lift * 160);
        D.stake(c, 330 + pop * 40, 1650 - pop * 70 + fall * 58, 64, { below: 26, lw: 2.2, tilt: fall * 1.45 });
        D.rope(c, 333 + pop * 40 + fall * 30, 1606 - pop * 50 + fall * 40, 640 + lift * 120, 1620 - lift * 160, { taut: 0, sag: 30 + fall * 40, w: 4, blur: 14 });
        c.save(); c.globalAlpha *= pop; D.ell(c, 330, 1652, 22, 7); D.fs(c, "#060606", "#2a2a2c", 2); c.restore();
        dust(c, 360, 1650, ramp(t, L("p28") + 0.6, L("p28") + 1.8), 1.2);
        groundLine(c, 1652, 0.8);
      } },
    { // S26 the callback image: the stake lies loose in the foreground, the gold rope trails off to her, she walks away
      t0: T.s26, draw(c, lt) {
        D.grid(c, 1180, 540, 1); D.camp(c, 1180, 0.5);
        D.push(c, 420, 1560, 1 + lt * 0.084);
        const step = lt * 1.3, ex = 700 + lt * 26;
        const e = D.elephant(c, { x: ex, y: 1265, s: 0.55, baby: 0, eye: "open", trunk: 0.25, leg: 0.5 + 0.5 * Math.sin(step * 3.1), head: -0.04 });
        D.stake(c, 300, 1640, 120, { below: 50, lw: 2.8, tilt: -1.42 });
        D.rope(c, 330, 1615, e.back.x, e.back.y, { taut: 0, sag: 60, w: 5, blur: 18 });
        c.save(); c.globalAlpha *= 0.9; D.ell(c, 360, 1662, 40, 10); D.fs(c, "#070707", "#2a2a2c", 2); c.restore();
      } },
  ];
  return { shots, T };
};
