/* rh3d-rooms.js — sets for calm story reels on the realistic kit (needs rh3d-core, rh3d-mannequin, rh3d-props).
 *
 *   const R = RH3D.bedroom(K, {});   R.state("evening" | "future" | "morning", k?)   one room, three lives
 *     R.sun / R.moon / R.lamp / R.city      lights (the sun and the moon come in through the window and light the haze)
 *     R.clock.set("03:07")  R.calendar("2036")  R.mirror = { x, z0, z1 }  R.bed = { top, x0, x1, z0, z1 }
 *   const O = RH3D.office(K, { origin: [30, 0, 0], worker })   cubicle rows at night, faceless grey workers (instanced)
 *   const C = RH3D.crowd(K, { origin: [-30, 0, 0], figure, n })  a field of faceless grey figures in fog (instanced)
 *   RH3D.mirrorDouble(man2, p, planeX)     pose a second mannequin as the reflection of pose p (scale.x = -1)
 *   RH3D.photo(K, cam, w, h, expo)         render one still from the scene into a canvas (the phone's old photo)
 *
 * Bedroom layout (metres, origin at the floor centre): walls x ±2.1, z ±2.4, height 2.7. Window on the back wall
 * (z −2.4) x −0.5…1.1, sill 0.85, head 2.35. Bed: headboard on the left wall, x −2.05…−0.05, z −1.55…0.05, top 0.55.
 * Nightstand (lamp, clock) at (−1.82, 0.5). Desk under the right of the window. Wardrobe on the right wall with a
 * full-length mirror in its front (plane x = R.mirror.x = 1.485, z 0.6…1.2, y 0.12…1.9): a hole into a mirrored room
 * where the reflection double stands. A figure at the mirror leans to ~0.24 m from the glass, so a reflection
 * close-up has to come in about 30° off the mirror's axis (straight behind him, his own head blocks it).
 */
(function () {
  const RH3D = window.RH3D;
  const FONT = '"MontserratRH", "Montserrat", Arial, sans-serif';

  function plankTex(K) {
    return K.canvasTex("bed-floor", 1024, 1024, (g, w, h) => {
      const r = RH3D.rng(77);
      const rows = 9;
      for (let j = 0; j < rows; j++) {
        let x = -r() * 300;
        while (x < w) {
          const len = 260 + r() * 360, tone = 150 + r() * 40;
          g.fillStyle = `rgb(${tone + 40},${tone + 6},${tone - 40})`; g.fillRect(x, j * h / rows, len, h / rows);
          for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(80,50,25,${0.05 + r() * 0.08})`; g.lineWidth = 1 + r() * 2; const yy = j * h / rows + r() * h / rows; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + (r() - 0.5) * 8, x + len * 0.6, yy + (r() - 0.5) * 8, x + len, yy + (r() - 0.5) * 6); g.stroke(); }
          g.fillStyle = "rgba(40,25,12,0.6)"; g.fillRect(x, j * h / rows, 2, h / rows);
          x += len;
        }
        g.fillStyle = "rgba(40,25,12,0.55)"; g.fillRect(0, j * h / rows, w, 2);
      }
    }, { repeat: [2.2, 2.6] });
  }
  function plasterTex(K) {
    const f = K.noiseField(256, 256, 31, 5, 4);
    return K.canvasTex("plaster", 256, 256, (g, w, h) => {
      const img = g.createImageData(w, h), d = img.data;
      for (let i = 0; i < w * h; i++) { const v = 235 + (f[i] - 0.5) * 22; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
      g.putImageData(img, 0, 0);
    }, { repeat: [3, 2] });
  }
  /** sky textures seen through the window */
  function skyTex(K, kind) {
    return K.canvasTex("sky-" + kind, 1024, 640, (g, w, h) => {
      const r = RH3D.rng(kind.length * 13);
      const gr = g.createLinearGradient(0, 0, 0, h);
      if (kind === "morning") { gr.addColorStop(0, "#7fb3e6"); gr.addColorStop(0.55, "#cfe1ef"); gr.addColorStop(0.8, "#ffe2b8"); gr.addColorStop(1, "#ffd59a"); }
      else if (kind === "evening") { gr.addColorStop(0, "#1b2140"); gr.addColorStop(0.6, "#4a3d62"); gr.addColorStop(0.85, "#c0796a"); gr.addColorStop(1, "#e3a774"); }
      else { gr.addColorStop(0, "#03050c"); gr.addColorStop(0.6, "#0b1226"); gr.addColorStop(1, "#1a2140"); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (kind === "morning") {
        const sg = g.createRadialGradient(w * 0.72, h * 0.62, 0, w * 0.72, h * 0.62, h * 0.55); sg.addColorStop(0, "rgba(255,248,225,1)"); sg.addColorStop(0.15, "rgba(255,236,190,0.8)"); sg.addColorStop(1, "rgba(255,220,160,0)");
        g.fillStyle = sg; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 9; i++) { const x = r() * w, y = h * (0.15 + r() * 0.35), rx = 80 + r() * 160; g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(x, y, rx, rx * 0.22, 0, 0, 7); g.fill(); }
      }
      if (kind === "future" || kind === "night") {
        for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(220,230,255,${0.2 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.6, 1.5, 1.5); }
        const mg = g.createRadialGradient(w * 0.3, h * 0.22, 0, w * 0.3, h * 0.22, 70); mg.addColorStop(0, "rgba(235,240,255,1)"); mg.addColorStop(0.25, "rgba(220,230,255,0.9)"); mg.addColorStop(0.3, "rgba(160,180,230,0.25)"); mg.addColorStop(1, "rgba(120,140,200,0)");
        g.fillStyle = mg; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 5; i++) { const x = r() * w, y = h * (0.1 + r() * 0.4); g.fillStyle = "rgba(20,26,48,0.6)"; g.beginPath(); g.ellipse(x, y, 140 + r() * 120, 22, 0, 0, 7); g.fill(); }
      }
    });
  }
  /** a city skyline strip: dark blocks with lit windows (night) or hazy blocks (morning) */
  function skylineTex(K, kind) {
    return K.canvasTex("skyline-" + kind, 1024, 256, (g, w, h) => {
      const r = RH3D.rng(91);
      g.clearRect(0, 0, w, h);
      let x = 0;
      while (x < w) {
        const bw = 40 + r() * 90, bh = 60 + r() * 170;
        g.fillStyle = kind === "morning" ? `rgba(${150 + r() * 30},${165 + r() * 25},${185 + r() * 20},0.85)` : `rgb(${8 + r() * 8},${10 + r() * 8},${18 + r() * 10})`;
        g.fillRect(x, h - bh, bw, bh);
        if (kind !== "morning") for (let yy = h - bh + 8; yy < h - 6; yy += 10) for (let xx = x + 5; xx < x + bw - 6; xx += 9) if (r() < 0.22) { g.fillStyle = r() < 0.8 ? "#ffd58a" : "#cfe6ff"; g.fillRect(xx, yy, 4, 5); }
        x += bw + 2;
      }
    }, { clamp: true });
  }
  function posterTex(K, seed, hue) {
    return K.canvasTex("poster" + seed, 256, 360, (g, w, h) => {
      const r = RH3D.rng(seed);
      g.fillStyle = `hsl(${hue},45%,82%)`; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) { g.fillStyle = `hsla(${(hue + i * 40) % 360},70%,${45 + r() * 20}%,0.9)`; g.beginPath(); g.arc(r() * w, r() * h * 0.8, 30 + r() * 70, 0, 7); g.fill(); }
      g.fillStyle = "rgba(30,30,30,0.85)"; g.font = `800 30px ${FONT}`; g.fillText(["MOVE", "BUILD", "DAY ONE", "GO"][seed % 4], 18, h - 26);
    });
  }

  function bedroom(K, o) {
    o = o || {};
    const T = K.T, R = {};
    const W2 = 2.1, D2 = 2.4, H = 2.7;
    const wx0 = -0.5, wx1 = 1.1, wy0 = 0.85, wy1 = 2.35;
    const g = K.G({ name: "bedroom" });
    R.group = g;
    // floor (varnished oak, faint reflections), walls, ceiling
    const fl = plankTex(K);
    const floorRough = K.canvasTex("bed-floorR", 64, 64, (gg, w, h) => { gg.fillStyle = "rgb(105,105,105)"; gg.fillRect(0, 0, w, h); }, { linear: true });
    R.floorM = K.mat("#ffffff", { map: fl, roughMap: floorRough, rough: 1, env: 0.4, unique: true });
    K.wetFloor(R.floorM, { wetBelow: 0.48, blur: 22, distort: 0.01, gain: 0.55 });
    K.M(new T.PlaneGeometry(W2 * 2, D2 * 2), R.floorM, { rx: -90, layer: K.LAYER.FLOOR, cast: false }, g);
    const pl = plasterTex(K);
    R.wallM = K.mat("#d9d2c5", { map: pl, rough: 0.92, env: 0.5, unique: true });
    const wall = (w, h, p) => K.M(new T.PlaneGeometry(w, h), R.wallM, p, g);
    wall(D2 * 2, H, { x: -W2, y: H / 2, ry: 90 }); wall(W2 * 2, H, { z: D2, y: H / 2, ry: 180 });
    // right wall in pieces around the mirror opening (the reflection double is seen through it)
    const mz0 = 0.6, mz1 = 1.2, my0 = 0.12, my1 = 1.9;
    wall(mz0 + D2, H, { x: W2, y: H / 2, z: (-D2 + mz0) / 2, ry: -90 });
    wall(D2 - mz1, H, { x: W2, y: H / 2, z: (mz1 + D2) / 2, ry: -90 });
    wall(mz1 - mz0, my0, { x: W2, y: my0 / 2, z: (mz0 + mz1) / 2, ry: -90 });
    wall(mz1 - mz0, H - my1, { x: W2, y: (H + my1) / 2, z: (mz0 + mz1) / 2, ry: -90 });
    // back wall around the window opening
    wall(wx0 + W2, H, { x: (-W2 + wx0) / 2, y: H / 2, z: -D2 });
    wall(W2 - wx1, H, { x: (wx1 + W2) / 2, y: H / 2, z: -D2 });
    wall(wx1 - wx0, wy0, { x: (wx0 + wx1) / 2, y: wy0 / 2, z: -D2 });
    wall(wx1 - wx0, H - wy1, { x: (wx0 + wx1) / 2, y: (H + wy1) / 2, z: -D2 });
    // window reveals (wall thickness 0.18)
    const rev = K.mat("#d8d2c6", { rough: 0.9 });
    K.M(K.box(0.02, wy1 - wy0, 0.18), rev, { x: wx0, y: (wy0 + wy1) / 2, z: -D2 - 0.09 }, g);
    K.M(K.box(0.02, wy1 - wy0, 0.18), rev, { x: wx1, y: (wy0 + wy1) / 2, z: -D2 - 0.09 }, g);
    K.M(K.box(wx1 - wx0, 0.04, 0.24), K.mat("#e8e4dc", { rough: 0.6 }), { x: (wx0 + wx1) / 2, y: wy0, z: -D2 - 0.06 }, g);
    K.M(K.box(wx1 - wx0, 0.02, 0.18), rev, { x: (wx0 + wx1) / 2, y: wy1, z: -D2 - 0.09 }, g);
    const frameM = K.mat("#f2efe9", { rough: 0.45 });
    const fz = -D2 - 0.12;
    for (const x of [wx0 + 0.03, (wx0 + wx1) / 2, wx1 - 0.03]) K.M(K.box(0.05, wy1 - wy0, 0.06), frameM, { x, y: (wy0 + wy1) / 2, z: fz }, g);
    for (const y of [wy0 + 0.03, 1.75, wy1 - 0.03]) K.M(K.box(wx1 - wx0, 0.05, 0.06), frameM, { x: (wx0 + wx1) / 2, y, z: fz }, g);
    const glassM = K.mat("#c9d6dc", { phys: true, rough: 0.03, transparent: true, opacity: 0.08, clearcoat: 1, env: 1.2, depthWrite: false });
    K.M(new T.PlaneGeometry(wx1 - wx0, wy1 - wy0), glassM, { x: (wx0 + wx1) / 2, y: (wy0 + wy1) / 2, z: fz, cast: false, layer: K.LAYER.NODEPTH, ro: 3 }, g);
    const ceil = K.M(new T.PlaneGeometry(W2 * 2, D2 * 2), K.fixtureGlow(K.mat("#eeeae4", { rough: 0.95, unique: true })), { y: H, rx: 90, cast: false }, g);
    // outside: sky + skyline (unlit), swapped per state
    R.skyM = K.glow("#ffffff", 1.0, { map: skyTex(K, "evening") });
    K.M(new T.PlaneGeometry(16, 10), R.skyM, { x: 0.3, y: 3.2, z: -8, cast: false, receive: false }, g);
    R.skylineM = K.glow("#ffffff", 1.0, { map: skylineTex(K, "night"), transparent: true });
    K.M(new T.PlaneGeometry(14, 3.5), R.skylineM, { x: 0.3, y: 0.4, z: -7.6, cast: false, receive: false }, g);
    R.skyTex = { evening: skyTex(K, "evening"), future: skyTex(K, "future"), morning: skyTex(K, "morning") };
    R.skylineTex = { night: skylineTex(K, "night"), morning: skylineTex(K, "morning") };
    // curtains (linen panels with soft folds)
    const foldN = K.canvasTex("folds", 128, 16, (gg, w, h) => { for (let x = 0; x < w; x++) { const n = Math.sin(x / w * Math.PI * 10); gg.fillStyle = `rgb(${Math.round(128 + n * 90)},128,${Math.round(230 - Math.abs(n) * 30)})`; gg.fillRect(x, 0, 1, h); } }, { linear: true });
    R.curtainM = K.mat("#e6dfd2", { normalMap: foldN, rough: 0.95, side: T.DoubleSide, unique: true, sheen: 0.4 });
    R.curtains = [-1, 1].map((sd) => K.M(new T.PlaneGeometry(0.55, 2.3), R.curtainM, { x: sd < 0 ? wx0 - 0.15 : wx1 + 0.15, y: 1.42, z: -D2 + 0.07 }, g));
    K.M(K.cyl(0.012, 0.012, 2.6, 8), K.mat("#3a3a3a", { metal: 0.6, rough: 0.4 }), { x: 0.3, y: 2.55, z: -D2 + 0.07, rz: 90, cast: false }, g);
    // bed
    const bx0 = -2.05, bx1 = -0.05, bz0 = -1.55, bz1 = 0.05;
    R.bed = { top: 0.55, x0: bx0, x1: bx1, z0: bz0, z1: bz1 };
    const woodM = K.mat("#6b4a32", { rough: 0.55 });
    K.M(K.rbox(bx1 - bx0, 0.28, bz1 - bz0, 0.03), woodM, { x: (bx0 + bx1) / 2, y: 0.18, z: (bz0 + bz1) / 2 }, g);
    K.M(K.rbox(0.08, 1.05, bz1 - bz0 + 0.06, 0.03), woodM, { x: bx0 + 0.02, y: 0.62, z: (bz0 + bz1) / 2 }, g);
    K.M(K.rbox(bx1 - bx0 - 0.1, 0.2, bz1 - bz0 - 0.06, 0.08), K.mat("#ece8e1", { rough: 0.9 }), { x: (bx0 + bx1) / 2 + 0.03, y: 0.42, z: (bz0 + bz1) / 2 }, g);
    // duvet: a soft lumpy slab (vertex-displaced box)
    const dv = new T.BoxGeometry(1.55, 0.12, 1.66, 24, 2, 24);
    const pa = dv.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); if (y > 0) pa.setY(i, y + 0.035 * Math.sin(x * 7.3) * Math.cos(z * 5.1) + 0.02 * Math.sin(x * 17 + z * 11)); if (Math.abs(z) > 0.8) pa.setY(i, pa.getY(i) - 0.05); }
    dv.computeVertexNormals();
    R.duvetM = K.mat("#b0835a", { rough: 0.95, sheen: 0.6, sheenHex: "#ffffff", unique: true });
    R.duvet = K.M(dv, R.duvetM, { x: (bx0 + bx1) / 2 + 0.2, y: 0.56, z: (bz0 + bz1) / 2 }, g);
    R.pillowM = K.mat("#f1ede6", { rough: 0.95, sheen: 0.5, unique: true });
    for (const z of [-1.15, -0.35]) K.M(K.rbox(0.42, 0.62, 0.16, 0.07, 0.03), R.pillowM, { x: bx0 + 0.32, y: 0.66, z, rx: 90, rz: 8 }, g);
    // nightstand + lamp + clock
    const ns = K.G({ x: -1.82, z: 0.5 }, g);
    K.M(K.rbox(0.44, 0.5, 0.42, 0.02), woodM, { y: 0.25 }, ns);
    K.M(K.cyl(0.07, 0.09, 0.03, 18), K.mat("#2c2c2c"), { y: 0.515 }, ns);
    K.M(K.cyl(0.012, 0.012, 0.28, 8), K.mat("#b08d57", { metal: 0.8, rough: 0.3 }), { y: 0.66 }, ns);
    R.shadeM = K.mat("#efe6d4", { rough: 0.9, side: T.DoubleSide, emi: "#ffb86a", emiI: 0, unique: true });
    K.M(K.cyl(0.1, 0.15, 0.2, 24, true), R.shadeM, { y: 0.86, cast: false }, ns);
    R.bulbM = K.glow("#ffd9a6", 0); K.M(K.sph(0.035, 12, 8), R.bulbM, { y: 0.83, cast: false }, ns);
    R.lamp = K.light.point({ pos: [-1.82, 0.86, 0.5], color: "#ffc98a", I: 0, range: 6, vol: 0.6 });
    R.clock = RH3D.seg7(K, "bed-clock", { text: "21:40", color: "#ff4a2a" });
    const ck = K.G({ x: -1.72, y: 0.56, z: 0.63, ry: 70 }, g);
    K.M(K.rbox(0.18, 0.08, 0.07, 0.015), K.mat("#141414", { rough: 0.4 }), {}, ck);
    K.M(new T.PlaneGeometry(0.15, 0.055), K.glow("#ffffff", 2.4, { map: R.clock.tex }), { z: 0.036, cast: false }, ck);
    // desk + chair + things
    const dk = K.G({ x: 1.65, z: -2.05 }, g);
    K.M(K.box(0.8, 0.04, 0.6), woodM, { y: 0.74 }, dk);
    for (const [x, z] of [[-0.36, -0.26], [0.36, -0.26], [-0.36, 0.26], [0.36, 0.26]]) K.M(K.box(0.04, 0.72, 0.04), K.mat("#2b2b2b", { metal: 0.5, rough: 0.4 }), { x, y: 0.36, z }, dk);
    K.M(K.box(0.34, 0.015, 0.24), K.mat("#2a2c30", { metal: 0.6, rough: 0.35 }), { x: -0.1, y: 0.77, z: 0.02 }, dk);
    for (let i = 0; i < 4; i++) K.M(K.box(0.18, 0.035, 0.25), K.mat(["#7a3b2e", "#2e4a6b", "#d8c9a3", "#3f6b4a"][i]), { x: 0.24, y: 0.78 + i * 0.036, z: 0.05, ry: i * 7 }, dk);
    const chair = K.G({ x: 1.6, z: -1.45, ry: 160 }, g);
    K.M(K.box(0.42, 0.04, 0.42), K.mat("#3b3b3d", { rough: 0.6 }), { y: 0.46 }, chair);
    K.M(K.box(0.42, 0.45, 0.04), K.mat("#3b3b3d", { rough: 0.6 }), { y: 0.7, z: -0.2 }, chair);
    for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) K.M(K.cyl(0.015, 0.015, 0.45, 8), K.mat("#222"), { x, y: 0.22, z }, chair);
    R.laundry = K.M(K.sph(0.22, 14, 10), K.mat("#5d6066", { rough: 1 }), { y: 0.55, sy: 0.45 }, chair);
    // plant (lush / dead)
    const pt = K.G({ x: 1.85, z: -0.9 }, g);
    K.M(K.cyl(0.13, 0.1, 0.26, 18), K.mat("#c56a42", { rough: 0.8 }), { y: 0.13 }, pt);
    R.leafM = K.mat("#4f8a3c", { rough: 0.7, side: T.DoubleSide, unique: true });
    R.leaves = [];
    for (let i = 0; i < 9; i++) { const a = i * 2.3, l = K.M(K.sph(0.1, 10, 6), R.leafM, { x: Math.cos(a) * 0.08, y: 0.42 + (i % 3) * 0.12, z: Math.sin(a) * 0.08, sx: 0.45, sy: 1.7, sz: 0.12, rx: Math.cos(a) * 30, rz: Math.sin(a) * 30 }, pt); R.leaves.push(l); }
    // posters + calendar
    R.posters = [K.M(new T.PlaneGeometry(0.5, 0.7), K.mat("#ffffff", { map: posterTex(K, 1, 30), rough: 0.6 }), { x: W2 - 0.01, y: 1.65, z: -0.9, ry: -90 }, g),
      K.M(new T.PlaneGeometry(0.42, 0.59), K.mat("#ffffff", { map: posterTex(K, 2, 190), rough: 0.6 }), { x: -0.9, y: 1.7, z: D2 - 0.01, ry: 180 }, g)];
    const calTex = (yr) => K.canvasTex("cal" + yr, 256, 320, (gg, w, h) => { gg.fillStyle = "#f6f3ec"; gg.fillRect(0, 0, w, h); gg.fillStyle = yr === "2036" ? "#5a5f66" : "#d0473a"; gg.fillRect(0, 0, w, 86); gg.fillStyle = "#ffffff"; gg.font = `900 58px ${FONT}`; gg.textAlign = "center"; gg.fillText(yr, w / 2, 64); gg.fillStyle = "#333"; gg.font = `700 18px ${FONT}`; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) gg.fillText(String(1 + r * 7 + c > 30 ? "" : 1 + r * 7 + c), 22 + c * 35, 120 + r * 40); });
    R.calTex = { "2026": calTex("2026"), "2036": calTex("2036") };
    R.calM = K.mat("#ffffff", { map: R.calTex["2026"], rough: 0.7, unique: true });
    K.M(new T.PlaneGeometry(0.3, 0.375), R.calM, { x: W2 - 0.01, y: 1.45, z: -1.75, ry: -90, cast: false }, g);
    R.calendar = (yr) => { R.calM.map = R.calTex[yr]; R.calM.needsUpdate = true; };
    // rug
    R.rugM = K.mat("#c98a5a", { rough: 1, unique: true });
    K.M(new T.CircleGeometry(0.9, 48), R.rugM, { x: 0.5, y: 0.004, z: 0.2, rx: -90, cast: false, layer: K.LAYER.FLOOR }, g);
    // wardrobe + full-length mirror on the right wall; behind it a dim mirrored room for the reflection
    const wd = K.G({ x: W2 - 0.31, z: 0.9 }, g);
    const wdM = K.mat("#e9e5de", { rough: 0.7 });
    K.M(K.box(0.6, 2.2, 0.4), wdM, { y: 1.1, z: -0.5 }, wd); K.M(K.box(0.6, 2.2, 0.4), wdM, { y: 1.1, z: 0.5 }, wd);
    K.M(K.box(0.6, 0.3, 0.6), wdM, { y: 2.05, z: 0 }, wd); K.M(K.box(0.6, 0.12, 0.6), wdM, { y: 0.06, z: 0 }, wd);
    R.mirror = { x: W2 - 0.615, z0: 0.6, z1: 1.2, y0: 0.12, y1: 1.9 };
    const mirM = K.mat("#b8c4c8", { phys: true, rough: 0.05, transparent: true, opacity: 0.1, clearcoat: 1, ccRough: 0.02, env: 1.6, depthWrite: false });
    K.M(new T.PlaneGeometry(0.6, 1.78), mirM, { x: R.mirror.x, y: 1.01, z: 0.9, ry: -90, cast: false, layer: K.LAYER.NODEPTH, ro: 4 }, g);
    const mfM = K.mat("#2d2d2d", { metal: 0.6, rough: 0.4 });
    K.M(K.box(0.03, 1.84, 0.03), mfM, { x: R.mirror.x + 0.01, y: 1.01, z: 0.585 }, g); K.M(K.box(0.03, 1.84, 0.03), mfM, { x: R.mirror.x + 0.01, y: 1.01, z: 1.215 }, g);
    K.M(K.box(0.03, 0.03, 0.66), mfM, { x: R.mirror.x + 0.01, y: 0.105, z: 0.9 }, g); K.M(K.box(0.03, 0.03, 0.66), mfM, { x: R.mirror.x + 0.01, y: 1.915, z: 0.9 }, g);
    // the mirror's "room": a hole through the wardrobe into a mirrored dim box (the double lives there)
    const mx = R.mirror.x;
    const mrM = K.mat("#4a4d52", { map: pl, rough: 0.95, unique: true });
    R.mirrorRoom = K.G({}, g);
    K.M(new T.PlaneGeometry(4.2, 2.7), mrM, { x: mx + 4.2, y: 1.35, z: 0.9, ry: -90 }, R.mirrorRoom);
    K.M(new T.PlaneGeometry(3.6, 2.7), mrM, { x: W2 + 1.82, y: 1.35, z: 0.9 - 2.4, ry: 0 }, R.mirrorRoom);
    K.M(new T.PlaneGeometry(3.6, 2.7), mrM, { x: W2 + 1.82, y: 1.35, z: 0.9 + 2.4, ry: 180 }, R.mirrorRoom);
    K.M(new T.PlaneGeometry(4.2, 4.8), K.mat("#3a2c22", { map: fl, rough: 0.7 }), { x: mx + 2.1, y: 0.001, z: 0.9, rx: -90, cast: false, layer: K.LAYER.FLOOR }, R.mirrorRoom);
    K.M(new T.PlaneGeometry(4.2, 4.8), K.mat("#2f3034", { rough: 0.95 }), { x: mx + 2.1, y: 2.7, z: 0.9, rx: 90, cast: false }, R.mirrorRoom);
    // lights
    R.sun = K.light.spot({ pos: [2.1, 4.6, -7.4], at: [-0.7, 0.5, 0.0], color: "#ffd29a", I: 0, angle: 9, pen: 0.35, range: 30, cast: 1024, radius: 2, vol: 1.6, far: 40 });
    R.moon = K.light.spot({ pos: [-1.8, 4.4, -7.6], at: [0.6, 0.4, -0.4], color: "#8fa8e0", I: 0, angle: 9, pen: 0.5, range: 30, cast: 1024, radius: 3, vol: 0.9, far: 40 });
    R.city = K.light.spot({ pos: [0.3, 1.7, -2.9], at: [0.0, 0.8, 1.5], color: "#7f8fbf", I: 0, angle: 55, pen: 0.8, range: 8, vol: 0.2 });
    R.hemi = K.light.hemi({ sky: "#9aa3ad", ground: "#3b342e", I: 0.25 });
    R.key = K.light.spot({ pos: [0, 2.4, 1], at: [0, 1, 0], color: "#ffffff", I: 0, angle: 40, pen: 0.85, range: 8, cast: 1024, radius: 5, vol: 0.15 });
    R.keyAt = (pos, at, hex, I) => { R.key.position.fromArray(pos); R.key.target.position.fromArray(at); R.key.color.set(hex || "#ffffff"); R.key.intensity = I; };

    const C = (h) => new T.Color(h);
    const STATES = {
      evening: { wall: "#d6cdbf", duvet: "#b0835a", rug: "#c98a5a", leaf: "#4f8a3c", curtain: "#e6dfd2", sky: "evening", skyline: "night", skyHdr: 0.9, sun: 0, moon: 0, lampI: 1.6, city: 0.25, hemi: 0.22, posters: true, laundry: false, cal: "2026", clock: "21:40", curtainOpen: 0.5 },
      future:  { wall: "#7d838b", duvet: "#5f6369", rug: "#55595e", leaf: "#6e5a3a", curtain: "#7b8087", sky: "future", skyline: "night", skyHdr: 0.85, sun: 0, moon: 900, lampI: 0, city: 0.9, hemi: 0.16, posters: false, laundry: true, cal: "2036", clock: "03:07", curtainOpen: 0.3 },
      morning: { wall: "#efe1c9", duvet: "#e2a83a", rug: "#d9785a", leaf: "#4f9a3a", curtain: "#f6efe2", sky: "morning", skyline: "morning", skyHdr: 1.1, sun: 2800, moon: 0, lampI: 0, city: 0, hemi: 0.4, posters: true, laundry: false, cal: "2026", clock: "07:12", curtainOpen: 1 },
    };
    R.STATES = STATES;
    R.state = function (name, k) {
      const S = STATES[name];
      R.wallM.color.set(S.wall); R.duvetM.color.set(S.duvet); R.rugM.color.set(S.rug); R.leafM.color.set(S.leaf); R.curtainM.color.set(S.curtain);
      R.skyM.map = R.skyTex[S.sky]; R.skyM.color.setScalar(S.skyHdr); R.skyM.needsUpdate = true;
      R.skylineM.map = R.skylineTex[S.skyline]; R.skylineM.needsUpdate = true;
      R.sun.intensity = S.sun * (k == null ? 1 : k); R.moon.intensity = S.moon; R.city.intensity = S.city * 30;
      R.lamp.intensity = S.lampI; R.bulbM.color.copy(R.bulbM.userData.base).multiplyScalar(S.lampI > 0 ? 5 : 0); R.shadeM.emissiveIntensity = S.lampI > 0 ? 0.5 : 0;
      R.hemi.intensity = S.hemi;
      R.posters.forEach((p) => (p.visible = S.posters)); R.laundry.visible = S.laundry;
      R.leaves.forEach((l, i) => { l.rotation.x = (name === "future" ? 1.1 : 0.35) * Math.cos(i * 2.3); l.rotation.z = (name === "future" ? 1.1 : 0.35) * Math.sin(i * 2.3); });
      R.calendar(S.cal); R.clock.set(S.clock);
      R.curtains[0].position.x = wx0 - 0.15 - 0.25 * S.curtainOpen; R.curtains[1].position.x = wx1 + 0.15 + 0.25 * S.curtainOpen;
      R.cur = name;
    };
    R.bake = function () {
      for (const n of ["evening", "future", "morning"]) K.env.bake("room-" + n, [0, 1.3, 0], () => R.state(n));
    };
    R.state("evening");
    return R;
  }

  /** pose man2 as the mirror image of man1 across the plane x = X (root scale.x = -1 keeps the geometry mirrored) */
  function mirrorDouble(man2, p, X) {
    man2.root.scale.x = -1;
    const pos = p.pos || [0, 0, 0];
    man2.set(Object.assign({}, p, { pos: [2 * X - pos[0], pos[1], pos[2]], ry: -(p.ry || 0), lookAt: p.lookAt ? [2 * X - p.lookAt[0], p.lookAt[1], p.lookAt[2]] : undefined }));
  }

  /** instanced faceless figures from merged geometry */
  function instanced(K, geos, shellM, jointM, list, parent) {
    const T = K.T;
    const a = new T.InstancedMesh(geos.shell, shellM, list.length), b = new T.InstancedMesh(geos.joint, jointM, list.length);
    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s = new T.Vector3(), p = new T.Vector3();
    list.forEach((it, i) => { e.set(0, it.ry || 0, 0); q.setFromEuler(e); s.setScalar(it.s || 1); p.fromArray(it.pos); m.compose(p, q, s); a.setMatrixAt(i, m); b.setMatrixAt(i, m); });
    [a, b].forEach((x) => { x.castShadow = true; x.receiveShadow = true; x.instanceMatrix.needsUpdate = true; x.computeBoundingSphere(); (parent || K.scene).add(x); });
    return { a, b, set visible(v) { a.visible = b.visible = v; } };
  }

  function office(K, o) {
    o = Object.assign({ origin: [30, 0, 0] }, o || {});
    const T = K.T, O = {}, [ox, oy, oz] = o.origin;
    const g = K.G({ x: ox, y: oy, z: oz, name: "office" });
    O.group = g; O.origin = o.origin;
    const carpet = K.concrete("carpet", { w: 256, h: 256, seed: 5, tone: "#55595e", vary: 0.06, pits: 0, stains: 2, nstr: 2.4, bump: 0.1, rough: [0.9, 1], repeat: [10, 14] });
    K.M(new T.PlaneGeometry(18, 26), K.mat("#ffffff", { map: carpet.map, normalMap: carpet.normal, rough: 0.98 }), { rx: -90, cast: false, layer: K.LAYER.FLOOR }, g);
    const tiles = K.canvasTex("ceil-tiles", 256, 256, (gg, w, h) => { gg.fillStyle = "#d9dadb"; gg.fillRect(0, 0, w, h); gg.fillStyle = "#a9abad"; for (let i = 0; i <= 4; i++) { gg.fillRect(i * 64 - 1, 0, 3, h); gg.fillRect(0, i * 64 - 1, w, 3); } }, { repeat: [4.5, 6.5] });
    K.M(new T.PlaneGeometry(18, 26), K.fixtureGlow(K.mat("#ffffff", { map: tiles, rough: 0.95, unique: true })), { y: 2.8, rx: 90, cast: false }, g);
    const wallM = K.mat("#9aa0a6", { rough: 0.9 });
    K.M(new T.PlaneGeometry(26, 2.8), wallM, { x: -9, y: 1.4, ry: 90 }, g); K.M(new T.PlaneGeometry(26, 2.8), wallM, { x: 9, y: 1.4, ry: -90 }, g);
    // far wall: night windows
    const winTex = skylineTex(K, "night");
    K.M(new T.PlaneGeometry(18, 2.8), K.glow("#ffffff", 0.7, { map: skyTex(K, "future") }), { z: -13.2, y: 1.4, cast: false }, g);
    K.M(new T.PlaneGeometry(18, 1.6), K.glow("#ffffff", 0.9, { map: winTex, transparent: true }), { z: -13.1, y: 0.9, cast: false }, g);
    for (let x = -8; x <= 8; x += 2) K.M(K.box(0.08, 2.8, 0.1), K.mat("#2a2c30"), { x, y: 1.4, z: -13.0 }, g);
    K.M(new T.PlaneGeometry(18, 2.8), wallM, { z: 13, y: 1.4, ry: 180 }, g);
    // cubicles: rows of desk pairs separated by fabric partitions
    const partM = K.mat("#7c8188", { rough: 0.95, normalMap: carpet.normal, normalScale: 0.4 });
    const deskM = K.mat("#b9b4ab", { rough: 0.6 }), darkM = K.mat("#1e2023", { rough: 0.5 }), scrM = K.glow("#c8daf5", 1.6), chairM = K.mat("#2f3236", { rough: 0.8 });
    O.desks = [];
    for (let cx = -6; cx <= 6; cx += 3) for (let cz = -10; cz <= 8; cz += 2.4) {
      const dg = K.G({ x: cx, z: cz }, g);
      K.M(K.box(1.5, 1.25, 0.05), partM, { y: 0.625, z: 0 }, dg);                        // centre partition
      K.M(K.box(0.05, 1.25, 2.3), partM, { x: 0.75, y: 0.625, z: 0 }, dg);               // side partition
      for (const sd of [-1, 1]) {
        K.M(K.box(1.4, 0.04, 0.7), deskM, { y: 0.73, z: sd * 0.4 }, dg);
        K.M(K.box(0.52, 0.32, 0.03), darkM, { y: 1.0, z: sd * 0.16 }, dg);
        K.M(new T.PlaneGeometry(0.48, 0.28), scrM, { y: 1.0, z: sd * 0.16 + sd * 0.017, ry: sd > 0 ? 0 : 180, cast: false }, dg);
        K.M(K.box(0.42, 0.02, 0.15), darkM, { y: 0.76, z: sd * 0.52 }, dg);
        O.desks.push({ x: ox + cx, z: oz + cz + sd * 0.95, ry: sd > 0 ? 180 : 0 });
        const ch = K.G({ z: sd * 1.02 }, dg);
        K.M(K.box(0.46, 0.06, 0.44), chairM, { y: 0.45 }, ch); K.M(K.box(0.44, 0.5, 0.05), chairM, { y: 0.74, z: sd * 0.22 }, ch);
        K.M(K.cyl(0.025, 0.025, 0.4, 8), darkM, { y: 0.22 }, ch); K.M(K.cyl(0.24, 0.24, 0.03, 10), darkM, { y: 0.03 }, ch);
      }
    }
    // fluorescent rows
    O.lights = [];
    for (let z = -10.5; z <= 9.5; z += 3) for (const x of [-4.5, 0, 4.5]) RH3D.tube(K, { pos: [x, 2.72, z], len: 1.3, color: "#eef4ff", hdr: 6.5, parent: g });
    for (let z = -10.5; z <= 9.5; z += 3) O.lights.push(K.light.spot({ pos: [ox, 2.68, oz + z], at: [ox, 0, oz + z], color: "#e9f0ff", I: 18, angle: 85, pen: 0.8, range: 10, vol: 0.5 }));
    // faceless workers at most desks (instanced), keep the hero's desk free
    O.hero = o.heroDesk || O.desks[Math.floor(O.desks.length / 2) + 1];
    if (o.worker) {
      const list = O.desks.filter((d) => d !== O.hero && ((d.x * 7 + d.z * 13) % 5 + 5) % 5 > 0.6).map((d) => ({ pos: [d.x, o.worker.rootY || 0, d.z], ry: d.ry * Math.PI / 180 }));
      O.crowd = instanced(K, o.worker.geos, o.worker.shell, o.worker.joint, list);
    }
    O.key = K.light.spot({ pos: [ox, 2.5, oz], at: [ox, 0.8, oz], color: "#dfe8ff", I: 0, angle: 40, pen: 0.85, range: 8, cast: 1024, radius: 5, vol: 0.1 });
    O.keyAt = (pos, at, hex, I) => { O.key.position.fromArray(pos); O.key.target.position.fromArray(at); O.key.color.set(hex || "#dfe8ff"); O.key.intensity = I; };
    O.setOn = (on) => { O.lights.forEach((L) => (L.intensity = 18 * on)); };
    O.bake = () => K.env.bake("office", [ox, 1.4, oz]);
    return O;
  }

  function crowd(K, o) {
    o = Object.assign({ origin: [-30, 0, 0], n: 120, radius: 10 }, o || {});
    const T = K.T, C = {}, [ox, oy, oz] = o.origin;
    const g = K.G({ x: ox, y: oy, z: oz, name: "crowd" });
    C.group = g; C.origin = o.origin;
    const conc = K.concrete("crowd-floor", { w: 512, h: 512, seed: 9, tone: "#5c5e61", vary: 0.12, rough: [0.35, 0.7], repeat: [8, 8] });
    const fm = K.mat("#ffffff", { map: conc.map, roughMap: conc.rough, normalMap: conc.normal, rough: 1, env: 0.3, unique: true });
    K.wetFloor(fm, { wetBelow: 0.5, blur: 18, gain: 0.7 });
    K.M(new T.PlaneGeometry(60, 60), fm, { rx: -90, cast: false, layer: K.LAYER.FLOOR }, g);
    // a dark backdrop dome far away (the fog does the rest)
    K.M(K.sph(40, 32, 16), K.mat("#15171b", { rough: 1, side: T.BackSide }), { y: 0, cast: false }, g);
    const r = RH3D.rng(2026), list = [];
    let tries = 0;
    while (list.length < o.n && tries < 5000) {
      tries++;
      const a = r() * Math.PI * 2, d = 0.9 + Math.sqrt(r()) * o.radius;
      const x = Math.cos(a) * d, z = Math.sin(a) * d * 1.3 - 2;
      if (list.some((p) => (p.pos[0] - ox - x) ** 2 + (p.pos[2] - oz - z) ** 2 < 0.55 * 0.55)) continue;
      list.push({ pos: [ox + x, 0, oz + z], ry: (r() - 0.5) * 0.5 + (o.face || 0), s: 0.96 + r() * 0.08 });
    }
    C.list = list;
    if (o.figure) C.inst = instanced(K, o.figure.geos, o.figure.shell, o.figure.joint, list);
    if (o.figure2) C.inst2 = instanced(K, o.figure2.geos, o.figure2.shell, o.figure2.joint, o.list2 || []);
    C.top = K.light.spot({ pos: [ox + 2, 9, oz + 3], at: [ox, 0, oz - 1], color: "#aeb8c8", I: 260, angle: 40, pen: 0.9, range: 30, vol: 0.5, cast: 2048, radius: 4, far: 30 });
    C.beam = K.light.spot({ pos: [ox, 11, oz + 0.4], at: [ox, 0, oz], color: "#ffcf86", I: 0, angle: 4.2, pen: 0.4, range: 30, vol: 2.4, cast: 1024, radius: 2, far: 30 });
    C.rim = K.light.spot({ pos: [ox - 4, 3, oz - 8], at: [ox, 1.4, oz], color: "#8ea2c8", I: 60, angle: 35, pen: 0.8, range: 20, vol: 0.4 });
    C.key = K.light.spot({ pos: [ox, 2.5, oz + 2], at: [ox, 1.4, oz], color: "#ffffff", I: 0, angle: 30, pen: 0.85, range: 8, cast: 1024, radius: 4, vol: 0.05 });
    C.keyAt = (pos, at, hex, I) => { C.key.position.fromArray(pos); C.key.target.position.fromArray(at); C.key.color.set(hex || "#ffffff"); C.key.intensity = I; };
    C.bake = () => K.env.bake("crowd", [ox, 1.5, oz + 3]);
    return C;
  }

  /** render the current scene from cam into a w x h canvas (tone-mapped ACES + sRGB in JS); used once at load for a
   *  photo shown on a phone screen. Returns the canvas. */
  function photo(K, cam, w, h, expo) {
    const T = K.T, rt = new T.WebGLRenderTarget(w, h, { type: T.UnsignedByteType, samples: 4 });
    const keep = K.renderer.getRenderTarget();
    K.scene.updateMatrixWorld(true);
    K.renderer.shadowMap.needsUpdate = true;
    K.updateGlow && K.updateGlow();
    K.renderer.setRenderTarget(rt); K.renderer.render(K.scene, cam);
    const buf = new Uint8Array(w * h * 4);
    K.renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    K.renderer.setRenderTarget(keep);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d"), img = g.createImageData(w, h);
    const aces = (x) => Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));
    const srgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = ((h - 1 - y) * w + x) * 4, o2 = (y * w + x) * 4;   // GL rows are bottom-up
      for (let c = 0; c < 3; c++) img.data[o2 + c] = Math.round(255 * srgb(aces((buf[i + c] / 255) * (expo || 0.85))));
      img.data[o2 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    rt.dispose();
    return cv;
  }

  Object.assign(RH3D, { bedroom, office, crowd, mirrorDouble, instancedFigures: instanced, photo, skyTex, skylineTex });
})();
