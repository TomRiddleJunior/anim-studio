/* Survival-scenario kit · world module "The Volcano" (needs survival-kit.js v2.2).
 * A black cone at night, a ridge with a small lit hut ringed by a river of lava; physically lit and seek-safe.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.volcano.CREATE));
 *   const Vo = SURVIVAL.volcano(K);
 *   const hz = K.hazel(SURVIVAL.volcano.LEILA); const leila = SURVIVAL.volcano.dressLeila(K, hz, Vo);
 *   K.render({ …kit state…, lavaI (glow), crustK (0..1 black crust), flowK (speed), sparkK, ashK, plumeK, craterK,
 *              winK, lampI, ceilI, scanK, scanCh (0..3), gasK (beep), seisK (trace calm 0..1), drumT, bridge:{cut,drop,burn},
 *              heli:{k, p:[x,y,z], yaw, landK}, campK, eyesK, eyesI, eyesGather, eyesScale, sockK, glowK, fill… })
 *
 * World (metres, y up, north = -z): a 3-patch basalt terrain (black, rough), the cone 1.9 km north with a glowing crater
 * and a lit plume; the lava comes down its flank, splits round the ridge island (west + east branches) and runs south to
 * the valley. The lava is emissive ribbons along the channels with a flow-scrolled surface and black crust plates that
 * slide with it (crustK spreads them), bank glow, rising sparks, steam/ash sheets; orange point lights along the banks
 * light the rock. On the ridge: the hut (corrugated walls, north + south windows, a warm interior), a helipad with a
 * windsock, an antenna, the rope bridge over the east branch (it can be cut, drop and flare). Inside: the instrument
 * bench (seismograph drum with a calming trace, gas meter, radio scanner, laptop, lamp, an I ♥ MAGMA mug), the
 * whiteboard (ERUPTION ENDING? ~3 DAYS ↓), four gas masks on hooks, the water tank, food shelves. In the valley: dim
 * towns, the floodlit tent camp; a rescue helicopter that is only lights; red eyes on the far bank / in the valley.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const dirOf = (az, el) => [Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), Math.cos(az * D2R) * Math.cos(el * D2R)];
  const MOON = dirOf(-150, 24);   // a low moon behind the cone (north-west): it rims the cone and the ridge
  const CREATE = {
    moonDir: MOON, moonCol: "#9fb0e0", bg: "#05040a", fogCol: "#1c1418", hemi: ["#1a2034", "#3a1206"],
    shadow: { half: 70, far: 500, dist: 220, center: [0, 30, 0] },
    sky: { zen: [0.006, 0.006, 0.016], hor: [0.05, 0.028, 0.04] },
    env: { zen: "#06060f", hor: "#1e1216", mside: "#3a4468", gnd: "#2a0e06" },
  };
  // channels (x, z): the main river from the cone, the west + east branches round the ridge island, the river south
  const UP = [[-60, -1300], [-20, -1040], [24, -800], [12, -600], [0, -480]];
  const WB = [[0, -480], [-52, -410], [-92, -260], [-110, -70], [-104, 110], [-74, 250], [-22, 330]];
  const EB = [[0, -480], [56, -410], [96, -260], [116, -70], [110, 100], [80, 245], [22, 330]];
  const DN = [[-10, 335], [22, 520], [-14, 820], [36, 1160], [-6, 1600], [-80, 2300], [-60, 3200]];
  const CONE = [0, -1900];
  const HUT = { x: 0, z: 0, w: 4.2, d: 3.2, h: 2.6 };
  const PAD = [0, -64];
  const BR = { z: 70, x0: 88, x1: 140 };
  const CAMP = [520, 2150];

  const PL = new Map();
  function segD(px, pz, P) {   // distance from (px,pz) to a polyline, and the position along it (0..1)
    let best = 1e9, bs = 0, acc = 0;
    let rec = PL.get(P); if (!rec) { const L = []; let tot = 0; for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); L.push(l); tot += l; } rec = { L, tot }; PL.set(P, rec); }
    const L = rec.L, tot = rec.tot;
    for (let i = 0; i < P.length - 1; i++) {
      const [x0, z0] = P[i], [x1, z1] = P[i + 1], dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz;
      const u = clamp(((px - x0) * dx + (pz - z0) * dz) / l2, 0, 1), d = Math.hypot(px - x0 - dx * u, pz - z0 - dz * u);
      if (d < best) { best = d; bs = (acc + u * L[i]) / tot; }
      acc += L[i];
    }
    return [best, bs];
  }
  let VN = null, FB = null, CREST = null, PADH = null;
  function baseH(x, z) {   // the land falls gently from the cone (north) to the valley (south); the cone; the ridge island
    const r = Math.hypot(x - CONE[0], z - CONE[1]);
    let h = -z * 0.022 + (FB(x / 700 + 3, z / 700 - 1, 5, 4) - 0.5) * 60 * ss((Math.hypot(x, z) - 300) / 700);
    h += 720 * Math.exp(-Math.pow(r / 640, 1.35)) - 140 * Math.exp(-Math.pow(r / 120, 2));      // the cone + its crater
    h += (FB(x / 90, z / 90, 9, 3) - 0.5) * 9 + (VN(x / 14, z / 14, 13) - 0.5) * 1.6;
    const isl = ss((z + 440) / 70) * ss((340 - z) / 80);
    h += 44 * Math.exp(-Math.pow(x / 40, 2)) * isl;                                                   // the ridge crest
    return h;
  }
  function chan(x, z) {   // [distance to the nearest channel centre, its half width]
    let d = 1e9, w = 12;
    for (const [P, hw] of [[UP, 20], [WB, 11], [EB, 13], [DN, 18]]) { const [dd] = segD(x, z, P); if (dd < d) { d = dd; w = hw; } }
    return [d, w];
  }
  const lavaY = (x, z) => -z * 0.022 - 3.0 + 720 * Math.exp(-Math.pow(Math.hypot(x - CONE[0], z - CONE[1]) / 640, 1.35)) * 0.92;
  function volH(x, z) {
    let h = baseH(x, z);
    const [d, w] = chan(x, z);
    const ly = lavaY(x, z);
    const bank = ss((d - w) / 22);
    h = lerp(ly - 2.5, Math.max(h, ly + 1.5 + 2.5 * ss((d - w) / 8)), bank);
    // flatten the hut and the helipad on the crest
    const fh = Math.exp(-Math.pow(Math.hypot(x - HUT.x, z - HUT.z) / 7, 4)), fp = Math.exp(-Math.pow(Math.hypot(x - PAD[0], z - PAD[1]) / 9, 4));
    if (fh > 1e-4 || fp > 1e-4) { if (CREST == null) { CREST = baseH(HUT.x, HUT.z); PADH = baseH(PAD[0], PAD[1]) - 0.4; } h = lerp(h, CREST, fh); h = lerp(h, PADH, fp); }
    return h;
  }

  function volcano(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox, rng = K.rng;
    VN = K.vnoise; FB = K.fbm;
    K.buildSky();
    const U = { t: { value: 0 }, crust: { value: 0.3 }, lava: { value: 1 }, flow: { value: 1 } };
    const radial = K.canvasTex("v_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const bills = [];
    const addSprite = (col, k, s, parent, p) => { const m = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color(col).multiplyScalar(k), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), Object.assign({ s, cast: false, receive: false, nodepth: true }, p || {}), parent); bills.push(m); return m; };

    // ---------------------------------------------------------------- terrain: near, mid, far patches of black basalt, warmed by the lava below
    const rockN = K.heightNormal("v_rockN", 256, (x, y) => K.vnoise(x / 6, y / 6, 3) * 0.6 + K.vnoise(x / 2, y / 2, 5) * 0.3 + K.hash2(x, y, 7) * 0.15, 2.4);
    const rockT = K.canvasTex("v_rockT", 256, 256, (g, w, h) => { g.fillStyle = "#2a2626"; g.fillRect(0, 0, w, h); const R = rng(4); for (let i = 0; i < 2600; i++) { const c = 20 + Math.floor(R() * 40); g.fillStyle = `rgba(${c + 8},${c},${c},0.5)`; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); } }, { repeat: true });
    rockT.repeat.set(1, 1); rockN.wrapS = rockN.wrapT = T.RepeatWrapping;
    const rockM = new T.MeshStandardMaterial({ map: rockT, normalMap: rockN, roughness: 0.92, metalness: 0, envMapIntensity: 0.35, vertexColors: true });
    rockM.normalScale.set(0.9, 0.9);
    function patch(size, seg, cx, cz, sink) {
      const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position, uv = g.attributes.uv, cols = [];
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + cx, z = pa.getZ(i) + cz; const h = volH(x, z) - (sink ? sink(x, z) : 0); pa.setXYZ(i, x, h, z); uv.setXY(i, x / 9, z / 9);
        const [d, w] = chan(x, z); const hot = Math.exp(-Math.max(0, d - w) / 6) * 0.8;               // the banks glow faintly (vertex colour warm)
        const ash = 0.75 + 0.25 * K.vnoise(x / 40, z / 40, 31); cols.push(ash + hot * 1.2, ash + hot * 0.35, ash + hot * 0.15); }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      const m = M(g, rockM, { cast: false }); m.receiveShadow = true; return m;
    }
    const inB = (x, z, h, cx, cz) => Math.abs(x - cx) < h && Math.abs(z - cz) < h;
    patch(900, 560, 0, -80, null);
    patch(4200, 420, 0, -400, (x, z) => (inB(x, z, 446, 0, -80) ? 18.0 : 0));
    patch(24000, 160, 0, -2000, (x, z) => (inB(x, z, 2080, 0, -400) ? 45.0 : 0));

    // ---------------------------------------------------------------- lava: emissive ribbons along the channels (flow scroll + black crust plates)
    const HASH = `float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
      float vn(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }
      float fb(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.07; a *= 0.5; } return s / 0.9375; }`;
    const lavaM = new T.ShaderMaterial({ uniforms: { t: U.t, crust: U.crust, k: U.lava, flow: U.flow }, fog: false,
      vertexShader: "attribute float aS; attribute float aV; attribute float aL; varying float vS, vV, vL; varying vec3 vW; void main(){ vS = aS; vV = aV; vL = aL; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: `uniform float t, crust, k, flow; varying float vS, vV, vL; varying vec3 vW; ${HASH}
        void main(){
          float edge = abs(vV - 0.5) * 2.0;                                  // 0 centre .. 1 bank
          float speed = (0.55 + 0.45 * (1.0 - edge * edge)) * flow;
          vec2 q = vec2(vS * vL / 9.0, vV * 3.0);
          float p0 = fract(t * 0.07), p1 = fract(t * 0.07 + 0.5), wgt = abs(p0 - 0.5) * 2.0;   // two flowmap phases, cross-faded
          float na = fb(q - vec2(speed * p0 * 5.0, 0.0)) * 0.6 + fb((q - vec2(speed * p0 * 5.0, 0.0)) * 3.1 + 7.0) * 0.4;
          float nb = fb(q - vec2(speed * p1 * 5.0, 0.0) + 0.37) * 0.6 + fb((q - vec2(speed * p1 * 5.0, 0.0) + 0.37) * 3.1 + 7.0) * 0.4;
          float n = mix(na, nb, wgt);
          // crust plates: cells drifting with the flow (plug flow, so they never shear apart); cracks between them glow
          vec2 cq = vec2(vS * vL / 5.5 - t * 0.32 * flow, vV * 2.6);
          vec2 ci = floor(cq), cf = fract(cq); float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = h22(ci + g) * 0.8 + 0.1; float dd = length(g + o - cf); if (dd < d1) { d2 = d1; d1 = dd; id = ci + g; } else if (dd < d2) d2 = dd; }
          float crack = smoothstep(0.02, 0.14, d2 - d1);
          float cov = smoothstep(1.0 - crust * 1.15, 1.0 - crust * 1.15 + 0.12, h12(id + 3.7) * 0.75 + edge * 0.45 + n * 0.2);
          float plate = cov * crack;
          float heat = (1.0 - edge * 0.65) * (0.65 + 0.55 * n);
          vec3 hot = mix(vec3(0.95, 0.16, 0.02), vec3(1.0, 0.5, 0.1), smoothstep(0.6, 1.0, heat)) * (1.1 + 2.6 * heat * heat);
          vec3 cr = vec3(0.025, 0.02, 0.02) + vec3(0.6, 0.12, 0.02) * (1.0 - crack) * cov * 1.4;   // a crusted plate, its rim still red
          vec3 c = mix(hot, cr, plate);
          gl_FragColor = vec4(c * k * 0.62, 1.0);
        }`, side: T.DoubleSide });
    function ribbon(P, hw, seg) {
      const curve = new T.CatmullRomCurve3(P.map(([x, z]) => new T.Vector3(x, 0, z)), false, "centripetal");
      const N = seg || 400, pos = [], aS = [], aV = [], aL = [], idx = [], len = curve.getLength();
      for (let i = 0; i <= N; i++) {
        const u = i / N, p = curve.getPointAt(u), tg = curve.getTangentAt(u), nx = -tg.z, nz = tg.x;
        for (const v of [0, 0.5, 1]) { const x = p.x + nx * (v - 0.5) * 2 * hw * 1.08, z = p.z + nz * (v - 0.5) * 2 * hw * 1.08; pos.push(x, lavaY(x, z) + 0.4 - (v === 0.5 ? 0.1 : 0), z); aS.push(u); aV.push(v); aL.push(len); }
        if (i < N) { const k = i * 3; idx.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
      }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("aS", new T.Float32BufferAttribute(aS, 1)); g.setAttribute("aV", new T.Float32BufferAttribute(aV, 1)); g.setAttribute("aL", new T.Float32BufferAttribute(aL, 1)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, lavaM); m.receiveShadow = false; m.castShadow = false; scene.add(m); return { m, curve };
    }
    const rivers = [ribbon(UP, 20, 300), ribbon(WB, 11, 300), ribbon(EB, 13, 300), ribbon(DN, 18, 500)];
    // the lava's light on the rock: orange point lights along the banks near the ridge (no shadows)
    const lavaL = [];
    for (const [P, n] of [[WB, 3], [EB, 3], [UP, 1], [DN, 2]]) { const c = new T.CatmullRomCurve3(P.map(([x, z]) => new T.Vector3(x, 0, z))); for (let i = 0; i < n; i++) { const p = c.getPointAt((i + 0.5) / n); const L = new T.PointLight("#ff6a1e", 0, 180, 1.4); L.position.set(p.x, lavaY(p.x, p.z) + 22, p.z); scene.add(L); lavaL.push(L); } }

    // ---------------------------------------------------------------- the crater glow, the plume, ash/steam sheets
    const craterTop = volH(CONE[0], CONE[1] + 0) + 4;
    const crater = addSprite("#ff5a18", 1.4, 420, null, {}); crater.position.set(CONE[0], craterTop + 30, CONE[1]);
    const craterL = new T.PointLight("#ff6020", 0, 1800, 1.2); craterL.position.set(CONE[0], craterTop + 60, CONE[1]); scene.add(craterL);
    const smokeT = K.noiseTex("v_smoke", 128, 21, 4, 1.6);
    const plumes = [];
    for (let i = 0; i < 3; i++) {
      const m = new T.ShaderMaterial({ uniforms: { tN: { value: smokeT }, t: U.t, k: { value: 1 }, seed: { value: i * 3.7 } }, transparent: true, depthWrite: false, fog: false,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `uniform sampler2D tN; uniform float t, k, seed; varying vec2 vUv;
          void main(){ float w = 0.16 + vUv.y * 0.55; float x = (vUv.x - 0.5) / w + sin(vUv.y * 4.0 + seed + t * 0.05) * 0.3;
            float n = texture2D(tN, vec2(vUv.x * 0.8 + seed, vUv.y * 0.9 - t * 0.012)).r * 0.6 + texture2D(tN, vec2(vUv.x * 1.9 - seed, vUv.y * 2.1 - t * 0.02)).r * 0.4;
            float a = smoothstep(1.0, 0.2, abs(x)) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.3, 0.75, n);
            vec3 c = mix(vec3(0.9, 0.28, 0.06) * 1.6, vec3(0.16, 0.1, 0.11), smoothstep(0.0, 0.45, vUv.y));
            gl_FragColor = vec4(c * k, a * 0.85 * k); }` });
      const p = new T.Mesh(new T.PlaneGeometry(900, 2600), m); p.position.set(CONE[0] + (i - 1) * 140, craterTop + 1250, CONE[1] - i * 60); p.renderOrder = 1; scene.add(p); K.noDepth.push(p); plumes.push(p);
    }
    const ashN = K.noiseTex("v_ash", 256, 77, 5, 2.4);
    const ash = [];
    for (const [y, op, size, cx, cz, col] of [[8, 0.28, 1400, 0, 600, "#c8604a"], [16, 0.2, 2600, 200, 1600, "#a85a52"], [4, 0.24, 900, 0, -200, "#d06a40"], [30, 0.16, 3600, 0, 1200, "#7a4a52"]]) {
      const m = new T.ShaderMaterial({ uniforms: { tN: { value: ashN }, t: U.t, op: { value: op }, k: { value: 1 }, col: { value: new T.Color(col) }, sc: { value: size / 600 } }, transparent: true, depthWrite: false, side: T.DoubleSide, fog: false,
        vertexShader: "varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: `uniform sampler2D tN; uniform float t, op, k, sc; uniform vec3 col; varying vec2 vUv; varying vec3 vW;
          void main(){ vec2 q = vUv * sc; float n = texture2D(tN, q + vec2(t * 0.004, t * 0.002)).r * 0.6 + texture2D(tN, q * 2.3 - vec2(t * 0.006, 0.0)).r * 0.4;
            float a = smoothstep(0.35, 0.85, n) * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            float d = length(cameraPosition - vW); a *= smoothstep(4.0, 40.0, d);
            gl_FragColor = vec4(col * (0.35 + 0.5 * n), a * op * k); }` });
      const mesh = new T.Mesh(new T.PlaneGeometry(size, size), m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(cx, lavaY(cx, cz) + y, cz); mesh.renderOrder = 2; scene.add(mesh); K.noDepth.push(mesh); ash.push(mesh);
    }

    // ---------------------------------------------------------------- sparks rising from the lava near the ridge
    const NSP = 2400, spP = new Float32Array(NSP * 3), spR = new Float32Array(NSP);
    { const R = rng(99); const cs = [WB, EB, UP, DN].map((P) => new T.CatmullRomCurve3(P.map(([x, z]) => new T.Vector3(x, 0, z))));
      for (let i = 0; i < NSP; i++) { const c = cs[i % 4 === 3 ? (R() < 0.5 ? 0 : 1) : i % 4], u = R(); const p = c.getPointAt(u); const x = p.x + (R() - 0.5) * 20, z = p.z + (R() - 0.5) * 20; spP[i * 3] = x; spP[i * 3 + 1] = lavaY(x, z); spP[i * 3 + 2] = z; spR[i] = R(); } }
    const spG = new T.BufferGeometry(); spG.setAttribute("position", new T.BufferAttribute(spP, 3)); spG.setAttribute("aR", new T.BufferAttribute(spR, 1));
    const sparkU = { t: U.t, k: { value: 1 } };
    const sparks = new T.Points(spG, new T.ShaderMaterial({ uniforms: sparkU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: `uniform float t, k; attribute float aR; varying float vA;
        void main(){ float life = 3.0 + aR * 5.0; float ph = mod(t + aR * 37.0, life) / life; vec3 p = position;
          p.y += ph * (14.0 + aR * 40.0); p.x += sin(t * 0.7 + aR * 30.0) * 3.0 * ph + ph * 6.0; p.z += cos(t * 0.5 + aR * 20.0) * 3.0 * ph;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z;
          gl_PointSize = clamp(260.0 / d, 1.0, 7.0); vA = k * (1.0 - ph) * smoothstep(0.0, 0.08, ph) * (0.6 + 0.4 * sin(t * 13.0 + aR * 90.0)) * smoothstep(2.0, 12.0, d); }`,
      fragmentShader: "varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c)) * vA; gl_FragColor = vec4(vec3(1.0, 0.55, 0.18) * a * 3.0, a); }" }));
    sparks.frustumCulled = false; scene.add(sparks); K.noDepth.push(sparks);

    // ---------------------------------------------------------------- the hut on the crest: corrugated metal, two windows, a warm interior
    const HY = volH(HUT.x, HUT.z);
    const hut = G({ x: HUT.x, y: HY, z: HUT.z });
    const corr = K.canvasTex("v_corr", 256, 256, (g, w, h) => { g.fillStyle = "#8a8f94"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, "rgba(0,0,0,0.25)"); gr.addColorStop(0.5, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } const R = rng(3); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${90 + R() * 60},${50 + R() * 30},30,0.18)`; g.fillRect(R() * w, R() * h, 2 + R() * 8, 4 + R() * 30); } }, { repeat: true });
    corr.repeat.set(3, 1);
    const wallOut = new T.MeshStandardMaterial({ map: corr, roughness: 0.55, metalness: 0.45, envMapIntensity: 0.6 });
    const inner = mat("#a9aaa6", { rough: 0.85 }), dark = mat("#26282c", { rough: 0.6 }), steel = mat("#8d9298", { metal: 0.45, rough: 0.4 }), wood = mat("#7a5a3c", { rough: 0.65 });
    const W = HUT.w, Dp = HUT.d, Hh = HUT.h;
    const WN = { x0: -1.1, x1: 1.1, y0: 0.95, y1: 1.95 };   // north window (over the bench)
    const WS = { x0: 0.3, x1: 1.75, y0: 1.0, y1: 1.9 };     // south window (behind her, the whiteboard to its left)
    function wallWithWindow(len, ht, Wd, z, face) {   // a wall in x with a rectangular opening; face +1 = outward +z
      const parts = [[-len / 2, Wd.x0, 0, ht], [Wd.x1, len / 2, 0, ht], [Wd.x0, Wd.x1, 0, Wd.y0], [Wd.x0, Wd.x1, Wd.y1, ht]];
      for (const [a, b, c, d] of parts) { M(box(b - a, d - c, 0.1), wallOut, { x: (a + b) / 2, y: (c + d) / 2, z }, hut); M(new T.PlaneGeometry(b - a, d - c), inner, { x: (a + b) / 2, y: (c + d) / 2, z: z - face * 0.056, ry: face > 0 ? 180 : 0, cast: false }, hut); }
    }
    wallWithWindow(W, Hh, WN, -Dp / 2, -1);
    wallWithWindow(W, Hh, WS, Dp / 2, 1);
    for (const s of [-1, 1]) { M(box(0.1, Hh, Dp), wallOut, { x: s * W / 2, y: Hh / 2 }, hut); M(new T.PlaneGeometry(Dp, Hh), inner, { x: s * (W / 2 - 0.056), y: Hh / 2, ry: s > 0 ? -90 : 90, cast: false }, hut); }
    M(box(W + 0.5, 0.1, Dp + 0.6), wallOut, { y: Hh + 0.12, rx: 3 }, hut);
    M(new T.PlaneGeometry(W, Dp), mat("#c8c9c6", { rough: 0.9 }), { y: Hh - 0.01, rx: 90, cast: false }, hut);
    M(box(W, 0.05, Dp), mat("#5b5048", { rough: 0.8 }), { y: 0.025 }, hut);
    M(box(W + 0.3, 0.3, Dp + 0.3), dark, { y: -0.12 }, hut);
    const glass = new T.MeshPhysicalMaterial({ color: "#c8b8a8", roughness: 0.06, transparent: true, opacity: 0.1, envMapIntensity: 1.2, depthWrite: false, side: T.DoubleSide });
    for (const [Wd, z] of [[WN, -Dp / 2], [WS, Dp / 2]]) { M(new T.PlaneGeometry(Wd.x1 - Wd.x0, Wd.y1 - Wd.y0), glass, { x: (Wd.x0 + Wd.x1) / 2, y: (Wd.y0 + Wd.y1) / 2, z, cast: false, receive: false, nodepth: true }, hut).renderOrder = 3;
      for (const x of [Wd.x0, Wd.x1]) M(box(0.06, Wd.y1 - Wd.y0, 0.14), dark, { x, y: (Wd.y0 + Wd.y1) / 2, z }, hut); for (const y of [Wd.y0, Wd.y1]) M(box(Wd.x1 - Wd.x0 + 0.06, 0.06, 0.14), dark, { x: (Wd.x0 + Wd.x1) / 2, y, z }, hut); }
    // the door (east), antenna, solar panel, a gas sensor post
    M(box(0.06, 1.95, 0.9), mat("#b8452a", { rough: 0.5 }), { x: W / 2 + 0.05, y: 0.98, z: 0.6 }, hut);
    K.rod([-1.6, Hh, -1.2], [-1.6, Hh + 5.5, -1.2], 0.03, steel, hut, 6); M(box(0.6, 0.04, 0.04), steel, { x: -1.6, y: Hh + 5.0, z: -1.2 }, hut);
    const beacon = M(sph(0.06, 8, 6), glow("#ff2a1a", 14), { x: -1.6, y: Hh + 5.55, z: -1.2, cast: false }, hut);
    M(box(1.6, 0.05, 1.0), mat("#1b2a48", { metal: 0.4, rough: 0.3 }), { x: 1.0, y: Hh + 0.45, z: -0.3, rx: -30 }, hut);
    // the interior: warm lamp + ceiling light
    const lampL = new T.PointLight("#ffd6aa", 0, 6, 2); lampL.position.set(0.85, 1.35, -1.15); hut.add(lampL);
    lampL.castShadow = true; lampL.shadow.mapSize.set(512, 512); lampL.shadow.camera.near = 0.05; lampL.shadow.camera.far = 8; lampL.shadow.bias = -0.003; lampL.shadow.radius = 3;
    const ceilL = new T.PointLight("#e8eeff", 0, 7, 2); ceilL.position.set(0, Hh - 0.25, 0.1); hut.add(ceilL);
    const monL = new T.SpotLight("#c4d6ff", 0, 3, 0.42, 0.9, 2); monL.position.set(0.32, 1.28, -1.16); monL.target.position.set(0.1, 1.62, -0.7); hut.add(monL, monL.target);
    M(box(0.8, 0.04, 0.2), glow("#fff0d8", 2.0), { y: Hh - 0.04, z: 0.1, cast: false }, hut);
    // the instrument bench under the north window
    const bench = G({ y: 0, z: -Dp / 2 + 0.38 }, hut);
    M(box(W - 0.3, 0.05, 0.62), wood, { y: 0.78 }, bench);
    for (const x of [-1.85, 1.85]) for (const z of [-0.25, 0.25]) M(box(0.05, 0.78, 0.05), dark, { x, y: 0.39, z }, bench);
    // seismograph drum: a rotating paper drum with a pen; the trace calms (seisK) — drawn per frame into a canvas
    const seis = G({ x: -1.05, y: 0.81, z: 0.0 }, bench);
    M(box(0.6, 0.06, 0.36), dark, { y: 0.03 }, seis);
    const seisCv = document.createElement("canvas"); seisCv.width = 1024; seisCv.height = 256; const seisT = new T.CanvasTexture(seisCv); seisT.colorSpace = T.SRGBColorSpace; seisT.wrapS = T.RepeatWrapping;
    const drum = G({ y: 0.19 }, seis);
    M(new T.CylinderGeometry(0.11, 0.11, 0.44, 40, 1, true), new T.MeshStandardMaterial({ map: seisT, roughness: 0.8 }), { rz: 90 }, drum);
    for (const s of [-1, 1]) M(cyl(0.115, 0.115, 0.02, 32), steel, { x: s * 0.23, rz: 90 }, seis).position.y = 0.19;
    const penArm = G({ y: 0.19, z: 0.13 }, seis); M(box(0.012, 0.012, 0.2), steel, { z: 0.06 }, penArm); const pen = M(cyl(0.006, 0.002, 0.03, 8), mat("#c8321f"), { z: -0.04, rx: 90 }, penArm);
    let seisKey = "";
    function drawSeis(calm, phase) {
      const q = seisCv.getContext("2d"), w = 1024, h = 256; q.fillStyle = "#f3eee0"; q.fillRect(0, 0, w, h); q.strokeStyle = "rgba(60,90,140,0.35)"; q.lineWidth = 1;
      for (let y = 16; y < h; y += 32) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y); q.stroke(); }
      for (let r = 0; r < 4; r++) { const y0 = 40 + r * 58; q.strokeStyle = r === 3 ? "#b0221a" : "#1d2a44"; q.lineWidth = 2.2; q.beginPath();
        for (let x = 0; x < w; x += 2) { const xx = x + phase * 3; const amp = (r < 3 ? lerp(22, 12, r / 3) : lerp(12, 3, calm)) * (0.5 + 0.5 * Math.sin(xx * 0.013 + r)) * (0.6 + 0.4 * K.vnoise(xx * 0.05, r * 7, 5)); const y = y0 + Math.sin(xx * 0.5 + r * 3) * amp * (r === 3 ? lerp(1, 1 - x / w * 0.7, calm) : 1); x ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke(); }
      seisT.needsUpdate = true;
    }
    // the gas meter (handheld, on the bench): SO₂ display + a beeping LED
    const gas = G({ x: -0.32, y: 0.81, z: 0.08, ry: 12 }, bench);
    M(rbox(0.11, 0.05, 0.2, 0.02), mat("#e0b030", { rough: 0.5 }), { y: 0.025 }, gas);
    const gasT = K.textTex("v_gas", 256, 128, (q, w, h) => { q.fillStyle = "#0d1a10"; q.fillRect(0, 0, w, h); q.fillStyle = "#9affb8"; q.font = "700 54px KitOswald, sans-serif"; q.fillText("SO₂ 2.1", 14, 62); q.font = "600 30px KitInter, sans-serif"; q.fillText("ppm  ·  OK", 14, 106); });
    const gasScr = M(new T.PlaneGeometry(0.085, 0.045), new T.MeshBasicMaterial({ map: gasT, color: new T.Color(1.2, 1.2, 1.2) }), { y: 0.062, z: -0.03, rx: -90, cast: false }, gas);
    const gasLed = M(sph(0.007, 8, 6), glow("#ff4a2a", 1), { y: 0.06, z: 0.07, cast: false }, gas);
    // the radio scanner (channels cycle; the egg: CH 4 · FIRE TOWER · NO RESPONSE)
    const scan = G({ x: 0.35, y: 0.81, z: -0.08 }, bench);
    M(rbox(0.34, 0.13, 0.22, 0.02), dark, { y: 0.065 }, scan);
    const scanCv = document.createElement("canvas"); scanCv.width = 512; scanCv.height = 160; const scanT = new T.CanvasTexture(scanCv); scanT.colorSpace = T.SRGBColorSpace;
    const scanScr = M(new T.PlaneGeometry(0.26, 0.08), new T.MeshBasicMaterial({ map: scanT, color: new T.Color(1.3, 1.3, 1.3) }), { y: 0.075, z: 0.122, cast: false }, scan);
    const scanLed = M(sph(0.008, 8, 6), glow("#3aff6a", 1), { x: 0.13, y: 0.035, z: 0.122, cast: false }, scan);
    let scanKey = "";
    const CHS = [["CH 1 · VALLEY ROADS", "· · · scanning"], ["CH 3 · MOUNTAIN RESCUE", "NO SIGNAL"], ["CH 4 · FIRE TOWER", "NO RESPONSE"], ["CH 2 · CIVIL DEFENSE", "● INCOMING"]];
    function drawScan(i, on) { const q = scanCv.getContext("2d"); q.fillStyle = "#0a140c"; q.fillRect(0, 0, 512, 160); q.fillStyle = on ? "#ffb85a" : "#8affb4"; q.font = "700 54px KitOswald, sans-serif"; q.fillText(CHS[i][0], 16, 66); q.font = "600 40px KitInter, sans-serif"; q.fillStyle = on ? "#ff7a5a" : "#7ad89a"; q.fillText(CHS[i][1], 16, 128); scanT.needsUpdate = true; }
    // laptop with a tremor plot, the lamp, the mug (I ♥ MAGMA), the log book
    const lap = G({ x: 1.25, y: 0.81, z: 0.0, ry: -14 }, bench);
    M(box(0.34, 0.015, 0.24), dark, { y: 0.008 }, lap); const lid = G({ y: 0.015, z: -0.12, rx: -18 }, lap); M(box(0.34, 0.22, 0.012), dark, { y: 0.11 }, lid);
    const lapT = K.textTex("v_lap", 512, 320, (q, w, h) => { q.fillStyle = "#0b1420"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffb05a"; q.font = "600 24px KitInter, sans-serif"; q.fillText("TREMOR · 24 h", 16, 32); q.strokeStyle = "#ff8a3a"; q.lineWidth = 3; q.beginPath(); for (let x = 16; x < w - 16; x += 4) { const a = 70 * Math.exp(-(x - 16) / 180) + 6; q.lineTo(x, 180 + Math.sin(x * 0.7) * a * K.vnoise(x * 0.08, 1, 3)); } q.stroke(); });
    M(new T.PlaneGeometry(0.31, 0.19), new T.MeshBasicMaterial({ map: lapT, color: new T.Color(1.1, 1.1, 1.1) }), { y: 0.11, z: 0.007, cast: false }, lid);
    const lamp = G({ x: 0.85, y: 0.81, z: 0.12 }, bench); M(cyl(0.07, 0.08, 0.025, 20), dark, { y: 0.012 }, lamp); K.rod([0, 0.02, 0], [-0.04, 0.38, 0.04], 0.009, steel, lamp, 6);
    M(new T.ConeGeometry(0.09, 0.12, 22, 1, true), mat("#2a5a3a", { metal: 0.3, rough: 0.4, side: T.DoubleSide }), { x: -0.05, y: 0.42, z: 0.06, rx: 14 }, lamp);
    const bulb = M(sph(0.025, 12, 10), glow("#ffd9a0", 8), { x: -0.05, y: 0.39, z: 0.06, cast: false }, lamp);
    const mugT = K.textTex("v_mug", 256, 96, (q, w, h) => { q.fillStyle = "#f2efe8"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1a1a"; q.font = "700 50px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("I", 46, 66); q.fillStyle = "#d8261a"; q.fillText("♥", 98, 66); q.fillStyle = "#1a1a1a"; q.fillText("MAGMA", 182, 66); });
    const mugG = new T.Group(); M(new T.CylinderGeometry(0.045, 0.04, 0.1, 32, 1, true), mat("#ffffff", { map: mugT, rough: 0.4, side: T.DoubleSide }), { y: 0.05, ry: -100 }, mugG); M(cyl(0.04, 0.04, 0.005, 24), mat("#f2efe8"), { y: 0.002 }, mugG); M(new T.TorusGeometry(0.028, 0.008, 6, 14), mat("#f2efe8"), { x: 0.05, y: 0.05 }, mugG); M(cyl(0.041, 0.041, 0.005, 24), mat("#3a2414", { rough: 0.3 }), { y: 0.085 }, mugG);
    mugG.position.set(0.25, 0.81, 0.2); bench.add(mugG);
    M(box(0.3, 0.02, 0.22), mat("#2a4a7a", { rough: 0.7 }), { x: -0.05, y: 0.81, z: 0.18, ry: 8 }, bench);
    // the whiteboard on the south wall, left of the window: ERUPTION ENDING? ~3 DAYS ↓ (a plant)
    const wbT = K.textTex("v_wb", 640, 448, (q, w, h) => { q.fillStyle = "#f4f4f0"; q.fillRect(0, 0, w, h); q.strokeStyle = "#9aa0a6"; q.lineWidth = 10; q.strokeRect(5, 5, w - 10, h - 10);
      q.strokeStyle = "#2a4aa0"; q.lineWidth = 4; q.beginPath(); q.moveTo(40, 300); for (let x = 40; x < 400; x += 6) q.lineTo(x, 300 - 140 * Math.exp(-(x - 40) / 260) * (0.7 + 0.3 * Math.sin(x * 0.25))); q.stroke();
      q.fillStyle = "#1d3a8a"; q.font = "600 34px KitInter, sans-serif"; q.fillText("tremor ↓   SO₂ ↓", 40, 360); q.fillText("flow 1,150 °C", 40, 404);
      q.fillStyle = "#c8261a"; q.font = "700 62px KitOswald, sans-serif"; q.fillText("ERUPTION", 300, 120); q.fillText("ENDING?", 300, 186); q.font = "700 70px KitOswald, sans-serif"; q.fillText("~3 DAYS ↓", 300, 266);
      q.strokeStyle = "#c8261a"; q.lineWidth = 5; q.beginPath(); q.ellipse(462, 238, 160, 46, -0.04, 0, 7); q.stroke(); });
    const wb = M(new T.PlaneGeometry(0.98, 0.69), mat("#ffffff", { map: wbT, rough: 0.35 }), { x: -0.5, y: 1.5, z: Dp / 2 - 0.07, ry: 180, cast: false }, hut);
    M(box(1.02, 0.73, 0.02), steel, { x: -0.5, y: 1.5, z: Dp / 2 - 0.06 }, hut);
    // four gas masks on hooks (east wall)
    const masks = [];
    for (let k = 0; k < 4; k++) { const mg = G({ x: W / 2 - 0.08, y: 1.55, z: -0.9 + k * 0.38, ry: -90 }, hut); M(box(0.03, 0.03, 0.06), steel, { z: -0.03 }, mg);
      const face = G({ y: -0.13, z: 0.06 }, mg); M(sph(0.085, 18, 14), mat("#2b2d30", { rough: 0.55 }), { sz: 0.7 }, face);
      for (const s of [-1, 1]) M(new T.CircleGeometry(0.026, 18), new T.MeshPhysicalMaterial({ color: "#3a4a52", roughness: 0.1, clearcoat: 1 }), { x: s * 0.034, y: 0.02, z: 0.06, cast: false }, face);
      M(cyl(0.035, 0.03, 0.05, 16), mat("#4a4c50", { rough: 0.5 }), { y: -0.05, z: 0.06, rx: 70 }, face); M(cyl(0.028, 0.028, 0.03, 16), mat("#c8a020", { rough: 0.5 }), { y: -0.07, z: 0.095, rx: 70 }, face); masks.push(mg); }
    // the water tank (south-east corner) and the food shelves (west wall)
    const tank = G({ x: 1.45, y: 0, z: 1.05 }, hut);
    M(rbox(0.9, 1.0, 0.75, 0.08), new T.MeshPhysicalMaterial({ color: "#e8f0f4", roughness: 0.3, transparent: true, opacity: 0.85, clearcoat: 0.5 }), { y: 0.55 }, tank);
    M(box(0.78, 0.78, 0.62), mat("#4a8ac0", { rough: 0.2 }), { y: 0.45 }, tank);
    for (let k = 0; k < 4; k++) M(box(0.94, 0.03, 0.03), steel, { y: 0.1 + k * 0.32, z: 0.39 }, tank);
    const tkT = K.textTex("v_tank", 256, 96, (q, w, h) => { q.fillStyle = "#f2f2ee"; q.fillRect(0, 0, w, h); q.fillStyle = "#1d3a8a"; q.font = "700 52px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("WATER · 1,000 L", w / 2, 66); });
    M(new T.PlaneGeometry(0.5, 0.19), mat("#ffffff", { map: tkT, rough: 0.6 }), { y: 0.85, z: 0.43, cast: false }, tank);
    M(new T.PlaneGeometry(0.5, 0.19), mat("#ffffff", { map: tkT, rough: 0.6 }), { x: -0.5, y: 0.85, ry: -90, cast: false }, tank);
    M(new T.PlaneGeometry(0.5, 0.19), mat("#ffffff", { map: tkT, rough: 0.6 }), { y: 0.85, z: -0.43, ry: 180, cast: false }, tank);
    const shelf = G({ x: -W / 2 + 0.22, y: 0, z: 0.35, ry: 90 }, hut);
    { const R = rng(7); const pc = ["#d8b25a", "#c8462a", "#3a7a4a", "#e8e2d2", "#5a6a8a"];
      for (let s = 0; s < 4; s++) { M(box(1.5, 0.03, 0.36), wood, { y: 0.45 + s * 0.42 }, shelf); for (let k = 0; k < 11; k++) M(rbox(0.11, 0.2 + R() * 0.06, 0.05, 0.02), mat(pc[Math.floor(R() * 5)], { rough: 0.5, metal: 0.25 }), { x: -0.65 + k * 0.13, y: 0.58 + s * 0.42, z: 0.02 + (R() - 0.5) * 0.05, ry: (R() - 0.5) * 14 }, shelf); }
      for (const x of [-0.74, 0.74]) M(box(0.03, 1.8, 0.36), wood, { x, y: 0.9 }, shelf);
      const fT = K.textTex("v_food", 256, 64, (q, w, h) => { q.fillStyle = "#f2efe6"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1a1a"; q.font = "700 40px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FREEZE-DRIED", w / 2, 46); });
      M(new T.PlaneGeometry(0.4, 0.1), mat("#ffffff", { map: fT, rough: 0.6 }), { y: 1.86, z: 0.19, cast: false }, shelf); }
    // the window glow seen from outside (warm panes)
    const winOut = [];
    for (const [Wd, z, f] of [[WN, -Dp / 2 - 0.06, -1], [WS, Dp / 2 + 0.06, 1]]) { const m = M(new T.PlaneGeometry(Wd.x1 - Wd.x0, Wd.y1 - Wd.y0), new T.MeshBasicMaterial({ color: new T.Color("#ffb060").multiplyScalar(0.0), transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending }), { x: (Wd.x0 + Wd.x1) / 2, y: (Wd.y0 + Wd.y1) / 2, z, ry: f > 0 ? 0 : 180, cast: false, receive: false, nodepth: true }, hut); winOut.push(m); }

    // ---------------------------------------------------------------- the helipad + windsock on the crest; the rope bridge over the east branch
    const PY = volH(PAD[0], PAD[1]);
    const pad = G({ x: PAD[0], y: PY, z: PAD[1] });
    const padT = K.canvasTex("v_pad", 512, 512, (q, w, h) => { q.fillStyle = "#8a847c"; q.fillRect(0, 0, w, h); const R = rng(5); for (let i = 0; i < 1500; i++) { q.fillStyle = `rgba(0,0,0,${R() * 0.15})`; q.fillRect(R() * w, R() * h, 3, 3); } q.strokeStyle = "#f2efe6"; q.lineWidth = 18; q.beginPath(); q.arc(w / 2, h / 2, 200, 0, 7); q.stroke(); q.fillStyle = "#f2efe6"; q.fillRect(176, 136, 44, 240); q.fillRect(292, 136, 44, 240); q.fillRect(176, 236, 160, 40); });
    M(box(14, 0.3, 14), mat("#ffffff", { map: padT, rough: 0.8 }), { y: 0.1 }, pad);
    const padLights = []; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; padLights.push(M(sph(0.12, 8, 6), glow("#ffcf6a", 10), { x: Math.cos(a) * 7.2, y: 0.35, z: Math.sin(a) * 7.2, cast: false }, pad)); }
    const sock = G({ x: 8.5, y: 0, z: -2 }, pad);
    K.rod([0, 0, 0], [0, 5.2, 0], 0.05, steel, sock, 8);
    const sockT = K.canvasTex("v_sock", 256, 64, (q, w, h) => { for (let k = 0; k < 5; k++) { q.fillStyle = k % 2 ? "#f2efe6" : "#e8501a"; q.fillRect(k * 51, 0, 51, h); } });
    const sockPiv = G({ y: 5.0 }, sock);
    const sockG = new T.CylinderGeometry(0.28, 0.12, 1.8, 20, 6, true); sockG.rotateZ(Math.PI / 2); sockG.translate(0.9, 0, 0);
    const sockM = M(sockG, mat("#ffffff", { map: sockT, rough: 0.8, side: T.DoubleSide }), {}, sockPiv);
    // the rope bridge: two hand ropes + two foot ropes with planks, from the ridge (x0) to the far bank (x1)
    const bridge = G({});
    const by0 = volH(BR.x0, BR.z) + 1.6, by1 = volH(BR.x1, BR.z) + 1.6;
    const ropeM = mat("#4a3a26", { rough: 0.95 }), plankM = mat("#2e2218", { rough: 0.9 });
    const planks = [], sag = (u) => -Math.sin(Math.PI * u) * 2.2;
    const N_PL = 120;
    for (let i = 0; i < N_PL; i++) { const u = (i + 0.5) / N_PL; const pg = G({}, bridge); M(box(0.3, 0.05, 1.1), plankM, {}, pg); const fl = M(box(0.32, 0.4, 1.0), glow("#ff7a1e", 0, { add: true, opacity: 1 }), { y: 0.22, cast: false, receive: false, nodepth: true }, pg); planks.push({ g: pg, u, fl }); }
    const ropes = [];
    for (const [dz, dy] of [[-0.55, 0], [0.55, 0], [-0.6, 1.0], [0.6, 1.0]]) { const r = M(cyl(0.025, 0.025, 1, 6), ropeM, {}, bridge); ropes.push({ r, dz, dy }); }
    for (const x of [BR.x0, BR.x1]) for (const dz of [-0.6, 0.6]) M(cyl(0.08, 0.1, 1.6, 8), wood, { x, y: volH(x, BR.z) + 0.8, z: BR.z + dz });
    const knifeT = new T.Group(); M(box(0.012, 0.03, 0.12), mat("#c8ccd2", { metal: 0.6, rough: 0.25 }), { z: 0.07 }, knifeT); M(box(0.022, 0.028, 0.09), mat("#2a2420", { rough: 0.7 }), { z: -0.03 }, knifeT);

    // ---------------------------------------------------------------- the valley: dim towns, the floodlit tent camp; the helicopter (lights only); eyes
    const val = G({});
    const im = (geo, mtl, n) => { const m = new T.InstancedMesh(geo, mtl, n); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; val.add(m); return m; };
    { const R = rng(31), d = new T.Object3D(), c = new T.Color();
      const tg = new T.ConeGeometry(1.8, 2.2, 4, 1); tg.rotateY(Math.PI / 4); tg.translate(0, 1.1, 0);
      const tents = im(tg, new T.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, emissive: new T.Color("#ffe6c4"), emissiveIntensity: 0.03 }), 720);
      for (let i = 0; i < 720; i++) { const gx = (i % 30) - 15, gz = Math.floor(i / 30) - 12; const x = CAMP[0] + gx * 7 + (R() - 0.5) * 1.5, z = CAMP[1] + gz * 6.5 + (R() - 0.5) * 1.5; d.position.set(x, volH(x, z), z); d.rotation.y = 0; d.scale.setScalar(0.9 + R() * 0.25); d.updateMatrix(); tents.setMatrixAt(i, d.matrix); const q = R(); c.set(q < 0.5 ? "#b4b0a8" : q < 0.8 ? "#6e86a2" : "#9a8466"); tents.setColorAt(i, c); }
      tents.instanceColor.needsUpdate = true;
      const camp = { poles: [], lights: [] };
      for (let k = 0; k < 9; k++) { const x = CAMP[0] + ((k % 3) - 1) * 80, z = CAMP[1] + (Math.floor(k / 3) - 1) * 62, y = volH(x, z); K.rod([x, y, z], [x, y + 12, z], 0.12, steel, val, 6); const g = M(sph(0.6, 8, 6), glow("#f6f2ff", 12, { fog: false }), { x, y: y + 12.2, z, cast: false }, val); camp.poles.push(g);
        if (k === 1 || k === 7) { const L = new T.SpotLight("#eef0ff", 0, 300, 70 * D2R, 0.8, 1.0); L.position.set(x, y + 40, z); L.target.position.set(x, y, z); val.add(L, L.target); camp.lights.push(L); }
        addSprite("#e8ecff", 0.45, 12, val, { x, y: y + 12.2, z }); }
      { const x0 = CAMP[0] - 15 * 7 - 9, x1 = CAMP[0] + 14 * 7 + 9, z0 = CAMP[1] - 12 * 6.5 - 9, z1 = CAMP[1] + 11 * 6.5 + 9;
        const per = [], cn = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]];
        for (let s2 = 0; s2 < 4; s2++) { const [ax, az] = cn[s2], [bx, bz] = cn[s2 + 1], L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 5); for (let k = 0; k < n; k++) per.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]); }
        const fM = new T.MeshStandardMaterial({ color: "#8a8c90", roughness: 0.6, metalness: 0.4 });
        const posts = im(new T.BoxGeometry(0.14, 2.2, 0.14).translate(0, 1.1, 0), fM, per.length), wires = im(new T.BoxGeometry(1, 0.05, 0.05), fM, per.length * 2);
        per.forEach(([x, z], k) => { d.position.set(x, volH(x, z), z); d.rotation.set(0, 0, 0); d.scale.setScalar(1); d.updateMatrix(); posts.setMatrixAt(k, d.matrix);
          const [nx, nz] = per[(k + 1) % per.length], ya = volH(x, z), yb = volH(nx, nz), L = Math.hypot(nx - x, nz - z, yb - ya);
          for (const [h2, kk] of [[0.9, 0], [1.9, 1]]) { d.position.set((x + nx) / 2, (ya + yb) / 2 + h2, (z + nz) / 2); d.rotation.set(0, -Math.atan2(nz - z, nx - x), Math.atan2(yb - ya, Math.hypot(nx - x, nz - z))); d.scale.set(L, 1, 1); d.updateMatrix(); wires.setMatrixAt(k * 2 + kk, d.matrix); } });
        for (let k = 0; k < per.length; k += 8) { const [x, z] = per[k], y = volH(x, z); K.rod([x, y, z], [x, y + 6, z], 0.08, steel, val, 6); M(sph(0.3, 8, 6), glow("#ffd9a8", 10, { fog: false }), { x, y: y + 6.1, z, cast: false }, val); addSprite("#ffd2a0", 0.35, 4, val, { x, y: y + 6.1, z }); } }
      // towns: scattered dim lights in the valley beyond the camp
      const tl = im(new T.SphereGeometry(0.9, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff }), 700);
      for (let i = 0; i < 700; i++) { const cx = [[-700, 2600], [900, 3000], [-200, 3600]][i % 3]; const x = cx[0] + (R() - 0.5) * 420, z = cx[1] + (R() - 0.5) * 360; d.position.set(x, volH(x, z) + 2 + R() * 4, z); d.scale.setScalar(0.8 + R()); d.updateMatrix(); tl.setMatrixAt(i, d.matrix); c.set(R() < 0.7 ? "#ffc880" : "#fff0d8").multiplyScalar(6); tl.setColorAt(i, c); }
      tl.instanceColor.needsUpdate = true;
      val.userData.camp = camp; }
    const heli = G({});
    const hLand = M(sph(0.5, 10, 8), glow("#fff6e6", 30, { fog: false }), { y: -1.0, z: 2.5, cast: false }, heli);
    const hR = M(sph(0.25, 8, 6), glow("#ff2a1a", 22, { fog: false }), { x: -1.6, cast: false }, heli), hG = M(sph(0.25, 8, 6), glow("#2aff6a", 22, { fog: false }), { x: 1.6, cast: false }, heli);
    const hStrobe = M(sph(0.3, 8, 6), glow("#ffffff", 40, { fog: false }), { y: 0.8, z: -4, cast: false }, heli);
    const hHalo = addSprite("#fff2d8", 1.2, 16, heli, { y: -1.0, z: 2.5 });
    const hBeam = new T.SpotLight("#fff4e0", 0, 400, 12 * D2R, 0.6, 1.2); hBeam.position.set(0, -1, 2.5); hBeam.target.position.set(0, -60, 30); heli.add(hBeam, hBeam.target);
    // eyes: on the far bank (east, beyond the bridge) and in the dark valley south of the lava
    const eyeM = glow("#ff2412", 16, { fog: false });
    const eyeG = sph(0.07, 8, 6), eyes = [], eg = G({});
    { const R = rng(4141);
      for (let i = 0; i < 120; i++) {
        const far = i < 70; const a = far ? [140 + R() * 120, -120 + R() * 400] : [-260 + R() * 520, 420 + R() * 500];
        const b = far ? [134 + R() * 10, BR.z - 60 + R() * 140] : [a[0] * 0.5, 380 + R() * 60];
        const p = G({}, eg); M(eyeG, eyeM, { x: -0.07, cast: false }, p); M(eyeG, eyeM, { x: 0.07, cast: false }, p);
        eyes.push({ p, a, b, appear: R(), ph: R() * 10, hy: 1.5 + R() * 0.25 }); } }
    function placeEyes(t, k, scale, gather, blink, intens) {
      eg.visible = k > 0.001; if (!eg.visible) return;
      eyeM.color.set("#ff2412").multiplyScalar(16 * intens);
      for (const e of eyes) { const on = k > e.appear, bl = blink && Math.sin(t * 2.2 + e.ph) > 0.86; e.p.visible = on && !bl;
        const x = lerp(e.a[0], e.b[0], gather), z = lerp(e.a[1], e.b[1], gather); e.p.position.set(x, volH(x, z) + e.hy, z); e.p.lookAt(0, e.p.position.y, 0); e.p.scale.setScalar(scale); }
    }

    // ---------------------------------------------------------------- per-frame state
    const tmpQ = new T.Quaternion();
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      U.t.value = t; U.crust.value = I("crustK", 0.3); U.lava.value = I("lavaI", 1); U.flow.value = I("flowK", 1);
      const li = I("lavaI", 1); lavaL.forEach((L) => (L.intensity = 900 * li * I("lavaLightK", 1)));
      craterL.intensity = 2.5e4 * I("craterK", 1); crater.material.color.set("#ff5a18").multiplyScalar(1.4 * I("craterK", 1));
      plumes.forEach((p) => { p.material.uniforms.k.value = I("plumeK", 1); p.lookAt(cam.position.x, p.position.y, cam.position.z); });
      ash.forEach((m) => (m.material.uniforms.k.value = I("ashK", 1)));
      sparkU.k.value = I("sparkK", 1);
      for (const b of bills) { b.quaternion.copy(cam.quaternion); if (b.parent && b.parent !== scene) { b.parent.getWorldQuaternion(tmpQ); b.quaternion.premultiply(tmpQ.invert()); } }
      // the hut
      lampL.intensity = 2.6 * I("lampI", 1); bulb.material.color.set("#ffd9a0").multiplyScalar(8 * clamp(I("lampI", 1), 0, 2));
      ceilL.intensity = 3.0 * I("ceilI", 1); monL.intensity = 1.3 * I("monI", 0);
      const wk = I("winK", 1); winOut.forEach((m) => { m.material.opacity = 1; m.material.color.set("#ffb060").multiplyScalar(0.55 * wk); });
      beacon.visible = Math.sin(t * 3.0) > 0.3;
      // seismograph: the drum turns; the trace calms
      drum.rotation.x = -(I("drumT", t)) * 0.35; const sk = Math.round(I("seisK", 0.5) * 20) + ":" + Math.floor(t * 6); if (sk !== seisKey) { seisKey = sk; drawSeis(I("seisK", 0.5), t * 6); }
      penArm.rotation.y = Math.sin(t * 23) * 0.05 * lerp(1, 0.3, I("seisK", 0.5));
      // gas meter beeps; scanner channel
      const gk = I("gasK", 0); gasLed.material.color.set("#ff4a2a").multiplyScalar(0.6 + 14 * gk * (Math.sin(t * 12) > 0 ? 1 : 0)); gasScr.material.color.setScalar(0.4 + 0.9 * clamp(gk + 0.3, 0, 1));
      const ch = I("scanCh", 0) | 0, on = ch === 3; const kk = ch + ":" + on; if (kk !== scanKey) { scanKey = kk; drawScan(ch, on); }
      scanLed.material.color.set(on ? "#ff4a2a" : "#3aff6a").multiplyScalar(2 + 10 * (Math.sin(t * 8) > 0 ? 1 : 0.2));
      // the windsock swings
      sockPiv.rotation.y = 0.9 + Math.sin(t * 0.6) * 0.25; sockPiv.rotation.z = -0.15 + Math.sin(t * 1.3) * 0.06 * I("sockK", 1); sockM.scale.set(1, 1 + Math.sin(t * 2.1) * 0.04, 1);
      padLights.forEach((m, i) => (m.visible = I("padK", 1) > 0.5 && Math.sin(t * 2 + i * 0.4) > -0.6));
      // the bridge: intact; cut -> the ridge end lets go, the bridge swings down into the lava and flares
      const br = st.bridge || {}; const drop = clamp(br.drop || 0, 0, 1), burn = clamp(br.burn || 0, 0, 1);
      for (const p of planks) {
        const u = p.u; const x = lerp(BR.x0, BR.x1, u);
        // hanging from the far end once cut: rotate about the far anchor toward vertical
        const L = (1 - u) * (BR.x1 - BR.x0), ang = drop * Math.PI * 0.5 * (0.55 + 0.45 * (1 - u));
        const yN = lerp(by0, by1, u) + sag(u) * (1 - drop);
        const xD = BR.x1 - Math.cos(ang) * L, yD = by1 - Math.sin(ang) * L * 0.9 + sag(u) * (1 - drop);
        p.g.position.set(lerp(x, xD, drop), Math.max(lerp(yN, yD, drop), lavaY(x, BR.z) - 0.8), BR.z);
        p.g.rotation.z = drop * (0.4 + 0.8 * (1 - u)) + Math.sin(t * 3 + u * 9) * 0.04 * drop;
        const f = burn * ss((lavaY(x, BR.z) + 6 - p.g.position.y) / 6); p.fl.material.opacity = 1; p.fl.visible = f > 0.02; const fk = I("flameK", 1); p.fl.scale.set(1.3 * fk, (0.6 + f * (3.2 + Math.sin(t * 17 + u * 40) * 0.9)) * fk, 1.2 * fk);
        p.fl.material.color.set("#ff7a1e").multiplyScalar(7 * f);
      }
      const pt = (u, dy, dz) => { const x = lerp(BR.x0, BR.x1, u); const L = (1 - u) * (BR.x1 - BR.x0), ang = drop * Math.PI * 0.5 * (0.55 + 0.45 * (1 - u)); const yN = lerp(by0, by1, u) + sag(u) * (1 - drop) + dy; const xD = BR.x1 - Math.cos(ang) * L, yD = by1 - Math.sin(ang) * L * 0.9 + sag(u) * (1 - drop) + dy; return new T.Vector3(lerp(x, xD, drop), Math.max(lerp(yN, yD, drop), lavaY(x, BR.z) - 0.8), BR.z + dz); };
      for (const r of ropes) { const a = pt(0.0, r.dy, r.dz), b = pt(1.0, r.dy, r.dz), m = pt(0.5, r.dy, r.dz); const A = (br.cut && r.dy > 0) ? a : a; void A;
        r.r.position.copy(a).add(b).multiplyScalar(0.5).lerp(m, 0.5); const dvec = b.clone().sub(a); r.r.scale.set(1, dvec.length(), 1); r.r.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dvec.normalize()); }
      // helicopter (lights): position + yaw from the state
      const hk = I("heliK", 0); heli.visible = hk > 0.01; if (heli.visible) { heli.position.fromArray(st.heliP || [0, 120, 900]); heli.rotation.set(0, (st.heliYaw || 0) * D2R, 0); hStrobe.visible = Math.sin(t * 7) > 0.6; hBeam.intensity = 4e4 * I("heliBeam", 0); const lk = I("heliLand", 1); hLand.material.color.set("#fff6e6").multiplyScalar(30 * lk + 0.5); hHalo.material.opacity = 1; hHalo.scale.setScalar(16 * lk + 2); }
      // the camp floodlights
      const ck = I("campK", 1); val.userData.camp.lights.forEach((L) => (L.intensity = 700 * ck)); val.visible = I("valK", 1) > 0.01;
      placeEyes(t, I("eyesK", 0), I("eyesScale", 1), I("eyesGather", 0), I("eyesBlink", 0) > 0.5, I("eyesI", 1));
    });
    drawSeis(0.5, 0); drawScan(0, false);
    return { hut, bench, seis, gas, scan, lap, lamp, mugG, wb, masks, tank, shelf, pad, sock, bridge, planks, heli, val, eyes, rivers, knifeT,
      P: { HUT, HY, PAD, PY, BR, CAMP, CONE, WN, WS, UP, WB, EB, DN, W, Dp, Hh, by0, by1 }, volH, lavaY, chan };
  }

  // ---------------------------------------------------------------- Leila: the Hazel v2 rig with her own face, a dark copper braid, an orange coverall
  const LEILA = { skin: "#8c6444", earIn: "#62402c", lip: "#7a4638", brow: "#140e0b", iris: [[92, 122, 66], [46, 70, 38]],
    face: { w: 0.9, len: 1.19, jaw: 0.36, chin: 0.24, cheek: 0.0085, cheekX: 0.054, blush: 0.3, eyeS: 0.95, eyeX: 0.031, eyeY: 0.014, bridge: 0.86, nostrils: 0.86, noseTip: 0.9, noseL: 1.2, noseY: -0.0004, lipT: 0.95, browY: 0.002, browLift: 0.0045, browT: 0.95 },
    jacket: "#e2521c", jacketSheen: "#ffb08a", jacketRough: 0.72, trim: "#c4c8cc", trimSheen: "#ffffff", seam: "#a83a12", pants: "#e2521c", pantsSheen: "#ffb08a",
    boot: "#2a2622", sole: "#141210", under: "#2c2a28", hair: "#1c1410", hairStreaks: ["rgba(6,4,3,0.45)", "rgba(52,36,26,0.35)", "rgba(84,56,38,0.3)"], hairSheen: "#9a8474", tie: "#1c1410", pony: false, chestPocket: true };
  function dressLeila(K, hz, Vo) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat;
    hz.head.children.forEach((o) => { if (o.isMesh && (o.material === hz.mats.hairM || o.material === hz.mats.hairTubeM)) o.visible = false; });
    const head = hz.head;
    // freckles over the nose and cheeks (a map on the face skin)
    const frT = K.canvasTex("leila_frk", 1024, 512, (q, w, h) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, w, h); const R = K.rng(12); for (let i = 0; i < 120; i++) { const u = 0.25 + (R() - 0.5) * 0.13, v = 0.455 + (R() - 0.5) * 0.07; if (Math.abs(u - 0.25) < 0.012 && v > 0.47) continue; q.fillStyle = `rgba(70,40,26,${0.14 + R() * 0.2})`; q.beginPath(); q.arc(u * w, (1 - v) * h, 0.5 + R() * 0.8, 0, 7); q.fill(); } });
    const headMesh = head.children.find((o) => o.isMesh && o.material && o.material.vertexColors);
    if (headMesh) { headMesh.material.map = frT; headMesh.material.needsUpdate = true; }
    const hairCol = K.canvasTex("leila_hair2", 512, 32, (g, w, h) => { const R = K.rng(23); g.fillStyle = "#1c1410"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 520; i++) { const v = R(); g.fillStyle = v < 0.45 ? "rgba(6,4,3,0.45)" : v < 0.85 ? "rgba(52,36,26,0.35)" : "rgba(84,56,38,0.3)"; g.fillRect(R() * w, 0, 1 + R() * 2, h); }
      for (let i = 0; i < 140; i++) { const x = w * (0.53 + R() * 0.07); g.fillStyle = R() < 0.6 ? "rgba(104,66,40,0.6)" : "rgba(132,86,52,0.5)"; g.fillRect(x, 0, 1 + R() * 2, h); } }, { repeat: true });
    const hairM = K.pmat("#ffffff", { rough: 0.4, sheen: 0.85, sheenColor: "#9a8474", sheenRough: 0.32, normalMap: K.nmap(K.normals().strand, 1, 1), ns: 0.3, map: hairCol });
    // smooth hair pulled back from a centre parting (no fringe)
    const FW = hz.FC.w, FL = hz.FC.len, FJ = hz.FC.jaw;
    const line0 = (az) => { const a = Math.abs(az); return a < 0.35 ? lerp(0.8, 0.76, a / 0.35) : a < 1.3 ? lerp(0.76, 0.3, (a - 0.35) / 0.95) : a < 2.2 ? lerp(0.3, -0.42, (a - 1.3) / 0.9) : lerp(-0.42, -0.7, (a - 2.2) / 0.94); };
    const line = (az) => { let s = 0; for (let k = -4; k <= 4; k++) s += line0(az + k * 0.07); return s / 9; };      // corners rounded
    const capG = new T.BufferGeometry(); {
      const NA = 240, NR = 56, pos = [], uvs = [], idx = [];
      for (let j = 0; j <= NA; j++) { const az = -Math.PI + (j / NA) * Math.PI * 2, th1 = Math.acos(clamp(line(az), -1, 1));
        for (let i = 0; i <= NR; i++) { const f = i / NR, th = th1 * f, y = Math.cos(th), r = Math.sin(th), x = Math.sin(az) * r, z = Math.cos(az) * r;
          const part = Math.exp(-Math.pow(x / 0.035, 2)) * K.sstep(-0.2, 0.3, z) * K.sstep(0.4, 0.7, y);
          let v = 0.03 + 0.006 * Math.abs(Math.sin(az * 14 + y * 4)) * K.sstep(0.6, 0.0, y) - 0.015 * part + 0.03 * K.sstep(-0.1, -0.6, z) * K.sstep(0.2, -0.3, y);
          v = 0.008 + (v - 0.008) * K.sstep(1.0, 0.8, f);                                                 // soft edge: thin at the hairline
          // the head's own sculpt (jaw taper, cranium, forehead) so the edge sits on the skin all round
          const sx = 1 - FJ * K.sstep(0.05, -0.9, y); let X = x, Y = y, Z = z;
          if (Z < 0) { Z *= 1.1; Y *= 1.02; } if (Z > 0 && y > 0.15) Z *= 0.97;
          pos.push(X * sx * FW * 0.1 * (1 + v), Y * FL * 0.1 * (1 + v), Z * 0.1 * (1 + v)); uvs.push(j / NA, f); } }
      const S = NR + 1; for (let j = 0; j < NA; j++) for (let i = 0; i < NR; i++) { const a = j * S + i, b = (j + 1) * S + i; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      capG.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); capG.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2)); capG.setIndex(idx); capG.computeVertexNormals();
      const nr = capG.attributes.normal; for (let j = 0; j <= NA; j++) nr.setXYZ(j * S, 0, 1, 0);       // the crown pole
      for (let i = 0; i <= NR; i++) { const a = i, b = NA * S + i; const nx = nr.getX(a) + nr.getX(b), ny = nr.getY(a) + nr.getY(b), nz = nr.getZ(a) + nr.getZ(b), l = Math.hypot(nx, ny, nz) || 1; nr.setXYZ(a, nx / l, ny / l, nz / l); nr.setXYZ(b, nx / l, ny / l, nz / l); } }
    M(capG, hairM, { y: 0.1 }, head);
    // (a headband was tried: it read as a helmet strap)
    if (false) { const pts = []; for (let k = 0; k <= 48; k++) { const az = -Math.PI + (k / 48) * Math.PI * 2; const yy = 0.52 - 0.18 * Math.cos(az); const r = Math.sqrt(Math.max(0, 1 - yy * yy)) * 1.075; pts.push([Math.sin(az) * r * 0.1 * 0.88, yy * 0.1 * 1.17 + 0.006, Math.cos(az) * r * 0.1 * (Math.cos(az) < 0 ? 1.1 : 0.985)]); }
      M(K.tubeGeo(pts, 96, 8, () => 0.009, { squash: () => 0.45 }), K.pmat("#2c2e34", { rough: 0.9, sheen: 0.4, sheenColor: "#8a90a0" }), { y: 0.1 }, head); }
    // the braid: from the nape over her left shoulder to the chest (attached to the neck so it stays on the shoulder)
    const braid = G({}, hz.neck);
    { const path = new T.CatmullRomCurve3([[0.035, 0.16, -0.095], [0.07, 0.07, -0.085], [0.11, 0.0, -0.02], [0.115, -0.07, 0.07], [0.1, -0.17, 0.12], [0.085, -0.27, 0.13]].map((p) => new T.Vector3(...p)));
      const NL = 22, lobe = new T.SphereGeometry(1, 16, 12);
      for (let i = 0; i < NL; i++) { const u = (i + 0.5) / NL, p = path.getPointAt(u), tg = path.getTangentAt(u); const r = 0.024 * (1 - 0.45 * u) + 0.006;
        for (const s of [-1, 1]) { const m = M(lobe, hairM, { cast: i % 2 === 0 }, braid); const side = new T.Vector3(1, 0, 0).cross(tg).normalize();
          m.position.copy(p).addScaledVector(side, s * r * 0.45).addScaledVector(tg, (s > 0 ? 0.25 : -0.25) * r); m.scale.set(r * 0.85, r * 1.5, r * 0.85); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tg.clone().applyAxisAngle(side, s * 0.5).normalize()); } }
      const tipP = path.getPointAt(1); M(new T.TorusGeometry(0.012, 0.005, 6, 14), K.pmat("#2c2e34", { rough: 0.8 }), { x: tipP.x, y: tipP.y + 0.005, z: tipP.z, rx: 90 }, braid);
      M(new T.ConeGeometry(0.013, 0.05, 12), hairM, { x: tipP.x, y: tipP.y - 0.025, z: tipP.z, rx: 180 }, braid); }
    // reflective silver bands on the sleeves and legs, a black belt with a pouch, a name tape and a small volcano patch
    const sp = hz.spine, surf = hz.surf;
    const refl = K.pmat("#d8dde2", { metal: 0.55, rough: 0.22 });
    for (const a of hz.arms) { M(K.sweepGeo([[-0.17, 0.0515, 0.0535, 0], [-0.13, 0.0515, 0.0535, 0]], 22, { n: 2 }), refl, { cast: false }, a.el); M(K.sweepGeo([[-0.12, 0.0595, 0.0615, 0], [-0.085, 0.0595, 0.0615, 0]], 22, { n: 2 }), refl, { cast: false }, a.sh); }
    for (const L of hz.legs) M(K.sweepGeo([[-0.3, 0.0505, 0.0535, 0.0], [-0.26, 0.0525, 0.0555, 0.0]], 22, { n: 2 }), refl, { cast: false }, L.kn);
    M(K.sweepGeo([[-0.055, 0.16, 0.112, 0.002], [-0.02, 0.157, 0.11, 0.002]], 48, { n: 2.4 }), K.pmat("#1c1c1e", { rough: 0.6 }), {}, sp);
    { const p = surf(-0.04, 0.9, 1.04); M(K.rbox(0.07, 0.06, 0.03, 0.01), K.pmat("#2a2a2c", { rough: 0.7 }), { x: p[0], y: p[1], z: p[2], ry: 50 }, sp); }
    const tapeT = K.textTex("leila_tape", 256, 64, (q, w, h) => { q.fillStyle = "#e8e4dc"; q.fillRect(0, 0, w, h); q.fillStyle = "#1b1b1b"; q.font = "700 46px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("LEILA", w / 2, 48); });
    { const p = surf(0.3, -0.45, 1.02); M(new T.PlaneGeometry(0.08, 0.02), mat("#ffffff", { map: tapeT, rough: 0.7 }), { x: p[0], y: p[1], z: p[2] + 0.002, ry: -24, cast: false }, sp); }
    const patT = K.canvasTex("leila_patch", 128, 128, (q, w, h) => { q.fillStyle = "#1e1e22"; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.fillStyle = "#e8e4dc"; q.beginPath(); q.moveTo(22, 94); q.lineTo(52, 40); q.lineTo(76, 40); q.lineTo(106, 94); q.closePath(); q.fill(); q.fillStyle = "#ff6a1e"; q.beginPath(); q.moveTo(56, 40); q.lineTo(64, 18); q.lineTo(72, 40); q.closePath(); q.fill(); q.fillRect(58, 40, 12, 40); });
    M(new T.CircleGeometry(0.03, 24), mat("#ffffff", { map: patT, rough: 0.7 }), { x: 0.058, y: -0.08, ry: 90, cast: false }, hz.arms[1].sh);
    // tools: the mug (right hand), the radio handset (right), the knife (right), a marker (right)
    const mug = Vo.mugG.clone(); mug.position.set(0.0, -0.085, 0.045); mug.rotation.set(0, 0, 0); hz.tool("mug", mug, 0);
    const hset = new T.Group(); M(K.rbox(0.045, 0.1, 0.03, 0.012), mat("#25282b", { rough: 0.45 }), {}, hset); hset.position.set(0, -0.07, 0.03); hz.tool("handset", hset, 1);
    const knife = Vo.knifeT.clone(); knife.position.set(0, -0.08, 0.04); knife.rotation.set(-0.4, 0, 0); hz.tool("knife", knife, 0);
    const torch = new T.Group(); M(K.cyl(0.02, 0.016, 0.15, 12), mat("#2b2e31", { metal: 0.6, rough: 0.4 }), { rx: 90, z: 0.06 }, torch); M(K.sph(0.018, 10, 8), K.glow("#fff4dc", 6), { z: 0.135, sz: 0.3, cast: false }, torch); torch.position.set(0, -0.07, 0); torch.rotation.x = Math.PI / 2; hz.tool("torch", torch, 1);
    Object.assign(hz.POSES, {
      bench: { arms: [[-46, 14, -54], [-40, -12, -52]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [14, 0], curl: [60, 50] },
      mug: { arms: [[-36, 18, -128], [-30, -10, -40]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [85, 40] },
      handset: { arms: [[-30, 10, -40], [-58, -20, -136]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [3, 0], curl: [40, 85] },
      wave: { arms: [[-160, 30, -20], [-150, -40, -30]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-4, 0], curl: [20, 20] },
      wave2: { arms: [[-150, -10, -40], [-160, 10, -20]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-4, 0], curl: [20, 20] },
      cut: { arms: [[-70, 14, -60], [-64, -18, -58]], legs: [[-40, 70], [-20, 40]], hipY: 0.82, spine: [30, 0], curl: [85, 80] },
      write: { arms: [[-46, 14, -54], [-40, -12, -52]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [14, 0], curl: [70, 45] },
    });
    return { braid, tools: { mug, hset, knife, torch } };
  }

  S.volcano = volcano;
  S.volcano.CREATE = CREATE;
  S.volcano.LEILA = LEILA;
  S.volcano.dressLeila = dressLeila;
  S.volcano.dirOf = dirOf;
})();
