/* Survival Odds kit · world module "The Rig" (needs survival-kit.js v2.2 or later). A small, fictional, normally
 * unmanned gas platform 140 km out at sea on a storm night: a Gerstner sea with foam at the legs, a four-leg steel
 * jacket, two decks, the control-room module with windows, a helideck with a lit H, a flare boom with a live flame,
 * a crane, a boat-landing ladder that winches up, a generator skid, a watermaker, a storeroom; storm clouds lit orange
 * from below by the flare; rain; the coast on the horizon (town lights in sections, a heliport with a crowd at its fence,
 * red eyes along the shore); the underwater cut-away with the dead sinking past the legs; a helicopter (lights + a dark
 * airframe) and a seagull on the rail. Everything is a pure function of the state given to K.render() (seek-safe).
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.rig.CREATE));
 *   const Rg = SURVIVAL.rig(K);
 *   const hz = K.hazel(SURVIVAL.rig.MIRA); const mira = SURVIVAL.rig.dressMira(K, hz);
 *   K.render({ …kit state…, flareI, floodI, winK, crI, lampI, monI, scrK, radioK, txK, micro, waterK, jugK, storeI, utilI,
 *              heliDeckK, ladder, chain, gull, gullHead, heliK, heliP:[x,y,z], heliYaw, heliBank, coastK, coastCut, coastGlow,
 *              shoreEyesK, shoreEyeS, crowdK, rainK, cloudK, under, sinkT, deadK, swell, hat, flareShadow })
 *
 * World (metres; y up; sea level 0; north = -z): the rig at the origin, the coast 6 km north (stylised distance; the
 * script's 140 km is told by the HUD and the map), the wind and the swell from the south-west.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const dirOf = (az, el) => [Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), -Math.cos(az * D2R) * Math.cos(el * D2R)];

  // the key light: a cool storm light high in the south-west (the moon behind thin cloud, no disc); the flare is the warm key
  const CREATE = {
    moonDir: dirOf(222, 38), moonCol: "#a9b8dc", bg: "#05070b", fogCol: "#1b1f28", hemi: ["#2e3a52", "#0c0e12"],
    shadow: { half: 42, far: 420, dist: 220, center: [0, 16, 0] },
    sky: { zen: [0.006, 0.008, 0.014], hor: [0.034, 0.034, 0.042] },
    env: { zen: "#0c1018", hor: "#2c2824", mside: "#3e4a64", gnd: "#06080a" },
    look: { shadowSize: 2048 },
  };

  // ------------------------------------------------------------------ layout
  const DM = 14.0, DU = 21.0, HALF = 12.5, LEG_TOP = 13.4, SEABED = -48;
  const legC = (y) => 9 + (LEG_TOP - y) / 12;                      // |x| = |z| of a leg's centre at height y (batter 1:12)
  const MOD = { x0: -12, x1: 2, z0: -12, z1: -2, y0: DU, y1: DU + 3.5 };
  const CR = { x0: -12, x1: -3.2, z0: -12, z1: -2 };               // the control room
  const STO = { x0: -3.2, x1: 2, z0: -12, z1: -7 };                 // the storeroom
  const UTL = { x0: -3.2, x1: 2, z0: -7, z1: -2 };                  // the utility room (watermaker)
  const HD = { c: [-5.5, DU + 4.6, -7.5], r: 10.5 };                // helideck (top surface y)
  const FL_ROOT = [11.4, DU + 1.0, -11.2];
  const FL_D = (() => { const el = 40 * D2R, az = -15 * D2R; const v = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)]; return v; })();
  const FL_LEN = 34;
  const FL_TIP = [FL_ROOT[0] + FL_D[0] * FL_LEN, FL_ROOT[1] + FL_D[1] * FL_LEN, FL_ROOT[2] + FL_D[2] * FL_LEN];
  const GEN = { x0: 6.0, x1: 11.6, z0: -8.4, z1: -5.4, h: 3.2 };     // generator skid, door on the south face (z1)
  const STAIR = { x0: 2.5, x1: 3.7, zb: 0.2, zt: -6.4 };             // helideck stair: foot at zb (deck), top at zt (helideck)
  const LADDER = { x: 4.0, z: 11.95, y0: 2.4, y1: DM };              // the boat-landing ladder (fixed part)
  const COAST_Z = -6000, HELI = [700, 2.6, -6040];
  const SEAT = [-7.5, DU, -10.05];                                   // Mira's chair at the console (faces north)
  const LEGS_W = [[legC(0), legC(0)], [-legC(0), legC(0)], [legC(0), -legC(0)], [-legC(0), -legC(0)]];

  // ------------------------------------------------------------------ the swell (Gerstner): [azimuth of travel (deg, 0 = +x, - toward -z), wavelength, amplitude, steepness]
  const WAVES = [[-38, 96, 1.1, 0.6], [-52, 151, 0.8, 0.45], [-22, 61, 0.8, 0.66], [12, 44, 0.38, 0.6], [-58, 37, 0.45, 0.66], [-12, 23, 0.28, 0.6], [-72, 13.5, 0.15, 0.55], [-30, 7.5, 0.065, 0.5]];

  function rig(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox, rng = K.rng;
    K.buildSky();
    const U = { cloudGlow: { value: 1 }, refl: { value: 1 }, t: { value: 0 }, swell: { value: 1 }, foam: { value: 1 }, flareP: { value: new T.Vector3().fromArray(FL_TIP) }, flareK: { value: 1 }, under: { value: 0 }, coastK: { value: 1 } };
    const radial = K.canvasTex("rg_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const soft = K.canvasTex("rg_soft", 256, 256, (g, w, h) => { const im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - w / 2, y - h / 2) / (w / 2); const a = Math.max(0, Math.exp(-d * d * 5.5) - 0.004); const q = (y * w + x) * 4; im.data[q] = im.data[q + 1] = im.data[q + 2] = 255; im.data[q + 3] = Math.round(255 * a); } g.putImageData(im, 0, 0); });
    const nTex = K.noiseTex("rg_noise", 256, 47, 5, 2.6);
    const statics = [];          // groups baked (merged by material) at the end
    const dyn = (o) => { o.userData.dyn = true; return o; };

    // ================================================================== SEA
    const WD = WAVES.map(([az, L, A, Q]) => { const k = 2 * Math.PI / L, w = Math.sqrt(9.81 * k); return { dx: Math.cos(az * D2R), dz: Math.sin(az * D2R), k, w, A, Q: Q / (k * A * WAVES.length), L, ph: (L * 7.31) % 6.28 }; });
    const GLSL_WAVES = `
      uniform float uT, uSwell;
      const int NW = ${WD.length};
      vec4 WV[NW]; vec4 WP[NW];
      void waveInit(){ ${WD.map((v, i) => `WV[${i}] = vec4(${v.dx.toFixed(5)}, ${v.dz.toFixed(5)}, ${v.k.toFixed(5)}, ${v.w.toFixed(5)}); WP[${i}] = vec4(${v.A.toFixed(4)}, ${v.Q.toFixed(4)}, ${v.L.toFixed(2)}, ${v.ph.toFixed(3)});`).join(" ")} }
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vno(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y); }
      void gerstner(vec2 xz, out vec3 P, out vec3 N, out float crest){
        waveInit();
        float d = length(cameraPosition.xz - xz) + abs(cameraPosition.y) * 0.6;
        vec3 off = vec3(0.0); vec3 nn = vec3(0.0, 1.0, 0.0); crest = 0.0;
        for (int i = 0; i < NW; i++) {
          float L = WP[i].z; float fade = 1.0 - smoothstep(L * 10.0, L * 30.0, d);
          float am = 0.45 + 1.1 * vno(xz / (L * 3.2) + vec2(float(i) * 3.7, float(i) * 1.3) + uT * 0.004 * float(i));
          float A = WP[i].x * uSwell * fade * am; float Q = WP[i].y; vec2 D = WV[i].xy; float k = WV[i].z; float w = WV[i].w;
          float th = k * dot(D, xz) - w * uT + WP[i].w;
          float c = cos(th), s = sin(th);
          off.x += Q * A * D.x * c; off.z += Q * A * D.y * c; off.y += A * s;
          nn.x -= D.x * k * A * c; nn.z -= D.y * k * A * c; nn.y -= Q * k * A * s;
          crest += Q * k * A * s;
        }
        P = vec3(xz.x + off.x, off.y, xz.y + off.z); N = normalize(nn);
      }`;
    function seaMat(hole0, hole1) {
      const m = new T.MeshStandardMaterial({ color: "#061012", roughness: 0.18, metalness: 0, envMapIntensity: 0.3, side: T.DoubleSide });
      const uni = { uHole0: { value: new T.Vector4().fromArray(hole0 || [0, 0, -1, -1]) }, uHole1: { value: new T.Vector4().fromArray(hole1 || [0, 0, -1, -1]) } };
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, { uCoast: U.coastK, uRefl: U.refl, uT: U.t, uSwell: U.swell, uFoam: U.foam, tN: { value: nTex }, uFlare: U.flareP, uFlareK: U.flareK, uHole0: uni.uHole0, uHole1: uni.uHole1, uLegs: { value: LEGS_W.map((l) => new T.Vector2(l[0], l[1])) } });
        sh.vertexShader = GLSL_WAVES + "\nvarying vec3 vSeaW; varying float vCrest;\n" + sh.vertexShader
          .replace("#include <beginnormal_vertex>", "vec3 gP; vec3 gN; float gC; gerstner(position.xz, gP, gN, gC); vec3 objectNormal = gN; vCrest = gC;")
          .replace("#include <begin_vertex>", "vec3 transformed = gP; vSeaW = gP;");
        sh.fragmentShader = "uniform float uCoast, uRefl; uniform float uT, uFoam, uFlareK; uniform sampler2D tN; uniform vec3 uFlare; uniform vec4 uHole0, uHole1; uniform vec2 uLegs[4]; varying vec3 vSeaW; varying float vCrest;\n" + sh.fragmentShader
          .replace("void main() {", `void main() {
            if (abs(vSeaW.x - uHole0.x) < uHole0.z && abs(vSeaW.z - uHole0.y) < uHole0.w) discard;
            if (abs(vSeaW.x - uHole1.x) < uHole1.z && abs(vSeaW.z - uHole1.y) < uHole1.w) discard;
            float dCam = length(cameraPosition - vSeaW);
            vec2 q1 = vSeaW.xz * 0.045 + vec2(uT * 0.021, -uT * 0.014), q2 = vSeaW.xz * 0.13 + vec2(-uT * 0.03, -uT * 0.026);
            float n1 = texture2D(tN, q1).r, n2 = texture2D(tN, q2).r, n3 = texture2D(tN, vSeaW.xz * 0.31 + vec2(uT * 0.05, uT * 0.02)).r;
            // foam: whitecaps on the steep crests + rings round the legs (churned by the swell)
            float legF = 0.0;
            for (int i = 0; i < 4; i++) { float dl = length(vSeaW.xz - uLegs[i]) - 0.85; legF = max(legF, exp(-max(dl, 0.0) / 1.3) * (0.5 + 0.5 * sin(uT * 1.7 + float(i) * 1.9 + dl * 1.4))); }
            float foam = smoothstep(0.5, 0.85, vCrest + (n1 - 0.5) * 0.45) * smoothstep(0.45, 0.75, n2) * 0.8 + legF * smoothstep(0.42, 0.72, n2 * 0.55 + n3 * 0.55);
            foam = clamp(foam * uFoam, 0.0, 1.0) * (1.0 - smoothstep(250.0, 900.0, dCam));`)
          .replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.66, 0.68), foam * 0.85);")
          .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.85, foam);")
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            { vec2 pn = vec2(n1 - 0.5, n2 - 0.5) * 0.9 + vec2(n3 - 0.5, n1 - n2) * 0.45; float kk = (1.0 - smoothstep(40.0, 600.0, dCam)) * (1.0 - foam * 0.7);
              normal = normalize(normal + (viewMatrix * vec4(pn.x, 0.0, pn.y, 0.0)).xyz * kk * faceDirection); }`)
          .replace("#include <opaque_fragment>", `
            if (!gl_FrontFacing) {   // the surface seen from below: a dark teal ceiling, brighter straight up, the flare's glow
              vec3 V = normalize(cameraPosition - vSeaW); float up = pow(clamp(-V.y, 0.0, 1.0), 2.0);
              float fl = exp(-length(vSeaW.xz - uFlare.xz) / 60.0) * uFlareK;
              outgoingLight = vec3(0.03, 0.12, 0.13) * (0.4 + 2.2 * up) * (0.6 + 0.8 * n2) + vec3(0.35, 0.12, 0.03) * fl * (0.5 + 0.8 * n1);
            }
            else {   // the flare-lit cloud deck in the waves (analytic, so the swell reads at night)
              vec3 Vw = normalize(cameraPosition - vSeaW); vec3 Nw = normalize((vec4(normal, 0.0) * viewMatrix).xyz); vec3 Rw = reflect(-Vw, Nw);
              float fr = 0.02 + 0.98 * pow(1.0 - max(dot(Nw, Vw), 0.0), 5.0);
              vec3 sky = vec3(0.022, 0.026, 0.036);
              if (Rw.y > 0.01) { vec3 pc = vSeaW + Rw * ((290.0 - vSeaW.y) / Rw.y); float r = length(pc.xz - uFlare.xz);
                sky += vec3(1.0, 0.42, 0.13) * uFlareK * (exp(-r / 150.0) * 1.5 + exp(-r / 550.0) * 0.22) + vec3(0.9, 0.42, 0.2) * uCoast * exp(-abs(pc.z + 6000.0) / 2600.0) * 0.22; }
              outgoingLight += sky * fr * (1.0 - foam) * uRefl;
            }
            #include <opaque_fragment>`);
      };
      m.customProgramCacheKey = () => "rg_sea";
      return { m, uni };
    }
    function seaPatch(size, seg, cx, cz, holes) {
      const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
      const { m } = seaMat(holes && holes[0], holes && holes[1]);
      const mesh = M(g, m, { cast: false }); mesh.receiveShadow = true; mesh.frustumCulled = false; dyn(mesh);
      return mesh;
    }
    const COAST_SEA = [700, -5300];
    const seas = [
      seaPatch(300, 500, 0, 0),
      seaPatch(1600, 500, 0, 0, [[0, 0, 146, 146]]),
      seaPatch(6000, 500, 0, 0, [[0, 0, 796, 796]]),
      seaPatch(1600, 500, COAST_SEA[0], COAST_SEA[1]),
      seaPatch(90000, 300, 0, -20000, [[0, 0, 2996, 2996], [COAST_SEA[0], COAST_SEA[1], 796, 796]]),
    ];

    // ================================================================== CLOUDS: two layers lit orange from below by the flare
    function cloudLayer(y, scale, speed, alpha, seed) {
      const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: T.DoubleSide,
        uniforms: { tN: { value: nTex }, t: U.t, fl: U.flareP, flK: U.cloudGlow, k: { value: 1 }, coast: U.coastK, sc: { value: scale }, sp: { value: speed }, al: { value: alpha }, sd: { value: seed }, glowR: { value: 160 } },
        vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: `uniform sampler2D tN; uniform float t, k, sc, sp, al, sd, flK, coast, glowR; uniform vec3 fl; varying vec3 vW;
          void main(){
            vec2 p = vW.xz * sc + vec2(t * sp, -t * sp * 0.6) + sd;
            float n = texture2D(tN, p).r * 0.6 + texture2D(tN, p * 2.3 + 3.1).r * 0.3 + texture2D(tN, p * 5.7 - 1.7).r * 0.1;
            float dens = smoothstep(0.3, 0.66, n);
            float r = length(vW.xz - fl.xz);
            float n2 = texture2D(tN, p * 3.1 + vec2(t * sp * 2.0, 0.0) + 5.3).r;
            vec3 base = vec3(0.026, 0.029, 0.038) * (0.45 + 1.1 * n) * (0.8 + 0.4 * n2);
            vec3 glowC = vec3(1.0, 0.4, 0.12) * flK * (exp(-r / glowR) * 2.2 + exp(-r / (glowR * 3.2)) * 0.26) * (0.25 + 1.2 * n * n2);
            float cz = exp(-abs(vW.z + 6000.0) / 2600.0) * exp(-abs(vW.x - 400.0) / 5000.0);
            vec3 coastC = vec3(0.9, 0.42, 0.2) * cz * 0.38 * coast * (0.5 + 0.6 * n);
            vec3 c = base + glowC + coastC;
            float d = length(cameraPosition - vW);
            float a = dens * al * k * (1.0 - smoothstep(4000.0, 16000.0, d));
            c = mix(c, vec3(0.03, 0.032, 0.04), smoothstep(1500.0, 9000.0, d) * 0.7);
            gl_FragColor = vec4(c, a);
          }` });
      const mesh = new T.Mesh(new T.PlaneGeometry(40000, 40000), m); mesh.rotation.x = Math.PI / 2; mesh.position.set(0, y, -6000);
      mesh.renderOrder = -7; mesh.frustumCulled = false; scene.add(mesh); K.noDepth.push(mesh);
      return mesh;
    }
    const clouds = [cloudLayer(290, 0.0011, 0.004, 0.97, 0.0), cloudLayer(170, 0.0024, 0.011, 0.6, 7.3)];

    // ================================================================== RAIN: streaks round the camera (positions = f(t))
    const NR = 7000, rp = new Float32Array(NR * 2 * 3), re = new Float32Array(NR * 2), rr = new Float32Array(NR * 2);
    { const R = rng(808); for (let i = 0; i < NR; i++) { const x = R() * 60 - 30, y = R() * 40 - 10, z = R() * 60 - 30, s = R(); for (let e = 0; e < 2; e++) { rp.set([x, y, z], (i * 2 + e) * 3); re[i * 2 + e] = e; rr[i * 2 + e] = s; } } }
    const rg = new T.BufferGeometry(); rg.setAttribute("position", new T.BufferAttribute(rp, 3)); rg.setAttribute("aE", new T.BufferAttribute(re, 1)); rg.setAttribute("aR", new T.BufferAttribute(rr, 1));
    const rainM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { t: U.t, k: { value: 0 }, cam: { value: new T.Vector3() }, fl: U.flareP, flK: U.flareK },
      vertexShader: `uniform float t, k; uniform vec3 cam, fl; attribute float aE, aR; varying float vA; varying vec3 vC;
        void main(){ vec3 v = vec3(4.5, -13.0, -3.0) * (0.85 + aR * 0.3); vec3 p = position;
          p = mod(p + v * t - cam + vec3(30.0, 10.0, 30.0), vec3(60.0, 40.0, 60.0)) - vec3(30.0, 10.0, 30.0) + cam;
          p -= v * 0.045 * aE;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          float d = -mv.z; vA = k * smoothstep(0.8, 3.0, d) * (1.0 - smoothstep(14.0, 34.0, d)) * (0.35 + 0.65 * aR) * (1.0 - aE * 0.6);
          vC = mix(vec3(0.55, 0.6, 0.68), vec3(1.0, 0.62, 0.35), clamp(exp(-length(p - fl) / 45.0) * 1.6, 0.0, 1.0)); }`,
      fragmentShader: "varying float vA; varying vec3 vC; void main(){ gl_FragColor = vec4(vC * vA, vA); }" });
    const rain = new T.LineSegments(rg, rainM); rain.frustumCulled = false; scene.add(rain); K.noDepth.push(rain); dyn(rain);

    // ================================================================== MATERIALS
    const yel = mat("#c99a2c", { rough: 0.55, metal: 0.25 }), yelR = mat("#d6a72a", { rough: 0.5, metal: 0.2 });
    const steel = mat("#7d858c", { rough: 0.5, metal: 0.35 }), dark = mat("#2a2e33", { rough: 0.6, metal: 0.3 }), white = mat("#d9dcd8", { rough: 0.6 });
    const growth = mat("#25302a", { rough: 0.95 }), redM = mat("#b8321f", { rough: 0.5, metal: 0.2 }), greenM = mat("#2f7a3e", { rough: 0.5 });
    const grateT = K.canvasTex("rg_grate", 128, 128, (q, w, h) => { q.fillStyle = "#3b3f43"; q.fillRect(0, 0, w, h); q.fillStyle = "#666c72"; for (let x = 0; x < w; x += 8) q.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 32) q.fillRect(0, y, w, 2); q.fillStyle = "rgba(0,0,0,0.25)"; for (let i = 0; i < 400; i++) q.fillRect(Math.random() * w, Math.random() * h, 2, 2); }, { repeat: true });
    const grateM = new T.MeshStandardMaterial({ map: grateT, color: "#9aa0a4", roughness: 0.7, metalness: 0.3 }); grateT.repeat.set(12, 12);
    const plateT = K.canvasTex("rg_plate", 256, 256, (q, w, h) => { q.fillStyle = "#4f565b"; q.fillRect(0, 0, w, h); const R = rng(5); for (let i = 0; i < 2500; i++) { q.fillStyle = R() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.09)"; q.fillRect(R() * w, R() * h, 2 + R() * 4, 1 + R() * 2); } q.strokeStyle = "rgba(0,0,0,0.35)"; q.lineWidth = 2; q.strokeRect(1, 1, w - 2, h - 2); q.fillStyle = "rgba(220,180,40,0.55)"; q.fillRect(0, h - 10, w, 6); }, { repeat: true });
    const plateM = new T.MeshStandardMaterial({ map: plateT, color: "#ffffff", roughness: 0.75, metalness: 0.25 }); plateT.repeat.set(6, 6);
    const panelT = K.canvasTex("rg_panel", 256, 256, (q, w, h) => { q.fillStyle = "#d8dbd6"; q.fillRect(0, 0, w, h); const R = rng(9); for (let i = 0; i < 1200; i++) { q.fillStyle = R() < 0.5 ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"; q.fillRect(R() * w, R() * h, 2, 2); } q.fillStyle = "rgba(0,0,0,0.22)"; for (let k = 0; k <= 4; k++) q.fillRect(k * 64 - 1, 0, 2, h); q.fillStyle = "rgba(90,60,30,0.12)"; for (let k = 0; k < 14; k++) q.fillRect(R() * w, 0, 3, h * (0.3 + R() * 0.7)); }, { repeat: true });
    const panelM = new T.MeshStandardMaterial({ map: panelT, color: "#ffffff", roughness: 0.55, metalness: 0.15 }); panelT.repeat.set(4, 1);

    // ================================================================== JACKET (four battered legs, frames, X braces, conductors, boat landing)
    const jk = G({}); statics.push(jk);
    const legPts = (sx, sz, y) => [sx * legC(y), y, sz * legC(y)];
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      K.rod(legPts(sx, sz, SEABED), legPts(sx, sz, -1.2), 0.78, growth, jk, 18);
      K.rod(legPts(sx, sz, -1.2), legPts(sx, sz, LEG_TOP + 0.4), 0.78, yel, jk, 18);
      K.rod(legPts(sx, sz, DM), legPts(sx, sz, DU), 0.62, yel, jk, 16);          // deck legs between the decks
      M(cyl(0.95, 0.95, 0.5, 18), dark, { x: sx * legC(LEG_TOP), y: LEG_TOP + 0.2, z: sz * legC(LEG_TOP) }, jk);
    }
    const LV = [10, -6, -22, -38];
    const faces = [[[1, 1], [-1, 1]], [[1, -1], [-1, -1]], [[1, 1], [1, -1]], [[-1, 1], [-1, -1]]];
    for (let li = 0; li < LV.length; li++) {
      const y = LV[li], m = y < -1 ? growth : yel;
      for (const [a, b] of faces) K.rod(legPts(a[0], a[1], y), legPts(b[0], b[1], y), 0.34, m, jk, 10);
      K.rod(legPts(1, 1, y), legPts(-1, -1, y), 0.26, m, jk, 8);
      if (li < LV.length - 1) {
        const y2 = LV[li + 1], m2 = y2 < -1 && y < -1 ? growth : y2 < -1 ? growth : yel;
        for (const [a, b] of faces) { K.rod(legPts(a[0], a[1], y), legPts(b[0], b[1], y2), 0.27, m2, jk, 8); K.rod(legPts(b[0], b[1], y), legPts(a[0], a[1], y2), 0.27, m2, jk, 8); }
      }
    }
    for (const [a, b] of faces) { K.rod(legPts(a[0], a[1], 10), legPts(b[0], b[1], LEG_TOP), 0.24, yel, jk, 8); }
    for (const [cx, cz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { K.rod([cx, SEABED, cz], [cx, -1.2, cz], 0.36, growth, jk, 12); K.rod([cx, -1.2, cz], [cx, DM + 0.3, cz], 0.36, steel, jk, 12); }
    K.rod([legC(0) + 0.9, SEABED, legC(0) - 1.4], [legC(LEG_TOP) + 0.9, DM, legC(LEG_TOP) - 1.4], 0.22, steel, jk, 8);   // a riser up the SE leg
    // boat landing on the south face: a grating platform, bumper tubes, the fixed caged ladder up to the main deck
    const bl = G({ x: LADDER.x, y: 0, z: 0 }, jk);
    M(box(4.6, 0.25, 1.9), grateM, { y: LADDER.y0, z: 11.0 }, bl);
    for (const dx of [-2.1, -0.7, 0.7, 2.1]) K.rod([dx, -3.5, 12.0], [dx, 4.2, 12.0], 0.13, yelR, bl, 8);
    K.rod([-2.3, 4.2, 12.0], [2.3, 4.2, 12.0], 0.13, yelR, bl, 8); K.rod([-2.3, 0.6, 12.0], [2.3, 0.6, 12.0], 0.13, yelR, bl, 8);
    for (const dx of [-2.1, 2.1]) K.rod([dx, LADDER.y0, 10.2], [dx, LADDER.y0, 11.9], 0.1, yel, bl, 6);
    for (const s of [-0.28, 0.28]) K.rod([s, LADDER.y0, LADDER.z], [s, DM + 1.1, LADDER.z], 0.035, yelR, bl, 6);
    for (let y = LADDER.y0 + 0.3; y < DM; y += 0.3) M(cyl(0.018, 0.018, 0.56, 6), yelR, { y, z: LADDER.z, rz: 90 }, bl);
    for (let y = 5.5; y < DM; y += 1.1) { const pts = []; for (let a = 0; a <= 180; a += 15) pts.push([Math.cos(a * D2R) * 0.42, y, LADDER.z + Math.sin(a * D2R) * 0.55]); M(K.tubeGeo(pts, 12, 4, () => 0.02), yel, {}, bl); }
    for (const a of [20, 90, 160]) K.rod([Math.cos(a * D2R) * 0.42, 5.5, LADDER.z + Math.sin(a * D2R) * 0.55], [Math.cos(a * D2R) * 0.42, DM, LADDER.z + Math.sin(a * D2R) * 0.55], 0.02, yel, bl, 4);
    // the retractable lower section (st.ladder 0 = down in the sea, 1 = winched up 8 m), its cable and the winch on the deck edge
    const lad = dyn(G({ x: LADDER.x, z: LADDER.z + 0.16 }));
    for (const s of [-0.25, 0.25]) M(cyl(0.035, 0.035, 7.2, 6), yelR, { x: s, y: 3.6 }, lad);
    for (let y = 0.2; y < 7.2; y += 0.3) M(cyl(0.018, 0.018, 0.5, 6), yelR, { y, rz: 90 }, lad);
    const ladCable = dyn(M(cyl(0.012, 0.012, 1, 4), dark, { x: LADDER.x, z: LADDER.z + 0.16 }));
    const winch = G({ x: LADDER.x + 1.2, y: DM, z: 11.6 }); statics.push(winch);
    M(box(0.9, 0.5, 0.6), redM, { y: 0.4 }, winch); M(cyl(0.22, 0.22, 0.7, 16), dark, { y: 0.75, rz: 90 }, winch);
    const crank = dyn(G({ x: LADDER.x + 1.6, y: DM + 0.75, z: 11.6 })); M(box(0.05, 0.36, 0.05), steel, { y: 0.18 }, crank); M(cyl(0.025, 0.025, 0.18, 6), dark, { y: 0.36, x: 0.09, rz: 90 }, crank);

    // ================================================================== DECKS (main + upper), beams, handrails, stairs
    const dk = G({}); statics.push(dk);
    for (const y of [DM, DU]) {
      M(box(HALF * 2, 0.35, HALF * 2), plateM, { y: y - 0.175 }, dk);
      for (let k = -2; k <= 2; k++) { M(box(HALF * 2, 0.9, 0.35), dark, { y: y - 0.8, z: k * 5.6 }, dk); M(box(0.35, 0.9, HALF * 2), dark, { y: y - 0.8, x: k * 5.6 }, dk); }
    }
    function rail(a, b, y, m, g) {   // a handrail along a straight edge: posts every 1.5 m, two rails, a toe board
      const A = new T.Vector3(a[0], y, a[1]), B = new T.Vector3(b[0], y, b[1]), L = A.distanceTo(B), n = Math.max(1, Math.round(L / 1.5));
      for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); M(cyl(0.03, 0.03, 1.1, 6), m, { x: p.x, y: y + 0.55, z: p.z }, g); }
      K.rod([a[0], y + 1.08, a[1]], [b[0], y + 1.08, b[1]], 0.03, m, g, 6); K.rod([a[0], y + 0.55, a[1]], [b[0], y + 0.55, b[1]], 0.022, m, g, 6);
      const tb = M(box(L, 0.12, 0.012), m, { x: (a[0] + b[0]) / 2, y: y + 0.06, z: (a[1] + b[1]) / 2 }, g); tb.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
    const E = HALF - 0.1;
    for (const y of [DM, DU]) { rail([-E, E], [E, E], y, yelR, dk); rail([E, E], [E, -E], y, yelR, dk); rail([-E, -E], [-E, E], y, yelR, dk); rail([-E, -E], [E, -E], y, yelR, dk); }
    // stair between the decks (south-west corner)
    { const st_ = G({ x: -10.4, z: 6 }, dk); for (let i = 0; i < 20; i++) M(box(1.1, 0.06, 0.3), grateM, { y: DM + 0.35 * (i + 1), z: -i * 0.28 }, st_); for (const s of [-0.58, 0.58]) K.rod([s, DM + 1.1, 0.3], [s, DU + 1.0, -5.6], 0.03, yelR, st_, 6); }

    // ================================================================== MAIN-DECK EQUIPMENT (wellheads, pipework, tanks, pig launcher)
    const eq = G({}); statics.push(eq);
    for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) {
      const w = G({ x, y: DM, z }, eq);
      M(cyl(0.35, 0.4, 0.6, 14), steel, { y: 0.3 }, w); M(cyl(0.22, 0.22, 1.6, 12), steel, { y: 1.3 }, w);
      for (const y of [0.9, 1.5, 2.0]) { M(box(0.62, 0.3, 0.3), redM, { y }, w); M(new T.TorusGeometry(0.16, 0.025, 6, 16), y === 1.5 ? greenM : redM, { y, x: 0.42, ry: 90 }, w); }
      K.rod([0, 1.5, 0], [x > 0 ? 3.5 : -3.5, 1.5, 0], 0.09, steel, w, 8);
    }
    for (let k = 0; k < 5; k++) K.rod([-11, DM + 0.5 + k * 0.32, -4 + k * 0.5], [11, DM + 0.5 + k * 0.32, -4 + k * 0.5], 0.1, k % 2 ? steel : mat("#5f6a3c", { rough: 0.6 }), eq, 8);
    for (const [x, z] of [[8, 6], [8, 9.2]]) { M(cyl(1.2, 1.2, 4.6, 20), white, { x, y: DM + 2.3, z }, eq); M(sph(1.2, 20, 10), white, { x, y: DM + 4.6, z, sy: 0.4 }, eq); }
    M(cyl(0.45, 0.45, 6, 16), steel, { x: -7, y: DM + 1.0, z: 8, rz: 90 }, eq); M(cyl(0.6, 0.6, 0.3, 16), redM, { x: -10.1, y: DM + 1.0, z: 8, rz: 90 }, eq);
    M(box(3, 2.6, 2.2), mat("#7d8a92", { rough: 0.6, metal: 0.3 }), { x: 6, y: DM + 1.3, z: -8 }, eq);   // a switchgear room
    M(box(2.4, 2.2, 2.4), mat("#3d6b8a", { rough: 0.6 }), { x: -7, y: DM + 1.1, z: -8 }, eq);

    // ================================================================== THE MODULE (control room, storeroom, utility) on the upper deck
    const mod = G({}); statics.push(mod);
    const glassM = new T.MeshPhysicalMaterial({ color: "#9fb4c4", roughness: 0.04, transparent: true, opacity: 0.1, envMapIntensity: 1.3, depthWrite: false, side: T.DoubleSide });
    const H = MOD.y1 - MOD.y0, yc = (MOD.y0 + MOD.y1) / 2;
    const WINS_N = [-10.4, -8.2, -6.0, -3.9], WIN_W = 1.7, WY0 = DU + 1.0, WY1 = DU + 2.3;
    function wallWithWindows(axis, c, from, to, wins, m, g, thick) {   // a wall slab along x (axis "x", at z = c) or along z, with window openings
      const segs = []; let p = from; for (const w of wins) { segs.push([p, w - WIN_W / 2]); p = w + WIN_W / 2; } segs.push([p, to]);
      const place = (a, b, y0, y1) => { const L = b - a; if (L <= 0.01) return; const mid = (a + b) / 2, hh = y1 - y0; M(axis === "x" ? box(L, hh, thick) : box(thick, hh, L), m, axis === "x" ? { x: mid, y: (y0 + y1) / 2, z: c } : { x: c, y: (y0 + y1) / 2, z: mid }, g); };
      for (const [a, b] of segs) place(a, b, MOD.y0, MOD.y1);
      for (const w of wins) { place(w - WIN_W / 2, w + WIN_W / 2, MOD.y0, WY0); place(w - WIN_W / 2, w + WIN_W / 2, WY1, MOD.y1); }
    }
    const outM = panelM;
    wallWithWindows("x", MOD.z0, MOD.x0, MOD.x1, WINS_N, outM, mod, 0.22);              // north wall (the sea and the coast)
    wallWithWindows("z", MOD.x0, MOD.z0, MOD.z1, [], outM, mod, 0.22);                    // west wall (the wall screen inside)
    wallWithWindows("x", MOD.z1, MOD.x0, MOD.x1, [-10.2, -4.6], outM, mod, 0.22);        // south wall (the windows are behind the screen wall: blinds)
    M(box(0.22, H, MOD.z1 - MOD.z0), outM, { x: MOD.x1, y: yc, z: (MOD.z0 + MOD.z1) / 2 }, mod);   // east wall
    M(box(MOD.x1 - MOD.x0 + 0.4, 0.3, MOD.z1 - MOD.z0 + 0.4), mat("#a9ada8", { rough: 0.7 }), { x: (MOD.x0 + MOD.x1) / 2, y: MOD.y1 + 0.15, z: (MOD.z0 + MOD.z1) / 2 }, mod);
    for (const z of [MOD.z0 - 0.12, MOD.z1 + 0.12]) M(box(MOD.x1 - MOD.x0 + 0.3, 0.16, 0.05), mat("#b8321f", { rough: 0.6 }), { x: (MOD.x0 + MOD.x1) / 2, y: MOD.y1 - 0.25, z }, mod);
    const winGlass = [];
    for (const x of WINS_N) { winGlass.push(M(new T.PlaneGeometry(WIN_W, WY1 - WY0), glassM, { x, y: (WY0 + WY1) / 2, z: MOD.z0, cast: false, receive: false, nodepth: true }, mod)); for (const dx of [-WIN_W / 2, WIN_W / 2]) M(box(0.08, WY1 - WY0, 0.3), dark, { x: x + dx, y: (WY0 + WY1) / 2, z: MOD.z0 }, mod); for (const y of [WY0, WY1]) M(box(WIN_W + 0.08, 0.08, 0.3), dark, { x, y, z: MOD.z0 }, mod); }
    // a warm glow just inside the north and west windows, for exterior shots (st.winK; 0 inside)
    const winGlowM = new T.MeshBasicMaterial({ color: new T.Color("#ffd29a"), transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const winGlow = [];
    for (const x of WINS_N) winGlow.push(M(new T.PlaneGeometry(WIN_W - 0.1, WY1 - WY0 - 0.1), winGlowM, { x, y: (WY0 + WY1) / 2, z: MOD.z0 + 0.25, cast: false, receive: false, nodepth: true }));
    winGlow.forEach(dyn);
    // south-wall windows have blinds (warm, lit from inside)
    const blindT = K.canvasTex("rg_blind", 64, 64, (q, w, h) => { q.fillStyle = "#e6cfa6"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(90,60,30,0.3)"; for (let y = 3; y < h; y += 6) q.fillRect(0, y, w, 2); });
    const blindM = new T.MeshBasicMaterial({ map: blindT, color: new T.Color(0.9, 0.9, 0.9) });
    for (const x of [-10.2, -4.6]) M(new T.PlaneGeometry(WIN_W, WY1 - WY0), blindM, { x, y: (WY0 + WY1) / 2, z: MOD.z1 + 0.12, cast: false }, mod);
    // interior partitions, floor, ceiling
    const inWallM = mat("#cfd2cc", { rough: 0.85 }), floorM = mat("#5a6066", { rough: 0.6, map: K.canvasTex("rg_floor", 256, 256, (q, w, h) => { q.fillStyle = "#666d72"; q.fillRect(0, 0, w, h); const R = rng(4); for (let i = 0; i < 2500; i++) { q.fillStyle = R() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"; q.fillRect(R() * w, R() * h, 2, 2); } q.fillStyle = "rgba(0,0,0,0.25)"; for (let k = 0; k <= 4; k++) { q.fillRect(k * 64, 0, 2, h); q.fillRect(0, k * 64, w, 2); } }, { repeat: true }) });
    floorM.map.repeat.set(4, 4);
    M(box(MOD.x1 - MOD.x0 - 0.4, 0.04, MOD.z1 - MOD.z0 - 0.4), floorM, { x: (MOD.x0 + MOD.x1) / 2, y: DU + 0.02, z: (MOD.z0 + MOD.z1) / 2 }, mod);
    M(box(MOD.x1 - MOD.x0 - 0.4, 0.04, MOD.z1 - MOD.z0 - 0.4), mat("#e4e4de", { rough: 0.9 }), { x: (MOD.x0 + MOD.x1) / 2, y: DU + 3.2, z: (MOD.z0 + MOD.z1) / 2 }, mod);
    M(box(0.12, 3.2, MOD.z1 - MOD.z0 - 0.3), inWallM, { x: CR.x1, y: DU + 1.6, z: (MOD.z0 + MOD.z1) / 2 }, mod);                       // control room | stores
    M(box(STO.x1 - STO.x0, 3.2, 0.12), inWallM, { x: (STO.x0 + STO.x1) / 2, y: DU + 1.6, z: STO.z1 }, mod);                            // storeroom | utility
    // the screen wall: an inner skin on the south side of the control room
    M(box(0.1, 3.2, CR.z1 - CR.z0 - 0.3), inWallM, { x: CR.x0 + 0.2, y: DU + 1.6, z: (CR.z0 + CR.z1) / 2 }, mod);
    M(box(CR.x1 - CR.x0 - 0.3, 3.2, 0.1), inWallM, { x: (CR.x0 + CR.x1) / 2, y: DU + 1.6, z: CR.z1 - 0.2 }, mod);
    // doors (south walls) and a door to the deck on the east wall of the utility room
    M(box(0.95, 2.1, 0.06), mat("#8c949a", { rough: 0.5, metal: 0.3 }), { x: -1.0, y: DU + 1.05, z: MOD.z1 + 0.13 }, mod);
    M(box(0.95, 2.1, 0.06), mat("#8c949a", { rough: 0.5, metal: 0.3 }), { x: -6.9, y: DU + 1.05, z: MOD.z1 + 0.13 }, mod);

    // ---------------------------------------------------------------- control-room furniture: the console under the windows, monitors, the radio, the wall screen
    const cr = G({}); statics.push(cr);
    const deskM = mat("#3a3f45", { rough: 0.55, metal: 0.2 }), topM = mat("#6b6f72", { rough: 0.65 });
    M(box(8.2, 0.06, 0.95), topM, { x: -7.6, y: DU + 0.76, z: -11.25 }, cr);
    M(box(8.2, 0.72, 0.85), deskM, { x: -7.6, y: DU + 0.38, z: -11.32 }, cr);
    function screenTex(key, draw) { return K.textTex(key, 512, 320, draw); }
    const mimic = (title, seed) => (q, w, h) => {
      q.fillStyle = "#0b1622"; q.fillRect(0, 0, w, h); q.fillStyle = "#16324a"; q.fillRect(0, 0, w, 34);
      q.fillStyle = "#cfe6ff"; q.font = "600 20px KitInter, sans-serif"; q.fillText(title, 12, 24);
      const R = rng(seed); q.strokeStyle = "#5fb8ff"; q.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const y = 70 + i * 48; q.beginPath(); q.moveTo(20, y); q.lineTo(180 + R() * 120, y); q.lineTo(180 + R() * 120, y + 30); q.lineTo(480, y + 30); q.stroke(); q.fillStyle = R() < 0.8 ? "#3fd47a" : "#f7b733"; q.fillRect(150 + R() * 200, y - 8, 16, 16); q.fillStyle = "#cfe6ff"; q.font = "500 16px KitInter, sans-serif"; q.fillText((40 + R() * 90).toFixed(1) + " bar", 360, y - 6); }
    };
    const monTex = [screenTex("rg_mon1", mimic("WELLS 1-4", 3)), screenTex("rg_mon2", mimic("SEPARATOR · FUEL GAS", 5)), screenTex("rg_mon3", mimic("POWER · GENERATOR", 7)), screenTex("rg_mon4", (q, w, h) => { q.fillStyle = "#0b1622"; q.fillRect(0, 0, w, h); q.fillStyle = "#16324a"; q.fillRect(0, 0, w, 34); q.fillStyle = "#cfe6ff"; q.font = "600 20px KitInter, sans-serif"; q.fillText("WEATHER", 12, 24); q.fillStyle = "#7dffb0"; q.font = "700 64px KitOswald, sans-serif"; q.fillText("45 KT", 24, 120); q.font = "600 28px KitInter, sans-serif"; q.fillText("WAVES 4.5 M  ·  SW", 24, 172); q.strokeStyle = "#5fb8ff"; q.lineWidth = 3; q.beginPath(); for (let x = 0; x < w; x += 8) q.lineTo(x, 270 - Math.sin(x / 30) * 18 - x * 0.06); q.stroke(); })];
    const monMs = [];
    const monPos = [[-10.2, 0.42], [-8.25, 0.0], [-6.75, 0.0], [-4.8, -0.42]];
    monPos.forEach(([x, ang], i) => { const g = G({ x, y: DU + 0.79, z: -11.5, ry: ang * 30 }, cr); M(box(0.06, 0.3, 0.06), dark, { y: 0.15 }, g); M(box(0.66, 0.42, 0.04), dark, { y: 0.5 }, g); const m = new T.MeshBasicMaterial({ map: monTex[i], color: new T.Color(1, 1, 1) }); monMs.push(m); M(new T.PlaneGeometry(0.62, 0.38), m, { y: 0.5, z: 0.022, cast: false }, g); });
    const kbd = (x) => M(box(0.46, 0.025, 0.16), mat("#222428", { rough: 0.6 }), { x, y: DU + 0.8, z: -10.95 }, cr);
    kbd(-10.2); kbd(-7.85); kbd(-4.8);
    // three chairs: hers pulled out at the middle station, two pushed in (nobody else lives here)
    const chairs = [];
    for (const [x, z, r] of [[-10.2, -10.55, 8], [-4.8, -10.6, -10]]) { const c = G({ x, y: DU, z, ry: r }, cr); M(cyl(0.26, 0.26, 0.07, 18), mat("#1c1d20", { rough: 0.5 }), { y: 0.5 }, c); M(cyl(0.03, 0.03, 0.45, 8), steel, { y: 0.26 }, c); M(rbox(0.44, 0.5, 0.07, 0.05), mat("#1c1d20", { rough: 0.5 }), { y: 0.88, z: 0.26 }, c); M(cyl(0.3, 0.3, 0.03, 5), dark, { y: 0.03 }, c); chairs.push(c); }
    { const c = G({ x: SEAT[0], y: DU, z: SEAT[2] + 0.12 }, cr); M(cyl(0.26, 0.26, 0.07, 18), mat("#1c1d20", { rough: 0.5 }), { y: 0.5 }, c); M(cyl(0.03, 0.03, 0.45, 8), steel, { y: 0.26 }, c); M(rbox(0.44, 0.5, 0.07, 0.05), mat("#1c1d20", { rough: 0.5 }), { y: 0.88, z: 0.27 }, c); M(cyl(0.3, 0.3, 0.03, 5), dark, { y: 0.03 }, c); }
    // the radio (VHF base station) with its handset on a hook: LCD "CH 16" and a TX LED (st.radioK, st.txK)
    const radioG = G({ x: -6.1, y: DU + 0.79, z: -11.35 });
    M(rbox(0.42, 0.14, 0.26, 0.02), dark, { y: 0.07 }, radioG);
    const rdT = K.textTex("rg_radio", 128, 48, (q, w, h) => { q.fillStyle = "#081410"; q.fillRect(0, 0, w, h); q.fillStyle = "#7dffb0"; q.font = "700 30px KitOswald, sans-serif"; q.fillText("CH 16", 14, 36); });
    const rdM = new T.MeshBasicMaterial({ map: rdT, color: new T.Color(0.15, 0.15, 0.15) });
    M(new T.PlaneGeometry(0.14, 0.05), rdM, { y: 0.085, z: 0.145, cast: false }, radioG);
    const txM = glow("#ff3020", 0.1); M(sph(0.009, 8, 6), txM, { x: 0.12, y: 0.09, z: 0.146, cast: false }, radioG);
    for (let k = 0; k < 2; k++) M(cyl(0.018, 0.018, 0.02, 12), mat("#5a5e64", { metal: 0.4, rough: 0.4 }), { x: -0.12 + k * 0.05, y: 0.05, z: 0.15, rx: 90 }, radioG);
    const handset = M(rbox(0.05, 0.11, 0.035, 0.014), mat("#25282b", { rough: 0.45 }), { x: 0.28, y: 0.09, z: 0.04 }, radioG);
    // the logbook (open), a pen, a mug (a tiny fire-tower print, an Easter egg), the gauge panel, the desk lamp
    const logT = K.textTex("rg_log", 768, 512, (q, w, h) => {
      q.fillStyle = "#f2ecdc"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(0,0,0,0.25)"; q.fillRect(w / 2 - 2, 0, 4, h);
      q.fillStyle = "rgba(60,80,140,0.3)"; for (let y = 50; y < h; y += 30) { q.fillRect(16, y, w / 2 - 34, 1.5); q.fillRect(w / 2 + 18, y, w / 2 - 34, 1.5); }
      q.fillStyle = "#1d2a44"; q.font = "600 26px KitInter, sans-serif"; q.fillText("WEATHER LOG", 24, 36);
      q.font = "500 22px KitInter, sans-serif"; ["19:00  wind SW 38 kt", "20:00  wind SW 42 kt", "21:00  wind SW 45 kt", "21:30  sea 4.5 m, rain"].forEach((s, i) => q.fillText(s, 24, 76 + i * 30));
      q.fillText("pressures OK", w / 2 + 28, 76); q.fillText("flare normal", w / 2 + 28, 106);
    });
    const logbook = M(box(0.5, 0.012, 0.34), [mat("#e8e2d2"), mat("#e8e2d2"), mat("#ffffff", { map: logT, rough: 0.9 }), mat("#3a2a1c"), mat("#e8e2d2"), mat("#e8e2d2")], { x: -7.25, y: DU + 0.795, z: -10.86, ry: -6 });
    const pen = M(cyl(0.004, 0.004, 0.15, 6), mat("#1d4fa0", { rough: 0.4 }), { x: -7.0, y: DU + 0.81, z: -10.78, rz: 90, ry: 24 });
    const mugT = K.canvasTex("rg_mug", 256, 64, (q, w, h) => { q.fillStyle = "#e0d6c4"; q.fillRect(0, 0, w, h); q.fillStyle = "#c75b22"; q.fillRect(100, 18, 4, 30); q.fillRect(118, 18, 4, 30); q.fillRect(96, 16, 30, 8); q.fillRect(104, 30, 14, 2); q.fillRect(104, 40, 14, 2); });
    const mug = G({ x: -8.2, y: DU + 0.79, z: -10.92 }); M(cyl(0.042, 0.038, 0.1, 18), mat("#ffffff", { map: mugT, rough: 0.4 }), { y: 0.05, ry: -60 }, mug); M(new T.TorusGeometry(0.026, 0.007, 6, 14), mat("#e0d6c4"), { x: -0.046, y: 0.05 }, mug);
    // the pressure gauges: a small panel of three dials on the console's right wing
    const gaugeT = (label) => K.textTex("rg_g_" + label, 256, 256, (q, w, h) => { q.fillStyle = "#f2efe6"; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 6, 0, 7); q.fill(); q.strokeStyle = "#1e2a36"; q.lineWidth = 5; q.stroke(); q.fillStyle = "#1e2a36"; for (let k = 0; k <= 10; k++) { const a = (0.75 + 1.5 * k / 10) * Math.PI; q.fillRect(w / 2 + Math.cos(a) * 96 - 3, h / 2 + Math.sin(a) * 96 - 3, 6, 6); } q.fillStyle = "#2fa860"; q.beginPath(); q.arc(w / 2, h / 2, 106, 1.35 * Math.PI, 1.85 * Math.PI); q.arc(w / 2, h / 2, 94, 1.85 * Math.PI, 1.35 * Math.PI, true); q.fill(); q.fillStyle = "#1e2a36"; q.font = "700 30px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText(label, w / 2, h / 2 + 64); q.font = "600 20px KitInter, sans-serif"; q.fillText("BAR", w / 2, h / 2 + 90); });
    const gp = G({ x: -4.05, y: DU + 0.79, z: -11.38, ry: -24 }); statics.push(gp);
    M(box(0.9, 0.42, 0.12), deskM, { y: 0.21, rx: -20 }, gp);
    const needles = [];
    ["WELL 1", "WELL 2", "WELL 3"].forEach((lab, i) => { const gx = -0.28 + i * 0.28; const gg = G({ x: gx, y: 0.24, z: 0.07, rx: -20 }, gp); M(cyl(0.11, 0.11, 0.03, 32), mat("#c8ccd0", { metal: 0.4, rough: 0.35 }), { rx: 90 }, gg); M(new T.CircleGeometry(0.1, 32), mat("#ffffff", { map: gaugeT(lab), rough: 0.5 }), { z: 0.016, cast: false }, gg); const nd = dyn(G({ z: 0.02 }, gg)); M(box(0.006, 0.085, 0.003), mat("#c8321f"), { y: 0.035 }, nd); nd.rotation.z = -0.3 + i * 0.35; needles.push(nd); });
    // desk lamp (warm key), ceiling panels, a monitor fill (cool) that lights her face
    const lamp = G({ x: -8.9, y: DU + 0.79, z: -11.25 });
    M(cyl(0.07, 0.08, 0.025, 20), dark, { y: 0.012 }, lamp); K.rod([0, 0.02, 0], [0.05, 0.38, 0.06], 0.009, mat("#9a9a96", { metal: 0.6, rough: 0.3 }), lamp, 6);
    M(new T.ConeGeometry(0.09, 0.12, 22, 1, true), mat("#2a2c30", { metal: 0.3, rough: 0.4, side: T.DoubleSide }), { x: 0.07, y: 0.42, z: 0.08, rx: 18, rz: -12 }, lamp);
    const lampBulb = M(sph(0.025, 12, 10), glow("#ffd9a0", 8), { x: 0.075, y: 0.39, z: 0.09, cast: false }, lamp);
    const lampL = new T.PointLight("#ffcf9a", 0, 0, 2); lampL.position.set(0.08, 0.36, 0.14); lamp.add(lampL);
    lampL.castShadow = true; lampL.shadow.mapSize.set(512, 512); lampL.shadow.camera.near = 0.05; lampL.shadow.camera.far = 7; lampL.shadow.bias = -0.003; lampL.shadow.radius = 3;
    const ceilL = [new T.PointLight("#e8eeff", 0, 0, 2), new T.PointLight("#e8eeff", 0, 0, 2)]; ceilL[0].position.set(-9.5, DU + 2.9, -7); ceilL[1].position.set(-5.5, DU + 2.9, -7); ceilL.forEach((l) => scene.add(l));
    const ceilPanel = glow("#eef4ff", 2.0);
    for (const x of [-9.5, -5.5]) M(box(1.2, 0.04, 0.6), ceilPanel, { x, y: DU + 3.17, z: -7, cast: false }, cr);
    const monL = new T.PointLight("#9cc8ff", 0, 0, 2); monL.position.set(-7.5, DU + 1.25, -11.0); scene.add(monL);
    // the wall screen behind her (plant 1: REMOTE OPERATED · SHORE BASE, LINK ●, in the background, never the focus)
    const wallT = K.textTex("rg_wall", 1600, 800, (q, w, h) => {
      q.fillStyle = "#08111c"; q.fillRect(0, 0, w, h);
      q.fillStyle = "#0f2a40"; q.fillRect(0, 0, w, 140);
      q.fillStyle = "#dceaff"; q.font = "700 92px KitOswald, sans-serif"; q.fillText("REMOTE OPERATED · SHORE BASE", 34, 106);
      q.fillStyle = "#3fe07f"; q.font = "700 74px KitOswald, sans-serif"; q.fillText("LINK", 1330, 102); q.beginPath(); q.arc(1530, 76, 25, 0, 7); q.fill();
      // a P&ID mimic: wells -> separator -> fuel gas -> generator; flare
      q.strokeStyle = "#5fb8ff"; q.lineWidth = 6; q.fillStyle = "#cfe6ff"; q.font = "600 34px KitInter, sans-serif";
      for (let i = 0; i < 4; i++) { const y = 210 + i * 110; q.strokeRect(60, y - 36, 150, 72); q.fillText("WELL " + (i + 1), 82, y + 12); q.beginPath(); q.moveTo(210, y); q.lineTo(420, y); q.lineTo(420, 380); q.lineTo(520, 380); q.stroke(); }
      q.strokeRect(520, 300, 260, 160); q.fillText("SEPARATOR", 548, 392);
      q.beginPath(); q.moveTo(780, 340); q.lineTo(1000, 340); q.moveTo(780, 420); q.lineTo(1000, 420); q.lineTo(1000, 560); q.stroke();
      q.strokeRect(1000, 280, 240, 120); q.fillText("FUEL GAS", 1030, 352); q.strokeRect(1000, 560, 240, 120); q.fillText("EXPORT", 1040, 632);
      q.beginPath(); q.moveTo(1240, 340); q.lineTo(1380, 340); q.stroke(); q.strokeRect(1380, 280, 200, 120); q.fillText("POWER", 1418, 352);
      q.fillStyle = "#3fd47a"; for (const [x, y] of [[300, 210], [300, 320], [300, 430], [300, 540], [880, 340], [1300, 340]]) { q.beginPath(); q.arc(x, y, 14, 0, 7); q.fill(); }
      q.fillStyle = "#8fa6bd"; q.font = "500 30px KitInter, sans-serif"; q.fillText("NO ACTIVE ALARMS", 60, 760); q.fillText("FLARE · NORMAL", 1180, 760);
    });
    const wallM = new T.MeshBasicMaterial({ map: wallT, color: new T.Color(1, 1, 1) });
    M(box(0.08, 1.42, 2.72), dark, { x: CR.x0 + 0.3, y: DU + 1.98, z: -9.55 }, cr);
    M(new T.PlaneGeometry(2.6, 1.3), wallM, { x: CR.x0 + 0.345, y: DU + 1.98, z: -9.55, ry: 90, cast: false }, cr);
    // a kitchenette in the north-east corner of the control room: counter, kettle, the microwave (st.micro: 0 off .. 1 on, its plate turns)
    const kit = G({ x: -3.9, y: DU, z: -6.2 }); statics.push(kit);
    M(box(0.62, 0.9, 2.4), mat("#e4e4e0", { rough: 0.6 }), { y: 0.45 }, kit); M(box(0.66, 0.04, 2.44), mat("#4a4e52", { rough: 0.5 }), { y: 0.92 }, kit);
    M(cyl(0.08, 0.09, 0.22, 16), mat("#d8dcde", { metal: 0.4, rough: 0.3 }), { y: 1.05, z: 0.9 }, kit);
    const mw = G({ x: -3.95, y: DU + 0.94, z: -6.6, ry: -90 });
    { const sh = mat("#e8e8e4", { rough: 0.45 }), cav = mat("#cfc9bc", { rough: 0.7 }), fr = mat("#2e3034", { rough: 0.4 });
      M(box(0.52, 0.02, 0.38), sh, { y: 0.29 }, mw); M(box(0.52, 0.02, 0.38), sh, { y: 0.01 }, mw); M(box(0.02, 0.3, 0.38), sh, { x: -0.25 }, mw);
      M(box(0.16, 0.3, 0.38), sh, { x: 0.18 }, mw); M(box(0.36, 0.05, 0.02), fr, { x: -0.07, y: 0.275, z: 0.18, cast: false }, mw); M(box(0.36, 0.05, 0.02), fr, { x: -0.07, y: 0.025, z: 0.18, cast: false }, mw);
      M(box(0.04, 0.3, 0.02), fr, { x: -0.23, y: 0.15, z: 0.18 }, mw); M(box(0.012, 0.3, 0.02), fr, { x: 0.094, y: 0.15, z: 0.18 }, mw); M(box(0.33, 0.25, 0.01), cav, { x: -0.07, y: 0.15, z: -0.155 }, mw); }
    const mwGl = K.textTex("rg_mwglass", 384, 256, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = "rgba(18,16,12,0.42)"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(0,0,0,0.38)"; for (let y = 3; y < h; y += 7) for (let x = 3 + (y % 14 ? 3 : 0); x < w; x += 7) { q.beginPath(); q.arc(x, y, 1.7, 0, 7); q.fill(); } const g = q.createLinearGradient(0, 0, w, h); g.addColorStop(0.18, "rgba(255,255,255,0)"); g.addColorStop(0.3, "rgba(255,255,255,0.16)"); g.addColorStop(0.42, "rgba(255,255,255,0)"); q.fillStyle = g; q.fillRect(0, 0, w, h); });
    const mwWin = new T.MeshBasicMaterial({ map: mwGl, color: new T.Color(1, 1, 1), transparent: true, depthWrite: false }); M(new T.PlaneGeometry(0.3, 0.2), mwWin, { x: -0.06, y: 0.15, z: 0.19, cast: false }, mw);
    M(box(0.42, 0.26, 0.02), mat("#3c3a36", { rough: 0.6 }), { y: 0.15, z: -0.17 }, mw);
    const mwT = K.textTex("rg_mwdisp", 96, 40, (q, w, h) => { q.fillStyle = "#061006"; q.fillRect(0, 0, w, h); q.fillStyle = "#6dff8a"; q.font = "700 28px KitOswald, sans-serif"; q.fillText("1:30", 18, 31); });
    const mwDisp = new T.MeshBasicMaterial({ map: mwT, color: new T.Color(0.2, 0.2, 0.2) }); M(new T.PlaneGeometry(0.08, 0.034), mwDisp, { x: 0.17, y: 0.23, z: 0.192, cast: false }, mw);
    const mwL = new T.PointLight("#ffe6b0", 0, 0.9, 2); mwL.position.set(-0.06, 0.24, 0.02); mw.add(mwL);
    const plate = G({ x: -0.06, y: 0.075, z: 0.0 }, mw); M(cyl(0.12, 0.12, 0.01, 24), mat("#f2f2f2", { rough: 0.3 }), {}, plate);
    M(box(0.16, 0.035, 0.11), mat("#2a2a2c", { rough: 0.5 }), { y: 0.022 }, plate);
    M(box(0.15, 0.012, 0.1), mat("#d8a24a", { rough: 0.8 }), { y: 0.04, x: -0.02 }, plate); M(box(0.06, 0.014, 0.1), mat("#5f8a3c", { rough: 0.8 }), { y: 0.042, x: 0.05 }, plate);

    // more of the control room: a wall clock, a notice board, binders, an extinguisher, a first-aid box, a printer, cable trays
    { const det = G({}); statics.push(det);
      const clkT = K.textTex("rg_clock", 256, 256, (q, w, h) => { q.fillStyle = "#f4f2ec"; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 6, 0, 7); q.fill(); q.strokeStyle = "#222"; q.lineWidth = 8; q.stroke(); q.fillStyle = "#222"; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; q.fillRect(w / 2 + Math.cos(a) * 96 - 4, h / 2 + Math.sin(a) * 96 - 4, 8, 8); } q.lineWidth = 9; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + 52 * Math.cos(-1.4), h / 2 + 52 * Math.sin(-1.4)); q.stroke(); q.lineWidth = 6; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + 84 * Math.cos(0.52), h / 2 + 84 * Math.sin(0.52)); q.stroke(); });
      M(cyl(0.17, 0.17, 0.04, 32), dark, { x: -10.6, y: DU + 2.55, z: CR.z1 - 0.28, rx: 90 }, det); M(new T.CircleGeometry(0.155, 32), mat("#ffffff", { map: clkT, rough: 0.5 }), { x: -10.6, y: DU + 2.55, z: CR.z1 - 0.31, ry: 180, cast: false }, det);
      const nbT = K.canvasTex("rg_notice", 512, 384, (q, w, h) => { q.fillStyle = "#b08a5a"; q.fillRect(0, 0, w, h); const R = rng(14); for (let i = 0; i < 9; i++) { q.fillStyle = ["#f4f1e8", "#fff4a8", "#d8e8f4"][i % 3]; const x = 20 + (i % 3) * 160 + R() * 20, y = 20 + Math.floor(i / 3) * 120 + R() * 10; q.fillRect(x, y, 120 + R() * 20, 90); q.fillStyle = "rgba(40,40,60,0.5)"; for (let l = 0; l < 5; l++) q.fillRect(x + 10, y + 16 + l * 14, 90 * R() + 20, 4); q.fillStyle = "#c8321f"; q.beginPath(); q.arc(x + 60, y + 6, 5, 0, 7); q.fill(); } });
      M(box(1.4, 1.0, 0.03), mat("#ffffff", { map: nbT, rough: 0.85 }), { x: -4.6, y: DU + 1.9, z: CR.z1 - 0.27 }, det);
      { const bc = ["#24476e", "#a83a2a", "#3c6e48", "#c79a2e", "#5a5a64"]; const R = rng(33); M(box(1.6, 0.03, 0.3), mat("#6b6f72"), { x: -8.6, y: DU + 1.95, z: CR.z1 - 0.42 }, det); for (let k = 0; k < 14; k++) M(box(0.07, 0.3, 0.25), mat(bc[Math.floor(R() * 5)], { rough: 0.6 }), { x: -9.3 + k * 0.1, y: DU + 2.12, z: CR.z1 - 0.42 }, det); }
      M(cyl(0.08, 0.08, 0.5, 14), mat("#b8231e", { rough: 0.4 }), { x: -11.5, y: DU + 0.45, z: -11.0 }, det); M(cyl(0.025, 0.03, 0.08, 8), dark, { x: -11.5, y: DU + 0.74, z: -11.0 }, det);
      M(box(0.4, 0.3, 0.14), mat("#2f8a4a", { rough: 0.5 }), { x: -11.0, y: DU + 1.6, z: CR.z1 - 0.32 }, det); M(box(0.06, 0.2, 0.02), mat("#ffffff"), { x: -11.0, y: DU + 1.6, z: CR.z1 - 0.4 }, det); M(box(0.2, 0.06, 0.02), mat("#ffffff"), { x: -11.0, y: DU + 1.6, z: CR.z1 - 0.4 }, det);
      M(box(0.5, 0.3, 0.42), mat("#d9d9d4", { rough: 0.5 }), { x: -11.3, y: DU + 0.9, z: -3.4 }, det); M(box(0.6, 0.85, 0.5), mat("#5a5e64", { rough: 0.6 }), { x: -11.3, y: DU + 0.42, z: -3.4 }, det);
      for (const z of [-4.5, -9.5]) M(box(8.4, 0.06, 0.3), mat("#8a9096", { metal: 0.3, rough: 0.5 }), { x: -7.6, y: DU + 3.05, z }, det); }
    // small sodium lamps along the deck edges (sparkle in the wide shots)
    { const dl = G({}); statics.push(dl); const lm = glow("#ffc27a", 9);
      for (const y of [DM, DU]) for (let k = -4; k <= 4; k++) { const v = k * 2.9; for (const [x, z] of [[v, HALF - 0.12], [v, -HALF + 0.12], [HALF - 0.12, v], [-HALF + 0.12, v]]) M(sph(0.07, 8, 6), lm, { x, y: y + 1.12, z, cast: false }, dl); } }

    // ---------------------------------------------------------------- the storeroom: labelled shelves (RATIONS · 12 CREW · 30 DAYS)
    const sto = G({}); statics.push(sto);
    const shelfM = mat("#8a9096", { metal: 0.3, rough: 0.5 });
    const boxCols = ["#c9a46a", "#b8945e", "#d4b47c"];
    const ratT = K.textTex("rg_ration", 256, 128, (q, w, h) => { q.fillStyle = "#c9a46a"; q.fillRect(0, 0, w, h); q.fillStyle = "#2a1e10"; q.font = "700 46px KitOswald, sans-serif"; q.fillText("RATIONS", 20, 58); q.font = "600 26px KitInter, sans-serif"; q.fillText("1 DAY · 1 PERSON", 20, 100); });
    const ratM = mat("#ffffff", { map: ratT, rough: 0.85 }), boxM = boxCols.map((c) => mat(c, { rough: 0.85 }));
    const labT = K.textTex("rg_shelflab", 1024, 128, (q, w, h) => { q.fillStyle = "#f4f1e8"; q.fillRect(0, 0, w, h); q.strokeStyle = "#1a1a1a"; q.lineWidth = 6; q.strokeRect(3, 3, w - 6, h - 6); q.fillStyle = "#1a1a1a"; q.font = "700 78px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("RATIONS · 12 CREW · 30 DAYS", w / 2, 92); });
    const waterT = K.textTex("rg_shelfw", 1024, 128, (q, w, h) => { q.fillStyle = "#f4f1e8"; q.fillRect(0, 0, w, h); q.strokeStyle = "#1a1a1a"; q.lineWidth = 6; q.strokeRect(3, 3, w - 6, h - 6); q.fillStyle = "#1a1a1a"; q.font = "700 78px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("FIRST AID · SURVIVAL KITS", w / 2, 92); });
    { const R = rng(21);
      for (const [x0, x1, z, face] of [[-3.0, 1.8, -11.55, 1]]) {
        const L = x1 - x0, cx = (x0 + x1) / 2;
        for (let s = 0; s < 4; s++) { const y = DU + 0.25 + s * 0.62; M(box(L, 0.03, 0.55), shelfM, { x: cx, y, z }, sto);
          for (let x = x0 + 0.2; x < x1 - 0.15; x += 0.34) { const hh = 0.24 + R() * 0.06; M(box(0.3, hh, 0.4), s === 3 ? boxM[Math.floor(R() * 3)] : [boxM[0], boxM[1], ratM, boxM[2], boxM[0], boxM[1]], { x: x + (R() - 0.5) * 0.02, y: y + 0.015 + hh / 2, z: z + 0.02 }, sto); } }
        for (const x of [x0 + 0.02, x1 - 0.02]) M(box(0.04, 2.6, 0.55), shelfM, { x, y: DU + 1.3, z }, sto);
        M(new T.PlaneGeometry(2.4, 0.3), mat("#ffffff", { map: labT, rough: 0.8 }), { x: cx, y: DU + 2.62, z: z + 0.29, cast: false }, sto);
      }
      for (const [x0, x1, z] of [[-3.0, -0.3, -7.45]]) { const cx = (x0 + x1) / 2, L = x1 - x0;
        for (let s = 0; s < 3; s++) { const y = DU + 0.3 + s * 0.7; M(box(L, 0.03, 0.5), shelfM, { x: cx, y, z }, sto); for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.3) M(cyl(0.11, 0.11, 0.32, 12), mat(s === 1 ? "#ffffff" : "#2a6fd6", { rough: 0.3 }), { x, y: y + 0.17, z }, sto); }
        M(new T.PlaneGeometry(1.8, 0.24), mat("#ffffff", { map: waterT, rough: 0.8 }), { x: cx, y: DU + 2.45, z: z - 0.27, ry: 180, cast: false }, sto); } }
    const stoL = new T.PointLight("#fff1dc", 0, 0, 2); stoL.position.set(-0.6, DU + 2.8, -9.6); scene.add(stoL);
    M(box(1.0, 0.04, 0.4), glow("#fff4e0", 2), { x: -0.6, y: DU + 3.17, z: -9.6, cast: false }, sto);

    // ---------------------------------------------------------------- the utility room: the watermaker (seawater -> drinking water), a tap and a jug (st.waterK, st.jugK)
    const utl = G({}); statics.push(utl);
    const wm = G({ x: -1.2, y: DU, z: -2.75 }, utl);
    M(box(2.6, 0.12, 0.8), dark, { y: 0.06 }, wm);
    for (let k = 0; k < 3; k++) { M(cyl(0.11, 0.11, 2.0, 16), mat("#e8eaec", { rough: 0.35 }), { y: 0.55 + k * 0.32, z: -0.05, rz: 90 }, wm); for (const s of [-1, 1]) M(cyl(0.13, 0.13, 0.08, 16), mat("#2a6fd6", { rough: 0.4 }), { x: s * 1.0, y: 0.55 + k * 0.32, z: -0.05, rz: 90 }, wm); }
    M(box(0.7, 0.7, 0.5), mat("#2f5f9a", { rough: 0.5 }), { x: 0.9, y: 1.55, z: -0.05 }, wm);
    const wmT = K.textTex("rg_wm", 512, 160, (q, w, h) => { q.fillStyle = "#e9eef3"; q.fillRect(0, 0, w, h); q.fillStyle = "#1c3a5c"; q.font = "700 64px KitOswald, sans-serif"; q.fillText("WATERMAKER", 20, 74); q.font = "600 34px KitInter, sans-serif"; q.fillText("SEAWATER → DRINKING", 20, 130); });
    M(new T.PlaneGeometry(0.66, 0.2), mat("#ffffff", { map: wmT, rough: 0.6 }), { x: 0.9, y: 1.62, z: -0.305, ry: 180, cast: false }, wm);
    const wmG = K.textTex("rg_wmg", 128, 128, (q, w, h) => { q.fillStyle = "#f2efe6"; q.beginPath(); q.arc(64, 64, 60, 0, 7); q.fill(); q.strokeStyle = "#222"; q.lineWidth = 5; q.beginPath(); q.moveTo(64, 64); q.lineTo(100, 36); q.stroke(); });
    M(new T.CircleGeometry(0.07, 24), mat("#ffffff", { map: wmG }), { x: 0.75, y: 1.35, z: -0.305, ry: 180, cast: false }, wm); M(new T.CircleGeometry(0.07, 24), mat("#ffffff", { map: wmG }), { x: 1.05, y: 1.35, z: -0.305, ry: 180, cast: false }, wm);
    K.rod([-1.3, 0.55, -0.05], [-1.3, 1.8, -0.05], 0.035, steel, wm, 8); K.rod([-1.3, 1.8, -0.05], [-0.4, 1.8, -0.45], 0.03, steel, wm, 8);
    // the tap over a small steel sink; the jug under it
    const tapP = [-1.6, DU + 1.32, -3.2];
    K.rod([-0.4, 1.8, -0.45], [-0.4, 1.36, -0.45], 0.025, mat("#c8ccd0", { metal: 0.5, rough: 0.25 }), wm, 8);
    M(box(0.6, 0.08, 0.42), mat("#c8ccd0", { metal: 0.45, rough: 0.3 }), { x: -0.4, y: 0.82, z: -0.52 }, wm); M(box(0.6, 0.82, 0.42), mat("#7a8086", { rough: 0.5 }), { x: -0.4, y: 0.4, z: -0.52 }, wm);
    const jug = dyn(G({ x: -1.6, y: DU + 0.86, z: -3.27 }));
    const jugGlass = new T.MeshPhysicalMaterial({ color: "#e4f0f8", roughness: 0.3, transparent: true, opacity: 0.42, envMapIntensity: 1.2, depthWrite: false, side: T.DoubleSide });
    M(cyl(0.075, 0.07, 0.22, 24, 1, true), jugGlass, { y: 0.11, cast: false, nodepth: true }, jug); M(new T.TorusGeometry(0.05, 0.009, 8, 16, Math.PI), mat("#d8e8f2", { rough: 0.3 }), { x: 0.08, y: 0.12, rz: -90 }, jug); M(cyl(0.072, 0.072, 0.008, 24), mat("#d8e8f2", { rough: 0.3 }), { y: 0.004 }, jug);
    const jugWater = M(cyl(0.068, 0.064, 1, 24), new T.MeshStandardMaterial({ color: "#5fa8d8", roughness: 0.1, emissive: new T.Color("#2a7ab8"), emissiveIntensity: 0.9, transparent: true, opacity: 0.85, depthWrite: false }), { y: 0.0, cast: false, nodepth: true }, jug);
    const streamM = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: U.t, k: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float t, k; varying vec2 vUv; void main(){ float s = 0.6 + 0.4 * sin(vUv.y * 60.0 + t * 30.0) * sin(vUv.x * 6.28); float e = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x); gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * (1.2 + 0.8 * s), e * k * 0.95); }" });
    const stream = M(new T.CylinderGeometry(0.014, 0.018, 1, 12, 1, true), streamM, { x: tapP[0], y: tapP[1], z: tapP[2], cast: false, nodepth: true }); dyn(stream);
    const utlL = new T.PointLight("#f0f4ff", 0, 0, 2); utlL.position.set(-0.6, DU + 2.6, -4.2); scene.add(utlL);
    M(box(1.0, 0.04, 0.4), glow("#f4f8ff", 2), { x: -0.6, y: DU + 3.17, z: -4.5, cast: false }, utl);

    // ================================================================== HELIDECK on the module roof: octagon, the lit H, perimeter lights, net, windsock; the stair and its gate
    const hd = G({ x: HD.c[0], y: HD.c[1], z: HD.c[2] }); statics.push(hd);
    const octG = new T.CylinderGeometry(HD.r, HD.r, 0.3, 8); octG.rotateY(Math.PI / 8);
    const hdT = K.canvasTex("rg_hdeck", 1024, 1024, (q, w, h) => {
      q.fillStyle = "#3a4046"; q.fillRect(0, 0, w, h); const R = rng(8); for (let i = 0; i < 4000; i++) { q.fillStyle = R() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.04)"; q.fillRect(R() * w, R() * h, 3, 3); }
      q.strokeStyle = "#e9ecee"; q.lineWidth = 26; q.beginPath(); q.arc(w / 2, h / 2, w * 0.43, 0, 7); q.stroke();      // perimeter line
      q.strokeStyle = "#f2c230"; q.lineWidth = 34; q.beginPath(); q.arc(w / 2, h / 2, w * 0.26, 0, 7); q.stroke();     // touchdown circle
      q.fillStyle = "#f2f2f2"; const s = w * 0.17; q.fillRect(w / 2 - s * 0.62, h / 2 - s, s * 0.32, s * 2); q.fillRect(w / 2 + s * 0.3, h / 2 - s, s * 0.32, s * 2); q.fillRect(w / 2 - s * 0.62, h / 2 - s * 0.14, s * 1.24, s * 0.28);
    });
    const hdTop = new T.MeshStandardMaterial({ map: hdT, roughness: 0.7, metalness: 0.2 });
    M(octG, [mat("#4a4f54", { rough: 0.6, metal: 0.3 }), hdTop, mat("#2c3034", { rough: 0.6 })], { y: -0.15 }, hd);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; K.rod([Math.cos(a) * 2.5, -0.75, Math.sin(a) * 2.5], [Math.cos(a) * (HD.r - 0.5), -0.35, Math.sin(a) * (HD.r - 0.5)], 0.16, steel, hd, 8); }
    for (const [x, z] of [[MOD.x0, MOD.z0], [MOD.x0, -6.5], [-6.5, MOD.z0]]) K.rod([x - HD.c[0], MOD.y1 - HD.c[1] - 0.2, z - HD.c[2]], [lerp(x - HD.c[0], 0, -0.45) , -0.35, lerp(z - HD.c[2], 0, -0.45)], 0.12, steel, hd, 8);
    // safety net (a sloped ring of mesh just outside the edge) as a dark band
    const netT = K.canvasTex("rg_net", 64, 64, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = "rgba(30,30,30,0.9)"; q.lineWidth = 2; for (let x = 0; x < w; x += 8) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + 8, h); q.stroke(); q.beginPath(); q.moveTo(x + 8, 0); q.lineTo(x, h); q.stroke(); } }, { repeat: true });
    netT.repeat.set(60, 2);
    const netG = new T.CylinderGeometry(HD.r + 1.4, HD.r + 0.1, 0.5, 8, 1, true); netG.rotateY(Math.PI / 8);
    void netT; M(netG, new T.MeshStandardMaterial({ transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide, color: "#2a2c2e", roughness: 0.9 }), { y: -0.2, cast: false }, hd);
    M(new T.TorusGeometry(HD.r + 1.4, 0.04, 6, 8), steel, { y: 0.05, rx: 90, rz: 22.5 }, hd);
    const hdLights = [];
    const hdLm = glow("#5dff8c", 6);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; M(sph(0.09, 8, 6), hdLm, { x: Math.cos(a) * (HD.r - 0.25), y: 0.08, z: Math.sin(a) * (HD.r - 0.25), cast: false }, hd); hdLights.push(new T.Vector3(HD.c[0] + Math.cos(a) * (HD.r - 0.25), HD.c[1] + 0.1, HD.c[2] + Math.sin(a) * (HD.r - 0.25))); }
    const hdHaloM = new T.MeshBasicMaterial({ map: radial, color: new T.Color("#5dff8c").multiplyScalar(0.55), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    const hdHalos = dyn(new T.InstancedMesh(new T.PlaneGeometry(1, 1), hdHaloM, 24)); scene.add(hdHalos); K.noDepth.push(hdHalos); hdHalos.frustumCulled = false;
    const hdHMat = new T.MeshBasicMaterial({ color: new T.Color(1, 1, 1) }); void hdHMat;
    // the windsock on a pole at the north-west edge
    M(cyl(0.05, 0.05, 3, 8), white, { x: -HD.r * 0.62, y: 1.5, z: -HD.r * 0.62 }, hd);
    const sock = dyn(G({ x: -HD.r * 0.62, y: 2.9, z: -HD.r * 0.62 }, hd));
    M(new T.ConeGeometry(0.28, 1.6, 12, 1, true), mat("#ff6a1a", { rough: 0.7, side: T.DoubleSide }), { rz: -90, x: 0.8 }, sock);
    const sockLight = M(sph(0.1, 8, 6), glow("#ff2a1a", 10), { x: -HD.r * 0.62, y: 3.1, z: -HD.r * 0.62, cast: false }, hd); dyn(sockLight);
    // the stair from the upper deck up the module's east wall to the helideck, with a gate at its foot (st.chain: the chain + padlock)
    const sg = G({}); statics.push(sg);
    { const n = 17, x = (STAIR.x0 + STAIR.x1) / 2; for (let i = 0; i < n; i++) { const u = (i + 1) / (n + 1); M(box(1.1, 0.06, 0.32), grateM, { x, y: DU + u * (HD.c[1] - DU), z: lerp(STAIR.zb, STAIR.zt, u) }, sg); }
      for (const xx of [STAIR.x0, STAIR.x1]) { K.rod([xx, DU, STAIR.zb], [xx, HD.c[1], STAIR.zt], 0.06, yel, sg, 6); K.rod([xx, DU + 1.0, STAIR.zb], [xx, HD.c[1] + 1.0, STAIR.zt], 0.03, yelR, sg, 6); }
      M(box(1.4, 0.1, 2.0), grateM, { x, y: HD.c[1] - 0.05, z: STAIR.zt - 1.0 }, sg); }
    const signHD = K.textTex("rg_sign_hd", 512, 128, (q, w, h) => { q.fillStyle = "#1f5a2e"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffffff"; q.font = "700 80px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("HELIDECK ↑", w / 2, 96); });
    M(new T.PlaneGeometry(0.8, 0.2), mat("#ffffff", { map: signHD, rough: 0.6 }), { x: STAIR.x1 + 0.02, y: DU + 1.9, z: STAIR.zb - 0.6, ry: 90, cast: false }, sg);
    const gate = G({ x: (STAIR.x0 + STAIR.x1) / 2, y: DU, z: STAIR.zb + 0.15 }); statics.push(gate);
    M(box(1.2, 0.05, 0.05), yelR, { y: 1.05 }, gate); M(box(1.2, 0.05, 0.05), yelR, { y: 0.15 }, gate); for (let k = -2; k <= 2; k++) M(box(0.03, 0.9, 0.03), yelR, { x: k * 0.27, y: 0.6 }, gate);
    for (const s of [-0.62, 0.62]) M(box(0.08, 1.15, 0.08), yel, { x: s, y: 0.575 }, gate);
    const chainG = dyn(G({ x: (STAIR.x0 + STAIR.x1) / 2 + 0.12, y: DU + 0.66, z: STAIR.zb + 0.15 }));
    const linkM = mat("#9aa0a6", { metal: 0.45, rough: 0.35 }), links = [];
    for (let k = 0; k < 16; k++) { const l = M(new T.TorusGeometry(0.024, 0.006, 6, 12), linkM, { cast: false }, chainG); links.push(l); }
    const lock = G({}, chainG); M(rbox(0.06, 0.07, 0.025, 0.008), mat("#c9a23a", { metal: 0.45, rough: 0.3 }), {}, lock); M(new T.TorusGeometry(0.022, 0.005, 6, 16, Math.PI), mat("#c8ccd0", { metal: 0.45, rough: 0.3 }), { y: 0.035 }, lock);

    // ================================================================== GENERATOR SKID by the flare (plant 3 on its door) and the CRANE
    const gen = G({}); statics.push(gen);
    { const cx = (GEN.x0 + GEN.x1) / 2, cz = (GEN.z0 + GEN.z1) / 2, w = GEN.x1 - GEN.x0, d = GEN.z1 - GEN.z0;
      const encT = K.canvasTex("rg_enc", 256, 256, (q, ww, hh) => { q.fillStyle = "#6e7c86"; q.fillRect(0, 0, ww, hh); q.fillStyle = "rgba(0,0,0,0.3)"; for (let y = 10; y < hh; y += 14) q.fillRect(20, y, ww - 40, 5); const R = rng(2); for (let i = 0; i < 900; i++) { q.fillStyle = R() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"; q.fillRect(R() * ww, R() * hh, 2, 2); } }, { repeat: true });
      encT.repeat.set(3, 1);
      const encM = new T.MeshStandardMaterial({ map: encT, color: "#ffffff", roughness: 0.55, metalness: 0.3 });
      M(box(w, GEN.h, d), encM, { x: cx, y: DU + GEN.h / 2, z: cz }, gen);
      M(box(w + 0.3, 0.2, d + 0.3), dark, { x: cx, y: DU + 0.1, z: cz }, gen);
      M(cyl(0.3, 0.3, 4.2, 14), mat("#5a5048", { rough: 0.6, metal: 0.4 }), { x: GEN.x1 - 0.8, y: DU + GEN.h + 2.1, z: cz }, gen);
      const lbl = K.textTex("rg_genlbl", 512, 128, (q, ww, hh) => { q.fillStyle = "#e9ecee"; q.fillRect(0, 0, ww, hh); q.fillStyle = "#1a1a1a"; q.font = "700 78px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("GENERATOR · GAS", ww / 2, 94); });
      M(new T.PlaneGeometry(1.8, 0.45), mat("#ffffff", { map: lbl, rough: 0.6 }), { x: cx + 1.1, y: DU + GEN.h - 0.45, z: GEN.z1 + 0.01, cast: false }, gen);
      // the door (left of centre) with the yellow sticker
      const DX = cx - 1.4;
      M(box(1.0, 2.1, 0.05), mat("#5d6a74", { rough: 0.5, metal: 0.3 }), { x: DX, y: DU + 1.15, z: GEN.z1 + 0.03 }, gen);
      M(box(0.05, 0.3, 0.05), mat("#1a1a1a", { rough: 0.4 }), { x: DX + 0.38, y: DU + 1.15, z: GEN.z1 + 0.08 }, gen);
      const stk = K.textTex("rg_sticker", 1024, 512, (q, ww, hh) => {
        q.fillStyle = "#f4c724"; q.fillRect(0, 0, ww, hh); q.strokeStyle = "#151515"; q.lineWidth = 18; q.strokeRect(9, 9, ww - 18, hh - 18);
        q.fillStyle = "#151515"; q.textAlign = "center"; q.font = "700 150px KitOswald, sans-serif"; q.fillText("AUTO SHUTDOWN", ww / 2, 200);
        q.font = "700 104px KitOswald, sans-serif"; q.fillText("SHORE LINK LOST > 72 H", ww / 2, 398);
      });
      M(new T.PlaneGeometry(0.94, 0.47), mat("#ffffff", { map: stk, rough: 0.55 }), { x: DX, y: DU + 1.56, z: GEN.z1 + 0.06, cast: false }, gen);
      const warnT = K.textTex("rg_warn", 256, 256, (q, ww, hh) => { q.fillStyle = "#f4c724"; q.beginPath(); q.moveTo(ww / 2, 16); q.lineTo(ww - 16, hh - 20); q.lineTo(16, hh - 20); q.closePath(); q.fill(); q.strokeStyle = "#151515"; q.lineWidth = 14; q.stroke(); q.fillStyle = "#151515"; q.font = "700 130px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("!", ww / 2, hh - 50); });
      M(new T.PlaneGeometry(0.28, 0.28), mat("#ffffff", { map: warnT, rough: 0.6, opacity: 0.999 }), { x: DX, y: DU + 2.02, z: GEN.z1 + 0.06, cast: false }, gen);
      for (let k = 0; k < 3; k++) M(box(0.9, 0.5, 0.04), mat("#3a4046", { rough: 0.6 }), { x: cx + 0.4 + k * 1.0, y: DU + 1.2, z: GEN.z1 + 0.03 }, gen); }
    const genL = new T.PointLight("#ffe2b8", 0, 0, 2); genL.position.set(GEN.x0 + 0.8, DU + 3.7, GEN.z1 + 1.2); scene.add(genL);
    M(box(0.4, 0.25, 0.3), dark, { x: GEN.x0 + 0.8, y: DU + GEN.h + 0.2, z: GEN.z1 + 0.15 }, gen); M(box(0.32, 0.03, 0.22), glow("#fff1d8", 6), { x: GEN.x0 + 0.8, y: DU + GEN.h + 0.07, z: GEN.z1 + 0.15, cast: false }, gen);
    // the crane: pedestal, cab, a lattice boom resting toward the west
    const crn = G({ x: 8.5, y: DU, z: 7.5 }); statics.push(crn);
    M(cyl(0.9, 1.1, 5, 18), mat("#e6e8ea", { rough: 0.5 }), { y: 2.5 }, crn); M(box(2.2, 2.0, 2.6), mat("#d0302a", { rough: 0.45, metal: 0.2 }), { y: 6.0, x: 0.4 }, crn);
    M(box(0.04, 1.0, 1.4), new T.MeshPhysicalMaterial({ color: "#20303c", roughness: 0.06 }), { y: 6.3, x: 1.52 }, crn);
    { const A = [-0.6, 6.0, 0], B = [-17.5, 4.6, 0]; for (const [dy, dz] of [[0.4, 0.5], [0.4, -0.5], [-0.4, 0]]) K.rod([A[0], A[1] + dy, dz], [B[0], B[1] + dy * 0.4, dz * 0.4], 0.07, yelR, crn, 6);
      for (let k = 1; k < 16; k++) { const u = k / 16, x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u), sc = lerp(1, 0.4, u); K.rod([x, y + 0.4 * sc, 0.5 * sc], [x + 0.5, y - 0.4 * sc, 0], 0.03, yelR, crn, 4); K.rod([x, y + 0.4 * sc, -0.5 * sc], [x + 0.5, y - 0.4 * sc, 0], 0.03, yelR, crn, 4); }
      M(box(0.6, 4.4, 0.6), yel, { x: -17, y: 2.2 }, crn); }
    // liferaft canisters on the south rail, a container, deck floodlight poles
    const misc = G({}); statics.push(misc);
    for (let k = 0; k < 4; k++) M(new T.CapsuleGeometry(0.33, 0.9, 4, 12), white, { x: -6 + k * 1.1, y: DU + 0.55, z: 12.0, rz: 90 }, misc);
    M(box(6, 2.6, 2.4), mat("#2f6f8f", { rough: 0.55, metal: 0.3 }), { x: -2, y: DU + 1.3, z: 7.5 }, misc);
    const ftexT = K.textTex("rg_muster", 512, 128, (q, w, h) => { q.fillStyle = "#1f5a2e"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffffff"; q.font = "700 76px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("MUSTER POINT", w / 2, 92); });
    M(new T.PlaneGeometry(1.2, 0.3), mat("#ffffff", { map: ftexT, rough: 0.6 }), { x: 1.7, y: DU + 1.9, z: MOD.z1 + 0.13, cast: false }, misc);

    // ================================================================== FLARE BOOM + the flame (billboards, a glow, a light; st.flareI)
    const fb = G({}); statics.push(fb);
    { const up = new T.Vector3(0, 1, 0), d = new T.Vector3().fromArray(FL_D), side = new T.Vector3().crossVectors(d, up).normalize(), up2 = new T.Vector3().crossVectors(side, d).normalize();
      const corner = (k, u, w) => { const a = k * 2.094 + 0.4, p = new T.Vector3().fromArray(FL_ROOT).addScaledVector(d, u * FL_LEN).addScaledVector(side, Math.cos(a) * w).addScaledVector(up2, Math.sin(a) * w); return [p.x, p.y, p.z]; };
      const wOf = (u) => lerp(1.2, 0.45, u);
      for (let k = 0; k < 3; k++) K.rod(corner(k, 0, wOf(0)), corner(k, 1, wOf(1)), 0.09, steel, fb, 6);
      for (let i = 0; i < 22; i++) { const u0 = i / 22, u1 = (i + 1) / 22; for (let k = 0; k < 3; k++) K.rod(corner(k, u0, wOf(u0)), corner((k + 1) % 3, u1, wOf(u1)), 0.035, steel, fb, 4); }
      K.rod(FL_ROOT, FL_TIP, 0.16, mat("#4a4440", { rough: 0.6, metal: 0.3 }), fb, 10);
      K.rod([FL_ROOT[0], DU, FL_ROOT[2]], FL_ROOT, 0.3, steel, fb, 10);
      M(cyl(0.38, 0.3, 1.0, 14), mat("#2c2622", { rough: 0.7, metal: 0.3 }), { x: FL_TIP[0], y: FL_TIP[1] + 0.3, z: FL_TIP[2] }, fb);
      for (const u of [0.5, 0.98]) { const p = corner(0, u, wOf(u)); M(sph(0.14, 8, 6), glow("#ff2a1a", 10), { x: p[0], y: p[1] + 0.3, z: p[2], cast: false }, fb); } }
    const flameU = { t: U.t, k: { value: 1 }, tN: { value: nTex } };
    const flameMat = (seed, core) => new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false,
      uniforms: Object.assign({ seed: { value: seed }, core: { value: core }, fP: { value: new T.Vector3() }, fAx: { value: new T.Vector3(0, 1, 0) }, fW: { value: 5 }, fH: { value: 12 } }, flameU),
      vertexShader: `uniform vec3 fP, fAx; uniform float fW, fH; varying vec2 vUv;
        void main(){ vUv = uv; vec3 V = normalize(cameraPosition - fP); vec3 R = normalize(cross(fAx, V)); vec3 p = fP + fAx * (uv.y * fH) + R * ((uv.x - 0.5) * fW);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float t, k, seed, core; uniform sampler2D tN; varying vec2 vUv;
        void main(){
          float y = vUv.y, x = vUv.x - 0.5;
          float n = texture2D(tN, vec2(vUv.x * 0.9 + seed, y * 0.7 - t * 0.9)).r * 0.6 + texture2D(tN, vec2(vUv.x * 2.1 - seed, y * 1.6 - t * 2.1)).r * 0.4;
          float wob = (texture2D(tN, vec2(y * 0.5 + seed * 3.0, t * 0.6)).r - 0.5) * 0.55 * y + (n - 0.5) * 0.18 * y;
          float wdt = mix(0.46, 0.1, pow(y, 0.7)) * (0.6 + 0.8 * n) * (0.85 + 0.3 * smoothstep(0.0, 0.25, y));
          float body = 1.0 - smoothstep(wdt * 0.5, wdt, abs(x - wob));
          float a = body * smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.42 + 0.4 * n, 1.0, y));
          float hot = a * (1.0 - smoothstep(0.0, 0.55, y)) * (1.0 - smoothstep(0.0, wdt * 0.6, abs(x - wob)));
          vec3 c = mix(vec3(1.0, 0.25, 0.04), vec3(1.0, 0.62, 0.18), a) + vec3(1.0, 0.92, 0.7) * hot * core;
          gl_FragColor = vec4(c * a * k * (2.0 + 4.0 * core), a * k);
        }` });
    const flames = [flameMat(0.13, 1.0), flameMat(0.57, 0.3), flameMat(0.91, 0.0)].map((m, i) => { const mesh = new T.Mesh(new T.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), m); mesh.frustumCulled = false; mesh.renderOrder = 5 + i; scene.add(mesh); K.noDepth.push(mesh); return dyn(mesh); });
    const flGlow = dyn(M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: soft, color: new T.Color("#ff7a2a").multiplyScalar(0.55), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { cast: false, receive: false, nodepth: true }));
    const smokeM = new T.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { t: U.t, tN: { value: nTex }, k: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float t, k; uniform sampler2D tN; varying vec2 vUv; void main(){ float n = texture2D(tN, vec2(vUv.x * 0.8, vUv.y * 0.5 - t * 0.12)).r; float a = smoothstep(0.4, 0.8, n) * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.5, 1.0, vUv.y)) * smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x); gl_FragColor = vec4(vec3(0.05, 0.045, 0.04), a * 0.5 * k); }" });
    const smoke = dyn(M(new T.PlaneGeometry(16, 34), smokeM, { cast: false, receive: false, nodepth: true })); smoke.renderOrder = 4;
    const flareL = new T.PointLight("#ff8a3a", 0, 0, 2); scene.add(flareL);
    flareL.shadow.mapSize.set(1024, 1024); flareL.shadow.camera.near = 1; flareL.shadow.camera.far = 140; flareL.shadow.bias = -0.002; flareL.shadow.radius = 4;

    // ================================================================== DECK FLOODLIGHTS (spot lights, lamp heads with halos)
    const floods = [];
    for (const [x, y, z, tx, ty, tz] of [[11.6, DU + 4.2, 11.6, 2, DU, 2], [-11.6, DU + 4.2, 11.6, -2, DU, 3], [11.6, DM + 5.0, -11.6, 3, DM, -2], [-11.6, DM + 5.0, 11.6, -3, DM, 2], [4.0, DM + 0.4, 12.2, 4.0, 0, 15]]) {
      const pole = G({ x, y: 0, z }); statics.push(pole);
      M(cyl(0.06, 0.08, 4.0, 8), steel, { y: y - 2.0 }, pole);
      M(box(0.5, 0.3, 0.3), dark, { y: y + 0.05 }, pole);
      const L = new T.SpotLight("#ffe5c0", 0, 90, 46 * D2R, 0.6, 1.4); L.position.set(x, y, z); L.target.position.set(tx, ty, tz); scene.add(L, L.target);
      floods.push(L);
      M(box(0.42, 0.04, 0.24), glow("#fff1d8", 9), { x, y: y - 0.12, z, cast: false });
      const halo = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ffe2b0").multiplyScalar(0.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending }), { x, y: y - 0.1, z, s: 2.4, cast: false, receive: false, nodepth: true }); dyn(halo); halo.userData.halo = true; floods[floods.length - 1].userData.halo = halo;
    }
    floods[0].castShadow = true; floods[0].shadow.mapSize.set(1024, 1024); floods[0].shadow.bias = -0.001; floods[0].shadow.radius = 3;

    // ================================================================== THE COAST (stylised 6 km north): land, town lights in sections, the heliport, the crowd, eyes on the shore
    function landH(x, z) { const d = COAST_Z - z + 25 * Math.sin(x / 310) + 14 * Math.sin(x / 97); return d < 0 ? -6 : Math.min(4 + d * 0.025, 6) + 120 * ss((d - 1200) / 3000) * (0.6 + 0.4 * K.fbm(x / 1800, z / 1800, 3, 3)) + 12 * K.fbm(x / 300, z / 300, 5, 3); }
    const land = (() => {
      const g = new T.PlaneGeometry(26000, 9000, 260, 90); g.rotateX(-Math.PI / 2); g.translate(0, 0, COAST_Z - 4480);
      const pa = g.attributes.position, cols = [], c = new T.Color(), a = new T.Color("#0f1210"), b = new T.Color("#22201c");
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), d = COAST_Z - z + 25 * Math.sin(x / 310) + 14 * Math.sin(x / 97);
        const h = landH(x, z);
        pa.setY(i, h); c.copy(a).lerp(b, K.fbm(x / 600, z / 600, 9, 3)); cols.push(c.r, c.g, c.b); }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      return M(g, mat("#ffffff", { vc: true, rough: 0.95 }), { cast: false });
    })();
    // town lights: one Points cloud; each light has a section (0..5, west to east) that st.coastCut switches off in order
    const NTL = 5200, tlp = new Float32Array(NTL * 3), tlc = new Float32Array(NTL * 3), tls = new Float32Array(NTL), tsz = new Float32Array(NTL);
    { const R = rng(606), wc = [new T.Color("#ffb468"), new T.Color("#ffd29a"), new T.Color("#fff0d8"), new T.Color("#ff9a50")];
      for (let i = 0; i < NTL; i++) {
        let x, z;
        if (i < NTL * 0.72) { x = (R() - 0.5) * 9000 * Math.pow(R(), 0.5) * 1.3 + 400; z = COAST_Z - 40 - Math.pow(R(), 1.6) * 2600; }   // the town round the harbour
        else { x = (R() - 0.5) * 7000 + 300; z = COAST_Z - 20 - R() * 120; }                                                         // the coast road
        tlp.set([x, 6 + R() * 40 * ss((COAST_Z - z) / 1500) + 10 * Math.max(0, Math.sin(x / 700)), z], i * 3);
        const c = wc[Math.floor(R() * 4)]; tlc.set([c.r, c.g, c.b], i * 3); tls[i] = clamp(Math.floor((x + 3200) / 1250), 0, 5); tsz[i] = 3 + R() * 5; } }
    const tlg = new T.BufferGeometry(); tlg.setAttribute("position", new T.BufferAttribute(tlp, 3)); tlg.setAttribute("color", new T.BufferAttribute(tlc, 3)); tlg.setAttribute("aS", new T.BufferAttribute(tls, 1)); tlg.setAttribute("aSz", new T.BufferAttribute(tsz, 1));
    const pointsM = (extra) => new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true,
      uniforms: Object.assign({ k: { value: 1 }, cut: { value: 0 }, sc: { value: 1 }, t: U.t, hdr: { value: 1.6 } }, extra || {}),
      vertexShader: `uniform float k, cut, sc, t; attribute float aS, aSz; varying vec3 vC; varying float vA;
        void main(){ vC = color; float on = step(cut, aS + 0.001) * k; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          float px = aSz * sc * projectionMatrix[1][1] * 960.0 / -mv.z; gl_PointSize = clamp(px, 1.5, 7.0); vA = on * clamp(px / 1.5, 0.35, 1.0) * (0.85 + 0.15 * sin(t * 1.3 + aS * 7.0 + position.x)); }`,
      fragmentShader: "uniform float hdr; varying vec3 vC; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c)); a = a * a; gl_FragColor = vec4(vC * a * vA * hdr, a * vA); }" });
    const townM = pointsM(); const town = new T.Points(tlg, townM); town.frustumCulled = false; scene.add(town); K.noDepth.push(town);
    // the heliport on the shore: a pad on piles, an H, edge lights, floodlight poles, the terminal with lit windows, the fence; the crowd behind the fence
    const hp = G({ x: HELI[0], y: 0, z: HELI[2] }); statics.push(hp);
    { M(box(46, 1.2, 40), mat("#4a4f54", { rough: 0.7 }), { y: HELI[1] - 0.6 }, hp);
      for (let x = -20; x <= 20; x += 8) for (const z of [-18, 18]) M(cyl(0.5, 0.5, 8, 10), dark, { x, y: HELI[1] - 4.5, z }, hp);
      const pad = K.canvasTex("rg_pad", 512, 512, (q, w, h) => { q.fillStyle = "#3a4046"; q.fillRect(0, 0, w, h); q.strokeStyle = "#f2c230"; q.lineWidth = 16; q.beginPath(); q.arc(w / 2, h / 2, w * 0.36, 0, 7); q.stroke(); q.fillStyle = "#f2f2f2"; const s = w * 0.15; q.fillRect(w / 2 - s * 0.62, h / 2 - s, s * 0.32, s * 2); q.fillRect(w / 2 + s * 0.3, h / 2 - s, s * 0.32, s * 2); q.fillRect(w / 2 - s * 0.62, h / 2 - s * 0.14, s * 1.24, s * 0.28); });
      M(new T.PlaneGeometry(24, 24), mat("#ffffff", { map: pad, rough: 0.7 }), { y: HELI[1] + 0.02, rx: -90, cast: false }, hp);
      for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; M(sph(0.11, 8, 6), glow("#5dff8c", 2.5), { x: Math.cos(a) * 12.5, y: HELI[1] + 0.12, z: Math.sin(a) * 12.5, cast: false }, hp); }
      M(box(18, 7, 10), mat("#9aa0a4", { rough: 0.7 }), { x: -2, y: HELI[1] + 3.5, z: -44 }, hp);
      const termT = K.canvasTex("rg_term", 256, 128, (q, w, h) => { q.fillStyle = "#0c0e10"; q.fillRect(0, 0, w, h); for (let x = 8; x < w; x += 32) for (let y = 12; y < h; y += 52) { q.fillStyle = Math.random() < 0.75 ? "#ffd9a0" : "#2a2a2a"; q.fillRect(x, y, 22, 30); } });
      M(new T.PlaneGeometry(17.6, 6.4), new T.MeshBasicMaterial({ map: termT, color: new T.Color(1.2, 1.2, 1.2) }), { x: -2, y: HELI[1] + 3.5, z: -38.95, cast: false }, hp);
      const lobT = K.canvasTex("rg_lobby", 512, 64, (q, w, h) => { const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#fff0d0"); gr.addColorStop(1, "#ffcf8a"); q.fillStyle = gr; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(40,30,20,0.55)"; for (let x = 0; x < w; x += 40) q.fillRect(x, 0, 4, h); q.fillRect(0, 0, w, 4); });
      M(new T.PlaneGeometry(40, 3.2), new T.MeshBasicMaterial({ map: lobT, color: new T.Color(1.6, 1.6, 1.6) }), { x: 0, y: HELI[1] + 1.6, z: -36.0, cast: false }, hp);
      M(box(42, 0.4, 3), mat("#5a6066", { rough: 0.7 }), { y: HELI[1] + 3.4, z: -35.2 }, hp);
      // the fence along the pad's landward side (z -20): posts + a chain-link band
      const fenceT = K.canvasTex("rg_fence", 64, 64, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = "rgba(170,175,180,0.9)"; q.lineWidth = 2; for (let x = -64; x < 128; x += 10) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + 64, h); q.stroke(); q.beginPath(); q.moveTo(x + 64, 0); q.lineTo(x, h); q.stroke(); } }, { repeat: true });
      fenceT.repeat.set(30, 2);
      M(new T.PlaneGeometry(44, 2.6), new T.MeshStandardMaterial({ map: fenceT, transparent: true, alphaTest: 0.25, side: T.DoubleSide, color: "#b0b4b8", roughness: 0.6, metalness: 0.4 }), { y: HELI[1] + 1.3, z: -20.2, cast: false }, hp);
      for (let x = -22; x <= 22; x += 2.75) M(cyl(0.05, 0.05, 2.8, 6), steel, { x, y: HELI[1] + 1.4, z: -20.2 }, hp);
      for (const [x, z] of [[-21, 15], [21, 15], [-21, -16], [21, -16]]) { M(cyl(0.12, 0.15, 9, 8), steel, { x, y: HELI[1] + 4.5, z }, hp); M(box(0.8, 0.3, 0.5), glow("#fff3dc", 10), { x, y: HELI[1] + 9.1, z, cast: false }, hp); } }
    const hpL = [new T.SpotLight("#ffe9c8", 0, 120, 50 * D2R, 0.5, 1.2), new T.SpotLight("#ffe9c8", 0, 120, 50 * D2R, 0.5, 1.2)];
    hpL[0].position.set(HELI[0] - 21, HELI[1] + 9, HELI[2] - 16); hpL[1].position.set(HELI[0] + 21, HELI[1] + 9, HELI[2] - 16);
    hpL.forEach((L) => { L.target.position.set(HELI[0], HELI[1], HELI[2] - 6); scene.add(L, L.target); });
    // a figure geometry (the dead): one merged mesh; arms forward (crowd) or raised (sinking)
    function figureGeo(arms, R) {
      const parts = [], add = (g, x, y, z, rx, rz) => { const m = new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, 0, rz || 0)), new T.Vector3(1, 1, 1)); g.applyMatrix4(m); parts.push(g); };
      const h = 0.9 + (R ? R() * 0.2 : 0.1);
      add(new T.CapsuleGeometry(0.17, 0.42 * h, 4, 10), 0, 1.15 * h, 0, 0.12, 0);
      add(new T.SphereGeometry(0.115, 12, 10), 0, 1.6 * h, 0.04);
      for (const s of [-1, 1]) {
        add(new T.CapsuleGeometry(0.075, 0.68 * h, 4, 8), s * 0.1, 0.45 * h, 0, 0, s * 0.04);
        if (arms === "up") add(new T.CapsuleGeometry(0.055, 0.6, 4, 8), s * 0.24, 1.62 * h, 0.05, -0.15, -s * 0.32);
        else add(new T.CapsuleGeometry(0.055, 0.6, 4, 8), s * 0.22, 1.32 * h, 0.22, -1.2 + (R ? R() * 0.3 : 0), 0);
      }
      return { g: merge(parts), h };
    }
    function merge(geos) {
      let n = 0, ni = 0; for (const g of geos) { n += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = new Uint32Array(ni); let o = 0, oi = 0;
      for (const g of geos) { if (!g.attributes.normal) g.computeVertexNormals(); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
        for (let i = 0; i < pa.count; i++) { pos.set([pa.getX(i), pa.getY(i), pa.getZ(i)], (o + i) * 3); nor.set([na.getX(i), na.getY(i), na.getZ(i)], (o + i) * 3); if (ua) uv.set([ua.getX(i), ua.getY(i)], (o + i) * 2); }
        if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + o; else for (let i = 0; i < pa.count; i++) idx[oi + i] = i + o;
        o += pa.count; oi += g.index ? g.index.count : pa.count; }
      const out = new T.BufferGeometry(); out.setAttribute("position", new T.BufferAttribute(pos, 3)); out.setAttribute("normal", new T.BufferAttribute(nor, 3)); out.setAttribute("uv", new T.BufferAttribute(uv, 2)); out.setIndex(new T.BufferAttribute(idx, 1)); out.computeBoundingSphere(); return out;
    }
    const deadM = mat("#07080a", { rough: 0.95 });
    const NC = 220, crowdF = figureGeo("fwd").g, crowd = dyn(new T.InstancedMesh(crowdF, deadM, NC)); scene.add(crowd); crowd.frustumCulled = false; crowd.castShadow = false;
    const crowdP = [];
    { const R = rng(4242); for (let i = 0; i < NC; i++) { const x = HELI[0] + (R() - 0.5) * 42, z = HELI[2] - 21.0 - Math.pow(R(), 1.3) * 14; crowdP.push({ x, z, ry: (R() - 0.5) * 0.8, s: 0.92 + R() * 0.16, ph: R() * 10 }); } }
    // red eyes as point pairs: on the shore (a long line) and on the crowd's faces
    const eyeCol = [1.0, 0.16, 0.08];
    function eyeInst(list, r, sep) {   // list: [x, y, z, (unused), facing angle]; a pair of glowing spheres per entry, `sep` m apart
      const n = list.length * 2, mt = glow("#ff2412", 7, { fog: false }), im = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), mt, n);
      im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; scene.add(im); dyn(im);
      const data = list.map((e, i) => ({ x: e[0], y: e[1], z: e[2], a: e[4] || 0, ph: ((i * 0.6180339) % 1) * 40 }));
      const _m = new T.Matrix4(), _p = new T.Vector3(), _s = new T.Vector3(), _q = new T.Quaternion();
      function set(t, k, sc, sp) {
        im.visible = k > 0.01; if (!im.visible) return;
        mt.color.set("#ff2412").multiplyScalar(7 * k);
        data.forEach((d, i) => { const bl = Math.sin(t * 0.9 + d.ph) > 0.93; const rr = bl ? 1e-5 : r * sc;
          for (let q = 0; q < 2; q++) { const off = sep * sp * 0.5 * (q ? 1 : -1); _m.compose(_p.set(d.x + Math.cos(d.a) * off, d.y, d.z + Math.sin(d.a) * off), _q, _s.set(rr, rr, rr)); im.setMatrixAt(i * 2 + q, _m); } });
        im.instanceMatrix.needsUpdate = true;
      }
      return { im, set };
    }
    const shoreList = []; { const R = rng(7171); for (let i = 0; i < 520; i++) { const x = (R() - 0.5) * 9000 + 300, z = COAST_Z - 30 - R() * 60; shoreList.push([x, landH(x, z) + 3.5 + R() * 0.5, z, 0.9, 0]); } }
    const shoreEyes = eyeInst(shoreList, 0.6, 1.6);
    const crowdEyes = eyeInst(crowdP.map((p) => [p.x + Math.sin(p.ry) * 0.2 * p.s, HELI[1] + 0.02 + 1.6 * p.s, p.z + Math.cos(p.ry) * 0.2 * p.s, 0, -p.ry]), 0.024, 0.09);

    // ================================================================== THE HELICOPTER (a dark airframe + nav/strobe/landing lights; st.heliK, heliP, heliYaw, heliBank)
    const heli = dyn(G({}));
    { const body = mat("#1d2126", { rough: 0.5, metal: 0.3 });
      M(sph(1.4, 18, 14), body, { sx: 1.0, sy: 1.05, sz: 2.2 }, heli); M(cyl(0.22, 0.4, 7, 10), body, { z: -5.2, rx: 90 }, heli); M(box(0.12, 1.6, 1.0), body, { z: -8.6, y: 0.6 }, heli);
      M(cyl(5.8, 5.8, 0.03, 32), new T.MeshBasicMaterial({ color: "#2a2e34", transparent: true, opacity: 0.25, depthWrite: false }), { y: 1.55, cast: false, nodepth: true }, heli);
      for (const s of [-1, 1]) K.rod([s * 0.9, -1.5, 1.2], [s * 0.9, -1.5, -1.6], 0.06, body, heli, 6);
      M(sph(0.22, 8, 6), glow("#ff2a1a", 20, { fog: false }), { x: -1.4, cast: false }, heli); M(sph(0.22, 8, 6), glow("#2aff6a", 20, { fog: false }), { x: 1.4, cast: false }, heli);
      const strobe = M(sph(0.25, 8, 6), glow("#ffffff", 40, { fog: false }), { y: -1.2, z: -1, cast: false }, heli); heli.userData.strobe = strobe;
      const land = M(sph(0.35, 10, 8), glow("#fff6e0", 40, { fog: false }), { y: -1.1, z: 2.6, cast: false }, heli); void land;
      const hl = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#fff2d8").multiplyScalar(1.0), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { y: -1.1, z: 2.8, s: 14, cast: false, receive: false, nodepth: true }, heli); heli.userData.halo = hl;
      const beamM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, uniforms: { k: { value: 1 } }, vertexShader: "varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: "uniform float k; varying float vY; void main(){ float a = pow(vY, 2.0) * 0.16 * k; gl_FragColor = vec4(vec3(1.0, 0.95, 0.82) * a, a); }" });
      const bg = new T.ConeGeometry(9, 60, 20, 1, true); bg.translate(0, -30, 0); bg.rotateX(-Math.PI / 2 + 0.5);
      M(bg, beamM, { y: -1.1, z: 2.6, cast: false, receive: false, nodepth: true }, heli); }

    // ================================================================== THE SEAGULL on the north rail outside the control-room window
    for (const x of WINS_N) M(box(WIN_W + 0.1, 0.05, 0.32), dark, { x, y: WY0 - 0.04, z: MOD.z0 - 0.2 });
    const gull = dyn(G({ x: -7.45, y: WY0 + 0.02, z: -12.3 }));
    const gullHead = G({ y: 0.2, z: 0.13 }, gull);
    { const wM = mat("#f2f2ee", { rough: 0.7 }), gM = mat("#9aa2aa", { rough: 0.7 }), bM = mat("#151515", { rough: 0.6 }), yM = mat("#e8b51e", { rough: 0.5 });
      M(sph(0.1, 16, 12), wM, { y: 0.12, sz: 1.9, sy: 1.0, rx: -12 }, gull);
      for (const s of [-1, 1]) { M(sph(0.09, 12, 10), gM, { x: s * 0.07, y: 0.15, z: -0.04, sx: 0.45, sy: 0.8, sz: 2.1, rx: -14 }, gull); M(sph(0.04, 8, 6), bM, { x: s * 0.05, y: 0.14, z: -0.24, sx: 0.5, sy: 0.6, sz: 1.8, rx: -10 }, gull); }
      M(sph(0.05, 10, 8), wM, { y: 0.06, z: -0.24, sx: 1.2, sy: 0.4, sz: 1.2 }, gull);
      M(sph(0.068, 14, 12), wM, { sy: 0.95, sz: 1.1 }, gullHead);
      M(new T.ConeGeometry(0.018, 0.09, 8), yM, { z: 0.09, y: -0.01, rx: 90 }, gullHead); M(sph(0.007, 6, 4), mat("#c8321f"), { z: 0.095, y: -0.022 }, gullHead);
      for (const s of [-1, 1]) M(sph(0.011, 8, 6), bM, { x: s * 0.04, y: 0.02, z: 0.05 }, gullHead);
      for (const s of [-1, 1]) M(cyl(0.008, 0.008, 0.1, 6), mat("#d89a8a"), { x: s * 0.03, y: -0.02 }, gull); }

    // ================================================================== UNDERWATER: the dead sinking past the legs; marine snow
    const sinkers = [];
    { const R = rng(3131);
      for (let i = 0; i < 11; i++) { const f = figureGeo("up", R), m = M(f.g, deadM, { cast: false }); dyn(m);
        const eg = G({}, m); const em = glow("#ff2412", 10, { fog: false }); M(sph(0.026, 8, 6), em, { x: -0.045, y: 1.6 * f.h, z: 0.172, cast: false }, eg); M(sph(0.026, 8, 6), em, { x: 0.045, y: 1.6 * f.h, z: 0.172, cast: false }, eg);
        m.scale.setScalar(1.15); sinkers.push({ m, em, x: -5 + (i % 6) * 2.3 + (R() - 0.5) * 1.2, z: 4 + R() * 9, y0: -1.5 - (i % 4) * 2.2 - R() * 1.5, v: 0.45 + R() * 0.35, rx: (R() - 0.5) * 0.8, rz: (R() - 0.5) * 0.8, spin: (R() - 0.5) * 0.3, ph: R() * 6 }); } }
    const NS = 2400, snp = new Float32Array(NS * 3), snr = new Float32Array(NS);
    { const R = rng(99); for (let i = 0; i < NS; i++) { snp.set([R() * 40 - 20, R() * 30 - 15, R() * 40 - 20], i * 3); snr[i] = R(); } }
    const sng = new T.BufferGeometry(); sng.setAttribute("position", new T.BufferAttribute(snp, 3)); sng.setAttribute("aR", new T.BufferAttribute(snr, 1));
    const snowM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { t: U.t, k: { value: 0 }, cam: { value: new T.Vector3() } },
      vertexShader: `uniform float t, k; uniform vec3 cam; attribute float aR; varying float vA;
        void main(){ vec3 p = position; p.y -= t * (0.15 + aR * 0.2); p.x += sin(t * 0.3 + aR * 20.0) * 0.4;
          p = mod(p - cam + vec3(20.0, 15.0, 20.0), vec3(40.0, 30.0, 40.0)) - vec3(20.0, 15.0, 20.0) + cam;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z; gl_PointSize = clamp(40.0 / d, 1.0, 5.0); vA = k * 0.5 * smoothstep(0.5, 2.0, d) * (1.0 - smoothstep(10.0, 22.0, d)); }`,
      fragmentShader: "varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c)) * vA; gl_FragColor = vec4(vec3(0.6, 0.8, 0.82) * a, a); }" });
    const msnow = new T.Points(sng, snowM); msnow.frustumCulled = false; scene.add(msnow); K.noDepth.push(msnow);

    const uwM = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { k: { value: 1 } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float k; varying vec3 vD; void main(){ float u = clamp(vD.y * 0.5 + 0.5, 0.0, 1.0); vec3 c = mix(vec3(0.006, 0.026, 0.032), vec3(0.06, 0.22, 0.23), smoothstep(0.15, 0.85, u)); c += vec3(0.12, 0.34, 0.32) * pow(max(vD.y, 0.0), 3.0); gl_FragColor = vec4(c * k, 1.0); }" });
    const uwDome = dyn(M(new T.SphereGeometry(320, 32, 20), uwM, { cast: false, receive: false, nodepth: true })); uwDome.renderOrder = -9;

    // ================================================================== BAKE the static groups (merge meshes by material; ~an order of magnitude fewer draw calls)
    function bake(group) {
      group.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(group.matrixWorld).invert(), buckets = new Map(), kill = [];
      group.traverse((o) => {
        if (!o.isMesh || o.userData.dyn || o.isInstancedMesh || Array.isArray(o.material) || K.noDepth.includes(o) || o.material.transparent) return;
        let p = o.parent, skip = false; while (p && p !== group) { if (p.userData.dyn) skip = true; p = p.parent; } if (skip) return;
        const key = o.material.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "");
        const g = o.geometry.index ? o.geometry.clone() : o.geometry.clone(); g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
        if (!buckets.has(key)) buckets.set(key, { m: o.material, c: o.castShadow, r: o.receiveShadow, gs: [] });
        buckets.get(key).gs.push(g); kill.push(o);
      });
      for (const o of kill) o.parent.remove(o);
      for (const b of buckets.values()) { const mesh = new T.Mesh(merge(b.gs), b.m); mesh.castShadow = b.c; mesh.receiveShadow = b.r; group.add(mesh); }
    }
    statics.forEach(bake);

    // ================================================================== PER-FRAME STATE
    const V3 = new T.Vector3(), V3b = new T.Vector3(), Q = new T.Quaternion(), Mx = new T.Matrix4(), E3 = new T.Euler();
    const flAxis = new T.Vector3(0.55, 1, -0.32).normalize();
    const fogBase = K.FOG.clone(), bgBase = K.scene.background.clone();
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      U.t.value = t; U.swell.value = I("swell", 1); U.foam.value = I("foam", 1);
      // underwater: teal fog, the camera below the surface
      const under = I("under", 0) > 0.5;
      if (under) { K.FOG.set("#0f3a42"); scene.background.set("#04121a"); scene.fog.density = I("uwFog", 0.036); }
      else { K.FOG.copy(fogBase); scene.background.copy(bgBase); }
      // the flare: flame billboards, glow, smoke, light, the heat shimmer point for the kit (st.warpAt)
      const fk = I("flareI", 1), fl = fk * (0.86 + 0.14 * (Math.sin(t * 7.3) * 0.5 + Math.sin(t * 13.1 + 1.3) * 0.3 + Math.sin(t * 2.1) * 0.2));
      U.flareK.value = fk; U.cloudGlow.value = fk * I("cloudGlow", 1); flameU.k.value = fk > 0.01 ? 1 : 0;
      const tip = V3.fromArray(FL_TIP); tip.y += 0.6;
      const ax = V3b.copy(flAxis); ax.x += Math.sin(t * 1.3) * 0.05; ax.z += Math.sin(t * 0.9) * 0.04; ax.normalize();
      flames.forEach((m, i) => { const u = m.material.uniforms; u.fP.value.copy(tip); u.fAx.value.copy(ax); u.fW.value = [6.5, 9.5, 12.5][i] * (0.9 + 0.1 * Math.sin(t * 3 + i)); u.fH.value = [13, 17, 20][i]; m.visible = fk > 0.01; });
      flGlow.position.copy(tip).addScaledVector(ax, 4.5); flGlow.lookAt(cam.position); flGlow.scale.setScalar(34 * Math.max(0.2, fk)); flGlow.visible = fk > 0.01;
      smoke.position.copy(tip).addScaledVector(ax, 24).add(V3b.set(8, 4, -5)); smoke.lookAt(cam.position.x, smoke.position.y, cam.position.z); smoke.visible = fk > 0.01;
      flareL.position.copy(tip).addScaledVector(ax, 4); flareL.intensity = 2600 * fl;
      const fsh = I("flareShadow", 0) > 0.5; if (flareL.castShadow !== fsh) flareL.castShadow = fsh;
      if (I("warpK", 0) > 0 && !st.warpAt) { const w = tip.clone().addScaledVector(ax, 13); st.warpAt = [w.x, w.y, w.z]; const hh = 2 * Math.max(1, w.distanceTo(cam.position)) * Math.tan(cam.fov * D2R / 2); st.warpR = [8 / (hh * 0.5625), 11 / hh]; }
      // deck floods, the helideck lights (blinking on with heliDeckK), obstruction lights
      const fd = I("floodI", 1); floods.forEach((L) => { L.intensity = 260 * fd; L.userData.halo.visible = fd > 0.05; L.userData.halo.lookAt(cam.position); L.userData.halo.scale.setScalar(2.4 + 0.6 * fd); });
      const hk = I("heliDeckK", 1); const blink = I("heliBlink", 0) > 0 ? (Math.sin(t * 9) > 0 ? 1 : 0.15) : 1;
      hdLm.color.set("#5dff8c").multiplyScalar(6 * hk * blink); hdHaloM.color.set("#5dff8c").multiplyScalar(0.55 * hk * blink); hdHalos.visible = hk > 0.01;
      if (hk > 0.01) { hdLights.forEach((p, i) => { Mx.compose(p, cam.quaternion, V3b.set(0.85, 0.85, 0.85)); hdHalos.setMatrixAt(i, Mx); }); hdHalos.instanceMatrix.needsUpdate = true; }
      sockLight.visible = Math.sin(t * 2.6) > -0.2;
      sock.rotation.y = (35 + Math.sin(t * 1.7) * 8) * D2R; sock.rotation.z = Math.sin(t * 3.1) * 4 * D2R;
      // interior lights (zero outside their shots: shadowless point lights light through walls)
      ceilL.forEach((L) => (L.intensity = 6 * I("crI", 0))); ceilPanel.color.set("#eef4ff").multiplyScalar(2.0 * clamp(I("crI", 0), 0.15, 1.5));
      lampL.intensity = 2.6 * I("lampI", 0); lampBulb.material.color.set("#ffd9a0").multiplyScalar(8 * clamp(I("lampI", 0), 0.1, 2));
      monL.intensity = 1.6 * I("monI", 0); monMs.forEach((m) => m.color.setScalar(clamp(0.25 + 0.75 * I("scrK", 1), 0, 1.4)));
      wallM.color.setScalar(clamp(I("scrK", 1), 0.05, 1.4));
      blindM.color.setScalar(0.9 * I("winK", 1)); winGlowM.opacity = clamp(0.55 * I("winGlow", 0), 0, 1); winGlow.forEach((m) => (m.visible = I("winGlow", 0) > 0.01));
      rdM.color.setScalar(0.15 + 1.6 * I("radioK", 0)); txM.color.set("#ff3020").multiplyScalar(0.1 + 9 * I("txK", 0));
      const mk = I("micro", 0); mwWin.color.setScalar(0.7 + 0.3 * mk); mwDisp.color.setScalar(0.2 + 1.4 * mk); mwL.intensity = 0.9 * mk; plate.rotation.y = mk * t * 1.4;
      stoL.intensity = 7 * I("storeI", 0); utlL.intensity = 6 * I("utilI", 0); genL.intensity = 60 * I("genI", 0);
      needles.forEach((n, i) => (n.rotation.z = -0.3 + i * 0.35 + Math.sin(t * (1.3 + i)) * 0.03));
      // water from the tap into the jug
      const wk = I("waterK", 0); streamM.uniforms.k.value = wk; stream.visible = wk > 0.01; stream.scale.y = 0.4; stream.position.y = tapP[1] - 0.2;
      const jk2 = I("jugK", 0.2); jugWater.scale.y = Math.max(0.001, 0.2 * jk2); jugWater.position.y = 0.1 * jk2 + 0.005;
      // the ladder: down (0) in the waves, up (1) out of them; the cable; the crank turns
      const ld = I("ladder", 0); lad.position.y = -3.6 + ld * 8.0; ladCable.scale.y = Math.max(0.1, DM - (lad.position.y + 7.2)); ladCable.position.y = (DM + lad.position.y + 7.2) / 2; crank.rotation.x = ld * 40;
      // the chain round the gate (0 = off, 1 = wrapped + locked)
      const ch = I("chain", 0); chainG.visible = ch > 0.01;
      links.forEach((l, k) => { const u = k / (links.length - 1), a = u * Math.PI * 2.6 * Math.min(1, ch * 1.3), r = 0.07; l.position.set(Math.sin(a) * r * 0.6 - 0.04 + u * 0.02, -0.1 + u * 0.16, Math.cos(a) * r); l.rotation.set(a, k % 2 ? Math.PI / 2 : 0, 0); l.visible = u <= ch * 1.05; });
      lock.position.set(-0.02, -0.16, 0.08); lock.rotation.set(0, 0, 0.2); lock.visible = ch > 0.85;
      // the gull
      gull.visible = I("gull", 1) > 0.5; gull.rotation.order = "YXZ"; gull.rotation.set(-0.32, I("gullRy", 0) * D2R, 0); gullHead.rotation.y = I("gullHead", 0) * D2R; gullHead.rotation.x = Math.sin(t * 0.8) * 0.05;
      // the helicopter
      const hK = I("heliK", 0); heli.visible = hK > 0.01;
      if (heli.visible) { const p = st.heliP || [0, 120, -900]; heli.position.fromArray(p); heli.rotation.set(0, (I("heliYaw", 0)) * D2R, 0); heli.rotateZ((I("heliBank", 0)) * D2R); heli.userData.strobe.visible = Math.sin(t * 8) > 0.75; heli.userData.halo.lookAt(cam.position); heli.userData.halo.scale.setScalar(I("heliHalo", 14)); }
      // the coast: town lights by section (st.coastCut 0..6 switches sections off), the crowd, the eyes
      const ck = I("coastK", 1); townM.uniforms.k.value = ck; townM.uniforms.cut.value = I("coastCut", 0); townM.uniforms.sc.value = I("townS", 1); U.coastK.value = ck * clamp(1 - I("coastCut", 0) / 6, 0, 1);
      hpL.forEach((L) => (L.intensity = 900 * I("heliportI", 0)));
      shoreEyes.set(t, I("shoreEyesK", 0), I("shoreEyeS", 1), I("shoreEyeSep", 1));
      const ce = I("crowdK", 0); crowd.visible = ce > 0.01; crowdEyes.set(t, ce, 1, 1);
      if (crowd.visible) { crowdP.forEach((p, i) => { Mx.compose(V3.set(p.x, HELI[1] + 0.02, p.z), Q.setFromEuler(E3.set(0, p.ry + Math.sin(t * 0.7 + p.ph) * 0.05, 0)), V3b.set(p.s, p.s, p.s)); crowd.setMatrixAt(i, Mx); }); crowd.instanceMatrix.needsUpdate = true; }
      // rain, clouds
      rainM.uniforms.k.value = I("rainK", 0); rainM.uniforms.cam.value.copy(cam.position); rain.visible = I("rainK", 0) > 0.01;
      clouds.forEach((c, i) => { c.material.uniforms.k.value = I("cloudK", 1) * (i ? I("scudK", 1) : 1); c.visible = !under; });
      // underwater: the dead sink (st.sinkT seconds), marine snow
      const dk2 = I("deadK", 0), sT = I("sinkT", 0);
      sinkers.forEach((s) => { s.m.visible = dk2 > 0.01; if (!s.m.visible) return; const y = s.y0 - s.v * sT; s.m.position.set(s.x + Math.sin(sT * 0.4 + s.ph) * 0.4, y, s.z); s.m.rotation.set(s.rx + Math.sin(sT * 0.5 + s.ph) * 0.1, s.spin * sT + s.ph, s.rz); s.em.color.set("#ff2412").multiplyScalar(10 * dk2 * clamp(1 - (-y - 6) / 26, 0.05, 1)); });
      uwDome.visible = under; if (under) uwDome.position.copy(cam.position); U.refl.value = I("seaRefl", 1);
      snowM.uniforms.k.value = under ? 1 : 0; snowM.uniforms.cam.value.copy(cam.position); msnow.visible = under;
      seas.forEach((m) => (m.visible = I("seaK", 1) > 0.5));
    });

    return { P: { DM, DU, HALF, MOD, CR, STO, UTL, HD, FL_ROOT, FL_TIP, FL_D, GEN, STAIR, LADDER, COAST_Z, HELI, SEAT, WINS_N, WY0, WY1, legC }, gull, heli, gate, chainG, lad, radioG, handset, logbook, pen, mug, mw, wm, jug, crowdP, sinkers, flareL, floods, gp };
  }

  // ------------------------------------------------------------------ Mira: the Hazel v2 rig with a new face, a black blunt bob with a straight fringe, an orange offshore coverall
  const MIRA = {
    skin: "#c48a64", skinSheen: "#d29c7c", earIn: "#9c6646", lip: "#a85e58", brow: "#141012", iris: [[52, 32, 20], [22, 13, 8]],
    face: { w: 0.95, len: 1.08, jaw: 0.2, jawW: 0.012, chin: 0.06, cheek: 0.009, cheekX: 0.056, blush: 0.5, eyeX: 0.036, eyeY: 0.0115, eyeZ: "fit", eyeS: 0.9, lid: 15, lowLid: 10, tilt: 9,
      nose: 0.92, noseW: 1.0, noseL: 0.88, noseZ: 0.8, noseTip: 0.94, nostrils: 0.88, bridge: 0.72, bridgeW: 0.9, browY: 0.003, browArch: 0.4, browT: 0.9, browLen: 1.04, browIn: 0.001, lipW: 0.93, lipT: 1.12 },
    hairStyle: "bob", part: 1, hair: "#0d0b0c", hairStreaks: ["rgba(0,0,0,0.45)", "rgba(40,40,48,0.35)", "rgba(70,72,84,0.25)"], hairSheen: "#6a7488", fringe: false, pony: false,
    jacket: "#ec6a1c", jacketSheen: "#ffb07a", jacketRough: 0.7, trim: "#b84a10", trimSheen: "#ff9a5a", seam: "#a8440e", pants: "#ec6a1c", pantsSheen: "#ffb07a",
    boot: "#1c1a1a", sole: "#0e0d0d", under: "#3a3d44", tie: "#0d0b0c", chestPocket: true, handPockets: true,
  };
  function dressMira(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, sp = hz.spine, surf = hz.surf, head = hz.head, FC = hz.FC;
    // the straight-cut fringe: a thick shell over the forehead following the head's front surface, cut straight above the brows
    const fz = hz.fz, NU = 40, NV = 14, pos = [], uv = [], idx = [];
    const Y0 = 0.0555, Y1 = 0.09;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const u = i / NU * 2 - 1, v = j / NV, y = lerp(Y0, Y1, v);
      const halfW = lerp(0.08, 0.062, v * v), x = u * halfW;
      const edge = Math.abs(u), off = lerp(0.008, 0.016, v) + 0.003 * Math.pow(edge, 3);
      const z = Math.max(fz(x, y), 0.01 + 0.03 * (1 - edge)) + off - 0.004 * Math.pow(edge, 4);
      pos.push(x * (1 + 0.05 * Math.pow(edge, 2)), y + 0.0004 * Math.sin(u * 23) * (1 - v) + (edge > 0.86 ? -0.009 * (edge - 0.86) / 0.14 * (1 - v) : 0), z); uv.push(i / NU, v);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const fg = new T.BufferGeometry(); fg.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); fg.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); fg.setIndex(idx); fg.computeVertexNormals();
    const fringeM = hz.mats.hairM.clone(); fringeM.side = T.DoubleSide; fringeM.normalScale.set(0.12, 0.12);
    M(fg, fringeM, { y: 0.1, cast: true }, head);
    // the blunt edge: a thin strip under the fringe's lower edge so the cut reads as thick hair, not a sheet
    { const pts = []; for (let i = 0; i <= NU; i++) { const u = i / NU * 2 - 1, x = u * 0.08, y = Y0 + 0.0004 * Math.sin(u * 23) + (Math.abs(u) > 0.86 ? -0.009 * (Math.abs(u) - 0.86) / 0.14 : 0); pts.push([x * (1 + 0.05 * u * u), y, Math.max(fz(x, y), 0.01 + 0.03 * (1 - Math.abs(u))) + 0.0048 + 0.003 * Math.pow(Math.abs(u), 3)]); }
      M(K.tubeGeo(pts, 60, 6, () => 0.0042, { squash: () => 0.75 }), fringeM, { y: 0.1, cast: false }, head); }
    // the coverall: reflective bands round the chest and back, both sleeves (upper arm, forearm), both legs (above + below the knee)
    const band = K.pmat("#d4dade", { rough: 0.32, metal: 0.35, sheen: 0.3, sheenColor: "#ffffff" }); band.emissive = new T.Color("#3a4046"); band.emissiveIntensity = 0.5;
    for (const y of [0.29, 0.335]) { const pts = []; for (let a = -3.14; a <= 3.15; a += 0.07) pts.push(surf(y, a, 1.018)); M(K.tubeGeo(pts, 100, 4, () => 0.0085, { squash: () => 0.35 }), band, { cast: false }, sp); }
    for (const a of hz.arms) { M(K.sweepGeo([[-0.17, 0.0535, 0.0555, 0], [-0.135, 0.0545, 0.0565, 0]], 22, { n: 2 }), band, { cast: false }, a.sh); M(K.sweepGeo([[-0.17, 0.0465, 0.0485, 0], [-0.135, 0.0475, 0.0495, 0]], 22, { n: 2 }), band, { cast: false }, a.el); }
    for (const L of hz.legs) { M(K.sweepGeo([[-0.33, 0.069, 0.072, 0.006], [-0.29, 0.071, 0.074, 0.006]], 24, { n: 2 }), band, { cast: false }, L.th); M(K.sweepGeo([[-0.25, 0.0545, 0.0585, 0.004], [-0.21, 0.0555, 0.0595, 0.004]], 24, { n: 2 }), band, { cast: false }, L.kn); }
    // the grey fleece collar (a pile ring round the neck over the stand collar)
    const pile = K.heightNormal("mira_pile", 128, (x, y) => K.vnoise(x / 1.6, y / 1.6, 4) * 0.7 + K.hash2(x, y, 8) * 0.3, 3.5);
    const fleece = K.pmat("#43464b", { rough: 0.98, sheen: 0.6, sheenColor: "#8d939b", sheenRough: 0.85, normalMap: K.nmap(pile, 10, 3), ns: 0.8, side: T.DoubleSide });
    sp.children.forEach((o) => { if (o.isMesh && o.geometry && o.geometry.type === "CylinderGeometry" && o.geometry.parameters.openEnded && o.geometry.parameters.thetaLength < 6) o.visible = false; if (o.isMesh && o.geometry && o.geometry.type === "TorusGeometry" && o.geometry.parameters.arc < 6 && o.position.y > 0.59) o.visible = false; });
    M(new T.CylinderGeometry(0.055, 0.068, 0.056, 40, 1, true, (26 * Math.PI) / 180, (308 * Math.PI) / 180), fleece, { y: 0.563, z: -0.006, rx: -6 }, sp);
    M(new T.TorusGeometry(0.057, 0.008, 10, 40, (308 * Math.PI) / 180), fleece, { y: 0.591, z: -0.009, rx: 90 - 6, rz: 90 + 26 }, sp);
    // almond eyes: narrow the eye, lid and lower-lid groups vertically (the rig's eyes are spheres)
    hz.face.children.forEach((o) => { if (o.isGroup && Math.abs(Math.abs(o.position.x) - FC.eyeX) < 0.002 && Math.abs(o.position.y - FC.eyeY) < 0.002) { o.scale.y *= 0.78; o.scale.x *= 1.06; } });
    // the white hard hat (deck shots only: hz.setHat(true)), sized to the hair's crown
    const hat = G({ y: 0.1 + 0.042, z: -0.004, rx: -5 }, head);
    { const hw = K.pmat("#f2f2ee", { rough: 0.32, cc: 0.6, ccRough: 0.25 });
      const dome = new T.SphereGeometry(0.118, 40, 22, 0, Math.PI * 2, 0, Math.PI * 0.5); dome.scale(FC.w * 1.0, 0.9, 1.12);
      M(dome, hw, {}, hat);
      const peak = new T.CylinderGeometry(0.15, 0.15, 0.01, 40, 1, false, -Math.PI * 0.32, Math.PI * 0.64); peak.scale(FC.w * 0.86, 1, 1.0);
      M(peak, hw, { y: 0.003, z: 0.0, rx: 6 }, hat);
      M(new T.TorusGeometry(0.118, 0.004, 6, 48), hw, { y: 0.004, rx: 90, sx: FC.w * 1.0, sy: 1.12 }, hat);
      const rg = new T.TorusGeometry(0.104, 0.008, 8, 32, Math.PI); M(rg, hw, { y: 0.0, ry: 90, sx: 1.12, sy: 0.93 }, hat);
    }
    hat.visible = false;
    hz.setHat = (on) => { hat.visible = !!on; };
    // tools: a pen (right), the radio handset (right), the winch handle grip and the padlock are scene props
    const pen = new T.Group(); M(K.cyl(0.0035, 0.0035, 0.14, 6), mat("#1d4fa0", { rough: 0.4 }), { rx: 90 }, pen); pen.position.set(0, -0.075, 0.03); hz.tool("pen", pen, 0);
    const hs = new T.Group(); M(K.rbox(0.045, 0.1, 0.032, 0.012), mat("#25282b", { rough: 0.45 }), {}, hs); hs.position.set(0, -0.08, 0.03); hz.tool("handset", hs, 0);
    const lockT = new T.Group(); M(K.rbox(0.05, 0.06, 0.022, 0.008), mat("#c9a23a", { metal: 0.45, rough: 0.3 }), {}, lockT); lockT.position.set(0, -0.085, 0.035); hz.tool("padlock", lockT, 0);
    Object.assign(hz.POSES, {
      desk: { arms: [[-44, 12, -58], [-42, -12, -56]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [10, 0], curl: [50, 50] },
      write: { arms: [[-46, 14, -54], [-40, -12, -52]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [14, 0], curl: [70, 45] },
      micsit: { arms: [[-58, 22, -128], [-34, -10, -40]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [6, 0], curl: [85, 60] },
      crank: { arms: [[-58, 6, -40], [-48, -8, -52]], legs: [[0, 0], [8, 0]], hipY: 0.93, spine: [16, 0], curl: [85, 85] },
      chain: { arms: [[-52, 16, -46], [-50, -16, -46]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [18, 0], curl: [75, 75] },
      lookup: { arms: [[6, -9, -14], [4, 9, -12]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [-6, 0], curl: [40, 40] },
    });
    return { hat, tools: { pen, hs, lockT } };
  }

  S.rig = rig;
  S.rig.CREATE = CREATE;
  S.rig.MIRA = MIRA;
  S.rig.dressMira = dressMira;
  S.rig.dirOf = dirOf;
})();
