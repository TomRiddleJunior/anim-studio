/* Glow-story kit v1 — glowing UI objects floating in volumetric navy fog, for seek-safe HyperFrames reels (three.js r170).
 *
 *   const G = GLOW.create({ canvas, width: 1080, height: 1920, look: { fogD1: 0.42 } });
 *   const p = G.panel({ w: 0.56, h: 0.34, r: 0.04, draw: (ctx, W, H, s, px) => { … } });   // frosted glass + emissive face
 *   p.g.position.set(x, y, z);  p.set(state, glow);                                        // redraws only when state changes
 *   G.key(), G.toggle(), G.padlock(), G.clock(), G.phone(), G.dots(), G.rings(), G.bubble(), G.paper()
 *   await G.ready;  G.render({ t, cam, look, fov, focus, aperture, exposure, lights: [{ pos, color, i, fog, spot }] });
 *
 * Look (measured on the source, then made physical): every object is a real material — smoked frosted glass slabs
 * (MeshPhysicalMaterial, clearcoat, bevelled edges that catch an image-based softbox environment), brushed metal with
 * anisotropic highlights, paper — with an additive emissive face drawn on a canvas (HDR, so it blooms). The world is a
 * volumetric fog raymarched at half resolution through a tileable 3-D noise texture, lit by up to four point/spot lights
 * (Henyey-Greenstein forward scattering = halos behind objects, light beams), occluded by the depth buffer. Then a
 * half-res scatter-as-gather bokeh depth of field, floating dust motes drawn as true circles of confusion, a three-level
 * bloom, ACES filmic, a navy toe lift, vignette, chromatic fringe and seeded film grain. Everything is a function of the
 * state handed to render(), so any frame seeks alone.
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

  // ------------------------------------------------------------------ palette (sRGB hex; the source's two families)
  const C = {
    amber: "#ffb25e", amberHot: "#ffd29a", amberDeep: "#e07b2c",
    ice: "#cfe2ff", iceDim: "#8fa6c8", blue: "#6f9bff",
    grey: "#6c7689", greyDim: "#3a4352", white: "#f3f6fb", red: "#ff7a6b",
  };

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    const LOOK = Object.assign({
      fogD0: 0.09, fogD1: 0.42, fogR0: 1.6, fogR1: 4.4, fogScale: 0.3, fogSteps: 28, fogMax: 9.0, fogDrift: [0.035, 0.012, -0.02],
      amb: [0.0145, 0.0205, 0.034], bloom: 0.22, bloomThr: 0.75, sat: 0.82, vig: 0.55, grain: 0.032, lift: [0.006, 0.010, 0.020],
      dofScale: 0.5, maxCoC: 36, radScale: 0.9, ca: 1.1, contrast: 1.04, motes: 280,
    }, o.look || {});
    T.ColorManagement.enabled = true;
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = T.LinearSRGBColorSpace; // the grade pass encodes sRGB itself
    renderer.toneMapping = T.NoToneMapping;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    const ANISO = renderer.capabilities.getMaxAnisotropy();
    const scene = new T.Scene();
    scene.background = new T.Color(0, 0, 0);
    const camera = new T.PerspectiveCamera(32, W / H, 0.05, 60);
    camera.layers.enable(0);
    const loads = [];

    // ---------------------------------------------------------------- fonts (canvas text needs them loaded)
    const FONTS = [["GInter", "assets/fonts/Inter_opsz-wght_.ttf", { weight: "100 900" }],
      ["GPoppins", "assets/fonts/Poppins-Medium.ttf", { weight: "500" }], ["GPoppins", "assets/fonts/Poppins-SemiBold.ttf", { weight: "600" }]];
    FONTS.forEach(([fam, url, d]) => {
      try {
        const f = new FontFace(fam, `url(${url})`, d);
        loads.push(f.load().then((ff) => { document.fonts.add(ff); }).catch(() => {}));
      } catch (e) { /* no FontFace: canvas falls back to sans-serif */ }
    });

    // ---------------------------------------------------------------- environment: a dark studio with two softboxes
    {
      const es = new T.Scene();
      const sky = new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.ShaderMaterial({
        side: T.BackSide, depthWrite: false,
        vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `varying vec3 vP; void main(){ vec3 d = normalize(vP);
          vec3 c = mix(vec3(0.006, 0.009, 0.016), vec3(0.020, 0.030, 0.050), smoothstep(-0.4, 0.8, d.y));
          gl_FragColor = vec4(c, 1.0); }`,
      }));
      es.add(sky);
      const box = (w, h, col, k, pos, look) => {
        const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
        m.position.set(...pos); m.lookAt(...look); es.add(m);
      };
      box(7, 2.2, "#9db8e6", 1.3, [-1.5, 6.0, 3.5], [0, 0, 0]);   // big cool softbox above-front: long glass highlights
      box(5, 0.5, "#ffc38a", 1.6, [5.5, 0.6, 2.5], [0, 0, 0]);    // warm strip, right: amber edge glints
      box(3, 3, "#5a78b0", 0.5, [-6, 1.2, -2], [0, 0, 0]);        // dim cool fill, left-back
      box(10, 1.0, "#1c2738", 1.0, [0, -5, 0], [0, 0, 0]);        // faint floor bounce
      const pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(es, 0.03).texture;
      scene.environmentIntensity = 1.0;
      pm.dispose();
    }

    // ---------------------------------------------------------------- lights: a pool of 4 points + soft key + hemi
    const hemi = new T.HemisphereLight("#3a4a6a", "#0a0d14", 0.25);
    scene.add(hemi);
    const keyL = new T.DirectionalLight("#b8c8e8", 0.35);
    keyL.position.set(-2, 4, 3);
    scene.add(keyL); scene.add(keyL.target);
    const pool = [];
    for (let i = 0; i < 4; i++) { const p = new T.PointLight("#ffffff", 0, 0, 2); scene.add(p); pool.push(p); }

    // ---------------------------------------------------------------- 3-D noise for the fog (tileable, seeded)
    const NZ = 64;
    const noiseTex = (() => {
      const r = rng(1234);
      const lat = (n) => { const a = new Float32Array(n * n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a; };
      const oct = [[4, 0.5, lat(4)], [8, 0.28, lat(8)], [16, 0.15, lat(16)], [32, 0.07, lat(32)]];
      const raw = new Float32Array(NZ * NZ * NZ);
      const sm = (u) => u * u * (3 - 2 * u);
      for (let z = 0; z < NZ; z++) for (let y = 0; y < NZ; y++) for (let x = 0; x < NZ; x++) {
        let v = 0;
        for (const [n, amp, L] of oct) {
          const fx = x * n / NZ, fy = y * n / NZ, fz = z * n / NZ;
          const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
          const ux = sm(fx - ix), uy = sm(fy - iy), uz = sm(fz - iz);
          const g = (a, b, c) => L[((a % n) * n + (b % n)) * n + (c % n)];
          const c00 = lerp(g(ix, iy, iz), g(ix + 1, iy, iz), ux), c10 = lerp(g(ix, iy + 1, iz), g(ix + 1, iy + 1, iz), ux);
          const c01 = lerp(g(ix, iy, iz + 1), g(ix + 1, iy, iz + 1), ux), c11 = lerp(g(ix, iy + 1, iz + 1), g(ix + 1, iy + 1, iz + 1), ux);
          v += amp * lerp(lerp(c00, c10, uy), lerp(c01, c11, uy), uz);
        }
        raw[(z * NZ + y) * NZ + x] = v;
      }
      let lo = 1e9, hi = -1e9;
      for (let i = 0; i < raw.length; i++) { lo = Math.min(lo, raw[i]); hi = Math.max(hi, raw[i]); }
      const data = new Uint8Array(raw.length); // stretched to the full 0..255 range (value-noise fbm bunches near 0.5)
      for (let i = 0; i < raw.length; i++) data[i] = Math.round((raw[i] - lo) / (hi - lo) * 255);
      const t = new T.Data3DTexture(data, NZ, NZ, NZ);
      t.format = T.RedFormat; t.type = T.UnsignedByteType;
      t.minFilter = t.magFilter = T.LinearFilter;
      t.wrapS = t.wrapT = t.wrapR = T.RepeatWrapping;
      t.unpackAlignment = 1; t.needsUpdate = true;
      return t;
    })();

    // ---------------------------------------------------------------- canvas textures + drawing helpers
    function canvasTex(cw, ch) {
      const cv = document.createElement("canvas");
      cv.width = cw; cv.height = ch;
      const ctx = cv.getContext("2d");
      const tex = new T.CanvasTexture(cv);
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = ANISO;
      tex.minFilter = T.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      return { cv, ctx, tex };
    }
    const D = {
      rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); },
      font(size, weight, fam) { return `${weight || 500} ${size}px ${fam === "p" ? "GPoppins" : "GInter"}, "Segoe UI", Arial, sans-serif`; },
      // glowing text: a soft blurred pass + a crisp core (the HDR multiplier on the material makes the core bloom)
      text(ctx, s, x, y, o) {
        o = o || {};
        ctx.save();
        ctx.font = D.font(o.size || 40, o.weight || 500, o.fam);
        ctx.textAlign = o.align || "center"; ctx.textBaseline = o.base || "middle";
        if (o.ls) { try { ctx.letterSpacing = o.ls + "px"; } catch (e) { /* older canvas */ } }
        ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
        if (o.glow !== 0) { ctx.shadowColor = o.glowColor || o.color || "#fff"; ctx.shadowBlur = o.glow || (o.size || 40) * 0.28; }
        ctx.fillStyle = o.color || "#fff";
        ctx.fillText(s, x, y);
        ctx.shadowBlur = 0;
        ctx.fillText(s, x, y);
        ctx.restore();
      },
      stroke(ctx, path, o) {
        ctx.save();
        ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
        ctx.strokeStyle = o.color; ctx.lineWidth = o.lw || 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (o.glow) { ctx.shadowColor = o.color; ctx.shadowBlur = o.glow; path(); ctx.stroke(); ctx.shadowBlur = 0; }
        path(); ctx.stroke();
        ctx.restore();
      },
      fill(ctx, path, o) {
        ctx.save();
        ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
        ctx.fillStyle = o.color;
        if (o.glow) { ctx.shadowColor = o.glowColor || o.color; ctx.shadowBlur = o.glow; path(); ctx.fill(); ctx.shadowBlur = 0; }
        path(); ctx.fill();
        ctx.restore();
      },
      // the panel's own glowing edge: a thin rounded-rect line inset from the slab edge
      edge(ctx, px, m, w, h, r, color, alpha, lw) {
        D.stroke(ctx, () => D.rr(ctx, m * px + 3, m * px + 3, w * px - 6, h * px - 6, r * px), { color, alpha, lw: lw || 3, glow: 18 });
      },
      // icons (cx, cy, size s in px)
      voicemail(ctx, cx, cy, s, color, a, lw) { // two reels joined by a tape line
        const r = s * 0.2;
        D.stroke(ctx, () => { ctx.beginPath(); ctx.arc(cx - s * 0.3, cy, r, 0, 7); ctx.moveTo(cx + s * 0.3 + r, cy); ctx.arc(cx + s * 0.3, cy, r, 0, 7); ctx.moveTo(cx - s * 0.3, cy + r); ctx.lineTo(cx + s * 0.3, cy + r); },
          { color, alpha: a, lw: lw || s * 0.06, glow: s * 0.25 });
      },
      play(ctx, cx, cy, s, color, a) {
        D.fill(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - s * 0.32, cy - s * 0.42); ctx.lineTo(cx + s * 0.45, cy); ctx.lineTo(cx - s * 0.32, cy + s * 0.42); ctx.closePath(); }, { color, alpha: a, glow: s * 0.3 });
      },
      mailbox(ctx, cx, cy, s, color, a) {
        D.stroke(ctx, () => { D.rr(ctx, cx - s * 0.45, cy - s * 0.3, s * 0.9, s * 0.6, s * 0.08); ctx.moveTo(cx - s * 0.45, cy - s * 0.24); ctx.lineTo(cx, cy + s * 0.06); ctx.lineTo(cx + s * 0.45, cy - s * 0.24); },
          { color, alpha: a, lw: s * 0.07, glow: s * 0.2 });
      },
      phone(ctx, cx, cy, s, color, a) { // handset glyph
        D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - s * 0.36, cy - s * 0.38); ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.05, cx + s * 0.02, cy + s * 0.44); ctx.moveTo(cx - s * 0.36, cy - s * 0.38); ctx.lineTo(cx - s * 0.18, cy - s * 0.44); ctx.lineTo(cx - s * 0.08, cy - s * 0.22); ctx.lineTo(cx - s * 0.2, cy - s * 0.12); ctx.moveTo(cx + s * 0.02, cy + s * 0.44); ctx.lineTo(cx + s * 0.22, cy + s * 0.34); ctx.lineTo(cx + s * 0.12, cy + s * 0.14); ctx.lineTo(cx, cy + s * 0.2); },
          { color, alpha: a, lw: s * 0.08, glow: s * 0.25 });
      },
      heart(ctx, cx, cy, s, color, a) {
        D.fill(ctx, () => { ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.35); ctx.bezierCurveTo(cx - s * 0.6, cy - s * 0.05, cx - s * 0.3, cy - s * 0.5, cx, cy - s * 0.18); ctx.bezierCurveTo(cx + s * 0.3, cy - s * 0.5, cx + s * 0.6, cy - s * 0.05, cx, cy + s * 0.35); }, { color, alpha: a, glow: s * 0.3 });
      },
      warn(ctx, cx, cy, s, color, a) {
        D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.42); ctx.lineTo(cx + s * 0.46, cy + s * 0.38); ctx.lineTo(cx - s * 0.46, cy + s * 0.38); ctx.closePath(); ctx.moveTo(cx, cy - s * 0.1); ctx.lineTo(cx, cy + s * 0.12); ctx.moveTo(cx, cy + s * 0.25); ctx.lineTo(cx, cy + s * 0.26); },
          { color, alpha: a, lw: s * 0.08, glow: s * 0.25 });
      },
      check(ctx, cx, cy, s, color, a) {
        D.stroke(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - s * 0.36, cy); ctx.lineTo(cx - s * 0.1, cy + s * 0.26); ctx.lineTo(cx + s * 0.4, cy - s * 0.3); }, { color, alpha: a, lw: s * 0.11, glow: s * 0.3 });
      },
      // head-and-shoulders silhouette (kind "she": soft short curls; "he": short hair)
      avatar(ctx, cx, cy, r, ring, a, kind, fill) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
        ctx.globalAlpha = a;
        ctx.fillStyle = fill || "#05080d"; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        const g = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r * 1.1);
        g.addColorStop(0, "rgba(120,140,170,0.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        ctx.fillStyle = "#0b1018";
        ctx.strokeStyle = ring; ctx.lineWidth = r * 0.025; ctx.shadowColor = ring; ctx.shadowBlur = r * 0.12;
        ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.95, r * 0.62, r * 0.5, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); // shoulders
        if (kind !== "she") { ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.3, 0, 7); ctx.fill(); ctx.stroke(); } // head
        if (kind === "she") { // a soft chin-length bob behind the face
          const hx = cx, hy = cy - r * 0.1, hr = r * 0.3;
          ctx.beginPath();
          ctx.moveTo(hx - hr * 1.18, hy + hr * 0.95);
          ctx.bezierCurveTo(hx - hr * 1.55, hy - hr * 0.2, hx - hr * 1.15, hy - hr * 1.45, hx, hy - hr * 1.38);
          ctx.bezierCurveTo(hx + hr * 1.15, hy - hr * 1.45, hx + hr * 1.55, hy - hr * 0.2, hx + hr * 1.18, hy + hr * 0.95);
          ctx.quadraticCurveTo(hx + hr * 0.9, hy + hr * 1.15, hx + hr * 0.7, hy + hr * 0.8);
          ctx.lineTo(hx - hr * 0.7, hy + hr * 0.8);
          ctx.quadraticCurveTo(hx - hr * 0.9, hy + hr * 1.15, hx - hr * 1.18, hy + hr * 0.95);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.ellipse(hx, hy + hr * 0.18, hr * 0.74, hr * 0.86, 0, 0, 7); ctx.fill(); ctx.restore();
        }
        ctx.restore();
        D.stroke(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); }, { color: ring, alpha: a, lw: r * 0.035, glow: r * 0.25 });
      },
    };

    // ---------------------------------------------------------------- materials
    const frostTex = (() => { // faint frost grain + a soft top sheen for the glass colour map
      const { ctx, tex } = canvasTex(256, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "#56637a"); g.addColorStop(0.5, "#3b4659"); g.addColorStop(1, "#2f394a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
      const r = rng(77);
      for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,0,0"},${0.03 + r() * 0.05})`; ctx.fillRect(r() * 256, r() * 256, 1, 1); }
      tex.colorSpace = T.SRGBColorSpace;
      return tex;
    })();
    const brushTex = (() => { // horizontal brushing streaks as a roughness map
      const { ctx, tex } = canvasTex(512, 512);
      ctx.fillStyle = "#7a7a7a"; ctx.fillRect(0, 0, 512, 512);
      const r = rng(31);
      for (let i = 0; i < 2600; i++) { const y = r() * 512, v = 90 + r() * 90; ctx.fillStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.4})`; ctx.fillRect(r() * 512 - 200, y, 120 + r() * 500, 1 + (r() < 0.2)); }
      tex.colorSpace = T.NoColorSpace; tex.wrapS = tex.wrapT = T.RepeatWrapping;
      return tex;
    })();
    function glass(p) {
      p = p || {};
      return new T.MeshPhysicalMaterial({
        color: p.color || "#ffffff", map: frostTex, roughness: p.rough != null ? p.rough : 0.34, metalness: 0,
        clearcoat: 1, clearcoatRoughness: p.cc != null ? p.cc : 0.1, transparent: true, opacity: p.opacity != null ? p.opacity : 0.96,
        envMapIntensity: p.env != null ? p.env : 1.0, emissive: new T.Color(p.emi || "#0c1422"), emissiveIntensity: p.emiI != null ? p.emiI : 1, depthWrite: true,
        specularIntensity: 1, ior: 1.5,
      });
    }
    function metal(p) {
      p = p || {};
      const m = new T.MeshPhysicalMaterial({ color: p.color || "#9aa3b2", metalness: 1, roughness: p.rough != null ? p.rough : 0.3, roughnessMap: brushTex,
        envMapIntensity: p.env != null ? p.env : 1.2, clearcoat: p.cc || 0, clearcoatRoughness: 0.2 });
      if ("anisotropy" in m) { m.anisotropy = p.aniso != null ? p.aniso : 0.7; m.anisotropyRotation = p.anisoRot || 0; }
      return m;
    }
    function emissive(hex, hdr) { const m = new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(hdr == null ? 1 : hdr) }); m.userData.base = new T.Color(hex); m.userData.hdr = hdr; return m; }
    function setEmi(m, hex, hdr) { m.color.set(hex).multiplyScalar(hdr); }
    function contentMat(tex, hdr) {
      const m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: new T.Color(1, 1, 1).multiplyScalar(hdr || 2.2) });
      m.userData.hdr = hdr || 2.2;
      return m;
    }

    // ---------------------------------------------------------------- geometry
    function rrShape(w, h, r) {
      const s = new T.Shape(), x = -w / 2, y = -h / 2;
      r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    // a bevelled slab whose FRONT face sits at z = 0 (depth goes to -d); UVs normalised to the face
    function slab(w, h, r, d, bev) {
      bev = bev == null ? Math.min(0.008, d * 0.4) : bev;
      const g = new T.ExtrudeGeometry(rrShape(w - 2 * bev, h - 2 * bev, Math.max(0.002, r - bev)), { depth: Math.max(0.001, d - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 12 });
      g.translate(0, 0, -d + bev);
      const uv = g.attributes.uv, pos = g.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
      g.computeVertexNormals();
      return g;
    }
    function M(geo, m, parent) { const me = new T.Mesh(geo, m); (parent || scene).add(me); return me; }

    // ---------------------------------------------------------------- primitives
    // Panel: smoked frosted-glass slab + an emissive canvas face (draw(ctx, CW, CH, state, px, margin)) that only
    // redraws when the state key changes. set(state, glow): glow 0..1 fades the face (additive, so seek-safe).
    function panel(p) {
      const w = p.w, h = p.h, r = p.r != null ? p.r : 0.035, d = p.d != null ? p.d : 0.028, mg = p.margin != null ? p.margin : 0.05;
      const g = new T.Group(); scene.add(g);
      const slabM = p.noSlab ? null : M(slab(w, h, r, d), p.mat || glass(p.glass), g);
      const px = (p.cw || 1024) / (w + 2 * mg);
      const cw = Math.round((w + 2 * mg) * px), ch = Math.round((h + 2 * mg) * px);
      const ct = canvasTex(cw, ch);
      const face = M(new T.PlaneGeometry(w + 2 * mg, h + 2 * mg), contentMat(ct.tex, p.hdr), g);
      face.position.z = 0.0025;
      face.renderOrder = 10;
      // depth pass: only the solid strokes of the face write depth (so the fog stops at text, never at the margin)
      face.userData.depthMat = new T.MeshBasicMaterial({ map: ct.tex, alphaTest: 0.5, colorWrite: false, transparent: false, side: T.DoubleSide });
      let last = null;
      const o = {
        g, slab: slabM, face, ctx: ct.ctx, px, mg, w, h, r, cw, ch,
        set(state, glow) {
          const a = glow == null ? 1 : glow;
          face.visible = a > 0.002;
          face.material.opacity = a;
          face.userData.depthMat.opacity = a;
          if (!face.visible) return;
          const key = JSON.stringify(state);
          if (key === last) return;
          last = key;
          ct.ctx.clearRect(0, 0, cw, ch);
          p.draw(ct.ctx, cw, ch, state || {}, px, mg, o);
          ct.tex.needsUpdate = true;
        },
        hdr(k) { face.material.color.setScalar(k); },
      };
      return o;
    }

    // Brushed-metal key with a smoked glass cap and a glowing label; press(k) sinks it 7 mm
    function key(p) {
      const w = p.w || 0.3, h = p.h || 0.16, g = new T.Group(); scene.add(g);
      const base = M(slab(w + 0.03, h + 0.03, 0.03, 0.03, 0.006), metal({ color: "#7d8696", rough: 0.36 }), g);
      base.position.z = -0.012;
      const cap = panel({ w, h, r: 0.022, d: 0.03, hdr: p.hdr || 2.4, cw: 768, margin: 0.03, glass: { opacity: 0.94, rough: 0.3, emi: "#0d1626" },
        draw: (ctx, CW, CH, s, px, mg) => {
          D.edge(ctx, px, mg, w, h, 0.022, s.edge || C.iceDim, s.edgeA != null ? s.edgeA : 0.55, 3);
          D.text(ctx, p.label, CW / 2, CH / 2, { size: (p.size || 0.034) * px, weight: 600, ls: 10, color: s.color || C.ice, alpha: s.alpha != null ? s.alpha : 1, fam: "p" });
        } });
      g.add(cap.g);
      return { g, cap, press(k) { cap.g.position.z = 0.012 - 0.007 * k; }, set(s, a) { cap.set(s, a); } };
    }

    // Toggle switch: glass pill track + brushed-metal knob + label underneath
    function toggle(p) {
      const w = p.w || 0.26, h = p.h || 0.12, g = new T.Group(); scene.add(g);
      const track = panel({ w, h, r: h / 2, d: 0.03, hdr: 2.6, cw: 768, margin: 0.03, glass: { opacity: 0.9 },
        draw: (ctx, CW, CH, s, px, mg) => {
          const on = s.on || 0;
          if (on > 0.01) D.fill(ctx, () => D.rr(ctx, mg * px + 6, mg * px + 6, (w * px - 12), h * px - 12, h * px / 2), { color: s.onColor || C.amber, alpha: 0.32 * on, glow: 30 });
          D.edge(ctx, px, mg, w, h, h / 2, on > 0.5 ? (s.onColor || C.amber) : C.iceDim, 0.5 + 0.3 * on, 3);
        } });
      g.add(track.g);
      const knob = M(new T.SphereGeometry(h * 0.36, 40, 24), metal({ color: "#c9d0db", rough: 0.22, aniso: 0.4 }), g);
      knob.scale.z = 0.55;
      const label = panel({ w: w * 2.2, h: 0.07, noSlab: true, hdr: 1.3, cw: 1024, margin: 0.0,
        draw: (ctx, CW, CH, s) => { D.text(ctx, s.text || p.label, CW / 2, CH / 2, { size: CH * 0.42, weight: 600, ls: 9, color: s.color || C.ice, fam: "p", glow: CH * 0.05 }); } });
      label.g.position.set(0, -h / 2 - 0.07, 0.002);
      g.add(label.g);
      return { g, track, knob, label, set(s, a) {
        const on = s.on || 0;
        knob.position.set(lerp(-w / 2 + h / 2, w / 2 - h / 2, on), 0, 0.016);
        track.set({ on: Math.round(on * 20) / 20, onColor: s.onColor }, a);
        label.set({ text: s.text || p.label, color: s.labelColor }, a);
      } };
    }

    // Padlock: brushed body with a glowing keyhole, a tubular shackle that pops open; set({ open, drop, glow })
    function padlock(p) {
      const s = p.s || 0.1, g = new T.Group(); scene.add(g);
      const bodyG = new T.Group(); g.add(bodyG);
      const body = M(slab(s * 1.2, s, s * 0.16, s * 0.42, s * 0.05), metal({ color: "#a7afbd", rough: 0.28, aniso: 0.6 }), bodyG);
      body.position.z = s * 0.21;
      const hole = M(new T.CircleGeometry(s * 0.08, 24), emissive(C.amber, 3), bodyG);
      hole.position.set(0, s * 0.05, s * 0.215);
      const slot = M(new T.PlaneGeometry(s * 0.05, s * 0.16), emissive(C.amber, 3), bodyG);
      slot.position.set(0, -s * 0.08, s * 0.215);
      const path = new T.CurvePath();
      const R = s * 0.36, leg = s * 0.36;
      path.add(new T.LineCurve3(new T.Vector3(-R, 0, 0), new T.Vector3(-R, leg, 0)));
      class Arc extends T.Curve { getPoint(u, tgt) { const a = Math.PI * (1 - u); return (tgt || new T.Vector3()).set(Math.cos(a) * R, leg + Math.sin(a) * R, 0); } }
      path.add(new Arc());
      path.add(new T.LineCurve3(new T.Vector3(R, leg, 0), new T.Vector3(R, leg * 0.35, 0)));
      const shG = new T.Group(); bodyG.add(shG);
      shG.position.set(-R, s * 0.42, 0); // pivot on the left leg
      const sh = M(new T.TubeGeometry(path, 64, s * 0.075, 16, false), metal({ color: "#c3cad6", rough: 0.2, aniso: 0.3 }), shG);
      sh.position.set(R, 0, 0);
      return { g, body: bodyG, hole, slot, set(st) {
        const op = st.open || 0, dr = st.drop || 0;
        shG.position.y = s * 0.42 + s * 0.16 * sstep(0, 0.4, op);
        shG.rotation.y = -0.95 * sstep(0.35, 1, op);
        bodyG.position.y = -dr * dr * 0.9; bodyG.rotation.z = dr * 0.5; bodyG.rotation.x = dr * 0.4;
        const k = st.glow != null ? st.glow : 1;
        setEmi(hole.material, st.color || C.amber, 3 * k); setEmi(slot.material, st.color || C.amber, 3 * k);
        g.visible = dr < 0.999;
      } };
    }

    // Analogue clock: brushed bezel, dark glass face, emissive ticks and hands; set({ h: hours (float), glow })
    function clock(p) {
      const r = p.r || 0.2, g = new T.Group(); scene.add(g);
      const bez = M(new T.TorusGeometry(r, r * 0.07, 24, 96), metal({ color: "#b4bcc9", rough: 0.24, aniso: 0.8, anisoRot: Math.PI / 2 }), g);
      const face = M(new T.CylinderGeometry(r, r, r * 0.06, 96), glass({ opacity: 0.95, rough: 0.25, emi: "#0a111c" }), g);
      face.rotation.x = Math.PI / 2; face.position.z = -r * 0.03;
      const ticks = [];
      for (let i = 0; i < 12; i++) {
        const big = i % 3 === 0;
        const tk = M(new T.BoxGeometry(r * (big ? 0.035 : 0.022), r * (big ? 0.14 : 0.08), 0.004), emissive(C.amber, big ? 1.6 : 0.9), g);
        const a = i / 12 * Math.PI * 2;
        tk.position.set(Math.sin(a) * r * 0.8, Math.cos(a) * r * 0.8, 0.004); tk.rotation.z = -a;
        ticks.push(tk);
      }
      const hand = (len, wid, z) => { const hg = new T.Group(); g.add(hg); const m = M(new T.BoxGeometry(wid, len, 0.006), emissive(C.amber, 3), hg); m.position.set(0, len / 2 - wid, z); hg.position.z = 0; return { hg, m }; };
      const hh = hand(r * 0.5, r * 0.06, 0.01), mh = hand(r * 0.74, r * 0.04, 0.016);
      const cap = M(new T.CylinderGeometry(r * 0.06, r * 0.06, 0.02, 32), metal({ color: "#d0d6df", rough: 0.2 }), g);
      cap.rotation.x = Math.PI / 2; cap.position.z = 0.022;
      return { g, set(st) {
        const hrs = st.h || 0, k = st.glow != null ? st.glow : 1;
        hh.hg.rotation.z = -(hrs % 12) / 12 * Math.PI * 2;
        mh.hg.rotation.z = -(hrs % 1) * Math.PI * 2;
        setEmi(hh.m.material, st.color || C.amber, 3.2 * k); setEmi(mh.m.material, st.color || C.amber, 3.2 * k);
        ticks.forEach((tk, i) => setEmi(tk.material, C.amber, (i % 3 === 0 ? 1.6 : 0.8) * (0.25 + 0.75 * k)));
      } };
    }

    // Phone: brushed frame + glass screen panel (draw) + side buttons
    function phone(p) {
      const w = p.w || 0.36, h = p.h || 0.74, g = new T.Group(); scene.add(g);
      const frame = M(slab(w + 0.02, h + 0.02, 0.06, 0.045, 0.012), metal({ color: "#8f98a8", rough: 0.3, aniso: 0.5, anisoRot: Math.PI / 2 }), g);
      frame.position.z = -0.004;
      const scr = panel({ w, h, r: 0.05, d: 0.012, hdr: p.hdr || 2.3, cw: 900, margin: 0.02, glass: { opacity: 0.97, rough: 0.12, cc: 0.04, emi: "#070b12" }, draw: p.draw });
      scr.g.position.z = 0.004;
      g.add(scr.g);
      return { g, scr, set(s, a) { scr.set(s, a); } };
    }

    // Dots: an instanced field of small emissive discs (HDR per-instance colour), real depth, so fog/DOF treat them right
    function dots(p) {
      const n = p.n, geo = p.square ? new T.PlaneGeometry((p.r || 0.006) * 2, (p.r || 0.006) * 2) : new T.CircleGeometry(p.r || 0.006, 14);
      const m = new T.MeshBasicMaterial({ color: "#ffffff" });
      const im = new T.InstancedMesh(geo, m, n);
      im.instanceMatrix.setUsage(T.DynamicDrawUsage);
      im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      im.instanceColor.setUsage(T.DynamicDrawUsage);
      im.frustumCulled = false;
      const g = new T.Group(); g.add(im); scene.add(g);
      const mt = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(), col = new T.Color();
      return { g, im, n, set(fn) { // fn(i) -> [x, y, z, scale, hex, hdr]
        for (let i = 0; i < n; i++) {
          const r = fn(i);
          ps.set(r[0], r[1], r[2]); const s = Math.max(1e-4, r[3]); sc.set(s, s, s);
          mt.compose(ps, q, sc); im.setMatrixAt(i, mt);
          col.set(r[4] || "#ffffff").multiplyScalar(r[5] == null ? 1 : r[5]);
          im.instanceColor.setXYZ(i, col.r, col.g, col.b);
        }
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      } };
    }

    // Rings: concentric emissive torus rings (incoming call); set(phase, glow, colour)
    function rings(p) {
      const g = new T.Group(); scene.add(g);
      const rs = [];
      for (let i = 0; i < (p.n || 3); i++) { const m = M(new T.TorusGeometry(1, 0.012, 8, 128), emissive(C.amber, 2), g); rs.push(m); }
      return { g, set(ph, a, col) {
        rs.forEach((m, i) => {
          const u = ((ph + i / rs.length) % 1 + 1) % 1;
          const R = (p.r0 || 0.12) + u * (p.r1 || 0.34);
          m.scale.set(R, R, R);
          const k = a * Math.sin(Math.PI * u) * 2.2;
          m.visible = k > 0.01;
          setEmi(m.material, col || C.amber, k);
        });
      } };
    }

    // Paper: a matte, slightly curled sheet with a printed canvas (lit by the scene lights, not emissive)
    function paper(p) {
      const w = p.w, h = p.h, ct = canvasTex(p.cw || 768, Math.round((p.cw || 768) * h / w));
      const geo = new T.PlaneGeometry(w, h, 24, 32);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, 0.018 * Math.pow(Math.abs(x) / (w / 2), 2) + 0.01 * Math.sin(y * 9 + 1) * (y / h)); }
      geo.computeVertexNormals();
      const m = new T.MeshStandardMaterial({ map: ct.tex, roughness: 0.92, metalness: 0, side: T.DoubleSide, envMapIntensity: 0.4 });
      const me = M(geo, m);
      let last = null;
      return { g: me, set(s) { const k = JSON.stringify(s); if (k === last) return; last = k; p.draw(ct.ctx, ct.cv.width, ct.cv.height, s); ct.tex.needsUpdate = true; } };
    }

    // ---------------------------------------------------------------- dust motes: drawn after DOF as real circles of confusion
    const motes = (() => {
      const n = LOOK.motes, r = rng(9);
      const pos = new Float32Array(n * 3), seed = new Float32Array(n * 2);
      const box = o.moteBox || { x: [-3, 3], y: [-2.2, 2.2], z: [-70, 3] };
      for (let i = 0; i < n; i++) {
        pos[i * 3] = lerp(box.x[0], box.x[1], r()); pos[i * 3 + 1] = lerp(box.y[0], box.y[1], r()); pos[i * 3 + 2] = lerp(box.z[0], box.z[1], r());
        seed[i * 2] = r(); seed[i * 2 + 1] = r();
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pos, 3));
      geo.setAttribute("seed", new T.BufferAttribute(seed, 2));
      const mat = new T.ShaderMaterial({
        uniforms: { t: { value: 0 }, focus: { value: 2 }, aper: { value: 12 }, H: { value: H }, fogA: { value: new T.Vector4() }, amber: { value: new T.Color(C.amber) }, gain: { value: 1 },
          tD: { value: null }, near: { value: 0.05 }, far: { value: 60 }, res: { value: new T.Vector2(W, H) } },
        vertexShader: `attribute vec2 seed; uniform float t, focus, aper, H, near, far; uniform vec4 fogA; uniform sampler2D tD;
          varying float vA; varying vec3 vC; varying float vR;
          float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
          float od(float s){ // optical depth of the fog ramp from 0 to s (fogA = d0, d1, r0, r1)
            float a = fogA.x * s; float k = clamp((s - fogA.z) / (fogA.w - fogA.z), 0.0, 1.0);
            float ramp = (fogA.y - fogA.x) * ((fogA.w - fogA.z) * (k * k * k - 0.5 * k * k * k * k)) ; // ∫ smoothstep
            float tail = (fogA.y - fogA.x) * max(0.0, s - fogA.w);
            return (a + ramp + tail) * 0.7; }
          void main(){
            vec3 p = position;
            float ph = seed.x * 6.2831;
            p += vec3(sin(t * 0.13 + ph) * 0.12, t * 0.012 * (0.5 + seed.y) + sin(t * 0.21 + ph * 1.7) * 0.06, cos(t * 0.11 + ph) * 0.1);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float z = -mv.z;
            gl_Position = projectionMatrix * mv;
            float coc = aper * abs(1.0 - focus / max(z, 0.05));
            float sz = clamp(2.5 + coc, 2.5, 90.0);
            gl_PointSize = sz;
            vR = sz;
            float energy = (seed.y > 0.86 ? 1.6 : 0.55) * (6.0 / (sz * sz) + 0.02) * 9.0;
            vec2 sp = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
            float sceneZ = lin(texture2D(tD, clamp(sp, 0.001, 0.999)).x);
            float occ = (z > sceneZ + 0.05) ? 0.0 : 1.0;
            vA = (z > 0.12 ? 1.0 : 0.0) * occ * exp(-od(z)) * energy * smoothstep(0.15, 0.6, z);
            vC = seed.y > 0.86 ? vec3(1.0, 0.68, 0.36) : vec3(0.55, 0.68, 0.95);
          }`,
        fragmentShader: `varying float vA; varying vec3 vC; varying float vR; uniform float gain;
          void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q);
            float disc = smoothstep(1.0, 1.0 - 4.0 / vR, r);
            float rim = 1.0 + 0.35 * smoothstep(0.55, 0.95, r) * step(8.0, vR);
            gl_FragColor = vec4(vC * vA * disc * rim * gain, 1.0); }`,
        transparent: true, depthTest: false, depthWrite: false, blending: T.AdditiveBlending,
      });
      const pts = new T.Points(geo, mat);
      pts.frustumCulled = false;
      const ms = new T.Scene(); ms.add(pts);
      return { scene: ms, mat };
    })();

    // ---------------------------------------------------------------- post: fog raymarch, DOF, bloom, grade
    const hdrRT = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
    const depRT = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    depRT.depthTexture = new T.DepthTexture(W, H, T.UnsignedIntType);
    const lin = { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false };
    const fw = Math.round(W / 2), fh = Math.round(H / 2);
    const fogRT = new T.WebGLRenderTarget(fw, fh, lin);
    const fogdRT = new T.WebGLRenderTarget(W, H, lin);
    const dw = Math.round(W * LOOK.dofScale), dh = Math.round(H * LOOK.dofScale);
    const preRT = new T.WebGLRenderTarget(dw, dh, lin), dofRT = new T.WebGLRenderTarget(dw, dh, lin);
    const postRT = new T.WebGLRenderTarget(W, H, lin);
    const bl = [4, 8, 16].map((k) => [new T.WebGLRenderTarget(Math.round(W / k), Math.round(H / k), lin), new T.WebGLRenderTarget(Math.round(W / k), Math.round(H / k), lin)]);
    const depthOnly = new T.MeshBasicMaterial({ colorWrite: false, side: T.DoubleSide });
    const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const LINF = `uniform float near, far; float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }`;
    const NL = 4;
    const fogM = new T.ShaderMaterial({
      uniforms: { tD: { value: depRT.depthTexture }, tN: { value: noiseTex }, near: { value: 0.05 }, far: { value: 60 },
        invP: { value: new T.Matrix4() }, camW: { value: new T.Matrix4() }, camPos: { value: new T.Vector3() },
        t: { value: 0 }, seed: { value: 0 }, fogA: { value: new T.Vector4() }, scale: { value: LOOK.fogScale }, steps: { value: LOOK.fogSteps }, maxD: { value: LOOK.fogMax },
        drift: { value: new T.Vector3(...LOOK.fogDrift) }, amb: { value: new T.Vector3(...LOOK.amb) }, contrast: { value: 1.0 },
        lP: { value: Array.from({ length: NL }, () => new T.Vector3()) }, lC: { value: Array.from({ length: NL }, () => new T.Vector3()) },
        lD: { value: Array.from({ length: NL }, () => new T.Vector4(0, -1, 0, -2)) } },
      vertexShader: VS,
      fragmentShader: `precision highp sampler3D; uniform sampler2D tD; uniform sampler3D tN; uniform mat4 invP, camW; uniform vec3 camPos, drift, amb;
        uniform float t, seed, scale, steps, maxD, contrast; uniform vec4 fogA; uniform vec3 lP[${NL}]; uniform vec3 lC[${NL}]; uniform vec4 lD[${NL}];
        varying vec2 vUv; ${LINF}
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
        float dens(vec3 p, float s){
          float n = texture(tN, p * scale * 0.25 + drift * t).r * 0.65 + texture(tN, p * scale * 0.61 - drift.zxy * t * 1.7).r * 0.35;
          n = clamp((n - 0.5) * 2.6 * contrast + 0.5, 0.0, 1.0);
          float sig = fogA.x + (fogA.y - fogA.x) * smoothstep(fogA.z, fogA.w, s);
          return sig * (0.12 + 1.9 * n * n);
        }
        void main(){
          vec2 ndc = vUv * 2.0 - 1.0;
          vec4 v = invP * vec4(ndc, 1.0, 1.0); vec3 dv = normalize(v.xyz / v.w);
          vec3 rd = normalize((camW * vec4(dv, 0.0)).xyz);
          float zl = lin(texture2D(tD, vUv).x);
          float dist = min(zl / max(-dv.z, 1e-3), maxD);
          float n = steps; float ds = dist / n;
          float s = ds * hash(vUv * 1024.0);
          float Tr = 1.0; vec3 L = vec3(0.0);
          for (int i = 0; i < 64; i++) {
            if (float(i) >= n) break;
            vec3 p = camPos + rd * s;
            float sg = dens(p, s);
            float big = texture(tN, p * scale * 0.28 + vec3(0.3, 0.1, 0.7) + drift * t * 0.5).r * 0.7 + texture(tN, p * scale * 0.07 + vec3(0.6, 0.2, 0.1)).r * 0.3;
            big = clamp((big - 0.5) * 3.0 + 0.5, 0.0, 1.0);
            vec3 li = amb * (0.05 + 3.4 * big * big * big) * (0.75 + 0.5 * clamp(rd.y * 1.5 + 0.5, 0.0, 1.0));
            for (int k = 0; k < ${NL}; k++) {
              vec3 dl = lP[k] - p; float d2 = dot(dl, dl); vec3 l = dl * inversesqrt(d2);
              float c = dot(-rd, -l);                                   // HG with g: forward scattering toward the eye
              float g = 0.55; float hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * c, 1.5) * 0.0796;
              float spot = lD[k].w < -1.5 ? 1.0 : smoothstep(lD[k].w, lD[k].w + 0.06, dot(-l, normalize(lD[k].xyz)));
              li += lC[k] * (hg * 0.7 + 0.03) * spot / (d2 + 0.12);
            }
            float a = exp(-sg * ds);
            L += Tr * (1.0 - a) * li;
            Tr *= a;
            s += ds;
          }
          gl_FragColor = vec4(L, Tr);
        }`,
      depthTest: false, depthWrite: false,
    });
    const fogC = new T.ShaderMaterial({
      uniforms: { tC: { value: hdrRT.texture }, tF: { value: fogRT.texture } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tF; varying vec2 vUv; void main(){ vec4 f = texture2D(tF, vUv); gl_FragColor = vec4(texture2D(tC, vUv).rgb * f.a + f.rgb, 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const pre = new T.ShaderMaterial({
      uniforms: { tC: { value: fogdRT.texture }, tD: { value: depRT.depthTexture }, px: { value: new T.Vector2(1 / W, 1 / H) },
        near: { value: 0.05 }, far: { value: 60 }, focus: { value: 2 }, aper: { value: 10 }, maxC: { value: 20 }, sc: { value: LOOK.dofScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tD; uniform vec2 px; uniform float focus, aper, maxC, sc; varying vec2 vUv; ${LINF}
        void main(){
          vec3 c = texture2D(tC, vUv).rgb;
          float d = lin(texture2D(tD, vUv + px * vec2(-0.5, -0.5)).x);
          d = min(d, lin(texture2D(tD, vUv + px * vec2(0.5, -0.5)).x));
          d = min(d, lin(texture2D(tD, vUv + px * vec2(-0.5, 0.5)).x));
          d = min(d, lin(texture2D(tD, vUv + px * vec2(0.5, 0.5)).x));
          float coc = clamp(aper * (1.0 - focus / d) * sc, -maxC, maxC);
          gl_FragColor = vec4(c, coc);
        }`,
      depthTest: false, depthWrite: false,
    });
    const gather = new T.ShaderMaterial({
      uniforms: { tP: { value: preRT.texture }, px: { value: new T.Vector2(1 / dw, 1 / dh) }, maxR: { value: 20 }, rs: { value: LOOK.radScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tP; uniform vec2 px; uniform float maxR, rs; varying vec2 vUv;
        void main(){
          vec4 c0 = texture2D(tP, vUv);
          float cs = abs(c0.a);
          vec3 col = c0.rgb; float tot = 1.0; float nearS = 0.0;
          float r = rs;
          for (int i = 0; i < 500; i++) {
            if (r >= maxR) break;
            float ang = float(i) * 2.39996323;
            vec4 s = texture2D(tP, vUv + vec2(cos(ang), sin(ang)) * px * r);
            float ss = abs(s.a);
            if (s.a > c0.a) ss = clamp(ss, 0.0, cs * 2.0);
            float m = smoothstep(r - 0.5, r + 0.5, ss);
            col += mix(col / tot, s.rgb, m);
            tot += 1.0;
            if (s.a < 0.0 && -s.a > r) nearS = max(nearS, -s.a * m);
            r += rs / r;
          }
          gl_FragColor = vec4(col / tot, max(cs, nearS));
        }`,
      depthTest: false, depthWrite: false,
    });
    const dofC = new T.ShaderMaterial({
      uniforms: { tC: { value: fogdRT.texture }, tB: { value: dofRT.texture }, tD: { value: depRT.depthTexture }, near: { value: 0.05 }, far: { value: 60 },
        focus: { value: 2 }, aper: { value: 10 }, sc: { value: LOOK.dofScale } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tB, tD; uniform float focus, aper, sc; varying vec2 vUv; ${LINF}
        void main(){ vec3 sharp = texture2D(tC, vUv).rgb; vec4 b = texture2D(tB, vUv);
          float d = lin(texture2D(tD, vUv).x); float coc = abs(aper * (1.0 - focus / d)) * sc;
          float k = smoothstep(0.35, 1.6, max(coc, b.a));
          gl_FragColor = vec4(mix(sharp, b.rgb, k), 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const down = new T.ShaderMaterial({
      uniforms: { tC: { value: null }, px: { value: new T.Vector2() }, thr: { value: LOOK.bloomThr }, first: { value: 1 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 px; uniform float thr, first; varying vec2 vUv;
        void main(){ vec3 c = vec3(0.0);
          for (int i = -1; i <= 2; i++) for (int j = -1; j <= 2; j++) c += texture2D(tC, vUv + px * vec2(float(i) - 0.5, float(j) - 0.5)).rgb;
          c /= 16.0;
          if (first > 0.5) { float l = max(c.r, max(c.g, c.b)); float k = clamp((l - thr) / (thr + 0.6), 0.0, 1.0); c *= k * k * 1.0 + 0.0; }
          gl_FragColor = vec4(c, 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const blur = new T.ShaderMaterial({
      uniforms: { tC: { value: null }, dir: { value: new T.Vector2() } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC; uniform vec2 dir; varying vec2 vUv;
        void main(){ float w[5]; w[0] = 0.227; w[1] = 0.1945; w[2] = 0.1216; w[3] = 0.054; w[4] = 0.0162;
          vec3 c = texture2D(tC, vUv).rgb * w[0];
          for (int i = 1; i < 5; i++) { c += texture2D(tC, vUv + dir * float(i) * 1.4).rgb * w[i]; c += texture2D(tC, vUv - dir * float(i) * 1.4).rgb * w[i]; }
          gl_FragColor = vec4(c, 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const comp = new T.ShaderMaterial({
      uniforms: { tC: { value: postRT.texture }, tB0: { value: bl[0][0].texture }, tB1: { value: bl[1][0].texture }, tB2: { value: bl[2][0].texture },
        expo: { value: 1 }, sat: { value: LOOK.sat }, vig: { value: LOOK.vig }, con: { value: LOOK.contrast }, bloom: { value: LOOK.bloom },
        lift: { value: new T.Vector3(...LOOK.lift) }, res: { value: new T.Vector2(W, H) }, seed: { value: 0 }, grain: { value: LOOK.grain }, ca: { value: LOOK.ca },
        tint: { value: new T.Vector3(1, 1, 1) }, black: { value: 0 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tC, tB0, tB1, tB2; uniform float expo, sat, vig, con, bloom, seed, grain, ca, black; uniform vec3 lift, tint; uniform vec2 res; varying vec2 vUv;
        vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
        void main(){
          vec2 q = vUv - 0.5;
          vec2 off = q * ca / res.x * 2.0;
          vec3 c = vec3(texture2D(tC, vUv + off).r, texture2D(tC, vUv).g, texture2D(tC, vUv - off).b);
          c += (texture2D(tB0, vUv).rgb * 0.5 + texture2D(tB1, vUv).rgb * 0.8 + texture2D(tB2, vUv).rgb * 1.1) * bloom;
          c *= expo * tint;
          c = aces(c);
          c = (c - 0.5) * con + 0.5;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, sat), 0.0);
          c += lift * (1.0 - c);
          vec2 qa = q; qa.x *= res.x / res.y;
          c *= 1.0 - vig * smoothstep(0.2, 0.95, length(qa) * 1.25);
          c = toSRGB(clamp(c, 0.0, 1.0));
          float gr = hash(vUv * res) - 0.5; float gr2 = hash(vUv * res + 17.0) - 0.5;
          c += (gr + gr2) * grain * (0.35 + 0.65 * (1.0 - l));
          c *= 1.0 - black;
          c += (hash(vUv * res + 3.0) - 0.5) / 255.0;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), pre);
    quad.frustumCulled = false;
    const qScene = new T.Scene(); qScene.add(quad);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(qScene, qCam); }

    const fwd = new T.Vector3(), tv = new T.Vector3();
    const fogA = new T.Vector4();
    // st: { t, cam, look, fov, roll, focus ([x,y,z] | metres), aperture (full-res px of blur at infinity), exposure, black,
    //       lights: [{ pos, color, i (scene, candela-ish), fog (halo gain), spot: [dx,dy,dz,cosAngle] }], key, hemi, env, fog: {d1, contrast}, bloom, sat }
    function render(st) {
      const t = st.t || 0;
      const Ls = st.lights || [];
      for (let i = 0; i < 4; i++) {
        const L = Ls[i], p = pool[i];
        if (!L) { p.intensity = 0; fogM.uniforms.lC.value[i].set(0, 0, 0); continue; }
        p.position.fromArray(L.pos); p.color.set(L.color); p.intensity = L.i != null ? L.i : 1; p.distance = 0; p.decay = 2;
        const c = new T.Color(L.color);
        const fk = (L.fog != null ? L.fog : 1) * (L.i != null ? L.i : 1) * 0.12;
        fogM.uniforms.lP.value[i].fromArray(L.pos);
        fogM.uniforms.lC.value[i].set(c.r * fk, c.g * fk, c.b * fk);
        if (L.spot) fogM.uniforms.lD.value[i].set(L.spot[0], L.spot[1], L.spot[2], L.spot[3]); else fogM.uniforms.lD.value[i].set(0, -1, 0, -2);
      }
      keyL.intensity = st.key != null ? st.key : 0.35;
      hemi.intensity = st.hemi != null ? st.hemi : 0.25;
      scene.environmentIntensity = st.env != null ? st.env : 1.0;
      (st.pre || []).forEach((f) => f(st));
      camera.fov = st.fov || 32;
      camera.position.fromArray(st.cam);
      camera.up.set(0, 1, 0);
      camera.lookAt(st.look[0], st.look[1], st.look[2]);
      if (st.roll) camera.rotateZ(st.roll * D2R);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      scene.updateMatrixWorld();
      let F = 2;
      camera.getWorldDirection(fwd);
      if (Array.isArray(st.focus)) F = tv.fromArray(st.focus).sub(camera.position).dot(fwd); else if (st.focus) F = st.focus;
      F = Math.max(0.2, F);
      const A = st.aperture != null ? st.aperture : 10;
      const maxC = Math.min(LOOK.maxCoC, st.maxBlur || LOOK.maxCoC) * LOOK.dofScale;
      const fg = st.fog || {};
      fogA.set(fg.d0 != null ? fg.d0 : LOOK.fogD0, fg.d1 != null ? fg.d1 : LOOK.fogD1, fg.r0 != null ? fg.r0 : LOOK.fogR0, fg.r1 != null ? fg.r1 : LOOK.fogR1);
      if (window.GLOW_MASK) { // QA: every object white on black, no post (tools/frame_check.py measures the caption band + edges)
        const sw = [], bg = scene.background;
        scene.background = new T.Color(0, 0, 0);
        scene.traverse((ob) => {
          if (!ob.isMesh || !ob.visible) return;
          let mm = ob.userData.maskMat;
          if (!mm) {
            const dm = ob.userData.depthMat;
            mm = dm ? new T.MeshBasicMaterial({ map: dm.map, alphaTest: 0.5, color: 0xffffff, side: T.DoubleSide }) : new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide });
            ob.userData.maskMat = mm;
          }
          if (ob.userData.depthMat) mm.opacity = ob.userData.depthMat.opacity;
          sw.push([ob, ob.material]); ob.material = mm;
        });
        renderer.setRenderTarget(null); renderer.render(scene, camera);
        sw.forEach(([ob, m]) => { ob.material = m; });
        scene.background = bg;
        return;
      }
      // 1) lit HDR frame (MSAA)  2) depth
      renderer.setRenderTarget(hdrRT); renderer.render(scene, camera);
      const swapped = [];
      scene.traverse((ob) => { if (ob.isMesh && ob.visible) { swapped.push([ob, ob.material]); ob.material = ob.userData.depthMat || depthOnly; } });
      renderer.setRenderTarget(depRT); renderer.render(scene, camera);
      swapped.forEach(([ob, m]) => { ob.material = m; });
      // 3) fog raymarch (half res) + composite
      const fu = fogM.uniforms;
      fu.invP.value.copy(camera.projectionMatrixInverse); fu.camW.value.copy(camera.matrixWorld); fu.camPos.value.copy(camera.position);
      fu.t.value = t; fu.seed.value = (t * 30) % 61; fu.fogA.value.copy(fogA);
      fu.contrast.value = fg.contrast != null ? fg.contrast : 1.0;
      if (fg.amb) fu.amb.value.set(...fg.amb); else fu.amb.value.set(...LOOK.amb);
      pass(fogM, fogRT);
      pass(fogC, fogdRT);
      // 4) DOF
      pre.uniforms.focus.value = F; pre.uniforms.aper.value = A; pre.uniforms.maxC.value = maxC;
      pass(pre, preRT);
      gather.uniforms.maxR.value = Math.max(1.5, Math.min(maxC, Math.abs(A) * LOOK.dofScale * 1.05 + 1));
      pass(gather, dofRT);
      dofC.uniforms.focus.value = F; dofC.uniforms.aper.value = A;
      pass(dofC, postRT);
      // 5) motes on top (true CoC discs, analytically fogged)
      const mu = motes.mat.uniforms;
      mu.t.value = t; mu.focus.value = F; mu.aper.value = A * (st.moteAper != null ? st.moteAper : 1.4); mu.fogA.value.copy(fogA); mu.tD.value = depRT.depthTexture;
      mu.gain.value = st.motes != null ? st.motes : 1;
      renderer.autoClear = false;
      renderer.setRenderTarget(postRT); renderer.render(motes.scene, camera);
      renderer.autoClear = true;
      // 6) bloom pyramid
      let src = postRT;
      bl.forEach((pair, li) => {
        const [a, b] = pair;
        down.uniforms.tC.value = src.texture; down.uniforms.px.value.set(1 / src.width, 1 / src.height); down.uniforms.first.value = li === 0 ? 1 : 0;
        down.uniforms.thr.value = st.bloomThr != null ? st.bloomThr : LOOK.bloomThr;
        pass(down, a);
        blur.uniforms.tC.value = a.texture; blur.uniforms.dir.value.set(1 / a.width, 0); pass(blur, b);
        blur.uniforms.tC.value = b.texture; blur.uniforms.dir.value.set(0, 1 / a.height); pass(blur, a);
        src = a;
      });
      // 7) grade
      const cu = comp.uniforms;
      cu.expo.value = st.exposure != null ? st.exposure : 1; cu.black.value = st.black || 0;
      cu.sat.value = st.sat != null ? st.sat : LOOK.sat; cu.bloom.value = st.bloom != null ? st.bloom : LOOK.bloom;
      cu.vig.value = st.vig != null ? st.vig : LOOK.vig; cu.seed.value = (t * 30) % 97;
      if (st.tint) cu.tint.value.set(...st.tint); else cu.tint.value.set(1, 1, 1);
      pass(comp, null);
      renderer.setRenderTarget(null);
    }

    return {
      T, scene, camera, renderer, LOOK, C, D, rng, clamp, lerp, sstep, canvasTex, glass, metal, emissive, setEmi, contentMat, slab, rrShape, M,
      panel, key, toggle, padlock, clock, phone, dots, rings, paper, render,
      get ready() { return Promise.all(loads).then(() => new Promise((r) => setTimeout(r, 30))); },
    };
  }

  window.GLOW = { create, C };
})();
