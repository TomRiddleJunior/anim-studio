/* rh3d-core.js — realistic-horror 3D kit, core (three.js r170, classic script, sets window.RH3D).
 *
 *   const K = RH3D.create({ canvas, width: 1080, height: 1920, look: { … } });
 *   …build a set with K.mat / K.M / K.G / K.light.* / props / mannequins…
 *   K.env.bake("white", [0, 1.3, -6], () => setLightsWhite());   // PMREM of the set itself: real reflections
 *   await K.ready;
 *   K.render({ cam, look, fov, roll, focus, aperture, exposure, refl, fog, vol, prev, mblur, … , t });
 *
 * Every frame is a pure function of the state passed to render(): no clocks, seeded noise only.
 *
 * Passes per frame (all HDR until the composite):
 *   0. shadow maps (once per frame, then frozen for the other passes)
 *   1. mirror pass: the scene mirrored in the floor plane (y = K.mirrorY) at half resolution, floor layer hidden,
 *      clipped below the plane; floors built with K.wetFloor() sample it by projective texturing, blurred by their
 *      roughness, masked by their wetness, weighted by Fresnel  ->  wet concrete and puddles that really mirror lights
 *   2. main pass (MSAA 4x, half-float)            3. depth pass (opaque layers only)
 *   4. volumetric in-scatter at half res: a jittered ray march through height + noise fog, summing up to 16
 *      registered lights (point / spot cones, inverse-square), then a separable blur  ->  beams and halos in haze
 *   5. half-res bokeh depth of field (scatter-as-gather, golden-angle spiral), fog applied before the blur
 *   6. bloom (1/8 res, 3 blurs) + an anamorphic horizontal streak
 *   7. composite: fog, camera motion blur (reprojected from the previous camera), DOF mix, bloom, streak, exposure,
 *      ACES filmic, contrast, saturation, split-tone, vignette, chromatic aberration, film grain, dither
 *
 * Layers: 0 = default, 2 = transparent / no depth (glass, decals, haze cards) — excluded from the depth pass,
 *         3 = floor surfaces — excluded from the mirror pass.  Lights stay on layer 0 (r170 gates lights by layer).
 */
(function () {
  const T = window.THREE;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  /** smooth 1-D noise in [-1, 1] (seeded), for handheld drift and flicker */
  function noise1(x, seed) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = hash1(i + (seed || 0) * 57.3) * 2 - 1, b = hash1(i + 1 + (seed || 0) * 57.3) * 2 - 1;
    return a + (b - a) * u;
  }
  /** camera handheld offset: position [m] and rotation [deg] for time t, amplitude amp (1 = gentle hand-held) */
  function handheld(t, amp, seed) {
    const s = seed || 1, a = amp == null ? 1 : amp;
    const n = (f, k) => (noise1(t * f, s * 13 + k) * 0.65 + noise1(t * f * 2.3, s * 29 + k) * 0.35);
    return { pos: [n(0.45, 1) * 0.012 * a, n(0.5, 2) * 0.009 * a, n(0.4, 3) * 0.006 * a], rot: [n(0.6, 4) * 0.35 * a, n(0.55, 5) * 0.45 * a, n(0.5, 6) * 0.3 * a] };
  }

  const LAYER = { DEFAULT: 0, NODEPTH: 2, FLOOR: 3 };

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const LOOK = Object.assign({ dofScale: 0.5, radScale: 0.9, maxCoC: 56, bloom: 0.12, bloomThr: 1.0, streak: 0.0, sat: 0.92, vig: 0.38,
      contrast: 1.04, grain: 0.035, ca: 0.0018, reflScale: 0.5, volScale: 0.5, volSteps: 28, exposure: 1.0,
      lift: [0.0, 0.0, 0.0], gain: [1.0, 1.0, 1.0] }, o.look || {});

    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = T.LinearSRGBColorSpace; // the composite does its own sRGB encode
    renderer.toneMapping = T.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.localClippingEnabled = false;
    const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const scene = new T.Scene();
    scene.background = new T.Color(0, 0, 0);
    const camera = new T.PerspectiveCamera(30, W / H, 0.05, 160);
    camera.layers.enable(LAYER.NODEPTH); camera.layers.enable(LAYER.FLOOR);
    const loads = [];
    const preHooks = [];

    // ------------------------------------------------------------------ materials & mesh helpers
    const matCache = {};
    /** PBR material. p: rough, metal, map, normalMap, normalScale, roughMap, aoMap, env (envMapIntensity), clearcoat,
     *  ccRough, emi (hex), emiI, emiMap, side, transparent, opacity, alphaMap, alphaTest, depthWrite, phys, sheen, ior, uv */
    function mat(hex, p) {
      p = p || {};
      const key = hex + JSON.stringify(p, (k, v) => (v && v.isTexture ? v.uuid : v));
      if (matCache[key] && !p.unique) return matCache[key];
      const phys = p.phys || p.clearcoat != null || p.sheen != null;
      const M = phys ? T.MeshPhysicalMaterial : T.MeshStandardMaterial;
      const m = new M({ color: hex, roughness: p.rough != null ? p.rough : 0.75, metalness: p.metal || 0,
        map: p.map || null, normalMap: p.normalMap || null, roughnessMap: p.roughMap || null, aoMap: p.aoMap || null,
        emissive: p.emi || "#000000", emissiveIntensity: p.emiI != null ? p.emiI : 1, emissiveMap: p.emiMap || null,
        side: p.side != null ? p.side : T.FrontSide, transparent: !!p.transparent, opacity: p.opacity != null ? p.opacity : 1,
        alphaMap: p.alphaMap || null, alphaTest: p.alphaTest || 0, depthWrite: p.depthWrite != null ? p.depthWrite : true,
        flatShading: !!p.flat });
      if (p.normalScale != null) m.normalScale = new T.Vector2(p.normalScale, p.normalScale);
      m.envMapIntensity = p.env != null ? p.env : 1;
      if (phys) {
        if (p.clearcoat != null) { m.clearcoat = p.clearcoat; m.clearcoatRoughness = p.ccRough != null ? p.ccRough : 0.06; }
        if (p.sheen != null) { m.sheen = p.sheen; m.sheenRoughness = 0.6; m.sheenColor = new T.Color(p.sheenHex || "#ffffff"); }
        if (p.ior != null) m.ior = p.ior;
        if (p.spec != null) m.specularIntensity = p.spec;
      }
      if (p.polyOff) { m.polygonOffset = true; m.polygonOffsetFactor = -p.polyOff; m.polygonOffsetUnits = -p.polyOff; }
      if (!p.unique) matCache[key] = m;
      return m;
    }
    /** unlit HDR colour: hdr > 1 blooms and makes bokeh discs */
    function glow(hex, hdr, p) {
      p = p || {};
      const m = new T.MeshBasicMaterial({ color: hex, map: p.map || null, side: p.side != null ? p.side : T.FrontSide,
        transparent: !!p.transparent || p.opacity != null || !!p.additive, opacity: p.opacity != null ? p.opacity : 1,
        depthWrite: p.depthWrite != null ? p.depthWrite : !p.additive, blending: p.additive ? T.AdditiveBlending : T.NormalBlending,
        alphaMap: p.alphaMap || null, toneMapped: false, fog: false });
      m.color.multiplyScalar(hdr == null ? 1 : hdr);
      m.userData.base = m.color.clone(); m.userData.hdr = hdr == null ? 1 : hdr;
      return m;
    }
    function M(geo, m, p, parent) {
      p = p || {};
      const mesh = new T.Mesh(geo, m);
      mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
      mesh.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R, p.order || "XYZ");
      if (p.s != null) mesh.scale.setScalar(p.s);
      if (p.sx != null || p.sy != null || p.sz != null) mesh.scale.set(p.sx != null ? p.sx : 1, p.sy != null ? p.sy : 1, p.sz != null ? p.sz : 1);
      mesh.castShadow = p.cast != null ? p.cast : true;
      mesh.receiveShadow = p.receive != null ? p.receive : true;
      if (p.layer != null) mesh.layers.set(p.layer);
      if (p.name) mesh.name = p.name;
      if (p.ro != null) mesh.renderOrder = p.ro;
      (parent || scene).add(mesh);
      return mesh;
    }
    function G(p, parent) {
      p = p || {};
      const g = new T.Group();
      g.position.set(p.x || 0, p.y || 0, p.z || 0);
      g.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R, p.order || "XYZ");
      if (p.s != null) g.scale.setScalar(p.s);
      if (p.name) g.name = p.name;
      (parent || scene).add(g);
      return g;
    }
    const box = (w, h, d) => new T.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, n, open) => new T.CylinderGeometry(rt, rb, h, n || 16, 1, !!open);
    const sph = (r, ws, hs) => new T.SphereGeometry(r, ws || 32, hs || 20);
    function capsule(r, len, n) { const g = new T.CapsuleGeometry(r, len, 4, n || 16); g.translate(0, len / 2, 0); return g; }
    /** rounded box (extruded rounded rectangle, bevelled): w x h face, depth d, corner radius r */
    function rbox(w, h, d, r, bevel) {
      const s = new T.Shape(), x = -w / 2, y = -h / 2;
      r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      const b = bevel == null ? Math.min(0.01, d * 0.3) : bevel;
      const g = new T.ExtrudeGeometry(s, { depth: Math.max(1e-4, d - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
      g.translate(0, 0, -(d - 2 * b) / 2);
      g.computeVertexNormals();
      return g;
    }
    /** lathe from a [[r, y], …] profile (radius, height) */
    function lathe(prof, n) { return new T.LatheGeometry(prof.map((p) => new T.Vector2(p[0], p[1])), n || 32); }
    function scaleUV(geo, su, sv) { const a = geo.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * su, a.getY(i) * sv); a.needsUpdate = true; return geo; }

    // ------------------------------------------------------------------ textures (canvas, seeded)
    const ctCache = {};
    function canvasTex(key, w, h, draw, opt) {
      opt = opt || {};
      if (ctCache[key] && !opt.fresh) return ctCache[key];
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const g = cv.getContext("2d", { willReadFrequently: !!opt.read });
      draw(g, w, h, cv);
      const t = new T.CanvasTexture(cv);
      t.colorSpace = opt.linear ? T.NoColorSpace : T.SRGBColorSpace;
      t.anisotropy = ANISO;
      if (opt.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
      if (opt.clamp) { t.wrapS = t.wrapT = T.ClampToEdgeWrapping; }
      t.userData.canvas = cv; t.userData.ctx = g;
      ctCache[key] = t;
      return t;
    }
    /** tileable value-noise field (Float32Array w*h in 0..1): octaves of seeded lattice noise, wrap-around */
    function noiseField(w, h, seed, octaves, base) {
      const out = new Float32Array(w * h);
      let amp = 1, tot = 0, cells = base || 4;
      for (let o = 0; o < (octaves || 5); o++) {
        const r = rng(seed * 31 + o * 7 + 1), n = cells, lat = new Float32Array(n * n);
        for (let i = 0; i < n * n; i++) lat[i] = r();
        for (let y = 0; y < h; y++) {
          const fy = (y / h) * n, iy = Math.floor(fy), ty = fy - iy, uy = ty * ty * (3 - 2 * ty);
          for (let x = 0; x < w; x++) {
            const fx = (x / w) * n, ix = Math.floor(fx), tx = fx - ix, ux = tx * tx * (3 - 2 * tx);
            const a = lat[(iy % n) * n + (ix % n)], b = lat[(iy % n) * n + ((ix + 1) % n)];
            const c = lat[((iy + 1) % n) * n + (ix % n)], d = lat[((iy + 1) % n) * n + ((ix + 1) % n)];
            out[y * w + x] += amp * (a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy);
          }
        }
        tot += amp; amp *= 0.5; cells *= 2;
      }
      for (let i = 0; i < out.length; i++) out[i] /= tot;
      return out;
    }
    /** normal map (linear) from a height field (Float32Array w*h), strength ~ 1-6 */
    function normalTex(key, hf, w, h, strength, repeat) {
      return canvasTex(key, w, h, (g) => {
        const img = g.createImageData(w, h), d = img.data;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const l = hf[y * w + ((x - 1 + w) % w)], r = hf[y * w + ((x + 1) % w)];
          const u = hf[((y - 1 + h) % h) * w + x], dn = hf[((y + 1) % h) * w + x];
          let nx = (l - r) * strength, ny = (dn - u) * strength, nz = 1;
          const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
          const i = (y * w + x) * 4;
          d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
      }, { linear: true, repeat: repeat || [1, 1] });
    }
    /** concrete albedo + roughness + normal set (tileable): tone hex, variation, stains, pits.
     *  returns { map, rough, normal, field } */
    function concrete(key, p) {
      p = Object.assign({ w: 512, h: 512, seed: 7, tone: "#8a8a88", vary: 0.12, pits: 0.6, stains: 5, rough: [0.72, 0.92], repeat: [1, 1], nstr: 1.1, bump: 0.25 }, p || {});
      const { w, h } = p;
      const f1 = noiseField(w, h, p.seed, 5, 3), f2 = noiseField(w, h, p.seed + 3, 3, 24), f3 = noiseField(w, h, p.seed + 5, 2, 64);
      const r = rng(p.seed + 11), base = new T.Color(p.tone);
      // height: mostly fine grain (aggregate) + a little large-scale undulation (trowel), never "hammered metal"
      const hf = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) hf[i] = f1[i] * p.bump + f2[i] * 0.55 + f3[i] * 0.45 + (r() - 0.5) * 0.18;
      const pits = [];
      for (let k = 0; k < w * h * 0.0016 * p.pits; k++) pits.push([r() * w, r() * h, 0.5 + r() * 1.4]);
      const map = canvasTex(key + ":a", w, h, (g) => {
        const img = g.createImageData(w, h), d = img.data;
        for (let i = 0; i < w * h; i++) {
          const v = 1 + (f1[i] - 0.5) * p.vary * 2.2 + (f2[i] - 0.5) * p.vary * 0.7 + (f3[i] - 0.5) * p.vary * 0.6 + (r() - 0.5) * 0.04;
          d[i * 4] = clamp(base.r * 255 * v, 0, 255); d[i * 4 + 1] = clamp(base.g * 255 * v, 0, 255); d[i * 4 + 2] = clamp(base.b * 255 * v, 0, 255); d[i * 4 + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        for (let k = 0; k < p.stains; k++) {
          const x = r() * w, y = r() * h, rad = (0.05 + r() * 0.16) * w;
          const gr = g.createRadialGradient(x, y, 0, x, y, rad);
          gr.addColorStop(0, `rgba(28,27,26,${0.08 + r() * 0.12})`); gr.addColorStop(1, "rgba(28,27,26,0)");
          g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
        g.fillStyle = "rgba(22,22,22,0.5)";
        pits.forEach(([x, y, s]) => { g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); });
      }, { repeat: p.repeat });
      const rough = canvasTex(key + ":r", w, h, (g) => {
        const img = g.createImageData(w, h), d = img.data;
        for (let i = 0; i < w * h; i++) { const v = lerp(p.rough[0], p.rough[1], f2[i] * 0.6 + f1[i] * 0.4) * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
        g.putImageData(img, 0, 0);
      }, { linear: true, repeat: p.repeat });
      pits.forEach(([x, y]) => { const i = (Math.floor(y) % h) * w + (Math.floor(x) % w); hf[i] -= 0.7; });
      const normal = normalTex(key + ":n", hf, w, h, p.nstr, p.repeat);
      return { map, rough, normal, field: f1, height: hf };
    }

    // ------------------------------------------------------------------ lights (registered for the volumetric pass)
    const vlights = []; // { light, gain, cone: bool }
    const shadowLights = [];
    function shadowSetup(L, res, bias, radius, near, far) {
      L.castShadow = true;
      L.shadow.mapSize.set(res || 1024, res || 1024);
      L.shadow.bias = bias != null ? bias : -0.0004;
      L.shadow.normalBias = 0.02;
      L.shadow.radius = radius || 4;
      L.shadow.camera.near = near || 0.1;
      L.shadow.camera.far = far || 30;
      shadowLights.push(L);
    }
    const light = {
      /** point light: I in candela-ish units (three physical), range 0 = infinite */
      point(p) {
        const L = new T.PointLight(p.color || "#ffffff", p.I != null ? p.I : 10, p.range || 0, 2);
        L.position.fromArray(p.pos || [0, 2, 0]);
        scene.add(L);
        if (p.vol) vlights.push({ light: L, gain: p.vol });
        return L;
      },
      /** spot light; angle = half-angle in degrees; vol = haze gain; cast = shadow map size */
      spot(p) {
        const L = new T.SpotLight(p.color || "#ffffff", p.I != null ? p.I : 20, p.range || 0, (p.angle || 40) * D2R, p.pen != null ? p.pen : 0.5, 2);
        L.position.fromArray(p.pos || [0, 3, 0]);
        L.target.position.fromArray(p.at || [0, 0, 0]);
        scene.add(L); scene.add(L.target);
        if (p.cast) shadowSetup(L, p.cast, p.bias, p.radius, p.near, p.far);
        if (p.vol) vlights.push({ light: L, gain: p.vol });
        return L;
      },
      dir(p) {
        const L = new T.DirectionalLight(p.color || "#ffffff", p.I != null ? p.I : 2);
        L.position.fromArray(p.pos || [3, 6, 2]);
        L.target.position.fromArray(p.at || [0, 0, 0]);
        scene.add(L); scene.add(L.target);
        if (p.cast) {
          shadowSetup(L, p.cast, p.bias, p.radius, p.near, p.far);
          const e = p.extent || 8, c = L.shadow.camera; c.left = -e; c.right = e; c.top = e; c.bottom = -e;
        }
        return L;
      },
      hemi(p) { const L = new T.HemisphereLight(p.sky || "#8090a0", p.ground || "#202020", p.I != null ? p.I : 0.2); scene.add(L); return L; },
      ambient(p) { const L = new T.AmbientLight(p.color || "#ffffff", p.I != null ? p.I : 0.05); scene.add(L); return L; },
      /** register any light for the haze pass after the fact */
      haze(L, gain) { const e = vlights.find((v) => v.light === L); if (e) e.gain = gain; else vlights.push({ light: L, gain }); },
    };

    // ------------------------------------------------------------------ environment: PMREM baked from the set itself
    const pmrem = new T.PMREMGenerator(renderer);
    const envs = {};
    const env = {
      /** bake the current scene, seen from probe [x,y,z], into a prefiltered env map called name. prep() may switch
       *  lights/emissives first; restore() afterwards. Call after the set is built (once per state). */
      bake(name, probe, prep, restore) {
        if (prep) prep();
        const keep = scene.environment; scene.environment = null;
        const pos = scene.position.clone();
        scene.position.set(-probe[0], -probe[1], -probe[2]);
        scene.updateMatrixWorld(true);
        const hidden = [];
        scene.traverse((o) => { if (o.userData.noEnv && o.visible) { o.visible = false; hidden.push(o); } });
        renderer.shadowMap.needsUpdate = true;
        updateGlow();
        const rt = pmrem.fromScene(scene, 0.015, 0.05, 90);
        hidden.forEach((o) => (o.visible = true));
        scene.position.copy(pos);
        scene.updateMatrixWorld(true);
        scene.environment = keep;
        envs[name] = rt.texture;
        if (restore) restore();
        return rt.texture;
      },
      use(name, intensity) { scene.environment = envs[name] || null; if (intensity != null) scene.environmentIntensity = intensity; },
      get: (name) => envs[name],
      list: envs,
    };

    // ------------------------------------------------------------------ wet floors: planar mirror sampling
    const mirrorY = { value: 0 };
    const reflRT = new T.WebGLRenderTarget(Math.round(W * LOOK.reflScale), Math.round(H * LOOK.reflScale), { type: T.HalfFloatType, samples: 0 });
    const mirCam = new T.PerspectiveCamera(30, W / H, 0.05, 160);
    mirCam.layers.set(0); mirCam.layers.enable(LAYER.NODEPTH);
    const texMat = new T.Matrix4();
    const floorUniforms = { tMir: { value: reflRT.texture }, mirMat: { value: texMat }, mirGain: { value: 1 }, mirTex: { value: new T.Vector2(1 / reflRT.width, 1 / reflRT.height) } };
    const floorMats = [];
    /** turn a MeshStandardMaterial into a wet floor: the mirror is added where the (final) roughness is low.
     *  p: wetBelow (roughness under which it mirrors, 0.55), blur (px at roughness 1, 14), distort (normal warp, 0.035) */
    function wetFloor(m, p) {
      p = Object.assign({ wetBelow: 0.55, blur: 16, distort: 0.03, gain: 1 }, p || {});
      m.userData.wet = p;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, floorUniforms, { wetBelow: { value: p.wetBelow }, mirBlur: { value: p.blur }, mirDist: { value: p.distort }, matGain: { value: p.gain } });
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 mirMat; varying vec4 vMirUv;")
          .replace("#include <fog_vertex>", "#include <fog_vertex>\nvMirUv = mirMat * modelMatrix * vec4(transformed, 1.0);");
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D tMir; uniform vec2 mirTex; uniform float mirGain, wetBelow, mirBlur, mirDist, matGain; varying vec4 vMirUv;")
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            { float wetN = smoothstep(wetBelow, wetBelow * 0.25, roughnessFactor); normal = normalize(mix(normal, nonPerturbedNormal, wetN * 0.94)); }`)
          .replace("#include <opaque_fragment>", `
            {
              float wet = smoothstep(wetBelow, wetBelow * 0.25, roughnessFactor);
              if (wet > 0.001 && mirGain > 0.0) {
                vec2 muv = vMirUv.xy / vMirUv.w + normal.xy * mirDist * (0.4 + roughnessFactor);
                float br = mirBlur * roughnessFactor * roughnessFactor + 0.6;
                vec3 rc = texture2D(tMir, muv).rgb * 0.28;
                rc += texture2D(tMir, muv + mirTex * vec2( br,  br * 0.6)).rgb * 0.18;
                rc += texture2D(tMir, muv + mirTex * vec2(-br,  br * 0.6)).rgb * 0.18;
                rc += texture2D(tMir, muv + mirTex * vec2( br * 0.5, -br * 1.2)).rgb * 0.18;
                rc += texture2D(tMir, muv + mirTex * vec2(-br * 0.5, -br * 1.2)).rgb * 0.18;
                float nv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
                float fres = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
                outgoingLight = outgoingLight * (1.0 - wet * fres * 0.6) + rc * wet * fres * mirGain * matGain;
              }
            }
            #include <opaque_fragment>`);
      };
      m.customProgramCacheKey = () => "wetfloor";
      m.needsUpdate = true;
      floorMats.push(m);
      return m;
    }
    const clipBelow = new T.Plane(new T.Vector3(0, 1, 0), 0);
    const _rot = new T.Matrix4(), _v = new T.Vector3(), _la = new T.Vector3(), _tgt = new T.Vector3(), _n = new T.Vector3(0, 1, 0), _p0 = new T.Vector3();
    function renderMirror(gain, fogDensity, fogHex) {
      floorUniforms.mirGain.value = gain;
      if (gain <= 0) return;
      _p0.set(camera.position.x, mirrorY.value, camera.position.z);
      _v.copy(_p0).sub(camera.position).reflect(_n).negate().add(_p0); // mirrored camera position (three's Reflector)
      _rot.extractRotation(camera.matrixWorld);
      _la.set(0, 0, -1).applyMatrix4(_rot).add(camera.position);
      _tgt.copy(_p0).sub(_la).reflect(_n).negate().add(_p0);
      mirCam.position.copy(_v);
      mirCam.up.set(0, 1, 0).applyMatrix4(_rot).reflect(_n);
      mirCam.lookAt(_tgt);
      mirCam.fov = camera.fov; mirCam.aspect = camera.aspect; mirCam.near = camera.near; mirCam.far = camera.far;
      mirCam.updateProjectionMatrix(); mirCam.updateMatrixWorld();
      texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      texMat.multiply(mirCam.projectionMatrix).multiply(mirCam.matrixWorldInverse);
      clipBelow.constant = -mirrorY.value + 0.002;
      renderer.clippingPlanes = [clipBelow];
      const fogKeep = scene.fog;
      scene.fog = fogDensity > 0 ? new T.FogExp2(fogHex || "#202020", fogDensity) : null;
      renderer.setRenderTarget(reflRT);
      renderer.render(scene, mirCam);
      scene.fog = fogKeep;
      renderer.clippingPlanes = [];
    }

    // ------------------------------------------------------------------ fixture glow: cheap omni light for chosen surfaces
    // Bare tubes light the slab above them, but spot lights pointing down cannot. fixtureGlow(material) adds up to 16
    // inverse-square omni points (K.glowPts: [{ p: [x,y,z], c: [r,g,b] (linear, x intensity) }]) to that material only.
    const GLOWN = 16;
    const glowU = { gPos: { value: Array.from({ length: GLOWN }, () => new T.Vector3()) }, gCol: { value: Array.from({ length: GLOWN }, () => new T.Vector3()) }, gN: { value: 0 } };
    const glowPts = [];
    function fixtureGlow(m) {
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (sh, r) => {
        if (prev) prev(sh, r);
        Object.assign(sh.uniforms, glowU);
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
uniform vec3 gPos[${GLOWN}], gCol[${GLOWN}]; uniform int gN;`)
          .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
            for (int i = 0; i < ${GLOWN}; i++) { if (i >= gN) break;
              vec3 lv = (viewMatrix * vec4(gPos[i], 1.0)).xyz + vViewPosition; float d2 = dot(lv, lv);
              reflectedLight.directDiffuse += gCol[i] * max(dot(normal, lv * inversesqrt(d2)), 0.0) / (d2 + 0.06) * BRDF_Lambert(material.diffuseColor); }`);
      };
      m.customProgramCacheKey = () => (m.userData.wet ? "wetfloor+" : "") + "fglow";
      m.needsUpdate = true;
      return m;
    }
    function updateGlow() {
      const n = Math.min(GLOWN, glowPts.length);
      for (let i = 0; i < n; i++) { glowU.gPos.value[i].fromArray(glowPts[i].p); glowU.gCol.value[i].fromArray(glowPts[i].c); }
      glowU.gN.value = n;
    }

    // ------------------------------------------------------------------ post targets & shaders
    const hdrRT = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
    const depRT = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    depRT.depthTexture = new T.DepthTexture(W, H, T.UnsignedIntType);
    const dw = Math.round(W * LOOK.dofScale), dh = Math.round(H * LOOK.dofScale);
    const vw = Math.round(W * LOOK.volScale), vh = Math.round(H * LOOK.volScale);
    const lin = { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false };
    const volRT = new T.WebGLRenderTarget(vw, vh, lin), volRT2 = new T.WebGLRenderTarget(vw, vh, lin);
    const preRT = new T.WebGLRenderTarget(dw, dh, lin), dofRT = new T.WebGLRenderTarget(dw, dh, lin);
    const bw = Math.round(W / 8), bh = Math.round(H / 8);
    const bl1 = new T.WebGLRenderTarget(bw, bh, lin), bl2 = new T.WebGLRenderTarget(bw, bh, lin), stRT = new T.WebGLRenderTarget(bw, bh, lin), stRT2 = new T.WebGLRenderTarget(bw, bh, lin);
    const depthOnly = new T.MeshBasicMaterial({ colorWrite: false });
    const depCam = new T.PerspectiveCamera();
    const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const LIN = `uniform float near, far; float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }`;
    const NV = 16;
    const vU = {
      tD: { value: depRT.depthTexture }, near: { value: 0.05 }, far: { value: 160 }, invProj: { value: new T.Matrix4() }, camWorld: { value: new T.Matrix4() },
      camPos: { value: new T.Vector3() }, nL: { value: 0 }, lPos: { value: Array.from({ length: NV }, () => new T.Vector3()) },
      lCol: { value: Array.from({ length: NV }, () => new T.Vector3()) }, lDir: { value: Array.from({ length: NV }, () => new T.Vector3(0, -1, 0)) },
      lCone: { value: Array.from({ length: NV }, () => new T.Vector2(-2, -1)) }, lRange: { value: new Array(NV).fill(0) },
      dens: { value: 0.03 }, hFall: { value: 0.35 }, hBase: { value: 0 }, noiseAmt: { value: 0.5 }, noiseScale: { value: 0.35 }, time: { value: 0 },
      g: { value: 0.35 }, maxDist: { value: 40 }, steps: { value: LOOK.volSteps }, frame: { value: 0 }, ambient: { value: new T.Vector3() }, res: { value: new T.Vector2(vw, vh) },
    };
    const volMat = new T.ShaderMaterial({
      uniforms: vU, vertexShader: VS,
      fragmentShader: `precision highp float;
        uniform sampler2D tD; uniform mat4 invProj, camWorld; uniform vec3 camPos; uniform int nL;
        uniform vec3 lPos[${NV}], lCol[${NV}], lDir[${NV}]; uniform vec2 lCone[${NV}]; uniform float lRange[${NV}];
        uniform float dens, hFall, hBase, noiseAmt, noiseScale, time, g, maxDist, steps, frame; uniform vec3 ambient; uniform vec2 res;
        varying vec2 vUv; ${LIN}
        float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float density(vec3 p){
          float hd = exp(-max(p.y - hBase, 0.0) * hFall);
          float n = vn(p * noiseScale + vec3(time * 0.07, time * 0.015, time * 0.05)) * 0.65 + vn(p * noiseScale * 2.7 - vec3(time * 0.05, 0.0, time * 0.09)) * 0.35;
          return dens * hd * mix(1.0, n * 1.8, noiseAmt);
        }
        void main(){
          float d = lin(texture2D(tD, vUv).x);
          vec4 vp = invProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0); vp /= vp.w;
          vec3 rdv = normalize(vp.xyz);
          float dist = min(d / max(1e-4, -rdv.z), maxDist);
          vec3 rd = normalize((camWorld * vec4(rdv, 0.0)).xyz);
          float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy + frame * vec2(5.588, 11.37), vec2(0.06711056, 0.00583715))));
          float n = steps; float dt = dist / n;
          vec3 acc = vec3(0.0); float tau = 0.0;
          for (int s = 0; s < 64; s++) {
            if (float(s) >= n) break;
            float tt = (float(s) + ign) * dt;
            vec3 p = camPos + rd * tt;
            float de = density(p);
            vec3 li = ambient;
            for (int i = 0; i < ${NV}; i++) {
              if (i >= nL) break;
              vec3 L = lPos[i] - p; float l2 = dot(L, L); float l = sqrt(l2); vec3 ld = L / l;
              float cosA = dot(-ld, lDir[i]);
              float cone = smoothstep(lCone[i].x, lCone[i].y, cosA);
              float win = lRange[i] > 0.0 ? pow(clamp(1.0 - pow(l / lRange[i], 4.0), 0.0, 1.0), 2.0) : 1.0;
              float mu = dot(rd, ld);
              float ph = (1.0 - g * g) / (12.566 * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
              li += lCol[i] * (cone * win * ph / (l2 + 0.08));
            }
            acc += li * de * exp(-tau) * dt;
            tau += de * dt;
          }
          gl_FragColor = vec4(acc, exp(-tau));
        }`,
      depthTest: false, depthWrite: false,
    });
    const vblur = new T.ShaderMaterial({
      uniforms: { tC: { value: null }, dir: { value: new T.Vector2() } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec4 c = texture2D(tC, vUv) * 0.2270;
          c += (texture2D(tC, vUv + dir * 1.3846) + texture2D(tC, vUv - dir * 1.3846)) * 0.3162;
          c += (texture2D(tC, vUv + dir * 3.2308) + texture2D(tC, vUv - dir * 3.2308)) * 0.0703;
          gl_FragColor = c; }`,
      depthTest: false, depthWrite: false,
    });
    const pre = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, tV: { value: volRT.texture }, useV: { value: 0 }, px: { value: new T.Vector2(1 / W, 1 / H) },
        near: { value: 0.05 }, far: { value: 160 }, focus: { value: 2 }, aper: { value: 20 }, maxC: { value: 30 }, sc: { value: LOOK.dofScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD, tV; uniform float useV; uniform vec2 px; uniform float focus, aper, maxC, sc; varying vec2 vUv; ${LIN}
        void main(){
          vec3 c = texture2D(tC, vUv).rgb;
          if (useV > 0.5) { vec4 v = texture2D(tV, vUv); c = c * v.a + v.rgb; }
          float d = lin(texture2D(tD, vUv + px * vec2(-0.5, -0.5)).x);
          d = min(d, lin(texture2D(tD, vUv + px * vec2(0.5, -0.5)).x));
          d = min(d, lin(texture2D(tD, vUv + px * vec2(-0.5, 0.5)).x));
          d = min(d, lin(texture2D(tD, vUv + px * vec2(0.5, 0.5)).x));
          float coc = clamp(aper * (1.0 - focus / d) * sc, -maxC, maxC);
          gl_FragColor = vec4(min(c, vec3(60.0)), coc);
        }`,
      depthTest: false, depthWrite: false,
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
          for (int i = 0; i < 600; i++) {
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
        }`,
      depthTest: false, depthWrite: false,
    });
    const down = new T.ShaderMaterial({
      uniforms: { tC: { value: dofRT.texture }, px: { value: new T.Vector2(1 / dw, 1 / dh) }, thr: { value: LOOK.bloomThr } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 px; uniform float thr; varying vec2 vUv;
        void main(){
          vec3 c = vec3(0.0);
          for (int i = -1; i <= 2; i++) for (int j = -1; j <= 2; j++) c += texture2D(tC, vUv + px * vec2(float(i) * 2.0 - 0.5, float(j) * 2.0 - 0.5)).rgb;
          c /= 16.0;
          float l = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(min(c * smoothstep(thr, thr + 1.5, l), vec3(40.0)), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const blur = new T.ShaderMaterial({
      uniforms: { tC: { value: null }, dir: { value: new T.Vector2(1 / bw, 0) }, spread: { value: 1.5 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 dir; uniform float spread; varying vec2 vUv;
        void main(){
          float w[5]; w[0] = 0.227; w[1] = 0.1945; w[2] = 0.1216; w[3] = 0.054; w[4] = 0.0162;
          vec3 c = texture2D(tC, vUv).rgb * w[0];
          for (int i = 1; i < 5; i++) { c += texture2D(tC, vUv + dir * float(i) * spread).rgb * w[i]; c += texture2D(tC, vUv - dir * float(i) * spread).rgb * w[i]; }
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const comp = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, tB: { value: dofRT.texture }, tG: { value: bl2.texture }, tS: { value: stRT.texture },
        tV: { value: volRT.texture }, useV: { value: 0 },
        near: { value: 0.05 }, far: { value: 160 }, focus: { value: 2 }, aper: { value: 20 }, sc: { value: LOOK.dofScale },
        expo: { value: 1 }, sat: { value: LOOK.sat }, vig: { value: LOOK.vig }, con: { value: LOOK.contrast }, bloom: { value: LOOK.bloom }, streak: { value: LOOK.streak },
        stTint: { value: new T.Vector3(0.6, 0.75, 1.0) }, lift: { value: new T.Vector3() }, gain: { value: new T.Vector3(1, 1, 1) },
        res: { value: new T.Vector2(W, H) }, seed: { value: 0 }, flash: { value: 0 }, grain: { value: LOOK.grain }, ca: { value: LOOK.ca },
        mb: { value: 0 }, invVP: { value: new T.Matrix4() }, prevVP: { value: new T.Matrix4() }, fade: { value: 0 } },
      vertexShader: VS,
      fragmentShader: `precision highp float;
        uniform sampler2D tC, tD, tB, tG, tS, tV; uniform float useV, focus, aper, sc, expo, sat, vig, con, bloom, streak, seed, flash, grain, ca, mb, fade;
        uniform vec3 stTint, lift, gain; uniform vec2 res; uniform mat4 invVP, prevVP; varying vec2 vUv; ${LIN}
        vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
        vec3 sharpAt(vec2 uv){ vec3 c = texture2D(tC, uv).rgb; if (useV > 0.5) { vec4 v = texture2D(tV, uv); c = c * v.a + v.rgb; } return c; }
        vec3 shade(vec2 uv){
          vec3 sharp;
          float dz = texture2D(tD, uv).x;
          if (mb > 0.0) {
            vec4 wp = invVP * vec4(uv * 2.0 - 1.0, dz * 2.0 - 1.0, 1.0); wp /= wp.w;
            vec4 pc = prevVP * wp; vec2 puv = pc.xy / pc.w * 0.5 + 0.5;
            vec2 vel = (uv - puv) * mb;
            float vl = length(vel * res);
            if (vl > 0.75) {
              vel *= min(1.0, 60.0 / vl);
              vec3 acc = vec3(0.0);
              for (int i = 0; i < 10; i++) { float k = (float(i) + hash(uv * res + float(i))) / 10.0 - 0.5; acc += sharpAt(uv + vel * k); }
              sharp = acc / 10.0;
            } else sharp = sharpAt(uv);
          } else sharp = sharpAt(uv);
          vec4 b = texture2D(tB, uv);
          float d = lin(dz);
          float coc = abs(aper * (1.0 - focus / d)) * sc;
          float k = smoothstep(0.35, 1.6, max(coc, b.a));
          return mix(sharp, b.rgb, k);
        }
        void main(){
          vec2 q = vUv - 0.5; q.x *= res.x / res.y;
          vec3 c;
          if (ca > 0.0) {
            vec2 off = (vUv - 0.5) * ca * length(q) * 2.0;
            c = vec3(shade(vUv + off).r, shade(vUv).g, shade(vUv - off).b);
          } else c = shade(vUv);
          c += texture2D(tG, vUv).rgb * bloom;
          c += texture2D(tS, vUv).rgb * stTint * streak;
          c = c * expo + flash;
          c = aces(c);
          c = (c - 0.5) * con + 0.5;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, sat), 0.0);
          c = c * gain + lift * (1.0 - c);
          c *= 1.0 - vig * smoothstep(0.2, 1.0, length(q) * 1.3);
          c = toSRGB(clamp(c, 0.0, 1.0));
          float gn = hash(vUv * res * 0.5 + 0.37) + hash(vUv * res * 0.5 + 1.91) - 1.0;
          float lum = dot(c, vec3(0.299, 0.587, 0.114));
          c += gn * grain * (1.15 - lum);
          c += (hash(vUv * res + 3.1) - 0.5) / 255.0;
          c *= 1.0 - fade;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), pre);
    quad.frustumCulled = false;
    const qScene = new T.Scene();
    qScene.add(quad);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qScene, qCam); }

    // ------------------------------------------------------------------ camera state
    const fwd = new T.Vector3(), tv = new T.Vector3();
    const prevCam = new T.PerspectiveCamera(30, W / H, 0.05, 160);
    const _vp = new T.Matrix4(), _wp = new T.Vector3(), _q = new T.Quaternion();
    function placeCam(c, s) {
      c.fov = s.fov || 30;
      c.position.fromArray(s.cam);
      c.up.set(0, 1, 0);
      c.lookAt(s.look[0], s.look[1], s.look[2]);
      if (s.roll) c.rotateZ(s.roll * D2R);
      if (s.rot) { c.rotateX(s.rot[0] * D2R); c.rotateY(s.rot[1] * D2R); c.rotateZ(s.rot[2] * D2R); }
      c.near = s.near || 0.05; c.far = s.far || 160;
      c.updateProjectionMatrix();
      c.updateMatrixWorld();
    }
    /** screen position (px) of a world point for the current camera; z < 0 = behind */
    function project(p) {
      _wp.fromArray(p).project(camera);
      return { x: (_wp.x * 0.5 + 0.5) * W, y: (1 - (_wp.y * 0.5 + 0.5)) * H, z: _wp.z, vis: _wp.z < 1 };
    }

    // st: { cam, look, fov, roll, rot, focus ([x,y,z] | metres), aperture, maxBlur, exposure, flash, sat, vig, contrast,
    //       bloom, streak, grain, ca, lift, gain, refl (mirror gain, 0 = off), reflFog, fog: { dens, hFall, hBase, noise,
    //       scale, g, maxDist, ambient: [r,g,b], steps } | null, prev: { cam, look, fov, roll, rot } (motion blur), mblur,
    //       fade (to black 0..1), env: name, envI, t }
    function render(st) {
      st = st || {};
      if (st.env) env.use(st.env, st.envI);
      else if (st.envI != null) scene.environmentIntensity = st.envI;
      placeCam(camera, st);
      preHooks.forEach((f) => f(st));
      updateGlow();
      scene.updateMatrixWorld();
      renderer.shadowMap.needsUpdate = true;
      // 1) mirror
      renderMirror(st.refl != null ? st.refl : 1, st.reflFog != null ? st.reflFog : (st.fog ? st.fog.dens * 0.6 : 0), st.reflFogHex);
      // 2) main
      renderer.setRenderTarget(hdrRT);
      renderer.render(scene, camera);
      renderer.shadowMap.needsUpdate = false;
      // 3) depth (opaque layers only)
      depCam.copy(camera); depCam.layers.set(0); depCam.layers.enable(LAYER.FLOOR);
      const bg = scene.background;
      scene.overrideMaterial = depthOnly;
      renderer.setRenderTarget(depRT);
      renderer.render(scene, depCam);
      scene.overrideMaterial = null;
      scene.background = bg;
      // 4) volumetric haze
      const fog = st.fog;
      const useV = fog && fog.dens > 0 ? 1 : 0;
      if (useV) {
        let n = 0;
        // more registered lights than slots: keep the ones that matter most from this camera
        const cand = vlights.filter((e) => e.light.visible && e.light.intensity > 0 && e.gain > 0);
        if (cand.length > NV) {
          cand.forEach((e) => { e.light.getWorldPosition(tv); e._s = e.light.intensity * e.gain / (tv.distanceToSquared(camera.position) + 4); });
          cand.sort((x, y) => y._s - x._s);
        }
        for (const e of cand) {
          const L = e.light;
          if (n >= NV) break;
          L.getWorldPosition(vU.lPos.value[n]);
          const c = L.color, k = L.intensity * e.gain * (fog.lightGain != null ? fog.lightGain : 1);
          vU.lCol.value[n].set(c.r * k, c.g * k, c.b * k);
          if (L.isSpotLight) {
            L.target.getWorldPosition(tv); vU.lDir.value[n].copy(tv).sub(vU.lPos.value[n]).normalize();
            vU.lCone.value[n].set(Math.cos(L.angle), Math.cos(L.angle * (1 - L.penumbra)));
          } else { vU.lDir.value[n].set(0, -1, 0); vU.lCone.value[n].set(-2, -1.5); }
          vU.lRange.value[n] = L.distance || 0;
          n++;
        }
        vU.nL.value = n;
        vU.invProj.value.copy(camera.projectionMatrixInverse); vU.camWorld.value.copy(camera.matrixWorld); vU.camPos.value.copy(camera.position);
        vU.near.value = camera.near; vU.far.value = camera.far;
        vU.dens.value = fog.dens; vU.hFall.value = fog.hFall != null ? fog.hFall : 0.35; vU.hBase.value = fog.hBase || 0;
        vU.noiseAmt.value = fog.noise != null ? fog.noise : 0.5; vU.noiseScale.value = fog.scale || 0.35; vU.g.value = fog.g != null ? fog.g : 0.35;
        vU.maxDist.value = fog.maxDist || 40; vU.steps.value = fog.steps || LOOK.volSteps; vU.time.value = st.t || 0; vU.frame.value = ((st.t || 0) * 30) % 64;
        const am = fog.ambient || [0, 0, 0]; vU.ambient.value.set(am[0], am[1], am[2]);
        pass(volMat, volRT);
        vblur.uniforms.tC.value = volRT.texture; vblur.uniforms.dir.value.set(1 / vw, 0); pass(vblur, volRT2);
        vblur.uniforms.tC.value = volRT2.texture; vblur.uniforms.dir.value.set(0, 1 / vh); pass(vblur, volRT);
      }
      // 5) DOF
      let F = 2;
      if (Array.isArray(st.focus)) { camera.getWorldDirection(fwd); F = tv.fromArray(st.focus).sub(camera.position).dot(fwd); }
      else if (st.focus) F = st.focus;
      F = Math.max(0.06, F);
      const A = st.aperture != null ? st.aperture : 16;
      const maxC = Math.min(LOOK.maxCoC, st.maxBlur || LOOK.maxCoC) * LOOK.dofScale;
      for (const m of [pre, comp]) { m.uniforms.near.value = camera.near; m.uniforms.far.value = camera.far; m.uniforms.useV.value = useV; }
      pre.uniforms.focus.value = F; pre.uniforms.aper.value = A; pre.uniforms.maxC.value = maxC;
      pass(pre, preRT);
      gather.uniforms.maxR.value = Math.max(1.5, Math.min(maxC, Math.abs(A) * LOOK.dofScale * 1.05 + 1));
      pass(gather, dofRT);
      // 6) bloom + streak
      down.uniforms.thr.value = st.bloomThr != null ? st.bloomThr : LOOK.bloomThr;
      pass(down, bl1);
      blur.uniforms.spread.value = 1.5;
      blur.uniforms.tC.value = bl1.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, bl2);
      blur.uniforms.tC.value = bl2.texture; blur.uniforms.dir.value.set(0, 1 / bh); pass(blur, stRT2);
      blur.uniforms.tC.value = stRT2.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, bl2);
      const stk = st.streak != null ? st.streak : LOOK.streak;
      if (stk > 0) {
        blur.uniforms.spread.value = 3.5; blur.uniforms.tC.value = bl1.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, stRT2);
        blur.uniforms.spread.value = 9.0; blur.uniforms.tC.value = stRT2.texture; pass(blur, stRT);
      }
      // 7) composite
      const cu = comp.uniforms;
      cu.focus.value = F; cu.aper.value = A;
      cu.expo.value = (st.exposure != null ? st.exposure : 1) * LOOK.exposure;
      cu.flash.value = st.flash || 0; cu.sat.value = st.sat != null ? st.sat : LOOK.sat;
      cu.bloom.value = st.bloom != null ? st.bloom : LOOK.bloom; cu.streak.value = stk;
      cu.vig.value = st.vig != null ? st.vig : LOOK.vig; cu.con.value = st.contrast != null ? st.contrast : LOOK.contrast;
      cu.grain.value = st.grain != null ? st.grain : LOOK.grain; cu.ca.value = st.ca != null ? st.ca : LOOK.ca;
      const li = st.lift || LOOK.lift, ga = st.gain || LOOK.gain; cu.lift.value.set(li[0], li[1], li[2]); cu.gain.value.set(ga[0], ga[1], ga[2]);
      if (st.stTint) cu.stTint.value.set(st.stTint[0], st.stTint[1], st.stTint[2]);
      cu.seed.value = ((st.t || 0) * 30) % 97;
      cu.fade.value = st.fade || 0;
      const mbk = st.prev && st.mblur ? st.mblur : 0;
      cu.mb.value = mbk;
      if (mbk > 0) {
        placeCam(prevCam, st.prev);
        _vp.multiplyMatrices(prevCam.projectionMatrix, prevCam.matrixWorldInverse); cu.prevVP.value.copy(_vp);
        _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); cu.invVP.value.copy(_vp).invert();
      }
      pass(comp, null);
      renderer.setRenderTarget(null);
    }

    return {
      T, W, H, scene, camera, renderer, LOOK, LAYER, D2R, clamp, lerp, sstep, rng, noise1, handheld, hash1,
      mat, glow, M, G, box, cyl, sph, capsule, rbox, lathe, scaleUV, canvasTex, noiseField, normalTex, concrete,
      light, vlights, shadowLights, env, wetFloor, fixtureGlow, glowPts, updateGlow, floorMats, mirrorY, project, render, preHooks, loads,
      get ready() { return Promise.all(loads).then(() => new Promise((r) => setTimeout(r, 30))); },
    };
  }

  window.RH3D = Object.assign(window.RH3D || {}, { create, rng, noise1, handheld, clamp, lerp, sstep, D2R });
})();
