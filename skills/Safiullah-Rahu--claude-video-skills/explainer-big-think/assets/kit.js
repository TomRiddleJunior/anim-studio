/* Big Think-style graphics kit for explainer-engine (window.BT). Original designs only.
 * Requires /engine/lib/explainer.js (window.X) + GSAP, fonts.css (Libre Baskerville, Caveat).
 *
 * Layers   BT.layers()                      → {world, over, cards, top}  (shots · overlays · paper cards · bug)
 * Paper    BT.paperURL(o)                   off-white speckled paper with grey vignette (data URL, cached)
 * Cards    BT.paperCard(parent, t0, o)      numbered / topic card: roll-down, number-box pop, title rise, roll-up
 * Type     BT.lowerThird · BT.labelTape · BT.kinetic · BT.titleOver · BT.fitSize · BT.text
 * Brand    BT.bug(parent, 'O','Q', o)       original boxed monogram, top-right · BT.seriesTitle · BT.endCard
 * Set      BT.studio(parent, o)             loft room + white seamless backdrop, wide/medium/punch camera, DOF swap
 * Speaker  BT.expert(parent, o)             flat-vector fictional expert: lip-flap on VO words, blinks, gestures
 * CGI      BT.cgi(parent, t0, t1, o)        canvas "stock CGI" stand-ins: field · sphere · synapse · tunnel
 * Archive  BT.slideFrame · BT.filmStrip · BT.docPush · BT.filmNoise · BT.plates.{portrait,book,indexCard,watch}
 * Diagram  BT.diagram.axes · BT.diagram.curve
 * FX       BT.glitch(target, t)             RGB split + slice displacement for ~4 frames
 * All motion is a pure function of t (X.tl tweens or X.every hooks). Durations in frames use BT.F(n) (24 fps).
 */
(function () {
  const BT = (window.BT = {});
  const F = (BT.F = (n) => n / 24);
  BT.serif = "'Libre Baskerville', Georgia, serif";
  BT.hand = "'Caveat', cursive";
  BT.C = {
    paper: '#FAFAFA', paperEdge: '#C4C4C4', ink: '#161616', tape: '#0B0B0B', white: '#FFFFFF', marker: '#F2EC6E',
    cgiDeep: '#131D3F', cgiBlue: '#223166', cgiCyan: '#8FE3FF', burn: '#A08A6A', slide: '#F4F1EA',
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, k) => a + (b - a) * k;
  BT.smooth = smooth; BT.lerp = lerp; BT.clamp = clamp;
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  // ------------------------------------------------------------------ basics
  BT.layers = () => {
    const L = {};
    for (const n of ['world', 'over', 'cards', 'top']) L[n] = X.svg('g', { id: 'L_' + n });
    return L;
  };
  BT.text = (parent, str, x, y, o = {}) => X.svg('text', {
    x, y, text: str, 'font-family': o.family || BT.serif, 'font-size': o.size || 60, 'font-weight': o.weight ?? 700,
    'font-style': o.italic ? 'italic' : 'normal', fill: o.fill || BT.C.ink, 'text-anchor': o.anchor || 'start',
    ...(o.attrs || {}),
  }, parent);
  /** Largest size ≤ size at which every string fits maxW. */
  BT.fitSize = (strs, maxW, size, o = {}) => {
    const t = BT.text(X.root, '', 0, -500, { ...o, size });
    let w = 0;
    for (const s of strs) { t.textContent = s; w = Math.max(w, t.getComputedTextLength()); }
    t.remove();
    return w > maxW ? Math.floor(size * maxW / w) : size;
  };
  BT.measure = (str, o = {}) => {
    const t = BT.text(X.root, str, 0, -500, o);
    const w = t.getComputedTextLength(); t.remove(); return w;
  };
  BT.clipRect = (x, y, w, h) => {
    const cp = X.svg('clipPath', { id: id('clip') }, X.defs);
    const r = X.svg('rect', { x, y, width: w, height: h }, cp);
    return { url: `url(#${cp.id})`, rect: r };
  };

  // ------------------------------------------------------------------ paper
  const _paper = {};
  BT.paperURL = (o = {}) => {
    const key = JSON.stringify(o);
    if (_paper[key]) return _paper[key];
    const w = 1920, h = 1080, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d'), r = X.rand(o.seed || 5);
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2);
    grd.addColorStop(0, o.center || '#FAFAFA');
    grd.addColorStop(0.45, o.mid || '#F3F3F3');
    grd.addColorStop(0.74, o.vignette === false ? (o.mid || '#F3F3F3') : '#DCDCDC');
    grd.addColorStop(1, o.vignette === false ? (o.mid || '#F3F3F3') : (o.edge || '#BDBDBD'));
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 7; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = r() * w, y = r() * h, a = r() * Math.PI * 2, L = 8 + r() * 40;
      g.strokeStyle = `rgba(80,80,80,${0.04 + r() * 0.08})`; g.lineWidth = 0.5 + r() * 0.9;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.7) * L * 0.5, y + Math.sin(a + 0.7) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }
    for (let i = 0; i < (o.speckle ?? 1900); i++) {
      const x = r() * w, y = r() * h, s = 0.4 + r() * r() * 1.9;
      g.fillStyle = `rgba(22,22,22,${0.3 + r() * 0.6})`;
      g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    }
    return (_paper[key] = c.toDataURL('image/jpeg', 0.92));
  };
  BT.paperBG = (parent, o) => X.svg('image', { href: BT.paperURL(o), x: 0, y: 0, width: 1920, height: 1080, preserveAspectRatio: 'none' }, parent);

  // ------------------------------------------------------------------ paper cards
  /** Numbered section card or topic card.
   *  o: {num, title, topic (true = topic style w/ underline), tBox, tTitle, tOut, rollIn=true, rollOut=true, name, size} */
  BT.paperCard = (parent, t0, o) => {
    const dIn = F(10), dOut = F(10);
    const tOut = o.tOut, end = tOut + (o.rollOut === false ? 0 : dOut);
    const g = X.scene(o.name || id('card'), t0, end, null, parent);
    const inner = X.svg('g', {}, g);
    BT.paperBG(inner);
    const topic = !!o.topic;
    const size = o.size || (topic ? 78 : 92);
    const yTitle = topic ? 572 : 612;
    const tBox = o.tBox ?? t0 + dIn + F(3);
    const tTitle = o.tTitle ?? (o.num != null ? tBox + F(6) : t0 + dIn + F(2));
    if (o.num != null) {
      const bx = X.svg('g', {}, inner);
      X.svg('rect', { x: 960 - 44, y: 452 - 44, width: 88, height: 88, fill: '#111' }, bx);
      BT.text(bx, String(o.num), 960, 452 + 19, { size: 54, fill: '#fff', anchor: 'middle' });
      gsap.set(bx, { transformOrigin: '50% 50%', scale: 0.15, rotation: 45, opacity: 0 });
      X.tl.to(bx, { scale: 1, rotation: 0, opacity: 1, duration: F(9), ease: 'back.out(1.2)' }, tBox);
      X.sfx(tBox, 'click', { gain: 0.22 });
    }
    const clip = BT.clipRect(0, yTitle - size * 1.05, 1920, size * 1.45);
    const wrap = X.svg('g', { 'clip-path': clip.url }, inner);
    const tt = BT.text(wrap, o.title, 960, yTitle, { size, anchor: 'middle' });
    X.tl.fromTo(tt, { y: size * 1.5 }, { y: 0, duration: F(6), ease: 'power3.out' }, tTitle);
    if (topic) { // underline under the last word, drawn left→right
      const full = tt.getComputedTextLength(), words = o.title.split(' '), last = words[words.length - 1];
      const lw = BT.measure(last, { size }), x1 = 960 + full / 2;
      const ul = X.svg('rect', { x: x1 - lw, y: yTitle + size * 0.24, width: lw, height: 4, fill: BT.C.ink }, inner);
      X.tl.fromTo(ul, { attr: { width: 0 } }, { attr: { width: lw }, duration: F(7), ease: 'power2.out' }, tTitle + F(6));
    }
    if (o.rollIn !== false) {
      X.tl.fromTo(inner, { y: -1080 }, { y: 0, duration: dIn, ease: 'power2.inOut' }, t0);
      X.sfx(t0, 'paper', { gain: 0.3 });
    }
    if (o.rollOut !== false) {
      X.tl.fromTo(inner, { y: 0 }, { y: -1080, duration: dOut, ease: 'power2.inOut', immediateRender: false }, tOut);
      X.sfx(tOut, 'slide', { gain: 0.16 });
    }
    return g;
  };

  // ------------------------------------------------------------------ type
  /** Label-tape box that grows left→right. style 'black' (white text) or 'white' (black italic). y = box top. */
  BT.labelTape = (parent, str, x, y, t, o = {}) => {
    const size = o.size || 48, padX = o.padX ?? Math.round(size * 0.42), h = Math.round(size * (o.italic ? 1.85 : 1.6));
    const black = (o.style || 'black') === 'black';
    const g = X.svg('g', {}, parent);
    const tx = BT.text(g, str, x + padX, y + h * 0.67, { size, italic: o.italic, weight: o.weight ?? (o.italic ? 400 : 700), fill: black ? '#fff' : '#111' });
    const w = tx.getComputedTextLength() + padX * 2;
    const box = X.svg('rect', { x, y, width: w, height: h, fill: black ? BT.C.tape : '#fff' });
    g.insertBefore(box, tx);
    const cp = BT.clipRect(x, y, w, h);
    tx.setAttribute('clip-path', cp.url);
    const d = o.dur ?? F(6);
    X.tl.fromTo([box, cp.rect], { attr: { width: Math.min(14, w) } }, { attr: { width: w }, duration: d, ease: 'power3.out' }, t);
    gsap.set(g, { opacity: 0 });
    X.tl.set(g, { opacity: 1 }, t);
    if (o.tOut != null) {
      X.tl.fromTo([box, cp.rect], { attr: { width: w } }, { attr: { width: 0 }, duration: F(7), ease: 'power2.in', immediateRender: false }, o.tOut);
    }
    if (o.sfx !== false) X.sfx(t, 'slide', { gain: o.gain ?? 0.12 });
    return { g, w, h };
  };
  /** Two-box lower-third: name (white bold on black) + role (black italic on white), 6 f stagger. */
  BT.lowerThird = (parent, name, role, t, tOut, o = {}) => {
    const x = o.x ?? 192, yb = o.y ?? 972, ns = o.nameSize ?? 50, rs = o.roleSize ?? 30;
    const g = X.scene(id('lt'), t, tOut + F(16), null, parent);
    const rH = Math.round(rs * 1.85), nH = Math.round(ns * 1.62);
    const nameT = BT.labelTape(g, name, x, yb - rH - nH, t, { size: ns, dur: F(9), tOut: tOut + F(6), sfx: false });
    BT.labelTape(g, role, x, yb - rH, t + F(6), { size: rs, style: 'white', italic: true, dur: F(9), tOut, sfx: false });
    X.sfx(t, 'slide', { gain: 0.14 });
    return { g, nameT };
  };
  /** Word-synced kinetic stack: items [{text, t}] → one line each, blur/fade-in on the word. */
  BT.kinetic = (parent, items, o = {}) => {
    const x = o.x ?? 270, y = o.y ?? 360;
    const size = o.size ?? BT.fitSize(items.map((i) => i.text), o.maxW ?? 560, 130);
    const lead = o.lead ?? 1.02;
    return items.map((it, i) => {
      const tx = BT.text(parent, it.text, x, y + i * size * lead, { size, fill: o.fill || '#fff', anchor: o.anchor || 'start' });
      X.tl.fromTo(tx, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: F(3), ease: 'power1.out' }, it.t - F(1));
      if (o.sfx) X.sfx(it.t, 'click', { gain: 0.08 });
      return tx;
    });
  };
  /** Centred white serif title over footage; fade 5 f. Put foreground art in `fg` group afterwards to tuck it behind. */
  BT.titleOver = (parent, str, t, o = {}) => {
    const size = o.size ?? 128;
    const tx = BT.text(parent, str, o.x ?? 960, o.y ?? 575, { size, fill: o.fill || '#fff', anchor: 'middle' });
    if (o.shadow) tx.setAttribute('filter', BT.softShadow());
    X.tl.fromTo(tx, { opacity: 0 }, { opacity: 1, duration: F(5), ease: 'power1.out' }, t);
    return tx;
  };
  let _ss;
  BT.softShadow = () => _ss || (_ss = X.shadow('btSoftShadow', 0, 3, 10, '#000', 0.35));

  // ------------------------------------------------------------------ brand (original)
  /** Boxed monogram bug, top-right (inset 4.5 %). Letters are yours: never copy a real channel's bug. */
  BT.bug = (parent, a = 'O', b = 'Q', o = {}) => {
    const g = X.svg('g', { opacity: 0 }, parent);
    const s = 38, x = 1920 - 86 - (s + 34), y = 49;
    const draw = (gg, col, dx, dy) => {
      X.svg('rect', { x: x + dx, y: y + dy, width: s, height: s, fill: 'none', stroke: col, 'stroke-width': 2.6 }, gg);
      BT.text(gg, a, x + dx + s / 2, y + dy + s * 0.76, { size: 26, fill: col, anchor: 'middle' });
      BT.text(gg, b, x + dx + s + 9, y + dy + s * 0.76, { size: 29, fill: col, weight: 700 });
      X.svg('rect', { x: x + dx + s + 8, y: y + dy + s + 3, width: 24, height: 2.6, fill: col }, gg);
    };
    draw(X.svg('g', { opacity: 0.22 }, g), '#000', 1.2, 1.4);
    draw(g, '#fff', 0, 0);
    X.tl.to(g, { opacity: o.opacity ?? 0.88, duration: 0.4, ease: 'power1.out' }, o.t ?? 0.5);
    if (o.tHide != null) X.tl.set(g, { opacity: 0 }, o.tHide);
    return g;
  };
  /** Series title: bold roman line + bold italic line + byline with boxed monogram; logo-line build. */
  BT.seriesTitle = (parent, l1, l2, byline, t, o = {}) => {
    const g = X.svg('g', {}, parent);
    const size = o.size ?? 104;
    const a = BT.text(g, l1, 960, 500, { size, fill: '#fff', anchor: 'middle' });
    const b = BT.text(g, l2, 960, 500 + size * 1.08, { size, fill: '#fff', anchor: 'middle', italic: true });
    [a, b].forEach((el, i) => X.tl.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: F(8), ease: 'power3.out' }, t + i * F(4)));
    const by = 500 + size * 1.08 + 78, bw = BT.measure(byline, { size: 28, italic: true, weight: 400 });
    const bx0 = 960 - (bw + 70) / 2;
    const logo = X.svg('g', {}, g);
    X.svg('rect', { x: bx0, y: by - 26, width: 32, height: 32, fill: 'none', stroke: '#fff', 'stroke-width': 2.4 }, logo);
    BT.text(logo, o.mono || 'OQ', bx0 + 16, by - 3, { size: 15, fill: '#fff', anchor: 'middle' });
    const bl = BT.text(g, byline, bx0 + 50, by, { size: 28, italic: true, weight: 400, fill: '#fff' });
    gsap.set(logo, { transformOrigin: '50% 50%' });
    X.tl.fromTo(logo, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: F(6), ease: 'back.out(1.4)' }, t + F(10));
    const cp = BT.clipRect(bx0 + 46, by - 40, 0, 60);
    bl.setAttribute('clip-path', cp.url);
    X.tl.to(cp.rect, { attr: { width: bw + 12 }, duration: F(14), ease: 'power2.out' }, t + F(14));
    X.sfx(t + F(10), 'blip', { gain: 0.12 });
    return g;
  };

  // ------------------------------------------------------------------ film noise + dust (archival treatment)
  let _noiseURL;
  BT.filmNoise = (parent, opacity = 0.18, o = {}) => {
    if (!_noiseURL) {
      const c = document.createElement('canvas'); c.width = c.height = 384;
      const g = c.getContext('2d'), img = g.createImageData(384, 384), r = X.rand(41);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 230; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); _noiseURL = c.toDataURL('image/png');
    }
    const pid = id('noise');
    const pat = X.svg('pattern', { id: pid, patternUnits: 'userSpaceOnUse', width: 384, height: 384 }, X.defs);
    X.svg('image', { href: _noiseURL, width: 384, height: 384 }, pat);
    const rect = X.svg('rect', { x: o.x ?? 0, y: o.y ?? 0, width: o.w ?? 1920, height: o.h ?? 1080, fill: `url(#${pid})`, opacity, style: { mixBlendMode: 'overlay' } }, parent);
    const dust = X.svg('g', {}, parent), specks = [];
    for (let i = 0; i < 7; i++) specks.push(X.svg('ellipse', { rx: 2, ry: 2, fill: o.dustColor || '#111', opacity: 0 }, dust));
    const rr = X.rand(o.seed || 9), offs = Array.from({ length: 48 }, () => [Math.floor(rr() * 384), Math.floor(rr() * 384)]);
    X.every((t) => {
      if (o.t0 != null && (t < o.t0 || t > o.t1)) return;
      const k = Math.floor(t * 12);
      pat.setAttribute('patternTransform', `translate(${offs[k % 48][0]} ${offs[k % 48][1]})`);
      const r2 = X.rand(1000 + k);
      specks.forEach((s, i) => {
        const on = r2() < 0.35;
        s.setAttribute('opacity', on ? 0.25 + r2() * 0.5 : 0);
        s.setAttribute('cx', (o.x ?? 0) + r2() * (o.w ?? 1920)); s.setAttribute('cy', (o.y ?? 0) + r2() * (o.h ?? 1080));
        s.setAttribute('rx', 0.8 + r2() * 2.5); s.setAttribute('ry', 0.8 + r2() * (i === 0 ? 14 : 2.5));
      });
    });
    return rect;
  };

  // ------------------------------------------------------------------ studio set (room raster + camera)
  function drawStudio(g, r) {
    const W = 1920, H = 1080;
    // ceiling
    g.fillStyle = '#231B16'; g.fillRect(0, 0, W, 130);
    g.fillStyle = '#1A1410'; g.fillRect(0, 98, W, 26);
    const duct = g.createLinearGradient(0, 34, 0, 74); duct.addColorStop(0, '#6A645E'); duct.addColorStop(0.4, '#8C857D'); duct.addColorStop(1, '#3E3934');
    g.fillStyle = duct; g.fillRect(0, 38, W, 34);
    for (let x = 60; x < W; x += 240) { g.fillStyle = '#4A443E'; g.fillRect(x, 36, 10, 38); }
    // brick wall
    g.fillStyle = '#5A3E2E'; g.fillRect(0, 122, W, 690);
    const bh = 21, bw = 60;
    for (let row = 0, y = 122; y < 812; row++, y += bh) {
      for (let x = (row % 2) * -bw / 2; x < W; x += bw) {
        const k = 0.78 + r() * 0.36, dark = r() < 0.12 ? 0.75 : 1;
        g.fillStyle = `rgb(${Math.round(142 * k * dark)},${Math.round(72 * k * dark)},${Math.round(42 * k * dark)})`;
        g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      }
    }
    let gr = g.createLinearGradient(0, 122, 0, 812); gr.addColorStop(0, 'rgba(10,6,4,0.55)'); gr.addColorStop(0.5, 'rgba(10,6,4,0.15)'); gr.addColorStop(1, 'rgba(10,6,4,0.3)');
    g.fillStyle = gr; g.fillRect(0, 122, W, 690);
    // windows (arched factory windows) + glow
    const win = (x0) => {
      const w = 250, y0 = 150, y1 = 770, rr = w / 2;
      const glow = g.createRadialGradient(x0 + w / 2, 430, 40, x0 + w / 2, 430, 420);
      glow.addColorStop(0, 'rgba(255,226,180,0.4)'); glow.addColorStop(1, 'rgba(255,238,210,0)');
      g.fillStyle = glow; g.fillRect(x0 - 300, 100, w + 600, 760);
      g.save(); g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + rr); g.arc(x0 + rr, y0 + rr, rr, Math.PI, 0); g.lineTo(x0 + w, y1); g.closePath();
      const gl = g.createLinearGradient(0, y0, 0, y1); gl.addColorStop(0, '#F7F5EE'); gl.addColorStop(0.6, '#E9ECEA'); gl.addColorStop(1, '#D9DEDC');
      g.fillStyle = gl; g.fill(); g.clip();
      const haze = g.createLinearGradient(0, 560, 0, y1); haze.addColorStop(0, 'rgba(150,165,155,0)'); haze.addColorStop(1, 'rgba(150,165,155,0.28)');
      g.fillStyle = haze; g.fillRect(x0, 560, w, y1 - 560);
      g.strokeStyle = '#2A2420'; g.lineWidth = 7;
      for (let x = x0 + 50; x < x0 + w; x += 50) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
      for (let y = y0 + rr + 10; y < y1; y += 62) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
      g.restore();
      g.strokeStyle = '#1F1A16'; g.lineWidth = 14;
      g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + rr); g.arc(x0 + rr, y0 + rr, rr, Math.PI, 0); g.lineTo(x0 + w, y1); g.closePath(); g.stroke();
      g.fillStyle = '#3B312A'; g.fillRect(x0 - 16, y1, w + 32, 18);
    };
    win(36); win(1634);
    // pendant lamps
    for (const lx of [480, 1440]) {
      g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 72); g.lineTo(lx, 190); g.stroke();
      const lg = g.createRadialGradient(lx, 214, 4, lx, 214, 160); lg.addColorStop(0, 'rgba(255,205,130,0.45)'); lg.addColorStop(1, 'rgba(255,205,130,0)');
      g.fillStyle = lg; g.fillRect(lx - 170, 190, 340, 200);
      g.fillStyle = '#1C1814'; g.beginPath(); g.moveTo(lx - 36, 214); g.quadraticCurveTo(lx, 168, lx + 36, 214); g.closePath(); g.fill();
      g.fillStyle = '#FFE2AE'; g.beginPath(); g.ellipse(lx, 214, 30, 5, 0, 0, 7); g.fill();
    }
    // bookshelves
    const pal = ['#86592F', '#3F6048', '#9A3426', '#D0B88A', '#2A3E5E', '#6A6A5A', '#B07A42', '#3A3530', '#A88B5E', '#683F2C', '#C2A66E', '#2F4A52'];
    const shelf = (x0, x1) => {
      const y0 = 250, y1 = 812;
      g.fillStyle = '#3A2A1E'; g.fillRect(x0 - 12, y0 - 14, x1 - x0 + 24, y1 - y0 + 14);
      g.fillStyle = '#21180F'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let sy = y0; sy < y1 - 40; sy += 92) {
        let x = x0 + 4 + r() * 10;
        while (x < x1 - 14) {
          if (r() < 0.07) { // object instead of books
            const ow = 36 + r() * 20; g.fillStyle = r() < 0.5 ? '#6B7F5C' : '#8D7D66';
            g.beginPath(); g.ellipse(x + ow / 2, sy + 80, ow / 2, 12, 0, 0, 7); g.fill();
            g.fillRect(x + 6, sy + 50, ow - 12, 30); x += ow + 6; continue;
          }
          const bwid = 9 + r() * 17, bht = 52 + r() * 30, c = pal[Math.floor(r() * pal.length)];
          const lean = r() < 0.06 ? (r() - 0.5) * 0.3 : 0;
          g.save(); g.translate(x, sy + 86); g.rotate(lean);
          g.fillStyle = c; g.fillRect(0, -bht, bwid, bht);
          g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(1, -bht, 2, bht);
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(bwid - 2, -bht, 2, bht);
          if (r() < 0.5) { g.fillStyle = 'rgba(230,210,160,0.35)'; g.fillRect(1, -bht + 10, bwid - 2, 3); }
          g.restore(); x += bwid + (r() < 0.1 ? 8 : 1);
        }
        g.fillStyle = '#4C3726'; g.fillRect(x0 - 6, sy + 86, x1 - x0 + 12, 9);
        g.fillStyle = 'rgba(255,220,170,0.12)'; g.fillRect(x0 - 6, sy + 86, x1 - x0 + 12, 2);
      }
      const sh = g.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(1, 'rgba(0,0,0,0.05)');
      g.fillStyle = sh; g.fillRect(x0 - 12, y0 - 14, x1 - x0 + 24, y1 - y0 + 14);
    };
    shelf(318, 676); shelf(1244, 1602);
    // floor
    gr = g.createLinearGradient(0, 812, 0, H); gr.addColorStop(0, '#56341C'); gr.addColorStop(1, '#8C5A30');
    g.fillStyle = gr; g.fillRect(0, 812, W, H - 812);
    g.strokeStyle = 'rgba(30,18,10,0.45)'; g.lineWidth = 1.6;
    for (let i = -34; i <= 34; i++) { g.beginPath(); g.moveTo(960 + i * 26, 812); g.lineTo(960 + i * 88, H); g.stroke(); }
    for (let i = 0; i < 90; i++) {
      const y = 818 + r() * 260, x = r() * W; g.strokeStyle = 'rgba(25,15,8,0.35)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r() * 40, y); g.stroke();
    }
    for (const x0 of [36, 1634]) {
      const rf = g.createLinearGradient(0, 812, 0, H); rf.addColorStop(0, 'rgba(255,240,215,0.28)'); rf.addColorStop(1, 'rgba(255,240,215,0)');
      g.fillStyle = rf; g.beginPath(); g.moveTo(x0, 812); g.lineTo(x0 + 250, 812); g.lineTo(x0 + 250 + (x0 < 900 ? -60 : 140), H); g.lineTo(x0 + (x0 < 900 ? -160 : 60), H); g.closePath(); g.fill();
    }
    // softbox on a stand (left of backdrop)
    g.strokeStyle = '#151210'; g.lineWidth = 6; g.beginPath(); g.moveTo(1308, 470); g.lineTo(1308, 820); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(1308, 820); g.lineTo(1348, 860); g.moveTo(1308, 820); g.lineTo(1268, 862); g.moveTo(1308, 820); g.lineTo(1304, 868); g.stroke();
    g.fillStyle = '#141210'; g.beginPath(); g.moveTo(1372, 300); g.lineTo(1244, 330); g.lineTo(1244, 500); g.lineTo(1372, 520); g.closePath(); g.fill();
    g.fillStyle = '#F2F1EC'; g.beginPath(); g.moveTo(1354, 316); g.lineTo(1250, 340); g.lineTo(1250, 490); g.lineTo(1354, 506); g.closePath(); g.fill();
    // plant (right of backdrop)
    g.fillStyle = '#7E5E46'; g.beginPath(); g.moveTo(602, 742); g.lineTo(668, 742); g.lineTo(658, 812); g.lineTo(612, 812); g.closePath(); g.fill();
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.2, L = 50 + r() * 60, cx = 635, cy = 740;
      const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L;
      g.strokeStyle = '#3D4A30'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = r() < 0.5 ? '#4E6B46' : '#5F7E50';
      g.save(); g.translate(ex, ey); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, 13, 24, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse(-4, -3, 4, 16, 0, 0, 7); g.fill(); g.restore();
    }
    // seamless backdrop
    const bx0 = 700, bx1 = 1220;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(bx0 - 6, 96, bx1 - bx0 + 12, 716);
    let pg = g.createLinearGradient(bx0, 0, bx1, 0);
    pg.addColorStop(0, '#CFCCC6'); pg.addColorStop(0.12, '#E2E0DB'); pg.addColorStop(0.5, '#ECEAE6'); pg.addColorStop(0.88, '#E0DED9'); pg.addColorStop(1, '#CBC8C2');
    g.fillStyle = pg; g.fillRect(bx0, 92, bx1 - bx0, 722);
    let vg = g.createLinearGradient(0, 92, 0, 812); vg.addColorStop(0, 'rgba(0,0,0,0.12)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(255,255,255,0.06)');
    g.fillStyle = vg; g.fillRect(bx0, 92, bx1 - bx0, 722);
    // sweep onto the floor
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.moveTo(bx0 - 4, 812); g.lineTo(bx1 + 4, 812); g.lineTo(1300, H); g.lineTo(620, H); g.closePath(); g.fill();
    pg = g.createLinearGradient(0, 800, 0, H); pg.addColorStop(0, '#DAD7D1'); pg.addColorStop(0.18, '#ECEAE5'); pg.addColorStop(1, '#F1EFEB');
    g.fillStyle = pg; g.beginPath(); g.moveTo(bx0, 806); g.lineTo(bx1, 806); g.lineTo(1294, H); g.lineTo(626, H); g.closePath(); g.fill();
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(0,0,0,0.014)'; g.beginPath(); g.ellipse(800 + r() * 330, 920 + r() * 140, 20 + r() * 30, 4 + r() * 6, 0, 0, 7); g.fill(); }
    // roll tube
    const tg = g.createLinearGradient(0, 70, 0, 98); tg.addColorStop(0, '#9C978F'); tg.addColorStop(0.45, '#E4E1DB'); tg.addColorStop(1, '#8A857E');
    g.fillStyle = tg; g.fillRect(bx0 - 14, 70, bx1 - bx0 + 28, 28);
    g.fillStyle = '#222'; g.fillRect(bx0 - 22, 68, 10, 32); g.fillRect(bx1 + 12, 68, 10, 32);
    // subject + chair shadows (soft)
    g.save(); g.filter = 'blur(26px)'; g.fillStyle = 'rgba(40,30,25,0.13)'; g.beginPath(); g.ellipse(1010, 610, 88, 210, 0, 0, 7); g.fill(); g.restore();
    g.save(); g.filter = 'blur(9px)'; g.fillStyle = 'rgba(30,22,18,0.32)'; g.beginPath(); g.ellipse(966, 874, 120, 15, 0, 0, 7); g.fill(); g.restore();
    // vignette
    const vv = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150); vv.addColorStop(0, 'rgba(0,0,0,0)'); vv.addColorStop(1, 'rgba(0,0,0,0.32)');
    g.fillStyle = vv; g.fillRect(0, 0, W, H);
  }
  /** The interview set. Returns {g, cam, show(t) predicate builder}. Shots: BT.studio.shot(st, t0, t1, framing). */
  BT.studio = (parent, o = {}) => {
    const k = o.k || 1.5, c = document.createElement('canvas');
    c.width = 1920 * k; c.height = 1080 * k;
    const g2 = c.getContext('2d'); g2.scale(k, k);
    drawStudio(g2, X.rand(o.seed || 11));
    const sharp = c.toDataURL('image/jpeg', 0.9);
    const c2 = document.createElement('canvas'); c2.width = c.width; c2.height = c.height;
    const g3 = c2.getContext('2d'); g3.filter = `blur(${7 * k / 1.5}px)`; g3.drawImage(c, 0, 0);
    const soft = c2.toDataURL('image/jpeg', 0.9);
    const root = X.svg('g', { id: 'studio', visibility: 'hidden' }, parent);
    const cam = X.svg('g', {}, root);
    const imS = X.svg('image', { href: sharp, x: 0, y: 0, width: 1920, height: 1080 }, cam);
    const imB = X.svg('image', { href: soft, x: 0, y: 0, width: 1920, height: 1080, visibility: 'hidden' }, cam);
    // "medium camera" exposure: greyer backdrop + light falloff, under the subject only
    const grade = X.svg('g', { visibility: 'hidden' }, cam);
    X.svg('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#4A3524', opacity: 0.31 }, grade);
    X.svg('rect', { x: 600, y: 300, width: 420, height: 460, fill: X.radial(id('key'), [[0, '#FFD9A8', 0.10], [1, '#FFD9A8', 0]], 0.5, 0.5, 0.5) }, grade);
    X.svg('rect', { x: 640, y: 330, width: 640, height: 430, fill: X.radial(id('fall'), [[0, '#000', 0], [0.7, '#000', 0.06], [1, '#000', 0.26]], 0.5, 0.42, 0.62) }, grade);
    const subject = X.svg('g', {}, cam);
    const st = { root, cam, subject, shots: [], imS, imB, grade };
    st.visibleAt = (t) => st.shots.some((s) => t >= s.t0 && t < s.t1);
    X.every((t) => {
      const s = st.shots.find((q) => t >= q.t0 && t < q.t1);
      root.setAttribute('visibility', s ? 'visible' : 'hidden');
      if (!s) return;
      const a = s.from, b = s.to, e = (s.ease || ((x) => x))((t - s.t0) / Math.max(0.001, s.t1 - s.t0));
      const sc = lerp(a.s, b.s, e), cx = lerp(a.cx, b.cx, e), cy = lerp(a.cy, b.cy, e);
      cam.setAttribute('transform', `translate(${(960 - sc * cx).toFixed(2)} ${(540 - sc * cy).toFixed(2)}) scale(${sc.toFixed(4)})`);
      const close = a.s > 1.6;
      imS.setAttribute('visibility', close ? 'hidden' : 'visible');
      imB.setAttribute('visibility', close ? 'visible' : 'hidden');
      grade.setAttribute('visibility', close ? 'visible' : 'hidden');
    });
    return st;
  };
  /** Camera framings (world coords: subject seated at x 960, head top y 420). */
  BT.framing = {
    wide: [{ s: 1.0, cx: 960, cy: 540 }, { s: 1.035, cx: 962, cy: 556 }],
    med: [{ s: 3.9, cx: 970, cy: 533 }, { s: 3.99, cx: 969, cy: 529 }],
    punch: [{ s: 4.9, cx: 970, cy: 512 }, { s: 5.0, cx: 969, cy: 510 }],
    medR: [{ s: 3.6, cx: 1010, cy: 545 }, { s: 3.68, cx: 1008, cy: 542 }],
  };
  BT.shot = (st, t0, t1, fr) => {
    const f = typeof fr === 'string' ? BT.framing[fr] : fr;
    st.shots.push({ t0, t1, from: f[0], to: f[1] });
  };

  // ------------------------------------------------------------------ the expert (flat vector, fictional)
  /** Seated fictional expert. o: {x, y, scale, lines:[vo ids], gestures:[{t, d, arm:'R'|'L'|'B', amt}], nods:[t], visible(t)} */
  BT.expert = (parent, o = {}) => {
    const P = {
      skin: o.skin || '#A86F52', skinSh: o.skinShadow || '#8E5A40', hair: o.hair || '#2A1C16', hairHi: '#4A3226',
      jacket: o.jacket || '#2F6079', jacketSh: o.jacketShadow || '#244B60', lapel: o.lapel || '#3A7089', top: o.top || '#E8DFD0',
      pants: '#2F3137', pantsSh: '#25262B', shoe: '#4A3122', wood: '#7A5534', woodSh: '#573B24', frames: '#5B3A26', lip: '#8E4C40',
    };
    const g = X.svg('g', { transform: `translate(${o.x ?? 960} ${o.y ?? 420}) scale(${o.scale ?? 0.45})` }, parent);
    const S = (tag, a, p = g) => X.svg(tag, a, p);
    const body = S('g', {});
    // chair (back, seat, legs)
    S('rect', { x: -168, y: 300, width: 22, height: 290, rx: 6, fill: P.woodSh }, body);
    S('rect', { x: 146, y: 300, width: 22, height: 290, rx: 6, fill: P.woodSh }, body);
    S('rect', { x: -170, y: 318, width: 340, height: 40, rx: 10, fill: P.wood }, body);
    S('rect', { x: -140, y: 590, width: 18, height: 420, fill: P.woodSh }, body);
    S('rect', { x: 122, y: 590, width: 18, height: 420, fill: P.woodSh }, body);
    // hair (back mass)
    S('path', { d: 'M-98,70 C-110,-10 -40,-26 0,-24 C46,-26 112,-8 100,72 C106,130 114,190 124,240 C130,268 120,290 100,296 C86,300 74,290 62,296 C40,300 -40,300 -62,296 C-74,290 -86,300 -100,296 C-122,290 -130,266 -124,240 C-114,190 -104,130 -98,70Z', fill: P.hair }, body);
    S('path', { d: 'M-90,96 C-94,150 -100,200 -112,252 M90,96 C96,150 104,200 114,252 M-80,120 C-84,170 -88,220 -96,270', fill: 'none', stroke: P.hairHi, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.55 }, body);
    // seat
    S('path', { d: 'M-182,568 L182,568 L176,606 L-176,606Z', fill: P.wood }, body);
    S('rect', { x: -176, y: 600, width: 352, height: 10, fill: P.woodSh }, body);
    // legs (crossed): back leg vertical, front leg crossing
    S('path', { d: 'M30,590 C74,588 104,606 102,640 L98,960 C98,976 60,978 58,962 L46,650 Z', fill: P.pantsSh }, body);
    S('path', { d: 'M52,958 C40,974 46,1000 92,1002 C120,1002 126,986 110,970 C102,962 70,954 52,958Z', fill: P.shoe }, body);
    S('path', { d: 'M-112,560 C-60,548 40,560 96,586 C120,600 112,640 84,644 C30,648 -40,640 -96,628 C-130,620 -136,570 -112,560Z', fill: P.pants }, body);
    S('path', { d: 'M76,598 C100,604 112,632 90,646 L-36,860 C-46,878 -82,868 -74,848 L26,630 Z', fill: P.pants }, body);
    S('path', { d: 'M-70,842 C-92,850 -112,880 -96,896 C-82,908 -50,890 -40,872 C-34,860 -52,836 -70,842Z', fill: P.shoe }, body);
    // neck
    S('path', { d: 'M-27,180 L27,180 L30,268 L-30,268Z', fill: P.skin }, body);
    S('path', { d: 'M-27,184 C-10,214 12,214 27,184 L28,214 C10,232 -10,232 -28,214Z', fill: P.skinSh, opacity: 0.75 }, body);
    // torso (breathing group)
    const torso = S('g', {}, body);
    S('path', { d: 'M-34,258 C-80,262 -132,270 -146,300 C-160,340 -150,430 -134,500 L-120,586 C-60,600 60,600 120,586 L134,500 C150,430 160,340 146,300 C132,270 80,262 34,258Z', fill: P.jacket }, torso);
    S('path', { d: 'M20,262 C80,264 132,272 146,300 C160,340 150,430 134,500 L120,586 C90,594 60,598 30,598Z', fill: P.jacketSh, opacity: 0.55 }, torso);
    S('path', { d: 'M-34,258 C-20,268 20,268 34,258 L22,330 L0,430 L-22,330Z', fill: P.top }, torso);
    S('path', { d: 'M-26,262 C-12,276 12,276 26,262', fill: 'none', stroke: '#CFC4B2', 'stroke-width': 3 }, torso);
    S('path', { d: 'M-22,286 C-8,318 8,318 22,286', fill: 'none', stroke: '#C9A15A', 'stroke-width': 2.4 }, torso);
    S('circle', { cx: 0, cy: 318, r: 5, fill: '#C9A15A' }, torso);
    S('path', { d: 'M-36,258 L-84,320 L-64,336 L-6,452 L0,440 L-24,330Z', fill: P.lapel }, torso);
    S('path', { d: 'M36,258 L84,320 L64,336 L6,452 L0,440 L24,330Z', fill: P.lapel }, torso);
    S('path', { d: 'M-36,258 L-84,320 L-64,336 L-6,452 M36,258 L84,320 L64,336 L6,452', fill: 'none', stroke: '#2C3C45', 'stroke-width': 2.5 }, torso);
    S('circle', { cx: -8, cy: 500, r: 6, fill: '#26343C' }, torso);
    S('path', { d: 'M-100,560 C-40,574 40,574 100,560', fill: 'none', stroke: '#2C3C45', 'stroke-width': 2 }, torso);
    // arms: upper (pivot shoulder) > fore (pivot elbow) > hand
    const mkArm = (side) => {
      const sx = side * 128, upper = S('g', {}, body);
      S('rect', { x: -29, y: -14, width: 58, height: 214, rx: 29, fill: P.jacket }, upper);
      S('path', { d: 'M10,-6 C24,10 29,40 29,80 L29,170 C29,186 22,196 12,198 Z', fill: P.jacketSh, opacity: 0.6 }, upper);
      const fore = S('g', {}, upper);
      S('rect', { x: -26, y: -6, width: 52, height: 176, rx: 26, fill: P.jacket }, fore);
      S('path', { d: 'M-26,20 C-20,10 -8,4 0,4 L0,0 C-14,0 -26,8 -26,20Z M8,0 C20,4 26,16 26,30 L26,150 L10,150 Z', fill: P.jacketSh, opacity: 0.45 }, fore);
      S('rect', { x: -27, y: 150, width: 54, height: 20, rx: 6, fill: P.top }, fore);
      const hand = S('g', {}, fore);
      S('path', { d: 'M-21,166 C-27,188 -24,214 -12,228 C-4,236 8,236 15,226 C25,212 26,188 21,166Z', fill: P.skin, stroke: P.skinSh, 'stroke-width': 1.5 }, hand);
      S('path', { d: `M${side * 18},176 C${side * 34},186 ${side * 36},204 ${side * 26},214 C${side * 20},218 ${side * 14},210 ${side * 14},200Z`, fill: P.skin, stroke: P.skinSh, 'stroke-width': 1.5 }, hand);
      S('path', { d: 'M-12,214 L-10,226 M-3,216 L-2,230 M6,215 L6,228', stroke: P.skinSh, 'stroke-width': 1.4, fill: 'none' }, hand);
      return { side, sx, sy: 300, upper, fore };
    };
    const armL = mkArm(1), armR = mkArm(-1); // R drawn last = on top
    // head
    const head = S('g', {}, body);
    S('ellipse', { cx: -64, cy: 128, rx: 11, ry: 18, fill: P.skinSh }, head);
    S('ellipse', { cx: 64, cy: 128, rx: 11, ry: 18, fill: P.skinSh }, head);
    S('path', { d: 'M-62,70 C-66,110 -64,150 -50,186 C-38,206 -18,214 0,214 C18,214 38,206 50,186 C64,150 66,110 62,70 C50,30 -50,30 -62,70Z', fill: P.skin }, head);
    S('path', { d: 'M18,40 C50,40 64,70 62,100 C64,150 50,190 30,206 C40,170 44,120 30,80Z', fill: P.skinSh, opacity: 0.45 }, head);
    S('ellipse', { cx: -36, cy: 152, rx: 13, ry: 8, fill: '#C07A64', opacity: 0.28 }, head);
    S('ellipse', { cx: 36, cy: 152, rx: 13, ry: 8, fill: '#C07A64', opacity: 0.22 }, head);
    S('circle', { cx: -66, cy: 152, r: 4.5, fill: '#C9A15A' }, head);
    S('circle', { cx: 66, cy: 152, r: 4.5, fill: '#C9A15A' }, head);
    const eyes = [-27, 27].map((ex) => {
      const eg = S('g', {}, head);
      const lid = S('g', {}, eg);
      S('ellipse', { cx: ex, cy: 119, rx: 12.5, ry: 8, fill: '#F3EDE5' }, lid);
      S('circle', { cx: ex - 3.5, cy: 119.5, r: 6.4, fill: '#3A2418' }, lid);
      S('circle', { cx: ex - 3.5, cy: 119.5, r: 3, fill: '#120A07' }, lid);
      S('circle', { cx: ex - 5.5, cy: 117, r: 1.8, fill: '#fff' }, lid);
      const lash = S('path', { d: `M${ex - 14},117 C${ex - 6},109 ${ex + 6},109 ${ex + 14},116 L${ex + 17},113`, fill: 'none', stroke: P.hair, 'stroke-width': 3, 'stroke-linecap': 'round' }, eg);
      return { ex, lid, lash };
    });
    const brows = S('g', {}, head);
    S('path', { d: 'M-44,100 C-34,92 -20,91 -12,95', fill: 'none', stroke: P.hair, 'stroke-width': 5.5, 'stroke-linecap': 'round' }, brows);
    S('path', { d: 'M12,95 C20,91 34,92 44,99', fill: 'none', stroke: P.hair, 'stroke-width': 5.5, 'stroke-linecap': 'round' }, brows);
    S('path', { d: 'M-2,118 C-4,132 -9,146 -8,152 C-4,158 6,158 9,153', fill: 'none', stroke: P.skinSh, 'stroke-width': 3, 'stroke-linecap': 'round' }, head);
    S('ellipse', { cx: 3, cy: 140, rx: 3, ry: 9, fill: '#C08668', opacity: 0.5 }, head);
    // mouth
    const mouth = S('g', {}, head);
    const inner = S('ellipse', { cx: -1, cy: 177, rx: 14, ry: 1.5, fill: '#3B1C18' }, mouth);
    const teeth = S('rect', { x: -10, y: 172, width: 18, height: 3, rx: 1.5, fill: '#F2EEE8', opacity: 0 }, mouth);
    S('path', { d: 'M-18,176 C-10,170 -4,172 -1,174 C2,172 8,170 16,176 C8,177 -10,177 -18,176Z', fill: P.lip }, mouth);
    const lower = S('path', { d: 'M-17,177 C-8,186 8,186 15,177 C6,179 -8,179 -17,177Z', fill: '#A35A4C' }, mouth);
    // front hair + glasses
    S('path', { d: 'M28,22 C-20,14 -70,40 -76,104 C-72,84 -60,70 -44,62 C-20,52 6,46 28,22Z', fill: P.hair }, head);
    S('path', { d: 'M28,22 C64,26 86,60 80,120 C78,160 82,200 92,236 C70,214 66,170 66,130 C66,90 56,60 28,22Z', fill: P.hair }, head);
    S('path', { d: 'M-76,104 C-82,150 -84,200 -96,240 C-74,220 -68,170 -66,120Z', fill: P.hair }, head);
    S('path', { d: 'M-50,52 C-30,34 0,28 22,30 M40,40 C62,58 72,90 72,130', fill: 'none', stroke: P.hairHi, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }, head);
    const glasses = S('g', { fill: 'rgba(255,255,255,0.05)', stroke: P.frames, 'stroke-width': 4.5 }, head);
    S('circle', { cx: -27, cy: 120, r: 21 }, glasses);
    S('circle', { cx: 27, cy: 120, r: 21 }, glasses);
    S('path', { d: 'M-7,116 C-3,111 3,111 7,116 M-48,116 L-64,112 M48,116 L64,112', fill: 'none' }, glasses);
    // ---------------------------------------------------------- animation (pure function of t)
    const words = [];
    for (const lid of o.lines || X.vo.lines.map((l) => l.id)) {
      for (const w of X.line(lid).words) {
        const syl = Math.max(1, (w.w.toLowerCase().match(/[aeiouy]+/g) || []).length);
        words.push({ s: w.start, e: w.end, syl });
      }
    }
    const blinks = []; { const r = X.rand(o.seed || 21); let t = 0.8; while (t < 400) { blinks.push(t); t += 2.4 + r() * 2.6; } }
    const gest = o.gestures || [];
    const nods = o.nods || [];
    const REST = { u: 7, f: -77 }, UP = { u: 22, f: -134 }, OPEN = { u: 30, f: -110 };
    const armAt = (arm, t) => {
      let w = 0, pose = UP;
      for (const gq of gest) {
        if (gq.arm !== 'B' && gq.arm !== arm) continue;
        const k = smooth(gq.t - 0.32, gq.t, t) * (1 - smooth(gq.t + gq.d, gq.t + gq.d + 0.4, t)) * (gq.amt ?? 1);
        if (k > w) { w = k; pose = gq.arm === 'B' ? OPEN : UP; }
      }
      const wob = Math.sin(t * 2.1 + (arm === 'R' ? 0 : 1.7)) * 2.2 * w;
      return { u: lerp(REST.u, pose.u, w) + Math.sin(t * 0.7 + (arm === 'R' ? 0.4 : 2)) * 0.8, f: lerp(REST.f, pose.f, w) + wob };
    };
    const setArm = (a, p) => {
      a.upper.setAttribute('transform', `translate(${a.sx} ${a.sy}) rotate(${(-a.side * p.u).toFixed(2)})`);
      a.fore.setAttribute('transform', `translate(0 192) rotate(${(-a.side * p.f).toFixed(2)})`);
    };
    const upd = (t) => {
      if (o.visible && !o.visible(t)) return;
      // mouth
      let open = 0;
      for (const w of words) {
        if (t >= w.s - 0.02 && t <= w.e + 0.03) {
          const ph = clamp((t - w.s) / Math.max(0.06, w.e - w.s), 0, 1);
          open = Math.max(open, 0.3 + 0.7 * Math.abs(Math.sin(Math.PI * w.syl * ph)));
        }
      }
      inner.setAttribute('ry', (1.5 + 9 * open).toFixed(2));
      lower.setAttribute('transform', `translate(0 ${(7.5 * open).toFixed(2)})`);
      teeth.setAttribute('opacity', open > 0.45 ? 0.9 : 0);
      // blink
      let bl = 1;
      for (const b of blinks) { if (t >= b && t < b + 0.18) { bl = 1 - Math.sin(Math.PI * (t - b) / 0.18) * 0.92; break; } if (b > t) break; }
      for (const e of eyes) {
        e.lid.setAttribute('transform', `translate(0 ${119 * (1 - bl)}) scale(1 ${bl})`);
        e.lash.setAttribute('transform', `translate(0 ${(1 - bl) * 8})`);
      }
      // head idle + nods + brows
      let nod = 0, brow = 0;
      for (const n of nods) { const d = t - n; if (d > -0.1 && d < 0.6) { nod += Math.sin(Math.PI * clamp((d + 0.1) / 0.7, 0, 1)) * 4; brow += Math.sin(Math.PI * clamp((d + 0.1) / 0.7, 0, 1)); } }
      const rot = Math.sin(t * 0.9) * 1.3 + Math.sin(t * 2.3 + 1) * 0.5 - open * 0.6;
      head.setAttribute('transform', `rotate(${rot.toFixed(2)} 0 230) translate(0 ${(nod + Math.sin(t * 1.6) * 0.6).toFixed(2)})`);
      brows.setAttribute('transform', `translate(0 ${(-3.5 * brow - open * 1.2).toFixed(2)})`);
      const br = Math.sin(t * 1.55) * 0.5 + 0.5;
      torso.setAttribute('transform', `translate(0 ${(-1.6 * br).toFixed(2)})`);
      setArm(armR, armAt('R', t)); setArm(armL, armAt('L', t));
      body.setAttribute('transform', `rotate(${(Math.sin(t * 0.5) * 0.35).toFixed(3)} 0 900)`);
    };
    X.every(upd);
    upd(0);
    return { g, head, upd };
  };

  // ------------------------------------------------------------------ CGI stand-ins (canvas in foreignObject)
  function neuron(r, size) {
    const lines = [];
    const walk = (x, y, a, len, depth, w) => {
      const pts = [[x, y]], n = 12;
      for (let k = 0; k < n; k++) { a += (r() - 0.5) * 0.55; x += Math.cos(a) * len / n; y += Math.sin(a) * len / n; pts.push([x, y]); }
      lines.push({ pts, w });
      if (depth > 0) for (let s = 0; s < 2; s++) { const k = 3 + Math.floor(r() * 7); walk(pts[k][0], pts[k][1], a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6), len * 0.55, depth - 1, w * 0.62); }
    };
    const nb = 6 + Math.floor(r() * 4);
    for (let i = 0; i < nb; i++) walk(0, 0, (i / nb) * Math.PI * 2 + r() * 0.5, size * (0.55 + r() * 0.7), 2, 3.2);
    return lines;
  }
  function makeField(seed, n) {
    const r = X.rand(seed), ns = [];
    for (let i = 0; i < n; i++) {
      const z = r();
      ns.push({ x: -160 + r() * 2240, y: -120 + r() * 1320, z, size: 110 + z * 260, lines: null, fade: r() < 0.62, ph: r() });
    }
    ns.sort((a, b) => a.z - b.z);
    for (const q of ns) q.lines = neuron(r, q.size);
    const axons = [];
    for (let i = 0; i < ns.length; i++) {
      let best = -1, bd = 1e9;
      for (let j = 0; j < ns.length; j++) { if (j === i) continue; const d = Math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y) + Math.abs(ns[i].z - ns[j].z) * 900; if (d < bd) { bd = d; best = j; } }
      if (best >= 0 && bd < 900) axons.push({ a: i, b: best, bend: (r() - 0.5) * 260, ph: r() });
    }
    const bokeh = Array.from({ length: 46 }, () => ({ x: r() * 1920, y: r() * 1080, rad: 4 + r() * r() * 34, a: 0.05 + r() * 0.18, vx: (r() - 0.5) * 16, vy: -4 - r() * 10, hue: r() }));
    return { ns, axons, bokeh };
  }
  function drawField(ctx, fld, tt, o) {
    const W = 1920, H = 1080;
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.5, 1150);
    bg.addColorStop(0, o.bgA || '#1E3070'); bg.addColorStop(0.45, o.bgB || '#111B44'); bg.addColorStop(1, o.bgC || '#03050D');
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const push = 1 + (o.push ?? 0.1) * tt, rot = (o.rot ?? 0.012) * tt;
    ctx.globalCompositeOperation = 'lighter';
    const fadeK = o.fadeAt != null ? smooth(o.fadeAt, o.fadeAt + 0.9, tt) : 0;
    const P = (q, x, y) => {
      const par = 0.75 + 0.5 * q.z, s = push * par, cx = 960, cy = 540;
      const X0 = (q.x - cx) * s + x * s * (0.55 + 0.6 * q.z), Y0 = (q.y - cy) * s + y * s * (0.55 + 0.6 * q.z);
      return [cx + X0 * Math.cos(rot) - Y0 * Math.sin(rot), cy + X0 * Math.sin(rot) + Y0 * Math.cos(rot)];
    };
    for (const q of fld.ns) {
      const al = (0.22 + 0.78 * q.z) * (q.fade ? 1 - 0.85 * fadeK : 1) * (o.alpha ?? 1);
      if (al < 0.02) continue;
      const sc = push * (0.75 + 0.5 * q.z) * (0.55 + 0.6 * q.z);
      for (const pass of [0, 1]) {
        ctx.strokeStyle = pass ? `rgba(160,220,255,${0.55 * al})` : `rgba(50,120,255,${0.13 * al})`;
        for (const L of q.lines) {
          ctx.lineWidth = L.w * sc * (pass ? 0.9 : 4.2) * (q.z < 0.35 ? 1.6 : 1);
          ctx.beginPath();
          L.pts.forEach((p, k) => { const [x, y] = P(q, p[0], p[1]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.stroke();
        }
      }
      const [sx, sy] = P(q, 0, 0), rad = 26 * sc;
      const gs = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * 3);
      gs.addColorStop(0, `rgba(235,250,255,${0.95 * al})`); gs.addColorStop(0.18, `rgba(140,220,255,${0.7 * al})`); gs.addColorStop(1, 'rgba(30,80,200,0)');
      ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(sx, sy, rad * 3, 0, 7); ctx.fill();
      // pulses along the 2 main branches
      for (let b = 0; b < 2; b++) {
        const L = q.lines[b * 7 % q.lines.length], ph = ((tt * 0.55 + q.ph + b * 0.5) % 1.3);
        if (ph > 1) continue;
        const idx = (1 - ph) * (L.pts.length - 1), i0 = Math.floor(idx), f = idx - i0, p0 = L.pts[i0], p1 = L.pts[Math.min(i0 + 1, L.pts.length - 1)];
        const [px, py] = P(q, lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f)), pr = 9 * sc;
        const gp = ctx.createRadialGradient(px, py, 0, px, py, pr * 3);
        gp.addColorStop(0, `rgba(255,255,255,${0.9 * al})`); gp.addColorStop(0.3, `rgba(150,230,255,${0.5 * al})`); gp.addColorStop(1, 'rgba(60,140,255,0)');
        ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(px, py, pr * 3, 0, 7); ctx.fill();
      }
    }
    for (const ax of fld.axons) {
      const A = fld.ns[ax.a], B = fld.ns[ax.b];
      const al = (0.2 + 0.6 * Math.min(A.z, B.z)) * (A.fade || B.fade ? 1 - 0.85 * fadeK : 1) * (o.alpha ?? 1);
      const [x0, y0] = P(A, 0, 0), [x1, y1] = P(B, 0, 0), mx = (x0 + x1) / 2 + ax.bend, my = (y0 + y1) / 2 - ax.bend * 0.4;
      ctx.strokeStyle = `rgba(90,170,255,${0.22 * al})`; ctx.lineWidth = 3 * push;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      const ph = (tt * 0.4 + ax.ph) % 1, u = 1 - ph;
      const px = u * u * x0 + 2 * u * ph * mx + ph * ph * x1, py = u * u * y0 + 2 * u * ph * my + ph * ph * y1;
      const gp = ctx.createRadialGradient(px, py, 0, px, py, 22 * push);
      gp.addColorStop(0, `rgba(255,255,255,${0.8 * al})`); gp.addColorStop(1, 'rgba(80,160,255,0)');
      ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(px, py, 22 * push, 0, 7); ctx.fill();
    }
    drawBokeh(ctx, fld.bokeh, tt, o);
    ctx.globalCompositeOperation = 'source-over';
    vignette(ctx, 0.55);
  }
  function drawBokeh(ctx, bk, tt, o) {
    for (const b of bk) {
      const x = ((b.x + b.vx * tt * 3) % 1960 + 1960) % 1960 - 20, y = ((b.y + b.vy * tt * 3) % 1120 + 1120) % 1120 - 20;
      const gb = ctx.createRadialGradient(x, y, 0, x, y, b.rad);
      const col = o.warm && b.hue > 0.6 ? '255,220,150' : '150,200,255';
      gb.addColorStop(0, `rgba(${col},${b.a})`); gb.addColorStop(0.7, `rgba(${col},${b.a * 0.6})`); gb.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gb; ctx.beginPath(); ctx.arc(x, y, b.rad, 0, 7); ctx.fill();
    }
  }
  function vignette(ctx, a) {
    const v = ctx.createRadialGradient(960, 540, 380, 960, 540, 1180);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, 1920, 1080);
  }
  function makeSphere(seed, n) {
    const pts = [], r = X.rand(seed);
    for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963; pts.push([Math.cos(th) * rad, y, Math.sin(th) * rad]); }
    const pairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]); if (d < 0.27 && r() < 0.8) pairs.push([i, j]); }
    const bokeh = Array.from({ length: 30 }, () => ({ x: r() * 1920, y: r() * 1080, rad: 6 + r() * 30, a: 0.04 + r() * 0.12, vx: (r() - 0.5) * 10, vy: -3 - r() * 6, hue: r() }));
    return { pts, pairs, bokeh };
  }
  function drawSphere(ctx, sp, tt, o) {
    const bg = ctx.createRadialGradient(960, 540, 40, 960, 540, 1100);
    bg.addColorStop(0, '#16224E'); bg.addColorStop(0.5, '#0A1030'); bg.addColorStop(1, '#020309');
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);
    const a = tt * 0.32 + 0.6, tilt = 0.38, R = (o.radius ?? 360) * (1 + 0.04 * tt), cx = 960, cy = o.cy ?? 520;
    const proj = sp.pts.map(([x, y, z]) => {
      const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
      const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt), z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
      const p = 1.9 / (2.6 - z2);
      return [cx + x1 * R * p, cy + y2 * R * p, z2];
    });
    ctx.globalCompositeOperation = 'lighter';
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
    core.addColorStop(0, 'rgba(70,120,255,0.30)'); core.addColorStop(1, 'rgba(20,40,140,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, 7); ctx.fill();
    for (const [i, j] of sp.pairs) {
      const A = proj[i], B = proj[j], d = (A[2] + B[2]) / 2, al = 0.08 + 0.32 * (d + 1) / 2;
      ctx.strokeStyle = `rgba(120,200,255,${al})`; ctx.lineWidth = 1.2 + (d + 1);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    proj.forEach((p, i) => {
      const al = 0.25 + 0.75 * (p[2] + 1) / 2, rr = 3 + 5 * (p[2] + 1) / 2, flick = 0.75 + 0.25 * Math.sin(tt * 3 + i);
      const gp = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 4);
      gp.addColorStop(0, `rgba(230,248,255,${al * flick})`); gp.addColorStop(0.3, `rgba(130,210,255,${al * 0.5})`); gp.addColorStop(1, 'rgba(40,90,220,0)');
      ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 4, 0, 7); ctx.fill();
    });
    drawBokeh(ctx, sp.bokeh, tt, o);
    ctx.globalCompositeOperation = 'source-over';
    const dim = ctx.createRadialGradient(960, 560, 0, 960, 560, 700);
    dim.addColorStop(0, `rgba(0,0,0,${o.dim ?? 0.45})`); dim.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dim; ctx.fillRect(0, 0, 1920, 1080);
    vignette(ctx, 0.6);
  }
  function blob(ctx, pts) {
    ctx.beginPath();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % n], m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      if (i === 0) { const pl = pts[n - 1]; ctx.moveTo((pl[0] + p0[0]) / 2, (pl[1] + p0[1]) / 2); }
      ctx.quadraticCurveTo(p0[0], p0[1], m[0], m[1]);
    }
    ctx.closePath();
  }
  function makeSynapse(seed) {
    const r = X.rand(seed);
    const ves = Array.from({ length: 26 }, () => ({ a: r() * Math.PI * 2, d: r(), ph: r() }));
    const nt = Array.from({ length: 70 }, () => ({ ph: r(), y: (r() - 0.5), sp: 0.5 + r() * 0.6, wob: r() * 6 }));
    const bokeh = Array.from({ length: 40 }, () => ({ x: r() * 1920, y: r() * 1080, rad: 5 + r() * 36, a: 0.05 + r() * 0.16, vx: (r() - 0.5) * 12, vy: -3 - r() * 8, hue: r() }));
    return { ves, nt, bokeh };
  }
  function drawSynapse(ctx, sy, tt, o) {
    const bg = ctx.createRadialGradient(960, 520, 60, 960, 540, 1150);
    bg.addColorStop(0, '#16245C'); bg.addColorStop(0.5, '#08102E'); bg.addColorStop(1, '#010207');
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);
    const s = 1 + 0.05 * tt, rot = -0.03 + 0.012 * tt;
    ctx.setTransform(s * Math.cos(rot), s * Math.sin(rot), -s * Math.sin(rot), s * Math.cos(rot), 960 - s * 960 * Math.cos(rot) + s * 540 * Math.sin(rot), 540 - s * 960 * Math.sin(rot) - s * 540 * Math.cos(rot));
    const grow = smooth(0, o.build ?? 2.2, tt);
    // presynaptic terminal (left) and receiving spine (right)
    const pre = [[-200, 300], [420, 250], [760, 360], [830, 540], [760, 720], [420, 830], [-200, 780]];
    const post = [[2120, 260], [1500, 300], [1150, 400], [1100, 540], [1150, 680], [1500, 790], [2120, 820]];
    for (const [shape, glowA] of [[pre, 0.55], [post, 0.35 + 0.5 * grow]]) {
      const gfill = ctx.createLinearGradient(shape === pre ? 0 : 1920, 0, shape === pre ? 840 : 1090, 0);
      gfill.addColorStop(0, 'rgba(16,30,96,0.95)'); gfill.addColorStop(0.75, 'rgba(34,70,170,0.95)'); gfill.addColorStop(1, 'rgba(110,180,255,0.95)');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = gfill; blob(ctx, shape); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (const [w, a] of [[34, 0.06], [14, 0.14], [4, 0.6]]) { ctx.strokeStyle = `rgba(150,215,255,${a * glowA * 1.6})`; ctx.lineWidth = w; blob(ctx, shape); ctx.stroke(); }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const v of sy.ves) { // vesicles inside the terminal
      const x = 560 + Math.cos(v.a) * 190 * v.d + Math.sin(tt * 1.3 + v.ph * 6) * 6, y = 540 + Math.sin(v.a) * 190 * v.d;
      const gv = ctx.createRadialGradient(x, y, 0, x, y, 16);
      gv.addColorStop(0, 'rgba(255,236,150,0.85)'); gv.addColorStop(0.5, 'rgba(255,200,90,0.35)'); gv.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = gv; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
    }
    const rate = 0.25 + 0.75 * grow;
    for (const p of sy.nt) { // transmitter crossing the gap
      const ph = (tt * p.sp * 0.6 + p.ph) % 1;
      if (p.ph > rate) continue;
      const x = 830 + ph * 290, y = 540 + p.y * 260 * (0.35 + ph * 0.8) + Math.sin(tt * 4 + p.wob) * 5;
      const gp = ctx.createRadialGradient(x, y, 0, x, y, 10);
      gp.addColorStop(0, 'rgba(255,245,190,0.95)'); gp.addColorStop(1, 'rgba(255,210,90,0)');
      ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
    }
    for (let k = 0; k < 7; k++) { // receptors light up as the signal builds
      const y = 420 + k * 40, x = 1112 + Math.abs(k - 3) * 9, a = 0.15 + 0.85 * grow * (0.6 + 0.4 * Math.sin(tt * 5 + k));
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 30);
      gr.addColorStop(0, `rgba(190,255,240,${a})`); gr.addColorStop(1, 'rgba(60,200,220,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBokeh(ctx, sy.bokeh, tt, { warm: true });
    ctx.globalCompositeOperation = 'source-over';
    vignette(ctx, 0.75);
  }
  /** Canvas CGI shot. o.mode: 'field' (neurons; o.fadeAt seconds after t0 dims ~60 %), 'sphere', 'synapse', 'tunnel'. */
  BT.cgi = (parent, t0, t1, o = {}) => {
    const g = X.scene(o.name || id('cgi'), t0, t1, null, parent);
    const fo = X.svg('foreignObject', { x: 0, y: 0, width: 1920, height: 1080 }, g);
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; cv.style.display = 'block';
    fo.appendChild(cv);
    const ctx = cv.getContext('2d');
    const mode = o.mode || 'field';
    const data = mode === 'sphere' ? makeSphere(o.seed || 3, o.n || 240) : mode === 'synapse' ? makeSynapse(o.seed || 5) : makeField(o.seed || 7, o.n || 13);
    const draw = (t) => {
      const tt = t - t0 + (o.offset || 0);
      if (mode === 'sphere') drawSphere(ctx, data, tt, o);
      else if (mode === 'synapse') drawSynapse(ctx, data, tt, o);
      else drawField(ctx, data, tt, mode === 'tunnel' ? { push: 0.35, rot: 0.04, alpha: 0.7, bgA: '#14204C', ...o } : o);
    };
    X.every((t) => { if (t >= t0 - 0.02 && t <= t1 + 0.02) draw(t); });
    return g;
  };

  // ------------------------------------------------------------------ RGB glitch
  let _gl;
  BT.glitch = (target, t, frames = 4) => {
    if (!_gl) {
      const f = X.svg('filter', { id: 'btGlitch', x: '-5%', y: '-5%', width: '110%', height: '110%', 'color-interpolation-filters': 'sRGB' }, X.defs);
      const tb = X.svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.0008 0.09', numOctaves: 1, seed: 2, result: 'n' }, f);
      X.svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 70, xChannelSelector: 'R', yChannelSelector: 'B', result: 'd' }, f);
      X.svg('feColorMatrix', { in: 'd', type: 'matrix', values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'r' }, f);
      const oR = X.svg('feOffset', { in: 'r', dx: 22, dy: 0, result: 'ro' }, f);
      X.svg('feColorMatrix', { in: 'd', type: 'matrix', values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'g' }, f);
      X.svg('feColorMatrix', { in: 'd', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', result: 'b' }, f);
      const oB = X.svg('feOffset', { in: 'b', dx: -22, dy: 0, result: 'bo' }, f);
      X.svg('feBlend', { in: 'ro', in2: 'g', mode: 'screen', result: 'rg' }, f);
      X.svg('feBlend', { in: 'rg', in2: 'bo', mode: 'screen' }, f);
      _gl = { tb, oR, oB, wins: [] };
      X.every((tt) => {
        const w = _gl.wins.find((q) => tt >= q[0] && tt < q[1]);
        if (!w) return;
        const k = Math.floor(tt * 24);
        _gl.tb.setAttribute('seed', 1 + (k % 7));
        const amp = 14 + (k % 3) * 9;
        _gl.oR.setAttribute('dx', amp); _gl.oB.setAttribute('dx', -amp);
      });
    }
    const a = t - F(Math.floor(frames / 2)), b = a + F(frames);
    _gl.wins.push([a, b]);
    X.tl.set(target, { attr: { filter: 'url(#btGlitch)' } }, a);
    X.tl.set(target, { attr: { filter: 'none' } }, b);
    X.sfx(a, 'glitch', { gain: 0.32, dur: F(frames) });
  };

  /** Light sepia toning over a B&W area (aged print). */
  BT.sepia = (parent, x, y, w, h, op = 0.38) => X.svg('rect', { x, y, width: w, height: h, fill: '#B98A55', opacity: op, style: { mixBlendMode: 'color' } }, parent);
  // ------------------------------------------------------------------ archival: slide projector, film strip, document push
  /** Rounded "old slide" frame on black. plates: [{t, build(g, w, h)}]; 3-frame blank white slide between plates. */
  BT.slideFrame = (parent, t0, t1, plates, o = {}) => {
    const g = X.scene(o.name || id('slide'), t0, t1, null, parent);
    X.svg('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#050505' }, g);
    const x = 120, y = 66, w = 1680, h = 948, b = 10;
    const d = `M${x + 100},${y} Q${x + w / 2},${y - b} ${x + w - 100},${y} Q${x + w},${y} ${x + w},${y + 100} Q${x + w + b},${y + h / 2} ${x + w},${y + h - 100} Q${x + w},${y + h} ${x + w - 100},${y + h} Q${x + w / 2},${y + h + b} ${x + 100},${y + h} Q${x},${y + h} ${x},${y + h - 100} Q${x - b},${y + h / 2} ${x},${y + 100} Q${x},${y} ${x + 100},${y}Z`;
    const cp = X.svg('clipPath', { id: id('slideclip') }, X.defs);
    X.svg('path', { d }, cp);
    const inner = X.svg('g', { 'clip-path': `url(#${cp.id})` }, g);
    const push = X.svg('g', {}, inner);
    plates.forEach((p, i) => {
      const tEnd = i + 1 < plates.length ? plates[i + 1].t - F(3) : t1;
      const pg = X.scene(id('plate'), p.t, tEnd, null, push);
      const content = X.svg('g', { transform: `translate(${x} ${y})` }, pg);
      p.build(content, w, h, p.t, tEnd);
      if (i > 0) {
        const blank = X.scene(id('blank'), p.t - F(3), p.t, null, push);
        X.svg('rect', { x, y, width: w, height: h, fill: BT.C.slide }, blank);
        X.sfx(p.t - F(3), 'shutter', { gain: 0.3 });
      }
      X.tl.fromTo(content, { scale: 1 }, { scale: 1.06, duration: tEnd - p.t, ease: 'none', transformOrigin: '50% 50%' }, p.t);
    });
    if (o.sepia !== false) BT.sepia(inner, x, y, w, h, o.sepia ?? 0.34);
    BT.filmNoise(inner, 0.22, { t0, t1, x, y, w, h, seed: o.seed || 13 });
    const burn = X.radial(id('burn'), [[0, '#000', 0], [0.72, BT.C.burn, 0], [0.9, '#6E5434', 0.55], [1, '#1A1008', 0.95]], 0.5, 0.5, 0.62);
    X.svg('rect', { x, y, width: w, height: h, fill: burn, style: { mixBlendMode: 'multiply' } }, inner);
    for (const [sw, op] of [[34, 0.3], [14, 0.45], [5, 0.85]]) X.svg('path', { d, fill: 'none', stroke: '#140C06', 'stroke-width': sw, opacity: op }, inner);
    X.sfx(t0, 'shutter', { gain: 0.32 });
    return { g, inner, x, y, w, h };
  };
  /** Write-on label (left→right clip, 8 f) + hand-drawn curved arrow (10 f). pts = arrow path d. */
  BT.annotate = (parent, str, tx, ty, t, arrowD, o = {}) => {
    const size = o.size ?? 46;
    const tt = BT.text(parent, str, tx, ty, { size, fill: '#fff', italic: o.italic ?? true, weight: o.weight ?? 700 });
    const w = tt.getComputedTextLength();
    const cp = BT.clipRect(tx - 6, ty - size, 0, size * 1.5);
    tt.setAttribute('clip-path', cp.url);
    X.tl.to(cp.rect, { attr: { width: w + 14 }, duration: F(8), ease: 'power1.inOut' }, t);
    X.sfx(t, 'scribble', { gain: 0.12, dur: 0.35 });
    if (arrowD) {
      const ap = X.svg('path', { d: arrowD, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      X.drawOn(ap, t + F(4), F(10), 'power1.inOut');
      const L = ap.getTotalLength(), e = ap.getPointAtLength(L), q = ap.getPointAtLength(L - 14);
      const ang = Math.atan2(e.y - q.y, e.x - q.x), hd = 22;
      const head = X.svg('path', {
        d: `M${e.x - hd * Math.cos(ang - 0.5)},${e.y - hd * Math.sin(ang - 0.5)} L${e.x},${e.y} L${e.x - hd * Math.cos(ang + 0.5)},${e.y - hd * Math.sin(ang + 0.5)}`,
        fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0,
      }, parent);
      X.tl.set(head, { opacity: 1 }, t + F(14));
    }
    return tt;
  };
  /** 35 mm strip drifting left at v px/s over paper; frames [build(g, w, h)]; optional zoom into frame k at tz. */
  BT.filmStrip = (parent, t0, t1, frames, o = {}) => {
    const g = X.scene(o.name || id('strip'), t0, t1, null, parent);
    BT.paperBG(g, { vignette: true, seed: 8, speckle: 1800 });
    const zoomG = X.svg('g', {}, g);
    const strip = X.svg('g', {}, zoomG);
    const fw = o.fw ?? 440, fh = o.fh ?? 314, gap = o.gap ?? 34, pitch = fw + gap, sh = fh + 120, sy = 540 - sh / 2, c0 = o.c0 ?? 300, v = o.v ?? 150;
    const n = frames.length, x0 = c0 - fw / 2 - gap / 2 - pitch, totalW = pitch * (n + 3);
    X.svg('rect', { x: x0, y: sy, width: totalW, height: sh, fill: '#16130F' }, strip);
    for (let x = x0 + 10; x < x0 + totalW; x += 30) {
      X.svg('rect', { x, y: sy + 16, width: 16, height: 24, rx: 4, fill: '#E9E6DF' }, strip);
      X.svg('rect', { x, y: sy + sh - 40, width: 16, height: 24, rx: 4, fill: '#E9E6DF' }, strip);
    }
    for (let i = -1; i < n + 1; i++) {
      BT.text(strip, `${o.edge || 'OQ 35'}  ${14 + i}${i % 2 ? 'A' : ''}  ▸`, c0 + i * pitch - fw / 2, sy + 56, { size: 14, family: 'Roboto Mono, monospace', weight: 500, fill: '#C9893C' });
    }
    const centres = [];
    frames.forEach((build, i) => {
      const cx = c0 + i * pitch, fx = cx - fw / 2, fy = 540 - fh / 2;
      const cp = BT.clipRect(fx, fy, fw, fh);
      const fg = X.svg('g', { 'clip-path': cp.url }, strip);
      const content = X.svg('g', { transform: `translate(${fx} ${fy})` }, fg);
      build(content, fw, fh, i);
      if (o.sepia !== false) BT.sepia(fg, fx, fy, fw, fh, o.sepia ?? 0.28);
      X.svg('rect', { x: fx, y: fy, width: fw, height: fh, fill: 'none', stroke: '#000', 'stroke-width': 3, opacity: 0.6 }, strip);
      centres.push([cx, 540]);
    });
    BT.filmNoise(g, 0.14, { t0, t1, seed: 17 });
    const tz = o.zoomAt ?? t1;
    X.tl.fromTo(strip, { x: 0 }, { x: -v * (tz - t0), duration: tz - t0, ease: 'none' }, t0);
    if (o.zoomTo != null) {
      const [cx, cy] = centres[o.zoomTo], sxAt = cx - v * (tz - t0), S = 1920 / fw * 1.02;
      X.tl.fromTo(zoomG, { scale: 1, x: 0, y: 0 }, { scale: S, x: 960 - S * sxAt, y: 540 - S * cy, duration: F(10), ease: 'power2.in', svgOrigin: '0 0' }, tz);
      X.sfx(tz, 'zoom_in', { gain: 0.22 });
    }
    return { g, strip, centres, pitch, v };
  };
  /** Screenshot/document on black: slow linear push, then optional crash zoom toward (fx, fy). */
  BT.docPush = (parent, t0, t1, build, o = {}) => {
    const g = X.scene(o.name || id('doc'), t0, t1, null, parent);
    X.svg('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#070707' }, g);
    const cam = X.svg('g', {}, g);
    const content = X.svg('g', {}, cam);
    build(content);
    const tc = o.crashAt ?? t1;
    X.tl.fromTo(cam, { scale: 1 }, { scale: o.push ?? 1.12, duration: tc - t0, ease: 'none', svgOrigin: '960 540' }, t0);
    if (o.crashAt != null) {
      const S = o.crashScale ?? 2.4, [fx, fy] = o.focus || [960, 540];
      X.tl.to(cam, { scale: S, x: (960 - fx) * S * 0.9, y: (540 - fy) * S * 0.9, duration: t1 - tc, ease: 'power2.in', svgOrigin: '960 540' }, tc);
      X.sfx(tc, 'zoom_in', { gain: 0.25 });
    }
    return { g, content };
  };

  // ------------------------------------------------------------------ B&W "archival" plates (illustrated stand-ins)
  BT.plates = {};
  const grey = (v) => `rgb(${v},${v},${v})`;
  /** Generic 19th-century cabinet-card bust: bearded scholar (a stand-in, not a likeness). */
  BT.plates.portrait = (g, w, h) => {
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: X.radial(id('pbg'), [[0, grey(172)], [0.55, grey(124)], [1, grey(58)]], 0.42, 0.36, 0.78) }, g);
    const cx = w * 0.47, cy = h * 0.4, s = h / 860;
    const P = (d) => d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, a, b) => `${(cx + a * s).toFixed(1)},${(cy + b * s).toFixed(1)}`);
    const hatchId = id('hatch');
    const pat = X.svg('pattern', { id: hatchId, patternUnits: 'userSpaceOnUse', width: 6, height: 6, patternTransform: 'rotate(38)' }, X.defs);
    X.svg('rect', { x: 0, y: 0, width: 1.6, height: 6, fill: '#000', opacity: 0.5 }, pat);
    const shade = id('fshade');
    X.linear(shade, [[0, grey(196)], [0.55, grey(170)], [1, grey(110)]], 0, 0, 1, 0);
    // coat, collar, cravat
    X.svg('path', { d: P('M-400,620 C-380,380 -260,300 -130,282 L130,282 C260,300 380,380 400,620Z'), fill: grey(40) }, g);
    X.svg('path', { d: P('M-400,620 C-380,380 -260,300 -130,282 L130,282 C260,300 380,380 400,620Z'), fill: `url(#${hatchId})`, opacity: 0.6 }, g);
    X.svg('path', { d: P('M-70,278 L70,278 L52,380 L0,430 L-52,380Z'), fill: grey(214) }, g);
    X.svg('path', { d: P('M-40,300 L40,300 L26,346 L-26,346Z'), fill: grey(26) }, g);
    X.svg('path', { d: P('M-160,282 L-66,282 L-12,470 L-100,400Z M160,282 L66,282 L12,470 L100,400Z'), fill: grey(22) }, g);
    // neck + ears + face
    X.svg('path', { d: P('M-50,120 L50,120 L56,290 L-56,290Z'), fill: grey(150) }, g);
    X.svg('ellipse', { cx: cx - 112 * s, cy: cy - 10 * s, rx: 20 * s, ry: 36 * s, fill: grey(150) }, g);
    X.svg('ellipse', { cx: cx + 112 * s, cy: cy - 10 * s, rx: 20 * s, ry: 36 * s, fill: grey(118) }, g);
    X.svg('path', { d: P('M-108,-80 C-112,-180 -50,-226 4,-226 C64,-226 116,-180 110,-80 C114,0 100,70 70,120 L-70,120 C-100,70 -114,0 -108,-80Z'), fill: `url(#${shade})` }, g);
    // hair: side part, high forehead, swept back
    X.svg('path', { d: P('M-116,-40 C-130,-150 -80,-236 0,-240 C80,-244 132,-180 120,-40 C112,-110 96,-160 60,-178 C30,-192 -10,-196 -40,-186 C-60,-198 -84,-170 -96,-140 C-106,-110 -112,-80 -116,-40Z'), fill: grey(54) }, g);
    for (let i = 0; i < 9; i++) X.svg('path', { d: P(`M${-90 + i * 22},${-170 - (i % 3) * 8} C${-70 + i * 22},${-210} ${-30 + i * 20},${-226} ${10 + i * 14},${-230}`), stroke: grey(96), 'stroke-width': 2.2, fill: 'none', opacity: 0.6 }, g);
    // beard + moustache (full, rounded)
    X.svg('path', { d: P('M-110,-20 C-114,80 -96,200 -40,270 C-12,300 24,300 52,270 C104,200 118,80 112,-20 C98,30 76,52 48,54 C28,40 -24,40 -44,54 C-76,52 -98,30 -110,-20Z'), fill: grey(70) }, g);
    for (let i = 0; i < 30; i++) { const a = -80 + i * 5.6, xx = Math.sin(a * Math.PI / 180) * 92; X.svg('path', { d: P(`M${xx.toFixed(0)},${(50 + Math.abs(xx) * 0.1).toFixed(0)} C${(xx * 1.08).toFixed(0)},130 ${(xx * 0.9).toFixed(0)},210 ${(xx * 0.55).toFixed(0)},268`), stroke: i % 2 ? grey(104) : grey(52), 'stroke-width': 2, fill: 'none', opacity: 0.6 }, g); }
    X.svg('path', { d: P('M-66,40 C-40,22 -10,26 0,38 C10,26 40,22 66,40 C40,54 10,50 0,46 C-10,50 -40,54 -66,40Z'), fill: grey(48) }, g);
    // eyes, brows, nose
    for (const sx of [-1, 1]) {
      X.svg('path', { d: P(`M${sx * 22},-58 C${sx * 36},-70 ${sx * 64},-70 ${sx * 80},-58`), stroke: grey(44), 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, g);
      X.svg('path', { d: P(`M${sx * 28},-34 C${sx * 40},-44 ${sx * 62},-44 ${sx * 72},-34 C${sx * 62},-28 ${sx * 40},-28 ${sx * 28},-34Z`), fill: grey(226) }, g);
      X.svg('circle', { cx: cx + sx * 50 * s - 3 * s, cy: cy - 35 * s, r: 8 * s, fill: grey(30) }, g);
      X.svg('path', { d: P(`M${sx * 26},-38 C${sx * 40},-48 ${sx * 62},-48 ${sx * 74},-37`), stroke: grey(40), 'stroke-width': 3.5, fill: 'none' }, g);
    }
    X.svg('path', { d: P('M2,-40 C0,-10 -12,8 -8,18 C0,26 14,24 18,16'), stroke: grey(100), 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, g);
    X.svg('path', { d: P('M40,-200 C96,-180 118,-110 110,-40 C112,10 100,60 80,100 C96,30 100,-60 40,-200Z'), fill: grey(90), opacity: 0.45 }, g);
    // cabinet-card oval vignette
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: X.radial(id('oval'), [[0, '#000', 0], [0.6, '#000', 0], [0.78, grey(228), 0.55], [1, grey(234), 0.95]], 0.47, 0.45, 0.62) }, g);
  };
  /** Old book title page; lines [{text, size, italic, gap}] centred. */
  BT.plates.book = (g, w, h, lines) => {
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: grey(40) }, g);
    const px = w * 0.24, pw = w * 0.52, py = h * 0.06, ph = h * 0.9;
    X.svg('rect', { x: px + 10, y: py + 12, width: pw, height: ph, fill: '#000', opacity: 0.5 }, g);
    X.svg('rect', { x: px, y: py, width: pw, height: ph, fill: X.linear(id('pg'), [[0, grey(178)], [0.08, grey(222)], [0.9, grey(214)], [1, grey(190)]], 0, 0, 1, 0) }, g);
    X.svg('rect', { x: px + pw * 0.08, y: py + ph * 0.05, width: pw * 0.84, height: ph * 0.9, fill: 'none', stroke: grey(80), 'stroke-width': 2 }, g);
    let y = py + ph * 0.2;
    for (const L of lines) {
      y += L.gap ?? 0;
      if (L.rule) { X.svg('rect', { x: px + pw * 0.38, y: y - 6, width: pw * 0.24, height: 2.5, fill: grey(40) }, g); y += 30; continue; }
      BT.text(g, L.text, px + pw / 2, y, { size: L.size || 40, italic: L.italic, weight: L.weight ?? (L.italic ? 400 : 700), fill: grey(26), anchor: 'middle' });
      y += (L.size || 40) * 1.5;
    }
    const r = X.rand(31); // foxing spots
    for (let i = 0; i < 26; i++) X.svg('circle', { cx: px + r() * pw, cy: py + r() * ph, r: 1 + r() * 4, fill: grey(120), opacity: 0.12 + r() * 0.2 }, g);
  };
  /** Index card with a hand-lettered word on a desk (B&W). Returns the word element (opacity 0 until revealed). */
  BT.plates.indexCard = (g, w, h, word, o = {}) => {
    const r = X.rand(o.seed || 3);
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: grey(92) }, g);
    for (let i = 0; i < 9; i++) X.svg('path', { d: `M0,${(i * 37 + r() * 12).toFixed(0)} C${w * 0.3},${(i * 37 + r() * 20).toFixed(0)} ${w * 0.7},${(i * 37 - r() * 20).toFixed(0)} ${w},${(i * 37 + r() * 12).toFixed(0)}`, stroke: grey(70), 'stroke-width': 3, fill: 'none', opacity: 0.6 }, g);
    const cg = X.svg('g', { transform: `translate(${w / 2} ${h / 2}) rotate(${((r() - 0.5) * 7).toFixed(2)})` }, g);
    X.svg('rect', { x: -w * 0.36 + 6, y: -h * 0.3 + 8, width: w * 0.72, height: h * 0.6, fill: '#000', opacity: 0.35 }, cg);
    X.svg('rect', { x: -w * 0.36, y: -h * 0.3, width: w * 0.72, height: h * 0.6, fill: grey(226) }, cg);
    X.svg('rect', { x: -w * 0.36, y: -h * 0.3 + 26, width: w * 0.72, height: 2, fill: grey(150) }, cg);
    for (let i = 1; i < 5; i++) X.svg('rect', { x: -w * 0.36, y: -h * 0.3 + 26 + i * 30, width: w * 0.72, height: 1.2, fill: grey(196) }, cg);
    const tx = BT.text(cg, word, 0, 30, { size: o.size || 96, family: BT.hand, weight: 700, fill: grey(30), anchor: 'middle' });
    return tx;
  };
  /** Pocket watch on a desk (B&W); returns {secondHand, cx, cy}. Tick it with BT.tickWatch. */
  BT.plates.watch = (g, w, h, o = {}) => {
    X.svg('rect', { x: 0, y: 0, width: w, height: h, fill: X.radial(id('wbg'), [[0, grey(110)], [1, grey(34)]], 0.45, 0.45, 0.8) }, g);
    const cx = w * (o.cx ?? 0.5), cy = h * (o.cy ?? 0.54), R = h * (o.r ?? 0.33);
    X.svg('path', { d: `M${cx},${cy - R - 40} C${cx - R * 0.9},${cy - R * 1.6} ${cx - R * 1.8},${cy - R * 0.4} ${cx - R * 1.9},${cy + R * 0.9}`, fill: 'none', stroke: grey(150), 'stroke-width': R * 0.05, 'stroke-dasharray': `${R * 0.07} ${R * 0.03}` }, g);
    X.svg('ellipse', { cx: cx + R * 0.08, cy: cy + R * 0.1, rx: R * 1.08, ry: R * 1.06, fill: '#000', opacity: 0.45 }, g);
    X.svg('rect', { x: cx - R * 0.09, y: cy - R * 1.2, width: R * 0.18, height: R * 0.24, rx: R * 0.04, fill: grey(160) }, g);
    X.svg('circle', { cx, cy: cy - R * 1.27, r: R * 0.1, fill: 'none', stroke: grey(170), 'stroke-width': R * 0.035 }, g);
    X.svg('circle', { cx, cy, r: R * 1.04, fill: X.linear(id('case'), [[0, grey(205)], [0.5, grey(120)], [1, grey(70)]], 0, 0, 1, 1) }, g);
    X.svg('circle', { cx, cy, r: R * 0.93, fill: grey(226), stroke: grey(90), 'stroke-width': 3 }, g);
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = R * (big ? 0.78 : 0.84), r1 = R * 0.88;
      X.svg('line', { x1: cx + Math.sin(a) * r0, y1: cy - Math.cos(a) * r0, x2: cx + Math.sin(a) * r1, y2: cy - Math.cos(a) * r1, stroke: grey(40), 'stroke-width': big ? 4 : 1.6 }, g);
    }
    const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    rom.forEach((s, i) => { const a = i / 12 * Math.PI * 2; BT.text(g, s, cx + Math.sin(a) * R * 0.64, cy - Math.cos(a) * R * 0.64 + R * 0.06, { size: R * 0.15, weight: 400, fill: grey(30), anchor: 'middle' }); });
    X.svg('circle', { cx, cy: cy + R * 0.42, r: R * 0.17, fill: 'none', stroke: grey(120), 'stroke-width': 1.5 }, g);
    X.svg('path', { d: `M${cx - R * 0.03},${cy} L${cx},${cy - R * 0.45} L${cx + R * 0.03},${cy}Z`, fill: grey(20), transform: `rotate(${o.hour ?? -62} ${cx} ${cy})` }, g);
    X.svg('path', { d: `M${cx - R * 0.025},${cy} L${cx},${cy - R * 0.7} L${cx + R * 0.025},${cy}Z`, fill: grey(20), transform: `rotate(${o.minute ?? 48} ${cx} ${cy})` }, g);
    const sec = X.svg('line', { x1: cx, y1: cy + R * 0.12, x2: cx, y2: cy - R * 0.8, stroke: grey(15), 'stroke-width': 2.4 }, g);
    X.svg('circle', { cx, cy, r: R * 0.035, fill: grey(20) }, g);
    X.svg('ellipse', { cx: cx - R * 0.3, cy: cy - R * 0.45, rx: R * 0.42, ry: R * 0.2, fill: '#fff', opacity: 0.18, transform: `rotate(-30 ${cx - R * 0.3} ${cy - R * 0.45})` }, g);
    return { secondHand: sec, cx, cy, R };
  };
  /** Step a second hand once per second between t0 and t1 (with tick SFX). */
  BT.tickWatch = (wt, t0, t1, start = 18, o = {}) => {
    const steps = Math.floor(t1 - t0) + 1;
    for (let k = 0; k <= steps; k++) {
      const tk = t0 + k;
      X.tl.set(wt.secondHand, { attr: { transform: `rotate(${(start + k) * 6} ${wt.cx} ${wt.cy})` } }, k === 0 ? Math.max(0, t0 - 0.001) : tk);
      if (k > 0 && tk < t1 && o.sfx !== false) X.sfx(tk, k % 2 ? 'tick' : 'tock', { gain: 0.16 });
    }
  };

  // ------------------------------------------------------------------ paper diagrams
  BT.diagram = {};
  /** Axes on paper (black 3 px, serif italic labels). Returns mapping helpers. */
  BT.diagram.axes = (g, o = {}) => {
    const x0 = o.x0 ?? 380, x1 = o.x1 ?? 1580, y0 = o.y0 ?? 330, y1 = o.y1 ?? 820;
    X.svg('path', { d: `M${x0},${y0 - 20} L${x0},${y1} L${x1 + 20},${y1}`, fill: 'none', stroke: BT.C.ink, 'stroke-width': 3 }, g);
    X.svg('path', { d: `M${x0 - 10},${y0 - 6} L${x0},${y0 - 24} L${x0 + 10},${y0 - 6} M${x1 + 6},${y1 - 10} L${x1 + 24},${y1} L${x1 + 6},${y1 + 10}`, fill: 'none', stroke: BT.C.ink, 'stroke-width': 3 }, g);
    if (o.yLabel) BT.text(g, o.yLabel, x0 - 26, y0 + 10, { size: 40, italic: true, weight: 400, anchor: 'end' });
    if (o.xLabel) BT.text(g, o.xLabel, x1 + 22, y1 - 24, { size: 40, italic: true, weight: 400, anchor: 'end' });
    (o.ticks || []).forEach(([u, s]) => {
      const x = x0 + (x1 - x0) * u;
      X.svg('line', { x1: x, y1: y1, x2: x, y2: y1 + 12, stroke: BT.C.ink, 'stroke-width': 2.4 }, g);
      BT.text(g, s, x, y1 + 50, { size: 28, italic: true, weight: 400, anchor: 'middle' });
    });
    return { x0, x1, y0, y1, X: (u) => x0 + (x1 - x0) * u, Y: (v) => y1 - (y1 - y0) * v };
  };
  /** Smooth path through points [[u, v]] (Catmull-Rom → cubic). */
  BT.diagram.curve = (ax, pts, g, o = {}) => {
    const P = pts.map(([u, v]) => [ax.X(u), ax.Y(v)]);
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)], k = o.tension ?? 6;
      if (o.jumps && o.jumps.includes(i)) { d += ` L${p2[0]},${p2[1]}`; continue; }
      d += ` C${p1[0] + (p2[0] - p0[0]) / k},${p1[1] + (p2[1] - p0[1]) / k} ${p2[0] - (p3[0] - p1[0]) / k},${p2[1] - (p3[1] - p1[1]) / k} ${p2[0]},${p2[1]}`;
    }
    return X.svg('path', { d, fill: 'none', stroke: o.stroke || BT.C.ink, 'stroke-width': o.width ?? 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(o.attrs || {}) }, g);
  };

  // ------------------------------------------------------------------ end card
  BT.endCard = (parent, t0, t1, tapes, o = {}) => {
    const g = X.scene(o.name || id('end'), t0, t1, null, parent);
    const dark = !!o.dark, ink = dark ? '#fff' : '#111';
    if (!dark) BT.paperBG(g, { vignette: false, speckle: 600, seed: 21 });
    const lg = X.svg('g', {}, g);
    X.svg('rect', { x: 960 - 30, y: 360, width: 60, height: 60, fill: 'none', stroke: ink, 'stroke-width': 3.5 }, lg);
    BT.text(lg, o.mono || 'OQ', 960, 402, { size: 26, anchor: 'middle', fill: ink });
    let y = 470;
    tapes.forEach((tp) => {
      const w = BT.measure(tp.text, { size: tp.size || 54, weight: 700 }) + 2 * Math.round((tp.size || 54) * 0.42);
      BT.labelTape(g, tp.text, 960 - w / 2, y, tp.t, { size: tp.size || 54, style: tp.style || (dark ? 'white' : 'black'), italic: tp.italic });
      y += Math.round((tp.size || 54) * 1.6) + 10;
    });
    if (o.small) BT.text(g, o.small, 960, y + 56, { size: 24, italic: true, weight: 400, anchor: 'middle', fill: dark ? '#D8DEEA' : '#444' });
    return g;
  };
})();
