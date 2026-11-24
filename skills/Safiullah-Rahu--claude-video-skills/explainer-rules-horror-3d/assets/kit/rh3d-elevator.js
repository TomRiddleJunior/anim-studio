/* rh3d-elevator.js — "Between Floors": an office elevator for the realistic-horror kit (needs core, props, mannequin;
 * rooms for RH3D.photo; garage only when the doors open on Level −4).
 *
 *   const E = RH3D.elevator(K, { office: [x, y, z], garage: [x, y, z], shaft: [x, y, z] });
 *   E.stage("office" | "garage" | "shaft")       moves the cabin, shows that stage's set (call from reset(t))
 *   E.w([x, y, z])  E.wl(list)                     cabin-local -> world (the cabin is translated, never rotated)
 *   E.light(white 0..1, red 0..1, flicker)         LED ceiling panels + their spots (and the mirror images)
 *   E.doors(open 0..1)                             cabin + landing doors (centre-opening)
 *   E.display.set(["B1"])  E.clock.set("23:59")    dot-matrix floor display above the doors, 7-seg clock on the panel
 *   E.button(label, on)                            light a panel button ring ("G", "B2", "ALARM", …)
 *   E.card(circled)                                the taped rules card (rule 1 circled in red marker)
 *   E.keyAt(posL, atL, hex, I) / E.key2At(…)       shadow-casting keys in cabin-local coordinates (+ mirror image)
 *   E.mirror = { x (world, per stage), xl (local) } the mirror plane; RH3D.mirrorDouble(dbl, pose, E.mirrorX())
 *   E.backdrop(stage)                              a photo of what lies beyond the doors, seen in the mirror
 *   E.shaftSet: { cabin(y), cw(y), group }         the shaft cutaway (twin shaft, landings 9-13, ropes, counterweight)
 *   E.attachGarage(G, objs)                        Level −4 outside the doors (hides the lift-1 frame, adds a column)
 *
 * Cabin layout (local metres): floor y 0, ceiling 2.45; doors in the front wall x = 0 (they face +x), opening
 * z −0.5…0.5, height 2.1; back wall x = −1.6 with a full-width mirror (plane E.mirror.xl = −1.588, y 0.95…2.25);
 * side walls z = ±0.95. Panel (COP) on the +z wall at x −0.55…−0.17. Behind the mirror a mirrored copy of the
 * interior (a group with scale.x = −1) holds the reflection; its lights are image lights. The twin lives only there.
 */
(function () {
  const RH3D = window.RH3D;
  const FONT = '"MontserratRH", "Montserrat", "Arial Black", Arial, sans-serif';

  /** brushed stainless: streaks along u; returns { map, rough } (repeat r) */
  function brushed(K, key, o) {
    o = Object.assign({ tone: 186, w: 512, h: 512, seed: 3, repeat: [1, 1], seams: 0, vertical: false }, o || {});
    const r = RH3D.rng(o.seed);
    const lines = [];
    for (let i = 0; i < 1400; i++) lines.push([r() * o.h, (r() - 0.5) * 2, 1 + r() * 2, r() * o.w, 40 + r() * o.w]);
    const draw = (g, w, h, rough) => {
      g.fillStyle = rough ? "rgb(92,92,92)" : `rgb(${o.tone},${o.tone + 2},${o.tone + 5})`; g.fillRect(0, 0, w, h);
      if (o.vertical) { g.translate(w, 0); g.rotate(Math.PI / 2); }
      const L = o.vertical ? h : w, S = o.vertical ? w : h;
      lines.forEach(([y, d, th, x0, len]) => {
        const v = rough ? 92 + d * 40 : o.tone + d * 26;
        g.fillStyle = `rgba(${v},${v},${v + (rough ? 0 : 3)},0.55)`;
        const yy = (y / o.h) * S;
        g.fillRect((x0 / o.w) * L, yy, (len / o.w) * L, th * 0.5); g.fillRect((x0 / o.w) * L - L, yy, (len / o.w) * L, th * 0.5);
      });
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (o.seams) { g.fillStyle = rough ? "rgb(180,180,180)" : "rgba(30,31,33,0.85)"; for (let k = 1; k < o.seams; k++) g.fillRect((k / o.seams) * w - 2, 0, 4, h); }
    };
    const map = K.canvasTex(key + ":a", o.w, o.h, (g, w, h) => draw(g, w, h, false), { repeat: o.repeat });
    const rough = K.canvasTex(key + ":r", o.w, o.h, (g, w, h) => draw(g, w, h, true), { linear: true, repeat: o.repeat });
    return { map, rough };
  }

  // 5 x 7 dot-matrix glyphs (a lift indicator font); "v" = down arrow, "^" = up arrow
  const GLYPH = {
    0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"], 1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"], 3: ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
    4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"], 5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"], 7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"], 9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    v: ["00000", "11111", "11111", "01110", "01110", "00100", "00000"], "^": ["00000", "00100", "01110", "01110", "11111", "11111", "00000"],
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  };
  /** a lift floor indicator: set("v B4") — glyphs from GLYPH, " " = 2 dots, unknown chars skipped */
  function dotMatrix(K, key, o) {
    o = Object.assign({ cols: 22, rows: 9, color: "#ff3222", bg: "#0b0404", text: "", px: 18 }, o || {});
    const W = o.cols * o.px, Hh = o.rows * o.px;
    const tex = K.canvasTex(key, W, Hh, () => {}, { fresh: true, clamp: true });
    let cur = null;
    function set(text) {
      if (Array.isArray(text)) text = text.join(" ");
      if (text === cur) return; cur = text;
      const on = new Set();
      const chars = String(text).split("");
      const width = chars.reduce((a, c) => a + (c === " " ? 2 : GLYPH[c] ? 6 : 0), 0) - 1;
      let x = Math.round((o.cols - width) / 2), y0 = Math.round((o.rows - 7) / 2);
      chars.forEach((c) => { if (c === " ") { x += 2; return; } const gl = GLYPH[c]; if (!gl) return; gl.forEach((row, j) => row.split("").forEach((b, i) => { if (b === "1") on.add((x + i) + "," + (y0 + j)); })); x += 6; });
      const g = tex.userData.ctx;
      g.fillStyle = o.bg; g.fillRect(0, 0, W, Hh);
      for (let j = 0; j < o.rows; j++) for (let i = 0; i < o.cols; i++) {
        const lit = on.has(i + "," + j);
        g.fillStyle = lit ? o.color : "rgba(255,60,40,0.07)";
        g.beginPath(); g.arc((i + 0.5) * o.px, (j + 0.5) * o.px, o.px * (lit ? 0.42 : 0.3), 0, 7); g.fill();
      }
      tex.needsUpdate = true;
    }
    set(o.text);
    return { tex, set };
  }

  /** coordinate-descent IK: joint offsets (deg) so that man's bone+off reaches target (world). joints: [[name, axis 0..2,
   *  min, max], …]. Returns an `add` object merged with p.add (cache it: it poses the figure many times). */
  function reach(man, p, bone, off, target, joints, iters) {
    const mk = (v) => { const add = {}; Object.keys(p.add || {}).forEach((k) => (add[k] = p.add[k].slice())); joints.forEach((j, i) => { const a = add[j[0]] || (add[j[0]] = [0, 0, 0]); a[j[1]] += v[i]; }); return add; };
    const f = (v) => { man.set(Object.assign({}, p, { add: mk(v) })); const q = man.at(bone, off); return Math.hypot(q[0] - target[0], q[1] - target[1], q[2] - target[2]); };
    let v = joints.map((j) => (j[2] + j[3]) / 2), d = f(v), step = joints.map((j) => (j[3] - j[2]) / 4);
    for (let it = 0; it < (iters || 70); it++) {
      let imp = false;
      for (let i = 0; i < v.length; i++) for (const s of [-1, 1]) {
        const vv = v.slice(); vv[i] = Math.max(joints[i][2], Math.min(joints[i][3], vv[i] + s * step[i]));
        const dd = f(vv); if (dd < d) { d = dd; v = vv; imp = true; }
      }
      if (!imp) step = step.map((x) => x * 0.5);
    }
    return { add: mk(v), d };
  }

  function elevator(K, o) {
    o = Object.assign({ white: "#eef3ff", red: "#ff2410", office: [-40, 0, 30], garage: [-8.75, 0, -0.3], shaft: [-72, 0, 70],
      top: 12, label: "4" }, o || {});
    const T = K.T, E = {};
    const XB = -1.6, W2 = 0.95, H = 2.45, DW = 0.5, DH = 2.1, XM = XB + 0.012, MY0 = 0.95, MY1 = 2.25;
    E.dims = { XB, W2, H, DW, DH, XM, MY0, MY1 };
    E.mirror = { xl: XM };
    E.origins = { office: o.office, garage: o.garage, shaft: o.shaft };
    const cab = K.G({ name: "elevator-cabin" });
    E.cab = cab;
    const mirG = K.G({ x: 2 * XM, name: "elevator-mirror-room" }, cab);
    mirG.scale.x = -1;
    E.mirG = mirG;

    // ---------------------------------------------------------------- materials
    const wallB = brushed(K, "el-wall", { tone: 178, seed: 11, repeat: [1, 1], seams: 3 });
    const wallM = K.mat("#ffffff", { map: wallB.map, roughMap: wallB.rough, rough: 0.62, metal: 0.9, env: 1.15, unique: true });
    const doorB = brushed(K, "el-door", { tone: 170, seed: 17, vertical: true });
    const doorM = K.mat("#ffffff", { map: doorB.map, roughMap: doorB.rough, rough: 0.6, metal: 0.9, env: 1.1, unique: true });
    const kickM = K.mat("#55595e", { rough: 0.38, metal: 0.85, env: 0.9 });
    const trimM = K.mat("#2a2c2f", { rough: 0.4, metal: 0.7 });
    const railM = K.mat("#d6d9dc", { phys: true, rough: 0.18, metal: 1, env: 1.3, clearcoat: 0.3 });
    const floorTex = K.canvasTex("el-floor", 512, 512, (g, w, h) => {
      const r = RH3D.rng(23);
      g.fillStyle = "#2b2c2e"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { const v = 30 + r() * 70, a = 0.3 + r() * 0.6; g.fillStyle = `rgba(${v},${v},${v + 3},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(210,210,205,${0.25 + r() * 0.4})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
      g.fillStyle = "rgba(10,10,10,0.9)"; g.fillRect(0, h / 2 - 1, w, 2); g.fillRect(w / 2 - 1, 0, 2, h); g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    }, { repeat: [2, 2.4] });
    const floorM = K.mat("#ffffff", { map: floorTex, rough: 0.3, env: 0.7, unique: true });
    const ceilFrameM = K.mat("#3a3c40", { rough: 0.45, metal: 0.8, env: 0.9 });
    E.panelM = [];
    const panelGlow = () => { const m = K.glow(o.white, 3.6); E.panelM.push(m); return m; };
    const mirrorGlassM = K.mat("#c4ccd0", { phys: true, rough: 0.03, transparent: true, opacity: 0.07, clearcoat: 1, ccRough: 0.02, env: 1.2, depthWrite: false });

    // ---------------------------------------------------------------- dynamic textures
    E.display = dotMatrix(K, "el-disp", { cols: 22, rows: 9, color: "#ff3222", text: "12" });
    E.clock = RH3D.seg7(K, "el-clock", { text: "23:58", color: "#ff2a1a" });
    const rules = [["RULE 1:", ["IF THIS ELEVATOR", "MOVES ON ITS OWN,", "DO NOT STEP OUT.", "WAIT FOR YOUR FLOOR."]], ["RULE 2:", ["AFTER MIDNIGHT, DO NOT", "LOOK AT THE MIRR"]]];
    const cardOpts = (circle, blank) => ({ key: "el-card", title: ["ELEVATOR " + o.label, "NIGHT RULES"], sub: "BUILDING STAFF ONLY", rules, circle, blank });
    E.cardTexA = RH3D.ruleCard(K, cardOpts(-1));
    E.cardTexB = RH3D.ruleCard(K, cardOpts(0));
    E.cardM = K.mat("#ffffff", { phys: true, map: E.cardTexA, transparent: true, alphaTest: 0.3, rough: 0.35, clearcoat: 1, ccRough: 0.12, env: 0.7, unique: true });
    E.card = (circled) => { E.cardM.map = circled ? E.cardTexB : E.cardTexA; E.cardM.needsUpdate = true; };

    // COP face (buttons are drawn flush; rings glow): canvas 512 x 2048 over 0.38 x 1.52 m
    const COPW = 0.38, COPH = 1.75, COPY0 = 0.55, V_CLOCK = 0.10, V_CARD = 0.36, V_ROW0 = 0.56, PITCH = 0.08;
    const BTN = [];   // { label, u, v (m from the panel's top-left), r }
    const rowsB = [["12", "11"], ["10", "9"], ["8", "7"], ["6", "5"], ["4", "3"], ["2", "1"], ["G", "B1"], ["B2"]];
    rowsB.forEach((row, i) => row.forEach((lab, j) => BTN.push({ label: lab, u: COPW / 2 + (j === 0 ? -0.075 : 0.075) * (row.length > 1 ? 1 : 0) - (row.length === 1 ? 0.075 : 0), v: V_ROW0 + i * PITCH, r: 0.021 })));
    BTN.push({ label: "OPEN", u: COPW / 2 - 0.075, v: V_ROW0 + 8 * PITCH + 0.03, r: 0.021 });
    BTN.push({ label: "CLOSE", u: COPW / 2 + 0.075, v: V_ROW0 + 8 * PITCH + 0.03, r: 0.021 });
    BTN.push({ label: "ALARM", u: COPW / 2 - 0.075, v: V_ROW0 + 9 * PITCH + 0.07, r: 0.024 });
    E.BTN = BTN;
    const SPK = { u: COPW / 2 + 0.075, v: V_ROW0 + 9 * PITCH + 0.07, r: 0.042 };
    const STK = { u: COPW / 2, v: V_ROW0 + 11 * PITCH + 0.06, w: 0.2, h: 0.085 };
    E.cop = { W: COPW, H: COPH, Y0: COPY0, BTN, SPK, STK, V_CARD, V_CLOCK };
    function drawCOP(g, w, h) {
      const s = w / COPW;
      const bg = wallB.map.userData.canvas;
      g.fillStyle = "#b9bcc0"; g.fillRect(0, 0, w, h);
      g.save(); g.globalAlpha = 0.8; g.drawImage(bg, 0, 0, w, h); g.restore();
      g.strokeStyle = "rgba(20,20,22,0.7)"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      // clock window frame
      g.fillStyle = "#101010"; g.fillRect(w * 0.18, (V_CLOCK - 0.042) * s, w * 0.64, 0.084 * s);
      g.textAlign = "center"; g.textBaseline = "middle";
      BTN.forEach((b) => {
        const x = b.u * s, y = b.v * s, R = b.r * s;
        g.fillStyle = "rgba(25,25,27,0.85)"; g.beginPath(); g.arc(x, y, R * 1.32, 0, 7); g.fill();
        const gr = g.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
        if (b.label === "ALARM") { gr.addColorStop(0, "#ffe27a"); gr.addColorStop(1, "#d9a51c"); } else { gr.addColorStop(0, "#e9ebed"); gr.addColorStop(1, "#a6aaae"); }
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
        g.fillStyle = "#1c1d1f";
        if (b.label === "ALARM") {   // bell icon
          g.beginPath(); g.moveTo(x - R * 0.5, y + R * 0.32); g.quadraticCurveTo(x - R * 0.5, y - R * 0.55, x, y - R * 0.6); g.quadraticCurveTo(x + R * 0.5, y - R * 0.55, x + R * 0.5, y + R * 0.32); g.closePath(); g.fill();
          g.fillRect(x - R * 0.62, y + R * 0.3, R * 1.24, R * 0.14); g.beginPath(); g.arc(x, y + R * 0.55, R * 0.14, 0, 7); g.fill();
        } else if (b.label === "OPEN" || b.label === "CLOSE") {
          const d = b.label === "OPEN" ? 1 : -1;
          for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * R * 0.12, y - R * 0.4); g.lineTo(x + sd * R * 0.12, y + R * 0.4); g.lineTo(x + sd * (R * 0.12 + d * R * 0.45), y); g.closePath(); g.fill(); }
        } else {
          g.font = `800 ${R * (b.label.length > 1 ? 0.95 : 1.15)}px ${FONT}`; g.fillText(b.label, x, y + R * 0.06);
        }
        // braille dots to the left
        g.fillStyle = "rgba(30,30,32,0.75)"; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - R * 1.75, y - R * 0.4 + k * R * 0.4, R * 0.08, 0, 7); g.fill(); }
      });
      // speaker grille: drilled holes in a circle
      const sx = SPK.u * s, sy = SPK.v * s, sr = SPK.r * s;
      g.fillStyle = "rgba(15,15,16,0.92)";
      for (let ry = -sr; ry <= sr; ry += sr * 0.2) for (let rx = -sr; rx <= sr; rx += sr * 0.2) if (rx * rx + ry * ry < sr * sr * 0.92) { g.beginPath(); g.arc(sx + rx, sy + ry, sr * 0.055, 0, 7); g.fill(); }
      g.font = `700 ${0.012 * s}px ${FONT}`; g.fillStyle = "rgba(25,25,27,0.85)"; g.fillText("SPEAK HERE", sx, sy + sr + 0.016 * s);
      // capacity plate
      g.fillStyle = "rgba(30,30,32,0.85)"; g.font = `800 ${0.016 * s}px ${FONT}`; g.fillText("ELEVATOR " + o.label, w / 2, 0.175 * s); g.font = `700 ${0.012 * s}px ${FONT}`; g.fillText("13 PERSONS · 1000 KG", w / 2, 0.198 * s);
      // the service sticker (yellow, slightly crooked, worn corner)
      g.save(); g.translate(STK.u * s, STK.v * s); g.rotate(-0.025);
      const sw = STK.w * s, sh = STK.h * s;
      g.fillStyle = "#f2d43a"; g.fillRect(-sw / 2, -sh / 2, sw, sh);
      g.fillStyle = "rgba(160,120,20,0.25)"; g.beginPath(); g.moveTo(sw / 2, -sh / 2); g.lineTo(sw / 2 - sw * 0.12, -sh / 2); g.lineTo(sw / 2, -sh / 2 + sh * 0.3); g.closePath(); g.fill();
      g.fillStyle = "#151412"; g.fillRect(-sw / 2 + 4, -sh / 2 + 4, sw - 8, sh * 0.34);
      g.fillStyle = "#f2d43a"; g.font = `900 ${sh * 0.22}px ${FONT}`; g.fillText("ELEVATOR SERVICE", 0, -sh / 2 + 4 + sh * 0.17);
      g.fillStyle = "#151412"; g.font = `900 ${sh * 0.36}px ${FONT}`; g.fillText("06:00 – 22:00", 0, sh * 0.2);
      g.font = `700 ${sh * 0.12}px ${FONT}`; g.fillText("OUT OF HOURS: PRESS ALARM", 0, sh * 0.42);
      g.restore();
    }
    const copTex = K.canvasTex("el-cop", 512, Math.round(512 * COPH / COPW), drawCOP);
    E.redraw = function () {   // after the web font loaded (film.init): text textures drawn again
      drawCOP(copTex.userData.ctx, copTex.image.width, copTex.image.height); copTex.needsUpdate = true;
      const a = RH3D.ruleCard(K, Object.assign(cardOpts(-1), { key: "el-card2" })), b = RH3D.ruleCard(K, Object.assign(cardOpts(0), { key: "el-card2" }));
      E.cardTexA = a; E.cardTexB = b; E.cardM.map = a; E.cardM.needsUpdate = true;
      lobbyRedraw && lobbyRedraw();
      shaftRedraw && shaftRedraw();
    };
    let lobbyRedraw = null, shaftRedraw = null;

    // ---------------------------------------------------------------- the interior (built twice: real + mirror copy)
    const ringGeo = new T.RingGeometry(0.021 * 0.84, 0.021 * 1.0, 32);
    function interior(P, real) {
      const h = { ring: {} };
      const plane = (w, hh, m, p) => K.M(new T.PlaneGeometry(w, hh), m, p, P);
      // floor + ceiling
      K.M(new T.PlaneGeometry(-XB, 2 * W2), floorM, { x: XB / 2, y: 0.001, rx: -90, cast: false }, P);
      // side walls (z = ±W2), facing inward
      for (const sd of [-1, 1]) {
        plane(-XB, H, wallM, { x: XB / 2, y: H / 2, z: sd * W2, ry: sd > 0 ? 180 : 0 });
        K.M(K.box(-XB, 0.12, 0.012), kickM, { x: XB / 2, y: 0.06, z: sd * (W2 - 0.006) }, P);
        // handrail: tube on brackets
        const rx0 = XB + 0.15, rx1 = sd > 0 ? -0.66 : -0.15;   // the +z rail stops short of the panel
        K.M(K.cyl(0.019, 0.019, rx1 - rx0, 18), railM, { x: (rx0 + rx1) / 2, y: 0.92, z: sd * (W2 - 0.065), rz: 90 }, P);
        for (const x of [rx0 + 0.05, rx1 - 0.05]) K.M(K.cyl(0.009, 0.009, 0.06, 8), railM, { x, y: 0.92, z: sd * (W2 - 0.032), rx: 90, cast: false }, P);
      }
      // back wall: below and above the mirror (real only; its reflection is itself)
      if (real) {
        plane(2 * W2, MY0, wallM, { x: XB, y: MY0 / 2, ry: 90 });
        plane(2 * W2, H - MY1, wallM, { x: XB, y: (H + MY1) / 2, ry: 90 });
        for (const sd of [-1, 1]) plane(W2 - 0.86, MY1 - MY0, wallM, { x: XB, y: (MY0 + MY1) / 2, z: sd * (W2 + 0.86) / 2, ry: 90 });
        K.M(K.box(0.012, 0.12, 2 * W2), kickM, { x: XB + 0.006, y: 0.06 }, P);
        K.M(K.cyl(0.019, 0.019, 2 * W2 - 0.3, 18), railM, { x: XB + 0.065, y: 0.92, rx: 90 }, P);
        // mirror trim + glass
        K.M(K.box(0.02, 0.025, 1.76), trimM, { x: XB + 0.01, y: MY0 - 0.012 }, P);
        K.M(K.box(0.02, 0.025, 1.76), trimM, { x: XB + 0.01, y: MY1 + 0.012 }, P);
        for (const sd of [-1, 1]) K.M(K.box(0.02, MY1 - MY0 + 0.05, 0.025), trimM, { x: XB + 0.01, y: (MY0 + MY1) / 2, z: sd * 0.872 }, P);
        h.glass = plane(1.72, MY1 - MY0, mirrorGlassM, { x: XM + 0.002, y: (MY0 + MY1) / 2, ry: 90, cast: false, receive: false, layer: K.LAYER.NODEPTH, ro: 4 });
      }
      // front wall: inner skin with the door opening; transom with the floor display
      for (const sd of [-1, 1]) plane(W2 - DW, H, wallM, { x: -0.001, y: H / 2, z: sd * (W2 + DW) / 2, ry: -90 });
      plane(2 * DW, H - DH, wallM, { x: -0.001, y: (H + DH) / 2, ry: -90 });
      K.M(K.box(0.04, 0.03, 2 * DW + 0.04), trimM, { x: 0.0, y: DH + 0.015 }, P);
      for (const sd of [-1, 1]) K.M(K.box(0.04, DH, 0.025), trimM, { x: 0.0, y: DH / 2, z: sd * (DW + 0.012) }, P);
      // display housing + face
      K.M(K.box(0.03, 0.15, 0.36), trimM, { x: -0.012, y: 2.27 }, P);
      K.M(new T.PlaneGeometry(0.31, 0.12), K.glow("#ffffff", 2.2, { map: E.display.tex }), { x: -0.028, y: 2.27, ry: -90, cast: false }, P);
      // door panels (slide into the wall cavity)
      h.doorL = K.M(K.box(0.025, DH, DW + 0.01), doorM, { x: 0.018, y: DH / 2, z: -DW / 2 }, P);
      h.doorR = K.M(K.box(0.025, DH, DW + 0.01), doorM, { x: 0.018, y: DH / 2, z: DW / 2 }, P);
      K.M(K.box(0.01, DH, 0.01), K.mat("#111111", { rough: 0.8 }), { x: -0.0, y: DH / 2, z: -0.004 }, h.doorR).position.set(0, 0, -DW / 2 - 0.004);
      // sill + landing door (the shaft side is dark)
      K.M(K.box(0.14, 0.012, 2 * DW + 0.1), K.mat("#9a9d9f", { rough: 0.35, metal: 0.9 }), { x: 0.07, y: 0.006 }, P);
      h.landL = K.M(K.box(0.025, DH, DW + 0.01), doorM, { x: 0.118, y: DH / 2, z: -DW / 2 }, P);
      h.landR = K.M(K.box(0.025, DH, DW + 0.01), doorM, { x: 0.118, y: DH / 2, z: DW / 2 }, P);
      for (const sd of [-1, 1]) K.M(K.box(0.12, DH + 0.06, 0.04), trimM, { x: 0.07, y: (DH + 0.06) / 2, z: sd * (DW + 0.03) }, P);
      K.M(K.box(0.12, 0.05, 2 * DW + 0.1), trimM, { x: 0.07, y: DH + 0.025 }, P);
      // gap light: the thin strip between the door leaves (light from a passing landing)
      h.gapM = K.glow("#ffe6c8", 1); K.M(new T.PlaneGeometry(0.004, DH - 0.1), h.gapM, { x: 0.004, y: DH / 2, ry: -90, cast: false }, P);
      // ceiling: frame + 2 x 2 LED panels
      K.M(new T.PlaneGeometry(-XB, 2 * W2), ceilFrameM, { x: XB / 2, y: H, rx: 90, cast: false }, P);
      for (const px of [-1.18, -0.42]) for (const pz of [-0.44, 0.44]) {
        K.M(K.box(0.64, 0.02, 0.76), K.mat("#1d1e20", { rough: 0.5, metal: 0.6 }), { x: px, y: H - 0.012, z: pz, cast: false }, P);
        K.M(new T.PlaneGeometry(0.6, 0.72), real ? panelGlow() : E.panelM[E.panelM.length - 4 + (px < -1 ? 0 : 2) + (pz < 0 ? 0 : 1)] || panelGlow(), { x: px, y: H - 0.024, z: pz, rx: 90, cast: false, receive: false }, P);
      }
      // COP (car operating panel) on the +z wall: local panel frame x right (toward the back), y up, z out of the wall
      const cop = K.G({ x: -0.36, y: COPY0, z: W2 - 0.008, ry: 180 }, P);
      K.M(K.box(COPW + 0.02, COPH + 0.02, 0.012), trimM, { x: 0, y: COPH / 2, z: -0.002 }, cop);
      K.M(new T.PlaneGeometry(COPW, COPH), K.mat("#ffffff", { map: copTex, rough: 0.42, metal: 0.75, env: 0.9 }), { y: COPH / 2, z: 0.0045, cast: false }, cop);
      BTN.forEach((b) => {
        const x = b.u - COPW / 2, y = COPH - b.v;
        K.M(new T.TorusGeometry(b.r * 1.18, 0.003, 6, 28), railM, { x, y, z: 0.006, cast: false }, cop);
        const m = K.glow(b.label === "ALARM" ? "#ffb02a" : "#ff5a3a", 1);
        K.M(b.label === "ALARM" ? new T.RingGeometry(b.r * 0.84, b.r * 1.0, 32) : ringGeo, m, { x, y, z: 0.0062, cast: false }, cop);
        h.ring[b.label] = m;
      });
      // clock face
      K.M(new T.PlaneGeometry(COPW * 0.6, 0.075), K.glow("#ffffff", 2.6, { map: E.clock.tex }), { x: 0, y: COPH - V_CLOCK, z: 0.0055, cast: false }, cop);
      // the card, taped to the wall above the panel
      h.card = K.M(new T.PlaneGeometry(0.2, 0.263), E.cardM, { x: -0.005, y: COPH - V_CARD, z: 0.0075, rz: -1.2, cast: false, ro: 2 }, cop);
      h.cop = cop;
      return h;
    }
    const RH = interior(cab, true), MH = interior(mirG, false);
    E.realH = RH; E.mirH = MH;
    E.copAt = (u, v, dz) => { const p = new T.Vector3(u - COPW / 2, COPH - v, dz || 0); RH.cop.localToWorld(p); return [p.x, p.y, p.z]; };   // panel (u, v) -> world
    E.cardAt = (dx, dy, dz) => { const p = new T.Vector3(-0.005 + (dx || 0), COPH - V_CARD + (dy || 0), 0.0075 + (dz || 0)); RH.cop.localToWorld(p); return [p.x, p.y, p.z]; };

    // ---------------------------------------------------------------- cabin lights (real + images in the mirror room)
    E.spots = []; E.images = [];
    const mk = (P, list, gainI) => {
      for (const pz of [-0.44, 0.44]) {
        const L = K.light.spot({ pos: [-0.8, H - 0.05, pz], at: [-0.8, 0, pz], color: o.white, I: 5, angle: 80, pen: 0.9, range: 4.5, vol: 0.35 });
        P.add(L); P.add(L.target); L.position.set(-0.8, H - 0.05, pz); L.target.position.set(-0.8, 0, pz);
        list.push(L);
      }
      const F = K.light.point({ pos: [-0.8, 1.6, 0], color: o.white, I: 0.9, range: 3.5 });
      P.add(F); F.position.set(-0.8, 1.6, 0); list.push(F);
    };
    mk(cab, E.spots); mk(mirG, E.images);
    E.key = K.light.spot({ pos: [0, 2.3, 0], at: [-0.8, 1.2, 0], color: "#fff1e2", I: 0, angle: 34, pen: 0.85, range: 6, cast: 1024, radius: 4, vol: 0.12 });
    cab.add(E.key); cab.add(E.key.target);
    E.keyI = K.light.spot({ pos: [0, 2.3, 0], at: [-0.8, 1.2, 0], color: "#fff1e2", I: 0, angle: 34, pen: 0.85, range: 6, vol: 0.06 });
    mirG.add(E.keyI); mirG.add(E.keyI.target);
    E.key2 = K.light.spot({ pos: [0, 2.3, 0], at: [-0.8, 1.2, 0], color: "#fff1e2", I: 0, angle: 40, pen: 0.85, range: 6, vol: 0.05 });
    cab.add(E.key2); cab.add(E.key2.target);
    const setKey = (L, LI, posL, atL, hex, I, img) => {
      L.position.fromArray(posL); L.target.position.fromArray(atL); L.color.set(hex || "#fff1e2"); L.intensity = I;
      if (LI) { LI.position.fromArray(posL); LI.target.position.fromArray(atL); LI.color.set(hex || "#fff1e2"); LI.intensity = I * (img == null ? 0.9 : img); }
    };
    E.keyAt = (posL, atL, hex, I, img) => setKey(E.key, E.keyI, posL, atL, hex, I, img);
    E.key2At = (posL, atL, hex, I) => setKey(E.key2, null, posL, atL, hex, I);
    const cW = new T.Color(o.white), cR = new T.Color(o.red), cT = new T.Color();
    E.lightState = { w: 1, r: 0 };
    /** LED panels: white share w, red share r (0..1), flicker multiplier f */
    E.light = function (w, r, f) {
      f = f == null ? 1 : f;
      cT.copy(cW).multiplyScalar(w * f).add(cR.clone().multiplyScalar(r * 0.9));
      const I = Math.max(cT.r, cT.g, cT.b);
      E.panelM.forEach((m) => { m.color.copy(cW).multiplyScalar(2.7 * w * f * (E.envDim || 1)).add(cR.clone().multiplyScalar(2.8 * r * (E.envDim || 1))); m.color.addScalar(0.01); });
      const redShare = r / Math.max(1e-3, w * f + r);
      const apply = (list, g) => list.forEach((L, i) => {
        if (I > 0) L.color.copy(cT).multiplyScalar(1 / I);
        L.intensity = (i < 2 ? 5 : 0.9) * I * g * (1 + 1.6 * redShare);   // pure red is ~5x darker in luma: lift it
      });
      apply(E.spots, 1); apply(E.images, 0.88);
      E.lightState = { w, r, f };
    };
    E.light(1, 0);

    // ---------------------------------------------------------------- doors, buttons, display helpers
    E.doors = function (open) {
      const u = Math.max(0, Math.min(1, open)), off = u * (DW - 0.03);
      for (const hh of [RH, MH]) {
        hh.doorL.position.z = -DW / 2 - off; hh.doorR.position.z = DW / 2 + off;
        hh.landL.position.z = -DW / 2 - off * 1.02; hh.landR.position.z = DW / 2 + off * 1.02;
      }
      E.open = u;
    };
    E.doors(0);
    E.button = (label, on) => { const v = on == null ? 1 : on; [RH, MH].forEach((hh) => { const m = hh.ring[label]; if (m) m.color.copy(m.userData.base).multiplyScalar(v * 2.4); }); };
    E.allButtons = (on) => BTN.forEach((b) => E.button(b.label, on));
    E.gap = (v) => [RH, MH].forEach((hh) => hh.gapM.color.copy(hh.gapM.userData.base).multiplyScalar(Math.max(0, v) * 6));
    E.allButtons(0); E.gap(0);

    // ---------------------------------------------------------------- backdrop beyond the mirrored doors (a photo)
    E.backM = K.glow("#ffffff", 0.0, { side: T.FrontSide });
    E.backMesh = K.M(new T.PlaneGeometry(9.6, 5.4), E.backM, { x: 4.6, y: 1.5, ry: -90, cast: false, receive: false }, mirG);
    E.backMesh.userData.noEnv = true;
    E.backTex = {};
    /** render what lies beyond the open doors (stage must be set) into a texture for the mirror room */
    E.photoBackdrop = function (name, expo) {
      if (!RH3D.photo) return;
      const cam = new T.PerspectiveCamera(60, 9.6 / 5.4, 0.05, 80);
      const p = E.w([-0.75, 1.5, 0]), q = E.w([4.6, 1.5, 0]);
      cam.position.fromArray(p); cam.lookAt(q[0], q[1], q[2]); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      const keep = [MH, RH].map((hh) => hh.doorL.visible);
      const cv = RH3D.photo(K, cam, 640, 360, expo || 0.9);
      const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace;
      E.backTex[name] = tx;
      return tx;
    };
    E.backdrop = function (name, gain) {
      const tx = E.backTex[name];
      E.backMesh.visible = !!tx;
      if (tx) { E.backM.map = tx; E.backM.color.setScalar(gain == null ? 1 : gain); E.backM.needsUpdate = true; }
    };
    // photo backdrop geometry: the camera that took it stood at the cabin centre; size the plane to its frustum
    (function () { const d = 4.6 + 0.75, hh = 2 * d * Math.tan(30 * Math.PI / 180); E.backMesh.scale.set(hh * (9.6 / 5.4) / 9.6, hh / 5.4, 1); })();

    // ---------------------------------------------------------------- office lobby (the dark office floor outside the doors)
    const lobby = K.G({ name: "elevator-office" });
    E.lobby = lobby;
    (function () {
      const carpet = K.concrete("el-carpet", { w: 256, h: 256, seed: 5, tone: "#4b4f55", vary: 0.06, pits: 0, stains: 2, nstr: 2.2, bump: 0.1, rough: [0.92, 1], repeat: [6, 6] });
      K.M(new T.PlaneGeometry(13.4, 12), K.mat("#ffffff", { map: carpet.map, normalMap: carpet.normal, rough: 0.97, env: 0.2 }), { x: 0.15 + 6.7, y: 0.0, rx: -90, cast: false }, lobby);
      const plaster = K.mat("#8d9196", { rough: 0.9, env: 0.3 });
      // landing wall (faces +x) around the door opening
      for (const sd of [-1, 1]) K.M(new T.PlaneGeometry(2.6, 3.0), plaster, { x: 0.2, y: 1.5, z: sd * (1.3 + DW + 0.05), ry: 90 }, lobby);
      K.M(new T.PlaneGeometry(2 * DW + 0.1, 3.0 - DH - 0.05), plaster, { x: 0.2, y: (3.0 + DH + 0.05) / 2, ry: 90 }, lobby);
      // architrave
      for (const sd of [-1, 1]) K.M(K.box(0.06, DH + 0.1, 0.08), K.mat("#5b5f64", { rough: 0.35, metal: 0.8 }), { x: 0.2, y: (DH + 0.1) / 2, z: sd * (DW + 0.07) }, lobby);
      K.M(K.box(0.06, 0.08, 2 * DW + 0.22), K.mat("#5b5f64", { rough: 0.35, metal: 0.8 }), { x: 0.2, y: DH + 0.08, z: 0 }, lobby);
      // corridor walls + ceiling
      K.M(new T.PlaneGeometry(14, 3.0), plaster, { x: 6.5, y: 1.5, z: -2.2, ry: 0 }, lobby);
      K.M(new T.PlaneGeometry(4, 3.0), plaster, { x: 2.0, y: 1.5, z: 2.2, ry: 180 }, lobby);
      const tiles = K.canvasTex("el-ceil-tiles", 256, 256, (g, w, h) => { g.fillStyle = "#c9cacb"; g.fillRect(0, 0, w, h); g.fillStyle = "#8f9193"; for (let i = 0; i <= 4; i++) { g.fillRect(i * 64 - 1, 0, 3, h); g.fillRect(0, i * 64 - 1, w, 3); } }, { repeat: [5, 4] });
      K.M(new T.PlaneGeometry(13.4, 12), K.mat("#ffffff", { map: tiles, rough: 0.95 }), { x: 0.15 + 6.7, y: 3.0, rx: 90, cast: false }, lobby);
      // the dark office beyond: desk rows, monitors off, a window wall with the city at night
      const deskM = K.mat("#6d6a64", { rough: 0.6 }), darkM = K.mat("#16171a", { rough: 0.5 }), partM = K.mat("#4a4e55", { rough: 0.95 });
      for (let x = 6.2; x <= 11.5; x += 2.3) for (const z of [2.4, 4.8]) {
        K.M(K.box(1.5, 0.04, 0.75), deskM, { x, y: 0.74, z }, lobby);
        K.M(K.box(1.5, 1.15, 0.04), partM, { x, y: 0.58, z: z - 0.4 }, lobby);
        K.M(K.box(0.5, 0.3, 0.03), darkM, { x: x - 0.2, y: 0.98, z: z + 0.05 }, lobby);
        K.M(K.box(0.46, 0.06, 0.44), darkM, { x: x + 0.1, y: 0.47, z: z + 0.6 }, lobby);
      }
      const sky = RH3D.skyTex ? RH3D.skyTex(K, "night") : null, city = RH3D.skylineTex ? RH3D.skylineTex(K, "night") : null;
      if (sky) K.M(new T.PlaneGeometry(14, 6), K.glow("#ffffff", 0.55, { map: sky }), { x: 13.5, y: 2.5, z: 2.0, ry: -90, cast: false, receive: false }, lobby);
      if (city) K.M(new T.PlaneGeometry(12, 3), K.glow("#ffffff", 0.9, { map: city, transparent: true }), { x: 13.3, y: 1.2, z: 2.0, ry: -90, cast: false, receive: false }, lobby);
      for (let z = -2; z <= 6; z += 1.6) K.M(K.box(0.08, 3.0, 0.1), darkM, { x: 13.2, y: 1.5, z }, lobby);
      // call panel beside the landing door (down arrow lit)
      const cp = K.G({ x: 0.21, y: 1.15, z: DW + 0.32, ry: 90 }, lobby);
      K.M(K.box(0.11, 0.24, 0.015), K.mat("#9da1a4", { rough: 0.3, metal: 0.9 }), {}, cp);
      E.callM = K.glow("#ff5a3a", 2.4);
      K.M(new T.CircleGeometry(0.018, 24), E.callM, { y: -0.04, z: 0.009, cast: false }, cp);
      K.M(new T.CircleGeometry(0.018, 24), K.mat("#d9dadb", { metal: 0.9, rough: 0.3 }), { y: 0.04, z: 0.009, cast: false }, cp);
      // a red exit sign far down the corridor + an emergency downlight by the lifts
      const exitT = K.canvasTex("el-exit", 256, 96, (g, w, h) => { g.fillStyle = "#1a0606"; g.fillRect(0, 0, w, h); g.fillStyle = "#ff3a2a"; g.font = `900 60px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("EXIT", w / 2, h / 2 + 3); });
      K.M(K.box(0.42, 0.16, 0.05), K.glow("#ffffff", 1.6, { map: exitT }), { x: 9.0, y: 2.6, z: -2.15, cast: false }, lobby);
      lobbyRedraw = () => {};
    })();
    E.lobbyL = K.light.spot({ pos: [1.6, 2.95, 0], at: [1.2, 0, 0], color: "#dfe4ea", I: 9, angle: 50, pen: 0.8, range: 7, vol: 0.5 });
    lobby.add(E.lobbyL); lobby.add(E.lobbyL.target); E.lobbyL.position.set(1.6, 2.95, 0); E.lobbyL.target.position.set(1.2, 0, 0);
    E.cityL = K.light.spot({ pos: [12.8, 2.2, 2.0], at: [3, 0.6, 1], color: "#8394c4", I: 18, angle: 60, pen: 0.9, range: 16, vol: 0.4 });
    lobby.add(E.cityL); lobby.add(E.cityL.target); E.cityL.position.set(12.8, 2.2, 2.0); E.cityL.target.position.set(3, 0.6, 1);
    lobby.position.fromArray(o.office);

    // ---------------------------------------------------------------- the shaft (cutaway): a twin shaft, landings, ropes
    const shaft = K.G({ name: "elevator-shaft" });
    E.shaftSet = { group: shaft };
    (function () {
      const FL = 3.6, k0 = -3, k1 = 3;      // landings from 3 floors below to 3 above landing "11" (y 0)
      const conc = K.concrete("el-shaft", { w: 512, h: 512, seed: 61, tone: "#7d7b76", vary: 0.16, pits: 0.6, stains: 9, nstr: 1.2, repeat: [2, 8] });
      const concM = K.mat("#ffffff", { map: conc.map, roughMap: conc.rough, normalMap: conc.normal, rough: 1, env: 0.2 });
      const Y0 = k0 * FL - 2, Y1 = k1 * FL + 6, HH = Y1 - Y0;
      // our shaft x −1.3…1.3, z −1.25…1.25; the neighbour shaft z −3.75…−1.25 (no wall between: divider beams)
      const numT = (n) => K.canvasTex("el-num" + n, 256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "rgba(235,232,220,0.9)"; g.font = `900 150px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), w / 2, h / 2 + 8); }, { clamp: true });
      // landing wall (x = +1.3, faces −x) with door openings at each landing
      for (let k = k0; k <= k1; k++) {
        const y = k * FL;
        const e = DW + 0.05;
        K.M(new T.PlaneGeometry(1.25 - e, FL), concM, { x: 1.3, y: y + FL / 2, z: (1.25 + e) / 2, ry: -90 }, shaft);
        K.M(new T.PlaneGeometry(3.75 - e, FL), concM, { x: 1.3, y: y + FL / 2, z: (-3.75 - e) / 2, ry: -90 }, shaft);
        K.M(new T.PlaneGeometry(2 * e, FL - DH - 0.05), concM, { x: 1.3, y: y + DH + 0.05 + (FL - DH - 0.05) / 2, ry: -90 }, shaft);
        // landing doors (shaft side): dark steel leaves, hanger track, sill
        for (const sd of [-1, 1]) K.M(K.box(0.03, DH, DW + 0.01), K.mat("#4d5054", { rough: 0.5, metal: 0.8 }), { x: 1.25, y: y + DH / 2, z: sd * DW / 2 }, shaft);
        K.M(K.box(0.12, 0.1, 2 * DW + 0.5), K.mat("#2f3134", { rough: 0.5, metal: 0.7 }), { x: 1.2, y: y + DH + 0.08 }, shaft);
        K.M(K.box(0.16, 0.04, 2 * DW + 0.2), K.mat("#8a8d90", { rough: 0.4, metal: 0.9 }), { x: 1.22, y: y - 0.02 }, shaft);
        // light leaking through the leaves (the corridor beyond is lit): gap strips
        const gm = K.glow("#ffd9a8", 5.5);
        K.M(new T.PlaneGeometry(0.016, DH - 0.06), gm, { x: 1.23, y: y + DH / 2, ry: -90, cast: false }, shaft);
        K.M(new T.PlaneGeometry(2 * DW, 0.01), gm, { x: 1.23, y: y + DH + 0.005, ry: -90, cast: false }, shaft);
        for (const sd of [-1, 1]) K.M(new T.PlaneGeometry(0.006, DH - 0.06), gm, { x: 1.23, y: y + DH / 2, z: sd * (DW + 0.01), ry: -90, cast: false }, shaft);
        // painted floor number beside the opening
        K.M(new T.PlaneGeometry(0.5, 0.5), K.mat("#ffffff", { map: numT(11 + k), transparent: true, rough: 0.9 }), { x: 1.29, y: y + 1.6, z: -DW - 0.45, ry: -90, cast: false }, shaft);
        // divider beam between the shafts at each floor
        K.M(K.box(2.6, 0.22, 0.12), K.mat("#5a4a3a", { rough: 0.6, metal: 0.6 }), { x: 0, y: y + 0.4, z: -1.25 }, shaft);
      }
      // back walls + side wall
      // (the back wall and the near side wall are the cutaway: seen from outside they vanish; they cast no shadow)
      K.M(new T.PlaneGeometry(5.0, HH), concM, { x: -1.3, y: Y0 + HH / 2, z: -1.25, ry: 90, cast: false }, shaft);
      K.M(new T.PlaneGeometry(2.6, HH), concM, { x: 0, y: Y0 + HH / 2, z: 1.25, ry: 180, cast: false }, shaft);
      K.M(new T.PlaneGeometry(2.6, HH), concM, { x: 0, y: Y0 + HH / 2, z: -3.75, ry: 0 }, shaft);
      // guide rails (T-rails) for our car, and the neighbour's
      const railS = K.mat("#3d4044", { rough: 0.35, metal: 0.9, env: 0.8 });
      for (const z of [-1.08, 1.08]) { K.M(K.box(0.03, HH, 0.12), railS, { x: -0.1, y: Y0 + HH / 2, z }, shaft); K.M(K.box(0.12, HH, 0.012), railS, { x: -0.1, y: Y0 + HH / 2, z: z + (z > 0 ? 0.06 : -0.06) }, shaft); }
      for (const z of [-3.55, -1.45]) K.M(K.box(0.03, HH, 0.12), railS, { x: -0.1, y: Y0 + HH / 2, z }, shaft);
      // brackets every 2.5 m
      for (let y = Y0 + 1; y < Y1; y += 2.5) for (const z of [-1.08, 1.08]) K.M(K.box(0.25, 0.06, 0.06), railS, { x: -0.1, y, z: z + (z > 0 ? 0.1 : -0.1) }, shaft);
      // the car (exterior): body, sling, crosshead, top rail, apron, ropes
      const car = K.G({}, shaft);
      const carM = K.mat("#b4b8bd", { rough: 0.6, metal: 0.2, env: 0.6 });
      K.M(K.box(1.7, 2.5, 1.98), carM, { x: -0.05, y: 1.25 }, car);
      for (const z of [-1.0, 1.0]) K.M(K.box(0.14, 3.1, 0.06), K.mat("#2c2e31", { rough: 0.5, metal: 0.7 }), { x: -0.1, y: 1.35, z }, car);
      K.M(K.box(0.2, 0.22, 2.1), K.mat("#2c2e31", { rough: 0.5, metal: 0.7 }), { x: -0.1, y: 2.8, z: 0 }, car);
      K.M(K.box(0.2, 0.18, 2.1), K.mat("#2c2e31", { rough: 0.5, metal: 0.7 }), { x: -0.1, y: -0.12, z: 0 }, car);
      K.M(K.box(0.04, 0.9, 1.9), K.mat("#3a3c3f", { rough: 0.6, metal: 0.6 }), { x: 0.82, y: -0.42 }, car);   // apron
      const yel = K.mat("#d8a821", { rough: 0.5 });
      for (const [x, z] of [[-0.85, -0.95], [-0.85, 0.95], [0.75, -0.95], [0.75, 0.95]]) K.M(K.cyl(0.015, 0.015, 0.9, 8), yel, { x, y: 2.95, z }, car);
      K.M(K.box(1.62, 0.03, 0.03), yel, { x: -0.05, y: 3.38, z: -0.95 }, car); K.M(K.box(0.03, 0.03, 1.9), yel, { x: -0.85, y: 3.38, z: 0 }, car);
      K.M(K.box(0.3, 0.22, 0.25), K.mat("#2a2b2d", { rough: 0.6 }), { x: -0.5, y: 2.62, z: 0.55 }, car);   // junction box
      for (let i = 0; i < 6; i++) K.M(K.cyl(0.006, 0.006, 0.25, 6), K.mat("#bdbfc0", { metal: 1, rough: 0.3 }), { x: -0.1 + (i - 2.5) * 0.035, y: 3.0, z: 0 }, car);
      // the car's own door seam glows faintly (the lit cabin inside)
      const cg = K.glow("#eef3ff", 1.4);
      K.M(new T.PlaneGeometry(0.006, 2.0), cg, { x: 0.81, y: 1.05, ry: 90, cast: false }, car);
      E.shaftSet.carGlowM = cg;
      E.shaftSet.car = car;
      // car-top inspection lamp: a caged bulb on the crosshead that lights the ropes and the walls around the car
      const tl = RH3D.cageLamp(K, { pos: [-0.55, 3.12, -0.7], color: "#ffd9a0", parent: car }); tl.set(9);
      E.shaftSet.topL = K.light.point({ pos: [-0.55, 3.0, -0.7], color: "#ffd2a0", I: 4.5, range: 9, vol: 1.2 });
      car.add(E.shaftSet.topL); E.shaftSet.topL.position.set(-0.55, 3.0, -0.7);
      // ropes: from the crosshead into the dark above (they move with the car: long cylinders)
      const ropeM = K.mat("#8f9294", { rough: 0.4, metal: 0.9 });
      const ropes = K.G({}, shaft);
      for (let i = 0; i < 6; i++) K.M(K.cyl(0.006, 0.006, 40, 6), ropeM, { x: -0.1 + (i - 2.5) * 0.035, y: 20, z: 0, cast: false }, ropes);
      E.shaftSet.ropes = ropes;
      // counterweight on the back wall (x −1.0), with its ropes
      const cw = K.G({}, shaft);
      K.M(K.box(0.28, 2.6, 1.3), K.mat("#3b3d40", { rough: 0.7, metal: 0.5 }), { x: -1.05, y: 1.3, z: 0 }, cw);
      for (let k = 0; k < 9; k++) K.M(K.box(0.3, 0.02, 1.32), K.mat("#1f2022", { rough: 0.7 }), { x: -1.05, y: 0.15 + k * 0.28, z: 0 }, cw);
      for (let i = 0; i < 6; i++) K.M(K.cyl(0.006, 0.006, 40, 6), ropeM, { x: -1.05 + (i - 2.5) * 0.02, y: 22.6, z: 0, cast: false }, cw);
      for (const z of [-0.72, 0.72]) K.M(K.box(0.05, HH, 0.05), railS, { x: -1.05, y: Y0 + HH / 2, z }, shaft);
      E.shaftSet.cw = cw;
      // neighbour car far below (a lit roof in the dark) + pit
      K.M(K.box(1.7, 0.2, 1.98), carM, { x: -0.05, y: Y0 + 0.4, z: -2.5 }, shaft);
      shaftRedraw = () => {};
      E.shaftSet.FL = FL;
      E.shaftSet.carY = (y) => { car.position.y = y; ropes.position.y = y; cw.position.y = -y * 0.98 + 1.2; };
      E.shaftSet.carY(1.55);
    })();
    // shaft lights: caged bulbs on the back wall, a cold work light, door-gap beams
    E.shaftL = [];
    for (const [y, I] of [[-1.8, 2.2], [5.4, 1.6]]) {
      const lamp = RH3D.cageLamp(K, { pos: [-1.22, y, -2.3], color: "#ffcf8a", parent: shaft }); lamp.set(5);
      const L = K.light.point({ pos: [-1.1, y, -2.3], color: "#ffcf8a", I, range: 7, vol: 0.8 });
      shaft.add(L); L.position.set(-1.1, y, -2.3); E.shaftL.push(L);
    }
    for (const k of [-1, 0, 1]) {
      const L = K.light.spot({ pos: [1.32, k * 3.6 + 1.0, 0], at: [-1.3, k * 3.6 + 0.6, -0.5], color: "#ffd9a8", I: 8, angle: 22, pen: 0.6, range: 6, vol: 1.6 });
      shaft.add(L); shaft.add(L.target); L.position.set(1.32, k * 3.6 + 1.0, 0); L.target.position.set(-1.3, k * 3.6 + 0.6, -0.5); E.shaftL.push(L);
    }
    E.shaftKey = K.light.spot({ pos: [0.8, 6, -2.8], at: [0, 1.5, 0], color: "#b9c6dc", I: 0, angle: 30, pen: 0.8, range: 20, cast: 1024, radius: 3, vol: 0.4, far: 30 });
    shaft.add(E.shaftKey); shaft.add(E.shaftKey.target); E.shaftKey.position.set(-1.6, 7.5, 2.4); E.shaftKey.target.position.set(0, 1.5, 0);
    shaft.position.fromArray(o.shaft);

    // ---------------------------------------------------------------- stages
    E.garageObjs = null; E.G = null;
    E.cur = null;
    E.stage = function (name) {
      const org = name === "garage" ? o.garage : o.office;
      if (name !== "shaft") cab.position.fromArray(org);
      cab.visible = name !== "shaft";
      lobby.visible = name === "office";
      E.lobbyL.visible = E.cityL.visible = name === "office";
      shaft.visible = name === "shaft";
      E.shaftL.forEach((L) => (L.visible = name === "shaft")); E.shaftKey.visible = name === "shaft";
      [E.key, E.keyI, E.key2].concat(E.spots, E.images).forEach((L) => (L.visible = name !== "shaft"));
      if (E.garageObjs) E.garageObjs.forEach((ob) => (ob.visible = name === "garage" ? ob.userData.vis0 !== false : false));
      if (E.extraGarage) E.extraGarage.forEach((ob) => (ob.visible = name === "garage"));
      E.mirror.x = org[0] + XM;
      E.cur = name;
      cab.updateMatrixWorld(true);
    };
    E.mirrorX = () => E.mirror.x;
    E.w = (p) => { const org = E.cur === "garage" ? o.garage : o.office; return [p[0] + org[0], p[1] + org[1], p[2] + org[2]]; };
    E.wAt = (stage, p) => { const org = stage === "garage" ? o.garage : stage === "shaft" ? o.shaft : o.office; return [p[0] + org[0], p[1] + org[1], p[2] + org[2]]; };

    /** Level −4 outside the doors: G = RH3D.garage(K), objs = every top-level object the garage created */
    E.attachGarage = function (G, objs) {
      E.G = G;
      const ox = o.garage[0], oz = o.garage[2];
      // the lift-1 recess box would block the open doorway (seen from inside the cabin): hide it for good
      objs.forEach((ob) => {
        if (ob.isMesh && ob.geometry && ob.geometry.type === "BoxGeometry") {
          const pr = ob.geometry.parameters;
          if (Math.abs(pr.width - 0.12) < 1e-3 && Math.abs(pr.height - 2.3) < 1e-3 && Math.abs(ob.position.z - oz) < 0.05) ob.userData.vis0 = false;
        }
      });
      E.garageObjs = objs;
      // a column with the yellow −4 band right across from the lift (on the beam line z = 0)
      const colM = objs.find((ob) => ob.isMesh && ob.geometry.type === "BoxGeometry" && Math.abs(ob.geometry.parameters.width - 0.5) < 1e-3 && Math.abs(ob.geometry.parameters.height - 2.75) < 1e-3);
      E.extraGarage = [];
      // a doorway in the left wall (so the open lift can be seen from the garage): the wall plane is replaced by
      // three pieces with the same material and UVs, and the closed lift-1 door plane is hidden
      const wall = objs.find((ob) => ob.isMesh && ob.geometry.type === "PlaneGeometry" && Math.abs(ob.position.x - (-8.6)) < 1e-3 && ob.geometry.parameters.width > 40);
      if (wall) {
        wall.userData.vis0 = false;
        const L = wall.geometry.parameters.width, Hw = wall.geometry.parameters.height, zTop = wall.position.z + L / 2;   // u = 0 at z = zTop
        const piece = (za, zb, y0, y1) => {
          const g = new T.PlaneGeometry(zb - za, y1 - y0), uv = g.attributes.uv;
          for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, (zTop - (u > 0.5 ? za : zb)) / L, (y0 + v * (y1 - y0)) / Hw); }
          uv.needsUpdate = true;
          const m = K.M(g, wall.material, { x: wall.position.x, y: (y0 + y1) / 2, z: (za + zb) / 2, ry: 90 });
          E.extraGarage.push(m);
        };
        const e = DW + 0.06;
        piece(wall.position.z - L / 2, oz - e, 0, Hw); piece(oz + e, zTop, 0, Hw); piece(oz - e, oz + e, DH + 0.08, Hw);
        const fr = K.mat("#4a4d51", { rough: 0.4, metal: 0.8, env: 0.8 });
        for (const sd of [-1, 1]) E.extraGarage.push(K.M(K.box(0.08, DH + 0.1, 0.09), fr, { x: -8.58, y: (DH + 0.1) / 2, z: oz + sd * (e - 0.02) }));
        E.extraGarage.push(K.M(K.box(0.08, 0.1, 2 * e + 0.06), fr, { x: -8.58, y: DH + 0.06, z: oz }));
      }
      if (G.lifts && G.lifts[0]) G.lifts.forEach((m) => { if (Math.abs(m.position.z - oz) < 0.05) m.userData.vis0 = false; });
      if (colM) {
        const c = K.M(K.box(0.5, 2.75, 0.5), colM.material, { x: -3.45, y: 1.375, z: oz + 0.05 });
        const pl = K.M(K.rbox(0.74, 0.74, 0.22, 0.03), K.mat("#c99a1f", { rough: 0.7 }), { x: -3.45, y: 0.11, z: oz + 0.05, rx: 90 });
        E.extraGarage.push(c, pl);
      }
    };

    // ---------------------------------------------------------------- environment bakes
    E.bake = function () {
      const keepL = Object.assign({}, E.lightState), keepO = E.open;
      E.envDim = 0.4;
      E.stage("office"); E.doors(0);
      K.env.bake("cab-white", E.w([-0.8, 1.45, 0]), () => E.light(1, 0));
      K.env.bake("cab-red", E.w([-0.8, 1.45, 0]), () => E.light(0, 1));
      if (E.G) {
        E.stage("garage"); E.doors(1);
        K.env.bake("cab-garage", E.w([-0.8, 1.45, 0]), () => { E.light(0, 1); E.G.allRows(0, 1); E.G.exit(0); });
      }
      E.stage("shaft");
      K.env.bake("shaft", [o.shaft[0] - 0.2, o.shaft[1] + 1.5, o.shaft[2] - 2.4], () => { E.shaftKey.intensity = 240; });
      E.envDim = 1;
      E.light(keepL.w, keepL.r); E.doors(keepO || 0); E.stage("office");
    };
    return E;
  }

  /** run build() and return { result, objs }: every top-level object it added to the scene (to show/hide a set) */
  function collect(K, build) {
    const before = new Set(K.scene.children);
    const result = build();
    const objs = K.scene.children.filter((c) => !before.has(c));
    return { result, objs };
  }

  // floor sitting pose (back to the wall, knees up, forearms on the knees); additive to the shared pose table
  if (RH3D.POSES && !RH3D.POSES.sitFloor) {
    const b = RH3D.POSES.stand;
    RH3D.POSES.sitFloor = Object.assign({}, b, { rootY: -0.86, hips: [-14, 0, 0], waist: [6, 0, 0], chest: [14, 0, 0], neck: [10, 0, 0], head: [6, 0, 0],
      hipL: [-96, -14, 12], hipR: [-96, 14, -12], knL: [118, 0, 0], knR: [118, 0, 0], anL: [-22, 0, 0], anR: [-22, 0, 0],
      shL: [-46, 0, 18], shR: [-46, 0, -18], elL: [-62, 0, 0], elR: [-62, 0, 0] });
    RH3D.POSES.grabRail = Object.assign({}, b, { shR: [-8, 0, -34], elR: [-46, 0, 0], wrR: [0, 0, 20], chest: [2, 0, 0] });
    RH3D.POSES.pressBtn = Object.assign({}, b, { shR: [-62, -18, -12], elR: [-34, 0, 0], wrR: [-10, 0, 0], neck: [6, 0, 0] });
  }

  Object.assign(RH3D, { elevator, collect, brushed, dotMatrix, reach });
})();
