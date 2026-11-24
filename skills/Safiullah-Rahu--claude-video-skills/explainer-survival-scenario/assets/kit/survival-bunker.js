/* Survival-scenario kit · world module "The Doomsday Bunker" (needs survival-kit.js v2.2).
 * A mountain at night with a round blast door set into the rock, ringed with white light, a helipad on a shelf above a
 * sea of cloud; inside, a billionaire's luxury bunker: an atrium under a fake LED sky (pool, rock wall with a waterfall,
 * lemon tree, koi pond, galleries, cinema entrance, the owner's faceless portrait, a wall tablet), and small sets for the
 * kitchen, cinema, pantry, indoor lake, wine cellar and plant room. Caretaker Grace is a batch-7 re-dress of the rig.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.bunker.CREATE));
 *   const Bk = SURVIVAL.bunker(K);
 *   const hz = K.hazel(SURVIVAL.bunker.GRACE); const grace = SURVIVAL.bunker.dressGrace(K, hz);
 *   K.render({ …kit state…, rig, envIn, skyI, skyK, skyGlitch, ringK, ringChase, tabScr, keyScr, feed, jetK, jetT,
 *              eyesK, eyesGather, eyesBlink, eyesI, dimK, robe, cineK, fallK })
 *
 * Exterior (metres): the cliff face is the plane z 0 (facing +z), the door centre DC (0, 3.2, 0), radius 3.0; the shelf
 * (apron) |x| < 32, 0 < z < 52 at y 0, the helipad centred (0, 0, 30); the summit rises to the north (-z).
 * Interior (moon off): tunnel z 0..-7.6; atrium centre AC (0, 0, -30), radius 14; other rooms far off to the sides.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  // the moon behind the camera's right shoulder in the hero shot, so the cliff and the snow peak catch it
  const MOON = (() => { const az = 8 * D2R, el = 33 * D2R; return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();
  const CREATE = {
    moonDir: MOON, moonCol: "#b8c8ff", bg: "#04060c", fogCol: "#24304e", hemi: ["#46558a", "#1e2226"],
    shadow: { half: 70, far: 700, dist: 340, center: [0, 10, 0] },
    sky: { zen: [0.005, 0.01, 0.03], hor: [0.05, 0.07, 0.13] },
    env: { zen: "#0a1430", hor: "#22325a", mside: "#5a6ea8", gnd: "#06080b" },
  };
  const DC = [0, 3.2, 0], DR = 3.0, DTH = 1.0;
  const AC = [0, 0, -30], AR = 14, G1 = 4.6, G2 = 9.2, DOME = 13.8;
  const POOL = { x0: -5, x1: 5, z0: -35.8, z1: -31.4, y: -0.08 };
  const LOUNGE = [[-2.1, 0, -27.4], [2.1, 0, -27.4]];
  const TABLET = [2.0, 1.48, -23.56];
  const LEMON = [7.2, 0, -26.0], KOI = [-7.4, 0, -25.6];
  const KIT = [42, 0, -30], CIN = [-42, 0, -30], PAN = [76, 0, -30], CEL = [-76, 0, -30], PLT = [110, 0, -30], LAKE = [0, -3, -150];
  const HELI = [0, 0, 30];
  const atWall = (th, r, y) => [AC[0] + Math.cos(th * D2R) * r, y, AC[2] + Math.sin(th * D2R) * r];
  const PORTRAIT = atWall(150, AR - 0.12, 2.75), SIGN = atWall(32, AR - 0.12, 1.75), CINEMA_TH = 196;

  function bunker(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox;
    const rng = K.rng, hash2 = K.hash2, vnoise = K.vnoise, fbm = K.fbm;
    const dmy = new T.Object3D();
    function inst(geo, m, list, parent, p) {
      p = p || {};
      const im = new T.InstancedMesh(geo, m, Math.max(1, list.length));
      list.forEach((q, k) => { dmy.position.set(q[0], q[1], q[2]); dmy.rotation.set(q[7] || 0, q[6] || 0, q[8] || 0); dmy.scale.set(q[3] || 1, q[4] || 1, q[5] || 1); dmy.updateMatrix(); im.setMatrixAt(k, dmy.matrix); if (p.cols) im.setColorAt(k, p.cols[k]); });
      im.count = list.length; im.castShadow = p.cast !== false; im.receiveShadow = p.receive !== false; im.frustumCulled = false;
      (parent || scene).add(im); return im;
    }
    function speckle(g, w, h, seed, n, a, cols) { const R = rng(seed); for (let i = 0; i < n; i++) { g.globalAlpha = a * R(); g.fillStyle = cols[Math.floor(R() * cols.length)]; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 2); } g.globalAlpha = 1; }
    const radial = K.canvasTex("b_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.45)"); gr.addColorStop(0.7, "rgba(255,255,255,0.08)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const addGlow = (hex, k) => new T.MeshBasicMaterial({ map: radial, color: new T.Color(hex).multiplyScalar(k), transparent: true, depthWrite: false, blending: T.AdditiveBlending });

    K.buildSky();
    // ---------------------------------------------------------------- an interior environment (the LED sky above, warm stone round, pale floor)
    const envIn = (() => {
      const es = new T.Scene();
      const g = new T.SphereGeometry(10, 48, 24), pa = g.attributes.position, cols = [], c = new T.Color(), d = new T.Vector3();
      for (let i = 0; i < pa.count; i++) { d.set(pa.getX(i), pa.getY(i), pa.getZ(i)).normalize();
        if (d.y > 0.35) c.set("#7fb2ff").lerp(new T.Color("#d8ecff"), clamp(1 - d.y, 0, 1)).multiplyScalar(1.4);
        else if (d.y > -0.05) c.set("#c9a77a").lerp(new T.Color("#f0dcc0"), (d.y + 0.05) / 0.4).multiplyScalar(0.9);
        else c.set("#cfc6b6").multiplyScalar(0.55);
        cols.push(c.r, c.g, c.b); }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      const pm = new T.PMREMGenerator(K.renderer); const tex = pm.fromScene(es, 0.03).texture; pm.dispose(); return tex;
    })();
    const envOut = scene.environment;

    // ---------------------------------------------------------------- practical light pool (constant light count): 6 points, 2 spots
    const pts = [], spots = [];
    for (let i = 0; i < 6; i++) { const L = new T.PointLight("#ffffff", 0, 0, 2); scene.add(L); pts.push(L); }
    for (let i = 0; i < 3; i++) { const L = new T.SpotLight("#ffffff", 0, 0, 40 * D2R, 0.6, 1.4); scene.add(L, L.target); spots.push(L); }
    // the interior key: the LED sky's "sun", a directional light with its own shadow
    const skyL = new T.DirectionalLight("#ffd9a8", 0);
    skyL.castShadow = true; skyL.shadow.mapSize.set(2048, 2048); skyL.shadow.bias = -0.0006; skyL.shadow.normalBias = 0.04; skyL.shadow.radius = 3;
    { const c = skyL.shadow.camera; c.left = -18; c.right = 18; c.top = 18; c.bottom = -18; c.near = 1; c.far = 80; }
    scene.add(skyL, skyL.target);
    const SUN = new T.Vector3(0.42, 0.62, 0.6).normalize();

    // ---------------------------------------------------------------- terrain: far mountains (snow by height/slope), the near shelf, the cliff
    function mtn(x, z) {
      let h = 0;
      h += 640 * Math.exp(-(((x + 150) ** 2) + ((z + 1650) ** 2)) / (700 ** 2));
      h += 520 * Math.exp(-(((x - 1100) ** 2) + ((z + 1800) ** 2)) / (850 ** 2));
      h += 620 * Math.exp(-(((x + 1600) ** 2) + ((z + 1500) ** 2)) / (900 ** 2));
      h += 380 * Math.exp(-(((x - 2300) ** 2) + ((z + 3300) ** 2)) / (1200 ** 2));
      const r = 1 - Math.abs(fbm(x / 520, z / 520, 7, 5) * 2 - 1);                  // ridged detail
      h += 120 * r * r * clamp(-z / 900, 0.1, 1) + 30 * fbm(x / 90, z / 90, 9, 3);
      return h;
    }
    // (render 3) the peak behind the door: a broad dark mass filling the hero's upper third, ridged so snow can sit
    // only on its ridges; it fades to nothing before the cliff (z > -60)
    const ridgeN = (x, z) => 1 - Math.abs(fbm(x / 230, z / 230, 31, 5) * 2 - 1);
    // spurs radiating from the summit (seven, wandering); |sin| keeps the angle seam invisible
    const spurN = (x, z) => 1 - Math.abs(Math.sin(3.5 * Math.atan2(z + 700, x + 60) + 7 * (fbm(x / 320, z / 320, 34, 3) - 0.5)));
    function peak(x, z) {
      const dx = x + 60, dz = z + 700;
      const pk = (cx, cz, rx, rz, hh) => hh * Math.exp(-1.7 * Math.sqrt(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));   // pointed, not a dome
      let h = pk(-60, -700, 560, 460, 360) + pk(280, -900, 380, 340, 210) + pk(-440, -820, 360, 330, 190);
      const r = ridgeN(x, z), sp = spurN(x, z);
      h += (30 * r * r * r + 85 * Math.pow(sp, 3) * ss((Math.hypot(x + 60, z + 700) - 90) / 260)) * Math.min(1, h / 140) + 26 * fbm(x / 55, z / 55, 32, 3) * Math.min(1, h / 120);
      return h * clamp((-z - 60) / 260, 0, 1);
    }
    function shelfD(x, z) { const dx = Math.max(0, Math.abs(x) - 32), dz = Math.max(0, z - 52), dzb = Math.max(0, -z); return Math.hypot(dx, dz) + (z < 0 ? 0 : 0) + dzb * 0; }
    function nearH(x, z) {                       // the mountain behind the cliff, the shelf, the drop below the shelf
      if (z < -0.5) { const top = 13 + 6 * fbm(x / 30, 3.1, 4, 3) + Math.min(0.004 * x * x, 22); return Math.max(top + (-z) * 0.17 + 12 * fbm(x / 40, z / 40, 5, 3) * clamp(-z / 30, 0, 1), mtn(x, z) * clamp(-z / 1400, 0, 1), peak(x, z)); }
      const d = shelfD(x, z); if (d <= 0) return 0;
      return -(d * 0.85 + d * d * 0.004) + 6 * fbm(x / 30, z / 30, 6, 3) * clamp(d / 10, 0, 1);
    }
    const rockCol = K.canvasTex("b_rock", 512, 512, (g, w, h) => { g.fillStyle = "#77736c"; g.fillRect(0, 0, w, h); speckle(g, w, h, 3, 30000, 0.3, ["#5e5b56", "#8c8780", "#9a948b", "#4c4a46"]); const R = rng(4); for (let i = 0; i < 70; i++) { g.strokeStyle = "rgba(25,24,22,0.5)"; g.lineWidth = 1 + R() * 2; g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (R() - 0.5) * 50; y += R() * 30; g.lineTo(x, y); } g.stroke(); } }, { repeat: true });
    const graniteT = K.canvasTex("b_granite", 512, 512, (g, w, h) => { g.fillStyle = "#6c6966"; g.fillRect(0, 0, w, h); speckle(g, w, h, 61, 42000, 0.35, ["#4a4846", "#8a8580", "#5a5755", "#9a948e", "#3a3836"]);
      const R = rng(62); g.lineCap = "round"; for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(14,13,12,${0.35 + R() * 0.4})`; g.lineWidth = 0.8 + R() * 1.8; g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y); const vx = (R() - 0.5) * 0.6; for (let k = 0; k < 10; k++) { x += vx * 18 + (R() - 0.5) * 10; y += 8 + R() * 16; g.lineTo(x, y); } g.stroke(); } }, { repeat: true });
    const strataT = K.canvasTex("b_strata", 512, 512, (g, w, h) => { g.fillStyle = "#6a6764"; g.fillRect(0, 0, w, h);
      const R = rng(63); let y = 0; while (y < h) { const bh = 10 + R() * 34, v = 84 + Math.floor(R() * 40); g.fillStyle = `rgb(${v},${v - 3},${v - 7})`; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + y) * 2); for (let x = w; x >= 0; x -= 32) g.lineTo(x, y + bh + Math.sin(x * 0.02 + y + 1) * 2); g.fill(); g.globalAlpha = 0.6; g.fillStyle = "#2c2a28"; g.fillRect(0, y + bh - 1.5, w, 1.5); y += bh; } g.globalAlpha = 1;
      speckle(g, w, h, 64, 30000, 0.3, ["#4a4846", "#8a8580", "#3a3836", "#9a948e"]);
      g.lineCap = "round"; for (let i = 0; i < 34; i++) { g.strokeStyle = `rgba(12,11,10,${0.45 + R() * 0.4})`; g.lineWidth = 1 + R() * 2; g.beginPath(); let x = R() * w, yy = R() * h * 0.6; g.moveTo(x, yy); for (let k = 0; k < 9; k++) { x += (R() - 0.5) * 14; yy += 10 + R() * 20; g.lineTo(x, yy); } g.stroke(); } }, { repeat: true });
    const rockN = K.heightNormal("b_rockN", 256, (x, y) => fbm(x / 18, y / 18, 2, 4) * 0.8 + vnoise(x / 4, y / 4, 3) * 0.2, 5.0);
    const out = G({});
    function terrainMesh(size, seg, cx, cz, hf, sinkFn) {
      const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position, cols = [], c = new T.Color(), uv = g.attributes.uv;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + cx, z = pa.getZ(i) + cz; let y = hf(x, z); if (sinkFn) y -= sinkFn(x, z); pa.setXYZ(i, x, y, z); uv.setXY(i, x / 9, z / 9); }
      g.computeVertexNormals();
      const nr = g.attributes.normal;
      for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), ny = nr.getY(i), x = pa.getX(i), z = pa.getZ(i);
        const rN = Math.max(ridgeN(x, z) - 0.06, spurN(x, z) * (peak(x, z) > 60 ? 1 : 0));
        const snow = (z < -2 ? Math.max(clamp((y - 70) / 120, 0, 1) * ss((ny - 0.35) / 0.3) * ss((rN - 0.8) / 0.08), 0.8 * clamp((y - 16) / 20, 0, 1) * ss((ny - 0.88) / 0.07) * ss((fbm(x / 22, z / 22, 33, 2) - 0.6) / 0.08))
                                : 0.25 * ss((ny - 0.8) / 0.1) * clamp((y + 20) / 30, 0, 1)) + clamp((y - 400) / 200, 0, 1) * ss((ny - 0.3) / 0.3) * (0.12 + 0.88 * ss((rN - 0.86) / 0.08));
        c.set("#86827c").lerp(new T.Color("#5a5752"), clamp(fbm(x / 45, z / 45, 3, 3) * 1.6 - 0.3, 0, 1)).lerp(new T.Color("#ffffff"), clamp(snow, 0, 1));
        if (y < 1 && y > -1 && Math.abs(x) < 32 && z > 0) c.set("#8a8884");
        cols.push(c.r, c.g, c.b); }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      const m = new T.MeshStandardMaterial({ vertexColors: true, map: graniteT, normalMap: rockN, roughness: 0.9, envMapIntensity: 0.5 });
      m.normalScale.set(0.9, 0.9); rockN.repeat.set(1, 1);
      return M(g, m, { cast: true }, out);
    }
    const H = (x, z) => (z < -300 ? Math.max(mtn(x, z), nearH(x, z)) : nearH(x, z));
    terrainMesh(9000, 210, 0, -2000, H, (x, z) => (Math.abs(x) < 1260 && z > -1560 && z < 960 ? 30 : 0));      // far (43 m)
    terrainMesh(2600, 325, 0, -300, H, (x, z) => (Math.abs(x) < 292 && z > -392 && z < 192 ? 10 : 0));         // mid (8 m)
    terrainMesh(600, 300, 0, -100, H);                                                                           // near (2 m)
    // the cliff around the door: a vertical rock face with relief, a round opening for the portal
    {
      const W = 170, H = 110, sx = 440, sy = 300;
      const g = new T.PlaneGeometry(W, H, sx, sy); const pa = g.attributes.position, uv = g.attributes.uv, keep = new Uint8Array(pa.count);
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), y = pa.getY(i) + H / 2 - 18;
        const top = nearH(x, -1.0);
        const yy = Math.min(y, top + 0.5);
        const lb = (yy + 60) / 2.4, li = Math.floor(lb), lf = lb - li, bx = Math.floor((x + 300 + 7 * Math.sin(li)) / 23);
        const jut = (k) => 1.1 * hash2(k, bx, 41) + 0.25 * hash2(k, bx + 7, 43);
        const strata = lerp(jut(li - 1), jut(li), ss(lf / 0.14)) - 0.18 * ss((lf - 0.75) / 0.25);   // a ledge at each bed's foot, an undercut at its top
        const rel = 3.6 * fbm(x / 34, yy / 30, 23, 2) + 0.9 * fbm(x / 11, yy / 20, 21, 3) + strata + 0.18 * fbm(x / 2.5, yy / 2.5, 22, 3) - 3.4;
        const r = Math.hypot(x - DC[0], yy - DC[1]);
        keep[i] = r > 4.3 ? 1 : 0;
        const portalFlat = 1 - ss((r - 4.6) / 3.5);                     // the rock is dressed flat round the portal
        pa.setXYZ(i, x, yy, rel * (1 - portalFlat) - 0.6 * portalFlat); uv.setXY(i, x / 7, yy / 7);
      }
      const ix = g.index.array, o2 = []; for (let i = 0; i < ix.length; i += 3) if (keep[ix[i]] && keep[ix[i + 1]] && keep[ix[i + 2]]) o2.push(ix[i], ix[i + 1], ix[i + 2]); g.setIndex(o2);
      g.computeVertexNormals();
      const cm = new T.MeshStandardMaterial({ color: "#b4aea6", map: strataT, normalMap: rockN, roughness: 0.86, envMapIntensity: 0.5 }); cm.normalScale.set(1.0, 1.0);
      M(g, cm, {}, out);
    }
    // the shelf: concrete apron + the helipad (H in a circle, edge lights), boulders, two flood poles
    const apronT = K.canvasTex("b_apron", 512, 512, (g, w, h) => { g.fillStyle = "#8b8986"; g.fillRect(0, 0, w, h); speckle(g, w, h, 8, 20000, 0.22, ["#77746f", "#9d9a95", "#6a6762"]); g.fillStyle = "rgba(40,40,38,0.45)"; for (let k = 0; k <= 4; k++) { g.fillRect(k * 128 - 1, 0, 2, h); g.fillRect(0, k * 128 - 1, w, 2); } }, { repeat: true });
    apronT.repeat.set(8, 13);
    M(new T.PlaneGeometry(64, 52), new T.MeshStandardMaterial({ map: apronT, color: "#8a8884", roughness: 0.85, envMapIntensity: 0.5 }), { rx: -90, y: 0.02, z: 26, cast: false }, out);
    const heliT = K.canvasTex("b_heli", 1024, 1024, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(240,240,236,0.92)"; g.lineWidth = 26; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 30, 0, 7); g.stroke(); g.strokeStyle = "rgba(242,196,64,0.9)"; g.lineWidth = 12; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 70, 0, 7); g.stroke(); g.fillStyle = "rgba(240,240,236,0.95)"; g.font = "700 520px KitOswald, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H", w / 2, h / 2 + 30); });
    M(new T.PlaneGeometry(20, 20), new T.MeshStandardMaterial({ map: heliT, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }), { rx: -90, x: HELI[0], y: 0.03, z: HELI[2], cast: false }, out);
    const heliLightM = glow("#7dff9a", 6);
    inst(sph(0.12, 10, 8), heliLightM, Array.from({ length: 28 }, (_, k) => { const a = (k / 28) * Math.PI * 2; return [HELI[0] + Math.cos(a) * 10.4, 0.1, HELI[2] + Math.sin(a) * 10.4]; }), out, { cast: false });
    const edgeL = inst(sph(0.1, 8, 6), glow("#ffffff", 5), [...Array.from({ length: 14 }, (_, k) => [-31.5, 0.1, 2 + k * 3.6]), ...Array.from({ length: 14 }, (_, k) => [31.5, 0.1, 2 + k * 3.6]), ...Array.from({ length: 17 }, (_, k) => [-30 + k * 3.75, 0.1, 51.5])], out, { cast: false });
    { const R = rng(55), bl = []; for (let i = 0; i < 26; i++) { const s = R() < 0.5 ? -1 : 1; bl.push([s * (24 + R() * 7), 0.4, 1 + R() * 14, 1 + R() * 2.5, 0.8 + R() * 1.8, 1 + R() * 2, R() * 3]); }
      const bg = new T.IcosahedronGeometry(1, 1); const pa = bg.attributes.position; for (let i = 0; i < pa.count; i++) { const n = 1 + (hash2(Math.round(pa.getX(i) * 50), Math.round(pa.getY(i) * 50 + pa.getZ(i) * 30), 4) - 0.5) * 0.35; pa.setXYZ(i, pa.getX(i) * n, pa.getY(i) * n, pa.getZ(i) * n); } bg.computeVertexNormals();
      inst(bg, new T.MeshStandardMaterial({ map: rockCol, normalMap: rockN, color: "#8a8680", roughness: 0.9 }), bl, out); }
    for (const s of [-1, 1]) { const p = G({ x: s * 22, z: 20 }, out); M(cyl(0.12, 0.16, 9, 8), mat("#3a3c40", { rough: 0.5, metal: 0.3 }), { y: 4.5 }, p); M(box(1.2, 0.5, 0.5), mat("#2a2c30", { rough: 0.5 }), { y: 9.0, ry: s * 40 }, p); M(new T.PlaneGeometry(1.0, 0.35), glow("#f2f6ff", 7), { y: 8.98, z: 0.0, rx: 90 + 30, ry: s * 40, cast: false }, p); }
    // a sea of cloud below the shelf (slow noise sheets), lit by the moon
    const cloudM = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 1 } }, transparent: true, depthWrite: false,
      vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: "uniform float t, k; varying vec3 vW; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); } void main(){ vec2 p = vW.xz / 520.0 + vec2(t * 0.003, t * 0.0015); float d = n(p) * 0.55 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.15; float a = smoothstep(0.3, 0.7, d) * k * 0.9; vec3 c = mix(vec3(0.3, 0.36, 0.5), vec3(0.78, 0.83, 0.95), smoothstep(0.45, 0.85, d)); gl_FragColor = vec4(c, a); }" });
    const clouds = [-120, -150, -185].map((y, i) => { const m = M(new T.PlaneGeometry(9000, 9000), cloudM, { rx: -90, y, z: 2000 + i * 300, cast: false, receive: false, nodepth: true }, out); m.renderOrder = 2; return m; });

    // ---------------------------------------------------------------- the portal: concrete collar, the white light ring, the blast door (a re-dress of the vault door)
    const steelPaint = new T.MeshPhysicalMaterial({ color: "#5d646b", metalness: 0.4, roughness: 0.5, envMapIntensity: 1.0, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    const steelEdge = mat("#8b9299", { metal: 0.45, rough: 0.35, env: 1.2 });
    const chrome = mat("#dfe3e6", { metal: 0.45, rough: 0.16, env: 1.6 });
    const concrete = new T.MeshStandardMaterial({ color: "#a9a59d", roughness: 0.85, map: apronT, envMapIntensity: 0.5 });
    const collar = G({ x: DC[0], y: DC[1], z: 0 }, out);
    { const g = new T.RingGeometry(DR + 0.05, 4.7, 96, 1); M(g, concrete, { z: 0.35 }, collar);
      const c1 = new T.CylinderGeometry(4.7, 4.7, 1.2, 96, 1, true); c1.rotateX(Math.PI / 2); M(c1, concrete, { z: -0.25 }, collar);
      const c2 = new T.CylinderGeometry(DR + 0.05, DR + 0.05, 8.2, 96, 1, true); c2.rotateX(Math.PI / 2); M(c2, mat("#6c7177", { rough: 0.5, metal: 0.4, side: T.DoubleSide }), { z: -3.6 }, collar); }
    const ringM = glow("#f4f8ff", 9);
    const ringOut = M(new T.TorusGeometry(3.82, 0.07, 10, 160), ringM, { z: 0.42, cast: false }, collar);
    M(new T.TorusGeometry(3.82, 0.13, 10, 160), mat("#2a2c30", { rough: 0.4, metal: 0.4 }), { z: 0.36 }, collar);
    const ringHalo = M(new T.RingGeometry(3.4, 4.5, 96, 1), new T.MeshBasicMaterial({ map: K.canvasTex("b_halo", 256, 4, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), color: new T.Color("#dfe9ff").multiplyScalar(0.9), transparent: true, depthWrite: false, blending: T.AdditiveBlending }), { z: 0.44, cast: false, receive: false, nodepth: true }, collar);
    { const uv = ringHalo.geometry.attributes.uv, pa = ringHalo.geometry.attributes.position; for (let i = 0; i < uv.count; i++) { const r = Math.hypot(pa.getX(i), pa.getY(i)); uv.setXY(i, (r - 3.4) / 1.1, 0.5); } }
    // the door: pivots on the left hinge (closed = 0); outer face painted gunmetal with a bolt circle, inner face with boltwork
    const HX = DC[0] - DR - 0.25;
    const door = G({ x: HX, y: DC[1], z: 0.15 });
    const dbody = G({ x: DC[0] - HX }, door);
    {
      const plug = new T.CylinderGeometry(DR - 0.03, DR - 0.08, DTH, 128, 1, false); plug.rotateX(Math.PI / 2); plug.translate(0, 0, -DTH / 2);
      M(plug, [steelEdge, steelPaint, steelPaint], {}, dbody);
      const lip = new T.CylinderGeometry(DR + 0.02, DR + 0.02, 0.18, 128); lip.rotateX(Math.PI / 2); lip.translate(0, 0, 0.09); M(lip, [steelEdge, steelPaint, steelPaint], {}, dbody);
      for (const r of [DR - 0.35, 1.25]) M(new T.TorusGeometry(r, 0.045, 10, 128), steelEdge, { z: 0.19 }, dbody);
      inst(cyl(0.085, 0.085, 0.08, 16), steelEdge, Array.from({ length: 36 }, (_, k) => { const a = (k / 36) * Math.PI * 2; return [Math.cos(a) * (DR - 0.18), Math.sin(a) * (DR - 0.18), 0.21, 1, 1, 1, 0, Math.PI / 2]; }), dbody);
      M(cyl(0.55, 0.62, 0.22, 48), steelEdge, { rx: 90, z: 0.28 }, dbody);                                          // central hub
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; M(box(0.18, 1.0, 0.1), steelPaint, { x: Math.cos(a) * 0.95, y: Math.sin(a) * 0.95, z: 0.22, rz: a / D2R + 90 }, dbody); }
      for (const y of [1.5, -1.5]) M(box(0.7, 0.42, 0.34), steelEdge, { x: -(DC[0] - HX) + 0.1, y, z: 0.2 }, dbody);   // hinge knuckles
      M(cyl(0.16, 0.16, 4.4, 24), chrome, { x: 0, y: 0 }, door);
      // inner face (into the tunnel): boltwork bars, radial bolts, a big wheel
      const back = G({ z: -DTH - 0.02 }, dbody); back.rotation.y = Math.PI;
      M(new T.CircleGeometry(DR - 0.1, 96), mat("#8c939a", { metal: 0.45, rough: 0.35 }), { z: 0.005, cast: false }, back);
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; const g2 = G({ rz: a / D2R }, back); M(box(2.2, 0.16, 0.08), chrome, { x: 1.3, z: 0.06 }, g2); }
      const bolts = []; for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const g2 = G({ rz: a / D2R }, back); bolts.push(M(cyl(0.11, 0.11, 0.62, 18), chrome, { x: DR - 0.25, z: 0.14, rz: 90 }, g2)); }
      const wheel = G({ z: 0.16 }, back); M(cyl(0.26, 0.28, 0.2, 32), chrome, { rx: 90, z: 0.08 }, wheel);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.rod([0, 0, 0.12], [Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.22], 0.04, chrome, wheel, 10); }
      M(new T.TorusGeometry(0.92, 0.05, 12, 64), chrome, { z: 0.22 }, wheel);
      door.userData = { bolts, wheel, back };
    }
    // inner light ring on the tunnel side of the frame: 48 segments that chase during the test (st.ringChase 0..1)
    const segM = []; const segs = [];
    { const g = G({ x: DC[0], y: DC[1], z: -1.15 }); M(new T.RingGeometry(DR + 0.02, 3.3, 96, 1), mat("#2a2c30", { rough: 0.5, metal: 0.4, side: T.DoubleSide }), { ry: 180, z: 0.02, cast: false }, g); for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; const m = glow("#f4f8ff", 6); segM.push(m); segs.push(M(box(0.34, 0.12, 0.06), m, { x: Math.cos(a) * 3.16, y: Math.sin(a) * 3.16, rz: a / D2R + 90, cast: false }, g)); } }

    // ---------------------------------------------------------------- the tunnel (z 0..-7.6): a steel-ribbed round bore, a grated floor, the keypad, the 20 FT line
    const tun = G({});
    { const c = new T.CylinderGeometry(3.3, 3.3, 7.2, 64, 1, true); c.rotateX(Math.PI / 2); M(c, mat("#565b60", { rough: 0.55, metal: 0.35, side: T.BackSide }), { x: DC[0], y: DC[1], z: -1.25 - 3.6 }, tun);
      for (let k = 0; k < 6; k++) M(new T.TorusGeometry(3.24, 0.07, 8, 64), mat("#7a8086", { rough: 0.4, metal: 0.45 }), { x: DC[0], y: DC[1], z: -1.8 - k * 1.15 }, tun);
      const grT = K.canvasTex("b_grate", 128, 128, (g, w, h) => { g.fillStyle = "#3a3d40"; g.fillRect(0, 0, w, h); g.fillStyle = "#6a6f74"; for (let k = 0; k < 8; k++) { g.fillRect(k * 16, 0, 4, h); g.fillRect(0, k * 16, w, 3); } }, { repeat: true }); grT.repeat.set(5, 7);
      M(new T.PlaneGeometry(5.4, 7.6), mat("#ffffff", { map: grT, rough: 0.5, metal: 0.4 }), { rx: -90, y: 0.03, z: -3.8 }, tun);
      M(box(6.8, 0.25, 7.8), mat("#3a3c3e", { rough: 0.8 }), { y: -0.1, z: -3.8 }, tun);
      inst(box(0.6, 0.05, 0.08), glow("#e8f0ff", 5), [-2.2, -3.4, -4.6, -5.8].map((z) => [DC[0], DC[1] + 3.15, z]), tun, { cast: false }); }
    const KEYP = [2.45, 1.42, -3.0];
    const kp = G({ x: KEYP[0], y: KEYP[1], z: KEYP[2], ry: -90 }, tun);                   // faces -x (into the bore)
    M(box(0.6, 1.9, 0.5), mat("#4c5156", { rough: 0.5, metal: 0.35 }), { y: -0.5, z: -0.2 }, kp);
    M(rbox(0.36, 0.84, 0.04, 0.03), mat("#c7ccd1", { rough: 0.3, metal: 0.45 }), { y: 0.03, z: 0.05 }, kp);
    const keyCv = document.createElement("canvas"); keyCv.width = 256; keyCv.height = 96; const keyT = new T.CanvasTexture(keyCv); keyT.colorSpace = T.SRGBColorSpace;
    M(new T.PlaneGeometry(0.26, 0.095), new T.MeshBasicMaterial({ map: keyT, color: new T.Color(1.5, 1.5, 1.5) }), { y: 0.15, z: 0.086, cast: false }, kp);
    const keysT = K.textTex("b_keys", 256, 320, (q, w, h) => { q.fillStyle = "#c7ccd1"; q.fillRect(0, 0, w, h); const L = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"]; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; L.forEach((s, i) => { const x = 44 + (i % 3) * 84, y = 30 + Math.floor(i / 3) * 76; q.fillStyle = "#2a2d31"; q.fillRect(x - 32, y - 4, 64, 60); q.fillStyle = "#f0f2f4"; q.fillText(s, x, y + 42); }); });
    M(new T.PlaneGeometry(0.26, 0.3), mat("#ffffff", { map: keysT, rough: 0.4 }), { y: -0.07, z: 0.086, cast: false }, kp);
    const stickT = K.textTex("b_override", 512, 128, (q, w, h) => { q.fillStyle = "#f2c230"; q.fillRect(0, 0, w, h); q.fillStyle = "#151515"; q.fillRect(0, 0, w, 10); q.fillRect(0, h - 10, w, 10); q.font = "700 50px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("OWNER OVERRIDE", w / 2, 62); q.font = "600 38px KitOswald, sans-serif"; q.fillText("FACE UNLOCK", w / 2, 108); });
    M(new T.PlaneGeometry(0.34, 0.085), mat("#ffffff", { map: stickT, rough: 0.6 }), { y: 0.33, z: 0.087, cast: false }, kp);
    const camEye = M(sph(0.02, 10, 8), glow("#7dc8ff", 3), { y: 0.41, z: 0.088, cast: false }, kp);
    let keyKey = "";
    function drawKey(s) { if (s === keyKey) return; keyKey = s; const q = keyCv.getContext("2d"); q.fillStyle = "#06120a"; q.fillRect(0, 0, 256, 96); q.textAlign = "center";
      if (s.startsWith("code")) { const n = parseInt(s.slice(4), 10) || 0; q.fillStyle = "#7dffa8"; q.font = "700 56px KitOswald, monospace"; q.fillText("•".repeat(n) + "_".repeat(Math.max(0, 6 - n)), 128, 64); }
      else if (s === "saved") { q.fillStyle = "#7dffa8"; q.font = "700 46px KitOswald, monospace"; q.fillText("CODE SAVED", 128, 62); }
      else { q.fillStyle = "#3a8a5a"; q.font = "600 40px KitOswald, monospace"; q.fillText("ENTER CODE", 128, 60); }
      keyT.needsUpdate = true; }
    const dim = G({ x: -0.35, y: 0.06, z: 0 }, tun);
    { const amber = glow("#f7b733", 3);
      M(box(0.03, 0.03, 6.1), amber, { z: -3.05 - 0.15, cast: false }, dim);
      for (const z of [-0.15, -6.25]) M(box(0.34, 0.03, 0.03), amber, { z, cast: false }, dim);
      const dimT = K.textTex("b_dim", 256, 96, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = "#f7b733"; q.font = "700 78px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("20 FT", w / 2, 76); });
      const lab = M(new T.PlaneGeometry(1.1, 0.42), new T.MeshBasicMaterial({ map: dimT, transparent: true, color: new T.Color(2.2, 2.2, 2.2), depthWrite: false }), { y: 1.7, z: -3.0, ry: 180, cast: false }, dim);
      dim.userData.lab = lab; }
    dim.visible = false;

    // ---------------------------------------------------------------- the atrium
    const atr = G({});
    const travT = K.canvasTex("b_trav", 1024, 1024, (g, w, h) => { g.fillStyle = "#ece3d3"; g.fillRect(0, 0, w, h); speckle(g, w, h, 31, 30000, 0.12, ["#d8ccb6", "#f6efe2", "#c9bba2"]); const R = rng(32); for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${170 + R() * 30},${150 + R() * 30},${120 + R() * 20},0.12)`; g.fillRect(0, R() * h, w, 2 + R() * 8); } g.fillStyle = "rgba(150,135,110,0.5)"; for (let k = 0; k <= 4; k++) { g.fillRect(k * 256 - 1, 0, 2, h); g.fillRect(0, k * 256 - 1, w, 2); } }, { repeat: true });
    travT.repeat.set(7, 7);
    const travM = new T.MeshPhysicalMaterial({ map: travT, roughness: 0.22, clearcoat: 0.5, clearcoatRoughness: 0.15, envMapIntensity: 0.8 });
    { const sh = new T.Shape(); sh.absarc(0, 0, AR, 0, Math.PI * 2, false); const hole = new T.Path(); hole.moveTo(POOL.x0, -(POOL.z0 - AC[2])); hole.lineTo(POOL.x1, -(POOL.z0 - AC[2])); hole.lineTo(POOL.x1, -(POOL.z1 - AC[2])); hole.lineTo(POOL.x0, -(POOL.z1 - AC[2])); hole.closePath(); sh.holes.push(hole);
      const kh = new T.Path(); kh.absarc(KOI[0] - AC[0], -(KOI[2] - AC[2]), 2.0, 0, Math.PI * 2, true); sh.holes.push(kh);
      const g = new T.ShapeGeometry(sh, 96); const uv = g.attributes.uv, pa = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pa.getX(i) / 28 + 0.5, pa.getY(i) / 28 + 0.5);
      M(g, travM, { rx: -90, x: AC[0], y: 0.0, z: AC[2], cast: false }, atr); }
    // the pool: tiled basin with an animated caustic floor, a turquoise surface with ripples, chrome ladder rails
    const poolG = G({}, atr);
    const tileT = K.canvasTex("b_tile", 256, 256, (g, w, h) => { g.fillStyle = "#3fa7b8"; g.fillRect(0, 0, w, h); const R = rng(9); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = `rgb(${50 + R() * 20},${160 + R() * 30},${178 + R() * 25})`; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); } }, { repeat: true }); tileT.repeat.set(10, 4);
    const causM = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, map: { value: tileT }, k: { value: 1 } }, vertexShader: "varying vec2 vU; varying vec3 vW; void main(){ vU = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }",
      fragmentShader: "uniform float t, k; uniform sampler2D map; varying vec2 vU; varying vec3 vW; float c(vec2 p){ float v = 0.0; for (int i = 0; i < 3; i++) { float fi = float(i); p += vec2(sin(p.y * 1.7 + t * 0.9 + fi), cos(p.x * 1.4 - t * 0.7 + fi * 2.0)) * 0.6; v += abs(sin(p.x + p.y)); } return pow(1.0 - v / 3.0, 6.0); } void main(){ vec3 b = texture2D(map, vU * vec2(10.0, 4.0)).rgb; b = pow(b, vec3(2.2)); float cc = c(vW.xz * 2.2); vec3 col = b * 0.8 + vec3(0.7, 1.0, 1.0) * cc * 1.6 * k; gl_FragColor = vec4(col, 1.0); }" });
    M(new T.PlaneGeometry(POOL.x1 - POOL.x0, POOL.z1 - POOL.z0), causM, { rx: -90, x: (POOL.x0 + POOL.x1) / 2, y: -1.45, z: (POOL.z0 + POOL.z1) / 2, cast: false }, poolG);
    const wallTile = new T.MeshStandardMaterial({ map: tileT, roughness: 0.25, envMapIntensity: 0.8, emissive: new T.Color("#0a4a58"), emissiveIntensity: 0.6 });
    for (const [w, x, z, ry] of [[POOL.x1 - POOL.x0, 0, POOL.z0, 0], [POOL.x1 - POOL.x0, 0, POOL.z1, 180], [POOL.z1 - POOL.z0, POOL.x0, (POOL.z0 + POOL.z1) / 2, 90], [POOL.z1 - POOL.z0, POOL.x1, (POOL.z0 + POOL.z1) / 2, -90]]) M(new T.PlaneGeometry(w, 1.45), wallTile, { x, y: -0.73, z, ry, cast: false }, poolG);
    const ripN = K.heightNormal("b_rip", 256, (x, y) => Math.sin(x / 9 + y / 13) * 0.4 + Math.sin(x / 5.3 - y / 7.1) * 0.3 + vnoise(x / 6, y / 6, 2) * 0.5, 2.0);
    ripN.wrapS = ripN.wrapT = T.RepeatWrapping; ripN.repeat.set(5, 2.2);
    const waterM = new T.MeshPhysicalMaterial({ color: "#6fd8e6", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.5, normalMap: ripN, envMapIntensity: 1.6, clearcoat: 1, depthWrite: false });
    waterM.normalScale.set(0.35, 0.35);
    const poolSurf = M(new T.PlaneGeometry(POOL.x1 - POOL.x0, POOL.z1 - POOL.z0), waterM, { rx: -90, x: (POOL.x0 + POOL.x1) / 2, y: POOL.y, z: (POOL.z0 + POOL.z1) / 2, cast: false, nodepth: true }, poolG); poolSurf.renderOrder = 3;
    M(new T.PlaneGeometry(POOL.x1 - POOL.x0 + 0.6, 0.3), travM, { rx: -90, x: 0, y: 0.012, z: POOL.z1 + 0.15, cast: false }, poolG);
    const LAD = [3.4, 0, POOL.z1];
    for (const dx of [-0.32, 0.32]) { const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16; const a = u * Math.PI; pts.push(new T.Vector3(LAD[0] + dx, 0.95 * Math.sin(a) + (u > 0.5 ? (u - 0.5) * -2.6 : 0), LAD[2] + 0.45 - Math.cos(a) * 0.45 - (u > 0.5 ? 0 : 0))); }
      M(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.025, 10), chrome, {}, poolG); }
    // (render 3) stacked travertine for the rock wall: warm cream courses with fine veins and pores
    const wallT = K.canvasTex("b_wallstone", 512, 512, (g, w, h) => { g.fillStyle = "#cdb08a"; g.fillRect(0, 0, w, h); const R = rng(71); let y = 0;
      while (y < h) { const ch = 34 + R() * 30, v = R(); g.fillStyle = `rgb(${200 + v * 30},${172 + v * 26},${128 + v * 24})`; g.fillRect(0, y, w, ch);
        g.globalAlpha = 0.35; for (let k = 0; k < 5; k++) { g.strokeStyle = R() < 0.5 ? "#a8875e" : "#e8d6b4"; g.lineWidth = 0.6 + R(); g.beginPath(); const yy = y + R() * ch; g.moveTo(0, yy); for (let x = 0; x <= w; x += 24) g.lineTo(x, yy + Math.sin(x * 0.03 + k) * 1.5); g.stroke(); } g.globalAlpha = 1;
        let x = 0; while (x < w) { const sw = 60 + R() * 120; g.fillStyle = "rgba(90,70,48,0.55)"; g.fillRect(x, y, 2, ch); x += sw; }
        g.fillStyle = "rgba(80,62,42,0.6)"; g.fillRect(0, y + ch - 2, w, 2); y += ch; }
      speckle(g, w, h, 72, 9000, 0.35, ["#9c7c56", "#8a6c4a", "#b8966c"]); }, { repeat: true });
    // the rock wall at the back with a waterfall into a rock basin
    const rockWall = (() => { const th0 = -128, th1 = -52, g = new T.CylinderGeometry(AR, AR, DOME + 0.6, 96, 60, true, (90 - th1) * D2R, (th1 - th0) * D2R); const pa = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(x, z); const cb = (y + 20) / 0.55, ci = Math.floor(cb), cf = cb - ci; const n = 0.5 * hash2(ci, Math.floor(a * 14 + ci * 0.37), 44) + 0.35 * fbm(a * 5, y / 3.5, 41, 2) - 0.25 * ss((cf - 0.86) / 0.14); const r = 1 - n * 0.022; pa.setXYZ(i, x * r, y, z * r); uv.setXY(i, a * 4, y / 4); }
      g.computeVertexNormals(); const m = new T.MeshStandardMaterial({ color: "#665b4f", map: wallT, normalMap: rockN, roughness: 0.62, side: T.BackSide, envMapIntensity: 0.7 }); m.normalScale.set(0.25, 0.25);
      return M(g, m, { x: AC[0], y: (DOME + 0.6) / 2 - 0.3, z: AC[2] }, atr); })();
    const fallM = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 1 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float t, k; varying vec2 vU; float h(float x){ return fract(sin(x * 91.7) * 4375.5); } void main(){ float x = floor(vU.x * 60.0); float s = fract(vU.y * 3.0 + t * (1.6 + h(x) * 0.8) + h(x + 3.0)); float st = smoothstep(0.0, 0.5, s) * (1.0 - smoothstep(0.5, 1.0, s)); float edge = smoothstep(0.0, 0.15, vU.x) * smoothstep(1.0, 0.85, vU.x); float a = (0.25 + 0.75 * st) * edge * (0.55 + 0.45 * h(x + 9.0)) * k * 0.7; gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * a, a); }" });
    const fallP = atWall(-90, AR - 0.9, 0);
    const fall = M(new T.PlaneGeometry(1.4, 9.4), fallM, { x: fallP[0], y: 4.7, z: fallP[2] + 0.05, cast: false, receive: false, nodepth: true }, atr);
    { const bas = G({ x: fallP[0], z: fallP[2] + 0.8 }, atr); M(new T.TorusGeometry(1.4, 0.32, 10, 40), new T.MeshStandardMaterial({ map: rockCol, color: "#8f8a82", roughness: 0.85 }), { rx: 90, y: 0.15, sz: 0.6 }, bas); M(new T.CircleGeometry(1.4, 32), waterM, { rx: -90, y: 0.12, cast: false }, bas); M(new T.PlaneGeometry(2.2, 0.9), addGlow("#e8f6ff", 0.7), { y: 0.45, z: 0.1, cast: false, receive: false }, bas); }
    // the round wall (ground floor + two galleries), cream stone with gold pilasters; doorways glow; the cinema entrance
    const stoneM = new T.MeshStandardMaterial({ color: "#efe4d2", map: travT, roughness: 0.6, envMapIntensity: 0.6 });
    const goldM = mat("#c9a35a", { metal: 0.45, rough: 0.28, env: 1.4 });
    { const g = new T.CylinderGeometry(AR, AR, DOME, 128, 1, true, (90 + 52) * D2R, (360 - 76) * D2R); M(g, new T.MeshStandardMaterial({ color: "#efe4d2", map: travT, roughness: 0.6, side: T.BackSide, envMapIntensity: 0.6 }), { x: AC[0], y: DOME / 2, z: AC[2] }, atr); }
    for (let k = 0; k < 18; k++) { const th = -40 + k * (280 / 17); const p = atWall(th, AR - 0.08, DOME / 2); M(box(0.12, DOME, 0.12), goldM, { x: p[0], y: DOME / 2, z: p[2], ry: -th + 90 }, atr); }
    // galleries: slabs (ring sectors), glass balustrades, chrome rails, warm cove LEDs under the slab edges
    const coveM = glow("#ffcf8a", 4);
    for (const gy of [G1, G2]) {
      const th0 = -38, th1 = 218;                                              // the rock wall sector stays open (-128..-52 → back)
      const sh = new T.Shape(); sh.absarc(0, 0, AR, th0 * D2R, th1 * D2R, false); sh.absarc(0, 0, AR - 2.4, th1 * D2R, th0 * D2R, true);
      const sg = new T.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false, curveSegments: 96 }); sg.rotateX(Math.PI / 2);
      M(sg, stoneM, { x: AC[0], y: gy, z: AC[2] }, atr);
      const arc = (r, m, y, tube) => { const g = new T.TorusGeometry(r, tube, 8, 160, (th1 - th0) * D2R); g.rotateX(Math.PI / 2); return M(g, m, { x: AC[0], y, z: AC[2], ry: -th0, cast: false }, atr); };
      arc(AR - 2.4 + 0.02, coveM, gy - 0.38, 0.03);
      arc(AR - 2.35, chrome, gy + 1.08, 0.035);
      const bg = new T.CylinderGeometry(AR - 2.36, AR - 2.36, 1.05, 128, 1, true, (90 + th0) * D2R, (th1 - th0) * D2R);
      const glassB = new T.MeshPhysicalMaterial({ color: "#c9e0e8", roughness: 0.05, transparent: true, opacity: 0.18, envMapIntensity: 1.4, depthWrite: false, side: T.DoubleSide });
      const gm = M(bg, glassB, { x: AC[0], y: gy + 0.53, z: AC[2], ry: 0, cast: false, nodepth: true }, atr); gm.renderOrder = 3; gm.rotation.y = 0;
      // doorways on each gallery level: dark recesses with a warm glow
      for (let k = 0; k < 7; k++) { const th = -20 + k * 36; const p = atWall(th, AR - 0.05, gy + 1.4); const d = M(new T.PlaneGeometry(1.4, 2.4), mat("#2a1d14", { rough: 0.9, emi: "#ffb066", emiI: 0.25 }), { x: p[0], y: gy + 1.55, z: p[2], ry: -th - 90, cast: false }, atr); }
    }
    for (let k = 0; k < 8; k++) { const th = -30 + k * (240 / 7); const p = atWall(th, AR - 2.25, 0); M(cyl(0.22, 0.24, G2, 24), stoneM, { x: p[0], y: G2 / 2, z: p[2] }, atr); M(cyl(0.3, 0.24, 0.3, 24), goldM, { x: p[0], y: G1 - 0.2, z: p[2] }, atr); }
    // ground-floor doorways, the cinema entrance with lit letters
    for (const th of [-10, 62, 118, 172, 236]) { const p = atWall(th, AR - 0.05, 0); M(new T.PlaneGeometry(1.8, 3.0), mat("#2a1d14", { rough: 0.9, emi: "#ffb066", emiI: 0.3 }), { x: p[0], y: 1.5, z: p[2], ry: -th - 90, cast: false }, atr); M(box(2.1, 0.12, 0.2), goldM, { x: p[0], y: 3.06, z: p[2], ry: -th - 90 }, atr); }
    { const p = atWall(CINEMA_TH, AR - 0.05, 0); const cg = G({ x: p[0], y: 0, z: p[2], ry: -CINEMA_TH - 90 }, atr);
      M(new T.PlaneGeometry(2.6, 3.2), mat("#1a0c10", { rough: 0.9, emi: "#ff4a3a", emiI: 0.18 }), { y: 1.6, z: 0.02, cast: false }, cg);
      const ct = K.textTex("b_cinema", 512, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = "#ffe6b0"; q.font = "700 92px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("C I N E M A", w / 2, 100); });
      M(new T.PlaneGeometry(2.4, 0.6), new T.MeshBasicMaterial({ map: ct, transparent: true, color: new T.Color(2.4, 2.1, 1.6) }), { y: 3.65, z: 0.06, cast: false }, cg);
      for (let k = 0; k < 2; k++) M(box(0.08, 3.2, 0.12), goldM, { x: -1.35 + k * 2.7, y: 1.6, z: 0.05 }, cg); }
    // the LED sky dome: a sunny afternoon on panels (pixel grid, seams), drifting clouds; st.skyK brightness, st.skyGlitch flicker
    const skyM = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 1 }, gl: { value: 0 } }, side: T.BackSide, fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float t, k, gl; varying vec3 vP;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        float fb(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n(p); p *= 2.07; a *= 0.5; } return s; }
        void main(){
          vec3 d = normalize(vP); float el = clamp(d.y, 0.0, 1.0);
          vec3 c = mix(vec3(1.0, 0.72, 0.45), vec3(0.18, 0.34, 0.78), pow(el, 0.55));
          c = mix(c, vec3(1.0, 0.55, 0.42), (1.0 - smoothstep(0.0, 0.35, el)) * 0.55);
          vec3 sd = normalize(vec3(0.42, 0.32, 0.6)); float sg = max(dot(d, sd), 0.0);
          c += vec3(1.0, 0.85, 0.55) * (pow(sg, 260.0) * 7.0 + pow(sg, 10.0) * 0.55);
          vec2 q = d.xz / (0.35 + d.y) * 1.6 + vec2(t * 0.02, t * 0.008);
          float cl = smoothstep(0.48, 0.78, fb(q * 1.3));
          vec3 cc = mix(vec3(1.0, 0.62, 0.55), vec3(1.0, 0.92, 0.82), smoothstep(0.2, 0.9, el)) * (0.8 + 0.25 * fb(q * 3.0)); cc += vec3(1.0, 0.7, 0.4) * pow(sg, 6.0) * 0.6;
          c = mix(c, cc, cl * 0.8);
          vec2 px = vP.xz * 9.0 + vP.y * 3.0; vec2 f = abs(fract(px) - 0.5);
          c *= 0.9 + 0.1 * smoothstep(0.42, 0.3, max(f.x, f.y));                               // the LED pixel grid
          vec2 pan = abs(fract(vec2(atan(vP.x, vP.z) * 3.0, vP.y * 0.55)) - 0.5);
          c *= 1.0 - 0.45 * smoothstep(0.482, 0.5, max(pan.x, pan.y));                         // panel seams
          float g = gl * step(0.5, h(vec2(floor(vP.y * 3.0), floor(t * 24.0))));
          c = mix(c, vec3(0.05, 0.08, 0.15) + vec3(0.3, 0.1, 0.4) * h(vec2(floor(t * 30.0), floor(vP.y * 9.0))), g);
          gl_FragColor = vec4(c * k * 0.85, 1.0);
        }` });
    const domeG = new T.SphereGeometry(AR, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2); domeG.scale(1, 0.5, 1);
    M(domeG, skyM, { x: AC[0], y: DOME, z: AC[2], cast: false, receive: false }, atr);
    M(new T.TorusGeometry(AR - 0.05, 0.18, 8, 160), goldM, { rx: 90, x: AC[0], y: DOME, z: AC[2] }, atr);
    // furniture: loungers (the owner's has gold piping), a side table with a glass, the tablet partition, planters
    const cushion = K.pmat("#f3eee4", { rough: 0.85, sheen: 0.5, sheenColor: "#ffffff" });
    function lounger(p, owner) {
      const g = G({ x: p[0], z: p[2] }, atr);
      M(rbox(0.75, 0.12, 2.0, 0.05), owner ? goldM : mat("#d8d2c8", { rough: 0.4, metal: 0.3 }), { y: 0.3 }, g);
      M(rbox(0.72, 0.12, 1.35, 0.06), cushion, { y: 0.42, z: -0.3 }, g);
      M(rbox(0.72, 0.12, 0.75, 0.06), cushion, { y: 0.62, z: 0.62, rx: -40 }, g);
      for (const [x, z] of [[-0.32, -0.9], [0.32, -0.9], [-0.32, 0.9], [0.32, 0.9]]) M(cyl(0.025, 0.025, 0.3, 8), owner ? goldM : chrome, { x, y: 0.15, z }, g);
      if (owner) { M(box(0.74, 0.02, 0.02), goldM, { y: 0.49, z: 0.37 }, g); }
      return g;
    }
    const L0 = lounger(LOUNGE[0], false), L1 = lounger(LOUNGE[1], true);
    { const tb = G({ x: 0, z: LOUNGE[0][2] + 0.6 }, atr); M(cyl(0.3, 0.3, 0.04, 32), goldM, { y: 0.5 }, tb); M(cyl(0.04, 0.06, 0.5, 12), goldM, { y: 0.25 }, tb);
      const gl = new T.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.3, envMapIntensity: 1.6 }); M(cyl(0.035, 0.025, 0.12, 16), gl, { y: 0.58 }, tb); M(cyl(0.032, 0.032, 0.05, 16), mat("#e8c45a", { rough: 0.3, opacity: 0.8 }), { y: 0.56 }, tb); }
    const part = G({ x: TABLET[0], z: TABLET[2] + 0.16 }, atr);
    M(box(3.8, 2.6, 0.3), stoneM, { y: 1.3 }, part);
    M(box(3.9, 0.08, 0.36), goldM, { y: 2.64 }, part);
    for (const x of [-1.6, 1.6]) { M(box(0.7, 0.55, 0.55), stoneM, { x, y: 2.9, z: 0 }, part); }
    // the wall tablet (neutral UI) drawn per state: st.tabScr ∈ "update" | "new" | "thread" | "welcome" | "away"
    const TW = 640, TH = 420; const tabCv = document.createElement("canvas"); tabCv.width = TW; tabCv.height = TH; const tabT = new T.CanvasTexture(tabCv); tabT.colorSpace = T.SRGBColorSpace; tabT.anisotropy = 8;
    M(rbox(0.66, 0.45, 0.03, 0.03), mat("#121316", { rough: 0.3, metal: 0.3 }), { y: TABLET[1], z: -0.16 }, part);
    const tabS = M(new T.PlaneGeometry(0.62, 0.41), new T.MeshBasicMaterial({ map: tabT, color: new T.Color(1.35, 1.35, 1.35) }), { y: TABLET[1], z: -0.19, ry: 180, cast: false }, part);
    const tabL = new T.PointLight("#dfe8ff", 0, 2.2, 2); tabL.position.set(TABLET[0], TABLET[1], TABLET[2] - 0.4); scene.add(tabL);
    let tabKey = "";
    function drawTab(mode, t) {
      const key = mode + "|" + (mode === "update" ? Math.min(1, t).toFixed(2) : ""); if (key === tabKey) return; tabKey = key;
      const q = tabCv.getContext("2d"); q.fillStyle = "#0f1115"; q.fillRect(0, 0, TW, TH);
      q.fillStyle = "#e8eaee"; q.font = "600 26px KitInter, sans-serif"; q.textAlign = "left"; q.fillText("HOME", 28, 44); q.fillStyle = "#8a909a"; q.textAlign = "right"; q.fillText(mode === "update" ? "23:04" : mode === "new" || mode === "thread" ? "23:10" : "23:58", TW - 28, 44); q.fillStyle = "#2a2e36"; q.fillRect(28, 62, TW - 56, 2);
      q.textAlign = "center";
      const bub = (x, y, w, h, fill, txt, col, sz) => { q.fillStyle = fill; q.beginPath(); q.roundRect(x, y, w, h, 18); q.fill(); q.fillStyle = col; q.font = `600 ${sz || 30}px KitInter, sans-serif`; q.textAlign = "left"; q.fillText(txt, x + 20, y + h / 2 + (sz || 30) * 0.36); };
      if (mode === "update") { q.fillStyle = "#e8eaee"; q.font = "700 52px KitOswald, sans-serif"; q.fillText("UPDATE COMPLETE", TW / 2, 200); q.fillStyle = "#2a2e36"; q.fillRect(100, 250, TW - 200, 20); q.fillStyle = "#4fd38a"; q.fillRect(100, 250, (TW - 200) * Math.min(1, t), 20); q.fillStyle = "#8a909a"; q.font = "500 24px KitInter, sans-serif"; q.fillText("version 9.4 · all systems normal", TW / 2, 320); }
      else if (mode === "new") { q.fillStyle = "#e8eaee"; q.font = "700 64px KitOswald, sans-serif"; q.fillText("1 NEW · OWNER", TW / 2, 220); q.fillStyle = "#8a909a"; q.font = "500 26px KitInter, sans-serif"; q.fillText("message", TW / 2, 270); q.fillStyle = "#ff5a45"; q.beginPath(); q.arc(TW / 2, 130, 14, 0, 7); q.fill(); }
      else if (mode === "thread") {
        q.fillStyle = "#8a909a"; q.font = "600 22px KitInter, sans-serif"; q.textAlign = "left"; q.fillText("OWNER", 28, 96);
        bub(28, 110, 430, 56, "#2e323a", "Buy the Antarctic station?", "#d6d9de", 27);
        q.fillStyle = "#6a707a"; q.font = "500 18px KitInter, sans-serif"; q.fillText("last month", 30, 186);
        bub(28, 204, 380, 54, "#3a3f48", "Outbreak everywhere.", "#ffffff", 29);
        bub(28, 268, 330, 54, "#3a3f48", "Landing at dawn.", "#ffffff", 29);
        bub(28, 332, 420, 54, "#3a3f48", "Have the sushi ready.", "#ffffff", 29);
      }
      else if (mode === "welcome") { q.fillStyle = "#e8eaee"; q.font = "700 66px KitOswald, sans-serif"; q.fillText("WELCOME HOME", TW / 2, 200); q.fillStyle = "#f7b733"; q.font = "700 50px KitOswald, sans-serif"; q.fillText("ARRIVING 05:40", TW / 2, 280); }
      else if (mode === "away") { q.fillStyle = "#3a1010"; q.fillRect(0, 70, TW, TH - 70); q.fillStyle = "#ff6a50"; q.font = "700 60px KitOswald, sans-serif"; q.fillText("OWNER", TW / 2, 190); q.font = "700 76px KitOswald, sans-serif"; q.fillText("5 H 42 M AWAY", TW / 2, 290); }
      else { q.fillStyle = "#4a505a"; q.font = "600 40px KitOswald, sans-serif"; q.fillText("HOME", TW / 2, 230); }
      tabT.needsUpdate = true;
    }
    // the lemon tree in a stone planter
    const tree = G({ x: LEMON[0], z: LEMON[2] }, atr);
    M(cyl(1.1, 0.95, 0.85, 40), stoneM, { y: 0.425 }, tree); M(new T.TorusGeometry(1.1, 0.06, 8, 48), goldM, { rx: 90, y: 0.85 }, tree);
    M(cyl(1.02, 1.02, 0.04, 40), mat("#3a2a1c", { rough: 1 }), { y: 0.82 }, tree);
    const bark = mat("#6a5038", { rough: 0.85 });
    K.rod([0, 0.8, 0], [0.08, 2.4, 0.04], 0.09, bark, tree, 10);
    for (const [x, y, z] of [[0.7, 3.0, 0.3], [-0.6, 3.1, 0.2], [0.1, 3.3, -0.6], [0.3, 3.5, 0.6]]) K.rod([0.08, 2.3, 0.04], [x, y, z], 0.045, bark, tree, 8);
    { const R = rng(808), lv = [], lm = [];
      for (let i = 0; i < 2600; i++) { const u = R() * Math.PI * 2, v = Math.acos(2 * R() - 1), r = 0.75 + 0.25 * R(); const x = Math.sin(v) * Math.cos(u) * 1.6 * r, y = Math.cos(v) * 1.15 * r, z = Math.sin(v) * Math.sin(u) * 1.6 * r; lv.push([x, 3.3 + y, z, 1, 1, 1, R() * 6, R() * 6, R() * 6]); }
      const leafG = new T.CircleGeometry(0.09, 6); leafG.scale(0.55, 1.2, 1);
      inst(leafG, new T.MeshStandardMaterial({ color: "#2f6b2a", roughness: 0.55, side: T.DoubleSide, envMapIntensity: 0.7 }), lv, tree, { cols: lv.map(() => new T.Color().setHSL(0.27 + R() * 0.05, 0.5, 0.22 + R() * 0.14)) });
      for (let i = 0; i < 46; i++) { const u = R() * Math.PI * 2, v = Math.acos(2 * R() - 1) * 0.85 + 0.2; lm.push([Math.sin(v) * Math.cos(u) * 1.65, 3.25 + Math.cos(v) * 1.1, Math.sin(v) * Math.sin(u) * 1.65, 0.07, 0.09, 0.07]); }
      inst(sph(1, 14, 10), K.pmat("#f2cf2a", { rough: 0.45, sheen: 0.3, sheenColor: "#fff5b0" }), lm, tree); }
    // four potted palms round the pool (trunk rings + drooping fronds)
    { const frondG = new T.PlaneGeometry(0.42, 1.9, 1, 8); { const pa = frondG.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) + 0.95; const x = pa.getX(i) * (1 - Math.pow(y / 1.9, 2) * 0.8) * (0.5 + y * 0.6); pa.setXYZ(i, x, y, -0.25 * y * y); } frondG.computeVertexNormals(); }
      const frondM = new T.MeshStandardMaterial({ color: "#3d7a32", roughness: 0.6, side: T.DoubleSide, envMapIntensity: 0.6 });
      const trunkM = mat("#8a6a48", { rough: 0.9 });
      for (const [px, pz, h] of [[-6.4, -31.0, 4.2], [6.4, -31.0, 3.8], [-6.0, -37.6, 4.6], [6.0, -37.6, 4.4]]) {
        const g = G({ x: px, z: pz }, atr); M(cyl(0.55, 0.45, 0.6, 24), stoneM, { y: 0.3 }, g); M(new T.TorusGeometry(0.55, 0.04, 8, 32), goldM, { rx: 90, y: 0.6 }, g);
        for (let k = 0; k < 12; k++) M(cyl(0.09 - k * 0.003, 0.1 - k * 0.003, h / 12, 10), trunkM, { x: Math.sin(k * 0.4) * 0.04 * k / 12, y: 0.6 + (k + 0.5) * h / 12 }, g);
        for (let k = 0; k < 14; k++) { const a = (k / 14) * 360, el = 15 + (k % 3) * 15; M(frondG, frondM, { y: 0.6 + h, ry: a, rx: -(90 - el), order: "YXZ", cast: true }, g); }
      } }
    // the koi pond: stone rim, dark water, lily pads, nine koi that swim in circles, food pellets (st.feed)
    const koi = G({ x: KOI[0], z: KOI[2] }, atr);
    M(new T.TorusGeometry(2.05, 0.18, 10, 56), new T.MeshStandardMaterial({ map: rockCol, color: "#b0aaa0", roughness: 0.8 }), { rx: 90, y: 0.12, sz: 0.7 }, koi);
    M(new T.CircleGeometry(2.0, 48), mat("#0c2a2a", { rough: 0.9 }), { rx: -90, y: -0.45, cast: false }, koi);
    const koiW = M(new T.CircleGeometry(2.02, 48), new T.MeshPhysicalMaterial({ color: "#3a8a86", roughness: 0.05, transparent: true, opacity: 0.35, normalMap: ripN, envMapIntensity: 1.4, clearcoat: 1, depthWrite: false }), { rx: -90, y: 0.02, cast: false, nodepth: true }, koi); koiW.renderOrder = 3;
    inst(new T.CircleGeometry(0.22, 16, 0.4, Math.PI * 1.8), mat("#3f7a34", { rough: 0.6, side: T.DoubleSide }), [[0.9, 0.03, 0.6, 1, 1, 1, 0, -Math.PI / 2], [-1.1, 0.03, -0.4, 1.2, 1.2, 1, 0.6, -Math.PI / 2], [0.3, 0.03, -1.3, 0.9, 0.9, 1, 1.4, -Math.PI / 2]], koi, { cast: false });
    const fish = [];
    { const bodyG = new T.SphereGeometry(0.05, 14, 10); bodyG.scale(0.55, 0.45, 1.9); const tailG = new T.ConeGeometry(0.045, 0.09, 8); tailG.rotateX(-Math.PI / 2); tailG.scale(1.2, 0.3, 1);
      const cols = ["#ff7a1e", "#f4f0e8", "#ff5a1a", "#f8f4ec", "#e8a020", "#ff6a28", "#ffffff", "#f06a1e", "#f2e8d8"];
      for (let i = 0; i < 9; i++) { const g = G({}, koi); const m = K.pmat(cols[i], { rough: 0.35, sheen: 0.5, sheenColor: "#ffffff", cc: 0.6 }); M(bodyG, m, { cast: false }, g); M(tailG, m, { z: -0.12, cast: false }, g); if (i % 3 === 1) M(sph(0.025, 8, 6), K.pmat("#ff5a1a", { rough: 0.4 }), { y: 0.016, z: 0.02, sx: 1.2, sy: 0.5, sz: 1.4, cast: false }, g); fish.push({ g, r: 0.5 + (i % 4) * 0.35, ph: i * 0.9, sp: 0.35 + (i % 3) * 0.12 }); } }
    const pellets = inst(sph(0.012, 6, 4), mat("#8a5a2a", { rough: 0.6 }), Array.from({ length: 30 }, () => [0, -10, 0]), koi, { cast: false });
    // the framed sign IN CASE OF APOCALYPSE · RELAX, the owner's portrait (a faceless silhouette, arms crossed)
    function framed(p, th, w, h, tex, light) {
      const g = G({ x: p[0], y: p[1], z: p[2], ry: -th - 90 }, atr);
      M(box(w + 0.24, h + 0.24, 0.08), goldM, { z: 0.04 }, g);
      M(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: 0.9, envMapIntensity: 0.08 }), { z: 0.085, cast: false }, g);
      if (light) { M(box(0.6, 0.06, 0.1), goldM, { y: h / 2 + 0.25, z: 0.18 }, g); M(box(0.5, 0.02, 0.05), glow("#fff0d0", 4), { y: h / 2 + 0.21, z: 0.2, cast: false }, g); }
      return g;
    }
    const signT = K.textTex("b_relax", 512, 640, (q, w, h) => { q.fillStyle = "#18263f"; q.fillRect(0, 0, w, h); q.strokeStyle = "#c9a35a"; q.lineWidth = 6; q.strokeRect(24, 24, w - 48, h - 48); q.fillStyle = "#e8d8b0"; q.textAlign = "center"; q.font = "700 66px KitOswald, sans-serif"; q.fillText("IN CASE OF", w / 2, 170); q.font = "700 92px KitOswald, sans-serif"; q.fillText("APOCALYPSE", w / 2, 280); q.fillStyle = "#c9a35a"; q.fillRect(w / 2 - 70, 330, 140, 6); q.fillStyle = "#ffffff"; q.font = "700 150px KitOswald, sans-serif"; q.fillText("RELAX", w / 2, 500); });
    const signG = framed(SIGN, 32, 0.9, 1.12, signT, true);
    const portT = K.textTex("b_portrait", 512, 640, (q, w, h) => {
      const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a6a8a"); gr.addColorStop(0.55, "#c9a074"); gr.addColorStop(1, "#4a3a32"); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      q.fillStyle = "rgba(255,255,255,0.18)"; for (let i = 0; i < 6; i++) { q.beginPath(); q.ellipse(80 + i * 80, 120 + (i % 2) * 40, 90, 26, 0, 0, 7); q.fill(); }
      q.fillStyle = "#17161a"; q.beginPath(); q.ellipse(w / 2, 225, 62, 76, 0, 0, 7); q.fill();                    // head (no face)
      q.beginPath(); q.moveTo(w / 2 - 40, 290); q.lineTo(w / 2 + 40, 290); q.lineTo(w / 2 + 175, 380); q.lineTo(w / 2 + 190, h); q.lineTo(w / 2 - 190, h); q.lineTo(w / 2 - 175, 380); q.closePath(); q.fill();
      q.fillStyle = "#26252a"; q.beginPath(); q.roundRect(w / 2 - 165, 430, 330, 70, 30); q.fill();                 // arms crossed
      q.strokeStyle = "#0e0d10"; q.lineWidth = 6; q.beginPath(); q.moveTo(w / 2 - 150, 470); q.lineTo(w / 2 + 120, 448); q.stroke(); q.beginPath(); q.moveTo(w / 2 + 150, 478); q.lineTo(w / 2 - 110, 458); q.stroke();
      q.fillStyle = "rgba(201,163,90,0.9)"; q.fillRect(w / 2 - 4, 300, 8, 120);
    });
    const portG = framed(PORTRAIT, 150, 1.5, 1.88, portT, true);
    // practical glow cards round the atrium (cove, pool, picture lights) are the light pool; see RIGS below

    // ---------------------------------------------------------------- the kitchen (rice cooker), the cinema, the pantry, the cellar, the plant room, the lake
    function room(c, w, d, h, wallHex, floorM, ceilHex) {
      const g = G({ x: c[0], y: c[1], z: c[2] });
      M(new T.PlaneGeometry(w, d), floorM, { rx: -90, y: 0.0, cast: false }, g);
      M(new T.PlaneGeometry(w, d), mat(ceilHex || "#2a2622", { rough: 0.9 }), { rx: 90, y: h, cast: false }, g);
      const wm = mat(wallHex, { rough: 0.8 });
      M(new T.PlaneGeometry(w, h), wm, { y: h / 2, z: -d / 2 }, g); M(new T.PlaneGeometry(w, h), wm, { y: h / 2, z: d / 2, ry: 180 }, g);
      M(new T.PlaneGeometry(d, h), wm, { y: h / 2, x: -w / 2, ry: 90 }, g); M(new T.PlaneGeometry(d, h), wm, { y: h / 2, x: w / 2, ry: -90 }, g);
      return g;
    }
    const walnut = mat("#5a3a24", { rough: 0.45, env: 0.8 }), white = mat("#f2efe8", { rough: 0.35 });
    // kitchen: walnut cabinets, a white stone island, the rice cooker, a sushi mat, a pendant
    const kit = room(KIT, 8, 7, 3.2, "#d9cfbf", new T.MeshPhysicalMaterial({ map: travT, roughness: 0.3, clearcoat: 0.3 }));
    M(box(7.6, 0.9, 0.65), walnut, { y: 0.45, z: -3.1 }, kit); M(box(7.6, 0.05, 0.7), white, { y: 0.93, z: -3.1 }, kit); M(box(7.6, 0.8, 0.4), walnut, { y: 2.3, z: -3.25 }, kit);
    M(box(2.8, 0.9, 1.1), walnut, { y: 0.45, z: 0 }, kit); M(box(3.0, 0.06, 1.25), white, { y: 0.93, z: 0 }, kit);
    const RICE = [0.3, 0.96, -0.1];
    const rice = G({ x: RICE[0], y: RICE[1], z: RICE[2] }, kit);
    { const bodyG = new T.CylinderGeometry(0.17, 0.16, 0.22, 40); const pa = bodyG.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setX(i, x * 1.12); } bodyG.computeVertexNormals();
      M(bodyG, K.pmat("#f6f4ef", { rough: 0.3, cc: 0.6 }), { y: 0.11 }, rice); const lid = new T.SphereGeometry(0.19, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2.4); lid.scale(1.12, 0.45, 1); M(lid, K.pmat("#f6f4ef", { rough: 0.3, cc: 0.6 }), { y: 0.215 }, rice);
      M(rbox(0.12, 0.07, 0.01, 0.01), mat("#20242a", { rough: 0.3 }), { y: 0.1, z: 0.163, rx: -4 }, rice); M(box(0.05, 0.016, 0.004), glow("#5ad6ff", 3), { y: 0.11, z: 0.17, cast: false }, rice);
      M(box(0.06, 0.03, 0.04), mat("#d8d6d0"), { y: 0.29, z: 0.1 }, rice); }
    { const mt = K.canvasTex("b_mat", 128, 128, (g, w, h) => { for (let x = 0; x < w; x += 4) { g.fillStyle = x % 8 ? "#c8b07a" : "#a88f5a"; g.fillRect(x, 0, 4, h); } }); M(box(0.3, 0.01, 0.28), mat("#ffffff", { map: mt, rough: 0.8 }), { x: -0.6, y: 0.97, z: 0.1 }, kit); M(box(0.5, 0.03, 0.32), mat("#c8a070", { rough: 0.6 }), { x: -0.9, y: 0.975, z: -0.25, ry: 20 }, kit); }
    for (const x of [-0.8, 0.8]) { K.rod([x, 3.2, 0], [x, 2.2, 0], 0.006, mat("#222"), kit); M(new T.CylinderGeometry(0.06, 0.2, 0.22, 24, 1, true), mat("#b8924c", { metal: 0.45, rough: 0.3, side: T.DoubleSide }), { x, y: 2.1 }, kit); M(sph(0.05, 10, 8), glow("#ffe0b0", 6), { x, y: 2.02, cast: false }, kit); }
    // cinema: a glowing screen (moving clouds over a sea), two rows of red recliners, a star ceiling, sconces
    const cin = room(CIN, 9, 8, 3.6, "#2a1418", mat("#4a1820", { rough: 0.95 }), "#0c0a10");
    const screenM = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 1 } }, vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float t, k; varying vec2 vU; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); } void main(){ vec2 u = vU; vec3 sky = mix(vec3(1.0, 0.62, 0.35), vec3(0.3, 0.45, 0.85), u.y); float c = smoothstep(0.5, 0.8, n(vec2(u.x * 4.0 + t * 0.05, u.y * 6.0)) * 0.6 + n(vec2(u.x * 9.0 + t * 0.08, u.y * 12.0)) * 0.4); vec3 col = mix(sky, vec3(1.0, 0.85, 0.75), c * 0.6); if (u.y < 0.38) { float w = n(vec2(u.x * 30.0 + t * 0.4, u.y * 80.0)); col = mix(vec3(0.05, 0.2, 0.35), vec3(1.0, 0.7, 0.45), pow(w, 6.0) * (0.38 - u.y) * 6.0 + 0.1); } float sun = smoothstep(0.08, 0.0, length((u - vec2(0.62, 0.44)) * vec2(1.6, 1.0))); col += vec3(1.0, 0.8, 0.5) * sun * 1.5; gl_FragColor = vec4(col * k, 1.0); }" });
    M(new T.PlaneGeometry(6.4, 2.75), screenM, { y: 1.85, z: -3.95, cast: false }, cin);
    const seatM = K.pmat("#8a1822", { rough: 0.7, sheen: 0.8, sheenColor: "#ff7a7a" });
    const SEATS = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) SEATS.push([-1.6 + c * 1.6, r * 0.45, 0.3 + r * 2.0]);
    for (const [x, y, z] of SEATS) { const s = G({ x, y, z }, cin); if (y > 0) M(box(1.6, y, 1.8), mat("#3a1218", { rough: 0.9 }), { y: y / 2 - 0 }, s); M(rbox(0.95, 0.45, 0.9, 0.12), seatM, { y: y + 0.32 }, s); M(rbox(0.95, 0.7, 0.25, 0.12), seatM, { y: y + 0.8, z: 0.42, rx: -14 }, s); for (const sx of [-1, 1]) M(rbox(0.16, 0.42, 0.9, 0.06), seatM, { x: sx * 0.52, y: y + 0.55 }, s); M(rbox(0.8, 0.12, 0.5, 0.05), seatM, { y: y + 0.22, z: -0.6, rx: 20 }, s); }
    inst(sph(0.02, 6, 4), glow("#ffffff", 6), Array.from({ length: 160 }, (_, k) => [-4.3 + hash2(k, 1, 7) * 8.6, 3.58, -3.8 + hash2(k, 2, 7) * 7.6]), cin, { cast: false });
    // pantry: two long shelf rows with jars, cans, sacks; bins with labels; strip lights
    const pan = room(PAN, 10, 8, 3.2, "#cfc8bb", mat("#8c8780", { rough: 0.7 }), "#d0ccc4");
    { const sh = mat("#9aa0a6", { rough: 0.4, metal: 0.4 }); const L = [];
      for (const z of [-3.4, -0.5, 2.4]) for (let k = 0; k < 5; k++) M(box(8.8, 0.04, 0.6), sh, { y: 0.3 + k * 0.55, z }, pan);
      const lab = ["RICE", "BEANS", "FLOUR", "OATS", "PASTA", "SUGAR", "LENTILS", "SALT"];
      const jarT = lab.map((s, i) => K.textTex("b_jar" + i, 128, 128, (q, w, h) => { q.fillStyle = ["#f2ead2", "#e8d0b0", "#f6f4ee", "#e6d8b8", "#f2dfa0", "#ffffff", "#d8b890", "#f0f0f0"][i]; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1a1a"; q.fillRect(10, 44, w - 20, 40); q.fillStyle = "#ffffff"; q.font = "700 28px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText(s, w / 2, 74); }));
      const jm = jarT.map((t) => new T.MeshStandardMaterial({ map: t, roughness: 0.3, envMapIntensity: 0.8 })); const lists = jm.map(() => []);
      const R = rng(61); for (const z of [-3.4, -0.5, 2.4]) for (let k = 0; k < 5; k++) for (let i = 0; i < 26; i++) { const m = Math.floor(R() * jm.length); lists[m].push([-4.2 + i * 0.33, 0.32 + k * 0.55 + 0.14, z, 0.22, 0.28, 0.22]); }
      lists.forEach((l, m) => inst(cyl(0.5, 0.5, 1, 14), jm[m], l, pan));
      for (let i = 0; i < 6; i++) M(rbox(0.6, 0.18, 0.5, 0.08), mat("#d8c8a0", { rough: 0.95 }), { x: -4 + i * 0.7, y: 0.09, z: 1.5 }, pan);
      inst(box(1.6, 0.04, 0.1), glow("#f2f6ff", 5), [[-2.5, 3.15, -2], [2.5, 3.15, -2], [-2.5, 3.15, 1.2], [2.5, 3.15, 1.2]], pan, { cast: false }); }
    // wine cellar: brick barrel vault, diamond racks full of unlabelled bottles, a tasting barrel
    const cel = G({ x: CEL[0], y: CEL[1], z: CEL[2] });
    const brickT = K.canvasTex("b_brick", 256, 256, (g, w, h) => { g.fillStyle = "#5a3a2a"; g.fillRect(0, 0, w, h); const R = rng(17); for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) { g.fillStyle = `rgb(${120 + R() * 40},${62 + R() * 22},${42 + R() * 16})`; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } }, { repeat: true }); brickT.repeat.set(6, 3);
    { const vg = new T.CylinderGeometry(3.4, 3.4, 12, 48, 1, true, -Math.PI / 2, Math.PI); vg.rotateX(Math.PI / 2); const m = new T.MeshStandardMaterial({ map: brickT, roughness: 0.9, side: T.BackSide }); M(vg, m, { y: 1.6 }, cel); M(new T.PlaneGeometry(6.8, 12), mat("#3a2a20", { rough: 0.9 }), { rx: -90, y: 0.0, cast: false }, cel);
      M(new T.PlaneGeometry(6.8, 5), new T.MeshStandardMaterial({ map: brickT, roughness: 0.9 }), { y: 2.5, z: -6 }, cel); M(box(6.8, 1.6, 12), new T.MeshStandardMaterial({ map: brickT, roughness: 0.9 }), { y: 0.0 - 0.8 + 0.0, z: 0, cast: false }, cel).visible = false;
      const bottleG = new T.CylinderGeometry(0.036, 0.036, 0.3, 10); bottleG.rotateX(Math.PI / 2);
      const bl = [], R = rng(91); for (const sx of [-1, 1]) for (let i = 0; i < 26; i++) for (let j = 0; j < 12; j++) { const z = -5.4 + i * 0.4, y = 0.25 + j * 0.16; if (R() < 0.04) continue; bl.push([sx * 2.85, y, z + (j % 2) * 0.2, 1, 1, 1, sx * Math.PI / 2]); }
      inst(bottleG, new T.MeshPhysicalMaterial({ color: "#1e3a24", roughness: 0.15, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.4 }), bl, cel);
      inst(cyl(0.012, 0.012, 0.02, 8), mat("#7a1a1a", { rough: 0.5 }), bl.map((b) => [b[0] - Math.sign(b[0]) * 0.16, b[1], b[2], 1, 1, 1, 0, 0, Math.PI / 2]), cel);
      for (const sx of [-1, 1]) for (let i = 0; i < 14; i++) M(box(0.04, 2.1, 0.04), mat("#4a3020", { rough: 0.8 }), { x: sx * 2.75, y: 1.05, z: -5.6 + i * 0.8 }, cel);
      const bar = G({ y: 0, z: -2.2 }, cel); M(cyl(0.42, 0.42, 1.0, 24), mat("#7a5032", { rough: 0.7 }), { y: 0.5 }, bar); for (const y of [0.15, 0.85]) M(new T.TorusGeometry(0.425, 0.02, 6, 24), mat("#333", { metal: 0.4, rough: 0.5 }), { rx: 90, y }, bar);
      const gl = new T.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.3, envMapIntensity: 1.6 }); M(cyl(0.04, 0.03, 0.1, 16), gl, { x: 0.1, y: 1.08 }, bar); M(cyl(0.035, 0.03, 0.04, 16), mat("#5a0a14", { rough: 0.2 }), { x: 0.1, y: 1.05 }, bar);
      inst(sph(0.06, 10, 8), glow("#ffc070", 5), [[-3.0, 2.6, -4], [3.0, 2.6, -4], [-3.0, 2.6, 0], [3.0, 2.6, 0], [-3.0, 2.6, 4], [3.0, 2.6, 4]], cel, { cast: false }); }
    // the plant room: big filtration units, ducts, pipes, gauges, status LEDs, the FILTRATION PLAN sticker
    const plt = room(PLT, 9, 7, 3.6, "#6a6e70", mat("#5a5c5e", { rough: 0.8 }), "#3a3c3e");
    { const unitM = mat("#b8bcc0", { rough: 0.45, metal: 0.35 });
      for (let i = 0; i < 3; i++) { const u = G({ x: -2.8 + i * 2.8, z: -2.6 }, plt); M(box(2.2, 2.3, 1.2), unitM, { y: 1.15 }, u); for (let k = 0; k < 10; k++) M(box(1.8, 0.03, 0.05), mat("#55595d"), { y: 0.5 + k * 0.08, z: 0.62 }, u); M(cyl(0.45, 0.45, 0.06, 32), mat("#3a3c3e", { metal: 0.4, rough: 0.4 }), { y: 1.75, z: 0.62, rx: 90 }, u); M(box(0.06, 0.06, 0.02), glow(i === 1 ? "#ffb030" : "#4fff8a", 4), { x: 0.85, y: 2.05, z: 0.61, cast: false }, u); K.rod([0, 2.3, 0], [0, 3.6, 0], 0.32, mat("#8a8e92", { metal: 0.4, rough: 0.4 }), u, 16); }
      for (let k = 0; k < 4; k++) K.rod([-4.4, 0.4 + k * 0.25, 2.0], [4.4, 0.4 + k * 0.25, 2.0], 0.05, mat(["#b83a2a", "#2a6ab8", "#3a9a4a", "#c8a030"][k], { rough: 0.4, metal: 0.3 }), plt, 10);
      const stT = K.textTex("b_filter", 512, 256, (q, w, h) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, w, h); q.fillStyle = "#1c5aa8"; q.fillRect(0, 0, w, 64); q.fillStyle = "#ffffff"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FILTRATION PLAN", w / 2, 48); q.fillStyle = "#141414"; q.font = "700 52px KitOswald, sans-serif"; q.fillText("RENEWS MONTHLY", w / 2, 140); q.fillStyle = "#444"; q.font = "600 30px KitInter, sans-serif"; q.fillText("CARD ON FILE", w / 2, 200); });
      M(new T.PlaneGeometry(0.62, 0.31), mat("#ffffff", { map: stT, rough: 0.5 }), { x: 0, y: 1.25, z: -1.99, cast: false }, plt);
      inst(box(1.4, 0.04, 0.1), glow("#e8f0ff", 4), [[-2, 3.55, 0], [2, 3.55, 0]], plt, { cast: false }); }
    // the indoor lake: a rock cavern, still black water with mirrored lights, a boardwalk with string lights, a rowboat
    const lake = G({ x: LAKE[0], y: LAKE[1], z: LAKE[2] });
    { const cg = new T.SphereGeometry(30, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2); const pa = cg.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const n = 1 - 0.12 * fbm(x / 6, z / 6 + y / 5, 51, 4); pa.setXYZ(i, x * n, y * n * 0.42, z * n); } cg.computeVertexNormals();
      const cm = new T.MeshStandardMaterial({ color: "#6a6660", map: rockCol, normalMap: rockN, roughness: 0.9, side: T.BackSide }); cm.normalScale.set(1.5, 1.5); rockCol.repeat.set(1, 1); M(cg, cm, {}, lake);
      M(new T.CircleGeometry(30, 48), mat("#05080a", { rough: 1 }), { rx: -90, y: -1.2, cast: false }, lake);
      const lw = new T.MeshPhysicalMaterial({ color: "#0a1418", roughness: 0.02, transparent: true, opacity: 0.72, normalMap: ripN, envMapIntensity: 0.6, clearcoat: 1, depthWrite: false }); lw.normalScale.set(0.08, 0.08);
      const lws = M(new T.CircleGeometry(29, 64), lw, { rx: -90, y: 0.0, cast: false, nodepth: true }, lake); lws.renderOrder = 3;
      const plank = mat("#6a4a2e", { rough: 0.8 });
      M(box(1.6, 0.12, 14), plank, { x: -6, y: 0.35, z: 4 }, lake); for (let k = 0; k < 8; k++) for (const sx of [-0.7, 0.7]) M(cyl(0.06, 0.06, 2.0, 8), plank, { x: -6 + sx, y: -0.5, z: -2.5 + k * 1.9 }, lake);
      const bulbs = [], refl = []; for (let k = 0; k <= 30; k++) { const u = k / 30; const x = -6 + Math.sin(u * 7) * 0.4 - 0.75, z = -3 + u * 14, y = 2.2 - Math.sin((u * 6) % 1 * Math.PI) * 0.35; bulbs.push([x, y, z]); refl.push([x, -y + 0.0, z]); }
      inst(sph(0.05, 8, 6), glow("#ffc878", 7), bulbs, lake, { cast: false }); inst(sph(0.06, 8, 6), glow("#ffc878", 1.6), refl, lake, { cast: false });
      for (let k = 0; k < 12; k++) { const a = -0.6 + k * 0.1; const x = 6 + Math.cos(a) * 14, z = -2 + Math.sin(a) * 14; inst(sph(0.08, 8, 6), glow("#9ad6ff", 4), [[x, 0.4, z], [x, -0.4, z]], lake, { cast: false }); }
      const boat = G({ x: -3.6, y: 0.05, z: 6, ry: 25 }, lake); const hull = new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(0.7, 0.35, 1.9); M(hull, mat("#e8e2d6", { rough: 0.6, side: T.DoubleSide }), { y: 0.25 }, boat); M(box(1.2, 0.05, 0.25), plank, { y: 0.18 }, boat);
      M(sph(1, 16, 8), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ffb060").multiplyScalar(0.12), transparent: true, depthWrite: false, blending: T.AdditiveBlending }), { x: -6.5, y: 2.2, z: 4, sx: 3, sy: 2, sz: 9, cast: false }, lake); }

    // ---------------------------------------------------------------- the ocean far to the south (the jet over the sea) and the jet's lights
    const sea = G({});
    { const sN = K.heightNormal("b_sea", 256, (x, y) => Math.sin(x / 6 + y / 17) * 0.3 + Math.sin(x / 3.1 - y / 5.3) * 0.3 + vnoise(x / 3, y / 3, 6) * 0.5, 3.0); sN.wrapS = sN.wrapT = T.RepeatWrapping; sN.repeat.set(900, 900);
      const sm = new T.MeshStandardMaterial({ color: "#05080e", roughness: 0.12, metalness: 0, normalMap: sN, envMapIntensity: 0.9 }); sm.normalScale.set(0.6, 0.6);
      M(new T.PlaneGeometry(40000, 30000), sm, { rx: -90, y: -400, z: 22000, cast: false }, sea); }
    const jet = G({});
    const jetW = M(sph(1, 10, 8), glow("#ffffff", 9, { fog: false }), { cast: false }, jet), jetW2 = M(sph(1, 10, 8), glow("#ffffff", 9, { fog: false }), { cast: false }, jet);
    const jetR = M(sph(1, 8, 6), glow("#ff2a1a", 7, { fog: false }), { cast: false }, jet), jetG = M(sph(1, 8, 6), glow("#2aff6a", 7, { fog: false }), { cast: false }, jet), jetS = M(sph(1, 8, 6), glow("#ffffff", 14, { fog: false }), { cast: false }, jet), jetB = M(sph(1, 8, 6), glow("#ff3a2a", 8, { fog: false }), { cast: false }, jet);
    const jetHalo = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#fff4e0").multiplyScalar(1.2), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { cast: false, receive: false, nodepth: true }, jet);
    jet.visible = false;
    // a second moon disc for the hero only (st.moon2K): the kit's moon sits behind the summit from the shelf, so the hero
    // frame shows this one, low over the right shoulder of the ridge, in the same quarter of the sky as the moonlight
    const moon2 = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: K.canvasTex("moon", 256, 256, () => {}), transparent: true, depthWrite: false, fog: false, color: new T.Color(3.0, 3.0, 3.0) }), { cast: false, receive: false, nodepth: true });
    const moon2g = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#9fb4ff").multiplyScalar(0.55), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { cast: false, receive: false, nodepth: true });
    moon2.renderOrder = -8; moon2g.renderOrder = -8;
    // ---------------------------------------------------------------- red eyes on the slopes (B) and waiting by the helipad (S)
    const eyeM = glow("#ff2412", 16, { fog: false }), eyeG = sph(0.09, 8, 6);
    const NE = 110, eyes = [];
    { const R = rng(9911); for (let i = 0; i < NE; i++) { const a = R() * Math.PI * 2, r = 36 + R() * 60; let x = Math.cos(a) * r * 1.3, z = 40 + Math.sin(a) * r * 0.9; if (z < 4) z = 4 + R() * 6; const gx = (R() - 0.5) * 36, gz = 34 + R() * 16; eyes.push({ a: [x, z], b: [gx, gz], ph: R() * 10, ap: R() }); } }
    const eyeIM = new T.InstancedMesh(eyeG, eyeM, NE * 2); eyeIM.frustumCulled = false; scene.add(eyeIM);

    // ---------------------------------------------------------------- light rigs (the pool of 6 points + 2 spots, per set)
    const RIGS = {
      ext: { pts: [[-4.4, 3.2, 1.2, "#eef4ff", 7], [4.4, 3.2, 1.2, "#eef4ff", 7], [0, 7.4, 1.2, "#eef4ff", 7], [0, -0.8, 1.4, "#eef4ff", 5], [0, 3.2, 8, "#dfe8ff", 3]], spots: [[-22, 9, 20, 0, 3, 0, "#f2f6ff", 800, 22], [22, 9, 20, 0, 3, 0, "#f2f6ff", 800, 22]] },
      tunnel: { pts: [[0, 5.6, -2.2, "#e8f0ff", 14], [0, 5.6, -5.0, "#e8f0ff", 14], [0, 1.4, -1.6, "#f4f8ff", 6], [1.6, 1.6, -3.0, "#9fc8ff", 1.2]], spots: [] },
      atrium: { pts: [[0, 0.4, -36.8, "#5ff0ff", 120], [-9, 3.4, -24, "#ffc070", 90], [9, 3.4, -24, "#ffc070", 90], [0, 7, -36, "#ffc890", 110], [TABLET[0], 2.6, TABLET[2] - 2.4, "#fff2e0", 12], [0, 12, -30, "#ffd0a0", 140]], spots: [[-3.5, 0.3, -36.5, -3.0, 9, -43.5, "#ffb870", 2200, 26], [3.5, 0.3, -36.5, 3.0, 9, -43.5, "#ffb870", 2200, 26], [LEMON[0] + 2, 7, LEMON[2] + 3, LEMON[0], 3, LEMON[2], "#fff4dc", 700, 30]] },
      portrait: { pts: [[0, 0.6, -33.6, "#5ff0ff", 50], [-9, 3.4, -24, "#ffc070", 70], [0, 7, -36, "#ffc890", 80], [0, 12, -30, "#ffd0a0", 100]], spots: [[PORTRAIT[0] + 3.5, 5.5, PORTRAIT[2] + 2.2, PORTRAIT[0], 2.6, PORTRAIT[2], "#fff0d8", 260, 18]] },
      kitchen: { pts: [[KIT[0] - 0.8, 2.0, KIT[2], "#ffdcb0", 10], [KIT[0] + 0.8, 2.0, KIT[2], "#ffdcb0", 10], [KIT[0], 2.8, KIT[2] + 2.5, "#fff0e0", 14], [KIT[0] - 2.5, 2.4, KIT[2] - 2.6, "#ffe0c0", 6]], spots: [] },
      cinema: { pts: [[CIN[0], 1.8, CIN[2] - 3.2, "#ffc8a0", 26], [CIN[0] - 4, 2.4, CIN[2], "#ff9a70", 6], [CIN[0] + 4, 2.4, CIN[2], "#ff9a70", 6], [CIN[0], 2.6, CIN[2] + 2.5, "#ffb890", 5]], spots: [] },
      pantry: { pts: [[PAN[0] - 2.5, 2.8, PAN[2] - 2, "#f2f6ff", 14], [PAN[0] + 2.5, 2.8, PAN[2] - 2, "#f2f6ff", 14], [PAN[0], 2.8, PAN[2] + 1.2, "#f2f6ff", 14]], spots: [] },
      cellar: { pts: [[CEL[0] - 2.8, 2.5, CEL[2] - 4, "#ffb868", 7], [CEL[0] + 2.8, 2.5, CEL[2] - 4, "#ffb868", 7], [CEL[0] - 2.8, 2.5, CEL[2], "#ffb868", 7], [CEL[0] + 2.8, 2.5, CEL[2], "#ffb868", 7], [CEL[0], 1.8, CEL[2] - 1.6, "#ffd09a", 4]], spots: [] },
      plant: { pts: [[PLT[0] - 2, 3.2, PLT[2], "#e8f0ff", 12], [PLT[0] + 2, 3.2, PLT[2], "#e8f0ff", 12], [PLT[0] + 2.8, 2.0, PLT[2] - 1.4, "#4fff8a", 1.5], [PLT[0], 1.6, PLT[2] - 1.0, "#fff4e8", 3]], spots: [] },
      lake: { pts: [[LAKE[0] - 6.5, LAKE[1] + 2.4, LAKE[2] + 1, "#ffc070", 22], [LAKE[0] - 6.5, LAKE[1] + 2.4, LAKE[2] + 8, "#ffc070", 22], [LAKE[0] + 8, LAKE[1] + 1.2, LAKE[2] - 4, "#9ad6ff", 18]], spots: [] },
      hero: { pts: [[0, 0.8, 3.0, "#ffc98e", 5], [-4.4, 3.2, 1.2, "#eef4ff", 2], [4.4, 3.2, 1.2, "#eef4ff", 2], [0, 7.4, 1.2, "#eef4ff", 2], [0, 3.2, 8, "#ffd8a8", 1.5]],
        spots: [[0, 8.6, 1.6, 0, 0, 13, "#ffc98e", 320, 30], [-22, 9, 20, 0, 3, 0, "#f2f6ff", 120, 22], [22, 9, 20, 0, 3, 0, "#f2f6ff", 120, 22]] },
      none: { pts: [], spots: [] },
    };
    const tmpV = new T.Vector3();
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      if (st.moonLightDir) { const c = K.moon.target.position; K.moon.position.fromArray(st.moonLightDir).normalize().multiplyScalar(240).add(c); }
      const inside = I("envIn", 0) > 0.5;
      scene.environment = inside ? envIn : envOut;
      if (inside) { K.hemi.color.set(I("hemiSky", "#9cc0ff")); K.hemi.groundColor.set(I("hemiGnd", "#b89a78")); } else { K.hemi.color.set("#46558a"); K.hemi.groundColor.set("#1e2226"); }
      scene.fog.color.set(inside ? "#3a3a40" : "#24304e");
      // the light pool
      const rig = RIGS[st.rig || "none"] || RIGS.none, rk = I("rigK", 1), extra = st.ptsX || [];
      const P = rig.pts.concat(extra);
      pts.forEach((L, i) => { const q = P[i]; if (!q) { L.intensity = 0; return; } L.position.set(q[0], q[1], q[2]); L.color.set(q[3]); L.intensity = q[4] * rk * (q[5] != null ? q[5] : 1); });
      spots.forEach((L, i) => { const q = rig.spots[i]; if (!q) { L.intensity = 0; return; } L.position.set(q[0], q[1], q[2]); L.target.position.set(q[3], q[4], q[5]); L.target.updateMatrixWorld(); L.color.set(q[6]); L.intensity = q[7] * rk; L.angle = (q[8] || 30) * D2R; });
      // the LED sky + its sun
      const sk = I("skyK", inside ? 1 : 0), gl = I("skyGlitch", 0);
      skyM.uniforms.t.value = t; skyM.uniforms.k.value = sk; skyM.uniforms.gl.value = gl;
      const si = I("skyI", 0) * (gl > 0 ? 0.35 + 0.65 * (Math.sin(t * 61) > 0 ? 1 : 0.2) : 1); skyL.intensity = si; skyL.shadow.autoUpdate = si > 0.001; if (si > 0.001) skyL.shadow.needsUpdate = true;
      skyL.target.position.set(AC[0], 0, AC[2] + 2); skyL.position.copy(SUN).multiplyScalar(40).add(skyL.target.position); skyL.target.updateMatrixWorld();
      causM.uniforms.t.value = t; fallM.uniforms.t.value = t; fallM.uniforms.k.value = I("fallK", 1); screenM.uniforms.t.value = t; screenM.uniforms.k.value = I("cineK", 1.2);
      ripN.offset.set(t * 0.02, t * 0.013);
      cloudM.uniforms.t.value = t; cloudM.uniforms.k.value = I("cloudK", 1);
      // door: the outer ring glow, the inner chase segments, the bolts, the wheel
      const rgk = I("ringK", 1); ringM.color.set("#f4f8ff").multiplyScalar(9 * rgk); ringHalo.material.color.set("#dfe9ff").multiplyScalar(0.9 * rgk * I("haloK", 1));
      const ch = I("ringChase", -1);
      segM.forEach((m, k) => { let v = 1; if (ch >= 0) { const head = (ch * 48 * 2) % 48; const d = ((k - head) % 48 + 48) % 48; v = d < 14 ? 1 - d / 14 : 0.15; } m.color.set("#f4f8ff").multiplyScalar(6 * v * I("segK", 1)); });
      door.rotation.y = -(I("doorA", 0)) * D2R; door.userData.wheel.rotation.z = (I("wheelA", 0)) * D2R;
      // tablet, keypad
      drawTab(st.tabScr || "home", I("tabT", 1)); tabS.material.color.setScalar(1.35 * I("tabK", 1)); tabL.intensity = 1.2 * I("tabK", 1) * (inside ? 1 : 0);
      drawKey(st.keyScr || "idle");
      dim.visible = I("dimK", 0) > 0.01; dim.userData.lab.material.opacity = I("dimK", 0);
      // koi + pellets
      fish.forEach((f, i) => { const a = t * f.sp + f.ph, r = f.r * (1 + 0.1 * Math.sin(t * 0.7 + i)); const fx = Math.cos(a) * r, fz = Math.sin(a) * r; const fe = I("feed", 0); const gx = lerp(fx, 0.3 * Math.cos(i), fe * 0.75), gz = lerp(fz, 0.3 * Math.sin(i), fe * 0.75); f.g.position.set(gx, -0.12 + 0.08 * fe, gz); f.g.rotation.y = -a + Math.PI * (fe > 0.5 ? 0.0 : 0) ; f.g.children[1] && (f.g.children[1].rotation.y = Math.sin(t * 9 + i) * 0.4); });
      const fd = I("feedT", -1);
      for (let k = 0; k < 30; k++) { if (fd < 0) { dmy.position.set(0, -10, 0); } else { const tt = fd - k * 0.03; const y = tt < 0 ? 2 : Math.max(0.03, 0.6 - 2.2 * tt * tt); dmy.position.set((hash2(k, 1, 3) - 0.5) * 0.5, tt < 0 ? -10 : y, (hash2(k, 2, 3) - 0.5) * 0.5); } dmy.scale.setScalar(1); dmy.updateMatrix(); pellets.setMatrixAt(k, dmy.matrix); }
      pellets.instanceMatrix.needsUpdate = true;
      // the jet's lights (jetK): position given as st.jetP; strobe and beacon blink
      jet.visible = I("jetK", 0) > 0.01;
      if (jet.visible) { const p = st.jetP || [0, 300, 12000]; const s = st.jetS || 4; const fw = st.jetF || [0, 0, -1];
        const side = tmpV.set(-fw[2], 0, fw[0]).normalize();
        jetW.position.set(p[0] + side.x * s * 1.5, p[1] - s * 0.4, p[2] + side.z * s * 1.5); jetW2.position.set(p[0] - side.x * s * 1.5, p[1] - s * 0.4, p[2] - side.z * s * 1.5);
        jetW.scale.setScalar(s * 0.9); jetW2.scale.setScalar(s * 0.9);
        jetR.position.set(p[0] + side.x * s * 7, p[1], p[2] + side.z * s * 7); jetG.position.set(p[0] - side.x * s * 7, p[1], p[2] - side.z * s * 7); jetR.scale.setScalar(s * 0.5); jetG.scale.setScalar(s * 0.5);
        const strobe = (t % 1.2) < 0.06 ? 1 : 0; jetS.position.set(p[0] - fw[0] * s * 5, p[1] + s * 0.6, p[2] - fw[2] * s * 5); jetS.scale.setScalar(s * 0.7 * strobe + 0.001);
        const bea = (t % 1.0) < 0.5 ? 1 : 0.15; jetB.position.set(p[0], p[1] + s * 1.0, p[2]); jetB.scale.setScalar(s * 0.45); jetB.material.color.set("#ff3a2a").multiplyScalar(8 * bea);
        jetHalo.position.set(p[0], p[1] - s * 0.4, p[2]); jetHalo.lookAt(cam.position); jetHalo.scale.setScalar(s * 16 * I("jetHalo", 1)); }
      const m2 = I("moon2K", 0); moon2.visible = moon2g.visible = m2 > 0.01;
      if (m2 > 0.01) { const d = st.moon2Dir || [0.25, 0.47, -0.85]; tmpV.set(d[0], d[1], d[2]).normalize().multiplyScalar(9000).add(cam.position); moon2.position.copy(tmpV); moon2.lookAt(cam.position); moon2.scale.setScalar(st.moon2Size || 300); moon2g.position.copy(tmpV); moon2g.lookAt(cam.position); moon2g.scale.setScalar((st.moon2Size || 300) * 6); }
      // eyes
      const ek = I("eyesK", 0), gth = I("eyesGather", 0), es = I("eyesScale", 1), bl = I("eyesBlink", 0);
      eyeIM.visible = ek > 0.01; eyeM.color.set("#ff2412").multiplyScalar(16 * I("eyesI", 1));
      if (eyeIM.visible) { eyes.forEach((e, i) => { const on = ek > e.ap; const x = lerp(e.a[0], e.b[0], gth), z = lerp(e.a[1], e.b[1], gth); const y = nearH(x, z) + 1.6; const b2 = bl > 0 && Math.sin(t * 1.1 + e.ph) > 0.97; for (let j = 0; j < 2; j++) { dmy.position.set(x + (j ? 0.08 : -0.08) * es, y, z); dmy.scale.setScalar(on && !b2 ? es : 0.0001); dmy.updateMatrix(); eyeIM.setMatrixAt(i * 2 + j, dmy.matrix); } }); eyeIM.instanceMatrix.needsUpdate = true; }
    });

    return { door, collar, atr, tun, kit, cin, pan, cel, plt, lake, sea, jet, rice, part, tree, koi, signG, portG, L0, L1, RIGS, pts, spots, skyL, nearH,
      P: { DC, DR, AC, AR, G1, G2, DOME, POOL, LOUNGE, TABLET, LEMON, KOI, KIT, CIN, PAN, CEL, PLT, LAKE, HELI, PORTRAIT, SIGN, KEYP, RICE, SEATS, LAD, CINEMA_TH } };
  }

  // ---------------------------------------------------------------- Grace: caretaker, 38 (batch-7 rig options + a re-dress)
  const GRACE = {
    skin: "#7a4e37", skinSheen: "#d89a78", earIn: "#5a3424", lip: "#6e3a32", iris: [[66, 40, 24], [30, 18, 10]],
    face: { w: 0.96, len: 1.07, jaw: 0.16, jawW: 0.03, chin: 0.07, cheek: 0.008, eyeX: 0.0355, eyeY: 0.0128, eyeS: 1.02, lid: -2,
      nose: 1.12, noseW: 1.32, noseL: 0.94, browT: 0.8, browY: 0.005, browArch: 1.55, browIn: -0.001, lipW: 1.08, lipT: 1.38, lipY: -0.001, lipLo: -0.000456 },
    hairStyle: "bob", part: -1, hair: "#2e2824", hairStreaks: ["rgba(214,214,222,0.62)", "rgba(20,16,14,0.45)", "rgba(120,118,124,0.4)"], hairSheen: "#9a9aa6",
    brow: "#2a1e18", pony: false, fringe: false,
    jacket: "#4c2d55", jacketSheen: "#8f6e9c", jacketRough: 0.95, trim: "#33203b", trimSheen: "#7a6284", seam: "#3a2442",
    pants: "#34363c", pantsSheen: "#70747e", boot: "#2a2624", sole: "#d8d4cc", under: "#c9c2b6", chestPocket: true, handPockets: true,
  };
  function dressGrace(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, sp = hz.spine, surf = hz.surf;
    // fleece: a fuzzy pile normal on the jacket + quilted-free seams; a contrast zip garage; a lanyard with a key card
    const pile = K.heightNormal("grace_pile", 128, (x, y) => K.vnoise(x / 1.5, y / 1.5, 4) * 0.7 + K.hash2(x, y, 8) * 0.3, 3.5);
    for (const m of [hz.mats.jacket, hz.mats.sleeveM]) { m.normalMap = K.nmap(pile, 14, 14); m.normalScale.set(0.6, 0.6); m.sheen = 1.0; m.sheenRoughness = 0.8; m.roughness = 0.95; }
    K.rod([-0.05, 0.53, hz.frontZ(0.53) + 0.004], [0.0, 0.28, hz.frontZ(0.28) + 0.012], 0.0035, mat("#2a5a8a", { rough: 0.6 }), sp, 6);
    K.rod([0.05, 0.53, hz.frontZ(0.53) + 0.004], [0.0, 0.28, hz.frontZ(0.28) + 0.012], 0.0035, mat("#2a5a8a", { rough: 0.6 }), sp, 6);
    const card = G({ y: 0.25, z: hz.frontZ(0.25) + 0.012 }, sp); M(K.rbox(0.05, 0.075, 0.003, 0.006), mat("#f4f4f2", { rough: 0.4 }), {}, card); M(K.box(0.04, 0.012, 0.001), mat("#2a5a8a"), { y: 0.022, z: 0.002, cast: false }, card);
    // small embroidered patch on her chest: a key (a caretaker, no logo)
    const pt = K.canvasTex("grace_patch", 128, 64, (q, w, h) => { q.fillStyle = "#3e2448"; q.fillRect(0, 0, w, h); q.strokeStyle = "#e8d8f0"; q.lineWidth = 5; q.beginPath(); q.arc(36, 32, 13, 0, 7); q.stroke(); q.fillStyle = "#e8d8f0"; q.fillRect(48, 29, 56, 6); q.fillRect(88, 35, 6, 10); q.fillRect(100, 35, 6, 8); });
    const pp = surf(0.33, 0.42, 1.03); M(new T.PlaneGeometry(0.06, 0.03), mat("#ffffff", { map: pt, rough: 0.8 }), { x: pp[0] - 0.06, y: pp[1], z: pp[2] + 0.003, ry: 18, cast: false }, sp);
    // tools: microfibre cloth (right), feather duster (right), fish food shaker (right), a pen (right), notebook (left), a wine glass (left)
    const cloth = new T.Group(); { const g = new T.SphereGeometry(0.05, 12, 8); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) pa.setXYZ(i, pa.getX(i) * (1 + 0.3 * Math.sin(pa.getY(i) * 90)), pa.getY(i) * 0.6, pa.getZ(i) * 1.2); g.computeVertexNormals(); M(g, K.pmat("#f2c230", { rough: 1, sheen: 1, sheenColor: "#fff2a0" }), {}, cloth); } cloth.position.set(0, -0.09, 0.02); hz.tool("cloth", cloth, 0);
    const duster = new T.Group(); M(K.cyl(0.008, 0.01, 0.3, 8), mat("#6a4a2e", { rough: 0.6 }), { y: 0.1 }, duster); { const fg = new T.SphereGeometry(0.07, 14, 10); fg.scale(0.8, 1.6, 0.8); M(fg, K.pmat("#e6dccc", { rough: 1, sheen: 1, sheenColor: "#ffffff" }), { y: 0.32 }, duster); } duster.position.set(0, -0.08, 0.03); duster.rotation.x = 0.3; hz.tool("duster", duster, 0);
    const shaker = new T.Group(); M(K.cyl(0.025, 0.025, 0.1, 14), mat("#e8a020", { rough: 0.5 }), {}, shaker); M(K.cyl(0.026, 0.026, 0.02, 14), mat("#f4f4f2", { rough: 0.4 }), { y: 0.06 }, shaker); shaker.position.set(0, -0.08, 0.03); shaker.rotation.x = 1.3; hz.tool("shaker", shaker, 0);
    const pen = new T.Group(); M(K.cyl(0.004, 0.004, 0.13, 8), mat("#c9a35a", { metal: 0.45, rough: 0.3 }), { rx: 90, z: 0.03 }, pen); pen.position.set(0, -0.075, 0.02); hz.tool("pen", pen, 0);
    const nbT = K.textTex("grace_plan", 256, 192, (q, w, h) => { q.fillStyle = "#f4efe2"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,80,140,0.35)"; for (let y = 22; y < h; y += 14) q.fillRect(10, y, w - 20, 1); q.fillStyle = "#1c2036"; q.font = "600 15px KitInter, sans-serif"; ["PLAN", "shelter  ✓", "food  ✓", "revenge  ✓"].forEach((s, i) => q.fillText(s, 16, 36 + i * 28)); });
    const nb = new T.Group(); M(K.box(0.2, 0.004, 0.15), mat("#ffffff", { map: nbT, rough: 0.9 }), {}, nb); M(K.box(0.205, 0.006, 0.155), mat("#1d4a6a", { rough: 0.7 }), { y: -0.004 }, nb); nb.position.set(0.0, -0.12, 0.05); nb.rotation.set(1.45, 0, 0.25); hz.tool("notebook", nb, 1);
    const wine = new T.Group(); { const gl = new T.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.3, envMapIntensity: 1.6 }); M(K.cyl(0.035, 0.022, 0.07, 16), gl, { y: 0.07 }, wine); M(K.cyl(0.03, 0.022, 0.03, 16), mat("#5a0a14", { rough: 0.2 }), { y: 0.055 }, wine); M(K.cyl(0.004, 0.004, 0.07, 6), gl, { y: 0.0 }, wine); } wine.position.set(0.0, -0.08, 0.04); hz.tool("wine", wine, 1);
    // the owner's monogrammed bathrobe (st robe: 0 off .. 1 on): a long terry shell over her fleece, shawl collar, belt, crest
    const robe = G({}, sp);
    const terryN = K.heightNormal("grace_terry", 128, (x, y) => (K.hash2(x, y, 3) > 0.5 ? 1 : 0) * 0.6 + K.vnoise(x / 2, y / 2, 5) * 0.4, 3.0);
    const terry = K.pmat("#f4f0e8", { rough: 1, sheen: 1, sheenColor: "#ffffff", normalMap: K.nmap(terryN, 16, 16), ns: 0.6 });
    const RT = hz.TOR.map((r) => [r[0], r[1] * 1.07 + 0.006, r[2] * 1.08 + 0.006, r[3]]);
    M(K.sweepGeo([[-0.62, 0.21, 0.165, 0.0], [-0.4, 0.2, 0.155, 0.0], [-0.2, 0.19, 0.145, 0.0], ...RT.filter((r) => r[0] > -0.1 && r[0] < 0.5)], 48, { n: 2.4 }), terry, {}, robe);
    const collarPts = []; for (let k = 0; k <= 24; k++) { const u = k / 24, a = lerp(-1.05, 1.05, u); const y = 0.5 - Math.abs(Math.sin(a * 1.5)) * 0.0 + (1 - Math.abs(a)) * -0.18; collarPts.push(surf(Math.max(0.2, y + 0.05), a + Math.PI * (a > 0 ? 0 : 0), 1.13)); }
    for (const s of [-1, 1]) { const pts = []; for (let y = 0.5; y >= 0.12; y -= 0.04) pts.push(surf(y, s * lerp(0.95, 0.12, (0.5 - y) / 0.38), 1.12)); M(K.tubeGeo(pts, 24, 8, () => 0.022, { squash: () => 0.45 }), terry, {}, robe); M(K.tubeGeo(pts, 24, 6, () => 0.004), mat("#c9a35a", { metal: 0.45, rough: 0.3 }), { cast: false }, robe); }
    const belt = []; for (let a = -3.1; a <= 3.1; a += 0.1) belt.push(surf(0.04, a, 1.13)); M(K.tubeGeo(belt, 64, 8, () => 0.018, { squash: () => 0.5 }), terry, {}, robe);
    for (const s of [-1, 1]) K.rod([0.02 * s, 0.04, hz.frontZ(0.04) + 0.03], [0.06 * s, -0.16, hz.frontZ(0.04) + 0.05], 0.014, terry, robe, 8);
    const crestT = K.canvasTex("grace_crest", 128, 128, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = "#c9a35a"; q.fillStyle = "#c9a35a"; q.lineWidth = 6; q.beginPath(); q.moveTo(24, 20); q.lineTo(104, 20); q.lineTo(104, 70); q.quadraticCurveTo(104, 104, 64, 120); q.quadraticCurveTo(24, 104, 24, 70); q.closePath(); q.stroke(); q.font = "700 54px Georgia, serif"; q.textAlign = "center"; q.fillText("V", 64, 86); q.fillRect(44, 4, 40, 8); });
    const cp = surf(0.3, 0.5, 1.13); M(new T.PlaneGeometry(0.065, 0.065), new T.MeshStandardMaterial({ map: crestT, transparent: true, roughness: 0.5, metalness: 0.3 }), { x: cp[0], y: cp[1], z: cp[2] + 0.004, ry: 22, cast: false }, robe);
    for (const a of hz.arms) { const sl = G({}, a.sh); M(K.sweepGeo([[-0.3, 0.066, 0.068, 0.0], [-0.1, 0.07, 0.072, 0.0], [0.03, 0.072, 0.074, 0.0]], 22), terry, {}, sl); const sl2 = G({}, a.el); M(K.sweepGeo([[-0.26, 0.068, 0.07, 0.0], [-0.1, 0.064, 0.066, 0.0], [0.02, 0.064, 0.066, 0.0]], 22), terry, {}, sl2); robe.userData.sl = (robe.userData.sl || []).concat([sl, sl2]); }
    robe.visible = false; (robe.userData.sl || []).forEach((o) => (o.visible = false));
    Object.assign(hz.POSES, {
      polish: { arms: [[-58, 16, -34], [-50, -18, -36]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [22, 0], curl: [70, 60] },
      dust: { arms: [[-118, 12, -38], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-4, 0], curl: [75, 30] },
      feed: { arms: [[-62, 10, -22], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [14, 0], curl: [70, 30] },
      tap: { arms: [[-74, 12, -40], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [35, 30] },
      lid: { arms: [[-50, 14, -34], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [10, 0], curl: [30, 30] },
      keypad: { arms: [[-66, 16, -58], [4, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [40, 30] },
      tie: { arms: [[-30, 20, -88], [-30, -20, -88]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [80, 80] },
      lounge: { arms: [[-30, 20, -60], [-8, -14, -28]], legs: [[-60, 6], [-58, 10]], hipY: 0.48, spine: [-44, 0], curl: [60, 50] },
      recline: { arms: [[-20, 18, -40], [-26, -24, -64]], legs: [[-70, 20], [-66, 26]], hipY: 0.52, spine: [-30, 0], curl: [40, 60] },
      armsx: { arms: [[-28, 24, -100], [-26, -24, -104]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-2, 0], curl: [70, 70] },
    });
    return { robe, setRobe(k) { robe.visible = k > 0.5; (robe.userData.sl || []).forEach((o) => (o.visible = k > 0.5)); } };
  }

  S.bunker = bunker;
  S.bunker.CREATE = CREATE;
  S.bunker.GRACE = GRACE;
  S.bunker.dressGrace = dressGrace;
})();
