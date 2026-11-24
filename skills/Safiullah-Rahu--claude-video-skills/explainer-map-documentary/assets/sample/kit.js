/* map-documentary kit — "plans as physical objects in a dark studio", 3D faked with CSS perspective.
 *
 * Load after the engine (explainer.js) and data/geo.js (window.GEO: Natural Earth outlines projected to plate units).
 *   K.init(X, {bar})          2:1 letterboxed viewport (perspective camera) + DOF bands, vignette, grain, bars
 *   K.set(name, {bg})         a 3D set; only the active shot's set is displayed
 *   K.shot(set, t0, t1, {from, to | keys, ease, e})   camera shot (hard cut at t0). cam = {x,y,z,rx,rz,d,lens,dof}
 *        x/y/z look-at point in set coords · rx tilt (0 top-down, 60–70 low angle, 90 eye level) · rz orbit ·
 *        d dolly toward the target (px) · lens = CSS perspective px · dof 0..1 tilt-shift blur strength
 *        keys: [{t: secondsFromShotStart, ...cam, ease}] for a multi-move shot
 *   K.on(fn(t)) per-frame updater · K.ramp(t, t0, dur, ease) 0..1 · K.within(t, a, b)
 * Builders (all return handles with setters you drive from K.on):
 *   K.floor · K.shadow · K.box · K.vplane · K.flat · K.g3
 *   K.plate (black acrylic map plate) · K.extrude (stacked-copy extrusion) · K.extrudeStroke · K.neon · K.label · K.legend
 *   K.terrain (procedural aerial tile) · K.gallery (corridor, lights on/off) · K.frame3d (framed print)
 *   K.claySea · K.windmill · K.archival (2D B&W plate) · K.endCard
 * Everything is a pure function of time; randomness only through X.rand(seed).
 */
(function () {
  const K = (window.K = {});
  K.ups = []; K.shots = []; K.sets = {}; K.setBg = {};
  K.on = (f) => (K.ups.push(f), f);
  K.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const EC = {};
  K.ease = (n) => EC[n] || (EC[n] = gsap.parseEase(n));
  K.ramp = (t, t0, dur, ease = 'power2.inOut') => K.ease(ease)(K.clamp((t - t0) / Math.max(dur, 1e-6)));
  K.mix = (a, b, u) => a + (b - a) * u;
  K.within = (t, a, b) => t >= a - 0.05 && t <= b + 0.05;
  let UID = 0;
  K.uid = (p = 'k') => p + ++UID;

  // ------------------------------------------------------------------ DOM helpers
  K.div = (style = {}, parent, cls) => {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.style.position = 'absolute';
    Object.assign(d.style, style);
    if (parent) parent.appendChild(d);
    return d;
  };
  const NS = 'http://www.w3.org/2000/svg';
  K.s = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === 'text') e.textContent = v; else e.setAttribute(k, v); }
    if (parent) parent.appendChild(e);
    return e;
  };
  /** Horizontal plane (lies in the parent's xy plane) at (x, y, z). */
  K.flat = (parent, { x = 0, y = 0, z = 0, w, h, rz = 0, style = {} } = {}) => {
    const d = K.div({ left: '0px', top: '0px', width: w + 'px', height: h + 'px', transformOrigin: '0 0', ...style }, parent);
    d.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateZ(${rz}deg)`;
    return d;
  };
  /** Vertical plane standing on the parent plane: starts at (x, y, z), runs w along direction rz (0 = +x),
   *  h tall; its front faces +y rotated by rz (rz 0 → faces +y, i.e. toward a camera at larger y). */
  K.vplane = (parent, { x = 0, y = 0, z = 0, w, h, rz = 0, style = {} } = {}) => {
    const d = K.div({ left: '0px', top: '0px', width: w + 'px', height: h + 'px', transformOrigin: '0 0', ...style }, parent);
    d.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateZ(${rz}deg) translate3d(0,0,${h}px) rotateX(-90deg)`;
    return d;
  };
  K.g3 = (parent, { x = 0, y = 0, z = 0, rz = 0, s = 1 } = {}) => {
    const d = K.div({ left: '0px', top: '0px', width: '0px', height: '0px', transformStyle: 'preserve-3d', transformOrigin: '0 0' }, parent);
    d.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateZ(${rz}deg) scale3d(${s},${s},${s})`;
    return d;
  };
  K.focus = () => GEO[GEO.focus || 'nl'];                       // subject country path (extract_geo.py sets GEO.focus)
  K.others = () => (GEO.others || ['uk', 'fr', 'be', 'de']).filter((k) => GEO[k]);
  K.proj = (lon, lat) => [(lon - GEO.bbox[0]) * GEO.kx * GEO.scale, (GEO.bbox[3] - lat) * GEO.scale];

  // ------------------------------------------------------------------ viewport, camera, overlays
  K.init = (X, o = {}) => {
    K.X = X;
    K.BAR = o.bar ?? 60;
    K.VW = 1920; K.VH = 1080 - 2 * K.BAR;
    const st = X.stage;
    st.style.background = '#000';
    K.vp = K.div({ left: '0px', top: K.BAR + 'px', width: K.VW + 'px', height: K.VH + 'px', overflow: 'hidden',
      background: o.bg || '#0b0a0b', perspective: '1200px', perspectiveOrigin: '50% 50%' }, st);
    K.cam = K.div({ left: K.VW / 2 + 'px', top: K.VH / 2 + 'px', width: '0px', height: '0px', transformStyle: 'preserve-3d' }, K.vp);
    const band = (top, hgt) => K.div({ left: '0px', [top ? 'top' : 'bottom']: '0px', width: '100%', height: hgt,
      WebkitMaskImage: `linear-gradient(to ${top ? 'bottom' : 'top'}, #000 0%, rgba(0,0,0,.8) 35%, transparent 100%)`,
      maskImage: `linear-gradient(to ${top ? 'bottom' : 'top'}, #000 0%, rgba(0,0,0,.8) 35%, transparent 100%)` }, K.vp);
    K.dofTop = band(true, '44%'); K.dofBot = band(false, '32%');
    K.vig = K.div({ left: '0px', top: '0px', width: '100%', height: '100%',
      background: 'radial-gradient(ellipse 80% 85% at 50% 48%, rgba(0,0,0,0) 56%, rgba(0,0,0,.3) 82%, rgba(0,0,0,.62) 100%)' }, K.vp);
    K.fade = K.div({ left: '0px', top: '0px', width: '100%', height: '100%', background: '#000', opacity: 0 }, K.vp);
    st.appendChild(X.root);                                   // 2D layer (archival plates, end card) above the 3D lens
    X.root.style.clipPath = `inset(${K.BAR}px 0 ${K.BAR}px 0)`;
    if (o.grain !== false) X.grain(o.grain ?? 0.06, 24);
    for (const top of [true, false])
      K.div({ left: '0px', [top ? 'top' : 'bottom']: '0px', width: '1920px', height: K.BAR + 'px', background: '#000', zIndex: 80 }, st);
    X.every((t) => K.frame(t));
  };

  K.set = (name, o = {}) => {
    const d = K.div({ left: '0px', top: '0px', width: '0px', height: '0px', transformStyle: 'preserve-3d', display: 'none' }, K.cam);
    K.sets[name] = d; K.setBg[name] = o.bg || '#0b0a0b';
    return d;
  };

  /** camera drift profile: linear with eased ends (fraction e of the shot at each end) */
  K.drift = (u, e = 0.08) => {
    u = K.clamp(u);
    if (e <= 0) return u;
    const k = 1 / (2 * e * (1 - e));
    if (u < e) return u * u * k;
    if (u > 1 - e) return 1 - (1 - u) * (1 - u) * k;
    return (u - e / 2) / (1 - e);
  };
  const CAM0 = { x: 0, y: 0, z: 0, rx: 60, rz: 0, d: 0, lens: 1200, dof: 0.6 };
  K.shot = (set, t0, t1, o = {}) => {
    let keys;
    if (o.keys) {
      let prev = { ...CAM0 };
      keys = o.keys.map((k) => (prev = { ...prev, ...k }));
    } else {
      const from = { ...CAM0, ...(o.from || {}) }, to = { ...from, ...(o.to || {}) };
      keys = [{ ...from, t: 0 }, { ...to, t: t1 - t0, ease: o.ease || null, e: o.e ?? 0.06 }];
    }
    const s = { set, t0, t1, keys };
    K.shots.push(s); K.shots.sort((a, b) => a.t0 - b.t0);
    return s;
  };
  K.camAt = (s, t) => {
    const lt = t - s.t0, ks = s.keys;
    let i = 1;
    while (i < ks.length - 1 && lt > ks[i].t) i++;
    const a = ks[i - 1], b = ks[i];
    const u = K.clamp((lt - a.t) / Math.max(1e-6, b.t - a.t));
    const v = b.ease ? K.ease(b.ease)(u) : K.drift(u, b.e ?? 0.06);
    const c = {};
    for (const k of Object.keys(CAM0)) c[k] = K.mix(a[k], b[k], v);
    return c;
  };
  let lastSet = null;
  K.frame = (t) => {
    let s = null;
    for (const x of K.shots) if (t >= x.t0 - 1e-6) s = x;
    if (s && s.set !== lastSet) {
      for (const [n, d] of Object.entries(K.sets)) d.style.display = n === s.set ? 'block' : 'none';
      K.vp.style.background = K.setBg[s.set] || '#0b0a0b';
      lastSet = s.set;
    }
    if (s) {
      const c = K.camAt(s, t);
      K.c = c; K.now = s;
      K.vp.style.perspective = c.lens + 'px';
      K.cam.style.transform = `translateZ(${c.d}px) rotateX(${c.rx}deg) rotateZ(${c.rz}deg) translate3d(${-c.x}px,${-c.y}px,${-c.z}px)`;
      const b = Math.max(0, c.dof) * 7;
      const f1 = b > 0.2 ? `blur(${b.toFixed(1)}px)` : 'none', f2 = b > 0.2 ? `blur(${(b * 0.8).toFixed(1)}px)` : 'none';
      K.dofTop.style.backdropFilter = f1; K.dofTop.style.webkitBackdropFilter = f1;
      K.dofBot.style.backdropFilter = f2; K.dofBot.style.webkitBackdropFilter = f2;
    }
    for (const f of K.ups) f(t);
  };

  // ------------------------------------------------------------------ studio floor, shadows, boxes
  // NOTE: keep planes under ~6000 px — larger CSS-3D layers silently fail to rasterize in headless Edge (black floor)
  K.floor = (set, { x = 0, y = 0, size = 5000, c0 = '#93a0a6', c1 = '#62717a', c2 = '#2f3d49', c3 = '#151c22', z = -1, spread = 1.6, sx = 1 } = {}) =>
    K.flat(set, { x: x - size * sx / 2, y: y - size / 2, z, w: size * sx, h: size, style: {               // c3 must be reached
      background: `radial-gradient(ellipse at 50% 50%, ${c0} 0%, ${c1} ${14 * Math.min(spread, 1.45)}%, ${c2} ${30 * Math.min(spread, 1.45)}%, ${c3} ${48 * Math.min(spread, 1.45)}%)` } });  // before the edge midpoints (70 %)
  K.shadow = (set, { x, y, w, h, op = 0.55, spread = 60, z = 0 }) =>
    K.flat(set, { x: x - spread, y: y - spread, z, w: w + 2 * spread, h: h + 2 * spread, style: {
      background: `radial-gradient(closest-side, rgba(0,0,0,${op}) 62%, rgba(0,0,0,0) 100%)` } });

  /** Clay / white-model colour set and acrylic plate colours */
  K.CLAY = { top: '#eef0f1', s: '#d3d7db', e: '#bcc2c8', n: '#a8afb6', w: '#c8cdd2' };
  K.DARK = { top: '#262322', s: '#1a1817', e: '#141211', n: '#100f0e', w: '#171514' };

  /** CSS box on its parent plane: footprint (x, y, w, d) at base z, height h; faces t/s/e/n/w (s faces +y).
   *  Returns {g, F, setH(h)}. Colours: {top, s, e, n, w} (strings: colour or CSS background). */
  K.box = (parent, { x = 0, y = 0, z = 0, w, d, h, rz = 0, c = K.CLAY, faces = 'tsenw', edge = null } = {}) => {
    const g = K.g3(parent, { x, y, z, rz });
    const F = {};
    const mk = (k, W, H, bg) => { F[k] = K.div({ left: '0px', top: '0px', width: W + 'px', height: H + 'px', transformOrigin: '0 0', background: bg }, g); };
    if (faces.includes('n')) mk('n', w, h, c.n);
    if (faces.includes('w')) mk('w', d, h, c.w);
    if (faces.includes('e')) mk('e', d, h, c.e);
    if (faces.includes('s')) mk('s', w, h, c.s);
    if (faces.includes('t')) mk('t', w, d, c.top);
    if (edge && F.t) F.t.style.boxShadow = `inset 0 0 0 1px ${edge}`;
    const box = { g, F, h };
    box.setH = (hh) => {
      g.style.visibility = hh <= 0.06 ? 'hidden' : 'visible';
      hh = Math.max(0.05, hh); box.h = hh;
      if (F.t) F.t.style.transform = `translateZ(${hh}px)`;
      if (F.s) { F.s.style.height = hh + 'px'; F.s.style.transform = `translate3d(0,${d}px,${hh}px) rotateX(-90deg)`; }
      if (F.n) { F.n.style.height = hh + 'px'; F.n.style.transform = `translate3d(${w}px,0,${hh}px) rotateZ(180deg) rotateX(-90deg)`; }
      if (F.e) { F.e.style.height = hh + 'px'; F.e.style.transform = `translate3d(${w}px,${d}px,0) rotateZ(-90deg) translate3d(0,0,${hh}px) rotateX(-90deg)`; }
      if (F.w) { F.w.style.height = hh + 'px'; F.w.style.transform = `rotateZ(90deg) translate3d(0,0,${hh}px) rotateX(-90deg)`; }
    };
    box.setH(h);
    return box;
  };

  // ------------------------------------------------------------------ map plates
  const P = {
    acrylic: '#131519', acrylicEdge: '#0a0b0d', bevel: '#6a6e76',
    land: '#ebb198', landFar: '#cf9178', landSide: '#83594b', other: '#2d2b30', otherLine: '#676168',
    coast: '#ffffff', river: 'rgba(255,240,232,.5)', label: '#ffffff',
    yellow: '#e2c25a', yellowSide: '#8c7431', maroon: '#8e2335', maroonSide: '#4a0e1a', orange: '#ff9a3c',
    neon: '#ff8a2a', neonCore: '#fff0dc',
  };
  K.P = P;

  /** An SVG in plate coordinates (optionally cropped to bbox [x0,y0,x1,y1]) lying at height z on the plate. */
  K.plateSVG = (parent, plate, { z = 0, bbox = null } = {}) => {
    const [x0, y0, x1, y1] = bbox || [0, 0, plate.W, plate.H];
    const holder = K.flat(parent, { x: x0, y: y0, z, w: x1 - x0, h: y1 - y0 });
    const svg = K.s('svg', { width: x1 - x0, height: y1 - y0, viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}` }, holder);
    svg.style.overflow = 'visible'; svg.style.position = 'absolute';
    const defs = K.s('defs', {}, svg);
    return { holder, svg, defs, bbox: [x0, y0, x1, y1], z };
  };

  /** Black acrylic plate of GEO (W×H units, thickness T) centred at (cx, cy) of a set; s = uniform scale. */
  K.plate = (set, { cx = 0, cy = 0, s = 1, T = 16, other = true, rivers = true, labels = [], shadow = true, landLift = 4, sheen = true } = {}) => {
    const W = GEO.W, H = GEO.H;
    const g = K.g3(set, { x: cx, y: cy, s });
    const root = K.g3(g, { x: -W / 2, y: -H / 2 });
    const plate = { g, root, W, H, T, cx, cy, s };
    if (shadow) K.shadow(root, { x: 0, y: 0, w: W, h: H, op: 0.65, spread: 110 });
    const slab = K.box(root, { x: 0, y: 0, z: 0, w: W, d: H, h: T, c: {
      top: P.acrylic, s: `linear-gradient(to bottom, ${P.bevel} 0, #2a2a2e 2px, ${P.acrylicEdge} 100%)`,
      n: P.acrylicEdge, e: `linear-gradient(to bottom, #3a3b40 0, #18181b 2px, ${P.acrylicEdge})`, w: `linear-gradient(to bottom, #44454a 0, #1d1d20 2px, ${P.acrylicEdge})` } });
    slab.F.t.style.background = `linear-gradient(165deg, #1a1d22 0%, ${P.acrylic} 45%, #0d0f12 100%)`;
    slab.F.t.style.boxShadow = `inset 0 0 0 2px ${P.bevel}`;
    if (sheen) {
      const sh = K.flat(root, { x: 0, y: 0, z: T + 0.2, w: W, h: H, style: {
        background: 'linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.075) 46%, rgba(255,255,255,0) 62%)', backgroundSize: '320% 100%' } });
      K.on(() => { if (K.c) sh.style.backgroundPosition = `${(50 + K.c.rz * 1.6 + K.c.x * 0.02).toFixed(1)}% 0`; });
    }
    const base = K.plateSVG(root, plate, { z: T + 0.5 });
    if (other) for (const k of K.others())
      K.s('path', { d: GEO[k], fill: P.other, stroke: P.otherLine, 'stroke-width': 1, 'fill-rule': 'evenodd' }, base.svg);
    const side = K.plateSVG(root, plate, { z: T + 1.2 });
    K.s('path', { d: K.focus(), fill: P.landSide }, side.svg);
    K.s('path', { d: GEO.lakes, fill: P.acrylic, 'fill-rule': 'evenodd' }, side.svg);
    const top = K.plateSVG(root, plate, { z: T + landLift });
    const gid = K.uid('lg');
    const lg = K.s('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0.25, y2: 1 }, top.defs);
    K.s('stop', { offset: 0, 'stop-color': P.landFar }, lg); K.s('stop', { offset: 1, 'stop-color': P.land }, lg);
    K.s('path', { d: K.focus(), fill: `url(#${gid})`, stroke: P.coast, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, top.svg);
    K.s('path', { d: GEO.lakes, fill: P.acrylic, 'fill-rule': 'evenodd', stroke: P.coast, 'stroke-width': 1.3 }, top.svg);
    if (rivers) for (const d of Object.values(GEO.rivers)) K.s('path', { d, fill: 'none', stroke: P.river, 'stroke-width': 1.1 }, top.svg);
    Object.assign(plate, { slab, base, top, side, zTop: T + landLift });
    plate.layer = (z = 0.6, bbox) => K.plateSVG(root, plate, { z: plate.zTop + z, bbox });
    plate.w = (px, py) => [cx + (px - W / 2) * s, cy + (py - H / 2) * s];      // plate units → set coords
    plate.pt = (k) => plate.w(...GEO.pts[k]);
    plate.labels = plate.layer(0.6);
    plate.labelEls = labels.map((L) => K.label(plate.labels.svg, L));
    return plate;
  };

  /** Small white caps label, wide tracking, printed on a plate layer. at: GEO.pts key or [x, y]. */
  K.label = (svg, { at, text, dx = 0, dy = 0, size = 17, anchor = 'middle', fill = P.label, op = 1, weight = 600, spacing = 0.28, rot = 0 }) => {
    const [x, y] = typeof at === 'string' ? GEO.pts[at] : at;
    const e = K.s('text', { x: x + dx, y: y + dy, 'text-anchor': anchor, 'font-family': 'Montserrat', 'font-weight': weight,
      'font-size': size, 'letter-spacing': size * spacing, fill, opacity: op, text: text.toUpperCase() }, svg);
    if (rot) e.setAttribute('transform', `rotate(${rot} ${x + dx} ${y + dy})`);
    return e;
  };
  /** Colour-key legend printed on the plate's lower-left corner. rows: [{color, text}] → [<g>] (fade them in). */
  K.legend = (plate, { rows, x = 64, y = null, size = 24 }) => {
    const L = plate.layer(0.6);
    const y0 = y ?? plate.H - 64 - (rows.length - 1) * size * 1.6;
    return rows.map((r, i) => {
      const g = K.s('g', { transform: `translate(${x},${y0 + i * size * 1.6})` }, L.svg);
      K.s('rect', { x: 0, y: -size * 0.66, width: size * 0.66, height: size * 0.66, fill: r.color }, g);
      K.s('text', { x: size * 1.05, y: 0, 'font-family': 'Montserrat', 'font-weight': 500, 'font-size': size, fill: r.color, text: r.text }, g);
      return g;
    });
  };

  /** Extrusion from stacked copies of a path (plate units). mask {white:[d], black:[d]} cuts holes (evenodd).
   *  Returns {setH(h)}; layer i sits at zTop + h·i/(n-1). Top layer = top colour (+ optional hatch). */
  K.extrude = (plate, { d, mask = null, bbox = null, n = 10, h = 30, top = P.yellow, side = P.yellowSide, edge = null, hatch = null, z0 = null, sw = 2.2 }) => {
    const bb0 = bbox || K.bbox(d), pad = 6;
    const bb = [bb0[0] - pad, bb0[1] - pad, bb0[2] + pad, bb0[3] + pad];
    const layers = [];
    for (let i = 0; i < n; i++) {
      const L = K.plateSVG(plate.root, plate, { z: 0, bbox: bb });
      const isTop = i === n - 1;
      let mid = null;
      if (mask) {
        mid = K.uid('m');
        const m = K.s('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: bb[0], y: bb[1], width: bb[2] - bb[0], height: bb[3] - bb[1] }, L.defs);
        (mask.white || [d]).forEach((p) => K.s('path', { d: p, fill: '#fff' }, m));
        (mask.black || []).forEach((p) => K.s('path', { d: p, fill: '#000', 'fill-rule': 'evenodd' }, m));
      }
      const col = isTop ? top : side;
      const path = K.s('path', { d, fill: col, stroke: isTop ? (edge || col) : col, 'stroke-width': isTop ? (edge ? 1.4 : 0.5) : sw, 'stroke-linejoin': 'round' }, L.svg);
      if (mid) path.setAttribute('mask', `url(#${mid})`);
      if (isTop && hatch) {
        const pid = K.uid('h');
        const pat = K.s('pattern', { id: pid, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, L.defs);
        K.s('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: hatch, 'stroke-width': 1.5 }, pat);
        const hp = K.s('path', { d, fill: `url(#${pid})` }, L.svg);
        if (mid) hp.setAttribute('mask', `url(#${mid})`);
        L.hatch = hp;
      }
      if (!isTop) L.holder.style.filter = `brightness(${(0.62 + 0.38 * (i / (n - 1))).toFixed(2)})`;
      layers.push(L);
    }
    const base = z0 ?? plate.zTop;
    const ex = { layers, top: layers[n - 1], h };
    ex.setH = (hh) => {
      ex.h = hh;
      layers.forEach((L, i) => {
        L.holder.style.transform = `translate3d(${bb[0]}px,${bb[1]}px,${(base + 0.3 + hh * (i / (n - 1))).toFixed(2)}px)`;
        L.holder.style.visibility = (hh < 0.3 && i < n - 1) ? 'hidden' : 'visible';
      });
    };
    ex.show = (v) => layers.forEach((L) => (L.holder.style.display = v ? 'block' : 'none'));
    ex.setH(h);
    return ex;
  };
  /** Extruded wall following a stroked path (e.g. a coast defence line). maskBlack: paths removed (stroked wide). */
  K.extrudeStroke = (plate, { d, width = 4, maskBlack = [], cut = 10, n = 8, h = 10, top = '#2a2725', side = '#141211', z0 = null }) => {
    const layers = [];
    for (let i = 0; i < n; i++) {
      const L = K.plateSVG(plate.root, plate, { z: 0 });
      const mid = K.uid('ms');
      const m = K.s('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: plate.W, height: plate.H }, L.defs);
      K.s('rect', { x: 0, y: 0, width: plate.W, height: plate.H, fill: '#fff' }, m);
      maskBlack.forEach((p) => K.s('path', { d: p, fill: '#000', stroke: '#000', 'stroke-width': cut }, m));
      const col = i === n - 1 ? top : side;
      K.s('path', { d, fill: 'none', stroke: col, 'stroke-width': width, 'stroke-linejoin': 'round', mask: `url(#${mid})` }, L.svg);
      if (i < n - 1) L.holder.style.filter = `brightness(${(0.7 + 0.3 * i / (n - 1)).toFixed(2)})`;
      layers.push(L);
    }
    const base = z0 ?? plate.zTop;
    const ex = { layers };
    ex.setH = (hh) => layers.forEach((L, i) => {
      L.holder.style.transform = `translate3d(0px,0px,${(base + 0.4 + hh * i / (n - 1)).toFixed(2)}px)`;
      L.holder.style.visibility = hh < 0.3 ? 'hidden' : 'visible';
    });
    ex.setH(h);
    return ex;
  };
  K.bbox = (d) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const m of d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
      const x = +m[1], y = +m[2];
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
  };

  /** Emissive orange neon tube along a path in an SVG layer. set(u, glow) grows it 0..1 with a hot leading tip. */
  K.neon = (layer, d, { width = 3, glow = 14, color = P.neon, core = P.neonCore } = {}) => {
    const svg = layer.svg || layer, defs = layer.defs || svg.querySelector('defs');
    const g = K.s('g', {}, svg);
    const fid = K.uid('ng');
    const f = K.s('filter', { id: fid, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    K.s('feGaussianBlur', { stdDeviation: glow / 2.4 }, f);
    const bloom = K.s('path', { d, fill: 'none', stroke: color, 'stroke-width': glow, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: `url(#${fid})` }, g);
    const tube = K.s('path', { d, fill: 'none', stroke: color, 'stroke-width': width * 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const hot = K.s('path', { d, fill: 'none', stroke: core, 'stroke-width': width * 0.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const tip = K.s('circle', { r: glow * 0.8, fill: core, filter: `url(#${fid})`, opacity: 0 }, g);
    const L = tube.getTotalLength();
    const neon = { g, L };
    neon.set = (u, glowMul = 1) => {
      u = K.clamp(u);
      for (const p of [bloom, tube, hot]) { p.style.strokeDasharray = `${(L * u + 0.01).toFixed(2)} ${L + 60}`; }
      bloom.style.opacity = (0.85 * glowMul).toFixed(3);
      if (u > 0.001 && u < 0.999) { const q = tube.getPointAtLength(L * u); tip.setAttribute('cx', q.x); tip.setAttribute('cy', q.y); tip.style.opacity = 0.95; }
      else tip.style.opacity = 0;
      g.style.visibility = u <= 0.001 ? 'hidden' : 'visible';
    };
    neon.set(0);
    return neon;
  };

  /** Marker ring + leader + two-line label printed flat on a plate layer; set(u) reveals it. */
  K.marker = (layer, { at, text, sub = '', dx = 40, dy = -40, size = 18, color = '#fff' }) => {
    const [x, y] = typeof at === 'string' ? GEO.pts[at] : at;
    const g = K.s('g', {}, layer.svg);
    const ring = K.s('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: color, 'stroke-width': 2 }, g);
    const dot = K.s('circle', { cx: x, cy: y, r: 2.6, fill: color }, g);
    const pulse = K.s('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: color, 'stroke-width': 1.5 }, g);
    const lead = K.s('path', { d: `M${x + 6},${y - 6}L${x + dx},${y + dy}L${x + dx + 16},${y + dy}`, fill: 'none', stroke: color, 'stroke-width': 1.2 }, g);
    const t1 = K.s('text', { x: x + dx + 22, y: y + dy + size * 0.35, 'font-family': 'Montserrat', 'font-weight': 600, 'font-size': size, 'letter-spacing': size * 0.22, fill: color, text: text.toUpperCase() }, g);
    const t2 = K.s('text', { x: x + dx + 22, y: y + dy + size * 1.6, 'font-family': 'Montserrat', 'font-weight': 500, 'font-size': size * 0.82, 'letter-spacing': size * 0.12, fill: color, opacity: 0.8, text: sub.toUpperCase() }, g);
    const m = { g };
    m.set = (u, tt = 0) => {
      g.style.opacity = K.clamp(u * 3);
      ring.setAttribute('r', (7 * K.ease('back.out(3)')(K.clamp(u * 2))).toFixed(2));
      const pu = (((tt % 1.6) + 1.6) % 1.6) / 1.6;
      pulse.setAttribute('r', (7 + pu * 22).toFixed(2)); pulse.style.opacity = (u >= 1 ? 0.8 * (1 - pu) : 0).toFixed(2);
      lead.style.strokeDasharray = `${(80 * K.clamp(u * 1.5 - 0.2)).toFixed(1)} 200`;
      t1.style.opacity = K.clamp(u * 2 - 0.8); t2.style.opacity = 0.8 * K.clamp(u * 2 - 1);
    };
    m.set(0);
    return m;
  };

  // ------------------------------------------------------------------ procedural aerial terrain tile
  const CITIES = [   // [lon, lat, size] — real town locations (default: the Low Countries and the Rhine–Ruhr); pass your own
    [4.90, 52.37, 13], [4.48, 51.92, 12], [4.30, 52.08, 10], [5.12, 52.09, 9], [5.47, 51.44, 8], [6.57, 53.22, 7],
    [5.09, 51.56, 6], [5.22, 52.37, 6], [4.78, 51.59, 6], [5.86, 51.84, 6], [5.91, 51.98, 6], [4.64, 52.38, 6], [6.89, 52.22, 6],
    [6.09, 52.51, 5], [5.80, 53.20, 5], [4.40, 51.22, 10], [4.35, 50.85, 12], [3.72, 51.05, 8], [6.96, 50.94, 12],
    [6.78, 51.23, 10], [7.01, 51.46, 11], [7.47, 51.51, 10], [6.76, 51.43, 9], [7.63, 51.96, 7], [8.80, 53.08, 9], [3.22, 51.21, 5]];
  /** Terrain chunk: textured top (fields, towns, rivers on matte water), earthy sides, floating on the floor. */
  K.terrain = (set, { cx = 0, cy = 0, T = 30, res = 1.4, seed = 5, cities = CITIES } = {}) => {
    const W = GEO.W, H = GEO.H, X = K.X;
    const c = document.createElement('canvas'); c.width = Math.round(W * res); c.height = Math.round(H * res);
    const g = c.getContext('2d'); g.scale(res, res);
    const r = X.rand(seed);
    const sea = g.createLinearGradient(0, 0, W * 0.4, H);
    sea.addColorStop(0, '#4a4641'); sea.addColorStop(1, '#625c54');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 46; i++) {                          // soft dark blotches on the water (depth shading)
      const x = r() * W, y = r() * H, rad = 60 + r() * 200;
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, `rgba(24,22,20,${0.12 + r() * 0.12})`); rg.addColorStop(1, 'rgba(24,22,20,0)');
      g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 9000; i++) {                        // fine speckle so the water is never flat
      const v = r() < 0.5 ? 'rgba(255,250,240,.035)' : 'rgba(0,0,0,.05)';
      g.fillStyle = v; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 2);
    }
    // coarse orientation field for parcels
    const AG = 150, angs = [0, Math.PI / 2, 0.52, -1.05, 0.26, 1.83, -0.35];
    const cols = Math.ceil(W / AG) + 1, ang = Array.from({ length: cols * (Math.ceil(H / AG) + 1) }, () => angs[Math.floor(r() * angs.length)]);
    const angAt = (x, y) => ang[Math.floor(y / AG) * cols + Math.floor(x / AG)];
    const paint = (d, pal, B = 30, strip = [3, 8]) => {
      const p = new Path2D(d), [x0, y0, x1, y1] = K.bbox(d);
      g.save(); g.clip(p);
      g.fillStyle = pal[0]; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let by = Math.max(0, y0 - B); by < Math.min(H, y1 + B); by += B)
        for (let bx = Math.max(0, x0 - B); bx < Math.min(W, x1 + B); bx += B) {
          g.save(); g.translate(bx + B / 2, by + B / 2); g.rotate(angAt(bx, by));
          let x = -B * 0.78;
          while (x < B * 0.78) { const w = strip[0] + r() * (strip[1] - strip[0]); g.fillStyle = pal[1 + Math.floor(r() * (pal.length - 1))]; g.fillRect(x, -B * 0.78, w - 0.5, B * 1.56); x += w; }
          g.restore();
        }
      g.restore();
    };
    const nbr = ['#3a4628', '#43502d', '#4e5934', '#354029', '#565c38', '#454a2e', '#5e5e3e', '#636046'];
    for (const k of K.others()) paint(GEO[k], nbr, 30, [3, 9]);
    paint(K.focus(), ['#76874c', '#80924f', '#91a05a', '#6c7f3f', '#a2a660', '#b3ad6b', '#8b8152', '#7a904c', '#c0b877', '#677c40', '#9a966c'], 16, [1.4, 4.2]);
    // forests/relief shading on the neighbours (darker blotches), lighter dunes along the coast
    g.save(); g.clip(new Path2D(K.others().map((k) => GEO[k]).join('')));
    for (let i = 0; i < 160; i++) {
      const x = 800 + r() * 900, y = 500 + r() * 800, rad = 20 + r() * 70;
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(25,35,20,.35)'); rg.addColorStop(1, 'rgba(25,35,20,0)');
      g.fillStyle = rg; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
    }
    g.restore();
    g.save(); g.clip(new Path2D(K.focus())); g.strokeStyle = 'rgba(196,184,150,.85)'; g.lineWidth = 6; g.stroke(new Path2D(K.focus())); g.restore();
    // water bodies
    g.fillStyle = '#4c4843'; g.fill(new Path2D(GEO.lakes), 'evenodd');
    g.strokeStyle = '#4a4641'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [n, d] of Object.entries(GEO.rivers)) { g.lineWidth = ['Waal', 'Rhine', 'Lek', 'Maas', 'Schelde'].includes(n) ? 3.2 : 2.2; g.stroke(new Path2D(d)); }
    g.strokeStyle = 'rgba(255,248,235,.22)'; g.lineWidth = 0.9;
    for (const k of K.others()) g.stroke(new Path2D(GEO[k]));
    // towns: clusters of grey blocks
    for (const [lon, lat, sz] of cities) {
      const [x, y] = K.proj(lon, lat);
      for (let i = 0; i < sz * 26; i++) {
        const a = r() * 6.283, rr = Math.pow(r(), 0.7) * sz * 2.6;
        const v = 96 + Math.floor(r() * 60);
        g.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.6 + r() * 0.35})`;
        g.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8, 1.5 + r() * 3, 1.5 + r() * 3);
      }
    }
    // global light: brighter toward the camera side
    const lgt = g.createLinearGradient(0, 0, 0, H);
    lgt.addColorStop(0, 'rgba(0,0,0,.18)'); lgt.addColorStop(0.6, 'rgba(255,250,240,0)'); lgt.addColorStop(1, 'rgba(255,250,240,.05)');
    g.fillStyle = lgt; g.fillRect(0, 0, W, H);

    const root = K.g3(K.g3(set, { x: cx, y: cy }), { x: -W / 2, y: -H / 2 });
    K.shadow(root, { x: 0, y: 0, w: W, h: H, op: 0.6, spread: 120 });
    const soil = { top: '#000', s: 'linear-gradient(to bottom, #8a7a62 0, #4a3b2c 3px, #2a2119 60%, #17120e 100%)',
      e: 'linear-gradient(to bottom, #6c5f4d 0, #3a2e23 3px, #1d1712 100%)', n: '#120e0b', w: 'linear-gradient(to bottom, #7a6c58 0, #42352a 3px, #201913 100%)' };
    const slab = K.box(root, { x: 0, y: 0, w: W, d: H, h: T, c: soil });
    slab.F.t.style.background = 'none';
    c.style.width = W + 'px'; c.style.height = H + 'px'; c.style.position = 'absolute';
    slab.F.t.appendChild(c);
    const tile = { root, W, H, T, cx, cy, canvas: c };
    tile.w = (px, py) => [cx + px - W / 2, cy + py - H / 2];
    tile.pt = (k) => tile.w(...GEO.pts[k]);
    tile.layer = (z = 0.6, bbox) => K.plateSVG(root, { W, H }, { z: T + z, bbox });
    tile.plateLike = { root, W, H, zTop: T };
    return tile;
  };

  // ------------------------------------------------------------------ gallery corridor
  /** Dark corridor along -y: width w, height h, length L, nRows ceiling panels. Returns {setLights(t→0..1 per row), end}. */
  K.gallery = (set, { w = 760, h = 430, L = 2800, rows = 6, y0 = 300 } = {}) => {
    const g = K.g3(set, {});
    const segL = L / rows;
    const segs = [];
    for (let i = 0; i < rows; i++) {
      const ys = y0 - i * segL;                     // segment spans [ys - segL, ys]
      const floor = K.flat(g, { x: -w / 2, y: ys - segL, z: 0, w, h: segL, style: {
        background: 'linear-gradient(to right, #121213, #232325 50%, #121213)' } });
      const pool = K.flat(g, { x: -w / 2, y: ys - segL, z: 0.5, w, h: segL, style: {
        background: 'radial-gradient(ellipse 45% 55% at 50% 50%, rgba(235,240,245,.22), rgba(235,240,245,0) 100%)' } });
      const ceil = K.flat(g, { x: -w / 2, y: ys - segL, z: h, w, h: segL, style: { background: '#0d0d0e' } });
      const rib = 'repeating-linear-gradient(to right, #161617 0px, #161617 10px, #0b0b0c 10px, #0b0b0c 16px)';
      const wl = K.vplane(g, { x: -w / 2, y: ys, w: segL, h, rz: -90, style: { background: rib } });
      const wr = K.vplane(g, { x: w / 2, y: ys - segL, w: segL, h, rz: 90, style: { background: rib } });
      const panel = K.flat(g, { x: -w * 0.3, y: ys - segL / 2 - 28, z: h - 2, w: w * 0.6, h: 56, style: { background: '#1b1b1c' } });
      const glowL = K.vplane(g, { x: -w / 2 + 1, y: ys, w: segL, h, rz: -90, style: {
        background: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(230,236,242,.28), rgba(0,0,0,0) 100%)', opacity: 0 } });
      const glowR = K.vplane(g, { x: w / 2 - 1, y: ys - segL, w: segL, h, rz: 90, style: {
        background: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(230,236,242,.28), rgba(0,0,0,0) 100%)', opacity: 0 } });
      // darkness veils on each surface (lit = transparent)
      const veil = (el) => K.div({ left: '0px', top: '0px', width: '100%', height: '100%', background: '#000', opacity: 0.94 }, el);
      segs.push({ panel, pool, glowL, glowR, veils: [veil(floor), veil(ceil), veil(wl), veil(wr)] });
    }
    const endWall = K.vplane(g, { x: -w / 2, y: y0 - L, w, h, style: { background: '#0f0f10' } });
    const endVeil = K.div({ left: '0px', top: '0px', width: '100%', height: '100%', background: '#000', opacity: 0.9 }, endWall);
    const gal = { g, segs, w, h, L, y0, endWall, endVeil };
    /** lit(i) ∈ 0..1 per row (front = 0) */
    gal.setLights = (litFn, endLit = 1) => {
      segs.forEach((s, i) => {
        const v = K.clamp(litFn(i));
        s.panel.style.background = v > 0.5 ? '#f3f6f8' : '#1b1b1c';
        s.panel.style.boxShadow = v > 0.5 ? '0 0 40px 12px rgba(235,242,248,.55)' : 'none';
        s.pool.style.opacity = v; s.glowL.style.opacity = v; s.glowR.style.opacity = v;
        for (const ve of s.veils) ve.style.opacity = (0.94 - 0.62 * v).toFixed(3);
      });
      gal.endVeil.style.opacity = (0.9 - 0.75 * K.clamp(endLit)).toFixed(3);
    };
    gal.setLights(() => 0, 0);
    return gal;
  };

  /** Framed print (black frame, cream mount) standing on a vertical plane; draw(svg, w, h) paints the artwork. */
  K.frame3d = (parent, { x, y, z = 120, w = 300, h = 220, rz = 0, draw, spot = true, mat = 18, frame = 10 }) => {
    const W = w + 2 * (mat + frame), H = h + 2 * (mat + frame);
    const holder = K.vplane(parent, { x, y, z, w: W, h: H, rz, style: { background: '#0c0c0c', boxShadow: '0 12px 30px rgba(0,0,0,.6)' } });
    const m = K.div({ left: frame + 'px', top: frame + 'px', width: w + 2 * mat + 'px', height: h + 2 * mat + 'px', background: '#e9e4d8' }, holder);
    const svg = K.s('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, m);
    svg.style.position = 'absolute'; svg.style.left = mat + 'px'; svg.style.top = mat + 'px';
    if (draw) draw(svg, w, h);
    const veil = K.div({ left: '0px', top: '0px', width: '100%', height: '100%', background: '#000', opacity: 0.85 }, holder);
    return { holder, svg, veil, setLit: (v) => (veil.style.opacity = (0.85 - 0.8 * K.clamp(v)).toFixed(3)) };
  };

  // ------------------------------------------------------------------ clay world on a blue sea
  K.claySea = (set, { size = 5200, c0 = '#a3b8c9', c1 = '#6f8aa3', c2 = '#2f4966', c3 = '#1b2b3d', spread = 1.6 } = {}) =>
    K.flat(set, { x: -size / 2, y: -size / 2, z: -1, w: size, h: size, style: {
      background: `radial-gradient(circle at 50% 50%, ${c0} 0%, ${c1} ${12 * Math.min(spread, 1.4)}%, ${c2} ${30 * Math.min(spread, 1.4)}%, ${c3} ${50 * Math.min(spread, 1.4)}%)` } });

  /** White clay windmill (smock body, cap, four lattice sails). setSail(deg), setS(scale 0..1). Faces +y. */
  K.windmill = (parent, { x = 0, y = 0, z = 0, s = 1, face = 0 } = {}) => {
    const g = K.g3(parent, { x, y, z, rz: face });
    const inner = K.g3(g, {});
    const tiers = [[40, 40, 34], [34, 34, 30], [28, 28, 26]];   // stacked tapering body
    let zz = 0;
    for (const [w, d, h] of tiers) { K.box(inner, { x: -w / 2, y: -d / 2, z: zz, w, d, h }); zz += h; }
    K.box(inner, { x: -18, y: -20, z: zz, w: 36, d: 34, h: 14, c: { top: '#f4f5f6', s: '#dadde0', e: '#c3c8cd', n: '#aab0b7', w: '#cfd3d7' } });
    const hubZ = zz + 8;
    const sails = K.g3(inner, { x: 0, y: 17, z: hubZ });
    const rot = K.div({ left: '0px', top: '0px', width: '0px', height: '0px', transformStyle: 'preserve-3d', transformOrigin: '0 0' }, sails);
    for (let k = 0; k < 4; k++) {
      const arm = K.div({ left: '0px', top: '0px', width: '0px', height: '0px', transformStyle: 'preserve-3d', transformOrigin: '0 0', transform: `rotateZ(${k * 90}deg)` }, rot);
      K.div({ left: '-2px', top: '-96px', width: '4px', height: '96px', background: '#e6e9ec' }, arm);
      K.div({ left: '2px', top: '-92px', width: '16px', height: '70px', background: 'repeating-linear-gradient(to bottom, #f2f4f5 0 3px, rgba(242,244,245,.25) 3px 9px), linear-gradient(to right, #eef0f2 0 1px, transparent 1px)', outline: '1px solid #e8ebee' }, arm);
    }
    K.div({ left: '-5px', top: '-5px', width: '10px', height: '10px', borderRadius: '50%', background: '#cfd4d9' }, rot);
    const wm = { g, inner };
    wm.setSail = (deg) => { rot.style.transform = `rotateX(-90deg) rotateZ(${deg.toFixed(2)}deg)`; };
    wm.setS = (v) => { inner.style.transform = `scale3d(${s * v},${s * v},${s * v})`; inner.style.visibility = v < 0.01 ? 'hidden' : 'visible'; };
    wm.setSail(0); wm.setS(1);
    return wm;
  };

  // ------------------------------------------------------------------ 2D: archival plates and end card
  /** Full-frame black-and-white "archival" plate on the engine's SVG layer between t0 and t1, drawn by draw(g).
   *  Slow push (push %/s), film weave, flicker, dust and a vignette; kept ungraded like found footage. */
  K.archival = (X, t0, t1, draw, { push = 1.4, pan = 0, seed = 3, tone = 'sepia' } = {}) => {
    const sc = X.scene(K.uid('arch'), t0, t1, (g) => {
      K.s('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#111' }, g);
      const cam = K.s('g', {}, g);
      draw(cam, X, t0, t1);
      const fid = K.uid('tone');
      const f = K.s('filter', { id: fid, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' }, X.defs);
      const mtx = tone === 'sepia' ? '0.36 0.56 0.11 0 0.02  0.33 0.53 0.10 0 0.015  0.29 0.47 0.09 0 0  0 0 0 1 0' : '0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0 0 0 1 0';
      K.s('feColorMatrix', { type: 'matrix', values: mtx }, f);
      K.s('feGaussianBlur', { stdDeviation: 0.9 }, f);
      cam.setAttribute('filter', `url(#${fid})`);
      const vg = X.radial(K.uid('avig'), [[0.55, '#000', 0], [1, '#000', 0.8]], 0.5, 0.5, 0.75);
      K.s('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: vg }, g);
      const flick = K.s('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#000', opacity: 0 }, g);
      const dust = K.s('g', {}, g);
      const r = X.rand(seed);
      const specks = Array.from({ length: 14 }, () => K.s('circle', { r: 1 + r() * 2.5, fill: r() < 0.5 ? '#fff' : '#000', opacity: 0 }, dust));
      const scratch = K.s('rect', { x: 0, y: 60, width: 1.6, height: 960, fill: '#ddd', opacity: 0 }, dust);
      K.on((t) => {
        if (!K.within(t, t0, t1)) return;
        const u = t - t0, f8 = Math.floor(t * 12);
        const rr = X.rand(f8 * 7 + seed);
        const s = 1 + push / 100 * u;
        const wx = (rr() - 0.5) * 2.2, wy = (rr() - 0.5) * 1.6;
        cam.setAttribute('transform', `translate(${(960 + wx - pan * u).toFixed(2)} ${540 + wy}) scale(${s.toFixed(4)}) translate(-960 -540)`);
        flick.setAttribute('opacity', (0.04 + rr() * 0.07).toFixed(3));
        specks.forEach((sp) => { const on = rr() < 0.25; sp.setAttribute('cx', rr() * 1920); sp.setAttribute('cy', 60 + rr() * 960); sp.setAttribute('opacity', on ? 0.5 : 0); });
        const sx = rr() < 0.4 ? 200 + rr() * 1500 : -10; scratch.setAttribute('x', sx); scratch.setAttribute('opacity', 0.18);
      });
    });
    return sc;
  };

  /** White centred text on black (hard cut), like a documentary source credit. */
  K.endCard = (X, t0, lines, { size = 34 } = {}) => X.scene('endcard', t0, null, (g) => {
    K.s('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#000' }, g);
    const y0 = 540 - (lines.length - 1) * size * 0.8;
    lines.forEach((l, i) => K.s('text', { x: 960, y: y0 + i * size * 1.6, 'text-anchor': 'middle', 'font-family': 'Inter', 'font-weight': l.w || 500,
      'font-size': l.size || size, fill: l.color || '#fff', opacity: l.op ?? 1, text: l.text }, g));
  });
})();
