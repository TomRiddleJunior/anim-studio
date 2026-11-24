/* Survival-scenario kit · world module "The Ice Station" (needs survival-kit.js v2.1). A polar-night ice plateau
 * with an animated aurora, a fictional research station on stilts and its rooms; physically lit and seek-safe.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.ice.CREATE));
 *   const Ic = SURVIVAL.ice(K);
 *   const hz = K.hazel(SURVIVAL.ice.NOOR); const noor = SURVIVAL.ice.dressNoor(K, hz);
 *   K.render({ …kit state…, auroraK, auroraI, snowK, winK, deskI, ceilI, freezerI, fuelI, floodI, beaconK,
 *              runway (0..1 lights left on), balloon (s since release, or -1 = in her hands), planeK, planeT,
 *              thermo (°C on the dial), frost (0..1), phoneK (screen), phoneBuzz, freezerA (deg), eyesK, eyesI, eyesGather, eyesBlink })
 *
 * World (metres; y up; north = -z): a 3-patch plateau whose sastrugi are wind-carved ridges along x (height field +
 * a fine normal map + view-dependent glints), drifting ground snow (scrolling noise sheets + instanced streaks), the
 * aurora as 4 folding curtains (vertical rays, a bright green lower hem, magenta tops; additive, animated by t) that
 * also drive the key light; module A (offices, blue) and module B (galley/stores, red) on stilts with lit windows, an
 * outside stair, floodlights, an 18 m guyed radio mast with a beacon and a dial thermometer (frost grows on it), an
 * empty flag pole, a snowcat, a 2 km skiway north with 2 x 28 edge lights that can go out one by one, a balloon shed
 * and a weather balloon with its radiosonde; inside A: the weather office (north window, desk, instruments, the
 * satellite phone, the logbook with the temperature chart and its dotted summer line, a wall calendar with SUN
 * RETURNS · AUG 24 circled, the radio and its hand mic); inside B: an upright freezer, the fuel-bladder room, the
 * snow melter. Red eyes on the snow (dim and still, or gathered and blinking). A distant ski plane is only lights.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  // the key light is the aurora: low in the north, pale green; no moon disc (polar night, stars only)
  const AUR = (() => { const az = -8 * D2R, el = 26 * D2R; return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();
  const CREATE = {
    moonDir: AUR, moonCol: "#c4ecdf", bg: "#020509", fogCol: "#18283a", hemi: ["#26406a", "#a8b8cc"],
    shadow: { half: 48, far: 420, dist: 200, center: [6, 3, -2] },
    sky: { zen: [0.003, 0.006, 0.02], hor: [0.018, 0.04, 0.07] },
    env: { zen: "#060d1e", hor: "#1a2c44", mside: "#2f8a74", gnd: "#8a9aac" },
  };

  const FLOOR = 3.4, CEIL = 6.6;                        // module floor / ceiling height
  const MA = { x0: -12, x1: 12, z0: -3.5, z1: 3.5 };    // module A (offices) — the weather office is its east end
  const MB = { x0: 14, x1: 32, z0: -3.5, z1: 3.5 };     // module B (galley, stores, fuel, snow melter)
  const OFF = { x0: 5.2, x1: 11.7, z0: -3.25, z1: 3.25 }; // the office room
  const WIN = { x0: 7.0, x1: 10.0, y0: FLOOR + 0.62, y1: FLOOR + 2.3, z: -3.5 };
  const MAST = [-17, 0, 9];
  const RUN = { x: 9, w: 46, z0: -70, z1: -2300, n: 28 };    // skiway centre line (x), width, along -z (straight out of the office window)
  const SHED = [33, 0, 17];

  function iceH(x, z) {   // gentle swell + wind-carved sastrugi ridges along x (wind from the east)
    const sw = (K_fbm(x / 420 + 3, z / 420 - 2, 7, 3) - 0.5) * 3.2;
    const r1 = Math.pow(1 - Math.abs(K_noise(x / 11, z / 2.2, 11) * 2 - 1), 3) * 0.32;
    const r2 = Math.pow(1 - Math.abs(K_noise(x / 5.5 + 9, z / 1.1, 13) * 2 - 1), 4) * 0.1;
    const d = Math.hypot(x - 8, z);
    const flat = 0.25 + 0.75 * ss((d - 30) / 30);                                          // the station pad is groomed (low ridges)
    const onRun = z < RUN.z0 + 10 ? 1 - ss((Math.abs(x - RUN.x) - RUN.w / 2) / 8) : 0;      // 1 on the skiway
    return sw * ss((d - 60) / 200) + (r1 + r2) * flat * (1 - 0.85 * onRun);
  }
  let K_noise = null, K_fbm = null;

  function ice(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox, rng = K.rng, hash2 = K.hash2;
    K_noise = K.vnoise; K_fbm = K.fbm;
    K.buildSky();
    function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
    function speckle(g, w, h, seed, n, a, cols) { const R = rng(seed); for (let i = 0; i < n; i++) { g.globalAlpha = a * R(); g.fillStyle = cols[Math.floor(R() * cols.length)]; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 2); } g.globalAlpha = 1; }
    const radial = K.canvasTex("i_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const U = { t: { value: 0 }, aur: { value: 1 }, snow: { value: 1 } };

    // ---------------------------------------------------------------- the plateau: near (fine), mid, far patches; snow with glints
    const ripple = K.heightNormal("i_ripple", 256, (x, y) => { const u = x / 256, v = y / 256; const warp = K.vnoise(u * 6, v * 6, 21) * 1.6; return Math.pow(Math.abs(Math.sin((v * 7 + warp) * 3.1416)), 3) * 0.55 * K.vnoise(u * 3 + 5, v * 12, 22) + K.vnoise(u * 40, v * 40, 23) * 0.3 + K.hash2(x, y, 4) * 0.08; }, 1.2);
    const snowM = new T.MeshStandardMaterial({ color: "#dfe6f0", roughness: 0.78, metalness: 0, normalMap: ripple, envMapIntensity: 0.45 });
    snowM.normalScale.set(0.35, 0.35);
    snowM.onBeforeCompile = (sh) => {
      sh.uniforms.uT = U.t;
      sh.vertexShader = "varying vec3 vWPs;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vWPs = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = "uniform float uT; varying vec3 vWPs;\nfloat ih(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }\n" +
        sh.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          {
            vec2 cell = floor(vWPs.xz * 38.0);
            float r = ih(cell);
            vec3 V = normalize(cameraPosition - vWPs);
            float tw = step(0.9965, r) * pow(max(0.0, sin(r * 900.0 + dot(V, vec3(17.0, 9.0, 23.0)) * 3.0)), 24.0);
            float far = 1.0 - smoothstep(6.0, 40.0, length(cameraPosition - vWPs));
            totalEmissiveRadiance += vec3(0.9, 1.0, 1.0) * tw * far * 2.5;
          }`);
    };
    snowM.customProgramCacheKey = () => "i_snow";
    function patch(size, seg, cx, cz, sink) {
      const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + cx, z = pa.getZ(i) + cz; pa.setXYZ(i, x, iceH(x, z) - (sink ? sink(x, z) : 0), z); uv.setXY(i, x / 4, z / 4); }
      g.computeVertexNormals();
      const m = M(g, snowM, { cast: false }); m.receiveShadow = true; return m;
    }
    const inB = (x, z, h, cx, cz) => Math.abs(x - (cx || 0)) < h && Math.abs(z - (cz || 0)) < h;
    patch(260, 520, 8, -20, null);
    patch(2600, 260, 8, -600, (x, z) => (inB(x, z, 128, 8, -20) ? 0.6 : 0));
    patch(24000, 120, 0, -6000, (x, z) => (inB(x, z, 1295, 8, -600) ? 1.5 : 0));
    ripple.wrapS = ripple.wrapT = T.RepeatWrapping; ripple.repeat.set(1, 1);
    // drifting ground snow: low sheets of scrolling noise just above the surface
    const dn = K.noiseTex("i_drift", 256, 91, 5, 2.4);
    const drifts = [];
    for (let i = 0; i < 4; i++) {
      const m = new T.ShaderMaterial({ uniforms: { tN: { value: dn }, t: U.t, k: U.snow, sc: { value: 0.012 + i * 0.006 }, off: { value: i * 3.7 }, h: { value: 0.12 + i * 0.25 } },
        vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: `uniform sampler2D tN; uniform float t, k, sc, off, h; varying vec3 vW;
          void main(){ vec2 q = vW.xz * sc + vec2(-t * 0.35 * (1.0 + off * 0.1), t * 0.02) ; float n = texture2D(tN, q).r * 0.65 + texture2D(tN, q * 3.1 + off).r * 0.35;
            float a = smoothstep(0.45, 0.9, n); float d = length(cameraPosition.xz - vW.xz); a *= smoothstep(1.0, 6.0, d) * (1.0 - smoothstep(120.0, 700.0, d));
            gl_FragColor = vec4(vec3(0.82, 0.9, 0.98), a * 0.32 * k); }`,
        transparent: true, depthWrite: false });
      const mesh = new T.Mesh(new T.PlaneGeometry(1400, 1400), m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(8, 0.15 + i * 0.22, -200); mesh.renderOrder = 2;
      scene.add(mesh); K.noDepth.push(mesh); drifts.push(mesh);
    }
    // blowing snow streaks near the camera (instanced points, positions = f(t))
    const NSN = 2600, sp = new Float32Array(NSN * 3), sr = new Float32Array(NSN);
    { const R = rng(515); for (let i = 0; i < NSN; i++) { sp[i * 3] = R() * 160 - 80; sp[i * 3 + 1] = R() * 6; sp[i * 3 + 2] = R() * 160 - 80; sr[i] = R(); } }
    const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(sp, 3)); sg.setAttribute("aR", new T.BufferAttribute(sr, 1));
    const snowPts = new T.Points(sg, new T.ShaderMaterial({ uniforms: { t: U.t, k: U.snow, cam: { value: new T.Vector3() } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: `uniform float t, k; uniform vec3 cam; attribute float aR; varying float vA;
        void main(){ vec3 p = position; p.x = mod(p.x - t * (9.0 + aR * 6.0) - cam.x + 80.0, 160.0) - 80.0 + cam.x; p.z = mod(p.z + sin(t * 0.7 + aR * 9.0) * 2.0 - cam.z + 80.0, 160.0) - 80.0 + cam.z;
          p.y = mod(p.y + sin(t * 1.3 + aR * 20.0) * 0.4, 6.0) * (0.3 + aR * 0.7);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z; gl_PointSize = clamp(90.0 / d, 1.0, 6.0); vA = k * 0.5 * smoothstep(80.0, 6.0, d) * smoothstep(0.5, 2.0, d); }`,
      fragmentShader: "varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c)) * vA; gl_FragColor = vec4(vec3(0.9, 0.96, 1.0) * a, a); }" }));
    snowPts.frustumCulled = false; scene.add(snowPts); K.noDepth.push(snowPts);

    // ---------------------------------------------------------------- the aurora: folding curtains with vertical rays
    // v2 (Vault/Ice fix pass): the hem rises and falls along each curtain and the height varies along its length, so low
    // views see a wavy, uneven lower edge instead of a straight band; a thin brighter fringe at the hem and faint violet tops.
    const aurM = (seed, bright, base, height) => new T.ShaderMaterial({
      uniforms: { t: U.t, k: U.aur, seed: { value: seed }, br: { value: bright }, base: { value: base }, hgt: { value: height } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false,
      vertexShader: `uniform float t, seed, base, hgt; attribute float aU; attribute float aV; attribute vec2 aN; varying float vU, vV;
        void main(){ vU = aU; vV = aV; vec3 p = position;
          float fold = sin(aU * 18.0 + t * 0.35 + seed) * 0.6 + sin(aU * 41.0 - t * 0.62 + seed * 2.0) * 0.28 + sin(aU * 7.0 + t * 0.16) * 1.0;
          p.xz += aN * fold * 260.0 * (0.6 + 0.4 * aV);
          float wave = sin(aU * 5.0 + seed * 1.7 + t * 0.06) * 0.7 + sin(aU * 12.0 - t * 0.11 + seed * 3.1) * 0.3;
          float tall = 0.74 + 0.2 * sin(aU * 8.0 + seed * 2.9 - t * 0.05) + 0.1 * sin(aU * 23.0 + seed);
          // the strip starts 0.12 below the hem, so a soft glow can hang under the bright lower edge (no hard silhouette)
          p.y = base + wave * hgt * 0.1 + (aV - 0.12) * hgt * tall;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float t, k, seed, br; varying float vU, vV;
        float hh(float x){ return fract(sin(x * 127.1 + seed) * 43758.5453); }
        float n1(float x){ float i = floor(x), f = fract(x); return mix(hh(i), hh(i + 1.0), f * f * (3.0 - 2.0 * f)); }
        void main(){
          float x = vU * 260.0;
          float v = (vV - 0.12) / 0.88;                                           // curtain coordinate: 0 at the hem, 1 at the top
          float rays = 0.55 + 0.45 * n1(x * 1.0 + t * 0.9) * n1(x * 0.37 - t * 0.4 + 7.0);
          rays *= 0.7 + 0.3 * n1(x * 3.1 + t * 2.2);
          float lo = 0.008 * n1(x * 0.35 + t * 0.3 + 3.0);                       // a slightly uneven hem (more reads as a mountain skyline)
          float dv = max(v - lo, 0.0);
          float hem = smoothstep(lo, lo + 0.035, v) * exp(-dv * 3.4);            // bright lower border, fading up
          float fringe = smoothstep(lo - 0.004, lo + 0.01, v) * exp(-dv * 26.0);  // the thin, brightest lower fringe
          float under = exp(min(v - lo, 0.0) * 24.0) * (1.0 - smoothstep(lo - 0.004, lo + 0.01, v)) * smoothstep(-0.136, -0.08, v);   // soft glow hanging below the edge
          float top = smoothstep(1.0, 0.55, v);
          float vio = smoothstep(0.5, 0.78, v) * smoothstep(1.0, 0.84, v);
          float edge = smoothstep(0.0, 0.08, vU) * smoothstep(1.0, 0.92, vU);
          float pulse = 0.75 + 0.25 * sin(t * 0.5 + vU * 9.0 + seed);
          // the curtain is not one continuous band: segments along its length brighten and fade (gaps show the sky through)
          float seg = 0.12 + 0.88 * smoothstep(0.22, 0.62, n1(vU * 14.0 + seed * 3.0 + t * 0.04));
          vec3 c = mix(vec3(0.15, 1.0, 0.45), vec3(0.1, 0.75, 0.6), smoothstep(0.1, 0.45, v));
          c = mix(c, vec3(0.62, 0.22, 0.9), smoothstep(0.45, 0.9, v));
          c = mix(c, vec3(0.66, 1.0, 0.74), clamp(fringe, 0.0, 1.0) * 0.6);
          c = mix(c, vec3(0.95, 0.35, 0.6), under * 0.55);                       // a faint pink border under the hem
          float a = (hem * 1.4 + fringe * 2.2 + under * 0.8 + 0.3 * top * smoothstep(0.0, 0.2, v) + 0.24 * vio) * rays * edge * pulse * seg * k * br;
          gl_FragColor = vec4(c * a, a);
        }` });
    const curtains = [];
    function curtain(R, a0, a1, base, height, seed, bright, cx, cz) {
      const N = 220, pos = [], au = [], av = [], an = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, a = lerp(a0, a1, u) * D2R;
        const x = (cx || 0) + Math.sin(a) * R, z = (cz || 0) - Math.cos(a) * R;
        const nx = Math.sin(a), nz = -Math.cos(a);
        for (const v of [0, 1]) { pos.push(x, base + v * height, z); au.push(u); av.push(v); an.push(nx, nz); }
        if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      }
      // more rows up the curtain for smooth folds
      const g = new T.BufferGeometry();
      const rows = 6, P2 = [], U2 = [], V2 = [], N2 = [], I2 = [];
      for (let i = 0; i <= N; i++) for (let r = 0; r <= rows; r++) {
        const u = i / N, v = r / rows, a = lerp(a0, a1, u) * D2R;
        P2.push((cx || 0) + Math.sin(a) * R, base + v * height, (cz || 0) - Math.cos(a) * R); U2.push(u); V2.push(v); N2.push(Math.sin(a), -Math.cos(a));
      }
      for (let i = 0; i < N; i++) for (let r = 0; r < rows; r++) { const k = i * (rows + 1) + r, k2 = k + rows + 1; I2.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
      g.setAttribute("position", new T.Float32BufferAttribute(P2, 3)); g.setAttribute("aU", new T.Float32BufferAttribute(U2, 1)); g.setAttribute("aV", new T.Float32BufferAttribute(V2, 1)); g.setAttribute("aN", new T.Float32BufferAttribute(N2, 2)); g.setIndex(I2);
      const m = new T.Mesh(g, aurM(seed, bright, base, height)); m.frustumCulled = false; m.renderOrder = -8; scene.add(m); K.noDepth.push(m); curtains.push(m);
      void pos; void au; void av; void an; void idx;
    }
    curtain(3400, -95, 75, 380, 2300, 1.3, 1.0);
    curtain(1800, -70, 45, 1300, 2000, 4.1, 0.85);
    curtain(6200, -60, 110, 600, 3200, 7.7, 0.7);
    curtain(2600, 120, 230, 500, 1800, 2.2, 0.45);

    // ---------------------------------------------------------------- station modules on stilts
    const st = G({});
    const panel = (col, key) => K.canvasTex(key, 256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); speckle(g, w, h, 3, 1500, 0.12, ["#ffffff", "#000000"]); g.fillStyle = "rgba(0,0,0,0.28)"; for (let k = 0; k <= 4; k++) g.fillRect(k * 64 - 1, 0, 2, h); g.fillStyle = "rgba(255,255,255,0.1)"; for (let k = 0; k <= 4; k++) g.fillRect(k * 64 + 1, 0, 1, h); }, { repeat: true });
    const blueT = panel("#2d5a8c", "i_pblue"), redT = panel("#b8432c", "i_pred");
    const steelM = mat("#8e979f", { metal: 0.5, rough: 0.45 }), darkM = mat("#2a2e33", { metal: 0.4, rough: 0.5 }), whiteM = mat("#e6e8ea", { rough: 0.6 });
    function module(R, tex, name) {
      const g = G({}, st), w = R.x1 - R.x0, d = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, h = CEIL + 0.4 - FLOOR + 0.3;
      const m = new T.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.25, envMapIntensity: 0.9 });
      tex.repeat.set(w / 1.6, 1);
      const shell = (W, H, D, p) => { const gg = new T.BoxGeometry(W, H, D); return M(gg, m, p, g); };
      // walls as slabs so the office can be seen into through its window
      const y0 = FLOOR - 0.3, y1 = CEIL + 0.4, yc = (y0 + y1) / 2, H = y1 - y0;
      shell(w, 0.3, d, { x: cx, y: y0 + 0.15 }); shell(w + 0.2, 0.4, d + 0.2, { x: cx, y: y1 - 0.2 });
      for (const zz of [R.z0, R.z1]) {
        if (R === MA && zz === R.z0) {   // north wall of A with the office window opening
          shell(WIN.x0 - R.x0, H, 0.25, { x: (R.x0 + WIN.x0) / 2, y: yc, z: zz });
          shell(R.x1 - WIN.x1, H, 0.25, { x: (WIN.x1 + R.x1) / 2, y: yc, z: zz });
          shell(WIN.x1 - WIN.x0, WIN.y0 - y0, 0.25, { x: (WIN.x0 + WIN.x1) / 2, y: (y0 + WIN.y0) / 2, z: zz });
          shell(WIN.x1 - WIN.x0, y1 - WIN.y1, 0.25, { x: (WIN.x0 + WIN.x1) / 2, y: (WIN.y1 + y1) / 2, z: zz });
        } else shell(w, H, 0.25, { x: cx, y: yc, z: zz });
      }
      shell(0.25, H, d, { x: R.x0, y: yc }); shell(0.25, H, d, { x: R.x1, y: yc });
      // trim bands + roof edge
      for (const zz of [R.z0 - 0.14, R.z1 + 0.14]) { M(box(w + 0.1, 0.12, 0.04), whiteM, { x: cx, y: y1 - 0.45, z: zz }, g); M(box(w + 0.1, 0.12, 0.04), whiteM, { x: cx, y: y0 + 0.35, z: zz }, g); }
      // stilts: hydraulic legs with feet and cross braces
      for (let x = R.x0 + 1.2; x <= R.x1 - 1.2 + 1e-6; x += (w - 2.4) / 3) for (const zz of [R.z0 + 0.8, R.z1 - 0.8]) {
        M(cyl(0.16, 0.16, FLOOR - 0.3, 14), steelM, { x, y: (FLOOR - 0.3) / 2, z: zz }, g); M(cyl(0.21, 0.21, 0.9, 14), darkM, { x, y: 0.9, z: zz }, g);
        M(box(1.1, 0.12, 1.1), darkM, { x, y: 0.06, z: zz }, g);
      }
      for (let x = R.x0 + 1.2; x < R.x1 - 1.3; x += (w - 2.4) / 3) for (const zz of [R.z0 + 0.8, R.z1 - 0.8]) K.rod([x, 0.5, zz], [x + (w - 2.4) / 3, FLOOR - 0.5, zz], 0.05, steelM, g, 6);
      return { g, m };
    }
    const modA = module(MA, blueT, "A"), modB = module(MB, redT, "B");
    // link bridge between A and B
    M(box(2.2, 2.6, 2.6), new T.MeshStandardMaterial({ color: "#c8ccd2", roughness: 0.5, metalness: 0.3 }), { x: 13, y: FLOOR + 1.1, z: 0 }, st);
    // windows: warm lit panes (blinds) on the façades (the office window is real glass, below)
    const winT = K.canvasTex("i_win", 128, 96, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffd9a0"); gr.addColorStop(1, "#ffb066"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(120,70,30,0.28)"; for (let y = 4; y < h; y += 8) g.fillRect(0, y, w, 3); });
    const winM = new T.MeshBasicMaterial({ map: winT, color: new T.Color(1, 1, 1) });
    const frameM = mat("#e8eaec", { rough: 0.5 });
    const wins = [];
    const addWin = (x, y, z, w, h, face) => { const p = M(new T.PlaneGeometry(w, h), winM, { x, y, z, ry: face > 0 ? 0 : 180, cast: false }, st); wins.push(p); M(box(w + 0.16, h + 0.16, 0.06), frameM, { x, y, z: z - face * 0.02 }, st).scale.z = 1; };
    for (const x of [-10, -7, -4, -1, 2]) addWin(x, FLOOR + 1.55, MA.z1 + 0.135, 1.3, 0.95, 1);
    for (const x of [-10, -7, -4, -1, 2]) addWin(x, FLOOR + 1.55, MA.z0 - 0.135, 1.3, 0.95, -1);
    for (const x of [7.2, 10.0]) addWin(x, FLOOR + 1.55, MA.z1 + 0.135, 1.3, 0.95, 1);
    for (const x of [16, 19.5, 23, 26.5, 30]) { addWin(x, FLOOR + 1.55, MB.z1 + 0.135, 1.3, 0.95, 1); addWin(x, FLOOR + 1.55, MB.z0 - 0.135, 1.3, 0.95, -1); }
    // the office window: glass + frame
    const glassM = new T.MeshPhysicalMaterial({ color: "#a9c3d6", roughness: 0.05, transparent: true, opacity: 0.12, envMapIntensity: 1.4, depthWrite: false, side: T.DoubleSide });
    M(new T.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), glassM, { x: (WIN.x0 + WIN.x1) / 2, y: (WIN.y0 + WIN.y1) / 2, z: WIN.z, cast: false, receive: false, nodepth: true }, st).renderOrder = 3;
    for (const x of [WIN.x0, WIN.x1]) M(box(0.08, WIN.y1 - WIN.y0, 0.3), frameM, { x, y: (WIN.y0 + WIN.y1) / 2, z: WIN.z }, st);
    for (const y of [WIN.y0, WIN.y1]) M(box(WIN.x1 - WIN.x0 + 0.08, 0.08, 0.3), frameM, { x: (WIN.x0 + WIN.x1) / 2, y, z: WIN.z }, st);
    // outside stair to the west door of A, with a railing; a door
    { const sx = MA.x0 - 1.4; for (let i = 0; i < 12; i++) M(box(1.2, 0.06, 0.32), darkM, { x: sx, y: 0.28 * (i + 1), z: 2.6 - i * 0.28 }, st);
      M(box(1.6, 0.1, 1.6), darkM, { x: MA.x0 - 0.9, y: FLOOR - 0.05, z: -1.0 }, st);
      for (const s of [-0.6, 0.6]) K.rod([sx + s, 1.2, 2.8], [sx + s, FLOOR + 1.0, -0.8], 0.03, steelM, st, 6);
      M(box(0.08, 2.1, 1.0), mat("#d8dadc", { rough: 0.5 }), { x: MA.x0 - 0.14, y: FLOOR + 1.05, z: -1.0 }, st); }
    // floodlights on the module corners + light poles
    const floodL = [];
    for (const [x, z, tx, tz] of [[MA.x0 + 0.5, MA.z1 + 0.4, -6, 14], [MB.x1 - 0.5, MB.z1 + 0.4, 26, 16], [10.5, MA.z0 - 0.4, 12, -16]]) {
      M(box(0.4, 0.28, 0.25), darkM, { x, y: CEIL + 0.1, z }, st);
      M(box(0.32, 0.2, 0.02), glow("#fff1d8", 7), { x, y: CEIL + 0.1, z: z + Math.sign(z) * 0.13, cast: false }, st);
      const L = new T.SpotLight("#ffe7c4", 0, 70, 38 * D2R, 0.7, 1.3); L.position.set(x, CEIL + 0.05, z + Math.sign(z) * 0.3); L.target.position.set(tx, 0, tz); scene.add(L, L.target); floodL.push(L);
    }
    floodL[0].castShadow = true; floodL[0].shadow.mapSize.set(1024, 1024); floodL[0].shadow.bias = -0.001; floodL[0].shadow.radius = 3;

    // ---------------------------------------------------------------- the radio mast, beacon, thermometer, Stevenson screen; flag pole; snowcat; balloon shed
    const mast = G({ x: MAST[0], y: 0, z: MAST[2] });
    { const H = 18, r = 0.36; const legs = [0, 1, 2].map((k) => [Math.cos(k * 2.094) * r, Math.sin(k * 2.094) * r]);
      for (const [x, z] of legs) K.rod([x, 0, z], [x, H, z], 0.035, steelM, mast, 6);
      for (let y = 0.6; y < H; y += 0.6) for (let k = 0; k < 3; k++) { const a = legs[k], b = legs[(k + 1) % 3]; K.rod([a[0], y, a[1]], [b[0], y + 0.6, b[1]], 0.012, steelM, mast, 4); }
      M(cyl(0.02, 0.02, 3, 6), steelM, { y: H + 1.5 }, mast);
      for (const a of [0.4, 2.5, 4.6]) { const gx = Math.cos(a) * 11, gz = Math.sin(a) * 11; K.rod([0, H - 1, 0], [gx, 0, gz], 0.008, mat("#3b3f44"), mast, 4); K.rod([0, H * 0.55, 0], [gx * 0.8, 0, gz * 0.8], 0.008, mat("#3b3f44"), mast, 4); }
      M(box(1.2, 0.08, 0.08), steelM, { y: H - 2, rz: 0 }, mast); }
    const beacon = M(sph(0.16, 12, 10), glow("#ff2a1a", 10), { x: MAST[0], y: 18.2, z: MAST[2], cast: false });
    // thermometer: a big dial on a bracket at eye height, facing south; its needle + frost are driven per frame
    const th = G({ x: MAST[0] + 0.05, y: 1.95, z: MAST[2] + 0.55 });
    M(box(0.1, 0.1, 0.5), steelM, { z: -0.25 }, th);
    M(cyl(0.3, 0.3, 0.09, 48), mat("#d7dade", { metal: 0.6, rough: 0.3 }), { rx: 90, z: 0.04 }, th);
    const dialT = K.textTex("i_thdial", 512, 512, (q, w, h) => {
      q.fillStyle = "#f3efe4"; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 6, 0, 7); q.fill();
      q.strokeStyle = "#1e2a36"; q.lineWidth = 4; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 30, 0.75 * Math.PI, 2.25 * Math.PI); q.stroke();
      q.fillStyle = "#1e2a36"; q.textAlign = "center";
      for (let v = -80; v <= 40; v += 5) { const a = (0.75 + 1.5 * (v + 80) / 120) * Math.PI, r0 = w / 2 - 30, r1 = v % 20 === 0 ? w / 2 - 62 : w / 2 - 46; q.lineWidth = v % 20 === 0 ? 5 : 2.5; q.beginPath(); q.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); q.lineTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); q.stroke();
        if (v % 20 === 0) { q.font = "700 40px KitOswald, sans-serif"; q.fillText(String(v), w / 2 + Math.cos(a) * (w / 2 - 100), h / 2 + Math.sin(a) * (w / 2 - 100) + 14); } }
      q.fillStyle = "#2a6fd6"; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 30, 0.75 * Math.PI, (0.75 + 1.5 * 40 / 120) * Math.PI); q.arc(w / 2, h / 2, w / 2 - 40, (0.75 + 1.5 * 40 / 120) * Math.PI, 0.75 * Math.PI, true); q.fill();
      q.fillStyle = "#1e2a36"; q.font = "700 52px KitOswald, sans-serif"; q.fillText("°C", w / 2, h / 2 + 120);
    });
    M(new T.CircleGeometry(0.27, 64), mat("#ffffff", { map: dialT, rough: 0.5 }), { z: 0.092, cast: false }, th);
    const needle = G({ z: 0.1 }, th); M(box(0.012, 0.21, 0.006), mat("#c8321f", { rough: 0.4 }), { y: 0.09 }, needle); M(cyl(0.022, 0.022, 0.02, 16), mat("#1e2a36"), { rx: 90 }, needle);
    // the digital readout under the dial (big, readable)
    const thRead = K.canvasTex("i_thread", 512, 192, () => {});
    const thCv = thRead.image, drawRead = (v) => { const q = thCv.getContext("2d"); q.fillStyle = "#081410"; q.fillRect(0, 0, 512, 192); q.fillStyle = "#7dffb0"; q.font = "700 150px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText((v < 0 ? "−" : "") + Math.abs(Math.round(v)) + "°C", 256, 160); thRead.needsUpdate = true; };
    M(box(0.5, 0.2, 0.06), darkM, { y: -0.44, z: 0.0 }, th);
    const readM = new T.MeshBasicMaterial({ map: thRead, color: new T.Color(1.4, 1.4, 1.4) });
    M(new T.PlaneGeometry(0.44, 0.165), readM, { y: -0.44, z: 0.035, cast: false }, th);
    const frostT = K.canvasTex("i_frost", 512, 512, (q, w, h) => {   // dendritic frost: grows from the rim (alpha = threshold of a radial field)
      const im = q.createImageData(w, h); const R = rng(77);
      const seeds = []; for (let i = 0; i < 70; i++) { const a = R() * 6.283; seeds.push([w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48, a]); }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x - w / 2, dy = y - h / 2, r = Math.hypot(dx, dy) / (w / 2);
        const ang = Math.atan2(dy, dx), br = Math.abs(Math.sin(ang * 23 + Math.sin(r * 30) * 0.8)) * 0.25 + K.vnoise(x / 9, y / 9, 3) * 0.35 + K.vnoise(x / 30, y / 30, 5) * 0.4;
        const v = clamp(r * 1.05 - 0.15 + (br - 0.5) * 0.35, 0, 1); // high at the rim
        const q4 = (y * w + x) * 4; im.data[q4] = 235; im.data[q4 + 1] = 245; im.data[q4 + 2] = 255; im.data[q4 + 3] = Math.round(v * 255);
      }
      q.putImageData(im, 0, 0); void seeds;
    });
    const frostM = new T.ShaderMaterial({ uniforms: { tF: { value: frostT }, f: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D tF; uniform float f; varying vec2 vUv; void main(){ float v = texture2D(tF, vUv).a; float a = smoothstep(1.0 - f, 1.0 - f + 0.08, v) * 0.85; gl_FragColor = vec4(vec3(0.86, 0.93, 1.0) * 0.8, a); }" });
    M(new T.CircleGeometry(0.275, 64), frostM, { z: 0.13, cast: false, receive: false, nodepth: true }, th).renderOrder = 4;
    M(new T.TorusGeometry(0.29, 0.025, 10, 64), mat("#b8bec4", { metal: 0.7, rough: 0.3 }), { z: 0.1 }, th);
    // Stevenson screen at the mast base
    { const ss_ = G({ x: MAST[0] + 1.8, y: 0, z: MAST[2] + 0.4 }); for (const s of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) M(box(0.06, 1.2, 0.06), whiteM, { x: s, y: 0.6, z }, ss_);
      M(box(0.8, 0.6, 0.7), whiteM, { y: 1.5 }, ss_); for (let k = 0; k < 6; k++) M(box(0.82, 0.03, 0.02), mat("#c9ccd0"), { y: 1.25 + k * 0.1, z: 0.36, rx: 30 }, ss_); M(box(0.95, 0.06, 0.85), whiteM, { y: 1.83 }, ss_); }
    // flag pole (no flag)
    M(cyl(0.05, 0.07, 8, 10), mat("#c9ccd0", { metal: 0.6, rough: 0.3 }), { x: -6, y: 4, z: 13 }); M(sph(0.1, 10, 8), mat("#b8924c", { metal: 0.9, rough: 0.3 }), { x: -6, y: 8.05, z: 13 });
    K.rod([-5.94, 0.6, 13], [-5.94, 7.9, 13], 0.006, mat("#dddddd"));
    // snowcat (red cab on two tracks, a front blade)
    const cat = G({ x: -14, y: 0, z: 18, ry: 24 });
    { const red = new T.MeshPhysicalMaterial({ color: "#c43422", roughness: 0.4, metalness: 0.2, clearcoat: 0.6 }), tr = mat("#1f2226", { rough: 0.8 });
      for (const s of [-1, 1]) { M(rbox(0.7, 0.9, 4.2, 0.4), tr, { x: s * 1.2, y: 0.5 }, cat); for (let k = 0; k < 4; k++) M(cyl(0.3, 0.3, 0.72, 14), darkM, { x: s * 1.2, y: 0.42, z: -1.4 + k * 0.93, rz: 90 }, cat); }
      M(box(2.2, 0.6, 3.6), red, { y: 1.25 }, cat); M(rbox(2.0, 1.2, 2.0, 0.12), red, { y: 2.1, z: -0.3 }, cat);
      M(box(1.9, 0.6, 0.04), new T.MeshPhysicalMaterial({ color: "#20303c", roughness: 0.06, metalness: 0.2 }), { y: 2.3, z: 0.72 }, cat);
      for (const s of [-1, 1]) M(box(0.04, 0.55, 1.6), new T.MeshPhysicalMaterial({ color: "#20303c", roughness: 0.06, metalness: 0.2 }), { x: s * 1.0, y: 2.3, z: -0.3 }, cat);
      M(box(3.0, 0.8, 0.12), darkM, { y: 0.55, z: 2.6, rx: 12 }, cat); M(box(2.4, 0.08, 2.0), whiteM, { y: 2.74, z: -0.3 }, cat); }
    // balloon shed: an orange hut with a tall open door
    const shed = G({ x: SHED[0], y: 0, z: SHED[2], ry: -15 });
    { const o = mat("#d96a1e", { rough: 0.5 }); M(box(4, 3.6, 4), o, { y: 1.8 }, shed); M(box(4.3, 0.2, 4.3), whiteM, { y: 3.7 }, shed); M(box(2.2, 3.0, 0.05), mat("#2a2a2a"), { y: 1.5, z: 2.02, cast: false }, shed);
      const sL = new T.PointLight("#ffd6a0", 0, 0, 2); sL.position.set(0, 2.6, 1.0); shed.add(sL); shed.userData.L = sL; }

    // ---------------------------------------------------------------- the skiway: two rows of edge lights; the plane (lights only)
    const runLights = [], runL = G({});
    const lensM = [];
    for (let i = 0; i < RUN.n; i++) for (const s of [-1, 1]) {
      const z = lerp(RUN.z0, RUN.z1, i / (RUN.n - 1)), x = RUN.x + s * RUN.w / 2;
      const p = G({ x, y: iceH(x, z), z }, runL);
      M(cyl(0.04, 0.05, 0.7, 8), darkM, { y: 0.35 }, p);
      const m = glow(i === 0 ? "#7dff9a" : "#ffd27a", 14, { fog: true }); lensM.push(m);
      const l = M(sph(0.14, 10, 8), m, { y: 0.78, cast: false }, p); l.scale.setScalar(1 + i * 0.09);
      const halo = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color(i === 0 ? "#7dff9a" : "#ffc060").multiplyScalar(0.7), transparent: true, depthWrite: false, blending: T.AdditiveBlending }), { y: 0.78, s: 2.2 + i * 0.5, cast: false, receive: false, nodepth: true }, p);
      runLights.push({ p, l, halo, m, i });
    }
    const plane = G({});
    const plHL = [M(sph(1.2, 10, 8), glow("#fff6e0", 30, { fog: false }), { x: -2.5, cast: false }, plane), M(sph(1.2, 10, 8), glow("#fff6e0", 30, { fog: false }), { x: 2.5, cast: false }, plane)];
    const plR = M(sph(0.9, 8, 6), glow("#ff2a1a", 20, { fog: false }), { x: -9, cast: false }, plane), plG = M(sph(0.9, 8, 6), glow("#2aff6a", 20, { fog: false }), { x: 9, cast: false }, plane), plB = M(sph(0.9, 8, 6), glow("#ff3020", 24, { fog: false }), { y: 2, cast: false }, plane);
    const plHalo = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#fff2d8").multiplyScalar(0.8), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { s: 40, cast: false, receive: false, nodepth: true }, plane);
    void plHL;

    // ---------------------------------------------------------------- the weather balloon (white latex, string, radiosonde)
    const bal = G({});
    const latex = new T.MeshPhysicalMaterial({ color: "#f4f2ee", roughness: 0.35, transmission: 0, transparent: true, opacity: 0.93, sheen: 0.6, sheenColor: new T.Color("#ffffff"), clearcoat: 0.6, envMapIntensity: 1.2 });
    const balG = new T.SphereGeometry(0.9, 40, 30); { const pa = balG.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setY(i, y < 0 ? y * 1.25 : y); } balG.computeVertexNormals(); }
    const balloonMesh = M(balG, latex, { y: 0 }, bal);
    M(cyl(0.05, 0.08, 0.25, 10), latex, { y: -1.2 }, bal);
    const stringM = mat("#dddddd", { rough: 0.6 });
    const strG = G({}, bal); const str = M(cyl(0.006, 0.006, 1, 4), stringM, { y: -0.5 }, strG);
    const sonde = G({}, bal); M(box(0.16, 0.22, 0.12), mat("#f2f2f0", { rough: 0.6 }), {}, sonde); M(box(0.04, 0.04, 0.02), glow("#ff3a2a", 6), { y: 0.06, z: 0.065, cast: false }, sonde);

    // ---------------------------------------------------------------- interiors: the weather office (east end of module A)
    const off = G({});
    const wallM = mat("#d9d4c8", { rough: 0.85 }), woodM = mat("#7a5a3c", { rough: 0.6 }), floorM = mat("#5d6a74", { rough: 0.7, map: K.canvasTex("i_floor", 256, 256, (q, w, h) => { q.fillStyle = "#6b7781"; q.fillRect(0, 0, w, h); speckle(q, w, h, 9, 3000, 0.15, ["#55606a", "#7f8a94"]); q.fillStyle = "rgba(0,0,0,0.25)"; for (let k = 0; k <= 4; k++) { q.fillRect(k * 64, 0, 2, h); q.fillRect(0, k * 64, w, 2); } }, { repeat: true }) });
    floorM.map.repeat.set(3, 3);
    M(box(OFF.x1 - OFF.x0, 0.04, OFF.z1 - OFF.z0), floorM, { x: (OFF.x0 + OFF.x1) / 2, y: FLOOR + 0.02, z: 0 }, off);
    M(box(OFF.x1 - OFF.x0, 0.04, OFF.z1 - OFF.z0), mat("#e9e6de", { rough: 0.9 }), { x: (OFF.x0 + OFF.x1) / 2, y: CEIL - 0.02, z: 0 }, off);
    M(box(0.08, CEIL - FLOOR, OFF.z1 - OFF.z0), wallM, { x: OFF.x0, y: (FLOOR + CEIL) / 2, z: 0 }, off);   // west partition
    M(box(0.04, CEIL - FLOOR, OFF.z1 - OFF.z0), wallM, { x: OFF.x1 - 0.02, y: (FLOOR + CEIL) / 2, z: 0 }, off);   // east wall face
    M(box(OFF.x1 - OFF.x0, CEIL - FLOOR, 0.04), wallM, { x: (OFF.x0 + OFF.x1) / 2, y: (FLOOR + CEIL) / 2, z: OFF.z1 - 0.02 }, off);   // south wall face
    // north wall inner faces around the window
    M(box(WIN.x0 - OFF.x0, CEIL - FLOOR, 0.04), wallM, { x: (OFF.x0 + WIN.x0) / 2, y: (FLOOR + CEIL) / 2, z: OFF.z0 }, off);
    M(box(OFF.x1 - WIN.x1, CEIL - FLOOR, 0.04), wallM, { x: (WIN.x1 + OFF.x1) / 2, y: (FLOOR + CEIL) / 2, z: OFF.z0 }, off);
    M(box(WIN.x1 - WIN.x0, WIN.y0 - FLOOR, 0.04), wallM, { x: (WIN.x0 + WIN.x1) / 2, y: (FLOOR + WIN.y0) / 2, z: OFF.z0 }, off);
    M(box(WIN.x1 - WIN.x0, CEIL - WIN.y1, 0.04), wallM, { x: (WIN.x0 + WIN.x1) / 2, y: (WIN.y1 + CEIL) / 2, z: OFF.z0 }, off);
    // the weather desk under the window
    const desk = G({ x: 8.5, y: FLOOR, z: OFF.z0 + 0.45 });
    M(box(3.4, 0.05, 0.8), woodM, { y: 0.75 }, desk);
    for (const [x, z] of [[-1.6, -0.32], [1.6, -0.32], [-1.6, 0.32], [1.6, 0.32]]) M(box(0.05, 0.75, 0.05), darkM, { x, y: 0.375, z }, desk);
    // instruments: a barometer dial, a digital weather console, a monitor with a chart, papers
    const baroT = K.textTex("i_baro", 256, 256, (q, w, h) => { q.fillStyle = "#efe9da"; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 4, 0, 7); q.fill(); q.strokeStyle = "#3a2a1c"; q.lineWidth = 3; q.stroke(); q.fillStyle = "#3a2a1c"; q.font = "600 18px KitInter, sans-serif"; q.textAlign = "center"; q.fillText("hPa", w / 2, h / 2 + 50); for (let k = 0; k < 11; k++) { const a = (0.8 + 1.4 * k / 10) * Math.PI; q.fillRect(w / 2 + Math.cos(a) * 100 - 2, h / 2 + Math.sin(a) * 100 - 2, 4, 4); } q.strokeStyle = "#111"; q.lineWidth = 4; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.cos(1.3 * Math.PI) * 90, h / 2 + Math.sin(1.3 * Math.PI) * 90); q.stroke(); });
    M(cyl(0.13, 0.13, 0.04, 32), mat("#b8924c", { metal: 0.85, rough: 0.3 }), { x: -1.35, y: 1.1, z: -0.36, rx: 90 }, desk);
    M(new T.CircleGeometry(0.115, 32), mat("#ffffff", { map: baroT, rough: 0.5 }), { x: -1.35, y: 1.1, z: -0.335, cast: false }, desk);
    const conT = K.textTex("i_console", 512, 256, (q, w, h) => { q.fillStyle = "#0b1a14"; q.fillRect(0, 0, w, h); q.fillStyle = "#7dffb0"; q.font = "700 80px KitOswald, sans-serif"; q.fillText("−58.4°", 24, 100); q.font = "600 34px KitInter, sans-serif"; q.fillText("WIND 14 kt  E", 24, 160); q.fillText("PRESS 652 hPa", 24, 210); });
    M(rbox(0.5, 0.28, 0.12, 0.02), darkM, { x: -0.85, y: 0.92, z: -0.2, rx: -12 }, desk);
    const conM = new T.MeshBasicMaterial({ map: conT, color: new T.Color(1.2, 1.2, 1.2) });
    M(new T.PlaneGeometry(0.44, 0.22), conM, { x: -0.85, y: 0.93, z: -0.134, rx: -12, cast: false }, desk);
    const monT = K.textTex("i_monitor", 512, 320, (q, w, h) => { q.fillStyle = "#0e1520"; q.fillRect(0, 0, w, h); q.strokeStyle = "#2a3a50"; q.lineWidth = 1; for (let k = 0; k < 10; k++) { q.beginPath(); q.moveTo(0, k * 32); q.lineTo(w, k * 32); q.stroke(); } q.strokeStyle = "#5fc8ff"; q.lineWidth = 3; q.beginPath(); for (let x = 0; x < w; x += 8) q.lineTo(x, 200 - Math.sin(x / 40) * 30 - x * 0.05); q.stroke(); q.fillStyle = "#cfe6ff"; q.font = "600 22px KitInter, sans-serif"; q.fillText("UPPER AIR · 21:30", 16, 30); });
    M(box(0.62, 0.4, 0.04), darkM, { x: 0.95, y: 1.15, z: -0.3 }, desk); M(box(0.06, 0.25, 0.06), darkM, { x: 0.95, y: 0.88, z: -0.3 }, desk);
    const monM = new T.MeshBasicMaterial({ map: monT, color: new T.Color(1.1, 1.1, 1.1) });
    M(new T.PlaneGeometry(0.58, 0.36), monM, { x: 0.95, y: 1.15, z: -0.278, cast: false }, desk);
    // the logbook: open, the temperature chart with its dotted summer line (a plant)
    const logT = K.textTex("i_log", 768, 512, (q, w, h) => {
      q.fillStyle = "#f2ecdc"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(0,0,0,0.25)"; q.fillRect(w / 2 - 2, 0, 4, h);
      // left page: entries
      q.fillStyle = "rgba(60,80,140,0.3)"; for (let y = 40; y < h; y += 26) q.fillRect(16, y, w / 2 - 34, 1.5);
      q.fillStyle = "#1d2a44"; q.font = "500 19px KitInter, sans-serif"; ["21:00  −58.1  wind E 12", "21:30  balloon up", "21:45  −58.3  clear", "22:00  radio: all clear"].forEach((s, i) => q.fillText(s, 22, 62 + i * 26));
      // right page: the chart
      const x0 = w / 2 + 50, x1 = w - 24, y0 = 70, y1 = h - 70;
      q.fillStyle = "#1d2a44"; q.font = "700 22px KitOswald, sans-serif"; q.fillText("OUTSIDE TEMP · °C", x0, 44);
      q.strokeStyle = "#1d2a44"; q.lineWidth = 2; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(x1, y1); q.stroke();
      q.font = "500 15px KitInter, sans-serif";
      const ty = (v) => y0 + (v - -20) / (-70 - -20) * (y1 - y0);
      for (const v of [-20, -30, -40, -50, -60, -70]) { q.fillText(String(v), x0 - 40, ty(v) + 5); q.strokeStyle = "rgba(29,42,68,0.18)"; q.lineWidth = 1; q.beginPath(); q.moveTo(x0, ty(v)); q.lineTo(x1, ty(v)); q.stroke(); }
      const mo = ["MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]; const tx = (i) => x0 + 10 + i * (x1 - x0 - 20) / 7;
      mo.forEach((m, i) => q.fillText(m, tx(i) - 14, y1 + 22));
      const meas = [[0, -52], [0.5, -55], [1, -59], [1.5, -61], [2, -60], [2.3, -58]];
      q.strokeStyle = "#1d4fa0"; q.lineWidth = 4; q.beginPath(); meas.forEach(([i, v], k) => (k ? q.lineTo(tx(i), ty(v)) : q.moveTo(tx(i), ty(v)))); q.stroke();
      q.fillStyle = "#c8321f"; q.beginPath(); q.arc(tx(2.3), ty(-58), 7, 0, 7); q.fill(); q.font = "700 15px KitInter, sans-serif"; q.fillText("TODAY", tx(2.3) - 20, ty(-58) + 28);
      q.setLineDash([9, 8]); q.strokeStyle = "#c8321f"; q.lineWidth = 3.5; q.beginPath(); q.moveTo(tx(2.3), ty(-58));
      [[3, -54], [4, -46], [5, -37], [6, -30], [7, -25]].forEach(([i, v]) => q.lineTo(tx(i), ty(v))); q.stroke(); q.setLineDash([]);
      q.fillStyle = "#c8321f"; q.font = "700 24px KitOswald, sans-serif"; q.fillText("SUMMER ≈ −25°C", tx(4.0), ty(-25) + 4);
    });
    const logbook = M(box(0.56, 0.014, 0.37), [mat("#e8e2d2"), mat("#e8e2d2"), mat("#ffffff", { map: logT, rough: 0.9 }), mat("#3a2a1c"), mat("#e8e2d2"), mat("#e8e2d2")], { x: -0.12, y: 0.783, z: 0.06, ry: 4 }, desk);
    M(cyl(0.004, 0.004, 0.16, 6), mat("#e3b52f", { rough: 0.5 }), { x: 0.2, y: 0.795, z: 0.12, rz: 90, ry: 30 }, desk);
    // the satellite phone in its cradle (screen + LED driven by phoneK)
    const phone = G({ x: 0.42, y: 0.775, z: -0.06, ry: -18 }, desk);
    M(box(0.16, 0.03, 0.26), darkM, { y: 0.015 }, phone);
    const ph = G({ y: 0.05, rx: -14 }, phone);
    M(rbox(0.075, 0.03, 0.2, 0.01), mat("#5a616b", { rough: 0.4, metal: 0.25 }), { rx: 90 }, ph);
    M(cyl(0.012, 0.016, 0.13, 10), mat("#1a1c1f", { rough: 0.5 }), { x: 0.022, y: 0.0, z: -0.15, rx: 90 }, ph);
    const phT = K.textTex("i_phscr", 128, 96, (q, w, h) => { q.fillStyle = "#0b2a18"; q.fillRect(0, 0, w, h); q.fillStyle = "#8affb4"; q.font = "700 22px KitOswald, sans-serif"; q.fillText("1 NEW", 14, 38); q.font = "600 16px KitInter, sans-serif"; q.fillText("HQ  10:15", 14, 70); });
    const phScr = M(new T.PlaneGeometry(0.055, 0.042), new T.MeshBasicMaterial({ map: phT, color: new T.Color(0.1, 0.1, 0.1) }), { y: 0.0215, z: 0.035, rx: -90, cast: false }, ph);
    const phKeys = K.canvasTex("i_phkeys", 64, 96, (q, w, h) => { q.fillStyle = "#2c3036"; q.fillRect(0, 0, w, h); q.fillStyle = "#8f959c"; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) q.fillRect(8 + c * 18, 10 + r * 20, 12, 12); });
    M(new T.PlaneGeometry(0.055, 0.07), mat("#ffffff", { map: phKeys, rough: 0.6 }), { y: 0.0215, z: -0.03, rx: -90, cast: false }, ph);
    // the radio + hand mic hook; a mug
    M(rbox(0.36, 0.14, 0.24, 0.02), darkM, { x: 1.45, y: 0.85, z: -0.18 }, desk);
    const rdT = K.textTex("i_radio", 128, 48, (q, w, h) => { q.fillStyle = "#081410"; q.fillRect(0, 0, w, h); q.fillStyle = "#7dffb0"; q.font = "700 30px KitOswald, sans-serif"; q.fillText("CH 3", 12, 36); });
    M(new T.PlaneGeometry(0.12, 0.045), new T.MeshBasicMaterial({ map: rdT, color: new T.Color(1.5, 1.5, 1.5) }), { x: 1.45, y: 0.87, z: -0.055, cast: false }, desk);
    const mug = G({ x: -0.62, y: 0.775, z: 0.2 }, desk); M(cyl(0.04, 0.036, 0.1, 16), mat("#e0d6c4", { rough: 0.4 }), { y: 0.05 }, mug); M(new T.TorusGeometry(0.025, 0.007, 6, 14), mat("#e0d6c4"), { x: 0.045, y: 0.05 }, mug);
    // the desk lamp (warm key), the ceiling light (cool), a chair
    const lamp = G({ x: 1.22, y: 0.775, z: 0.2 }, desk);
    M(cyl(0.07, 0.08, 0.025, 20), darkM, { y: 0.012 }, lamp); K.rod([0, 0.02, 0], [-0.05, 0.36, -0.05], 0.009, mat("#9a9a96", { metal: 0.8, rough: 0.3 }), lamp, 6);
    M(new T.ConeGeometry(0.09, 0.12, 22, 1, true), mat("#2a5f8a", { metal: 0.3, rough: 0.4, side: T.DoubleSide }), { x: -0.08, y: 0.4, z: -0.02, rx: -14, rz: 16 }, lamp);
    const lampBulb = M(sph(0.025, 12, 10), glow("#ffd9a0", 8), { x: -0.085, y: 0.365, z: -0.02, cast: false }, lamp);
    const deskL = new T.PointLight("#ffcf9a", 0, 0, 2); deskL.position.set(-0.09, 0.36, 0.06); lamp.add(deskL);
    deskL.castShadow = true; deskL.shadow.mapSize.set(512, 512); deskL.shadow.camera.near = 0.05; deskL.shadow.camera.far = 8; deskL.shadow.bias = -0.003; deskL.shadow.radius = 3;
    const ceilL = new T.PointLight("#dfe9ff", 0, 0, 2); ceilL.position.set(8.8, CEIL - 0.25, 1.4); scene.add(ceilL);
    M(box(1.2, 0.05, 0.25), glow("#eef4ff", 2.2), { x: 8.4, y: CEIL - 0.05, z: 0.6, cast: false }, off);
    const chair = G({ x: 8.5, y: FLOOR, z: OFF.z0 + 1.35 });
    M(cyl(0.25, 0.25, 0.07, 18), mat("#1c1c1e", { rough: 0.5 }), { y: 0.5 }, chair); M(cyl(0.03, 0.03, 0.45, 8), steelM, { y: 0.26 }, chair); M(rbox(0.42, 0.48, 0.07, 0.05), mat("#1c1c1e", { rough: 0.5 }), { y: 0.86, z: 0.24 }, chair);
    // the wall calendar (east wall): AUGUST, 24 circled, SUN RETURNS · AUG 24 (a plant)
    const calT = K.textTex("i_cal", 512, 640, (q, w, h) => {
      q.fillStyle = "#f6f3ec"; q.fillRect(0, 0, w, h); q.fillStyle = "#24476e"; q.fillRect(0, 0, w, 150);
      q.fillStyle = "#e9eef5"; q.font = "700 30px KitInter, sans-serif"; q.textAlign = "center"; q.fillText("☀", w / 2, 60); q.font = "700 62px KitOswald, sans-serif"; q.fillText("AUGUST", w / 2, 128);
      q.fillStyle = "#24476e"; q.font = "600 20px KitInter, sans-serif"; ["M", "T", "W", "T", "F", "S", "S"].forEach((d, i) => q.fillText(d, 50 + i * 68, 182));
      q.font = "600 26px KitInter, sans-serif"; q.fillStyle = "#2a2a2a";
      for (let d = 1; d <= 31; d++) { const k = d + 3, c = k % 7, r = Math.floor(k / 7); q.fillText(String(d), 50 + c * 68, 230 + r * 66); }
      const k24 = 24 + 3, c24 = k24 % 7, r24 = Math.floor(k24 / 7);
      q.strokeStyle = "#d22a1e"; q.lineWidth = 6; q.beginPath(); q.ellipse(50 + c24 * 68, 221 + r24 * 66, 34, 28, -0.2, 0, 7); q.stroke();
      q.fillStyle = "#d22a1e"; q.font = "700 40px KitOswald, sans-serif"; q.fillText("SUN RETURNS · AUG 24", w / 2, h - 30);
    });
    const cal = M(new T.PlaneGeometry(0.62, 0.78), mat("#ffffff", { map: calT, rough: 0.8 }), { x: 10.25, y: FLOOR + 1.6, z: OFF.z1 - 0.045, ry: 180, cast: false }, off);
    M(sph(0.012, 8, 6), mat("#c8321f"), { x: 10.25, y: FLOOR + 2.01, z: OFF.z1 - 0.05 }, off);
    // shelves of binders on the south wall, a map, an old poster-free corkboard
    { const bc = ["#24476e", "#a83a2a", "#3c6e48", "#c79a2e", "#5a5a64"]; const R = rng(33); for (let s = 0; s < 2; s++) { M(box(1.8, 0.03, 0.3), woodM, { x: 8.6, y: FLOOR + 1.3 + s * 0.42, z: OFF.z1 - 0.18 }, off); for (let k = 0; k < 16; k++) M(box(0.07, 0.3, 0.25), mat(bc[Math.floor(R() * 5)], { rough: 0.6 }), { x: 7.8 + k * 0.1, y: FLOOR + 1.47 + s * 0.42, z: OFF.z1 - 0.18 }, off); } }
    const mapT = K.canvasTex("i_map", 512, 384, (q, w, h) => { q.fillStyle = "#e9edf0"; q.fillRect(0, 0, w, h); q.strokeStyle = "rgba(60,90,130,0.45)"; q.lineWidth = 1.5; for (let i = 0; i < 16; i++) { q.beginPath(); for (let a = 0; a <= 6.3; a += 0.1) { const r = 30 + i * 11 + Math.sin(a * 5 + i) * 6; q.lineTo(w / 2 + Math.cos(a) * r * 1.3, h / 2 + Math.sin(a) * r); } q.stroke(); } q.fillStyle = "#c8321f"; q.beginPath(); q.arc(w / 2 + 20, h / 2 - 10, 6, 0, 7); q.fill(); });
    M(new T.PlaneGeometry(1.1, 0.8), mat("#ffffff", { map: mapT, rough: 0.85 }), { x: OFF.x0 + 0.05, y: FLOOR + 1.65, z: 0.4, ry: 90, cast: false }, off);

    // ---------------------------------------------------------------- module B rooms: freezer, fuel bladders, snow melter
    const rooms = G({});
    M(box(MB.x1 - MB.x0 - 0.4, 0.04, 6.4), floorM, { x: (MB.x0 + MB.x1) / 2, y: FLOOR + 0.02 }, rooms);
    M(box(MB.x1 - MB.x0 - 0.4, 0.04, 6.4), mat("#e3e1da", { rough: 0.9 }), { x: (MB.x0 + MB.x1) / 2, y: CEIL - 0.02 }, rooms);
    for (const x of [20.5, 26.5]) M(box(0.1, CEIL - FLOOR, 6.4), wallM, { x, y: (FLOOR + CEIL) / 2 }, rooms);
    M(box(MB.x1 - MB.x0 - 0.4, CEIL - FLOOR, 0.04), wallM, { x: (MB.x0 + MB.x1) / 2, y: (FLOOR + CEIL) / 2, z: MB.z0 + 0.15 }, rooms);
    M(box(MB.x1 - MB.x0 - 0.4, CEIL - FLOOR, 0.04), wallM, { x: (MB.x0 + MB.x1) / 2, y: (FLOOR + CEIL) / 2, z: MB.z1 - 0.15 }, rooms);
    // galley freezer: stainless double doors against the north wall at x 17.2
    const fz = G({ x: 17.2, y: FLOOR, z: MB.z0 + 0.65 });
    const ssM = mat("#c3c8cc", { metal: 0.45, rough: 0.32, map: K.canvasTex("i_brushed", 128, 128, (q, w, h) => { q.fillStyle = "#b9bec2"; q.fillRect(0, 0, w, h); const R = rng(3); for (let i = 0; i < 400; i++) { q.fillStyle = R() < 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"; q.fillRect(R() * w, 0, 1, h); } }, { repeat: true }) });
    M(box(1.6, 2.1, 0.06), ssM, { y: 1.05, z: -0.42 }, fz); for (const s of [-1, 1]) M(box(0.06, 2.1, 0.9), ssM, { x: s * 0.8, y: 1.05 }, fz); M(box(1.6, 0.06, 0.9), ssM, { y: 2.1 }, fz); M(box(1.6, 0.08, 0.9), ssM, { y: 0.04 }, fz);
    const boxC = ["#e8e3d8", "#9fc2e6", "#e6c28a", "#d9e6ef"];
    { const R = rng(12); for (let s = 0; s < 4; s++) { M(box(1.5, 0.02, 0.8), mat("#dfe6ec", { metal: 0.3, rough: 0.4 }), { y: 0.3 + s * 0.48 }, fz); for (let k = 0; k < 6; k++) M(box(0.22, 0.18 + R() * 0.12, 0.6), mat(boxC[Math.floor(R() * 4)], { rough: 0.8 }), { x: -0.6 + k * 0.24, y: 0.42 + s * 0.48, z: 0.05 }, fz); } }
    const fzDoors = [];
    for (const s of [-1, 1]) { const d = G({ x: s * 0.8, y: 1.05, z: 0.45 }, fz); M(box(0.8, 2.08, 0.07), ssM, { x: -s * 0.4 }, d); M(box(0.03, 0.6, 0.05), mat("#2a2c2e"), { x: -s * 0.72, z: 0.06 }, d); fzDoors.push({ d, s }); }
    const fzL = new T.PointLight("#cfe6ff", 0, 0, 2); fzL.position.set(0, 1.9, 0.0); fz.add(fzL);
    const mistM = new T.ShaderMaterial({ uniforms: { tN: { value: dn }, t: U.t, k: { value: 0 } }, transparent: true, depthWrite: false, side: T.DoubleSide,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D tN; uniform float t, k; varying vec2 vUv; void main(){ float n = texture2D(tN, vec2(vUv.x * 0.8 + t * 0.03, vUv.y * 0.6 + t * 0.12)).r; float a = smoothstep(0.35, 0.85, n) * smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y) * k; gl_FragColor = vec4(vec3(0.9, 0.95, 1.0), a * 0.55); }" });
    const mist = M(new T.PlaneGeometry(2.2, 1.8), mistM, { x: 17.2, y: FLOOR + 0.9, z: MB.z0 + 1.4, cast: false, receive: false, nodepth: true }, rooms); mist.renderOrder = 4;
    // fuel room: four bladders (pillow tanks) in a bund, a stencilled sign
    const fuel = G({ x: 23.5, y: FLOOR, z: 0 });
    { const bl = mat("#2a2c30", { rough: 0.55 }); const pill = new T.SphereGeometry(1, 32, 20); pill.scale(1.25, 0.42, 0.85);
      for (const [x, z] of [[-1.4, -1.5], [1.4, -1.5], [-1.4, 1.2], [1.4, 1.2]]) { M(pill, bl, { x, y: 0.43, z }, fuel); M(box(0.9, 0.25, 0.02), mat("#d96a1e", { rough: 0.6 }), { x, y: 0.5, z: z + 0.84 }, fuel); }
      M(box(5.6, 0.25, 0.08), mat("#c8b030", { rough: 0.6 }), { y: 0.12, z: -2.6 }, fuel); M(box(5.6, 0.25, 0.08), mat("#c8b030", { rough: 0.6 }), { y: 0.12, z: 2.4 }, fuel);
      const sgT = K.textTex("i_fuelsign", 512, 256, (q, w, h) => { q.fillStyle = "#f2c230"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1a1a"; q.font = "700 92px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FUEL", w / 2, 110); q.font = "700 64px KitOswald, sans-serif"; q.fillText("10,000 GAL", w / 2, 200); });
      M(new T.PlaneGeometry(0.9, 0.45), mat("#ffffff", { map: sgT, rough: 0.6 }), { y: 1.9, z: MB.z0 + 0.2, cast: false }, fuel);
      for (let k = 0; k < 3; k++) K.rod([-2.5 + k * 2.5, 0.8, -1.5], [-2.5 + k * 2.5, 2.9, -2.95], 0.04, mat("#8a6a2a", { metal: 0.5, rough: 0.5 }), fuel, 8); }
    const fuelL = new T.PointLight("#ffe2b0", 0, 0, 2); fuelL.position.set(23.5, CEIL - 0.4, 0.3); scene.add(fuelL);
    // snow melter: a stainless tank with an open hatch full of snow, a gauge, pipes
    const melt = G({ x: 29.2, y: FLOOR, z: -0.8 });
    { M(cyl(0.75, 0.75, 1.6, 32), ssM, { y: 0.8 }, melt); M(cyl(0.78, 0.78, 0.06, 32), ssM, { y: 1.62 }, melt); M(cyl(0.55, 0.55, 0.04, 28), mat("#f2f6fa", { rough: 0.9 }), { y: 1.64 }, melt);
      const sn = new T.SphereGeometry(0.5, 20, 12, 0, 6.283, 0, 1.2); sn.scale(1, 0.5, 1); M(sn, mat("#eef3f8", { rough: 0.95 }), { y: 1.58 }, melt);
      const hatch = G({ x: 0, y: 1.66, z: -0.56 }, melt); M(cyl(0.58, 0.58, 0.04, 28), ssM, { rx: -110 }, hatch);
      K.rod([0.7, 0.3, 0], [2.0, 0.3, 0], 0.05, steelM, melt, 8); K.rod([2.0, 0.3, 0], [2.0, 2.6, 0], 0.05, steelM, melt, 8);
      const gT = K.textTex("i_gauge", 128, 128, (q, w, h) => { q.fillStyle = "#f2efe6"; q.beginPath(); q.arc(64, 64, 60, 0, 7); q.fill(); q.strokeStyle = "#222"; q.lineWidth = 4; q.beginPath(); q.moveTo(64, 64); q.lineTo(100, 40); q.stroke(); });
      M(new T.CircleGeometry(0.11, 24), mat("#ffffff", { map: gT }), { x: 0.0, y: 1.0, z: 0.76, cast: false }, melt); M(new T.TorusGeometry(0.115, 0.012, 8, 24), steelM, { y: 1.0, z: 0.76 }, melt); }
    const meltL = new T.PointLight("#e6f0ff", 0, 0, 2); meltL.position.set(29.2, CEIL - 0.4, 0.5); scene.add(meltL);

    // ---------------------------------------------------------------- red eyes on the snow (dim + still, or gathered + blinking)
    const eyeM = glow("#ff2412", 16, { fog: false });
    const eyeG = sph(0.065, 8, 6), eyes = [], eg = G({});
    { const R = rng(4141);
      for (let i = 0; i < 90; i++) {
        const a = R() * Math.PI * 2, r = 24 + R() * 62;           // inside an aerial frame of the station
        const x = 8 + Math.cos(a) * r, z = -2 + Math.sin(a) * r * 0.85;
        const gr = 9 + R() * 12, ga = a + (R() - 0.5) * 0.3;
        const p = G({}, eg); M(eyeG, eyeM, { x: -0.06, cast: false }, p); M(eyeG, eyeM, { x: 0.06, cast: false }, p);
        eyes.push({ p, a: [x, z], b: [8 + Math.cos(ga) * gr * 1.4, -2 + Math.sin(ga) * gr], appear: R(), ph: R() * 10, hy: 1.5 + R() * 0.25 });
      } }
    function placeEyes(t, k, scale, gather, blink, intens) {
      eg.visible = k > 0.001; if (!eg.visible) return;
      eyeM.color.set("#ff2412").multiplyScalar(16 * intens);
      for (const e of eyes) {
        const on = k > e.appear, bl = blink && Math.sin(t * 2.2 + e.ph) > 0.86;
        e.p.visible = on && !bl;
        const x = lerp(e.a[0], e.b[0], gather), z = lerp(e.a[1], e.b[1], gather);
        e.p.position.set(x, iceH(x, z) + e.hy, z); e.p.lookAt(8, e.p.position.y, -2); e.p.scale.setScalar(scale);
      }
    }

    // ---------------------------------------------------------------- per-frame state
    const BALLOON0 = [SHED[0] - 4.6, 0, SHED[2] - 3.8];
    let thKey = "";
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      U.t.value = t; U.aur.value = I("auroraK", 1); U.snow.value = I("snowK", 1);
      snowPts.material.uniforms.cam.value.copy(cam.position);
      // the aurora drives the key light: a slow breathing of its brightness
      const ab = I("auroraK", 1) * (0.85 + 0.15 * Math.sin(t * 0.5) + 0.08 * Math.sin(t * 1.7 + 1));
      K.moon.intensity = I("auroraI", 1.6) * ab;
      winM.color.setScalar(1.0 * I("winK", 1));
      floodL.forEach((L) => (L.intensity = 180 * I("floodI", 1)));
      deskL.intensity = 2.8 * I("deskI", 1); lampBulb.material.color.set("#ffd9a0").multiplyScalar(8 * clamp(I("deskI", 1), 0, 2));
      ceilL.intensity = 4 * I("ceilI", 1);
      fzL.intensity = 3 * I("freezerI", 1); fuelL.intensity = 14 * I("fuelI", 1); meltL.intensity = 6 * I("meltI", 1);
      shed.userData.L.intensity = 6 * I("shedI", 1);
      beacon.visible = Math.sin(t * 3.0) > 0.2 && I("beaconK", 1) > 0;
      // runway lights: `runway` = the fraction still on (they go out one by one from the far end)
      const rw = I("runway", 1);
      runLights.forEach((r) => { const on = r.i / (RUN.n - 1) < rw - 1e-6 || rw >= 0.999; r.l.visible = on; r.halo.visible = on; });
      // the plane: a pair of landing lights far north, approaching with planeT
      plane.visible = I("planeK", 0) > 0.01;
      if (plane.visible) { const pt = I("planeT", 0); plane.position.set(RUN.x - 300 + pt * 40, 420 - pt * 12, -5200 + pt * 160); plane.lookAt(cam.position); plB.visible = Math.sin(t * 7) > 0.6; plHalo.material.opacity = 0.9; }
      // balloon: in her hands (-1) or rising s seconds after release
      const bs = I("balloon", -1);
      if (bs < 0) { bal.position.set(BALLOON0[0], 2.9, BALLOON0[2]); str.scale.y = 0.6; strG.position.set(0, -1.0, 0); sonde.position.set(0, -1.6, 0); }
      else { const rise = 5.2 * bs + 0.6 * bs * bs * 0.1; bal.position.set(BALLOON0[0] - 2.2 * bs, 2.9 + rise, BALLOON0[2] - 1.0 * bs + Math.sin(bs * 0.8) * 0.6); const L = Math.min(18, 0.6 + bs * 9); str.scale.y = L; strG.position.set(0, -1.15, 0); str.position.y = -L / 2; sonde.position.set(Math.sin(bs * 1.3) * 0.3, -1.15 - L - 0.12, 0); }
      bal.visible = I("balloonVis", 1) > 0;
      // thermometer: needle + readout + frost
      const tv = I("thermo", -61);
      needle.rotation.z = -((0.75 + 1.5 * (tv + 80) / 120) * Math.PI - 1.5 * Math.PI);
      if (String(Math.round(tv)) !== thKey) { thKey = String(Math.round(tv)); drawRead(tv); }
      frostM.uniforms.f.value = I("frost", 0.3);
      // phone screen / buzz
      const pk = I("phoneK", 0); phScr.material.color.setScalar(0.1 + 2.2 * pk); ph.position.x = I("phoneBuzz", 0) * Math.sin(t * 90) * 0.003;
      // freezer doors + mist
      const fa = I("freezerA", 0) * D2R; fzDoors.forEach(({ d, s }) => (d.rotation.y = s * fa)); mistM.uniforms.k.value = clamp(I("freezerA", 0) / 90, 0, 1);
      placeEyes(t, I("eyesK", 0), I("eyesScale", 1), I("eyesGather", 0), I("eyesBlink", 0) > 0.5, I("eyesI", 1));
    });

    return { st, off, desk, chair, phone, logbook, cal, lamp, deskL, ceilL, mast, th, needle, cat, shed, bal, runLights, plane, curtains, rooms, fz, fuel, melt, eyes,
      P: { FLOOR, CEIL, MA, MB, OFF, WIN, MAST, RUN, SHED, BALLOON0 }, iceH };
  }

  // ---------------------------------------------------------------- Noor: the Hazel v2 rig re-dressed for the ice
  const NOOR = { jacket: "#b8232a", jacketSheen: "#ff9e92", jacketRough: 0.62, trim: "#5c1216", trimSheen: "#c86a6a", seam: "#7a1a1e", pants: "#1f2228", pantsSheen: "#5a606e",
    boot: "#3c4046", sole: "#1a1b1e", under: "#58606c", hair: "#2c1a12", hairStreaks: ["rgba(16,8,4,0.4)", "rgba(70,44,28,0.35)", "rgba(110,72,46,0.28)"], hairSheen: "#c09070",
    brow: "#24160e", tie: "#3a2a20", lip: "#b8665c", chestPocket: false, pony: { y: 0.03, z: -0.098 } };
  function dressNoor(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, sp = hz.spine, surf = hz.surf;
    // puffer quilting: horizontal baffle seams round the parka
    for (const y of [-0.02, 0.08, 0.18, 0.28]) { const pts = []; for (let a = -3.1; a <= 3.1; a += 0.1) pts.push(surf(y, a, 1.012)); hz.mats && M(K.tubeGeo(pts, 70, 5, () => 0.0035), hz.mats.seamM, { cast: false }, sp); }
    // big chest pocket flaps + a reflective strip on each sleeve
    for (const s of [-1, 1]) { const p = surf(0.3, s * 0.48, 1.03); M(K.rbox(0.09, 0.05, 0.012, 0.01), hz.mats.trim, { x: p[0], y: p[1], z: p[2], ry: s * 24 }, sp); }
    for (const a of hz.arms) M(K.sweepGeo([[-0.13, 0.0505, 0.0525, 0], [-0.11, 0.0505, 0.0525, 0]], 22, { n: 2 }), mat("#d8dde2", { metal: 0.6, rough: 0.25 }), { cast: false }, a.sh);
    // hood down on her back with a fur ruff round the collar
    const furN = K.heightNormal("noor_fur", 128, (x, y) => K.vnoise(x / 2.2, y / 6, 7) * 0.7 + K.hash2(x, y, 2) * 0.5, 3.0);
    const fur = K.pmat("#cdbb9e", { rough: 1.0, sheen: 1.0, sheenColor: "#fff2dc", sheenRough: 0.8, normalMap: K.nmap(furN, 8, 2), ns: 0.9 });
    const furG = new T.TorusGeometry(0.1, 0.028, 14, 48); { const pa = furG.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const n = 1 + (K.vnoise(x * 120, y * 120 + z * 80, 5) - 0.5) * 0.35; pa.setXYZ(i, x * (1 + (n - 1) * 0.3), y * (1 + (n - 1) * 0.3), z * n); } furG.computeVertexNormals(); }
    M(furG, fur, { y: 0.545, z: -0.05, rx: 62, sx: 1.12 }, sp);
    const hoodG = new T.SphereGeometry(0.15, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55); hoodG.scale(1.0, 0.55, 0.8);
    M(hoodG, hz.mats.jacket, { y: 0.47, z: -0.115, rx: -60 }, sp);
    // knit hat over the hair with a ribbed cuff, goggles pushed up on it
    const head = hz.head;
    const ribN = K.heightNormal("noor_rib", 128, (x) => Math.sin((x / 128) * Math.PI * 2 * 16) * 0.5, 2.5);
    const knit = K.pmat("#8a8f98", { rough: 0.95, sheen: 0.6, sheenColor: "#d8dee8", normalMap: K.nmap(ribN, 6, 2), ns: 0.8 });
    const hatG = new T.SphereGeometry(1, 56, 40); {
      const pa = hatG.attributes.position, keep = new Uint8Array(pa.count);
      const line = (az) => { const a = Math.abs(az); return lerp(0.64, 0.05, ss(a / 2.6)); };
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), az = Math.atan2(x, z); keep[i] = y > line(az) ? 1 : 0; const v = 0.085 + 0.012 * Math.sin(az * 14) * ss((y - 0.3) * 2) + 0.02 * ss((y - 0.6) * 3); pa.setXYZ(i, x * 0.1 * 0.92 * (1 + v), y * 0.1 * 1.13 * (1 + v) + 0.004, z * 0.1 * (z < 0 ? 1.12 : 1.0) * (1 + v)); }
      const ix = hatG.index.array, out = []; for (let i = 0; i < ix.length; i += 3) if (keep[ix[i]] && keep[ix[i + 1]] && keep[ix[i + 2]]) out.push(ix[i], ix[i + 1], ix[i + 2]);
      hatG.setIndex(out); hatG.computeVertexNormals(); }
    M(hatG, knit, { y: 0.102 }, head);
    { const pts = []; for (let k = 0; k <= 64; k++) { const az = -Math.PI + (k / 64) * Math.PI * 2, a = Math.abs(az); const yy = lerp(0.64, 0.05, ss(a / 2.6)) + 0.03; const r = Math.sqrt(Math.max(0, 1 - yy * yy)) * 1.075; pts.push([Math.sin(az) * r * 0.1 * 0.92, yy * 0.1 * 1.13 + 0.004, Math.cos(az) * r * 0.1 * (Math.cos(az) < 0 ? 1.12 : 1.0)]); }
      M(K.tubeGeo(pts, 96, 8, () => 0.011, { squash: () => 0.7 }), knit, { y: 0.102 }, head); }
    M(K.sph(0.022, 14, 10), K.pmat("#c8ccd4", { rough: 1, sheen: 1, sheenColor: "#ffffff" }), { y: 0.102 + 0.1 * 1.13 * 1.1 + 0.014, z: -0.012 }, head);   // pompom
    // goggles: a strap round the hat and a wide amber lens on the brow of the hat
    const gg = G({ y: 0.102 + 0.078, z: -0.003, rx: -8 }, head);
    M(new T.TorusGeometry(0.08, 0.0055, 6, 64), mat("#141414", { rough: 0.6 }), { rx: 90, sx: 0.95, sy: 1.05 }, gg);
    const lens = new T.CylinderGeometry(0.084, 0.084, 0.04, 32, 1, true, -0.7, 1.4); lens.rotateY(Math.PI); lens.scale(0.95, 1, 1.05);
    M(lens, mat("#1c1c1e", { rough: 0.5, side: T.DoubleSide }), { z: 0.0, ry: 180 }, gg);
    const lensF = new T.CylinderGeometry(0.088, 0.088, 0.032, 32, 1, true, -0.62, 1.24); lensF.rotateY(Math.PI); lensF.scale(0.95, 1, 1.05);
    M(lensF, new T.MeshPhysicalMaterial({ color: "#ff8a2a", metalness: 0.6, roughness: 0.08, clearcoat: 1, envMapIntensity: 1.8, side: T.DoubleSide }), { ry: 180 }, gg);
    // a plain round shoulder patch (a snowflake, no flag or agency)
    const pt = K.canvasTex("noor_patch", 128, 128, (q, w, h) => { q.fillStyle = "#1f3554"; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.strokeStyle = "#e9eef5"; q.lineWidth = 5; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; q.beginPath(); q.moveTo(64, 64); q.lineTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); q.stroke(); } });
    M(new T.CircleGeometry(0.032, 24), mat("#ffffff", { map: pt, rough: 0.7 }), { x: 0.059, y: -0.08, ry: 90, cast: false }, hz.arms[1].sh);
    // tools: the radio hand mic on a coiled cord (right), a pencil (right), the balloon string (left)
    const mic = new T.Group(); M(K.rbox(0.05, 0.085, 0.035, 0.014), mat("#25282b", { rough: 0.45 }), {}, mic); M(K.box(0.02, 0.02, 0.01), mat("#3a3d42"), { y: 0.02, z: 0.02 }, mic); mic.position.set(0, -0.08, 0.03); hz.tool("handmic", mic, 0);
    const pencil = new T.Group(); M(K.cyl(0.0035, 0.0035, 0.15, 6), mat("#e3b52f", { rough: 0.5 }), { rx: 90 }, pencil); pencil.position.set(0, -0.075, 0.03); hz.tool("pencil", pencil, 0);
    Object.assign(hz.POSES, {
      write: { arms: [[-46, 14, -54], [-40, -12, -52]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [14, 0], curl: [70, 45] },
      phone: { arms: [[-40, 18, -70], [-34, -10, -40]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [10, 0], curl: [70, 60] },
      micsit: { arms: [[-58, 22, -128], [-34, -10, -40]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [6, 0], curl: [85, 60] },
      release: { arms: [[-150, 20, -10], [-150, -20, -10]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-6, 0], curl: [30, 30] },
      hold: { arms: [[-120, 20, -20], [-120, -20, -20]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-2, 0], curl: [80, 80] },
      window: { arms: [[-20, 10, -40], [-20, -10, -40]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [60, 60] },
    });
    return { tools: { mic, pencil } };
  }

  S.ice = ice;
  S.ice.CREATE = CREATE;
  S.ice.NOOR = NOOR;
  S.ice.dressNoor = dressNoor;
})();
