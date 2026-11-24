/* Gold-studio kit — a dark PBR studio for seek-safe HyperFrames reels (three.js r170, no addons).
 *
 *   const K = GOLD.create({ canvas, width: 1080, height: 1920 });
 *   K.set("open")                         -> a THREE.Group under the world root (hidden unless rendered)
 *   K.barrel / flagSphere / coinStack / pawn / ring / safe / tank / label / glow / dots ...  (props)
 *   K.flagTex("alaska" | "alberta")       -> canvas flag textures (drawn here, nothing downloaded)
 *   await K.ready                         -> fonts loaded, label canvases drawn, environment built
 *   K.frame({ set, cam, look, fov, focus, aperture, exposure, bloom, env, glow, ... }, { k, n })   // one sub-sample
 *   K.post(st)                            -> bloom + depth of field + ACES + vignette + grain, to the canvas
 *
 * Look: MeshPhysicalMaterial everywhere, lit by a generated studio environment (PMREM of a black room with soft
 * boxes) and a few lights; a planar floor reflection (the world rendered mirrored, clipped at the floor, blurred)
 * mixed into a near-black floor; HDR scene target with MSAA; bloom from a mip chain of the bright pass; depth of
 * field mixed from a blurred copy by a circle of confusion from the depth buffer; optional motion blur by averaging
 * sub-frames (the player renders the shot n times inside the shutter and calls post() once).
 * Everything is a function of the state given to frame(), so every frame seeks alone.
 */
(function () {
  "use strict";
  const T = window.THREE;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  function rng(seed) {
    let h = (seed >>> 0) ^ 0x9e3779b9;   // murmur3 finaliser, so neighbouring seeds give unrelated streams
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
    let s = (h >>> 0) || 1;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  const FONT_SANS = '"GInter", "Segoe UI", Arial, sans-serif';
  const FONT_BOLD = '"GMont", "Segoe UI Black", "Arial Black", sans-serif';
  const FONT_SERIF = 'Garamond, "GBask", Georgia, serif';

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const base = o.base || "assets/";
    T.ColorManagement.enabled = true;
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true,
      powerPreference: "high-performance", stencil: false });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.autoClear = false;
    const ANISO = renderer.capabilities.getMaxAnisotropy();

    const scene = new T.Scene();
    scene.background = new T.Color(0x000000);
    const world = new T.Group();
    scene.add(world);
    const camera = new T.PerspectiveCamera(35, W / H, 0.1, 120);
    const sets = {};
    const pending = [];      // label draws waiting for fonts
    const dyn = [];          // per-frame hooks (billboards)

    // ------------------------------------------------------------------ fonts
    const fontLoads = [
      ["GInter", "fonts/Inter_opsz-wght_.ttf", { weight: "100 900" }],
      ["GMont", "fonts/Montserrat_wght_.ttf", { weight: "100 900" }],
      ["GBask", "fonts/LibreBaskerville-Italic_wght_.ttf", { style: "italic", weight: "400 700" }],
    ].map(([fam, src, d]) => {
      const f = new FontFace(fam, `url(${base}${src})`, d);
      return f.load().then((ff) => document.fonts.add(ff)).catch(() => null);
    });
    fontLoads.push(document.fonts.load("italic 100px Garamond").catch(() => null));

    // ------------------------------------------------------------------ studio environment (PMREM of a soft-box room)
    function studioEnv(kind) {
      const es = new T.Scene();
      const room = new T.Mesh(new T.SphereGeometry(30, 32, 16), new T.MeshBasicMaterial({ color: 0x010101, side: T.BackSide }));
      es.add(room);
      const box = (w, h, x, y, z, c, k) => {
        const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k), side: T.DoubleSide }));
        m.position.set(x, y, z);
        m.lookAt(0, 0, 0);
        es.add(m);
      };
      // key softbox above-front-left (the round highlight on spheres), strip lights at the sides, a warm card behind
      box(9, 6, -7, 11, 9, 0xffffff, kind === "dim" ? 1.6 : 3.2);
      box(2.2, 16, 14, 4, 2, 0xffffff, 1.4);
      box(2.2, 16, -14, 3, -2, 0xffffff, 0.9);
      box(18, 5, 0, 7, -14, 0xffb35a, kind === "warm" ? 1.2 : 0.3);
      const pm = new T.PMREMGenerator(renderer);
      const tex = pm.fromScene(es, 0.03, 0.1, 100).texture;
      pm.dispose();
      return tex;
    }
    const ENV = { neutral: studioEnv("neutral"), warm: studioEnv("warm"), dim: studioEnv("dim") };
    scene.environment = ENV.neutral;

    // ------------------------------------------------------------------ lights
    const key = new T.SpotLight(0xffffff, 120, 40, 0.55, 0.85, 1.6);
    key.position.set(-3.5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.radius = 6;
    scene.add(key, key.target);
    const warm = new T.PointLight(0xffa640, 0, 30, 1.7);      // the gold glow's light (behind the subject)
    scene.add(warm);
    const rim = new T.DirectionalLight(0xffffff, 0.6);
    rim.position.set(6, 5, -6);
    scene.add(rim);
    const fill = new T.HemisphereLight(0x8a8a9a, 0x000000, 0.15);
    scene.add(fill);

    // ------------------------------------------------------------------ floor with planar reflection
    const reflRT = new T.WebGLRenderTarget(W >> 1, H >> 1, { type: T.HalfFloatType });
    const reflA = new T.WebGLRenderTarget(W >> 2, H >> 2, { type: T.HalfFloatType });
    const reflB = new T.WebGLRenderTarget(W >> 2, H >> 2, { type: T.HalfFloatType });
    const floorMat = new T.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.55, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.12 });
    const floorU = { tRefl: { value: reflA.texture }, uRes: { value: new T.Vector2(W, H) }, uReflK: { value: 0.55 }, uFade: { value: new T.Vector2(16, 34) } };
    floorMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, floorU);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D tRefl; uniform vec2 uRes; uniform float uReflK; uniform vec2 uFade;")
        .replace("#include <opaque_fragment>", `#include <opaque_fragment>
          vec2 ruv = gl_FragCoord.xy / uRes;
          vec3 rc = texture2D(tRefl, ruv).rgb;
          gl_FragColor.rgb += rc * uReflK;
          gl_FragColor.rgb *= 1.0 - smoothstep(uFade.x, uFade.y, length(vViewPosition));`);
    };
    floorMat.customProgramCacheKey = () => "goldfloor";
    const floor = new T.Mesh(new T.PlaneGeometry(160, 160), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const clipFloor = [new T.Plane(new T.Vector3(0, -1, 0), 0.0)];

    // ------------------------------------------------------------------ glow billboards (radial gradients, additive)
    const glowGeo = new T.PlaneGeometry(1, 1);
    const glows = [];
    function glow(p) {
      p = Object.assign({ color: "#a47732", size: 7, x: 0, y: 3, z: -8, k: 1, soft: 1.6, sx: 1, sy: 1 }, p);
      const m = new T.ShaderMaterial({
        uniforms: { col: { value: new T.Color(p.color) }, k: { value: p.k }, soft: { value: p.soft } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform vec3 col; uniform float k, soft; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; float a = pow(clamp(1.0 - r, 0.0, 1.0), soft); gl_FragColor = vec4(col * a * k, 1.0); }",
        transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: true,
      });
      const g = new T.Mesh(glowGeo, m);
      g.scale.set(p.size * p.sx, p.size * p.sy, 1);
      g.position.set(p.x, p.y, p.z);
      g.renderOrder = -5;
      g.userData.noRefl = !!p.noRefl;
      g.userData.face = true;
      (p.parent || world).add(g);
      g.userData.glow = m;
      g.userData.k = p.k;
      g.userData.phase = glows.length * 1.7;
      glows.push(g);
      g.setK = (v) => { g.userData.k = v; m.uniforms.k.value = v; g.visible = v > 0.001; };
      g.setColor = (c) => m.uniforms.col.value.set(c);
      return g;
    }

    // ------------------------------------------------------------------ materials
    function physical(p) {
      const m = new T.MeshPhysicalMaterial(Object.assign({ color: 0x111111, roughness: 0.4, metalness: 0 }, p));
      return m;
    }
    const MAT = {
      gold: () => physical({ color: "#f3c46a", metalness: 1, roughness: 0.26, envMapIntensity: 1.2 }),
      chrome: () => physical({ color: "#d9dce0", metalness: 1, roughness: 0.16, envMapIntensity: 1.3 }),
      steel: () => physical({ color: "#aeb3b8", metalness: 0.95, roughness: 0.34, envMapIntensity: 1.6 }),
      blackGloss: () => physical({ color: "#060606", metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 }),
      blackMatte: () => physical({ color: "#0d0d0e", metalness: 0.35, roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
      white: () => physical({ color: "#ecebe8", metalness: 0, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2, emissive: "#ffffff", emissiveIntensity: 0.05 }),
    };

    // ------------------------------------------------------------------ canvas helpers
    function canvasTex(cv, srgb = true) {
      const t = new T.CanvasTexture(cv);
      t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
      t.anisotropy = ANISO;
      t.generateMipmaps = true;
      t.minFilter = T.LinearMipmapLinearFilter;
      return t;
    }
    function star(g, x, y, r, n = 5, inner = 0.42) {
      g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r * inner : r;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
    }
    // flags are drawn on the front 60 % of an equirectangular canvas (u 0.2..0.8); the back repeats the field colour
    function flagTex(kind) {
      const cv = document.createElement("canvas");
      cv.width = 2048; cv.height = 1024;
      const g = cv.getContext("2d");
      const x0 = 2048 * 0.2, fw = 2048 * 0.6, fh = 1024;
      if (kind === "alaska") {
        g.fillStyle = "#0f2a63"; g.fillRect(0, 0, 2048, 1024);
        g.fillStyle = "#ffbf1f";
        // Big Dipper (handle lower left) + the North Star, gold on dark blue
        const S = [[0.12, 0.80], [0.25, 0.75], [0.36, 0.70], [0.47, 0.63], [0.50, 0.79], [0.66, 0.83], [0.69, 0.62]];
        const fx = (u) => 2048 * 0.3 + u * 2048 * 0.4, fy = (v) => 1024 * (0.3 + v * 0.42);
        S.forEach(([u, v]) => star(g, fx(u), fy(v), 46));
        star(g, fx(0.86), fy(0.08), 68);
      } else if (kind === "alberta") {
        g.fillStyle = "#1c3b9e"; g.fillRect(0, 0, 2048, 1024);
        const cx = x0 + fw / 2, top = 250, sw = 330, sh = 470;
        g.save();
        g.beginPath();
        g.moveTo(cx - sw / 2, top); g.lineTo(cx + sw / 2, top); g.lineTo(cx + sw / 2, top + sh * 0.62);
        g.quadraticCurveTo(cx + sw / 2, top + sh * 0.95, cx, top + sh);
        g.quadraticCurveTo(cx - sw / 2, top + sh * 0.95, cx - sw / 2, top + sh * 0.62);
        g.closePath();
        g.clip();
        g.fillStyle = "#3a7bd5"; g.fillRect(cx - sw, top, sw * 2, sh);                      // sky
        g.fillStyle = "#ffffff"; g.fillRect(cx - sw, top, sw * 2, sh * 0.2);                // chief
        g.fillStyle = "#d62828"; g.fillRect(cx - sw, top + sh * 0.07, sw * 2, sh * 0.06); g.fillRect(cx - 18, top, 36, sh * 0.2);
        g.fillStyle = "#e9eef5";                                                             // snowy mountains
        g.beginPath(); g.moveTo(cx - sw / 2, top + sh * 0.55);
        [[-0.32, 0.30], [-0.16, 0.45], [0.0, 0.27], [0.16, 0.44], [0.32, 0.31], [0.5, 0.5]].forEach(([u, v]) => g.lineTo(cx + u * sw, top + v * sh));
        g.lineTo(cx + sw / 2, top + sh * 0.6); g.closePath(); g.fill();
        g.fillStyle = "#2f8f3a"; g.fillRect(cx - sw, top + sh * 0.55, sw * 2, sh * 0.16);   // hills
        g.fillStyle = "#e7b730"; g.fillRect(cx - sw, top + sh * 0.71, sw * 2, sh * 0.3);    // wheat field
        g.strokeStyle = "#b8871a"; g.lineWidth = 6;
        for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 26, top + sh * 0.73); g.lineTo(cx + i * 30, top + sh); g.stroke(); }
        g.restore();
        g.strokeStyle = "#f2d16b"; g.lineWidth = 10;
        g.beginPath();
        g.moveTo(cx - sw / 2, top); g.lineTo(cx + sw / 2, top); g.lineTo(cx + sw / 2, top + sh * 0.62);
        g.quadraticCurveTo(cx + sw / 2, top + sh * 0.95, cx, top + sh);
        g.quadraticCurveTo(cx - sw / 2, top + sh * 0.95, cx - sw / 2, top + sh * 0.62);
        g.closePath(); g.stroke();
      }
      return canvasTex(cv);
    }

    // text canvas: lines [{ text, font, size, color | "gold" | "silver", weight, italic, track }]
    function drawText(cv, spec) {
      const g = cv.getContext("2d");
      const pad = spec.pad == null ? 0.25 : spec.pad;
      const lines = spec.lines;
      const meas = lines.map((l) => {
        g.font = `${l.italic ? "italic " : ""}${l.weight || 700} ${l.size}px ${l.font || FONT_BOLD}`;
        const tr = (l.track || 0) * l.size;
        const w = g.measureText(l.text).width + tr * Math.max(0, l.text.length - 1);
        return { w, h: l.size * (l.lh || 1.05) };
      });
      const tw = Math.max(...meas.map((m) => m.w)), th = meas.reduce((a, m) => a + m.h, 0);
      const P = Math.round(Math.max(...lines.map((l) => l.size)) * pad);
      cv.width = Math.ceil(tw + P * 2 + 40); cv.height = Math.ceil(th + P * 2);
      cv.dataset.tw = String(tw / cv.width);
      g.clearRect(0, 0, cv.width, cv.height);
      let y = P;
      lines.forEach((l, i) => {
        const m = meas[i];
        g.font = `${l.italic ? "italic " : ""}${l.weight || 700} ${l.size}px ${l.font || FONT_BOLD}`;
        g.textBaseline = "alphabetic";
        if ("letterSpacing" in g) g.letterSpacing = `${(l.track || 0) * l.size}px`;
        const x = (cv.width - m.w) / 2 + (spec.align === "left" ? -(cv.width - m.w) / 2 + P : 0);
        const by = y + m.h * 0.8;
        if (l.color === "gold" || l.color === "silver") {
          const gold = l.color === "gold";
          const ext = Math.max(2, Math.round(l.size * (l.depth == null ? 0.07 : l.depth)));
          for (let k = ext; k >= 1; k--) {                     // fake extrusion: darker copies down and to the right
            g.fillStyle = gold ? `rgb(${70 + k * 2},${44 + k},${12})` : `rgb(${60 + k * 3},${60 + k * 3},${64 + k * 3})`;
            g.fillText(l.text, x + k * 0.35, by + k);
          }
          const gr = g.createLinearGradient(0, by - l.size * 0.78, 0, by + l.size * 0.05);
          if (gold) { gr.addColorStop(0, "#fff1c2"); gr.addColorStop(0.32, "#f6cf72"); gr.addColorStop(0.55, "#b98a35"); gr.addColorStop(0.78, "#e8bb5c"); gr.addColorStop(1, "#8a5f1e"); }
          else { gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.45, "#c9ccd0"); gr.addColorStop(0.6, "#7d8186"); gr.addColorStop(1, "#d6d9dc"); }
          g.fillStyle = gr;
          g.fillText(l.text, x, by);
          g.strokeStyle = gold ? "rgba(255,240,200,0.35)" : "rgba(255,255,255,0.3)"; g.lineWidth = Math.max(1, l.size * 0.012);
          g.strokeText(l.text, x, by - 1);
        } else {
          g.fillStyle = l.color || "#ffffff";
          g.fillText(l.text, x, by);
          if (l.bold) { g.strokeStyle = l.color || "#ffffff"; g.lineWidth = l.size * l.bold; g.lineJoin = "round"; g.strokeText(l.text, x, by); }
        }
        if ((l.color === "gold") && l.bold) { g.strokeStyle = "#e9bd62"; g.lineWidth = l.size * l.bold; g.lineJoin = "round"; g.globalCompositeOperation = "destination-over"; g.strokeText(l.text, x, by); g.globalCompositeOperation = "source-over"; }
        y += m.h;
      });
      return cv;
    }

    // ------------------------------------------------------------------ labels (text planes with a glitch / smear reveal)
    const LV = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
    const LF = `uniform sampler2D map; uniform float gain, opacity, reveal, smear, flash; uniform vec3 tint; varying vec2 vUv;
      void main(){
        float k = clamp(reveal, 0.0, 1.0);
        float s = mix(0.08, 1.0, k);
        vec2 uv = vec2(vUv.x, (vUv.y - 0.5) / s + 0.5);
        if (uv.y < 0.0 || uv.y > 1.0) discard;
        vec4 c = vec4(0.0);
        float sm = smear * (1.0 - k) + 0.0001;
        for (int i = -4; i <= 4; i++) { c += texture2D(map, uv + vec2(float(i) * sm * 0.02, 0.0)); }
        c /= 9.0;
        float g = gain * (1.0 + flash * (1.0 - k) * 3.0);
        gl_FragColor = vec4(c.rgb * tint * g, c.a * opacity);
        if (gl_FragColor.a < 0.003) discard;
      }`;
    function label(spec, p) {
      p = Object.assign({ x: 0, y: 2, z: 0, cap: 0.3, gain: 1, face: true }, p);
      const cv = document.createElement("canvas");
      cv.width = 4; cv.height = 4;
      const tex = canvasTex(cv);
      const mat = new T.ShaderMaterial({
        uniforms: { map: { value: tex }, gain: { value: p.gain }, opacity: { value: 1 }, reveal: { value: 1 }, smear: { value: 1 },
          flash: { value: p.flash == null ? 1 : p.flash }, tint: { value: new T.Color(p.tint || "#ffffff") } },
        vertexShader: LV, fragmentShader: LF, transparent: true, depthWrite: false, side: T.DoubleSide,
      });
      const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.renderOrder = p.order || 10;
      mesh.userData.face = p.face;
      mesh.userData.noRefl = p.noRefl !== false;
      (p.parent || world).add(mesh);
      let cur = null;
      const L = {
        mesh, mat,
        // the plane is p.h world units tall per 100 px of the tallest line, so sizes stay comparable across labels
        draw(sp) {
          const key = JSON.stringify(sp);
          if (key === cur) return;
          cur = key;
          drawText(cv, sp);
          tex.dispose();
          tex.image = cv;
          tex.needsUpdate = true;
          L.big = Math.max(...sp.lines.map((l) => l.size));
          L.fit(L.cap);
        },
        // cap = world height of a capital letter of the biggest line (Montserrat / Inter caps ~ 0.71 em)
        fit(cap) { L.cap = cap; if (!L.big) return; const k = cap / (0.71 * L.big); mesh.scale.set(cv.width * k, cv.height * k, 1); },
        cap: p.cap, big: 0,
        tw() { return mesh.scale.x * Number(cv.dataset.tw || 1); },
        set(text) { const sp = JSON.parse(JSON.stringify(L.spec)); sp.lines[0].text = text; L.draw(sp); },
        spec,
        show(rv, op = 1) { mat.uniforms.reveal.value = rv; mat.uniforms.opacity.value = op; mesh.visible = op > 0.001 && rv > 0.001; },
      };
      pending.push(() => L.draw(spec));
      return L;
    }

    // ------------------------------------------------------------------ props
    const coinGeo = (() => {
      const r = 0.5, h = 0.1, b = 0.022;
      const pts = [[0, -h / 2], [r - b, -h / 2], [r - b * 0.3, -h / 2 + b * 0.3], [r, -h / 2 + b], [r, h / 2 - b], [r - b * 0.3, h / 2 - b * 0.3], [r - b, h / 2],
        [r - 0.07, h / 2], [r - 0.08, h / 2 - 0.008], [0, h / 2 - 0.008]].map(([x, y]) => new T.Vector2(x, y));
      return new T.LatheGeometry(pts, 56);
    })();
    const COIN_H = 0.1;
    // a stack of coins as one instanced mesh; s.n(count) shows the first n, slight wobble per coin
    function coinStack(p) {
      p = Object.assign({ x: 0, y: 0, z: 0, r: 0.42, max: 60, parent: world }, p);
      const mat = p.mat || MAT.gold();
      const m = new T.InstancedMesh(coinGeo, mat, p.max);
      m.castShadow = true; m.receiveShadow = true;
      m.frustumCulled = false;   // instance matrices change every frame; the cached bounding sphere would go stale
      const g = new T.Group();
      g.position.set(p.x, p.y, p.z);
      g.add(m);
      p.parent.add(g);
      const R = rng(p.seed || 11), off = [];
      for (let i = 0; i < p.max; i++) off.push([(R() - 0.5) * 0.03, (R() - 0.5) * 0.03, R() * 6.28]);
      const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(p.r * 2, 1, p.r * 2), P = new T.Vector3(), E = new T.Euler();
      const st = {
        group: g, mesh: m, mat, height: 0,
        // n may be fractional: the top coin drops in from above
        set(n) {
          const full = Math.floor(n), frac = n - full;
          const cnt = Math.min(p.max, full + (frac > 0.001 ? 1 : 0));
          for (let i = 0; i < cnt; i++) {
            const drop = i === full ? (1 - frac) * 0.6 : 0;
            P.set(off[i][0] * p.r * 2, i * COIN_H * 0.98 + COIN_H / 2 + drop, off[i][1] * p.r * 2);
            E.set(0, off[i][2], 0); Q.setFromEuler(E);
            M.compose(P, Q, S);
            m.setMatrixAt(i, M);
          }
          m.count = cnt;
          m.instanceMatrix.needsUpdate = true;
          st.height = n * COIN_H * 0.98;
          return st.height;
        },
      };
      return st;
    }
    // loose coins (pours, flights): instanced; place(i, pos, rotEuler) each frame
    function coinSwarm(p) {
      p = Object.assign({ max: 200, r: 0.22, parent: world }, p);
      const mat = p.mat || MAT.gold();
      const m = new T.InstancedMesh(coinGeo, mat, p.max);
      m.castShadow = true;
      m.frustumCulled = false;
      p.parent.add(m);
      const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(p.r * 2, 1, p.r * 2), P = new T.Vector3(), E = new T.Euler();
      let n = 0;
      return {
        mesh: m, mat,
        begin() { n = 0; },
        put(x, y, z, rx, ry, rz, sc = 1) {
          if (n >= p.max) return;
          P.set(x, y, z); E.set(rx, ry, rz); Q.setFromEuler(E); S.set(p.r * 2 * sc, sc, p.r * 2 * sc);
          M.compose(P, Q, S); m.setMatrixAt(n++, M);
        },
        end() { m.count = n; m.instanceMatrix.needsUpdate = true; m.visible = n > 0; },
      };
    }

    function barrel(p) {
      p = Object.assign({ x: 0, z: 0, r: 0.5, h: 1.3, text: "", parent: world }, p);
      const g = new T.Group();
      g.position.set(p.x, 0, p.z);
      const body = new T.Mesh(new T.CylinderGeometry(p.r, p.r, p.h, 64, 1), MAT.blackMatte());
      body.position.y = p.h / 2;
      body.castShadow = true; body.receiveShadow = true;
      g.add(body);
      const lid = new T.Mesh(new T.CylinderGeometry(p.r * 0.97, p.r * 0.97, 0.02, 64), MAT.blackMatte());
      lid.position.y = p.h - 0.005;
      g.add(lid);
      const rimM = MAT.chrome();
      rimM.roughness = 0.22;
      [0.012, p.h * 0.34, p.h * 0.66, p.h - 0.012].forEach((y) => {
        const t = new T.Mesh(new T.TorusGeometry(p.r * 1.004, 0.014, 10, 96), rimM);
        t.rotation.x = Math.PI / 2;
        t.position.y = y;
        g.add(t);
      });
      // embossed silver name on the front of the drum
      const cv = document.createElement("canvas");
      const tex = canvasTex(cv);
      const lm = new T.MeshPhysicalMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.5, transparent: true, metalness: 0.85, roughness: 0.28, color: 0xffffff, envMapIntensity: 1.6, alphaTest: 0.02 });
      const lab = new T.Mesh(new T.CylinderGeometry(p.r * 1.006, p.r * 1.006, p.h * 0.24, 64, 1, true, -0.8, 1.6), lm);
      lab.position.y = p.h * 0.5;
      lab.rotation.y = 0;
      g.add(lab);
      pending.push(() => {
        drawText(cv, { pad: 0.1, lines: [{ text: p.text, size: 110, color: "silver", weight: 800, font: FONT_BOLD, depth: 0.04, track: 0.02 }] });
        // place the word on a wider strip so it reads at ~55 % of the drum's front width
        const c2 = document.createElement("canvas");
        c2.width = 1024; c2.height = 256;
        const g2 = c2.getContext("2d");
        const sc = Math.min(1024 * 0.74 / cv.width, 256 * 0.9 / cv.height);
        g2.drawImage(cv, (1024 - cv.width * sc) / 2, (256 - cv.height * sc) / 2, cv.width * sc, cv.height * sc);
        tex.image = c2; tex.needsUpdate = true;
      });
      p.parent.add(g);
      g.userData.h = p.h;
      return g;
    }

    function flagSphere(p) {
      p = Object.assign({ r: 0.56, flag: "alaska", parent: world }, p);
      const mat = physical({ color: "#ffffff", map: flagTex(p.flag), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.25 });
      const m = new T.Mesh(new T.SphereGeometry(p.r, 64, 48), mat);
      m.castShadow = true;
      const g = new T.Group();
      m.rotation.y = -Math.PI / 2;     // the flag's centre (u = 0.5) faces +z
      g.add(m);
      p.parent.add(g);
      g.userData.r = p.r;
      return g;
    }

    const pawnGeo = (() => {
      const pts = [[0, 0], [0.3, 0], [0.31, 0.03], [0.28, 0.06], [0.3, 0.16], [0.29, 0.28], [0.23, 0.39], [0.13, 0.46], [0.11, 0.5],
        [0.14, 0.53], [0.17, 0.6], [0.175, 0.68], [0.15, 0.76], [0.09, 0.81], [0, 0.83]].map(([x, y]) => new T.Vector2(x, y));
      return new T.LatheGeometry(pts, 48);
    })();
    function pawn(p) {
      p = Object.assign({ x: 0, z: 0, s: 1, parent: world }, p);
      const mat = MAT.blackGloss();
      const m = new T.Mesh(pawnGeo, mat);
      m.castShadow = true; m.receiveShadow = true;
      m.position.set(p.x, 0, p.z);
      m.scale.setScalar(p.s);
      p.parent.add(m);
      const black = new T.Color("#060606"), gold = new T.Color("#f3c46a");
      m.userData.gild = (k) => {    // 0 = glossy black, 1 = polished gold
        mat.color.copy(black).lerp(gold, k);
        mat.metalness = k;
        mat.roughness = lerp(0.18, 0.24, k);
        mat.clearcoat = 1 - k;
      };
      return m;
    }

    // ring gauge: chrome ring + dark track + a yellow arc (regenerated per value, cached)
    function ring(p) {
      p = Object.assign({ R: 1, parent: world }, p);
      const g = new T.Group();
      const chrome = new T.Mesh(new T.TorusGeometry(p.R, 0.028, 16, 160), MAT.chrome());
      g.add(chrome);
      const trackM = physical({ color: "#9a9a9f", metalness: 1, roughness: 0.32 });
      const track = new T.Mesh(new T.TorusGeometry(p.R * 0.885, 0.075, 12, 160), trackM);
      g.add(track);
      const arcM = new T.MeshBasicMaterial({ color: new T.Color("#ecbb1c").multiplyScalar(1.3) });
      const arc = new T.Mesh(new T.TorusGeometry(p.R * 0.885, 0.06, 12, 160, 0.001), arcM);
      g.add(arc);
      let curA = -1;
      g.userData.setArc = (frac) => {
        const a = Math.round(clamp(frac, 0, 1) * 1000) / 1000;
        if (a === curA) return;
        curA = a;
        arc.geometry.dispose();
        arc.geometry = new T.TorusGeometry(p.R * 0.885, 0.088, 12, 200, Math.max(0.001, a * Math.PI * 2));
        arc.rotation.z = -Math.PI / 2;     // start at 12 o'clock
        arc.scale.x = -1;                  // run clockwise
        arc.visible = a > 0.001;
      };
      g.userData.track = track;
      p.parent.add(g);
      return g;
    }

    function roundedBox(w, h, d, r) {
      const s = new T.Shape();
      const x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r;
      s.moveTo(x, y); s.lineTo(x + ww, y); s.lineTo(x + ww, y + hh); s.lineTo(x, y + hh); s.lineTo(x, y);
      const geo = new T.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 4, curveSegments: 4 });
      geo.translate(0, 0, -(d - 2 * r) / 2);
      geo.computeVertexNormals();
      return geo;
    }

    // safe: open-fronted steel box with a door hinged on its left edge, dial + bolts on the door
    function safe(p) {
      p = Object.assign({ s: 2.2, parent: world }, p);
      const s = p.s, th = 0.12;
      const g = new T.Group();
      const steel = MAT.steel();
      const add = (geo, x, y, z) => { const m = new T.Mesh(geo, steel); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
      add(roundedBox(s, s, th, 0.03), 0, s / 2, -s / 2 + th / 2);
      add(roundedBox(th, s, s, 0.03), -s / 2 + th / 2, s / 2, 0);
      add(roundedBox(th, s, s, 0.03), s / 2 - th / 2, s / 2, 0);
      add(roundedBox(s, th, s, 0.03), 0, s - th / 2, 0);
      add(roundedBox(s, th, s, 0.03), 0, th / 2, 0);
      const inner = new T.Mesh(new T.BoxGeometry(s - 2 * th, s - 2 * th, s - th), physical({ color: "#151515", roughness: 0.8, side: T.BackSide }));
      inner.position.set(0, s / 2, th / 2);
      g.add(inner);
      const hinge = new T.Group();
      hinge.position.set(-s / 2, s / 2, s / 2);
      g.add(hinge);
      const door = new T.Mesh(roundedBox(s, s, 0.16, 0.05), physical({ color: "#c4c8cd", metalness: 0.95, roughness: 0.36, envMapIntensity: 1.8 }));
      door.position.set(s / 2, 0, 0.08);
      door.castShadow = true;
      hinge.add(door);
      const front = new T.Group();
      front.position.set(s / 2, 0, 0.17);
      hinge.add(front);
      const chrome = MAT.chrome();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const b = new T.Mesh(new T.SphereGeometry(0.035, 16, 10), chrome);
        b.position.set(Math.cos(a) * s * 0.33, Math.sin(a) * s * 0.33, 0);
        front.add(b);
      }
      const dial = new T.Group();
      front.add(dial);
      const hub = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.08, 32), chrome);
      hub.rotation.x = Math.PI / 2;
      dial.add(hub);
      const dk = physical({ color: "#151515", metalness: 0.8, roughness: 0.3 });
      for (let i = 0; i < 4; i++) {
        const sp = new T.Mesh(new T.BoxGeometry(0.7, 0.06, 0.05), dk);
        sp.rotation.z = (i * Math.PI) / 4;
        sp.position.z = 0.02;
        dial.add(sp);
      }
      g.userData.hinge = hinge;
      g.userData.dial = dial;
      g.userData.size = s;
      p.parent.add(g);
      return g;
    }

    // a white LNG / storage tank with a dome
    function tank(p) {
      p = Object.assign({ r: 0.8, h: 1.2, parent: world }, p);
      const pts = [];
      pts.push(new T.Vector2(0, 0), new T.Vector2(p.r, 0), new T.Vector2(p.r, p.h));
      for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push(new T.Vector2(Math.cos(a) * p.r, p.h + Math.sin(a) * p.r * 0.75)); }
      const m = new T.Mesh(new T.LatheGeometry(pts, 64), MAT.white());
      m.castShadow = m.receiveShadow = true;
      const g = new T.Group();
      g.add(m);
      const bandM = physical({ color: "#c8c8c6", roughness: 0.4 });
      [0.25, 0.5, 0.75].forEach((f) => {
        const b = new T.Mesh(new T.TorusGeometry(p.r * 1.003, 0.008, 6, 96), bandM);
        b.rotation.x = Math.PI / 2; b.position.y = p.h * f; g.add(b);
      });
      p.parent.add(g);
      return g;
    }

    function box(w, h, d, mat, p) {
      p = p || {};
      const m = new T.Mesh(p.round ? roundedBox(w, h, d, p.round) : new T.BoxGeometry(w, h, d), mat);
      m.position.set(p.x || 0, p.y || 0, p.z || 0);
      m.castShadow = m.receiveShadow = true;
      (p.parent || world).add(m);
      return m;
    }
    function cyl(r, h, mat, p) {
      p = p || {};
      const m = new T.Mesh(new T.CylinderGeometry(p.rt == null ? r : p.rt, r, h, p.seg || 32), mat);
      m.position.set(p.x || 0, (p.y || 0) + h / 2, p.z || 0);
      m.castShadow = m.receiveShadow = true;
      (p.parent || world).add(m);
      return m;
    }
    function sphere(r, mat, p) {
      p = p || {};
      const m = new T.Mesh(new T.SphereGeometry(r, 32, 20), mat);
      m.position.set(p.x || 0, p.y || 0, p.z || 0);
      (p.parent || world).add(m);
      return m;
    }
    // icon tile: dark rounded metal block with a white glyph on its face
    function iconTile(kind, p) {
      p = Object.assign({ s: 0.9, parent: world }, p);
      const g = new T.Group();
      const b = new T.Mesh(roundedBox(p.s, p.s, p.s * 0.45, p.s * 0.1), physical({ color: "#3c3c40", metalness: 0.9, roughness: 0.3, envMapIntensity: 2.0 }));
      b.castShadow = true;
      g.add(b);
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      const c = cv.getContext("2d");
      c.fillStyle = "#ffffff"; c.strokeStyle = "#ffffff"; c.lineJoin = "round"; c.lineCap = "round";
      if (kind === "dividend") {          // a person + a coin
        c.beginPath(); c.arc(100, 82, 30, 0, 7); c.fill();
        c.beginPath(); c.moveTo(48, 196); c.quadraticCurveTo(52, 124, 100, 124); c.quadraticCurveTo(148, 124, 152, 196); c.closePath(); c.fill();
        c.beginPath(); c.arc(176, 168, 38, 0, 7); c.fill();
        c.fillStyle = "#1a1a1c"; c.font = `800 52px ${FONT_BOLD}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 176, 171);
      } else if (kind === "school") {     // a house with a flag
        c.beginPath(); c.moveTo(128, 50); c.lineTo(214, 120); c.lineTo(42, 120); c.closePath(); c.fill();
        c.fillRect(60, 118, 136, 86);
        c.fillStyle = "#1a1a1c"; c.fillRect(112, 150, 32, 54);
      } else if (kind === "road") {
        c.beginPath(); c.moveTo(100, 40); c.lineTo(156, 40); c.lineTo(214, 214); c.lineTo(42, 214); c.closePath(); c.fill();
        c.fillStyle = "#1a1a1c";
        [[60, 26], [106, 32], [160, 40]].forEach(([y, h]) => { const w = 6 + y * 0.06; c.fillRect(128 - w / 2, y, w, h); });
      } else if (kind === "cross") {
        c.fillRect(104, 48, 48, 160); c.fillRect(48, 104, 160, 48);
      }
      const t = canvasTex(cv);
      const face = new T.Mesh(new T.PlaneGeometry(p.s * 0.74, p.s * 0.74), new T.MeshBasicMaterial({ map: t, transparent: true, color: new T.Color(1.6, 1.6, 1.6) }));
      face.position.z = p.s * 0.226;
      g.add(face);
      p.parent.add(g);
      return g;
    }

    // dots (instanced short cylinders standing up from the floor plane) — map grids and the 10x10 coin grid
    function dots(list, p) {
      p = Object.assign({ r: 0.03, h: 0.02, parent: world }, p);
      const geo = new T.CylinderGeometry(p.r, p.r, p.h, p.seg || 10);
      const mat = p.mat || physical({ color: "#ffffff", roughness: 0.4, metalness: 0.2 });
      const m = new T.InstancedMesh(geo, mat, list.length);
      const M = new T.Matrix4(), c = new T.Color();
      list.forEach((d, i) => {
        M.makeTranslation(d[0], p.h / 2, d[1]);
        m.setMatrixAt(i, M);
        m.setColorAt(i, c.set(d[2] || "#ffffff"));
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      p.parent.add(m);
      return m;
    }

    function set(name, opts) {
      const g = new T.Group();
      g.name = name;
      g.visible = false;
      g.userData = Object.assign({ env: "neutral" }, opts || {});
      world.add(g);
      sets[name] = g;
      return g;
    }

    // ------------------------------------------------------------------ post-processing
    const sceneRT = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
    sceneRT.depthTexture = new T.DepthTexture(W, H);
    const accRT = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType });
    const accDepth = sceneRT;    // depth for DOF comes from the last sub-sample
    const qGeo = new T.PlaneGeometry(2, 2);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const qScene = new T.Scene();
    const quad = new T.Mesh(qGeo, null);
    quad.frustumCulled = false;
    qScene.add(quad);
    const QV = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    function pass(mat, target) {
      quad.material = mat;
      renderer.setRenderTarget(target);
      renderer.render(qScene, qCam);
    }
    const copyM = new T.ShaderMaterial({ uniforms: { t: { value: null }, k: { value: 1 } }, vertexShader: QV,
      fragmentShader: "uniform sampler2D t; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb * k, 1.0); }",
      depthTest: false, depthWrite: false });
    const addM = copyM.clone();
    addM.blending = T.AdditiveBlending; addM.transparent = true;
    const blurM = new T.ShaderMaterial({ uniforms: { t: { value: null }, dir: { value: new T.Vector2() } }, vertexShader: QV,
      fragmentShader: `uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(t, vUv).rgb * 0.2270;
          c += (texture2D(t, vUv + dir * 1.3846).rgb + texture2D(t, vUv - dir * 1.3846).rgb) * 0.3162;
          c += (texture2D(t, vUv + dir * 3.2308).rgb + texture2D(t, vUv - dir * 3.2308).rgb) * 0.0703;
          gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false });
    const brightM = new T.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: 0.9 }, texel: { value: new T.Vector2(1 / W, 1 / H) } }, vertexShader: QV,
      fragmentShader: `uniform sampler2D t; uniform float th; uniform vec2 texel; varying vec2 vUv;
        void main(){ vec3 c = (texture2D(t, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(t, vUv + texel * vec2(1.0, -1.0)).rgb
          + texture2D(t, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(t, vUv + texel * vec2(1.0, 1.0)).rgb) * 0.25;
          float l = max(c.r, max(c.g, c.b)); float k = max(l - th, 0.0) / max(l, 1e-4);
          gl_FragColor = vec4(min(c * k, vec3(40.0)), 1.0); }`, depthTest: false, depthWrite: false });
    const LV_N = 6;
    const bloomA = [], bloomB = [];
    for (let i = 0; i < LV_N; i++) {
      const w = Math.max(2, W >> (i + 1)), h = Math.max(2, H >> (i + 1));
      bloomA.push(new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType }));
      bloomB.push(new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType }));
    }
    const dofA = new T.WebGLRenderTarget(W >> 1, H >> 1, { type: T.HalfFloatType });
    const dofB = new T.WebGLRenderTarget(W >> 1, H >> 1, { type: T.HalfFloatType });
    const dofC = new T.WebGLRenderTarget(W >> 2, H >> 2, { type: T.HalfFloatType });
    const dofD = new T.WebGLRenderTarget(W >> 2, H >> 2, { type: T.HalfFloatType });
    const finalM = new T.ShaderMaterial({
      uniforms: {
        tC: { value: null }, tD: { value: sceneRT.depthTexture }, tDof: { value: dofA.texture }, tDof2: { value: dofC.texture },
        tB0: { value: bloomA[0].texture }, tB1: { value: bloomA[1].texture }, tB2: { value: bloomA[2].texture },
        tB3: { value: bloomA[3].texture }, tB4: { value: bloomA[4].texture }, tB5: { value: bloomA[5].texture },
        near: { value: 0.1 }, far: { value: 120 }, focus: { value: 8 }, aperture: { value: 0.0 }, bloom: { value: 0.6 },
        exposure: { value: 1 }, vig: { value: 0.35 }, grain: { value: 0.018 }, seed: { value: 0 }, res: { value: new T.Vector2(W, H) },
        fade: { value: 0 }, lift: { value: 0.0 }, sat: { value: 0.82 },
      },
      vertexShader: QV,
      fragmentShader: `uniform sampler2D tC, tD, tDof, tDof2, tB0, tB1, tB2, tB3, tB4, tB5;
        uniform float near, far, focus, aperture, bloom, exposure, vig, grain, seed, fade, lift, sat; uniform vec2 res; varying vec2 vUv;
        float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
        vec3 aces(vec3 x){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
        float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423) + seed); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
        vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        void main(){
          vec3 c = texture2D(tC, vUv).rgb;
          float z = lin(texture2D(tD, vUv).x);
          float coc = clamp(abs(1.0 / focus - 1.0 / z) * aperture, 0.0, 1.0);
          vec3 b1 = texture2D(tDof, vUv).rgb, b2 = texture2D(tDof2, vUv).rgb;
          c = mix(c, b1, smoothstep(0.0, 0.45, coc));
          c = mix(c, b2, smoothstep(0.45, 1.0, coc));
          vec3 bl = texture2D(tB0, vUv).rgb * 0.30 + texture2D(tB1, vUv).rgb * 0.26 + texture2D(tB2, vUv).rgb * 0.2
                  + texture2D(tB3, vUv).rgb * 0.14 + texture2D(tB4, vUv).rgb * 0.1 + texture2D(tB5, vUv).rgb * 0.08;
          c += bl * bloom;
          c *= exposure;
          c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, sat);
          c = aces(c);
          vec2 q = vUv - 0.5; q.x *= res.x / res.y;
          c *= 1.0 - vig * smoothstep(0.25, 0.95, length(q) * 1.15);
          c = srgb(c);
          c += (hash(vUv * res) - 0.5) * grain;
          c = c * (1.0 - fade) + lift;
          gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });

    // ------------------------------------------------------------------ frame
    const tmpV = new T.Vector3();
    let lastSet = null;
    function applyState(st) {
      Object.keys(sets).forEach((k) => (sets[k].visible = k === st.set || (st.also || []).includes(k)));
      const S = Object.assign({}, sets[st.set].userData, st);
      scene.environment = ENV[S.env] || ENV.neutral;
      scene.environmentIntensity = S.envI == null ? 1 : S.envI;
      floor.visible = S.floor !== false;
      floorU.uReflK.value = S.refl == null ? 0.55 : S.refl;
      floorMat.color.set(S.floorColor || "#050505");
      floorU.uFade.value.set(...(S.floorFade || [16, 34]));
      key.intensity = S.keyI == null ? 120 : S.keyI;
      if (S.keyPos) key.position.set(S.keyPos[0], S.keyPos[1], S.keyPos[2]);
      key.target.position.set(...(S.keyTarget || [0, 0.8, 0]));
      warm.intensity = S.warmI || 0;
      warm.color.set(S.warmColor || "#ffa640");
      if (S.warmPos) warm.position.set(S.warmPos[0], S.warmPos[1], S.warmPos[2]);
      rim.intensity = S.rimI == null ? 0.6 : S.rimI;
      fill.intensity = S.fillI == null ? 0.15 : S.fillI;
      camera.fov = S.fov || 35;
      camera.position.set(S.cam[0], S.cam[1], S.cam[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(S.look[0], S.look[1], S.look[2]);
      if (S.roll) camera.rotateZ(S.roll * Math.PI / 180);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      if (S.after) S.after(camera);
      const br = S.breath == null ? 0.1 : S.breath;
      glows.forEach((g) => { g.userData.glow.uniforms.k.value = g.userData.k * (1 + br * Math.sin((S.t || 0) * 2.6 + g.userData.phase)); });
      // billboards: glows and labels face the camera (yaw + pitch), unless face === false
      world.traverse((m) => {
        if (!m.userData.face || !m.parent) return;
        m.parent.updateMatrixWorld();
        m.quaternion.copy(camera.quaternion);
        if (m.parent !== world && m.parent.quaternion) {
          const pq = new T.Quaternion();
          m.parent.getWorldQuaternion(pq);
          m.quaternion.premultiply(pq.invert());
        }
      });
      return S;
    }

    function renderScene(S) {
      // 1) mirrored world into the reflection target (clipped at the floor), then blur it
      if (floor.visible && floorU.uReflK.value > 0) {
        const hidden = [];
        world.traverse((m) => { if (m.userData.noRefl && m.visible) { m.visible = false; hidden.push(m); } });
        floor.visible = false;
        world.scale.y = -1;
        world.updateMatrixWorld(true);
        renderer.clippingPlanes = clipFloor;
        renderer.setRenderTarget(reflRT);
        renderer.setClearColor(0x000000, 1);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.clippingPlanes = [];
        world.scale.y = 1;
        world.updateMatrixWorld(true);
        floor.visible = true;
        hidden.forEach((m) => (m.visible = true));
        const rb = S.reflBlur == null ? 1.6 : S.reflBlur;
        blurM.uniforms.t.value = reflRT.texture; blurM.uniforms.dir.value.set(rb / (W >> 1), 0); pass(blurM, reflB);
        blurM.uniforms.t.value = reflB.texture; blurM.uniforms.dir.value.set(0, rb * 1.6 / (H >> 2)); pass(blurM, reflA);
        blurM.uniforms.t.value = reflA.texture; blurM.uniforms.dir.value.set(rb / (W >> 2), 0); pass(blurM, reflB);
        blurM.uniforms.t.value = reflB.texture; blurM.uniforms.dir.value.set(0, rb * 2.4 / (H >> 2)); pass(blurM, reflA);
      }
      // 2) the scene in HDR
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(new T.Color(S.bg || "#000000"), 1);
      renderer.clear();
      renderer.render(scene, camera);
    }

    // st: shot state; acc: { k, n } for motion-blur sub-samples (k = 0..n-1)
    function frame(st, acc) {
      dyn.forEach((f) => f(st));
      const S = applyState(st);
      renderScene(S);
      const n = acc ? acc.n : 1, k = acc ? acc.k : 0;
      if (n > 1) {
        if (k === 0) { renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 1); renderer.clear(); }
        addM.uniforms.t.value = sceneRT.texture; addM.uniforms.k.value = 1 / n;
        pass(addM, accRT);
      }
      return S;
    }

    function post(st, n) {
      const S = Object.assign({}, sets[st.set].userData, st);
      const src = n > 1 ? accRT.texture : sceneRT.texture;
      // bloom chain
      brightM.uniforms.t.value = src; brightM.uniforms.th.value = S.bloomTh == null ? 0.9 : S.bloomTh;
      pass(brightM, bloomA[0]);
      for (let i = 0; i < LV_N; i++) {
        if (i > 0) { copyM.uniforms.t.value = bloomA[i - 1].texture; copyM.uniforms.k.value = 1; pass(copyM, bloomA[i]); }
        const w = bloomA[i].width, h = bloomA[i].height;
        blurM.uniforms.t.value = bloomA[i].texture; blurM.uniforms.dir.value.set(1 / w, 0); pass(blurM, bloomB[i]);
        blurM.uniforms.t.value = bloomB[i].texture; blurM.uniforms.dir.value.set(0, 1 / h); pass(blurM, bloomA[i]);
      }
      // depth-of-field blur sources
      const ap = S.aperture == null ? 0.6 : S.aperture;
      if (ap > 0) {
        copyM.uniforms.t.value = src; copyM.uniforms.k.value = 1; pass(copyM, dofA);
        blurM.uniforms.t.value = dofA.texture; blurM.uniforms.dir.value.set(1.4 / (W >> 1), 0); pass(blurM, dofB);
        blurM.uniforms.t.value = dofB.texture; blurM.uniforms.dir.value.set(0, 1.4 / (H >> 1)); pass(blurM, dofA);
        copyM.uniforms.t.value = dofA.texture; pass(copyM, dofC);
        blurM.uniforms.t.value = dofC.texture; blurM.uniforms.dir.value.set(2.2 / (W >> 2), 0); pass(blurM, dofD);
        blurM.uniforms.t.value = dofD.texture; blurM.uniforms.dir.value.set(0, 2.2 / (H >> 2)); pass(blurM, dofC);
      }
      const U = finalM.uniforms;
      U.tC.value = src;
      U.near.value = camera.near; U.far.value = camera.far;
      U.focus.value = S.focus || 8; U.aperture.value = ap;
      U.bloom.value = S.bloom == null ? 0.55 : S.bloom;
      U.exposure.value = (S.exposure == null ? 1 : S.exposure) * (S.grade == null ? 0.74 : S.grade);
      U.sat.value = S.sat == null ? 0.82 : S.sat;
      U.vig.value = S.vig == null ? 0.35 : S.vig;
      U.grain.value = S.grain == null ? 0.016 : S.grain;
      U.seed.value = ((S.t || 0) * 30) % 97;
      U.fade.value = S.fade || 0;
      pass(finalM, null);
      renderer.setRenderTarget(null);
    }

    // put an object at screen position (sx, sy in 0..1, y down) at distance d from the camera; returns world units per screen height
    const _v = new T.Vector3();
    function atScreen(obj, sx, sy, d) {
      _v.set(sx * 2 - 1, 1 - sy * 2, 0.5).unproject(camera).sub(camera.position).normalize();
      const fwd = new T.Vector3(); camera.getWorldDirection(fwd);
      const dist = d / Math.max(0.05, _v.dot(fwd));
      obj.position.copy(camera.position).addScaledVector(_v, dist);
      if (obj.parent && obj.parent !== scene) obj.parent.worldToLocal(obj.position);
      return 2 * d * Math.tan((camera.fov * Math.PI) / 360);
    }

    const ready = Promise.all(fontLoads).then(() => { pending.forEach((f) => f()); pending.length = 0; return new Promise((r) => setTimeout(r, 30)); });

    return {
      T, W, H, scene, world, camera, renderer, sets, set, MAT, physical, glow, label, coinStack, coinSwarm, barrel, flagSphere, flagTex,
      pawn, ring, safe, tank, box, cyl, sphere, iconTile, dots, roundedBox, drawText, canvasTex, frame, post, dyn, ready, rng, COIN_H,
      FONT_SANS, FONT_BOLD, FONT_SERIF, key, warm, atScreen,
    };
  }

  window.GOLD = { create };
})();
