/* Survival-scenario kit · world module "The Space Station" (needs survival-kit.js v2.2).
 * A small fictional orbital station over Earth's night side, its interior, a globe view, and a splashdown sea; seek-safe.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.space.CREATE));
 *   const Sp = SURVIVAL.space(K);
 *   const hz = K.hazel(SURVIVAL.space.INES); const ines = SURVIVAL.space.dressInes(K, hz);
 *   Sp.setSun([x,y,z])                      // the key light's direction (the sun at the limb; the moon in the sea set)
 *   K.render({ …kit state…, set: "orbit" | "in" | "globe" | "sea", sunI, earthI, cityK, redK, cloudK, auroraK,
 *              cabI, growI, consoleI, alarmI, commsK, floodI, winGlow, keyI/keyP/keyT, rimI/rimP/rimT,
 *              cargo:{s, fall}, ringK, ringDraw, dimK, lockA, packT, hatchA, bubbleK, pouch:{p}|null, porthole:{p, look}|null })
 *
 * Units are metres around the station; Earth is a sphere scaled by 1500/408000 (the station flies 1,500 units up, so every
 * angle seen from orbit is right: the limb dips 20° below the horizontal). Earth's surface is procedural (fictional
 * continents, no real geography): night oceans, moonlit clouds, city-light clusters (two scales + street speckle) that
 * can turn red cluster by cluster (`redK`), polar ice with one white light near the south pole that never turns red
 * (the crossover egg), a twilight band, a limb haze, a shell for the airglow line and the sunrise arc. A green aurora
 * hangs below the station (curtains folding with t). The station: a lab module, a forward cupola, a docking adapter, a
 * side port with the return capsule, a truss with four solar wings (they glow amber when backlit by the sun) and
 * radiators. Inside: racks, handrails, the cupola console (altitude screen, comms panel, hand controllers), a laptop
 * with a sticky note, three empty sleeping bags, the lettuce grow box (EXPERIMENT 14), food lockers with packets, the
 * water recycler, the hygiene corner (hose + funnel), the aft docking hatch with its wheel. Globe view: the same Earth
 * small, with a dotted orbit spiralling down. Sea: a night ocean, three parachutes with the capsule, a ship's lights.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const RE = 23400, HE = 1500;                 // scaled Earth radius and the station's altitude (408 km)
  const dirOf = (az, el) => [Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), Math.cos(az * D2R) * Math.cos(el * D2R)];
  const SUN = dirOf(-38, -16.5);                // the sun just above the limb (which dips 20°), ahead and to the right
  const CREATE = {
    moonDir: SUN, moonCol: "#ffd2a6", bg: "#000000", fogCol: "#000000", hemi: ["#04060a", "#1c2c4c"],
    shadow: { half: 26, far: 140, dist: 70, center: [0, 1, -1] },
    sky: { zen: [0.0, 0.0, 0.0], hor: [0.0, 0.0, 0.002] },
    env: { zen: "#000000", hor: "#0a1424", mside: "#7a5030", gnd: "#0b1626" },
    look: { grain: 0.03 },
  };
  const IN = { x: 1.2, y: 1.2, z0: -5.55, z1: 3.55 };   // the lab's clear interior (square tube along z)
  const MODR = 2.1;                                   // the lab module's outer radius
  const CUP = { z: 3.55, r0: 1.0, r1: 0.62, len: 0.82, tilt: 0 };   // the cupola on the forward bulkhead (tilted down)
  const CAPS = { x0: 2.95, z: -2.6 };                 // the side port and the docked return capsule (axis +x)
  const TRUSS = { y: 3.6, z: -1.2, half: 19 };

  // ---------------------------------------------------------------- shared GLSL
  const HASH = `
    float h13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
    vec3 h33(vec3 p3){ p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
    float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float fbm4(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s / 0.9375; }
    float fbm6(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s / 0.984375; }
  `;

  function space(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox, rng = K.rng;
    K.buildSky();
    const U = { t: { value: 0 } };
    const radial = K.canvasTex("sp_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const addSprite = (col, k, s, parent, p) => { const m = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color(col).multiplyScalar(k), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), Object.assign({ s, cast: false, receive: false, nodepth: true }, p || {}), parent); m.userData.bill = true; bills.push(m); return m; };
    const bills = [];
    const SUNV = K.MOON_DIR;   // the kit's key-light direction, mutable per shot (setSun)

    // ================================================================ EARTH (one mesh: orbit scale under the station, or a small globe)
    const earth = G({});
    const eU = { t: U.t, sunO: { value: new T.Vector3() }, camO: { value: new T.Vector3() }, redK: { value: 0 }, cityK: { value: 1 }, cloudK: { value: 1 }, nightK: { value: 1 },
      eggD: { value: new T.Vector3() }, eggK: { value: 1 }, dayK: { value: 1 }, fine: { value: 1 } };
    const earthM = new T.ShaderMaterial({
      uniforms: eU,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float t, redK, cityK, cloudK, nightK, eggK, dayK, fine; uniform vec3 sunO, camO, eggD; varying vec3 vP;
        ${HASH}
        // one layer of city clusters: S cells per unit sphere; light (rgb) and the red fraction (a)
        vec4 cities(vec3 n, float S, float seed, float rmin, float rmax, float bright, float pexist){
          vec3 q = n * S; vec3 c = floor(q); vec3 f = q - c;
          vec3 h = h33(c + seed);
          float ex = step(h13(c + seed + 7.7), pexist);
          vec3 ctr = 0.3 + 0.4 * h;
          float r = mix(rmin, rmax, h13(c + seed + 3.3));
          float d2 = dot(f - ctr, f - ctr);
          float core = exp(-d2 / (r * r * 0.05));
          float spr = exp(-d2 / (r * r));
          float arms = smoothstep(0.42, 0.78, n3(n * S * 6.0 + seed * 3.1)) * smoothstep(0.3, 0.7, n3(n * S * 2.3 + seed));
          float hr = 0.03 + 0.94 * h13(c + seed + 5.1);
          float red = smoothstep(hr, hr + 0.025, redK);
          float flash = exp(-pow((redK - hr - 0.012) / 0.012, 2.0));
          float l = (core * 1.3 + spr * (0.12 + 1.1 * arms)) * ex * bright * (1.0 + 2.5 * flash);
          return vec4(vec3(l), red);
        }
        void main(){
          vec3 n = normalize(vP);
          vec3 V = normalize(camO - vP);
          float mu = max(dot(n, V), 0.0);
          // fictional continents
          float lv = fbm6(n * 1.55 + vec3(3.1, 1.7, 7.3)) + 0.1 * (fbm4(n * 8.0 + 4.0) - 0.5);
          float land = smoothstep(0.462, 0.476, lv);
          float ice = smoothstep(-0.83, -0.89, n.y) + 0.7 * smoothstep(0.9, 0.95, n.y);
          // street-level speckle (antialiased into an average when sub-pixel)
          vec3 qf = n * 9000.0;
          float fw = length(fwidth(qf));
          float sp = smoothstep(0.7, 0.9, h13(floor(qf))) * smoothstep(0.32, 0.1, length(fract(qf) - 0.2 - 0.6 * h33(floor(qf) + 1.7)));
          sp = mix(sp, 0.16, smoothstep(0.35, 1.2, fw * fine));
          vec3 qm = n * 1700.0;
          float fm = length(fwidth(qm));
          float sm = smoothstep(0.55, 0.85, h13(floor(qm) + 4.0)) * smoothstep(0.34, 0.08, length(fract(qm) - 0.2 - 0.6 * h33(floor(qm) + 5.3)));
          sm = mix(sm, 0.22, smoothstep(0.35, 1.2, fm * fine));
          // density of settlement (clustered, more near the coasts)
          float coast = 1.0 - smoothstep(0.0, 0.03, abs(lv - 0.469));
          float dens = smoothstep(0.2, 0.5, fbm4(n * 5.0 + 11.0)) * 1.0 + 0.5 * coast;
          dens *= land * (1.0 - clamp(ice, 0.0, 1.0)) * smoothstep(0.86, 0.7, abs(n.y));
          vec4 A = cities(n, 24.0, 1.0, 0.09, 0.26, 1.0, 0.75);
          vec4 B = cities(n, 76.0, 9.0, 0.06, 0.18, 0.75, 0.65);
          vec4 C = cities(n, 230.0, 17.0, 0.05, 0.14, 0.6, 0.55);
          float tex = (0.2 + 1.6 * sm) * (0.55 + 0.9 * sp);
          float la = A.r * tex, lb = B.r * tex, lc = C.r * tex;
          float ltot = (la + lb + lc + sm * sp * 0.08 * dens) * dens;
          float red = clamp((A.a * la + B.a * lb + C.a * lc) / max(la + lb + lc, 1e-4), 0.0, 1.0);
          vec3 hue = mix(vec3(1.0, 0.56, 0.22), vec3(1.0, 0.84, 0.66), h13(floor(n * 24.0) + 2.0) * 0.6);
          vec3 cityC = mix(hue, vec3(1.0, 0.06, 0.03) * 1.35, red) * ltot * 2.0 * cityK;
          // clouds (moonlit at night, white by day); they dim the lights under them
          float cl = smoothstep(0.52, 0.74, fbm4(n * 4.2 + vec3(0.0, t * 0.0016, 0.0))) * cloudK;
          cityC *= 1.0 - 0.6 * cl;
          // the egg: one small white light on the southern ice that never turns red
          float eg = exp(-(1.0 - dot(n, eggD)) / 5e-6) * eggK;
          // night surface + day side + twilight band
          float sd = dot(n, sunO);
          float day = smoothstep(-0.04, 0.2, sd) * dayK;
          vec3 night = mix(vec3(0.0035, 0.006, 0.014), vec3(0.008, 0.0085, 0.009), land);
          night = mix(night, vec3(0.03, 0.034, 0.045), clamp(ice, 0.0, 1.0));
          night = mix(night, vec3(0.022, 0.026, 0.036), cl * 0.8);
          vec3 dayC = mix(vec3(0.012, 0.04, 0.11), vec3(0.11, 0.1, 0.07), land);
          dayC = mix(dayC, vec3(0.8, 0.82, 0.85), clamp(ice, 0.0, 1.0));
          dayC = mix(dayC, vec3(0.85), cl);
          vec3 col = night * nightK + dayC * day * 2.4 * max(sd, 0.0);
          float twi = exp(-pow((sd + 0.02) / 0.07, 2.0));
          col += vec3(0.5, 0.2, 0.08) * twi * 0.035 * dayK;
          col += cityC * (1.0 - smoothstep(-0.06, 0.08, sd)) + vec3(1.0, 0.98, 0.94) * eg * 4.0;
          // limb haze: blue, brighter toward the sun side
          float rim = pow(1.0 - mu, 4.0);
          float sunSide = clamp(dot(normalize(V - n * dot(V, n) + 1e-4), sunO) * 0.5 + 0.5, 0.0, 1.0);
          col += (vec3(0.006, 0.014, 0.04) + vec3(0.12, 0.2, 0.42) * pow(sunSide, 6.0) * smoothstep(-0.35, 0.05, sd)) * rim;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    earthM.fog = false;
    const earthMesh = M(new T.SphereGeometry(RE, 360, 180), earthM, { cast: false, receive: false }, earth);
    earthMesh.frustumCulled = false;
    // atmosphere shell: the airglow line, the limb haze and the sunrise arc (back faces; the planet occludes the rest)
    const aU = { sunO: eU.sunO, camO: eU.camO, k: { value: 1 }, sunK: { value: 1 } };
    const atmoM = new T.ShaderMaterial({
      uniforms: aU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide, fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 sunO, camO; uniform float k, sunK; varying vec3 vP;
        void main(){
          vec3 D = normalize(vP - camO);
          float tca = dot(-camO, D);
          vec3 cp = camO + D * max(tca, 0.0);
          float hgt = (length(cp) - ${RE.toFixed(1)}) / ${RE.toFixed(1)} * 6371.0;      // km above the surface at the ray's lowest point
          if (hgt < -2.0) discard;
          vec3 cn = normalize(cp);
          float lit = dot(cn, sunO);
          float haze = exp(-max(hgt, 0.0) / 14.0);
          float air = exp(-pow((hgt - 92.0) / 7.0, 2.0));                              // the green airglow line
          float sunA = pow(max(dot(D, sunO), 0.0), 6.0);
          float twi = smoothstep(-0.25, 0.1, lit);
          vec3 c = vec3(0.012, 0.03, 0.085) * haze * 2.2;
          c += vec3(0.12, 0.42, 0.16) * air * 0.16;
          c += mix(vec3(1.0, 0.36, 0.08), vec3(0.25, 0.5, 1.0), smoothstep(0.0, 40.0, hgt)) * exp(-max(hgt, 0.0) / 26.0) * (twi * 0.35 + sunA * 2.6) * sunK;
          c += vec3(1.0, 0.55, 0.2) * sunA * exp(-max(hgt, 0.0) / 9.0) * 2.0 * sunK;
          gl_FragColor = vec4(c * k, 1.0);
        }` });
    const atmo = M(new T.SphereGeometry(RE * 1.034, 240, 120), atmoM, { cast: false, receive: false, nodepth: true }, earth);
    atmo.frustumCulled = false; atmo.renderOrder = -6;
    const EGG = (() => { const la = -79.5 * D2R, lo = 142 * D2R; return new T.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)); })();
    eU.eggD.value.copy(EGG);

    // the orbit spiral (globe view): dotted, from the station's orbit down into the atmosphere
    const ring = G({}, earth);
    const NR = 2600, rp = new Float32Array(NR * 3), rs = new Float32Array(NR);
    { const inc = 51.6 * D2R; for (let i = 0; i < NR; i++) { const s = i / (NR - 1), a = s * Math.PI * 2 * 2.4, r = RE * (1.22 - 0.225 * Math.pow(s, 1.15));
      const x = Math.cos(a) * r, z0 = Math.sin(a) * r; rp[i * 3] = x; rp[i * 3 + 1] = z0 * Math.sin(inc); rp[i * 3 + 2] = z0 * Math.cos(inc); rs[i] = s; } }
    const rg = new T.BufferGeometry(); rg.setAttribute("position", new T.BufferAttribute(rp, 3)); rg.setAttribute("aS", new T.BufferAttribute(rs, 1));
    const ringU = { t: U.t, k: { value: 0 }, draw: { value: 1 }, px: { value: 5 } };
    const ringPts = new T.Points(rg, new T.ShaderMaterial({ uniforms: ringU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: `uniform float t, k, draw, px; attribute float aS; varying float vA; varying vec3 vC;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          float on = step(mod(aS * 2600.0, 9.0), 4.2) * step(aS, draw);
          float flow = 0.65 + 0.35 * sin((aS * 60.0 - t * 1.4) * 6.2832);
          vA = k * on * flow * (1.0 - 0.45 * aS); vC = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.35, 0.22), smoothstep(0.35, 1.0, aS));
          gl_PointSize = px; }`,
      fragmentShader: "varying float vA; varying vec3 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.2, length(c)) * vA; gl_FragColor = vec4(vC * a * 1.6, a); }" }));
    ringPts.frustumCulled = false; ring.add(ringPts); K.noDepth.push(ringPts);
    const speck = addSprite("#ffffff", 3.0, 1, ring, {});
    const speckCore = M(sph(1, 10, 8), glow("#ffffff", 6, { fog: false }), { cast: false, receive: false }, ring);

    // ================================================================ AURORA (world space, below the station; seen from above)
    const aurU = { t: U.t, k: { value: 1 } };
    const aurM = new T.ShaderMaterial({ uniforms: aurU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false,
      vertexShader: `uniform float t; attribute float aU; attribute float aV; attribute vec3 aF; attribute float aSeed; varying float vU, vV, vSeed;
        void main(){ vU = aU; vV = aV; vSeed = aSeed; vec3 p = position;
          float fold = sin(aU * 22.0 + t * 0.32 + aSeed) * 0.55 + sin(aU * 47.0 - t * 0.6 + aSeed * 2.0) * 0.25 + sin(aU * 8.0 + t * 0.14) * 0.9;
          p += aF * fold * 45.0 * (0.5 + 0.5 * aV);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float t, k; varying float vU, vV, vSeed;
        float hh(float x){ return fract(sin(x * 127.1 + vSeed) * 43758.5453); }
        float n1(float x){ float i = floor(x), f = fract(x); return mix(hh(i), hh(i + 1.0), f * f * (3.0 - 2.0 * f)); }
        void main(){
          float x = vU * 420.0, v = vV;
          float rays = 0.68 + 0.32 * n1(x + t * 0.8) * n1(x * 0.37 - t * 0.35 + 7.0);
          rays *= 0.8 + 0.2 * n1(x * 3.1 + t * 2.0);
          float hem = smoothstep(0.0, 0.04, v) * exp(-v * 3.0);
          float fringe = smoothstep(0.0, 0.012, v) * exp(-v * 22.0);
          float top = smoothstep(1.0, 0.5, v);
          float edge = smoothstep(0.0, 0.1, vU) * smoothstep(1.0, 0.9, vU);
          float seg = 0.15 + 0.85 * smoothstep(0.2, 0.6, n1(vU * 16.0 + vSeed * 3.0 + t * 0.05));
          vec3 c = mix(vec3(0.15, 1.0, 0.42), vec3(0.08, 0.7, 0.5), smoothstep(0.1, 0.5, v));
          c = mix(c, vec3(0.75, 0.15, 0.45), smoothstep(0.45, 0.95, v));
          c = mix(c, vec3(0.7, 1.0, 0.75), clamp(fringe, 0.0, 1.0) * 0.5);
          float a = (hem * 1.0 + fringe * 1.3 + 0.18 * top * smoothstep(0.0, 0.25, v)) * rays * edge * seg * k * 0.55;
          gl_FragColor = vec4(c * a, a);
        }` });
    const aurora = G({});
    const EC = new T.Vector3(0, -(RE + HE), 0);
    function surfDir(fwd, lat) {   // a direction from Earth's centre: fwd/lat in degrees of arc ahead (+z) / to the side (+x) of the nadir
      const a = fwd * D2R, b = lat * D2R; return new T.Vector3(Math.sin(b), Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b)).normalize();
    }
    function curtain(pathFn, seed, n) {
      const rows = 6, P = [], AU = [], AV = [], AF = [], AS = [], I = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, [f, l] = pathFn(u), [f2, l2] = pathFn(Math.min(1, u + 0.002)), d = surfDir(f, l), d2 = surfDir(f2, l2);
        const tg = d2.clone().sub(d).normalize(), fn = new T.Vector3().crossVectors(d, tg).normalize();
        for (let r = 0; r <= rows; r++) { const v = r / rows, rad = RE + lerp(370, 780, v); const p = d.clone().multiplyScalar(rad).add(EC); P.push(p.x, p.y, p.z); AU.push(u); AV.push(v); AF.push(fn.x, fn.y, fn.z); AS.push(seed); }
      }
      for (let i = 0; i < n; i++) for (let r = 0; r < rows; r++) { const k = i * (rows + 1) + r, k2 = k + rows + 1; I.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(P, 3)); g.setAttribute("aU", new T.Float32BufferAttribute(AU, 1)); g.setAttribute("aV", new T.Float32BufferAttribute(AV, 1));
      g.setAttribute("aF", new T.Float32BufferAttribute(AF, 3)); g.setAttribute("aSeed", new T.Float32BufferAttribute(AS, 1)); g.setIndex(I);
      const m = new T.Mesh(g, aurM); m.frustumCulled = false; m.renderOrder = -5; aurora.add(m); K.noDepth.push(m); return m;
    }
    curtain((u) => [7.0 + 1.3 * Math.sin(u * 7.0 + 0.4) + 0.5 * Math.sin(u * 17 + 1), lerp(-14, 14, u)], 1.3, 260);
    curtain((u) => [11.0 + 1.2 * Math.sin(u * 5.0 + 2.1) + 0.5 * Math.sin(u * 13 + 3), lerp(-20, 18, u)], 4.1, 260);
    curtain((u) => [lerp(-12, 10, u), -8.5 + 1.1 * Math.sin(u * 6.0 + 1.0)], 7.7, 240);
    curtain((u) => [-9.0 + 1.2 * Math.sin(u * 6.5 + 0.7), lerp(-14, 16, u)], 2.9, 240);
    curtain((u) => { const sx = lerp(-9, 9, u), m = 0.9 * Math.sin(u * 8.0 + 0.3); return [-4.8 + 0.707 * sx - 0.707 * m, 4.8 + 0.707 * sx + 0.707 * m]; }, 5.3, 240);
    curtain((u) => { const sx = lerp(-5.5, 5.5, u), m = 0.55 * Math.sin(u * 7.0 + 1.1) + 0.2 * Math.sin(u * 19.0); return [-2.6 + 0.64 * sx - 0.77 * m, 2.2 + 0.77 * sx + 0.64 * m]; }, 6.1, 220);

    // the sun: a disc + glare + a thin horizontal streak (depth-tested, so the limb hides it)
    const sunG = G({});
    const sunDisc = M(new T.CircleGeometry(1, 40), new T.MeshBasicMaterial({ color: new T.Color("#fff3dc").multiplyScalar(30), fog: false }), { cast: false, receive: false, nodepth: true }, sunG);
    const sunGlare = addSprite("#ffc98a", 3.5, 1, sunG, {});
    const sunGlare2 = addSprite("#ff9a50", 0.45, 1, sunG, {});
    const streakT = K.canvasTex("sp_streak", 256, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; const g2 = g.createLinearGradient(0, 0, 0, h); g.fillRect(0, 0, w, h); g.globalCompositeOperation = "destination-in"; g2.addColorStop(0, "rgba(0,0,0,0)"); g2.addColorStop(0.5, "rgba(0,0,0,1)"); g2.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = g2; g.fillRect(0, 0, w, h); });
    const sunStreak = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: streakT, color: new T.Color("#ffd2a0").multiplyScalar(1.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { cast: false, receive: false, nodepth: true }, sunG);
    [sunDisc, sunStreak].forEach((m) => (m.renderOrder = -4));

    // ================================================================ STATION EXTERIOR
    const stn = G({});
    const mli = K.canvasTex("sp_mli", 512, 512, (g, w, h) => {
      g.fillStyle = "#dcd7cb"; g.fillRect(0, 0, w, h);
      const R = rng(5);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const c = 205 + Math.floor(R() * 26); g.fillStyle = `rgb(${c},${c - 4},${c - 14})`; g.fillRect(x * 128 + 3, y * 128 + 3, 122, 122);
        g.fillStyle = "rgba(0,0,0,0.06)"; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(x * 128 + 64 + (R() - 0.5) * 70, y * 128 + 64 + (R() - 0.5) * 70, 10 + R() * 30, 4 + R() * 10, R() * 3, 0, 7); g.fill(); } }
      g.fillStyle = "rgba(60,55,45,0.45)"; for (let k = 0; k <= 4; k++) { g.fillRect(k * 128 - 2, 0, 4, h); g.fillRect(0, k * 128 - 2, w, 4); }
      g.fillStyle = "rgba(90,80,60,0.5)"; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) for (let k = 0; k < 6; k++) { g.fillRect(x * 128 + 10 + k * 21, y * 128 + 10, 2, 2); g.fillRect(x * 128 + 10 + k * 21, y * 128 + 116, 2, 2); }
    }, { repeat: true });
    const mliN = K.heightNormal("sp_mliN", 256, (x, y) => { const fx = (x % 64) / 64, fy = (y % 64) / 64; return Math.sin(Math.PI * fx) * Math.sin(Math.PI * fy) * 0.8 + K.vnoise(x / 9, y / 9, 3) * 0.35; }, 2.0);
    const hullM = new T.MeshStandardMaterial({ map: mli, normalMap: mliN, roughness: 0.78, metalness: 0.05, envMapIntensity: 0.8 });
    hullM.normalScale.set(0.6, 0.6); mli.repeat.set(6, 3); mliN.repeat.set(6, 3);
    const alu = mat("#a6abb1", { metal: 0.45, rough: 0.38 }), aluD = mat("#5d6168", { metal: 0.4, rough: 0.5 }), white = mat("#e4e2dc", { rough: 0.55 }), dark = mat("#22252a", { rough: 0.6 });
    const gold = mat("#b8913e", { metal: 0.45, rough: 0.35 }), railM = mat("#c9a23e", { metal: 0.35, rough: 0.45 });
    // lab module (axis z)
    const modG = new T.CylinderGeometry(MODR, MODR, IN.z1 - IN.z0 + 0.5, 48, 1, true); modG.rotateX(Math.PI / 2);
    M(modG, hullM, { z: (IN.z0 + IN.z1) / 2, cast: true }, stn);
    for (let z = IN.z0 + 0.3; z < IN.z1; z += 1.55) M(new T.TorusGeometry(MODR + 0.015, 0.035, 6, 48), alu, { z }, stn);
    for (const a of [0.6, 2.2, 3.9, 5.3]) { const pts = []; for (let z = IN.z0; z <= IN.z1; z += 0.6) pts.push([Math.cos(a) * (MODR + 0.09), Math.sin(a) * (MODR + 0.09), z]); for (const p of pts) M(box(0.04, 0.04, 0.12), railM, { x: p[0], y: p[1], z: p[2] }, stn); K.rod(pts[0], pts[pts.length - 1], 0.018, railM, stn, 6); }
    // forward bulkhead + cupola
    const fwd = new T.RingGeometry(1.02, MODR, 48); M(fwd, hullM, { z: IN.z1 + 0.25, cast: true }, stn);
    M(new T.TorusGeometry(MODR, 0.07, 8, 48), alu, { z: IN.z1 + 0.25 }, stn);
    const cupG = G({ z: IN.z1 + 0.25, rx: CUP.tilt }, stn);
    const glassM = new T.MeshPhysicalMaterial({ color: "#9ab4c8", roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.1, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide });
    const cupFrame = mat("#c9ccd1", { metal: 0.35, rough: 0.4 });
    { const r0 = CUP.r0, r1 = CUP.r1, L = CUP.len;
      for (let k = 0; k < 6; k++) {
        const a0 = (k / 6) * Math.PI * 2, a1 = ((k + 1) / 6) * Math.PI * 2;
        const p = (a, r, z) => new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
        const A = p(a0, r0, 0), B = p(a1, r0, 0), C = p(a1, r1, L), D = p(a0, r1, L);
        // window glass (inset trapezoid) + frame bars along the edges
        const inset = (P, Q, u) => P.clone().lerp(Q, u);
        const cA = inset(A, C, 0.12), cB = inset(B, D, 0.12), cC = inset(C, A, 0.12), cD = inset(D, B, 0.12);
        const gg = new T.BufferGeometry().setFromPoints([cA, cB, cC, cA, cC, cD]); gg.computeVertexNormals();
        const gm = M(gg, glassM, { cast: false, receive: false, nodepth: true }, cupG); gm.renderOrder = 3;
        // the solid frame around the pane (four quads between the outer edge and the inset)
        const quad = (a, b, c, d) => { const q = new T.BufferGeometry().setFromPoints([a, b, c, a, c, d]); q.computeVertexNormals(); M(q, cupFrame, { cast: true }, cupG); const q2 = new T.BufferGeometry().setFromPoints([a, c, b, a, d, c]); q2.computeVertexNormals(); M(q2, cupFrame, { cast: false }, cupG); };
        quad(A, B, cB, cA); quad(B, C, cC, cB); quad(C, D, cD, cC); quad(D, A, cA, cD);
        K.rod(A.toArray(), D.toArray(), 0.03, cupFrame, cupG, 6);
      }
      // front round window
      M(new T.CircleGeometry(r1 * 0.78, 40), glassM, { z: L, cast: false, receive: false, nodepth: true }, cupG).renderOrder = 3;
      M(new T.RingGeometry(r1 * 0.78, r1 * 1.02, 40), cupFrame, { z: L, cast: true }, cupG);
      M(new T.TorusGeometry(r1, 0.05, 8, 40), cupFrame, { z: L }, cupG);
      M(new T.TorusGeometry(r0, 0.06, 8, 40), cupFrame, { z: 0.02 }, cupG);
      // open shutters (petals folded back) + handrails
      for (let k = 0; k < 6; k++) { const a = ((k + 0.5) / 6) * Math.PI * 2; M(box(0.5, 0.04, 0.55), alu, { x: Math.cos(a) * (r0 + 0.32), y: Math.sin(a) * (r0 + 0.32), z: 0.2, rz: a / D2R + 90, rx: 0 }, cupG).rotation.set(0, 0, a + Math.PI / 2); }
    }
    // aft docking adapter + port
    const aftG = new T.CylinderGeometry(0.85, MODR, 1.4, 40, 1, true); aftG.rotateX(-Math.PI / 2);
    M(aftG, hullM, { z: IN.z0 - 0.95 }, stn);
    M(cyl(0.85, 0.85, 0.7, 32), alu, { z: IN.z0 - 1.95, rx: 90 }, stn);
    M(new T.TorusGeometry(0.86, 0.08, 10, 40), aluD, { z: IN.z0 - 2.3 }, stn);
    M(new T.CircleGeometry(0.78, 32), dark, { z: IN.z0 - 2.31, ry: 180 }, stn);
    const tgtT = K.canvasTex("sp_target", 128, 128, (g, w, h) => { g.fillStyle = "#111"; g.fillRect(0, 0, w, h); g.strokeStyle = "#ddd"; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.stroke(); g.fillStyle = "#ddd"; g.fillRect(60, 14, 8, 100); g.fillRect(14, 60, 100, 8); });
    M(new T.PlaneGeometry(0.5, 0.5), mat("#ffffff", { map: tgtT, rough: 0.6 }), { x: 1.1, y: 0.9, z: IN.z0 - 1.6, ry: 180 }, stn);
    // side port + the docked return capsule (axis +x): docking cone, white body with windows, black heat shield, trunk
    const capsule = G({ x: -CAPS.x0, z: CAPS.z, ry: 180 }, stn);
    { M(cyl(0.72, 0.72, 0.9, 32), alu, { x: -0.4, rz: 90 }, capsule);
      M(new T.TorusGeometry(0.7, 0.07, 10, 32), aluD, { x: 0.08, ry: 90 }, capsule);
      const cone = new T.CylinderGeometry(0.62, 1.55, 2.4, 48, 1, true); cone.rotateZ(-Math.PI / 2);
      const capM = new T.MeshPhysicalMaterial({ color: "#eceae4", roughness: 0.45, clearcoat: 0.4, envMapIntensity: 0.9 });
      M(cone, capM, { x: 1.35 }, capsule);
      M(cyl(0.62, 0.62, 0.12, 32), capM, { x: 0.16, rz: 90 }, capsule);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6; M(rbox(0.3, 0.22, 0.04, 0.06), new T.MeshPhysicalMaterial({ color: "#16202c", roughness: 0.05, metalness: 0.3, clearcoat: 1 }), { x: 0.95, y: Math.cos(a) * 0.93, z: Math.sin(a) * 0.93, rx: -a / D2R + 90, ry: 0, rz: -20 }, capsule); }
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 1.35; M(box(0.12, 0.12, 0.08), dark, { x: 0.65, y: Math.cos(a) * 0.76, z: Math.sin(a) * 0.76 }, capsule); }
      M(cyl(1.58, 1.58, 0.16, 48), mat("#1a1816", { rough: 0.7 }), { x: 2.62, rz: 90 }, capsule);          // heat shield
      M(cyl(1.5, 1.5, 1.7, 48, 1, true), mat("#d2d0ca", { rough: 0.6 }), { x: 3.55, rz: 90 }, capsule);       // trunk
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; M(box(1.5, 0.02, 0.5), mat("#1b2a48", { metal: 0.4, rough: 0.3 }), { x: 3.55, y: Math.cos(a) * 1.515, z: Math.sin(a) * 1.515, rx: -a / D2R }, capsule); }
    }
    // truss + struts
    const truss = G({ y: TRUSS.y, z: TRUSS.z }, stn);
    { const h = 0.55, L = TRUSS.half; for (const [y, z] of [[-h, -h], [-h, h], [h, -h], [h, h]]) K.rod([-L, y, z], [L, y, z], 0.045, alu, truss, 8);
      for (let x = -L; x <= L + 1e-6; x += 1.1) { for (const [a, b] of [[[-h, -h], [h, -h]], [[h, -h], [h, h]], [[h, h], [-h, h]], [[-h, h], [-h, -h]]]) K.rod([x, a[0], a[1]], [x, b[0], b[1]], 0.025, alu, truss, 4); }
      for (let x = -L; x < L - 1e-6; x += 1.1) { K.rod([x, -h, -h], [x + 1.1, h, -h], 0.018, aluD, truss, 4); K.rod([x, -h, h], [x + 1.1, h, h], 0.018, aluD, truss, 4); K.rod([x, h, -h], [x + 1.1, h, h], 0.018, aluD, truss, 4); }
      M(box(3.2, 1.0, 1.0), white, { x: 0 }, truss);
      K.rod([0.8, -0.5, 0], [0.8, -(TRUSS.y - MODR) - 0.45, 0], 0.09, alu, truss, 10); K.rod([-0.8, -0.5, 0], [-0.8, -(TRUSS.y - MODR) - 0.45, 0], 0.09, alu, truss, 10); }
    // radiators: white panels hanging below/behind the truss
    for (const s of [-1, 1]) { const rd = G({ x: s * 6.5, y: TRUSS.y - 0.6, z: TRUSS.z - 0.2, rx: -38 }, stn); for (let k = 0; k < 4; k++) M(box(2.6, 0.06, 1.25), white, { y: 0, z: -0.7 - k * 1.32 }, rd); K.rod([0, 0, 0], [0, 0, -6.0], 0.04, alu, rd, 6); }
    // solar wings: at each truss end two long blankets, rotated (about x) to face the sun; backlit, their cells glow amber
    const cellT = K.canvasTex("sp_cells", 256, 1024, (g, w, h) => { g.fillStyle = "#121a30"; g.fillRect(0, 0, w, h); const R = rng(9);
      for (let y = 0; y < 64; y++) for (let x = 0; x < 8; x++) { const c = 22 + Math.floor(R() * 10); g.fillStyle = `rgb(${c},${c + 10},${c + 34})`; g.fillRect(x * 32 + 2, y * 16 + 1, 28, 14); }
      g.fillStyle = "#8f8a7a"; for (let y = 0; y < 1024; y += 128) g.fillRect(0, y, w, 3); g.fillRect(126, 0, 4, h); });
    const glowT = K.canvasTex("sp_cellglow", 256, 1024, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffffff"; for (let y = 0; y < 64; y++) g.fillRect(0, y * 16, w, 1.5); for (let x = 0; x <= 8; x++) g.fillRect(x * 32, 0, 2, h); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, w, h); });
    const wingM = new T.MeshStandardMaterial({ map: cellT, roughness: 0.3, metalness: 0.4, emissiveMap: glowT, emissive: new T.Color("#ffa040"), emissiveIntensity: 0, side: T.DoubleSide, envMapIntensity: 1.2 });
    const wings = [];
    const sunYZ = Math.atan2(-SUN[1], SUN[2]);   // the wing tilt about x so the blanket faces the sun
    for (const s of [-1, 1]) {
      const wg = G({ x: s * (TRUSS.half - 1.6), y: TRUSS.y, z: TRUSS.z }, stn);
      const rot = G({ rx: -sunYZ / D2R }, wg);
      for (const d of [-1, 1]) { const wing = M(new T.PlaneGeometry(3.4, 13.5), wingM, { y: d * 7.6, cast: true }, rot); wings.push(wing); M(box(3.5, 0.08, 0.08), gold, { y: d * 0.85 }, rot); M(box(3.5, 0.08, 0.08), gold, { y: d * 14.35 }, rot); K.rod([0, d * 0.4, 0], [0, d * 14.4, 0], 0.035, gold, rot, 6); }
      M(cyl(0.3, 0.3, 0.9, 16), alu, { rz: 90 }, wg);
    }
    // exterior lights: floods on the aft port and the capsule, nav lights, the cupola glow
    const floods = [];
    for (const [p, tgt] of [[[1.6, 1.9, IN.z0 - 0.4], [0, 0, IN.z0 - 2.4]], [[-1.9, 1.8, CAPS.z + 1.5], [-CAPS.x0 - 1.6, 0, CAPS.z]], [[-1.5, 2.0, 1.5], [0, 0, IN.z1 + 0.8]]]) {
      M(box(0.18, 0.12, 0.12), dark, { x: p[0], y: p[1], z: p[2] }, stn);
      const L = new T.SpotLight("#e8f0ff", 0, 18, 42 * D2R, 0.7, 1.5); L.position.fromArray(p); L.target.position.fromArray(tgt); stn.add(L, L.target); floods.push(L);
    }
    const navR = M(sph(0.06, 8, 6), glow("#ff2a1a", 18, { fog: false }), { x: -TRUSS.half, y: TRUSS.y, z: TRUSS.z, cast: false }, stn);
    const navG = M(sph(0.06, 8, 6), glow("#2aff6a", 18, { fog: false }), { x: TRUSS.half, y: TRUSS.y, z: TRUSS.z, cast: false }, stn);
    const strobe = M(sph(0.07, 8, 6), glow("#ffffff", 30, { fog: false }), { x: 0, y: TRUSS.y + 0.6, z: TRUSS.z, cast: false }, stn);
    const extFill = new T.DirectionalLight("#9fb4e8", 0); extFill.position.set(-0.5, 0.6, -0.6); scene.add(extFill);
    const cupGlow = new T.PointLight("#ffd9b0", 0, 7, 2); cupGlow.position.set(0, 1.0, IN.z1 - 0.2); stn.add(cupGlow);

    // ================================================================ INTERIOR (the lab, along z; the cupola at the forward end)
    const inr = G({});
    const rackT = K.canvasTex("sp_rack", 512, 512, (g, w, h) => {
      g.fillStyle = "#d8d3c6"; g.fillRect(0, 0, w, h); const R = rng(41);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) { const c = 206 + Math.floor(R() * 20); g.fillStyle = `rgb(${c},${c - 4},${c - 12})`; g.fillRect(x * 256 + 4, y * 128 + 4, 248, 120);
        g.fillStyle = "rgba(0,0,0,0.35)"; for (const [fx, fy] of [[14, 14], [238, 14], [14, 112], [238, 112]]) { g.beginPath(); g.arc(x * 256 + fx, y * 128 + fy, 3, 0, 7); g.fill(); }
        if (R() < 0.6) { g.fillStyle = "rgba(40,40,40,0.55)"; g.fillRect(x * 256 + 24, y * 128 + 24, 40 + R() * 60, 7); g.fillRect(x * 256 + 24, y * 128 + 36, 30 + R() * 40, 5); }
        if (R() < 0.35) { g.fillStyle = R() < 0.5 ? "rgba(220,170,40,0.85)" : "rgba(60,110,190,0.8)"; g.fillRect(x * 256 + 180, y * 128 + 70, 40, 28); } }
      g.fillStyle = "rgba(0,0,0,0.3)"; for (let k = 0; k <= 2; k++) g.fillRect(k * 256 - 2, 0, 4, h); for (let k = 0; k <= 4; k++) g.fillRect(0, k * 128 - 2, w, 4);
    }, { repeat: true });
    const rackM = new T.MeshStandardMaterial({ map: rackT, roughness: 0.72, metalness: 0.02, envMapIntensity: 0.25 });
    rackT.repeat.set(4, 1.2);
    const wallLen = IN.z1 - IN.z0;
    const wall = (w, h, p, r) => M(new T.PlaneGeometry(w, h), rackM, Object.assign({ cast: false }, p), inr);
    wall(wallLen, 2 * IN.y, { x: IN.x, z: (IN.z0 + IN.z1) / 2, ry: -90 });
    wall(wallLen, 2 * IN.y, { x: -IN.x, z: (IN.z0 + IN.z1) / 2, ry: 90 });
    const rackT2 = rackT.clone(); rackT2.needsUpdate = true; rackT2.repeat.set(1.05, 4); const rackM2 = rackM.clone(); rackM2.map = rackT2;
    M(new T.PlaneGeometry(2 * IN.x, wallLen), rackM2, { y: IN.y, z: (IN.z0 + IN.z1) / 2, rx: 90, cast: false }, inr);
    M(new T.PlaneGeometry(2 * IN.x, wallLen), rackM2, { y: -IN.y, z: (IN.z0 + IN.z1) / 2, rx: -90, cast: false }, inr);
    // forward wall with the cupola opening; aft wall with the docking hatch
    { const sh = new T.Shape(); sh.moveTo(-IN.x, -IN.y); sh.lineTo(IN.x, -IN.y); sh.lineTo(IN.x, IN.y); sh.lineTo(-IN.x, IN.y); sh.lineTo(-IN.x, -IN.y);
      const hole = new T.Path(); hole.absarc(0, 0, 0.98, 0, Math.PI * 2, true); sh.holes.push(hole);
      M(new T.ShapeGeometry(sh, 32), mat("#cfcabd", { rough: 0.7 }), { z: IN.z1, ry: 180, cast: false }, inr);
      M(new T.TorusGeometry(0.98, 0.05, 8, 40), cupFrame, { z: IN.z1 - 0.02 }, inr);
      const sh2 = new T.Shape(); sh2.moveTo(-IN.x, -IN.y); sh2.lineTo(IN.x, -IN.y); sh2.lineTo(IN.x, IN.y); sh2.lineTo(-IN.x, IN.y); sh2.lineTo(-IN.x, -IN.y);
      M(new T.ShapeGeometry(sh2), mat("#cfcabd", { rough: 0.7 }), { z: IN.z0, cast: false }, inr);
      // the cupola's inner tunnel (between the wall opening and the cupola base)
      const tun = new T.CylinderGeometry(0.99, 0.99, 0.32, 40, 1, true); tun.rotateX(Math.PI / 2);
      M(tun, mat("#bfc3c8", { rough: 0.6, side: T.BackSide }), { z: IN.z1 + 0.15, cast: false }, inr);
    }
    // handrails along the walls, ceiling LED strips, cable runs, cargo bags
    const hr = mat("#5a79a8", { rough: 0.45, metal: 0.2 });
    for (const [x, y] of [[IN.x - 0.06, 0.55], [IN.x - 0.06, -0.55], [-IN.x + 0.06, 0.55], [-IN.x + 0.06, -0.55]]) K.rod([x, y, IN.z0 + 0.3], [x, y, IN.z1 - 0.3], 0.016, hr, inr, 8);
    for (let z = IN.z0 + 0.5; z < IN.z1; z += 1.0) for (const [x, y] of [[IN.x - 0.06, 0.55], [IN.x - 0.06, -0.55], [-IN.x + 0.06, 0.55], [-IN.x + 0.06, -0.55]]) M(box(0.05, 0.05, 0.05), hr, { x, y, z }, inr);
    const ledM = glow("#fff2e0", 0.85);
    for (const x of [-0.62, 0.62]) M(box(0.18, 0.02, wallLen - 0.6), ledM, { x, y: IN.y - 0.012, z: (IN.z0 + IN.z1) / 2, cast: false }, inr);
    const cabL = [];
    for (const z of [IN.z0 + 1.2, (IN.z0 + IN.z1) / 2, IN.z1 - 1.0]) { const L = new T.PointLight("#f6f2ea", 0, 6, 2); L.position.set(0, IN.y - 0.25, z); inr.add(L); cabL.push(L); }
    { const R = rng(71); const bagM = [mat("#cdbf9e", { rough: 0.9 }), mat("#d9d2c0", { rough: 0.9 }), mat("#b9ae92", { rough: 0.9 })];
      for (let i = 0; i < 12; i++) { const side = i % 4; const z = IN.z0 + 0.8 + (i * 0.73) % (wallLen - 1.6);
        if (z > -0.9 && z < 0.4 && side === 1) continue;
        const wq = 0.38 + R() * 0.2, hq = 0.24 + R() * 0.14, dq = 0.22 + R() * 0.1;
        const p = side === 0 ? { x: IN.x - dq / 2 - 0.01, y: 0.85 + R() * 0.15 } : side === 1 ? { x: -IN.x + dq / 2 + 0.01, y: 0.85 + R() * 0.15 } : side === 2 ? { y: IN.y - dq / 2 - 0.01, x: -0.85 } : { y: IN.y - dq / 2 - 0.01, x: 0.88 };
        if (side === 3 && z > 1.2) continue;
        M(rbox(wq, hq, dq, 0.06), bagM[i % 3], Object.assign({ z, ry: side < 2 ? 90 : 0, rx: side >= 2 ? 90 : 0 }, p), inr); } }
    for (const [x, y] of [[IN.x - 0.03, 1.05], [-IN.x + 0.03, -1.05], [0.9, IN.y - 0.03]]) K.rod([x, y, IN.z0 + 0.2], [x, y, IN.z1 - 0.2], 0.018, mat("#2a2c30", { rough: 0.6 }), inr, 6);

    // ---- the cupola console: two screens (altitude + orbit track), the comms panel, hand controllers
    const cons = G({ x: 0, y: -0.78, z: IN.z1 - 0.22, ry: 180, rx: 40 }, inr);
    M(rbox(1.3, 0.5, 0.12, 0.03), mat("#3a3e45", { rough: 0.5 }), {}, cons);
    const altT = K.textTex("sp_alt", 512, 320, (q, w, h) => { q.fillStyle = "#06121a"; q.fillRect(0, 0, w, h); q.strokeStyle = "rgba(120,200,255,0.25)"; q.lineWidth = 1;
      for (let k = 1; k < 8; k++) { q.beginPath(); q.moveTo(0, k * 40); q.lineTo(w, k * 40); q.stroke(); }
      q.fillStyle = "#8fd8ff"; q.font = "600 30px KitInter, sans-serif"; q.fillText("ORBIT · ALTITUDE", 24, 48);
      q.fillStyle = "#e9f6ff"; q.font = "700 132px KitOswald, sans-serif"; q.fillText("408.0", 24, 200); q.font = "700 54px KitOswald, sans-serif"; q.fillStyle = "#8fd8ff"; q.fillText("km", 372, 200);
      q.strokeStyle = "#5fd0ff"; q.lineWidth = 4; q.beginPath(); for (let x = 24; x < w - 24; x += 6) q.lineTo(x, 262 + Math.sin(x / 45) * 22); q.stroke(); });
    const scrM = (tex) => new T.MeshBasicMaterial({ map: tex, color: new T.Color(1.3, 1.3, 1.3) });
    const altScr = M(new T.PlaneGeometry(0.5, 0.31), scrM(altT), { x: -0.33, y: 0.02, z: 0.088, cast: false }, cons);
    const trkT = K.textTex("sp_track", 512, 320, (q, w, h) => { q.fillStyle = "#07101c"; q.fillRect(0, 0, w, h); q.strokeStyle = "rgba(120,170,255,0.25)"; for (let k = 0; k < 12; k++) { q.beginPath(); q.moveTo(k * 46, 0); q.lineTo(k * 46, h); q.stroke(); }
      q.strokeStyle = "#ffcf5a"; q.lineWidth = 4; q.beginPath(); for (let x = 0; x < w; x += 6) q.lineTo(x, 170 - Math.sin((x / w) * Math.PI * 2 + 0.6) * 90); q.stroke();
      q.fillStyle = "#ffffff"; q.beginPath(); q.arc(300, 170 - Math.sin((300 / w) * Math.PI * 2 + 0.6) * 90, 10, 0, 7); q.fill(); q.fillStyle = "#9fc8ff"; q.font = "600 28px KitInter, sans-serif"; q.fillText("GROUND TRACK", 20, 40); });
    M(new T.PlaneGeometry(0.5, 0.31), scrM(trkT), { x: 0.33, y: 0.02, z: 0.088, cast: false }, cons);
    for (const s of [-1, 1]) { const hc = G({ x: s * 0.52, y: -0.2, z: 0.1 }, cons); M(cyl(0.05, 0.06, 0.06, 14), dark, { rx: 90 }, hc); M(cyl(0.018, 0.018, 0.12, 10), dark, { z: 0.08, rx: 90 }, hc); M(sph(0.032, 12, 10), mat("#202226", { rough: 0.4 }), { z: 0.15 }, hc); }
    // comms panel: GROUND · VOICE lights up when the call comes in
    const comms = G({ x: -IN.x + 0.04, y: 0.1, z: 2.35, ry: 90 }, inr);
    M(rbox(0.36, 0.22, 0.07, 0.02), mat("#30343a", { rough: 0.5 }), {}, comms);
    const comT = K.textTex("sp_comms", 512, 256, (q, w, h) => { q.fillStyle = "#081410"; q.fillRect(0, 0, w, h); q.fillStyle = "#8affb4"; q.font = "700 64px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("GROUND · VOICE", w / 2, 110); q.font = "600 34px KitInter, sans-serif"; q.fillText("CH 1   ● INCOMING", w / 2, 190); });
    const comScr = M(new T.PlaneGeometry(0.3, 0.15), new T.MeshBasicMaterial({ map: comT, color: new T.Color(0.15, 0.15, 0.15) }), { y: 0.015, z: 0.052, cast: false }, comms);
    const comLed = M(sph(0.012, 8, 6), glow("#ff3a2a", 1), { x: 0.14, y: -0.085, z: 0.052, cast: false }, comms);
    const consL = new T.PointLight("#7fd4ff", 0, 2.5, 2); consL.position.set(0, -0.55, IN.z1 + 0.45); inr.add(consL);
    // the laptop on its arm behind her (starboard-ceiling corner) with the sticky note on its lid (a plant)
    const lap = G({ x: 0.88, y: 0.62, z: 1.55, ry: 160, rx: 6 }, inr);
    M(box(0.36, 0.02, 0.26), mat("#2b2d31", { rough: 0.5 }), { y: -0.12, z: 0.13, rx: 90 }, lap);
    M(box(0.36, 0.24, 0.016), mat("#2b2d31", { rough: 0.5 }), {}, lap);
    const lapT = K.textTex("sp_lap", 512, 320, (q, w, h) => { q.fillStyle = "#0b1626"; q.fillRect(0, 0, w, h); q.fillStyle = "#3d6fb0"; q.fillRect(0, 0, w, 40); q.fillStyle = "#cfe0ff"; q.font = "600 24px KitInter, sans-serif"; q.fillText("EXP 14 · GROWTH LOG", 16, 28); q.strokeStyle = "#5fd08a"; q.lineWidth = 4; q.beginPath(); for (let x = 20; x < w - 20; x += 8) q.lineTo(x, 280 - (x - 20) * 0.42 - Math.sin(x / 30) * 6); q.stroke(); });
    M(new T.PlaneGeometry(0.33, 0.21), scrM(lapT), { z: 0.009, cast: false }, lap);
    K.rod([-0.13, -0.02, -0.02], [-0.16, 0.45, -0.3], 0.012, alu, lap, 6);
    const noteT = K.textTex("sp_note", 256, 256, (q, w, h) => { q.fillStyle = "#f6e05a"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(0,0,0,0.08)"; q.fillRect(0, 0, w, 26);
      q.fillStyle = "#1b1b1b"; q.textAlign = "center"; q.font = "700 52px KitOswald, sans-serif"; q.fillText("REBOOST", w / 2, 92); q.fillText("DUE", w / 2, 148); q.font = "700 66px KitOswald, sans-serif"; q.fillText("DAY 40", w / 2, 224); });
    const note = M(new T.PlaneGeometry(0.15, 0.15), mat("#ffffff", { map: noteT, rough: 0.85 }), { x: 0.06, y: 0.02, z: -0.012, ry: 180, rz: 4, cast: false }, lap);
    // the headset hook + the red alarm light on the ceiling near the cupola
    const alarm = G({ x: -0.55, y: IN.y - 0.03, z: IN.z1 - 0.7 }, inr);
    M(cyl(0.06, 0.07, 0.05, 16), dark, {}, alarm);
    const alarmGlobe = M(sph(0.05, 14, 10), glow("#ff2010", 0.3), { y: -0.035, cast: false }, alarm);
    const alarmL = new T.PointLight("#ff2a18", 0, 5, 2); alarmL.position.set(-0.55, IN.y - 0.15, IN.z1 - 0.7); inr.add(alarmL);

    // ---- three empty sleeping bags strapped to the starboard wall
    const bags = [];
    { const bc = ["#4d5f80", "#5f6a4c", "#6e4a4f"];
      for (let i = 0; i < 3; i++) {
        const b = G({ x: IN.x - 0.08, y: 0, z: -4.65 + i * 0.78, ry: -90 }, inr);
        const bm = K.pmat(bc[i], { rough: 0.85, sheen: 0.6, sheenColor: "#c8d2e8", normalMap: K.nmap(K.normals().weave, 6, 12), ns: 0.3 });
        const g = rbox(0.58, 1.75, 0.12, 0.2, 6); const pa = g.attributes.position;
        for (let k = 0; k < pa.count; k++) { const y = pa.getY(k), z = pa.getZ(k); pa.setZ(k, z + (z > 0 ? 0.03 * Math.abs(Math.sin(y * 9.5)) : 0)); pa.setX(k, pa.getX(k) * (1 - 0.14 * ss((-y - 0.2) / 0.7))); }
        g.computeVertexNormals();
        M(g, bm, { y: -0.05 }, b);
        for (let k = 0; k < 6; k++) M(box(0.5, 0.012, 0.012), K.pmat(bc[i], { rough: 0.9 }), { y: -0.7 + k * 0.24, z: 0.075 }, b);
        M(new T.CircleGeometry(0.16, 28), mat("#111216", { rough: 0.9 }), { y: 0.55, z: 0.092, sy: 0.75, cast: false }, b);    // the empty hood opening
        M(box(0.44, 0.13, 0.05), mat("#e2ded4", { rough: 0.9 }), { y: 0.74, z: 0.09 }, b);     // the pillow strap
        for (const yy of [-0.55, 0.15]) { M(box(0.66, 0.04, 0.03), mat("#2a2c30", { rough: 0.7 }), { y: yy, z: 0.1 }, b); M(box(0.06, 0.06, 0.04), mat("#a8acb2", { metal: 0.5, rough: 0.4 }), { x: 0.2, y: yy, z: 0.115 }, b); }
        K.rod([-0.06, 0.4, 0.105], [0.18, -0.85, 0.105], 0.006, mat("#c8ccd2", { metal: 0.5, rough: 0.3 }), b, 4);     // the zip
        bags.push(b);
      } }
    // ---- the grow box on the port wall: magenta LEDs, six lettuce heads, the EXPERIMENT 14 label
    const grow = G({ x: -IN.x + 0.25, y: -0.12, z: -0.35, ry: 90 }, inr);
    const growLights = [];
    { M(box(0.62, 0.04, 0.42), mat("#e8e6e0", { rough: 0.5 }), { y: 0.25 }, grow); M(box(0.62, 0.04, 0.42), mat("#e8e6e0", { rough: 0.5 }), { y: -0.25 }, grow);
      for (const s of [-1, 1]) M(box(0.04, 0.54, 0.42), mat("#e8e6e0", { rough: 0.5 }), { x: s * 0.31 }, grow);
      M(box(0.62, 0.54, 0.02), mat("#cfcbc2", { rough: 0.6 }), { z: -0.21 }, grow);
      const ledT = K.canvasTex("sp_led", 128, 64, (q, w, h) => { q.fillStyle = "#200820"; q.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 12; x++) { q.fillStyle = (x + y) % 3 === 0 ? "#6060ff" : "#ff3060"; q.fillRect(4 + x * 10, 6 + y * 14, 6, 6); } });
      M(new T.PlaneGeometry(0.56, 0.36), new T.MeshBasicMaterial({ map: ledT, color: new T.Color(2.4, 2.4, 2.4) }), { y: 0.228, rx: 90, cast: false }, grow);
      M(new T.PlaneGeometry(0.58, 0.5), new T.MeshPhysicalMaterial({ color: "#d8e8f0", roughness: 0.08, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 1.2 }), { z: 0.205, cast: false, receive: false, nodepth: true }, grow).renderOrder = 3;
      const labT = K.textTex("sp_exp14", 512, 96, (q, w, h) => { q.fillStyle = "#e8e6e0"; q.fillRect(0, 0, w, h); q.fillStyle = "#2a2a2a"; q.font = "700 60px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("EXPERIMENT 14", w / 2, 70); });
      M(new T.PlaneGeometry(0.4, 0.075), mat("#ffffff", { map: labT, rough: 0.6 }), { y: 0.25, z: 0.222, cast: false }, grow);
      M(box(0.6, 0.06, 0.4), mat("#5a4632", { rough: 0.95 }), { y: -0.2 }, grow);   // the root mat
      const L = new T.PointLight("#ff5fd0", 0, 1.4, 2); L.position.set(0, 0.12, 0.05); grow.add(L); growLights.push(L);
      const LW = new T.PointLight("#fff6e8", 0, 0.9, 2); LW.position.set(0, 0.16, 0.12); grow.add(LW); growLights.push(LW);
      const L2 = new T.PointLight("#ff8ad8", 0, 1.8, 2); L2.position.set(0, 0.0, 0.45); grow.add(L2); growLights.push(L2);
    }
    // lettuce heads: rosettes of ruffled leaves
    const leafM = K.pmat("#2f8a22", { rough: 0.6, sheen: 0.25, sheenColor: "#a8ff7a", side: T.DoubleSide });
    const leafM2 = K.pmat("#4fa830", { rough: 0.55, sheen: 0.25, sheenColor: "#c8ff9a", side: T.DoubleSide });
    function leafGeo(seed) { const g = new T.PlaneGeometry(0.07, 0.1, 8, 10); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i) + 0.05; const ruff = Math.sin(x * 140 + seed) * 0.006 * (y / 0.1) + Math.sin(y * 90 + seed * 2) * 0.003; const cup = -x * x * 18; pa.setXYZ(i, x * (0.5 + 0.7 * Math.sin(Math.PI * clamp(y / 0.1, 0, 1))), y, cup + ruff); } g.computeVertexNormals(); return g; }
    const lettuce = [];
    { const R = rng(91); let leafI = 0;
      for (let i = 0; i < 6; i++) { const hx = -0.19 + (i % 3) * 0.19, hz = (i < 3 ? -0.08 : 0.09); const head = G({ x: hx, y: -0.17, z: hz }, grow);
        for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + R(), tilt = 30 + R() * 35 + (k < 3 ? -20 : 0); const lf = G({ ry: a / D2R }, head); M(leafGeo(leafI++), k % 2 ? leafM : leafM2, { rx: -tilt, s: 0.75 + R() * 0.4 + (k < 3 ? -0.2 : 0) }, lf); }
        lettuce.push(head); } }
    // the water bubble (on a leaf: a wobbling sphere with a fresnel rim and a highlight)
    const bubM = new T.ShaderMaterial({ uniforms: { t: U.t, k: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: "uniform float t; varying vec3 vN; varying vec3 vV; void main(){ vec3 p = position * (1.0 + 0.06 * sin(t * 7.0 + position.y * 60.0) + 0.04 * sin(t * 5.3 + position.x * 70.0)); vec4 mv = modelViewMatrix * vec4(p, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); float hl = pow(max(dot(reflect(-vV, vN), normalize(vec3(0.3, 0.8, 0.5))), 0.0), 40.0); vec3 c = vec3(0.8, 0.92, 1.0) * (0.1 + f * 1.6) + vec3(1.0) * hl * 4.0; gl_FragColor = vec4(c, clamp((0.18 + f * 0.95 + hl) * k, 0.0, 1.0)); }" });
    const bubble = M(sph(0.03, 24, 18), bubM, { cast: false, receive: false, nodepth: true }, grow); bubble.renderOrder = 4;
    bubble.position.set(0.0, -0.075, 0.11);
    // ---- the water recycler (starboard wall): a tank, pipes, valves, a small display
    const rec = G({ x: IN.x - 0.02, y: -0.1, z: 0.65, ry: -90 }, inr);
    { M(box(0.9, 1.2, 0.06), mat("#c8c4b8", { rough: 0.6 }), { z: -0.03 }, rec);
      M(cyl(0.16, 0.16, 0.7, 24), mat("#d8dde2", { metal: 0.35, rough: 0.35 }), { x: -0.22, y: -0.05, z: 0.2 }, rec);
      M(cyl(0.11, 0.11, 0.5, 20), mat("#9fb8d0", { metal: 0.3, rough: 0.3 }), { x: 0.18, y: 0.15, z: 0.16 }, rec);
      for (const [a, b] of [[[-0.22, 0.3, 0.2], [0.18, 0.4, 0.16]], [[0.18, -0.1, 0.16], [0.18, -0.45, 0.12]], [[-0.22, -0.4, 0.2], [0.3, -0.45, 0.12]], [[0.3, -0.45, 0.12], [0.32, 0.45, 0.12]]]) K.rod(a, b, 0.018, mat("#e0b030", { rough: 0.5 }), rec, 8);
      for (const [x, y] of [[0.0, 0.3], [0.0, -0.3]]) M(cyl(0.035, 0.035, 0.05, 12), mat("#c03020", { rough: 0.5 }), { x, y, z: 0.1, rx: 90 }, rec);
      const rT = K.textTex("sp_recy", 256, 128, (q, w, h) => { q.fillStyle = "#06140c"; q.fillRect(0, 0, w, h); q.fillStyle = "#7dffb0"; q.font = "700 40px KitOswald, sans-serif"; q.fillText("WATER", 16, 52); q.font = "600 26px KitInter, sans-serif"; q.fillText("RECYCLED · 98 %", 16, 100); });
      M(new T.PlaneGeometry(0.26, 0.13), scrM(rT), { x: 0.2, y: 0.45, z: 0.005, cast: false }, rec); }
    // ---- food lockers (port wall, forward of the grow box): two doors open, packets drift out
    const lockers = G({ x: -IN.x + 0.02, y: 0.38, z: 1.35, ry: 90 }, inr);
    const lockDoors = [], packets = [];
    { const lT = (s) => K.textTex("sp_food" + s, 256, 128, (q, w, h) => { q.fillStyle = "#e8e4da"; q.fillRect(0, 0, w, h); q.fillStyle = "#2a2a2a"; q.font = "700 52px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FOOD · " + s, w / 2, 80); });
      M(box(1.1, 0.62, 0.05), mat("#bdb8ac", { rough: 0.6 }), { z: -0.02 }, lockers);
      for (const [k, s] of [[0, "A"], [1, "B"]]) {
        const hinge = G({ x: -0.55 + k * 0.56, y: 0, z: 0.03 }, lockers);
        const door = G({}, hinge); M(box(0.53, 0.58, 0.035), mat("#e3dfd4", { rough: 0.55 }), { x: 0.27 }, door);
        M(new T.PlaneGeometry(0.36, 0.18), mat("#ffffff", { map: lT(s), rough: 0.6 }), { x: 0.27, y: 0.08, z: 0.02, cast: false }, door);
        M(box(0.1, 0.03, 0.03), dark, { x: 0.47, y: -0.16, z: 0.03 }, door);
        lockDoors.push(door);
        // the packets inside
        for (let j = 0; j < 8; j++) M(rbox(0.12, 0.16, 0.03, 0.02), mat(j % 3 ? "#c9ccd2" : "#e4c88a", { metal: j % 3 ? 0.5 : 0.1, rough: 0.4 }), { x: -0.42 + k * 0.56 + (j % 4) * 0.11, y: -0.12 + Math.floor(j / 4) * 0.2, z: -0.06 }, lockers);
      }
      const R = rng(55);
      for (let i = 0; i < 14; i++) { const m = M(rbox(0.12, 0.16, 0.025, 0.02), mat(i % 3 ? "#c9ccd2" : "#e4c88a", { metal: i % 3 ? 0.5 : 0.1, rough: 0.4 }), { cast: false }, inr); packets.push({ m, o: [-0.4 + R() * 0.8, -0.2 + R() * 0.4], v: [0.06 + R() * 0.16, (R() - 0.5) * 0.14, (R() - 0.5) * 0.18], w: [(R() - 0.5) * 2, (R() - 0.5) * 2, (R() - 0.5) * 2], d: R() * 0.6 }); } }
    // ---- the hygiene corner (aft, port side): a cabinet, the yellow hose with its funnel, foot loops (deadpan, nothing crude)
    const wc = G({ x: -IN.x + 0.05, y: 0.0, z: -4.9, ry: 90 }, inr);
    { M(box(0.7, 1.4, 0.3), mat("#d4d0c4", { rough: 0.6 }), { z: 0.12 }, wc);
      M(cyl(0.12, 0.18, 0.2, 24), mat("#e8e6df", { rough: 0.4 }), { y: -0.5, z: 0.4, rx: 90 }, wc);
      const hose = []; for (let k = 0; k <= 12; k++) { const u = k / 12; hose.push([0.22 + Math.sin(u * 3.2) * 0.12, 0.3 - u * 0.4 + Math.sin(u * 5) * 0.05, 0.3 + u * 0.32]); }
      M(K.tubeGeo(hose, 48, 12, () => 0.024), K.pmat("#e8c030", { rough: 0.4, cc: 0.4 }), {}, wc);
      const fun = G({ x: hose[12][0], y: hose[12][1], z: hose[12][2] }, wc); M(new T.CylinderGeometry(0.07, 0.026, 0.12, 24, 1, true), K.pmat("#f0d050", { rough: 0.35, cc: 0.5, side: T.DoubleSide }), { z: 0.05, rx: 90 }, fun);
      M(box(0.5, 0.05, 0.05), hr, { y: 0.62, z: 0.3 }, wc);
      const wcT = K.textTex("sp_wc", 256, 96, (q, w, h) => { q.fillStyle = "#e8e4da"; q.fillRect(0, 0, w, h); q.fillStyle = "#2a2a2a"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("HYGIENE", w / 2, 64); });
      M(new T.PlaneGeometry(0.3, 0.11), mat("#ffffff", { map: wcT, rough: 0.6 }), { y: 0.5, z: 0.275, cast: false }, wc); }
    // ---- the aft docking hatch: a round door with a central wheel (turns when she seals it)
    const hatch = G({ x: 0, y: 0, z: IN.z0 + 0.03 }, inr);
    let hatchWheel = null;
    { M(new T.TorusGeometry(0.5, 0.06, 12, 48), alu, {}, hatch); M(cyl(0.47, 0.47, 0.06, 40), mat("#b8bcc2", { metal: 0.4, rough: 0.4 }), { rx: 90, z: 0.03 }, hatch);
      const port = M(new T.CircleGeometry(0.07, 24), new T.MeshPhysicalMaterial({ color: "#1a2a3a", roughness: 0.05, clearcoat: 1 }), { y: 0.26, z: 0.065, cast: false }, hatch);
      void port;
      hatchWheel = G({ z: 0.1 }, hatch); M(new T.TorusGeometry(0.17, 0.018, 10, 32), mat("#2a2c30", { rough: 0.4, metal: 0.3 }), {}, hatchWheel);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; K.rod([0, 0, 0], [Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0], 0.012, mat("#2a2c30", { rough: 0.4 }), hatchWheel, 6); }
      M(cyl(0.035, 0.035, 0.05, 14), mat("#c8321f", { rough: 0.5 }), { rx: 90 }, hatchWheel);
      const hT = K.textTex("sp_hatch", 256, 64, (q, w, h) => { q.fillStyle = "#c8c4b8"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1a1a"; q.font = "700 38px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("DOCKING PORT", w / 2, 46); });
      M(new T.PlaneGeometry(0.34, 0.085), mat("#ffffff", { map: hT, rough: 0.6 }), { y: 0.62, z: 0.01, cast: false }, hatch); }
    // the coffee pouch (floating once she lets go)
    const pouch = G({}, inr);
    { M(rbox(0.07, 0.1, 0.022, 0.015), K.pmat("#c9cdd4", { metal: 0.55, rough: 0.3 }), {}, pouch); M(cyl(0.005, 0.005, 0.06, 8), mat("#d23a2a"), { y: 0.075 }, pouch);
      const cT = K.textTex("sp_coffee", 128, 64, (q, w, h) => { q.fillStyle = "#c9cdd4"; q.fillRect(0, 0, w, h); q.fillStyle = "#3a2618"; q.font = "700 30px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("COFFEE", w / 2, 42); });
      M(new T.PlaneGeometry(0.06, 0.03), mat("#ffffff", { map: cT, rough: 0.5 }), { y: 0.01, z: 0.0125, cast: false }, pouch); }
    pouch.visible = false;
    // face light rig (key + rim), Earth glow through the cupola
    const key = new T.SpotLight("#f4f4ff", 0, 6, 11 * D2R, 1.0, 1.6); key.castShadow = false; scene.add(key, key.target);
    const rim = new T.SpotLight("#a9c4ff", 0, 6, 18 * D2R, 0.9, 1.6); scene.add(rim, rim.target);
    const earthGlow = new T.PointLight("#6f8fd0", 0, 6, 2); earthGlow.position.set(0, -1.0, IN.z1 + 1.1); scene.add(earthGlow);

    // the station seen from far away (a bright speck) and the 408 km dimension line
    const stnSpeck = addSprite("#fff4e4", 2.2, 1, null, {});
    const dimG = G({});
    const dimM = glow("#f7b733", 4, { fog: false });
    const dimLine = M(cyl(1, 1, 1, 8), dimM, { cast: false, receive: false }, dimG);
    const dimTop = M(box(1, 1, 1), dimM, { cast: false, receive: false }, dimG), dimBot = M(box(1, 1, 1), dimM, { cast: false, receive: false }, dimG);
    const dimT = K.textTex("sp_dim", 512, 160, (q, w, h) => { q.clearRect(0, 0, w, h); q.font = "700 120px KitOswald, sans-serif"; q.textAlign = "center"; q.lineWidth = 14; q.strokeStyle = "rgba(4,6,14,0.85)"; q.strokeText("408 KM", w / 2, 128); q.fillStyle = "#f7b733"; q.fillText("408 KM", w / 2, 128); });
    const dimLab = M(new T.PlaneGeometry(1, 0.3125), new T.MeshBasicMaterial({ map: dimT, transparent: true, depthWrite: false, depthTest: false, fog: false }), { cast: false, receive: false, nodepth: true }, dimG);
    dimLab.renderOrder = 20; dimG.visible = false;

    // ================================================================ CARGO SHIP (only lights) + the porthole frame for the capsule shot
    const cargo = G({});
    const cgHead = [M(sph(0.5, 10, 8), glow("#fff6e6", 26, { fog: false }), { x: -4.5, cast: false }, cargo), M(sph(0.5, 10, 8), glow("#fff6e6", 26, { fog: false }), { x: 4.5, cast: false }, cargo)];
    const cgStrobe = M(sph(0.4, 8, 6), glow("#ffffff", 40, { fog: false }), { y: 1.4, cast: false }, cargo);
    const cgRed = M(sph(0.3, 8, 6), glow("#ff2a1a", 20, { fog: false }), { x: -3.2, cast: false }, cargo);
    const cgHalo = addSprite("#fff0d8", 0.7, 12, cargo, {});
    void cgHead;
    const port = G({});
    { M(new T.RingGeometry(0.17, 3.0, 64), mat("#2c3036", { rough: 0.7 }), { cast: false }, port); M(new T.TorusGeometry(0.175, 0.02, 10, 64), mat("#4a4f56", { metal: 0.3, rough: 0.5 }), { cast: false }, port);
      M(new T.TorusGeometry(0.185, 0.009, 8, 64), mat("#6a7078", { metal: 0.3, rough: 0.5 }), { z: -0.01, cast: false }, port); }
    port.visible = false;

    // ================================================================ SEA (splashdown): night ocean, three parachutes + capsule, a ship's lights
    const sea = G({});
    const seaU = { t: U.t, moonD: { value: new T.Vector3() }, camP: { value: new T.Vector3() } };
    const seaM = new T.ShaderMaterial({ uniforms: seaU, fog: false,
      vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: `uniform float t; uniform vec3 moonD, camP; varying vec3 vW; ${HASH}
        void main(){ vec2 p = vW.xz;
          float d = length(camP.xz - p);
          vec2 g = vec2(0.0); float a = 1.0, f = 0.035;
          for (int i = 0; i < 6; i++) { float ang = float(i) * 1.7 + 0.3; vec2 dir = vec2(cos(ang), sin(ang)); float ph = dot(p, dir) * f + t * (0.7 + float(i) * 0.22);
            g += dir * cos(ph) * a * f * exp(-d * f * 0.05); a *= 0.6; f *= 1.85; }
          vec3 N = normalize(vec3(-g.x * 2.2, 1.0, -g.y * 2.2));
          vec3 V = normalize(camP - vW);
          vec3 R = reflect(-V, N);
          float fr = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
          vec3 sky = mix(vec3(0.006, 0.01, 0.022), vec3(0.03, 0.045, 0.08), pow(1.0 - max(R.y, 0.0), 3.0));
          float sp = pow(max(dot(R, moonD), 0.0), 300.0) * 22.0 + pow(max(dot(R, moonD), 0.0), 40.0) * 0.16;
          vec3 c = vec3(0.0015, 0.003, 0.006) + sky * fr + vec3(0.75, 0.82, 1.0) * sp;
          float fogk = smoothstep(800.0, 9000.0, d);
          c = mix(c, vec3(0.012, 0.018, 0.034), fogk * 0.85);
          gl_FragColor = vec4(c, 1.0); }` });
    const SEA_Y = -60;
    M(new T.PlaneGeometry(40000, 40000, 1, 1), seaM, { y: SEA_Y, rx: -90, cast: false, receive: false }, sea);
    const chutes = G({}, sea);
    const gores = K.canvasTex("sp_gores", 512, 128, (g, w, h) => { for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? "#f2efe8" : "#e3602a"; g.fillRect(k * 32, 0, 32, h); } g.fillStyle = "rgba(0,0,0,0.12)"; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2); });
    const canM = new T.MeshStandardMaterial({ map: gores, roughness: 0.8, side: T.DoubleSide, envMapIntensity: 0.4 });
    const lineM = mat("#d8d4cc", { rough: 0.7 });
    const chuteParts = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.4, cg = G({ x: Math.cos(a) * 7.5, y: 24, z: Math.sin(a) * 7.5, rz: -Math.cos(a) * 14, rx: Math.sin(a) * 14 }, chutes);
      const dome = new T.SphereGeometry(8, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.42); const pa = dome.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), y = pa.getY(i); const az = Math.atan2(z, x); const sc = 1 + 0.035 * Math.cos(az * 16); pa.setXYZ(i, x * sc, y * 0.82, z * sc); }
      dome.computeVertexNormals(); M(dome, canM, { y: -6.4 }, cg);
      for (let j = 0; j < 12; j++) { const b = (j / 12) * Math.PI * 2; K.rod([Math.cos(b) * 7.6, -4.4, Math.sin(b) * 7.6], [-Math.cos(a) * 7.0, -21.5, -Math.sin(a) * 7.0], 0.025, lineM, cg, 4); }
      chuteParts.push(cg);
    }
    const capSea = G({ y: 0 }, chutes);
    { const cone = new T.CylinderGeometry(0.62, 1.55, 2.4, 40); const capM = new T.MeshPhysicalMaterial({ color: "#d8d4cc", roughness: 0.55, clearcoat: 0.2 }); M(cone, capM, { y: 1.2 }, capSea); M(cyl(1.58, 1.58, 0.18, 40), mat("#2a2420", { rough: 0.8 }), { y: -0.05 }, capSea);
      M(sph(0.06, 8, 6), glow("#ffffff", 30, { fog: false }), { y: 2.5, cast: false }, capSea); }
    const shipG = G({ x: -420, y: SEA_Y, z: -4600 }, sea);
    const shipLights = [];
    { const P = [[0, 9, 0, "#fff4e0", 30], [-14, 5, 0, "#ffe6c0", 18], [-6, 5, 0, "#ffe6c0", 18], [6, 5, 0, "#ffe6c0", 18], [14, 4, 0, "#ffe6c0", 14], [20, 3, 0, "#ff3020", 18], [-22, 3, 0, "#30ff60", 14], [0, 18, 0, "#ffffff", 30]];
      for (const [x, y, z, c, k] of P) { const m = M(sph(0.9, 8, 6), glow(c, k, { fog: false }), { x, y, z, cast: false }, shipG); shipLights.push(m);
        const refl = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color(c).multiplyScalar(0.5), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { x, y: 0.6, z: 6, sx: 5, sy: 70, cast: false, receive: false, nodepth: true }, shipG); refl.userData.reflY = true; shipLights.push(refl); }
      M(box(60, 4, 10), mat("#0a0b0d", { rough: 0.9 }), { y: 2 }, shipG);
      addSprite("#ffe8c8", 0.7, 90, shipG, { y: 6 }); }
    const seaFill = new T.DirectionalLight("#b8c8ff", 0); seaFill.position.set(0.3, 0.5, 1); sea.add(seaFill);
    sea.visible = false;

    // ================================================================ per-frame state
    const qBase = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0.5, 0.866).normalize(), new T.Vector3(0, 1, 0));
    const qx = new T.Quaternion(), inv = new T.Matrix4(), tmpV = new T.Vector3(), tmpQ = new T.Quaternion(), fwdV = new T.Vector3(), upV = new T.Vector3(0, 1, 0);
    const W_ORB = 0.0012;
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      U.t.value = t;
      const set = st.set || "orbit";
      const globe = set === "globe", seaS = set === "sea", inS = set === "in";
      stn.visible = !globe && !seaS; inr.visible = !globe && !seaS; aurora.visible = (set === "orbit" || inS) && I("auroraK", 1) > 0.01; sunG.visible = !globe && !seaS && I("sunK", 1) > 0;
      earth.visible = !seaS; sea.visible = seaS; ring.visible = globe;
      // Earth: under the station (orbit scale, turning with t), or a small globe
      if (globe) {
        const gs = I("globeR", 1000) / RE; earth.scale.setScalar(gs); earth.position.fromArray(I("globeP", [0, 0, 0]));
        const gr = I("globeRot", [-28, 0, 0]); earth.quaternion.setFromEuler(new T.Euler(gr[0] * D2R, gr[1] * D2R + t * 0.012, gr[2] * D2R, "XYZ"));
      } else {
        earth.scale.setScalar(1); earth.position.set(0, -(RE + HE), 0);
        qx.setFromAxisAngle(new T.Vector3(1, 0, 0), -(I("orbitA0", 0) + t * W_ORB)); earth.quaternion.copy(qx).multiply(qBase);
      }
      earth.updateMatrixWorld(true);
      inv.copy(earth.matrixWorld).invert();
      eU.camO.value.copy(cam.position).applyMatrix4(inv);
      tmpQ.copy(earth.quaternion).invert(); eU.sunO.value.copy(SUNV).applyQuaternion(tmpQ).normalize();
      eU.redK.value = I("redK", 0); eU.cityK.value = I("cityK", 1); eU.cloudK.value = I("cloudK", 1); eU.nightK.value = I("nightK", 1); eU.dayK.value = I("dayK", 1);
      eU.eggK.value = I("eggK", 1); eU.fine.value = globe ? 3 : 1;
      aU.k.value = I("atmoK", 1); aU.sunK.value = I("sunK", 1);
      aurU.k.value = I("auroraK", 1);
      ringU.k.value = I("ringK", 0); ringU.draw.value = I("ringDraw", 1); ringU.px.value = I("ringPx", 5);
      if (globe) { const s = clamp(I("ringDraw", 1), 0, 1) * 0 + I("speckS", 0.0); const i0 = Math.round(s * (NR - 1)); speck.position.set(rp[i0 * 3], rp[i0 * 3 + 1], rp[i0 * 3 + 2]); speckCore.position.copy(speck.position); speck.scale.setScalar(I("speckR", 260)); speckCore.scale.setScalar(I("speckR", 260) * 0.08); speck.visible = speckCore.visible = I("ringK", 0) > 0.01; }
      // the sun (disc behind the limb at the key-light direction)
      const sd = 12000;
      sunG.position.copy(cam.position).addScaledVector(SUNV, sd); sunG.lookAt(cam.position);
      const sk = I("sunK", 1); sunDisc.scale.setScalar(sd * 0.0047); sunGlare.scale.setScalar(sd * 0.09 * sk); sunGlare2.scale.setScalar(sd * 0.2 * sk); sunStreak.scale.set(sd * 0.75 * sk, sd * 0.012, 1);
      sunDisc.visible = sk > 0;
      // billboards face the camera
      for (const b of bills) { if (b.parent === sunG) continue; b.quaternion.copy(cam.quaternion); if (b.parent) { b.parent.getWorldQuaternion(tmpQ); b.quaternion.premultiply(tmpQ.invert()); } }
      // key light (the moon in the sea set) and station lights
      K.moon.intensity = I("sunI", 2.4);
      const wk = I("wingGlow", 0); cam.getWorldDirection(fwdV); const back = ss((fwdV.dot(SUNV) - 0.55) / 0.4); wingM.emissiveIntensity = (0.05 + 1.3 * back) * wk;
      floods.forEach((L) => (L.intensity = 22 * I("floodI", 1)));
      navR.visible = navG.visible = Math.sin(t * 2.0) > -0.6; strobe.visible = Math.sin(t * 3.1) > 0.85;
      cupGlow.intensity = 4 * I("winGlow", 1);
      extFill.intensity = (set === "orbit") ? I("extFill", 0.5) : 0; if (st.extFillD) extFill.position.fromArray(st.extFillD);
      // interior
      const cab = I("cabI", 1); cabL.forEach((L) => (L.intensity = 1.7 * cab)); ledM.color.set("#fff2e0").multiplyScalar(0.85 * clamp(cab, 0.05, 2));
      growLights[0].intensity = 0.55 * I("growI", 1); growLights[2].intensity = 0.45 * I("growI", 1); growLights[1].intensity = 0.45 * I("growW", 1);
      consL.intensity = 0.35 * I("consoleI", 1);
      const al = I("alarmI", 0); alarmL.intensity = 3.5 * al; alarmGlobe.material.color.set("#ff2010").multiplyScalar(0.3 + 14 * al);
      const ck = I("commsK", 0); comScr.material.color.setScalar(0.12 + 1.4 * ck); comLed.material.color.set("#ff3a2a").multiplyScalar(0.6 + 16 * ck * (Math.sin(t * 9) > 0 ? 1 : 0.25));
      earthGlow.intensity = 0.35 * I("earthI", 1);
      if (st.keyI) { key.intensity = st.keyI; key.position.fromArray(st.keyP); key.target.position.fromArray(st.keyT); key.target.updateMatrixWorld(); } else key.intensity = 0;
      if (st.rimI) { rim.intensity = st.rimI; rim.position.fromArray(st.rimP); rim.target.position.fromArray(st.rimT); rim.target.updateMatrixWorld(); } else rim.intensity = 0;
      // props
      bubM.uniforms.k.value = I("bubbleK", 0);
      const la = I("lockA", 0) * D2R; lockDoors.forEach((d, i) => (d.parent.rotation.y = -la * (i ? 0.9 : 1)));
      const pt = I("packT", -1);
      packets.forEach((p) => { p.m.visible = pt >= 0; if (pt < 0) return; const s = Math.max(0, pt - p.d); lockers.updateMatrixWorld(); tmpV.set(p.o[0] + p.v[2] * s, p.o[1] + p.v[1] * s, 0.06 + p.v[0] * s); lockers.localToWorld(tmpV); inr.worldToLocal(tmpV); p.m.position.copy(tmpV); p.m.rotation.set(p.w[0] * s, p.w[1] * s + 1.57, p.w[2] * s); });
      hatchWheel.rotation.z = I("hatchA", 0) * D2R;
      const pp = st.pouch; pouch.visible = !!pp; if (pp) { pouch.position.fromArray(pp.p); pouch.rotation.set(pp.r ? pp.r[0] : 0.2, pp.r ? pp.r[1] : 0.5, pp.r ? pp.r[2] : 0.1); }
      // cargo ship: approach (s 0..1) from below-behind toward the aft port, then stop and fall away
      const cg = st.cargo; cargo.visible = !!cg && !globe && !seaS;
      if (cg) { const s = cg.s || 0, f = cg.fall || 0; const A = [40, -260, -1400], B = [0, -6, IN.z0 - 32]; cargo.position.set(lerp(A[0], B[0], s) + f * 30, lerp(A[1], B[1], s) - f * f * 160 - f * 30, lerp(A[2], B[2], s) - f * 260);
        cargo.lookAt(f > 0 ? cargo.position.x + 40 : 0, cargo.position.y + (f > 0 ? -60 : 0), f > 0 ? cargo.position.z - 200 : 0);
        cgStrobe.visible = Math.sin(t * 6.5) > 0.7; const hk = 1 - ss(f * 2.2); cgHead.forEach((m) => (m.material.color.set("#fff6e6").multiplyScalar(26 * hk + 1))); cgRed.visible = f > 0.15 || Math.sin(t * 2) > 0; cgHalo.material.opacity = 1; cgHalo.scale.setScalar(12 * (0.5 + 0.5 * hk)); }
      // porthole frame in front of the camera
      const ph = st.porthole; port.visible = !!ph; if (ph) { cam.getWorldDirection(fwdV); port.position.copy(cam.position).addScaledVector(fwdV, ph.d || 0.42); port.quaternion.copy(cam.quaternion); }
      // sea
      seaFill.intensity = seaS ? I("seaFill", 0.5) : 0;
      // the station speck + the dimension line, sized by distance so they keep a constant on-screen size
      const dist = cam.position.length();
      const spk = I("speckK", 0); stnSpeck.visible = spk > 0.01 && !globe && !seaS; stnSpeck.position.set(0, 1, -1); stnSpeck.scale.setScalar(dist * 0.03 * spk);
      const dk = I("dimK", 0); dimG.visible = dk > 0.001 && !globe && !seaS;
      if (dimG.visible) { const L = HE * dk, wd = dist * 0.0011; dimLine.position.set(0, -L / 2, 0); dimLine.scale.set(wd, L, wd); dimTop.position.set(0, 0, 0); dimTop.scale.set(dist * 0.018, wd * 2, wd * 2); dimBot.position.set(0, -L, 0); dimBot.scale.set(dist * 0.018 * ss(dk * 3 - 2), wd * 2, wd * 2);
        dimLab.position.set(dist * 0.055, -HE * 0.5, 0); dimLab.scale.setScalar(dist * 0.11); dimLab.quaternion.copy(cam.quaternion); dimLab.material.opacity = ss((dk - 0.5) * 3); }
      if (seaS) { seaU.moonD.value.copy(SUNV); seaU.camP.value.copy(cam.position); const dk = I("chuteY", 0); chutes.position.set(0, dk, 0); chuteParts.forEach((c, i) => { c.rotation.y = Math.sin(t * 0.5 + i) * 0.05; }); chutes.rotation.z = Math.sin(t * 0.35) * 0.03; }
    });

    function setSun(d) { SUNV.set(d[0], d[1], d[2]).normalize(); }
    return { stn, inr, earth, aurora, sea, chutes, capsule, cargo, port, cons, comms, lap, note, grow, bubble, lettuce, rec, lockers, wc, hatch, bags, pouch, wings, key, rim, ring, setSun,
      P: { RE, HE, IN, MODR, CUP, CAPS, TRUSS, SUN, SEA_Y, EGG: EGG.toArray() } };
  }

  // ---------------------------------------------------------------- Ines: the Hazel v2 rig with her own face, curls that float, a flight suit
  const INES = { skin: "#664b3f", earIn: "#452c22", lip: "#5e3a33", brow: "#140c09", iris: [[64, 40, 24], [30, 18, 10]],
    face: { w: 0.955, len: 1.085, jaw: 0.15, chin: 0.05, cheek: 0.0065, cheekX: 0.056, blush: 0.25, eyeS: 1.07, eyeX: 0.0345, bridge: 1.3, nostrils: 1.3, noseTip: 1.18, noseL: 0.88, noseY: -0.00096, lipT: 1.38, browLift: 0.0025, browT: 1.2 },
    jacket: "#1d4d57", jacketSheen: "#5f97a0", jacketRough: 0.82, trim: "#173c44", trimSheen: "#4f8088", seam: "#13343b", pants: "#1d4d57", pantsSheen: "#5f97a0",
    boot: "#3a3d44", sole: "#26282c", under: "#d9d5c9", hair: "#120b08", hairStreaks: ["rgba(0,0,0,0.4)", "rgba(46,30,22,0.35)", "rgba(80,56,40,0.25)"], hairSheen: "#8a6a58", tie: "#120b08", pony: false, chestPocket: true };
  function dressInes(K, hz, X) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat;
    // hide the kit's hair cap and fringe locks: she gets her own curls
    hz.head.children.forEach((o) => { if (o.isMesh && (o.material === hz.mats.hairM || o.material === hz.mats.hairTubeM)) o.visible = false; });
    const head = hz.head;
    const curlCol = K.canvasTex("ines_curl", 64, 64, (g, w, h) => { g.fillStyle = "#140c09"; g.fillRect(0, 0, w, h); const R = K.rng(4); for (let i = 0; i < 160; i++) { g.fillStyle = R() < 0.5 ? "rgba(70,46,32,0.5)" : "rgba(0,0,0,0.5)"; g.fillRect(R() * w, R() * h, 2, 1); } }, { repeat: true });
    const curlM = K.pmat("#ffffff", { rough: 0.55, sheen: 0.9, sheenColor: "#a0806a", sheenRough: 0.4, map: curlCol });
    // base: a close cap over the cranium with a soft hairline
    const capG = new T.SphereGeometry(1, 56, 40); {
      const pa = capG.attributes.position, keep = new Uint8Array(pa.count);
      const line = (az) => { const a = Math.abs(az); return a < 0.9 ? lerp(0.6, 0.42, a / 0.9) : a < 1.8 ? lerp(0.42, -0.05, (a - 0.9) / 0.9) : lerp(-0.05, -0.5, (a - 1.8) / 1.34); };
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), az = Math.atan2(x, z); keep[i] = y > line(az) ? 1 : 0; const v = 0.075 + 0.01 * K.vnoise(az * 6 + 3, y * 6, 5);
        pa.setXYZ(i, x * 0.1 * 0.975 * (1 + v), y * 0.1 * 1.07 * (1 + v) + 0.003, z * 0.1 * (z < 0 ? 1.1 : 0.99) * (1 + v)); }
      const ix = capG.index.array, out = []; for (let i = 0; i < ix.length; i += 3) if (keep[ix[i]] && keep[ix[i + 1]] && keep[ix[i + 2]]) out.push(ix[i], ix[i + 1], ix[i + 2]);
      capG.setIndex(out); capG.computeVertexNormals(); }
    M(capG, curlM, { y: 0.1 }, head);
    // curls: short coils over the cap, standing out in zero-g; each sways with t
    const curls = [], R = K.rng(808);
    const coil = (len, rad, turns, tr) => { const pts = []; for (let k = 0; k <= 30; k++) { const u = k / 30, a = u * Math.PI * 2 * turns; pts.push([Math.cos(a) * rad * (1 - 0.3 * u), u * len, Math.sin(a) * rad * (1 - 0.3 * u)]); } return K.tubeGeo(pts, 48, 6, (u) => tr * (1 - 0.4 * u)); };
    const geos = [coil(0.026, 0.0042, 3.2, 0.0052), coil(0.032, 0.0048, 3.8, 0.0056), coil(0.021, 0.0038, 2.6, 0.005), coil(0.036, 0.005, 4.2, 0.0058)];
    for (let i = 0; i < 380; i++) {
      // a point on the upper head (fibonacci-ish), above the hairline
      const yv = 1 - 1.55 * R(), az = R() * Math.PI * 2 - Math.PI;
      const a = Math.abs(az), lineY = a < 0.9 ? lerp(0.62, 0.44, a / 0.9) : a < 1.8 ? lerp(0.44, -0.02, (a - 0.9) / 0.9) : lerp(-0.02, -0.46, (a - 1.8) / 1.34);
      if (yv < lineY + 0.04) continue;
      const rr = Math.sqrt(Math.max(0, 1 - yv * yv));
      const n = new T.Vector3(Math.sin(az) * rr * 0.975, yv * 1.07, Math.cos(az) * rr * (Math.cos(az) < 0 ? 1.1 : 0.99)).normalize();
      const p = n.clone().multiplyScalar(0.104); p.y += 0.1 + 0.003;
      const g = G({ x: p.x, y: p.y, z: p.z }, head);
      g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n.clone().lerp(new T.Vector3(0, 1, 0), 0.25).normalize());
      const inner = G({ ry: R() * 360 }, g);
      const sc = 0.8 + R() * 0.5 * (yv > 0.3 ? 1 : 0.6);
      M(geos[i % 4], curlM, { s: sc, cast: i % 3 === 0 }, inner);
      curls.push({ g: inner, ph: R() * 6.28, amp: 6 + R() * 10 });
    }
    // patches: a name tape (INES) and a round shoulder patch with a lettuce leaf (no flag or agency)
    const sp = hz.spine, surf = hz.surf;
    const tapeT = K.textTex("ines_tape", 256, 64, (q, w, h) => { q.fillStyle = "#d9a83a"; q.fillRect(0, 0, w, h); q.fillStyle = "#1b1b1b"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("INES", w / 2, 48); });
    { const p = surf(0.3, -0.45, 1.02); M(new T.PlaneGeometry(0.08, 0.02), mat("#ffffff", { map: tapeT, rough: 0.7 }), { x: p[0], y: p[1], z: p[2] + 0.002, ry: -24, cast: false }, sp); }
    const patT = K.canvasTex("ines_patch", 128, 128, (q, w, h) => { q.fillStyle = "#e9e4d6"; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.fillStyle = "#1f3a44"; q.beginPath(); q.arc(64, 64, 54, 0, 7); q.fill(); q.fillStyle = "#6fbf4a"; q.beginPath(); q.ellipse(64, 70, 22, 34, 0.4, 0, 7); q.fill(); q.strokeStyle = "#3f7f2a"; q.lineWidth = 4; q.beginPath(); q.moveTo(52, 100); q.lineTo(74, 42); q.stroke(); q.strokeStyle = "#e9e4d6"; q.lineWidth = 3; q.beginPath(); q.ellipse(64, 64, 46, 16, -0.3, 0, 7); q.stroke(); });
    M(new T.CircleGeometry(0.03, 24), mat("#ffffff", { map: patT, rough: 0.7 }), { x: 0.058, y: -0.08, ry: 90, cast: false }, hz.arms[1].sh);
    // the headset: a thin band over the curls, an ear cup on her left, a boom mic to her mouth
    const hs = G({ y: 0.1 }, head);
    { const band = []; for (let k = 0; k <= 20; k++) { const a = -Math.PI / 2 + (k / 20) * Math.PI; band.push([Math.sin(a) * 0.118, Math.cos(a) * 0.125 + 0.0, -0.005]); }
      M(K.tubeGeo(band, 40, 6, () => 0.0045), mat("#2a2c30", { rough: 0.45 }), {}, hs);
      for (const s of [-1, 1]) M(K.cyl(0.03, 0.03, 0.018, 18), mat("#2a2c30", { rough: 0.45 }), { x: s * 0.112, y: 0.0, z: -0.005, rz: 90 }, hs);
      const boom = []; for (let k = 0; k <= 10; k++) { const u = k / 10; boom.push([lerp(0.112, 0.03, u), lerp(-0.01, -0.06, u), lerp(0.0, 0.088, Math.pow(u, 0.8))]); }
      M(K.tubeGeo(boom, 20, 5, () => 0.0026), mat("#2a2c30", { rough: 0.45 }), {}, hs);
      M(K.sph(0.008, 10, 8), mat("#1b1c1f", { rough: 0.7 }), { x: 0.03, y: -0.06, z: 0.09 }, hs); }
    hs.visible = false;
    // the coffee pouch in her right hand (until she lets go)
    const pouchH = new T.Group(); M(K.rbox(0.07, 0.1, 0.022, 0.015), K.pmat("#c9cdd4", { metal: 0.55, rough: 0.3 }), {}, pouchH); M(K.cyl(0.005, 0.005, 0.06, 8), mat("#d23a2a"), { y: 0.075 }, pouchH); pouchH.position.set(0, -0.09, 0.03); hz.tool("pouch", pouchH, 0);
    const tab = new T.Group(); M(K.rbox(0.2, 0.14, 0.012, 0.012), mat("#2b2d31", { rough: 0.5 }), {}, tab); const tbT = K.textTex("ines_tab", 256, 180, (q, w, h) => { q.fillStyle = "#0c1828"; q.fillRect(0, 0, w, h); q.fillStyle = "#cfe0ff"; q.font = "600 20px KitInter, sans-serif"; q.fillText("PLAN · DAY 1", 14, 28); q.fillStyle = "#5fd08a"; for (let k = 0; k < 4; k++) q.fillRect(14, 50 + k * 30, 120 + (k * 37) % 80, 10); }); M(new T.PlaneGeometry(0.18, 0.12), new T.MeshBasicMaterial({ map: tbT, color: new T.Color(1.2, 1.2, 1.2) }), { z: 0.007 }, tab); tab.position.set(0.02, -0.08, 0.05); tab.rotation.set(-1.25, 0, 0.2); hz.tool("tablet", tab, 1);
    Object.assign(hz.POSES, {
      float: { arms: [[-36, -16, -54], [-30, 14, -50]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [-4, 0], curl: [40, 38] },
      floatC: { arms: [[-58, -10, -70], [-52, 10, -64]], legs: [[-34, 52], [-24, 40]], hipY: 0.93, spine: [6, 0], curl: [70, 70] },   // hands on the controllers
      headset: { arms: [[-40, -20, -128], [-30, 14, -50]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [-2, 0], curl: [60, 38] }, // a hand to the ear cup
      water: { arms: [[-62, -6, -40], [-30, 14, -50]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [8, 0], curl: [70, 38] },
      pouch: { arms: [[-62, 22, -136], [-30, 14, -50]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [-2, 0], curl: [70, 38] },
      release: { arms: [[-58, 4, -88], [-30, 14, -50]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [-2, 0], curl: [10, 38] },
      tablet: { arms: [[-26, -12, -84], [-30, 14, -92]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [8, 0], curl: [50, 70] },
      wheel: { arms: [[-82, -6, -30], [-80, 8, -30]], legs: [[-30, 46], [-20, 36]], hipY: 0.93, spine: [4, 0], curl: [80, 80] },
    });
    hz.root.rotation.order = "YXZ";
    // per frame: curls drift, the headset follows the state
    K.onRender((st, t) => {
      const amp = st.hairK != null ? st.hairK : 1;
      for (const c of curls) { c.g.rotation.x = Math.sin(t * 0.7 + c.ph) * c.amp * D2R * amp; c.g.rotation.z = Math.sin(t * 0.53 + c.ph * 1.7) * c.amp * 0.7 * D2R * amp; }
      hs.visible = !!st.headset;
    });
    return { curls, headset: hs, tools: { pouchH, tab } };
  }
  const lerp2 = lerp; void lerp2;

  S.space = space;
  S.space.CREATE = CREATE;
  S.space.INES = INES;
  S.space.dressInes = dressInes;
  S.space.dirOf = dirOf;
})();
