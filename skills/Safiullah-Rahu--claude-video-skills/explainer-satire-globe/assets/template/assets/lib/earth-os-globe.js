/* Earth OS globe kit — a seek-safe three.js planet for HyperFrames.
 *
 * One renderer, four looks of the same planet, all drawn from a state object that the scene computes from
 * timeline time (never from the previous frame):
 *   - dotted orb   : Fibonacci land dots that assemble from a seeded cloud (state.assemble 0..1, state.dots 0..1)
 *   - real globe   : NASA Blue Marble on a lit sphere with an ice-blue rim (state.tex 0..1)
 *   - dive patch   : a sharper regional crop laid on the sphere as a spherical patch (state.patch = {id, amt})
 *   - signals      : orange pings with expanding rings (state.pings = {id: 0..1}) and great-circle arcs
 *                    (state.arcs = [{i, head 0..1, tail 0..1, amt 0..1}])
 * Camera: state.lat/lon (deg), state.alt (altitude above the unit sphere), state.ox/oy (screen shift in px,
 * negative = left/up), state.tilt (deg south of the target), state.look (0 = look at the centre, 1 = at lat/lon).
 *
 * Needs window.THREE (r150+; this project vendors r170 as assets/lib/three.global.js).
 * Usage:
 *   const g = EarthOSGlobe.create({ canvas, width, height, earth: "assets/img/earth.jpg", dots: window.LAND_DOTS,
 *                                   hotspots: [{ id, lat, lon, patch: { src, latMin, latMax, lonMin, lonMax } }],
 *                                   arcs: [["a", "b"], ...], colors: { ... } });
 *   await g.ready;  g.render(state);
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;

  function ll(lat, lon, r) {
    // matches THREE.SphereGeometry's UV layout: u = 0 at lon -180, v = 1 at the north pole
    const phi = (90 - lat) * D2R;
    const th = (lon + 180) * D2R;
    return new T.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hex(c) {
    const col = new T.Color(c);
    return new T.Vector3(col.r, col.g, col.b);
  }

  const SURFACE_VS = `
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vN = normalize(mat3(modelMatrix) * normal);
      vV = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const SURFACE_FS = `
    uniform sampler2D map; uniform float uOpacity; uniform vec3 uLight; uniform vec3 uRim;
    uniform float uFeather; uniform float uAmbient; uniform float uKey; uniform float uRimAmt;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main() {
      vec3 c = texture2D(map, vUv).rgb;
      float l = uAmbient + uKey * max(dot(normalize(vN), uLight), 0.0);
      c *= l;
      float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 3.0);
      c += uRim * f * uRimAmt;
      float a = uOpacity;
      if (uFeather > 0.0) {
        vec2 e = smoothstep(vec2(0.0), vec2(uFeather), vUv) * smoothstep(vec2(1.0), vec2(1.0 - uFeather), vUv);
        a *= e.x * e.y;
      }
      gl_FragColor = vec4(min(c, vec3(1.0)), a);
    }`;

  const DOTS_VS = `
    attribute vec3 aScatter; attribute float aSeed;
    uniform float uAssemble; uniform float uSize; uniform float uScale; uniform float uLift;
    varying float vSeed; varying float vFace;
    void main() {
      float p = clamp(uAssemble * 1.45 - aSeed * 0.45, 0.0, 1.0);
      p = 1.0 - pow(1.0 - p, 3.0);
      vec3 target = position * (1.0 + uLift);
      float sw = (1.0 - p) * (1.1 + aSeed * 0.8);
      vec3 sc = vec3(aScatter.x * cos(sw) - aScatter.z * sin(sw), aScatter.y, aScatter.x * sin(sw) + aScatter.z * cos(sw));
      vec3 pos = mix(sc, target, p);
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(uSize * uScale / max(-mv.z, 0.001), 1.0, 28.0);
      vSeed = aSeed;
      vec3 wn = normalize(pos);
      vFace = dot(wn, normalize(cameraPosition));
    }`;
  const DOTS_FS = `
    uniform vec3 uColor; uniform float uOpacity;
    varying float vSeed; varying float vFace;
    void main() {
      vec2 q = gl_PointCoord - 0.5;
      float d = length(q);
      float a = smoothstep(0.5, 0.32, d);
      float bright = vSeed > 0.85 ? 1.0 : 0.78;
      float limb = smoothstep(-0.05, 0.35, vFace) * 0.65 + 0.35;
      gl_FragColor = vec4(uColor * bright, a * uOpacity * limb);
    }`;

  const ARC_VS = `
    varying float vU;
    void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const ARC_FS = `
    uniform float uHead; uniform float uTail; uniform float uAmt; uniform vec3 uColor; uniform vec3 uHeadColor;
    varying float vU;
    void main() {
      if (vU > uHead || vU < uTail) discard;
      float h = smoothstep(uHead - 0.06, uHead, vU);
      float tl = smoothstep(uTail, uTail + 0.08, vU);
      gl_FragColor = vec4(mix(uColor, uHeadColor, h), uAmt * (0.35 + 0.65 * tl));
    }`;

  function create(o) {
    const W = o.width || 1920;
    const H = o.height || 1080;
    const C = Object.assign(
      { dot: "#EAF6FF", core: "#0A1E2E", rim: "#96CDFF", accent: "#FF6B1A", arc: "#EAF6FF" },
      o.colors || {}
    );
    T.ColorManagement.enabled = false;
    const renderer = new T.WebGLRenderer({
      canvas: o.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance",
    });
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const fov = o.fov || 35;
    const camera = new T.PerspectiveCamera(fov, W / H, 0.005, 60);
    const pxScale = H / 2 / Math.tan((fov / 2) * D2R); // pixels per world unit at distance 1
    const scene = new T.Scene();
    const loader = new T.TextureLoader();
    const loads = [];

    function tex(src) {
      const t = loader.load(src);
      t.anisotropy = maxAniso;
      t.generateMipmaps = true;
      t.minFilter = T.LinearMipmapLinearFilter;
      loads.push(new Promise((res, rej) => {
        const img = new Image();
        img.onload = res; img.onerror = rej; img.src = src;
      }));
      return t;
    }
    function surfaceMat(map, feather) {
      return new T.ShaderMaterial({
        uniforms: {
          map: { value: map }, uOpacity: { value: 1 }, uLight: { value: new T.Vector3(0, 0, 1) },
          uRim: { value: hex(C.rim) }, uFeather: { value: feather || 0 }, uAmbient: { value: 0.55 },
          uKey: { value: 0.6 }, uRimAmt: { value: feather ? 0.0 : 0.35 },
        },
        vertexShader: SURFACE_VS, fragmentShader: SURFACE_FS, transparent: true, depthWrite: !feather,
      });
    }

    // opaque core: hides the far side of the orb
    const core = new T.Mesh(new T.SphereGeometry(0.994, 96, 48), new T.MeshBasicMaterial({ color: C.core }));
    core.renderOrder = 0;
    scene.add(core);

    // real globe
    const earthMat = surfaceMat(tex(o.earth), 0);
    const earth = new T.Mesh(new T.SphereGeometry(1, 160, 80), earthMat);
    earth.renderOrder = 1;
    scene.add(earth);

    // dive patches
    const patches = {};
    (o.hotspots || []).forEach((h) => {
      if (!h.patch) return;
      const p = h.patch;
      const g = new T.SphereGeometry(1.0012, 96, 96,
        (p.lonMin + 180) * D2R, (p.lonMax - p.lonMin) * D2R, (90 - p.latMax) * D2R, (p.latMax - p.latMin) * D2R);
      const m = surfaceMat(tex(p.src), 0.07);
      const mesh = new T.Mesh(g, m);
      mesh.renderOrder = 2;
      mesh.visible = false;
      scene.add(mesh);
      patches[h.id] = mesh;
    });

    // dotted orb
    const dotsSrc = o.dots || new Float32Array(0);
    const n = dotsSrc.length / 2;
    const pos = new Float32Array(n * 3), scat = new Float32Array(n * 3), seed = new Float32Array(n);
    const rnd = mulberry32(o.seed || 2610);
    for (let i = 0; i < n; i++) {
      const v = ll(dotsSrc[2 * i], dotsSrc[2 * i + 1], 1.006);
      pos[3 * i] = v.x; pos[3 * i + 1] = v.y; pos[3 * i + 2] = v.z;
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 1.03 + Math.pow(rnd(), 2.2) * 0.55, s = Math.sqrt(1 - u * u);
      scat[3 * i] = r * s * Math.cos(a); scat[3 * i + 1] = r * u; scat[3 * i + 2] = r * s * Math.sin(a);
      seed[i] = rnd();
    }
    const dg = new T.BufferGeometry();
    dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    dg.setAttribute("aScatter", new T.BufferAttribute(scat, 3));
    dg.setAttribute("aSeed", new T.BufferAttribute(seed, 1));
    const dotsMat = new T.ShaderMaterial({
      uniforms: {
        uAssemble: { value: 1 }, uSize: { value: o.dotSize || 0.0072 }, uScale: { value: pxScale },
        uColor: { value: hex(C.dot) }, uOpacity: { value: 1 }, uLift: { value: 0 },
      },
      vertexShader: DOTS_VS, fragmentShader: DOTS_FS, transparent: true, depthWrite: false,
    });
    const dots = new T.Points(dg, dotsMat);
    dots.renderOrder = 3;
    dots.frustumCulled = false;
    scene.add(dots);

    // pings
    const pings = {};
    const ringGeo = new T.RingGeometry(0.8, 1.0, 72);
    const discGeo = new T.CircleGeometry(1, 48);
    (o.hotspots || []).forEach((h) => {
      const grp = new T.Group();
      const p = ll(h.lat, h.lon, 1.0025);
      grp.position.copy(p);
      grp.lookAt(p.clone().multiplyScalar(2));
      const mk = (geo, op) => {
        const m = new T.Mesh(geo, new T.MeshBasicMaterial({
          color: C.accent, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide,
        }));
        m.renderOrder = 5;
        grp.add(m);
        return m;
      };
      const halo = mk(discGeo, 0.25);
      const disc = mk(discGeo, 1);
      const rings = [mk(ringGeo, 1), mk(ringGeo, 1), mk(ringGeo, 1)];
      grp.visible = false;
      scene.add(grp);
      pings[h.id] = { grp, disc, halo, rings, p };
    });

    // great-circle arcs
    const byId = {};
    (o.hotspots || []).forEach((h) => (byId[h.id] = h));
    const arcs = (o.arcs || []).map(([a, b]) => {
      const A = ll(byId[a].lat, byId[a].lon, 1).normalize();
      const B = ll(byId[b].lat, byId[b].lon, 1).normalize();
      const ang = A.angleTo(B);
      const hgt = 0.04 + 0.22 * (ang / Math.PI);
      const pts = [];
      for (let k = 0; k <= 64; k++) {
        const s = k / 64;
        const v = new T.Vector3().copy(A).multiplyScalar(Math.sin((1 - s) * ang) / Math.sin(ang))
          .add(new T.Vector3().copy(B).multiplyScalar(Math.sin(s * ang) / Math.sin(ang)));
        pts.push(v.normalize().multiplyScalar(1.004 + hgt * Math.sin(Math.PI * s)));
      }
      const geo = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 220, o.arcRadius || 0.0022, 6, false);
      const mat = new T.ShaderMaterial({
        uniforms: {
          uHead: { value: 0 }, uTail: { value: 0 }, uAmt: { value: 0 }, uColor: { value: hex(C.arc) },
          uHeadColor: { value: hex(C.accent) },
        },
        vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false,
      });
      const mesh = new T.Mesh(geo, mat);
      mesh.renderOrder = 4;
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    });

    const tmpL = new T.Vector3();
    function render(s) {
      // camera
      const alt = Math.max(0.02, s.alt);
      const tilt = s.tilt || 0;
      camera.position.copy(ll(s.lat - tilt, s.lon, 1 + alt));
      const look = s.look || 0;
      const tgt = ll(s.lat, s.lon, 1).multiplyScalar(look);
      camera.up.set(0, 1, 0);
      camera.lookAt(tgt);
      camera.setViewOffset(W, H, -(s.ox || 0), -(s.oy || 0), W, H);
      camera.updateMatrixWorld();
      // key light: upper left of the camera, slightly toward it
      const e = camera.matrixWorld.elements;
      tmpL.set(-0.45 * e[0] + 0.55 * e[4] + 0.75 * e[8], -0.45 * e[1] + 0.55 * e[5] + 0.75 * e[9],
        -0.45 * e[2] + 0.55 * e[6] + 0.75 * e[10]).normalize();

      const texAmt = s.tex == null ? 1 : s.tex;
      earthMat.uniforms.uOpacity.value = texAmt;
      earthMat.uniforms.uLight.value.copy(tmpL);
      earth.visible = texAmt > 0.001;

      Object.keys(patches).forEach((id) => {
        const m = patches[id];
        const amt = s.patch && s.patch.id === id ? s.patch.amt : 0;
        m.visible = amt > 0.001;
        m.material.uniforms.uOpacity.value = amt;
        m.material.uniforms.uLight.value.copy(tmpL);
      });

      const dAmt = s.dots == null ? 1 : s.dots;
      dotsMat.uniforms.uOpacity.value = dAmt;
      dotsMat.uniforms.uAssemble.value = s.assemble == null ? 1 : s.assemble;
      dotsMat.uniforms.uLift.value = s.lift || 0;
      dots.visible = dAmt > 0.001;
      core.visible = (s.core == null ? 1 : s.core) > 0.5;

      // pings: constant screen size, rings from time
      const t = s.t || 0;
      const perPx = (2 * Math.tan((fov / 2) * D2R)) / H; // world units per px at distance 1
      Object.keys(pings).forEach((id) => {
        const P = pings[id];
        const amt = (s.pings && s.pings[id]) || 0;
        P.grp.visible = amt > 0.001;
        if (!P.grp.visible) return;
        const k = camera.position.distanceTo(P.p) * perPx;
        const pop = Math.min(1, amt * 1.6);
        P.disc.scale.setScalar(k * 8 * pop);
        P.disc.material.opacity = Math.min(1, amt * 2);
        P.halo.scale.setScalar(k * 16 * pop);
        P.halo.material.opacity = 0.22 * amt;
        P.rings.forEach((r, j) => {
          const ph = ((t * 0.75 + j / 3 + (id.length * 0.13)) % 1 + 1) % 1;
          r.scale.setScalar(k * (10 + 58 * ph));
          r.material.opacity = amt * Math.pow(1 - ph, 1.6) * 0.9;
        });
      });

      arcs.forEach((m, i) => {
        const a = (s.arcs || []).find((q) => q.i === i);
        m.visible = !!a && a.amt > 0.001 && a.head > a.tail;
        if (!m.visible) return;
        m.material.uniforms.uHead.value = a.head;
        m.material.uniforms.uTail.value = a.tail || 0;
        m.material.uniforms.uAmt.value = a.amt;
      });

      renderer.render(scene, camera);
    }

    const ready = Promise.all(loads).then(() => new Promise((res) => setTimeout(res, 0)));
    return { render, ready, camera, renderer, scene, ll };
  }

  window.EarthOSGlobe = { create, ll, mulberry32 };
})();
