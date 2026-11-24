/* Survival-scenario kit v1 — a moonlit fire-lookout diorama in physically lit three.js (r170), seek-safe for HyperFrames.
 *
 *   const K = SURVIVAL.create({ canvas, width: 1080, height: 1920 });
 *   const Wd = K.world();     // sky dome + moon + stars, 3-patch terrain, instanced swaying forest, valley fog layers,
 *                             // road with switchbacks, headlight convoy, the town (lights, fire glow, smoke), red eyes
 *   const Tw = K.tower();     // 30 m steel lookout: legs, girts, X-braces, ladder (+ retractable bottom section),
 *                             // catwalk, cab with glass, roof, rain barrel, solar panel; the furnished interior
 *   const hz = K.hazel();     // posable figurine: hz.set({ pos, ry, pose, pose2, k, head:[yaw,pitch], blink, tool })
 *   await K.ready;
 *   K.render({ t, cam, look, fov, focus, aperture, exposure, tint:[r,g,b,amt], rays, eyesK, carsK, fogK, lampI, … });
 *
 * Realism layer: ACES filmic tone map, PCF-soft moon shadows (window mullions on the cab floor), a warm shadowed lamp,
 * exponential distance fog, drifting moonlit valley-fog layers, screen-space light shafts (radial blur of the bright
 * pass toward the moon or any 3D point), a half-res scatter-as-gather bokeh depth of field, bloom, colour washes,
 * vignette, chromatic fringe and seeded film grain. Every frame is a pure function of the state given to render().
 *
 * v2.1 (additive; every default is the v2 value, so the Fire Tower renders unchanged):
 *   create({ moonDir:[x,y,z], moonCol, bg, fogCol, hemi:[sky, ground], shadow:{half, far, dist, center:[x,y,z]},
 *            sky:{zen:[r,g,b], hor:[r,g,b]}, env:{zen, hor, mside, gnd}, envScene(es, T) })  // other worlds, other skies
 *   K.onRender(fn(st, t, camera))   per-frame hook for world modules (survival-vault.js, survival-ice.js …)
 *   K.buildSky()                     the night dome + moon + stars without the fire-tower world
 *   render(st) also reads st.moonK (moon disc + glow; 0 hides it), st.glowDir:[x,y,z], st.glowCol, st.shadowAt:[x,y,z]
 *   hz.set() also takes br (breath offset, default sin(1.6 t)·0.004) and tool2 (a second, left-hand tool)
 *   K.hazel({ jacket, jacketSheen, trim, trimSheen, seam, pants, pantsSheen, boot, under, hair, hairStreaks:[a,b,c],
 *            hairSheen, brow, tie, lip, pony:{y,z}|false, chestPocket, handPockets })   // re-dress the rig
 *     → also returns { spine, neck, hips, legs, face, pony, surf, frontZ, fz, mats, tool(name, obj, hand) } so a
 *       module can add props (badge, chest radio, hat, goggles, hood) and register hand tools for set({ tool, tool2 }).
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  function hash2(x, y, seed) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), u), lerp(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), u), v);
  }
  function fbm(x, y, seed, oct) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; } return s / n; }

  // ------------------------------------------------------------------ terrain height (metres; tower base = 0)
  // ridge crest through the tower along x, a deep valley to the north (-z) with the town on its floor, a softer valley
  // to the south, far ranges rising beyond |z| 3 km, fbm ruggedness, a flat clearing (r < 14 m) at the tower
  // distance from the valley axis that runs from below the tower north to the town and on into the basin
  function valleyD(x, z) {
    const ax = [[0, -250], [-180, -1300], [-500, -2700], [-760, -6200]];
    let d = 1e9;
    for (let i = 0; i < ax.length - 1; i++) {
      const [x0, z0] = ax[i], [x1, z1] = ax[i + 1], dx = x1 - x0, dz = z1 - z0;
      const u = clamp(((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz), 0, 1);
      d = Math.min(d, Math.hypot(x - x0 - dx * u, z - z0 - dz * u));
    }
    return d;
  }
  function terrainH(x, z) {
    const r = Math.hypot(x, z);
    const n1 = fbm(x / 900 + 3.1, z / 900 - 1.7, 11, 5), n2 = fbm(x / 170, z / 170, 23, 4);
    const rid = 1 - Math.abs(fbm(x / 1500 + 7, z / 1500 + 2, 41, 4) * 2 - 1); // ridged noise: 1 on the crests
    let h = -240 * (1 - Math.exp(-r / 560));                                 // the summit falls away all round
    h -= 330 * Math.exp(-Math.pow(valleyD(x, z) / 760, 2)) * sstep(120, 2300, -z); // the town valley to the north
    h -= 120 * sstep(200, 2300, z);                                           // a gentler valley to the south
    const far = sstep(2700, 5200, r) * (1 - 0.55 * Math.exp(-Math.pow(valleyD(x, z) / 900, 2)) * sstep(-3000, -5000, z));
    h += far * (650 + 1000 * rid) * (0.55 + 0.7 * n1);                         // a ring of ranges beyond 3 km
    h += (n1 - 0.5) * 150 * sstep(100, 900, r) + (rid - 0.5) * 130 * sstep(300, 1600, r) + (n2 - 0.5) * 18 * sstep(10, 90, r);
    return h * sstep(20, 80, r) + (n2 - 0.5) * 0.6;
  }

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const LOOK = Object.assign({ dofScale: 0.5, radScale: 0.9, maxCoC: 56, bloom: 0.14, sat: 0.92, vig: 0.36, warm: 0.0, contrast: 1.06,
      grain: 0.032, ca: 0.0016, shadowSize: 2048 }, o.look || {});
    T.ColorManagement.enabled = true;
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // render() asks for one shadow update per frame (not one per pass)
    const ANISO = renderer.capabilities.getMaxAnisotropy();
    const scene = new T.Scene();
    scene.background = new T.Color(o.bg || "#03050b");
    const FOG = new T.Color(o.fogCol || "#1b2a50");
    scene.fog = new T.FogExp2(FOG, 0.00024);
    const camera = new T.PerspectiveCamera(40, W / H, 0.05, 30000);
    const loads = [];
    const noDepth = []; // hidden in the depth pass (glass, fog sheets, glows, beams) so DOF reads what is behind them
    const U = { time: { value: 0 }, wind: { value: 0.012 } };

    // ---------------------------------------------------------------- helpers
    const matCache = {};
    function mat(hex, p) {
      p = p || {};
      const key = hex + JSON.stringify(p, (k, v) => (v && v.isTexture ? v.uuid : v));
      if (!p.unique && matCache[key]) return matCache[key];
      const m = new T.MeshStandardMaterial({ color: hex, roughness: p.rough != null ? p.rough : 0.8, metalness: p.metal || 0, flatShading: !!p.flat });
      if (p.map) m.map = p.map;
      if (p.vc) m.vertexColors = true;
      if (p.emi) { m.emissive = new T.Color(p.emi); m.emissiveIntensity = p.emiI != null ? p.emiI : 1; }
      if (p.emiMap) m.emissiveMap = p.emiMap;
      if (p.opacity != null) { m.transparent = true; m.opacity = p.opacity; m.depthWrite = !!p.depthWrite; }
      if (p.side != null) m.side = p.side;
      if (p.env != null) m.envMapIntensity = p.env;
      if (p.fog === false) m.fog = false;
      if (!p.unique) matCache[key] = m;
      return m;
    }
    function glow(hex, hdr, p) {
      p = p || {};
      const m = new T.MeshBasicMaterial({ color: hex, map: p.map || null, side: p.side != null ? p.side : T.FrontSide, fog: p.fog !== false });
      m.color.multiplyScalar(hdr == null ? 1 : hdr);
      if (p.opacity != null || p.add) { m.transparent = true; m.opacity = p.opacity != null ? p.opacity : 1; m.depthWrite = false; }
      if (p.add) m.blending = T.AdditiveBlending;
      return m;
    }
    function M(geo, m, p, parent) {
      p = p || {};
      const mesh = new T.Mesh(geo, m);
      mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
      mesh.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R, p.order || "XYZ");
      if (p.s != null) mesh.scale.setScalar(p.s);
      if (p.sx != null || p.sy != null || p.sz != null) mesh.scale.set(p.sx != null ? p.sx : 1, p.sy != null ? p.sy : 1, p.sz != null ? p.sz : 1);
      mesh.castShadow = p.cast !== false;
      mesh.receiveShadow = p.receive !== false;
      (parent || scene).add(mesh);
      if (p.nodepth) noDepth.push(mesh);
      return mesh;
    }
    function G(p, parent) {
      p = p || {};
      const g = new T.Group();
      g.position.set(p.x || 0, p.y || 0, p.z || 0);
      g.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R, p.order || "XYZ");
      if (p.s != null) g.scale.setScalar(p.s);
      (parent || scene).add(g);
      return g;
    }
    const box = (w, h, d) => new T.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, n) => new T.CylinderGeometry(rt, rb, h, n || 12);
    const sph = (r, a, b) => new T.SphereGeometry(r, a || 20, b || 14);
    function capsule(r, len, n) { const g = new T.CapsuleGeometry(r, len, 4, n || 12); g.translate(0, -len / 2, 0); return g; } // hangs down from 0
    function rbox(w, h, d, r, n) {
      const s = new T.Shape(), x = -w / 2, y = -h / 2;
      r = Math.min(r, w / 2, h / 2);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: Math.min(r * 0.5, d * 0.25), bevelSize: Math.min(r * 0.5, d * 0.25), bevelSegments: 2, curveSegments: n || 5 });
      g.translate(0, 0, -d / 2);
      return g;
    }
    // a thin rod between two points (steel braces, rails)
    const UPV = new T.Vector3(0, 1, 0);
    function rod(a, b, r, m, parent, n) {
      const A = new T.Vector3().fromArray(a), B = new T.Vector3().fromArray(b);
      const len = A.distanceTo(B);
      const mesh = new T.Mesh(n === 4 ? box(r * 2, len, r * 2) : cyl(r, r, len, n || 6), m);
      mesh.position.copy(A).add(B).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(UPV, B.clone().sub(A).normalize());
      mesh.castShadow = true; mesh.receiveShadow = true;
      (parent || scene).add(mesh);
      return mesh;
    }
    const ctCache = {};
    function canvasTex(key, w, h, draw, opt) {
      if (ctCache[key]) return ctCache[key];
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      draw(cv.getContext("2d"), w, h);
      const t = new T.CanvasTexture(cv);
      t.colorSpace = opt && opt.linear ? T.NoColorSpace : T.SRGBColorSpace;
      t.anisotropy = ANISO;
      if (opt && opt.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; }
      ctCache[key] = t;
      return t;
    }
    // fonts used inside canvas textures (labels, radio display, signs)
    function loadFont(name, url) { const f = new FontFace(name, `url(${url})`); loads.push(f.load().then((ff) => { document.fonts.add(ff); }).catch(() => {})); }
    loadFont("KitOswald", "assets/fonts/Oswald_wght_.ttf");
    loadFont("KitInter", "assets/fonts/Inter_opsz-wght_.ttf");
    const redraw = []; // canvas textures that draw text: redrawn once the fonts are in
    function textTex(key, w, h, draw) {
      const t = canvasTex(key, w, h, draw);
      redraw.push(() => { const g = t.image.getContext("2d"); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; });
      return t;
    }
    function noiseTex(key, n, seed, oct, scale, opt) {
      return canvasTex(key, n, n, (g) => {
        const im = g.createImageData(n, n);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          // tileable fbm: sample on a torus
          const a = (x / n) * Math.PI * 2, b = (y / n) * Math.PI * 2;
          const v = fbm(Math.cos(a) * scale + 9, Math.sin(a) * scale + Math.cos(b) * scale * 0.97 + 3, seed, oct) * 0.5 +
            fbm(Math.sin(b) * scale + 5, Math.cos(a) * scale * 0.7 + 11, seed + 7, oct) * 0.5;
          const q = (y * n + x) * 4;
          const c = clamp(Math.round(v * 255), 0, 255);
          im.data[q] = c; im.data[q + 1] = c; im.data[q + 2] = c; im.data[q + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }, Object.assign({ repeat: true, linear: true }, opt || {}));
    }

    // ---------------------------------------------------------------- lights
    const MOON_DIR = new T.Vector3().fromArray(o.moonDir || [0.40, 0.33, -0.855]).normalize();
    const SHD = Object.assign({ half: 46, far: 520, dist: 260, center: [0, 18, 0] }, o.shadow || {});
    const hemi = new T.HemisphereLight((o.hemi && o.hemi[0]) || "#3e5590", (o.hemi && o.hemi[1]) || "#1a2216", 0.55);
    scene.add(hemi);
    const moon = new T.DirectionalLight(o.moonCol || "#a8bcff", 1.25);
    moon.castShadow = true;
    moon.shadow.mapSize.set(LOOK.shadowSize, LOOK.shadowSize);
    const sc = moon.shadow.camera;
    sc.left = -SHD.half; sc.right = SHD.half; sc.top = SHD.half; sc.bottom = -SHD.half; sc.near = 1; sc.far = SHD.far;
    const hooks = [];   // per-frame callbacks from world modules: fn(st, t, camera)
    moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03; moon.shadow.radius = 2.5;
    scene.add(moon, moon.target);
    const fill = new T.PointLight("#ffb46b", 0, 0, 2); // a free practical (truck lamp, flashlight spill)
    scene.add(fill);

    (function env() { // night dome PMREM: navy zenith, a lighter moon side, black ground
      const es = new T.Scene();
      const g = new T.SphereGeometry(10, 48, 24);
      const pa = g.attributes.position, cols = [];
      const EO = o.env || {};
      const zen = new T.Color(EO.zen || "#0a1430"), hor = new T.Color(EO.hor || "#22325a"), mside = new T.Color(EO.mside || "#4a5f96"), gnd = new T.Color(EO.gnd || "#05070a");
      const c = new T.Color(), d = new T.Vector3();
      for (let i = 0; i < pa.count; i++) {
        d.set(pa.getX(i), pa.getY(i), pa.getZ(i)).normalize();
        if (d.y > 0) c.copy(hor).lerp(zen, Math.pow(d.y, 0.5)).lerp(mside, Math.pow(Math.max(0, d.dot(MOON_DIR)), 6) * 0.8);
        else c.copy(hor).lerp(gnd, clamp(-d.y * 3, 0, 1));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      if (o.envScene) o.envScene(es, T);   // a world module can paint its own sky into the reflections (an aurora band)
      const pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(es, 0.04).texture;
      scene.environmentIntensity = 0.55;
      pm.dispose();
    })();

    // ---------------------------------------------------------------- sky, moon, stars
    let skyMat = null, moonMesh = null, moonGlow = null;
    function sky() {
      skyMat = new T.ShaderMaterial({
        uniforms: { moonDir: { value: MOON_DIR }, starK: { value: 1 }, moonK: { value: 1 }, glowCol: { value: new T.Color("#ff7a2e") }, glowK: { value: 0 },
          glowDir: { value: new T.Vector3(-0.18, 0, -0.98).normalize() },
          zenC: { value: new T.Vector3().fromArray((o.sky && o.sky.zen) || [0.007, 0.013, 0.036]) }, horC: { value: new T.Vector3().fromArray((o.sky && o.sky.hor) || [0.05, 0.075, 0.14]) } },
        vertexShader: "varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }",
        fragmentShader: `varying vec3 vD; uniform vec3 moonDir, glowCol, glowDir, zenC, horC; uniform float starK, moonK, glowK;
          float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
          void main(){
            vec3 d = normalize(vD); float h = d.y;
            vec3 zen = zenC, hor = horC;
            vec3 c = mix(hor, zen, pow(clamp(h, 0.0, 1.0), 0.42));
            if (h < 0.0) c = hor * 0.7;
            float md = max(dot(d, moonDir), 0.0);
            c += vec3(0.5, 0.58, 0.8) * (pow(md, 70.0) * 0.16 + pow(md, 9.0) * 0.05 + pow(md, 2.0) * 0.02) * moonK;
            float gd = max(dot(normalize(vec3(d.x, 0.0, d.z)), glowDir), 0.0);
            c += glowCol * pow(gd, 18.0) * exp(-max(h, 0.0) * 22.0) * glowK;   // a far fire glow low on the horizon
            vec3 p = d * 380.0; vec3 ip = floor(p); float r = h3(ip);
            if (r > 0.9955 && h > 0.02) { vec3 f = fract(p) - 0.5; float s = smoothstep(0.16, 0.0, length(f)); c += vec3(0.85, 0.9, 1.0) * s * (r - 0.9955) * 520.0 * starK * clamp(h * 5.0, 0.0, 1.0) * (1.0 - smoothstep(0.92, 1.0, md)); }
            gl_FragColor = vec4(c, 1.0);
          }`,
        side: T.BackSide, depthWrite: false, fog: false,
      });
      const s = new T.Mesh(new T.SphereGeometry(20000, 48, 24), skyMat);
      s.frustumCulled = false; s.renderOrder = -10;
      scene.add(s); noDepth.push(s);
      const mt = canvasTex("moon", 256, 256, (g, w, h) => {
        const r = w * 0.46;
        const gr = g.createRadialGradient(w / 2 - 20, h / 2 - 20, 4, w / 2, h / 2, r);
        gr.addColorStop(0, "#fffaf0"); gr.addColorStop(0.8, "#efe9dc"); gr.addColorStop(1, "#d8d2c6");
        g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.fill();
        const R = rng(77); g.globalAlpha = 0.16; g.fillStyle = "#8f8a86";
        for (let i = 0; i < 26; i++) { const a = R() * 6.28, rr = R() * r * 0.75, s2 = 8 + R() * 34; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, s2, s2 * (0.6 + R() * 0.4), R() * 3, 0, 7); g.fill(); }
      });
      moonMesh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: mt, transparent: true, depthWrite: false, fog: false }));
      moonMesh.material.color.multiplyScalar(3.2);
      moonMesh.renderOrder = -9; scene.add(moonMesh); noDepth.push(moonMesh);
      const gt = canvasTex("moonglow", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(0.25, "rgba(255,255,255,0.16)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      moonGlow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: gt, color: new T.Color("#9fb4ff").multiplyScalar(0.5), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      moonGlow.renderOrder = -9; scene.add(moonGlow); noDepth.push(moonGlow);
    }

    // ---------------------------------------------------------------- terrain: near (3 m), mid (10 m), far (50 m) patches
    function patch(size, seg, cx, cz, sink, col) {
      const g = new T.PlaneGeometry(size, size, seg, seg);
      g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position, cols = [];
      const c = new T.Color(), dirt = new T.Color("#5e5442"), floor = new T.Color("#26382a"), rock = new T.Color("#474c52"), dry = new T.Color("#424230");
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i) + cx, z = pa.getZ(i) + cz;
        let h = terrainH(x, z);
        if (sink) h -= sink(x, z);
        pa.setXYZ(i, x, h, z);
        const n = fbm(x / 40, z / 40, 5, 3);
        c.copy(floor).lerp(dry, n * 0.8);
        const r = Math.hypot(x, z);
        if (r < 34) c.lerp(dirt, 1 - sstep(16, 34, r));
        cols.push(c.r * col, c.g * col, c.b * col);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      // steep faces read as rock
      const nrm = g.attributes.normal, ca = g.attributes.color;
      for (let i = 0; i < pa.count; i++) { const k = sstep(0.82, 0.62, nrm.getY(i)); c.setRGB(ca.getX(i), ca.getY(i), ca.getZ(i)).lerp(rock, k * 0.8); ca.setXYZ(i, c.r, c.g, c.b); }
      let mp = null;
      if (size < 1000) {
        mp = canvasTex("grounddetail", 512, 512, (q, w, h) => {
          const R = rng(61); q.fillStyle = "#8a8a8a"; q.fillRect(0, 0, w, h);
          for (let i = 0; i < 2600; i++) { const v = 90 + R() * 120; q.fillStyle = `rgb(${v},${v},${v})`; q.globalAlpha = 0.35; q.fillRect(R() * w, R() * h, 2 + R() * 5, 1 + R() * 3); }
          q.globalAlpha = 0.5; for (let i = 0; i < 420; i++) { q.strokeStyle = R() < 0.5 ? "#5e5e5e" : "#b4b4b4"; q.lineWidth = 1; const x = R() * w, y = R() * h; q.beginPath(); q.moveTo(x, y); q.lineTo(x + (R() - 0.5) * 14, y - 4 - R() * 10); q.stroke(); }
          q.globalAlpha = 0.7; for (let i = 0; i < 160; i++) { const v = 150 + R() * 90; q.fillStyle = `rgb(${v},${v},${v})`; q.beginPath(); q.arc(R() * w, R() * h, 1 + R() * 3, 0, 7); q.fill(); }
          q.globalAlpha = 1;
        }, { repeat: true });
        mp.repeat.set(size / 6, size / 6);
      }
      const m = M(g, mat("#ffffff", { vc: true, rough: 0.96, env: 0.25, map: mp }), { cast: false });
      return m;
    }
    const inBox = (x, z, hx, hz, cx, cz) => Math.abs(x - (cx || 0)) < hx && Math.abs(z - (cz || 0)) < hz;
    let terrain = null;
    function buildTerrain() {
      const near = patch(640, 210, 0, 0, null, 1);
      near.receiveShadow = true;
      const mid = patch(3400, 300, -200, -1500, (x, z) => (inBox(x, z, 312, 312) ? 9 : 0), 1);
      const far = patch(18000, 300, 0, -2000, (x, z) => (inBox(x, z, 1690, 1690, -200, -1500) || inBox(x, z, 330, 330) ? 14 : 0), 0.9);
      terrain = { near, mid, far };
    }
    // the height the mesh actually has (triangle interpolation of the finest patch that covers x,z)
    function meshH(x, z) {
      let step, ox, oz, half;
      if (inBox(x, z, 318, 318)) { step = 640 / 210; ox = 0; oz = 0; half = 320; }
      else if (inBox(x, z, 1695, 1695, -200, -1500)) { step = 3400 / 300; ox = -200; oz = -1500; half = 1700; }
      else return terrainH(x, z);
      const gx = (x - ox + half) / step, gz = (z - oz + half) / step;
      const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
      const P = (i, j) => terrainH(ox - half + i * step, oz - half + j * step);
      // PlaneGeometry triangles: (a=i,j  b=i,j+1  d=i+1,j) and (b, c=i+1,j+1, d)
      if (fx + fz < 1) return P(ix, iz) + (P(ix + 1, iz) - P(ix, iz)) * fx + (P(ix, iz + 1) - P(ix, iz)) * fz;
      return P(ix + 1, iz + 1) + (P(ix, iz + 1) - P(ix + 1, iz + 1)) * (1 - fx) + (P(ix + 1, iz) - P(ix + 1, iz + 1)) * (1 - fz);
    }

    // ---------------------------------------------------------------- road (switchbacks down the north slope to the town)
    const ROAD_PTS = [[5, -11], [14, -30], [40, -52], [22, -100], [-40, -150], [-10, -230], [70, -300], [120, -380], [40, -470], [-70, -560], [-120, -680],
      [-30, -800], [80, -930], [20, -1080], [-110, -1220], [-200, -1420], [-260, -1650], [-330, -1900], [-410, -2180], [-470, -2460], [-500, -2680]];
    let roadCurve = null, roadLen = 0;
    function buildRoad() {
      roadCurve = new T.CatmullRomCurve3(ROAD_PTS.map((p) => new T.Vector3(p[0], 0, p[1])), false, "centripetal");
      roadLen = roadCurve.getLength();
      const N = 900, wd = 4.6, pos = [], uv = [], idx = [];
      const pts = roadCurve.getSpacedPoints(N);
      for (let i = 0; i <= N; i++) {
        const p = pts[i], q = pts[Math.min(N, i + 1)], pr = pts[Math.max(0, i - 1)];
        const dx = q.x - pr.x, dz = q.z - pr.z, l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l, nz = dx / l;
        for (const s of [-1, 1]) {
          const x = p.x + nx * s * wd / 2, z = p.z + nz * s * wd / 2;
          pos.push(x, meshH(x, z) + 0.35, z);
          uv.push(s < 0 ? 0 : 1, (i / N) * roadLen / 6);
        }
        if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      const tex = canvasTex("gravel", 64, 256, (c, w, h) => { const R = rng(9); c.fillStyle = "#4d4840"; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = R() < 0.5 ? "#3a3630" : "#5e584e"; c.fillRect(R() * w, R() * h, 2, 2); } c.fillStyle = "rgba(30,26,22,0.5)"; c.fillRect(14, 0, 8, h); c.fillRect(w - 22, 0, 8, h); }, { repeat: true });
      const m = new T.MeshStandardMaterial({ map: tex, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const mesh = M(g, m, { cast: false });
      return mesh;
    }
    function distToRoad(x, z) { let d = 1e9; const pts = roadCurve.getSpacedPoints(400); for (const p of pts) d = Math.min(d, Math.hypot(p.x - x, p.z - z)); return d; }

    // ---------------------------------------------------------------- forest: instanced conifers that sway in the wind
    function treeGeo(seed, layers) {
      const R = rng(seed), parts = [];
      const trunk = cyl(0.012, 0.02, 0.3, 7); trunk.translate(0, 0.15, 0); parts.push([trunk, new T.Color("#3a2a1e")]);
      for (let i = 0; i < layers; i++) {
        const u = i / layers;
        const r = lerp(0.2, 0.06, u) * (0.88 + R() * 0.24), h = lerp(0.34, 0.2, u) * (0.9 + R() * 0.2);
        const g = new T.ConeGeometry(r, h, 11, 2, true);
        const pa = g.attributes.position;
        for (let k = 0; k < pa.count; k++) { const x = pa.getX(k), z = pa.getZ(k), y = pa.getY(k); const j = 1 + (hash2(Math.round(x * 999), Math.round(z * 999), seed + i) - 0.5) * 0.28 * (y < 0 ? 1 : 0.2); pa.setXYZ(k, x * j, y - (y < 0 ? (hash2(k, i, seed) * 0.03) : 0), z * j); }
        g.translate(0, 0.22 + u * 0.7 + h / 2, 0);
        const shade = 0.75 + u * 0.45 + (R() - 0.5) * 0.1;
        parts.push([g, new T.Color("#2f5c3d").multiplyScalar(shade)]);
      }
      // merge with vertex colours (darker inside the skirts)
      let n = 0; for (const [g] of parts) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = [];
      let o = 0;
      for (const [g, c] of parts) {
        const gi = g.index ? g.toNonIndexed() : g;
        gi.computeVertexNormals();
        const pa = gi.attributes.position, na = gi.attributes.normal;
        for (let k = 0; k < pa.count; k++) {
          pos[(o + k) * 3] = pa.getX(k); pos[(o + k) * 3 + 1] = pa.getY(k); pos[(o + k) * 3 + 2] = pa.getZ(k);
          // tilt normals outward-up so the canopy reads soft, like needles, not cones
          const nx = na.getX(k), ny = na.getY(k) * 0.6 + 0.4, nz = na.getZ(k), l = Math.hypot(nx, ny, nz);
          nor[(o + k) * 3] = nx / l; nor[(o + k) * 3 + 1] = ny / l; nor[(o + k) * 3 + 2] = nz / l;
          const rim = pa.getY(k) < 0.3 ? 1 : 0.85 + 0.25 * hash2(k, o, seed);
          col[(o + k) * 3] = c.r * rim; col[(o + k) * 3 + 1] = c.g * rim; col[(o + k) * 3 + 2] = c.b * rim;
        }
        o += pa.count;
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3));
      g.setAttribute("normal", new T.BufferAttribute(nor, 3));
      g.setAttribute("color", new T.BufferAttribute(col, 3));
      g.computeBoundingSphere();
      return g;
    }
    function windPatch(shader) {
      shader.uniforms.uTime = U.time; shader.uniforms.uWind = U.wind;
      shader.vertexShader = "uniform float uTime; uniform float uWind;\n" + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ipw = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ipw = vec3(0.0);
        #endif
        float hk = max(position.y, 0.0); hk *= hk;
        float ph = ipw.x * 0.031 + ipw.z * 0.023;
        float sw = sin(uTime * 1.25 + ph) * 0.65 + sin(uTime * 2.9 + ph * 1.9) * 0.22 + sin(uTime * 0.37 + ph * 0.3) * 0.5;
        transformed.x += uWind * sw * hk;
        transformed.z += uWind * 0.55 * cos(uTime * 1.07 + ph * 1.3) * hk;`);
    }
    let forest = [];
    function buildForest(opt) {
      opt = opt || {};
      const geos = [treeGeo(5, 5), treeGeo(17, 6), treeGeo(29, 4)];
      const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, envMapIntensity: 0.3 });
      m.onBeforeCompile = windPatch; m.customProgramCacheKey = () => "wind";
      const dm = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
      dm.onBeforeCompile = windPatch; dm.customProgramCacheKey = () => "windDepth";
      const lists = [[], [], []];
      const R = rng(opt.seed || 4242);
      const rings = [[16, 160, opt.near || 1500], [160, 800, opt.mid || 3300], [800, 2600, opt.far || 4200]];
      const dummy = new T.Object3D();
      for (const [r0, r1, n] of rings) {
        let placed = 0, tries = 0;
        while (placed < n && tries < n * 6) {
          tries++;
          const a = R() * Math.PI * 2, rr = Math.sqrt(lerp(r0 * r0, r1 * r1, R()));
          const x = Math.cos(a) * rr, z = Math.sin(a) * rr - (r0 > 700 ? 900 * R() : 0);
          if (Math.hypot(x, z) < 24) continue;
          const dens = fbm(x / 120, z / 120, 31, 3);
          if (dens < 0.38 + (r0 > 700 ? 0.08 : 0)) continue;
          if (r0 < 900 && distToRoad(x, z) < 8) continue;
          const y = meshH(x, z);
          const hgt = (r0 < 160 ? lerp(12, 21, R()) : lerp(13, 25, R()));
          dummy.position.set(x, y - 0.3, z);
          dummy.rotation.set((R() - 0.5) * 0.05, R() * 6.28, (R() - 0.5) * 0.05);
          dummy.scale.set(hgt * (0.85 + R() * 0.3), hgt, hgt * (0.85 + R() * 0.3));
          dummy.updateMatrix();
          lists[Math.floor(R() * 3)].push(dummy.matrix.clone());
          placed++;
        }
      }
      // the tree line hugging the clearing (they frame the base of the tower)
      for (let i = 0; i < (opt.ring || 70); i++) {
        const a = (i / (opt.ring || 70)) * Math.PI * 2 + R() * 0.05, rr = 25 + R() * 8;
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        if (distToRoad(x, z) < 8) continue;
        dummy.position.set(x, meshH(x, z) - 0.3, z);
        dummy.rotation.set(0, R() * 6.28, 0);
        const hgt = lerp(13, 19, R());
        dummy.scale.set(hgt * 0.95, hgt, hgt * 0.95);
        dummy.updateMatrix();
        lists[i % 3].push(dummy.matrix.clone());
      }
      forest = lists.map((L, i) => {
        const im = new T.InstancedMesh(geos[i], m, L.length);
        L.forEach((mx, k) => im.setMatrixAt(k, mx));
        im.instanceMatrix.needsUpdate = true;
        im.castShadow = true; im.receiveShadow = true;
        im.customDepthMaterial = dm;
        im.frustumCulled = false;
        scene.add(im);
        return im;
      });
    }

    // ---------------------------------------------------------------- valley fog sheets (moonlit, drifting)
    let fogSheets = [];
    function buildFog() {
      const nt = noiseTex("fognoise", 256, 3, 5, 2.2);
      const defs = [[-545, 0.42, 5200, -450, -2700], [-515, 0.34, 5200, -400, -2600], [-478, 0.24, 4600, -350, -2400], [-430, 0.13, 4200, -250, -2100],
        [-300, 0.1, 2400, -120, -1200], [-170, 0.08, 1400, -40, -600]];
      fogSheets = defs.map(([y, op, size, cx, cz], i) => {
        const m = new T.ShaderMaterial({
          uniforms: { tN: { value: nt }, t: { value: 0 }, op: { value: op }, k: { value: 1 }, col: { value: new T.Color("#8ea4d0") }, sp: { value: new T.Vector2(0.0022 + i * 0.0004, 0.0011) },
            sc: { value: 1.6 + i * 0.35 }, fogC: { value: FOG }, fogD: { value: 0.00024 } },
          vertexShader: "varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
          fragmentShader: `uniform sampler2D tN; uniform float t, op, k, sc, fogD; uniform vec3 col, fogC; uniform vec2 sp; varying vec2 vUv; varying vec3 vW;
            void main(){
              vec2 q = vUv * sc;
              float n = texture2D(tN, q + sp * t * 10.0).r * 0.6 + texture2D(tN, q * 2.3 - sp.yx * t * 14.0).r * 0.4;
              float a = smoothstep(0.3, 0.85, n);
              float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
              float d = length(cameraPosition - vW);
              float f = 1.0 - exp(-pow(fogD * d, 2.0));
              vec3 c = mix(col * (0.55 + 0.6 * n), fogC, f * 0.6);
              gl_FragColor = vec4(c, a * op * k * edge);
            }`,
          transparent: true, depthWrite: false, side: T.DoubleSide,
        });
        const mesh = new T.Mesh(new T.PlaneGeometry(size, size, 1, 1), m);
        mesh.rotation.x = -Math.PI / 2; mesh.position.set(cx, y, cz);
        mesh.renderOrder = 2;
        scene.add(mesh); noDepth.push(mesh);
        return mesh;
      });
    }

    // ---------------------------------------------------------------- the town in the valley + far fire glow + smoke
    let town = null;
    function buildTown() {
      const g = new T.Group(); scene.add(g);
      const C = [-500, -2700], R = rng(808);
      const lights = [], cols = [];
      for (let i = 0; i < 900; i++) {
        const blk = Math.floor(R() * 14), bx = C[0] + (blk % 5 - 2) * 110 + (R() - 0.5) * 90, bz = C[1] + (Math.floor(blk / 5) - 1) * 120 + (R() - 0.5) * 100;
        lights.push([bx, meshH(bx, bz) + 1.5 + R() * 6, bz]);
        cols.push(R() < 0.75 ? "#ffcc80" : R() < 0.5 ? "#fff1d6" : "#ff9a52");
      }
      const geo = new T.SphereGeometry(1.1, 6, 4);
      const im = new T.InstancedMesh(geo, new T.MeshBasicMaterial({ color: 0xffffff }), lights.length);
      const d = new T.Object3D(), c = new T.Color();
      lights.forEach((p, i) => { d.position.fromArray(p); d.scale.setScalar(0.8 + R() * 0.8); d.updateMatrix(); im.setMatrixAt(i, d.matrix); c.set(cols[i]).multiplyScalar(9); im.setColorAt(i, c); });
      im.instanceColor.needsUpdate = true; im.castShadow = false; im.receiveShadow = false; im.frustumCulled = false;
      g.add(im);
      const gt = canvasTex("fireglow", 128, 128, (q, w, h) => { const gr = q.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.3, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); q.fillStyle = gr; q.fillRect(0, 0, w, h); });
      const glows = [];
      for (let i = 0; i < 4; i++) {
        const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: gt, color: new T.Color("#ff6a24").multiplyScalar(1.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        const x = C[0] + (i - 1.5) * 120, z = C[1] + (i % 2) * 80;
        m.position.set(x, meshH(x, z) + 30, z); m.scale.setScalar(380 + i * 60);
        g.add(m); noDepth.push(m); glows.push(m);
      }
      const st = noiseTex("smoke", 128, 21, 4, 1.6);
      const smokes = [];
      for (let i = 0; i < 3; i++) {
        const m = new T.ShaderMaterial({
          uniforms: { tN: { value: st }, t: { value: 0 }, k: { value: 1 }, seed: { value: i * 3.7 } },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
          fragmentShader: `uniform sampler2D tN; uniform float t, k, seed; varying vec2 vUv;
            void main(){
              float w = 0.18 + vUv.y * 0.5;
              float x = (vUv.x - 0.5) / w + sin(vUv.y * 5.0 + seed) * 0.25;
              float n = texture2D(tN, vec2(vUv.x * 1.3 + seed, vUv.y * 1.6 - t * 0.05)).r;
              float a = smoothstep(1.0, 0.2, abs(x)) * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.3, 0.75, n);
              vec3 c = mix(vec3(0.45, 0.16, 0.05), vec3(0.06, 0.06, 0.08), smoothstep(0.0, 0.45, vUv.y));
              gl_FragColor = vec4(c, a * 0.8 * k);
            }`,
          transparent: true, depthWrite: false, side: T.DoubleSide,
        });
        const sm = new T.Mesh(new T.PlaneGeometry(320, 900), m);
        const x = C[0] + (i - 1) * 160, z = C[1] + 40 * i;
        sm.position.set(x, meshH(x, z) + 430, z);
        g.add(sm); noDepth.push(sm); smokes.push(sm);
      }
      town = { g, im, glows, smokes };
    }

    // ---------------------------------------------------------------- convoy of headlights climbing the road
    let cars = null;
    function buildCars(n) {
      n = n || 22;
      const g = new T.Group(); scene.add(g);
      const hm = glow("#fff2d8", 14, { fog: true }), tm = glow("#ff2a14", 4, { fog: true });
      const hl = new T.SphereGeometry(0.32, 8, 6);
      const list = [];
      for (let i = 0; i < n; i++) {
        const c = new T.Group(); g.add(c);
        const a = new T.Mesh(hl, hm), b = new T.Mesh(hl, hm), t1 = new T.Mesh(hl, tm), t2 = new T.Mesh(hl, tm);
        a.position.set(-0.75, 0.8, 2.2); b.position.set(0.75, 0.8, 2.2); t1.position.set(-0.7, 0.9, -2.2); t2.position.set(0.7, 0.9, -2.2);
        t1.scale.setScalar(0.6); t2.scale.setScalar(0.6);
        [a, b, t1, t2].forEach((m) => { m.castShadow = false; c.add(m); });
        const beam = new T.Mesh(new T.ConeGeometry(4.5, 26, 16, 1, true), glow("#ffe7c0", 0.035, { add: true, side: T.DoubleSide }));
        beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0.9, 15);
        beam.castShadow = false; c.add(beam); noDepth.push(beam);
        list.push({ c, off: i / n + (hash2(i, 3, 9) - 0.5) * 0.012 });
      }
      cars = { g, list };
    }
    const tmpV = new T.Vector3(), tmpV2 = new T.Vector3();
    function placeCars(t, k) {
      if (!cars) return;
      cars.g.visible = k > 0.001;
      if (!cars.g.visible) return;
      for (const c of cars.list) {
        // s: 0 at the tower, 1 at the town; the convoy fills s 0.38..0.98 and climbs (s decreases) ~7 m/s
        let s = 0.12 + ((c.off + 1 - (t * 7 / roadLen) / 0.83) % 1) * 0.83;
        const p = roadCurve.getPointAt(clamp(s, 0, 1), tmpV), q = roadCurve.getPointAt(clamp(s - 0.002, 0, 1), tmpV2);
        c.c.position.set(p.x, meshH(p.x, p.z) + 0.5, p.z);
        c.c.lookAt(q.x, meshH(q.x, q.z) + 0.5, q.z);
        c.c.visible = s > 0.125;
      }
    }

    // ---------------------------------------------------------------- red eyes in the forest (stylised, scalable)
    let eyes = null;
    function buildEyes(n) {
      n = n || 70;
      const g = new T.Group(); scene.add(g);
      const m = glow("#ff2412", 16, { fog: false });
      const e = new T.SphereGeometry(0.055, 8, 6);
      const R = rng(1313), list = [];
      for (let i = 0; i < n; i++) {
        let x, z;
        if (i % 5 < 3) { const a = R() * Math.PI * 2, r = 15 + R() * 7; x = Math.cos(a) * r; z = Math.sin(a) * r; }   // the clearing edge
        else { const sp = Wroad(0.004 + R() * 0.03); x = sp.x + (R() - 0.5) * 5; z = sp.z + (R() - 0.5) * 5; }               // up the road
        const a2 = Math.atan2(z, x), r2 = 5.2 + R() * 4.2;
        const p = new T.Group(); g.add(p);
        const l = new T.Mesh(e, m), rr = new T.Mesh(e, m);
        l.position.x = -0.05; rr.position.x = 0.05;
        l.castShadow = rr.castShadow = false;
        p.add(l, rr);
        list.push({ p, appear: R(), ph: R() * 10, a: [x, z], b: [Math.cos(a2) * r2, Math.sin(a2) * r2], hy: 1.45 + R() * 0.25 });
      }
      eyes = { g, list };
    }
    function Wroad(s2) { return roadCurve.getPointAt(s2); }
    function placeEyes(t, k, scale, gather) {
      if (!eyes) return;
      eyes.g.visible = k > 0.001;
      if (!eyes.g.visible) return;
      for (const e of eyes.list) {
        const on = k > e.appear;
        const bl = Math.sin(t * 0.9 + e.ph) > 0.965;
        e.p.visible = on && !bl;
        const x = lerp(e.a[0], e.b[0], gather || 0), z = lerp(e.a[1], e.b[1], gather || 0);
        e.p.position.set(x, meshH(x, z) + e.hy, z);
        e.p.lookAt(0, e.p.position.y, 0);
        e.p.scale.setScalar(scale || 1);
      }
    }

    // ---------------------------------------------------------------- the lookout tower
    const TOP = 30, HB = 4.5, HT = 2.2; // cab floor height, half-width at base / top
    let tower = null;
    function buildTower() {
      const g = G({}, scene);
      const steel = mat("#b4bcc4", { metal: 0.55, rough: 0.42, env: 1.3 });
      const legAt = (sx, sz, y) => { const u = y / TOP, h = lerp(HB, HT, u); return [sx * h, y, sz * h]; };
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        rod(legAt(sx, sz, -0.2), legAt(sx, sz, TOP), 0.15, steel, g, 4);
        M(box(0.6, 0.5, 0.6), mat("#6d6a64", { rough: 0.9 }), { x: sx * HB, y: 0.0, z: sz * HB }, g); // footings
      }
      const levels = [0.4, 6.2, 12, 17.8, 23.6, TOP - 0.2];
      for (let i = 0; i < levels.length; i++) {
        const y = levels[i];
        const c = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
        for (let k = 0; k < 4; k++) rod(legAt(c[k][0], c[k][1], y), legAt(c[(k + 1) % 4][0], c[(k + 1) % 4][1], y), 0.07, steel, g, 4);
        if (i < levels.length - 1) {
          const y2 = levels[i + 1];
          for (let k = 0; k < 4; k++) {
            const a = c[k], b = c[(k + 1) % 4];
            rod(legAt(a[0], a[1], y), legAt(b[0], b[1], y2), 0.045, steel, g, 6);
            rod(legAt(b[0], b[1], y), legAt(a[0], a[1], y2), 0.045, steel, g, 6);
          }
        }
      }
      // the ladder: one straight run at (LX, LZ) from the first landing to the cab trapdoor + a retractable bottom flight
      const LX = -1.25, LZ = 1.25, lm = mat("#9aa1a8", { metal: 0.6, rough: 0.42 });
      function ladder(y0, y1, parent, dz) {
        const lg = G({ x: LX, y: 0, z: LZ + (dz || 0) }, parent);
        rod([-0.23, y0, 0], [-0.23, y1, 0], 0.025, lm, lg, 6);
        rod([0.23, y0, 0], [0.23, y1, 0], 0.025, lm, lg, 6);
        for (let y = y0 + 0.15; y < y1; y += 0.3) rod([-0.23, y, 0], [0.23, y, 0], 0.014, lm, lg, 5);
        return lg;
      }
      ladder(4.3, TOP + 0.05, g, 0);
      const low = G({}, g);
      ladder(0.05, 4.7, low, 0.09);
      // first landing (grating) where she winches the bottom flight up, + small landings
      const grate = mat("#5f656b", { metal: 0.5, rough: 0.6 });
      for (const y of [4.6, 12, 17.8, 23.6]) M(box(1.3, 0.05, 1.1), grate, { x: LX + 0.3, y, z: LZ - 0.65 }, g);
      const winch = G({ x: LX + 0.75, y: 4.6, z: LZ - 0.2 }, g);
      M(cyl(0.09, 0.09, 0.3, 12), mat("#3c4146", { metal: 0.5, rough: 0.5 }), { y: 0.9, rz: 90 }, winch);
      M(box(0.06, 0.9, 0.06), steel, { y: 0.45 }, winch);
      const crank = G({ x: 0.18, y: 0.9 }, winch);
      M(box(0.03, 0.22, 0.03), mat("#b23a2a", { rough: 0.5 }), { y: 0.1 }, crank);
      rod([LX, 4.7, LZ], [LX + 0.75, 5.5, LZ - 0.2], 0.006, mat("#2a2a2a"), g, 4); // cable
      // cab: floor, catwalk, railing, walls, glass, roof
      const cab = G({ y: TOP }, g);
      const C = 2.15;
      M(box(2 * C + 2.1, 0.16, 2 * C + 2.1), mat("#5a4a3a", { rough: 0.85 }), { y: -0.08 }, cab); // catwalk deck
      const rail = mat("#7e858c", { metal: 0.5, rough: 0.5 });
      const E = C + 1.0;
      for (const [ax, az, bx, bz] of [[-E, -E, E, -E], [E, -E, E, E], [E, E, -E, E], [-E, E, -E, -E]]) {
        rod([ax, 1.05, az], [bx, 1.05, bz], 0.03, rail, cab, 6);
        rod([ax, 0.55, az], [bx, 0.55, bz], 0.02, rail, cab, 6);
        for (let u = 0; u <= 1.001; u += 1 / 4) rod([lerp(ax, bx, u), 0, lerp(az, bz, u)], [lerp(ax, bx, u), 1.05, lerp(az, bz, u)], 0.025, rail, cab, 6);
      }
      // floor with planks (interior) and the trapdoor hole near (LX, LZ)
      const planks = canvasTex("planks", 512, 512, (q, w, h) => {
        const R = rng(31);
        for (let i = 0; i < 8; i++) { const v = 0.85 + R() * 0.3; q.fillStyle = `rgb(${Math.round(120 * v)},${Math.round(84 * v)},${Math.round(52 * v)})`; q.fillRect(0, i * 64, w, 64); q.fillStyle = "rgba(30,18,10,0.6)"; q.fillRect(0, i * 64, w, 3);
          for (let k = 0; k < 30; k++) { q.fillStyle = `rgba(60,36,20,${0.08 + R() * 0.1})`; q.fillRect(0, i * 64 + 6 + R() * 56, w, 1 + R() * 2); }
          q.fillStyle = "rgba(30,18,10,0.5)"; q.fillRect(R() * w, i * 64, 3, 64); }
      }, { repeat: true });
      planks.repeat.set(2, 2);
      const floorM = mat("#ffffff", { map: planks, rough: 0.72, env: 0.4 });
      // floor in 4 pieces around a 0.9 m hatch at (LX, LZ)
      const hx0 = LX - 0.45, hx1 = LX + 0.45, hz0 = LZ - 0.45, hz1 = LZ + 0.45;
      M(box(C - hx1, 0.1, 2 * C), floorM, { x: (hx1 + C) / 2, y: 0.05, z: 0 }, cab);
      M(box(hx0 + C, 0.1, 2 * C), floorM, { x: (-C + hx0) / 2, y: 0.05, z: 0 }, cab);
      M(box(0.9, 0.1, hz0 + C), floorM, { x: LX, y: 0.05, z: (-C + hz0) / 2 }, cab);
      M(box(0.9, 0.1, C - hz1), floorM, { x: LX, y: 0.05, z: (hz1 + C) / 2 }, cab);
      const trap = G({ x: hx0, y: 0.1, z: LZ }, cab); // hinged at the -x edge; rotation.z opens it
      M(box(0.9, 0.05, 0.88), mat("#7a5434", { map: planks, rough: 0.7 }), { x: 0.45, y: 0.0 }, trap);
      M(cyl(0.03, 0.03, 0.03, 10), mat("#2d2d2d", { metal: 0.6 }), { x: 0.75, y: 0.04, z: 0.25 }, trap); // ring
      const bolt = G({ x: hx1 + 0.06, y: 0.12, z: LZ + 0.2 }, cab);
      M(box(0.14, 0.03, 0.05), mat("#6b6f74", { metal: 0.8, rough: 0.3 }), {}, bolt);
      M(box(0.2, 0.04, 0.08), mat("#3a3d40", { metal: 0.7, rough: 0.4 }), { x: 0.06, y: -0.005 }, cab).position.set(hx1 + 0.12, 0.115, LZ + 0.2);
      // walls: lower panels, mullions, glass band, header, ceiling
      const wallIn = mat("#a8845a", { rough: 0.8, map: canvasTex("panel", 256, 256, (q, w, h) => { q.fillStyle = "#c9a477"; q.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { q.fillStyle = "rgba(70,44,24,0.35)"; q.fillRect(i * 32, 0, 2, h); } const R = rng(5); for (let k = 0; k < 120; k++) { q.fillStyle = `rgba(90,60,30,${R() * 0.12})`; q.fillRect(R() * w, 0, 1, h); } }, { repeat: true }) });
      const wallOut = mat("#b9b3a5", { rough: 0.85 });
      const trim = mat("#e2dccd", { rough: 0.6 });
      const glass = new T.MeshPhysicalMaterial({ color: "#a9bcd2", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide, specularIntensity: 1 });
      const wins = [];
      for (let s = 0; s < 4; s++) {
        const side = G({ ry: s * 90 }, cab); // each side faces outward along +z after rotation
        M(box(2 * C, 0.95, 0.05), wallIn, { y: 0.1 + 0.475, z: C - 0.03 }, side);
        M(box(2 * C + 0.1, 0.95, 0.04), wallOut, { y: 0.1 + 0.475, z: C + 0.02 }, side);
        M(box(2 * C + 0.1, 0.3, 0.1), trim, { y: 2.42, z: C }, side);
        M(box(2 * C + 0.1, 0.07, 0.14), trim, { y: 1.07, z: C }, side);
        for (let k = 0; k <= 3; k++) M(box(0.07, 1.3, 0.08), trim, { x: -C + (k * 2 * C) / 3, y: 1.72, z: C }, side);
        for (let k = 0; k < 3; k++) { const p = M(new T.PlaneGeometry((2 * C) / 3 - 0.07, 1.28), glass, { x: -C + ((k + 0.5) * 2 * C) / 3, y: 1.72, z: C, cast: false, receive: false, nodepth: true }, side); p.renderOrder = 3; wins.push(p); }
      }
      const ceil = M(box(2 * C, 0.06, 2 * C), mat("#8a6a48", { rough: 0.8, map: planks }), { y: 2.6 }, cab);
      // roof: low hip roof with overhang, a flat cap with the rain barrel + catcher, lightning rod, antenna
      const roofG = new T.CylinderGeometry(0.75 * Math.SQRT2, (C + 0.75) * Math.SQRT2, 0.75, 4, 1);
      roofG.rotateY(Math.PI / 4);
      M(roofG, mat("#2e3f33", { rough: 0.55, metal: 0.4 }), { y: 2.6 + 0.375 }, cab);
      M(box(1.5, 0.05, 1.5), mat("#3b4a3f", { rough: 0.6, metal: 0.3 }), { y: 3.37 }, cab);
      const barrel = G({ x: 0.0, y: 3.395, z: 0.05 }, cab);
      M(cyl(0.3, 0.3, 0.8, 18), mat("#1f4f8a", { rough: 0.45 }), { y: 0.4 }, barrel);
      M(cyl(0.48, 0.12, 0.25, 18, true), mat("#cfd3d6", { metal: 0.6, rough: 0.35, side: T.DoubleSide }), { y: 0.95 }, barrel);
      rod([0.55, 3.4, -0.4], [0.55, 5.6, -0.4], 0.015, steel, cab, 5);
      rod([-0.5, 3.4, 0.4], [-0.5, 6.2, 0.4], 0.01, mat("#222"), cab, 4);
      // solar panel on the south rail
      const sol = G({ x: 1.2, y: 0.9, z: E - 0.1, rx: -50 }, cab);
      M(box(1.0, 0.04, 0.6), mat("#141c2c", { rough: 0.25, metal: 0.4, env: 1.4 }), { y: 0.3 }, sol);
      // yard light on a pole at the base, over the parked truck
      const yard = G({ x: 3.4, y: 0, z: -7.6 }, g);
      M(cyl(0.06, 0.08, 4.6, 8), mat("#5d5a55", { rough: 0.7 }), { y: 2.3 }, yard);
      M(box(0.7, 0.05, 0.05), mat("#5d5a55", { rough: 0.7 }), { x: 0.3, y: 4.55 }, yard);
      M(new T.ConeGeometry(0.22, 0.16, 14, 1, true), mat("#3a3d40", { metal: 0.5, rough: 0.5, side: T.DoubleSide }), { x: 0.62, y: 4.45 }, yard);
      const yardBulb = M(sph(0.07, 10, 8), glow("#ffc27a", 10), { x: 0.62, y: 4.4, cast: false }, yard);
      const yardL = new T.PointLight("#ffbf78", 45, 0, 2); yardL.position.set(0.62, 4.3, 0); yard.add(yardL);
      // interior ---------------------------------------------------
      const IN = buildInterior(cab, C, LX, LZ, floorM, planks);
      tower = { g, cab, low, trap, bolt, crank, wins, glass, LX, LZ, TOP, C, E, yardL, yardBulb, ...IN };
      return tower;
    }

    function buildInterior(cab, C, LX, LZ, floorM, planks) {
      const wood = mat("#6e4a2c", { rough: 0.7 });
      const darkM = mat("#3d434a", { rough: 0.38, metal: 0.45, env: 1.2 });
      // firefinder at the centre
      const ff = G({ x: 0.25, y: 0.1, z: -0.1 }, cab);
      M(cyl(0.07, 0.11, 1.0, 14), mat("#4b4f54", { metal: 0.6, rough: 0.4 }), { y: 0.5 }, ff);
      const mapT = textTex("ffmap", 512, 512, (q, w, h) => {
        q.fillStyle = "#a99e84"; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill();
        const R = rng(12); q.strokeStyle = "rgba(120,80,40,0.55)"; q.lineWidth = 1.5;
        for (let i = 0; i < 14; i++) { q.beginPath(); const cx = w / 2 + (R() - 0.5) * 200, cy = h / 2 + (R() - 0.5) * 200; for (let a = 0; a <= 6.3; a += 0.15) { const r = 30 + i * 9 + Math.sin(a * 3 + i) * 10; q.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } q.stroke(); }
        q.strokeStyle = "rgba(40,90,160,0.7)"; q.lineWidth = 3; q.beginPath(); q.moveTo(60, 300); q.bezierCurveTo(180, 260, 260, 420, 460, 380); q.stroke();
        q.fillStyle = "#3a2a1c"; q.font = "600 20px KitInter, sans-serif"; q.textAlign = "center";
        for (let d = 0; d < 360; d += 30) { const a = (d - 90) * D2R; q.fillText(String(d), w / 2 + Math.cos(a) * 228, h / 2 + Math.sin(a) * 228 + 7); }
        q.strokeStyle = "#3a2a1c"; q.lineWidth = 2; q.beginPath(); q.arc(w / 2, h / 2, 250, 0, 7); q.stroke();
      });
      M(cyl(0.45, 0.45, 0.04, 40), mat("#5a5048", { rough: 0.6 }), { y: 1.02 }, ff);
      M(new T.CircleGeometry(0.43, 48), mat("#ffffff", { map: mapT, rough: 0.8 }), { y: 1.045, rx: -90 }, ff);
      M(new T.TorusGeometry(0.44, 0.014, 8, 64), mat("#b8924c", { metal: 0.9, rough: 0.3 }), { y: 1.05, rx: 90 }, ff);
      const brass = mat("#b8924c", { metal: 0.9, rough: 0.3 });
      const alid = G({ y: 1.05, ry: 32 }, ff);                       // Osborne alidade: bar, front sight with a hair wire, rear peep sight
      M(box(0.024, 0.008, 0.86), brass, { y: 0.004 }, alid);
      M(box(0.04, 0.16, 0.006), brass, { y: 0.08, z: 0.43 }, alid);
      rod([0, 0.01, 0.43], [0, 0.155, 0.43], 0.0012, mat("#111"), alid, 4);
      M(box(0.03, 0.09, 0.006), brass, { y: 0.05, z: -0.43 }, alid);
      M(new T.TorusGeometry(0.006, 0.0018, 6, 12), mat("#111"), { y: 0.075, z: -0.432 }, alid);
      M(cyl(0.035, 0.035, 0.03, 16), brass, { y: 0.01 }, alid);
      // desk along the north wall with radio, lamp, log book, mug
      const desk = G({ x: 0.3, y: 0.1, z: -C + 0.38 }, cab);
      M(box(1.7, 0.045, 0.62), wood, { y: 0.74 }, desk);
      for (const [x, z] of [[-0.8, -0.27], [0.8, -0.27], [-0.8, 0.27], [0.8, 0.27]]) M(box(0.05, 0.74, 0.05), wood, { x, y: 0.37, z }, desk);
      const radio = G({ x: 0.36, y: 0.765, z: -0.06 }, desk);
      M(rbox(0.46, 0.19, 0.27, 0.02), darkM, { y: 0.095 }, radio);
      const dispT = textTex("radiodisp", 256, 64, (q, w, h) => { q.fillStyle = "#06140c"; q.fillRect(0, 0, w, h); q.fillStyle = "#58f08a"; q.font = "700 34px KitOswald, sans-serif"; q.fillText("CH 2", 14, 44); q.font = "600 24px KitInter, sans-serif"; q.fillText("151.400", 120, 42); });
      const disp = M(new T.PlaneGeometry(0.17, 0.045), new T.MeshBasicMaterial({ map: dispT, color: new T.Color(1, 1, 1) }), { x: 0.08, y: 0.12, z: 0.152, cast: false }, radio);
      disp.material.color.multiplyScalar(2.2);
      const grill = canvasTex("grill", 128, 128, (q, w, h) => { q.fillStyle = "#1c1e21"; q.fillRect(0, 0, w, h); q.fillStyle = "#050607"; for (let y = 10; y < h; y += 16) for (let x = 10; x < w; x += 16) { q.beginPath(); q.arc(x, y, 4.5, 0, 7); q.fill(); } });
      M(new T.PlaneGeometry(0.13, 0.13), mat("#ffffff", { map: grill, rough: 0.7 }), { x: -0.13, y: 0.095, z: 0.152, cast: false }, radio);
      for (let k = 0; k < 3; k++) M(cyl(0.016, 0.016, 0.025, 14), mat("#5a5f66", { metal: 0.7, rough: 0.35 }), { x: 0.02 + k * 0.06, y: 0.045, z: 0.155, rx: 90 }, radio);
      const tx = M(sph(0.008, 8, 6), glow("#ff2a1a", 1), { x: 0.19, y: 0.16, z: 0.152, cast: false }, radio);
      rod([0.2, 0.19, -0.08], [0.24, 0.72, -0.1], 0.004, mat("#1a1a1a"), radio, 4);
      const handset = M(rbox(0.05, 0.11, 0.035, 0.015), darkM, { x: -0.26, y: 0.1, z: 0.05, rz: 8 }, radio);
      const lamp = G({ x: -0.55, y: 0.765, z: -0.1 }, desk);
      M(cyl(0.07, 0.08, 0.025, 20), mat("#2e5a3d", { metal: 0.4, rough: 0.4 }), { y: 0.012 }, lamp);
      rod([0, 0.02, 0], [0.04, 0.3, 0.02], 0.008, mat("#9a9a96", { metal: 0.8, rough: 0.3 }), lamp, 6);
      rod([0.04, 0.3, 0.02], [0.14, 0.38, 0.08], 0.008, mat("#9a9a96", { metal: 0.8, rough: 0.3 }), lamp, 6);
      const shade = M(new T.ConeGeometry(0.085, 0.11, 22, 1, true), mat("#2e5a3d", { metal: 0.4, rough: 0.4, side: T.DoubleSide }), { x: 0.15, y: 0.37, z: 0.09, rx: 18, rz: -14 }, lamp);
      const bulb = M(sph(0.026, 12, 10), glow("#ffd9a0", 9), { x: 0.152, y: 0.335, z: 0.098, cast: false }, lamp);
      const lampL = new T.PointLight("#ffb062", 3.2, 0, 2);
      lampL.position.set(0.152, 0.315, 0.1); lampL.castShadow = true;
      lampL.shadow.mapSize.set(512, 512); lampL.shadow.camera.near = 0.05; lampL.shadow.camera.far = 7; lampL.shadow.bias = -0.002; lampL.shadow.radius = 3;
      lamp.add(lampL);
      const bookT = textTex("logbook", 256, 160, (q, w, h) => { q.fillStyle = "#efe7d3"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,80,140,0.35)"; for (let y = 22; y < h; y += 13) q.fillRect(8, y, w - 16, 1); q.fillStyle = "rgba(40,40,60,0.75)"; q.font = "500 11px KitInter, sans-serif"; const L = ["21:00  clear  RH 9%  wind W 12", "21:30  clear  no smoke", "21:45  all clear  radio in"]; L.forEach((s, i) => q.fillText(s, 12, 32 + i * 13)); q.fillStyle = "rgba(0,0,0,0.25)"; q.fillRect(w / 2 - 1, 0, 2, h); });
      M(box(0.36, 0.012, 0.25), mat("#ffffff", { map: bookT, rough: 0.9 }), { x: -0.1, y: 0.772, z: 0.05, ry: 6 }, desk);
      M(cyl(0.004, 0.004, 0.17, 6), mat("#e3b52f", { rough: 0.5 }), { x: 0.03, y: 0.782, z: 0.08, rz: 90, ry: 38 }, desk);   // pencil
      const mug = G({ x: -0.42, y: 0.765, z: 0.14 }, desk);
      M(cyl(0.035, 0.032, 0.09, 18), mat("#b9442c", { rough: 0.5 }), { y: 0.045 }, mug);
      M(new T.TorusGeometry(0.022, 0.006, 6, 14), mat("#b9442c", { rough: 0.5 }), { x: 0.04, y: 0.05, ry: 0 }, mug);
      // chair
      const chair = G({ x: 0.15, y: 0.1, z: -C + 1.05 }, cab);
      M(box(0.42, 0.04, 0.42), wood, { y: 0.46 }, chair);
      M(box(0.42, 0.45, 0.04), wood, { y: 0.7, z: 0.2 }, chair);
      for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) M(box(0.035, 0.46, 0.035), wood, { x, y: 0.23, z }, chair);
      // fire-danger dial on the lower north wall, left of the desk (a seed for the comments)
      const dangerT = textTex("danger", 512, 384, (q, w, h) => {
        q.fillStyle = "#6b4a2a"; q.fillRect(0, 0, w, h); q.fillStyle = "#efe6cf"; q.fillRect(12, 12, w - 24, h - 24);
        q.fillStyle = "#2a2018"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FIRE DANGER TODAY", w / 2, 70);
        const cx = w / 2, cy = h - 60, r = 190;
        const segs = [["LOW", "#3f9b4c"], ["MOD.", "#2f6fb8"], ["HIGH", "#e3c234"], ["V. HIGH", "#e8842c"], ["EXTREME", "#c8321f"]];
        segs.forEach(([s, c], i) => { q.beginPath(); q.moveTo(cx, cy); q.arc(cx, cy, r, Math.PI + (i * Math.PI) / 5, Math.PI + ((i + 1) * Math.PI) / 5); q.closePath(); q.fillStyle = c; q.fill();
          const a = Math.PI + ((i + 0.5) * Math.PI) / 5; q.save(); q.translate(cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68); q.rotate(a + Math.PI / 2); q.fillStyle = "#fff"; q.font = "700 24px KitOswald, sans-serif"; q.fillText(s, 0, 8); q.restore(); });
        q.fillStyle = "#efe6cf"; q.beginPath(); q.arc(cx, cy, 52, 0, 7); q.fill();
        const a = Math.PI + 0.92 * Math.PI; q.strokeStyle = "#1a1a1a"; q.lineWidth = 9; q.beginPath(); q.moveTo(cx, cy); q.lineTo(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95); q.stroke();
        q.fillStyle = "#1a1a1a"; q.beginPath(); q.arc(cx, cy, 16, 0, 7); q.fill();
      });
      M(box(0.56, 0.42, 0.02), mat("#ffffff", { map: dangerT, rough: 0.7 }), { x: -C + 0.04, y: 0.84, z: 0.85, ry: 90 }, cab);
      // topo map on the west wall
      const topoT = canvasTex("topo", 256, 192, (q, w, h) => { q.fillStyle = "#e4dcc0"; q.fillRect(0, 0, w, h); const R = rng(44); q.strokeStyle = "rgba(140,90,50,0.5)"; for (let i = 0; i < 18; i++) { q.beginPath(); const cx = R() * w, cy = R() * h; for (let a = 0; a <= 6.3; a += 0.2) { const r = 10 + (i % 6) * 9 + Math.sin(a * 4 + i) * 5; q.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } q.stroke(); } q.strokeStyle = "rgba(200,40,30,0.8)"; q.lineWidth = 2; q.strokeRect(118, 80, 14, 14); });
      M(box(0.66, 0.5, 0.02), mat("#ffffff", { map: topoT, rough: 0.85 }), { x: -1.35, y: 0.8, z: -C + 0.04 }, cab);
      M(box(0.012, 0.5, 0.68), mat("#ffffff", { map: topoT, rough: 0.85 }), { x: C - 0.045, y: 0.74, z: -1.35 }, cab);   // pinned on the east wall, north of the locker
      for (const [pz, py] of [[-0.31, 0.22], [0.31, 0.22], [-0.31, -0.22], [0.31, -0.22]]) M(sph(0.012, 8, 6), mat("#c8321f", { rough: 0.4 }), { x: C - 0.055, y: 0.74 + py, z: -1.35 + pz }, cab);
      // bunk on the west side
      const bunk = G({ x: -C + 0.48, y: 0.1, z: -0.62 }, cab);
      M(box(0.86, 0.06, 1.95), wood, { y: 0.4 }, bunk);
      M(box(0.82, 0.12, 1.9), mat("#4a5568", { rough: 0.95 }), { y: 0.49 }, bunk);
      M(box(0.84, 0.05, 1.3), mat("#7a2b24", { rough: 0.95 }), { y: 0.57, z: 0.3 }, bunk);
      M(rbox(0.5, 0.12, 0.3, 0.05), mat("#d9d4c8", { rough: 0.9 }), { y: 0.6, z: -0.72, rx: -90 }, bunk);
      // supply locker along the east wall: low cabinet under the windows, doors open
      const lk = G({ x: C - 0.3, y: 0.1, z: 0.25, ry: -90 }, cab); // its front faces -x (into the room)
      const lw = mat("#5d6b55", { rough: 0.6, metal: 0.2 });
      M(box(1.7, 0.03, 0.5), lw, { y: 0.9 }, lk); M(box(1.7, 0.03, 0.5), lw, { y: 0.02 }, lk);
      M(box(1.7, 0.02, 0.48), lw, { y: 0.46 }, lk);
      M(box(1.7, 0.9, 0.02), lw, { y: 0.45, z: -0.24 }, lk);
      M(box(0.02, 0.9, 0.5), lw, { x: -0.85, y: 0.45 }, lk); M(box(0.02, 0.9, 0.5), lw, { x: 0.85, y: 0.45 }, lk);
      const doorL = G({ x: -0.85, y: 0.46, z: 0.25 }, lk), doorR = G({ x: 0.85, y: 0.46, z: 0.25 }, lk);
      M(box(0.85, 0.86, 0.02), lw, { x: 0.425 }, doorL); M(box(0.85, 0.86, 0.02), lw, { x: -0.425 }, doorR);
      const canT = textTex("chili", 256, 128, (q, w, h) => { q.fillStyle = "#b8321e"; q.fillRect(0, 0, w, h); q.fillStyle = "#f2e2b8"; q.fillRect(0, 34, w, 60); q.fillStyle = "#7a1d10"; q.font = "700 40px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("CHILI", w / 2, 80); q.fillStyle = "#e8c35a"; q.fillRect(0, 98, w, 6); });
      const canG = new T.CylinderGeometry(0.042, 0.042, 0.115, 18);
      const canM = [mat("#ffffff", { map: canT, rough: 0.45, metal: 0.1 }), mat("#b7bcc1", { metal: 0.85, rough: 0.3 }), mat("#b7bcc1", { metal: 0.85, rough: 0.3 })];
      const cans = new T.InstancedMesh(canG, canM, 60);
      const dmy = new T.Object3D(); let ci = 0;
      for (let row = 0; row < 2; row++) for (let col = 0; col < 15; col++) for (let lay = 0; lay < 2; lay++) {
        dmy.position.set(-0.78 + col * 0.09 + (lay ? 0.045 : 0), 0.04 + 0.0575 + lay * 0.117, -0.12 + row * 0.1);
        dmy.rotation.set(0, (hash2(ci, 1, 3) - 0.5) * 1.2, 0); dmy.scale.setScalar(1); dmy.updateMatrix();
        cans.setMatrixAt(ci++, dmy.matrix);
      }
      cans.instanceMatrix.needsUpdate = true; cans.castShadow = true; cans.receiveShadow = true;
      lk.add(cans);
      const sackT = textTex("rice", 256, 256, (q, w, h) => { q.fillStyle = "#cdb88f"; q.fillRect(0, 0, w, h); const R = rng(8); for (let i = 0; i < 1600; i++) { q.fillStyle = `rgba(110,90,60,${R() * 0.25})`; q.fillRect(R() * w, R() * h, 2, 1); } q.fillStyle = "#6a4a2a"; q.font = "700 54px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("RICE", w / 2, 130); q.font = "600 26px KitInter, sans-serif"; q.fillText("10 LB", w / 2, 170); });
      const sackG = new T.LatheGeometry([[0, 0], [0.12, 0.005], [0.15, 0.06], [0.148, 0.2], [0.12, 0.29], [0.06, 0.33], [0.035, 0.37], [0.045, 0.39], [0, 0.39]].map(([r, y]) => new T.Vector2(r, y)), 22); sackG.scale(1, 1, 0.62);
      for (let k = 0; k < 2; k++) M(sackG, mat("#ffffff", { map: sackT, rough: 0.95 }), { x: -0.55 + k * 0.32, y: 0.475, z: 0.02, ry: (k - 0.5) * 24 }, lk);
      const jugM = new T.MeshPhysicalMaterial({ color: "#5aa0e6", roughness: 0.18, transmission: 0, transparent: true, opacity: 0.72, envMapIntensity: 1.2 });
      for (let k = 0; k < 4; k++) {
        const j = G({ x: 0.1 + k * 0.19, y: 0.47, z: 0.0 }, lk);
        M(rbox(0.16, 0.3, 0.13, 0.03), jugM, { y: 0.16 }, j);
        M(cyl(0.025, 0.025, 0.03, 10), mat("#e8e8e8", { rough: 0.5 }), { y: 0.33 }, j);
      }
      M(box(0.22, 0.16, 0.2), mat("#c43a30", { rough: 0.6 }), { x: 0.71, y: 0.12, z: 0.0 }, lk);
      const crossT = canvasTex("aidcross", 64, 64, (q, w, h) => { q.fillStyle = "#c43a30"; q.fillRect(0, 0, w, h); q.fillStyle = "#fff"; q.fillRect(26, 12, 12, 40); q.fillRect(12, 26, 40, 12); });
      M(new T.PlaneGeometry(0.1, 0.1), mat("#ffffff", { map: crossT, rough: 0.6 }), { x: 0.71, y: 0.12, z: 0.1012, cast: false }, lk);
      const label = (txt, x, y, wdt) => {
        const lt = textTex("lbl_" + txt, 256, 48, (q, w, h) => { q.fillStyle = "#f2efe6"; q.fillRect(0, 0, w, h); q.fillStyle = "#1c1c1c"; q.font = "700 30px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText(txt, w / 2, 35); });
        M(new T.PlaneGeometry(wdt || 0.2, 0.038), mat("#ffffff", { map: lt, rough: 0.5 }), { x, y, z: 0.252, cast: false }, lk);
      };
      label("CHILI · 60 CANS", -0.38, 0.0, 0.26); label("FIRST AID", 0.62, 0.0, 0.18);
      label("RICE · 20 LB", -0.4, 0.44, 0.2); label("WATER · 8 JUGS", 0.38, 0.44, 0.24); // first aid
      // a hanging flashlight + binoculars on the desk
      const binoc = G({ x: -0.3, y: 0.765, z: 0.2, ry: 25 }, desk);
      M(cyl(0.025, 0.025, 0.11, 12), darkM, { x: -0.03, y: 0.03, rx: 90 }, binoc); M(cyl(0.025, 0.025, 0.11, 12), darkM, { x: 0.03, y: 0.03, rx: 90 }, binoc);
      // a hanging propane lantern: a soft warm key over the middle of the cab
      const lan = G({ x: -0.25, y: 2.6, z: 0.15 }, cab);
      rod([0, 0, 0], [0, -0.42, 0], 0.006, mat("#222"), lan, 4);
      M(cyl(0.06, 0.07, 0.04, 14), mat("#2b2d2f", { metal: 0.6, rough: 0.4 }), { y: -0.44 }, lan);
      const globe = M(sph(0.055, 16, 12), glow("#ffd59a", 3), { y: -0.52, sy: 1.25, cast: false }, lan);
      M(cyl(0.065, 0.06, 0.03, 14), mat("#2b2d2f", { metal: 0.6, rough: 0.4 }), { y: -0.6 }, lan);
      const lanL = new T.PointLight("#ffb874", 1.4, 0, 2); lanL.position.set(0, -0.53, 0); lan.add(lanL);
      return { ff, desk, radio, disp, tx, handset, lamp, lampL, bulb, shade, mapT, chair, bunk, locker: lk, doorL, doorR, cans, binocDesk: binoc, mug, lantern: lan, lanL, globe };
    }

    // ---------------------------------------------------------------- Hazel v2: a maquette-grade stylised figure
    // swept superellipse shells (torso, sleeves, trouser legs), a sculpted head with layered eyes, morph-target brows and
    // lips (calm / worried / determined), hairline-cut hair with a parting, fringe locks and a tapered ponytail; woven
    // fabric normals with sheen, wrap-lit (subsurface-style) skin. The joint layout and set() API match v1.
    function sweepGeo(rings, seg, o) {
      o = o || {};
      seg = seg || 40;
      const n = o.n || 2.3, pos = [], uv = [], idx = [], R = rings.length, a0 = Math.PI; // seam at the back
      for (let i = 0; i < R; i++) {
        const [y, rx, rz, zo, xo] = rings[i];
        for (let j = 0; j <= seg; j++) {
          const a = a0 + (j / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
          const sx = Math.sign(s) * Math.pow(Math.abs(s), 2 / n), cz = Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
          pos.push((xo || 0) + rx * sx, y, (zo || 0) + rz * cz);
          uv.push(j / seg, (y - rings[0][0]) / (rings[R - 1][0] - rings[0][0] || 1));
        }
      }
      for (let i = 0; i < R - 1; i++) for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j, b = a + seg + 1;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      if (o.capBottom || o.capTop) {
        const add = (ri, up) => {
          const [y, , , zo, xo] = rings[ri], c = pos.length / 3;
          pos.push(xo || 0, y, zo || 0); uv.push(0.5, up ? 1 : 0);
          for (let j = 0; j < seg; j++) { const a = ri * (seg + 1) + j; if (up) idx.push(c, a, a + 1); else idx.push(c, a + 1, a); }
        };
        if (o.capBottom) add(0, false);
        if (o.capTop) add(R - 1, true);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      const nr = g.attributes.normal; // weld the seam normals
      for (let i = 0; i < R; i++) {
        const a = i * (seg + 1), b = a + seg;
        const x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1;
        nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l);
      }
      return g;
    }
    function tubeGeo(pts, segs, rad, rFn, o) {
      o = o || {};
      const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3().fromArray(p)));
      const fr = curve.computeFrenetFrames(segs, false);
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= segs; i++) {
        const u = i / segs, P = curve.getPointAt(u), N = fr.normals[i], B = fr.binormals[i], r = rFn(u), sq = o.squash ? o.squash(u) : 1;
        for (let j = 0; j <= rad; j++) {
          const a = (j / rad) * Math.PI * 2 + (o.rot || 0), c = Math.cos(a), s = Math.sin(a) * sq;
          pos.push(P.x + r * (c * N.x + s * B.x), P.y + r * (c * N.y + s * B.y), P.z + r * (c * N.z + s * B.z));
          uv.push(j / rad, u);
        }
      }
      for (let i = 0; i < segs; i++) for (let j = 0; j < rad; j++) {
        const a = i * (rad + 1) + j, b = a + rad + 1;
        idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }
    // tileable normal maps from height fields: plain weave (jacket), twill (trousers), strands (hair)
    function heightNormal(key, n, hFn, k) {
      return canvasTex(key, n, n, (g) => {
        const H = new Float32Array(n * n);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) H[y * n + x] = hFn(x, y, n);
        const im = g.createImageData(n, n);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const dx = H[y * n + ((x + 1) % n)] - H[y * n + ((x - 1 + n) % n)], dy = H[((y + 1) % n) * n + x] - H[((y - 1 + n) % n) * n + x];
          let nx = -dx * k, ny = -dy * k, nz = 1;
          const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
          const q = (y * n + x) * 4;
          im.data[q] = (nx * 0.5 + 0.5) * 255; im.data[q + 1] = (ny * 0.5 + 0.5) * 255; im.data[q + 2] = (nz * 0.5 + 0.5) * 255; im.data[q + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }, { repeat: true, linear: true });
    }
    const NM = {};
    function normals() {
      if (NM.weave) return NM;
      NM.weave = heightNormal("nm_weave", 128, (x, y) => {
        const P = 8, cx = Math.floor(x / P), cy = Math.floor(y / P), fx = (x % P) / P, fy = (y % P) / P;
        const over = (cx + cy) % 2 === 0;
        return (over ? Math.sin(Math.PI * fx) : Math.sin(Math.PI * fy)) * 0.8 + hash2(x, y, 3) * 0.15;
      }, 2.2);
      NM.twill = heightNormal("nm_twill", 128, (x, y) => {
        const P = 4, d = Math.floor((x + y) / P) % 4;
        return (d < 2 ? 1 : 0) * Math.sin(Math.PI * (((x + y) % P) / P)) + hash2(x, y, 5) * 0.1;
      }, 1.8);
      NM.strand = heightNormal("nm_strand", 256, (x, y) => Math.sin((x / 256) * Math.PI * 2 * 61 + Math.sin(y / 23) * 1.2) * 0.35 + Math.sin((x / 256) * Math.PI * 2 * 137 + 0.7) * 0.25 + hash2(x, 0, 9) * 0.5, 1.2);
      return NM;
    }
    function nmap(tex, rx, ry) { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); return t; }
    function pmat(hex, p) {
      p = p || {};
      const m = new T.MeshPhysicalMaterial({ color: hex, roughness: p.rough != null ? p.rough : 0.8, metalness: p.metal || 0, sheen: p.sheen || 0,
        sheenRoughness: p.sheenRough != null ? p.sheenRough : 0.6, clearcoat: p.cc || 0, clearcoatRoughness: p.ccRough != null ? p.ccRough : 0.3 });
      if (p.sheenColor) m.sheenColor = new T.Color(p.sheenColor);
      if (p.normalMap) { m.normalMap = p.normalMap; m.normalScale.set(p.ns || 0.4, p.ns || 0.4); }
      if (p.map) m.map = p.map;
      if (p.side != null) m.side = p.side;
      if (p.env != null) m.envMapIntensity = p.env;
      return m;
    }
    // wrap-lit diffuse with a warm terminator scatter: skin reads soft, not plastic
    const SKIN_DIFF = "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Physical";
    const SKIN_WRAP = "float wNL = saturate( ( dot( geometryNormal, directLight.direction ) + 0.55 ) / 1.55 );\n\tvec3 sssT = vec3( 1.0, 0.40, 0.28 ) * max( wNL - dotNL, 0.0 ) * 0.9;\n\treflectedLight.directDiffuse += ( vec3( dotNL ) + sssT ) * directLight.color * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Physical";
    function skinMat(hex) {
      const m = pmat(hex, { rough: 0.52, sheen: 0.35, sheenColor: "#ffb39a", sheenRough: 0.45 });
      m.onBeforeCompile = (sh) => {
        const chunk = T.ShaderChunk.lights_physical_pars_fragment;
        if (chunk.indexOf(SKIN_DIFF) >= 0) sh.fragmentShader = sh.fragmentShader.replace("#include <lights_physical_pars_fragment>", chunk.replace(SKIN_DIFF, SKIN_WRAP));
      };
      m.customProgramCacheKey = () => "skin-wrap";
      return m;
    }
    function hazel(p) {
      p = p || {};
      const nm = normals();
      const root = G({}, scene);
      const skin = skinMat("#ebb8a0");
      // v2.1 re-dress options (defaults = Hazel)
      const JS = p.jacketSheen || "#ffb488", TR = p.trim || "#7d3414", TRS = p.trimSheen || "#e0906a";
      const jacket = pmat(p.jacket || "#c75b22", { rough: p.jacketRough || 0.78, sheen: 0.55, sheenColor: JS, sheenRough: 0.55, normalMap: nmap(nm.weave, 12, 12), ns: 0.3 });
      const sleeveM = pmat(p.jacket || "#c75b22", { rough: p.jacketRough || 0.78, sheen: 0.55, sheenColor: JS, sheenRough: 0.55, normalMap: nmap(nm.weave, 7, 6), ns: 0.3 });
      const trim = pmat(TR, { rough: 0.85, sheen: 0.4, sheenColor: TRS, normalMap: nmap(nm.twill, 8, 2), ns: 0.6 });
      const seamM = pmat(p.seam || "#9c4318", { rough: 0.9 });
      const pants = pmat(p.pants || "#4a5434", { rough: 0.88, sheen: 0.3, sheenColor: p.pantsSheen || "#a8b38a", normalMap: nmap(nm.twill, 4, 6), ns: 0.55 });
      const bootM = pmat(p.boot || "#5a3a24", { rough: 0.5, cc: 0.35, ccRough: 0.45 });
      const soleM = pmat(p.sole || "#1e1b19", { rough: 0.85 });
      const HB = p.hair || "#8c3c1d", HS = p.hairStreaks || ["rgba(70,24,10,0.35)", "rgba(176,88,44,0.3)", "rgba(214,128,70,0.28)"];
      const hairCol = canvasTex("haircol_" + HB + HS.join(""), 256, 32, (g, w, h) => {
        const R = rng(23); g.fillStyle = HB; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 260; i++) { const v = R(); g.fillStyle = v < 0.45 ? HS[0] : v < 0.8 ? HS[1] : HS[2]; g.fillRect(R() * w, 0, 1 + R() * 2, h); }
      }, { repeat: true });
      const HSH = p.hairSheen || "#ffb070";
      const hairM = pmat("#ffffff", { rough: 0.4, sheen: 0.8, sheenColor: HSH, sheenRough: 0.3, normalMap: nmap(nm.strand, 1, 1), ns: 0.3, map: hairCol });
      const lipM = skinMat(p.lip || "#c77466");
      const hairTubeM = pmat("#ffffff", { rough: 0.42, sheen: 0.8, sheenColor: HSH, sheenRough: 0.3, normalMap: nmap(normals().strand, 1, 1), ns: 0.14, map: hairCol });
      const browM = pmat(p.brow || "#5d2412", { rough: 0.7 });
      const metal = pmat("#3a3a3c", { rough: 0.3, metal: 0.8 });
      const black = mat("#0c0a09", { rough: 0.25 });
      const SM = (geo, m, q, parent) => M(geo, m, Object.assign({ cast: true }, q || {}), parent);

      // -------- hips + trousers
      const hips = G({ y: 0.93 }, root);
      SM(sweepGeo([[-0.13, 0.12, 0.09, 0.0], [-0.08, 0.15, 0.104, 0.0], [-0.02, 0.158, 0.108, 0.0], [0.05, 0.152, 0.104, 0.0]], 36, { n: 2.2, capBottom: true }), pants, {}, hips);
      const legs = [];
      for (const s of [-1, 1]) {
        const th = G({ x: s * 0.085, y: -0.04 }, hips);
        SM(sweepGeo([[-0.45, 0.056, 0.058, 0.0], [-0.38, 0.058, 0.061, 0.004], [-0.25, 0.066, 0.069, 0.006], [-0.1, 0.074, 0.078, 0.004], [0.04, 0.078, 0.082, 0.0]], 24), pants, {}, th);
        const kn = G({ y: -0.43 }, th);
        SM(sph(0.056, 16, 12), pants, { sz: 1.05 }, kn);
        SM(sweepGeo([[-0.44, 0.06, 0.063, 0.01], [-0.405, 0.054, 0.056, 0.004], [-0.33, 0.047, 0.05, 0.0], [-0.2, 0.052, 0.056, 0.004], [-0.06, 0.056, 0.058, 0.003], [0.02, 0.057, 0.058, 0.0]], 24), pants, {}, kn);
        const ft = G({ y: -0.43 }, kn);
        SM(cyl(0.046, 0.05, 0.09, 18), bootM, { y: -0.015 }, ft);                                          // boot shaft
        const vamp = new T.CapsuleGeometry(0.044, 0.12, 6, 18); vamp.rotateX(Math.PI / 2);
        SM(vamp, bootM, { y: -0.048, z: 0.042, sx: 1.08, sy: 0.7 }, ft);                                   // foot
        SM(rbox(0.1, 0.024, 0.255, 0.045), soleM, { y: -0.077, z: 0.04 }, ft);                            // sole
        SM(box(0.085, 0.03, 0.06), soleM, { y: -0.068, z: -0.055 }, ft);                                   // heel
        for (let k = 0; k < 3; k++) SM(box(0.05, 0.004, 0.006), mat("#c8b89a", { rough: 0.8 }), { y: -0.022 + k * 0.016, z: 0.044 + k * 0.004, rx: -20, cast: false }, ft); // laces
        legs.push({ th, kn, ft });
      }

      // -------- torso (jacket)
      const spine = G({ y: 0.05 }, hips);
      const TOR = [[-0.1, 0.168, 0.118, 0.004], [-0.075, 0.166, 0.116, 0.004], [-0.04, 0.158, 0.11, 0.002], [0.05, 0.15, 0.104, 0.0],
        [0.14, 0.152, 0.106, 0.004], [0.24, 0.165, 0.115, 0.012], [0.33, 0.176, 0.12, 0.014], [0.4, 0.182, 0.114, 0.008],
        [0.445, 0.176, 0.103, 0.0], [0.48, 0.148, 0.092, -0.004], [0.51, 0.104, 0.078, -0.006], [0.53, 0.07, 0.064, -0.006], [0.545, 0.055, 0.055, -0.006]];
      SM(sweepGeo(TOR, 48, { n: 2.4, capTop: true }), jacket, {}, spine);
      SM(sweepGeo([[-0.108, 0.174, 0.124, 0.004], [-0.07, 0.172, 0.122, 0.004]], 48, { n: 2.4 }), trim, {}, spine);   // hem band
      const frontZ = (y) => { // front surface z of the torso at height y (interpolated)
        for (let i = 0; i < TOR.length - 1; i++) if (y <= TOR[i + 1][0]) { const u = (y - TOR[i][0]) / (TOR[i + 1][0] - TOR[i][0]); return lerp(TOR[i][3] + TOR[i][2], TOR[i + 1][3] + TOR[i + 1][2], u); }
        return TOR[TOR.length - 1][2];
      };
      const surf = (y, a, out) => { // a point on the torso surface at height y, angle a (0 = front, + toward her left)
        let i = 0; while (i < TOR.length - 2 && y > TOR[i + 1][0]) i++;
        const u = clamp((y - TOR[i][0]) / (TOR[i + 1][0] - TOR[i][0]), 0, 1);
        const rx = lerp(TOR[i][1], TOR[i + 1][1], u), rz = lerp(TOR[i][2], TOR[i + 1][2], u), zo = lerp(TOR[i][3], TOR[i + 1][3], u), n = 2.4;
        const s = Math.sin(a), c = Math.cos(a);
        return [rx * Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * (out || 1.006), y, zo + rz * Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * (out || 1.006)];
      };
      // zip, seams, pockets
      const zipPts = []; for (let y = -0.1; y <= 0.53; y += 0.04) zipPts.push([0, y, frontZ(y) + 0.003]);
      SM(tubeGeo(zipPts, 40, 6, () => 0.0042), metal, { cast: false }, spine);
      SM(rbox(0.012, 0.03, 0.006, 0.004), metal, { y: 0.47, z: frontZ(0.47) + 0.008, cast: false }, spine);   // zip pull
      const yoke = []; for (let a = -1.75; a <= 1.75; a += 0.12) yoke.push(surf(0.375, a));
      SM(tubeGeo(yoke, 40, 5, () => 0.0026), seamM, { cast: false }, spine);
      const yokeB = []; for (let a = 1.9; a <= 4.4; a += 0.12) yokeB.push(surf(0.39, a));
      SM(tubeGeo(yokeB, 30, 5, () => 0.0026), seamM, { cast: false }, spine);
      for (const s of [-1, 1]) {
        const side = []; for (let y = -0.07; y <= 0.4; y += 0.05) side.push(surf(y, s * Math.PI / 2));
        SM(tubeGeo(side, 20, 5, () => 0.0024), seamM, { cast: false }, spine);
        if (p.handPockets === false) continue;
        const pa = s * 0.62, pp = surf(0.03, pa, 1.02);
        SM(rbox(0.09, 0.075, 0.012, 0.012), jacket, { x: pp[0], y: pp[1], z: pp[2], ry: (pa * 180) / Math.PI * 0.8 }, spine);               // pocket bag
        const fp = surf(0.072, pa, 1.05);
        SM(rbox(0.096, 0.026, 0.016, 0.008), trim, { x: fp[0], y: fp[1], z: fp[2], ry: (pa * 180) / Math.PI * 0.8, rx: -8 }, spine);         // flap
      }
      if (p.chestPocket !== false) {
        const cp = surf(0.31, 0.42, 1.02);
        SM(rbox(0.07, 0.075, 0.008, 0.01), jacket, { x: cp[0], y: cp[1], z: cp[2], ry: 18 }, spine);                                          // chest pocket
        const cz = surf(0.335, 0.42, 1.06);
        SM(box(0.06, 0.004, 0.004), metal, { x: cz[0], y: cz[1], z: cz[2], ry: 18, cast: false }, spine);
      }
      // stand collar (open at the front) + undershirt
      const colG = new T.CylinderGeometry(0.074, 0.084, 0.075, 30, 1, true, (32 * Math.PI) / 180, (296 * Math.PI) / 180);
      SM(colG, pmat(TR, { rough: 0.85, sheen: 0.4, sheenColor: TRS, normalMap: nmap(nm.twill, 8, 1), ns: 0.6, side: T.DoubleSide }), { y: 0.565, z: -0.006, rx: -6 }, spine);
      SM(new T.TorusGeometry(0.075, 0.006, 6, 30, (296 * Math.PI) / 180), trim, { y: 0.602, z: -0.008, rx: 90, rz: 90 + 32, cast: false }, spine);
      SM(cyl(0.05, 0.056, 0.05, 18), pmat(p.under || "#3f5a3a", { rough: 0.85, normalMap: nmap(nm.weave, 3, 1), ns: 0.4 }), { y: 0.55 }, spine);

      // -------- neck + head
      const neck = G({ y: 0.53 }, spine);
      SM(cyl(0.041, 0.047, 0.11, 18), skin, { y: 0.05 }, neck);
      const head = G({ y: 0.05 }, neck);
      head.rotation.order = "YXZ";
      const hg = new T.SphereGeometry(0.1, 56, 44);
      const EYE = [[-0.033, 0.012, 0.0765], [0.033, 0.012, 0.0765]];
      (function sculpt() {
        const pa = hg.attributes.position;
        for (let i = 0; i < pa.count; i++) {
          let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
          const yy = y / 0.1;
          let sx = 1 - 0.22 * sstep(0.05, -0.9, yy);                                                    // jaw tapers to the chin
          if (z < 0) { z *= 1.1; y *= 1.02; }                                                            // cranium
          if (z > 0 && yy > 0.15) z *= 0.97;                                                             // forehead
          if (z > 0 && yy < -0.55) z *= 1 + 0.1 * sstep(-0.55, -0.9, yy);                                // chin forward
          x *= sx * 0.92; y *= 1.12;
          const cheek = Math.exp(-Math.pow((Math.abs(x) - 0.052) / 0.022, 2) - Math.pow((y + 0.025) / 0.03, 2)) * (z > 0 ? 1 : 0);
          z += cheek * 0.004;
          for (const E of EYE) {                                                                         // eye sockets
            const d = Math.hypot(x - E[0], y - E[1], z - (E[2] + 0.013));
            if (d < 0.031) { const k = Math.pow(1 - d / 0.031, 2) * 0.009; const l = Math.hypot(x, y, z); x -= (x / l) * k; y -= (y / l) * k; z -= (z / l) * k; }
          }
          pa.setXYZ(i, x, y, z);
        }
        hg.computeVertexNormals();
        const cols = [];
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
          const cheek = Math.exp(-Math.pow((Math.abs(x) - 0.05) / 0.022, 2) - Math.pow((y + 0.022) / 0.024, 2)) * (z > 0.02 ? 1 : 0);
          const nose = Math.exp(-Math.pow(x / 0.012, 2) - Math.pow((y + 0.02) / 0.014, 2)) * (z > 0.06 ? 1 : 0);
          const under = sstep(-0.06, -0.11, y) * 0.12;
          cols.push(1 - under * 0.6, 1 - 0.13 * cheek - 0.1 * nose - under, 1 - 0.15 * cheek - 0.12 * nose - under * 0.8);
        }
        hg.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      })();
      const skinV = skinMat("#ebb8a0"); skinV.vertexColors = true;
      SM(hg, skinV, { y: 0.1 }, head);
      const face = G({ y: 0.1 }, head);   // face features in head-centre coordinates
      const fz = (X, Y) => {                // front surface z of the sculpted head at (X, Y): same steps as sculpt()
        const y = Y / 1.12, yy = y / 0.1, sx = 1 - 0.22 * sstep(0.05, -0.9, yy), x = X / (0.92 * sx);
        let z = Math.sqrt(Math.max(0, 0.01 - x * x - y * y));
        if (yy > 0.15) z *= 0.97;
        if (yy < -0.55) z *= 1 + 0.1 * sstep(-0.55, -0.9, yy);
        return z;
      };
      for (const s of [-1, 1]) {           // ears
        SM(sph(0.019, 14, 10), skin, { x: s * 0.088, y: -0.002, z: -0.008, sx: 0.42, sy: 1.0, sz: 0.72 }, face);
        SM(sph(0.011, 10, 8), mat("#b9725c", { rough: 0.6 }), { x: s * 0.0915, y: -0.002, z: -0.004, sx: 0.25, sy: 0.75, sz: 0.5, cast: false }, face);
      }
      // nose: bridge, tip, alae
      const bridge = new T.CapsuleGeometry(0.0054, 0.021, 4, 10);
      SM(bridge, skin, { x: 0, y: -0.004, z: fz(0, -0.004) + 0.0008, rx: -18, cast: false }, face);
      SM(sph(0.0094, 14, 10), skin, { y: -0.021, z: fz(0, -0.021) + 0.0036, sy: 0.85, sz: 0.85, cast: false }, face);
      for (const s of [-1, 1]) SM(sph(0.0054, 10, 8), skin, { x: s * 0.0082, y: -0.023, z: fz(0.0082, -0.023) + 0.0004, cast: false }, face);
      // eyes: sclera, iris cap (textured), catchlight, upper + lower lids with a lash line
      const irisT = canvasTex("iris", 64, 64, (g, w, h) => {
        for (let y = 0; y < h; y++) {
          const v = y / h;
          let c = v < 0.32 ? "#0b0705" : v < 0.88 ? `rgb(${Math.round(lerp(120, 64, (v - 0.32) / 0.56))},${Math.round(lerp(82, 46, (v - 0.32) / 0.56))},${Math.round(lerp(44, 26, (v - 0.32) / 0.56))})` : "#2a160c";
          g.fillStyle = c; g.fillRect(0, y, w, 1);
        }
        const R = rng(17); g.globalAlpha = 0.35;
        for (let i = 0; i < 40; i++) { g.fillStyle = R() < 0.5 ? "#c08a4a" : "#3a2210"; g.fillRect(R() * w, h * 0.34, 1, h * 0.5); }
        g.globalAlpha = 1;
      });
      const scleraM = pmat("#f2ece4", { rough: 0.25, cc: 1, ccRough: 0.08 });
      const irisM = new T.MeshPhysicalMaterial({ map: irisT, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
      const eyes = [], lids = [], lowLids = [];
      for (const E of EYE) {
        const eg = G({ x: E[0], y: E[1], z: E[2] }, face);
        eg.rotation.order = "YXZ";
        SM(sph(0.0158, 24, 18), scleraM, { cast: false }, eg);
        const cap = new T.SphereGeometry(0.01595, 24, 10, 0, Math.PI * 2, 0, 0.62); cap.rotateX(Math.PI / 2);
        SM(cap, irisM, { cast: false }, eg);
        SM(sph(0.0021, 8, 6), glow("#ffffff", 2.2), { x: 0.0042, y: 0.0045, z: 0.0156, cast: false }, eg);   // catchlight
        const lidG = G({ x: E[0], y: E[1], z: E[2] }, face); lidG.rotation.order = "XYZ";
        SM(new T.SphereGeometry(0.0168, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), skin, { cast: false }, lidG);
        SM(new T.TorusGeometry(0.0168, 0.0012, 6, 24, Math.PI), black, { rx: 90, rz: 180, cast: false }, lidG); // lash line on the front edge
        const low = G({ x: E[0], y: E[1], z: E[2] }, face);
        SM(new T.SphereGeometry(0.0164, 20, 8, 0, Math.PI * 2, Math.PI * 0.74, Math.PI * 0.26), skin, { cast: false }, low);
        eyes.push(eg); lids.push(lidG); lowLids.push(low);
      }
      // brows + lips as morph targets (neutral base; [0] worried, [1] determined | lips [0] smile, [1] worried, [2] determined)
      function morphTube(sets, segs, rad, rFn) {
        const base = tubeGeo(sets[0], segs, rad, rFn);
        base.morphAttributes.position = sets.slice(1).map((pts) => tubeGeo(pts, segs, rad, rFn).attributes.position);
        return base;
      }
      const brows = [];
      for (const s of [-1, 1]) {
        const B = (yi, ym, yo) => [[s * 0.011, yi, fz(0.011, yi) + 0.003], [s * 0.031, ym, fz(0.031, ym) + 0.003], [s * 0.051, yo, fz(0.051, yo) + 0.0028]];
        const g = morphTube([B(0.041, 0.048, 0.043), B(0.05, 0.051, 0.042), B(0.034, 0.045, 0.043)],
          14, 6, (u) => 0.0048 - Math.abs(u - 0.35) * 0.0034);
        const b = SM(g, browM, { cast: false }, face);
        b.morphTargetInfluences = [0, 0];
        brows.push(b);
      }
      const UL = (cy, dx, dz) => [[-0.017 * dx, -0.044 + cy, fz(0.017 * dx, -0.044 + cy) + 0.002 + dz], [-0.008, -0.0418, fz(0.008, -0.0418) + 0.0042], [0, -0.0426, fz(0, -0.0426) + 0.0048], [0.008, -0.0418, fz(0.008, -0.0418) + 0.0042], [0.017 * dx, -0.044 + cy, fz(0.017 * dx, -0.044 + cy) + 0.002 + dz]];
      const LL = (cy, cc) => [[-0.0145, -0.0466 + cc, fz(0.0145, -0.0466 + cc) + 0.0022], [0, -0.0508 + cy, fz(0, -0.0508 + cy) + 0.0055], [0.0145, -0.0466 + cc, fz(0.0145, -0.0466 + cc) + 0.0022]];
      const upLip = SM(morphTube([UL(0, 1, 0), UL(0.0042, 1.02, -0.002), UL(-0.0035, 0.98, 0), UL(-0.0008, 0.94, 0.0005)], 16, 6, (u) => 0.0024 + Math.sin(Math.PI * u) * 0.0012), lipM, { cast: false }, face);
      const loLip = SM(morphTube([LL(0, 0), LL(0.001, 0.0035), LL(-0.0032, -0.003), LL(0.0012, -0.0004)], 12, 6, (u) => 0.0026 + Math.sin(Math.PI * u) * 0.0016), lipM, { cast: false }, face);
      upLip.morphTargetInfluences = [0, 0, 0]; loLip.morphTargetInfluences = [0, 0, 0];
      SM(sph(0.012, 12, 8), mat("#3a1612", { rough: 0.9 }), { y: -0.047, z: fz(0, -0.047) - 0.002, sx: 1.25, sy: 0.32, sz: 0.3, cast: false }, face);  // mouth interior

      // -------- hair: hairline-cut cap with a side parting and volume, fringe locks, ponytail with a tie
      const hairY = (az) => { const a = Math.abs(az); const P = [[0, 0.68], [0.45, 0.64], [0.95, 0.44], [1.35, 0.12], [1.75, -0.25], [2.25, -0.72], [Math.PI, -0.93]];
        for (let i = 0; i < P.length - 1; i++) if (a <= P[i + 1][0]) return lerp(P[i][1], P[i + 1][1], (a - P[i][0]) / (P[i + 1][0] - P[i][0])); return -0.6; };
      (function hairCap() {
        const g = new T.SphereGeometry(1, 64, 48);
        const pa = g.attributes.position, keep = new Uint8Array(pa.count);
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), az = Math.atan2(x, z);
          keep[i] = y > hairY(az) ? 1 : 0;
          const part = Math.exp(-Math.pow((x - 0.26) / 0.05, 2)) * sstep(-0.3, 0.2, z) * sstep(0.3, 0.6, y);       // parting groove
          const lift = Math.exp(-Math.pow((x - 0.26) / 0.16, 2)) * sstep(-0.2, 0.3, z) * sstep(0.2, 0.7, y);      // volume beside it
          const locks = 0.006 * Math.sin(az * 9 + y * 5) * sstep(0.75, 0.1, y) + 0.004 * Math.sin(az * 23 + 1.3);  // soft sculpted locks
          const vol = 0.07 + 0.035 * sstep(0.3, -0.5, y) - 0.035 * part + 0.025 * lift + locks;
          let X = x * (1 + vol), Y = y * (1 + vol), Z = z * (1 + vol);
          X *= 0.1 * 0.92 * (1 - 0.18 * sstep(0.0, -0.8, y)); Y *= 0.1 * 1.13; Z *= 0.1 * (z < 0 ? 1.1 : 0.985);
          pa.setXYZ(i, X, Y, Z);
        }
        const ix = g.index.array, out = [];
        for (let i = 0; i < ix.length; i += 3) if (keep[ix[i]] && keep[ix[i + 1]] && keep[ix[i + 2]]) out.push(ix[i], ix[i + 1], ix[i + 2]);
        g.setIndex(out);
        g.computeVertexNormals();
        SM(g, hairM, { y: 0.102 }, head);
      })();
      // fringe: a swept lock from the parting across the forehead to her right temple, and a smaller lock to the left
      SM(tubeGeo([[0.03, 0.084, fz(0.03, 0.084) + 0.012], [0.004, 0.077, fz(0.004, 0.077) + 0.012], [-0.03, 0.064, fz(0.03, 0.064) + 0.011], [-0.062, 0.042, fz(0.062, 0.042) + 0.01], [-0.082, 0.01, fz(0.082, 0.01) + 0.009]], 28, 10,
        (u) => 0.028 * (1 - u * 0.65), { squash: () => 0.3 }), hairTubeM, { y: 0.1 }, head);
      SM(tubeGeo([[0.036, 0.084, fz(0.036, 0.084) + 0.011], [0.064, 0.062, fz(0.064, 0.062) + 0.01], [0.084, 0.024, fz(0.084, 0.024) + 0.009]], 18, 8, (u) => 0.02 * (1 - u * 0.6), { squash: () => 0.34 }), hairTubeM, { y: 0.1 }, head);
      const PP = p.pony || {};
      const pony = G({ y: PP.y != null ? PP.y : 0.158, z: PP.z != null ? PP.z : -0.098 }, head);
      pony.visible = p.pony !== false;
      SM(new T.TorusGeometry(0.023, 0.0085, 8, 18), pmat(p.tie || "#2f6b3a", { rough: 0.55, sheen: 0.4 }), { z: -0.008, rx: 72 }, pony);   // hair tie
      const ponyIn = G({}, pony);
      SM(tubeGeo([[0, 0.002, -0.006], [0, -0.006, -0.05], [0, -0.05, -0.078], [0, -0.115, -0.07], [0, -0.18, -0.052], [0, -0.235, -0.04]], 40, 12,
        (u) => (u < 0.08 ? 0.022 : 0.022 + 0.012 * Math.sin(Math.PI * Math.min(1, (u - 0.08) / 0.5))) * (1 - 0.82 * sstep(0.45, 1.0, u)), { squash: () => 0.82 }), hairTubeM, {}, ponyIn);
      SM(tubeGeo([[0.008, -0.004, -0.012], [0.016, -0.04, -0.06], [0.012, -0.12, -0.072], [0.004, -0.2, -0.05]], 24, 8, (u) => 0.012 * (1 - 0.85 * u), { squash: () => 0.8 }), hairTubeM, {}, ponyIn);

      // -------- arms (sleeves, cuffs, mitten hands with thumbs)
      const arms = [];
      for (const s of [-1, 1]) {
        const sh = G({ x: s * 0.16, y: 0.42 }, spine);
        sh.rotation.order = "XZY";
        SM(sph(0.054, 18, 14), sleeveM, { sx: 0.9 }, sh);
        SM(sweepGeo([[-0.3, 0.048, 0.05, 0.0], [-0.2, 0.052, 0.054, 0.0], [-0.08, 0.056, 0.058, 0.0], [0.02, 0.058, 0.06, 0.0]], 22), sleeveM, {}, sh);
        const el = G({ y: -0.28 }, sh);
        SM(sph(0.051, 16, 12), sleeveM, {}, el);
        SM(sweepGeo([[-0.255, 0.043, 0.045, 0.0], [-0.15, 0.046, 0.048, 0.0], [-0.04, 0.05, 0.052, 0.0], [0.02, 0.051, 0.053, 0.0]], 22), sleeveM, {}, el);
        SM(sweepGeo([[-0.275, 0.047, 0.049, 0.0], [-0.236, 0.048, 0.05, 0.0]], 22, { n: 2 }), trim, {}, el);   // cuff
        const hand = G({ y: -0.29 }, el);
        SM(cyl(0.026, 0.029, 0.04, 14), skin, { y: 0.01 }, hand);
        SM(sph(0.038, 16, 12), skin, { y: -0.03, sx: 0.48, sy: 1.08, sz: 0.92 }, hand);                       // palm (thin across x)
        const fing = G({ y: -0.058 }, hand);
        SM(rbox(0.026, 0.06, 0.07, 0.012), skin, { y: -0.026 }, fing);
        const thumb = new T.CapsuleGeometry(0.011, 0.03, 4, 10); thumb.translate(0, -0.015, 0);
        SM(thumb, skin, { x: -s * 0.006, y: -0.02, z: 0.03, rx: -38, rz: -s * 22 }, hand);
        arms.push({ sh, el, hand, fing, s });
      }

      // -------- tools: binoculars (at the face), radio handset (right hand), flashlight (right hand) + spot + beam
      const binoc = G({ y: 0.11, z: 0.14 }, head);
      for (const s of [-1, 1]) SM(cyl(0.024, 0.026, 0.1, 14), black, { x: s * 0.034, rx: 90 }, binoc);
      const mic = SM(rbox(0.045, 0.1, 0.03, 0.012), mat("#25282b", { rough: 0.45 }), { y: -0.07, z: 0.03 }, arms[0].hand);
      const flash = G({ y: -0.07, z: 0.0, rx: 90 }, arms[0].hand);
      SM(cyl(0.022, 0.018, 0.16, 12), mat("#2b2e31", { metal: 0.6, rough: 0.4 }), { rx: 90, z: 0.06 }, flash);
      SM(sph(0.02, 10, 8), glow("#fff4dc", 6), { z: 0.14, sz: 0.3, cast: false }, flash);
      const spot = new T.SpotLight("#ffe9c8", 0, 26, 18 * D2R, 0.55, 1.6);
      spot.position.set(0, 0, 0.14); spot.target.position.set(0, 0, 2); flash.add(spot, spot.target);
      const beamM = new T.ShaderMaterial({
        uniforms: { k: { value: 0 } },
        vertexShader: "varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform float k; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float a = f * pow(vY, 1.8) * k; gl_FragColor = vec4(vec3(1.0, 0.92, 0.78) * a, a); }",
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      });
      const beamG = new T.ConeGeometry(1.6, 9, 24, 1, true); beamG.translate(0, -4.5, 0); beamG.rotateX(-Math.PI / 2);
      M(beamG, beamM, { z: 0.15, cast: false, receive: false, nodepth: true }, flash);

      // -------- poses (degrees) and expressions
      const POSES = {
        stand: { arms: [[4, -7, -10], [4, 7, -10]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [0, 0], curl: [30, 30] },
        binoc: { arms: [[-78, 26, -122], [-78, -26, -122]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-4, 0], curl: [80, 80] },
        radio: { arms: [[-60, 20, -140], [6, 7, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [3, 0], curl: [80, 30] },
        rail: { arms: [[-52, 12, -18], [-52, -12, -18]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [12, 0], curl: [65, 65] },
        think: { arms: [[-20, 18, -138], [10, 6, -70]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [75, 50] },
        sit: { arms: [[-52, -4, -42], [-48, 6, -50]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [10, 0], curl: [55, 35] },
        flash: { arms: [[-78, -6, -6], [8, 7, -10]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [85, 30] },
        winch: { arms: [[-62, -10, -40], [-55, 10, -46]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [10, 0], curl: [80, 80] },
        crouch: { arms: [[-70, -6, -20], [-60, 8, -30]], legs: [[-70, 110], [-40, 80]], hipY: 0.62, spine: [30, 0], curl: [60, 60] },
      };
      const EXPR = {
        calm: { bw: 0, bd: 0, lid: -36, low: 8, ms: 0.65, mw: 0, md: 0 },
        neutral: { bw: 0, bd: 0, lid: -38, low: 6, ms: 0.15, mw: 0, md: 0 },
        worried: { bw: 1, bd: 0, lid: -50, low: 2, ms: 0, mw: 1, md: 0 },
        determined: { bw: 0, bd: 1, lid: -22, low: 14, ms: 0, mw: 0, md: 1 },
      };
      function lerpPose(a, b, k) {
        const out = { arms: [[0, 0, 0], [0, 0, 0]], legs: [[0, 0], [0, 0]], hipY: lerp(a.hipY, b.hipY, k), spine: [lerp(a.spine[0], b.spine[0], k), lerp(a.spine[1], b.spine[1], k)], curl: [lerp(a.curl[0], b.curl[0], k), lerp(a.curl[1], b.curl[1], k)] };
        for (let i = 0; i < 2; i++) { for (let j = 0; j < 3; j++) out.arms[i][j] = lerp(a.arms[i][j], b.arms[i][j], k); for (let j = 0; j < 2; j++) out.legs[i][j] = lerp(a.legs[i][j], b.legs[i][j], k); }
        return out;
      }
      function lerpExpr(a, b, k) { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; }
      function blinkAt(t) { const ph = (t + 0.7) % 3.7; return ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0; }
      function set(s) {
        s = s || {};
        const P = lerpPose(POSES[s.pose || "stand"], POSES[s.pose2 || s.pose || "stand"], s.k || 0);
        if (s.armR) P.arms[0] = s.armR;
        root.position.fromArray(s.pos || [0, 0, 0]);
        root.rotation.y = (s.ry || 0) * D2R;
        root.visible = s.visible !== false;
        const t = s.t || 0, br = s.br != null ? s.br : Math.sin(t * 1.6) * 0.004;   // v2.1: s.br overrides the breath (a slow, deep one)
        hips.position.y = P.hipY;
        spine.rotation.set((P.spine[0] + (s.lean || 0)) * D2R, (P.spine[1] + (s.twist || 0)) * D2R, 0);
        spine.scale.set(1 + br, 1 + br * 0.6, 1 + br);
        for (let i = 0; i < 2; i++) {
          const a = arms[i], A = P.arms[i];
          a.sh.rotation.set(A[0] * D2R, 0, A[1] * D2R);
          a.el.rotation.set(A[2] * D2R, 0, 0);
          a.fing.rotation.set(0, 0, -a.s * P.curl[i] * D2R);
          const L = legs[i], Lg = P.legs[i];
          L.th.rotation.set(Lg[0] * D2R, 0, 0);
          L.kn.rotation.set(Lg[1] * D2R, 0, 0);
          L.ft.rotation.set(-(Lg[0] + Lg[1]) * D2R, 0, 0);
        }
        const hd = s.head || [0, 0];
        head.rotation.set(hd[1] * D2R, hd[0] * D2R, (hd[2] || 0) * D2R);
        // expression
        const e1 = EXPR[s.expr || "neutral"] || EXPR.neutral, e2 = EXPR[s.expr2 || s.expr || "neutral"] || e1, E = lerpExpr(e1, e2, s.ek || 0);
        for (const b of brows) { b.morphTargetInfluences[0] = E.bw; b.morphTargetInfluences[1] = E.bd; }
        upLip.morphTargetInfluences[0] = E.ms; upLip.morphTargetInfluences[1] = E.mw; upLip.morphTargetInfluences[2] = E.md;
        loLip.morphTargetInfluences[0] = E.ms; loLip.morphTargetInfluences[1] = E.mw; loLip.morphTargetInfluences[2] = E.md;
        const bl = s.blink != null ? s.blink : blinkAt(t);
        lids.forEach((l) => l.rotation.set(lerp(E.lid, 42, bl) * D2R, 0, 0));
        lowLids.forEach((l) => l.rotation.set(E.low * D2R, 0, 0));
        const lk = s.look || [0, 0];
        eyes.forEach((e) => e.rotation.set(-lk[1] * D2R, lk[0] * D2R, 0));
        pony.rotation.set((Math.sin(t * 1.3) * 3 - hd[1] * 0.5) * D2R, (Math.sin(t * 0.9 + 1) * 4 - hd[0] * 0.3) * D2R, 0);
        binoc.visible = s.tool === "binoc";
        mic.visible = s.tool === "mic";
        flash.visible = s.tool === "flash";
        spot.intensity = s.tool === "flash" ? (s.flashI != null ? s.flashI : 26) : 0;
        beamM.uniforms.k.value = s.tool === "flash" ? (s.beamK != null ? s.beamK : 0.22) : 0;
        for (const k in xtools) xtools[k].visible = s.tool === k || s.tool2 === k;   // v2.1: module-registered tools
      }
      // v2.1: a module registers its own hand tools (pen, clipboard, mic, balloon string…): hand 0 = right, 1 = left
      const xtools = {};
      function tool(name, obj, hand) { (hand === 1 ? arms[1].hand : arms[0].hand).add(obj); obj.visible = false; xtools[name] = obj; return obj; }
      set({});
      const headWorld = (out) => head.localToWorld((out || new T.Vector3()).set(0, 0.12, 0));
      return { root, set, head, arms, headWorld, POSES, EXPR, spine, neck, hips, legs, face, pony, surf, frontZ, fz, tool,
        mats: { skin, jacket, sleeveM, trim, seamM, pants, bootM, soleM, hairM, hairTubeM, browM, metal, black } };
    }

    // ---------------------------------------------------------------- post: DOF + bloom + light shafts + grade + grain
    const hdrRT = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
    const depRT = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    depRT.depthTexture = new T.DepthTexture(W, H, T.UnsignedIntType);
    const dw = Math.round(W * LOOK.dofScale), dh = Math.round(H * LOOK.dofScale);
    const lin = { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false };
    const preRT = new T.WebGLRenderTarget(dw, dh, lin), dofRT = new T.WebGLRenderTarget(dw, dh, lin);
    const bw = Math.round(W / 8), bh = Math.round(H / 8);
    const bl1 = new T.WebGLRenderTarget(bw, bh, lin), bl2 = new T.WebGLRenderTarget(bw, bh, lin);
    const rw = Math.round(W / 4), rh = Math.round(H / 4);
    const ry1 = new T.WebGLRenderTarget(rw, rh, lin), ry2 = new T.WebGLRenderTarget(rw, rh, lin);
    const depthOnly = new T.MeshBasicMaterial({ colorWrite: false, side: T.DoubleSide });
    const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const NEAR = 0.05, FAR = 30000;
    const LIN = `uniform float near, far; float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }`;
    const pre = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, px: { value: new T.Vector2(1 / W, 1 / H) }, near: { value: NEAR }, far: { value: FAR },
        focus: { value: 2 }, aper: { value: 20 }, maxC: { value: 30 }, sc: { value: LOOK.dofScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD; uniform vec2 px; uniform float focus, aper, maxC, sc; varying vec2 vUv; ${LIN}
        void main(){
          vec3 c = texture2D(tC, vUv).rgb;
          float d = lin(texture2D(tD, vUv + px * vec2(-0.5, -0.5)).x);
          d = min(d, lin(texture2D(tD, vUv + px * vec2(0.5, -0.5)).x));
          d = min(d, lin(texture2D(tD, vUv + px * vec2(-0.5, 0.5)).x));
          d = min(d, lin(texture2D(tD, vUv + px * vec2(0.5, 0.5)).x));
          float coc = clamp(aper * (1.0 - focus / d) * sc, -maxC, maxC);
          gl_FragColor = vec4(min(c, vec3(40.0)), coc);
        }`, depthTest: false, depthWrite: false,
    });
    const gather = new T.ShaderMaterial({
      uniforms: { tP: { value: preRT.texture }, px: { value: new T.Vector2(1 / dw, 1 / dh) }, maxR: { value: 30 }, rs: { value: LOOK.radScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tP; uniform vec2 px; uniform float maxR, rs; varying vec2 vUv;
        void main(){
          vec4 c0 = texture2D(tP, vUv);
          float cs = abs(c0.a);
          vec3 col = c0.rgb; float tot = 1.0; float nearS = 0.0;
          float r = rs;
          for (int i = 0; i < 700; i++) {
            if (r >= maxR) break;
            float ang = float(i) * 2.39996323;
            vec4 s = texture2D(tP, vUv + vec2(cos(ang), sin(ang)) * px * r);
            float ss = abs(s.a);
            if (s.a > c0.a) ss = clamp(ss, 0.0, cs * 2.0);
            float m = smoothstep(r - 0.5, r + 0.5, ss);
            col += mix(col / tot, s.rgb, m);
            tot += 1.0;
            if (s.a < 0.0 && -s.a > r) nearS = max(nearS, -s.a * m);
            r += rs / r;
          }
          gl_FragColor = vec4(col / tot, max(cs, nearS));
        }`, depthTest: false, depthWrite: false,
    });
    const down = new T.ShaderMaterial({
      uniforms: { tC: { value: dofRT.texture }, px: { value: new T.Vector2(1 / dw, 1 / dh) }, thr: { value: 0.9 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 px; uniform float thr; varying vec2 vUv;
        void main(){ vec3 c = vec3(0.0);
          for (int i = -1; i <= 2; i++) for (int j = -1; j <= 2; j++) c += texture2D(tC, vUv + px * vec2(float(i) * 2.0 - 0.5, float(j) * 2.0 - 0.5)).rgb;
          c /= 16.0; float l = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c * smoothstep(thr, thr + 1.2, l), 1.0); }`, depthTest: false, depthWrite: false,
    });
    const blur = new T.ShaderMaterial({
      uniforms: { tC: { value: null }, dir: { value: new T.Vector2(1 / bw, 0) } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 dir; varying vec2 vUv;
        void main(){ float w[5]; w[0] = 0.227; w[1] = 0.1945; w[2] = 0.1216; w[3] = 0.054; w[4] = 0.0162;
          vec3 c = texture2D(tC, vUv).rgb * w[0];
          for (int i = 1; i < 5; i++) { c += texture2D(tC, vUv + dir * float(i) * 1.5).rgb * w[i]; c += texture2D(tC, vUv - dir * float(i) * 1.5).rgb * w[i]; }
          gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false,
    });
    // light shafts: bright pass of the frame at 1/4 res, then a radial blur toward the light's screen position
    const rayPre = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, thr: { value: 0.35 }, skyOnly: { value: 0 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD; uniform float thr, skyOnly; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tC, vUv).rgb; float l = max(c.r, max(c.g, c.b));
          float sky = step(0.99999, texture2D(tD, vUv).x);
          float k = smoothstep(thr, thr + 1.0, l) * mix(1.0, sky, skyOnly);
          gl_FragColor = vec4(min(c, vec3(8.0)) * k, 1.0); }`, depthTest: false, depthWrite: false,
    });
    const rayBlur = new T.ShaderMaterial({
      uniforms: { tC: { value: ry1.texture }, ctr: { value: new T.Vector2(0.5, 0.5) }, len: { value: 0.6 }, decay: { value: 0.965 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 ctr; uniform float len, decay; varying vec2 vUv;
        void main(){ vec2 d = (vUv - ctr) * len / 48.0; vec2 p = vUv; vec3 c = vec3(0.0); float w = 1.0, tw = 0.0;
          for (int i = 0; i < 48; i++) { c += texture2D(tC, p).rgb * w; tw += w; w *= decay; p -= d; }
          gl_FragColor = vec4(c / tw, 1.0); }`, depthTest: false, depthWrite: false,
    });
    const comp = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, tB: { value: dofRT.texture }, tG: { value: bl2.texture }, tR: { value: ry2.texture },
        near: { value: NEAR }, far: { value: FAR }, focus: { value: 2 }, aper: { value: 20 }, sc: { value: LOOK.dofScale },
        expo: { value: 1 }, sat: { value: LOOK.sat }, vig: { value: LOOK.vig }, warm: { value: LOOK.warm }, con: { value: LOOK.contrast },
        bloom: { value: LOOK.bloom }, rays: { value: 0 }, rayCol: { value: new T.Color("#b9c8ff") }, res: { value: new T.Vector2(W, H) }, seed: { value: 0 }, flash: { value: 0 },
        tint: { value: new T.Vector4(0, 0, 0, 0) }, grain: { value: LOOK.grain }, ca: { value: LOOK.ca }, lift: { value: new T.Vector3(0.006, 0.008, 0.016) }, black: { value: 0 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD, tB, tG, tR; uniform float focus, aper, sc, expo, sat, vig, warm, con, bloom, rays, seed, flash, grain, ca, black; uniform vec3 rayCol, lift; uniform vec4 tint; uniform vec2 res; varying vec2 vUv; ${LIN}
        vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed * 1.618) * 43758.5453); }
        void main(){
          vec2 q = vUv - 0.5;
          vec2 off = q * ca * dot(q, q) * 4.0;
          vec3 sharp = vec3(texture2D(tC, vUv + off).r, texture2D(tC, vUv).g, texture2D(tC, vUv - off).b);
          vec4 b = texture2D(tB, vUv);
          float d = lin(texture2D(tD, vUv).x);
          float coc = abs(aper * (1.0 - focus / d)) * sc;
          float k = smoothstep(0.35, 1.6, max(coc, b.a));
          vec3 c = mix(sharp, b.rgb, k);
          c += texture2D(tG, vUv).rgb * bloom;
          c += texture2D(tR, vUv).rgb * rays * rayCol;
          c = c * expo + flash;
          c = aces(c);
          c = (c - 0.5) * con + 0.5;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, sat), 0.0);
          c *= vec3(1.0 + warm, 1.0, 1.0 - warm);
          c = mix(c, c * (vec3(0.35) + tint.rgb * 1.3) + tint.rgb * 0.05, tint.a);   // colour wash (green = safe, red = danger)
          c += lift * (1.0 - c);
          vec2 qq = q; qq.x *= res.x / res.y;
          c *= 1.0 - vig * smoothstep(0.2, 0.95, length(qq) * 1.3);
          c *= 1.0 - black;
          c = toSRGB(clamp(c, 0.0, 1.0));
          float n = hash(vUv * res) - 0.5;
          c += n * grain * (1.0 - 0.6 * l) + (hash(vUv * res + 7.7) - 0.5) / 255.0;
          gl_FragColor = vec4(c, 1.0);
        }`, depthTest: false, depthWrite: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), pre);
    quad.frustumCulled = false;
    const qScene = new T.Scene(); qScene.add(quad);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qScene, qCam); }

    const fwd = new T.Vector3(), tv = new T.Vector3(), tv2 = new T.Vector3(), proj = new T.Vector3();
    // st: { t, cam, look, fov, roll, focus (number | [x,y,z]), aperture, maxBlur, exposure, sat, bloom, vig, flash, black,
    //       tint: [r,g,b,amt], rays: amount, rayAt: [x,y,z] (default: the moon), rayLen, raySky, moonI, hemiI, envI,
    //       lampI, fogD, fogK (valley sheets), eyesK, eyesScale, carsK, townK, glowK (horizon fire glow), wind, starK }
    function render(st) {
      const t = st.t || 0;
      U.time.value = t;
      camera.fov = st.fov || 40;
      camera.position.fromArray(st.cam);
      camera.up.set(0, 1, 0);
      camera.lookAt(st.look[0], st.look[1], st.look[2]);
      if (st.roll) camera.rotateZ(st.roll * D2R);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      U.wind.value = st.wind != null ? st.wind : 0.012;
      moon.intensity = st.moonI != null ? st.moonI : 1.25;
      hemi.intensity = st.hemiI != null ? st.hemiI : 0.32;
      scene.environmentIntensity = st.envI != null ? st.envI : 0.55;
      scene.fog.density = st.fogD != null ? st.fogD : 0.00024;
      if (tower) {
        tower.lampL.intensity = st.lampI != null ? st.lampI : 3.2;
        tower.bulb.material.color.set("#ffd9a0").multiplyScalar(9 * clamp((st.lampI != null ? st.lampI : 3.2) / 3.2, 0, 3));
        const yi = st.yardI != null ? st.yardI : 45;
        tower.yardL.intensity = yi; tower.yardBulb.material.color.set("#ffc27a").multiplyScalar(10 * clamp(yi / 45, 0, 2));
        const li = st.lanI != null ? st.lanI : 1.4;
        tower.lanL.intensity = li; tower.globe.material.color.set("#ffd59a").multiplyScalar(3 * clamp(li / 1.4, 0, 3));
      }
      if (st.fill) { fill.color.set(st.fill.c || "#ffb46b"); fill.position.fromArray(st.fill.p); fill.intensity = st.fill.i; } else fill.intensity = 0;
      for (const f of fogSheets) { f.material.uniforms.t.value = t; f.material.uniforms.k.value = st.fogK != null ? st.fogK : 1; }
      if (town) { town.g.visible = (st.townK != null ? st.townK : 1) > 0.01; for (const s of town.smokes) { s.material.uniforms.t.value = t; s.lookAt(camera.position.x, s.position.y, camera.position.z); } for (const g of town.glows) g.lookAt(camera.position); }
      placeCars(t, st.carsK || 0);
      placeEyes(t, st.eyesK || 0, st.eyesScale || 1, st.eyesGather || 0);
      if (skyMat) {
        skyMat.uniforms.starK.value = st.starK != null ? st.starK : 1;
        skyMat.uniforms.glowK.value = st.glowK || 0;
        const mk = st.moonK != null ? st.moonK : 1;
        skyMat.uniforms.moonK.value = mk;
        if (st.glowDir) skyMat.uniforms.glowDir.value.fromArray(st.glowDir).normalize();
        if (st.glowCol) skyMat.uniforms.glowCol.value.set(st.glowCol);
        const mp = tv.copy(MOON_DIR).multiplyScalar(15000).add(camera.position);
        moonMesh.visible = moonGlow.visible = mk > 0.001;
        moonMesh.position.copy(mp); moonMesh.lookAt(camera.position); moonMesh.scale.setScalar(st.moonSize || 520);
        moonGlow.position.copy(mp); moonGlow.lookAt(camera.position); moonGlow.scale.setScalar((st.moonSize || 520) * 7);
      }
      const shc = st.shadowAt || SHD.center;
      moon.position.copy(MOON_DIR).multiplyScalar(SHD.dist).add(tv2.fromArray(shc));
      moon.target.position.fromArray(shc); moon.target.updateMatrixWorld();
      for (const h of hooks) h(st, t, camera);
      let F = 10;
      if (Array.isArray(st.focus)) { camera.getWorldDirection(fwd); F = tv.fromArray(st.focus).sub(camera.position).dot(fwd); }
      else if (st.focus) F = st.focus;
      const A = st.aperture != null ? st.aperture : 6;
      const maxC = Math.min(LOOK.maxCoC, st.maxBlur || LOOK.maxCoC) * LOOK.dofScale;
      renderer.shadowMap.needsUpdate = true;
      renderer.setRenderTarget(hdrRT);
      renderer.render(scene, camera);
      const hidden = [];
      for (const m of noDepth) if (m.visible) { m.visible = false; hidden.push(m); }
      scene.overrideMaterial = depthOnly;
      const bg = scene.background; scene.background = null;
      renderer.setRenderTarget(depRT);
      renderer.render(scene, camera);
      scene.overrideMaterial = null; scene.background = bg;
      for (const m of hidden) m.visible = true;
      pre.uniforms.focus.value = F; pre.uniforms.aper.value = A; pre.uniforms.maxC.value = maxC;
      pass(pre, preRT);
      gather.uniforms.maxR.value = Math.max(1.5, Math.min(maxC, Math.abs(A) * LOOK.dofScale * 1.05 + 1));
      pass(gather, dofRT);
      pass(down, bl1);
      blur.uniforms.tC.value = bl1.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, bl2);
      blur.uniforms.tC.value = bl2.texture; blur.uniforms.dir.value.set(0, 1 / bh); pass(blur, bl1);
      blur.uniforms.tC.value = bl1.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, bl2);
      let rays = st.rays || 0;
      if (rays > 0) {
        if (st.rayAt) proj.fromArray(st.rayAt); else proj.copy(MOON_DIR).multiplyScalar(15000).add(camera.position);
        proj.project(camera);
        if (proj.z > 1) rays = 0;
        rayBlur.uniforms.ctr.value.set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5);
        rayBlur.uniforms.len.value = st.rayLen || 0.7;
        rayPre.uniforms.thr.value = st.rayThr != null ? st.rayThr : 0.3;
        rayPre.uniforms.skyOnly.value = st.raySky ? 1 : 0;
        pass(rayPre, ry1); pass(rayBlur, ry2);
      }
      const cu = comp.uniforms;
      cu.focus.value = F; cu.aper.value = A; cu.expo.value = st.exposure != null ? st.exposure : 1;
      cu.flash.value = st.flash || 0; cu.sat.value = st.sat != null ? st.sat : LOOK.sat; cu.bloom.value = st.bloom != null ? st.bloom : LOOK.bloom;
      cu.vig.value = st.vig != null ? st.vig : LOOK.vig; cu.rays.value = rays; cu.black.value = st.black || 0;
      if (st.rayCol) cu.rayCol.value.set(st.rayCol); else cu.rayCol.value.set("#b9c8ff");
      const tn = st.tint || [0, 0, 0, 0]; cu.tint.value.set(tn[0], tn[1], tn[2], tn[3]);
      cu.warm.value = st.warm != null ? st.warm : LOOK.warm;
      cu.seed.value = Math.round(t * 30) % 251;
      pass(comp, null);
      renderer.setRenderTarget(null);
    }

    return {
      T, scene, camera, renderer, LOOK, U, mat, glow, M, G, rod, box, cyl, sph, capsule, rbox, canvasTex, textTex, noiseTex,
      // v2.1: what a world module needs to build its own set and drive it per frame
      onRender(fn) { hooks.push(fn); }, buildSky() { if (!skyMat) sky(); }, noDepth, moon, hemi, fill, FOG, sweepGeo, tubeGeo, pmat, skinMat, normals, nmap, heightNormal, hash2, vnoise, fbm, D2R,
      world() { sky(); buildTerrain(); buildRoad(); buildForest(o.forest); buildFog(); buildTown(); buildCars(o.cars); buildEyes(o.eyes); return { terrain, fogSheets, town, cars, eyes, roadCurve, meshH, terrainH }; },
      tower: buildTower, hazel, render, meshH, terrainH, rng, clamp, lerp, sstep, MOON_DIR,
      get ready() { return Promise.all(loads).then(() => { redraw.forEach((f) => f()); return new Promise((r) => setTimeout(r, 30)); }); },
    };
  }

  window.SURVIVAL = { create, terrainH };
})();
