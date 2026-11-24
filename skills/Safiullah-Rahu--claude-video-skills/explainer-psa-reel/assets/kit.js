/* explainer-psa-reel kit — vertical (1080×1920) Hinglish "medical-plate" awareness reel helpers for explainer-engine.
 *
 * Load after /engine/lib/explainer.js, before scene.js; call PK.init(X) first thing inside X.boot (after X.loadVO()).
 * index.html: <html data-size="1080x1920">, #stage 1080×1920, <svg id="svg" viewBox="0 0 1080 1920">, then
 * <svg id="ovl"> (flash / fade overlay, created if missing). Everything is a pure function of time (X.tl tweens with
 * fixed from/to values, or X.every hooks) — safe for out-of-order seeking by the render workers.
 *
 *  palette / type  PK.C · PK.F
 *  timing          PK.w(lineId, word, nth)   exact-word VO time (keeps Devanagari matras; falls back to X.word)
 *  card            PK.card(n, t0, t1, {ground:'cream'|'mint'|'brown'|'grid', label, fig, spot:[x,y], spotColor})
 *                  → {g, dark, t0, t1}; grounds are canvas-painted once (vignette, folds, ruling, binder dots,
 *                  specimen grid + sprockets, mint floor band) and cached
 *  heading         PK.head(card, line1, line2, tLine1, tLine2, {max2}) — small ink setup + big red punch (blur-in)
 *  motion          PK.pop(el, t, o) · PK.slide(el, t, {dx, dy}) · PK.flash(t) · PK.fadeOut(t, dur)
 *  marks           PK.x(parent, cx, cy, size, t) · PK.stamp(parent, text, cx, cy, {t, rot, color}) ·
 *                  PK.tape(parent, words, cx, cy, {t, rot}) · PK.hand(parent, text, x, y, {t, rot, dur}) ·
 *                  PK.circle(parent, label, cx, cy, {t, r, color}) · PK.arrow(parent, x, y1, y2, label, t)
 *  infographics    PK.flip(parent, text, cx, cy, {t, w, h}) → {set(t, text), run(t0, t1, values)} ·
 *                  PK.pie(...) · PK.clockPie(...) · PK.isotype(...) · PK.bubble(...) · PK.check(...) → {cross(i,t)} ·
 *                  PK.phone(parent, cx, cy, {mode:'dial'|'chat'}) → {type(times, text), msgs(...)} ·
 *                  PK.glowWord(parent, text, cx, cy, t0, t1, {color}) · PK.poll(...) → {tick(i, t, mark)} · PK.pill(...)
 *  cut-out props   PK.person(parent, x, y, o) → {g, wrap, armL, armR, mouth, lidL, lidR, head, droop(t)} ·
 *                  PK.table · PK.cup · PK.plate · PK.glass · PK.pillow · PK.alarm · PK.ambulance · PK.garland
 *  engravings      PK.brain(parent, cx, cy, {dark}) → {vessels(t), clot(t), spread(t0, t1), dim(t, k)} ·
 *                  PK.eye(parent, cx, cy, {dark}) · PK.snellen(parent, cx, cy) → {blur(t)} · PK.ecg(parent, y, o)
 */
(function () {
  const PK = (window.PK = {});
  const C = (PK.C = {
    cream: '#cdc4aa', creamHi: '#d6cdb3', creamEdge: '#a89c80', creamCorner: '#857a63',
    mint: '#cde0c6', mintEdge: '#9fb39a', floor: '#803a32', floorTop: '#8e443b', floorLow: '#672b25',
    brown: '#28231f', brownEdge: '#1c1916', spot: '#6f6352', spotWarm: '#6a4434',
    grid: '#1e1e1e', gridHi: '#272727',
    ink: '#22170d', ink2: '#3a2c20', inkLight: '#d6d0c4', red: '#b8323a', redHi: '#c83a40', xRed: '#cf3b3c',
    stampRed: '#ba343c', handRed: '#a83739', label: '#60543e', labelDark: '#8d877c', rule: '#7f7154', ruleDark: '#4b463f',
    card: '#e9e1cb', bubble: '#efe7dc', tile: '#f0e8d9', tileFrame: '#28211a', brass: '#a8916a', kraft: '#dccdaa',
    green: '#3d743a', callGreen: '#45b05c', chatGreen: '#3e7a56', bone: '#ece2cc', glowCream: '#f5e5d6',
    white: '#f6f1e7', line: '#e9e3d6',
  });
  const F = (PK.F = {
    head: "'Oswald', 'Bebas Neue', 'Arial Narrow', sans-serif",
    mono: "'Roboto Mono', 'Courier New', monospace",
    hand: "'Caveat', 'Patrick Hand', cursive",
  });
  let X = null, W = 1080, H = 1920, uidN = 0;
  const uid = (PK.uid = (p = 'pk') => `${p}${++uidN}`);
  const NS = 'http://www.w3.org/2000/svg';
  const ease = (name) => gsap.parseEase(name);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // ------------------------------------------------------------------ init
  PK.init = (x) => {
    X = x; W = X.W; H = X.H;
    PK.W = W; PK.H = H;
    PK.ovl = document.getElementById('ovl') || (() => {
      const s = document.createElementNS(NS, 'svg'); s.id = 'ovl'; X.stage.appendChild(s); return s;
    })();
    PK.ovl.setAttribute('viewBox', `0 0 ${W} ${H}`); PK.ovl.setAttribute('width', W); PK.ovl.setAttribute('height', H);
    Object.assign(PK.ovl.style, { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' });
    const d = X.defs;
    X.shadow('pkSh', 7, 12, 10, '#1e140b', 0.34);
    X.shadow('pkShS', 3, 6, 5, '#1e140b', 0.3);
    X.shadow('pkShL', 10, 18, 16, '#1e140b', 0.36);
    // distressed rubber-stamp ink
    const f = X.svg('filter', { id: 'pkInk', x: '-10%', y: '-25%', width: '120%', height: '150%' }, d);
    X.svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 2, seed: 4, result: 'n' }, f);
    X.svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 2.5, xChannelSelector: 'R', yChannelSelector: 'G', result: 'dsp' }, f);
    X.svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.42, numOctaves: 3, seed: 9, result: 'm' }, f);
    X.svg('feColorMatrix', { in: 'm', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.95', result: 'ma' }, f);
    X.svg('feComposite', { in: 'dsp', in2: 'ma', operator: 'in' }, f);
    // glows
    PK.glowF('pkGlowRed', '#e0393c', 14, 1.0);
    PK.glowF('pkGlowRedS', '#e0393c', 6, 0.9);
    PK.glowF('pkGlowCream', '#ff6a50', 18, 0.75);
    // hatch patterns for engravings
    const hatch = (id, color, ang, gap, sw) => {
      const p = X.svg('pattern', { id, width: gap, height: gap, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${ang})` }, d);
      X.svg('line', { x1: 0, y1: 0, x2: 0, y2: gap, stroke: color, 'stroke-width': sw }, p);
      return `url(#${id})`;
    };
    PK.hatchW = hatch('pkHatchW', 'rgba(240,234,222,0.55)', 35, 7, 1.3);
    PK.hatchW2 = hatch('pkHatchW2', 'rgba(240,234,222,0.35)', -40, 9, 1.1);
    PK.hatchI = hatch('pkHatchI', 'rgba(40,28,18,0.55)', 35, 7, 1.3);
    PK.hatchI2 = hatch('pkHatchI2', 'rgba(40,28,18,0.35)', -40, 9, 1.1);
    // shading overlays (light from the upper left)
    X.linear('pkShadeR', [[0, '#000', 0], [0.5, '#000', 0], [1, '#000', 0.26]], 0, 0, 1, 0);
    X.linear('pkShadeB', [[0, '#000', 0], [0.6, '#000', 0.04], [1, '#000', 0.24]], 0, 0, 0, 1);
    X.linear('pkHiL', [[0, '#fff', 0.22], [0.45, '#fff', 0], [1, '#fff', 0]], 0, 0, 1, 0);
    X.linear('pkKraft', [[0, '#e4d7b7'], [0.5, '#d9c9a3'], [1, '#cdbb93']], 0, 0, 0, 1);
    X.linear('pkBrass', [[0, '#c9b282'], [0.5, '#a2885e'], [1, '#7d6643']], 0, 0, 0, 1);
    X.linear('pkTile', [[0, '#f6efe2'], [0.49, '#ece3d2'], [0.51, '#ddd3c0'], [1, '#ebe2d1']], 0, 0, 0, 1);
    PK._grounds = {};
    PK.cards = [];
  };

  PK.glowF = (id, color, std, k = 1) => {
    const f = X.svg('filter', { id, x: '-60%', y: '-60%', width: '220%', height: '220%' }, X.defs);
    X.svg('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: std, result: 'b' }, f);
    X.svg('feFlood', { 'flood-color': color, 'flood-opacity': k, result: 'c' }, f);
    X.svg('feComposite', { in: 'c', in2: 'b', operator: 'in', result: 'g' }, f);
    const m = X.svg('feMerge', {}, f);
    X.svg('feMergeNode', { in: 'g' }, m); X.svg('feMergeNode', { in: 'g' }, m); X.svg('feMergeNode', { in: 'SourceGraphic' }, m);
    return `url(#${id})`;
  };
  /** paper cut-out edge (dilated alpha in off-white) + soft drop shadow; radius compensated for the figure's scale */
  PK.cutF = (scale = 1, edge = 4) => {
    const id = `pkCut${Math.round(scale * 100)}_${edge}`;
    if (!document.getElementById(id)) {
      const k = 1 / scale;
      const f = X.svg('filter', { id, x: '-25%', y: '-15%', width: '150%', height: '135%' }, X.defs);
      X.svg('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: (edge * k).toFixed(2), result: 'd' }, f);
      X.svg('feFlood', { 'flood-color': '#f3ecdd', result: 'w' }, f);
      X.svg('feComposite', { in: 'w', in2: 'd', operator: 'in', result: 'edge' }, f);
      X.svg('feGaussianBlur', { in: 'd', stdDeviation: (9 * k).toFixed(2), result: 'b' }, f);
      X.svg('feOffset', { in: 'b', dx: (7 * k).toFixed(2), dy: (12 * k).toFixed(2), result: 'o' }, f);
      X.svg('feFlood', { 'flood-color': '#1e140b', 'flood-opacity': 0.36, result: 'sc' }, f);
      X.svg('feComposite', { in: 'sc', in2: 'o', operator: 'in', result: 'sh' }, f);
      const m = X.svg('feMerge', {}, f);
      X.svg('feMergeNode', { in: 'sh' }, m); X.svg('feMergeNode', { in: 'edge' }, m); X.svg('feMergeNode', { in: 'SourceGraphic' }, m);
    }
    return `url(#${id})`;
  };

  // ------------------------------------------------------------------ timing
  const strip = (s) => s.replace(/[\s,.;:!?…—\-–'"“”।()]/g, '').toLowerCase();
  /** VO word time by exact match (Devanagari-safe: keeps vowel signs, which X.word's normaliser drops). */
  PK.w = (id, word, nth = 0, end = false) => {
    const l = X.line(id); const target = strip(word); let k = 0;
    for (const x of l.words || []) if (strip(x.w) === target && k++ === nth) return end ? x.end : x.start;
    k = 0;
    for (const x of l.words || []) if (strip(x.w).startsWith(target) && k++ === nth) return end ? x.end : x.start;
    console.warn(`PK.w: "${word}" not in ${id}`);
    return end ? X.wordEnd(id, word, nth) : X.word(id, word, nth);
  };

  // ------------------------------------------------------------------ grounds
  function noiseFill(g, w, h, amp, seed) {
    const img = g.getImageData(0, 0, w, h), r = X.rand(seed);
    const bw = Math.ceil(w / 32) + 2, big = Array.from({ length: bw * (Math.ceil(h / 32) + 2) }, () => r());
    for (let y = 0; y < h; y++) {
      const by = y / 32, iy = by | 0, fy = by - iy;
      for (let x = 0; x < w; x++) {
        const bx = x / 32, ix = bx | 0, fx = bx - ix;
        const b = big[iy * bw + ix] * (1 - fx) * (1 - fy) + big[iy * bw + ix + 1] * fx * (1 - fy) + big[(iy + 1) * bw + ix] * (1 - fx) * fy + big[(iy + 1) * bw + ix + 1] * fx * fy;
        const n = (r() - 0.5) * 0.5 + (b - 0.5) * 0.8;
        const i = (y * w + x) * 4, k = 1 + n * amp;
        img.data[i] *= k; img.data[i + 1] *= k; img.data[i + 2] *= k;
      }
    }
    g.putImageData(img, 0, 0);
  }
  function vignette(g, cx, cy, r0, r1, stops) {
    g.save(); g.translate(cx, cy); g.scale(1, 1.55);
    const gr = g.createRadialGradient(0, 0, r0, 0, 0, r1);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(-W, -H, 2 * W, 2 * H); g.restore();
  }
  PK.ground = (kind = 'cream', o = {}) => {
    const key = `${kind}|${(o.spot || []).join(',')}|${o.spotColor || ''}`;
    if (PK._grounds[key]) return PK._grounds[key];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const dark = kind === 'brown' || kind === 'grid';
    if (kind === 'cream') {
      g.fillStyle = C.cream; g.fillRect(0, 0, W, H);
      vignette(g, W * 0.5, H * 0.47, 0, W * 0.95, [[0, '#d2c9af'], [0.45, '#c8bea3'], [0.75, '#ad9f83'], [1, '#857a63']]);
    } else if (kind === 'mint') {
      g.fillStyle = C.mint; g.fillRect(0, 0, W, H);
      vignette(g, W * 0.5, H * 0.44, 0, W * 0.95, [[0, '#d2e4cb'], [0.45, '#c6d9bf'], [0.75, '#a9bca3'], [1, '#879a83']]);
    } else if (kind === 'brown') {
      g.fillStyle = C.brown; g.fillRect(0, 0, W, H);
      const [sx, sy] = o.spot || [W * 0.5, H * 0.5];
      g.save(); g.translate(sx, sy); g.scale(1, 1.25);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.62);
      const sc = o.spotColor || C.spot;
      gr.addColorStop(0, sc); gr.addColorStop(0.35, sc + 'b0'); gr.addColorStop(0.7, sc + '30'); gr.addColorStop(1, sc + '00');
      g.fillStyle = gr; g.fillRect(-W * 2, -H * 2, W * 4, H * 4); g.restore();
      vignette(g, W * 0.5, H * 0.5, W * 0.4, W * 1.0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]);
    } else if (kind === 'grid') {
      g.fillStyle = C.grid; g.fillRect(0, 0, W, H);
      vignette(g, W * 0.5, H * 0.5, 0, W * 0.9, [[0, '#262626'], [0.6, '#1f1f1f'], [1, '#141414']]);
      g.strokeStyle = 'rgba(255,255,255,0.045)'; g.lineWidth = 1.5;
      for (let x = 27; x < W; x += 54) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 27; y < H; y += 54) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      // specimen strip on the right edge: sprocket dashes + a vertical mono line
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let y = 40; y < H; y += 38) g.fillRect(W - 40, y, 14, 22);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(W - 50, 0, 2, H);
      g.save(); g.translate(W - 72, H * 0.13); g.rotate(Math.PI / 2);
      g.font = `500 15px ${F.mono}`; g.fillStyle = 'rgba(255,255,255,0.2)';
      g.fillText('A N A T O M I C A L   P L A T E   ·   S P E C I M E N   S C A N', 0, 0); g.restore();
    }
    noiseFill(g, W, H, dark ? 0.09 : 0.05, kind.length * 7 + 3);
    // paper folds + faint ruling (all grounds), binder dots (paper grounds)
    g.fillStyle = dark ? 'rgba(255,255,255,0.025)' : 'rgba(70,50,25,0.07)';
    g.fillRect(Math.round(W * 0.23), 0, 2, H); g.fillRect(Math.round(W * 0.63), 0, 2, H);
    if (!dark) {
      g.fillStyle = 'rgba(70,50,25,0.035)';
      for (let y = 48; y < H; y += 48) g.fillRect(0, y, W, 1);
    }
    for (let k = 0; k < 9; k++) {
      const y = H * 0.047 + k * H * 0.118;
      g.beginPath(); g.arc(W * 0.029, y, 6.5, 0, Math.PI * 2);
      g.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(80,72,58,0.62)'; g.fill();
    }
    if (kind === 'mint') {  // dark-red floor band (bottom 12 %)
      const y0 = Math.round(H * 0.88);
      const gr = g.createLinearGradient(0, y0, 0, H);
      gr.addColorStop(0, C.floor); gr.addColorStop(1, C.floorLow);
      g.fillStyle = gr; g.fillRect(0, y0, W, H - y0);
      g.fillStyle = C.floorTop; g.fillRect(0, y0, W, 3);
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, y0 - 6, W, 6);
      vignette(g, W * 0.5, H * 0.5, W * 0.5, W * 1.05, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.25)']]);
    }
    return (PK._grounds[key] = c.toDataURL('image/jpeg', 0.93));
  };

  // ------------------------------------------------------------------ card + heading
  PK.card = (n, t0, t1, o = {}) => {
    const kind = o.ground || 'cream';
    const dark = kind === 'brown' || kind === 'grid';
    const g = X.scene(`card${n}`, t0, t1);
    X.svg('image', { href: PK.ground(kind, o), x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'none' }, g);
    const lc = dark ? C.labelDark : C.label;
    X.svg('text', { x: W * 0.044, y: H * 0.067, 'font-family': F.mono, 'font-weight': 500, 'font-size': 19, 'letter-spacing': 4.5, fill: lc, text: (o.label || '').toUpperCase() }, g);
    X.svg('text', { x: W * 0.958, y: H * 0.067, 'text-anchor': 'end', 'font-family': F.mono, 'font-weight': 500, 'font-size': 19, 'letter-spacing': 4.5, fill: lc, text: `FIG. ${o.fig ?? n}` }, g);
    X.svg('rect', { x: W * 0.044, y: H * 0.0785, width: W * 0.914, height: 2, fill: dark ? C.ruleDark : C.rule }, g);
    const card = { g, dark, t0, t1, n, kind, layer: X.svg('g', {}, g) };
    PK.cards.push(card);
    return card;
  };
  const fitText = (el, maxW, size) => {
    const w = el.getComputedTextLength();
    if (w > maxW) { size = size * maxW / w; el.setAttribute('font-size', size.toFixed(1)); }
    return size;
  };
  PK.head = (card, l1, l2, ta, tb, o = {}) => {
    const g = X.svg('g', {}, card.g);
    const out = { g };
    if (l1) {
      const fill = card.dark ? C.inkLight : C.ink;
      const t1 = X.svg('text', { x: W * 0.044, y: H * 0.123, 'font-family': F.head, 'font-weight': 700, 'font-size': H * 0.037, fill, stroke: fill, 'stroke-width': 1.2, 'stroke-linejoin': 'round', 'paint-order': 'stroke', 'letter-spacing': 0.5, text: l1.toUpperCase() }, g);
      fitText(t1, o.max1 || W * 0.86, H * 0.037);
      gsap.set(t1, { opacity: 0 });
      X.tl.fromTo(t1, { opacity: 0 }, { opacity: 1, duration: 0.08, ease: 'none', immediateRender: false }, ta);
      out.l1 = t1;
    }
    if (l2) {
      let size = o.size2 || H * 0.089;
      const fid = uid('pkBl');
      const f = X.svg('filter', { id: fid, x: '-10%', y: '-30%', width: '120%', height: '160%' }, X.defs);
      const bl = X.svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0 }, f);
      const t2 = X.svg('text', { x: W * 0.044 - size * 0.02, y: 0, 'font-family': F.head, 'font-weight': 700, 'font-size': size, fill: o.color2 || C.red, stroke: o.color2 || C.red, 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'paint-order': 'stroke', 'letter-spacing': 1, filter: `url(#${fid})`, text: l2.toUpperCase() }, g);
      size = fitText(t2, o.max2 || W * 0.72, size);
      t2.setAttribute('y', (H * 0.133 + size * 0.81).toFixed(1));
      gsap.set(t2, { opacity: 0 });
      X.tl.fromTo(t2, { opacity: 0 }, { opacity: 1, duration: 0.17, ease: 'power2.out', immediateRender: false }, tb);
      X.tl.fromTo(bl, { attr: { stdDeviation: 9 } }, { attr: { stdDeviation: 0 }, duration: 0.2, ease: 'power2.out', immediateRender: false }, tb);
      X.sfx(tb, 'woosh_low', { dur: 0.25, gain: 0.18 });
      out.l2 = t2; out.size2 = size;
    }
    return out;
  };

  // ------------------------------------------------------------------ motion helpers
  /** wrapper <g> at (x, y) rotated r, with an inner <g> to animate (so pops never fight the placement) */
  PK.place = (parent, x, y, r = 0, s = 1) => {
    const w = X.svg('g', { transform: `translate(${x},${y}) rotate(${r}) scale(${s})` }, parent);
    return X.svg('g', {}, w);
  };
  PK.pop = (el, t, o = {}) => {
    gsap.set(el, { transformOrigin: o.origin || '50% 50%', scale: o.from ?? 0.15, opacity: 0 });
    X.tl.fromTo(el, { scale: o.from ?? 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: o.dur ?? 0.2, ease: o.ease || 'back.out(2.2)', immediateRender: false }, t);
    if (o.sfx !== false) X.sfx(t, o.sfx || 'pop', { gain: o.gain ?? 0.32, pitch: o.pitch ?? 1 });
    return el;
  };
  PK.show = (el, t, dur = 0.08) => {
    gsap.set(el, { opacity: 0 });
    X.tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'none', immediateRender: false }, t);
    return el;
  };
  PK.slide = (el, t, o = {}) => {
    gsap.set(el, { x: o.dx ?? W, y: o.dy ?? 0 });
    X.tl.fromTo(el, { x: o.dx ?? W, y: o.dy ?? 0 }, { x: 0, y: 0, duration: o.dur ?? 0.32, ease: o.ease || 'power3.out', immediateRender: false }, t);
    if (o.sfx !== false) X.sfx(t, o.sfx || 'slide', { dur: 0.35, gain: o.gain ?? 0.3 });
    return el;
  };
  PK.flash = (t, color = '#c8202a', op = 0.45) => {
    const r = X.svg('rect', { x: 0, y: 0, width: W, height: H, fill: color, opacity: 0 }, PK.ovl);
    X.tl.fromTo(r, { opacity: op }, { opacity: 0, duration: 0.22, ease: 'power2.out', immediateRender: false }, t);
    X.tl.set(r, { opacity: 0 }, 0.0001);
    return r;
  };
  PK.fadeOut = (t, dur = 0.6) => {
    const r = X.svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0 }, PK.ovl);
    X.tl.fromTo(r, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'none', immediateRender: false }, t);
    return r;
  };
  /** slow linear push on a card's picture layer (the heading stays put) — the reel's only "camera" move */
  PK.push = (card, from = 1, to = 1.04, o = {}) => {
    const [ox, oy] = o.origin || [W / 2, H * 0.58];
    gsap.set(card.layer, { scale: from, svgOrigin: `${ox} ${oy}` });
    X.tl.fromTo(card.layer, { scale: from }, { scale: to, svgOrigin: `${ox} ${oy}`, duration: Math.max(0.1, card.t1 - card.t0), ease: 'none', immediateRender: false }, card.t0);
  };
  /** neon flicker / breathing on an element's opacity between t0 and t1 (pure function of time) */
  PK.flicker = (el, t0, t1, o = {}) => {
    const lo = o.lo ?? 0.82, hz = o.hz ?? 2.3;
    X.every((t) => {
      if (t < t0 || t > t1) return;
      const k = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * hz) * Math.sin(t * Math.PI * 2 * hz * 0.37 + 1.3);
      el.style.opacity = (lo + (1 - lo) * (1 - k)).toFixed(3);
    });
  };
  /** pulsing scale (call-to-action pill, glow) between t0 and t1 — el is a PK.place group centred on (0, 0) */
  PK.pulse = (el, t0, t1, o = {}) => {
    const amp = o.amp ?? 0.04, hz = o.hz ?? 1;
    const g = X.svg('g', {}, null);
    while (el.firstChild) g.appendChild(el.firstChild);
    el.appendChild(g);
    X.every((t) => {
      const k = t < t0 || t > t1 ? 0 : Math.pow(Math.max(0, Math.sin((t - t0) * Math.PI * 2 * hz)), 3);
      g.setAttribute('transform', `scale(${(1 + amp * k).toFixed(4)})`);
    });
    return g;
  };
  /** tiny idle bob (pure function of time) between t0 and t1 */
  PK.bob = (el, t0, t1, o = {}) => {
    const amp = o.amp ?? 4, hz = o.hz ?? 0.5, rot = o.rot ?? 0;
    X.every((t) => {
      const k = t < t0 || t > t1 ? 0 : Math.sin((t - t0) * Math.PI * 2 * hz);
      el.setAttribute('transform', `translate(0,${(k * amp).toFixed(2)}) rotate(${(k * rot).toFixed(2)})`);
    });
  };

  // ------------------------------------------------------------------ marks
  PK.x = (parent, cx, cy, size, t, o = {}) => {
    const g = X.svg('g', { transform: `translate(${cx},${cy})` }, parent);
    const s = size / 2, sw = o.sw || W * 0.022;
    const a = X.svg('line', { x1: -s, y1: -s, x2: s, y2: s, stroke: o.color || C.xRed, 'stroke-width': sw, 'stroke-linecap': 'round' }, g);
    const b = X.svg('line', { x1: s, y1: -s, x2: -s, y2: s, stroke: o.color || C.xRed, 'stroke-width': sw, 'stroke-linecap': 'round' }, g);
    gsap.set(g, { opacity: 0 }); X.tl.set(g, { opacity: 1 }, t);
    X.drawOn(a, t, 0.09, 'power2.out'); X.drawOn(b, t + 0.08, 0.09, 'power2.out');
    X.sfx(t, 'error', { dur: 0.16, gain: 0.16 });
    X.sfx(t, 'scribble', { dur: 0.16, gain: 0.25 });
    return g;
  };
  PK.stamp = (parent, text, cx, cy, o = {}) => {
    const col = o.color || C.stampRed, size = o.size || 62;
    const inner = PK.place(parent, cx, cy, o.rot ?? -6);
    const g = X.svg('g', { filter: 'url(#pkInk)' }, inner);
    const tx = X.svg('text', { x: 0, y: size * 0.36, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': size, 'letter-spacing': 1.5, fill: col, text: text.toUpperCase() }, g);
    const w = tx.getComputedTextLength() + size * 0.9, h = size * 1.35;
    X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: 'none', stroke: col, 'stroke-width': 6, rx: 3 }, g);
    X.svg('rect', { x: -w / 2 + 10, y: -h / 2 + 10, width: w - 20, height: h - 20, fill: 'none', stroke: col, 'stroke-width': 2.5, rx: 2 }, g);
    if (o.bg) g.insertBefore(X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: o.bg, opacity: 0.85, rx: 3 }, null), g.firstChild);
    gsap.set(inner, { transformOrigin: '50% 50%', scale: 1.35, opacity: 0 });
    X.tl.fromTo(inner, { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.09, ease: 'expo.out', immediateRender: false }, o.t);
    X.sfx(o.t, 'stamp', { gain: 0.55 });
    return inner;
  };
  /** kraft tape label; words = 'TEXT' or [{text, t}, …] revealed one by one along the strip */
  PK.tape = (parent, words, cx, cy, o = {}) => {
    const list = typeof words === 'string' ? [{ text: words, t: o.t }] : words;
    const size = o.size || 46, gap = o.gap || 70;
    const inner = PK.place(parent, cx, cy, o.rot ?? -2);
    const tmp = list.map((w) => X.svg('text', { x: 0, y: size * 0.36, 'font-family': F.head, 'font-weight': 700, 'font-size': size, fill: o.ink || C.ink, text: w.text.toUpperCase() }, inner));
    const widths = tmp.map((e) => e.getComputedTextLength());
    const total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1) + size * 1.1;
    const h = size * 1.55;
    const strip = X.svg('path', { d: X.torn(total, h, 5, (cx * 7 + cy) | 0, 12), transform: `translate(${-total / 2},${-h / 2})`, fill: o.fill || 'url(#pkKraft)', filter: 'url(#pkShS)' }, null);
    inner.insertBefore(strip, inner.firstChild);
    let x = -total / 2 + size * 0.55;
    tmp.forEach((e, i) => {
      e.setAttribute('x', x.toFixed(1)); x += widths[i] + gap;
      if (i > 0) { PK.show(e, list[i].t, 0.06); X.sfx(list[i].t, 'paper', { dur: 0.18, gain: 0.25 }); }
    });
    gsap.set(inner, { transformOrigin: '0% 50%', scaleX: 0, opacity: 0 });
    X.tl.fromTo(inner, { scaleX: 0.2, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.14, ease: 'power2.out', immediateRender: false }, list[0].t);
    X.sfx(list[0].t, 'paper', { dur: 0.25, gain: 0.35 });
    return inner;
  };
  PK.hand = (parent, text, x, y, o = {}) => {
    const g = X.svg('g', { transform: `translate(${x},${y}) rotate(${o.rot ?? -8})` }, parent);
    const size = o.size || 74;
    const tx = X.svg('text', { x: 0, y: 0, 'font-family': F.hand, 'font-weight': 700, 'font-size': size, fill: o.color || C.handRed, text, 'text-anchor': o.anchor || 'start' }, g);
    const w = tx.getComputedTextLength(), x0 = o.anchor === 'middle' ? -w / 2 : 0;
    const cid = uid('pkHc'), cp = X.svg('clipPath', { id: cid }, X.defs);
    const r = X.svg('rect', { x: x0 - 10, y: -size, width: 0, height: size * 1.5 }, cp);
    tx.setAttribute('clip-path', `url(#${cid})`);
    const dur = o.dur ?? Math.min(0.9, 0.25 + text.length * 0.03);
    X.tl.fromTo(r, { attr: { width: 0 } }, { attr: { width: w + 30 }, duration: dur, ease: 'none', immediateRender: false }, o.t);
    X.sfx(o.t, 'scribble', { dur, gain: 0.3 });
    return g;
  };
  PK.circle = (parent, label, cx, cy, o = {}) => {
    const r = o.r || 88;
    const inner = PK.place(parent, cx, cy);
    X.svg('circle', { cx: 0, cy: 0, r, fill: o.color || C.red, filter: 'url(#pkShS)' }, inner);
    X.svg('circle', { cx: 0, cy: 0, r: r - 5, fill: 'none', stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 3 }, inner);
    X.svg('text', { x: 0, y: r * 0.42, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': r * 1.2, fill: C.white, text: String(label) }, inner);
    if (o.t != null) PK.pop(inner, o.t, { sfx: 'pop', pitch: o.pitch || 1.1 });
    return inner;
  };
  /** vertical double arrow with a measurement label (e.g. "5 CM") */
  PK.arrow = (parent, x, y1, y2, label, t, o = {}) => {
    const g = X.svg('g', {}, parent), col = o.color || C.red;
    X.svg('line', { x1: x, y1: y1 + 14, x2: x, y2: y2 - 14, stroke: col, 'stroke-width': 5 }, g);
    X.svg('path', { d: `M${x - 14},${y1 + 22} L${x},${y1} L${x + 14},${y1 + 22} Z`, fill: col }, g);
    X.svg('path', { d: `M${x - 14},${y2 - 22} L${x},${y2} L${x + 14},${y2 - 22} Z`, fill: col }, g);
    if (label) X.svg('text', { x: x - 18, y: y1 + 60, 'text-anchor': 'end', 'font-family': F.head, 'font-weight': 700, 'font-size': 60, fill: col, text: label }, g);
    PK.show(g, t, 0.1); X.sfx(t, 'blip_up', { gain: 0.2 });
    return g;
  };

  // ------------------------------------------------------------------ infographics
  /** flip-clock tiles; set(t, text) swaps characters at t with a flap shade; run(t0, t1, values) steps through values */
  PK.flip = (parent, text, cx, cy, o = {}) => {
    const n = text.length, tw = o.w || 104, th = o.h || 142, gap = o.gap || 10;
    const inner = PK.place(parent, cx, cy, o.rot || 0);
    const total = n * tw + (n - 1) * gap;
    const glyphs = [], flaps = [];
    for (let i = 0; i < n; i++) {
      const x = -total / 2 + i * (tw + gap), y = -th / 2;
      const tg = X.svg('g', { filter: 'url(#pkShS)' }, inner);
      if (text[i] === ' ') { glyphs.push(null); flaps.push(null); continue; }
      if (text[i] === ':') { X.svg('text', { x: x + tw / 2, y: y + th * 0.74, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': th * 0.7, fill: o.colon || '#e8dfcf', text: ':' }, tg); glyphs.push(null); flaps.push(null); continue; }
      X.svg('rect', { x: x - 7, y: y - 7, width: tw + 14, height: th + 14, rx: 10, fill: 'url(#pkBrass)' }, tg);
      X.svg('rect', { x: x - 2, y: y - 2, width: tw + 4, height: th + 4, rx: 7, fill: C.tileFrame }, tg);
      X.svg('rect', { x: x + 3, y: y + 3, width: tw - 6, height: th - 6, rx: 5, fill: 'url(#pkTile)' }, tg);
      const gl = X.svg('text', { x: x + tw / 2, y: y + th * 0.79, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': th * 0.82, fill: '#2a2b2d', text: text[i] }, tg);
      X.svg('rect', { x: x + 3, y: y + th / 2 - 1.5, width: tw - 6, height: 3, fill: 'rgba(30,24,18,0.55)' }, tg);
      const fl = X.svg('rect', { x: x + 3, y: y + 3, width: tw - 6, height: th / 2 - 4, fill: '#1e1812', opacity: 0 }, tg);
      glyphs.push(gl); flaps.push(fl);
    }
    const changes = [[-1, text]];
    X.every((t) => {
      let cur = changes[0][1];
      for (const [tc, s] of changes) if (tc <= t) cur = s; else break;
      glyphs.forEach((g, i) => { if (g && g.textContent !== cur[i]) g.textContent = cur[i] || ''; });
    });
    const api = {
      g: inner,
      set(t, s, sfx = true) {
        const prev = changes[changes.length - 1][1];
        changes.push([t, s]);
        changes.sort((a, b) => a[0] - b[0]);
        for (let i = 0; i < n; i++) if (flaps[i] && prev[i] !== s[i]) X.tl.fromTo(flaps[i], { opacity: 0.55 }, { opacity: 0, duration: 0.1, ease: 'power1.out', immediateRender: false }, t);
        if (sfx) X.sfx(t, 'tick', { gain: 0.22, pitch: 1 + (changes.length % 3) * 0.05 });
      },
      run(t0, t1, values, sfxEvery = 1) {
        values.forEach((v, k) => api.set(t0 + (t1 - t0) * (k / Math.max(1, values.length - 1)), v, k % sfxEvery === 0));
      },
    };
    if (o.t != null) PK.pop(inner, o.t, { dur: 0.15, sfx: 'click' });
    return api;
  };
  const arcPath = (r, a0, a1) => {  // sector from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise)
    if (a1 - a0 < 1e-4) return 'M0,0';
    const p = (a) => [Math.sin(a) * r, -Math.cos(a) * r];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M0,0 L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
  };
  PK.pie = (parent, cx, cy, r, frac, t, o = {}) => {
    const inner = PK.place(parent, cx, cy);
    X.svg('circle', { cx: 0, cy: 0, r: r + 9, fill: '#e6dabf', filter: 'url(#pkSh)' }, inner);
    X.svg('circle', { cx: 0, cy: 0, r, fill: '#e8ddc2' }, inner);
    const sec = X.svg('path', { d: 'M0,0', fill: o.color || C.red }, inner);
    const t1 = t + 0.25, dur = o.dur || 1.2, e = ease('power1.inOut');
    X.every((tt) => sec.setAttribute('d', arcPath(r, 0, Math.PI * 2 * frac * e(clamp01((tt - t1) / dur)))));
    if (o.label) {
      const a = Math.PI * 2 * frac * 0.55;
      const lb = X.svg('text', { x: Math.sin(a) * r * 0.5, y: -Math.cos(a) * r * 0.5 + r * 0.13, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': r * 0.36, fill: C.white, text: o.label }, inner);
      PK.show(lb, t1 + dur, 0.12);
    }
    PK.pop(inner, t, { dur: 0.22 });
    X.sfx(t1, 'swoosh', { dur: dur * 0.8, gain: 0.18 });
    return inner;
  };
  /** clock face whose red sector grows from 12 o'clock to `hours` (e.g. 4.5) — a "time window" pie */
  PK.clockPie = (parent, cx, cy, r, hours, t, o = {}) => {
    const inner = PK.place(parent, cx, cy);
    X.svg('circle', { cx: 0, cy: 0, r: r + 14, fill: '#e3d6b9', filter: 'url(#pkSh)' }, inner);
    X.svg('circle', { cx: 0, cy: 0, r: r + 14, fill: 'none', stroke: '#b9a982', 'stroke-width': 3 }, inner);
    X.svg('circle', { cx: 0, cy: 0, r, fill: '#ece2c8' }, inner);
    const sec = X.svg('path', { d: 'M0,0', fill: o.color || C.red, opacity: 0.94 }, inner);
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2, big = k % 5 === 0, r0 = big ? r - 30 : r - 14;
      X.svg('line', { x1: Math.sin(a) * r0, y1: -Math.cos(a) * r0, x2: Math.sin(a) * (r - 4), y2: -Math.cos(a) * (r - 4), stroke: C.ink, 'stroke-width': big ? 5 : 2, opacity: big ? 0.85 : 0.5 }, inner);
    }
    [[12, 0], [3, 1], [6, 2], [9, 3]].forEach(([nm, q]) => {
      const a = q * Math.PI / 2;
      X.svg('text', { x: Math.sin(a) * (r - 66), y: -Math.cos(a) * (r - 66) + 20, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': 56, fill: C.ink, text: nm }, inner);
    });
    const hand = X.svg('g', {}, inner);
    X.svg('path', { d: `M-7,14 L-4,${-r * 0.78} L0,${-r * 0.84} L4,${-r * 0.78} L7,14 Z`, fill: C.ink }, hand);
    X.svg('circle', { cx: 0, cy: 0, r: 15, fill: C.ink }, inner);
    X.svg('circle', { cx: 0, cy: 0, r: 5, fill: C.brass }, inner);
    const t1 = t + 0.25, dur = o.dur || 1.4, e = ease('power1.inOut');
    X.every((tt) => {
      const a = (Math.PI * 2 * hours / 12) * e(clamp01((tt - t1) / dur));
      sec.setAttribute('d', arcPath(r - 2, 0, a));
      hand.setAttribute('transform', `rotate(${(a * 180 / Math.PI).toFixed(2)})`);
    });
    if (o.label) {
      const a = (Math.PI * 2 * hours / 12) * 0.5;
      const lb = X.svg('text', { x: Math.sin(a) * r * 0.52, y: -Math.cos(a) * r * 0.52 + 22, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': r * 0.3, fill: C.white, stroke: C.white, 'stroke-width': 1, text: o.label }, inner);
      PK.show(lb, t1 + dur, 0.12);
    }
    PK.pop(inner, t, { dur: 0.22 });
    X.sfx(t1, 'tick', { gain: 0.2 }); X.sfx(t1 + dur * 0.5, 'tock', { gain: 0.2 }); X.sfx(t1 + dur, 'tick', { gain: 0.2 });
    return inner;
  };
  /** isotype people: rows × cols, one per frame; red = index to recolour at redAt */
  PK.isotype = (parent, cx, cy, cols, rows, t, o = {}) => {
    const dx = o.dx || 150, dy = o.dy || 170, s = o.size || 1;
    const g = X.svg('g', {}, parent), figs = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = cx + (c - (cols - 1) / 2) * dx, y = cy + (r - (rows - 1) / 2) * dy;
      const f = PK.place(g, x, y, 0, s);
      const body = X.svg('path', { d: 'M-34,70 L-34,8 Q-34,-16 0,-16 Q34,-16 34,8 L34,70 Z', fill: C.ink2 }, f);
      const head = X.svg('circle', { cx: 0, cy: -46, r: 21, fill: C.ink2 }, f);
      figs.push({ f, body, head });
    }
    figs.forEach((q, i) => PK.pop(q.f, t + i * (o.stagger ?? 0.045), { dur: 0.1, ease: 'power2.out', origin: '50% 100%', sfx: i % 2 ? false : 'blip', gain: 0.12, pitch: 1 + i * 0.04 }));
    if (o.red != null) {
      const q = figs[o.red];
      X.tl.set([q.body, q.head], { attr: { fill: C.red } }, o.redAt);
      X.sfx(o.redAt, 'blip_up', { gain: 0.3 });
    }
    return { g, figs };
  };
  PK.bubble = (parent, text, cx, cy, o = {}) => {
    const size = o.size || 50;
    const inner = PK.place(parent, cx, cy, o.rot || 0);
    const tx = X.svg('text', { x: 0, y: size * 0.36, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': o.weight || 500, 'font-size': size, fill: C.ink, text }, null);
    inner.appendChild(tx);
    const w = tx.getComputedTextLength() + size * 1.4, h = size * 1.75;
    const tail = o.tail ?? -0.3;  // tail position along the bottom edge (−0.5 … 0.5 of width)
    const bx = tail * w;
    const b = X.svg('path', { d: `M${-w / 2 + 26},${-h / 2} H${w / 2 - 26} Q${w / 2},${-h / 2} ${w / 2},${-h / 2 + 26} V${h / 2 - 26} Q${w / 2},${h / 2} ${w / 2 - 26},${h / 2} H${bx + 22} L${bx - 6},${h / 2 + 28} L${bx - 2},${h / 2} H${-w / 2 + 26} Q${-w / 2},${h / 2} ${-w / 2},${h / 2 - 26} V${-h / 2 + 26} Q${-w / 2},${-h / 2} ${-w / 2 + 26},${-h / 2} Z`, fill: o.fill || C.bubble, filter: 'url(#pkSh)' }, null);
    inner.insertBefore(b, tx);
    if (o.t != null) PK.pop(inner, o.t, { sfx: 'bubble', gain: 0.35 });
    return { g: inner, text: tx, w, h };
  };
  PK.check = (parent, title, items, cx, cy, o = {}) => {
    const w = o.w || 540, rowH = o.rowH || 84, h = 86 + items.length * rowH;
    const inner = PK.place(parent, cx, cy, o.rot || 0);
    X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: C.card, filter: 'url(#pkSh)' }, inner);
    X.svg('text', { x: -w / 2 + 34, y: -h / 2 + 50, 'font-family': F.mono, 'font-weight': 600, 'font-size': 20, 'letter-spacing': 4, fill: C.label, text: title.toUpperCase() }, inner);
    const rows = items.map((it, i) => {
      const y = -h / 2 + 86 + i * rowH + rowH / 2;
      X.svg('rect', { x: -w / 2 + 34, y: y - 24, width: 48, height: 48, fill: 'none', stroke: C.ink, 'stroke-width': 4 }, inner);
      const tx = X.svg('text', { x: -w / 2 + 106, y: y + 21, 'font-family': F.head, 'font-weight': 700, 'font-size': 58, fill: C.ink, text: it.toUpperCase() }, inner);
      return { y, tx };
    });
    if (o.t != null) PK.pop(inner, o.t, { dur: 0.18, sfx: 'paper' });
    return {
      g: inner,
      cross(i, t) {
        const r = rows[i], x0 = -w / 2 + 34;
        const a = X.svg('path', { d: `M${x0 + 10},${r.y - 14} L${x0 + 38},${r.y + 14} M${x0 + 38},${r.y - 14} L${x0 + 10},${r.y + 14}`, stroke: C.xRed, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, inner);
        const len = r.tx.getComputedTextLength();
        const s = X.svg('line', { x1: -w / 2 + 100, y1: r.y, x2: -w / 2 + 112 + len, y2: r.y - 2, stroke: C.xRed, 'stroke-width': 6, 'stroke-linecap': 'round' }, inner);
        X.drawOn(a, t, 0.1); X.drawOn(s, t + 0.06, 0.16, 'power2.out');
        X.tl.set(r.tx, { attr: { fill: '#6b2a26' } }, t + 0.1);
        X.sfx(t, 'scribble', { dur: 0.2, gain: 0.3 });
      },
      tick(i, t) {
        const r = rows[i], x0 = -w / 2 + 34;
        const a = X.svg('path', { d: `M${x0 + 8},${r.y} L${x0 + 20},${r.y + 14} L${x0 + 42},${r.y - 18}`, stroke: C.green, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, inner);
        X.drawOn(a, t, 0.14); X.sfx(t, 'blip_up', { gain: 0.25 });
      },
    };
  };
  /** phone: mode 'dial' (EMERGENCY + typed number + pulsing green call button) or 'chat' (green header + messages) */
  PK.phone = (parent, cx, cy, o = {}) => {
    const w = o.w || 480, h = o.h || 860;
    const inner = PK.place(parent, cx, cy, o.rot ?? -4);
    X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 64, fill: '#2a2420', filter: 'url(#pkShL)' }, inner);
    X.svg('rect', { x: -w / 2 + 22, y: -h / 2 + 22, width: w - 44, height: h - 44, rx: 46, fill: '#ece4d8' }, inner);
    X.svg('rect', { x: -w / 2 + 22, y: -h / 2 + 22, width: (w - 44) * 0.5, height: h - 44, rx: 46, fill: 'url(#pkHiL)', opacity: 0.6 }, inner);
    const api = { g: inner, w, h };
    if ((o.mode || 'dial') === 'dial') {
      X.svg('text', { x: 0, y: -h * 0.24, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 500, 'font-size': 34, 'letter-spacing': 1, fill: '#5d5446', text: o.title || 'EMERGENCY' }, inner);
      const num = X.svg('text', { x: 0, y: -h * 0.03, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': 190, fill: C.ink, stroke: C.ink, 'stroke-width': 3, text: '' }, inner);
      const by = h * 0.3;
      const ring = X.svg('circle', { cx: 0, cy: by, r: 92, fill: '#a9d9b1', opacity: 0 }, inner);
      X.svg('circle', { cx: 0, cy: by, r: 70, fill: C.callGreen }, inner);
      X.svg('path', { d: 'M-24,-30 Q-38,-8 -8,22 Q22,48 38,30 L28,14 L14,22 Q0,14 -10,2 Q-18,-10 -14,-22 L-4,-30 Z', transform: `translate(0,${by})`, fill: '#f4f1e8' }, inner);
      const steps = [];
      X.every((t) => {
        let s = ''; for (const [tc, v] of steps) if (tc <= t) s = v;
        if (num.textContent !== s) num.textContent = s;
        const p = t - (api.ringT ?? 1e9);
        if (p >= 0) { const k = (p % 1.0) / 1.0; ring.setAttribute('r', (72 + 40 * k).toFixed(1)); ring.setAttribute('opacity', (0.85 * (1 - k)).toFixed(3)); }
        else ring.setAttribute('opacity', 0);
      });
      api.type = (times, text) => { times.forEach((tc, i) => { steps.push([tc, text.slice(0, i + 1)]); X.sfx(tc, 'beep', { dur: 0.09, gain: 0.25, pitch: 0.7 + i * 0.12 }); }); steps.sort((a, b) => a[0] - b[0]); };
      api.ring = (t) => { api.ringT = t; for (let k = 0; k < 3; k++) X.sfx(t + k, 'blip', { gain: 0.18, dur: 0.12 }); };
    } else {
      const top = -h / 2 + 22;
      X.svg('path', { d: `M${-w / 2 + 22},${top + 46} Q${-w / 2 + 22},${top} ${-w / 2 + 68},${top} H${w / 2 - 68} Q${w / 2 - 22},${top} ${w / 2 - 22},${top + 46} V${top + 112} H${-w / 2 + 22} Z`, fill: C.chatGreen }, inner);
      X.svg('text', { x: -w / 2 + 62, y: top + 78, 'font-family': F.head, 'font-weight': 600, 'font-size': 42, fill: '#f3efe6', text: o.title || 'Family' }, inner);
      api.msgs = [];
      api.msg = (text, t, opts = {}) => {
        const y = top + 160 + api.msgs.reduce((a, m) => a + m.h + 22, 0);
        const g = X.svg('g', {}, inner), size = opts.size || 32;
        const tx = X.svg('text', { x: 0, y: 0, 'font-family': F.head, 'font-weight': 500, 'font-size': size, fill: C.ink, text }, g);
        const tw = tx.getComputedTextLength();
        const bw = tw + 44, bh = size + 34, right = !!opts.me;
        const bx = right ? w / 2 - 44 - bw : -w / 2 + 44;
        g.insertBefore(X.svg('rect', { x: bx, y, width: bw, height: bh, rx: 18, fill: right ? '#d4ecc4' : '#fbf8f2', filter: 'url(#pkShS)' }, null), tx);
        tx.setAttribute('x', bx + 22); tx.setAttribute('y', y + size + 10);
        api.msgs.push({ h: bh });
        PK.pop(g, t, { sfx: 'notif', gain: 0.22, dur: 0.18, origin: right ? '100% 50%' : '0% 50%' });
        return g;
      };
      api.card = (title, sub, t) => {  // an image-card message ("BE FAST" poster)
        const y = top + 150, bw = w - 110, bh = 300, bx = w / 2 - 44 - bw;
        const g = X.svg('g', {}, inner);
        X.svg('rect', { x: bx, y, width: bw, height: bh + 70, rx: 20, fill: '#d4ecc4', filter: 'url(#pkShS)' }, g);
        X.svg('rect', { x: bx + 14, y: y + 14, width: bw - 28, height: bh - 20, rx: 12, fill: '#d4c49b' }, g);
        X.svg('text', { x: bx + bw / 2, y: y + bh * 0.62, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': 104, fill: C.red, stroke: C.red, 'stroke-width': 2, text: title }, g);
        X.svg('text', { x: bx + 26, y: y + bh + 44, 'font-family': F.head, 'font-weight': 600, 'font-size': 30, fill: C.ink, text: sub }, g);
        api.msgs.push({ h: bh + 70 });
        PK.pop(g, t, { sfx: 'notif', gain: 0.25, dur: 0.2 });
        return g;
      };
    }
    if (o.t != null) PK.pop(inner, o.t, { dur: 0.22, ease: 'back.out(1.8)', sfx: 'pop' });
    return api;
  };
  PK.glowWord = (parent, text, cx, cy, t0, t1, o = {}) => {
    const size = o.size || 360;
    const inner = PK.place(parent, cx, cy);
    const col = o.color || C.glowCream;
    X.svg('text', { x: 0, y: size * 0.4, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': size, fill: col, stroke: col, 'stroke-width': 6, 'stroke-linejoin': 'round', 'paint-order': 'stroke', 'letter-spacing': 4, filter: o.color === C.red || o.red ? 'url(#pkGlowRed)' : 'url(#pkGlowCream)', text }, inner);
    gsap.set(inner, { opacity: 0, transformOrigin: '50% 50%' });
    X.tl.fromTo(inner, { opacity: 1, scale: 1.06 }, { scale: 1, duration: 0.1, ease: 'power2.out', immediateRender: false }, t0);
    X.tl.set(inner, { opacity: 0 }, t1);
    X.sfx(t0, o.sfx || 'thud', { gain: o.gain ?? 0.4 });
    return inner;
  };
  PK.pill = (parent, text, cx, cy, o = {}) => {
    const size = o.size || 54;
    const inner = PK.place(parent, cx, cy);
    const tx = X.svg('text', { x: 0, y: size * 0.36, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 600, 'font-size': size, 'letter-spacing': 3, fill: C.white, text }, null);
    inner.appendChild(tx);
    const w = tx.getComputedTextLength() + size * 2.2, h = size * 2;
    inner.insertBefore(X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: o.color || C.red, filter: 'url(#pkSh)' }, null), tx);
    if (o.t != null) PK.pop(inner, o.t, { sfx: 'pop' });
    return inner;
  };
  PK.poll = (parent, q, a, b, cx, cy, o = {}) => {
    const w = o.w || 940, h = o.h || 330;
    const inner = PK.place(parent, cx, cy, o.rot ?? -2);
    X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: C.card, filter: 'url(#pkShL)' }, inner);
    const qt = X.svg('text', { x: -w / 2 + 50, y: -h / 2 + 118, 'font-family': F.head, 'font-weight': 700, 'font-size': 76, fill: C.ink, stroke: C.ink, 'stroke-width': 1, text: q.toUpperCase() }, inner);
    fitText(qt, w - 100, 76);
    const box = (x, label) => {
      X.svg('rect', { x, y: 30, width: 70, height: 70, fill: 'none', stroke: C.ink, 'stroke-width': 6 }, inner);
      X.svg('text', { x: x + 92, y: 92, 'font-family': F.head, 'font-weight': 700, 'font-size': 76, fill: C.ink, text: label.toUpperCase() }, inner);
      return x;
    };
    const xs = [box(-w / 2 + 50, a), box(-w / 2 + 50 + 330, b)];
    if (o.t != null) PK.pop(inner, o.t, { dur: 0.15, sfx: 'paper' });
    return {
      g: inner,
      tick(i, t, mark = '✓') {
        const x = xs[i];
        let el;
        if (mark === '✓') el = X.svg('path', { d: `M${x + 14},${66} L${x + 30},${86} L${x + 58},${44}`, stroke: C.green, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, inner);
        else el = X.svg('text', { x: x + 35, y: 92, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': 62, fill: C.red, text: mark }, inner);
        if (mark === '✓') X.drawOn(el, t, 0.16); else PK.pop(el, t, { sfx: false });
        X.sfx(t, 'click', { gain: 0.35 });
        return el;
      },
    };
  };
  /** ECG trace (for heart topics): beating line across the card, flatline(t) */
  PK.ecg = (parent, y, o = {}) => {
    const g = X.svg('g', { filter: 'url(#pkGlowRedS)' }, parent);
    let d = `M0,${y}`, x = 0;
    const per = o.period || 250;
    while (x < W) { d += ` L${x + per * 0.45},${y} L${x + per * 0.5},${y - 14} L${x + per * 0.53},${y + 10} L${x + per * 0.57},${y - 110} L${x + per * 0.61},${y + 60} L${x + per * 0.65},${y} L${x + per},${y}`; x += per; }
    const p = X.svg('path', { d, fill: 'none', stroke: o.color || '#d4454a', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    return { g, path: p };
  };

  // ------------------------------------------------------------------ cut-out props
  const sh = (d, parent, kind = 'R', op = 1) => X.svg('path', { d, fill: `url(#pkShade${kind})`, opacity: op }, parent);
  /** Stylised cut-out person, front view, feet at (x, y). Height ≈ 700·scale. Returns parts for acting. */
  PK.person = (parent, x, y, o = {}) => {
    const P = Object.assign({
      scale: 1, skin: '#c08257', hair: 'short', hairC: '#1d1612', top: 'kurta', topC: '#ece2cf', print: null,
      bottom: 'pyjama', botC: '#efe9dc', shoe: '#5a3b28', jacket: null, glasses: false, moustache: false,
      f: false, dupatta: null, border: '#d6b25e', armL: 6, armR: -6, edge: 4, brows: null,
    }, o);
    const s = P.scale, f = P.f;
    const wrap = X.svg('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    const fig = X.svg('g', { filter: P.cut === false ? null : PK.cutF(s, P.edge) }, wrap);
    const out = { wrap, fig };
    const shY = -560, shX = f ? 80 : 90, hipY = -330, hipX = f ? 74 : 70;
    const skinD = shade(P.skin, -0.18), stroke = 'rgba(40,24,12,0.35)';
    const hairBack = X.svg('g', {}, fig);
    // legs
    const legs = X.svg('g', {}, fig);
    const saree = P.top === 'saree';
    if (!saree) {
      const loose = P.bottom === 'pyjama' || P.bottom === 'salwar';
      const ank = loose ? 30 : 24, kneeW = loose ? 0 : 4;
      for (const sx of [-1, 1]) {
        const d = `M${sx * (hipX - 2)},${hipY - 20} L${sx * 4},${hipY - 20} L${sx * (10 - kneeW)},-36 L${sx * (10 + ank * 2)},-36 Z`;
        X.svg('path', { d, fill: P.botC, stroke, 'stroke-width': 1.5 }, legs);
        sh(d, legs, 'R', sx > 0 ? 1 : 0.4);
        if (P.bottom === 'jeans') X.svg('line', { x1: sx * 36, y1: hipY + 10, x2: sx * 40, y2: -40, stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 2 }, legs);
        if (P.bottom === 'salwar') X.svg('path', { d: `M${sx * 12},-60 L${sx * 70},-60 L${sx * 66},-36 L${sx * 14},-36 Z`, fill: shade(P.botC, -0.12) }, legs);
      }
    } else {
      const d = `M-86,-420 L-104,-14 Q0,-2 104,-14 L86,-420 Z`;
      X.svg('path', { d, fill: P.topC, stroke, 'stroke-width': 1.5 }, legs);
      for (const px of [-30, -10, 10, 30]) X.svg('line', { x1: px * 0.7, y1: -330, x2: px * 1.2, y2: -16, stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 3 }, legs);
      X.svg('path', { d: 'M-104,-14 Q0,-2 104,-14 L101,-44 Q0,-32 -101,-44 Z', fill: P.border }, legs);
      sh(d, legs);
    }
    for (const sx of [-1, 1]) {  // shoes
      X.svg('ellipse', { cx: sx * 40, cy: -16, rx: 36, ry: 16, fill: P.shoe, stroke, 'stroke-width': 1.5 }, legs);
      X.svg('ellipse', { cx: sx * 34, cy: -21, rx: 16, ry: 5, fill: 'rgba(255,255,255,0.18)' }, legs);
    }
    // torso
    const torso = X.svg('g', {}, fig);
    const hem = { kurta: -205, shirt: -318, hoodie: -312, kameez: -175, saree: -420 }[P.top] ?? -220;
    const hemX = { kurta: 96, kameez: 104, saree: 84 }[P.top] ?? hipX + 6;
    const tD = `M${-shX + 8},${shY - 10} Q${-shX - 8},${shY + 2} ${-shX - 6},${shY + 34} L${-hipX - 4},${hipY} L${-hemX},${hem} Q0,${hem + 8} ${hemX},${hem} L${hipX + 4},${hipY} L${shX + 6},${shY + 34} Q${shX + 8},${shY + 2} ${shX - 8},${shY - 10} Q30,${shY - 28} 0,${shY - 20} Q-30,${shY - 28} ${-shX + 8},${shY - 10} Z`;
    if (P.top === 'hoodie') X.svg('path', { d: `M-58,${shY - 18} Q0,${shY - 70} 58,${shY - 18} Q30,${shY + 10} 0,${shY + 6} Q-30,${shY + 10} -58,${shY - 18} Z`, fill: shade(P.topC, -0.2) }, torso);
    X.svg('path', { d: tD, fill: P.topC, stroke, 'stroke-width': 1.5 }, torso);
    if (P.print) {
      const pid = uid('pkPr'), pt = X.svg('pattern', { id: pid, width: 26, height: 26, patternUnits: 'userSpaceOnUse' }, X.defs);
      X.svg('circle', { cx: 6, cy: 6, r: 2.6, fill: P.print }, pt); X.svg('circle', { cx: 19, cy: 19, r: 2.2, fill: P.print }, pt);
      X.svg('path', { d: tD, fill: `url(#${pid})`, opacity: 0.7 }, torso);
    }
    if (P.top === 'kurta' || P.top === 'kameez') {
      X.svg('line', { x1: 0, y1: shY - 18, x2: 0, y2: shY + 130, stroke: shade(P.topC, -0.25), 'stroke-width': 3 }, torso);
      if (!f) for (let k = 0; k < 4; k++) X.svg('circle', { cx: 0, cy: shY + 10 + k * 34, r: 4, fill: shade(P.topC, -0.35) }, torso);
      X.svg('line', { x1: -hipX - 2, y1: hipY + 40, x2: -hemX + 4, y2: hem - 2, stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 2 }, torso);
      X.svg('line', { x1: hipX + 2, y1: hipY + 40, x2: hemX - 4, y2: hem - 2, stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 2 }, torso);
    }
    if (P.top === 'shirt') {
      X.svg('path', { d: `M-30,${shY - 22} L0,${shY + 14} L-6,${shY - 22} Z M30,${shY - 22} L0,${shY + 14} L6,${shY - 22} Z`, fill: shade(P.topC, 0.12), stroke, 'stroke-width': 1.5 }, torso);
      X.svg('line', { x1: 0, y1: shY + 14, x2: 0, y2: hem, stroke: shade(P.topC, -0.2), 'stroke-width': 2.5 }, torso);
      for (let k = 0; k < 5; k++) X.svg('circle', { cx: 0, cy: shY + 40 + k * 46, r: 3.5, fill: '#f6f3ec' }, torso);
      X.svg('rect', { x: -66, y: shY + 60, width: 40, height: 44, fill: 'none', stroke: shade(P.topC, -0.18), 'stroke-width': 2 }, torso);
      X.svg('rect', { x: -hipX - 4, y: hem - 4, width: 2 * hipX + 8, height: 22, fill: '#2b2119' }, torso);
      X.svg('rect', { x: -14, y: hem - 2, width: 28, height: 18, fill: '#b59a5e' }, torso);
    }
    if (P.top === 'hoodie') {
      X.svg('path', { d: `M-58,${hipY - 70} L58,${hipY - 70} L72,${hipY + 4} L-72,${hipY + 4} Z`, fill: 'none', stroke: shade(P.topC, -0.3), 'stroke-width': 3 }, torso);
      X.svg('line', { x1: -16, y1: shY + 4, x2: -18, y2: shY + 110, stroke: '#e8e2d8', 'stroke-width': 4 }, torso);
      X.svg('line', { x1: 16, y1: shY + 4, x2: 18, y2: shY + 100, stroke: '#e8e2d8', 'stroke-width': 4 }, torso);
      X.svg('rect', { x: -hipX - 4, y: hem - 26, width: 2 * hipX + 8, height: 26, fill: shade(P.topC, -0.12) }, torso);
    }
    if (P.jacket) {
      for (const sx of [-1, 1]) {
        const d = `M${sx * 14},${shY - 16} Q${sx * 60},${shY - 22} ${sx * (shX - 4)},${shY - 4} L${sx * (hipX + 2)},${hipY + 30} L${sx * 10},${hipY + 30} Z`;
        X.svg('path', { d, fill: P.jacket, stroke, 'stroke-width': 1.5 }, torso);
        X.svg('line', { x1: sx * 40, y1: hipY - 40, x2: sx * 70, y2: hipY - 40, stroke: shade(P.jacket, -0.3), 'stroke-width': 3 }, torso);
      }
      for (let k = 0; k < 4; k++) X.svg('circle', { cx: -10, cy: shY + 30 + k * 50, r: 4.5, fill: '#c9a96a' }, torso);
      X.svg('rect', { x: -22, y: shY - 24, width: 44, height: 16, rx: 4, fill: P.jacket }, torso);
    }
    sh(tD, torso, 'R'); sh(tD, torso, 'B', 0.8);
    if (saree) {  // pallu: diagonal drape from the left shoulder to the right hip
      const pd = `M${-shX + 4},${shY - 6} L${-shX + 70},${shY - 14} L${hipX + 30},${hipY + 20} L${hipX - 10},${hipY + 80} Z`;
      X.svg('path', { d: pd, fill: shade(P.topC, 0.06), stroke, 'stroke-width': 1.5 }, torso);
      X.svg('path', { d: `M${-shX + 4},${shY - 6} L${-shX + 18},${shY - 8} L${hipX - 2},${hipY + 72} L${hipX - 10},${hipY + 80} Z`, fill: P.border }, torso);
      X.svg('path', { d: `M${-shX + 60},${shY - 13} L${-shX + 70},${shY - 14} L${hipX + 30},${hipY + 20} L${hipX + 22},${hipY + 30} Z`, fill: P.border }, torso);
    }
    if (P.dupatta) {  // draped over both shoulders, ends falling down the front
      X.svg('path', { d: `M${-shX + 4},${shY - 10} Q-30,${shY + 18} 0,${shY + 22} Q30,${shY + 18} ${shX - 4},${shY - 10} L${shX - 10},${shY + 8} Q30,${shY + 40} 0,${shY + 42} Q-30,${shY + 40} ${-shX + 10},${shY + 8} Z`, fill: P.dupatta, stroke, 'stroke-width': 1.5 }, torso);
      for (const sx of [-1, 1]) X.svg('path', { d: `M${sx * (shX - 4)},${shY - 8} L${sx * (shX + 14)},${shY + 6} L${sx * (shX + 6)},${hipY + 60} L${sx * (shX - 34)},${hipY + 54} Z`, fill: shade(P.dupatta, -0.06), stroke, 'stroke-width': 1.5 }, torso);
    }
    // neck + head
    const headG = X.svg('g', {}, fig);
    X.svg('path', { d: `M-17,-598 L17,-598 L19,${shY - 14} Q0,${shY - 4} -19,${shY - 14} Z`, fill: P.skin }, headG);
    X.svg('path', { d: `M-17,-590 Q0,-578 17,-590 L17,-580 Q0,-568 -17,-580 Z`, fill: skinD, opacity: 0.5 }, headG);
    if (P.hair === 'long') X.svg('path', { d: 'M-48,-660 C-62,-724 62,-724 48,-660 L58,-528 Q0,-512 -58,-528 Z', fill: P.hairC }, hairBack);
    for (const sx of [-1, 1]) X.svg('ellipse', { cx: sx * 41, cy: -646, rx: 9, ry: 14, fill: P.skin }, headG);
    const face = 'M-41,-660 C-41,-704 41,-704 41,-660 C41,-621 29,-590 0,-586 C-29,-590 -41,-621 -41,-660 Z';
    X.svg('path', { d: face, fill: P.skin, stroke, 'stroke-width': 1.2 }, headG);
    sh(face, headG, 'R', 0.9);
    X.svg('ellipse', { cx: -20, cy: -628, rx: 9, ry: 6, fill: '#e07a6a', opacity: 0.16 }, headG);
    X.svg('ellipse', { cx: 20, cy: -628, rx: 9, ry: 6, fill: '#e07a6a', opacity: 0.16 }, headG);
    // hair (front)
    const hairs = {
      short: 'M-43,-652 C-48,-702 -18,-716 6,-712 C38,-710 50,-686 43,-650 C38,-670 22,-684 -2,-686 C-22,-686 -38,-674 -43,-652 Z',
      white: 'M-44,-648 C-46,-690 -10,-706 10,-704 C36,-702 48,-684 44,-648 C40,-668 26,-682 4,-684 C-18,-684 -40,-668 -44,-648 Z',
      long: 'M-44,-636 C-50,-702 -10,-716 0,-708 C10,-716 50,-702 44,-636 C42,-676 22,-692 3,-692 L0,-688 C-20,-692 -42,-676 -44,-636 Z',
      bun: 'M-44,-640 C-50,-700 -10,-712 0,-706 C10,-712 50,-700 44,-640 C42,-674 22,-688 3,-688 L0,-686 C-20,-688 -42,-674 -44,-640 Z',
    };
    if (P.hair === 'bun') X.svg('circle', { cx: 0, cy: -712, r: 26, fill: P.hairC }, hairBack);
    const hairEl = X.svg('path', { d: hairs[P.hair] || hairs.short, fill: P.hairC }, headG);
    if (P.hair === 'white') X.svg('path', { d: hairs.white, fill: 'url(#pkShadeR)', opacity: 0.6 }, headG);
    out.hair = hairEl;
    // features
    const browC = P.brows || (P.hair === 'white' || P.hair === 'bun' ? '#bdb6aa' : P.hairC);
    X.svg('path', { d: 'M-27,-665 Q-17,-671 -7,-666', stroke: browC, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, headG);
    X.svg('path', { d: 'M7,-666 Q17,-671 27,-665', stroke: browC, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, headG);
    const eye = (sx) => {
      X.svg('ellipse', { cx: sx * 16, cy: -651, rx: 6, ry: 4.6, fill: '#25190f' }, headG);
      X.svg('circle', { cx: sx * 16 + 1.8, cy: -652.5, r: 1.5, fill: '#fff', opacity: 0.85 }, headG);
      const lid = X.svg('rect', { x: sx * 16 - 9, y: -658, width: 18, height: 8, fill: P.skin }, headG);
      gsap.set(lid, { scaleY: 0, transformOrigin: '50% 0%' });
      return lid;
    };
    out.lidL = eye(-1); out.lidR = eye(1);
    X.svg('path', { d: 'M1,-648 Q-5,-634 -4,-629 Q1,-626 7,-630', stroke: shade(P.skin, -0.32), 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, headG);
    if (P.moustache) X.svg('path', { d: 'M-19,-617 Q-10,-627 0,-622 Q10,-627 19,-617 Q10,-613 0,-615 Q-10,-613 -19,-617 Z', fill: P.moustache === true ? P.hairC : P.moustache }, headG);
    out.mouthSmile = 'M-12,-608 Q0,-601 12,-608';
    out.mouthDroop = 'M-12,-607 Q3,-602 14,-597';
    out.mouth = X.svg('path', { d: out.mouthSmile, stroke: '#7a3528', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, headG);
    if (P.glasses) {
      for (const sx of [-1, 1]) X.svg('rect', { x: sx * 17 - 14, y: -661, width: 28, height: 20, rx: 6, fill: 'rgba(255,255,255,0.1)', stroke: '#3b2a1c', 'stroke-width': 2.6 }, headG);
      X.svg('path', { d: 'M-3,-653 Q0,-656 3,-653', stroke: '#3b2a1c', 'stroke-width': 2.4, fill: 'none' }, headG);
    }
    if (P.bindi) X.svg('circle', { cx: 0, cy: -670, r: 3.2, fill: '#b52a35' }, headG);
    out.head = headG;
    // arms (on top of the torso), pivots at the shoulders
    const arm = (sx, rot) => {
      const piv = X.svg('g', { transform: `translate(${sx * (shX - 4)},${shY + 16})` }, fig);
      const a = X.svg('g', {}, piv);
      const sleeveLen = saree ? 92 : P.top === 'shirt' && P.rolled ? 120 : 214;
      const sl = `M-21,-8 Q0,-20 21,-8 L18,${sleeveLen} Q0,${sleeveLen + 8} -18,${sleeveLen} Z`;
      if (sleeveLen < 214) X.svg('path', { d: `M-15,${sleeveLen - 6} L15,${sleeveLen - 6} L13,226 L-13,226 Z`, fill: P.skin, stroke, 'stroke-width': 1.2 }, a);
      X.svg('path', { d: sl, fill: saree ? shade(P.topC, -0.05) : P.jacket && false ? P.jacket : P.topC, stroke, 'stroke-width': 1.5 }, a);
      sh(sl, a, 'R', sx > 0 ? 1 : 0.5);
      X.svg('ellipse', { cx: 0, cy: 246, rx: 16, ry: 25, fill: P.skin, stroke, 'stroke-width': 1.2 }, a);
      X.svg('ellipse', { cx: -sx * 12, cy: 236, rx: 6, ry: 13, fill: shade(P.skin, -0.06), transform: `rotate(${sx * 18},${-sx * 12},236)` }, a);
      gsap.set(a, { rotation: rot, svgOrigin: '0 0' });
      return a;
    };
    out.armL = arm(-1, P.armL); out.armR = arm(1, P.armR);
    out.droop = (t, dur = 0.35) => {
      X.tl.fromTo(out.mouth, { attr: { d: out.mouthSmile } }, { attr: { d: out.mouthDroop }, duration: dur, ease: 'power2.inOut', immediateRender: false }, t);
      X.tl.fromTo(out.lidR, { scaleY: 0 }, { scaleY: 0.55, duration: dur, ease: 'power2.inOut', immediateRender: false }, t);
    };
    return out;
  };
  /** colour shade helper: k < 0 darker, k > 0 lighter */
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
    return '#' + [f(r), f(g), f(b)].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  PK.shade = shade;

  PK.table = (parent, cx, y, w = 760, o = {}) => {
    const g = X.svg('g', { filter: PK.cutF(1, 3) }, parent);
    const drop = o.drop || 120, legH = o.legH || 360;
    if (drop < 200) {
      X.svg('rect', { x: cx - w / 2 + 40, y: y + 40, width: 26, height: legH, fill: '#5a3a24' }, g);
      X.svg('rect', { x: cx + w / 2 - 66, y: y + 40, width: 26, height: legH, fill: '#4b301e' }, g);
    }
    const cloth = `M${cx - w / 2},${y} L${cx + w / 2},${y} L${cx + w / 2 + 14},${y + drop} Q${cx},${y + drop + 10} ${cx - w / 2 - 14},${y + drop} Z`;
    X.svg('path', { d: cloth, fill: o.cloth || '#efe7d6' }, g);
    for (let k = 0; k < 6; k++) X.svg('rect', { x: cx - w / 2 - 12, y: y + drop - 64 + k * 9, width: w + 24, height: 4, fill: o.stripe || '#b8323a', opacity: k % 2 ? 0.5 : 0.85 }, g);
    for (let k = 1; k < 6; k++) X.svg('line', { x1: cx - w / 2 + k * w / 6, y1: y + 20, x2: cx - w / 2 + k * w / 6 + (k - 3) * 4, y2: y + drop, stroke: 'rgba(0,0,0,0.05)', 'stroke-width': 6 }, g);
    X.svg('path', { d: cloth, fill: 'url(#pkShadeB)' }, g);
    X.svg('rect', { x: cx - w / 2, y: y - 12, width: w, height: 14, rx: 4, fill: '#7a5134' }, g);
    return g;
  };
  /** chai cup + saucer; returns the cup group (origin at the cup's base centre) */
  PK.cup = (parent, x, y, o = {}) => {
    const g = X.svg('g', { transform: `translate(${x},${y})` }, parent);
    const saucer = X.svg('ellipse', { cx: 0, cy: 0, rx: 70, ry: 15, fill: '#f2ede3', filter: 'url(#pkShS)' }, g);
    const cup = X.svg('g', {}, g);
    X.svg('path', { d: 'M-46,-78 L46,-78 L38,-6 Q0,4 -38,-6 Z', fill: '#f6f2ea', stroke: 'rgba(40,24,12,0.3)', 'stroke-width': 1.5 }, cup);
    X.svg('path', { d: 'M46,-62 Q76,-58 70,-34 Q64,-16 40,-22', fill: 'none', stroke: '#f6f2ea', 'stroke-width': 10 }, cup);
    X.svg('ellipse', { cx: 0, cy: -78, rx: 46, ry: 10, fill: '#8a5a33' }, cup);
    X.svg('rect', { x: -40, y: -52, width: 80, height: 8, fill: '#b8323a', opacity: 0.8 }, cup);
    X.svg('path', { d: 'M-46,-78 L46,-78 L38,-6 Q0,4 -38,-6 Z', fill: 'url(#pkShadeR)' }, cup);
    return { g, cup, saucer };
  };
  PK.plate = (parent, x, y, o = {}) => {
    const g = X.svg('g', { transform: `translate(${x},${y})` }, parent);
    X.svg('ellipse', { cx: 0, cy: 0, rx: 120, ry: 30, fill: '#f4efe4', filter: 'url(#pkShS)' }, g);
    X.svg('ellipse', { cx: 0, cy: -2, rx: 92, ry: 21, fill: '#e9e2d4' }, g);
    if (o.roti !== false) {
      X.svg('ellipse', { cx: -18, cy: -10, rx: 62, ry: 16, fill: '#d9a965' }, g);
      for (let k = 0; k < 5; k++) X.svg('circle', { cx: -50 + k * 18, cy: -12 + (k % 2) * 6, r: 3.5, fill: '#9c6a33', opacity: 0.6 }, g);
      X.svg('ellipse', { cx: 50, cy: -8, rx: 28, ry: 10, fill: '#e3b33c' }, g);
    }
    return g;
  };
  PK.glass = (parent, x, y, o = {}) => {
    const g = X.svg('g', { transform: `translate(${x},${y}) scale(${o.s || 1})`, filter: PK.cutF(o.s || 1, 3) }, parent);
    X.svg('path', { d: 'M-70,-220 L70,-220 L58,0 Q0,10 -58,0 Z', fill: 'rgba(225,236,240,0.92)', stroke: '#9fb3ba', 'stroke-width': 3 }, g);
    X.svg('path', { d: 'M-63,-150 L63,-150 L58,0 Q0,10 -58,0 Z', fill: '#8fc3d8', opacity: 0.85 }, g);
    X.svg('ellipse', { cx: 0, cy: -150, rx: 63, ry: 10, fill: '#b9dcea' }, g);
    X.svg('path', { d: 'M-48,-206 L-40,-20', stroke: '#fff', 'stroke-width': 9, opacity: 0.55, 'stroke-linecap': 'round' }, g);
    return g;
  };
  PK.pillow = (parent, x, y, o = {}) => {
    const g = X.svg('g', { transform: `translate(${x},${y}) rotate(${o.rot ?? -6}) scale(${o.s || 1})`, filter: PK.cutF(o.s || 1, 3) }, parent);
    const d = 'M-170,-90 Q-120,-112 0,-100 Q120,-112 170,-90 Q186,0 170,90 Q120,112 0,100 Q-120,112 -170,90 Q-186,0 -170,-90 Z';
    X.svg('path', { d, fill: '#eef0f2' }, g);
    for (let k = -3; k <= 3; k++) X.svg('rect', { x: k * 46 - 9, y: -100, width: 18, height: 200, fill: '#8fa9c6', opacity: 0.55 }, g);
    X.svg('path', { d, fill: 'none', stroke: '#c9d0d8', 'stroke-width': 5 }, g);
    X.svg('path', { d, fill: 'url(#pkShadeR)' }, g); X.svg('path', { d, fill: 'url(#pkShadeB)' }, g);
    X.svg('path', { d: 'M-120,-30 Q0,-50 120,-30', stroke: 'rgba(0,0,0,0.08)', 'stroke-width': 8, fill: 'none' }, g);
    return g;
  };
  PK.alarm = (parent, x, y, o = {}) => {
    const g = X.svg('g', { transform: `translate(${x},${y}) rotate(${o.rot ?? 6}) scale(${o.s || 1})`, filter: PK.cutF(o.s || 1, 3) }, parent);
    for (const sx of [-1, 1]) {
      X.svg('path', { d: `M${sx * 40},-118 A52,52 0 0 ${sx > 0 ? 1 : 0} ${sx * 112},-62 Z`, fill: '#b8323a' }, g);
      X.svg('line', { x1: sx * 60, y1: 80, x2: sx * 82, y2: 118, stroke: '#3a2a1e', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
    }
    X.svg('circle', { cx: 0, cy: 0, r: 118, fill: '#c23a3f' }, g);
    X.svg('circle', { cx: 0, cy: 0, r: 96, fill: '#f3ecdc' }, g);
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; X.svg('line', { x1: Math.sin(a) * 78, y1: -Math.cos(a) * 78, x2: Math.sin(a) * 90, y2: -Math.cos(a) * 90, stroke: C.ink, 'stroke-width': 4 }, g); }
    X.svg('line', { x1: 0, y1: 0, x2: 0, y2: -66, stroke: C.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    X.svg('line', { x1: 0, y1: 0, x2: 42, y2: 18, stroke: C.ink, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
    X.svg('circle', { cx: 0, cy: 0, r: 8, fill: C.ink }, g);
    X.svg('circle', { cx: 0, cy: 0, r: 118, fill: 'url(#pkShadeR)' }, g);
    return g;
  };
  PK.ambulance = (parent, x, y, o = {}) => {
    const s = o.s || 1;
    const g = X.svg('g', { transform: `translate(${x},${y}) scale(${s})`, filter: PK.cutF(s, 3) }, parent);
    const body = 'M-300,-30 L-300,-250 Q-300,-268 -282,-268 L150,-268 Q176,-268 192,-246 L272,-150 Q290,-128 290,-100 L290,-30 Z';
    X.svg('path', { d: body, fill: '#f3f1ec', stroke: 'rgba(40,24,12,0.35)', 'stroke-width': 2 }, g);
    X.svg('rect', { x: -300, y: -150, width: 590, height: 34, fill: '#c7343b' }, g);
    X.svg('rect', { x: -300, y: -106, width: 590, height: 10, fill: '#c7343b' }, g);
    X.svg('path', { d: 'M170,-246 L258,-150 L170,-150 Z', fill: '#2c3a46' }, g);
    for (const wx of [-270, -130, 10]) X.svg('rect', { x: wx, y: -236, width: 110, height: 64, rx: 6, fill: '#2c3a46' }, g);
    X.svg('text', { x: -214, y: -60, 'font-family': F.head, 'font-weight': 700, 'font-size': 46, fill: '#c7343b', text: o.label || '108' }, g);
    X.svg('rect', { x: -60, y: -290, width: 120, height: 24, rx: 8, fill: '#3463c4' }, g);
    X.svg('rect', { x: -60, y: -290, width: 60, height: 24, rx: 8, fill: '#d33b3f' }, g);
    for (const wx of [-190, 180]) {
      X.svg('circle', { cx: wx, cy: -30, r: 52, fill: '#22201e' }, g);
      X.svg('circle', { cx: wx, cy: -30, r: 24, fill: '#9a978f' }, g);
    }
    X.svg('path', { d: body, fill: 'url(#pkShadeB)' }, g);
    return g;
  };
  /** marigold garland swag across the top of a card */
  PK.garland = (parent, y, o = {}) => {
    const g = X.svg('g', {}, parent), n = o.n || 34, sag = o.sag || 70, r = X.rand(o.seed || 5);
    const flowers = [];
    for (let k = 0; k <= n; k++) {
      const u = k / n, x = u * W, yy = y + Math.sin(u * Math.PI * 2) * sag * 0.45 + Math.sin(u * Math.PI) * sag * 0.3;
      const c = X.svg('circle', { cx: x, cy: yy, r: 13 + r() * 4, fill: r() > 0.45 ? '#e58a1f' : '#f2b822', stroke: '#b35d12', 'stroke-width': 1.5 }, g);
      X.svg('circle', { cx: x - 3, cy: yy - 4, r: 4, fill: '#fff3c4', opacity: 0.5 }, g);
      if (k % 3 === 0) X.svg('ellipse', { cx: x + 10, cy: yy + 16, rx: 8, ry: 4, fill: '#4f7a3a', transform: `rotate(35,${x + 10},${yy + 16})` }, g);
      flowers.push(c);
    }
    return { g, flowers };
  };

  // ------------------------------------------------------------------ engravings
  /** marching-squares contours of f(x,y)=0 inside [x0,x1]×[y0,y1] → path d (organic "labyrinth" lines) */
  function contours(fn, x0, y0, x1, y1, step) {
    const nx = Math.ceil((x1 - x0) / step), ny = Math.ceil((y1 - y0) / step), v = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v.push(fn(x0 + i * step, y0 + j * step));
    const at = (i, j) => v[j * (nx + 1) + i];
    let d = '';
    const lerp = (a, b) => a / (a - b);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), e = at(i, j + 1);
      const pts = [];
      const X0 = x0 + i * step, Y0 = y0 + j * step;
      if ((a > 0) !== (b > 0)) pts.push([X0 + step * lerp(a, b), Y0]);
      if ((b > 0) !== (c > 0)) pts.push([X0 + step, Y0 + step * lerp(b, c)]);
      if ((e > 0) !== (c > 0)) pts.push([X0 + step * lerp(e, c), Y0 + step]);
      if ((a > 0) !== (e > 0)) pts.push([X0, Y0 + step * lerp(a, e)]);
      for (let k = 0; k + 1 < pts.length; k += 2) d += `M${pts[k][0].toFixed(1)},${pts[k][1].toFixed(1)}L${pts[k + 1][0].toFixed(1)},${pts[k + 1][1].toFixed(1)}`;
    }
    return d;
  }
  PK.contours = contours;
  /** vintage brain engraving, lateral view (front = left), ~640 wide; dark = white lines on the specimen board */
  PK.brain = (parent, cx, cy, o = {}) => {
    const s = o.s || 1, dark = o.dark !== false;
    const inner = PK.place(parent, cx, cy, 0, s);
    const ln = dark ? C.line : C.ink2, fill = dark ? '#2a2523' : C.bone;
    const cer = 'M-292,30 C-312,-50 -280,-150 -190,-205 C-110,-252 20,-262 120,-228 C220,-196 300,-120 308,-20 C314,40 290,92 240,112 C200,128 160,110 120,118 C80,126 60,150 20,160 C-40,176 -110,170 -160,140 C-200,118 -240,108 -262,84 C-282,66 -288,50 -292,30 Z';
    const cbl = 'M118,122 C140,100 232,98 280,120 C312,140 302,192 250,206 C200,220 140,202 120,172 C108,152 110,134 118,122 Z';
    const stem = 'M62,140 C78,190 84,250 80,330 L40,330 C44,256 36,196 24,156 Z';
    X.svg('path', { d: stem, fill, stroke: ln, 'stroke-width': 3 }, inner);
    X.svg('path', { d: stem, fill: dark ? PK.hatchW : PK.hatchI, opacity: 0.6 }, inner);
    X.svg('path', { d: cbl, fill, stroke: ln, 'stroke-width': 3 }, inner);
    for (let k = 0; k < 8; k++) X.svg('path', { d: `M${128 + k * 3},${128 + k * 10} C${170},${118 + k * 11} ${240},${116 + k * 11} ${292 - k * 4},${132 + k * 9}`, fill: 'none', stroke: ln, 'stroke-width': 1.8, opacity: 0.8 }, inner);
    const base = X.svg('path', { d: cer, fill }, inner);
    const cid = uid('pkBr'); const cp = X.svg('clipPath', { id: cid }, X.defs); X.svg('path', { d: cer }, cp);
    const glow = X.svg('g', { 'clip-path': `url(#${cid})` }, inner);
    const tint = X.svg('ellipse', { cx: -10, cy: -40, rx: 280, ry: 200, fill: X.radial(uid('pkBrG'), [[0, '#8a2a2a', 0.85], [0.6, '#5a1c1c', 0.5], [1, '#3a1414', 0]]), opacity: dark ? 0.75 : 0 }, glow);
    const field = (x, y) => Math.sin(x * 0.085 + 1.9 * Math.sin(y * 0.052 + 0.4)) + Math.sin(y * 0.08 + 2.1 * Math.sin(x * 0.047 + 1.1)) + 0.5 * Math.sin((x - y) * 0.05) + 0.35 * Math.sin(x * 0.021 + y * 0.017);
    // sulci: a heavy line at level 0 and a thin echo at +0.45 (gives each fold an engraved, carved edge)
    X.svg('path', { d: contours((x, y) => field(x, y) - 0.45, -320, -270, 320, 180, 3.5), fill: 'none', stroke: ln, 'stroke-width': 1.1, opacity: 0.55, 'clip-path': `url(#${cid})` }, inner);
    const gy = X.svg('path', {
      d: contours(field, -320, -270, 320, 180, 3.5),
      fill: 'none', stroke: ln, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.95, 'clip-path': `url(#${cid})`,
    }, inner);
    X.svg('path', { d: cer, fill: dark ? PK.hatchW2 : PK.hatchI2, opacity: 0.55, 'clip-path': `url(#${cid})`, mask: null }, inner);
    const shadeM = uid('pkBrM'); const m = X.svg('mask', { id: shadeM }, X.defs);
    X.svg('rect', { x: -330, y: -280, width: 660, height: 480, fill: X.linear(uid('pkBrL'), [[0, '#000'], [0.55, '#000'], [1, '#fff']], 0, 0, 0.2, 1) }, m);
    X.svg('path', { d: cer, fill: dark ? PK.hatchW : PK.hatchI, opacity: 0.9, mask: `url(#${shadeM})`, 'clip-path': `url(#${cid})` }, inner);
    X.svg('path', { d: 'M-190,72 C-120,42 -40,12 40,-18 C70,-28 100,-26 124,-40', fill: 'none', stroke: ln, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, inner);
    X.svg('path', { d: 'M40,-252 C22,-182 30,-112 2,-40 C-8,-12 2,18 -10,40', fill: 'none', stroke: ln, 'stroke-width': 4, 'stroke-linecap': 'round' }, inner);
    X.svg('path', { d: cer, fill: 'none', stroke: ln, 'stroke-width': 4 }, inner);
    // vessels (middle cerebral artery tree) — hidden until vessels(t)
    const vg = X.svg('g', { filter: 'url(#pkGlowRedS)' }, inner);
    const segs = [], r = X.rand(o.seed || 11);
    const branch = (x, y, a, len, w, depth) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      const mx = (x + x2) / 2 + (r() - 0.5) * len * 0.3, my = (y + y2) / 2 + (r() - 0.5) * len * 0.3;
      const p = X.svg('path', { d: `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, fill: 'none', stroke: '#d8434a', 'stroke-width': w, 'stroke-linecap': 'round' }, vg);
      segs.push({ p, depth: 4 - depth, x2, y2 });
      if (depth > 0) {
        branch(x2, y2, a - 0.42 - r() * 0.25, len * 0.74, w * 0.68, depth - 1);
        branch(x2, y2, a + 0.36 + r() * 0.25, len * 0.74, w * 0.68, depth - 1);
      }
    };
    branch(-150, 66, -0.35, 92, 9, 4);
    gsap.set(vg, { opacity: 0 });
    const api = { g: inner, tint, gyri: gy, vg, segs, clip: cid };
    api.vessels = (t, dur = 0.7) => {
      X.tl.set(vg, { opacity: 1 }, t);
      segs.forEach((sg) => X.drawOn(sg.p, t + sg.depth * dur / 5, dur / 4, 'power1.out'));
      X.sfx(t, 'swoosh', { dur: 0.5, gain: 0.2 });
    };
    // clot at a mid-tree node, ischaemic area downstream
    const node = segs.find((q) => q.depth === 2) || segs[2];
    const isc = X.svg('circle', { cx: node.x2 + 70, cy: node.y2 - 60, r: 180, fill: X.radial(uid('pkIsc'), [[0, dark ? '#0d0b0a' : '#6b5a4a', 0.92], [0.55, dark ? '#120f0e' : '#6b5a4a', 0.75], [1, '#000', 0]]), opacity: 0, 'clip-path': `url(#${cid})` }, null);
    inner.insertBefore(isc, vg);
    const clot = X.svg('g', { transform: `translate(${node.x2},${node.y2})` }, inner);
    X.svg('circle', { cx: 0, cy: 0, r: 16, fill: '#3a0d10', stroke: '#ff5a5f', 'stroke-width': 4 }, clot);
    gsap.set(clot, { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
    api.clot = (t) => {
      X.tl.fromTo(clot, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(3)', immediateRender: false }, t);
      X.sfx(t, 'thud', { gain: 0.45 });
    };
    api.spread = (t0, t1, k = 1) => {
      gsap.set(isc, { transformOrigin: '50% 50%' });
      X.tl.fromTo(isc, { opacity: 0, scale: 0.25 }, { opacity: 1, scale: k, duration: t1 - t0, ease: 'power1.inOut', immediateRender: false }, t0);
    };
    api.dim = (t, k = 0.25, dur = 0.6) => X.tl.to(tint, { opacity: k, duration: dur, ease: 'power2.inOut' }, t);
    const beat = X.svg('ellipse', { cx: -20, cy: -60, rx: 230, ry: 170, fill: X.radial(uid('pkBrB'), [[0, '#c8383f', 0.7], [0.5, '#8a2a2a', 0.35], [1, '#3a1414', 0]]), opacity: 0 }, null);
    glow.appendChild(beat);
    /** heart-beat glow pulse inside the brain (idle life on the specimen board) */
    api.beat = (t0, t1, hz = 1.1, amp = 0.55) => X.every((t) => {
      const k = t < t0 || t > t1 ? 0 : Math.pow(Math.max(0, Math.sin((t - t0) * Math.PI * 2 * hz)), 2);
      beat.setAttribute('opacity', (amp * k).toFixed(3));
    });
    return api;
  };
  /** vintage eye engraving, frontal (~460 wide) */
  PK.eye = (parent, cx, cy, o = {}) => {
    const s = o.s || 1, dark = !!o.dark;
    const inner = PK.place(parent, cx, cy, 0, s);
    const ln = dark ? C.line : C.ink2;
    const lid = 'M-230,0 C-150,-125 150,-125 230,0 C150,92 -150,92 -230,0 Z';
    const cid = uid('pkEy'); const cp = X.svg('clipPath', { id: cid }, X.defs); X.svg('path', { d: lid }, cp);
    // brow + crease + lower-lid hatching
    const r = X.rand(21);
    for (let k = 0; k < 70; k++) {
      const u = k / 69, x = -250 + u * 500, y = -205 - Math.sin(u * Math.PI) * 60 + (r() - 0.5) * 10;
      X.svg('line', { x1: x, y1: y + 16, x2: x + 22 + r() * 10, y2: y - 12, stroke: ln, 'stroke-width': 2.2, opacity: 0.8 }, inner);
    }
    X.svg('path', { d: 'M-212,-34 C-120,-170 120,-170 212,-34', fill: 'none', stroke: ln, 'stroke-width': 2.5 }, inner);
    X.svg('path', { d: 'M-250,-60 C-150,-190 150,-190 250,-60 C150,-150 -150,-150 -250,-60 Z', fill: dark ? PK.hatchW2 : PK.hatchI2, opacity: 0.7 }, inner);
    X.svg('path', { d: 'M-236,10 C-150,120 150,120 236,10 C150,150 -150,150 -236,10 Z', fill: dark ? PK.hatchW : PK.hatchI, opacity: 0.7 }, inner);
    X.svg('path', { d: lid, fill: dark ? '#2b2826' : '#efe7d6' }, inner);
    const ig = X.svg('g', { 'clip-path': `url(#${cid})` }, inner);
    X.svg('circle', { cx: 0, cy: -8, r: 86, fill: dark ? '#3a3330' : '#b9a27d' }, ig);
    for (let k = 0; k < 90; k++) {
      const a = (k / 90) * Math.PI * 2, r0 = 32 + r() * 6, r1 = 80 - r() * 8;
      X.svg('line', { x1: Math.cos(a) * r0, y1: -8 + Math.sin(a) * r0, x2: Math.cos(a) * r1, y2: -8 + Math.sin(a) * r1, stroke: ln, 'stroke-width': 1.6, opacity: 0.75 }, ig);
    }
    X.svg('circle', { cx: 0, cy: -8, r: 86, fill: 'none', stroke: ln, 'stroke-width': 3 }, ig);
    X.svg('circle', { cx: 0, cy: -8, r: 32, fill: '#120e0c' }, ig);
    X.svg('circle', { cx: 22, cy: -32, r: 12, fill: '#fff', opacity: 0.85 }, ig);
    X.svg('path', { d: 'M-230,0 C-150,-125 150,-125 230,0 L230,-40 L-230,-40 Z', fill: dark ? PK.hatchW2 : PK.hatchI2, opacity: 0.5, 'clip-path': `url(#${cid})` }, inner);
    // sclera shading at both corners + a shadow band under the upper lid (engraved hatching)
    const sg = X.svg('g', { 'clip-path': `url(#${cid})` }, inner);
    for (const sx of [-1, 1]) X.svg('ellipse', { cx: sx * 200, cy: 0, rx: 95, ry: 90, fill: dark ? PK.hatchW : PK.hatchI, opacity: 0.75 }, sg);
    X.svg('path', { d: 'M-230,0 C-150,-125 150,-125 230,0 C150,-95 -150,-95 -230,0 Z', fill: dark ? PK.hatchW : PK.hatchI, opacity: 0.9 }, sg);
    X.svg('circle', { cx: 0, cy: -8, r: 86, fill: 'none', stroke: dark ? '#111' : '#3b2a1c', 'stroke-width': 10, opacity: 0.55 }, sg);
    X.svg('path', { d: 'M-222,12 C-150,96 150,96 222,12', fill: 'none', stroke: ln, 'stroke-width': 1.6, opacity: 0.7 }, inner);
    X.svg('path', { d: lid, fill: 'none', stroke: ln, 'stroke-width': 4 }, inner);
    for (let k = 0; k < 26; k++) {
      const u = 0.06 + (k / 25) * 0.88, x = -230 + u * 460, y = -Math.sin(u * Math.PI) * 94 - 2;
      const dx = (u - 0.5) * 40;
      X.svg('path', { d: `M${x},${y} Q${x + dx * 0.4},${y - 26} ${x + dx},${y - 40}`, fill: 'none', stroke: ln, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, inner);
    }
    return { g: inner };
  };
  /** Snellen-style chart card; blur(t) smears it and veils one half (sudden blurred / one-sided vision) */
  PK.snellen = (parent, cx, cy, o = {}) => {
    const inner = PK.place(parent, cx, cy, o.rot ?? 2);
    const w = o.w || 520, h = o.h || 560;
    X.svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#f4efe3', filter: 'url(#pkSh)' }, inner);
    const fid = uid('pkSn'), f = X.svg('filter', { id: fid, x: '-10%', y: '-10%', width: '120%', height: '120%' }, X.defs);
    const bl = X.svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0 }, f);
    const rows = X.svg('g', { filter: `url(#${fid})` }, inner);
    const lines = [['E', 150], ['F P', 96], ['T O Z', 68], ['L P E D', 50], ['P E C F D', 38], ['E D F C Z P', 28]];
    const k = (h - 90) / lines.reduce((a, [, sz]) => a + sz * 0.81 + 26, 0);
    let y = -h / 2 + 40;
    lines.forEach(([txt, sz]) => { const z = sz * k; y += z * 0.81 + 26 * k; X.svg('text', { x: 0, y, 'text-anchor': 'middle', 'font-family': F.head, 'font-weight': 700, 'font-size': z, 'letter-spacing': z * 0.3, fill: C.ink, text: txt }, rows); });
    const veil = X.svg('rect', { x: 0, y: -h / 2, width: w / 2, height: h, fill: '#2a2420', opacity: 0 }, inner);
    return {
      g: inner,
      blur(t, k = 6) {
        X.tl.fromTo(bl, { attr: { stdDeviation: 0 } }, { attr: { stdDeviation: k }, duration: 0.6, ease: 'power2.inOut', immediateRender: false }, t);
        X.tl.fromTo(veil, { opacity: 0 }, { opacity: 0.55, duration: 0.6, ease: 'power2.inOut', immediateRender: false }, t + 0.3);
        X.sfx(t, 'woosh_low', { dur: 0.6, gain: 0.25 });
      },
    };
  };
})();
