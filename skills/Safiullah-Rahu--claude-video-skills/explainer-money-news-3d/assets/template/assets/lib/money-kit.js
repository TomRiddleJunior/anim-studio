/* Money-news 3D kit v1 — photoreal-ish props for a seek-safe market-news reel (three.js r170, HyperFrames).
 *
 *   const K = MONEYKIT.create({ canvas, width: 1080, height: 1920, look: {} });
 *   K.render({ set: "warehouse" | "cabin" | "hangar" | "receipt" | "stacks" | "board", cam, look, fov, focus, aperture,
 *              exposure, mblur: [px, py], fade, flash, p: { …per-set params }, t });
 *
 * Sets (each a group with its own lights, fog, background and PMREM environment; only one is visible per frame):
 *   warehouse  endless aisles of banknote pallets under rows of LED strips; p.dark = z beyond which the lights are out
 *   cabin      a window seat at golden hour: oval window with a shade, the wing and engine outside, cloud deck below
 *   hangar     a wing on yellow assembly jigs in a dark factory, high-bay lamps with volumetric beams, haze, dust
 *   receipt    a thermal printer on a plaster wall feeding a long paper slip (p.feed lines printed, p.stamp 0..1)
 *   stacks     two stacks of banknote bricks under spotlights on glossy concrete (p.a, p.b = visible bricks)
 *   board      a split-flap departures board in a dark terminal; rows flip to DELAYED (p.flip 0..1, p.t)
 * Look: MeshStandardMaterial + per-set PMREM env, shadowed spot keys, exponential fog, additive light cones, dust;
 * post = MSAA HDR -> half-res bokeh DOF (scatter-as-gather) -> bloom -> directional motion blur -> ACES, grade,
 * vignette, film grain. Every frame is a pure function of the state passed to render(), so any frame seeks alone.
 * Banknotes are drawn here (a generic "100" note with a geometric seal: no real currency, portrait or text).
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const LOOK = Object.assign({ dofScale: 0.5, radScale: 0.9, maxCoC: 60, bloom: 0.14, sat: 0.92, vig: 0.34, warm: 0.0,
      contrast: 1.06, grain: 0.035 }, o.look || {});
    T.ColorManagement.enabled = true;
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true,
      powerPreference: "high-performance" });
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(30, W / H, 0.02, 400);

    // ------------------------------------------------------------------ helpers
    function std(hex, p) {
      p = p || {};
      const m = new T.MeshStandardMaterial({ color: hex, roughness: p.rough != null ? p.rough : 0.7, metalness: p.metal || 0 });
      if (p.map) m.map = p.map;
      if (p.rmap) m.roughnessMap = p.rmap;
      if (p.bump) { m.bumpMap = p.bump; m.bumpScale = p.bumpS || 1; }
      if (p.emi) { m.emissive = new T.Color(p.emi); m.emissiveIntensity = p.emiI != null ? p.emiI : 1; }
      if (p.emap) m.emissiveMap = p.emap;
      if (p.env != null) m.envMapIntensity = p.env;
      if (p.side != null) m.side = p.side;
      if (p.opacity != null) { m.transparent = true; m.opacity = p.opacity; m.depthWrite = false; }
      return m;
    }
    function glow(hex, hdr, p) {
      p = p || {};
      const m = new T.MeshBasicMaterial({ color: hex, map: p.map || null, side: p.side != null ? p.side : T.FrontSide, fog: !!p.fog });
      m.color.multiplyScalar(hdr == null ? 1 : hdr);
      if (p.opacity != null) { m.transparent = true; m.opacity = p.opacity; m.depthWrite = false; }
      if (p.add) { m.transparent = true; m.blending = T.AdditiveBlending; m.depthWrite = false; }
      return m;
    }
    function M(geo, m, p, parent) {
      p = p || {};
      const mesh = new T.Mesh(geo, m);
      mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
      mesh.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R);
      if (p.s != null) mesh.scale.setScalar(p.s);
      if (p.sx != null || p.sy != null || p.sz != null) mesh.scale.set(p.sx != null ? p.sx : 1, p.sy != null ? p.sy : 1, p.sz != null ? p.sz : 1);
      mesh.castShadow = !!p.cast;
      mesh.receiveShadow = p.receive !== false;
      (parent || scene).add(mesh);
      return mesh;
    }
    function G(parent, p) {
      p = p || {};
      const g = new T.Group();
      g.position.set(p.x || 0, p.y || 0, p.z || 0);
      g.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R);
      (parent || scene).add(g);
      return g;
    }
    const box = (w, h, d) => new T.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, n, open) => new T.CylinderGeometry(rt, rb, h, n || 24, 1, !!open);
    function rrect(w, h, r) {
      const s = new T.Shape(), x = -w / 2, y = -h / 2;
      r = Math.min(r, w / 2, h / 2);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    const texCache = {};
    function canvasTex(key, w, h, draw, opt) {
      if (texCache[key]) return texCache[key];
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      draw(cv.getContext("2d"), w, h);
      const t = new T.CanvasTexture(cv);
      t.colorSpace = opt && opt.linear ? T.NoColorSpace : T.SRGBColorSpace;
      t.anisotropy = ANISO;
      if (opt && opt.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
      t.userData.canvas = cv;
      texCache[key] = t;
      return t;
    }
    function speckle(g, w, h, n, seed, a0, a1, c) {
      const r = rng(seed);
      for (let i = 0; i < n; i++) {
        g.fillStyle = `rgba(${c},${(a0 + r() * (a1 - a0)).toFixed(3)})`;
        const s = 0.6 + r() * 2.2;
        g.fillRect(r() * w, r() * h, s, s);
      }
    }
    function blotches(g, w, h, n, seed, rad, col) {
      const r = rng(seed);
      for (let i = 0; i < n; i++) {
        const x = r() * w, y = r() * h, rr = rad * (0.3 + r());
        const gr = g.createRadialGradient(x, y, 0, x, y, rr);
        gr.addColorStop(0, col.replace("A", (0.05 + r() * 0.12).toFixed(3)));
        gr.addColorStop(1, col.replace("A", "0"));
        g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
    }

    // ------------------------------------------------------------------ banknote textures (generic, drawn here)
    function drawNote(g, x, y, w, h, seed) {
      const r = rng(seed);
      const gr = g.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, "#d3d8b8"); gr.addColorStop(0.5, "#bfc9a2"); gr.addColorStop(1, "#cdd3b0");
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.strokeStyle = "rgba(38,74,48,0.8)"; g.lineWidth = Math.max(1.5, w * 0.018);
      g.strokeRect(x + w * 0.035, y + h * 0.07, w * 0.93, h * 0.86);
      g.strokeStyle = "rgba(60,96,70,0.22)"; g.lineWidth = 1;
      for (let k = 0; k < 9; k++) { // guilloche waves
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
          const u = i / 40, yy = y + h * (0.18 + k * 0.08) + Math.sin(u * 18 + k) * h * 0.03;
          i ? g.lineTo(x + w * (0.06 + u * 0.88), yy) : g.moveTo(x + w * 0.06, yy);
        }
        g.stroke();
      }
      const cx = x + w * 0.5, cy = y + h * 0.5, rr = h * 0.3; // central geometric seal (no portrait)
      g.fillStyle = "rgba(205,214,186,0.95)"; g.beginPath(); g.ellipse(cx, cy, rr * 1.15, rr, 0, 0, 7); g.fill();
      g.strokeStyle = "rgba(48,80,58,0.7)"; g.lineWidth = Math.max(1, w * 0.01);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy, rr * (1.1 - k * 0.22), rr * (0.95 - k * 0.2), 0, 0, 7); g.stroke(); }
      g.beginPath();
      for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, q = i % 2 ? 0.25 : 0.55; g.lineTo(cx + Math.cos(a) * rr * q, cy + Math.sin(a) * rr * q); }
      g.closePath(); g.stroke();
      g.fillStyle = "rgba(28,62,40,0.95)";
      g.font = `700 ${Math.round(h * 0.3)}px Georgia, serif`;
      g.textBaseline = "middle"; g.textAlign = "left"; g.fillText("100", x + w * 0.06, y + h * 0.26);
      g.textAlign = "right"; g.fillText("100", x + w * 0.94, y + h * 0.76);
      g.fillStyle = "rgba(150,70,60,0.55)"; g.font = `600 ${Math.round(h * 0.09)}px monospace`; g.textAlign = "left";
      g.fillText("LL " + String(Math.floor(r() * 9e6) + 1e6), x + w * 0.62, y + h * 0.2);
    }
    const noteTop = () => canvasTex("noteTop", 1024, 1024, (g, w, h) => {
      g.fillStyle = "#b7b48f"; g.fillRect(0, 0, w, h);
      const cols = 6, rows = 12, nw = w / cols, nh = h / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        drawNote(g, i * nw + 2, j * nh + 2, nw - 4, nh - 4, i * 31 + j * 7 + 1);
        g.fillStyle = "#d9b13b"; g.fillRect(i * nw + nw * 0.44, j * nh + 1, nw * 0.12, nh - 2); // paper strap
        g.fillStyle = "rgba(120,90,20,0.35)"; g.fillRect(i * nw + nw * 0.44, j * nh + 1, 2, nh - 2);
        g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(i * nw, j * nh + nh - 2, nw, 2); g.fillRect(i * nw + nw - 2, j * nh, 2, nh);
      }
      speckle(g, w, h, 2500, 5, 0.02, 0.08, "40,40,20");
    });
    const noteSide = () => canvasTex("noteSide", 1024, 1024, (g, w, h) => {
      const layers = 14, lh = h / layers, cols = 6, cw = w / cols;
      const r = rng(9);
      for (let j = 0; j < layers; j++) for (let i = 0; i < cols; i++) {
        const x = i * cw, y = j * lh;
        g.fillStyle = "#b9bc98"; g.fillRect(x, y, cw, lh);
        for (let k = 0; k < lh; k += 2) { g.fillStyle = `rgba(90,96,70,${(0.12 + r() * 0.2).toFixed(2)})`; g.fillRect(x, y + k, cw, 1); }
        g.fillStyle = "#d4ac36"; g.fillRect(x + cw * 0.44, y, cw * 0.12, lh); // strap wraps the side
        g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(x, y + lh - 3, cw, 3); g.fillRect(x + cw - 2, y, 2, lh);
      }
      speckle(g, w, h, 1500, 6, 0.03, 0.1, "30,30,20");
    });
    const woodTex = () => canvasTex("wood", 512, 128, (g, w, h) => {
      g.fillStyle = "#6e5236"; g.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(40,25,12,${(0.1 + r() * 0.25).toFixed(2)})`; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + r() * 8 - 4, w * 0.6, y + r() * 8 - 4, w, y + r() * 6 - 3); g.stroke(); }
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(w * 0.08, h * 0.35, w * 0.25, h * 0.65); g.fillRect(w * 0.67, h * 0.35, w * 0.25, h * 0.65);
    });
    const concrete = (key, base, rep) => canvasTex(key, 1024, 1024, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      blotches(g, w, h, 70, 11, 140, "rgba(0,0,0,A)");
      blotches(g, w, h, 50, 12, 120, "rgba(255,255,255,A)");
      speckle(g, w, h, 30000, 13, 0.03, 0.12, "0,0,0");
      speckle(g, w, h, 12000, 14, 0.02, 0.08, "255,255,255");
      g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 2; g.strokeRect(0, 0, w, h); // slab joints
    }, { repeat: rep || [8, 8] });
    const roughTex = () => canvasTex("rough", 512, 512, (g, w, h) => {
      g.fillStyle = "#9a9a9a"; g.fillRect(0, 0, w, h);
      blotches(g, w, h, 60, 21, 90, "rgba(255,255,255,A)");
      blotches(g, w, h, 60, 22, 70, "rgba(0,0,0,A)");
    }, { repeat: [6, 6], linear: true });

    // ------------------------------------------------------------------ shared FX: light cones, dust
    function beamMat(hex, I) {
      return new T.ShaderMaterial({
        uniforms: { col: { value: new T.Color(hex) }, I: { value: I }, fade: { value: 1 } },
        vertexShader: `varying float vV; varying vec3 vN; varying vec3 vVd;
          void main(){ vV = uv.y; vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal);
            vVd = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: `uniform vec3 col; uniform float I, fade; varying float vV; varying vec3 vN; varying vec3 vVd;
          void main(){ float e = abs(dot(normalize(vN + vec3(1e-5)), normalize(vVd + vec3(1e-5)))); float a = pow(clamp(vV, 0.0, 1.0), 1.6) * pow(clamp(e, 0.0, 1.0), 1.8) * I * fade;
            gl_FragColor = vec4(col * a, 1.0); }`,
        transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false,
      });
    }
    function beam(parent, pos, len, r0, r1, hex, I) { // cone hanging down from pos, apex at top (uv.y = 1 at the top)
      const g = cyl(r0, r1, len, 32, true);
      g.translate(0, -len / 2, 0);
      const m = M(g, beamMat(hex, I), { x: pos[0], y: pos[1], z: pos[2], receive: false }, parent);
      m.renderOrder = 5;
      return m;
    }
    function dust(parent, n, box3, seed, size, hex) {
      const r = rng(seed), pos = new Float32Array(n * 3), ph = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = lerp(box3[0], box3[3], r()); pos[i * 3 + 1] = lerp(box3[1], box3[4], r()); pos[i * 3 + 2] = lerp(box3[2], box3[5], r());
        ph[i] = r() * 100;
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3));
      g.setAttribute("ph", new T.BufferAttribute(ph, 1));
      const m = new T.ShaderMaterial({
        uniforms: { t: { value: 0 }, sz: { value: size }, col: { value: new T.Color(hex) } },
        vertexShader: `attribute float ph; uniform float t, sz; varying float vA;
          void main(){ vec3 p = position + vec3(sin(t*0.21+ph)*0.35, sin(t*0.13+ph*1.7)*0.25 + t*0.02, cos(t*0.17+ph)*0.35);
            vec4 mv = modelViewMatrix * vec4(p,1.0); gl_PointSize = sz * 900.0 / -mv.z; vA = 0.5 + 0.5*sin(ph*3.1 + t*0.7);
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 col; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q);
            float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(col * a, 1.0); }`,
        transparent: true, blending: T.AdditiveBlending, depthWrite: false,
      });
      const p = new T.Points(g, m);
      p.frustumCulled = false;
      parent.add(p);
      return p;
    }
    // darken everything beyond a world-z threshold (the "lights go out row by row" effect)
    function darkZ(mat, U) {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uDarkZ = U.z; sh.uniforms.uDarkK = U.k;
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPz;")
          .replace("#include <project_vertex>", `#include <project_vertex>
            vec4 wpz = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              wpz = instanceMatrix * wpz;
            #endif
            vWPz = (modelMatrix * wpz).xyz;`);
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPz; uniform float uDarkZ, uDarkK;")
          .replace("#include <dithering_fragment>", `#include <dithering_fragment>
            gl_FragColor.rgb *= mix(1.0, uDarkK, 1.0 - smoothstep(uDarkZ - 1.5, uDarkZ + 1.5, vWPz.z));`);
      };
      mat.customProgramCacheKey = () => "darkZ";
    }
    // planar floor reflection (half-res mirror render) blended into a standard material by roughness
    const reflRT = new T.WebGLRenderTarget(Math.round(W / 2), Math.round(H / 2), { type: T.HalfFloatType, samples: 2 });
    const mirrorCam = new T.PerspectiveCamera();
    function reflective(mat, Uref) {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.tRefl = { value: reflRT.texture }; sh.uniforms.uReflK = Uref; sh.uniforms.uTexM = { value: textureMatrix };
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uTexM; varying vec4 vRefUv;")
          .replace("#include <project_vertex>", "#include <project_vertex>\nvRefUv = uTexM * modelMatrix * vec4(transformed, 1.0);");
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D tRefl; uniform float uReflK; varying vec4 vRefUv;")
          .replace("#include <dithering_fragment>", `#include <dithering_fragment>
            vec2 ruv = vRefUv.xy / vRefUv.w;
            vec3 rc = vec3(0.0);
            for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) rc += texture2D(tRefl, ruv + vec2(float(i), float(j)) * 0.0022).rgb;
            rc /= 25.0;
            float fres = 0.3 + 0.7 * pow(1.0 - clamp(dot(normalize(-vViewPosition), normal), 0.0, 1.0), 4.0);
            gl_FragColor.rgb += rc * uReflK * fres;`);
      };
      mat.customProgramCacheKey = () => "refl";
    }
    const textureMatrix = new T.Matrix4();
    function renderMirror(floorY, hideList) {
      // mirror the camera about the plane y = floorY and render the scene into reflRT
      mirrorCam.copy(camera);
      mirrorCam.position.set(camera.position.x, 2 * floorY - camera.position.y, camera.position.z);
      const tgt = new T.Vector3(); camera.getWorldDirection(tgt);
      tgt.y = -tgt.y;
      mirrorCam.up.set(0, -1, 0);
      mirrorCam.lookAt(mirrorCam.position.clone().add(tgt));
      mirrorCam.up.set(0, 1, 0);
      mirrorCam.updateMatrixWorld(); mirrorCam.updateProjectionMatrix();
      textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      textureMatrix.multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
      // oblique clip would be ideal; objects below the floor are not part of these sets
      hideList.forEach((m) => (m.visible = false));
      renderer.setRenderTarget(reflRT);
      renderer.render(scene, mirrorCam);
      hideList.forEach((m) => (m.visible = true));
    }

    // ------------------------------------------------------------------ environments (PMREM per set)
    const pmrem = new T.PMREMGenerator(renderer);
    function envMap(o) {
      const es = new T.Scene();
      const g = new T.SphereGeometry(10, 48, 24), pa = g.attributes.position, cols = [], c = new T.Color();
      const zen = new T.Color(o.zen), hor = new T.Color(o.hor), gnd = new T.Color(o.gnd);
      for (let i = 0; i < pa.count; i++) {
        const y = pa.getY(i) / 10;
        if (y > 0) c.copy(hor).lerp(zen, Math.pow(y, 0.5)); else c.copy(hor).lerp(gnd, Math.pow(-y, 0.4));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      es.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
      (o.panels || []).forEach((p) => {
        const m = new T.Mesh(new T.PlaneGeometry(p.w || 3, p.h || 3), new T.MeshBasicMaterial({ color: new T.Color(p.col).multiplyScalar(p.I || 4), side: T.DoubleSide }));
        m.position.fromArray(p.pos); m.lookAt(0, 0, 0); es.add(m);
      });
      const tex = pmrem.fromScene(es, 0.03).texture;
      return tex;
    }

    // ================================================================== SETS
    const SETS = {};
    function makeSet(name, cfg) {
      const g = G(scene); g.visible = false;
      SETS[name] = Object.assign({ name, g, update: () => {} }, cfg);
      return SETS[name];
    }

    // ------------------------------------------------------------------ 1) warehouse of banknote pallets
    (function warehouse() {
      const S = makeSet("warehouse", { bg: "#06080b", fog: ["#07090d", 0.034], env: envMap({ zen: "#24282e", hor: "#0d0f12", gnd: "#050506",
        panels: [{ pos: [0, 9, -3], col: "#fff4e0", I: 5, w: 8, h: 1 }, { pos: [0, 9, 4], col: "#fff4e0", I: 4, w: 8, h: 1 }] }), envI: 0.55 });
      const g = S.g;
      const U = { z: { value: -999 }, k: { value: 0.05 } };
      const floorM = std("#55575a", { map: concrete("cWare", "#5a5c5e", [14, 40]), rough: 0.62, rmap: roughTex(), env: 0.6 });
      darkZ(floorM, U);
      M(new T.PlaneGeometry(40, 140), floorM, { rx: -90, z: -50 }, g);
      const topM = std("#ffffff", { map: noteTop(), rough: 0.78, env: 0.5 });
      const sideM = std("#ffffff", { map: noteSide(), rough: 0.85, env: 0.4 });
      [topM, sideM].forEach((m) => darkZ(m, U));
      const PW = 1.25, PH = 1.05, PD = 1.25;
      const pg = box(PW, PH, PD); pg.translate(0, PH / 2 + 0.14, 0);
      const mats = [sideM, sideM, topM, sideM, sideM, sideM];
      const xs = [-6.9, -5.55, -4.2, -2.85, -1.5, 1.5, 2.85, 4.2, 5.55, 6.9];
      const zs = []; for (let z = 3; z > -90; z -= 1.42) zs.push(z);
      const n = xs.length * zs.length;
      const inst = new T.InstancedMesh(pg, mats, n);
      const base = new T.InstancedMesh(box(PW * 0.98, 0.14, PD * 0.98).translate(0, 0.07, 0), (() => { const m = std("#ffffff", { map: woodTex(), rough: 0.9, env: 0.3 }); darkZ(m, U); return m; })(), n);
      const r = rng(77), mtx = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1);
      let k = 0;
      xs.forEach((x) => zs.forEach((z) => {
        const ry = (r() - 0.5) * 0.03, hh = 0.9 + (r() < 0.15 ? -0.25 : 0) + r() * 0.08;
        q.setFromEuler(new T.Euler(0, ry, 0)); sc.set(1, hh, 1);
        mtx.compose(new T.Vector3(x + (r() - 0.5) * 0.05, 0, z + (r() - 0.5) * 0.05), q, sc); inst.setMatrixAt(k, mtx);
        mtx.compose(new T.Vector3(x, 0, z), q, new T.Vector3(1, 1, 1)); base.setMatrixAt(k, mtx);
        k++;
      }));
      inst.castShadow = true; inst.receiveShadow = true; base.receiveShadow = true;
      g.add(inst, base);
      // ceiling: dark structure + rows of LED strips (instance colour = on/off)
      M(new T.PlaneGeometry(40, 140), std("#0b0c0e", { rough: 0.9 }), { rx: 90, y: 8.2, z: -50 }, g);
      const stripG = box(0.12, 0.05, 1.6);
      const stripM = new T.MeshBasicMaterial({ color: "#ffffff", fog: true });
      const sx = [-4.9, -1.6, 1.6, 4.9], sz = []; for (let z = 4; z > -90; z -= 3.6) sz.push(z);
      const strips = new T.InstancedMesh(stripG, stripM, sx.length * sz.length);
      k = 0; sx.forEach((x) => sz.forEach((z) => { mtx.makeTranslation(x, 8.0, z); strips.setMatrixAt(k, mtx); strips.setColorAt(k, new T.Color(6, 5.7, 5.2)); k++; }));
      g.add(strips);
      const stripZ = []; sx.forEach(() => sz.forEach((z) => stripZ.push(z)));
      // a few real lights near the camera path; their pools sell the "rows of light"
      const spots = [];
      [[0, 7.8, 1.5], [0, 7.8, -5.5], [0, 7.8, -12.5], [0, 7.8, -19.5]].forEach((p, i) => {
        const s = new T.SpotLight("#fff1dc", 0, 0, 52 * D2R, 0.75, 1.6);
        s.position.fromArray(p); s.target.position.set(p[0], 0, p[2] - 1.5);
        if (i < 2) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.camera.near = 1; s.shadow.camera.far = 14; }
        g.add(s, s.target); spots.push({ s, z: p[2], I: 160 });
      });
      const hemi = new T.HemisphereLight("#cfd6e2", "#1b1712", 0.5); g.add(hemi);
      const beams = [];
      [[0, 7.95, -2], [0, 7.95, -9], [0, 7.95, -16]].forEach((p) => beams.push(beam(g, p, 7.9, 0.15, 3.2, "#fff0d8", 0.05)));
      const motes = dust(g, 500, [-4, 0.5, -24, 4, 7.5, 3], 31, 0.012, "#fff3e0");
      S.update = (p) => {
        const dz = p.dark != null ? p.dark : -999;
        U.z.value = dz; U.k.value = p.darkK != null ? p.darkK : 0.06;
        for (let i = 0; i < stripZ.length; i++) strips.setColorAt(i, stripZ[i] < dz + 0.5 ? new T.Color(0.02, 0.02, 0.02) : new T.Color(6, 5.7, 5.2));
        strips.instanceColor.needsUpdate = true;
        spots.forEach((o) => (o.s.intensity = o.z < dz + 1.0 ? 0 : o.I * (p.lights != null ? p.lights : 1)));
        beams.forEach((b) => (b.material.uniforms.fade.value = b.position.z < dz + 1.0 ? 0 : 1));
        hemi.intensity = 0.5 * (dz > -6 ? 0.25 : 1);
        motes.material.uniforms.t.value = p.t || 0;
      };
    })();

    // ------------------------------------------------------------------ wing geometry (shared by cabin and hangar)
    // airfoil loft: root chord c0 at span 0 -> tip chord c1 at span L, quarter-chord sweep, dihedral, thickness t/c,
    // plus a canted winglet. Local axes: +x span (outboard), +z aft (chord), +y up. Leading edge at z = 0 at the root.
    function wingGeo(o) {
      o = Object.assign({ c0: 5.6, c1: 1.35, L: 15.5, sweep: 27, dih: 6, tc: 0.12, nc: 34, ns: 26, winglet: 1.6 }, o);
      const prof = [];
      for (let i = 0; i <= o.nc; i++) { // cosine spacing, upper surface TE->LE then lower LE->TE
        const a = (i / o.nc) * Math.PI * 2, x = 0.5 + 0.5 * Math.cos(a);
        const yt = 5 * o.tc * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
        const camber = 0.02 * Math.sin(Math.PI * x);
        prof.push([x, (a < Math.PI ? yt : -yt) + camber]);
      }
      const pos = [], uv = [], idx = [];
      const tanS = Math.tan(o.sweep * D2R), tanD = Math.tan(o.dih * D2R);
      const NS = o.ns + 8; // extra stations for the winglet
      for (let j = 0; j <= NS; j++) {
        let s, c, xs, ys, zs;
        if (j <= o.ns) {
          s = j / o.ns; c = lerp(o.c0, o.c1, s); const sp = s * o.L;
          xs = sp; ys = sp * tanD; zs = sp * tanS + 0.25 * (o.c0 - c);
        } else { // winglet: curve upward over winglet length
          const u = (j - o.ns) / 8, sp = o.L, a = u * 72 * D2R;
          c = lerp(o.c1, o.c1 * 0.45, u);
          xs = sp + Math.sin(a) * 0.28 * o.winglet; ys = sp * tanD + (1 - Math.cos(a)) * 0.28 * o.winglet + u * o.winglet * 0.75;
          zs = sp * tanS + 0.25 * (o.c0 - o.c1) + u * o.winglet * 0.55 + 0.25 * (o.c1 - c);
        }
        for (let i = 0; i <= o.nc; i++) {
          const [px, py] = prof[i];
          pos.push(xs, ys + py * c, zs + px * c);
          uv.push(px, j / NS);
        }
      }
      const R = o.nc + 1;
      for (let j = 0; j < NS; j++) for (let i = 0; i < o.nc; i++) {
        const a = j * R + i, b = a + 1, cc = a + R, d = cc + 1;
        idx.push(a, cc, b, b, cc, d);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }
    const panelTex = (key, base, line) => canvasTex(key, 1024, 1024, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      blotches(g, w, h, 40, 41, 160, "rgba(0,0,0,A)");
      g.strokeStyle = line; g.lineWidth = 2;
      for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(0, (i / 9) * h); g.lineTo(w, (i / 9) * h); g.stroke(); } // span-wise panel joints
      [0.12, 0.22, 0.62, 0.74, 0.88].forEach((u) => { g.beginPath(); g.moveTo(u * w, 0); g.lineTo(u * w, h); g.stroke(); });
      g.fillStyle = "rgba(0,0,0,0.22)";
      for (let i = 0; i < 1600; i++) g.fillRect(((i * 97) % 1000) + 12, ((i * 53) % 990) + 4, 2, 2); // rivets
    });
    function engine(parent, p) { // high-bypass nacelle on a pylon
      const e = G(parent, p);
      const L = 4.2, R0 = 1.05;
      const lp = []; for (let i = 0; i <= 20; i++) { const u = i / 20; lp.push(new T.Vector2(R0 * (1 - 0.12 * Math.pow(u, 2)) * (u < 0.06 ? 0.94 + u : 1), u * L)); }
      const nac = new T.LatheGeometry(lp, 48); nac.rotateX(Math.PI / 2);
      M(nac, std("#dfe2e6", { rough: 0.32, metal: 0.25, side: T.DoubleSide, env: 1.0 }), { cast: true }, e);
      M(new T.TorusGeometry(R0 * 0.97, 0.07, 12, 48), std("#b9bcc2", { rough: 0.2, metal: 0.9 }), {}, e);
      M(new T.CircleGeometry(R0 * 0.9, 48), std("#151619", { rough: 0.5, metal: 0.6 }), { z: 0.35, ry: 180 }, e);
      M(cyl(0.18, 0.05, 0.6, 24), std("#2a2b2e", { rough: 0.4, metal: 0.7 }), { z: 0.65, rx: -90 }, e); // spinner
      M(new T.CapsuleGeometry(0.2, 2.6, 6, 16), std("#d8dbdf", { rough: 0.35, metal: 0.2 }), { y: 0.95, z: 2.4, rx: 90, sx: 0.8, sz: 1.6, cast: true }, e); // pylon fairing
      return e;
    }

    // ------------------------------------------------------------------ 2) cabin window at golden hour
    (function cabin() {
      const S = makeSet("cabin", { bg: "#0a0c12", fog: ["#c79b78", 0.0016], env: envMap({ zen: "#4b6a9a", hor: "#f0b27a", gnd: "#2b2a33",
        panels: [{ pos: [-6, 1, -8], col: "#ffd2a0", I: 6, w: 5, h: 3 }] }), envI: 0.4 });
      const g = S.g;
      // sky dome + cloud deck (outside: -z)
      const sky = canvasTex("sky", 1024, 1024, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, "#2c4e86"); gr.addColorStop(0.38, "#6d8fbf"); gr.addColorStop(0.5, "#e9b389"); gr.addColorStop(0.54, "#f6c58e"); gr.addColorStop(0.62, "#c98b6c"); gr.addColorStop(1, "#5d5d70");
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
      });
      M(new T.SphereGeometry(300, 48, 24), glow("#ffffff", 1.25, { map: sky, side: T.BackSide }), { receive: false }, g);
      const cloud = canvasTex("clouds", 2048, 1024, (c, w, h) => {
        c.fillStyle = "rgba(0,0,0,0)"; c.clearRect(0, 0, w, h);
        const r = rng(51);
        for (let i = 0; i < 900; i++) {
          const x = r() * w, y = h * 0.15 + r() * h * 0.85, rr = 30 + r() * 120 * (y / h);
          const gr = c.createRadialGradient(x, y, 0, x, y, rr);
          const warm = r() < 0.5;
          gr.addColorStop(0, warm ? "rgba(255,220,190,0.45)" : "rgba(235,225,235,0.40)"); gr.addColorStop(1, "rgba(255,230,210,0)");
          c.fillStyle = gr; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
        }
      });
      const cm = glow("#ffffff", 1.05, { map: cloud }); cm.transparent = true; cm.depthWrite = false;
      M(new T.PlaneGeometry(900, 450), cm, { rx: -90, y: -60, z: -200, receive: false }, g);
      // the wing outside (airplane coords: window at origin, fuselage skin at z = -0.12, wing below and aft)
      const wingM = std("#ffffff", { map: panelTex("pWing", "#dadde2", "rgba(60,64,70,0.3)"), rough: 0.42, metal: 0.08, env: 0.9 });
      // wing group in wing-local axes (+x span outboard, +z chord aft, +y up), turned so the span runs away from the
      // window and a little left: from the seat the upper surface fills the lower window and the tip rises to the horizon
      const WG = G(g, { x: -0.3, y: -1.2, z: -1.35, ry: 112 });
      const wing = M(wingGeo({}), wingM, { cast: true }, WG);
      S.wing = wing; S.WG = WG;
      const leZ = (sp) => sp * Math.tan(27 * D2R) + 0.25 * (5.6 - lerp(5.6, 1.35, sp / 15.5));
      for (let i = 0; i < 4; i++) { // flap-track fairings under the trailing edge
        const sp = 2.6 + i * 3.0, c = lerp(5.6, 1.35, sp / 15.5);
        M(new T.CapsuleGeometry(0.15, 1.5, 4, 12), std("#c9ccd1", { rough: 0.4, metal: 0.15 }), { x: sp, y: sp * Math.tan(6 * D2R) - 0.22, z: leZ(sp) + c * 0.92, rx: 90, cast: true }, WG);
      }
      engine(WG, { x: 5.0, y: 5.0 * Math.tan(6 * D2R) - 1.45, z: leZ(5.0) - 2.6 });
      const sun = new T.DirectionalLight("#ffc890", 3.2); sun.position.set(18, 24, 12); sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
      sun.shadow.camera.far = 120; sun.shadow.bias = -0.0005; sun.target.position.set(0, -2, -8);
      g.add(sun, sun.target);
      M(new T.SphereGeometry(6, 24, 12), glow("#ffe2b0", 9), { x: -95, y: 26, z: -150, receive: false }, g); // the sun disc (blooms)
      // interior wall with the window opening (inside: +z)
      const wallG = new T.ExtrudeGeometry((() => { const s = rrect(1.6, 1.4, 0.04); s.holes.push(rrect(0.27, 0.37, 0.11)); return s; })(), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 18 });
      const wallM = std("#b9b4ab", { rough: 0.55, env: 0.6, map: canvasTex("plastic", 256, 256, (c, w, h) => { c.fillStyle = "#e9e5dd"; c.fillRect(0, 0, w, h); speckle(c, w, h, 4000, 61, 0.02, 0.06, "0,0,0"); }) });
      const wall = M(wallG, wallM, { z: -0.12, cast: true }, g);
      // window reveal + inner pane frame + scratched inner pane + outer glass tint
      const rev = new T.ExtrudeGeometry((() => { const s = rrect(0.31, 0.41, 0.13); s.holes.push(rrect(0.25, 0.35, 0.105)); return s; })(), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 18 });
      M(rev, std("#d9d4ca", { rough: 0.5 }), { z: -0.07, cast: true }, g);
      const scratch = canvasTex("scratch", 512, 512, (c, w, h) => {
        c.clearRect(0, 0, w, h); const r = rng(71); c.strokeStyle = "rgba(255,255,255,0.10)";
        for (let i = 0; i < 120; i++) { c.lineWidth = 0.5 + r(); c.beginPath(); const x = r() * w, y = r() * h; c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 30); c.stroke(); }
        const gr = c.createRadialGradient(w * 0.3, h * 0.25, 10, w * 0.3, h * 0.25, w * 0.7); gr.addColorStop(0, "rgba(255,240,220,0.10)"); gr.addColorStop(1, "rgba(255,240,220,0)");
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
      });
      const pane = M(new T.ShapeGeometry(rrect(0.25, 0.35, 0.105), 18), glow("#ffffff", 1, { map: scratch, add: true }), { z: -0.03, receive: false }, g);
      pane.renderOrder = 6;
      // the shade: slides down from the top of the opening (p.shade 0 = open, 1 = closed)
      const shadeM = std("#efebe3", { rough: 0.6, map: canvasTex("shade", 128, 256, (c, w, h) => { c.fillStyle = "#efebe3"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(0,0,0,0.06)"; for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 1); c.fillStyle = "#cfc9be"; c.fillRect(0, h - 18, w, 18); }) });
      const shade = M(new T.PlaneGeometry(0.25, 0.36), shadeM, { z: -0.045, cast: true }, g);
      // seat back + headrest edge in the foreground (fabric) + armrest
      const fab = canvasTex("fabric", 256, 256, (c, w, h) => { c.fillStyle = "#2f3a4c"; c.fillRect(0, 0, w, h); const r = rng(81); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,0,0"},${(0.03 + r() * 0.07).toFixed(2)})`; c.fillRect(r() * w, r() * h, 1.5, 1.5); } }, { repeat: [3, 3] });
      const seatM = std("#ffffff", { map: fab, rough: 0.95, env: 0.4 });
      M(new T.CapsuleGeometry(0.2, 0.75, 6, 18), seatM, { x: 0.62, y: -0.45, z: 0.62, rx: 6, cast: true }, g); // seat back (off frame right)
      M(box(0.08, 0.06, 0.55), std("#6f6a63", { rough: 0.5 }), { x: 0.0, y: -0.62, z: 0.3, cast: true }, g);
      // cabin practicals
      const reading = new T.SpotLight("#ffe7c4", 1.2, 0, 30 * D2R, 0.8, 2); reading.position.set(0.25, 0.9, 0.55); reading.target.position.set(0.1, -0.4, 0.2); g.add(reading, reading.target);
      const bounce = new T.PointLight("#ffbf8a", 0.35, 3, 2); bounce.position.set(-0.05, 0.05, 0.25); g.add(bounce);
      const hemi = new T.HemisphereLight("#9fb4d6", "#3a2a22", 0.12); g.add(hemi);
      S.update = (p) => {
        const sh = clamp(p.shade != null ? p.shade : 0.25, 0, 1);
        shade.scale.y = Math.max(0.001, sh); shade.position.y = 0.18 - 0.18 * sh;
        bounce.intensity = 0.35 * (1 - sh * 0.7) * (p.inside != null ? p.inside : 1);
        sun.intensity = 3.2 * (p.sun != null ? p.sun : 1);
      };
    })();

    // ------------------------------------------------------------------ 3) wing factory hangar
    (function hangar() {
      const S = makeSet("hangar", { bg: "#06080b", fog: ["#121820", 0.028], env: envMap({ zen: "#2a3442", hor: "#10141a", gnd: "#07080a",
        panels: [{ pos: [0, 9, 0], col: "#dfe8ff", I: 4, w: 10, h: 2 }] }), envI: 0.5 });
      const g = S.g;
      const floorM = std("#5c5f63", { map: concrete("cHang", "#57595c", [10, 10]), rough: 0.45, rmap: roughTex(), env: 0.7 });
      M(new T.PlaneGeometry(80, 80), floorM, { rx: -90 }, g);
      const lines = canvasTex("hlines", 1024, 1024, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(230,180,30,0.85)"; c.fillRect(w * 0.18, 0, 14, h); c.fillRect(w * 0.78, 0, 14, h); for (let y = 0; y < h; y += 64) { c.fillRect(w * 0.18 + 14, y, w * 0.6 - 14, 4); } });
      const lm = std("#ffffff", { map: lines, rough: 0.5 }); lm.transparent = true; lm.depthWrite = false;
      M(new T.PlaneGeometry(30, 30), lm, { rx: -90, y: 0.005, x: 4, z: -6 }, g);
      M(box(32, 20, 72), std("#15181d", { rough: 0.9, side: T.BackSide }), { x: 2, y: 10, z: 4.05 }, g);
      // wing in green primer on jigs (span along -z, leading edge toward -x)
      const wM = std("#ffffff", { map: panelTex("pPrimer", "#6f9a5e", "rgba(24,46,24,0.5)"), rough: 0.5, metal: 0.05, env: 0.8 });
      const wing = M(wingGeo({ winglet: 0.01 }), wM, { cast: true }, g);
      wing.position.set(1.0, 3.0, 4.0); wing.rotation.set(0, 90 * D2R, 0);
      S.wing = wing;
      const jigM = std("#e3b21f", { rough: 0.45, metal: 0.3, env: 0.8 });
      const greyM = std("#8a8f96", { rough: 0.5, metal: 0.6 });
      for (let i = 0; i < 6; i++) { // jig towers + clamps, placed from the wing planform (root z 4, span toward -z)
        const sp = 1 + i * 2.6, z = 4 - sp, c = lerp(5.6, 1.35, sp / 15.5);
        const xLE = 1.0 + sp * Math.tan(27 * D2R) + 0.25 * (5.6 - c), xTE = xLE + c, yW = 3.0 + sp * Math.tan(6 * D2R);
        const top = yW + 0.25; // side towers only: the upper surface stays open to the camera
        M(box(0.42, top, 0.42), jigM, { x: xLE - 0.75, y: top / 2, z, cast: true }, g);
        M(box(0.42, top, 0.42), jigM, { x: xTE + 0.75, y: top / 2, z, cast: true }, g);
        M(box(0.9, 0.14, 0.3), greyM, { x: xLE - 0.35, y: yW, z, cast: true }, g); // clamp arms reaching the edges
        M(box(0.9, 0.14, 0.3), greyM, { x: xTE + 0.35, y: yW, z, cast: true }, g);
        M(box(c + 1.9, 0.3, 0.4), jigM, { x: (xLE + xTE) / 2, y: 0.5, z, cast: true }, g); // floor rail
      }
      for (let i = 0; i < 3; i++) { // work platforms with rails
        const z = 1.5 - i * 5;
        M(box(1.6, 0.12, 3.6), greyM, { x: -1.4, y: 2.0, z, cast: true }, g);
        M(box(0.05, 1.0, 3.6), jigM, { x: -2.15, y: 2.55, z }, g);
        M(box(0.06, 2.0, 0.06), greyM, { x: -2.1, y: 1.0, z: z + 1.7 }, g); M(box(0.06, 2.0, 0.06), greyM, { x: -2.1, y: 1.0, z: z - 1.7 }, g);
      }
      // roof trusses + high-bay lamps with cones
      for (let i = 0; i < 9; i++) M(box(40, 0.4, 0.3), std("#22262c", { rough: 0.8 }), { y: 14, z: 8 - i * 5 }, g);
      for (let i = 0; i < 12; i++) { // clerestory windows on both long walls (cool daylight) + far end wall bays
        M(new T.PlaneGeometry(3.2, 1.6), glow("#9fb8d8", 1.6, { fog: true }), { x: 17.9, y: 11.5, z: 6 - i * 3.6, ry: -90, receive: false }, g);
        M(new T.PlaneGeometry(3.2, 1.6), glow("#9fb8d8", 1.3, { fog: true }), { x: -13.9, y: 11.5, z: 6 - i * 3.6, ry: 90, receive: false }, g);
      }

      const lamps = [];
      [[1, -0.5], [5, -2], [1, -8], [5, -9.5], [1, -15], [5, -17]].forEach(([x, z], i) => {
        M(cyl(0.45, 0.6, 0.35, 24), std("#30343a", { rough: 0.5, metal: 0.6 }), { x, y: 12.2, z }, g);
        M(new T.CircleGeometry(0.5, 24), glow("#eaf2ff", 7), { x, y: 12.02, z, rx: 90, receive: false }, g);
        const s = new T.SpotLight("#e6efff", 0, 0, 34 * D2R, 0.6, 1.4);
        s.position.set(x, 12, z); s.target.position.set(x, 0, z);
        if (i < 2) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.camera.near = 2; s.shadow.camera.far = 20; }
        g.add(s, s.target);
        lamps.push({ s, b: beam(g, [x, 12, z], 12, 0.4, 4.2, "#dfe9ff", 0.045), I: 420 });
      });
      const hemi = new T.HemisphereLight("#9fb2cc", "#1a1612", 0.28); g.add(hemi);
      const warm = new T.PointLight("#ffb36b", 0, 12, 2); warm.position.set(-1.5, 2.6, -3); g.add(warm); // a work light on the platform
      const motes = dust(g, 900, [-4, 0.5, -20, 8, 11, 6], 91, 0.02, "#dfe8ff");
      S.update = (p) => {
        const L = p.lights != null ? p.lights : 1;
        lamps.forEach((o, i) => { const on = clamp((L * lamps.length - i), 0, 1); o.s.intensity = o.I * on; o.b.material.uniforms.fade.value = on; });
        warm.intensity = 16 * (p.warm != null ? p.warm : 1);
        motes.material.uniforms.t.value = p.t || 0;
      };
    })();

    // ------------------------------------------------------------------ 4) receipt printer on a plaster wall
    const RC = { w: 768, lineH: 20, top: 300, n: 367, extra: 520 };
    RC.h = RC.top + RC.n * RC.lineH + RC.extra;
    (function receipt() {
      const S = makeSet("receipt", { bg: "#55524d", fog: null, env: envMap({ zen: "#bdb6aa", hor: "#7d776e", gnd: "#3a3631",
        panels: [{ pos: [-4, 6, 4], col: "#fff6ea", I: 3, w: 4, h: 4 }] }), envI: 0.8 });
      const g = S.g;
      const wallTex = canvasTex("plaster", 1024, 1024, (c, w, h) => { c.fillStyle = "#8e8a83"; c.fillRect(0, 0, w, h); blotches(c, w, h, 80, 101, 150, "rgba(0,0,0,A)"); blotches(c, w, h, 60, 102, 130, "rgba(255,255,255,A)"); speckle(c, w, h, 20000, 103, 0.02, 0.07, "0,0,0"); }, { repeat: [2, 4] });
      M(new T.PlaneGeometry(14, 30), std("#ffffff", { map: wallTex, rough: 0.92, env: 0.5 }), { z: -0.32, y: -10 }, g);
      // printer body + slot
      M(new T.ExtrudeGeometry(rrect(1.5, 0.55, 0.08), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }), std("#4a4c51", { rough: 0.42, metal: 0.25, env: 1.0 }), { y: 0.38, z: -0.3, cast: true }, g);
      M(box(0.5, 0.06, 0.02), std("#2c2e32", { rough: 0.6 }), { x: -0.35, y: 0.5, z: 0.235 }, g);           // label plate
      M(new T.CircleGeometry(0.025, 16), glow("#3dff8a", 4), { x: 0.55, y: 0.5, z: 0.236, receive: false }, g); // power LED
      M(box(1.12, 0.03, 0.05), glow("#060606", 1), { y: 0.11, z: 0.22 }, g);
      // paper: a long strip hanging from the slot, curling slightly toward camera at the bottom
      const paperTex = canvasTex("paper", RC.w, RC.h, (c, w, h) => {
        c.fillStyle = "#f2efe8"; c.fillRect(0, 0, w, h);
        speckle(c, w, h, 60000, 111, 0.015, 0.05, "60,50,40");
        c.fillStyle = "#26231f"; c.textBaseline = "middle";
        const mono = (sz, wt) => `${wt || 500} ${sz}px "Roboto Mono", "Courier New", monospace`;
        c.textAlign = "center";
        c.font = mono(46, 700); c.fillText("BOEING CO.", w / 2, 70);
        c.font = mono(24); c.fillStyle = "#57534c"; c.fillText("737 DELIVERIES", w / 2, 124); c.fillText("2026 · JAN 1 TO SEP 30", w / 2, 158);
        c.fillText("2026 TARGET: ABOUT 500", w / 2, 192);
        c.fillStyle = "#26231f"; c.fillRect(56, 240, w - 112, 3);
        c.textAlign = "left"; c.font = mono(19);
        for (let i = 0; i < RC.n; i++) {
          const y = RC.top + i * RC.lineH;
          c.fillStyle = "#6b665e"; c.fillText(String(i + 1).padStart(3, "0"), 70, y);
          c.fillStyle = "#26231f"; c.fillText("737 JET  ·  DELIVERED", 190, y);
          c.textAlign = "right"; c.fillText("1", w - 70, y); c.textAlign = "left";
        }
        let y = RC.top + RC.n * RC.lineH + 10;
        c.fillRect(56, y, w - 112, 3); y += 52;
        c.font = mono(28, 700); c.fillText("TOTAL", 70, y);
        c.font = '700 150px "Oswald", "Arial Narrow", sans-serif'; c.fillText("367", 66, y + 108);
        c.font = mono(26, 600); c.fillStyle = "#57534c"; c.fillText("TARGET   ~500", 420, y + 70); c.fillText("SHORT     133", 420, y + 116);
        c.textAlign = "center"; c.font = mono(20); c.fillText("THANK YOU", w / 2, y + 220);
        RC.totalY = y;
      });
      paperTex.anisotropy = ANISO; paperTex.minFilter = T.LinearMipmapLinearFilter;
      const PW = 1.0, PL = PW * RC.h / RC.w; // the slip is as long as its text (scene units ~ 8 cm per unit)
      const pg = new T.PlaneGeometry(PW, PL, 1, 160);
      const pa = pg.attributes.position;
      for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), u = (PL / 2 - y) / PL; pa.setZ(i, 0.02 + Math.sin(u * 37) * 0.012 + Math.pow(Math.max(0, u - 0.99) / 0.01, 2) * 0.3); pa.setY(i, y - PL / 2 + 0.1); }
      pg.computeVertexNormals();
      S.yOf = (cy) => 0.1 - (cy / RC.w) * PW;   // canvas y (px) -> scene y on the slip
      const paperM = std("#ffffff", { map: paperTex, rough: 0.85, env: 0.5, side: T.DoubleSide });
      const paper = M(pg, paperM, { z: 0.2, cast: true }, g);
      // red stamp decal (appears at the end)
      const stampTex = canvasTex("stamp", 1024, 384, (c, w, h) => {
        c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(205,30,36,0.92)"; c.lineWidth = 16; c.strokeRect(20, 20, w - 40, h - 40);
        c.fillStyle = "rgba(205,30,36,0.92)"; c.textAlign = "center"; c.textBaseline = "middle"; let fs = 170; do { c.font = '700 ' + fs + 'px "Oswald", sans-serif'; fs -= 4; } while (c.measureText("TARGET MISSED").width > w - 140 && fs > 60); c.fillText("TARGET MISSED", w / 2, h / 2 + 6);
        c.globalCompositeOperation = "destination-out"; speckle(c, w, h, 9000, 121, 0.3, 0.9, "0,0,0");
      });
      const stamp = M(new T.PlaneGeometry(0.92, 0.345), std("#ffffff", { map: stampTex, rough: 0.8, opacity: 1 }), { x: -0.02, z: 0.255, y: S.yOf(RC.totalY + 310), rz: -5, s: 0.8, receive: false }, g);
      stamp.material.transparent = true; stamp.renderOrder = 7;
      const key = new T.SpotLight("#fff3e2", 26, 0, 30 * D2R, 0.9, 1.4); key.position.set(-2.4, 3.2, 3.2); key.target.position.set(0, -1.6, 0); key.castShadow = true;
      S.key = key;
      key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.radius = 6; key.shadow.camera.near = 1; key.shadow.camera.far = 12;
      g.add(key, key.target);
      const fill = new T.HemisphereLight("#e8e2d8", "#3b362f", 0.6); g.add(fill);
      S.paper = paper;
      S.update = (p) => {
        const st = clamp(p.stamp || 0, 0, 1);
        stamp.visible = st > 0; stamp.scale.setScalar(lerp(1.6, 1, Math.pow(st, 0.6))); stamp.material.opacity = Math.min(1, st * 3);
      };
    })();

    // ------------------------------------------------------------------ 5) two stacks of banknote bricks
    (function stacks() {
      const S = makeSet("stacks", { bg: "#07080a", fog: ["#0a0c10", 0.045], env: envMap({ zen: "#262a31", hor: "#0e1014", gnd: "#050506",
        panels: [{ pos: [0, 9, 0], col: "#fff2dc", I: 4, w: 4, h: 4 }] }), envI: 0.5 });
      const g = S.g;
      const Uref = { value: 0.55 };
      const floorM = std("#3d4044", { map: concrete("cStack", "#3f4245", [6, 6]), rough: 0.38, rmap: roughTex(), env: 0.6 });
      reflective(floorM, Uref);
      const floor = M(new T.PlaneGeometry(40, 40), floorM, { rx: -90 }, g);
      S.floor = floor;
      const topM = std("#ffffff", { map: noteTop(), rough: 0.78, env: 0.5 }), sideM = std("#ffffff", { map: noteSide(), rough: 0.85, env: 0.4 });
      const BW = 1.25, BH = 0.62, BD = 1.25;
      const bricks = { a: [], b: [] };
      const bg = box(BW, BH, BD);
      [["a", -0.85, 3], ["b", 0.85, 6]].forEach(([k, x, n]) => {
        for (let i = 0; i < n; i++) {
          const h = k === "b" && i === n - 1 ? 0.5 : 1; // the last brick of b is half ($5.5B)
          const m = M(bg, [sideM, sideM, topM, sideM, sideM, sideM], { x, y: BH * h / 2 + i * BH, z: 0, sy: h, cast: true }, g);
          m.userData.h = h; bricks[k].push(m);
        }
      });
      // floor decals with the amounts (tile outline, like the source)
      function decal(txt, col, x) {
        const t = canvasTex("dec" + txt, 512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 14; c.strokeRect(16, 16, w - 32, h - 32); c.fillStyle = col; c.font = '700 150px "Oswald", "Arial Narrow", sans-serif'; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, h / 2); });
        const m = M(new T.PlaneGeometry(1.45, 1.45), glow("#ffffff", 1.6, { map: t, opacity: 1 }), { x, y: 0.004, z: 1.55, rx: -90, receive: false }, g);
        m.material.transparent = true; return m;
      }
      const dA = decal("$3B", "#f2c14e", -0.85), dB = decal("$5.5B", "#9fb6d8", 0.85);
      const spots = [];
      [[-0.85, "#fff0d6"], [0.85, "#dfe8ff"]].forEach(([x, c], i) => {
        const s = new T.SpotLight(c, 0, 0, 20 * D2R, 0.55, 1.4); s.position.set(x, 9, 1.2); s.target.position.set(x, 0, 0); s.castShadow = true;
        s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.camera.near = 3; s.shadow.camera.far = 14;
        g.add(s, s.target); spots.push({ s, b: beam(g, [x, 9, 1.2], 9, 0.1, 3.1, c, 0.06) });
      });
      const hemi = new T.HemisphereLight("#b9c4d6", "#15120e", 0.12); g.add(hemi);
      S.mirrorHide = [floor, dA, dB];
      S.update = (p) => {
        const a = p.a != null ? p.a : 3, b = p.b != null ? p.b : 6;
        const bounce = (u) => { const n1 = 7.5625, d1 = 2.75; if (u < 1 / d1) return n1 * u * u; if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + 0.75; if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + 0.9375; return n1 * (u -= 2.625 / d1) * u + 0.984375; };
        const place = (arr, n) => arr.forEach((m, i) => { const u = clamp(n - i, 0, 1); m.visible = u > 0; const rest = 0.62 * i + 0.62 * m.userData.h / 2; m.position.y = rest + (1 - bounce(u)) * 3.2; m.rotation.y = (1 - u) * 0.25 * (i % 2 ? 1 : -1); });
        place(bricks.a, a); place(bricks.b, b);
        const la = p.la != null ? p.la : 1, lb = p.lb != null ? p.lb : 1;
        spots[0].s.intensity = 330 * la; spots[0].b.material.uniforms.fade.value = la;
        spots[1].s.intensity = 330 * lb; spots[1].b.material.uniforms.fade.value = lb;
        dA.material.opacity = la; dB.material.opacity = lb;
        Uref.value = 0.55;
      };
    })();

    // ------------------------------------------------------------------ 6) split-flap departures board in a terminal
    (function board() {
      const S = makeSet("board", { bg: "#05060a", fog: ["#080a10", 0.05], env: envMap({ zen: "#1d2230", hor: "#0b0d12", gnd: "#040405",
        panels: [{ pos: [0, 3, 6], col: "#ffb347", I: 2, w: 6, h: 2 }, { pos: [0, 8, 0], col: "#cfe0ff", I: 2, w: 10, h: 1 }] }), envI: 0.6 });
      const g = S.g;
      const BWd = 1100, BHt = 1240;
      const cv = document.createElement("canvas"); cv.width = BWd; cv.height = BHt;
      const bt = new T.CanvasTexture(cv); bt.colorSpace = T.SRGBColorSpace; bt.anisotropy = ANISO;
      const CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-·";
      const ROWS = [["737-8", "DELAYED"], ["737-8", "DELAYED"], ["737-9", "DELAYED"], ["737-8", "DELAYED"], ["737-10", "DELAYED"], ["737-8", "DELAYED"], ["737-8", "DELAYED"], ["737-9", "DELAYED"]];
      const FROM = ["ON TIME", "ON TIME", "ON TIME", "ON TIME", "ON TIME", "ON TIME", "ON TIME", "ON TIME"];
      function drawBoard(t, flip) {
        const c = cv.getContext("2d");
        c.fillStyle = "#0b0c0f"; c.fillRect(0, 0, BWd, BHt);
        c.fillStyle = "#f2a93b"; c.font = '700 64px "Oswald", "Arial Narrow", sans-serif'; c.textBaseline = "middle";
        c.fillText("737 DELIVERIES", 56, 74); c.fillStyle = "#8b8f98"; c.font = '500 34px "Roboto Mono", monospace'; c.fillText("TYPE       STATUS", 56, 146);
        const cw = 54, chh = 104, x0 = 56, y0 = 196;
        ROWS.forEach((row, ri) => {
          const loc = clamp(flip * 1.8 - ri * 0.1, 0, 1);
          const target = loc >= 1 ? row[1] : FROM[ri];
          const txt = row[0].padEnd(7) + " " + target.padEnd(8);
          for (let k = 0; k < txt.length; k++) {
            const x = x0 + k * (cw + 8), y = y0 + ri * (chh + 22);
            c.fillStyle = "#16181d"; c.fillRect(x, y, cw, chh);
            c.fillStyle = "#000"; c.fillRect(x, y + chh / 2 - 1, cw, 2);
            let ch = txt[k];
            const inStatus = k >= 8;
            if (inStatus && loc > 0 && loc < 1) { const h = Math.floor((t * 37 + k * 13 + ri * 7) % CH.length); ch = CH[h]; }
            c.fillStyle = inStatus && loc >= 1 ? "#ff5a4a" : (inStatus ? "#7fe08a" : "#f3f1ea");
            c.font = '600 80px "Roboto Mono", monospace'; c.textAlign = "center";
            c.fillText(ch, x + cw / 2, y + chh / 2 + 3); c.textAlign = "left";
          }
        });
        bt.needsUpdate = true;
      }
      const bm = std("#ffffff", { map: bt, emap: bt, emi: "#ffffff", emiI: 1.5, rough: 0.35, env: 0.4 });
      M(box(3.45, 3.85, 0.25), std("#121317", { rough: 0.4, metal: 0.6 }), { y: 4.2, z: -0.15, cast: true }, g);
      M(new T.PlaneGeometry(3.25, 3.66), bm, { y: 4.2, z: -0.02 }, g);
      const Uref = { value: 0.6 };
      const floorM = std("#202227", { map: concrete("cTerm", "#2a2c30", [8, 8]), rough: 0.25, env: 0.6 });
      reflective(floorM, Uref);
      const floor = M(new T.PlaneGeometry(60, 60), floorM, { rx: -90 }, g);
      M(new T.PlaneGeometry(60, 20), std("#0d0e12", { rough: 0.9 }), { z: -0.4, y: 6 }, g);
      for (let i = 0; i < 14; i++) for (let j = -1; j <= 1; j++) M(box(0.12, 0.04, 2.2), glow("#e8efff", 5, { fog: true }), { x: j * 4.5, y: 8.5, z: 12 - i * 3.2 }, g); // ceiling strips
      for (let i = 0; i < 18; i++) { const r = rng(130 + i); M(new T.SphereGeometry(0.08, 8, 6), glow(r() < 0.5 ? "#ffcf8a" : "#9cc4ff", 6, { fog: true }), { x: -12 + r() * 24, y: 1 + r() * 4, z: -0.3, receive: false }, g); }
      const pl = new T.PointLight("#ffb054", 6, 9, 2); pl.position.set(0, 3.5, 2.2); g.add(pl);
      const key = new T.SpotLight("#dfe8ff", 120, 0, 30 * D2R, 0.7, 1.5); key.position.set(3, 8, 6); key.target.position.set(0, 2, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); g.add(key, key.target);
      const hemi = new T.HemisphereLight("#8da2c8", "#100d0a", 0.2); g.add(hemi);
      S.mirrorHide = [floor];
      S.update = (p) => { drawBoard(p.t || 0, p.flip || 0); pl.intensity = 6 + 4 * (p.flip || 0); };
    })();

    // ------------------------------------------------------------------ post: bokeh DOF (half res) + bloom + mblur + grade
    const hdrRT = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
    const depRT = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    depRT.depthTexture = new T.DepthTexture(W, H, T.UnsignedIntType);
    const dw = Math.round(W * LOOK.dofScale), dh = Math.round(H * LOOK.dofScale);
    const lin = { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false };
    const preRT = new T.WebGLRenderTarget(dw, dh, lin), dofRT = new T.WebGLRenderTarget(dw, dh, lin);
    const bw = Math.round(W / 8), bh = Math.round(H / 8);
    const bl1 = new T.WebGLRenderTarget(bw, bh, lin), bl2 = new T.WebGLRenderTarget(bw, bh, lin);
    const depthOnly = new T.MeshBasicMaterial({ colorWrite: false });
    const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const LIN = `uniform float near, far; float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }`;
    const pre = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, px: { value: new T.Vector2(1 / W, 1 / H) },
        near: { value: 0.02 }, far: { value: 400 }, focus: { value: 2 }, aper: { value: 20 }, maxC: { value: 30 }, sc: { value: LOOK.dofScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD; uniform vec2 px; uniform float focus, aper, maxC, sc; varying vec2 vUv; ${LIN}
        void main(){
          vec3 c = texture2D(tC, vUv).rgb; if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
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
          vec4 c0 = texture2D(tP, vUv); float cs = abs(c0.a);
          vec3 col = c0.rgb; float tot = 1.0; float nearS = 0.0; float r = rs;
          for (int i = 0; i < 600; i++) {
            if (r >= maxR) break;
            float ang = float(i) * 2.39996323;
            vec4 s = texture2D(tP, vUv + vec2(cos(ang), sin(ang)) * px * r);
            float ss = abs(s.a);
            if (s.a > c0.a) ss = clamp(ss, 0.0, cs * 2.0);
            float m = smoothstep(r - 0.5, r + 0.5, ss);
            col += mix(col / tot, s.rgb, m); tot += 1.0;
            if (s.a < 0.0 && -s.a > r) nearS = max(nearS, -s.a * m);
            r += rs / r;
          }
          gl_FragColor = vec4(col / tot, max(cs, nearS));
        }`,
      depthTest: false, depthWrite: false,
    });
    const down = new T.ShaderMaterial({
      uniforms: { tC: { value: dofRT.texture }, px: { value: new T.Vector2(1 / dw, 1 / dh) }, thr: { value: 0.85 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 px; uniform float thr; varying vec2 vUv;
        void main(){ vec3 c = vec3(0.0);
          for (int i = -1; i <= 2; i++) for (int j = -1; j <= 2; j++) c += texture2D(tC, vUv + px * vec2(float(i) * 2.0 - 0.5, float(j) * 2.0 - 0.5)).rgb;
          c /= 16.0; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(thr, thr + 1.2, l), 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const blur = new T.ShaderMaterial({
      uniforms: { tC: { value: null }, dir: { value: new T.Vector2(1 / bw, 0) } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 dir; varying vec2 vUv;
        void main(){ float w[5]; w[0] = 0.227; w[1] = 0.1945; w[2] = 0.1216; w[3] = 0.054; w[4] = 0.0162;
          vec3 c = texture2D(tC, vUv).rgb * w[0];
          for (int i = 1; i < 5; i++) { c += texture2D(tC, vUv + dir * float(i) * 1.6).rgb * w[i]; c += texture2D(tC, vUv - dir * float(i) * 1.6).rgb * w[i]; }
          gl_FragColor = vec4(c, 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const comp = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tD: { value: depRT.depthTexture }, tB: { value: dofRT.texture }, tG: { value: bl2.texture },
        near: { value: 0.02 }, far: { value: 400 }, focus: { value: 2 }, aper: { value: 20 }, sc: { value: LOOK.dofScale },
        expo: { value: 1 }, sat: { value: LOOK.sat }, vig: { value: LOOK.vig }, warm: { value: LOOK.warm }, con: { value: LOOK.contrast },
        bloom: { value: LOOK.bloom }, res: { value: new T.Vector2(W, H) }, seed: { value: 0 }, flash: { value: 0 }, fade: { value: 0 },
        mb: { value: new T.Vector2(0, 0) }, grain: { value: LOOK.grain }, tint: { value: new T.Vector3(1, 1, 1) } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD, tB, tG; uniform float focus, aper, sc, expo, sat, vig, warm, con, bloom, seed, flash, fade, grain;
        uniform vec2 res, mb; uniform vec3 tint; varying vec2 vUv; ${LIN}
        vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
        vec3 sampleC(vec2 uv){
          vec3 sharp = texture2D(tC, uv).rgb; vec4 b = texture2D(tB, uv);
          float d = lin(texture2D(tD, uv).x); float coc = abs(aper * (1.0 - focus / d)) * sc;
          return mix(sharp, b.rgb, smoothstep(0.35, 1.6, max(coc, b.a)));
        }
        void main(){
          vec3 c = vec3(0.0);
          if (length(mb) > 0.5) { for (int i = 0; i < 12; i++) { float u = float(i) / 11.0 - 0.5; c += sampleC(vUv + mb * u / res); } c /= 12.0; }
          else c = sampleC(vUv);
          c += texture2D(tG, vUv).rgb * bloom;
          c = c * expo * tint + flash;
          c = aces(c);
          c = (c - 0.5) * con + 0.5;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, sat), 0.0);
          c *= vec3(1.0 + warm, 1.0, 1.0 - warm);
          vec2 q = vUv - 0.5; q.x *= res.x / res.y;
          c *= 1.0 - vig * smoothstep(0.2, 0.95, length(q) * 1.25);
          c *= 1.0 - fade;
          c = toSRGB(clamp(c, 0.0, 1.0));
          float n = hash(vUv * res) - 0.5;
          c += n * grain * (1.0 - 0.6 * l) + (hash(vUv * res + 3.1) - 0.5) / 255.0;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), pre);
    quad.frustumCulled = false;
    const qScene = new T.Scene(); qScene.add(quad);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qScene, qCam); }

    let cur = null;
    function show(name) {
      if (cur === name) return;
      Object.values(SETS).forEach((s) => (s.g.visible = s.name === name));
      const s = SETS[name];
      scene.background = new T.Color(s.bg);
      scene.fog = s.fog ? new T.FogExp2(s.fog[0], s.fog[1]) : null;
      scene.environment = s.env; scene.environmentIntensity = s.envI;
      cur = name;
    }
    const fwd = new T.Vector3(), tv = new T.Vector3();
    function render(st) {
      show(st.set);
      const S = SETS[st.set];
      S.update(Object.assign({ t: st.t || 0 }, st.p || {}));
      if (st.fog != null && scene.fog) scene.fog.density = st.fog;
      camera.fov = st.fov || 30;
      camera.position.fromArray(st.cam);
      camera.up.set(0, 1, 0);
      camera.lookAt(st.look[0], st.look[1], st.look[2]);
      if (st.roll) camera.rotateZ(st.roll * D2R);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      let F = 3;
      if (Array.isArray(st.focus)) { camera.getWorldDirection(fwd); F = tv.fromArray(st.focus).sub(camera.position).dot(fwd); }
      else if (st.focus) F = st.focus;
      const A = st.aperture != null ? st.aperture : 14;
      const maxC = Math.min(LOOK.maxCoC, st.maxBlur || LOOK.maxCoC) * LOOK.dofScale;
      if (S.mirrorHide) renderMirror(0, S.mirrorHide);
      renderer.setRenderTarget(hdrRT); renderer.render(scene, camera);
      const bg = scene.background;
      scene.overrideMaterial = depthOnly; renderer.setRenderTarget(depRT); renderer.render(scene, camera); scene.overrideMaterial = null; scene.background = bg;
      pre.uniforms.focus.value = F; pre.uniforms.aper.value = A; pre.uniforms.maxC.value = maxC;
      pass(pre, preRT);
      gather.uniforms.maxR.value = Math.max(1.5, Math.min(maxC, Math.abs(A) * LOOK.dofScale * 1.05 + 1));
      pass(gather, dofRT);
      pass(down, bl1);
      blur.uniforms.tC.value = bl1.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, bl2);
      blur.uniforms.tC.value = bl2.texture; blur.uniforms.dir.value.set(0, 1 / bh); pass(blur, bl1);
      blur.uniforms.tC.value = bl1.texture; blur.uniforms.dir.value.set(1 / bw, 0); pass(blur, bl2);
      const cu = comp.uniforms;
      cu.focus.value = F; cu.aper.value = A; cu.expo.value = st.exposure != null ? st.exposure : 1;
      cu.flash.value = st.flash || 0; cu.fade.value = st.fade || 0; cu.sat.value = st.sat != null ? st.sat : LOOK.sat;
      cu.bloom.value = st.bloom != null ? st.bloom : LOOK.bloom; cu.vig.value = st.vig != null ? st.vig : LOOK.vig;
      cu.warm.value = st.warm != null ? st.warm : LOOK.warm; cu.grain.value = st.grain != null ? st.grain : LOOK.grain;
      const mb = st.mblur || [0, 0]; cu.mb.value.set(mb[0], -mb[1]);
      cu.seed.value = ((st.t || 0) * 30) % 97;
      pass(comp, null);
      renderer.setRenderTarget(null);
    }
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return { T, scene, camera, renderer, SETS, render, show, RC, clamp, lerp, smooth,
      ready: fontsReady.then(() => { Object.values(texCache).forEach((t) => (t.needsUpdate = true)); return new Promise((r) => setTimeout(r, 30)); }) };
  }
  window.MONEYKIT = { create };
})();
