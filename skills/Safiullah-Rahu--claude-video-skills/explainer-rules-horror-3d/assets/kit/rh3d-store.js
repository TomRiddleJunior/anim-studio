/* rh3d-store.js — "After Closing": a generic big-box furniture showroom at night for the realistic-horror kit (needs
 * core, props, mannequin). No brand: charcoal and white signs that say only BEDROOMS, LIVING ROOMS, KITCHENS, EXIT.
 *
 *   const S = RH3D.store(K, {});
 *   S.section(i, on 0..1, flicker)        4 lighting sections of high-bay lamps (0 = entrance … 3 = far end)
 *   S.arrows[i] / S.arrow(i, red 0..1, turn 0..1)   painted floor arrows along the path (0 = nearest the entrance);
 *                                         red = glow, turn = 0 -> 180° (they point to the exit, then deeper inside)
 *   S.exitSign(on 0..1, flicker)          the green EXIT sign over the plain door at the far end
 *   S.doorGlow(v)                         a thin line of cold light under that door (0 = off)
 *   S.front.bed / S.front.sofa            the front displays seen from the entrance (a bed vignette against the office's
 *                                         front wall, a sofa vignette behind it), so a wide from the doors reads as a store
 *   S.shutter(open 0..1)                  roller shutter in front of the glass entrance doors
 *   S.duvet(bump 0..1)                    the made bed's duvet: 1 = a shape under it, 0 = flat
 *   S.steps(n)                            n wet footprints visible along the path, from the far end toward the hero
 *   S.clock.set("23:59")  S.card(circled) the alarm clock on a nightstand, the rules card on the office desk
 *   S.keyAt(L, pos, at, hex, I)           S.key / S.key2 shadow-casting keys; S.red(i, pos, I) red fills over arrows
 *   S.pathAt(s) -> { p: [x, 0, z], yaw }  a point on the path centre line at arc length s (m) from the entrance
 *   S.bake()                              "store-lit", "store-dark", "store-red" environments
 *
 * Layout (metres): hall x −11…11, z −34…8, slab 6.5 m up. Entrance (glass doors + shutter) at z 8, x −2…2. The path
 * (painted, 2 m wide) winds from the entrance A (0, 5) through B (0, 0), C (−3.5, −5), D (−3.5, −11), E (0, −15),
 * F (3.5, −19), G (3.5, −25), H (2.5, −29) to I (2.5, −32) in front of the plain door (x 2.5, z −34). Room sets beside it:
 * office (desk + card) x 1.6…6, z −5…−0.5 · living room (sofa) x −10…−5.6, z −12…−5 · kitchen x −0.8…4.5, z −12…−6.5 ·
 * bedroom A (the hiding bed, the clock) x −3…1.6, z −25…−19 · bedroom B ("that bed") x 5.6…10, z −26…−19 ·
 * front bed x 1.0…3.7, z −0.4…2.2 · front sofa x −0.1…2.6, z −4.7…−2.4.
 */
(function () {
  const RH3D = window.RH3D;
  const FONT = '"MontserratRH", "Montserrat", "Arial Black", Arial, sans-serif';
  const PATH = [[0, 5], [0, 0], [-3.5, -5], [-3.5, -11], [0, -15], [3.5, -19], [3.5, -25], [2.5, -29], [2.5, -32]];

  function pathLen() { let L = 0; for (let i = 1; i < PATH.length; i++) L += Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]); return L; }
  /** point + heading (deg, the direction of travel deeper into the store) at arc length s from A */
  function pathAt(s) {
    let acc = 0;
    for (let i = 1; i < PATH.length; i++) {
      const a = PATH[i - 1], b = PATH[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s <= acc + l || i === PATH.length - 1) {
        const u = Math.max(0, Math.min(1, (s - acc) / l));
        return { p: [a[0] + (b[0] - a[0]) * u, 0, a[1] + (b[1] - a[1]) * u], yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI };
      }
      acc += l;
    }
  }

  function store(K, o) {
    o = Object.assign({ white: "#e9eef8", red: "#ff2410", green: "#21d16a" }, o || {});
    const T = K.T, S = {};
    const X0 = -11, X1 = 11, Z0 = -34, Z1 = 8, CEIL = 6.5, FW = X1 - X0, FD = Z1 - Z0;
    const r = RH3D.rng(707);
    S.PATH = PATH; S.pathAt = pathAt; S.pathLen = pathLen();

    // ---------------------------------------------------------------- floor: polished concrete, the painted walkway
    const FCW = 1024, FCH = 2048;
    const fx = (x) => ((x - X0) / FW) * FCW, fz = (z) => ((z - Z0) / FD) * FCH;
    const fine = K.concrete("st-fine", { w: 512, h: 512, seed: 41, tone: "#808080", vary: 0.04, pits: 0.3, stains: 0, nstr: 0.8, bump: 0.08, repeat: [FW / 1.2, FD / 1.2] });
    const strokePath = (g, wpx) => { g.beginPath(); PATH.forEach((p, i) => (i ? g.lineTo(fx(p[0]), fz(p[1])) : g.moveTo(fx(p[0]), fz(p[1])))); g.lineWidth = wpx; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
    const floorA = K.canvasTex("st-floorA", FCW, FCH, (g) => {
      g.fillStyle = "#6f706e"; g.fillRect(0, 0, FCW, FCH);
      for (let i = 0; i < 260; i++) { const x = r() * FCW, y = r() * FCH, rad = 30 + r() * 180, dark = r() < 0.5; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, dark ? `rgba(40,40,38,${0.04 + r() * 0.06})` : `rgba(200,198,190,${0.03 + r() * 0.05})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      // saw-cut joints every 4 m
      g.fillStyle = "rgba(25,25,25,0.5)"; for (let x = X0; x <= X1; x += 4) g.fillRect(fx(x) - 1, 0, 2, FCH); for (let z = Z0; z <= Z1; z += 4) g.fillRect(0, fz(z) - 1, FCW, 2);
      // the walkway: pale grey paint with a darker edge line
      g.strokeStyle = "#3e3f40"; strokePath(g, (2.2 / FW) * FCW);
      g.strokeStyle = "#a9aaa6"; strokePath(g, (2.0 / FW) * FCW);
      for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(70,70,70,${r() * 0.12})`; g.fillRect(r() * FCW, r() * FCH, 2 + r() * 6, 1 + r() * 2); }
    });
    const floorR = K.canvasTex("st-floorR", FCW / 2, FCH / 2, (g) => {
      g.fillStyle = "rgb(96,96,96)"; g.fillRect(0, 0, FCW, FCH);   // polished concrete ~0.38
      for (let i = 0; i < 200; i++) { const x = r() * FCW / 2, y = r() * FCH / 2, rad = 10 + r() * 50, v = 80 + r() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${v},${v},${v},0.5)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      g.save(); g.scale(0.5, 0.5); g.strokeStyle = "rgb(165,165,165)"; strokePath(g, (2.1 / FW) * FCW); g.restore();   // paint ~0.65
    }, { linear: true });
    const floorM = K.mat("#ffffff", { map: floorA, roughMap: floorR, normalMap: fine.normal, normalScale: 0.35, rough: 1, env: 0.4, unique: true });
    K.wetFloor(floorM, { wetBelow: 0.45, blur: 20, distort: 0.012, gain: 0.55 });
    K.M(new T.PlaneGeometry(FW, FD), floorM, { x: 0, y: 0, z: (Z0 + Z1) / 2, rx: -90, layer: K.LAYER.FLOOR, cast: false });

    // ---------------------------------------------------------------- shell: walls, high dark ceiling, trusses, ducts, columns
    const wallM = K.mat("#4a4c50", { rough: 0.92, env: 0.3 });
    const ceilM = K.fixtureGlow(K.mat("#2a2b2e", { rough: 0.95, unique: true }));
    K.M(new T.PlaneGeometry(FD, CEIL), wallM, { x: X0, y: CEIL / 2, z: (Z0 + Z1) / 2, ry: 90 });
    K.M(new T.PlaneGeometry(FD, CEIL), wallM, { x: X1, y: CEIL / 2, z: (Z0 + Z1) / 2, ry: -90 });
    K.M(new T.PlaneGeometry(FW, CEIL), wallM, { z: Z0, y: CEIL / 2 });
    for (const sd of [-1, 1]) K.M(new T.PlaneGeometry(9, CEIL), wallM, { x: sd * 6.5, y: CEIL / 2, z: Z1, ry: 180 });
    K.M(new T.PlaneGeometry(4, CEIL - 3.0), wallM, { x: 0, y: 3.0 + (CEIL - 3.0) / 2, z: Z1, ry: 180 });
    K.M(new T.PlaneGeometry(FW, FD), ceilM, { y: CEIL, z: (Z0 + Z1) / 2, rx: 90, cast: false });
    const steel = K.fixtureGlow(K.mat("#34363a", { rough: 0.6, metal: 0.6, unique: true }));
    for (let z = Z1 - 2; z > Z0; z -= 6) { K.M(K.box(FW, 0.5, 0.18), steel, { y: CEIL - 0.35, z, cast: false }); K.M(K.box(FW, 0.06, 0.4), steel, { y: CEIL - 0.62, z, cast: false }); }
    for (const x of [-6.5, 6.8]) K.M(K.cyl(0.32, 0.32, FD, 16, true), K.mat("#7d8084", { rough: 0.45, metal: 0.8 }), { x, y: CEIL - 1.0, z: (Z0 + Z1) / 2, rx: 90, cast: false });
    const colM = K.mat("#5a5d61", { rough: 0.7, metal: 0.3 });
    S.columns = [];
    for (let z = 2; z > Z0; z -= 10) for (const x of [-8, 8]) S.columns.push(K.M(K.box(0.42, CEIL, 0.42), colM, { x, y: CEIL / 2, z }));

    // ---------------------------------------------------------------- signs (charcoal panels, white caps, hung on cables)
    function sign(text, x, z, ry, w) {
      w = w || 2.8;
      const tex = K.canvasTex("st-sign-" + text, 1024, 256, (g, cw, ch) => { g.fillStyle = "#26282b"; g.fillRect(0, 0, cw, ch); g.strokeStyle = "rgba(255,255,255,0.15)"; g.lineWidth = 6; g.strokeRect(10, 10, cw - 20, ch - 20); g.fillStyle = "#f2f2ee"; g.font = `800 120px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cw / 2, ch / 2 + 6); });
      const gS = K.G({ x, y: 4.3, z, ry: ry || 0 });
      const m = K.mat("#ffffff", { map: tex, rough: 0.6, emi: "#ffffff", emiMap: tex, emiI: 0.08 });
      K.M(K.box(w, w / 4, 0.04), K.mat("#1f2023", { rough: 0.6 }), { cast: false }, gS);
      K.M(new T.PlaneGeometry(w, w / 4), m, { z: 0.021, cast: false }, gS);
      K.M(new T.PlaneGeometry(w, w / 4), m, { z: -0.021, ry: 180, cast: false }, gS);
      for (const sx of [-w * 0.4, w * 0.4]) K.M(K.cyl(0.004, 0.004, CEIL - 4.3, 4), K.mat("#111"), { x: sx, y: (CEIL - 4.3) / 2 + w / 8, cast: false }, gS);
      return gS;
    }
    S.signs = [sign("EXIT", 0, 3.5, 0, 2.2), sign("LIVING ROOMS", -6.8, -4.2, 0, 3.4), sign("KITCHENS", 2.2, -5.6, 0, 3.0), sign("BEDROOMS", 1.0, -16.5, 0, 3.2)];
    S.redraw = () => {};

    // ---------------------------------------------------------------- room sets
    const paint = (hex) => K.mat(hex, { rough: 0.9, env: 0.3 });
    const wood = K.mat("#8a6a4c", { rough: 0.55 }), darkWood = K.mat("#4a3628", { rough: 0.5 }), white = K.mat("#e9e6df", { rough: 0.6 });
    const fabric = (hex) => K.mat(hex, { rough: 0.95, sheen: 0.5, sheenHex: "#ffffff" });
    /** three low walls (2.6 m) around [x0,x1]x[z0,z1], open on side `open` ("+x" | "-x" | "+z" | "-z") */
    function roomSet(x0, x1, z0, z1, openSides, hex, rugHex) {
      const g = K.G({}), m = paint(hex), H = 2.6, th = 0.1;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const op = [].concat(openSides), open = { includes: (s) => op.includes(s) };
      if (!open.includes("-x")) K.M(K.box(th, H, z1 - z0), m, { x: x0, y: H / 2, z: cz }, g);
      if (!open.includes("+x")) K.M(K.box(th, H, z1 - z0), m, { x: x1, y: H / 2, z: cz }, g);
      if (!open.includes("-z")) K.M(K.box(x1 - x0, H, th), m, { x: cx, y: H / 2, z: z0 }, g);
      if (!open.includes("+z")) K.M(K.box(x1 - x0, H, th), m, { x: cx, y: H / 2, z: z1 }, g);
      if (rugHex) K.M(new T.PlaneGeometry((x1 - x0) * 0.62, (z1 - z0) * 0.55), K.mat(rugHex, { rough: 1 }), { x: cx, y: 0.006, z: cz, rx: -90, cast: false, layer: K.LAYER.FLOOR }, g);
      // a low platform edge (the set's floor is raised 2 cm) — catches light
      K.M(K.box(x1 - x0, 0.02, z1 - z0), K.mat("#5b5a57", { rough: 0.8 }), { x: cx, y: 0.01, z: cz, receive: true, cast: false }, g);
      return g;
    }
    function lamp(x, y, z, I, parent) {   // a warm table/floor lamp: glow bulb + shade + light
      const sh = K.M(K.cyl(0.13, 0.18, 0.22, 20, true), K.mat("#efe4cf", { rough: 0.9, side: T.DoubleSide, emi: "#ffbf75", emiI: 0.6 }), { x, y, z, cast: false }, parent);
      K.M(K.sph(0.03, 10, 8), K.glow("#ffd6a0", 6), { x, y: y - 0.03, z, cast: false }, parent);
      const L = K.light.point({ pos: [x, y - 0.05, z], color: "#ffc98a", I, range: 5, vol: 0.5 });
      return { shade: sh, L };
    }
    S.lamps = [];
    function bed(x, z, ry, duvetHex, opts) {
      opts = opts || {};
      const g = K.G({ x, z, ry });
      // frame on legs (0.3 m clearance), headboard at local −z
      // (0.4 m under the frame: room for someone to hide)
      K.M(K.rbox(1.7, 0.12, 2.15, 0.02), wood, { y: 0.46 }, g);
      for (const [lx, lz] of [[-0.8, -1.02], [0.8, -1.02], [-0.8, 1.02], [0.8, 1.02]]) K.M(K.box(0.06, 0.4, 0.06), wood, { x: lx, y: 0.2, z: lz }, g);
      K.M(K.rbox(1.76, 1.15, 0.1, 0.03), fabric("#8a8378"), { y: 0.96, z: -1.1 }, g);
      K.M(K.rbox(1.6, 0.22, 2.0, 0.06), white, { y: 0.63, z: 0.02 }, g);
      for (const px of [-0.42, 0.42]) K.M(K.rbox(0.62, 0.16, 0.42, 0.07, 0.03), fabric("#f2efe8"), { x: px, y: 0.82, z: -0.78, rx: -12 }, g);
      // duvet: a soft slab with an optional body-shaped bump that flattens
      const dv = new T.BoxGeometry(1.7, 0.08, 1.55, 30, 1, 30);
      const pa = dv.attributes.position, base = Float32Array.from(pa.array), bump = new Float32Array(pa.count);
      for (let i = 0; i < pa.count; i++) {
        const X = pa.getX(i), Y = pa.getY(i), Z = pa.getZ(i);
        let y = Y + (Y > 0 ? 0.018 * Math.sin(X * 9) * Math.cos(Z * 6) : 0);
        if (Math.abs(X) > 0.8) y -= 0.08 * (Math.abs(X) - 0.8) / 0.05;   // falls over the sides
        base[i * 3 + 1] = y;
        if (Y > 0) { const bx = X / 0.32, bz = (Z + 0.05) / 0.62; const b = Math.exp(-(bx * bx + bz * bz) * 1.4) + 0.5 * Math.exp(-(((X) / 0.18) ** 2 + ((Z + 0.62) / 0.16) ** 2)); bump[i] = 0.28 * b; }
      }
      const dm = K.M(dv, fabric(duvetHex), { y: 0.78, z: 0.25 }, g);
      const set = (h) => { for (let i = 0; i < pa.count; i++) pa.setY(i, base[i * 3 + 1] + bump[i] * h); pa.needsUpdate = true; dv.computeVertexNormals(); };
      set(opts.bump || 0);
      let cur = opts.bump || 0;
      // price tag on a string from the side rail
      if (opts.tag) {
        const tag = K.canvasTex("st-tag", 256, 160, (tg, w, h) => { tg.fillStyle = "#f4f3ee"; tg.fillRect(0, 0, w, h); tg.fillStyle = "#1c1c1c"; tg.font = `900 70px ${FONT}`; tg.textAlign = "center"; tg.fillText("399.–", w / 2, 92); tg.font = `700 22px ${FONT}`; tg.fillText("BED FRAME 160 × 200", w / 2, 135); });
        const tg = K.G({ x: 0.32, y: 0.41, z: 1.09 }, g);   // hangs from the foot rail, in front of the gap under the bed
        K.M(K.cyl(0.0015, 0.0015, 0.08, 4), K.mat("#ddd"), { y: -0.04, cast: false }, tg);
        S.tagMesh = K.M(new T.PlaneGeometry(0.1, 0.0625), K.mat("#ffffff", { map: tag, rough: 0.7, side: T.DoubleSide }), { y: -0.11, ry: 8, cast: false }, tg);
        S.tagG = tg;
      }
      return { group: g, duvet: (h) => { if (Math.abs(h - cur) > 1e-4) { cur = h; set(h); } } };
    }
    function nightstand(x, z, ry, parent) {
      const g = K.G({ x, z, ry }, parent);
      K.M(K.rbox(0.46, 0.5, 0.4, 0.02), wood, { y: 0.25 }, g);
      return g;
    }

    // office (desk + chair + shelf + desk lamp + the card)
    roomSet(1.6, 6.0, -5.0, -0.5, "-x", "#9aa39a", "#5b6266");
    const desk = K.G({ x: 3.6, z: -2.6, ry: -90 });
    K.M(K.box(1.4, 0.04, 0.7), K.mat("#d8d2c4", { rough: 0.5 }), { y: 0.74 }, desk);
    for (const [lx, lz] of [[-0.66, -0.3], [0.66, -0.3], [-0.66, 0.3], [0.66, 0.3]]) K.M(K.box(0.04, 0.72, 0.04), K.mat("#2a2a2a", { metal: 0.6, rough: 0.4 }), { x: lx, y: 0.36, z: lz }, desk);
    const chair = K.G({ x: 0.0, z: 0.55, ry: 180 }, desk);
    K.M(K.rbox(0.48, 0.08, 0.46, 0.03), fabric("#3c3f44"), { y: 0.48 }, chair); K.M(K.rbox(0.46, 0.5, 0.06, 0.03), fabric("#3c3f44"), { y: 0.8, z: -0.2 }, chair);
    K.M(K.cyl(0.025, 0.025, 0.42, 8), K.mat("#222"), { y: 0.24 }, chair); K.M(K.cyl(0.28, 0.28, 0.03, 5), K.mat("#222"), { y: 0.04 }, chair);
    const dl = K.G({ x: -0.45, y: 0.76, z: -0.18 }, desk);
    K.M(K.cyl(0.07, 0.08, 0.02, 16), K.mat("#1b1b1b"), {}, dl); K.M(K.cyl(0.008, 0.008, 0.4, 6), K.mat("#1b1b1b"), { y: 0.2, rz: -14 }, dl);
    K.M(K.cyl(0.035, 0.09, 0.12, 16, true), K.mat("#1b1b1b", { side: T.DoubleSide }), { x: 0.1, y: 0.39, rz: -40 }, dl);
    K.M(K.sph(0.025, 10, 8), K.glow("#ffe2b8", 6), { x: 0.11, y: 0.37, cast: false }, dl);
    const shelf = K.G({ x: 5.85, z: -2.6, ry: -90 });
    K.M(K.box(1.2, 1.8, 0.35), K.mat("#e8e4dc", { rough: 0.6 }), { y: 0.9 }, shelf);
    for (let i = 0; i < 6; i++) K.M(K.box(0.3, 0.26, 0.3), K.mat(["#7d8a8f", "#b9a58a", "#596165", "#c9c3b8", "#8f7d6b", "#6c7a6d"][i]), { x: -0.4 + (i % 3) * 0.4, y: 0.5 + Math.floor(i / 3) * 0.55, z: 0.03 }, shelf);
    desk.updateMatrixWorld(true);
    // the card lies on the desk, under the lamp, facing up
    const rules = [["RULE 1:", ["THE ARROWS ALWAYS", "POINT TO THE EXIT.", "IF THEY EVER TURN,", "DO NOT FOLLOW THEM."]], ["RULE 2:", ["IF YOU HEAR FOOTSTEPS,", "NEVER TURN AR"]]];
    const cardOpts = (circle, key) => ({ key: key || "st-card", title: ["NIGHT STAFF", "RULES"], sub: "STORE TEAM ONLY", rules, circle });
    S.cardTexA = RH3D.ruleCard(K, cardOpts(-1)); S.cardTexB = RH3D.ruleCard(K, cardOpts(0));
    S.cardM = K.mat("#ffffff", { phys: true, map: S.cardTexA, transparent: true, alphaTest: 0.3, rough: 0.35, clearcoat: 1, ccRough: 0.12, env: 0.6, unique: true });
    S.cardPos = [3.42, 0.762, -2.5];
    S.cardMesh = K.M(new T.PlaneGeometry(0.2, 0.263), S.cardM, { x: S.cardPos[0], y: S.cardPos[1], z: S.cardPos[2], rx: -90, rz: -90 - 4, cast: false, ro: 2 });
    S.card = (c) => { S.cardM.map = c ? S.cardTexB : S.cardTexA; S.cardM.needsUpdate = true; };
    S.deskL = K.light.spot({ pos: [3.5, 1.25, -2.7], at: [3.42, 0.76, -2.5], color: "#ffd9a8", I: 3.0, angle: 42, pen: 0.7, range: 4, vol: 0.4 });
    S.lamps.push(S.deskL);

    // living room (sofa)
    roomSet(-10.0, -5.6, -12.0, -5.0, "+x", "#b8ab98", "#7b6a5c");
    const sofa = K.G({ x: -9.3, z: -8.5, ry: 90 });
    const sf = fabric("#6f7378");
    K.M(K.rbox(2.3, 0.42, 0.95, 0.05), sf, { y: 0.24 }, sofa);
    for (const sx of [-1.12, 1.12]) K.M(K.rbox(0.2, 0.62, 0.95, 0.06), sf, { x: sx, y: 0.34 }, sofa);
    for (let i = 0; i < 3; i++) { K.M(K.rbox(0.68, 0.14, 0.72, 0.06, 0.03), sf, { x: -0.7 + i * 0.7, y: 0.5, z: 0.08 }, sofa); K.M(K.rbox(0.68, 0.48, 0.18, 0.07, 0.03), sf, { x: -0.7 + i * 0.7, y: 0.78, z: -0.36, rx: -8 }, sofa); }
    S.sofaSeat = [-9.3 + 0.08 * 0, 0.0, -8.5];
    K.M(K.rbox(1.1, 0.06, 0.6, 0.02), darkWood, { x: -7.7, y: 0.42, z: -8.5 });
    for (const [lx, lz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) K.M(K.box(0.04, 0.4, 0.04), darkWood, { x: -7.7 + lz, y: 0.2, z: -8.5 + lx });
    K.M(K.cyl(0.012, 0.012, 1.5, 6), K.mat("#2a2a2a"), { x: -9.6, y: 0.75, z: -10.4 }); K.M(K.cyl(0.15, 0.15, 0.02, 16), K.mat("#2a2a2a"), { x: -9.6, y: 0.01, z: -10.4 });
    S.lamps.push(lamp(-9.6, 1.55, -10.4, 3.2).L);
    K.M(K.box(1.6, 0.5, 0.4), darkWood, { x: -5.85, y: 0.25, z: -8.5, ry: 90 });
    K.M(K.box(1.2, 0.68, 0.05), K.mat("#0b0c0e", { rough: 0.2, metal: 0.4 }), { x: -5.95, y: 0.95, z: -8.5, ry: -90 });

    // kitchen
    roomSet(-0.8, 4.5, -12.0, -6.5, ["-x", "+z"], "#c9c4ba", null);
    const cab = K.mat("#d9d6cf", { rough: 0.5 }), top = K.mat("#3b3b3b", { rough: 0.25, metal: 0.1 });
    K.M(K.box(0.6, 0.86, 4.6), cab, { x: 4.1, y: 0.43, z: -9.25 }); K.M(K.box(0.64, 0.04, 4.6), top, { x: 4.08, y: 0.88, z: -9.25 });
    K.M(K.box(0.36, 0.72, 4.6), cab, { x: 4.25, y: 1.95, z: -9.25 });
    for (let i = 0; i < 6; i++) K.M(K.box(0.01, 0.03, 0.14), K.mat("#888", { metal: 0.9, rough: 0.3 }), { x: 3.79, y: 0.75, z: -11.2 + i * 0.78 });
    K.M(K.box(0.5, 0.02, 0.6), K.mat("#b8bbbe", { metal: 0.9, rough: 0.25 }), { x: 4.05, y: 0.905, z: -8.4 });
    K.M(K.box(1.0, 0.9, 2.0), cab, { x: 1.9, y: 0.45, z: -9.3 }); K.M(K.box(1.1, 0.04, 2.1), top, { x: 1.9, y: 0.92, z: -9.3 });
    for (const pz of [-9.9, -8.7]) { K.M(K.cyl(0.004, 0.004, 1.5, 4), K.mat("#111"), { x: 1.9, y: 2.0, z: pz, cast: false }); K.M(K.cyl(0.05, 0.16, 0.18, 16, true), K.mat("#1e1e1e", { side: T.DoubleSide }), { x: 1.9, y: 1.22, z: pz, cast: false }); K.M(K.sph(0.03, 8, 6), K.glow("#ffd6a0", 5), { x: 1.9, y: 1.18, z: pz, cast: false }); }
    S.lamps.push(K.light.point({ pos: [1.9, 1.1, -9.3], color: "#ffc98a", I: 4.0, range: 5, vol: 0.4 }));

    // bedroom A: the hiding bed (price tag), nightstand with the alarm clock and a lamp
    roomSet(-3.0, 1.6, -25.0, -19.0, "+x", "#a3a7ad", "#8c8f94");
    S.bedA = bed(-1.55, -22.0, 90, "#cfc9bd", { tag: true });
    const nsA = nightstand(-2.55, -20.7, 90);
    S.clock = RH3D.seg7(K, "st-clock", { text: "23:59", color: "#ff3a22" });
    const ck = K.G({ x: -2.5, y: 0.5, z: -20.65, ry: 90 + 20 });
    K.M(K.rbox(0.2, 0.09, 0.08, 0.02), K.mat("#121212", { rough: 0.4 }), { y: 0.045 }, ck);
    K.M(new T.PlaneGeometry(0.17, 0.06), K.glow("#ffffff", 2.4, { map: S.clock.tex }), { y: 0.05, z: 0.041, cast: false }, ck);
    S.clockPos = [-2.5, 0.55, -20.65];
    nightstand(-2.55, -23.3, 90);
    S.lamps.push(lamp(-2.55, 0.86, -23.3, 3.0).L);
    // bedroom B: "that bed" (made, a shape under the duvet)
    roomSet(5.6, 10.0, -26.0, -19.0, "-x", "#9c8f86", "#6d625b");
    S.bedB = bed(8.6, -22.5, -90, "#bcb2a4", { bump: 1 });
    nightstand(9.6, -20.8, -90); nightstand(9.6, -24.2, -90);
    S.lamps.push(lamp(9.6, 0.86, -24.2, 2.8).L);
    S.duvet = (h) => S.bedB.duvet(h);

    // front displays, right behind the entrance (so the first wide reads as a furniture store in under a second):
    // a bedroom vignette against the outside of the office's front wall, a living-room vignette beside the walkway
    // behind it (backed by the office's rear wall), each with warm lamps that stay on when the sections go dark
    const stem = K.mat("#2a2a2a", { rough: 0.5, metal: 0.4 });
    const lampOn = (x, z, h, I) => {   // a lamp with a stem: table lamp (h ≈ 0.86, on a nightstand) or floor lamp (h ≈ 1.55)
      const y0 = h > 1.2 ? 0 : 0.5;
      K.M(K.cyl(0.012, 0.012, h - 0.11 - y0, 6), stem, { x, y: y0 + (h - 0.11 - y0) / 2, z }); if (!y0) K.M(K.cyl(0.15, 0.15, 0.02, 16), stem, { x, y: 0.01, z });
      return lamp(x, h, z, I).L;
    };
    function sofaAt(x, z, ry, hex) {
      const g = K.G({ x, z, ry }), m = fabric(hex);
      K.M(K.rbox(2.3, 0.42, 0.95, 0.05), m, { y: 0.24 }, g);
      for (const sx of [-1.12, 1.12]) K.M(K.rbox(0.2, 0.62, 0.95, 0.06), m, { x: sx, y: 0.34 }, g);
      for (let i = 0; i < 3; i++) { K.M(K.rbox(0.68, 0.14, 0.72, 0.06, 0.03), m, { x: -0.7 + i * 0.7, y: 0.5, z: 0.08 }, g); K.M(K.rbox(0.68, 0.48, 0.18, 0.07, 0.03), m, { x: -0.7 + i * 0.7, y: 0.78, z: -0.36, rx: -8 }, g); }
      for (const [cx, rz] of [[-0.78, 8], [0.8, -8]]) K.M(K.rbox(0.42, 0.38, 0.13, 0.06, 0.03), fabric("#cfc4ae"), { x: cx, y: 0.76, z: -0.2, rx: -14, rz }, g);
      return g;
    }
    S.front = {};
    // bedroom vignette: rug, a made bed with its headboard to the office's front wall, two nightstands, two lamps, a print
    K.M(new T.PlaneGeometry(2.9, 2.4), K.mat("#86786a", { rough: 1 }), { x: 2.35, y: 0.006, z: 0.95, rx: -90, cast: false, layer: K.LAYER.FLOOR });
    S.front.bed = bed(2.35, 0.73, 0, "#d8cdbb");
    nightstand(1.26, -0.12, 0); nightstand(3.44, -0.12, 0);
    S.lamps.push(lampOn(1.26, -0.12, 0.86, 4.0)); S.lamps.push(lampOn(3.44, -0.12, 0.86, 2.6));
    const art = K.canvasTex("st-art", 512, 340, (g, w, h) => {
      g.fillStyle = "#e7e0d2"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#b9a58a"; g.beginPath(); g.arc(w * 0.36, h * 0.56, 92, 0, 7); g.fill();
      g.fillStyle = "#7d8a8f"; g.fillRect(w * 0.52, h * 0.2, 150, 170);
      g.strokeStyle = "#3b3b3b"; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.12, h * 0.82); g.bezierCurveTo(w * 0.4, h * 0.6, w * 0.6, h * 0.95, w * 0.9, h * 0.7); g.stroke();
    });
    K.M(K.box(0.98, 0.68, 0.03), darkWood, { x: 2.35, y: 1.98, z: -0.435, cast: false });
    K.M(new T.PlaneGeometry(0.9, 0.6), K.mat("#ffffff", { map: art, rough: 0.8 }), { x: 2.35, y: 1.98, z: -0.418, cast: false });
    // living-room vignette: rug, a sofa facing the entrance, cushions, a coffee table, a floor lamp
    K.M(new T.PlaneGeometry(2.9, 2.3), K.mat("#6e665d", { rough: 1 }), { x: 1.1, y: 0.006, z: -3.55, rx: -90, cast: false, layer: K.LAYER.FLOOR });
    S.front.sofa = sofaAt(1.1, -4.15, 0, "#857b70");
    K.M(K.rbox(1.0, 0.05, 0.55, 0.02), darkWood, { x: 1.1, y: 0.4, z: -2.95 });
    for (const [lx, lz] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) K.M(K.box(0.04, 0.38, 0.04), darkWood, { x: 1.1 + lx, y: 0.19, z: -2.95 + lz });
    S.lamps.push(lampOn(2.45, -4.45, 1.55, 4.0));
    // kitchen: a warm strip under the wall cabinets
    K.M(K.box(0.04, 0.015, 4.4), K.glow("#ffd7a8", 4), { x: 4.1, y: 1.58, z: -9.25, cast: false });
    S.lamps.push(K.light.point({ pos: [3.9, 1.4, -9.25], color: "#ffc98a", I: 2.2, range: 4, vol: 0.3 }));

    // ---------------------------------------------------------------- the plain door at the far end + green EXIT sign
    const doorG = K.G({ x: 2.5, z: Z0 + 0.02 });
    K.M(K.box(1.1, 2.2, 0.06), K.mat("#3a3c3f", { rough: 0.5, metal: 0.6 }), { y: 1.1, z: 0.03 }, doorG);
    K.M(K.box(0.94, 2.08, 0.05), K.mat("#6d7176", { rough: 0.55, metal: 0.2, env: 0.6 }), { y: 1.06, z: 0.07 }, doorG);
    // a thin line of cold light under the door (off until S.doorGlow(v))
    S.doorGapM = K.glow("#d8e6ff", 1);
    K.M(new T.PlaneGeometry(0.94, 0.016), S.doorGapM, { y: 0.008, z: 0.097, cast: false }, doorG);
    S.doorGlow = (v) => { S.doorGapM.color.set("#d8e6ff").multiplyScalar(Math.max(0, v) * 4); };
    S.doorGlow(0);
    K.M(K.box(0.7, 0.04, 0.06), K.mat("#b8bbbe", { metal: 0.9, rough: 0.3 }), { y: 1.0, z: 0.12 }, doorG);
    const exitT = K.canvasTex("st-exit", 256, 96, (g, w, h) => { g.fillStyle = "#0a2a15"; g.fillRect(0, 0, w, h); g.fillStyle = "#e9fff0"; g.font = `900 60px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("EXIT", w / 2 + 14, h / 2 + 3); g.beginPath(); g.moveTo(34, 48); g.lineTo(58, 30); g.lineTo(58, 66); g.closePath(); g.fill(); });
    S.exitM = K.glow("#ffffff", 0.0, { map: exitT });
    K.M(K.box(0.5, 0.2, 0.06), K.mat("#1a1a1a"), { y: 2.45, z: 0.03 }, doorG);
    K.M(new T.PlaneGeometry(0.46, 0.17), S.exitM, { y: 2.45, z: 0.065, cast: false }, doorG);
    S.exitL = K.light.point({ pos: [2.5, 2.3, Z0 + 0.4], color: o.green, I: 0, range: 5, vol: 1.2 });
    S.exitSign = (on, f) => { const v = Math.max(0, on) * (f == null ? 1 : f); S.exitM.color.setRGB(1, 1, 1).multiplyScalar(0.04 + 2.4 * v); S.exitL.intensity = 2.2 * v; };
    S.exitSign(0);
    S.doorPos = [2.5, 1.1, Z0 + 0.1];

    // ---------------------------------------------------------------- entrance: glass doors, shutter, "OPENS 10:00", street light
    const frameM = K.mat("#2c2e31", { rough: 0.4, metal: 0.7 });
    for (const x of [-2, -1, 0, 1, 2]) K.M(K.box(0.06, 3.0, 0.08), frameM, { x, y: 1.5, z: Z1 - 0.3 });
    K.M(K.box(4.1, 0.08, 0.08), frameM, { y: 2.98, z: Z1 - 0.3 }); K.M(K.box(4.1, 0.06, 0.08), frameM, { y: 0.03, z: Z1 - 0.3 });
    const glassM = K.mat("#a9bcc4", { phys: true, rough: 0.04, transparent: true, opacity: 0.14, env: 1.3, clearcoat: 1, ccRough: 0.02, depthWrite: false });
    K.M(new T.PlaneGeometry(4, 2.9), glassM, { y: 1.5, z: Z1 - 0.3, cast: false, layer: K.LAYER.NODEPTH, ro: 3 });
    for (const x of [-0.5, 0.5]) K.M(K.box(0.03, 0.5, 0.03), K.mat("#c0c3c6", { metal: 0.9, rough: 0.3 }), { x: x * 0.15, y: 1.05, z: Z1 - 0.38 });
    const hours = K.canvasTex("st-hours", 512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "rgba(245,245,240,0.95)"; g.fillRect(40, 40, w - 80, h - 80); g.fillStyle = "#1c1c1c"; g.textAlign = "center"; g.font = `800 50px ${FONT}`; g.fillText("STORE HOURS", w / 2, 130); g.fillRect(90, 160, w - 180, 4); g.font = `900 92px ${FONT}`; g.fillText("OPENS", w / 2, 280); g.fillText("10:00", w / 2, 390); g.font = `700 34px ${FONT}`; g.fillText("CLOSES 21:00", w / 2, 450); }, { clamp: true });
    S.hoursPos = [0.55, 1.45, Z1 - 0.33];
    K.M(new T.PlaneGeometry(0.42, 0.42), K.mat("#ffffff", { map: hours, transparent: true, rough: 0.6 }), { x: S.hoursPos[0], y: S.hoursPos[1], z: S.hoursPos[2], ry: 180, cast: false, ro: 4 });
    // outside: a cold street light on wet pavement
    K.M(new T.PlaneGeometry(14, 10), K.mat("#3a3d42", { rough: 0.3, env: 0.6 }), { y: -0.01, z: Z1 + 5, rx: -90, cast: false });
    K.M(new T.PlaneGeometry(14, 6), K.glow("#1a2232", 0.6), { y: 3, z: Z1 + 9, ry: 180, cast: false });
    S.streetL = K.light.spot({ pos: [1.5, 5, Z1 + 4], at: [0, 0, Z1 - 3], color: "#b9c8e6", I: 60, angle: 40, pen: 0.6, range: 20, vol: 0.8 });
    // roller shutter (slats), inside the glass, travels up into its housing
    const slatA = K.canvasTex("st-slatA", 256, 512, (g, w, h) => { g.fillStyle = "#8f9295"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = "rgba(20,20,22,0.35)"; g.fillRect(0, y, w, 3); } });
    const slatN = K.canvasTex("st-slatN", 64, 512, (g, w, h) => { for (let y = 0; y < h; y++) { const u = (y % 32) / 32, n = Math.sin(u * Math.PI * 2) * 0.8; g.fillStyle = `rgb(128,${Math.round(128 + n * 110)},${Math.round(225 - Math.abs(n) * 40)})`; g.fillRect(0, y, w, 1); } }, { linear: true, repeat: [1, 4] });
    // (outside the glass: from inside you see the doors, the hours sign, and the shutter beyond them)
    const shutG = K.G({ x: 0, y: 0, z: Z1 + 0.3 });
    S.shutterMesh = K.M(K.box(4.2, 3.0, 0.05), K.mat("#ffffff", { map: slatA, normalMap: slatN, rough: 0.4, metal: 0.75, env: 0.9 }), { y: 1.5 }, shutG);
    K.M(K.box(4.4, 0.5, 0.5), K.mat("#4b4e52", { rough: 0.5, metal: 0.6 }), { y: 3.25, z: Z1 + 0.3 });
    S.shutter = (open) => { S.shutterMesh.position.y = 1.5 + 2.95 * Math.max(0, Math.min(1, open)); };
    S.shutter(1);
    // ceiling speaker (PA) on the first column by the entrance aisle
    const spk = K.G({ x: -7.79, y: 3.4, z: 2, ry: 90 });
    K.M(K.cyl(0.14, 0.14, 0.06, 24), K.mat("#e8e8e4", { rough: 0.5 }), { rx: 90 }, spk);
    const grille = K.canvasTex("st-grille", 128, 128, (g, w, h) => { g.fillStyle = "#e8e8e4"; g.fillRect(0, 0, w, h); g.fillStyle = "#2a2a2a"; for (let y = 10; y < h; y += 9) for (let x = 10; x < w; x += 9) if ((x - 64) ** 2 + (y - 64) ** 2 < 50 * 50) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } });
    K.M(new T.CircleGeometry(0.13, 24), K.mat("#ffffff", { map: grille, rough: 0.6 }), { z: 0.031, cast: false }, spk);
    S.speakerPos = [-7.75, 3.4, 2];

    // ---------------------------------------------------------------- lighting sections (high-bay lamps), one spot each
    S.sections = [];
    const secZ = [[6, -4], [-4, -14], [-14, -24], [-24, -34]];
    secZ.forEach(([za, zb], i) => {
      const glows = [];
      for (const x of [-6, 0, 6]) for (const z of [za - 2.5, zb + 2.5]) {
        const g = K.G({ x, y: 5.5, z });
        K.M(K.cyl(0.32, 0.42, 0.3, 24, true), K.mat("#3d4044", { rough: 0.4, metal: 0.7, side: T.DoubleSide }), { cast: false }, g);
        const gm = K.glow(o.white, 6); K.M(new T.CircleGeometry(0.3, 24), gm, { y: -0.15, rx: 90, cast: false }, g);
        K.M(K.cyl(0.004, 0.004, 0.85, 4), K.mat("#111"), { y: 0.55, cast: false }, g);
        glows.push(gm);
      }
      const L = K.light.spot({ pos: [0, 5.4, (za + zb) / 2], at: [0, 0, (za + zb) / 2], color: o.white, I: 110, angle: 70, pen: 0.8, range: 20, vol: 0.8 });
      const L2 = K.light.spot({ pos: [-6, 5.4, (za + zb) / 2], at: [-6.5, 0, (za + zb) / 2], color: o.white, I: 50, angle: 60, pen: 0.8, range: 16, vol: 0.4 });
      const gp = K.glowPts[i] || (K.glowPts[i] = { p: [0, 5.3, (za + zb) / 2], c: [0, 0, 0] });
      S.sections.push({ glows, L, L2, gp, on: 1 });
    });
    const cW = new T.Color(o.white);
    S.section = function (i, on, f) {
      const s = S.sections[i]; if (!s) return;
      const v = Math.max(0, on) * (f == null ? 1 : f);
      s.glows.forEach((m) => m.color.copy(cW).multiplyScalar(6 * v * (S.envDim || 1) + 0.02));
      s.L.intensity = 110 * v; s.L2.intensity = 50 * v;
      s.gp.c[0] = cW.r * 2.2 * v; s.gp.c[1] = cW.g * 2.2 * v; s.gp.c[2] = cW.b * 2.2 * v;
      s.on = v;
    };
    S.hemi = K.light.hemi({ sky: "#7a8290", ground: "#4a4744", I: 0.6 });

    // ---------------------------------------------------------------- painted arrows along the walkway
    const arrowTex = K.canvasTex("st-arrow", 256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = "#ffffff";
      g.beginPath(); g.moveTo(w / 2, 18); g.lineTo(w - 36, 118); g.lineTo(w / 2 + 34, 118); g.lineTo(w / 2 + 34, h - 18); g.lineTo(w / 2 - 34, h - 18); g.lineTo(w / 2 - 34, 118); g.lineTo(36, 118); g.closePath(); g.fill();
    }, { linear: false, clamp: true });
    S.arrows = [];
    const L0 = S.pathLen;
    for (let s = 1.6; s < L0 - 1.0; s += 2.7) {
      const q = pathAt(s);
      const m = K.mat("#f1f1ec", { map: arrowTex, transparent: true, alphaTest: 0.4, rough: 0.6, emi: o.red, emiMap: arrowTex, emiI: 0, unique: true, polyOff: 3 });
      const mesh = K.M(new T.PlaneGeometry(0.9, 0.9), m, { x: q.p[0], y: 0.006, z: q.p[2], rx: -90, cast: false, receive: true, layer: K.LAYER.FLOOR, ro: 1 });
      // the texture's arrow points to canvas top (= plane +y = world −z after rx −90); toward the exit = heading + 180
      const base = q.yaw + 180;
      S.arrows.push({ mesh, m, s, p: q.p, yaw: q.yaw, base });
    }
    S.arrow = function (i, red, turn) {
      const a = S.arrows[i]; if (!a) return;
      const yaw = a.base + 180 * Math.max(0, Math.min(1, turn || 0));
      a.mesh.rotation.set(-Math.PI / 2, 0, (yaw + 180) * Math.PI / 180, "XYZ");
      a.m.emissiveIntensity = 3.2 * Math.max(0, red);
      a.m.color.setScalar(1 - 0.75 * Math.min(1, red));
    };
    S.arrows.forEach((a, i) => S.arrow(i, 0, 0));
    // red spill lights placed over the visible arrows per shot
    S.reds = [0, 1, 2].map(() => K.light.point({ pos: [0, 0.4, 0], color: o.red, I: 0, range: 3.5, vol: 0.3 }));
    S.red = (i, pos, I) => { const L = S.reds[i]; L.position.fromArray(pos); L.intensity = I; };

    // ---------------------------------------------------------------- footprints (wet), from the far end toward the hero
    const fpTex = K.canvasTex("st-foot", 128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(w / 2, 90, 38, 70, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w / 2, 200, 30, 40, 0, 0, 7); g.fill(); }, { linear: true, clamp: true });
    S.feet = [];
    const fpM = K.mat("#0b0a0a", { phys: true, alphaMap: fpTex, transparent: true, rough: 0.06, clearcoat: 1, ccRough: 0.03, env: 1.2, depthWrite: false, polyOff: 4 });
    for (let s = L0 - 1.2, k = 0; s > 1.0; s -= 0.36, k++) {
      const q = pathAt(s), side = k % 2 ? 1 : -1, yaw = (q.yaw + 180) * Math.PI / 180;
      const x = q.p[0] + Math.cos(yaw) * 0.12 * side, z = q.p[2] - Math.sin(yaw) * 0.12 * side;
      const m = K.M(new T.PlaneGeometry(0.12, 0.26), fpM, { x, y: 0.007, z, rx: -90, cast: false, layer: K.LAYER.FLOOR, ro: 2 });
      m.rotation.set(-Math.PI / 2, 0, yaw + Math.PI, "XYZ");
      m.visible = false;
      S.feet.push({ mesh: m, s });
    }
    S.steps = (n) => S.feet.forEach((f, i) => (f.mesh.visible = i < n));
    S.stepsUntil = (sMin) => S.feet.forEach((f) => (f.mesh.visible = f.s >= sMin));

    // ---------------------------------------------------------------- keys
    S.key = K.light.spot({ pos: [0, 3, 0], at: [0, 0, 0], color: "#fff1e2", I: 0, angle: 40, pen: 0.85, range: 10, cast: 1024, radius: 5, vol: 0.15 });
    S.key2 = K.light.spot({ pos: [0, 3, 0], at: [0, 0, 0], color: "#fff1e2", I: 0, angle: 50, pen: 0.85, range: 10, vol: 0.1 });
    S.keyAt = (L, pos, at, hex, I) => { L.position.fromArray(pos); L.target.position.fromArray(at); L.color.set(hex || "#fff1e2"); L.intensity = I; };

    S.lampsOn = (v) => { S.lamps.forEach((L) => { if (L.userData.I0 == null) L.userData.I0 = L.intensity; L.intensity = L.userData.I0 * v; }); };
    S.bake = function () {
      const keep = S.sections.map((s) => s.on);
      S.envDim = 0.45;
      K.env.bake("store-lit", [0, 1.5, -10], () => { for (let i = 0; i < 4; i++) S.section(i, 1); S.arrows.forEach((a, i) => S.arrow(i, 0, 0)); });
      K.env.bake("store-dark", [0, 1.5, -18], () => { for (let i = 0; i < 4; i++) S.section(i, 0); });
      K.env.bake("store-red", [0, 1.2, -18], () => { for (let i = 0; i < 4; i++) S.section(i, 0); S.arrows.forEach((a, i) => S.arrow(i, 1, 1)); S.exitSign(1); });
      S.envDim = 1;
      keep.forEach((v, i) => S.section(i, v)); S.arrows.forEach((a, i) => S.arrow(i, 0, 0)); S.exitSign(0);
    };
    S.white = o.white; S.redHex = o.red;
    return S;
  }

  // poses for this set (additive)
  if (RH3D.POSES && !RH3D.POSES.prone) {
    const b = RH3D.POSES.stand;
    // lying on the stomach (root rx +90 = face down, head toward local +z), head lifted, forearms on the floor
    RH3D.POSES.prone = Object.assign({}, b, { neck: [-38, 0, 0], head: [-28, 0, 0], chest: [-10, 0, 0], shL: [-62, 0, 34], shR: [-62, 0, -34], elL: [-96, 0, 0], elR: [-96, 0, 0], wrL: [20, 0, 0], wrR: [20, 0, 0], knL: [4, 0, 0], knR: [4, 0, 0] });
    RH3D.POSES.sofaBack = Object.assign({}, RH3D.POSES.sitChair, { chest: [-12, 0, 0], neck: [-6, 0, 0], head: [-4, 0, 0], shL: [0, 0, 24], shR: [0, 0, -24], elL: [-20, 0, 0], elR: [-20, 0, 0], hipL: [-78, -8, 8], hipR: [-78, 8, -8], knL: [70, 0, 0], knR: [70, 0, 0] });
    RH3D.POSES.handle = Object.assign({}, b, { shR: [-58, 0, -8], elR: [-30, 0, 0], wrR: [0, 80, 0], neck: [4, 0, 0] });
  }

  /** a mini phone tripod clamped under the mannequin's phone (legs folded into a grip) */
  function phoneTripod(K, man) {
    const g = K.G({ name: "tripod" }, man.phone);
    const m = K.mat("#141414", { rough: 0.5 });
    K.M(K.box(0.03, 0.02, 0.02), m, { y: -0.085, z: -0.012 }, g);
    for (let i = 0; i < 3; i++) K.M(K.cyl(0.004, 0.004, 0.11, 6), m, { x: (i - 1) * 0.008, y: -0.15, z: -0.016, rz: (i - 1) * 8 }, g);
    const rec = K.glow("#ff2a1a", 6); K.M(K.sph(0.0045, 8, 6), rec, { x: 0.026, y: 0.064, z: -0.006, cast: false }, g);
    return { group: g, recM: rec };
  }
  /** phone camera-app screen: the dark store viewfinder, REC timer, battery 2 % */
  function phoneCamUI(g, w, h, o) {
    o = Object.assign({ rec: "00:41", battery: 2, noService: false, blink: true }, o || {});
    const s = w / 400;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#14161a"); gr.addColorStop(0.5, "#22252b"); gr.addColorStop(1, "#0d0e10"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // viewfinder: dim showroom shapes
    g.fillStyle = "rgba(160,150,135,0.25)"; g.fillRect(40 * s, 420 * s, 320 * s, 120 * s); g.fillStyle = "rgba(220,210,190,0.18)"; g.fillRect(70 * s, 380 * s, 120 * s, 60 * s);
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1.5 * s; for (const f of [1 / 3, 2 / 3]) { g.beginPath(); g.moveTo(w * f, 90 * s); g.lineTo(w * f, h - 160 * s); g.stroke(); g.beginPath(); g.moveTo(0, 90 * s + (h - 250 * s) * f); g.lineTo(w, 90 * s + (h - 250 * s) * f); g.stroke(); }
    g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(0, 0, w, 90 * s); g.fillRect(0, h - 160 * s, w, 160 * s);
    // REC pill
    g.fillStyle = "#e5281c"; g.beginPath(); g.roundRect(w / 2 - 78 * s, 36 * s, 156 * s, 40 * s, 10 * s); g.fill();
    g.fillStyle = "#ffffff"; g.font = `800 ${24 * s}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("● REC " + o.rec, w / 2, 57 * s);
    // battery (top right) and signal (top left)
    const bx = w - 78 * s, by = 44 * s;
    g.strokeStyle = "#ff3b30"; g.lineWidth = 2.4 * s; g.strokeRect(bx, by, 40 * s, 22 * s); g.fillStyle = "#ff3b30"; g.fillRect(bx + 41.5 * s, by + 7 * s, 3.5 * s, 8 * s); g.fillRect(bx + 3 * s, by + 3 * s, 3 * s, 16 * s);
    g.font = `800 ${20 * s}px ${FONT}`; g.textAlign = "right"; g.fillText(o.battery + "%", bx - 8 * s, by + 12 * s);
    if (o.noService) { g.fillStyle = "#ff453a"; g.textAlign = "left"; g.font = `800 ${18 * s}px ${FONT}`; g.fillText("No Service", 22 * s, by + 12 * s); }
    else { g.fillStyle = "#ffffff"; for (let i = 0; i < 4; i++) g.fillRect(22 * s + i * 9 * s, by + 18 * s - i * 5 * s, 6 * s, 4 * s + i * 5 * s); }
    if (o.noService) {   // a centred banner
      g.fillStyle = "rgba(0,0,0,0.6)"; g.beginPath(); g.roundRect(40 * s, h * 0.42, w - 80 * s, 110 * s, 18 * s); g.fill();
      g.fillStyle = "#ff453a"; g.font = `800 ${40 * s}px ${FONT}`; g.textAlign = "center"; g.fillText("No Service", w / 2, h * 0.42 + 42 * s);
      g.fillStyle = "rgba(255,255,255,0.75)"; g.font = `600 ${20 * s}px ${FONT}`; g.fillText("Upload paused", w / 2, h * 0.42 + 82 * s);
    }
    // shutter button
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(w / 2, h - 80 * s, 34 * s, 0, 7); g.fill(); g.fillStyle = "#e5281c"; g.beginPath(); g.roundRect(w / 2 - 14 * s, h - 94 * s, 28 * s, 28 * s, 5 * s); g.fill();
  }

  Object.assign(RH3D, { store, phoneTripod, phoneCamUI, storePath: PATH });
})();
