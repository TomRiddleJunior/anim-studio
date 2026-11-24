/* explainer-layer-stack kit — flat ink-outline "system diagram" reels (1080x1920).
 * Chrome (warm canvas, mono chapter tag, selection-box captions), an original full-body presenter, a screen-face
 * mascot, the layer-stack widget and a library of thin-ink objects. Every function is seek-safe: it builds SVG and
 * adds tweens to X.tl at absolute times; nothing reads the clock.
 * Coordinates are 1080x1920 (source measured at 720x1280, x1.5).                                            */
(function () {
  const K = (window.K = {});
  const C = (K.C = {
    bg: '#faf8f4', ink: '#1e1f24', ink2: '#3a3b41', grey: '#929194', tagGrey: '#7d7b77', capDark: '#131a27',
    selFill: '#d3dff5', selLine: '#3b78e7', handle: '#2e7af9',
    white: '#ffffff', paper: '#fbfaf7', line: '#d9d6d0', shade: '#e8e5df', shade2: '#d4d0c8', shadow: '#d9d6d0',
    dark: '#1b1c21', dark2: '#2c2d33', dark3: '#45464d',
    blue: '#2f5bd8', blue2: '#4a79ce', blueL: '#d6e4fb', navy: '#22345c',
    red: '#c05d3b', red2: '#a84a2c', salmon: '#ebc3b5', salmonL: '#f4ddd3',
    yellow: '#fde099', yellow2: '#f3cf7a', crane: '#e5c35c', orange: '#e9a23b',
    green: '#2da160', greenL: '#cfe9d8', tree: '#8db689', tree2: '#6f9c6b',
    cyan: '#7fe0f0', skin1: '#c98a64', skin2: '#e8b48f', skin3: '#8a5a3c', skin4: '#f0c8a8',
  });
  K.F = { cap: 'Inter, sans-serif', mono: '"Roboto Mono", monospace', label: 'Inter, sans-serif' };
  const S = (tag, a, p) => X.svg(tag, a, p);
  K.S = S;
  const G = (p, a = {}) => S('g', a, p);
  K.G = G;
  const stroke = (w = 3) => ({ stroke: C.ink, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  K.stroke = stroke;

  // ------------------------------------------------------------------ text helpers
  K.text = (p, x, y, str, o = {}) => S('text', {
    x, y, text: str, 'font-family': o.font || K.F.label, 'font-size': o.size || 28, 'font-weight': o.weight || 700,
    fill: o.fill || C.ink, 'text-anchor': o.anchor || 'start', 'letter-spacing': o.ls ?? 0,
    ...(o.attrs || {}),
  }, p);
  K.mono = (p, x, y, str, o = {}) => K.text(p, x, y, str, { font: K.F.mono, weight: o.weight || 500, ...o });
  let _meas;
  K.measure = (str, size, weight, font = K.F.cap, ls = 0) => {
    if (!_meas) _meas = S('text', { x: -9999, y: -9999, opacity: 0 }, X.root);
    _meas.setAttribute('font-family', font); _meas.setAttribute('font-size', size);
    _meas.setAttribute('font-weight', weight); _meas.setAttribute('letter-spacing', ls);
    _meas.textContent = str;
    return _meas.getComputedTextLength();
  };

  // ------------------------------------------------------------------ canvas + chrome
  K.canvas = () => {
    K.bgRect = S('rect', { x: 0, y: 0, width: X.W, height: X.H, fill: C.bg }, X.root); // horror variant: kept so the paper can dim
    K.world = G(X.root, { id: 'world' });
    K.pres = G(X.root, { id: 'pres' });
    K.over = G(X.root, { id: 'over' });
    K.top = G(X.root, { id: 'chrome' });
    return K.world;
  };
  /** Chapter tag "// 03 — system prompt": mono, grey, top-left (x 12.4 %, baseline 7.6 % H). Hard switch at t. */
  K.tags = (list) => {
    const g = G(K.top, { id: 'tags' });
    list.forEach(([t0, t1, str]) => {
      const el = K.mono(g, 134, 147, str, { size: 24, weight: 400, fill: C.tagGrey, attrs: { 'xml:space': 'preserve' } });
      gsap.set(el, { autoAlpha: 0 });
      X.tl.set(el, { autoAlpha: 1 }, t0);
      X.tl.set(el, { autoAlpha: 0 }, t1);
    });
  };

  // ------------------------------------------------------------------ captions
  /* Karaoke chunks: 2 lines max, ~16 chars per line, a comma ends a line, . ? ! : or a pause ends the chunk.
   * Newest word = dark semibold with a 3-frame blur-in; earlier words drop to grey regular; keywords stay dark and get
   * a design-tool selection box (light-blue fill, 1.5 px blue line, round handles top-left + bottom-right). */
  K.captions = (opts = {}) => {
    const size = opts.size || 66, pitch = opts.pitch || 74, base1 = opts.base || 1533, maxCh = opts.maxChars || 16;
    const wDark = 650, wGrey = 450;
    const keys = opts.keys || {}; // lineId -> [words]
    const merges = opts.merges || []; // [{line, from:'crumbwell', n:3, show:'crumbwell.shop'}]
    const shows = opts.shows || {}; // 'lineId:wordIdx' -> display
    const g = G(K.top, { id: 'captions' });
    if (!X.defs.querySelector('#capblur')) {
      const f = S('filter', { id: 'capblur', x: '-30%', y: '-60%', width: '160%', height: '220%' }, X.defs);
      K._capBlur = S('feGaussianBlur', { stdDeviation: 0 }, f);
    }
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%']/g, '');
    // flatten words with flags
    const W = [];
    X.vo.lines.forEach((l) => {
      const ks = (keys[l.id] || []).map(norm);
      const used = new Set();
      for (let i = 0; i < l.words.length; i++) {
        const w = l.words[i];
        let disp = shows[`${l.id}:${i}`] ?? w.w, end = w.end, skip = 0;
        for (const m of merges) {
          if (m.line === l.id && norm(w.w) === norm(m.from) && (m.at == null || m.at === i)) {
            disp = m.show; end = l.words[i + m.n - 1].end; skip = m.n - 1; break;
          }
        }
        const n = norm(disp);
        let key = false;
        for (const k of ks) if (!used.has(k) && n.startsWith(k) && k.length) { key = true; used.add(k); break; }
        W.push({ w: disp, start: w.start, end, key, line: l.id });
        i += skip;
      }
    });
    // chunking
    // horror variant: chunks that start after opts.night.t are drawn pale on the dark canvas
    const NT = opts.night || null;
    const chunks = [];
    let cur = null, ln = null;
    const flush = () => { if (cur) chunks.push(cur); cur = null; ln = null; };
    for (let i = 0; i < W.length; i++) {
      const w = W[i], prev = W[i - 1];
      if (cur && prev && (w.start - prev.end > 0.42 || prev.line !== w.line && w.start - prev.end > 0.25)) flush();
      if (!cur) { cur = { lines: [[]], words: [] }; ln = cur.lines[0]; }
      const lineLen = ln.map((x) => x.w).join(' ').length;
      if (ln.length && lineLen + 1 + w.w.length > maxCh) {
        if (cur.lines.length === 2) { flush(); cur = { lines: [[]], words: [] }; ln = cur.lines[0]; }
        else { ln = []; cur.lines.push(ln); }
      }
      ln.push(w); cur.words.push(w);
      if (/[.?!:]$/.test(w.w)) flush();
      else if (/[,;]$/.test(w.w)) {
        if (cur.lines.length === 2) flush(); else { ln = []; cur.lines.push(ln); }
      }
    }
    flush();
    chunks.forEach((c) => { c.lines = c.lines.filter((l) => l.length); });
    // render
    const lead = 0.03;
    chunks.forEach((c, ci) => {
      const next = chunks[ci + 1];
      const last = c.words[c.words.length - 1];
      const tEnd = next ? Math.min(next.words[0].start - lead, last.end + 0.9) : last.end + (opts.lastHold ?? 1.6); // horror variant: lastHold
      const cg = G(g, {});
      const nm = NT && c.words[0].start >= NT.t;
      const cDark = nm ? NT.dark : C.capDark, cGrey = nm ? NT.grey : C.grey;
      const cSelF = nm ? NT.selFill : C.selFill, cSelL = nm ? NT.selLine : C.selLine, cHan = nm ? NT.handle : C.handle;
      gsap.set(cg, { autoAlpha: 0 });
      X.tl.set(cg, { autoAlpha: 1 }, c.words[0].start - lead);
      X.tl.to(cg, { autoAlpha: 0, duration: 0.1, ease: 'power1.in' }, tEnd - 0.1);
      const flat = [];
      c.lines.forEach((l, li) => l.forEach((w) => flat.push({ ...w, li })));
      flat.forEach((w, k) => {
        const t0 = w.start - lead, t1 = k + 1 < flat.length ? flat[k + 1].start - lead : tEnd + 0.2;
        const sg = G(cg, {});
        gsap.set(sg, { autoAlpha: 0 });
        X.tl.set(sg, { autoAlpha: 1 }, t0);
        X.tl.set(sg, { autoAlpha: 0 }, t1);
        const vis = flat.slice(0, k + 1);
        const nLines = vis[vis.length - 1].li + 1;
        const bases = nLines === 1 ? [base1] : [base1 - pitch / 2, base1 + pitch / 2];
        for (let li = 0; li < nLines; li++) {
          const lw = vis.filter((x) => x.li === li);
          const styled = lw.map((x) => {
            const dark = x.key || x === w;
            return { x, dark, wt: dark ? wDark : wGrey, wid: K.measure(x.w, size, dark ? wDark : wGrey) };
          });
          const space = size * 0.27;
          const total = styled.reduce((a, s) => a + s.wid, 0) + space * (styled.length - 1) + styled.filter((s) => s.x.key).length * 8;
          let x = X.W / 2 - total / 2;
          styled.forEach((s) => {
            const by = bases[li];
            if (s.x.key) x += 4;
            if (s.x.key) {
              const bx = x - 13, bw = s.wid + 26, top = by - 63, bh = 78;
              const bg = G(sg, {});
              const box = S('rect', { x: bx, y: top, width: bw, height: bh, fill: cSelF, stroke: cSelL, 'stroke-width': 2 }, bg);
              const h1 = S('circle', { cx: bx, cy: top, r: 8.5, fill: cHan }, bg);
              const h2 = S('circle', { cx: bx + bw, cy: top + bh, r: 8.5, fill: cHan }, bg);
              if (s.x === w) { // selection draws in: handles first, box sweeps from the top-left handle
                gsap.set(box, { scaleX: 0, scaleY: 0, svgOrigin: `${bx} ${top}` });
                gsap.set([h1, h2], { scale: 0, transformOrigin: '50% 50%' });
                X.tl.to(h1, { scale: 1, duration: 0.06, ease: 'none' }, t0 + 0.03);
                X.tl.to(box, { scaleX: 1, scaleY: 1, duration: 0.07, ease: 'power2.out' }, t0 + 0.05);
                X.tl.to(h2, { scale: 1, duration: 0.06, ease: 'none' }, t0 + 0.09);
              }
            }
            const te = S('text', { x, y: bases[li], text: s.x.w, 'font-family': K.F.cap, 'font-size': size, 'font-weight': s.wt, fill: s.dark ? cDark : cGrey }, sg);
            if (s.x === w) { // blur-in of the newest word
              gsap.set(te, { opacity: 0 });
              X.tl.to(te, { opacity: 1, duration: 0.09, ease: 'none' }, t0);
              const f = S('feGaussianBlur', { stdDeviation: 7 }, S('filter', { id: `cb${ci}_${k}`, x: '-30%', y: '-80%', width: '160%', height: '260%' }, X.defs));
              te.setAttribute('filter', `url(#cb${ci}_${k})`);
              X.tl.to(f, { attr: { stdDeviation: 0 }, duration: 0.1, ease: 'power1.out' }, t0);
              X.tl.set(te, { attr: { filter: 'none' } }, t0 + 0.11);
            }
            x += s.wid + space + (s.x.key ? 4 : 0);
          });
        }
      });
    });
    K.capChunks = chunks;
    return chunks;
  };

  // ------------------------------------------------------------------ motion helpers
  K.slideIn = (el, t, from = 'left', dist = 260, o = {}) => {
    const v = { left: [-dist, 0], right: [dist, 0], up: [0, -dist], down: [0, dist] }[from];
    gsap.set(el, { x: v[0], y: v[1], opacity: 0, rotation: o.rot ?? 0, ...(o.origin ? { svgOrigin: o.origin } : {}) });
    X.tl.to(el, { x: 0, y: 0, opacity: 1, rotation: 0, duration: Math.min(o.dur ?? 0.14, K.SPEED.slide), ease: o.ease || 'back.out(1.6)' }, t);
    if (o.sfx !== false) X.sfx(t, o.sfx || 'swoosh', { gain: o.gain ?? 0.28, dur: 0.25 });
    if (o.bump !== false) K.bumpAround(el, t + 0.1, o.bump);
    K._enter(el, t);
  };
  K.SPEED = { slide: 0.16, pop: 0.17, drop: 0.24 };
  /* "Make room": when something lands in a chapter set, the elements already standing nearby get pushed away and
   * spring back (the source re-balances its layout on every arrival). Each neighbour gets an inner jostle layer whose
   * offset is a sum of damped springs — a pure function of t. Backgrounds wider than 700 px are left alone. */
  K.BUMP = { amp: 72, reach: 950, tau: 0.22, per: 0.4 };
  const jostle = new Map();
  const layerOf = (n) => {
    if (jostle.has(n)) return jostle.get(n);
    const J = S('g', {}, null);
    while (n.firstChild) J.appendChild(n.firstChild);
    n.appendChild(J);
    const rec = { J, imp: [] };
    X.every((t) => {
      let dx = 0, dy = 0;
      for (const k of rec.imp) {
        const u = t - k.t;
        if (u <= 0 || u > 1.2) continue;
        const a = Math.exp(-u / K.BUMP.tau) * Math.sin((2 * Math.PI * u) / K.BUMP.per);
        dx += k.dx * a; dy += k.dy * a;
      }
      J.setAttribute('transform', dx || dy ? `translate(${dx.toFixed(1)} ${dy.toFixed(1)})` : '');
    });
    jostle.set(n, rec);
    return rec;
  };
  /** Re-layout at a sentence turn (source 45.1 s): everything already standing in the chapter set shrinks toward
   *  its nearest corner of the diagram region (x 240..1080, y 380..1310), freeing the middle for what comes next. */
  K.relayout = (g, t, o = {}) => {
    const box = o.box || [240, 380, 1080, 1310], k = o.k ?? 0.42, sc = o.scale ?? 0.78, dur = o.dur ?? 0.34;
    const mx = (box[0] + box[2]) / 2, my = (box[1] + box[3]) / 2;
    let i = 0;
    for (const n of [...g.children]) {
      if (n.nodeName !== 'g' || (o.skip && o.skip.includes(n))) continue;
      let b; try { b = n.getBBox(); } catch (e) { continue; }
      if (!b.width || b.width > 760 || b.width * b.height < 3000) continue;
      const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      const tx = cx < mx ? box[0] + b.width * sc / 2 : box[2] - b.width * sc / 2;
      const ty = cy < my ? box[1] + b.height * sc / 2 : box[3] - b.height * sc / 2;
      X.tl.to(n, { x: `+=${((tx - cx) * k).toFixed(1)}`, y: `+=${((ty - cy) * k).toFixed(1)}`, scale: sc, svgOrigin: `${cx} ${cy}`, duration: dur, ease: 'back.inOut(1.2)' }, t + i * 0.025);
      i++;
    }
    X.sfx(t, 'whoosh', { gain: 0.25 });
  };
  /** Remember what entered a chapter set and when (used by K.emphasize). */
  K._entries = new Map();
  K._enter = (el, t) => { const par = el.parentNode; if (!par || !/^c\d\d(cam)?$/.test(par.id || '')) return; if (!K._entries.has(par)) K._entries.set(par, []); K._entries.get(par).push({ el, t }); };
  /** Emphasis on a stressed word: the newest element of the set thumps (+8 % and back) and nudges its neighbours. */
  K.emphasize = (g, t, o = {}) => {
    const list = (K._entries.get(g) || []).filter((e) => e.t < t - 0.2 && e.t > t - 5);
    if (!list.length) return;
    const e = list[Math.max(0, list.length - 1 - (o.back ?? 0) % Math.min(3, list.length))];
    X.tl.to(e.el, { scale: `+=${o.amt ?? 0.1}`, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, t);
    K.bumpAround(e.el, t + 0.05, K.BUMP.amp * (o.nudge ?? 0.6));
  };
  /** Mark set pieces that must not be jostled (buildings, a box something stands on, a globe with pins). */
  K.still = (...els) => els.forEach((e) => e && e.setAttribute('data-still', '1'));
  K.bumpAround = (el, t, amp = K.BUMP.amp) => {
    const par = el.parentNode;
    if (!par || !/^c\d\d(cam)?$/.test(par.id || '') || amp <= 0) return;
    let b; try { b = el.getBBox(); } catch (e) { return; }
    if (!b.width || b.width > 700) return;
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    for (const n of [...par.children]) {
      if (n === el || n.nodeName !== 'g' || n.getAttribute('data-still')) continue;
      let nb; try { nb = n.getBBox(); } catch (e) { continue; }
      if (!nb.width || nb.width > 700 || nb.width * nb.height < 2500) continue;
      const nx = nb.x + nb.width / 2, ny = nb.y + nb.height / 2;
      const dx = nx - cx, dy = ny - cy, d = Math.hypot(dx, dy);
      if (d > K.BUMP.reach || d < 1) continue;
      const k = amp * (1 - d / K.BUMP.reach);
      layerOf(n).imp.push({ t, dx: (dx / d) * k, dy: (dy / d) * k * 0.45 });
    }
  };
  K.pop = (el, t, o = {}) => { X.pop(el, t, { ease: 'back.out(2.6)', gain: 0.3, ...o, dur: Math.min(o.dur ?? 0.16, K.SPEED.pop) }); if (o.bump !== false) K.bumpAround(el, t + 0.06, o.bump ?? K.BUMP.amp * 0.7); K._enter(el, t); };
  K.popOut = (el, t, dur = 0.14) => X.tl.to(el, { scale: 0, opacity: 0, duration: dur, ease: 'power2.in', transformOrigin: '50% 50%' }, t);
  K.fadeOut = (el, t, dur = 0.15) => X.tl.to(el, { opacity: 0, duration: dur, ease: 'none' }, t);
  K.show = (el, t) => { gsap.set(el, { autoAlpha: 0 }); X.tl.set(el, { autoAlpha: 1 }, t); };
  K.hide = (el, t) => X.tl.set(el, { autoAlpha: 0 }, t);
  K.drop = (el, t, dist = 300, o = {}) => { // falls in, lands with a squash
    gsap.set(el, { y: -dist, opacity: 1 });
    X.tl.to(el, { y: 0, duration: o.dur ?? 0.32, ease: 'power3.in' }, t);
    X.tl.to(el, { scaleY: 0.92, scaleX: 1.04, duration: 0.06, transformOrigin: '50% 100%', ease: 'power1.out' }, t + (o.dur ?? 0.32));
    X.tl.to(el, { scaleY: 1, scaleX: 1, duration: 0.18, ease: 'back.out(3)' }, t + (o.dur ?? 0.32) + 0.06);
    if (o.sfx !== false) X.sfx(t + (o.dur ?? 0.32), o.sfx || 'thud', { gain: o.gain ?? 0.4 });
  };
  K.shake = (el, t, amp = 8, dur = 0.3) => {
    const n = Math.round(dur / 0.05);
    for (let i = 0; i < n; i++) X.tl.to(el, { x: (i % 2 ? -1 : 1) * amp * (1 - i / n), duration: 0.05, ease: 'none' }, t + i * 0.05);
    X.tl.to(el, { x: 0, duration: 0.05 }, t + n * 0.05);
  };
  K.type = (el, str, t, cps = 40, sfx = true) => {
    X.typeOn(el, str, t, cps);
    if (sfx) for (let i = 0; i < str.length; i += 3) X.sfx(t + i / cps, 'type', { gain: 0.12, pitch: 0.9 + ((i * 7) % 5) / 10 });
    return t + str.length / cps;
  };
  K.idleBob = (el, t0, t1, amp = 4, per = 1.6, phase = 0) => X.every((t) => {
    if (t < t0 || t > t1) return;
    el.setAttribute('transform', `translate(0 ${(Math.sin((t - t0) / per * Math.PI * 2 + phase) * amp).toFixed(2)})`);
  });
  /** Rubber stamp slam: 130 % ghost at 60 % on frame 1, 100 % on frame 2, tiny rebound. */
  K.slam = (el, t, o = {}) => {
    gsap.set(el, { autoAlpha: 0, scale: 1.3, transformOrigin: '50% 50%' });
    X.tl.set(el, { autoAlpha: 0.6, scale: 1.3 }, t);
    X.tl.set(el, { autoAlpha: 1, scale: 1 }, t + 1 / 30);
    X.tl.to(el, { scale: 1.015, duration: 1 / 30, ease: 'none' }, t + 2 / 30);
    X.tl.to(el, { scale: 1, duration: 2 / 30, ease: 'none' }, t + 3 / 30);
    X.sfx(t, o.sfx || 'stamp', { gain: o.gain ?? 0.55 });
  };
  /** Nervous jitter between t0 and t1 (pure function of t; writes the transform of a dedicated wrapper) */
  K.jitter = (el, t0, t1, amp = 6, rot = 3) => X.every((t) => {
    if (t < t0 || t > t1) { if (el.__j) { el.removeAttribute('transform'); el.__j = 0; } return; }
    const k = Math.floor(t * 24);
    const r = (n) => (Math.sin(k * 12.9898 + n * 78.233) * 43758.5453) % 1;
    el.setAttribute('transform', `translate(${(r(1) * amp).toFixed(1)} ${(r(2) * amp * 0.5).toFixed(1)}) rotate(${(r(3) * rot).toFixed(2)} ${el.__cx || 0} ${el.__cy || 0})`);
    el.__j = 1;
  });
  /** Camera move on a chapter group: scale about (cx,cy) */
  K.camTo = (el, t, scale, cx, cy, dur = 0.5, ease = 'power3.inOut') => X.tl.to(el, { scale, svgOrigin: `${cx} ${cy}`, duration: dur, ease }, t);
  /** Marching dashes along a dashed connector (continuous, like the source's live cables) */
  K.march = (el, speed = 40) => X.every((t) => el.setAttribute('stroke-dashoffset', (-t * speed).toFixed(1)));
  /** Salmon halo pulse behind a focal element (the source's emphasis device): grows in 7 f, holds, fades. */
  K.pulse = (p, x, y, r, t, o = {}) => {
    const c = S('circle', { cx: x, cy: y, r: r * 0.72, fill: o.fill || C.salmon, opacity: 0 });
    if (o.before && o.before.parentNode === p) p.insertBefore(c, o.before); else p.insertBefore(c, p.firstChild);
    gsap.set(c, { scale: 0.2, transformOrigin: '50% 50%' });
    X.tl.to(c, { scale: 1, opacity: o.op ?? 0.42, duration: 0.24, ease: 'back.out(1.8)' }, t);
    X.tl.to(c, { opacity: 0, scale: 1.08, duration: 0.3, ease: 'power1.in' }, t + (o.hold ?? 0.9));
    return c;
  };
  /** Drop in from above the frame with a bounce settle */
  K.dropIn = (el, t, dist = 700, o = {}) => {
    gsap.set(el, { y: -dist, autoAlpha: 0 });
    X.tl.set(el, { autoAlpha: 1 }, t);
    X.tl.to(el, { y: 0, duration: Math.min(o.dur ?? 0.22, K.SPEED.drop), ease: o.ease || 'back.out(1.4)' }, t);
    if (o.sfx !== false) X.sfx(t + 0.2, o.sfx || 'drop', { gain: o.gain ?? 0.28 });
    if (o.bump !== false) K.bumpAround(el, t + Math.min(o.dur ?? 0.22, K.SPEED.drop), o.bump);
    K._enter(el, t);
  };
  /** Fly out (exit) towards a side, shrinking */
  K.flyOut = (el, t, dx = -600, dy = 0, dur = 0.24) => {
    X.tl.to(el, { x: dx, y: dy, scale: 0.6, opacity: 0, transformOrigin: '50% 50%', duration: dur, ease: 'power3.in' }, t);
  };
  /** Re-stage: move/scale an element to a new layout slot */
  K.restage = (el, t, to, dur = 0.32) => X.tl.to(el, { ...to, duration: dur, ease: 'power3.inOut' }, t);
  /** Dust puff when something lands (5 grey circles drift out and fade). */
  K.puff = (p, x, y, t, s = 1) => {
    const g = G(p, {});
    for (let i = 0; i < 6; i++) {
      const a = (i / 5) * Math.PI, r = (14 + (i % 3) * 6) * s;
      const c = S('circle', { cx: x, cy: y, r, fill: '#e3e0da' }, g);
      gsap.set(c, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' });
      X.tl.to(c, { opacity: 0.9, scale: 1, x: Math.cos(a) * 46 * s * (i % 2 ? 1 : -1), y: -Math.sin(a) * 16 * s, duration: 0.22, ease: 'power2.out' }, t);
      X.tl.to(c, { opacity: 0, duration: 0.25, ease: 'none' }, t + 0.2);
    }
    return g;
  };

  // ------------------------------------------------------------------ primitives
  K.shadow = (p, cx, cy, rx, ry = rx * 0.16, op = 1) => S('ellipse', { cx, cy, rx, ry, fill: C.shadow, opacity: op }, p);
  K.rrect = (p, x, y, w, h, r, fill, sw = 3, extra = {}) => S('rect', { x, y, width: w, height: h, rx: r, fill, ...(sw ? stroke(sw) : {}), ...extra }, p);
  K.card = (p, x, y, w, h, o = {}) => { // white card with a hard grey offset shadow
    const g = G(p, {});
    if (o.shadow !== false) S('rect', { x: x + 6, y: y + 7, width: w, height: h, rx: o.r ?? 14, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, o.r ?? 14, o.fill || C.white, o.sw ?? 3);
    return g;
  };
  /** Dark label pill ("BANK", "secure") */
  K.pill = (p, x, y, str, o = {}) => {
    const size = o.size || 24, font = o.font || K.F.mono, wt = o.weight || 600;
    const w = K.measure(str, size, wt, font, o.ls || 1) + (o.padX ?? 18) * 2, h = size + (o.padY ?? 14);
    const g = G(p, {});
    const ax = o.anchor === 'middle' ? x - w / 2 : x;
    K.rrect(g, ax, y, w, h, o.r ?? 8, o.fill || C.dark, o.sw ?? 0);
    K.text(g, ax + w / 2, y + h / 2 + size * 0.36, str, { font, size, weight: wt, fill: o.color || '#fff', anchor: 'middle', ls: o.ls || 1 });
    g.w = w; g.h = h;
    return g;
  };
  /** Speech bubble: white (or red) rounded box, ink outline, little tail. */
  K.bubble = (p, x, y, str, o = {}) => {
    const size = o.size || 30, wt = o.weight || 700;
    const lines = Array.isArray(str) ? str : [str];
    const tw = Math.max(...lines.map((l) => K.measure(l, size, wt, o.font || K.F.cap)));
    const w = o.w || tw + 44, h = o.h || lines.length * size * 1.18 + 26;
    const g = G(p, {});
    const fill = o.red ? C.red : o.fill || C.white, col = o.red ? '#fff' : o.color || C.ink;
    const tx = o.tailX ?? (o.tail === 'right' ? w - 34 : o.tail === 'left' ? 30 : w / 2);
    const tail = `M${x + tx - 12},${y + h - 2} L${x + tx},${y + h + 18} L${x + tx + 12},${y + h - 2}`;
    if (o.shadow !== false) S('rect', { x: x + 4, y: y + 5, width: w, height: h, rx: h / 2 > 30 ? 22 : h / 2, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, Math.min(h / 2, 24), fill, 3);
    S('path', { d: tail, fill, ...stroke(3) }, g);
    S('rect', { x: x + tx - 10, y: y + h - 5, width: 20, height: 6, fill }, g);
    lines.forEach((l, i) => K.text(g, x + w / 2, y + 13 + size * 0.95 + i * size * 1.18, l, { size, weight: wt, fill: col, anchor: 'middle', font: o.font }));
    g.w = w; g.h = h;
    gsap.set(g, { transformOrigin: `${tx}px ${h + 18}px` });
    return g;
  };
  K.thought = (p, x, y, w, h, lines, o = {}) => {
    const g = G(p, {});
    const cx = x + w / 2, cy = y + h / 2;
    let d = '';
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = 0.5;
      const px = cx + Math.cos(a) * w * r, py = cy + Math.sin(a) * h * r;
      d += `M${px + 22},${py} a22,22 0 1,0 -44,0 a22,22 0 1,0 44,0 `;
    }
    S('ellipse', { cx, cy, rx: w / 2 + 4, ry: h / 2 + 4, fill: '#fff', ...stroke(3) }, g);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      S('circle', { cx: cx + Math.cos(a) * w * 0.47, cy: cy + Math.sin(a) * h * 0.47, r: 22, fill: '#fff', ...stroke(3) }, g);
    }
    S('ellipse', { cx, cy, rx: w / 2 - 6, ry: h / 2 - 6, fill: '#fff' }, g);
    S('circle', { cx: x + w * (o.tailX ?? 0.75), cy: y + h + 18, r: 9, fill: '#fff', ...stroke(3) }, g);
    S('circle', { cx: x + w * (o.tailX ?? 0.75) + 14, cy: y + h + 40, r: 6, fill: '#fff', ...stroke(3) }, g);
    lines.forEach((l, i) => K.text(g, cx, cy + (i - (lines.length - 1) / 2) * 36 + 11, l.t ?? l, { size: 30, weight: 700, anchor: 'middle', fill: l.fill || C.ink }));
    return g;
  };

  // ------------------------------------------------------------------ brand
  /** Crumbwell logo: blue rounded square, white loaf with three scores. */
  K.logo = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('rect', { x: -22, y: -22, width: 44, height: 44, rx: 11, fill: C.blue, ...stroke(2.5) }, g);
    S('path', { d: 'M-14,8 C-15,-6 -6,-12 0,-12 C6,-12 15,-6 14,8 Z', fill: '#fff' }, g);
    S('path', { d: 'M-7,-4 l5,-5 M-1,-1 l6,-6 M5,3 l5,-5', stroke: C.blue, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g);
    return g;
  };
  K.brandSticker = (p, x, y, str = 'crumbwell', s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const w = K.measure(str, 30, 700) + 86;
    S('rect', { x: 4, y: 5, width: w, height: 58, rx: 9, fill: C.shadow }, g);
    K.rrect(g, 0, 0, w, 58, 9, '#fff', 3);
    K.logo(g, 32, 29, 0.85);
    K.text(g, 60, 40, str, { size: 30, weight: 700 });
    g.w = w;
    return g;
  };

  // ------------------------------------------------------------------ city
  /** Isometric shop building: left face (lit), right face (shade), flat roof with a tank, window grid. */
  K.building = (p, x, y, w, h, o = {}) => { // x,y = bottom-front corner (centre bottom)
    const g = G(p, {});
    const d = w * 0.55, lw = w * 0.5, k = 0.5; // iso: left face goes up-left, right face up-right
    const L = { x: x - lw, y: y - lw * k }, R = { x: x + d, y: y - d * k };
    const top = h;
    const base = o.base || '#f4f2ee', side = o.side || '#d9dce4';
    K.shadow(g, x + 20, y + 6, w * 1.05, 18, 0.9);
    // left face
    S('path', { d: `M${x},${y} L${L.x},${L.y} L${L.x},${L.y - top} L${x},${y - top} Z`, fill: base, ...stroke(3) }, g);
    // right face
    S('path', { d: `M${x},${y} L${R.x},${R.y} L${R.x},${R.y - top} L${x},${y - top} Z`, fill: side, ...stroke(3) }, g);
    // roof
    S('path', { d: `M${x},${y - top} L${L.x},${L.y - top} L${L.x + d},${L.y - top - d * k} L${R.x},${R.y - top} Z`, fill: '#eceae5', ...stroke(3) }, g);
    if (o.stripe) S('path', { d: `M${L.x},${L.y - top + 10} L${x},${y - top + 10}`, stroke: o.stripe, 'stroke-width': 7 }, g);
    // windows
    const cols = o.cols || 3, rows = o.rows || Math.max(3, Math.floor(h / 46));
    const rnd = X.rand(o.seed || 3);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const fx = (c + 0.5) / cols, fy = 0.12 + r * (0.78 / rows);
      const lit = rnd() < (o.lit ?? 0.5);
      // left face window (parallelogram)
      const px = x - lw * (1 - fx * 0.92) - 2, py = y - lw * k * (1 - fx * 0.92) - top * (1 - fy) + 6;
      S('path', { d: `M${px},${py} l${lw / cols * 0.55},${lw / cols * 0.55 * k} l0,${top / rows * 0.5} l${-lw / cols * 0.55},${-lw / cols * 0.55 * k} Z`, fill: lit ? C.yellow : '#b9c6dc', stroke: C.ink, 'stroke-width': 1.5 }, g);
      const qx = x + d * (fx * 0.92) + 4, qy = y - d * k * (fx * 0.92) - top * (1 - fy) + 4;
      S('path', { d: `M${qx},${qy} l${d / cols * 0.55},${-d / cols * 0.55 * k} l0,${top / rows * 0.5} l${-d / cols * 0.55},${d / cols * 0.55 * k} Z`, fill: lit ? C.yellow2 : '#9fb0cc', stroke: C.ink, 'stroke-width': 1.5 }, g);
    }
    // door
    S('path', { d: `M${x - lw * 0.62},${y - lw * k * 0.62} l0,-46 l22,${22 * k} l0,46 Z`, fill: o.door || C.blue, ...stroke(2) }, g);
    // roof tank
    const rx = x - lw * 0.2 + d * 0.3, ry = y - top - d * k * 0.3 - 6;
    S('rect', { x: rx - 12, y: ry - 26, width: 24, height: 26, fill: '#c9c6c0', ...stroke(2) }, g);
    S('ellipse', { cx: rx, cy: ry - 26, rx: 12, ry: 5, fill: '#e2dfd9', ...stroke(2) }, g);
    if (o.label) {
      const pl = K.pill(g, rx, ry - 76, o.label, { size: 20, anchor: 'middle', padX: 12, padY: 12 });
      S('path', { d: `M${rx},${ry - 44} l0,16`, ...stroke(3) }, g);
      g.label = pl;
    }
    g.roof = { x: rx, y: ry - 60 };
    return g;
  };
  K.tree = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M0,0 L0,-26', ...stroke(3) }, g);
    S('circle', { cx: 0, cy: -38, r: 19, fill: C.tree, ...stroke(2.5) }, g);
    S('path', { d: 'M-10,-44 a10,10 0 0,1 12,-6', stroke: '#b9d6b4', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    return g;
  };
  /** Tiny walking figure for streets */
  K.walker = (p, x, y, s = 1, col = C.dark) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('circle', { cx: 0, cy: -44, r: 7, fill: C.skin2, ...stroke(2) }, g);
    S('path', { d: 'M-8,-36 L8,-36 L7,-14 L-7,-14 Z', fill: col, ...stroke(2) }, g);
    S('path', { d: 'M-4,-14 L-5,0 M4,-14 L5,0', ...stroke(3) }, g);
    return g;
  };

  // ------------------------------------------------------------------ the presenter (original character)
  /* "The admin": stocky woman engineer — big curly dark hair cloud, round glasses, mustard overshirt over a navy tee,
   * olive wide trousers, rust sneakers, a clipboard held at the hip. Static, as in the source (the narrator never
   * moves). Local coords: 200 x 716, feet at the bottom. */
  K.presenter = (p, x = 14, y = 590, s = 1) => {
    const g = G(p, { id: 'presenter', transform: `translate(${x} ${y}) scale(${s})` });
    const ink = stroke(3), thin = stroke(2);
    const skin = '#b97a55', skinS = '#9c6141', hair = '#2a1d19', hairL = '#4a3529';
    const shirt = '#e0a83e', shirtS = '#c38e2c', tee = '#26324f', pants = '#6b7a55', pantsS = '#56633f';
    S('ellipse', { cx: 100, cy: 712, rx: 92, ry: 9, fill: C.shadow }, g);
    // legs (wide trousers)
    S('path', { d: 'M58,372 L50,668 L96,668 L101,452 L106,668 L152,668 L144,372 Z', fill: pants, ...ink }, g);
    S('path', { d: 'M101,452 L106,668 L152,668 L148,520 Z', fill: pantsS, opacity: 0.55 }, g);
    S('path', { d: 'M74,420 L72,640 M128,430 L132,640', stroke: pantsS, 'stroke-width': 2.5, fill: 'none' }, g);
    S('path', { d: 'M50,652 L96,652 M106,652 L152,652', stroke: pantsS, 'stroke-width': 3 }, g);
    // sneakers
    S('path', { d: 'M46,664 L98,664 L100,690 C100,700 92,704 80,704 L30,704 C22,704 20,694 26,688 C34,682 44,678 46,664 Z', fill: C.red, ...ink }, g);
    S('path', { d: 'M104,664 L156,664 C158,678 168,682 176,688 C182,694 180,704 172,704 L120,704 C108,704 102,700 102,690 Z', fill: C.red, ...ink }, g);
    S('path', { d: 'M24,698 L100,698 M102,698 L178,698', stroke: '#fff', 'stroke-width': 7 }, g);
    S('path', { d: 'M24,696 L100,696 L100,704 L28,704 Z M102,696 L178,696 L174,704 L102,704 Z', fill: '#f4f1ec', ...thin }, g);
    S('path', { d: 'M60,672 l10,6 M66,668 l10,6 M130,672 l-10,6 M136,668 l-10,6', stroke: '#fff', 'stroke-width': 2.5 }, g);
    // torso: navy tee
    S('path', { d: 'M66,160 L134,160 L144,380 L56,380 Z', fill: tee, ...ink }, g);
    S('path', { d: 'M84,160 L100,196 L116,160', fill: skin, ...thin }, g);
    // lanyard + badge
    S('path', { d: 'M86,170 L98,268 M114,170 L102,268', stroke: C.blue, 'stroke-width': 4, fill: 'none' }, g);
    S('rect', { x: 88, y: 266, width: 24, height: 32, rx: 4, fill: '#fff', ...thin }, g);
    S('rect', { x: 93, y: 272, width: 14, height: 9, rx: 2, fill: C.blue }, g);
    S('path', { d: 'M93,287 l14,0 M93,292 l9,0', stroke: C.ink, 'stroke-width': 1.5 }, g);
    // overshirt (open), two halves
    S('path', { d: 'M66,156 L40,176 L30,300 L40,392 L84,392 L88,300 L82,178 Z', fill: shirt, ...ink }, g);
    S('path', { d: 'M134,156 L160,176 L170,300 L160,392 L116,392 L112,300 L118,178 Z', fill: shirt, ...ink }, g);
    S('path', { d: 'M134,156 L160,176 L170,300 L160,392 L140,392 Z', fill: shirtS, opacity: 0.7 }, g);
    S('path', { d: 'M66,156 L80,196 L74,206 L60,170 Z M134,156 L120,196 L126,206 L140,170 Z', fill: shirtS, ...thin }, g);
    S('rect', { x: 46, y: 228, width: 28, height: 24, rx: 3, fill: shirtS, ...thin }, g);
    S('path', { d: 'M46,236 l28,0', stroke: C.ink, 'stroke-width': 1.5 }, g);
    S('circle', { cx: 82, cy: 300, r: 3, fill: C.ink }, g);
    S('circle', { cx: 82, cy: 340, r: 3, fill: C.ink }, g);
    // left arm (viewer's left), hanging, rolled sleeve
    S('path', { d: 'M40,176 C28,200 24,250 24,290 L44,292 C46,256 50,220 56,196 Z', fill: shirt, ...ink }, g);
    S('path', { d: 'M22,284 L46,286 L46,302 L22,300 Z', fill: shirtS, ...thin }, g);
    S('path', { d: 'M26,300 C24,330 26,350 30,368 L44,368 C44,348 44,322 44,300 Z', fill: skin, ...ink }, g);
    S('path', { d: 'M28,366 C24,378 28,392 38,392 C48,392 50,380 46,366 Z', fill: skin, ...ink }, g);
    // right arm bent: holds clipboard against the hip
    S('path', { d: 'M160,176 C176,204 180,246 176,284 L156,282 C156,250 154,220 146,198 Z', fill: shirt, ...ink }, g);
    S('path', { d: 'M156,278 L178,280 L176,296 L154,294 Z', fill: shirtS, ...thin }, g);
    // clipboard (in front of the hip, tilted)
    const cb = G(g, { transform: 'rotate(-8 140 330)' });
    S('rect', { x: 108, y: 282, width: 74, height: 98, rx: 6, fill: '#a0703d', ...ink }, cb);
    S('rect', { x: 115, y: 294, width: 60, height: 80, rx: 2, fill: '#fff', ...thin }, cb);
    S('rect', { x: 130, y: 276, width: 30, height: 14, rx: 3, fill: '#8e9096', ...thin }, cb);
    S('path', { d: 'M122,308 l44,0 M122,320 l38,0 M122,332 l44,0 M122,344 l30,0', stroke: '#9aa3b5', 'stroke-width': 3 }, cb);
    S('path', { d: 'M122,356 l6,6 l12,-12', stroke: C.green, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' }, cb);
    // forearm + hand over the clipboard edge
    S('path', { d: 'M156,292 C160,316 162,330 166,344 L180,340 C178,324 178,308 176,294 Z', fill: skin, ...ink }, g);
    S('path', { d: 'M160,338 C156,350 162,360 172,358 C182,356 184,344 180,336 Z', fill: skin, ...ink }, g);
    // neck
    S('path', { d: 'M88,130 L88,162 L112,162 L112,130 Z', fill: skin, ...ink }, g);
    S('path', { d: 'M88,140 L112,150 L112,132 L88,132 Z', fill: skinS, opacity: 0.6 }, g);
    // hair back volume (curly cloud) behind head
    const curls = [[100, 18, 34], [66, 30, 30], [134, 30, 30], [48, 62, 27], [152, 62, 27], [46, 96, 24], [154, 96, 24], [56, 124, 20], [144, 124, 20], [82, 6, 24], [118, 6, 24]];
    curls.forEach(([cx, cy, r]) => S('circle', { cx, cy, r, fill: hair, ...ink }, g));
    curls.forEach(([cx, cy, r]) => S('circle', { cx, cy, r: r - 3, fill: hair }, g));
    // face
    S('ellipse', { cx: 63, cy: 98, rx: 8, ry: 12, fill: skin, ...ink }, g);
    S('ellipse', { cx: 137, cy: 98, rx: 8, ry: 12, fill: skin, ...ink }, g);
    S('path', { d: 'M66,78 C66,46 134,46 134,78 L134,104 C134,130 118,140 100,140 C82,140 66,130 66,104 Z', fill: skin, ...ink }, g);
    S('path', { d: 'M120,64 C130,74 134,88 132,108 C130,126 120,136 106,139 C122,128 126,104 120,64 Z', fill: skinS, opacity: 0.45 }, g);
    // fringe curls over the forehead
    [[78, 58, 15], [96, 52, 16], [114, 54, 15], [128, 64, 12], [70, 68, 11]].forEach(([cx, cy, r]) => S('circle', { cx, cy, r, fill: hair, ...ink }, g));
    S('path', { d: 'M86,44 a10,10 0 0,1 14,-6 M112,44 a9,9 0 0,1 12,2', stroke: hairL, 'stroke-width': 3, fill: 'none' }, g);
    // glasses
    S('circle', { cx: 85, cy: 96, r: 13, fill: '#eef3f8', 'fill-opacity': 0.35, ...stroke(2.6) }, g);
    S('circle', { cx: 115, cy: 96, r: 13, fill: '#eef3f8', 'fill-opacity': 0.35, ...stroke(2.6) }, g);
    S('path', { d: 'M98,95 L102,95 M72,94 L66,90 M128,94 L134,90', ...stroke(2.4) }, g);
    // eyes + brows
    S('circle', { cx: 86, cy: 97, r: 3.6, fill: C.ink }, g);
    S('circle', { cx: 114, cy: 97, r: 3.6, fill: C.ink }, g);
    S('path', { d: 'M76,78 q9,-5 18,0 M106,78 q9,-5 18,0', ...stroke(3) }, g);
    // nose, mouth
    S('path', { d: 'M100,102 q-4,10 1,13', stroke: skinS, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, g);
    S('path', { d: 'M90,124 q10,7 20,0', ...stroke(2.6), fill: 'none' }, g);
    S('circle', { cx: 74, cy: 114, r: 6, fill: '#d98f78', opacity: 0.45 }, g);
    S('circle', { cx: 126, cy: 114, r: 6, fill: '#d98f78', opacity: 0.45 }, g);
    // pencil tucked in the hair
    S('path', { d: 'M136,52 L160,26', stroke: C.yellow2, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    S('path', { d: 'M136,52 L160,26', ...stroke(1.6), fill: 'none' }, g);
    S('path', { d: 'M160,26 l5,-6', stroke: C.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    return g;
  };

  // ------------------------------------------------------------------ the mascot ("the site")
  /* A browser window on legs: tab bar with favicon + three dots, a page that carries the face, mitten hands, boots.
   * Face states: happy | grin | worried | shock | sad | sleep | dizzy | wink.  m.face(t, state)  m.hat(t)  m.wave(t) */
  K.mascot = (p, x, y, s = 1, o = {}) => {
    const root = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const hov = G(root, {});
    const ph0 = (x * 0.013 + y * 0.007) % 6.28;
    X.every((t) => hov.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * Math.PI / 0.62 + ph0)) * (o.hover ?? 9)).toFixed(1)})`));
    const jit = G(hov, {}); jit.__cx = 0; jit.__cy = -100;
    const g = G(jit, {}); // animatable body (origin at feet)
    gsap.set(g, { svgOrigin: '0 0' });
    K.shadow(g, 0, 4, 70, 10);
    // legs + boots
    S('path', { d: 'M-24,-40 L-24,-12 M24,-40 L24,-12', ...stroke(7) }, g);
    S('path', { d: 'M-42,0 C-42,-12 -34,-16 -20,-16 L-12,-16 L-12,0 Z M42,0 C42,-12 34,-16 20,-16 L12,-16 L12,0 Z', fill: C.dark, ...stroke(3) }, g);
    // arms (left static, right can wave)
    const armL = G(g, {});
    S('path', { d: 'M-70,-110 C-92,-96 -96,-78 -94,-64', fill: 'none', ...stroke(7) }, armL);
    S('circle', { cx: -94, cy: -60, r: 12, fill: '#fff', ...stroke(3) }, armL);
    const armR = G(g, {});
    S('path', { d: 'M70,-110 C92,-96 96,-78 94,-64', fill: 'none', ...stroke(7) }, armR);
    S('circle', { cx: 94, cy: -60, r: 12, fill: '#fff', ...stroke(3) }, armR);
    gsap.set(armR, { svgOrigin: '70 -110' });
    // body = window
    S('rect', { x: -70 + 5, y: -196 + 6, width: 140, height: 158, rx: 18, fill: C.shadow }, g);
    K.rrect(g, -70, -196, 140, 158, 18, '#fff', 3.5);
    S('path', { d: 'M-70,-162 L70,-162', ...stroke(3) }, g);
    S('path', { d: 'M-66.5,-163 L-66.5,-180 Q-66.5,-192.5 -54,-192.5 L54,-192.5 Q66.5,-192.5 66.5,-180 L66.5,-163 Z', fill: '#eceae6' }, g);
    [-52, -38, -24].forEach((cx) => S('circle', { cx, cy: -179, r: 4.5, fill: '#bdbab4' }, g));
    const fav = K.logo(g, 44, -179, 0.42);
    // page = face plate
    K.rrect(g, -56, -152, 112, 96, 14, '#1d2233', 3);
    S('path', { d: 'M-46,-140 q20,-6 40,0', stroke: '#3a4260', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    const faces = {};
    const F = (name) => (faces[name] = G(g, {}));
    const lit = '#bff1ff';
    const fs = (w) => ({ stroke: lit, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const eye = (pp, cx) => { S('circle', { cx, cy: -112, r: 10, fill: lit }, pp); S('circle', { cx: cx + 3, cy: -115, r: 3, fill: '#1d2233' }, pp); };
    let f = F('happy'); eye(f, -22); eye(f, 22); S('path', { d: 'M-14,-86 q14,12 28,0', fill: 'none', ...fs(4) }, f);
    f = F('grin'); S('path', { d: 'M-31,-108 q9,-11 18,0 M13,-108 q9,-11 18,0', fill: 'none', ...fs(5) }, f); S('path', { d: 'M-18,-92 q18,22 36,0 Z', fill: lit }, f);
    f = F('worried'); eye(f, -22); eye(f, 22); S('path', { d: 'M-16,-82 q8,-7 16,0 q8,7 16,0', fill: 'none', ...fs(3.5) }, f); S('path', { d: 'M-34,-134 l14,5 M34,-134 l-14,5', ...fs(3.5) }, f);
    S('path', { d: 'M62,-142 q8,12 0,16 q-8,-4 0,-16 Z', fill: '#8fd3f0', ...stroke(2) }, f);
    f = F('shock'); eye(f, -22); eye(f, 22); S('ellipse', { cx: 0, cy: -80, rx: 8, ry: 10, fill: lit }, f);
    f = F('sad'); eye(f, -22); eye(f, 22); S('path', { d: 'M-14,-78 q14,-12 28,0', fill: 'none', ...fs(4) }, f);
    f = F('sleep'); S('path', { d: 'M-31,-110 q9,8 18,0 M13,-110 q9,8 18,0', fill: 'none', ...fs(4.5) }, f); S('path', { d: 'M-6,-84 l12,0', ...fs(4) }, f);
    f = F('dizzy'); S('path', { d: 'M-30,-120 l16,16 M-14,-120 l-16,16 M14,-120 l16,16 M30,-120 l-16,16', ...fs(4.5) }, f); S('path', { d: 'M-14,-82 q7,-8 14,0 q7,8 14,0', fill: 'none', ...fs(3.5) }, f);
    f = F('wink'); eye(f, -22); S('path', { d: 'M13,-112 q9,-8 18,0', fill: 'none', ...fs(4.5) }, f); S('path', { d: 'M-14,-86 q14,12 28,0', fill: 'none', ...fs(4) }, f);
    S('circle', { cx: -40, cy: -90, r: 7, fill: C.salmon, opacity: 0.7 }, g);
    S('circle', { cx: 40, cy: -90, r: 7, fill: C.salmon, opacity: 0.7 }, g);
    // baker's hat (hidden until m.hat)
    const hat = G(g, {});
    S('path', { d: 'M-46,-196 L-44,-222 L44,-222 L46,-196 Z', fill: '#fff', ...stroke(3) }, hat);
    S('path', { d: 'M-44,-222 C-70,-226 -72,-262 -46,-264 C-44,-290 -10,-296 0,-276 C10,-296 44,-290 46,-264 C72,-262 70,-226 44,-222 Z', fill: '#fff', ...stroke(3) }, hat);
    S('rect', { x: -46, y: -214, width: 92, height: 12, fill: C.blue, ...stroke(2) }, hat);
    K.logo(hat, 0, -208, 0.3);
    gsap.set(hat, { autoAlpha: o.hat ? 1 : 0 });
    const state0 = o.face || 'happy';
    Object.entries(faces).forEach(([k, el]) => gsap.set(el, { autoAlpha: k === state0 ? 1 : 0 }));
    const m = { root, jit, g, armR, hat, faces, fav };
    m.face = (t, st) => { Object.entries(faces).forEach(([k, el]) => X.tl.set(el, { autoAlpha: k === st ? 1 : 0 }, t)); };
    m.hatOn = (t) => {
      gsap.set(hat, { autoAlpha: 0, y: -160 });
      X.tl.set(hat, { autoAlpha: 1 }, t);
      X.tl.to(hat, { y: 0, duration: 0.28, ease: 'power3.in' }, t);
      X.tl.to(g, { scaleY: 0.93, scaleX: 1.05, duration: 0.06 }, t + 0.28);
      X.tl.to(g, { scaleY: 1, scaleX: 1, duration: 0.25, ease: 'back.out(3)' }, t + 0.34);
      X.sfx(t + 0.28, 'boing', { gain: 0.3 });
    };
    m.wave = (t, n = 2) => {
      for (let i = 0; i < n; i++) {
        X.tl.to(armR, { rotation: -70, duration: 0.14, ease: 'power2.out' }, t + i * 0.32);
        X.tl.to(armR, { rotation: -40, duration: 0.14, ease: 'power2.inOut' }, t + i * 0.32 + 0.16);
      }
      X.tl.to(armR, { rotation: 0, duration: 0.18 }, t + n * 0.32);
    };
    m.armUp = (t) => X.tl.to(armR, { rotation: -60, duration: 0.18, ease: 'back.out(2)' }, t);
    m.armDown = (t) => X.tl.to(armR, { rotation: 0, duration: 0.18 }, t);
    m.hop = (t, h = 26) => {
      X.tl.to(g, { y: -h, duration: 0.14, ease: 'power2.out' }, t);
      X.tl.to(g, { y: 0, duration: 0.16, ease: 'power2.in' }, t + 0.14);
      X.tl.to(g, { scaleY: 0.92, scaleX: 1.05, duration: 0.05 }, t + 0.3);
      X.tl.to(g, { scaleY: 1, scaleX: 1, duration: 0.2, ease: 'back.out(3)' }, t + 0.35);
    };
    m.squash = (t) => {
      X.tl.to(g, { scaleY: 0.86, scaleX: 1.1, duration: 0.08 }, t);
      X.tl.to(g, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1,0.45)' }, t + 0.08);
    };
    m.tilt = (t, deg = 8) => {
      X.tl.to(g, { rotation: deg, duration: 0.2, ease: 'power2.out' }, t);
    };
    return m;
  };

  // ------------------------------------------------------------------ machines
  /** Black server box (front-oblique 3D): top face, front with label + display, side fan. x,y = front top-left. */
  K.serverBox = (p, x, y, w = 330, h = 170, o = {}) => {
    const g = G(p, {});
    const d = o.depth ?? 30;
    K.shadow(g, x + w / 2 + 10, y + h + 10, w * 0.62, 16, 0.9);
    S('path', { d: `M${x},${y} L${x + d},${y - d * 0.75} L${x + w + d},${y - d * 0.75} L${x + w},${y} Z`, fill: C.dark3, ...stroke(3) }, g);
    S('path', { d: `M${x + w},${y} L${x + w + d},${y - d * 0.75} L${x + w + d},${y + h - d * 0.75} L${x + w},${y + h} Z`, fill: '#0f1013', ...stroke(3) }, g);
    K.rrect(g, x, y, w, h, 6, C.dark, 3);
    S('rect', { x: x + w * 0.38, y: y - d * 0.42, width: w * 0.3, height: 7, rx: 3, fill: '#0b0b0e' }, g);
    K.mono(g, x + 22, y + 52, o.num || '01', { size: 20, weight: 500, fill: '#9a9ba2' });
    K.text(g, x + 56, y + 56, o.label || 'SERVER', { size: o.labelSize || 40, weight: 800, fill: '#fff', ls: 0.5 });
    const scr = K.rrect(g, x + 22, y + 74, w * 0.5, 54, 6, '#0a1821', 0, { stroke: '#2b3d4a', 'stroke-width': 2 });
    const disp = K.mono(g, x + 38, y + 110, o.disp ?? '- -', { size: 22, weight: 500, fill: C.cyan });
    // fan
    const fx = x + w * 0.8, fy = y + h * 0.52, fr = Math.min(48, h * 0.3);
    S('circle', { cx: fx, cy: fy, r: fr, fill: '#24262c', stroke: '#3c3e45', 'stroke-width': 3 }, g);
    const fan = G(g, {});
    for (let i = 0; i < 4; i++) S('path', { d: `M${fx},${fy} q${fr * 0.5},${-fr * 0.2} ${fr * 0.7},${-fr * 0.65}`, stroke: '#3e4c58', 'stroke-width': 6, fill: 'none', transform: `rotate(${i * 90} ${fx} ${fy})` }, fan);
    S('circle', { cx: fx, cy: fy, r: 6, fill: '#55606b' }, g);
    for (let i = 0; i < 3; i++) S('path', { d: `M${x + 22},${y + h - 30 + i * 8} l${w * 0.5},0`, stroke: '#34363d', 'stroke-width': 3 }, g);
    S('rect', { x: x - 12, y: y + h * 0.42, width: 14, height: 36, rx: 3, fill: C.dark2, ...stroke(2) }, g);
    // status LEDs
    const leds = [0, 1, 2].map((i) => S('circle', { cx: x + w - 28 - i * 18, cy: y + 20, r: 5, fill: '#3fd48a' }, g));
    if (o.spin !== false) X.every((t) => fan.setAttribute('transform', `rotate(${(t * (o.rpm || 220)) % 360} ${fx} ${fy})`));
    g.disp = disp; g.leds = leds; g.fan = fan; g.box = { x, y, w, h, d };
    return g;
  };
  /** Small server tower (for racks / load balancing) */
  K.miniServer = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    K.shadow(g, 6, 4, 72, 10);
    S('path', { d: 'M-60,-150 L-48,-162 L72,-162 L60,-150 Z', fill: C.dark3, ...stroke(3) }, g);
    S('path', { d: 'M60,-150 L72,-162 L72,-12 L60,0 Z', fill: '#0f1013', ...stroke(3) }, g);
    K.rrect(g, -60, -150, 120, 150, 6, C.dark, 3);
    for (let i = 0; i < 3; i++) {
      K.rrect(g, -46, -136 + i * 44, 92, 34, 4, '#2a2c33', 0);
      S('circle', { cx: 30, cy: -119 + i * 44, r: 5, fill: o.sick ? (i === 0 ? C.red : '#555') : '#3fd48a' }, g);
      S('path', { d: `M-36,${-119 + i * 44} l40,0`, stroke: '#4a4d56', 'stroke-width': 4 }, g);
    }
    if (o.label) K.pill(g, 0, 14, o.label, { anchor: 'middle', size: 18, padX: 10, padY: 10 });
    return g;
  };
  K.crane = (p, y, x0, x1, o = {}) => { // truss rail with zigzag, black end cap, trolley + hook block
    const g = G(p, {});
    S('rect', { x: x0 + 6, y: y + 8, width: x1 - x0, height: 26, fill: C.shadow }, g);
    S('rect', { x: x0, y, width: x1 - x0, height: 26, fill: '#f3ead0', ...stroke(3) }, g);
    let d = '';
    for (let xx = x0 + 12; xx < x1 - 12; xx += 26) d += `M${xx},${y + 22} L${xx + 13},${y + 4} L${xx + 26},${y + 22} `;
    S('path', { d, stroke: C.crane, 'stroke-width': 4, fill: 'none' }, g);
    S('path', { d: `M${x0},${y + 4} L${x1},${y + 4} M${x0},${y + 22} L${x1},${y + 22}`, stroke: '#c9a64a', 'stroke-width': 2 }, g);
    K.rrect(g, x0 - 14, y - 6, 22, 38, 4, C.dark, 3);
    const trolley = G(g, {});
    const tx = o.tx ?? (x0 + x1) / 2;
    K.rrect(trolley, tx - 22, y + 24, 44, 16, 4, C.dark, 2);
    const cable = S('path', { d: `M${tx - 6},${y + 40} L${tx - 6},${y + 60} M${tx + 6},${y + 40} L${tx + 6},${y + 60}`, ...stroke(3) }, trolley);
    const hook = G(trolley, {});
    K.rrect(hook, tx - 20, y + 58, 40, 34, 6, C.orange, 3);
    S('path', { d: `M${tx - 10},${y + 66} l20,18`, ...stroke(3) }, hook);
    g.trolley = trolley; g.cable = cable; g.hook = hook; g.tx = tx;
    return g;
  };
  /** Browser / chat window card. Returns {g, body:{x,y,w,h}} */
  K.window = (p, x, y, w, h, title = 'crumbwell.shop', o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 7, y: y + 9, width: w, height: h, rx: 18, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 18, '#fff', 3);
    S('path', { d: `M${x},${y + 52} L${x + w},${y + 52}`, ...stroke(2.5) }, g);
    K.logo(g, x + 34, y + 27, 0.55);
    K.text(g, x + 58, y + 36, title, { size: 22, weight: 600, fill: C.ink });
    S('circle', { cx: x + w - 26, cy: y + 26, r: 6, fill: o.dot || C.green }, g);
    if (o.addr) {
      K.rrect(g, x + 18, y + 66, w - 36, 46, 23, '#f1efea', 2);
      g.addrIcon = G(g, {});
      g.addr = K.text(g, x + 50, y + 97, '', { size: 24, weight: 500, font: K.F.mono, fill: C.ink });
    }
    g.body = { x, y: y + (o.addr ? 120 : 52), w, h: h - (o.addr ? 120 : 52) };
    return g;
  };
  /** Dark terminal card ("● DNS RECORD"), returns {g, lines[]} */
  K.terminal = (p, x, y, w, h, title, o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 7, y: y + 9, width: w, height: h, rx: 14, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 14, '#17181d', 3);
    S('circle', { cx: x + 26, cy: y + 30, r: 6, fill: C.red }, g);
    K.mono(g, x + 42, y + 37, title, { size: 20, weight: 600, fill: '#e9e7e2', ls: 1.5 });
    if (o.ver) K.mono(g, x + w - 22, y + 37, o.ver, { size: 18, weight: 500, fill: '#8d8e94', anchor: 'end' });
    S('path', { d: `M${x + 16},${y + 54} L${x + w - 16},${y + 54}`, stroke: '#33353c', 'stroke-width': 2 }, g);
    g.lines = [];
    for (let i = 0; i < (o.n || 4); i++) g.lines.push(K.mono(g, x + 26, y + 98 + i * 40, '', { size: o.size || 27, weight: 500, fill: '#f2f0ea' }));
    g.cursor = S('rect', { x: x + 26, y: y + 74, width: 3, height: 30, fill: C.red }, g);
    /** type a line with the cursor riding the end of the text */
    g.typeLine = (i, str, t, cps = 40, sfx = true) => {
      const el = g.lines[i], o2 = { n: 0 }, ly = y + 98 + i * 40 - 24;
      el.textContent = '';
      X.tl.to(o2, { n: str.length, duration: str.length / cps, ease: 'none', onUpdate: () => {
        el.textContent = str.slice(0, Math.round(o2.n));
        g.cursor.setAttribute('x', x + 30 + (el.textContent ? el.getComputedTextLength() : 0));
        g.cursor.setAttribute('y', ly);
      } }, t);
      if (sfx) for (let k = 0; k < str.length; k += 3) X.sfx(t + k / cps, 'type', { gain: 0.12, pitch: 0.9 + ((k * 7) % 5) / 10 });
      return t + str.length / cps;
    };
    X.every((t) => g.cursor.setAttribute('opacity', Math.floor(t * 2.5) % 2 ? 0.2 : 1));
    return g;
  };
  K.keyboard = (p, x, y, w = 300) => {
    const g = G(p, {});
    S('rect', { x: x + 6, y: y + 8, width: w, height: 96, rx: 12, fill: C.shadow }, g);
    K.rrect(g, x, y, w, 96, 12, '#2a2b31', 3);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) {
      if (r === 2 && c > 8) continue;
      S('rect', { x: x + 14 + c * ((w - 28) / 11), y: y + 12 + r * 24, width: (w - 28) / 11 - 5, height: 18, rx: 3, fill: (r === 1 && c === 6) ? C.red : '#45474f' }, g);
    }
    S('rect', { x: x + 60, y: y + 12 + 3 * 24 - 2, width: w - 120, height: 10, rx: 3, fill: '#45474f' }, g);
    return g;
  };
  /** Database cylinder with a rows counter */
  K.db = (p, x, y, w, h, o = {}) => {
    const g = G(p, {});
    const ry = w * 0.16;
    K.shadow(g, x + w / 2 + 8, y + h + 6, w * 0.62, 14);
    S('path', { d: `M${x},${y} L${x},${y + h} A${w / 2},${ry} 0 0,0 ${x + w},${y + h} L${x + w},${y} Z`, fill: o.fill || '#e9e6e0', ...stroke(3) }, g);
    for (let i = 1; i < 3; i++) S('path', { d: `M${x},${y + h * i / 3} A${w / 2},${ry} 0 0,0 ${x + w},${y + h * i / 3}`, fill: 'none', ...stroke(2.5) }, g);
    S('ellipse', { cx: x + w / 2, cy: y, rx: w / 2, ry, fill: '#f7f5f1', ...stroke(3) }, g);
    [0, 1, 2, 3].forEach((i) => S('circle', { cx: x + w / 2 - 30 + i * 20, cy: y, r: 4.5, fill: i === 2 ? '#aaa' : C.green }, g));
    if (o.label) g.label = K.mono(g, x + w / 2, y + h + ry * 0.6 + 8, o.label, { size: 22, weight: 600, anchor: 'middle', fill: C.ink });
    g.rows = [];
    for (let i = 0; i < 4; i++) g.rows.push(S('rect', { x: x + 24, y: y + 34 + i * 26, width: w - 48, height: 16, rx: 4, fill: i % 2 ? '#d6d3cc' : '#cfcbc3' }, g));
    return g;
  };
  K.doc = (p, x, y, w, h, o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 6, y: y + 7, width: w, height: h, rx: 6, fill: C.shadow }, g);
    S('path', { d: `M${x},${y} L${x + w - 26},${y} L${x + w},${y + 26} L${x + w},${y + h} L${x},${y + h} Z`, fill: '#fff', ...stroke(3) }, g);
    S('path', { d: `M${x + w - 26},${y} L${x + w - 26},${y + 26} L${x + w},${y + 26}`, fill: '#ebe8e2', ...stroke(2.5) }, g);
    if (o.title) K.text(g, x + 18, y + 40, o.title, { size: o.tsize || 22, weight: 700 });
    const n = o.lines ?? 5;
    for (let i = 0; i < n; i++) S('path', { d: `M${x + 18},${y + (o.title ? 66 : 40) + i * 22} l${(w - 50) * (0.6 + ((i * 37) % 40) / 100)},0`, stroke: '#c9c6c0', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    return g;
  };
  K.padlock = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const shackle = S('path', { d: 'M-22,-10 L-22,-36 A22,22 0 0,1 22,-36 L22,-10', fill: 'none', ...stroke(9) }, g);
    S('path', { d: 'M-22,-10 L-22,-36 A22,22 0 0,1 22,-36 L22,-10', fill: 'none', stroke: o.metal || '#b9bcc4', 'stroke-width': 4 }, g);
    K.rrect(g, -38, -14, 76, 62, 10, o.fill || C.green, 3);
    S('circle', { cx: 0, cy: 12, r: 8, fill: C.ink }, g);
    S('path', { d: 'M0,14 l0,16', ...stroke(5) }, g);
    g.shackle = shackle;
    return g;
  };
  K.shield = (p, x, y, s = 1, fill = C.blue) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M0,-70 L56,-50 L54,4 C50,40 26,62 0,74 C-26,62 -50,40 -54,4 L-56,-50 Z', fill, ...stroke(3.5) }, g);
    S('path', { d: 'M0,-58 L44,-42 L42,4 C38,32 20,50 0,60 Z', fill: '#fff', opacity: 0.18 }, g);
    return g;
  };
  K.check = (p, x, y, r = 16, fill = C.green) => {
    const g = G(p, {});
    S('circle', { cx: x, cy: y, r, fill, stroke: '#fff', 'stroke-width': 2 }, g);
    S('path', { d: `M${x - r * 0.45},${y} l${r * 0.32},${r * 0.34} l${r * 0.6},${-r * 0.62}`, stroke: '#fff', 'stroke-width': r * 0.24, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    return g;
  };
  K.cross = (p, x, y, r = 16, fill = C.red) => {
    const g = G(p, {});
    S('circle', { cx: x, cy: y, r, fill, stroke: '#fff', 'stroke-width': 2 }, g);
    S('path', { d: `M${x - r * 0.38},${y - r * 0.38} l${r * 0.76},${r * 0.76} M${x + r * 0.38},${y - r * 0.38} l${-r * 0.76},${r * 0.76}`, stroke: '#fff', 'stroke-width': r * 0.24, 'stroke-linecap': 'round' }, g);
    return g;
  };
  /** Red rubber stamp, as in the source: big condensed caps, thick double rule, near-opaque paper fill, light ink
   *  speckle, rotated -6..-10 deg. Size it so it spans 55-85 % of the frame width. */
  K.stamp = (p, x, y, str, o = {}) => {
    if (!X.defs.querySelector('#stampInk')) {
      const f = S('filter', { id: 'stampInk', x: '-10%', y: '-10%', width: '120%', height: '120%' }, X.defs);
      S('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.75, numOctaves: 2, seed: 4, result: 'n' }, f);
      S('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.75', result: 'm' }, f);
      S('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in' }, f);
    }
    const size = o.size || 96, wt = 700;
    const font = o.font || 'Oswald, sans-serif';
    const tw = K.measure(str, size, wt, font, 3);
    const w = tw + 70, h = size * 1.18 + (o.sub ? 52 : 34);
    const outer = G(p, {});
    const rg = G(outer, { transform: `translate(${x} ${y}) rotate(${o.rot ?? -8})` });
    const col = o.color || C.red;
    S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 10, fill: o.fillBg || '#fdf6f1', opacity: o.fillOp ?? 0.93 }, rg);
    const g = G(rg, { filter: 'url(#stampInk)' });
    S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 10, fill: 'none', stroke: col, 'stroke-width': 9 }, g);
    S('rect', { x: -w / 2 + 13, y: -h / 2 + 13, width: w - 26, height: h - 26, rx: 5, fill: 'none', stroke: col, 'stroke-width': 3.5 }, g);
    K.text(g, 0, (o.sub ? -10 : 0) + size * 0.36, str, { font, size, weight: wt, fill: col, anchor: 'middle', ls: 3 });
    if (o.sub) K.mono(g, 0, h / 2 - 22, o.sub, { size: 17, weight: 600, fill: col, anchor: 'middle', ls: 2 });
    outer.inner = g;
    return outer;
  };

  // ------------------------------------------------------------------ the layer stack
  /** Mini stack card: rows bottom-up [{n:'01', label:'SERVER'}...]; base row dark; `fresh` index red.
   *  returns g with .rows (each row group), .addRow(t, i) slides a row in from the right. */
  K.stack = (p, x, y, w, layers, o = {}) => {
    const g = G(p, {});
    const rh = o.rh || 44, gap = o.gap ?? 6, size = o.size || 24;
    const n = layers.length;
    g.rows = [];
    g.checks = [];
    if (o.base !== false) K.shadow(g, x + w / 2, y + n * (rh + gap) + 6, w * 0.55, 10);
    layers.forEach((L, i) => {
      const ry = y + (n - 1 - i) * (rh + gap);
      const rg = G(g, {});
      const dark = i === 0, fresh = o.fresh === i;
      S('rect', { x: x + 4, y: ry + 5, width: w, height: rh, rx: 9, fill: C.shadow }, rg);
      const bgr = K.rrect(rg, x, ry, w, rh, 9, dark ? C.dark : fresh ? C.red : '#fff', 3);
      K.mono(rg, x + 18, ry + rh / 2 + size * 0.32, L.n, { size: size * 0.78, weight: 500, fill: dark || fresh ? '#d9d6d0' : '#9a978f' });
      const lab = K.text(rg, x + 18 + size * 1.6, ry + rh / 2 + size * 0.37, L.label, { size, weight: 800, fill: dark || fresh ? '#fff' : C.ink, ls: -0.3 });
      if (o.dots !== false) { S('circle', { cx: x + w - 18, cy: ry + rh / 2 - 7, r: 3, fill: dark || fresh ? '#ddd' : '#bbb' }, rg); S('circle', { cx: x + w - 18, cy: ry + rh / 2 + 7, r: 3, fill: dark || fresh ? '#ddd' : '#bbb' }, rg); }
      rg.bg = bgr; rg.lab = lab; rg.y = ry;
      g.rows.push(rg);
    });
    g.top = y;
    g.recolor = (t, i, fill, txt = '#fff') => {
      X.tl.set(g.rows[i].bg, { attr: { fill } }, t);
      X.tl.set(g.rows[i].lab, { attr: { fill: txt } }, t);
    };
    g.addCheck = (t, i, fill = C.green) => {
      const r = g.rows[i];
      const c = K.check(r, x + w - 44, r.y + rh / 2, rh * 0.36, fill);
      if (t != null) K.pop(c, t, { sfx: 'blip_up', gain: 0.2 });
      g.checks[i] = c;
      return c;
    };
    return g;
  };
  /** status bar under the stack */
  K.statusBar = (p, x, y, w, left, right, o = {}) => {
    const g = G(p, {});
    K.rrect(g, x, y, w, 40, 10, C.dark, 0);
    S('circle', { cx: x + 22, cy: y + 20, r: 6, fill: '#3fd48a' }, g);
    K.mono(g, x + 40, y + 27, left, { size: 19, weight: 600, fill: '#f0eee9', ls: 1 });
    g.right = K.mono(g, x + w - 18, y + 27, right, { size: 19, weight: 700, fill: o.rightFill || '#3fd48a', anchor: 'end', ls: 1 });
    return g;
  };

  // ------------------------------------------------------------------ pipeline
  K.conveyor = (p, x, y, w, stages = [], o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 8, y: y + 10, width: w, height: 70, rx: 10, fill: C.shadow }, g);
    K.rrect(g, x, y + 22, w, 58, 8, C.dark, 3);
    K.rrect(g, x - 4, y, w + 8, 22, 11, '#3a3c43', 3);
    const dashes = G(g, {});
    for (let xx = x + 20; xx < x + w - 20; xx += 34) S('rect', { x: xx, y: y + 8, width: 18, height: 6, rx: 3, fill: '#6b6e77' }, dashes);
    S('circle', { cx: x - 2, cy: y + 11, r: 14, fill: '#565963', ...stroke(3) }, g);
    S('circle', { cx: x + w + 2, cy: y + 11, r: 14, fill: '#565963', ...stroke(3) }, g);
    g.labels = stages.map((s, i) => {
      const sx = x + 30 + i * ((w - 60) / stages.length);
      const pl = K.pill(g, sx, y + 32, s, { size: 22, fill: '#2b2c33', padX: 12, padY: 14 });
      return pl;
    });
    g.light = (t, i, on = true) => {
      const r = g.labels[i].querySelector('rect');
      X.tl.set(r, { attr: { fill: on ? C.red : '#2b2c33' } }, t);
    };
    if (o.move !== false) X.every((t) => dashes.setAttribute('transform', `translate(${-((t * 90) % 34)} 0)`));
    return g;
  };
  /** Station arch over a belt (dark frame with a sign) */
  K.station = (p, x, y, w, h, sign, o = {}) => {
    const g = G(p, {});
    S('rect', { x, y, width: 16, height: h, fill: '#3a3c43', ...stroke(3) }, g);
    S('rect', { x: x + w - 16, y, width: 16, height: h, fill: '#3a3c43', ...stroke(3) }, g);
    K.rrect(g, x - 10, y - 40, w + 20, 52, 10, C.dark, 3);
    K.mono(g, x + w / 2, y - 6, sign, { size: o.size || 26, weight: 700, fill: '#fff', anchor: 'middle' });
    [0, 1, 2].forEach((i) => S('circle', { cx: x + 10 + i * 16, cy: y - 22, r: 4, fill: i === 0 ? C.red : '#666' }, g));
    return g;
  };

  // ------------------------------------------------------------------ people
  /** Bust figure (customer): head, cap or hair, torso; optional phone. Origin at bottom centre. */
  K.person = (p, x, y, s = 1, o = {}) => {
    const g0 = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const g = G(g0, {}); const php = (x * 0.021 + y * 0.011) % 6.28;
    if (o.bob !== 0) X.every((t) => g.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * Math.PI / 0.8 + php)) * (o.bob ?? 6)).toFixed(1)})`));
    const skin = o.skin || C.skin1, shirt = o.shirt || '#5b6b8c';
    S('path', { d: 'M-58,0 C-58,-50 -40,-70 0,-70 C40,-70 58,-50 58,0 Z', fill: shirt, ...stroke(3) }, g);
    S('path', { d: 'M-14,-70 L0,-52 L14,-70', fill: 'none', ...stroke(2.5) }, g);
    S('rect', { x: -10, y: -84, width: 20, height: 18, fill: skin, ...stroke(2.5) }, g);
    S('circle', { cx: 0, cy: -118, r: 38, fill: skin, ...stroke(3) }, g);
    if (o.hair !== false) {
      if (o.cap) {
        S('path', { d: 'M-38,-124 C-38,-162 38,-162 38,-124 Z', fill: o.cap, ...stroke(3) }, g);
        S('path', { d: 'M20,-126 L58,-122 L56,-114 L20,-118 Z', fill: o.cap, ...stroke(2.5) }, g);
      } else {
        S('path', { d: `M-39,-112 C-44,-150 -20,-162 2,-160 C26,-160 44,-146 39,-112 C34,-130 24,-136 0,-136 C-20,-136 -32,-130 -39,-112 Z`, fill: o.hairC || '#2a1d19', ...stroke(3) }, g);
      }
    }
    const eyes = G(g, {});
    S('circle', { cx: -13, cy: -116, r: 4, fill: C.ink }, eyes);
    S('circle', { cx: 13, cy: -116, r: 4, fill: C.ink }, eyes);
    const mouth = S('path', { d: o.frown ? 'M-9,-94 q9,-7 18,0' : 'M-9,-98 q9,7 18,0', fill: 'none', ...stroke(2.6) }, g);
    g.mouth = mouth;
    if (o.phone) {
      const ph = G(g, {});
      K.rrect(ph, 26, -78, 34, 58, 6, C.dark, 2.5);
      S('rect', { x: 30, y: -72, width: 26, height: 44, rx: 3, fill: '#eaf1fb' }, ph);
      S('path', { d: 'M18,-30 C26,-40 40,-40 46,-30 L40,-14 L20,-14 Z', fill: skin, ...stroke(2.5) }, ph);
      g.phone = ph;
    }
    if (o.box) { // parcel / bread bag held
      const b = G(g, {});
      K.rrect(b, -40, -56, 80, 56, 6, '#d9a066', 3);
      S('path', { d: 'M-40,-40 l80,0', ...stroke(2) }, b);
    }
    return g;
  };
  /** Crowd of small busts: rows across [x0,x1] from y upward. */
  K.crowd = (p, x0, x1, y, rows = 4, s = 0.42, seed = 9) => {
    const g = G(p, {});
    const rnd = X.rand(seed);
    const skins = [C.skin1, C.skin2, C.skin3, C.skin4, '#a8714e'];
    const shirts = ['#5b6b8c', '#b06a52', '#4a6bc4', '#4f9a6c', '#cfa45a', '#7a6690', '#4f8a8a', '#c07f92', '#45464d', '#d4a45e', '#8a8f99', '#6f7480'];
    const hairs = ['#2a1d19', '#5a3b22', '#b38b5d', '#1e1f24', '#8a4a2c'];
    const people = [];
    for (let r = 0; r < rows; r++) {
      const yy = y + r * 64 * s / 0.42;
      const step = 64 * s / 0.42 * 0.95;
      for (let xx = x0 + (r % 2) * step / 2; xx < x1; xx += step) {
        const bob = G(g, {}); const ph = rnd() * 6.28, per = 0.45 + rnd() * 0.3;
        X.every((t) => bob.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * Math.PI / per + ph)) * 9).toFixed(1)})`));
        const pp = K.person(bob, xx + (rnd() - 0.5) * 10, yy + (rnd() - 0.5) * 8, s * (0.92 + rnd() * 0.16), {
          skin: skins[(rnd() * skins.length) | 0], shirt: shirts[(rnd() * shirts.length) | 0],
          hairC: hairs[(rnd() * hairs.length) | 0], cap: rnd() < 0.2 ? shirts[(rnd() * shirts.length) | 0] : null, phone: rnd() < 0.35, bob: 0,
        });
        people.push(pp);
      }
    }
    g.people = people;
    return g;
  };

  // ------------------------------------------------------------------ props
  K.calendar = (p, x, y, top, big, o = {}) => {
    const g = G(p, {});
    const w = o.w || 190, h = o.h || 200;
    S('rect', { x: x + 6, y: y + 8, width: w, height: h, rx: 12, fill: C.shadow }, g);
    for (let i = 2; i > 0; i--) K.rrect(g, x + i * 3, y + i * 4, w, h, 12, '#fff', 2.5);
    K.rrect(g, x, y, w, h, 12, '#fff', 3);
    S('path', { d: `M${x + 1.5},${y + 54} L${x + 1.5},${y + 12} Q${x + 1.5},${y + 1.5} ${x + 12},${y + 1.5} L${x + w - 12},${y + 1.5} Q${x + w - 1.5},${y + 1.5} ${x + w - 1.5},${y + 12} L${x + w - 1.5},${y + 54} Z`, fill: o.head || C.red }, g);
    S('path', { d: `M${x},${y + 54} L${x + w},${y + 54}`, ...stroke(3) }, g);
    [0.3, 0.7].forEach((f) => S('rect', { x: x + w * f - 5, y: y - 14, width: 10, height: 28, rx: 5, fill: C.dark3, ...stroke(2) }, g));
    g.top = K.text(g, x + w / 2, y + 40, top, { size: 30, weight: 800, fill: '#fff', anchor: 'middle', ls: 1 });
    g.big = K.text(g, x + w / 2, y + 150, big, { size: o.bigSize || 92, weight: 900, anchor: 'middle', font: 'Oswald, sans-serif' });
    if (o.sub) g.sub = K.mono(g, x + w / 2, y + h - 14, o.sub, { size: 17, weight: 600, anchor: 'middle', fill: '#8d8a84' });
    return g;
  };
  K.clock = (p, x, y, r = 54, hm = [9, 0]) => {
    const g = G(p, {});
    [[-0.7, -1.05], [0.7, -1.05]].forEach(([a, b]) => S('circle', { cx: x + a * r, cy: y + b * r, r: r * 0.32, fill: C.dark, ...stroke(3) }, g));
    S('path', { d: `M${x - r * 0.6},${y + r * 0.8} l-12,18 M${x + r * 0.6},${y + r * 0.8} l12,18`, ...stroke(5) }, g);
    S('circle', { cx: x, cy: y, r, fill: '#fff', ...stroke(4) }, g);
    for (let i = 0; i < 12; i++) S('path', { d: `M${x},${y - r + 8} l0,7`, ...stroke(2.5), transform: `rotate(${i * 30} ${x} ${y})` }, g);
    const hh = S('path', { d: `M${x},${y} l0,${-r * 0.48}`, ...stroke(5), transform: `rotate(${(hm[0] % 12) * 30 + hm[1] / 2} ${x} ${y})` }, g);
    const mm = S('path', { d: `M${x},${y} l0,${-r * 0.72}`, ...stroke(3.5), transform: `rotate(${hm[1] * 6} ${x} ${y})` }, g);
    S('circle', { cx: x, cy: y, r: 5, fill: C.red }, g);
    g.hh = hh; g.mm = mm;
    return g;
  };
  K.gauge = (p, x, y, r = 70, o = {}) => {
    const g = G(p, {});
    K.card(g, x - r - 26, y - r - 50, r * 2 + 52, r + 112, { r: 16 });
    if (o.title) K.mono(g, x, y - r - 20, o.title, { size: 17, weight: 600, anchor: 'middle', fill: '#8d8a84' });
    const arc = (a0, a1, col) => {
      const p0 = [x + Math.cos(a0) * r, y + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, y + Math.sin(a1) * r];
      S('path', { d: `M${p0[0]},${p0[1]} A${r},${r} 0 0,1 ${p1[0]},${p1[1]}`, stroke: col, 'stroke-width': 16, fill: 'none' }, g);
    };
    arc(Math.PI, Math.PI * 1.33, C.green); arc(Math.PI * 1.33, Math.PI * 1.66, C.orange); arc(Math.PI * 1.66, Math.PI * 2, C.red);
    const needle = S('path', { d: `M${x},${y} L${x - r * 0.82},${y}`, ...stroke(5) }, g);
    S('circle', { cx: x, cy: y, r: 8, fill: C.ink }, g);
    gsap.set(needle, { svgOrigin: `${x} ${y}`, rotation: o.v0 ?? 20 });
    g.needle = needle;
    g.val = K.text(g, x, y + 46, o.text || '', { size: 34, weight: 800, anchor: 'middle', fill: o.valFill || C.red, font: 'Oswald, sans-serif' });
    return g;
  };
  K.bunting = (p, x0, x1, y, o = {}) => {
    const g = G(p, {});
    S('path', { d: `M${x0},${y} Q${(x0 + x1) / 2},${y + 26} ${x1},${y}`, fill: 'none', ...stroke(2.5) }, g);
    const n = o.n || 12, cols = o.cols || [C.navy, C.blue, '#fff'];
    g.flags = [];
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, xx = x0 + (x1 - x0) * f, yy = y + 26 * 4 * f * (1 - f) * 0.5 * 2;
      const fl = S('path', { d: `M${xx - 16},${yy} L${xx + 16},${yy} L${xx},${yy + 34} Z`, fill: cols[i % cols.length], ...stroke(2.5) }, g);
      g.flags.push(fl);
    }
    return g;
  };
  K.camera = (p, x, y, s = 1) => { // security camera on an arm
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M0,0 L0,-120 L40,-150', fill: 'none', ...stroke(6) }, g);
    const head = G(g, {});
    S('path', { d: 'M20,-176 L118,-144 L106,-112 L8,-144 Z', fill: '#fff', ...stroke(3) }, head);
    S('path', { d: 'M118,-144 L134,-138 L124,-110 L106,-112 Z', fill: C.dark, ...stroke(3) }, head);
    S('circle', { cx: 34, cy: -158, r: 5, fill: C.red }, head);
    gsap.set(head, { svgOrigin: '40 -150' });
    g.head = head;
    return g;
  };
  K.panel = (p, x, y, w, h, title, o = {}) => {
    const g = K.card(p, x, y, w, h, { r: 14 });
    K.mono(g, x + 20, y + 36, title, { size: 22, weight: 700, ls: 1 });
    if (o.sub) K.mono(g, x + 20 + K.measure(title, 22, 700, K.F.mono, 1) + 14, y + 36, o.sub, { size: 16, weight: 500, fill: '#9a978f' });
    if (o.dot) S('circle', { cx: x + w - 24, cy: y + 28, r: 6, fill: o.dot }, g);
    g.inner = { x: x + 20, y: y + 56, w: w - 40, h: h - 70 };
    return g;
  };
  K.van = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    K.shadow(g, 0, 4, 120, 10);
    const body = o.fill || C.crane;
    S('path', { d: 'M-118,-10 L-118,-110 L40,-110 L40,-10 Z', fill: body, ...stroke(3) }, g);
    S('path', { d: 'M40,-10 L40,-84 L84,-84 L112,-52 L112,-10 Z', fill: body, ...stroke(3) }, g);
    S('path', { d: 'M50,-76 L80,-76 L100,-54 L50,-54 Z', fill: '#cfe3f3', ...stroke(2.5) }, g);
    [-80, 70].forEach((wx) => { S('circle', { cx: wx, cy: -8, r: 18, fill: C.dark, ...stroke(3) }, g); S('circle', { cx: wx, cy: -8, r: 7, fill: '#aaa' }, g); });
    if (o.label) K.text(g, -40, -54, o.label, { size: 30, weight: 900, anchor: 'middle', fill: o.labelFill || C.ink, font: 'Oswald, sans-serif' });
    if (o.icon) o.icon(g);
    return g;
  };
  K.tyre = (p, x, y, r = 30) => {
    const g = G(p, {});
    S('circle', { cx: x, cy: y, r, fill: C.dark, ...stroke(3) }, g);
    S('circle', { cx: x, cy: y, r: r * 0.45, fill: '#9ea2aa', ...stroke(2) }, g);
    for (let i = 0; i < 8; i++) S('path', { d: `M${x},${y - r + 3} l0,8`, stroke: '#444', 'stroke-width': 3, transform: `rotate(${i * 45} ${x} ${y})` }, g);
    return g;
  };
  K.loaf = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-44,10 C-50,-24 -24,-38 0,-38 C24,-38 50,-24 44,10 Z', fill: '#d79a55', ...stroke(3) }, g);
    S('path', { d: 'M-24,-18 l12,-12 M-6,-14 l14,-14 M12,-8 l12,-12', stroke: '#9c6331', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    S('path', { d: 'M-30,-26 q10,-8 22,-8', stroke: '#f1c48c', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    return g;
  };
  K.photo = (p, x, y, w = 110, h = 84, seed = 1) => { // image card (cinnamon roll photo)
    const g = G(p, {});
    S('rect', { x: x + 4, y: y + 5, width: w, height: h, rx: 6, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 6, '#f6e7d4', 2.5);
    const cx = x + w / 2, cy = y + h / 2 + 4;
    S('circle', { cx, cy, r: h * 0.32, fill: '#c98a4e', ...stroke(2) }, g);
    S('path', { d: `M${cx},${cy} m-4,0 a4,4 0 1,1 8,0 a9,9 0 1,1 -18,0 a14,14 0 1,1 28,0`, fill: 'none', stroke: '#8a4f22', 'stroke-width': 3 }, g);
    S('path', { d: `M${x + 8},${y + 12} l16,0`, stroke: '#d8c3a8', 'stroke-width': 4 }, g);
    return g;
  };
  K.globe = (p, cx, cy, r) => { // stylised globe: ocean disc + blobby continents + graticule
    const g = G(p, {});
    K.shadow(g, cx, cy + r + 16, r * 0.8, 14);
    S('circle', { cx, cy, r, fill: '#e2eaf3', ...stroke(3.5) }, g);
    const clip = S('clipPath', { id: 'globeclip' + ((cx | 0) + (cy | 0)) }, X.defs);
    S('circle', { cx, cy, r: r - 2 }, clip);
    const land = G(g, { 'clip-path': `url(#${clip.id})` });
    const blob = (d) => S('path', { d, fill: '#c8dabf', ...stroke(2.5), transform: `translate(${cx} ${cy}) scale(${r / 200})` }, land);
    blob('M-150,-90 C-120,-140 -40,-150 -20,-110 C-10,-80 -60,-60 -70,-30 C-80,0 -110,10 -120,-20 C-140,-40 -170,-60 -150,-90 Z');
    blob('M-80,10 C-50,0 -30,30 -40,70 C-48,110 -70,150 -86,120 C-96,90 -110,40 -80,10 Z');
    blob('M10,-120 C40,-150 120,-140 150,-100 C170,-70 130,-60 100,-50 C80,-40 60,-60 40,-50 C20,-40 0,-80 10,-120 Z');
    blob('M20,-40 C50,-50 80,-30 76,10 C72,50 50,80 34,60 C20,40 0,0 20,-40 Z');
    blob('M100,60 C130,50 170,60 166,90 C160,120 120,124 104,104 C94,90 90,70 100,60 Z');
    for (let i = -2; i <= 2; i++) S('ellipse', { cx, cy, rx: r * Math.abs(i) / 3, ry: r, fill: 'none', stroke: '#9fb7d3', 'stroke-width': 1.5, opacity: 0.7 }, g);
    for (let i = -2; i <= 2; i++) S('path', { d: `M${cx - Math.sqrt(Math.max(0, r * r - (i * r / 3) ** 2))},${cy + i * r / 3} L${cx + Math.sqrt(Math.max(0, r * r - (i * r / 3) ** 2))},${cy + i * r / 3}`, stroke: '#9fb7d3', 'stroke-width': 1.5, opacity: 0.7 }, g);
    S('circle', { cx, cy, r, fill: 'none', ...stroke(3.5) }, g);
    return g;
  };
  K.pin = (p, x, y, col = C.red, label) => {
    const g = G(p, {});
    S('path', { d: `M${x},${y} C${x - 10},${y - 18} ${x - 18},${y - 26} ${x - 18},${y - 38} A18,18 0 1,1 ${x + 18},${y - 38} C${x + 18},${y - 26} ${x + 10},${y - 18} ${x},${y} Z`, fill: col, ...stroke(3) }, g);
    S('circle', { cx: x, cy: y - 38, r: 7, fill: '#fff' }, g);
    if (label) K.pill(g, x, y - 102, label, { anchor: 'middle', size: 18, padX: 10, padY: 10 });
    return g;
  };
  K.envelope = (p, x, y, w = 150, h = 96, o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 5, y: y + 6, width: w, height: h, rx: 6, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 6, o.fill || '#f6efe2', 3);
    S('path', { d: `M${x},${y} L${x + w / 2},${y + h * 0.56} L${x + w},${y}`, fill: 'none', ...stroke(3) }, g);
    if (o.seal) { S('circle', { cx: x + w / 2, cy: y + h * 0.56, r: 15, fill: C.red, ...stroke(2.5) }, g); }
    return g;
  };
  K.papers = (p, cx, cy, n, t, o = {}) => { // flying sheets burst
    const g = G(p, {});
    const rnd = X.rand(o.seed || 5);
    for (let i = 0; i < n; i++) {
      const sh = G(g, {});
      S('rect', { x: -16, y: -21, width: 32, height: 42, rx: 2, fill: '#fff', ...stroke(2) }, sh);
      S('path', { d: 'M-9,-10 l18,0 M-9,-2 l14,0 M-9,6 l18,0', stroke: '#bbb', 'stroke-width': 2 }, sh);
      const a = rnd() * Math.PI * 2, d = (o.dist || 380) * (0.4 + rnd() * 0.8);
      gsap.set(sh, { x: cx, y: cy, rotation: rnd() * 90, scale: 0.4 + rnd() * 0.6, opacity: 0 });
      X.tl.set(sh, { opacity: 1 }, t);
      X.tl.to(sh, { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d + 120, rotation: rnd() * 720 - 360, duration: (o.dur || 1.4) * (0.7 + rnd() * 0.6), ease: 'power2.out' }, t);
    }
    return g;
  };
  /** Halftone wipe: black dots grow from (ox,oy) to full cover, then shrink away from the centre. */
  K.halftone = (t, dur = 0.5, o = {}) => {
    const g = G(K.top, { id: 'halftone' });
    const pitch = 40, R = pitch * 0.75;
    const dots = [];
    for (let y = pitch / 2; y < X.H + pitch; y += pitch) for (let x = (Math.round(y / pitch) % 2) * pitch / 2; x < X.W + pitch; x += pitch)
      dots.push([S('circle', { cx: x, cy: y, r: 0, fill: o.fill || '#111' }, g), x, y]);
    const ox = o.ox ?? X.W * 0.72, oy = o.oy ?? X.H * 0.32, maxD = Math.hypot(X.W, X.H);
    const tin = dur * 0.43, thold = dur * 0.08, tout = dur * 0.49;
    gsap.set(g, { autoAlpha: 0 });
    X.tl.set(g, { autoAlpha: 1 }, t);
    X.tl.set(g, { autoAlpha: 0 }, t + dur);
    X.every((tt) => {
      if (tt < t || tt > t + dur) return;
      const u = tt - t;
      for (const [c, x, y] of dots) {
        const dd = Math.hypot(x - ox, y - oy) / maxD;
        let r;
        // radius follows sqrt(progress) so the covered AREA (and the luminance) changes linearly, frame by frame
        if (u < tin) r = Math.sqrt(Math.max(0, Math.min(1, (u / tin) * 1.3 - dd * 0.3))) * R;
        else if (u < tin + thold) r = R;
        else r = Math.sqrt(Math.max(0, Math.min(1, 1 - (((u - tin - thold) / tout) * 1.3 - (1 - dd) * 0.3)))) * R;
        c.setAttribute('r', r.toFixed(1));
      }
    });
    X.sfx(t, 'whoosh', { gain: 0.5, dur: 0.5 });
    return g;
  };

  // ------------------------------------------------------------------ more props
  K.excl = (p, x, y, r = 22, fill = C.red, ch = '!') => {
    const g = G(p, {});
    S('circle', { cx: x, cy: y, r, fill, ...stroke(3) }, g);
    K.text(g, x, y + r * 0.42, ch, { size: r * 1.25, weight: 900, fill: '#fff', anchor: 'middle' });
    return g;
  };
  K.qmark = (p, x, y, size = 46, fill = C.ink) => { const g = G(p, {}); K.text(g, x, y, '?', { size, weight: 900, fill, anchor: 'middle' }); return g; };
  K.tv = (p, x, y, w = 200, h = 140) => {
    const g = G(p, {});
    S('path', { d: `M${x + w * 0.35},${y - 40} L${x + w / 2},${y} L${x + w * 0.65},${y - 40}`, fill: 'none', ...stroke(3) }, g);
    S('rect', { x: x + 6, y: y + 8, width: w, height: h, rx: 16, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 16, C.dark2, 3);
    K.rrect(g, x + 14, y + 14, w - 60, h - 28, 8, '#cfe3f3', 2.5);
    [0, 1].forEach((i) => S('circle', { cx: x + w - 24, cy: y + 34 + i * 30, r: 7, fill: '#666' }, g));
    S('path', { d: `M${x + 30},${y + h} l-10,18 M${x + w - 30},${y + h} l10,18`, ...stroke(4) }, g);
    g.screen = { x: x + 14, y: y + 14, w: w - 60, h: h - 28 };
    return g;
  };
  K.mug = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M24,-50 C50,-50 50,-14 24,-14', fill: 'none', ...stroke(6) }, g);
    K.rrect(g, -30, -64, 60, 64, 8, '#fff', 3);
    S('rect', { x: -30, y: -46, width: 60, height: 12, fill: C.red }, g);
    S('path', { d: 'M-10,-74 q-8,-10 0,-20 q8,-10 0,-20 M8,-74 q-8,-10 0,-20 q8,-10 0,-20', stroke: '#bbb', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
    return g;
  };
  K.hdd = (p, x, y, s = 1) => { // hard disk, top view
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('rect', { x: -66, y: -86, width: 140, height: 180, rx: 12, fill: C.shadow }, g);
    K.rrect(g, -70, -90, 140, 180, 12, '#c9ccd3', 3);
    S('circle', { cx: 0, cy: -16, r: 52, fill: '#e9ebef', ...stroke(3) }, g);
    S('circle', { cx: 0, cy: -16, r: 10, fill: '#9aa0aa', ...stroke(2) }, g);
    S('path', { d: 'M44,62 L18,6', ...stroke(7) }, g);
    S('circle', { cx: 46, cy: 66, r: 9, fill: '#7d838e', ...stroke(2) }, g);
    [-50, 50].forEach((xx) => [-74, 74].forEach((yy) => S('circle', { cx: xx, cy: yy, r: 4, fill: '#8d929c' }, g)));
    g.crack = S('path', { d: 'M-30,-60 L-8,-30 L-22,-8 L6,16 L-6,40 L16,70', fill: 'none', stroke: C.red, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    return g;
  };
  K.bell = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-34,20 C-30,10 -30,-6 -28,-20 C-24,-44 24,-44 28,-20 C30,-6 30,10 34,20 Z', fill: C.orange, ...stroke(3) }, g);
    S('path', { d: 'M-40,20 L40,20', ...stroke(5) }, g);
    S('circle', { cx: 0, cy: 30, r: 9, fill: C.orange, ...stroke(3) }, g);
    S('circle', { cx: 0, cy: -44, r: 6, fill: C.orange, ...stroke(3) }, g);
    return g;
  };
  K.moon = (p, x, y, r = 40) => {
    const g = G(p, {});
    S('path', { d: `M${x + r * 0.2},${y - r} A${r},${r} 0 1,0 ${x + r},${y + r * 0.35} A${r * 0.8},${r * 0.8} 0 1,1 ${x + r * 0.2},${y - r} Z`, fill: C.yellow, ...stroke(3) }, g);
    return g;
  };
  K.wifi = (p, x, y, s = 1, col = C.ink) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    g.arcs = [];
    [18, 36, 54].forEach((r) => g.arcs.push(S('path', { d: `M${-r * 0.75},${-r * 0.66} A${r},${r} 0 0,1 ${r * 0.75},${-r * 0.66}`, fill: 'none', stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round' }, g)));
    S('circle', { cx: 0, cy: 0, r: 7, fill: col }, g);
    return g;
  };
  /** Hooded eavesdropper bust */
  K.snoop = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-62,0 C-62,-56 -40,-76 0,-76 C40,-76 62,-56 62,0 Z', fill: '#4b4f5c', ...stroke(3) }, g);
    S('path', { d: 'M-46,-104 C-50,-170 50,-170 46,-104 C46,-80 30,-66 0,-66 C-30,-66 -46,-80 -46,-104 Z', fill: '#4b4f5c', ...stroke(3) }, g);
    S('ellipse', { cx: 0, cy: -112, rx: 30, ry: 34, fill: C.skin2, ...stroke(2.5) }, g);
    S('path', { d: 'M-30,-122 C-24,-150 24,-150 30,-122 C20,-134 -20,-134 -30,-122 Z', fill: '#4b4f5c' }, g);
    S('path', { d: 'M-18,-114 l10,0 M8,-114 l10,0', ...stroke(4) }, g);
    S('path', { d: 'M-8,-92 q8,-4 16,0', fill: 'none', ...stroke(2.5) }, g);
    return g;
  };
  K.magnifier = (p, x, y, r = 56) => {
    const g = G(p, {});
    S('path', { d: `M${x + r * 0.7},${y + r * 0.7} L${x + r * 1.5},${y + r * 1.5}`, ...stroke(14) }, g);
    S('path', { d: `M${x + r * 0.7},${y + r * 0.7} L${x + r * 1.5},${y + r * 1.5}`, stroke: '#7a4b2a', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    S('circle', { cx: x, cy: y, r, fill: '#eaf4ff', 'fill-opacity': 0.55, ...stroke(6) }, g);
    S('path', { d: `M${x - r * 0.5},${y - r * 0.3} a${r * 0.6},${r * 0.6} 0 0,1 ${r * 0.4},${-r * 0.3}`, stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    return g;
  };
  K.ticket = (p, x, y, str, o = {}) => {
    const g = G(p, {});
    const w = o.w || 190, h = 64;
    S('rect', { x: x + 4, y: y + 5, width: w, height: h, rx: 8, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 8, '#fff', 3);
    S('rect', { x: x + 1.5, y: y + 1.5, width: 22, height: h - 3, rx: 6, fill: o.stub || C.red }, g);
    K.mono(g, x + 34, y + 28, str, { size: 20, weight: 700 });
    if (o.sub) K.mono(g, x + 34, y + 51, o.sub, { size: 16, weight: 500, fill: '#8d8a84' });
    return g;
  };
  K.halo = (p, cx, cy, r, fill = C.salmon) => S('circle', { cx, cy, r, fill, opacity: 0.7 }, p);
  K.sparkle = (p, x, y, s = 1, fill = C.red) => S('path', { d: `M${x},${y - 14 * s} L${x + 4 * s},${y - 4 * s} L${x + 14 * s},${y} L${x + 4 * s},${y + 4 * s} L${x},${y + 14 * s} L${x - 4 * s},${y + 4 * s} L${x - 14 * s},${y} L${x - 4 * s},${y - 4 * s} Z`, fill }, p);
  K.heart = (p, x, y, s = 1, fill = C.red) => S('path', { d: `M${x},${y + 12 * s} C${x - 22 * s},${y - 2 * s} ${x - 14 * s},${y - 22 * s} ${x},${y - 10 * s} C${x + 14 * s},${y - 22 * s} ${x + 22 * s},${y - 2 * s} ${x},${y + 12 * s} Z`, fill, ...stroke(2) }, p);
  K.funnel = (p, x, y, w = 170, label = 'INBOX') => {
    const g = G(p, {});
    S('path', { d: `M${x},${y} L${x + w},${y} L${x + w * 0.62},${y + 90} L${x + w * 0.62},${y + 130} L${x + w * 0.38},${y + 130} L${x + w * 0.38},${y + 90} Z`, fill: '#f1efea', ...stroke(3) }, g);
    K.pill(g, x + w / 2, y - 46, label, { anchor: 'middle', size: 18, padX: 10, padY: 10 });
    return g;
  };
  K.eyesOn = (p, x, y, s = 1) => { // googly eyes for suspects
    const g = G(p, {});
    [-1, 1].forEach((k) => { S('circle', { cx: x + k * 16 * s, cy: y, r: 12 * s, fill: '#fff', ...stroke(2.5) }, g); S('circle', { cx: x + k * 16 * s + 3 * s, cy: y + 2 * s, r: 5 * s, fill: C.ink }, g); });
    return g;
  };
  // ------------------------------------------------------------------ event density (the source's constant small changes)
  /** Dark answer/status bubble (the product "talks"): pops from its tail in 4 f, then the text types in. */
  K.say = (p, x, y, str, t, o = {}) => {
    const g = G(p, {});
    const size = o.size || 28, wt = o.weight || 700;
    const lines = Array.isArray(str) ? str : [str];
    const tw = Math.max(...lines.map((l) => K.measure(l, size, wt)));
    const w = tw + 48, h = lines.length * size * 1.25 + 28;
    const fill = o.fill || C.dark, col = o.color || '#fff';
    const tx = o.tail === 'right' ? w - 40 : o.tail === 'left' ? 34 : w / 2;
    S('rect', { x: x + 5, y: y + 6, width: w, height: h, rx: 18, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 18, fill, 3);
    if (o.tail !== 'none') {
      S('path', { d: `M${x + tx - 12},${y + h - 2} L${x + tx},${y + h + 18} L${x + tx + 12},${y + h - 2} Z`, fill, ...stroke(3) }, g);
      S('rect', { x: x + tx - 10, y: y + h - 7, width: 20, height: 7, fill }, g);
    }
    const els = lines.map((l, i) => K.text(g, x + 24, y + 14 + size * 0.95 + i * size * 1.25, '', { size, weight: wt, fill: col, font: o.font }));
    K.pop(g, t, { origin: `${tx}px ${h + 18}px`, sfx: o.sfx ?? 'bubble', gain: 0.22 });
    let tt = t + 0.08;
    lines.forEach((l, i) => { tt = K.type(els[i], l, tt, o.cps || 48, i === 0); });
    if (o.out != null) K.popOut(g, o.out, 0.1);
    g.w = w; g.h = h;
    return g;
  };
  /** A stream of items travelling a path (messages on a wire, parcels on a belt, photos across the planet):
   *  n items, one every `period` s from t0, each taking `travel` s; path(u) -> [x, y]; pure function of t. */
  K.stream = (p, n, make, path, t0, period, travel, o = {}) => {
    const items = [];
    for (let i = 0; i < n; i++) { const it = G(p, { opacity: 0 }); make(it, i); items.push(it); }
    const ease = o.ease || ((u) => u * u * (3 - 2 * u));
    X.every((t) => items.forEach((it, i) => {
      const u = (t - (t0 + i * period)) / travel;
      if (u < 0 || u > 1 || (o.until != null && t > o.until)) { it.setAttribute('opacity', 0); return; }
      const [x, y] = path(ease(u), i);
      const sc = o.scale ? o.scale(u) : 1;
      it.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})`);
      it.setAttribute('opacity', o.fade ? Math.min(1, (1 - u) * 6, u * 8).toFixed(2) : 1);
    }));
    for (let i = 0; i < n; i++) if (o.sfx !== false && i % 2 === 0) X.sfx(t0 + i * period, o.sfx || 'swoosh', { gain: 0.1, pitch: 1 + (i % 3) * 0.08 });
    return items;
  };
  /** A number that keeps changing (meters, counters, live stats): one value every 0.1 s between t0 and t1. */
  K.flicker = (el, t0, t1, fmt) => X.every((t) => {
    if (t < t0 || t > t1) return;
    el.textContent = fmt(Math.floor((t - t0) * 10), (t - t0) / Math.max(0.001, t1 - t0));
  });
  /** A run of small chips/rows that pop one after another (the source's cascades: vector chips, log lines). */
  K.cascade = (els, t, step = 0.12, o = {}) => els.forEach((e, i) => K.pop(e, t + i * step, { sfx: i % 2 ? false : (o.sfx || 'blip'), gain: 0.14, pitch: 1 + i * 0.06 }));
})();
