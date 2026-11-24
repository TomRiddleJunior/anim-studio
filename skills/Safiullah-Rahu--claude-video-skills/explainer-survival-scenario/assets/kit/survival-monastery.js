/* Survival-scenario kit · world module "The Monastery on the Rock" (needs survival-kit.js v2.2 + survival-stone.js).
 * A sheer rock pillar about 400 m tall rising out of a sea of moonlit mist, with lesser pillars round it and mountains
 * beyond; a small fictional stone monastery on its top (the gift shop with one lit window, the quarters above, a chapel
 * with a bell-cote, a winch house with a timber boom); a rope basket on its hoist rope, with a down-line to the valley
 * floor that can be cut and fall; the village lights below and a bus on the valley road. Interiors: the gift shop
 * (candles, postcards, magnets, the till, the old radio, the 1974 photo, the chapel door), the chapel (candles, the
 * guestbook on its stand with a torn bandage wrapper), the cellar (lentil sacks, the cistern hatch, boxes of magnets).
 * Physically lit and seek-safe.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.monastery.CREATE));
 *   const Mo = SURVIVAL.monastery(K);
 *   const hz = K.hazel(SURVIVAL.monastery.ELIF); const elif = SURVIVAL.monastery.dressElif(K, hz);
 *   …  SURVIVAL.stone(K).finish();
 *   K.render({ …kit state…, mistK, winK (lit window), shopI, chapelI, cellarI, winchI, radioK, bellA (deg), basketY (m,
 *              the basket's floor height), basketSway, ropeCut (s since the cut, -1 = intact), doorA (chapel door, deg),
 *              curtain (0..1), topWin (0..1, the top window's faint light), villageK, busT, eyesK, eyesI, eyesGather,
 *              eyesBlink, eyesScale, candleK, gutter })
 * World (metres; y up; north = -z): the pillar's foot round (0, 0, 0), its top at y 400 (TOP); the monastery stands on
 * the top, the winch house at its south edge (the basket hangs south of the cliff); the village lies south-west.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  const MOON = (() => { const az = 24 * D2R, el = 28 * D2R; return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]; })();
  const CREATE = {
    moonDir: MOON, moonCol: "#b2c4ff", bg: "#020409", fogCol: "#18243e", hemi: ["#3a4f86", "#141a14"],
    shadow: { half: 40, far: 900, dist: 420, center: [0, 400, 0] },
    sky: { zen: [0.005, 0.01, 0.03], hor: [0.045, 0.065, 0.12] },
    env: { zen: "#0a1430", hor: "#24345c", mside: "#4a5f96", gnd: "#0a0c10" },
  };
  const TOP = 400;
  const VIL = [-520, 0, 980];
  let K_fbm = null, K_noise = null;
  function valleyH(x, z) {
    const r = Math.hypot(x, z);
    let h = (K_fbm(x / 400 + 2, z / 400 - 1, 5, 4) - 0.5) * 24;
    h += ss((r - 2600) / 2400) * (700 + 600 * K_fbm(x / 1500, z / 1500, 9, 4));
    const dv = Math.hypot(x - VIL[0], z - VIL[2]); h *= lerp(0.3, 1, ss((dv - 120) / 250));
    return h;
  }
  // the main pillar's radius at height y and azimuth a (radians); the others reuse it with their own scale and seed
  function pillarR(a, y, H, R0, seed) {
    const u = y / H;
    let prof = lerp(1.12, 1.0, ss(u / 0.25)) * lerp(1.0, 0.82, ss((u - 0.35) / 0.65));
    prof *= 1 + 0.05 * Math.sin(u * 7 + seed);
    const ca = Math.cos(a), sa = Math.sin(a);
    let aw = Math.atan2(Math.sin(a), Math.cos(a));
    const wnd = seed === 1.3 ? ss(1 - Math.abs(aw) / 0.7) : 0;      // the main pillar's south sector (the basket side)
    const n1 = (K_fbm(ca * 1.6 + seed, sa * 1.6 + y / 90, 7, 4) - 0.5) * (1 - 0.75 * wnd);
    const fl = 1 - Math.abs(K_noise(a * 7 + seed, y / 30, 11) * 2 - 1);
    const cl = Math.pow(1 - Math.abs(K_noise(a * 4.2 + seed * 3, y / 70, 19) * 2 - 1), 3);
    let r = R0 * prof * (1 + 0.3 * n1 + 0.06 * fl - 0.07 * cl * (1 - wnd)) * (1 - 0.3 * wnd * ss((H - y) / 45));
    // v3 (rock, not a stump): lumps that change with height, horizontal ledges, weaker vertical flutes. On the main pillar they fade
    // out over the top 20 % (so topR, E0 and everything placed from them stay put) and in the basket's overhang sector.
    const keep = seed === 1.3 ? (1 - ss((u - 0.8) / 0.17)) * (1 - 0.85 * wnd) : 1;
    if (keep > 0) r *= (1 + keep * (rockLump(a, y, seed) - ledgeK(a, y, seed) * notch(ledgeSaw(a, y, seed)))) * (1 - keep * 0.035 * fl);
    return r;
  }
  // every azimuth term is periodic (cos a, sin a), so the mesh has no seam
  const ledgeLh = (seed) => 22 + 16 * ((seed * 7.31) % 1);
  function ledgeSaw(a, y, seed) { const v = y / ledgeLh(seed) + 0.55 * K_fbm(Math.cos(a) * 1.2 + seed * 5, Math.sin(a) * 1.2, 51, 2); return v - Math.floor(v); }
  function ledgeK(a, y, seed) { const Lh = ledgeLh(seed); return 0.1 * ss((K_fbm(Math.cos(a) * 2 + seed * 3.3, Math.sin(a) * 2 + y / (Lh * 2.3), 53, 2) - 0.3) / 0.22); }
  const notch = (sw) => ss(1 - Math.abs(sw - 0.5) / 0.085);                    // a bedding recess round saw = 0.5
  function rockLump(a, y, seed) { return (K_fbm(Math.cos(a) * 1.3 + seed * 2.1, Math.sin(a) * 1.3 + y / 40, 41, 3) - 0.5) * 0.5 + (K_fbm(seed * 5.3, y / 66, 43, 3) - 0.5) * 0.34; }

  function monastery(K) {
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox, rng = K.rng;
    K_fbm = K.fbm; K_noise = K.vnoise;
    K.buildSky();
    const Sx = S.stone(K);

    // ---------------------------------------------------------------- materials
    const rockM = Sx.conglomM("m_congl", { base: "#a8a096", dark: "#6f6962", lite: "#bfb8ae", ns: 0.8, vc: true });
    const wallM = Sx.stoneM("m_wall", { base: "#a69a84", alt: "#8a7f6c", rows: 6, mortar: 2.6, seed: 5 });
    const wallIn = Sx.stoneM("m_wallin", { base: "#c2b49a", alt: "#a89a82", rows: 5, seed: 17, mortar: 2.2 });
    const flagM = Sx.stoneM("m_flag", { base: "#7a7266", alt: "#655e54", rows: 4, seed: 23, mortar: 2.2 });
    const oakM = Sx.plankM("m_oak", { base: "#5e4430", n: 5 }), pineM = Sx.plankM("m_pine", { base: "#8a6a48", n: 4 }), boardM = Sx.plankM("m_boards", { base: "#4a3624", n: 8 });
    const plaster = Sx.plasterM("m_plaster", "#d8ccb4", { repeat: [2, 2] });
    const tileM = K.mat("#ffffff", { map: K.canvasTex("m_tiles", 256, 256, (g, w, h) => { g.fillStyle = "#6a3a26"; g.fillRect(0, 0, w, h); const R = rng(4); for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 20) { const o = (y / 16) % 2 ? 10 : 0; g.fillStyle = `rgb(${120 + R() * 50},${60 + R() * 26},${38 + R() * 18})`; g.beginPath(); g.ellipse(x + o + 10, y + 10, 9, 8, 0, 0, Math.PI); g.fill(); } g.fillStyle = "rgba(0,0,0,0.35)"; for (let y = 15; y < h; y += 16) g.fillRect(0, y, w, 1); }, { repeat: true }), rough: 0.7 });
    const ironM = mat("#2a2a2c", { metal: 0.45, rough: 0.5 }), ropeM = mat("#b49a6a", { rough: 0.9 });
    const SC = 3.2;
    function sbox(w, h, d) { const g = box(w, h, d), uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / SC, uv.getY(i) * dims[f][1] / SC); } return g; }
    const W = (w, h, d, p, m, parent) => M(sbox(w, h, d), m || wallM, p, parent);

    // ---------------------------------------------------------------- the valley, the mountains, the pillars
    function patch(size, seg, cx, cz, sink) {
      const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position, cols = [], c = new T.Color(), meadow = new T.Color("#2c3e28"), rock = new T.Color("#4a4840"), dirt = new T.Color("#4a4434");
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + cx, z = pa.getZ(i) + cz; const h = valleyH(x, z) - (sink ? sink(x, z) : 0); pa.setXYZ(i, x, h, z); const n = K.fbm(x / 80, z / 80, 5, 3); c.copy(meadow).lerp(dirt, n * 0.5).lerp(rock, ss((h - 120) / 300)); cols.push(c.r, c.g, c.b); }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      const m = M(g, mat("#ffffff", { vc: true, rough: 0.96, env: 0.2 }), { cast: false }); m.receiveShadow = true; return m;
    }
    patch(3000, 300, 0, 300, null);
    patch(16000, 200, 0, 0, (x, z) => (Math.abs(x) < 1495 && Math.abs(z - 300) < 1495 ? 10 : 0));
    // v3: rock, not a stump. A pillar leans (the main one bows a little at mid-height instead, so its top stays at 0,0), pillarR
    // gives it lumps and ledges, and its top rounds over in a shoulder into a domed, broken cap. The main pillar's shoulder is narrow,
    // kept clear of the buildings and the winch house, and ends in the flat courtyard (H + 0.8). Vertex colours carry the large-scale
    // variation over the conglomerate texture: patches, broken water streaks, the dark crevice under each ledge.
    const topR = (a) => pillarR(a, TOP, TOP, 30, 1.3);
    const AW = Math.atan2(2.0, 20);                                           // the winch-house azimuth
    const FOOT = [[-8.6, 6.6, -8.6, 1.6], [6, 17, -7.6, 0.6]];                 // footprints (x0, x1, z0, z1): main building, chapel + apse
    function footR(a) { const d = [Math.sin(a), Math.cos(a)]; let best = 0;
      for (const f of FOOT) { let t0 = 0, t1 = 1e9;
        for (let k = 0; k < 2; k++) { const lo = f[k * 2], hi = f[k * 2 + 1]; if (Math.abs(d[k]) < 1e-6) { if (lo > 0 || hi < 0) { t0 = 1; t1 = 0; } continue; } let ta = lo / d[k], tb = hi / d[k]; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); }
        if (t1 > t0) best = Math.max(best, t1); }
      return best; }
    function mainSh(a) {                                                      // [inset, height] of the main pillar's shoulder
      const aw = Math.atan2(Math.sin(a - AW), Math.cos(a - AW)), att = 0.5 + 0.5 * ss((Math.abs(aw) - 0.06) / 0.2);
      const room = Math.max(0, topR(a) - footR(a) - 2.2);
      return [Math.min(room, 3.5 + 4.5 * K_fbm(Math.cos(a) * 1.8 + 3, Math.sin(a) * 1.8, 71, 2)) * att, 8 + 9 * K_fbm(Math.cos(a) * 1.5 + 1, Math.sin(a) * 1.5, 73, 2)];
    }
    const rimR = (a) => topR(a) - mainSh(a)[0];
    function rockCol(a, y, R0, seed) {
      const ca = Math.cos(a), sa = Math.sin(a), f = R0 / 60;
      let k = 0.74 + 0.46 * K_fbm(ca * f + y / 90 + seed, sa * f - y / 140, 61, 3);
      const g = R0 / 13; const st = ss((K_noise(ca * g + seed * 9 + y / 300, sa * g, 63) - 0.66) * 5) * (0.3 + 0.7 * K_fbm(ca * g * 0.7 + y / 70, sa * g * 0.7 - y / 90, 65, 2));
      k *= 1 - 0.28 * st;
      const lk = ledgeK(a, y, seed); k *= 1 - 0.4 * notch(ledgeSaw(a, y, seed)) * Math.min(1, lk / 0.05);
      return k;
    }
    const PILL = [];
    function pillar(cx, cz, H, R0, seed, NS) {
      const main = seed === 1.3, pos = [], uv = [], col = [], idx = [];
      const ang = seed * 2.39, L = R0 * (0.22 + 0.22 * ((seed * 3.7) % 1));
      const off = (y) => { const u = clamp(y / H, 0, 1);
        return main ? [6.5 * Math.sin(Math.PI * u) * (1 - ss((u - 0.72) / 0.26)), 0] : [Math.cos(ang) * L * Math.pow(u, 1.4), Math.sin(ang) * L * Math.pow(u, 1.4)]; };
      const shA = [], shH = [];
      for (let i = 0; i <= NS; i++) { const a = (i / NS) * Math.PI * 2;
        if (main) { const q = mainSh(a); shA.push(q[0]); shH.push(q[1]); }
        else { shA.push(R0 * (0.34 + 0.16 * K_fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6, 75, 2))); shH.push(R0 * (0.45 + 0.25 * K_fbm(Math.cos(a) * 1.4 + seed * 2, Math.sin(a) * 1.4, 77, 2))); } }
      const Ht = main ? H + 0.8 : H;
      const ys = []; { const y1 = main ? Ht - 20 : Ht - 0.75 * R0, d0 = main ? 1.0 : (y1 + 20) / 130, d1 = main ? 0.5 : (Ht - y1) / 16;
        for (let y = -20; y < y1; y += d0) ys.push(y); for (let y = y1; y < Ht - 1e-3; y += d1) ys.push(y); ys.push(Ht); }
      const NY = ys.length - 1, nU = Math.max(1, Math.round(R0 * 2 * Math.PI / 15));
      const rimP = [];
      for (let j = 0; j <= NY; j++) { const y = ys[j], o = off(y);
        for (let i = 0; i <= NS; i++) { const a = (i / NS) * Math.PI * 2; let r = pillarR(a, Math.max(0, Math.min(y, H)), H, R0, seed);
          const t = (y - (Ht - shH[i])) / shH[i]; if (t > 0) r -= shA[i] * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
          pos.push(cx + o[0] + Math.sin(a) * r, y, cz + o[1] + Math.cos(a) * r); uv.push((i / NS) * nU, y / 15);
          const k = rockCol(a, y, R0, seed); col.push(k, k, k);
          if (j === NY) rimP.push([Math.sin(a) * r, Math.cos(a) * r, a]); } }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      // the cap: flat for the courtyard on the main pillar; a low dome with broken lumps on the others
      const o = off(Ht), c0 = pos.length / 3, ring = NY * (NS + 1), capH = 0.16 * R0;
      for (let k = 1; k <= 6; k++) { const sk = 1 - k / 7; for (let i = 0; i <= NS; i++) { const [x, z, a] = rimP[i];
        const hgt = main ? 0 : capH * Math.sin((k / 7) * Math.PI / 2) + 0.07 * R0 * (K_fbm(Math.cos(a) * 2 + k * 0.6 + seed, Math.sin(a) * 2 - k * 0.4, 79, 3) - 0.5) * Math.sin((k / 7) * Math.PI);
        pos.push(cx + o[0] + x * sk, Ht + hgt, cz + o[1] + z * sk); uv.push((x * sk) / 15, (z * sk) / 15); const kc = rockCol(a, Ht + k, R0, seed) * 1.05; col.push(kc, kc, kc); } }
      for (let k = 0; k < 6; k++) for (let i = 0; i < NS; i++) { const a = (k === 0 ? ring : c0 + (k - 1) * (NS + 1)) + i, b = c0 + k * (NS + 1) + i; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const ce = pos.length / 3; pos.push(cx + o[0], Ht + (main ? 0 : capH * 1.02), cz + o[1]); uv.push(0, 0); col.push(0.92, 0.92, 0.92);
      for (let i = 0; i < NS; i++) { const a = c0 + 5 * (NS + 1) + i; idx.push(a, a + 1, ce); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      PILL.push({ cx, cz, H, R0, seed, off, main });
      return M(g, rockM, { cast: true });
    }
    const mainP = pillar(0, 0, TOP, 30, 1.3, 200);
    const OTHERS = [[-430, -280, 300, 40, 4.1], [380, -560, 255, 46, 7.7], [-780, -900, 340, 62, 2.2], [640, 320, 175, 34, 5.5], [-80, 690, 215, 36, 8.8], [920, -1350, 380, 72, 3.3], [-1350, 240, 285, 56, 6.6], [180, 820, 140, 30, 9.9], [-1050, -260, 230, 44, 1.7]];
    for (const [x, z, H, R0, sd] of OTHERS) pillar(x, z, H, R0, sd, 110);
    // dark shrub tufts on the ledges (instanced, a lumpy flattened icosahedron)
    { const tg = new T.IcosahedronGeometry(1, 1), tp = tg.attributes.position;
      for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i); const k = 0.72 + 0.56 * K.hash2(Math.round(x * 100), Math.round(y * 100) + Math.round(z * 100) * 7, 81); tp.setXYZ(i, x * k, Math.max(-0.35, y) * k * 0.62, z * k); }
      tg.computeVertexNormals();
      const list = [], R = rng(83);
      for (const P of PILL) { const N = P.main ? 120 : 34;
        for (let k = 0, tries = 0; k < N && tries < N * 12; tries++) {
          const a = R() * Math.PI * 2, Lh = ledgeLh(P.seed), ph = 0.55 * K_fbm(Math.cos(a) * 1.2 + P.seed * 5, Math.sin(a) * 1.2, 51, 2);
          const yc = (Math.floor(R() * (P.H / Lh)) + 0.5 - ph) * Lh; if (yc < 70 || yc > P.H - (P.main ? 24 : 0.8 * P.R0)) continue;
          if (P.main && Math.cos(a) > 0.75) continue;                                       // not on the basket's face
          const rO = pillarR(a, yc - 0.13 * Lh, P.H, P.R0, P.seed), rI = pillarR(a, yc, P.H, P.R0, P.seed); if (rO - rI < 0.9) continue;
          const r = rI + 0.45 * (rO - rI), yf = yc - 0.075 * Lh, o = P.off(yf), sc = (P.main ? 1.3 : 1.8) + R() * (P.main ? 2.2 : 3.0);
          list.push([P.cx + o[0] + Math.sin(a) * r, yf + 0.2 * sc, P.cz + o[1] + Math.cos(a) * r, sc, R() * 6.28, R()]); k++; } }
      const tm = new T.InstancedMesh(tg, mat("#ffffff", { rough: 0.95 }), list.length), q = new T.Object3D(), tc = new T.Color(), c1 = new T.Color("#141c16"), c2 = new T.Color("#2c3628");
      list.forEach(([x, y, z, sc, ry, v], i) => { q.position.set(x, y, z); q.rotation.set(0, ry, 0); q.scale.set(sc, sc, sc); q.updateMatrix(); tm.setMatrixAt(i, q.matrix); tm.setColorAt(i, tc.copy(c1).lerp(c2, v)); });
      tm.castShadow = false; tm.receiveShadow = true; scene.add(tm); }

    // ---------------------------------------------------------------- mist: a moonlit sea round the pillars (gaps toward the village)
    Sx.mist([[60, 0.4, 9000, 0, 0, 3.2], [95, 0.34, 9000, 200, -300, 3.8], [130, 0.3, 8000, -300, 200, 4.4], [162, 0.24, 7000, 100, 100, 5.0], [190, 0.17, 6000, 0, -200, 5.6], [214, 0.09, 5000, 0, 0, 6.4]],
      { col: "#8fa2cc", lo: 0.4, fogD: 0.00018 });

    // ---------------------------------------------------------------- the monastery on the top
    const Mn = G({ y: TOP });
    // courtyard flagstones (a disc), a low parapet along the south edge by the winch house
    { const sh = new T.Shape(); for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2, r = Math.min(22, rimR(a) - 0.4); if (i === 0) sh.moveTo(Math.sin(a) * r, -Math.cos(a) * r); else sh.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
      const g = new T.ShapeGeometry(sh, 1); g.rotateX(-Math.PI / 2); const pa = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, pa.getX(i) / SC, pa.getZ(i) / SC); M(g, flagM, { y: 0.83, cast: false }, Mn); }
    // rock mounds round the rim and against the walls' feet (not on the south side, where the winch house and the edge shots are)
    { const R = rng(91), mm = rockM.clone(); mm.vertexColors = false;   // the same textures, no vertex colours
      for (let j = 0; j < 26; j++) { const a = (j / 26) * Math.PI * 2 + (R() - 0.5) * 0.2, aw = Math.atan2(Math.sin(a - AW), Math.cos(a - AW)); if (Math.abs(aw) < 0.7) { R(); R(); R(); R(); continue; }
        const rim = rimR(a), fr = footR(a); if (rim - fr < 2.0) { R(); R(); R(); R(); continue; }
        const r = lerp(fr + 0.2, rim - 1.0, R() * 0.75); let w = Math.min(2.6 + 3.2 * R(), (rim - fr) * 0.9); const h = 0.9 + 1.7 * R(), szk = 0.6 + 0.4 * R(), ry = R() * 360;
        // keep every mound out of the rooms: its centre's distance to a footprint (which already reaches 0.6 m past the walls), plus the
        // wall itself, bounds its radius (render 3 let one reach into the chapel and hide the guestbook)
        { const px = Math.sin(a) * r, pz = Math.cos(a) * r; let dmin = 1e9;
          for (const [x0, x1, z0, z1] of FOOT) dmin = Math.min(dmin, Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(z0 - pz, 0, pz - z1)));
          w = Math.min(w, (dmin + 0.9) / 1.15); }
        if (w < 1.0) continue;
        const g = new T.IcosahedronGeometry(1, 3), gp = g.attributes.position;
        for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), y = gp.getY(i), z = gp.getZ(i); const d = 1 + 0.5 * (K.fbm(x * 1.6 + j * 3, z * 1.6 + y * 1.3, 93, 3) - 0.5); gp.setXYZ(i, x * d, Math.max(y, -0.2) * d, z * d); }
        g.computeVertexNormals(); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i));
        M(g, mm, { x: Math.sin(a) * r, y: 0.75, z: Math.cos(a) * r, sx: w, sy: h, sz: w * szk, ry }, Mn); } }
    // the main building (gift shop below, quarters above): x -8…6, z -8…1, two storeys, a tiled gable roof (ridge along x)
    const B = { x0: -8, x1: 6, z0: -8, z1: 1, h: 8.6 }, BF = 0.85;
    const shopWin = { x: -1.0, w: 1.4, y0: BF + 1.0, y1: BF + 2.6 };
    // walls (south wall with the shop window and door, the upper windows)
    { const t = 0.7, y0 = BF;
      W(B.x1 - B.x0, B.h, t, { x: (B.x0 + B.x1) / 2, y: y0 + B.h / 2, z: B.z0 + t / 2 }, wallM, Mn);                 // north
      W(t, B.h, B.z1 - B.z0, { x: B.x0 + t / 2, y: y0 + B.h / 2, z: (B.z0 + B.z1) / 2 }, wallM, Mn);                 // west
      W(t, B.h, -3.95 - B.z0, { x: B.x1 - t / 2, y: y0 + B.h / 2, z: (B.z0 - 3.95) / 2 }, wallM, Mn);                 // east, with the chapel door opening
      W(t, B.h, B.z1 + 2.85, { x: B.x1 - t / 2, y: y0 + B.h / 2, z: (B.z1 - 2.85) / 2 }, wallM, Mn);
      W(t, B.h - 2.3, 1.1, { x: B.x1 - t / 2, y: y0 + 2.3 + (B.h - 2.3) / 2, z: -3.4 }, wallM, Mn);
      // south wall pieces round the shop window (x -1.7…-0.3, y 1.85…3.45) and the upper windows (x -5, 2.2; y 5.4…6.9)
      const zz = B.z1 - t / 2, wx0 = shopWin.x - shopWin.w / 2, wx1 = shopWin.x + shopWin.w / 2;
      W(wx0 - B.x0, B.h, t, { x: (B.x0 + wx0) / 2, y: y0 + B.h / 2, z: zz }, wallM, Mn);
      W(B.x1 - wx1, B.h, t, { x: (wx1 + B.x1) / 2, y: y0 + B.h / 2, z: zz }, wallM, Mn);
      W(shopWin.w, shopWin.y0 - y0, t, { x: shopWin.x, y: (y0 + shopWin.y0) / 2, z: zz }, wallM, Mn);
      W(shopWin.w, y0 + B.h - shopWin.y1, t, { x: shopWin.x, y: (shopWin.y1 + y0 + B.h) / 2, z: zz }, wallM, Mn);
      // the gable ends
      for (const x of [B.x0, B.x1]) { const sh = new T.Shape(); sh.moveTo(B.z0, 0); sh.lineTo(B.z1, 0); sh.lineTo((B.z0 + B.z1) / 2, 3.2); sh.lineTo(B.z0, 0); const g = new T.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: false }); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / SC, uv.getY(i) / SC); M(g, wallM, { x: x < 0 ? x + 0.7 : x, y: y0 + B.h, ry: -90, z: 0 }, Mn); }
      // roof
      const L = B.x1 - B.x0 + 1.2, half = (B.z1 - B.z0) / 2 + 0.6, rl = Math.hypot(half, 3.2);
      for (const s of [-1, 1]) { const g = new T.PlaneGeometry(L, rl + 0.2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 2.2, uv.getY(i) * rl / 2.2); const m = M(g, tileM, { x: (B.x0 + B.x1) / 2, y: y0 + B.h + 1.6, z: (B.z0 + B.z1) / 2 + s * half / 2, rx: -90 + s * (90 - Math.atan2(3.2, half) / D2R) }, Mn); m.material.side = T.DoubleSide; m.rotation.set(s > 0 ? -Math.atan2(3.2, half) : Math.atan2(3.2, half), 0, 0); m.rotateX(-Math.PI / 2 * s); } }
    // window glass, frames, sills; the lit shop window (warm, from inside), the upper windows (dark; one with a curtain)
    const winFrameM = mat("#3a2a1e", { rough: 0.7 });
    const glassM = new T.MeshPhysicalMaterial({ color: "#a8b6c4", roughness: 0.08, transparent: true, opacity: 0.12, envMapIntensity: 1.2, depthWrite: false, side: T.DoubleSide });
    M(new T.PlaneGeometry(shopWin.w, shopWin.y1 - shopWin.y0), glassM, { x: shopWin.x, y: (shopWin.y0 + shopWin.y1) / 2, z: B.z1 - 0.05, cast: false, receive: false, nodepth: true }, Mn).renderOrder = 3;
    M(box(0.06, shopWin.y1 - shopWin.y0, 0.1), winFrameM, { x: shopWin.x, y: (shopWin.y0 + shopWin.y1) / 2, z: B.z1 - 0.05 }, Mn);
    // the lit window seen from outside: a warm pane just outside the glass (its back is culled from inside)
    const shopPaneM = new T.MeshBasicMaterial({ map: K.canvasTex("m_pane", 64, 96, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffd49a"); gr.addColorStop(1, "#ff9e52"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(40,20,10,0.8)"; g.fillRect(w / 2 - 2, 0, 4, h); g.fillRect(0, h / 2 - 2, w, 4); }), color: new T.Color(1.4, 1.4, 1.4), transparent: true, opacity: 0.85, depthWrite: false });
    M(new T.PlaneGeometry(shopWin.w, shopWin.y1 - shopWin.y0), shopPaneM, { x: shopWin.x, y: (shopWin.y0 + shopWin.y1) / 2, z: B.z1 + 0.02, cast: false, receive: false, nodepth: true }, Mn).renderOrder = 4;
    M(box(shopWin.w, 0.06, 0.1), winFrameM, { x: shopWin.x, y: (shopWin.y0 + shopWin.y1) / 2, z: B.z1 - 0.05 }, Mn);
    M(box(shopWin.w + 0.3, 0.12, 0.35), wallIn, { x: shopWin.x, y: shopWin.y0 - 0.06, z: B.z1 + 0.1 }, Mn);
    // upper windows: shuttered dark panes; the top one (x 2.4) has a curtain that moves (st.curtain) and a faint light (st.topWin)
    const upPaneM = new T.MeshStandardMaterial({ color: "#0b0d12", roughness: 0.2, metalness: 0.1, envMapIntensity: 1.2 });
    const topWinM = new T.MeshBasicMaterial({ color: new T.Color("#ffb468").multiplyScalar(0) });
    for (const x of [-5.2, -1.0, 2.4]) {
      const isTop = x === 2.4;
      M(box(1.0, 1.4, 0.04), isTop ? topWinM : upPaneM, { x, y: BF + 6.1, z: B.z1 + 0.01, cast: false }, Mn);
      for (const s of [-1, 1]) M(box(0.08, 1.5, 0.12), winFrameM, { x: x + s * 0.54, y: BF + 6.1, z: B.z1 + 0.04 }, Mn);
      M(box(1.2, 0.1, 0.2), wallIn, { x, y: BF + 5.33, z: B.z1 + 0.08 }, Mn);
      if (!isTop) for (const s of [-1, 1]) M(box(0.5, 1.4, 0.05), oakM, { x: x + s * 0.8, y: BF + 6.1, z: B.z1 + 0.06, ry: s * 20 }, Mn);
    }
    const curtain = G({ x: 2.4, y: BF + 6.78, z: B.z1 - 0.03 }, Mn);
    const curtM = K.pmat("#d8cdb6", { rough: 0.9, sheen: 0.6, sheenColor: "#ffffff", side: T.DoubleSide });
    const curtG = new T.PlaneGeometry(0.5, 1.3, 8, 12); curtG.translate(0, -0.65, 0); { const pa = curtG.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 30) * 0.02); curtG.computeVertexNormals(); }
    const curtL = M(curtG, curtM, { x: -0.24, cast: false }, curtain), curtR = M(curtG, curtM, { x: 0.24, cast: false }, curtain);
    const topL = new T.PointLight("#ffb46a", 0, 6, 2); topL.position.set(2.4, TOP + BF + 6.0, B.z1 - 1.2); scene.add(topL);
    // the shop door (south wall, x 3.4): oak, closed
    { const d = G({ x: 3.4, y: BF, z: B.z1 + 0.02 }, Mn); M(box(1.1, 2.2, 0.08), oakM, { y: 1.1 }, d); for (const y of [0.4, 1.1, 1.8]) M(box(1.0, 0.05, 0.03), ironM, { y, z: 0.05 }, d); M(new T.TorusGeometry(0.06, 0.012, 6, 14), ironM, { x: 0.35, y: 1.05, z: 0.07 }, d);
      const sT = K.textTex("m_shopsign", 512, 160, (q, w, h) => { q.fillStyle = "#2e3a2c"; q.fillRect(0, 0, w, h); q.strokeStyle = "#c9a24a"; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = "#e9dfc6"; q.textAlign = "center"; q.font = "600 74px KitOswald, serif"; q.fillText("GIFT SHOP", w / 2, 106); });
      M(box(1.3, 0.4, 0.04), mat("#ffffff", { map: sT, rough: 0.7 }), { y: 2.55, z: 0.04 }, d); }
    // the chapel (east): x 6…13, z -7…0, with a semicircular apse to the east and a bell-cote on its west gable
    const Ch = { x0: 6, x1: 13, z0: -7, z1: 0, h: 5.6 };
    { const t = 0.6, y0 = BF;
      W(Ch.x1 - Ch.x0, Ch.h, t, { x: (Ch.x0 + Ch.x1) / 2, y: y0 + Ch.h / 2, z: Ch.z0 + t / 2 }, wallM, Mn);
      W(Ch.x1 - Ch.x0, Ch.h, t, { x: (Ch.x0 + Ch.x1) / 2, y: y0 + Ch.h / 2, z: Ch.z1 - t / 2 }, wallM, Mn);
      const ag = new T.CylinderGeometry(3.0, 3.0, Ch.h, 24, 1, false, 0, Math.PI); { const uv = ag.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9.4 / SC, uv.getY(i) * Ch.h / SC); }
      M(ag, wallM, { x: Ch.x1, y: y0 + Ch.h / 2, z: (Ch.z0 + Ch.z1) / 2 }, Mn);
      const L = Ch.x1 - Ch.x0 + 0.6, half = (Ch.z1 - Ch.z0) / 2 + 0.5;
      for (const s of [-1, 1]) { const g = new T.PlaneGeometry(L, Math.hypot(half, 2.4)); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 2.2, uv.getY(i) * 3); const m = M(g, tileM, { x: (Ch.x0 + Ch.x1) / 2, y: y0 + Ch.h + 1.2, z: (Ch.z0 + Ch.z1) / 2 + s * half / 2 }, Mn); m.material.side = T.DoubleSide; m.rotation.set(-s * (Math.PI / 2 - Math.atan2(2.4, half)), 0, 0); m.rotateX(s > 0 ? -Math.PI / 2 : Math.PI / 2); m.rotation.x = s > 0 ? -(Math.PI / 2) + Math.atan2(2.4, half) - Math.PI / 2 + Math.PI / 2 : 0; }
      const cone = new T.ConeGeometry(3.3, 2.0, 24, 1, true, 0, Math.PI); M(cone, tileM, { x: Ch.x1, y: y0 + Ch.h + 1.0, z: (Ch.z0 + Ch.z1) / 2 }, Mn).material.side = T.DoubleSide;
      // an arched window in the chapel's south wall (moonlight in), and one in the apse
      M(box(0.7, 1.6, 0.05), new T.MeshStandardMaterial({ color: "#10141c", roughness: 0.1, envMapIntensity: 1.3 }), { x: 9.5, y: y0 + 2.8, z: Ch.z1 + 0.01, cast: false }, Mn); }
    // a proper roof for the chapel: two tiled planes (built simply, ridge along x)
    { Mn.children.filter((o) => o.isMesh && o.material === tileM && o.geometry.type === "PlaneGeometry" && Math.abs(o.position.x - (Ch.x0 + Ch.x1) / 2) < 0.01).forEach((o) => o.parent.remove(o));
      const half = (Ch.z1 - Ch.z0) / 2 + 0.5, rise = 2.4, L = Ch.x1 - Ch.x0 + 0.6;
      const rg = new T.BufferGeometry(); const y0 = BF + Ch.h, cz = (Ch.z0 + Ch.z1) / 2, x0 = Ch.x0 - 0.3, x1 = Ch.x1 + 0.3;
      rg.setAttribute("position", new T.Float32BufferAttribute([x0, y0, cz - half, x1, y0, cz - half, x1, y0 + rise, cz, x0, y0 + rise, cz, x0, y0, cz + half, x1, y0, cz + half], 3));
      rg.setAttribute("uv", new T.Float32BufferAttribute([0, 0, L / 2.2, 0, L / 2.2, 1.6, 0, 1.6, 0, 0, L / 2.2, 0], 2)); rg.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 2, 4, 2, 3]); rg.computeVertexNormals(); M(rg, tileM, {}, Mn); }
    // the main roof, rebuilt the same way (the planes above are replaced)
    { Mn.children.filter((o) => o.isMesh && o.material === tileM && o.geometry.type === "PlaneGeometry").forEach((o) => o.parent.remove(o));
      const half = (B.z1 - B.z0) / 2 + 0.6, rise = 3.2, cz = (B.z0 + B.z1) / 2, y0 = BF + B.h, x0 = B.x0 - 0.6, x1 = B.x1 + 0.6, L = x1 - x0;
      const rg = new T.BufferGeometry();
      rg.setAttribute("position", new T.Float32BufferAttribute([x0, y0, cz - half, x1, y0, cz - half, x1, y0 + rise, cz, x0, y0 + rise, cz, x0, y0, cz + half, x1, y0, cz + half], 3));
      rg.setAttribute("uv", new T.Float32BufferAttribute([0, 0, L / 2.2, 0, L / 2.2, 2.2, 0, 2.2, 0, 0, L / 2.2, 0], 2)); rg.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 2, 4, 2, 3]); rg.computeVertexNormals(); M(rg, tileM, {}, Mn);
      M(box(L, 0.18, 0.3), tileM, { x: (x0 + x1) / 2, y: y0 + rise + 0.05, z: cz }, Mn); }
    // the bell-cote on the chapel's west end: two piers, an arch, the bell (swings with st.bellA)
    const BC = [7.0, BF + Ch.h + 1.2, -3.5];
    { W(0.5, 2.6, 0.7, { x: BC[0], y: BC[1] + 1.3, z: BC[2] - 0.85 }, wallM, Mn); W(0.5, 2.6, 0.7, { x: BC[0], y: BC[1] + 1.3, z: BC[2] + 0.85 }, wallM, Mn); W(0.6, 0.5, 2.4, { x: BC[0], y: BC[1] + 2.85, z: BC[2] }, wallM, Mn);
      const cap = new T.ConeGeometry(1.0, 0.9, 4); M(cap, tileM, { x: BC[0], y: BC[1] + 3.5, z: BC[2], ry: 45 }, Mn); }
    const bell = G({ x: BC[0], y: TOP + BC[1] + 2.5, z: BC[2] });
    { const bp = []; [[0, 0], [0.12, 0], [0.16, -0.08], [0.2, -0.32], [0.3, -0.52], [0.32, -0.56], [0.0, -0.56]].forEach(([r, y]) => bp.push(new T.Vector2(r, y))); const bg = new T.LatheGeometry(bp, 28); M(bg, mat("#8a6a34", { metal: 0.6, rough: 0.35, side: T.DoubleSide }), {}, bell); M(sph(0.06, 10, 8), ironM, { y: -0.5 }, bell); M(box(0.12, 0.12, 1.1), oakM, { y: 0.04 }, bell); }
    // a bell rope down through the chapel roof into the shop corner (x 5.1, z -6.6)
    // the winch house at the south edge: four oak posts, a tiled roof, the windlass with crank and spokes, a timber boom with a pulley
    const E0 = topR(Math.atan2(2.0, 20)) * 0.985;                // the south rim at the winch house
    const WH = [2.0, BF, E0 - 4.6];
    const winchHouse = G({ x: WH[0], y: WH[1], z: WH[2] }, Mn);
    { for (const [x, z] of [[-1.8, -1.6], [1.8, -1.6], [-1.8, 1.6], [1.8, 1.6]]) M(box(0.22, 3.0, 0.22), oakM, { x, y: 1.5, z }, winchHouse);
      M(box(4.4, 0.18, 3.8), oakM, { y: 3.05 }, winchHouse);
      { const rg = new T.ConeGeometry(3.4, 1.3, 4, 1, false); M(rg, tileM, { y: 3.8, ry: 45, sx: 1.0, sz: 0.85 }, winchHouse); }
      M(box(3.6, 0.12, 3.2), pineM, { y: 0.06 }, winchHouse);
      // the landing platform at the edge (the basket sets down on it), a low rail with a gap
      M(box(2.2, 0.16, 4.2), pineM, { y: 0.0, z: 3.8 }, winchHouse);
      for (const s of [-1, 1]) { M(box(0.1, 1.0, 0.1), oakM, { x: s * 1.1, y: 0.5, z: 5.75 }, winchHouse); }
      M(box(0.08, 0.08, 4.0), oakM, { x: -1.1, y: 0.95, z: 3.8 }, winchHouse); M(box(0.08, 0.08, 4.0), oakM, { x: 1.1, y: 0.95, z: 3.8 }, winchHouse);
      // the boom: two raked beams out over the edge with the pulley at the tip
      for (const s of [-0.35, 0.35]) K.rod([s, 2.9, 1.5], [s * 0.4, 3.6, 6.6], 0.11, oakM, winchHouse, 6);
      M(cyl(0.22, 0.22, 0.12, 20), ironM, { y: 3.55, z: 6.65, rz: 90 }, winchHouse);
      // a sign on the post: LIFT · 2 PERSONS (the "elevator" line)
      const lT = K.textTex("m_lift", 384, 192, (q, w, h) => { q.fillStyle = "#e6dcc4"; q.fillRect(0, 0, w, h); q.strokeStyle = "#5a4430"; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = "#3a2a1e"; q.textAlign = "center"; q.font = "700 64px KitOswald, serif"; q.fillText("LIFT", w / 2, 82); q.font = "600 40px KitOswald, serif"; q.fillText("2 PERSONS MAX", w / 2, 146); });
      winchHouse.userData.liftT = lT; }
    const windlass = G({ x: WH[0], y: TOP + WH[1] + 1.0, z: WH[2] - 0.2 });
    { M(cyl(0.22, 0.22, 2.2, 20), oakM, { rz: 90 }, windlass); for (const x of [-0.8, 0.8]) M(cyl(0.235, 0.235, 0.05, 20), ironM, { x, rz: 90 }, windlass);
      M(cyl(0.26, 0.26, 0.5, 20), ropeM, { rz: 90 }, windlass);   // rope wound on the drum
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; K.rod([1.15, 0, 0], [1.15, Math.cos(a) * 0.62, Math.sin(a) * 0.62], 0.035, oakM, windlass, 6); } M(cyl(0.05, 0.05, 0.3, 8), ironM, { x: 1.15, rz: 90 }, windlass); }
    for (const s of [-1, 1]) { M(box(0.16, 1.0, 0.16), oakM, { x: WH[0] + s * 1.15, y: TOP + WH[1] + 0.5, z: WH[2] - 0.2 }); }
    // the edge of the top: a parapet of rough stones round the rim except at the landing
    { const R = rng(55); for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; if (Math.abs(a - Math.atan2(2.0, 20)) < 0.16) continue; const r = rimR(a) - 1.6; const x = Math.sin(a) * r, z = Math.cos(a) * r; W(0.9 + R() * 0.4, 0.5 + R() * 0.25, 0.5, { x, y: BF + 0.3, z, ry: a / D2R + 90 }, wallM, Mn); } }

    // ---------------------------------------------------------------- the basket, its hoist rope and the down-line
    const PUL = [WH[0], TOP + WH[1] + 3.55, WH[2] + 6.65];
    const basket = G({});
    { const wick = K.canvasTex("m_wicker", 256, 128, (q, w, h) => { q.fillStyle = "#8a6a3e"; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { q.fillStyle = (y / 8) % 2 ? "#a8844e" : "#6e5230"; for (let x = 0; x < w; x += 16) q.fillRect(x + ((y / 8) % 2) * 8, y, 12, 7); } q.fillStyle = "rgba(0,0,0,0.4)"; for (let x = 0; x < w; x += 16) q.fillRect(x, 0, 2, h); }, { repeat: true });
      wick.repeat.set(4, 2);
      const wm = mat("#ffffff", { map: wick, rough: 0.9, side: T.DoubleSide });
      M(new T.CylinderGeometry(0.62, 0.55, 0.95, 28, 1, true), wm, { y: 0.48 }, basket); M(cyl(0.56, 0.56, 0.05, 28), wm, { y: 0.02 }, basket);
      M(new T.TorusGeometry(0.62, 0.035, 8, 28), mat("#6e5230", { rough: 0.8 }), { y: 0.96, rx: 90 }, basket);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; K.rod([Math.sin(a) * 0.6, 0.96, Math.cos(a) * 0.6], [0, 2.4, 0], 0.012, ropeM, basket, 4); }
      M(new T.TorusGeometry(0.06, 0.015, 6, 14), ironM, { y: 2.42, rx: 90 }, basket);
      M(box(0.5, 0.25, 0.025), mat("#ffffff", { map: winchHouse.userData.liftT, rough: 0.7 }), { x: 0.2, y: 0.72, z: 0.64, ry: 18, rx: -4 }, basket); }
    const hoist = M(cyl(0.022, 0.022, 1, 6), ropeM, {});           // pulley -> basket ring (scaled per frame)
    const downG = G({});                                            // basket floor -> valley floor (falls when cut)
    const down = M(cyl(0.02, 0.02, 1, 6), ropeM, { y: -0.5, cast: false }, downG);
    const DROPX = PUL[0], DROPZ = PUL[2];

    // ---------------------------------------------------------------- interiors: the gift shop (ground floor, x -7.3…5.3, z -7.3…0.3)
    const shop = G({ y: TOP });
    const SX0 = -7.3, SX1 = 5.3, SZ0 = -7.3, SZ1 = 0.3, F = BF + 0.02, SH = 3.6;
    W(SX1 - SX0, 0.06, SZ1 - SZ0, { x: (SX0 + SX1) / 2, y: F - 0.03, z: (SZ0 + SZ1) / 2 }, boardM, shop);
    W(SX1 - SX0, 0.12, SZ1 - SZ0, { x: (SX0 + SX1) / 2, y: F + SH, z: (SZ0 + SZ1) / 2 }, boardM, shop);
    for (let x = SX0 + 0.8; x < SX1; x += 1.6) M(box(0.22, 0.26, SZ1 - SZ0), oakM, { x, y: F + SH - 0.13, z: (SZ0 + SZ1) / 2 }, shop);   // ceiling beams
    W(SX1 - SX0, SH, 0.04, { x: (SX0 + SX1) / 2, y: F + SH / 2, z: SZ0 + 0.02 }, plaster, shop);
    W(0.04, SH, SZ1 - SZ0, { x: SX0 + 0.02, y: F + SH / 2, z: (SZ0 + SZ1) / 2 }, plaster, shop);
    // east wall (with the chapel door at z -3.4), south wall inner face round the window
    W(0.04, SH, 2.4, { x: SX1 - 0.02, y: F + SH / 2, z: SZ0 + 1.2 }, plaster, shop); W(0.04, SH, 2.6, { x: SX1 - 0.02, y: F + SH / 2, z: SZ1 - 1.3 }, plaster, shop); W(0.04, SH - 2.3, 2.6, { x: SX1 - 0.02, y: F + 2.3 + (SH - 2.3) / 2, z: -3.4 }, plaster, shop);
    { const wx0 = shopWin.x - shopWin.w / 2, wx1 = shopWin.x + shopWin.w / 2; W(wx0 - SX0, SH, 0.04, { x: (SX0 + wx0) / 2, y: F + SH / 2, z: SZ1 - 0.02 }, plaster, shop); W(SX1 - wx1, SH, 0.04, { x: (wx1 + SX1) / 2, y: F + SH / 2, z: SZ1 - 0.02 }, plaster, shop);
      W(shopWin.w, shopWin.y0 - F, 0.04, { x: shopWin.x, y: (F + shopWin.y0) / 2, z: SZ1 - 0.02 }, plaster, shop); W(shopWin.w, F + SH - shopWin.y1, 0.04, { x: shopWin.x, y: (shopWin.y1 + F + SH) / 2, z: SZ1 - 0.02 }, plaster, shop); }
    // the chapel door (east wall, z -3.4): an arched oak door that swings open (st.doorA)
    const door = G({ x: SX1 - 0.05, y: F, z: -3.4 - 0.55 }, shop);
    { const dg = G({ z: 0.55 }, door); M(box(0.08, 2.25, 1.1), oakM, { y: 1.125 }, dg); for (const y of [0.4, 1.1, 1.8]) M(box(0.03, 0.05, 1.0), ironM, { x: -0.05, y }, dg); M(new T.TorusGeometry(0.05, 0.01, 6, 14), ironM, { x: -0.07, y: 1.05, z: 0.35, ry: 90 }, dg); }
    // behind the door: a dark passage to the chapel (st.passI: a faint warm light in it, so an ajar door reads as a gap)
    const passL = new T.PointLight("#ffae62", 0, 4, 2); passL.position.set(SX1 + 1.0, F + 1.3, -3.4); shop.add(passL);
    W(1.6, 2.4, 0.05, { x: SX1 + 0.8, y: F + 1.2, z: -3.4 - 0.62 }, wallIn, shop); W(1.6, 2.4, 0.05, { x: SX1 + 0.8, y: F + 1.2, z: -3.4 + 0.62 }, wallIn, shop);
    // the counter + till (north-west part), shelves of candles, the postcard spinner, boxes of magnets, the radio, the 1974 photo
    const CT = { x: 3.2, z: -3.7 };
    const counter = G({ x: CT.x, y: F, z: CT.z, ry: 90 }, shop);
    { M(box(2.6, 0.95, 0.7), oakM, { y: 0.475 }, counter); M(box(2.75, 0.05, 0.8), Sx.plankM("m_top", { base: "#7a5838", n: 3 }), { y: 0.97 }, counter);
      // the till: an old brass-and-black register
      const till = G({ x: -0.75, y: 1.0, z: 0.0, ry: 15 }, counter); M(rbox(0.36, 0.2, 0.32, 0.03), mat("#2a2420", { metal: 0.3, rough: 0.4 }), { y: 0.1 }, till); M(box(0.36, 0.14, 0.04), mat("#a8844a", { metal: 0.6, rough: 0.35 }), { y: 0.26, z: -0.1, rx: -20 }, till);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) M(cyl(0.016, 0.016, 0.02, 10), mat("#e8e0cc", { rough: 0.5 }), { x: -0.11 + c * 0.075, y: 0.21, z: 0.04 + r * 0.06 - 0.02, rx: 0 }, till);
      // a box of magnets on the counter and a spike with receipts
      const magT = K.canvasTex("m_magbox", 128, 64, (q, w, h) => { q.fillStyle = "#c8ad7e"; q.fillRect(0, 0, w, h); const R = rng(8); for (let i = 0; i < 26; i++) { q.fillStyle = ["#c0392b", "#2e86c1", "#f1c40f", "#27ae60", "#ecf0f1", "#8e44ad"][Math.floor(R() * 6)]; q.fillRect(4 + R() * (w - 16), 4 + R() * (h - 16), 10, 8); } });
      M(box(0.3, 0.08, 0.22), mat("#b89a6a", { rough: 0.8 }), { x: 0.75, y: 1.04, z: 0.05 }, counter); M(new T.PlaneGeometry(0.28, 0.2), mat("#ffffff", { map: magT }), { x: 0.75, y: 1.085, z: 0.05, rx: -90, cast: false }, counter); }
    // the visitor clicker on the counter (a plant at the end): a two-window tally, UP 41 · DOWN 40
    const clickT = K.textTex("m_click", 512, 288, (q, w, h) => { q.fillStyle = "#3c4046"; q.fillRect(0, 0, w, h); q.fillStyle = "#e8e8ea"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("UP", 128, 62); q.fillText("DOWN", 384, 62);
      for (const [cx, v] of [[128, "41"], [384, "40"]]) { q.fillStyle = "#d8e2c8"; q.fillRect(cx - 104, 84, 208, 160); q.fillStyle = "#14181a"; q.font = "700 138px KitOswald, sans-serif"; q.fillText(v, cx, 216); } });
    function clicker(parent, p) { const g = G(p || {}, parent); M(rbox(0.11, 0.065, 0.03, 0.01), mat("#4a4f56", { metal: 0.3, rough: 0.4 }), {}, g); M(new T.PlaneGeometry(0.1, 0.056), new T.MeshBasicMaterial({ map: clickT, color: new T.Color(0.92, 0.92, 0.92) }), { z: 0.0201, cast: false }, g);
      for (const s of [-1, 1]) M(cyl(0.008, 0.008, 0.016, 10), mat("#c8ccd0", { metal: 0.6, rough: 0.3 }), { x: s * 0.03, y: 0.04, rz: 0 }, g); return g; }
    const clickOnCounter = clicker(counter, { x: 0.15, y: 1.005, z: 0.18, rx: -78, rz: 188, s: 1.35 });
    // shelves on the west and north walls: candles (some lit, a votive tray), magnets, postcards
    const shelf = (x, z, ry, n) => { const g = G({ x, y: F, z, ry }, shop); for (let k = 0; k < n; k++) M(box(2.2, 0.04, 0.32), pineM, { y: 0.7 + k * 0.45 }, g); for (const s of [-1, 1]) M(box(0.04, 0.7 + n * 0.45, 0.32), pineM, { x: s * 1.1, y: (0.7 + n * 0.45) / 2 }, g); return g; };
    const sh1 = shelf(SX0 + 0.2, -2.2, 90, 4), sh2 = shelf(-0.4, SZ0 + 0.2, 0, 4);
    { const R = rng(31), cand = [mat("#efe6cf", { rough: 0.6 }), mat("#d8b46a", { rough: 0.6 }), mat("#c94c3c", { rough: 0.6 })];
      for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) { const h = 0.12 + R() * 0.18; M(cyl(0.025 + R() * 0.012, 0.03, h, 12), cand[Math.floor(R() * 3)], { x: -1.0 + i * 0.24, y: 0.72 + k * 0.45 + h / 2, z: 0.0 }, sh1); }
      // the north shelf: boxes of magnets and stacks of postcards
      const boxT = K.textTex("m_magnetsbox", 256, 128, (q, w, h) => { q.fillStyle = "#c8ad7e"; q.fillRect(0, 0, w, h); q.strokeStyle = "#5a4630"; q.lineWidth = 4; q.strokeRect(6, 6, w - 12, h - 12); q.fillStyle = "#3a2a1e"; q.textAlign = "center"; q.font = "700 46px KitOswald, sans-serif"; q.fillText("MAGNETS · 100", w / 2, 80); });
      for (let k = 0; k < 4; k++) for (let i = 0; i < 5; i++) { const b = M(box(0.36, 0.22, 0.28), mat("#ffffff", { map: boxT, rough: 0.8 }), { x: -0.85 + i * 0.42, y: 0.83 + k * 0.45, z: 0.0 }, sh2); void b; } }
    // votive candles lit on a stand by the window (for sale and lit for the evening)
    const votive = G({ x: -4.2, y: F, z: -0.6 }, shop);
    { M(box(1.2, 0.04, 0.5), ironM, { y: 0.9 }, votive); for (const s of [-1, 1]) M(box(0.04, 0.9, 0.04), ironM, { x: s * 0.56, y: 0.45 }, votive);
      for (let i = 0; i < 12; i++) Sx.candle(votive, { x: -0.48 + (i % 6) * 0.19, y: 0.92, z: (i < 6 ? -0.1 : 0.12), h: 0.06 + (i % 3) * 0.03, r: 0.02, tag: "shop" }); }
    // candles on the counter (her working light) — they gutter on the doubt beat
    for (let i = 0; i < 3; i++) Sx.candle(counter, { x: 1.0 + i * 0.09, y: 1.0, z: -0.15 + (i % 2) * 0.08, h: 0.14 + i * 0.04, r: 0.022, tag: "counter" });
    // the postcard spinner (south-west corner): postcards on four faces, one reads THE FIRE TOWER · SILVER FORK
    const spinner = G({ x: -1.2, y: F, z: -2.2, ry: 70 }, shop);
    { M(cyl(0.02, 0.025, 1.7, 8), ironM, { y: 0.85 }, spinner); M(cyl(0.25, 0.3, 0.04, 16), ironM, { y: 0.02 }, spinner);
      const cards = ["MONASTERY", "SUNSET", "THE BASKET", "THE BELL", "MIST", "VALLEY"];
      for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
        const i = f * 8 + r * 2 + c, egg = (f === 0 && r === 1 && c === 1);
        const tx = K.textTex("m_card" + i, 160, 112, (q, w, h) => { const R = rng(70 + i); const g2 = q.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, egg ? "#1a2a4a" : ["#2a4a7a", "#c87a3a", "#3a6a5a", "#6a4a8a"][i % 4]); g2.addColorStop(1, egg ? "#0e1626" : "#e8c890"); q.fillStyle = g2; q.fillRect(0, 0, w, h);
          if (egg) { q.fillStyle = "#1e3a28"; q.beginPath(); q.moveTo(0, h); for (let x = 0; x <= w; x += 8) q.lineTo(x, h - 30 - Math.sin(x / 20) * 8 - R() * 8); q.lineTo(w, h); q.fill(); q.strokeStyle = "#c8ccd0"; q.lineWidth = 2; q.beginPath(); q.moveTo(70, h - 30); q.lineTo(80, 30); q.lineTo(90, h - 30); q.stroke(); q.fillStyle = "#ffb060"; q.fillRect(72, 26, 16, 10); }
          else { q.fillStyle = "rgba(40,30,20,0.7)"; q.beginPath(); q.moveTo(50, h); q.lineTo(70, 20); q.lineTo(90, h); q.fill(); }
          q.fillStyle = "#fff"; q.font = "700 " + (egg ? 15 : 16) + "px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText(egg ? "THE FIRE TOWER · SILVER FORK" : cards[i % cards.length], w / 2, egg ? 18 : 104); });
        const a = f * Math.PI / 2; const g = G({ y: 0.55 + r * 0.3, ry: a / D2R }, spinner);
        M(new T.PlaneGeometry(0.15, 0.105), mat("#ffffff", { map: tx, rough: 0.7 }), { x: -0.085 + c * 0.17, z: 0.07, cast: false }, g);
      } }
    // the old radio set on a shelf behind the counter (north wall), its dial lights (st.radioK); the 1974 photo beside it
    const radio = G({ x: SX1 - 0.3, y: F + 1.25, z: -5.9, ry: -90 }, shop);
    let dialM, radioL;
    { M(box(1.6, 0.04, 0.4), pineM, { y: -0.02 }, radio);
      const cab = G({ x: -0.25 }, radio); M(rbox(0.56, 0.36, 0.3, 0.04), Sx.plankM("m_radiowood", { base: "#6a4428", n: 2 }), { y: 0.18 }, cab);
      const grT = K.canvasTex("m_grille", 128, 128, (q, w, h) => { q.fillStyle = "#2a2018"; q.fillRect(0, 0, w, h); q.strokeStyle = "#8a6a44"; q.lineWidth = 3; for (let x = 8; x < w; x += 12) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, h); q.stroke(); } });
      M(new T.PlaneGeometry(0.22, 0.22), mat("#ffffff", { map: grT, rough: 0.8 }), { x: -0.12, y: 0.19, z: 0.171, cast: false }, cab);
      const dT = K.textTex("m_dial", 256, 128, (q, w, h) => { q.fillStyle = "#f0d8a0"; q.fillRect(0, 0, w, h); q.strokeStyle = "#5a3a1e"; q.lineWidth = 2; for (let x = 20; x < w; x += 12) { q.beginPath(); q.moveTo(x, 70); q.lineTo(x, x % 36 === 20 ? 40 : 54); q.stroke(); } q.fillStyle = "#3a2410"; q.font = "700 30px KitOswald, sans-serif"; q.fillText("CH 3", 20, 112); q.fillStyle = "#c0392b"; q.fillRect(118, 30, 4, 50); });
      dialM = new T.MeshBasicMaterial({ map: dT, color: new T.Color(0.2, 0.2, 0.2) });
      M(new T.PlaneGeometry(0.2, 0.1), dialM, { x: 0.13, y: 0.24, z: 0.171, cast: false }, cab);
      for (const x of [0.08, 0.18]) M(cyl(0.028, 0.028, 0.03, 16), mat("#1a1612", { rough: 0.4 }), { x, y: 0.1, z: 0.17, rx: 90 }, cab);
      radioL = new T.PointLight("#ffb860", 0, 2.5, 2); radioL.position.set(0.13, 0.24, 0.35); cab.add(radioL);
      const mic = G({ x: 0.25, y: 0.02, z: 0.1 }, cab); M(rbox(0.05, 0.08, 0.03, 0.012), mat("#25282b", { rough: 0.45 }), { rx: -80 }, mic); }
    const photoT = K.textTex("m_1974", 256, 320, (q, w, h) => {   // a faded print: the cliff edge, the basket, a tiny robed monk seen from behind, waving
      q.fillStyle = "#efe6d0"; q.fillRect(0, 0, w, h);
      const g2 = q.createLinearGradient(0, 16, 0, 256); g2.addColorStop(0, "#c9b896"); g2.addColorStop(1, "#8a7a5a"); q.fillStyle = g2; q.fillRect(16, 16, w - 32, 240);
      q.fillStyle = "#5a4a34"; q.beginPath(); q.moveTo(16, 256); q.lineTo(16, 120); q.lineTo(90, 112); q.lineTo(100, 256); q.fill();
      q.strokeStyle = "#4a3c2a"; q.lineWidth = 2; q.beginPath(); q.moveTo(150, 16); q.lineTo(150, 140); q.stroke();
      q.fillStyle = "#6a5434"; q.fillRect(128, 150, 44, 34); q.strokeStyle = "#4a3c2a"; q.beginPath(); q.moveTo(128, 150); q.lineTo(150, 140); q.lineTo(172, 150); q.stroke();
      q.fillStyle = "#2a2018"; q.beginPath(); q.ellipse(150, 140, 9, 12, 0, 0, 7); q.fill(); q.fillRect(143, 140, 14, 14); q.lineWidth = 3; q.strokeStyle = "#2a2018"; q.beginPath(); q.moveTo(156, 140); q.lineTo(168, 122); q.stroke();
      q.globalAlpha = 0.25; const R = rng(1974); for (let i = 0; i < 900; i++) { q.fillStyle = R() < 0.5 ? "#fff8e0" : "#6a5a40"; q.fillRect(R() * w, R() * h, 2, 2); } q.globalAlpha = 1;
      q.fillStyle = "#5a4a34"; q.font = "italic 600 40px KitOswald, serif"; q.textAlign = "center"; q.fillText("1974", w / 2, 300); });
    Sx.frame(shop, photoT, 0.3, 0.375, { x: SX1 - 0.06, y: F + 1.9, z: -5.05, ry: -90, col: "#3a2a1e", border: 0.025, depth: 0.02, metal: 0.1 });
    // the bell rope in the corner by the chapel door
    const bellRope = G({ x: SX1 - 0.45, y: F, z: -2.25 }, shop);
    { M(cyl(0.015, 0.015, 3.0, 6), ropeM, { y: 2.1 }, bellRope); M(cyl(0.035, 0.03, 0.4, 10), mat("#9a2a22", { rough: 0.8 }), { y: 0.7 }, bellRope); }
    // the shop's lights: a hanging oil lamp, the votives, the window glow outside
    const shopL = new T.PointLight("#ffbc78", 0, 0, 2); shopL.position.set(0.6, TOP + F + 2.6, -3.4); scene.add(shopL);
    shopL.castShadow = true; shopL.shadow.mapSize.set(1024, 1024); shopL.shadow.camera.near = 0.1; shopL.shadow.camera.far = 14; shopL.shadow.bias = -0.002; shopL.shadow.radius = 3;
    { const l = G({ x: 0.6, y: F + 2.75, z: -3.4 }, shop); K.rod([0, 0, 0], [0, SH - 2.75, 0], 0.008, ironM, l, 4); M(cyl(0.12, 0.08, 0.16, 16), mat("#8a6a34", { metal: 0.6, rough: 0.35 }), { y: -0.1 }, l); M(sph(0.07, 12, 10), glow("#ffcf90", 5), { y: -0.18, cast: false }, l); }
    const votL = new T.PointLight("#ffb060", 0, 0, 2); votL.position.set(-4.2, TOP + F + 1.25, -0.6); scene.add(votL);
    const counterL = new T.PointLight("#ffb466", 0, 0, 2); counterL.position.set(CT.x - 0.1, TOP + F + 1.35, CT.z + 1.0); scene.add(counterL);
    const winGlow = new T.PointLight("#ffb46a", 0, 0, 2); winGlow.position.set(shopWin.x, TOP + BF + 2.3, B.z1 + 1.4); scene.add(winGlow);

    // ---------------------------------------------------------------- the chapel interior: candles, benches, the guestbook on its stand (a plant)
    const chapel = G({ y: TOP });
    const CX0 = Ch.x0 + 0.62, CX1 = Ch.x1 - 0.6, CZ0 = Ch.z0 + 0.62, CZ1 = Ch.z1 - 0.62;
    W(CX1 - CX0 + 2.6, 0.06, CZ1 - CZ0, { x: (CX0 + CX1) / 2 + 1.3, y: F - 0.03, z: (CZ0 + CZ1) / 2 }, flagM, chapel);
    W(0.04, Ch.h, -3.95 - CZ0, { x: CX0 + 0.02, y: F + Ch.h / 2, z: (CZ0 - 3.95) / 2 }, wallIn, chapel); W(0.04, Ch.h, CZ1 + 2.85, { x: CX0 + 0.02, y: F + Ch.h / 2, z: (CZ1 - 2.85) / 2 }, wallIn, chapel);
    W(0.04, Ch.h - 2.3, 1.1, { x: CX0 + 0.02, y: F + 2.3 + (Ch.h - 2.3) / 2, z: -3.4 }, wallIn, chapel);
    W(CX0 - SX1, 0.06, 1.2, { x: (CX0 + SX1) / 2, y: F - 0.03, z: -3.4 }, flagM, chapel); W(CX0 - SX1, 0.1, 1.3, { x: (CX0 + SX1) / 2, y: F + 2.35, z: -3.4 }, wallIn, chapel);
    W(CX1 - CX0, Ch.h, 0.04, { x: (CX0 + CX1) / 2, y: F + Ch.h / 2, z: CZ0 + 0.02 }, wallIn, chapel);
    W(CX1 - CX0, Ch.h, 0.04, { x: (CX0 + CX1) / 2, y: F + Ch.h / 2, z: CZ1 - 0.02 }, wallIn, chapel);
    { const vg = new T.CylinderGeometry(2.9, 2.9, CX1 - CX0 + 1.2, 24, 1, true, 0, Math.PI); const m = M(vg, wallIn, { x: (CX0 + CX1) / 2, y: F + Ch.h - 0.2, z: (CZ0 + CZ1) / 2, rz: 90, ry: 0 }, chapel); m.material = wallIn.clone(); m.material.side = T.BackSide; m.rotation.set(0, 0, Math.PI / 2); m.scale.set(0.55, 1, 1); m.position.x += 0.6; }
    { const ag = new T.CylinderGeometry(2.4, 2.4, Ch.h, 24, 1, true, 0, Math.PI); const m = M(ag, wallIn, { x: Ch.x1 - 0.6, y: F + Ch.h / 2, z: (CZ0 + CZ1) / 2 }, chapel); m.material = wallIn.clone(); m.material.side = T.BackSide; }
    // the altar (apse), candles on it and on two iron stands; an arched niche with a painted gold panel (abstract)
    { const al = G({ x: Ch.x1 + 0.6, y: F, z: (CZ0 + CZ1) / 2 }, chapel); M(box(0.7, 1.0, 1.4), wallIn, { y: 0.5 }, al); M(box(0.75, 0.04, 1.5), mat("#e8e0d0", { rough: 0.8 }), { y: 1.02 }, al);
      for (let i = 0; i < 4; i++) Sx.candle(al, { x: 0, y: 1.04, z: -0.5 + i * 0.33, h: 0.3, r: 0.03, tag: "chapel" });
      const pT = K.canvasTex("m_panel", 128, 192, (q, w, h) => { const g2 = q.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, "#d8b05a"); g2.addColorStop(1, "#8a6a2a"); q.fillStyle = g2; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,30,20,0.6)"; q.beginPath(); q.ellipse(w / 2, h * 0.38, 26, 26, 0, 0, 7); q.fill(); q.fillRect(w / 2 - 30, h * 0.5, 60, 80); });
      M(new T.PlaneGeometry(0.7, 1.05), mat("#ffffff", { map: pT, rough: 0.5, metal: 0.3 }), { x: 1.9, y: 2.3, ry: -90, cast: false }, al); }
    for (const z of [CZ0 + 0.6, CZ1 - 0.6]) { const st = G({ x: CX1 - 0.4, y: F, z }, chapel); M(cyl(0.02, 0.03, 1.2, 8), ironM, { y: 0.6 }, st); M(cyl(0.22, 0.2, 0.04, 16), ironM, { y: 1.2 }, st); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; Sx.candle(st, { x: Math.cos(a) * 0.15, y: 1.22, z: Math.sin(a) * 0.15, h: 0.1 + (i % 3) * 0.05, r: 0.014, tag: "chapel" }); } }
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const bn = G({ x: CX0 + 1.2 + k * 1.3, y: F, z: (CZ0 + CZ1) / 2 + s * 1.2 }, chapel); M(box(0.4, 0.05, 1.5), oakM, { y: 0.45 }, bn); for (const z of [-0.6, 0.6]) M(box(0.36, 0.45, 0.05), oakM, { y: 0.22, z }, bn); }
    // the guestbook on a stand near the door: open; the last entry "beautiful view!!", a torn bandage wrapper beside it
    const GB = [CX0 + 0.9, F, CZ1 - 0.9];
    const guestT = K.textTex("m_guest", 768, 512, (q, w, h) => {
      q.fillStyle = "#f2ead6"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(0,0,0,0.25)"; q.fillRect(w / 2 - 2, 0, 4, h);
      q.fillStyle = "rgba(90,70,40,0.25)"; for (let y = 50; y < h; y += 40) { q.fillRect(20, y, w / 2 - 40, 1.5); q.fillRect(w / 2 + 20, y, w / 2 - 40, 1.5); }
      const hand = (s, x, y, sz, col) => { q.fillStyle = col || "#2a3a6a"; q.font = `italic 600 ${sz}px KitInter, serif`; q.fillText(s, x, y); };
      ["so peaceful up here", "the basket!! never again", "thank you for the tea", "magnificent", "we will be back", "worth every step"].forEach((s, i) => hand(s, 30, 44 + i * 40, 26, ["#2a3a6a", "#3a2a1e", "#1a4a3a"][i % 3]));
      ["the bell at sunset <3", "unforgettable", "a little windy", "so so quiet"].forEach((s, i) => hand(s, w / 2 + 30, 44 + i * 40, 26, ["#3a2a1e", "#2a3a6a"][i % 2]));
      hand("beautiful view!!", w / 2 + 30, 44 + 4 * 40 + 8, 46, "#1c2a5a");
    });
    const gstand = G({ x: GB[0], y: F, z: GB[2], ry: 134 }, chapel);
    { M(cyl(0.025, 0.035, 1.05, 8), oakM, { y: 0.52 }, gstand); M(box(0.5, 0.04, 0.4), oakM, { y: 0.02 }, gstand);
      const top = G({ y: 1.08, rx: 26 }, gstand); M(box(0.66, 0.03, 0.46), oakM, { y: -0.02 }, top);
      M(box(0.6, 0.012, 0.4), [mat("#e8e0cc"), mat("#e8e0cc"), mat("#ffffff", { map: guestT, rough: 0.9 }), mat("#5a2a1e"), mat("#e8e0cc"), mat("#e8e0cc")], { y: 0.006 }, top);
      M(cyl(0.003, 0.003, 0.14, 6), mat("#1a1a20"), { x: 0.2, y: 0.015, z: 0.14, rz: 90, ry: 30 }, top);
      // the bandage wrapper: a small clean paper sleeve, torn open at one end
      const wT = K.canvasTex("m_wrap", 128, 64, (q, w, h) => { q.fillStyle = "#fbfbf8"; q.fillRect(0, 0, w, h); q.fillStyle = "#d84a3a"; q.fillRect(0, 26, w - 18, 12); q.fillStyle = "#c9c9c4"; for (let y = 0; y < h; y += 6) q.fillRect(w - 16 + (y % 12 ? 3 : 0), y, 16, 3); });
      M(box(0.075, 0.003, 0.035), mat("#ffffff", { map: wT, rough: 0.7 }), { x: 0.3, y: 0.018, z: -0.13, ry: 28 }, top); }
    const chapelL = new T.PointLight("#ffb466", 0, 0, 2); chapelL.position.set(Ch.x1 - 0.8, TOP + F + 1.6, -3.5); scene.add(chapelL);
    const chapelL2 = new T.PointLight("#ffbc7a", 0, 0, 2); chapelL2.position.set(GB[0] + 0.6, TOP + F + 1.9, GB[2] - 0.3); scene.add(chapelL2);

    // ---------------------------------------------------------------- the cellar (under the shop, inside the rock): lentil sacks, the cistern hatch, boxes of magnets
    const cellar = G({ y: TOP });
    const LX0 = -7, LX1 = 3, LZ0 = -7, LZ1 = 0, LF = -2.6;
    W(LX1 - LX0, 0.06, LZ1 - LZ0, { x: (LX0 + LX1) / 2, y: LF - 0.03, z: (LZ0 + LZ1) / 2 }, flagM, cellar);
    W(LX1 - LX0, 3.0, 0.05, { x: (LX0 + LX1) / 2, y: LF + 1.5, z: LZ0 }, wallIn, cellar); W(LX1 - LX0, 3.0, 0.05, { x: (LX0 + LX1) / 2, y: LF + 1.5, z: LZ1 }, wallIn, cellar);
    W(0.05, 3.0, LZ1 - LZ0, { x: LX0, y: LF + 1.5, z: (LZ0 + LZ1) / 2 }, wallIn, cellar); W(0.05, 3.0, LZ1 - LZ0, { x: LX1, y: LF + 1.5, z: (LZ0 + LZ1) / 2 }, wallIn, cellar);
    W(LX1 - LX0, 0.1, LZ1 - LZ0, { x: (LX0 + LX1) / 2, y: LF + 3.0, z: (LZ0 + LZ1) / 2 }, boardM, cellar);
    for (const x of [-4.5, -1.5, 1.5]) W(0.4, 0.4, LZ1 - LZ0, { x, y: LF + 2.8, z: (LZ0 + LZ1) / 2 }, wallIn, cellar);
    // lentil sacks: burlap bags stencilled LENTILS, stacked along the north wall
    const sackT = K.textTex("m_sack", 256, 256, (q, w, h) => { q.fillStyle = "#a8875a"; q.fillRect(0, 0, w, h); q.globalAlpha = 0.3; for (let y = 0; y < h; y += 3) { q.fillStyle = y % 6 ? "#7a5e3a" : "#c8a878"; q.fillRect(0, y, w, 1); } for (let x = 0; x < w; x += 3) { q.fillStyle = x % 6 ? "#7a5e3a" : "#c8a878"; q.fillRect(x, 0, 1, h); } q.globalAlpha = 1; q.fillStyle = "#3a2a1a"; q.font = "700 50px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("LENTILS", w / 2, h / 2 + 18); });
    const sackM = mat("#ffffff", { map: sackT, rough: 0.95 });
    { const sg = new T.SphereGeometry(0.35, 18, 12); { const pa = sg.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setXYZ(i, pa.getX(i) * 0.95, y * 1.35 + (y > 0.2 ? 0.05 : 0), pa.getZ(i) * 0.62); } sg.computeVertexNormals(); }
      const R = rng(12); for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) M(sg, sackM, { x: LX0 + 0.6 + i * 0.68 + (r ? 0.34 : 0), y: LF + 0.45 + r * 0.72, z: LZ0 + 0.45 + r * 0.05, ry: (R() - 0.5) * 30, rz: (R() - 0.5) * 8 }, cellar); }
    // the cistern hatch: a stone ring in the floor with the wooden lid lifted, dark water below
    const CS = [0.6, LF, -2.2];
    { const curbO = new T.CylinderGeometry(0.47, 0.5, 0.55, 40, 1, true); { const uv = curbO.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.0 / SC, uv.getY(i) * 0.55 / SC); }
      M(curbO, wallIn, { x: CS[0], y: LF + 0.275, z: CS[2] }, cellar);
      M(new T.CylinderGeometry(0.36, 0.36, 0.55, 40, 1, true), mat("#3a3631", { rough: 0.9, side: T.BackSide }), { x: CS[0], y: LF + 0.275, z: CS[2] }, cellar);
      const top = new T.RingGeometry(0.36, 0.5, 40); top.rotateX(-Math.PI / 2); M(top, flagM, { x: CS[0], y: LF + 0.552, z: CS[2], cast: false }, cellar);
      const wtr = new T.CircleGeometry(0.36, 40); wtr.rotateX(-Math.PI / 2); M(wtr, new T.MeshPhysicalMaterial({ color: "#0a1418", roughness: 0.03, metalness: 0.1, clearcoat: 1, envMapIntensity: 2.2 }), { x: CS[0], y: LF + 0.32, z: CS[2], cast: false }, cellar);
      const lid = G({ x: CS[0] + 0.6, y: LF + 0.02, z: CS[2] + 0.1, rz: -12 }, cellar); M(cyl(0.42, 0.42, 0.06, 32), oakM, { x: 0.05, y: 0.43, rz: 90 }, lid); M(new T.TorusGeometry(0.06, 0.012, 6, 14), ironM, { x: 0.09, y: 0.5, ry: 90 }, lid); M(box(0.04, 0.06, 0.64), ironM, { x: 0.09, y: 0.33 }, lid);
      const sT = K.textTex("m_cistern", 256, 96, (q, w, h) => { q.fillStyle = "#e6dcc4"; q.fillRect(0, 0, w, h); q.fillStyle = "#3a2a1e"; q.textAlign = "center"; q.font = "700 52px KitOswald, sans-serif"; q.fillText("CISTERN", w / 2, 66); });
      M(new T.PlaneGeometry(0.5, 0.19), mat("#ffffff", { map: sT, rough: 0.8 }), { x: LX1 - 0.03, y: LF + 1.4, z: CS[2], ry: -90, cast: false }, cellar); }
    // boxes of magnets: a tall stack, one open showing bright magnets
    const magStack = G({ x: -1.6, y: LF, z: -0.8 }, cellar);
    { const bT = K.textTex("m_magnetsbox2", 256, 128, (q, w, h) => { q.fillStyle = "#c8ad7e"; q.fillRect(0, 0, w, h); q.strokeStyle = "#5a4630"; q.lineWidth = 4; q.strokeRect(6, 6, w - 12, h - 12); q.fillStyle = "#3a2a1e"; q.textAlign = "center"; q.font = "700 46px KitOswald, sans-serif"; q.fillText("MAGNETS · 100", w / 2, 80); });
      const bm = mat("#ffffff", { map: bT, rough: 0.8 }); const R = rng(9);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 5 - (c % 2); r++) M(box(0.5, 0.3, 0.38), bm, { x: c * 0.54, y: 0.15 + r * 0.31, z: (R() - 0.5) * 0.05, ry: (R() - 0.5) * 6 }, magStack);
      const open = G({ x: 0.9, y: 0.15, z: 0.8 }, magStack); M(box(0.5, 0.3, 0.38), bm, {}, open); const magT = K.canvasTex("m_mags", 256, 192, (q, w, h) => { q.fillStyle = "#8a6a44"; q.fillRect(0, 0, w, h); const R2 = rng(4); for (let i = 0; i < 60; i++) { q.fillStyle = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#ecf0f1", "#9b59b6", "#e67e22"][Math.floor(R2() * 7)]; q.fillRect(R2() * (w - 30), R2() * (h - 24), 26 + R2() * 10, 18 + R2() * 8); } });
      M(new T.PlaneGeometry(0.46, 0.34), mat("#ffffff", { map: magT, rough: 0.5 }), { y: 0.152, rx: -90, cast: false }, open); }
    const cellarL = new T.PointLight("#ffbc78", 0, 0, 2); cellarL.position.set(-2.4, TOP + LF + 2.3, -3.2); scene.add(cellarL);
    cellarL.castShadow = true; cellarL.shadow.mapSize.set(512, 512); cellarL.position.set(-1.0, TOP + LF + 2.3, -2.6); cellarL.shadow.camera.far = 12; cellarL.shadow.bias = -0.002; cellarL.shadow.radius = 3;
    { const l = G({ x: -2.4, y: LF + 2.45, z: -3.2 }, cellar); M(cyl(0.09, 0.07, 0.18, 12), mat("#2a2420", { metal: 0.5, rough: 0.5 }), {}, l); M(sph(0.06, 10, 8), glow("#ffc27a", 5), { y: -0.04, cast: false }, l); }

    // ---------------------------------------------------------------- the winch house lantern (exterior), the village, the bus
    const winchL = new T.PointLight("#ffb46a", 0, 0, 2); winchL.position.set(WH[0] - 1.6, TOP + WH[1] + 2.6, WH[2] + 1.4); scene.add(winchL);
    { const l = G({ x: WH[0] - 1.6, y: WH[1] + 2.6, z: WH[2] + 1.45 }, Mn); M(cyl(0.1, 0.08, 0.2, 12), mat("#2a2420", { metal: 0.5, rough: 0.5 }), {}, l); M(sph(0.07, 10, 8), glow("#ffc27a", 6), { y: -0.04, cast: false }, l); }
    const village = G({});
    const vLights = [];
    { const R = rng(303), hm = mat("#8a8072", { rough: 0.9 }), rm = mat("#5a3a2a", { rough: 0.8 });
      for (let i = 0; i < 110; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * 170; const x = VIL[0] + Math.cos(a) * r, z = VIL[2] + Math.sin(a) * r * 0.7, y = valleyH(x, z); const w = 6 + R() * 5, d = 5 + R() * 4, h = 4 + R() * 3, ry = R() * 180;
        M(box(w, h, d), hm, { x, y: y + h / 2, z, ry }, village); M(new T.ConeGeometry(Math.max(w, d) * 0.72, 2.4, 4), rm, { x, y: y + h + 1.2, z, ry: ry + 45 }, village);
        if (R() < 0.8) vLights.push([x + (R() - 0.5) * w * 0.6, y + 1.5 + R() * 2.5, z + (R() - 0.5) * d * 0.6]); if (R() < 0.4) vLights.push([x, y + 3.2, z]); }
      for (let i = 0; i < 26; i++) { const a = i / 26 * 6.28; vLights.push([VIL[0] + Math.cos(a) * 140, valleyH(VIL[0] + Math.cos(a) * 140, VIL[2] + Math.sin(a) * 100) + 5, VIL[2] + Math.sin(a) * 100]); } }
    const vlI = new T.InstancedMesh(new T.SphereGeometry(0.9, 6, 4), glow("#ffc27a", 8, { fog: true }), vLights.length);
    { const d = new T.Object3D(); vLights.forEach((p, i) => { d.position.fromArray(p); d.updateMatrix(); vlI.setMatrixAt(i, d.matrix); }); vlI.frustumCulled = false; vlI.castShadow = false; scene.add(vlI); }
    const vHalo = new T.InstancedMesh(new T.PlaneGeometry(5, 5), new T.ShaderMaterial({ uniforms: { map: { value: Sx.haloT }, k: { value: 1 }, col: { value: new T.Color("#ffb060").multiplyScalar(0.35) } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); vec4 mv = viewMatrix * c; mv.xy += position.xy; gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform sampler2D map; uniform float k; uniform vec3 col; varying vec2 vUv; void main(){ float a = texture2D(map, vUv).r * k; gl_FragColor = vec4(col * a, a); }" }), vLights.length);
    { const d = new T.Object3D(); vLights.forEach((p, i) => { d.position.fromArray(p); d.updateMatrix(); vHalo.setMatrixAt(i, d.matrix); }); vHalo.frustumCulled = false; vHalo.renderOrder = 4; scene.add(vHalo); K.noDepth.push(vHalo); }
    // the valley road: village -> past the pillar foot -> south; the bus drives away from the village (st.busT)
    const roadPts = [[VIL[0] + 60, VIL[2] - 40], [-300, 700], [-120, 420], [60, 160], [140, -120], [300, -600], [500, -1400]].map(([x, z]) => new T.Vector3(x, valleyH(x, z) + 0.3, z));
    const road = new T.CatmullRomCurve3(roadPts);
    { const pts = road.getSpacedPoints(400), pos = [], idx = []; for (let i = 0; i <= 400; i++) { const p = pts[i], q = pts[Math.min(400, i + 1)], pr = pts[Math.max(0, i - 1)]; const dx = q.x - pr.x, dz = q.z - pr.z, l = Math.hypot(dx, dz) || 1; for (const s of [-1, 1]) { const x = p.x - dz / l * s * 3, z = p.z + dx / l * s * 3; pos.push(x, valleyH(x, z) + 0.25, z); } if (i < 400) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); M(g, mat("#4a4438", { rough: 0.95 }), { cast: false }); }
    const bus = G({});
    { M(box(2.5, 2.9, 11), mat("#c8b04a", { rough: 0.5, metal: 0.2 }), { y: 1.8 }, bus); const wl = glow("#ffe2a8", 3, { fog: true }); for (const s of [-1, 1]) M(box(0.02, 0.9, 9), wl, { x: s * 1.26, y: 2.3, cast: false }, bus);
      for (const s of [-1, 1]) { M(sph(0.35, 8, 6), glow("#fff4dc", 30, { fog: true }), { x: s * 0.9, y: 0.9, z: 5.5, cast: false }, bus); M(sph(0.25, 8, 6), glow("#ff2a14", 10, { fog: true }), { x: s * 1.0, y: 1.0, z: -5.5, cast: false }, bus); }
      M(new T.PlaneGeometry(14, 14), new T.MeshBasicMaterial({ map: Sx.haloT, color: new T.Color("#fff2d8").multiplyScalar(0.9), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { y: 0.9, z: 6.2, cast: false, receive: false, nodepth: true }, bus); }
    const busBeam = new T.SpotLight("#fff0d0", 0, 120, 22 * D2R, 0.6, 1.6); bus.add(busBeam); busBeam.position.set(0, 1.0, 5.6); busBeam.target.position.set(0, 0, 40); bus.add(busBeam.target);

    // ---------------------------------------------------------------- red eyes: in the valley (still), then gathered at the foot of the rock
    const EY = Sx.eyes(140, (R, i) => {
      let x, z; if (i % 3 === 0) { const p = road.getPointAt(0.15 + R() * 0.5); x = p.x + (R() - 0.5) * 20; z = p.z + (R() - 0.5) * 20; } else { const a = R() * 6.28, r = 90 + R() * 260; x = Math.cos(a) * r; z = Math.sin(a) * r; }
      const a2 = R() * 6.28, rb = pillarR(a2, 0, TOP, 30, 1.3) * 1.3 + 3 + R() * 10;
      const bx = Math.sin(a2) * rb, bz = Math.cos(a2) * rb;
      return { a: [x, valleyH(x, z) + 1.6, z], b: [bx, valleyH(bx, bz) + 1.6, bz] };
    }, { r: 0.08, sep: 0.09, seed: 5151 });

    // ---------------------------------------------------------------- merge the static sets
    Sx.bake(Mn, [curtain]); Sx.bake(shop, [door, clickOnCounter, spinner]); Sx.bake(chapel); Sx.bake(cellar); Sx.bake(village);

    // ---------------------------------------------------------------- per-frame state
    const BASE_Y = TOP + WH[1] + 0.16;               // the landing platform's top: the basket's floor when it is up
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      const wk = I("winK", 1);
      winGlow.intensity = 14 * wk; shopL.intensity = 7 * I("shopI", 0); votL.intensity = 2.4 * I("shopI", 0); counterL.intensity = 2.2 * I("counterI", I("shopI", 0));
      chapelL.intensity = 12 * I("chapelI", 0); chapelL2.intensity = 6 * I("chapelI", 0); passL.intensity = 4 * I("passI", 0);
      // cube shadows cost six scene renders each: only where they are seen (st.interior: 1 shop, 2 cellar)
      shopL.castShadow = I("interior", 0) === 1; cellarL.castShadow = I("interior", 0) === 2; cellarL.intensity = 18 * I("cellarI", 0); winchL.intensity = 6 * I("winchI", 1);
      const rk = I("radioK", 0); dialM.color.setScalar(0.2 + 1.5 * rk); radioL.intensity = 0.8 * rk;
      bell.rotation.x = I("bellA", 0) * D2R;
      door.rotation.y = -I("doorA", 0) * D2R;
      // the curtain: drawn (0) or pulled aside (1), with a slow sway; the top window's faint light
      const cu = I("curtain", 0), sw = Math.sin(t * 1.7) * 0.03 * (cu > 0.01 ? 1 : 0);
      curtL.position.x = -0.24 - 0.2 * cu; curtR.position.x = 0.24 + 0.06 * cu * Math.sin(t * 2.2); curtL.rotation.y = sw * 4; curtL.scale.x = 1 - 0.45 * cu;
      topWinM.color.set("#ffb468").multiplyScalar(1.6 * I("topWin", 0)); topL.intensity = 1.5 * I("topWin", 0);
      // the basket: its floor height (st.basketY), a sway; the hoist rope from the pulley; the down-line to the valley (or falling after the cut)
      const by = I("basketY", TOP - 26), sway = I("basketSway", 1);
      const sx = Math.sin(t * 0.9) * 0.35 * sway * ss((PUL[1] - by - 3) / 10), sz = Math.sin(t * 0.63 + 1) * 0.25 * sway * ss((PUL[1] - by - 3) / 10);
      basket.position.set(DROPX + sx, by, DROPZ + sz); basket.rotation.set(sz * 0.03, t * 0.05 * sway, -sx * 0.03);
      const hl = PUL[1] - (by + 2.42); hoist.visible = hl > 0.05; hoist.scale.set(1, Math.max(0.01, hl), 1); hoist.position.set(DROPX + sx * 0.5, by + 2.42 + hl / 2, DROPZ + sz * 0.5);
      const cut = I("ropeCut", -1);
      const dl = by - valleyH(DROPX, DROPZ);
      if (cut < 0) { downG.visible = true; downG.position.set(DROPX + sx, by, DROPZ + sz); down.scale.set(1, dl, 1); down.position.y = -dl / 2; }
      else { const fall = 0.5 * 9.8 * cut * cut; downG.visible = fall < dl; downG.position.set(DROPX + sx, by - 0.4 - fall, DROPZ + sz); down.scale.set(1, Math.max(0.01, dl - fall), 1); down.position.y = -(dl - fall) / 2; }
      // village + bus
      const vk = I("villageK", 1); vlI.material.color.set("#ffc27a").multiplyScalar(8 * vk); vHalo.material.uniforms.k.value = vk;
      const bt = I("busT", 0), bu = clamp(0.02 + bt * 0.012, 0, 0.98); const bp = road.getPointAt(bu), bq = road.getPointAt(Math.min(0.999, bu + 0.004));
      bus.position.set(bp.x, valleyH(bp.x, bp.z) + 0.3, bp.z); bus.lookAt(bq.x, valleyH(bq.x, bq.z) + 0.3, bq.z); busBeam.intensity = 600 * I("busK", 1); bus.visible = I("busK", 1) > 0;
      EY.set(t, { k: I("eyesK", 0), scale: I("eyesScale", 1), gather: I("eyesGather", 0), blink: I("eyesBlink", 0) > 0.5, I: I("eyesI", 1), look: [0, 0] });
      void cam;
    });

    return { Mn, shop, chapel, cellar, basket, bell, door, counter, clickOnCounter, spinner, radio, windlass, winchHouse, village, bus, road, EY,
      P: { TOP, BF, F, LF, B, Ch, SX0, SX1, SZ0, SZ1, CT, GB, CS, WH, PUL, E0, shopWin, BASE_Y, VIL, BC }, valleyH, pillarR, clicker, Sx };
  }

  // ---------------------------------------------------------------- Elif: the Hazel v2 rig re-dressed — another face, olive skin, a low bun, a knit cardigan over a gift-shop apron
  const ELIF = { skin: "#c49572", earIn: "#9a6a4c", lip: "#b06a5c", brow: "#1e1410", iris: [[96, 82, 50], [46, 38, 22]],
    face: { w: 0.9, len: 1.14, jaw: 0.25, chin: 0.12, cheek: 0.003, eyeX: 0.032, eyeY: 0.013, eyeZ: "fit", eyeS: 0.97, tilt: 8, lid: 4, noseW: 0.9, bridgeW: 0.9, noseL: 1.242, noseY: -0.0014, noseZ: 1.12, browY: 0.002, browT: 1.3, browArch: 0.6, browLen: 1.08, lipW: 0.95, lipT: 1.08 },
    jacket: "#b3a284", jacketSheen: "#fff4dc", jacketRough: 0.95, trim: "#9a8a6c", trimSheen: "#ffeccc", seam: "#8e7e62", pants: "#2c2c32", pantsSheen: "#6a6a76",
    boot: "#3a2a20", sole: "#1a1410", under: "#4a2f3c", tie: "#2a2420", chestPocket: false, handPockets: false, pony: false };
  function dressElif(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, sp = hz.spine, surf = hz.surf;
    S.hair.bun(K, hz, { col: "#1e140f", streaks: ["rgba(8,4,2,0.4)", "rgba(60,38,26,0.35)", "rgba(96,64,44,0.25)"], sheen: "#c8a080" });
    // the cardigan: a ribbed knit (the jacket and sleeve materials take a rib normal map), no zip, a row of buttons, an open V
    const ribN = K.heightNormal("elif_rib", 128, (x) => Math.sin((x / 128) * Math.PI * 2 * 22) * 0.5 + K.hash2(x, 0, 3) * 0.1, 2.6);
    for (const m of [hz.mats.jacket, hz.mats.sleeveM]) { m.normalMap = K.nmap(ribN, 10, 3); m.normalScale.set(0.7, 0.7); m.sheen = 0.7; }
    sp.children.forEach((o) => { if (!o.isMesh) return; const gp = o.geometry.parameters || {}; if (o.material === hz.mats.metal) o.visible = false; if (gp.radiusTop === 0.074 && gp.openEnded) o.visible = false; if (o.geometry.type === "TorusGeometry" && gp.radius === 0.075) o.visible = false; });
    { const vg = new T.BufferGeometry(); const A = surf(0.53, 0.26, 1.02), B = surf(0.53, -0.26, 1.02), C2 = surf(0.3, 0, 1.022), D2 = surf(0.44, 0, 1.022);
      vg.setAttribute("position", new T.Float32BufferAttribute([...A, ...D2, ...C2, ...B, ...D2, ...C2], 3)); vg.setIndex([0, 2, 1, 3, 4, 5]); vg.computeVertexNormals();
      M(vg, K.pmat("#4a2f3c", { rough: 0.8, side: T.DoubleSide }), { cast: false }, sp); }
    // (render 3) no cardigan buttons: they sat under the apron bib and poked through it
    for (const y of []) { const p = surf(y, 0.0, 1.02); M(K.cyl(0.007, 0.007, 0.005, 12), mat("#5a4030", { rough: 0.5 }), { x: p[0], y: p[1], z: p[2] + 0.002, rx: 90, cast: false }, sp); }
    // the apron: a forest-green bib from the chest to the thighs, a neck strap and waist ties; a front pocket with a pencil
    // (render 3) the bib carries uvs now: without them its twill normal map had no tangent frame and the apron shaded pure black
    const apM = K.pmat("#3f6a4a", { rough: 0.82, sheen: 0.5, sheenColor: "#b8e0c0", normalMap: K.nmap(K.normals().twill, 6, 6), ns: 0.45, side: T.DoubleSide });
    const apT = K.pmat("#6e9a76", { rough: 0.8, sheen: 0.4, sheenColor: "#d8f0dc" });                       // binding, straps, stitching
    const hwAt = (y) => lerp(0.3, 0.62, ss((0.2 - y) / 0.2));
    { const pos = [], uvs = [], idx = [], rows = 14, cols = 8;
      for (let r = 0; r <= rows; r++) { const y = lerp(0.42, -0.1, r / rows), hw = hwAt(y); for (let c = 0; c <= cols; c++) { const a = lerp(-hw, hw, c / cols); const p = surf(y, a, 1.04); pos.push(...p); uvs.push(c / cols, 1 - r / rows); } }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + cols + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals(); M(g, apM, { cast: false }, sp);
      // a lighter binding round the bib (top and sides), neck straps up to the collar, a waist band round to the ties, a stitched pocket edge
      const cord = (pts, r) => { for (let k = 0; k + 1 < pts.length; k++) K.rod(pts[k], pts[k + 1], r, apT, sp, 6); };
      cord([0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => surf(0.42, lerp(-0.3, 0.3, c / 8), 1.05)), 0.006);
      for (const sd of [-1, 1]) { cord([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((r) => { const y = lerp(0.42, -0.1, r / 14); return surf(y, sd * hwAt(y), 1.05); }), 0.006);
        cord([[0.42, 0.29], [0.47, 0.42], [0.52, 0.6], [0.555, 0.82]].map(([y, a]) => surf(y, sd * a, 1.055)), 0.011);
        cord([0.62, 0.8, 1.0, 1.2, 1.4, 1.6].map((a) => surf(-0.06, sd * a, 1.05)), 0.01); }
      const pk = surf(0.05, 0, 1.06); M(K.box(0.14, 0.08, 0.006), apM, { x: pk[0], y: pk[1], z: pk[2], cast: false }, sp); M(K.box(0.145, 0.006, 0.008), apT, { x: pk[0], y: pk[1] + 0.04, z: pk[2] + 0.001, cast: false }, sp); M(K.cyl(0.003, 0.003, 0.1, 6), mat("#d8a83a", { rough: 0.5 }), { x: pk[0] + 0.03, y: pk[1] + 0.06, z: pk[2] + 0.004, cast: false }, sp);
      const strap = []; for (let k = 0; k <= 16; k++) { const a = lerp(-0.3, 0.3, k / 16), y = 0.42 + 0.14 * Math.sin(Math.PI * k / 16); strap.push(surf(Math.min(y, 0.54), a < 0 ? Math.max(a * 4, -1.0) : Math.min(a * 4, 1.0), 1.05)); }
      for (const s of [-1, 1]) { const p = surf(-0.04, s * 1.5, 1.05); M(K.box(0.03, 0.012, 0.12), apM, { x: p[0], y: p[1], z: p[2], ry: s * 90, cast: false }, sp); }
      // the apron skirt below the waist: a panel on the hips that follows the thighs (front)
      const sk = new T.PlaneGeometry(0.34, 0.36, 4, 6); sk.translate(0, -0.18, 0); const skM = M(sk, apM, { y: -0.1, z: 0.125, cast: false }, hz.hips); hz.apronSkirt = skM; }
    // a slim wristwatch and a headband-free bun: done; tools: the clicker (right), a receipt strip (left), shears (right), a pen (right)
    const click = new T.Group();
    { const ct = K.textTex("elif_click", 512, 288, (q, w, h) => { q.fillStyle = "#3c4046"; q.fillRect(0, 0, w, h); q.fillStyle = "#e8e8ea"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("UP", 128, 62); q.fillText("DOWN", 384, 62);
        for (const [cx, v] of [[128, "41"], [384, "40"]]) { q.fillStyle = "#d8e2c8"; q.fillRect(cx - 104, 84, 208, 160); q.fillStyle = "#14181a"; q.font = "700 138px KitOswald, sans-serif"; q.fillText(v, cx, 216); } });
      M(K.rbox(0.11, 0.065, 0.03, 0.01), mat("#4a4f56", { metal: 0.3, rough: 0.4 }), {}, click); M(new T.PlaneGeometry(0.1, 0.056), new T.MeshBasicMaterial({ map: ct, color: new T.Color(0.95, 0.95, 0.95) }), { z: 0.0201, cast: false }, click);
      for (const s of [-1, 1]) M(K.cyl(0.008, 0.008, 0.016, 10), mat("#c8ccd0", { metal: 0.6, rough: 0.3 }), { x: s * 0.03, y: 0.04 }, click); }
    click.position.set(0.0, -0.09, 0.03); click.rotation.set(1.35, 0, 0); hz.tool("clicker", click, 0);
    const rec = new T.Group(); M(K.box(0.06, 0.16, 0.002), mat("#f6f4ee", { rough: 0.9 }), { y: -0.05 }, rec); rec.position.set(0, -0.07, 0.02); hz.tool("receipt", rec, 1);
    const rec2 = new T.Group(); M(K.box(0.06, 0.14, 0.002), mat("#f6f4ee", { rough: 0.9 }), { y: -0.05 }, rec2); rec2.position.set(0, -0.07, 0.02); hz.tool("receipt2", rec2, 0);
    const shears = new T.Group(); for (const s of [-1, 1]) { M(K.box(0.012, 0.16, 0.004), mat("#c8ccd0", { metal: 0.7, rough: 0.25 }), { x: s * 0.008, y: 0.08, rz: s * 8 }, shears); M(new T.TorusGeometry(0.022, 0.006, 6, 14), mat("#2a6a4a", { rough: 0.5 }), { x: s * 0.02, y: -0.02 }, shears); } shears.position.set(0, -0.07, 0.03); shears.rotation.set(-1.2, 0, 0); hz.tool("shears", shears, 0);
    const pen = new T.Group(); M(K.cyl(0.0035, 0.0035, 0.14, 6), mat("#d8a83a", { rough: 0.5 }), { rx: 90 }, pen); pen.position.set(0, -0.075, 0.03); hz.tool("pen", pen, 0);
    Object.assign(hz.POSES, {
      till: { arms: [[-34, -8, -60], [-34, 8, -60]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [8, 0], curl: [60, 60] },
      click: { arms: [[-30, -12, -84], [8, 8, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [85, 30] },
      tear: { arms: [[-34, -18, -76], [-34, 18, -76]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [8, 0], curl: [80, 80] },
      pullrope: { arms: [[-150, -8, -20], [-140, 8, -30]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-4, 0], curl: [90, 90] },
      pulldown: { arms: [[-110, -8, -40], [-100, 8, -46]], legs: [[0, 0], [0, 0]], hipY: 0.9, spine: [6, 0], curl: [90, 90] },
      crank: { arms: [[-70, -14, -40], [-64, 14, -44]], legs: [[-18, 10], [14, 0]], hipY: 0.9, spine: [14, 0], curl: [90, 90] },
      cut: { arms: [[-62, -20, -40], [-52, 18, -50]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [16, 0], curl: [85, 85] },
      edge: { arms: [[-10, -10, -30], [-30, 12, -40]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [60, 60] },
      write: { arms: [[-40, -10, -66], [-36, 12, -70]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [14, 0], curl: [70, 50] },
    });
    return { tools: { click, rec, shears, pen } };
  }

  S.monastery = monastery;
  S.monastery.CREATE = CREATE;
  S.monastery.ELIF = ELIF;
  S.monastery.dressElif = dressElif;
})();
