/* "Below the Sea" — map-documentary sample. Why a quarter of the Netherlands lies below sea level and how it is defended.
 * Outlines: Natural Earth 10m (public domain) via data/geo.js. Dams placed at their real coordinates (approx. ±1 km).
 * Shot list = hard cuts on sentence boundaries; the camera always creeps; events land on the noun. */
X.boot(async (X) => {
  await X.loadVO();
  K.init(X, { bar: 60, grain: 0.055 });
  const P = K.P, R = K.ramp;
  const L = (id) => X.line(id), W = (id, w, n = 0) => X.word(id, w, n);

  // ---------------------------------------------------------------- cut points (sentence boundaries)
  const c1 = L('h3').start - 0.1, c2 = L('q').start - 0.15, c3 = L('peat').start - 0.2, c4 = L('cycle').start - 0.1;
  const c5 = L('polder').start - 0.15, c6 = L('low').start - 0.15, c7 = L('dam').start - 0.15, c8 = L('flood').start - 0.1;
  const c9 = W('flood', 'Over') - 0.12, c10 = L('delta').start - 0.15, c11 = L('oster').start - 0.15, c12 = L('epi').start - 0.15;
  const cEnd = L('end').end + 0.3;
  const TEND = X.vo.duration || 75;

  // real dam alignments (lon, lat) — Afsluitdijk Den Oever→Zurich; Delta Works across the estuary mouths
  const DAMS = {
    afsluit: [[5.035, 52.936], [5.15, 52.982], [5.25, 53.035], [5.35, 53.078], [5.392, 53.098]],   // centreline of the NE land strip
    oster: [[3.712, 51.684], [3.698, 51.600]],       // Schouwen-Duiveland → Noord-Beveland (coast to coast in the NE data)
    brouwers: [[3.858, 51.741], [3.866, 51.796]],    // Schouwen-Duiveland → Goeree
    haring: [[4.035, 51.834], [4.045, 51.879]],      // Goeree → Voorne (the Nieuwe Waterweg is not resolved at 1:10m, so no Maeslantkering)
  };
  const pp = (ll) => K.proj(...ll);
  const damD = (k) => 'M' + DAMS[k].map(pp).map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L');
  function damBox(root, z, k, { width = 6, h = 12, c = K.DARK } = {}) {
    const a = pp(DAMS[k][0]), b = pp(DAMS[k][DAMS[k].length - 1]);
    const len = Math.max(6, Math.hypot(b[0] - a[0], b[1] - a[1])), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    const g = K.g3(root, { x: a[0], y: a[1], z, rz: ang });
    return K.box(g, { x: 0, y: -width / 2, w: len, d: width, h, c });
  }
  const mainland = GEO.nl.match(/M[^M]+/g).sort((a, b) => b.length - a.length)[0];   // longest ring = mainland coast
  const MAROON = { top: '#a52a3e', s: '#6e1626', e: '#5a1120', n: '#3d0b16', w: '#62131f' };

  // ================================================================ SET: terrain tile (hook)
  const sTile = K.set('tile', { bg: '#161d23' });
  K.floor(sTile, { size: 5600, c0: '#a3afb4', c1: '#6e7d85', c2: '#34434f', c3: '#161d23', spread: 1.8 });
  const tile = K.terrain(sTile, { T: 30 });
  const tw = (lon, lat) => tile.w(...K.proj(lon, lat));
  const wall = K.extrudeStroke(tile.plateLike, { d: GEO.nl, width: 4.5, maskBlack: [GEO.be, GEO.de], cut: 14, n: 7, h: 9, top: '#2e2a27', side: '#161412' });
  const tDams = ['afsluit', 'haring', 'brouwers', 'oster'].map((k) => damBox(tile.root, tile.T, k, { width: 7, h: 13 }));
  const tWall = W('h3', 'this'), tKeep = W('h3', 'keep');
  K.on((t) => {
    if (!K.within(t, 0, c2)) return;
    wall.setH(9 * R(t, tWall, 1.1, 'power3.out'));
    tDams.forEach((b, i) => b.setH(13 * R(t, tKeep - 0.2 + i * 0.12, 0.6, 'power3.out')));
  });
  const [hx, hy] = tw(5.05, 52.25), [sx, sy] = tw(3.72, 52.5), [ox, oy] = tw(5.35, 52.42);
  K.shot('tile', 0, c1, { keys: [
    { t: 0, x: hx, y: hy, z: 30, rx: 61, rz: -74, d: -380, lens: 1000, dof: 0.3 },
    { t: 3.3, rz: -24, d: -80, e: 0.05 },
    { t: c1, x: sx, y: sy, rx: 40, rz: 6, d: 640, dof: 0.55, ease: 'power3.inOut' }] });
  K.shot('tile', c1, c2, { from: { x: ox, y: oy, z: 30, rx: 2, rz: -13, d: 520, lens: 1700, dof: 0.1 }, to: { x: ox - 60, rz: 10, d: 660 } });
  X.sfx(0.05, 'woosh_low', { dur: 3.2, gain: 0.32 });
  X.sfx(3.3, 'whoosh', { dur: 2.2, gain: 0.26 });
  X.sfx(tWall, 'woosh_low', { dur: 1.2, gain: 0.3 });
  tDams.forEach((b, i) => X.sfx(tKeep - 0.2 + i * 0.12, 'thud', { gain: 0.14, pitch: 0.8 + i * 0.05 }));

  // ================================================================ SET: gallery corridor (the question)
  const sGal = K.set('gallery', { bg: '#000' });
  const ROWS = 7, GL = 2800, GY0 = 300, gal = K.gallery(sGal, { w: 760, h: 430, L: GL, rows: ROWS, y0: GY0 });
  const endY = GY0 - GL + 1.5;
  const big = K.frame3d(sGal, { x: -212, y: endY, z: 100, w: 360, h: 260, draw: A.engravingPolder, mat: 20, frame: 12 });
  const spot = K.vplane(sGal, { x: -330, y: endY + 1, z: 40, w: 660, h: 390, style: { background: 'radial-gradient(ellipse 50% 55% at 50% 42%, rgba(255,246,230,.22), rgba(0,0,0,0) 100%)', opacity: 0 } });
  const side = [];
  [['plan', -700], ['section', -1300], ['grid', -1900]].forEach(([kind, y], i) => {
    side.push(K.frame3d(sGal, { x: -379, y, z: 130, w: 200, h: 150, rz: -90, draw: (s, w, h) => A.planPrint(s, w, h, kind) }));
    side.push(K.frame3d(sGal, { x: 379, y: y - 262 - 120, z: 130, w: 200, h: 150, rz: 90, draw: (s, w, h) => A.planPrint(s, w, h, ['grid', 'plan', 'section'][i]) }));
  });
  const tLights = L('q').start + 0.05, STEP = 0.25;
  K.on((t) => {
    if (!K.within(t, c2, c3)) return;
    gal.setLights((i) => (t >= tLights + i * STEP ? 1 : 0), t >= tLights + ROWS * STEP ? 1 : 0);
    const endLit = R(t, tLights + ROWS * STEP, 0.3, 'power1.out');
    big.setLit(endLit); spot.style.opacity = endLit;
    side.forEach((f, i) => f.setLit(t >= tLights + (1 + Math.floor(i / 2) * 1.5) * STEP ? 1 : 0));
  });
  K.shot('gallery', c2, c3, { from: { x: 0, y: -1080, z: 205, rx: 89.5, rz: -1.5, d: 0, lens: 820, dof: 0.12 }, to: { y: -1560, rz: 1.5 }, e: 0.04 });
  for (let i = 0; i <= ROWS; i++) X.sfx(tLights + i * STEP, 'click', { gain: 0.26, pitch: 0.55 + (i % 3) * 0.04 });
  X.sfx(tLights, 'thud', { gain: 0.18, pitch: 0.6 });

  // ================================================================ SET: cross-section diorama (peat subsidence)
  const sSec = K.set('section', { bg: '#161d23' });
  K.floor(sSec, { size: 5000, c0: '#a0abb0', c1: '#6b7a82', c2: '#33424e', c3: '#161d23', spread: 1.8 });
  const SX0 = -560, SX1 = 560, SD = 320, ZB = 22, ZS = ZB + 110, SEA = ZS + 100;
  const SAND = { top: '#c8b088', s: 'radial-gradient(circle, #9d8762 1px, transparent 1.6px) 0 0/7px 7px, #b9a27a', e: '#9a8461', n: '#7f6c4f', w: '#a99370' };
  const ACR = { top: '#151315', s: 'linear-gradient(to bottom, #5c5e64 0, #222226 2px, #0b0a0b)', e: '#0d0c0d', n: '#0a090a', w: '#121113' };
  K.shadow(sSec, { x: SX0 - 20, y: -SD / 2 - 20, w: SX1 - SX0 + 40, h: SD + 40, op: 0.6, spread: 80 });
  K.box(sSec, { x: SX0 - 20, y: -SD / 2 - 20, z: 0, w: SX1 - SX0 + 40, d: SD + 40, h: ZB, c: ACR });
  K.box(sSec, { x: SX0, y: -SD / 2, z: ZB, w: SX1 - SX0, d: SD, h: ZS - ZB, c: SAND });
  const WATER = { top: 'linear-gradient(100deg, rgba(150,182,204,.78), rgba(110,146,172,.7))', s: 'linear-gradient(to bottom, rgba(120,156,182,.72), rgba(54,86,112,.82))', e: 'rgba(74,108,134,.7)', n: 'rgba(60,90,115,.7)', w: 'rgba(84,118,144,.72)' };
  K.box(sSec, { x: SX0, y: -SD / 2, z: ZS, w: 330, d: SD, h: SEA - ZS, c: WATER });
  K.box(sSec, { x: SX0 + 330, y: -SD / 2, z: ZS, w: 120, d: SD, h: 150, c: SAND });
  K.box(sSec, { x: SX0 + 352, y: -SD / 2, z: ZS + 150, w: 76, d: SD, h: 24, c: SAND });
  const PX0 = SX0 + 450, PW = SX1 - PX0;
  const PEAT = { top: '#61773d', s: 'linear-gradient(to bottom, #5d7838 0 7px, transparent 7px), repeating-linear-gradient(to bottom, #4a3425 0 5px, #3b291d 5px 9px, #56402d 9px 12px)',
    e: 'repeating-linear-gradient(to bottom, #3e2b1f 0 5px, #33241a 5px 9px)', n: '#2a1d14', w: '#3a291d' };
  const peat = K.box(sSec, { x: PX0, y: -SD / 2, z: ZS, w: PW, d: SD, h: 135, c: PEAT });
  peat.F.t.style.background = 'repeating-linear-gradient(to right, #6a8043 0 36px, #5f763b 36px 70px, #74894a 70px 104px)';
  const ditches = K.div({ left: '0px', top: '0px', width: '100%', height: '100%', opacity: 0,
    background: 'repeating-linear-gradient(to right, transparent 0 66px, #33506a 66px 71px)' }, peat.F.t);
  const wt = K.div({ left: '0px', width: '100%', height: '3px', background: 'rgba(120,175,220,.9)', boxShadow: '0 0 6px rgba(120,175,220,.6)' }, peat.F.s);
  // labels + sea-level line on a transparent plane just in front of the model
  const LH = 340, lab = K.vplane(sSec, { x: SX0, y: SD / 2 + 2, z: 0, w: SX1 - SX0, h: LH });
  const lsvg = K.s('svg', { width: SX1 - SX0, height: LH, viewBox: `0 0 ${SX1 - SX0} ${LH}` }, lab);
  lsvg.style.position = 'absolute'; lsvg.style.overflow = 'visible';
  const vz = (z) => LH - z;
  const seaLine = K.s('line', { x1: 0, y1: vz(SEA), x2: SX1 - SX0, y2: vz(SEA), stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '10 7', opacity: 0.9 }, lsvg);
  const tlab = (x, z, text, size = 17, anchor = 'start', op = 1) => K.s('text', { x, y: vz(z), 'font-family': 'Montserrat', 'font-weight': 600, 'font-size': size, 'letter-spacing': size * 0.25, fill: '#fff', opacity: op, 'text-anchor': anchor, text }, lsvg);
  tlab(24, SEA + 12, 'SEA LEVEL', 16);
  tlab(24, SEA - 50, 'NORTH SEA', 17);
  tlab(352, ZS + 194, 'DUNES', 15);
  tlab(24, ZB + 46, 'SAND', 16, 'start', 0.85);
  const peatLab = tlab(PX0 - SX0 + 26, ZS + 60, 'PEAT', 17);
  const tDrain = W('peat', 'drained'), tShrink = W('peat', 'shrinks'), tDrop1 = W('cycle', 'dropped'), tDrain2 = W('cycle', 'draining'), tDrop2 = W('cycle', 'dropped', 1);
  K.on((t) => {
    if (!K.within(t, c3, c5)) return;
    const hp = 135 - 27 * R(t, tShrink, 0.9) - 20 * R(t, tDrop1, 0.7) - 30 * R(t, tDrop2, 0.8);
    peat.setH(hp);
    const zwt = ZS + 118 - 38 * R(t, tDrain, 0.9) - 22 * R(t, tShrink, 0.9) - 28 * R(t, tDrain2, 0.8) - 18 * R(t, tDrop2, 0.8);
    wt.style.top = Math.max(4, hp - (zwt - ZS)).toFixed(1) + 'px';
    ditches.style.opacity = (0.75 * R(t, tDrain, 0.5, 'power1.out') + 0.25 * R(t, tDrain2, 0.5)).toFixed(3);
    peatLab.setAttribute('y', vz(ZS + Math.min(60, hp * 0.45)).toFixed(1));
  });
  K.shot('section', c3, c4, { from: { x: -60, y: 0, z: 190, rx: 73, rz: -46, d: -260, lens: 1150, dof: 0.45 }, to: { x: 190, rz: -2, d: -60 } });
  K.shot('section', c4, c5, { from: { x: -90, y: 0, z: 210, rx: 80, rz: 30, d: 760, lens: 1700, dof: 0.7 }, to: { x: -10, rz: 6, d: 880 } });
  X.sfx(tDrain, 'drop', { gain: 0.16, pitch: 0.7 });
  X.sfx(tShrink, 'woosh_low', { dur: 1, gain: 0.3 });
  X.sfx(tDrop1, 'thud', { gain: 0.28, pitch: 0.7 });
  X.sfx(tDrain2, 'bubble', { gain: 0.12, pitch: 0.6 });
  X.sfx(tDrop2, 'thud', { gain: 0.32, pitch: 0.6 });

  // ================================================================ SET: clay polder model on a blue sea
  const sPol = K.set('polder', { bg: '#1b2b3d' });
  K.claySea(sPol, {});
  const FW = 720, FD = 460, DW = 34, DH = 44;
  K.shadow(sPol, { x: -FW / 2 - DW, y: -FD / 2 - DW, w: FW + 2 * DW, h: FD + 2 * DW, op: 0.35, spread: 70 });
  const field = K.box(sPol, { x: -FW / 2, y: -FD / 2, z: 0, w: FW, d: FD, h: 10 });
  field.F.t.style.background = 'repeating-linear-gradient(to right, transparent 0 118px, rgba(84,124,156,.55) 118px 122px), repeating-linear-gradient(to bottom, #eceff1 0 40px, #e1e5e8 40px 42px)';
  // farm road and farmsteads on the polder floor (white clay)
  K.box(sPol, { x: -FW / 2 + 10, y: 40, z: 10, w: FW - 20, d: 10, h: 2, c: { top: '#dde1e4', s: '#c9ced3', e: '#bfc5ca', n: '#b5bbc1', w: '#c4c9ce' } });
  [[-280, 18], [-170, 64], [-40, 18], [90, 64], [210, 18], [300, 64]].forEach(([x, y], i) => {
    K.box(sPol, { x, y: y - 8, z: 10, w: 24 + (i % 2) * 8, d: 14, h: 9 });
    K.box(sPol, { x: x + 2, y: y - 6, z: 19, w: 20 + (i % 2) * 8, d: 10, h: 5, c: { top: '#f5f6f7', s: '#d9dde0', e: '#c3c9ce', n: '#aeb5bb', w: '#ccd1d5' } });
  });
  const film = K.flat(sPol, { x: -FW / 2, y: -FD / 2, z: 24, w: FW, h: FD, style: { background: 'linear-gradient(120deg, rgba(120,160,190,.62), rgba(86,126,160,.62))' } });
  const outer = [[-1600, -1600, 3200, 1600 - FD / 2 - DW], [-1600, FD / 2 + DW, 3200, 1600 - FD / 2 - DW], [-1600, -FD / 2 - DW, 1600 - FW / 2 - DW, FD + 2 * DW], [FW / 2 + DW, -FD / 2 - DW, 1600 - FW / 2 - DW, FD + 2 * DW]];
  const outerEls = outer.map(([x, y, w, h]) => K.flat(sPol, { x, y, z: 32, w, h, style: { background: 'repeating-linear-gradient(100deg, rgba(255,255,255,0) 0 26px, rgba(255,255,255,.12) 26px 29px), rgba(120,158,186,.42)' } }));
  K.on((t) => { if (K.within(t, c5, c6)) outerEls.forEach((e) => (e.style.backgroundPosition = `${(t * 18).toFixed(1)}px 0`)); });
  const dikes = [[-FW / 2 - DW, -FD / 2 - DW, FW + 2 * DW, DW], [-FW / 2 - DW, FD / 2, FW + 2 * DW, DW], [-FW / 2 - DW, -FD / 2, DW, FD], [FW / 2, -FD / 2, DW, FD]]
    .map(([x, y, w, d]) => K.box(sPol, { x, y, z: 0, w, d, h: DH }));
  const mills = [K.windmill(sPol, { x: -FW / 2 - DW / 2, y: -FD / 2 - DW / 2, z: DH, s: 1.0, face: 0 }), K.windmill(sPol, { x: FW / 2 + DW / 2, y: -FD / 2 - DW / 2, z: DH, s: 0.85, face: 0 })];
  const tDikes = W('polder', 'Dikes'), tMills = W('polder', 'windmills'), tPump = W('polder', 'pumped'), tDry = W('polder', 'dry');
  K.on((t) => {
    if (!K.within(t, c5, c6)) return;
    dikes.forEach((b, i) => b.setH(DH * R(t, tDikes - 0.15 + i * 0.12, 0.7, 'power3.out')));
    mills.forEach((m, i) => { const t0 = tMills - 0.1 + i * 0.18; m.setS(R(t, t0, 0.55, 'back.out(1.7)')); m.setSail(Math.max(0, t - t0) * 62 + i * 30); });
    const d = R(t, tPump, tDry - tPump + 0.6, 'power1.inOut');
    film.style.transform = `translate3d(${-FW / 2}px,${-FD / 2}px,${(24 - 13 * d).toFixed(2)}px)`;
    film.style.opacity = (1 - d).toFixed(3);
  });
  K.shot('polder', c5, c6, { from: { x: -60, y: -20, z: 30, rx: 58, rz: -46, d: 200, lens: 1300, dof: 0.45 }, to: { x: 10, rz: -16, d: 360 } });
  dikes.forEach((b, i) => X.sfx(tDikes - 0.15 + i * 0.12, 'slide', { gain: 0.14, pitch: 0.7 }));
  X.sfx(tMills - 0.1, 'whoosh', { dur: 0.7, gain: 0.18 });

  // ================================================================ SET: the map plate (today → 1932 → Delta Works)
  const sStu = K.set('studio', { bg: '#151c22' });
  K.floor(sStu, { size: 5200, spread: 1.7 });
  const plate = K.plate(sStu, { labels: [
    { at: 'northsea', text: 'North Sea', size: 26, spacing: 0.42 },
    { at: 'amsterdam', text: 'Amsterdam', dx: -16, dy: -12, size: 14, anchor: 'end' },
    { at: 'rotterdam', text: 'Rotterdam', dx: 10, dy: 24, size: 14 },
    { at: 'germany', text: 'Germany', size: 20, fill: '#8b8282' },
    { at: 'belgium', text: 'Belgium', size: 20, fill: '#8b8282' }] });
  plate.labels.svg.querySelectorAll('circle');
  const dots = plate.layer(0.7);
  ['amsterdam', 'rotterdam'].forEach((k) => K.s('circle', { cx: GEO.pts[k][0], cy: GEO.pts[k][1], r: 3, fill: '#fff' }, dots.svg));
  // 1932 state: the Flevoland polders are still water — a removable acrylic "cover"
  const cover = plate.layer(0.25);
  const cid = K.uid('cv'), cm = K.s('mask', { id: cid, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: GEO.W, height: GEO.H }, cover.defs);
  K.s('path', { d: GEO.flevoland, fill: '#fff' }, cm); K.s('path', { d: GEO.lakes, fill: '#000', 'fill-rule': 'evenodd' }, cm);
  K.s('path', { d: GEO.flevoland, fill: P.acrylic, stroke: P.acrylic, 'stroke-width': 3, mask: `url(#${cid})` }, cover.svg);
  const fp = GEO.pts.flevoland, hole = GEO.lakes.match(/M[^M]+/g).map((d) => [d, K.bbox(d)]).filter(([, b]) => b[0] < fp[0] && b[2] > fp[0] && b[1] < fp[1] && b[3] > fp[1]).sort((a, b) => a[0].length - b[0].length)[0];
  if (hole) K.s('path', { d: hole[0], fill: 'none', stroke: P.acrylic, 'stroke-width': 3.2 }, cover.svg);
  const flevo = K.extrude(plate, { d: GEO.flevoland, mask: { white: [GEO.flevoland], black: [GEO.lakes] }, n: 11, h: 24, top: P.yellow, side: P.yellowSide, hatch: 'rgba(255,255,255,.45)' });
  const flevoLab = K.label(flevo.top.svg, { at: 'flevoland', text: 'Flevoland', size: 15, dy: 4, fill: '#3b3014' });
  const neonL = plate.layer(1.6);
  const neon = K.neon(neonL, damD('afsluit'), { width: 2.6, glow: 13 });
  const da = pp(DAMS.afsluit[0]), db = pp(DAMS.afsluit[DAMS.afsluit.length - 1]), dang = Math.atan2(db[1] - da[1], db[0] - da[0]) * 180 / Math.PI;
  const damLab = K.label(neonL.svg, { at: [(da[0] + db[0]) / 2, (da[1] + db[1]) / 2], text: 'Afsluitdijk · 32 km', size: 13, dy: -12, rot: dang, fill: '#ffd2a8' });
  const ijLab = K.label(plate.labels.svg, { at: K.proj(5.21, 52.86), text: 'IJsselmeer', size: 14, fill: '#d9d4d4' });
  const zuiderLab = K.label(plate.labels.svg, { at: K.proj(5.36, 52.64), text: 'Zuiderzee', size: 16, fill: '#d9d4d4' });
  const zeeLab = K.label(plate.labels.svg, { at: 'zeeland', text: 'Zeeland', size: 15, dx: 16, dy: 34 });
  const marker = K.marker(plate.layer(0.9), { at: 'zuidplas', text: 'Lowest point', sub: 'nearly 7 m below sea level', dx: 46, dy: -70, size: 15 });
  const deltaKeys = ['haring', 'brouwers', 'oster'];
  const deltas = deltaKeys.map((k) => damBox(plate.root, plate.zTop, k, { width: 8, h: 15, c: MAROON }));
  // per-shot colour keys printed on the plate (north key for 1932, south-west key for the Delta Works)
  const legendN = K.legend(plate, { x: 455, y: 432, size: 17, rows: [{ color: P.orange, text: 'Afsluitdijk (1932)' }, { color: P.yellow, text: 'Reclaimed land' }] });
  const legend = K.legend(plate, { x: 405, y: 600, size: 19, rows: [
    { color: P.orange, text: 'Afsluitdijk (1932)' }, { color: P.yellow, text: 'Reclaimed land' }, { color: '#c4485c', text: 'Delta Works' }] });
  const tMark = W('low', 'lowest'), tDam = W('dam', 'dam'), tInland = W('dam', 'inland'), tFlev = W('flevo', 'pumped'), tProv = W('flevo', 'province');
  const tDams2 = W('delta', 'dams'), tZee = W('delta', 'estuaries');
  K.on((t) => {
    if (!K.within(t, c6, c11)) return;
    const in1932 = t >= c7;
    marker.set(t < c7 ? R(t, tMark, 0.8, 'power2.out') : 0, t - tMark);
    neon.set(in1932 ? R(t, tDam - 0.1, 1.5, 'none') : 0, t > tDam + 2.4 ? 0.65 + 0.15 * Math.sin(t * 3) : 1);
    damLab.style.opacity = in1932 ? R(t, tDam + 1.3, 0.5) : 0;
    const coverOp = in1932 ? 1 - R(t, tFlev, 1.2, 'power1.inOut') : 0;
    cover.holder.style.opacity = coverOp.toFixed(3);
    flevo.setH(in1932 ? 24 * R(t, tFlev + 0.1, 1.4, 'power3.out') : 0);
    flevo.top.holder.style.opacity = in1932 && t >= tFlev ? 1 : 0;
    flevoLab.style.opacity = R(t, tProv - 0.2, 0.5);
    zuiderLab.style.opacity = in1932 && t < tInland + 1.6 ? R(t, c7 + 0.4, 0.6) : 0;
    ijLab.style.opacity = in1932 ? R(t, tInland + 1.6, 0.6) : 1;
    deltas.forEach((b, i) => b.setH(t < c10 ? 0 : 15 * R(t, tDams2 - 0.25 + i * 0.16, 0.6, 'power3.out')));
    zeeLab.style.opacity = t >= c10 ? R(t, tZee - 0.3, 0.6) : 0;
    legendN[0].style.opacity = in1932 && t < c8 ? R(t, tDam + 1.0, 0.5) : 0;
    legendN[1].style.opacity = in1932 && t < c8 ? R(t, tFlev + 0.8, 0.5) : 0;
    legend[0].style.opacity = legend[1].style.opacity = t >= c10 ? 1 : 0;
    legend[2].style.opacity = t >= c10 ? R(t, tDams2 + 0.4, 0.5) : 0;
  });
  const pt = (lon, lat) => plate.w(...K.proj(lon, lat));
  const [zx, zy] = plate.pt('zuidplas'), [ix, iy] = pt(5.2, 52.93), [fx, fy] = pt(5.5, 52.55), [ex, ey] = pt(3.98, 51.74);
  K.shot('studio', c6, c7, { from: { x: zx + 40, y: zy - 30, z: 20, rx: 63, rz: -32, d: 600, lens: 1200, dof: 0.75 }, to: { x: zx + 110, rz: -10, d: 790 } });
  const c7b = L('flevo').start - 0.12;
  K.shot('studio', c7, c7b, { keys: [
    { t: 0, x: ix - 110, y: iy + 40, z: 20, rx: 54, rz: 36, d: 560, lens: 1200, dof: 0.6 },
    { t: tDam - c7 + 0.2, x: ix - 20, y: iy + 20, rz: 18, d: 700, e: 0.05 },
    { t: c7b - c7, x: ix + 10, rz: 10, d: 740, e: 0.05 }] });
  K.shot('studio', c7b, c8, { from: { x: fx - 60, y: fy + 30, z: 20, rx: 46, rz: -52, d: 560, lens: 1100, dof: 0.55 }, to: { x: fx + 20, rz: -30, d: 720 } });
  K.shot('studio', c10, c11, { from: { x: ex - 50, y: ey, z: 20, rx: 62, rz: -42, d: 780, lens: 1200, dof: 0.8 }, to: { x: ex + 30, rz: -20, d: 930 } });
  X.sfx(tMark, 'blip_down', { gain: 0.16 });
  X.sfx(tDam - 0.2, 'riser', { dur: 1.6, gain: 0.22 });
  X.sfx(tDam + 1.4, 'thud', { gain: 0.22, pitch: 0.7 });
  X.sfx(tFlev, 'woosh_low', { dur: 1.4, gain: 0.32 });
  deltas.forEach((b, i) => X.sfx(tDams2 - 0.25 + i * 0.16, 'thud', { gain: 0.2, pitch: 0.65 + i * 0.05 }));

  // ================================================================ archival plates (1953)
  K.set('blank', { bg: '#000' });
  K.shot('blank', c8, c10);
  K.archival(X, c8, c9, A.flood, { push: 3.6, pan: 22, seed: 4 });
  K.archival(X, c9, c10, A.breach, { push: 4.2, pan: -18, seed: 9 });
  X.sfx(c8, 'impact', { gain: 0.3, pitch: 0.6 });
  X.sfx(c8 + 0.2, 'woosh_low', { dur: 4.5, gain: 0.25 });
  X.sfx(c9, 'woosh_low', { dur: 3, gain: 0.3, pitch: 0.8 });

  // ================================================================ SET: clay model of the Oosterschelde barrier
  const sClay = K.set('clay', { bg: '#1b2b3d' });
  K.claySea(sClay, {});
  const NPIL = 15, SPAN = 112, PWD = 30, PD = 52, PHt = 150, ZW = 62, sill = 18;
  const x0p = -((NPIL - 1) / 2) * SPAN;
  K.box(sClay, { x: x0p - 70, y: -60, z: 0, w: (NPIL - 1) * SPAN + 140, d: 120, h: sill, c: { top: '#8d969e', s: '#6f7880', e: '#5d656c', n: '#4b5258', w: '#666e75' } });
  const PIL = { top: '#f3f5f6', s: '#d6dbdf', e: '#a9b1b9', n: '#949da6', w: '#bcc3ca' };
  for (let i = 0; i < NPIL; i++) { K.box(sClay, { x: x0p + i * SPAN - PWD / 2 - 6, y: -PD / 2 - 8, z: sill, w: PWD + 12, d: PD + 16, h: 26, c: PIL }); K.box(sClay, { x: x0p + i * SPAN - PWD / 2, y: -PD / 2, z: sill, w: PWD, d: PD, h: PHt, c: PIL }); }
  const deck = K.box(sClay, { x: x0p - 70, y: -PD / 2 - 8, z: sill + PHt, w: (NPIL - 1) * SPAN + 140, d: PD + 16, h: 14, c: PIL });
  K.div({ left: '0px', top: '24px', width: '100%', height: '20px', background: '#8f979e' }, deck.F.t);
  for (let i = 0; i < 6; i++) K.box(sClay, { x: x0p - 30 + i * 180, y: -PD / 2 - 4, z: sill + PHt + 14, w: 3, d: 3, h: 22 });
  const STEEL = { top: '#dfe5ea', s: 'repeating-linear-gradient(to bottom, #c9d1d8 0 9px, #b7c0c8 9px 11px)', e: '#a9b2ba', n: '#97a1aa', w: '#b0b9c1' };
  const gates = [];
  for (let i = 0; i < NPIL - 1; i++) {
    const gw = SPAN - PWD - 4;
    const b = K.box(sClay, { x: x0p + i * SPAN + PWD / 2 + 2, y: 6, z: 0, w: gw, d: 9, h: 70, c: STEEL });
    gates.push({ b, x: x0p + i * SPAN + PWD / 2 + 2 });
  }
  const seaW = K.flat(sClay, { x: -1600, y: PD / 2, z: ZW, w: 3200, h: 1500, style: { background: 'linear-gradient(to bottom, rgba(150,184,206,.5), rgba(96,132,160,.55))' } });
  const waves = K.div({ left: '0px', top: '0px', width: '100%', height: '100%', background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0) 0 22px, rgba(255,255,255,.16) 22px 24px)' }, seaW);
  K.flat(sClay, { x: -1600, y: -1500 - PD / 2, z: ZW, w: 3200, h: 1500, style: { background: 'linear-gradient(to top, rgba(150,184,206,.5), rgba(96,132,160,.5))' } });
  const flow = K.flat(sClay, { x: x0p, y: -420, z: ZW + 0.6, w: (NPIL - 1) * SPAN, h: 840, style: { background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0) 0 30px, rgba(255,255,255,.28) 30px 32px)' } });
  const tDrops = W('oster', 'drops'), tStorm = W('oster', 'storm');
  K.on((t) => {
    if (!K.within(t, c11, c12)) return;
    gates.forEach((g, i) => {
      const z = 88 - 70 * R(t, tDrops - 0.1 + i * 0.09, 0.5, 'power2.in');
      g.b.g.style.transform = `translate3d(${g.x}px,6px,${z.toFixed(2)}px)`;
    });
    const closed = R(t, tDrops + 0.3, 0.9);
    flow.style.backgroundPosition = `0 ${(-t * 70).toFixed(1)}px`;
    flow.style.opacity = (1 - closed).toFixed(3);
    const surge = 12 * R(t, tDrops + 0.6, 2.4, 'sine.inOut');
    seaW.style.transform = `translate3d(-1600px,${PD / 2}px,${(ZW + surge).toFixed(2)}px)`;
    waves.style.backgroundPosition = `0 ${(-t * (14 + 30 * closed)).toFixed(1)}px`;
  });
  K.shot('clay', c11, c12, { from: { x: -260, y: 0, z: 85, rx: 71, rz: 62, d: 420, lens: 1300, dof: 0.55 }, to: { x: -140, rz: 38, d: 570 } });
  gates.forEach((g, i) => X.sfx(tDrops - 0.1 + i * 0.09 + 0.45, 'stamp', { gain: 0.11, pitch: 0.6 + (i % 3) * 0.05 }));
  X.sfx(tDrops + 0.4, 'woosh_low', { dur: 2, gain: 0.25 });

  // ================================================================ SET: identical plates side by side (epilogue)
  const sRow = K.set('row', { bg: '#151c22' });
  K.floor(sRow, { size: 4000, sx: 1.6, spread: 1.8 });
  const RS = 0.5, GAPX = 880;
  const rowPlates = [0, 1, 2, 3].map((i) => K.plate(sRow, { cx: (i - 1.5) * GAPX, cy: 0, s: RS, labels: [{ at: 'northsea', text: 'North Sea', size: 30, spacing: 0.42 }] }));
  K.neon(rowPlates[1].layer(1.6), damD('afsluit'), { width: 3, glow: 14 }).set(1, 0.7);
  K.extrude(rowPlates[1], { d: GEO.flevoland, mask: { white: [GEO.flevoland], black: [GEO.lakes] }, n: 9, h: 24, top: P.yellow, side: P.yellowSide, hatch: 'rgba(255,255,255,.45)' });
  deltaKeys.forEach((k) => damBox(rowPlates[2].root, rowPlates[2].zTop, k, { width: 9, h: 14, c: MAROON }));
  K.neon(rowPlates[3].layer(1.6), damD('afsluit'), { width: 3, glow: 14 }).set(1, 0.7);
  K.extrude(rowPlates[3], { d: GEO.flevoland, mask: { white: [GEO.flevoland], black: [GEO.lakes] }, n: 9, h: 24, top: P.yellow, side: P.yellowSide });
  deltaKeys.forEach((k) => damBox(rowPlates[3].root, rowPlates[3].zTop, k, { width: 9, h: 14, c: MAROON }));
  // "holding the line": the defended coast lights up on every plate
  const lines = rowPlates.map((p) => {
    const Lr = p.layer(2.2);
    const mid = K.uid('cm'), m = K.s('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: GEO.W, height: GEO.H }, Lr.defs);
    K.s('rect', { x: 0, y: 0, width: GEO.W, height: GEO.H, fill: '#fff' }, m);
    K.s('path', { d: (GEO.be || '') + (GEO.de || ''), fill: '#000', stroke: '#000', 'stroke-width': 18 }, m);
    const n = K.neon(Lr, mainland, { width: 3.6, glow: 18 });
    n.g.setAttribute('mask', `url(#${mid})`);
    return n;
  });
  const tLine = W('end', 'Holding') + 0.35;
  K.on((t) => {
    if (!K.within(t, c12, cEnd)) return;
    lines.forEach((n, i) => n.set(R(t, tLine - 0.35 + i * 0.12, 1.8, 'power1.inOut')));
  });
  K.shot('row', c12, cEnd, { from: { x: -1250, y: 40, z: 12, rx: 66, rz: -20, d: 440, lens: 1100, dof: 0.95 }, to: { x: 120, rz: 2, d: 540 }, e: 0.03 });
  X.sfx(c12, 'whoosh', { dur: 1.2, gain: 0.14 });
  X.sfx(tLine - 0.35, 'riser', { dur: 1.8, gain: 0.2 });

  // ================================================================ end card (hard cut, source credit)
  K.shot('blank', cEnd, TEND + 1);
  K.endCard(X, cEnd, [
    { text: 'Coastlines and borders: Natural Earth (public domain).' },
    { text: 'Every map, model and illustration in this film is an original render.', op: 0.8 }], { size: 32 });

  X.end(TEND);
});
