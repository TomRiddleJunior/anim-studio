/* Survival-scenario kit · world module "The Warehouse Store" (needs survival-kit.js v2.2).
 * An unbranded big-box warehouse store glowing in an empty night parking lot, its sales floor of 40 ft pallet racking,
 * and the night stocker Dario (the series' first male lead). Everything is physically lit and a pure function of the state.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.warehouse.CREATE));
 *   const Wh = SURVIVAL.warehouse(K);                 // builds everything, registers a per-frame hook
 *   const hz = K.hazel(SURVIVAL.warehouse.DARIO); const dario = SURVIVAL.warehouse.dressDario(K, hz);
 *   K.render({ …kit state…, envIn, roofI, lampsK, aisleI, lotI, vestI, bannerI, tvI, tvFlick, doorScr, keyA, shutter:[a,b,c],
 *              fork, forkPal, cups, eyesK, eyesI, queueK, carsK, townK, stand, kale, bedI, panelI })
 *
 * World (metres; the store faces +z; front wall z 0, back wall z -92, x -62..48, roof 13 m; the lot is z 12..130):
 *   lot: asphalt with stall lines, 21 light poles (pools + 4 real spots), cart corral, bollards, his scooter under a light;
 *   facade: tilt-up concrete with panel joints and wall packs, a charcoal entrance portal with a canopy, glass vestibule,
 *   the BLACK FRIDAY · DOORS OPEN 5 AM banner (outside, uplit) and a second one inside the vestibule facing the floor;
 *   inside: polished concrete, 12 runs of pallet racking (instanced uprights, beams, pallets, product), roof joists and
 *   144 high-bay lamps with haze cones, a forklift with a liftable pallet, a free-sample stand with paper cups, a gondola,
 *   a TV wall drawn per frame (news ticker), a 65 IN · HALF OFF display TV, a camp bed, the toilet-paper mountain to the
 *   roof, pallets of water, a kale table, the dock with three roll-down steel shutters and the DELIVERY 04:00 board,
 *   the door key panel (AUTO-OPEN 05:00 · SET BY HQ / OPENS IN 5:02:00); a far highway with streaming headlights, a
 *   burning town, red eyes in the streets and a queue of dark silhouettes with red eyes round the building.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const sstep = (a, b, x) => ss((x - a) / (b - a));

  // the moon behind the store, a little right of the entrance and 21° up, so it sits in the sky over the portal in the hero
  const MOON = (() => { const az = 9 * D2R, el = 21 * D2R; return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();
  const CREATE = {
    moonDir: MOON, moonCol: "#b4c4ff", bg: "#04060c", fogCol: "#2a3045", hemi: ["#4a5578", "#2a2622"],
    shadow: { half: 70, far: 520, dist: 240, center: [-6, 4, -30] },
    sky: { zen: [0.004, 0.008, 0.024], hor: [0.035, 0.042, 0.075] },
    env: { zen: "#0b1228", hor: "#3a3440", mside: "#5a6694", gnd: "#0b0b0c" },
  };

  const X0 = -62, X1 = 48, Z0 = -92, ZF = 0, WH = 13.0, WT = 0.32;       // store shell
  const PORT = { x0: -9, x1: 9, z1: 5.0, h: 17.5 };                        // entrance portal (vestibule z 0..5)
  const DOOR = { w: 4.2, h: 3.4 };                                       // each glass door pair spans 0.3..4.3 from the centre
  const RUNS = [-54, -45.5, -37, -28.5, -20, -11.5, -3, 5.5, 14, 22.5, 31, 39.5]; // rack runs (back-to-back, along z)
  const RZ0 = -82, RZ1 = -22, BAY = 2.73, RD = 1.25;                     // rack z span, bay width, half depth
  const LEVELS = [0.12, 3.05, 6.0, 8.95];
  const LOT = { x0: -110, x1: 110, z0: 12, z1: 130 };
  const POLES = [[-8.5, 26], [8.5, 26], [-8.5, 58], [8.5, 58]]; for (const x of [-75, -45, -25, 25, 45, 75]) for (const z of [31, 67, 103]) POLES.push([x, z]);
  const SCOOT = [-6.6, 0, 27.4];
  const FORK = [-25.3, 0, -46];                                          // forklift (facing +x toward run -20)
  const SAMPLE = [-7.2, 0, -9.0];
  const GOND = [-14.5, 0, -13.5];
  const TVW = { x: 7.4, z0: -17.5, z1: -4.5 };                           // the TV wall (screens face -x)
  const BED = [2.0, 0, -4.9];
  const TP = [-42, 0, -12.5];                                             // the toilet-paper mountain (front-left seasonal area)
  const WATER = [-30.5, 0, -14.5];
  const KALE = [-20.5, 0, -8.5];
  const DOCK = { z: Z0, xs: [-30, -18, -6] };
  const PANEL = [0, 1.42, -0.36];                                        // key panel on the centre post, facing into the store

  function warehouse(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox;
    const rng = K.rng, hash2 = K.hash2;
    const dmy = new T.Object3D();
    function inst(geo, m, list, parent, p) {
      p = p || {};
      const im = new T.InstancedMesh(geo, m, Math.max(1, list.length));
      list.forEach((q, k) => { dmy.position.set(q[0], q[1], q[2]); dmy.rotation.set(q[7] || 0, q[6] || 0, 0); dmy.scale.set(q[3] || 1, q[4] || 1, q[5] || 1); dmy.updateMatrix(); im.setMatrixAt(k, dmy.matrix); if (p.cols) im.setColorAt(k, p.cols[k]); });
      im.count = list.length; im.castShadow = p.cast !== false; im.receiveShadow = p.receive !== false; im.frustumCulled = false;
      (parent || scene).add(im); return im;
    }
    function speckle(g, w, h, seed, n, a, cols) { const R = rng(seed); for (let i = 0; i < n; i++) { g.globalAlpha = a * R(); g.fillStyle = cols[Math.floor(R() * cols.length)]; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 2); } g.globalAlpha = 1; }
    const radial = K.canvasTex("w_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.45)"); gr.addColorStop(0.7, "rgba(255,255,255,0.08)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

    K.buildSky();
    // ---------------------------------------------------------------- interior environment (swapped in per frame with st.envIn)
    const envIn = (() => {
      const es = new T.Scene();
      const g = new T.SphereGeometry(10, 48, 24), pa = g.attributes.position, cols = [], c = new T.Color(), d = new T.Vector3();
      for (let i = 0; i < pa.count; i++) {
        d.set(pa.getX(i), pa.getY(i), pa.getZ(i)).normalize();
        if (d.y > 0.55) c.set("#d8dce2").multiplyScalar(0.9); else if (d.y > 0) c.set("#5c6066").lerp(new T.Color("#9aa0a8"), d.y / 0.55); else c.set("#3a3a3a").lerp(new T.Color("#202022"), clamp(-d.y * 3, 0, 1));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; const l = new T.Mesh(new T.SphereGeometry(0.5, 8, 6), new T.MeshBasicMaterial({ color: new T.Color(4, 4, 4.2) })); l.position.set(Math.cos(a) * 6, 7.5, Math.sin(a) * 6); es.add(l); }
      const pm = new T.PMREMGenerator(K.renderer); const tex = pm.fromScene(es, 0.04).texture; pm.dispose(); return tex;
    })();
    const envOut = scene.environment;

    // ---------------------------------------------------------------- ground: asphalt + stall lines, the apron, the road
    const outside = G({});
    const asphaltCol = K.canvasTex("w_asphalt", 512, 512, (g, w, h) => { g.fillStyle = "#2c2c2f"; g.fillRect(0, 0, w, h); speckle(g, w, h, 12, 26000, 0.35, ["#1d1d20", "#3d3d42", "#4c4c50"]); g.globalAlpha = 0.18; g.fillStyle = "#151517"; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(hash2(i, 1, 3) * w, hash2(i, 2, 3) * h, 20 + hash2(i, 3, 3) * 60, 10 + hash2(i, 4, 3) * 30, hash2(i, 5, 3) * 3, 0, 7); g.fill(); } g.globalAlpha = 1; }, { repeat: true });
    asphaltCol.repeat.set(260, 260);
    const asphRough = K.noiseTex("w_aspr", 256, 31, 4, 2.0); asphRough.repeat.set(90, 90);
    const asphalt = new T.MeshStandardMaterial({ map: asphaltCol, roughness: 0.96, roughnessMap: asphRough, metalness: 0, envMapIntensity: 0.22 });
    M(new T.PlaneGeometry(3000, 3000), asphalt, { rx: -90, y: 0, z: 200, cast: false }, outside);
    const stallT = K.canvasTex("w_stalls", 2048, 1024, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = "rgba(232,228,214,0.85)";
      const sx = w / (LOT.x1 - LOT.x0), sz = h / (LOT.z1 - LOT.z0);
      for (const zr of [22, 40, 58, 76, 94, 112]) {                // stall rows: double rows facing each other
        for (let x = LOT.x0 + 3; x < LOT.x1 - 3; x += 2.75) {
          if (Math.abs(x) < 9) continue;                          // the entrance drive stays clear
          g.fillRect((x - LOT.x0) * sx - 1.5, (zr - 5.2 - LOT.z0) * sz, 3, 10.4 * sz);
        }
        g.fillRect((LOT.x0 + 3 - LOT.x0) * sx, (zr - LOT.z0) * sz - 1.5, (LOT.x1 - LOT.x0 - 6) * sx, 3);
      }
      for (let k = 0; k < 9; k++) g.fillRect((-6 + k * 1.4 - LOT.x0) * sx, (14 - LOT.z0) * sz, 0.7 * sx, 4 * sz);    // crosswalk at the door
    });
    M(new T.PlaneGeometry(LOT.x1 - LOT.x0, LOT.z1 - LOT.z0), new T.MeshStandardMaterial({ map: stallT, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }), { rx: -90, y: 0.004, x: (LOT.x0 + LOT.x1) / 2, z: (LOT.z0 + LOT.z1) / 2, cast: false }, outside);
    // the apron (sidewalk) along the front, curbs, bollards, a cart corral with carts
    const concM = mat("#8d8a84", { rough: 0.88, map: K.canvasTex("w_slab", 256, 256, (g, w, h) => { g.fillStyle = "#9a968e"; g.fillRect(0, 0, w, h); speckle(g, w, h, 21, 5000, 0.2, ["#857f76", "#aba69c"]); g.fillStyle = "rgba(40,38,34,0.45)"; for (let k = 0; k <= 2; k++) { g.fillRect(k * 128 - 1, 0, 2, h); g.fillRect(0, k * 128 - 1, w, 2); } }, { repeat: true }) });
    concM.map.repeat.set(55, 4);
    M(box(116, 0.15, 12), concM, { x: (X0 + X1) / 2, y: 0.075, z: 6.0 }, outside);
    const yel = mat("#c9a227", { rough: 0.5 });
    inst(cyl(0.14, 0.14, 1.0, 12), yel, [-6.6, -5.0, 5.0, 6.6, -10.5, 10.5, -14.5, 14.5].map((x) => [x, 0.65, 11.4]), outside);
    {
      const cor = G({ x: 24, y: 0.15, z: 26 }, outside), steelC = mat("#8a9096", { rough: 0.4, metal: 0.4 });
      for (const s of [-1, 1]) { K.rod([s * 1.1, 0, -4], [s * 1.1, 1.0, -4], 0.04, steelC, cor); K.rod([s * 1.1, 0, 4], [s * 1.1, 1.0, 4], 0.04, steelC, cor); K.rod([s * 1.1, 1.0, -4], [s * 1.1, 1.0, 4], 0.04, steelC, cor); }
      const cart = (x, z, ry) => { const c = G({ x, z, ry }, cor); M(box(0.55, 0.42, 0.85), mat("#9aa2a8", { rough: 0.45, metal: 0.4, opacity: 0.85 }), { y: 0.75 }, c); M(box(0.5, 0.03, 0.8), steelC, { y: 0.3 }, c); for (const [a, b] of [[-0.22, -0.35], [0.22, -0.35], [-0.22, 0.35], [0.22, 0.35]]) M(cyl(0.05, 0.05, 0.03, 10), mat("#1c1c1c"), { x: a, y: 0.06, z: b, rz: 90 }, c); };
      for (let k = 0; k < 4; k++) cart(0, -2.4 + k * 0.42, 0);
    }
    // a main road along the front of the lot (z 150) with sodium streetlights, side roads
    M(new T.PlaneGeometry(3000, 16), mat("#232326", { rough: 0.7 }), { rx: -90, y: 0.006, z: 150, cast: false }, outside);
    for (const x of [-140, 140]) M(new T.PlaneGeometry(14, 1200), mat("#232326", { rough: 0.7 }), { rx: -90, x, y: 0.006, z: -100, cast: false }, outside);
    const sodiumHead = glow("#ffb25a", 8), poolM = new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ff9a3a").multiplyScalar(0.22), transparent: true, depthWrite: false, blending: T.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 });
    const streetList = [];
    for (let x = -700; x <= 700; x += 44) streetList.push([x, 140.5]);
    for (const xs of [-131, 131]) for (let z = -500; z <= 120; z += 44) streetList.push([xs, z]);
    inst(cyl(0.12, 0.16, 9, 6), mat("#3a3a3c", { rough: 0.6 }), streetList.map(([x, z]) => [x, 4.5, z]), outside);
    inst(box(0.9, 0.22, 0.4), sodiumHead, streetList.map(([x, z]) => [x, 9.0, z]), outside, { cast: false });
    inst(new T.PlaneGeometry(20, 20), poolM, streetList.map(([x, z]) => [x, 0.03, z, 1, 1, 1, 0, -Math.PI / 2]), outside, { cast: false, receive: false });
    // other dark low buildings around (blocks across the road and beside the lot)
    {
      const R = rng(404), dark = [];
      for (let i = 0; i < 46; i++) { const side = R(); let x, z; if (side < 0.5) { x = -650 + R() * 1300; z = 175 + R() * 220; } else if (side < 0.75) { x = -170 - R() * 380; z = -300 + R() * 420; } else { x = 170 + R() * 380; z = -300 + R() * 420; } const w = 30 + R() * 70, d = 25 + R() * 60, h = 6 + R() * 10; dark.push([x, h / 2, z, w, h, d, R() * 0.3]); }
      inst(box(1, 1, 1), mat("#3a3936", { rough: 0.9 }), dark, outside);
    }

    // ---------------------------------------------------------------- lot light poles: heads, ground pools, 4 real spots
    const lotHead = glow("#f4f1ea", 9);
    const lotPoolM = new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ffe8c8").multiplyScalar(0.3), transparent: true, depthWrite: false, blending: T.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 });
    const poleM = mat("#4a4d52", { rough: 0.5, metal: 0.3 });
    inst(cyl(0.13, 0.2, 13.4, 8), poleM, POLES.map(([x, z]) => [x, 6.7, z]), outside);
    inst(box(3.2, 0.12, 0.14), poleM, POLES.map(([x, z]) => [x, 13.3, z]), outside);
    const heads = []; POLES.forEach(([x, z]) => { for (const s of [-1, 1]) heads.push([x + s * 1.45, 13.2, z]); });
    inst(box(0.9, 0.22, 0.55), mat("#2a2c30", { rough: 0.5 }), heads.map((q) => [q[0], q[1] + 0.06, q[2]]), outside);
    inst(box(0.78, 0.03, 0.44), lotHead, heads.map((q) => [q[0], q[1] - 0.06, q[2]]), outside, { cast: false });
    const lotPools = inst(new T.PlaneGeometry(26, 26), lotPoolM, POLES.map(([x, z]) => [x, 0.02, z, 1, 1, 1, 0, -Math.PI / 2]), outside, { cast: false, receive: false });
    const lotL = [];
    for (const [x, z, sh] of [[-8.5, 26, true], [8.5, 26, false], [-8.5, 58, false], [8.5, 58, false]]) {
      const L = new T.SpotLight("#ffeedd", 0, 40, 62 * D2R, 0.65, 1.5); L.position.set(x, 13.0, z); L.target.position.set(x, 0, z + 0.5); scene.add(L, L.target);
      if (sh) { L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.0004; L.shadow.radius = 3; L.shadow.camera.near = 2; L.shadow.camera.far = 30; }
      lotL.push(L);
    }

    // ---------------------------------------------------------------- the store shell: tilt-up concrete with joints, parapet, roof
    const store = G({});
    const panelT = K.canvasTex("w_tilt", 1024, 512, (g, w, h) => {
      g.fillStyle = "#b9b3a7"; g.fillRect(0, 0, w, h); speckle(g, w, h, 5, 30000, 0.16, ["#a39d90", "#cbc5ba", "#958f83"]);
      const R = rng(8); for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(${130 + R() * 30},${126 + R() * 30},${118 + R() * 30},0.12)`; g.fillRect(k * 256, 0, 256, h); }
      g.fillStyle = "rgba(60,56,50,0.55)"; for (let k = 0; k <= 4; k++) g.fillRect(k * 256 - 2, 0, 4, h);           // panel joints every 7.5 m
      g.fillStyle = "rgba(70,66,60,0.35)"; g.fillRect(0, h * 0.30, w, 3); g.fillRect(0, h * 0.68, w, 3);              // reveal bands
      g.fillStyle = "rgba(40,38,34,0.25)"; for (let k = 0; k < 120; k++) { const x = R() * w; g.fillRect(x, h * 0.70 + R() * 6, 1, h * 0.3 * R()); }   // rain streaks
    }, { repeat: true });
    const panelN = K.heightNormal("w_tiltN", 256, (x, y) => { const j = Math.min(x % 64, 64 - (x % 64)); return (j < 2 ? 0 : 1) - (Math.abs(y - 77) < 1.5 || Math.abs(y - 174) < 1.5 ? 0.6 : 0) + K.hash2(x, y, 4) * 0.08; }, 3.0);
    function wallMat(len) { const m = new T.MeshStandardMaterial({ color: "#ffffff", map: panelT.clone(), normalMap: panelN.clone(), roughness: 0.9, envMapIntensity: 0.35 }); m.map.needsUpdate = true; m.normalMap.needsUpdate = true; m.map.repeat.set(len / 30, 1); m.normalMap.repeat.set(len / 30, 4); m.normalScale.set(0.6, 0.6); return m; }
    const WH2 = WH + 1.3;                                                   // parapet top
    // front wall with the portal opening (x -4.3..4.3 up to 5 m inside the portal)
    const fwm = wallMat(54);
    M(box(-9 - X0, WH2, WT), fwm, { x: (X0 - 9) / 2, y: WH2 / 2, z: ZF - WT / 2 }, store);
    M(box(X1 - 9, WH2, WT), wallMat(39), { x: (X1 + 9) / 2, y: WH2 / 2, z: ZF - WT / 2 }, store);
    M(box(18, WH2 - 5.0, WT), wallMat(18), { y: 5.0 + (WH2 - 5.0) / 2, z: ZF - WT / 2 }, store);
    for (const s of [-1, 1]) M(box(4.7, 5.0, WT), wallMat(5), { x: s * 6.65, y: 2.5, z: ZF - WT / 2 }, store);
    M(box(WT, WH2, ZF - Z0), wallMat(92), { x: X0 + WT / 2, y: WH2 / 2, z: (ZF + Z0) / 2 }, store);
    M(box(WT, WH2, ZF - Z0), wallMat(92), { x: X1 - WT / 2, y: WH2 / 2, z: (ZF + Z0) / 2 }, store);
    // back wall with three dock openings (4.2 x 4.6)
    {
      const xs = DOCK.xs.flatMap((x) => [x - 2.1, x + 2.1]);
      const edges = [X0, ...xs, X1];
      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i], b = edges[i + 1], open = i % 2 === 1;
        if (open) M(box(b - a, WH2 - 4.6, WT), wallMat(4), { x: (a + b) / 2, y: 4.6 + (WH2 - 4.6) / 2, z: Z0 + WT / 2 }, store);
        else M(box(b - a, WH2, WT), wallMat(b - a), { x: (a + b) / 2, y: WH2 / 2, z: Z0 + WT / 2 }, store);
      }
    }
    // coping on the parapet (with the wall's 0.32 m section visible on top) + roof
    const copeM = mat("#6c6e70", { rough: 0.6, metal: 0.2 });
    M(box(X1 - X0 + 0.1, 0.08, WT + 0.1), copeM, { x: (X0 + X1) / 2, y: WH2 + 0.04, z: ZF - WT / 2 }, store);
    M(box(X1 - X0 + 0.1, 0.08, WT + 0.1), copeM, { x: (X0 + X1) / 2, y: WH2 + 0.04, z: Z0 + WT / 2 }, store);
    for (const x of [X0 + WT / 2, X1 - WT / 2]) M(box(WT + 0.1, 0.08, ZF - Z0), copeM, { x, y: WH2 + 0.04, z: (ZF + Z0) / 2 }, store);
    const roofTop = mat("#a3a3a0", { rough: 0.85, map: K.canvasTex("w_roof", 256, 256, (g, w, h) => { g.fillStyle = "#aaa9a5"; g.fillRect(0, 0, w, h); speckle(g, w, h, 33, 3000, 0.25, ["#8f8e8a", "#bdbcb8"]); g.fillStyle = "rgba(80,80,78,0.3)"; for (let k = 0; k < 8; k++) g.fillRect(0, k * 32, w, 1); }, { repeat: true }) });
    roofTop.map.repeat.set(20, 16);
    roofTop.emissive = new T.Color("#9aa0a8"); roofTop.emissiveIntensity = 0;
    M(box(X1 - X0, 0.3, ZF - Z0), roofTop, { x: (X0 + X1) / 2, y: WH + 0.15, z: (ZF + Z0) / 2, cast: false }, store);
    { // rooftop units + skylights (seen from the aerials)
      const R = rng(91), hv = [], sk = [];
      for (let i = 0; i < 26; i++) hv.push([X0 + 8 + R() * (X1 - X0 - 16), WH + 0.3 + 0.7, Z0 + 8 + R() * (ZF - Z0 - 16), 2.4 + R() * 2.5, 1.4, 1.8 + R() * 1.5]);
      inst(box(1, 1, 1), mat("#8e9092", { rough: 0.6, metal: 0.3 }), hv, store, { cast: false });
      for (let x = X0 + 10; x < X1 - 6; x += 12) for (let z = Z0 + 10; z < ZF - 6; z += 14) sk.push([x, WH + 0.33, z, 1.8, 0.06, 1.2]);
      inst(box(1, 1, 1), mat("#6f8496", { rough: 0.15, metal: 0.1, emi: "#9fb8d0", emiI: 0.5 }), sk, store, { cast: false });
    }
    // inside: steel deck under the roof, joist girders, high-bay lamps + haze cones
    const deckT = K.canvasTex("w_deck", 128, 128, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 4); g.fillStyle = `rgb(${Math.round(70 + 40 * v)},${Math.round(72 + 40 * v)},${Math.round(76 + 40 * v)})`; g.fillRect(x, 0, 1, h); } }, { repeat: true });
    deckT.repeat.set(140, 1);
    M(new T.PlaneGeometry(X1 - X0, ZF - Z0), mat("#ffffff", { map: deckT, rough: 0.6, metal: 0.25 }), { rx: 90, x: (X0 + X1) / 2, y: WH - 0.02, z: (ZF + Z0) / 2, cast: false }, store);
    {
      const jm = mat("#3c3f44", { rough: 0.55, metal: 0.35 }), js = [];
      for (let x = X0 + 4; x < X1; x += 8.5) { js.push([x, WH - 0.45, (ZF + Z0) / 2, 0.22, 0.9, ZF - Z0 - 0.6]); }
      for (let z = Z0 + 3; z < ZF; z += 2.4) js.push([(X0 + X1) / 2, WH - 0.1, z, X1 - X0 - 0.6, 0.12, 0.1]);
      inst(box(1, 1, 1), jm, js, store, { cast: false });
    }
    const lampList = [];
    for (let i = 0; i < RUNS.length; i++) { const x = RUNS[i] + 4.25; if (x > X1 - 2) continue; for (let z = -6; z > Z0 + 4; z -= 7) lampList.push([x, WH - 1.3, z]); }
    for (const x of [-48, -36, -24, -12, 0, 12, 24, 36]) lampList.push([x, WH - 1.3, -12.5]);
    const lampShade = inst(new T.CylinderGeometry(0.28, 0.42, 0.42, 16, 1, true), mat("#585c62", { rough: 0.4, metal: 0.4, side: T.DoubleSide }), lampList, store, { cast: false });
    const lampGlowM = glow("#eef3ff", 7);
    const lampGlow = inst(new T.CircleGeometry(0.38, 18), lampGlowM, lampList.map((q) => [q[0], q[1] - 0.2, q[2], 1, 1, 1, 0, Math.PI / 2]), store, { cast: false, receive: false });
    const coneM = new T.ShaderMaterial({ uniforms: { k: { value: 0.0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: "varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = clamp(1.0 + position.y / 6.0, 0.0, 1.0); vec4 wp = vec4(position, 1.0); \n#ifdef USE_INSTANCING\n wp = instanceMatrix * wp;\n#endif\n vec4 mv = modelViewMatrix * wp; vV = normalize(-mv.xyz); vN = normalize(normalMatrix * mat3(instanceMatrix) * normal); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform float k; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float a = f * pow(vY, 3.0) * k; gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, a); }" });
    const coneG = new T.ConeGeometry(1.9, 6.0, 20, 1, true); coneG.translate(0, -3.0, 0);
    const cones = inst(coneG, coneM, lampList.map((q) => [q[0], q[1] - 0.2, q[2]]), store, { cast: false, receive: false });
    K.noDepth.push(cones);
    // the floor: polished concrete with saw-cut joints
    const floorT = K.canvasTex("w_floor", 1024, 1024, (g, w, h) => { g.fillStyle = "#8c8b87"; g.fillRect(0, 0, w, h); speckle(g, w, h, 44, 40000, 0.12, ["#7a7975", "#9e9d98", "#6c6b67"]); const R = rng(45); for (let i = 0; i < 30; i++) { g.globalAlpha = 0.07; g.fillStyle = R() < 0.5 ? "#5a5955" : "#b0afaa"; g.beginPath(); g.ellipse(R() * w, R() * h, 40 + R() * 140, 20 + R() * 80, R() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = "rgba(40,40,38,0.55)"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); }, { repeat: true });
    floorT.repeat.set((X1 - X0) / 6, (ZF - Z0) / 6);
    const floorR = K.noiseTex("w_floorR", 256, 55, 4, 3.0); floorR.repeat.set(30, 30);
    const floorM = new T.MeshStandardMaterial({ map: floorT, roughness: 0.42, roughnessMap: floorR, metalness: 0, envMapIntensity: 0.7 });
    M(new T.PlaneGeometry(X1 - X0, ZF - Z0), floorM, { rx: -90, x: (X0 + X1) / 2, y: 0.003, z: (ZF + Z0) / 2, cast: false }, store);
    // the interior key light: a near-vertical directional light with its own shadow (the roof blocks the moon)
    const roofL = new T.DirectionalLight("#f2f4ff", 0);
    roofL.castShadow = true; roofL.shadow.mapSize.set(2048, 2048); roofL.shadow.bias = -0.0006; roofL.shadow.normalBias = 0.04; roofL.shadow.radius = 3;
    { const c = roofL.shadow.camera; c.left = -30; c.right = 30; c.top = 30; c.bottom = -30; c.near = 1; c.far = 60; }
    scene.add(roofL, roofL.target);
    const ROOF_DIR = new T.Vector3(0.16, 1, 0.22).normalize();

    // ---------------------------------------------------------------- the entrance portal, canopy, banner, vestibule, glass doors
    const portal = G({}, store);
    const portM = mat("#33363b", { rough: 0.55, metal: 0.35 });
    const portEdge = mat("#2a2c30", { rough: 0.5, metal: 0.4 });
    M(box(18, PORT.h - 5.0, 0.4), portM, { y: 5.0 + (PORT.h - 5.0) / 2, z: PORT.z1 - 0.2 }, portal);                      // portal face above the doors
    for (const s of [-1, 1]) M(box(4.7, 5.0, 0.4), portM, { x: s * 6.65, y: 2.5, z: PORT.z1 - 0.2 }, portal);
    for (const s of [-1, 1]) M(box(0.4, PORT.h, PORT.z1), portM, { x: s * 8.8, y: PORT.h / 2, z: PORT.z1 / 2 }, portal);           // portal sides
    M(box(18, 0.4, PORT.z1), portM, { y: PORT.h - 0.2, z: PORT.z1 / 2 }, portal);
    M(box(18.6, 0.5, 0.6), portEdge, { y: PORT.h + 0.15, z: PORT.z1 }, portal);
    const ledStrip = M(box(17.4, 0.08, 0.06), glow("#e8f0ff", 6), { y: PORT.h - 0.5, z: PORT.z1 + 0.03, cast: false }, portal);   // a white LED line along the top
    // canopy over the doors with downlights
    M(box(16, 0.55, 4.6), portEdge, { y: 5.45, z: PORT.z1 + 2.3 }, portal);
    const canGlow = inst(new T.CircleGeometry(0.16, 14), glow("#fff2df", 8), [-6, -3, 0, 3, 6].flatMap((x) => [[x, 5.16, PORT.z1 + 1.2, 1, 1, 1, 0, Math.PI / 2], [x, 5.16, PORT.z1 + 3.4, 1, 1, 1, 0, Math.PI / 2]]), portal, { cast: false });
    const canL = new T.SpotLight("#ffe9cc", 0, 16, 70 * D2R, 0.7, 1.4); canL.position.set(0, 5.1, PORT.z1 + 2.4); canL.target.position.set(0, 0, PORT.z1 + 3); scene.add(canL, canL.target);
    // signage words (generic) on the portal band, the BANNER above the canopy, uplit by three spots on the canopy
    const signT = K.textTex("w_sign", 1024, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = "#f4f6fa"; q.font = "600 64px KitOswald, sans-serif"; q.textAlign = "center"; q.textBaseline = "middle"; const t = "BULK  ·  GROCERY  ·  ELECTRONICS"; let x = 0; q.fillText(t, w / 2, h / 2 + 4); });
    const signM = M(new T.PlaneGeometry(12, 1.5), new T.MeshBasicMaterial({ map: signT, transparent: true, color: new T.Color(2.2, 2.25, 2.4) }), { y: 14.6, z: PORT.z1 + 0.02, cast: false }, portal);
    const bannerT = K.textTex("w_banner", 2048, 640, (q, w, h) => {
      q.fillStyle = "#0d0d0f"; q.fillRect(0, 0, w, h);
      q.strokeStyle = "#f3c443"; q.lineWidth = 14; q.strokeRect(26, 26, w - 52, h - 52);
      q.fillStyle = "#ffffff"; q.textAlign = "center"; q.textBaseline = "alphabetic";
      q.font = "700 300px KitOswald, sans-serif"; q.fillText("BLACK FRIDAY", w / 2, 345);
      q.fillStyle = "#f3c443"; q.font = "700 150px KitOswald, sans-serif"; q.fillText("DOORS OPEN 5 AM", w / 2, 548);
      for (const x of [70, w - 70]) for (const y of [70, h - 70]) { q.fillStyle = "#d9d9d9"; q.beginPath(); q.arc(x, y, 12, 0, 7); q.fill(); }
    });
    const bannerM = new T.MeshStandardMaterial({ map: bannerT, roughness: 0.75, metalness: 0, emissiveMap: bannerT, emissive: new T.Color(0.12, 0.12, 0.12), envMapIntensity: 0.3 });
    const banner = M(new T.PlaneGeometry(14.4, 4.5), bannerM, { y: 8.65 + 2.25, z: PORT.z1 + 0.06 }, portal);
    for (const s of [-1, 1]) K.rod([s * 7.25, 6.2, PORT.z1 + 0.06], [s * 7.25, 13.3, PORT.z1 + 0.06], 0.03, mat("#9a9da2", { metal: 0.6, rough: 0.3 }), portal);
    const banL = [];
    for (const x of [-5, 0, 5]) { const L = new T.SpotLight("#fff1dc", 0, 18, 34 * D2R, 0.5, 1.2); L.position.set(x, 5.85, PORT.z1 + 3.6); L.target.position.set(x, 11.2, PORT.z1); scene.add(L, L.target); banL.push(L); M(box(0.3, 0.2, 0.3), portEdge, { x, y: 5.85, z: PORT.z1 + 3.6 }, portal); M(new T.CircleGeometry(0.1, 12), glow("#fff1dc", 6), { x, y: 5.96, z: PORT.z1 + 3.5, rx: -60, cast: false }, portal); }
    // wall packs along the facade
    const packList = []; for (let x = X0 + 6; x < X1 - 2; x += 10) if (Math.abs(x) > 11) packList.push([x, 6.5, 0.18]);
    const sideList = []; for (let z = -8; z > Z0 + 4; z -= 12) sideList.push([X1 + 0.18, 6.5, z]);
    inst(box(0.5, 0.36, 0.3), mat("#2a2c30", { rough: 0.5 }), packList.concat(sideList.map((q) => [q[0], q[1], q[2], 0.3 / 0.5, 1, 0.5 / 0.3])), store);
    inst(box(0.4, 0.04, 0.24), glow("#ffd9a8", 8), packList.map((q) => [q[0], q[1] - 0.19, q[2] + 0.03]).concat(sideList.map((q) => [q[0] + 0.03, q[1] - 0.19, q[2], 0.24 / 0.4, 1, 0.4 / 0.24])), store, { cast: false });
    const packPools = inst(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ffb46a").multiplyScalar(0.35), transparent: true, depthWrite: false, blending: T.AdditiveBlending }), packList.map((q) => [q[0], 3.6, 0.03, 9, 8, 1]).concat(sideList.map((q) => [X1 + 0.03, 3.6, q[2], 9, 8, 1, Math.PI / 2])), store, { cast: false, receive: false });
    const sideL = new T.PointLight("#ffcf98", 0, 0, 2); sideL.position.set(X1 + 1.5, 6.0, -20); scene.add(sideL);
    const packL = new T.PointLight("#ffcf98", 0, 0, 2); packL.position.set(26, 6.0, 1.5); scene.add(packL);
    // vestibule: floor mat, ceiling, side walls, lights; the inner banner facing the store; glass doors (outer at z 5, inner at z 0)
    const vest = G({}, store);
    M(box(8.6, 0.02, 4.6), mat("#26282b", { rough: 0.95 }), { y: 0.012, z: 2.5 }, vest);
    M(box(17.2, 0.1, 4.9), mat("#d9dadc", { rough: 0.7 }), { y: 5.0, z: 2.5 }, vest);
    const vestGlow = inst(box(1.2, 0.04, 0.3), glow("#f2f6ff", 7), [[-2.4, 4.94, 1.4], [2.4, 4.94, 1.4], [-2.4, 4.94, 3.6], [2.4, 4.94, 3.6]], vest, { cast: false });
    const vestL = new T.PointLight("#eef3ff", 0, 0, 2); vestL.position.set(0, 4.3, 2.5); scene.add(vestL);
    const inBanT = K.textTex("w_banner_in", 1024, 360, (q, w, h) => { q.fillStyle = "#0d0d0f"; q.fillRect(0, 0, w, h); q.strokeStyle = "#f3c443"; q.lineWidth = 8; q.strokeRect(14, 14, w - 28, h - 28); q.fillStyle = "#fff"; q.textAlign = "center"; q.font = "700 150px KitOswald, sans-serif"; q.fillText("BLACK FRIDAY", w / 2, 185); q.fillStyle = "#f3c443"; q.font = "700 80px KitOswald, sans-serif"; q.fillText("DOORS OPEN 5 AM", w / 2, 300); });
    M(new T.PlaneGeometry(6.8, 2.4), new T.MeshStandardMaterial({ map: inBanT, roughness: 0.8, emissiveMap: inBanT, emissive: new T.Color(0.25, 0.25, 0.25) }), { y: 3.55 + 1.2, z: PORT.z1 - 0.5, ry: 180 }, vest);
    const alu = mat("#8f949a", { rough: 0.35, metal: 0.45 });
    const glassM = new T.MeshPhysicalMaterial({ color: "#a9b8c4", roughness: 0.03, transparent: true, opacity: 0.13, envMapIntensity: 1.5, depthWrite: false, side: T.DoubleSide });
    function doorSet(z, inner) {
      const g = G({ z }, store);
      for (const s of [-1, 1]) {
        for (const k of [0, 1]) {
          const cx = s * (0.3 + DOOR.w / 4 + (k * DOOR.w) / 2);
          M(new T.PlaneGeometry(DOOR.w / 2 - 0.12, DOOR.h - 0.12), glassM, { x: cx, y: DOOR.h / 2, cast: false, receive: false, nodepth: true }, g).renderOrder = 3;
          M(box(DOOR.w / 2, 0.08, 0.08), alu, { x: cx, y: 0.04 }, g); M(box(DOOR.w / 2, 0.08, 0.08), alu, { x: cx, y: DOOR.h - 0.04 }, g);
          M(box(0.06, DOOR.h, 0.08), alu, { x: cx - DOOR.w / 4 + 0.03, y: DOOR.h / 2 }, g); M(box(0.06, DOOR.h, 0.08), alu, { x: cx + DOOR.w / 4 - 0.03, y: DOOR.h / 2 }, g);
          M(box(0.04, 0.5, 0.04), alu, { x: cx - s * (DOOR.w / 4 - 0.2), y: 1.05, z: inner ? -0.07 : 0.07 }, g);   // pull bar
        }
        M(new T.PlaneGeometry(DOOR.w, 1.5), glassM, { x: s * (0.3 + DOOR.w / 2), y: DOOR.h + 0.8, cast: false, receive: false, nodepth: true }, g).renderOrder = 3;   // transom
        M(box(DOOR.w + 0.1, 0.1, 0.12), alu, { x: s * (0.3 + DOOR.w / 2), y: DOOR.h + 0.02 }, g);
      }
      M(box(0.62, 5.0, 0.42), mat("#7c8187", { rough: 0.35, metal: 0.45 }), { y: 2.5 }, g);                                         // centre post
      return g;
    }
    doorSet(PORT.z1 - 0.25, false);
    const inner = doorSet(ZF - 0.05, true);
    // ---- the key panel on the inside face of the centre post: key switch (LOCK / UNLOCK) + a small LCD under it
    const kp = G({ x: PANEL[0], y: PANEL[1], z: PANEL[2] + 0.06, ry: 180 }, store);   // local +z faces into the store (-z world)
    M(rbox(0.5, 0.62, 0.05, 0.03), mat("#c7ccd1", { rough: 0.3, metal: 0.45 }), {}, kp);
    const kpLab = K.textTex("w_keylab", 256, 96, (q, w, h) => { q.fillStyle = "#c7ccd1"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1c1e"; q.font = "700 30px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("UNLOCK", 64, 40); q.fillText("LOCK", 196, 40); q.fillRect(62, 52, 4, 26); q.fillRect(194, 52, 4, 26); });
    M(new T.PlaneGeometry(0.4, 0.15), mat("#ffffff", { map: kpLab, rough: 0.4 }), { y: 0.2, z: 0.042, cast: false }, kp);
    M(cyl(0.06, 0.065, 0.03, 24), mat("#d9b45a", { metal: 0.6, rough: 0.3 }), { rx: 90, y: 0.06, z: 0.04 }, kp);
    const keyG = G({ y: 0.06, z: 0.06 }, kp);
    M(box(0.022, 0.08, 0.012), mat("#c9cdd2", { metal: 0.7, rough: 0.25 }), { y: 0.0, z: 0.005 }, keyG);
    M(rbox(0.07, 0.06, 0.014, 0.02), mat("#2a2c30", { rough: 0.5 }), { y: 0.055, z: 0.012 }, keyG);
    const SCR_W = 512, SCR_H = 200;
    const scrCv = document.createElement("canvas"); scrCv.width = SCR_W; scrCv.height = SCR_H;
    const scrT = new T.CanvasTexture(scrCv); scrT.colorSpace = T.SRGBColorSpace; scrT.anisotropy = 8;
    const bez = M(rbox(0.62, 0.3, 0.03, 0.015), mat("#15171a", { rough: 0.4 }), { y: -0.27, z: 0.03 }, kp);
    const scr = M(new T.PlaneGeometry(0.58, 0.226), new T.MeshBasicMaterial({ map: scrT, color: new T.Color(1.4, 1.4, 1.4) }), { y: -0.27, z: 0.058, cast: false }, kp);
    let scrKey = "";
    function drawScreen(mode) {
      if (mode === scrKey) return; scrKey = mode;
      const q = scrCv.getContext("2d"); q.fillStyle = "#05140c"; q.fillRect(0, 0, SCR_W, SCR_H);
      q.textAlign = "center";
      if (mode === "auto") { q.fillStyle = "#7dffa8"; q.font = "700 74px KitOswald, monospace"; q.fillText("AUTO-OPEN 05:00", SCR_W / 2, 88); q.font = "600 56px KitOswald, monospace"; q.fillStyle = "#c8ffd8"; q.fillText("SET BY HQ", SCR_W / 2, 168); }
      else if (mode === "unlocked") { q.fillStyle = "#5fcf86"; q.font = "700 54px KitOswald, monospace"; q.fillText("UNLOCKED", SCR_W / 2, 118); }
      else if (mode === "locked") { q.fillStyle = "#f2c25a"; q.font = "700 46px KitOswald, monospace"; q.fillText("LOCKED", SCR_W / 2, 88); q.fillStyle = "#c8ffd8"; q.font = "500 42px KitOswald, monospace"; q.fillText("AUTO-OPEN 05:00 \u00b7 SET BY HQ", SCR_W / 2, 162); }
      else if (mode === "count") { q.fillStyle = "#2a0606"; q.fillRect(0, 0, SCR_W, SCR_H); q.fillStyle = "#ff5a3c"; q.font = "700 62px KitOswald, monospace"; q.fillText("OPENS IN", SCR_W / 2, 78); q.font = "700 92px KitOswald, monospace"; q.fillText("5:02:00", SCR_W / 2, 176); }
      else { q.fillStyle = "#123a22"; q.font = "600 60px KitOswald, monospace"; q.fillText("READY", SCR_W / 2, 120); }
      scrT.needsUpdate = true;
    }
    const panelL = new T.PointLight("#7dffa8", 0, 1.6, 2); panelL.position.set(PANEL[0], PANEL[1] - 0.17, PANEL[2] - 0.25); scene.add(panelL);

    // ---------------------------------------------------------------- pallet racking: uprights, beams, pallets with loads
    const racks = G({}, store);
    const upM = mat("#3d5470", { rough: 0.5, metal: 0.3 }), beamM = mat("#d9792b", { rough: 0.45, metal: 0.25 });
    const ups = [], beams = [], decks = [];
    const nb = Math.round((RZ1 - RZ0) / BAY);
    for (const rx of RUNS) for (const sd of [-1, 1]) {
      const fx = rx + sd * RD;
      for (let b = 0; b <= nb; b++) ups.push([fx, 5.6, RZ0 + b * BAY, 0.09, 11.2, 0.09]);
      for (let b = 0; b < nb; b++) for (const ly of LEVELS) if (ly > 0.2) { beams.push([fx, ly - 0.07, RZ0 + (b + 0.5) * BAY, 0.06, 0.14, BAY - 0.09]); beams.push([rx + sd * 0.12, ly - 0.07, RZ0 + (b + 0.5) * BAY, 0.06, 0.14, BAY - 0.09]); decks.push([rx + sd * (RD / 2 + 0.06), ly - 0.02, RZ0 + (b + 0.5) * BAY, RD - 0.1, 0.03, BAY - 0.1]); }
      for (let b = 0; b <= nb; b++) ups.push([rx + sd * 0.12, 5.6, RZ0 + b * BAY, 0.07, 11.2, 0.07]);
    }
    inst(box(1, 1, 1), upM, ups, racks);
    inst(box(1, 1, 1), beamM, beams, racks);
    inst(box(1, 1, 1), mat("#5d6168", { rough: 0.7, metal: 0.2 }), decks, racks, { cast: false });
    // loads: brown shrink-wrapped cartons (instance-tinted), product display faces at ground level
    const cartonT = K.canvasTex("w_carton", 256, 256, (g, w, h) => { g.fillStyle = "#c09a66"; g.fillRect(0, 0, w, h); speckle(g, w, h, 61, 2500, 0.2, ["#a8834f", "#d4b080"]); g.strokeStyle = "rgba(90,64,34,0.6)"; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * 64); g.lineTo(w, k * 64); g.stroke(); g.beginPath(); g.moveTo(k * 64 + (k % 2) * 32, 0); g.lineTo(k * 64 + (k % 2) * 32, h); g.stroke(); } g.fillStyle = "rgba(255,255,255,0.12)"; for (let k = 0; k < 6; k++) g.fillRect(0, k * 46 + 10, w, 6); });
    const cartonM = new T.MeshStandardMaterial({ map: cartonT, roughness: 0.55, envMapIntensity: 0.6 });
    const palM = mat("#8a6a44", { rough: 0.85 });
    const loads = [], cols = [], pals = [];
    { const R = rng(1301);
      for (const rx of RUNS) for (const sd of [-1, 1]) for (let b = 0; b < nb; b++) for (const ly of LEVELS) for (let s = 0; s < 3; s++) {
        if (ly > 0.2 && R() < 0.16) continue;
        if (ly < 0.2) continue;                                              // ground level gets product faces (below)
        const h = 1.1 + R() * 1.4, x = rx + sd * (RD / 2 + 0.06), z = RZ0 + b * BAY + 0.2 + (s + 0.5) * ((BAY - 0.4) / 3);
        pals.push([x, ly + 0.07, z, 1.1, 0.13, 0.8]);
        loads.push([x + (R() - 0.5) * 0.06, ly + 0.14 + h / 2, z, 1.0 + R() * 0.08, h, 0.76]);
        const c = new T.Color().setHSL(0.08 + R() * 0.04, 0.25 + R() * 0.25, 0.42 + R() * 0.22); if (R() < 0.12) c.setHSL(R(), 0.3, 0.55); cols.push(c);
      } }
    inst(box(1, 1, 1), palM, pals, racks);
    inst(box(1, 1, 1), cartonM, loads, racks, { cols });
    // ground-level product: colourful generic packs (6 label sheets), stacked on pallets in the bays
    const labelT = [];
    const PAL6 = [["#c8382e", "#f2e6c8"], ["#2d6db3", "#f4f0e2"], ["#e0a52a", "#3a2a12"], ["#3c8f4a", "#f2f2e6"], ["#7a3f8f", "#fbe8ff"], ["#e66a2c", "#fff2e0"]];
    PAL6.forEach(([a, b], i) => labelT.push(K.canvasTex("w_label" + i, 256, 256, (g, w, h) => { g.fillStyle = "#f2efe6"; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = c * 64, y = r * 64; g.fillStyle = a; g.fillRect(x + 3, y + 3, 58, 58); g.fillStyle = b; g.fillRect(x + 10, y + 22, 44, 16); g.fillStyle = a; g.fillRect(x + 16, y + 27, 32, 6); } g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, w, 8); }, { repeat: true })));
    const prodMats = labelT.map((t) => new T.MeshStandardMaterial({ map: t, roughness: 0.4, envMapIntensity: 0.8 }));
    const prods = prodMats.map(() => []);
    { const R = rng(77);
      for (const rx of RUNS) for (const sd of [-1, 1]) for (let b = 0; b < nb; b++) for (let s = 0; s < 3; s++) {
        const k = Math.floor(R() * 6), x = rx + sd * (RD / 2 + 0.06), z = RZ0 + b * BAY + 0.2 + (s + 0.5) * ((BAY - 0.4) / 3), h = 1.2 + R() * 0.9;
        prods[k].push([x, 0.15 + h / 2, z, 1.05, h, 0.78]);
        pals.length;
      } }
    prods.forEach((l, k) => inst(box(1, 1, 1), prodMats[k], l, racks));
    inst(box(1, 1, 1), palM, RUNS.flatMap((rx) => [-1, 1].flatMap((sd) => Array.from({ length: nb * 3 }, (_, i) => [rx + sd * (RD / 2 + 0.06), 0.075, RZ0 + Math.floor(i / 3) * BAY + 0.2 + ((i % 3) + 0.5) * ((BAY - 0.4) / 3), 1.1, 0.14, 0.8]))), racks);
    // aisle signs hanging over each aisle (numbers only)
    RUNS.forEach((rx, i) => { if (i === RUNS.length - 1) return; const t = K.textTex("w_aisle" + i, 128, 96, (q, w, h) => { q.fillStyle = "#1d2a3a"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffffff"; q.font = "700 64px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText(String(i + 1), w / 2, 72); }); M(box(1.0, 0.75, 0.04), [mat("#1d2a3a"), mat("#1d2a3a"), mat("#1d2a3a"), mat("#1d2a3a"), mat("#ffffff", { map: t, rough: 0.6 }), mat("#ffffff", { map: t, rough: 0.6 })], { x: rx + 4.25, y: 11.2, z: RZ1 + 0.4 }, racks); });

    // ---------------------------------------------------------------- forklift with a liftable pallet (st.fork 0..1 lifts it)
    const fork = G({ x: FORK[0], z: FORK[2], ry: 90 }, store);   // faces +x (local +z forward)
    const fkY = mat("#e3b21c", { rough: 0.45, metal: 0.1 }), fkD = mat("#26282b", { rough: 0.5, metal: 0.3 }), tyre = mat("#141414", { rough: 0.8 });
    {
      M(rbox(1.15, 0.9, 2.1, 0.12), fkY, { y: 0.75, z: -0.25 }, fork);                       // body
      M(rbox(1.2, 0.55, 0.5, 0.1), fkD, { y: 0.5, z: -1.3 }, fork);                           // counterweight
      for (const [x, z, r] of [[-0.55, 0.5, 0.3], [0.55, 0.5, 0.3], [-0.55, -1.0, 0.25], [0.55, -1.0, 0.25]]) M(cyl(r, r, 0.24, 18), tyre, { x, y: r, z, rz: 90 }, fork);
      for (const x of [-0.5, 0.5]) for (const z of [0.35, -1.05]) K.rod([x, 1.2, z], [x, 2.15, z], 0.035, fkD, fork, 8);   // overhead guard
      for (let k = 0; k < 5; k++) K.rod([-0.5, 2.15, 0.35 - k * 0.35], [0.5, 2.15, 0.35 - k * 0.35], 0.025, fkD, fork, 6);
      M(rbox(0.5, 0.12, 0.45, 0.05), mat("#1c1d1f", { rough: 0.7 }), { y: 1.25, z: -0.45 }, fork);      // seat
      M(rbox(0.45, 0.5, 0.1, 0.05), mat("#1c1d1f", { rough: 0.7 }), { y: 1.52, z: -0.7, rx: -10 }, fork);
      K.rod([0, 1.25, 0.2], [0, 1.55, 0.05], 0.025, fkD, fork, 8);
      M(new T.TorusGeometry(0.16, 0.018, 8, 24), fkD, { y: 1.58, z: 0.02, rx: 60 }, fork);               // steering wheel
      for (const x of [-0.32, 0.32]) M(box(0.1, 2.6, 0.12), fkD, { x, y: 1.3, z: 0.9 }, fork);           // mast
      M(box(0.15, 0.15, 0.15), glow("#ff9a2a", 4), { x: 0.45, y: 2.25, z: -1.0, cast: false }, fork);   // beacon
    }
    const carriage = G({ z: 1.0 }, fork);
    M(box(0.8, 0.5, 0.06), fkD, { y: 0.4 }, carriage);
    for (const x of [-0.25, 0.25]) M(box(0.1, 0.05, 1.1), fkD, { x, y: 0.12, z: 0.55 }, carriage);
    const forkLoad = G({ z: 0.62 }, carriage);
    M(box(1.1, 0.13, 0.8), palM, { y: 0.21, ry: 90 }, forkLoad);
    M(box(0.95, 1.05, 0.76), cartonM, { y: 0.8, ry: 90 }, forkLoad);
    const forkSpot = new T.SpotLight("#fff4e0", 0, 9, 40 * D2R, 0.6, 1.5); forkSpot.position.set(0.4, 2.0, 0.6); forkSpot.target.position.set(0.0, 0.0, 4); fork.add(forkSpot, forkSpot.target);

    // ---------------------------------------------------------------- the free-sample stand with tiny paper cups (st.cups = empties)
    const stand = G({ x: SAMPLE[0], z: SAMPLE[2], ry: 25 }, store);
    M(box(1.2, 0.86, 0.6), mat("#f2efe8", { rough: 0.8 }), { y: 0.43 }, stand);
    M(box(1.24, 0.04, 0.64), mat("#d8d4ca", { rough: 0.5 }), { y: 0.88 }, stand);
    const smpT = K.textTex("w_sample", 256, 96, (q, w, h) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, w, h); q.fillStyle = "#c8382e"; q.fillRect(0, 0, w, 14); q.fillStyle = "#1c1c1c"; q.font = "700 40px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FREE SAMPLES", w / 2, 66); });
    M(new T.PlaneGeometry(1.0, 0.38), mat("#ffffff", { map: smpT, rough: 0.6 }), { y: 0.5, z: 0.302, cast: false }, stand);
    M(cyl(0.2, 0.2, 0.02, 24), mat("#c9ccd0", { metal: 0.45, rough: 0.3 }), { y: 0.91, x: -0.2 }, stand);   // tray
    const cupG = new T.CylinderGeometry(0.024, 0.018, 0.045, 12, 1, true);
    const cupM = mat("#fbfbf6", { rough: 0.6, side: T.DoubleSide });
    const fullCups = [], emptyCups = [];
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; const c = G({ x: -0.2 + Math.cos(a) * 0.12, y: 0.945, z: Math.sin(a) * 0.12 }, stand); M(cupG, cupM, { cast: false }, c); M(cyl(0.021, 0.021, 0.004, 12), mat("#8a5a2a", { rough: 0.4 }), { y: 0.016, cast: false }, c); fullCups.push(c); }
    for (let k = 0; k < 4; k++) { const c = G({ x: 0.22 + (k % 2) * 0.07, y: 0.92 + 0.0, z: -0.06 + Math.floor(k / 2) * 0.1, rz: k === 3 ? 75 : 0 }, stand); M(cupG, cupM, { cast: false }, c); emptyCups.push(c); }
    M(rbox(0.3, 0.2, 0.22, 0.04), mat("#2a2c30", { rough: 0.5 }), { x: 0.35, y: 1.0, z: 0.12 }, stand);    // a little warmer
    const standL = new T.SpotLight("#ffe7c8", 0, 7, 40 * D2R, 0.6, 1.5); standL.position.set(SAMPLE[0] + 0.5, 4.0, SAMPLE[2] + 1.5); standL.target.position.set(SAMPLE[0], 1.0, SAMPLE[2]); scene.add(standL, standL.target);
    // a gondola of small products (the shelves he faces)
    const gond = G({ x: GOND[0], z: GOND[2], ry: 0 }, store);
    M(box(4.8, 1.9, 0.08), mat("#e8e8e4", { rough: 0.6 }), { y: 0.95 }, gond);
    for (let k = 0; k < 5; k++) M(box(4.8, 0.03, 0.55), mat("#d6d6d2", { rough: 0.5 }), { y: 0.15 + k * 0.42, z: 0.3 }, gond);
    const gBoxes = prodMats.map(() => []);
    { const R = rng(808); for (let k = 0; k < 5; k++) for (let i = 0; i < 26; i++) { const m = Math.floor(R() * 6); const w = 0.15, h = 0.24 + R() * 0.1; gBoxes[m].push([-2.3 + i * 0.18, 0.165 + k * 0.42 + h / 2, 0.28 + (R() < 0.3 && k === 2 ? -0.12 : 0), w, h, 0.22, (R() - 0.5) * 0.06]); } }
    const gIM = gBoxes.map((l, m) => inst(box(1, 1, 1), prodMats[m], l, gond));

    // ---------------------------------------------------------------- the TV wall (drawn per frame: a news channel with a ticker), the 65" display, the camp bed
    const tvs = G({}, store);
    const NC = 6, NR = 4, TVW_ = 1.62, TVH_ = 0.93;
    M(box(0.4, 4.6, TVW.z1 - TVW.z0 + 0.6), mat("#2a2c30", { rough: 0.6 }), { x: TVW.x + 0.25, y: 2.3, z: (TVW.z0 + TVW.z1) / 2 }, tvs);
    const TV_CW = 1024, TV_CH = 576;
    const tvCv = document.createElement("canvas"); tvCv.width = TV_CW; tvCv.height = TV_CH;
    const tvT = new T.CanvasTexture(tvCv); tvT.colorSpace = T.SRGBColorSpace; tvT.anisotropy = 8;
    const tvScreens = [];
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
      const z = TVW.z1 - 0.95 - c * (TVW_ + 0.14), y = 0.95 + r * (TVH_ + 0.1);
      M(box(0.06, TVH_ + 0.04, TVW_ + 0.04), mat("#0c0c0e", { rough: 0.35 }), { x: TVW.x, y, z }, tvs);
      const s = M(new T.PlaneGeometry(TVW_, TVH_), new T.MeshBasicMaterial({ map: tvT, color: new T.Color(1, 1, 1) }), { x: TVW.x - 0.035, y, z, ry: -90, cast: false }, tvs);
      tvScreens.push(s);
    }
    const tvL = [];
    for (const z of [-6.5, -13.0]) { const L = new T.PointLight("#bcd4ff", 0, 0, 2); L.position.set(TVW.x - 2.0, 2.2, z); scene.add(L); tvL.push(L); }
    // the 65" display TV on a stand + its price card
    const big = G({ x: 5.0, z: -10.6, ry: -58 }, tvs);
    M(box(1.48, 0.86, 0.05), mat("#0c0c0e", { rough: 0.35 }), { y: 1.22 }, big);
    const demoCv = document.createElement("canvas"); demoCv.width = 512; demoCv.height = 288; const demoT = new T.CanvasTexture(demoCv); demoT.colorSpace = T.SRGBColorSpace;
    let demoKey = "";
    function drawDemo(t) { const k = (Math.floor(t * 10) / 10).toFixed(1); if (k === demoKey) return; demoKey = k; const q = demoCv.getContext("2d"), w = 512, h = 288;
      const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ff8a3a"); g.addColorStop(0.45, "#ffcf6a"); g.addColorStop(0.55, "#1a4a8a"); g.addColorStop(1, "#0a2240"); q.fillStyle = g; q.fillRect(0, 0, w, h);
      q.fillStyle = "#fff3c8"; q.beginPath(); q.arc(w * 0.62, h * 0.47, 34, 0, 7); q.fill();
      for (let i = 0; i < 18; i++) { q.strokeStyle = `rgba(255,220,150,${0.25 + 0.2 * Math.sin(i + t * 2)})`; q.lineWidth = 2; q.beginPath(); const y = h * 0.56 + i * 7; q.moveTo(0, y); for (let x = 0; x <= w; x += 16) q.lineTo(x, y + Math.sin(x / 30 + t * 1.5 + i) * 2); q.stroke(); }
      q.fillStyle = "rgba(10,10,10,0.55)"; q.fillRect(w - 118, 14, 104, 34); q.fillStyle = "#fff"; q.font = "700 22px KitOswald, sans-serif"; q.fillText("DEMO", w - 92, 39);
      demoT.needsUpdate = true; }
    const bigS = M(new T.PlaneGeometry(1.44, 0.81), new T.MeshBasicMaterial({ map: demoT, color: new T.Color(1, 1, 1) }), { y: 1.22, z: 0.028, cast: false }, big);
    M(box(0.08, 0.75, 0.08), mat("#2a2c30", { rough: 0.4, metal: 0.4 }), { y: 0.42 }, big);
    M(box(0.6, 0.04, 0.4), mat("#2a2c30", { rough: 0.4, metal: 0.4 }), { y: 0.03 }, big);
    const priceT = K.textTex("w_price", 512, 320, (q, w, h) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, w, h); q.fillStyle = "#e5322a"; q.fillRect(0, 0, w, 96); q.fillStyle = "#ffffff"; q.font = "700 76px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("HALF OFF", w / 2, 78); q.fillStyle = "#111"; q.font = "700 118px KitOswald, sans-serif"; q.fillText("65 IN", w / 2, 232); q.font = "600 40px KitInter, sans-serif"; q.fillText("TV · DISPLAY MODEL", w / 2, 292); });
    M(new T.PlaneGeometry(0.5, 0.31), mat("#ffffff", { map: priceT, rough: 0.6 }), { y: 0.55, z: 0.07, cast: false }, big);
    // camp bed (cot) with a sleeping bag + pillow, a lantern-style flashlight, the plan notebook
    const bed = G({ x: BED[0], z: BED[2], ry: 90 }, store);
    const cotM = mat("#3c4a34", { rough: 0.8 }), cotF = mat("#55585c", { rough: 0.4, metal: 0.4 });
    M(box(0.72, 0.05, 1.95), cotM, { y: 0.42 }, bed);
    for (const s of [-1, 1]) K.rod([s * 0.37, 0.42, -0.98], [s * 0.37, 0.42, 0.98], 0.018, cotF, bed);
    for (const z of [-0.85, 0.85]) { K.rod([-0.37, 0.42, z], [0.37, 0.05, z - 0.2], 0.015, cotF, bed); K.rod([0.37, 0.42, z], [-0.37, 0.05, z - 0.2], 0.015, cotF, bed); }
    M(rbox(0.66, 0.1, 1.2, 0.05), mat("#c7562a", { rough: 0.7 }), { y: 0.5, z: 0.25 }, bed);              // sleeping bag
    M(rbox(0.5, 0.1, 0.32, 0.06), mat("#e8e4da", { rough: 0.85 }), { y: 0.5, z: -0.72 }, bed);             // pillow
    const bedLamp = G({ x: BED[0] + 1.2, z: BED[2] - 0.45 }, store);
    M(cyl(0.07, 0.08, 0.05, 16), mat("#2b4a2e", { rough: 0.5 }), { y: 0.025 }, bedLamp);
    const bedGlobe = M(cyl(0.055, 0.055, 0.13, 16), glow("#ffd9a0", 4), { y: 0.12, cast: false }, bedLamp);
    M(cyl(0.07, 0.06, 0.03, 16), mat("#2b4a2e", { rough: 0.5 }), { y: 0.21 }, bedLamp);
    const bedL = new T.PointLight("#ffc890", 0, 0, 2); bedL.position.set(BED[0] + 1.2, 0.4, BED[2] - 0.45); scene.add(bedL);

    // ---------------------------------------------------------------- the toilet-paper mountain to the roof, pallets of water, the kale table
    const tpT = K.textTex("w_tp", 256, 256, (q, w, h) => { q.fillStyle = "#f4f6f8"; q.fillRect(0, 0, w, h); q.fillStyle = "#d9e3ee"; for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { q.beginPath(); q.arc(32 + k * 64, 40 + j * 86, 26, 0, 7); q.fill(); } q.fillStyle = "#3d6fb0"; q.fillRect(0, 196, w, 60); q.fillStyle = "#ffffff"; q.font = "700 34px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("SOFT · 24 ROLLS", w / 2, 238); });
    const tpM = new T.MeshStandardMaterial({ map: tpT, roughness: 0.75, envMapIntensity: 0.7 });
    const tpList = [];
    { const R = rng(2424);
      // a stepped mountain: rings of packs, wider at the bottom, to the roof lamps (12.6 m)
      for (let y = 0; y < 12.4; y += 0.46) {
        const r = lerp(9.5, 1.2, Math.pow(y / 12.4, 0.85));
        for (let x = -r; x <= r; x += 0.56) for (let z = -r * 0.75; z <= r * 0.75; z += 0.48) {
          const d = Math.hypot(x / r, z / (r * 0.75)); if (d > 1) continue;
          if (d < 0.75 && y > 0.5 && R() < 0.85) continue;                      // hollow inside (only the shell shows)
          tpList.push([TP[0] + x + (R() - 0.5) * 0.08, y + 0.23, TP[2] + z, 0.54, 0.44, 0.46, (R() - 0.5) * 0.25]);
        }
      } }
    inst(box(1, 1, 1), tpM, tpList, store);
    const tpL = new T.SpotLight("#f4f6ff", 0, 30, 40 * D2R, 0.6, 1.4); tpL.position.set(TP[0] + 6, 12.2, TP[2] + 8); tpL.target.position.set(TP[0], 5, TP[2]); scene.add(tpL, tpL.target);
    const waterM = new T.MeshPhysicalMaterial({ color: "#cfe6fa", roughness: 0.15, transparent: true, opacity: 0.22, envMapIntensity: 1.2, clearcoat: 1, depthWrite: false });
    const bottleM = new T.MeshPhysicalMaterial({ color: "#7fb6e6", roughness: 0.1, transparent: true, opacity: 0.78, envMapIntensity: 1.3, clearcoat: 1 });
    const capM = mat("#2f74d8", { rough: 0.4 });
    const wList = [], wCaps = [], wBot = [];
    for (let px = 0; px < 5; px++) for (let pz = 0; pz < 3; pz++) for (let ly = 0; ly < 6; ly++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = WATER[0] + px * 1.25 + (i - 0.5) * 0.52, z = WATER[2] + pz * 1.0 + (j - 0.5) * 0.4, y = 0.14 + ly * 0.31 + 0.15;
      wList.push([x, y, z, 0.5, 0.28, 0.38]);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { wCaps.push([x - 0.16 + a * 0.16, y + 0.135, z - 0.09 + b * 0.18, 1, 1, 1]); wBot.push([x - 0.16 + a * 0.16, y, z - 0.09 + b * 0.18, 1, 1, 1]); }
    }
    inst(box(1, 1, 1), waterM, wList, store, { cast: false });
    inst(cyl(0.065, 0.065, 0.25, 12), bottleM, wBot, store, { cast: false });
    inst(cyl(0.025, 0.025, 0.02, 8), capM, wCaps, store, { cast: false });
    inst(box(1.1, 0.13, 0.85), palM, Array.from({ length: 15 }, (_, k) => [WATER[0] + Math.floor(k / 3) * 1.25, 0.07, WATER[2] + (k % 3) * 1.0]), store);
    const waterSign = K.textTex("w_watersign", 256, 128, (q, w, h) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, w, h); q.fillStyle = "#2f74d8"; q.fillRect(0, 0, w, 30); q.fillStyle = "#123"; q.font = "700 54px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("WATER", w / 2, 92); });
    M(new T.PlaneGeometry(0.9, 0.45), mat("#ffffff", { map: waterSign, rough: 0.6 }), { x: WATER[0] + 2.5, y: 2.6, z: WATER[2] + 2.6, cast: false }, store);
    const waterL = new T.SpotLight("#eef4ff", 0, 14, 45 * D2R, 0.6, 1.4); waterL.position.set(WATER[0] + 2.5, 8, WATER[2] + 6); waterL.target.position.set(WATER[0] + 2.5, 1, WATER[2] + 1); scene.add(waterL, waterL.target);
    // the kale table: crates of dark crinkled bunches; one bunch in his hand (a tool)
    const kaleT = K.canvasTex("w_kale", 128, 128, (g, w, h) => { g.fillStyle = "#1f4a2a"; g.fillRect(0, 0, w, h); const R = rng(5); for (let i = 0; i < 400; i++) { g.fillStyle = R() < 0.5 ? "#2f6a3a" : "#163a20"; g.beginPath(); g.arc(R() * w, R() * h, 2 + R() * 5, 0, 7); g.fill(); } }, { repeat: true });
    const kaleN = K.heightNormal("w_kaleN", 128, (x, y) => K.vnoise(x / 5, y / 5, 3) * 0.7 + K.vnoise(x / 2, y / 2, 4) * 0.3, 4.0);
    const kaleM = new T.MeshStandardMaterial({ map: kaleT, normalMap: kaleN, roughness: 0.55, envMapIntensity: 0.6 });
    const kaleBunch = () => { const g = new T.SphereGeometry(0.09, 16, 12); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const n = 1 + 0.18 * Math.sin(x * 90) * Math.sin(z * 80) + 0.12 * Math.sin(y * 120); pa.setXYZ(i, x * n * 1.3, y * n * 0.8, z * n * 1.0); } g.computeVertexNormals(); return g; };
    const kb = kaleBunch();
    const kale = G({ x: KALE[0], z: KALE[2], ry: 0 }, store);
    M(box(2.4, 0.8, 1.1), mat("#6a4a2c", { rough: 0.8 }), { y: 0.4 }, kale);
    const kaleList = []; { const R = rng(66); for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) kaleList.push([-1.05 + i * 0.26 + (R() - 0.5) * 0.04, 0.86 + R() * 0.04, -0.42 + j * 0.27, 1, 1, 1, R() * 3]); }
    inst(kb, kaleM, kaleList, kale);
    const kaleSign = K.textTex("w_kalesign", 256, 128, (q, w, h) => { q.fillStyle = "#f6f2e4"; q.fillRect(0, 0, w, h); q.fillStyle = "#2f6a3a"; q.font = "700 64px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("KALE", w / 2, 74); q.font = "600 30px KitInter, sans-serif"; q.fillStyle = "#333"; q.fillText("FRESH · 2 LB", w / 2, 112); });
    M(new T.PlaneGeometry(0.6, 0.3), mat("#ffffff", { map: kaleSign, rough: 0.6 }), { x: -1.0, y: 1.1, z: 0.56, cast: false }, kale); K.rod([-1.0, 0.8, 0.56], [-1.0, 0.95, 0.56], 0.01, mat("#888"), kale);
    const kaleL = new T.SpotLight("#fff0dc", 0, 7, 42 * D2R, 0.6, 1.5); kaleL.position.set(KALE[0] + 0.8, 4.2, KALE[2] + 2.2); kaleL.target.position.set(KALE[0], 0.9, KALE[2]); scene.add(kaleL, kaleL.target);

    // ---------------------------------------------------------------- the dock: three roll-down steel shutters (st.shutter[i] 0 open .. 1 down) + the DELIVERY board
    const dock = G({}, store);
    const corrT = K.canvasTex("w_corr", 64, 256, (g, w, h) => { for (let y = 0; y < h; y++) { const v = 0.5 + 0.5 * Math.sin((y / h) * Math.PI * 2 * 16); g.fillStyle = `rgb(${Math.round(120 + 60 * v)},${Math.round(124 + 60 * v)},${Math.round(128 + 60 * v)})`; g.fillRect(0, y, w, 1); } }, { repeat: true });
    const corrN = K.heightNormal("w_corrN", 128, (x, y) => Math.sin((y / 128) * Math.PI * 2 * 8), 3.0);
    const shutM = new T.MeshStandardMaterial({ map: corrT, normalMap: corrN, color: "#c8ccd0", metalness: 0.45, roughness: 0.4, envMapIntensity: 0.9 });
    const shutters = [];
    for (const x of DOCK.xs) {
      const g = new T.PlaneGeometry(4.2, 4.6); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k), uv.getY(k) * 2);
      const sh = M(g, shutM, { x, y: 2.3, z: Z0 + WT + 0.06 }, dock);
      M(box(4.6, 0.5, 0.5), mat("#44484e", { rough: 0.5, metal: 0.35 }), { x, y: 4.85, z: Z0 + WT + 0.26 }, dock);   // roll housing
      for (const s of [-1, 1]) M(box(0.12, 4.6, 0.16), mat("#5a5e64", { rough: 0.5, metal: 0.35 }), { x: x + s * 2.15, y: 2.3, z: Z0 + WT + 0.1 }, dock);   // guides
      M(box(4.2, 0.08, 0.1), mat("#2a2c30", { metal: 0.4, rough: 0.4 }), { x, y: 0.04, z: Z0 + WT + 0.08 }, dock);   // bottom bar (moves)
      shutters.push({ mesh: sh, bar: dock.children[dock.children.length - 1], x });
      for (const s of [-1, 1]) M(box(0.4, 0.4, 0.5), mat("#1a1a1a", { rough: 0.9 }), { x: x + s * 1.6, y: 1.25, z: Z0 + WT + 0.25 }, dock);  // bumpers
      const hz = K.canvasTex("w_hazard", 256, 32, (q, w, h) => { q.fillStyle = "#f2c230"; q.fillRect(0, 0, w, h); q.fillStyle = "#111"; for (let k = 0; k < 16; k++) { q.beginPath(); q.moveTo(k * 32, 0); q.lineTo(k * 32 + 16, 0); q.lineTo(k * 32 - 16, h); q.lineTo(k * 32 - 32, h); q.fill(); } }, { repeat: true });
      M(new T.PlaneGeometry(4.2, 0.25), mat("#ffffff", { map: hz, rough: 0.6 }), { x, y: 0.006, z: Z0 + 1.6, rx: -90, cast: false }, dock);
    }
    // outside the dock openings: a dark night yard (so the open shutters do not show a void)
    M(box(40, 6, 0.4), mat("#15171a", { rough: 0.9 }), { x: -18, y: 3, z: Z0 - 6 }, dock);
    const boardT = K.textTex("w_board", 512, 384, (q, w, h) => {
      q.fillStyle = "#f4f4f0"; q.fillRect(0, 0, w, h); q.strokeStyle = "#9aa0a6"; q.lineWidth = 10; q.strokeRect(5, 5, w - 10, h - 10);
      q.fillStyle = "#1a1c22"; q.font = "700 44px KitOswald, sans-serif"; q.fillText("DOCK SCHEDULE", 28, 62); q.fillRect(28, 76, w - 56, 3);
      q.font = "600 40px KitInter, sans-serif"; q.fillStyle = "#2a3a7a"; q.fillText("DOOR 2  ·  DELIVERY 04:00", 28, 140);
      q.fillStyle = "#555"; q.font = "500 32px KitInter, sans-serif"; q.fillText("DOOR 1  ·  —", 28, 200); q.fillText("DOOR 3  ·  —", 28, 252); q.fillStyle = "#b23"; q.font = "600 30px KitInter, sans-serif"; q.fillText("BF crew 03:30", 28, 330);
    });
    M(box(1.3, 0.98, 0.04), [mat("#9aa0a6"), mat("#9aa0a6"), mat("#9aa0a6"), mat("#9aa0a6"), mat("#ffffff", { map: boardT, rough: 0.5 }), mat("#9aa0a6")], { x: -24.0, y: 1.8, z: Z0 + WT + 0.05 }, dock);
    const dockL = new T.SpotLight("#eef2ff", 0, 26, 55 * D2R, 0.6, 1.3); dockL.position.set(-18, 11, Z0 + 12); dockL.target.position.set(-18, 1.5, Z0); scene.add(dockL, dockL.target);
    const flashL = new T.PointLight("#ffffff", 0, 0, 2); flashL.position.set(-18, 1.0, Z0 + 2.5); scene.add(flashL);

    // ---------------------------------------------------------------- the 12 IN dimension line on the parapet corner (in world, AR-style)
    const dim = G({ x: X1 - WT / 2, y: WH2 + 0.1, z: ZF - 0.0 }, store);   // the front-right corner of the parapet
    const amber = glow("#f7b733", 3);
    M(box(WT + 0.0, 0.025, 0.025), amber, { x: 0, y: 0.05, z: 0.35, cast: false }, dim);
    for (const s of [-1, 1]) M(box(0.02, 0.16, 0.02), amber, { x: s * WT / 2, y: 0.05, z: 0.35, cast: false }, dim);
    for (const s of [-1, 1]) M(box(0.02, 0.02, 0.32), amber, { x: s * WT / 2, y: 0.05, z: 0.18, cast: false }, dim);
    const dimT = K.textTex("w_dim", 256, 96, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = "#f7b733"; q.font = "700 76px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("12 IN", w / 2, 76); });
    const dimLab = M(new T.PlaneGeometry(0.52, 0.2), new T.MeshBasicMaterial({ map: dimT, transparent: true, color: new T.Color(2.2, 2.2, 2.2), depthWrite: false }), { y: 0.25, z: 0.36, cast: false }, dim);
    dim.visible = false;

    // ---------------------------------------------------------------- the far highway (streaming headlights) and the burning town beyond
    const far = G({});
    const HW0 = new T.Vector3(-520, 6, 470), HW1 = new T.Vector3(900, 6, 2900);
    { const dir = HW1.clone().sub(HW0), len = dir.length(); const g = new T.PlaneGeometry(24, len); const m = M(g, mat("#1c1c1e", { rough: 0.8 }), { x: (HW0.x + HW1.x) / 2, y: 5.9 + len * 0.011, z: (HW0.z + HW1.z) / 2, cast: false }, far); m.rotation.set(-Math.PI / 2 + Math.atan(0.022), 0, 0); m.rotateZ(Math.atan2(dir.x, dir.z)); }
    const carGlowT = radial;
    const NCAR = 340;
    const headM = new T.MeshBasicMaterial({ map: carGlowT, color: new T.Color(4.0, 3.8, 3.4), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const tailM = new T.MeshBasicMaterial({ map: carGlowT, color: new T.Color(3.6, 0.35, 0.2), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const heads2 = new T.InstancedMesh(new T.PlaneGeometry(1, 1), headM, NCAR * 2), tails = new T.InstancedMesh(new T.PlaneGeometry(1, 1), tailM, NCAR * 2);
    heads2.frustumCulled = tails.frustumCulled = false; far.add(heads2, tails); K.noDepth.push(heads2, tails);
    const carsD = []; { const R = rng(777); for (let i = 0; i < NCAR; i++) carsD.push({ off: R(), lane: -4.5 - R() * 3, sp: 0.006 + R() * 0.003, jam: R() }); }
    const townG = G({}, far);
    { const R = rng(31337), pts = [], pc = [];
      for (let i = 0; i < 2600; i++) { const u = R(), v = R(); const x = lerp(400, 2400, u) + (v - 0.5) * 1800, z = lerp(2500, 4200, v); pts.push(x, 2 + R() * 30, z); const c = new T.Color().setHSL(0.08 + R() * 0.06, 0.6, 0.6 + R() * 0.3); pc.push(c.r, c.g, c.b); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pts, 3)); g.setAttribute("color", new T.Float32BufferAttribute(pc, 3));
      const pm = new T.PointsMaterial({ size: 3.2, vertexColors: true, sizeAttenuation: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }); pm.color.setScalar(2.2);
      townG.add(new T.Points(g, pm)); }
    const fireGlows = [];
    for (const [x, z, s] of [[1300, 3200, 700], [700, 3600, 500], [1900, 3000, 520]]) { const m = M(new T.PlaneGeometry(s, s * 0.55), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ff6a1e").multiplyScalar(0.9), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { x, y: s * 0.12, z, cast: false, receive: false }, townG); fireGlows.push(m); }
    const smokeM = new T.ShaderMaterial({ uniforms: { t: { value: 0 } }, transparent: true, depthWrite: false, fog: false,
      vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float t; varying vec2 vU; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); } void main(){ vec2 p = vU * vec2(3.0, 6.0) - vec2(0.0, t * 0.08); float d = n(p) * 0.6 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.1; float m = smoothstep(0.0, 0.25, vU.y) * (1.0 - smoothstep(0.55, 1.0, vU.y)) * (1.0 - smoothstep(0.15, 0.5, abs(vU.x - 0.5 - (vU.y - 0.2) * 0.25))); float a = clamp(d * 1.4 - 0.35, 0.0, 1.0) * m * 0.75; vec3 c = mix(vec3(0.45, 0.2, 0.1), vec3(0.08, 0.07, 0.08), smoothstep(0.0, 0.5, vU.y)); gl_FragColor = vec4(c, a); }" });
    const smokes = [[1300, 3200], [700, 3600], [1900, 3000]].map(([x, z]) => M(new T.PlaneGeometry(420, 900), smokeM, { x, y: 420, z, cast: false, receive: false }, townG));

    // ---------------------------------------------------------------- red eyes in the streets (B) + the queue of silhouettes round the building (Q)
    const eyeG = sph(0.08, 8, 6), eyeM = glow("#ff2412", 16, { fog: false }), eyeMd = glow("#ff2412", 16, { fog: false });
    const NSTREET = 220, street = [];
    { const R = rng(4242); for (let i = 0; i < NSTREET; i++) { const r = R(); let x, z; if (r < 0.35) { x = -200 + R() * 260; z = 140 + R() * 18; } else if (r < 0.65) { x = -136 + (R() - 0.5) * 12; z = -140 + R() * 290; } else if (r < 0.85) { x = -112 + R() * 30; z = 10 + R() * 120; } else { x = -100 + R() * 160; z = -100 - R() * 30; } street.push({ x, z, ph: R() * 10, ap: R() }); } }
    // the queue: from the doors east along the apron, round the corner and down the side wall, then on round the back
    const qpath = [[-3.5, 10.5], [-60, 10.5], [-64.5, 7.5], [-65.4, -40], [-65.4, -95], [-62, -96.4], [10, -96.4]];
    const qlen = []; let qL = 0; for (let i = 0; i < qpath.length - 1; i++) { const d = Math.hypot(qpath[i + 1][0] - qpath[i][0], qpath[i + 1][1] - qpath[i][1]); qlen.push(d); qL += d; }
    const NQ = 520, queue = [];
    { const R = rng(5150); for (let i = 0; i < NQ; i++) queue.push({ s: (i / NQ) * qL * 1.0, side: (R() - 0.5) * 1.2, h: 1.55 + R() * 0.25, ph: R() * 10, lean: (R() - 0.5) * 0.15 }); }
    function qAt(s) { let k = 0; while (k < qlen.length - 1 && s > qlen[k]) { s -= qlen[k]; k++; } const a = qpath[k], b = qpath[k + 1], u = clamp(s / qlen[k], 0, 1); const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), -dz / l, dx / l]; }
    const bodyG = new T.CapsuleGeometry(0.22, 1.0, 4, 8); bodyG.translate(0, 0.72, 0);
    const bodies = new T.InstancedMesh(bodyG, mat("#0b0b0d", { rough: 0.9 }), NQ); bodies.frustumCulled = false; bodies.castShadow = true; scene.add(bodies);
    const eyesQ = new T.InstancedMesh(eyeG, eyeM, NQ * 2); eyesQ.frustumCulled = false; scene.add(eyesQ);
    const eyesS = new T.InstancedMesh(eyeG, eyeMd, NSTREET * 2); eyesS.frustumCulled = false; scene.add(eyesS);

    // ---------------------------------------------------------------- the scooter under the lot light
    const scoot = G({ x: SCOOT[0], z: SCOOT[2], ry: -35 }, outside);
    {
      const body = mat("#6fb8a8", { rough: 0.35, metal: 0.1 }), dk = mat("#1c1d1f", { rough: 0.6 }), chrome = mat("#cfd3d8", { metal: 0.45, rough: 0.2 });
      for (const z of [-0.62, 0.62]) { M(new T.TorusGeometry(0.2, 0.07, 10, 22), dk, { y: 0.27, z, ry: 90 }, scoot); M(cyl(0.11, 0.11, 0.1, 14), chrome, { y: 0.27, z, rz: 90 }, scoot); }
      M(rbox(0.42, 0.36, 1.05, 0.14), body, { y: 0.52, z: -0.2 }, scoot);                 // rear body
      M(rbox(0.36, 0.1, 0.7, 0.05), dk, { y: 0.78, z: -0.28 }, scoot);                    // seat
      M(rbox(0.3, 0.08, 0.5, 0.04), body, { y: 0.32, z: 0.22 }, scoot);                   // floorboard
      M(rbox(0.4, 0.72, 0.12, 0.08), body, { y: 0.78, z: 0.5, rx: -14 }, scoot);          // leg shield
      K.rod([0, 0.5, 0.62], [0, 1.12, 0.48], 0.03, chrome, scoot, 8);
      M(box(0.62, 0.05, 0.05), dk, { y: 1.13, z: 0.48 }, scoot);
      M(cyl(0.07, 0.08, 0.06, 16), chrome, { y: 1.08, z: 0.58, rx: 80 }, scoot);
      M(new T.CircleGeometry(0.06, 16), glow("#fff6e0", 1.2), { y: 1.08, z: 0.615, rx: -10, cast: false }, scoot);
      M(box(0.18, 0.06, 0.04), glow("#ff3a2a", 1.5), { y: 0.66, z: -0.74, cast: false }, scoot);
      M(cyl(0.02, 0.02, 0.32, 6), dk, { x: 0.12, y: 0.16, z: -0.15, rx: 30 }, scoot);   // kickstand
    }
    scoot.rotation.z = 0.06;

    // ---------------------------------------------------------------- per-frame state
    const tvState = { key: "" };
    function drawTV(t, k) {
      const key = (Math.floor(t * 8) / 8).toFixed(3) + "|" + k.toFixed(2);
      if (key === tvState.key) return; tvState.key = key;
      const q = tvCv.getContext("2d"), w = TV_CW, h = TV_CH;
      const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#14305a"); gr.addColorStop(1, "#0a1424"); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      // a generic studio: a desk silhouette, a map-like panel, a LIVE bug, a headline band and a scrolling ticker
      q.fillStyle = "#1f4f8a"; q.fillRect(560, 70, 400, 280); q.strokeStyle = "rgba(255,255,255,0.25)"; q.lineWidth = 3; for (let i = 0; i < 6; i++) { q.beginPath(); q.moveTo(560, 100 + i * 45); q.bezierCurveTo(660, 80 + i * 47, 820, 130 + i * 40, 960, 95 + i * 46); q.stroke(); }
      q.fillStyle = "#e9a03a"; q.beginPath(); q.arc(760 + Math.sin(t) * 6, 210, 16, 0, 7); q.fill();
      q.fillStyle = "#2a3d5c"; q.beginPath(); q.ellipse(250, 330, 120, 150, 0, 0, 7); q.fill(); q.fillStyle = "#3a4f70"; q.beginPath(); q.arc(250, 160, 58, 0, 7); q.fill();
      q.fillStyle = "#c8261e"; q.fillRect(30, 300, 210, 50); q.fillStyle = "#fff"; q.font = "700 38px KitOswald, sans-serif"; q.fillText("BREAKING", 48, 340);
      q.fillStyle = "#f4f4f2"; q.fillRect(0, 350, w, 150); q.fillStyle = "#101010"; q.font = "700 64px KitOswald, sans-serif";
      q.fillText("FIRE LOOKOUT IN SILVER FORK", 34, 418); q.fillText("STILL NOT RESPONDING", 34, 486);
      q.fillStyle = "#d8322a"; q.fillRect(30, 22, 110, 44); q.fillStyle = "#fff"; q.font = "700 34px KitOswald, sans-serif"; q.fillText("LIVE", 52, 56);
      q.fillStyle = "#f3c443"; q.fillRect(0, 500, w, 76); q.fillStyle = "#101010"; q.fillRect(0, 500, 150, 76); q.fillStyle = "#f3c443"; q.font = "700 36px KitOswald, sans-serif"; q.fillText("NEWS", 30, 552);
      q.save(); q.beginPath(); q.rect(150, 500, w - 150, 76); q.clip(); q.fillStyle = "#101010"; q.font = "700 40px KitOswald, sans-serif";
      const tick = "OUTBREAK SPREADS   •   ROADS OUT OF TOWN JAMMED   •   STAY INDOORS   •   ";
      const tw = q.measureText(tick).width, x0 = 160 - ((t * 70) % tw);
      q.fillText(tick, x0, 552); q.fillText(tick, x0 + tw, 552); q.restore();
      if (k < 0.99) { q.fillStyle = `rgba(0,0,0,${1 - k})`; q.fillRect(0, 0, w, h); }
      tvT.needsUpdate = true;
    }
    const dirTmp = new T.Vector3();
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      scene.environment = I("envIn", 0) > 0.5 ? envIn : envOut;
      // interior key light, centred on what the camera sees
      const ri = I("roofI", 0); roofL.intensity = ri; roofL.shadow.autoUpdate = ri > 0.001; if (ri > 0.001) roofL.shadow.needsUpdate = true;
      const rc = st.roofAt || [cam.position.x, 0, cam.position.z - 8];
      roofL.target.position.set(rc[0], 0, rc[2]); roofL.position.copy(ROOF_DIR).multiplyScalar(30).add(roofL.target.position); roofL.target.updateMatrixWorld();
      const lk = I("lampsK", 1); lampGlowM.color.set("#eef3ff").multiplyScalar(7 * lk); coneM.uniforms.k.value = I("coneK", 0.05) * lk;
      const lot = I("lotI", 1); lotL.forEach((L, i) => (L.intensity = 520 * lot * (i === 0 ? 1.0 : 0.8))); lotHead.color.set("#f4f1ea").multiplyScalar(9 * Math.max(0.15, lot)); lotPoolM.color.set("#ffe8c8").multiplyScalar(0.3 * lot);
      const vi = I("vestI", 1); vestL.intensity = 60 * vi; canL.intensity = 160 * vi; packL.intensity = 40 * I("packI", 1); sideL.intensity = 60 * I("sideI", 0);
      const bi = I("bannerI", 1); banL.forEach((L) => (L.intensity = 330 * bi)); bannerM.emissive.setScalar(0.05 + 0.1 * bi);
      standL.intensity = 70 * I("standI", 1); tpL.intensity = 380 * I("tpI", 1); waterL.intensity = 260 * I("waterI", 1); kaleL.intensity = 90 * I("kaleI", 1); dockL.intensity = 90 * I("dockI", 1); roofTop.emissiveIntensity = I("roofGlow", 0);
      const tvk = I("tvI", 1), fl = I("tvFlick", 1);
      drawTV(t, clamp(fl, 0, 1)); drawDemo(t); tvScreens.forEach((s) => s.material.color.setScalar(1.5 * tvk)); bigS.material.color.setScalar(1.6 * tvk);
      tvL.forEach((L) => (L.intensity = 14 * tvk * fl * (0.9 + 0.1 * Math.sin(t * 5.3))));
      const bl = I("bedI", 0); bedL.intensity = 1.6 * bl; bedGlobe.material.color.set("#ffd9a0").multiplyScalar(4 * clamp(bl, 0.05, 2));
      flashL.intensity = 260 * I("flash3", 0);
      // forklift lift + spot
      const fk = I("fork", 0); carriage.position.y = 0.0 + fk * 2.95; forkLoad.visible = I("forkPal", 1) > 0.5; forkSpot.intensity = 30 * I("forkI", 0);
      // sample cups: st.cups empties shown (0..4); the full ones go as he takes them
      const cu = Math.round(I("cups", 4)); emptyCups.forEach((c, k) => (c.visible = k < cu)); fullCups.forEach((c, k) => (c.visible = k < 9 - cu));
      // shutters
      const sh = st.shutter || [0, 0, 0];
      shutters.forEach((s, i) => { const d = clamp(sh[i] || 0, 0, 1); s.mesh.scale.y = Math.max(0.001, d); s.mesh.position.y = 4.6 - (4.6 * d) / 2; s.bar.position.y = 4.6 - 4.6 * d + 0.04; });
      // key + screen
      keyG.rotation.z = -(I("keyA", 0)) * D2R;
      const ds = st.doorScr || "auto"; drawScreen(ds); panelL.intensity = I("panelI", 0.25); panelL.color.set(ds === "count" ? "#ff5a3c" : "#7dffa8");
      scr.material.color.setScalar((ds === "count" ? 1.9 : 1.4) * I("scrI", 1)); { const sS = I("scrS", 1); scr.scale.set(sS, sS, 1); bez.scale.set(sS, sS, 1); kp.scale.setScalar(I("kpS", 1)); }
      dim.visible = I("dimK", 0) > 0.01; dimLab.material.opacity = I("dimK", 0);
      // highway + town
      const ck = I("carsK", 0); heads2.visible = tails.visible = ck > 0.01;
      if (ck > 0.01) {
        const dir = dirTmp.copy(HW1).sub(HW0), len = dir.length(); dir.normalize(); const nx = -dir.z, nz = dir.x;
        carsD.forEach((c, i) => {
          const u = (c.off + t * c.sp * 0.6) % 1, s = u * len;
          const x = HW0.x + dir.x * s + nx * c.lane, z = HW0.z + dir.z * s + nz * c.lane;
          for (let q = 0; q < 2; q++) { const sd = q ? 0.85 : -0.85; dmy.position.set(x + nx * sd, 7.0 + s * 0.022, z + nz * sd); dmy.lookAt(cam.position); dmy.scale.setScalar(0.35 + 0.00055 * Math.hypot(x - cam.position.x, z - cam.position.z)); dmy.updateMatrix(); heads2.setMatrixAt(i * 2 + q, dmy.matrix); }
          const u2 = (c.jam + t * c.sp * 0.25) % 1, s2 = u2 * len;
          const x2 = HW0.x + dir.x * s2 - nx * (4.5 + (c.lane + 6) * 0.5), z2 = HW0.z + dir.z * s2 - nz * (4.5 + (c.lane + 6) * 0.5);
          for (let q = 0; q < 2; q++) { const sd = q ? 0.8 : -0.8; dmy.position.set(x2 + nx * sd, 7.0 + s2 * 0.022, z2 + nz * sd); dmy.lookAt(cam.position); dmy.scale.setScalar(0.3 + 0.00045 * Math.hypot(x2 - cam.position.x, z2 - cam.position.z)); dmy.updateMatrix(); tails.setMatrixAt(i * 2 + q, dmy.matrix); }
        });
        heads2.instanceMatrix.needsUpdate = true; tails.instanceMatrix.needsUpdate = true;
      }
      townG.visible = I("townK", 1) > 0.01; smokeM.uniforms.t.value = t; smokes.forEach((s) => s.lookAt(cam.position.x, s.position.y, cam.position.z)); fireGlows.forEach((g) => g.lookAt(cam.position));
      // eyes in the streets
      const ek = I("eyesK", 0), ei = I("eyesI", 1), es = I("eyesScale", 1);
      eyeMd.color.set("#ff2412").multiplyScalar(16 * ei);
      eyesS.visible = ek > 0.01;
      if (eyesS.visible) { street.forEach((e, i) => { const on = ek > e.ap; for (let j = 0; j < 2; j++) { dmy.position.set(e.x + (j ? 0.07 : -0.07) * es, 1.62, e.z); dmy.scale.setScalar(on ? es : 0.0001); dmy.updateMatrix(); eyesS.setMatrixAt(i * 2 + j, dmy.matrix); } }); eyesS.instanceMatrix.needsUpdate = true; }
      // the queue
      const qk = I("queueK", 0); bodies.visible = eyesQ.visible = qk > 0.001;
      if (bodies.visible) {
        const qs = I("queueScale", 1), blink = I("eyesBlink", 0);
        queue.forEach((p, i) => {
          const on = i / NQ < qk; const [x, z, nx, nz] = qAt(p.s); const px = x + nx * p.side, pz = z + nz * p.side;
          dmy.position.set(px, 0.15, pz); dmy.rotation.set(p.lean, Math.atan2(nx, nz), 0); dmy.scale.set(on ? 1 : 0.0001, on ? p.h / 1.7 : 0.0001, on ? 1 : 0.0001); dmy.updateMatrix(); bodies.setMatrixAt(i, dmy.matrix);
          const bl2 = blink > 0 && Math.sin(t * 1.1 + p.ph) > 0.97;
          for (let j = 0; j < 2; j++) { dmy.position.set(px + (j ? 0.06 : -0.06) * qs * nx * 0 + (j ? 0.06 : -0.06) * qs, 0.15 + p.h * 0.93, pz); dmy.rotation.set(0, 0, 0); dmy.scale.setScalar(on && !bl2 ? qs : 0.0001); dmy.updateMatrix(); eyesQ.setMatrixAt(i * 2 + j, dmy.matrix); }
        });
        bodies.instanceMatrix.needsUpdate = true; eyesQ.instanceMatrix.needsUpdate = true;
        eyeM.color.set("#ff2412").multiplyScalar(16 * I("queueEyeI", 1));
      }
      // fog colour: warm-grey haze inside, night blue outside
      scene.fog.color.set(I("envIn", 0) > 0.5 ? "#3a3c42" : "#2a3045");
    });

    return { store, outside, portal, banner, fork, stand, gond, tvs, big, bed, kale, dock, shutters, scoot, roofL, lotL, banL,
      P: { X0, X1, Z0, ZF, WH, WH2, WT, PORT, DOOR, RUNS, RZ0, RZ1, BAY, RD, LEVELS, LOT, POLES, SCOOT, FORK, SAMPLE, GOND, TVW, BED, TP, WATER, KALE, DOCK, PANEL, HW0, HW1 } };
  }

  // ---------------------------------------------------------------- Dario: the series' first male lead (batch-7 rig options + a re-dress)
  const DARIO = {
    build: "male", skin: "#9e8260", skinSheen: "#b39c80", earIn: "#7a5a40", lip: "#8a604c", iris: [[92, 60, 36], [44, 28, 16]],
    face: { w: 0.94, len: 1.16, jaw: 0.07, jawW: 0.09, chin: 0.12, cheek: 0.0, eyeX: 0.034, eyeY: 0.0105, eyeS: 0.84, lid: 10, lowLid: 4,
      nose: 1.12, noseW: 1.06, noseL: 1.16, browT: 1.55, browY: -0.006, browArch: 0.35, browIn: 0.0015, lipW: 1.06, lipT: 0.82, lipY: -0.001, lipLo: 0.000216 },
    hairStyle: "short", hair: "#1f1712", hairStreaks: ["rgba(8,5,3,0.45)", "rgba(52,38,28,0.35)", "rgba(84,64,48,0.25)"], hairSheen: "#3a2f28",
    brow: "#1b120c", stubble: 0.8, pony: false, fringe: false,
    jacket: "#3a3f47", jacketSheen: "#7d8694", jacketRough: 0.86, trim: "#2b2f35", trimSheen: "#6c7480", seam: "#2b2f35",
    pants: "#34435e", pantsSheen: "#7f90b0", boot: "#2b2d31", sole: "#e4e1da", under: "#8c939c", chestPocket: false, handPockets: false,
  };
  function dressDario(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, sp = hz.spine, surf = hz.surf;
    // the hood down on his back
    // (render 3) folded flat on his back below the collar, with a rim, so nothing rises beside the jaw (it read as long hair)
    const hoodG = new T.SphereGeometry(0.13, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.5); hoodG.scale(0.95, 0.22, 0.85);
    M(hoodG, hz.mats.jacket, { y: 0.34, z: -0.112, rx: -100 }, sp);
    M(new T.TorusGeometry(0.13, 0.008, 6, 40), hz.mats.trim, { y: 0.34, z: -0.112, rx: -10, sx: 0.95, sy: 0.85, cast: false }, sp);
    // (render 3) the jacket's stand collar rose beside his jaw and read as long hair: lower it to a hoodie neckline
    sp.children.forEach((o) => {
      const g = o.geometry, pr = g && g.parameters;
      if (!o.isMesh || !pr) return;
      if (g.type === "CylinderGeometry" && pr.openEnded && Math.abs(pr.thetaLength - (296 * Math.PI) / 180) < 1e-3) { o.scale.y = 0.4; o.position.y = 0.548; }
      if (g.type === "TorusGeometry" && Math.abs(pr.arc - (296 * Math.PI) / 180) < 1e-3) o.position.y = 0.563;
    });
    hz.mats.browM.roughness = 1; hz.mats.browM.envMapIntensity = 0.1; if ('specularIntensity' in hz.mats.browM) hz.mats.browM.specularIntensity = 0.15; if ('sheen' in hz.mats.browM) hz.mats.browM.sheen = 0;   // no cool glint on the brows
    // hoodie drawstrings
    for (const s of [-1, 1]) K.rod([s * 0.03, 0.56, hz.frontZ(0.56) + 0.01], [s * 0.034, 0.42, hz.frontZ(0.42) + 0.02], 0.004, mat("#e8e6e0", { rough: 0.8 }), sp, 6);
    // a hi-vis work vest: front + back panels on the torso surface (arm holes), reflective bands, a name badge
    const vestM = K.pmat("#c9dc3a", { rough: 0.7, sheen: 0.6, sheenColor: "#f2ff9a", normalMap: K.nmap(K.normals().weave, 10, 10), ns: 0.25 });
    vestM.emissive = new T.Color("#2a3000"); vestM.side = T.DoubleSide;
    function panelGeo(y0, y1, mask, out) {
      const pos = [], idx = [], NY = 70, NA = 200, id = [];
      for (let j = 0; j <= NY; j++) { const y = lerp(y0, y1, j / NY); id.push([]); for (let i = 0; i <= NA; i++) { const a = -Math.PI + (i / NA) * Math.PI * 2; const p = surf(y, a, out); id[j].push(pos.length / 3); pos.push(p[0], p[1], p[2]); } }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NA; i++) { const y = lerp(y0, y1, (j + 0.5) / NY), a = -Math.PI + ((i + 0.5) / NA) * Math.PI * 2; if (!mask(y, a)) continue; const A = id[j][i], B = id[j][i + 1], C = id[j + 1][i], D = id[j + 1][i + 1]; idx.push(A, C, B, B, C, D); }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const uv = []; for (let k = 0; k < pos.length / 3; k++) uv.push(pos[k * 3] * 4, pos[k * 3 + 1] * 4); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      return g;
    }
    const vmask = (y, a) => {
      const A = Math.abs(a);
      if (y > 0.485) return false;
      if (y > 0.26 && A < (y - 0.26) * 2.6) return false;             // V-neck at the front
      if (y < 0.16) return true;                                       // full ring below the arm holes
      if (y < 0.44) return !(A > 1.12 && A < 2.02);                    // arm holes at the sides
      return A > 0.5 && A < 2.62;                                      // over the shoulders
    };
    M(panelGeo(-0.06, 0.5, vmask, 1.045), vestM, { cast: true }, sp);
    const refl = K.pmat("#d8dde2", { rough: 0.25, metal: 0.35, cc: 1, ccRough: 0.1 });
    for (const y of [0.02, 0.12]) { const pts = []; for (let a = -3.1; a <= 3.1; a += 0.08) pts.push(surf(y, a, 1.06)); M(K.tubeGeo(pts, 90, 4, () => 0.012, { squash: () => 0.25 }), refl, { cast: false }, sp); }
    for (const s of [-1, 1]) { const pts = []; for (let y = 0.0; y <= 0.46; y += 0.03) pts.push(surf(y, s * 0.62, 1.06)); M(K.tubeGeo(pts, 24, 4, () => 0.011, { squash: () => 0.25 }), refl, { cast: false }, sp); }
    // name badge on his left chest (no store name)
    const bp = surf(0.3, 0.5, 1.075);
    const bdT = K.textTex("dario_badge", 256, 128, (q, w, h) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, w, h); q.fillStyle = "#2a2f38"; q.fillRect(0, 0, w, 26); q.fillStyle = "#ffffff"; q.font = "700 20px KitInter, sans-serif"; q.textAlign = "center"; q.fillText("NIGHT CREW", w / 2, 19); q.fillStyle = "#14161a"; q.font = "700 64px KitOswald, sans-serif"; q.fillText("DARIO", w / 2, 102); });
    const badge = G({ x: bp[0], y: bp[1], z: bp[2], ry: 24 }, sp);
    M(K.rbox(0.07, 0.036, 0.004, 0.004), mat("#ffffff", { rough: 0.4 }), {}, badge);
    M(new T.PlaneGeometry(0.068, 0.034), mat("#ffffff", { map: bdT, rough: 0.4 }), { z: 0.0035, cast: false }, badge);
    // stubble (render 3): fine dark dots over the beard area, a layer just above the skin, so it reads dark brown-black in any light
    { const headMesh = hz.head.children.find((o) => o.isMesh && o.geometry && o.geometry.type === "SphereGeometry" && o.geometry.parameters && o.geometry.parameters.radius === 0.1);
      if (headMesh) {
        const sT = K.canvasTex("dario_stubble", 512, 256, (q, W, H) => {
          const im = q.createImageData(W, H), Rn = K.rng(77);
          for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
            const u = i / W, th = (j / H) * Math.PI, phi = u * Math.PI * 2;      // canvas row 0 = the top of the sphere
            const x = -Math.cos(phi) * Math.sin(th), y = Math.cos(th), z = Math.sin(phi) * Math.sin(th);   // unit-sphere point (front = +z)
            const lips = Math.exp(-Math.pow(x / 0.22, 2) - Math.pow((y + 0.41) / 0.07, 2));
            const area = (z > 0.12 ? 1 : 0) * sstep(-0.19, -0.38, y) * (1 - sstep(0.7, 0.86, Math.abs(x)) * sstep(-0.75, -0.4, y)) * (1 - lips) * (1 - sstep(-0.88, -0.98, y));
            const a = Math.round(255 * Math.min(1, area * (Rn() < 0.5 ? 0.8 : 0.22)));
            const p = (j * W + i) * 4; im.data[p] = im.data[p + 1] = im.data[p + 2] = a; im.data[p + 3] = 255;
          }
          q.putImageData(im, 0, 0);
        });
        sT.colorSpace = T.NoColorSpace;
        const sm = new T.MeshStandardMaterial({ color: "#17110d", roughness: 0.95, transparent: true, alphaMap: sT, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        const sMesh = new T.Mesh(headMesh.geometry, sm); sMesh.position.copy(headMesh.position); sMesh.scale.setScalar(1.003); sMesh.renderOrder = 2; hz.head.add(sMesh);
      } }
    // one earbud in his right ear (st.bud via setBud), and a copy in his hand once pulled out
    const budM = K.pmat("#f4f4f2", { rough: 0.25, cc: 1, ccRough: 0.1 });
    const bud = G({ x: -0.092, y: -0.004, z: -0.004 }, hz.face);
    M(K.sph(0.0075, 12, 10), budM, { cast: false }, bud); M(K.cyl(0.0028, 0.0028, 0.022, 8), budM, { y: -0.014, z: 0.004, rx: 12, cast: false }, bud);
    const budHand = new T.Group(); M(K.sph(0.0085, 12, 10), budM, { cast: false }, budHand); M(K.cyl(0.003, 0.003, 0.024, 8), budM, { y: -0.015, cast: false }, budHand); budHand.position.set(0.0, -0.105, 0.03); hz.tool("bud", budHand, 0);
    // hand tools: phone (right), pen (right), notebook (left), a kale bunch (right), a sample cup (right)
    const phT = K.textTex("dario_phone", 256, 512, (q, w, h) => {
      q.fillStyle = "#101216"; q.fillRect(0, 0, w, h);
      q.fillStyle = "#8a93a0"; q.font = "500 22px KitInter, sans-serif"; q.textAlign = "center"; q.fillText("incoming call", w / 2, 150);
      q.fillStyle = "#ffffff"; q.font = "700 52px KitOswald, sans-serif"; q.fillText("MANAGER", w / 2, 212);
      q.fillStyle = "#3a3f48"; q.beginPath(); q.arc(w / 2, 300, 46, 0, 7); q.fill(); q.fillStyle = "#c9ced6"; q.font = "700 44px KitOswald, sans-serif"; q.fillText("M", w / 2, 316);
      q.fillStyle = "#2f8f56"; q.fillRect(28, 410, 92, 54); q.fillStyle = "#8f3a32"; q.fillRect(w - 120, 410, 92, 54);
      q.fillStyle = "#fff"; q.font = "600 20px KitInter, sans-serif"; q.fillText("ANSWER", 74, 444); q.fillText("DECLINE", w - 74, 444);
    });
    const phone = new T.Group();
    M(K.rbox(0.072, 0.15, 0.009, 0.01), mat("#1a1b1e", { rough: 0.3, metal: 0.3 }), {}, phone);
    const phScr = M(new T.PlaneGeometry(0.064, 0.138), new T.MeshBasicMaterial({ map: phT, color: new T.Color(1.3, 1.3, 1.3) }), { z: 0.0052, cast: false }, phone);
    phone.position.set(0.0, -0.1, 0.03); phone.rotation.set(-1.2, 0, 0); hz.tool("phone", phone, 0);
    const phoneEar = new T.Group(); M(K.rbox(0.072, 0.15, 0.009, 0.01), mat("#1a1b1e", { rough: 0.3, metal: 0.3 }), {}, phoneEar); phoneEar.position.set(0.0, -0.1, 0.02); phoneEar.rotation.set(-0.2, 1.5, 0); hz.tool("phoneEar", phoneEar, 0);
    const pen = new T.Group(); M(K.cyl(0.004, 0.004, 0.13, 8), mat("#1a1a1a", { rough: 0.4 }), { rx: 90, z: 0.03 }, pen); pen.position.set(0, -0.075, 0.02); hz.tool("pen", pen, 0);
    const nbT = K.textTex("dario_plan", 256, 192, (q, w, h) => { q.fillStyle = "#f4efe2"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,80,140,0.35)"; for (let y = 22; y < h; y += 14) q.fillRect(10, y, w - 20, 1); q.fillStyle = "#1c2036"; q.font = "600 15px KitInter, sans-serif"; ["PLAN", "shelter  ✓", "food  ✓", "65\" TV  ✓"].forEach((s, i) => q.fillText(s, 16, 36 + i * 28)); });
    const nb = new T.Group(); M(K.box(0.2, 0.004, 0.15), mat("#ffffff", { map: nbT, rough: 0.9 }), {}, nb); M(K.box(0.205, 0.006, 0.155), mat("#7a2a24", { rough: 0.7 }), { y: -0.004 }, nb); nb.position.set(0.0, -0.12, 0.05); nb.rotation.set(1.45, 0, 0.25); hz.tool("notebook", nb, 1);
    const kaleT = new T.Group(); { const g = new T.SphereGeometry(0.07, 14, 10); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const n = 1 + 0.2 * Math.sin(x * 110) * Math.sin(z * 90); pa.setXYZ(i, x * n, y * n * 1.6, z * n); } g.computeVertexNormals(); M(g, mat("#24542e", { rough: 0.55 }), { y: -0.12 }, kaleT); M(K.cyl(0.008, 0.01, 0.08, 6), mat("#8aa86a", { rough: 0.6 }), { y: -0.03 }, kaleT); } kaleT.position.set(0, -0.06, 0.02); hz.tool("kale", kaleT, 0);
    const cup = new T.Group(); M(new T.CylinderGeometry(0.024, 0.018, 0.045, 12, 1, true), mat("#fbfbf6", { rough: 0.6, side: T.DoubleSide }), {}, cup); cup.position.set(0.0, -0.085, 0.03); hz.tool("cup", cup, 0);
    const key = new T.Group(); M(K.box(0.02, 0.06, 0.01), mat("#c9cdd2", { metal: 0.7, rough: 0.25 }), {}, key); key.position.set(0, -0.09, 0.04); hz.tool("key", key, 0);
    // poses (degrees): arms [shoulder x, shoulder z, elbow x] right / left; legs [hip x, knee x]
    Object.assign(hz.POSES, {
      drive: { arms: [[-52, 10, -46], [-48, -12, -50]], legs: [[-86, 84], [-80, 78]], hipY: 0.6, spine: [4, 0], curl: [80, 80] },
      lever: { arms: [[-40, 18, -60], [-48, -12, -50]], legs: [[-86, 84], [-80, 78]], hipY: 0.6, spine: [2, 0], curl: [85, 80] },
      face: { arms: [[-64, 12, -26], [-58, -10, -30]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [16, 0], curl: [20, 20] },
      sample: { arms: [[-42, 14, -122], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [70, 30] },
      reach: { arms: [[-46, 6, -30], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [12, 0], curl: [60, 30] },
      earbud: { arms: [[-30, 46, -128], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [75, 30] },
      budout: { arms: [[-36, 22, -84], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [70, 30] },
      phone: { arms: [[-36, 14, -96], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [72, 30] },
      call: { arms: [[-26, 36, -140], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [80, 30] },
      turnkey: { arms: [[-84, 12, -22], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [65, 30] },
      hold: { arms: [[-34, 12, -76], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [80, 30] },
      drop: { arms: [[-30, 10, -40], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [20, 30] },
      cot: { arms: [[-46, 14, -54], [-40, -12, -52]], legs: [[-82, 92], [-76, 86]], hipY: 0.45, spine: [16, 0], curl: [70, 45] },
      glass: { arms: [[4, -7, -10], [-30, -24, -60]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-2, 0], curl: [30, 60] },
    });
    return { bud, budHand, phone, phScr, badge, setBud(inEar) { bud.visible = !!inEar; } };
  }

  S.warehouse = warehouse;
  S.warehouse.CREATE = CREATE;
  S.warehouse.DARIO = DARIO;
  S.warehouse.dressDario = dressDario;
})();
