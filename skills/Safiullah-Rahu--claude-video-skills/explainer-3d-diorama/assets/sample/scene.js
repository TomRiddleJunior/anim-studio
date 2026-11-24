// "Where the Rain Goes" — a 3D-diorama explainer (parchment low-poly skin) about how a rain garden cleans stormwater.
// Every 3D state is a pure function of t (D.anim / D.track / D.onFrame); one WebGL frame is drawn per engine seek.
X.boot(async (X) => {
  await X.loadVO();
  const D = await DIO.init(X, { skin: 'parchment', groundY: -0.72 });
  const THREE = D.THREE, C = D.C, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const W = (id, w, n) => X.word(id, w, n), L = (id) => X.line(id);
  const END = L('cta').end + 3.1;
  const rnd = X.rand(2026);

  // ================================================================== key times (all from the voice)
  const T = {
    roofs: W('h2', 'roofs'), roads: W('h2', 'roads'), lots: W('h2', 'parking'), soaks: W('h3', 'soaks'),
    flip1: W('forest', 'forest') - 0.42, one: W('forest', 'one'), runs: W('forest', 'runs'),
    flip2: W('city', 'city') - 0.42, half: W('city', 'half'),
    split: L('pick').start - 0.25, oil: W('pick', 'oil'), tyre: W('pick', 'tyre'), fert: W('pick', 'fertiliser'),
    storm: W('drain', 'storm'), carry: W('drain', 'carry'), river: W('drain', 'river'), drainEnd: L('drain').end,
    turn: L('turn').start, fix: W('turn', 'fix'),
    rg: W('define', 'rain'), planted: W('define', 'planted'), runoff: W('define', 'runoff'), defEnd: L('define').end,
    pools: W('pool', 'pools'), mulch: W('mulch', 'Mulch'), grit: W('mulch', 'grit'),
    soilmix: W('soil', 'soil'), filters: W('soil', 'filters'), microbes: W('soil', 'Microbes'), oil2: W('soil', 'oil'),
    roots: W('soil', 'roots'), nutr: W('soil', 'nutrients'),
    seeps: W('seep', 'seeps'), recharge: W('seep', 'recharge'), gw: W('seep', 'groundwater'),
    day: W('dry', 'day'), dry: W('dry', 'dry'), mosq: W('dry', 'mosquitoes'), breed: W('dry', 'breed'),
    small: W('scale', 'small'), street1: W('scale', 'Street'), street2: W('scale', 'street', 1), sponge: W('scale', 'sponge'),
    cta: L('cta').start, roof: W('cta', 'roof'), ctaEnd: L('cta').end,
  };
  const tBlackIn = T.drainEnd + 0.15, tBlackOut = T.turn + 0.75; // fade to black between acts (T6)
  const tSplitF = L('pool').start - 0.65;                        // garden tile splits open (cross-section)
  const tWipe = T.ctaEnd - 0.15;                                 // paper-sheet wipe to the end card (T7)
  const tEndCard = tWipe + 0.78;

  // ================================================================== camera (T1 slow orbits; set changes ride camera moves)
  // Camera grammar measured on the sources: near-holds (slow drift ≈ 1–2°/s) punctuated by fast arrival moves and physics
  // bursts. camPath takes [t, {state}, ease] — the ease shapes the move that ARRIVES at that state; omitted props carry over.
  const MOVE = 'power3.inOut', DRIFT = 'none';
  const camPath = (list) => {
    const props = ['az', 'el', 'r', 'tx', 'ty', 'tz'], cur = { az: 0, el: 30, r: 9, tx: 0, ty: 0, tz: 0 }, spec = {};
    props.forEach((p) => { spec[p] = []; });
    for (const [t, st, e] of list) {
      // a drift only travels 40 % of the way it is written: near-holds (< 0.4 grey-level change per 1/6 s) like the sources
      for (const p of props) if (p in st) cur[p] = e === DRIFT ? cur[p] + (st[p] - cur[p]) * 0.4 : st[p];
      props.forEach((p) => spec[p].push([t, cur[p], e || 'sine.inOut']));
    }
    return spec;
  };
  D.camKeys({
    ...camPath([
      [0, { az: -6, el: 14, r: 5.0, tx: 0, ty: 0.3, tz: 0.4 }],
      [3.0, { az: -2, el: 16, r: 5.3, ty: 0.28, tz: 0.38 }, DRIFT],
      [T.roofs + 0.15, { az: 18, el: 40, r: 4.0, tx: 0.4, ty: 0.4, tz: -0.5 }, 'power2.inOut'],            // one framing per spoken noun
      [T.lots + 0.2, { az: 30, el: 46, r: 3.8, tx: 0.0, ty: 0.0, tz: -0.05 }, 'power2.inOut'],
      [6.6, { az: 27, el: 49, r: 3.85 }, DRIFT],
      [8.9, { az: 30, el: 32, r: 8.6, tx: 0, ty: 0.05, tz: 0 }, 'power2.inOut'],
      [10.9, { az: 38, el: 33, r: 9.0, tx: 0.1 }, DRIFT],
      [12.2, { az: 50, el: 34, r: 10.6, tx: 0.45 }, MOVE],
      [T.one - 0.5, { az: 48, r: 10.4 }, DRIFT],
      [T.one + 0.45, { az: 56, el: 26, r: 5.4, tx: 1.45, ty: -0.25, tz: -0.4 }, MOVE],
      [T.runs + 0.6, { az: 58, el: 25, r: 5.2 }, DRIFT],
      [T.flip2 - 0.15, { az: 45, el: 34, r: 10.4, tx: 0.45, ty: 0, tz: 0 }, MOVE],
      [T.half - 0.4, { az: 43, r: 10.2 }, DRIFT],
      [T.half + 0.35, { az: 38, el: 27, r: 5.8, tx: 1.45, ty: -0.25, tz: 0.45 }, MOVE],
      [T.split - 0.35, { az: 36, el: 27, r: 5.6 }, DRIFT],
      [T.oil + 0.15, { az: 20, el: 32, r: 1.3, tx: -0.2, ty: 0.02, tz: 1.33 }, 'power2.inOut'],
      [T.fert + 0.15, { az: -4, el: 26, r: 1.35, tx: 0.0, ty: 0.03, tz: 1.2 }, 'power2.inOut'],
      [T.storm - 0.6, { az: -5, el: 31, r: 1.15 }, DRIFT],
      [T.storm + 0.3, { az: 8, el: 24, r: 2.5, tx: 0.08, ty: -0.08, tz: 1.15 }, MOVE],
      [T.storm + 1.9, { az: -2, el: 7, r: 2.9, tx: 0.55, ty: -0.2, tz: 1.45 }, 'power2.inOut'],
      [T.drainEnd + 0.4, { az: 4, el: 11, r: 2.6, tx: 1.1, ty: -0.15, tz: 1.4 }, DRIFT],
      [tBlackIn + 0.9, { az: -48, el: 33, r: 9.4, tx: 0.1, ty: -0.25, tz: 0 }, 'none'],
      [T.rg - 0.5, { az: -42, el: 32, r: 8.9 }, DRIFT],
      [T.rg + 0.4, { az: -30, el: 36, r: 6.6, tx: 0.5, ty: -0.12 }, MOVE],
      [T.runoff - 0.45, { az: -26, el: 35, r: 6.4 }, DRIFT],
      [T.runoff + 0.5, { az: -12, el: 30, r: 4.3, tx: -0.05, ty: 0.02, tz: -0.2 }, MOVE],
      [tSplitF - 0.1, { az: -10, el: 29, r: 4.2 }, DRIFT],
      [tSplitF + 1.2, { az: 8, el: 16, r: 6.4, tx: 0.45, ty: -0.3, tz: 0 }, MOVE],
      [T.mulch - 0.5, { az: 4, el: 15, r: 6.2 }, DRIFT],
      [T.mulch + 0.4, { az: -6, el: 12, r: 3.6, tx: 0.78, ty: -0.1 }, MOVE],
      [T.soilmix - 0.6, { az: -9, el: 12, r: 3.5 }, DRIFT],
      [T.soilmix + 0.4, { az: 6, el: 14, r: 4.6, tx: 0.55, ty: -0.32 }, MOVE],
      [T.microbes - 0.35, { az: 8, el: 14, r: 4.5 }, DRIFT],
      [T.microbes + 0.4, { az: 13, el: 9, r: 3.1, tx: 0.5, ty: -0.24 }, MOVE],
      [T.roots - 0.35, { az: 14, el: 9, r: 3.0 }, DRIFT],
      [T.roots + 0.6, { az: 17, el: 13, r: 4.8, tx: 0.45, ty: -0.4 }, MOVE],
      [T.seeps - 0.5, { az: 14, el: 12, r: 4.9 }, DRIFT],
      [T.recharge - 0.2, { az: -4, el: 8, r: 5.4, ty: -0.74 }, MOVE],
      [L('seep').end + 0.4, { az: -8, el: 8 }, DRIFT],
      [T.day + 1.4, { az: -22, el: 23, r: 7.4, tx: 0.25, ty: -0.35 }, 'power2.inOut'],
      [T.mosq - 0.6, { az: -25, el: 24, r: 7.2 }, DRIFT],
      [T.mosq + 0.3, { az: -30, el: 22, r: 5.2, tx: 0.62, ty: 0.02, tz: -0.1 }, MOVE],
      [T.breed + 0.6, { az: -33, el: 23, r: 5.0 }, DRIFT],
      [T.street1 - 0.1, { az: -42, el: 47, r: 20.5, tx: 0, ty: -0.4, tz: -0.7 }, 'sine.inOut'],
      [T.sponge - 0.35, { az: -50, el: 45, r: 20 }, DRIFT],
      [T.sponge + 0.6, { az: -60, el: 33, r: 15.5, tx: 0.3, ty: -0.4, tz: -0.4 }, MOVE],
      [T.cta - 0.5, { az: -63, el: 32, r: 15.2 }, DRIFT],
      [T.roof - 0.2, { az: -44, el: 27, r: 3.4, tx: -0.25, ty: 0.12, tz: -0.3 }, 'sine.inOut'],
      [END, { az: -40, el: 25, r: 3.1 }, DRIFT],
    ]),
    keyAz: [[0, -40], [T.day - 0.35, -40], [T.day + 0.4, 10, 'sine.in'], [T.day + 0.41, -70], [T.dry + 0.4, -40, 'sine.out']],
    shadowSize: [[0, 0], [T.street1 - 1.2, 0], [T.street1, 11], [T.cta + 1.2, 11], [T.roof, 0]],
  });
  // looks: storm-dark opening, underground darkness, fade to black between acts, one night
  D.fade([[0, 1], [0.3, 1], [1.9, 0, 'sine.inOut'], [tBlackIn, 0], [tBlackIn + 0.85, 1, 'sine.in'], [tBlackOut - 0.35, 1], [tBlackOut + 1.4, 0, 'sine.inOut']]);
  D.shade([[0, 0.9], [3.0, 0.72], [6.5, 0.3], [10.5, 0], [T.storm + 0.4, 0], [T.storm + 1.8, 0.86, 'sine.inOut'], [tBlackIn + 0.8, 0.86], [tBlackOut, 0]]);
  D.light([[0, 0.5], [4, 0.7], [9, 0.95], [11, 1], [T.storm + 0.4, 1], [T.storm + 1.8, 0.62], [tBlackOut, 0.62], [tBlackOut + 0.1, 1]]);
  D.night([[0, 0], [T.day - 0.35, 0], [T.day + 0.4, 1, 'sine.inOut'], [T.dry - 0.45, 1], [T.dry + 0.4, 0, 'sine.inOut']]);
  D.anim(D.ground, { 'position.y': [[0, -0.72], [tBlackIn + 1, -0.72], [tBlackIn + 1.01, -1.5]] });

  // ================================================================== ACT 1a — the city slab (core-sample sub-tiles) on a flip pivot
  const sheen = (c) => D.mat(c, { unique: true, emissive: 0xc9dbe8, ei: 0 });
  const roofMat = sheen(0x8a7a6c), roofMat2 = sheen(0x8a5a44), flatRoofMat = sheen(0x8f8a80), asphaltMat = sheen(C.asphalt), lotMat = sheen(0x5e5f62);
  const pulse = (m, t0, pk = 0.38) => D.anim(m, { emissiveIntensity: [[t0 - 0.05, 0], [t0 + 0.18, pk, 'power2.out'], [t0 + 1.4, 0.07, 'sine.inOut'], [T.flip1, 0.07], [T.flip1 + 0.6, 0.02]] });
  pulse(roofMat, T.roofs); pulse(roofMat2, T.roofs); pulse(flatRoofMat, T.roofs); pulse(asphaltMat, T.roads); pulse(lotMat, T.lots, 0.26);

  const pair = D.flipPair({ h: 0.5 });
  const city = pair.a, forest = pair.b;
  D.window(pair.pivot, 0, tBlackIn + 1);
  const cityBlob = D.blob(4.6, 4.6, 0.5); D.window(cityBlob, 0, tBlackIn + 1);
  const sub = {};
  const road = (g) => {
    D.box(1, 0.012, 0.26, asphaltMat, { y: 0.006, z: 0.37, cast: false }, g);
    for (let i = 0; i < 4; i++) D.box(0.1, 0.004, 0.014, C.line, { x: -0.375 + i * 0.25, y: 0.013, z: 0.37, cast: false }, g);
    D.box(1, 0.022, 0.06, C.kerb, { y: 0.011, z: 0.21 }, g);
  };
  const block = (kind, x, z) => {
    const top = kind === 'park' || kind === 'houses' || kind === 'street' ? C.grass : C.pavement;
    const g = D.tile({ w: 1, d: 1, h: 0.5, top, soil: C.soil, bands: true, parent: city, pos: { x, z } });
    road(g);
    const r = X.rand(Math.round(x * 7 + z * 13 + 40));
    if (kind === 'apart') {
      D.house({ parent: g, pos: { x: -0.2, z: -0.12 }, w: 0.42, d: 0.36, h: 0.46, flat: true, roofMat: flatRoofMat, seed: 2 });
      D.house({ parent: g, pos: { x: 0.26, z: -0.18 }, w: 0.3, d: 0.3, h: 0.3, flat: true, roofMat: flatRoofMat, seed: 5 });
    } else if (kind === 'office') {
      D.house({ parent: g, pos: { x: 0.08, z: -0.15 }, w: 0.34, d: 0.34, h: 0.78, flat: true, roofMat: flatRoofMat, seed: 7, wall: 0xc9c4ba });
      D.house({ parent: g, pos: { x: -0.3, z: -0.08 }, w: 0.26, d: 0.3, h: 0.18, flat: true, roofMat: flatRoofMat, seed: 8 });
    } else if (kind === 'park') {
      D.box(0.08, 0.004, 0.7, C.pavement, { x: 0.05, y: 0.002, z: -0.15, cast: false, ry: 0.35 }, g);
      for (let i = 0; i < 5; i++) D.tree({ parent: g, pos: { x: -0.36 + (i % 3) * 0.33 + r() * 0.06, z: -0.38 + Math.floor(i / 3) * 0.38 + r() * 0.05 }, seed: 30 + i, h: 0.3 });
    } else if (kind === 'houses') {
      for (let i = 0; i < 3; i++) D.house({ parent: g, pos: { x: -0.32 + i * 0.32, z: -0.2 + (i % 2) * 0.06 }, w: 0.22, d: 0.18, h: 0.13, roofMat: i % 2 ? roofMat : roofMat2, seed: 11 + i + Math.round(x * 3) });
      D.tree({ parent: g, pos: { x: 0.38, z: 0.06 }, seed: 50 + Math.round(x * 5), h: 0.22 });
    } else if (kind === 'lot') {
      D.box(0.9, 0.006, 0.64, lotMat, { y: 0.003, z: -0.14, cast: false }, g);
      for (let i = 0; i < 6; i++) D.box(0.008, 0.002, 0.2, C.line, { x: -0.36 + i * 0.145, y: 0.0075, z: -0.32, cast: false }, g);
      for (let i = 0; i < 6; i++) D.box(0.008, 0.002, 0.2, C.line, { x: -0.36 + i * 0.145, y: 0.0075, z: 0.04, cast: false }, g);
      [[-0.29, -0.32, 0], [0.15, -0.32, 1], [-0.07, 0.04, 2], [0.29, 0.04, 3]].forEach(([cx2, cz2, k]) => D.car({ parent: g, pos: { x: cx2, y: 0.006, z: cz2 }, color: C.car[k], ry: Math.PI / 2, s: 0.95 }));
    } else if (kind === 'shops') {
      for (let i = 0; i < 3; i++) D.house({ parent: g, pos: { x: -0.32 + i * 0.32, z: -0.15 }, w: 0.28, d: 0.4, h: 0.15 + i * 0.03, flat: true, roofMat: flatRoofMat, seed: 20 + i });
    }
    sub[kind + (sub[kind] ? 2 : '')] = g;
    return g;
  };
  const blocks = [
    block('apart', -1, -1), block('park', 0, -1), block('office', 1, -1),
    block('houses', -1, 0), block('lot', 0, 0), block('houses', 1, 0),
    block('shops', -1, 1), block('street', 0, 1), block('apart', 1, 1),
  ];
  const streetTile = blocks[7];

  // ---- the detailed street sub-tile (front-centre): kerb drain, parked car with an oil drip, lawn, fertiliser bag, a resident
  {
    const g = streetTile;
    D.house({ parent: g, pos: { x: -0.18, z: -0.22 }, w: 0.34, d: 0.24, h: 0.16, roofMat: roofMat2, seed: 31 });
    D.tree({ parent: g, pos: { x: 0.3, z: -0.25 }, seed: 77, h: 0.3 });
    D.plant({ parent: g, pos: { x: 0.12, z: -0.05 }, kind: 'shrub', seed: 4, h: 0.09 });
    // storm drain grate in the gutter
    D.box(0.1, 0.004, 0.05, 0x1c1c1c, { x: 0.2, y: 0.0125, z: 0.268, cast: false }, g);
    for (let i = 0; i < 5; i++) D.box(0.006, 0.006, 0.05, 0x77746c, { x: 0.165 + i * 0.0175, y: 0.015, z: 0.268, cast: false }, g);
  }
  const parked = D.car({ parent: streetTile, pos: { x: -0.24, y: 0.012, z: 0.33 }, color: C.car[1] });
  const oil = D.mesh(new THREE.CircleGeometry(0.05, 9).rotateX(-Math.PI / 2), D.mat(0x23252b, { phong: true, shininess: 120, specular: 0x9a7fd0, unique: true }), { x: -0.21, y: 0.0135, z: 0.34, cast: false }, streetTile);
  oil.scale.set(1.3, 1, 0.8);
  D.anim(oil, { scale: [[T.oil - 0.3, [0.7, 1, 0.45]], [T.oil + 0.4, [1.05, 1, 0.65], 'power2.out']] });
  D.anim(parked, { 'position.x': [[T.tyre - 0.1, -0.24], [T.tyre + 0.8, -0.08, 'sine.inOut']] });
  const bag = D.group(streetTile, { x: 0.02, z: 0.06 });
  D.box(0.05, 0.07, 0.03, 0xe8e2d2, { y: 0.035 }, bag); D.box(0.051, 0.022, 0.031, 0x6d8740, { y: 0.04, cast: false }, bag);
  D.anim(bag, { 'rotation.x': [[T.fert - 0.05, 0], [T.fert + 0.35, 1.45, 'bounce.out']], 'position.z': [[T.fert - 0.05, 0.06], [T.fert + 0.35, 0.1, 'power2.out']] });
  const resident = D.mannequin({ parent: streetTile, pos: { x: 0.36, y: 0, z: 0.12 }, s: 0.75 });
  resident.rotation.y = -0.5;
  D.onFrame((t) => { resident.userData.body.rotation.z = Math.sin(t * 1.3) * 0.02; resident.userData.head.rotation.y = Math.sin(t * 0.7) * 0.25; });

  // ---- the forest slab (the other face of the flip)
  {
    D.tile({ w: 3, d: 3, h: 0.5, top: C.moss, soil: C.soil, bands: true, parent: forest });
    const r = X.rand(808);
    for (let i = 0; i < 26; i++) {
      const x = -1.3 + r() * 2.6, z = -1.3 + r() * 2.6;
      D.tree({ parent: forest, pos: { x, z }, seed: 100 + i, h: 0.32 + r() * 0.3, kind: i % 5 === 0 ? 'conifer' : undefined, crowns: 1 + (i % 3) });
    }
    for (let i = 0; i < 40; i++) D.mesh(new THREE.CircleGeometry(0.03 + r() * 0.03, 5).rotateX(-Math.PI / 2), D.pick([0x8d7a3e, 0x6f5f2e, 0x9c8a4a], r), { x: -1.4 + r() * 2.8, y: 0.003 + i * 0.00005, z: -1.4 + r() * 2.8, cast: false }, forest);
    for (let i = 0; i < 6; i++) D.mesh(D.jitter(new THREE.IcosahedronGeometry(0.05 + r() * 0.04, 0), 0.03, i), 0x8a857a, { x: -1.3 + r() * 2.6, y: 0.02, z: -1.3 + r() * 2.6 }, forest);
  }
  const flipAxis = V3(Math.cos(40 * Math.PI / 180), 0, -Math.sin(40 * Math.PI / 180));
  D.flip(pair, [T.flip1, T.flip2], { axis: flipAxis, dur: 0.55, lift: 0.5 });

  // ---- a storm cloud over the slab (drifts; idle life)
  const cloud = D.cloud({ seed: 3, n: 9, size: 0.46, color: 0x7f8287, pos: { x: 0.1, y: 2.7, z: -0.25 } });
  D.anim(cloud, { 'position.x': [[0, -0.15], [T.split, 0.35, 'none']], visible: [[0, true], [T.split + 0.5, false]], 'position.y': [[T.split - 0.2, 2.55], [T.split + 0.5, 4.5, 'power2.in']] });

  // ---- act 1 rain + splashes on the hard surfaces + runoff pouring off the slab edges (T5-style physics, baked as functions of t)
  D.rain({ n: 380, area: [-1.5, 1.5, -1.5, 1.5], top: 2.3, len: 0.12, speed: 6, thick: 0.006, opacity: 0.34, intensity: [[0, 0.6], [1.0, 1], [T.flip1 - 0.4, 1], [T.flip1, 0]], seed: 9 });
  [[-0.63], [0.37], [1.37]].forEach(([z], i) => D.rings({ n: 26, area: [-1.45, 1.45, z - 0.11, z + 0.11], floor: () => 0.013, intensity: [[T.roads - 0.4, 0], [T.roads, 1], [T.flip1 - 0.2, 1], [T.flip1, 0]], seed: 40 + i, size: 0.045 }));
  D.rings({ n: 18, area: [-0.42, 0.42, -0.42, 0.14], floor: () => 0.007, intensity: [[T.lots - 0.3, 0], [T.lots, 1], [T.flip1 - 0.2, 1], [T.flip1, 0]], seed: 49, size: 0.045 });
  for (const z of [-0.63, 0.37, 1.37]) for (const s of [-1, 1]) {
    D.flow([[s * 0.6, 0.016, z], [s * 1.5, 0.014, z], [s * 1.6, -0.12, z], [s * 1.66, -0.75, z]], { n: 46, t0: T.soaks - 0.35, t1: T.flip1 - 0.5, travel: 1.1, size: 0.034, spread: 0.1, seed: 60 + z * 10 + s, ease: 'power1.in' });
  }
  X.sfx(0.2, 'swoosh', { dur: 4.5, gain: 0.16, pitch: 0.7 }); X.sfx(3.6, 'swoosh', { dur: 4.5, gain: 0.18, pitch: 0.75 }); X.sfx(7.4, 'swoosh', { dur: 4.2, gain: 0.16, pitch: 0.7 });
  X.sfx(T.roofs, 'tick', { gain: 0.18, pitch: 1.3 }); X.sfx(T.roads, 'tick', { gain: 0.18, pitch: 1.1 }); X.sfx(T.lots, 'tick', { gain: 0.18, pitch: 0.95 });
  X.sfx(T.soaks - 0.2, 'slide', { dur: 1.6, gain: 0.25, pitch: 1.6 });

  // ================================================================== ACT 1b — "one drop in ten" vs "more than half": drops + two measuring jars
  const jarF = D.jar({ pos: { x: 2.0, y: -0.72, z: -0.62 }, h: 0.82, r: 0.19, glass: 0.14 });
  const jarC = D.jar({ pos: { x: 2.0, y: -0.72, z: 0.58 }, h: 0.82, r: 0.19, glass: 0.14 });
  const propTree = D.tree({ pos: { x: 2.0, y: -0.72, z: -1.02 }, seed: 404, h: 0.26 });          // which jar is which, told with props
  const propHouse = D.house({ pos: { x: 2.02, y: -0.72, z: 1.05 }, w: 0.2, d: 0.16, h: 0.14, seed: 405, chimney: false });
  const jarItems = [jarF.group, jarC.group, propTree, propHouse];
  const jarsOn = (t) => t >= T.flip1 + 0.15 && t < T.split + 0.95;
  jarItems.forEach((g, i) => D.anim(g, { scale: [[T.flip1 + 0.15 + i * 0.06, 0.001], [T.flip1 + 0.55 + i * 0.06, 1, 'back.out(1.8)']] }));
  X.sfx(T.flip1 + 0.2, 'pop', { gain: 0.2, pitch: 0.8 }); X.sfx(T.flip1 + 0.32, 'pop', { gain: 0.2, pitch: 0.9 });
  // jars leave with the split: slide right and drop
  D.split(jarItems, T.split + 0.1, { dir: V3(1, 0, 0.2), stagger: 0.05, out: 0.8, drop: 2.5, sfx: false, visible: jarsOn });

  const dropGeo = D.dropGeo(0.135), dropMat = D.waterMat(C.water);
  const spotGeo = new THREE.CircleGeometry(0.07, 8).rotateX(-Math.PI / 2);
  const dropSet = (tStart, stagger, spots, runoffIdx, jar, onFace, sfxPitch) => {
    const arrivals = [];
    spots.forEach(([x, z], i) => {
      const m = D.mesh(dropGeo, dropMat, { cast: false }), spot = D.mesh(spotGeo, D.mat(0x1b140e, { opacity: 0.35, depthWrite: false, unique: true }), { x, y: 0.006, z, cast: false, recv: false });
      const tf = tStart + i * stagger, tl = tf + 0.36, run = runoffIdx.includes(i);
      const edgeZ = jar.group.position.z * 0.6 + z * 0.4, jx = jar.group.position.x, jTop = jar.group.position.y + jar.h - 0.05;
      const tSlide = tl + 0.1, slideDur = 0.25 + (1.5 - x) * 0.11, tFall = tSlide + slideDur, tArr = tFall + 0.3;
      if (run) arrivals.push(tArr);
      D.onFrame((t) => {
        const vis = t >= tf && onFace(t);
        m.visible = vis; spot.visible = false;
        if (!vis) return;
        if (t < tl) { // falling from the cloud (gravity)
          const u = (t - tf) / 0.36; m.position.set(x, 2.3 - 2.3 * u * u, z); m.scale.set(1, 1.15, 1); return;
        }
        if (!run) { // absorbed: squash, sink, leave a wet spot
          const u = D.clamp((t - tl) / 0.45);
          m.position.set(x, 0.03 - 0.09 * u, z); m.scale.set(1 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 2)), Math.max(0.01, (1 - u) * 0.6), 1 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 2)));
          if (u >= 1) m.visible = false;
          const su = D.clamp((t - tl) / 1.4); spot.visible = su < 1; spot.scale.setScalar(0.5 + su * 0.7); spot.material.opacity = 0.35 * (1 - su);
          return;
        }
        if (t < tSlide) { const u = (t - tl) / 0.1; m.position.set(x, 0.035, z); m.scale.set(1.3, 0.55 + 0.1 * u, 1.3); return; }
        if (t < tFall) { // slides along the hard surface to the edge
          const u = D.ease('power1.in')((t - tSlide) / slideDur); m.position.set(x + (1.5 - x) * u, 0.035, z + (edgeZ - z) * u); m.scale.set(1.25, 0.6, 1.0); return;
        }
        if (t < tArr) { // arcs off the edge into the jar
          const u = (t - tFall) / 0.3; m.position.set(1.5 + (jx - 1.5) * u, 0.035 + 0.25 * Math.sin(Math.PI * u) * (1 - u) + (jTop - 0.035) * u * u, edgeZ + (jar.group.position.z - edgeZ) * u); m.scale.set(0.9, 1.1, 0.9); return;
        }
        m.visible = false;
      });
      X.sfx(tl, 'drop', { gain: 0.1, pitch: sfxPitch * (0.85 + (i % 5) * 0.08) });
      if (run) X.sfx(tArr, 'bubble', { gain: 0.16, pitch: 0.8 + (i % 3) * 0.1 });
    });
    return arrivals;
  };
  // forest: 20 drops, 2 run off (10 %); city: 20 drops, 11 run off (55 %, "more than half")
  const fr = X.rand(5150), forestSpots = Array.from({ length: 20 }, () => [-1.25 + fr() * 2.4, -1.2 + fr() * 2.4]);
  forestSpots[7] = [1.05, -0.5]; forestSpots[15] = [1.15, -0.2];
  const forestOn = (t) => t >= T.flip1 + 0.3 && t < T.flip2;
  const arrF = dropSet(T.flip1 + 0.6, 0.07, forestSpots, [7, 15], jarF, forestOn, 1.0);
  const roadsZ = [-0.63, 0.37, 1.37];
  const citySpots = [];
  const cr2 = X.rand(616);
  for (let i = 0; i < 20; i++) citySpots.push(null);
  const runC = [0, 2, 3, 5, 7, 9, 10, 12, 14, 16, 18];
  runC.forEach((k, j) => { citySpots[k] = [-1.2 + cr2() * 2.3, roadsZ[j % 3]]; });
  for (let i = 0; i < 20; i++) if (!citySpots[i]) citySpots[i] = cr2() < 0.6 ? [-0.4 + cr2() * 0.8, -1.35 + cr2() * 0.65] : [-1.4 + cr2() * 0.8 + (cr2() < 0.5 ? 0 : 2), -0.05 + cr2() * 0.2];
  const cityOn = (t) => t >= T.flip2 + 0.3 && t < T.split + 0.2;
  const arrC = dropSet(T.flip2 + 0.5, 0.045, citySpots, runC, jarC, cityOn, 1.15);
  const lvl = (arr) => (t) => arr.reduce((s, ta) => s + D.clamp((t - ta) / 0.18), 0) / 20;
  const lvF = lvl(arrF), lvC = lvl(arrC);
  D.onFrame((t) => { jarF.set(lvF(t)); jarC.set(lvC(t)); });
  X.sfx(T.flip1 + 0.7, 'swoosh', { dur: 2.2, gain: 0.08, pitch: 0.7 }); X.sfx(T.flip2 + 0.6, 'swoosh', { dur: 2.0, gain: 0.08, pitch: 0.7 });

  // ================================================================== ACT 1c — split to the street; pollutants into the drain; the pipe to the river
  D.split(blocks.filter((b) => b !== streetTile), T.split, { stagger: 0.06, dur: 0.75, out: 0.7, drop: 2.6, centre: V3(0, 0, 1) });
  X.sfx(T.split + 0.5, 'thud', { gain: 0.2, pitch: 0.8 });
  const gutter = [[-0.5, 0.017, 1.268], [0.0, 0.017, 1.268], [0.2, 0.017, 1.268], [0.2, -0.03, 1.268]];
  D.flow(gutter, { n: 60, t0: T.split + 0.6, t1: T.drainEnd, travel: 1.7, size: 0.0085, spread: 0.02, flatY: true, squash: 0.45, seed: 71 });
  const gutterWater = D.mesh(new THREE.BoxGeometry(0.72, 0.004, 0.036).translate(0.36, 0, 0), D.waterMat(C.water, { opacity: 0.75 }), { x: -0.5, y: 0.0135, z: 0.268, cast: false }, streetTile);
  D.anim(gutterWater, { 'scale.x': [[T.split + 0.5, 0.001], [T.split + 1.7, 1, 'power1.out']] });
  { // the cut-away front wall opens like a shutter to show the pipe (stays closed in the overview shots)
    const cover = D.mesh(new THREE.PlaneGeometry(1, 0.41).translate(0, 0.205, 0), D.mat(C.soil), { y: -0.5, z: 0.5008, cast: false }, streetTile);
    D.anim(cover, { 'scale.y': [[T.storm - 0.2, 1], [T.storm + 0.5, 0.001, 'power2.inOut']], visible: [[0, true], [T.storm + 0.5, false]] });
    X.sfx(T.storm - 0.2, 'slide', { dur: 0.6, gain: 0.3, pitch: 0.6 });
  }
  D.flow([[-0.21, 0.016, 1.34], [-0.1, 0.017, 1.29], [0.1, 0.017, 1.27], [0.2, -0.03, 1.268]], { n: 16, t0: T.oil, t1: T.drainEnd, travel: 1.4, size: 0.011, water: false, mat: D.mat(0x2a2240, { phong: true, shininess: 120, specular: 0xb08fe0 }), seed: 72 });
  D.flow([[-0.12, 0.016, 1.37], [-0.02, 0.017, 1.31], [0.12, 0.017, 1.275], [0.2, -0.03, 1.268]], { n: 16, t0: T.tyre + 0.2, t1: T.drainEnd, travel: 1.3, size: 0.009, water: false, color: 0x3a3a3a, seed: 73 });
  D.flow([[0.03, 0.02, 1.12], [0.08, 0.02, 1.2], [0.14, 0.017, 1.26], [0.2, -0.03, 1.268]], { n: 16, t0: T.fert + 0.25, t1: T.drainEnd, travel: 1.2, size: 0.009, water: false, color: 0x9fbf4a, seed: 74 });
  X.sfx(T.oil, 'drop', { gain: 0.25, pitch: 0.6 }); X.sfx(T.tyre, 'woosh_low', { dur: 0.9, gain: 0.3 }); X.sfx(T.fert, 'paper', { dur: 0.4, gain: 0.35 });
  X.sfx(T.split + 0.6, 'slide', { dur: 3.0, gain: 0.1, pitch: 1.8 });
  X.sfx(T.storm, 'woosh_low', { dur: 1.6, gain: 0.35, pitch: 0.8 });

  // cut-away front face of the street tile (T-shaped pipe slot), and the river tile that docks on its right
  const invis = new THREE.MeshBasicMaterial({ visible: false });
  const slot = (x0, x1) => { // L-shaped pipe channel: shaft under the drain + horizontal run
    const s = new THREE.Path();
    s.moveTo(x0 + 0.17, -0.012); s.lineTo(x0 + 0.23, -0.012); s.lineTo(x0 + 0.23, -0.16); s.lineTo(x1, -0.16); s.lineTo(x1, -0.24); s.lineTo(x0 + 0.17, -0.24); s.lineTo(x0 + 0.17, -0.012);
    return s;
  };
  {
    const body = streetTile.userData.body; // swap its +z face for a plate with a hole
    body.material = [body.material[0], body.material[1], body.material[2], body.material[3], invis, body.material[5]];
    const sh = new THREE.Shape(); sh.moveTo(-0.5, -0.5); sh.lineTo(0.5, -0.5); sh.lineTo(0.5, 0); sh.lineTo(-0.5, 0); sh.lineTo(-0.5, -0.5);
    sh.holes.push(slot(0, 0.5));
    D.mesh(new THREE.ShapeGeometry(sh), D.mat(C.soil), { z: 0.5 }, streetTile);
    const back = new THREE.Shape(slot(0, 0.5).getPoints()); // channel back plate (concrete)
    D.mesh(new THREE.ShapeGeometry(back), D.mat(0x6d6860), { z: 0.47, s: [1, 1, 1] }, streetTile);
    D.mesh(new THREE.PlaneGeometry(0.4, 0.3), D.mat(0x4b4741), { x: 0.3, y: -0.15, z: 0.465, cast: false }, streetTile);
  }
  const riverT = D.group(D.scene, { x: 1.12, z: 1.0 });
  const waterMatR = D.mat(C.water, { phong: true, shininess: 90, specular: 0x8899aa, emissive: C.water, ei: 0.1, opacity: 0.88, unique: true });
  {
    const prof = new THREE.Shape(); // bank → slope → channel floor, extruded along z (1 unit)
    prof.moveTo(-0.6, -0.5); prof.lineTo(0.6, -0.5); prof.lineTo(0.6, -0.38); prof.lineTo(-0.08, -0.38); prof.lineTo(-0.2, 0); prof.lineTo(-0.6, 0); prof.lineTo(-0.6, -0.5);
    const ex = new THREE.ExtrudeGeometry(prof, { depth: 1, bevelEnabled: false }); ex.translate(0, 0, -0.5);
    D.mesh(ex, [invis, D.mat(C.soilMid)], {}, riverT);
    const face = new THREE.Shape(prof.getPoints()); const hole = new THREE.Path();
    hole.moveTo(-0.6, -0.16); hole.lineTo(-0.15, -0.16); hole.lineTo(-0.15, -0.24); hole.lineTo(-0.6, -0.24); hole.lineTo(-0.6, -0.16); face.holes.push(hole);
    D.mesh(new THREE.ShapeGeometry(face), D.mat(C.soil), { z: 0.5 }, riverT);
    D.mesh(new THREE.PlaneGeometry(0.47, 0.12), D.mat(0x4b4741), { x: -0.37, y: -0.2, z: 0.465, cast: false }, riverT);
    D.box(0.42, 0.012, 1, C.grass, { x: -0.4, y: 0.006 }, riverT);
    D.mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8), 0x8a857c, { x: -0.13, y: -0.2, z: 0.44, rz: Math.PI / 2 }, riverT); // outfall
    const water = D.mesh(new THREE.BoxGeometry(0.66, 0.13, 1), waterMatR, { x: 0.27, y: -0.315, cast: false }, riverT);
    for (let i = 0; i < 3; i++) D.plant({ parent: riverT, pos: { x: -0.5 + i * 0.12, y: 0.012, z: -0.3 + i * 0.25 }, kind: 'reed', seed: 90 + i, h: 0.12 });
    D.tree({ parent: riverT, pos: { x: -0.45, y: 0.012, z: -0.2 }, seed: 93, h: 0.28 });
    const plume = D.mesh(new THREE.CircleGeometry(0.3, 12).rotateX(-Math.PI / 2), D.mat(0x6e6440, { opacity: 0.0, depthWrite: false, unique: true }), { x: 0.1, y: -0.248, z: 0.32, cast: false }, riverT);
    D.anim(plume, { scale: [[T.carry + 0.6, 0.05], [T.river + 0.6, 1.3, 'power2.out']], 'material.opacity': [[T.carry + 0.6, 0], [T.river, 0.8]] });
    D.anim(waterMatR, { color: [[T.carry + 0.9, [0.31, 0.55, 0.75]], [T.river + 0.5, [0.42, 0.42, 0.27]]], emissive: [[T.carry + 0.9, [0.31, 0.55, 0.75]], [T.river + 0.5, [0.42, 0.42, 0.27]]] });
    water.renderOrder = 2;
  }
  D.anim(riverT, { visible: [[0, false], [T.storm + 0.2, true], [tBlackIn + 1, false]], 'position.y': [[T.storm + 0.2, 2.6], [T.storm + 0.75, 0, 'power2.in'], [T.storm + 0.95, 0.025, 'sine.out'], [T.storm + 1.15, 0, 'sine.in']] });
  X.sfx(T.storm + 0.75, 'thud', { gain: 0.35 });
  const pipeFlow = [[0.2, -0.03, 0.485 + 1], [0.2, -0.2, 0.485 + 1], [0.7, -0.2, 1.485], [1.0, -0.2, 1.485], [1.07, -0.205, 1.44], [1.13, -0.26, 1.43], [1.2, -0.29, 1.4]];
  D.flow(pipeFlow, { n: 50, t0: T.storm + 0.2, t1: tBlackIn + 0.5, travel: 2.4, size: 0.013, spread: 0.03, seed: 81 });
  D.flow(pipeFlow, { n: 22, t0: T.storm + 0.4, t1: tBlackIn + 0.5, travel: 2.5, size: 0.011, spread: 0.03, water: false, color: 0x2e2a26, seed: 82 });
  D.flow(pipeFlow, { n: 12, t0: T.storm + 0.6, t1: tBlackIn + 0.5, travel: 2.6, size: 0.01, spread: 0.03, water: false, color: 0x9fbf4a, seed: 83 });
  X.sfx(T.river, 'bubble', { gain: 0.3, pitch: 0.5 }); X.sfx(T.river + 0.25, 'bubble', { gain: 0.22, pitch: 0.45 });

  // ================================================================== ACT 2 — the garden slab (deep core sample) with a house and a planted dip
  const GW = 3.0, GD = 2.2, GH = 1.3, cx = 0.62, ga = 0.78, gb = 0.62, gd = 0.17;
  const S0 = (x, z) => { const q = 1 - ((x - cx) / ga) ** 2 - (z / gb) ** 2; return q > 0 ? -gd * Math.pow(q, 0.8) : 0; };
  const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s) - 0.5; };
  const S = (x, z) => { const b = S0(x, z); return b + (b < -0.004 ? hash(x, z) * 0.02 : hash(x, z) * 0.004); };
  const gardenOn = (t) => t >= tBlackIn + 1;
  const garden = D.group(D.scene); D.onFrame((t) => { garden.visible = gardenOn(t); });
  const gBlob = D.blob(4.4, 3.6, 0.5, garden, -1.5);
  const halves = {};
  const vcols = (geo, colFn) => {
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      const mx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, my = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, mz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      c.set(colFn(mx, my, mz));
      for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  };
  const surfMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const surfColour = (x, y, z) => y < -0.03 ? (hash(x * 3, z * 3) > 0 ? C.mulch : C.mulch2) : y < -0.006 ? 0x5a5f2c : (hash(x * 2, z * 2) > 0.1 ? C.grass : C.grass3);
  const wall = (w, h, color, pos, parent, ry = 0) => D.mesh(new THREE.PlaneGeometry(w, h), D.mat(color), { ...pos, ry }, parent);
  for (const side of ['back', 'front']) {
    const g = D.group(garden), z0 = side === 'back' ? -GD / 2 : 0, z1 = side === 'back' ? 0 : GD / 2;
    const geo = new THREE.PlaneGeometry(GW, z1 - z0, 36, 13).rotateX(-Math.PI / 2).translate(0, 0, (z0 + z1) / 2).toNonIndexed();
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, S(p.getX(i), p.getZ(i)));
    geo.computeVertexNormals(); vcols(geo, surfColour);
    D.mesh(geo, surfMat, {}, g);
    const zc = (z0 + z1) / 2, zl = z1 - z0;
    for (const s of [-1, 1]) { // side walls with a topsoil band
      wall(zl, GH - 0.1, C.soilMid, { x: s * GW / 2, y: -(GH + 0.1) / 2, z: zc }, g, s * Math.PI / 2);
      wall(zl, 0.1, C.topsoil, { x: s * GW / 2, y: -0.05, z: zc }, g, s * Math.PI / 2);
    }
    if (side === 'back') { wall(GW, GH - 0.1, C.soilMid, { y: -(GH + 0.1) / 2, z: -GD / 2 }, g, Math.PI); wall(GW, 0.1, C.topsoil, { y: -0.05, z: -GD / 2 }, g, Math.PI); }
    else { wall(GW, GH - 0.1, C.soilMid, { y: -(GH + 0.1) / 2, z: GD / 2 }, g); wall(GW, 0.1, C.topsoil, { y: -0.05, z: GD / 2 }, g); }
    halves[side] = g;
  }
  // the section face at z = 0 (layered cross-section: topsoil, native soil, mulch, soil mix, gravel, groundwater)
  const xs = Array.from({ length: 37 }, (_, i) => -GW / 2 + (i * GW) / 36);
  const strip = (pts, color, z, op = {}) => { // pts: [[x, top, bottom]...]
    const pos = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ta, ba] = pts[i], [xb, tb, bb] = pts[i + 1];
      pos.push(xa, ba, z, xb, bb, z, xb, tb, z, xa, ba, z, xb, tb, z, xa, ta, z);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
    return D.mesh(geo, op.mat || D.mat(color, op), { cast: false, recv: true }, op.parent ?? halves.back);
  };
  const bedHalf = 0.6, bedBot = -0.64, gravBot = -0.8;
  const bedB = (x) => { const d = Math.abs(x - cx); return d <= bedHalf ? bedBot : bedBot + (S(x, 0) - bedBot) * D.clamp((d - bedHalf) / (ga - bedHalf)); };
  strip(xs.map((x) => [x, S(x, 0), -GH]), C.soilMid, 0.0);
  strip(xs.map((x) => [x, S(x, 0), S(x, 0) - 0.1]), C.topsoil, 0.001);
  const bedXs = Array.from({ length: 41 }, (_, i) => cx - ga + (i * 2 * ga) / 40);
  strip(bedXs.map((x) => [x, S(x, 0) - 0.01, bedB(x)]), C.soilMix, 0.002);
  const mulchXs = bedXs.filter((x) => S0(x, 0) < -0.012);
  strip(mulchXs.map((x) => [x, S(x, 0) + 0.004, S(x, 0) - 0.06]), C.mulch, 0.003);
  strip(Array.from({ length: 13 }, (_, i) => cx - bedHalf + (i * 2 * bedHalf) / 12).map((x) => [x, bedBot, gravBot]), C.gravel, 0.003);
  { // mulch chips, gravel pebbles and soil-mix grains drawn on the face
    const r = X.rand(321), pg = new THREE.CircleGeometry(1, 6);
    for (let i = 0; i < 46; i++) { const x = cx - bedHalf + 0.02 + r() * (2 * bedHalf - 0.04), y = bedBot - 0.02 - r() * 0.13; const m = D.mesh(pg, D.pick([C.pebble, 0xa7a299, 0x77746d], r), { x, y, z: 0.0045, s: 0.012 + r() * 0.012, cast: false }, halves.back); m.scale.y *= 0.75; }
    for (let i = 0; i < 40; i++) { const x = mulchXs[0] + r() * (mulchXs[mulchXs.length - 1] - mulchXs[0]); const y = S(x, 0) - 0.01 - r() * 0.04; const m = D.mesh(new THREE.PlaneGeometry(1, 1), D.pick([0x8a6440, 0x4f3622, 0x9a7650], r), { x, y, z: 0.0042, rz: r() * 3, cast: false }, halves.back); m.scale.set(0.022 + r() * 0.02, 0.008, 1); }
    for (let i = 0; i < 70; i++) { const x = cx - bedHalf + r() * 2 * bedHalf, y = bedBot + 0.02 + r() * (S(x, 0) - 0.1 - bedBot); D.mesh(pg, D.pick([0xc2a674, 0x8c7048, 0xb89a68], r), { x, y, z: 0.0035, s: 0.004 + r() * 0.004, cast: false }, halves.back); }
    for (let i = 0; i < 50; i++) { const x = -GW / 2 + 0.03 + r() * (GW - 0.06), y = -0.15 - r() * 0.95; if (Math.abs(x - cx) < ga && y > gravBot - 0.03) continue; D.mesh(pg, D.pick([0x4a3627, 0x2f2219, 0x57402e], r), { x, y, z: 0.0015, s: 0.008 + r() * 0.012, cast: false }, halves.back); }
  }
  // groundwater band (rises when the water arrives) with a gently moving top
  const gwKeys = D.track([[0, -1.1], [T.recharge - 0.2, -1.1], [T.gw + 0.9, -0.96, 'power2.out']]);
  const gwStrip = strip(xs.map((x) => [x, -1.1, -GH]), 0, 0.0045, { mat: D.mat(C.groundwater, { phong: true, shininess: 60, emissive: C.groundwater, ei: 0.15 }) });
  D.onFrame((t) => {
    const p = gwStrip.geometry.attributes.position, lv = gwKeys(t);
    for (let i = 0; i < p.count; i++) if (p.getY(i) > -GH + 0.001) p.setY(i, lv + 0.008 * Math.sin(p.getX(i) * 9 + t * 1.6));
    p.needsUpdate = true;
  });
  // the front half's own cut face (seen only while it slides away)
  strip(xs.map((x) => [x, S(x, 0), -GH]), 0, -0.001, { parent: halves.front, mat: D.mat(C.soilMid, { side: THREE.DoubleSide }) });

  // house, downspout and a stone rill to the garden
  const house = D.house({ parent: halves.back, pos: { x: -0.72, z: -0.62 }, w: 0.8, d: 0.6, h: 0.42, roof: 0x8a5a44, wall: 0xe4dac4, seed: 61, chimney: true, floors: 2, cols: 4, winW: 0.075, winH: 0.085 });
  { const fm = D.mat(0xc8b48c); for (let i = 0; i < 20; i++) D.box(0.018, 0.1, 0.018, fm, { x: -1.42 + i * 0.15, y: 0.05, z: -1.04 }, halves.back);
    for (const y of [0.04, 0.08]) D.box(2.9, 0.012, 0.01, fm, { y, z: -1.04 }, halves.back); }
  D.box(0.035, 0.4, 0.035, 0x8d8a83, { x: -0.31, y: 0.21, z: -0.3 }, halves.back);
  D.box(0.82, 0.03, 0.035, 0x8d8a83, { x: -0.72, y: 0.425, z: -0.31 }, halves.back);
  D.box(0.12, 0.03, 0.035, 0x8d8a83, { x: -0.26, y: 0.02, z: -0.28, ry: -0.6 }, halves.back);
  { const r = X.rand(77); for (let i = 0; i < 11; i++) { const u = i / 10; D.mesh(D.jitter(new THREE.IcosahedronGeometry(0.03 + r() * 0.015, 0), 0.015, i), D.pick([0xa39d91, 0x8b867c, 0xbab4a8], r), { x: -0.24 + u * 0.3 + (r() - 0.5) * 0.04, y: 0.006, z: -0.25 + u * 0.13 + (r() - 0.5) * 0.06, s: [1, 0.45, 1] }, halves.back); } }
  D.tree({ parent: halves.back, pos: { x: -1.25, z: 0.0 }, seed: 64, h: 0.5 });
  D.tree({ parent: halves.back, pos: { x: 1.25, z: -0.85 }, seed: 65, h: 0.42 });
  D.tree({ parent: halves.front, pos: { x: -1.2, z: 0.75 }, seed: 66, h: 0.38 });
  D.plant({ parent: halves.back, pos: { x: -0.2, z: -0.95 }, kind: 'shrub', seed: 12, h: 0.12 });
  D.plant({ parent: halves.front, pos: { x: 1.3, z: 0.9 }, kind: 'shrub', seed: 13, h: 0.1 });
  // a path to the door
  for (let i = 0; i < 5; i++) D.box(0.09, 0.006, 0.07, 0xb8b2a4, { x: -0.72 + (i % 2) * 0.02, y: 0.003, z: -0.24 + i * 0.12 + (i > 2 ? 0.55 : 0), cast: false }, i > 2 ? halves.front : halves.back);

  // garden plants (grow in on "planted"); three sit on the section line so their roots read in the cut
  const plants = [];
  const pr = X.rand(919);
  const plantAt = (x, z, kind, seed, h) => {
    const parent = z < 0 ? halves.back : halves.front;
    const p = D.plant({ parent, pos: { x, y: S(x, z), z }, kind, seed, h });
    plants.push(p);
    return p;
  };
  const sectionPlants = [[cx - 0.38, -0.035, 'grass', 0.3], [cx + 0.02, -0.035, 'flower', 0.27], [cx + 0.4, -0.035, 'reed', 0.29]];
  sectionPlants.forEach(([x, z, k, h], i) => plantAt(x, z, k, 500 + i, h));
  for (let i = 0; i < 14; i++) {
    const a = pr() * Math.PI * 2, rr = Math.sqrt(pr()) * 0.78, x = cx + Math.cos(a) * ga * rr, z = Math.sin(a) * gb * rr;
    if (Math.abs(z) < 0.08) continue;
    plantAt(x, z, ['grass', 'flower', 'reed', 'flower', 'grass'][i % 5], 520 + i, 0.2 + pr() * 0.08);
  }
  plants.forEach((p, i) => {
    const ts = T.planted - 0.1 + i * 0.045;
    D.anim(p, { scale: [[ts, 0.001], [ts + 0.45, 1, 'back.out(2.2)']] });
    if (i % 3 === 0) X.sfx(ts + 0.05, 'pop', { gain: 0.12, pitch: 1.1 + (i % 4) * 0.1 });
  });
  D.sway(plants, { amp: 0.06, speed: 1.6, seed: 5 });
  // nutrient pulse: plants swell a little when the roots take up nutrients
  sectionPlants.forEach((_, i) => D.anim(plants[i], { 'scale.y': [[T.planted - 0.1 + i * 0.045, 0.001], [T.planted + 0.35 + i * 0.045, 1, 'back.out(2.2)'], [T.nutr + 0.1, 1], [T.nutr + 0.5, 1.16, 'back.out(2)'], [T.nutr + 1.4, 1.1]] }));

  // roots on the section face (tapered ribbons)
  const rootPaths = [];
  {
    const rr = X.rand(4242), rootMat = D.mat(C.root);
    const ribbon = (pts, w0, w1) => {
      const pos = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1], wa = w0 + (w1 - w0) * (i / (pts.length - 1)), wb = w0 + (w1 - w0) * ((i + 1) / (pts.length - 1));
        const dx = xb - xa, dy = yb - ya, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
        pos.push(xa - nx * wa, ya - ny * wa, 0.006, xb - nx * wb, yb - ny * wb, 0.006, xb + nx * wb, yb + ny * wb, 0.006, xa - nx * wa, ya - ny * wa, 0.006, xb + nx * wb, yb + ny * wb, 0.006, xa + nx * wa, ya + ny * wa, 0.006);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
      D.mesh(geo, rootMat, { cast: false }, halves.back);
    };
    sectionPlants.forEach(([x0]) => {
      const top = S(x0, 0) - 0.02, main = [[x0, top]];
      let x = x0, y = top;
      const depth = bedBot + 0.02 - rr() * 0.05;
      while (y > depth) { y -= 0.05; x += (rr() - 0.5) * 0.045; main.push([x, y]); }
      ribbon(main, 0.011, 0.003); rootPaths.push(main);
      for (const k of [2, 4, 6]) {
        if (k >= main.length - 1) continue;
        const dir = k % 4 === 2 ? 1 : -1, br = [main[k]];
        let bx = main[k][0], by = main[k][1];
        for (let j = 0; j < 4; j++) { bx += dir * (0.035 + rr() * 0.02); by -= 0.03 + rr() * 0.02; br.push([bx, by]); }
        ribbon(br, 0.006, 0.002); rootPaths.push(br);
      }
    });
  }

  // ---- turf peel (T3): the lawn over the dip curls back and lifts away on "rain garden"
  const peel = D.peelSheet(1.36, 1.7, C.grass, 0x3a2a1e, { parent: garden, pos: { x: cx, y: 0.006, z: 0 }, radius: 0.13, keys: [[T.rg - 0.15, 0], [T.rg + 0.6, 1, 'power2.inOut']] });
  peel.rotation.y = -Math.PI / 2;
  D.anim(peel, { 'position.y': [[T.rg + 0.55, 0.006], [T.rg + 1.0, 1.4, 'power2.in']], scale: [[T.rg + 0.6, 1], [T.rg + 1.0, 0.001, 'power2.in']], visible: [[0, true], [T.rg + 1.0, false]] });
  X.sfx(T.rg - 0.1, 'paper', { dur: 0.7, gain: 0.45 }); X.sfx(T.rg + 0.55, 'swoosh', { dur: 0.45, gain: 0.25 });

  // ---- act 2 water: light rain, roof → downspout → rill → dip; the pond fills, then drains away
  D.rain({ n: 300, area: [-1.5, 1.5, -1.1, 1.1], top: 2.4, len: 0.13, speed: 5.5, intensity: [[0, 0], [T.runoff - 0.6, 0], [T.runoff, 0.55], [L('pool').end - 0.6, 0.55], [L('pool').end, 0]], seed: 12, parent: garden,
    floor: (x, z) => (x > -1.13 && x < -0.31 && z > -0.93 && z < -0.31 ? 0.5 : S(x, z)) });
  D.rings({ n: 30, area: [-1.4, 1.4, -1.0, 1.0], floor: (x, z) => S(x, z), intensity: [[T.runoff - 0.3, 0], [T.runoff, 0.7], [L('pool').end - 0.6, 0.7], [L('pool').end, 0]], seed: 13, parent: garden, size: 0.04 });
  D.flow([[-0.31, 0.38, -0.3], [-0.31, 0.04, -0.3], [-0.22, 0.012, -0.25], [-0.05, 0.005, -0.15], [0.15, -0.06, -0.08], [0.35, -0.13, -0.04]], { n: 30, t0: T.runoff - 0.2, t1: L('pool').end, travel: 1.5, size: 0.016, spread: 0.03, seed: 14, parent: garden });
  X.sfx(T.runoff - 0.3, 'swoosh', { dur: 3.5, gain: 0.12, pitch: 0.75 }); X.sfx(T.runoff + 3, 'swoosh', { dur: 3.2, gain: 0.12, pitch: 0.75 });
  const pondLevel = D.track([[0, -gd - 0.01], [T.pools - 0.9, -gd - 0.01], [T.pools + 1.0, -0.035, 'power2.out'], [T.seeps, -0.045], [T.gw + 1, -0.07], [T.day, -0.075], [T.dry + 0.2, -gd - 0.01, 'power1.in']]);
  const rhoW = (yw) => Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, -yw) / gd, 1.25)));
  const pond = D.mesh(new THREE.CircleGeometry(1, 28, 0, Math.PI).rotateX(-Math.PI / 2), D.mat(C.water, { phong: true, shininess: 100, specular: 0xaabbcc, emissive: C.water, ei: 0.15, opacity: 0.82 }), { x: cx, cast: false, recv: true }, halves.back);
  pond.renderOrder = 2;
  const pondFace = strip(Array.from({ length: 25 }, () => [0, 0, 0]), 0, 0.005, { mat: D.mat(C.water, { phong: true, shininess: 60, emissive: C.water, ei: 0.2, opacity: 0.85 }) });
  pondFace.renderOrder = 2;
  D.onFrame((t) => {
    const yw = pondLevel(t), rw = rhoW(yw), on = rw > 0.06;
    pond.visible = on; pondFace.visible = on;
    if (!on) return;
    pond.position.y = yw; pond.scale.set(ga * rw * 0.985, 1, gb * rw * 0.985);
    const p = pondFace.geometry.attributes.position, n = 25;
    for (let i = 0; i < n - 1; i++) {
      const xa = cx - ga * rw + (2 * ga * rw * i) / (n - 1), xb = cx - ga * rw + (2 * ga * rw * (i + 1)) / (n - 1);
      const ba = Math.min(yw, S0(xa, 0) - 0.012), bb = Math.min(yw, S0(xb, 0) - 0.012), k = i * 18;
      const v = [xa, ba, xb, bb, xb, yw, xa, ba, xb, yw, xa, yw];
      for (let j = 0; j < 6; j++) { p.array[k + j * 3] = v[j * 2]; p.array[k + j * 3 + 1] = v[j * 2 + 1]; p.array[k + j * 3 + 2] = 0.005; }
    }
    p.needsUpdate = true;
  });
  X.sfx(T.pools - 0.6, 'bubble', { gain: 0.2, pitch: 0.6 });

  // ---- the split (T4) that opens the cross-section: the front half slides toward camera and drops away; it returns for act 3
  const tBack = T.small - 0.75;
  D.anim(halves.front, {
    'position.z': [[tSplitF, 0], [tSplitF + 0.85, 1.2, 'power2.out'], [tBack - 0.01, 1.2], [tBack, 0]],
    'position.y': [[tSplitF + 0.1, 0], [tSplitF + 0.85, -2.6, 'power2.in'], [tBack - 0.01, -2.6], [tBack, 3.2], [tBack + 0.45, 0, 'power2.in'], [tBack + 0.6, 0.03, 'sine.out'], [tBack + 0.75, 0, 'sine.in']],
    'rotation.x': [[tSplitF + 0.1, 0], [tSplitF + 0.85, 0.5, 'power2.in'], [tBack - 0.01, 0.5], [tBack, 0]],
    visible: [[0, true], [tSplitF + 0.85, false], [tBack, true]],
  });
  X.sfx(tSplitF, 'slide', { dur: 0.6, gain: 0.35, pitch: 0.7 }); X.sfx(tBack + 0.45, 'thud', { gain: 0.45 });

  // ---- section-face life: grit settles on the mulch; oil specks caught in the soil mix and eaten by microbes; roots carry nutrients
  const faceZ = 0.012, dot = new THREE.IcosahedronGeometry(1, 0);
  const pr2 = X.rand(1312);
  const grit = Array.from({ length: 16 }, () => ({ x: cx - 0.5 + pr2() * 1.0, ph: pr2(), m: D.mesh(dot, D.mat(0x3b352e), { cast: false, s: 0.009 + pr2() * 0.005 }, halves.back) }));
  D.onFrame((t) => {
    for (const g of grit) {
      const on = t > T.pools - 0.4 && t < T.dry; g.m.visible = on;
      if (!on) continue;
      const yw = pondLevel(t), floorY = S(g.x, 0) + 0.008, settle = D.prog(t, T.grit - 0.9 + g.ph * 0.3, T.grit + 0.4 + g.ph * 0.3, 'power2.in');
      const floatY = Math.max(floorY, yw - 0.025 - g.ph * 0.06) + Math.sin(t * 2 + g.ph * 6) * 0.004;
      g.m.position.set(g.x + Math.sin(t * 0.8 + g.ph * 9) * 0.01 * (1 - settle), floatY + (floorY - floatY) * settle, faceZ);
    }
  });
  const specks = Array.from({ length: 9 }, (_, i) => {
    const x = cx - 0.45 + i * 0.11 + pr2() * 0.04, yT = S(x, 0) - 0.08 - pr2() * 0.12;
    return { x, yT, ph: pr2(), m: D.mesh(dot, D.mat(0x1d1712), { cast: false, s: 0.011 }, halves.back),
      mic: [0, 1, 2].map((k) => ({ a: k * 2.1 + pr2(), m: D.mesh(dot, D.mat(0xf4e9a8, { basic: true }), { cast: false, s: 0.005 }, halves.back) })) };
  });
  D.onFrame((t) => {
    for (const s of specks) {
      const on = t > T.soilmix - 0.3 && t < T.oil2 + 1.2; s.m.visible = on;
      const down = D.prog(t, T.soilmix - 0.3 + s.ph * 0.3, T.filters + 0.3 + s.ph * 0.3, 'power2.out'), eat = D.prog(t, T.oil2 - 0.1 + s.ph * 0.4, T.oil2 + 0.7 + s.ph * 0.4, 'power2.in');
      s.m.position.set(s.x, S(s.x, 0) - 0.02 + (s.yT - S(s.x, 0) + 0.02) * down, faceZ);
      s.m.scale.setScalar(Math.max(0.0005, 0.011 * (1 - eat)));
      s.mic.forEach((mc, k) => {
        const mon = t > T.microbes - 0.1 + k * 0.08 && t < T.oil2 + 1.6; mc.m.visible = mon;
        if (!mon) return;
        const pop = D.ease('back.out(3)')(D.prog(t, T.microbes - 0.1 + k * 0.08 + s.ph * 0.2, T.microbes + 0.25 + k * 0.08 + s.ph * 0.2));
        const out = 1 - D.prog(t, T.oil2 + 0.9, T.oil2 + 1.6);
        const a = mc.a + t * 2.4, rad = 0.022 - 0.01 * eat;
        mc.m.position.set(s.x + Math.cos(a) * rad, s.yT + Math.sin(a) * rad, faceZ + 0.001);
        mc.m.scale.setScalar(Math.max(0.0005, 0.0065 * pop * out));
      });
    }
  });
  X.sfx(T.microbes, 'sparkle', { dur: 1.0, gain: 0.22 });
  // percolating water drops: through the soil mix to the gravel; after "seeps", all the way to the groundwater
  const perc = Array.from({ length: 34 }, (_, i) => ({ x: cx - 0.55 + (i % 17) * 0.068 + pr2() * 0.02, ph: pr2(), m: D.mesh(dot, D.waterMat(), { cast: false, s: 0.008 }, halves.back) }));
  D.onFrame((t) => {
    for (const p of perc) {
      const deep = t > T.seeps - 0.6, per = deep ? 2.6 : 1.9, u = (((t - T.soilmix) / per + p.ph) % 1 + 1) % 1, born = t - u * per;
      const on = born > T.soilmix - 0.6 && born < T.gw + 0.6 && t < T.day + 0.5; p.m.visible = on;
      if (!on) continue;
      const y0 = S(p.x, 0) - 0.07, y1 = born > T.seeps - 0.8 ? -1.0 : gravBot + 0.02;
      p.m.position.set(p.x + Math.sin(u * 9 + p.ph * 7) * 0.008, y0 + (y1 - y0) * u, faceZ);
      p.m.scale.set(0.008, 0.011, 0.008).multiplyScalar(Math.min(1, u / 0.1, (1 - u) / 0.12));
    }
  });
  X.sfx(T.seeps, 'drop', { gain: 0.18, pitch: 0.7 }); X.sfx(T.seeps + 0.5, 'drop', { gain: 0.14, pitch: 0.8 }); X.sfx(T.recharge + 0.3, 'bubble', { gain: 0.22, pitch: 0.55 });
  // nutrients climb the roots (green), up into the plants
  rootPaths.slice(0).forEach((path, i) => {
    const pts = path.slice().reverse().map(([x, y]) => [x, y, faceZ + 0.001]);
    if (pts.length < 2) return;
    D.flow(pts, { n: 7, t0: T.roots - 0.1 + i * 0.05, t1: T.nutr + 1.2, travel: 1.1, size: 0.007, water: false, mat: D.mat(0x9fd45a, { basic: true }), seed: 600 + i, spread: 0.002 });
  });
  X.sfx(T.roots, 'chime', { dur: 0.6, gain: 0.18 }); X.sfx(T.nutr + 0.1, 'blip_up', { gain: 0.1 });

  // labels: one per spoken noun, on elbow leader lines around (not over) the section
  D.label({ text: 'mulch', t0: T.mulch, t1: T.seeps - 0.4, anchor: V3(cx + 0.55, S(cx + 0.55, 0) - 0.03, 0.01), dx: 170, dy: -95 });
  D.label({ text: 'sandy soil mix', t0: T.soilmix, t1: T.seeps - 0.4, anchor: V3(cx + 0.5, -0.38, 0.01), dx: 190, dy: 30 });
  D.label({ text: 'microbes', t0: T.microbes, t1: T.oil2 + 1.4, anchor: V3(specks[2].x, specks[2].yT, 0.012), dx: -190, dy: -110 });
  D.label({ text: 'roots', t0: T.roots, t1: T.seeps - 0.4, anchor: V3(rootPaths[0][4][0], rootPaths[0][4][1], 0.01), dx: -200, dy: 40 });
  D.label({ text: 'groundwater', t0: T.gw - 0.05, t1: T.day + 0.2, anchor: V3(1.05, -1.0, 0.01), dx: 170, dy: -60 });

  // ---- night (T.day) and a mosquito that finds the dip already dry
  const mosq = D.group(garden);
  {
    D.mesh(new THREE.CylinderGeometry(0.006, 0.003, 0.06, 5), 0x2b2622, { rz: Math.PI / 2, cast: false }, mosq);
    D.mesh(new THREE.IcosahedronGeometry(0.008, 0), 0x2b2622, { x: 0.034, cast: false }, mosq);
    const wingM = new THREE.MeshBasicMaterial({ color: 0xf6f3ea, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    const w1 = D.mesh(new THREE.PlaneGeometry(0.035, 0.012).translate(0, 0.0, 0.017).rotateX(-Math.PI / 2), wingM, { y: 0.004, cast: false }, mosq);
    const w2 = D.mesh(new THREE.PlaneGeometry(0.035, 0.012).translate(0, 0.0, -0.017).rotateX(-Math.PI / 2), wingM, { y: 0.004, cast: false }, mosq);
    for (let i = 0; i < 3; i++) D.mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.04, 3), 0x2b2622, { x: -0.01 + i * 0.012, y: -0.015, rz: 0.3, cast: false }, mosq);
    mosq.scale.setScalar(3.4);
    D.onFrame((t) => { const f = Math.sin(t * 95) * 0.7; w1.rotation.x = f; w2.rotation.x = -f; });
    const t0 = T.mosq - 1.0, t1 = T.breed + 0.2, t2 = T.breed + 1.4;
    D.onFrame((t) => {
      mosq.visible = t > t0 && t < t2 + 0.1;
      if (!mosq.visible) return;
      let x, y, z, yaw;
      if (t < t0 + 0.6) { const u = D.ease('sine.out')((t - t0) / 0.6); x = 1.8 - (1.8 - (cx + 0.3)) * u; y = 0.55 - 0.3 * u; z = 0.2; yaw = Math.PI; }
      else if (t < t1) { const a = (t - t0 - 0.6) * 4.2; x = cx + Math.cos(a) * 0.3; z = Math.sin(a) * 0.18 - 0.2; y = 0.18 + Math.sin(t * 7) * 0.02; yaw = -a - Math.PI / 2; }
      else { const u = D.ease('power2.in')((t - t1) / (t2 - t1)); const a = (t1 - t0 - 0.6) * 4.2; x = cx + Math.cos(a) * 0.3 - 1.8 * u; z = Math.sin(a) * 0.18 - 0.2 - 0.6 * u; y = 0.18 + 1.2 * u; yaw = Math.PI * 0.85; }
      mosq.position.set(x, y + Math.sin(t * 11) * 0.008, z); mosq.rotation.y = yaw;
    });
    X.sfx(t0 + 0.1, 'slide', { dur: 1.6, gain: 0.08, pitch: 3.2 }); X.sfx(T.breed, 'swoosh', { dur: 0.6, gain: 0.15, pitch: 1.4 });
  }

  // ================================================================== ACT 3 — street by street: a mosaic of slabs assembles around the garden
  const mosaic = D.group(D.scene);
  D.onFrame((t) => { mosaic.visible = t > T.small - 0.6; });
  const mBlob = D.blob(11, 9.5, 0.45, mosaic, -1.5);
  const mtiles = [], gardensPop = [];
  const streetSlab = (x, z, seed, row) => {
    const g = D.group(mosaic, { x, z }), r = X.rand(seed);
    D.tile({ w: GW, d: GD, h: GH, top: C.grass, soil: C.soilMid, bands: true, parent: g });
    D.box(GW, 0.012, 0.34, C.asphalt, { y: 0.006, z: GD / 2 - 0.17, cast: false }, g);
    for (let i = 0; i < 6; i++) D.box(0.22, 0.004, 0.02, C.line, { x: -1.25 + i * 0.5, y: 0.013, z: GD / 2 - 0.17, cast: false }, g);
    D.box(GW, 0.02, 0.07, C.kerb, { y: 0.01, z: GD / 2 - 0.37 }, g);
    const nh = 2 + Math.floor(r() * 2);
    for (let i = 0; i < nh; i++) {
      const hx = -GW / 2 + (i + 0.5) * (GW / nh) + (r() - 0.5) * 0.15;
      D.house({ parent: g, pos: { x: hx, z: -0.5 + (r() - 0.5) * 0.2 }, w: 0.5 + r() * 0.2, d: 0.45, h: 0.3 + r() * 0.14, seed: seed + i, roof: D.pick(C.roof, r) });
      // a rain-garden spot in the front lawn (pops on "street by street")
      const gx = hx + 0.25, gz = 0.38;
      const spot = D.group(g, { x: gx, z: gz });
      D.mesh(new THREE.CircleGeometry(0.2, 10).rotateX(-Math.PI / 2), D.mat(C.mulch), { y: 0.004, s: [1.3, 1, 0.9], cast: false }, spot);
      for (let k = 0; k < 4; k++) D.plant({ parent: spot, pos: { x: (k - 1.5) * 0.08, z: (k % 2 - 0.5) * 0.1 }, kind: ['grass', 'flower', 'reed', 'flower'][k], seed: seed * 3 + k, h: 0.11 });
      gardensPop.push({ g: spot, row, x: x + gx, z: z + gz });
    }
    for (let i = 0; i < 2; i++) D.tree({ parent: g, pos: { x: -1.3 + r() * 2.6, z: -0.95 + r() * 0.2 }, seed: seed * 5 + i, h: 0.4 + r() * 0.2 });
    mtiles.push(g);
    return g;
  };
  const DX = GW + 0.06, DZ = GD + 0.06;
  [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].forEach(([i, j], k) => streetSlab(i * DX, j * DZ, 700 + k * 17, j + 1));
  const riverM = D.group(mosaic, { x: 0, z: -DZ * 1.5 - 0.62 });
  {
    D.tile({ w: DX * 3, d: 1.1, h: GH, top: C.grass, soil: C.soilMid, bands: true, parent: riverM });
    const wm = D.mat(C.murky, { phong: true, shininess: 90, specular: 0x8899aa, emissive: C.murky, ei: 0.1, unique: true });
    D.mesh(new THREE.BoxGeometry(DX * 3 + 0.002, 0.03, 0.62), wm, { y: -0.005, cast: false }, riverM);
    D.anim(wm, { color: [[T.sponge - 0.2, [0.44, 0.42, 0.27]], [T.sponge + 1.2, [0.31, 0.55, 0.75]]], emissive: [[T.sponge - 0.2, [0.44, 0.42, 0.27]], [T.sponge + 1.2, [0.31, 0.55, 0.75]]] });
    for (let i = 0; i < 9; i++) D.plant({ parent: riverM, pos: { x: -4.2 + i * 1.05, z: 0.42 }, kind: 'reed', seed: 800 + i, h: 0.16 });
    mtiles.push(riverM);
  }
  // order: closest to the hero first, then outward; river last
  D.assemble(mtiles, T.small - 0.55, { stagger: 0.1, dur: 0.5, height: 5 });
  gardensPop.sort((a, b) => a.row - b.row || a.x - b.x);
  gardensPop.forEach((gp, i) => {
    const ts = (gp.row === 0 ? T.street1 - 0.15 : gp.row === 1 ? (T.street1 + T.street2) / 2 : T.street2 + 0.05) + (i % 7) * 0.06;
    D.anim(gp.g, { scale: [[ts, 0.001], [ts + 0.4, 1, 'back.out(2.4)']] });
    if (i % 2 === 0) X.sfx(ts, 'pop', { gain: 0.16, pitch: 0.9 + (i % 5) * 0.08 });
  });
  X.sfx(T.street1, 'sparkle', { dur: 1.4, gain: 0.18 });
  // rain over the whole neighbourhood; now it sinks in (rings in every garden)
  D.rain({ n: 700, area: [-4.6, 4.6, -4.4, 3.5], top: 3.2, len: 0.2, speed: 6.5, intensity: [[0, 0], [T.sponge - 1.2, 0], [T.sponge - 0.4, 0.8], [T.cta + 0.4, 0.7], [T.cta + 1.4, 0]], seed: 31, thick: 0.012, opacity: 0.45 });
  D.rain({ n: 260, area: [-1.5, 1.5, -1.1, 1.1], top: 2.0, len: 0.09, speed: 5, intensity: [[0, 0], [T.cta + 0.4, 0], [T.cta + 1.2, 0.6], [END, 0.6]], seed: 34, thick: 0.005, opacity: 0.4, parent: garden,
    floor: (x, z) => (x > -1.13 && x < -0.31 && z > -0.93 && z < -0.31 ? 0.62 : S(x, z)) });
  D.rings({ n: 90, area: [-4.4, 4.4, -3.3, 3.3], floor: () => 0.006, intensity: [[T.sponge - 0.6, 0], [T.sponge, 0.8], [END, 0.6]], seed: 32, size: 0.06 });
  gardensPop.forEach((gp, i) => D.flow([[gp.x, 0.3, gp.z], [gp.x, 0.02, gp.z], [gp.x, -0.25, gp.z]], { n: 6, t0: T.sponge + (i % 5) * 0.05, t1: END, travel: 1.1, size: 0.02, seed: 900 + i }));
  X.sfx(T.sponge - 0.6, 'swoosh', { dur: 4.5, gain: 0.16, pitch: 0.65 }); X.sfx(T.sponge + 3.4, 'swoosh', { dur: 4.0, gain: 0.14, pitch: 0.65 });

  // ---- finale: the resident under the eaves, rain feeding the garden; then the paper-sheet wipe
  const me = D.mannequin({ parent: halves.front, pos: { x: 0.05, y: 0.0, z: 0.55 }, s: 1.15 });
  me.rotation.y = 0.6;
  D.onFrame((t) => { me.visible = t > T.small; me.userData.body.rotation.z = Math.sin(t * 1.2) * 0.025; me.userData.head.rotation.y = -0.3 + Math.sin(t * 0.6) * 0.3; });
  D.flow([[-0.31, 0.38, -0.3], [-0.31, 0.04, -0.3], [-0.22, 0.012, -0.25], [-0.05, 0.005, -0.15], [0.15, -0.06, -0.08], [0.35, -0.13, -0.04]], { n: 30, t0: T.sponge, t1: END, travel: 1.5, size: 0.016, spread: 0.03, seed: 15, parent: garden });
  D.paperWipe(tWipe, { dur: 0.85 });

  // ================================================================== end card (on the paper)
  const card = X.html('div', { style: { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', zIndex: 7, background: `#f4f1eb url(${X.paper('#f4f1eb', 960, 540, 0.05, 5)}) center/cover`, opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, Inter, sans-serif', color: '#3c4630' } });
  card.innerHTML = `
    <svg width="150" height="170" viewBox="0 0 150 170" style="margin-bottom:26px">
      <polygon points="75,8 40,70 75,62" fill="#5a93c4"/><polygon points="75,8 110,70 75,62" fill="#3f78ab"/>
      <polygon points="40,70 28,108 75,62" fill="#6aa2cf"/><polygon points="110,70 122,108 75,62" fill="#326a9b"/>
      <polygon points="28,108 52,150 75,62" fill="#4f88ba"/><polygon points="122,108 98,150 75,62" fill="#2d6290"/>
      <polygon points="52,150 98,150 75,62" fill="#3d75a6"/>
      <polygon points="75,150 60,120 75,96 88,121" fill="#6f8b3c"/><polygon points="75,150 88,121 75,96" fill="#5c7531"/>
    </svg>
    <div style="font-weight:700;font-size:78px;letter-spacing:16px;margin-left:16px">RAINCATCH</div>
    <div style="font-weight:500;font-size:28px;letter-spacing:10px;margin:10px 0 0 10px;color:#7a6e55">COLLECTIVE</div>
    <div style="font-family:Inter,sans-serif;font-weight:400;font-size:34px;margin-top:54px;color:#5b5446">Every roof is a watershed. Plant a rain garden.</div>`;
  X.tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'sine.inOut' }, tEndCard - 0.2);
  X.tl.fromTo(card.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, tEndCard);
  X.sfx(tEndCard + 0.05, 'chime', { dur: 0.8, gain: 0.2 });

  const trees = []; D.scene.traverse((o) => { if (o.userData && o.userData.kind === 'tree') trees.push(o); });
  D.sway(trees, { amp: 0.022, speed: 1.1, seed: 8 });
  D.subtitles({ size: 36, top: 1004, until: tEndCard - 0.2 });
  X.end(END);
});
