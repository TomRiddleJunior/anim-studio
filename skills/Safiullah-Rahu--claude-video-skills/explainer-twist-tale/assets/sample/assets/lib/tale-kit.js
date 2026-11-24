/* Tale kit — toon-shaded 3D sets with ink outlines and flat doodle characters, for seek-safe HyperFrames shorts.
 *
 *   const K = TALE.create({ canvas, width: 1080, height: 1920 });
 *   const set = K.set("street", { bg, fog, sky, ground, sun, sunPos, shadow });   // a THREE.Group, hidden by default
 *   K.box(w, h, d, color, { x, y, z, ry, parent: set });   K.cyl / K.cone / K.sphere / K.roof / K.plane / K.clock
 *   const a = K.actor("willett", { happy: "assets/chars/willett-happy.svg", ... }, { h: 1.6, x, z, parent: set });
 *   await K.ready;   K.render({ set: "street", cam: [x, y, z], look: [x, y, z], fov: 45 });
 *
 * Look: MeshToonMaterial with a 3-step gradient, one shadowed key light + hemisphere fill, fog; then an ink pass
 * that draws outlines where view-space normals or linear depth jump (so every primitive gets a drawn edge) and leaves
 * the characters' own SVG outlines alone. Characters are unlit billboards that turn to face the camera (yaw only),
 * cast alpha-cut shadows and swap textures for expressions. Everything is a function of the state passed to render().
 */
(function () {
  "use strict";
  const T = window.THREE;
  const D2R = Math.PI / 180;

  function create(o) {
    const W = o.width || 1080, H = o.height || 1920;
    T.ColorManagement.enabled = false;
    const renderer = new T.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, preserveDrawingBuffer: true,
      powerPreference: "high-performance" });
    renderer.outputColorSpace = T.LinearSRGBColorSpace;
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, W / H, 0.05, 400);
    const loader = new T.TextureLoader();
    const loads = [];
    const texCache = {};
    function tex(src) {
      if (texCache[src]) return texCache[src];
      const t = loader.load(src);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      t.colorSpace = T.NoColorSpace;
      loads.push(new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = src; }));
      texCache[src] = t;
      return t;
    }

    // normal-pass shaders (ink detection): alpha-cut by the texture when there is one
    const NV = `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
    const NF = `uniform sampler2D map; uniform float useMap; varying vec2 vUv; varying vec3 vN;
      void main(){ if (useMap > 0.5 && texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, 1.0); }`;
    // objects that must not get ink (light beams, glows): invisible in the normal pass
    const inkless = new T.ShaderMaterial({ vertexShader: NV, fragmentShader: "void main(){ discard; gl_FragColor = vec4(0.0); }" });

    // ---- toon material: 3-step ramp
    const ramp = new T.DataTexture(new Uint8Array([120, 120, 120, 255, 196, 196, 196, 255, 255, 255, 255, 255]), 3, 1, T.RGBAFormat);
    ramp.minFilter = ramp.magFilter = T.NearestFilter;
    ramp.needsUpdate = true;
    const matCache = {};
    function mat(color, opt) {
      opt = opt || {};
      const key = color + JSON.stringify(opt);
      if (!opt.map && matCache[key]) return matCache[key];
      const m = opt.basic ? new T.MeshBasicMaterial({ color, map: opt.map || null, transparent: !!opt.transparent, opacity: opt.opacity == null ? 1 : opt.opacity, alphaTest: opt.alphaTest || 0, side: opt.side || T.FrontSide })
        : new T.MeshToonMaterial({ color, gradientMap: ramp, map: opt.map || null, emissive: opt.emissive || 0x000000, side: opt.side || T.FrontSide, alphaTest: opt.alphaTest || 0 });
      if (!opt.map) matCache[key] = m;
      return m;
    }

    // ---- lights (re-aimed per set)
    const hemi = new T.HemisphereLight(0xffffff, 0x888888, 1.15);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xffffff, 1.55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);

    const sets = {};
    function set(name, opt) {
      const g = new T.Group();
      g.name = name;
      g.visible = false;
      g.userData = Object.assign({ bg: "#bfe3ff", fog: null, sky: "#ffffff", ground: "#9a8f80", sun: "#fff3dc", sunI: 1.55, hemiI: 1.15,
        sunPos: [6, 12, 8], shadow: 10, ink: "#22202b" }, opt || {});
      scene.add(g);
      sets[name] = g;
      return g;
    }
    function place(m, p) {
      p = p || {};
      m.position.set(p.x || 0, p.y || 0, p.z || 0);
      m.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R);
      if (p.s) m.scale.setScalar(p.s);
      if (p.sx || p.sy || p.sz) m.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
      m.castShadow = p.cast !== false;
      m.receiveShadow = p.receive !== false;
      if (p.noink) m.traverse((c) => (c.userData.nmat = inkless));
      (p.parent || scene).add(m);
      return m;
    }
    // primitives sit ON y (their base at y) unless p.center
    function box(w, h, d, color, p) {
      p = Object.assign({}, p);
      const g = new T.BoxGeometry(w, h, d);
      if (!p.center) g.translate(0, h / 2, 0);
      return place(new T.Mesh(g, mat(color, p.mat)), p);
    }
    function cyl(r1, r2, h, color, p) {
      p = Object.assign({}, p);
      const g = new T.CylinderGeometry(r1, r2, h, p.seg || 24);
      if (!p.center) g.translate(0, h / 2, 0);
      return place(new T.Mesh(g, mat(color, p.mat)), p);
    }
    function cone(r, h, color, p) { return cyl(0.0001, r, h, color, Object.assign({ seg: (p && p.seg) || 24 }, p)); }
    function sphere(r, color, p) {
      p = Object.assign({}, p);
      return place(new T.Mesh(new T.SphereGeometry(r, p.seg || 24, p.seg2 || 16), mat(color, p.mat)), p);
    }
    function ico(r, color, p) {
      p = Object.assign({}, p);
      return place(new T.Mesh(new T.IcosahedronGeometry(r, 0), mat(color, p.mat)), p);
    }
    // gable roof: triangular prism w (x) by d (z), height h, base at y
    function roof(w, h, d, color, p) {
      const s = new T.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
      g.translate(0, 0, -d / 2);
      return place(new T.Mesh(g, mat(color, p && p.mat)), p);
    }
    // textured flat card (signs, papers, flags, windows); basic = unlit
    function plane(w, h, src, p) {
      p = Object.assign({ cast: false }, p);
      const textured = src && !src.startsWith("#");
      const m = new T.Mesh(new T.PlaneGeometry(w, h), !textured ? mat(src, p.mat) :
        mat("#ffffff", Object.assign({ map: tex(src), basic: p.lit === false || p.basic !== false, alphaTest: 0.5, side: T.DoubleSide }, p.mat)));
      if (textured) m.userData.nmat = new T.ShaderMaterial({ uniforms: { map: { value: tex(src) }, useMap: { value: 1 } }, vertexShader: NV, fragmentShader: NF, side: T.DoubleSide });
      if (p.noink) m.userData.nmat = inkless;
      return place(m, p);
    }
    // a wall clock: face texture + two hands (set(h, m)); facing +z
    function clock(r, p) {
      p = Object.assign({}, p);
      const g = new T.Group();
      const rim = new T.Mesh(new T.CylinderGeometry(r * 1.08, r * 1.08, r * 0.16, 48), mat(p.rim || "#5a3b26"));
      rim.rotation.x = Math.PI / 2;
      rim.castShadow = true;
      g.add(rim);
      const face = new T.Mesh(new T.CircleGeometry(r, 48), mat("#ffffff", { map: tex(p.face || "assets/props/clockface.svg"), basic: true }));
      face.position.z = r * 0.081;
      g.add(face);
      const mk = (len, wid, z) => {
        const hand = new T.Group();
        const bar = new T.Mesh(new T.BoxGeometry(wid, len, r * 0.03), mat(p.hand || "#22202b", { basic: true }));
        bar.position.y = len / 2 - len * 0.12;
        hand.add(bar);
        hand.position.z = z;
        g.add(hand);
        return hand;
      };
      const hh = mk(r * 0.52, r * 0.085, r * 0.1), mh = mk(r * 0.8, r * 0.055, r * 0.12);
      const pin = new T.Mesh(new T.CircleGeometry(r * 0.07, 20), mat(p.pin || "#c4342a", { basic: true }));
      pin.position.z = r * 0.14;
      g.add(pin);
      place(g, Object.assign({ cast: true }, p));
      g.userData.set = (h, m) => {
        mh.rotation.z = -(m / 60) * Math.PI * 2;
        hh.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
      };
      g.userData.set(10, 10);
      return g;
    }

    // ---- doodle actors: yaw-billboards with expression textures and alpha-cut shadows
    const actors = [];
    function actor(id, srcs, p) {
      p = Object.assign({ h: 1.6, aspect: 400 / 600 }, p);
      const texs = {};
      Object.keys(srcs).forEach((k) => (texs[k] = tex(srcs[k])));
      const first = Object.keys(srcs)[0];
      const w = p.h * p.aspect;
      const geo = new T.PlaneGeometry(w, p.h);
      geo.translate(0, p.h / 2, 0);
      const m = new T.MeshBasicMaterial({ map: texs[first], alphaTest: 0.5, side: T.DoubleSide });
      const mesh = new T.Mesh(geo, m);
      mesh.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: texs[first], alphaTest: 0.5 });
      mesh.userData.nmat = new T.ShaderMaterial({ uniforms: { map: { value: texs[first] }, useMap: { value: 1 } }, vertexShader: NV, fragmentShader: NF, side: T.DoubleSide });
      mesh.userData.actor = true;
      place(mesh, Object.assign({ cast: true, receive: false }, p));
      const a = {
        id, mesh, texs, flip: false, lie: !!p.lie,
        set(expr) {
          const t = texs[expr] || texs[first];
          if (m.map !== t) { m.map = t; mesh.customDepthMaterial.map = t; mesh.userData.nmat.uniforms.map.value = t; }
        },
      };
      actors.push(a);
      return a;
    }

    // ---- ink pass
    const colorRT = new T.WebGLRenderTarget(W, H, { samples: 4, type: T.UnsignedByteType });
    const nd = new T.WebGLRenderTarget(W, H, { type: T.UnsignedByteType });
    nd.depthTexture = new T.DepthTexture(W, H, T.UnsignedIntType);
    const nmat = new T.ShaderMaterial({ uniforms: { map: { value: null }, useMap: { value: 0 } }, vertexShader: NV, fragmentShader: NF });
    const post = new T.ShaderMaterial({
      uniforms: { tC: { value: colorRT.texture }, tN: { value: nd.texture }, tD: { value: nd.depthTexture }, res: { value: new T.Vector2(W, H) },
        near: { value: 0.05 }, far: { value: 400 }, ink: { value: new T.Color("#22202b") }, px: { value: 3.0 }, vig: { value: 0.18 }, dbg: { value: window.TALE_DEBUG || 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `
        uniform sampler2D tC, tN, tD; uniform vec2 res; uniform float near, far, px, vig, dbg; uniform vec3 ink; varying vec2 vUv;
        float lin(vec2 uv){ float d = texture2D(tD, uv).x; float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
        vec3 nrm(vec2 uv){ return texture2D(tN, uv).xyz * 2.0 - 1.0; }
        void main(){
          vec2 o = px / res;
          vec3 c = texture2D(tC, vUv).rgb;
          float dc = lin(vUv); vec3 nc = nrm(vUv);
          float e = 0.0;
          for (int i = 0; i < 12; i++) {
            float a = float(i) * 0.5235988;
            float r = i < 8 ? 1.0 : 0.5;
            vec2 uv = vUv + vec2(cos(a), sin(a)) * o * (i % 2 == 0 ? 1.0 : 0.72);
            float di = lin(uv);
            float dd = abs(di - dc) / max(min(di, dc), 0.001);
            float nn = 1.0 - clamp(dot(nc, nrm(uv)), 0.0, 1.0);
            e = max(e, max(smoothstep(0.035, 0.09, dd), smoothstep(0.18, 0.42, nn)));
          }
          if (dbg > 0.5 && dbg < 1.5) { gl_FragColor = vec4(texture2D(tN, vUv).rgb, 1.0); return; }
          if (dbg > 1.5 && dbg < 2.5) { gl_FragColor = vec4(vec3(fract(dc)), 1.0); return; }
          if (dbg > 2.5) { gl_FragColor = vec4(vec3(1.0 - e), 1.0); return; }
          c = mix(c, ink, e * 0.92);
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          c = clamp(mix(vec3(l), c, 1.22), 0.0, 1.0);          // grade: livelier colour,
          c = pow(c, vec3(0.9));                                 // a touch brighter mid-tones
          vec2 q = vUv - 0.5; c *= 1.0 - vig * dot(q, q) * 2.2;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), post);
    quad.frustumCulled = false;
    const qScene = new T.Scene();
    qScene.add(quad);
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const tmpV = new T.Vector3();
    function render(st) {
      Object.keys(sets).forEach((k) => (sets[k].visible = k === st.set || (st.also || []).includes(k)));
      const S = Object.assign({}, sets[st.set].userData, st.light || {});
      scene.background = new T.Color(S.bg);
      scene.fog = S.fog ? new T.Fog(S.fog[0], S.fog[1], S.fog[2]) : null;
      hemi.color.set(S.sky); hemi.groundColor.set(S.ground); hemi.intensity = S.hemiI;
      sun.color.set(S.sun); sun.intensity = S.sunI;
      sun.position.set(S.sunPos[0], S.sunPos[1], S.sunPos[2]);
      sun.target.position.set(S.sunTarget ? S.sunTarget[0] : 0, 0, S.sunTarget ? S.sunTarget[2] : 0);
      const sc = sun.shadow.camera;
      sc.left = sc.bottom = -S.shadow; sc.right = sc.top = S.shadow; sc.near = 0.5; sc.far = 80;
      sc.updateProjectionMatrix();
      post.uniforms.ink.value.set(S.ink);
      camera.fov = st.fov || 45;
      camera.position.set(st.cam[0], st.cam[1], st.cam[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(st.look[0], st.look[1], st.look[2]);
      if (st.roll) camera.rotateZ(st.roll * D2R);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      // billboards face the camera around their vertical axis (lying actors stay put)
      actors.forEach((a) => {
        if (a.lie || !a.mesh.parent) return;
        a.mesh.getWorldPosition(tmpV);
        const yaw = Math.atan2(camera.position.x - tmpV.x, camera.position.z - tmpV.z);
        const parentYaw = a.mesh.parent.rotation ? a.mesh.parent.rotation.y : 0;
        a.mesh.rotation.y = yaw - parentYaw;
      });
      // 1) colour (MSAA)
      renderer.setRenderTarget(colorRT);
      renderer.render(scene, camera);
      // 2) normals + depth (characters alpha-cut)
      const swaps = [];
      scene.traverse((m) => {
        if (!m.isMesh || !m.visible) return;
        swaps.push([m, m.material]);
        m.material = m.userData.nmat || nmat;
      });
      const bg = scene.background, fog = scene.fog;
      scene.background = new T.Color(0x7f7fff); scene.fog = null;
      renderer.setRenderTarget(nd);
      renderer.render(scene, camera);
      swaps.forEach(([m, mm]) => (m.material = mm));
      scene.background = bg; scene.fog = fog;
      // 3) ink composite to the canvas
      renderer.setRenderTarget(null);
      renderer.render(qScene, qCam);
    }

    const ready = Promise.all(loads.length ? loads : [Promise.resolve()]).then(() => new Promise((r) => setTimeout(r, 0)));
    return {
      T, scene, camera, renderer, sets, set, box, cyl, cone, sphere, ico, roof, plane, clock, actor, tex, mat, render,
      get ready() { return Promise.all(loads).then(() => new Promise((r) => setTimeout(r, 30))); },
      ready0: ready,
    };
  }

  window.TALE = { create };
})();
