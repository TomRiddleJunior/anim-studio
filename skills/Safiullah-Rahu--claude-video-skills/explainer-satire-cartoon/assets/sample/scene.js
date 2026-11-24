/* "The Pothole Calendar" — an original satire-cartoon reel (vertical 1080×1920, 30 fps).
 * Fictional town (Port Fennick), fictional people (Mayor Bunbury, Gus of Smoothly Paving, the viewer in slippers).
 * Beat map of the formula (own wording and staging): ribbon-cutting claim → the object → "So why…?" → motive → name
 * for it → the deal → the slogan → consequence for the viewer (counters leap) → the switch-on before the vote → win
 * → promise → callback (the tarp goes back on; your pothole is re-elected too).
 * Every visual change sits on a word from data/vo.json; hard cuts land ~2 frames before the sentence. */
X.boot(async (X) => {
  await X.loadVO();
  K.init(X);
  const C = K.C, W = (id, w, n = 0) => X.word(id, w, n), LS = (id) => X.line(id).start;
  const cut = (id) => LS(id) - 0.07;
  const END = X.vo.duration + 0.45;

  // ------------------------------------------------------------------ cast (original)
  const MAYOR = { skin: '#f4b9a0', top: '#8e2f3c', topKind: 'suit', tie: '#2b417e', pants: '#6e2430', shoes: '#2b2235', hair: 'mayor', hairC: '#ece6db', stache: 'walrus', browC: '#e6e1d6', body: 'round', chain: true, cuffs: true };
  const GUS = { skin: '#c98b62', top: '#33456e', topKind: 'vest', pants: '#3d5a8f', hair: 'short', hairC: '#2a1f1c', stache: 'short', hat: 'hard', browC: '#2a1f1c' };
  const YOU = { skin: '#f0c9a4', top: '#e2a93b', topKind: 'hoodie', pants: '#c8453c', pantsKind: 'tartan', shoes: '#4a6fd1', shoeKind: 'slipper', hair: 'messy', hairC: '#2f2630', stubble: true };
  const ECON = { skin: '#e9b896', top: '#8a6a4a', topKind: 'tweed', bow: '#c9303c', pants: '#5a4a3e', hair: 'tufts', hairC: '#d9d5cf', glasses: '#3a3040', browC: '#bdb8b0' };
  const GRAN = { skin: '#f1c7b0', top: '#7fb08a', topKind: 'cardigan', inner: '#f3e3ef', pants: '#8a6fa8', pantsKind: 'stripes', shoes: '#6b4a3a', hair: 'curlers', hairC: '#cfc8d6', body: 'round' };
  const WORKER = (skin, hair) => ({ skin, top: '#4a5a7a', topKind: 'vest', pants: '#46506e', hair: 'short', hairC: hair, hat: 'hard', browC: hair });
  const VOTERS = [
    { skin: '#8d5a3b', top: '#4f8fd6', pants: '#33405e', hair: 'afro', hairC: '#231a1a' },
    { skin: '#f2c9a8', top: '#e3743c', pants: '#3e3a52', hair: 'bob', hairC: '#e6c46a', topKind: 'dress' },
    { skin: '#c48a64', top: '#62b07a', pants: '#2f3550', hair: 'bun', hairC: '#3a2622', topKind: 'dress' },
    { skin: '#e8b48f', top: '#d8473c', pants: '#46506e', hair: 'short', hairC: '#6a6670', glasses: '#2b2235' },
    { skin: '#6e4530', top: '#f0b43a', pants: '#3a3f5c', hair: 'short', hairC: '#1d1515', beard: true },
    { skin: '#f4d0b4', top: '#9a6cc8', pants: '#3e3a52', hair: 'quiff', hairC: '#b0582e' },
  ];
  const toon = (L, ctx, spec, o) => K.toon(L, { ...spec, ...o, vis: ctx.vis });

  // shared set pieces live in kit.js (K.officeBG, K.floorRug, K.hangar, K.outdoor, K.shopfront, K.road, K.stage)
  const officeBG = K.officeBG, floorRug = K.floorRug, hangar = K.hangar, outdoorBG = K.outdoor, shopfront = K.shopfront, road = K.road, stageBG = K.stage;

  // ================================================================== SHOT 1 — ribbon cutting in the square (cold-open claim)
  const c1 = cut('name');
  K.shot('ribbon', 0, c1, { bg: '#d6effc', drift: [0, 0, 0.012] }, (ctx) => {
    const bg = ctx.layer(0.6), mid = ctx.layer(1), fg = ctx.layer(1.5);
    outdoorBG(bg, { horizon: 900, clouds: [[160, 150, 0.8], [820, 90, 0.6], [1500, 170, 0.8]] });
    X.svg('rect', { x: -900, y: 520, width: 3200, height: 900, fill: K.paint('#ead3ab', 'vert') }, bg);
    K.sp(bg, 'M120,522 L540,330 L960,522Z', '#f1e2c4', 'vert');
    K.crest(bg, 540, 450, 62);
    for (let x = -720; x < 2300; x += 210) K.sr(bg, x, 562, 72, 830, '#f6ead2', 'cyl', 6);
    X.svg('rect', { x: -900, y: 520, width: 3200, height: 42, fill: '#d9c19a', stroke: C.ink, 'stroke-width': 3 }, bg);
    for (let k = 0; k < 3; k++) {
      const x0 = -700 + k * 1000;
      X.svg('path', { d: `M${x0},600 Q${x0 + 500},700 ${x0 + 1000},600`, fill: 'none', stroke: C.ink, 'stroke-width': 4 }, bg);
      for (let i = 1; i < 12; i++) { const u = i / 12, x = x0 + 1000 * u, y = 600 + 4 * 25 * u * (1 - u) * 4; K.sp(bg, `M${x - 26},${y - 2} L${x + 26},${y} L${x},${y + 56}Z`, [C.red, '#fffdf6', C.signBlue][(i + k) % 3], 'flat', { 'stroke-width': 3 }); }
    }
    K.floor(mid, -900, 1380, 3200, 1100, '#efdcbf', { vpy: 700, n: 22, rows: 5, op: 0.3 });
    const roller = K.steamroller(mid, 790, 1660, 0.8);
    const rib = K.ribbon(mid, 455, 1080, 1370, { h: 320 });
    // the calendar on a stand, revealed by the orbit
    const stand = K.g(mid);
    K.sr(stand, 1420, 1500, 22, 300, '#8a5a32', 'cyl', 6); K.sr(stand, 1800, 1500, 22, 300, '#8a5a32', 'cyl', 6);
    const cal = K.calendar(stand, 1380, 820, 450, { circle: [1, 5], cones: true });
    const mayor = toon(mid, ctx, MAYOR, { x: 245, y: 1800, s: 1.0, face: 'happy', pose: 'holdR' });
    const sc = K.scissors(mayor.slotR, 1.0);
    const plant = K.g(fg, { transform: 'translate(1460 1900)' });
    K.sr(plant, -90, -170, 180, 170, '#c9534a', 'side', 10);
    [[-60, -330, 120], [40, -380, 130], [-10, -460, 110], [90, -300, 100], [-110, -260, 90]].forEach(([x, y, r]) => K.se(plant, x, y, r, r * 0.8, '#4f9d55', 'sphere'));
    K.move(ctx, 0, { x: 0, y: -40, s: 1.14 }, 0.01); K.move(ctx, 0.02, { x: 0, y: 0, s: 1.0 }, 1.0, 'power2.out');
    // snip on "every": ribbon drops, the steamroller gleams
    const ts = W('hook', 'every');
    sc.snip(ts); rib.snip(ts + 0.02);
    K.flash(ts + 0.05, 0.8, 0.16);
    K.sparkles(mid, [[620, 1300, 54], [900, 1120, 42], [470, 1480, 34], [1010, 1380, 44], [760, 990, 32]], ts + 0.1, 1.0);
    mayor.hop(ts + 0.05, 36); mayor.face(ts + 0.05, 'happy');
    // orbit to the calendar stand
    const to = W('hook', 'and') - 0.05;
    K.orbit(ctx, to, 900, 1.0, { r: -2, to: { s: 1.06 } });
    mayor.pose(to, 'rest', 0.2); mayor.face(to, 'smug'); mayor.turn(to, 0.9);
    mayor.walk(to + 0.05, to + 0.95, { x: 1215, y: 1800 });
    const tw = W('hook', 'week');
    mayor.pose(tw - 0.15, 'pointR', 0.22); mayor.turn(tw - 0.2, 0.5);
    const te = W('hook', 'election');
    X.drawOn(cal.ring, te - 0.05, 0.35); X.sfx(te - 0.05, 'scribble', { dur: 0.35, gain: 0.4 });
    X.tl.fromTo(cal.hl, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, te + 0.3);
  });

  // ================================================================== SHOT 2 — depot: meet the town's only steamroller
  const c2 = cut('big');
  K.shot('depot', c1, c2, { bg: C.hangar, drift: [-18, 0, 0.03] }, (ctx) => {
    const bg = ctx.layer(0.7), mid = ctx.layer(1);
    hangar(bg, { cx: 470, cy: 760 });
    for (let i = 0; i < 6; i++) K.cone(bg, 640 + i * 70, 1210 - i * 22, 0.55 - i * 0.05);
    K.tarp(mid, 700, 1560, 0.95);
    const w1 = toon(mid, ctx, WORKER('#e0a882', '#3a2a24'), { x: 150, y: 1720, s: 0.95, face: 'neutral', pose: 'rest', seed: 1 });
    const w2 = toon(mid, ctx, WORKER('#8d5a3b', '#1d1515'), { x: 340, y: 1640, s: 0.8, face: 'neutral', pose: 'holdR', seed: 3 });
    w1.look(0, 10, -12); w2.look(0, 12, -10);
    const tb = W('name', 'Meet') - 0.05;
    const ban = K.g(mid, { transform: 'translate(540 220)' });
    const banIn = K.g(ban);
    K.sr(banIn, -400, 0, 800, 230, '#fff6dc', 'vert', 8);
    K.txt(banIn, 0, 92, 'PORT FENNICK', { size: 62, font: 'Montserrat', weight: 900, fill: C.navy });
    K.txt(banIn, 0, 182, 'ROADS DEPOT', { size: 78, font: 'Montserrat', weight: 900, fill: C.red });
    X.svg('line', { x1: -420, y1: 0, x2: 420, y2: 0, stroke: C.ink, 'stroke-width': 16, 'stroke-linecap': 'round' }, ban);
    X.svg('path', { d: 'M-360,0 L-290,-260 M360,0 L290,-260', stroke: C.ink, 'stroke-width': 5 }, ban);
    gsap.set(banIn, { scaleY: 0, transformOrigin: '50% 0%' });
    X.tl.fromTo(banIn, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'back.out(1.6)', immediateRender: false }, tb);
    X.sfx(tb, 'slide', { dur: 0.3, gain: 0.4 });
    const tonly = W('name', 'only');
    w1.face(tonly - 0.05, 'happy'); w1.pose(tonly - 0.1, 'presentR'); w2.face(tonly, 'happy');
    w2.hop(W('name', 'steamroller'), 30);
    K.sparkles(mid, [[760, 1100, 40], [1040, 1300, 32]], W('name', 'steamroller'), 0.7, { sfx: false });
  });

  // ================================================================== SHOT 3 — it sleeps under a tarp eleven months a year
  const c3 = W('big', 'then') - 0.07;
  K.shot('tarp', c2, c3, { bg: C.hangar, drift: [0, 0, 0.018] }, (ctx) => {
    const bg = ctx.layer(0.75), mid = ctx.layer(1);
    hangar(bg, { cx: 900, cy: 700 });
    const mc = K.g(bg, { transform: 'translate(-700 380)' });
    K.sr(mc, -20, -20, 380, 500, '#5d5662', 'cyl', 8);
    K.sr(mc, 0, 0, 340, 460, C.calPaper, 'vert', 4);
    K.sr(mc, 0, 0, 340, 120, C.calRed, 'cyl', 4);
    const mtxt = K.txt(mc, 170, 88, 'JAN', { size: 80, font: 'Montserrat', weight: 900 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) X.svg('rect', { x: 18 + c * 52, y: 150 + r * 70, width: 44, height: 56, rx: 4, fill: C.calCell }, mc);
    X.svg('path', { d: 'M-20,-20 L120,-20 M-20,-20 L-20,120 M-20,-20 L80,80 M30,-20 Q20,30 -20,40 M70,-20 Q50,50 -20,80 M100,-20 Q90,70 -20,105', fill: 'none', stroke: '#e8e4f0', 'stroke-width': 3, opacity: 0.85 }, mc);
    const spider = K.g(mc, { transform: 'translate(260 -20)' });
    X.svg('line', { x1: 0, y1: -400, x2: 0, y2: 0, stroke: '#e8e4f0', 'stroke-width': 3 }, spider);
    K.se(spider, 0, 0, 18, 16, '#2b2235', 'sphere', { 'stroke-width': 2 });
    const sst = K.tf(spider, { x: 260, y: -60 });
    K.steamroller(mid, 640, 1640, 1.0);
    const tarpW = K.g(mid); K.tarp(tarpW, 640, 1640, 1.02);
    const tst = K.tf(tarpW, { x: 0, y: 0, sy: 1, r: 0 });
    const worker = toon(mid, ctx, WORKER('#e0a882', '#3a2a24'), { x: 140, y: 1860, s: 1.05, face: 'smug', pose: 'rest' });
    // peek under the tarp: the roller is asleep (Zzz)
    const t1 = W('big', 'sleeps') - 0.12;
    worker.pose(t1, 'surrender', 0.25);
    X.tl.fromTo(tst, { y: 0, r: 0 }, { y: -330, r: -4, duration: 0.3, ease: 'back.out(1.4)', immediateRender: false }, t1);
    X.sfx(t1, 'swoosh', { gain: 0.35 });
    ['Z', 'z', 'z'].forEach((z, i) => {
      const zt = K.txt(mid, 0, 0, z, { size: 90 - i * 18, font: 'Fredoka', weight: 700, fill: '#fffdf6', stroke: C.ink, sw: 6 });
      const zs = K.tf(zt, { x: 420 + i * 60, y: 1380, o: 0, r: -10 });
      X.tl.fromTo(zs, { x: 420 + i * 60, y: 1380, o: 0 }, { x: 470 + i * 90, y: 1180 - i * 70, o: 1, duration: 0.5, ease: 'sine.out', immediateRender: false }, t1 + 0.2 + i * 0.12);
    });
    worker.face(t1 + 0.2, 'happy'); worker.set(t1 + 0.25, { bl: -12, br: -12 }, 0.1);
    X.sfx(t1 + 0.25, 'blip_down', { gain: 0.2 });
    // pan to the wall calendar: eleven months flip by
    const t3 = W('big', 'tarp') - 0.06;
    K.whip(ctx, t3, { x: -1400, y: -275, s: 1.4 }, 0.3);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV'];
    const mcount = K.counter(mtxt, 'JAN');
    const tm = W('big', 'eleven');
    months.forEach((m, i) => { mcount.set(tm + i * 0.05, m); if (i % 2 === 0) X.sfx(tm + i * 0.05, 'paper', { dur: 0.08, gain: 0.25 }); });
    X.tl.fromTo(sst, { y: -60 }, { y: 180, duration: 0.5, ease: 'bounce.out', immediateRender: false }, tm + 0.1);
  });

  // ================================================================== SHOT 4 — overhead toy town: two frantic weeks paving anything that holds still
  const c4 = cut('words');
  K.shot('town', c3, c4, { bg: C.grass, drift: [0, 0, 0.02] }, (ctx) => {
    const bg = ctx.layer(0.8), mid = ctx.layer(1);
    K.sky(bg, -900, -600, 3000, 900, '#78b8f0', '#e4f4fb');
    K.cloud(bg, 200, 120, 0.8); K.cloud(bg, 900, 60, 0.6);
    X.svg('path', { d: 'M-900,300 Q-200,170 400,260 Q1000,160 1800,280 V2600 H-900Z', fill: '#a9d47f' }, mid);
    const rows = [560, 900, 1260, 1640];
    rows.forEach((y) => X.svg('rect', { x: -900, y, width: 3200, height: 120, fill: C.road, stroke: C.ink, 'stroke-width': 3 }, mid));
    [-200, 260, 720, 1180, 1640].forEach((x) => X.svg('path', { d: `M${x},300 L${x + 110},300 L${x + 420},2600 L${x + 300},2600Z`, fill: C.road, stroke: C.ink, 'stroke-width': 3 }, mid));
    const rr = X.rand(31), houseC = ['#f3d3a6', '#f6efe2', '#e9b98a', '#d7e3ef', '#f2c9c2'], roofC = ['#c9534a', '#5b7fc6', '#8a5a3c', '#d98f3a'];
    rows.forEach((y, ri) => { for (let x = -120; x < 1500; x += 230) { if (rr() < 0.25) { K.tree(mid, x + 60 + ri * 40, y - 30, 0.55); continue; } K.house(mid, x + 80 + ri * 46, y - 18, 120 + rr() * 50, 90 + rr() * 50, houseC[Math.floor(rr() * 5)], roofC[Math.floor(rr() * 4)]); } });
    K.house(mid, 30, 1240, 260, 200, '#8e8297', '#5d5470', { depth: 140 });
    X.svg('rect', { x: -40, y: 1100, width: 140, height: 140, fill: '#2f2a38', stroke: C.ink, 'stroke-width': 3 }, mid);
    const holes = [260, 470, 690, 900, 1120, 1330].map((x, i) => ({ x, el: K.pothole(mid, x, 1322, 110, 34, 50 + i, { puddle: false }) }));
    const asphalt = X.svg('line', { x1: 0, y1: 1320, x2: 1500, y2: 1320, stroke: '#5d5a6b', 'stroke-width': 96, opacity: 0.9 }, mid);
    gsap.set(asphalt, { attr: { x2: 0 } });
    const tr = W('big', 'spends') - 0.05, tEnd = c4;
    const at = (x) => tr + Math.sqrt(Math.max(0, x + 60) / 1560) * (tEnd - tr);
    // a garden gnome that "holds still" on the kerb: the roller reaches it on "still"
    const tS = W('big', 'still');
    const gx = 1560 * Math.pow((tS - tr) / (tEnd - tr), 2) - 60 + 110;
    const gnome = K.g(mid);
    K.se(gnome, 0, -40, 30, 40, '#4d72c8', 'sphere'); K.se(gnome, 0, -88, 24, 24, '#f2c6a2', 'sphere');
    K.sp(gnome, 'M-22,-58 Q0,-30 22,-58 Q10,-36 0,-26 Q-10,-36 -22,-58Z', '#fffdf6', 'flat', { 'stroke-width': 3 });
    K.sp(gnome, 'M-26,-100 L0,-170 L26,-100Z', C.red, 'side', { 'stroke-width': 3 });
    const gst = K.tf(gnome, { x: gx, y: 1300, sy: 1, sx: 1 });
    X.tl.fromTo(gst, { sy: 1, sx: 1 }, { sy: 0.14, sx: 1.6, duration: 0.07, ease: 'power4.in', immediateRender: false }, at(gx - 120));
    X.sfx(at(gx - 120), 'boing', { gain: 0.35, pitch: 1.3 });
    const roller = K.steamroller(mid, -60, 1365, 0.34, { flip: true });
    const rst = K.tf(roller.g, { x: -60, y: 1365, s: 0.34, sx: -1 });
    roller.g.removeAttribute('transform');
    X.tl.fromTo(rst, { x: -60 }, { x: 1500, duration: tEnd - tr, ease: 'power1.in', immediateRender: false }, tr);
    X.tl.fromTo(asphalt, { attr: { x2: 0 } }, { attr: { x2: 1500 }, duration: tEnd - tr, ease: 'power1.in', immediateRender: false }, tr + 0.08);
    roller.spin(tr, 6, tEnd - tr);
    X.sfx(tr, 'woosh_low', { dur: 1.2, gain: 0.3 });
    holes.forEach((h, i) => { const th = at(h.x - 120); X.tl.to(h.el, { scale: 0, transformOrigin: '50% 50%', duration: 0.12, ease: 'power2.in' }, th); K.puff(mid, h.x, 1330, th, { n: 5, r: 34, seed: i + 3 }); X.sfx(th, 'thud', { gain: 0.25, pitch: 1.2 }); });
    const tn = W('big', 'paving');
    [[380, 620], [820, 620], [300, 960], [760, 960], [420, 1700], [860, 1700]].forEach(([x, y], i) => { const tg = K.g(mid, { transform: `translate(${x} ${y})` }); K.se(tg, 0, 0, 44, 44, '#5fbf5a', 'sphere'); X.svg('path', { d: 'M-20,0 L-6,16 L22,-16', fill: 'none', stroke: '#fffdf6', 'stroke-width': 11, 'stroke-linecap': 'round' }, tg); X.pop(tg, tn + i * 0.08, { sfx: i % 2 ? false : 'blip', gain: 0.2 }); });
    K.move(ctx, c3, { x: -330, y: 300, s: 1.45 }, 0.01);
    K.move(ctx, tr + 0.1, { x: 120, y: 250, s: 1.3 }, 0.9, 'power2.inOut');
    K.move(ctx, tr + 1.0, { x: 300, y: 80, s: 1.0 }, tEnd - tr - 1.0, 'power2.inOut');
  });

  // ================================================================== SHOT 5 — podium: the same speech as last time, new date
  const c5 = cut('why');
  K.shot('podium', c4, c5, { bg: '#2f2c3d', drift: [0, 0, 0.02] }, (ctx) => {
    const bg = ctx.layer(0.7), mid = ctx.layer(1);
    stageBG(bg);
    const mayor = toon(mid, ctx, MAYOR, { x: 470, y: 2050, s: 1.18, face: 'smile', pose: 'showR' });
    K.podium(mid, 470, 2000, 1.22);
    const pw = K.g(mayor.slotR, { transform: 'rotate(150)' }), paper = K.g(pw, { transform: 'translate(0 -20)' });
    K.sr(paper, -125, -340, 250, 320, '#fffdf6', 'vert', 6);
    K.txt(paper, 0, -290, 'MY SPEECH', { size: 38, font: 'Patrick Hand', weight: 400, fill: C.ink });
    for (let i = 0; i < 4; i++) X.svg('line', { x1: -95, y1: -248 + i * 34, x2: 95 - (i % 2) * 44, y2: -248 + i * 34, stroke: '#a9a3b5', 'stroke-width': 7, 'stroke-linecap': 'round' }, paper);
    K.txt(paper, -38, -66, 'NOV 7', { size: 48, font: 'Montserrat', weight: 900, fill: C.ink });
    const strike = X.svg('path', { d: 'M-108,-82 L32,-82', stroke: '#d8323c', 'stroke-width': 10, 'stroke-linecap': 'round', fill: 'none' }, paper);
    const neu = K.g(paper, { transform: 'translate(70 -34) rotate(-8)' });
    K.txt(neu, 0, 0, 'NOV 5', { size: 50, font: 'Caveat', weight: 700, fill: '#d8323c' });
    const td = W('words', 'dusted');
    K.puff(paper, 0, -200, td, { n: 8, r: 70, color: '#e8dfc8', sfx: 'swoosh' });
    mayor.face(td - 0.05, 'shocked'); mayor.face(td + 0.3, 'smile');
    K.move(ctx, W('words', 'speech') - 0.1, { x: 80, y: -70, s: 1.1 }, 0.5, 'power2.inOut');
    mayor.face(W('words', 'same'), 'smug'); mayor.look(W('words', 'same'), -8, 2);
    const tn = W('words', 'new') - 0.06;
    X.drawOn(strike, tn, 0.16);
    X.pop(neu, tn + 0.14, { sfx: 'scribble', gain: 0.35 });
    X.sfx(W('words', 'date'), 'ding', { gain: 0.3 });
  });

  // ================================================================== SHOT 6 — the viewer at the calendar: "So why…?"
  const c6 = cut('vote');
  K.shot('room', c5, c6, { bg: C.pink, drift: [-26, 0, 0.032] }, (ctx) => {
    const bg = ctx.layer(0.85), mid = ctx.layer(1);
    X.svg('rect', { x: -900, y: -600, width: 3000, height: 3200, fill: X.linear('pinkwall', [[0, C.pinkTop], [0.18, '#c9a6ad'], [0.32, C.pink], [1, '#e3c8c1']]) }, bg);
    X.svg('rect', { x: -900, y: 1780, width: 3000, height: 40, fill: '#b98a6a', stroke: C.ink, 'stroke-width': 3 }, bg);
    const cal = K.calendar(bg, 560, 250, 500, { circle: [1, 5], cones: true });
    gsap.set(cal.ring, { strokeDasharray: 'none' });
    const you = toon(mid, ctx, YOU, { x: 330, y: 2260, s: 1.62, face: 'think', pose: 'chin' });
    you.look(0, 14, -10);
    const te = W('why', 'election');
    you.look(te, 18, -16, 0.1); you.set(te, { bl: 18, br: -12 }, 0.12);
    X.sfx(te, 'blip_up', { gain: 0.2 });
    X.tl.fromTo(cal.hl, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, te);
  });

  // ================================================================== SHOT 7 — the pothole that doesn't vote; the driver who does
  const c7 = cut('memory');
  K.shot('hit', c6, c7, { bg: '#d6effc', drift: [0, 0, 0.012] }, (ctx) => {
    const bg = ctx.layer(0.7), mid = ctx.layer(1), fg = ctx.layer(1.2);
    outdoorBG(bg, { horizon: 800 });
    shopfront(bg, -200, 1000, 620, 420, { name: 'BAKERY' });
    shopfront(bg, 520, 1000, 620, 420, { name: 'TYRES & BIKES' });
    road(mid, 1060, 1400);
    const hole = K.pothole(mid, 560, 1430, 560, 170, 7);
    const ballot = K.ballot(mid, 0, 0, 1.3);
    const bst = K.tf(ballot, { x: 600, y: 300, r: -20, o: 1 });
    const tb = W('vote', 'potholes') - 0.1;
    X.tl.fromTo(bst, { y: 300, x: 600, r: -20 }, { y: 1420, x: 560, r: 12, duration: 0.55, ease: 'power1.in', immediateRender: false }, tb);
    X.tl.to(bst, { s: 0.3, o: 0, y: 1450, duration: 0.25, ease: 'power2.in' }, tb + 0.55);
    X.sfx(tb + 0.55, 'bubble', { gain: 0.4 });
    // car with a voter at the wheel (visible through the tinted glass)
    const carG = K.g(mid);
    const driver = toon(carG, ctx, VOTERS[3], { x: 0, y: 0, s: 0.42, face: 'neutral', pose: 'holdBoth' });
    const car = K.car(carG, 0, 0, 1.0, C.yellowCar);
    car.body.querySelectorAll('path').forEach((p) => { if (p.getAttribute('fill') === '#3b5c99' || (p.getAttribute('fill') || '').includes('3b5c99')) p.setAttribute('fill-opacity', 0.55); });
    driver.st.x = -60; driver.st.y = 60;
    const cst = K.tf(carG, { x: -500, y: 1520, r: 0 });
    const tc = W('vote', 'but') - 0.1, th = W('vote', 'hit');
    X.tl.fromTo(cst, { x: -500 }, { x: 380, duration: th - tc, ease: 'power1.out', immediateRender: false }, tc);
    K.move(ctx, c6 + 0.02, { x: -60, y: 0, s: 1.0 }, 0.01); K.move(ctx, tc, { x: 60, y: 30, s: 1.06 }, th - tc + 0.2, 'power2.inOut');
    X.sfx(tc, 'woosh_low', { dur: 0.5, gain: 0.3 });
    X.tl.fromTo(cst, { r: 0, y: 1520 }, { r: 7, y: 1560, duration: 0.08, ease: 'power2.in', immediateRender: false }, th);
    X.tl.to(cst, { r: -2, y: 1510, duration: 0.2, ease: 'back.out(3)' }, th + 0.08);
    X.tl.to(cst, { r: 4, y: 1540, duration: 0.25, ease: 'power2.inOut' }, th + 0.28);
    K.shake(ctx, th, 18, 0.35);
    K.splash(mid, 560, 1450, th, { n: 14, r: 100 });
    X.sfx(th + 0.03, 'boing', { gain: 0.35 });
    driver.face(th, 'shocked'); driver.hop(th, 50);
    const td = W('vote', 'do');
    driver.face(td, 'angry');
    const tag = K.ballot(fg, 0, 0, 1.4);
    const tgst = K.tf(tag, { x: 420, y: 1180, s: 0, r: -10 });
    X.tl.fromTo(tgst, { s: 0, r: -10 }, { s: 1, r: 8, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, td);
    X.sfx(td, 'beep', { dur: 0.25, gain: 0.25 });
    K.punch(ctx, td, 1.08, 0.5);
  });

  // ================================================================== SHOT 8 — council chamber: repairs ON HOLD, polls shoot up
  const c8 = cut('econ');
  K.shot('chamber', c7, c8, { bg: C.wallCream, rig: { x: 260, y: 0, s: 1.04 }, drift: [0, 0, 0.012] }, (ctx) => {
    const bg = ctx.layer(0.75), mid = ctx.layer(1);
    K.rectV(bg, -900, -600, 3000, 1500, C.wallCream, 0.2);
    X.svg('rect', { x: -900, y: 760, width: 3000, height: 1500, fill: K.paint(C.wood, 'vert') }, bg);
    for (let x = -880; x < 2100; x += 230) { X.svg('rect', { x, y: 800, width: 190, height: 360, rx: 8, fill: 'none', stroke: C.woodD, 'stroke-width': 6 }, bg); X.svg('line', { x1: x - 20, y1: 760, x2: x - 20, y2: 2200, stroke: C.woodDD, 'stroke-width': 4, opacity: 0.5 }, bg); }
    K.se(bg, 960, 330, 110, 110, '#fffdf6', 'sphere');
    X.svg('circle', { cx: 960, cy: 330, r: 92, fill: 'none', stroke: C.gold, 'stroke-width': 8 }, bg);
    X.svg('path', { d: 'M960,330 L960,262 M960,330 L1010,350', stroke: C.ink, 'stroke-width': 9, 'stroke-linecap': 'round' }, bg);
    K.beacon(bg, 520, 360, 1.1, C.amber, { vis: ctx.vis });
    const tear = K.tearCal(bg, 1260, 300, 170, 'MAR', 3);
    K.floor(mid, -900, 1520, 3000, 800, '#c98f5d', { vpy: 900, n: 20, op: 0.3 });
    // chair + mayor + desk
    K.sp(mid, 'M740,1500 L740,820 Q740,700 860,700 L1120,700 Q1240,700 1240,820 L1240,1500Z', '#6b2f3a', 'cyl');
    const mayor = toon(mid, ctx, MAYOR, { x: 990, y: 1720, s: 1.05, face: 'smug', pose: 'lounge' });
    mayor.set(0, { lean: -6, hr: -6 }, 0.01);
    K.desk(mid, 960, 1900, 860, 420, C.wood);
    const sign = K.deskSign(mid, 1100, 1480, 'REPAIRS', 'ON HOLD', { w: 330, h: 110, size: 54 });
    const easel = K.easel(mid, 170, 1860, 1.05);
    K.move(ctx, c7 + 0.02, { x: 200, y: -30, s: 1.1 }, W('memory', 'Fix', 1) - c7 - 0.2, 'sine.inOut');
    const tn = W('memory', 'nobody');
    sign.flip(tn);
    // month card: MAR → NOV
    const tm = W('memory', 'November');
    tear.flip(tm);
    tear.back.textContent = '5'; tear.back.parentNode.querySelectorAll('text')[0].textContent = 'NOV';
    // whip left to the poll chart
    const tw = W('memory', 'Fix', 1) - 0.14;
    K.whip(ctx, tw, { x: -40, y: 60, s: 0.98 }, 0.3);
    const tp = W('memory', 'local');
    easel.arrow.setAttribute('stroke-dasharray', '2000'); easel.arrow.setAttribute('stroke-dashoffset', '2000');
    X.drawOn(easel.arrow, tp, 0.55, 'power2.in');
    X.tl.set(easel.head, { attr: { opacity: 1 } }, tp + 0.55);
    X.sfx(tp, 'riser', { dur: 0.6, gain: 0.3 });
    const ts = W('memory', 'hero');
    mayor.set(ts - 0.1, { lean: 0, hr: 0 }, 0.2); mayor.pose(ts - 0.1, 'cheer', 0.25); mayor.face(ts - 0.1, 'happy');
    mayor.hop(ts, 40);
    X.sfx(ts + 0.05, 'success', { gain: 0.3 });
  });

  // ================================================================== SHOT 9 — the economist: "the political budget cycle"
  const c9 = cut('date');
  K.shot('econ', c8, c9, { bg: C.cream, drift: [16, 0, 0.016] }, (ctx) => {
    const bg = ctx.layer(0.8), mid = ctx.layer(1);
    K.rectV(bg, -900, -600, 3000, 2000, '#f4e0b8', 0.2);
    X.svg('rect', { x: -900, y: 1400, width: 3000, height: 1000, fill: K.paint('#d9b98a', 'vert') }, bg);
    const bx = 150, by = 380, bw = 860, bh = 600;
    K.chalkboard(bg, bx, by, bw, bh);
    const ch = { fill: 'none', stroke: '#f2f0e6', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.92 };
    X.svg('path', { d: `M${bx + 70},${by + 150} L${bx + 70},${by + 500} L${bx + 800},${by + 500}`, ...ch }, bg);
    const votes = [bx + 300, bx + 520, bx + 740];
    votes.forEach((vx) => { X.svg('path', { d: `M${vx - 26},${by + 512} h52 v44 h-52z M${vx - 12},${by + 520} h24`, ...ch, 'stroke-width': 5 }, bg); });
    let d = `M${bx + 80},${by + 450}`;
    votes.forEach((vx) => { d += ` L${vx - 110},${by + 450} L${vx - 30},${by + 200} L${vx},${by + 180} L${vx + 20},${by + 450}`; });
    d += ` L${bx + 790},${by + 450}`;
    const line = X.svg('path', { d, ...ch, stroke: '#ffe27a' }, bg);
    const title = K.txt(bg, bx + bw / 2, by + 100, '', { size: 62, font: 'Patrick Hand', weight: 400, fill: '#f6f3ea' });
    const ecno = toon(mid, ctx, ECON, { x: 230, y: 2080, s: 1.18, face: 'smile', pose: 'presentR' });
    const stick = X.svg('line', { x1: 0, y1: 40, x2: 0, y2: 260, stroke: '#a9713f', 'stroke-width': 12, 'stroke-linecap': 'round' }, ecno.slotR);
    const t0 = W('econ', 'Economists');
    X.drawOn(line, t0 + 0.1, 1.1, 'power1.inOut');
    ecno.hop(W('econ', 'name'), 26); ecno.pose(W('econ', 'name') - 0.1, 'shrug', 0.25);
    K.move(ctx, c8 + 0.02, { x: -60, y: 60, s: 0.98 }, 0.01); K.move(ctx, c8 + 0.05, { x: 0, y: 0, s: 1.04 }, W('econ', 'political') - c8 - 0.2, 'sine.inOut');
    X.sfx(t0 + 0.1, 'scribble', { dur: 1.0, gain: 0.3 });
    const tp = W('econ', 'political');
    X.typeOn(title, 'POLITICAL BUDGET CYCLE', tp - 0.05, 34);
    X.sfx(tp - 0.05, 'scribble', { dur: 0.6, gain: 0.35 });
    ecno.pose(tp, 'pointR', 0.25); ecno.face(tp, 'happy');
    K.move(ctx, tp - 0.1, { x: 20, y: -140, s: 1.1 }, 0.7, 'power2.inOut');
    const tc = W('econ', 'cycle');
    const loop = X.svg('path', { d: `M${bx + 640},${by + 250} a70,60 0 1 1 -10,-40`, ...ch, stroke: '#ff9a8a' }, bg);
    X.drawOn(loop, tc, 0.3);
    ecno.hop(tc, 30);
  });

  // ================================================================== town-hall queue (shots 10 + 12)
  const queueSet = (ctx, o = {}) => {
    const bg = ctx.layer(0.7), mid = ctx.layer(1), fg = ctx.layer(1.15);
    outdoorBG(bg, { horizon: 900, clouds: [[200, 140, 0.8], [900, 90, 0.6]] });
    X.svg('rect', { x: -900, y: 560, width: 3000, height: 700, fill: K.paint('#e9c792', 'vert') }, bg);
    for (let x = -800; x < 2000; x += 300) { K.sp(bg, `M${x},1180 L${x},800 Q${x},700 ${x + 100},700 Q${x + 200},700 ${x + 200},800 L${x + 200},1180Z`, '#c9b08a', 'flat'); }
    X.svg('rect', { x: -900, y: 540, width: 3000, height: 40, fill: '#d9c19a', stroke: C.ink, 'stroke-width': 3 }, bg);
    const bb = K.billboard(bg, 470, 40, 560, 340);
    K.floor(mid, -900, 1180, 3000, 1300, '#efdcbf', { vpy: 500, n: 18, rows: 6, op: 0.3 });
    for (let x = -300; x < 1500; x += 90) X.svg('rect', { x, y: 1560 + x * 0.02, width: 50, height: 10, fill: '#f0c430' }, mid);
    return { bg, mid, fg, bb };
  };
  const posterMayor = (bb, ctx, face, pose) => {
    X.svg('rect', { x: 0, y: 0, width: bb.w, height: bb.h, fill: X.linear(`pst${ctx.name}`, [[0, '#4b7fd0'], [1, '#2b417e']]) }, bb.screen);
    const m = toon(bb.screen, ctx, MAYOR, { x: 390, y: 700, s: 0.6, face, pose, idle: 0.4 });
    return m;
  };
  const c10 = cut('gus');
  K.shot('queue', c9, c10, { bg: '#d6effc', drift: [34, 0, 0.02] }, (ctx) => {
    const Q = queueSet(ctx);
    const m = posterMayor(Q.bb, ctx, 'happy', 'thumbR');
    K.txt(Q.bb.screen, 150, 110, 'RE-ELECT', { size: 50, font: 'Montserrat', weight: 900, fill: '#fffdf6' });
    K.txt(Q.bb.screen, 150, 180, 'BUNBURY', { size: 60, font: 'Montserrat', weight: 900, fill: C.strip });
    K.umbrella(Q.bg, 80, 1240, 0.9);
    // ballot table + date card
    K.desk(Q.mid, 900, 1700, 380, 230, '#f6f3ea');
    const card = K.g(Q.mid, { transform: 'translate(900 1440)' });
    K.sr(card, -120, -230, 240, 230, '#fffdf6', 'vert', 8); K.sr(card, -120, -230, 240, 64, C.calRed, 'cyl', 8);
    K.txt(card, 0, -182, 'NOV', { size: 46, font: 'Montserrat', weight: 900 }); K.txt(card, 0, -34, '5', { size: 140, font: 'Montserrat', weight: 900, fill: C.ink });
    const voters = [0, 1, 2, 3, 4].map((i) => toon(Q.mid, ctx, VOTERS[i], { x: 80 + i * 150, y: 1640 + i * 12, s: 0.62, face: ['smile', 'neutral', 'tired', 'smile', 'neutral'][i], pose: i === 4 ? 'holdR' : 'rest', seed: i * 1.7 }));
    voters.forEach((v) => v.turn(0, 0.6));
    const tn = W('date', 'November');
    X.tl.fromTo(card, { scale: 1, transformOrigin: '50% 100%' }, { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, tn);
    X.sfx(tn, 'ding', { gain: 0.3 });
    voters[2].hop(tn + 0.1, 25);
  });

  // ================================================================== SHOT 11 — Gus's office: the deal
  const c11 = cut('threat');
  K.shot('gus', c10, c11, { bg: C.cream, drift: [0, 0, 0.012] }, (ctx) => {
    const bg = ctx.layer(0.65), mid = ctx.layer(1);
    officeBG(bg, { windows: [[560, 330]] });
    const cal = K.calendar(bg, 60, 280, 380, { circle: [0, 30, 'OCT'] });
    K.floor(mid, -900, 1300, 3000, 900, C.cream2, { vpy: 700, n: 22, op: 0.3 });
    const gus = toon(mid, ctx, GUS, { x: 760, y: 1750, s: 1.0, face: 'neutral', pose: 'rest', seed: 2 });
    K.desk(mid, 760, 1880, 640, 380, C.woodD);
    // the big red PAVE button
    const btn = K.g(mid, { transform: 'translate(900 1450)' });
    K.sr(btn, -110, -40, 220, 50, '#2f2a38', 'cyl', 10);
    K.sp(btn, 'M-80,-40 Q-80,-120 0,-120 Q80,-120 80,-40Z', '#e0443a', 'sphere');
    K.sr(btn, -70, 2, 140, 40, C.strip, 'flat', 6, { 'stroke-width': 3 }); K.txt(btn, 0, 34, 'PAVE', { size: 32, font: 'Montserrat', weight: 900, fill: C.ink });
    const mayor = toon(mid, ctx, MAYOR, { x: 230, y: 2000, s: 1.02, face: 'worried', pose: 'plead' });
    mayor.set(0, { lean: 8, sink: 90 }, 0.01); mayor.look(0, 14, -14);
    gus.look(W('gus', 'Gus') - 0.05, -14, 0); gus.face(W('gus', 'Gus'), 'smug');
    mayor.hop(W('gus', 'booked'), 24);
    K.orbit(ctx, c10 + 0.1, -170, W('gus', 'His') - c10 - 0.3, { r: 1.2, ease: 'sine.inOut' });
    gus.pose(W('gus', 'October') - 0.1, 'hips');
    const tg = W('gus', 'His') - 0.08;
    gus.face(W('gus', 'question'), 'smug'); gus.set(W('gus', 'question'), { bl: 18, br: -16 }, 0.12);
    K.punch(ctx, tg, 1.12, 0.3, true);
    K.move(ctx, tg, { x: 120, y: -40 }, 0.3, 'power3.out');
    const ts = W('gus', 'overtime') - 0.05;
    X.sfx(ts + 0.1, 'coin', { gain: 0.3 });
    gus.pose(ts - 0.1, 'thumbR', 0.25); gus.face(ts - 0.1, 'happy');
    K.sparkles(mid, [[880, 1050, 40], [600, 950, 30], [940, 1260, 28]], ts, 0.8);
    const tm = W('gus', 'overtime') + 0.42;
    mayor.prop(tm, 'hard', true); mayor.face(tm, 'happy'); mayor.set(tm, { sink: 40, lean: 0 }, 0.2); mayor.pose(tm, 'salute', 0.25);
    K.burst(mid, 230, 830, 140, tm, { sfx: 'pop', gain: 0.35 });
    K.sparkles(mid, [[120, 760, 36], [360, 720, 30]], tm + 0.05, 0.7, { sfx: false });
  });

  // ================================================================== SHOT 12 — the campaign slogan on the billboard; a voter finds the pothole
  const c12 = cut('you');
  K.shot('threat', c11, c12, { bg: '#d6effc', rig: { x: 60, y: -120, s: 1.1 }, drift: [0, 0, 0.012] }, (ctx) => {
    const Q = queueSet(ctx);
    posterMayor(Q.bb, ctx, 'happy', 'thumbR');
    const sl = K.g(Q.bb.screen, { opacity: 0 });
    X.svg('rect', { x: 0, y: 0, width: 560, height: 340, fill: '#d8473c' }, sl);
    const face = toon(sl, ctx, MAYOR, { x: 135, y: 700, s: 0.62, face: 'smug', pose: 'pointFwd', idle: 0.3 });
    const l1 = K.txt(sl, 390, 112, '', { size: 40, font: 'Montserrat', weight: 900, fill: '#fffdf6' });
    const l2 = K.txt(sl, 390, 178, '', { size: 32, font: 'Montserrat', weight: 900, fill: '#fffdf6' });
    const l3 = K.txt(sl, 390, 250, '', { size: 50, font: 'Montserrat', weight: 900, fill: C.strip });
    const tt = W('threat', 'slogan') - 0.05;
    X.tl.set(sl, { attr: { opacity: 1 } }, tt);
    K.burst(Q.bg, 900, 150, 130, tt, { sfx: 'glitch', gain: 0.3, n: 10 });
    K.punch(ctx, tt, 1.06, 0.4);
    const tv = W('threat', 're-elect');
    X.typeOn(l1, 'RE-ELECT ME', tv - 0.05, 30); X.sfx(tv - 0.05, 'type', { dur: 0.35, gain: 0.3 });
    const tor = W('threat', 'or');
    X.typeOn(l2, 'OR KEEP THE', tor - 0.05, 45); X.typeOn(l3, 'POTHOLES', tor + 0.12, 40); X.sfx(tor - 0.05, 'type', { dur: 0.4, gain: 0.3 });
    face.face(tor, 'angry');
    const hole = K.pothole(Q.mid, 600, 1700, 300, 90, 12);
    const voters = [0, 1, 2, 5].map((i, k) => toon(Q.mid, ctx, VOTERS[i], { x: 140 + k * 240, y: 1650 + k * 10, s: 0.72, face: 'neutral', pose: 'rest', seed: k * 2.3 }));
    voters.forEach((v) => v.look(0, 4, -14));
    voters.forEach((v, k) => { v.face(tv + k * 0.04, 'shocked'); v.hop(tv + k * 0.05, 30); });
    voters[1].pose(tv, 'headHands', 0.25);
    const tk = W('threat', 'keep');
    K.move(ctx, tk, { x: 60, y: 420, s: 1.14 }, 0.3, 'power3.out');
    X.sfx(tk, 'woosh_low', { dur: 0.3, gain: 0.25 });
    const te = W('threat', 'potholes');
    const v = voters[2];
    v.moveTo(te - 0.2, { x: 600, y: 1700 }, 0.2, 'power2.in');
    v.set(te + 0.02, { sink: 160 }, 0.12, 'power3.in'); v.face(te, 'shocked');
    K.splash(Q.mid, 600, 1690, te + 0.06, { n: 12, r: 80 });
    X.sfx(te + 0.06, 'boing', { gain: 0.35, pitch: 0.8 });
    const front = K.g(Q.mid);
    X.svg('path', { d: 'M430,1700 Q600,1790 770,1700 Q770,1740 600,1760 Q430,1740 430,1700Z', fill: C.holeRim, stroke: C.ink, 'stroke-width': 3 }, front);
    v.face(te + 0.45, 'sad');
  });

  // ================================================================== Elm Street (shots 13–15, 19, 20)
  const elm = (ctx, o = {}) => {
    const bg = ctx.layer(0.8), mid = ctx.layer(1), fg = ctx.layer(1.2);
    outdoorBG(bg, { horizon: 980 });
    const skyG = K.g(bg);
    K.tree(bg, -200, 1060, 1.1); K.tree(bg, 1500, 1040, 1.2); K.tree(bg, 2100, 1060, 1.0);
    shopfront(bg, -330, 1180, 790, 540, { name: 'TYRES & BIKES' });
    const led = K.led(bg, o.ledX ?? 40, 800, 390, 140, o.bill || '$0.00', { label: 'YOUR REPAIR BILL' });
    const sign = K.priceSign(bg, o.signX ?? 600, o.signY ?? 160, { rows: [['POTHOLES', o.holes || '3'], ['FIXED', o.fixed || '0']], w: 400, pole: 900 });
    shopfront(bg, 1300, 1180, 700, 480, { name: 'BAKERY' });
    const tear = K.tearCal(bg, o.calX ?? 850, o.calY ?? 760, 150, 'NOV', 5);
    road(mid, 1300, 1300);
    return { bg, mid, fg, led, sign, tear, skyG };
  };
  const c13 = cut('week');
  K.shot('you', c12, c13, { bg: '#d6effc', drift: [24, 0, 0.034] }, (ctx) => {
    const E = elm(ctx, { calX: -2000 });
    K.car(E.mid, 1180, 1560, 0.95, C.yellowCar);
    K.pothole(E.mid, 760, 1640, 300, 90, 21);
    K.pothole(E.mid, 200, 1880, 380, 110, 22);
    const you = toon(E.mid, ctx, YOU, { x: 440, y: 1720, s: 1.25, face: 'tired', pose: 'rest' });
    const t1 = W('you', 'you');
    you.look(t1, 0, 0); you.set(t1, { hr: 4 }, 0.2);
    const t2 = W('you', 'eleven');
    you.pose(t2 - 0.1, 'shrug', 0.3); you.face(t2 - 0.1, 'sad');
    X.sfx(t2, 'blip_down', { gain: 0.2 });
  });
  const c14 = W('week', 'and') - 0.07;
  K.shot('week', c13, c14, { bg: '#d6effc', rig: { x: 0, y: 0, s: 1.04 }, drift: [0, 0, 0.012] }, (ctx) => {
    const E = elm(ctx, { signX: 580, calX: -2000 });
    const holes = K.counter(E.sign.rows[0], '3'), bill = K.counter(E.led.text, '$0.00', (v) => '$' + v.toFixed(2));
    K.pothole(E.mid, 560, 1720, 330, 96, 31);
    const bike = K.bike(E.mid, 0, 0, 1.0);
    const bst = K.tf(bike.g, { x: 380, y: 1760, r: 0 });
    bike.g.removeAttribute('transform');
    const fst = K.tf(bike.front, { x: 170, y: -110, sx: 1, r: 0 });
    const you = toon(E.mid, ctx, YOU, { x: 200, y: 1800, s: 1.12, face: 'tired', pose: 'holdR' });
    const tb = W('week', 'finds');
    X.tl.fromTo(bst, { r: 0, y: 1760 }, { r: 14, y: 1800, duration: 0.1, ease: 'power3.in', immediateRender: false }, tb);
    X.tl.fromTo(fst, { sx: 1, r: 0 }, { sx: 0.55, r: 18, duration: 0.12, ease: 'back.out(3)', immediateRender: false }, tb + 0.08);
    K.splash(E.mid, 560, 1720, tb + 0.08, { n: 10, r: 70 });
    X.sfx(tb + 0.1, 'boing', { gain: 0.35 });
    you.face(tb + 0.08, 'shocked'); you.pose(tb + 0.1, 'headHands', 0.25);
    holes.slot(tb + 0.05, tb + 0.4, '7');
    bill.roll(tb + 0.1, tb + 0.6, 0, 61.2);
    // whip to the car, two wheels in two holes
    const tw = W('week', 'your', 1) - 0.18;
    K.whip(ctx, tw, { x: 760, y: 0, s: 1.04 }, 0.3);
    K.pothole(E.mid, 1150, 1700, 260, 80, 32); K.pothole(E.mid, 1540, 1700, 260, 80, 33);
    const car = K.car(E.mid, 0, 0, 1.05, '#5aa0e0');
    const cst = K.tf(car.g, { x: 1350, y: 1690, r: 0 }); car.g.removeAttribute('transform');
    const gran = toon(E.mid, ctx, GRAN, { x: 1720, y: 1820, s: 0.95, face: 'neutral', pose: 'rest', flip: true });
    const tt = W('week', 'two');
    X.tl.fromTo(cst, { y: 1690, r: 0 }, { y: 1740, r: -3, duration: 0.1, ease: 'power3.in', immediateRender: false }, tt - 0.05);
    K.shake(ctx, tt, 14, 0.3);
    K.splash(E.mid, 1150, 1700, tt + 0.03, { n: 9, r: 60, sfx: false }); K.splash(E.mid, 1540, 1700, tt + 0.05, { n: 9, r: 60, seed: 5 });
    gran.face(tt, 'shocked'); gran.pose(tt + 0.05, 'headHands', 0.25); gran.hop(tt, 30);
    holes.slot(tt, tt + 0.35, '19');
    bill.roll(tt + 0.05, tt + 0.6, 61.2, 148.7);
  });
  const c15 = cut('tarp');
  K.shot('crater', c14, c15, { bg: '#d6effc', rig: { x: 0, y: 40, s: 1.12 }, drift: [0, 0, 0] }, (ctx) => {
    const E = elm(ctx, { holes: '19', bill: '$148.70', calX: -2000 });
    const holes = K.counter(E.sign.rows[0], '19');
    const cr = K.g(E.mid);
    X.svg('ellipse', { cx: 520, cy: 1720, rx: 560, ry: 200, fill: C.holeRim, stroke: C.ink, 'stroke-width': 4 }, cr);
    X.svg('ellipse', { cx: 520, cy: 1730, rx: 500, ry: 170, fill: C.hole, stroke: C.ink, 'stroke-width': 4 }, cr);
    X.svg('ellipse', { cx: 540, cy: 1760, rx: 400, ry: 120, fill: '#7f95c2' }, cr);
    X.svg('path', { d: 'M280,1730 Q420,1700 560,1716', fill: 'none', stroke: '#dfeefc', 'stroke-width': 9, 'stroke-linecap': 'round' }, cr);
    const duck = K.duck(cr, 620, 1770, 0.9);
    K.hook((t) => duck.setAttribute('transform', `translate(${(620 + Math.sin(t * 1.8) * 30).toFixed(1)} ${(1770 + Math.sin(t * 3.1) * 6).toFixed(1)}) rotate(${(Math.sin(t * 3.1) * 5).toFixed(1)}) scale(0.9)`), ctx.vis);
    const mb = K.mailbox(E.mid, 900, 1640, 0.95);
    const you = toon(E.mid, ctx, YOU, { x: 150, y: 1620, s: 0.75, face: 'sad', pose: 'rest' });
    you.look(0, 12, 8);
    const tb = W('week', 'big');
    holes.slot(tb, tb + 0.45, '212');
    K.move(ctx, c14, { x: 0, y: 0, s: 1.0 }, c15 - c14, 'sine.out');
    const tm = W('week', 'mailbox');
    X.tl.fromTo(mb.flag, { r: 0 }, { r: -90, duration: 0.2, ease: 'back.out(3)', immediateRender: false }, tm);
    X.sfx(tm, 'ding', { gain: 0.35 });
    you.face(tm, 'tired');
  });

  // ================================================================== SHOT 16 — two weeks before the vote: the tarp comes off
  const c16 = cut('fixed');
  K.shot('reveal', c15, c16, { bg: C.hangar, drift: [-20, 0, 0.03] }, (ctx) => {
    const bg = ctx.layer(0.7), mid = ctx.layer(1);
    hangar(bg, { cx: 640, cy: 640 });
    const cal = K.calendar(bg, -60, 260, 400, { circle: [1, 5], cones: false });
    gsap.set(cal.ring, { strokeDasharray: 'none' });
    const strike = X.svg('path', { d: `M${cal.cells['0-22'][0] - 20},${cal.cells['0-22'][1] - 6} L${cal.cells['0-31'][0] + 20},${cal.cells['0-31'][1] - 6}`, stroke: '#d8323c', 'stroke-width': 10, 'stroke-linecap': 'round', fill: 'none' }, cal.g);
    X.drawOn(strike, W('tarp', 'two'), 0.45);
    X.sfx(W('tarp', 'two'), 'scribble', { dur: 0.4, gain: 0.3 });
    const roller = K.steamroller(mid, 640, 1650, 0.92);
    const tarpG = K.g(mid);
    K.tarp(tarpG, 640, 1650, 0.94);
    const tst = K.tf(tarpG, { x: 0, y: 0, r: 0, o: 1 });
    const w1 = toon(mid, ctx, WORKER('#e0a882', '#3a2a24'), { x: 140, y: 1840, s: 0.9, face: 'neutral', pose: 'rest' });
    const w2 = toon(mid, ctx, WORKER('#8d5a3b', '#1d1515'), { x: 960, y: 1860, s: 0.85, face: 'neutral', pose: 'rest', flip: true });
    const tt = W('tarp', 'tarp') - 0.08;
    X.tl.fromTo(tst, { y: 0, r: 0, x: 0 }, { y: -1700, r: 18, x: 300, duration: 0.42, ease: 'power3.in', immediateRender: false }, tt);
    X.sfx(tt, 'whoosh', { dur: 0.45, gain: 0.45 });
    K.flash(tt + 0.3, 0.75, 0.16);
    K.sparkles(mid, [[360, 1330, 52], [700, 1060, 40], [930, 1320, 46], [520, 1500, 34]], tt + 0.32, 1.0);
    w1.face(tt + 0.3, 'happy'); w1.pose(tt + 0.3, 'cheer'); w2.face(tt + 0.32, 'happy'); w2.pose(tt + 0.32, 'cheer');
    K.punch(ctx, tt + 0.3, 1.06, 0.6);
  });

  // ================================================================== SHOT 17 — polling booths: FIXED 0 → 400 as the town votes
  const c17 = cut('wins');
  K.shot('booths', c16, c17, { bg: C.boothWall, drift: [-30, 0, 0.016] }, (ctx) => {
    const bg = ctx.layer(0.8), mid = ctx.layer(1);
    K.rectV(bg, -900, -600, 3000, 2000, C.boothWall, 0.15);
    for (let y = 520; y < 1300; y += 34) X.svg('line', { x1: -900, y1: y, x2: 2100, y2: y, stroke: '#d3dbe6', 'stroke-width': 3 }, bg);
    X.svg('rect', { x: -900, y: -600, width: 3000, height: 760, fill: '#f4f6fa' }, bg);
    [[100, 260], [700, 260]].forEach(([x, y]) => K.sr(bg, x, y - 80, 280, 40, '#ffffff', 'flat', 6, { 'stroke-width': 3 }));
    K.window(bg, 230, 420, 620, 380, { hills: true, bars: false });
    const sign = K.priceSign(bg, 380, 470, { rows: [['FIXED THIS WEEK', '0']], w: 320, rh: 190, ls: 30, pole: false });
    const fixed = K.counter(sign.rows[0], '0');
    K.floor(mid, -900, 1260, 3000, 1100, C.floorWood, { vpy: 600, n: 24, op: 0.35 });
    const booths = [[150, C.red], [540, C.signBlue], [930, C.red]].map(([x, c], i) => K.booth(mid, x, 1700, 340, 600, c, { legs: VOTERS[i].pants, shoe: '#3a2a24' }));
    const tj = W('fixed', 'leap') - 0.05, th = W('fixed', 'hundred') + 0.12;
    fixed.roll(tj, th, 0, 400, { ease: (p) => p * p });
    K.burst(bg, 820, 560, 150, th, { sfx: 'impact', gain: 0.4 });
    X.sfx(th, 'coin', { gain: 0.3 });
    K.punch(ctx, th, 1.05, 0.4);
    // voters step out, delighted
    const tr = W('fixed', 'just') - 0.08;
    K.move(ctx, tr - 0.1, { x: -110, y: 80, s: 1.1 }, 0.6, 'power2.inOut');
    const out = [0, 1].map((i) => toon(mid, ctx, VOTERS[i], { x: [150, 540][i], y: 1720, s: 0.85, face: 'happy', pose: 'holdR', seed: i }));
    out.forEach((v, i) => { gsap.set(v.root, { opacity: 0 }); X.tl.set(v.root, { opacity: 1 }, tr + i * 0.12); X.tl.to(booths[i].curtain, { scaleX: 0.25, transformOrigin: '0% 50%', duration: 0.2, ease: 'power2.out' }, tr + i * 0.12); X.tl.set(booths[i].feet, { opacity: 0 }, tr + i * 0.12); v.moveTo(tr + i * 0.12, { y: 1850, s: 0.95 }, 0.35, 'back.out(1.5)'); X.sfx(tr + i * 0.12, 'swoosh', { gain: 0.25 }); });
    const ballots = out.map((v) => K.ballot(v.slotR, 0, 60, 0.9));
    const tv = W('fixed', 'box');
    out[1].pose(tv, 'cheer', 0.25); out[0].hop(tv, 30);
  });

  // ================================================================== SHOT 18 — rally: "And Bunbury wins again."
  const c18 = cut('promise');
  K.shot('rally', c17, c18, { bg: '#2f2c3d', rig: { x: 0, y: 80, s: 1 }, drift: [0, -20, 0.03] }, (ctx) => {
    const bg = ctx.layer(0.7), mid = ctx.layer(1), fg = ctx.layer(1.3);
    stageBG(bg);
    const mayor = toon(mid, ctx, MAYOR, { x: 540, y: 1900, s: 1.0, face: 'happy', pose: 'wide' });
    K.podium(mid, 540, 1880, 1.0, { emblem: 'star', star: C.red });
    X.svg('rect', { x: -900, y: 1640, width: 3000, height: 260, fill: K.paint('#2b3a6e', 'vert') }, mid);
    const bunt = K.g(mid);
    X.svg('path', { d: 'M-200,1640 Q540,1720 1300,1640', fill: 'none', stroke: C.ink, 'stroke-width': 4 }, bunt);
    for (let i = 0; i < 16; i++) { const x = -160 + i * 92, y = 1640 + Math.sin((i / 15) * Math.PI) * 74; K.sp(bunt, `M${x - 34},${y - 4} L${x + 34},${y} L${x},${y + 70}Z`, [C.red, '#fffdf6', C.signBlue][i % 3], 'flat', { 'stroke-width': 3 }); }
    const heads = [[60, 2100, '#2f2630', '#f0c9a4'], [300, 2160, '#e6c46a', '#f2c9a8'], [560, 2120, '#231a1a', '#8d5a3b'], [820, 2170, '#b0582e', '#f4d0b4'], [1050, 2110, '#6a6670', '#e8b48f']];
    heads.forEach(([x, y, hc, sk], i) => { const hg = K.g(fg, { transform: `translate(${x} ${y})` }); K.se(hg, 0, 60, 180, 120, ['#4f8fd6', '#e3743c', '#62b07a', '#d8473c', '#9a6cc8'][i], 'cyl'); K.se(hg, 0, -130, 130, 140, hc, 'side'); K.se(hg, -126, -110, 22, 32, sk, 'sphere'); K.se(hg, 126, -110, 22, 32, sk, 'sphere'); const st = K.tf(hg, { x, y }); X.tl.fromTo(st, { y }, { y: y - 50, duration: 0.14, yoyo: true, repeat: 3, ease: 'power2.out', immediateRender: false }, W('wins', 'cruises') + i * 0.05); });
    K.confetti(mid, c17, c18 + 0.1, { n: 150, seed: 4 });
    mayor.hop(W('wins', 'cruises'), 40);
    X.sfx(W('wins', 'cruises'), 'success', { gain: 0.35 });
    X.sfx(c17 + 0.05, 'pop', { gain: 0.25 });
  });

  // ================================================================== SHOT 19 — the promise, with a halo, then off behind the curtain
  const c19 = cut('after');
  K.shot('halo', c18, c19, { bg: C.cream, rig: { x: 0, y: 0, s: 1.05 }, drift: [0, 0, 0.012] }, (ctx) => {
    const bg = ctx.layer(0.65), mid = ctx.layer(1);
    officeBG(bg, { windows: [[60, 320]] });
    K.floor(mid, -900, 1500, 3000, 900, C.cream2, { vpy: 800, n: 22, op: 0.3 });
    // curtain on a rail with the steamroller behind it
    K.tarp(mid, 1450, 1700, 0.7);
    const mayor = toon(mid, ctx, MAYOR, { x: 520, y: 2080, s: 1.16, face: 'blissful', pose: 'swearR' });
    const pod = K.podium(mid, 520, 2040, 1.2, { emblem: 'star', star: C.gold });
    const cur = K.g(mid);
    K.sr(cur, 1060, 520, 16, 1200, '#b9bccb', 'cyl', 4); K.sr(cur, 1060, 520, 900, 16, '#b9bccb', 'cyl', 4);
    const curtain = K.g(cur);
    K.sp(curtain, 'M1080,536 L1500,536 L1520,1700 Q1290,1730 1070,1700Z', C.navy, 'cyl');
    for (let i = 1; i < 6; i++) X.svg('path', { d: `M${1080 + i * 70},540 Q${1090 + i * 70},1100 ${1080 + i * 72},1700`, fill: 'none', stroke: '#1d2c58', 'stroke-width': 6 }, curtain);
    gsap.set(curtain, { svgOrigin: '1290 536' });
    K.flash(c18 + 0.02, 0.85, 0.2);
    const tp = W('promise', 'swears');
    mayor.prop(tp, 'halo', true);
    K.sparkles(mid, [[520, 520, 40], [380, 620, 30], [680, 600, 32]], tp, 0.8);
    X.sfx(tp, 'chime', { gain: 0.35 });
    const to = W('promise', 'and');
    K.orbit(ctx, to, 420, 0.8, { r: -1.5 });
    const tw = W('promise', 'roads') - 0.05;
    mayor.pose(tw - 0.1, 'rest', 0.2); mayor.face(tw - 0.1, 'smug'); mayor.turn(tw - 0.1, 1);
    const tc = X.wordEnd('promise', 'hands');
    mayor.walk(tw, tc, { x: 1250, y: 1760, s: 0.95 });
    X.tl.fromTo(curtain, { rotation: 0 }, { rotation: 4, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut', immediateRender: false, svgOrigin: '1290 536' }, tc);
    X.sfx(tc, 'swoosh', { gain: 0.3 });
    // the mayor ends up behind the curtain: move him under it in z-order at the right moment
    const haloGlow = X.svg('ellipse', { cx: 1290, cy: 470, rx: 120, ry: 28, fill: 'none', stroke: '#f6cf3e', 'stroke-width': 14, opacity: 0 }, mid);
    X.tl.set(haloGlow, { attr: { opacity: 1 } }, tc + 0.05);
    K.hook((t) => haloGlow.setAttribute('cy', (470 + Math.sin(t * 4) * 8).toFixed(1)), ctx.vis);
  });

  // ================================================================== SHOT 20 — Elm St, the day after: the tarp goes back on, the crews go on holiday
  const c20 = cut('punch');
  K.shot('after', c19, c20, { bg: '#d6effc', rig: { x: 0, y: -60, s: 1.05 }, drift: [-28, 0, 0.022] }, (ctx) => {
    const E = elm(ctx, { holes: '212', fixed: '400', bill: '$148.70', calX: 860, calY: 740, ledX: -2000 });
    const fixed = K.counter(E.sign.rows[1], '400');
    K.steamroller(E.mid, 720, 1335, 0.3);
    const tg = K.g(E.mid); K.tarp(tg, 720, 1335, 0.31);
    const tst = K.tf(tg, { x: 0, y: -1500, r: -12 });
    const mayor = toon(E.mid, ctx, MAYOR, { x: 260, y: 1760, s: 1.0, face: 'smug', pose: 'rest' });
    E.tear.flip(c19 + 0.15);
    mayor.pose(c19 + 0.2, 'waveR', 0.25); mayor.face(c19 + 0.2, 'happy');
    const tt = W('after', 'tarp') - 0.1, ton = W('after', 'on', 0);
    X.tl.fromTo(tst, { y: -1500, r: -12 }, { y: 0, r: 0, duration: ton - tt + 0.05, ease: 'power2.in', immediateRender: false }, tt);
    X.sfx(tt, 'swoosh', { dur: 0.5, gain: 0.3 });
    K.puff(E.mid, 720, 1330, ton + 0.06, { n: 7, r: 60, sfx: 'thud' });
    const crew = toon(E.mid, ctx, { ...GUS, shades: true }, { x: 1150, y: 1840, s: 0.95, face: 'happy', pose: 'holdR', flip: true, seed: 4 });
    const ball = K.g(crew.slotR, { transform: 'translate(0 70)' });
    K.se(ball, 0, 0, 70, 70, '#fffdf6', 'sphere');
    K.sp(ball, 'M0,-70 Q-40,0 0,70 Q-70,40 -70,0 Q-70,-40 0,-70Z', C.red, 'flat', { 'stroke-width': 3 });
    K.sp(ball, 'M0,-70 Q40,0 0,70 Q70,40 70,0 Q70,-40 0,-70Z', C.signBlue, 'flat', { 'stroke-width': 3 });
    const tc = W('after', 'crews') - 0.1;
    crew.walk(tc - 0.3, c20 + 0.3, { x: 640, y: 1840 });
    const th = W('after', 'holiday');
    fixed.roll(th, th + 0.4, 400, 0, { sfx: false }); X.sfx(th, 'blip_down', { gain: 0.3 });
    const ta = W('after', 'and');
    mayor.turn(ta - 0.12, -1); mayor.walk(ta - 0.1, c20 + 0.3, { x: -300, y: 1760 });
  });

  // ================================================================== SHOT 21 — callback punchline: your pothole gets re-elected too
  K.shot('punch', c20, END, { bg: '#d6effc', rig: { x: 0, y: 0, s: 1.03 }, drift: [0, 0, 0.015] }, (ctx) => {
    const E = elm(ctx, { holes: '212', fixed: '0', bill: '$148.70', calX: -2000, ledX: 150 });
    const holes = K.counter(E.sign.rows[0], '212', (v) => Math.round(v).toLocaleString('en-US'));
    const bill = K.counter(E.led.text, '$148.70', (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    holes.exp(c20 + 0.2, END, 212, 2191);
    K.move(ctx, c20 + 0.25, { x: 20, y: 30, s: 1.1 }, END - c20 - 0.25, 'sine.inOut');
    for (let tt = c20 + 0.2; tt < END - 0.1; tt += Math.max(0.05, 0.16 - 0.04 * (tt - c20))) X.sfx(tt, 'tick', { gain: 0.14 + 0.1 * (tt - c20) / (END - c20), pitch: 1 + 0.15 * (tt - c20) });
    X.sfx(c20 + 0.3, 'riser', { dur: END - c20 - 0.3, gain: 0.18 });
    bill.exp(c20 + 0.1, END, 148.7, 2191.73);
    const back = K.pothole(E.mid, 690, 1700, 520, 150, 41);
    const you = toon(E.mid, ctx, YOU, { x: 690, y: 1760, s: 1.16, face: 'tired', pose: 'rest' });
    you.set(0, { sink: 150 }, 0.01);
    const front = K.g(E.mid);
    X.svg('path', { d: 'M430,1700 Q690,1830 950,1700 Q960,1770 690,1800 Q420,1770 430,1700Z', fill: C.holeRim, stroke: C.ink, 'stroke-width': 4 }, front);
    X.svg('path', { d: 'M460,1712 Q690,1810 920,1712 Q830,1760 690,1764 Q550,1760 460,1712Z', fill: '#7f95c2' }, front);
    // the pothole wins too: a rosette on a stake in its rim
    const tr = W('punch', 'Re-elected');
    const stake = K.g(E.mid);
    X.svg('line', { x1: 400, y1: 1720, x2: 400, y2: 1500, stroke: C.ink, 'stroke-width': 14, 'stroke-linecap': 'round' }, stake);
    X.svg('line', { x1: 400, y1: 1720, x2: 400, y2: 1500, stroke: '#b98552', 'stroke-width': 8, 'stroke-linecap': 'round' }, stake);
    K.rosette(stake, 400, 1480, 0.7, 'RE-ELECTED', { above: true });
    gsap.set(stake, { scale: 0, transformOrigin: '400px 1720px' });
    X.tl.fromTo(stake, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, tr - 0.05);
    X.sfx(tr - 0.05, 'success', { gain: 0.35 });
    K.confetti(E.mid, tr, END + 0.1, { n: 70, seed: 9, pre: false });
    you.face(tr, 'sad'); you.look(tr, -12, 6);
    // a car splashes through behind him on the last words
    const car = K.car(E.mid, 0, 0, 0.8, '#e3743c');
    E.mid.insertBefore(car.g, back);
    const cst = K.tf(car.g, { x: -500, y: 1560 }); car.g.removeAttribute('transform');
    const tp = W('punch', 'years');
    X.tl.fromTo(cst, { x: -500 }, { x: 1700, duration: 0.8, ease: 'none', immediateRender: false }, tp - 0.4);
    X.sfx(tp - 0.4, 'whoosh', { dur: 0.7, gain: 0.3 });
    K.splash(E.mid, 690, 1690, tp, { n: 18, r: 120, sfx: 'thud' });
    you.set(tp + 0.05, { hr: -5 }, 0.2);
    X.sfx(tp + 0.05, 'drop', { gain: 0.25, pitch: 0.7 });
  });

  // ------------------------------------------------------------------ captions + texture
  K.captions(X.vo, { size: 37 });
  X.grain(0.035, 12);
  X.end(END);
});
