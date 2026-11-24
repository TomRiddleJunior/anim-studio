/* "The Missile Steered by a Pigeon" — sets and shots for the twist-tale kit (v2: 3D toon cast).
 * TALE_FILM(K, V) builds every set once and returns { shots, reset }. V.w(line, word, k) = start time of a narration
 * word. Each shot: { t0, set, cam: [from, to], look: [from, to], fov, fn(t, u) }; every shot first runs its set's
 * reset(), so any frame renders the same on its own. The pigeons are built here from primitives (pigeon()).
 */
window.TALE_FILM = function (K, V) {
  const T3 = K.T;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const back = (u) => { const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const pop = (a, d, t) => (t <= a ? 0 : t >= a + d ? 1 : back((t - a) / d));
  const ez = (u) => -(Math.cos(Math.PI * clamp(u, 0, 1)) - 1) / 2;   // the world player's camera ease
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const wrap = (x, L) => (((x % L) + L * 1.5) % L) - L / 2;
  const pk = (t, rate, ph) => Math.pow(Math.max(0, Math.sin(t * rate + (ph || 0))), 3);   // a peck: 0..1, sharp
  const w = (l, wd, k) => V.w(l, wd, k);
  const INK = K.INK;
  const FONT = '"Arial Black", Arial, sans-serif', SERIF = 'Georgia, "Times New Roman", serif', TYPE = '"Courier New", Courier, monospace';
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

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
  // a card that reveals left to right (typing, a projected image): plane + its own texture copy
  function revealer(wd, ht, tex, p) {
    const t = tex.clone(); t.needsUpdate = true; t.wrapS = T3.ClampToEdgeWrapping;
    const m = K.plane(wd, ht, t, p);
    m.userData.x0 = m.position.x; m.userData.w = wd;
    m.userData.k = (k) => { k = clamp(k, 0.001, 1); t.repeat.x = k; m.scale.x = k; m.position.x = m.userData.x0 - (1 - k) * wd / 2 * Math.cos(m.rotation.y); m.visible = k > 0.002; };
    return m;
  }
  function bubble(s, color) {
    return ctx(256, 256, (g) => {
      g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 12;
      g.beginPath(); g.arc(128, 116, 96, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(96, 200); g.lineTo(70, 248); g.lineTo(136, 208); g.fill();
      txt(g, s, 128, 122, 140, color || "#ff5a4e", { stroke: INK, sw: 12 });
    });
  }
  const starTex = ctx(256, 256, (g) => {
    g.fillStyle = "#ffd84d"; g.strokeStyle = INK; g.lineWidth = 10; g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 46 : 112, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(128 + r * Math.cos(a), 128 + r * Math.sin(a)); }
    g.closePath(); g.fill(); g.stroke();
  });
  const nDouble = new T3.ShaderMaterial({
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec3 vN; void main(){ vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0); gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); }",
    side: T3.DoubleSide });
  const dbl = (m) => { m.userData.nmat = nDouble; return m; };
  const show = (list, v) => list.forEach((a) => ((a.root || a.g || a.mesh || a).visible = v));
  function stars(n, p, parent) {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const s = K.plane(p.s || 0.3, p.s || 0.3, starTex, { x: p.x + Math.cos(a) * (p.r || 0.5), y: p.y + Math.sin(a) * (p.r || 0.5) * 0.8, z: p.z, ry: p.ry || 0, parent });
      s.visible = false;
      return s;
    });
  }
  const popStars = (list, t0, t) => list.forEach((s, i) => { const k = pop(t0 + i * 0.05, 0.3, t); s.visible = k > 0.01; s.scale.setScalar(Math.max(0.01, k)); s.rotation.z = t * 2 + i; });

  // ---- the target ship (a generic drawing) and the screens the pigeons peck at
  function drawShip(g, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    g.lineWidth = 6; g.strokeStyle = INK; g.lineJoin = "round";
    g.beginPath(); g.moveTo(-80, 0); g.lineTo(-80, -58); g.stroke();
    g.fillStyle = "#eef1f5"; g.fillRect(-30, -34, 62, 34); g.strokeRect(-30, -34, 62, 34);
    g.fillRect(-14, -58, 36, 24); g.strokeRect(-14, -58, 36, 24);
    g.fillStyle = "#2a2a33"; g.fillRect(44, -46, 20, 46); g.strokeRect(44, -46, 20, 46);
    g.fillStyle = "#e8402f"; g.fillRect(44, -46, 20, 12);
    g.fillStyle = "#7b8698"; g.beginPath(); g.moveTo(-124, 0); g.lineTo(134, 0); g.lineTo(104, 36); g.lineTo(-106, 36); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#e8402f"; g.fillRect(-100, 28, 198, 7);
    g.fillStyle = "#2a2a33"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-70 + i * 30, 14, 5, 0, 7); g.fill(); }
    g.restore();
  }
  function seaBack(g, x, y, wd, ht, horizon) {
    const hy = y + ht * horizon;
    const sky = g.createLinearGradient(0, y, 0, hy); sky.addColorStop(0, "#5fb4f5"); sky.addColorStop(1, "#d6f0ff");
    g.fillStyle = sky; g.fillRect(x, y, wd, hy - y);
    const sea = g.createLinearGradient(0, hy, 0, y + ht); sea.addColorStop(0, "#3a9be0"); sea.addColorStop(1, "#1f6fbf");
    g.fillStyle = sea; g.fillRect(x, hy, wd, y + ht - hy);
    g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 5;
    const r = rng(9);
    for (let k = 0; k < 26; k++) { const xx = x + r() * wd, yy = hy + 12 + r() * (y + ht - hy - 20), l = 18 + r() * 30; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + l / 2, yy - 7, xx + l, yy); g.stroke(); }
  }
  function drawCross(g, c, size) {
    g.strokeStyle = c; g.lineWidth = 16;
    g.beginPath(); g.arc(size / 2, size / 2, size * 0.32, 0, 7); g.stroke();
    for (const [a, b] of [[0.04, 0.3], [0.7, 0.96]]) { g.beginPath(); g.moveTo(size * a, size / 2); g.lineTo(size * b, size / 2); g.moveTo(size / 2, size * a); g.lineTo(size / 2, size * b); g.stroke(); }
  }
  const scrBg = ctx(512, 400, (g) => seaBack(g, 0, 0, 512, 400, 0.38));
  const shipLayer = ctx(512, 256, (g) => drawShip(g, 256, 140, 1.5));
  const crossRed = ctx(512, 512, (g) => drawCross(g, "#ff3b3b", 512));
  const crossGreen = ctx(512, 512, (g) => drawCross(g, "#3ddc6a", 512));
  const scrFull = ctx(512, 400, (g) => { seaBack(g, 0, 0, 512, 400, 0.38); drawShip(g, 256, 196, 0.85); g.save(); g.translate(256 - 128, 200 - 128); drawCross(g, "#ff3b3b", 256); g.restore(); });
  function screen(wd, ht, p) {
    const g = new T3.Group();
    g.position.set(p.x || 0, p.y || 0, p.z || 0); g.rotation.y = (p.ry || 0) * D2R;
    p.parent.add(g);
    K.slab(wd + 0.08, ht + 0.08, 0.05, 0.03, "#2a2f3a", { y: -(ht + 0.08) / 2, z: -0.05, parent: g });
    K.plane(wd, ht, scrBg, { parent: g });
    const ship = K.plane(wd * 0.56, wd * 0.28, shipLayer, { z: 0.006, y: -ht * 0.04, parent: g });
    const cross = K.plane(ht * 0.62, ht * 0.62, crossRed, { z: 0.012, parent: g });
    const ok = K.plane(ht * 0.62, ht * 0.62, crossGreen, { z: 0.013, parent: g });
    ok.visible = false;
    g.userData = { ship, cross, ok, wd, ht, y0: -ht * 0.04 };
    g.userData.aim = (dx, on) => { ship.position.x = dx * wd; ok.visible = !!on; cross.visible = !on; };
    return g;
  }

  // ---- a 3D toon pigeon (faces +z): blue-grey body, green/purple neck, orange eyes, wing bars, pink feet
  const PG = { body: "#93a1bf", wing: "#a9b5cf", bar: "#3a4058", head: "#7e8bab", neckG: "#3fb08c", neckP: "#9a5cc8", leg: "#ee6f84", beak: "#4a4048", eye: "#ff8c2a", cere: "#f4f1ea" };
  const GOLD = { body: "#f2c230", wing: "#f6d35a", bar: "#c9971f", head: "#eab82a", neckG: "#f6d35a", neckP: "#e0a820", leg: "#e0a820", beak: "#c9971f", eye: "#c9971f", cere: "#fff0b0" };
  function pigeon(p) {
    const c = Object.assign({}, p.gold ? GOLD : PG);
    const g = new T3.Group();
    const body = new T3.Group(); body.position.y = 0.2; g.add(body);
    K.sphere(0.16, c.body, { sx: 1.0, sy: 0.86, sz: 1.35, parent: body });
    K.sphere(0.112, c.neckG, { y: 0.085, z: 0.12, parent: body });
    K.torus(0.078, 0.032, c.neckP, { y: 0.16, z: 0.13, rx: 72, parent: body });
    const neck = new T3.Group(); neck.position.set(0, 0.12, 0.12); body.add(neck);
    const head = new T3.Group(); head.position.set(0, 0.11, 0.04); neck.add(head);
    K.sphere(0.088, c.head, { parent: head });
    for (const s of [-1, 1]) {
      K.sphere(0.03, "#ffffff", { x: s * 0.058, y: 0.022, z: 0.045, parent: head });
      K.sphere(0.024, c.eye, { x: s * 0.068, y: 0.023, z: 0.052, parent: head });
      K.sphere(0.012, INK, { x: s * 0.079, y: 0.024, z: 0.062, parent: head });
    }
    K.cone(0.024, 0.085, c.beak, { rx: 90, y: -0.008, z: 0.112, center: true, parent: head });
    K.sphere(0.02, c.cere, { y: 0.012, z: 0.084, parent: head });
    const wings = [-1, 1].map((s) => {
      const flap = new T3.Group(); flap.position.set(s * 0.125, 0.07, 0.06); body.add(flap);
      const spread = new T3.Group(); flap.add(spread);
      K.sphere(0.12, c.wing, { sx: 0.3, sy: 0.55, sz: 1.5, z: -0.13, parent: spread });
      for (const z of [-0.12, -0.19]) K.box(0.016, 0.075, 0.03, c.bar, { x: s * 0.03, y: -0.025, z, center: true, parent: spread });
      return { flap, spread, s };
    });
    const tail = new T3.Group(); tail.position.set(0, 0.02, -0.2); tail.rotation.x = -0.18; body.add(tail);
    K.box(0.13, 0.025, 0.18, c.wing, { z: -0.09, center: true, parent: tail });
    K.box(0.134, 0.028, 0.04, c.bar, { z: -0.165, center: true, parent: tail });
    const legs = new T3.Group(); g.add(legs);
    for (const s of [-1, 1]) {
      K.cyl(0.013, 0.013, 0.11, c.leg, { x: s * 0.05, parent: legs });
      K.box(0.05, 0.016, 0.075, c.leg, { x: s * 0.05, z: 0.02, parent: legs });
    }
    g.position.set(p.x || 0, p.y || 0, p.z || 0);
    g.rotation.y = (p.ry || 0) * D2R;
    g.scale.setScalar(p.s || 1);
    g.userData.y0 = g.position.y; g.userData.ry0 = g.rotation.y;
    (p.parent).add(g);
    const P = {
      g, body, neck, head, wings, legs, tail,
      fold() {
        wings.forEach((x) => { x.flap.rotation.z = 0; x.spread.rotation.y = 0; });
        legs.visible = true; body.rotation.set(0, 0, 0); neck.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
        g.position.y = g.userData.y0; g.rotation.set(0, g.userData.ry0, 0);
        return P;
      },
      peck(k) { neck.rotation.x = 0.95 * k; body.rotation.x = 0.14 * k; return P; },
      fly(ph, amp, legsOn) {
        legs.visible = !!legsOn;
        const a = (amp == null ? 0.8 : amp) * Math.sin(ph);
        wings.forEach((x) => { x.spread.rotation.y = -x.s * 1.3; x.flap.rotation.z = x.s * a; });
        body.rotation.x = -0.06;
        return P;
      },
    };
    return P;
  }

  // ---- the Pelican glide bomb (a toon stand-in): nose +x, wings along z
  const OLIVE = "#8fae58", OLIVE2 = "#74913f";
  const pelTex = sign(512, 128, [{ text: "PELICAN", size: 96, y: 66, color: "#fff7d6" }], { bg: OLIVE });
  function pelican(p) {
    const g = new T3.Group(), roll = new T3.Group(); g.add(roll);
    K.cyl(0.34, 0.34, 2.4, OLIVE, { rz: 90, center: true, parent: roll });
    K.sphere(0.34, "#9cbd66", { x: 1.2, sx: 1.6, parent: roll });
    [[0, 0.1], [-0.1, -0.07], [0.1, -0.07]].forEach(([zz, yy]) => K.sphere(0.06, "#23324c", { x: 1.68, y: yy, z: zz, parent: roll }));
    K.cyl(0.346, 0.346, 0.14, "#f2c230", { x: 0.88, rz: 90, center: true, parent: roll });
    K.cyl(0.0001, 0.34, 0.9, OLIVE2, { x: -1.65, rz: 90, center: true, parent: roll });
    K.box(0.75, 0.06, 3.2, OLIVE2, { x: 0.15, y: -0.03, center: true, parent: roll });
    K.box(0.42, 0.05, 1.25, OLIVE2, { x: -1.78, center: true, parent: roll });
    K.box(0.44, 0.56, 0.05, OLIVE2, { x: -1.8, y: 0.28, center: true, parent: roll });
    for (const s of [-1, 1]) K.plane(0.8, 0.2, pelTex, { x: -0.7, y: 0.02, z: s * 0.348, ry: s > 0 ? 0 : 180, parent: roll });
    g.position.set(p.x || 0, p.y || 0, p.z || 0);
    g.rotation.y = (p.ry || 0) * D2R;
    if (p.s) g.scale.setScalar(p.s);
    p.parent.add(g);
    return { g, roll };
  }

  const SCI = { outfit: "#f7f7f2", tie: "#2f6bd8", hair: "#6a4a32", h: 1.76 };   // the psychologist in a lab coat (generic)
  const SUIT = { outfit: "#4a6fa5", tie: "#e8402f", hat: "fedora", hatc: "#6b4a32", hair: "#6a4a32", h: 1.74 };

  // ================================================================== TRAIN (spring 1940: birds beside the window)
  const tr = K.set("train", { bg: "#9fd4fb", fog: ["#e3f3ff", 30, 120], sunPos: [-8, 13, -11], shadow: 16 });
  K.sky(tr, { top: "#3a9cf2", mid: "#97d3fb", bottom: "#eaf7ff", seed: 17 });
  const grassT = K.ctex("grass", { a: "#82d35e", b: "#62bb49", seed: 41, rep: [40, 40] });
  K.box(240, 0.1, 240, "#ffffff", { y: -0.1, tex: grassT, parent: tr });
  const ballT = K.ctex("asphalt", { a: "#c4b195", seed: 43, rep: [80, 1] });
  K.box(240, 0.12, 3.2, "#ffffff", { y: -0.04, tex: ballT, parent: tr });
  for (const z of [-0.72, 0.72]) K.box(240, 0.08, 0.08, "#9aa3ad", { y: 0.14, z, parent: tr });
  const sleepers = [];
  for (let k = 0; k < 40; k++) { const s = K.box(0.24, 0.06, 2.2, "#8a5a3a", { x: -24 + k * 1.2, y: 0.08, parent: tr }); s.userData.x0 = s.position.x; sleepers.push(s); }
  const trees = [];
  { const r = rng(77);
    const leaves = ["#4fb35a", "#62c46a", "#3fa65a", "#8fd16a", "#f2b84b", "#e8913c"];
    for (let k = 0; k < 70; k++) {
      const side = k % 2 ? 1 : -1, z = side * (6 + r() * 34), x0 = -48 + r() * 96;
      const t = K.tree({ x: x0, z, s: 0.9 + r() * 0.9, leaf: leaves[Math.floor(r() * leaves.length)], parent: tr });
      t.userData.x0 = x0; t.userData.par = 1; trees.push(t);
    }
    for (let k = 0; k < 9; k++) { const h = K.ico(9 + r() * 8, ["#7cc85a", "#69b955", "#8fd16a"][k % 3], { x: -80 + k * 20, y: -4, z: -78 - r() * 20, detail: 1, parent: tr }); h.userData.x0 = h.position.x; h.userData.par = 0.12; trees.push(h); }
  }
  const CAR = "#e2533f", CREAM = "#f6ecd2", ROOF = "#4a4f5c";
  const planksIn = K.ctex("planks", { a: "#d9a066", b: "#c98d55", n: 6, rep: [4, 1] });
  function carriage(x0) {
    const g = new T3.Group(); g.position.x = x0; tr.add(g);
    K.box(8.4, 0.5, 2.3, "#3a3d48", { y: 0.45, parent: g });
    for (const xx of [-3.0, -2.2, 2.2, 3.0]) for (const s of [-1, 1]) K.cyl(0.34, 0.34, 0.12, "#2a2c33", { x: xx, y: 0.4, z: s * 0.78, rx: 90, center: true, parent: g });
    K.box(8.4, 0.1, 2.6, "#ffffff", { y: 0.95, tex: planksIn, parent: g });
    K.box(8.4, 2.4, 0.12, CAR, { y: 1.0, z: 1.25, parent: g });
    const wins = [-2.7, -0.9, 0.9, 2.7], WW = 1.2, SILL = 1.95, TOP = 2.8;
    K.box(8.4, SILL - 1.0, 0.12, CAR, { y: 1.0, z: -1.25, parent: g });
    K.box(8.4, 3.4 - TOP, 0.12, CAR, { y: TOP, z: -1.25, parent: g });
    const edges = [-4.2]; wins.forEach((c) => edges.push(c - WW / 2, c + WW / 2)); edges.push(4.2);
    for (let i = 0; i < edges.length; i += 2) K.box(edges[i + 1] - edges[i], TOP - SILL, 0.12, CAR, { x: (edges[i] + edges[i + 1]) / 2, y: SILL, z: -1.25, parent: g });
    K.box(8.44, 0.14, 0.16, CREAM, { y: SILL - 0.14, z: -1.25, parent: g });
    K.box(8.44, 0.14, 0.16, CREAM, { y: TOP, z: -1.25, parent: g });
    for (const x of edges.slice(1, -1)) K.box(0.08, TOP - SILL, 0.16, CREAM, { x, y: SILL, z: -1.25, parent: g });
    K.box(8.2, 0.9, 0.02, "#ffffff", { y: 1.05, z: -1.18, tex: planksIn, parent: g });
    for (const s of [-1, 1]) K.box(0.12, 2.4, 2.6, CAR, { x: s * 4.2, y: 1.0, parent: g });
    K.slab(8.7, 0.32, 2.9, 0.14, ROOF, { y: 3.4, parent: g });
    return g;
  }
  const car1 = carriage(0);
  carriage(-8.8);
  // seats (back-to-back benches) inside Skinner's carriage
  for (const x of [0.9, -0.7]) K.slab(0.9, 0.41, 0.7, 0.08, "#3f7fd0", { x, y: 1.05, z: -0.62, parent: tr });
  void car1;
  // the locomotive
  const loco = new T3.Group(); loco.position.x = 9.4; tr.add(loco);
  K.box(6.2, 0.5, 2.3, "#2a2c33", { y: 0.45, parent: loco });
  for (const xx of [-1.4, 0, 1.4]) for (const s of [-1, 1]) K.cyl(0.55, 0.55, 0.12, "#d8443a", { x: xx, y: 0.58, z: s * 0.95, rx: 90, center: true, parent: loco });
  K.cyl(0.95, 0.95, 4.0, "#2f7d5a", { x: 0.9, y: 1.95, rz: 90, center: true, parent: loco });
  for (const x of [0.0, 1.6]) K.cyl(0.97, 0.97, 0.12, "#f2c230", { x, y: 1.95, rz: 90, center: true, parent: loco });
  K.sphere(0.95, "#2a2c33", { x: 2.9, y: 1.95, sx: 0.32, parent: loco });
  K.box(1.9, 2.4, 2.5, "#2f7d5a", { x: -1.9, y: 0.95, parent: loco });
  K.box(1.0, 0.7, 2.54, "#bfe8ff", { x: -1.9, y: 2.25, parent: loco });
  K.slab(2.2, 0.25, 2.9, 0.12, ROOF, { x: -1.9, y: 3.35, parent: loco });
  K.cyl(0.24, 0.32, 0.95, "#2a2c33", { x: 2.2, y: 2.75, parent: loco });
  K.sphere(0.32, "#f2c230", { x: 0.8, y: 2.85, parent: loco });
  K.sphere(0.16, "#fff3b0", { x: 3.2, y: 2.4, mat: { basic: true }, parent: loco });
  const puffs = Array.from({ length: 6 }, (_, i) => K.ico(0.6, "#ffffff", { detail: 1, x: 11.6, y: 3.9, parent: tr }));
  // Skinner on the train (a generic toon: suit, fedora)
  const skS = K.toon("skinner_train", Object.assign({ x: 0.9, y: 1.08, z: -0.6, face: "neutral", parent: tr }, SUIT));
  // the flock flying alongside
  const flockPos = [[-0.1, 2.75, -2.8], [1.95, 3.05, -3.2], [0.5, 1.6, -2.7], [2.6, 2.2, -3.6], [-0.9, 2.15, -3.9], [3.6, 3.3, -4.6], [-2.2, 3.1, -5.0], [4.6, 2.0, -5.6]];
  const flock = flockPos.map(([x, y, z], i) => pigeon({ x, y, z, ry: 90, s: 1.25 - (i > 4 ? 0.15 : 0), parent: tr }));
  function rollTrain(t) {
    const d = t * 10;
    trees.forEach((o) => (o.position.x = wrap(o.userData.x0 - d * o.userData.par, o.userData.par < 1 ? 200 : 96)));
    sleepers.forEach((o) => (o.position.x = wrap(o.userData.x0 - d, 48)));
    grassT.offset.x = (d / 6) % 1; ballT.offset.x = (d / 3) % 1;
    puffs.forEach((pf, i) => { const ph = (t * 1.4 + i / puffs.length) % 1; pf.position.set(11.6 - ph * 8, 3.9 + ph * 1.8, 0.2 * Math.sin(i)); pf.scale.setScalar(0.5 + ph * 1.2); });
    flock.forEach((b, i) => { b.fly(t * 12 + i * 1.7); b.g.position.y = b.g.userData.y0 + Math.sin(t * 2.4 + i) * 0.07; });
  }
  const thinkTex = ctx(640, 520, (g) => {
    g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 12;
    const bumps = 11;
    for (let i = 0; i < bumps; i++) { const a = (i / bumps) * Math.PI * 2; g.beginPath(); g.arc(320 + Math.cos(a) * 230, 220 + Math.sin(a) * 140, 78, 0, 7); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(320, 220, 250, 160, 0, 0, 7); g.fill();
    [[120, 420, 34], [70, 480, 20]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); });
    // a missile with a pigeon in its window
    g.fillStyle = OLIVE; rrect(g, 150, 180, 300, 90, 45); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(430, 190); g.quadraticCurveTo(540, 225, 430, 260); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(170, 185); g.lineTo(120, 140); g.lineTo(215, 185); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(170, 265); g.lineTo(120, 310); g.lineTo(215, 265); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#cfe9f7"; g.beginPath(); g.arc(395, 225, 34, 0, 7); g.fill(); g.stroke();
    g.fillStyle = "#93a1bf"; g.beginPath(); g.arc(398, 232, 20, 0, 7); g.fill(); g.lineWidth = 6; g.stroke();
    g.fillStyle = "#ff8c2a"; g.beginPath(); g.arc(406, 226, 6, 0, 7); g.fill();
    g.fillStyle = "#4a4048"; g.beginPath(); g.moveTo(416, 232); g.lineTo(430, 236); g.lineTo(416, 240); g.fill();
    txt(g, "?", 520, 120, 150, "#ff5a4e", { stroke: INK, sw: 14 });
  });
  const thinkB = K.plane(0.7, 0.57, thinkTex, { x: 1.2, y: 2.86, z: -0.9, ry: 40, parent: tr });

  // ================================================================== LAB (training: peck the target, earn a grain)
  const lab = K.set("lab", { bg: "#dff5ec", sunPos: [4, 9, 8], shadow: 9, hemiI: 2.0 });
  K.box(16, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#f4efe2", b: "#cfeee0", n: 4, rep: [8, 5] }), parent: lab });
  K.box(16, 4.4, 0.2, "#ffffff", { z: -3.0, tex: K.ctex("wallpaper", { a: "#c8efdc", b: "#b4e4cd", n: 8, rep: [7, 2] }), parent: lab });
  K.box(16, 1.0, 0.24, "#2fa38a", { z: -2.92, parent: lab });
  K.plane(1.8, 1.4, K.ctex("sky", { top: "#3a9cf2", bottom: "#d6f0ff", w: 256, h: 256, clouds: 3, seed: 6 }), { x: -2.4, y: 2.45, z: -2.88, parent: lab });
  K.box(2.0, 0.12, 0.2, "#ffffff", { x: -2.4, y: 1.7, z: -2.86, parent: lab }); K.box(0.1, 1.4, 0.08, "#ffffff", { x: -2.4, y: 1.75, z: -2.85, parent: lab });
  // shelves with jars
  for (const y of [1.6, 2.3]) {
    K.box(1.8, 0.06, 0.4, "#a8693a", { x: 3.0, y, z: -2.7, parent: lab });
    ["#ff6f61", "#ffd23f", "#3ec1ff", "#7ad151", "#b48ee8"].forEach((c, i) => K.cyl(0.11, 0.11, 0.26 + (i % 2) * 0.08, c, { x: 2.3 + i * 0.35, y: y + 0.06, z: -2.68, parent: lab }));
  }
  K.box(3.8, 0.9, 1.1, "#ffffff", { z: -1.7, tex: K.ctex("planks", { a: "#e2a865", b: "#d39555", n: 4, rep: [2, 1] }), parent: lab });
  K.box(3.9, 0.06, 1.2, "#f4efe4", { y: 0.88, z: -1.7, parent: lab });
  // the training box: open front, the target photo on its back wall
  const BOXC = "#cfe0ef", BT = 0.94;
  K.box(1.0, 0.76, 0.05, BOXC, { y: BT, z: -2.18, parent: lab });
  for (const s of [-1, 1]) K.box(0.05, 0.76, 0.8, BOXC, { x: s * 0.5, y: BT, z: -1.8, parent: lab });
  K.box(1.06, 0.05, 0.86, BOXC, { y: BT + 0.76, z: -1.8, parent: lab });
  K.box(1.06, 0.06, 0.06, "#3f7fd0", { y: BT + 0.74, z: -1.39, parent: lab });
  const targetTex = ctx(512, 400, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 400); seaBack(g, 22, 22, 468, 356, 0.4); drawShip(g, 256, 214, 1.15); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(22, 22, 468, 356); });
  K.plane(0.62, 0.48, targetTex, { x: -0.1, y: 1.3, z: -2.15, parent: lab });
  const hitRing = K.plane(0.44, 0.44, crossGreen, { x: -0.1, y: 1.3, z: -2.14, parent: lab });
  const labStars = stars(6, { x: -0.1, y: 1.32, z: -2.0, r: 0.42, s: 0.16 }, lab);
  const pTrain = pigeon({ x: 0.15, y: BT, z: -1.72, ry: 205, s: 1.0, parent: lab });
  // grain hopper: funnel on the roof, a tube down to a tray, grains that drop when the bird is rewarded
  K.cone(0.14, 0.22, "#f2c230", { x: 0.33, y: BT + 1.03, z: -1.62, rz: 180, parent: lab });
  K.cyl(0.025, 0.025, 0.62, "#9aa3ad", { x: 0.33, y: 1.08, z: -1.62, parent: lab });
  K.cyl(0.1, 0.09, 0.04, "#d9dde2", { x: 0.33, y: BT, z: -1.55, parent: lab });
  const grains = Array.from({ length: 7 }, (_, i) => K.sphere(0.018, "#f2c230", { x: 0.33 + (i % 3 - 1) * 0.03, y: 1.06, z: -1.55 + (i % 2) * 0.02, parent: lab }));
  // peck counter and a wall clock
  K.slab(0.66, 0.38, 0.26, 0.05, "#2f3a4a", { x: 1.2, y: BT, z: -1.7, parent: lab });
  const cntCv = document.createElement("canvas"); cntCv.width = 512; cntCv.height = 200;
  const cntTex = new T3.CanvasTexture(cntCv); cntTex.colorSpace = T3.NoColorSpace;
  let cntLast = -1;
  function setCount(n) {
    n = Math.round(n);
    if (n === cntLast) return;
    cntLast = n;
    const g = cntCv.getContext("2d");
    g.fillStyle = "#1d2430"; g.fillRect(0, 0, 512, 200);
    const s = String(n).padStart(5, "0");
    txt(g, s.slice(0, 2) + "," + s.slice(2), 256, 108, 150, n >= 10000 ? "#ffd84d" : "#7dffb0", { font: TYPE, weight: 700 });
    cntTex.needsUpdate = true;
  }
  setCount(0);
  K.plane(0.56, 0.22, cntTex, { x: 1.2, y: BT + 0.19, z: -1.52, parent: lab });
  K.plane(0.56, 0.12, sign(512, 110, [{ text: "PECKS", size: 80, y: 58, color: "#ffffff" }], { bg: "#3f7fd0" }), { x: 1.2, y: BT + 0.5, z: -1.6, parent: lab });
  const labClock = K.clock(0.34, { x: 1.2, y: 2.35, z: -2.86, parent: lab, rim: "#3f7fd0" });
  const setM = (c, M) => c.userData.set(Math.floor(M / 60) % 12, M % 60);
  const sciLab = K.toon("sci_lab", Object.assign({ x: -1.0, z: -0.85, face: "happy", parent: lab }, SCI));
  // Skinner's desk in the corner: a typewriter and his write-up
  K.box(1.6, 0.74, 0.8, "#ffffff", { x: 6.0, z: -1.35, tex: K.ctex("planks", { a: "#b8763f", b: "#a8693a", n: 4, rep: [1, 1] }), parent: lab });
  K.slab(0.56, 0.16, 0.42, 0.05, "#2f6b4f", { x: 6.0, y: 0.74, z: -1.4, parent: lab });
  K.cyl(0.05, 0.05, 0.6, INK, { x: 6.0, y: 0.95, z: -1.55, rz: 90, center: true, parent: lab });
  const paperTex = ctx(512, 680, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 680);
    txt(g, "Pigeons", 256, 90, 64, INK, { font: TYPE, weight: 700 }); txt(g, "in a Pelican", 256, 160, 56, INK, { font: TYPE, weight: 700 });
    g.fillStyle = "#9aa3ad"; for (let i = 0; i < 9; i++) g.fillRect(60, 240 + i * 46, 300 + ((i * 97) % 120), 12);
  });
  const paper = K.plane(0.4, 0.53, paperTex, { x: 6.0, y: 1.2, z: -1.6, rx: -12, parent: lab });
  K.cyl(0.08, 0.12, 0.36, "#ffd23f", { x: 6.6, y: 0.74, z: -1.5, parent: lab }); K.cone(0.2, 0.2, "#ff6f61", { x: 6.6, y: 1.1, z: -1.5, parent: lab });
  const sciType = K.toon("sci_type", Object.assign({ x: 6.0, y: 0.06, z: -2.0, face: "determined", parent: lab }, SCI));
  const pDeskL = pigeon({ x: 5.45, y: 0.74, z: -1.3, ry: 60, s: 0.7, parent: lab });

  // ================================================================== HANGAR (the Pelican, and a cut-away of its nose)
  const hg = K.set("hangar", { bg: "#ffeccc", sunPos: [-5, 11, 9], shadow: 12, hemiI: 1.95 });
  K.box(30, 0.1, 20, "#ffffff", { y: -0.1, tex: K.ctex("tiles", { a: "#ece6da", b: "#e0d8c8", n: 4, rep: [10, 7] }), parent: hg });
  for (const x of [-6, 9]) K.box(0.25, 0.012, 12, "#f2c230", { x, parent: hg, cast: false });
  K.box(30, 9, 0.3, "#ffffff", { z: -7, tex: K.ctex("stripes", { cols: ["#a8d0ee", "#93c2e6"], n: 16, vertical: true, w: 256, h: 64, rep: [6, 1] }), parent: hg });
  K.box(30, 0.9, 0.34, "#ffffff", { z: -6.98, tex: K.ctex("stripes", { cols: ["#f2c230", "#2a2a33"], n: 16, vertical: true, w: 256, h: 64, rep: [10, 1] }), parent: hg });
  K.plane(5.2, 5.0, K.ctex("sky", { top: "#3a9cf2", bottom: "#e8f6ff", w: 512, h: 512, clouds: 4, seed: 12 }), { x: -4.6, y: 3.4, z: -6.8, parent: hg });
  K.box(5.6, 0.3, 0.4, "#5a6170", { x: -4.6, y: 5.9, z: -6.78, parent: hg });
  for (const s of [-1, 1]) K.box(0.3, 6.0, 0.4, "#5a6170", { x: -4.6 + s * 2.75, z: -6.78, parent: hg });
  for (const x of [-2.5, 2, 6.5]) { K.cyl(0.015, 0.015, 2.5, INK, { x, y: 5.6, z: -2, parent: hg, cast: false }); K.cone(0.45, 0.4, "#ff8a3d", { x, y: 5.3, z: -2, parent: hg, cast: false }); K.sphere(0.14, "#fff3b0", { x, y: 5.28, z: -2, mat: { basic: true }, parent: hg }); }
  [[-3.0, "#3ec1ff"], [-3.6, "#ff6f61"]].forEach(([x, c], i) => K.cyl(0.32, 0.32, 0.9, c, { x, z: -3.6 - i * 0.7, parent: hg }));
  [[7.6, -3.2, 1.0, "#ffd23f"], [8.4, -4.2, 0.8, "#e8604c"], [7.9, -3.4, 0.6, "#7ad151"]].forEach(([x, z, s, c], i) => K.box(s, s, s, c, { x, z, y: i === 2 ? 1.0 : 0, parent: hg }));
  // trolley + bomb
  K.box(2.2, 0.32, 0.9, "#e8604c", { y: 0.22, z: -1.6, parent: hg });
  for (const x of [-0.8, 0.8]) for (const s of [-1, 1]) K.cyl(0.14, 0.14, 0.08, INK, { x, y: 0.14, z: -1.6 + s * 0.42, rx: 90, center: true, parent: hg });
  for (const x of [-0.6, 0.6]) K.box(0.16, 0.22, 0.5, "#c4342a", { x, y: 0.54, z: -1.6, parent: hg });
  const bombH = pelican({ y: 1.1, z: -1.6, parent: hg });
  void bombH;
  const pNose = pigeon({ x: 1.42, y: 1.42, z: -1.6, ry: 60, s: 1.0, parent: hg });
  const sciH = K.toon("sci_hangar", Object.assign({ x: -0.8, z: -0.2, face: "proud", turn: 25, parent: hg }, SCI));
  // the cut-away nose on a test stand: three stacked compartments, each with a screen and a pigeon
  const nc = new T3.Group(); nc.position.set(4.6, 0, -1.8); hg.add(nc);
  const R = 0.66, HC = 0.74, Y0 = 0.5, HALF = { open: true, t0: Math.PI / 2, tl: Math.PI };
  K.cyl(0.78, 0.88, Y0, "#e8604c", { parent: nc });
  dbl(K.cyl(R, R, 3 * HC, OLIVE, Object.assign({ y: Y0, mat: { side: T3.DoubleSide }, parent: nc }, HALF)));
  dbl(K.cyl(0.0001, R, 0.95, OLIVE, Object.assign({ y: Y0 + 3 * HC, mat: { side: T3.DoubleSide }, parent: nc }, HALF)));
  for (let k = 0; k <= 3; k++) K.cyl(R - 0.01, R - 0.01, 0.04, "#f6ecd2", { y: Y0 + k * HC - 0.02, t0: Math.PI / 2, tl: Math.PI, parent: nc });
  for (const s of [-1, 1]) K.box(0.05, 3 * HC, 0.05, "#f2c230", { x: s * R, y: Y0, parent: nc });
  dbl(K.cyl(R + 0.01, R + 0.01, 0.1, "#f2c230", Object.assign({ y: Y0 + 2.1 * HC }, HALF, { open: true, parent: nc, mat: { side: T3.DoubleSide } })));
  const nScreens = [0, 1, 2].map((k) => screen(0.34, 0.26, { x: -0.22, y: Y0 + k * HC + 0.42, z: -0.5, ry: 18, parent: nc }));
  const nBirds = [0, 1, 2].map((k) => pigeon({ x: 0.2, y: Y0 + k * HC + 0.02, z: -0.2, ry: -132, s: 1.0, parent: nc }));
  const tallyTex = ctx(640, 520, (g) => {
    g.fillStyle = "#ffffff"; rrect(g, 10, 10, 620, 500, 40); g.fill(); g.lineWidth = 14; g.strokeStyle = INK; g.stroke();
    txt(g, "VOTE", 320, 80, 80, "#3f7fd0");
    const chk = (x, y) => { g.strokeStyle = "#2fbf5a"; g.lineWidth = 30; g.beginPath(); g.moveTo(x - 50, y); g.lineTo(x - 12, y + 40); g.lineTo(x + 56, y - 46); g.stroke(); };
    chk(140, 220); chk(320, 220);
    g.strokeStyle = "#ff3b3b"; g.lineWidth = 30; g.beginPath(); g.moveTo(450, 175); g.lineTo(540, 265); g.moveTo(540, 175); g.lineTo(450, 265); g.stroke();
    txt(g, "2 – 1", 320, 410, 150, INK, { stroke: "#ffd84d", sw: 10 });
  });
  const tally = K.plane(0.8, 0.65, tallyTex, { x: 5.45, y: 2.0, z: -0.7, ry: -10, parent: hg });
  K.cyl(0.03, 0.03, 1.68, "#5a6170", { x: 5.45, z: -0.75, parent: hg });
  const qWrong = K.plane(0.3, 0.3, bubble("?"), { x: 5.05, y: Y0 + 0.62, z: -1.6, parent: hg });
  const hgStars = stars(7, { x: 4.6, y: 2.2, z: -1.0, r: 0.95, s: 0.24 }, hg);

  // ================================================================== COCKPIT (inside the nose: lens -> screen -> pecks)
  const ck = K.set("cockpit", { bg: "#f3e6c0", sunPos: [3, 8, 6], shadow: 5, hemiI: 2.0 });
  dbl(K.cyl(1.7, 1.7, 3.4, "#ffffff", { y: -0.3, open: true, tex: K.ctex("dots", { a: "#e9dcab", b: "#c9b984", n: 10, r: 0.08, rep: [8, 3] }), mat: { side: T3.BackSide }, parent: ck, seg: 48 }));
  K.box(3.6, 0.06, 3.6, "#ffffff", { y: 0.24, tex: K.ctex("tiles", { a: "#b9a775", b: "#a8965f", n: 4, rep: [4, 4] }), parent: ck });
  for (const y of [0.55, 2.15]) K.torus(1.68, 0.035, "#c9971f", { y, rx: 90, parent: ck });
  const ckScr = screen(1.0, 0.78, { x: -0.05, y: 1.08, z: -0.95, parent: ck });
  const ckReveal = revealer(1.0, 0.78, scrFull, { x: -0.05, y: 1.08, z: -0.935, parent: ck });
  K.box(0.1, 0.7, 0.1, "#5a6170", { x: -0.05, y: 0.25, z: -1.0, parent: ck });
  const lensG = new T3.Group(); lensG.position.set(-0.05, 2.25, -1.25); ck.add(lensG);
  K.torus(0.24, 0.05, "#c9971f", { parent: lensG });
  K.sphere(0.22, "#cfeeff", { sz: 0.4, mat: { basic: true }, parent: lensG });
  const beam = K.cone(0.46, 0.95, "#fff3b0", { x: -0.05, y: 1.3, z: -1.1, noink: true, cast: false, receive: false, mat: { basic: true, transparent: true, opacity: 0.28 }, parent: ck });
  K.box(0.5, 0.34, 0.44, "#7a5a3a", { x: 0.32, y: 0.24, z: -0.55, parent: ck });
  const pCk = pigeon({ x: 0.3, y: 0.58, z: -0.62, ry: 196, s: 1.25, parent: ck });

  // ================================================================== SKY (the glide bomb over the sea, steering back)
  const sk = K.set("sky", { bg: "#9fd4fb", fog: ["#d8eeff", 40, 170], sunPos: [10, 22, 12], shadow: 30 });
  K.sky(sk, { top: "#2f8ff0", mid: "#8fd0ff", bottom: "#e8f6ff", seed: 23 });
  const waveT = ctx(256, 256, (g) => { g.fillStyle = "#2f8fd8"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#6fbaf0"; g.lineWidth = 6; const r = rng(5); for (let k = 0; k < 14; k++) { const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 16, y - 8, x + 32, y); g.stroke(); } });
  waveT.wrapS = waveT.wrapT = T3.RepeatWrapping; waveT.repeat.set(80, 80);
  K.box(400, 0.1, 400, "#ffffff", { y: -0.1, tex: waveT, parent: sk });
  const shipG = new T3.Group(); shipG.position.set(-2, 0, -58); sk.add(shipG);
  K.slab(16, 2.2, 3.4, 0.6, "#7b8698", { y: -0.4, parent: shipG });
  K.box(16.2, 0.35, 3.5, "#e8402f", { y: -0.3, parent: shipG });
  K.box(4.2, 1.8, 2.6, "#eef1f5", { x: -0.5, y: 1.8, parent: shipG }); K.box(2.2, 1.0, 2.0, "#eef1f5", { x: -0.2, y: 3.6, parent: shipG });
  K.cyl(0.55, 0.6, 2.4, "#2a2a33", { x: 3.2, y: 1.8, parent: shipG }); K.cyl(0.62, 0.62, 0.5, "#e8402f", { x: 3.2, y: 3.7, parent: shipG });
  K.cyl(0.08, 0.08, 4.5, "#2a2a33", { x: -5.2, y: 1.8, parent: shipG });
  [[-30, -90], [24, -110], [-60, -40], [50, -60]].forEach(([x, z], i) => K.ico(1.6 + i * 0.4, "#ffffff", { x, y: 14 + i * 3, z, detail: 1, sx: 3, parent: sk, cast: false }));
  const bombS = pelican({ parent: sk });

  // ================================================================== OFFICE (the government: eccentric, impractical, $25,000)
  const off = K.set("office", { bg: "#e8f0ff", sunPos: [-4, 9, 9], shadow: 8, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("planks", { a: "#e2a865", b: "#d39555", n: 6, rep: [3, 2] }), parent: off });
  K.box(14, 4.4, 0.2, "#ffffff", { z: -3.1, tex: K.ctex("wallpaper", { a: "#cfe0ff", b: "#bcd2fa", n: 8, rep: [6, 2] }), parent: off });
  K.box(14, 1.0, 0.24, "#3b6db4", { z: -3.02, parent: off });
  K.plane(2.0, 1.5, K.ctex("sky", { top: "#3a9cf2", bottom: "#d6f0ff", w: 256, h: 256, clouds: 3, seed: 9 }), { x: 1.9, y: 2.5, z: -2.98, parent: off });
  K.box(2.2, 0.12, 0.2, "#ffffff", { x: 1.9, y: 1.68, z: -2.92, parent: off }); K.box(0.1, 1.5, 0.08, "#ffffff", { x: 1.9, y: 1.75, z: -2.94, parent: off });
  K.box(0.9, 1.6, 0.6, "#5fae7a", { x: -2.6, z: -2.6, parent: off });
  for (const y of [0.4, 0.9, 1.4]) K.box(0.5, 0.06, 0.02, "#d9dde2", { x: -2.6, y, z: -2.29, parent: off });
  K.tree({ x: 3.2, z: -2.4, s: 0.55, leaf: "#4fb35a", parent: off });
  K.box(2.6, 0.06, 1.1, "#a8693a", { y: 0.74, z: -1.1, parent: off });
  K.box(2.5, 0.74, 0.06, "#8a5530", { z: -0.6, parent: off });
  for (const s of [-1, 1]) K.box(0.06, 0.74, 1.0, "#8a5530", { x: s * 1.22, z: -1.1, parent: off });
  const official = K.toon("official", { outfit: "#3a4a7a", tie: "#d8443a", hair: "#9a9aa4", hairCut: 0.26, moustache: true, h: 1.82, x: 0, z: -1.85, face: "neutral", parent: off });
  const rubber = new T3.Group(); K.cyl(0.04, 0.05, 0.14, "#a8693a", { parent: rubber, y: 0.03 }); K.box(0.16, 0.05, 0.1, "#c4342a", { parent: rubber, y: -0.02 });
  official.hold(rubber, "R", [0, -0.04, 0.04]);
  const propTex = ctx(512, 660, (g) => {
    g.fillStyle = "#fffdf4"; g.fillRect(0, 0, 512, 660);
    txt(g, "PROPOSAL", 256, 70, 60, INK, { font: TYPE, weight: 700 });
    txt(g, "Pigeon guidance", 256, 140, 40, INK, { font: TYPE, weight: 700 }); txt(g, "for a glide bomb", 256, 186, 40, INK, { font: TYPE, weight: 700 });
    g.fillStyle = "#b8bec8"; for (let i = 0; i < 8; i++) g.fillRect(60, 250 + i * 44, 280 + ((i * 71) % 110), 12);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(400, 560, 50, 34, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(440, 528, 18, 0, 7); g.stroke();
  });
  K.plane(0.62, 0.8, propTex, { y: 0.803, z: -1.0, rx: -90, parent: off });
  const stampTex = (s, c) => ctx(768, 220, (g) => { g.strokeStyle = c; g.lineWidth = 16; rrect(g, 12, 12, 744, 196, 26); g.stroke(); txt(g, s, 384, 114, 130, c, { max: 680 }); });
  const stE = K.plane(0.62, 0.18, stampTex("ECCENTRIC", "#e8402f"), { y: 0.806, z: -1.12, rx: -90, rz: 12, parent: off });
  const stI = K.plane(0.66, 0.19, stampTex("IMPRACTICAL", "#e8402f"), { y: 0.807, z: -0.86, rx: -90, rz: -8, parent: off });
  const chequeTex = ctx(768, 340, (g) => {
    g.fillStyle = "#dff3df"; g.fillRect(0, 0, 768, 340); g.strokeStyle = "#2f8f4e"; g.lineWidth = 14; g.strokeRect(12, 12, 744, 316);
    txt(g, "PAY", 110, 90, 54, "#2f8f4e"); txt(g, "$25,000", 440, 170, 150, INK, { stroke: "#ffd84d", sw: 8 });
    txt(g, "pigeon research", 420, 280, 46, "#2f8f4e", { font: SERIF, weight: 700 });
  });
  const cheque = K.plane(0.72, 0.32, chequeTex, { y: 0.81, z: -1.3, rx: -90, parent: off });
  const sciO = K.toon("sci_office", Object.assign({ x: 1.5, z: -1.15, face: "happy", turn: -20, parent: off }, SCI));
  dbl(K.cyl(0.25, 0.2, 0.55, "#5a7fb8", { x: -1.65, z: -0.35, open: true, mat: { side: T3.DoubleSide }, parent: off }));
  K.cyl(0.2, 0.2, 0.02, "#4a6fa5", { x: -1.65, z: -0.35, parent: off });
  const folderTex = ctx(512, 380, (g) => { g.fillStyle = "#e8c27a"; g.fillRect(0, 0, 512, 380); g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(5, 5, 502, 370); g.fillStyle = "#fffdf4"; g.fillRect(90, 120, 332, 140); g.strokeRect(90, 120, 332, 140); txt(g, "PROJECT", 256, 165, 52, INK); txt(g, "PIGEON", 256, 222, 56, "#e8402f"); });
  const folder = K.box(0.5, 0.04, 0.38, "#e8c27a", { y: 0.8, x: -0.8, z: -1.0, parent: off });
  const folderTop = K.plane(0.5, 0.38, folderTex, { y: 0.042, rx: -90, parent: folder });
  void folderTop;
  const pDesk = pigeon({ x: -0.42, y: 0.8, z: -0.78, ry: -35, s: 0.75, parent: off });

  // ================================================================== DEMO (the committee watches a live pigeon do it)
  const dm = K.set("demo", { bg: "#fff0e0", sunPos: [3, 9, 9], shadow: 9, hemiI: 2.0 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("dots", { a: "#d65a48", b: "#e8735e", n: 6, r: 0.14, rep: [10, 7] }), parent: dm });
  K.box(14, 4.4, 0.2, "#ffffff", { z: -3.6, tex: K.ctex("planks", { a: "#ecbd86", b: "#e2ad74", n: 8, rep: [3, 2] }), parent: dm });
  K.box(14, 1.1, 0.24, "#8a5530", { z: -3.52, parent: dm });
  K.plane(2.4, 1.6, K.ctex("sky", { top: "#3a9cf2", bottom: "#d6f0ff", w: 256, h: 256, clouds: 3, seed: 15 }), { x: -2.2, y: 2.6, z: -3.48, parent: dm });
  K.box(2.6, 0.12, 0.2, "#ffffff", { x: -2.2, y: 1.74, z: -3.42, parent: dm }); K.box(0.1, 1.6, 0.08, "#ffffff", { x: -2.2, y: 1.8, z: -3.44, parent: dm });
  K.clock(0.3, { x: 1.6, y: 2.9, z: -3.45, parent: dm, rim: "#8a5530" });
  K.box(4.8, 0.06, 1.1, "#a8693a", { y: 0.74, z: -1.9, parent: dm });
  K.box(4.8, 0.72, 0.05, "#3f8f5a", { z: -1.37, parent: dm });
  for (const s of [-1, 1]) K.box(0.05, 0.72, 1.0, "#3f8f5a", { x: s * 2.38, z: -1.9, parent: dm });
  const COM = [["#3a4a7a", "#ffd23f", "#9a9aa4", true], ["#6b4a32", "#3ec1ff", "#2a2028", false], ["#4a5a4a", "#ff6f61", "#c8c8d0", true], ["#7a3a4a", "#7ad151", "#5a3b2a", false]];
  const committee = COM.map(([c, tie, hair, mo], i) => {
    const x = -1.7 + i * 1.13;
    K.box(0.62, 1.25, 0.12, "#8a2f3a", { x, z: -3.05, parent: dm });
    return K.toon(`com${i}`, { outfit: c, tie, hair, hairCut: 0.27, moustache: mo, h: 1.8, x, y: 0.14, z: -2.62, face: "neutral", parent: dm });
  });
  committee.forEach((a) => a.pose("sit"));
  // the simulator: a cage on a stand, a screen inside, a green ON TARGET lamp; a cloth covers it at first
  K.box(0.58, 0.92, 0.58, "#e8604c", { z: -0.25, parent: dm });
  K.box(0.86, 0.04, 0.66, "#d9dde2", { y: 0.92, z: -0.25, parent: dm });
  for (const x of [-0.41, 0.41]) for (const z of [-0.55, 0.05]) K.box(0.03, 0.62, 0.03, "#d9dde2", { x, y: 0.94, z, parent: dm });
  for (const z of [-0.55, 0.05]) K.box(0.86, 0.03, 0.03, "#d9dde2", { y: 1.55, z, parent: dm });
  for (const x of [-0.41, 0.41]) K.box(0.03, 0.03, 0.63, "#d9dde2", { x, y: 1.55, z: -0.25, parent: dm });
  const dmScr = screen(0.34, 0.26, { x: -0.26, y: 1.2, z: -0.3, ry: 62, parent: dm });
  const pDemo = pigeon({ x: 0.1, y: 0.94, z: -0.22, ry: -98, s: 0.8, parent: dm });
  const lampOn = K.sphere(0.07, "#3ddc6a", { y: 1.63, z: -0.25, mat: { basic: true }, parent: dm });
  const lampOff = K.sphere(0.07, "#4a4a52", { y: 1.63, z: -0.25, parent: dm });
  const cloth = K.cyl(0.62, 0.66, 0.84, "#7a4ab8", { y: 0.92, z: -0.25, parent: dm });
  const dmStars = stars(6, { x: -0.1, y: 1.35, z: 0.1, r: 0.45, s: 0.16 }, dm);
  // a basin with a paper boat, on a little table
  K.cyl(0.05, 0.05, 0.7, "#8a5530", { x: 1.3, z: -0.35, parent: dm }); K.cyl(0.45, 0.45, 0.04, "#a8693a", { x: 1.3, y: 0.7, z: -0.35, parent: dm });
  dbl(K.cyl(0.36, 0.3, 0.2, "#f4f6f8", { x: 1.3, y: 0.74, z: -0.35, open: true, mat: { side: T3.DoubleSide }, parent: dm }));
  K.cyl(0.35, 0.35, 0.01, "#3a9be0", { x: 1.3, y: 0.89, z: -0.35, parent: dm });
  const boat = new T3.Group(); boat.position.set(1.3, 0.9, -0.35); boat.scale.setScalar(1.35); dm.add(boat);
  K.roof(0.3, 0.1, 0.13, "#ffffff", { rz: 180, y: 0.1, parent: boat });
  K.roof(0.16, 0.16, 0.01, "#ffffff", { y: 0.1, parent: boat });
  K.plane(0.2, 0.05, sign(512, 128, [{ text: "PIGEON", size: 96, y: 66, color: "#e8402f" }], { bg: "#ffffff" }), { y: 0.055, z: 0.067, parent: boat });
  const bubs = Array.from({ length: 5 }, (_, i) => K.sphere(0.012, "#ffffff", { x: 1.3 + (i - 2) * 0.05, y: 0.9, z: -0.35 + (i % 2) * 0.04, parent: dm }));

  // ================================================================== DOCK (the Navy revives it: ORCON, 1948 -> 1953)
  const dk = K.set("dock", { bg: "#a8dcff", fog: ["#dff1ff", 25, 90], sunPos: [6, 12, 10], shadow: 12 });
  K.sky(dk, { top: "#3a9cf2", mid: "#97d3fb", bottom: "#eaf7ff", seed: 31 });
  const waveD = waveT.clone(); waveD.needsUpdate = true; waveD.repeat.set(50, 50);
  K.box(200, 0.1, 200, "#ffffff", { y: -0.8, tex: waveD, parent: dk });
  K.box(12, 0.7, 5.2, "#ffffff", { y: -0.7, z: 0.4, tex: K.ctex("planks", { a: "#c98d55", b: "#b8763f", n: 8, rep: [3, 1] }), parent: dk });
  for (const x of [-3.5, 0, 3.5]) K.cyl(0.14, 0.18, 0.4, "#2f3a4a", { x, z: -2.0, parent: dk });
  const navy = new T3.Group(); navy.position.set(1.5, -0.8, -9); dk.add(navy);
  K.slab(26, 4.0, 4.4, 1.0, "#ffffff", { tex: K.ctex("dots", { a: "#8f9bab", b: "#2f3a4a", n: 16, r: 0.06, rep: [4, 1] }), parent: navy });
  K.box(26.2, 0.5, 4.5, "#e8402f", { y: 0.2, parent: navy });
  K.box(6, 2.4, 3, "#a9b4c3", { x: -2, y: 4.0, parent: navy }); K.box(3, 1.4, 2.4, "#a9b4c3", { x: -1.5, y: 6.4, parent: navy });
  K.cyl(0.08, 0.08, 5, "#2f3a4a", { x: -1.5, y: 7.8, parent: navy }); K.cyl(0.7, 0.7, 2.2, "#5a6170", { x: 2.5, y: 4.0, parent: navy });
  const crateT = K.ctex("planks", { a: "#d9a35a", b: "#c99550", n: 4, rep: [1, 1] });
  K.box(0.9, 0.7, 0.7, "#ffffff", { x: -0.3, z: -0.4, tex: crateT, parent: dk });
  K.plane(0.62, 0.22, sign(512, 180, [{ text: "ORCON", size: 120, y: 96, color: "#2a2a33" }], { bg: "#d9a35a" }), { x: -0.3, y: 0.38, z: -0.044, parent: dk });
  const lid = new T3.Group(); lid.position.set(-0.3, 0.7, -0.75); dk.add(lid);
  K.box(0.94, 0.06, 0.74, "#ffffff", { z: 0.37, tex: crateT, parent: lid });
  const pCrate = pigeon({ x: -0.3, y: 0.1, z: -0.4, ry: 20, s: 0.8, parent: dk });
  const dkScr = screen(0.34, 0.26, { x: 0.28, y: 1.0, z: -0.62, ry: -42, parent: dk });
  K.cyl(0.03, 0.03, 0.87, "#5a6170", { x: 0.28, y: 0, z: -0.62, parent: dk });
  const SAIL = { outfit: "#f8f8f8", scarf: "#1f3a6a", hat: "cap", hatc: "#ffffff", hatband: "#1f3a6a", h: 1.74 };
  const sl1 = K.toon("sailor1", Object.assign({ x: -0.8, z: 0.6, face: "happy", hair: "#5a3b2a", parent: dk }, SAIL));
  const sl2 = K.toon("sailor2", Object.assign({ x: 1.7, z: -0.2, face: "happy", hair: "#2a2028", moustache: true, parent: dk }, SAIL));
  const yearTex = {};
  for (let y = 1948; y <= 1953; y++) yearTex[y] = sign(512, 400, [{ text: "YEAR", size: 56, y: 70, color: "#ffffff" }, { text: String(y), size: 170, y: 250, color: INK }], { bg: "#ffffff" });
  const yb = new T3.Group(); yb.position.set(0.75, 0, -1.5); dk.add(yb);
  K.cyl(0.04, 0.04, 1.2, "#5a6170", { parent: yb });
  K.box(1.0, 0.82, 0.06, "#3f7fd0", { y: 1.0, z: -0.04, parent: yb });
  const yearCard = K.plane(0.9, 0.7, yearTex[1948], { y: 1.41, z: 0.0, parent: yb });
  const flipPv = new T3.Group(); flipPv.position.set(0, 1.76, 0.01); yb.add(flipPv);
  const flipCard = K.plane(0.9, 0.7, yearTex[1948], { y: -0.35, parent: flipPv });

  // ================================================================== STAGE (2024: a prize, a trophy, no people)
  const stg = K.set("stage", { bg: "#3a2050", sunPos: [2, 10, 8], shadow: 8, hemiI: 1.9 });
  K.box(14, 0.1, 10, "#ffffff", { y: -0.1, tex: K.ctex("planks", { a: "#d9a066", b: "#c98d55", n: 6, rep: [3, 2] }), parent: stg });
  K.box(10, 0.4, 3.0, "#8a5530", { y: 0, z: -0.6, parent: stg });
  const curtT = K.ctex("stripes", { cols: ["#e0443f", "#c63436", "#d83c3c", "#b82e30"], n: 16, vertical: true, w: 256, h: 64, rep: [3, 1] });
  K.box(14, 6, 0.2, "#ffffff", { z: -2.4, tex: curtT, parent: stg });
  for (const s of [-1, 1]) K.box(1.6, 6, 0.3, "#ffffff", { x: s * 2.6, z: -1.6, tex: curtT, parent: stg });
  K.box(7, 0.7, 0.3, "#f2c230", { y: 4.1, z: -1.5, parent: stg });
  const banner = K.plane(2.2, 0.62, sign(1024, 290, [{ text: "2024", size: 230, y: 150, color: "#ffd84d", stroke: INK, sw: 14 }], { bg: "#5a2a7a", border: "#ffd84d", bw: 16 }), { y: 3.15, z: -2.25, parent: stg });
  void banner;
  K.cyl(0.42, 0.48, 0.9, "#f4f1ea", { y: 0.4, z: 0, parent: stg });
  K.cyl(0.5, 0.5, 0.06, "#f2c230", { y: 1.3, z: 0, parent: stg });
  const plaqueTex = ctx(768, 420, (g) => { g.fillStyle = "#2a1f3a"; rrect(g, 8, 8, 752, 404, 30); g.fill(); g.strokeStyle = "#ffd84d"; g.lineWidth = 14; g.stroke(); txt(g, "IG NOBEL", 384, 140, 140, "#ffd84d"); txt(g, "PEACE PRIZE", 384, 300, 110, "#ffffff"); });
  K.plane(0.62, 0.34, plaqueTex, { y: 1.1, z: 0.44, parent: stg });
  const trophy = new T3.Group(); trophy.position.set(0, 1.36, 0); stg.add(trophy);
  K.box(0.34, 0.12, 0.34, "#e0a820", { parent: trophy }); K.cyl(0.05, 0.08, 0.3, "#f2c230", { y: 0.12, parent: trophy });
  const miniBomb = pelican({ y: 0.5, s: 0.13, ry: -20, parent: trophy });
  void miniBomb;
  pigeon({ y: 0.54, s: 0.42, ry: 30, gold: true, parent: trophy });
  const tCloth = K.cone(0.4, 0.95, "#7a4ab8", { y: 1.32, parent: stg });
  const spot = K.cone(1.25, 5.0, "#fff3b0", { y: 0.4, noink: true, cast: false, receive: false, mat: { basic: true, transparent: true, opacity: 0.16 }, parent: stg });
  const pStage = pigeon({ x: 0.36, y: 1.36, z: 0.1, ry: -30, s: 0.55, parent: stg });
  const stgStars = stars(8, { x: 0, y: 2.0, z: 0.4, r: 0.75, s: 0.26 }, stg);
  const confetti = (() => { const r = rng(91); return Array.from({ length: 36 }, (_, i) => { const c = K.plane(0.07, 0.04, ["#ffd23f", "#ff5e7e", "#3ec1ff", "#7ad151", "#b48ee8"][i % 5], { x: -1.4 + r() * 2.8, y: 3, z: -0.3 + r() * 1.4, parent: stg, cast: false }); c.userData.v = 0.5 + r() * 0.6; c.userData.ph = r() * 6; c.userData.x0 = c.position.x; return c; }); })();

  // ================================================================== SHOTS
  const T = (l, wd, k, d) => w(l, wd, k) - (d == null ? 0.06 : d);
  const S = [];
  const add = (s) => S.push(s);
  const nPeck = (t, rate) => nBirds.forEach((b, i) => b.peck(pk(t, rate || 9, i * 1.9)));

  // l01 hook: In World War Two, (a pigeon perched on a glide bomb)
  add({ t0: 0, set: "hangar", fov: 50, cam: [[3.1, 1.3, 0.75], [2.6, 1.45, 0.2]], look: [[1.15, 1.45, -1.6], [1.25, 1.55, -1.6]], fn(t) {
    pNose.peck(pk(t, 7) * 0.5); pNose.head.rotation.y = Math.sin(t * 3) * 0.3;
    sciH.pose("present", t); sciH.set("proud");
  } });
  // ... a scientist trained pigeons
  add({ t0: T("l01", "a"), set: "lab", fov: 50, cam: [[1.3, 1.55, 2.6], [0.52, 1.485, 1.69]], look: [[-0.6, 1.2, -1.5], [-0.5, 1.2, -1.6]], fn(t) {
    sciLab.pose("pointL", t); sciLab.set("happy"); sciLab.turn = -15;
    pTrain.peck(pk(t, 8));
  } });
  // ... to steer a bomb, and in the tests, it actually worked. (close on the target: a hit)
  add({ t0: T("l01", "and"), set: "lab", fov: 46, cam: [[0.6, 1.48, -0.3], [0.348, 1.396, -0.748]], look: [[-0.1, 1.28, -2.1], [-0.1, 1.28, -2.1]], fn(t) {
    const hit = t > w("l01", "worked") - 0.05;
    pTrain.peck(hit ? pk(t, 6) * 0.3 : pk(t, 9));
    hitRing.visible = hit; popStars(labStars, w("l01", "worked"), t);
  } });
  // l02 You see, in 1940, (the train, birds alongside)
  add({ t0: T("l02", "you"), set: "train", fov: 50, cam: [[16.0, 1.1, -8.6], [13.8, 1.5, -8.0]], look: [[1.5, 2.4, -1], [0.8, 2.5, -1]], fn(t) {
    rollTrain(t); skS.turn = 0;
  } });
  // ... the psychologist B. F. Skinner was on a train,
  add({ t0: T("l02", "the"), set: "train", fov: 50, cam: [[2.75, 2.35, 0.85], [2.3, 2.3, 0.65]], look: [[0.75, 2.12, -0.9], [0.75, 2.18, -1.0]], fn(t) {
    rollTrain(t); skS.turn = 75; skS.pose("sit"); skS.set("neutral");
  } });
  // ... watching a flock of birds fly beside his window.
  add({ t0: T("l02", "watching"), set: "train", fov: 48, cam: [[2.0, 2.2, -6.3], [1.1, 2.35, -5.7]], look: [[0.9, 2.3, -1.3], [0.9, 2.38, -1.3]], fn(t) {
    rollTrain(t); skS.turn = 0; skS.pose("sit"); skS.set(t > w("l02", "birds") ? "happy" : "neutral");
  } });
  // l03 Sharp eyes, quick turns.
  add({ t0: T("l03", "sharp"), set: "train", fov: 40, cam: [[2.2, 3.4, -2.95], [1.8, 3.3, -2.85]], look: [[-0.1, 3.08, -2.8], [-0.1, 3.08, -2.8]], fn(t) {
    rollTrain(t);
    const b = flock[0], k = sm(w("l03", "quick") - 0.05, w("l03", "turns") + 0.25, t);
    b.body.rotation.z = Math.sin(k * Math.PI) * 0.6; b.head.rotation.y = Math.sin(k * Math.PI * 2) * 0.5;
    b.g.position.y = b.g.userData.y0 + Math.sin(k * Math.PI) * 0.12;
  } });
  // ... Could birds like that guide a missile?
  add({ t0: T("l03", "could"), set: "train", fov: 56, cam: [[2.55, 2.5, 1.1], [2.125, 2.5, 1.015]], look: [[0.85, 2.55, -0.6], [0.85, 2.58, -0.6]], fn(t) {
    rollTrain(t); skS.turn = 25; skS.pose("think", t); skS.set("determined");
    const k = pop(w("l03", "guide") - 0.1, 0.32, t); thinkB.visible = k > 0.01; thinkB.scale.setScalar(Math.max(0.01, k));
  } });
  // l04 So he taught pigeons to peck at a picture of a target, for a grain of food.
  add({ t0: T("l04", "so"), set: "lab", fov: 48, cam: [[1.45, 1.6, 1.7], [0.85, 1.45, 0.7]], look: [[-0.25, 1.15, -1.8], [0.1, 1.08, -1.7]], fn(t) {
    sciLab.pose(t < w("l04", "picture") ? "pointL" : "presentL", t); sciLab.set("talk"); sciLab.turn = -10;
    const g0 = w("l04", "grain") - 0.05;
    pTrain.peck(t < g0 ? pk(t, 8) : t < g0 + 0.3 ? 0 : pk(t - g0, 5) * 0.8);
    grains.forEach((gr, i) => { const k = sm(g0 + i * 0.03, g0 + 0.25 + i * 0.03, t); gr.position.y = 1.06 - k * 0.11; gr.visible = t > g0 - 0.02; });
  } });
  // l05 One bird pecked over ten thousand times in forty-five minutes. (counter + clock)
  add({ t0: T("l05", "one"), set: "lab", fov: 48, cam: [[2.25, 1.52, 1.45], [1.8, 1.52, 0.95]], look: [[0.85, 1.42, -2.0], [0.9, 1.45, -2.1]], fn(t) {
    pTrain.peck(pk(t, 16));
    setCount(10000 * sm(w("l05", "ten") - 0.1, w("l05", "times") + 0.25, t));
    setM(labClock, Math.round(45 * sm(w("l05", "forty") - 0.05, w("l05", "minutes") + 0.4, t)));
    sciLab.root.visible = false;
  } });
  // l06 Then he put three of them in the nose (they drop into the cut-away, one by one)
  add({ t0: T("l06", "then"), set: "hangar", fov: 50, cam: [[4.6, 1.95, 2.9], [4.6, 1.865, 1.965]], look: [[4.6, 1.75, -1.8], [4.6, 1.8, -1.8]], fn(t) {
    const ts = [w("l06", "three") - 0.05, w("l06", "them") - 0.02, w("l06", "nose") - 0.05];
    nBirds.forEach((b, i) => { const k = pop(ts[i], 0.28, t); b.g.visible = k > 0.001; b.g.position.y = b.g.userData.y0 + (1 - k) * 0.5; if (k < 1) b.fly(t * 14, 0.7, true); });
  } });
  // ... of a glide bomb called the Pelican.
  add({ t0: T("l06", "glide"), set: "hangar", fov: 52, cam: [[2.4, 0.75, 1.0], [1.7, 2.1, 1.75]], look: [[-0.4, 1.0, -1.6], [-0.5, 0.95, -1.6]], fn(t) {
    pNose.peck(pk(t, 6) * 0.4); sciH.root.visible = false;
  } });
  // l07 A lens showed them the view ahead. (inside the nose: the lens lights the screen)
  add({ t0: T("l07", "a"), set: "cockpit", fov: 50, cam: [[0.55, 1.25, 0.95], [0.6, 1.2, 0.9]], look: [[-0.05, 2.1, -1.15], [-0.05, 1.12, -0.95]], fn(t) {
    const k = sm(w("l07", "showed") - 0.05, w("l07", "view") + 0.15, t);
    ckReveal.userData.k(k); ckScr.visible = k >= 1; beam.visible = t > w("l07", "lens") - 0.05;
    pCk.head.rotation.y = 0.15 * Math.sin(t * 2);
  } });
  // ... When the target drifted off center, their pecking steered (the ship slides off; a peck pulls it back)
  add({ t0: T("l07", "when"), set: "cockpit", fov: 46, cam: [[0.78, 1.18, 0.75], [0.572, 1.128, 0.425]], look: [[-0.05, 1.06, -0.95], [-0.08, 1.06, -0.95]], fn(t) {
    ckReveal.visible = false;
    const dOff = sm(w("l07", "drifted"), w("l07", "center") + 0.15, t), p0 = w("l07", "pecking") - 0.08;
    const back = sm(p0 + 0.1, p0 + 0.4, t);
    ckScr.userData.aim(-0.3 * dOff * (1 - back), back > 0.98);
    pCk.peck(t > p0 ? pk(t - p0, 11) : 0); pCk.head.rotation.y = -0.35 * dOff * (1 - back);
  } });
  // ... the bomb back. (outside: the glide bomb banks back onto the ship)
  add({ t0: T("l07", "steered"), set: "sky", fov: 52, cam: [[4.4, 11.4, 9.8], [2.4, 9.7, -0.6]], look: [[1.3, 9.0, -2], [-0.2, 7.6, -12.4]], fn(t, u) {
    const e = ez(u);
    const b = L3([2.5, 10, 6], [0.6, 8.4, -4.6], e);
    bombS.g.position.set(b[0], b[1], b[2]);
    const k = sm(0.05, 0.75, u);
    bombS.g.rotation.set(0, (90 + 24 * (1 - k)) * D2R, 0); bombS.roll.rotation.x = 0.5 * (1 - k);
    waveT.offset.y = -u * 0.6;
  } });
  // l08 Three birds meant a vote. If one got it wrong, the other two outvoted it.
  add({ t0: T("l08", "three"), set: "hangar", fov: 52, cam: [[5.6, 1.6, 2.7], [5.08, 1.6, 1.985]], look: [[4.95, 1.5, -1.5], [5.0, 1.5, -1.5]], fn(t) {
    const wr0 = w("l08", "if") - 0.05, wr1 = w("l08", "outvoted") + 0.05;
    nBirds.forEach((b, i) => {
      if (i === 0 && t > wr0 && t < wr1) { b.g.rotation.y = (-132 + 95 * sm(wr0, wr0 + 0.2, t)) * D2R; b.peck(pk(t, 10)); }
      else if (i === 0 && t >= wr1) { b.g.rotation.y = (-132 + 95 * (1 - sm(wr1, wr1 + 0.25, t))) * D2R; b.peck(0.55); b.head.rotation.x = 0.3; }
      else b.peck(pk(t, 9, i * 1.9));
    });
    nScreens[0].userData.aim(t > wr0 && t < wr1 ? 0.22 : 0, false);
    const q = pop(w("l08", "wrong") - 0.1, 0.25, t) * (t < wr1 ? 1 : 0); qWrong.visible = q > 0.01; qWrong.scale.setScalar(Math.max(0.01, q));
    const k = pop(w("l08", "outvoted") - 0.05, 0.3, t); tally.visible = k > 0.01; tally.scale.setScalar(Math.max(0.01, k));
  } });
  // l09 The government thought it was eccentric and impractical, (stamps)
  add({ t0: T("l09", "the"), set: "office", fov: 48, cam: [[0.3, 2.3, 0.05], [0.09, 2.02, -0.412]], look: [[0, 0.8, -1.05], [0, 0.8, -1.05]], fn(t) {
    [[stE, w("l09", "eccentric")], [stI, w("l09", "impractical")]].forEach(([m, a]) => { const k = sm(a - 0.03, a + 0.1, t); m.visible = t > a - 0.03; m.scale.setScalar(2.0 - k); });
    const hitting = [w("l09", "eccentric"), w("l09", "impractical")].some((a) => t > a - 0.15 && t < a + 0.12);
    official.pose(hitting ? "hold" : "stand", t); official.set(t > w("l09", "eccentric") ? "smug" : "neutral");
    cheque.visible = false; sciO.root.visible = false; pDesk.g.visible = false;
  } });
  // ... but still paid twenty-five thousand dollars. (a cheque slides across)
  add({ t0: T("l09", "but"), set: "office", fov: 56, cam: [[-0.3, 1.72, 1.7], [-0.02, 1.692, 1.14]], look: [[0.6, 1.05, -1.0], [0.65, 1.1, -1.0]], fn(t) {
    stE.visible = stI.visible = true;
    const k = sm(w("l09", "still") - 0.05, w("l09", "twenty") + 0.2, t);
    cheque.visible = true; cheque.position.set(lerp(-0.25, 0.95, k), 0.81, lerp(-1.35, -1.0, k)); cheque.rotation.set(-Math.PI / 2, 0, lerp(0, -0.3, k));
    official.pose("shrug"); official.set("bored");
    const yay = t > w("l09", "dollars") - 0.08;
    sciO.pose(yay ? "cheer" : "stand", t); sciO.set(yay ? "laugh" : "happy"); pDesk.g.visible = false;
  } });
  // l10 Then came the big demonstration. A live pigeon did its job perfectly,
  add({ t0: T("l10", "then"), set: "demo", fov: 50, cam: [[1.3, 1.75, 4.2], [0.62, 1.38, 1.05]], look: [[0, 1.2, -1.5], [-0.1, 1.15, -0.25]], fn(t) {
    const k = sm(w("l10", "demonstration") - 0.05, w("l10", "demonstration") + 0.45, t);
    cloth.position.y = 0.92 + k * 2.6; cloth.visible = k < 0.98;
    pDemo.peck(t > w("l10", "live") ? pk(t, 9) : 0);
    const on = t > w("l10", "perfectly") - 0.05;
    dmScr.userData.aim(0, on); lampOn.visible = on; lampOff.visible = !on; popStars(dmStars, w("l10", "perfectly"), t);
    committee.forEach((a, i) => a.set(["neutral", "smug", "neutral", "bored"][i]));
  } });
  // ... right in front of the committee.
  add({ t0: T("l10", "right"), set: "demo", fov: 46, cam: [[2.9, 1.62, -1.25], [2.4, 1.57, -1.75]], look: [[-1.5, 1.2, -2.75], [-1.5, 1.22, -2.75]], fn(t) {
    cloth.visible = false; dmScr.userData.aim(0, true); lampOn.visible = true; lampOff.visible = false; pDemo.peck(pk(t, 9));
    committee.forEach((a, i) => a.set(["shock", "smug", "confused", "bored"][i]));
  } });
  // l11 And that's what sank it. (the paper boat goes down)
  add({ t0: T("l11", "and"), set: "demo", fov: 46, cam: [[2.2, 1.55, 0.95], [1.88, 1.47, 0.582]], look: [[1.0, 0.98, -1.0], [1.0, 0.96, -1.0]], fn(t) {
    cloth.visible = false; lampOn.visible = true; lampOff.visible = false; dmScr.userData.aim(0, true);
    const k = sm(w("l11", "sank") - 0.05, w("l11", "it") + 0.45, t);
    boat.position.y = 0.9 - k * 0.3; boat.rotation.set(0, 0, k * 0.5);
    bubs.forEach((b, i) => { const ph = clamp((t - w("l11", "sank") - i * 0.1) / 0.5, 0, 1); b.visible = ph > 0 && ph < 1; b.position.y = 0.9 + ph * 0.1; });
    committee.forEach((a, i) => a.set(["smug", "laugh", "smug", "neutral"][i]));
  } });
  // l12 Skinner wrote that seeing a real pigeon do it (at the typewriter)
  add({ t0: T("l12", "skinner"), set: "lab", fov: 48, cam: [[7.25, 1.5, 0.6], [6.69, 1.388, 0.04]], look: [[6.0, 1.08, -1.6], [6.0, 1.1, -1.65]], fn(t) {
    sciType.pose("type", t); sciType.set("determined");
    const k = sm(w("l12", "wrote"), w("l12", "it", 1) + 0.3, t); paper.position.y = 1.08 + k * 0.14;
    pDeskL.peck(pk(t, 3) * 0.4); pDeskL.head.rotation.y = 0.4;
  } });
  // ... only reminded them how crazy the idea sounded. (the committee laughs)
  add({ t0: T("l12", "only"), set: "demo", fov: 46, cam: [[-2.85, 1.66, -1.3], [-3.05, 1.5, -0.75]], look: [[1.5, 1.2, -2.75], [1.5, 1.22, -2.75]], fn(t) {
    cloth.visible = false; lampOn.visible = true; lampOff.visible = false; dmScr.userData.aim(0, true);
    const lol = t > w("l12", "crazy") - 0.1;
    committee.forEach((a, i) => { a.set(lol ? "laugh" : ["smug", "neutral", "smug", "laugh"][i]); a.pose(lol && i === 1 ? "sitslump" : "sit", t); a.st.bob = lol ? Math.abs(Math.sin(t * 13 + i)) * 0.04 : 0; a.update(); });
    pDemo.peck(0); pDemo.head.rotation.y = -0.6;
  } });
  // l13 The project was dropped. (the folder drops into the bin)
  add({ t0: T("l13", "the"), set: "office", cam: [[0.1, 1.6, 1.3], [-0.25, 1.488, 0.95]], look: [[-0.75, 0.78, -0.7], [-0.85, 0.72, -0.6]], fov: 54, fn(t) {
    stE.visible = stI.visible = true; cheque.visible = false; sciO.root.visible = false;
    const k = sm(w("l13", "was") - 0.05, w("l13", "dropped") + 0.3, t);
    folder.position.set(lerp(-0.8, -1.65, k), 0.8 + Math.sin(k * Math.PI) * 0.15 - k * k * 0.62, lerp(-1.0, -0.35, k)); folder.rotation.set(0, 0, -k * 1.2);
    official.pose("point", t); official.set("bored");
    pDesk.g.visible = true; pDesk.peck(0.35 * sm(w("l13", "dropped"), w("l13", "dropped") + 0.3, t)); pDesk.head.rotation.y = -0.5;
  } });
  // ... The Navy revived it in 1948, (a crate marked ORCON: a pigeon pops out)
  add({ t0: T("l13", "the", 1), set: "dock", fov: 54, cam: [[0.9, 1.05, 3.2], [0.51, 0.985, 2.42]], look: [[0.15, 0.85, -0.8], [0.15, 0.85, -0.8]], fn(t) {
    const r0 = w("l13", "revived") - 0.05, k = sm(r0, r0 + 0.3, t);
    lid.rotation.x = -k * 1.9;
    const up = pop(r0 + 0.15, 0.35, t); pCrate.g.position.y = 0.1 + up * 0.62; if (up < 1) pCrate.fly(t * 16, 0.8, true);
    const y = pop(w("l13", "1948") - 0.05, 0.3, t); yb.scale.setScalar(Math.max(0.01, y)); yb.visible = y > 0.01;
    sl1.pose(t > r0 ? "cheer" : "stand", t); sl1.set(t > r0 ? "laugh" : "happy"); sl2.pose("present", t);
  } });
  // ... and tested pigeons until 1953. (the year board flips; the bird pecks a screen)
  add({ t0: T("l13", "and"), set: "dock", fov: 50, cam: [[0.05, 1.32, 2.5], [0.4, 1.3, 2.2]], look: [[0.15, 1.0, -1.0], [0.2, 1.02, -1.1]], fn(t) {
    lid.rotation.x = -1.9; pCrate.g.position.y = 0.72; pCrate.g.rotation.y = 70 * D2R; pCrate.peck(pk(t, 9));
    const k = sm(w("l13", "tested"), w("l13", "1953") + 0.35, t), yr = 1948 + Math.round(k * 5);
    yearCard.material.map = yearTex[Math.min(1953, yr + 1)]; flipCard.material.map = yearTex[yr];
    flipPv.rotation.x = k > 0 && k < 1 ? -((k * 5) % 1) * 2.4 : 0; flipPv.visible = k > 0 && k < 1;
    if (k >= 1) yearCard.material.map = yearTex[1953];
    sl2.pose("think", t); sl2.set("determined"); sl1.root.visible = false;
  } });
  // l14 Then, in 2024, the pigeon bomb finally won a prize. (the spotlight, then the trophy)
  add({ t0: T("l14", "then"), set: "stage", fov: 50, cam: [[0, 1.55, 6.2], [0, 1.45, 3.4]], look: [[0, 2.0, 0], [0, 1.5, 0]], fn(t) {
    const on = sm(w("l14", "2024") - 0.1, w("l14", "2024") + 0.1, t);
    stg.userData.hemiI = 0.9 + 1.0 * on; stg.userData.sunI = 0.35 + 1.0 * on; spot.visible = on > 0.5;
    const k = sm(w("l14", "won") - 0.08, w("l14", "won") + 0.3, t); tCloth.position.y = 1.32 + k * 3; tCloth.visible = k < 0.98;
    popStars(stgStars, w("l14", "prize"), t);
    confetti.forEach((c) => { const ft = t - w("l14", "prize"); c.visible = ft > 0; c.position.y = 3.0 - ft * c.userData.v; c.position.x = c.userData.x0 + Math.sin(ft * 3 + c.userData.ph) * 0.1; c.rotation.z = ft * 4 + c.userData.ph; });
  } });
  // ... The Ig Nobel Peace Prize. (the plaque; a live pigeon beside the trophy)
  add({ t0: T("l14", "the", 2), set: "stage", fov: 50, cam: [[0.8, 1.35, 2.7], [0.475, 1.285, 2.115]], look: [[0, 1.2, 0.2], [0, 1.22, 0.2]], fn(t) {
    tCloth.visible = false; spot.visible = true;
    pStage.g.visible = true; pStage.body.rotation.x = -0.12; pStage.head.rotation.y = 0.3 * Math.sin(t * 2);
    confetti.forEach((c) => { const ft = t - w("l14", "prize") + 0.0; c.visible = c.position.y > 0.2; c.position.y = 3.0 - ft * c.userData.v; c.position.x = c.userData.x0 + Math.sin(ft * 3 + c.userData.ph) * 0.1; c.rotation.z = ft * 4 + c.userData.ph; });
  } });
  // l15 So the pigeons were never the problem. (the three birds, pecking in perfect time)
  add({ t0: T("l15", "so"), set: "hangar", fov: 50, cam: [[4.6, 2.6, 3.1], [4.6, 2.06, 2.32]], look: [[4.6, 2.05, -1.8], [4.6, 1.8, -1.8]], fn(t) {
    nPeck(t, 10); nScreens.forEach((s) => s.userData.aim(0, true));
    popStars(hgStars, w("l15", "problem"), t);
  } });
  // ... Nobody could take them seriously. (the committee laughs; the pigeon looks at us)
  add({ t0: T("l15", "nobody"), set: "demo", fov: 50, cam: [[0.7, 1.62, 1.7], [0.15, 1.56, 0.95]], look: [[0.0, 1.2, -0.9], [0.08, 1.22, -0.5]], fn(t) {
    cloth.visible = false; lampOn.visible = true; lampOff.visible = false; dmScr.userData.aim(0, true);
    committee.forEach((a, i) => { a.set("laugh"); a.pose(i === 2 ? "sitslump" : "sit", t); a.st.bob = Math.abs(Math.sin(t * 12 + i)) * 0.04; a.update(); });
    const turn = sm(w("l15", "take") - 0.1, w("l15", "take") + 0.3, t);
    pDemo.g.rotation.y = lerp(-98, 25, turn) * D2R; pDemo.head.rotation.z = sm(w("l15", "seriously"), w("l15", "seriously") + 0.25, t) * 0.35;
  } });

  S.sort((a, b) => a.t0 - b.t0);
  const reset = {
    train() { rollTrain(0); flock.forEach((b) => b.fold()); skS.turn = 0; skS.pose("sit"); skS.set("neutral"); thinkB.visible = false; },
    lab() {
      sciLab.root.visible = true; sciLab.turn = 0; sciLab.pose("stand"); pTrain.fold(); hitRing.visible = false; labStars.forEach((s) => (s.visible = false));
      grains.forEach((g) => { g.visible = false; g.position.y = 1.06; }); setCount(0); setM(labClock, 0);
      sciType.pose("type"); paper.position.y = 1.08; pDeskL.fold();
    },
    hangar() {
      pNose.fold(); sciH.root.visible = true; sciH.pose("stand");
      nBirds.forEach((b) => { b.fold(); b.g.visible = true; }); nScreens.forEach((s) => s.userData.aim(0, false));
      tally.visible = false; qWrong.visible = false; hgStars.forEach((s) => (s.visible = false));
    },
    cockpit() { pCk.fold(); ckScr.userData.aim(0, false); ckScr.visible = true; ckReveal.userData.k(1); ckReveal.visible = false; beam.visible = true; },
    sky() { waveT.offset.y = 0; },
    office() {
      stE.visible = stI.visible = false; stE.scale.setScalar(1); stI.scale.setScalar(1); cheque.visible = true; cheque.position.set(-0.25, 0.81, -1.35); cheque.rotation.set(-Math.PI / 2, 0, 0);
      official.pose("stand"); official.set("neutral"); sciO.root.visible = true; sciO.pose("stand");
      folder.position.set(-0.8, 0.8, -1.0); folder.rotation.set(0, 0, 0); pDesk.fold(); pDesk.g.visible = true;
    },
    demo() {
      cloth.visible = true; cloth.position.y = 0.92; lampOn.visible = false; lampOff.visible = true; dmScr.userData.aim(0, false); pDemo.fold();
      dmStars.forEach((s) => (s.visible = false)); boat.position.y = 0.9; boat.rotation.set(0, 0, 0); bubs.forEach((b) => (b.visible = false));
      committee.forEach((a) => { a.st.bob = 0; a.pose("sit"); a.set("neutral"); });
    },
    dock() {
      lid.rotation.x = 0; pCrate.fold(); pCrate.g.position.y = 0.1; yb.visible = true; yb.scale.setScalar(1);
      yearCard.material.map = yearTex[1948]; flipPv.visible = false; flipPv.rotation.x = 0; dkScr.userData.aim(0, true);
      sl1.root.visible = true; sl1.pose("stand"); sl2.pose("stand");
    },
    stage() {
      stg.userData.hemiI = 1.9; stg.userData.sunI = 1.35; spot.visible = true; tCloth.visible = true; tCloth.position.y = 1.32;
      stgStars.forEach((s) => (s.visible = false)); confetti.forEach((c) => (c.visible = false)); pStage.fold(); pStage.g.visible = false;
    },
  };
  return { shots: S, reset };
};
