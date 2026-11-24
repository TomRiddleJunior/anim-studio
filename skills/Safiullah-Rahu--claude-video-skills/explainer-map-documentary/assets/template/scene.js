/* map-documentary starter (≈14 s): deictic hook on a terrain tile → acrylic map plate with a neon line drawing on the
 * noun → lights-on gallery → source-credit end card. Replace data/geo.js with your region (assets/tools/extract_geo.py). */
X.boot(async (X) => {
  await X.loadVO();
  K.init(X, { bar: 60, grain: 0.055 });
  const R = K.ramp, L = (id) => X.line(id), W = (id, w, n = 0) => X.word(id, w, n);
  const c1 = L('h2').start - 0.15, c2 = L('h3').start - 0.15, cEnd = L('h3').end + 0.5, TEND = X.vo.duration || 14;

  // ---- shot 1: terrain tile on a grey studio floor, slow orbit (one picture per "This is…")
  const sTile = K.set('tile', { bg: '#161d23' });
  K.floor(sTile, { size: 5600, c0: '#a3afb4', c1: '#6e7d85', c2: '#34434f', c3: '#161d23', spread: 1.45 });
  const tile = K.terrain(sTile, { T: 30 });
  const [hx, hy] = tile.w(...K.proj(5.05, 52.25));
  K.shot('tile', 0, c1, { from: { x: hx, y: hy, z: 30, rx: 60, rz: -50, d: -300, lens: 1200, dof: 0.3 }, to: { rz: -20, d: -60 } });
  X.sfx(0.05, 'woosh_low', { dur: 2.5, gain: 0.3 });

  // ---- shot 2: the acrylic plate; the Afsluitdijk (real alignment) draws itself in orange neon on "dam"
  const sStu = K.set('studio', { bg: '#151c22' });
  K.floor(sStu, { size: 5200, spread: 1.45 });
  const plate = K.plate(sStu, { labels: [{ at: 'northsea', text: 'North Sea', size: 26, spacing: 0.42 }, { at: 'amsterdam', text: 'Amsterdam', dx: -16, dy: -12, size: 14, anchor: 'end' }] });
  const dam = 'M' + [[5.035, 52.936], [5.15, 52.982], [5.25, 53.035], [5.35, 53.078], [5.392, 53.098]].map((p) => K.proj(...p).map((v) => v.toFixed(1)).join(',')).join('L');
  const neon = K.neon(plate.layer(1.6), dam, { width: 2.6, glow: 13 });
  const key = K.legend(plate, { x: 455, y: 432, size: 17, rows: [{ color: K.P.orange, text: 'Afsluitdijk (1932)' }] });
  const tDam = W('h2', 'dam');
  K.on((t) => { neon.set(R(t, tDam - 0.1, 1.4, 'none')); key[0].style.opacity = R(t, tDam + 1, 0.5); });
  const [ix, iy] = plate.w(...K.proj(5.2, 52.93));
  K.shot('studio', c1, c2, { from: { x: ix - 110, y: iy + 40, z: 20, rx: 54, rz: 30, d: 560, dof: 0.6 }, to: { x: ix - 10, rz: 14, d: 700 } });
  X.sfx(tDam - 0.2, 'riser', { dur: 1.5, gain: 0.22 });

  // ---- shot 3: dark gallery, ceiling panels switch on row by row, dolly toward a framed print
  const sGal = K.set('gallery', { bg: '#000' });
  const ROWS = 7, gal = K.gallery(sGal, { w: 760, h: 430, L: 2800, rows: ROWS, y0: 300 });
  const print = K.frame3d(sGal, { x: -212, y: 300 - 2800 + 1.5, z: 100, w: 360, h: 260, draw: A.engravingPolder, mat: 20, frame: 12 });
  const tOn = L('h3').start + 0.05;
  K.on((t) => {
    if (!K.within(t, c2, cEnd)) return;
    gal.setLights((i) => (t >= tOn + i * 0.25 ? 1 : 0), t >= tOn + ROWS * 0.25 ? 1 : 0);
    print.setLit(R(t, tOn + ROWS * 0.25, 0.3));
  });
  K.shot('gallery', c2, cEnd, { from: { x: 0, y: -1080, z: 205, rx: 89.5, rz: -1.5, lens: 820, dof: 0.12 }, to: { y: -1500, rz: 1.5 }, e: 0.04 });
  for (let i = 0; i <= ROWS; i++) X.sfx(tOn + i * 0.25, 'click', { gain: 0.26, pitch: 0.55 + (i % 3) * 0.04 });

  // ---- end card: hard cut to white text on black (credit your data sources)
  K.set('blank', { bg: '#000' });
  K.shot('blank', cEnd, TEND + 1);
  K.endCard(X, cEnd, [{ text: 'Coastlines and borders: Natural Earth (public domain).' }], { size: 32 });
  X.end(TEND);
});
