// 3D-diorama starter (parchment low-poly skin): a meadow slab in the rain flips into a planted bed, a callout blooms,
// the camera holds-and-moves, a paper sheet wipes to the end card. Every 3D state is a pure function of t.
// Swap skin: 'clay' for the white-clay-in-fog look (then use HUD labels instead of subtitles).
X.boot(async (X) => {
  await X.loadVO();
  const D = await DIO.init(X, { skin: 'parchment', groundY: -0.62 });
  const THREE = D.THREE, C = D.C, W = (id, w, n) => X.word(id, w, n), L = (id) => X.line(id);
  const END = L('b').end + 2.7, tFlip = W('b', 'flips') - 0.45, tWipe = L('b').end + 0.75;

  // ---- hero: one flip pair (T2). Face A = meadow with trees, face B = planted bed. Both built upright, top at y = 0.
  const pair = D.flipPair({ h: 0.42 });
  D.tile({ w: 2.4, d: 2.4, h: 0.42, top: C.grass, bands: true, parent: pair.a });
  for (let i = 0; i < 8; i++) D.tree({ parent: pair.a, pos: { x: -0.85 + (i % 4) * 0.56, z: -0.75 + Math.floor(i / 4) * 1.15 }, seed: 10 + i, h: 0.42 });
  D.house({ parent: pair.a, pos: { x: 0.55, z: 0.2 }, w: 0.42, d: 0.32, h: 0.24, seed: 3, floors: 1 });
  D.tile({ w: 2.4, d: 2.4, h: 0.42, top: C.mulch, bands: true, parent: pair.b });
  const plants = [];
  const pr = X.rand(31);
  for (let i = 0; i < 20; i++) plants.push(D.plant({ parent: pair.b, pos: { x: -0.95 + (i % 5) * 0.47 + (pr() - 0.5) * 0.15, z: -0.9 + Math.floor(i / 5) * 0.6 + (pr() - 0.5) * 0.15 }, kind: ['grass', 'flower', 'reed', 'shrub'][i % 4], seed: 30 + i, h: 0.3 + pr() * 0.08 }));
  plants.forEach((p, i) => { D.anim(p, { scale: [[tFlip + 0.5 + i * 0.03, 0.001], [tFlip + 0.95 + i * 0.03, 1, 'back.out(2.2)']] }); if (i % 4 === 0) X.sfx(tFlip + 0.55 + i * 0.03, 'pop', { gain: 0.12 }); });
  D.sway(plants, { amp: 0.06, speed: 1.6 });
  D.blob(3.4, 3.4, 0.5);
  D.flip(pair, [tFlip], { axis: new THREE.Vector3(Math.cos(0.45), 0, -Math.sin(0.45)), dur: 0.55, lift: 0.45 });

  // ---- weather: rain streaks + splash rings while line a plays (T5 family; all baked as functions of t)
  D.rain({ n: 300, area: [-1.2, 1.2, -1.2, 1.2], top: 2.4, thick: 0.006, opacity: 0.38, intensity: [[0, 0.8], [L('a').end, 0.8], [L('a').end + 0.5, 0]] });
  D.rings({ n: 30, area: [-1.15, 1.15, -1.15, 1.15], floor: () => 0.004, intensity: [[0, 1], [L('a').end, 1], [L('a').end + 0.4, 0]] });
  X.sfx(0.2, 'swoosh', { dur: 4.0, gain: 0.14, pitch: 0.7 });

  // ---- camera: hold-drift (barely moving) + one arrival move per claim (T1 + push)
  D.camKeys({
    az: [[0, 18], [W('a', 'slow'), 24, 'none'], [tFlip, 30, 'none'], [tFlip + 1.0, 42, 'power3.inOut'], [END, 46, 'none']],
    el: [[0, 26], [W('a', 'slow'), 30, 'power2.inOut'], [tFlip + 1.0, 34, 'power3.inOut']],
    r: [[0, 6.2], [W('a', 'slow'), 7.6, 'power2.inOut'], [tFlip, 7.8, 'none'], [tFlip + 1.0, 6.6, 'power3.inOut'], [END, 6.3, 'none']],
    ty: [[0, 0.1], [W('a', 'slow'), -0.05, 'power2.inOut']],
  });
  D.fade([[0, 1], [0.2, 1], [1.2, 0, 'sine.inOut']]);

  // ---- a callout projected from a 3D anchor (T11): thin leader, dot, ring pulse, label
  D.label({ text: 'one small world', t0: W('a', 'small'), t1: L('a').end + 0.4, anchor: new THREE.Vector3(1.2, 0.0, 1.2), dx: 170, dy: -90 });

  // ---- T7 paper-sheet wipe to an end card
  D.paperWipe(tWipe, { dur: 0.85 });
  const card = X.html('div', { style: { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', zIndex: 7, background: '#f4f1eb', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 72px Montserrat, sans-serif', letterSpacing: '14px', color: '#3c4630' }, text: 'YOUR ORG' });
  X.tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3 }, tWipe + 0.6);

  D.subtitles({ size: 36, top: 1004, until: tWipe + 0.6 });
  X.end(END);
});
