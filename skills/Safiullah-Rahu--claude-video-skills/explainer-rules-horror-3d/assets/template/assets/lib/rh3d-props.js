/* rh3d-props.js — reusable props and in-world displays for the realistic-horror kit (needs rh3d-core.js).
 *
 *   RH3D.phoneUI(ctx, w, h, { time, date, battery, low, noService, dim })   draw a lock screen (call on phone.phScreenM.map)
 *   RH3D.phoneScreenTex(K, key) -> CanvasTexture you redraw with phoneUI
 *   RH3D.ruleCard(K, { title, sub, rules: [[label, text], …], circle: i, torn, seed }) -> CanvasTexture (with alpha)
 *   RH3D.led(K, key, { w, h, cols, rows, color, lines: [text, …] }) -> { tex, set(lines) }   dot-matrix board
 *   RH3D.seg7(K, key, { color, text }) -> { tex, set(text) }                              7-segment clock
 *   RH3D.tube(K, { pos, len, axis, color, hdr, parent }) -> { group, glowM, set(state 0..1, hex) }   batten fixture
 *   RH3D.cageLamp(K, { pos, color, parent }) -> { group, glowM }                          emergency cage lamp
 *   RH3D.car(K, { type: sedan|hatch|suv, color, seed, plate }) -> group (front = +z, on the floor)
 *   RH3D.blob(K, { w, d, opacity, x, z, ry, parent }) -> mesh                             contact shadow on the floor
 *   RH3D.decal(K, tex, { w, d, x, z, ry, mat }) -> mesh                                   floor decal (floor layer)
 */
(function () {
  const RH3D = window.RH3D;
  const D2R = Math.PI / 180;
  const FONT = '"MontserratRH", "Montserrat", "Arial Black", Arial, sans-serif';

  // ------------------------------------------------------------------ phone lock screen
  function phoneUI(g, w, h, o) {
    o = Object.assign({ time: "23:48", date: "Saturday, 2 November", battery: 2, low: true, noService: false, dim: 1, bg: "#0b1220" }, o || {});
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#14223a"); gr.addColorStop(0.55, "#0b1322"); gr.addColorStop(1, "#05080e");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = w / 400;
    g.fillStyle = "rgba(255,255,255,0.9)"; g.font = `600 ${22 * s}px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText(o.time, 28 * s, 34 * s);
    // status: signal + battery (top right)
    const bx = w - 78 * s, by = 22 * s;
    g.strokeStyle = o.battery <= 10 ? "#ff3b30" : "rgba(255,255,255,0.9)"; g.lineWidth = 2.4 * s;
    g.strokeRect(bx, by, 40 * s, 22 * s); g.fillStyle = g.strokeStyle; g.fillRect(bx + 41.5 * s, by + 7 * s, 3.5 * s, 8 * s);
    g.fillRect(bx + 3 * s, by + 3 * s, Math.max(2 * s, 34 * s * o.battery / 100), 16 * s);
    if (o.noService) {
      g.fillStyle = "rgba(255,255,255,0.35)";
      for (let i = 0; i < 4; i++) g.fillRect(w - 128 * s + i * 9 * s, by + 18 * s - i * 5 * s, 6 * s, 4 * s + i * 5 * s);
      g.strokeStyle = "#ff3b30"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(w - 130 * s, by + 22 * s); g.lineTo(w - 94 * s, by - 2 * s); g.stroke();
    } else {
      g.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 4; i++) g.fillRect(w - 128 * s + i * 9 * s, by + 18 * s - i * 5 * s, 6 * s, 4 * s + i * 5 * s);
    }
    // big clock
    g.textAlign = "center"; g.fillStyle = "#ffffff"; g.font = `800 ${118 * s}px ${FONT}`;
    g.fillText(o.time, w / 2, 210 * s);
    g.font = `500 ${24 * s}px ${FONT}`; g.fillStyle = "rgba(255,255,255,0.78)"; g.fillText(o.date, w / 2, 290 * s);
    // centre card
    const cy = h * 0.56;
    if (o.noService) {
      g.fillStyle = "#ff453a"; g.font = `800 ${46 * s}px ${FONT}`; g.fillText("No Service", w / 2, cy + 40 * s);
      g.fillStyle = "rgba(255,255,255,0.7)"; g.font = `500 ${22 * s}px ${FONT}`; g.fillText("Emergency calls unavailable", w / 2, cy + 88 * s);
      // crossed bars icon
      g.fillStyle = "#ff453a";
      for (let i = 0; i < 4; i++) g.fillRect(w / 2 - 48 * s + i * 26 * s, cy - 40 * s - i * 18 * s, 18 * s, 20 * s + i * 18 * s);
      g.strokeStyle = "#ff453a"; g.lineWidth = 7 * s; g.beginPath(); g.moveTo(w / 2 - 66 * s, cy - 6 * s); g.lineTo(w / 2 + 66 * s, cy - 110 * s); g.stroke();
    } else {
      // battery icon, red, 2 %
      const iw = 150 * s, ih = 74 * s, ix = w / 2 - iw / 2, iy = cy - 120 * s;
      g.strokeStyle = "#ff453a"; g.lineWidth = 7 * s; g.strokeRect(ix, iy, iw, ih);
      g.fillStyle = "#ff453a"; g.fillRect(ix + iw + 4 * s, iy + ih * 0.3, 12 * s, ih * 0.4);
      g.fillRect(ix + 8 * s, iy + 8 * s, Math.max(6 * s, (iw - 16 * s) * o.battery / 100), ih - 16 * s);
      g.font = `800 ${64 * s}px ${FONT}`; g.fillText(o.battery + "%", w / 2, cy + 18 * s);
      g.fillStyle = "rgba(255,255,255,0.75)"; g.font = `600 ${24 * s}px ${FONT}`; g.fillText("Battery low", w / 2, cy + 70 * s);
    }
    g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(w / 2 - 70 * s, h - 26 * s, 140 * s, 6 * s);
    if (o.dim < 1) { g.fillStyle = `rgba(0,0,0,${1 - o.dim})`; g.fillRect(0, 0, w, h); }
  }
  function phoneScreenTex(K, key) { return K.canvasTex(key || "phone-ui", 400, 880, () => {}, { fresh: true, clamp: true }); }

  // ------------------------------------------------------------------ laminated rule card (taped, torn bottom)
  function ruleCard(K, o) {
    o = Object.assign({ title: ["NIGHT ATTENDANT", "RULES"], sub: "STAFF ONLY · LEVEL −4", rules: [], circle: -1, torn: true, seed: 5, key: "card" }, o || {});
    const W = 760, H = 1000;
    return K.canvasTex(o.key + (o.circle >= 0 ? ":c" : ""), W, H, (g) => {
      const r = RH3D.rng(o.seed);
      g.clearRect(0, 0, W, H);
      // torn path for the paper
      const tornY = H * 0.86;
      g.save();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, tornY);
      for (let x = W; x >= 0; x -= 14 + r() * 18) g.lineTo(x, tornY + (r() - 0.5) * 56 + (r() < 0.2 ? 30 : 0));
      g.lineTo(0, tornY); g.closePath(); g.clip();
      const pg = g.createLinearGradient(0, 0, W, H); pg.addColorStop(0, "#f2efe6"); pg.addColorStop(1, "#e2ddd0");
      g.fillStyle = pg; g.fillRect(0, 0, W, H);
      // paper fibre + grime
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(80,70,55,${r() * 0.05})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
      for (let i = 0; i < 6; i++) { const x = r() * W, y = r() * H, rr = 60 + r() * 160; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(120,100,70,0.10)"); gr.addColorStop(1, "rgba(120,100,70,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      if (o.blank) { g.restore(); return; }
      g.fillStyle = "#26231f"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.font = `900 74px ${FONT}`;
      o.title.forEach((t, i) => g.fillText(t, W / 2, 130 + i * 84));
      g.fillStyle = "#26231f"; g.fillRect(70, 230, W - 140, 4);
      g.fillStyle = "#b8322a"; g.font = `800 34px ${FONT}`; g.fillText(o.sub, W / 2, 284);
      g.fillStyle = "#26231f"; g.fillRect(70, 312, W - 140, 3);
      g.textAlign = "left";
      let y = 392;
      o.rules.forEach((rule, i) => {
        g.fillStyle = "#26231f"; g.font = `900 46px ${FONT}`; g.fillText(rule[0], 76, y);
        g.font = `800 44px ${FONT}`;
        const lines = rule[1];
        lines.forEach((ln, j) => g.fillText(ln, 76, y + 60 + j * 54));
        if (i === o.circle) {
          // red marker circle (hand-drawn ellipse, two passes)
          g.strokeStyle = "rgba(205,30,24,0.92)"; g.lineWidth = 9; g.lineCap = "round";
          const cx = W / 2 - 20, cy = y + 40 + lines.length * 22, rx = W * 0.47, ry = 46 + lines.length * 34;
          for (let p = 0; p < 2; p++) { g.beginPath(); for (let a = -0.3 + p * 0.2; a < Math.PI * 2 + 0.25 - p * 0.1; a += 0.05) { const wob = 1 + Math.sin(a * 3 + p) * 0.025; const px = cx + Math.cos(a) * rx * wob, py = cy + Math.sin(a) * ry * wob; a === -0.3 + p * 0.2 ? g.moveTo(px, py) : g.lineTo(px, py); } g.stroke(); }
        }
        y += 60 + lines.length * 54 + 54;
        if (i < o.rules.length - 1) { g.fillStyle = "rgba(184,50,42,0.75)"; g.fillRect(70, y - 46, W - 140, 3); }
      });
      g.restore();
      // laminate border sheen + tape
      g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, tornY - 10);
      g.fillStyle = "rgba(235,232,215,0.55)";
      [[60, -10, -8], [W - 190, -14, 6]].forEach(([x, y, a]) => { g.save(); g.translate(x + 65, y + 30); g.rotate(a * D2R); g.fillRect(-70, -26, 140, 52); g.restore(); });
    }, { clamp: true });
  }

  // ------------------------------------------------------------------ dot-matrix LED board
  function led(K, key, o) {
    o = Object.assign({ w: 768, h: 192, cols: 80, rows: 20, color: "#ffae2e", lines: ["EXIT CLOSED"], bg: "#120d0a", font: 9 }, o || {});
    const small = document.createElement("canvas"); small.width = o.cols; small.height = o.rows;
    const sg = small.getContext("2d", { willReadFrequently: true });
    const tex = K.canvasTex(key, o.w, o.h, () => {}, { fresh: true, clamp: true });
    let cur = "";
    function set(lines) {
      const k = JSON.stringify(lines);
      if (k === cur) return; cur = k;
      sg.clearRect(0, 0, o.cols, o.rows); sg.fillStyle = "#fff"; sg.textAlign = "center"; sg.textBaseline = "middle";
      sg.font = `700 ${o.font}px Arial, sans-serif`;
      const n = lines.length;
      // monospace dot-matrix: each glyph centred in a fixed 6-dot cell (no proportional kerning gaps)
      lines.forEach((t, i) => {
        const cell = 6, x0 = Math.round(o.cols / 2 - (t.length * cell) / 2), y = Math.round((o.rows / n) * (i + 0.5)) + 0.5;
        for (let c = 0; c < t.length; c++) sg.fillText(t[c], x0 + c * cell + cell / 2, y);
      });
      const d = sg.getImageData(0, 0, o.cols, o.rows).data;
      const g = tex.userData.ctx, cw = o.w / o.cols, ch = o.h / o.rows;
      g.fillStyle = o.bg; g.fillRect(0, 0, o.w, o.h);
      for (let y = 0; y < o.rows; y++) for (let x = 0; x < o.cols; x++) {
        const on = d[(y * o.cols + x) * 4 + 3] > 90;
        g.fillStyle = on ? o.color : "rgba(255,170,60,0.07)";
        g.beginPath(); g.arc((x + 0.5) * cw, (y + 0.5) * ch, Math.min(cw, ch) * (on ? 0.42 : 0.32), 0, 7); g.fill();
      }
      tex.needsUpdate = true;
    }
    set(o.lines);
    return { tex, set };
  }

  // ------------------------------------------------------------------ 7-segment clock
  function seg7(K, key, o) {
    o = Object.assign({ color: "#ff2a1a", text: "23:59", w: 512, h: 200, bg: "#0e0707" }, o || {});
    const tex = K.canvasTex(key, o.w, o.h, () => {}, { fresh: true, clamp: true });
    const SEG = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g", " ": "" };
    let cur = "";
    function digit(g, x, y, w, h, ch, col) {
      const t = w * 0.17, on = SEG[ch] || "";
      const segs = { a: [x + t, y, w - 2 * t, t], d: [x + t, y + h - t, w - 2 * t, t], g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
        f: [x, y + t, t, h / 2 - t * 1.2], b: [x + w - t, y + t, t, h / 2 - t * 1.2], e: [x, y + h / 2 + t * 0.2, t, h / 2 - t * 1.2], c: [x + w - t, y + h / 2 + t * 0.2, t, h / 2 - t * 1.2] };
      for (const s in segs) { g.fillStyle = on.includes(s) ? col : "rgba(255,40,20,0.06)"; const r = segs[s]; g.fillRect(r[0], r[1], r[2], r[3]); }
    }
    function set(text) {
      if (text === cur) return; cur = text;
      const g = tex.userData.ctx;
      g.fillStyle = o.bg; g.fillRect(0, 0, o.w, o.h);
      const dw = o.w * 0.18, dh = o.h * 0.72, y = o.h * 0.14;
      let x = o.w * 0.06;
      for (const ch of text) {
        if (ch === ":") { g.fillStyle = o.color; g.fillRect(x + dw * 0.12, y + dh * 0.28, dw * 0.16, dw * 0.16); g.fillRect(x + dw * 0.12, y + dh * 0.62, dw * 0.16, dw * 0.16); x += dw * 0.42; continue; }
        digit(g, x, y, dw, dh, ch, o.color); x += dw * 1.18;
      }
      tex.needsUpdate = true;
    }
    set(o.text);
    return { tex, set };
  }

  // ------------------------------------------------------------------ light fixtures
  /** fluorescent batten: aluminium body + opal diffuser tube; set(on 0..1, hex) dims the emissive (the light itself is
   *  separate so a row can switch its SpotLight with it) */
  function tube(K, o) {
    o = Object.assign({ pos: [0, 2.6, 0], len: 1.5, axis: "z", color: "#eef3ff", hdr: 7, parent: null }, o || {});
    const T = K.T;
    const g = K.G({ x: o.pos[0], y: o.pos[1], z: o.pos[2], ry: o.axis === "z" ? 0 : 90 }, o.parent);
    K.M(K.box(0.16, 0.05, o.len + 0.04), K.mat("#c9cbc9", { rough: 0.45, metal: 0.6 }), { y: 0.03, cast: false }, g);
    const glowM = K.glow(o.color, o.hdr);
    const tb = K.M(K.cyl(0.03, 0.03, o.len, 14), glowM, { rx: 90, y: -0.0, cast: false, receive: false }, g);
    tb.userData.noEnv = false;
    // hanging wires
    K.M(K.cyl(0.003, 0.003, 0.18, 4), K.mat("#222222"), { y: 0.14, z: o.len * 0.4, cast: false }, g);
    K.M(K.cyl(0.003, 0.003, 0.18, 4), K.mat("#222222"), { y: 0.14, z: -o.len * 0.4, cast: false }, g);
    const base = glowM.color.clone();
    function set(on, hex) { glowM.color.set(hex || o.color).multiplyScalar(o.hdr * on + 0.02); }
    return { group: g, glowM, set, base };
  }
  function cageLamp(K, o) {
    o = Object.assign({ pos: [0, 2.5, 0], color: "#ff2010", hdr: 0, parent: null }, o || {});
    const g = K.G({ x: o.pos[0], y: o.pos[1], z: o.pos[2] }, o.parent);
    K.M(K.cyl(0.07, 0.07, 0.04, 16), K.mat("#2a2a2a", { rough: 0.5, metal: 0.5 }), { y: 0.06, cast: false }, g);
    const glowM = K.glow(o.color, o.hdr);
    K.M(K.sph(0.055, 16, 12), glowM, { y: 0.0, cast: false, receive: false }, g);
    const cage = K.mat("#1b1b1b", { rough: 0.5, metal: 0.7 });
    for (let i = 0; i < 4; i++) K.M(K.box(0.006, 0.12, 0.006), cage, { x: Math.cos(i * Math.PI / 2) * 0.062, z: Math.sin(i * Math.PI / 2) * 0.062, cast: false }, g);
    K.M(new K.T.TorusGeometry(0.062, 0.004, 4, 20), cage, { rx: 90, y: -0.035, cast: false }, g);
    return { group: g, glowM, set(on, hex) { glowM.color.set(hex || o.color).multiplyScalar(on); } };
  }

  // ------------------------------------------------------------------ contact shadow + floor decals
  let blobTex = null;
  function blob(K, o) {
    o = Object.assign({ w: 2, d: 4, opacity: 0.75, x: 0, z: 0, ry: 0, y: 0.004, parent: null }, o || {});
    if (!blobTex) blobTex = K.canvasTex("blob", 128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.55, "rgba(0,0,0,0.72)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, { clamp: true });
    const m = new K.T.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: o.opacity, depthWrite: false, color: "#000000" });
    m.polygonOffset = true; m.polygonOffsetFactor = -4; m.polygonOffsetUnits = -4;
    const mesh = K.M(new K.T.PlaneGeometry(o.w, o.d), m, { x: o.x, y: o.y, z: o.z, rx: -90, rz: o.ry, cast: false, receive: false, layer: K.LAYER.FLOOR, ro: 1 }, o.parent);
    return mesh;
  }
  function decal(K, tex, o) {
    o = Object.assign({ w: 1, d: 1, x: 0, z: 0, y: 0.003, ry: 0 }, o || {});
    const m = o.mat || new K.T.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.7 });
    m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -3;
    return K.M(new K.T.PlaneGeometry(o.w, o.d), m, { x: o.x, y: o.y, z: o.z, rx: -90, rz: o.ry, cast: false, receive: true, layer: K.LAYER.FLOOR, ro: 1 }, o.parent);
  }

  // ------------------------------------------------------------------ procedural car (front = +z)
  const CAR = {
    sedan: { L: 4.62, W: 1.8, wb: 1.38, wr: 0.33, body: [[2.22, 0.2], [2.34, 0.5, 2.37, 0.26], [2.28, 0.68, 2.36, 0.62], [2.0, 0.82, 2.24, 0.8], [0.95, 0.92, 1.55, 0.9], [-1.55, 0.98], [-2.14, 0.97, -1.9, 1.0], [-2.32, 0.7, -2.31, 0.95], [-2.28, 0.22, -2.36, 0.3]],
      glass: [[0.95, 0.92], [0.12, 1.4, 0.58, 1.27], [-0.88, 1.42, -0.36, 1.46], [-1.55, 0.98, -1.3, 1.26]] },
    hatch: { L: 4.12, W: 1.76, wb: 1.27, wr: 0.32, body: [[1.98, 0.2], [2.08, 0.5, 2.12, 0.26], [2.03, 0.68, 2.1, 0.62], [1.75, 0.84, 1.98, 0.81], [0.8, 0.95, 1.3, 0.92], [-1.78, 1.0], [-1.98, 0.92, -1.95, 1.0], [-2.04, 0.62, -2.04, 0.85], [-2.0, 0.22, -2.08, 0.3]],
      glass: [[0.8, 0.95], [0.02, 1.42, 0.42, 1.3], [-1.55, 1.44, -0.8, 1.48], [-1.8, 1.0, -1.82, 1.3]] },
    suv: { L: 4.72, W: 1.9, wb: 1.42, wr: 0.37, body: [[2.28, 0.24], [2.38, 0.58, 2.42, 0.3], [2.33, 0.86, 2.4, 0.78], [2.0, 1.0, 2.28, 0.98], [1.0, 1.08, 1.6, 1.06], [-1.95, 1.1], [-2.28, 1.06, -2.2, 1.12], [-2.38, 0.7, -2.38, 1.0], [-2.32, 0.26, -2.4, 0.34]],
      glass: [[1.0, 1.08], [0.3, 1.66, 0.7, 1.52], [-1.85, 1.68, -0.8, 1.72], [-1.98, 1.1, -2.05, 1.5]] },
  };
  function shapeFrom(pts, arches) {
    const T = THREE, s = new T.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[2], p[3], p[0], p[1]); else s.lineTo(p[0], p[1]); }
    if (arches) {
      const [wb, wr, by] = arches, ar = wr + 0.06;
      s.lineTo(-wb - ar, by); s.absarc(-wb, wr, ar, Math.PI, 0, true); s.lineTo(wb - ar, by); s.absarc(wb, wr, ar, Math.PI, 0, true);
    }
    s.lineTo(pts[0][0], pts[0][1]);
    return s;
  }
  function car(K, o) {
    o = Object.assign({ type: "sedan", color: "#2b3a55", seed: 1, plate: "RH 04 KXT", metal: 0.55 }, o || {});
    const T = K.T, C = CAR[o.type] || CAR.sedan;
    const g = K.G({ name: "car" }, o.parent);
    const paint = K.mat(o.color, { phys: true, metal: o.metal, rough: 0.32, clearcoat: 1, ccRough: 0.03, env: 1.0 });
    const glass = K.mat("#07090c", { phys: true, metal: 0.1, rough: 0.04, clearcoat: 1, ccRough: 0.01, env: 1.2 });
    const trim = K.mat("#0c0c0d", { rough: 0.55 });
    const by = C.body[0][1];
    const bodyS = shapeFrom(C.body.concat([[C.body[C.body.length - 1][0] + 0.02, by]]), [C.wb, C.wr, by]);
    const bodyG = new T.ExtrudeGeometry(bodyS, { depth: C.W - 0.24, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.09, bevelSegments: 5, curveSegments: 14 });
    bodyG.translate(0, 0, -(C.W - 0.24) / 2);
    bodyG.rotateY(-Math.PI / 2);
    bodyG.computeVertexNormals();
    K.M(bodyG, paint, {}, g);
    const gs = shapeFrom(C.glass, null);
    const gw = C.W - 0.44;
    const glassG = new T.ExtrudeGeometry(gs, { depth: gw - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 12 });
    glassG.translate(0, -0.02, -(gw - 0.1) / 2);
    // tumblehome: narrow toward the roof
    const pa = glassG.attributes.position;
    const y0 = C.glass[0][1];
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); const k = 1 - 0.13 * Math.max(0, Math.min(1, (y - y0) / 0.5)); pa.setZ(i, pa.getZ(i) * k); }
    glassG.rotateY(-Math.PI / 2);
    glassG.computeVertexNormals();
    K.M(glassG, glass, {}, g);
    // roof skin (paint) over the glass top
    const roofTop = C.glass[2][1] + 0.0;
    K.M(K.rbox(gw * 0.87, Math.abs(C.glass[2][0] - C.glass[1][0]) * 0.86, 0.04, 0.12, 0.015), paint, { y: roofTop + 0.005, z: (C.glass[1][0] + C.glass[2][0]) / 2, rx: -90 }, g);
    // wheels
    const tire = K.mat("#121213", { rough: 0.85 }), rim = K.mat("#9a9da2", { phys: true, metal: 0.9, rough: 0.28, clearcoat: 0.4 });
    const wellM = K.mat("#050505", { rough: 1, side: T.BackSide });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const wx = sx * (C.W / 2 - 0.13), wz = sz * C.wb;
      K.M(K.cyl(C.wr, C.wr, 0.22, 26), tire, { x: wx, y: C.wr, z: wz, rz: 90 }, g);
      K.M(K.cyl(C.wr * 0.62, C.wr * 0.62, 0.225, 20), rim, { x: wx + sx * 0.004, y: C.wr, z: wz, rz: 90, cast: false }, g);
      K.M(K.cyl(C.wr + 0.07, C.wr + 0.07, 0.36, 18, true), wellM, { x: sx * (C.W / 2 - 0.2), y: C.wr + 0.02, z: wz, rz: 90, cast: false }, g);
    }
    // lights, grille, plate
    const front = C.body[1][0] - 0.02, rear = C.body[C.body.length - 2][0];
    const hl = K.mat("#d9dde2", { phys: true, rough: 0.1, metal: 0.2, clearcoat: 1, emi: "#fff6e0", emiI: 0 });
    const tl = K.mat("#5c0b08", { phys: true, rough: 0.15, clearcoat: 1, emi: "#ff1a0a", emiI: 0 });
    for (const sx of [-1, 1]) {
      K.M(K.rbox(0.36, 0.11, 0.06, 0.04), hl, { x: sx * (C.W / 2 - 0.3), y: C.body[2][1] - 0.04, z: front, cast: false }, g);
      K.M(K.rbox(0.34, 0.1, 0.06, 0.03), tl, { x: sx * (C.W / 2 - 0.3), y: C.body[C.body.length - 3][1] - 0.12, z: rear + 0.02, cast: false }, g);
    }
    K.M(K.box(C.W * 0.42, 0.12, 0.04), trim, { y: C.body[1][1] - 0.06, z: front + 0.02, cast: false }, g);
    const plateTex = K.canvasTex("plate:" + o.plate, 256, 56, (gg, w, h) => {
      gg.fillStyle = "#e9e7df"; gg.fillRect(0, 0, w, h); gg.strokeStyle = "#222"; gg.lineWidth = 3; gg.strokeRect(2, 2, w - 4, h - 4);
      gg.fillStyle = "#151515"; gg.font = `800 34px ${FONT}`; gg.textAlign = "center"; gg.textBaseline = "middle"; gg.fillText(o.plate, w / 2, h / 2 + 1);
    });
    const plM = K.mat("#ffffff", { map: plateTex, rough: 0.5 });
    K.M(new T.PlaneGeometry(0.42, 0.095), plM, { y: 0.42, z: front + 0.06, cast: false }, g);
    K.M(new T.PlaneGeometry(0.42, 0.095), plM, { y: 0.5, z: rear - 0.03, ry: 180, cast: false }, g);
    // mirrors
    for (const sx of [-1, 1]) K.M(K.rbox(0.07, 0.1, 0.16, 0.03), paint, { x: sx * (C.W / 2 + 0.03), y: C.glass[0][1] + 0.08, z: C.glass[0][0] - 0.25, ry: 90 }, g);
    g.userData.size = [C.W, C.L];
    g.userData.headM = hl; g.userData.tailM = tl;
    return g;
  }

  Object.assign(RH3D, { phoneUI, phoneScreenTex, ruleCard, led, seg7, tube, cageLamp, blob, decal, car, CAR });
})();
