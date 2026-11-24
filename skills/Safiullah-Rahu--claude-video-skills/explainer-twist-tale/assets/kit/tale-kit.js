/* Tale kit v2 — bright cel-shaded 3D sets, a 3D toon cast and drawn ink outlines, for seek-safe HyperFrames shorts.
 *
 *   const K = TALE.create({ canvas, width: 1080, height: 1920 });
 *   const set = K.set("street", { bg, fog, hemi, ground, sun, sunI, hemiI, sunPos, shadow });   // a THREE.Group, hidden
 *   K.box(w, h, d, color, { x, y, z, ry, tex, parent: set });   K.cyl / cone / sphere / ico / roof / plane / clock
 *   K.ctex("planks" | "tiles" | "stripes" | "dots" | "wallpaper" | "brick" | "asphalt" | "facade" | "grass" | "sky" | "sign", opts)
 *   K.sky(set, { top, bottom, clouds })   K.car / tree / lamp / building / trafficLight   (set dressing)
 *   const a = K.toon("cop", { outfit, hat: "peaked", face: "neutral", h: 1.7, x, z, parent: set });
 *   a.set("shock"); a.pose("stop", k); a.walk(phase); a.hold(obj, "R"); a.turn = 20;
 *   await K.ready;   K.render({ set: "street", cam: [x, y, z], look: [x, y, z], fov: 50 });
 *
 * Look: MeshToonMaterial with a light 3-step ramp, a strong hemisphere fill and one shadowed sun, so authored colours
 * land at ~1.0 in light and ~0.65 in shadow (three r170 lights divide by pi); procedural canvas textures (planks,
 * tiles, wallpaper, facades, sky with clouds); then an ink pass that draws outlines where view-space normals or
 * linear depth jump, and a grade (saturation, gamma, lift, vignette). The cast are real 3D: a sphere head with a
 * face texture projected on its front, a capsule body, two-bone IK stick limbs, ball hands and hats. Billboard
 * doodles (K.actor) still work. Everything is a function of the state passed to render(), so any frame seeks alone.
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;
  const INK = "#22202b";
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const LOOK = Object.assign({ ramp: [150, 214, 255], sat: 1.3, gamma: 0.9, lift: 0.02, vig: 0.12, px: 3.0 }, o.look || {});
    T.ColorManagement.enabled = false;
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true,
      powerPreference: "high-performance" });
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const ANISO = renderer.capabilities.getMaxAnisotropy();

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(50, W / H, 0.05, 500);
    const loader = new T.TextureLoader();
    const loads = [];
    const texCache = {};
    function tex(src) {
      if (texCache[src]) return texCache[src];
      const t = loader.load(src);
      t.anisotropy = ANISO;
      t.colorSpace = T.NoColorSpace;
      loads.push(new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = src; }));
      texCache[src] = t;
      return t;
    }

    // ---- procedural canvas textures (seeded, so every render is identical)
    const ctCache = {};
    function ctex(kind, op) {
      op = Object.assign({}, op);
      const key = kind + JSON.stringify(op);
      if (ctCache[key]) return ctCache[key];
      const cv = document.createElement("canvas");
      cv.width = op.w || 512; cv.height = op.h || 512;
      const g = cv.getContext("2d"), r = rng(op.seed || 7);
      const w = cv.width, h = cv.height;
      const a = op.a || "#e0a96d", b = op.b || "#c98d55", ln = op.line || "rgba(34,32,43,0.55)";
      const shade = (hex, f) => { const c = new T.Color(hex); c.offsetHSL(0, 0, f); return "#" + c.getHexString(); };
      g.fillStyle = a; g.fillRect(0, 0, w, h);
      if (kind === "planks") {
        const n = op.n || 6, ph = h / n;
        for (let i = 0; i < n; i++) {
          let x = -r() * w * 0.6;
          while (x < w) {
            const len = w * (0.45 + r() * 0.5);
            g.fillStyle = shade(r() < 0.5 ? a : b, (r() - 0.5) * 0.06);
            g.fillRect(x, i * ph, len, ph);
            g.strokeStyle = "rgba(0,0,0,0.07)"; g.lineWidth = 2;
            for (let k = 0; k < 3; k++) { const y = i * ph + ph * (0.25 + r() * 0.5); g.beginPath(); g.moveTo(x + 8, y); g.bezierCurveTo(x + len * 0.3, y + 4, x + len * 0.6, y - 4, x + len - 8, y); g.stroke(); }
            g.fillStyle = ln; g.fillRect(x, i * ph, 3, ph);
            x += len;
          }
          g.fillStyle = ln; g.fillRect(0, i * ph, w, 3);
        }
      } else if (kind === "tiles") {
        const n = op.n || 4, s = w / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          g.fillStyle = op.checker === false ? a : ((i + j) % 2 ? b : a);
          g.fillRect(i * s, j * s, s, s);
        }
        g.strokeStyle = op.grout || "rgba(34,32,43,0.35)"; g.lineWidth = op.gw || 4;
        for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
      } else if (kind === "stripes") {
        const n = op.n || 6, cols = op.cols || [a, b];
        for (let i = 0; i < n; i++) {
          g.fillStyle = cols[i % cols.length];
          if (op.vertical) g.fillRect(i * w / n, 0, w / n + 1, h); else g.fillRect(0, i * h / n, w, h / n + 1);
        }
      } else if (kind === "dots") {
        const n = op.n || 6, s = w / n;
        g.fillStyle = b;
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) { g.beginPath(); g.arc(i * s + (j % 2) * s / 2, j * s, s * (op.r || 0.18), 0, 7); g.fill(); }
      } else if (kind === "wallpaper") {
        const n = op.n || 8;
        g.fillStyle = b;
        for (let i = 0; i < n; i++) g.fillRect(i * w / n + w / n * 0.42, 0, w / n * 0.16, h);
        g.fillStyle = op.c || shade(b, -0.1);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x = i * w / n + w / (2 * n) * (j % 2 ? 0 : 1) + w / (4 * n), y = j * h / n + h / (2 * n);
          g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 6, y); g.lineTo(x, y + 9); g.lineTo(x - 6, y); g.fill();
        }
      } else if (kind === "brick") {
        const rows = op.n || 10, bh = h / rows, bw = bh * 2.1;
        g.fillStyle = op.mortar || "#e9dccb"; g.fillRect(0, 0, w, h);
        for (let j = 0; j < rows; j++) for (let x = (j % 2) * -bw / 2; x < w; x += bw) {
          g.fillStyle = shade(r() < 0.5 ? a : b, (r() - 0.5) * 0.08);
          g.fillRect(x + 3, j * bh + 3, bw - 6, bh - 6);
        }
      } else if (kind === "asphalt") {
        for (let k = 0; k < 2600; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"; g.fillRect(r() * w, r() * h, 3, 3); }
        if (op.lane) { g.fillStyle = op.lane; for (let y = 0; y < h; y += h / 4) g.fillRect(w / 2 - 6, y + h / 16, 12, h / 8); }
      } else if (kind === "grass") {
        g.strokeStyle = b; g.lineWidth = 3;
        for (let k = 0; k < 900; k++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y - 10 - r() * 8); g.stroke(); }
      } else if (kind === "facade") {
        const cols = op.cols || 4, rows = op.rows || 5, mx = w * 0.08, my = h * 0.06;
        const cw = (w - 2 * mx) / cols, rh = (h - 2 * my) / rows;
        if (op.band) { g.fillStyle = op.band; for (let j = 0; j <= rows; j++) g.fillRect(0, my + j * rh - 6, w, 10); }
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          if (op.ground && j === rows - 1) continue;
          const x = mx + i * cw + cw * 0.17, y = my + j * rh + rh * 0.14, ww = cw * 0.66, hh = rh * 0.68;
          g.fillStyle = op.frame || "#f4efe4"; g.fillRect(x - 6, y - 6, ww + 12, hh + 12);
          const lit = r() < (op.lit || 0);
          const gr = g.createLinearGradient(x, y, x + ww, y + hh);
          gr.addColorStop(0, lit ? "#ffe08a" : (op.glass || "#9fd6f5")); gr.addColorStop(1, lit ? "#ffc65a" : shade(op.glass || "#9fd6f5", -0.12));
          g.fillStyle = gr; g.fillRect(x, y, ww, hh);
          g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.moveTo(x + ww * 0.15, y + hh); g.lineTo(x + ww * 0.55, y); g.lineTo(x + ww * 0.72, y); g.lineTo(x + ww * 0.32, y + hh); g.fill();
          g.fillStyle = op.frame || "#f4efe4"; g.fillRect(x + ww / 2 - 3, y, 6, hh); g.fillRect(x, y + hh * 0.45, ww, 6);
          g.strokeStyle = ln; g.lineWidth = 3; g.strokeRect(x - 6, y - 6, ww + 12, hh + 12);
        }
      } else if (kind === "sky") {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, op.top || "#4aa8f0"); gr.addColorStop(0.62, op.mid || "#9fd4fb"); gr.addColorStop(1, op.bottom || "#e8f6ff");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        const n = op.clouds == null ? 9 : op.clouds;
        for (let k = 0; k < n; k++) {
          const cx = r() * w, cy = h * (0.22 + r() * 0.26), s = 26 + r() * 30;
          for (const dx of [-1, 1]) for (let q = 0; q < 2; q++) {
            const xx = ((cx + dx * w) % w + w) % w;
            g.fillStyle = "#ffffff";
            [[-1.5, 0.25, 0.9], [-0.6, -0.2, 1.25], [0.5, -0.35, 1.1], [1.4, 0.15, 0.85], [0, 0.35, 1.0]].forEach(([u, v, k2]) => {
              g.beginPath(); g.ellipse(xx + u * s, cy + v * s, s * k2, s * k2 * 0.7, 0, 0, 7); g.fill(); });
            if (q === 0) break;
          }
          g.fillStyle = "rgba(160,190,225,0.35)"; g.fillRect(0, 0, 0, 0);
        }
      } else if (kind === "sign") {
        g.fillStyle = op.bg || a; g.fillRect(0, 0, w, h);
        if (op.border) { g.strokeStyle = op.border; g.lineWidth = op.bw || 14; g.strokeRect(op.bw / 2 || 7, op.bw / 2 || 7, w - (op.bw || 14), h - (op.bw || 14)); }
        (op.lines || []).forEach((L) => {
          let sz = L.size || 90;
          const fam = L.font || '"Arial Black", Arial, sans-serif';
          g.font = `${L.weight || 900} ${sz}px ${fam}`;
          while (sz > 12 && g.measureText(L.text).width > w * 0.9) { sz -= 2; g.font = `${L.weight || 900} ${sz}px ${fam}`; }
          g.textAlign = L.align || "center"; g.textBaseline = "middle";
          if (L.stroke) { g.lineWidth = L.sw || 10; g.strokeStyle = L.stroke; g.lineJoin = "round"; g.strokeText(L.text, L.x == null ? w / 2 : L.x, L.y); }
          g.fillStyle = L.color || INK; g.fillText(L.text, L.x == null ? w / 2 : L.x, L.y);
        });
      }
      const t = new T.CanvasTexture(cv);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      if (op.rep) t.repeat.set(op.rep[0], op.rep[1]);
      t.anisotropy = ANISO;
      t.colorSpace = T.NoColorSpace;
      ctCache[key] = t;
      return t;
    }

    // normal-pass shaders (ink detection): alpha-cut by the texture when there is one
    const NV = `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
    const NF = `uniform sampler2D map; uniform float useMap; varying vec2 vUv; varying vec3 vN;
      void main(){ if (useMap > 0.5 && texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, 1.0); }`;
    const inkless = new T.ShaderMaterial({ vertexShader: NV, fragmentShader: "void main(){ gl_FragColor = vec4(0.0); if (gl_FragCoord.x > -1.0) discard; }" });

    // ---- toon material: a light 3-step ramp
    const ramp = new T.DataTexture(new Uint8Array(LOOK.ramp.flatMap((v) => [v, v, v, 255])), LOOK.ramp.length, 1, T.RGBAFormat);
    ramp.minFilter = ramp.magFilter = T.NearestFilter;
    ramp.needsUpdate = true;
    const matCache = {};
    function mat(color, opt) {
      opt = opt || {};
      const key = color + JSON.stringify(opt);
      if (!opt.map && matCache[key]) return matCache[key];
      const m = opt.basic ? new T.MeshBasicMaterial({ color, map: opt.map || null, transparent: !!opt.transparent, opacity: opt.opacity == null ? 1 : opt.opacity, alphaTest: opt.alphaTest || 0, side: opt.side || T.FrontSide, fog: opt.fog !== false })
        : new T.MeshToonMaterial({ color, gradientMap: ramp, map: opt.map || null, emissive: opt.emissive || 0x000000, side: opt.side || T.FrontSide, alphaTest: opt.alphaTest || 0 });
      if (opt.polyOff) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }
      if (!opt.map) matCache[key] = m;
      return m;
    }
    const matFor = (color, p) => (p && p.tex ? mat("#ffffff", Object.assign({ map: p.tex }, p.mat)) : mat(color, p && p.mat));

    // ---- lights (re-aimed per set). three r170 divides diffuse by pi: hemi 1.9 + sun 1.35 puts lit faces at ~1.0
    const hemi = new T.HemisphereLight(0xffffff, 0xd8d0e0, 1.9);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xffffff, 1.35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);

    const sets = {};
    function set(name, opt) {
      const g = new T.Group();
      g.name = name;
      g.visible = false;
      g.userData = Object.assign({ bg: "#bfe3ff", fog: null, sky: "#ffffff", ground: "#d8d0e0", sun: "#fff6e6", sunI: 1.35, hemiI: 1.9,
        sunPos: [6, 12, 8], shadow: 10, ink: INK }, opt || {});
      scene.add(g);
      sets[name] = g;
      return g;
    }
    function place(m, p) {
      p = p || {};
      m.position.set(p.x || 0, p.y || 0, p.z || 0);
      m.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R);
      if (p.s) m.scale.setScalar(p.s);
      if (p.sx || p.sy || p.sz) m.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
      m.traverse((c) => { if (c.isMesh) { c.castShadow = p.cast !== false; c.receiveShadow = p.receive !== false; } });
      if (p.noink) m.traverse((c) => (c.userData.nmat = inkless));
      (p.parent || scene).add(m);
      return m;
    }
    // primitives sit ON y (their base at y) unless p.center
    function box(w, h, d, color, p) {
      p = Object.assign({}, p);
      const g = new T.BoxGeometry(w, h, d);
      if (!p.center) g.translate(0, h / 2, 0);
      return place(new T.Mesh(g, matFor(color, p)), p);
    }
    function cyl(r1, r2, h, color, p) {
      p = Object.assign({}, p);
      const g = new T.CylinderGeometry(r1, r2, h, p.seg || 32, 1, !!p.open, p.t0 || 0, p.tl || Math.PI * 2);
      if (!p.center) g.translate(0, h / 2, 0);
      return place(new T.Mesh(g, matFor(color, p)), p);
    }
    function cone(r, h, color, p) { return cyl(0.0001, r, h, color, Object.assign({ seg: (p && p.seg) || 32 }, p)); }
    function sphere(r, color, p) {
      p = Object.assign({}, p);
      return place(new T.Mesh(new T.SphereGeometry(r, p.seg || 32, p.seg2 || 20), matFor(color, p)), p);
    }
    function ico(r, color, p) {
      p = Object.assign({}, p);
      return place(new T.Mesh(new T.IcosahedronGeometry(r, p.detail || 0), matFor(color, p)), p);
    }
    function torus(r, tube, color, p) {
      p = Object.assign({}, p);
      return place(new T.Mesh(new T.TorusGeometry(r, tube, p.seg2 || 12, p.seg || 40, p.arc || Math.PI * 2), matFor(color, p)), p);
    }
    // gable roof: triangular prism w (x) by d (z), height h, base at y
    function roof(w, h, d, color, p) {
      const s = new T.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
      g.translate(0, 0, -d / 2);
      return place(new T.Mesh(g, matFor(color, p)), p);
    }
    // a rounded slab: rounded-rect profile (w x h, radius r) extruded d along z, base at y
    function slab(w, h, d, r, color, p) {
      p = Object.assign({}, p);
      const s = new T.Shape(), x = -w / 2;
      r = Math.min(r, w / 2, h / 2);
      s.moveTo(x + r, 0); s.lineTo(x + w - r, 0); s.quadraticCurveTo(x + w, 0, x + w, r); s.lineTo(x + w, h - r);
      s.quadraticCurveTo(x + w, h, x + w - r, h); s.lineTo(x + r, h); s.quadraticCurveTo(x, h, x, h - r); s.lineTo(x, r); s.quadraticCurveTo(x, 0, x + r, 0);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: Math.min(0.04, r * 0.4), bevelThickness: Math.min(0.04, r * 0.4), bevelSegments: 2, curveSegments: 6 });
      g.translate(0, 0, -d / 2);
      return place(new T.Mesh(g, matFor(color, p)), p);
    }
    // textured flat card (signs, papers, flags, windows); basic = unlit. src: svg path, "#hex" or a texture
    function plane(w, h, src, p) {
      p = Object.assign({ cast: false }, p);
      const isTex = src && typeof src === "object";
      const textured = isTex || (src && !src.startsWith("#"));
      const map = isTex ? src : textured ? tex(src) : null;
      const m = new T.Mesh(new T.PlaneGeometry(w, h), !textured ? mat(src, p.mat) :
        mat("#ffffff", Object.assign({ map, basic: p.lit === false || p.basic !== false, alphaTest: 0.5, side: T.DoubleSide }, p.mat)));
      if (textured) m.userData.nmat = new T.ShaderMaterial({ uniforms: { map: { value: map }, useMap: { value: 1 } }, vertexShader: NV, fragmentShader: NF, side: p.mat && p.mat.side != null ? p.mat.side : T.DoubleSide });
      if (p.noink) m.userData.nmat = inkless;
      return place(m, p);
    }
    // a wall clock: face texture + two hands (set(h, m)); facing +z
    function clock(r, p) {
      p = Object.assign({}, p);
      const g = new T.Group();
      const rim = new T.Mesh(new T.CylinderGeometry(r * 1.08, r * 1.08, r * 0.16, 48), mat(p.rim || "#5a3b26"));
      rim.rotation.x = Math.PI / 2;
      g.add(rim);
      const face = new T.Mesh(new T.CircleGeometry(r, 48), mat("#ffffff", { map: tex(p.face || "assets/props/clockface.svg"), basic: true }));
      face.position.z = r * 0.081;
      g.add(face);
      const mk = (len, wid, z) => {
        const hand = new T.Group();
        const bar = new T.Mesh(new T.BoxGeometry(wid, len, r * 0.03), mat(p.hand || INK, { basic: true }));
        bar.position.y = len / 2 - len * 0.12;
        hand.add(bar);
        hand.position.z = z;
        g.add(hand);
        return hand;
      };
      const hh = mk(r * 0.52, r * 0.085, r * 0.1), mh = mk(r * 0.8, r * 0.055, r * 0.12);
      const pin = new T.Mesh(new T.CircleGeometry(r * 0.07, 20), mat(p.pin || "#c4342a", { basic: true }));
      pin.position.z = r * 0.14;
      g.add(pin);
      place(g, Object.assign({ cast: true }, p));
      g.userData.set = (h, m) => {
        mh.rotation.z = -(m / 60) * Math.PI * 2;
        hh.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
      };
      g.userData.set(10, 10);
      return g;
    }

    // ---- set dressing
    function sky(g, op) {
      op = Object.assign({}, op);
      const m = new T.Mesh(new T.SphereGeometry(op.r || 220, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
        new T.MeshBasicMaterial({ map: ctex("sky", Object.assign({ w: 2048, h: 512, seed: op.seed || 3 }, op)), side: T.BackSide, fog: false }));
      m.userData.nmat = inkless;
      m.position.y = op.y == null ? -20 : op.y;
      g.add(m);
      return m;
    }
    function car(p) {
      p = Object.assign({ color: "#ef6f5e", top: "#f6f1e6" }, p);
      const g = new T.Group();
      const L = 4.0, Wd = 1.7;
      slab(L, 0.62, Wd, 0.26, p.color, { y: 0.26, parent: g });
      const cab = new T.Shape();
      cab.moveTo(-1.05, 0); cab.lineTo(0.95, 0); cab.lineTo(0.55, 0.56); cab.lineTo(-0.78, 0.56); cab.lineTo(-1.05, 0);
      const cg = new T.ExtrudeGeometry(cab, { depth: Wd - 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
      cg.translate(-0.1, 0, -(Wd - 0.22) / 2);
      const glass = new T.Mesh(cg, mat("#a9dcf7"));
      glass.position.y = 0.88;
      g.add(glass);
      box(1.4, 0.07, Wd - 0.12, p.top, { x: -0.21, y: 1.44, parent: g });
      for (const x of [-1.08, 0.78]) for (const z of [-1, 1]) box(0.08, 0.56, 0.06, p.top, { x: x + (x > 0 ? -0.18 : 0.17), y: 0.88, z: z * (Wd - 0.24) / 2, rz: x > 0 ? 35 : -25, parent: g });
      for (const x of [-1.25, 1.25]) for (const z of [-1, 1]) {
        cyl(0.33, 0.33, 0.24, INK, { x, y: 0.33, z: z * (Wd / 2 - 0.08), rx: 90, center: true, parent: g });
        cyl(0.15, 0.15, 0.26, "#d9dde2", { x, y: 0.33, z: z * (Wd / 2 - 0.06), rx: 90, center: true, parent: g });
      }
      for (const s of [-1, 1]) box(0.14, 0.14, Wd + 0.08, "#d9dde2", { x: s * (L / 2 + 0.02), y: 0.34, parent: g });
      for (const z of [-0.55, 0.55]) sphere(0.11, "#fff3b0", { x: L / 2 + 0.02, y: 0.66, z, mat: { basic: true }, parent: g });
      for (const z of [-0.55, 0.55]) sphere(0.08, "#e0453a", { x: -L / 2 - 0.02, y: 0.66, z, mat: { basic: true }, parent: g });
      return place(g, p);
    }
    function tree(p) {
      p = Object.assign({ leaf: "#4fb35a", trunk: "#8a5a3a", s: 1 }, p);
      const g = new T.Group();
      cyl(0.12, 0.16, 1.4, p.trunk, { parent: g });
      [[0, 1.9, 0, 0.8], [-0.45, 1.6, 0.2, 0.55], [0.45, 1.65, -0.1, 0.6], [0.1, 2.45, 0.05, 0.55]].forEach(([x, y, z, r]) => ico(r, p.leaf, { x, y, z, detail: 1, parent: g }));
      return place(g, p);
    }
    function lamp(p) {
      p = Object.assign({ color: "#2f4858" }, p);
      const g = new T.Group();
      cyl(0.07, 0.1, 3.6, p.color, { parent: g });
      cyl(0.2, 0.1, 0.25, p.color, { y: 3.6, parent: g });
      sphere(0.2, "#fff2c0", { y: 3.95, mat: { basic: true }, parent: g });
      cone(0.24, 0.22, p.color, { y: 4.08, parent: g });
      return place(g, p);
    }
    function trafficLight(p) {
      p = Object.assign({ on: "red" }, p);
      const g = new T.Group();
      cyl(0.07, 0.07, 3.0, "#2f4858", { parent: g });
      slab(0.42, 1.1, 0.34, 0.08, "#f2c230", { y: 2.9, parent: g });
      const L = {};
      [["red", "#ff4a3d", 3.75], ["yellow", "#ffd23d", 3.45], ["green", "#3ddc6a", 3.15]].forEach(([k, c, y]) => {
        L[k] = { on: sphere(0.12, c, { y, z: 0.18, mat: { basic: true }, parent: g }), off: sphere(0.12, "#4a4a52", { y, z: 0.18, parent: g }) };
      });
      g.userData.light = (k) => Object.keys(L).forEach((n) => { L[n].on.visible = n === k; L[n].off.visible = n !== k; });
      g.userData.light(p.on);
      return place(g, p);
    }
    function building(w, h, d, p) {
      p = Object.assign({ wall: "#f2b880", cols: 4, rows: 5, cornice: "#fff4e4" }, p);
      const g = new T.Group();
      const ft = ctex("facade", { a: p.wall, cols: p.cols, rows: p.rows, frame: p.frame, glass: p.glass, lit: p.lit, band: p.band, ground: p.ground, seed: p.seed || 5, w: 512, h: Math.round(512 * h / w) });
      const side = ctex("facade", { a: p.wall, cols: Math.max(1, Math.round(p.cols * d / w)), rows: p.rows, frame: p.frame, glass: p.glass, lit: p.lit, ground: p.ground, seed: (p.seed || 5) + 1, w: 512, h: Math.round(512 * h / d) });
      const flat = mat(p.wall);
      const mats = [mat("#ffffff", { map: side }), mat("#ffffff", { map: side }), flat, flat, mat("#ffffff", { map: ft }), mat("#ffffff", { map: ft })];
      const geo = new T.BoxGeometry(w, h, d);
      geo.translate(0, h / 2, 0);
      g.add(new T.Mesh(geo, mats));
      const cc = Math.min(0.3, w * 0.06);
      box(w + cc, cc, d + cc, p.cornice, { y: h, parent: g });
      if (p.roofc) roof(w + 0.4, p.roofH || 1.4, d + 0.4, p.roofc, { y: h + cc, parent: g });
      return place(g, p);
    }

    // ---- 3D toon cast: sphere head + projected face, capsule body, IK stick limbs, ball hands, hats
    const UP = new T.Vector3(0, 1, 0);
    const v1 = new T.Vector3(), v2 = new T.Vector3(), v3 = new T.Vector3();
    const limbGeo = new T.CylinderGeometry(1, 1, 1, 10);
    const jointGeo = new T.SphereGeometry(1, 12, 8);
    function bone(m, A, B, r) {
      v1.subVectors(B, A);
      const L = Math.max(v1.length(), 1e-4);
      m.position.copy(A).addScaledVector(v1, 0.5);
      m.quaternion.setFromUnitVectors(UP, v1.multiplyScalar(1 / L));
      m.scale.set(r, L, r);
    }
    // two-bone IK: shoulder S, target P, lengths, pole direction -> elbow E (P clamped to reach)
    function ik(S, P, L1, L2, pole, E) {
      v2.subVectors(P, S);
      let d = v2.length();
      const max = (L1 + L2) * 0.998, min = Math.abs(L1 - L2) + 0.01;
      if (d > max) { v2.setLength(max); P.copy(S).add(v2); d = max; }
      if (d < min) { v2.setLength(min); P.copy(S).add(v2); d = min; }
      const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      v2.normalize();
      v3.copy(pole).addScaledVector(v2, -pole.dot(v2));
      if (v3.lengthSq() < 1e-6) v3.set(0, 0, 1).addScaledVector(v2, -v2.z);
      v3.normalize();
      E.copy(S).addScaledVector(v2, L1 * Math.cos(a)).addScaledVector(v3, L1 * Math.sin(a));
    }
    const FACES = ["neutral", "happy", "laugh", "proud", "plead", "worried", "sad", "shock", "smug", "bored", "yawn", "sleep", "sick",
      "determined", "angry", "dread", "confused", "whistle", "tired", "talk"];
    // pose presets: hand targets (character's right = -x) and pole hints; k (0..1) animates gestures
    const POSES = {
      stand: () => ({ R: [-0.3, 0.6, 0.04], L: [0.3, 0.6, 0.04] }),
      arms_up: (k) => ({ R: [-0.42, 1.62 + 0.06 * Math.sin(k * 12), 0.08], L: [0.42, 1.62 + 0.06 * Math.cos(k * 12), 0.08], pole: [0, -1, -0.3] }),
      cheer: (k) => { const s = Math.abs(Math.sin(k * 9)); return { R: [-0.4, 1.3 + 0.35 * s, 0.1], L: [0.4, 1.3 + 0.35 * s, 0.1], pole: [0, -1, -0.2] }; },
      wave: (k) => ({ R: [-0.48 + 0.1 * Math.sin(k * 14), 1.5, 0.12], L: [0.3, 0.6, 0.04], poleR: [-0.4, -1, -0.3] }),
      point: () => ({ R: [-0.66, 1.1, 0.3], L: [0.3, 0.6, 0.04] }),
      pointUp: () => ({ R: [-0.3, 1.75, 0.15], L: [0.3, 0.6, 0.04], poleR: [-1, -0.4, 0] }),
      hold: () => ({ R: [-0.12, 0.9, 0.36], L: [0.12, 0.9, 0.36], pole: [0, -1, -0.4] }),
      holdUp: () => ({ R: [-0.22, 1.25, 0.42], L: [0.22, 1.25, 0.42], pole: [0, -1, -0.2] }),
      shrug: () => ({ R: [-0.5, 1.02, 0.18], L: [0.5, 1.02, 0.18], pole: [0, -1, 0] }),
      hands_head: () => ({ R: [-0.4, 1.58, 0.06], L: [0.4, 1.58, 0.06], pole: [0, -0.4, -1] }),
      facepalm: () => ({ R: [-0.08, 1.5, 0.42], L: [0.3, 0.6, 0.04], poleR: [-1, -1, 0] }),
      think: () => ({ R: [-0.1, 1.2, 0.38], L: [0.14, 0.86, 0.3], poleR: [-1, -1, 0], poleL: [1, -1, 0] }),
      whistle: (k) => ({ R: [-0.06, 1.3, 0.44], L: [0.5, 1.15 + 0.15 * Math.sin(k * 16), 0.3], poleR: [-1, -1, 0] }),
      stop: (k) => ({ R: [-0.25, 1.28, 0.62], L: [0.62 + 0.04 * Math.sin(k * 12), 1.06, 0.1 + 0.18 * Math.sin(k * 12)], poleR: [-0.5, -1, 0] }),
      direct: (k) => { const s = Math.sin(k * 10); return { R: [-0.7, 1.12 + 0.12 * s, 0.15 + 0.2 * s], L: [0.25, 1.25, 0.55], poleL: [1, -1, 0] }; },
      type: (k) => ({ R: [-0.13, 1.1 + 0.03 * Math.abs(Math.sin(k * 40)), 0.5], L: [0.13, 1.1 + 0.03 * Math.abs(Math.cos(k * 40)), 0.5], pole: [0, -1, -0.3] }),
      tuba: () => ({ R: [-0.12, 1.0, 0.4], L: [0.18, 1.18, 0.38], pole: [0, -1, -0.2] }),
      drum: (k) => ({ R: [-0.16, 0.82 + 0.12 * Math.abs(Math.sin(k * 30)), 0.44], L: [0.16, 0.82 + 0.12 * Math.abs(Math.cos(k * 30)), 0.44], pole: [0, -1, -0.2] }),
      sit: () => ({ R: [-0.28, 0.74, 0.3], L: [0.28, 0.74, 0.3], sit: true }),
      sitslump: () => ({ R: [-0.16, 0.62, 0.42], L: [0.16, 0.62, 0.42], sit: true, pole: [0, -1, 0] }),
      present: (k) => ({ R: [-0.66, 1.24 + 0.05 * Math.sin(k * 8), 0.2], L: [0.3, 0.6, 0.04] }),
      presentL: (k) => ({ L: [0.66, 1.24 + 0.05 * Math.sin(k * 8), 0.2], R: [-0.3, 0.6, 0.04] }),
      pointL: () => ({ L: [0.66, 1.1, 0.3], R: [-0.3, 0.6, 0.04] }),
      sign: () => ({ L: [0.42, 1.15, 0.12], R: [-0.3, 0.6, 0.04], poleL: [1, -0.5, -0.5] }),
      bags: () => ({ R: [-0.36, 0.58, 0.06], L: [0.36, 0.58, 0.06] }),
    };
    const actors = [], toons = [];
    function toon(id, p) {
      p = Object.assign({ h: 1.75, outfit: "#3b82f6", skin: "#fdf8f0", hair: "#5a3b2a", hat: null, hatc: "#2a3a6a", face: "neutral", turn: 0 }, p);
      const root = new T.Group(), rig = new T.Group();
      root.add(rig);
      const S0 = p.h / 1.92;
      rig.scale.setScalar(S0);
      const body = new T.Group();
      rig.add(body);
      // body
      const bodyMat = p.pattern ? mat("#ffffff", { map: ctex(p.pattern.kind || "stripes", Object.assign({ w: 256, h: 256, a: p.outfit }, p.pattern)) }) : mat(p.outfit);
      const torso = new T.Mesh(new T.CapsuleGeometry(0.21, 0.26, 10, 28), bodyMat);
      torso.position.y = 0.9;
      body.add(torso);
      if (p.belt) { const bt = new T.Mesh(new T.TorusGeometry(0.205, 0.028, 8, 32), mat(p.belt)); bt.rotation.x = Math.PI / 2; bt.position.y = 0.74; body.add(bt); }
      if (p.tie) { const ti = new T.Mesh(new T.BoxGeometry(0.07, 0.24, 0.03), mat(p.tie)); ti.position.set(0, 1.05, 0.205); ti.rotation.x = -0.12; body.add(ti); }
      if (p.badge) { const bd = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.02, 6), mat(p.badge)); bd.rotation.x = Math.PI / 2; bd.position.set(0.1, 1.04, 0.2); body.add(bd); }
      if (p.scarf) { const sc = new T.Mesh(new T.TorusGeometry(0.16, 0.06, 8, 24), mat(p.scarf)); sc.rotation.x = Math.PI / 2; sc.position.y = 1.18; body.add(sc); }
      if (p.apron) { const ap = new T.Mesh(new T.CylinderGeometry(0.218, 0.228, 0.42, 24, 1, true, -0.9, 1.8), mat(p.apron, { side: T.DoubleSide })); ap.position.y = 0.8; body.add(ap); }
      // head + face + hair
      const head = new T.Group();
      head.position.y = 1.53;
      body.add(head);
      const HR = 0.37;
      const skull = new T.Mesh(new T.SphereGeometry(HR, 40, 28), mat(p.skin));
      head.add(skull);
      head.scale.set(1.07, 0.97, 1.0);
      const fg = new T.SphereGeometry(HR * 1.006, 48, 32, 0, Math.PI, 0, Math.PI);
      const pos = fg.attributes.position, uv = fg.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2 * HR), 0.5 + pos.getY(i) / (2 * HR));
      uv.needsUpdate = true;
      const fkey = p.moustache ? "-m" : "";
      const faceTex = {};
      FACES.forEach((f) => (faceTex[f] = tex(`assets/faces/${f}${fkey}.svg`)));
      const faceMat = new T.MeshToonMaterial({ color: "#ffffff", gradientMap: ramp, map: faceTex[p.face] || faceTex.neutral, alphaTest: 0.5, transparent: false });
      faceMat.polygonOffset = true; faceMat.polygonOffsetFactor = -1; faceMat.polygonOffsetUnits = -2;
      const face = new T.Mesh(fg, faceMat);
      face.userData.nmat = inkless;
      head.add(face);
      if (p.hair && !p.bald) {
        const hg = new T.SphereGeometry(HR * 1.035, 36, 16, 0, Math.PI * 2, 0, Math.PI * (p.hairCut || 0.3));
        const hm = new T.Mesh(hg, mat(p.hair));
        hm.rotation.x = -0.32;
        head.add(hm);
      }
      // hats
      const hat = new T.Group();
      head.add(hat);
      const hc = p.hatc;
      if (p.hat === "peaked") {
        const cr = new T.Mesh(new T.CylinderGeometry(0.43, 0.36, 0.2, 32), mat(hc)); cr.position.y = 0.36; hat.add(cr);
        const bd = new T.Mesh(new T.CylinderGeometry(0.37, 0.37, 0.07, 32), mat(INK)); bd.position.y = 0.27; hat.add(bd);
        const vi = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.03, 32, 1, false, -Math.PI / 2, Math.PI), mat(INK)); vi.position.set(0, 0.24, 0.06); vi.rotation.x = 0.28; hat.add(vi);
        const bg = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.03, 6), mat("#f2c230")); bg.rotation.x = Math.PI / 2; bg.position.set(0, 0.37, 0.4); hat.add(bg);
      } else if (p.hat === "fedora") {
        const br = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 0.035, 36), mat(hc)); br.position.y = 0.27; br.rotation.x = -0.08; hat.add(br);
        const cr = new T.Mesh(new T.CylinderGeometry(0.28, 0.33, 0.28, 28), mat(hc)); cr.position.y = 0.41; hat.add(cr);
        const bd = new T.Mesh(new T.CylinderGeometry(0.335, 0.335, 0.07, 28), mat(p.hatband || INK)); bd.position.y = 0.32; hat.add(bd);
        if (p.press) { const card = new T.Mesh(new T.PlaneGeometry(0.16, 0.08), mat("#ffffff", { map: ctex("sign", { w: 256, h: 128, bg: "#fffbe8", lines: [{ text: "PRESS", size: 64, y: 66 }] }) })); card.position.set(0.12, 0.38, 0.34); card.rotation.y = 0.35; hat.add(card); }
      } else if (p.hat === "bowler") {
        const br = new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 0.035, 36), mat(hc)); br.position.y = 0.27; hat.add(br);
        const cr = new T.Mesh(new T.SphereGeometry(0.33, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(hc)); cr.position.y = 0.28; cr.scale.y = 0.95; hat.add(cr);
      } else if (p.hat === "beanie") {
        const cr = new T.Mesh(new T.SphereGeometry(HR * 1.06, 32, 14, 0, Math.PI * 2, 0, Math.PI * 0.38), mat(hc)); cr.rotation.x = -0.15; hat.add(cr);
        const pm = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), mat(p.hatband || "#ffffff")); pm.position.set(0, 0.4, -0.05); hat.add(pm);
        const rib = new T.Mesh(new T.TorusGeometry(0.33, 0.045, 8, 32), mat(p.hatband || "#ffffff")); rib.rotation.x = Math.PI / 2 - 0.15; rib.position.set(0, 0.2, 0.03); hat.add(rib);
      } else if (p.hat === "cap") {
        const cr = new T.Mesh(new T.SphereGeometry(HR * 1.05, 32, 14, 0, Math.PI * 2, 0, Math.PI * 0.36), mat(hc)); cr.rotation.x = -0.12; hat.add(cr);
        const vi = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.03, 24, 1, false, -Math.PI / 2, Math.PI), mat(p.hatband || hc)); vi.position.set(0, 0.24, 0.3); vi.rotation.x = 0.2; hat.add(vi);
      }
      // limbs
      const inkM = mat(INK), skinM = mat(p.glove || p.skin);
      const mk = (g, m) => { const x = new T.Mesh(g, m); rig.add(x); return x; };
      const seg = { uR: mk(limbGeo, inkM), lR: mk(limbGeo, inkM), uL: mk(limbGeo, inkM), lL: mk(limbGeo, inkM),
        tR: mk(limbGeo, inkM), sR: mk(limbGeo, inkM), tL: mk(limbGeo, inkM), sL: mk(limbGeo, inkM) };
      const jt = { eR: mk(jointGeo, inkM), eL: mk(jointGeo, inkM), kR: mk(jointGeo, inkM), kL: mk(jointGeo, inkM) };
      const hand = { R: mk(jointGeo, skinM), L: mk(jointGeo, skinM) };
      const foot = { R: mk(jointGeo, inkM), L: mk(jointGeo, inkM) };
      Object.values(jt).forEach((j) => j.scale.setScalar(0.03));
      hand.R.scale.setScalar(0.068); hand.L.scale.setScalar(0.068);
      const LA = 0.28, LL = 0.32;
      const held = [];
      const tmpS = new T.Vector3(), tmpP = new T.Vector3(), tmpE = new T.Vector3(), pole = new T.Vector3();
      const a = {
        id, root, rig, body, head, hat, face, faceTex, hand, turn: p.turn, faceCam: p.faceCam !== false, toon: true,
        get mesh() { return root; },
        st: { pose: "stand", k: 0, walk: null, bob: 0, lean: 0, look: 0 },
        set(expr) { const t = faceTex[expr]; if (t && faceMat.map !== t) { faceMat.map = t; } },
        pose(name, k) { this.st.pose = name; this.st.k = k || 0; this.update(); return this; },
        walk(phase, stride) { this.st.walk = phase == null ? null : [phase, stride == null ? 0.22 : stride]; this.update(); return this; },
        hold(obj, side, off) { held.push([obj, side || "R", off || [0, 0, 0]]); rig.add(obj); this.update(); return obj; },
        update() {
          const P = (POSES[this.st.pose] || POSES.stand)(this.st.k);
          const sitting = !!P.sit;
          const w = this.st.walk;
          const bob = (w ? Math.abs(Math.sin(w[0] * Math.PI)) * 0.04 : 0) + this.st.bob;
          body.position.set(0, (sitting ? -0.24 : 0) + bob, sitting ? -0.05 : 0);
          body.rotation.x = this.st.lean;
          head.rotation.set(0, this.st.look, 0);
          body.updateMatrix();
          // legs
          for (const s of ["R", "L"]) {
            const sx = s === "R" ? -1 : 1;
            tmpS.set(sx * 0.09, 0.66, 0).applyMatrix4(body.matrix);
            if (sitting) tmpP.set(sx * 0.13, 0.05, 0.42);
            else if (w) { const ph = w[0] * Math.PI + (s === "R" ? 0 : Math.PI); tmpP.set(sx * 0.11, 0.05 + Math.max(0, Math.sin(ph)) * 0.12, Math.cos(ph) * w[1]); }
            else tmpP.set(sx * 0.12, 0.05, 0.02);
            pole.set(0, 0, 1);
            ik(tmpS, tmpP, LL, LL, pole, tmpE);
            bone(seg["t" + s], tmpS, tmpE, 0.03); bone(seg["s" + s], tmpE, tmpP, 0.03);
            jt["k" + s].position.copy(tmpE);
            foot[s].position.set(tmpP.x, 0.045 + (tmpP.y - 0.05), tmpP.z + 0.05);
            foot[s].scale.set(0.085, 0.05, 0.13);
          }
          // arms
          for (const s of ["R", "L"]) {
            const sx = s === "R" ? -1 : 1;
            tmpS.set(sx * 0.19, 1.06, 0).applyMatrix4(body.matrix);
            const tg = P[s];
            tmpP.set(tg[0], tg[1], tg[2]).applyMatrix4(body.matrix);
            if (w && this.st.pose === "stand") tmpP.z += Math.cos(w[0] * Math.PI + (s === "R" ? Math.PI : 0)) * 0.16;
            const pl = P["pole" + s] || P.pole || [sx * 0.6, -0.5, -1];
            pole.set(pl[0], pl[1], pl[2]).normalize();
            ik(tmpS, tmpP, LA, LA, pole, tmpE);
            bone(seg["u" + s], tmpS, tmpE, 0.028); bone(seg["l" + s], tmpE, tmpP, 0.028);
            jt["e" + s].position.copy(tmpE);
            hand[s].position.copy(tmpP);
          }
          held.forEach(([obj, side, off]) => {
            if (side === "chest") obj.position.set(off[0], 0.95 + off[1], 0.25 + off[2]).applyMatrix4(body.matrix);
            else if (side === "both") obj.position.copy(hand.R.position).add(hand.L.position).multiplyScalar(0.5).add(v1.set(off[0], off[1], off[2]));
            else obj.position.copy(hand[side].position).add(v1.set(off[0], off[1], off[2]));
          });
        },
      };
      place(root, Object.assign({ cast: true, receive: false }, p));
      face.castShadow = false;
      a.set(p.face);
      a.update();
      toons.push(a);
      actors.push(a);
      return a;
    }

    // ---- doodle billboards (v1): yaw-billboards with expression textures and alpha-cut shadows
    function actor(id, srcs, p) {
      p = Object.assign({ h: 1.6, aspect: 400 / 600 }, p);
      const texs = {};
      Object.keys(srcs).forEach((k) => (texs[k] = tex(srcs[k])));
      const first = Object.keys(srcs)[0];
      const w = p.h * p.aspect;
      const geo = new T.PlaneGeometry(w, p.h);
      geo.translate(0, p.h / 2, 0);
      const m = new T.MeshBasicMaterial({ map: texs[first], alphaTest: 0.5, side: T.DoubleSide });
      const mesh = new T.Mesh(geo, m);
      mesh.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: texs[first], alphaTest: 0.5 });
      mesh.userData.nmat = new T.ShaderMaterial({ uniforms: { map: { value: texs[first] }, useMap: { value: 1 } }, vertexShader: NV, fragmentShader: NF, side: T.DoubleSide });
      place(mesh, Object.assign({ cast: true, receive: false }, p));
      const a = {
        id, mesh, texs, lie: !!p.lie,
        set(expr) {
          const t = texs[expr] || texs[first];
          if (m.map !== t) { m.map = t; mesh.customDepthMaterial.map = t; mesh.userData.nmat.uniforms.map.value = t; }
        },
      };
      actors.push(a);
      return a;
    }

    // ---- ink pass + grade (+ optional dissolve from the previous shot)
    const colorRT = new T.WebGLRenderTarget(W, H, { samples: 4, type: T.UnsignedByteType });
    const nd = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    nd.depthTexture = new T.DepthTexture(W, H, T.UnsignedIntType);
    const prevRT = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    const nmat = new T.ShaderMaterial({ uniforms: { map: { value: null }, useMap: { value: 0 } }, vertexShader: NV, fragmentShader: NF });
    const post = new T.ShaderMaterial({
      uniforms: { tC: { value: colorRT.texture }, tN: { value: nd.texture }, tD: { value: nd.depthTexture }, tP: { value: prevRT.texture },
        mixP: { value: 0 }, res: { value: new T.Vector2(W, H) }, near: { value: 0.05 }, far: { value: 500 }, ink: { value: new T.Color(INK) },
        px: { value: LOOK.px }, vig: { value: LOOK.vig }, sat: { value: LOOK.sat }, gam: { value: LOOK.gamma }, lift: { value: LOOK.lift },
        dbg: { value: window.TALE_DEBUG || 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `
        uniform sampler2D tC, tN, tD, tP; uniform vec2 res; uniform float near, far, px, vig, sat, gam, lift, mixP, dbg; uniform vec3 ink; varying vec2 vUv;
        float lin(vec2 uv){ float d = texture2D(tD, uv).x; float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
        vec3 nrm(vec2 uv){ return texture2D(tN, uv).xyz * 2.0 - 1.0; }
        void main(){
          vec2 o = px / res;
          vec3 c = texture2D(tC, vUv).rgb;
          float dc = lin(vUv); vec3 nc = nrm(vUv);
          float e = 0.0;
          for (int i = 0; i < 12; i++) {
            float a = float(i) * 0.5235988;
            vec2 uv = vUv + vec2(cos(a), sin(a)) * o * (i % 2 == 0 ? 1.0 : 0.72);
            float di = lin(uv);
            float dd = abs(di - dc) / max(min(di, dc), 0.001);
            float nn = 1.0 - clamp(dot(nc, nrm(uv)), 0.0, 1.0);
            e = max(e, max(smoothstep(0.035, 0.09, dd), smoothstep(0.18, 0.42, nn)));
          }
          if (dbg > 0.5 && dbg < 1.5) { gl_FragColor = vec4(texture2D(tN, vUv).rgb, 1.0); return; }
          if (dbg > 1.5) { gl_FragColor = vec4(vec3(1.0 - e), 1.0); return; }
          c = mix(c, ink, e * 0.92);
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          c = clamp(mix(vec3(l), c, sat), 0.0, 1.0);
          c = pow(c, vec3(gam));
          c = lift + c * (1.0 - lift);
          vec2 q = vUv - 0.5; c *= 1.0 - vig * dot(q, q) * 2.2;
          if (mixP > 0.0) c = mix(c, texture2D(tP, vUv).rgb, mixP);
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), post);
    quad.frustumCulled = false;
    const qScene = new T.Scene();
    qScene.add(quad);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const tmpV = new T.Vector3();
    // st: { set, also, cam, look, fov, roll, light } · opt: { toPrev: render into the dissolve buffer, mix: 0..1 of it on top }
    function render(st, opt) {
      opt = opt || {};
      Object.keys(sets).forEach((k) => (sets[k].visible = k === st.set || (st.also || []).includes(k)));
      const S = Object.assign({}, sets[st.set].userData, st.light || {});
      scene.background = new T.Color(S.bg);
      scene.fog = S.fog ? new T.Fog(S.fog[0], S.fog[1], S.fog[2]) : null;
      hemi.color.set(S.sky); hemi.groundColor.set(S.ground); hemi.intensity = S.hemiI;
      sun.color.set(S.sun); sun.intensity = S.sunI;
      sun.position.set(S.sunPos[0], S.sunPos[1], S.sunPos[2]);
      sun.target.position.set(S.sunTarget ? S.sunTarget[0] : 0, 0, S.sunTarget ? S.sunTarget[2] : 0);
      const sc = sun.shadow.camera;
      sc.left = sc.bottom = -S.shadow; sc.right = sc.top = S.shadow; sc.near = 0.5; sc.far = 90;
      sc.updateProjectionMatrix();
      post.uniforms.ink.value.set(S.ink);
      camera.fov = st.fov || 50;
      camera.position.set(st.cam[0], st.cam[1], st.cam[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(st.look[0], st.look[1], st.look[2]);
      if (st.roll) camera.rotateZ(st.roll * D2R);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      // characters face the camera around their vertical axis (+ a per-actor turn for a 3/4 view)
      actors.forEach((a) => {
        const m = a.mesh;
        if (a.lie || a.faceCam === false || !m.parent) return;
        m.getWorldPosition(tmpV);
        const yaw = Math.atan2(camera.position.x - tmpV.x, camera.position.z - tmpV.z) + (a.turn || 0) * D2R;
        const parentYaw = m.parent.rotation ? m.parent.rotation.y : 0;
        m.rotation.y = yaw - parentYaw;
      });
      renderer.setRenderTarget(colorRT);
      renderer.render(scene, camera);
      const swaps = [];
      scene.traverse((m) => {
        if (!m.isMesh || !m.visible) return;
        swaps.push([m, m.material]);
        m.material = m.userData.nmat || nmat;
      });
      const bg = scene.background, fog = scene.fog;
      scene.background = new T.Color(0x7f7fff); scene.fog = null;
      renderer.setRenderTarget(nd);
      renderer.render(scene, camera);
      swaps.forEach(([m, mm]) => (m.material = mm));
      scene.background = bg; scene.fog = fog;
      // never sample the buffer being drawn into: WebGL drops that draw (a feedback loop) and the dissolve fades from black
      post.uniforms.tP.value = opt.toPrev ? colorRT.texture : prevRT.texture;
      post.uniforms.mixP.value = opt.toPrev ? 0 : (opt.mix || 0);
      renderer.setRenderTarget(opt.toPrev ? prevRT : null);
      renderer.render(qScene, qCam);
      renderer.setRenderTarget(null);
    }

    return {
      T, scene, camera, renderer, sets, set, box, cyl, cone, sphere, ico, torus, roof, slab, plane, clock, sky, car, tree, lamp,
      trafficLight, building, toon, actor, tex, ctex, mat, render, toons, INK, inkless,
      get ready() { return Promise.all(loads).then(() => new Promise((r) => setTimeout(r, 30))); },
    };
  }

  window.TALE = { create };
})();
