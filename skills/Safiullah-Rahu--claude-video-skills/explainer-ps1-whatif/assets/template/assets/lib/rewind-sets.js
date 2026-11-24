/* rewind-sets.js — the sets and cast of "Rewind" (PS1 what-if). window.REWIND_SETS(K) -> W
   Sets are groups, shown one or two at a time per shot: W.show(["city"]).
   city  : origin. Street along x (road z -6..6), south sidewalk z 6..10, north plaza with civic steps (top y 1.6 at z -14,
           bottom at z -10.8), bus stop x 20 z 8.6, cafe front x -18, court x 55 z -22, wedding lawn x -55 z -26.
   apt   : x 300. Bedroom (bed at x 296), living room (couch facing +z... see below), kitchen + table, a big window.
   office: x -300. Meeting room + interview desk.
   resto : z 300. Candle table for two, brick, string lights.
   cafe  : z -300. Counter + barista.
*/
window.REWIND_SETS = function (K) {
  const T = K.T, M = K.mat, tex = K.tex;
  const R = K.mulberry(1234);
  const sets = {};
  const grp = (name, x, y, z) => { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); K.scene.add(g); sets[name] = g; return g; };
  const add = (parent) => ({ parent });

  // ---------------- CITY ----------------
  const city = grp("city");
  const P = add(city);
  K.sky("#8fb4d8", "#e9d6c4", P);
  const asphaltM = M({ map: tex.asphalt(), color: "#9a9aa0" });
  const walkM = M({ map: tex.grid("#b8b0a4", "#8d867c", 2), color: "#ffffff" });
  const curbM = M({ color: "#c9c4bb" });
  const stoneM = M({ map: tex.noise("#cfc6b6", 0.12, 3), color: "#ffffff" });
  K.box(400, 0.2, 12, asphaltM, { parent: city, y: -0.1, uv: [40, 1.2] });
  K.box(400, 0.32, 4, walkM, { parent: city, y: 0.0, z: 8, uv: [100, 1] });
  K.box(400, 0.32, 4, walkM, { parent: city, y: 0.0, z: -8, uv: [100, 1] });
  K.box(400, 0.34, 0.25, curbM, { parent: city, y: 0, z: 6.0 });
  K.box(400, 0.34, 0.25, curbM, { parent: city, y: 0, z: -6.0 });
  // lane marks + crosswalk
  const markM = M({ color: "#e8e4d8" });
  for (let x = -190; x < 190; x += 6) K.box(2.6, 0.02, 0.18, markM, { parent: city, x, y: 0.005, z: 0 });
  for (let i = 0; i < 7; i++) K.box(0.8, 0.02, 11, markM, { parent: city, x: 30 + i * 1.5, y: 0.01, z: 0 });
  // plaza + civic steps (north side, x -14..14)
  K.box(28, 1.6, 12, stoneM, { parent: city, y: 0.8, z: -20, uv: [6, 3] });
  const stepM = M({ map: tex.noise("#d6cdbd", 0.1, 4), color: "#ffffff" });
  for (let i = 0; i < 8; i++) {
    const h = 0.2 * (i + 1);
    K.box(28, h, 0.4, stepM, { parent: city, y: h / 2, z: -10.8 - 0.4 * i - 0.2, uv: [10, 0.3] });
  }
  // the loose/cracked step (the trip): a darker slab on step 5
  const crackTex = K.canvasTex(32, 8, (g, w, h) => { g.fillStyle = "#b9ae9c"; g.fillRect(0, 0, w, h); g.fillStyle = "#3b342c"; for (let x = 0; x < w; x++) g.fillRect(x, 3 + Math.round(Math.sin(x * 1.3) * 1.5), 1, 1); }, "crack");
  K.box(1.6, 0.022, 0.38, M({ map: crackTex, color: "#ffffff" }), { parent: city, x: 0.6, y: 1.211, z: -13.0 });
  // civic building
  const civM = M({ map: tex.windows("#d9cfbd", "#4c5866", "#e8d69a", 4, 2, 5), color: "#ffffff" });
  K.box(40, 18, 10, civM, { parent: city, y: 10.6, z: -31, uv: [5, 2] });
  const colM = M({ color: "#e6dfd1" });
  for (let i = 0; i < 8; i++) K.cyl(0.45, 0.5, 7, 8, colM, { parent: city, x: -12.25 + i * 3.5, y: 5.1, z: -25.4 });
  K.box(30, 1.4, 2.4, M({ color: "#d5ccbb" }), { parent: city, y: 9.2, z: -25.6 });
  const sign = K.signTex("CITY LIBRARY", { s: 2, bg: "#d5ccbb", fill: "#5a4c3c" });
  K.plane(9, 1.0, M({ map: sign }), { parent: city, y: 9.2, z: -24.38 });
  // street buildings
  const bcols = [["#c98f7e", "#3e4a5c"], ["#a8b7c4", "#2f3d4f"], ["#d8c49a", "#45505e"], ["#8f9a8a", "#2c3640"], ["#e0b8a8", "#3d4757"], ["#b0a090", "#38404d"]];
  const bm = bcols.map((c, i) => M({ map: tex.windows(c[0], c[1], "#f0dfa8", 3, 3, 10 + i), color: "#ffffff" }));
  for (let side of [-1, 1]) {
    let x = -190;
    while (x < 190) {
      const w = 10 + R() * 12, h = 9 + R() * 26, d = 14;
      const zc = side * (10 + d / 2 + 0.2);
      const hit = (a, b) => x < b && x + w > a;
      if (!(side < 0 && (hit(-22, 22) || hit(38, 74) || hit(-77, -36))))
        K.box(w - 0.6, h, d, bm[Math.floor(R() * bm.length)], { parent: city, x: x + w / 2, y: h / 2, z: zc, uv: [Math.round(w / 4), Math.round(h / 3.5)] });
      x += w;
    }
  }
  // far skyline ring (cheap)
  const farM = M({ map: tex.windows("#9aa8b8", "#5b6676", null, 4, 6, 77), color: "#ffffff" });
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; const r = 230; K.box(30, 40 + R() * 60, 30, farM, { parent: city, x: Math.cos(a) * r, y: 30, z: Math.sin(a) * r, ry: -a, uv: [4, 8] }); }
  // trees
  const trunkM = M({ color: "#5a4632" }), leafM = M({ map: tex.leaves("#6f9a45"), color: "#ffffff" });
  const tree = (x, z, s) => { s = s || 1; K.cyl(0.14 * s, 0.2 * s, 3 * s, 5, trunkM, { parent: city, x, y: 1.5 * s, z }); K.ico(1.8 * s, leafM, { parent: city, x, y: 4.0 * s, z, sy: 0.85 }); K.ico(1.2 * s, leafM, { parent: city, x: x + 0.9 * s, y: 4.6 * s, z: z + 0.4 * s }); };
  for (let x = -180; x < 180; x += 13) { if (Math.abs(x - 20) > 5) tree(x + 3, 9.3, 0.9 + R() * 0.3); if (x < -16 || x > 16) tree(x + 8, -9.3, 0.9 + R() * 0.3); }
  // street lamps + traffic light
  const poleM = M({ color: "#3c4148" }), lampM = M({ color: "#fff3cf", emissive: "#fff0c0" });
  for (let x = -170; x < 180; x += 26) for (const z of [6.6, -6.6]) { K.cyl(0.07, 0.09, 5, 5, poleM, { parent: city, x, y: 2.5, z }); K.box(0.5, 0.2, 0.3, lampM, { parent: city, x, y: 5, z: z - Math.sign(z) * 0.3 }); }
  // bus stop (x 20, z 8.6), shelter faces the road (-z)
  const glassM = M({ color: "#9fc1cf", transparent: true, alpha: 0.35, double: true });
  K.box(4.2, 0.12, 1.6, poleM, { parent: city, x: 20, y: 2.6, z: 9.0 });
  K.box(4.2, 2.4, 0.06, glassM, { parent: city, x: 20, y: 1.4, z: 9.75 });
  K.box(0.06, 2.4, 1.4, glassM, { parent: city, x: 22.05, y: 1.4, z: 9.05 });
  for (const x of [17.95, 22.05]) K.cyl(0.05, 0.05, 2.6, 5, poleM, { parent: city, x, y: 1.3, z: 9.75 });
  K.box(2.6, 0.08, 0.45, M({ map: tex.wood("#9a6a3a"), color: "#ffffff" }), { parent: city, x: 20, y: 0.62, z: 9.4 });
  for (const x of [19, 21]) K.box(0.08, 0.5, 0.4, poleM, { parent: city, x, y: 0.37, z: 9.4 });
  const busSign = K.signTex("BUS 12", { s: 2, bg: "#2d6fb3", fill: "#ffffff" });
  K.cyl(0.05, 0.05, 3, 5, poleM, { parent: city, x: 16.8, y: 1.5, z: 7.2 });
  K.plane(0.9, 0.45, M({ map: busSign, double: true }), { parent: city, x: 16.8, y: 2.9, z: 7.2 });
  const adTex = K.canvasTex(32, 48, (g, w, h) => { g.fillStyle = "#e7d7b7"; g.fillRect(0, 0, w, h); g.fillStyle = "#d0533d"; g.fillRect(4, 6, 24, 24); g.fillStyle = "#f5e9d0"; g.fillRect(9, 11, 14, 14); window.PIXFONT.draw(g, "VHS", 16, 35, 1, { fill: "#2a2a2a", align: "center" }); }, "ad");
  K.plane(1.2, 1.8, M({ map: adTex, unlit: false }), { parent: city, x: 21.4, y: 1.4, z: 9.70, ry: Math.PI });
  // cafe front (x -18, south side)
  const cafeM = M({ map: tex.brick("#a35b46"), color: "#ffffff" });
  K.box(12, 7, 0.4, cafeM, { parent: city, x: -18, y: 3.5, z: 10.4, uv: [3, 2] });
  K.box(8, 2.4, 0.1, M({ color: "#ffd99a", emissive: "#7a5a30" }), { parent: city, x: -18, y: 1.6, z: 10.15 });
  const awn = tex.stripes("#2f8f7a", "#f1ece0", 6, true);
  const aw = K.box(9, 0.08, 1.8, M({ map: awn, color: "#ffffff", double: true }), { parent: city, x: -18, y: 3.3, z: 9.4 }); aw.rotation.x = -0.35;
  K.plane(5, 0.9, M({ map: K.signTex("CAFE", { s: 2, bg: "#2b2620", fill: "#f3d27a" }) }), { parent: city, x: -18, y: 4.6, z: 10.18, ry: Math.PI });
  // basketball court (x 55, z -22), fence + hoop at z -30
  const courtTex = K.canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#b86a45"; g.fillRect(0, 0, w, h); g.fillStyle = "#ece2cf"; g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h);
    g.fillRect(24, 0, 1, 22); g.fillRect(40, 0, 1, 22); g.fillRect(24, 22, 17, 1); for (let a = 0; a < 40; a++) { const x = 32 + Math.cos(a / 40 * Math.PI) * 8, y = 22 + Math.sin(a / 40 * Math.PI) * 8; g.fillRect(x | 0, y | 0, 1, 1); } }, "court", false);
  K.box(28, 0.1, 18, M({ map: courtTex, color: "#ffffff" }), { parent: city, x: 55, y: 0.05, z: -21 });
  const fenceTex = K.canvasTex(16, 16, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#7d8790"; for (let i = 0; i < 16; i++) { g.fillRect(i, i, 1, 1); g.fillRect(15 - i, i, 1, 1); } }, "fence");
  const fenceM = M({ map: fenceTex, color: "#ffffff", double: true }); fenceM.uniforms.uAlphaTest.value = 0.5;
  for (const [x, z, w, ry] of [[55, -30.2, 28, 0], [41, -21, 18, Math.PI / 2], [69, -21, 18, Math.PI / 2]]) K.plane(w, 4, fenceM, { parent: city, x, y: 2, z, ry, uv: [w / 1.2, 4 / 1.2] });
  K.cyl(0.1, 0.12, 3.2, 6, poleM, { parent: city, x: 55, y: 1.6, z: -29.4 });
  K.box(0.12, 0.12, 1.1, poleM, { parent: city, x: 55, y: 3.15, z: -28.9 });
  K.box(1.8, 1.05, 0.06, M({ map: K.canvasTex(16, 10, (g) => { g.fillStyle = "#f4f4f0"; g.fillRect(0, 0, 16, 10); g.fillStyle = "#c8452c"; g.fillRect(0, 0, 16, 1); g.fillRect(0, 9, 16, 1); g.fillRect(0, 0, 1, 10); g.fillRect(15, 0, 1, 10); g.fillRect(5, 4, 6, 1); g.fillRect(5, 4, 1, 4); g.fillRect(10, 4, 1, 4); }, "board", false) }), { parent: city, x: 55, y: 3.45, z: -28.35 });
  const rimM = M({ color: "#e05a2c" });
  const rim = new T.Mesh(new T.TorusGeometry(0.23, 0.02, 4, 10), rimM); rim.rotation.x = Math.PI / 2; rim.position.set(55, 3.05, -28.0); city.add(rim);
  const netTex = K.canvasTex(8, 8, (g) => { g.clearRect(0, 0, 8, 8); g.fillStyle = "#f2f2f2"; for (let i = 0; i < 8; i++) { g.fillRect(i, i, 1, 1); g.fillRect(7 - i, i, 1, 1); } }, "net");
  const netM = M({ map: netTex, double: true, color: "#ffffff" }); netM.uniforms.uAlphaTest.value = 0.5;
  const net = new T.Mesh(new T.CylinderGeometry(0.23, 0.15, 0.42, 8, 1, true), netM); net.position.set(55, 2.84, -28.0); city.add(net);
  const ball = K.ico(0.12, M({ map: K.canvasTex(8, 8, (g) => { g.fillStyle = "#d9692e"; g.fillRect(0, 0, 8, 8); g.fillStyle = "#3a2214"; g.fillRect(0, 3, 8, 1); g.fillRect(3, 0, 1, 8); }, "ballt"), color: "#ffffff" }), { parent: city, x: 55, y: 1, z: -18 }, 1);
  const ballShadow = K.blob(0.16, { parent: city, x: 55, y: 0.12, z: -18 });
  // park lawn + wedding arch (x -55, z -26)
  K.box(36, 0.2, 26, M({ map: tex.grass(), color: "#ffffff" }), { parent: city, x: -56, y: 0.0, z: -24, uv: [12, 9] });
  const archM = M({ color: "#f3efe6" }), flowerM = M({ map: K.canvasTex(16, 16, (g) => { g.fillStyle = "#5f8f45"; g.fillRect(0, 0, 16, 16); const r = K.mulberry(5); const c = ["#f2c6d4", "#ffffff", "#f6e39a", "#e88aa6"]; for (let i = 0; i < 40; i++) { g.fillStyle = c[i % 4]; g.fillRect(r() * 16 | 0, r() * 16 | 0, 2, 2); } }, "flowers"), color: "#ffffff" });
  for (const x of [-57.3, -52.7]) { K.cyl(0.12, 0.12, 3, 6, archM, { parent: city, x, y: 1.6, z: -30 }); K.ico(0.45, flowerM, { parent: city, x, y: 0.5, z: -30 }); }
  const arc = new T.Mesh(new T.TorusGeometry(2.3, 0.2, 4, 10, Math.PI), flowerM); arc.position.set(-55, 3.1, -30); city.add(arc);
  const chairM = M({ color: "#efeae0" });
  for (let r = 0; r < 3; r++) for (const s of [-1, 1]) for (let c = 0; c < 3; c++) {
    const x = -55 + s * (1.6 + c * 0.75), z = -25 + r * 1.2;
    K.box(0.5, 0.06, 0.45, chairM, { parent: city, x, y: 0.48, z }); K.box(0.5, 0.5, 0.05, chairM, { parent: city, x, y: 0.75, z: z + 0.22 });
  }
  for (let i = 0; i < 6; i++) tree(-70 + i * 6, -36, 1.1);
  // petals (instanced, positions set per frame)
  const petalM = M({ color: "#f6d4de", double: true, unlit: true });
  const petals = new T.InstancedMesh(new T.PlaneGeometry(0.06, 0.06), petalM, 120); petals.frustumCulled = false; city.add(petals);
  const petalSeeds = Array.from({ length: 120 }, () => [R(), R(), R(), R()]);
  // cars
  const carCols = ["#c23b2f", "#e8d24a", "#2f5f9e", "#d8d8d2", "#3b3f46", "#5f8a5a"];
  const cars = [];
  const wheelM = M({ color: "#1d1d1f" }), winM = M({ color: "#26303a", emissive: "#0c1016" });
  for (let i = 0; i < 10; i++) {
    const g = new T.Group(); const body = M({ color: carCols[i % carCols.length] });
    K.box(4.2, 0.9, 1.8, body, { parent: g, y: 0.75 }); K.box(2.3, 0.7, 1.6, body, { parent: g, y: 1.5, x: -0.2 });
    K.box(2.32, 0.5, 1.62, winM, { parent: g, y: 1.52, x: -0.2 });
    for (const [x, z] of [[1.3, 0.85], [1.3, -0.85], [-1.3, 0.85], [-1.3, -0.85]]) { const w = K.cyl(0.36, 0.36, 0.25, 6, wheelM, { parent: g, x, y: 0.36, z }); w.rotation.x = Math.PI / 2; }
    K.box(0.06, 0.25, 0.4, M({ color: "#fff6d8", emissive: "#fff2c0" }), { parent: g, x: 2.11, y: 0.85, z: 0.6 }); K.box(0.06, 0.25, 0.4, M({ color: "#fff6d8", emissive: "#fff2c0" }), { parent: g, x: 2.11, y: 0.85, z: -0.6 });
    K.blob(1.6, { parent: g, y: 0.03 }).scale.set(1.4, 0.7, 1);
    city.add(g); cars.push(g);
  }

  // ---------------- APARTMENT (x 300) ----------------
  const apt = grp("apt", 300, 0, 0);
  const A = add(apt);
  const floorA = M({ map: tex.wood("#9a7048"), color: "#ffffff" });
  K.box(16, 0.1, 12, floorA, { parent: apt, y: -0.05, uv: [8, 6] });
  const wallA = M({ map: tex.noise("#e3d9c8", 0.06, 8), color: "#ffffff" });
  K.box(16, 3.2, 0.2, wallA, { parent: apt, y: 1.6, z: -6, uv: [4, 1] });
  K.box(0.2, 3.2, 12, wallA, { parent: apt, x: -8, y: 1.6, uv: [3, 1] });
  K.box(0.2, 3.2, 12, wallA, { parent: apt, x: 8, y: 1.6, uv: [3, 1] });
  K.box(16, 0.1, 12, M({ color: "#efe9df" }), { parent: apt, y: 3.2 });
  K.box(0.2, 3.2, 6, wallA, { parent: apt, x: -2, y: 1.6, z: -3 }); // bedroom partition
  // window on back wall (living), with a backdrop that changes day/night
  const skyBack = M({ unlit: true, noFog: true, color: "#9cc4e4" });
  const skyline = K.canvasTex(64, 32, (g, w, h) => { g.clearRect(0, 0, w, h); const r = K.mulberry(9); for (let x = 0; x < w;) { const bw = 4 + (r() * 7 | 0), bh = 8 + (r() * 20 | 0); g.fillStyle = "#3a4250"; g.fillRect(x, h - bh, bw, bh); g.fillStyle = "#f2d88a"; for (let yy = h - bh + 2; yy < h - 1; yy += 3) for (let xx = x + 1; xx < x + bw - 1; xx += 2) if (r() < 0.35) g.fillRect(xx, yy, 1, 1); x += bw; } }, "skyline");
  const skyBack2 = M({ map: skyline, unlit: true, noFog: true, color: "#ffffff" }); skyBack2.uniforms.uAlphaTest.value = 0.4;
  K.plane(9, 4.4, skyBack, { parent: apt, x: 3.5, y: 1.9, z: -7.0 });
  K.plane(9, 3.6, skyBack2, { parent: apt, x: 3.5, y: 1.5, z: -6.95 });
  const frameM = M({ color: "#f4efe6" });
  K.box(4.8, 2.0, 0.16, M({ color: "#000000", transparent: true, alpha: 0.0 }), { parent: apt, x: 3.5, y: 1.75, z: -6.0 }).visible = false;
  // cut the window: place frame bars over a hole (the wall behind is the backdrop: we re-build the back wall as pieces)
  apt.children.find((c) => c.position.z === -6 && c.geometry.parameters && c.geometry.parameters.width === 16).visible = false;
  K.box(16, 0.8, 0.2, wallA, { parent: apt, y: 0.4, z: -6, uv: [4, 0.25] });
  K.box(16, 0.6, 0.2, wallA, { parent: apt, y: 2.9, z: -6, uv: [4, 0.2] });
  K.box(9.1, 1.8, 0.2, wallA, { parent: apt, x: -3.45, y: 1.7, z: -6, uv: [2, 0.6] });
  K.box(2.1, 1.8, 0.2, wallA, { parent: apt, x: 6.95, y: 1.7, z: -6, uv: [0.5, 0.6] });
  for (const x of [1.0, 3.5, 6.0]) K.box(0.12, 1.8, 0.24, frameM, { parent: apt, x: x - 0.1, y: 1.7, z: -6 });
  K.box(5.2, 0.12, 0.3, frameM, { parent: apt, x: 3.4, y: 0.8, z: -5.95 });
  // living: couch facing the TV. couch at z -1.5 (back to the window), TV at z +4 facing -z
  const couchM = M({ map: tex.fabric("#5b6f8a", 0.18), color: "#ffffff" });
  K.box(2.6, 0.45, 0.95, couchM, { parent: apt, x: 3.5, y: 0.25, z: -1.8 });
  K.box(2.6, 0.75, 0.25, couchM, { parent: apt, x: 3.5, y: 0.7, z: -2.2 });
  for (const x of [2.1, 4.9]) K.box(0.25, 0.65, 0.95, couchM, { parent: apt, x, y: 0.45, z: -1.8 });
  K.box(1.0, 0.4, 0.6, M({ map: tex.wood("#6f4a2c"), color: "#ffffff" }), { parent: apt, x: 3.5, y: 0.2, z: 0.0 });
  K.box(1.6, 0.5, 0.45, M({ map: tex.wood("#5a3a22"), color: "#ffffff" }), { parent: apt, x: 3.5, y: 0.25, z: 4.2 });
  const tvScreen = M({ color: "#7fa8d8", emissive: "#3a5a8a", unlit: true });
  K.box(1.5, 0.9, 0.08, M({ color: "#141418" }), { parent: apt, x: 3.5, y: 1.05, z: 4.3 });
  K.plane(1.38, 0.78, tvScreen, { parent: apt, x: 3.5, y: 1.05, z: 4.25, ry: Math.PI });
  K.cyl(0.03, 0.05, 1.5, 5, poleM, { parent: apt, x: 5.4, y: 0.75, z: -2.4 });
  K.cyl(0.25, 0.35, 0.35, 6, M({ color: "#f4e2b8", emissive: "#6a5430" }), { parent: apt, x: 5.4, y: 1.6, z: -2.4 });
  K.box(1.8, 1.2, 0.05, M({ map: K.canvasTex(16, 12, (g) => { g.fillStyle = "#e8d8b8"; g.fillRect(0, 0, 16, 12); g.fillStyle = "#6f8fb8"; g.fillRect(1, 1, 14, 6); g.fillStyle = "#5f8a4a"; g.fillRect(1, 7, 14, 4); }, "art"), color: "#ffffff" }), { parent: apt, x: -5, y: 1.8, z: -5.88 });
  // bedroom (x -8..-2 local, z -6..0)
  K.box(1.8, 0.45, 2.2, M({ color: "#7a5636" }), { parent: apt, x: -5.5, y: 0.22, z: -4.6 });
  K.box(1.7, 0.18, 2.0, M({ map: tex.fabric("#e9e4da", 0.06), color: "#ffffff" }), { parent: apt, x: -5.5, y: 0.52, z: -4.55 });
  const duvet = K.box(1.74, 0.16, 1.35, M({ map: tex.fabric("#c8d0de", 0.1), color: "#ffffff" }), { parent: apt, x: -5.5, y: 0.66, z: -4.05 });
  K.box(0.9, 0.14, 0.4, M({ color: "#f7f4ee" }), { parent: apt, x: -5.5, y: 0.66, z: -5.4 });
  K.box(1.9, 1.0, 0.12, M({ color: "#5c3e26" }), { parent: apt, x: -5.5, y: 0.75, z: -5.75 });
  K.box(0.55, 0.55, 0.45, M({ map: tex.wood("#86603c"), color: "#ffffff" }), { parent: apt, x: -4.05, y: 0.28, z: -5.4 });
  const clock = new T.Group(); clock.position.set(-4.05, 0.7, -5.35); apt.add(clock);
  const clockFace = K.canvasTex(16, 16, (g) => { g.fillStyle = "#3fbfb0"; g.fillRect(0, 0, 16, 16); g.fillStyle = "#f6f1e4"; g.fillRect(2, 2, 12, 12); g.fillStyle = "#2a2a2a"; g.fillRect(7, 3, 1, 5); g.fillRect(7, 7, 4, 1); for (const [x, y] of [[7, 2], [13, 7], [7, 13], [2, 7]]) g.fillRect(x, y, 2, 1); }, "clockface");
  K.cyl(0.13, 0.13, 0.1, 8, M({ color: "#3fbfb0" }), { parent: clock }).rotation.x = Math.PI / 2;
  K.plane(0.2, 0.2, M({ map: clockFace, color: "#ffffff" }), { parent: clock, z: 0.052 });
  for (const s of [-1, 1]) K.ico(0.06, M({ color: "#d8d2c4" }), { parent: clock, x: s * 0.09, y: 0.14, z: 0 });
  // kitchen + table (x 3.5, z 2..5 is TV; kitchen on the left wall x -7..-3, z 1..5)
  const counterM = M({ map: tex.tiles("#e9e3d6", "#d9d1c0", 4), color: "#ffffff" });
  K.box(0.7, 0.95, 4.5, M({ map: tex.wood("#d6c4a2"), color: "#ffffff" }), { parent: apt, x: -7.5, y: 0.47, z: 3 });
  K.box(0.75, 0.06, 4.6, counterM, { parent: apt, x: -7.5, y: 0.97, z: 3 });
  K.box(0.8, 1.9, 0.8, M({ color: "#e8eef0" }), { parent: apt, x: -7.4, y: 0.95, z: 0.4 });
  K.box(3, 0.1, 0.2, M({ map: tex.tiles("#cfe2e6", "#bcd2d8", 6), color: "#ffffff" }), { parent: apt, x: -7.88, y: 1.6, z: 3, ry: Math.PI / 2 });
  const tableM = M({ map: tex.wood("#b08458"), color: "#ffffff" });
  K.box(1.3, 0.06, 0.9, tableM, { parent: apt, x: -4.5, y: 0.76, z: 3 });
  for (const [x, z] of [[-5.05, 2.65], [-3.95, 2.65], [-5.05, 3.35], [-3.95, 3.35]]) K.box(0.06, 0.74, 0.06, tableM, { parent: apt, x, y: 0.37, z });
  for (const z of [2.2, 3.8]) { K.box(0.45, 0.06, 0.45, tableM, { parent: apt, x: -4.5, y: 0.46, z }); K.box(0.45, 0.5, 0.05, tableM, { parent: apt, x: -4.5, y: 0.72, z: z + (z < 3 ? -0.22 : 0.22) }); }
  K.cyl(0.04, 0.03, 0.1, 6, M({ color: "#f2f0ea" }), { parent: apt, x: -4.3, y: 0.84, z: 2.9 });
  // front door (kitchen side, wall x 8? use the +z wall)
  K.box(16, 3.2, 0.2, wallA, { parent: apt, y: 1.6, z: 6, uv: [4, 1] });
  const doorM = M({ map: tex.wood("#6e4a2e"), color: "#ffffff" });
  const door = new T.Group(); door.position.set(-6.0, 0, 5.88); apt.add(door);
  K.box(1.0, 2.1, 0.06, doorM, { parent: door, x: 0.5, y: 1.05 });
  K.ico(0.04, M({ color: "#d8c27a" }), { parent: door, x: 0.88, y: 1.0, z: -0.06 });
  const bag = K.box(0.5, 0.4, 0.25, M({ color: "#7a4a3a" }), { parent: apt, x: -6.4, y: 0.2, z: 5.2 });
  const aptLamp = [303.5 + 1.9, 1.6, -2.4];

  // ---------------- OFFICE (x -300) ----------------
  const office = grp("office", -300, 0, 0);
  K.box(18, 0.1, 12, M({ map: tex.grid("#7e8792", "#6a727c", 4), color: "#ffffff" }), { parent: office, y: -0.05, uv: [6, 4] });
  const wallO = M({ map: tex.noise("#dfe2e4", 0.05, 12), color: "#ffffff" });
  K.box(18, 3.0, 0.2, wallO, { parent: office, y: 1.5, z: -6, uv: [4, 1] });
  K.box(0.2, 3.0, 12, wallO, { parent: office, x: -9, y: 1.5 });
  K.box(0.2, 3.0, 12, wallO, { parent: office, x: 9, y: 1.5 });
  K.box(18, 3.0, 0.2, wallO, { parent: office, y: 1.5, z: 6 });
  K.box(18, 0.1, 12, M({ map: tex.grid("#eef0f0", "#c9cdd0", 4), color: "#ffffff" }), { parent: office, y: 3.0, uv: [6, 4] });
  // ceiling light panels
  for (const [x, z] of [[-4, -2], [-4, 2], [4, -2], [4, 2]]) K.box(1.2, 0.04, 0.6, M({ color: "#ffffff", emissive: "#e8eef6", unlit: true }), { parent: office, x, y: 2.97, z });
  // meeting table (x -4)
  const mtM = M({ map: tex.wood("#c9a77e"), color: "#ffffff" });
  K.box(4.2, 0.08, 1.6, mtM, { parent: office, x: -4, y: 0.76, z: 0 });
  K.box(0.2, 0.72, 1.0, M({ color: "#5a5f66" }), { parent: office, x: -5.6, y: 0.36 }); K.box(0.2, 0.72, 1.0, M({ color: "#5a5f66" }), { parent: office, x: -2.4, y: 0.36 });
  const wb = K.canvasTex(64, 32, (g) => { g.fillStyle = "#f7f7f4"; g.fillRect(0, 0, 64, 32); g.fillStyle = "#2f5fa8"; window.PIXFONT.draw(g, "Q3 PLAN", 4, 3, 1, { fill: "#2f5fa8" }); g.fillStyle = "#c8452c"; g.fillRect(6, 14, 2, 12); g.fillRect(12, 18, 2, 8); g.fillRect(18, 11, 2, 15); g.fillStyle = "#3a3a3a"; g.fillRect(4, 26, 30, 1); g.fillStyle = "#2a8a5a"; g.fillRect(40, 12, 18, 1); g.fillRect(40, 16, 14, 1); g.fillRect(40, 20, 16, 1); }, "wb", false);
  K.box(3.0, 1.5, 0.05, M({ map: wb, color: "#ffffff" }), { parent: office, x: -8.86, y: 1.6, z: 0, ry: Math.PI / 2 });
  // window wall strip (right side) with skyline
  K.plane(7, 1.8, M({ map: skyline, unlit: true, noFog: true, color: "#ffffff" }), { parent: office, x: 8.88, y: 1.7, z: 0, ry: -Math.PI / 2 });
  // interview desk (x 4.5)
  K.box(2.0, 0.08, 1.0, M({ map: tex.wood("#7a5636"), color: "#ffffff" }), { parent: office, x: 4.5, y: 0.76, z: -1.5 });
  K.box(1.9, 0.7, 0.06, M({ color: "#4a3c30" }), { parent: office, x: 4.5, y: 0.38, z: -1.95 });
  K.box(0.5, 0.35, 0.05, M({ color: "#1c1e22" }), { parent: office, x: 4.0, y: 1.0, z: -1.8 }).rotation.x = -0.1;
  K.box(0.32, 0.02, 0.24, M({ color: "#f5f3ee" }), { parent: office, x: 4.9, y: 0.81, z: -1.3 });
  K.cyl(0.18, 0.14, 0.4, 6, M({ color: "#c4b49a" }), { parent: office, x: 6.8, y: 0.2, z: -5 }); K.ico(0.45, leafM, { parent: office, x: 6.8, y: 0.8, z: -5 });
  const logo = K.signTex("NORTHLINE", { s: 2, bg: "#dfe2e4", fill: "#4a5560" });
  K.plane(2.6, 0.5, M({ map: logo }), { parent: office, x: 4.5, y: 2.1, z: -5.88 });

  // ---------------- RESTAURANT (z 300) ----------------
  const resto = grp("resto", 0, 0, 300);
  K.box(14, 0.1, 12, M({ map: tex.tiles("#4a2f26", "#5a3a2e", 4), color: "#ffffff" }), { parent: resto, y: -0.05, uv: [6, 5] });
  const brickM = M({ map: tex.brick("#8f4a36", "#5a463a"), color: "#ffffff" });
  K.box(14, 3.4, 0.2, brickM, { parent: resto, y: 1.7, z: -5, uv: [7, 2] });
  K.box(0.2, 3.4, 12, brickM, { parent: resto, x: -7, y: 1.7, uv: [6, 2] });
  K.box(0.2, 3.4, 12, brickM, { parent: resto, x: 7, y: 1.7, uv: [6, 2] });
  const rtM = M({ color: "#f2ede4" });
  const rtables = [[0, -1.2], [-3.5, 0.5], [3.4, 0.2], [-2.5, -3.5], [2.8, -3.5]];
  for (const [x, z] of rtables) { K.cyl(0.55, 0.55, 0.05, 10, rtM, { parent: resto, x, y: 0.76, z }); K.cyl(0.05, 0.08, 0.74, 5, poleM, { parent: resto, x, y: 0.37, z }); }
  const candle = K.cyl(0.03, 0.03, 0.12, 6, M({ color: "#f5ecd8", emissive: "#5a4020" }), { parent: resto, x: 0, y: 0.85, z: -1.2 });
  const flame = K.ico(0.025, M({ color: "#ffd27a", emissive: "#ffcc66", unlit: true }), { parent: resto, x: 0, y: 0.94, z: -1.2 }, 0);
  K.cyl(0.035, 0.025, 0.14, 6, M({ color: "#c9e0ea", transparent: true, alpha: 0.5 }), { parent: resto, x: 0.25, y: 0.86, z: -1.05 });
  K.cyl(0.035, 0.025, 0.14, 6, M({ color: "#c9e0ea", transparent: true, alpha: 0.5 }), { parent: resto, x: -0.25, y: 0.86, z: -1.35 });
  const bulbM = M({ color: "#ffe6a8", emissive: "#ffd27a", unlit: true });
  for (let i = 0; i < 18; i++) { const x = -6 + i * 0.7; K.ico(0.05, bulbM, { parent: resto, x, y: 2.9 - Math.sin(i / 17 * Math.PI) * 0.4, z: -2.0 }); K.ico(0.05, bulbM, { parent: resto, x, y: 3.0 - Math.sin(i / 17 * Math.PI) * 0.35, z: 1.5 }); }
  for (const [x, z] of [[-3.5, 0.5], [3.4, 0.2], [-2.5, -3.5], [2.8, -3.5]]) K.cyl(0.03, 0.03, 0.1, 6, M({ color: "#ffd9a0", emissive: "#ffb860", unlit: true }), { parent: resto, x, y: 0.84, z });

  // ---------------- CAFE interior (z -300) ----------------
  const cafe = grp("cafe", 0, 0, -300);
  K.box(10, 0.1, 8, M({ map: tex.tiles("#d9cfbf", "#b9ad9a", 4), color: "#ffffff" }), { parent: cafe, y: -0.05, uv: [5, 4] });
  K.box(10, 3.2, 0.2, M({ map: tex.tiles("#f1ede4", "#e3ddd1", 8), color: "#ffffff" }), { parent: cafe, y: 1.6, z: -3, uv: [5, 2] });
  K.box(0.2, 3.2, 8, cafeM, { parent: cafe, x: -5, y: 1.6, uv: [3, 2] }); K.box(0.2, 3.2, 8, cafeM, { parent: cafe, x: 5, y: 1.6, uv: [3, 2] });
  K.box(5, 1.05, 0.7, M({ map: tex.wood("#6e4a2e"), color: "#ffffff" }), { parent: cafe, y: 0.52, z: -1.0 });
  K.box(5.1, 0.06, 0.8, M({ color: "#2e2a26" }), { parent: cafe, y: 1.07, z: -1.0 });
  K.box(0.7, 0.6, 0.5, M({ color: "#b8bcc0" }), { parent: cafe, x: -1.6, y: 1.4, z: -2.6 });
  const menu = K.signTex("MENU\nCOFFEE 3\nTEA    2\nCAKE   4", { s: 1, bg: "#22262a", fill: "#e8e2d0" });
  K.plane(1.8, 1.2, M({ map: menu }), { parent: cafe, x: 1.2, y: 2.2, z: -2.88 });
  const cups = []; for (let i = 0; i < 2; i++) cups.push(K.cyl(0.045, 0.035, 0.1, 6, M({ color: "#f4f0e8" }), { parent: cafe, x: -0.2 + i * 0.5, y: 1.15, z: -0.85 }));

  // ---------------- props: phone ----------------
  const phone = new T.Group(); K.scene.add(phone);
  K.box(0.075, 0.15, 0.01, M({ color: "#1b1c20" }), { parent: phone });
  const phoneCanvas = document.createElement("canvas"); phoneCanvas.width = 48; phoneCanvas.height = 96;
  const phoneTex = new T.CanvasTexture(phoneCanvas); phoneTex.magFilter = phoneTex.minFilter = T.NearestFilter; phoneTex.generateMipmaps = false; phoneTex.colorSpace = T.NoColorSpace;
  K.plane(0.066, 0.132, M({ map: phoneTex, unlit: true, color: "#ffffff" }), { parent: phone, z: 0.0055 });
  function drawPhone(text, caret) {
    const g = phoneCanvas.getContext("2d");
    g.fillStyle = "#e9edf2"; g.fillRect(0, 0, 48, 96);
    g.fillStyle = "#3a6fd8"; g.fillRect(0, 0, 48, 11); window.PIXFONT.draw(g, "MIA", 24, 2, 1, { fill: "#ffffff", align: "center" });
    g.fillStyle = "#d4dbe4"; g.fillRect(3, 18, 26, 11); window.PIXFONT.draw(g, "hey!", 5, 20, 1, { fill: "#30343a" });
    g.fillStyle = "#3a8f5a"; g.fillRect(4, 50, 42, 12); window.PIXFONT.draw(g, text + (caret ? "|" : ""), 6, 52, 1, { fill: "#ffffff", spacing: 0 });
    g.fillStyle = "#c8ced6"; g.fillRect(0, 80, 48, 16); window.PIXFONT.draw(g, "SEND", 24, 84, 1, { fill: "#3a6fd8", align: "center" });
    phoneTex.needsUpdate = true;
  }
  drawPhone("see you", false);
  const phoneHand = K.box(0.09, 0.1, 0.03, M({ color: "#c98f6a" }), { parent: phone, y: -0.08, z: -0.02 });

  // ---------------- cast ----------------
  const YOU = { skin: "#c98f6a", hair: "#2a1a12", top: "#d1a530", bottom: "#27324a", shoes: "#e9e6e0", style: "fringe", eye: "#2a1f1a", lip: "#9a5a46" };
  const HER = { skin: "#e8b996", hair: "#8a3a1f", top: "#efe6d4", bottom: "#3a3550", shoes: "#5a3528", style: "bun", fem: true, eye: "#3a5a46", lip: "#b5544a", blush: "#e09a86", jacket: "#3f7a5a" };
  const cast = {};
  cast.you = K.human(YOU);
  cast.you2 = K.human(YOU); // a second you for the office / two-place shots
  cast.her = K.human(HER);
  cast.herW = K.human(Object.assign({}, HER, { top: "#f6f2ea", jacket: null, dress: "#f6f2ea", bottom: "#f6f2ea", shoes: "#f6f2ea", style: "bun" }));
  cast.youW = K.human(Object.assign({}, YOU, { top: "#2b2f3a", jacket: "#2b2f3a", bottom: "#2b2f3a", shoes: "#1a1a1a" }));
  const pal = [
    { skin: "#e2b08c", hair: "#1e1a18", top: "#3a6ea5", bottom: "#2d2d33", style: "short" },
    { skin: "#8d5a3c", hair: "#121010", top: "#c94f3d", bottom: "#4a4f5a", style: "short" },
    { skin: "#f0c8a8", hair: "#c9a060", top: "#7aa86a", bottom: "#33302c", style: "long", fem: true, skirt: "#3b4a6a" },
    { skin: "#c08a64", hair: "#3a2a20", top: "#e2d6be", bottom: "#5b4636", style: "bob", fem: true },
    { skin: "#6b4430", hair: "#0e0c0c", top: "#e0c24a", bottom: "#2b3a52", style: "bald" },
    { skin: "#e6be9c", hair: "#6a4a2a", top: "#8a5aa8", bottom: "#2a2a2e", style: "short" },
    { skin: "#d09a78", hair: "#2a2220", top: "#4f8f8a", bottom: "#3a3a40", style: "long", fem: true },
    { skin: "#a8724e", hair: "#1a1412", top: "#b8b2a8", bottom: "#2c3442", style: "fringe" },
    { skin: "#f2c9a6", hair: "#9a4a2a", top: "#d0784a", bottom: "#40404a", style: "bob", fem: true },
    { skin: "#7a5038", hair: "#151212", top: "#2f6a4a", bottom: "#2e2e34", style: "short", sleeves: "short" },
  ];
  cast.extras = pal.map((p) => K.human(Object.assign({ shoes: "#2a2a2a" }, p)));
  cast.interviewer = K.human({ skin: "#b88466", hair: "#9a9a96", top: "#e8e8e4", jacket: "#3a3f4a", bottom: "#3a3f4a", style: "short", beard: "#8a8a86" });
  cast.barista = K.human({ skin: "#e0b08c", hair: "#2a2020", top: "#2f2f34", bottom: "#2f2f34", style: "bun", fem: true });

  const W = {
    sets, cast, cars, ball, ballShadow, rim, net, petals, petalSeeds, clock, duvet, door, bag, tvScreen, skyBack, skyBack2, flame, candle, phone, drawPhone, cups,
    aptLamp,
    show(list) { for (const k in sets) sets[k].visible = list.indexOf(k) >= 0; },
    allCast() { return [cast.you, cast.you2, cast.her, cast.herW, cast.youW, cast.interviewer, cast.barista].concat(cast.extras); },
    hideCast() { for (const r of W.allCast()) r.set({ visible: false }); },
  };
  return W;
};
