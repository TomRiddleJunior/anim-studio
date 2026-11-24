/* Sim craft — procedural aircraft (loft + extrude geometry, PBR paint) and in-world FX for the sim kit.
 *
 *   const C = SIM_CRAFT(K);
 *   const x59 = C.x59();                       // NASA X-59-like low-boom jet, +Z = nose, origin at the wing root, metres
 *   const f15 = C.fighter({ twin: true });     // generic twin-tail fighter (afterburner flames: f15.ab(level))
 *   const f5  = C.fighter({ twin: false, len: 14.5, paint: "#d9dcdf" });
 *   const tp  = C.turboprop();                 // high-wing twin turboprop airliner with blurred prop discs (tp.spin(t))
 *   C.shock(parent, { mach, len, at:[x,y,z], strength })  // translucent Mach-cone shell (shock wave) that streams back
 *   C.ring(parent, {...})                      // expanding glowing ring (pressure wave hitting the ground)
 *   C.decal(parent, text, opts)                // painted lettering / channel mark on a surface
 * Every moving part is driven by explicit setters taking time, so any frame is a pure function of t.
 */
(function () {
  "use strict";
  window.SIM_CRAFT = function (K) {
    const T = K.T, D2R = Math.PI / 180, lerp = K.lerp, clamp = K.clamp;

    // ---- monotone cubic interpolation over keyframes [[z, value], ...]
    function curve(keys) {
      const xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]), n = xs.length;
      const d = [], m = [];
      for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      m[0] = d[0]; m[n - 1] = d[n - 2];
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
      for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
        const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
        if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
      }
      return (x) => {
        if (x <= xs[0]) return ys[0];
        if (x >= xs[n - 1]) return ys[n - 1];
        let i = 0; while (x > xs[i + 1]) i++;
        const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
      };
    }
    const spow = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
    // swapping two axes mirrors the mesh: swap vertices 1 and 2 of every triangle so faces point outwards again
    function flipWinding(g) {
      const names = Object.keys(g.attributes);
      const n = g.attributes.position.count;
      for (const nm of names) {
        const A = g.attributes[nm], k = A.itemSize, a = A.array;
        for (let t = 0; t < n; t += 3) for (let c = 0; c < k; c++) { const i1 = (t + 1) * k + c, i2 = (t + 2) * k + c, tmp = a[i1]; a[i1] = a[i2]; a[i2] = tmp; }
        A.needsUpdate = true;
      }
      return g;
    }

    // ---- loft: rings of superellipse cross-sections along z. P = { z:[z0,z1], w, top, bot, y, n } (curves of z)
    // colour(z, a, x, y) -> [r,g,b] optional vertex paint. UV: u along z (0 tail..1 nose), v around (0 top, .25 right)
    function loft(P, nz, na, colour) {
      nz = nz || 90; na = na || 40;
      const pos = [], nor = [], uv = [], col = [], idx = [];
      const z0 = P.z[0], z1 = P.z[1];
      for (let i = 0; i <= nz; i++) {
        const u = i / nz, z = lerp(z0, z1, Math.pow(u, P.zpow || 1));
        const w = P.w(z), ht = P.top(z), hb = P.bot(z), yc = P.y(z), e = 2 / (P.n ? P.n(z) : 2.4);
        for (let j = 0; j <= na; j++) {
          const a = (j / na) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
          const x = w * spow(s, e), y = yc + (c > 0 ? ht : hb) * spow(c, e);
          pos.push(x, y, z); uv.push((z - z0) / (z1 - z0), j / na);
          const p = colour ? colour(z, a, x, y - yc) : [1, 1, 1];
          col.push(p[0], p[1], p[2]);
        }
      }
      for (let i = 0; i < nz; i++) for (let j = 0; j < na; j++) {
        const a = i * (na + 1) + j, b = a + 1, c = a + na + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }
    // ---- thin lifting surface from a planform polygon in (x, z), thickness tapering with |x| (or along y for fins)
    function surface(pts, thick, opt) {
      opt = opt || {};
      const sh = new T.Shape(pts.map((p) => new T.Vector2(p[0], p[1])));
      const g = new T.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.45, bevelSize: Math.min(thick * 0.9, 0.08), bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -thick / 2);
      // shape plane (x, y) -> lay flat: x stays x, shape y -> z, extrude z -> y
      const P = g.attributes.position;
      const span = opt.span || Math.max(...pts.map((p) => Math.abs(p[0])));
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        const taper = opt.taper != null ? 1 - opt.taper * Math.min(1, Math.abs(x) / span) : 1;
        P.setXYZ(i, x, z * taper, y);
      }
      flipWinding(g);
      g.computeVertexNormals();
      return g;
    }
    function finGeo(pts, thick, taper) { // pts in (z, y): side outline of a vertical fin
      const sh = new T.Shape(pts.map((p) => new T.Vector2(p[0], p[1])));
      const g = new T.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.4, bevelSize: Math.min(thick * 0.8, 0.07), bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -thick / 2);
      const P = g.attributes.position, ymax = Math.max(...pts.map((p) => p[1])), ymin = Math.min(...pts.map((p) => p[1]));
      for (let i = 0; i < P.count; i++) {
        const z = P.getX(i), y = P.getY(i), x = P.getZ(i);
        const k = 1 - (taper || 0.5) * clamp((y - ymin) / (ymax - ymin), 0, 1);
        P.setXYZ(i, x * k, y, z);
      }
      flipWinding(g);
      g.computeVertexNormals();
      return g;
    }

    // ---- materials
    const panelTex = (() => {
      const c = K.canvas(1024, 512), g = c.getContext("2d"), r = K.rng(77);
      g.fillStyle = "#808080"; g.fillRect(0, 0, 1024, 512);
      g.strokeStyle = "rgba(40,40,40,0.9)"; g.lineWidth = 1.4;
      for (let k = 0; k < 18; k++) { const x = 30 + k * 55 + r() * 10; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
      for (const y of [64, 150, 256, 362, 448]) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
      for (let k = 0; k < 40; k++) { g.strokeRect(r() * 1000, r() * 500, 20 + r() * 50, 14 + r() * 30); }
      g.fillStyle = "rgba(30,30,30,0.6)";
      for (let k = 0; k < 900; k++) g.fillRect(r() * 1024, r() * 512, 1.6, 1.6);
      return c;
    })();
    function panelMaps() {
      // normal from the panel height canvas (lines are grooves), roughness slightly varied
      const w = 1024, h = 512, src = panelTex.getContext("2d").getImageData(0, 0, w, h).data;
      const nc = K.canvas(w, h), ng = nc.getContext("2d"), nd = ng.createImageData(w, h);
      const rc = K.canvas(w, h), rg = rc.getContext("2d"), rd = rg.createImageData(w, h);
      const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, dx = (H(x - 1, y) - H(x + 1, y)) * 2.5, dy = (H(x, y - 1) - H(x, y + 1)) * 2.5, L = Math.hypot(dx, dy, 1);
        nd.data[i] = (dx / L * 0.5 + 0.5) * 255; nd.data[i + 1] = (dy / L * 0.5 + 0.5) * 255; nd.data[i + 2] = (1 / L * 0.5 + 0.5) * 255; nd.data[i + 3] = 255;
        const rv = 0.32 + (1 - H(x, y)) * 0.25 + Math.sin(x * 0.013 + y * 0.02) * 0.03;
        rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = clamp(rv, 0, 1) * 255; rd.data[i + 3] = 255;
      }
      ng.putImageData(nd, 0, 0); rg.putImageData(rd, 0, 0);
      const t = (cv) => { const x = new T.CanvasTexture(cv); x.wrapS = x.wrapT = T.RepeatWrapping; x.colorSpace = T.NoColorSpace; x.anisotropy = 8; return x; };
      return { normal: t(nc), rough: t(rc) };
    }
    const PM = panelMaps();
    function paint(color, o) {
      o = o || {};
      const m = new T.MeshPhysicalMaterial({ color, vertexColors: !!o.vc, roughness: o.rough != null ? o.rough : 0.42, metalness: o.metal || 0.05,
        clearcoat: o.clearcoat != null ? o.clearcoat : 0.5, clearcoatRoughness: 0.18, normalMap: o.panels === false ? null : PM.normal,
        normalScale: new T.Vector2(0.35, 0.35), roughnessMap: o.panels === false ? null : PM.rough, envMapIntensity: o.env || 1.0 });
      if (o.panels !== false) { PM.normal.repeat.set(o.rep || 6, 2); PM.rough.repeat.set(o.rep || 6, 2); }
      return K.patch(m, { hero: o.hero !== false, key: "paint" });
    }
    const glass = () => K.patch(new T.MeshPhysicalMaterial({ color: "#1b2026", roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.6 }), { hero: true, key: "glass" });
    const dark = (c) => K.patch(new T.MeshStandardMaterial({ color: c || "#232528", roughness: 0.55, metalness: 0.4 }), { hero: true, key: "dark" });
    const metal = (c) => K.patch(new T.MeshStandardMaterial({ color: c || "#8a8d91", roughness: 0.3, metalness: 0.9 }), { hero: true, key: "metal" });
    const rubber = () => K.patch(new T.MeshStandardMaterial({ color: "#151515", roughness: 0.9 }), { hero: true, key: "rubber" });
    const emit = (c, i) => { const m = new T.MeshBasicMaterial({ color: c }); m.color.multiplyScalar(i || 4); return K.patch(m, { hero: true, key: "emit", fogScale: 0.3 }); };

    function mesh(g, m, parent, cast) { const x = new T.Mesh(g, m); x.castShadow = cast !== false; x.receiveShadow = true; if (parent) parent.add(x); return x; }

    // ---- decals: canvas lettering on a thin plane (polygon offset), alpha-tested
    function decal(parent, draw, o) {
      const c = K.canvas(o.cw || 512, o.ch || 256), g = c.getContext("2d");
      draw(g, c.width, c.height);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      const m = K.patch(new T.MeshStandardMaterial({ map: t, transparent: false, alphaTest: 0.4, roughness: 0.45, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: T.FrontSide }), { hero: true, key: "decal" });
      const p = new T.Mesh(new T.PlaneGeometry(o.w, o.h), m);
      p.position.set(...o.at); p.rotation.set(...(o.rot || [0, 0, 0]));
      p.receiveShadow = true;
      parent.add(p);
      return p;
    }
    function textDraw(text, font, color, flipX) {
      return (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.save();
        if (flipX) { g.translate(w, 0); g.scale(-1, 1); }
        g.fillStyle = color; g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(text, w / 2, h / 2 + 4);
        g.restore();
      };
    }
    // the channel mark (original): a swept-wing chevron in a rounded square + wordmark
    function markDraw(color, flipX) {
      return (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.save();
        if (flipX) { g.translate(w, 0); g.scale(-1, 1); }
        g.fillStyle = color;
        const s = h * 0.62, x0 = 16, y0 = (h - s) / 2;
        g.beginPath(); g.moveTo(x0, y0 + s); g.lineTo(x0 + s * 0.5, y0); g.lineTo(x0 + s, y0 + s); g.lineTo(x0 + s * 0.5, y0 + s * 0.68); g.closePath(); g.fill();
        g.font = `700 ${Math.round(h * 0.46)}px Bahnschrift, "DIN Alternate", "Barlow", sans-serif`; g.textBaseline = "middle";
        g.fillText("Vectorwing", x0 + s * 1.25, h / 2 + 3);
        g.restore();
      };
    }

    // ================================================================ X-59
    function x59(o) {
      o = o || {};
      const root = new T.Group(); root.name = "x59";
      const body = new T.Group(); root.add(body);
      // fuselage: z = -1.2 (tail) .. 29.2 (nose tip) ; origin near the wing's mean chord
      const Z0 = -1.4, Z1 = 29.0;
      const w = curve([[Z0, 0.62], [0.5, 0.8], [4, 0.95], [9, 1.08], [13, 1.0], [16, 0.86], [19, 0.7], [22, 0.5], [25, 0.3], [27.5, 0.13], [Z1, 0.015]]);
      const top = curve([[Z0, 0.42], [3, 0.55], [9, 0.62], [13, 0.68], [15.5, 0.72], [17.5, 0.62], [20, 0.46], [23, 0.3], [26, 0.17], [Z1, 0.015]]);
      const bot = curve([[Z0, 0.3], [3, 0.5], [9, 0.62], [14, 0.6], [18, 0.5], [22, 0.34], [25.5, 0.2], [Z1, 0.015]]);
      const yc = curve([[Z0, 0.18], [5, 0.0], [12, 0.0], [18, -0.04], [24, -0.1], [Z1, -0.16]]);
      const n = curve([[Z0, 3.0], [10, 2.8], [20, 2.3], [Z1, 2.1]]);
      const white = [0.93, 0.93, 0.92], grey = [0.42, 0.44, 0.47], navy = [0.08, 0.13, 0.32], red = [0.62, 0.06, 0.05];
      const livery = (z, a, x, y) => {
        const c = Math.cos(a);
        if (c < -0.42) return grey;                                     // belly
        if (Math.abs(c + 0.18) < 0.05 && z > 2 && z < 27) return navy;  // cheat line
        if (Math.abs(c + 0.27) < 0.025 && z > 4 && z < 24) return red;
        return white;
      };
      const fus = loft({ z: [Z0, Z1], w, top, bot, y: yc, n }, 110, 44, livery);
      mesh(fus, paint("#ffffff", { vc: true, rep: 9 }), body);
      // canopy: a low bubble with side windows, no forward window (opaque nose fairing ahead of it)
      const can = new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      can.scale(0.5, 0.42, 1.55); can.translate(0, 0.5, 15.9);
      mesh(can, glass(), body);
      const fair = new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); // opaque front of the canopy
      fair.scale(0.52, 0.44, 1.3); fair.translate(0, 0.48, 17.6);
      mesh(fair, paint("#f2f2f0", { panels: false }), body);
      // top-mounted engine nacelle + inlet + nozzle, aft deck
      const nac = loft({ z: [-1.6, 10.5], w: curve([[-1.6, 0.5], [0, 0.62], [5, 0.72], [9, 0.66], [10.5, 0.55]]), top: curve([[-1.6, 0.5], [0, 0.6], [5, 0.7], [10.5, 0.42]]),
        bot: curve([[-1.6, 0.5], [5, 0.5], [10.5, 0.3]]), y: curve([[-1.6, 0.92], [3, 1.0], [10.5, 0.92]]), n: () => 2.2 }, 50, 32,
        (z, a) => (Math.cos(a) < -0.6 ? [0.5, 0.52, 0.55] : [0.93, 0.93, 0.92]));
      mesh(nac, paint("#ffffff", { vc: true, rep: 4 }), body);
      const inlet = new T.Mesh(new T.CircleGeometry(1, 24).scale(0.5, 0.36, 1), dark("#0d0e10"));
      inlet.position.set(0, 0.98, 10.52); body.add(inlet);
      const lip = new T.Mesh(new T.TorusGeometry(1, 0.06, 6, 28).scale(0.52, 0.38, 1), metal("#b9bcc0"));
      lip.position.copy(inlet.position); body.add(lip);
      const noz = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 1.1, 24, 1, true).rotateX(Math.PI / 2), metal("#5d5f63"));
      noz.position.set(0, 0.95, -2.0); body.add(noz);
      const nozIn = new T.Mesh(new T.CircleGeometry(0.4, 20).rotateY(Math.PI), dark("#0a0a0b"));
      nozIn.position.set(0, 0.95, -1.6); body.add(nozIn);
      const deck = new T.Mesh(new T.BoxGeometry(1.7, 0.08, 2.6), paint("#e8e8e6", { panels: false }));
      deck.position.set(0, 0.32, -2.2); body.add(deck);
      // cranked-delta wing (both halves in one planform), low on the body
      const wing = surface([[0.6, 14.5], [1.5, 11.5], [2.6, 8.4], [4.55, 3.4], [4.55, 2.2], [1.0, 0.6], [-1.0, 0.6], [-4.55, 2.2], [-4.55, 3.4], [-2.6, 8.4], [-1.5, 11.5], [-0.6, 14.5]], 0.16, { taper: 0.55, span: 4.55 });
      const wm = mesh(wing, paint("#f0f0ee", { rep: 3 }), body); wm.position.y = -0.18;
      // wing-tip trailing edge flaps dark line
      // canards
      const can2 = surface([[0.7, 15.1], [1.75, 14.3], [1.75, 13.75], [0.7, 13.6], [-0.7, 13.6], [-1.75, 13.75], [-1.75, 14.3], [-0.7, 15.1]], 0.07, { taper: 0.4, span: 1.75 });
      const cm = mesh(can2, paint("#f0f0ee", { panels: false }), body); cm.position.y = 0.18;
      // stabilators (aft, low) with slight anhedral
      for (const s of [1, -1]) {
        const st = surface([[0.7 * s, 1.3], [2.5 * s, -0.2], [2.5 * s, -1.0], [0.7 * s, -1.2]], 0.08, { taper: 0.4, span: 2.5 });
        const m = mesh(st, paint("#efefed", { panels: false }), body); m.position.y = 0.05; m.rotation.z = -s * 6 * D2R;
      }
      // vertical tail on the nacelle + T-tail on top
      const fin = finGeo([[0.0, 1.2], [3.9, 1.2], [2.0, 3.6], [0.55, 3.6]], 0.14, 0.45);
      const fm = mesh(fin, paint("#f2f2f0", { panels: false }), body); fm.position.z = -1.0;
      const tt = surface([[1.25, 0.55], [1.25, -0.3], [-1.25, -0.3], [-1.25, 0.55], [0, 1.1]], 0.07, { taper: 0.3, span: 1.25 });
      const tm = mesh(tt, paint("#f2f2f0", { panels: false }), body); tm.position.set(0, 3.62, 0);
      const finTip = new T.Mesh(new T.BoxGeometry(0.15, 0.32, 1.42), paint("#a11d16", { panels: false })); finTip.position.set(0, 3.44, -0.05); body.add(finTip);
      // lettering: X-59 on both sides of the fin; channel mark on both sides of the fuselage
      for (const s of [1, -1]) {
        decal(body, textDraw("X-59", "700 150px Bahnschrift, 'DIN Alternate', sans-serif", "#1d2a52", false), { w: 1.4, h: 0.7, at: [s * 0.125, 2.25, 0.7], rot: [0, s * Math.PI / 2, 0], cw: 512, ch: 256 });
        decal(body, markDraw("#2a3550", false), { w: 2.4, h: 0.42, at: [s * 1.07, 0.22, 8.0], rot: [0, s * Math.PI / 2, 0], cw: 1024, ch: 180 });
      }
      // landing gear (hidden in flight): nose gear under the cockpit, mains under the wing
      const gear = new T.Group(); gear.visible = !!o.gear; body.add(gear);
      const strut = metal("#9a9da1"), tyre = rubber();
      const wheel = (x, z, r, len) => {
        const st = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, len, 8), strut); st.position.set(x, -0.45 - len / 2, z); gear.add(st);
        const wh = new T.Mesh(new T.CylinderGeometry(r, r, 0.22, 16).rotateZ(Math.PI / 2), tyre); wh.position.set(x, -0.45 - len, z); wh.castShadow = true; gear.add(wh);
      };
      wheel(0, 15.2, 0.3, 1.25); wheel(1.15, 4.6, 0.38, 1.1); wheel(-1.15, 4.6, 0.38, 1.1);
      // exhaust glow (afterburner-free, just hot nozzle)
      const glow = new T.Mesh(new T.CircleGeometry(0.38, 20).rotateY(Math.PI), emit("#ffb36b", 3)); glow.position.set(0, 0.95, -1.65); body.add(glow);
      root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      body.position.z = -12; // pivot near mid-length
      root.userData = { gear, body, len: Z1 - Z0, noseZ: Z1 - 12, tailZ: Z0 - 12.6, nozzle: [0, 0.95, -14.2], cockpit: [0, 0.8, 4.2] };
      return root;
    }

    // ================================================================ fighter: twin-tail (F-15-like) or single-tail (F-5-like)
    // +Z = nose, metres before scaling to o.len. Loft fuselage with a chined nose, raked side intakes with dark mouths and
    // splitter plates, shoulder wing with a cropped-delta planform, dogtooth stabilators, canted twin fins, bubble canopy
    // with frame, petal ("turkey feather") titanium nozzles with an inner glow, optional gear. Two-tone grey + panel maps.
    function fighter(o) {
      o = Object.assign({ twin: true, len: 19.4, paint: "#5e666f", belly: "#7b838b", gear: false }, o);
      const tw = o.twin, L = tw ? 19.3 : 14.6, s = o.len / L;
      const root = new T.Group(), body = new T.Group(); root.add(body); body.scale.setScalar(s);
      const Z0 = tw ? -9.6 : -7.2, Z1 = tw ? 9.7 : 7.4, k = tw ? 1 : 0.72;
      const w = curve(tw ? [[Z0, 1.0], [-6, 1.18], [-2, 1.22], [1, 1.02], [3, 0.8], [5, 0.62], [7, 0.44], [8.6, 0.26], [Z1, 0.02]]
        : [[Z0, 0.62], [-4.5, 0.72], [-1, 0.78], [1.5, 0.68], [3.5, 0.5], [5.5, 0.3], [6.8, 0.14], [Z1, 0.02]]);
      const top = curve(tw ? [[Z0, 0.36], [-5, 0.46], [0, 0.56], [2.4, 0.74], [4.2, 0.74], [5.6, 0.55], [7.2, 0.36], [Z1, 0.02]]
        : [[Z0, 0.3], [-3, 0.42], [0, 0.5], [1.8, 0.62], [3.4, 0.58], [5, 0.36], [6.6, 0.18], [Z1, 0.02]]);
      const bot = curve(tw ? [[Z0, 0.34], [-3, 0.55], [2, 0.5], [5, 0.44], [7, 0.33], [Z1, 0.02]] : [[Z0, 0.3], [-2, 0.45], [2, 0.42], [5, 0.3], [Z1, 0.02]]);
      const yc = curve([[Z0, 0.12], [0, 0], [Z1 * 0.6, -0.07], [Z1, -0.14]]);
      const nn = curve([[Z0, 3.3], [Z1 * 0.3, 3.0], [Z1 * 0.65, 2.5], [Z1, 2.1]]);
      const base = new T.Color(o.paint), bel = new T.Color(o.belly);
      const fus = loft({ z: [Z0, Z1], w, top, bot, y: yc, n: nn }, 110, 44, (z, a) => {
        const c = Math.cos(a);
        if (z > Z1 - 1.3) return [0.36, 0.38, 0.4];
        return c < -0.25 ? [bel.r, bel.g, bel.b] : [base.r, base.g, base.b];
      });
      const PAINT = paint("#ffffff", { vc: true, rep: 7, clearcoat: 0.12, rough: 0.55 });
      const PAINT2 = paint(o.paint, { rep: 4, clearcoat: 0.1, rough: 0.55 });
      mesh(fus, PAINT, body);
      const cz = tw ? 3.9 : 2.4, cy = tw ? 0.6 : 0.48;
      const can = new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); can.scale(0.5 * k + 0.06, 0.62 * k, 2.2 * k); can.translate(0, cy, cz);
      mesh(can, glass(), body);
      const frameM = dark("#2c3034");
      const ring = new T.Mesh(new T.TorusGeometry(1, 0.035, 6, 40).scale(0.52 * k + 0.06, 2.22 * k, 1).rotateX(Math.PI / 2), frameM); ring.position.set(0, cy + 0.02, cz); body.add(ring);
      const bow = new T.Mesh(new T.TorusGeometry(1, 0.04, 6, 24, Math.PI).scale(0.5 * k + 0.06, 0.6 * k, 1), frameM); bow.position.set(0, cy, cz + 0.55 * k); body.add(bow);
      const ix = tw ? 1.5 : 0.95, iw = tw ? 0.92 : 0.5, ih = tw ? 1.25 : 0.7, iz0 = tw ? 1.7 : 0.9, iz1 = tw ? -7.6 : -4.5, iy = tw ? -0.12 : -0.05;
      for (const sx of [1, -1]) {
        const prof = new T.Shape([[iz0, ih / 2], [iz0 + 0.55, -ih / 2], [iz1, -ih / 2 + 0.1], [iz1 - 0.8, 0], [iz1, ih / 2 - 0.05]].map((p) => new T.Vector2(p[0], p[1])));
        const g = new T.ExtrudeGeometry(prof, { depth: iw, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
        g.translate(0, 0, -iw / 2);
        const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const zz = P.getX(i), yy = P.getY(i), xx = P.getZ(i); P.setXYZ(i, xx, yy, zz); }
        flipWinding(g); g.computeVertexNormals();
        const d = mesh(g, PAINT2, body); d.position.set(sx * ix, iy, 0);
        const mouth = new T.Mesh(new T.PlaneGeometry(iw * 0.86, ih * 0.84), dark("#07080a"));
        mouth.position.set(sx * ix, iy - 0.02, iz0 + 0.3); mouth.rotation.x = -Math.atan2(0.55, ih); body.add(mouth);
        const sp = new T.Mesh(new T.BoxGeometry(0.04, ih * 0.9, 1.2), PAINT2); sp.position.set(sx * (ix - iw / 2 - 0.08), iy, iz0 - 0.4); body.add(sp);
      }
      const span = tw ? 6.55 : 4.1;
      const wing = surface(tw ? [[1.2, 0.9], [span, -4.3], [span, -5.8], [1.2, -7.1], [-1.2, -7.1], [-span, -5.8], [-span, -4.3], [-1.2, 0.9]]
        : [[0.8, 0.4], [span, -2.6], [span, -3.3], [0.8, -4.3], [-0.8, -4.3], [-span, -3.3], [-span, -2.6], [-0.8, 0.4]], tw ? 0.22 : 0.14, { taper: 0.6, span });
      const wm = mesh(wing, PAINT2, body); wm.position.y = tw ? 0.12 : 0.0;
      for (const sx of [1, -1]) { const rail = new T.Mesh(new T.BoxGeometry(0.1, 0.08, 1.6), metal("#55595e")); rail.position.set(sx * span, wm.position.y, tw ? -5.0 : -2.9); body.add(rail); }
      const hs = surface(tw ? [[1.25, -6.6], [4.45, -8.5], [4.45, -9.5], [2.2, -9.4], [2.2, -9.1], [1.25, -9.6], [-1.25, -9.6], [-2.2, -9.1], [-2.2, -9.4], [-4.45, -9.5], [-4.45, -8.5], [-1.25, -6.6]]
        : [[0.7, -5.0], [2.7, -6.4], [2.7, -7.0], [0.7, -7.1], [-0.7, -7.1], [-2.7, -7.0], [-2.7, -6.4], [-0.7, -5.0]], 0.09, { taper: 0.45, span: tw ? 4.45 : 2.7 });
      const hm = mesh(hs, PAINT2, body); hm.position.y = -0.05;
      const finPts = tw ? [[-9.45, 0.45], [-6.1, 0.45], [-8.45, 3.45], [-9.75, 3.45]] : [[-6.9, 0.4], [-3.6, 0.4], [-5.9, 2.9], [-7.0, 2.9]];
      for (const sx of tw ? [1, -1] : [0]) {
        const f = mesh(finGeo(finPts, tw ? 0.14 : 0.12, 0.45), PAINT2, body);
        f.position.x = sx * 1.42; f.rotation.z = -sx * 0.06;
        const rud = new T.Mesh(new T.BoxGeometry(0.17, tw ? 2.6 : 2.0, 0.035), dark("#3a3f44"));
        rud.position.set(sx * 1.42 - sx * 0.1, tw ? 2.1 : 1.7, tw ? -9.0 : -6.4); rud.rotation.z = -sx * 0.06; body.add(rud);
      }
      const flames = [], glows = [];
      const nz = tw ? [0.64, -0.64] : [0.36, -0.36], nr = tw ? 0.56 : 0.34, nzz = Z0 - 0.25;
      const TI = K.patch(new T.MeshStandardMaterial({ color: "#77716a", roughness: 0.36, metalness: 0.88, envMapIntensity: 1.1 }), { hero: true, key: "ti" });
      for (const sx of nz) {
        const can2 = new T.Mesh(new T.CylinderGeometry(nr * 0.98, nr * 1.04, 1.0, 24, 1, true).rotateX(Math.PI / 2), TI); can2.position.set(sx, 0.05, nzz + 0.25); body.add(can2);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2, pet = new T.Mesh(new T.BoxGeometry(nr * 0.42, 0.035, 0.95), TI);
          const g = new T.Group(); g.position.set(sx, 0.05, nzz - 0.25); g.rotation.z = a; body.add(g);
          pet.position.set(0, nr * 0.93, -0.35); pet.rotation.x = 0.12; g.add(pet);
        }
        const inner = new T.Mesh(new T.CylinderGeometry(nr * 0.78, nr * 0.86, 0.9, 20, 1, true).rotateX(Math.PI / 2), dark("#0b0b0c")); inner.position.set(sx, 0.05, nzz - 0.25); inner.material.side = T.DoubleSide; body.add(inner);
        const gm = new T.MeshBasicMaterial({ color: new T.Color("#ff8a3a").multiplyScalar(6) }); K.patch(gm, { hero: true, key: "glow", fogScale: 0.3 });
        const gl = new T.Mesh(new T.CircleGeometry(nr * 0.76, 20).rotateY(Math.PI), gm); gl.position.set(sx, 0.05, nzz + 0.1); body.add(gl); glows.push(gl);
        const fl = flame(nr / 0.4); fl.position.set(sx, 0.05, nzz - 0.7); body.add(fl); flames.push(fl);
      }
      const gear = new T.Group(); gear.visible = !!o.gear; body.add(gear);
      const strut = metal("#a6a9ad"), tyreM = K.patch(new T.MeshStandardMaterial({ color: "#141414", roughness: 0.9 }), { hero: true, key: "tyre" });
      const wheel = (x, z, r, len) => {
        const st = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, len, 8), strut); st.position.set(x, -0.45 - len / 2, z); gear.add(st);
        const wh = new T.Mesh(new T.CylinderGeometry(r, r, 0.26, 18).rotateZ(Math.PI / 2), tyreM); wh.position.set(x, -0.45 - len, z); gear.add(wh);
      };
      wheel(0, tw ? 6.0 : 4.6, 0.3, 1.3); wheel(1.35 * k + 0.2, tw ? -2.2 : -1.6, 0.42, 1.2); wheel(-(1.35 * k + 0.2), tw ? -2.2 : -1.6, 0.42, 1.2);
      root.traverse((m) => { if (m.isMesh && !m.userData.fx) { m.castShadow = true; m.receiveShadow = true; } });
      root.userData = { len: o.len, gear, nozzles: nz.map((x) => [x * s, 0.05 * s, (nzz - 0.6) * s]),
        ab(level, t) { flames.forEach((f, i) => f.userData.set(level, t + i * 0.37)); glows.forEach((g) => { g.visible = level > 0.05; }); } };
      root.userData.ab(0, 0);
      return root;
    }
    // afterburner flame: nested additive cones with a hot core and shock diamonds
    function flame(sc) {
      sc = sc || 1;
      const g = new T.Group();
      const mk = (r, len, col, a) => {
        const geo = new T.CylinderGeometry(r * 0.2, r, len, 20, 6, true).rotateX(-Math.PI / 2).translate(0, 0, -len / 2);
        const m = new T.ShaderMaterial({
          uniforms: { c: { value: new T.Color(col) }, a: { value: a }, k: { value: 1 }, t: { value: 0 }, len: { value: len } },
          vertexShader: "varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
          fragmentShader: "uniform vec3 c; uniform float a, k, t, len; varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ float u = clamp(-vP.z/len, 0.0, 1.0); float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.5); float dia = 0.75 + 0.25*sin(u*28.0 - t*40.0); float al = a * k * (1.0-u) * (1.0-u) * f * dia; gl_FragColor = vec4(c * 3.0, al); }",
        });
        K.keepAlphaBlend(m, true); m.side = T.DoubleSide;
        const x = new T.Mesh(geo, m); x.userData.fx = true; x.frustumCulled = false; x.renderOrder = 5; g.add(x);
        return m;
      };
      const ms = [mk(0.36 * sc, 6.5 * sc, "#ff7a2e", 0.8), mk(0.26 * sc, 4.2 * sc, "#ffc27a", 0.9), mk(0.15 * sc, 2.6 * sc, "#cfe2ff", 1.0)];
      g.userData.set = (level, t) => { g.visible = level > 0.01; ms.forEach((m) => { m.uniforms.k.value = level; m.uniforms.t.value = t; }); g.scale.set(1, 1, 0.5 + 0.5 * level); };
      return g;
    }

    // ================================================================ twin turboprop airliner (comparison)
    function turboprop(o) {
      o = Object.assign({ len: 27 }, o);
      const root = new T.Group(), body = new T.Group(); root.add(body);
      const Z0 = -13, Z1 = 14;
      const w = curve([[Z0, 0.25], [-10, 0.95], [-6, 1.38], [8, 1.38], [11.5, 1.2], [13.2, 0.75], [Z1, 0.1]]);
      const top = curve([[Z0, 0.5], [-10, 1.2], [-6, 1.42], [8, 1.42], [11.5, 1.2], [13.2, 0.75], [Z1, 0.1]]);
      const bot = curve([[Z0, 0.1], [-10, 0.6], [-6, 1.35], [8, 1.38], [11.5, 1.2], [13.2, 0.7], [Z1, 0.1]]);
      const yc = curve([[Z0, 1.1], [-8, 0.2], [0, 0], [12, -0.1], [Z1, -0.25]]);
      const fus = loft({ z: [Z0, Z1], w, top, bot, y: yc, n: () => 2.0 }, 80, 36, (z, a) => {
        const c = Math.cos(a);
        if (Math.abs(c - 0.15) < 0.09 && z > -7 && z < 10.5 && Math.floor((z + 7) / 0.75) % 2 === 0) return [0.06, 0.07, 0.09]; // windows
        if (c < -0.25 && c > -0.4) return [0.1, 0.3, 0.62];
        return [0.95, 0.95, 0.95];
      });
      mesh(fus, paint("#ffffff", { vc: true, rep: 8, clearcoat: 0.3 }), body);
      const wing = surface([[1.4, 2.4], [13.5, 1.4], [13.5, -0.2], [1.4, -0.4], [-1.4, -0.4], [-13.5, -0.2], [-13.5, 1.4], [-1.4, 2.4]], 0.28, { taper: 0.5, span: 13.5 });
      const wm = mesh(wing, paint("#f2f2f2", { rep: 4 }), body); wm.position.y = 1.4;
      const fin = mesh(finGeo([[-13.2, 1.0], [-8.8, 1.0], [-11.4, 6.2], [-13.6, 6.2]], 0.24, 0.4), paint("#f2f2f2", { panels: false }), body);
      const ht = surface([[0.5, -11.0], [4.2, -12.0], [4.2, -13.2], [-4.2, -13.2], [-4.2, -12.0], [-0.5, -11.0]], 0.12, { taper: 0.3, span: 4.2 });
      const hm = mesh(ht, paint("#f2f2f2", { panels: false }), body); hm.position.y = 6.25;
      const props = [];
      for (const sx of [4.1, -4.1]) {
        const nc = loft({ z: [-3.2, 2.6], w: curve([[-3.2, 0.12], [-1.5, 0.48], [1.5, 0.55], [2.6, 0.32]]), top: curve([[-3.2, 0.12], [0, 0.6], [2.6, 0.32]]),
          bot: curve([[-3.2, 0.12], [0, 0.7], [2.6, 0.36]]), y: () => 0, n: () => 2.1 }, 30, 24);
        const nm = mesh(nc, paint("#eeeeee", { panels: false }), body); nm.position.set(sx, 1.05, 0);
        const sp = new T.Mesh(new T.ConeGeometry(0.34, 0.8, 16).rotateX(Math.PI / 2), paint("#e9e9e9", { panels: false })); sp.position.set(sx, 1.05, 3.0); body.add(sp);
        const d = rotorDisc(2.0, 6, "#202224"); d.position.set(sx, 1.05, 2.75); body.add(d); props.push(d);
      }
      root.traverse((m) => { if (m.isMesh && !m.userData.fx) { m.castShadow = true; m.receiveShadow = true; } });
      root.userData = { len: o.len, spin(t) { props.forEach((p, i) => p.userData.spin(t * (i ? 1 : -1) + i * 0.3)); } };
      root.userData.spin(0);
      return root;
    }
    // blurred spinning rotor/prop disc: radial streak alpha + a few ghost blades; spin(t) is a pure function of time
    function rotorDisc(R, blades, col) {
      const m = new T.ShaderMaterial({
        uniforms: { c: { value: new T.Color(col) }, ph: { value: 0 }, nb: { value: blades }, R: { value: R } },
        vertexShader: "varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
        fragmentShader: `uniform vec3 c; uniform float ph, nb, R; varying vec2 vP; varying vec3 vW;
          void main(){ float r = length(vP)/R; float a = atan(vP.y, vP.x);
            float blade = pow(max(cos((a - ph) * nb * 0.5), 0.0), 60.0);
            float al = (0.16 + 0.38 * blade) * smoothstep(1.0, 0.93, r) * smoothstep(0.08, 0.2, r) * (0.75 + 0.25 * sin(r * 40.0));
            gl_FragColor = vec4(c, al); }`,
      });
      K.keepAlphaBlend(m, false); m.side = T.DoubleSide;
      const d = new T.Mesh(new T.CircleGeometry(R, 48), m); d.userData.fx = true; d.renderOrder = 6;
      d.userData.spin = (t) => { m.uniforms.ph.value = (t * 7.3) % (Math.PI * 2); };
      return d;
    }

    // ================================================================ shock-wave shell (Mach cone) streaming back from a point
    // opts: mach, len (m), at [x,y,z] in the parent frame, strength 0..1, col, rings (pressure bands moving aft)
    function shock(parent, op) {
      op = Object.assign({ mach: 1.4, len: 60, at: [0, 0, 0], strength: 0.6, col: "#dfeaff", bands: 3.0 }, op);
      const mu = Math.asin(1 / op.mach), R = op.len * Math.tan(mu);
      const geo = new T.CylinderGeometry(0.02, R, op.len, 64, 24, true).rotateX(Math.PI / 2).translate(0, 0, -op.len / 2);
      const m = new T.ShaderMaterial({
        uniforms: { c: { value: new T.Color(op.col) }, k: { value: op.strength }, t: { value: 0 }, len: { value: op.len }, bands: { value: op.bands } },
        vertexShader: "varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
        fragmentShader: `uniform vec3 c; uniform float k, t, len, bands; varying vec3 vP; varying vec3 vN; varying vec3 vV;
          void main(){ float u = clamp(-vP.z / len, 0.0, 1.0);
            float edge = 1.0 - abs(dot(normalize(vN), normalize(vV)));
            float rim = pow(edge, 3.0) * 1.2 + 0.05;
            float band = 0.78 + 0.22 * sin((u * bands - t) * 6.2831);
            float al = k * rim * band * smoothstep(0.0, 0.05, u) * (1.0 - u) ;
            gl_FragColor = vec4(c * 1.6, clamp(al, 0.0, 1.0)); }`,
      });
      K.keepAlphaBlend(m, true); m.side = T.DoubleSide;
      const x = new T.Mesh(geo, m); x.userData.fx = true; x.frustumCulled = false; x.renderOrder = 8;
      x.position.set(...op.at);
      parent.add(x);
      x.userData.set = (t, k) => { m.uniforms.t.value = t; if (k != null) m.uniforms.k.value = k; x.visible = (k == null ? op.strength : k) > 0.002; };
      return x;
    }
    // expanding glowing ring (a pressure wave front), flat in its parent's XZ plane: ring.userData.set(radius, alpha)
    function ring(parent, op) {
      op = Object.assign({ col: "#ffe2b0", width: 0.08, i: 3 }, op);
      const m = new T.ShaderMaterial({
        uniforms: { c: { value: new T.Color(op.col) }, a: { value: 1 }, w: { value: op.width }, I: { value: op.i } },
        vertexShader: "varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: "uniform vec3 c; uniform float a, w, I; varying vec2 vP; void main(){ float r = length(vP); float d = abs(r - (1.0 - w)) / w; float al = a * exp(-d*d*3.0); gl_FragColor = vec4(c * I, al); }",
      });
      K.keepAlphaBlend(m, true); m.side = T.DoubleSide;
      const x = new T.Mesh(new T.CircleGeometry(1, 96).rotateX(-Math.PI / 2), m);
      x.userData.fx = true; x.frustumCulled = false; x.renderOrder = 9;
      parent.add(x);
      x.userData.set = (r, a) => { x.scale.set(Math.max(r, 0.001), 1, Math.max(r, 0.001)); m.uniforms.a.value = a; x.visible = a > 0.003 && r > 0.01; };
      return x;
    }

    // ---- flight helpers: place a craft at p, heading along v (world), bank (deg), pitch offset (deg)
    const _q = new T.Quaternion(), _m = new T.Matrix4(), _v = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _o = new T.Vector3();
    function fly(obj, p, v, bank, pitch) {
      obj.position.set(p[0], p[1], p[2]);
      _v.set(v[0], v[1], v[2]).normalize();
      _m.lookAt(_v, _o.set(0, 0, 0), _up); // Matrix4.lookAt: local +Z = eye - target, so +Z points along v (nose forward)
      obj.quaternion.setFromRotationMatrix(_m);
      if (pitch) obj.rotateX(-pitch * D2R);
      if (bank) obj.rotateZ(bank * D2R);
      obj.updateMatrixWorld(true);
    }
    // a point in the craft's local frame -> world
    function local(obj, x, y, z) { obj.updateMatrixWorld(true); const p = new T.Vector3(x, y, z).applyMatrix4(obj.matrixWorld); return [p.x, p.y, p.z]; }

    return { curve, loft, surface, finGeo, paint, glass, dark, metal, emit, mesh, decal, textDraw, markDraw, x59, fighter, flame, turboprop, rotorDisc, shock, ring, fly, local };
  };
})();
