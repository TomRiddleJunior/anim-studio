/* explainer-3d-diorama kit — a three.js "museum miniature" layer for the explainer engine.
 *
 * Route: three.js (vendored ES module, loaded with dynamic import) renders into a transparent WebGL canvas that sits
 * between the CSS backdrop (parchment radial / navy fog) and the engine's SVG overlay (labels). One frame is rendered
 * per engine seek inside X.every — no requestAnimationFrame, no wall clock, preserveDrawingBuffer:true so the
 * renderer's page.screenshot() sees the pixels. Everything that moves is a pure function of t:
 *   D.track(keys) / D.anim(obj, spec) / D.camKeys(spec)  — keyframes [[t, value, ease], ...] (ease = GSAP name)
 *   D.onFrame(fn(t))                                     — procedural per-frame code (rain, flows, physics)
 *
 *   const D = await DIO.init(X, { skin: 'parchment' | 'clay', three: './vendor/three.module.min.js' });
 *   const THREE = D.THREE;
 *
 * Builders (all flat-shaded low-poly, return THREE.Object3D unless noted):
 *   D.tile({w,d,h,top,soil,bands})  D.tree({seed,h,kind})  D.house({w,d,h,wall,roof})  D.car({color})
 *   D.cloud({seed,n,color})  D.drop(size)  D.jar({h,r})→{group,set(level)}  D.plant({kind,seed,h})
 *   D.mannequin({coat,trousers,skin,hair})  D.blob(w,d,op)  D.box(w,h,d,color,pos,parent)
 * Systems (time-driven): D.rain({...})  D.flow(points,{...})  D.rings({...})  D.labels / D.label({...})
 *   D.subtitles({...})  D.flip(...)  D.split(...)  D.assemble(...)  D.peelSheet(...)  D.paperWipe(...)
 * Looks: D.shade(track) (backdrop darkness under the canvas)  D.fade(track) (black over everything but subtitles)
 *   D.light(track) (key/hemi intensity multiplier)  D.night(track) (window glow)
 */
(function () {
  const DIO = (window.DIO = {});

  DIO.SKINS = {
    parchment: {
      backdrop: 'radial-gradient(ellipse 78% 74% at 50% 44%, #e2d9ad 0%, #d5ca99 30%, #bfb381 62%, #9d915f 88%, #8b8050 100%)',
      sky: 0xfff3dc, ground: 0x6d5e40, hemi: 1.45, key: 2.6, keyColor: 0xfff1da, fill: 0.45, fillColor: 0xdfe6ff,
      shadow: 0.30, shade: '#15120d', fog: null, text: '#ffffff',
    },
    clay: {
      backdrop: 'radial-gradient(ellipse 85% 80% at 50% 38%, #4a6d92 0%, #3a5c7e 30%, #2a3c51 68%, #1b2738 100%)',
      sky: 0xe4ecf5, ground: 0x2b3747, hemi: 1.25, key: 1.7, keyColor: 0xfff2e0, fill: 0.55, fillColor: 0x9fb8d8,
      shadow: 0.35, shade: '#0f1824', fog: { color: 0x2c4058, density: 0.06 }, text: '#ffffff',
      clay: 0.84, clayColor: 0xd6d1cc, // every D.mat colour is pulled 84 % toward white clay (water/windows keep theirs)
    },
  };

  DIO.init = async function (X, o = {}) {
    const THREE = await import(o.three || './vendor/three.module.min.js');
    const skin = Object.assign({}, DIO.SKINS[o.skin || 'parchment'], o.skinOverrides || {});
    const stage = X.stage;
    const D = { THREE, X, skin, _fns: [], _post: [], _tracks: [] };

    // ------------------------------------------------------------------ layers (backdrop → canvas → svg → fade → subs)
    stage.style.background = skin.backdrop;
    const layer = (z, css) => {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', pointerEvents: 'none', zIndex: z }, css);
      return d;
    };
    const tex = layer(1, { backgroundImage: `url(${X.paper('#808080', 960, 540, 0.10, 11)})`, backgroundSize: '1920px 1080px', mixBlendMode: 'overlay', opacity: o.paperTexture ?? 0.55 });
    const shade = layer(1, { background: skin.shade, opacity: 0 });
    const canvas = document.createElement('canvas');
    canvas.width = 1920; canvas.height = 1080;
    Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', zIndex: 2 });
    const fade = layer(5, { background: '#000', opacity: 0 });
    stage.insertBefore(tex, stage.firstChild);
    stage.insertBefore(shade, X.root);
    stage.insertBefore(canvas, X.root);
    X.root.style.zIndex = 3;
    stage.appendChild(fade);
    D.layers = { tex, shade, canvas, fade };

    // ------------------------------------------------------------------ renderer / scene / camera / lights
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(1920, 1080, false);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const scene = new THREE.Scene();
    if (skin.fog) scene.fog = new THREE.FogExp2(skin.fog.color, skin.fog.density);
    const camera = new THREE.PerspectiveCamera(o.fov || 30, 16 / 9, 0.3, 300);
    scene.add(camera);
    const hemi = new THREE.HemisphereLight(skin.sky, skin.ground, skin.hemi);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(skin.keyColor, skin.key);
    key.castShadow = true;
    key.shadow.mapSize.set(o.shadowMap || 2048, o.shadowMap || 2048);
    key.shadow.radius = o.shadowRadius ?? 5;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.015;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(skin.fillColor, skin.fill);
    scene.add(fill, fill.target);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: skin.shadow }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = o.groundY ?? -0.6;
    ground.receiveShadow = true;
    scene.add(ground);
    Object.assign(D, { renderer, scene, camera, hemi, key, fill, ground });
    D.rig = { az: 30, el: 32, r: 10, tx: 0, ty: 0, tz: 0, fov: o.fov || 30, roll: 0, keyAz: -40, keyEl: 52, shadowSize: 0 };

    // ------------------------------------------------------------------ time helpers
    const easeCache = {};
    D.ease = (e) => (typeof e === 'function' ? e : easeCache[e || 'sine.inOut'] || (easeCache[e || 'sine.inOut'] = gsap.parseEase(e || 'sine.inOut')));
    const lerpV = (a, b, p) => {
      if (typeof a === 'number') return a + (b - a) * p;
      if (typeof a === 'boolean' || typeof a === 'string') return p < 1 ? a : b;
      return a.map((x, i) => x + (b[i] - x) * p);
    };
    /** keys: [[t, v, ease?], ...]; ease shapes the segment that ARRIVES at that key. Holds outside the range. */
    D.track = (keys) => {
      const ks = keys.map((k) => ({ t: k[0], v: k[1], e: D.ease(k[2]) })).sort((a, b) => a.t - b.t);
      return (t) => {
        if (t <= ks[0].t) return ks[0].v;
        for (let i = 1; i < ks.length; i++) {
          if (t < ks[i].t) { const a = ks[i - 1], b = ks[i]; return lerpV(a.v, b.v, b.e((t - a.t) / (b.t - a.t))); }
        }
        return ks[ks.length - 1].v;
      };
    };
    D.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    /** eased 0..1 progress of t through [t0, t1] */
    D.prog = (t, t0, t1, e = 'none') => D.ease(e)(D.clamp((t - t0) / (t1 - t0)));
    D.onFrame = (fn) => { D._fns.push(fn); return fn; };
    const setPath = (obj, path, v) => {
      const parts = path.split('.');
      let o2 = obj;
      for (let i = 0; i < parts.length - 1; i++) o2 = o2[parts[i]];
      const k = parts[parts.length - 1], cur = o2[k];
      if (k === 'scale' && typeof v === 'number') cur.setScalar(Math.max(1e-4, v));
      else if (Array.isArray(v) && cur && cur.isColor) cur.setRGB(v[0], v[1], v[2], THREE.SRGBColorSpace);
      else if (Array.isArray(v) && cur && cur.set) { cur.set(...v); if (k === 'scale') cur.set(...v.map((x) => Math.max(1e-4, x))); }
      else o2[k] = v;
    };
    /** D.anim(mesh, {'position.y': [[2,0],[3,1,'power2.out']], visible: [[0,false],[2,true]], scale: [...] }) */
    D.anim = (obj, spec) => {
      const tr = Object.entries(spec).map(([p, keys]) => [p, D.track(keys)]);
      D.onFrame((t) => { for (const [p, f] of tr) setPath(obj, p, f(t)); });
      return obj;
    };
    /** visible only in [t0, t1) */
    D.window = (obj, t0, t1) => { D.onFrame((t) => { obj.visible = t >= t0 && t < t1; }); return obj; };
    /** idle life: gentle seeded sway (rotation x/z) for trees, plants, hanging things */
    D.sway = (objs, op = {}) => {
      const r = X.rand(op.seed ?? 3), amp = op.amp ?? 0.03, sp = op.speed ?? 1.3;
      const P = objs.map((o) => ({ o, ph: r() * 6.28, z0: o.rotation.z, x0: o.rotation.x, k: 0.8 + r() * 0.4 }));
      D.onFrame((t) => { for (const p of P) { p.o.rotation.z = p.z0 + Math.sin(t * sp * p.k + p.ph) * amp; p.o.rotation.x = p.x0 + Math.cos(t * sp * 0.8 * p.k + p.ph) * amp * 0.6; } });
    };
    D.camKeys = (spec) => { for (const [k, keys] of Object.entries(spec)) D._tracks.push([k, D.track(keys)]); };

    // ------------------------------------------------------------------ looks over time
    const looks = { shade: () => 0, fade: () => 0, light: () => 1, night: () => 0 };
    D.shade = (keys) => { looks.shade = D.track(keys); };
    D.fade = (keys) => { looks.fade = D.track(keys); };
    D.light = (keys) => { looks.light = D.track(keys); };
    D.night = (keys) => { looks.night = D.track(keys); };
    D.windowMat = new THREE.MeshLambertMaterial({ color: 0x3e4752, emissive: 0xf2c37a, emissiveIntensity: 0, flatShading: true });

    // ------------------------------------------------------------------ projection (3D anchor → stage px)
    const _v = new THREE.Vector3();
    D.project = (p) => {
      _v.copy(p).project(camera);
      return { x: (_v.x + 1) * 960, y: (1 - _v.y) * 540, behind: _v.z > 1 };
    };

    // ------------------------------------------------------------------ the per-frame pipeline
    const deg = Math.PI / 180;
    D.frame = (t) => {
      for (const [k, f] of D._tracks) D.rig[k] = f(t);
      for (const fn of D._fns) fn(t);
      const R = D.rig, a = R.az * deg, e = R.el * deg;
      camera.position.set(R.tx + R.r * Math.cos(e) * Math.sin(a), R.ty + R.r * Math.sin(e), R.tz + R.r * Math.cos(e) * Math.cos(a));
      camera.up.set(0, 1, 0);
      camera.lookAt(R.tx, R.ty, R.tz);
      if (R.roll) camera.rotateZ(R.roll * deg);
      if (camera.fov !== R.fov) { camera.fov = R.fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld(true);
      // light rig follows the look-at target so the shadow frustum always covers the hero
      const ka = R.keyAz * deg, ke = R.keyEl * deg, L = 14;
      key.target.position.set(R.tx, R.ty, R.tz);
      key.position.set(R.tx + L * Math.cos(ke) * Math.sin(ka), R.ty + L * Math.sin(ke), R.tz + L * Math.cos(ke) * Math.cos(ka));
      fill.target.position.set(R.tx, R.ty, R.tz);
      fill.position.set(R.tx + 8, R.ty + 4, R.tz + 6);
      const s = R.shadowSize || Math.max(3.5, R.r * 0.6);
      const sc = key.shadow.camera;
      if (sc.right !== s) { sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 1; sc.far = 40; sc.updateProjectionMatrix(); }
      const lt = looks.light(t), nt = looks.night(t);
      key.intensity = skin.key * lt * (1 - 0.75 * nt);
      hemi.intensity = skin.hemi * lt * (1 - 0.55 * nt);
      fill.intensity = skin.fill * lt;
      D.windowMat.emissiveIntensity = 1.4 * nt;
      shade.style.opacity = Math.max(looks.shade(t), 0.78 * nt).toFixed(3);
      fade.style.opacity = looks.fade(t).toFixed(3);
      for (const fn of D._post) fn(t);
      renderer.render(scene, camera);
    };
    X.every((t) => D.frame(t));

    // ------------------------------------------------------------------ materials & mesh helpers
    const matCache = new Map(), clayC = new THREE.Color(skin.clayColor ?? 0xd6d1cc);
    /** flat-shaded Lambert by default; opts: {emissive, ei, opacity, side, phong, shininess, basic, unique, vc} */
    D.mat = (color, op = {}) => {
      const k = color + JSON.stringify(op);
      if (!op.unique && matCache.has(k)) return matCache.get(k);
      const col = skin.clay && !op.keep && !op.vc ? new THREE.Color(color).lerp(clayC, skin.clay) : color;
      const base = { color: col, flatShading: !op.smooth && !op.basic, transparent: op.opacity != null && op.opacity < 1, opacity: op.opacity ?? 1, side: op.side ?? THREE.FrontSide, vertexColors: !!op.vc };
      let m;
      if (op.basic) { delete base.flatShading; m = new THREE.MeshBasicMaterial(base); }
      else if (op.phong) m = new THREE.MeshPhongMaterial({ ...base, shininess: op.shininess ?? 60, specular: op.specular ?? 0x445566 });
      else m = new THREE.MeshLambertMaterial(base);
      if (op.emissive != null && m.emissive) { m.emissive.set(op.emissive); m.emissiveIntensity = op.ei ?? 1; }
      if (op.depthWrite === false) m.depthWrite = false;
      if (!op.unique) matCache.set(k, m);
      return m;
    };
    D.mesh = (geo, mat, pos = {}, parent = scene) => {
      const m = new THREE.Mesh(geo, typeof mat === 'number' || typeof mat === 'string' ? D.mat(mat) : mat);
      m.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      if (pos.rx || pos.ry || pos.rz) m.rotation.set(pos.rx || 0, pos.ry || 0, pos.rz || 0);
      if (pos.s) typeof pos.s === 'number' ? m.scale.setScalar(pos.s) : m.scale.set(...pos.s);
      m.castShadow = pos.cast ?? true;
      m.receiveShadow = pos.recv ?? true;
      if (parent) parent.add(m);
      return m;
    };
    D.group = (parent = scene, pos = {}) => {
      const g = new THREE.Group();
      g.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      if (pos.ry) g.rotation.y = pos.ry;
      if (parent) parent.add(g);
      return g;
    };
    D.box = (w, h, d, color, pos = {}, parent = scene) => D.mesh(new THREE.BoxGeometry(w, h, d), color, pos, parent);
    /** displace vertices by a seeded offset, keeping shared corners together (true low-poly facets) */
    D.jitter = (geo, amt = 0.1, seed = 1, axes = [1, 1, 1]) => {
      const r = X.rand(seed), p = geo.attributes.position, map = new Map();
      for (let i = 0; i < p.count; i++) {
        const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
        if (!map.has(k)) map.set(k, [(r() - 0.5) * amt * axes[0], (r() - 0.5) * amt * axes[1], (r() - 0.5) * amt * axes[2]]);
        const o2 = map.get(k);
        p.setXYZ(i, p.getX(i) + o2[0], p.getY(i) + o2[1], p.getZ(i) + o2[2]);
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    };
    const blobTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      const t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace; return t2;
    })();
    /** soft contact / ambient-occlusion blob on the ground under a diorama */
    D.blob = (w, d, op = 0.5, parent = scene, y = null) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: op, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = (y ?? ground.position.y) + 0.002;
      m.renderOrder = -1;
      parent.add(m);
      return m;
    };

    // ------------------------------------------------------------------ palettes
    D.C = {
      soil: 0x2e2119, soilMid: 0x3d2c20, soilLight: 0x5a4331, topsoil: 0x241a13,
      grass: 0x737d44, grass2: 0x5f6a35, grass3: 0x858f52, moss: 0x4e5a27,
      wheat: 0xe3cf8c, wood: 0x5c493d, bark: 0x4a3a2c,
      leaf: [0x4e6b2a, 0x5f7a32, 0x6d8740, 0x46602a, 0x7c8f45],
      asphalt: 0x56575a, asphalt2: 0x4a4b4e, kerb: 0xb9b5aa, pavement: 0xa9a59a, line: 0xe8e4d8,
      wall: [0xe2d8c3, 0xd8cdb6, 0xcfc5b3, 0xe8e0cf], roof: [0x8a5a44, 0x7b6a5c, 0x6e5446, 0x9a6b50], flatRoof: 0x8f8a80,
      water: 0x4f8cbf, waterDeep: 0x3b6f9c, murky: 0x6f6a44, glass: 0xdfe9ee,
      car: [0x9b4a3c, 0x55708a, 0xd9cfb8, 0x6b7a5a, 0x3f4650],
      cloud: 0x8c8f93, cloudLight: 0xd8d8d6, paper: 0xf4f1eb, gold: 0xd9b24a,
      mulch: 0x6b4a2f, mulch2: 0x7d5838, soilMix: 0xa5885a, gravel: 0x8d8b84, pebble: 0xc4c0b6, groundwater: 0x4a7fa6,
      root: 0xe2cfa4, coat: 0xc49a35, trousers: 0x3c3f4a, skinTone: 0xd5b08c, hair: 0x3b2a20,
    };
    const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
    D.pick = pick;

    // ------------------------------------------------------------------ builders
    /** core-sample slab: coloured top, soil sides (optional strata bands), top surface at y=0 */
    D.tile = (op = {}) => {
      const w = op.w ?? 1, d = op.d ?? 1, h = op.h ?? 0.35, g = D.group(op.parent ?? scene, op.pos);
      const soil = D.mat(op.soil ?? D.C.soil), topM = typeof op.top === 'object' ? op.top : D.mat(op.top ?? D.C.grass);
      const body = D.mesh(new THREE.BoxGeometry(w, h, d), [soil, soil, topM, soil, soil, soil], { y: -h / 2 }, g);
      g.userData = { w, d, h, body };
      if (op.bands) { // darker topsoil band just under the top
        const bh = Math.min(0.09, h * 0.25);
        D.mesh(new THREE.BoxGeometry(w + 0.002, bh, d + 0.002), D.mat(D.C.topsoil), { y: -bh / 2 - 0.004, recv: true, cast: false }, g);
      }
      return g;
    };
    D.tree = (op = {}) => {
      const r = X.rand(op.seed ?? 1), g = D.group(op.parent ?? scene, op.pos), h = op.h ?? 0.32 * (0.8 + r() * 0.5);
      const trunkH = h * 0.42;
      D.mesh(new THREE.CylinderGeometry(h * 0.045, h * 0.07, trunkH, 5), D.C.bark, { y: trunkH / 2 }, g);
      if (op.kind === 'conifer') {
        for (let i = 0; i < 2; i++) D.mesh(D.jitter(new THREE.ConeGeometry(h * (0.3 - i * 0.08), h * 0.5, 6), h * 0.04, (op.seed ?? 1) * 7 + i), pick(D.C.leaf, r), { y: trunkH + h * (0.15 + i * 0.25) }, g);
      } else {
        const n = op.crowns ?? (1 + Math.floor(r() * 3));
        for (let i = 0; i < n; i++) {
          const cr = h * (0.34 - i * 0.05) * (0.85 + r() * 0.3);
          const geo = D.jitter(new THREE.IcosahedronGeometry(cr, op.detail ?? 0), cr * 0.35, (op.seed ?? 1) * 13 + i);
          D.mesh(geo, pick(D.C.leaf, r), { x: (r() - 0.5) * cr * 0.9, y: trunkH + cr * 0.75 + i * cr * 0.55, z: (r() - 0.5) * cr * 0.9, ry: r() * 6 }, g);
        }
      }
      g.rotation.y = r() * 6;
      g.userData.kind = 'tree';
      return g;
    };
    /** gable or flat-roof building; returns group with .userData.roof (mesh) */
    D.house = (op = {}) => {
      const r = X.rand(op.seed ?? 3), g = D.group(op.parent ?? scene, op.pos);
      const w = op.w ?? 0.36, d = op.d ?? 0.28, h = op.h ?? 0.2;
      const wall = D.mat(op.wall ?? pick(D.C.wall, r)), roofM = op.roofMat || D.mat(op.roof ?? pick(D.C.roof, r));
      D.mesh(new THREE.BoxGeometry(w, h, d), wall, { y: h / 2 }, g);
      let roof;
      if (op.flat) {
        roof = D.mesh(new THREE.BoxGeometry(w + 0.01, 0.02, d + 0.01), op.roofMat || D.mat(D.C.flatRoof), { y: h + 0.01 }, g);
      } else {
        const rh = op.rh ?? d * 0.55, sh = new THREE.Shape();
        sh.moveTo(-d / 2 - 0.03, 0); sh.lineTo(d / 2 + 0.03, 0); sh.lineTo(0, rh); sh.lineTo(-d / 2 - 0.03, 0);
        const geo = new THREE.ExtrudeGeometry(sh, { depth: w + 0.06, bevelEnabled: false });
        geo.translate(0, 0, -(w + 0.06) / 2); geo.rotateY(Math.PI / 2);
        roof = D.mesh(geo, roofM, { y: h }, g);
        if (op.chimney !== false && r() > 0.35) D.box(0.04, rh * 0.8, 0.04, 0x7a6a5e, { x: w * 0.25, y: h + rh * 0.65, z: -d * 0.12 }, g);
      }
      // windows on the front (+z) and sides, a door
      const win = op.windowMat || D.windowMat, ww = op.winW ?? Math.min(0.055, w / 6), wh = op.winH ?? Math.min(0.055, h * 0.28);
      const floors = op.floors ?? Math.max(1, Math.round(h / 0.11));
      const cols = op.cols ?? Math.max(1, Math.floor(w / 0.11));
      for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
        const x = -w / 2 + (c + 0.5) * (w / cols), y = h * (f + 0.58) / floors;
        if (f === 0 && c === Math.floor(cols / 2) && op.door !== false) { D.box(ww * 0.9, Math.min(0.08, h * 0.45), 0.006, D.C.wood, { x, y: Math.min(0.04, h * 0.22), z: d / 2 + 0.003 }, g); continue; }
        D.mesh(new THREE.BoxGeometry(ww, wh, 0.006), win, { x, y, z: d / 2 + 0.003, cast: false }, g);
      }
      for (let f = 0; f < floors; f++) D.mesh(new THREE.BoxGeometry(0.006, wh, ww), win, { x: w / 2 + 0.003, y: h * (f + 0.58) / floors, z: 0, cast: false }, g);
      g.userData = { roof, w, d, h };
      return g;
    };
    D.car = (op = {}) => {
      const g = D.group(op.parent ?? scene, op.pos), col = op.color ?? D.C.car[0], s = op.s ?? 1;
      D.box(0.17 * s, 0.045 * s, 0.085 * s, col, { y: 0.04 * s }, g);
      D.mesh(D.jitter(new THREE.BoxGeometry(0.095 * s, 0.04 * s, 0.075 * s), 0.004, 5), col, { x: -0.01 * s, y: 0.08 * s }, g);
      D.box(0.096 * s, 0.026 * s, 0.077 * s, 0x2f3740, { x: -0.01 * s, y: 0.082 * s, cast: false }, g); // window band
      for (const [x, z] of [[-0.05, 0.043], [0.05, 0.043], [-0.05, -0.043], [0.05, -0.043]]) {
        D.mesh(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.014 * s, 7), 0x222222, { x: x * s, y: 0.02 * s, z: z * s, rx: Math.PI / 2 }, g);
      }
      if (op.ry) g.rotation.y = op.ry;
      return g;
    };
    D.cloud = (op = {}) => {
      const r = X.rand(op.seed ?? 4), g = D.group(op.parent ?? scene, op.pos), n = op.n ?? 7, sz = op.size ?? 0.5;
      for (let i = 0; i < n; i++) {
        const cr = sz * (0.5 + r() * 0.5) * (i === 0 ? 1.25 : 1);
        const m = D.mesh(D.jitter(new THREE.IcosahedronGeometry(cr, 1), cr * 0.22, 40 + i + (op.seed ?? 4) * 10), op.color ?? D.C.cloud,
          { x: (i === 0 ? 0 : (r() - 0.5) * sz * 3.2), y: (r() - 0.3) * sz * 0.5, z: (r() - 0.5) * sz * 1.4, cast: op.cast ?? false, recv: false }, g);
        m.scale.y = 0.72;
      }
      return g;
    };
    /** a teardrop (Lathe), tip up, origin at the drop's centre */
    D.dropGeo = (size = 0.1) => {
      const pts = [[0, 1.05], [0.16, 0.78], [0.33, 0.5], [0.46, 0.2], [0.5, -0.05], [0.45, -0.3], [0.3, -0.48], [0, -0.55]].map(([x, y]) => new THREE.Vector2(x * size, y * size));
      return new THREE.LatheGeometry(pts, 8);
    };
    D.waterMat = (color = D.C.water, op = {}) => D.mat(color, { phong: true, shininess: 90, specular: 0x8899aa, emissive: color, ei: 0.12, keep: true, ...op });
    /** measuring jar: glass tube + water column; .set(level 0..1) */
    D.jar = (op = {}) => {
      const g = D.group(op.parent ?? scene, op.pos), h = op.h ?? 0.6, r = op.r ?? 0.16;
      const glass = new THREE.MeshPhongMaterial({ color: D.C.glass, transparent: true, opacity: op.glass ?? 0.16, shininess: 120, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false, flatShading: true });
      const tube = D.mesh(new THREE.CylinderGeometry(r, r, h, 14, 1, true), glass, { y: h / 2, cast: false, recv: false }, g);
      tube.renderOrder = 3;
      D.mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.03, 14), 0xb8b2a2, { y: 0.015 }, g);
      D.mesh(new THREE.TorusGeometry(r, 0.008, 4, 18), 0xf0eee8, { y: h, rx: Math.PI / 2, cast: false }, g);
      D.mesh(new THREE.TorusGeometry(r * 1.005, 0.006, 4, 18), 0x5b4c3a, { y: h / 2, rx: Math.PI / 2, cast: false }, g); // half mark
      const water = D.mesh(new THREE.CylinderGeometry(r * 0.93, r * 0.93, 1, 14), D.waterMat(), { y: 0.03, cast: false }, g);
      const set = (lv) => { const L = Math.max(0.0005, lv * (h - 0.04)); water.scale.y = L; water.position.y = 0.03 + L / 2; water.visible = lv > 0.001; };
      set(op.level ?? 0);
      return { group: g, set, h, r, water };
    };
    /** plants for gardens: 'grass' tuft, 'flower', 'shrub', 'reed' */
    D.plant = (op = {}) => {
      const r = X.rand(op.seed ?? 9), g = D.group(op.parent ?? scene, op.pos), h = op.h ?? 0.14;
      const kind = op.kind ?? 'grass';
      if (kind === 'grass' || kind === 'reed') {
        const n = kind === 'reed' ? 7 : 6;
        for (let i = 0; i < n; i++) {
          const bh = h * (0.6 + r() * 0.6), a = (i / n) * Math.PI * 2 + r();
          const m = D.mesh(new THREE.ConeGeometry(h * 0.06, bh, 3), pick([D.C.grass, D.C.grass2, D.C.grass3, 0x8a8f45], r), { y: bh / 2, cast: true }, g);
          m.rotation.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
          m.position.x = Math.sin(a) * h * 0.1; m.position.z = Math.cos(a) * h * 0.1;
        }
        if (kind === 'reed') for (let i = 0; i < 3; i++) D.mesh(new THREE.CylinderGeometry(h * 0.035, h * 0.035, h * 0.18, 5), 0x6b4a2f, { x: (r() - 0.5) * h * 0.2, y: h * (1.0 + r() * 0.2), z: (r() - 0.5) * h * 0.2 }, g);
      } else if (kind === 'flower') {
        const n = 3 + Math.floor(r() * 2), col = op.color ?? pick([0x8e6aa8, 0xd2a843, 0xe9e2d0, 0xb06a5a], r);
        for (let i = 0; i < n; i++) {
          const sh = h * (0.7 + r() * 0.5), x = (r() - 0.5) * h * 0.45, z = (r() - 0.5) * h * 0.45;
          D.mesh(new THREE.CylinderGeometry(h * 0.02, h * 0.025, sh, 3), D.C.grass2, { x, y: sh / 2, z, cast: false }, g);
          D.mesh(D.jitter(new THREE.IcosahedronGeometry(h * 0.12, 0), h * 0.04, i + 3), col, { x, y: sh, z }, g);
        }
        for (let i = 0; i < 3; i++) D.mesh(new THREE.ConeGeometry(h * 0.08, h * 0.4, 3), D.C.grass, { x: (r() - 0.5) * h * 0.3, y: h * 0.2, z: (r() - 0.5) * h * 0.3, rz: (r() - 0.5) * 0.6 }, g);
      } else { // shrub
        for (let i = 0; i < 3; i++) {
          const cr = h * (0.35 + r() * 0.2);
          D.mesh(D.jitter(new THREE.IcosahedronGeometry(cr, 0), cr * 0.3, i + (op.seed ?? 9) * 3), pick(D.C.leaf, r), { x: (r() - 0.5) * h * 0.5, y: cr * 0.8, z: (r() - 0.5) * h * 0.5 }, g);
        }
      }
      return g;
    };
    /** faceless low-poly mannequin (≈ 0.18 units tall at s=1); origin at the feet */
    D.mannequin = (op = {}) => {
      const g = D.group(op.parent ?? scene, op.pos), s = op.s ?? 1;
      const body = D.group(g);
      for (const x of [-0.016, 0.016]) D.mesh(new THREE.CylinderGeometry(0.011 * s, 0.009 * s, 0.075 * s, 6), op.trousers ?? D.C.trousers, { x: x * s, y: 0.0375 * s }, body);
      D.mesh(D.jitter(new THREE.CylinderGeometry(0.03 * s, 0.026 * s, 0.072 * s, 7), 0.003 * s, 2), op.coat ?? D.C.coat, { y: 0.112 * s }, body);
      D.mesh(new THREE.CylinderGeometry(0.031 * s, 0.033 * s, 0.03 * s, 7), op.coat ?? D.C.coat, { y: 0.07 * s }, body); // coat hem
      for (const x of [-1, 1]) D.mesh(new THREE.CylinderGeometry(0.008 * s, 0.007 * s, 0.07 * s, 5), op.coat ?? D.C.coat, { x: x * 0.037 * s, y: 0.11 * s, rz: x * 0.12 }, body);
      const head = D.mesh(D.jitter(new THREE.IcosahedronGeometry(0.019 * s, 1), 0.003 * s, 6), op.skin ?? D.C.skinTone, { y: 0.172 * s }, body);
      D.mesh(new THREE.SphereGeometry(0.0205 * s, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.5), op.hair ?? D.C.hair, { y: 0.175 * s, rx: -0.25 }, body);
      g.userData = { body, head };
      return g;
    };

    // ------------------------------------------------------------------ time-driven systems
    /** rain streaks over an area: intensity(t) 0..1 controls how many fall; floor(x,z) = where they stop */
    D.rain = (op = {}) => {
      const n = op.n ?? 420, A = op.area ?? [-2, 2, -2, 2], top = op.top ?? 3, len = op.len ?? 0.14, sp = op.speed ?? 5.5;
      const floorF = op.floor ?? (() => 0), inten = op.intensity ? D.track(op.intensity) : () => 1, wind = op.wind ?? 0.12;
      const geo = new THREE.BoxGeometry(op.thick ?? 0.009, len, op.thick ?? 0.009);
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: op.color ?? 0xeef3f6, transparent: true, opacity: op.opacity ?? 0.55, depthWrite: false }), n);
      mesh.frustumCulled = false; mesh.castShadow = false;
      (op.parent ?? scene).add(mesh);
      const r = X.rand(op.seed ?? 21), P = [];
      for (let i = 0; i < n; i++) { const x = A[0] + r() * (A[1] - A[0]), z = A[2] + r() * (A[3] - A[2]); P.push({ x, z, ph: r(), f: floorF(x, z), v: sp * (0.85 + r() * 0.3) }); }
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, wind)), sc = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
      const zero = new THREE.Matrix4().makeScale(0, 0, 0);
      D.onFrame((t) => {
        const k = inten(t), on = Math.floor(n * k);
        mesh.visible = on > 0;
        if (!mesh.visible) return;
        for (let i = 0; i < n; i++) {
          const p = P[i];
          if (i >= on) { mesh.setMatrixAt(i, zero); continue; }
          const H = top - p.f, y = top - ((t * p.v + p.ph * H) % H);
          pos.set(p.x - (top - y) * wind, y + len / 2, p.z);
          m4.compose(pos, q, sc);
          mesh.setMatrixAt(i, m4);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
      return mesh;
    };
    /** small expanding splash rings at seeded points of a surface while intensity(t) > 0 */
    D.rings = (op = {}) => {
      const n = op.n ?? 60, A = op.area ?? [-1, 1, -1, 1], floorF = op.floor ?? (() => 0), inten = op.intensity ? D.track(op.intensity) : () => 1;
      const mesh = new THREE.InstancedMesh(new THREE.RingGeometry(0.75, 1, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: op.color ?? 0xf2f6f8, transparent: true, opacity: op.opacity ?? 0.6, depthWrite: false }), n);
      mesh.frustumCulled = false; (op.parent ?? scene).add(mesh);
      const r = X.rand(op.seed ?? 33), P = [];
      for (let i = 0; i < n; i++) { const x = A[0] + r() * (A[1] - A[0]), z = A[2] + r() * (A[3] - A[2]); P.push({ x, z, y: floorF(x, z) + 0.004, ph: r(), per: 0.6 + r() * 0.5 }); }
      const m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0), size = op.size ?? 0.05;
      D.onFrame((t) => {
        const k = inten(t), on = Math.floor(n * k);
        mesh.visible = on > 0; if (!on) return;
        for (let i = 0; i < n; i++) {
          const p = P[i], u = ((t / p.per) + p.ph) % 1;
          if (i >= on || u > 0.55) { mesh.setMatrixAt(i, zero); continue; }
          const s = size * (0.2 + u / 0.55);
          m4.makeScale(s, 1, s).setPosition(p.x, p.y, p.z);
          mesh.setMatrixAt(i, m4);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
      return mesh;
    };
    /** particles streaming along a path: continuous stream emitted during [t0, t1], each takes `travel` s */
    D.flow = (points, op = {}) => {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
      const n = op.n ?? 40, t0 = op.t0 ?? 0, t1 = op.t1 ?? 1e9, travel = op.travel ?? 2, sz = op.size ?? 0.025, spread = op.spread ?? 0.02;
      const geo = op.geo ?? new THREE.IcosahedronGeometry(1, 0);
      const mat = op.mat ?? (op.water !== false ? D.waterMat(op.color ?? D.C.water) : D.mat(op.color ?? 0x333333));
      const mesh = new THREE.InstancedMesh(geo, mat, n);
      mesh.frustumCulled = false; mesh.castShadow = op.cast ?? false;
      (op.parent ?? scene).add(mesh);
      const r = X.rand(op.seed ?? 5), P = [];
      for (let i = 0; i < n; i++) P.push({ ph: (i + r() * 0.8) / n, j: [(r() - 0.5) * spread, (r() - 0.5) * spread * (op.flatY ? 0.2 : 1), (r() - 0.5) * spread], s: sz * (0.65 + r() * 0.7) });
      const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
      const sy = op.squash ?? 1;
      D.onFrame((t) => {
        if (t < t0 || t > t1 + travel) { mesh.visible = false; return; }
        mesh.visible = true;
        for (let i = 0; i < n; i++) {
          const p = P[i];
          const u = (((t - t0) / travel + p.ph) % 1 + 1) % 1, born = t - u * travel;
          if (born < t0 || born > t1) { mesh.setMatrixAt(i, zero); continue; }
          curve.getPointAt(op.ease ? D.ease(op.ease)(u) : u, v);
          const env = Math.min(1, u / 0.08, (1 - u) / (op.fadeEnd ?? 0.08));
          const s = p.s * Math.max(0, env);
          m4.makeScale(s, s * sy, s).setPosition(v.x + p.j[0], v.y + p.j[1], v.z + p.j[2]);
          mesh.setMatrixAt(i, m4);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
      mesh.userData.curve = curve;
      return mesh;
    };

    // ------------------------------------------------------------------ object verbs
    /** T2 flip-swap. D.flipPair({pos, h}) → {pivot, a, b}: build object A into `a` and object B into `b`, both upright with
     *  their top surface at local y=0 (slab of thickness h below). D.flip(pair, [t0, t1, …]) tumbles the slab 180° toward
     *  the camera at each time (about its own centre, with a lift and a landing bounce); faces alternate A → B → A. */
    D.flipPair = (op = {}) => {
      const h = op.h ?? 0.35, p = op.pos ?? {};
      const pivot = D.group(op.parent ?? scene, { x: p.x || 0, y: (p.y || 0) - h / 2, z: p.z || 0 });
      const a = D.group(pivot, { y: h / 2 }), b = D.group(pivot, { y: h / 2 });
      const inner = D.group(b); // b's content is mounted upside down by D.flip
      return { pivot, a, b: inner, _b: b, h, base: pivot.position.clone() };
    };
    D.flip = (pair, times, op = {}) => {
      times = [].concat(times);
      const dur = op.dur ?? 0.55, lift = op.lift ?? 0.45, e = D.ease(op.ease ?? 'power2.inOut');
      const axis = (op.axis ?? new THREE.Vector3(1, 0, 0)).clone().normalize();
      // mount B upside down: rotate its holder by π about the axis around the pivot origin (slab centre)
      const qpi = new THREE.Quaternion().setFromAxisAngle(axis, Math.PI);
      pair._b.quaternion.copy(qpi);
      pair._b.position.set(0, pair.h / 2, 0).applyQuaternion(qpi);
      const q = new THREE.Quaternion();
      D.onFrame((t) => {
        let turns = 0, liftY = 0, land = 0;
        for (const ti of times) {
          const u = D.clamp((t - ti) / dur);
          turns += e(u);
          liftY += lift * Math.sin(Math.PI * u);
          const lt = t - ti - dur;
          if (lt > 0 && lt < 0.3) land += -0.03 * Math.sin(Math.PI * lt / 0.3);
        }
        q.setFromAxisAngle(axis, Math.PI * turns);
        pair.pivot.quaternion.copy(q);
        pair.pivot.position.set(pair.base.x, pair.base.y + liftY + land, pair.base.z);
        const face = Math.floor(turns + 0.5) % 2;
        pair.a.visible = face === 0 && (op.aVisible ? op.aVisible(t) : true);
        pair._b.visible = face === 1 && (op.bVisible ? op.bVisible(t) : true);
      });
      if (op.sfx !== false) for (const ti of times) { X.sfx(ti, 'whoosh', { dur: dur + 0.15, gain: 0.35 }); X.sfx(ti + dur, 'thud', { gain: 0.5 }); }
    };
    /** T4 mosaic split: parts slide outward (from `centre`) and drop away with gravity, one by one */
    D.split = (parts, t0, op = {}) => {
      const st = op.stagger ?? 0.07, dur = op.dur ?? 0.7, c = op.centre ?? new THREE.Vector3(), out = op.out ?? 0.6, drop = op.drop ?? 2.2;
      parts.forEach((p, i) => {
        const p0 = p.position.clone(), dir = p0.clone().sub(c).setY(0);
        if (op.dir) dir.copy(op.dir); else if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
        dir.normalize();
        const ts = t0 + i * st, rot = (i % 2 ? 1 : -1) * (op.tumble ?? 0.5);
        D.onFrame((t) => {
          const u = D.clamp((t - ts) / dur);
          p.position.set(p0.x + dir.x * out * D.ease('power2.out')(u), p0.y - drop * u * u, p0.z + dir.z * out * D.ease('power2.out')(u));
          p.rotation.x = rot * u * u * dir.z; p.rotation.z = -rot * u * u * dir.x;
          p.visible = u < 1 && (op.visible ? op.visible(t) : true);
        });
        if (op.sfx !== false && i % 2 === 0) X.sfx(ts, 'slide', { dur: 0.35, gain: 0.25, pitch: 0.8 + 0.1 * (i % 3) });
      });
    };
    /** reverse of split: parts fall in from above and settle with a small bounce */
    D.assemble = (parts, t0, op = {}) => {
      const st = op.stagger ?? 0.08, dur = op.dur ?? 0.5, hgt = op.height ?? 4;
      parts.forEach((p, i) => {
        const p0 = p.position.clone(), ts = t0 + i * st;
        D.onFrame((t) => {
          const u = D.clamp((t - ts) / dur);
          const b = t > ts + dur ? Math.sin(Math.PI * D.clamp((t - ts - dur) / 0.25)) * 0.04 * Math.exp(-(t - ts - dur) * 4) : 0;
          p.position.y = p0.y + hgt * (1 - u * u) + b;
          p.visible = t >= ts && (op.visible ? op.visible(t) : true);
        });
        if (op.sfx !== false) X.sfx(ts + dur, 'thud', { gain: 0.32, pitch: 0.9 + 0.05 * (i % 4) });
      });
    };
    /** T3 peel: a turf sheet (w × d) curls from its +x free edge back over a hinge at -x, then lifts away.
     *  Returns a group; curl progress is driven by keys [[t, c]] where c runs 0 (flat) → 1 (fully flipped). */
    D.peelSheet = (w, d, top, under, op = {}) => {
      const seg = op.seg ?? 24, g = D.group(op.parent ?? scene, op.pos);
      const geo = new THREE.PlaneGeometry(w, d, seg, 2).rotateX(-Math.PI / 2);
      const base = geo.attributes.position.array.slice();
      const a = D.mesh(geo, D.mat(top, { side: THREE.FrontSide }), {}, g), b = D.mesh(geo, D.mat(under, { side: THREE.BackSide }), {}, g);
      const R = op.radius ?? w * 0.12, prog = D.track(op.keys ?? [[0, 0], [1, 1]]);
      const P = geo.attributes.position;
      D.onFrame((t) => {
        const k = prog(t), c = w - k * (w + Math.PI * R * 0.5);
        for (let i = 0; i < P.count; i++) {
          const u = base[i * 3] + w / 2; // distance from hinge
          let X2 = u, Y2 = 0;
          if (u > c) { const s = u - c, th = s / R; if (th <= Math.PI) { X2 = c + R * Math.sin(th); Y2 = R * (1 - Math.cos(th)); } else { X2 = c - (s - Math.PI * R); Y2 = 2 * R; } }
          P.setXYZ(i, X2 - w / 2, base[i * 3 + 1] + Y2, base[i * 3 + 2]);
        }
        P.needsUpdate = true; geo.computeVertexNormals();
      });
      return g;
    };
    /** T7 paper-sheet wipe: a crumpled white sheet flies in front of the camera and flattens to fill the frame */
    D.paperWipe = (t0, op = {}) => {
      const dur = op.dur ?? 0.7, geo = new THREE.PlaneGeometry(1, 1, 9, 9), base = geo.attributes.position.array.slice();
      const r = X.rand(op.seed ?? 71), jit = Array.from({ length: geo.attributes.position.count }, () => [(r() - 0.5), (r() - 0.5), (r() - 0.5)]);
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: op.color ?? D.C.paper, flatShading: true, side: THREE.DoubleSide, emissive: op.color ?? D.C.paper, emissiveIntensity: 0.25 }));
      m.renderOrder = 10; m.material.depthTest = false; m.frustumCulled = false;
      camera.add(m);
      const P = geo.attributes.position, paperC = new THREE.Color(op.color ?? D.C.paper);
      D.onFrame((t) => {
        const u = D.clamp((t - t0) / dur);
        m.visible = t >= t0;
        if (!m.visible) return;
        const e = D.ease('power3.out')(u), crumple = 0.16 * (1 - e), dist = 2;
        const vh = 2 * dist * Math.tan((D.rig.fov * Math.PI) / 360);
        for (let i = 0; i < P.count; i++) P.setXYZ(i, base[i * 3] + jit[i][0] * crumple, base[i * 3 + 1] + jit[i][1] * crumple, jit[i][2] * crumple * 2);
        P.needsUpdate = true; geo.computeVertexNormals();
        // fade the lit shading out as it flattens so the sheet lands exactly on the paper colour of the end card
        m.material.color.copy(paperC).multiplyScalar(1 - e); m.material.emissiveIntensity = 0.25 + 0.75 * e;
        const sx = 0.35 + (vh * 16 / 9 * 1.15 - 0.35) * e, sy = 0.28 + (vh * 1.15 - 0.28) * e;
        m.scale.set(sx, sy, 1);
        m.position.set(0.9 * (1 - e), -0.6 * (1 - e), -dist);
        m.rotation.set(0.6 * (1 - e), -0.5 * (1 - e), 1.2 * (1 - e));
      });
      if (op.sfx !== false) { X.sfx(t0, 'paper', { dur: dur, gain: 0.5 }); X.sfx(t0, 'swoosh', { dur: dur, gain: 0.25 }); }
      return m;
    };

    // ------------------------------------------------------------------ SVG overlay: callout labels projected from 3D
    /** thin white leader line from a 3D anchor to a small label (one per spoken noun) */
    D.label = (op) => {
      const g = X.svg('g', { opacity: 0 }, X.root);
      const line = X.svg('polyline', { fill: 'none', stroke: op.color ?? '#fff', 'stroke-width': op.width ?? 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const dot = X.svg('circle', { r: 6, fill: op.color ?? '#fff' }, g);
      const ring = X.svg('circle', { r: 6, fill: 'none', stroke: op.color ?? '#fff', 'stroke-width': 2 }, g);
      const txt = X.svg('text', { 'font-family': op.font ?? 'Inter', 'font-weight': 500, 'font-size': op.size ?? 34, fill: op.color ?? '#fff', text: op.text, 'letter-spacing': 0.5 }, g);
      txt.style.paintOrder = 'stroke'; txt.setAttribute('stroke', 'rgba(20,14,8,0.35)'); txt.setAttribute('stroke-width', 3);
      const anchor = typeof op.anchor === 'function' ? op.anchor : () => op.anchor;
      const dx = op.dx ?? 140, dy = op.dy ?? -70, t0 = op.t0, t1 = op.t1 ?? 1e9;
      if (op.sfx !== false) X.sfx(t0, 'tick', { gain: 0.25, pitch: 1.2 });
      D._post.push((t) => {
        if (t < t0 || t > t1 + 0.35) { g.setAttribute('opacity', 0); return; }
        const a = D.project(anchor(t));
        const p = D.clamp((t - t0) / 0.22), out = 1 - D.clamp((t - t1) / 0.3);
        const ex = a.x + dx * 0.55, ey = a.y + dy, fx = a.x + dx, L1 = Math.hypot(ex - a.x, ey - a.y), L2 = Math.abs(fx - ex);
        const lp = D.ease('power2.out')(p) * (L1 + L2);
        let pts = `${a.x.toFixed(1)},${a.y.toFixed(1)} `;
        if (lp <= L1) pts += `${(a.x + (ex - a.x) * lp / L1).toFixed(1)},${(a.y + (ey - a.y) * lp / L1).toFixed(1)}`;
        else pts += `${ex.toFixed(1)},${ey.toFixed(1)} ${(ex + Math.sign(dx) * (lp - L1)).toFixed(1)},${ey.toFixed(1)}`;
        line.setAttribute('points', pts);
        dot.setAttribute('cx', a.x); dot.setAttribute('cy', a.y);
        const pr = D.clamp((t - t0) / 0.5);
        ring.setAttribute('cx', a.x); ring.setAttribute('cy', a.y); ring.setAttribute('r', 6 + 16 * pr); ring.setAttribute('opacity', (1 - pr) * 0.8);
        const tp = D.clamp((t - t0 - 0.14) / 0.2);
        txt.setAttribute('x', dx > 0 ? fx + 12 : fx - 12); txt.setAttribute('y', ey + 11 + (1 - D.ease('back.out(2)')(tp)) * 14);
        txt.setAttribute('text-anchor', dx > 0 ? 'start' : 'end');
        txt.setAttribute('opacity', tp);
        g.setAttribute('opacity', out);
      });
      return g;
    };

    // ------------------------------------------------------------------ burned-in subtitles (NGO / parchment skin)
    D.subtitles = (op = {}) => {
      const size = op.size ?? 36, maxC = op.maxChars ?? 54;
      const div = X.html('div', { style: { position: 'absolute', left: '0', width: '1920px', top: `${op.top ?? 1000}px`, textAlign: 'center', font: `500 ${size}px Inter, sans-serif`, color: skin.text, letterSpacing: '0.2px', textShadow: '0 1px 2px rgba(0,0,0,.65), 0 0 10px rgba(0,0,0,.25)', zIndex: 6, whiteSpace: 'nowrap', pointerEvents: 'none' } });
      const chunks = [];
      for (const l of X.vo.lines) {
        let cur = [];
        const push = () => { if (cur.length) chunks.push({ text: cur.map((w) => w.w).join(' '), start: cur[0].start - 0.08, words: cur }); cur = []; };
        l.words.forEach((w, i) => {
          cur.push(w);
          const len = cur.map((x) => x.w).join(' ').length, next = l.words[i + 1];
          const brk = /[,.:;!?]$/.test(w.w) && len > maxC * 0.45;
          if (next && (len + next.w.length + 1 > maxC || brk)) push();
        });
        push();
        chunks[chunks.length - 1].lineEnd = l.end;
      }
      chunks.forEach((c, i) => { const nx = chunks[i + 1]; c.end = Math.min(nx ? nx.start : 1e9, (c.lineEnd ?? c.words[c.words.length - 1].end) + (op.hold ?? 0.45)); });
      const until = op.until ?? 1e9;
      X.every((t) => {
        let txt = '';
        if (t < until) for (const c of chunks) if (t >= c.start && t < c.end) { txt = c.text; break; }
        if (div.textContent !== txt) div.textContent = txt;
      });
      return div;
    };

    return D;
  };
})();
