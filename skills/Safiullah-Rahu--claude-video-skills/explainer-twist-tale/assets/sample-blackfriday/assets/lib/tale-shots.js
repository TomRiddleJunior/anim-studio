/* "Why Black Friday Is Called Black Friday" — sets and shots for the twist-tale kit (v2: 3D toon cast).
 * TALE_FILM(K, V) builds every set once and returns { shots, reset }. V.w(line, word, k) = start time of a narration
 * word. Each shot: { t0, set, cam: [from, to], look: [from, to], fov, fn(t, u) }; every shot first runs its set's
 * reset(), so any frame renders the same on its own.
 */
window.TALE_FILM = function (K, V) {
  const T3 = K.T;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const back = (u) => { const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const pop = (a, d, t) => (t <= a ? 0 : t >= a + d ? 1 : back((t - a) / d));
  const w = (l, wd, k) => V.w(l, wd, k);
  const INK = K.INK;
  const FONT = '"Arial Black", Arial, sans-serif', SERIF = 'Georgia, "Times New Roman", serif', CHALK = '"Segoe Print", "Comic Sans MS", cursive';

  // ---- canvas helpers (system fonts only)
  function ctx(wd, ht, draw) {
    const cv = document.createElement("canvas");
    cv.width = wd; cv.height = ht;
    const g = cv.getContext("2d");
    g.lineJoin = g.lineCap = "round";
    draw(g, wd, ht);
    const t = new T3.CanvasTexture(cv);
    t.colorSpace = T3.NoColorSpace;
    t.anisotropy = 8;
    return t;
  }
  function txt(g, s, x, y, size, color, o) {
    o = o || {};
    g.font = `${o.weight || 900} ${size}px ${o.font || FONT}`;
    const max = o.max || g.canvas.width * 0.92;
    while (size > 12 && g.measureText(s).width > max) { size -= 2; g.font = `${o.weight || 900} ${size}px ${o.font || FONT}`; }
    g.textAlign = o.align || "center"; g.textBaseline = "middle";
    if (o.stroke) { g.lineWidth = o.sw || size * 0.16; g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
    g.fillStyle = color; g.fillText(s, x, y);
  }
  function rrect(g, x, y, wd, ht, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + wd, y, x + wd, y + ht, r); g.arcTo(x + wd, y + ht, x, y + ht, r); g.arcTo(x, y + ht, x, y, r); g.arcTo(x, y, x + wd, y, r); g.closePath(); }
  const sign = (wd, ht, lines, o) => K.ctex("sign", Object.assign({ w: wd, h: ht, lines }, o));
  // a label that reveals left to right (typing / chalk writing): plane + its own texture copy
  function revealer(wd, ht, tex, p) {
    const t = tex.clone(); t.needsUpdate = true; t.wrapS = T3.ClampToEdgeWrapping;
    const m = K.plane(wd, ht, t, p);
    m.userData.x0 = m.position.x; m.userData.w = wd;
    m.userData.k = (k) => { k = clamp(k, 0.001, 1); t.repeat.x = k; m.scale.x = k; m.position.x = m.userData.x0 - (1 - k) * wd / 2 * Math.cos(m.rotation.y); m.visible = k > 0.002; };
    return m;
  }
  const bagTex = (c, s) => ctx(128, 128, (g) => { g.fillStyle = c; g.fillRect(0, 0, 128, 128); if (s) txt(g, s, 64, 70, 46, "#ffffff", { stroke: INK, sw: 6 }); });
  function bag(color, label) {
    const g = new T3.Group();
    K.box(0.34, 0.38, 0.14, "#ffffff", { tex: bagTex(color, label), parent: g, y: -0.46 });
    K.torus(0.09, 0.012, INK, { y: -0.08, parent: g });
    return g;
  }
  function pennant(text, c1, c2) {
    const t = ctx(512, 256, (g) => {
      g.fillStyle = c1; g.strokeStyle = INK; g.lineWidth = 12;
      g.beginPath(); g.moveTo(10, 10); g.lineTo(500, 128); g.lineTo(10, 246); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = c2; g.fillRect(10, 10, 40, 236);
      txt(g, text, 200, 132, 78, c2, { stroke: INK, sw: 10 });
    });
    const gr = new T3.Group();
    K.cyl(0.015, 0.015, 0.9, "#c98d55", { parent: gr, y: -0.15 });
    K.plane(0.62, 0.31, t, { x: 0.32, y: 0.55, parent: gr });
    return gr;
  }
  function bubble(s, color) {
    return ctx(256, 256, (g) => {
      g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 12;
      g.beginPath(); g.arc(128, 116, 96, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(96, 200); g.lineTo(70, 248); g.lineTo(136, 208); g.fill();
      txt(g, s, 128, 122, 140, color || "#ff5a4e", { stroke: INK, sw: 12 });
    });
  }
  const heartTex = ctx(256, 256, (g) => {
    g.fillStyle = "#ff4f7b"; g.strokeStyle = INK; g.lineWidth = 12;
    g.beginPath(); g.moveTo(128, 222); g.bezierCurveTo(20, 150, 10, 60, 74, 44); g.bezierCurveTo(108, 36, 124, 62, 128, 76);
    g.bezierCurveTo(132, 62, 148, 36, 182, 44); g.bezierCurveTo(246, 60, 236, 150, 128, 222); g.fill(); g.stroke();
    g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.ellipse(84, 84, 18, 11, -0.6, 0, 7); g.fill();
  });
  const starTex = ctx(256, 256, (g) => {
    g.fillStyle = "#ffd84d"; g.strokeStyle = INK; g.lineWidth = 10; g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 46 : 112, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(128 + r * Math.cos(a), 128 + r * Math.sin(a)); }
    g.closePath(); g.fill(); g.stroke();
  });
  const bannerStack = ctx(1024, 480, (g) => {
    g.fillStyle = "#17151c"; g.fillRect(0, 0, 1024, 480);
    g.strokeStyle = "#ffd84d"; g.lineWidth = 14; g.strokeRect(16, 16, 992, 448);
    txt(g, "BLACK", 430, 150, 190, "#ffd84d", { stroke: "#e8402f", sw: 8 }); txt(g, "FRIDAY", 430, 340, 190, "#ffd84d", { stroke: "#e8402f", sw: 8 });
    g.fillStyle = "#ff3b3b"; g.beginPath(); g.arc(880, 120, 96, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = "#ffffff"; g.stroke(); txt(g, "SALE", 880, 124, 64, "#ffffff");
  });
  const banner = (big, small) => ctx(1024, 256, (g) => {
    g.fillStyle = "#17151c"; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = "#ffd84d"; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
    txt(g, big, small ? 430 : 512, 132, 118, "#ffd84d", { stroke: "#e8402f", sw: 6 });
    if (small) { g.fillStyle = "#ff3b3b"; g.beginPath(); g.arc(880, 128, 92, 0, 7); g.fill(); txt(g, small, 880, 132, 70, "#ffffff"); }
  });

  // ================================================================== MALL (today: a store's Black Friday)
  const mall = K.set("mall", { bg: "#9fd4fb", fog: ["#cfeaff", 40, 120], sunPos: [-7, 12, 9], shadow: 12 });
  K.sky(mall, { top: "#2f8ff0", mid: "#8fd0ff", bottom: "#e8f6ff", seed: 11 });
  K.box(60, 0.1, 40, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#efe9df", b: "#e2dacb", n: 4, rep: [24, 16] }), parent: mall });
  K.box(60, 0.1, 10, "#ffffff", { y: -0.09, z: 14, tex: K.ctex("asphalt", { a: "#5d6273", lane: "#ffffff", rep: [12, 2] }), parent: mall });
  K.building(16, 9, 8, { z: -8, wall: "#2fb8a8", cols: 5, rows: 3, frame: "#ffffff", glass: "#bfe8ff", band: "#1f8f84", seed: 21, parent: mall });
  K.box(16.2, 3.3, 0.3, "#1f8f84", { z: -3.95, parent: mall });
  const mallWin = K.ctex("facade", { a: "#cfeefe", cols: 1, rows: 1, glass: "#bfe8ff", frame: "#ffffff", w: 512, h: 340, seed: 4 });
  [-4.6, 4.6].forEach((x) => K.plane(5.2, 2.6, mallWin, { x, y: 1.45, z: -3.78, lit: true, basic: false, parent: mall }));
  K.box(2.4, 2.9, 0.06, "#bfe8ff", { y: 0, z: -3.78, parent: mall });
  K.box(0.12, 2.9, 0.1, "#ffffff", { y: 0, z: -3.74, parent: mall });
  const tagTex = sign(256, 256, [{ text: "-50%", size: 92, y: 132, color: "#ffffff" }], { bg: "#ff3b3b", border: "#ffffff", bw: 16 });
  [-6, -3.4, 3.4, 6].forEach((x, i) => K.plane(0.8, 0.8, tagTex, { x, y: 1.9 - (i % 2) * 0.5, z: -3.7, rz: (i % 2 ? 8 : -8), parent: mall }));
  const novTex = ctx(512, 600, (g) => {
    g.fillStyle = "#ffffff"; rrect(g, 8, 8, 496, 584, 30); g.fill(); g.lineWidth = 14; g.strokeStyle = INK; g.stroke();
    g.fillStyle = "#ff3b3b"; rrect(g, 8, 8, 496, 150, 30); g.fill(); g.fillRect(8, 100, 496, 58);
    txt(g, "NOVEMBER", 256, 88, 70, "#ffffff"); txt(g, "27", 256, 330, 250, INK); txt(g, "FRIDAY", 256, 510, 66, "#ff3b3b");
  });
  const novCard = K.plane(1.25, 1.46, novTex, { x: -4.6, y: 1.55, z: -3.68, rz: -4, parent: mall });
  K.plane(5.6, 2.62, bannerStack, { y: 4.35, z: -3.72, parent: mall });
  const balloons = [];
  [[-5.6, "#ff4f7b"], [-6.3, "#ffd23f"], [5.6, "#3ec1ff"], [6.3, "#ff8a3d"], [-5.0, "#7ad151"], [5.1, "#b48ee8"]].forEach(([x, c], i) => {
    const b = K.sphere(0.36, c, { x, y: 5.4 + (i % 3) * 0.35, z: -3.2, sy: 1.12, parent: mall });
    K.cyl(0.008, 0.008, 1.8, INK, { x, y: 3.6 + (i % 3) * 0.35, z: -3.2, parent: mall, cast: false });
    balloons.push(b);
  });
  K.tree({ x: -9.5, z: -2.6, s: 1.3, parent: mall }); K.tree({ x: 9.6, z: -2.4, s: 1.2, leaf: "#58c46a", parent: mall });
  [[-11, "#ffd23f"], [11.5, "#ff6f61"]].forEach(([x, c]) => K.car({ x, z: 12, color: c, ry: 0, parent: mall }));
  const shopCols = [["#ff5e7e", "#ffd23f", "dots"], ["#3ec1ff", "#ffffff", "stripes"], ["#ffd23f", "#ff8a3d", null], ["#7ad151", "#ffffff", "stripes"], ["#b48ee8", "#ffd23f", "dots"]];
  const shoppers = shopCols.map(([c, b, pat], i) => {
    const a = K.toon(`shopper${i}`, { outfit: c, pattern: pat ? { kind: pat, a: c, b, n: pat === "dots" ? 5 : 6 } : null, hair: ["#5a3b2a", "#e0a240", "#2a2028", "#8a4a2a", "#c25a3a"][i],
      hat: i === 2 ? "beanie" : i === 4 ? "cap" : null, hatc: "#ff5e7e", hatband: "#ffffff", h: 1.62 + (i % 2) * 0.12, x: -2.8 + i * 1.4, z: 0.6 + (i % 2) * 0.9, face: "happy", parent: mall });
    a.hold(bag(["#ff3b3b", "#ffd23f", "#3ec1ff", "#ff5e7e", "#7ad151"][i], "%"), "R", [0, 0.02, 0]);
    a.hold(bag(["#3ec1ff", "#ff8a3d", "#7ad151", "#ffd23f", "#ff3b3b"][i], "$"), "L", [0, 0.02, 0]);
    return a;
  });

  // ================================================================== STREET (Philadelphia, the 1960s)
  const st = K.set("street", { bg: "#9fd4fb", fog: ["#d6eeff", 30, 95], sunPos: [-9, 14, 10], shadow: 18 });
  K.sky(st, { top: "#3a9cf2", mid: "#97d3fb", bottom: "#eaf7ff", seed: 5 });
  K.box(90, 0.1, 90, "#ffffff", { y: -0.1, tex: K.ctex("asphalt", { a: "#5c6170", seed: 3, rep: [18, 18] }), parent: st });
  const walkT = K.ctex("tiles", { a: "#ece4d4", b: "#e0d6c2", n: 4, rep: [1, 1] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tw = K.ctex("tiles", { a: "#ece4d4", b: "#e0d6c2", n: 4, rep: [16, 3] });
    K.box(26, 0.16, 4, "#ffffff", { x: sx * 16.2, z: sz * 5.2, tex: tw, parent: st });
    K.box(26, 0.17, 0.25, "#cfc6b4", { x: sx * 16.2, z: sz * 3.3, parent: st });
  }
  void walkT;
  for (let x = -30; x <= 30; x += 3) if (Math.abs(x) > 4) K.box(1.4, 0.02, 0.16, "#f2c230", { x, z: 0, parent: st, cast: false });
  for (let k = -5; k <= 5; k++) { K.box(0.55, 0.02, 2.2, "#f4f1ea", { x: -3.9, z: k * 0.6, ry: 90, sx: 0.5, parent: st, cast: false }); K.box(0.55, 0.02, 2.2, "#f4f1ea", { x: 3.9, z: k * 0.6, ry: 90, sx: 0.5, parent: st, cast: false }); }
  // buildings: back row (z < 0) and front row (z > 0); the department store sits behind the cop
  const backRow = [[-27.5, 5.6, 11, "#f28b6c"], [-21.6, 6.2, 9, "#f4c34f"], [-16.75, 3.4, 13, "#8fdcb4"], [7.4, 6, 11, "#b48ee8"], [13.6, 6.4, 8.5, "#7cc4f2"], [20, 6.2, 13, "#f7b58a"], [26, 5.6, 9, "#f28b6c"]];
  backRow.forEach(([x, wd, ht, c], i) => K.building(wd, ht, 10, { x, z: -12.4, wall: c, cols: 3, rows: Math.round(ht / 2.6), lit: 0.15, band: "rgba(255,255,255,0.35)", seed: 30 + i, parent: st }));
  const frontRow = [[-21, 6, 10, "#7cc4f2"], [-14.6, 6, 13, "#f28b6c"], [-8.2, 6, 8, "#f4c34f"], [8.6, 6, 12, "#8fdcb4"], [15, 6.4, 9, "#f7a1c4"], [21.5, 6, 11, "#b48ee8"]];
  frontRow.forEach(([x, wd, ht, c], i) => K.building(wd, ht, 10, { x, z: 12.4, ry: 180, wall: c, cols: 3, rows: Math.round(ht / 2.6), lit: 0.15, seed: 50 + i, parent: st }));
  // the department store (generic): display windows, a striped awning, wreaths
  K.building(12, 14, 10, { x: -9.7, z: -24, wall: "#e8604c", cols: 4, rows: 4, frame: "#fff4e4", lit: 0.2, seed: 77, parent: st });
  const dept = new T3.Group(); dept.position.set(-9.7, 0, -12.4); st.add(dept);
  K.building(10.6, 9, 10, { wall: "#f2e4c4", cols: 4, rows: 3, frame: "#c4342a", glass: "#bfe3ff", ground: true, lit: 0.3, seed: 88, parent: dept });
  const winTex = ctx(512, 340, (g) => {
    g.fillStyle = "#ffe9b0"; g.fillRect(0, 0, 512, 340);
    g.fillStyle = "#2f8f4e"; g.beginPath(); g.moveTo(256, 30); g.lineTo(350, 300); g.lineTo(162, 300); g.closePath(); g.fill();
    [[110, 250, 90, 80, "#ff3b3b"], [360, 240, 100, 90, "#3ec1ff"], [300, 270, 70, 60, "#ffd23f"], [70, 280, 60, 50, "#b48ee8"]].forEach(([x, y, ww, hh, c]) => {
      g.fillStyle = c; g.fillRect(x - ww / 2, y - hh / 2, ww, hh); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(x - ww / 2, y - hh / 2, ww, hh);
      g.fillStyle = "#ffffff"; g.fillRect(x - 5, y - hh / 2, 10, hh); });
    g.fillStyle = "#ffd84d"; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(196 + (i % 3) * 60, 90 + i * 30, 8, 0, 7); g.fill(); }
    g.strokeStyle = "#c4342a"; g.lineWidth = 24; g.strokeRect(0, 0, 512, 340);
  });
  [-3.4, 0.0, 3.4].forEach((x) => K.plane(2.7, 1.9, winTex, { x, y: 1.25, z: 5.03, parent: dept }));
  K.slab(10.8, 0.25, 1.4, 0.1, "#ffffff", { y: 2.55, z: 5.6, tex: K.ctex("stripes", { cols: ["#e8402f", "#ffffff"], n: 12, vertical: true, w: 256, h: 64 }), parent: dept });
  K.plane(5.6, 0.85, sign(1024, 156, [{ text: "DEPARTMENT STORE", size: 92, y: 82, color: "#ffffff", stroke: INK, sw: 10 }], { bg: "#c4342a", border: "#ffd84d", bw: 12 }), { y: 3.4, z: 5.06, parent: dept });
  for (const x of [-4, -1.33, 1.33, 4]) { K.torus(0.42, 0.11, "#2f8f4e", { x, y: 6.0, z: 5.15, parent: dept }); K.sphere(0.12, "#e8402f", { x, y: 5.6, z: 5.3, parent: dept }); }
  // City Hall-like tower closing the cross street (simplified, generic)
  const tower = new T3.Group(); tower.position.set(0, 0, -44); st.add(tower);
  K.box(12, 12, 10, "#efe2c8", { parent: tower }); K.box(5, 14, 5, "#efe2c8", { y: 12, parent: tower }); K.cyl(2.4, 2.6, 4, "#e6d4b2", { y: 26, parent: tower });
  K.cone(2.4, 3.2, "#9cc7b4", { y: 30, parent: tower }); K.clock(1.1, { y: 22, z: 2.56, parent: tower, rim: "#c9b48a" });
  // street sign at the corner, lamps, trees, traffic lights
  const post = new T3.Group(); post.position.set(4.3, 0.16, 4.0); st.add(post);
  K.cyl(0.06, 0.06, 3.2, "#2f4858", { parent: post });
  K.plane(1.6, 0.36, sign(512, 116, [{ text: "BROAD ST", size: 70, y: 62, color: "#ffffff" }], { bg: "#2f7d4f", border: "#ffffff", bw: 8 }), { y: 3.0, z: 0.02, parent: post });
  K.plane(1.6, 0.36, sign(512, 116, [{ text: "MARKET ST", size: 66, y: 62, color: "#ffffff" }], { bg: "#2f7d4f", border: "#ffffff", bw: 8 }), { y: 2.6, x: 0.02, ry: 90, parent: post });
  [[8, -4.2], [12, 4.2], [-17, -4.2], [18, 4.2]].forEach(([x, z]) => K.lamp({ x, z, y: 0.16, parent: st }));
  [[-12, -4.6], [14, -4.6], [-13, 4.6]].forEach(([x, z], i) => K.tree({ x, z, y: 0.16, leaf: ["#4fb35a", "#62c46a", "#4aa85a"][i], parent: st }));
  const tls = [[-4.4, -3.9], [4.4, -3.9], [-4.4, 3.9]].map(([x, z]) => K.trafficLight({ x, z, y: 0.16, parent: st, on: "red" }));
  // the jam: two lanes of cars on Market, more queued down Broad
  const carCols = ["#ef6f5e", "#5ec2e8", "#f4c34f", "#8fd16a", "#f7a1c4", "#a98ef0", "#ffffff", "#ff9f43", "#45c4b0"];
  const cars = [];
  let ci = 0;
  for (const x of [-24, -19, -14, -9, -4.6]) cars.push(K.car({ x, z: -1.6, color: carCols[ci++ % 9], parent: st }));
  for (const x of [4.6, 9, 14, 19, 24]) cars.push(K.car({ x, z: 1.6, ry: 180, color: carCols[ci++ % 9], parent: st }));
  for (const x of [10.2, 15.2]) cars.push(K.car({ x, z: -1.6, color: carCols[ci++ % 9], parent: st }));
  for (const x of [-5.2, -10.2, -15.2]) cars.push(K.car({ x, z: 1.6, ry: 180, color: carCols[ci++ % 9], parent: st }));
  for (const z of [-6.5, -11.5, -16.5, -21.5]) cars.push(K.car({ x: -1.5, z, ry: -90, color: carCols[ci++ % 9], parent: st }));
  for (const z of [-8, -13, -18]) cars.push(K.car({ x: 1.5, z, ry: 90, color: carCols[ci++ % 9], parent: st }));
  for (const z of [6.5, 11.5]) cars.push(K.car({ x: 1.5, z, ry: 90, color: carCols[ci++ % 9], parent: st }));
  cars.forEach((c) => (c.userData.base = c.scale.x));
  // the cop on his podium
  K.cyl(0.62, 0.66, 0.42, "#ffffff", { tex: K.ctex("stripes", { cols: ["#e8402f", "#ffffff"], n: 10, vertical: true, w: 256, h: 64 }), parent: st });
  K.cyl(0.66, 0.66, 0.05, "#2f4858", { y: 0.42, parent: st });
  const COP = { outfit: "#2f5fc4", hat: "peaked", hatc: "#2a52a8", belt: "#1d1d26", badge: "#f2c230", glove: "#ffffff" };
  const cop = K.toon("cop", Object.assign({ y: 0.47, h: 1.72, face: "neutral", moustache: true }, COP, { parent: st }));
  const whistle = K.cyl(0.03, 0.03, 0.12, "#d9dde2", { rx: 90, center: true });
  cop.hold(whistle, "R", [0, 0.02, 0.06]);
  // sidewalk crowds: shoppers (back) and football fans (front)
  const oldShop = [["#e8473c", "beanie", "#ffffff"], ["#2fb0a0", "bowler", "#2b2b33"], ["#f4c13a", null, null], ["#9b6ce0", "fedora", "#5a3b2a"], ["#ff8a3d", "beanie", "#3ec1ff"]].map(([c, hat, hc], i) => {
    const a = K.toon(`oldshop${i}`, { outfit: c, hat, hatc: hc || "#333", hatband: "#ffffff", hair: ["#5a3b2a", "#2a2028", "#c25a3a", "#e0a240", "#5a3b2a"][i], scarf: i % 2 ? "#ffffff" : null,
      h: 1.6 + (i % 3) * 0.08, x: -2 + i * 1.5, y: 0.16, z: -5.0 + (i % 2) * 0.6, face: "happy", turn: 35, parent: st });
    a.hold(bag(["#ff3b3b", "#3ec1ff", "#7ad151", "#ffd23f", "#ff5e7e"][i]), "R");
    if (i % 2 === 0) a.hold(bag(["#ffd23f", "#ff5e7e", "#3ec1ff"][i / 2]), "L");
    return a;
  });
  const fanArmy = { outfit: "#2b2b33", pattern: { kind: "stripes", a: "#2b2b33", b: "#e8b52a", n: 6 }, scarf: "#e8b52a", hat: "beanie", hatc: "#2b2b33", hatband: "#e8b52a" };
  const fanNavy = { outfit: "#23407e", pattern: { kind: "stripes", a: "#23407e", b: "#e8b52a", n: 6 }, scarf: "#e8b52a", hat: "beanie", hatc: "#23407e", hatband: "#e8b52a" };
  const fans = [fanArmy, fanNavy, fanArmy, fanNavy].map((f, i) => K.toon(`fan${i}`, Object.assign({ h: 1.62 + (i % 2) * 0.1, x: -6 + i * 1.05, y: 0.16, z: 4.9 + (i % 2) * 0.5, face: "laugh", hair: "#5a3b2a", parent: st }, f)));
  fans[0].hold(pennant("ARMY", "#2b2b33", "#e8b52a"), "R"); fans[1].hold(pennant("NAVY", "#23407e", "#e8b52a"), "R");
  fans[2].hold(pennant("ARMY", "#2b2b33", "#e8b52a"), "L"); fans[3].hold(pennant("NAVY", "#23407e", "#e8b52a"), "L");
  const football = K.sphere(0.13, "#8a4a2a", { sx: 1, sy: 1, sz: 1.6 });
  K.box(0.02, 0.012, 0.14, "#ffffff", { y: 0.125, parent: football, center: true });
  fans[1].hold(football, "L", [0.04, 0.06, 0.05]);
  // the police band, marching between the stopped cars
  const band = [["tuba"], ["drum"], ["trumpet"]].map(([ins], i) => {
    const a = K.toon(`band${i}`, Object.assign({ h: 1.68, x: -9 - i * 1.3, z: 0, face: "determined", turn: 50 }, COP, { parent: st }));
    if (ins === "tuba") { const tb = new T3.Group(); K.torus(0.2, 0.06, "#f2c230", { parent: tb, ry: 90 }); K.cone(0.22, 0.4, "#f2c230", { y: 0.12, parent: tb, rz: 180, x: 0 }).position.y = 0.55; a.hold(tb, "both", [0, 0.05, 0.08]); a.inst = tb; }
    if (ins === "drum") { const dr = K.cyl(0.24, 0.24, 0.26, "#ffffff", { tex: K.ctex("stripes", { cols: ["#e8402f", "#ffffff"], n: 8, vertical: true, w: 256, h: 64 }), rx: 90, center: true }); a.hold(dr, "chest", [0, -0.15, 0.08]); }
    if (ins === "trumpet") { const tr = new T3.Group(); K.cyl(0.025, 0.025, 0.36, "#f2c230", { parent: tr, rx: 90, center: true }); K.cone(0.09, 0.14, "#f2c230", { parent: tr, rx: -90, z: 0.18, center: true }); a.hold(tr, "R", [0, 0.02, 0.12]); }
    return a;
  });
  // PR man with his poster, ignored (Nobody used it)
  const prSt = K.toon("pr_st", { outfit: "#8b5cf6", tie: "#ff5e9a", hair: "#2a2028", hairCut: 0.33, h: 1.74, x: 6.6, y: 0.16, z: -4.7, face: "sad", parent: st });
  const bigFridayTex = ctx(768, 512, (g) => {
    g.fillStyle = "#fff6d8"; rrect(g, 8, 8, 752, 496, 36); g.fill(); g.lineWidth = 16; g.strokeStyle = INK; g.stroke();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.strokeStyle = i % 2 ? "#ffd23f" : "#ff8a3d"; g.lineWidth = 34; g.beginPath(); g.moveTo(384 + Math.cos(a) * 120, 256 + Math.sin(a) * 120); g.lineTo(384 + Math.cos(a) * 520, 256 + Math.sin(a) * 520); g.stroke(); }
    g.fillStyle = "#fff6d8"; g.beginPath(); g.ellipse(384, 256, 330, 150, 0, 0, 7); g.fill();
    txt(g, "BIG", 384, 196, 150, "#3ec1ff", { stroke: INK, sw: 16 }); txt(g, "FRIDAY!", 384, 340, 120, "#ff5e7e", { stroke: INK, sw: 14 });
    g.lineWidth = 16; g.strokeStyle = INK; rrect(g, 8, 8, 752, 496, 36); g.stroke();
  });
  const stick = new T3.Group();
  K.cyl(0.02, 0.02, 1.3, "#c98d55", { y: -0.5, parent: stick }); K.plane(0.9, 0.6, bigFridayTex, { x: 0.12, y: 1.0, parent: stick });
  prSt.hold(stick, "L", [0, 0, 0.04]);

  // ================================================================== STATION (the police station)
  const sta = K.set("station", { bg: "#d6ecff", sunPos: [5, 9, 9], shadow: 8, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("planks", { a: "#e2a865", b: "#d39555", n: 6, rep: [3, 2] }), parent: sta });
  K.box(14, 4.2, 0.2, "#ffffff", { z: -3.1, tex: K.ctex("wallpaper", { a: "#cfe6ff", b: "#bcd9fa", n: 8, rep: [6, 2] }), parent: sta });
  K.box(14, 1.0, 0.24, "#3b6db4", { z: -3.02, parent: sta });
  K.box(0.2, 4.2, 10, "#ffffff", { x: -5.2, tex: K.ctex("wallpaper", { a: "#cfe6ff", b: "#bcd9fa", n: 8, rep: [4, 2] }), parent: sta });
  K.plane(1.6, 1.4, K.ctex("sky", { top: "#3a9cf2", bottom: "#d6f0ff", w: 256, h: 256, clouds: 3, seed: 2 }), { x: -5.08, y: 2.3, z: -0.6, ry: 90, parent: sta });
  K.box(0.12, 1.6, 1.8, "#ffffff", { x: -5.1, y: 1.5, z: -0.6, parent: sta }); K.box(0.16, 1.4, 0.08, "#ffffff", { x: -5.06, y: 1.6, z: -0.6, parent: sta });
  const boardFrame = K.box(3.2, 2.0, 0.12, "#a8693a", { x: -1.4, y: 1.15, z: -2.95, parent: sta });
  void boardFrame;
  const dutyTex = ctx(1024, 600, (g) => {
    g.fillStyle = "#2f5e48"; g.fillRect(0, 0, 1024, 600);
    g.globalAlpha = 0.08; g.fillStyle = "#ffffff"; for (let i = 0; i < 30; i++) g.fillRect(i * 37 % 1024, (i * 91) % 600, 120, 8); g.globalAlpha = 1;
    txt(g, "DAY AFTER THANKSGIVING", 512, 110, 62, "#ffffff", { font: CHALK, weight: 700 });
    txt(g, "ALL TRAFFIC MEN ON DUTY", 512, 230, 62, "#ffffff", { font: CHALK, weight: 700 });
    txt(g, "NO DAYS OFF!", 512, 420, 128, "#ffd84d", { font: CHALK, weight: 700 });
    g.strokeStyle = "#ff7a6b"; g.lineWidth = 12; g.beginPath(); g.moveTo(180, 510); g.quadraticCurveTo(512, 540, 850, 500); g.stroke();
  });
  const blankBoard = ctx(1024, 600, (g) => { g.fillStyle = "#2f5e48"; g.fillRect(0, 0, 1024, 600); g.globalAlpha = 0.1; g.fillStyle = "#fff"; for (let i = 0; i < 30; i++) g.fillRect(i * 41 % 1024, (i * 73) % 600, 140, 10); });
  const bfChalk = ctx(1024, 600, (g) => { g.clearRect(0, 0, 1024, 600); txt(g, "BLACK", 512, 200, 200, "#ffffff", { font: CHALK, weight: 700 }); txt(g, "FRIDAY", 512, 430, 200, "#ffffff", { font: CHALK, weight: 700 }); });
  const duty = K.plane(3.0, 1.76, dutyTex, { x: -1.4, y: 2.15, z: -2.88, parent: sta });
  const blank = K.plane(3.0, 1.76, blankBoard, { x: -1.4, y: 2.15, z: -2.88, parent: sta });
  const chalk = revealer(2.8, 1.64, bfChalk, { x: -1.4, y: 2.15, z: -2.86, parent: sta });
  // tear-off day calendar: THURSDAY (Thanksgiving) flips up to reveal FRIDAY
  const thuTex = ctx(512, 640, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 640); g.fillStyle = "#e8604c"; g.fillRect(0, 0, 512, 150);
    txt(g, "NOVEMBER", 256, 80, 66, "#ffffff"); txt(g, "THURSDAY", 256, 230, 70, INK);
    g.fillStyle = "#b8703f"; g.beginPath(); g.ellipse(256, 410, 120, 90, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    [["#ff8a3d", -1.0], ["#ffd23f", -0.5], ["#e8402f", 0], ["#ffd23f", 0.5], ["#ff8a3d", 1.0]].forEach(([c, a]) => { g.fillStyle = c; g.beginPath(); g.ellipse(256 + Math.sin(a) * 130, 330 - Math.cos(a) * 60, 34, 70, a, 0, 7); g.fill(); g.stroke(); });
    g.fillStyle = "#b8703f"; g.beginPath(); g.arc(256, 380, 52, 0, 7); g.fill(); g.stroke();
    txt(g, "Thanksgiving", 256, 560, 56, "#b8703f", { font: SERIF, weight: 700 });
  });
  const friTex = ctx(512, 640, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 640); g.fillStyle = "#e8604c"; g.fillRect(0, 0, 512, 150);
    txt(g, "NOVEMBER", 256, 80, 66, "#ffffff"); txt(g, "FRIDAY", 256, 330, 120, INK);
    g.strokeStyle = "#ff3b3b"; g.lineWidth = 14; g.beginPath(); g.ellipse(256, 330, 220, 110, -0.05, 0, 7); g.stroke();
    txt(g, "!!!", 256, 520, 110, "#ff3b3b");
  });
  K.box(1.2, 1.5, 0.08, "#a8693a", { x: 2.4, y: 1.45, z: -2.96, parent: sta });
  K.plane(1.05, 1.31, friTex, { x: 2.4, y: 2.2, z: -2.9, parent: sta });
  const thuPivot = new T3.Group(); thuPivot.position.set(2.4, 2.855, -2.88); sta.add(thuPivot);
  K.plane(1.05, 1.31, thuTex, { y: -0.655, parent: thuPivot });
  // the cops: a sergeant at the board, one with a fishing rod (no day off), two slumped on the bench
  const sarge = K.toon("sarge", Object.assign({ h: 1.76, x: 0.6, z: -1.5, face: "determined", moustache: true, turn: -10 }, COP, { parent: sta }));
  const fisher = K.toon("fisher", Object.assign({ h: 1.7, x: -2.0, z: -0.6, face: "sad", turn: 15 }, COP, { parent: sta }));
  const rod = new T3.Group(); K.cyl(0.012, 0.02, 1.9, "#8a5a3a", { parent: rod, rz: -18 }); K.cyl(0.05, 0.05, 0.06, "#d9dde2", { y: 0.2, x: 0.1, rx: 90, center: true, parent: rod });
  fisher.hold(rod, "L", [0, -0.2, 0]);
  const tackle = K.box(0.4, 0.24, 0.24, "#3fa66a", { x: -2.55, z: -0.5, parent: sta });
  void tackle;
  K.box(2.6, 0.08, 0.6, "#a8693a", { x: 2.2, y: 0.46, z: -2.2, parent: sta });
  for (const x of [1.1, 3.3]) K.box(0.1, 0.46, 0.5, "#7a4a2a", { x, z: -2.2, parent: sta });
  const benchCops = [0, 1].map((i) => K.toon(`bench${i}`, Object.assign({ h: 1.7, x: 1.6 + i * 1.2, z: -2.0, y: 0.17, face: "tired" }, COP, { moustache: i === 1, parent: sta })));
  const writer = K.toon("writer", Object.assign({ h: 1.72, x: 0.6, z: -2.2, face: "tired", turn: -30 }, COP, { parent: sta }));
  const chalkStick = K.box(0.03, 0.03, 0.1, "#ffffff", { center: true });
  writer.hold(chalkStick, "R");

  // ================================================================== OFFICE (city office: a nicer name)
  const off = K.set("office", { bg: "#d6f0e6", sunPos: [-4, 9, 9], shadow: 8, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#f2e6cf", b: "#e6d6b6", n: 4, rep: [7, 5] }), parent: off });
  K.box(14, 4.4, 0.2, "#ffffff", { z: -3.1, tex: K.ctex("wallpaper", { a: "#c8efdc", b: "#b2e4cc", n: 8, rep: [6, 2] }), parent: off });
  K.box(14, 1.0, 0.24, "#2f9a6e", { z: -3.02, parent: off });
  K.plane(2.0, 1.6, K.ctex("sky", { top: "#3a9cf2", bottom: "#d6f0ff", w: 256, h: 256, clouds: 3, seed: 9 }), { x: -2.6, y: 2.5, z: -2.98, parent: off });
  K.box(2.2, 0.12, 0.2, "#ffffff", { x: -2.6, y: 1.64, z: -2.92, parent: off }); K.box(0.1, 1.6, 0.08, "#ffffff", { x: -2.6, y: 1.7, z: -2.94, parent: off });
  K.plane(1.0, 0.8, sign(256, 200, [{ text: "CITY", size: 60, y: 100, color: "#2f9a6e" }], { bg: "#fff8e8", border: "#a8693a", bw: 18 }), { x: 0.6, y: 2.7, z: -2.98, parent: off });
  K.slab(3.0, 0.12, 1.3, 0.05, "#a8693a", { x: -1.2, y: 0.86, z: -0.9, parent: off });
  for (const [x, z] of [[-2.55, -1.4], [0.15, -1.4], [-2.55, -0.4], [0.15, -0.4]]) K.box(0.1, 0.86, 0.1, "#7a4a2a", { x, z, parent: off });
  const paperTex = (head, sub, year) => ctx(512, 680, (g) => {
    g.fillStyle = "#f6f1e4"; g.fillRect(0, 0, 512, 680); g.fillStyle = INK; g.fillRect(24, 96, 464, 6);
    txt(g, "THE MORNING PAPER", 256, 58, 44, INK, { font: SERIF });
    if (year) txt(g, year, 256, 124, 26, "#555", { font: SERIF, weight: 700 });
    head.forEach((h, i) => txt(g, h, 256, 200 + i * 92, h.length > 9 ? 70 : 92, INK));
    if (sub) txt(g, sub, 256, 200 + head.length * 92, 34, "#444", { font: SERIF, weight: 700 });
    g.fillStyle = "#cfc8b8"; g.fillRect(40, 420 + (head.length - 2) * 20, 200, 200);
    g.fillStyle = "#9a9284"; for (let i = 0; i < 9; i++) { g.fillRect(270, 430 + i * 22 + (head.length - 2) * 20, 200, 8); }
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(40, 420 + (head.length - 2) * 20, 200, 200);
  });
  K.plane(0.5, 0.66, paperTex(["BLACK", "FRIDAY"], "Traffic jams downtown"), { x: -1.0, y: 0.93, z: -0.7, rx: -90, rz: 10, parent: off });
  const officials = [["#6b7a8f", "bowler", "#2b2b33", true], ["#3d5a99", "fedora", "#4a3424", false]].map(([c, hat, hc, m], i) =>
    K.toon(`official${i}`, { outfit: c, tie: "#c4342a", hat, hatc: hc, moustache: m, h: 1.74, x: -2.2 + i * 1.6, z: -1.9, face: "angry", parent: off }));
  const merchant = K.toon("merchant", { outfit: "#e8604c", apron: "#ffffff", hair: "#7a5a3a", h: 1.66, x: -1.0, z: -2.2, face: "angry", moustache: true, parent: off });
  const prOff = K.toon("pr_off", { outfit: "#8b5cf6", tie: "#ff5e9a", hair: "#2a2028", hairCut: 0.33, h: 1.76, x: 1.6, z: -0.6, face: "smug", turn: -25, parent: off });
  const easel = new T3.Group(); easel.position.set(2.9, 0, -1.6); off.add(easel);
  [[-0.5, 12], [0.5, -12]].forEach(([x, rz]) => K.cyl(0.03, 0.03, 2.4, "#a8693a", { x, rz, parent: easel }));
  K.cyl(0.03, 0.03, 2.3, "#a8693a", { z: -0.5, rx: -14, parent: easel });
  K.box(1.4, 0.06, 0.16, "#a8693a", { y: 0.95, z: 0.06, parent: easel });
  const posterBig = K.plane(1.35, 0.9, bigFridayTex, { y: 1.5, z: 0.1, parent: easel });
  const profitTex = ctx(768, 512, (g) => {
    g.fillStyle = "#17151c"; rrect(g, 8, 8, 752, 496, 36); g.fill(); g.lineWidth = 16; g.strokeStyle = "#ffd84d"; g.stroke();
    txt(g, "BLACK FRIDAY", 384, 170, 104, "#ffd84d", { stroke: "#e8402f", sw: 8 });
    txt(g, "= PROFIT DAY!", 384, 320, 90, "#ffffff");
    g.fillStyle = "#3ddc6a"; g.beginPath(); g.moveTo(130, 440); g.lineTo(300, 400); g.lineTo(420, 430); g.lineTo(640, 360); g.lineTo(640, 380); g.lineTo(420, 450); g.lineTo(300, 420); g.lineTo(130, 460); g.fill();
  });
  const posterProfit = K.plane(1.35, 0.9, profitTex, { y: 1.5, z: 0.1, parent: easel });
  const cloth = K.box(1.5, 1.05, 0.1, "#e8402f", { y: 0.98, z: 0.17, parent: easel });
  const stampTex = ctx(512, 200, (g) => { g.fillStyle = "#ffffff"; rrect(g, 12, 12, 488, 176, 20); g.fill(); g.strokeStyle = "#e8402f"; g.lineWidth = 16; g.stroke(); txt(g, "REBRAND", 256, 104, 104, "#e8402f"); });
  const stamp = K.plane(0.82, 0.32, stampTex, { x: 0.1, y: 1.24, z: 0.14, rz: -10, parent: easel });
  const stars = [[-0.85, 2.3], [0.85, 2.2], [-0.95, 1.2], [0.9, 1.0], [0, 2.5]].map(([x, y]) => K.plane(0.34, 0.34, starTex, { x, y, z: 0.2, parent: easel }));
  const bin = K.cyl(0.26, 0.21, 0.55, "#7c8796", { x: 3.75, z: -1.1, open: true, parent: off, mat: { side: T3.DoubleSide } });
  void bin;
  const crumple = K.ico(0.2, "#fff6d8", { x: 3.75, y: 0.62, z: -1.1, detail: 0, parent: off });
  const prShow = new T3.Vector3();
  void prShow;

  // ================================================================== NEWSROOM (reporters + the newspapers)
  const nr = K.set("newsroom", { bg: "#fff1d6", sunPos: [5, 9, 9], shadow: 8, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#d8e8f5", b: "#c4d8ea", n: 4, rep: [7, 5] }), parent: nr });
  K.box(14, 4.4, 0.2, "#ffffff", { z: -3.1, tex: K.ctex("wallpaper", { a: "#ffe9c6", b: "#ffdcae", n: 8, rep: [6, 2] }), parent: nr });
  K.box(14, 1.0, 0.24, "#e8904c", { z: -3.02, parent: nr });
  [-3.2, 2.8].forEach((x, i) => K.plane(1.8, 1.4, K.ctex("sky", { top: "#3a9cf2", bottom: "#d6f0ff", w: 256, h: 256, clouds: 2, seed: 13 + i }), { x, y: 2.6, z: -2.98, parent: nr }));
  K.plane(1.6, 0.5, sign(512, 160, [{ text: "NEWSROOM", size: 80, y: 84, color: "#ffffff" }], { bg: "#2f5fc4", border: "#ffffff", bw: 10 }), { x: -0.2, y: 3.3, z: -2.98, parent: nr });
  function desk(x, z, p) {
    const g = new T3.Group(); g.position.set(x, 0, z); nr.add(g);
    K.slab(1.7, 0.1, 0.9, 0.04, "#a8693a", { y: 0.82, parent: g });
    for (const [dx, dz] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) K.box(0.08, 0.82, 0.08, "#7a4a2a", { x: dx, z: dz, parent: g });
    const tw = new T3.Group(); tw.position.set(p || 0, 0.92, 0.0); tw.rotation.y = Math.PI; g.add(tw);
    K.slab(0.62, 0.2, 0.46, 0.06, "#3f8a5c", { parent: tw });
    K.box(0.56, 0.06, 0.2, "#2b2b33", { y: 0.12, z: 0.16, rx: 12, parent: tw });
    K.cyl(0.05, 0.05, 0.7, INK, { y: 0.24, z: -0.12, rz: 90, center: true, parent: tw });
    K.plane(0.36, 0.36, "#ffffff", { x: p || 0, y: 1.34, z: 0.13, rx: -12, parent: g, mat: { basic: true } });
    K.box(0.5, 0.06, 0.6, "#f6f1e4", { x: -0.62, y: 0.88, parent: g });
    return { g, tw };
  }
  const d1 = desk(-0.9, -0.6, 0), d2 = desk(1.6, -1.8, 0);
  const typed = ctx(512, 160, (g) => { g.clearRect(0, 0, 512, 160); txt(g, "BLACK FRIDAY", 256, 84, 66, INK, { font: '"Courier New", monospace', weight: 900 }); });
  const typeLabel = revealer(0.33, 0.1, typed, { x: -0.9, y: 1.4, z: -0.465, rx: -12, parent: nr });
  const reporters = [[d1, -0.9, -1.3, "#c9a46a"], [d2, 1.6, -2.5, "#7a8fa6"]].map(([dk, x, z, c], i) =>
    K.toon(`reporter${i}`, { outfit: c, tie: i ? "#e8402f" : "#2f5fc4", hat: "fedora", hatc: i ? "#4a5a6a" : "#7a5a3a", press: true, h: 1.7, x, z, face: "determined", parent: nr }));
  K.cyl(0.22, 0.26, 0.16, "#ffd23f", { x: -0.2, y: 3.6, z: -0.6, open: true, parent: nr, mat: { side: T3.DoubleSide } });
  // the 1981 newspaper (spins in) and, on its back, the 1960s photo
  const news81 = paperTex(["BLACK FRIDAY", "= PROFIT DAY?"], "Stores go from red to black", "NOVEMBER 1981");
  const photoTex = ctx(512, 680, (g) => {
    g.fillStyle = "#efe2c4"; g.fillRect(0, 0, 512, 680);
    g.fillStyle = "#c9b48a"; g.fillRect(36, 40, 440, 520);
    g.fillStyle = "#9c855c"; [[50, 120, 90, 300], [150, 70, 110, 350], [270, 140, 90, 280], [370, 90, 96, 330]].forEach(([x, y, ww, hh]) => g.fillRect(x, y, ww, hh));
    g.fillStyle = "#7a6544"; g.fillRect(36, 420, 440, 140);
    [[60, 440], [190, 470], [320, 445], [110, 500], [360, 500]].forEach(([x, y]) => { g.fillStyle = "#5c4a32"; rrect(g, x, y, 110, 40, 14); g.fill(); g.beginPath(); g.arc(x + 25, y + 42, 12, 0, 7); g.arc(x + 85, y + 42, 12, 0, 7); g.fill(); });
    g.fillStyle = "#4a3a26"; g.fillRect(244, 380, 24, 60); g.beginPath(); g.arc(256, 362, 22, 0, 7); g.fill(); g.fillRect(232, 336, 48, 10);
    g.strokeStyle = "#4a3a26"; g.lineWidth = 8; g.beginPath(); g.moveTo(244, 392); g.lineTo(206, 360); g.moveTo(268, 392); g.lineTo(306, 404); g.stroke();
    txt(g, "PHILADELPHIA · 1960s", 256, 612, 40, "#5c4a32", { font: SERIF });
  });
  const newsCard = new T3.Group(); nr.add(newsCard);
  K.plane(1.2, 1.6, news81, { parent: newsCard, mat: { side: T3.FrontSide } });
  K.plane(1.2, 1.6, photoTex, { parent: newsCard, ry: 180, mat: { side: T3.FrontSide } });

  // ================================================================== DOME (twenty years: a Philadelphia thing)
  const dm = K.set("dome", { bg: "#ffe9c6", sunPos: [4, 9, 8], shadow: 6, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("planks", { a: "#d89a5c", b: "#c98a4c", n: 6, rep: [3, 2] }), parent: dm });
  K.box(14, 5, 0.2, "#ffffff", { z: -2.6, tex: K.ctex("wallpaper", { a: "#ffd9e4", b: "#ffc8d8", n: 8, rep: [6, 2] }), parent: dm });
  K.slab(5.6, 0.16, 2.6, 0.06, "#a8693a", { y: 0.9, z: -0.6, parent: dm });
  K.box(5.2, 0.9, 2.2, "#8a5a3a", { z: -0.6, parent: dm });
  const dio = new T3.Group(); dio.position.set(-0.6, 1.06, -0.5); dm.add(dio);
  K.cyl(1.25, 1.32, 0.32, "#7a4a2a", { parent: dio });
  K.plane(1.1, 0.24, sign(512, 112, [{ text: "PHILADELPHIA", size: 62, y: 60, color: "#ffd84d" }], { bg: "#3b2a1a", border: "#ffd84d", bw: 6 }), { y: 0.16, z: 1.33, parent: dio });
  K.cyl(1.2, 1.2, 0.02, "#5c6170", { y: 0.32, parent: dio });
  K.box(2.3, 0.01, 0.06, "#f2c230", { y: 0.335, parent: dio, cast: false });
  [[-0.7, -0.75, "#f28b6c", 0.9], [0.0, -0.95, "#f4c34f", 1.2], [0.7, -0.75, "#8fdcb4", 0.8], [-0.95, -0.15, "#b48ee8", 0.6], [0.95, -0.2, "#7cc4f2", 0.7]].forEach(([x, z, c, h], i) =>
    K.building(0.42, h, 0.42, { x, z, y: 0.33, wall: c, cols: 2, rows: 3, seed: 90 + i, parent: dio }));
  const miniCars = [];
  [[-0.75, 0.1, 0], [-0.32, 0.1, 0], [0.42, -0.1, 180], [0.85, -0.1, 180], [-0.1, 0.62, -90], [0.1, -0.55, 90]].forEach(([x, z, ry], i) => miniCars.push(K.car({ x, z, y: 0.33, ry, s: 0.09, color: carCols[i], parent: dio })));
  K.cyl(0.07, 0.07, 0.04, "#e8402f", { y: 0.33, parent: dio });
  const miniCop = K.toon("minicop", Object.assign({ h: 0.24, y: 0.37, face: "dread" }, COP, { parent: dio }));
  const glass = new T3.Mesh(new T3.SphereGeometry(1.24, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new T3.MeshBasicMaterial({ color: "#dff4ff", transparent: true, opacity: 0.16, depthWrite: false }));
  glass.position.y = 0.32; glass.userData.nmat = K.inkless;
  dio.add(glass);
  const shine = K.plane(0.14, 0.9, "#ffffff", { x: -0.62, y: 1.0, z: 0.9, rz: 28, mat: { basic: true, transparent: true, opacity: 0.5 }, noink: true, parent: dio });
  void shine;
  const yearTex = {};
  for (let y = 1961; y <= 1985; y++) yearTex[y] = sign(512, 400, [{ text: "YEAR", size: 56, y: 70, color: "#ffffff" }, { text: String(y), size: 170, y: 250, color: INK }], { bg: "#ffffff" });
  const calStand = new T3.Group(); calStand.position.set(1.75, 0.98, -0.3); calStand.rotation.y = -0.35; dm.add(calStand);
  K.box(0.9, 0.08, 0.5, "#2f5fc4", { parent: calStand });
  K.box(0.86, 0.12, 0.1, "#e8402f", { y: 0.66, z: -0.05, parent: calStand });
  const deskCal = K.plane(0.82, 0.64, yearTex[1961], { y: 0.38, z: -0.04, rx: -6, parent: calStand });
  const flipPage = new T3.Group(); flipPage.position.set(0, 0.7, -0.03); calStand.add(flipPage);
  const flipCard = K.plane(0.82, 0.64, yearTex[1961], { y: -0.32, parent: flipPage });

  // ================================================================== SHOP80 (red ink to black)
  const sh = K.set("shop80", { bg: "#ffd9b8", sunPos: [-4, 9, 9], shadow: 8, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#ffffff", b: "#ff6f61", n: 4, rep: [7, 5] }), parent: sh });
  K.box(14, 4.4, 0.2, "#ffffff", { z: -3.1, tex: K.ctex("wallpaper", { a: "#ffd2a8", b: "#ffc28e", n: 8, rep: [6, 2] }), parent: sh });
  for (const y of [1.2, 2.0, 2.8]) {
    K.box(5.2, 0.08, 0.5, "#a8693a", { x: -0.4, y, z: -2.75, parent: sh });
    for (let i = 0; i < 9; i++) K.box(0.36 + (i % 3) * 0.08, 0.36 + (i % 2) * 0.16, 0.3, ["#3ec1ff", "#ffd23f", "#7ad151", "#ff5e7e", "#b48ee8", "#ff8a3d"][(i + y * 10) % 6], { x: -2.6 + i * 0.55, y: y + 0.04, z: -2.7, parent: sh });
  }
  K.slab(3.6, 1.0, 0.9, 0.08, "#2f5fc4", { x: -0.4, z: 0.2, parent: sh });
  K.slab(3.8, 0.08, 1.0, 0.04, "#f6f1e4", { x: -0.4, y: 1.0, z: 0.2, parent: sh });
  const reg = new T3.Group(); reg.position.set(-1.6, 1.08, 0.1); sh.add(reg);
  K.slab(0.7, 0.36, 0.5, 0.06, "#c9ced6", { parent: reg }); K.box(0.6, 0.22, 0.3, "#9aa2ad", { y: 0.36, z: -0.05, rx: -18, parent: reg });
  K.plane(0.3, 0.12, sign(256, 100, [{ text: "$ 0.00", size: 54, y: 52, color: "#3ddc6a" }], { bg: "#14261c" }), { y: 0.62, z: -0.12, parent: reg });
  const owner = K.toon("owner", { outfit: "#e85d4a", apron: "#ffffff", hair: "#7a5a3a", moustache: true, h: 1.74, x: -0.2, z: -0.7, face: "worried", parent: sh });
  // the ledger: left page, right page (red), a page that turns to show black
  const ledger = new T3.Group(); ledger.position.set(0.25, 1.09, 0.35); ledger.rotation.y = -0.12; sh.add(ledger);
  K.slab(1.12, 0.04, 0.78, 0.03, "#7a2f2a", { parent: ledger });
  const ledgerPage = (rows, color, total) => ctx(400, 560, (g) => {
    g.fillStyle = "#fbf6e6"; g.fillRect(0, 0, 400, 560);
    g.strokeStyle = "#9cc3e6"; g.lineWidth = 3; for (let y = 90; y < 560; y += 46) { g.beginPath(); g.moveTo(16, y); g.lineTo(384, y); g.stroke(); }
    g.strokeStyle = "#ff8a8a"; g.beginPath(); g.moveTo(60, 0); g.lineTo(60, 560); g.stroke();
    rows.forEach((r, i) => txt(g, r, 232, 116 + i * 46, 44, color, { font: '"Courier New", monospace', weight: 900 }));
    if (total) { g.fillStyle = color; g.fillRect(80, 466, 300, 7); txt(g, total, 232, 514, 60, color, { font: '"Courier New", monospace', weight: 900 }); }
  });
  const pageL = ledgerPage(["120.00", "85.50", "210.00", "64.25", "98.00", "155.75", "47.00"], "#3a3a44");
  const pageRed = ledgerPage(["(310)", "(275)", "(420)", "(198)", "(305)", "(260)"], "#e8402f", "(1,768)");
  const pageBlack = ledgerPage(["1,240", "2,315", "3,880", "4,210", "5,105", "6,020"], "#17151c", "22,770");
  K.plane(0.52, 0.72, pageL, { x: -0.27, y: 0.064, rx: -90, parent: ledger });
  K.plane(0.52, 0.72, pageBlack, { x: 0.27, y: 0.064, rx: -90, parent: ledger });
  const turn = new T3.Group(); turn.position.y = 0.072; ledger.add(turn);
  K.plane(0.52, 0.72, pageRed, { x: 0.27, rx: -90, parent: turn });
  K.plane(0.52, 0.72, pageL, { x: 0.27, rx: -90, ry: 180, y: -0.002, parent: turn });
  // the chart: red bars down (losses), black bars up (profit)
  const chart = new T3.Group(); chart.position.set(2.4, 0, -0.6); chart.rotation.y = -0.3; sh.add(chart);
  K.box(2.2, 3.2, 0.1, "#ffffff", { y: 0.2, parent: chart });
  K.box(2.0, 0.04, 0.14, INK, { y: 1.75, z: 0.02, parent: chart });
  const bars = [0, 1, 2, 3, 4].map((i) => K.box(0.28, 1, 0.16, i < 3 ? "#e8402f" : "#17151c", { x: -0.72 + i * 0.36, y: 1.75, z: 0.06, parent: chart }));
  K.plane(1.8, 0.3, sign(512, 90, [{ text: "LOSS → PROFIT", size: 56, y: 48, color: INK }], { bg: "#ffffff" }), { y: 3.1, z: 0.06, parent: chart });

  // ================================================================== AVENUE (stores loved it: it spreads)
  const av = K.set("avenue", { bg: "#9fd4fb", fog: ["#dff1ff", 25, 90], sunPos: [8, 12, 10], shadow: 16 });
  K.sky(av, { top: "#3a9cf2", mid: "#97d3fb", bottom: "#eaf7ff", seed: 17 });
  K.box(30, 0.1, 140, "#ffffff", { y: -0.1, z: -50, tex: K.ctex("asphalt", { a: "#5c6170", lane: "#f2c230", seed: 8, rep: [2, 24] }), parent: av });
  for (const sx of [-1, 1]) K.box(3, 0.16, 140, "#ffffff", { x: sx * 4.6, z: -50, tex: K.ctex("tiles", { a: "#ece4d4", b: "#e0d6c2", n: 4, rep: [2, 70] }), parent: av });
  const avBanners = [];
  const storeCols = ["#ff8a65", "#ffd54f", "#4dd0b8", "#b39ddb", "#64b5f6", "#f48fb1", "#aed581", "#ffb74d"];
  for (let k = 0; k < 11; k++) for (const sx of [-1, 1]) {
    const z = 2 - k * 6.2 - (sx > 0 ? 3.1 : 0), c = storeCols[(k * 2 + (sx > 0 ? 1 : 0)) % storeCols.length];
    const g = new T3.Group(); g.position.set(sx * 8.6, 0, z); g.rotation.y = -sx * Math.PI / 2; av.add(g);
    K.building(6, 6.5 + (k % 3) * 1.5, 5, { wall: c, cols: 3, rows: 2, ground: true, frame: "#ffffff", seed: 100 + k * 2 + (sx > 0), parent: g });
    K.box(4.6, 2.2, 0.08, "#bfe8ff", { y: 0.15, z: 2.52, parent: g });
    K.slab(5.4, 0.2, 1.1, 0.08, "#ffffff", { y: 2.5, z: 3.0, tex: K.ctex("stripes", { cols: [k % 2 ? "#e8402f" : "#2f5fc4", "#ffffff"], n: 10, vertical: true, w: 256, h: 64 }), parent: g });
    avBanners.push({ m: K.plane(4.4, 0.85, banner("BLACK FRIDAY"), { y: 3.4, z: 2.56, parent: g }), k, sx });
  }
  const hangers = [["#e85d4a", true], ["#2fb0a0", false]].map(([c, m], i) => K.toon(`hanger${i}`, { outfit: c, apron: "#ffffff", hair: "#5a3b2a", moustache: m, h: 1.7, x: -2.4 + i * 2.2, z: -1.2, y: 0, face: "happy", parent: av }));
  const heldBanner = K.plane(2.0, 0.42, banner("BLACK FRIDAY"), { x: -1.3, y: 1.05, z: -0.85, parent: av });
  const hearts = [0, 1, 2, 3, 4].map((i) => K.plane(0.4, 0.4, heartTex, { x: -2.6 + i * 0.65, y: 2.4, z: -1.0, parent: av }));

  // ================================================================== TOWNS (1985: Los Angeles, Cincinnati)
  const tw = K.set("towns", { bg: "#9fd4fb", fog: ["#ffe9cf", 30, 90], sunPos: [6, 12, 9], shadow: 12 });
  K.sky(tw, { top: "#2f9af2", mid: "#9ad8ff", bottom: "#fff1dc", seed: 23 });
  K.box(140, 0.1, 40, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#f3e7d3", b: "#e8d8bd", n: 4, rep: [70, 20] }), parent: tw });
  function shopFront(x, o) {
    const g = new T3.Group(); g.position.set(x, 0, -4); tw.add(g);
    K.building(9, 6, 6, { wall: o.wall, cols: 3, rows: 2, ground: true, frame: o.frame || "#ffffff", seed: o.seed, parent: g });
    K.box(3.0, 2.2, 0.08, "#bfe8ff", { x: -2.2, y: 0.2, z: 3.02, parent: g }); K.box(3.0, 2.2, 0.08, "#bfe8ff", { x: 2.2, y: 0.2, z: 3.02, parent: g });
    K.box(1.4, 2.4, 0.08, o.door, { y: 0, z: 3.02, parent: g });
    const lines = o.name.split("|");
    const tx = lines.length > 1 ? sign(768, 384, lines.map((l, i) => ({ text: l, size: 150, y: 112 + i * 164, color: "#ffffff", stroke: INK, sw: 12 })), { bg: o.signBg, border: "#ffffff", bw: 14 })
      : sign(1024, 256, [{ text: o.name, size: 122, y: 134, color: "#ffffff", stroke: INK, sw: 12 }], { bg: o.signBg, border: "#ffffff", bw: 14 });
    K.plane(lines.length > 1 ? 3.4 : 4.2, lines.length > 1 ? 1.7 : 1.05, tx, { y: lines.length > 1 ? 4.0 : 3.6, z: 3.06, parent: g });
    return g;
  }
  shopFront(0, { wall: "#ffb3c7", signBg: "#ff6f91", door: "#2fb8a8", name: "LOS|ANGELES", seed: 140 });
  shopFront(60, { wall: "#ffffff", signBg: "#2f5fc4", door: "#e8604c", name: "CINCINNATI", seed: 150 });
  K.box(9, 6, 0.01, "#ffffff", { x: 60, z: -0.992, tex: K.ctex("brick", { a: "#c8553d", b: "#b44a34", n: 14, rep: [3, 2] }), parent: tw, cast: false });
  function palm(x, z, s) {
    const g = new T3.Group(); g.position.set(x, 0, z); g.scale.setScalar(s || 1); tw.add(g);
    for (let i = 0; i < 6; i++) K.cyl(0.16 - i * 0.012, 0.18 - i * 0.012, 0.9, "#b9844f", { y: i * 0.88, x: Math.sin(i * 0.5) * 0.12 * i, parent: g });
    for (let k = 0; k < 7; k++) K.cone(0.22, 1.9, "#3fae5a", { y: 5.3, x: 0.4 + Math.sin(2.5) * 0, rz: 70 + (k % 2) * 12, ry: k * 51, parent: g, sx: 1, sz: 0.4 });
    return g;
  }
  palm(-5.6, -0.6, 1.0); palm(5.8, -0.4, 1.12); palm(-8.8, -2.5, 0.9);
  K.lamp({ x: 55.6, z: -0.4, parent: tw }); K.lamp({ x: 64.4, z: -0.4, parent: tw }); K.tree({ x: 66.5, z: -1.2, leaf: "#e8913c", parent: tw }); K.tree({ x: 53.5, z: -1.4, leaf: "#d9632f", parent: tw });
  const cal85 = K.plane(0.9, 0.7, yearTex[1985], { x: -2.2, y: 1.6, z: -0.86, parent: tw });
  void cal85;
  const laOwner = K.toon("la_owner", { outfit: "#ff8a3d", pattern: { kind: "dots", a: "#ff8a3d", b: "#ffe066", n: 5 }, hair: "#2a2028", h: 1.72, x: 0.6, z: 0.4, face: "confused", parent: tw });
  const ciOwner = K.toon("ci_owner", { outfit: "#4a7bd0", pattern: { kind: "stripes", a: "#4a7bd0", b: "#ffffff", n: 6 }, hat: "cap", hatc: "#e8402f", hair: "#7a5a3a", moustache: true, h: 1.72, x: 60.4, z: 0.4, face: "confused", parent: tw });
  const qTex = bubble("?");
  const qLA = K.plane(0.62, 0.62, qTex, { x: 1.1, y: 2.35, z: 0.5, parent: tw });
  const qCI = K.plane(0.62, 0.62, qTex, { x: 60.9, y: 2.35, z: 0.5, parent: tw });
  const radio = new T3.Group(); K.slab(0.5, 0.3, 0.16, 0.05, "#e8402f", { parent: radio }); K.cyl(0.08, 0.08, 0.02, "#d9dde2", { x: -0.12, y: 0.15, z: 0.08, rx: 90, center: true, parent: radio });
  void radio;

  // ================================================================== SHOTS
  const T = (l, wd, k, d) => w(l, wd, k) - (d == null ? 0.06 : d);
  const S = [];
  const add = (s) => S.push(s);
  const honk = (t, list, every) => list.forEach((c, i) => { const ph = (t * 1.0 + i * 0.37) % (every || 1.3); const k = ph < 0.18 ? Math.sin(ph / 0.18 * Math.PI) : 0; c.scale.set(c.userData.base * (1 + 0.06 * k), c.userData.base * (1 - 0.05 * k), c.userData.base * (1 + 0.06 * k)); });

  // l01 hook: today's shoppers love it ...
  add({ t0: 0, set: "mall", fov: 56, cam: [[0.8, 0.9, 9.4], [0.4, 1.1, 8.0]], look: [[0, 2.9, -3.5], [0, 3.0, -3.5]], fn(t) {
    shoppers.forEach((a, i) => { a.pose("cheer", t + i * 0.13); a.set(i % 2 ? "laugh" : "happy"); a.st.bob = Math.abs(Math.sin(t * 7 + i)) * 0.06; a.update(); });
  } });
  // ... but the name came from cops who dreaded it
  add({ t0: T("l01", "but"), set: "street", fov: 50, cam: [[3.6, 5.0, 15], [1.4, 2.2, 3.4]], look: [[0, 1.6, -1], [0, 2.0, 0]], ease: (u) => 1 - Math.pow(1 - u, 3), fn(t) {
    const d = t > w("l01", "dreaded") - 0.05;
    cop.set(d ? "dread" : "neutral"); cop.pose(d ? "hands_head" : "direct", t);
    honk(t, cars);
  } });
  // l02 You see, in Philadelphia ...
  add({ t0: T("l02", "you"), set: "street", fov: 54, cam: [[3.0, 14, 30], [3.7, 3.4, 9.2]], look: [[0, 8, -30], [0.5, 2.6, -6]], fn(t) {
    cop.pose("direct", t); honk(t, cars, 1.6);
    oldShop.forEach((a, i) => { a.walk(t * 3 + i, 0.2); a.root.position.x = -12 + i * 1.5 + (t - 3.6) * 0.9; });
  } });
  // ... the day after Thanksgiving (tear-off: THURSDAY flips away, FRIDAY)
  add({ t0: T("l02", "the"), set: "station", fov: 40, cam: [[3.0, 2.3, 1.2], [2.6, 2.25, 0.2]], look: [[2.4, 2.15, -2.9], [2.4, 2.2, -2.9]], fn(t) {
    const k = sm(w("l02", "after") - 0.05, w("l02", "thanksgiving") + 0.25, t);
    thuPivot.rotation.x = -k * 2.6; thuPivot.visible = k < 0.9;
    show([sarge, fisher, writer, ...benchCops], false);
  } });
  // ... was the worst day of the year to be a traffic cop
  add({ t0: T("l02", "was"), set: "street", fov: 46, cam: [[2.6, 1.0, 4.6], [1.5, 1.4, 3.5]], look: [[0, 1.9, 0], [0, 2.0, 0]], fn(t) {
    const wh = t > w("l02", "traffic") - 0.05;
    cop.set(wh ? "whistle" : "dread"); cop.pose(wh ? "whistle" : "stop", t);
    whistle.visible = wh; honk(t, cars, 0.9);
  } });
  // l03 Shoppers packed downtown,
  add({ t0: T("l03", "shoppers"), set: "street", fov: 52, cam: [[-5.4, 1.55, -3.0], [-5.9, 1.6, -3.3]], look: [[-13, 1.3, -5.6], [-13, 1.35, -5.8]], fn(t) {
    oldShop.forEach((a, i) => { a.walk(t * 3.2 + i, 0.22); a.root.position.set(-13.6 + i * 1.3 + (t - 8.4) * 0.9, 0.16, -5.0 + (i % 2 ? 0.55 : -0.3)); a.set(i % 2 ? "laugh" : "happy"); a.turn = 0; });
    cop.root.visible = false;
  } });
  // ... and fans poured in for the Army-Navy football game.
  add({ t0: T("l03", "and"), set: "street", fov: 50, cam: [[-5.4, 1.5, 3.0], [-6.2, 1.6, 3.6]], look: [[-14, 1.35, 5.4], [-12, 1.5, 5.2]], fn(t) {
    fans.forEach((a, i) => {
      const go = t < w("l03", "army") - 0.1;
      a.walk(go ? t * 3 + i : null, 0.2); a.root.position.set(-10.6 + i * 0.95 + (go ? (t - w("l03", "army")) * 0.8 : 0), 0.16, 5.0 + (i % 2 ? 0.45 : -0.25));
      a.pose(go ? "stand" : "cheer", t + i * 0.2); a.set(go ? "happy" : "laugh");
    });
    cop.root.visible = false;
  } });
  // l04 No traffic cop was allowed to take the day off.
  add({ t0: T("l04", "no"), set: "station", fov: 54, cam: [[-0.6, 1.7, 3.8], [-0.9, 1.75, 3.1]], look: [[-1.0, 1.8, -2.5], [-1.0, 1.8, -2.5]], fn(t) {
    sarge.root.position.set(-0.1, 0, -1.7); fisher.root.position.set(-1.9, 0, -0.9);
    duty.visible = true; blank.visible = false; chalk.visible = false;
    sarge.pose("point", t); sarge.set("determined"); sarge.turn = -40;
    fisher.set(t > w("l04", "off") - 0.1 ? "sad" : "plead"); fisher.pose("hold", t);
    benchCops.forEach((a) => (a.root.visible = false)); writer.root.visible = false;
  } });
  // ... They even ordered the police band downtown.
  add({ t0: T("l04", "they"), set: "street", fov: 52, cam: [[-3.0, 0.95, 0.15], [-3.6, 1.0, 0.1]], look: [[-9, 1.4, 0], [-9.5, 1.5, 0]], fn(t) {
    band.forEach((a, i) => { a.walk(t * 3.4 + i * 0.5, 0.2); a.root.position.set(-10.4 - i * 0.9 + (t - 14.1) * 0.75, 0, [-0.1, 0.45, -0.5][i]); a.pose(i === 1 ? "drum" : i === 0 ? "tuba" : "whistle", t); a.set(i === 0 ? "whistle" : "determined"); });
    if (band[0].inst) band[0].inst.scale.setScalar(1 + 0.12 * Math.max(0, Math.sin(t * 9)));
    honk(t, cars, 1.1); cop.root.visible = false;
  } });
  // l05 So the cops called it Black Friday.
  add({ t0: T("l05", "so"), set: "station", fov: 46, cam: [[1.4, 1.6, 3.6], [0.4, 1.9, 2.6]], look: [[0.0, 1.6, -2.4], [-1.2, 2.1, -2.8]], fn(t) {
    duty.visible = false; blank.visible = true;
    chalk.userData.k(sm(w("l05", "called"), w("l05", "friday") + 0.35, t));
    writer.pose("pointUp", t); writer.root.position.set(0.15, 0, -2.3); writer.turn = -55;
    benchCops.forEach((a, i) => { a.pose("sitslump"); a.set(t > w("l05", "black") ? "tired" : "bored"); });
    sarge.root.visible = false; fisher.root.visible = false;
  } });
  // l06 The city wanted a nicer name, so a PR expert suggested one.
  add({ t0: T("l06", "the"), set: "office", fov: 50, cam: [[-0.4, 1.7, 4.4], [1.6, 1.8, 3.4]], look: [[-1.2, 1.5, -1.2], [2.0, 1.5, -1.2]], fn(t) {
    const pr = t > w("l06", "so") - 0.1;
    officials.forEach((a, i) => { a.set(pr ? "neutral" : "angry"); a.pose(pr ? "stand" : i ? "shrug" : "point", t); });
    merchant.pose("shrug"); merchant.set(pr ? "worried" : "angry");
    prOff.set(pr ? "smug" : "neutral"); prOff.pose(pr ? "presentL" : "stand", t);
    cloth.visible = true; posterBig.visible = true;
  } });
  // l07 Big Friday.
  add({ t0: T("l07", "big"), set: "office", fov: 46, cam: [[2.1, 1.6, 3.4], [2.4, 1.6, 2.5]], look: [[2.5, 1.5, -1.6], [2.55, 1.55, -1.6]], fn(t) {
    const r = sm(w("l07", "big") - 0.04, w("l07", "big") + 0.22, t);
    cloth.position.y = 0.98 + r * 2.2; cloth.visible = r < 0.95;
    stars.forEach((s, i) => { const k = pop(w("l07", "big") + 0.1 + i * 0.06, 0.3, t); s.visible = k > 0.01; s.scale.setScalar(Math.max(0.01, k)); s.rotation.z = t * 2 + i; });
    prOff.set("proud"); prOff.pose("arms_up", t); prOff.root.position.set(2.0, 0, -0.75);
  } });
  // l08 Nobody used it.
  add({ t0: T("l08", "nobody"), set: "street", fov: 48, cam: [[6.2, 1.5, -0.6], [6.4, 1.6, -1.3]], look: [[6.6, 1.7, -4.7], [6.6, 1.7, -4.7]], fn(t) {
    prSt.root.visible = true; prSt.set(t > w("l08", "used") ? "sad" : "worried"); prSt.pose("sign");
    oldShop.forEach((a, i) => { if (i > 2) { a.root.visible = false; return; } a.walk(t * 3 + i, 0.2); a.root.position.set(5.0 + i * 1.5 + (t - 23) * 1.3 * (i % 2 ? -1 : 1), 0.16, -5.5 + (i % 2) * 1.2); a.set("bored"); a.turn = i % 2 ? -60 : 60; });
    cop.root.visible = false;
  } });
  // ... The reporters kept writing Black Friday.
  add({ t0: T("l08", "the"), set: "newsroom", fov: 46, cam: [[1.6, 2.2, 3.0], [-0.5, 2.15, 0.8]], look: [[-0.6, 1.3, -1.0], [-0.9, 1.38, -0.6]], fn(t) {
    reporters.forEach((a, i) => { a.pose("type", t + i * 0.3); a.set("determined"); });
    typeLabel.userData.k(sm(w("l08", "black") - 0.05, w("l08", "friday") + 0.35, t));
    newsCard.visible = false;
  } });
  // l09 For twenty years, (the desk calendar flips 1961 -> 1981 beside the diorama) it stayed mostly a Philadelphia thing,
  add({ t0: T("l09", "for"), set: "dome", fov: 50, cam: [[2.6, 1.9, 3.0], [-0.6, 2.0, 3.9]], look: [[1.6, 1.3, -0.3], [-0.6, 1.55, -0.5]], fn(t) {
    const k = sm(w("l09", "twenty") - 0.05, w("l09", "years") + 0.5, t), yr = 1961 + Math.round(k * 20);
    deskCal.material.map = yearTex[Math.min(1981, yr + 1)]; flipCard.material.map = yearTex[yr];
    flipPage.rotation.x = k > 0 && k < 1 ? -((k * 20) % 1) * 2.4 : 0; flipPage.visible = k > 0 && k < 1;
    if (k >= 1) deskCal.material.map = yearTex[1981];
    miniCop.pose("direct", t); honk(t, miniCars, 1.2);
  } });
  // ... about traffic. (inside the dome)
  add({ t0: T("l09", "about"), set: "dome", fov: 44, cam: [[0.0, 1.7, 0.5], [-0.3, 1.58, 0.1]], look: [[-0.6, 1.45, -0.5], [-0.6, 1.47, -0.5]], fn(t) {
    deskCal.material.map = yearTex[1981]; flipPage.visible = false;
    miniCop.pose("hands_head", t); miniCop.set("dread"); honk(t, miniCars, 0.6);
  } });
  // l10 Then, in 1981, a better story showed up in print. (newspaper spin)
  add({ t0: T("l10", "then"), set: "newsroom", fov: 50, cam: [[0, 1.75, 4.1], [0, 1.72, 3.7]], look: [[0, 1.7, 0], [0, 1.7, 0]], fn(t) {
    const k = sm(w("l10", "then") - 0.05, w("l10", "1981") + 0.7, t);
    newsCard.visible = true; newsCard.position.set(0, 1.72, 1.25); newsCard.rotation.set(0, 0, (1 - k) * Math.PI * 6);
    newsCard.scale.setScalar(Math.max(0.02, k));
    reporters.forEach((a) => a.pose("type", t));
  } });
  // l11 It said Black Friday is the day stores ...
  add({ t0: T("l11", "it"), set: "shop80", fov: 48, cam: [[1.6, 1.9, 3.8], [0.9, 1.9, 3.1]], look: [[-0.2, 1.4, -0.4], [-0.1, 1.45, -0.3]], fn(t) {
    owner.set("worried"); owner.pose("think", t); turn.rotation.z = 0;
  } });
  // ... finally go from red ink to black,
  add({ t0: T("l11", "from"), set: "shop80", fov: 44, cam: [[0.55, 2.25, 1.05], [0.53, 2.05, 0.85]], look: [[0.5, 1.14, 0.38], [0.5, 1.14, 0.38]], fn(t) {
    turn.rotation.z = sm(w("l11", "to") - 0.05, w("l11", "black", 1) + 0.3, t) * Math.PI;
    owner.root.visible = false;
  } });
  // ... from losses to profit.
  add({ t0: T("l11", "from", 1), set: "shop80", fov: 52, cam: [[1.0, 1.7, 5.6], [1.4, 1.8, 4.8]], look: [[1.8, 1.6, -0.3], [1.9, 1.7, -0.3]], fn(t) {
    turn.rotation.z = Math.PI;
    bars.forEach((b, i) => {
      const k = i < 3 ? sm(w("l11", "losses") - 0.1 + i * 0.06, w("l11", "losses") + 0.25 + i * 0.06, t) : sm(w("l11", "profit") - 0.1 + (i - 3) * 0.1, w("l11", "profit") + 0.35 + (i - 3) * 0.1, t);
      const h = (i < 3 ? [0.5, 0.7, 0.4][i] : [0.9, 1.25][i - 3]) * Math.max(0.01, k);
      b.scale.y = h; b.position.y = i < 3 ? 1.75 - h : 1.75;
    });
    const happy = t > w("l11", "profit") - 0.05;
    owner.set(happy ? "laugh" : "worried"); owner.pose(happy ? "cheer" : "think", t); owner.root.position.set(1.1, 0, 0.95);
  } });
  // l12 You see, that was the version stores loved,
  add({ t0: T("l12", "you"), set: "avenue", fov: 50, cam: [[0.5, 1.3, 4.6], [-0.6, 1.4, 3.8]], look: [[-1.2, 1.15, -1.5], [-1.3, 1.25, -1.5]], fn(t) {
    hangers.forEach((a, i) => { a.pose("holdUp", t); a.set(i ? "laugh" : "happy"); a.root.position.set(-2.4 + i * 2.2, 0, -1.2); });
    heldBanner.visible = true;
    hearts.forEach((h, i) => { const k = pop(w("l12", "loved") - 0.2 + i * 0.07, 0.3, t); h.visible = k > 0.01; h.scale.setScalar(Math.max(0.01, k)); h.position.y = 2.4 + Math.max(0, t - w("l12", "loved")) * 0.5 + (i % 2) * 0.2; });
    avBanners.forEach((b) => (b.m.visible = b.k === 0 && b.sx < 0));
  } });
  // ... and it spread across the country. (banners pop on, store after store)
  add({ t0: T("l12", "and"), set: "avenue", fov: 54, cam: [[-2.4, 1.6, 6], [-2.2, 1.9, -6]], look: [[-1.6, 2.4, -30], [-1.4, 2.6, -46]], fn(t) {
    hangers.forEach((a) => (a.root.visible = false)); heldBanner.visible = false; hearts.forEach((h) => (h.visible = false));
    avBanners.forEach((b) => { const k = pop(w("l12", "spread") - 0.15 + b.k * 0.11 + (b.sx > 0 ? 0.05 : 0), 0.22, t); b.m.visible = k > 0.01; b.m.scale.setScalar(Math.max(0.01, k)); });
  } });
  // l13 In 1985, store owners in Los Angeles ...
  add({ t0: T("l13", "in"), set: "towns", fov: 48, cam: [[-2.0, 1.7, 1.6], [0.3, 2.6, 8.0]], look: [[-2.2, 1.6, -0.9], [0.3, 2.4, -1]], fn(t) {
    const q = pop(w("l13", "los") + 0.1, 0.3, t);
    qLA.visible = q > 0.01; qLA.scale.setScalar(Math.max(0.01, q));
    laOwner.set(t > w("l13", "los") ? "confused" : "neutral"); laOwner.pose(t > w("l13", "los") ? "think" : "stand", t);
  } });
  // ... and Cincinnati still hadn't heard of it.
  add({ t0: T("l13", "and"), set: "towns", fov: 48, cam: [[60.6, 2.4, 8.2], [60.6, 1.7, 4.0]], look: [[60.4, 2.6, -1], [60.4, 1.6, -0.6]], fn(t) {
    const q = pop(w("l13", "heard") - 0.1, 0.3, t);
    qCI.visible = q > 0.01; qCI.scale.setScalar(Math.max(0.01, q));
    ciOwner.set(t > w("l13", "still") ? "confused" : "neutral"); ciOwner.pose(t > w("l13", "heard") - 0.1 ? "shrug" : "stand", t);
  } });
  // l14 So the profit story isn't where the name came from. (the paper flips: the 1960s jam behind it)
  add({ t0: T("l14", "so"), set: "newsroom", fov: 54, cam: [[0.3, 1.75, 3.3], [0.0, 1.72, 2.9]], look: [[0, 1.72, 0], [0, 1.72, 0]], fn(t) {
    newsCard.visible = true; newsCard.position.set(0, 1.72, 1.0); newsCard.scale.setScalar(1);
    newsCard.rotation.set(0, sm(w("l14", "isn't") - 0.05, w("l14", "where") + 0.35, t) * Math.PI, 0);
  } });
  // ... It's the rebrand that finally worked.
  add({ t0: T("l14", "it's"), set: "office", fov: 50, cam: [[1.6, 1.6, 4.0], [2.2, 1.65, 3.3]], look: [[2.6, 1.4, -1.2], [2.8, 1.45, -1.3]], fn(t) {
    cloth.visible = false; posterBig.visible = false; posterProfit.visible = true; crumple.visible = true;
    const k = pop(w("l14", "rebrand") - 0.02, 0.18, t);
    stamp.visible = k > 0.01; stamp.scale.setScalar(Math.max(0.01, 2.2 - 1.2 * k));
    prOff.root.position.set(1.85, 0, -0.5); prOff.set(t > w("l14", "worked") - 0.1 ? "smug" : "neutral"); prOff.pose(t > w("l14", "worked") - 0.1 ? "pointL" : "stand", t);
    officials.forEach((a) => (a.root.visible = false)); merchant.root.visible = false;
  } });
  // l15 And this November twenty-seventh, while you shop, remember.
  add({ t0: T("l15", "and"), set: "mall", fov: 46, cam: [[-4.5, 1.45, -0.6], [-4.55, 1.42, -1.1]], look: [[-4.6, 1.3, -3.7], [-4.6, 1.3, -3.7]], fn(t) {
    show(shoppers, false);
  } });
  add({ t0: T("l15", "while"), set: "mall", fov: 52, cam: [[5.4, 1.3, 5.0], [4.6, 1.35, 4.2]], look: [[0, 1.6, -1.2], [-0.5, 1.7, -1.8]], fn(t) {
    shoppers.forEach((a, i) => {
      a.walk(t * 4.6 + i, 0.27); a.set(i % 2 ? "laugh" : "happy"); a.pose("bags", t);
      a.root.position.set(-3 + i * 1.35, 0, 2.8 + (i % 2) * 0.9 - (t - w("l15", "while")) * 1.7);
    });
  } });
  // ... The name was invented by cops ...
  add({ t0: T("l15", "the"), set: "street", fov: 50, cam: [[4.0, 17, 22], [3.8, 6, 10]], look: [[0, 0.5, 0], [0, 1.4, 0]], fn(t) {
    cop.pose("direct", t); cop.set("dread"); honk(t, cars, 0.9);
  } });
  // ... stuck in traffic.
  add({ t0: T("l15", "stuck"), set: "street", fov: 46, cam: [[1.6, 1.7, 3.1], [2.4, 2.4, 4.6]], look: [[0, 2.0, 0], [0, 1.9, 0]], fn(t) {
    const wh = t > w("l15", "traffic") + 0.4;
    cop.set(wh ? "whistle" : "tired"); cop.pose(wh ? "whistle" : "facepalm", t); whistle.visible = wh;
    honk(t, cars, 0.8);
  } });

  S.sort((a, b) => a.t0 - b.t0);
  const show = (list, v) => list.forEach((a) => ((a.root || a.mesh || a).visible = v));
  const reset = {
    mall() { shoppers.forEach((a, i) => { a.root.visible = true; a.root.position.set(-2.8 + i * 1.4, 0, 0.6 + (i % 2) * 0.9); a.st.bob = 0; a.walk(null); a.pose("stand"); a.set("happy"); a.turn = 0; }); novCard.visible = true; },
    street() {
      cop.root.visible = true; cop.set("neutral"); cop.pose("stand"); whistle.visible = false;
      cars.forEach((c) => c.scale.setScalar(c.userData.base));
      oldShop.forEach((a, i) => { a.root.visible = true; a.root.position.set(-12 + i * 1.5, 0.16, -5.0 + (i % 2) * 0.6); a.walk(null); a.set("happy"); a.turn = 35; });
      fans.forEach((a, i) => { a.root.position.set(-7.4 + i * 0.95, 0.16, 4.9 + (i % 2) * 0.5); a.walk(null); a.pose("stand"); });
      band.forEach((a, i) => { a.root.position.set(-9 - i * 1.3, 0, 0); a.walk(null); });
      prSt.root.visible = false; tls.forEach((l) => l.userData.light("red"));
    },
    station() { sarge.root.position.set(-0.1, 0, -1.7); fisher.root.position.set(-1.9, 0, -0.9); thuPivot.rotation.x = 0; thuPivot.visible = true; duty.visible = true; blank.visible = false; chalk.userData.k(0); show([sarge, fisher], true); show(benchCops, true); writer.root.visible = true; sarge.turn = -10; },
    office() { cloth.position.y = 0.98; cloth.visible = true; posterBig.visible = true; posterProfit.visible = false; stamp.visible = false; crumple.visible = false; stars.forEach((s) => (s.visible = false));
      show(officials, true); merchant.root.visible = true; prOff.root.position.set(1.6, 0, -0.6); prOff.pose("stand"); },
    newsroom() { newsCard.visible = false; newsCard.rotation.set(0, 0, 0); newsCard.scale.setScalar(1); typeLabel.userData.k(1); },
    dome() { deskCal.material.map = yearTex[1961]; flipPage.visible = false; miniCars.forEach((c) => c.scale.setScalar(0.09)); miniCars.forEach((c) => (c.userData.base = 0.09)); miniCop.pose("stand"); },
    shop80() { owner.root.visible = true; owner.root.position.set(-0.2, 0, -0.7); turn.rotation.z = 0; bars.forEach((b) => { b.scale.y = 0.01; b.position.y = 1.75; }); },
    avenue() { show(hangers, true); heldBanner.visible = false; hearts.forEach((h) => (h.visible = false)); avBanners.forEach((b) => { b.m.visible = false; b.m.scale.setScalar(1); }); },
    towns() { qLA.visible = qCI.visible = false; laOwner.pose("stand"); ciOwner.pose("stand"); },
  };
  return { shots: S, reset };
};
