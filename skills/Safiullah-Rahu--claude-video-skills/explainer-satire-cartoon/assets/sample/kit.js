/* kit.js — "satire-cartoon" style kit for the explainer engine (window.K). Vertical 9:16 (1080×1920).
 * The look of fast satirical news-cartoon reels: chunky toy-like bobble-head figures with ONE hard cel shade band
 * (cool violet shadow) + a soft key light, thin plum outlines, warm cream rooms / sky-blue exteriors, hard cuts
 * every ~2.7 s, a camera that always drifts, props that carry the argument (wall calendar with a circled date,
 * price-sign counters that leap, a flipping desk sign) and small yellow outlined captions at 70 % of frame height.
 * Every character, prop and place here is original; only the construction rules follow the analysis.
 *
 *   K.init(X)                              once, before any shot (filters, overlays, per-frame driver)
 *   ctx = K.shot(name, t0, t1, {bg,rig,drift}, build)   one camera shot (hard cut in/out); ctx.layer(p) parallax layer
 *   K.move(ctx,t,{x,y,s,r},dur,ease) · K.whip(ctx,t,to,dur) · K.orbit(ctx,t,dx,dur) · K.punch · K.shake
 *   P = K.toon(parent, spec)               bobble-head puppet: P.pose(t,name,dur) P.face(t,name) P.look(t,dx,dy)
 *                                          P.moveTo(t,{x,y,s},dur) P.walk(t0,t1,{x}) P.hop(t) P.prop(t,name,on)
 *   props:  K.steamroller K.tarp K.calendar K.tearCal K.priceSign K.led K.pothole K.car K.bike K.mailbox K.duck
 *           K.podium K.desk K.deskSign K.easel K.chalkboard K.billboard K.umbrella K.booth K.beacon K.crest K.cone
 *           K.cloud K.tree K.house K.ballot K.halo
 *   fx:     K.sparkles K.burst K.puff K.confetti K.flash K.slot (scramble counter) K.roll (mechanical counter)
 *   rooms:  K.wall K.floor K.window K.curtain K.sky K.ground
 *   text:   K.captions(X.vo)  (2–4 word chunks, yellow, dark outline, centred at 70 % height)
 */
(function () {
  const K = (window.K = {});
  const C = (K.C = {
    ink: '#2b2235', white: '#fffdf6',
    // rooms (sampled from the source, see references/analysis.md §5)
    cream: '#fbf3db', cream2: '#f4e7ca', cream3: '#e9d6b2', creamS: '#d9c7ad',
    navy: '#2b417e', navyD: '#222543', gold: '#e8b85a', goldD: '#c08a3a',
    hangar: '#615765', hangar2: '#575375', hangarL: '#7d7081', hangarD: '#463d5a',
    sky: '#71b3ee', sky2: '#9fd2f6', skyPale: '#e2f3fb', cloudS: '#cfe3f6',
    wood: '#c78b57', woodD: '#a5683d', woodDD: '#8a5233', wallCream: '#f3e7cd',
    pink: '#dcbeb8', pinkTop: '#8a6c8a',
    floorWood: '#f0c689', floorWoodD: '#d9a967', boothWall: '#e6ecf3',
    signBlue: '#3360cc', signDark: '#1d2550', digit: '#f6e43c', strip: '#f2c430',
    red: '#d8473c', yellowCar: '#f7ce3f', grass: '#8cc96e', grassD: '#6aa95a', treeG: '#5fae55',
    road: '#c3c0c9', roadD: '#a8a4b1', sidewalk: '#f3e4c8', hole: '#4a4357', holeRim: '#8f8899',
    olive: '#7b8646', oliveD: '#5d6634',
    steel: '#a9b0c2', roller: '#f2b636', calRed: '#d9503f', calBlue: '#4d62c6', calPaper: '#f6eedb', calCell: '#eadfc6',
    chalk: '#2f5848', amber: '#f4a52a', hivis: '#ff8c23', hard: '#f5c62a',
  });
  let X;
  const NS = 'http://www.w3.org/2000/svg';
  const f2 = (v) => Math.round(v * 100) / 100;
  K.shots = []; K.tfs = []; K.hooks = [];

  // ------------------------------------------------------------------ colour helpers (cel shading)
  const hx = (c) => { if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); };
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (K.mix = (a, b, k) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); });
  /** the source's shadow is a cool violet multiply, not a darker version of the hue */
  K.shade = (c, k = 0.55) => { const A = hx(c), M = hx('#7a72b4'); return toHex(A.map((v, i) => v + (v * M[i] / 255 - v) * k)); };
  K.light = (c, k = 0.14) => mix(c, '#fff9ec', k);
  const pcache = {};
  /** Fill with a soft key light + one hard shade band. mode: cyl (limb/torso, light from left) · sphere (head)
   *  · vert (plane, top lit) · side (vertical object lit from left, wide band) · flat */
  K.paint = (c, mode = 'cyl', k = 0.55) => {
    if (mode === 'flat') return c;
    const id = `p${mode}${c.slice(1)}${Math.round(k * 100)}`;
    if (pcache[id]) return pcache[id];
    const s = K.shade(c, k), l = K.light(c, 0.16);
    let g;
    if (mode === 'sphere') {
      g = X.svg('radialGradient', { id, cx: 0.42, cy: 0.38, r: 0.7, fx: 0.36, fy: 0.3 }, X.defs);
      [[0, l], [0.5, c], [0.8, c], [0.8, s], [1, mix(s, c, 0.25)]].forEach(([o, col]) => X.svg('stop', { offset: o, 'stop-color': col }, g));
    } else if (mode === 'vert') {
      g = X.svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, X.defs);
      [[0, K.light(c, 0.08)], [1, mix(c, s, 0.35)]].forEach(([o, col]) => X.svg('stop', { offset: o, 'stop-color': col }, g));
    } else {
      const cut = mode === 'side' ? 0.58 : 0.68;
      g = X.svg('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0.08 }, X.defs);
      [[0, l], [0.42, c], [cut, c], [cut, s], [1, mix(s, '#3a2f58', 0.12)]].forEach(([o, col]) => X.svg('stop', { offset: o, 'stop-color': col }, g));
    }
    return (pcache[id] = `url(#${id})`);
  };
  const OUT = { stroke: C.ink, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' };
  K.OUT = OUT;
  /** outlined path with a cel fill */
  const sp = (K.sp = (parent, d, c, mode = 'cyl', extra = {}) => X.svg('path', { d, fill: c == null ? 'none' : K.paint(c, mode), ...OUT, ...extra }, parent));
  const se = (K.se = (parent, cx, cy, rx, ry, c, mode = 'sphere', extra = {}) => X.svg('ellipse', { cx, cy, rx, ry, fill: c == null ? 'none' : K.paint(c, mode), ...OUT, ...extra }, parent));
  const sr = (K.sr = (parent, x, y, w, h, c, mode = 'cyl', rx = 0, extra = {}) => X.svg('rect', { x, y, width: w, height: h, rx, fill: c == null ? 'none' : K.paint(c, mode), ...OUT, ...extra }, parent));
  const g = (K.g = (parent, attrs = {}) => X.svg('g', attrs, parent));
  const txt = (K.txt = (parent, x, y, s, o = {}) => X.svg('text', {
    x, y, text: s, 'text-anchor': o.anchor || 'middle', 'font-family': o.font || 'Montserrat', 'font-weight': o.weight || 800,
    'font-size': o.size || 40, fill: o.fill || C.white, 'letter-spacing': o.ls || 0, ...(o.stroke ? { stroke: o.stroke, 'stroke-width': o.sw || 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round' } : {}), ...(o.attrs || {}),
  }, parent));

  // ------------------------------------------------------------------ init + per-frame driver
  K.init = (X_) => {
    X = X_;
    K.shotsRoot = X.svg('g', { id: 'shots' });
    K.fxRoot = X.svg('g', { id: 'fxtop' });
    K.capRoot = X.svg('g', { id: 'captions' });
    K.flashRect = X.svg('rect', { x: -10, y: -10, width: X.W + 20, height: X.H + 20, fill: '#fffaf0', opacity: 0 }, K.fxRoot);
    const blur = (id, sd) => { const f = X.svg('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, X.defs); X.svg('feGaussianBlur', { stdDeviation: sd }, f); return `url(#${id})`; };
    K.F = { soft: blur('soft4', 4), soft12: blur('soft12', 12), soft30: blur('soft30', 30), glow: X.glow('kglow', 10, '#fff6c8', 0.9) };
    X.every(K._frame);
  };
  K._frame = (t) => {
    for (const s of K.shots) if (t >= s.t0 - 0.04 && t <= s.t1 + 0.04) applyRig(s, t);
    for (const o of K.tfs) if (!o.vis || o.vis(t)) applyTf(o);
    for (const h of K.hooks) if (!h.vis || h.vis(t)) h.fn(t);
  };
  function applyRig(s, t) {
    const r = s.rig; let sx = 0, sy = 0;
    const dt = Math.max(0, t - s.t0), dr = s.drift, dx = dr[0] * dt, dy = dr[1] * dt;
    let ds = 1 + dr[2] * dt, blur = 0, bdir = 0;
    for (const k of s.punches) {
      const d = t - k.t;
      if (d >= 0 && d < k.dur + 0.12) ds *= 1 + (k.k - 1) * (d < 0.12 ? Math.sin((d / 0.12) * Math.PI / 2) : Math.max(0, 1 - (d - 0.12) / k.dur) ** 2 * (k.hold ? 0 : 1) + (k.hold ? 1 : 0));
    }
    for (const k of s.shakes) {
      const d = t - k.t;
      if (d >= 0 && d < k.dur) { const e = (1 - d / k.dur) ** 2; sx += k.amp * e * Math.sin(d * 61 + k.ph); sy += k.amp * e * Math.cos(d * 47 + k.ph * 1.7); }
    }
    for (const w of s.whips) {
      const d = (t - w.t) / w.dur;
      if (d > 0 && d < 1) { const b = Math.sin(Math.PI * d) ** 2 * w.amt; if (b > blur) { blur = b; bdir = w.dir; } }
    }
    for (const [L, p] of s.layers) {
      const sc = Math.pow(r.s * ds, p), x = (r.x + dx) * p, y = (r.y + dy) * p;
      L.setAttribute('transform', `translate(${f2(X.W / 2 + sx)} ${f2(X.H / 2 + sy)}) rotate(${f2(r.r * p)}) scale(${sc.toFixed(4)}) translate(${f2(-X.W / 2 - x)} ${f2(-X.H / 2 - y)})`);
    }
    if (s.blurEl) {
      if (blur > 0.4) { s.blurEl.setAttribute('stdDeviation', bdir ? `0 ${f2(blur)}` : `${f2(blur)} 0`); s.cam.setAttribute('filter', `url(#${s.blurId})`); }
      else s.cam.removeAttribute('filter');
    }
  }
  function applyTf(o) {
    const s = o.st;
    o.el.setAttribute('transform', `translate(${f2(s.x)} ${f2(s.y)}) rotate(${f2(s.r)}) scale(${(s.s * s.sx).toFixed(4)} ${(s.s * s.sy).toFixed(4)})`);
    if (o.useO && s.o !== o._o) { o.el.setAttribute('opacity', f2(s.o)); o._o = s.o; }
  }
  /** Drive an element's transform from a tweenable state {x,y,s,sx,sy,r,o}; draw its content around (0,0). */
  K.tf = (el, init = {}, vis = null) => {
    const st = { x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1, ...init };
    const o = { el, st, vis, _o: null, useO: 'o' in init };
    K.tfs.push(o); applyTf(o);
    return st;
  };
  K.hook = (fn, vis = null) => K.hooks.push({ fn, vis });
  const visOf = (ctx) => (ctx ? (t) => t >= ctx.t0 - 0.04 && t <= ctx.t1 + 0.04 : null);
  K.visOf = visOf;
  /** tween a K.tf state safely for out-of-order seeks (fromTo from the planned value) */
  K.to = (st, t, to, dur = 0.4, ease = 'power3.out') => {
    st._plan = st._plan || { ...st };
    const from = {}; for (const k in to) from[k] = st._plan[k];
    Object.assign(st._plan, to);
    X.tl.fromTo(st, from, { ...to, duration: dur, ease, immediateRender: false }, t);
  };

  // ------------------------------------------------------------------ shots (hard-cut camera setups)
  K.shot = (name, t0, t1, o = {}, build) => {
    const sg = X.scene(name, t0, t1, null, K.shotsRoot);
    X.svg('rect', { x: -500, y: -500, width: X.W + 1000, height: X.H + 1000, fill: o.bg || C.cream }, sg);
    const cam = X.svg('g', { class: 'cam' }, sg);
    const rig = { x: 0, y: 0, s: 1, r: 0, ...(o.rig || {}) };
    const ctx = { name, g: sg, cam, rig, t0, t1, layers: [], shakes: [], punches: [], whips: [], plan: { ...rig }, drift: o.drift || [0, 0, 0.012] };
    ctx.layer = (p = 1) => { const L = X.svg('g', {}, cam); ctx.layers.push([L, p]); return L; };
    ctx.vis = visOf(ctx);
    ctx.blurId = `wb_${name}`;
    const f = X.svg('filter', { id: ctx.blurId, x: '-10%', y: '-10%', width: '120%', height: '120%' }, X.defs);
    ctx.blurEl = X.svg('feGaussianBlur', { stdDeviation: 0 }, f);
    K.shots.push(ctx);
    if (build) build(ctx);
    return ctx;
  };
  K.move = (ctx, t, to, dur = 1.0, ease = 'sine.inOut') => {
    const from = { ...ctx.plan };
    Object.assign(ctx.plan, to);
    X.tl.fromTo(ctx.rig, from, { ...ctx.plan, duration: dur, ease, immediateRender: false }, t);
  };
  K.place = (ctx, st) => { Object.assign(ctx.rig, st); Object.assign(ctx.plan, st); };
  /** whip pan: fast camera move with directional blur (dir 0 = horizontal, 1 = vertical) */
  K.whip = (ctx, t, to, dur = 0.32, o = {}) => {
    K.move(ctx, t, to, dur, o.ease || 'expo.inOut');
    ctx.whips.push({ t, dur, amt: o.blur ?? 38, dir: o.dir || 0 });
    if (o.sfx !== false) X.sfx(t, 'whoosh', { dur: dur + 0.1, gain: 0.32 });
  };
  /** fake orbit: layers with different parallax factors slide by dx while the camera rolls slightly */
  K.orbit = (ctx, t, dx, dur = 0.9, o = {}) => {
    K.move(ctx, t, { x: ctx.plan.x + dx, r: o.r ?? (dx > 0 ? -1.5 : 1.5), ...(o.to || {}) }, dur, o.ease || 'power2.inOut');
    if (o.sfx !== false) X.sfx(t + 0.05, 'woosh_low', { dur: dur, gain: 0.22 });
  };
  K.punch = (ctx, t, k = 1.08, dur = 0.6, hold = false) => ctx.punches.push({ t, k, dur, hold });
  K.shake = (ctx, t, amp = 14, dur = 0.4) => ctx.shakes.push({ t, amp, dur, ph: (t * 7.3) % 6.28 });

  // ------------------------------------------------------------------ the bobble-head puppet
  /* Local units: feet at (0,0), standing height ≈ 1000 (head ≈ 30 % of it). Light from the upper left, one hard
   * violet shade band on the right of every part. spec: {x,y,s, skin, top, topKind, pants, pantsKind, shoes, hair,
   * hairC, body:'round'|'normal'|'slim', stache, beard, glasses, chain, tie, bow, hat, cuffs, face, pose, flip} */
  const MOUTH = {
    flat: 'M-26,0 Q0,4 26,0',
    smile: 'M-34,-6 Q0,30 34,-6',
    grin: 'M-40,-10 Q0,-4 40,-10 Q36,34 0,36 Q-36,34 -40,-10Z',
    smirk: 'M-28,4 Q4,8 30,-12',
    frown: 'M-26,10 Q0,-10 26,10',
    O: 'M-15,-14 Q0,-24 15,-14 Q22,6 12,20 Q0,28 -12,20 Q-22,6 -15,-14Z',
    yell: 'M-32,-12 Q0,-22 32,-12 Q34,30 0,40 Q-34,30 -32,-12Z',
    wavy: 'M-30,2 Q-15,-10 0,2 Q15,14 30,2',
    teeth: 'M-36,-10 Q0,-16 36,-10 Q34,18 0,22 Q-34,18 -36,-10Z',
  };
  const FACES = {
    neutral: { m: 'flat', lid: 0.12, brow: [0, 0], eye: 'open' },
    happy: { m: 'grin', lid: 0, brow: [-8, -6], eye: 'happy' },
    smile: { m: 'smile', lid: 0.1, brow: [-4, -4], eye: 'open' },
    smug: { m: 'smirk', lid: 0.48, brow: [10, -14], eye: 'open' },
    shocked: { m: 'O', lid: 0, brow: [-14, -16], eye: 'wide', sweat: true },
    yell: { m: 'yell', lid: 0, brow: [16, 18], eye: 'open' },
    angry: { m: 'teeth', lid: 0.2, brow: [22, 22], eye: 'open', vein: true },
    tired: { m: 'flat', lid: 0.52, brow: [-10, -10], eye: 'open' },
    sad: { m: 'frown', lid: 0.42, brow: [-16, -16], eye: 'open', sweat: true },
    think: { m: 'flat', lid: 0.18, brow: [12, -10], eye: 'open', lx: 10, ly: -8 },
    blissful: { m: 'smile', lid: 0, brow: [-6, -6], eye: 'happy' },
    worried: { m: 'wavy', lid: 0.15, brow: [-16, -14], eye: 'open', sweat: true },
  };
  K.FACES = FACES;
  /* arm angles: a = outward swing at the shoulder (deg, 0 = hanging), b = elbow bend (negative folds the
   * forearm up/inward), hands: mitt | fist | thumb | point | open */
  /* arm angles: a = outward swing at the shoulder (deg, 0 = hanging, 90 = horizontal out, 180 = straight up),
   * b = a − f where f is the forearm's absolute direction (0 down, 90 out, 180 up, negative = across the body).
   * hands: mitt | fist | thumb | point | open | pinch */
  const PF = (aL, fL, aR, fR, hL, hR) => ({ aL, bL: aL - fL, aR, bR: aR - fR, hL, hR });
  const POSES = (K.POSES = {
    rest: PF(6, -4, 6, -4, 'mitt', 'mitt'),
    hips: PF(46, -42, 46, -42, 'fist', 'fist'),
    thumbs: PF(26, 176, 26, 176, 'thumb', 'thumb'),
    thumbR: PF(6, -4, 26, 176, 'mitt', 'thumb'),
    waveR: PF(6, -4, 128, 168, 'mitt', 'open'),
    swearR: PF(6, -4, 66, 172, 'mitt', 'open'),
    pointUp: PF(6, -4, 162, 172, 'mitt', 'point'),
    pointL: PF(90, 92, 6, -4, 'point', 'mitt'),
    pointR: PF(6, -4, 90, 92, 'mitt', 'point'),
    presentR: PF(6, -4, 52, 96, 'mitt', 'open'),
    cheer: PF(148, 162, 148, 162, 'fist', 'fist'),
    wide: PF(104, 112, 104, 112, 'open', 'open'),
    shrug: PF(44, 128, 44, 128, 'open', 'open'),
    plead: PF(-6, -140, -6, -140, 'fist', 'fist'),
    chin: PF(-8, -90, -60, -180, 'mitt', 'fist'),
    headHands: PF(150, 250, 150, 250, 'open', 'open'),
    lounge: PF(140, 255, 140, 255, 'mitt', 'mitt'),
    surrender: PF(120, 175, 120, 175, 'open', 'open'),
    tiny: PF(6, -4, 34, 168, 'mitt', 'pinch'),
    holdR: PF(6, -4, 14, 70, 'mitt', 'fist'),
    holdBoth: PF(14, 70, 14, 70, 'fist', 'fist'),
    salute: PF(6, -4, 100, 230, 'mitt', 'open'),
    fists: PF(30, 150, 30, 150, 'fist', 'fist'),
    pointFwd: PF(6, -4, 40, 120, 'mitt', 'point'),
    showR: PF(6, -4, 40, 150, 'mitt', 'fist'),
  });
  K.toon = (parent, o = {}) => {
    const skin = o.skin || '#f2c6a2', top = o.top || '#3b5bb5', pants = o.pants || '#3a3f5c', shoes = o.shoes || '#2f2b3a';
    const uid = () => (K._uid = (K._uid || 0) + 1);
    const root = g(parent);
    const st = K.tf(root, { x: o.x || 0, y: o.y || 0, s: o.s || 1, sx: o.flip ? -1 : 1 }, o.vis || null);
    const P = { root, st, o, s: { aL: 6, bL: 10, aR: 6, bR: 10, hr: 0, lid: 0.12, bl: 0, br: 0, lx: 0, ly: 0, turn: 0, walk: 0, bob: 0, legL: 0, legR: 0, squash: 0, hL: 'mitt', hR: 'mitt', m: 'flat', eye: 'open', sweat: 0, vein: 0, lean: 0, sink: 0 } };
    P.plan = { ...P.s };
    const W = o.body === 'round' ? 1.14 : o.body === 'slim' ? 0.9 : 1;
    P.shadow = X.svg('ellipse', { cx: 0, cy: 4, rx: 170 * W, ry: 30, fill: '#2b2235', opacity: 0.17 }, root);
    const body = g(root); P.body = body;
    // ---- legs + shoes (stubby)
    const legL = g(body), legR = g(body); P.legL = legL; P.legR = legR;
    const LX = 62 * W;
    const legD = (x) => `M${x - 54},-334 L${x + 54},-334 L${x + 49},-72 Q${x + 49},-52 ${x + 28},-52 L${x - 30},-52 Q${x - 50},-52 ${x - 50},-72Z`;
    [[legL, -LX], [legR, LX]].forEach(([L, x], i) => {
      sp(L, legD(x), pants, 'cyl');
      if (o.pantsKind === 'tartan' || o.pantsKind === 'stripes') {
        const cp = X.svg('clipPath', { id: `lc${uid()}` }, X.defs); X.svg('path', { d: legD(x) }, cp);
        const tg = g(L, { 'clip-path': `url(#${cp.id})` });
        if (o.pantsKind === 'tartan') {
          for (let yy = -320; yy < -50; yy += 52) X.svg('rect', { x: x - 60, y: yy, width: 120, height: 13, fill: '#3a2440', opacity: 0.5 }, tg);
          for (let xx = x - 44; xx < x + 56; xx += 36) X.svg('rect', { x: xx, y: -340, width: 10, height: 300, fill: '#f6d36a', opacity: 0.55 }, tg);
        } else for (let xx = x - 50; xx < x + 56; xx += 28) X.svg('rect', { x: xx, y: -340, width: 13, height: 300, fill: '#fffdf6', opacity: 0.85 }, tg);
        X.svg('rect', { x: x + 14, y: -340, width: 50, height: 300, fill: K.shade(pants, 0.9), opacity: 0.35 }, tg);
        X.svg('path', { d: legD(x), fill: 'none', ...OUT }, L);
      }
      if (o.shoeKind === 'slipper') sp(L, `M${x - 62},-36 Q${x - 64},-78 ${x - 6},-78 Q${x + 60},-78 ${x + 64},-36 Q${x + 62},-6 ${x},-6 Q${x - 62},-6 ${x - 62},-36Z`, shoes, 'cyl');
      else se(L, x + (i ? 8 : -8), -34, 66, 40, shoes, 'sphere');
    });
    // ---- torso
    const torso = g(body); P.torso = torso;
    const tw = 150 * W, bulge = o.body === 'round' ? 62 : 14;
    const torsoD = `M${-tw},-560 Q${-tw},-630 ${-tw + 68},-630 L${tw - 68},-630 Q${tw},-630 ${tw},-560 Q${tw + bulge},-430 ${tw - 22},-338 Q${tw - 34},-306 ${tw - 74},-306 L${-tw + 74},-306 Q${-tw + 34},-306 ${-tw + 22},-338 Q${-tw - bulge},-430 ${-tw},-560Z`;
    sp(torso, torsoD, top, 'cyl');
    const tk = o.topKind || 'tee';
    if (tk === 'suit' || tk === 'tweed') {
      sp(torso, 'M-54,-630 L0,-520 L54,-630Z', '#fffdf6', 'flat');
      if (o.tie !== false && !o.bow) sp(torso, 'M-15,-606 L15,-606 L24,-470 L0,-440 L-24,-470Z', o.tie || '#c9303c', 'cyl');
      if (o.bow) sp(torso, 'M-50,-622 L-4,-604 L-50,-586Z M50,-622 L4,-604 L50,-586Z', o.bow, 'flat');
      sp(torso, 'M-56,-632 L-6,-510 L-44,-470 L-76,-566Z', K.light(top, 0.08), 'flat');
      sp(torso, 'M56,-632 L6,-510 L44,-470 L76,-566Z', K.shade(top, 0.75), 'flat');
      X.svg('path', { d: 'M0,-508 L0,-318', ...OUT, 'stroke-width': 3 }, torso);
      [-440, -385].forEach((yy) => X.svg('circle', { cx: 12, cy: yy, r: 7, fill: C.ink }, torso));
      if (tk === 'tweed') { const r = X.rand(9); for (let i = 0; i < 30; i++) X.svg('path', { d: `M${-120 + r() * 240},${-610 + r() * 290} l10,8`, stroke: '#4f3524', 'stroke-width': 3, opacity: 0.4 }, torso); }
    } else if (tk === 'hoodie') {
      sp(torso, 'M-84,-634 Q0,-560 84,-634 Q64,-604 0,-592 Q-64,-604 -84,-634Z', K.shade(top, 0.5), 'flat');
      X.svg('path', { d: 'M-30,-600 Q-36,-548 -26,-500 M30,-600 Q36,-548 28,-500', fill: 'none', stroke: '#fffdf6', 'stroke-width': 8, 'stroke-linecap': 'round' }, torso);
      sp(torso, 'M-86,-430 L86,-430 L96,-352 L-96,-352Z', K.shade(top, 0.22), 'flat', { 'stroke-width': 3 });
    } else if (tk === 'vest') {
      sp(torso, `M${-tw + 6},-560 L-34,-632 L-34,-312 L${-tw + 26},-312Z`, C.hivis, 'flat');
      sp(torso, `M${tw - 6},-560 L34,-632 L34,-312 L${tw - 26},-312Z`, K.shade(C.hivis, 0.4), 'flat');
      X.svg('rect', { x: -tw + 16, y: -452, width: tw - 50, height: 24, fill: '#e8edf5', stroke: C.ink, 'stroke-width': 2.5, 'vector-effect': 'non-scaling-stroke' }, torso);
      X.svg('rect', { x: 34, y: -452, width: tw - 50, height: 24, fill: '#cdd4e4', stroke: C.ink, 'stroke-width': 2.5, 'vector-effect': 'non-scaling-stroke' }, torso);
    } else if (tk === 'dress') {
      sp(torso, `M${-tw + 10},-450 L${tw - 10},-450 L${tw + 30},-300 L${-tw - 30},-300Z`, top, 'cyl');
    } else if (tk === 'cardigan') {
      sp(torso, 'M-40,-632 L0,-560 L40,-632 L40,-306 L-40,-306Z', o.inner || '#f3efe6', 'flat');
      [-520, -450, -380].forEach((yy) => X.svg('circle', { cx: 52, cy: yy, r: 8, fill: '#f3e3b0', stroke: C.ink, 'stroke-width': 2 }, torso));
    } else {
      X.svg('path', { d: 'M-48,-630 Q0,-590 48,-630', fill: 'none', ...OUT, 'stroke-width': 3.5 }, torso);
    }
    if (o.chain) {
      X.svg('path', { d: 'M-94,-626 Q-62,-510 0,-494 Q62,-510 94,-626', fill: 'none', stroke: '#e3b23c', 'stroke-width': 12, 'stroke-dasharray': '2 13', 'stroke-linecap': 'round' }, torso);
      se(torso, 0, -478, 32, 32, '#f0c24a', 'sphere');
      X.svg('path', { d: 'M0,-494 v30 M-11,-476 h22 M-9,-466 q9,10 18,0', stroke: '#a8771f', 'stroke-width': 4, fill: 'none' }, torso);
    }
    // ---- arms (two segments + swappable hands)
    const arm = (side) => {
      const sh = g(body, { transform: `translate(${side * (tw - 22)} -592)` });
      const upper = g(sh), fore = g(upper, { transform: 'translate(0 124)' });
      sp(upper, 'M-37,-4 Q-37,-40 0,-40 Q37,-40 37,-4 L33,126 Q33,146 0,146 Q-33,146 -33,126Z', top, 'cyl');
      sp(fore, 'M-33,-14 L33,-14 L30,104 Q30,124 0,124 Q-30,124 -30,104Z', top, 'cyl');
      if (o.cuffs) sr(fore, -32, 92, 64, 26, '#fffdf6', 'flat', 6, { 'stroke-width': 3.5 });
      const hand = g(fore, { transform: 'translate(0 134)' });
      const H = {};
      H.mitt = g(hand); sp(H.mitt, 'M-35,-12 Q-42,38 -6,48 Q32,52 35,8 Q37,-20 0,-22 Q-31,-22 -35,-12Z', skin, 'cyl'); X.svg('path', { d: `M${side * 22},-2 Q${side * 48},8 ${side * 34},30`, fill: 'none', ...OUT, 'stroke-width': 3.5 }, H.mitt);
      H.fist = g(hand); se(H.fist, 0, 8, 39, 37, skin, 'sphere'); X.svg('path', { d: 'M-18,22 q8,10 16,0 m2,0 q8,10 16,0', fill: 'none', ...OUT, 'stroke-width': 3 }, H.fist);
      H.thumb = g(hand); se(H.thumb, 0, 4, 41, 39, skin, 'sphere'); sp(H.thumb, `M${-side * 16},16 Q${-side * 22},70 ${-side * 4},76 Q${side * 18},78 ${side * 18},16Z`, skin, 'sphere'); X.svg('path', { d: 'M-22,-10 q10,8 20,0 m2,0 q10,8 20,0', fill: 'none', ...OUT, 'stroke-width': 3 }, H.thumb);
      H.point = g(hand); se(H.point, 0, 4, 37, 35, skin, 'sphere'); sp(H.point, 'M-11,20 L-9,94 Q0,106 9,94 L11,20Z', skin, 'cyl');
      H.open = g(hand); sp(H.open, 'M-36,-10 Q-40,30 -30,44 L-34,86 Q-30,98 -20,88 L-14,56 L-12,98 Q-2,110 6,98 L6,58 L12,96 Q22,104 26,92 L24,50 L32,76 Q42,82 42,68 L36,20 Q36,-18 0,-20 Q-32,-20 -36,-10Z', skin, 'cyl');
      H.pinch = g(hand); se(H.pinch, 0, 6, 37, 35, skin, 'sphere'); sp(H.pinch, 'M-14,22 Q-22,70 -8,84 Q4,86 4,70 L6,24Z', skin, 'cyl'); sp(H.pinch, 'M10,22 Q30,64 18,82 Q8,88 4,72Z', skin, 'cyl');
      P[`slot${side < 0 ? 'L' : 'R'}`] = g(hand);           // things held in this hand go here (hand-local)
      return { sh, upper, fore, hand, H, side };
    };
    P.armL = arm(-1); P.armR = arm(1);
    // ---- head (designed at HY = -790, R = 150; scaled by o.headScale about the neck)
    const HS = o.headScale || 1.12, HY = -790;
    const headWrap = g(body), head = g(headWrap); P.head = head;
    sr(head, -36, -668, 72, 64, skin, 'cyl', 18);
    se(head, -146, HY + 12, 26, 36, skin, 'sphere'); se(head, 146, HY + 12, 26, 36, skin, 'sphere');
    se(head, 0, HY, o.headW || 141, 150, skin, 'sphere');
    X.svg('ellipse', { cx: -52, cy: HY - 78, rx: 46, ry: 26, fill: '#ffffff', opacity: 0.18, transform: `rotate(-24 -52 ${HY - 78})` }, head);
    if (o.cheeks !== false) { X.svg('ellipse', { cx: -76, cy: HY + 52, rx: 26, ry: 14, fill: '#e9837a', opacity: 0.32 }, head); X.svg('ellipse', { cx: 76, cy: HY + 52, rx: 26, ry: 14, fill: '#e9837a', opacity: 0.28 }, head); }
    if (o.stubble) X.svg('path', { d: `M-124,${HY + 36} Q-112,${HY + 142} 0,${HY + 150} Q112,${HY + 142} 124,${HY + 36} Q60,${HY + 96} 0,${HY + 98} Q-60,${HY + 96} -124,${HY + 36}Z`, fill: '#5d4a5a', opacity: 0.2 }, head);
    const face = g(head); P.face_ = face;
    const eyes = [];
    [-1, 1].forEach((sd) => {
      const ex = sd * 54, ey = HY - 8;
      const eg = g(face), ballG = g(eg);
      const cpid = `ec${uid()}`;
      const cp = X.svg('clipPath', { id: cpid }, X.defs); X.svg('ellipse', { cx: ex, cy: ey, rx: 32, ry: 40 }, cp);
      const ball = X.svg('ellipse', { cx: ex, cy: ey, rx: 32, ry: 40, fill: '#fffefa' }, ballG);
      const inner = g(ballG, { 'clip-path': `url(#${cpid})` });
      const pup = X.svg('circle', { cx: ex, cy: ey + 4, r: 12, fill: '#1d1826' }, inner);
      const lid = X.svg('rect', { x: ex - 36, y: ey - 46, width: 72, height: 0, fill: K.light(skin, 0.04) }, inner);
      const lidLine = X.svg('path', { d: '', ...OUT, 'stroke-width': 4.5, fill: 'none', opacity: 0 }, ballG);
      X.svg('ellipse', { cx: ex, cy: ey, rx: 32, ry: 40, fill: 'none', ...OUT }, ballG);
      const happy = X.svg('path', { d: `M${ex - 27},${ey + 8} Q${ex},${ey - 28} ${ex + 27},${ey + 8}`, fill: 'none', ...OUT, 'stroke-width': 7, opacity: 0 }, face);
      const shut = X.svg('path', { d: `M${ex - 28},${ey + 4} Q${ex},${ey + 22} ${ex + 28},${ey + 4}`, fill: 'none', ...OUT, 'stroke-width': 7, opacity: 0 }, face);
      const brow = X.svg('path', { d: `M${ex - 32},${ey - 60} Q${ex},${ey - 74} ${ex + 32},${ey - 60}`, fill: 'none', stroke: o.browC || mix(o.hairC || '#4a3428', '#000000', 0.2), 'stroke-width': o.browW || 14, 'stroke-linecap': 'round' }, face);
      eyes.push({ ballG, ball, pup, lid, lidLine, happy, shut, brow, ex, ey, sd, _v: null });
    });
    P.eyes = eyes;
    X.svg('path', { d: `M-4,${HY + 18} Q18,${HY + 34} 2,${HY + 48}`, fill: 'none', ...OUT, 'stroke-width': 4 }, face);
    const mouthG = g(face, { transform: `translate(0 ${HY + 92})` });
    P.mouths = {};
    for (const [k, d] of Object.entries(MOUTH)) {
      const closed = !d.endsWith('Z');
      P.mouths[k] = X.svg('path', { d, fill: closed ? 'none' : '#6e2a3a', ...OUT, 'stroke-width': closed ? 6 : 4.5, opacity: k === 'flat' ? 1 : 0 }, mouthG);
    }
    P.sweat = X.svg('path', { d: `M116,${HY - 74} Q142,${HY - 34} 132,${HY - 18} Q116,${HY - 8} 106,${HY - 26} Q104,${HY - 44} 116,${HY - 74}Z`, fill: '#9fd8f6', ...OUT, 'stroke-width': 3, opacity: 0 }, face);
    P.vein = X.svg('path', { d: `M-96,${HY - 96} l14,14 m6,-20 l-8,24 m12,-10 l-24,0`, fill: 'none', stroke: '#d8323c', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, face);
    if (o.stache === 'walrus') sp(face, `M-108,${HY + 66} Q-72,${HY + 18} -4,${HY + 40} Q4,${HY + 30} 4,${HY + 40} Q72,${HY + 18} 108,${HY + 66} Q116,${HY + 116} 72,${HY + 106} Q36,${HY + 80} 0,${HY + 90} Q-36,${HY + 80} -72,${HY + 106} Q-116,${HY + 116} -108,${HY + 66}Z`, o.stacheC || '#f3efe6', 'cyl');
    else if (o.stache === 'short') sp(face, `M-52,${HY + 68} Q0,${HY + 44} 52,${HY + 68} Q30,${HY + 80} 0,${HY + 72} Q-30,${HY + 80} -52,${HY + 68}Z`, o.hairC || '#3a2a24', 'flat');
    if (o.beard) sp(face, `M-132,${HY + 26} Q-124,${HY + 196} 0,${HY + 206} Q124,${HY + 196} 132,${HY + 26} Q92,${HY + 124} 40,${HY + 124} Q0,${HY + 104} -40,${HY + 124} Q-92,${HY + 124} -132,${HY + 26}Z`, o.hairC || '#5a3d2a', 'cyl');
    if (o.glasses) {
      [-54, 54].forEach((ex) => X.svg('circle', { cx: ex, cy: HY - 8, r: 46, fill: '#dff1fb', 'fill-opacity': 0.22, stroke: o.glasses, 'stroke-width': 7, 'vector-effect': 'non-scaling-stroke' }, face));
      X.svg('path', { d: `M-8,${HY - 14} Q0,${HY - 22} 8,${HY - 14}`, fill: 'none', stroke: o.glasses, 'stroke-width': 7 }, face);
    }
    if (o.shades) {
      [-54, 54].forEach((ex) => { sr(face, ex - 44, HY - 40, 88, 64, '#1d1826', 'flat', 24); X.svg('path', { d: `M${ex - 26},${HY - 26} L${ex - 6},${HY - 32}`, stroke: '#8c86a6', 'stroke-width': 6, 'stroke-linecap': 'round' }, face); });
      X.svg('path', { d: `M-12,${HY - 16} Q0,${HY - 24} 12,${HY - 16}`, fill: 'none', stroke: '#1d1826', 'stroke-width': 8 }, face);
    }
    const hc = o.hairC || '#4a3428', hy = HY;
    const hairs = {
      messy: `M-150,${hy - 10} Q-172,${hy - 90} -122,${hy - 122} Q-132,${hy - 174} -70,${hy - 162} Q-60,${hy - 214} -10,${hy - 182} Q20,${hy - 226} 62,${hy - 180} Q112,${hy - 204} 118,${hy - 142} Q172,${hy - 132} 156,${hy - 60} Q172,${hy - 20} 148,${hy + 4} Q132,${hy - 70} 70,${hy - 96} Q20,${hy - 70} -30,${hy - 100} Q-90,${hy - 80} -116,${hy - 50} Q-130,${hy - 20} -150,${hy - 10}Z`,
      mayor: `M-144,${hy - 20} Q-164,${hy - 62} -130,${hy - 82} Q-112,${hy - 50} -124,${hy - 4}Z M144,${hy - 20} Q164,${hy - 62} 130,${hy - 82} Q112,${hy - 50} 124,${hy - 4}Z`,
      tufts: `M-138,${hy + 6} Q-194,${hy - 40} -152,${hy - 94} Q-170,${hy - 144} -110,${hy - 134} Q-100,${hy - 70} -122,${hy - 20}Z M138,${hy + 6} Q194,${hy - 40} 152,${hy - 94} Q170,${hy - 144} 110,${hy - 134} Q100,${hy - 70} 122,${hy - 20}Z`,
      bob: `M-162,${hy + 72} Q-186,${hy - 152} 0,${hy - 170} Q186,${hy - 152} 162,${hy + 72} Q152,${hy + 98} 122,${hy + 82} Q132,${hy - 60} 40,${hy - 102} Q-60,${hy - 40} -120,${hy - 40} Q-124,${hy + 40} -122,${hy + 82} Q-152,${hy + 98} -162,${hy + 72}Z`,
      bun: `M-152,${hy - 10} Q-162,${hy - 152} 0,${hy - 162} Q162,${hy - 152} 152,${hy - 10} Q122,${hy - 98} 0,${hy - 106} Q-122,${hy - 98} -152,${hy - 10}Z M-48,${hy - 152} Q-58,${hy - 240} 0,${hy - 244} Q58,${hy - 240} 48,${hy - 152}Z`,
      afro: `M-170,${hy - 10} Q-224,${hy - 122} -152,${hy - 192} Q-112,${hy - 264} -10,${hy - 250} Q92,${hy - 274} 152,${hy - 198} Q230,${hy - 122} 170,${hy - 10} Q142,${hy - 102} 0,${hy - 112} Q-142,${hy - 102} -170,${hy - 10}Z`,
      short: `M-148,${hy - 20} Q-152,${hy - 154} 0,${hy - 162} Q152,${hy - 154} 148,${hy - 20} Q132,${hy - 88} 40,${hy - 102} Q-40,${hy - 82} -122,${hy - 94} Q-140,${hy - 60} -148,${hy - 20}Z`,
      quiff: `M-148,${hy - 10} Q-162,${hy - 152} -40,${hy - 170} Q20,${hy - 224} 122,${hy - 182} Q172,${hy - 142} 150,${hy - 10} Q132,${hy - 98} 40,${hy - 114} Q-60,${hy - 100} -148,${hy - 10}Z`,
      curlers: `M-152,${hy - 10} Q-162,${hy - 152} 0,${hy - 162} Q162,${hy - 152} 152,${hy - 10} Q122,${hy - 98} 0,${hy - 106} Q-122,${hy - 98} -152,${hy - 10}Z`,
    };
    if (o.hair && hairs[o.hair]) sp(head, hairs[o.hair], hc, o.hair === 'mayor' || o.hair === 'tufts' ? 'cyl' : 'side');
    if (o.hair === 'mayor') X.svg('path', { d: `M-20,${hy - 146} Q-6,${hy - 198} 30,${hy - 186} Q52,${hy - 172} 34,${hy - 154} Q18,${hy - 144} 12,${hy - 162}`, fill: 'none', stroke: '#e9e4da', 'stroke-width': 11, 'stroke-linecap': 'round' }, head);
    if (o.hair === 'curlers') [-90, -30, 30, 90].forEach((cx, i) => sr(head, cx - 24, hy - 168 + Math.abs(cx) * 0.35, 48, 34, ['#f28fb0', '#8fd0f2', '#f2d38f', '#a8e29a'][i], 'cyl', 14));
    P.props = {};
    const hard = g(head, { opacity: o.hat === 'hard' ? 1 : 0 });
    sp(hard, `M-152,${hy - 70} Q-152,${hy - 232} 0,${hy - 238} Q152,${hy - 232} 152,${hy - 70}Z`, C.hard, 'sphere');
    sp(hard, `M-178,${hy - 76} L178,${hy - 76} Q182,${hy - 50} 162,${hy - 50} L-162,${hy - 50} Q-182,${hy - 50} -178,${hy - 76}Z`, C.hard, 'cyl');
    sp(hard, `M-20,${hy - 236} L20,${hy - 236} L22,${hy - 74} L-22,${hy - 74}Z`, K.light(C.hard, 0.3), 'flat', { 'stroke-width': 3 });
    P.props.hard = hard;
    const halo = g(head, { opacity: 0 });
    X.svg('ellipse', { cx: 0, cy: hy - 222, rx: 122, ry: 30, fill: 'none', stroke: '#fff3a8', 'stroke-width': 28, opacity: 0.55, filter: K.F.soft12 }, halo);
    X.svg('ellipse', { cx: 0, cy: hy - 222, rx: 112, ry: 26, fill: 'none', stroke: '#f6cf3e', 'stroke-width': 15 }, halo);
    X.svg('ellipse', { cx: 0, cy: hy - 225, rx: 108, ry: 24, fill: 'none', stroke: '#fff7cf', 'stroke-width': 4 }, halo);
    P.props.halo = halo;
    if (o.party) { const hatG = g(head); sp(hatG, `M-60,${hy - 130} L0,${hy - 290} L60,${hy - 130}Z`, o.party, 'side'); se(hatG, 0, hy - 292, 16, 16, '#fff3a8', 'sphere'); }
    body.appendChild(P.armL.sh); body.appendChild(P.armR.sh);   // hands read in front of the face (chin, cheeks)
    // ---- API
    const tw2 = (vals, t, dur, ease) => { const from = {}; for (const k in vals) from[k] = P.plan[k]; Object.assign(P.plan, vals); X.tl.fromTo(P.s, from, { ...vals, duration: dur, ease, immediateRender: false }, t); };
    P.face = (t, name, dur = 0.12) => {
      const f = FACES[name] || FACES.neutral;
      X.tl.set(P.s, { m: f.m, eye: f.eye, sweat: f.sweat ? 1 : 0, vein: f.vein ? 1 : 0 }, t);
      tw2({ lid: f.lid, bl: f.brow[0], br: f.brow[1], lx: f.lx || 0, ly: f.ly || 0 }, t, dur, 'power2.out');
    };
    P.look = (t, lx, ly = 0, dur = 0.15) => tw2({ lx, ly }, t, dur, 'power2.out');
    P.pose = (t, name, dur = 0.28, ease = 'back.out(1.5)') => {
      const p = POSES[name] || POSES.rest;
      tw2({ aL: p.aL, bL: p.bL, aR: p.aR, bR: p.bR }, t, dur, ease);
      X.tl.set(P.s, { hL: p.hL, hR: p.hR }, t + dur * 0.35);
    };
    P.set = (t, vals, dur = 0.3, ease = 'power2.inOut') => tw2(vals, t, dur, ease);
    P.turn = (t, v, dur = 0.22) => tw2({ turn: v }, t, dur, 'power2.out');
    P.moveTo = (t, to, dur = 0.6, ease = 'power2.inOut') => K.to(st, t, to, dur, ease);
    P.walk = (t0, t1, to, ease = 'sine.inOut') => { K.to(st, t0, to, t1 - t0, ease); tw2({ walk: 1 }, t0, 0.1, 'none'); tw2({ walk: 0 }, t1 - 0.1, 0.1, 'none'); };
    P.hop = (t, h = 60) => { X.tl.fromTo(P.s, { bob: 0 }, { bob: -h, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, t); };
    P.prop = (t, name, on, pop = true) => {
      const el = P.props[name]; if (!el) return;
      X.tl.set(el, { attr: { opacity: on ? 1 : 0 } }, t);
      if (pop && on) X.tl.fromTo(el, { scale: 1.3, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, t);
    };
    if (o.pose) { const p = POSES[o.pose]; Object.assign(P.s, { aL: p.aL, bL: p.bL, aR: p.aR, bR: p.bR, hL: p.hL, hR: p.hR }); Object.assign(P.plan, { aL: p.aL, bL: p.bL, aR: p.aR, bR: p.bR }); }
    if (o.face) { const f = FACES[o.face]; Object.assign(P.s, { lid: f.lid, bl: f.brow[0], br: f.brow[1], m: f.m, eye: f.eye, lx: f.lx || 0, ly: f.ly || 0, sweat: f.sweat ? 1 : 0, vein: f.vein ? 1 : 0 }); Object.assign(P.plan, { lid: f.lid, bl: f.brow[0], br: f.brow[1], lx: f.lx || 0, ly: f.ly || 0 }); }
    // ---- per frame: idle breathing + sway, blink, limbs, face
    const ph = (o.x || 0) * 0.013 + (o.seed || 0);
    let lastM = null, lastHL = null, lastHR = null, lastE = null;
    const showHand = (A, k) => { for (const [n, el] of Object.entries(A.H)) el.setAttribute('opacity', n === k ? 1 : 0); };
    K.hook((t) => {
      const s = P.s;
      const breathe = Math.sin(t * 2.4 + ph) * 0.009, sway = Math.sin(t * 1.3 + ph) * 1.3 * (o.idle ?? 1);
      const wk = s.walk, wph = t * 10 + ph;
      const bob = s.bob + s.sink + (wk ? -Math.abs(Math.sin(wph)) * 24 * wk : 0) + Math.sin(t * 2.4 + ph) * 3 * (o.idle ?? 1);
      body.setAttribute('transform', `translate(0 ${f2(bob)}) rotate(${f2(sway * 0.4 + s.lean)} 0 -300) translate(0 -300) scale(${f2(1 + s.squash * 0.12)} ${(1 + breathe - s.squash * 0.12).toFixed(4)}) translate(0 300)`);
      legL.setAttribute('transform', `rotate(${f2(s.legL + Math.sin(wph) * 24 * wk)} ${-LX} -330)`);
      legR.setAttribute('transform', `rotate(${f2(s.legR - Math.sin(wph) * 24 * wk)} ${LX} -330)`);
      const swg = wk ? Math.sin(wph) * 16 * wk : 0;
      P.armL.upper.setAttribute('transform', `rotate(${f2(s.aL + swg + Math.sin(t * 1.9 + ph) * 1.6)})`);
      P.armL.fore.setAttribute('transform', `translate(0 124) rotate(${f2(-s.bL)})`);
      P.armR.upper.setAttribute('transform', `rotate(${f2(-s.aR + swg - Math.sin(t * 1.9 + ph + 1) * 1.6)})`);
      P.armR.fore.setAttribute('transform', `translate(0 124) rotate(${f2(s.bR)})`);
      headWrap.setAttribute('transform', `rotate(${f2(s.hr + sway)} 0 -640) translate(0 -640) scale(${HS}) translate(0 640)`);
      face.setAttribute('transform', `translate(${f2(s.turn * 46)} 0)`);
      if (s.hL !== lastHL) { showHand(P.armL, s.hL); lastHL = s.hL; }
      if (s.hR !== lastHR) { showHand(P.armR, s.hR); lastHR = s.hR; }
      if (s.m !== lastM) { if (lastM) P.mouths[lastM].setAttribute('opacity', 0); else for (const el of Object.values(P.mouths)) el.setAttribute('opacity', 0); P.mouths[s.m].setAttribute('opacity', 1); lastM = s.m; }
      const cyc = (t + ph * 3 + 10) % 3.3, blink = cyc < 0.1 ? 1 : 0;
      const lid = Math.min(1, Math.max(s.lid, blink));
      const happy = s.eye === 'happy', wide = s.eye === 'wide' ? 1.18 : 1;
      for (const e of eyes) {
        const closed = !happy && lid >= 0.97, v = happy ? 'h' : closed ? 'c' : 'o';
        if (v !== e._v) { e.ballG.setAttribute('opacity', v === 'o' ? 1 : 0); e.happy.setAttribute('opacity', v === 'h' ? 1 : 0); e.shut.setAttribute('opacity', v === 'c' ? 1 : 0); e._v = v; }
        if (s.eye !== lastE) e.ballG.setAttribute('transform', wide !== 1 ? `translate(${e.ex} ${e.ey}) scale(${wide}) translate(${-e.ex} ${-e.ey})` : '');
        e.pup.setAttribute('cx', f2(e.ex + s.lx * 1.2 + s.turn * 8)); e.pup.setAttribute('cy', f2(e.ey + 4 + s.ly * 1.2));
        e.lid.setAttribute('height', f2(lid * 86));
        const ly = e.ey - 42 + lid * 82;
        e.lidLine.setAttribute('d', `M${e.ex - 33},${f2(ly + 4)} Q${e.ex},${f2(ly - 2)} ${e.ex + 33},${f2(ly + 4)}`);
        e.lidLine.setAttribute('opacity', lid > 0.06 && lid < 0.97 ? 1 : 0);
        const b = e.sd < 0 ? s.bl : s.br;
        e.brow.setAttribute('transform', `translate(0 ${f2(b < 0 ? b * 0.5 : 0)}) rotate(${f2(e.sd < 0 ? b : -b)} ${e.ex} ${e.ey - 64})`);
      }
      lastE = s.eye;
      P.sweat.setAttribute('opacity', s.sweat); P.vein.setAttribute('opacity', s.vein);
    }, o.vis || null);
    return P;
  };

  // ================================================================== FX
  /** white flash frame: full peak for one frame, then a short fade (source: 1 f at ~85 %, 4–5 f recovery) */
  K.flash = (t, peak = 0.85, fade = 0.17) => {
    X.tl.set(K.flashRect, { attr: { opacity: peak } }, t);
    X.tl.fromTo(K.flashRect, { attr: { opacity: peak } }, { attr: { opacity: 0 }, duration: fade, ease: 'power2.in', immediateRender: false }, t + 1 / 30);
  };
  const star4 = (s) => `M0,${-s} Q${s * 0.16},${-s * 0.16} ${s},0 Q${s * 0.16},${s * 0.16} 0,${s} Q${-s * 0.16},${s * 0.16} ${-s},0 Q${-s * 0.16},${-s * 0.16} 0,${-s}Z`;
  /** 4-point twinkles that pop, spin and fade — the "gleam" on a prized object */
  K.sparkles = (parent, pts, t, dur = 0.9, o = {}) => {
    pts.forEach(([x, y, s], i) => {
      const gg = g(parent, { transform: `translate(${x} ${y})` });
      const el = X.svg('path', { d: star4(s || 40), fill: o.color || '#ffffff', stroke: o.stroke || '#fff6c8', 'stroke-width': 2 }, gg);
      const t0 = t + i * (o.stagger ?? 0.07);
      gsap.set(el, { scale: 0, transformOrigin: '50% 50%' });
      X.tl.fromTo(el, { scale: 0, rotation: -30 }, { scale: 1, rotation: 15, duration: dur * 0.35, ease: 'back.out(3)', immediateRender: false }, t0);
      X.tl.to(el, { scale: 0, rotation: 60, duration: dur * 0.4, ease: 'power2.in' }, t0 + dur * 0.55);
    });
    if (o.sfx !== false) X.sfx(t, 'sparkle', { dur: 0.6, gain: 0.3 });
  };
  /** comic starburst (impact / "boom" flash), yellow + white, 0.35 s */
  K.burst = (parent, x, y, r, t, o = {}) => {
    const gg = g(parent, { transform: `translate(${x} ${y})` });
    const n = o.n || 14, rr = X.rand(o.seed || 3);
    const pts = (R, k) => Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2, rad = i % 2 ? R * (0.42 + rr() * 0.12) : R * (0.85 + rr() * 0.3) * k; return `${f2(Math.cos(a) * rad)},${f2(Math.sin(a) * rad)}`; }).join(' ');
    const outer = X.svg('polygon', { points: pts(r, 1), fill: o.color || '#f9d84a', stroke: o.stroke || '#fff3b0', 'stroke-width': 4 }, gg);
    const inner = X.svg('polygon', { points: pts(r * 0.62, 1), fill: '#fffdf2' }, gg);
    [outer, inner].forEach((el) => gsap.set(el, { scale: 0, transformOrigin: '50% 50%' }));
    const d = o.dur || 0.38;
    X.tl.fromTo(outer, { scale: 0.1, rotation: 0 }, { scale: 1.1, rotation: 12, duration: d * 0.35, ease: 'expo.out', immediateRender: false }, t);
    X.tl.fromTo(inner, { scale: 0.1 }, { scale: 1.05, duration: d * 0.3, ease: 'expo.out', immediateRender: false }, t + 0.02);
    X.tl.to([outer, inner], { scale: 0, duration: d * 0.5, ease: 'power2.in' }, t + d * 0.5);
    if (o.sfx !== false) X.sfx(t, o.sfx || 'impact', { gain: o.gain ?? 0.45, dur: 0.6 });
    return gg;
  };
  /** dust puff: cream/grey balls expanding outward and fading */
  K.puff = (parent, x, y, t, o = {}) => {
    const n = o.n || 7, R = o.r || 70, rr = X.rand(o.seed || 11);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI * (o.full ? 2 : 1) + (rr() - 0.5) * 0.4;
      const el = se(parent, x, y, R * (0.34 + rr() * 0.3), R * (0.3 + rr() * 0.26), o.color || '#f3ece0', 'sphere', { 'stroke-width': 3 });
      gsap.set(el, { scale: 0, transformOrigin: '50% 50%', opacity: 1 });
      const dx = Math.cos(a) * R * (1.2 + rr()), dy = Math.sin(a) * R * (0.7 + rr() * 0.5) - R * 0.3;
      X.tl.fromTo(el, { scale: 0.2, x: 0, y: 0, opacity: 1 }, { scale: 1, x: dx, y: dy, duration: 0.35, ease: 'power3.out', immediateRender: false }, t + i * 0.015);
      X.tl.to(el, { scale: 0.4, opacity: 0, y: dy - R * 0.6, duration: 0.3, ease: 'power1.in' }, t + 0.25 + i * 0.015);
    }
    if (o.sfx) X.sfx(t, o.sfx, { gain: 0.35 });
  };
  /** water splash out of a pothole: droplets on parabolas + a crown ring */
  K.splash = (parent, x, y, t, o = {}) => {
    const n = o.n || 12, R = o.r || 90, rr = X.rand(o.seed || 17);
    const crown = X.svg('ellipse', { cx: x, cy: y, rx: R * 0.6, ry: R * 0.18, fill: 'none', stroke: '#e6f2fc', 'stroke-width': 8, opacity: 0 }, parent);
    X.tl.fromTo(crown, { attr: { rx: R * 0.3, ry: R * 0.1, opacity: 1 } }, { attr: { rx: R * 1.3, ry: R * 0.34, opacity: 0 }, duration: 0.45, ease: 'power2.out', immediateRender: false }, t);
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.08 + 0.84 * (i / (n - 1))) + (rr() - 0.5) * 0.2, v = R * (2.2 + rr() * 1.6), sz = 9 + rr() * 12;
      const d = X.svg('path', { d: `M0,${-sz * 1.5} Q${sz},0 0,${sz} Q${-sz},0 0,${-sz * 1.5}Z`, fill: '#cfe5f8', stroke: '#2b2235', 'stroke-width': 2.5, opacity: 0 }, parent);
      const st = K.tf(d, { x, y, o: 0 });
      const dur = 0.5 + rr() * 0.2, vx = Math.cos(a) * v, vy = Math.sin(a) * v;
      const prog = { p: 0 };
      X.tl.fromTo(prog, { p: 0 }, { p: 1, duration: dur, ease: 'none', immediateRender: false, onUpdate: () => { const q = prog.p; st.x = x + vx * q; st.y = y + vy * q + 900 * q * q * dur; st.o = q < 0.85 ? 1 : (1 - q) / 0.15; st.r = Math.atan2(vy + 1800 * q * dur, vx) * 57.3 + 90; } }, t + i * 0.01);
      X.tl.set(st, { o: 0 }, t + dur + i * 0.01 + 0.02);
    }
    if (o.sfx !== false) X.sfx(t, o.sfx || 'thud', { gain: 0.35 });
  };
  /** falling confetti (pure function of t) */
  K.confetti = (parent, t0, t1, o = {}) => {
    const n = o.n || 70, rr = X.rand(o.seed || 21), cols = o.colors || ['#d8473c', '#f6cf3e', '#3360cc', '#fffdf6', '#5fae55', '#f28fb0'];
    const gg = g(parent, { opacity: 0 });
    X.tl.set(gg, { attr: { opacity: 1 } }, t0); X.tl.set(gg, { attr: { opacity: 0 } }, t1);
    const span = X.H + 500;
    const ps = Array.from({ length: n }, () => ({ x: (o.x0 ?? -100) + rr() * (o.w ?? 1280), y0: o.pre === false ? -200 - rr() * 900 : rr() * span, v: 380 + rr() * 380, sw: 20 + rr() * 50, ph: rr() * 6, sp: 4 + rr() * 8, el: X.svg('rect', { x: -10, y: -6, width: 20, height: 12, fill: cols[Math.floor(rr() * cols.length)] }, gg) }));
    K.hook((t) => { const d = t - t0; for (const p of ps) { const y = o.pre === false ? p.y0 + d * p.v : ((p.y0 + d * p.v) % span) - 250; p.el.setAttribute('transform', `translate(${f2(p.x + Math.sin(d * 3 + p.ph) * p.sw)} ${f2(y)}) rotate(${f2(d * p.sp * 50 + p.ph * 40)}) scale(1 ${f2(Math.cos(d * p.sp + p.ph))})`); } }, (t) => t >= t0 && t <= t1);
    return gg;
  };
  /** Counter text driven by segments: set · slot (scramble every frame, lands) · roll (mechanical count) · exp */
  K.counter = (el, initial, fmt = (v) => String(Math.round(v))) => {
    const segs = [{ t0: -1, kind: 'set', text: initial }];
    const c = { el, fmt, segs };
    c.set = (t, text) => { segs.push({ t0: t, kind: 'set', text }); return c; };
    c.slot = (t0, t1, text, o = {}) => { segs.push({ t0, t1, kind: 'slot', text, digits: o.digits || text.replace(/[^0-9]/g, '').length || 2, pre: o.pre ?? (text.match(/^[^0-9]*/) || [''])[0], post: o.post ?? '', dec: o.dec ?? 0 }); if (o.sfx !== false) { for (let tt = t0; tt < t1; tt += 0.07) X.sfx(tt, 'tick', { gain: 0.12, pitch: 1.1 }); X.sfx(t1, 'blip_up', { gain: 0.25 }); } return c; };
    c.roll = (t0, t1, from, to, o = {}) => { segs.push({ t0, t1, kind: 'roll', from, to, ease: o.ease || ((p) => 1 - Math.pow(1 - p, 2)) }); if (o.sfx !== false) for (let tt = t0; tt < t1; tt += 0.06) X.sfx(tt, 'tick', { gain: 0.1 }); return c; };
    c.exp = (t0, t1, from, to) => { segs.push({ t0, t1, kind: 'exp', from, to }); return c; };
    c.text = (t) => {
      let s = segs[0];
      for (const x of segs) if (t >= x.t0) s = x;
      if (s.kind === 'set') return s.text;
      if (s.kind === 'slot') {
        if (t >= s.t1) return s.text;
        const r = X.rand(Math.floor(t * 30) * 7 + 3);
        let d = ''; for (let i = 0; i < s.digits; i++) d += Math.floor(r() * 10);
        if (s.dec) d = d.slice(0, -s.dec) + '.' + d.slice(-s.dec);
        return s.pre + d.replace(/^0+(?=\d)/, '') + s.post;
      }
      const p = Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0)));
      if (s.kind === 'roll') return fmt(s.from + (s.to - s.from) * s.ease(p));
      return fmt(s.from * Math.pow(s.to / s.from, p * p));
    };
    let last = null;
    K.hook((t) => { const s = c.text(t); if (s !== last) { el.textContent = s; last = s; } });
    return c;
  };

  // ================================================================== captions (2–4 words, yellow, at 70 % height)
  K.captions = (vo, o = {}) => {
    const y = o.y ?? Math.round(X.H * 0.70), size = o.size || 36;
    const chunks = [];
    for (const l of vo.lines || []) {
      let cur = [];
      const words = l.words || [];
      words.forEach((w, i) => {
        cur.push(w);
        const punct = /[,.;:?!]$/.test(w.w);
        const n = cur.length, nextShort = words[i + 1] && words[i + 1].w.length <= 3;
        if (punct || n >= 4 || (n >= 3 && !nextShort && (o.max || 4) <= 3) || i === words.length - 1) { chunks.push({ words: cur, line: l }); cur = []; }
      });
    }
    // merge single short tails into the previous chunk when it has room
    const out = [];
    for (const c of chunks) {
      const prev = out[out.length - 1];
      if (prev && c.words.length === 1 && prev.words.length <= 3 && prev.line === c.line && !/[.?!:]$/.test(prev.words[prev.words.length - 1].w)) prev.words.push(...c.words);
      else out.push(c);
    }
    out.forEach((c, i) => {
      const t0 = c.words[0].start - 0.04, nxt = out[i + 1];
      const t1 = nxt ? Math.min(nxt.words[0].start - 0.04, c.words[c.words.length - 1].end + 1.1) : c.words[c.words.length - 1].end + 0.8;
      const s = c.words.map((w) => w.w).join(' ').replace(/[.]$/, '');
      const el = X.svg('text', { x: X.W / 2, y: y + size * 0.36, text: s, 'text-anchor': 'middle', 'font-family': o.font || 'Inter', 'font-weight': 800, 'font-size': size, fill: o.fill || '#ece44c', stroke: o.stroke || '#1b1822', 'stroke-width': o.sw || 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round', opacity: 0 }, K.capRoot);
      X.tl.set(el, { attr: { opacity: 1 } }, Math.max(0, t0)); X.tl.set(el, { attr: { opacity: 0 } }, t1);
    });
    return out;
  };

  // ================================================================== room helpers
  K.sky = (L, x, y, w, h, top = C.sky, bot = C.skyPale) => X.svg('rect', { x, y, width: w, height: h, fill: X.linear(`sky${K._uid = (K._uid || 0) + 1}`, [[0, top], [1, bot]]) }, L);
  K.rectV = (L, x, y, w, h, c, k = 0.35) => X.svg('rect', { x, y, width: w, height: h, fill: K.paint(c, 'vert', k) }, L);
  /** floor plane with perspective lines toward (vpx, vpy) */
  K.floor = (L, x0, y0, w, h, c, o = {}) => {
    const fg = g(L);
    X.svg('rect', { x: x0, y: y0, width: w, height: h, fill: X.linear(`fl${K._uid = (K._uid || 0) + 1}`, [[0, K.shade(c, 0.18)], [0.35, c], [1, K.light(c, 0.06)]]) }, fg);
    const vpx = o.vpx ?? X.W / 2, vpy = o.vpy ?? y0 - 600, n = o.n || 14, lc = o.line || K.shade(c, 0.35);
    if (o.planks !== false) for (let i = 0; i <= n; i++) {
      const xb = x0 + (w * i) / n, k = (y0 - vpy) / (y0 + h - vpy), xt = vpx + (xb - vpx) * k;
      X.svg('line', { x1: f2(xt), y1: y0, x2: f2(xb), y2: y0 + h, stroke: lc, 'stroke-width': 2.5, opacity: o.op ?? 0.55 }, fg);
    }
    if (o.rows) for (let j = 1; j <= o.rows; j++) { const yy = y0 + h * Math.pow(j / (o.rows + 1), 1.7); X.svg('line', { x1: x0, y1: f2(yy), x2: x0 + w, y2: f2(yy), stroke: lc, 'stroke-width': 2.5, opacity: o.op ?? 0.5 }, fg); }
    return fg;
  };
  K.window = (L, x, y, w, h, o = {}) => {
    const wg = g(L);
    sr(wg, x - 14, y - 14, w + 28, h + 28, o.frame || '#fffdf6', 'cyl', 6);
    K.sky(wg, x, y, w, h, o.sky || '#8cc8f5', o.sky2 || '#d8f0fc');
    if (o.hills !== false) { X.svg('path', { d: `M${x},${y + h * 0.72} Q${x + w * 0.3},${y + h * 0.55} ${x + w * 0.6},${y + h * 0.68} T${x + w},${y + h * 0.62} V${y + h} H${x}Z`, fill: C.grass }, wg); X.svg('path', { d: `M${x},${y + h * 0.86} Q${x + w * 0.5},${y + h * 0.76} ${x + w},${y + h * 0.84} V${y + h} H${x}Z`, fill: C.grassD }, wg); }
    X.svg('ellipse', { cx: x + w * 0.3, cy: y + h * 0.25, rx: w * 0.16, ry: h * 0.06, fill: '#ffffff', opacity: 0.9 }, wg);
    X.svg('rect', { x, y, width: w, height: h, fill: 'none', ...OUT }, wg);
    if (o.bars !== false) { X.svg('line', { x1: x + w / 2, y1: y, x2: x + w / 2, y2: y + h, ...OUT, 'stroke-width': 10, stroke: o.frame || '#fffdf6' }, wg); X.svg('line', { x1: x, y1: y + h * 0.45, x2: x + w, y2: y + h * 0.45, ...OUT, 'stroke-width': 10, stroke: o.frame || '#fffdf6' }, wg); }
    if (o.curtains) {
      const cc = o.curtains;
      [[x - 40, 1], [x + w + 40, -1]].forEach(([cx, d]) => {
        sp(wg, `M${cx},${y - 40} L${cx + d * w * 0.3},${y - 40} Q${cx + d * w * 0.22},${y + h * 0.5} ${cx + d * w * 0.26},${y + h + 40} L${cx},${y + h + 40}Z`, cc, d > 0 ? 'cyl' : 'side');
        for (let k = 1; k < 4; k++) X.svg('path', { d: `M${cx + d * k * w * 0.07},${y - 30} Q${cx + d * k * w * 0.06},${y + h * 0.5} ${cx + d * k * w * 0.065},${y + h + 30}`, fill: 'none', stroke: K.shade(cc, 0.6), 'stroke-width': 4 }, wg);
      });
      sr(wg, x - 70, y - 60, w + 140, 30, o.rod || C.goldD, 'cyl', 15);
    }
    return wg;
  };
  K.cloud = (L, x, y, s = 1, o = {}) => {
    const cg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    const d = 'M-150,30 Q-170,-30 -100,-40 Q-90,-100 -20,-90 Q20,-140 80,-90 Q150,-100 150,-30 Q200,-10 170,30Z';
    X.svg('path', { d, fill: '#ffffff', stroke: o.stroke ?? 'none' }, cg);
    X.svg('path', { d: 'M-150,30 Q-100,0 -40,18 Q20,0 80,16 Q140,4 170,30Z', fill: o.shade || C.cloudS }, cg);
    return cg;
  };
  K.tree = (L, x, y, s = 1, c = C.treeG) => {
    const tg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sr(tg, -18, -150, 36, 150, '#8b5838', 'cyl', 6);
    se(tg, 0, -240, 120, 130, c, 'sphere');
    return tg;
  };
  K.cone = (L, x, y, s = 1) => {
    const cg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sr(cg, -46, -14, 92, 16, '#e85a2a', 'cyl', 4);
    sp(cg, 'M-30,-14 L-8,-118 Q0,-126 8,-118 L30,-14Z', '#f27a2e', 'cyl');
    sp(cg, 'M-21,-56 L21,-56 L16,-80 L-16,-80Z', '#fffdf6', 'flat', { 'stroke-width': 2.5 });
    return cg;
  };
  K.crest = (L, x, y, r = 120) => {
    const cg = g(L, { transform: `translate(${x} ${y})` });
    se(cg, 0, 0, r, r, C.navy, 'sphere');
    X.svg('circle', { cx: 0, cy: 0, r: r * 0.86, fill: 'none', stroke: C.gold, 'stroke-width': r * 0.06 }, cg);
    const a = g(cg, { transform: `scale(${r / 120})` });
    X.svg('path', { d: 'M0,-62 V58 M-36,-34 H36 M-58,18 Q-50,60 0,62 Q50,60 58,18', fill: 'none', stroke: C.gold, 'stroke-width': 13, 'stroke-linecap': 'round' }, a);
    X.svg('circle', { cx: 0, cy: -70, r: 12, fill: 'none', stroke: C.gold, 'stroke-width': 9 }, a);
    X.svg('path', { d: 'M18,-20 Q40,-50 30,-80 M30,-56 Q48,-62 54,-76 M26,-40 Q44,-40 56,-52', fill: 'none', stroke: '#9ed36a', 'stroke-width': 6, 'stroke-linecap': 'round' }, a);
    return cg;
  };

  // ================================================================== props
  /** toy steamroller, side view facing left (o.flip faces right); returns {g, hub} */
  K.steamroller = (L, x, y, s = 1, o = {}) => {
    const rg = g(L, { transform: `translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})` });
    sr(rg, 150, -700, 18, 360, '#4b4558', 'cyl', 6); sr(rg, 380, -700, 18, 360, '#4b4558', 'cyl', 6);
    sp(rg, 'M110,-736 L440,-736 Q458,-736 452,-712 L446,-694 L104,-694 L100,-712 Q96,-736 110,-736Z', o.roof || C.red, 'cyl');
    sr(rg, 40, -470, 46, 130, '#3d3748', 'cyl', 6); sr(rg, 30, -486, 66, 26, '#2f2a38', 'cyl', 6);
    sp(rg, 'M-200,-372 Q-200,-404 -168,-404 L392,-404 Q424,-404 424,-372 L424,-176 Q424,-150 398,-150 L-176,-150 Q-200,-150 -200,-176Z', o.body || C.roller, 'cyl');
    sp(rg, 'M-176,-372 L120,-372 L120,-190 L-176,-190Z', K.light(o.body || C.roller, 0.12), 'flat', { 'stroke-width': 3 });
    for (let i = 0; i < 5; i++) X.svg('line', { x1: -150 + i * 52, y1: -340, x2: -150 + i * 52, y2: -220, stroke: K.shade(o.body || C.roller, 0.6), 'stroke-width': 9, 'stroke-linecap': 'round' }, rg);
    sp(rg, 'M190,-404 L330,-404 L320,-470 L200,-470Z', '#3d3748', 'cyl');
    X.svg('circle', { cx: 240, cy: -500, r: 34, fill: 'none', stroke: '#2f2a38', 'stroke-width': 10 }, rg);
    txt(rg, 0, -262, o.label || 'PORT FENNICK', { size: 34, font: 'Fredoka', weight: 700, fill: '#fffdf6', stroke: C.ink, sw: 5 });
    sp(rg, 'M-200,-360 Q-330,-470 -470,-330 L-430,-300 Q-330,-400 -230,-300Z', o.body || C.roller, 'cyl');
    // front drum
    const drum = g(rg);
    se(drum, -330, -200, 200, 200, o.drum || C.steel, 'sphere');
    se(drum, -330, -200, 150, 150, K.light(o.drum || C.steel, 0.2), 'sphere', { 'stroke-width': 3 });
    const hub = g(drum, { transform: 'translate(-330 -200)' });
    se(hub, 0, 0, 56, 56, '#5b5568', 'sphere');
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; X.svg('circle', { cx: f2(Math.cos(a) * 100), cy: f2(Math.sin(a) * 100), r: 10, fill: '#6d6880' }, hub); }
    // rear wheel
    const rw = g(rg);
    se(rw, 300, -150, 150, 150, '#34303f', 'sphere');
    se(rw, 300, -150, 66, 66, '#c9ccd6', 'sphere', { 'stroke-width': 3 });
    const rhub = g(rw, { transform: 'translate(300 -150)' });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; X.svg('circle', { cx: f2(Math.cos(a) * 36), cy: f2(Math.sin(a) * 36), r: 8, fill: '#7d7890' }, rhub); }
    const st = K.tf(hub, { x: -330, y: -200 }), st2 = K.tf(rhub, { x: 300, y: -150 });
    return { g: rg, spin: (t, turns, dur) => { X.tl.fromTo(st, { r: 0 }, { r: -360 * turns, duration: dur, ease: 'none', immediateRender: false }, t); X.tl.fromTo(st2, { r: 0 }, { r: -480 * turns, duration: dur, ease: 'none', immediateRender: false }, t); } };
  };
  /** olive tarp draped over the steamroller silhouette (same footprint as K.steamroller at the same x,y,s) */
  K.tarp = (L, x, y, s = 1, o = {}) => {
    const tg = g(L, { transform: `translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})` });
    const d = 'M-566,0 Q-604,-210 -548,-340 Q-480,-440 -330,-430 Q-200,-420 -110,-440 Q-10,-480 44,-610 Q100,-750 270,-768 Q440,-776 486,-660 Q512,-480 492,-300 Q504,-120 492,0 Q400,22 300,4 Q200,24 100,4 Q-20,26 -140,6 Q-260,26 -380,6 Q-480,22 -566,0Z';
    sp(tg, d, C.olive, 'cyl');
    const fold = K.shade(C.olive, 0.85), hi = K.light(C.olive, 0.22);
    ['M-500,-380 Q-470,-200 -480,-10', 'M-240,-418 Q-270,-200 -230,0', 'M60,-560 Q20,-300 60,0', 'M300,-760 Q330,-400 300,4', 'M90,-716 Q160,-420 140,0'].forEach((p) => X.svg('path', { d: p, fill: 'none', stroke: fold, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }, tg));
    ['M-420,-400 Q-400,-220 -410,-30', 'M180,-740 Q220,-400 210,-10'].forEach((p) => X.svg('path', { d: p, fill: 'none', stroke: hi, 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.6 }, tg));
    ['M-540,-200 Q-100,-150 470,-230', 'M-30,-500 Q200,-470 470,-520'].forEach((p) => X.svg('path', { d: p, fill: 'none', stroke: '#d8c08a', 'stroke-width': 8, 'stroke-linecap': 'round' }, tg));
    return tg;
  };
  /** two-month wall calendar with one circled day (source: OCTOBER red header / NOVEMBER blue header) */
  K.calendar = (L, x, y, w = 520, o = {}) => {
    const cg = g(L, { transform: `translate(${x} ${y})` });
    const months = o.months || [['OCTOBER', 4, 31, C.calRed], ['NOVEMBER', 0, 30, C.calBlue]];
    const cw = (w - 40) / 7, rows = 5, mh = 86 + rows * cw * 0.78;
    const h = 30 + months.length * (mh + 14);
    sr(cg, -16, -16, w + 32, h + 32, '#5d5662', 'cyl', 8);
    sr(cg, 0, 0, w, h, C.calPaper, 'vert', 4, { 'stroke-width': 3 });
    const cells = {};
    months.forEach(([name, first, days, col], mi) => {
      const my = 16 + mi * (mh + 14);
      sr(cg, 12, my, w - 24, 80, col, 'cyl', 4, { 'stroke-width': 3 });
      txt(cg, w / 2, my + 58, name, { size: 54, font: 'Montserrat', weight: 900, fill: '#fffdf6', ls: 1 });
      for (let d = 1; d <= days; d++) {
        const k = first + d - 1, cx = 20 + (k % 7) * cw, cy = my + 92 + Math.floor(k / 7) * cw * 0.78;
        if (Math.floor(k / 7) >= rows) continue;
        X.svg('rect', { x: cx + 3, y: cy + 3, width: cw - 6, height: cw * 0.78 - 6, rx: 3, fill: C.calCell }, cg);
        txt(cg, cx + cw * 0.3, cy + cw * 0.42, String(d), { size: cw * 0.32, font: 'Montserrat', weight: 700, fill: '#4a4152' });
        cells[`${mi}-${d}`] = [cx + cw / 2, cy + cw * 0.39];
      }
    });
    const res = { g: cg, cells, cw };
    if (o.circle) {
      const [mi, d, label] = o.circle, [cx, cy] = cells[`${mi}-${d}`];
      const hl = g(cg);
      sr(hl, cx - cw * 0.62, cy - cw * 0.5, cw * 1.24, cw * 1.0, '#fff3c4', 'flat', 6, { 'stroke-width': 3.5 });
      txt(hl, cx, cy + cw * 0.18, String(d), { size: cw * 0.66, font: 'Montserrat', weight: 900, fill: '#2b2235' });
      txt(hl, cx, cy + cw * 0.44, label || months[mi][0].slice(0, 3), { size: cw * 0.24, font: 'Montserrat', weight: 900, fill: months[mi][3] });
      const ring = X.svg('ellipse', { cx, cy: cy - cw * 0.02, rx: cw * 0.95, ry: cw * 0.72, fill: 'none', stroke: '#d8323c', 'stroke-width': 10, 'stroke-linecap': 'round' }, cg);
      res.ring = ring; res.hl = hl; res.at = [cx, cy];
      if (o.cones) [[-1.25, 0.55], [1.25, 0.55], [-1.05, -0.62], [1.1, -0.66]].forEach(([dx, dy], i) => K.cone(cg, cx + dx * cw, cy + dy * cw + 20, 0.42 * (cw / 66)));
    }
    return res;
  };
  /** small tear-off day calendar; .flip(t, day) rips the page up to reveal the next one */
  K.tearCal = (L, x, y, w = 150, month = 'NOV', day = 5) => {
    const cg = g(L, { transform: `translate(${x} ${y})` });
    const h = w * 1.15;
    sr(cg, 0, 0, w, h, '#fffdf6', 'vert', 4);
    const back = g(cg), front = g(cg);
    const page = (gg, d) => { sr(gg, 0, 0, w, h, '#fffdf6', 'vert', 4); sr(gg, 0, 0, w, h * 0.26, C.calRed, 'cyl', 4); txt(gg, w / 2, h * 0.2, month, { size: w * 0.18, font: 'Montserrat', weight: 900 }); const t = txt(gg, w / 2, h * 0.86, String(d), { size: w * 0.56, font: 'Montserrat', weight: 900, fill: C.ink }); return t; };
    const bt = page(back, day + 1), ft = page(front, day);
    const st = K.tf(front, { x: 0, y: 0, sy: 1, r: 0, o: 1 });
    return { g: cg, back: bt, front: ft, flip: (t) => { X.tl.fromTo(st, { sy: 1, y: 0, r: 0, o: 1 }, { sy: -0.3, y: -h * 0.3, r: -10, o: 0, duration: 0.2, ease: 'power2.in', immediateRender: false }, t); X.sfx(t, 'paper', { dur: 0.25, gain: 0.4 }); } };
  };
  /** tall price-sign counter (blue panel, yellow top strip, label + dark inset with yellow digits per row) */
  K.priceSign = (L, x, y, o = {}) => {
    const w = o.w || 420, rows = o.rows || [['POTHOLES', '3']], rh = o.rh || 170;
    const pg = g(L, { transform: `translate(${x} ${y})` });
    if (o.pole !== false) sr(pg, w / 2 - 24, rows.length * rh + 40, 48, o.pole || 600, '#b9bccb', 'cyl', 4);
    sr(pg, -10, -26, w + 20, 40, C.strip, 'cyl', 6);
    sr(pg, 0, 0, w, rows.length * rh + 40, C.signBlue, 'side', 8);
    const els = rows.map(([label, val], i) => {
      const ry = 20 + i * rh;
      txt(pg, 26, ry + 40, label, { size: o.ls || 38, font: 'Fredoka', weight: 700, fill: '#fffdf6', anchor: 'start' });
      sr(pg, 18, ry + 52, w - 36, rh - 66, C.signDark, 'flat', 6, { 'stroke-width': 3 });
      return txt(pg, w / 2, ry + 52 + (rh - 66) * 0.8, val, { size: o.ds || (rh - 66) * 0.92, font: 'Fredoka', weight: 700, fill: C.digit });
    });
    return { g: pg, rows: els, w, h: rows.length * rh + 40 };
  };
  /** black LED read-out in a red frame (the "pump total") */
  K.led = (L, x, y, w = 360, h = 150, val = '$0.00', o = {}) => {
    const lg = g(L, { transform: `translate(${x} ${y})` });
    sr(lg, -18, -18, w + 36, h + 36, C.red, 'cyl', 12);
    sr(lg, 0, 0, w, h, '#211d2c', 'flat', 6, { 'stroke-width': 3 });
    if (o.label) txt(lg, w / 2, -28, o.label, { size: 30, font: 'Fredoka', weight: 700, fill: '#fffdf6', stroke: C.ink, sw: 5 });
    const t = txt(lg, w / 2, h * 0.68, val, { size: o.size || h * 0.44, font: 'Fredoka', weight: 700, fill: C.digit, attrs: { lengthAdjust: 'spacingAndGlyphs' } });
    let lastT = null;
    const fit = () => { if (t.textContent === lastT) return; lastT = t.textContent; t.removeAttribute('textLength'); const L = t.getComputedTextLength(); if (L > w - 30) t.setAttribute('textLength', w - 30); };
    K.hook(fit);
    return { g: lg, text: t };
  };
  K.pothole = (L, x, y, w = 260, h = 80, seed = 1, o = {}) => {
    const pg = g(L, { transform: `translate(${x} ${y})` });
    const rr = X.rand(seed), n = 22;
    const ring = (rx, ry, j) => 'M' + Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 1 + (rr() - 0.5) * j; return `${f2(Math.cos(a) * rx * k)},${f2(Math.sin(a) * ry * k)}`; }).join('L') + 'Z';
    X.svg('path', { d: ring(w * 0.58, h * 0.62, 0.22), fill: o.rim || C.holeRim, stroke: C.ink, 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }, pg);
    X.svg('path', { d: ring(w * 0.5, h * 0.5, 0.18), fill: o.hole || C.hole, ...OUT }, pg);
    if (o.puddle !== false) {
      X.svg('ellipse', { cx: w * 0.04, cy: h * 0.12, rx: w * 0.34, ry: h * 0.26, fill: '#7f95c2' }, pg);
      X.svg('path', { d: `M${-w * 0.2},${h * 0.06} Q${-w * 0.05},${-h * 0.04} ${w * 0.12},${h * 0.04}`, fill: 'none', stroke: '#dfeefc', 'stroke-width': 6, 'stroke-linecap': 'round' }, pg);
    }
    for (let i = 0; i < 5; i++) { const a = rr() * Math.PI * 2, r0 = 0.56; X.svg('path', { d: `M${f2(Math.cos(a) * w * r0)},${f2(Math.sin(a) * h * r0)} l${f2(Math.cos(a) * w * 0.14)},${f2(Math.sin(a) * h * 0.2 + (rr() - 0.5) * 16)} l${f2(Math.cos(a + 0.5) * w * 0.08)},${f2(Math.sin(a + 0.5) * h * 0.12)}`, fill: 'none', stroke: C.ink, 'stroke-width': 3, opacity: 0.7 }, pg); }
    return pg;
  };
  /** toy hatchback, facing right; returns {g, body, wheels:[g,g]} */
  K.car = (L, x, y, s = 1, c = C.yellowCar, o = {}) => {
    const cg = g(L, { transform: `translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})` });
    const body = g(cg);
    sp(body, 'M-300,-90 Q-306,-200 -250,-214 L-170,-230 Q-120,-330 -10,-336 L120,-336 Q200,-334 250,-230 L300,-210 Q330,-200 330,-150 L326,-90 Q320,-60 290,-60 L-276,-60 Q-300,-60 -300,-90Z', c, 'side');
    sp(body, 'M-150,-232 Q-110,-312 -20,-314 L40,-314 L40,-232Z', '#3b5c99', 'flat', { 'stroke-width': 3.5 });
    sp(body, 'M66,-314 L120,-314 Q186,-312 222,-232 L66,-232Z', '#3b5c99', 'flat', { 'stroke-width': 3.5 });
    X.svg('path', { d: 'M-120,-250 L-60,-300', stroke: '#9fc0ec', 'stroke-width': 10, 'stroke-linecap': 'round' }, body);
    X.svg('path', { d: 'M52,-232 L52,-90', ...OUT, 'stroke-width': 3 }, body);
    sr(body, 290, -190, 34, 34, '#fff3b8', 'flat', 8, { 'stroke-width': 3 });
    sr(body, -296, -150, 26, 30, '#e85a4a', 'flat', 6, { 'stroke-width': 3 });
    sr(body, -60, -170, 60, 14, K.shade(c, 0.6), 'flat', 7, { 'stroke-width': 2.5 });
    const wheels = [-170, 190].map((wx) => { const wg = g(cg, { transform: `translate(${wx} -70)` }); se(wg, 0, 0, 76, 76, '#2f2b3a', 'sphere'); se(wg, 0, 0, 36, 36, '#c9ccd6', 'sphere', { 'stroke-width': 3 }); return wg; });
    return { g: cg, body, wheels };
  };
  K.bike = (L, x, y, s = 1, c = '#d8473c') => {
    const bg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    const wheel = (wx) => { const wg = g(bg, { transform: `translate(${wx} -110)` }); X.svg('circle', { cx: 0, cy: 0, r: 108, fill: 'none', stroke: '#2f2b3a', 'stroke-width': 16 }, wg); X.svg('circle', { cx: 0, cy: 0, r: 108, fill: 'none', stroke: '#4a4458', 'stroke-width': 4 }, wg); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; X.svg('line', { x1: f2(Math.cos(a) * 100), y1: f2(Math.sin(a) * 100), x2: f2(-Math.cos(a) * 100), y2: f2(-Math.sin(a) * 100), stroke: '#9a96a8', 'stroke-width': 3 }, wg); } X.svg('circle', { cx: 0, cy: 0, r: 12, fill: '#6d6880' }, wg); return wg; };
    const back = wheel(-170), front = wheel(170);
    const fr = { stroke: C.ink, 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' };
    const tube = 'M-170,-110 L-40,-110 L80,-260 L-70,-260 Z M-40,-110 L-90,-300 M80,-260 L170,-110 M80,-260 L60,-330';
    X.svg('path', { d: tube, ...fr }, bg); X.svg('path', { d: tube, ...fr, stroke: c, 'stroke-width': 16 }, bg);
    sp(bg, 'M-140,-300 Q-90,-326 -40,-306 Q-60,-288 -136,-290Z', '#2f2b3a', 'flat');
    X.svg('path', { d: 'M30,-340 Q60,-352 100,-336', fill: 'none', stroke: C.ink, 'stroke-width': 14, 'stroke-linecap': 'round' }, bg);
    return { g: bg, front, back };
  };
  K.mailbox = (L, x, y, s = 1) => {
    const mg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sr(mg, -16, -260, 32, 260, '#a5683d', 'cyl', 4);
    sp(mg, 'M-110,-250 L-110,-370 Q-110,-430 -40,-430 L70,-430 Q120,-430 120,-370 L120,-250Z', '#6f86b9', 'side');
    X.svg('path', { d: 'M-110,-370 Q-110,-430 -40,-430', fill: 'none', stroke: '#9fb4dc', 'stroke-width': 8 }, mg);
    const flag = g(mg, { transform: 'translate(118 -300)' });
    sr(flag, -6, -10, 12, 90, '#d8473c', 'flat', 4, { 'stroke-width': 3 }); sr(flag, -6, 50, 50, 34, '#d8473c', 'flat', 4, { 'stroke-width': 3 });
    const st = K.tf(flag, { x: 118, y: -300, r: 0 });
    return { g: mg, flag: st };
  };
  K.duck = (L, x, y, s = 1) => {
    const dg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sp(dg, 'M-70,0 Q-80,-60 -10,-56 Q40,-54 60,-30 Q70,0 40,10 L-50,10 Q-72,10 -70,0Z', '#f6cf3e', 'cyl');
    se(dg, 30, -86, 40, 38, '#f6cf3e', 'sphere');
    sp(dg, 'M62,-90 L96,-82 L64,-72Z', '#f2873a', 'flat', { 'stroke-width': 3 });
    X.svg('circle', { cx: 40, cy: -96, r: 6, fill: C.ink }, dg);
    return dg;
  };
  K.podium = (L, x, y, s = 1, o = {}) => {
    const pg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sp(pg, 'M-190,-560 L190,-560 L170,0 L-170,0Z', o.color || C.navy, 'side');
    sp(pg, 'M-220,-600 L220,-600 Q232,-600 228,-582 L224,-556 L-224,-556 L-228,-582 Q-232,-600 -220,-600Z', K.light(o.color || C.navy, 0.1), 'cyl');
    se(pg, 0, -330, 96, 96, '#fffdf6', 'sphere', { 'stroke-width': 4 });
    if (o.emblem === 'star') X.svg('path', { d: 'M0,-392 L18,-346 L66,-344 L28,-314 L42,-268 L0,-296 L-42,-268 L-28,-314 L-66,-344 L-18,-346Z', fill: o.star || C.gold, stroke: C.ink, 'stroke-width': 3 }, pg);
    else K.crest(pg, 0, -330, 78);
    X.svg('path', { d: 'M40,-600 Q48,-660 20,-700', fill: 'none', stroke: '#3d3748', 'stroke-width': 8 }, pg);
    se(pg, 18, -712, 16, 22, '#2f2b3a', 'sphere', { 'stroke-width': 3 });
    return pg;
  };
  K.desk = (L, x, y, w = 700, h = 330, c = C.wood) => {
    const dg = g(L, { transform: `translate(${x} ${y})` });
    sp(dg, `M${-w / 2},${-h} L${w / 2},${-h} L${w / 2 - 10},0 L${-w / 2 + 10},0Z`, c, 'side');
    sp(dg, `M${-w / 2 - 30},${-h - 40} L${w / 2 + 30},${-h - 40} L${w / 2 + 16},${-h} L${-w / 2 - 16},${-h}Z`, K.light(c, 0.16), 'vert');
    sr(dg, -w / 2 + 40, -h + 40, w / 2 - 70, h - 80, K.shade(c, 0.25), 'flat', 6, { 'stroke-width': 3 });
    sr(dg, 30, -h + 40, w / 2 - 70, h - 80, K.shade(c, 0.35), 'flat', 6, { 'stroke-width': 3 });
    return dg;
  };
  /** desk name sign that flips over its bottom edge from text A to text B (source: TRIAL → ON HOLD) */
  K.deskSign = (L, x, y, a, b, o = {}) => {
    const w = o.w || 300, h = o.h || 110;
    const dg = g(L, { transform: `translate(${x} ${y}) rotate(${o.rot || -4})` });
    sp(dg, `M${-w / 2 + 20},0 L${-w / 2 + 10},26 L${w / 2 - 10},26 L${w / 2 - 20},0Z`, '#5b5560', 'cyl', { 'stroke-width': 3 });
    const fa = g(dg), fb = g(dg);
    const face = (gg, s, col) => { sr(gg, -w / 2, -h, w, h, '#fffdf6', 'vert', 6); txt(gg, 0, -h * 0.28, s, { size: o.size || h * 0.5, font: 'Montserrat', weight: 900, fill: col, attrs: { transform: 'skewX(-9)' } }); };
    face(fa, a, o.ca || C.ink); face(fb, b, o.cb || '#d8323c');
    const A = K.tf(fa, { sy: 1 }), B = K.tf(fb, { sy: 0 });
    return { g: dg, flip: (t) => { X.tl.fromTo(A, { sy: 1 }, { sy: 0, duration: 0.08, ease: 'power2.in', immediateRender: false }, t); X.tl.fromTo(B, { sy: 0 }, { sy: 1, duration: 0.1, ease: 'back.out(2)', immediateRender: false }, t + 0.08); X.sfx(t, 'click', { gain: 0.5 }); X.sfx(t + 0.08, 'stamp', { gain: 0.35 }); } };
  };
  /** easel with a flip chart; .arrow is a path for X.drawOn (the poll line that shoots up) */
  K.easel = (L, x, y, s = 1) => {
    const eg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    ['M-150,0 L-60,-700', 'M150,0 L60,-700', 'M0,-40 L0,-700'].forEach((d) => X.svg('path', { d, stroke: C.ink, 'stroke-width': 26, 'stroke-linecap': 'round' }, eg));
    ['M-150,0 L-60,-700', 'M150,0 L60,-700'].forEach((d) => X.svg('path', { d, stroke: '#b98552', 'stroke-width': 16, 'stroke-linecap': 'round' }, eg));
    sr(eg, -230, -760, 460, 420, '#fffdf6', 'vert', 6);
    X.svg('path', { d: 'M-180,-720 L-180,-390 L190,-390', fill: 'none', stroke: C.ink, 'stroke-width': 6 }, eg);
    for (let i = 1; i < 4; i++) X.svg('line', { x1: -180, y1: -390 - i * 80, x2: 190, y2: -390 - i * 80, stroke: '#c9c3cf', 'stroke-width': 3 }, eg);
    const arrow = X.svg('path', { d: 'M-160,-420 L-80,-440 L0,-430 L60,-520 L110,-640 L150,-820', fill: 'none', stroke: '#d8323c', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, eg);
    const head = X.svg('path', { d: 'M150,-860 L190,-790 L112,-800Z', fill: '#d8323c', stroke: '#d8323c', 'stroke-width': 6, 'stroke-linejoin': 'round', opacity: 0 }, eg);
    return { g: eg, arrow, head };
  };
  K.chalkboard = (L, x, y, w = 760, h = 520) => {
    const cg = g(L, { transform: `translate(${x} ${y})` });
    sr(cg, -26, -26, w + 52, h + 52, '#a9713f', 'cyl', 10);
    sr(cg, 0, 0, w, h, C.chalk, 'vert', 4, { 'stroke-width': 3 });
    const rr = X.rand(5);
    for (let i = 0; i < 9; i++) X.svg('ellipse', { cx: rr() * w, cy: rr() * h, rx: 60 + rr() * 90, ry: 18 + rr() * 22, fill: '#ffffff', opacity: 0.05 }, cg);
    sr(cg, 40, h + 26, w - 80, 20, '#8a5a32', 'cyl', 6, { 'stroke-width': 3 });
    return cg;
  };
  K.billboard = (L, x, y, w = 520, h = 320) => {
    const bg = g(L, { transform: `translate(${x} ${y})` });
    sr(bg, w * 0.2 - 14, h, 28, 700, '#6c6878', 'cyl', 4); sr(bg, w * 0.8 - 14, h, 28, 700, '#6c6878', 'cyl', 4);
    sr(bg, -22, -22, w + 44, h + 44, '#2c2836', 'side', 10);
    const cp = X.svg('clipPath', { id: `bb${K._uid = (K._uid || 0) + 1}` }, X.defs); X.svg('rect', { x: 0, y: 0, width: w, height: h }, cp);
    const screen = g(bg, { 'clip-path': `url(#${cp.id})` });
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: '#58606f' }, screen);
    const content = g(screen);
    X.svg('path', { d: `M0,0 L${w * 0.25},0 L0,${h * 0.4}Z`, fill: '#ffffff', opacity: 0.1 }, bg);
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: 'none', ...OUT }, bg);
    return { g: bg, screen: content, w, h };
  };
  K.umbrella = (L, x, y, s = 1) => {
    const ug = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sr(ug, -8, -560, 16, 560, '#8a8698', 'cyl', 4);
    const segs = 6, rim = (a) => [Math.cos(a) * 300, -440 + Math.sin(a) * 46];
    for (let i = 0; i < segs; i++) {
      const a0 = Math.PI - (i / segs) * Math.PI, a1 = Math.PI - ((i + 1) / segs) * Math.PI, am = (a0 + a1) / 2;
      const p0 = rim(a0), p1 = rim(a1), pm = rim(am);
      X.svg('path', { d: `M0,-610 L${f2(p0[0])},${f2(p0[1])} Q${f2(pm[0])},${f2(pm[1] - 34)} ${f2(p1[0])},${f2(p1[1])}Z`, fill: K.paint(i % 2 ? '#fffdf6' : '#d8473c', 'flat'), ...OUT, 'stroke-width': 3.5 }, ug);
    }
    X.svg('path', { d: 'M0,-610 L300,-440 Q150,-380 0,-394Z', fill: '#3a2f58', opacity: 0.16 }, ug);
    se(ug, 0, -616, 12, 12, '#8a8698', 'sphere', { 'stroke-width': 3 });
    return ug;
  };
  K.booth = (L, x, y, w = 300, h = 640, c = C.signBlue, o = {}) => {
    const bg = g(L, { transform: `translate(${x} ${y})` });
    sr(bg, -w / 2, -h, 12, h, '#c8ccd8', 'cyl', 3); sr(bg, w / 2 - 12, -h, 12, h, '#c8ccd8', 'cyl', 3);
    sr(bg, -w / 2 - 10, -h - 70, w + 20, 76, c, 'cyl', 4);
    txt(bg, 0, -h - 18, 'VOTE', { size: 46, font: 'Montserrat', weight: 900, fill: '#fffdf6' });
    const cur = g(bg);
    sp(cur, `M${-w / 2 + 10},${-h} L${w / 2 - 10},${-h} L${w / 2 - 4},${-110} Q0,${-96} ${-w / 2 + 4},${-110}Z`, '#eef1f8', 'cyl');
    for (let i = 1; i < 6; i++) X.svg('path', { d: `M${-w / 2 + i * (w / 6)},${-h + 6} Q${-w / 2 + i * (w / 6) + 6},${-h / 2} ${-w / 2 + i * (w / 6) - 2},${-112}`, fill: 'none', stroke: '#a9b5cf', 'stroke-width': 6 }, cur);
    const feet = g(bg);
    if (o.feet !== false) { se(feet, -40, -40, 46, 26, o.shoe || '#4a3a34', 'sphere'); se(feet, 40, -40, 46, 26, o.shoe || '#4a3a34', 'sphere'); sr(feet, -66, -110, 52, 70, o.legs || '#3a3f5c', 'cyl', 6); sr(feet, 14, -110, 52, 70, o.legs || '#3a3f5c', 'cyl', 6); }
    return { g: bg, curtain: cur, feet };
  };
  /** rotating road-work beacon (amber), the source's alarm-light analogue */
  K.beacon = (L, x, y, s = 1, c = C.amber, o = {}) => {
    const bg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    const glow = X.svg('ellipse', { cx: 0, cy: -60, rx: 150, ry: 150, fill: X.radial(`bglow${K._uid = (K._uid || 0) + 1}`, [[0, c, 0.75], [1, c, 0]]), opacity: 0.6 }, bg);
    sr(bg, -60, -20, 120, 30, '#4b4558', 'cyl', 6);
    sp(bg, 'M-48,-20 L-48,-90 Q-48,-130 0,-130 Q48,-130 48,-90 L48,-20Z', c, 'cyl');
    const beam = X.svg('path', { d: 'M0,-75 L420,-190 L420,40Z', fill: c, opacity: 0.18, filter: K.F.soft12 }, bg);
    K.hook((t) => { const a = (t * 420) % 360, k = 0.5 + 0.5 * Math.cos(a * Math.PI / 180); glow.setAttribute('opacity', f2(0.25 + 0.6 * k)); beam.setAttribute('transform', `scale(${f2(Math.cos(a * Math.PI / 180))} 1)`); }, o.vis);
    return bg;
  };
  K.house = (L, x, y, w, h, wall, roof, o = {}) => {
    const hg = g(L, { transform: `translate(${x} ${y})` });
    const d = o.depth || w * 0.45;
    sp(hg, `M${w / 2},0 L${w / 2 + d * 0.6},${-d * 0.35} L${w / 2 + d * 0.6},${-h - d * 0.35} L${w / 2},${-h}Z`, K.shade(wall, 0.5), 'flat');
    sp(hg, `M${-w / 2},0 L${w / 2},0 L${w / 2},${-h} L${-w / 2},${-h}Z`, wall, 'vert');
    sp(hg, `M${-w / 2 - 14},${-h} L${w / 2 + 14},${-h} L${w / 2 + d * 0.6 + 10},${-h - d * 0.35} L${-w / 2 + d * 0.6 - 14},${-h - d * 0.35} Z`, roof, 'flat');
    sp(hg, `M${-w / 2 - 14},${-h} L${-w / 2 + d * 0.3},${-h - d * 0.55 - 30} L${w / 2 + d * 0.3},${-h - d * 0.55 - 30} L${w / 2 + 14},${-h}Z`, K.light(roof, 0.1), 'flat');
    const n = Math.max(1, Math.round(w / 90));
    for (let i = 0; i < n; i++) sr(hg, -w / 2 + (w / n) * (i + 0.5) - 18, -h * 0.7, 36, 36, '#bfe3f7', 'flat', 4, { 'stroke-width': 3 });
    return hg;
  };
  K.ballot = (L, x, y, s = 1) => {
    const bg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    sr(bg, -46, -60, 92, 120, '#fffdf6', 'vert', 4, { 'stroke-width': 3.5 });
    [-30, 0, 30].forEach((yy, i) => { X.svg('rect', { x: -32, y: yy - 9, width: 16, height: 16, fill: 'none', stroke: C.ink, 'stroke-width': 3 }, bg); X.svg('line', { x1: -8, y1: yy, x2: 30, y2: yy, stroke: '#9a95a8', 'stroke-width': 4 }, bg); });
    X.svg('path', { d: 'M-30,-32 l6,8 l12,-16', fill: 'none', stroke: '#d8323c', 'stroke-width': 5, 'stroke-linecap': 'round' }, bg);
    return bg;
  };

  // ================================================================== sets (shared backgrounds; draw into a parallax layer)
  K.officeBG = (L, o = {}) => {
    K.rectV(L, -900, -500, 3200, 1700, C.cream, 0.18);
    X.svg('rect', { x: -900, y: 1000, width: 3200, height: 200, fill: K.paint('#ead2a6', 'vert') }, L);
    X.svg('line', { x1: -900, y1: 1000, x2: 2300, y2: 1000, stroke: '#c9a46c', 'stroke-width': 10 }, L);
    for (let x = -860; x < 2300; x += 210) X.svg('rect', { x, y: 1030, width: 170, height: 140, rx: 6, fill: 'none', stroke: '#d4b383', 'stroke-width': 4 }, L);
    (o.windows || [[60, 380], [760, 380]]).forEach(([x, y]) => K.window(L, x, y, 300, 470, { curtains: C.gold }));
  };
  K.floorRug = (L, o = {}) => {
    K.floor(L, -900, 1180, 3200, 1000, C.cream2, { vpy: 600, n: 26, op: 0.35 });
    X.svg('ellipse', { cx: o.rx || 540, cy: o.ry || 1720, rx: 560, ry: 170, fill: C.gold, stroke: C.ink, 'stroke-width': 4 }, L);
    X.svg('ellipse', { cx: o.rx || 540, cy: o.ry || 1720, rx: 520, ry: 150, fill: K.paint(C.navy, 'vert') }, L);
    X.svg('path', { d: `M${(o.rx || 540)},${(o.ry || 1720) - 110} L${(o.rx || 540) + 60},${(o.ry || 1720) - 30} L${(o.rx || 540) + 190},${(o.ry || 1720) - 20} L${(o.rx || 540) + 80},${(o.ry || 1720) + 30} L${(o.rx || 540) + 120},${(o.ry || 1720) + 110} L${o.rx || 540},${(o.ry || 1720) + 60} L${(o.rx || 540) - 120},${(o.ry || 1720) + 110} L${(o.rx || 540) - 80},${(o.ry || 1720) + 30} L${(o.rx || 540) - 190},${(o.ry || 1720) - 20} L${(o.rx || 540) - 60},${(o.ry || 1720) - 30}Z`, fill: C.gold, opacity: 0.95 }, L);
  };
  K.hangar = (L, o = {}) => {
    const cx = o.cx || 540, cy = o.cy || 820;
    X.svg('rect', { x: -900, y: -600, width: 3000, height: 3200, fill: C.hangar }, L);
    X.svg('ellipse', { cx, cy, rx: 230, ry: 190, fill: '#eaf4fb' }, L);
    X.svg('rect', { x: cx - 230, y: cy, width: 460, height: 400, fill: '#d9e9d3' }, L);
    for (let i = 7; i >= 1; i--) {
      const k = 1 + i * 0.62, rx = 230 * k, ry = 190 * k;
      X.svg('path', { d: `M${cx - rx},${cy + 380 * k} L${cx - rx},${cy} A${rx},${ry} 0 0 1 ${cx + rx},${cy} L${cx + rx},${cy + 380 * k}`, fill: 'none', stroke: C.ink, 'stroke-width': 30 + i * 4 }, L);
      X.svg('path', { d: `M${cx - rx},${cy + 380 * k} L${cx - rx},${cy} A${rx},${ry} 0 0 1 ${cx + rx},${cy} L${cx + rx},${cy + 380 * k}`, fill: 'none', stroke: i % 2 ? C.hangarL : '#8e8297', 'stroke-width': 22 + i * 4 }, L);
      [-1, 1].forEach((sd) => { X.svg('circle', { cx: cx + sd * rx * 0.72, cy: cy - ry * 0.68, r: 9 + i * 2, fill: '#ff5a4f' }, L); X.svg('circle', { cx: cx + sd * rx * 0.72, cy: cy - ry * 0.68, r: 26 + i * 5, fill: '#ff5a4f', opacity: 0.18 }, L); });
    }
    K.floor(L, -900, cy + 300, 3000, 1500, C.hangar2, { vpx: cx, vpy: cy, n: 10, op: 0.3, line: '#463d5a' });
    [-1, 1].forEach((sd) => X.svg('path', { d: `M${cx + sd * 120},${cy + 300} L${cx + sd * 1500},${cy + 2400}`, stroke: '#e6c14a', 'stroke-width': 18 }, L));
  };
  K.outdoor = (L, o = {}) => {
    K.sky(L, -900, -600, 3200, (o.horizon || 1000) + 600, o.sky || '#3d8be0', o.sky2 || '#9fd3f7');
    (o.clouds || [[120, 180, 0.9], [760, 120, 0.7], [1400, 220, 0.9], [-300, 260, 0.8]]).forEach(([x, y, s]) => K.cloud(L, x, y, s));
    const hz = o.horizon || 1000;
    X.svg('path', { d: `M-900,${hz - 60} Q-300,${hz - 200} 300,${hz - 90} Q800,${hz - 230} 1400,${hz - 100} Q1900,${hz - 190} 2300,${hz - 80} V${hz + 200} H-900Z`, fill: C.grass, stroke: C.ink, 'stroke-width': 3 }, L);
    X.svg('path', { d: `M-900,${hz - 10} Q0,${hz - 90} 900,${hz - 20} T2300,${hz - 30} V${hz + 200} H-900Z`, fill: C.grassD }, L);
  };
  K.shopfront = (L, x, y, w, h, o = {}) => {
    const sg = K.g(L, { transform: `translate(${x} ${y})` });
    K.sr(sg, 0, -h, w, h, '#fbf8f0', 'side', 4);
    K.sr(sg, -14, -h - 46, w + 28, 70, C.red, 'cyl', 6);
    K.txt(sg, w / 2, -h - 1, o.name || 'TYRES & BIKES', { size: 42, font: 'Fredoka', weight: 700, fill: '#fffdf6' });
    K.sr(sg, 40, -h + 70, w * 0.5, h * 0.5, '#8fd0f2', 'flat', 6);
    X.svg('path', { d: `M${50},${-h + 90} L${110},${-h + 160}`, stroke: '#ffffff', 'stroke-width': 10, opacity: 0.7 }, sg);
    K.sr(sg, w * 0.66, -h * 0.66, w * 0.24, h * 0.66, '#c9534a', 'side', 4);
    K.sr(sg, -6, -24, w + 12, 24, C.red, 'cyl', 4);
    return sg;
  };
  K.road = (L, y0, h, o = {}) => {
    X.svg('rect', { x: -900, y: y0 - 70, width: 3200, height: 76, fill: K.paint(C.sidewalk, 'vert'), stroke: C.ink, 'stroke-width': 3 }, L);
    X.svg('rect', { x: -900, y: y0, width: 3200, height: h, fill: K.paint(C.road, 'vert', 0.2) }, L);
    for (let x = -900; x < 2300; x += 260) X.svg('rect', { x, y: y0 + h * 0.55, width: 140, height: 16, fill: '#f6f2e6', opacity: 0.9 }, L);
  };
  K.stage = (L, o = {}) => {
    X.svg('rect', { x: -900, y: -600, width: 3000, height: 3200, fill: '#2f2c3d' }, L);
    K.sky(L, -300, 200, 1680, 1150, '#5fa9ee', '#b9e8fb');
    X.svg('path', { d: 'M40,900 Q120,560 330,520 Q420,380 560,420 Q760,360 860,520 Q1060,560 1060,900 Z', fill: '#4b7fd0', stroke: C.ink, 'stroke-width': 4, opacity: 0.95 }, L);
    K.crest(L, 540, 640, 150);
    X.svg('rect', { x: -900, y: 1350, width: 3000, height: 900, fill: K.paint('#3a3650', 'vert') }, L);
  };


  // ================================================================== ceremony props (ribbon cutting, prize rosette)
  /** ribbon on two gold posts with a bow; .snip(t) drops both halves and the bow */
  K.ribbon = (L, x0, x1, y, o = {}) => {
    const rg = g(L), h = o.h || 330, col = o.color || '#d8323c', mid = (x0 + x1) / 2;
    const half = (x, len, dir) => {
      const hg = g(rg); const st = K.tf(hg, { x, y, r: 0 });
      X.svg('path', { d: `M0,-15 Q${dir * len / 2},5 ${dir * len},-15 L${dir * len},15 Q${dir * len / 2},35 0,15Z`, fill: K.paint(col, 'vert'), ...OUT }, hg);
      return st;
    };
    const A = half(x0, mid - x0, 1), B = half(x1, x1 - mid, -1);
    [x0, x1].forEach((x) => { se(rg, x, y + h, 62, 18, '#6b6478', 'sphere', { 'stroke-width': 3 }); sr(rg, x - 14, y - 10, 28, h + 10, '#c9a24a', 'cyl', 6); se(rg, x, y - 20, 25, 25, '#f0c24a', 'sphere'); });
    const bow = g(rg); const bst = K.tf(bow, { x: mid, y: y + 4, r: 0 });
    sp(bow, 'M-10,8 L-44,96 L-22,88 L-10,106Z M10,8 L44,96 L22,88 L10,106Z', K.shade(col, 0.3), 'flat');
    sp(bow, 'M0,0 Q-74,-64 -84,0 Q-74,54 0,0Z', col, 'cyl'); sp(bow, 'M0,0 Q74,-64 84,0 Q74,54 0,0Z', col, 'cyl');
    se(bow, 0, 0, 20, 20, K.shade(col, 0.3), 'sphere');
    return {
      g: rg, snip: (t) => {
        X.tl.fromTo(A, { r: 0 }, { r: 78, duration: 0.5, ease: 'bounce.out', immediateRender: false }, t);
        X.tl.fromTo(B, { r: 0 }, { r: -78, duration: 0.5, ease: 'bounce.out', immediateRender: false }, t + 0.02);
        X.tl.fromTo(bst, { y: y + 4, r: 0 }, { y: y + h - 30, r: 40, duration: 0.42, ease: 'power2.in', immediateRender: false }, t);
        X.sfx(t, 'swoosh', { gain: 0.3 }); X.sfx(t + 0.42, 'thud', { gain: 0.2, pitch: 1.3 });
      },
    };
  };
  /** giant ceremonial scissors for a hand slot (+y = along the forearm); .snip(t) closes the blades on t */
  K.scissors = (parent, s = 1) => {
    const sg = g(parent, { transform: `scale(${s})` });
    [-24, 24].forEach((x) => { X.svg('ellipse', { cx: x, cy: -6, rx: 24, ry: 30, fill: 'none', stroke: C.ink, 'stroke-width': 20 }, sg); X.svg('ellipse', { cx: x, cy: -6, rx: 24, ry: 30, fill: 'none', stroke: '#d8473c', 'stroke-width': 12 }, sg); });
    const A = g(sg), B = g(sg);
    const sa = K.tf(A, { x: 0, y: 30, r: 0 }), sb = K.tf(B, { x: 0, y: 30, r: 0 });
    sp(A, 'M-5,0 L10,0 L4,250 Q0,264 -5,248Z', '#e6e9f1', 'side');
    sp(B, 'M5,0 L-10,0 L-4,250 Q0,264 5,248Z', '#c6cbd9', 'side');
    X.svg('circle', { cx: 0, cy: 30, r: 8, fill: C.ink }, sg);
    return { g: sg, snip: (t) => {
      X.tl.fromTo(sa, { r: 0 }, { r: -16, duration: 0.12, ease: 'power2.out', immediateRender: false }, t - 0.2);
      X.tl.fromTo(sb, { r: 0 }, { r: 16, duration: 0.12, ease: 'power2.out', immediateRender: false }, t - 0.2);
      X.tl.to(sa, { r: 0, duration: 0.06, ease: 'power3.in' }, t - 0.06); X.tl.to(sb, { r: 0, duration: 0.06, ease: 'power3.in' }, t - 0.06);
      X.sfx(t, 'click', { gain: 0.6 });
    } };
  };
  /** prize rosette (scalloped disc + tails) with an optional label banner above or below */
  K.rosette = (L, x, y, s = 1, label = 'RE-ELECTED', o = {}) => {
    const rg = g(L, { transform: `translate(${x} ${y}) scale(${s})` });
    const col = o.color || C.signBlue;
    sp(rg, 'M-30,20 L-74,176 L-44,156 L-24,186 L0,30Z', col, 'flat'); sp(rg, 'M30,20 L74,176 L44,156 L24,186 L0,30Z', K.shade(col, 0.4), 'flat');
    const n = 24, pts = Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? 76 : 90; return `${f2(Math.cos(a) * r)},${f2(Math.sin(a) * r)}`; }).join(' ');
    X.svg('polygon', { points: pts, fill: K.paint(col, 'sphere'), ...OUT }, rg);
    se(rg, 0, 0, 58, 58, C.gold, 'sphere');
    X.svg('path', { d: 'M0,-34 L10,-10 L36,-10 L15,6 L23,32 L0,16 L-23,32 L-15,6 L-36,-10 L-10,-10Z', fill: '#fff3c4', stroke: C.ink, 'stroke-width': 3 }, rg);
    if (label) { const by = o.above ? -170 : 100; sr(rg, -170, by, 340, 70, '#fffdf6', 'vert', 10); txt(rg, 0, by + 50, label, { size: 44, font: 'Montserrat', weight: 900, fill: C.red }); }
    return rg;
  };
})();
