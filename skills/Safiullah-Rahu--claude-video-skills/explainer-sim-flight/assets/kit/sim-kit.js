/* Sim kit — a small game-engine-look PBR renderer for seek-safe HyperFrames flight shorts (three.js r170).
 *
 *   const K = SIM.create({ canvas, width: 1080, height: 1920, scale: 1 });
 *   K.env("desert", { sun, sky, fog, grade, terrain, veg: [...], build(g, K) });   // registered, built lazily on first use
 *   K.height("desert", x, z)                    // terrain height (for placing craft and cameras)
 *   K.render({ env, cam, look, fov, roll, near, far, hero, prev: { cam, look, fov, roll, hero: Matrix4 }, inset, blur })
 *
 * Look: one shadowed sun + sky hemisphere + PMREM sky reflections on MeshStandard/Physical materials; heightfield
 * terrain with procedural canvas albedo / normal / roughness layers blended by slope, height and macro noise;
 * instanced trees, scrub and grass; an analytic sky whose horizon equals the aerial-perspective haze (height fog with a
 * sun-tinted in-scatter term) so terrain melts into sky; then post: camera + object velocity motion blur rebuilt from
 * depth (the hero aircraft is masked in alpha and blurred with its own rigid motion), bloom, ACES, grade, vignette,
 * grain, a touch of chromatic aberration, and an optional picture-in-picture inset rendered from a second camera.
 * Every call is a function of the state passed in, so any frame renders alone (seek-safe).
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

  // ---------------------------------------------------------------- deterministic 2D gradient noise
  function makeNoise(seed) {
    const r = rng(seed), p = new Uint8Array(512), gx = new Float32Array(256), gy = new Float32Array(256);
    const perm = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    for (let i = 0; i < 256; i++) { const a = r() * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
    const f = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    function n2(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const X = xi & 255, Y = yi & 255;
      const g = (ix, iy, dx, dy) => { const h = p[p[ix] + iy]; return gx[h] * dx + gy[h] * dy; };
      const u = f(xf), v = f(yf);
      const a = g(X, Y, xf, yf), b = g(X + 1, Y, xf - 1, yf), c = g(X, Y + 1, xf, yf - 1), d = g(X + 1, Y + 1, xf - 1, yf - 1);
      return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 1.41;
    }
    function fbm(x, y, oct, lac, gain) {
      oct = oct || 5; lac = lac || 2.0; gain = gain || 0.5;
      let s = 0, a = 1, n = 0;
      for (let i = 0; i < oct; i++) { s += a * n2(x, y); n += a; x = x * lac + 17.3; y = y * lac - 9.1; a *= gain; }
      return s / n;
    }
    function ridge(x, y, oct) {
      oct = oct || 5;
      let s = 0, a = 1, n = 0, w = 1;
      for (let i = 0; i < oct; i++) { let v = 1 - Math.abs(n2(x, y)); v *= v; v *= w; w = clamp(v * 1.6, 0, 1); s += a * v; n += a; x = x * 2.03 + 5.1; y = y * 2.03 - 3.7; a *= 0.5; }
      return s / n;
    }
    return { n2, fbm, ridge };
  }
  const NZ = makeNoise(1337);

  // ---------------------------------------------------------------- procedural canvas textures (tileable, seeded)
  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h || w; return c; }
  // tileable noise field on a w x w grid: periodic gradient noise via wrapping lattice
  function tileNoise(w, cells, seed, oct) {
    const nz = makeNoise(seed), out = new Float32Array(w * w);
    oct = oct || 5;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      let s = 0, a = 1, n = 0, c = cells;
      for (let o = 0; o < oct; o++) {
        // periodic: blend 4 shifted samples (classic tileable trick)
        const u = (x / w) * c, v = (y / w) * c;
        const fu = x / w, fv = y / w;
        const s00 = nz.n2(u, v), s10 = nz.n2(u - c, v), s01 = nz.n2(u, v - c), s11 = nz.n2(u - c, v - c);
        s += a * ((s00 * (1 - fu) + s10 * fu) * (1 - fv) + (s01 * (1 - fu) + s11 * fu) * fv);
        n += a; a *= 0.5; c *= 2;
      }
      out[y * w + x] = s / n;
    }
    return out;
  }
  function hexRGB(h) { const c = new T.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; } // sRGB-space bytes (Color stores sRGB when management off? see below)
  function sRGBbytes(h) { const v = parseInt(h.replace("#", ""), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  // a terrain layer: albedo (sRGB), normal (tangent space, from the same height field), roughness — all tileable
  const layerCache = {};
  let layerLog = null; // keys created while an env builds (so the env can free them)
  function layer(spec) {
    const key = JSON.stringify(spec);
    if (layerCache[key]) return layerCache[key];
    if (layerLog) layerLog.push(key);
    const w = spec.size || 512, seed = spec.seed || 3;
    const hN = tileNoise(w, spec.cells || 8, seed, spec.oct || 5);
    const hD = spec.detail ? tileNoise(w, spec.detail, seed + 11, 3) : null;
    const r = rng(seed + 5);
    const cols = spec.cols.map(sRGBbytes);
    const alb = canvas(w), nrm = canvas(w), rgh = canvas(w);
    const ga = alb.getContext("2d"), gn = nrm.getContext("2d"), gr = rgh.getContext("2d");
    const ia = ga.createImageData(w, w), inn = gn.createImageData(w, w), ir = gr.createImageData(w, w);
    const H = new Float32Array(w * w);
    for (let i = 0; i < w * w; i++) {
      let h = hN[i] * 0.5 + 0.5;
      if (hD) h = h * 0.75 + (hD[i] * 0.5 + 0.5) * 0.25;
      if (spec.ridged) h = 1 - Math.abs(hN[i]) * 1.4;
      H[i] = h;
    }
    // speckles (pebbles / scrub dots / leaf clumps)
    const spots = [];
    for (let k = 0; k < (spec.spots || 0); k++) spots.push([r() * w, r() * w, (spec.spotR || 3) * (0.5 + r()), r()]);
    for (const [sx, sy, sr, sv] of spots) {
      const x0 = Math.floor(sx - sr * 2), x1 = Math.ceil(sx + sr * 2), y0 = Math.floor(sy - sr * 2), y1 = Math.ceil(sy + sr * 2);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - sx, y - sy) / sr;
        if (d > 2) continue;
        const i = ((y + w) % w) * w + ((x + w) % w);
        H[i] += (spec.spotH || 0.25) * Math.exp(-d * d * 1.5) * (sv > 0.5 ? 1 : -0.6);
      }
    }
    let mn = 1e9, mx = -1e9;
    for (let i = 0; i < w * w; i++) { mn = Math.min(mn, H[i]); mx = Math.max(mx, H[i]); }
    const ramp = (u) => { // palette ramp over cols
      u = clamp(u, 0, 0.9999) * (cols.length - 1);
      const i = Math.floor(u), f = u - i, a = cols[i], b = cols[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    };
    const ns = spec.normal || 2.0;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, h = (H[i] - mn) / (mx - mn + 1e-6);
      let c = ramp(Math.pow(h, spec.gamma || 1));
      const j = (r() - 0.5) * (spec.jitter || 10);
      ia.data[i * 4] = clamp(c[0] + j, 0, 255); ia.data[i * 4 + 1] = clamp(c[1] + j, 0, 255); ia.data[i * 4 + 2] = clamp(c[2] + j, 0, 255); ia.data[i * 4 + 3] = 255;
      const hl = H[y * w + (x + w - 1) % w], hr = H[y * w + (x + 1) % w], hu = H[((y + w - 1) % w) * w + x], hd = H[((y + 1) % w) * w + x];
      let nx = (hl - hr) * ns * w / 64, ny = (hu - hd) * ns * w / 64, nz = 1;
      const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
      inn.data[i * 4] = (nx * 0.5 + 0.5) * 255; inn.data[i * 4 + 1] = (ny * 0.5 + 0.5) * 255; inn.data[i * 4 + 2] = (nz * 0.5 + 0.5) * 255; inn.data[i * 4 + 3] = 255;
      const rv = clamp((spec.rough || 0.9) + (0.5 - h) * (spec.roughVar || 0.12), 0.02, 1) * 255;
      ir.data[i * 4] = rv; ir.data[i * 4 + 1] = rv; ir.data[i * 4 + 2] = rv; ir.data[i * 4 + 3] = 255;
    }
    ga.putImageData(ia, 0, 0); gn.putImageData(inn, 0, 0); gr.putImageData(ir, 0, 0);
    const mk = (cv, srgb) => {
      const t = new T.CanvasTexture(cv);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
      t.anisotropy = 8;
      t.generateMipmaps = true; t.minFilter = T.LinearMipmapLinearFilter; t.magFilter = T.LinearFilter;
      return t;
    };
    const out = { map: mk(alb, true), normal: mk(nrm, false), rough: mk(rgh, false), heights: H, w };
    out.map.userData.layer = out.normal.userData.layer = out.rough.userData.layer = true;
    layerCache[key] = out;
    return out;
  }

  // ---------------------------------------------------------------- shared atmosphere uniforms + GLSL
  const ATM = {
    uSunDir: { value: new T.Vector3(0, 0.5, 0.8).normalize() },
    uHaze: { value: new T.Color(0.6, 0.65, 0.75) },
    uSunHaze: { value: new T.Color(1.0, 0.85, 0.6) },
    uZenith: { value: new T.Color(0.2, 0.35, 0.65) },
    uSunCol: { value: new T.Color(1, 0.95, 0.85) },
    uFogD: { value: 0.00012 }, uFogFall: { value: 0.0012 }, uFogBase: { value: 0 }, uFogMax: { value: 0.97 },
    uMistD: { value: 0.0 }, uMistFall: { value: 0.05 }, uMistBase: { value: 0 },
    uHazeI: { value: 1.0 }, uSunGlow: { value: 0.8 }, uCirrus: { value: 0.0 }, uSkyBright: { value: 1.0 },
    uHorizonLift: { value: 0.0 }, uSkyBand: { value: 0.42 },
  };
  const ATM_GLSL = `
    uniform vec3 uSunDir, uHaze, uSunHaze, uZenith, uSunCol;
    uniform float uFogD, uFogFall, uFogBase, uFogMax, uMistD, uMistFall, uMistBase, uHazeI, uSunGlow, uCirrus, uSkyBright, uHorizonLift, uSkyBand;
    vec3 hazeColor(vec3 rd) {
      float s = max(dot(rd, uSunDir), 0.0);
      vec3 c = mix(uHaze, uSunHaze, clamp(pow(s, 5.0) * uSunGlow + pow(s, 48.0) * 0.6, 0.0, 1.0));
      return c * uHazeI;
    }
    float layerFog(vec3 ro, vec3 rd, float L, float a, float b, float base) {
      float k = b * rd.y;
      float dens = a * exp(-b * (ro.y - base));
      float I = abs(k * L) < 1e-4 ? dens * L : dens * (1.0 - exp(-k * L)) / k;
      return I;
    }
    float fogAmount(vec3 ro, vec3 p) {
      vec3 d = p - ro; float L = length(d); vec3 rd = d / max(L, 1e-3);
      float I = layerFog(ro, rd, L, uFogD, uFogFall, uFogBase);
      if (uMistD > 0.0) I += layerFog(ro, rd, L, uMistD, uMistFall, uMistBase);
      return min(1.0 - exp(-I), uFogMax);
    }`;
  // patch any MeshStandard/Physical/Basic material: aerial perspective fog + optional hero mask (alpha 0)
  function patch(m, opt) {
    opt = opt || {};
    m.fog = false;
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      Object.assign(sh.uniforms, ATM);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vAtmW;")
        .replace("#include <fog_vertex>", `#include <fog_vertex>
          vec4 atmW = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            atmW = instanceMatrix * atmW;
          #endif
          atmW = modelMatrix * atmW; vAtmW = atmW.xyz;`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vAtmW;\n" + ATM_GLSL)
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>
          {
            vec3 rd = normalize(vAtmW - cameraPosition);
            float fa = fogAmount(cameraPosition, vAtmW) * ${(opt.fogScale || 1).toFixed(3)};
            gl_FragColor.rgb = mix(gl_FragColor.rgb, hazeColor(rd), fa);
          }
          ${opt.hero ? "gl_FragColor.a = 0.0;" : opt.keepAlpha ? "" : "gl_FragColor.a = 1.0;"}`);
      if (opt.frag) sh.fragmentShader = opt.frag(sh.fragmentShader);
      if (opt.vert) sh.vertexShader = opt.vert(sh.vertexShader);
      if (opt.uniforms) Object.assign(sh.uniforms, opt.uniforms);
    };
    const k0 = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => "";
    m.customProgramCacheKey = () => k0() + "|atm" + (opt.hero ? "H" : "") + (opt.key || "");
    return m;
  }
  // blending that keeps the destination alpha (the hero mask) intact
  function keepAlphaBlend(m, additive) {
    m.transparent = true;
    m.blending = T.CustomBlending;
    m.blendEquation = T.AddEquation;
    m.blendSrc = T.SrcAlphaFactor;
    m.blendDst = additive ? T.OneFactor : T.OneMinusSrcAlphaFactor;
    m.blendSrcAlpha = T.ZeroFactor;
    m.blendDstAlpha = T.OneFactor;
    m.depthWrite = false;
    return m;
  }

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const S = o.scale || (window.SIM_SCALE || 1);
    const RW = Math.round(W * S), RH = Math.round(H * S);
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(50, W / H, 0.5, 60000);
    const icam = new T.PerspectiveCamera(50, 16 / 9, 0.5, 60000);
    const sun = new T.DirectionalLight(0xffffff, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(o.shadowSize || 2048, o.shadowSize || 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 2;
    scene.add(sun, sun.target);
    const hemi = new T.HemisphereLight(0xbfd4ff, 0x6b5a45, 0.6);
    scene.add(hemi);
    const actors = new T.Group(); actors.name = "actors"; scene.add(actors);

    // ---- sky dome (analytic): zenith gradient, haze horizon (== fog colour at infinity), sun disc + glow, cirrus
    const skyMat = new T.ShaderMaterial({
      uniforms: Object.assign({ tCirrus: { value: null } }, ATM),
      vertexShader: "varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }",
      fragmentShader: ATM_GLSL + `
        uniform sampler2D tCirrus; varying vec3 vDir;
        void main(){
          vec3 rd = normalize(vDir);
          float y = max(rd.y + uHorizonLift, 0.0);
          vec3 hz = hazeColor(rd);
          vec3 c = mix(hz, uZenith * uSkyBright, pow(smoothstep(0.0, uSkyBand, y), 0.75));
          float s = max(dot(rd, uSunDir), 0.0);
          c += uSunCol * (pow(s, 900.0) * 30.0 + pow(s, 120.0) * 0.6);
          if (uCirrus > 0.0 && rd.y > 0.0) {
            vec2 uv = rd.xz / (rd.y + 0.12) * 0.18;
            float cl = texture2D(tCirrus, uv).r * texture2D(tCirrus, uv * 0.37 + 0.3).r;
            cl = smoothstep(0.18, 0.55, cl) * uCirrus * smoothstep(0.0, 0.25, rd.y);
            c = mix(c, hz * 1.25 + uSunCol * pow(s, 6.0) * 0.4, cl);
          }
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: T.BackSide, depthWrite: false, depthTest: false,
    });
    {
      const L = layer({ cols: ["#000000", "#ffffff"], cells: 3, seed: 91, oct: 6, size: 512 });
      skyMat.uniforms.tCirrus.value = L.map;
      L.map.colorSpace = T.NoColorSpace;
    }
    const sky = new T.Mesh(new T.SphereGeometry(50000, 32, 16), skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10;
    scene.add(sky);

    // ---------------------------------------------------------------- environments
    const envs = {};
    function env(name, spec) { envs[name] = { spec, built: null }; }
    function hfun(spec) { return spec.terrain && spec.terrain.h ? spec.terrain.h : () => 0; }
    function height(name, x, z) { return hfun(envs[name].spec)(x, z, NZ); }

    function terrainMesh(spec, group) {
      const tr = spec.terrain;
      const N = tr.res || 384, half = tr.half || 9000, p = tr.pow || 2.2, cx = tr.center ? tr.center[0] : 0, cz = tr.center ? tr.center[1] : 0;
      const hf = hfun(spec);
      const pos = new Float32Array((N + 1) * (N + 1) * 3), nor = new Float32Array((N + 1) * (N + 1) * 3), uv = new Float32Array((N + 1) * (N + 1) * 2);
      const map = (u) => Math.sign(u) * Math.pow(Math.abs(u), p) * half;
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
        const x = cx + map(i / N * 2 - 1), z = cz + map(j / N * 2 - 1), k = j * (N + 1) + i;
        const y = hf(x, z, NZ);
        pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
        const e = Math.max(1.5, Math.abs(map((i + 1) / N * 2 - 1) - map(i / N * 2 - 1)) * 0.5);
        const dx = hf(x + e, z, NZ) - hf(x - e, z, NZ), dz = hf(x, z + e, NZ) - hf(x, z - e, NZ);
        const nx = -dx / (2 * e), nz = -dz / (2 * e), L = Math.hypot(nx, 1, nz);
        nor[k * 3] = nx / L; nor[k * 3 + 1] = 1 / L; nor[k * 3 + 2] = nz / L;
        uv[k * 2] = x; uv[k * 2 + 1] = z;
      }
      const idx = new Uint32Array(N * N * 6);
      let q = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3));
      g.setAttribute("normal", new T.BufferAttribute(nor, 3));
      g.setAttribute("uv", new T.BufferAttribute(uv, 2));
      g.setIndex(new T.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      // layers: A base, B steep (rock), C patches, D snow/top
      const Ls = tr.layers.map((l) => layer(l.tex));
      const u = {
        tA: { value: Ls[0].map }, nA: { value: Ls[0].normal }, rA: { value: Ls[0].rough },
        tB: { value: (Ls[1] || Ls[0]).map }, nB: { value: (Ls[1] || Ls[0]).normal }, rB: { value: (Ls[1] || Ls[0]).rough },
        tC: { value: (Ls[2] || Ls[0]).map }, nC: { value: (Ls[2] || Ls[0]).normal }, rC: { value: (Ls[2] || Ls[0]).rough },
        tD: { value: (Ls[3] || Ls[0]).map }, nD: { value: (Ls[3] || Ls[0]).normal }, rD: { value: (Ls[3] || Ls[0]).rough },
        tM: { value: layer({ cols: ["#000000", "#ffffff"], cells: 4, seed: (tr.seed || 1) + 40, oct: 6, size: 256 }).map },
        sc: { value: new T.Vector4(...tr.layers.map((l) => l.scale || 20), ...Array(4 - tr.layers.length).fill(20)) },
        nk: { value: tr.normalK || 0.6 },
        macroS: { value: tr.macroScale || 900 }, macroK: { value: tr.macroK != null ? tr.macroK : 0.35 },
        rock: { value: new T.Vector2(...(tr.rock || [0.25, 0.45])) },
        pTh: { value: new T.Vector3(...(tr.patch || [0.55, 0.7, 1.0])) }, // threshold lo, hi, amount of layer C by macro noise
        snow: { value: new T.Vector4(...(tr.snow || [1e9, 1e9 + 1, 0.5, 0.0])) }, // h0, h1, max slope, noise
        tint: { value: new T.Color(tr.tint || "#ffffff") },
      };
      u.tM.value.colorSpace = T.NoColorSpace;
      const m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
      patch(m, {
        key: "terrain",
        uniforms: u,
        vert: (s) => s.replace("#include <common>", "#include <common>\nvarying vec3 vTW; varying vec3 vTN;")
          .replace("#include <fog_vertex>", "#include <fog_vertex>\nvTW = (modelMatrix * vec4(transformed,1.0)).xyz; vTN = normalize(mat3(modelMatrix) * objectNormal);"),
        frag: (s) => s.replace("#include <common>", `#include <common>
            varying vec3 vTW; varying vec3 vTN;
            uniform sampler2D tA, nA, rA, tB, nB, rB, tC, nC, rC, tD, nD, rD, tM;
            uniform vec4 sc, snow; uniform float nk, macroS, macroK; uniform vec2 rock; uniform vec3 pTh; uniform vec3 tint;
            vec4 trip(sampler2D t, vec3 p, vec3 n, float s) {
              vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
              return texture2D(t, p.zy / s) * w.x + texture2D(t, p.xz / s) * w.y + texture2D(t, p.xy / s) * w.z;
            }
            float tW_rock, tW_c, tW_snow, tMac;`)
          .replace("#include <map_fragment>", `
            vec3 tn = normalize(vTN);
            float slope = 1.0 - tn.y;
            tMac = texture2D(tM, vTW.xz / macroS).r * 0.65 + texture2D(tM, vTW.xz / (macroS * 0.23) + 0.37).r * 0.35;
            tW_rock = smoothstep(rock.x, rock.y, slope + (tMac - 0.5) * 0.18);
            tW_c = smoothstep(pTh.x, pTh.y, tMac) * pTh.z;
            tW_snow = smoothstep(snow.x, snow.y, vTW.y + (tMac - 0.5) * snow.w) * (1.0 - smoothstep(snow.z, snow.z + 0.15, slope));
            vec3 cA = texture2D(tA, vTW.xz / sc.x).rgb;
            vec3 cC = texture2D(tC, vTW.xz / sc.z).rgb;
            vec3 cB = trip(tB, vTW, tn, sc.y).rgb;
            vec3 cD = texture2D(tD, vTW.xz / sc.w).rgb;
            vec3 col = mix(cA, cC, tW_c);
            col = mix(col, cB, tW_rock);
            col = mix(col, cD, tW_snow);
            col *= mix(1.0 - macroK, 1.0 + macroK * 0.6, tMac) * tint;
            diffuseColor.rgb *= col;`)
          .replace("#include <roughnessmap_fragment>", `
            float roughnessFactor = roughness;
            {
              float rA_ = texture2D(rA, vTW.xz / sc.x).g, rB_ = texture2D(rB, vTW.xz / sc.y).g, rC_ = texture2D(rC, vTW.xz / sc.z).g, rD_ = texture2D(rD, vTW.xz / sc.w).g;
              float rr = mix(mix(rA_, rC_, tW_c), rB_, tW_rock); rr = mix(rr, rD_, tW_snow);
              roughnessFactor *= rr;
            }`)
          .replace("#include <normal_fragment_maps>", `
            {
              vec3 tn2 = normalize(vTN);
              vec3 dA = texture2D(nA, vTW.xz / sc.x).xyz * 2.0 - 1.0;
              vec3 dC = texture2D(nC, vTW.xz / sc.z).xyz * 2.0 - 1.0;
              vec3 dB = trip(nB, vTW, tn2, sc.y).xyz * 2.0 - 1.0;
              vec3 dD = texture2D(nD, vTW.xz / sc.w).xyz * 2.0 - 1.0;
              vec3 d = mix(mix(dA, dC, tW_c), dB, tW_rock); d = mix(d, dD, tW_snow);
              vec3 tx = normalize(vec3(1.0, 0.0, 0.0) - tn2 * tn2.x), tz = normalize(cross(tx, tn2));
              vec3 nw = normalize(tn2 + (tx * d.x - tz * d.y) * nk);
              normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
            }`),
      });
      const mesh = new T.Mesh(g, m);
      mesh.receiveShadow = true;
      mesh.castShadow = tr.castShadow !== false;
      group.add(mesh);
      return mesh;
    }

    // ---- vegetation geometry (merged, vertex-coloured for fake AO)
    function mergeGeos(list) {
      let nv = 0, ni = 0;
      list.forEach((g) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
      let ov = 0, oi = 0;
      list.forEach((g) => {
        const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
        for (let i = 0; i < P.count; i++) {
          pos.set([P.getX(i), P.getY(i), P.getZ(i)], (ov + i) * 3);
          nor.set([N.getX(i), N.getY(i), N.getZ(i)], (ov + i) * 3);
          col.set(C ? [C.getX(i), C.getY(i), C.getZ(i)] : [1, 1, 1], (ov + i) * 3);
        }
        if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov;
        else for (let i = 0; i < P.count; i++) idx[oi + i] = i + ov;
        ov += P.count; oi += g.index ? g.index.count : P.count;
      });
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3));
      g.setAttribute("normal", new T.BufferAttribute(nor, 3));
      g.setAttribute("color", new T.BufferAttribute(col, 3));
      g.setIndex(new T.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      return g;
    }
    function shadeAO(g, y0, y1, lo, hi, tint) { // vertex colour by height (dark underneath) * tint
      const P = g.attributes.position, c = new Float32Array(P.count * 3), t = new T.Color(tint || "#ffffff");
      for (let i = 0; i < P.count; i++) { const k = lerp(lo, hi, smooth(y0, y1, P.getY(i))); c[i * 3] = k * t.r; c[i * 3 + 1] = k * t.g; c[i * 3 + 2] = k * t.b; }
      g.setAttribute("color", new T.BufferAttribute(c, 3));
      return g;
    }
    function lumpy(g, cx, cy, cz, r, amt, seed) { // displace a crown by a hash of position (crack-free), keep smooth normals, mottle the colour
      const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, nz = makeNoise(seed || 3);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        const n = nz.n2(x * 1.7 + z * 0.9, y * 1.9 - z * 1.3) * 0.6 + nz.n2(x * 4.1, z * 3.7 + y) * 0.4;
        const dx = x - cx, dy = y - cy, dz = z - cz, L = Math.hypot(dx, dy, dz) || 1;
        P.setXYZ(i, x + dx / L * n * amt * r, y + dy / L * n * amt * r, z + dz / L * n * amt * r);
        N.setXYZ(i, dx / L, dy / L, dz / L);
        if (C) { const k = 0.82 + 0.3 * (n * 0.5 + 0.5); C.setXYZ(i, C.getX(i) * k, C.getY(i) * k, C.getZ(i) * k); }
      }
      return g;
    }
    const vegGeo = {
      pine() { // tall bare trunk + layered crown (~18 m at scale 1)
        const parts = [shadeAO(new T.CylinderGeometry(0.16, 0.3, 11, 6).translate(0, 5.5, 0), 0, 11, 0.45, 0.8, "#7a4f36")];
        for (let k = 0; k < 7; k++) {
          const r = 2.1 - k * 0.24, h = 2.6 - k * 0.12, y = 7.0 + k * 1.45;
          const g = shadeAO(new T.ConeGeometry(r, h, 9, 2, true).translate(0, y + h / 2, 0), y, y + h, 0.22, 1.0);
          parts.push(lumpy(g, 0, y + h * 0.3, 0, r, 0.2, 20 + k));
        }
        return mergeGeos(parts);
      },
      pine2() { // Scots pine: tall bare trunk, irregular crown of flattened clumps at the top (~19 m)
        const r = rng(17), parts = [shadeAO(new T.CylinderGeometry(0.14, 0.32, 15, 6).translate(0, 7.5, 0), 0, 15, 0.45, 0.85, "#8a5a3c")];
        for (let k = 0; k < 6; k++) {
          const s = 1.5 + r() * 1.2, x = (r() - 0.5) * 3.6, z = (r() - 0.5) * 3.6, y = 13 + r() * 5;
          const g = shadeAO(new T.IcosahedronGeometry(s, 1).scale(1.25, 0.55, 1.25).translate(x, y, z), y - s * 0.5, y + s * 0.5, 0.25, 1.0);
          parts.push(lumpy(g, x, y, z, s, 0.3, 40 + k));
          // a short branch to the clump
          parts.push(shadeAO(new T.CylinderGeometry(0.05, 0.08, Math.hypot(x, z) + 0.4, 4).rotateZ(Math.PI / 2).rotateY(-Math.atan2(z, x)).translate(x / 2, y - 0.6, z / 2), 0, 20, 0.5, 0.5, "#6d4630"));
        }
        return mergeGeos(parts);
      },
      spruce() { // dense cone down to the ground (~14 m)
        const parts = [shadeAO(new T.CylinderGeometry(0.1, 0.22, 2, 5).translate(0, 1, 0), 0, 2, 0.35, 0.5, "#4a3426")];
        for (let k = 0; k < 9; k++) {
          const r = 2.6 - k * 0.27, h = 2.2 - k * 0.08, y = 0.8 + k * 1.35;
          const g = shadeAO(new T.ConeGeometry(r, h, 10, 2, true).translate(0, y + h / 2, 0), y, y + h, 0.2, 0.95);
          parts.push(lumpy(g, 0, y + h * 0.3, 0, r, 0.24, 60 + k));
        }
        return mergeGeos(parts);
      },
      broad() {
        const parts = [shadeAO(new T.CylinderGeometry(0.18, 0.3, 4, 5).translate(0, 2, 0), 0, 4, 0.3, 0.45, "#4b3a2c")];
        const r = rng(4);
        for (let k = 0; k < 6; k++) {
          const s = 2.0 + r() * 1.3, x = (r() - 0.5) * 3.6, z = (r() - 0.5) * 3.6, y = 5.0 + r() * 3.0;
          const g = shadeAO(new T.IcosahedronGeometry(s, 2).scale(1, 0.82, 1).translate(x, y, z), y - s, y + s * 0.8, 0.22, 1.0);
          parts.push(lumpy(g, x, y, z, s, 0.22, 10 + k));
        }
        return mergeGeos(parts); // ~10 m
      },
      scrub() {
        const r = rng(9), parts = [];
        for (let k = 0; k < 3; k++) {
          const s = 0.5 + r() * 0.5;
          parts.push(shadeAO(new T.IcosahedronGeometry(s, 0).scale(1, 0.6, 1).translate((r() - 0.5) * 0.9, s * 0.35, (r() - 0.5) * 0.9), 0, s, 0.45, 1.0));
        }
        return mergeGeos(parts);
      },
      grass() { // a tuft of 9 thin blades
        const r = rng(13), pos = [], col = [];
        for (let k = 0; k < 16; k++) {
          const a = r() * Math.PI * 2, rr = 0.05 + r() * 0.18, x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = 0.45 + r() * 0.75, lean = (r() - 0.5) * 0.5, w = 0.016 + r() * 0.012;
          const ox = Math.cos(a + 1.57) * w, oz = Math.sin(a + 1.57) * w, tone = 0.75 + r() * 0.5;
          pos.push(x - ox, 0, z - oz, x + ox, 0, z + oz, x + lean * Math.cos(a), h, z + lean * Math.sin(a));
          col.push(0.3 * tone, 0.3 * tone, 0.28 * tone, 0.3 * tone, 0.3 * tone, 0.28 * tone, tone, tone * 0.97, tone * 0.85);
        }
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
        g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
        g.computeVertexNormals();
        const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); // grass lit like ground
        return g;
      },
      rock() { return shadeAO(new T.IcosahedronGeometry(1, 0).scale(1.2, 0.7, 1), -0.7, 0.7, 0.5, 1.0); },
    };
    const vegCache = {};
    function veg(spec, group, hf) {
      const geo = vegCache[spec.type] || (vegCache[spec.type] = vegGeo[spec.type]());
      geo.userData.shared = true;
      const m = patch(new T.MeshStandardMaterial({ vertexColors: true, roughness: spec.rough || 0.92, metalness: 0, side: spec.type === "grass" ? T.DoubleSide : T.FrontSide }), { key: "veg" + spec.type });
      const r = rng(spec.seed || 21), n = spec.n;
      const mesh = new T.InstancedMesh(geo, m, n);
      const M = new T.Matrix4(), Q = new T.Quaternion(), Sx = new T.Vector3(), P = new T.Vector3(), C = new T.Color(), up = new T.Vector3(0, 1, 0);
      const cols = spec.cols.map((c) => new T.Color(c));
      const [x0, z0, x1, z1] = spec.area;
      let k = 0, tries = 0;
      while (k < n && tries < n * 30) {
        tries++;
        const x = lerp(x0, x1, r()), z = lerp(z0, z1, r());
        const d = spec.density ? spec.density(x, z, NZ) : 1;
        if (r() > d) continue;
        const y = hf(x, z, NZ);
        if (spec.minH != null && y < spec.minH) continue;
        if (spec.maxH != null && y > spec.maxH) continue;
        if (spec.maxSlope != null) {
          const e = 3, s = Math.hypot(hf(x + e, z, NZ) - hf(x - e, z, NZ), hf(x, z + e, NZ) - hf(x, z - e, NZ)) / (2 * e);
          if (s > spec.maxSlope) continue;
        }
        const s = lerp(spec.scale[0], spec.scale[1], Math.pow(r(), 1.5));
        Q.setFromAxisAngle(up, r() * Math.PI * 2);
        Sx.set(s * lerp(0.85, 1.15, r()), s, s * lerp(0.85, 1.15, r()));
        P.set(x, y - (spec.sink || 0.2) * s, z);
        M.compose(P, Q, Sx);
        mesh.setMatrixAt(k, M);
        C.copy(cols[Math.floor(r() * cols.length)]).multiplyScalar(lerp(0.8, 1.15, r()));
        mesh.setColorAt(k, C);
        k++;
      }
      mesh.count = k;
      mesh.castShadow = spec.shadow !== false;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      group.add(mesh);
      return mesh;
    }

    // ---- build an environment (lazy)
    const pmrem = new T.PMREMGenerator(renderer);
    function applyAtm(spec) {
      const s = spec.sky, f = spec.fog || {};
      const az = (spec.sun.az || 0) * D2R, el = (spec.sun.el || 30) * D2R;
      ATM.uSunDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
      ATM.uHaze.value.set(s.haze); ATM.uSunHaze.value.set(s.sunHaze || s.haze); ATM.uZenith.value.set(s.zenith);
      ATM.uSunCol.value.set(spec.sun.color || "#fff4e0").multiplyScalar(spec.sun.disc != null ? spec.sun.disc : 1);
      ATM.uHazeI.value = s.hazeI || 1; ATM.uSunGlow.value = s.glow != null ? s.glow : 0.8; ATM.uCirrus.value = s.cirrus || 0;
      ATM.uSkyBright.value = s.bright || 1; ATM.uHorizonLift.value = s.lift || 0; ATM.uSkyBand.value = s.band || 0.42;
      ATM.uFogD.value = f.d != null ? f.d : 0.00012; ATM.uFogFall.value = f.fall != null ? f.fall : 0.0012; ATM.uFogBase.value = f.base || 0;
      ATM.uFogMax.value = f.max != null ? f.max : 0.985;
      ATM.uMistD.value = f.mist || 0; ATM.uMistFall.value = f.mistFall || 0.05; ATM.uMistBase.value = f.mistBase || 0;
      sun.color.set(spec.sun.color || "#fff4e0"); sun.intensity = spec.sun.i != null ? spec.sun.i : 3.2;
      sun.position.copy(ATM.uSunDir.value).multiplyScalar(1000);
      hemi.color.set(spec.hemi ? spec.hemi.sky : "#bcd0f0"); hemi.groundColor.set(spec.hemi ? spec.hemi.ground : "#6a5a48"); hemi.intensity = spec.hemi ? spec.hemi.i : 0.7;
    }
    let useClock = 0;
    function dispose(name) { // free an env's GPU + canvas memory (keeps at most o.maxEnvs built: an iGPU runs out otherwise)
      const B = envs[name].built;
      if (!B) return;
      B.group.traverse((m) => {
        if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mm) => {
          ["map", "emissiveMap"].forEach((k) => { if (mm[k] && !mm[k].userData.layer) mm[k].dispose(); });
          mm.dispose();
        });
      });
      scene.remove(B.group);
      B.envMap.dispose();
      B.layers.forEach((k) => { const L = layerCache[k]; if (L) { L.map.dispose(); L.normal.dispose(); L.rough.dispose(); delete layerCache[k]; } });
      envs[name].built = null;
    }
    function build(name) {
      const E = envs[name];
      E.used = ++useClock;
      if (E.built) return E.built;
      const live = Object.keys(envs).filter((k) => envs[k].built).sort((a, b) => envs[a].used - envs[b].used);
      while (live.length >= (o.maxEnvs || 2)) dispose(live.shift());
      layerLog = [];
      const spec = E.spec, group = new T.Group();
      group.name = "env:" + name;
      if (spec.terrain) terrainMesh(spec, group);
      const hf = hfun(spec);
      (spec.veg || []).forEach((v) => veg(v, group, hf));
      if (spec.build) spec.build(group, K, hf);
      group.visible = false;
      scene.add(group);
      // reflections: the sky + a ground disc of the terrain's mean colour, prefiltered
      applyAtm(spec);
      const envScene = new T.Scene();
      const skyClone = new T.Mesh(sky.geometry, skyMat);
      envScene.add(skyClone);
      const gd = new T.Mesh(new T.CircleGeometry(40000, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: spec.groundRefl || "#6d6252" }));
      gd.position.y = -50;
      envScene.add(gd);
      const rt = pmrem.fromScene(envScene, 0.02, 1, 100000);
      gd.geometry.dispose(); gd.material.dispose();
      E.built = { group, envMap: rt.texture, layers: layerLog };
      layerLog = null;
      return E.built;
    }

    // ---------------------------------------------------------------- post-processing chain
    const HT = T.HalfFloatType;
    const rtMain = new T.WebGLRenderTarget(RW, RH, { type: HT, samples: o.msaa != null ? o.msaa : 4, depthTexture: new T.DepthTexture(RW, RH, o.depthType === "float" ? T.FloatType : T.UnsignedIntType) });
    const rtBlur = new T.WebGLRenderTarget(RW, RH, { type: HT });
    const BW = Math.round(RW / 4), BH = Math.round(RH / 4);
    const rtB1 = new T.WebGLRenderTarget(BW, BH, { type: HT }), rtB2 = new T.WebGLRenderTarget(BW, BH, { type: HT });
    const IW = Math.round(RW * 0.86), IH = Math.round(IW * 9 / 16);
    const rtInset = new T.WebGLRenderTarget(IW, IH, { type: HT, samples: 4 });
    const quadGeo = new T.PlaneGeometry(2, 2);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    function pass(frag, uniforms) {
      const m = new T.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: frag, depthTest: false, depthWrite: false });
      const q = new T.Mesh(quadGeo, m); q.frustumCulled = false;
      const sc = new T.Scene(); sc.add(q);
      return { m, run(target) { renderer.setRenderTarget(target); renderer.render(sc, qCam); } };
    }
    const blurPass = pass(`
      uniform sampler2D tC, tD; uniform mat4 invVP, prevVP, heroDelta; uniform float amt, maxLen, hTime; uniform vec2 res;
      uniform vec4 heat[2]; // xy = screen uv of a hot source, z = radius in uv (y-normalised), w = strength
      varying vec2 vUv;
      float hn(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hn(i), hn(i + vec2(1, 0)), f.x), mix(hn(i + vec2(0, 1)), hn(i + vec2(1, 1)), f.x), f.y); }
      vec2 shimmer(vec2 uv){
        vec2 o = vec2(0.0);
        for (int i = 0; i < 2; i++) {
          if (heat[i].w <= 0.0) continue;
          vec2 d = (uv - heat[i].xy) * vec2(res.x / res.y, 1.0);
          float f = exp(-dot(d, d) / (heat[i].z * heat[i].z));
          vec2 q = uv * vec2(90.0, 160.0) + vec2(0.0, hTime * 9.0);
          o += (vec2(vn(q), vn(q + 17.3)) - 0.5) * f * heat[i].w;
        }
        return o;
      }
      vec3 wpos(vec2 uv, float d){ vec4 w = invVP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return w.xyz / w.w; }
      void main(){
        vec2 uv0 = vUv + shimmer(vUv);
        vec4 c0 = texture2D(tC, uv0);
        float d = texture2D(tD, vUv).r;
        float hero = 1.0 - clamp(c0.a, 0.0, 1.0);
        vec3 wp = wpos(vUv, min(d, 0.999999));
        vec3 pp = hero > 0.5 ? (heroDelta * vec4(wp, 1.0)).xyz : wp;
        vec4 pc = prevVP * vec4(pp, 1.0);
        vec2 puv = pc.xy / pc.w * 0.5 + 0.5;
        vec2 v = (vUv - puv) * amt;
        float L = length(v);
        if (L > maxLen) v *= maxLen / L;
        if (pc.w <= 0.0) v = vec2(0.0);
        vec3 acc = c0.rgb; float wsum = 1.0;
        const int NS = 14;
        for (int i = 0; i < NS; i++) {
          float k = (float(i) + 0.5) / float(NS) - 0.5;
          vec4 s = texture2D(tC, uv0 + v * k);
          float sh = 1.0 - clamp(s.a, 0.0, 1.0);
          float w = hero > 0.5 ? 1.0 : (1.0 - sh);   // background ignores hero samples
          acc += s.rgb * w; wsum += w;
        }
        gl_FragColor = vec4(acc / wsum, c0.a);
      }`, { tC: { value: rtMain.texture }, tD: { value: rtMain.depthTexture }, invVP: { value: new T.Matrix4() }, prevVP: { value: new T.Matrix4() },
      heroDelta: { value: new T.Matrix4() }, amt: { value: 0.5 }, maxLen: { value: 0.06 }, res: { value: new T.Vector2(RW, RH) },
      hTime: { value: 0 }, heat: { value: [new T.Vector4(0, 0, 0, 0), new T.Vector4(0, 0, 0, 0)] } });
    const brightPass = pass(`
      uniform sampler2D tC; uniform float thr; varying vec2 vUv;
      void main(){ vec2 px = vec2(1.0) / vec2(textureSize(tC, 0));
        vec3 c = (texture2D(tC, vUv + px * vec2(-1.0,-1.0)).rgb + texture2D(tC, vUv + px * vec2(1.0,-1.0)).rgb + texture2D(tC, vUv + px * vec2(-1.0,1.0)).rgb + texture2D(tC, vUv + px * vec2(1.0,1.0)).rgb) * 0.25;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        gl_FragColor = vec4(c * smoothstep(thr, thr * 2.5, l), 1.0); }`, { tC: { value: rtBlur.texture }, thr: { value: 1.0 } });
    const gaussFrag = `uniform sampler2D tC; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec2 px = dir / vec2(textureSize(tC, 0)); vec3 c = texture2D(tC, vUv).rgb * 0.2;
        float w[4]; w[0]=0.18; w[1]=0.14; w[2]=0.09; w[3]=0.05;
        for (int i = 1; i <= 4; i++) { c += (texture2D(tC, vUv + px * float(i) * 1.6).rgb + texture2D(tC, vUv - px * float(i) * 1.6).rgb) * w[i-1]; }
        gl_FragColor = vec4(c, 1.0); }`;
    const gH = pass(gaussFrag, { tC: { value: rtB1.texture }, dir: { value: new T.Vector2(1, 0) } });
    const gV = pass(gaussFrag, { tC: { value: rtB2.texture }, dir: { value: new T.Vector2(0, 1) } });
    const finalPass = pass(`
      uniform sampler2D tC, tB, tI; uniform float expo, bloom, sat, con, vig, grain, ca, frame, insetOn, insetA, lift, mgain, mgam; uniform vec3 gain, gamma3; uniform vec4 insetR; uniform vec2 res;
      varying vec2 vUv;
      vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      vec3 toDisplay(vec3 c){
        c = aces(c * expo);
        c = pow(c, vec3(1.0 / 2.2));
        c = pow(max(c, 0.0), gamma3 * mgam) * gain * mgain;
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, sat);
        c = (c - 0.5) * con + 0.5;
        c = lift + c * (1.0 - lift);
        return c;
      }
      void main(){
        vec2 q = vUv - 0.5;
        vec2 off = q * ca * 8.0 / res;
        vec3 c;
        c.r = texture2D(tC, vUv - off).r; c.g = texture2D(tC, vUv).g; c.b = texture2D(tC, vUv + off).b;
        c += texture2D(tB, vUv).rgb * bloom;
        c = toDisplay(c);
        if (insetOn > 0.5 && vUv.x > insetR.x && vUv.x < insetR.z && vUv.y > insetR.y && vUv.y < insetR.w) {
          vec2 iu = (vUv - insetR.xy) / (insetR.zw - insetR.xy);
          vec3 ic = toDisplay(texture2D(tI, iu).rgb);
          c = mix(c, ic, insetA);
        }
        c *= 1.0 - vig * smoothstep(0.25, 0.95, dot(q * vec2(1.0, 0.75), q * vec2(1.0, 0.75)) * 3.2);
        c += (hash(vUv * res + frame * 1.37) - 0.5) * grain;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`, { tC: { value: rtBlur.texture }, tB: { value: rtB1.texture }, tI: { value: rtInset.texture }, expo: { value: 1 }, bloom: { value: 0.12 }, sat: { value: 1 },
      con: { value: 1 }, vig: { value: 0.25 }, grain: { value: 0.025 }, ca: { value: 0.6 }, frame: { value: 0 }, insetOn: { value: 0 }, insetA: { value: 1 },
      insetR: { value: new T.Vector4(0, 0, 1, 1) }, lift: { value: 0 }, mgain: { value: 1 }, mgam: { value: 1 }, gain: { value: new T.Vector3(1, 1, 1) }, gamma3: { value: new T.Vector3(1, 1, 1) }, res: { value: new T.Vector2(W, H) } });

    // ---------------------------------------------------------------- render
    const tmpM = new T.Matrix4(), tmpM2 = new T.Matrix4();
    function camSet(c, st, aspect) {
      c.fov = st.fov || 50; c.aspect = aspect; c.near = st.near || 0.5; c.far = st.far || 60000;
      c.position.set(st.cam[0], st.cam[1], st.cam[2]);
      c.up.set(0, 1, 0);
      c.lookAt(st.look[0], st.look[1], st.look[2]);
      if (st.roll) c.rotateZ(st.roll * D2R);
      c.updateProjectionMatrix(); c.updateMatrixWorld(true);
      c.matrixWorldInverse.copy(c.matrixWorld).invert();
    }
    function vp(st, aspect) {
      const c = new T.PerspectiveCamera();
      camSet(c, st, aspect);
      return new T.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
    }
    let frameNo = 0;
    function render(st) {
      const E = build(st.env), spec = envs[st.env].spec;
      Object.keys(envs).forEach((k) => { if (envs[k].built) envs[k].built.group.visible = k === st.env; });
      applyAtm(spec);
      if (st.sun) { const az = st.sun.az * D2R, el = st.sun.el * D2R; ATM.uSunDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); sun.position.copy(ATM.uSunDir.value).multiplyScalar(1000); }
      scene.environment = E.envMap;
      scene.environmentIntensity = spec.envI != null ? spec.envI : 1.0;
      camSet(camera, st, W / H);
      sky.position.copy(camera.position);
      // shadow frustum around the focus point
      const f = st.shadowAt || st.look, ext = st.shadowExt || 60;
      sun.target.position.set(f[0], f[1], f[2]);
      sun.position.set(f[0], f[1], f[2]).addScaledVector(ATM.uSunDir.value, ext * 4 + 200);
      const sc = sun.shadow.camera;
      sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = ext * 8 + 600;
      sc.updateProjectionMatrix();
      sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
      // main pass (PMREM builds can leave a stale viewport on the default framebuffer: reset it)
      renderer.setRenderTarget(null); renderer.setViewport(0, 0, W, H); renderer.setScissorTest(false);
      renderer.setRenderTarget(rtMain);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(scene, camera);
      // inset (picture in picture) from a second camera, same world
      if (st.inset) {
        camSet(icam, st.inset, IW / IH);
        sky.position.copy(icam.position);
        renderer.setRenderTarget(rtInset);
        renderer.clear();
        renderer.render(scene, icam);
        sky.position.copy(camera.position);
      }
      // motion blur
      const curVP = new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      blurPass.m.uniforms.invVP.value.copy(curVP).invert();
      blurPass.m.uniforms.prevVP.value.copy(st.prev ? vp(st.prev, W / H) : curVP);
      if (st.hero && st.prev && st.prev.hero) {
        st.hero.updateMatrixWorld(true);
        tmpM.copy(st.hero.matrixWorld).invert();
        blurPass.m.uniforms.heroDelta.value.multiplyMatrices(st.prev.hero, tmpM);
      } else blurPass.m.uniforms.heroDelta.value.identity();
      blurPass.m.uniforms.amt.value = st.blur != null ? st.blur : 0.6;
      blurPass.m.uniforms.maxLen.value = st.maxBlur || 0.07;
      // heat shimmer: st.heat = [{ p: [x, y, z], r: metres, k: strength }] projected to screen
      const hu = blurPass.m.uniforms.heat.value;
      hu.forEach((h) => h.set(0, 0, 0, 0));
      blurPass.m.uniforms.hTime.value = (st.frame || 0) / 30;
      (st.heat || []).slice(0, 2).forEach((h, i) => {
        const v = new T.Vector3(...h.p), dist = v.distanceTo(camera.position);
        v.project(camera);
        if (v.z < 1) hu[i].set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5, Math.max(0.02, h.r / (2 * dist * Math.tan(camera.fov * D2R / 2))), h.k || 0.004);
      });
      blurPass.run(rtBlur);
      // bloom
      brightPass.m.uniforms.thr.value = (spec.grade && spec.grade.bloomThr) || 1.1;
      brightPass.run(rtB1); gH.run(rtB2); gV.run(rtB1);
      gH.m.uniforms.dir.value.set(2.2, 0); gV.m.uniforms.dir.value.set(0, 2.2);
      gH.run(rtB2); gV.run(rtB1);
      gH.m.uniforms.dir.value.set(1, 0); gV.m.uniforms.dir.value.set(0, 1);
      // final
      const g = Object.assign({ expo: 1, bloom: 0.12, sat: 1.12, con: 1.1, vig: 0.28, grain: 0.022, ca: 0.6, lift: 0.0, gain: [1, 1, 1], gamma: [1, 1, 1] }, spec.grade || {}, st.grade || {});
      const M = Object.assign({ gain: 0.88, gamma: 1.1 }, o.master || {});
      const u = finalPass.m.uniforms;
      u.expo.value = g.expo; u.bloom.value = g.bloom; u.sat.value = g.sat; u.con.value = g.con; u.vig.value = g.vig; u.grain.value = g.grain; u.ca.value = g.ca; u.lift.value = g.lift;
      u.gain.value.set(...g.gain); u.gamma3.value.set(...g.gamma); u.mgain.value = M.gain; u.mgam.value = M.gamma;
      u.frame.value = st.frame != null ? st.frame : (frameNo++ % 997);
      u.tC.value = st.debug === "main" ? rtMain.texture : rtBlur.texture;
      if (st.debug) { u.bloom.value = 0; u.ca.value = 0; u.grain.value = 0; }
      u.insetOn.value = st.inset ? 1 : 0;
      if (st.inset) { const r = st.inset.rect; u.insetR.value.set(r[0], 1 - r[3], r[2], 1 - r[1]); u.insetA.value = st.inset.alpha != null ? st.inset.alpha : 1; }
      renderer.setRenderTarget(null); renderer.setViewport(0, 0, W, H);
      finalPass.run(null);
      renderer.setRenderTarget(null);
    }


    // ---------------------------------------------------------------- shot audit (framing, occluders, terrain clipping)
    // audit(st) -> { box: [x0, y0, x1, y1] of the hero in 0..1 screen coords (top-left origin), inFrame: share of the hero's
    // bounding-box corners inside the frame, margin: smallest distance of the box to a frame edge (negative = cropped),
    // camAGL: camera height above terrain (m), blocked: rays camera->hero (centre, nose, tail, both tips) blocked by terrain
    // or vegetation }. Pure CPU: terrain by marching the height function, trees by their instance bounding spheres.
    const _box = new T.Box3(), _v3 = new T.Vector3(), _ac = new T.PerspectiveCamera();
    function audit(st) {
      const E = build(st.env), spec = envs[st.env].spec, hf = hfun(spec);
      camSet(_ac, st, W / H);
      const out = { camAGL: st.cam[1] - hf(st.cam[0], st.cam[2], NZ) };
      if (!st.hero) return out;
      st.hero.updateMatrixWorld(true);
      _box.makeEmpty();
      const vis = (m) => { for (let o = m; o && o !== st.hero.parent; o = o.parent) if (!o.visible) return false; return true; };
      let x0 = 9, y0 = 9, x1 = -9, y1 = -9, inside = 0, total = 0;
      st.hero.traverse((m) => {
        if (!m.isMesh || !vis(m) || m.userData.fx || !m.geometry) return;
        m.geometry.computeBoundingBox(); _box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
        const P = m.geometry.attributes.position, step = Math.max(1, Math.floor(P.count / 1500));
        for (let i = 0; i < P.count; i += step) {
          _v3.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m.matrixWorld).applyMatrix4(_ac.matrixWorldInverse);
          total++;
          if (_v3.z > -_ac.near) continue; // behind the camera
          _v3.applyMatrix4(_ac.projectionMatrix);
          const sx = _v3.x * 0.5 + 0.5, sy = 0.5 - _v3.y * 0.5;
          if (sx >= 0 && sx <= 1 && sy >= 0 && sy <= 1) inside++;
          x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
      });
      out.box = [x0, y0, x1, y1].map((v) => +v.toFixed(3));
      out.inFrame = total ? +(inside / total).toFixed(3) : 0;
      out.margin = +Math.min(x0, y0, 1 - x1, 1 - y1).toFixed(3);
      out.size = +Math.max(x1 - x0, (y1 - y0) * H / W).toFixed(3);
      // occlusion rays
      const c = new T.Vector3(...st.cam), ctr = _box.getCenter(new T.Vector3()), sz = _box.getSize(new T.Vector3());
      const targets = [ctr, ctr.clone().add(new T.Vector3(sz.x * 0.4, 0, 0)), ctr.clone().add(new T.Vector3(-sz.x * 0.4, 0, 0)),
        ctr.clone().add(new T.Vector3(0, 0, sz.z * 0.4)), ctr.clone().add(new T.Vector3(0, 0, -sz.z * 0.4))];
      const trees = [];
      E.group.traverse((m) => { if (m.isInstancedMesh) trees.push(m); });
      let blocked = 0;
      for (const p of targets) {
        const d = p.clone().sub(c), L = d.length(); d.divideScalar(L);
        let hit = false;
        for (let s = 2; s < L - 2 && !hit; s += Math.max(1, s * 0.02)) { const q = c.clone().addScaledVector(d, s); if (q.y < hf(q.x, q.z, NZ) - 0.3) hit = true; }
        for (const m of trees) {
          if (hit) break;
          m.geometry.computeBoundingSphere();
          const r0 = m.geometry.boundingSphere.radius * 0.7, cy = m.geometry.boundingSphere.center.y, a = m.instanceMatrix.array;
          for (let i = 0; i < m.count && !hit; i++) {
            const sc = Math.hypot(a[i * 16 + 4], a[i * 16 + 5], a[i * 16 + 6]), r = r0 * sc;
            const ox = a[i * 16 + 12] - c.x, oy = a[i * 16 + 13] + cy * sc - c.y, oz = a[i * 16 + 14] - c.z;
            const tt = ox * d.x + oy * d.y + oz * d.z;
            if (tt < 0.5 || tt > L - 1) continue;
            const dd = ox * ox + oy * oy + oz * oz - tt * tt;
            if (dd < r * r) hit = true;
          }
        }
        if (hit) blocked++;
      }
      out.blocked = blocked;
      return out;
    }

    const K = {
      T, scene, camera, renderer, sun, hemi, actors, ATM, NZ, makeNoise, rng, layer, patch, keepAlphaBlend, mergeGeos, shadeAO,
      env, envs, build, dispose, height, render, vp, audit, lerp, clamp, smooth, canvas,
      size: { W, H, RW, RH, IW, IH },
      get ready() { return Promise.resolve().then(() => new Promise((r) => setTimeout(r, 20))); },
    };
    return K;
  }

  window.SIM = { create, makeNoise, rng };
})();
