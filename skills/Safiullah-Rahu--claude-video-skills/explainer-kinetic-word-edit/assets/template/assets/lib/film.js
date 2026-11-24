/* film.js — "Undertow": a kinetic word edit on an original spoken-word poem (9:16).
   Scenes: U underwater title + 3D glowing type (light burst, stretched vowel, whip) -> D desk collage (sheet with a
   highlighter sweep, polaroids, tape, ticket, mug) -> F fire-lit words that burn out -> D2 a crumpled note unfolds and
   writes itself -> Q a giant question mark with orbiting words, slow fade.
   window.FILM(K, VO) -> { draw(t) }   (VO = window.FILM_VO from tools/build_timing.py)                          */
window.FILM = function (K, VO) {
  const THREE = K.THREE, KW = window.KW, A = window.KWART, E = KW.ease, seg = KW.seg, clamp = KW.clamp, lerp = KW.lerp, n1 = KW.n1;
  const W = K.W, H = K.H, DUR = VO.dur, BEAT = 60 / VO.bpm;
  const ln = (id) => VO.lines[id];
  const on = (id, i) => VO.lines[id].words[i][1];
  const off = (id, i) => VO.lines[id].words[i][2];
  const D2R = Math.PI / 180;
  // scene boundaries (beats of 99 BPM; b19 = 11.52, b27 = 16.36, b44 = 26.67)
  const T = {
    D0: 19 * BEAT, FLASH: 27 * BEAT, FIRE: 28 * BEAT,
    BURN0: on("l5c", 0) + 0.55, BURN1: on("l5c", 0) + 1.45,
    NOTE0: on("l5c", 0) + 0.75, NOTE1: on("l5c", 0) + 1.45, UNF1: on("l6", 0) - 0.1,
    Q0: 44 * BEAT, QX: 44 * BEAT + 1.05, QP: on("l7", 0) + 1.9, FADE0: 52 * BEAT, STR0: on("l3b", 1), STR1: off("l3b", 1),
  };
  const fontsOf = { serif: "KWSerif", sans: "KWSans", black: "KWBlack", geo: "KWGeo", mono: "KWMono", marker: "KWMarker", hand: "KWHand" };

  // ====================================================================== U: underwater
  const U = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(38, W / H, 0.1, 200) };
  const CAMZ = 10, pxm = (z) => H / (2 * (CAMZ - z) * Math.tan(19 * D2R));
  const PX0 = pxm(0);
  const sx = (px, z = 0) => (px - W / 2) / pxm(z), sy = (py, z = 0) => (H / 2 - py) / pxm(z);
  const waterMat = K.shader(`varying vec2 vUv; uniform float t, burst, pan, panY, dim, rays, aspect; uniform vec2 bc; ${KW.noiseGLSL}
    void main(){
      vec2 uv = vUv; vec2 p = vec2((uv.x - .5) * aspect + pan, uv.y + panY);
      vec3 top = vec3(.25,.55,.70), mid = vec3(.035,.17,.28), bot = vec3(.006,.028,.055);
      vec3 col = mix(bot, mid, smoothstep(-.05, .55, p.y)); col = mix(col, top, smoothstep(.55, 1.05, p.y));
      // the surface seen from below: a wavy bright layer with ripples
      float sy = .90 + .012 * sin(p.x * 9. + t * 1.3) + .007 * sin(p.x * 23. - t * 2.1);
      float sm = smoothstep(sy - .015, sy + .03, p.y);
      float rip = fbm(vec2(p.x * 9. + t * .25, p.y * 42. - t * .6));
      col = mix(col, vec3(.36, .60, .70) * (.5 + .55 * rip), sm * .8);
      // sun through the surface
      vec2 sp = (p - vec2(.12, 1.0)) * vec2(1., 1.9);
      col += vec3(.75, .92, 1.) * exp(-dot(sp, sp) * 16.) * .3;
      // caustics: a warped noise network, brightest near the surface
      vec2 cp = p * 6.5;
      float w1 = fbm(cp + vec2(t * .21, t * .13)), w2 = fbm(cp * 1.3 + vec2(-t * .17, t * .1) + w1 * 1.6);
      float ca = pow(1. - abs(sin(w2 * 7.)), 5.);
      col += vec3(.45, .75, .85) * ca * smoothstep(.55, .97, p.y) * .09;
      // god rays from the surface sun
      vec2 rd = p - vec2(.12, 1.25); float ang = atan(rd.x, -rd.y);
      float rr = fbm(vec2(ang * 11. + t * .05, t * .12)); rr = smoothstep(.45, .85, rr);
      col += vec3(.38, .66, .80) * rr * smoothstep(-.1, .95, p.y) * (.18 + .1 * rays);
      // light burst behind the type: radial shafts + a soft core
      vec2 bd = vec2((uv.x - .5) * aspect, uv.y) - bc; float br = length(bd), ba = atan(bd.y, bd.x);
      float sh = vnoise(vec2(ba * 18., 1.3)) * .7 + vnoise(vec2(ba * 47., t * .4)) * .5;
      sh = smoothstep(.55, 1.05, sh);
      col += vec3(.70, .86, 1.0) * burst * (sh * exp(-br * 1.6) * .55 + exp(-br * br * 14.) * .3);
      // marine snow
      for (int L = 0; L < 2; L++) { float fl = float(L);
        vec2 q = p * vec2(26. + fl * 14.) + vec2(fl * 7., t * (.25 + fl * .2));
        vec2 id = floor(q), f = fract(q) - .5; vec2 h = hash22(id + fl * 13.);
        float s = smoothstep(.07 + fl * .03, 0., length(f - (h - .5) * .7)) * step(.82, h.x);
        col += vec3(.5, .7, .8) * s * (.18 + .2 * (1. - fl)); }
      col *= 1. - dim;
      gl_FragColor = vec4(col, 1.);
    }`, { t: { value: 0 }, burst: { value: 0 }, pan: { value: 0 }, panY: { value: 0 }, dim: { value: 0 }, rays: { value: 0 }, aspect: { value: W / H }, bc: { value: new THREE.Vector2(0, 0.42) } });

  // title (behind the figure), with an underwater wobble
  const titleTex = K.tex(A.title(["SOME NIGHTS", "I GO UNDER"], { size: 300, color: "#3b7fb3" }));
  const titleMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: titleTex }, t: { value: 0 }, op: { value: 0.85 }, lift: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 vUv; uniform sampler2D map; uniform float t, op, lift;
      void main(){ vec2 uv = vUv + vec2(sin(vUv.y * 38. + t * 1.9) * .0035, sin(vUv.x * 21. + t * 1.4) * .004);
        vec4 c = texture2D(map, uv); gl_FragColor = vec4(c.rgb * (1. + lift), c.a * op); }`,
  });
  const TZ = -3;
  const titleW = 1000 / pxm(TZ);
  const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(titleW, titleW * titleTex.image.height / titleTex.image.width), titleMat);
  titleMesh.position.set(0, sy(640, TZ), TZ);
  U.scene.add(titleMesh);

  const figTex = K.tex(A.figure());
  const FZ = -1.2;
  const figH = 1250 / pxm(FZ);
  const fig = new THREE.Mesh(new THREE.PlaneGeometry(figH * figTex.image.width / figTex.image.height, figH),
    new THREE.MeshBasicMaterial({ map: figTex, transparent: true, depthWrite: false, color: new THREE.Color(0.86, 0.95, 1.0), opacity: 0.94 }));
  U.scene.add(fig);

  // bubbles from the figure (positions are a pure function of t)
  const NB = 46, bubPos = new Float32Array(NB * 3), bubSize = new Float32Array(NB);
  const bubGeo = new THREE.BufferGeometry();
  bubGeo.setAttribute("position", new THREE.BufferAttribute(bubPos, 3));
  bubGeo.setAttribute("size", new THREE.BufferAttribute(bubSize, 1));
  const bubMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { op: { value: 1 } },
    vertexShader: `attribute float size; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * (10. / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float op; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d);
      float ring = smoothstep(.5, .4, r) * (smoothstep(.22, .42, r) * .9 + .12); float hl = smoothstep(.16, .0, length(d - vec2(-.14, -.14)));
      gl_FragColor = vec4(vec3(.75, .9, 1.) * (ring + hl), (ring + hl) * op); }`,
  });
  const bubbles = new THREE.Points(bubGeo, bubMat);
  bubbles.frustumCulled = false;
  U.scene.add(bubbles);
  const brng = KW.rng(77), bub = [];
  for (let i = 0; i < NB; i++) bub.push({ t0: -2 + i * 0.29 + brng() * 0.2, sp: 0.35 + brng() * 0.45, ph: brng() * 6.3, amp: 0.03 + brng() * 0.06, sz: 6 + brng() * 16, dx: (brng() - 0.5) * 0.25 });

  // ---------------------------------------------------------------- 3D type
  const TYPEFONT = (px) => `600 ${px}px ${fontsOf.sans}`;
  function word(str, px, opt) {
    const tx = K.text(str, Object.assign({ font: TYPEFONT(px), grad: ["#ffffff", "#cfe5fb"], pad: 30, ls: -px * 0.035, glow: ["rgba(150,200,255,0.35)", px * 0.08] }, opt || {}));
    const m = K.plane(tx, PX0);
    const g = new THREE.Group();
    m.position.x = m.userData.w / 2 - tx.pad / PX0;        // pivot at the glyphs' left edge
    g.add(m); g.userData = { m, tx, w: tx.tw / PX0 };
    g.visible = false;
    U.scene.add(g);
    return g;
  }
  // stack 1: one word per line, left aligned, built word by word on the voice
  const S1 = [["EVERY", "l2a", 0], ["WAVE", "l2a", 1], ["SAYS", "l2b", 0], ["YOUR", "l2b", 1], ["NAME", "l2b", 2]].map(([s, l, i], k) => {
    const g = word(s, 250);
    g.userData.y = 470 + k * 238; g.userData.on = on(l, i); g.userData.k = k;
    return g;
  });
  // stack 2: centred, replaces stack 1; the last word stretches its vowel
  const S2 = [["AND I", "l3a", 0, 660, 230], ["SINK", "l3a", 2, 890, 250], ["SO", "l3b", 0, 1110, 230]].map(([s, l, i, y, px]) => {
    const g = word(s, px);
    g.userData.y = y; g.userData.on = on(l, i);
    return g;
  });
  const NO = 13;
  const SLOW = [];
  for (let n = 1; n <= NO; n++) { const g = word("SL" + "O".repeat(n) + "W", 270); g.userData.y = 1375; SLOW.push(g); }
  const slowW1 = SLOW[0].userData.w;

  // ====================================================================== D: desk collage
  const D = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(30, W / H, 0.1, 200) };
  const DZ = 12, DPX = H / (2 * DZ * Math.tan(15 * D2R));     // px per m on the desk at the rest camera
  D.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const dl = new THREE.DirectionalLight(0xfff4e6, 2.4); dl.position.set(-2, 3, 6); D.scene.add(dl);
  let ro = 0;
  function flat(canvas, pxPerM, x, y, rot, z, opt) {
    const tex = K.tex(canvas);
    const w = canvas.width / pxPerM, h = canvas.height / pxPerM;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial(Object.assign({ map: tex, transparent: true, depthWrite: false, depthTest: false }, opt || {})));
    m.position.set(x, y, z || 0); m.rotation.z = rot * D2R; m.renderOrder = ro++;
    D.scene.add(m);
    return m;
  }
  function withShadow(canvas, pxPerM, x, y, rot, lift) {
    const sh = A.shadow(canvas, 16, 0.55, 60);
    flat(sh, pxPerM, x + 0.05 * lift, y - 0.09 * lift, rot, 0);
    return flat(canvas, pxPerM, x, y, rot, 0);
  }
  flat(A.wood(1560, 2700), 260, 0, 0, 0, 0);
  const SHEET_LINES = ["some nights, I go under", "every wave says your name", "and I sink so slow", "I kept what I never said", "still on fire, underwater", "come up for air", "did I ever let go?"];
  const sheet = A.sheet(SHEET_LINES, 3);
  const SHEET = { x: -0.42, y: 1.72, rot: -6.5, ppm: 400 };
  withShadow(sheet.canvas, SHEET.ppm, SHEET.x, SHEET.y, SHEET.rot, 1);
  // highlighter: a yellow strip in multiply, swept word by word on the voice
  const hlCan = document.createElement("canvas"); hlCan.width = 64; hlCan.height = 64;
  { const x = hlCan.getContext("2d"); x.fillStyle = "#f2dc3a"; x.fillRect(0, 6, 64, 52); x.fillStyle = "rgba(242,220,58,0.6)"; x.fillRect(0, 0, 64, 6); x.fillRect(0, 58, 64, 6); }
  const hlMat = new THREE.MeshBasicMaterial({ map: K.tex(hlCan), transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor });
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hlMat);
  hl.geometry.translate(0.5, 0, 0);
  hl.renderOrder = ro++;
  D.scene.add(hl);
  const sheetLocal = (px, py) => {   // canvas px on the sheet -> desk metres
    const lx = (px - sheet.canvas.width / 2) / SHEET.ppm, ly = (sheet.canvas.height / 2 - py) / SHEET.ppm, a = SHEET.rot * D2R;
    return [SHEET.x + lx * Math.cos(a) - ly * Math.sin(a), SHEET.y + lx * Math.sin(a) + ly * Math.cos(a)];
  };
  const POL = [["lighthouse", "the pier", -1.0, -0.98, -8, 3], ["moon", "low tide", 0.12, -0.86, 3, 4], ["boat", "keep this", 1.22, -1.05, 9, 5]];
  POL.forEach(([k, cap, x, y, r, s]) => withShadow(A.polaroid(k, cap, s), 400, x, y, r, 1));
  [[-1.25, -0.32, 28, 1], [0.14, -0.22, -6, 2], [1.42, -0.42, 18, 3], [-1.55, 0.98, -40, 4]].forEach(([x, y, r, s]) => flat(A.tape(240, 64, s), 400, x, y, r, 0));
  withShadow(A.ticket(), 400, -0.95, -2.55, 13, 0.6);
  withShadow(A.mug(), 300, 1.72, 2.78, 0, 1.4);
  withShadow(A.pen(), 400, 1.42, 0.62, -62, 0.7);
  // window-blind light: diagonal bands multiplied over everything on the desk, drifting slowly
  const blindMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, uniforms: { t: { value: 0 }, k: { value: 1 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 vP; uniform float t, k; ${KW.noiseGLSL}
      void main(){ vec2 p = vP; float a = .52; vec2 q = vec2(cos(a) * p.x + sin(a) * p.y, -sin(a) * p.x + cos(a) * p.y);
        float band = smoothstep(.12, .3, abs(fract(q.y / 1.05 + t * .012) - .5));
        float soft = .82 + .1 * vnoise(p * 1.3 + t * .05);
        float light = mix(.66, 1.12, band) * soft;
        light *= 1. - .18 * smoothstep(2.5, 5.5, length(p - vec2(-1.8, 3.)));
        gl_FragColor = vec4(vec3(mix(1., light, k)) * vec3(1.02, 1.0, .97), 1.); }`,
  });
  const blinds = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), blindMat);
  blinds.renderOrder = 900;
  D.scene.add(blinds);
  // dust motes in the light
  const ND = 140, dPos = new Float32Array(ND * 3), drng = KW.rng(91), dust = [];
  for (let i = 0; i < ND; i++) dust.push([(drng() - 0.5) * 5, (drng() - 0.5) * 8, 0.3 + drng() * 2, drng() * 6.3, 0.02 + drng() * 0.05]);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ color: 0xfff6e0, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0.55, depthTest: false, blending: THREE.AdditiveBlending });
  const motes = new THREE.Points(dGeo, dMat); motes.renderOrder = 950; motes.frustumCulled = false; D.scene.add(motes);

  // the crumpled note: a real mesh that unfolds (crumple 1 -> 0.18) and then writes itself
  const noteCan = document.createElement("canvas"); noteCan.width = 560; noteCan.height = 680;
  const NOTE_LINES = [{ text: "come up", x: 52, y: 300, size: 104, rot: -0.04 }, { text: "for air", x: 78, y: 470, size: 104, rot: -0.03 }];
  A.note(noteCan, NOTE_LINES, 0);
  const noteTex = K.tex(noteCan);
  const NW = 1.5, NH = NW * 680 / 560, NSX = 36, NSY = 44;
  const noteGeo = new THREE.PlaneGeometry(NW, NH, NSX, NSY);
  const nBase = Float32Array.from(noteGeo.attributes.position.array);
  const nr = KW.rng(123), creases = [];
  for (let i = 0; i < 14; i++) { const a = nr() * Math.PI; creases.push([Math.cos(a), Math.sin(a), (nr() - 0.5) * 1.2, (nr() - 0.5) * 0.22]); }
  const nDisp = new Float32Array(nBase.length / 3);
  for (let v = 0; v < nDisp.length; v++) {
    const x = nBase[v * 3], y = nBase[v * 3 + 1];
    let d = 0;
    creases.forEach(([cx, cy, o, a]) => { d += a * Math.abs(x * cx + y * cy - o * 0.5); });
    d += 0.05 * Math.sin(x * 9 + y * 4) + 0.04 * Math.sin(y * 11 - x * 3);
    nDisp[v] = d;
  }
  const noteMat = new THREE.MeshStandardMaterial({ map: noteTex, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false });
  const note = new THREE.Mesh(noteGeo, noteMat);
  note.renderOrder = 800;
  const noteSh = flat(A.shadow((() => { const c = document.createElement("canvas"); c.width = 560; c.height = 680; const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 560, 680); return c; })(), 20, 0.5, 60), 560 / NW, 0, 0, 0, 0);
  noteSh.renderOrder = 799;
  D.scene.add(note);
  function crumple(c, t) {
    const p = noteGeo.attributes.position.array;
    const mean = 0;
    for (let v = 0; v < nDisp.length; v++) {
      const x = nBase[v * 3], y = nBase[v * 3 + 1];
      const shrink = 1 - 0.72 * c;
      const r = Math.hypot(x, y);
      p[v * 3] = x * shrink + c * 0.05 * Math.sin(y * 13 + v);
      p[v * 3 + 1] = y * shrink + c * 0.05 * Math.cos(x * 12 + v * 0.7);
      p[v * 3 + 2] = (nDisp[v] - mean) * (0.25 + 1.6 * c) * 0.55 + c * 0.45 * Math.sqrt(Math.max(0, 1 - (r * shrink / (0.62 * NW)) ** 2));
    }
    noteGeo.attributes.position.needsUpdate = true;
    noteGeo.computeVertexNormals();
  }

  // ---------------------------------------------------------------- F: fire words (a pass over the dimmed desk)
  const FIRE_LINES = [["STILL", "l5a", 0], ["ON FIRE", "l5b", 0], ["UNDER", "l5c", 0], ["WATER", "l5c", 0]];
  const maskCan = document.createElement("canvas"); maskCan.width = W; maskCan.height = H;
  {
    const img = { data: new Uint8Array(W * H * 4) };
    const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H; const tx = tmp.getContext("2d");
    tx.font = `400 200px ${fontsOf.black}`;
    const maxW = Math.max(...FIRE_LINES.map((l) => tx.measureText(l[0]).width));
    const size = Math.floor(200 * 930 / maxW);
    FIRE_LINES.forEach(([s], ch) => {
      tx.clearRect(0, 0, W, H);
      tx.font = `400 ${size}px ${fontsOf.black}`;
      tx.lineJoin = "round"; tx.strokeStyle = "#fff"; tx.lineWidth = 9;
      const y = 600 + ch * size * 1.0;
      tx.strokeText(s, 72, y);
      tx.globalAlpha = 0.05; tx.fillStyle = "#fff"; tx.fillText(s, 72, y); tx.globalAlpha = 1;
      const d = tx.getImageData(0, 0, W, H).data;
      for (let yy = 0; yy < H; yy++) { const src = yy * W, dst = (H - 1 - yy) * W; for (let xx = 0; xx < W; xx++) img.data[(dst + xx) * 4 + ch] = d[(src + xx) * 4 + 3]; }
    });
    maskCan.data = img.data;
  }
  // a DataTexture, not a canvas: a canvas premultiplies, which would wipe the R/G/B words wherever channel A is empty
  const maskTex = new THREE.DataTexture(maskCan.data, W, H, THREE.RGBAFormat); maskTex.colorSpace = THREE.NoColorSpace;
  maskTex.minFilter = THREE.LinearFilter; maskTex.magFilter = THREE.LinearFilter; maskTex.needsUpdate = true;
  const fireMat = K.shader(`varying vec2 vUv; uniform sampler2D tSrc, tMask; uniform vec4 ign, ghost; uniform float t, dark, flare, dis, zoom; uniform vec2 res; ${KW.noiseGLSL}
    vec2 zu(vec2 uv){ return (uv - vec2(.5, .55)) / zoom + vec2(.5, .55); }
    float M(vec2 uv){ return dot(texture2D(tMask, zu(uv)), ign); }
    float G(vec2 uv){ return dot(texture2D(tMask, zu(uv)), ghost); }
    vec3 ramp(float h){ h = clamp(h, 0., 1.); return vec3(2.1 * h, 1.15 * pow(h, 1.8), .55 * pow(h, 3.5)); }
    void main(){
      vec3 base = texture2D(tSrc, vUv).rgb; float l = dot(base, vec3(.3, .59, .11));
      base = mix(base, vec3(l) * vec3(1., .9, .8), .75 * dark) * (1. - .78 * dark);
      vec2 px = 1. / res;
      float fl = 0.;
      for (int i = 1; i <= 12; i++) { float fi = float(i);
        vec2 o = vec2((fbm(vUv * vec2(10., 5.) + vec2(fi * .37, -t * 1.7)) - .5) * .022 * fi / 12., -fi * .0042);
        fl += M(vUv + o) * (1. - fi / 13.); }
      fl /= 3.4;
      float n = fbm(vUv * vec2(18., 9.) + vec2(0., -t * 2.8));
      fl *= smoothstep(.38, .8, n * .95 + .15);
      float core = M(vUv);
      float glow = 0.; for (int i = 0; i < 10; i++) { float a = float(i) * .628; glow += M(vUv + vec2(cos(a), sin(a)) * px * 16.); } glow /= 10.;
      float heat = core * (.62 + .3 * vnoise(vUv * 90. + t * 7.)) + fl * .6 + glow * .32;
      // char away at the end of the burn
      float cn = fbm(vUv * vec2(6., 9.) + 3.1);
      float alive = 1. - smoothstep(cn - .08, cn + .08, dis * 1.25 - .1);
      heat *= (1. + flare * 1.3) * alive;
      float gh = G(vUv) * (.28 + .2 * vnoise(vUv * 50. + t * 3.)) * alive;
      vec3 fire = ramp(heat) + vec3(1., .3, .06) * gh;
      // embers rising from the letters
      vec2 q = vUv * vec2(42., 74.) + vec2(sin(vUv.y * 9. + t) * .6, -t * 3.4); vec2 id = floor(q), f = fract(q) - .5; vec2 h = hash22(id);
      float sp = smoothstep(.11, 0., length(f - (h - .5) * .6)) * step(.9, h.y);
      float near = 0.; for (int i = 1; i < 6; i++) near += M(vUv - vec2(0., float(i) * .012));
      fire += vec3(1.6, .7, .2) * sp * clamp(near, 0., 1.) * (1. - dis);
      gl_FragColor = vec4(base + fire, 1.);
    }`, { tSrc: { value: null }, tMask: { value: maskTex }, ign: { value: new THREE.Vector4() }, ghost: { value: new THREE.Vector4() }, t: { value: 0 }, dark: { value: 0 },
    flare: { value: 0 }, dis: { value: 0 }, zoom: { value: 1 }, res: { value: new THREE.Vector2(W, H) } });

  // ====================================================================== Q: the question
  const Q = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(40, W / H, 0.05, 200) };
  const QZ = 9.5, QPX = H / (2 * QZ * Math.tan(20 * D2R));
  const qTex = A.qmark();
  const qm = new THREE.Mesh(new THREE.PlaneGeometry(3.85 * qTex.width / qTex.height, 3.85), new THREE.MeshBasicMaterial({ map: K.tex(qTex), transparent: true, depthWrite: false, color: new THREE.Color(1.05, 1.05, 1.05) }));
  const qg = new THREE.Group(); qg.add(qm); Q.scene.add(qg);
  const qpx = (px) => (px - W / 2) / QPX, qpy = (py) => (H / 2 - py) / QPX;
  qg.position.set(qpx(735), qpy(960), 0);
  const QW = [["DID", "l7", 0, 280, 520, 170, -5, 0.4], ["I", "l7", 1, 712, 1080, 150, 3, 0.05], ["EVER", "l7", 2, 295, 950, 150, 4, 0.6],
    ["LET", "l7", 3, 300, 1300, 180, -10, 0.8], ["GO", "l7", 4, 868, 1450, 145, -4, 0.45]].map(([s, l, i, x, y, px, rot, z]) => {
    const red = s === "GO", ink = s === "I";
    const tx = K.text(s, { font: `700 ${px}px ${fontsOf.geo}`, color: red ? "#ff3346" : ink ? "#141414" : "#f4f4f2", pad: 40, glow: red ? ["rgba(255,40,60,0.95)", 40] : null });
    const m = K.plane(tx, QPX * (QZ - z) / QZ);
    m.position.set(qpx(x) * (QZ - z) / QZ, qpy(y) * (QZ - z) / QZ, z); m.rotation.z = rot * D2R;
    m.userData = { on: on(l, i), red, base: m.position.clone(), rot: rot * D2R, w: m.userData.w };
    if (red) m.material.color.setRGB(1.6, 1.0, 1.0);
    Q.scene.add(m);
    return m;
  });
  const NQ = 520, qPos = new Float32Array(NQ * 3), qrng = KW.rng(201), qd = [];
  for (let i = 0; i < NQ; i++) qd.push([(qrng() - 0.5) * 12, (qrng() - 0.5) * 18, -8 + qrng() * 11, (qrng() - 0.5) * 0.08, 0.02 + qrng() * 0.06]);
  const qGeo = new THREE.BufferGeometry(); qGeo.setAttribute("position", new THREE.BufferAttribute(qPos, 3));
  const qDust = new THREE.Points(qGeo, new THREE.PointsMaterial({ color: 0xdddddd, size: 0.03, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false }));
  qDust.frustumCulled = false; Q.scene.add(qDust);

  // ====================================================================== per-frame
  function camU(t) {
    let x = 0.06 * n1(t * 0.35, 1), y = 0.05 * n1(t * 0.3, 2), z = CAMZ - 0.25 * E.io(seg(t, 0, 3.6)) - 0.3 * E.io(seg(t, 3.6, 7.2));
    let roll = 0.6 * n1(t * 0.25, 3) * D2R;
    const sw = E.io(seg(t, T.STR0, T.STR1 - 0.3));       // follow the stretching word to the right
    x += 0.15 * E.io(seg(t, 7.2, 8.6)) + 1.05 * sw;
    const wh = E.inExpo(seg(t, T.STR1 - 0.32, T.STR1)) * 0.6 + E.outExpo(seg(t, T.STR1, T.STR1 + 0.45)) * 0.4;   // the whip
    x += 3.1 * (seg(t, T.STR1 - 0.32, T.STR1 + 0.45) > 0 ? wh : 0) + (t > T.STR1 + 0.45 ? 3.1 : 0);
    x += 0.35 * seg(t, T.STR1 + 0.45, T.D0 + 0.8);
    y -= 0.9 * E.in2(seg(t, T.STR1 + 0.2, T.D0 + 0.8));
    roll += -4 * D2R * E.io(seg(t, T.STR1 - 0.3, T.STR1 + 0.4));
    return { x, y, z, roll };
  }
  function velU(t) { const a = camU(t - 1 / 60), b = camU(t + 1 / 60); return [(b.x - a.x) * 30, (b.y - a.y) * 30]; }

  function poseU(t) {
    const c = camU(t);
    U.cam.position.set(c.x, c.y, c.z); U.cam.lookAt(c.x, c.y, 0); U.cam.rotateZ(c.roll);
    const wu = waterMat.uniforms;
    wu.t.value = t; wu.pan.value = c.x * 0.16; wu.panY.value = c.y * 0.12;
    wu.dim.value = 0.92 * E.io(seg(t, T.STR1 + 0.3, T.D0 - 0.1));
    // light burst: kicks on the first word, pulses on each lit word, fades as the whip comes
    let burst = 0;
    const hits = [on("l2a", 0), on("l2a", 1), on("l2b", 0), on("l2b", 1), on("l2b", 2), on("l3a", 0), on("l3a", 2), on("l3b", 0), on("l3b", 1)];
    hits.forEach((h, i) => { if (t >= h) burst = Math.max(burst, (i === 0 ? 1.0 : 0.75) * Math.exp(-(t - h) * 2.2)); });
    const bed = 0.42 * seg(t, on("l2a", 0) - 0.1, on("l2a", 0) + 0.3) * (1 - seg(t, T.STR1 - 0.2, T.STR1 + 0.3));
    wu.burst.value = Math.max(bed, burst * 0.9) + bed * 0.3;
    wu.rays.value = 1 - seg(t, 3.5, 4.0);
    wu.bc.value.set(-c.x * 0.16 * 0 + 0.02, 0.36);
    titleMat.uniforms.t.value = t;
    titleMat.uniforms.op.value = 0.78 * (1 - 0.7 * seg(t, on("l2a", 0) - 0.1, on("l2a", 0) + 0.5));
    titleMat.uniforms.lift.value = 0.25 * Math.exp(-Math.max(0, t - on("l1b", 2)) * 2.5) * (t >= on("l1b", 2) ? 1 : 0);
    titleMesh.position.y = sy(640, TZ) + 0.12 * t * 0.1;
    // the figure sinks feet first, turning slowly
    fig.position.set(0.1 + 0.08 * Math.sin(t * 0.4), sy(1080, FZ) + 0.75 - 0.13 * t, FZ);
    fig.rotation.z = (-6 + 4 * Math.sin(t * 0.33)) * D2R;
    fig.material.opacity = 0.94 * (1 - 0.35 * seg(t, on("l2a", 0), on("l2a", 0) + 1));
    // bubbles
    const head = new THREE.Vector3(-0.05, figH * 0.16, 0).applyMatrix4(fig.matrixWorld.clone().compose(fig.position, fig.quaternion, fig.scale));
    for (let i = 0; i < NB; i++) {
      const b = bub[i], age = (t - b.t0);
      const live = age > 0 && age < 6;
      bubPos[i * 3] = head.x + b.dx + Math.sin(age * 3 + b.ph) * b.amp;
      bubPos[i * 3 + 1] = head.y + age * b.sp * (1 + age * 0.15);
      bubPos[i * 3 + 2] = FZ + 0.1;
      bubSize[i] = live ? b.sz * (1 + age * 0.08) : 0;
    }
    bubGeo.attributes.position.needsUpdate = true; bubGeo.attributes.size.needsUpdate = true;
    bubMat.uniforms.op.value = 0.8 * (1 - wu.dim.value);

    // stack 1
    const out1 = on("l3a", 0) - 0.04;
    S1.forEach((g, k) => {
      const d = g.userData, m = d.m;
      const ghostT = k === 0 ? d.on - 0.08 : Math.max(on("l2a", 0), d.on - 0.38);
      g.visible = t >= ghostT && t < out1 + 0.25;
      if (!g.visible) return;
      const lit = seg(t, d.on, d.on + 0.08);
      const pop = 1 + 0.07 * (1 - E.out3(seg(t, d.on, d.on + 0.22)));
      let x = sx(80), z = 0, ry = 0;
      if (k === 0) {                                                       // the first word swings in like a door
        const u = E.outExpo(seg(t, ghostT, ghostT + 0.42));
        x = lerp(sx(-900), sx(80), u); z = lerp(1.6, 0, u); ry = lerp(1.25, 0, u);
      }
      const o = E.in2(seg(t, out1, out1 + 0.22));
      g.position.set(x - o * 0.5, sy(d.y) + o * 0.25, z + o * 1.8);
      g.rotation.set(0, ry - o * 0.5, 0);
      g.scale.setScalar(pop);
      const c = lerp(0.5, 1.02, lit);
      m.material.color.setRGB(c * 0.92, c * 0.97, c * 1.08);
      m.material.opacity = lerp(0.45, 1, lit) * (1 - o);
    });
    // stack 2 + the stretched word
    S2.forEach((g, k) => {
      const d = g.userData, m = d.m;
      g.visible = t >= d.on - 0.05 && t < T.STR1 + 0.6;
      if (!g.visible) return;
      const u = E.outExpo(seg(t, d.on - 0.05, d.on + 0.25));
      const lit = seg(t, d.on, d.on + 0.08);
      g.position.set(sx(540) - d.w / 2, sy(d.y) - (1 - u) * 0.25, (1 - u) * 1.2);
      g.rotation.set(-(1 - u) * 0.5, 0, 0);
      const c = lerp(0.6, 1.02, lit);
      m.material.color.setRGB(c * 0.92, c * 0.97, c * 1.08);
      m.material.opacity = u;
    });
    const s0 = T.STR0;
    const nIdx = t < s0 ? 0 : Math.min(NO - 1, Math.floor(seg(t, s0 + 0.05, T.STR1 - 0.15) * (NO - 1) + 0.0001));
    SLOW.forEach((g, n) => {
      g.visible = n === nIdx && t >= s0 - 0.05 && t < T.D0 + 0.9;
      if (!g.visible) return;
      const u = E.outExpo(seg(t, s0 - 0.05, s0 + 0.25));
      const lit = seg(t, s0, s0 + 0.08);
      const fall = E.in2(seg(t, T.STR1 + 0.25, T.D0 + 0.9));
      g.position.set(sx(540) - slowW1 / 2 + fall * 0.3, sy(g.userData.y) - (1 - u) * 0.25 - fall * 2.6, (1 - u) * 1.2 - fall * 0.6);
      g.rotation.set(-(1 - u) * 0.5, 0, -fall * 0.12);
      const c = lerp(0.6, 1.02, lit) * (1 - 0.35 * fall);
      g.userData.m.material.color.setRGB(c * 0.92, c * 0.97, c * 1.08);
      g.userData.m.material.opacity = u * (1 - E.in2(seg(t, T.D0 + 0.2, T.D0 + 0.9)));
    });
  }

  function camD(t) {
    let z = DZ, x = 0.05 * n1(t * 0.3, 5), y = 0.05 * n1(t * 0.27, 6), roll = (-1.5 + 1.2 * n1(t * 0.18, 7)) * D2R;
    // arrive (slightly high, settling), slow push, a pull-back + flash before the fire, a settle after the burn
    z += 1.2 * (1 - E.out3(seg(t, T.D0, T.D0 + 1.3)));
    z -= 0.55 * E.io(seg(t, T.D0 + 1.3, T.FLASH));
    // push in on the line being highlighted, then back out before the fire
    const l4 = ln("l4"), pin = E.io(seg(t, l4.t0 - 0.55, l4.t0 + 0.5)) * (1 - E.io(seg(t, l4.t1 + 0.35, T.FLASH - 0.05)));
    const hc = sheetLocal((sheet.words[0].x0 + sheet.words[sheet.words.length - 1].x1) / 2, sheet.lineY - 14);
    x = lerp(x, hc[0], pin); y = lerp(y, hc[1] - 0.25, pin); z -= 4.3 * pin; roll += (SHEET.rot * 0.6) * D2R * pin;
    z += 2.4 * E.out3(seg(t, T.FLASH, T.FIRE + 0.4)) - 2.4 * E.io(seg(t, T.BURN0 + 0.2, T.NOTE1 + 0.6));
    // settle toward the note, then push in on it while it writes itself
    const l6 = ln("l6"), pn = E.io(seg(t, l6.t0 - 1.0, l6.t0 + 0.6));
    z -= 0.6 * E.io(seg(t, T.NOTE1, l6.t0)) + 3.2 * pn + 0.5 * E.io(seg(t, l6.t1, T.Q0));
    x = lerp(x, 0.42, pn); y = lerp(y, -1.25, pn);
    roll += 2 * D2R * E.io(seg(t, T.NOTE1, T.Q0));
    return { x, y, z, roll };
  }
  function poseD(t) {
    const c = camD(t);
    D.cam.position.set(c.x, c.y, c.z); D.cam.lookAt(c.x, c.y, 0); D.cam.rotateZ(c.roll);
    blindMat.uniforms.t.value = t;
    // highlighter sweep: word by word along the spoken line
    const ws = ln("l4").words;
    let px = sheet.words[0].x0 - 6;
    ws.forEach((w, i) => { const u = E.io(seg(t, w[1] - 0.03, Math.min(w[2], w[1] + 0.32))); if (u > 0) px = lerp(i ? sheet.words[i - 1].x1 + 6 : sheet.words[0].x0 - 6, sheet.words[i].x1 + 6, u); });
    const p0 = sheetLocal(sheet.words[0].x0 - 8, sheet.lineY - 14);
    const wpx = Math.max(0.001, px - (sheet.words[0].x0 - 8));
    hl.position.set(p0[0], p0[1], 0); hl.rotation.z = SHEET.rot * D2R;
    hl.scale.set(wpx / SHEET.ppm, 52 / SHEET.ppm, 1);
    hl.visible = t > ws[0][1] - 0.05;
    // dust motes
    for (let i = 0; i < ND; i++) { const d = dust[i]; dPos[i * 3] = d[0] + Math.sin(t * 0.2 + d[3]) * 0.25 + t * d[4]; dPos[i * 3 + 1] = d[1] + Math.cos(t * 0.15 + d[3]) * 0.2 + t * d[4] * 0.6; dPos[i * 3 + 2] = d[2]; }
    dGeo.attributes.position.needsUpdate = true;
    dMat.opacity = 0.5 * (1 - seg(t, T.FLASH, T.FIRE) + seg(t, T.BURN1, T.BURN1 + 0.5));
    // the note: falls in during the burn, lands, unfolds, writes itself
    const fallU = E.out3(seg(t, T.NOTE0, T.NOTE1));
    note.visible = t >= T.NOTE0; noteSh.visible = note.visible;
    if (note.visible) {
      const unf = E.io(seg(t, T.NOTE1 + 0.05, T.UNF1));
      const cr = lerp(1.0, 0.16, unf);
      crumple(cr, t);
      const nx = 0.42, ny = -1.18;
      note.position.set(lerp(nx + 1.4, nx, fallU), lerp(ny + 2.5, ny, fallU), lerp(3.0, 0.32, fallU));
      note.rotation.set(lerp(1.1, 0.12, unf) * (1 - 0.3 * fallU) + 0.08 * Math.sin(t * 0.7), lerp(-0.6, -0.08, unf), lerp(-1.6, 0.16, fallU) + 0.25 * unf);
      noteSh.position.set(note.position.x + 0.12, note.position.y - 0.18, 0); noteSh.rotation.z = note.rotation.z;
      const ss = lerp(0.3, 1, 1 - cr * 0.72) * lerp(1.5, 1, fallU); noteSh.scale.set(ss, ss, 1);
      noteSh.material.opacity = 0.75 * fallU;
      const wl = ln("l6").words;
      const prog = seg(t, wl[0][1] - 0.05, wl[3][2] - 0.1);
      A.note(noteCan, NOTE_LINES, prog);
      noteTex.needsUpdate = true;
    }
  }

  function poseQ(t) {
    const u = E.out3(seg(t, T.Q0, T.QP));
    const z = lerp(1.5, QZ, u) - 0.3 * E.io(seg(t, T.QP, DUR));
    const x = lerp(qg.position.x + 0.9, 0, u) + 0.05 * n1(t * 0.3, 9), y = lerp(qg.position.y + 1.6, 0, u) + 0.05 * n1(t * 0.3, 10);
    Q.cam.position.set(x, y, z); Q.cam.lookAt(x * 0.9, y * 0.9, 0);
    Q.cam.rotateZ(lerp(-22, 0, u) * D2R + 0.015 * Math.sin(t * 0.3));
    qg.rotation.set(0, lerp(0.5, 0, u), lerp(-0.35, 0, u) + 0.03 * Math.sin(t * 0.35));
    QW.forEach((m, i) => {
      const d = m.userData;
      m.visible = t >= d.on - 0.06;
      if (!m.visible) return;
      const a = E.out3(seg(t, d.on - 0.06, d.on + 0.3));
      const orb = 0.06 * Math.sin(t * 0.42 + i * 1.7) * seg(t, T.QP - 0.6, T.QP + 1.5), ob = 0.08 * Math.cos(t * 0.33 + i);
      // orbit around the mark's centre
      const cx = qg.position.x, cy = qg.position.y, bx = d.base.x - cx, by = d.base.y - cy, ang = orb;
      m.position.set(cx + bx * Math.cos(ang) - by * Math.sin(ang), cy + bx * Math.sin(ang) + by * Math.cos(ang) + ob * 0.3, d.base.z + (1 - a) * 0.8);
      m.rotation.z = d.rot + ang;
      m.scale.setScalar(lerp(1.25, 1, a));
      let op = a;
      if (d.red) { const fl = t - d.on; op *= fl < 0.35 ? (Math.sin(fl * 90) > -0.2 ? 1 : 0.25) : 1; op *= 1 - 0.55 * (t > 33.4 && t < 33.55 ? 1 : 0); }
      m.material.opacity = op;
    });
    for (let i = 0; i < NQ; i++) { const d = qd[i]; qPos[i * 3] = d[0] + d[3] * t; qPos[i * 3 + 1] = d[1] + d[4] * t; qPos[i * 3 + 2] = d[2]; }
    qGeo.attributes.position.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the frame
  const RT = K.targets;
  function draw(t) {
    t = Math.max(0, Math.min(DUR - 1e-4, t));
    let src, P = { t, grain: 0.04 };
    if (t < T.D0) {
      poseU(t);
      K.render(U.scene, U.cam, RT.A, waterMat);
      src = RT.A;
      const v = velU(t);
      const defocus = 9 * (1 - E.out3(seg(t, 0, 0.75)));
      Object.assign(P, { bloom: 0.5, thr: 0.78, knee: 0.3, vig: 0.5, defocus, mb: [-v[0] * PX0 / 30 * 0.9, v[1] * PX0 / 30 * 0.9], ca: 0.004, sat: 1.05, contrast: 1.04 });
    } else {
      const inQ = t >= T.Q0;
      if (t < T.QX) {
        poseD(t);
        K.render(D.scene, D.cam, RT.A, null);
        src = RT.A;
        // fire pass
        const fireOn = t >= T.FLASH && t < T.BURN1 + 0.3;
        if (fireOn) {
          const fu = fireMat.uniforms;
          fu.tSrc.value = RT.A.texture; fu.t.value = t;
          const ig = (id, i, k = 0) => E.out3(seg(t, on(id, i) + k, on(id, i) + k + 0.18));
          fu.ign.value.set(ig("l5a", 0), ig("l5b", 0), ig("l5c", 0), ig("l5c", 0, 0.34));
          const gh = seg(t, T.FIRE - 0.05, T.FIRE + 0.2);
          fu.ghost.value.set(0, gh, gh, gh);
          fu.dark.value = E.io(seg(t, T.FLASH + 0.25, T.FIRE + 0.1)) * (1 - E.io(seg(t, T.BURN0 + 0.15, T.BURN1)));
          fu.flare.value = E.in2(seg(t, T.BURN0 - 0.1, T.BURN0 + 0.45)) * (1 - seg(t, T.BURN0 + 0.45, T.BURN1));
          fu.dis.value = seg(t, T.BURN0 + 0.2, T.BURN1);
          fu.zoom.value = lerp(1.85, 1.0, E.outExpo(seg(t, T.FIRE - 0.04, T.FIRE + 0.4)));
          K.quad(fireMat, RT.F);
          src = RT.F;
        }
        if (t < T.D0 + 0.9) {                                 // the stretched word falls into the desk (additive), desk fades up
          poseU(t);
          K.render(U.scene, U.cam, RT.B, waterMat);
          const ga = E.io(seg(t, T.D0, T.D0 + 0.45));
          src = K.mix(src, RT.B, 1, 2, RT.M, ga);
        }
        if (inQ) {
          poseQ(t);
          K.render(Q.scene, Q.cam, RT.B, null);
          src = K.mix(src, RT.B, E.io(seg(t, T.Q0 + 0.1, T.QX)), 0, src === RT.M ? RT.F : RT.M);
        }
        const flash = 0.55 * Math.exp(-Math.max(0, t - T.FLASH - 0.18) * 7) * seg(t, T.FLASH, T.FLASH + 0.18) * (t < T.FIRE + 0.3 ? 1 : 0)
          + 0.42 * E.io(seg(t, T.BURN0 + 0.15, T.BURN0 + 0.45)) * (1 - E.io(seg(t, T.BURN0 + 0.45, T.BURN1 + 0.1)));
        const fireLook = t >= T.FIRE - 0.1 && t < T.BURN1;
        const vq = inQ ? [-(seg(t, T.Q0, T.Q0 + 0.25) - seg(t, T.Q0 + 0.25, T.Q0 + 0.6)) * 70, 0] : [0, 0];
        Object.assign(P, { bloom: fireLook ? 0.5 : 0.35, thr: fireLook ? 0.85 : 0.92, knee: 0.3, vig: fireLook ? 0.55 : 0.32, sat: fireLook ? 1.1 : 0.9,
          contrast: 1.05, flash, flashCol: [1.0, 0.86, 0.66], mb: vq, ca: fireLook ? 0.003 : 0.0015 });
      } else {
        poseQ(t);
        K.render(Q.scene, Q.cam, RT.A, null);
        src = RT.A;
        Object.assign(P, { bloom: 0.75, thr: 0.8, knee: 0.3, vig: 0.42, sat: 1, contrast: 1.06, grain: 0.05, ca: 0.002,
          fade: E.io(seg(t, T.FADE0, DUR - 0.25)) * 0.985 + (t > DUR - 0.25 ? 0.015 : 0) });
      }
    }
    K.post(src, P);
  }
  return { draw, T, U, D, Q, note, fig };
};
