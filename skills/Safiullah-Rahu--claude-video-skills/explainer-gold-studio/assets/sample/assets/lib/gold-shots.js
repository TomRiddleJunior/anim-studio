/* "Alaska vs Alberta" — the gold-studio sample's sets and shot list.
 *   window.GOLD_FILM(K, V) -> { shots: [{ t0, set, fn(t, u) -> state, mb(t) -> samples, shutter }], reset: { set: fn } }
 *   V.w(line, word, k) = start time of the k-th word in that line starting with `word` (from vo/data/vo.json)
 * Every state is computed from t alone: sets are reset, then the shot positions everything for that instant.
 */
window.GOLD_FILM = function (K, V) {
  "use strict";
  const T = K.T;
  const w = V.w, L = V.line;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const win = (t, a, b) => clamp((t - a) / (b - a));
  const io = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : -(Math.cos(Math.PI * u) - 1) / 2);
  const o3 = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const o5 = (u) => 1 - Math.pow(1 - clamp(u), 5);
  const i2 = (u) => clamp(u) * clamp(u);
  const back = (u, s = 1.7) => { u = clamp(u) - 1; return u * u * ((s + 1) * u + s) + 1; };
  const R = K.rng(5);
  const GOLD = "gold", WHITE = "#f4efe9";
  const big = (text, size, color, extra) => ({ lines: [Object.assign({ text, size, color, weight: 800, font: K.FONT_BOLD, track: 0.0 }, extra || {})] });

  // ----------------------------------------------------------------- set: the two barrels (opening + ending)
  const open = K.set("open", { env: "neutral" });
  const brA = K.barrel({ x: -1.0, text: "ALASKA", parent: open });
  const brB = K.barrel({ x: 1.0, text: "ALBERTA", parent: open });
  const spA = K.flagSphere({ flag: "alaska", parent: open });
  const spB = K.flagSphere({ flag: "alberta", parent: open });
  const stA = K.coinStack({ x: -1.0, y: 1.3, r: 0.44, max: 56, parent: open, seed: 3 });
  const stB = K.coinStack({ x: 1.0, y: 1.3, r: 0.44, max: 20, parent: open, seed: 4 });
  const glowO = K.glow({ color: "#c98a3a", size: 9.5, x: -0.5, y: 4.6, z: -6, parent: open, soft: 1.55, k: 0.5 });
  const lab88 = K.label(big("$88", 220, GOLD, { depth: 0.09 }), { parent: open, gain: 1.15 });
  const labBil = K.label(big("BILLION", 120, WHITE, { weight: 800 }), { parent: open, gain: 1.05 });
  const labFund = K.label(big("FUND", 120, WHITE, { weight: 800 }), { parent: open, gain: 1.05 });
  const eqM = new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.2, 2.2) });
  const eq = new T.Group();
  [0.09, -0.09].forEach((y) => { const b = new T.Mesh(new T.BoxGeometry(0.34, 0.07, 0.07), eqM); b.position.y = y; eq.add(b); });
  eq.position.set(0, 0.65, 0.3);
  open.add(eq);

  function sphereDrop(sp, x0, restY, tLand, t, dx) {
    // falls from above the frame, lands at tLand with a small bounce (0.25 s fall, 0.12 s bounce)
    const tf = 0.26;
    let y, xo = 0;
    if (t < tLand - tf) { sp.visible = false; return; }
    sp.visible = true;
    if (t < tLand) { const u = (t - (tLand - tf)) / tf; y = restY + 6.5 * (1 - u * u); xo = dx * (1 - u); }
    else { const u = clamp((t - tLand) / 0.22); y = restY + Math.sin(Math.PI * u) * 0.12 * (1 - u); }
    sp.position.set(x0 + xo, y, 0);
    sp.rotation.set(0, 0, 0);
  }
  function resetOpen() {
    spA.visible = spB.visible = true;
    stA.set(0); stB.set(0);
    glowO.setK(0);
    [lab88, labBil, labFund].forEach((l) => l.show(0, 0));
    eq.visible = false;
    spA.position.set(-1, 1.3 + 0.56, 0);
    spB.position.set(1, 1.3 + 0.56, 0);
  }
  const OPEN_LIGHT = { keyPos: [-3.5, 9, 7], keyTarget: [0, 1.2, 0], keyI: 70, rimI: 0.8, warmPos: [-0.6, 4.2, -2.2] };

  // ----------------------------------------------------------------- set: title cards
  const title = K.set("title", { env: "dim", floor: false });
  const tW1 = K.label({ lines: [{ text: "Here's", size: 150, color: "#f6f1ec", weight: 600, font: K.FONT_SANS }] }, { parent: title, gain: 1.15 });
  const tW2 = K.label({ lines: [{ text: "why.", size: 300, color: "gold", weight: 400, italic: true, font: K.FONT_SERIF, depth: 0.0, bold: 0.022 }] }, { parent: title, gain: 1.6, flash: 2.2 });
  const tGlow = K.glow({ color: "#b07a2c", size: 3.3, x: 0, y: -0.5, z: -3, parent: title, soft: 1.5, noRefl: true });
  const red = K.set("redtitle", { env: "dim", floor: false });
  const rW = ["And", "here's", "the"].map((s) => K.label({ lines: [{ text: s, size: 130, color: "#f6f1ec", weight: 600, font: K.FONT_SANS }] }, { parent: red, gain: 1.15 }));
  const rTw = K.label({ lines: [{ text: "twist.", size: 280, color: "#ff4a4f", weight: 400, italic: true, font: K.FONT_SERIF, bold: 0.03 }] }, { parent: red, gain: 1.9, flash: 2.0 });
  const rGlow = K.glow({ color: "#8f1d1b", size: 7.2, x: 0, y: -0.6, z: -3, parent: red, soft: 1.25, noRefl: true });

  // ----------------------------------------------------------------- set: hero stack + people
  const hero = K.set("hero", { env: "neutral" });
  const brH = K.barrel({ x: 0, text: "ALASKA", parent: hero });
  const stH = K.coinStack({ x: 0, y: 1.3, r: 0.44, max: 56, parent: hero, seed: 3 });
  const spH = K.flagSphere({ flag: "alaska", parent: hero });
  const glowH = K.glow({ color: "#c98a3a", size: 7, x: 0, y: 4.6, z: -6, parent: hero, soft: 1.7 });
  const pawnsH = [];
  [[-1.5, 0.95], [-0.75, 0.95], [0, 0.95], [0.75, 0.95], [1.5, 0.95], [-1.12, -0.05], [-0.37, -0.15], [0.37, -0.15], [1.12, -0.05]].forEach(([x, z], i) => {
    pawnsH.push(K.pawn({ x, z, s: 1.0, parent: hero }));
  });
  const stackGlowM = [];

  // ----------------------------------------------------------------- set: vault (ring gauge + safe, one space, whip between)
  const vault = K.set("vault", { env: "neutral" });
  const rg = K.ring({ R: 1.25, parent: vault });
  rg.position.set(0, 3.0, 0);
  const glyphCv = document.createElement("canvas");
  glyphCv.width = 256; glyphCv.height = 320;
  (() => {
    const c = glyphCv.getContext("2d");
    c.fillStyle = "#ffffff";
    c.beginPath(); c.roundRect(40, 20, 176, 280, 26); c.fill();
    c.fillStyle = "#000000";
    [100, 200].forEach((y) => c.fillRect(40, y, 176, 12));
    c.fillRect(176, 40, 14, 230);
  })();
  const glyph = new T.Mesh(new T.PlaneGeometry(0.62, 0.78), new T.MeshBasicMaterial({ map: K.canvasTex(glyphCv), transparent: true, color: new T.Color(1.5, 1.5, 1.5) }));
  glyph.position.set(0, 3.0, 0.02);
  vault.add(glyph);
  const labPct = K.label(big("0%", 200, WHITE, { weight: 800 }), { parent: vault, gain: 1.2, x: 0, y: 3.12, z: 0.05, cap: 0.36 });
  const labRoy = K.label(big("OF ROYALTIES", 90, WHITE, { weight: 800, track: 0.02 }), { parent: vault, gain: 1.1, x: 0, y: 2.55, z: 0.05, cap: 0.115 });
  const SAFE_X = 6.0;
  const sf = K.safe({ s: 2.0, parent: vault });
  sf.position.set(SAFE_X, 0, 0);
  sf.rotation.y = -0.42;
  const pour = K.coinSwarm({ max: 620, r: 0.066, parent: vault, mat: K.physical({ color: "#f6cc72", metalness: 1, roughness: 0.22, emissive: "#7a5212", emissiveIntensity: 0.25, envMapIntensity: 1.2 }) });
  const glowV = K.glow({ color: "#c98a3a", size: 7, x: SAFE_X + 1.8, y: 4.4, z: -5, parent: vault, soft: 1.6 });
  const glowR = K.glow({ color: "#8a6526", size: 7.5, x: 0, y: 3.0, z: -3, parent: vault, soft: 1.5 });

  // ----------------------------------------------------------------- set: chart
  const chart = K.set("chart", { env: "neutral", floor: false });
  const CW = 1080, CH = 700, PW = 3.75, PH = PW * CH / CW, CY = 3.6;
  const baseCv = document.createElement("canvas"); baseCv.width = CW; baseCv.height = CH;
  const lineCv = document.createElement("canvas"); lineCv.width = CW; lineCv.height = CH;
  const baseTex = K.canvasTex(baseCv), lineTex = K.canvasTex(lineCv);
  const basePlane = new T.Mesh(new T.PlaneGeometry(PW, PH), new T.MeshBasicMaterial({ map: baseTex, transparent: true, depthWrite: false }));
  const linePlane = new T.Mesh(new T.PlaneGeometry(PW, PH), new T.MeshBasicMaterial({ map: lineTex, transparent: true, depthWrite: false, color: new T.Color(2.4, 2.4, 2.4) }));
  basePlane.position.set(0, CY, 0); linePlane.position.set(0, CY, 0.01);
  linePlane.renderOrder = 3; basePlane.renderOrder = 2;
  chart.add(basePlane, linePlane);
  const mkA = K.flagSphere({ flag: "alaska", r: 0.1, parent: chart });
  const mkB = K.flagSphere({ flag: "alberta", r: 0.1, parent: chart });
  const labTipA = K.label(big("$0B", 100, WHITE, { weight: 800 }), { parent: chart, gain: 1.15, cap: 0.052 });
  const labTipB = K.label(big("C$1B", 100, WHITE, { weight: 800 }), { parent: chart, gain: 1.15, cap: 0.052 });
  const labPay = K.label(big("$0.0B", 200, GOLD, { depth: 0.08 }), { parent: chart, gain: 1.15, cap: 0.24 });
  const labYear = K.label(big("A YEAR", 90, WHITE, { weight: 800 }), { parent: chart, gain: 1.05, cap: 0.085 });
  const icons = ["dividend", "school", "road"].map((k) => K.iconTile(k, { s: 0.7, parent: chart }));
  const glowG = K.glow({ color: "#1f6a44", size: 9, x: -1.8, y: 5.2, z: -2, parent: chart, soft: 1.2, noRefl: true });
  const glowRd = K.glow({ color: "#7a1514", size: 6, x: 1.9, y: 0.6, z: -2, parent: chart, soft: 1.35, noRefl: true });
  const payCoins = K.coinSwarm({ max: 12, r: 0.07, parent: chart });
  // Alaska Permanent Fund, US$ billions (APFC milestones; see FACTS.md) and Alberta Heritage Fund (C$ bn at 1.3939 C$/US$)
  const DA = [[1977.15, 0.0007], [1989, 10], [1993, 15], [1996, 20], [1997, 22], [1998, 25], [2005, 30], [2006, 35], [2007, 40],
    [2014, 50], [2016, 53], [2017, 60], [2018, 64.9], [2020, 65.3], [2021, 81.9], [2025, 85.1], [2026.0, 91.9], [2026.75, 88.0]];
  const DB = [[1976.5, 1.5], [1987, 12.7], [2005, 12.7], [2008, 15.5], [2020, 16.4], [2025, 27.2], [2026.25, 32.0]].map(([y, v]) => [y, v / 1.3939]);
  const X0 = 1976.5, X1 = 2026.75, VMAX = 100;
  const cx = (yr) => CW * (0.05 + 0.87 * (yr - X0) / (X1 - X0));
  const cy = (v) => CH * (0.9 - 0.8 * v / VMAX);
  const valAt = (D, yr) => { for (let i = 1; i < D.length; i++) if (yr <= D[i][0]) { const u = (yr - D[i - 1][0]) / (D[i][0] - D[i - 1][0]); return lerp(D[i - 1][1], D[i][1], u); } return D[D.length - 1][1]; };
  const toWorld = (px, py) => [(px / CW - 0.5) * PW, CY + (0.5 - py / CH) * PH, 0.06];
  function drawChart(pA, pB, gridK) {
    const g = baseCv.getContext("2d"), l = lineCv.getContext("2d");
    g.clearRect(0, 0, CW, CH); l.clearRect(0, 0, CW, CH);
    g.strokeStyle = `rgba(150,150,150,${0.55 * gridK})`; g.lineWidth = 2; g.setLineDash([9, 9]);
    for (let i = 0; i <= 5; i++) { const y = CH * (0.9 - 0.8 * i / 5); g.beginPath(); g.moveTo(CW * 0.04, y); g.lineTo(CW * (0.04 + 0.92 * gridK), y); g.stroke(); }
    g.setLineDash([]);
    g.fillStyle = `rgba(200,200,200,${0.8 * gridK})`; g.font = `600 22px ${K.FONT_SANS}`; g.textAlign = "center";
    g.fillText("1977", cx(1977.15), CH * 0.965);
    if (pA > 0.97 || pB > 0) g.fillText("2026", cx(2026.4), CH * 0.965);
    const seg = (D, p) => { const yrEnd = lerp(X0, X1, p); const pts = D.filter((d) => d[0] < yrEnd).map((d) => [cx(d[0]), cy(d[1])]); pts.push([cx(yrEnd), cy(valAt(D, yrEnd))]); return pts; };
    if (pA > 0) {
      const pts = seg(DA, pA);
      const gr = g.createLinearGradient(0, cy(90), 0, cy(0));
      gr.addColorStop(0, "rgba(46,170,108,0.85)"); gr.addColorStop(1, "rgba(24,84,54,0.16)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(pts[0][0], cy(0)); pts.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(pts[pts.length - 1][0], cy(0)); g.closePath(); g.fill();
      l.strokeStyle = "#7cf5cb"; l.lineWidth = 7; l.lineJoin = "round"; l.lineCap = "round";
      l.beginPath(); pts.forEach((p, i) => (i ? l.lineTo(p[0], p[1]) : l.moveTo(p[0], p[1]))); l.stroke();
    }
    if (pB > 0) {
      const pts = seg(DB, pB);
      l.strokeStyle = "#ff5a52"; l.lineWidth = 7; l.lineJoin = "round"; l.lineCap = "round";
      l.beginPath(); pts.forEach((p, i) => (i ? l.lineTo(p[0], p[1]) : l.moveTo(p[0], p[1]))); l.stroke();
    }
    baseTex.needsUpdate = true; lineTex.needsUpdate = true;
  }

  // ----------------------------------------------------------------- set: map
  const map = K.set("map", { env: "neutral", floor: false });
  const MD = window.GOLD_MAP;
  const dotMat = K.physical({ color: "#ffffff", roughness: 0.4, metalness: 0.2, envMapIntensity: 0.6 });
  const dotsLand = K.dots(MD.dots.filter((d) => d[2] !== 1).map((d) => [d[0], d[1], "#a2a2a2"]), { r: 0.0155, h: 0.03, mat: dotMat, parent: map });
  const goldDotMat = K.physical({ color: "#e0a848", roughness: 0.28, metalness: 1, emissive: "#a8741f", emissiveIntensity: 0.32 });
  const dotsGold = K.dots(MD.dots.filter((d) => d[2] === 1).map((d) => [d[0], d[1], "#ffffff"]), { r: 0.021, h: 0.045, mat: goldDotMat, parent: map });
  const routeDots = [];
  const routeLen = {};
  Object.entries(MD.routes).forEach(([k, pts]) => {
    let len = 0; const seglen = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(d); len += d; }
    routeLen[k] = { pts, seglen, len };
    const n = Math.floor(len / 0.06);
    for (let i = 0; i <= n; i++) { const p = along(k, i / n); routeDots.push([p[0], p[1], "#ffffff"]); }
  });
  function along(k, u) {
    const r = routeLen[k]; let d = clamp(u) * r.len;
    for (let i = 0; i < r.seglen.length; i++) { if (d <= r.seglen[i] || i === r.seglen.length - 1) { const v = clamp(d / r.seglen[i]); return [lerp(r.pts[i][0], r.pts[i + 1][0], v), lerp(r.pts[i][1], r.pts[i + 1][1], v), Math.atan2(r.pts[i + 1][0] - r.pts[i][0], r.pts[i + 1][1] - r.pts[i][1])]; } d -= r.seglen[i]; }
    return r.pts[r.pts.length - 1];
  }
  const routeMesh = K.dots(routeDots, { r: 0.012, h: 0.02, mat: K.physical({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 1.6 }), parent: map });
  const ships = [];
  const shipMat = K.MAT.white();
  for (let i = 0; i < 5; i++) {
    const s = new T.Group();
    const hull = new T.Mesh(new T.BoxGeometry(0.07, 0.04, 0.3), shipMat); hull.position.y = 0.03; s.add(hull);
    const bow = new T.Mesh(new T.ConeGeometry(0.035, 0.08, 4), shipMat); bow.rotation.x = Math.PI / 2; bow.position.set(0, 0.03, 0.19); s.add(bow);
    const br = new T.Mesh(new T.BoxGeometry(0.06, 0.05, 0.05), shipMat); br.position.set(0, 0.07, -0.1); s.add(br);
    s.castShadow = true; s.scale.setScalar(1.45);
    map.add(s); ships.push(s);
  }
  const pigs = K.coinSwarm({ max: 30, r: 0.03, parent: map, mat: K.physical({ color: "#ffd27a", emissive: "#ffb340", emissiveIntensity: 2.2, metalness: 0.5 }) });
  const labRegion = K.label(big("ALBERTA", 120, WHITE, { weight: 800 }), { parent: map, gain: 1.1, cap: 0.1 });
  const labAK = K.label(big("ALASKA", 70, "#cfcfcf", { weight: 700 }), { parent: map, gain: 0.9, cap: 0.06 });
  const labUS = K.label(big("UNITED STATES", 70, "#cfcfcf", { weight: 700 }), { parent: map, gain: 0.9, cap: 0.06 });
  const lab18 = K.label(big("C$0B", 200, GOLD, { depth: 0.08 }), { parent: map, gain: 1.15, cap: 0.3 });
  const labRev = K.label(big("RESOURCE REVENUE", 80, WHITE, { weight: 800 }), { parent: map, gain: 1.05, cap: 0.075 });
  const labFY = K.label(big("2025-26", 70, "#cfcfcf", { weight: 700 }), { parent: map, gain: 0.95, cap: 0.06 });
  const mapR = MD.labels.region;

  // ----------------------------------------------------------------- set: coin + people + grid
  const cset = K.set("coin", { env: "neutral" });
  const coinFaceCv = document.createElement("canvas"); coinFaceCv.width = coinFaceCv.height = 1024;
  const coinFaceTex = K.canvasTex(coinFaceCv);
  const bigCoin = new T.Group();
  const bcRim = new T.Mesh(new T.TorusGeometry(1.0, 0.07, 24, 128), K.MAT.gold());
  const bcRim2 = new T.Mesh(new T.TorusGeometry(0.9, 0.025, 16, 128), K.MAT.gold());
  const bcBody = new T.Mesh(new T.CylinderGeometry(0.99, 0.99, 0.08, 96), K.physical({ color: "#3a2a12", metalness: 1, roughness: 0.35 }));
  bcBody.rotation.x = Math.PI / 2;
  const bcFace = new T.Mesh(new T.CircleGeometry(0.9, 96), K.physical({ map: coinFaceTex, metalness: 0.85, roughness: 0.3, color: "#ffffff", envMapIntensity: 1.2 }));
  bcFace.position.z = 0.042;
  const bcBack = bcFace.clone(); bcBack.rotation.y = Math.PI; bcBack.position.z = -0.042;
  bigCoin.add(bcBody, bcBack);
  bigCoin.add(bcRim, bcRim2, bcFace);
  bigCoin.position.set(0, 2.75, 0);
  cset.add(bigCoin);
  const glowC = K.glow({ color: "#b07a2c", size: 5.2, x: 0, y: 2.85, z: -3, parent: cset, soft: 1.6 });
  const crowd = [];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - (r % 2); i++) {
    const x = (i - (5 - (r % 2)) / 2) * 0.66 + (R() - 0.5) * 0.1, z = 1.3 - r * 0.55 + (R() - 0.5) * 0.1;
    crowd.push(K.pawn({ x, z, s: 1.12, parent: cset }));
  }
  const gridCoins = K.coinSwarm({ max: 100, r: 0.075, parent: cset, mat: K.physical({ color: "#3b3b3e", metalness: 1, roughness: 0.3 }) });
  const gridGold = K.coinSwarm({ max: 30, r: 0.075, parent: cset });
  const lab30 = K.label(big("30¢", 200, GOLD, { depth: 0.08 }), { parent: cset, gain: 1.15, x: 0, y: 2.95, z: 0, cap: 0.36 });
  const labEvery = K.label(big("IN EVERY $1", 90, WHITE, { weight: 800 }), { parent: cset, gain: 1.1, x: 0, y: 2.4, z: 0, cap: 0.115 });

  // ----------------------------------------------------------------- set: plant (twist)
  const plant = K.set("plant", { env: "neutral" });
  const tanks = [K.tank({ r: 0.55, h: 0.85, parent: plant }), K.tank({ r: 0.55, h: 0.85, parent: plant })];
  tanks[0].position.set(-1.3, 0, 0.2); tanks[1].position.set(-0.1, 0, 0.0);
  const towers = new T.Group(); plant.add(towers); towers.scale.setScalar(0.85);
  const wM = K.MAT.white(), cM = K.MAT.chrome(), dM = K.physical({ color: "#1a1a1a", metalness: 0.7, roughness: 0.35 });
  [[0.95, 0.12, 1.25], [1.35, 0.1, 1.0], [1.75, 0.13, 1.45], [2.2, 0.09, 0.85]].forEach(([x, r, h]) => {
    K.cyl(r, h, wM, { x, z: -0.2, parent: towers, seg: 24 });
    [0.35, 0.7].forEach((f) => { const p = K.box(r * 4, 0.02, r * 4, dM, { x, y: h * f, z: -0.2, parent: towers }); });
  });
  K.box(1.6, 0.04, 0.04, cM, { x: 1.6, y: 0.55, z: 0.05, parent: towers });
  K.box(1.6, 0.04, 0.04, cM, { x: 1.6, y: 0.35, z: 0.05, parent: towers });
  K.box(0.5, 0.5, 0.5, dM, { x: 0.55, y: 0.25, z: 0.75, parent: towers, round: 0.03 });
  K.box(0.3, 0.9, 0.3, dM, { x: 0.55, y: 0.45, z: 0.75, parent: towers });
  const flare = K.cyl(0.03, 2.6, cM, { x: 2.4, z: -0.5, parent: plant });
  const flareTip = K.sphere(0.07, new T.MeshBasicMaterial({ color: new T.Color(6, 4.2, 1.2) }), { x: 2.4, y: 2.66, z: -0.5, parent: plant });
  const glowP = K.glow({ color: "#8f1d1b", size: 4.6, x: 0.3, y: 3.6, z: -2, parent: plant, soft: 1.35 });
  const glowPg = K.glow({ color: "#c98a3a", size: 4.6, x: -1.0, y: 2.2, z: -2, parent: plant, soft: 1.45 });
  const lab0 = K.label(big("$0", 220, "#ff4d4f", { weight: 800 }), { parent: plant, gain: 1.45, x: 0.3, y: 3.75, z: 0, cap: 0.42 });
  const labDep = K.label(big("NEW DEPOSITS", 90, WHITE, { weight: 800 }), { parent: plant, gain: 1.1, x: 0.3, y: 3.05, z: 0, cap: 0.12 });
  const dropCoin = K.coinSwarm({ max: 1, r: 0.2, parent: plant });

  // ----------------------------------------------------------------- resets
  const reset = {
    open: resetOpen,
    title() { tW1.show(0, 0); tW2.show(0, 0); tGlow.setK(0); },
    redtitle() { rW.forEach((l) => l.show(0, 0)); rTw.show(0, 0); rGlow.setK(0); },
    hero() {
      stH.set(46); pawnsH.forEach((p) => { p.position.y = -1; p.userData.gild(0); });
      stH.mat.emissive.set("#000000"); glowH.setK(0.3);
    },
    vault() {
      rg.visible = true; rg.rotation.set(0, 0, 0); rg.position.set(0, 3.0, 0); rg.userData.setArc(0);
      glyph.visible = false; labPct.show(0, 0); labRoy.show(0, 0);
      sf.userData.hinge.rotation.y = -1.9; sf.userData.dial.rotation.z = 0;
      pour.begin(); pour.end(); glowV.setK(0); glowR.setK(0.55);
    },
    chart() {
      mkA.visible = mkB.visible = false; labTipA.show(0, 0); labTipB.show(0, 0); labPay.show(0, 0); labYear.show(0, 0);
      icons.forEach((g) => (g.visible = false)); glowG.setK(1.15); glowRd.setK(0); payCoins.begin(); payCoins.end();
    },
    map() { ships.forEach((s) => (s.visible = false)); [labRegion, labAK, labUS, lab18, labRev, labFY].forEach((l) => l.show(0, 0)); pigs.begin(); pigs.end(); },
    coin() {
      bigCoin.visible = false; crowd.forEach((p) => { p.position.y = -1.2; p.userData.gild(0); });
      gridCoins.begin(); gridCoins.end(); gridGold.begin(); gridGold.end(); lab30.show(0, 0); labEvery.show(0, 0); glowC.setK(0);
    },
    plant() {
      tanks.forEach((t) => (t.position.y = -2)); towers.position.y = -2; flare.visible = flareTip.visible = false;
      glowP.setK(0); glowPg.setK(0); lab0.show(0, 0); labDep.show(0, 0); dropCoin.begin(); dropCoin.end();
    },
  };

  // reveal helper for labels: glitch-in over 0.16 s, hold, glitch-out over 0.12 s
  const rev = (l, t, a, b) => { if (t < a) return l.show(0, 0); const k = win(t, a, a + 0.16); const out = b == null ? 1 : 1 - win(t, b, b + 0.12); l.show(k * out, out > 0 ? 1 : 0); };
  function countUp(l, t, a, b, v0, v1, fmt) { const u = o3(win(t, a, b)); l.set(fmt(lerp(v0, v1, u))); }

  // ----------------------------------------------------------------- shot list
  const D = V.dur;
  const tL = (id) => L(id).start, eL = (id) => L(id).end;
  const S = [];

  // 1 · two-up open: spheres drop, push in, gold glow; pull back; Alaska's stack rises with the label; Alberta a quarter
  const tPull = w("l02", "into") - 0.05;
  const tStack0 = w("l02", "eighty"), tStack1 = w("l02", "fund") + 0.1;
  const tB0 = w("l03", "about"), tB1 = w("l03", "quarter") + 0.35;
  S.push({ t0: 0, set: "open", mb: (t) => (t < 0.95 || (t > tPull && t < tPull + 0.32) ? 6 : 1), shutter: 1 / 40,
    fn(t) {
      sphereDrop(spA, -1, 1.86, 0.2, t, -0.25);
      sphereDrop(spB, 1, 1.86, 0.7, t, 0.25);
      const g = io(win(t, w("l01", "rich") - 0.2, w("l01", "rich") + 0.6));
      glowO.setK(0.6 * g);
      const nA = 46 * o3(win(t, tStack0, tStack1));
      const hA = stA.set(nA);
      if (t > 0.2) spA.position.y = 1.3 + hA + 0.56 + (nA > 0 && nA < 46 ? 0.02 : 0);
      const nB = 11.5 * o3(win(t, tB0, tB1));
      const hB = stB.set(nB);
      if (t > 0.7) spB.position.y = 1.3 + hB + 0.56;
      const pull = io(win(t, tPull, tPull + 0.32));
      const push = win(t, 0, tPull);
      const camA = mix3([-0.7, 2.25, 12.2], [0.45, 1.9, 9.5], io(push));
      const camB = mix3([-0.9, 4.8, 21.6], [1.6, 4.0, 17.4], win(t, tPull + 0.32, w("l04", "here")));
      const lookA = [0, 1.45, 0], lookB = [0.15, 3.55, 0];
      const cam = mix3(camA, camB, pull), look = mix3(lookA, lookB, pull);
      rev(lab88, t, tStack0 + 0.05, tB0 - 0.1);
      rev(labBil, t, w("l02", "eighty") + 0.45, tB0 - 0.1);
      rev(labFund, t, w("l02", "fund") - 0.02, tB0 - 0.1);
      return Object.assign({ set: "open", cam, look, fov: 34, focus: lerp(11.6, 20, pull), aperture: 0.9, warmI: 7 * g, bloom: 0.5, exposure: 1.0,
        after(camera) {
          const d = 12.5;
          const hw = K.atScreen(lab88.mesh, 0.73, 0.255, d); lab88.fit(0.072 * hw);
          K.atScreen(labBil.mesh, 0.73, 0.345, d); labBil.fit(0.021 * hw);
          K.atScreen(labFund.mesh, 0.73, 0.39, d); labFund.fit(0.021 * hw);
        } }, OPEN_LIGHT);
    } });

  // 2 · title card "Here's why."
  const tTitle = tL("l04") - 0.12;
  S.push({ t0: tTitle, set: "title", cut: true,
    fn(t) {
      rev(tW1, t, w("l04", "here") - 0.06);
      rev(tW2, t, w("l04", "why") - 0.04);
      tGlow.setK(0.32 * io(win(t, w("l04", "why") - 0.05, w("l04", "why") + 0.35)));
      const u = win(t, tTitle, tL("l05"));
      return { set: "title", cam: [0, 0, lerp(10, 9.1, u)], look: [0, 0, 0], fov: 34, aperture: 0, bloom: 0.75, keyI: 0, rimI: 0, fillI: 0,
        after() { const hw = K.atScreen(tW1.mesh, 0.5, 0.375, 10); tW1.fit(0.028 * hw); K.atScreen(tW2.mesh, 0.5, 0.53, 10); tW2.fit(0.1 * hw);
          K.atScreen(tGlow, 0.5, 0.53, 10.5); } };
    } });

  // 3 · hero stack, crane down, people rise and turn gold
  const tHero = tL("l05") - 0.08, tWhip1 = tL("l06") - 0.2;
  S.push({ t0: tHero, set: "hero", cut: true, mb: (t) => (t > tWhip1 - 0.02 ? 7 : 1), shutter: 1 / 30,
    fn(t) {
      spH.position.set(0, 1.3 + stH.height + 0.56, 0);
      const top = 1.3 + stH.height + 0.56;
      const crane = io(win(t, tHero, w("l05", "voted") + 0.2));
      let cam = mix3([0.0, top + 0.6, 7.6], [0, 3.9, 15.6], crane);
      const dr = win(t, w("l05", "alaskans") + 0.3, tWhip1);
      cam = [cam[0] + 1.8 * dr, cam[1], cam[2] - 0.8 * dr];
      let look = mix3([0, top - 0.6, 0], [0, 3.85, 0], crane);
      const rise = (i) => { const order = [2, 1, 3, 0, 4, 6, 7, 5, 8][i]; return back(win(t, w("l05", "voted") - 0.1 + order * 0.07, w("l05", "voted") + 0.35 + order * 0.07), 1.5); };
      pawnsH.forEach((p, i) => { p.position.y = lerp(-0.95, 0, rise(i)); const order = Math.abs(i % 5 - 2) + (i >= 5 ? 1 : 0); p.userData.gild(io(win(t, w("l05", "save") + order * 0.18, w("l05", "save") + 0.45 + order * 0.18))); });
      const lit = io(win(t, w("l05", "money") - 0.2, tWhip1));
      stH.mat.emissive.set("#a2701e"); stH.mat.emissiveIntensity = 0.4 * lit;
      // whip pan right into the vault (0.2 s)
      const wp = i2(win(t, tWhip1, tL("l06")));
      look = [look[0] + 9 * wp, look[1], look[2]];
      return { set: "hero", cam, look, fov: 34, focus: lerp(7.6, 15.4, crane), aperture: 1.0, warmI: 6 + 6 * lit, warmPos: [0, 3.5, -2.5], bloom: 0.5 + 0.25 * lit,
        keyPos: [-3.5 + 4.5 * win(t, tHero, tWhip1), lerp(11, 4, win(t, tHero, tWhip1)), 7], keyTarget: [0, lerp(5, 1.0, win(t, tHero, tWhip1)), 0], keyI: 120, rimI: 0.9 };
    } });

  // 4 · ring gauge 25 %, whip to the safe, coins pour in, door shuts, dial spins
  const tRing = tL("l06") - 0.0, tArc0 = w("l06", "twenty") - 0.05, tArc1 = w("l06", "percent") + 0.25;
  const tWhip2 = tL("l07") - 0.12, tPour0 = tL("l07") + 0.1, tPour1 = w("l07", "savings"), tShut = w("l07", "only") + 0.02;
  S.push({ t0: tRing, set: "vault", mb: (t) => (t < tRing + 0.3 || (t > tWhip2 && t < tWhip2 + 0.5) || (t > tShut && t < tShut + 0.3) ? 7 : t > tPour0 && t < tPour1 + 0.8 ? 3 : 1), shutter: 1 / 30,
    fn(t) {
      const sw = o3(win(t, tRing, tRing + 0.38));
      rg.position.set(lerp(3.2, 0, sw), 3.0, 0);
      rg.rotation.y = lerp(-1.2, 0, sw) + 0.14 * Math.sin((t - tRing) * 2.1) * sw;
      rg.rotation.x = 0.08 * Math.sin((t - tRing) * 1.7) * sw;
      glyph.visible = t > w("l06", "least") && t < tArc0;
      glyph.position.x = rg.position.x;
      const a = o3(win(t, tArc0, tArc1));
      rg.userData.setArc(0.25 * a);
      if (t >= tArc0) { labPct.set(`${Math.round(25 * a)}%`); rev(labPct, t, tArc0); rev(labRoy, t, w("l06", "royalties") - 0.1); }
      // pour: a river of coins from the upper left, curving in through the open front onto a pile
      pour.begin();
      const N = 600, RY = -0.42, cr = Math.cos(RY), sr = Math.sin(RY);
      const toW = (lx, ly, lz) => [SAFE_X + lx * cr + lz * sr, ly, -lx * sr + lz * cr];
      for (let i = 0; i < N; i++) {
        const ts = lerp(tPour0, tPour1, i / N), dur = 0.72;
        if (t < ts) break;
        const ri = K.rng(1000 + i);
        const slotX = (ri() - 0.5) * 1.45, slotZ = (ri() - 0.5) * 1.3, slotY = 0.15 + Math.floor(i / 90) * 0.05 + ri() * 0.04;
        const S0 = [SAFE_X - 3.3 + (ri() - 0.5) * 0.9, 5.0 + (ri() - 0.5) * 0.8, 2.4 + (ri() - 0.5) * 0.8];
        const C = toW(slotX * 0.45, 1.9 + ri() * 0.3, 1.9);
        const E = toW(slotX * 0.62, slotY, slotZ * 0.62);
        const u = clamp((t - ts) / dur);
        const a0 = (1 - u) * (1 - u), a1 = 2 * u * (1 - u), a2 = u * u;
        if (u < 1) pour.put(a0 * S0[0] + a1 * C[0] + a2 * E[0], a0 * S0[1] + a1 * C[1] + a2 * E[1], a0 * S0[2] + a1 * C[2] + a2 * E[2],
          ri() * 6 + u * 9, ri() * 6, ri() * 6 + u * 7);
        else pour.put(E[0], E[1], E[2], (ri() - 0.5) * 0.5, ri() * 6, (ri() - 0.5) * 0.5);
      }
      pour.end();
      const shut = o5(win(t, tShut, tShut + 0.28));
      sf.userData.hinge.rotation.y = lerp(-1.9, 0, shut);
      sf.userData.dial.rotation.z = -o3(win(t, tShut + 0.4, eL("l07") + 0.2)) * Math.PI * 3;
      glowV.setK(0.1 * io(win(t, tWhip2, tWhip2 + 0.4)));
      // camera: on the ring, whip right to a 3/4 view of the open safe, then settle frontal as the door closes
      const wp = io(win(t, tWhip2, tWhip2 + 0.42));
      const fr = io(win(t, tShut - 0.1, tShut + 0.9));
      const rd = win(t, tRing, tWhip2);
      const camR = [0.5 * rd, 3.0 + 0.15 * rd, 8.4 - 0.7 * rd], lookR = [0, 3.0, 0];
      const sd = win(t, tShut + 0.9, D);
      const camS = mix3([SAFE_X - 2.6, 3.6, 8.2], [SAFE_X - 1.5 + 0.6 * sd, 2.2, 6.9 - 0.5 * sd], fr);
      const lookS = mix3([SAFE_X - 0.5, 1.6, 0], [SAFE_X - 0.2, 1.15, 0], fr);
      return { set: "vault", cam: mix3(camR, camS, wp), look: mix3(lookR, lookS, wp), fov: 34, focus: lerp(8.4, 8.0, wp), aperture: lerp(0.5, 1.0, wp),
        warmI: 10 * wp, warmPos: [SAFE_X + 0.5, 4.5, -2], bloom: 0.6, keyPos: [SAFE_X - 4, 9, 7], keyTarget: [SAFE_X, 1, 0], keyI: 95 * wp + 25, rimI: 0.8 };
    } });

  // 5 · chart (Alaska green, then Alberta red)
  const tChart = tL("l08") - 0.1, tDraw1 = eL("l08") + 0.1, tDown = tL("l09") - 0.1;
  const tPay0 = w("l09", "three") - 0.05, tPay1 = w("l09", "year") + 0.1;
  const tRed = tL("l11") - 0.05, tRed1 = eL("l11") + 0.3;
  S.push({ t0: tChart, set: "chart", cut: true,
    fn(t) {
      const pA = io(win(t, tChart + 0.2, tDraw1));
      const pB = io(win(t, tRed + 0.15, tRed1));
      drawChart(pA, pB, o3(win(t, tChart, tChart + 0.4)));
      const yr = lerp(X0, X1, pA), v = valAt(DA, yr);
      const tip = toWorld(cx(yr), cy(v));
      mkA.visible = true; mkA.position.set(tip[0], tip[1], tip[2] + 0.08); mkA.rotation.y = -0.4;
      labTipA.set(v < 1 ? `$${v.toFixed(1)}B` : `$${Math.round(v)}B`);
      labTipA.mesh.position.set(tip[0] - 0.05, tip[1] + 0.22, tip[2] + 0.1); rev(labTipA, t, tChart + 0.1);
      if (pB > 0) {
        const yb = lerp(X0, X1, pB), vb = valAt(DB, yb), tb = toWorld(cx(yb), cy(vb));
        mkB.visible = true; mkB.position.set(tb[0], tb[1], tb[2] + 0.08); mkB.rotation.y = -0.4;
        labTipB.set(`C$${Math.round(vb * 1.3939)}B`);
        labTipB.mesh.position.set(tb[0] - 0.05, tb[1] + 0.22, tb[2] + 0.1); rev(labTipB, t, tRed + 0.2);
      }
      glowRd.setK(0.2 * io(win(t, tRed, tRed + 0.8)));
      glowG.setK(1.15 - 0.6 * io(win(t, tRed, tRed + 0.9)));
      // payout count-up + icons below the chart; they collapse when Alberta's line starts
      const gone = io(win(t, tRed - 0.05, tRed + 0.25));
      if (t > tPay0 - 0.05) {
        countUp(labPay, t, tPay0, tPay1, 0, 3.8, (x) => `$${x.toFixed(1)}B`);
        labPay.mesh.position.set(0, 1.78, 0.2); rev(labPay, t, tPay0 - 0.05);
        labYear.mesh.position.set(0, 1.42, 0.2); rev(labYear, t, tPay0 + 0.25);
        labPay.mesh.scale.multiplyScalar(1 - gone + 0.001); labYear.mesh.scale.multiplyScalar(1 - gone + 0.001);
      }
      const it = [w("l09", "dividends"), w("l09", "public"), w("l09", "services")];
      icons.forEach((g, i) => {
        const k = back(win(t, it[i] - 0.05, it[i] + 0.3), 2.0) * (1 - gone);
        g.visible = k > 0.01;
        g.position.set((i - 1) * 0.92, 0.72, 0.3);
        g.scale.setScalar(Math.max(0.001, k));
        g.rotation.y = (1 - clamp(k)) * 1.2;
      });
      payCoins.begin();
      for (let i = 0; i < 8; i++) {
        const ts = tPay0 + i * 0.22, u = win(t, ts, ts + 0.45);
        if (u <= 0 || u >= 1) continue;
        const sx = lerp(-1.0, 1.7, (i % 4) / 3), sy = 3.0 + (i % 3) * 0.25;
        payCoins.put(lerp(sx, 0, u), lerp(sy, 1.95, u) + Math.sin(Math.PI * u) * 0.3, 0.3, u * 7, i, u * 5);
      }
      payCoins.end();
      // camera: close on the first point, pull back while the line draws, then sit the chart in the upper half
      const pb = io(win(t, tChart, tDraw1 + 0.2));
      const dn = io(win(t, tDown, tDown + 1.0));
      const drift = win(t, tDown + 1.0, D);
      let cam = mix3([-1.35, 2.75, 2.6], [0, 3.65, 7.4], pb), look = mix3([-1.65, 2.6, 0], [0, 3.55, 0], pb);
      const gp = io(win(t, tL("l10") - 0.1, eL("l10") + 0.2)) * (1 - io(win(t, tRed - 0.1, tRed + 0.5)));
      cam = mix3(cam, [0.8 - 1.6 * drift, 2.6 + 0.5 * drift, 11.0 + drift * 2.2], dn); look = mix3(look, [0.2 - 0.4 * drift, 2.45, 0], dn);
      cam = mix3(cam, [1.1, 4.4, 6.6], gp); look = mix3(look, [0.9, 4.1, 0], gp);
      return { set: "chart", cam, look, fov: 34, aperture: 0.25, focus: cam[2], bloom: 0.7, keyPos: [-3, 7, 8], keyTarget: [0, 1, 0], keyI: 90, rimI: 0.8, fillI: 0.3 };
    } });

  // 6 · dotted map
  const tMap = tL("l12") - 0.1, t18a = w("l12", "eighteen") - 0.05, t18b = w("l12", "dollars") + 0.15, tPanUp = w("l12", "last") - 0.1;
  const tSmear = tL("l13") - 0.16;
  S.push({ t0: tMap, set: "map", cut: true, mb: (t) => (t > tSmear ? 8 : t < tMap + 0.6 ? 4 : 1), shutter: 1 / 30,
    fn(t) {
      const z0 = o3(win(t, tMap, tMap + 0.7));
      const pan = io(win(t, tPanUp, tPanUp + 0.8));
      const cx0 = mapR[0], cz0 = mapR[1];
      let cam = mix3([cx0 + 0.5, 3.4, cz0 + 3.2], [cx0 - 0.5, 7.0, cz0 + 6.8], z0);
      let look = mix3([cx0 + 0.6, 0, cz0 + 0.2], [cx0 - 0.7, 0, cz0 - 0.2], z0);
      const van = along("west", 1), mx = (cx0 + van[0]) / 2, mz = (cz0 + van[1]) / 2;
      const fx = lerp(van[0], cx0, 0.42), fz = lerp(van[1], cz0, 0.42);
      cam = mix3(cam, [fx + 0.7, 7.4, fz + 5.0], pan); look = mix3(look, [fx - 0.2, 0, fz - 0.9], pan);
      const od = win(t, tMap + 0.85, tSmear);
      cam = [cam[0] + 1.4 * od, cam[1] - 0.8 * od, cam[2] - 1.0 * od];
      const sm = i2(win(t, tSmear, tL("l13")));
      look = [look[0] - 3.5 * sm, look[1], look[2] + 6 * sm];
      ships.forEach((s, i) => {
        const route = i < 3 ? "sea" : "seaS";
        const u = ((t - tMap) * 0.12 + i * 0.21) % 1;
        const p = along(route, u);
        s.visible = true; s.position.set(p[0], 0, p[1]); s.rotation.y = p[2];
      });
      pigs.begin();
      ["west", "south", "east"].forEach((k, j) => { for (let i = 0; i < 6; i++) { const p = along(k, ((t - tMap) * 0.3 + i / 6 + j * 0.1) % 1); pigs.put(p[0], 0.03, p[1], Math.PI / 2, 0, 0); } });
      void 0;
      pigs.end();
      rev(labRegion, t, tMap + 0.25);
      labRegion.mesh.position.set(mapR[0] + 0.1, 0.32, mapR[1] - 0.05);
      rev(labAK, t, tMap + 0.6); labAK.mesh.position.set(MD.labels.alaska[0], 0.2, MD.labels.alaska[1]);
      rev(labUS, t, tMap + 0.7); labUS.mesh.position.set(MD.labels.us[0], 0.2, MD.labels.us[1]);
      if (t > t18a - 0.05) countUp(lab18, t, t18a, t18b, 0, 18, (x) => `C$${Math.round(x)}B`);
      rev(lab18, t, t18a - 0.05); rev(labRev, t, w("l12", "revenue") - 0.05); rev(labFY, t, w("l12", "last") - 0.05);
      return { set: "map", cam, look, fov: 36, aperture: 0.7, focus: Math.hypot(cam[0] - look[0], cam[1] - look[1], cam[2] - look[2]), bloom: 0.6,
        keyPos: [cx0 - 3, 9, cz0 + 4], keyTarget: [cx0, 0, cz0], keyI: 45, rimI: 0.4, fillI: 0.25, envI: 0.6,
        after() {
          const hw = K.atScreen(lab18.mesh, 0.66, 0.30, 6.5); lab18.fit(0.036 * hw);
          K.atScreen(labRev.mesh, 0.66, 0.35, 6.5); labRev.fit(0.0125 * hw);
          K.atScreen(labFY.mesh, 0.66, 0.38, 6.5); labFY.fit(0.009 * hw);
        } };
    } });

  // 7 · the $1 coin, the people, the 100-coin grid with 30 gold
  const tCoin = tL("l13") + 0.02, tGrid = w("l13b", "thirty") - 0.15, tGold = w("l13b", "cents") - 0.05, tFall = w("l13b", "every") - 0.05;
  const tSlide = w("l13b", "dollar") - 0.25, t30 = w("l13b", "dollar") + 0.0;
  S.push({ t0: tCoin, set: "coin", cut: true, mb: (t) => (t < tCoin + 1.05 || (t > tSlide && t < tSlide + 0.35) ? 6 : 1), shutter: 1 / 30,
    fn(t) {
      const sp = o3(win(t, tCoin, tCoin + 1.05));
      const coinOut = win(t, tGrid, tGrid + 0.25);
      bigCoin.visible = coinOut < 1;
      bigCoin.rotation.set(0, (1 - sp) * Math.PI * 6, 0);
      bigCoin.scale.setScalar(lerp(0.6, 1, sp) * (1 - coinOut * 0.5));
      bigCoin.position.set(lerp(-0.6, 0, sp), 2.75, 0);
      glowC.setK(0.38 * io(win(t, tCoin, tCoin + 0.5)));
      crowd.forEach((p, i) => { p.position.y = lerp(-1.2, 0, back(win(t, tL("l13") + 0.55 + (i % 6) * 0.05 + Math.floor(i / 6) * 0.08, tL("l13") + 1.0 + (i % 6) * 0.05 + Math.floor(i / 6) * 0.08), 1.3)); });
      // grid
      gridCoins.begin(); gridGold.begin();
      const slide = i2(win(t, tSlide, tSlide + 0.3));
      if (t > tGrid && slide < 1) {
        let gi = 0;
        const goldSet = new Set(); const rr = K.rng(77); while (goldSet.size < 30) goldSet.add(Math.floor(rr() * 100));
        for (let i = 0; i < 100; i++) {
          const r = Math.floor(i / 10), c = i % 10;
          const pop = o3(win(t, tGrid + (r + c) * 0.012, tGrid + 0.18 + (r + c) * 0.012));
          let x = (c - 4.5) * 0.19 + slide * 6, y = 2.75 + (4.5 - r) * 0.19, z = 0;
          if (goldSet.has(i) && t > tGold) {
            const k = gi++;
            const f = win(t, tFall + k * 0.025, tFall + 0.7 + k * 0.025);
            const tx = ((k % 10) - 4.5) * 0.3, tz = 1.75 - Math.floor(k / 10) * 0.45;
            const fx = lerp(x, tx, io(f)), fy = lerp(y, 0.95, i2(f)), fz = lerp(z, tz, io(f));
            if (f < 1) gridGold.put(fx, fy, fz, Math.PI / 2 + f * 1.2, 0, f * 1.5, pop);
          } else gridCoins.put(x, y, z, Math.PI / 2, 0, 0, pop);
        }
      }
      gridCoins.end(); gridGold.end();
      crowd.forEach((p, i) => p.userData.gild(0.0));
      rev(lab30, t, t30); rev(labEvery, t, t30 + 0.2);
      return { set: "coin", cam: [lerp(-1.0, 0.9, win(t, tCoin, tL("l14"))), lerp(1.75, 2.05, win(t, tCoin, tL("l14"))), lerp(11.4, 9.4, win(t, tCoin, tL("l14")))], look: [0, 1.55, 0], fov: 34, aperture: 1.0, focus: 9.4, warmI: 8, warmPos: [0, 3.4, -2],
        bloom: 0.6, keyPos: [-3, 8, 7], keyTarget: [0, 1.5, 0], keyI: 110, rimI: 1.0,
        after() { /* coin face drawn once */ } };
    } });

  // 8 · red title "And here's the twist."
  const tRedT = tL("l14") - 0.1;
  S.push({ t0: tRedT, set: "redtitle", cut: true,
    fn(t) {
      const ws = [w("l14", "and"), w("l14", "here"), w("l14", "the")];
      rW.forEach((l, i) => rev(l, t, ws[i] - 0.05));
      rev(rTw, t, w("l14", "twist") - 0.05);
      rGlow.setK(0.85 * io(win(t, w("l14", "twist") - 0.1, w("l14", "twist") + 0.3)));
      const u = win(t, tRedT, tL("l15"));
      return { set: "redtitle", cam: [0, 0, lerp(10, 9.1, u)], look: [0, 0, 0], fov: 34, aperture: 0, bloom: 0.75, keyI: 0, rimI: 0, fillI: 0,
        after() {
          const hw = K.atScreen(rW[0].mesh, 0.5, 0.39, 10); // placeholder, re-laid below
          const gap = 0.022;
          rW.forEach((l) => l.fit(0.026 * hw));
          const ww = rW.map((l) => l.tw() / (hw * 9 / 16));
          let x = 0.5 - (ww.reduce((a, b) => a + b, 0) + gap * 2) / 2;
          rW.forEach((l, i) => { K.atScreen(l.mesh, x + ww[i] / 2, 0.39, 10); x += ww[i] + gap; });
          K.atScreen(rTw.mesh, 0.5, 0.49, 10); rTw.fit(0.085 * hw);
          K.atScreen(rGlow, 0.5, 0.52, 10.5);
        } };
    } });

  // 9 · the plant: tanks rise, red $0 NEW DEPOSITS; 2006: a coin drops in and the glow turns gold
  const tPlant = tL("l15") - 0.08, tZero = w("l15", "deposits") - 0.1, tCoinIn = w("l16", "two") - 0.25;
  S.push({ t0: tPlant, set: "plant", cut: true, mb: (t) => (t < tPlant + 1.4 || (t > tCoinIn && t < tCoinIn + 0.6) ? 6 : 1), shutter: 1 / 30,
    fn(t) {
      tanks.forEach((tk, i) => (tk.position.y = lerp(-2.2, 0, o5(win(t, tPlant + 0.15 + i * 0.25, tPlant + 0.5 + i * 0.25)))));
      towers.position.y = lerp(-2.2, 0, o5(win(t, tPlant + 0.7, tPlant + 1.05)));
      flare.visible = flareTip.visible = t > tPlant + 1.0;
      flare.scale.y = o3(win(t, tPlant + 1.0, tPlant + 1.3)); flare.position.y = 1.3 * flare.scale.y; flareTip.position.y = 2.66 * flare.scale.y;
      const redK = io(win(t, tZero - 0.15, tZero + 0.4)) * (1 - io(win(t, tCoinIn + 0.4, tCoinIn + 1.0)));
      glowP.setK(0.4 * redK);
      glowPg.setK(0.17 * io(win(t, tCoinIn + 0.35, tCoinIn + 1.0)));
      rev(lab0, t, tZero, tCoinIn + 0.4); rev(labDep, t, tZero + 0.2, tCoinIn + 0.4);
      dropCoin.begin();
      if (t > tCoinIn) {
        const u = win(t, tCoinIn, tCoinIn + 0.5), b = win(t, tCoinIn + 0.5, tCoinIn + 0.9);
        const x = lerp(-3.2, -0.95, o3(u)), y = u < 1 ? lerp(3.8, 0.2, i2(u)) : 0.2 + Math.sin(Math.PI * b) * 0.25 * (1 - b);
        const lay = io(win(t, tCoinIn + 0.9, tCoinIn + 1.3));
        dropCoin.put(x, lerp(y, 0.06, lay), 1.1, lerp(Math.PI / 2, 0, lay), 0.3, u * 6 * (1 - lay));
      }
      dropCoin.end();
      const u = win(t, tPlant, tL("l17"));
      return { set: "plant", cam: [lerp(-1.6, 2.0, u), lerp(1.9, 2.4, u), lerp(14.2, 11.4, u)], look: [lerp(0.2, 0.6, u), 2.0, 0], fov: 34, aperture: 0.9, focus: 13,
        warmI: 8 * redK + 8 * io(win(t, tCoinIn + 0.35, tCoinIn + 1.0)), warmColor: redK > 0.3 ? "#ff3b30" : "#ffa640", warmPos: [0.2, 3.3, -1.5],
        bloom: 0.55, keyPos: [-3 + 3 * u, 8, 7], keyTarget: [0.3, 1.0, 0], keyI: 72, rimI: 0.8,
        after() { const hw = K.atScreen(lab0.mesh, 0.5, 0.36, 12); lab0.fit(0.04 * hw); K.atScreen(labDep.mesh, 0.5, 0.415, 12); labDep.fit(0.0145 * hw); K.atScreen(glowP, 0.5, 0.39, 13.5); } };
    } });

  // 10 · ending: the two spheres drop again, "=", pull back, Alaska's stack rises, Alberta's a quarter
  const tEnd = tL("l17") - 0.12, tEq = w("l18", "same") - 0.05, tBack = tL("l19") - 0.15;
  const tEA0 = w("l19", "kept") - 0.1, tEA1 = eL("l19") + 0.4, tEB0 = tL("l20") + 0.05, tEB1 = eL("l20") + 0.2;
  S.push({ t0: tEnd, set: "open", cut: true, mb: (t) => (t < tEnd + 0.95 || (t > tBack && t < tBack + 0.4) ? 6 : 1), shutter: 1 / 40,
    fn(t) {
      sphereDrop(spA, -1, 1.86, tEnd + 0.22, t, -0.25);
      sphereDrop(spB, 1, 1.86, tEnd + 0.55, t, 0.25);
      eq.visible = t > tEq && t < tBack + 0.25;
      eq.scale.setScalar(back(win(t, tEq, tEq + 0.2), 2.2));
      const nA = 46 * o3(win(t, tEA0, tEA1)), nB = 11.5 * o3(win(t, tEB0, tEB1));
      const hA = stA.set(nA), hB = stB.set(nB);
      if (t > tEnd + 0.22) spA.position.y = 1.3 + hA + 0.56;
      if (t > tEnd + 0.55) spB.position.y = 1.3 + hB + 0.56;
      const g = io(win(t, tEA0, tEA0 + 0.8));
      glowO.setK(0.6 * g);
      const pb = io(win(t, tBack, tBack + 0.4));
      const camA = mix3([-0.5, 1.95, 9.8], [0.5, 1.85, 8.4], win(t, tEnd, tBack));
      const ob = win(t, tBack + 0.4, D);
      const cam = mix3(camA, [lerp(-3.4, 3.4, ob), lerp(5.0, 4.0, ob), lerp(21.4, 17.2, ob)], pb);
      const look = mix3([0, 1.35, 0], [0.15, 3.55, 0], pb);
      return Object.assign({ set: "open", cam, look, fov: 34, focus: lerp(9.4, 20, pb), aperture: 0.9, warmI: 7 * g, bloom: 0.5 }, OPEN_LIGHT);
    } });

  // draw the $1 coin face once fonts are ready
  K.ready.then(() => {
    const c = coinFaceCv.getContext("2d");
    const gr = c.createRadialGradient(512, 430, 60, 512, 512, 520);
    gr.addColorStop(0, "#5a4320"); gr.addColorStop(1, "#22180a");
    c.fillStyle = gr; c.fillRect(0, 0, 1024, 1024);
    const tmp = document.createElement("canvas");
    K.drawText(tmp, big("$1", 300, GOLD, { depth: 0.06 }));
    c.save();
    if (window.GOLD_COINFLIP) { c.translate(1024, 0); c.scale(-1, 1); }
    c.drawImage(tmp, 512 - tmp.width / 2, 512 - tmp.height / 2 - 10);
    c.restore();
    coinFaceTex.needsUpdate = true;
  });

  return { shots: S, reset };
};
