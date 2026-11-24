/* rh3d-garage.js — "Level −4": an underground parking level for the realistic-horror kit (needs core + props).
 *
 *   const G = RH3D.garage(K, {});
 *   G.setRow(i, white 0..1, red 0..1, flicker)   13 light rows along the aisle (i = 0 at the ramp, 12 at the far wall)
 *   G.rowZ[i]                                    row positions
 *   G.shutter(open 0..1)                         roller shutter at the top of the ramp (0 = shut)
 *   G.exit(on 0..1)                              cold light beyond the shutter (level −3)
 *   G.clock.set("23:59")   G.board.set([...])    7-segment clock above the booth, dot-matrix board over the barrier
 *   G.trail(progress 0..1)                       the wet drag mark, from the far end to the hero's spot
 *   G.key / G.key2                               two shadow-casting spots, positioned per shot ("one focal light")
 *   G.card / G.cardMesh / G.cardTexA / G.cardTexB  the laminated rules card in the booth (B = rule 1 circled)
 *   G.bakeEnvs()                                 bakes "white" and "red" PMREM environments from the set
 *
 * Layout (metres): floor y 0, slab underside 2.75, beams at z 0, −7.5 … −45 (to y 2.35). Aisle x −3.2…3.2, bays to
 * ±8.4, side walls x ±8.6, far wall z −46. Columns at x ±3.45 on the beam lines. Ramp z 4.5 → 17.5 rising to y 2.3,
 * shutter at z 17.6. Barrier + board at z 4.2. Booth x 4.3…6.5, z 1.0…3.8 (card on its aisle glass at x 4.33).
 * Lifts in the left wall at z −1.5…2.5. Hero's spot in the ending: (0.15, 0, −12.4) under row 4.
 */
(function () {
  const RH3D = window.RH3D;
  const FONT = '"MontserratRH", "Montserrat", "Arial Black", Arial, sans-serif';

  function garage(K, o) {
    o = Object.assign({ levelHex: "#d39a1e", white: "#eaf0ff", red: "#ff2410", rowI: 22, rowRange: 13 }, o || {});
    const T = K.T, G = {};
    const X0 = -8.6, X1 = 8.6, Z0 = -46, Z1 = 4.5, CEIL = 2.75;
    const FW = X1 - X0, FD = Z1 - Z0;
    const r = RH3D.rng(404);

    // ---------------------------------------------------------------- detail textures
    const fine = K.concrete("g-fine", { w: 512, h: 512, seed: 21, tone: "#808080", vary: 0.05, pits: 0.9, stains: 0, nstr: 1.4, bump: 0.12, repeat: [FW / 0.9, FD / 0.9] });
    const wallC = K.concrete("g-wall", { w: 512, h: 512, seed: 33, tone: "#9a9893", vary: 0.12, pits: 0.5, stains: 4, nstr: 1.0, repeat: [1, 1] });
    const ceilC = K.concrete("g-ceil", { w: 512, h: 512, seed: 45, tone: "#908f8a", vary: 0.18, pits: 0.4, stains: 7, nstr: 0.9, repeat: [FW / 3, FD / 3] });

    // ---------------------------------------------------------------- floor: painted 1024 x 3008 canvas
    const FCW = 1024, FCH = 3008;
    const fx = (x) => ((x - X0) / FW) * FCW, fz = (z) => ((z - Z0) / FD) * FCH;   // canvas top = far wall
    const puddles = [];
    // puddles where the shots need reflections: the aisle near the hero, the one-point corridor, the ramp foot
    [[0.4, -12.6, 1.5], [-1.2, -14.4, 0.9], [1.6, -10.4, 0.8], [-0.6, -7.2, 1.1], [0.9, -4.0, 0.9], [-1.4, -1.0, 1.2], [0.3, 1.9, 1.0],
     [-0.5, -19.5, 1.4], [1.2, -24.5, 1.0], [-1.0, -29.0, 1.3], [0.6, -34.0, 1.1], [-0.4, -39.5, 1.4], [2.4, -16.8, 0.7], [-2.5, -22.2, 0.8],
     [5.6, -11.2, 0.6], [-5.8, -6.2, 0.5]].forEach((p) => puddles.push(p));
    function puddlePath(g, p, grow) {
      const rr = RH3D.rng(Math.round(p[0] * 100 + p[1] * 37 + 999));
      g.beginPath();
      for (let k = 0; k < 7; k++) {
        const a = rr() * 6.28, d = rr() * p[2] * 0.6, rad = p[2] * (0.35 + rr() * 0.45) * (grow || 1);
        const cx = fx(p[0] + Math.cos(a) * d), cz = fz(p[1] + Math.sin(a) * d * 1.4);
        g.moveTo(cx + rad / FW * FCW, cz);
        g.ellipse(cx, cz, rad / FW * FCW, rad / FD * FCH * 1.25, rr() * 3, 0, 6.29);
      }
    }
    const floorA = K.canvasTex("g-floorA", FCW, FCH, (g) => {
      g.fillStyle = "#7d7c78"; g.fillRect(0, 0, FCW, FCH);
      // large-scale tone: soft blotches
      for (let i = 0; i < 220; i++) {
        const x = r() * FCW, y = r() * FCH, rad = 40 + r() * 220, dark = r() < 0.55;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, dark ? `rgba(40,40,38,${0.05 + r() * 0.08})` : `rgba(190,188,182,${0.04 + r() * 0.06})`); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // driving lane: slightly darker sealed epoxy, polished tyre tracks
      g.fillStyle = "rgba(55,60,58,0.22)"; g.fillRect(fx(-3.2), 0, fx(3.2) - fx(-3.2), FCH);
      for (const tx of [-1.75, -0.35, 0.35, 1.75]) { const gr = g.createLinearGradient(fx(tx - 0.35), 0, fx(tx + 0.35), 0); gr.addColorStop(0, "rgba(20,20,20,0)"); gr.addColorStop(0.5, "rgba(20,20,20,0.16)"); gr.addColorStop(1, "rgba(20,20,20,0)"); g.fillStyle = gr; g.fillRect(fx(tx - 0.35), 0, fx(tx + 0.35) - fx(tx - 0.35), FCH); }
      // tyre marks: curved black streaks turning into bays
      g.lineCap = "round";
      for (let i = 0; i < 70; i++) {
        const z = Z0 + 2 + r() * (FD - 4), side = r() < 0.5 ? -1 : 1, x0 = side * (0.5 + r() * 1.6);
        g.strokeStyle = `rgba(15,15,15,${0.05 + r() * 0.1})`; g.lineWidth = 4 + r() * 5;
        g.beginPath(); g.moveTo(fx(x0), fz(z)); g.quadraticCurveTo(fx(x0 + side * 1.6), fz(z - 0.6 - r() * 1.5), fx(side * (3.6 + r() * 2.5)), fz(z - 2.5 - r() * 2)); g.stroke();
      }
      // oil stains in bays
      for (let k = 0; k < 19; k++) for (const side of [-1, 1]) {
        const z = 1.25 - 2.5 * k, x = side * (5.6 + (r() - 0.5) * 0.8);
        for (let j = 0; j < 3; j++) { const rad = 14 + r() * 26, xx = fx(x + (r() - 0.5) * 0.9), yy = fz(z + (r() - 0.5) * 0.9); const gr = g.createRadialGradient(xx, yy, 0, xx, yy, rad); gr.addColorStop(0, `rgba(12,10,8,${0.25 + r() * 0.3})`); gr.addColorStop(1, "rgba(12,10,8,0)"); g.fillStyle = gr; g.fillRect(xx - rad, yy - rad, rad * 2, rad * 2); }
      }
      // bay lines (worn white)
      g.fillStyle = "rgba(225,223,212,0.9)";
      for (let k = 0; k <= 20; k++) {
        const z = 2.5 - 2.5 * k; if (z < Z0 + 0.5) break;
        for (const side of [-1, 1]) { const xa = fx(side > 0 ? 3.3 : -8.3), xb = fx(side > 0 ? 8.3 : -3.3); g.fillRect(xa, fz(z) - 3, xb - xa, 6); }
      }
      g.fillRect(fx(-3.3) - 3, 0, 6, FCH); g.fillRect(fx(3.3) - 3, 0, 6, FCH);
      // bay numbers
      g.save(); g.fillStyle = "rgba(225,223,212,0.85)"; g.font = `800 34px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
      for (let k = 0; k < 19; k++) for (const side of [-1, 1]) {
        const z = 1.25 - 2.5 * k; g.save(); g.translate(fx(side * 4.0), fz(z)); g.rotate(side > 0 ? Math.PI / 2 : -Math.PI / 2); g.scale(1, FCH / FD / (FCW / FW)); g.fillText(`4-${String(k * 2 + (side > 0 ? 2 : 1)).padStart(2, "0")}`, 0, 0); g.restore();
      }
      g.restore();
      // arrows toward the exit (+z) in the lane, and the big −4 at the ramp foot
      g.fillStyle = "rgba(232,230,220,0.82)";
      for (const z of [-6, -18, -30, -40]) {
        const cx = fx(1.2), cy = fz(z), sx = FCW / FW, sy = FCH / FD;
        g.beginPath(); g.moveTo(cx, cy - 1.0 * sy); g.lineTo(cx + 0.55 * sx, cy - 0.25 * sy); g.lineTo(cx + 0.2 * sx, cy - 0.25 * sy); g.lineTo(cx + 0.2 * sx, cy + 0.9 * sy);
        g.lineTo(cx - 0.2 * sx, cy + 0.9 * sy); g.lineTo(cx - 0.2 * sx, cy - 0.25 * sy); g.lineTo(cx - 0.55 * sx, cy - 0.25 * sy); g.closePath();
        // arrow points toward +z = canvas down: flip
        g.save(); g.translate(0, cy * 2); g.scale(1, -1); g.fill(); g.restore();
      }
      g.save(); g.translate(fx(-1.6), fz(2.3)); g.scale(1, FCH / FD / (FCW / FW)); g.fillStyle = "rgba(232,230,220,0.85)"; g.font = `900 120px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.rotate(Math.PI); g.fillText("−4", 0, 0); g.restore();
      // drain grates across the aisle
      for (const z of [-20.5, 3.4]) { g.fillStyle = "#1c1d1e"; g.fillRect(fx(-3.2), fz(z) - 9, fx(3.2) - fx(-3.2), 18); g.fillStyle = "#3a3c3d"; for (let x = fx(-3.2); x < fx(3.2); x += 7) g.fillRect(x, fz(z) - 8, 3, 16); }
      // puddles: darker, slightly bluish wet concrete with a darker rim
      puddles.forEach((p) => { g.fillStyle = "rgba(30,33,36,0.16)"; puddlePath(g, p, 1.12); g.fill(); g.fillStyle = "rgba(24,27,30,0.24)"; puddlePath(g, p, 1.0); g.fill(); });
      // grime gradient along walls
      for (const side of [0, 1]) { const gr = g.createLinearGradient(side ? FCW : 0, 0, side ? FCW - 60 : 60, 0); gr.addColorStop(0, "rgba(20,18,15,0.45)"); gr.addColorStop(1, "rgba(20,18,15,0)"); g.fillStyle = gr; g.fillRect(side ? FCW - 60 : 0, 0, 60, FCH); }
    });
    const floorR = K.canvasTex("g-floorR", FCW / 2, FCH / 2, (g) => {
      const s = 0.5;
      g.fillStyle = "rgb(150,150,150)"; g.fillRect(0, 0, FCW, FCH);                         // sealed concrete ~0.59
      g.fillStyle = "rgb(118,118,118)"; g.fillRect(fx(-3.2) * s, 0, (fx(3.2) - fx(-3.2)) * s, FCH);   // lane ~0.46 (polished)
      for (let i = 0; i < 300; i++) { const x = r() * FCW * s, y = r() * FCH * s, rad = 10 + r() * 60, v = 90 + r() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${v},${v},${v},0.5)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      g.save(); g.scale(s, s);
      puddles.forEach((p) => { g.fillStyle = "rgb(60,60,60)"; puddlePath(g, p, 1.12); g.fill(); g.fillStyle = "rgb(12,12,12)"; puddlePath(g, p, 1.0); g.fill(); });
      g.restore();
    }, { linear: true });
    const floorM = K.mat("#ffffff", { map: floorA, roughMap: floorR, normalMap: fine.normal, normalScale: 0.55, rough: 1, env: 0.35, unique: true });
    K.wetFloor(floorM, { wetBelow: 0.52, blur: 18, distort: 0.02 });
    G.floor = K.M(new T.PlaneGeometry(FW, FD), floorM, { x: 0, y: 0, z: (Z0 + Z1) / 2, rx: -90, layer: K.LAYER.FLOOR, cast: false });

    // ---------------------------------------------------------------- walls (painted canvas per wall)
    function wallTex(key, len, seed, opts) {
      const CW = Math.min(4096, Math.round(len * 82)), CH = 256;
      return K.canvasTex(key, CW, CH, (g) => {
        const rr = RH3D.rng(seed), px = CW / len, py = CH / CEIL;
        const pat = g.createPattern(wallC.map.userData.canvas, "repeat");
        g.fillStyle = "#9c9a95"; g.fillRect(0, 0, CW, CH);
        g.save(); g.globalAlpha = 0.55; g.fillStyle = pat; g.scale(0.5, 0.5); g.fillRect(0, 0, CW * 2, CH * 2); g.restore();
        // board-formwork lines
        g.fillStyle = "rgba(40,38,34,0.12)"; for (let y = 0.62; y < CEIL; y += 0.62) g.fillRect(0, CH - y * py, CW, 2);
        // painted level band (lower 1.15 m), chipped
        g.fillStyle = o.levelHex; g.fillRect(0, CH - 1.15 * py, CW, 1.15 * py);
        g.fillStyle = "rgba(20,18,14,0.85)"; g.fillRect(0, CH - 1.2 * py, CW, 0.05 * py);
        for (let i = 0; i < len * 6; i++) { g.fillStyle = `rgba(140,138,132,${0.5 + rr() * 0.4})`; const x = rr() * CW, y = CH - rr() * 1.15 * py; g.beginPath(); g.ellipse(x, y, 2 + rr() * 9, 1.5 + rr() * 5, rr() * 3, 0, 7); g.fill(); }
        // scuffs near the floor
        for (let i = 0; i < len * 3; i++) { g.fillStyle = `rgba(25,22,18,${0.15 + rr() * 0.25})`; g.fillRect(rr() * CW, CH - (0.05 + rr() * 0.45) * py, 10 + rr() * 60, 2 + rr() * 4); }
        // stencilled −4 between columns
        g.fillStyle = "#151412"; g.textAlign = "center"; g.textBaseline = "middle";
        (opts.marks || []).forEach((m) => { g.font = `900 ${m.size * py}px ${FONT}`; g.fillText(m.text, m.x * px, CH - m.y * py); });
        // water streaks from the slab
        for (let i = 0; i < len * 1.2; i++) { const x = rr() * CW, l = (0.3 + rr() * 1.4) * py; const gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, `rgba(30,28,22,${0.18 + rr() * 0.2})`); gr.addColorStop(1, "rgba(30,28,22,0)"); g.fillStyle = gr; g.fillRect(x, 0, 2 + rr() * 6, l); }
        // grime at the base
        const gb = g.createLinearGradient(0, CH, 0, CH - 0.4 * py); gb.addColorStop(0, "rgba(15,13,10,0.55)"); gb.addColorStop(1, "rgba(15,13,10,0)"); g.fillStyle = gb; g.fillRect(0, CH - 0.4 * py, CW, 0.4 * py);
      });
    }
    const sideLen = Z1 + 0.2 - Z0;
    const marksL = [], marksR = [];
    for (let z = -3.75, k = 0; z > Z0 + 2; z -= 7.5, k++) {
      marksL.push({ text: "−4", x: Z1 + 0.2 - z, y: 0.6, size: 0.82 });
      marksR.push({ text: "−4", x: z - Z0, y: 0.6, size: 0.82 });
    }
    const wallL = wallTex("g-wallL", sideLen, 71, { marks: marksL }), wallR = wallTex("g-wallR", sideLen, 72, { marks: marksR });
    const wallMat = (map) => K.mat("#ffffff", { map, normalMap: wallC.normal, normalScale: 0.6, rough: 0.88, env: 0.4, unique: true });
    wallC.normal.repeat.set(sideLen / 2.5, 1.1);
    K.M(new T.PlaneGeometry(sideLen, CEIL), wallMat(wallL), { x: X0, y: CEIL / 2, z: (Z0 + Z1 + 0.2) / 2, ry: 90 });
    K.M(new T.PlaneGeometry(sideLen, CEIL), wallMat(wallR), { x: X1, y: CEIL / 2, z: (Z0 + Z1 + 0.2) / 2, ry: -90 });
    const farTex = wallTex("g-wallF", FW, 73, { marks: [{ text: "LEVEL −4", x: FW / 2, y: 1.75, size: 0.62 }, { text: "−4", x: 3.0, y: 0.6, size: 0.8 }, { text: "−4", x: FW - 3.0, y: 0.6, size: 0.8 }] });
    K.M(new T.PlaneGeometry(FW, CEIL), wallMat(farTex), { x: 0, y: CEIL / 2, z: Z0 });
    // ceiling + beams + services
    const ceilM = K.fixtureGlow(K.mat("#ffffff", { map: ceilC.map, roughMap: ceilC.rough, normalMap: ceilC.normal, rough: 1, env: 0.3, unique: true }));
    K.M(new T.PlaneGeometry(FW, FD), ceilM, { x: 0, y: CEIL, z: (Z0 + Z1) / 2, rx: 90, cast: false });
    const beamM = K.fixtureGlow(K.mat("#8a8985", { rough: 0.9, map: wallC.map, normalMap: wallC.normal, normalScale: 0.5, unique: true }));
    for (let z = 0; z > Z0; z -= 7.5) K.M(K.box(FW, 0.4, 0.45), beamM, { y: CEIL - 0.2, z });
    const pipeR = K.mat("#8e1f17", { rough: 0.45, metal: 0.2 }), pipeG = K.mat("#8b8d8e", { rough: 0.4, metal: 0.6 }), tray = K.mat("#55585a", { rough: 0.5, metal: 0.7 });
    K.M(K.cyl(0.05, 0.05, FD, 12), pipeR, { x: -1.4, y: 2.28, z: (Z0 + Z1) / 2, rx: 90, cast: false });
    K.M(K.box(0.42, 0.26, FD), pipeG, { x: 2.5, y: 2.2, z: (Z0 + Z1) / 2, cast: false });
    K.M(K.box(0.5, 0.06, FD), tray, { x: -4.6, y: 2.4, z: (Z0 + Z1) / 2, cast: false });
    for (let z = 3; z > Z0; z -= 3) K.M(K.cyl(0.012, 0.03, 0.08, 8), K.mat("#c9a227", { metal: 0.7, rough: 0.4 }), { x: -1.4, y: 2.2, z, cast: false });

    // ---------------------------------------------------------------- columns
    const colTex = K.canvasTex("g-col", 256, 512, (g, w, h) => {
      const pat = g.createPattern(wallC.map.userData.canvas, "repeat");
      g.fillStyle = pat; g.fillRect(0, 0, w, h);
      const py = h / CEIL;
      g.save(); g.beginPath(); g.rect(0, h - 0.85 * py, w, 0.85 * py); g.clip();
      g.fillStyle = "#d9a71f"; g.fillRect(0, h - 0.85 * py, w, 0.85 * py);
      g.fillStyle = "#151412"; for (let x = -h; x < w + h; x += 46) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 23, h); g.lineTo(x + 23 + 0.85 * py, h - 0.85 * py); g.lineTo(x + 0.85 * py, h - 0.85 * py); g.closePath(); g.fill(); }
      g.restore();
      g.fillStyle = "#efede6"; g.fillRect(w * 0.14, h - 1.95 * py, w * 0.72, 0.5 * py);
      g.fillStyle = "#151412"; g.font = `900 ${0.36 * py}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("−4", w / 2, h - 1.7 * py);
    });
    const colM = K.mat("#ffffff", { map: colTex, normalMap: wallC.normal, normalScale: 0.5, rough: 0.85, env: 0.4 });
    G.columns = [];
    const plinthM = K.mat("#c99a1f", { rough: 0.7 });
    for (let z = -7.5; z > Z0; z -= 7.5) for (const sx of [-1, 1]) {
      G.columns.push(K.M(K.box(0.5, CEIL, 0.5), colM, { x: sx * 3.45, y: CEIL / 2, z }));
      K.M(K.rbox(0.74, 0.74, 0.22, 0.03), plinthM, { x: sx * 3.45, y: 0.11, z, rx: 90 });   // column guard plinth (a seat)
    }

    // ---------------------------------------------------------------- light rows
    G.rowZ = []; G.rows = [];
    for (let i = 0; i < 13; i++) {
      const z = 2.6 - 3.75 * i;
      G.rowZ.push(z);
      const tubes = [-5.8, 0, 5.8].map((x) => RH3D.tube(K, { pos: [x, 2.5, z], len: 1.5, color: o.white, hdr: 7.5 }));
      const cage = RH3D.cageLamp(K, { pos: [0.55, 2.48, z + 0.95], color: o.red });
      const cage2 = RH3D.cageLamp(K, { pos: [-5.2, 2.48, z + 0.95], color: o.red });
      const L = K.light.spot({ pos: [0, 2.44, z], at: [0, 0, z], color: o.white, I: o.rowI, angle: 88, pen: 0.8, range: o.rowRange, vol: 1 });
      G.rows.push({ z, tubes, cage, cage2, L, w: 1, rd: 0 });
    }
    const cW = new T.Color(o.white), cR = new T.Color(o.red), cTmp = new T.Color();
    G.setRow = function (i, w, rd, flick) {
      const row = G.rows[i]; if (!row) return;
      w = Math.max(0, w); rd = Math.max(0, rd);
      const f = flick == null ? 1 : flick;
      row.tubes.forEach((tb) => { tb.set(w * f * (G.envTube || 1)); if (rd > 0.01 && w * f < 0.5) tb.glowM.color.copy(cR).multiplyScalar(rd * 2.3 * (G.envTube || 1)); });
      row.cage.set(rd * 12); row.cage2.set(rd * 12);
      cTmp.copy(cW).multiplyScalar(w * f).add(cR.clone().multiplyScalar(rd * 0.85));
      const I = Math.max(cTmp.r, cTmp.g, cTmp.b);
      if (I > 0) row.L.color.copy(cTmp).multiplyScalar(1 / I); row.L.intensity = o.rowI * I;
      row.w = w; row.rd = rd;
      // ceiling glow from the aisle tube (white) or the cage lamp (red)
      const gp = K.glowPts[i] || (K.glowPts[i] = { p: [0, 2.46, row.z], c: [0, 0, 0] });
      const gw = 1.6 * w * f * (G.envTube || 1), gr = 0.5 * rd;
      gp.c[0] = cW.r * gw + cR.r * gr; gp.c[1] = cW.g * gw + cR.g * gr; gp.c[2] = cW.b * gw + cR.b * gr;
    };
    G.allRows = (w, rd) => { for (let i = 0; i < 13; i++) G.setRow(i, w, rd); };

    // ---------------------------------------------------------------- ramp, shutter, exit light
    const rampLen = 13, rampH = 2.3, rampZ0 = Z1, rampZ1 = Z1 + rampLen;
    const rampAng = Math.atan2(rampH, rampLen);
    const rampY0 = (z) => Math.max(0, Math.min(rampH, (z - rampZ0) / rampLen * rampH));
    const rampA = K.canvasTex("g-ramp", 512, 1024, (g, w, h) => {
      const pat = g.createPattern(fine.map.userData.canvas, "repeat"); g.fillStyle = "#77766f"; g.fillRect(0, 0, w, h);
      g.save(); g.globalAlpha = 0.6; g.fillStyle = pat; g.fillRect(0, 0, w, h); g.restore();
      g.strokeStyle = "rgba(215,170,40,0.85)"; g.lineWidth = 22;
      for (let y = 80; y < h; y += 150) { g.beginPath(); g.moveTo(w * 0.18, y + 60); g.lineTo(w * 0.5, y); g.lineTo(w * 0.82, y + 60); g.stroke(); }
      g.fillStyle = "rgba(230,228,218,0.85)"; g.font = `900 92px ${FONT}`; g.textAlign = "center"; g.save(); g.translate(w / 2, h * 0.86); g.rotate(Math.PI); g.fillText("SLOW", 0, 0); g.restore();
    });
    const rampM = K.mat("#ffffff", { map: rampA, normalMap: fine.normal, rough: 0.7, env: 0.35 });
    const ramp = K.M(new T.PlaneGeometry(6.4, Math.hypot(rampLen, rampH)), rampM, { x: 0, y: rampH / 2, z: (rampZ0 + rampZ1) / 2, cast: false, layer: K.LAYER.FLOOR });
    ramp.rotation.set(-Math.PI / 2 - rampAng, 0, 0);
    // ramp side walls + ceiling (sloped)
    for (const sx of [-1, 1]) K.M(new T.PlaneGeometry(rampLen + 1, 5.2), wallMat(wallTex("g-rampW" + sx, rampLen + 1, 80 + sx, { marks: [] })), { x: sx * 3.2, y: 2.6, z: (rampZ0 + rampZ1) / 2, ry: -sx * 90 });
    const rc = K.M(new T.PlaneGeometry(6.4, Math.hypot(rampLen, rampH) + 0.6), ceilM, { x: 0, y: CEIL + rampH / 2, z: (rampZ0 + rampZ1) / 2, cast: false });
    rc.rotation.set(Math.PI / 2 - rampAng, 0, 0);
    // fill the gaps beside the ramp (walls from the bays to the ramp mouth)
    for (const sx of [-1, 1]) K.M(new T.PlaneGeometry(5.4, CEIL), wallMat(wallTex("g-mouth" + sx, 5.4, 90 + sx, { marks: [{ text: "EXIT", x: 2.7, y: 1.75, size: 0.32 }] })), { x: sx * 5.9, y: CEIL / 2, z: Z1 + 0.02, ry: 180 });
    // shutter: corrugated steel slats (normal stripes), housing; travels up into the housing
    const slatN = K.canvasTex("g-slatN", 64, 512, (g, w, h) => {
      for (let y = 0; y < h; y++) { const u = (y % 32) / 32, n = Math.sin(u * Math.PI * 2) * 0.8; g.fillStyle = `rgb(128,${Math.round(128 + n * 110)},${Math.round(225 - Math.abs(n) * 40)})`; g.fillRect(0, y, w, 1); }
    }, { linear: true, repeat: [1, 1] });
    const slatA = K.canvasTex("g-slatA", 256, 512, (g, w, h) => {
      g.fillStyle = "#8b8e90"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) { g.fillStyle = "rgba(20,20,22,0.35)"; g.fillRect(0, y, w, 3); }
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${90 + Math.floor(i % 40)},60,40,${(i % 7) * 0.012})`; g.fillRect((i * 37) % w, (i * 91) % h, 3 + (i % 9), 2 + (i % 5)); }
      const gr = g.createLinearGradient(0, h, 0, h - 120); gr.addColorStop(0, "rgba(30,25,18,0.6)"); gr.addColorStop(1, "rgba(30,25,18,0)"); g.fillStyle = gr; g.fillRect(0, h - 120, w, 120);
    });
    const shutM = K.mat("#ffffff", { map: slatA, normalMap: slatN, rough: 0.42, metal: 0.75, env: 0.9 });
    const shutG = K.G({ x: 0, y: rampH, z: rampZ1 + 0.1 });
    const shutter = K.M(K.box(6.4, 2.7, 0.06), shutM, { y: 1.35 }, shutG);
    K.M(K.box(6.4, 0.08, 0.1), K.mat("#2a2b2c", { rough: 0.5, metal: 0.6 }), { y: -1.33 }, shutter);
    K.M(K.box(6.8, 0.7, 0.7), K.mat("#5d6062", { rough: 0.5, metal: 0.6 }), { x: 0, y: rampH + 2.95, z: rampZ1 + 0.1 });
    G.shutterMesh = shutter;
    // ramp lighting (two battens on the sloped ceiling) so the shutter reads as metal even when the exit is dark
    G.rampLights = [9.0, 14.8].map((z) => {
      const y = CEIL + (z - rampZ0) / rampLen * rampH - 0.18;
      RH3D.tube(K, { pos: [0, y, z], len: 1.4, color: o.white, hdr: 7 });
      return K.light.spot({ pos: [0, y - 0.06, z], at: [0, rampY0(z) - 1, z + 1.5], color: o.white, I: 16, angle: 80, pen: 0.75, range: 9, vol: 0.25 });
    });
    // amber beacon on the shutter housing: flashes while the shutter moves
    G.beaconM = K.glow("#ffa21c", 0.15);
    K.M(K.cyl(0.07, 0.07, 0.14, 16), G.beaconM, { x: 2.7, y: rampH + 2.55, z: rampZ1 - 0.25, cast: false });
    K.M(K.cyl(0.08, 0.08, 0.03, 16), K.mat("#222", { rough: 0.5 }), { x: 2.7, y: rampH + 2.46, z: rampZ1 - 0.25, cast: false });
    G.beacon = (on) => G.beaconM.color.copy(G.beaconM.userData.base).multiplyScalar(0.15 + 9 * on);
    G.shutter = function (open) { shutter.position.y = 1.35 + 2.65 * Math.max(0, Math.min(1, open)); };
    // beyond: level −3, a lit floor and a cold spot pointing down the ramp (makes beams under the rising shutter)
    K.M(new T.PlaneGeometry(10, 8), K.mat("#8d8f90", { rough: 0.6 }), { x: 0, y: rampH, z: rampZ1 + 4, rx: -90, cast: false, layer: K.LAYER.FLOOR });
    const exitPanel = K.M(new T.PlaneGeometry(10, 4), K.glow("#dfe9ff", 3.2), { x: 0, y: rampH + 2, z: rampZ1 + 7.5, ry: 180, cast: false });
    exitPanel.rotation.y = Math.PI;
    G.exitL = K.light.spot({ pos: [0, rampH + 2.4, rampZ1 + 3.5], at: [0, 0, rampZ1 - 8], color: "#dce8ff", I: 0, angle: 44, pen: 0.45, range: 30, vol: 1.0, cast: 1024, radius: 3, far: 40 });
    G.exitPanelM = exitPanel.material;
    G.exit = function (on) { G.exitL.intensity = 260 * on; G.exitPanelM.color.copy(G.exitPanelM.userData.base).multiplyScalar(on); };
    G.exit(0); G.shutter(1);

    // ---------------------------------------------------------------- barrier + dot-matrix board
    const postM = K.mat("#d6a21a", { rough: 0.5, phys: true, clearcoat: 0.4 });
    K.M(K.rbox(0.34, 1.05, 0.3, 0.04), postM, { x: 2.9, y: 0.525, z: Z1 - 0.3 });
    const armTex = K.canvasTex("g-arm", 512, 32, (g, w, h) => { g.fillStyle = "#f2f0ea"; g.fillRect(0, 0, w, h); g.fillStyle = "#c8261c"; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 32, h); });
    G.arm = K.M(K.box(2.75, 0.08, 0.06), K.mat("#ffffff", { map: armTex, rough: 0.45 }), { x: 2.9 - 1.42, y: 0.96, z: Z1 - 0.3 });
    K.M(K.box(0.1, 0.12, 6.0), K.mat("#c99a1f", { rough: 0.6 }), { x: 0.0, y: 0.06, z: Z1 + 2.2 });   // lane divider kerb up the ramp
    G.board = RH3D.led(K, "g-board", { lines: ["EXIT CLOSED", "OPENS 06:00"], color: "#ffa62a", cols: 84, rows: 24, font: 10 });
    const boardG = K.G({ x: 1.5, y: 2.05, z: Z1 - 0.15 });
    K.M(K.box(1.9, 0.56, 0.12), K.mat("#141516", { rough: 0.5, metal: 0.5 }), {}, boardG);
    K.M(new T.PlaneGeometry(1.78, 0.46), K.glow("#ffffff", 1.35, { map: G.board.tex }), { z: -0.062, ry: 180, cast: false }, boardG);
    for (const sx of [-0.7, 0.7]) K.M(K.cyl(0.01, 0.01, 0.3, 6), K.mat("#222"), { x: sx, y: 0.42 }, boardG);

    // ---------------------------------------------------------------- attendant booth
    const bx0 = 4.3, bx1 = 6.5, bz0 = 1.0, bz1 = 3.8, bh = 2.3;
    const alu = K.mat("#b9bcbe", { rough: 0.35, metal: 0.85 });
    const boothG = K.G({});
    K.M(K.box(bx1 - bx0 + 0.1, 0.12, bz1 - bz0 + 0.1), K.mat("#5f5e5a", { rough: 0.9 }), { x: (bx0 + bx1) / 2, y: 0.06, z: (bz0 + bz1) / 2 }, boothG);
    K.M(K.box(bx1 - bx0 + 0.2, 0.12, bz1 - bz0 + 0.2), K.mat("#dedcd6", { rough: 0.6 }), { x: (bx0 + bx1) / 2, y: bh + 0.06, z: (bz0 + bz1) / 2 }, boothG);
    for (const [x, z] of [[bx0, bz0], [bx0, bz1], [bx1, bz0], [bx1, bz1], [bx0, (bz0 + bz1) / 2]]) K.M(K.box(0.07, bh, 0.07), alu, { x, y: bh / 2, z }, boothG);
    // solid back walls (x1 side, z1 side) with a lower panel on the glass sides
    const panelM = K.mat("#b4b1aa", { rough: 0.75 });
    K.M(K.box(0.05, bh, bz1 - bz0), panelM, { x: bx1, y: bh / 2, z: (bz0 + bz1) / 2 }, boothG);
    K.M(K.box(bx1 - bx0, bh, 0.05), panelM, { x: (bx0 + bx1) / 2, y: bh / 2, z: bz1 }, boothG);
    K.M(K.box(0.05, 0.95, bz1 - bz0), panelM, { x: bx0, y: 0.6, z: (bz0 + bz1) / 2 }, boothG);
    K.M(K.box(bx1 - bx0, 0.95, 0.05), panelM, { x: (bx0 + bx1) / 2, y: 0.6, z: bz0 }, boothG);
    const glassM = K.mat("#a9bcc4", { phys: true, rough: 0.04, metal: 0, transparent: true, opacity: 0.16, env: 1.4, clearcoat: 1, ccRough: 0.02, depthWrite: false });
    const gl1 = K.M(new T.PlaneGeometry(bz1 - bz0, bh - 1.1), glassM, { x: bx0 - 0.01, y: 1.08 + (bh - 1.1) / 2, z: (bz0 + bz1) / 2, ry: -90, cast: false, layer: K.LAYER.NODEPTH, ro: 3 }, boothG);
    const gl2 = K.M(new T.PlaneGeometry(bx1 - bx0, bh - 1.1), glassM, { x: (bx0 + bx1) / 2, y: 1.08 + (bh - 1.1) / 2, z: bz0 - 0.01, ry: 180, cast: false, layer: K.LAYER.NODEPTH, ro: 3 }, boothG);
    gl1.material.side = T.DoubleSide;
    // inside: counter, chair, dark monitor, warm desk lamp (the one warm practical in the level)
    K.M(K.box(0.6, 0.05, bz1 - bz0 - 0.2), K.mat("#6b5640", { rough: 0.6 }), { x: bx0 + 0.4, y: 1.0, z: (bz0 + bz1) / 2 }, boothG);
    K.M(K.box(0.04, 0.3, 0.5), K.mat("#121314", { rough: 0.3 }), { x: bx0 + 0.55, y: 1.2, z: 2.9, ry: 0 }, boothG);
    K.M(K.cyl(0.24, 0.24, 0.06, 18), K.mat("#1d1e20"), { x: bx0 + 1.2, y: 0.5, z: 2.2 }, boothG);
    K.M(K.box(0.42, 0.5, 0.06), K.mat("#1d1e20"), { x: bx0 + 1.42, y: 0.8, z: 2.2, ry: 90 }, boothG);
    const lampG = K.G({ x: bx0 + 0.45, y: 1.03, z: 1.55 }, boothG);
    K.M(K.cyl(0.07, 0.08, 0.02, 14), K.mat("#2a2a2a"), {}, lampG);
    K.M(K.cyl(0.008, 0.008, 0.32, 6), K.mat("#2a2a2a"), { y: 0.16, rz: 12 }, lampG);
    K.M(K.cyl(0.03, 0.08, 0.1, 14, true), K.mat("#2a2a2a", { side: T.DoubleSide }), { x: -0.05, y: 0.32, rz: 30 }, lampG);
    G.boothBulbM = K.glow("#ffdcb0", 5);
    K.M(K.sph(0.025, 10, 8), G.boothBulbM, { x: -0.06, y: 0.29, cast: false }, lampG);
    G.boothL = K.light.point({ pos: [bx0 + 0.39, 1.28, 1.6], color: "#ffd9ac", I: 0.8, range: 3.5, vol: 0.5 });
    // papers on the counter
    for (let i = 0; i < 3; i++) K.M(new T.PlaneGeometry(0.21, 0.297), K.mat("#e9e6dc", { rough: 0.8 }), { x: bx0 + 0.35 + i * 0.05, y: 1.027 + i * 0.001, z: 2.3 + i * 0.12, rx: -90, rz: 10 + i * 17, cast: false }, boothG);
    // the card, taped inside the aisle-side glass, facing out (−x)
    const ruleText = [["RULE 1:", ["IF THE LIGHTS TURN RED,", "DO NOT RUN."]], ["RULE 2:", ["IF YOU HEAR DRAGGING", "BEHIND YOU, DO NOT TU"]]];
    G.cardTexA = RH3D.ruleCard(K, { key: "card", rules: ruleText, circle: -1 });
    G.cardTexB = RH3D.ruleCard(K, { key: "card", rules: ruleText, circle: 0 });
    G.cardM = K.mat("#ffffff", { phys: true, map: G.cardTexA, transparent: true, alphaTest: 0.3, rough: 0.35, clearcoat: 1, ccRough: 0.12, env: 0.8, unique: true });
    G.cardMesh = K.M(new T.PlaneGeometry(0.30, 0.395), G.cardM, { x: bx0 + 0.02, y: 1.5, z: 2.05, ry: -90, rz: 1.5, cast: false, ro: 2 }, boothG);
    const cardBackM = K.mat("#d9d4c6", { map: RH3D.ruleCard(K, { key: "card-back", rules: ruleText, blank: true }), transparent: true, alphaTest: 0.3, rough: 0.6, unique: true });
    K.M(new T.PlaneGeometry(0.30, 0.395), cardBackM, { x: bx0 + 0.021, y: 1.5, z: 2.05, ry: 90, rz: -1.5, cast: false, ro: 2 }, boothG);
    G.card = (circled) => { G.cardM.map = circled ? G.cardTexB : G.cardTexA; G.cardM.needsUpdate = true; };
    // sign on the booth
    const attTex = K.canvasTex("g-att", 512, 96, (g, w, h) => { g.fillStyle = "#1d3d6b"; g.fillRect(0, 0, w, h); g.fillStyle = "#f4f2ea"; g.font = `800 52px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ATTENDANT", w / 2, h / 2 + 2); });
    K.M(new T.PlaneGeometry(1.4, 0.26), K.mat("#ffffff", { map: attTex, rough: 0.5 }), { x: bx0 - 0.06, y: bh + 0.3, z: 2.4, ry: -90, cast: false }, boothG);
    // 7-segment clock above the booth sign, facing the aisle
    G.clock = RH3D.seg7(K, "g-clock", { text: "23:48" });
    const clockG = K.G({ x: bx0 - 0.08, y: bh - 0.18, z: 1.55, ry: -90 });
    K.M(K.box(0.66, 0.26, 0.08), K.mat("#121212", { rough: 0.5 }), {}, clockG);
    K.M(new T.PlaneGeometry(0.62, 0.22), K.glow("#ffffff", 3.0, { map: G.clock.tex }), { z: 0.041, cast: false }, clockG);
    G.clockG = clockG;

    // ---------------------------------------------------------------- lifts (left wall recess)
    const steelTex = K.canvasTex("g-steel", 256, 512, (g, w, h) => {
      g.fillStyle = "#a8abad"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 40},${i % 2 ? 255 : 40},${i % 2 ? 255 : 40},0.05)`; g.fillRect(0, (i * 53) % h, w, 1); }
      g.fillStyle = "rgba(20,20,20,0.7)"; g.fillRect(w / 2 - 2, 0, 4, h);
      for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(60,55,45,0.08)"; g.fillRect((i * 71) % w, (i * 113) % h, 20, 40); }
    });
    const liftM = K.mat("#ffffff", { map: steelTex, rough: 0.32, metal: 0.9, env: 1.1 });
    G.lifts = [];
    for (const z of [-0.3, 1.5]) {
      K.M(K.box(0.12, 2.3, 1.3), K.mat("#3b3d3f", { rough: 0.4, metal: 0.6 }), { x: X0 + 0.05, y: 1.15, z });
      G.lifts.push(K.M(new T.PlaneGeometry(1.1, 2.1), liftM, { x: X0 + 0.115, y: 1.05, z, ry: 90 }));
    }
    const panel = K.G({ x: X0 + 0.12, y: 1.15, z: 0.6, ry: 90 });
    K.M(K.box(0.14, 0.3, 0.02), K.mat("#9b9ea0", { metal: 0.9, rough: 0.3 }), {}, panel);
    G.callBtnM = K.glow("#ff9a40", 0.05);
    K.M(K.cyl(0.025, 0.025, 0.02, 16), G.callBtnM, { rx: 90, z: 0.012, y: 0.05 }, panel);
    K.M(K.cyl(0.025, 0.025, 0.02, 16), K.mat("#555"), { rx: 90, z: 0.012, y: -0.05 }, panel);
    G.liftPanel = panel;
    const liftSign = K.canvasTex("g-liftsign", 512, 256, (g, w, h) => {
      g.fillStyle = "#f3f1ea"; g.fillRect(0, 0, w, h); g.strokeStyle = "#b8322a"; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
      g.fillStyle = "#b8322a"; g.font = `900 64px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LIFTS LOCKED", w / 2, 92);
      g.fillStyle = "#1a1917"; g.font = `800 52px ${FONT}`; g.fillText("23:30 – 06:00", w / 2, 172);
    });
    K.M(new T.PlaneGeometry(1.0, 0.5), K.mat("#ffffff", { map: liftSign, rough: 0.5 }), { x: X0 + 0.13, y: 2.35, z: 0.6, ry: 90, cast: false });
    // exit signs (green, emissive)
    const exitTex = K.canvasTex("g-exitsign", 256, 96, (g, w, h) => { g.fillStyle = "#0b8f3c"; g.fillRect(0, 0, w, h); g.fillStyle = "#f2fff4"; g.font = `900 54px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("EXIT ↑", w / 2, h / 2 + 2); });
    for (const z of [-22.5, -37.5]) K.M(K.box(0.46, 0.17, 0.05), K.glow("#ffffff", 1.05, { map: exitTex }), { x: 0, y: 2.22, z: z + 0.25, cast: false });

    // ---------------------------------------------------------------- cars
    const parked = [
      ["L", 2, "sedan", "#3a3d42", 0], ["L", 3, "suv", "#d9dad6", 1], ["L", 5, "hatch", "#5a1f22", 0], ["L", 7, "sedan", "#1f2a44", 0], ["L", 9, "suv", "#111214", 1],
      ["L", 10, "sedan", "#8f9399", 0], ["L", 13, "hatch", "#2c4a7a", 0], ["L", 15, "sedan", "#e2e2de", 1], ["L", 17, "suv", "#4b4f54", 0],
      ["R", 2, "hatch", "#9a9ea3", 0], ["R", 4, "sedan", "#0f1012", 1], ["R", 5, "suv", "#4a5249", 0], ["R", 8, "sedan", "#6b6e72", 0], ["R", 9, "hatch", "#dcdcd8", 1],
      ["R", 11, "sedan", "#22304f", 0], ["R", 14, "suv", "#a3a7ab", 0], ["R", 16, "sedan", "#3d3f43", 1],
    ];
    G.cars = [];
    parked.forEach(([side, k, type, color, rev], i) => {
      const z = 1.25 - 2.5 * k, sx = side === "L" ? -1 : 1;
      const c = RH3D.car(K, { type, color, seed: i + 1, plate: ["KX", "RV", "LM", "TQ", "BN", "ZE"][i % 6] + " " + (10 + i * 7) + " " + ["DRA", "MOT", "QEL", "VUN", "SIR", "HAB"][i % 6] });
      const len = RH3D.CAR[type].L;
      c.position.set(sx * (8.25 - len / 2 - 0.15) + (r() - 0.5) * 0.12, 0, z + (r() - 0.5) * 0.18);
      c.rotation.y = (sx < 0 ? -Math.PI / 2 : Math.PI / 2) + (rev ? Math.PI : 0) + (r() - 0.5) * 0.04;
      RH3D.blob(K, { w: 2.3, d: len + 0.5, opacity: 0.82, x: c.position.x, z: c.position.z, ry: 90 });
      G.cars.push(c);
    });
    // wheel stops
    const stopM = K.mat("#c7a032", { rough: 0.7 });
    for (let k = 2; k < 19; k++) for (const sx of [-1, 1]) K.M(K.rbox(0.16, 0.12, 1.6, 0.04), stopM, { x: sx * 8.0, y: 0.06, z: 1.25 - 2.5 * k });

    // ---------------------------------------------------------------- the wet drag mark
    const trailA = K.canvasTex("g-trail", 128, 1024, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const rr = RH3D.rng(66);
      for (let i = 0; i < 520; i++) {
        const y = rr() * h, x = w / 2 + Math.sin(y * 0.01) * 10 + (rr() - 0.5) * w * 0.55, len = 20 + rr() * 90;
        g.strokeStyle = `rgba(255,255,255,${0.12 + rr() * 0.35})`; g.lineWidth = 2 + rr() * 9; g.lineCap = "round";
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rr() - 0.5) * 6, y + len); g.stroke();
      }
      g.fillStyle = "rgba(255,255,255,0.85)"; g.fillRect(w * 0.3, 0, w * 0.4, h);
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.18, "rgba(0,0,0,0)"); gr.addColorStop(0.82, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
      g.globalCompositeOperation = "destination-out"; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over";
    }, { linear: true });
    trailA.wrapS = T.ClampToEdgeWrapping; trailA.wrapT = T.RepeatWrapping;
    G.trailM = K.mat("#0a0606", { phys: true, alphaMap: trailA, transparent: true, rough: 0.05, clearcoat: 1, ccRough: 0.02, env: 1.3, depthWrite: false, unique: true });
    G.trailM.polygonOffset = true; G.trailM.polygonOffsetFactor = -5; G.trailM.polygonOffsetUnits = -5;
    const tz0 = -41.5, tz1 = -12.9;
    const trailMesh = K.M(new T.PlaneGeometry(0.85, 1), G.trailM, { x: 0.2, y: 0.005, z: tz0, rx: -90, cast: false, receive: true, layer: K.LAYER.FLOOR, ro: 1 });
    G.trailMesh = trailMesh;
    G.trail = function (p) {
      p = Math.max(0.0001, Math.min(1, p));
      const len = (tz1 - tz0) * p;
      trailMesh.scale.y = len; trailMesh.position.z = tz0 + len / 2;
      trailA.repeat.set(1, len / 3); trailA.offset.set(0, 0);
      trailMesh.visible = p > 0.001;
    };
    G.trail(0);

    // ---------------------------------------------------------------- extra practicals: sodium wall pack, lift lobby, booth
    const sodium = (x, z, ry, I) => {
      const g = K.G({ x, y: 2.32, z, ry });
      K.M(K.box(0.34, 0.2, 0.18), K.mat("#3b3a37", { rough: 0.5, metal: 0.4 }), { z: 0.09 }, g);
      K.M(K.box(0.28, 0.06, 0.14), K.glow("#ffb04a", 6), { y: -0.11, z: 0.1, cast: false }, g);
      const L = K.light.spot({ pos: [x + Math.sin(ry * K.D2R) * 0.15, 2.18, z + Math.cos(ry * K.D2R) * 0.15], at: [x + Math.sin(ry * K.D2R) * 1.4, 0.2, z + Math.cos(ry * K.D2R) * 1.4], color: "#ffa64a", I, angle: 70, pen: 0.6, range: 10, vol: 0.9 });
      return L;
    };
    G.sodiumFar = sodium(0, Z0 + 0.02, 0, 16);          // washes the LEVEL −4 stencil on the far wall
    G.sodiumLift = sodium(X0 + 0.02, -3.2, 90, 9);       // a warm pool by the lift lobby
    RH3D.tube(K, { pos: [-7.7, 2.5, 0.6], len: 1.2, color: o.white, hdr: 6.5 });
    G.liftL = K.light.spot({ pos: [-7.7, 2.44, 0.6], at: [-8.4, 0.4, 0.6], color: o.white, I: 14, angle: 75, pen: 0.7, range: 8, vol: 0.6 });
    // booth: a cool interior batten -> the booth is a glowing box in the dark level
    K.M(K.box(1.2, 0.04, 0.12), K.glow("#e8f0ff", 5.5), { x: (bx0 + bx1) / 2, y: bh - 0.03, z: (bz0 + bz1) / 2, ry: 90, cast: false }, boothG);
    G.boothTop = K.light.point({ pos: [(bx0 + bx1) / 2, bh - 0.12, (bz0 + bz1) / 2], color: "#e6eeff", I: 2.2, range: 4.5, vol: 0.5 });

    // ---------------------------------------------------------------- fill + shadow keys
    G.hemi = K.light.hemi({ sky: "#6f767e", ground: "#4a4843", I: 0.34 });
    G.key = K.light.spot({ pos: [0, 2.45, -12.4], at: [0, 0, -12.4], color: o.white, I: 0, angle: 60, pen: 0.8, range: 12, cast: 1024, radius: 5, vol: 0.4 });
    G.key2 = K.light.spot({ pos: [0, 2.45, -8.6], at: [0, 0, -8.6], color: o.white, I: 0, angle: 60, pen: 0.8, range: 12, cast: 1024, radius: 5, vol: 0.2 });
    /** put a shadow key at a fixture position (x, z) with colour and intensity */
    G.keyAt = function (L, x, z, hex, I, tx, tz) { L.position.set(x, 2.42, z); L.target.position.set(tx != null ? tx : x, 0, tz != null ? tz : z); L.color.set(hex || o.white); L.intensity = I; };

    G.bakeEnvs = function () {
      const save = G.rows.map((rw) => [rw.w, rw.rd]);
      G.envTube = 0.3;   // tubes at 30 % in the bake: glossy shells show highlights, not a hard bright upper hemisphere
      K.env.bake("white", [0, 1.4, -10], () => { G.allRows(1, 0); G.exit(0); });
      K.env.bake("red", [0, 1.4, -10], () => { G.allRows(0, 1); G.exit(0); });
      K.env.bake("mixed", [0, 1.4, -8], () => { for (let i = 0; i < 13; i++) G.setRow(i, i < 4 ? 1 : 0, i < 4 ? 0 : 1); G.exit(1); });
      G.envTube = 1;
      save.forEach((s, i) => G.setRow(i, s[0], s[1]));
      G.exit(0);
    };
    G.white = o.white; G.red = o.red;
    return G;
  }

  RH3D.garage = garage;
})();
