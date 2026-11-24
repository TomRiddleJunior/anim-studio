/* Survival-scenario kit · shared helpers for stone-and-candlelight worlds (batch 7: the castle and the monastery).
 * Needs survival-kit.js v2.1. Load it after the kit and before a world module that uses it.
 *
 *   const Sx = SURVIVAL.stone(K);   // once per K (cached)
 *   Sx.stoneM(key, {base, var, rows, mortar, repeat:[x,y], rough})   cut-stone (ashlar) material: colour map + normal map
 *   Sx.rockM(key, {base, rough, strata})                               rough rock for cliffs (triplanar-free; use world-UV geometry)
 *   Sx.conglomM(key, {base, dark, lite, ns, vc})                       conglomerate rock (rounded pebbles in a darker matrix, thin
 *                                                                      horizontal bedding cracks, a few water streaks); vc: true for
 *                                                                      geometry that carries large-scale vertex colours
 *   Sx.plankM(key, {base, n, repeat}) · Sx.plasterM(key, base)          floors, walls
 *   Sx.candle(parent, {x,y,z,h,r,wax}) -> flame                         wax + wick + a camera-facing flame (flicker = f(t))
 *   Sx.candelabra(parent, {x,y,z,arms,s})                              brass candelabra with candles
 *   Sx.mist(defs, {col, k})                                             drifting moonlit mist sheets: defs [[y, op, size, cx, cz, sc]]
 *   Sx.water({y, w, d, cx, cz, col, res})                               a still planar mirror (its own reflection pass when st.mirror > 0)
 *   Sx.trees(list, {seed})                                              instanced conifers + broadleaf trees that sway; list [[x,y,z,h,kind]]
 *   Sx.eyes(n, place(R,i) -> {a:[x,y,z], b:[x,y,z]})                    red eye pairs: set(t, {k, scale, gather, blink, I, look:[x,z]})
 *   Sx.frame(parent, tex, w, h, {x,y,z,ry,col,depth})                   a framed picture
 *   Sx.merge(geos) -> one BufferGeometry (position, normal, uv)
 *   Sx.finish()   call last (after every candle and every other onRender hook): instanced flames + the mirror pass
 * Per-frame state read by the helpers: st.candleK (flame size/brightness, 1), st.gutter (0..1 flicker), st.mirror (0..1),
 * st.mistK (1), st.wind.
 *
 *   SURVIVAL.hair.hide(hz)                    hide the rig's default cap, fringe locks and ponytail
 *   SURVIVAL.hair.curls(K, hz, {col, streaks, sheen, len})   voluminous shoulder-length curls (ringlets + curly crown)
 *   SURVIVAL.hair.bun(K, hz, {col, streaks, sheen})          sleek centre-parted hair pulled into a low bun, two face-framing strands
 */
(function () {
  "use strict";
  const S = window.SURVIVAL;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  function merge(T, geos) {
    let n = 0, ni = 0;
    for (const g of geos) { n += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = new Uint32Array(ni);
    let o = 0, oi = 0;
    for (const g of geos) {
      if (!g.attributes.normal) g.computeVertexNormals();
      const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
      for (let i = 0; i < pa.count; i++) {
        pos[(o + i) * 3] = pa.getX(i); pos[(o + i) * 3 + 1] = pa.getY(i); pos[(o + i) * 3 + 2] = pa.getZ(i);
        nor[(o + i) * 3] = na.getX(i); nor[(o + i) * 3 + 1] = na.getY(i); nor[(o + i) * 3 + 2] = na.getZ(i);
        if (ua) { uv[(o + i) * 2] = ua.getX(i); uv[(o + i) * 2 + 1] = ua.getY(i); }
      }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + o;
      else for (let i = 0; i < pa.count; i++) idx[oi + i] = i + o;
      o += pa.count; oi += g.index ? g.index.count : pa.count;
    }
    const out = new T.BufferGeometry();
    out.setAttribute("position", new T.BufferAttribute(pos, 3)); out.setAttribute("normal", new T.BufferAttribute(nor, 3)); out.setAttribute("uv", new T.BufferAttribute(uv, 2));
    out.setIndex(new T.BufferAttribute(idx, 1));
    out.computeBoundingSphere();
    return out;
  }

  function stone(K) {
    if (K._stone) return K._stone;
    const T = K.T, M = K.M, G = K.G, mat = K.mat, glow = K.glow, rng = K.rng, scene = K.scene;
    const U = { t: { value: 0 } };

    // ---------------------------------------------------------------- cut stone (ashlar): one block layout drives colour + relief
    function ashlarLayout(seed, n, rows) {
      const R = rng(seed), rh = n / rows, cells = [];
      for (let r = 0; r < rows; r++) {
        let x = -R() * rh * 1.5;
        while (x < n) { const w = rh * (1.1 + R() * 1.3); cells.push({ r, x0: x, x1: x + w, y0: r * rh, y1: (r + 1) * rh, v: R(), v2: R() }); x += w; }
      }
      const rowCells = []; for (let r = 0; r < rows; r++) rowCells.push(cells.filter((c) => c.r === r));
      return (x, y) => { // -> {edge distance px, cell}
        const r = Math.min(rows - 1, Math.floor(y / rh)), xs = x;
        let c = null; for (const q of rowCells[r]) { const xx = ((xs - q.x0) % n + n) % n; if (xx < q.x1 - q.x0) { c = q; break; } }
        if (!c) c = rowCells[r][0];
        const xx = ((xs - c.x0) % n + n) % n;
        const e = Math.min(xx, c.x1 - c.x0 - xx, y - c.y0, c.y1 - y);
        return { e, c };
      };
    }
    const stoneCache = {};
    function stoneM(key, o) {
      o = o || {};
      if (stoneCache[key]) return stoneCache[key];
      const n = 512, rows = o.rows || 6, mortar = o.mortar || 3.2, lay = ashlarLayout(o.seed || 7, n, rows);
      const base = new T.Color(o.base || "#8a8274"), alt = new T.Color(o.alt || "#6f6a62"), mor = new T.Color(o.mortarCol || "#4a463f");
      const map = K.canvasTex(key + "_c", n, n, (g) => {
        const im = g.createImageData(n, n), c = new T.Color();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const { e, c: cell } = lay(x, y);
          const nz = K.vnoise(x / 9, y / 9, 3) * 0.5 + K.vnoise(x / 31, y / 31, 5) * 0.5, sp = K.hash2(x, y, 9);
          c.copy(base).lerp(alt, cell.v * 0.75 + (nz - 0.5) * 0.4);
          c.multiplyScalar(0.84 + 0.22 * cell.v2 + (sp - 0.5) * 0.12);
          const streak = ss((K.vnoise(x / 6, y / 60, 11) - 0.62) * 4) * 0.25;   // weathering streaks running down
          c.multiplyScalar(1 - streak);
          if (e < mortar) c.copy(mor).multiplyScalar(0.85 + sp * 0.3);
          else if (e < mortar + 2.5) c.multiplyScalar(0.82);
          const q = (y * n + x) * 4; im.data[q] = c.r * 255; im.data[q + 1] = c.g * 255; im.data[q + 2] = c.b * 255; im.data[q + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }, { repeat: true });
      const nmap = K.heightNormal(key + "_n", n, (x, y) => { const { e } = lay(x, y); return ss(e / (mortar + 5)) * 1.0 + K.vnoise(x / 5, y / 5, 21) * 0.18 + K.hash2(x, y, 4) * 0.05; }, 2.6);
      const m = new T.MeshStandardMaterial({ map, normalMap: nmap, roughness: o.rough != null ? o.rough : 0.92, metalness: 0, envMapIntensity: o.env != null ? o.env : 0.5 });
      m.normalScale.set(o.ns || 1, o.ns || 1);
      if (o.repeat) { map.repeat.set(o.repeat[0], o.repeat[1]); nmap.repeat.set(o.repeat[0], o.repeat[1]); }
      stoneCache[key] = m;
      return m;
    }
    // rough rock (cliffs): strata bands + fbm, a strong ridged normal
    function rockM(key, o) {
      o = o || {};
      if (stoneCache[key]) return stoneCache[key];
      const n = 512, base = new T.Color(o.base || "#7d7466"), dark = new T.Color(o.dark || "#4c463e"), lite = new T.Color(o.lite || "#a39a88");
      const map = K.canvasTex(key + "_c", n, n, (g) => {
        const im = g.createImageData(n, n), c = new T.Color();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const u = x / n, v = y / n;
          const st = Math.sin((v * 6 + K.fbm(u * 2, v * 2, 4, 3) * 4.0) * Math.PI) * 0.5 + 0.5;
          const nz = K.fbm(u * 5, v * 5, 7, 4), blot = K.fbm(u * 2.2 + 9, v * 2.2, 15, 3);
          const streak = ss((K.vnoise(u * 40, v * 3, 33) - 0.6) * 3) * 0.35;      // dark weathering streaks running down
          c.copy(base).lerp(dark, ss((st - 0.6) * 2.5) * 0.25 + ss((blot - 0.5) * 3) * 0.35 + streak).lerp(lite, ss((nz - 0.55) * 4) * 0.4);
          c.multiplyScalar(0.85 + K.hash2(x, y, 3) * 0.25);
          const q = (y * n + x) * 4; im.data[q] = c.r * 255; im.data[q + 1] = c.g * 255; im.data[q + 2] = c.b * 255; im.data[q + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }, { repeat: true });
      const nmap = K.heightNormal(key + "_n", n, (x, y) => { const u = x / n, v = y / n; return (1 - Math.abs(K.fbm(u * 5, v * 5, 13, 4) * 2 - 1)) * 0.8 + Math.sin((v * 6 + K.fbm(u * 2, v * 2, 4, 3) * 4.0) * Math.PI) * 0.08 + K.vnoise(x / 3, y / 3, 2) * 0.18; }, 3.0);
      const m = new T.MeshStandardMaterial({ map, normalMap: nmap, roughness: o.rough != null ? o.rough : 0.95, metalness: 0, envMapIntensity: 0.45 });
      m.normalScale.set(o.ns || 1.2, o.ns || 1.2);
      stoneCache[key] = m;
      return m;
    }
    // conglomerate (the monastery's rock pillars, v3): rounded pebbles and cobbles set in a darker matrix, thin wavy horizontal
    // bedding cracks, a few broad dark water streaks; the normal map bumps every pebble and grooves the cracks. A wrapping grid of
    // cells (32 px, three pebbles each) keeps the per-pixel search to its 3x3 neighbourhood.
    function conglomM(key, o) {
      o = o || {};
      if (stoneCache[key]) return stoneCache[key];
      const n = 512, C = 32, NC = n / C, base = new T.Color(o.base || "#6c6f72"), dark = new T.Color(o.dark || "#3b3e42"), lite = new T.Color(o.lite || "#a2a4a5");
      const peb = [];
      for (let cy = 0; cy < NC; cy++) for (let cx = 0; cx < NC; cx++) { const L = []; for (let k = 0; k < 3; k++) {
        const h = (j) => K.hash2(cx * 7 + k, cy * 13 + j, 4100 + k);
        const r = 2 + 6 * Math.pow(h(1), 1.8); L.push({ x: (cx + h(2)) * C, y: (cy + h(3)) * C, rx: r * (0.8 + 0.5 * h(4)), ry: r * (0.6 + 0.35 * h(5)), c: Math.cos(h(6) * 3.14), s: Math.sin(h(6) * 3.14), t: h(7), w: h(8) }); } peb.push(L); }
      function pebAt(x, y) {
        const cx = Math.floor(x / C), cy = Math.floor(y / C); let best = 0, bp = null;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const gx = (cx + i + NC) % NC, gy = (cy + j + NC) % NC;
          for (const q of peb[gy * NC + gx]) {
            let dx = x - q.x, dy = y - q.y; if (dx > n / 2) dx -= n; if (dx < -n / 2) dx += n; if (dy > n / 2) dy -= n; if (dy < -n / 2) dy += n;
            const u = (dx * q.c + dy * q.s) / q.rx, v = (-dx * q.s + dy * q.c) / q.ry, d2 = u * u + v * v;
            if (d2 < 1) { const hh = Math.sqrt(1 - d2); if (hh > best) { best = hh; bp = q; } }
          }
        }
        return [best, bp];
      }
      // bedding cracks: four wavy lines per tile (wrapping in x)
      const cracks = [0, 1].map((k) => ({ y: n * (k + 0.15 + 0.7 * K.hash2(k, 1, 4200)) / 2, ph: K.hash2(k, 2, 4200) * 6.28, a: 8 + 14 * K.hash2(k, 3, 4200), w: 0.5 + 0.9 * K.hash2(k, 4, 4200) }));
      function crackAt(x, y) {
        let m = 0;
        for (const c of cracks) { const cy = c.y + c.a * Math.sin((x / n) * Math.PI * 4 + c.ph) + 5 * (K.fbm(x / 40, c.y / 40, 4300, 3) - 0.5);
          let d = Math.abs(y - cy); d = Math.min(d, n - d); const w = c.w * (0.4 + 1.2 * K.vnoise(x / 23, c.y, 4301));
          m = Math.max(m, 1 - ss(d / Math.max(0.3, w))); }
        return m;
      }
      const map = K.canvasTex(key + "_c", n, n, (g) => {
        const im = g.createImageData(n, n), c = new T.Color(), pc = new T.Color();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const u = x / n, v = y / n;
          c.copy(base).lerp(dark, 0.25 + 0.35 * K.fbm(u * 6, v * 6, 4400, 4));                       // the matrix: sand and grit
          c.multiplyScalar(0.96 + 0.08 * K.fbm(u * 3, v * 3, 4401, 3));                                     // soft mottling (no regular bands)
          const [h, q] = pebAt(x, y);
          if (q) { pc.copy(dark).lerp(lite, 0.25 + 0.75 * q.t); pc.r *= 0.97 + 0.08 * q.w; pc.b *= 1.03 - 0.08 * q.w; pc.multiplyScalar(0.8 + 0.2 * h); c.lerp(pc, ss(h * 4) * 0.45); }
          const streak = ss((K.vnoise(u * 4, v * 1.0, 4402) - 0.7) * 5) * (0.4 + 0.6 * K.vnoise(u * 4, v * 3, 4403));     // a few broad water streaks, broken
          c.multiplyScalar(1 - 0.0 * streak);                                                        // (streaks now come from the pillar's vertex colours: a tiled streak read as rain)
          c.multiplyScalar(1 - 0.4 * crackAt(x, y) * (0.3 + 0.7 * K.vnoise(x / 60, y / 60, 4406)));
          c.multiplyScalar(0.9 + K.hash2(x, y, 4404) * 0.16);
          const p = (y * n + x) * 4; im.data[p] = Math.min(255, c.r * 255); im.data[p + 1] = Math.min(255, c.g * 255); im.data[p + 2] = Math.min(255, c.b * 255); im.data[p + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }, { repeat: true });
      const nmap = K.heightNormal(key + "_n", n, (x, y) => { const [h] = pebAt(x, y); return h * 0.5 - crackAt(x, y) * 0.9 + K.fbm(x / 9, y / 9, 4405, 3) * 0.3; }, 1.8);
      const m = new T.MeshStandardMaterial({ map, normalMap: nmap, roughness: o.rough != null ? o.rough : 0.95, metalness: 0, envMapIntensity: 0.4, vertexColors: !!o.vc });
      m.normalScale.set(o.ns || 1.0, o.ns || 1.0);
      stoneCache[key] = m;
      return m;
    }
    function plankM(key, o) {
      o = o || {};
      if (stoneCache[key]) return stoneCache[key];
      const n = 256, base = new T.Color(o.base || "#6b4a30"), N = o.n || 6;
      const map = K.canvasTex(key, n, n, (g) => {
        const im = g.createImageData(n, n), c = new T.Color();
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const b = Math.floor(x / (n / N)), bx = (x % (n / N)) / (n / N), off = K.hash2(b, 0, 5) * n;
          const grain = Math.sin(((y + off) / n) * 40 + K.vnoise(x / 6, (y + off) / 40, b) * 6) * 0.5 + 0.5;
          c.copy(base).multiplyScalar(0.78 + 0.3 * K.hash2(b, 1, 6) + grain * 0.14);
          if (bx < 0.03 || bx > 0.97) c.multiplyScalar(0.45);
          const end = ((y + off) % n) < 2; if (end) c.multiplyScalar(0.5);
          const q = (y * n + x) * 4; im.data[q] = c.r * 255; im.data[q + 1] = c.g * 255; im.data[q + 2] = c.b * 255; im.data[q + 3] = 255;
        }
        g.putImageData(im, 0, 0);
      }, { repeat: true });
      if (o.repeat) map.repeat.set(o.repeat[0], o.repeat[1]);
      const m = new T.MeshStandardMaterial({ map, roughness: o.rough != null ? o.rough : 0.72, metalness: 0, envMapIntensity: 0.4 });
      stoneCache[key] = m;
      return m;
    }
    function plasterM(key, base, o) {
      o = o || {};
      if (stoneCache[key]) return stoneCache[key];
      const map = K.canvasTex(key, 256, 256, (g, w, h) => {
        const im = g.createImageData(w, h), c = new T.Color(), b = new T.Color(base);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { c.copy(b).multiplyScalar(0.88 + K.fbm(x / 40, y / 40, 3, 3) * 0.2 + K.hash2(x, y, 1) * 0.05); const q = (y * w + x) * 4; im.data[q] = c.r * 255; im.data[q + 1] = c.g * 255; im.data[q + 2] = c.b * 255; im.data[q + 3] = 255; }
        g.putImageData(im, 0, 0);
      }, { repeat: true });
      if (o.repeat) map.repeat.set(o.repeat[0], o.repeat[1]);
      const m = new T.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0, envMapIntensity: 0.35 });
      stoneCache[key] = m;
      return m;
    }

    // ---------------------------------------------------------------- candles: wax, wick, camera-facing flame (flicker = f(t))
    const flameU = { t: U.t, k: { value: 1 }, gut: { value: 0 } };
    const flameM = new T.ShaderMaterial({
      uniforms: flameU, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false,
      vertexShader: `uniform float t, gut; attribute float aPh; varying vec2 vUv; varying float vF;
        void main(){ vUv = uv; float ph = aPh;
          float f = 0.86 + 0.08 * sin(t * 13.0 + ph * 7.0) + 0.06 * sin(t * 23.0 + ph * 3.1) + gut * (0.45 * sin(t * 31.0 + ph) - 0.3 + 0.3 * sin(t * 7.0 + ph * 2.0));
          vF = f; vec3 p = position; p.y *= f; p.x += sin(t * 9.0 + ph * 5.0) * 0.006 * uv.y * (1.0 + gut * 3.0);
          // a view-space billboard round its own centre (the instance matrix carries position + scale)
          vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float sc = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
          vec4 mv = viewMatrix * c; mv.xy += p.xy * sc;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float k; varying vec2 vUv; varying float vF;
        void main(){ vec2 q = vUv - vec2(0.5, 0.32); q.x *= 2.4; q.y *= q.y > 0.0 ? 0.95 : 2.2;
          float d = length(q); float core = smoothstep(0.42, 0.0, d); float hot = smoothstep(0.16, 0.0, length(vec2(q.x * 1.3, q.y + 0.08)));
          vec3 c = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.82, 0.5), core) + vec3(1.0, 0.95, 0.85) * hot * 1.4;
          float blue = smoothstep(0.12, 0.0, length(vec2(q.x, q.y + 0.22))) * 0.6;
          c = mix(c, vec3(0.3, 0.45, 1.0), blue * 0.5);
          float a = core * k * vF;
          gl_FragColor = vec4(c * a * 3.2, a); }` });
    const haloT = K.canvasTex("st_halo", 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const flames = [];         // {p:[x,y,z] world, s}
    let flameMesh = null, haloMesh = null;
    const waxM = new T.MeshPhysicalMaterial({ color: "#efe4cc", roughness: 0.55, sheen: 0.4, sheenColor: new T.Color("#fff2d8"), transmission: 0, emissive: new T.Color("#ff9a40"), emissiveIntensity: 0.0 });
    const wickM = mat("#1a1410", { rough: 0.9 });
    function candle(parent, o) {
      o = o || {};
      const g = G({ x: o.x || 0, y: o.y || 0, z: o.z || 0 }, parent);
      const h = o.h || 0.18, r = o.r || 0.012;
      M(K.cyl(r, r * 1.05, h, 14), o.wax || waxM, { y: h / 2, cast: false }, g);
      M(K.cyl(r * 0.85, r, 0.006, 14), o.wax || waxM, { y: h + 0.002, cast: false }, g);   // the melted rim
      M(K.cyl(0.0012, 0.0012, 0.012, 4), wickM, { y: h + 0.008, cast: false }, g);
      const f = { g, y: h + 0.028 * (o.fs || 1), s: (o.fs || 1), ph: flames.length * 1.37 % 6.28, tag: o.tag || "", on: 1 };
      flames.push(f);
      return f;
    }
    function buildFlames() {   // after every candle is placed: one instanced draw for all flames and halos
      if (flameMesh || !flames.length) return;
      const pg = new T.PlaneGeometry(0.024, 0.06); pg.translate(0, 0.012, 0);
      const ph = new Float32Array(flames.length); flames.forEach((f, i) => (ph[i] = f.ph));
      pg.setAttribute("aPh", new T.InstancedBufferAttribute(ph, 1));
      flameMesh = new T.InstancedMesh(pg, flameM, flames.length);
      const hm = new T.ShaderMaterial({ uniforms: { map: { value: haloT }, k: flameU.k, col: { value: new T.Color("#ffb060").multiplyScalar(0.55) } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float sc = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2])); vec4 mv = viewMatrix * c; mv.xy += position.xy * sc; gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform sampler2D map; uniform float k; uniform vec3 col; varying vec2 vUv; void main(){ float a = texture2D(map, vUv).r * k; gl_FragColor = vec4(col * a, a); }" });
      haloMesh = new T.InstancedMesh(new T.PlaneGeometry(0.075, 0.075), hm, flames.length);
      const v = new T.Vector3(), d = new T.Object3D();
      scene.updateMatrixWorld(true);
      flames.forEach((f, i) => { f.g.updateMatrixWorld(true); v.set(0, f.y, 0); f.g.localToWorld(v); f.world = v.toArray(); d.position.copy(v); d.scale.setScalar(f.s); d.updateMatrix(); flameMesh.setMatrixAt(i, d.matrix); haloMesh.setMatrixAt(i, d.matrix); });
      flameMesh.frustumCulled = false; haloMesh.frustumCulled = false; flameMesh.renderOrder = 6; haloMesh.renderOrder = 5;
      scene.add(flameMesh, haloMesh); K.noDepth.push(flameMesh, haloMesh);
    }
    function candelabra(parent, o) {
      o = o || {};
      const brass = mat(o.metalCol || "#b08a4a", { metal: 0.55, rough: 0.35 });
      const g = G({ x: o.x || 0, y: o.y || 0, z: o.z || 0, ry: o.ry || 0, s: o.s || 1 }, parent);
      M(K.cyl(0.07, 0.09, 0.03, 20), brass, { y: 0.015 }, g); M(K.cyl(0.012, 0.016, 0.42, 10), brass, { y: 0.22 }, g);
      M(K.sph(0.03, 12, 10), brass, { y: 0.2 }, g);
      const arms = o.arms || 5, out = [];
      for (let i = 0; i < arms; i++) {
        const a = (i / arms) * Math.PI * 2, rr = i === 0 && arms % 2 ? 0 : 0.13;
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        if (rr > 0) K.rod([0, 0.42, 0], [x, 0.44, z], 0.006, brass, g, 6);
        M(K.cyl(0.022, 0.012, 0.03, 12), brass, { x, y: 0.455, z }, g);
        out.push(candle(g, { x, y: 0.47, z, h: o.h || 0.16, r: 0.011, tag: o.tag }));
      }
      return { g, flames: out };
    }

    // ---------------------------------------------------------------- mist sheets (moonlit, drifting) — the kit's valley-fog shader, placed anywhere
    const mistN = K.noiseTex("st_mist", 256, 3, 5, 2.2);
    const mists = [];
    function mist(defs, o) {
      o = o || {};
      for (const [y, op, size, cx, cz, scl] of defs) {
        const m = new T.ShaderMaterial({
          uniforms: { tN: { value: mistN }, t: U.t, op: { value: op }, k: { value: 1 }, col: { value: new T.Color(o.col || "#9fb2d8") }, sp: { value: new T.Vector2(0.0022 + mists.length * 0.0004, 0.0011) },
            sc: { value: scl || 1.6 + mists.length * 0.35 }, fogC: { value: K.FOG }, fogD: { value: o.fogD || 0.00024 }, lo: { value: o.lo != null ? o.lo : 0.3 } },
          vertexShader: "varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
          fragmentShader: `uniform sampler2D tN; uniform float t, op, k, sc, fogD, lo; uniform vec3 col, fogC; uniform vec2 sp; varying vec2 vUv; varying vec3 vW;
            void main(){ vec2 q = vUv * sc; float n = texture2D(tN, q + sp * t * 10.0).r * 0.6 + texture2D(tN, q * 2.3 - sp.yx * t * 14.0).r * 0.4;
              float a = smoothstep(lo, lo + 0.55, n);
              float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
              float d = length(cameraPosition - vW); float f = 1.0 - exp(-pow(fogD * d, 2.0));
              float near = smoothstep(2.0, 30.0, d);
              vec3 c = mix(col * (0.55 + 0.6 * n), fogC, f * 0.6);
              gl_FragColor = vec4(c, a * op * k * edge * near); }`,
          transparent: true, depthWrite: false, side: T.DoubleSide });
        const mesh = new T.Mesh(new T.PlaneGeometry(size, size, 1, 1), m);
        mesh.rotation.x = -Math.PI / 2; mesh.position.set(cx || 0, y, cz || 0); mesh.renderOrder = 2;
        scene.add(mesh); K.noDepth.push(mesh); mists.push(mesh);
      }
      return mists;
    }

    // ---------------------------------------------------------------- a still planar mirror (water): its own reflection pass
    const waters = [];
    function water(o) {
      const y = o.y || 0, res = o.res || [540, 960];
      const rt = new T.WebGLRenderTarget(res[0], res[1], { type: T.HalfFloatType, samples: 2 });
      const texM = new T.Matrix4(), mirCam = new T.PerspectiveCamera();
      const wn = K.noiseTex("st_waternoise", 256, 31, 4, 3.0);
      const uni = { tR: { value: rt.texture }, texM: { value: texM }, t: U.t, tN: { value: wn }, k: { value: 0 }, col: { value: new T.Color(o.col || "#05080c") },
        fogC: { value: K.FOG }, fogD: { value: 0.00024 }, dk: { value: o.distort != null ? o.distort : 0.006 }, gain: { value: o.gain || 0.85 } };
      const m = new T.ShaderMaterial({ uniforms: uni, fog: false,
        vertexShader: "uniform mat4 texM; varying vec4 vM; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vM = texM * w; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: `uniform sampler2D tR, tN; uniform float t, k, fogD, dk, gain; uniform vec3 col, fogC; varying vec4 vM; varying vec3 vW;
          void main(){
            vec2 n = texture2D(tN, vW.xz * 0.045 + vec2(t * 0.004, t * 0.003)).rg + texture2D(tN, vW.xz * 0.13 - vec2(t * 0.007, 0.0)).rg - 1.0;
            vec2 uv = vM.xy / vM.w + n * dk;
            vec3 r = texture2D(tR, uv).rgb;
            vec3 V = normalize(cameraPosition - vW); float fr = 0.25 + 0.75 * pow(1.0 - max(V.y, 0.0), 4.0);
            vec3 c = col + r * gain * mix(0.55, 1.0, fr) * k;
            float d = length(cameraPosition - vW); float f = 1.0 - exp(-pow(fogD * d, 2.0));
            gl_FragColor = vec4(mix(c, fogC, f), 1.0); }` });
      const geo = o.geo || new T.PlaneGeometry(o.w || 100, o.d || 100);
      if (!o.geo) geo.rotateX(-Math.PI / 2);
      const mesh = M(geo, m, { x: o.cx || 0, y, z: o.cz || 0, cast: false, receive: false });
      const W = { mesh, rt, mirCam, texM, uni, y };
      waters.push(W);
      return W;
    }
    const _n = new T.Vector3(0, 1, 0), _p = new T.Vector3(), _v = new T.Vector3(), _la = new T.Vector3(), _tg = new T.Vector3(), _rot = new T.Matrix4(), _bias = new T.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    const _clip = new T.Plane(new T.Vector3(0, 1, 0), 0);
    // the mirror pass refreshes the shadow maps for this frame; the kit's main pass then asks for them again. A guarded
    // needsUpdate lets the main pass reuse them (same frame, same lights), which halves the shadow work in water shots.
    let skipNext = false;
    { const sm = K.renderer.shadowMap; let nu = sm.needsUpdate;
      Object.defineProperty(sm, "needsUpdate", { configurable: true, get() { return nu; }, set(v) { if (v && skipNext) { skipNext = false; return; } nu = v; } }); }
    function mirrorPass(Wt, cam, k) {
      const R = K.renderer;
      Wt.uni.k.value = k; Wt.uni.fogD.value = scene.fog.density;
      if (k <= 0 || cam.position.y < Wt.y + 0.02) { Wt.uni.k.value = 0; return; }
      _p.set(cam.position.x, Wt.y, cam.position.z);
      _v.copy(_p).sub(cam.position).reflect(_n).negate().add(_p);
      _rot.extractRotation(cam.matrixWorld);
      _la.set(0, 0, -1).applyMatrix4(_rot).add(cam.position);
      _tg.copy(_p).sub(_la).reflect(_n).negate().add(_p);
      const mc = Wt.mirCam;
      mc.position.copy(_v); mc.up.set(0, 1, 0).applyMatrix4(_rot).reflect(_n); mc.lookAt(_tg);
      mc.fov = cam.fov; mc.aspect = cam.aspect; mc.near = cam.near; mc.far = cam.far; mc.updateProjectionMatrix(); mc.updateMatrixWorld();
      Wt.texM.copy(_bias).multiply(mc.projectionMatrix).multiply(mc.matrixWorldInverse);
      _clip.constant = -Wt.y + 0.01;
      Wt.mesh.visible = false;
      const prevClip = R.clippingPlanes;
      R.clippingPlanes = [_clip];
      R.shadowMap.needsUpdate = true;
      R.setRenderTarget(Wt.rt); R.clear(); R.render(scene, mc);
      R.clippingPlanes = prevClip; R.setRenderTarget(null);
      skipNext = true;
      Wt.mesh.visible = true;
    }

    // ---------------------------------------------------------------- trees: conifers + broadleaf, instanced, swaying (the kit's wind patch)
    const windU = { uTime: U.t, uWind: { value: 0.012 } };
    function windPatch(shader) {
      shader.uniforms.uTime = windU.uTime; shader.uniforms.uWind = windU.uWind;
      shader.vertexShader = "uniform float uTime; uniform float uWind;\n" + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ipw = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ipw = vec3(0.0);
        #endif
        float hk = max(position.y, 0.0); hk *= hk;
        float ph = ipw.x * 0.031 + ipw.z * 0.023;
        float sw = sin(uTime * 1.25 + ph) * 0.65 + sin(uTime * 2.9 + ph * 1.9) * 0.22 + sin(uTime * 0.37 + ph * 0.3) * 0.5;
        transformed.x += uWind * sw * hk; transformed.z += uWind * 0.55 * cos(uTime * 1.07 + ph * 1.3) * hk;`);
    }
    function vcGeo(parts, seed) {   // merge [geo, color] with vertex colours and soft up-tilted normals
      let n = 0; const gs = parts.map(([g, c]) => { const gi = g.index ? g.toNonIndexed() : g; gi.computeVertexNormals(); n += gi.attributes.position.count; return [gi, c]; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
      let o = 0;
      for (const [g, c] of gs) {
        const pa = g.attributes.position, na = g.attributes.normal;
        for (let k = 0; k < pa.count; k++) {
          pos[(o + k) * 3] = pa.getX(k); pos[(o + k) * 3 + 1] = pa.getY(k); pos[(o + k) * 3 + 2] = pa.getZ(k);
          const nx = na.getX(k), ny = na.getY(k) * 0.6 + 0.4, nz = na.getZ(k), l = Math.hypot(nx, ny, nz);
          nor[(o + k) * 3] = nx / l; nor[(o + k) * 3 + 1] = ny / l; nor[(o + k) * 3 + 2] = nz / l;
          const sh = (0.85 + 0.3 * K.hash2(k, o, seed)) * 0.62;   // darker foliage: the castle's moon is strong
          col[(o + k) * 3] = c.r * sh; col[(o + k) * 3 + 1] = c.g * sh; col[(o + k) * 3 + 2] = c.b * sh;
        }
        o += pa.count;
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("normal", new T.BufferAttribute(nor, 3)); g.setAttribute("color", new T.BufferAttribute(col, 3));
      g.computeBoundingSphere();
      return g;
    }
    function conifer(seed, layers) {
      const R = rng(seed), parts = [];
      const tr = K.cyl(0.012, 0.02, 0.3, 7); tr.translate(0, 0.15, 0); parts.push([tr, new T.Color("#3a2a1e")]);
      for (let i = 0; i < layers; i++) {
        const u = i / layers, r = lerp(0.2, 0.06, u) * (0.88 + R() * 0.24), h = lerp(0.34, 0.2, u) * (0.9 + R() * 0.2);
        const g = new T.ConeGeometry(r, h, 11, 2, true); const pa = g.attributes.position;
        for (let k = 0; k < pa.count; k++) { const x = pa.getX(k), z = pa.getZ(k), y = pa.getY(k); const j = 1 + (K.hash2(Math.round(x * 999), Math.round(z * 999), seed + i) - 0.5) * 0.28 * (y < 0 ? 1 : 0.2); pa.setXYZ(k, x * j, y, z * j); }
        g.translate(0, 0.22 + u * 0.7 + h / 2, 0);
        parts.push([g, new T.Color("#2f5c3d").multiplyScalar(0.75 + u * 0.45 + (R() - 0.5) * 0.1)]);
      }
      return vcGeo(parts, seed);
    }
    function broadleaf(seed) {
      const R = rng(seed), parts = [];
      const tr = K.cyl(0.018, 0.03, 0.45, 7); tr.translate(0, 0.22, 0); parts.push([tr, new T.Color("#3b2c20")]);
      for (let i = 0; i < 7; i++) {
        const g = new T.IcosahedronGeometry(0.13 + R() * 0.08, 1); const pa = g.attributes.position;
        for (let k = 0; k < pa.count; k++) { const x = pa.getX(k), y = pa.getY(k), z = pa.getZ(k); const j = 1 + (K.vnoise(x * 30 + i, z * 30 + y * 20, seed) - 0.5) * 0.5; pa.setXYZ(k, x * j, y * j * 0.85, z * j); }
        const a = R() * 6.28, rr = i === 0 ? 0 : 0.1 + R() * 0.08;
        g.translate(Math.cos(a) * rr, 0.6 + R() * 0.25 + (i === 0 ? 0.12 : 0), Math.sin(a) * rr);
        parts.push([g, new T.Color("#34573a").multiplyScalar(0.7 + R() * 0.45)]);
      }
      return vcGeo(parts, seed);
    }
    function trees(list, o) {
      o = o || {};
      const geos = [conifer(5, 5), conifer(17, 6), broadleaf(29), broadleaf(41)];
      const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, envMapIntensity: 0.3 });
      m.onBeforeCompile = windPatch; m.customProgramCacheKey = () => "st_wind";
      const dm = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking }); dm.onBeforeCompile = windPatch; dm.customProgramCacheKey = () => "st_windDepth";
      const lists = [[], [], [], []], d = new T.Object3D(), R = rng(o.seed || 77);
      for (const [x, y, z, h, kind] of list) {
        const k = kind != null ? kind : Math.floor(R() * 4);
        d.position.set(x, y - 0.3, z); d.rotation.set((R() - 0.5) * 0.05, R() * 6.28, (R() - 0.5) * 0.05);
        const wv = k >= 2 ? h * (1.0 + R() * 0.3) : h * (0.85 + R() * 0.3);
        d.scale.set(wv, h, wv); d.updateMatrix(); lists[k].push(d.matrix.clone());
      }
      return lists.map((L, i) => {
        if (!L.length) return null;
        const im = new T.InstancedMesh(geos[i], m, L.length); L.forEach((mx, k) => im.setMatrixAt(k, mx));
        im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.customDepthMaterial = dm; im.frustumCulled = false;
        scene.add(im); return im;
      });
    }

    // ---------------------------------------------------------------- red eyes (pairs; spread -> gathered; still or blinking)
    function eyes(n, place, o) {
      o = o || {};
      const em = glow("#ff2412", 16, { fog: false }), eg = new T.SphereGeometry(o.r || 0.06, 8, 6), grp = G({}), list = [], R = rng(o.seed || 909);
      for (let i = 0; i < n; i++) {
        const p = G({}, grp), l = M(eg, em, { x: -(o.sep || 0.06), cast: false }, p), r = M(eg, em, { x: o.sep || 0.06, cast: false }, p);
        const q = place(R, i); list.push(Object.assign({ p, appear: R(), ph: R() * 10 }, q));
      }
      function set(t, s) {
        grp.visible = s.k > 0.001; if (!grp.visible) return;
        em.color.set("#ff2412").multiplyScalar(16 * (s.I != null ? s.I : 1));
        const lk = s.look || [0, 0];
        for (const e of list) {
          const on = s.k > e.appear, bl = s.blink && Math.sin(t * 2.2 + e.ph) > 0.86;
          e.p.visible = on && !bl;
          const g = s.gather || 0;
          e.p.position.set(lerp(e.a[0], e.b[0], g), lerp(e.a[1], e.b[1], g), lerp(e.a[2], e.b[2], g));
          e.p.lookAt(lk[0], e.p.position.y, lk[1]); e.p.scale.setScalar(s.scale || 1);
        }
      }
      return { grp, list, set, mat: em };
    }

    // ---------------------------------------------------------------- framed pictures
    function frame(parent, tex, w, h, o) {
      o = o || {};
      const g = G({ x: o.x || 0, y: o.y || 0, z: o.z || 0, ry: o.ry || 0, rx: o.rx || 0 }, parent);
      const fm = o.frameM || mat(o.col || "#8a6a34", { metal: o.metal != null ? o.metal : 0.4, rough: 0.4 });
      const b = o.border || Math.min(w, h) * 0.08, dd = o.depth || 0.03;
      M(K.box(w + b * 2, b, dd), fm, { y: h / 2 + b / 2 }, g); M(K.box(w + b * 2, b, dd), fm, { y: -h / 2 - b / 2 }, g);
      M(K.box(b, h, dd), fm, { x: -w / 2 - b / 2 }, g); M(K.box(b, h, dd), fm, { x: w / 2 + b / 2 }, g);
      M(K.box(w, h, 0.004), mat("#ffffff", { map: tex, rough: o.rough != null ? o.rough : 0.75 }), { z: -dd * 0.2, cast: false }, g);
      return g;
    }

    // ---------------------------------------------------------------- per frame
    K.onRender((st, t, cam) => {
      U.t.value = t;
      windU.uWind.value = st.wind != null ? st.wind : 0.012;
      flameU.k.value = st.candleK != null ? st.candleK : 1; flameU.gut.value = st.gutter || 0;
      waxM.emissiveIntensity = 0.06 * (st.candleK != null ? st.candleK : 1);
      for (const m of mists) m.material.uniforms.k.value = st.mistK != null ? st.mistK : 1;
    });
    // finish(): after every candle is placed and after the world module (and the film) registered their own per-frame
    // hooks: builds the instanced flames and registers the mirror pass last, so the reflection sees this frame's state
    let finished = false;
    function finish() {
      if (finished) return; finished = true;
      buildFlames();
      // flames that are out (st.flameOut = [tag, …]): scaled to 0 in the instanced meshes
      const dd = new T.Object3D(), vv = new T.Vector3();
      K.onRender((st, t, cam) => {
        if (flameMesh) { let dirty = false; const out = st.flameOut || [];
          flames.forEach((f, i) => { const on = f.tag && out.indexOf(f.tag) >= 0 ? 0 : 1; if (on !== f.on) { f.on = on; dirty = true; dd.position.fromArray(f.world); dd.scale.setScalar(f.s * on + 1e-6); dd.updateMatrix(); flameMesh.setMatrixAt(i, dd.matrix); haloMesh.setMatrixAt(i, dd.matrix); } });
          if (dirty) { flameMesh.instanceMatrix.needsUpdate = true; haloMesh.instanceMatrix.needsUpdate = true; } }
        for (const W of waters) mirrorPass(W, cam, st.mirror || 0);
        void vv;
      });
    }
    // bake(group, skip): merge the static meshes under `group` that share a material into one mesh per material (kept in
    // the group, so its visibility and transform still apply); `skip` = groups/meshes left alone (moving or toggled parts)
    function bake(group, skip) {
      skip = skip || [];
      group.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(group.matrixWorld).invert();
      const buckets = new Map(), kill = [];
      group.traverse((o) => {
        if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.morphTargetInfluences) return;
        for (let a = o; a && a !== group; a = a.parent) { if (skip.indexOf(a) >= 0) return; if (a !== o && !a.visible) return; }
        if (!o.visible) return;
        const key = o.material.uuid + (o.castShadow ? "c" : "n") + (o.receiveShadow ? "r" : "n") + (K.noDepth.indexOf(o) >= 0 ? "d" : "") + (o.renderOrder || 0);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(o);
      });
      let n = 0;
      for (const [, list] of buckets) {
        if (list.length < 2) continue;
        const geos = list.map((o) => { const g = o.geometry.clone(); g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld)); if (!g.attributes.uv) g.setAttribute("uv", new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; });
        const mg = merge(T, geos), o0 = list[0];
        const m = new T.Mesh(mg, o0.material); m.castShadow = o0.castShadow; m.receiveShadow = o0.receiveShadow; m.renderOrder = o0.renderOrder; group.add(m);
        if (K.noDepth.indexOf(o0) >= 0) K.noDepth.push(m);
        list.forEach((o) => kill.push(o)); n += list.length;
      }
      kill.forEach((o) => o.parent && o.parent.remove(o));
      return n;
    }
    const X = { U, bake, stoneM, rockM, conglomM, plankM, plasterM, candle, candelabra, buildFlames, finish, flames, mist, mists, water, waters, trees, eyes, frame, merge: (g) => merge(T, g), waxM, haloT };
    K._stone = X;
    return X;
  }

  // ---------------------------------------------------------------- hair builders for the Hazel rig (head-local, the rig's head proportions)
  function hairMat(K, o, key) {
    const T = K.T, nm = K.normals();
    const col = K.canvasTex("hcol_" + key, 256, 32, (g, w, h) => {
      const R = K.rng(23); g.fillStyle = o.col; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { const v = R(); g.fillStyle = v < 0.45 ? o.streaks[0] : v < 0.8 ? o.streaks[1] : o.streaks[2]; g.fillRect(R() * w, 0, 1 + R() * 2, h); }
    }, { repeat: true });
    return K.pmat("#ffffff", { rough: o.rough || 0.45, sheen: 0.8, sheenColor: o.sheen || "#ffd9a0", sheenRough: 0.35, normalMap: K.nmap(nm.strand, o.nrx || 1, o.nry || 1), ns: o.ns || 0.25, map: col });
  }
  function hide(hz) {
    hz.head.traverse((ob) => { if (ob.isMesh && (ob.material === hz.mats.hairM || ob.material === hz.mats.hairTubeM)) ob.visible = false; });
    hz.pony.visible = false;
  }
  // the head's outer surface at azimuth az (0 = front, + toward her left) and height y (head-centre coords, y up), pushed out by `out`
  function headPt(hz, az, y, out) {
    const FC = hz.FC || { w: 0.92, len: 1.12 };
    const yy = clamp(y / (0.1 * FC.len), -1, 1), r = Math.sqrt(Math.max(0, 1 - yy * yy));
    const back = Math.cos(az) < 0 ? 1.1 : 0.985;
    return [Math.sin(az) * r * 0.1 * FC.w * (1 + out), y * (1 + out * 0.6), Math.cos(az) * r * 0.1 * (Math.cos(az) < 0 ? back : 1) * (1 + out)];
  }
  function curls(K, hz, o) {
    const T = K.T, M = K.M, R = K.rng(o.seed || 314), FC = hz.FC || { w: 0.92, len: 1.12 };
    const hm = hairMat(K, o, "curls" + o.col);
    hide(hz);
    const head = hz.head, HY = 0.1;    // head centre is 0.1 above the head group's origin
    // the crown: a hairline-cut sphere with a big, bumpy curl volume
    const g = new T.SphereGeometry(1, 72, 54), pa = g.attributes.position, keep = new Uint8Array(pa.count);
    const line = o.bob ? (az) => { const a = Math.abs(az); return a < 0.5 ? lerp(0.6, 0.54, a / 0.5) : a < 1.25 ? lerp(0.54, -0.1, ss((a - 0.5) / 0.75)) : lerp(-0.1, -0.55, ss((a - 1.25) / 1.2)); }
      : (az) => { const a = Math.abs(az); return a < 0.5 ? lerp(0.62, 0.56, a / 0.5) : a < 1.3 ? lerp(0.56, 0.2, (a - 0.5) / 0.8) : lerp(0.2, -0.75, ss((a - 1.3) / 1.6)); };
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), az = Math.atan2(x, z);
      keep[i] = y > line(az) ? 1 : 0;
      const bump = (K.vnoise(x * 9 + 3, y * 9 + z * 7, 5) - 0.5) * 0.16 + (K.vnoise(x * 22, y * 22 - z * 15, 6) - 0.5) * 0.08;
      const vol = (o.vol || 0.3) * (0.55 + 0.45 * ss((0.75 - y) / 1.2)) * (o.bob ? 1 + 0.15 * ss((0.1 - y) / 0.6) * ss(Math.abs(az) - 0.8) : 1) + bump * 1.4 + 0.06 * ss((-z - 0.2) * 2);
      pa.setXYZ(i, x * 0.1 * FC.w * (1 + vol), y * 0.1 * FC.len * (1 + vol * 0.7) + 0.006, z * 0.1 * (z < 0 ? 1.1 : 0.99) * (1 + vol));
    }
    const ix = g.index.array, out = []; for (let i = 0; i < ix.length; i += 3) if (keep[ix[i]] && keep[ix[i + 1]] && keep[ix[i + 2]]) out.push(ix[i], ix[i + 1], ix[i + 2]);
    g.setIndex(out); g.computeVertexNormals();
    M(g, hm, { y: HY }, head);
    // ringlets: spiral tubes hanging from the hairline at the sides and back, to about the jaw/shoulder
    const tubes = [];
    const N = o.n || 46;
    for (let i = 0; i < N; i++) {
      const az = lerp(0.95, Math.PI, (i % (N / 2)) / (N / 2 - 1)) * (i < N / 2 ? 1 : -1) + (R() - 0.5) * 0.08;
      const y0 = o.bob ? lerp(-0.005, -0.05, ss((Math.abs(az) - 1.0) / 1.4)) + (R() - 0.5) * 0.012 : lerp(0.03, -0.01, Math.abs(az) / Math.PI) + (R() - 0.5) * 0.02;
      const p0 = headPt(hz, az, y0, (o.vol || 0.3) * 0.75);
      const L = (o.len || 0.15) * (0.75 + R() * 0.45) * (Math.abs(az) < 1.3 ? 0.8 : 1);
      const coil = 0.009 + R() * 0.004, turns = 2.2 + R() * 1.2, ph = R() * 6.28;
      const outD = [Math.sin(az), 0, Math.cos(az)], tan = [Math.cos(az), 0, -Math.sin(az)];
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const u = k / 24, a = ph + u * turns * Math.PI * 2, spread = 0.018 * u + 0.006;
        const c = coil * (0.7 + 0.5 * u);
        pts.push([p0[0] + outD[0] * (spread + Math.cos(a) * c) + tan[0] * Math.sin(a) * c, p0[1] - u * L + HY, p0[2] + outD[2] * (spread + Math.cos(a) * c) + tan[2] * Math.sin(a) * c]);
      }
      tubes.push(K.tubeGeo(pts, 72, 6, (u) => (0.0085 + 0.003 * Math.sin(Math.PI * u)) * (1 - 0.45 * ss((u - 0.7) / 0.3))));
    }
    // small curls over the crown: half-sunk spheres (a soft, bumpy cloud) — tori read as worms at this scale
    for (let i = 0; i < (o.crown || 70); i++) {
      const az = (R() - 0.5) * 2 * Math.PI, y = lerp(o.bob ? -0.05 : -0.02, 0.105, Math.pow(R(), 0.8));
      if (Math.abs(az) < (o.bob ? 0.95 : 0.75) && y < 0.064) continue;   // keep the face clear
      const out = (o.vol || 0.3) * (0.62 + (o.bob ? 0.12 * ss((0.01 - y) / 0.06) * ss(Math.abs(az) - 0.8) : 0));
      const p = headPt(hz, az, y, out), r = 0.011 + R() * 0.01;
      const sg = new T.SphereGeometry(r, 10, 8); sg.translate(p[0], p[1] + HY, p[2]); tubes.push(sg);
    }
    const merged = K._stone ? K._stone.merge(tubes) : null;
    const hmT = hairMat(K, Object.assign({}, o, { ns: 0.15 }), "curlsT" + o.col);
    if (merged) M(merged, hmT, {}, head); else tubes.forEach((tg) => M(tg, hmT, {}, head));
    // two loose curls by the cheeks at the front
    for (const s of [-1, 1]) {
      const p0 = headPt(hz, s * 0.95, 0.045, 0.22), pts = [];
      for (let k = 0; k <= 20; k++) { const u = k / 20, a = u * 4 * Math.PI + (s > 0 ? 1 : 0); pts.push([p0[0] + s * 0.004 + Math.cos(a) * 0.008, p0[1] + HY - u * 0.085, p0[2] + 0.004 + Math.sin(a) * 0.008]); }
      M(K.tubeGeo(pts, 50, 6, (u) => 0.007 * (1 - 0.4 * u)), hmT, {}, head);
    }
    return { mat: hm };
  }
  function bun(K, hz, o) {
    const T = K.T, M = K.M, FC = hz.FC || { w: 0.92, len: 1.12 };
    const hm = hairMat(K, o, "bun" + o.col);
    hide(hz);
    const head = hz.head, HY = 0.1;
    // sleek cap with a centre parting, combed back to the nape (fine mesh: the hairline is cut per vertex)
    const g = new T.SphereGeometry(1, 144, 108), pa = g.attributes.position, keep = new Uint8Array(pa.count);
    const line = (az) => { const a = Math.abs(az); const P = [[0, 0.72], [0.5, 0.65], [1.0, 0.5], [1.3, 0.22], [1.6, -0.12], [2.2, -0.58], [Math.PI, -0.76]];
      for (let i = 0; i < P.length - 1; i++) if (a <= P[i + 1][0]) return lerp(P[i][1], P[i + 1][1], (a - P[i][0]) / (P[i + 1][0] - P[i][0])); return -0.8; };
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), az = Math.atan2(x, z);
      keep[i] = y > line(az) ? 1 : 0;
      const part = Math.exp(-Math.pow(x / 0.035, 2)) * ss((z + 0.1) * 3) * ss((y - 0.4) * 4);
      const vol = 0.055 + 0.02 * ss((0.4 - y)) - 0.02 * part + 0.004 * Math.sin(az * 40 + y * 3);
      pa.setXYZ(i, x * 0.1 * FC.w * (1 + vol) * (1 - 0.12 * ss(-y * 1.2)), y * 0.1 * FC.len * (1 + vol) + 0.004, z * 0.1 * (z < 0 ? 1.1 : 0.985) * (1 + vol));
    }
    const ix = g.index.array, out = []; for (let i = 0; i < ix.length; i += 3) if (keep[ix[i]] && keep[ix[i + 1]] && keep[ix[i + 2]]) out.push(ix[i], ix[i + 1], ix[i + 2]);
    g.setIndex(out); g.computeVertexNormals();
    M(g, hm, { y: HY }, head);
    // the low bun at the nape: a coiled tube wound round a core
    const bunG = new T.Group(); bunG.position.set(0, HY - 0.052, -0.118); bunG.rotation.x = 0.35; head.add(bunG);
    M(new T.SphereGeometry(0.036, 24, 18), hm, { sz: 0.78 }, bunG);
    const pts = []; for (let k = 0; k <= 80; k++) { const u = k / 80, a = u * Math.PI * 2 * 2.6, r = 0.03 * (1 - 0.55 * u) + 0.006; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.9, -0.012 - 0.012 * Math.sin(Math.PI * u)]); }
    M(K.tubeGeo(pts, 140, 8, (u) => 0.013 * (1 - 0.5 * u)), hm, {}, bunG);
    M(new T.TorusGeometry(0.033, 0.004, 6, 24), K.pmat(o.tie || "#2b2420", { rough: 0.6 }), { z: 0.016 }, bunG);   // a plain band
    // two face-framing strands at the temples
    for (const s of [-1, 1]) {
      const p0 = headPt(hz, s * 0.62, 0.075, 0.06), pts2 = [];
      for (let k = 0; k <= 16; k++) { const u = k / 16; pts2.push([p0[0] + s * (0.006 + 0.012 * u), p0[1] + HY - u * 0.1, p0[2] - 0.004 - 0.012 * u + 0.006 * Math.sin(u * 6)]); }
      M(K.tubeGeo(pts2, 40, 6, (u) => 0.0045 * (1 - 0.6 * u), { squash: () => 0.5 }), hm, {}, head);
    }
    return { mat: hm, bun: bunG };
  }

  S.stone = stone;
  S.hair = { hide, curls, bun, headPt };
})();
