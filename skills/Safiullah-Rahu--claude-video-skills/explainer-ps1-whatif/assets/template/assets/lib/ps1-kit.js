/* ps1-kit.js — a PS1-era (1995-2000 console) renderer and toy box for HyperFrames + three.js r170 (window.THREE).
   The look, done the way the hardware did it:
   - the scene renders into a LOW-RES target (default 270x480 for a 1080x1920 frame) and is upscaled NEAREST (4x pixels);
   - vertices snap to that pixel grid in clip space (the "wobble"), texture coordinates are interpolated AFFINE
     (no perspective correction: uv*w / w trick), lighting is per VERTEX (Gouraud) and fog is per VERTEX (depth cue);
   - textures are tiny canvases (16-64 px) with NearestFilter and no mipmaps;
   - the final pass quantizes to 15-bit colour (5 bits per channel) through a 4x4 ordered Bayer dither;
   - plus a VHS layer on top (tracking band with a dotted line, chroma bleed, grain, a rewind "tear" mode) and a soft
     low-res bloom, because the reels this format comes from are PS1 renders seen through a tape.
   Everything is a pure function of the state passed to K.render(st) (seek-safe, deterministic).
   API: PS1.create({canvas, width, height, lowW, lowH}) -> K
     K.scene, K.camera, K.T (THREE), K.tex.* procedural textures, K.mat(opts), K.box/plane/cyl/ico/taper(...),
     K.human(opts) -> rig (rig.set({...})), K.blob(r) blob shadow, K.sky(top, bottom), K.signTex(text, opts),
     K.render(st)  st = {cam:[x,y,z], look:[x,y,z], fov, roll, sun:{dir,col}, amb:{sky,gnd}, pts:[{p,c,r}],
                         fog:{col,near,far}, expo, sat, tint, bloom, rew (0..1 rewind tear), noise, fade, flash,
                         snap (1), dither (1), track (VHS band 0..1), t}
*/
(function () {
  const T = window.THREE;

  // ---------- small deterministic helpers ----------
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hexRGB = (h) => { const c = new T.Color(h); return [c.r, c.g, c.b]; };

  // ---------- shaders ----------
  const PSX_V = `
    uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uGnd;
    uniform vec3 uPLp[4]; uniform vec3 uPLc[4]; uniform float uPLr[4];
    uniform float uFogNear; uniform float uFogFar; uniform vec2 uGrid; uniform float uSnap;
    uniform float uUnlit; uniform float uNoFog; uniform float uAffine; uniform float uWrap;
    varying vec3 vUvw; varying vec3 vLight; varying float vFog; varying vec3 vCol;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vec3 n = normalize(mat3(modelMatrix) * normal);
      float hemi = n.y * 0.5 + 0.5;
      vec3 L = mix(uGnd, uSky, hemi);
      float nd = dot(n, -uSunDir);
      L += uSunCol * max((nd + uWrap) / (1.0 + uWrap), 0.0);
      for (int i = 0; i < 4; i++) {
        vec3 d = uPLp[i] - wp.xyz; float dist = length(d);
        float a = clamp(1.0 - dist / max(uPLr[i], 0.001), 0.0, 1.0);
        L += uPLc[i] * a * a * (0.35 + 0.65 * max(dot(n, d / max(dist, 1e-4)), 0.0));
      }
      vLight = mix(L, vec3(1.0), uUnlit);
      #ifdef USE_COLOR
        vCol = color;
      #else
        vCol = vec3(1.0);
      #endif
      vec4 mv = viewMatrix * wp;
      vec4 cp = projectionMatrix * mv;
      if (uSnap > 0.5 && cp.w > 0.0) {
        vec2 g = uGrid * 0.5;
        cp.xy = floor(cp.xy / cp.w * g + 0.5) / g * cp.w;
      }
      gl_Position = cp;
      vFog = uNoFog > 0.5 ? 0.0 : clamp((-mv.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
      float w = uAffine > 0.5 ? max(cp.w, 0.0001) : 1.0;
      vUvw = vec3(uv * w, w);
    }`;
  const PSX_F = `
    uniform sampler2D map; uniform float uHasMap; uniform vec3 uColor; uniform vec3 uEmis; uniform vec3 uFogCol;
    uniform float uAlpha; uniform float uAlphaTest; uniform vec2 uUvOff;
    varying vec3 vUvw; varying vec3 vLight; varying float vFog; varying vec3 vCol;
    void main(){
      vec2 uv = vUvw.xy / vUvw.z + uUvOff;
      vec4 tx = uHasMap > 0.5 ? texture2D(map, uv) : vec4(1.0);
      if (tx.a < uAlphaTest) discard;
      vec3 base = tx.rgb * uColor * vCol;
      vec3 c = base * vLight + uEmis * tx.rgb;
      c = mix(c, uFogCol, vFog);
      gl_FragColor = vec4(c, tx.a * uAlpha);
    }`;

  const POST_V = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const BRIGHT_F = `uniform sampler2D tSrc; uniform float uThr; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float l = dot(c, vec3(0.299,0.587,0.114));
      gl_FragColor = vec4(c * smoothstep(uThr, uThr + 0.35, l), 1.0); }`;
  const BLUR_F = `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 0.2270;
      c += texture2D(tSrc, vUv + uDir * 1.3846).rgb * 0.3162; c += texture2D(tSrc, vUv - uDir * 1.3846).rgb * 0.3162;
      c += texture2D(tSrc, vUv + uDir * 3.2308).rgb * 0.0703; c += texture2D(tSrc, vUv - uDir * 3.2308).rgb * 0.0703;
      gl_FragColor = vec4(c, 1.0); }`;
  const FINAL_F = `
    uniform sampler2D tLow; uniform sampler2D tBloom; uniform vec2 uLow; uniform vec2 uOut; uniform float uTime;
    uniform float uBloom; uniform float uDither; uniform float uExpo; uniform float uSat; uniform vec3 uTint;
    uniform float uRew; uniform float uNoise; uniform float uTrack; uniform float uFade; uniform float uFlash;
    uniform float uVig; uniform float uChroma; uniform float uLift; uniform float uHaze;
    varying vec2 vUv;
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float bayer(vec2 p){
      vec2 q = mod(floor(p), 4.0);
      float i = q.x + q.y * 4.0;
      // 4x4 Bayer matrix values / 16
      float b = 0.0;
      if (i < 0.5) b = 0.0; else if (i < 1.5) b = 8.0; else if (i < 2.5) b = 2.0; else if (i < 3.5) b = 10.0;
      else if (i < 4.5) b = 12.0; else if (i < 5.5) b = 4.0; else if (i < 6.5) b = 14.0; else if (i < 7.5) b = 6.0;
      else if (i < 8.5) b = 3.0; else if (i < 9.5) b = 11.0; else if (i < 10.5) b = 1.0; else if (i < 11.5) b = 9.0;
      else if (i < 12.5) b = 15.0; else if (i < 13.5) b = 7.0; else if (i < 14.5) b = 13.0; else b = 5.0;
      return b / 16.0;
    }
    void main(){
      vec2 uv = vUv;
      float tf = floor(uTime * 30.0);
      // --- rewind tear: rows of the low-res image slide sideways, a few bands roll upward
      float row = floor(uv.y * uLow.y);
      float band = step(0.82, h21(vec2(floor(row / 6.0), tf)));
      float roll = fract(uv.y * 1.0 + uTime * 2.7);
      float rollBand = smoothstep(0.0, 0.04, roll) * (1.0 - smoothstep(0.06, 0.12, roll));
      uv.x += uRew * (band * (h21(vec2(row, tf)) - 0.5) * 0.09 + rollBand * 0.05 + sin(uv.y * 40.0 + uTime * 30.0) * 0.004);
      // tracking jitter at the band
      float ty = 0.164;
      float near = 1.0 - smoothstep(0.0, 0.03, abs(uv.y - ty));
      uv.x += near * uTrack * (h21(vec2(row, tf * 1.7)) - 0.5) * 0.012;
      vec2 px = (floor(uv * uLow) + 0.5) / uLow;
      vec2 ch = vec2((uChroma + uRew * 2.5) / uLow.x, 0.0);
      vec3 c;
      c.r = texture2D(tLow, px + ch).r;
      c.g = texture2D(tLow, px).g;
      c.b = texture2D(tLow, px - ch).b;
      c += texture2D(tBloom, uv).rgb * uBloom;
      // haze: the soft milky lift these renders have
      c = mix(c, vec3(0.92, 0.90, 0.88), uHaze * (0.35 + 0.65 * smoothstep(0.55, 0.05, uv.y)) * 0.18);
      // grade
      c *= uExpo; c += uLift;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, uSat) * uTint;
      // 15-bit colour through an ordered dither on the LOW-RES grid
      float d = (bayer(floor(uv * uLow)) - 0.5) * uDither / 31.0;
      c = floor(clamp(c + d, 0.0, 1.0) * 31.0 + 0.5) / 31.0;
      // VHS: tracking band (soft light strip + dotted line) at 83.6 % down the frame
      vec2 op = uv * uOut;
      float bandY = abs(vUv.y - ty) * uOut.y;
      c += uTrack * 0.10 * exp(-bandY * bandY / 2000.0);
      float dots = step(0.5, fract(op.x / 14.0)) * (1.0 - step(2.6, bandY));
      c = mix(c, vec3(0.86), uTrack * 0.38 * dots);
      // rewind: white noise streaks + a darker frame
      float nz = h21(vec2(floor(op.x / 3.0), floor(op.y / 2.0)) + tf);
      c = mix(c, vec3(nz), uRew * 0.10 + uNoise * 0.05);
      float streak = step(0.985, h21(vec2(floor(op.y / 3.0), tf))) * uRew;
      c = mix(c, vec3(0.95), streak * 0.65);
      // grain at output resolution
      c += (h21(op + tf * 7.0) - 0.5) * 0.035;
      // vignette, fade, flash
      vec2 q = vUv - 0.5; c *= 1.0 - uVig * dot(q * vec2(1.2, 1.0), q * vec2(1.2, 1.0)) * 1.6;
      c = mix(c, vec3(1.0), uFlash);
      c *= 1.0 - uFade;
      gl_FragColor = vec4(c, 1.0);
    }`;

  function create(opt) {
    const W = opt.width || 1080, H = opt.height || 1920;
    const LW = opt.lowW || 270, LH = opt.lowH || 480;
    const renderer = new T.WebGLRenderer({ canvas: opt.canvas, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.autoClear = true;
    const rtOpt = { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true, generateMipmaps: false };
    const rtLow = new T.WebGLRenderTarget(LW, LH, rtOpt);
    const BW = Math.round(LW / 3), BH = Math.round(LH / 3);
    const rtB1 = new T.WebGLRenderTarget(BW, BH, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
    const rtB2 = new T.WebGLRenderTarget(BW, BH, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });

    const scene = new T.Scene();
    scene.background = new T.Color("#000000");
    const camera = new T.PerspectiveCamera(50, W / H, 0.08, 900);

    // shared uniforms (one object per uniform, referenced by every material)
    const U = {
      uSunDir: { value: new T.Vector3(-0.4, -1, -0.3).normalize() }, uSunCol: { value: new T.Color(1, 0.95, 0.85) },
      uSky: { value: new T.Color(0.42, 0.45, 0.52) }, uGnd: { value: new T.Color(0.22, 0.2, 0.19) },
      uPLp: { value: [0, 1, 2, 3].map(() => new T.Vector3(0, -999, 0)) }, uPLc: { value: [0, 1, 2, 3].map(() => new T.Color(0, 0, 0)) },
      uPLr: { value: [1, 1, 1, 1] },
      uFogNear: { value: 30 }, uFogFar: { value: 160 }, uFogCol: { value: new T.Color("#9aa3ad") },
      uGrid: { value: new T.Vector2(LW, LH) }, uSnap: { value: 1 }, uAffine: { value: 1 },
    };

    const mats = [];
    function mat(o) {
      o = o || {};
      const u = Object.assign({}, U, {
        map: { value: o.map || null }, uHasMap: { value: o.map ? 1 : 0 },
        uColor: { value: new T.Color(o.color == null ? "#ffffff" : o.color) },
        uEmis: { value: new T.Color(o.emissive == null ? "#000000" : o.emissive) },
        uUnlit: { value: o.unlit ? 1 : 0 }, uNoFog: { value: o.noFog ? 1 : 0 },
        uAlpha: { value: o.alpha == null ? 1 : o.alpha }, uAlphaTest: { value: o.alphaTest == null ? (o.map && o.cutout ? 0.5 : 0.0) : o.alphaTest },
        uWrap: { value: o.wrap == null ? 0.45 : o.wrap }, uUvOff: { value: new T.Vector2(0, 0) },
      });
      if (o.affine === false) u.uAffine = { value: 0 };
      const m = new T.ShaderMaterial({
        uniforms: u, vertexShader: PSX_V, fragmentShader: PSX_F,
        transparent: !!o.transparent, side: o.side || (o.double ? T.DoubleSide : T.FrontSide),
        vertexColors: !!o.vcol, depthWrite: o.depthWrite == null ? !o.transparent : o.depthWrite,
        blending: o.additive ? T.AdditiveBlending : T.NormalBlending,
      });
      m.userData.kit = true;
      mats.push(m);
      return m;
    }
    function setColor(m, c) { m.uniforms.uColor.value.set(c); }
    function setEmis(m, c) { m.uniforms.uEmis.value.set(c); }

    // ---------- textures ----------
    const texCache = {};
    function canvasTex(w, h, draw, key, rep) {
      if (key && texCache[key]) return texCache[key];
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
      draw(g, w, h);
      const t = new T.CanvasTexture(c);
      t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false;
      t.colorSpace = T.NoColorSpace;
      t.wrapS = t.wrapT = rep === false ? T.ClampToEdgeWrapping : T.RepeatWrapping;
      t.userData.canvas = c;
      if (key) texCache[key] = t;
      return t;
    }
    function speckle(g, w, h, base, amt, seed, cell) {
      const r = mulberry(seed || 7); const c0 = new T.Color(base);
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      const cs = cell || 1;
      for (let y = 0; y < h; y += cs) for (let x = 0; x < w; x += cs) {
        const k = 1 + (r() - 0.5) * amt;
        g.fillStyle = `rgb(${Math.round(clamp(c0.r * k, 0, 1) * 255)},${Math.round(clamp(c0.g * k, 0, 1) * 255)},${Math.round(clamp(c0.b * k, 0, 1) * 255)})`;
        g.fillRect(x, y, cs, cs);
      }
    }
    const tex = {
      noise: (base, amt, seed, size) => canvasTex(size || 32, size || 32, (g, w, h) => speckle(g, w, h, base, amt || 0.18, seed), `n${base}${amt}${seed}${size}`),
      brick: (base, mortar) => canvasTex(32, 32, (g, w, h) => {
        speckle(g, w, h, mortar || "#8c8378", 0.1, 3);
        const r = mulberry(11); const c0 = new T.Color(base || "#9b4a3a");
        for (let row = 0; row < 8; row++) for (let i = -1; i < 4; i++) {
          const k = 0.85 + r() * 0.3; g.fillStyle = `rgb(${c0.r * k * 255 | 0},${c0.g * k * 255 | 0},${c0.b * k * 255 | 0})`;
          g.fillRect(i * 10 + (row % 2) * 5 + 1, row * 4 + 1, 9, 3);
        }
      }, `brick${base}${mortar}`),
      tiles: (a, b, n) => canvasTex(32, 32, (g, w, h) => {
        const k = n || 4, s = w / k;
        for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); }
        g.fillStyle = "rgba(0,0,0,0.18)"; for (let i = 0; i < k; i++) { g.fillRect(i * s, 0, 1, h); g.fillRect(0, i * s, w, 1); }
      }, `tiles${a}${b}${n}`),
      grid: (a, line, n) => canvasTex(32, 32, (g, w, h) => {
        speckle(g, w, h, a, 0.08, 5); const k = n || 4, s = w / k;
        g.fillStyle = line; for (let i = 0; i < k; i++) { g.fillRect(i * s, 0, 1, h); g.fillRect(0, i * s, w, 1); }
      }, `grid${a}${line}${n}`),
      wood: (base) => canvasTex(32, 32, (g, w, h) => {
        const r = mulberry(21); const c0 = new T.Color(base || "#8a5a33");
        for (let y = 0; y < h; y++) { const k = 0.8 + 0.25 * Math.sin(y * 0.9 + r() * 2) + r() * 0.1;
          g.fillStyle = `rgb(${c0.r * k * 255 | 0},${c0.g * k * 255 | 0},${c0.b * k * 255 | 0})`; g.fillRect(0, y, w, 1); }
        g.fillStyle = "rgba(0,0,0,0.25)"; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1, h);
      }, `wood${base}`),
      windows: (wall, glass, lit, cols, rows, seed) => canvasTex(32, 32, (g, w, h) => {
        speckle(g, w, h, wall, 0.12, seed || 2);
        const r = mulberry(seed || 9); const cx = cols || 3, cy = rows || 3;
        const sx = w / cx, sy = h / cy;
        for (let y = 0; y < cy; y++) for (let x = 0; x < cx; x++) {
          g.fillStyle = r() < 0.25 && lit ? lit : glass;
          g.fillRect(Math.round(x * sx + sx * 0.22), Math.round(y * sy + sy * 0.18), Math.round(sx * 0.56), Math.round(sy * 0.6));
          g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(Math.round(x * sx + sx * 0.22), Math.round(y * sy + sy * 0.18), Math.round(sx * 0.56), 1);
        }
      }, `win${wall}${glass}${lit}${cols}${rows}${seed}`),
      stripes: (a, b, n, vertical) => canvasTex(32, 32, (g, w, h) => {
        const k = n || 4, s = w / k;
        for (let i = 0; i < k; i++) { g.fillStyle = i % 2 ? a : b; if (vertical) g.fillRect(i * s, 0, s, h); else g.fillRect(0, i * s, w, s); }
      }, `str${a}${b}${n}${vertical}`),
      grass: () => canvasTex(32, 32, (g, w, h) => {
        speckle(g, w, h, "#5d7f3a", 0.35, 31);
        const r = mulberry(32); g.fillStyle = "#7da04a"; for (let i = 0; i < 60; i++) g.fillRect(r() * w | 0, r() * h | 0, 1, 2);
      }, "grass"),
      asphalt: () => canvasTex(32, 32, (g, w, h) => speckle(g, w, h, "#4a4a4e", 0.3, 41), "asphalt"),
      leaves: (base) => canvasTex(16, 16, (g, w, h) => {
        speckle(g, w, h, base || "#5f8a3a", 0.5, 51);
        const r = mulberry(52); g.fillStyle = "rgba(255,255,200,0.25)"; for (let i = 0; i < 14; i++) g.fillRect(r() * w | 0, r() * h | 0, 1, 1);
      }, `leaves${base}`),
      fabric: (base, amt) => canvasTex(16, 16, (g, w, h) => {
        speckle(g, w, h, base, amt || 0.12, 61);
        g.fillStyle = "rgba(0,0,0,0.08)"; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 1);
      }, `fab${base}${amt}`),
    };

    // sign / label texture with the pixel font
    function signTex(text, o) {
      o = o || {};
      const s = o.s || 2, pad = (o.pad == null ? 2 : o.pad) * s;
      const lines = String(text).split("\n");
      const tw = Math.max(...lines.map((l) => window.PIXFONT.measure(l, s, 1)));
      const w = o.w || tw + pad * 2, h = o.h || lines.length * 11 * s - 4 * s + pad * 2;
      return canvasTex(w, h, (g) => {
        g.fillStyle = o.bg || "#20242c"; g.fillRect(0, 0, w, h);
        if (o.border) { g.fillStyle = o.border; g.fillRect(0, 0, w, s); g.fillRect(0, h - s, w, s); g.fillRect(0, 0, s, h); g.fillRect(w - s, 0, s, h); }
        window.PIXFONT.draw(g, text, w / 2, (h - (lines.length * 11 * s - 4 * s)) / 2, s, { fill: o.fill || "#ffffff", align: "center" });
      }, "sign" + text + JSON.stringify(o), false);
    }

    // ---------- geometry helpers ----------
    function place(m, p) {
      p = p || {};
      if (p.x != null || p.y != null || p.z != null) m.position.set(p.x || 0, p.y || 0, p.z || 0);
      if (p.ry != null) m.rotation.y = p.ry;
      if (p.rx != null) m.rotation.x = p.rx;
      if (p.rz != null) m.rotation.z = p.rz;
      if (p.parent) p.parent.add(m); else if (p.add !== false) scene.add(m);
      return m;
    }
    function uvScale(geo, su, sv) {
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
      uv.needsUpdate = true; return geo;
    }
    function box(w, h, d, m, p) {
      const g = new T.BoxGeometry(w, h, d);
      if (p && p.uv) uvScale(g, p.uv[0], p.uv[1]);
      if (p && p.base) g.translate(0, h / 2, 0);
      return place(new T.Mesh(g, m), p);
    }
    function plane(w, h, m, p) {
      const g = new T.PlaneGeometry(w, h, (p && p.seg) || 1, (p && p.seg) || 1);
      if (p && p.uv) uvScale(g, p.uv[0], p.uv[1]);
      return place(new T.Mesh(g, m), p);
    }
    function cyl(rt, rb, h, seg, m, p) {
      const g = new T.CylinderGeometry(rt, rb, h, seg || 6, 1);
      if (p && p.base) g.translate(0, h / 2, 0);
      if (p && p.uv) uvScale(g, p.uv[0], p.uv[1]);
      return place(new T.Mesh(g, m), p);
    }
    function ico(r, m, p, detail) {
      const g = new T.IcosahedronGeometry(r, detail || 0);
      if (p && p.sy) g.scale(1, p.sy, 1);
      return place(new T.Mesh(g, m), p);
    }
    function taper(w0, d0, w1, d1, h, up) { // box from y=0 to y=-h (or +h when up), top w0xd0, far end w1xd1
      const g = new T.BoxGeometry(1, 1, 1); g.translate(0, up ? 0.5 : -0.5, 0);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i); const t = up ? y : -y;
        pos.setXYZ(i, pos.getX(i) * lerp(w0, w1, t), y * h, pos.getZ(i) * lerp(d0, d1, t));
      }
      g.computeVertexNormals();
      return g;
    }
    // blob shadow: a dark disc on the ground (PS1 games had no shadow maps)
    const blobTex = canvasTex(16, 16, (g, w, h) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) / (w / 2);
        g.fillStyle = `rgba(0,0,0,${clamp(1 - d, 0, 1) * 0.9})`; g.fillRect(x, y, 1, 1);
      }
    }, "blob", false);
    function blob(r, p) {
      const m = mat({ map: blobTex, transparent: true, unlit: true, color: "#000000", alpha: 0.55 });
      m.uniforms.uColor.value.set("#ffffff");
      const mesh = plane(r * 2, r * 2, m, Object.assign({ rx: -Math.PI / 2 }, p || {}));
      mesh.renderOrder = 1;
      return mesh;
    }
    function sky(top, bottom, p) {
      const g = new T.SphereGeometry(400, 12, 8);
      const col = [], pos = g.attributes.position, ct = new T.Color(top), cb = new T.Color(bottom);
      for (let i = 0; i < pos.count; i++) { const u = clamp(pos.getY(i) / 400 * 1.6 + 0.15, 0, 1); const c = cb.clone().lerp(ct, u); col.push(c.r, c.g, c.b); }
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      const m = mat({ unlit: true, noFog: true, vcol: true, side: T.BackSide });
      m.depthWrite = false;
      const mesh = place(new T.Mesh(g, m), p);
      mesh.renderOrder = -10; mesh.frustumCulled = false;
      return mesh;
    }

    // ---------- faces ----------
    // 32x32 faces, transparent except the features; drawn per (skin, eyes, lips, expression)
    function faceTex(o, expr) {
      const key = `face${o.skin}${o.eye}${o.lip}${o.brow}${expr}${o.fem ? 1 : 0}${o.blush || ""}${o.beard || ""}`;
      return canvasTex(32, 32, (g) => {
        const sk = new T.Color(o.skin); const dk = (k) => `rgb(${sk.r * k * 255 | 0},${sk.g * k * 255 | 0},${sk.b * k * 255 | 0})`;
        const px = (x, y, c, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
        const brow = o.brow || "#2a1d16", eye = o.eye || "#2b2420", lip = o.lip || dk(0.72);
        // nose shadow + cheek shading (opaque skin-dark pixels)
        px(15, 16, dk(0.84), 2, 3); px(14, 19, dk(0.78), 4, 1);
        if (o.blush) { px(8, 18, o.blush, 3, 2); px(21, 18, o.blush, 3, 2); }
        if (o.beard) { g.fillStyle = o.beard; g.fillRect(9, 22, 14, 5); g.fillRect(11, 27, 10, 2); }
        const E = { L: 9, R: 19, y: 12 };
        const eyesOpen = (hgt, look) => {
          for (const x0 of [E.L, E.R]) {
            px(x0, E.y, "#f2efe8", 4, hgt); px(x0 + 1 + (look || 0), E.y + (hgt > 2 ? 1 : 0), eye, 2, Math.min(2, hgt));
            px(x0, E.y - 1, dk(0.55), 4, 1); // upper lid line
            if (o.fem) { px(x0 - 1, E.y - 1, "#1a1210"); px(x0 + 4, E.y - 1, "#1a1210"); }
          }
        };
        const eyesClosed = (curve) => { for (const x0 of [E.L, E.R]) { px(x0, E.y + 1, dk(0.45), 4, 1); if (curve) { px(x0, E.y, dk(0.45)); px(x0 + 3, E.y, dk(0.45)); } } };
        const brows = (inner, outer) => { // offsets: negative = up
          for (const [x0, s] of [[E.L, 1], [E.R, -1]]) {
            for (let i = 0; i < 4; i++) { const k = s > 0 ? i : 3 - i; const off = Math.round(lerp(outer, inner, k / 3)); px(x0 + i, E.y - 3 + off, brow, 1, 1 + (o.fem ? 0 : 1) * (i % 2)); }
          }
        };
        const mouth = (kind) => {
          if (kind === "line") px(13, 23, lip, 6, 1);
          if (kind === "smile") { px(13, 23, lip, 6, 1); px(12, 22, lip); px(19, 22, lip); }
          if (kind === "grin") { px(12, 22, lip, 8, 1); px(13, 23, "#f4efe6", 6, 1); px(13, 24, lip, 6, 1); }
          if (kind === "laugh") { px(12, 22, lip, 8, 1); px(12, 23, "#3a1414", 8, 3); px(13, 23, "#f4efe6", 6, 1); px(13, 26, lip, 6, 1); }
          if (kind === "sad") { px(13, 23, lip, 6, 1); px(12, 24, lip); px(19, 24, lip); }
          if (kind === "o") { px(14, 22, lip, 4, 1); px(13, 23, lip, 1, 2); px(18, 23, lip, 1, 2); px(14, 23, "#3a1414", 4, 2); px(14, 25, lip, 4, 1); }
          if (kind === "talk") { px(13, 22, lip, 6, 1); px(13, 23, "#3a1414", 6, 2); px(13, 25, lip, 6, 1); }
          if (kind === "flat") px(13, 23, dk(0.6), 6, 1);
        };
        switch (expr) {
          case "smile": eyesOpen(3); brows(0, 0); mouth("smile"); break;
          case "grin": eyesOpen(2); brows(0, 0); mouth("grin"); break;
          case "laugh": eyesClosed(true); brows(-1, 0); mouth("laugh"); break;
          case "sad": eyesOpen(2); brows(-2, 0); mouth("sad"); break;
          case "surprised": eyesOpen(4); brows(-2, -2); mouth("o"); break;
          case "closed": eyesClosed(false); brows(0, 0); mouth("line"); break;
          case "talk": eyesOpen(3); brows(0, 0); mouth("talk"); break;
          case "worried": eyesOpen(3); brows(-2, 1); mouth("flat"); break;
          case "blank": eyesOpen(3, 0); brows(0, 0); mouth("flat"); break;
          case "lookL": eyesOpen(3, -1); brows(0, 0); mouth("line"); break;
          case "lookR": eyesOpen(3, 1); brows(0, 0); mouth("line"); break;
          default: eyesOpen(3); brows(0, 0); mouth("line");
        }
      }, key, false);
    }

    // ---------- the human rig ----------
    const POSES = {
      stand: {},
      relaxed: { shL: [0.05, 0, 0.12], shR: [0.05, 0, -0.12], elL: [-0.15, 0, 0], elR: [-0.15, 0, 0] },
      sit: { hipL: [-1.5, 0, 0.06], hipR: [-1.5, 0, -0.06], knL: [1.5, 0, 0], knR: [1.5, 0, 0], shL: [-0.35, 0, 0.12], shR: [-0.35, 0, -0.12], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0], hipsY: -0.47 },
      sitBack: { hipL: [-1.35, 0, 0.1], hipR: [-1.35, 0, -0.1], knL: [1.25, 0, 0], knR: [1.25, 0, 0], spine: [-0.25, 0, 0], shL: [0.1, 0, 0.35], shR: [0.1, 0, -0.35], elL: [-0.6, 0, 0], elR: [-0.6, 0, 0], hipsY: -0.47 },
      lie: { root: [-Math.PI / 2, 0, 0], shL: [0, 0, 0.18], shR: [0, 0, -0.18] },
      phone: { shR: [-0.55, 0.15, -0.2], elR: [-1.7, 0, 0], neck: [0.25, 0, 0], head: [0.2, 0, 0] },
      phoneEar: { shR: [-0.4, 0, -0.7], elR: [-2.35, 0, 0] },
      point: { shR: [-1.45, 0.1, -0.05], elR: [-0.05, 0, 0] },
      armsUp: { shL: [-2.7, 0, 0.35], shR: [-2.7, 0, -0.35], elL: [-0.2, 0, 0], elR: [-0.2, 0, 0] },
      shoot: { shL: [-2.4, 0.2, 0.2], shR: [-2.6, -0.1, -0.15], elL: [-0.7, 0, 0], elR: [-0.5, 0, 0], knL: [0.25, 0, 0], knR: [0.25, 0, 0], hipL: [-0.12, 0, 0], hipR: [-0.12, 0, 0] },
      shootLoad: { shL: [-1.4, 0.25, 0.2], shR: [-1.5, -0.1, -0.15], elL: [-1.6, 0, 0], elR: [-1.7, 0, 0], knL: [0.7, 0, 0], knR: [0.7, 0, 0], hipL: [-0.4, 0, 0], hipR: [-0.4, 0, 0], hipsY: -0.08 },
      present: { shR: [-1.0, 0.3, -0.35], elR: [-0.8, 0, 0], shL: [-0.3, 0, 0.15], elL: [-0.5, 0, 0] },
      hands: { shL: [-0.5, -0.2, 0.15], shR: [-0.5, 0.2, -0.15], elL: [-1.2, 0, 0], elR: [-1.2, 0, 0] },
      vows: { shL: [-0.55, -0.45, 0.1], shR: [-0.55, 0.45, -0.1], elL: [-0.95, 0, 0], elR: [-0.95, 0, 0] },
      shrug: { shL: [-0.2, 0, 0.5], shR: [-0.2, 0, -0.5], elL: [-1.4, 0.4, 0], elR: [-1.4, -0.4, 0], neck: [0, 0, 0.12] },
      laugh: { spine: [-0.18, 0, 0], neck: [-0.25, 0, 0], shL: [-0.25, 0, 0.25], shR: [-0.25, 0, -0.25], elL: [-1.3, 0, 0], elR: [-1.3, 0, 0] },
      armsCross: { shL: [-0.6, -0.5, 0.2], shR: [-0.6, 0.5, -0.2], elL: [-1.9, 0, 0], elR: [-1.9, 0, 0] },
      fall: { root: [1.05, 0, 0], shL: [-1.6, 0, 0.5], shR: [-1.6, 0, -0.5], elL: [-0.2, 0, 0], elR: [-0.2, 0, 0], hipL: [-0.2, 0, 0], hipR: [0.4, 0, 0], knL: [0.6, 0, 0], knR: [0.3, 0, 0], neck: [-0.3, 0, 0] },
      sleep: { root: [-Math.PI / 2, 0, 0], shL: [0, 0, 0.1], shR: [-0.4, 0, -0.2], elR: [-1.2, 0, 0], neck: [0, 0.5, 0] },
      hug: { shL: [-1.3, -0.6, 0.2], shR: [-1.3, 0.6, -0.2], elL: [-1.0, 0, 0], elR: [-1.0, 0, 0] },
      typing: { shL: [-0.7, 0, 0.12], shR: [-0.7, 0, -0.12], elL: [-1.1, 0, 0], elR: [-1.1, 0, 0], neck: [0.2, 0, 0] },
      wheel: { shL: [-1.0, 0, 0.15], shR: [-1.0, 0, -0.15], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0] },
      handOut: { shR: [-1.15, 0.25, -0.1], elR: [-0.25, 0, 0] },
    };
    const JOINTS = ["root", "spine", "neck", "head", "shL", "shR", "elL", "elR", "hipL", "hipR", "knL", "knR", "anL", "anR"];

    function human(o) {
      o = Object.assign({ skin: "#d8a77f", hair: "#2b1d14", top: "#c9a227", bottom: "#2d3a55", shoes: "#2a2a2a", style: "short", h: 1.0, fem: false, sleeves: "long" }, o || {});
      const S = o.h; // overall scale
      const root = new T.Group();
      const hips = new T.Group(); root.add(hips); hips.position.y = 0.95 * S;
      const skinM = mat({ color: o.skin });
      const topM = mat({ color: o.top, map: o.topMap || tex.fabric("#ffffff", 0.14) });
      const botM = mat({ color: o.bottom, map: o.botMap || tex.fabric("#ffffff", 0.18) });
      const shoeM = mat({ color: o.shoes });
      const hairM = mat({ color: o.hair, map: tex.fabric("#ffffff", 0.3) });
      const J = {};
      const mk = (geo, m, parent, p) => { const mesh = new T.Mesh(geo, m); if (p) mesh.position.set(p[0], p[1], p[2]); parent.add(mesh); return mesh; };
      // pelvis + torso
      const fem = o.fem;
      mk(taper(fem ? 0.34 : 0.32, 0.2, fem ? 0.36 : 0.3, 0.19, 0.14 * S), botM, hips, [0, 0.04 * S, 0]);
      J.spine = new T.Group(); hips.add(J.spine); J.spine.position.y = 0.04 * S;
      const chestW = fem ? 0.36 : 0.42;
      mk(taper(fem ? 0.29 : 0.31, 0.19, chestW, 0.22, 0.38 * S, true), topM, J.spine, [0, 0, 0]);
      mk(taper(chestW, 0.22, chestW * 0.62, 0.15, 0.14 * S, true), topM, J.spine, [0, 0.38 * S, 0]);
      if (o.dress) mk(taper(0.36, 0.24, 0.6, 0.42, 0.5 * S), mat({ color: o.dress, map: tex.fabric("#ffffff", 0.12) }), J.spine, [0, 0.02, 0]);
      J.neck = new T.Group(); J.spine.add(J.neck); J.neck.position.y = 0.52 * S;
      mk(new T.CylinderGeometry(0.05, 0.058, 0.08 * S, 6).translate(0, 0.03 * S, 0), skinM, J.neck);
      J.head = new T.Group(); J.neck.add(J.head); J.head.position.y = 0.035 * S;
      const HR = 0.115 * S * (o.headK || 1);
      const headGeo = new T.SphereGeometry(HR, 8, 7); headGeo.scale(0.9, 1.12, 0.98); headGeo.translate(0, HR * 1.05, 0);
      const headMesh = mk(headGeo, skinM, J.head);
      // face decal: a plane bent onto the front of the head
      const fg = new T.PlaneGeometry(HR * 1.62, HR * 1.62, 6, 6);
      const fp = fg.attributes.position;
      for (let i = 0; i < fp.count; i++) {
        const x = fp.getX(i), y = fp.getY(i);
        const nx = x / (HR * 0.9), ny = y / (HR * 1.12);
        const z = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny)) * HR * 0.98 + 0.004;
        fp.setXYZ(i, x, y + HR * 1.0, z);
      }
      fg.computeVertexNormals();
      const faceM = mat({ map: faceTex(o, "neutral"), cutout: true, color: o.skin === "#ffffff" ? "#ffffff" : "#ffffff" });
      faceM.uniforms.uAlphaTest.value = 0.5;
      const faceMesh = mk(fg, faceM, J.head);
      // ears
      mk(new T.BoxGeometry(0.02, 0.05, 0.035), skinM, J.head, [HR * 0.84, HR * 1.0, 0]);
      mk(new T.BoxGeometry(0.02, 0.05, 0.035), skinM, J.head, [-HR * 0.84, HR * 1.0, 0]);
      // hair
      const hairG = new T.Group(); J.head.add(hairG);
      const cap = new T.SphereGeometry(HR * 1.07, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.56); cap.rotateX(-0.5); cap.scale(0.93, 1.08, 1.03); cap.translate(0, HR * 1.1, -0.012);
      mk(cap, hairM, hairG);
      const back = (len, wid) => mk(taper(HR * 1.75 * wid, HR * 0.6, HR * 1.6 * wid, HR * 0.4, len), hairM, hairG, [0, HR * 1.6, -HR * 0.62]);
      if (o.style === "short") { mk(new T.BoxGeometry(HR * 1.4, HR * 0.2, HR * 0.3), hairM, hairG, [0.01, HR * 1.72, HR * 0.7]).rotation.x = -0.5; }
      if (o.style === "fringe") { const fr = mk(new T.BoxGeometry(HR * 1.5, HR * 0.24, HR * 0.3), hairM, hairG, [HR * 0.08, HR * 1.62, HR * 0.8]); fr.rotation.set(-0.3, 0, 0.18); back(HR * 0.9, 1); }
      if (o.style === "long") { mk(new T.BoxGeometry(HR * 1.5, HR * 0.2, HR * 0.3), hairM, hairG, [0, HR * 1.7, HR * 0.74]).rotation.x = -0.45; back(HR * 2.9, 1.08);
        mk(taper(HR * 0.4, HR * 0.5, HR * 0.4, HR * 0.4, HR * 1.9), hairM, hairG, [HR * 0.78, HR * 1.5, -HR * 0.05]); mk(taper(HR * 0.4, HR * 0.5, HR * 0.4, HR * 0.4, HR * 1.9), hairM, hairG, [-HR * 0.78, HR * 1.5, -HR * 0.05]); }
      if (o.style === "bun") { mk(new T.IcosahedronGeometry(HR * 0.48, 0), hairM, hairG, [0, HR * 2.05, -HR * 0.65]); }
      if (o.style === "bob") { mk(new T.BoxGeometry(HR * 1.5, HR * 0.2, HR * 0.3), hairM, hairG, [0, HR * 1.7, HR * 0.74]).rotation.x = -0.45; back(HR * 1.5, 1.12);
        mk(taper(HR * 0.42, HR * 0.6, HR * 0.42, HR * 0.5, HR * 1.25), hairM, hairG, [HR * 0.8, HR * 1.55, -HR * 0.05]); mk(taper(HR * 0.42, HR * 0.6, HR * 0.42, HR * 0.5, HR * 1.25), hairM, hairG, [-HR * 0.8, HR * 1.55, -HR * 0.05]); }
      if (o.style === "bald") hairG.visible = false;
      // arms
      const sleeveM = o.sleeves === "short" ? skinM : topM;
      for (const [side, sx] of [["L", 1], ["R", -1]]) {
        const sh = new T.Group(); J.spine.add(sh); sh.position.set(sx * (chestW / 2 + 0.02), 0.47 * S, 0);
        mk(taper(0.1, 0.1, 0.085, 0.085, 0.29 * S), topM, sh);
        const el = new T.Group(); sh.add(el); el.position.y = -0.29 * S;
        mk(taper(0.085, 0.085, 0.07, 0.07, 0.26 * S), sleeveM, el);
        const hand = mk(new T.BoxGeometry(0.075, 0.1, 0.04).translate(0, -0.05, 0), skinM, el, [0, -0.26 * S, 0]);
        J["sh" + side] = sh; J["el" + side] = el; J["hand" + side] = hand;
        if (o.sleeves === "short") mk(taper(0.11, 0.11, 0.1, 0.1, 0.12 * S), topM, el, [0, 0.12 * S, 0]);
      }
      // legs
      for (const [side, sx] of [["L", 1], ["R", -1]]) {
        const hp = new T.Group(); hips.add(hp); hp.position.set(sx * 0.09, 0, 0);
        mk(taper(0.15, 0.16, 0.11, 0.12, 0.46 * S), o.skirt ? skinM : botM, hp);
        const kn = new T.Group(); hp.add(kn); kn.position.y = -0.46 * S;
        mk(taper(0.11, 0.12, 0.085, 0.09, 0.43 * S), o.skirt ? skinM : botM, kn);
        const an = new T.Group(); kn.add(an); an.position.y = -0.43 * S;
        mk(new T.BoxGeometry(0.1, 0.07, 0.24).translate(0, -0.035, 0.05), shoeM, an);
        J["hip" + side] = hp; J["kn" + side] = kn; J["an" + side] = an;
      }
      if (o.skirt) mk(taper(0.36, 0.24, 0.52, 0.38, 0.42 * S), mat({ color: o.skirt, map: tex.fabric("#ffffff", 0.12) }), hips, [0, 0.08, 0]);
      if (o.jacket) { // an open jacket: two front panels over the torso
        const jm = mat({ color: o.jacket, map: tex.fabric("#ffffff", 0.16) });
        mk(taper(0.17, 0.05, 0.2, 0.05, 0.5 * S, true), jm, J.spine, [0.1, 0.01, 0.1]);
        mk(taper(0.17, 0.05, 0.2, 0.05, 0.5 * S, true), jm, J.spine, [-0.1, 0.01, 0.1]);
        mk(taper(0.42, 0.05, chestW + 0.02, 0.05, 0.5 * S, true), jm, J.spine, [0, 0.01, -0.11]);
      }
      J.root = root; J.hips = hips;
      const shadow = blob(0.38, { parent: root, y: 0.012 });
      scene.add(root);
      const rig = {
        root, J, face: faceMesh, faceM, head: headMesh, hairG, shadow, o, mats: { skinM, topM, botM, shoeM, hairM },
        expr: "neutral",
        setExpr(e) { if (e !== rig.expr) { rig.expr = e; faceM.uniforms.map.value = faceTex(o, e); } },
        // world position of a joint (+ local offset)
        at(name, off) { root.updateMatrixWorld(true); const v = new T.Vector3(...(off || [0, 0, 0])); return (J[name] || root).localToWorld(v); },
        headPos() { return rig.at("head", [0, 0.13 * S, 0.02]); },
        set(s) {
          s = s || {};
          root.visible = s.visible !== false;
          if (!root.visible) return;
          root.position.set(...(s.pos || [0, 0, 0]));
          root.rotation.set(0, s.ry || 0, 0);
          for (const k of JOINTS) if (J[k] && k !== "root") J[k].rotation.set(0, 0, 0);
          hips.position.y = 0.95 * S; hips.rotation.set(0, 0, 0);
          const apply = (pose, w) => {
            if (!pose) return;
            for (const k in pose) {
              if (k === "hipsY") { hips.position.y += pose[k] * w * S; continue; }
              const j = k === "root" ? hips : J[k]; if (!j) continue;
              const v = pose[k]; j.rotation.x += v[0] * w; j.rotation.y += v[1] * w; j.rotation.z += v[2] * w;
            }
          };
          const p1 = typeof s.pose === "string" ? POSES[s.pose] : s.pose;
          const p2 = typeof s.pose2 === "string" ? POSES[s.pose2] : s.pose2;
          const k = s.k == null ? 0 : s.k;
          apply(p1 || POSES.relaxed, 1 - k); if (p2) apply(p2, k);
          if (s.walk) { // walk cycle: phase in radians, amt 0..1
            const ph = s.walk.phase, a = s.walk.amt == null ? 1 : s.walk.amt, run = s.walk.run ? 1.6 : 1;
            J.hipL.rotation.x += Math.sin(ph) * 0.45 * a * run; J.hipR.rotation.x += -Math.sin(ph) * 0.45 * a * run;
            J.knL.rotation.x += Math.max(0, -Math.cos(ph)) * 0.75 * a * run; J.knR.rotation.x += Math.max(0, Math.cos(ph)) * 0.75 * a * run;
            J.shL.rotation.x += -Math.sin(ph) * 0.35 * a; J.shR.rotation.x += Math.sin(ph) * 0.35 * a;
            J.elL.rotation.x += -0.25 * a; J.elR.rotation.x += -0.25 * a;
            hips.position.y += Math.abs(Math.cos(ph)) * 0.025 * a * S;
          }
          if (s.add) for (const kk in s.add) { const j = kk === "root" ? hips : J[kk]; if (j) { j.rotation.x += s.add[kk][0]; j.rotation.y += s.add[kk][1]; j.rotation.z += s.add[kk][2]; } }
          if (s.look) { J.neck.rotation.y += s.look[0] * 0.4; J.head.rotation.y += s.look[0] * 0.6; J.head.rotation.x += (s.look[1] || 0); }
          if (s.breathe != null) { J.spine.rotation.x += Math.sin(s.breathe * 1.6) * 0.012; J.shL.rotation.z += Math.sin(s.breathe * 1.6) * 0.01; J.shR.rotation.z -= Math.sin(s.breathe * 1.6) * 0.01; }
          let e = s.expr || "neutral";
          if (s.blink != null && (s.blink % 3.7) < 0.12 && (e === "neutral" || e === "smile" || e === "blank")) e = "closed";
          if (s.talk != null) e = (Math.floor(s.talk * 9) % 3 === 0) ? "talk" : (s.expr || "neutral");
          rig.setExpr(e);
          if (s.shadow != null) shadow.visible = !!s.shadow;
          root.updateMatrixWorld(true);
        },
      };
      return rig;
    }

    // ---------- post pipeline ----------
    const quadGeo = new T.PlaneGeometry(2, 2);
    const brightM = new T.ShaderMaterial({ uniforms: { tSrc: { value: rtLow.texture }, uThr: { value: 0.62 } }, vertexShader: POST_V, fragmentShader: BRIGHT_F, depthTest: false, depthWrite: false });
    const blurM = new T.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new T.Vector2() } }, vertexShader: POST_V, fragmentShader: BLUR_F, depthTest: false, depthWrite: false });
    const finalM = new T.ShaderMaterial({
      uniforms: {
        tLow: { value: rtLow.texture }, tBloom: { value: rtB1.texture }, uLow: { value: new T.Vector2(LW, LH) }, uOut: { value: new T.Vector2(W, H) },
        uTime: { value: 0 }, uBloom: { value: 0.5 }, uDither: { value: 1 }, uExpo: { value: 1 }, uSat: { value: 1 }, uTint: { value: new T.Vector3(1, 1, 1) },
        uRew: { value: 0 }, uNoise: { value: 0 }, uTrack: { value: 1 }, uFade: { value: 0 }, uFlash: { value: 0 }, uVig: { value: 0.35 }, uChroma: { value: 0.35 },
        uLift: { value: 0.0 }, uHaze: { value: 0.6 },
      }, vertexShader: POST_V, fragmentShader: FINAL_F, depthTest: false, depthWrite: false,
    });
    const postScene = new T.Scene(); const postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new T.Mesh(quadGeo, finalM); quad.frustumCulled = false; postScene.add(quad);
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(postScene, postCam); }

    function render(st) {
      st = st || {};
      const c = st.cam || [0, 1.6, 5], l = st.look || [0, 1.4, 0];
      camera.position.set(c[0], c[1], c[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(l[0], l[1], l[2]);
      if (st.roll) camera.rotateZ(st.roll);
      camera.fov = st.fov || 50; camera.near = st.near || 0.08; camera.far = st.far || 900; camera.updateProjectionMatrix();
      const sun = st.sun || {};
      if (sun.dir) U.uSunDir.value.set(...sun.dir).normalize();
      U.uSunCol.value.set(sun.col == null ? "#e8dccb" : sun.col);
      if (sun.k != null) U.uSunCol.value.multiplyScalar(sun.k);
      const amb = st.amb || {};
      U.uSky.value.set(amb.sky || "#6c7380"); U.uGnd.value.set(amb.gnd || "#3a3632");
      if (amb.k != null) { U.uSky.value.multiplyScalar(amb.k); U.uGnd.value.multiplyScalar(amb.k); }
      const pts = st.pts || [];
      for (let i = 0; i < 4; i++) {
        const p = pts[i];
        if (p) { U.uPLp.value[i].set(...p.p); U.uPLc.value[i].set(p.c); U.uPLc.value[i].multiplyScalar(p.k == null ? 1 : p.k); U.uPLr.value[i] = p.r || 6; }
        else { U.uPLp.value[i].set(0, -9999, 0); U.uPLc.value[i].setRGB(0, 0, 0); U.uPLr.value[i] = 1; }
      }
      const fog = st.fog || {};
      U.uFogCol.value.set(fog.col || "#9aa3ad"); U.uFogNear.value = fog.near == null ? 30 : fog.near; U.uFogFar.value = fog.far == null ? 160 : fog.far;
      U.uSnap.value = st.snap == null ? 1 : st.snap;
      scene.background.set(st.bg || fog.col || "#000000");
      // 1) low-res scene
      renderer.setRenderTarget(rtLow); renderer.setClearColor(scene.background, 1); renderer.clear(); renderer.render(scene, camera);
      // 2) bloom
      brightM.uniforms.uThr.value = st.bloomThr == null ? 0.62 : st.bloomThr;
      pass(brightM, rtB1);
      blurM.uniforms.tSrc.value = rtB1.texture; blurM.uniforms.uDir.value.set(1.5 / BW, 0); pass(blurM, rtB2);
      blurM.uniforms.tSrc.value = rtB2.texture; blurM.uniforms.uDir.value.set(0, 1.5 / BH); pass(blurM, rtB1);
      // 3) final upscale + 15-bit dither + VHS
      const F = finalM.uniforms;
      F.uTime.value = st.t || 0; F.uBloom.value = st.bloom == null ? 0.55 : st.bloom; F.uDither.value = st.dither == null ? 1 : st.dither;
      F.uExpo.value = st.expo == null ? 1 : st.expo; F.uSat.value = st.sat == null ? 0.95 : st.sat;
      const ti = st.tint || [1, 1, 1]; F.uTint.value.set(ti[0], ti[1], ti[2]);
      F.uRew.value = st.rew || 0; F.uNoise.value = st.noise || 0; F.uTrack.value = st.track == null ? 1 : st.track;
      F.uFade.value = st.fade || 0; F.uFlash.value = st.flash || 0; F.uVig.value = st.vig == null ? 0.35 : st.vig;
      F.uChroma.value = st.chroma == null ? 0.35 : st.chroma; F.uLift.value = st.lift || 0; F.uHaze.value = st.haze == null ? 0.6 : st.haze;
      quad.material = finalM; renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    }

    return {
      T, renderer, scene, camera, U, mat, setColor, setEmis, tex, canvasTex, signTex, faceTex, box, plane, cyl, ico, taper, place, blob, sky,
      human, POSES, render, mulberry, clamp, lerp, smooth, hexRGB, LW, LH, W, H,
      ready: Promise.resolve(),
    };
  }

  window.PS1 = { create };
})();
