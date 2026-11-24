/* Survival-scenario kit · world module "The Wedding Castle" (needs survival-kit.js v2.2 + survival-stone.js).
 * A small fictional castle on a low hill in the woods, a still moat that mirrors it, a drawbridge on chains with its winch,
 * fairy lights along the walls, the lawn across the moat (the ceremony arch, a rack of firework tubes and a firing box with
 * a red LED, AUTO · 00:00), the gravel car park with her car, the great hall after the wedding, the kitchen, and a far
 * highway jammed with taillights (one car trailing JUST MARRIED cans). Physically lit and seek-safe.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.castle.CREATE));
 *   const Cs = SURVIVAL.castle(K);
 *   const hz = K.hazel(SURVIVAL.castle.MAYA); const maya = SURVIVAL.castle.dressMaya(K, hz);
 *   …  SURVIVAL.stone(K).finish();     // last: candle flames + the moat's mirror pass
 *   K.render({ …kit state…, mirror (moat reflection 0..1), fairyK, upI, lampI, hallI, fireI, kitI, winchI, carI,
 *              bridgeA (deg, 0 down … 90 up), ledK, ledRate (blinks/s), phoneK, gutter, candleK, eyesK, eyesI, eyesGather,
 *              eyesBlink, eyesScale, hwyK (highway lights) })
 *
 * World (metres; y up; north = -z): lawn and courtyard at y 0; the curtain wall x ±20, z ±16 (3 m thick, 9 m high,
 * merlons), round corner towers (r 4, conical slate roofs), a keep on the north side, the gatehouse on the south (gate
 * x ±1.9, passage z 13…19, the winch room above it), the moat (water y −0.9) between two rounded rectangles, the bridge
 * hinged at (0, 0, 19) and 10.6 m long. The great hall is the south-east range (x 4.6…17, z 2.2…13) with three tall
 * windows in the south wall that look across the moat to the lawn; the kitchen is the north-west range.
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  const MOON = (() => { const az = 146 * D2R, el = 22 * D2R; return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]; })();
  const CREATE = {
    moonDir: MOON, moonCol: "#b4c6ff", bg: "#020409", fogCol: "#16223f", hemi: ["#3a4f86", "#1a2016"],
    shadow: { half: 46, far: 420, dist: 220, center: [0, 6, 4] },
    sky: { zen: [0.005, 0.01, 0.03], hor: [0.04, 0.06, 0.12] },
    env: { zen: "#0a1430", hor: "#22325a", mside: "#4a5f96", gnd: "#06080a" },
  };
  // the moat: water between an inner (island) and an outer rounded rectangle
  const IN = { cx: 0, cz: -0.9, hx: 26, hz: 21.5, r: 6 }, OUT = { cx: 0, cz: -0.9, hx: 35, hz: 30.5, r: 14 }, POND = { cx: -25, cz: 47, r: 17.5 }, WATER_Y = -0.5;
  const rr = (B, x, z) => { const qx = Math.abs(x - B.cx) - B.hx + B.r, qz = Math.abs(z - B.cz) - B.hz + B.r; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - B.r; };
  const dU = (x, z) => Math.min(rr(OUT, x, z), Math.hypot(x - POND.cx, z - POND.cz) - POND.r);   // the outer shore: the moat and the pond
  const HWY = { x: 2000, y: -6, z0: 260, z1: -3200 };
  function groundH(x, z) {
    const d = Math.hypot(x, z * 1.1);
    let h = -9 * ss((d - 70) / 170) + (K_fbm(x / 160 + 4, z / 160 - 2, 9, 4) - 0.5) * 7 * ss((d - 50) / 120);
    h += (K_fbm(x / 22, z / 22, 3, 3) - 0.5) * 0.5 * ss((d - 45) / 30);
    const rd = Math.abs(x - roadX(z)); if (z > 40) h = lerp(h, -9 * ss((d - 70) / 170) + 0.0, 1 - ss((rd - 4) / 10));   // the road south is smooth
    return h;
  }
  const roadX = (z) => (z < 64 ? 4 : 4 + Math.sin((z - 64) / 140) * 22);
  function surfH(x, z) {   // the mesh height: the island and the lawn round the moat are flat (y 0), easing into the hill; a soft shore
    const dIn = rr(IN, x, z), dO = dU(x, z);
    if (dIn <= 0.6) return 0;
    if (dO < 0) return 0;
    const h = groundH(x, z);
    return lerp(-0.62, 0, ss(dO / 3.2)) + (dO < 40 ? lerp(0, h, ss((dO - 0.5) / 20)) : h);
  }
  let K_fbm = null;

  function castle(K) {
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox, rng = K.rng;
    K_fbm = K.fbm;
    K.buildSky();
    const Sx = S.stone(K);
    const P = { IN, OUT, POND, WATER_Y, HWY };

    // ---------------------------------------------------------------- materials
    const wallM = Sx.stoneM("c_wall", { base: "#958d7e", alt: "#7a756b", rows: 5, mortar: 2.6, repeat: [1, 1] });
    const wallIn = Sx.stoneM("c_wallin", { base: "#b0a48e", alt: "#978b78", rows: 5, seed: 13, mortar: 2.4 });
    const flagM = Sx.stoneM("c_flag", { base: "#6e675c", alt: "#5a544b", rows: 4, seed: 21, mortar: 2.5 });
    const slateM = K.mat("#ffffff", { map: K.canvasTex("c_slate", 256, 256, (g, w, h) => { g.fillStyle = "#2c3340"; g.fillRect(0, 0, w, h); const R = rng(5); for (let y = 0; y < h; y += 16) { const o = (y / 16) % 2 ? 0 : 12; for (let x = -24; x < w; x += 24) { g.fillStyle = `rgb(${38 + R() * 22},${44 + R() * 22},${56 + R() * 24})`; g.fillRect(x + o + 1, y + 1, 22, 14); } g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(0, y + 14, w, 2); } }, { repeat: true }), rough: 0.6 });
    const oakM = Sx.plankM("c_oak", { base: "#5a3e28", n: 5 });
    const ironM = mat("#2a2a2c", { metal: 0.45, rough: 0.5 });
    const SC = 3.6;   // stone texture tile (m)
    // a box whose UVs are in metres / SC on every face (so stone blocks keep their size)
    function sbox(w, h, d) {
      const g = box(w, h, d), uv = g.attributes.uv;
      const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / SC, uv.getY(i) * dims[f][1] / SC); }
      return g;
    }
    function scyl(r, h, n, open) { const g = new T.CylinderGeometry(r, r, h, n || 40, 1, !!open); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (2 * Math.PI * r) / SC, uv.getY(i) * h / SC); return g; }
    const W = (w, h, d, p, m, parent) => M(sbox(w, h, d), m || wallM, p, parent);

    // ---------------------------------------------------------------- ground: lawn + island (the moat is cut out in the shader), far hills
    const grassT = K.canvasTex("c_grass", 512, 512, (q, w, h) => { const R = rng(61); q.fillStyle = "#808080"; q.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 90 + R() * 120; q.fillStyle = `rgb(${v},${v},${v})`; q.globalAlpha = 0.4; q.fillRect(R() * w, R() * h, 1 + R() * 2, 2 + R() * 4); } q.globalAlpha = 1; }, { repeat: true });
    const groundM = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, map: grassT, envMapIntensity: 0.25 });
    const moatU = { inB: { value: new T.Vector4(IN.cx, IN.cz, IN.hx, IN.hz) }, inR: { value: IN.r }, outB: { value: new T.Vector4(OUT.cx, OUT.cz, OUT.hx, OUT.hz) }, outR: { value: OUT.r }, pond: { value: new T.Vector3(POND.cx, POND.cz, POND.r) } };
    groundM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, moatU);
      sh.vertexShader = "varying vec3 vWg;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vWg = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = `uniform vec4 inB, outB; uniform float inR, outR; uniform vec3 pond; varying vec3 vWg;
        float rrd(vec4 B, float r, vec2 p){ vec2 q = abs(p - B.xy) - B.zw + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }\n` +
        sh.fragmentShader.replace("void main() {", "void main() {\n  if (vWg.y > -0.8 && vWg.y < 0.5 && rrd(inB, inR, vWg.xz) > 0.0 && min(rrd(outB, outR, vWg.xz), length(vWg.xz - pond.xy) - pond.z) < 0.0) discard;");
    };
    groundM.customProgramCacheKey = () => "c_ground";
    function patch(size, seg, cx, cz, sink) {
      const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position, uv = g.attributes.uv, cols = [], c = new T.Color();
      const lawn = new T.Color("#33502f"), rough = new T.Color("#2c3a24"), mud = new T.Color("#4a4434"), gravel = new T.Color("#6f6a60");
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i) + cx, z = pa.getZ(i) + cz;
        const h = surfH(x, z) - (sink ? sink(x, z) : 0);
        const dIn = rr(IN, x, z), dOut = dU(x, z);
        pa.setXYZ(i, x, h, z); uv.setXY(i, x / 3, z / 3);
        const n = K.fbm(x / 30, z / 30, 5, 3);
        c.copy(lawn).lerp(rough, ss((Math.hypot(x, z) - 60) / 40) * 0.8 + (n - 0.5) * 0.5);
        if (dIn < 0 && Math.abs(x) < 20 && Math.abs(z) < 16) c.lerp(gravel, 0.55);                      // the courtyard
        if (Math.abs(x - roadX(z)) < 3.4 && z > 30) c.lerp(gravel, 0.85);                                  // the road
        if (x > -6 && x < 15 && z > 48 && z < 62) c.lerp(gravel, 0.9);                                     // the car park
        if (Math.abs(x) < 2.2 && z > 29 && z < 42) c.lerp(gravel, 0.7);                                   // the path from the bridge
        c.lerp(mud, ss(1 - Math.abs(dOut) / 1.5) * 0.4 + ss(1 - Math.abs(dIn) / 1.2) * 0.3);
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      const m = M(g, groundM, { cast: false }); m.receiveShadow = true; return m;
    }
    patch(640, 320, 0, 0, null);
    patch(9000, 180, 0, 0, (x, z) => (Math.abs(x) < 318 && Math.abs(z) < 318 ? 3 : 0) + (Math.abs(x - HWY.x) < 190 && z < HWY.z0 + 90 && z > HWY.z1 - 200 ? 25 : 0));
    // the moat: stone revetments on both banks, the water mirror
    function ringPts(B, n) { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const dx = Math.cos(a), dz = Math.sin(a); // march out along the ray to the boundary
        let lo = 0, hi = 80; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (rr(B, B.cx + dx * m, B.cz + dz * m) < 0) lo = m; else hi = m; } pts.push([B.cx + dx * lo, B.cz + dz * lo]); } return pts; }
    function revet(B, face, y0, y1) {
      const pts = ringPts(B, 360), pos = [], uv = [], idx = []; let L = 0;
      for (let i = 0; i <= pts.length; i++) { const p = pts[i % pts.length], q = pts[(i + pts.length - 1) % pts.length]; if (i) L += Math.hypot(p[0] - q[0], p[1] - q[1]); pos.push(p[0], y0, p[1], p[0], y1, p[1]); uv.push(L / SC, 0, L / SC, (y1 - y0) / SC); if (i < pts.length) { const k = i * 2; if (face > 0) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); else idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      return M(g, wallM, { cast: false });
    }
    revet(IN, 1, -2.5, 0.14);
    const moat = Sx.water({ y: WATER_Y, w: 110, d: 130, cx: -6, cz: 4, col: "#03060a", gain: 0.85, distort: 0.003, res: [540, 960] });

    // ---------------------------------------------------------------- the castle: curtain walls with merlons, corner towers, keep, gatehouse
    const C = G({});
    const HW = 9, TH = 3;
    // merlons (instanced) along a wall top: from a to b on the outer edge
    const merG = sbox(0.75, 1.0, 0.6), merList = [];
    function merlons(a, b, y, inset) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 1.25), ang = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let i = 0; i <= n; i++) { const u = (i + 0.5) / (n + 1); merList.push([lerp(a[0], b[0], u), y + 0.5, lerp(a[1], b[1], u), ang]); } void inset; }
    function ringMerlons(cx, cz, r, y, n) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; merList.push([cx + Math.sin(a) * r, y + 0.5, cz + Math.cos(a) * r, a]); } }
    // curtain wall: north, east, west solid; the south wall has the gate gap and the hall windows
    W(40, HW, TH, { y: HW / 2, z: -16 + TH / 2 }, wallM, C);                 // north
    W(TH, HW, 32, { x: 20 - TH / 2, y: HW / 2 }, wallM, C);                   // east
    W(TH, HW, 32, { x: -20 + TH / 2, y: HW / 2 }, wallM, C);                  // west
    W(15.6, HW, TH, { x: -12.2, y: HW / 2, z: 16 - TH / 2 }, wallM, C);       // south-west
    // south-east: the hall windows at x 8, 11.5, 15 (1.5 wide, sill 0.85, top 4.45)
    const WINX = [8, 11.5, 15], WW = 1.5, WS = 0.85, WT = 4.45;
    { let x0 = 4.4; for (const wx of WINX) { const a = wx - WW / 2; W(a - x0, HW, TH, { x: (x0 + a) / 2, y: HW / 2, z: 16 - TH / 2 }, wallM, C); W(WW, WS, TH, { x: wx, y: WS / 2, z: 16 - TH / 2 }, wallM, C); W(WW, HW - WT, TH, { x: wx, y: (WT + HW) / 2, z: 16 - TH / 2 }, wallM, C); x0 = wx + WW / 2; }
      W(20 - x0, HW, TH, { x: (x0 + 20) / 2, y: HW / 2, z: 16 - TH / 2 }, wallM, C); }
    // pointed arch heads + leaded glass in the hall windows
    const leadT = K.canvasTex("c_lead", 128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "rgba(150,170,190,0.16)"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(20,20,22,0.95)"; g.lineWidth = 3; for (let k = -8; k < 16; k++) { g.beginPath(); g.moveTo(k * 24, 0); g.lineTo(k * 24 + h * 0.5, h); g.stroke(); g.beginPath(); g.moveTo(k * 24 + h * 0.5, 0); g.lineTo(k * 24, h); g.stroke(); } g.lineWidth = 8; g.strokeRect(0, 0, w, h); });
    const glassM = new T.MeshPhysicalMaterial({ map: leadT, transparent: true, roughness: 0.15, metalness: 0, envMapIntensity: 1.1, depthWrite: false, side: T.DoubleSide, alphaTest: 0.01 });
    for (const wx of WINX) {
      M(new T.PlaneGeometry(WW, WT - WS), glassM, { x: wx, y: (WS + WT) / 2, z: 15.75, cast: false, receive: false, nodepth: true }, C).renderOrder = 3;
      const arch = new T.Shape(); arch.moveTo(-WW / 2, 0); arch.lineTo(WW / 2, 0); arch.lineTo(WW / 2, 0.45); arch.quadraticCurveTo(WW / 2, 0.9, 0, 1.15); arch.quadraticCurveTo(-WW / 2, 0.9, -WW / 2, 0.45); arch.lineTo(-WW / 2, 0);
      const hole = new T.Path(); hole.moveTo(-WW / 2 + 0.001, -0.01); hole.lineTo(WW / 2 - 0.001, -0.01); hole.lineTo(WW / 2 - 0.001, 0.4); hole.quadraticCurveTo(WW / 2 - 0.05, 0.82, 0, 1.0); hole.quadraticCurveTo(-WW / 2 + 0.05, 0.82, -WW / 2 + 0.001, 0.4); hole.lineTo(-WW / 2 + 0.001, -0.01);
      void hole;
      // the arch head: a slab of stone over the opening with a pointed underside
      const ag = new T.ExtrudeGeometry((() => { const s = new T.Shape(); s.moveTo(-WW / 2, 0); s.lineTo(-WW / 2, 0.45); s.quadraticCurveTo(-WW / 2 + 0.05, 0.82, 0, 1.0); s.quadraticCurveTo(WW / 2 - 0.05, 0.82, WW / 2, 0.45); s.lineTo(WW / 2, 0); s.lineTo(WW / 2, 1.2); s.lineTo(-WW / 2, 1.2); s.lineTo(-WW / 2, 0); return s; })(), { depth: TH, bevelEnabled: false });
      { const uv = ag.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / SC, uv.getY(i) / SC); }
      M(ag, wallM, { x: wx, y: WT - 1.2 + 0.001 - 0.0, z: 16 - TH, ry: 0 }, C).position.y = WT - 1.0;
    }
    merlons([-20, 16], [20, 16], HW, 0); merlons([-20, -16], [20, -16], HW, 0); merlons([20, -16], [20, 16], HW, 0); merlons([-20, -16], [-20, 16], HW, 0);
    // corner towers with conical slate roofs
    for (const [x, z] of [[-20, -16], [20, -16], [-20, 16], [20, 16]]) {
      M(scyl(4, 14, 44), wallM, { x, y: 7, z }, C);
      M(scyl(4.35, 0.7, 44), wallM, { x, y: 13.75, z }, C);
      const cone = new T.ConeGeometry(4.6, 6.6, 40, 1, true); { const uv = cone.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 3); }
      M(cone, slateM, { x, y: 14.1 + 3.3, z }, C);
      M(cyl(0.05, 0.08, 1.4, 8), ironM, { x, y: 21.3, z }, C); M(sph(0.12, 10, 8), mat("#a8843e", { metal: 0.6, rough: 0.35 }), { x, y: 22.0, z }, C);
      // arrow slits + a lit window on two towers
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; M(box(0.18, 1.1, 0.2), mat("#0a0908"), { x: x + Math.sin(a) * 4.02, y: 6 + (k % 2) * 3, z: z + Math.cos(a) * 4.02, ry: a / D2R, cast: false }, C); }
    }
    // keep (north): a square tower with merlons and lit windows
    W(10, 19, 8, { x: 0, y: 9.5, z: -12 }, wallM, C);
    merlons([-5, -8], [5, -8], 19, 0); merlons([-5, -16], [5, -16], 19, 0); merlons([-5, -16], [-5, -8], 19, 0); merlons([5, -16], [5, -8], 19, 0);
    // ranges inside the curtain: the hall (SE) and the kitchen (NW) with pitched slate roofs
    function range(x0, x1, z0, z1, h, ridge) { const L = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const rg = new T.BufferGeometry(); const y0 = h, y1 = ridge; const p = [x0, y0, z0, x1, y0, z0, x1, y1, cz, x0, y1, cz, x0, y0, z1, x1, y0, z1];
      rg.setAttribute("position", new T.Float32BufferAttribute(p, 3)); rg.setAttribute("uv", new T.Float32BufferAttribute([0, 0, L / 3, 0, L / 3, 3, 0, 3, 0, 0, L / 3, 0], 2)); rg.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 2, 4, 2, 3]); rg.computeVertexNormals();
      M(rg, slateM, {}, C); void cx; void D; }
    range(4.4, 17, 1.4, 13, 7.6, 11.2);
    range(-17, -5, -13, -3.4, 6.0, 9.4);
    W(12.6, 7.6, 0.8, { x: 10.7, y: 3.8, z: 1.8 }, wallM, C);          // hall north wall (courtyard side), the door cut below
    W(0.6, 7.6, 11.6, { x: 4.4 + 0.3, y: 3.8, z: 7.2 }, wallIn, C);    // hall west wall
    W(12, 6, 0.8, { x: -11, y: 3, z: -3.8 }, wallM, C);                // kitchen south wall
    W(0.8, 6, 9.6, { x: -5.4, y: 3, z: -8.6 }, wallM, C);              // kitchen east wall
    // lit windows on the inner façades (courtyard) and the keep: warm panes with mullions
    const paneT = K.canvasTex("c_pane", 64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffd49a"); gr.addColorStop(1, "#ff9e52"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(40,20,10,0.85)"; g.fillRect(w / 2 - 2, 0, 4, h); g.fillRect(0, h * 0.45, w, 4); g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h); });
    const paneM = new T.MeshBasicMaterial({ map: paneT, color: new T.Color(1.6, 1.6, 1.6) });
    const panes = [];
    const addPane = (x, y, z, ry, w, h) => panes.push(M(new T.PlaneGeometry(w || 0.9, h || 1.6), paneM, { x, y, z, ry: ry || 0, cast: false, receive: false }, C));
    addPane(-2.2, 12.5, -7.99, 0); addPane(2.2, 12.5, -7.99, 0); addPane(0, 16, -7.99, 0, 0.8, 1.4); addPane(-2.2, 6.5, -7.99, 0);
    addPane(-5.01, 13, -12, -90); addPane(5.01, 12.5, -12, 90);
    addPane(-9, 3, -3.39, 0, 0.9, 1.4); addPane(-13, 3, -3.39, 0, 0.9, 1.4); addPane(8.5, 4.5, 1.39, 180, 0.9, 1.8); addPane(14.5, 4.5, 1.39, 180, 0.9, 1.8);
    for (const [x, z] of [[-20, 16], [20, 16]]) addPane(x + (x > 0 ? -1.2 : 1.2), 11, z + 3.85, 0, 0.7, 1.1);

    // ---------------------------------------------------------------- the gatehouse: two half-round towers, the gate passage, the winch room
    const GH = G({}, C);
    for (const s of [-1, 1]) { M(scyl(3, 13, 40), wallM, { x: s * 4.4, y: 6.5, z: 17 }, GH); ringMerlons(s * 4.4, 17, 3.05, 13, 12); M(scyl(3.15, 0.5, 40), wallM, { x: s * 4.4, y: 12.8, z: 17 }, GH); }
    // gate block: walls round the passage (x ±1.9, y < 5.2) and the winch room (y 6.2…10.6, x ±3.4, z 13.6…18.4)
    W(2.5, 12.5, 6, { x: -3.15, y: 6.25, z: 16 }, wallM, GH); W(2.5, 12.5, 6, { x: 3.15, y: 6.25, z: 16 }, wallM, GH);
    W(3.8, 1.0, 6, { x: 0, y: 5.7, z: 16 }, wallM, GH);                // over the passage (the winch room floor)
    W(3.8, 0.6, 0.6, { x: 0, y: 6.5, z: 18.7 }, wallM, GH);            // the winch room's front wall: low course…
    W(0.8, 4.4, 0.6, { x: -1.5, y: 8.9, z: 18.7 }, wallM, GH); W(0.8, 4.4, 0.6, { x: 1.5, y: 8.9, z: 18.7 }, wallM, GH); W(1.6, 4.4, 0.6, { x: 0, y: 8.9, z: 18.7 }, wallM, GH);
    W(3.8, 1.6, 6, { x: 0, y: 11.9, z: 16 }, wallM, GH);               // roof slab
    W(3.8, 4.4, 0.6, { x: 0, y: 8.9, z: 13.3 }, wallM, GH);            // back wall of the winch room
    merlons([-6.4, 19], [6.4, 19], 12.5, 0);
    // the gate arch (a pointed stone ring) and the portcullis (raised, its teeth just showing)
    { const ag = new T.ExtrudeGeometry((() => { const s = new T.Shape(); s.moveTo(-2.4, 0); s.lineTo(-2.4, 6.0); s.lineTo(2.4, 6.0); s.lineTo(2.4, 0); s.lineTo(1.9, 0); s.lineTo(1.9, 3.6); s.quadraticCurveTo(1.85, 4.8, 0, 5.3); s.quadraticCurveTo(-1.85, 4.8, -1.9, 3.6); s.lineTo(-1.9, 0); return s; })(), { depth: 0.5, bevelEnabled: false });
      const uv = ag.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / SC, uv.getY(i) / SC);
      M(ag, Sx.stoneM("c_dress", { base: "#b0a48c", alt: "#958a76", rows: 7, seed: 31 }), { z: 19.0 }, GH); }
    const portc = G({ y: 4.6, z: 18.6 }, GH);
    for (let i = -3; i <= 3; i++) { M(box(0.1, 1.4, 0.1), ironM, { x: i * 0.5, y: 0.7 }, portc); M(new T.ConeGeometry(0.06, 0.2, 6), ironM, { x: i * 0.5, y: -0.1, rx: 180 }, portc); }
    for (let k = 0; k < 3; k++) M(box(3.6, 0.08, 0.08), ironM, { y: 0.3 + k * 0.45 }, portc);
    // chain holes over the gate
    for (const s of [-1, 1]) M(cyl(0.16, 0.16, 0.7, 12), mat("#050505"), { x: s * 1.7, y: 10.9, z: 19.0, rx: 90, cast: false }, GH);
    // gate passage interior: flagstones, the inner arch
    W(3.8, 0.04, 6, { x: 0, y: 0.02, z: 16 }, flagM, GH);

    // the drawbridge: an oak deck on iron straps, hinged at (0, 0, 19), chains from its tip to the holes
    const bridge = G({ x: 0, y: 0, z: 19.0 });
    { const deck = G({}, bridge);
      for (let i = 0; i < 9; i++) M(box(0.46, 0.18, 10.6), oakM, { x: -2.0 + i * 0.5, y: 0.0, z: 5.3 }, deck);
      for (const z of [1, 4, 7, 10]) M(box(4.3, 0.05, 0.14), ironM, { y: 0.1, z }, deck);
      for (const s of [-1, 1]) { M(box(0.16, 0.3, 10.6), oakM, { x: s * 2.2, y: 0.05, z: 5.3 }, deck); M(cyl(0.09, 0.09, 0.22, 10), ironM, { x: s * 2.05, y: 0.12, z: 10.35, rz: 90 }, deck); } }
    const linkG = new T.TorusGeometry(0.07, 0.02, 6, 10); linkG.scale(1, 1.6, 1);
    const NL = 110, chains = [];
    for (const s of [-1, 1]) { const im = new T.InstancedMesh(linkG, ironM, NL); im.castShadow = true; im.frustumCulled = false; scene.add(im); chains.push({ im, s }); }
    // the winch in the room above the gate: an oak drum on an iron axle, two spoked wheels with handles, a ratchet
    const winch = G({ x: 0, y: 6.2, z: 16.2 });
    const drum = G({ y: 1.0 }, winch);
    { M(cyl(0.32, 0.32, 2.4, 24), oakM, { rz: 90 }, drum); for (const x of [-1.1, -0.4, 0.4, 1.1]) M(cyl(0.335, 0.335, 0.06, 24), ironM, { x, rz: 90 }, drum);
      M(cyl(0.05, 0.05, 3.3, 10), ironM, { rz: 90 }, winch).position.y = 1.0;
      for (const s of [-1, 1]) { const wh = G({ x: s * 1.42 }, drum); M(new T.TorusGeometry(0.62, 0.035, 8, 40), ironM, { ry: 90 }, wh); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; K.rod([0, 0, 0], [0, Math.cos(a) * 0.62, Math.sin(a) * 0.62], 0.025, ironM, wh, 6); M(cyl(0.025, 0.025, 0.28, 8), oakM, { y: Math.cos(a) * 0.62, z: Math.sin(a) * 0.62, rz: 90 }, wh).position.x = s * 0.14; } }
      for (const s of [-1, 1]) { M(box(0.2, 1.2, 0.2), oakM, { x: s * 1.3, y: 0.6, z: -0.3 }, winch); M(box(0.2, 1.2, 0.2), oakM, { x: s * 1.3, y: 0.6, z: 0.3 }, winch); }
      // chain wound on the drum (a dark band) and running to the front wall
      for (const s of [-1, 1]) M(cyl(0.36, 0.36, 0.34, 20), ironM, { x: s * 0.75, rz: 90 }, drum); }
    const winchRoom = G({});
    W(3.8, 0.05, 4.6, { x: 0, y: 6.23, z: 16 }, oakM, winchRoom);
    const winchL = new T.PointLight("#ffb46a", 0, 0, 2); winchL.position.set(-1.2, 8.4, 17.6); scene.add(winchL);
    M(cyl(0.08, 0.1, 0.22, 10), mat("#2a2420", { metal: 0.5, rough: 0.5 }), { x: -1.2, y: 8.25, z: 18.25 }); const winchGlobe = M(sph(0.07, 10, 8), glow("#ffc27a", 4), { x: -1.2, y: 8.42, z: 18.25, cast: false });

    // ---------------------------------------------------------------- fairy lights: drooping strings along the walls, the gatehouse, the bridge
    const bulbPts = [];
    function string(a, b, sag, step) { const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.round(L / (step || 0.42))); for (let i = 0; i <= n; i++) { const u = i / n; bulbPts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * sag, lerp(a[2], b[2], u)]); } }
    function festoon(a, b, y, out, nSeg, sag) { for (let i = 0; i < nSeg; i++) { const u0 = i / nSeg, u1 = (i + 1) / nSeg; string([lerp(a[0], b[0], u0) + out[0], y, lerp(a[1], b[1], u0) + out[1]], [lerp(a[0], b[0], u1) + out[0], y, lerp(a[1], b[1], u1) + out[1]], sag); } }
    festoon([-20, 16], [-6.4, 16], 8.6, [0, 0.12], 5, 0.7); festoon([6.4, 16], [20, 16], 8.6, [0, 0.12], 5, 0.7);
    festoon([20, -16], [20, 16], 8.6, [0.12, 0], 10, 0.7); festoon([-20, -16], [-20, 16], 8.6, [-0.12, 0], 10, 0.7); festoon([-20, -16], [20, -16], 8.6, [0, -0.12], 12, 0.7);
    festoon([-6.4, 19.0], [6.4, 19.0], 12.2, [0, 0.15], 5, 0.5);
    for (const [x, z] of [[-20, 16], [20, 16], [-20, -16], [20, -16]]) for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; bulbPts.push([x + Math.sin(a) * 4.72, 13.75 - 0.25 * Math.abs(Math.sin(k * Math.PI / 4)), z + Math.cos(a) * 4.72]); }
    for (const s of [-1, 1]) { string([s * 2.6, 2.4, 29.8], [s * 2.6, 2.4, 31.0], 0.05); }
    // the ceremony arch on the lawn (south-east) with its own lights
    const ARCH = [16, 0, 40];
    const bulbM = glow("#ffd9a0", 9, { fog: true });
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.035, 8, 6), bulbM, bulbPts.length);
    const haloI = new T.InstancedMesh(new T.PlaneGeometry(0.34, 0.34), new T.ShaderMaterial({ uniforms: { map: { value: Sx.haloT }, k: { value: 1 }, t: Sx.U.t, col: { value: new T.Color("#ffc890").multiplyScalar(0.42) } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: "uniform float t; varying vec2 vUv; varying float vTw; void main(){ vUv = uv; vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); vTw = 0.8 + 0.2 * sin(t * (1.3 + fract(c.x * 7.13) * 2.0) + c.z * 3.1); vec4 mv = viewMatrix * c; float d = -mv.z; mv.xy += position.xy * clamp(d * 0.012, 0.35, 1.4); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform sampler2D map; uniform float k; uniform vec3 col; varying vec2 vUv; varying float vTw; void main(){ float a = texture2D(map, vUv).r * k * vTw; gl_FragColor = vec4(col * a, a); }" }), bulbPts.length);
    { const d = new T.Object3D(); bulbPts.forEach((p, i) => { d.position.fromArray(p); d.updateMatrix(); bulbs.setMatrixAt(i, d.matrix); haloI.setMatrixAt(i, d.matrix); }); }
    bulbs.castShadow = false; bulbs.frustumCulled = false; haloI.frustumCulled = false; haloI.renderOrder = 5; scene.add(bulbs, haloI); K.noDepth.push(haloI);
    // warm wash on the walls from the strings + uplights at the wall foot (no shadows: driven to 0 inside)
    const upL = [];
    for (const [x, y, z, tx, ty, tz] of [[-12, 0.3, 19.6, -12, 8, 16], [12, 0.3, 19.6, 12, 8, 16], [-4.4, 0.3, 20.6, -4.4, 10, 17], [4.4, 0.3, 20.6, 4.4, 10, 17], [-20, 0.3, 21, -20, 12, 16], [20, 0.3, 21, 20, 12, 16]]) {
      const L = new T.SpotLight("#ffcf9a", 0, 40, 34 * D2R, 0.8, 1.6); L.position.set(x, y, z); L.target.position.set(tx, ty, tz); scene.add(L, L.target); upL.push(L);
      M(box(0.3, 0.18, 0.24), ironM, { x, y: 0.09, z, cast: false });
    }
    const floodL = [];
    for (const [x, y, z, tx, ty, tz] of [[-16, 0.4, 44, -4, 8, 14], [16, 0.4, 42, 6, 8, 14], [-44, 0.4, 14, -22, 8, 2]]) {
      const L = new T.SpotLight("#ffe2c4", 0, 120, 26 * D2R, 0.85, 2); L.position.set(x, y, z); L.target.position.set(tx, ty, tz); scene.add(L, L.target); floodL.push(L);
      M(box(0.5, 0.35, 0.4), ironM, { x, y: 0.2, z, cast: false }); }
    floodL[0].castShadow = true; floodL[0].shadow.mapSize.set(1024, 1024); floodL[0].shadow.bias = -0.0008; floodL[0].shadow.camera.near = 2; floodL[0].shadow.camera.far = 90; floodL[0].shadow.radius = 2;
    // lamp posts at the bridge foot and in the car park
    const lampL = [], lampGlobes = [];
    function lampPost(x, z, h) { const g = G({ x, y: 0, z }); M(cyl(0.06, 0.09, h, 10), ironM, { y: h / 2 }, g); M(cyl(0.14, 0.1, 0.12, 12), ironM, { y: h + 0.05 }, g); const gl = M(sph(0.16, 14, 10), glow("#ffd09a", 6), { y: h - 0.14, cast: false }, g); lampGlobes.push(gl);
      M(new T.ConeGeometry(0.24, 0.2, 12), ironM, { y: h + 0.15 }, g); const L = new T.PointLight("#ffc98a", 0, 0, 2); L.position.set(x, h - 0.2, z); scene.add(L); lampL.push(L); return g; }
    lampPost(-2.9, 30.4, 2.6); lampPost(2.9, 30.4, 2.6); lampPost(-1, 57, 4.2);
    { const sg = G({ x: 4.6, y: 0, z: 31.8, ry: -28 }); const pine = Sx.plankM("c_pine", { base: "#8a6a44", n: 3 });
      M(box(0.1, 1.6, 0.1), pine, { y: 0.8 }, sg);
      const sT = K.textTex("c_venue", 512, 200, (q, w, h) => { q.fillStyle = "#f3ece0"; q.fillRect(0, 0, w, h); q.strokeStyle = "#b8975a"; q.lineWidth = 8; q.strokeRect(10, 10, w - 20, h - 20); q.fillStyle = "#3a2e22"; q.textAlign = "center"; q.font = "600 64px KitOswald, serif"; q.fillText("WEDDINGS", w / 2, 88); q.font = "500 44px KitOswald, serif"; q.fillText("& EVENTS  →", w / 2, 156); });
      M(box(1.1, 0.43, 0.05), mat("#ffffff", { map: sT, rough: 0.7 }), { y: 1.45, z: 0.06 }, sg);
      for (const s2 of [-1, 1]) M(sph(0.05, 8, 6), mat("#f2e8e4", { rough: 0.7 }), { x: s2 * 0.5, y: 1.68, z: 0.08, cast: false }, sg); }

    // ---------------------------------------------------------------- the lawn: ceremony arch, white chairs, the firework rack + firing box (a plant)
    const lawn = G({});
    { const a = G({ x: ARCH[0], z: ARCH[2], ry: -20 }, lawn); const wM = mat("#e9e4da", { rough: 0.6 });
      for (const s of [-1, 1]) M(cyl(0.05, 0.05, 2.4, 8), wM, { x: s * 1.1, y: 1.2 }, a);
      const ag = new T.TorusGeometry(1.1, 0.05, 8, 30, Math.PI); M(ag, wM, { y: 2.4 }, a);
      const R = rng(8), fl = [mat("#f2e8e4", { rough: 0.7 }), mat("#e8b9c0", { rough: 0.7 }), mat("#c9d6b8", { rough: 0.8 })];
      for (let i = 0; i < 70; i++) { const u = R(); const ang = Math.PI * u; const p = u < 0.5 ? [-1.1 + (R() - 0.5) * 0.2, lerp(1.2, 2.4, R()), (R() - 0.5) * 0.2] : [Math.cos(ang) * 1.1, 2.4 + Math.sin(ang) * 1.1, (R() - 0.5) * 0.2]; M(sph(0.06 + R() * 0.05, 8, 6), fl[i % 3], { x: p[0], y: p[1], z: p[2], cast: false }, a); }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { if (c === 2 || c === 3) continue; const ch = G({ x: -3 + c * 1.1 + (c > 2 ? 0.6 : -0.6) * 0, y: 0, z: 3 + r * 1.2 }, a); M(box(0.42, 0.04, 0.42), wM, { y: 0.45 }, ch); M(box(0.42, 0.45, 0.04), wM, { y: 0.7, z: 0.2 }, ch); for (const sx of [-0.18, 0.18]) for (const sz of [-0.18, 0.18]) M(cyl(0.015, 0.015, 0.45, 6), wM, { x: sx, y: 0.225, z: sz }, ch); } }
    const archL = new T.PointLight("#ffcf98", 0, 0, 2); archL.position.set(ARCH[0], 2.2, ARCH[2]); scene.add(archL);
    { const ab = []; for (let k = 0; k <= 26; k++) { const a = Math.PI * k / 26; ab.push([ARCH[0] + Math.cos(a) * 1.16 * Math.cos(-20 * D2R), 2.4 + Math.sin(a) * 1.16, ARCH[2] - Math.cos(a) * 1.16 * Math.sin(-20 * D2R)]); } for (const p2 of ab) bulbPts.push(p2); }
    // firework rack: a wooden frame with 16 tubes angled up, wires to the firing box
    const RACK = [8.6, 0, 31.9], BOX = [9.75, 0, 33.6];
    const rack = G({ x: RACK[0], z: RACK[2], ry: 18 }, lawn);
    { const pine = Sx.plankM("c_pine", { base: "#8a6a44", n: 3 }); M(box(2.2, 0.08, 0.6), pine, { y: 0.1 }, rack); M(box(2.2, 0.08, 0.6), pine, { y: 0.55, z: -0.1 }, rack);
      for (const s of [-1, 1]) { M(box(0.08, 0.7, 0.08), pine, { x: s * 1.05, y: 0.35, z: 0.2 }, rack); M(box(0.08, 0.95, 0.08), pine, { x: s * 1.05, y: 0.47, z: -0.25 }, rack); }
      const tubeM = [mat("#7a2e22", { rough: 0.7 }), mat("#3a4a6a", { rough: 0.7 }), mat("#8a6a2a", { rough: 0.7 })];
      for (let i = 0; i < 16; i++) { const x = -0.95 + (i % 8) * 0.27, z = i < 8 ? -0.12 : 0.12; const tb = G({ x, y: 0.35, z, rx: -14 + (i % 3) * 4, rz: (i % 8 - 3.5) * 2 }, rack); M(cyl(0.055, 0.055, 0.62, 12), tubeM[i % 3], { y: 0.25 }, tb); M(cyl(0.05, 0.05, 0.02, 12), mat("#1a1612"), { y: 0.561 }, tb); }
      // the wire to the box
      const wire = []; for (let k = 0; k <= 16; k++) { const u = k / 16; wire.push([lerp(RACK[0] - 0.6, BOX[0] + 0.1, u), 0.03 + Math.sin(u * 9) * 0.01, lerp(RACK[2] - 0.1, BOX[2] + 0.08, u) + Math.sin(u * 5) * 0.12]); }
      M(K.tubeGeo(wire, 40, 5, () => 0.008), mat("#c23a22", { rough: 0.6 })); }
    // the firing box on a stake: grey case, a lid label, the LED and a small display AUTO · 00:00
    const fbox = G({ x: BOX[0], y: 0, z: BOX[2], ry: -14 }, lawn);
    let ledM, ledHalo, ledL;
    { M(box(0.04, 0.45, 0.04), Sx.plankM("c_pine", {}), { y: 0.22 }, fbox);
      M(rbox(0.46, 0.24, 0.16, 0.02), mat("#5d6168", { rough: 0.45, metal: 0.2 }), { y: 0.52 }, fbox);
      const dT = K.textTex("c_fbdisp", 512, 256, (q, w, h) => { q.fillStyle = "#101a12"; q.fillRect(0, 0, w, h); q.fillStyle = "#c8ffd4"; q.textAlign = "center"; q.font = "700 92px KitOswald, sans-serif"; q.fillText("AUTO · 00:00", w / 2, 168); });
      M(new T.PlaneGeometry(0.4, 0.14), new T.MeshBasicMaterial({ map: dT, color: new T.Color(1.5, 1.5, 1.5) }), { y: 0.52, z: 0.092, cast: false }, fbox);
      ledM = glow("#ff1a0a", 30, { fog: false }); M(sph(0.011, 10, 8), ledM, { x: 0.17, y: 0.664, z: 0.0, cast: false }, fbox); M(K.cyl(0.016, 0.016, 0.008, 12), mat("#2a1a18", { rough: 0.4 }), { x: 0.17, y: 0.656, z: 0.0 }, fbox);
      ledHalo = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: Sx.haloT, color: new T.Color("#ff2a10").multiplyScalar(1.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { x: 0.17, y: 0.668, z: 0.0, s: 0.3, cast: false, receive: false, nodepth: true }, fbox);
      ledL = new T.PointLight("#ff2010", 0, 1.6, 2); ledL.position.set(0.17, 0.7, 0.05); fbox.add(ledL);
      M(box(0.08, 0.025, 0.05), mat("#d8dadc", { rough: 0.5 }), { x: -0.12, y: 0.655, z: 0.0 }, fbox); }

    // ---------------------------------------------------------------- cars: a generic sedan (no badges), her car in the car park
    const carBody = (col) => new T.MeshPhysicalMaterial({ color: col, roughness: 0.35, metalness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.0 });
    const tyreM = mat("#151517", { rough: 0.8 }), rimM = mat("#9aa0a6", { metal: 0.6, rough: 0.35 }), carGlass = new T.MeshPhysicalMaterial({ color: "#0e141c", roughness: 0.05, metalness: 0.3, envMapIntensity: 1.4 });
    const tailM = glow("#ff2a14", 5, { fog: true }), headM = glow("#fff4dc", 9, { fog: true });
    function car(col, p) { const g = G(p || {}); const bm = typeof col === "string" ? carBody(col) : col;
      M(rbox(1.7, 0.5, 4.2, 0.12), bm, { y: 0.62 }, g); M(rbox(1.5, 0.42, 2.1, 0.12), bm, { y: 1.12, z: -0.15 }, g);
      M(box(1.42, 0.36, 0.03), carGlass, { y: 1.13, z: 0.99, rx: -24, cast: false }, g); M(box(1.42, 0.34, 0.03), carGlass, { y: 1.13, z: -1.3, rx: 24, cast: false }, g);
      for (const s of [-1, 1]) M(box(0.03, 0.3, 1.8), carGlass, { x: s * 0.825, y: 1.14, z: -0.15, cast: false }, g);
      for (const sx of [-0.82, 0.82]) for (const sz of [-1.35, 1.35]) { M(cyl(0.33, 0.33, 0.24, 18), tyreM, { x: sx, y: 0.33, z: sz, rz: 90 }, g); M(cyl(0.2, 0.2, 0.25, 12), rimM, { x: sx * 1.005, y: 0.33, z: sz, rz: 90, cast: false }, g); }
      for (const s of [-1, 1]) { M(box(0.38, 0.12, 0.04), tailM, { x: s * 0.66, y: 0.78, z: -2.18, cast: false }, g); M(box(0.34, 0.12, 0.04), headM, { x: s * 0.62, y: 0.7, z: 2.18, cast: false }, g); }
      M(box(0.5, 0.12, 0.02), mat("#e8e8e4", { rough: 0.6 }), { y: 0.55, z: -2.18, cast: false }, g);   // a blank plate
      return g; }
    const herCar = car("#9fb8c4", { x: 3.2, y: 0, z: 55, ry: 168 });
    // a few other cars gone: the car park is empty but for hers

    // ---------------------------------------------------------------- the woods (a ring round the hill), the road south
    { const list = [], R = rng(2024);
      for (let i = 0; i < 6200; i++) {
        const a = R() * Math.PI * 2, rad = Math.sqrt(lerp(72 * 72, 520 * 520, R())), x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        if (dU(x, z) < 26 || rr(OUT, x, z) < 30) continue; if (Math.abs(x - roadX(z)) < 9 && z > 30) continue; if (x > -10 && x < 20 && z > 36 && z < 68) continue;
        if (K.fbm(x / 70, z / 70, 31, 3) < 0.36) continue;
        list.push([x, surfH(x, z), z, lerp(9, 19, R()), R() < 0.55 ? Math.floor(R() * 2) : 2 + Math.floor(R() * 2)]);
      }
      // the highway's verges
      for (let i = 0; i < 1800; i++) { const z = lerp(HWY.z0, HWY.z1, R()), s = R() < 0.5 ? -1 : 1, x = HWY.x + s * (18 + R() * 120); list.push([x, HWY.y, z, lerp(10, 20, R()), Math.floor(R() * 4)]); }
      Sx.trees(list, { seed: 5 }); }

    // ---------------------------------------------------------------- the far highway: a road, a jam of taillights, the JUST MARRIED car
    const hwy = G({});
    { const asph = mat("#2a2a2c", { rough: 0.9 });
      M(box(26, 0.1, HWY.z0 - HWY.z1), asph, { x: HWY.x, y: HWY.y, z: (HWY.z0 + HWY.z1) / 2, cast: false }, hwy);
      M(box(20, 0.08, HWY.z0 - HWY.z1), mat("#25321f", { rough: 0.95 }), { x: HWY.x - 23, y: HWY.y - 0.05, z: (HWY.z0 + HWY.z1) / 2, cast: false }, hwy); M(box(20, 0.08, HWY.z0 - HWY.z1), mat("#25321f", { rough: 0.95 }), { x: HWY.x + 23, y: HWY.y - 0.05, z: (HWY.z0 + HWY.z1) / 2, cast: false }, hwy);
      const dash = mat("#d8d4c8", { rough: 0.6 }); for (let z = HWY.z0; z > HWY.z1; z -= 12) for (const dx of [-6.5, 0, 6.5]) M(box(0.15, 0.02, 4), dash, { x: HWY.x + dx, y: HWY.y + 0.06, z, cast: false }, hwy);
      M(box(0.4, 0.8, HWY.z0 - HWY.z1), mat("#8a8c8e", { metal: 0.4, rough: 0.5 }), { x: HWY.x, y: HWY.y + 0.4, z: (HWY.z0 + HWY.z1) / 2 }, hwy);
      M(box(380, 0.1, HWY.z0 - HWY.z1 + 300), mat("#1e2a1a", { rough: 0.97 }), { x: HWY.x, y: HWY.y - 0.12, z: (HWY.z0 + HWY.z1) / 2, cast: false }, hwy); }
    // the jam: two lanes northbound (taillights toward the camera at the south end), headlights southbound sparse
    const jamTail = [], jamHead = [], jamCars = [];
    { const R = rng(77), zl = [HWY.z0 - 24, HWY.z0 - 27]; for (let i = 0; i < 560; i++) { const lane = i % 2; zl[lane] -= 6.0 + R() * 1.8; const z = zl[lane]; if (z < HWY.z1) break; const x = HWY.x - 3.2 - lane * 3.3 + (R() - 0.5) * 0.3; if (jamCars.length < 18) jamCars.push([x, z]); else jamTail.push([x - 0.66, HWY.y + 0.85, z + 2.2], [x + 0.66, HWY.y + 0.85, z + 2.2]); }
      for (let i = 0; i < 40; i++) { const z = HWY.z0 - 60 - i * 70 - R() * 30, x = HWY.x + 3.2 + (i % 2) * 3.3; jamHead.push([x - 0.62, HWY.y + 0.72, z], [x + 0.62, HWY.y + 0.72, z]); } }
    const tailI = new T.InstancedMesh(new T.SphereGeometry(0.16, 8, 6), glow("#ff2a14", 7, { fog: true }), jamTail.length);
    const headI = new T.InstancedMesh(new T.SphereGeometry(0.18, 8, 6), glow("#fff2d8", 10, { fog: true }), jamHead.length);
    { const d = new T.Object3D(); jamTail.forEach((p, i) => { d.position.fromArray(p); d.updateMatrix(); tailI.setMatrixAt(i, d.matrix); }); jamHead.forEach((p, i) => { d.position.fromArray(p); d.updateMatrix(); headI.setMatrixAt(i, d.matrix); }); }
    [tailI, headI].forEach((m) => { m.castShadow = false; m.frustumCulled = false; scene.add(m); });
    // dark bodies for the near part of the jam (the lights alone read as a jam further back)
    const jamBodies = []; { const cols = ["#2b2f36", "#4a4f57", "#1d2a3a", "#5a2a26", "#3a3f2a", "#cfd2d6"]; jamCars.forEach(([x, z], i) => jamBodies.push(car(cols[i % cols.length], { x, y: HWY.y + 0.05, z, ry: 180 }))); }
    // the JUST MARRIED car: the nearest in the right lane, a sign on the boot and cans on strings
    const JM = [HWY.x - 6.5, HWY.y + 0.05, HWY.z0 - 14];
    const jm = car("#e9e6e0", { x: JM[0], y: JM[1], z: JM[2], ry: 180 });
    { const sT = K.textTex("c_jmsign", 512, 160, (q, w, h) => { q.fillStyle = "#fbf8f2"; q.fillRect(0, 0, w, h); q.strokeStyle = "#c9a24a"; q.lineWidth = 6; q.strokeRect(8, 8, w - 16, h - 16); q.fillStyle = "#1e1e24"; q.textAlign = "center"; q.font = "italic 700 74px KitOswald, serif"; q.fillText("JUST MARRIED", w / 2, 106); });
      M(new T.PlaneGeometry(1.2, 0.38), mat("#ffffff", { map: sT, rough: 0.7 }), { y: 0.98, z: -2.19, ry: 180, rx: -8, cast: false }, jm);
      const canM = mat("#c8ccd0", { metal: 0.7, rough: 0.3 }), strM = mat("#e8e8e8", { rough: 0.8 }); const R = rng(41);
      for (let i = 0; i < 6; i++) { const x0 = -0.6 + i * 0.24, L = 1.3 + R() * 0.9, ex = x0 + (R() - 0.5) * 0.5; K.rod([x0, 0.5, -2.18], [ex, 0.08, -2.2 - L], 0.006, strM, jm, 4); const c = M(cyl(0.04, 0.04, 0.13, 10), canM, { x: ex, y: 0.05, z: -2.25 - L, rz: 90, ry: R() * 60 }, jm); void c; }
      // ribbons on the door handles
      for (const s of [-1, 1]) M(box(0.02, 0.3, 0.06), mat("#f4f0e8", { rough: 0.8 }), { x: s * 0.92, y: 0.78, z: 0.1, cast: false }, jm); }
    const hwyLamps = []; for (let z = HWY.z0 - 40; z > HWY.z1; z -= 90) { const L = M(sph(0.25, 8, 6), glow("#ffb070", 6, { fog: true }), { x: HWY.x + 13.5, y: HWY.y + 9, z, cast: false }, hwy); hwyLamps.push(L); M(cyl(0.08, 0.1, 9, 6), ironM, { x: HWY.x + 13.5, y: HWY.y + 4.5, z }, hwy); }

    // ---------------------------------------------------------------- interiors: the great hall
    const hall = G({});
    const HX0 = 5.0, HX1 = 17, HZ0 = 2.2, HZ1 = 13, F = 0.02;
    W(HX1 - HX0, 0.06, HZ1 - HZ0, { x: (HX0 + HX1) / 2, y: F - 0.02, z: (HZ0 + HZ1) / 2 }, flagM, hall);
    // inner faces: the curtain (east + south) and the courtyard wall, lighter dressed stone
    W(0.05, 7.6, HZ1 - HZ0, { x: HX1 - 0.02, y: 3.8, z: (HZ0 + HZ1) / 2 }, wallIn, hall);
    W(HX1 - HX0, 7.6, 0.05, { x: (HX0 + HX1) / 2, y: 3.8, z: HZ0 + 0.02 }, wallIn, hall);
    W(0.05, 7.6, HZ1 - HZ0, { x: HX0 + 0.02, y: 3.8, z: (HZ0 + HZ1) / 2 }, wallIn, hall);
    // the roof inside: tie beams, braces, rafters and boards (dark oak)
    { const rf = G({}, hall); for (let x = HX0 + 1; x < HX1; x += 2.4) { M(box(0.3, 0.36, HZ1 - HZ0), oakM, { x, y: 7.2, z: (HZ0 + HZ1) / 2 }, rf); for (const s of [-1, 1]) K.rod([x, 7.2, (HZ0 + HZ1) / 2 + s * 5.4], [x, 10.6, (HZ0 + HZ1) / 2], 0.13, oakM, rf, 4); M(box(0.2, 3.4, 0.2), oakM, { x, y: 8.9, z: (HZ0 + HZ1) / 2 }, rf); }
      for (const s of [-1, 1]) { const rg = new T.PlaneGeometry(HX1 - HX0, 6.4); const m = M(rg, Sx.plankM("c_boards", { base: "#3c2a1c", n: 10, repeat: [6, 1] }), { x: (HX0 + HX1) / 2, y: 9.0, z: (HZ0 + HZ1) / 2 + s * 2.9, rx: s * 90 - s * 32, cast: false }, rf); m.material.side = T.DoubleSide; } }
    // the door to the courtyard (north wall, x 6.2): an arched oak door, closed
    { const d = G({ x: 6.4, y: 0, z: HZ0 + 0.06 }, hall); M(box(1.4, 2.6, 0.1), oakM, { y: 1.3 }, d); for (const y of [0.5, 1.3, 2.1]) M(box(1.3, 0.06, 0.03), ironM, { y, z: 0.06 }, d); M(new T.TorusGeometry(0.08, 0.012, 6, 16), ironM, { x: 0.45, y: 1.1, z: 0.08 }, d); }
    // the fireplace (north wall, x 12.5): a stone hood, embers, the portrait above
    const FP = [12.6, 0, HZ0];
    const fire = G({ x: FP[0], y: 0, z: HZ0 + 0.02 }, hall);
    let emberM, fireL;
    { const dress = Sx.stoneM("c_dress", {}); W(2.8, 0.25, 1.0, { y: 2.1, z: 0.5 }, dress, fire); W(0.4, 2.1, 1.0, { x: -1.2, y: 1.05, z: 0.5 }, dress, fire); W(0.4, 2.1, 1.0, { x: 1.2, y: 1.05, z: 0.5 }, dress, fire);
      W(2.6, 1.6, 0.7, { y: 3.0, z: 0.35 }, dress, fire); W(2.0, 2.0, 0.05, { y: 1.0, z: 0.03 }, mat("#0d0b0a", { rough: 0.95 }), fire);
      const R = rng(3); for (let i = 0; i < 9; i++) M(cyl(0.07, 0.08, 0.9, 8), mat("#2a1c12", { rough: 0.9 }), { x: (R() - 0.5) * 0.8, y: 0.12 + (i % 3) * 0.1, z: 0.45 + (R() - 0.5) * 0.3, rz: 90, ry: (R() - 0.5) * 40 }, fire);
      emberM = glow("#ff5a1a", 3, {}); for (let i = 0; i < 26; i++) M(sph(0.05 + R() * 0.05, 8, 6), emberM, { x: (R() - 0.5) * 1.1, y: 0.06 + R() * 0.12, z: 0.4 + (R() - 0.5) * 0.4, sy: 0.6, cast: false }, fire);
      fireL = new T.PointLight("#ff8a3a", 0, 0, 2); fireL.position.set(0, 0.6, 1.0); fire.add(fireL); }
    // the lord's portrait (painted, fictional): a scowling 14th-century lord in a gilt frame
    const lordT = K.textTex("c_lord", 384, 512, (q, w, h) => {
      const gr = q.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.45, h * 0.7); gr.addColorStop(0, "#4a3a26"); gr.addColorStop(1, "#140e08"); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      // robe with fur collar
      q.fillStyle = "#6e1a16"; q.beginPath(); q.moveTo(40, h); q.quadraticCurveTo(60, 300, 192, 290); q.quadraticCurveTo(324, 300, 344, h); q.fill();
      q.fillStyle = "#5a4a3a"; q.beginPath(); q.ellipse(192, 318, 120, 40, 0, 0, 7); q.fill();
      q.strokeStyle = "#c9a24a"; q.lineWidth = 7; q.beginPath(); q.moveTo(120, 330); q.quadraticCurveTo(192, 420, 264, 330); q.stroke();   // a chain
      // head: face, ears, hat
      q.fillStyle = "#c99a76"; q.beginPath(); q.ellipse(192, 205, 62, 78, 0, 0, 7); q.fill();
      q.fillStyle = "#2b2018"; q.beginPath(); q.ellipse(192, 128, 86, 34, 0, 0, 7); q.fill(); q.fillRect(130, 92, 124, 40);
      // beard
      q.fillStyle = "#3a2a1e"; q.beginPath(); q.moveTo(132, 220); q.quadraticCurveTo(140, 330, 192, 345); q.quadraticCurveTo(244, 330, 252, 220); q.quadraticCurveTo(222, 262, 192, 262); q.quadraticCurveTo(162, 262, 132, 220); q.fill();
      // the scowl: brows in a deep V, small dark eyes, a downturned mouth
      q.strokeStyle = "#20160e"; q.lineWidth = 11; q.lineCap = "round"; q.beginPath(); q.moveTo(150, 168); q.lineTo(184, 186); q.stroke(); q.beginPath(); q.moveTo(234, 168); q.lineTo(200, 186); q.stroke();
      q.fillStyle = "#130c08"; q.beginPath(); q.ellipse(170, 196, 7, 5, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(214, 196, 7, 5, 0, 0, 7); q.fill();
      q.lineWidth = 4; q.beginPath(); q.moveTo(186, 180); q.lineTo(188, 162); q.stroke(); q.beginPath(); q.moveTo(198, 180); q.lineTo(196, 162); q.stroke();
      q.strokeStyle = "#7a4a36"; q.lineWidth = 6; q.beginPath(); q.moveTo(178, 212); q.quadraticCurveTo(192, 232, 206, 212); q.stroke();
      q.strokeStyle = "#2a1610"; q.lineWidth = 7; q.beginPath(); q.moveTo(170, 248); q.quadraticCurveTo(192, 236, 214, 248); q.stroke();
      // brush texture + varnish
      const R = rng(99); q.globalAlpha = 0.08; for (let i = 0; i < 1600; i++) { q.fillStyle = R() < 0.5 ? "#000" : "#fff3d8"; q.fillRect(R() * w, R() * h, 2 + R() * 8, 1 + R() * 2); } q.globalAlpha = 1;
      const vg = q.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)"); q.fillStyle = vg; q.fillRect(0, 0, w, h);
    });
    Sx.frame(hall, lordT, 1.05, 1.4, { x: FP[0], y: 5.0, z: HZ0 + 0.14, col: "#a8823e", border: 0.13, depth: 0.08 });
    const lordLamp = new T.SpotLight("#ffd6a8", 0, 6, 28 * D2R, 0.6, 1.5); lordLamp.position.set(FP[0], 6.4, HZ0 + 1.3); lordLamp.target.position.set(FP[0], 5.0, HZ0); scene.add(lordLamp, lordLamp.target);
    // the photo wall (west wall): 24 small framed couples, most with a red ✕; one (no ✕) is a red-haired woman and a ranger
    const coupleTex = (i, cross) => K.canvasTex("c_couple" + i + (cross ? "x" : ""), 160, 200, (q, w, h) => {
      const R = rng(500 + i); const bgs = ["#d9c7a8", "#b8c9d6", "#c8d6b0", "#e2c1b8", "#c9b8d9", "#d6d0b8"]; q.fillStyle = bgs[i % bgs.length]; q.fillRect(0, 0, w, h);
      q.fillStyle = "rgba(255,255,255,0.25)"; q.beginPath(); q.ellipse(w / 2, h * 0.3, 70, 50, 0, 0, 7); q.fill();
      const fig = (x, body, hair, dress) => { q.fillStyle = body; if (dress) { q.beginPath(); q.moveTo(x - 10, 92); q.lineTo(x + 10, 92); q.lineTo(x + 26, h - 14); q.lineTo(x - 26, h - 14); q.fill(); } else { q.fillRect(x - 13, 92, 26, 70); q.fillRect(x - 12, 160, 10, 26); q.fillRect(x + 2, 160, 10, 26); }
        q.fillStyle = ["#e8c4a6", "#c49070", "#9a6a4c", "#f0cfb4"][Math.floor(R() * 4)]; q.beginPath(); q.arc(x, 76, 14, 0, 7); q.fill(); q.fillStyle = hair; q.beginPath(); q.arc(x, 70, 14.5, Math.PI, 0); q.fill(); };
      if (i === 13) {   // the egg: a red-haired woman in an orange jacket, a man in a ranger's uniform with a flat hat
        fig(56, "#c65a22", "#8c3c1d", false); fig(104, "#5f6b3a", "#3a2a1e", false);
        q.fillStyle = "#7a6a3a"; q.fillRect(86, 52, 36, 6); q.beginPath(); q.ellipse(104, 54, 22, 5, 0, 0, 7); q.fill(); q.fillRect(95, 44, 18, 10);
        q.fillStyle = "#c9a24a"; q.fillRect(95, 104, 6, 6);
      } else { const dresses = R() < 0.8; fig(58, dresses ? "#f8f6f0" : "#2a2a30", ["#3a2a1e", "#c9a46a", "#1a1410", "#7a3a1e"][Math.floor(R() * 4)], dresses); fig(102, "#262830", ["#2a1e16", "#1a1410", "#5a3a22"][Math.floor(R() * 3)], false); }
      if (cross) { q.strokeStyle = "#d8261a"; q.lineWidth = 9; q.lineCap = "round"; q.beginPath(); q.moveTo(w - 46, 14); q.lineTo(w - 14, 46); q.moveTo(w - 14, 14); q.lineTo(w - 46, 46); q.stroke(); }
    });
    const photoWall = G({ x: HX0 + 0.06, y: 0, z: 8.4, ry: 90 }, hall);
    { const keep = new Set([4, 13, 19]); let i = 0; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { Sx.frame(photoWall, coupleTex(i, !keep.has(i)), 0.32, 0.4, { x: -1.55 + c * 0.62, y: 1.25 + r * 0.56, col: i % 3 ? "#1e1c1a" : "#b8a070", border: 0.03, depth: 0.025, metal: 0.2 }); i++; } }
    // round tables with cloths, gold chairs, centrepieces (candles + flowers), petals on the floor
    const clothM = new T.MeshPhysicalMaterial({ color: "#f3efe6", roughness: 0.8, sheen: 0.6, sheenColor: new T.Color("#ffffff") });
    const goldM = mat("#c8a35a", { metal: 0.5, rough: 0.35 }), cushM = mat("#efe6d6", { rough: 0.8 });
    const TABLES = [[7.6, 7.4], [11.6, 6.6], [15.0, 7.6], [9.0, 3.9], [13.4, 3.9]];
    const chairList = [];
    for (const [tx, tz] of TABLES) {
      const tg = G({ x: tx, y: F, z: tz }, hall);
      const cl = new T.CylinderGeometry(0.92, 1.0, 0.76, 40, 3, true); { const pa = cl.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), a = Math.atan2(pa.getZ(i), pa.getX(i)); const f = 1 + (y < 0 ? 0.03 * Math.sin(a * 22) * (-y / 0.38) : 0); pa.setX(i, pa.getX(i) * f); pa.setZ(i, pa.getZ(i) * f); } cl.computeVertexNormals(); }
      M(cl, clothM, { y: 0.38 }, tg); M(cyl(0.92, 0.92, 0.02, 40), clothM, { y: 0.765 }, tg);
      const cp = G({ y: 0.775 }, tg); for (let k = 0; k < 3; k++) Sx.candle(cp, { x: (k - 1) * 0.12, z: (k % 2) * 0.06, h: 0.12 + k * 0.05, r: 0.018 });
      const R = rng(Math.round(tx * 10 + tz)); const fls = [mat("#f2e8e4", { rough: 0.7 }), mat("#e8b9c0", { rough: 0.7 }), mat("#d9c9a8", { rough: 0.7 })];
      for (let k = 0; k < 9; k++) M(sph(0.035 + R() * 0.02, 8, 6), fls[k % 3], { x: (R() - 0.5) * 0.3, y: 0.03, z: 0.12 + (R() - 0.5) * 0.12, cast: false }, cp);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2, cx = Math.cos(a) * 1.3, cz = Math.sin(a) * 1.3; if (R() < 0.18) continue; chairList.push([tx + cx, tz + cz, Math.atan2(-cx, -cz) + (R() - 0.5) * 0.5]);
        // glasses and plates
        M(cyl(0.12, 0.1, 0.015, 20), mat("#f8f8f6", { rough: 0.3 }), { x: Math.cos(a) * 0.68, y: 0.008, z: Math.sin(a) * 0.68 }, cp);
        M(cyl(0.03, 0.022, 0.12, 12), new T.MeshPhysicalMaterial({ color: "#f0f4f6", roughness: 0.05, transmission: 0, transparent: true, opacity: 0.35 }), { x: Math.cos(a + 0.25) * 0.66, y: 0.08, z: Math.sin(a + 0.25) * 0.66, cast: false }, cp); }
    }
    function chair(x, z, a, parent) { const g = G({ x, y: F, z, ry: a / D2R }, parent || hall); M(box(0.42, 0.05, 0.42), goldM, { y: 0.46 }, g); M(box(0.4, 0.04, 0.4), cushM, { y: 0.495 }, g);
      for (const sx of [-0.18, 0.18]) { M(cyl(0.014, 0.014, 0.46, 6), goldM, { x: sx, y: 0.23, z: 0.18 }, g); M(cyl(0.014, 0.014, 0.46, 6), goldM, { x: sx, y: 0.23, z: -0.18 }, g); M(cyl(0.014, 0.014, 0.5, 6), goldM, { x: sx, y: 0.73, z: -0.19 }, g); }
      for (const y of [0.62, 0.78, 0.94]) M(cyl(0.012, 0.012, 0.37, 6), goldM, { y, z: -0.19, rz: 90 }, g); return g; }
    chairList.forEach(([x, z, a]) => chair(x, z, a));
    // petals (instanced): pink and white on the floor and the cloths
    { const n = 900, pg = new T.PlaneGeometry(0.035, 0.028); pg.rotateX(-Math.PI / 2); const im = new T.InstancedMesh(pg, new T.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7, side: T.DoubleSide }), n); const d = new T.Object3D(), c = new T.Color(), R = rng(17);
      for (let i = 0; i < n; i++) { let x, z, y = F + 0.004; if (i < 260) { const [tx, tz] = TABLES[i % 5]; const a = R() * 6.28, r = Math.sqrt(R()) * 0.85; x = tx + Math.cos(a) * r; z = tz + Math.sin(a) * r; y = F + 0.777; } else { x = lerp(HX0 + 0.4, HX1 - 0.4, R()); z = lerp(HZ0 + 0.4, HZ1 - 1.4, R()); }
        d.position.set(x, y, z); d.rotation.set((R() - 0.5) * 0.3, R() * 6.28, (R() - 0.5) * 0.3); d.scale.setScalar(0.7 + R() * 0.6); d.updateMatrix(); im.setMatrixAt(i, d.matrix); c.set(R() < 0.55 ? "#e9a3b0" : R() < 0.6 ? "#f6f0ea" : "#c9475a"); im.setColorAt(i, c); }
      im.castShadow = false; im.receiveShadow = true; scene.add(im); }
    // the top table along the windows, a long cloth, candelabras; her chair; the shoes go on it (st.shoesOnTable)
    const TT = { x0: 6.6, x1: 15.6, z: 11.6 };
    { const tg = G({ x: (TT.x0 + TT.x1) / 2, y: F, z: TT.z }, hall); M(box(TT.x1 - TT.x0, 0.05, 0.95), clothM, { y: 0.76 }, tg); M(box(TT.x1 - TT.x0, 0.74, 0.9), clothM, { y: 0.37 }, tg);
      M(box(TT.x1 - TT.x0 - 0.02, 0.14, 0.02), mat("#d9c7a0", { rough: 0.7 }), { y: 0.66, z: -0.47 }, tg);
      for (let k = -3; k <= 3; k++) { M(cyl(0.12, 0.1, 0.015, 20), mat("#f8f8f6", { rough: 0.3 }), { x: k * 1.2, y: 0.79, z: -0.18 }, tg); }
      Sx.candelabra(hall, { x: 8.6, y: F + 0.78, z: TT.z + 0.15, arms: 5 }); Sx.candelabra(hall, { x: 13.6, y: F + 0.78, z: TT.z + 0.15, arms: 5 });
      for (let k = 0; k < 6; k++) chair(7.4 + k * 1.55, TT.z + 0.75, Math.PI); }
    // her shoes on the top table (black pumps), hidden until she takes them off
    const shoes = G({ x: 11.3, y: F + 0.785, z: TT.z - 0.22, ry: -30 }, hall);
    { const pm = new T.MeshPhysicalMaterial({ color: "#121214", roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1 }); for (const s of [-1, 1]) { const sh = G({ x: s * 0.07, rz: s * 2, ry: s * 8 }, shoes); const sg = new T.SphereGeometry(0.05, 16, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55); sg.scale(0.75, 0.9, 2.3); M(sg, pm, { y: 0.045, z: 0.02 }, sh); M(box(0.06, 0.004, 0.22), pm, { y: 0.0, z: 0.0 }, sh); M(cyl(0.006, 0.01, 0.07, 8), pm, { y: 0.035, z: -0.1 }, sh); } }
    // the coat rack by the door with one man's coat left on it, and a pair of men's shoes under it (a rival plant)
    const rackG = G({ x: HX0 + 0.55, y: F, z: 3.1 }, hall);
    { M(cyl(0.03, 0.03, 1.8, 10), oakM, { y: 0.9 }, rackG); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; K.rod([0, 0.02, 0], [Math.cos(a) * 0.3, 0.0, Math.sin(a) * 0.3], 0.02, oakM, rackG, 6); K.rod([0, 1.7, 0], [Math.cos(a) * 0.18, 1.8, Math.sin(a) * 0.18], 0.012, oakM, rackG, 6); }
      const coat = G({ x: 0.13, y: 1.7, z: 0.05 }, rackG); const cm = Sx.plankM("c_coat", { base: "#2a2c34", n: 1 }); void cm; const coatM = K.pmat("#2b2d36", { rough: 0.8, sheen: 0.4, sheenColor: "#8a90a0" });
      const cg = new T.CylinderGeometry(0.1, 0.24, 1.05, 18, 4, true); M(cg, coatM, { y: -0.55 }, coat);
      const oxM = new T.MeshPhysicalMaterial({ color: "#4a2a18", roughness: 0.35, clearcoat: 0.7 });
      for (const s of [-1, 1]) { const sh = G({ x: 0.08 + s * 0.08, y: 0, z: 0.32, ry: 70 + s * 6 }, rackG); M(rbox(0.1, 0.07, 0.27, 0.035), oxM, { y: 0.035 }, sh); M(box(0.1, 0.012, 0.28), mat("#1a120c"), { y: 0.004 }, sh); M(box(0.07, 0.01, 0.09), mat("#2a1810"), { y: 0.071, z: -0.02 }, sh); } }
    // the ORDER OF THE DAY easel (a plant): an oak A-frame with a cream board
    const easel = G({ x: 8.0, y: F, z: 3.2, ry: -20 }, hall);
    const easelT = K.textTex("c_easel", 512, 720, (q, w, h) => { q.fillStyle = "#f4ede0"; q.fillRect(0, 0, w, h); q.strokeStyle = "#b8975a"; q.lineWidth = 8; q.strokeRect(20, 20, w - 40, h - 40); q.lineWidth = 2; q.strokeRect(34, 34, w - 68, h - 68);
      q.fillStyle = "#2a2420"; q.textAlign = "center"; q.font = "600 50px KitOswald, serif"; q.fillText("ORDER OF THE DAY", w / 2, 128);
      q.fillStyle = "#b8975a"; q.fillRect(w / 2 - 80, 156, 160, 3);
      q.textAlign = "left"; const rows = [["18:00", "VOWS"], ["20:00", "DINNER"], ["22:00", "CAKE"], ["00:00", "FIREWORKS"]];
      rows.forEach(([a, b], i) => { q.fillStyle = "#8a6a2a"; q.font = "700 54px KitOswald, sans-serif"; q.fillText(a, 66, 262 + i * 112); q.fillStyle = "#2a2420"; q.font = "600 54px KitOswald, sans-serif"; q.fillText(b, 226, 262 + i * 112); });
      q.textAlign = "center"; q.fillStyle = "#8a6a2a"; q.font = "italic 500 30px KitInter, serif"; q.fillText("thank you for celebrating with us", w / 2, h - 66); });
    { for (const s of [-1, 1]) K.rod([s * 0.32, 0, 0.12], [s * 0.1, 1.72, 0], 0.025, oakM, easel, 6); K.rod([0, 0, -0.45], [0, 1.6, 0.0], 0.022, oakM, easel, 6); M(box(0.78, 0.04, 0.08), oakM, { y: 0.68, z: 0.13 }, easel);
      M(box(0.66, 0.92, 0.02), mat("#ffffff", { map: easelT, rough: 0.8 }), { y: 1.17, z: 0.13, rx: -8 }, easel); }
    // the dessert table with the half-eaten cake (east wall)
    const cakeM = new T.MeshPhysicalMaterial({ color: "#f7f1e6", roughness: 0.6, sheen: 0.5, sheenColor: new T.Color("#ffffff") }), spongeM = mat("#e9c98e", { rough: 0.9 }), creamM = mat("#fbf3ea", { rough: 0.7 });
    function cake(parent, tiers, eat, p) { const g = G(p, parent); let y = 0; for (let i = 0; i < tiers; i++) { const r = 0.32 - i * 0.055, h = 0.16; const cut = i < eat ? 1 : 0;
        const tg = cut ? new T.CylinderGeometry(r, r, h, 36, 1, false, 0.6, Math.PI * 2 - 1.5) : new T.CylinderGeometry(r, r, h, 36); M(tg, cakeM, { y: y + h / 2 }, g);
        if (cut) { for (const a of [0.6, 0.6 + Math.PI * 2 - 1.5]) M(new T.PlaneGeometry(r, h), spongeM, { x: Math.sin(a) * r / 2, y: y + h / 2, z: Math.cos(a) * r / 2, ry: a / D2R + 90, cast: false }, g).material.side = T.DoubleSide; }
        M(new T.TorusGeometry(r, 0.012, 6, 36), creamM, { y: y + h, rx: 90 }, g); y += h; }
      return g; }
    { const dt = G({ x: 15.6, y: F, z: 3.6 }, hall); M(cyl(0.5, 0.5, 0.74, 30), clothM, { y: 0.37 }, dt); M(cyl(0.2, 0.25, 0.03, 24), mat("#d8d8d8", { metal: 0.6, rough: 0.3 }), { y: 0.76 }, dt); const ck = cake(dt, 3, 2, { y: 0.775 });
      { const tp = G({ y: 0.775 + 0.48 + 0.005, x: -0.02, z: 0.06, ry: -35 }, dt); const wm = mat("#f6f2ea", { rough: 0.5 }), bm = mat("#1c1c22", { rough: 0.4 }), sk = mat("#e0b494", { rough: 0.5 });
        M(new T.ConeGeometry(0.03, 0.09, 16), wm, { x: -0.025, y: 0.045 }, tp); M(sph(0.013, 10, 8), sk, { x: -0.025, y: 0.1 }, tp); M(sph(0.0135, 10, 8), mat("#6a3a1e", { rough: 0.5 }), { x: -0.025, y: 0.105, z: -0.003 }, tp);
        M(K.cyl(0.016, 0.018, 0.085, 12), bm, { x: 0.025, y: 0.043 }, tp); M(sph(0.013, 10, 8), sk, { x: 0.025, y: 0.1 }, tp); M(sph(0.0135, 10, 8), mat("#1a120c", { rough: 0.5 }), { x: 0.025, y: 0.106, z: -0.003 }, tp); void ck; } M(box(0.24, 0.006, 0.03), mat("#c0c4c8", { metal: 0.7, rough: 0.3 }), { x: 0.28, y: 0.78, z: 0.1, ry: 30 }, dt); }
    // candelabras round the hall, two iron chandeliers with candles, fairy lights strung under the beams
    Sx.candelabra(hall, { x: 5.6, y: F, z: 6.2, arms: 5, s: 2.4 }); Sx.candelabra(hall, { x: 16.4, y: F, z: 9.6, arms: 5, s: 2.4, tag: "cand2" });
    const chand = [];
    for (const cx of [8.6, 13.6]) { const g = G({ x: cx, y: 4.6, z: 7.4 }, hall); M(new T.TorusGeometry(0.8, 0.04, 8, 40), ironM, { rx: 90 }, g); for (let k = 0; k < 4; k++) K.rod([Math.cos(k * 1.571) * 0.8, 0, Math.sin(k * 1.571) * 0.8], [0, 1.2, 0], 0.012, ironM, g, 4); K.rod([0, 1.2, 0], [0, 2.7, 0], 0.02, ironM, g, 6);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; Sx.candle(g, { x: Math.cos(a) * 0.8, y: 0.04, z: Math.sin(a) * 0.8, h: 0.12, r: 0.02, fs: 1.3 }); }
      const L = new T.PointLight("#ffbc78", 0, 0, 2); L.position.set(cx, 4.4, 7.4); scene.add(L); chand.push(L); }
    chand[0].castShadow = true; chand[0].shadow.mapSize.set(1024, 1024); chand[0].shadow.camera.near = 0.1; chand[0].shadow.camera.far = 16; chand[0].shadow.bias = -0.002; chand[0].shadow.radius = 3;
    { const hb = []; const st2 = (a, b, sag) => { const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.round(L / 0.3); for (let i = 0; i <= n; i++) { const u = i / n; hb.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * sag, lerp(a[2], b[2], u)]); } };
      for (let x = HX0 + 1; x < HX1; x += 2.4) { st2([x, 6.9, HZ0 + 0.3], [x + 2.4, 6.9, HZ1 - 0.3], 1.1); st2([x, 6.9, HZ1 - 0.3], [x + 2.4, 6.9, HZ0 + 0.3], 1.1); }
      const ib = new T.InstancedMesh(new T.SphereGeometry(0.03, 6, 5), glow("#ffdcaa", 7), hb.length); const d = new T.Object3D(); hb.forEach((p, i) => { d.position.fromArray(p); d.updateMatrix(); ib.setMatrixAt(i, d.matrix); }); ib.castShadow = false; ib.frustumCulled = false; scene.add(ib); }
    const hallFill = new T.PointLight("#ffc890", 0, 0, 2); hallFill.position.set(11, 3.4, 9.8); scene.add(hallFill);
    const winFill = new T.PointLight("#9fb4ff", 0, 0, 2); winFill.position.set(11.5, 2.6, 12.4); scene.add(winFill);
    // a warm key for her face (a spot cheated over the top table) + a cool rim from the windows; driven per shot
    const key = new T.SpotLight("#ffd8b0", 0, 7, 26 * D2R, 0.8, 1.4); scene.add(key, key.target);
    const rim = new T.SpotLight("#a8bcff", 0, 8, 28 * D2R, 0.8, 1.4); scene.add(rim, rim.target);

    // ---------------------------------------------------------------- the kitchen (north-west range): vaulted, buffet trays, the five-tier cake, a wall of champagne
    const kit = G({});
    const KX0 = -16.9, KX1 = -5.8, KZ0 = -12.9, KZ1 = -4.2;
    W(KX1 - KX0, 0.06, KZ1 - KZ0, { x: (KX0 + KX1) / 2, y: F - 0.02, z: (KZ0 + KZ1) / 2 }, flagM, kit);
    W(KX1 - KX0, 5.4, 0.05, { x: (KX0 + KX1) / 2, y: 2.7, z: KZ0 + 0.02 }, wallIn, kit); W(KX1 - KX0, 5.4, 0.05, { x: (KX0 + KX1) / 2, y: 2.7, z: KZ1 - 0.02 }, wallIn, kit);
    W(0.05, 5.4, KZ1 - KZ0, { x: KX0 + 0.02, y: 2.7, z: (KZ0 + KZ1) / 2 }, wallIn, kit); W(0.05, 5.4, KZ1 - KZ0, { x: KX1 - 0.02, y: 2.7, z: (KZ0 + KZ1) / 2 }, wallIn, kit);
    W(KX1 - KX0, 0.1, KZ1 - KZ0, { x: (KX0 + KX1) / 2, y: 5.0, z: (KZ0 + KZ1) / 2 }, Sx.plankM("c_boards", { base: "#3c2a1c", n: 10 }), kit);
    for (const x of [-14.2, -11.3, -8.4]) { W(0.45, 0.5, KZ1 - KZ0, { x, y: 4.7, z: (KZ0 + KZ1) / 2 }, wallIn, kit); for (const z of [KZ0 + 0.25, KZ1 - 0.25]) W(0.45, 4.7, 0.5, { x, y: 2.35, z }, wallIn, kit); }
    // steel counters with chafing dishes (the buffet)
    const steel = mat("#b8bdc2", { metal: 0.55, rough: 0.28 });
    const KT = { z: -6.0 };
    { for (const [x0, x1, z] of [[-15.6, -7.2, -5.2], [-15.6, -9.2, -9.4]]) { const L = x1 - x0; M(box(L, 0.06, 0.9), steel, { x: (x0 + x1) / 2, y: 0.9, z }, kit); M(box(L, 0.86, 0.85), mat("#8e9398", { metal: 0.4, rough: 0.4 }), { x: (x0 + x1) / 2, y: 0.44, z }, kit);
        for (let x = x0 + 0.6; x < x1 - 0.4; x += 0.95) { const cd = G({ x, y: 0.93, z }, kit); M(box(0.6, 0.12, 0.38), steel, { y: 0.1 }, cd); const lid = new T.SphereGeometry(0.32, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.32); lid.scale(1, 0.6, 0.62); M(lid, steel, { y: 0.06 }, cd); M(new T.TorusGeometry(0.035, 0.008, 6, 14), steel, { y: 0.25, rx: 90 }, cd); for (const s of [-1, 1]) M(box(0.05, 0.16, 0.05), steel, { x: s * 0.3, y: 0.0 }, cd); } } }
    // the five-tier cake on a trolley
    const cake5 = G({ x: -12.4, y: F, z: -7.4 }, kit);
    { M(box(1.0, 0.04, 0.7), steel, { y: 0.8 }, cake5); for (const sx of [-0.45, 0.45]) for (const sz of [-0.3, 0.3]) M(cyl(0.015, 0.015, 0.8, 6), steel, { x: sx, y: 0.4, z: sz }, cake5); M(box(1.0, 0.03, 0.7), steel, { y: 0.15 }, cake5);
      cake(cake5, 5, 0, { y: 0.82, s: 1.0 });
      const R = rng(55); for (let i = 0; i < 22; i++) { const tier = Math.floor(R() * 5), r = 0.32 - tier * 0.055, a = R() * 6.28; M(sph(0.022 + R() * 0.012, 8, 6), [mat("#f2e8e4", { rough: 0.7 }), mat("#e8b9c0", { rough: 0.7 })][i % 2], { x: Math.cos(a) * r, y: 0.82 + tier * 0.16 + 0.16, z: Math.sin(a) * r, cast: false }, cake5); } }
    // the wall of champagne: oak racks on the north wall, ~360 unlabelled dark-green bottles, foil necks
    const bottles = (() => { const pts = []; const prof = [[0, 0], [0.038, 0], [0.04, 0.02], [0.04, 0.2], [0.035, 0.24], [0.016, 0.28], [0.015, 0.33], [0.017, 0.335], [0, 0.34]]; prof.forEach(([r, y]) => pts.push(new T.Vector2(r, y))); return new T.LatheGeometry(pts, 14); })();
    const bottleM = new T.MeshPhysicalMaterial({ color: "#13301e", roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 });
    const foilG = new T.CylinderGeometry(0.0175, 0.022, 0.07, 12); foilG.translate(0, 0.305, 0);
    { const n = 360, ib = new T.InstancedMesh(bottles, bottleM, n), ifo = new T.InstancedMesh(foilG, mat("#c9a24a", { metal: 0.7, rough: 0.3 }), n), d = new T.Object3D(); let i = 0;
      for (let r = 0; r < 12; r++) for (let c = 0; c < 30; c++) { d.position.set(-15.4 + c * 0.2, 0.45 + r * 0.24, KZ0 + 0.06); d.rotation.set(Math.PI / 2, 0, 0); d.updateMatrix(); ib.setMatrixAt(i, d.matrix); ifo.setMatrixAt(i, d.matrix); i++; }
      ib.castShadow = true; scene.add(ib, ifo);
      for (let r = 0; r <= 12; r++) M(box(6.2, 0.03, 0.42), oakM, { x: -12.5, y: 0.32 + r * 0.24, z: KZ0 + 0.22 }, kit);
      for (let c = 0; c <= 6; c++) M(box(0.05, 3.1, 0.42), oakM, { x: -15.55 + c * 1.02, y: 1.75, z: KZ0 + 0.22 }, kit); }
    const kitL = []; for (const [x, z] of [[-14, -7.8], [-9.5, -7.8], [-12.4, -11.2]]) { const g = G({ x, y: 4.0, z }, kit); K.rod([0, 0, 0], [0, 1.2, 0], 0.008, ironM, g, 4); M(new T.ConeGeometry(0.28, 0.22, 20, 1, true), mat("#3a3a3c", { metal: 0.5, rough: 0.4, side: T.DoubleSide }), { y: 0 }, g); M(sph(0.06, 10, 8), glow("#ffd9a0", 8), { y: -0.06, cast: false }, g); const L = new T.PointLight("#ffd2a0", 0, 0, 2); L.position.set(x, 3.85, z); scene.add(L); kitL.push(L); }
    kitL[0].castShadow = true; kitL[0].shadow.mapSize.set(512, 512); kitL[0].shadow.camera.far = 12; kitL[0].shadow.bias = -0.002; kitL[0].shadow.radius = 3;

    // ---------------------------------------------------------------- red eyes: still at the forest edge (and up the road), then gathered at the moat's edge
    const outer = ringPts(OUT, 160).filter(([x, z]) => Math.hypot(x - POND.cx, z - POND.cz) > POND.r + 1);
    for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2; const x = POND.cx + Math.cos(a) * POND.r, z = POND.cz + Math.sin(a) * POND.r; if (rr(OUT, x, z) > 1) outer.push([x, z]); }
    const EY = Sx.eyes(110, (R, i) => {
      let a; if (i % 5 < 4) { const ang = R() * Math.PI * 2, rad = 58 + R() * 9; a = [Math.cos(ang) * rad, 0, Math.sin(ang) * rad * 1.05]; } else { const z = 64 + R() * 70; a = [roadX(z) + (R() - 0.5) * 5, 0, z]; }
      a[1] = surfH(a[0], a[2]) + 1.5 + R() * 0.3;
      let o = outer[Math.floor(R() * outer.length)]; for (let k = 0; k < 8 && Math.hypot(o[0] - 9.5, o[1] - 31) < 9; k++) o = outer[Math.floor(R() * outer.length)]; let dx = o[0] - OUT.cx, dz = o[1] - OUT.cz; if (Math.hypot(o[0] - POND.cx, o[1] - POND.cz) < POND.r + 0.5) { dx = o[0] - POND.cx; dz = o[1] - POND.cz; } const dl = Math.hypot(dx, dz), off = 1.4 + R() * 2.5;
      const b = [o[0] + dx / dl * off, 0, o[1] + dz / dl * off]; b[1] = surfH(b[0], b[2]) + 1.5 + R() * 0.25;
      return { a, b };
    }, { r: 0.065, sep: 0.07, seed: 4242 });

    // ---------------------------------------------------------------- merge static meshes by material (draw calls)
    Sx.bake(C); Sx.bake(hall, [shoes]); Sx.bake(kit); Sx.bake(lawn, [fbox]); Sx.bake(herCar); Sx.bake(winchRoom);
    jamBodies.forEach((g) => Sx.bake(g)); Sx.bake(jm); Sx.bake(hwy);

    // ---------------------------------------------------------------- per-frame state
    const _v = new T.Vector3(), _q = new T.Quaternion(), _m = new T.Matrix4(), _s = new T.Vector3(1, 1, 1), _up = new T.Vector3(0, 1, 0);
    function placeChains(a) {
      const tipZ = 19.0 + Math.cos(a) * 10.35, tipY = 0.12 + Math.sin(a) * 10.35;
      for (const { im, s } of chains) {
        const A = [s * 2.05, tipY, tipZ], B = [s * 1.7, 10.9, 19.0], L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.min(NL, Math.max(1, Math.round(L / 0.19)));
        const dir = _v.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]).normalize();
        for (let i = 0; i < NL; i++) {
          if (i >= n) { _m.makeScale(0, 0, 0); im.setMatrixAt(i, _m); continue; }
          const u = (i + 0.5) / n, sag = Math.sin(Math.PI * u) * 0.25 * Math.cos(a);
          _q.setFromUnitVectors(_up, dir); if (i % 2) { const q2 = new T.Quaternion().setFromAxisAngle(_up, Math.PI / 2); _q.multiply(q2); }
          _m.compose(new T.Vector3(lerp(A[0], B[0], u), lerp(A[1], B[1], u) - sag, lerp(A[2], B[2], u)), _q, _s); im.setMatrixAt(i, _m);
        }
        im.instanceMatrix.needsUpdate = true;
      }
    }
    K.onRender((st, t, cam) => {
      const I = (k, d) => (st[k] != null ? st[k] : d);
      // the bridge: 0 down … 90 up (about the hinge's x axis), the chains follow, the drum turns
      const ba = I("bridgeA", 0) * D2R; bridge.rotation.x = -ba; placeChains(ba); drum.rotation.x = -ba * 4.2;
      // fairy lights + practicals
      const fk = I("fairyK", 1); bulbM.color.set("#ffd9a0").multiplyScalar(9 * fk); haloI.material.uniforms.k.value = fk;
      upL.forEach((L) => (L.intensity = 40 * I("upI", 1))); floodL.forEach((L) => (L.intensity = 1700 * I("floodI", 1))); archL.intensity = 9 * I("archI", I("lampI", 1));
      lampL.forEach((L) => (L.intensity = 14 * I("lampI", 1))); lampGlobes.forEach((g) => g.material.color.set("#ffd09a").multiplyScalar(6 * clamp(I("lampI", 1), 0.05, 2)));
      paneM.color.setScalar(1.6 * I("paneK", 1));
      const hi = I("hallI", 0); chand.forEach((L) => (L.intensity = 14 * hi)); hallFill.intensity = 9 * hi * I("hallFillK", 1); winFill.intensity = 3.5 * I("winFill", hi); fireL.intensity = 6 * I("fireI", hi);
      emberM.color.set("#ff5a1a").multiplyScalar(3 * (0.75 + 0.25 * Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1)) * clamp(I("fireI", hi) + 0.3, 0, 2));
      lordLamp.intensity = 14 * I("lordI", 0);
      kitL.forEach((L) => (L.intensity = 20 * I("kitI", 0)));
      // shadow maps only from the lights that are on (a cube shadow is six scene renders)
      chand[0].castShadow = hi > 0.01 && !(I("mirror", 0) > 0); kitL[0].castShadow = I("kitI", 0) > 0.01; floodL[0].castShadow = I("mirror", 0) > 0;
      winchL.intensity = 6 * I("winchI", 0); winchGlobe.material.color.set("#ffc27a").multiplyScalar(4 * clamp(I("winchI", 0) + 0.2, 0, 2));
      if (st.keyI) { key.position.fromArray(st.keyP); key.target.position.fromArray(st.keyT); key.target.updateMatrixWorld(); key.intensity = st.keyI; } else key.intensity = 0;
      if (st.rimI) { rim.position.fromArray(st.rimP); rim.target.position.fromArray(st.rimT); rim.target.updateMatrixWorld(); rim.intensity = st.rimI; } else rim.intensity = 0;
      // the firing box LED: blinks at ledRate (per second); one short flash per period
      const rate = I("ledRate", 0.8), ph = (t * rate) % 1, on = I("ledK", 1) > 0 && ph < 0.22;
      ledM.color.set("#ff1a0a").multiplyScalar(on ? 30 * I("ledK", 1) : 0.4); ledHalo.visible = on; ledHalo.scale.setScalar(I("ledHalo", 0.06)); ledL.intensity = on ? 0.6 * I("ledK", 1) : 0; ledHalo.lookAt(cam.position);
      shoes.visible = I("shoesOnTable", 0) > 0;
      tailI.visible = headI.visible = hwy.visible = I("hwyK", 0) > 0; jamBodies.forEach((g) => (g.visible = hwy.visible)); jm.visible = hwy.visible; hwyLamps.forEach((g) => (g.visible = hwy.visible));
      EY.set(t, { k: I("eyesK", 0), scale: I("eyesScale", 1), gather: I("eyesGather", 0), blink: I("eyesBlink", 0) > 0.5, I: I("eyesI", 1), look: [0, 0] });
    });

    return { C, GH, bridge, drum, winch, hall, kit, lawn, rack, fbox, herCar, jm, shoes, easel, photoWall, fire, cake5, EY,
      P: Object.assign(P, { WINX, WW, WS, WT, TT, TABLES, HX0, HX1, HZ0, HZ1, KX0, KX1, KZ0, KZ1, RACK, BOX, ARCH, JM, FP, F }), groundH, surfH, rr, dU, moat, Sx };
  }

  // ---------------------------------------------------------------- Maya: the Hazel v2 rig re-dressed — a different face, skin, curls, a plum blazer, a headset
  const MAYA = { skin: "#7c5e52", earIn: "#5e3e30", lip: "#8a4a40", brow: "#3a2414", iris: [[92, 58, 34], [44, 26, 16]],
    face: { w: 0.97, len: 1.06, jaw: 0.13, chin: 0.06, cheek: 0.009, eyeX: 0.0345, eyeY: 0.011, eyeZ: "fit", eyeS: 1.12, tilt: -3, lid: 4, noseW: 1.3, bridgeW: 1.3, noseL: 0.879, noseY: 0.0007, noseZ: 0.95, browY: 0.004, browT: 0.8, browArch: 1.35, browLen: 1.05, lipW: 1.1, lipT: 1.4 },
    jacket: "#e6ddcc", jacketSheen: "#ffffff", jacketRough: 0.72, trim: "#d4c8b2", trimSheen: "#ffffff", seam: "#cfc3ac", pants: "#18181c", pantsSheen: "#55555e",
    boot: "#111113", sole: "#0a0a0b", under: "#18181c", tie: "#c9953f", chestPocket: false, handPockets: false, pony: false };
  function dressMaya(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, sp = hz.spine, surf = hz.surf;
    S.hair.curls(K, hz, { col: "#c58f3e", streaks: ["rgba(120,70,20,0.35)", "rgba(240,200,120,0.32)", "rgba(255,226,160,0.25)"], sheen: "#ffe0a0", vol: 0.3, len: 0.04, n: 34, crown: 420, bob: true });
    // a blazer, not a zipped jacket: hide the zip and the stand collar, open V with a black top, lapels, two buttons, a pocket square
    sp.children.forEach((o) => { if (!o.isMesh) return; const gp = o.geometry.parameters || {};
      if (o.material === hz.mats.metal) o.visible = false;
      if (gp.radiusTop === 0.074 && gp.openEnded) o.visible = false;              // stand collar
      if (o.geometry.type === "TorusGeometry" && gp.radius === 0.075) o.visible = false; });
    { const vg = new T.BufferGeometry(); const A = surf(0.53, 0.3, 1.02), B = surf(0.53, -0.3, 1.02), C2 = surf(0.2, 0, 1.022), D2 = surf(0.4, 0, 1.022);
      vg.setAttribute("position", new T.Float32BufferAttribute([...A, ...D2, ...C2, ...B, ...D2, ...C2], 3)); vg.setIndex([0, 2, 1, 3, 4, 5]); vg.computeVertexNormals();
      M(vg, K.pmat("#16161a", { rough: 0.7, side: T.DoubleSide }), { cast: false }, sp); }
    const lap = K.pmat("#d8ccb6", { rough: 0.7, sheen: 0.6, sheenColor: "#ffffff" });
    for (const s of [-1, 1]) {
      const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10, y = lerp(0.54, 0.2, u), a = s * lerp(0.36, 0.03, u); pts.push(surf(y, a, 1.032)); }
      M(K.tubeGeo(pts, 30, 6, (u) => 0.011 * (1 - 0.55 * u) + 0.004, { squash: () => 0.3 }), lap, { cast: false }, sp);
    }
    for (const y of [0.13, 0.05]) { const p = surf(y, 0.0, 1.02); M(K.cyl(0.008, 0.008, 0.005, 14), mat("#2a2420", { rough: 0.4 }), { x: p[0] + 0.012, y: p[1], z: p[2] + 0.002, rx: 90, cast: false }, sp); }
    { const p = surf(0.33, 0.5, 1.03); M(K.box(0.03, 0.02, 0.006), mat("#c9953f", { rough: 0.6 }), { x: p[0], y: p[1], z: p[2], ry: 28, cast: false }, sp); }
    // headset: a thin band over the curls, an earpiece on her left ear, a boom mic to the mouth corner
    const head = hz.head, HY = 0.1, FC = hz.FC;
    { const band = []; for (let k = 0; k <= 24; k++) { const a = lerp(-1.45, 1.45, k / 24); band.push([Math.sin(a) * 0.1 * FC.w * 1.36, HY + Math.cos(a) * 0.1 * FC.len * 1.3 - 0.004, -0.008]); }
      M(K.tubeGeo(band, 48, 6, () => 0.0035), mat("#1c1c1e", { rough: 0.4 }), { cast: false }, head);
      const ex = 0.1 * FC.w * 1.0 + 0.012; M(K.cyl(0.022, 0.022, 0.014, 18), mat("#1c1c1e", { rough: 0.4 }), { x: ex, y: HY - 0.002, z: -0.004, rz: 90 }, head);
      const boom = []; for (let k = 0; k <= 12; k++) { const u = k / 12; boom.push([ex - 0.004 - u * 0.05, HY - 0.01 - u * 0.045, -0.002 + u * 0.085 - u * u * 0.004]); }
      M(K.tubeGeo(boom, 24, 5, () => 0.0026), mat("#1c1c1e", { rough: 0.4 }), { cast: false }, head);
      M(K.sph(0.006, 10, 8), mat("#2a2a2e", { rough: 0.6 }), { x: boom[12][0], y: boom[12][1], z: boom[12][2], cast: false }, head);
      M(K.sph(0.0018, 6, 4), K.glow("#46ff7a", 3), { x: ex + 0.008, y: HY + 0.004, z: 0.004, cast: false }, head); }
    // tools: the clipboard (left hand), a pen (right), her phone (right)
    const clip = new T.Group(); M(K.box(0.24, 0.32, 0.008), mat("#6a4a30", { rough: 0.6 }), {}, clip);
    const sheetT = K.textTex("maya_sheet", 256, 340, (q, w, h) => { q.fillStyle = "#fbfaf6"; q.fillRect(0, 0, w, h); q.fillStyle = "#2a2a30"; q.font = "700 22px KitOswald, sans-serif"; q.fillText("SEATING · RUN SHEET", 16, 36); q.fillStyle = "rgba(40,40,60,0.55)"; for (let y = 60; y < h - 20; y += 22) q.fillRect(16, y, w - 32 - (y * 7) % 60, 3); q.fillStyle = "#3a8a4a"; for (let y = 60; y < 200; y += 22) q.fillRect(w - 40, y - 6, 14, 3); });
    M(new T.PlaneGeometry(0.21, 0.28), mat("#ffffff", { map: sheetT, rough: 0.85 }), { y: -0.01, z: 0.0045, cast: false }, clip);
    M(K.box(0.1, 0.035, 0.016), mat("#b8bcc0", { metal: 0.7, rough: 0.3 }), { y: 0.15, z: 0.008 }, clip);
    clip.position.set(-0.04, -0.09, 0.05); clip.rotation.set(-0.35, 0.0, 1.45); hz.tool("clipboard", clip, 1);
    const pen = new T.Group(); M(K.cyl(0.0035, 0.0035, 0.14, 6), mat("#1a1a1e", { rough: 0.4 }), { rx: 90 }, pen); pen.position.set(0, -0.075, 0.03); hz.tool("pen", pen, 0);
    const phone = new T.Group(); M(K.rbox(0.07, 0.145, 0.009, 0.01), mat("#16171a", { rough: 0.3, metal: 0.3 }), {}, phone);
    const scrT = K.textTex("maya_phone", 192, 400, (q, w, h) => { q.fillStyle = "#0f1013"; q.fillRect(0, 0, w, h); q.fillStyle = "#3a3c42"; q.beginPath(); q.roundRect ? q.roundRect(12, 70, w - 24, 210, 18) : q.rect(12, 70, w - 24, 210); q.fill();
      q.fillStyle = "#ff5a45"; q.font = "700 22px KitOswald, sans-serif"; q.fillText("⚠ EMERGENCY ALERT", 24, 104); q.fillStyle = "#e8e8ea"; q.font = "600 21px KitInter, sans-serif"; ["Outbreak in the", "city. Stay where", "you are."].forEach((s, i) => q.fillText(s, 24, 146 + i * 30)); q.fillStyle = "#9a9ca2"; q.font = "500 16px KitInter, sans-serif"; q.fillText("now", w - 52, 104); });
    const scr = M(new T.PlaneGeometry(0.062, 0.13), new T.MeshBasicMaterial({ map: scrT, color: new T.Color(0.05, 0.05, 0.05) }), { z: 0.0052, cast: false }, phone);
    phone.position.set(0.0, -0.09, 0.03); phone.rotation.set(-0.6, 0, 0); hz.tool("phone", phone, 0);
    Object.assign(hz.POSES, {
      clip: { arms: [[-14, -6, -64], [-22, 14, -96]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [70, 60] },
      clipwalk: { arms: [[8, -8, -14], [-22, 14, -96]], legs: [[-14, 10], [12, 4]], hipY: 0.92, spine: [3, 0], curl: [40, 60] },
      blow: { arms: [[-30, -12, -110], [-22, 14, -96]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [18, 0], curl: [70, 60] },
      phone: { arms: [[-40, -14, -72], [-14, 8, -40]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [80, 40] },
      crank: { arms: [[-70, -14, -40], [-64, 14, -44]], legs: [[-18, 10], [14, 0]], hipY: 0.9, spine: [14, 0], curl: [90, 90] },
      sitplan: { arms: [[-52, -8, -60], [-48, 10, -70]], legs: [[-88, 88], [-84, 84]], hipY: 0.56, spine: [8, 0], curl: [70, 60] },
      bottle: { arms: [[-60, -16, -80], [-20, 8, -30]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [85, 40] },
    });
    return { tools: { clip, pen, phone, scr } };
  }

  S.castle = castle;
  S.castle.CREATE = CREATE;
  S.castle.MAYA = MAYA;
  S.castle.dressMaya = dressMaya;
})();
