/* Survival-scenario kit · world module "The Vault" (needs survival-kit.js v2.1). A night city block with a classical
 * stone bank, its marble lobby, a 20-ton round vault door and the vault behind it, all physically lit and seek-safe.
 *
 *   const K  = SURVIVAL.create(Object.assign({ canvas, width, height }, SURVIVAL.vault.CREATE));
 *   const Vt = SURVIVAL.vault(K);            // builds everything, registers a per-frame hook
 *   const hz = K.hazel(SURVIVAL.vault.ROSA); SURVIVAL.vault.dressRosa(K, hz, Vt);
 *   K.render({ …kit state…, doorA, boltK, upI, streetI, lobbyI, deskI, monI, vaultI, campI, skyI,
 *              cctv:{clock, run}, eyesK, eyesGather, trafficK, sirenK, supplies:[k0..k3], dial })
 *
 * World (metres; the bank faces +z, the avenue runs along x at z 9..21, the sidewalk is 0.15 high):
 *   street grid of 60 x 50 m blocks with 12 m streets, ~3k instanced streetlights with light pools, procedural
 *   buildings whose lit windows come from world position (no textures), downtown towers far to the west with a fire
 *   glow, a wet-asphalt avenue with lane marks, her car under a real streetlight, moving headlights + emergency flashes
 *   bank: stylobate + 8 steps, 6 fluted columns uplit from their bases, entablature with carved BANK / EST. 1908,
 *   pediment, bronze-and-glass doors, grilled windows; lobby: checker marble floor, 8 marble columns, a moonlit
 *   skylight grid, teller counters with brass grilles, velvet ropes, the security desk with a banker's lamp and a
 *   6-screen CCTV wall (canvas, redrawn per frame from st.cctv); the vault door (0.9 m thick, stepped, engine-turned
 *   face, 5-spoke wheel, combination dial, AIRTIGHT SEAL · CLASS 3 plate, 16 locking bolts, boltwork bars + time lock
 *   OPENS MON 08:00 on the inside face); the vault: deposit-box walls, steel floor, caged ceiling light, the vent with
 *   its OFF WHEN SEALED sticker, supplies that appear on cue (40 soup cans, 2 boxes of bars, 12 bottles, a lantern).
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  // moon behind the bank (north-north-east, 32° up) so it sits in the sky over the facade in the hero shot
  const MOON = (() => { const az = 24 * D2R, el = 28 * D2R; return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();
  const CREATE = {
    moonDir: MOON, moonCol: "#aebfff", bg: "#04060c", fogCol: "#2a2a3a", hemi: ["#46507a", "#2a2420"],
    shadow: { half: 40, far: 420, dist: 200, center: [0, 4, -8] },
    sky: { zen: [0.006, 0.01, 0.028], hor: [0.11, 0.085, 0.09] },             // city sky: sodium haze low down
    env: { zen: "#0a1024", hor: "#3a3036", mside: "#56628f", gnd: "#0b0a0a" },
  };

  const SW = 0.15, PY = 1.35;                    // sidewalk top, portico + lobby floor
  const COLX = [-11.25, -6.75, -2.25, 2.25, 6.75, 11.25], COLZ = 2.6;
  const LOB = { x0: -11.4, x1: 11.4, z0: -22.0, z1: -0.6, y1: 9.5 };
  const VDC = [0, PY + 1.8, -22.0];               // vault door centre (front face plane)
  const VR = 1.62, VTH = 0.92;                    // door radius, thickness (3 ft)
  const VLT = { x0: -3.2, x1: 3.2, z0: -29.6, z1: -22.92, y1: PY + 3.7 };
  const CAR = [11.4, 0, 10.45];

  function vault(K, opt) {
    opt = opt || {};
    const T = K.T, scene = K.scene, M = K.M, G = K.G, mat = K.mat, glow = K.glow, box = K.box, cyl = K.cyl, sph = K.sph, rbox = K.rbox;
    const rng = K.rng, hash2 = K.hash2, fbm = K.fbm;

    // ---------------------------------------------------------------- texture helpers
    function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
    function normalFromHeight(src, w, h, k, out) {      // height canvas (grey) -> normal map pixels on `out`
      const d = src.getContext("2d").getImageData(0, 0, w, h).data, H = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) H[i] = d[i * 4] / 255;
      const g = out.getContext("2d"), im = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = H[y * w + Math.min(w - 1, x + 1)] - H[y * w + Math.max(0, x - 1)], dy = H[Math.min(h - 1, y + 1) * w + x] - H[Math.max(0, y - 1) * w + x];
        let nx = -dx * k, ny = dy * k, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const q = (y * w + x) * 4; im.data[q] = (nx * 0.5 + 0.5) * 255; im.data[q + 1] = (ny * 0.5 + 0.5) * 255; im.data[q + 2] = (nz * 0.5 + 0.5) * 255; im.data[q + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    }
    // a colour map + a normal map drawn by one function (height = white). Text-safe: both are redrawn once fonts load.
    function pair(key, w, h, drawCol, drawH, k, repeat) {
      const col = K.textTex(key + "_c", w, h, drawCol);
      const hc = cv(w, h);
      const nrm = K.textTex(key + "_n", w, h, (g) => { const hg = hc.getContext("2d"); hg.clearRect(0, 0, w, h); drawH(hg, w, h); normalFromHeight(hc, w, h, k, g.canvas); });
      nrm.colorSpace = T.NoColorSpace;
      if (repeat) for (const t of [col, nrm]) { t.wrapS = t.wrapT = T.RepeatWrapping; }
      return { col, nrm };
    }
    function speckle(g, w, h, seed, n, a, cols) { const R = rng(seed); for (let i = 0; i < n; i++) { g.globalAlpha = a * R(); g.fillStyle = cols[Math.floor(R() * cols.length)]; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 2); } g.globalAlpha = 1; }
    const radial = K.canvasTex("v_radial", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

    // limestone ashlar (rusticated joints), carved letters, marble, brushed steel, engine-turned steel
    const stone = pair("v_stone", 512, 512, (g, w, h) => {
      g.fillStyle = "#cbbfa6"; g.fillRect(0, 0, w, h); speckle(g, w, h, 3, 9000, 0.22, ["#a99c82", "#e2d8c2", "#b8ab90"]);
      const R = rng(9); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.fillStyle = `rgba(${150 + R() * 40},${138 + R() * 36},${110 + R() * 30},0.18)`; g.fillRect(c * 171 + (r % 2) * 85, r * 128, 171, 128); }
      g.fillStyle = "rgba(70,60,46,0.55)"; for (let r = 0; r <= 4; r++) g.fillRect(0, r * 128 - 3, w, 6);
      for (let r = 0; r < 4; r++) for (let c = 0; c <= 3; c++) g.fillRect(c * 171 + (r % 2) * 85 - 3, r * 128, 6, 128);
    }, (g, w, h) => {
      g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); speckle(g, w, h, 4, 6000, 0.25, ["#ddd", "#bbb"]);
      g.fillStyle = "#222"; for (let r = 0; r <= 4; r++) g.fillRect(0, r * 128 - 4, w, 8);
      for (let r = 0; r < 4; r++) for (let c = 0; c <= 3; c++) g.fillRect(c * 171 + (r % 2) * 85 - 4, r * 128, 8, 128);
    }, 3.2, true);
    const stoneSmooth = pair("v_stone2", 256, 256, (g, w, h) => { g.fillStyle = "#cdc1a8"; g.fillRect(0, 0, w, h); speckle(g, w, h, 5, 3000, 0.25, ["#a99c82", "#e2d8c2"]); },
      (g, w, h) => { g.fillStyle = "#888"; g.fillRect(0, 0, w, h); speckle(g, w, h, 6, 2500, 0.5, ["#aaa", "#666"]); }, 1.2, true);
    const SERIF = "'Times New Roman', Georgia, 'Palatino Linotype', serif";
    function carved(key, text, w, h, size, spacing) {
      const drawText = (g, fill) => { g.font = `700 ${size}px ${SERIF}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = fill;
        if (spacing) { const chars = text.split(""); let tw = chars.reduce((a, ch) => a + g.measureText(ch).width, 0) + spacing * (chars.length - 1); let x = w / 2 - tw / 2; g.textAlign = "left"; for (const ch of chars) { g.fillText(ch, x, h / 2 + size * 0.04); x += g.measureText(ch).width + spacing; } }
        else g.fillText(text, w / 2, h / 2 + size * 0.04); };
      return pair(key, w, h, (g) => {
        g.fillStyle = "#cdc1a8"; g.fillRect(0, 0, w, h); speckle(g, w, h, 7, Math.round(w * h / 40), 0.22, ["#a99c82", "#e2d8c2"]);
        g.filter = "blur(2px)"; drawText(g, "rgba(78,66,48,0.75)"); g.filter = "none";
      }, (g) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.filter = "blur(3px)"; drawText(g, "#000"); g.filter = "none"; }, 5.0, false);
    }
    function marble(key, base, veins, seed) {
      return K.canvasTex(key, 512, 512, (g, w, h) => {
        g.fillStyle = base; g.fillRect(0, 0, w, h); speckle(g, w, h, seed, 4000, 0.12, veins);
        const R = rng(seed + 1);
        for (let i = 0; i < 14; i++) {
          g.strokeStyle = veins[i % veins.length]; g.globalAlpha = 0.18 + R() * 0.35; g.lineWidth = 0.6 + R() * 2.2;
          let x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 40; k++) { x += (R() - 0.3) * 26; y += (R() - 0.5) * 22; g.lineTo(x, y); }
          g.stroke();
        }
        g.globalAlpha = 1;
      }, { repeat: true });
    }
    const brushed = K.canvasTex("v_brushed", 256, 256, (g, w, h) => { g.fillStyle = "#9aa0a6"; g.fillRect(0, 0, w, h); const R = rng(41); for (let i = 0; i < 900; i++) { g.fillStyle = R() < 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"; g.fillRect(0, R() * h, w, 1); } }, { repeat: true });
    const engine = K.canvasTex("v_engine", 1024, 1024, (g, w, h) => {      // engine-turned (machined) door face
      g.fillStyle = "#a9afb5"; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (let r = 8; r < w / 2; r += 3) { g.strokeStyle = (r / 3) % 2 ? "rgba(255,255,255,0.09)" : "rgba(30,34,40,0.10)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
      for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; g.strokeStyle = "rgba(255,255,255,0.025)"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w); g.stroke(); }
    });

    K.buildSky();
    // ---------------------------------------------------------------- city: ground, streets, sidewalks, lane marks
    const city = G({});
    const asphaltRough = K.noiseTex("v_puddles", 256, 77, 4, 2.0);
    const asphaltCol = K.canvasTex("v_asphalt", 512, 512, (g, w, h) => { g.fillStyle = "#2b2b2e"; g.fillRect(0, 0, w, h); speckle(g, w, h, 12, 26000, 0.35, ["#1c1c1e", "#3c3c40", "#4a4a4e"]); }, { repeat: true });
    asphaltCol.repeat.set(900, 900);
    const asphalt = new T.MeshStandardMaterial({ map: asphaltCol, color: "#ffffff", roughness: 1.0, roughnessMap: asphaltRough, metalness: 0.0, envMapIntensity: 0.9 });
    asphaltRough.repeat.set(160, 160);
    asphalt.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n roughnessFactor = mix(0.22, 0.85, smoothstep(0.38, 0.62, texelRoughness.g));\n#endif"); };
    asphalt.customProgramCacheKey = () => "v_wetasphalt";
    M(new T.PlaneGeometry(6000, 6000), asphalt, { rx: -90, x: -1200, z: 0, cast: false }, city);
    // lane marks on the avenue near the bank
    const lane = K.canvasTex("v_lane", 64, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "rgba(235,228,205,0.85)"; for (let y = 0; y < h; y += 128) g.fillRect(26, y, 12, 64); }, { repeat: true });
    lane.repeat.set(1, 60);
    M(new T.PlaneGeometry(0.16, 240), new T.MeshStandardMaterial({ map: lane, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }), { rx: -90, rz: 90, x: -40, y: 0.006, z: 15, cast: false }, city);
    for (const z of [9.55, 20.45]) M(new T.PlaneGeometry(240, 0.12), mat("#cfc8b0", { rough: 0.6 }), { rx: -90, x: -40, y: 0.006, z, cast: false }, city);
    // crosswalk in front of the bank
    for (let i = 0; i < 9; i++) M(new T.PlaneGeometry(0.5, 3.0), mat("#d4cdb4", { rough: 0.6 }), { rx: -90, x: 27.4, y: 0.007, z: 10.2 + i * 1.25, rz: 90, cast: false }, city);

    // grid: blocks 60 x 50, streets 12 wide. block (i, j): x0 = -30 + 72 i, z0 = -41 + 62 j (bank block i = 0, j = 0)
    const BLK = [];
    for (let i = -24; i <= 8; i++) for (let j = -7; j <= 8; j++) BLK.push({ i, j, x0: -30 + 72 * i, x1: 30 + 72 * i, z0: -41 + 62 * j, z1: 9 + 62 * j });
    const swM = mat("#6f6c66", { rough: 0.85, map: K.canvasTex("v_slabs", 256, 256, (g, w, h) => { g.fillStyle = "#8a867e"; g.fillRect(0, 0, w, h); speckle(g, w, h, 21, 5000, 0.2, ["#77736b", "#9c978d"]); g.fillStyle = "rgba(40,38,34,0.5)"; for (let k = 0; k <= 4; k++) { g.fillRect(k * 64 - 1, 0, 2, h); g.fillRect(0, k * 64 - 1, w, 2); } }, { repeat: true }) });
    swM.map.repeat.set(1, 1);
    {
      const near = BLK.filter((b) => Math.abs(b.i) <= 3 && Math.abs(b.j) <= 3), far = BLK.filter((b) => !(Math.abs(b.i) <= 3 && Math.abs(b.j) <= 3));
      // near blocks: real slab boxes with UVs per metre (one mesh each, merged by hand below)
      for (const b of near) {
        const w = b.x1 - b.x0, d = b.z1 - b.z0;
        const g = new T.BoxGeometry(w, SW, d);
        const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 4, uv.getY(k) * d / 4);
        M(g, swM, { x: (b.x0 + b.x1) / 2, y: SW / 2, z: (b.z0 + b.z1) / 2, cast: false }, city);
      }
      const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mat("#55524c", { rough: 0.9 }), far.length);
      const d = new T.Object3D();
      far.forEach((b, k) => { d.position.set((b.x0 + b.x1) / 2, SW / 2, (b.z0 + b.z1) / 2); d.scale.set(b.x1 - b.x0, SW, b.z1 - b.z0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
      im.frustumCulled = false; im.receiveShadow = true; city.add(im);
    }

    // ---------------------------------------------------------------- procedural buildings: lit windows from world position
    const bU = { winK: { value: 1 } };
    function buildingMat(p) {
      const m = new T.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, metalness: 0.0, envMapIntensity: 0.5 });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uWinK = bU.winK;
        sh.uniforms.uLit = { value: p.lit }; sh.uniforms.uCell = { value: new T.Vector2(p.cw, p.ch) }; sh.uniforms.uSeed = { value: p.seed };
        sh.vertexShader = "varying vec3 vWP; varying vec3 vWN;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
          vec4 wp4 = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wp4 = instanceMatrix * wp4;
            vWN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
          #else
            vWN = normalize(mat3(modelMatrix) * objectNormal);
          #endif
          vWP = (modelMatrix * wp4).xyz;`);
        sh.fragmentShader = "uniform float uWinK, uLit, uSeed; uniform vec2 uCell; varying vec3 vWP; varying vec3 vWN;\nfloat bh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }\n" +
          sh.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          {
            vec3 an = abs(vWN);
            float wall = 1.0 - step(0.5, an.y);
            vec2 q = an.x > an.z ? vec2(vWP.z, vWP.y) : vec2(vWP.x, vWP.y);
            vec2 c = floor(q / uCell), f = fract(q / uCell);
            float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.86) * step(1.0, c.y) * wall;
            float shop = (1.0 - step(1.0, c.y)) * step(0.06, f.x) * step(f.x, 0.94) * step(0.05, q.y) * step(q.y, 2.9) * wall;
            float r = bh(c + floor(vWP.xz / 40.0) * 7.0);
            float lit = step(1.0 - uLit, r);
            float warm = bh(c * 1.7 + 3.0);
            vec3 wc = mix(vec3(1.0, 0.62, 0.32), vec3(0.85, 0.9, 1.0), step(0.82, warm)) * (0.55 + 0.9 * bh(c + 9.0));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.03, 0.04), max(win, shop * 0.8));
            totalEmissiveRadiance += wc * lit * win * uWinK * 2.2;
            totalEmissiveRadiance += vec3(1.0, 0.75, 0.45) * shop * step(0.86, bh(c * 3.1)) * uWinK * 1.2;
            // floor ledges
            diffuseColor.rgb *= 1.0 - 0.35 * step(0.94, f.y) * wall;
          }`).replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n");
      };
      m.customProgramCacheKey = () => "v_bld_" + p.seed;
      return m;
    }
    const bldNear = buildingMat({ lit: 0.3, cw: 3.4, ch: 3.4, seed: 1.7 }), bldFar = buildingMat({ lit: 0.42, cw: 3.4, ch: 3.4, seed: 5.3 }), bldDown = buildingMat({ lit: 0.62, cw: 2.6, ch: 3.6, seed: 9.1 });
    const PAL = ["#6a5446", "#7d6b5a", "#5d5a58", "#8a7f6f", "#6d4a3c", "#787878", "#5b5048", "#857561", "#4f4b48"];
    function buildings() {
      const R = rng(4049), lists = { near: [], far: [], down: [] };
      for (const b of BLK) {
        const dist = Math.hypot((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2 - 15);
        if (b.i === 0 && b.j === 0) {                               // the bank's own block: two neighbours + a back row
          lists.near.push([-30, -13.0, -41, 0.6, 19.5, 0], [13.0, 30, -41, 0.6, 15.2, 2], [-12.4, 12.4, -41, -35, 12, 4]);
          continue;
        }
        const tier = b.x1 < -1300 ? "down" : dist < 260 ? "near" : "far";
        const pad = 3.5;                                           // sidewalk
        let x = b.x0 + pad;
        while (x < b.x1 - pad - 4) {
          const wdt = Math.min(b.x1 - pad - x, 10 + R() * 22);
          const hFront = tier === "down" ? 60 + R() * 170 * (1 - clamp((-b.x1 - 1300) / 2600, 0, 0.6)) : 9 + R() * (dist < 200 ? 18 : 30) + (R() < 0.12 ? 25 : 0);
          const deep = tier === "down" ? 30 + R() * 12 : 18 + R() * 8;
          lists[tier].push([x, x + wdt, b.z1 - pad - deep, b.z1 - pad, hFront, Math.floor(R() * PAL.length)]);
          if (tier !== "down" && R() < 0.85) lists[tier].push([x, x + wdt, b.z0 + pad, b.z0 + pad + deep, 9 + R() * 26, Math.floor(R() * PAL.length)]);
          x += wdt + (R() < 0.3 ? 1.5 : 0);
        }
      }
      const d = new T.Object3D(), c = new T.Color(), out = {};
      for (const k of ["near", "far", "down"]) {
        const L = lists[k], geo = new T.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
        const im = new T.InstancedMesh(geo, k === "near" ? bldNear : k === "far" ? bldFar : bldDown, L.length);
        L.forEach((q, n) => { d.position.set((q[0] + q[1]) / 2, SW, (q[2] + q[3]) / 2); d.scale.set(q[1] - q[0], q[4], q[3] - q[2]); d.updateMatrix(); im.setMatrixAt(n, d.matrix); c.set(PAL[q[5]]).multiplyScalar(k === "down" ? 0.7 : 1); im.setColorAt(n, c); });
        im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.castShadow = k === "near"; im.receiveShadow = true;
        city.add(im); out[k] = im;
      }
      // rooftop parapets + water tanks on the near tier (silhouettes for the aerials)
      const tanks = new T.InstancedMesh(cyl(1.4, 1.4, 2.6, 12), mat("#3d3a36", { rough: 0.9 }), 40); let n = 0;
      for (const q of lists.near) { if (n >= 40 || R() < 0.6) continue; d.position.set(lerp(q[0], q[1], 0.3 + R() * 0.4), SW + q[4] + 1.3, lerp(q[2], q[3], 0.5)); d.scale.setScalar(1); d.updateMatrix(); tanks.setMatrixAt(n++, d.matrix); }
      tanks.count = n; tanks.frustumCulled = false; city.add(tanks);
      return { lists, ...out };
    }
    const BLD = buildings();

    // ---------------------------------------------------------------- streetlights: instanced poles + lenses + ground pools; 6 real lights near the bank
    const SL = [];
    for (const b of BLK) {
      if (b.x1 < -2600 || b.x0 > 700 || b.z1 < -500 || b.z0 > 560) continue;
      for (let x = b.x0 + 6; x <= b.x1 - 4; x += 28) { SL.push([x, b.z1 - 0.6, 1]); SL.push([x, b.z0 + 0.6, -1]); }   // along the avenues (arm over the road)
      if (Math.abs(b.i) <= 8) for (let z = b.z0 + 8; z <= b.z1 - 6; z += 28) { SL.push([b.x1 - 0.6, z, 2]); SL.push([b.x0 + 0.6, z, -2]); }
    }
    const nearSL = [[-9.5, 8.4, 1], [9.5, 8.4, 1], [-21, 21.6, -1], [3.5, 21.6, -1], [26, 21.6, -1], [-37, 8.4, 1]];
    const slAll = SL.filter((p) => !(Math.abs(p[0]) < 40 && Math.abs(p[1] - 15) < 8)).concat(nearSL);
    const poleH = 7.4;
    {
      const poleM = mat("#2b2d30", { rough: 0.6, metal: 0.5 });
      const pole = new T.InstancedMesh(cyl(0.07, 0.11, poleH, 8), poleM, slAll.length);
      const arm = new T.InstancedMesh(box(1.7, 0.08, 0.1), poleM, slAll.length);
      const head = new T.InstancedMesh(rbox(0.7, 0.14, 0.3, 0.06), mat("#34373b", { rough: 0.5, metal: 0.4 }), slAll.length);
      const lens = new T.InstancedMesh(box(0.56, 0.03, 0.22), glow("#ffd7a0", 9), slAll.length);
      const pool = new T.InstancedMesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ffb46a").multiplyScalar(0.22), transparent: true, depthWrite: false, blending: T.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 }), slAll.length);
      const d = new T.Object3D();
      slAll.forEach((p, k) => {
        const [x, z, side] = p, ax = Math.abs(side) === 2 ? side / 2 : 0, az = Math.abs(side) === 1 ? side : 0;   // arm reaches toward the road
        d.rotation.set(0, 0, 0); d.scale.setScalar(1);
        d.position.set(x, SW + poleH / 2, z); d.updateMatrix(); pole.setMatrixAt(k, d.matrix);
        d.position.set(x + ax * 0.8, SW + poleH - 0.1, z + az * 0.8); d.rotation.set(0, az ? Math.PI / 2 : 0, 0); d.updateMatrix(); arm.setMatrixAt(k, d.matrix);
        d.position.set(x + ax * 1.6, SW + poleH - 0.18, z + az * 1.6); d.updateMatrix(); head.setMatrixAt(k, d.matrix);
        d.position.y = SW + poleH - 0.26; d.updateMatrix(); lens.setMatrixAt(k, d.matrix);
        d.position.set(x + ax * 1.6, 0.02, z + az * 1.6); d.rotation.set(-Math.PI / 2, 0, 0); d.scale.set(14, 14, 1); d.updateMatrix(); pool.setMatrixAt(k, d.matrix);
      });
      for (const im of [pole, arm, head, lens, pool]) { im.frustumCulled = false; im.castShadow = false; city.add(im); }
      pole.castShadow = true;
    }
    const streetL = nearSL.map(([x, z, side]) => { const L = new T.PointLight("#ffc488", 0, 0, 2); L.position.set(x, SW + poleH - 0.4, z + side * 1.6); scene.add(L); return L; });
    // light cones under the near lamps (thin additive volumes, read in the haze)
    const coneM = new T.ShaderMaterial({ uniforms: { k: { value: 0.0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: "varying float vY; varying vec3 vN, vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform float k; varying float vY; varying vec3 vN, vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float a = f * pow(vY, 1.4) * k; gl_FragColor = vec4(vec3(1.0, 0.78, 0.52) * a, a); }" });
    nearSL.forEach(([x, z, side]) => { const c = M(new T.ConeGeometry(3.2, poleH - 0.3, 24, 1, true), coneM, { x, y: SW + (poleH - 0.3) / 2, z: z + side * 1.6, cast: false, receive: false, nodepth: true }, city); c.renderOrder = 4; });

    // ---------------------------------------------------------------- downtown: towers far west, fire glow, smoke, moving headlights + emergency flashes
    const down = G({});
    const fglow = [];
    for (let i = 0; i < 5; i++) { const m = M(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radial, color: new T.Color("#ff7a30").multiplyScalar(0.9), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }), { x: -2600 - i * 260, y: 60 + i * 40, z: -160 + i * 90, cast: false, receive: false, nodepth: true }, down); m.scale.setScalar(700 + i * 160); fglow.push(m); }
    const smokeT = K.noiseTex("v_smoke", 128, 33, 4, 1.6);
    const smokes = [];
    for (let i = 0; i < 3; i++) {
      const m = new T.ShaderMaterial({ uniforms: { tN: { value: smokeT }, t: { value: 0 }, k: { value: 1 }, seed: { value: i * 2.9 } }, transparent: true, depthWrite: false, side: T.DoubleSide,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `uniform sampler2D tN; uniform float t, k, seed; varying vec2 vUv;
          void main(){ float w = 0.16 + vUv.y * 0.55; float x = (vUv.x - 0.5) / w + sin(vUv.y * 5.0 + seed) * 0.25;
            float n = texture2D(tN, vec2(vUv.x * 1.3 + seed, vUv.y * 1.6 - t * 0.04)).r;
            float a = smoothstep(1.0, 0.2, abs(x)) * smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.3, 0.75, n);
            vec3 c = mix(vec3(0.5, 0.2, 0.07), vec3(0.07, 0.065, 0.075), smoothstep(0.0, 0.45, vUv.y)); gl_FragColor = vec4(c, a * 0.75 * k); }` });
      const sm = new T.Mesh(new T.PlaneGeometry(380, 1200), m); sm.position.set(-2700 - i * 280, 560, -60 + i * 70); down.add(sm); K.noDepth.push(sm); smokes.push(sm);
    }
    // traffic: headlight pairs leaving downtown along the avenue (lanes z 12.5 / 17.5), jamming as they come
    const NCAR = 90, carHL = new T.InstancedMesh(sph(0.3, 8, 6), glow("#fff1d8", 18, { fog: true }), NCAR * 2);
    const carT = { list: [] };
    { const R = rng(717); for (let i = 0; i < NCAR; i++) carT.list.push({ off: R(), lane: R() < 0.5 ? 12.4 : 17.6, sp: 9 + R() * 7, x1: -170 - R() * 60 }); }
    carHL.frustumCulled = false; carHL.castShadow = false; down.add(carHL);
    const flashR = [], flashB = [];
    for (let i = 0; i < 4; i++) { const r = M(sph(1.4, 8, 6), glow("#ff2a1a", 26), { x: -700 - i * 380, y: 2.2, z: 13 + (i % 2) * 4, cast: false }, down), b = M(sph(1.4, 8, 6), glow("#2a5aff", 26), { x: -700 - i * 380 + 3.0, y: 1.8, z: 13 + (i % 2) * 4, cast: false }, down); flashR.push(r); flashB.push(b); }
    const dmy = new T.Object3D();
    function placeTraffic(t, k) {
      carHL.visible = k > 0.01; for (const f of flashR.concat(flashB)) f.visible = k > 0.01;
      if (!carHL.visible) return;
      carT.list.forEach((c, i) => {
        // stream from x -3200 toward the camera; each car stops at the back of the jam (x1 grows with the queue)
        let x = -2400 + ((c.off * 2300 + t * c.sp) % 2300);
        const q = c.x1 - (i % 45) * 8.5; if (x > q) x = q;
        const sc = 1 + clamp((-x - 150) / 500, 0, 3);
        for (let s = 0; s < 2; s++) { dmy.position.set(x, 0.75, c.lane + (s ? 0.75 : -0.75)); dmy.scale.setScalar(sc); dmy.updateMatrix(); carHL.setMatrixAt(i * 2 + s, dmy.matrix); }
      });
      carHL.instanceMatrix.needsUpdate = true;
      flashR.forEach((f, i) => { const on = Math.sin(t * 9 + i * 1.7) > 0; f.visible = on; flashB[i].visible = !on; });
    }

    // ---------------------------------------------------------------- her car (a compact hatchback, deep teal)
    const car = G({ x: CAR[0], y: CAR[1], z: CAR[2], ry: 90 });
    {
      const paint = new T.MeshPhysicalMaterial({ color: "#1f5d63", roughness: 0.32, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 });
      const dark = mat("#141517", { rough: 0.6 }), chrome = mat("#c9ccd0", { metal: 1, rough: 0.2, env: 1.4 });
      const gls = new T.MeshPhysicalMaterial({ color: "#16202a", roughness: 0.05, metalness: 0.2, envMapIntensity: 1.8, clearcoat: 1 });
      M(rbox(1.78, 0.62, 4.0, 0.22, 6), paint, { y: 0.66 }, car);
      M(rbox(1.62, 0.62, 2.25, 0.28, 6), paint, { y: 1.18, z: -0.25 }, car);
      M(box(1.66, 0.48, 0.05), gls, { y: 1.2, z: 0.88, rx: -32 }, car);
      M(box(1.6, 0.42, 0.05), gls, { y: 1.18, z: -1.38, rx: 28 }, car);
      for (const s of [-1, 1]) M(box(0.04, 0.42, 1.9), gls, { x: s * 0.82, y: 1.2, z: -0.25 }, car);
      for (const [x, z] of [[-0.78, 1.3], [0.78, 1.3], [-0.78, -1.28], [0.78, -1.28]]) { M(cyl(0.33, 0.33, 0.24, 20), dark, { x, y: 0.33, z, rz: 90 }, car); M(cyl(0.2, 0.2, 0.25, 16), chrome, { x, y: 0.33, z, rz: 90 }, car); }
      for (const s of [-1, 1]) { M(rbox(0.32, 0.12, 0.04, 0.04), glow("#e8e2d0", 1.2), { x: s * 0.6, y: 0.78, z: 2.01, cast: false }, car); M(rbox(0.28, 0.1, 0.04, 0.04), glow("#7a0d08", 1.4), { x: s * 0.62, y: 0.86, z: -2.01, cast: false }, car); }
      M(box(1.0, 0.18, 0.03), mat("#d8d6cc", { rough: 0.5 }), { y: 0.5, z: 2.02, cast: false }, car);   // a blank plate
      M(box(1.78, 0.06, 0.06), chrome, { y: 0.38, z: 2.0 }, car); M(box(1.78, 0.06, 0.06), chrome, { y: 0.38, z: -2.0 }, car);
    }

    // ---------------------------------------------------------------- the bank: stylobate, steps, columns, entablature, pediment, facade
    const bank = G({});
    const stoneM = new T.MeshStandardMaterial({ color: "#ffffff", map: stone.col, normalMap: stone.nrm, roughness: 0.82, envMapIntensity: 0.4 });
    stoneM.normalScale.set(0.7, 0.7); stone.col.repeat.set(0.25, 0.25); stone.nrm.repeat.set(0.25, 0.25);
    const smoothM = new T.MeshStandardMaterial({ color: "#ffffff", map: stoneSmooth.col, normalMap: stoneSmooth.nrm, roughness: 0.8, envMapIntensity: 0.4 });
    smoothM.normalScale.set(0.4, 0.4); stoneSmooth.col.repeat.set(0.5, 0.5); stoneSmooth.nrm.repeat.set(0.5, 0.5);
    // world-scaled UVs for stone boxes (1 tile = 4 m)
    function sbox(w, h, d, m, p, parent, tile) {
      const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv, nr = g.attributes.normal, s = 1 / (tile || 1);
      for (let k = 0; k < uv.count; k++) { const nx = Math.abs(nr.getX(k)), ny = Math.abs(nr.getY(k)); const a = nx > 0.5 ? d : w, b = ny > 0.5 ? d : h; uv.setXY(k, uv.getX(k) * a * s, uv.getY(k) * b * s); }
      return M(g, m, p, parent);
    }
    sbox(25.2, PY - SW, 4.2, smoothM, { y: SW + (PY - SW) / 2, z: 1.5 }, bank);                                  // stylobate
    for (let i = 0; i < 8; i++) { const y0 = SW + i * 0.15; sbox(25.2 - i * 0.1, 0.15, 0.3, smoothM, { y: y0 + 0.075, z: 6.0 - i * 0.3 - 0.15 }, bank); }
    for (const s of [-1, 1]) sbox(1.0, 1.3, 2.6, smoothM, { x: s * 12.1, y: SW + 0.65, z: 4.8 }, bank);               // cheek walls
    // columns: fluted shaft (normal-mapped), torus base on a plinth, echinus + abacus capital
    const flute = K.heightNormal("v_flute", 256, (x) => Math.pow(Math.abs(Math.sin((x / 256) * Math.PI * 24)), 0.6), 3.0);
    const colM = new T.MeshStandardMaterial({ color: "#d6ccb6", map: stoneSmooth.col, normalMap: flute, roughness: 0.75, envMapIntensity: 0.45 });
    colM.normalScale.set(1.2, 1.2);
    const cols = [];
    for (const x of COLX) {
      const c = G({ x, y: PY, z: COLZ }, bank);
      sbox(1.32, 0.3, 1.32, smoothM, { y: 0.15 }, c);
      M(new T.TorusGeometry(0.53, 0.09, 10, 36), smoothM, { y: 0.38, rx: 90 }, c);
      const sh = new T.CylinderGeometry(0.43, 0.5, 8.3, 48, 6, true); sh.translate(0, 0.42 + 4.15, 0);
      const pa = sh.attributes.position; for (let k = 0; k < pa.count; k++) { const y = pa.getY(k), u = (y - 0.42) / 8.3; const e = 1 + 0.035 * Math.sin(Math.PI * clamp(u * 1.4, 0, 1)); pa.setX(k, pa.getX(k) * e); pa.setZ(k, pa.getZ(k) * e); } // entasis
      sh.computeVertexNormals();
      M(sh, colM, {}, c);
      M(new T.CylinderGeometry(0.62, 0.45, 0.32, 40), smoothM, { y: 8.72 + 0.16 }, c);
      sbox(1.36, 0.24, 1.36, smoothM, { y: 9.18 }, c);
      cols.push(c);
    }
    const ENT = 10.65 - PY;   // top of the capitals above the portico floor
    const frieze = carved("v_frieze", "BANK", 2048, 160, 120, 46), arch = carved("v_arch", "EST. 1908", 2048, 128, 64, 22);
    function texBox(w, h, d, tex, p, parent) {   // a box whose front (+z) face carries a texture pair; other faces plain stone
      const g = new T.BoxGeometry(w, h, d);
      const fm = new T.MeshStandardMaterial({ color: "#ffffff", map: tex.col, normalMap: tex.nrm, roughness: 0.8, envMapIntensity: 0.4 }); fm.normalScale.set(1.4, 1.4);
      return M(g, [smoothM, smoothM, smoothM, smoothM, fm, smoothM], p, parent);
    }
    texBox(24.6, 0.8, 1.5, arch, { y: PY + ENT + 0.4, z: 2.6 }, bank);              // architrave: EST. 1908
    texBox(24.2, 1.2, 1.3, frieze, { y: PY + ENT + 1.4, z: 2.6 }, bank);            // frieze: BANK
    sbox(25.6, 0.55, 2.1, smoothM, { y: PY + ENT + 2.275, z: 2.65 }, bank);         // cornice
    const dent = new T.InstancedMesh(box(0.16, 0.16, 0.14), smoothM, 120);
    { const d = new T.Object3D(); for (let k = 0; k < 120; k++) { d.position.set(-12.6 + k * 0.212, PY + ENT + 1.92, 3.62); d.updateMatrix(); dent.setMatrixAt(k, d.matrix); } dent.castShadow = true; bank.add(dent); }
    // pediment: a triangular prism + raking cornices
    {
      const yb = PY + ENT + 2.55, hp = 2.9, half = 12.6;
      const sh = new T.Shape(); sh.moveTo(-half, 0); sh.lineTo(half, 0); sh.lineTo(0, hp); sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: false }); g.translate(0, 0, -0.75);
      M(g, smoothM, { y: yb, z: 2.55 }, bank);
      const ti = new T.Shape(); ti.moveTo(-half + 1.3, 0.25); ti.lineTo(half - 1.3, 0.25); ti.lineTo(0, hp - 0.6); ti.closePath();
      const g2 = new T.ExtrudeGeometry(ti, { depth: 0.1, bevelEnabled: false });
      M(g2, mat("#b9ad95", { rough: 0.85 }), { y: yb, z: 2.55 + 0.72 }, bank);
      const ang = Math.atan2(hp, half), len = Math.hypot(hp, half);
      for (const s of [-1, 1]) sbox(len + 0.4, 0.34, 1.9, smoothM, { x: s * half / 2, y: yb + hp / 2 + 0.12, z: 2.6, rz: -s * ang / D2R }, bank);
      // a carved wreath in the tympanum (rings), not a logo
      M(new T.TorusGeometry(0.62, 0.11, 10, 36), smoothM, { y: yb + 1.0, z: 3.36 }, bank);
    }
    // soffit over the portico + the facade wall with openings (door x ±1.7 up to 6.75; windows at ±4.5, ±9 from 2.8 to 8.4)
    sbox(24.4, 0.4, 3.9, smoothM, { y: PY + ENT - 0.2, z: 1.35 }, bank);
    const FZ = -0.3, FD = 0.6, FY1 = PY + ENT + 0.2;
    {
      const solid = (x0, x1, y0, y1) => sbox(x1 - x0, y1 - y0, FD, stoneM, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: FZ }, bank, 4);
      const op = [[-1.7, 1.7, PY, PY + 7.2], [-5.35, -3.65, PY + 1.45, PY + 7.05], [3.65, 5.35, PY + 1.45, PY + 7.05], [-9.85, -8.15, PY + 1.45, PY + 7.05], [8.15, 9.85, PY + 1.45, PY + 7.05]];
      const xs = [-12, ...op.flatMap((o) => [o[0], o[1]]).sort((a, b) => a - b), 12];
      for (let i = 0; i < xs.length - 1; i++) {
        const x0 = xs[i], x1 = xs[i + 1], o = op.find((q) => Math.abs(q[0] - x0) < 1e-6 && Math.abs(q[1] - x1) < 1e-6);
        if (!o) { solid(x0, x1, PY, FY1); continue; }
        if (o[2] > PY) solid(x0, x1, PY, o[2]);
        solid(x0, x1, o[3], FY1);
      }
      // window grilles + glass + bronze frames
      const bronze = mat("#5a4128", { metal: 0.85, rough: 0.38, env: 1.3 });
      const glassM = new T.MeshPhysicalMaterial({ color: "#8b9aa6", roughness: 0.04, transparent: true, opacity: 0.16, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide });
      for (const o of op.slice(1)) {
        const cx = (o[0] + o[1]) / 2, w = o[1] - o[0], h = o[3] - o[2], cy = (o[2] + o[3]) / 2;
        M(new T.PlaneGeometry(w, h), glassM, { x: cx, y: cy, z: FZ - 0.12, cast: false, receive: false, nodepth: true }, bank).renderOrder = 3;
        for (let k = 1; k < 8; k++) K.rod([o[0] + (k * w) / 8, o[2], FZ + 0.12], [o[0] + (k * w) / 8, o[3], FZ + 0.12], 0.018, bronze, bank, 6);
        for (const yy of [o[2] + 0.1, cy, o[3] - 0.1]) M(box(w, 0.06, 0.05), bronze, { x: cx, y: yy, z: FZ + 0.12 }, bank);
        M(box(w + 0.3, 0.18, 0.5), smoothM, { x: cx, y: o[2] - 0.05, z: FZ + 0.2 }, bank);                       // sill
        M(box(w + 0.5, 0.3, 0.4), smoothM, { x: cx, y: o[3] + 0.2, z: FZ + 0.18 }, bank);                        // lintel
      }
      // doors: two bronze leaves with glass, a transom grille above
      const dl = [];
      for (const s of [-1, 1]) {
        const lf = G({ x: s * 1.68, y: PY, z: FZ + 0.05 }, bank);
        const fr = (w, h, x, y) => M(box(w, h, 0.09), bronze, { x, y }, lf);
        fr(0.12, 5.4, -s * 0.06, 2.7); fr(0.12, 5.4, -s * 1.62, 2.7); fr(1.68, 0.14, -s * 0.84, 0.07); fr(1.68, 0.12, -s * 0.84, 5.34); fr(1.68, 0.4, -s * 0.84, 0.55); fr(1.68, 0.08, -s * 0.84, 3.1);
        M(new T.PlaneGeometry(1.46, 4.3), glassM, { x: -s * 0.84, y: 2.95, cast: false, receive: false, nodepth: true }, lf).renderOrder = 3;
        M(box(1.2, 0.05, 0.08), mat("#b08a4c", { metal: 0.9, rough: 0.25 }), { x: -s * 0.84, y: 1.05, z: -0.1 }, lf);                // push bar inside
        dl.push(lf);
      }
      M(box(3.5, 0.15, 0.6), bronze, { y: PY + 5.48, z: FZ }, bank);
      M(new T.PlaneGeometry(3.3, 1.55), glassM, { y: PY + 6.35, z: FZ - 0.1, cast: false, receive: false, nodepth: true }, bank).renderOrder = 3;
      for (let k = 1; k < 9; k++) K.rod([-1.65 + k * 0.367, PY + 5.55, FZ + 0.05], [-1.65 + k * 0.367, PY + 7.15, FZ + 0.05], 0.02, bronze, bank, 6);
      // brass address-free plaque beside the door, two bronze lanterns
      for (const s of [-1, 1]) { const l = G({ x: s * 2.95, y: PY + 3.3, z: 0.15 }, bank); M(box(0.06, 0.6, 0.06), bronze, { y: 0.3 }, l); M(cyl(0.16, 0.12, 0.42, 8), bronze, { y: 0.0 }, l); M(cyl(0.12, 0.1, 0.32, 8), glow("#ffcf8a", 4), { y: 0.0, cast: false }, l); }
    }
    // the rest of the building: side + back walls, roof with a skylight well, parapet
    const outerM = stoneM;
    sbox(0.6, 9.3 - SW + 0.2, 34, outerM, { x: -11.7, y: SW + (9.3 - SW + 0.2) / 2, z: -17.3 }, bank, 4);
    sbox(0.6, 9.3 - SW + 0.2, 34, outerM, { x: 11.7, y: SW + (9.3 - SW + 0.2) / 2, z: -17.3 }, bank, 4);
    sbox(24, 9.4, 0.6, outerM, { y: SW + 4.7, z: -34.3 }, bank, 4);
    sbox(24, PY - SW, 34, smoothM, { y: SW + (PY - SW) / 2, z: -17.3 }, bank);                                   // floor slab under the lobby + vault
    // roof (0.4 thick at y 9.5) with the skylight opening x -4..4, z -20..-12
    const ROOF = 9.5, SKY = { x0: -4, x1: 4, z0: -20.5, z1: -12.5 };
    const roofM = mat("#3b3a38", { rough: 0.9 });
    const rp = (x0, x1, z0, z1) => M(box(x1 - x0, 0.4, z1 - z0), roofM, { x: (x0 + x1) / 2, y: ROOF + 0.2, z: (z0 + z1) / 2 }, bank);
    rp(-12, 12, -34.6, SKY.z0); rp(-12, 12, SKY.z1, -0.6); rp(-12, SKY.x0, SKY.z0, SKY.z1); rp(SKY.x1, 12, SKY.z0, SKY.z1);
    sbox(24.2, 1.3, 0.4, smoothM, { y: ROOF + 0.85, z: -34.4 }, bank); for (const s of [-1, 1]) sbox(0.4, 1.3, 34, smoothM, { x: s * 11.9, y: ROOF + 0.85, z: -17.4 }, bank);
    // ceiling inside (coffered plaster) below the roof, skylight glass + bronze grid
    const plaster = mat("#e6dccb", { rough: 0.9 });
    const ceil = (x0, x1, z0, z1) => M(box(x1 - x0, 0.06, z1 - z0), plaster, { x: (x0 + x1) / 2, y: ROOF - 0.03, z: (z0 + z1) / 2 }, bank);
    ceil(LOB.x0, LOB.x1, LOB.z0, SKY.z0); ceil(LOB.x0, LOB.x1, SKY.z1, LOB.z1); ceil(LOB.x0, SKY.x0, SKY.z0, SKY.z1); ceil(SKY.x1, LOB.x1, SKY.z0, SKY.z1);
    {
      const bronze = mat("#5a4128", { metal: 0.85, rough: 0.4 });
      const sg = new T.MeshPhysicalMaterial({ color: "#c3d0dc", roughness: 0.1, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.2 });
      M(new T.PlaneGeometry(SKY.x1 - SKY.x0, SKY.z1 - SKY.z0), sg, { rx: -90, y: ROOF + 0.35, z: (SKY.z0 + SKY.z1) / 2, cast: false, receive: false, nodepth: true }, bank).renderOrder = 3;
      for (let x = SKY.x0; x <= SKY.x1 + 1e-6; x += 1) M(box(0.06, 0.14, SKY.z1 - SKY.z0), bronze, { x, y: ROOF + 0.3, z: (SKY.z0 + SKY.z1) / 2 }, bank);
      for (let z = SKY.z0; z <= SKY.z1 + 1e-6; z += 1) M(box(SKY.x1 - SKY.x0, 0.14, 0.06), bronze, { y: ROOF + 0.3, z }, bank);
      for (const s of [-1, 1]) { M(box(0.2, 0.5, SKY.z1 - SKY.z0 + 0.2), plaster, { x: s === -1 ? SKY.x0 - 0.1 : SKY.x1 + 0.1, y: ROOF + 0.05, z: (SKY.z0 + SKY.z1) / 2 }, bank); M(box(SKY.x1 - SKY.x0 + 0.4, 0.5, 0.2), plaster, { y: ROOF + 0.05, z: s === -1 ? SKY.z0 - 0.1 : SKY.z1 + 0.1 }, bank); }
    }

    // ---------------------------------------------------------------- lobby: marble floor, interior columns, back wall with the vault opening
    const floorT = K.canvasTex("v_floor", 1024, 1024, (g, w, h) => {
      const tile = w / 4;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#2b3a33" : "#ddd3c1"; g.fillRect(i * tile, j * tile, tile, tile); }
      const R = rng(55);
      for (let k = 0; k < 40; k++) { g.strokeStyle = k % 2 ? "rgba(120,110,95,0.35)" : "rgba(220,230,220,0.18)"; g.lineWidth = 0.7 + R() * 1.6; let x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 30; q++) { x += (R() - 0.35) * 30; y += (R() - 0.5) * 24; g.lineTo(x, y); } g.stroke(); }
      g.fillStyle = "rgba(20,18,16,0.6)"; for (let i = 0; i <= 4; i++) { g.fillRect(i * tile - 1, 0, 2, h); g.fillRect(0, i * tile - 1, w, 2); }
    }, { repeat: true });
    floorT.repeat.set(23 / 4.8, 21.4 / 4.8);
    const floorM = new T.MeshPhysicalMaterial({ map: floorT, roughness: 0.14, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 0.7 });
    M(new T.PlaneGeometry(LOB.x1 - LOB.x0, LOB.z1 - LOB.z0), floorM, { rx: -90, y: PY + 0.002, z: (LOB.z0 + LOB.z1) / 2, cast: false }, bank);
    const marbW = marble("v_marbW", "#e8e1d3", ["#9c958a", "#b8ad9c", "#7d776e"], 7), marbG = marble("v_marbG", "#26332d", ["#7f9184", "#41564b", "#c9d2c8"], 8);
    const mW = new T.MeshPhysicalMaterial({ map: marbW, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.12, envMapIntensity: 0.6 });
    const mG = new T.MeshPhysicalMaterial({ map: marbG, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.12, envMapIntensity: 0.6 });
    const gold = mat("#b8924c", { metal: 0.9, rough: 0.3, env: 1.2 });
    for (const x of [-5.2, 5.2]) for (const z of [-4.8, -9.8, -14.8, -19.2]) {
      M(cyl(0.42, 0.42, ROOF - PY - 0.8, 28), mW, { x, y: PY + 0.4 + (ROOF - PY - 0.8) / 2, z }, bank);
      M(box(1.0, 0.4, 1.0), mG, { x, y: PY + 0.2, z }, bank); M(cyl(0.6, 0.44, 0.45, 28), gold, { x, y: ROOF - 0.62, z }, bank);
    }
    // inner faces of the walls: warm plaster with a green-marble dado
    const wallIn = mat("#d9cfbd", { rough: 0.85 });
    for (const s of [-1, 1]) { M(box(0.05, ROOF - PY, LOB.z1 - LOB.z0), wallIn, { x: s * (LOB.x1 - 0.02), y: (PY + ROOF) / 2, z: (LOB.z0 + LOB.z1) / 2 }, bank); M(box(0.08, 1.2, LOB.z1 - LOB.z0), mG, { x: s * (LOB.x1 - 0.06), y: PY + 0.6, z: (LOB.z0 + LOB.z1) / 2 }, bank); }
    M(box(LOB.x1 - LOB.x0, ROOF - PY, 0.05), wallIn, { y: (PY + ROOF) / 2, z: LOB.z1 - 0.32 }, bank).visible = false;   // (front inner face is the facade)
    // back wall: 0.92 m of reinforced concrete faced with marble, a round opening for the door
    {
      const sh = new T.Shape(); sh.moveTo(LOB.x0, PY); sh.lineTo(LOB.x1, PY); sh.lineTo(LOB.x1, ROOF); sh.lineTo(LOB.x0, ROOF); sh.closePath();
      const hole = new T.Path(); hole.absarc(VDC[0], VDC[1], VR + 0.02, 0, Math.PI * 2, true); sh.holes.push(hole);
      const g = new T.ExtrudeGeometry(sh, { depth: VTH, bevelEnabled: false, curveSegments: 64 });
      const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) / 4.8, uv.getY(k) / 4.8);
      M(g, [mW, mat("#6c6a66", { rough: 0.7, metal: 0.3 })], { z: LOB.z0 - VTH }, bank);
      // steel frame ring around the opening + bolt receivers
      M(new T.TorusGeometry(VR + 0.44, 0.12, 16, 72), mat("#8e959c", { metal: 0.9, rough: 0.3, env: 1.3 }), { x: VDC[0], y: VDC[1], z: LOB.z0 + 0.05 }, bank);
      // a small brass sign over the door (no name)
      M(box(2.2, 0.36, 0.04), gold, { y: VDC[1] + VR + 0.75, z: LOB.z0 + 0.03 }, bank);
    }

    // ---------------------------------------------------------------- teller counters (left), velvet ropes, security desk + CCTV wall (right)
    const wood = mat("#4a2a18", { rough: 0.5, env: 0.6 });
    const brass = mat("#b08a4c", { metal: 0.9, rough: 0.28, env: 1.2 });
    {
      const cnt = G({ x: -8.4, y: PY, z: -11.0 }, bank);
      M(box(1.0, 1.08, 15.0), wood, { y: 0.54 }, cnt);
      M(box(1.15, 0.06, 15.2), mG, { y: 1.11 }, cnt);
      for (let k = 0; k <= 30; k++) K.rod([0.1, 1.14, -7.5 + k * 0.5], [0.1, 2.35, -7.5 + k * 0.5], 0.012, brass, cnt, 6);
      M(box(0.06, 0.08, 15.0), brass, { x: 0.1, y: 2.38 }, cnt);
      for (let k = 0; k < 4; k++) {
        M(box(0.12, 1.25, 0.08), wood, { x: 0.1, y: 1.75, z: -6 + k * 4 }, cnt);
        const lm = G({ x: -0.25, y: 1.14, z: -5 + k * 4 }, cnt);
        M(cyl(0.06, 0.07, 0.03, 16), brass, { y: 0.015 }, lm); K.rod([0, 0.02, 0], [0, 0.28, 0], 0.008, brass, lm, 6);
        M(new T.CylinderGeometry(0.06, 0.14, 0.12, 16, 1, true), mat("#1e5b3a", { rough: 0.3, side: T.DoubleSide }), { y: 0.33, rz: 90 }, lm);
        M(cyl(0.02, 0.02, 0.2, 8), glow("#ffe2a8", 3), { y: 0.31, rz: 90, cast: false }, lm);
      }
    }
    for (const [x0, z0, x1, z1] of [[-2.6, -6.5, -2.6, -14.5], [2.6, -6.5, 2.6, -14.5]]) {
      const n = 4;
      for (let k = 0; k <= n; k++) { const z = lerp(z0, z1, k / n); M(cyl(0.04, 0.04, 0.95, 12), brass, { x: x0, y: PY + 0.475, z }, bank); M(sph(0.06, 12, 8), brass, { x: x0, y: PY + 0.98, z }, bank); M(cyl(0.16, 0.18, 0.04, 16), brass, { x: x0, y: PY + 0.02, z }, bank); }
      for (let k = 0; k < n; k++) { const za = lerp(z0, z1, k / n), zb = lerp(z0, z1, (k + 1) / n); const pts = []; for (let q = 0; q <= 10; q++) { const u = q / 10; pts.push(new T.Vector3(x0, PY + 0.9 - Math.sin(Math.PI * u) * 0.18, lerp(za, zb, u))); } M(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.025, 6), mat("#7a1420", { rough: 0.6 }), {}, bank); }
    }
    // security desk: facing the entrance, a CCTV wall on a rack behind her
    const DESK = { x: 7.6, z: -3.4 };
    const desk = G({ x: DESK.x, y: PY, z: DESK.z }, bank);
    // a low desk (a raised counter would hide her chest radio from the front)
    M(box(2.6, 0.7, 0.08), wood, { y: 0.37, z: 0.3 }, desk);                       // modesty panel facing the entrance
    M(box(2.75, 0.05, 1.0), mat("#22382c", { rough: 0.72 }), { y: 0.745, z: -0.12 }, desk);   // leather-topped desk
    M(box(2.8, 0.035, 1.05), wood, { y: 0.71, z: -0.12 }, desk);
    M(box(0.06, 0.72, 0.95), wood, { x: -1.3, y: 0.36, z: -0.12 }, desk); M(box(0.06, 0.72, 0.95), wood, { x: 1.3, y: 0.36, z: -0.12 }, desk);
    const bl = G({ x: -1.08, y: 0.77, z: -0.36 }, desk);                         // banker's lamp
    M(box(0.18, 0.025, 0.1), brass, { y: 0.012 }, bl); K.rod([0, 0.02, 0], [0, 0.32, 0], 0.01, brass, bl, 6);
    M(new T.CylinderGeometry(0.06, 0.12, 0.09, 20, 1, true, 0, Math.PI), mat("#1d6a3e", { rough: 0.25, side: T.DoubleSide, env: 1.2 }), { y: 0.36, z: 0.0, rx: 90, ry: 0 }, bl);
    const deskBulb = M(cyl(0.022, 0.022, 0.2, 10), glow("#ffdcaa", 6), { y: 0.33, rz: 90, cast: false }, bl);
    const deskL = new T.PointLight("#ffcf9c", 0, 0, 2); deskL.position.set(0, 0.3, 0.08); bl.add(deskL);
    deskL.castShadow = true; deskL.shadow.mapSize.set(512, 512); deskL.shadow.camera.near = 0.05; deskL.shadow.camera.far = 9; deskL.shadow.bias = -0.003; deskL.shadow.radius = 3;
    const logT = K.textTex("v_logbook", 256, 160, (q, w, h) => { q.fillStyle = "#efe7d3"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,80,140,0.35)"; for (let y = 22; y < h; y += 13) q.fillRect(8, y, w - 16, 1); q.fillStyle = "rgba(40,40,60,0.8)"; q.font = "500 11px KitInter, sans-serif"; ["22:00  lobby walk  ok", "22:30  cameras  ok", "23:00  vault  SEALED", "23:30  lobby walk  ok"].forEach((s, i) => q.fillText(s, 12, 32 + i * 13)); q.fillStyle = "rgba(0,0,0,0.25)"; q.fillRect(w / 2 - 1, 0, 2, h); });
    M(box(0.36, 0.012, 0.25), mat("#ffffff", { map: logT, rough: 0.9 }), { x: 0.05, y: 0.777, z: -0.3, ry: -8 }, desk);
    const mug = G({ x: 0.55, y: 0.77, z: -0.25 }, desk); M(cyl(0.035, 0.032, 0.09, 16), mat("#2d4a7a", { rough: 0.45 }), { y: 0.045 }, mug); M(new T.TorusGeometry(0.022, 0.006, 6, 14), mat("#2d4a7a", { rough: 0.45 }), { x: 0.04, y: 0.05 }, mug);
    const chair = G({ x: DESK.x, y: PY, z: DESK.z - 1.1 }, bank);
    M(cyl(0.26, 0.26, 0.08, 18), mat("#1c1c1e", { rough: 0.5 }), { y: 0.5 }, chair); M(cyl(0.03, 0.03, 0.45, 8), mat("#888", { metal: 0.8, rough: 0.3 }), { y: 0.26 }, chair);
    M(rbox(0.44, 0.5, 0.07, 0.05), mat("#1c1c1e", { rough: 0.5 }), { y: 0.86, z: -0.24 }, chair);
    // CCTV wall: 3 x 2 monitors on a dark rack (canvas redrawn each frame from st.cctv)
    const CW = 768, CH = 384;
    const cctvCv = cv(CW, CH), cctvT = new T.CanvasTexture(cctvCv); cctvT.colorSpace = T.SRGBColorSpace; cctvT.anisotropy = 8;
    const rack = G({ x: DESK.x, y: PY, z: DESK.z - 2.05 }, bank);
    M(box(2.5, 2.3, 0.4), mat("#17181b", { rough: 0.6, metal: 0.3 }), { y: 1.15 }, rack);
    const scr = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const g = new T.PlaneGeometry(0.74, 0.5), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (c + uv.getX(k)) / 3, (1 - r - 1 + uv.getY(k) + 1) / 2 * 1);
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k), (uv.getY(k) - 0) * 1);
      const m = M(box(0.8, 0.56, 0.08), mat("#0d0e10", { rough: 0.4 }), { x: -0.82 + c * 0.82, y: 1.6 - r * 0.6 + 0.0, z: 0.22 }, rack);
      const s = M(g, new T.MeshBasicMaterial({ map: cctvT, color: new T.Color(1, 1, 1) }), { x: -0.82 + c * 0.82, y: 1.6 - r * 0.6, z: 0.265, cast: false }, rack);
      // UVs: each screen samples its own third/half of the canvas
      const u0 = c / 3, u1 = (c + 1) / 3, v0 = r === 0 ? 0.5 : 0, v1 = r === 0 ? 1 : 0.5;
      const a = s.geometry.attributes.uv; a.setXY(0, u0, v1); a.setXY(1, u1, v1); a.setXY(2, u0, v0); a.setXY(3, u1, v0); a.needsUpdate = true;
      scr.push(s);
    }
    const monL = new T.PointLight("#9fc4ff", 0, 0, 2); monL.position.set(0, 1.6, 0.42); rack.add(monL);
    let cctvKey = "";
    function drawCCTV(st) {
      const c = st.cctv || {}; const key = (c.clock || 0).toFixed(1) + "|" + (c.run || 0).toFixed(2) + "|" + (c.red || 0).toFixed(2);
      if (key === cctvKey) return; cctvKey = key;
      const g = cctvCv.getContext("2d"), cw = CW / 3, ch = CH / 2;
      const sec = Math.floor(c.clock || 0), hh = Math.floor(sec / 3600) % 24, mm = Math.floor(sec / 60) % 60, s2 = sec % 60;
      const stamp = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(s2).padStart(2, "0")}`;
      const view = (i, fn) => { const x = (i % 3) * cw, y = Math.floor(i / 3) * ch; g.save(); g.beginPath(); g.rect(x, y, cw, ch); g.clip(); g.translate(x, y); g.fillStyle = "#1a1d1f"; g.fillRect(0, 0, cw, ch); fn(g, cw, ch); g.fillStyle = "rgba(255,255,255,0.05)"; for (let k = 0; k < ch; k += 3) g.fillRect(0, k, cw, 1); g.fillStyle = "#e8f0e8"; g.font = "600 13px KitInter, monospace"; g.fillText(`CAM ${i + 1}`, 8, 18); g.fillText(stamp, cw - 70, ch - 9); g.restore(); };
      const grad = (gg, x0, y0, x1, y1, a, b) => { const gr = gg.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
      view(0, (q, w, h) => { q.fillStyle = grad(q, 0, 0, 0, h, "#2c3134", "#5a6064"); q.fillRect(0, 0, w, h); q.strokeStyle = "#7d8488"; q.lineWidth = 2; q.beginPath(); q.moveTo(0, h); q.lineTo(w * 0.42, h * 0.45); q.lineTo(w * 0.58, h * 0.45); q.lineTo(w, h); q.stroke(); for (let k = 0; k < 4; k++) { q.fillStyle = "#8e9599"; q.fillRect(w * (0.15 + k * 0.22), h * 0.2, 6, h * 0.6); } });   // lobby
      view(1, (q, w, h) => { q.fillStyle = "#33383b"; q.fillRect(0, 0, w, h); q.strokeStyle = "#a9b0b4"; q.lineWidth = 3; q.beginPath(); q.arc(w / 2, h / 2, h * 0.36, 0, 7); q.stroke(); q.beginPath(); q.arc(w / 2, h / 2, h * 0.1, 0, 7); q.stroke(); for (let k = 0; k < 5; k++) { const a = k * 1.2566; q.beginPath(); q.moveTo(w / 2, h / 2); q.lineTo(w / 2 + Math.cos(a) * h * 0.22, h / 2 + Math.sin(a) * h * 0.22); q.stroke(); } });  // vault door
      view(2, (q, w, h) => {   // street: the avenue, a streetlight, and (st.cctv.run) a running blur
        q.fillStyle = grad(q, 0, 0, 0, h, "#202426", "#454b4e"); q.fillRect(0, 0, w, h);
        q.fillStyle = "#5d6468"; q.beginPath(); q.moveTo(0, h); q.lineTo(w * 0.35, h * 0.5); q.lineTo(w * 0.65, h * 0.5); q.lineTo(w, h); q.fill();
        q.fillStyle = "#c9cfd2"; q.beginPath(); q.arc(w * 0.78, h * 0.25, 7, 0, 7); q.fill(); q.fillStyle = "#6d7477"; q.fillRect(w * 0.78 - 1, h * 0.25, 3, h * 0.45);
        const r = c.run || 0;
        if (r > 0) { q.save(); q.filter = "blur(5px)"; q.fillStyle = "rgba(20,20,22,0.85)"; for (let k = 0; k < 3; k++) { const x = w * (-0.1 + r * 1.25) - k * 22; q.globalAlpha = 0.9 - k * 0.28; q.beginPath(); q.ellipse(x, h * 0.62, 14, 34, 0.15, 0, 7); q.fill(); } q.restore(); q.globalAlpha = 1; }
      });
      view(3, (q, w, h) => { q.fillStyle = "#2e3336"; q.fillRect(0, 0, w, h); q.fillStyle = "#5c6367"; q.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.8); q.strokeStyle = "#9aa1a5"; q.lineWidth = 2; q.strokeRect(w * 0.3, h * 0.2, w * 0.4, h * 0.8); q.beginPath(); q.moveTo(w * 0.5, h * 0.2); q.lineTo(w * 0.5, h); q.stroke(); });  // front doors
      view(4, (q, w, h) => { q.fillStyle = grad(q, 0, 0, w, 0, "#2a2f31", "#3d4346"); q.fillRect(0, 0, w, h); for (let k = 0; k < 6; k++) { q.fillStyle = "#596064"; q.fillRect(k * w / 6 + 6, h * 0.35, w / 6 - 12, h * 0.4); } });   // teller line
      view(5, (q, w, h) => { q.fillStyle = "#24282a"; q.fillRect(0, 0, w, h); q.strokeStyle = "#7f868a"; q.lineWidth = 2; for (let k = 0; k < 7; k++) { q.beginPath(); q.moveTo(0, h * 0.3 + k * 18); q.lineTo(w, h * 0.3 + k * 18); q.stroke(); } });      // back corridor
      if (c.red) { g.fillStyle = `rgba(255,40,30,${0.25 * c.red})`; g.fillRect(cw * 2, 0, cw, ch); g.fillStyle = `rgba(255,60,40,${c.red})`; g.beginPath(); g.arc(cw * 2 + 16, ch - 16, 6, 0, 7); g.fill(); }
      cctvT.needsUpdate = true;
    }
    // lobby practicals: two wall sconces, an EXIT sign, a night light by the counters
    const sconces = [];
    const vdL = [];
    for (const s of [-1, 1]) { const x = s * 2.75, y = VDC[1] + 0.9, z = LOB.z0 + 0.12; M(cyl(0.14, 0.09, 0.34, 12), gold, { x, y, z }, bank); M(cyl(0.1, 0.1, 0.24, 12), glow("#ffd7a2", 1.6), { x, y: y + 0.02, z: z + 0.02, cast: false }, bank); const L = new T.PointLight("#ffc890", 0, 0, 2); L.position.set(x, y, z + 0.35); scene.add(L); vdL.push(L); }
    for (const [x, z] of [[-11.25, -6], [11.25, -12]]) { const b = M(sph(0.12, 12, 8), glow("#ffd09a", 5), { x, y: PY + 3.0, z, cast: false }, bank); M(cyl(0.16, 0.1, 0.3, 12), gold, { x, y: PY + 2.82, z }, bank); const L = new T.PointLight("#ffbf80", 0, 0, 2); L.position.set(x * 0.97, PY + 3.0, z); scene.add(L); sconces.push(L); }
    const exitT = K.textTex("v_exit", 128, 48, (q, w, h) => { q.fillStyle = "#0f3a1e"; q.fillRect(0, 0, w, h); q.fillStyle = "#5dff8f"; q.font = "700 34px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("EXIT", w / 2, 37); });
    M(new T.PlaneGeometry(0.5, 0.19), new T.MeshBasicMaterial({ map: exitT, color: new T.Color(2.2, 2.2, 2.2) }), { x: 3.0, y: PY + 6.0, z: -0.62, ry: 180, cast: false }, bank);

    // ---------------------------------------------------------------- the vault door (pivot on the left hinge, opens toward the lobby)
    const steel = new T.MeshPhysicalMaterial({ color: "#c9ced3", map: engine, metalness: 0.45, roughness: 0.34, envMapIntensity: 1.4, clearcoat: 0.35, clearcoatRoughness: 0.18 });
    const steelEdge = mat("#aeb4ba", { metal: 0.45, rough: 0.36, env: 1.3, map: brushed });
    const chromeM = mat("#dfe3e6", { metal: 1, rough: 0.12, env: 1.6 });
    const HX = VDC[0] - VR - 0.32, HZ = LOB.z0 + 0.25;                            // hinge axis
    const door = G({ x: HX, y: VDC[1], z: HZ });
    const dbody = G({ x: VDC[0] - HX, y: 0, z: LOB.z0 - HZ }, door);            // door centre, front face at local z 0
    {
      const plug = new T.CylinderGeometry(VR - 0.02, VR - 0.06, VTH, 96, 1, false); plug.rotateX(Math.PI / 2); plug.translate(0, 0, -VTH / 2 - 0.02);
      M(plug, [steelEdge, steel, steel], {}, dbody);
      const lip = new T.CylinderGeometry(VR + 0.26, VR + 0.26, 0.2, 96); lip.rotateX(Math.PI / 2); lip.translate(0, 0, 0.1);
      M(lip, [steelEdge, steel, steel], {}, dbody);
      M(new T.TorusGeometry(VR + 0.06, 0.035, 10, 96), gold, { z: 0.205 }, dbody);
      M(new T.TorusGeometry(0.62, 0.03, 10, 64), chromeM, { z: 0.205 }, dbody);
      // 5-spoke wheel at the centre
      const wheel = G({ z: 0.24 }, dbody);
      M(cyl(0.16, 0.18, 0.16, 32), chromeM, { rx: 90, z: 0.06 }, wheel);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; K.rod([0, 0, 0.1], [Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0.16], 0.03, chromeM, wheel, 10); M(sph(0.065, 16, 12), chromeM, { x: Math.cos(a) * 0.6, y: Math.sin(a) * 0.6, z: 0.17 }, wheel); }
      // combination dial above, plate below
      const dialT = K.textTex("v_dial", 256, 256, (q, w, h) => { q.fillStyle = "#121314"; q.beginPath(); q.arc(w / 2, h / 2, w / 2, 0, 7); q.fill(); q.fillStyle = "#e8e2d2"; q.font = "600 16px KitInter, sans-serif"; q.textAlign = "center"; for (let k = 0; k < 100; k += 2) { const a = (k / 100) * Math.PI * 2 - Math.PI / 2; const r1 = k % 10 ? 108 : 100; q.fillRect(w / 2 + Math.cos(a) * r1 - 1, h / 2 + Math.sin(a) * r1 - 1, 3, 3); if (k % 10 === 0) q.fillText(String(k), w / 2 + Math.cos(a) * 82, h / 2 + Math.sin(a) * 82 + 6); } });
      M(cyl(0.22, 0.24, 0.08, 48), mat("#1a1b1c", { rough: 0.3, metal: 0.5 }), { rx: 90, y: 0.92, z: 0.24 }, dbody);
      M(new T.CircleGeometry(0.21, 48), mat("#ffffff", { map: dialT, rough: 0.35 }), { y: 0.92, z: 0.282, cast: false }, dbody);
      const plateT = K.textTex("v_plate", 1024, 256, (q, w, h) => {
        const gr = q.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#d9b46a"); gr.addColorStop(0.5, "#b88f45"); gr.addColorStop(1, "#d2aa5e"); q.fillStyle = gr; q.fillRect(0, 0, w, h);
        q.strokeStyle = "#5a3f18"; q.lineWidth = 8; q.strokeRect(14, 14, w - 28, h - 28);
        q.fillStyle = "#3c2a0e"; q.textAlign = "center"; q.font = "700 92px KitOswald, sans-serif"; q.fillText("AIRTIGHT SEAL", w / 2, 128); q.font = "600 64px KitOswald, sans-serif"; q.fillText("CLASS 3", w / 2, 210);
        for (const [x, y] of [[40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40]]) { q.fillStyle = "#6b4c1e"; q.beginPath(); q.arc(x, y, 10, 0, 7); q.fill(); }
      });
      const plate = M(box(0.86, 0.215, 0.02), [gold, gold, gold, gold, mat("#ffffff", { map: plateT, metal: 0.65, rough: 0.32, env: 1.2 }), gold], { y: -0.93, z: 0.215 }, dbody);
      // locking bolts round the edge (throw = boltK)
      const bolts = [];
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const b = G({ rz: a / D2R }, dbody); const bm = M(cyl(0.065, 0.065, 0.32, 18), chromeM, { x: VR - 0.1, y: 0, z: -0.42, rz: 90 }, b); bolts.push(bm); }
      // inside face: glass cover over the boltwork bars + the time lock (three movements) with its card
      const back = G({ z: -VTH - 0.02 }, dbody); back.rotation.y = Math.PI;              // local +z now faces into the vault
      M(new T.CircleGeometry(VR - 0.08, 72), mat("#7b8288", { metal: 0.8, rough: 0.4, map: brushed }), { z: 0.005, cast: false }, back);
      const bars = [];
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; const g = G({ rz: a / D2R }, back); const bar = M(box(0.9, 0.09, 0.05), mat("#b9bfc4", { metal: 0.95, rough: 0.22 }), { x: 0.55, z: 0.04 }, g); bars.push(bar); }
      M(cyl(0.14, 0.14, 0.08, 32), mat("#53595f", { metal: 0.9, rough: 0.3 }), { rx: 90, z: 0.05 }, back);
      const tl = G({ x: 0, y: 0.62, z: 0.02 }, back);
      M(rbox(0.86, 0.42, 0.14, 0.03), mat("#2a2c2e", { metal: 0.6, rough: 0.35 }), { z: 0.07 }, tl);
      const faceT = K.textTex("v_tlface", 256, 256, (q, w, h) => { q.fillStyle = "#f0ead8"; q.beginPath(); q.arc(w / 2, h / 2, w / 2 - 4, 0, 7); q.fill(); q.strokeStyle = "#2a2622"; q.lineWidth = 6; q.stroke(); q.fillStyle = "#2a2622"; q.font = "700 30px KitOswald, sans-serif"; q.textAlign = "center"; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 - Math.PI / 2; q.fillText(String(k === 0 ? 72 : k * 6), w / 2 + Math.cos(a) * 92, h / 2 + Math.sin(a) * 92 + 10); } q.font = "600 18px KitInter, sans-serif"; q.fillText("HOURS", w / 2, h / 2 + 46); });
      const hands = [];
      for (let k = 0; k < 3; k++) {
        const x = -0.28 + k * 0.28;
        M(new T.CircleGeometry(0.11, 40), mat("#ffffff", { map: faceT, rough: 0.5 }), { x, z: 0.162, cast: false }, tl);
        M(new T.TorusGeometry(0.115, 0.012, 8, 40), gold, { x, z: 0.162 }, tl);
        const hd = G({ x, z: 0.168 }, tl); M(box(0.012, 0.085, 0.004), mat("#141414"), { y: 0.036 }, hd); hands.push(hd);
      }
      const cardT = K.textTex("v_tlcard", 512, 128, (q, w, h) => { q.fillStyle = "#f6f1e1"; q.fillRect(0, 0, w, h); q.strokeStyle = "#b8321e"; q.lineWidth = 6; q.strokeRect(6, 6, w - 12, h - 12); q.fillStyle = "#1c1a16"; q.font = "700 60px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("OPENS MON 08:00", w / 2, 86); });
      M(new T.PlaneGeometry(0.62, 0.155), mat("#ffffff", { map: cardT, rough: 0.6 }), { y: -0.31, z: 0.03, cast: false }, tl);
      M(new T.PlaneGeometry(0.88, 0.44), new T.MeshPhysicalMaterial({ color: "#c8d4dc", roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false }), { z: 0.18, cast: false, receive: false, nodepth: true }, tl).renderOrder = 3;
      M(rbox(0.16, 0.34, 0.12, 0.04), chromeM, { x: -0.95, y: -0.2, z: 0.1 }, back);   // inside pull handle
      // the hinge arm
      M(box(0.36, 0.7, 0.3), steelEdge, { x: -(VDC[0] - HX) + 0.05, y: 0.55, z: 0.12 }, dbody); M(box(0.36, 0.7, 0.3), steelEdge, { x: -(VDC[0] - HX) + 0.05, y: -0.55, z: 0.12 }, dbody);
      M(cyl(0.12, 0.12, 2.0, 24), chromeM, {}, door);
      Object.assign(door.userData, { wheel, bolts, bars, hands, plate, tl, body: dbody });
    }

    // ---------------------------------------------------------------- the vault: deposit-box walls, steel floor, ceiling cage light, vent + sticker, supplies
    const boxT = K.textTex("v_boxes", 1024, 1024, (q, w, h) => {
      q.fillStyle = "#3a3d40"; q.fillRect(0, 0, w, h);
      const cols = 8, rows = [10, 10, 10, 10, 6, 6, 4]; let y = 0, n = 101;
      const cw = w / cols;
      for (const rr of rows) { const rh = (h * (rr === 10 ? 0.105 : rr === 6 ? 0.155 : 0.2)); for (let c = 0; c < cols; c++) {
          const x = c * cw; const gr = q.createLinearGradient(x, y, x + cw, y + rh); gr.addColorStop(0, "#b8a06a"); gr.addColorStop(0.5, "#9c8350"); gr.addColorStop(1, "#c2aa74"); q.fillStyle = gr; q.fillRect(x + 4, y + 4, cw - 8, rh - 8);
          q.strokeStyle = "rgba(40,30,12,0.7)"; q.lineWidth = 3; q.strokeRect(x + 4, y + 4, cw - 8, rh - 8);
          q.fillStyle = "#2a2010"; q.beginPath(); q.arc(x + cw * 0.38, y + rh * 0.55, 5, 0, 7); q.fill(); q.beginPath(); q.arc(x + cw * 0.62, y + rh * 0.55, 5, 0, 7); q.fill();
          q.fillStyle = "#f2ead6"; q.fillRect(x + cw / 2 - 18, y + 10, 36, 18); q.fillStyle = "#2a2010"; q.font = "700 14px KitInter, sans-serif"; q.textAlign = "center"; q.fillText(String(n++), x + cw / 2, y + 24);
        } y += rh; }
    });
    const boxN = K.heightNormal("v_boxesN", 256, (x, y) => { const cx = (x % 32) / 32, ry = y / 256; const rh = [0.105, 0.105, 0.105, 0.105, 0.155, 0.155, 0.2]; let acc = 0, fy = 0; for (const r of rh) { if (ry < acc + r) { fy = (ry - acc) / r; break; } acc += r; } const e = Math.min(cx, 1 - cx, fy, 1 - fy); return e < 0.06 ? 0 : 1; }, 4.0);
    const boxM = new T.MeshStandardMaterial({ map: boxT, normalMap: boxN, metalness: 0.7, roughness: 0.38, envMapIntensity: 0.9 });
    boxM.normalScale.set(1.2, 1.2);
    const vy0 = PY, vy1 = VLT.y1, vw = VLT.x1 - VLT.x0, vd = VLT.z1 - VLT.z0;
    const vg = G({});
    const wallPlane = (w, h, p, rep) => { const g = new T.PlaneGeometry(w, h), uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * rep, uv.getY(k)); const t = M(g, boxM, p, vg); return t; };
    boxT.wrapS = T.RepeatWrapping; boxN.wrapS = T.RepeatWrapping;
    wallPlane(vd, vy1 - vy0, { x: VLT.x0 + 0.01, y: (vy0 + vy1) / 2, z: (VLT.z0 + VLT.z1) / 2, ry: 90 }, vd / 2.0);
    wallPlane(vd, vy1 - vy0, { x: VLT.x1 - 0.01, y: (vy0 + vy1) / 2, z: (VLT.z0 + VLT.z1) / 2, ry: -90 }, vd / 2.0);
    wallPlane(vw, vy1 - vy0, { y: (vy0 + vy1) / 2, z: VLT.z0 + 0.01 }, vw / 2.0);
    // the door wall inside (steel), around the round opening
    {
      const sh = new T.Shape(); sh.moveTo(VLT.x0, vy0); sh.lineTo(VLT.x1, vy0); sh.lineTo(VLT.x1, vy1); sh.lineTo(VLT.x0, vy1); sh.closePath();
      const hole = new T.Path(); hole.absarc(VDC[0], VDC[1], VR + 0.02, 0, Math.PI * 2, true); sh.holes.push(hole);
      M(new T.ShapeGeometry(sh, 64), mat("#6d7379", { metal: 0.8, rough: 0.45, map: brushed, side: T.DoubleSide }), { z: VLT.z1 + 0.005, ry: 180 }, vg).rotation.y = Math.PI;
    }
    const vfloorT = K.canvasTex("v_vfloor", 256, 256, (q, w, h) => { q.fillStyle = "#8b9196"; q.fillRect(0, 0, w, h); const R = rng(66); for (let i = 0; i < 700; i++) { q.fillStyle = R() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"; q.fillRect(0, R() * h, w, 1); } q.fillStyle = "rgba(30,32,34,0.7)"; q.fillRect(0, 0, w, 3); q.fillRect(0, 0, 3, h); for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) { q.fillStyle = "#555b60"; q.beginPath(); q.arc(12 + k * 77, 12 + j * 77, 3, 0, 7); q.fill(); } }, { repeat: true });
    vfloorT.repeat.set(vw / 1.2, vd / 1.2);
    M(new T.PlaneGeometry(vw, vd), new T.MeshStandardMaterial({ map: vfloorT, metalness: 0.75, roughness: 0.36, envMapIntensity: 0.8 }), { rx: -90, y: vy0 + 0.003, z: (VLT.z0 + VLT.z1) / 2, cast: false }, vg);
    M(box(vw, 0.1, vd), mat("#5d6064", { rough: 0.8 }), { y: vy1 + 0.05, z: (VLT.z0 + VLT.z1) / 2 }, vg);
    // outer shell of the vault room (concrete), so the moon cannot leak in
    for (const s of [-1, 1]) M(box(0.6, vy1 - vy0 + 0.4, vd + 1.2), mat("#4a4a48", { rough: 0.9 }), { x: s * (vw / 2 + 0.3), y: (vy0 + vy1) / 2, z: (VLT.z0 + VLT.z1) / 2 }, vg);
    M(box(vw + 1.2, vy1 - vy0 + 0.4, 0.6), mat("#4a4a48", { rough: 0.9 }), { y: (vy0 + vy1) / 2, z: VLT.z0 - 0.3 }, vg);
    M(box(vw + 1.2, 0.5, vd + 1.2), mat("#4a4a48", { rough: 0.9 }), { y: vy1 + 0.35, z: (VLT.z0 + VLT.z1) / 2 }, vg);
    // ceiling cage light
    const cage = G({ y: vy1 - 0.12, z: -26.2 }, vg);
    M(cyl(0.16, 0.16, 0.06, 20), mat("#3a3d40", { metal: 0.5, rough: 0.5 }), { y: 0.06 }, cage);
    const vBulb = M(sph(0.07, 14, 10), glow("#ffe2b8", 6), { y: -0.06, cast: false }, cage);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.rod([Math.cos(a) * 0.12, 0.04, Math.sin(a) * 0.12], [Math.cos(a) * 0.1, -0.16, Math.sin(a) * 0.1], 0.005, mat("#2a2c2e"), cage, 4); }
    const vaultL = new T.PointLight("#ffd7a8", 0, 0, 2); vaultL.position.set(0, vy1 - 0.3, -26.2); scene.add(vaultL);
    vaultL.castShadow = true; vaultL.shadow.mapSize.set(512, 512); vaultL.shadow.camera.near = 0.05; vaultL.shadow.camera.far = 14; vaultL.shadow.bias = -0.003; vaultL.shadow.radius = 4;
    // vent grille on the door wall, upper right (seen from inside), with the sticker under it
    const vent = G({ x: 2.25, y: vy1 - 0.5, z: VLT.z1 - 0.03 }, vg);
    M(box(0.62, 0.36, 0.04), mat("#8c9298", { metal: 0.8, rough: 0.4 }), {}, vent);
    for (let k = 0; k < 7; k++) M(box(0.56, 0.022, 0.05), mat("#3b3f43", { metal: 0.7, rough: 0.5 }), { y: -0.14 + k * 0.047, z: 0.02, rx: -35 }, vent);
    const stickT = K.textTex("v_sticker", 512, 192, (q, w, h) => { q.fillStyle = "#f2c230"; q.fillRect(0, 0, w, h); q.fillStyle = "#1a1a1a"; for (let k = 0; k < 14; k++) { q.beginPath(); q.moveTo(k * 40, 0); q.lineTo(k * 40 + 20, 0); q.lineTo(k * 40 - 10, 26); q.lineTo(k * 40 - 30, 26); q.fill(); } q.fillRect(0, 26, w, 4); q.font = "700 64px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("VENT", w / 2, 98); q.font = "700 44px KitOswald, sans-serif"; q.fillText("OFF WHEN SEALED", w / 2, 160); });
    M(new T.PlaneGeometry(0.66, 0.25), mat("#ffffff", { map: stickT, rough: 0.5 }), { y: -0.37, z: 0.03, cast: false }, vent);
    vent.rotation.y = Math.PI;   // faces into the vault (-z)
    // supplies on the vault floor (right side, by the back wall) — appear on cue: [cans, bars, bottles, lamp]
    const sup = G({});
    const soupT = K.textTex("v_soup", 256, 128, (q, w, h) => { q.fillStyle = "#c8442b"; q.fillRect(0, 0, w, h); q.fillStyle = "#f3ead2"; q.fillRect(0, 30, w, 62); q.fillStyle = "#8a1e10"; q.font = "700 44px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("SOUP", w / 2, 78); q.fillStyle = "#e1b84e"; q.fillRect(0, 96, w, 6); });
    const canG = new T.CylinderGeometry(0.042, 0.042, 0.11, 18);
    const cans = new T.InstancedMesh(canG, [mat("#ffffff", { map: soupT, rough: 0.45, metal: 0.1 }), mat("#b7bcc1", { metal: 0.85, rough: 0.3 }), mat("#b7bcc1", { metal: 0.85, rough: 0.3 })], 40);
    const canPos = [];
    for (let lay = 0; lay < 4; lay++) for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) canPos.push([2.05 + c * 0.088 + (lay % 2) * 0.044, PY + 0.055 + lay * 0.112, -29.3 + r * 0.09]);
    cans.castShadow = true; cans.receiveShadow = true; sup.add(cans);
    const cardM = mat("#b88c5a", { rough: 0.85 });
    const barT = K.textTex("v_bars", 512, 256, (q, w, h) => { q.fillStyle = "#c69a62"; q.fillRect(0, 0, w, h); q.fillStyle = "#3a2a18"; q.font = "700 70px KitOswald, sans-serif"; q.textAlign = "center"; q.fillText("ENERGY BARS", w / 2, 120); q.font = "600 40px KitInter, sans-serif"; q.fillText("24 PACK", w / 2, 190); });
    const bars = [];
    for (let k = 0; k < 2; k++) bars.push(M(box(0.42, 0.24, 0.3), [cardM, cardM, cardM, cardM, mat("#ffffff", { map: barT, rough: 0.85 }), cardM], { x: 1.5 + k * 0.03, y: PY + 0.12 + k * 0.24, z: -29.25, ry: -8 + k * 12 }, sup));
    const pet = new T.MeshPhysicalMaterial({ color: "#bfe0ff", roughness: 0.06, metalness: 0, transparent: true, opacity: 0.45, envMapIntensity: 1.6, clearcoat: 1, depthWrite: false });
    const water = mat("#5fa8e8", { rough: 0.2, opacity: 0.5, env: 1.2 });
    const bottles = [];
    { const lat = [[0, 0.06], [0, 0.32], [0.06, 0.34], [0.06, 0.4], [0.02, 0.44], [0, 0.44]].map(([r, y]) => new T.Vector2(r * 1.0 + (r ? 0.0 : 0), y));
      const bg = new T.LatheGeometry([[0.0, 0], [0.034, 0.0], [0.036, 0.02], [0.036, 0.2], [0.03, 0.24], [0.014, 0.27], [0.014, 0.29], [0, 0.29]].map(([r, y]) => new T.Vector2(r, y)), 18);
      for (let k = 0; k < 12; k++) { const b = G({ x: 0.72 + (k % 6) * 0.075, y: PY, z: -29.3 + Math.floor(k / 6) * 0.075 }, sup); M(bg, pet, { cast: false }, b); M(cyl(0.031, 0.031, 0.19, 14), water, { y: 0.105, cast: false }, b); M(cyl(0.016, 0.016, 0.02, 10), mat("#2a6fd6", { rough: 0.5 }), { y: 0.3 }, b); bottles.push(b); } lat.length = 0; }
    // camping lantern (a glowing globe in a cage) — her only light after midnight
    const lamp = G({ x: -2.05, y: PY, z: -26.0 }, sup);
    M(cyl(0.07, 0.08, 0.05, 20), mat("#2b4a2e", { rough: 0.5 }), { y: 0.025 }, lamp);
    const globe = M(cyl(0.055, 0.055, 0.13, 20), glow("#ffcf8a", 4.5), { y: 0.12, cast: false }, lamp);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; K.rod([Math.cos(a) * 0.07, 0.05, Math.sin(a) * 0.07], [Math.cos(a) * 0.07, 0.2, Math.sin(a) * 0.07], 0.005, mat("#2b2b2b"), lamp, 4); }
    M(cyl(0.07, 0.06, 0.03, 20), mat("#2b4a2e", { rough: 0.5 }), { y: 0.21 }, lamp);
    M(new T.TorusGeometry(0.05, 0.006, 6, 16, Math.PI), mat("#222"), { y: 0.25 }, lamp);
    const campL = new T.PointLight("#ffb466", 0, 0, 2); campL.position.set(0, 0.14, 0); lamp.add(campL);
    campL.castShadow = true; campL.shadow.mapSize.set(512, 512); campL.shadow.camera.near = 0.05; campL.shadow.camera.far = 9; campL.shadow.bias = -0.003; campL.shadow.radius = 3;

    // ---------------------------------------------------------------- uplights at the column bases (no shadows: cheap) + a broad facade wash
    const upL = COLX.map((x) => { const L = new T.SpotLight("#ffd2a0", 0, 14, 16 * D2R, 0.7, 1.4); L.position.set(x, PY + 0.12, COLZ + 0.95); L.target.position.set(x, PY + 9.5, COLZ + 0.1); scene.add(L, L.target); return L; });
    for (const x of COLX) { M(box(0.34, 0.1, 0.22), mat("#2a2a2a", { metal: 0.4, rough: 0.5 }), { x, y: PY + 0.05, z: COLZ + 0.95 }, bank); M(box(0.26, 0.012, 0.15), glow("#ffe3b8", 6), { x, y: PY + 0.105, z: COLZ + 0.95, cast: false }, bank); }
    const washL = new T.SpotLight("#ffcf99", 0, 60, 26 * D2R, 0.8, 1.2); washL.position.set(0, 7.5, 16); washL.target.position.set(0, 7.0, 0); scene.add(washL, washL.target);
    washL.castShadow = true; washL.shadow.mapSize.set(1024, 1024); washL.shadow.bias = -0.0008; washL.shadow.radius = 3;

    // ---------------------------------------------------------------- red eyes in the streets around the block (aerials)
    const eyeM = glow("#ff2412", 16, { fog: false }), eyeMd = glow("#ff2412", 16, { fog: false });
    const eyeG = sph(0.07, 8, 6), eyes = [], eg = G({});
    { const R = rng(2525);
      for (let i = 0; i < 84; i++) {
        let x, z; const r = R();
        if (r < 0.45) { x = -70 + R() * 140; z = 10.5 + R() * 10; }                 // the avenue
        else if (r < 0.7) { x = (R() < 0.5 ? -36 : 36) + (R() - 0.5) * 9; z = -45 + R() * 70; }   // cross streets
        else if (r < 0.85) { x = -40 + R() * 80; z = 22 + R() * 3; }              // far sidewalk
        else { x = -40 + R() * 80; z = -47 + R() * 6; }                            // back street
        const p = G({}, eg); const a = M(eyeG, eyeM, { x: -0.06, cast: false }, p), b = M(eyeG, eyeM, { x: 0.06, cast: false }, p);
        const ga = Math.atan2(z - 4, x), gr = 3 + R() * 6;
        eyes.push({ p, a: [x, z], b: [Math.cos(ga) * gr * 1.6, 6.5 + Math.abs(Math.sin(ga)) * gr], appear: R(), ph: R() * 10, hy: 1.55 + R() * 0.2 });
      } }
    function placeEyes(t, k, scale, gather) {
      eg.visible = k > 0.001; if (!eg.visible) return;
      for (const e of eyes) {
        const on = k > e.appear, bl = Math.sin(t * 0.9 + e.ph) > 0.965;
        e.p.visible = on && !bl;
        const x = lerp(e.a[0], e.b[0], gather), z = lerp(e.a[1], e.b[1], gather);
        e.p.position.set(x, SW + e.hy, z); e.p.lookAt(0, SW + e.hy, 3); e.p.scale.setScalar(scale);
      }
    }

    // ---------------------------------------------------------------- per-frame state
    const U = door.userData;
    K.onRender((st, t) => {
      door.rotation.y = -(st.doorA != null ? st.doorA : 100) * D2R;
      const bk = st.boltK != null ? st.boltK : 0;
      U.bolts.forEach((b) => { b.position.x = VR - 0.1 + bk * 0.16; });
      U.bars.forEach((b) => { b.position.x = 0.55 + bk * 0.18; });
      U.wheel.rotation.z = (st.wheelA || 0) * D2R;
      U.hands.forEach((h, i) => { h.rotation.z = -((st.dial != null ? st.dial : 0) * 300 + i * 4) * D2R; });
      const I = (k, d) => (st[k] != null ? st[k] : d);
      const sk = I("streetI", 1); streetL.forEach((L) => (L.intensity = 160 * sk)); coneM.uniforms.k.value = 0.05 * sk * I("coneK", 1);
      const uk = I("upI", 1); upL.forEach((L) => (L.intensity = 130 * uk)); washL.intensity = 70 * I("washI", 1);
      deskL.intensity = 2.2 * I("deskI", 1); deskBulb.material.color.set("#ffdcaa").multiplyScalar(2.5 * clamp(I("deskI", 1), 0, 2));
      monL.intensity = 1.6 * I("monI", 1); scr.forEach((s) => s.material.color.setScalar(1.25 * I("monI", 1)));
      const li = I("lobbyI", 1); sconces.forEach((L) => (L.intensity = 8 * li)); vdL.forEach((L) => (L.intensity = 7 * I("vdI", 1) * li));
      vaultL.intensity = 20 * I("vaultI", 1); vBulb.material.color.set("#ffe2b8").multiplyScalar(6 * clamp(I("vaultI", 1), 0, 2));
      const ci = I("campI", 0); campL.intensity = 2.6 * ci; globe.material.color.set("#ffcf8a").multiplyScalar(4.5 * clamp(ci, 0.05, 2));
      bU.winK.value = I("winK", 1);
      for (const m of fglow) m.lookAt(K.camera.position);
      for (const s of smokes) { s.material.uniforms.t.value = t; s.lookAt(K.camera.position.x, s.position.y, K.camera.position.z); }
      placeTraffic(t, I("trafficK", 0));
      placeEyes(t, I("eyesK", 0), I("eyesScale", 1), I("eyesGather", 0));
      // supplies: [cans, bars, bottles, lamp] each 0..1 (pop in)
      const sp = st.supplies || [1, 1, 1, 1];
      const nC = Math.round(40 * clamp(sp[0], 0, 1));
      for (let k = 0; k < 40; k++) { const p = canPos[k]; dmy.position.set(p[0], p[1], p[2]); dmy.rotation.set(0, (hash2(k, 4, 1) - 0.5) * 1.4, 0); dmy.scale.setScalar(k < nC ? 1 : 0.0001); dmy.updateMatrix(); cans.setMatrixAt(k, dmy.matrix); }
      cans.instanceMatrix.needsUpdate = true;
      bars.forEach((b, k) => { const v = clamp(sp[1] * 2 - k, 0, 1); b.visible = v > 0.01; b.scale.setScalar(Math.max(0.001, ss(v))); });
      bottles.forEach((b, k) => { const v = clamp(sp[2] * 12 - k, 0, 1); b.visible = v > 0.01; b.scale.setScalar(Math.max(0.001, ss(v))); });
      lamp.visible = sp[3] > 0.01; lamp.scale.setScalar(Math.max(0.001, ss(clamp(sp[3], 0, 1))));
      if (st.cctvOn !== false) drawCCTV(st);
    });

    return { city, bank, door, desk, rack, chair, car, lamp, sup, vent, cans, bars, bottles, BLD, streetL, upL, washL, deskL, monL, sconces, vaultL, campL,
      P: { PY, SW, COLX, COLZ, LOB, VDC, VR, VTH, VLT, CAR, DESK, SKY, ROOF, FZ, HX, HZ } };
  }

  // ---------------------------------------------------------------- Rosa: the Hazel v2 rig re-dressed as a night guard
  const ROSA = { jacket: "#1e2944", jacketSheen: "#4b5a86", trim: "#141b2e", trimSheen: "#5f6f98", seam: "#2c3858", pants: "#22252c", pantsSheen: "#5a6070",
    boot: "#16141a", sole: "#0d0c0e", under: "#a9bdd8", hair: "#141215", hairStreaks: ["rgba(0,0,0,0.4)", "rgba(58,52,60,0.35)", "rgba(92,88,104,0.3)"], hairSheen: "#8c98c0",
    brow: "#1c1414", tie: "#26262c", lip: "#b86a62", chestPocket: false };
  function dressRosa(K, hz) {
    const T = K.T, M = K.M, G = K.G, mat = K.mat, glow = K.glow;
    const silver = new T.MeshPhysicalMaterial({ color: "#d9dde3", metalness: 1, roughness: 0.22, clearcoat: 0.5, envMapIntensity: 1.6 });
    const sp = hz.spine, surf = hz.surf;
    // badge: a small silver shield on her left chest
    const bp = surf(0.31, 0.44, 1.04);
    const badge = G({ x: bp[0], y: bp[1], z: bp[2] + 0.004, ry: 20, s: 1.35 }, sp);
    { const s = new T.Shape(); s.moveTo(0, 0.028); s.lineTo(0.021, 0.022); s.lineTo(0.02, -0.004); s.quadraticCurveTo(0.014, -0.022, 0, -0.03); s.quadraticCurveTo(-0.014, -0.022, -0.02, -0.004); s.lineTo(-0.021, 0.022); s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0016, bevelSize: 0.0016, bevelSegments: 2 }); M(g, silver, { cast: false }, badge);
      const st = new T.Shape(); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + Math.PI / 2, r = k % 2 ? 0.0055 : 0.012; k ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); } st.closePath();
      M(new T.ExtrudeGeometry(st, { depth: 0.002, bevelEnabled: false }), mat("#b9a05a", { metal: 1, rough: 0.3 }), { y: 0.002, z: 0.0055, cast: false }, badge); }
    // epaulettes on both shoulders
    for (const s of [-1, 1]) { const ep = surf(0.53, s * 1.25, 1.0); M(K.rbox(0.03, 0.012, 0.11, 0.005), hz.mats.trim, { x: s * 0.105, y: 0.535, z: -0.005, rz: s * -24 }, sp); M(K.sph(0.006, 8, 6), silver, { x: s * 0.075, y: 0.548, z: 0.04, cast: false }, sp); void ep; }
    // chest radio on her right chest: body, antenna, display + LED (driven by radioK)
    const rp = surf(0.3, -0.5, 1.02);
    const radio = G({ x: rp[0], y: rp[1], z: rp[2] + 0.016, ry: -26 }, sp);
    M(K.rbox(0.056, 0.095, 0.03, 0.008), mat("#4a4e55", { rough: 0.42, metal: 0.25 }), {}, radio);
    M(K.cyl(0.0045, 0.0055, 0.09, 8), mat("#111", { rough: 0.5 }), { x: 0.015, y: 0.085 }, radio);
    M(K.box(0.012, 0.014, 0.012), mat("#333", { rough: 0.5 }), { x: -0.012, y: 0.048 }, radio);
    const dispT = K.textTex("rosa_radio", 128, 64, (q, w, h) => { q.fillStyle = "#0f1a10"; q.fillRect(0, 0, w, h); q.fillStyle = "#ffb54a"; q.font = "700 30px KitOswald, sans-serif"; q.fillText("CH 1", 12, 42); });
    const disp = M(new T.PlaneGeometry(0.04, 0.02), new T.MeshBasicMaterial({ map: dispT, color: new T.Color(0.15, 0.15, 0.15) }), { y: 0.02, z: 0.0205, cast: false }, radio);
    const led = M(K.sph(0.0035, 8, 6), glow("#3aff6a", 0.3), { x: 0.018, y: 0.04, z: 0.02, cast: false }, radio);
    const grill = K.canvasTex("rosa_grill", 64, 64, (q, w, h) => { q.fillStyle = "#1c1e21"; q.fillRect(0, 0, w, h); q.fillStyle = "#050607"; for (let y = 6; y < h; y += 9) for (let x = 6; x < w; x += 9) { q.beginPath(); q.arc(x, y, 2.6, 0, 7); q.fill(); } });
    M(new T.PlaneGeometry(0.04, 0.034), mat("#ffffff", { map: grill, rough: 0.7 }), { y: -0.02, z: 0.0205, cast: false }, radio);
    K.rod([rp[0] + 0.02, rp[1] + 0.04, rp[2]], [-0.105, 0.535, 0.0], 0.0035, mat("#141414", { rough: 0.6 }), sp, 5);   // strap clip to the epaulette
    // a sleeve patch (blank shield, no text) on the left upper arm
    M(K.rbox(0.05, 0.06, 0.006, 0.012), mat("#c9a94e", { rough: 0.7 }), { x: 0.058, y: -0.09, z: 0.0, ry: 90 }, hz.arms[1].sh);
    // hand tools: pen (right), clipboard (left), notebook (left), pencil (right)
    const pen = new T.Group(); M(K.cyl(0.004, 0.004, 0.13, 8), mat("#1a1a1a", { rough: 0.4 }), { rx: 90, z: 0.03 }, pen); M(K.cyl(0.0042, 0.0042, 0.03, 8), silver, { rx: 90, z: -0.03 }, pen); pen.position.set(0, -0.075, 0.02); hz.tool("pen", pen, 0);
    const clip = new T.Group(); M(K.box(0.23, 0.31, 0.008), mat("#6b4a2a", { rough: 0.7 }), {}, clip); M(K.box(0.2, 0.26, 0.002), mat("#f2efe6", { rough: 0.9 }), { z: 0.005, y: -0.015 }, clip); M(K.box(0.08, 0.025, 0.012), silver, { y: 0.14, z: 0.006 }, clip); clip.position.set(0.03, -0.12, 0.06); clip.rotation.set(-1.2, 0.2, 0); hz.tool("clipboard", clip, 1);
    const nbT = K.textTex("rosa_plan", 256, 192, (q, w, h) => { q.fillStyle = "#f4efe2"; q.fillRect(0, 0, w, h); q.fillStyle = "rgba(60,80,140,0.35)"; for (let y = 22; y < h; y += 14) q.fillRect(10, y, w - 20, 1); q.fillStyle = "#1c2036"; q.font = "600 15px KitInter, sans-serif"; ["PLAN", "shelter  ✓", "food  ✓", "water  ✓"].forEach((s, i) => q.fillText(s, 16, 36 + i * 28)); q.fillStyle = "rgba(0,0,0,0.25)"; q.fillRect(w / 2 - 1, 0, 2, h); });
    const nb = new T.Group(); M(K.box(0.2, 0.004, 0.15), mat("#ffffff", { map: nbT, rough: 0.9 }), {}, nb); M(K.box(0.205, 0.006, 0.155), mat("#2b3b5e", { rough: 0.7 }), { y: -0.004 }, nb); nb.position.set(0.0, -0.12, 0.05); nb.rotation.set(1.45, 0, 0.25); hz.tool("notebook", nb, 1);
    const pencil = new T.Group(); M(K.cyl(0.0035, 0.0035, 0.15, 6), mat("#e3b52f", { rough: 0.5 }), { rx: 90 }, pencil); pencil.position.set(0, -0.075, 0.03); hz.tool("pencil", pencil, 0);
    // extra poses for her story (degrees: arms [shoulder x, shoulder z, elbow x] right / left; legs [hip x, knee x])
    Object.assign(hz.POSES, {
      tap: { arms: [[-72, 10, -22], [-18, -14, -70]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [2, 0], curl: [35, 70] },
      chestradio: { arms: [[-26, 22, -122], [4, 7, -10]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [72, 30] },
      pushbar: { arms: [[-48, 6, -18], [-46, -6, -18]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [70, 70] },
      pull: { arms: [[-74, 12, -30], [-70, -12, -30]], legs: [[-8, 10], [6, 4]], hipY: 0.92, spine: [-6, 0], curl: [85, 85] },
      setdial: { arms: [[-78, 14, -40], [4, 7, -10]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [6, 0], curl: [55, 30] },
      floor: { arms: [[-64, 14, -30], [-70, -10, -18]], legs: [[-135, 91], [-125, 82]], hipY: 0.13, spine: [-12, 0], curl: [70, 45] },
      carry: { arms: [[-46, 16, -64], [-46, -16, -64]], legs: [[0, 0], [0, 0]], hipY: 0.93, spine: [4, 0], curl: [70, 70] },
    });
    const carryBox = G({ y: 0.2, z: 0.3 }, sp); M(K.box(0.42, 0.24, 0.3), mat("#b88c5a", { rough: 0.85 }), {}, carryBox); M(K.box(0.43, 0.02, 0.31), mat("#c8a26c", { rough: 0.8 }), { y: 0.12 }, carryBox); carryBox.visible = false;
    return { badge, radio, disp, led, carryBox, tools: { pen, clip, nb, pencil }, setRadio(k) { disp.material.color.setScalar(0.15 + 2.0 * k); led.material.color.set(k > 0.5 ? "#3aff6a" : "#0d3a18").multiplyScalar(k > 0.5 ? 5 : 1); } };
  }

  S.vault = vault;
  S.vault.CREATE = CREATE;
  S.vault.ROSA = ROSA;
  S.vault.dressRosa = dressRosa;
})();
