/* Sim envs — the nine landscapes of the sample, as parameter blocks for K.env(). Heights are pure functions of (x, z).
 * desert · hills · pines · rocky · clouds · river · dusk · snow · high
 */
(function () {
  "use strict";
  window.SIM_ENVS = function (K) {
    const T = K.T, sm = K.smooth, lerp = K.lerp;
    const R = (x, z) => Math.hypot(x, z);

    // ---------------------------------------------------------------- desert (opening / ending / F-5E / airfield)
    const AIR = { x: 2600, z: -1500, len: 3000, wid: 46, yaw: 0 }; // runway along z, in the desert
    function desertH(x, z, N) {
      let h = 4 * N.fbm(x / 380, z / 380, 4) + 1.2 * N.fbm(x / 70, z / 70, 3);
      const r = R(x, z);
      h += sm(2600, 9000, r) * (260 + 900 * N.ridge(x / 3400 + 3, z / 3400 - 1, 5));
      h += sm(1400, 3000, r) * 40 * N.fbm(x / 900 + 7, z / 900, 3);
      // flatten the airfield
      const dx = Math.abs(x - AIR.x), dz = Math.abs(z - AIR.z);
      const k = sm(260, 120, dx) * sm(AIR.len / 2 + 500, AIR.len / 2 + 100, dz);
      return lerp(h, 2.0, k);
    }
    K.env("desert", {
      sun: { az: 200, el: 21, color: "#ffe6c2", i: 3.4 },
      hemi: { sky: "#c9d3e0", ground: "#8a7058", i: 0.75 },
      sky: { zenith: "#3f6aa6", haze: "#cdb498", sunHaze: "#f0d2a6", hazeI: 0.95, glow: 0.9, cirrus: 0.25, bright: 1.0 },
      fog: { d: 0.000096, fall: 0.0007, max: 0.97 },
      grade: { expo: 0.8, sat: 1.15, con: 1.12, gain: [1.03, 1.0, 0.95], vig: 0.3, bloom: 0.1 },
      groundRefl: "#b69c7d",
      terrain: {
        h: desertH, half: 16000, res: 420, pow: 2.4, seed: 2, macroScale: 700, macroK: 0.3, rock: [0.32, 0.55], patch: [0.58, 0.72, 0.7], normalK: 0.7,
        layers: [
          { tex: { cols: ["#9e7a55", "#b38e66", "#c29f78", "#cfae88"], cells: 10, seed: 4, spots: 900, spotR: 2.2, spotH: 0.2, jitter: 9, rough: 0.95 }, scale: 18 },
          { tex: { cols: ["#6e5a48", "#8a735d", "#a18a72"], cells: 6, seed: 5, ridged: true, rough: 0.85 }, scale: 40 },
          { tex: { cols: ["#8b7155", "#9c8263", "#ae9373"], cells: 12, seed: 6, spots: 1600, spotR: 1.4, jitter: 12, rough: 0.97 }, scale: 14 },
        ],
      },
      veg: [
        { type: "scrub", n: 90000, area: [-1000, -3000, 1000, 2600], scale: [1.4, 3.8], cols: ["#2f2f1a", "#3a3a20", "#262615", "#44422a"], seed: 31, sink: 0.25,
          density: (x, z, N) => 0.55 + 0.45 * N.fbm(x / 120, z / 120, 3), maxSlope: 0.5 },
        { type: "scrub", n: 14000, area: [AIR.x - 900, AIR.z - 2200, AIR.x + 900, AIR.z + 2200], scale: [0.8, 2.0], cols: ["#3b3620", "#47402a"], seed: 32,
          density: (x, z) => (Math.abs(x - AIR.x) < 45 ? 0 : 0.85) },
      ],
      build(g, K, hf) { runway(g, K, AIR); },
      AIR,
    });

    function runway(g, K, A) {
      // asphalt texture: 46 m x 380 m per repeat (1 px ~ 9 cm): patches, joints, tyre marks, centre dashes, edge lines
      const c = K.canvas(512, 4096), x = c.getContext("2d"), r = K.rng(5);
      x.fillStyle = "#4b4b4c"; x.fillRect(0, 0, 512, 4096);
      for (let i = 0; i < 90; i++) { const v = 52 + r() * 40; x.fillStyle = `rgba(${v},${v},${v + 2},0.55)`; x.fillRect(r() * 512, r() * 4096, 60 + r() * 220, 80 + r() * 600); }
      for (let i = 0; i < 90000; i++) { const v = 30 + r() * 60; x.fillStyle = `rgba(${v},${v},${v},0.5)`; x.fillRect(r() * 512, r() * 4096, 1.5, 1.5); }
      x.strokeStyle = "rgba(14,14,14,0.85)"; x.lineWidth = 2.5;
      for (let y = 0; y < 4096; y += 64) { x.beginPath(); x.moveTo(0, y + r() * 2); x.lineTo(512, y + r() * 2); x.stroke(); }
      for (const xx of [128, 256, 384]) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, 4096); x.stroke(); }
      for (let i = 0; i < 140; i++) { // rubber deposits along the wheel tracks
        const cx = 256 + (r() < 0.5 ? -1 : 1) * (40 + r() * 70) + (r() - 0.5) * 30, y0 = r() * 4096, L = 200 + r() * 1400;
        const gr = x.createLinearGradient(0, y0, 0, y0 + L); gr.addColorStop(0, "rgba(12,12,12,0)"); gr.addColorStop(0.5, `rgba(12,12,12,${0.25 + r() * 0.35})`); gr.addColorStop(1, "rgba(12,12,12,0)");
        x.fillStyle = gr; x.fillRect(cx, y0, 6 + r() * 14, L);
      }
      x.fillStyle = "#e4e1d8"; for (let y = 0; y < 4096; y += 640) x.fillRect(251, y, 10, 400); // centre dashes 36 m / 24 m gap
      x.fillRect(16, 0, 9, 4096); x.fillRect(487, 0, 9, 4096);                                  // edge lines
      const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, A.len / 380); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16;
      const m = K.patch(new T.MeshStandardMaterial({ map: t, roughness: 0.84, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 }), { key: "rwy" });
      const p = new T.Mesh(new T.PlaneGeometry(A.wid, A.len).rotateX(-Math.PI / 2), m);
      p.position.set(A.x, 2.05, A.z); p.receiveShadow = true; g.add(p);
      // paint: TDZ bar pairs every 150 m, aiming-point blocks, threshold piano keys + "22" at the south end
      const paintM = K.patch(new T.MeshStandardMaterial({ color: "#bdbab2", roughness: 0.82, polygonOffset: true, polygonOffsetFactor: -3 }), { key: "rwypaint" });
      const bar = (w, l, dx, z) => { const q = new T.Mesh(new T.PlaneGeometry(w, l).rotateX(-Math.PI / 2), paintM); q.position.set(A.x + dx, 2.07, z); q.receiveShadow = true; g.add(q); };
      const zs = A.z - A.len / 2;
      for (let i = 0; i < 12; i++) bar(1.8, 45, (i - 5.5) * 3.4, zs + 30);                     // piano keys
      for (let k = 1; k <= 6; k++) { const n = k <= 2 ? 3 : k <= 4 ? 2 : 1; for (const sd of [-1, 1]) for (let j = 0; j < n; j++) bar(1.8, 22.5, sd * (7 + j * 2.6), zs + 150 * k + 60); }
      for (const sd of [-1, 1]) bar(9, 45, sd * 9.5, zs + 400);                                 // aiming point
      for (let k = 1; k <= 6; k++) for (const sd of [-1, 1]) { const n = k <= 2 ? 3 : k <= 4 ? 2 : 1; for (let j = 0; j < n; j++) bar(1.8, 22.5, sd * (7 + j * 2.6), A.z + A.len / 2 - 150 * k - 60); }
      const num = K.canvas(256, 512), nx = num.getContext("2d"); nx.fillStyle = "#000"; nx.fillRect(0, 0, 256, 512); nx.fillStyle = "#fff";
      nx.font = "700 300px Bahnschrift, sans-serif"; nx.textAlign = "center"; nx.textBaseline = "middle"; nx.save(); nx.translate(128, 256); nx.scale(0.55, 1.3); nx.fillText("22", 0, 0); nx.restore();
      const nt = new T.CanvasTexture(num); nt.colorSpace = T.SRGBColorSpace;
      const nm = K.patch(new T.MeshStandardMaterial({ color: "#dedbd2", alphaMap: nt, alphaTest: 0.5, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -3 }), { key: "rwynum" });
      const nq = new T.Mesh(new T.PlaneGeometry(14, 28).rotateX(-Math.PI / 2), nm); nq.position.set(A.x, 2.07, zs + 95); g.add(nq);
      // apron, hangars and a tower on the left of a camera looking down the runway (+x side), plus the far group
      const mat = (col, ro, mt) => K.patch(new T.MeshStandardMaterial({ color: col, roughness: ro || 0.7, metalness: mt || 0.1 }), { key: "bld" });
      const roofTex = (() => { const cc = K.canvas(256, 256), xx = cc.getContext("2d"); xx.fillStyle = "#a9a59c"; xx.fillRect(0, 0, 256, 256); xx.fillStyle = "#8e8a82"; for (let i = 0; i < 256; i += 16) xx.fillRect(i, 0, 5, 256); const tt = new T.CanvasTexture(cc); tt.wrapS = tt.wrapT = T.RepeatWrapping; tt.repeat.set(6, 1); tt.colorSpace = T.SRGBColorSpace; return tt; })();
      const ap = new T.Mesh(new T.PlaneGeometry(260, 1500).rotateX(-Math.PI / 2), mat("#6b6b6c", 0.92)); ap.position.set(A.x + 160, 2.02, A.z - 250); ap.receiveShadow = true; g.add(ap);
      const hangar = (hx, hz, w, d, h) => {
        const wall = new T.Mesh(new T.BoxGeometry(w, h, d), K.patch(new T.MeshStandardMaterial({ map: roofTex, color: "#d6d2c8", roughness: 0.65, metalness: 0.25 }), { key: "hangar" }));
        wall.position.set(hx, 2 + h / 2, hz); wall.castShadow = wall.receiveShadow = true; g.add(wall);
        const rf = new T.Mesh(new T.CylinderGeometry(w * 0.56, w * 0.56, d, 24, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2), mat("#b4b0a7", 0.5, 0.4));
        rf.scale.set(1, 0.22, 1); rf.position.set(hx, 2 + h, hz); rf.castShadow = true; g.add(rf);
        const door = new T.Mesh(new T.PlaneGeometry(w * 0.8, h * 0.85), mat("#3d4146", 0.6, 0.3)); door.position.set(hx - w / 2 - 0.05, 2 + h * 0.43, hz); door.rotation.y = -Math.PI / 2; g.add(door);
      };
      for (let i = 0; i < 4; i++) hangar(A.x + 120, A.z - 520 + i * 95, 46, 70, 17);
      for (let i = 0; i < 4; i++) hangar(A.x + 330, A.z - 120 + i * 95, 70, 60, 22);
      const tw = new T.Mesh(new T.CylinderGeometry(2.6, 3.6, 34, 10), mat("#d8d4ca")); tw.position.set(A.x + 105, 19, A.z - 120); tw.castShadow = true; g.add(tw);
      const cab = new T.Mesh(new T.CylinderGeometry(6.5, 5.2, 6, 10), K.patch(new T.MeshStandardMaterial({ color: "#1f2b33", roughness: 0.08, metalness: 0.7 }), { key: "glass" })); cab.position.set(A.x + 105, 39, A.z - 120); g.add(cab);
      const cap = new T.Mesh(new T.CylinderGeometry(7, 7, 1.2, 10), mat("#cfcbc1")); cap.position.set(A.x + 105, 42.6, A.z - 120); g.add(cap);
      for (let i = 0; i < 40; i++) { // runway edge lights
        const l = new T.Mesh(new T.SphereGeometry(0.18, 6, 4), K.patch(new T.MeshBasicMaterial({ color: new T.Color("#fff6d8").multiplyScalar(2) }), { key: "edgelight" }));
        l.position.set(A.x + (i % 2 ? 25 : -25), 2.3, A.z - A.len / 2 + Math.floor(i / 2) * 60 + 600); g.add(l);
      }
    }

    // ---------------------------------------------------------------- hills (forest reveal, green-hill comparison, canopy from above)
    function hillsH(x, z, N) {
      let h = 330 * N.fbm(x / 2600, z / 2600, 5) + 70 * N.fbm(x / 600 + 3, z / 600, 4) + 8 * N.fbm(x / 90, z / 90, 3);
      h += sm(3000, 9000, R(x, z)) * 600 * N.ridge(x / 4000, z / 4000, 4);
      return h;
    }
    const PINE = ["#22371f", "#2b4426", "#1d2e1b", "#33502b"];
    const TREE = ["#3a5418", "#48661c", "#567822", "#33491a", "#64852a", "#4b6420"];
    const forestD = (x, z, N) => sm(-0.15, 0.2, N.fbm(x / 1500 + 9, z / 1500, 4) + 0.15);
    K.env("hills", {
      sun: { az: 130, el: 34, color: "#fff1dc", i: 3.2 },
      hemi: { sky: "#bcd2ee", ground: "#4d5a35", i: 0.8 },
      sky: { zenith: "#3a68aa", haze: "#aebcc4", sunHaze: "#e9dcc0", hazeI: 0.92, glow: 0.6, cirrus: 0.35 },
      fog: { d: 0.00019, fall: 0.0009, max: 0.96 },
      grade: { expo: 0.85, sat: 1.25, con: 1.14, gain: [1.0, 1.02, 0.95], vig: 0.28 },
      groundRefl: "#56633e",
      terrain: {
        h: hillsH, half: 16000, res: 460, pow: 2.3, seed: 7, macroScale: 1100, macroK: 0.42, rock: [0.55, 0.8], patch: [0.36, 0.52, 1.0], normalK: 1.25,
        layers: [
          { tex: { cols: ["#475c22", "#566b2b", "#667a33", "#76873d"], cells: 9, seed: 8, spots: 2200, spotR: 2, detail: 40, normal: 3.2, jitter: 14, rough: 0.95, roughVar: 0.25 }, scale: 22 },
          { tex: { cols: ["#5c5546", "#71695a", "#8a826f"], cells: 6, seed: 9, ridged: true }, scale: 40 },
          { tex: { cols: ["#1b2e10", "#273f16", "#35521c", "#476424"], cells: 14, seed: 10, spots: 2600, spotR: 4, spotH: 0.5, normal: 4, jitter: 6, rough: 0.98 }, scale: 60 }, // canopy-from-afar
        ],
      },
      veg: [
        // dense canopy where the camera is close (reveal path, top-down shape shot, merge shot), sparse elsewhere
        { type: "broad", n: 42000, area: [-200, 150, 900, 520], scale: [0.85, 1.4], cols: TREE, seed: 41, density: (x, z, N) => 0.75 + 0.25 * N.fbm(x / 60, z / 60, 2) },
        { type: "broad", n: 36000, area: [0, -600, 900, 500], scale: [0.85, 1.5], cols: TREE, seed: 42, density: (x, z, N) => forestD(x, z, N) * 0.9 + 0.1 },
        { type: "broad", n: 30000, area: [-1100, 100, 400, 1400], scale: [0.85, 1.5], cols: TREE, seed: 43, density: (x, z, N) => forestD(x, z, N) * 0.9 + 0.1 },
        { type: "broad", n: 16000, area: [-1700, -1700, 1700, 1700], scale: [0.9, 1.6], cols: TREE, seed: 44, density: (x, z, N) => forestD(x, z, N) },
        // the comparison view (camera on a slope near x 3420, z 2300 looking north-west): clustered mixed forest + near scrub and grass
        { type: "broad", n: 52000, area: [2500, 2350, 4400, 4600], scale: [0.7, 1.7], cols: TREE, seed: 45, density: (x, z, N) => (Math.hypot(x - 3800, z - 2300) < 170 ? 0 : Math.pow(forestD(x * 1.3, z * 1.3, N), 1.4)) },
        { type: "spruce", n: 9000, area: [2500, 2350, 4400, 4600], scale: [0.7, 1.2], cols: ["#22371f", "#2b4426", "#1d2e1b"], seed: 46, density: (x, z, N) => (Math.hypot(x - 3800, z - 2300) < 170 ? 0 : forestD(x * 1.3 + 400, z * 1.3, N) * 0.8) },
        { type: "scrub", n: 9000, area: [3700, 2200, 3920, 2440], scale: [0.6, 1.6], cols: ["#3d5422", "#4a6229", "#56702f"], seed: 47 },
        { type: "grass", n: 50000, area: [3755, 2255, 3850, 2345], scale: [0.8, 1.3], cols: ["#5d7a2c", "#6d8a33", "#7a923a", "#8a9a46"], seed: 48, shadow: false, sink: 0.05 },
      ],
      forestD,
    });

    // ---------------------------------------------------------------- pines (dawn mist, low flyby)
    function pinesH(x, z, N) {
      let h = 6 * N.fbm(x / 300, z / 300, 4) + 1.0 * N.fbm(x / 40, z / 40, 2);
      h += sm(600, 3500, R(x, z - 1500)) * (220 + 380 * N.fbm(x / 2200, z / 2200, 4));
      return h;
    }
    K.env("pines", {
      sun: { az: 28, el: 6.5, color: "#ffc48a", i: 2.8, disc: 1.2 },
      hemi: { sky: "#9fb4d6", ground: "#4a4430", i: 0.8 },
      sky: { zenith: "#3c68ab", haze: "#c3b9b0", sunHaze: "#ffcf96", hazeI: 0.95, glow: 1.5, cirrus: 0.55 },
      fog: { d: 0.00016, fall: 0.0016, max: 0.95, mist: 0.008, mistFall: 0.35, mistBase: 0 },
      grade: { expo: 0.88, sat: 1.1, con: 1.14, gain: [1.03, 1.0, 0.96], vig: 0.32, bloom: 0.16 },
      groundRefl: "#4d4b33",
      terrain: {
        h: pinesH, half: 14000, res: 400, pow: 2.4, seed: 11, macroScale: 500, macroK: 0.35, rock: [0.5, 0.8], patch: [0.5, 0.65, 0.8],
        layers: [
          { tex: { cols: ["#4c4a2a", "#605c33", "#77703f", "#8a8049"], cells: 12, seed: 12, spots: 1500, spotR: 2, jitter: 12 }, scale: 10 },
          { tex: { cols: ["#5b5446", "#6f685a"], cells: 6, seed: 13, ridged: true }, scale: 30 },
          { tex: { cols: ["#1e2b17", "#27361c", "#33442a"], cells: 14, seed: 14, spots: 2400, spotR: 3, spotH: 0.5, normal: 4 }, scale: 50 },
        ],
      },
      veg: [
        { type: "pine2", n: 16000, area: [-800, 230, 800, 1500], scale: [0.8, 1.2], cols: PINE, seed: 51, density: (x, z, N) => 0.6 + 0.4 * N.fbm(x / 60, z / 60, 2) },
        { type: "pine", n: 12000, area: [-800, 230, 800, 1500], scale: [0.75, 1.2], cols: PINE, seed: 54, density: (x, z, N) => 0.5 + 0.5 * N.fbm(x / 50 + 3, z / 50, 2) },
        { type: "spruce", n: 6000, area: [-800, 230, 800, 1500], scale: [0.6, 1.1], cols: ["#1c2f1b", "#24391f"], seed: 55, density: (x, z, N) => 0.6 },
        { type: "pine2", n: 14000, area: [-2000, -600, 2000, 3500], scale: [0.8, 1.2], cols: PINE, seed: 52,
          density: (x, z, N) => (z < 230 && Math.abs(x) < 500 ? 0 : 0.8) },
        { type: "grass", n: 90000, area: [-140, 90, 220, 230], scale: [0.8, 1.5], cols: ["#8b8547", "#9a9150", "#7b7a40", "#a89c5b", "#6f6a38"], seed: 53, shadow: false, sink: 0.05 },
      ],
    });

    // ---------------------------------------------------------------- rocky mountains (tan cliffs, sparse pines)
    function rockyH(x, z, N) { // a long cliff wall rising east of x = 250, ridged crest, scree at its foot
      const wall = sm(250, 1000, x + 120 * N.fbm(z / 700, 2.2, 3));
      let h = wall * (420 + 360 * N.ridge(x / 1500 + 2, z / 1500, 5)) + 40 * N.fbm(x / 300, z / 300, 4);
      h += 10 * N.fbm(x / 50, z / 50, 3) + sm(3000, 9000, R(x, z)) * 500 * N.fbm(x / 3000, z / 3000, 3);
      return h - 60;
    }
    K.env("rocky", {
      sun: { az: 200, el: 34, color: "#fff2df", i: 3.4 },
      hemi: { sky: "#b8cdea", ground: "#6d5a44", i: 0.7 },
      sky: { zenith: "#3f6fb0", haze: "#c0c9d2", sunHaze: "#f1e4cc", hazeI: 1.0, glow: 0.6, cirrus: 0.2 },
      fog: { d: 0.000108, fall: 0.0007, max: 0.95 },
      grade: { expo: 0.82, sat: 1.0, con: 1.08, gain: [1.02, 1.0, 0.96], vig: 0.28 },
      groundRefl: "#7b6a55",
      terrain: {
        h: rockyH, half: 16000, res: 480, pow: 2.0, seed: 15, macroScale: 500, macroK: 0.35, rock: [0.25, 0.45], patch: [0.6, 0.75, 0.6], normalK: 1.0,
        layers: [
          { tex: { cols: ["#6a6438", "#7e7744", "#958b55", "#a49a66"], cells: 10, seed: 16, spots: 1200, spotR: 2.5, jitter: 10 }, scale: 20 },
          { tex: { cols: ["#6a5644", "#806a55", "#957d64", "#a58e74"], cells: 4, seed: 17, detail: 16, normal: 3.0, rough: 0.9 }, scale: 140 },
          { tex: { cols: ["#5d5733", "#6f6a3d"], cells: 10, seed: 18, spots: 1500, spotR: 2 }, scale: 16 },
        ],
      },
      veg: [
        { type: "pine", n: 9000, area: [-1600, -1600, 1600, 1600], scale: [0.9, 1.8], cols: ["#24381f", "#2c4425", "#1c2c18"], seed: 61, maxSlope: 0.55,
          density: (x, z, N) => 0.25 + 0.4 * sm(0, 0.4, N.fbm(x / 200, z / 200, 3)) },
        { type: "scrub", n: 16000, area: [-1600, -1600, 1600, 1600], scale: [1.0, 2.2], cols: ["#3d4224", "#4a4f2b"], seed: 62, maxSlope: 0.7 },
      ],
    });

    // ---------------------------------------------------------------- clouds (cloud sea seen from above, mechanism close-ups)
    function cloudH(x, z, N) {
      const b = 1 - Math.abs(N.fbm(x / 900, z / 900, 4));
      return 120 * b * b + 45 * N.fbm(x / 220 + 4, z / 220, 4) + 10 * N.fbm(x / 50, z / 50, 3);
    }
    K.env("clouds", {
      sun: { az: 210, el: 24, color: "#fff0d8", i: 3.4 },
      hemi: { sky: "#c6d6ee", ground: "#d9d6d0", i: 0.95 },
      sky: { zenith: "#4c79b8", haze: "#d8d6d2", sunHaze: "#f7e4c6", hazeI: 1.12, glow: 0.8, cirrus: 0.15, lift: 0.0 },
      fog: { d: 0.000048, fall: 0.0006, base: 0, max: 0.93 },
      grade: { expo: 0.68, sat: 0.92, con: 1.04, gain: [1.02, 1.0, 0.97], vig: 0.26, bloomThr: 1.3 },
      envI: 1.15,
      groundRefl: "#e2dfda",
      terrain: {
        h: cloudH, half: 18000, res: 380, pow: 2.3, seed: 19, macroScale: 1500, macroK: 0.12, rock: [2, 3], patch: [0.6, 0.8, 0.5], normalK: 0.7, castShadow: true,
        layers: [
          { tex: { cols: ["#8e9198", "#bdbdbf", "#e2e1de", "#f6f5f2"], cells: 7, seed: 20, gamma: 0.85, normal: 2.2, rough: 1.0, roughVar: 0, detail: 30 }, scale: 120 },
          { tex: { cols: ["#d0cfcc", "#eeeeea"], cells: 6, seed: 21 }, scale: 140 },
          { tex: { cols: ["#c6c5c4", "#e3e2df", "#f3f2ef"], cells: 8, seed: 22, gamma: 0.8, normal: 1.0, rough: 1.0 }, scale: 260 },
        ],
      },
    });

    // ---------------------------------------------------------------- river valley (XVS inset, cruise)
    const riverX = (z, N) => 140 * Math.sin(z / 620) + 60 * N.fbm(z / 900, 3.3, 3);
    function riverH(x, z, N) {
      const d = Math.abs(x - riverX(z, N));
      let h = 340 * sm(40, 900, d) + 120 * N.fbm(x / 900, z / 900, 4) * sm(60, 500, d) + 6 * N.fbm(x / 80, z / 80, 3);
      h += sm(1600, 6000, d) * 500 * N.ridge(x / 3000, z / 3000, 4);
      return h - 4 * (1 - sm(25, 60, d));
    }
    K.env("river", {
      sun: { az: 150, el: 30, color: "#fff1da", i: 3.2 },
      hemi: { sky: "#bfd3ee", ground: "#46542f", i: 0.8 },
      sky: { zenith: "#5b84bc", haze: "#bdc8cd", sunHaze: "#efe0c0", hazeI: 1.0, glow: 0.6, cirrus: 0.3 },
      fog: { d: 0.000120, fall: 0.001, max: 0.95 },
      grade: { expo: 0.85, sat: 1.02, con: 1.06, gain: [1.0, 1.02, 0.97], vig: 0.28 },
      groundRefl: "#4f5e38",
      terrain: {
        h: riverH, half: 15000, res: 420, pow: 2.3, seed: 23, macroScale: 1100, macroK: 0.3, rock: [0.62, 0.85], patch: [0.35, 0.55, 1.0], normalK: 0.9,
        layers: [
          { tex: { cols: ["#6f6a4c", "#857e5b", "#9b9370"], cells: 10, seed: 24, spots: 800, jitter: 10 }, scale: 16 },
          { tex: { cols: ["#5c5546", "#71695a"], cells: 6, seed: 25, ridged: true }, scale: 40 },
          { tex: { cols: ["#1b2e10", "#273f16", "#35521c", "#476424"], cells: 14, seed: 26, spots: 2600, spotR: 4, spotH: 0.5, normal: 4 }, scale: 60 },
        ],
      },
      veg: [
        { type: "broad", n: 50000, area: [-1300, -2600, 1300, 2600], scale: [0.9, 1.6], cols: TREE, seed: 71,
          density: (x, z, N) => { const d = Math.abs(x - riverX(z, N)); return d < 70 ? 0 : 0.9 * sm(70, 120, d); }, maxSlope: 1.0 },
      ],
      build(g, K) { // the river: a glossy water ribbon following riverX
        const N = K.NZ, pos = [], idx = [];
        const n = 400;
        for (let i = 0; i <= n; i++) {
          const z = -9000 + i * 18000 / n, x = riverX(z, N), w = 58 + 10 * N.fbm(z / 300, 1.7, 2);
          pos.push(x - w, 1.0, z, x + w, 1.0, z);
          if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        }
        const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        const m = K.patch(new T.MeshStandardMaterial({ color: "#5b6a6e", roughness: 0.06, metalness: 0.0, envMapIntensity: 1.5 }), { key: "water" });
        const w = new T.Mesh(geo, m); w.receiveShadow = true; g.add(w);
      },
      riverX,
    });

    // ---------------------------------------------------------------- dusk (towns + sensor field) — illustration scenes
    function duskH(x, z, N) { return 10 * N.fbm(x / 500, z / 500, 4) + sm(1500, 5000, R(x, z)) * 260 * N.fbm(x / 2000, z / 2000, 4); }
    K.env("dusk", {
      sun: { az: 260, el: 3.5, color: "#ff9c5c", i: 1.6, disc: 1.4 },
      hemi: { sky: "#5d6fa3", ground: "#3a2d2a", i: 0.7 },
      sky: { zenith: "#1b3572", haze: "#9a7366", sunHaze: "#ff9850", hazeI: 0.85, glow: 1.3, cirrus: 0.45, bright: 1.0, band: 0.5 },
      fog: { d: 0.000168, fall: 0.0012, max: 0.95, mist: 0.004, mistFall: 0.06 },
      grade: { expo: 1.05, sat: 1.05, con: 1.1, gain: [1.03, 0.98, 1.0], vig: 0.34, bloom: 0.22, bloomThr: 0.9 },
      envI: 0.8,
      groundRefl: "#2a2524",
      terrain: {
        h: duskH, half: 14000, res: 360, pow: 2.3, seed: 27, macroScale: 600, macroK: 0.3, rock: [0.6, 0.9], patch: [0.5, 0.7, 0.8],
        layers: [
          { tex: { cols: ["#4c5a2c", "#5d6a33", "#6e7a3c"], cells: 10, seed: 28, spots: 900, jitter: 10 }, scale: 14 },
          { tex: { cols: ["#5c5546", "#71695a"], cells: 6, seed: 29, ridged: true }, scale: 40 },
          { tex: { cols: ["#3d4a24", "#4a5729"], cells: 12, seed: 30, spots: 1200 }, scale: 12 },
        ],
      },
      veg: [
        { type: "broad", n: 2600, area: [-900, -900, 900, 900], scale: [0.7, 1.3], cols: ["#2a3d1c", "#344a22"], seed: 81, density: (x, z) => (Math.abs(x) < 30 || Math.abs(z) < 30 ? 0 : 0.35) },
        { type: "grass", n: 50000, area: [-120, 480, 120, 700], scale: [0.8, 1.5], cols: ["#5f6a32", "#6b743a", "#56602c"], seed: 82, shadow: false, sink: 0.05 },
      ],
      build(g, K, hf) { town(g, K, hf); sensors(g, K, hf); },
    });
    function town(g, K, hf) {
      const r = K.rng(91);
      const win = K.canvas(128, 128), wx = win.getContext("2d");
      wx.fillStyle = "#e8e2d6"; wx.fillRect(0, 0, 128, 128);
      const wm = (lit) => { const c = K.canvas(64, 64), x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 64, 64); x.fillStyle = lit ? "#ffb35a" : "#111"; x.fillRect(14, 20, 14, 18); x.fillRect(36, 20, 14, 18); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
      const walls = ["#d9cfc0", "#c9b9a4", "#e3dcd0", "#b8aa98", "#cfc6b8"], roofs = ["#5b3a30", "#41403f", "#6a4434", "#3a3d44"];
      const lit = wm(true);
      for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
        if (r() < 0.12) continue;
        const x = i * 34 + (r() - 0.5) * 6, z = j * 30 + (r() - 0.5) * 6;
        if (Math.abs(x) < 14 || Math.abs(z) < 12) continue; // streets
        const y = hf(x, z, K.NZ), w = 9 + r() * 4, d = 8 + r() * 3, h = 5 + r() * 2.5, yaw = (r() < 0.5 ? 0 : Math.PI / 2);
        const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = yaw; g.add(grp);
        const wallM = K.patch(new T.MeshStandardMaterial({ color: walls[Math.floor(r() * walls.length)], roughness: 0.85, emissive: "#ffa040", emissiveMap: lit, emissiveIntensity: r() < 0.7 ? 2.2 : 0 }), { key: "house" });
        const b = new T.Mesh(new T.BoxGeometry(w, h, d), wallM); b.position.y = h / 2; b.castShadow = b.receiveShadow = true; grp.add(b);
        const roof = new T.Mesh(new T.CylinderGeometry(d * 0.62, d * 0.62, w + 0.6, 3, 1).rotateZ(Math.PI / 2), K.patch(new T.MeshStandardMaterial({ color: roofs[Math.floor(r() * roofs.length)], roughness: 0.75 }), { key: "roof" }));
        roof.scale.set(1, 0.55, 1); roof.position.y = h + d * 0.16; roof.rotation.x = Math.PI / 6 * 0; roof.castShadow = true; grp.add(roof);
      }
      // street lamps (emissive heads)
      const lampM = K.patch(new T.MeshBasicMaterial({ color: new T.Color("#ffc27a").multiplyScalar(6) }), { key: "lamp", fogScale: 0.4 });
      const poleM = K.patch(new T.MeshStandardMaterial({ color: "#2b2b2e", roughness: 0.6, metalness: 0.5 }), { key: "pole" });
      for (let k = -7; k <= 7; k++) for (const s of [-1, 1]) {
        const x = s * 11, z = k * 28, y = hf(x, z, K.NZ);
        const p = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 7, 6), poleM); p.position.set(x, y + 3.5, z); g.add(p);
        const l = new T.Mesh(new T.SphereGeometry(0.4, 10, 6), lampM); l.position.set(x - s * 0.8, y + 7, z); g.add(l);
      }
    }
    function sensors(g, K, hf) { // a line of ground microphones on stands in a field north of the town (z ~ 600)
      const poleM = K.patch(new T.MeshStandardMaterial({ color: "#8d9096", roughness: 0.4, metalness: 0.8 }), { key: "mic" });
      const headM = K.patch(new T.MeshStandardMaterial({ color: "#1f2124", roughness: 0.6 }), { key: "michead" });
      const ledM = K.patch(new T.MeshBasicMaterial({ color: new T.Color("#7fd4ff").multiplyScalar(5) }), { key: "led", fogScale: 0.4 });
      const leds = [];
      for (let i = 0; i < 9; i++) {
        const x = -64 + i * 16, z = 590 + (i % 2) * 6, y = hf(x, z, K.NZ);
        const grp = new T.Group(); grp.position.set(x, y, z); g.add(grp);
        for (let k = 0; k < 3; k++) { const a = k * 2.09; const leg = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.7, 5), poleM); leg.position.set(Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35); leg.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); grp.add(leg); }
        const mast = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1.2, 6), poleM); mast.position.y = 2.0; grp.add(mast);
        const head = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.5, 12), headM); head.position.y = 2.7; grp.add(head);
        const ws = new T.Mesh(new T.SphereGeometry(0.2, 12, 8), K.patch(new T.MeshStandardMaterial({ color: "#3a3c40", roughness: 1 }), { key: "wind" })); ws.position.y = 3.0; grp.add(ws);
        const led = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), ledM); led.position.set(0, 2.45, 0.12); grp.add(led); leds.push(led);
        grp.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      }
      g.userData.leds = leds;
    }

    // ---------------------------------------------------------------- snow (the hard part)
    function snowH(x, z, N) {
      const r = N.ridge(x / 3400 + 1.3, z / 3400 + 0.4, 4);
      return 1700 * Math.pow(r, 1.25) + 260 * N.fbm(x / 1400, z / 1400, 4) + 35 * N.fbm(x / 300, z / 300, 3) + 4 * N.fbm(x / 60, z / 60, 2) - 300;
    }
    K.env("snow", {
      sun: { az: 250, el: 13, color: "#ffdcb4", i: 3.6 },
      hemi: { sky: "#b0c6ea", ground: "#6c5a4c", i: 0.7 },
      sky: { zenith: "#3e6cb0", haze: "#bcc7d6", sunHaze: "#f2dcbe", hazeI: 1.0, glow: 0.7, cirrus: 0.1 },
      fog: { d: 0.000072, fall: 0.0005, max: 0.92 },
      grade: { expo: 0.78, sat: 1.0, con: 1.1, gain: [1.02, 1.0, 0.98], vig: 0.3, bloomThr: 1.4 },
      groundRefl: "#9c8e80",
      terrain: {
        h: snowH, half: 18000, res: 460, pow: 2.1, seed: 31, macroScale: 700, macroK: 0.25, rock: [0.3, 0.5], patch: [0.6, 0.8, 0.5],
        snow: [820, 1150, 0.55, 420], normalK: 1.1,
        layers: [
          { tex: { cols: ["#6e5c4a", "#85705a", "#9b866e"], cells: 9, seed: 32, spots: 1200, jitter: 10 }, scale: 25 },
          { tex: { cols: ["#6b5847", "#86705a", "#a68d72", "#bfa88b"], cells: 5, seed: 33, ridged: true, normal: 3.5 }, scale: 80 },
          { tex: { cols: ["#5e4f40", "#706050"], cells: 10, seed: 34 }, scale: 20 },
          { tex: { cols: ["#c9ced6", "#dde1e7", "#eceff2"], cells: 8, seed: 35, normal: 0.6, rough: 0.6, roughVar: 0.2 }, scale: 90 },
        ],
      },
      veg: [
        { type: "pine", n: 18000, area: [-2500, -2500, 2500, 2500], scale: [0.9, 1.7], cols: ["#1f2f1d", "#26381f"], seed: 91, maxH: 700, maxSlope: 0.6,
          density: (x, z, N) => 0.3 + 0.5 * sm(-0.1, 0.3, N.fbm(x / 300, z / 300, 3)) },
      ],
    });

    // ---------------------------------------------------------------- stratos: the high-altitude sky over a near cloud deck (record-flight shots)
    K.env("stratos", {
      sun: { az: 200, el: 30, color: "#fff6e8", i: 3.6 },
      hemi: { sky: "#9fb8e6", ground: "#c9ccd2", i: 0.9 },
      sky: { zenith: "#173f8e", haze: "#a9bdd9", sunHaze: "#efe6d4", hazeI: 0.9, glow: 0.7, cirrus: 0.0, bright: 1.0, band: 0.22, lift: 0.08 },
      fog: { d: 0.00006, fall: 0.0006, base: 0, max: 0.9 },
      grade: { expo: 0.68, sat: 1.05, con: 1.08, gain: [1.0, 1.0, 1.03], vig: 0.28, bloomThr: 1.3 },
      envI: 1.2,
      groundRefl: "#c9cbd0",
      terrain: {
        h: cloudH, half: 18000, res: 380, pow: 2.3, seed: 19, macroScale: 1500, macroK: 0.12, rock: [2, 3], patch: [0.6, 0.8, 0.5], normalK: 0.8, castShadow: true,
        layers: [
          { tex: { cols: ["#8e9198", "#bdbdbf", "#e2e1de", "#f6f5f2"], cells: 7, seed: 20, gamma: 0.85, normal: 2.2, rough: 1.0, roughVar: 0, detail: 30 }, scale: 120 },
          { tex: { cols: ["#d0cfcc", "#eeeeea"], cells: 6, seed: 21 }, scale: 140 },
          { tex: { cols: ["#c6c5c4", "#e3e2df", "#f3f2ef"], cells: 8, seed: 22, gamma: 0.8, normal: 1.0, rough: 1.0 }, scale: 260 },
        ],
      },
    });

    // ---------------------------------------------------------------- high altitude (55,000 ft look: cloud sea far below, dark-blue zenith)
    K.env("high", {
      sun: { az: 200, el: 32, color: "#fff6e8", i: 3.6 },
      hemi: { sky: "#9fb8e6", ground: "#c9ccd2", i: 0.9 },
      sky: { zenith: "#173f8e", haze: "#a3b8d8", sunHaze: "#efe6d4", hazeI: 0.88, glow: 0.7, cirrus: 0.0, bright: 1.0, band: 0.2, lift: 0.12 },
      fog: { d: 0.000006, fall: 0.00012, base: 0, max: 0.8 },
      grade: { expo: 0.75, sat: 1.05, con: 1.05, gain: [1.0, 1.0, 1.03], vig: 0.28, bloomThr: 1.3 },
      envI: 1.2,
      groundRefl: "#c9cbd0",
      terrain: {
        h: (x, z, N) => cloudH(x * 0.5, z * 0.5, N) * 1.2, half: 40000, res: 300, pow: 2.0, seed: 37, macroScale: 6000, macroK: 0.15, rock: [2, 3], normalK: 0.6, castShadow: false,
        layers: [
          { tex: { cols: ["#b9bcc2", "#d7d9dc", "#eceef0", "#f6f7f8"], cells: 6, seed: 38, gamma: 0.7, normal: 1.2, rough: 1.0, roughVar: 0 }, scale: 700 },
          { tex: { cols: ["#d0cfcc", "#eeeeea"], cells: 6, seed: 39 }, scale: 700 },
          { tex: { cols: ["#9aa2ad", "#c6ccd4"], cells: 8, seed: 40 }, scale: 900 },
        ],
      },
    });
  };
})();
