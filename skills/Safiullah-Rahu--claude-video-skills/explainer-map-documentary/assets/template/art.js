/* Illustrated "gallery prints" and "archival plates" for the map-documentary sample (all original drawings).
 * A.engravingPolder(svg, w, h)  — ink engraving of a windmill on a dike (framed print in the gallery)
 * A.planPrint(svg, w, h, kind)  — small framed plan drawings (side walls)
 * A.flood(g, X) / A.breach(g, X) — full-frame 1920×1080 black-and-white archival-style plates (K.archival wraps them)
 */
(function () {
  const A = (window.A = {});
  const s = (tag, at, p) => K.s(tag, at, p);
  const INK = '#2a251f';

  /** hatch lines clipped to a shape */
  function hatch(svg, defs, clipD, { gap = 4, ang = 0, w = 0.7, color = INK, op = 1, box }) {
    const id = K.uid('hc');
    const cp = s('clipPath', { id }, defs); s('path', { d: clipD }, cp);
    const g = s('g', { 'clip-path': `url(#${id})`, opacity: op }, svg);
    const [x0, y0, x1, y1] = box;
    const L = Math.hypot(x1 - x0, y1 - y0);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const gg = s('g', { transform: `rotate(${ang} ${cx} ${cy})` }, g);
    for (let y = cy - L / 2; y < cy + L / 2; y += gap) s('line', { x1: cx - L / 2, y1: y, x2: cx + L / 2, y2: y, stroke: color, 'stroke-width': w }, gg);
    return g;
  }

  A.engravingPolder = (svg, w, h) => {
    const defs = s('defs', {}, svg);
    const r = K.X.rand(11);
    const hz = h * 0.6;
    s('rect', { x: 0, y: 0, width: w, height: h, fill: '#ede6d4' }, svg);
    // sky: horizontal engraving lines, thinning toward the horizon, gaps for clouds
    const sky = s('g', {}, svg);
    for (let y = 6; y < hz - 4; y += 3.2) {
      let x = 4;
      while (x < w - 4) {
        const seg = 18 + r() * 70, gap = (y < hz * 0.5 && r() < 0.35) ? 10 + r() * 40 : 1 + r() * 3;
        s('line', { x1: x, y1: y, x2: Math.min(w - 4, x + seg), y2: y, stroke: INK, 'stroke-width': (0.75 - 0.45 * y / hz).toFixed(2), opacity: 0.8 }, sky);
        x += seg + gap;
      }
    }
    // far shore: tree clumps, a spire
    const far = s('g', { fill: INK }, svg);
    for (let x = 0; x < w; x += 7 + r() * 9) s('ellipse', { cx: x, cy: hz - 3, rx: 4 + r() * 6, ry: 2 + r() * 4 }, far);
    s('path', { d: `M${w * 0.18},${hz} L${w * 0.18},${hz - 26} L${w * 0.185},${hz - 40} L${w * 0.19},${hz - 26} L${w * 0.19},${hz}Z` }, far);
    s('rect', { x: 0, y: hz - 1.2, width: w, height: 1.6 }, far);
    // fields: converging ditches to a vanishing point
    const vp = [w * 0.55, hz];
    const fields = s('g', { stroke: INK, 'stroke-width': 0.8 }, svg);
    for (let k = -14; k <= 14; k++) s('line', { x1: vp[0] + k * 2, y1: hz + 1, x2: vp[0] + k * 70, y2: h, opacity: 0.75 }, fields);
    for (let k = 1; k < 10; k++) { const y = hz + Math.pow(k / 10, 2.2) * (h - hz); s('line', { x1: 0, y1: y, x2: w, y2: y, 'stroke-width': 0.5, opacity: 0.6 }, fields); }
    // dike + canal in front
    const dikeD = `M0,${h * 0.78} L${w * 0.62},${h * 0.66} L${w},${h * 0.7} L${w},${h * 0.8} L${w * 0.62},${h * 0.74} L0,${h * 0.9}Z`;
    s('path', { d: dikeD, fill: '#ede6d4' }, svg);
    hatch(svg, defs, dikeD, { gap: 2.4, ang: -12, w: 0.7, box: [0, h * 0.6, w, h] });
    const canalD = `M0,${h * 0.9} L${w * 0.62},${h * 0.74} L${w},${h * 0.8} L${w},${h} L0,${h}Z`;
    s('path', { d: canalD, fill: '#ede6d4' }, svg);
    hatch(svg, defs, canalD, { gap: 3.4, ang: 0, w: 0.6, op: 0.8, box: [0, h * 0.7, w, h] });
    // windmill on the dike
    const mx = w * 0.64, my = h * 0.665;
    const body = `M${mx - 16},${my} L${mx - 10},${my - 62} L${mx + 10},${my - 62} L${mx + 16},${my}Z`;
    s('path', { d: body, fill: '#ede6d4', stroke: INK, 'stroke-width': 1 }, svg);
    hatch(svg, defs, `M${mx + 1},${my} L${mx + 3},${my - 62} L${mx + 10},${my - 62} L${mx + 16},${my}Z`, { gap: 1.6, ang: 90, w: 0.6, box: [mx - 20, my - 70, mx + 20, my] });
    s('path', { d: `M${mx - 12},${my - 62} Q${mx},${my - 80} ${mx + 12},${my - 62}Z`, fill: INK }, svg);
    s('rect', { x: mx - 3, y: my - 14, width: 6, height: 14, fill: INK }, svg);
    const hub = [mx, my - 66];
    const sails = s('g', { stroke: INK, fill: 'none' }, svg);
    [25, 115, 205, 295].forEach((a) => {
      const rad = a * Math.PI / 180, L = 58;
      const ex = hub[0] + Math.cos(rad) * L, ey = hub[1] + Math.sin(rad) * L;
      s('line', { x1: hub[0], y1: hub[1], x2: ex, y2: ey, 'stroke-width': 1.4 }, sails);
      const nx = -Math.sin(rad) * 9, ny = Math.cos(rad) * 9;
      const p0 = [hub[0] + Math.cos(rad) * 12, hub[1] + Math.sin(rad) * 12];
      s('path', { d: `M${p0[0]},${p0[1]} L${ex},${ey} L${ex + nx},${ey + ny} L${p0[0] + nx},${p0[1] + ny}Z`, 'stroke-width': 0.7 }, sails);
      for (let k = 1; k < 8; k++) { const q = 12 + k * 6.4; const ax = hub[0] + Math.cos(rad) * q, ay = hub[1] + Math.sin(rad) * q; s('line', { x1: ax, y1: ay, x2: ax + nx, y2: ay + ny, 'stroke-width': 0.6 }, sails); }
    });
    // reflection in the canal
    s('path', { d: `M${mx - 14},${h * 0.79} L${mx - 9},${h * 0.79 + 40} L${mx + 9},${h * 0.79 + 40} L${mx + 14},${h * 0.79}Z`, fill: INK, opacity: 0.35 }, svg);
    s('rect', { x: 3, y: 3, width: w - 6, height: h - 6, fill: 'none', stroke: INK, 'stroke-width': 1.2 }, svg);
  };

  /** simple framed drawings for the side walls: 'section' | 'plan' | 'grid' */
  A.planPrint = (svg, w, h, kind = 'plan') => {
    s('rect', { x: 0, y: 0, width: w, height: h, fill: '#ece5d3' }, svg);
    const g = s('g', { stroke: INK, fill: 'none', 'stroke-width': 1 }, svg);
    if (kind === 'section') {
      s('path', { d: `M0,${h * 0.6} L${w * 0.3},${h * 0.6} L${w * 0.42},${h * 0.3} L${w * 0.55},${h * 0.3} L${w * 0.66},${h * 0.7} L${w},${h * 0.7}` }, g);
      s('path', { d: `M0,${h * 0.45} L${w * 0.36},${h * 0.45}`, 'stroke-dasharray': '4 3' }, g);
      for (let x = 4; x < w * 0.35; x += 5) s('line', { x1: x, y1: h * 0.45, x2: x, y2: h * 0.6, opacity: 0.4 }, g);
    } else if (kind === 'grid') {
      for (let k = 1; k < 8; k++) { s('line', { x1: k * w / 8, y1: 8, x2: k * w / 8, y2: h - 8, opacity: 0.6 }, g); s('line', { x1: 8, y1: k * h / 8, x2: w - 8, y2: k * h / 8, opacity: 0.6 }, g); }
      s('circle', { cx: w * 0.5, cy: h * 0.5, r: Math.min(w, h) * 0.28, 'stroke-width': 1.6 }, g);
    } else {
      s('path', { d: `M${w * 0.1},${h * 0.85} C${w * 0.2},${h * 0.4} ${w * 0.5},${h * 0.6} ${w * 0.55},${h * 0.15} L${w * 0.9},${h * 0.2} L${w * 0.85},${h * 0.9}Z` }, g);
      for (let k = 0; k < 9; k++) s('line', { x1: w * 0.3 + k * 8, y1: h * 0.4, x2: w * 0.3 + k * 8 + 30, y2: h * 0.85, opacity: 0.5 }, g);
    }
    s('rect', { x: 3, y: 3, width: w - 6, height: h - 6, fill: 'none', stroke: INK, 'stroke-width': 1.1 }, svg);
  };

  // ---------------------------------------------------------------- archival-style plates (greys; K.archival tones them)
  function sky(g, X, id, top, hor, hz, seed) {
    const gr = X.linear(K.uid(id), [[0, top], [1, hor]]);
    s('rect', { x: 0, y: 0, width: 1920, height: hz + 4, fill: gr }, g);
    const blur = K.uid('cb');
    const f = s('filter', { id: blur, x: '-30%', y: '-50%', width: '160%', height: '200%' }, X.defs);
    s('feGaussianBlur', { stdDeviation: 26 }, f);
    const r = X.rand(seed);
    const cl = s('g', { filter: `url(#${blur})` }, g);
    for (let i = 0; i < 16; i++) {
      const v = 70 + Math.floor(r() * 120);
      s('ellipse', { cx: r() * 2100 - 90, cy: 60 + r() * (hz - 140), rx: 160 + r() * 360, ry: 30 + r() * 70, fill: `rgb(${v},${v},${v - 4})`, opacity: 0.55 + r() * 0.4 }, cl);
    }
    return cl;
  }
  function house(g, x, y, sc, { roof = '#2a2927', wall = '#77746d', depth = 0.55 } = {}) {
    // half-submerged farmhouse: steep roof + gable; y = waterline
    const G = s('g', { transform: `translate(${x} ${y}) scale(${sc})` }, g);
    s('path', { d: 'M-150,0 L-150,-40 L-70,-40 L-70,0Z', fill: wall }, G);
    s('path', { d: 'M-160,-38 L-110,-130 L-60,-38Z', fill: '#5f5c56' }, G);
    s('path', { d: 'M-110,-130 L150,-118 L190,-30 L-60,-38Z', fill: roof }, G);
    s('path', { d: 'M-110,-130 L150,-118', stroke: '#9a978f', 'stroke-width': 3 }, G);
    s('rect', { x: 60, y: -150, width: 16, height: 30, fill: '#222' }, G);
    s('rect', { x: -128, y: -30, width: 22, height: 22, fill: '#1c1b1a' }, G);
    for (let k = 0; k < 9; k++) s('line', { x1: -100 + k * 28, y1: -127 + k * 1.3, x2: -60 + k * 28, y2: -37, stroke: '#3b3a37', 'stroke-width': 1.5 }, G);
    // reflection
    const R = s('g', { transform: 'scale(1,-1)', opacity: depth }, G);
    s('path', { d: 'M-110,-130 L150,-118 L190,-30 L-60,-38Z', fill: roof }, R);
    s('path', { d: 'M-160,-38 L-110,-130 L-60,-38Z', fill: '#4a4843' }, R);
    return G;
  }
  function poplar(g, x, y, h, c = '#2d2d2a') {
    s('rect', { x: x - 2, y: y - h * 0.4, width: 4, height: h * 0.4, fill: c }, g);
    s('ellipse', { cx: x, cy: y - h * 0.62, rx: h * 0.12, ry: h * 0.36, fill: c }, g);
    s('ellipse', { cx: x, cy: y + h * 0.4, rx: h * 0.1, ry: h * 0.3, fill: c, opacity: 0.3 }, g);
  }

  A.flood = (g, X, t0 = 0) => {
    const hz = 520;
    const clouds = sky(g, X, 'fsky', '#5d5d5a', '#c4c3bc', hz, 21);
    const far = s('g', { fill: '#3e3e3b' }, g);
    const r = X.rand(5);
    for (let x = -20; x < 1940; x += 18 + r() * 40) s('ellipse', { cx: x, cy: hz - 4, rx: 10 + r() * 26, ry: 5 + r() * 12 }, far);
    s('path', { d: `M1440,${hz} L1440,${hz - 70} L1449,${hz - 118} L1458,${hz - 70} L1458,${hz}Z` }, far);
    // water: sky reflection gradient + ripples
    const wg = X.linear(K.uid('fw'), [[0, '#b5b4ad'], [0.35, '#8c8b85'], [1, '#3e3e3a']]);
    s('rect', { x: 0, y: hz, width: 1920, height: 1080 - hz, fill: wg }, g);
    const rip = s('g', { stroke: '#d6d5ce', 'stroke-linecap': 'round' }, g);
    const rips = [];
    for (let i = 0; i < 120; i++) {
      const y = hz + 6 + Math.pow(r(), 1.6) * 540, len = 20 + (y - hz) * 0.35 * r();
      rips.push(s('line', { x1: 0, y1: y, x2: len, y2: y, 'stroke-width': 0.6 + (y - hz) / 300, opacity: 0.15 + r() * 0.35, 'data-x': r() * 1920, 'data-v': 4 + r() * 10 }, rip));
    }
    poplar(g, 1210, hz + 18, 120); poplar(g, 1250, hz + 22, 140); poplar(g, 1290, hz + 20, 110);
    house(g, 1600, hz + 30, 0.55, { depth: 0.4 });
    house(g, 760, hz + 130, 1.25, { depth: 0.45 });
    // fence posts receding
    for (let k = 0; k < 9; k++) { const x = 150 + k * 52 + k * k * 3, y = 1010 - k * 52, hh = 70 - k * 6; s('rect', { x, y: y - hh, width: 12 - k, height: hh, fill: '#262523' }, g); s('rect', { x, y, width: 12 - k, height: hh * 0.5, fill: '#262523', opacity: 0.3 }, g); }
    // rowing boat with two silhouettes
    const b = s('g', { transform: `translate(420 ${hz + 120})` }, g);
    s('path', { d: 'M-70,0 Q0,22 80,0 L70,-10 L-62,-10Z', fill: '#1f1e1c' }, b);
    s('path', { d: 'M-20,-10 L-22,-46 Q-14,-60 -6,-46 L-8,-10Z', fill: '#1f1e1c' }, b);
    s('circle', { cx: -14, cy: -58, r: 8, fill: '#1f1e1c' }, b);
    s('path', { d: 'M24,-10 L22,-38 Q30,-50 38,-38 L36,-10Z', fill: '#1f1e1c' }, b);
    s('circle', { cx: 30, cy: -50, r: 7, fill: '#1f1e1c' }, b);
    s('line', { x1: -10, y1: -30, x2: -90, y2: 18, stroke: '#1f1e1c', 'stroke-width': 4 }, b);
    K.on((t) => {
      for (const l of rips) { const x = (+l.dataset.x + t * +l.dataset.v) % 2000 - 40; l.setAttribute('transform', `translate(${x.toFixed(1)} 0)`); }
      clouds.setAttribute('transform', `translate(${(-(t - t0) * 34).toFixed(1)} 0)`);
      b.setAttribute('transform', `translate(${(420 + (t - t0) * 9).toFixed(1)} ${(hz + 120 + Math.sin(t * 1.7) * 2).toFixed(1)})`);
    });
  };

  A.breach = (g, X, t0 = 0) => {
    const hz = 395;
    const clouds = sky(g, X, 'bsky', '#3a3a38', '#8f8e87', hz, 33);
    const r = X.rand(8);
    const crestY = (x) => 700 - (x + 100) * 180 / 960;          // near dike crest (left of the breach)
    // the sea behind the dike, higher than the land, with drifting whitecaps
    const seaG = X.linear(K.uid('bs'), [[0, '#55554f'], [1, '#2c2c29']]);
    s('path', { d: `M-100,${hz} L2000,${hz} L2000,402 L1060,486 L860,520 L-100,700Z`, fill: seaG }, g);
    const caps = s('g', { stroke: '#d8d7cf', 'stroke-linecap': 'round' }, g);
    const capEls = Array.from({ length: 70 }, () => { const y = hz + 6 + r() * 120; return s('line', { x1: 0, y1: y, x2: 10 + r() * 30, y2: y, 'stroke-width': 1 + r() * 2, opacity: 0.25 + r() * 0.4, 'data-x': r() * 2000, 'data-v': 20 + r() * 40 }, caps); });
    // flooded polder in front (reflects the sky)
    const polG = X.linear(K.uid('bp'), [[0, '#9a9992'], [1, '#3a3a36']]);
    s('path', { d: 'M-100,905 L880,600 L1045,560 L2000,450 L2000,1080 L-100,1080Z', fill: polG }, g);
    // dike bodies: grassy land-side slope, pale crest road
    const slope = X.linear(K.uid('bd'), [[0, '#5e5c55'], [1, '#2e2d29']]);
    s('path', { d: 'M-100,700 L860,520 L885,604 L-100,905Z', fill: slope }, g);
    s('path', { d: 'M1060,486 L2000,402 L2000,452 L1045,562Z', fill: slope }, g);
    const grass = s('g', { stroke: '#6f6d65', 'stroke-width': 1.2, opacity: 0.6 }, g);
    for (let i = 0; i < 160; i++) { const x = -100 + r() * 960, y0 = crestY(x) + 8, y1 = y0 + (905 - 700) * (1 - (x + 100) / 1100) * (0.3 + r() * 0.6); s('line', { x1: x, y1: y0 + r() * 20, x2: x - 6, y2: y1, opacity: 0.3 + r() * 0.4 }, grass); }
    s('path', { d: 'M-100,700 L860,520', stroke: '#9c9a92', 'stroke-width': 7 }, g);
    s('path', { d: 'M1060,486 L2000,402', stroke: '#9c9a92', 'stroke-width': 5 }, g);
    // torn edges of the breach
    s('path', { d: 'M860,520 L872,548 L858,566 L885,604 L900,612 L846,600Z', fill: '#262522' }, g);
    s('path', { d: 'M1060,486 L1050,512 L1066,530 L1045,562 L1030,566 L1072,560Z', fill: '#262522' }, g);
    // telegraph poles on the crest + sagging wire
    const px = [40, 230, 420, 610, 790];
    px.forEach((x, i) => { const y = crestY(x); s('rect', { x, y: y - 120 + i * 14, width: 6 - i * 0.6, height: 120 - i * 14, fill: '#1d1c1a' }, g); s('rect', { x: x - 14 + i * 2, y: y - 112 + i * 14, width: 34 - i * 4, height: 3, fill: '#1d1c1a' }, g); });
    for (let i = 0; i < px.length - 1; i++) { const a = [px[i] + 3, crestY(px[i]) - 118 + i * 14], b = [px[i + 1] + 3, crestY(px[i + 1]) - 118 + (i + 1) * 14]; s('path', { d: `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 + 22} ${b[0]},${b[1]}`, stroke: '#1d1c1a', 'stroke-width': 1.4, fill: 'none' }, g); }
    // the water pouring through the gap, fanning into the polder
    const tongue = X.linear(K.uid('bt'), [[0, '#cfcec6'], [1, '#7d7c75']]);
    s('path', { d: 'M862,522 L1058,488 L1046,562 L1180,700 L1420,1080 L420,1080 L760,760 L884,604Z', fill: tongue, opacity: 0.9 }, g);
    const streaks = [];
    for (let i = 0; i < 70; i++) streaks.push(s('path', { d: '', stroke: '#f2f1ea', 'stroke-width': 1 + r() * 3.5, opacity: 0.35 + r() * 0.5, fill: 'none', 'stroke-linecap': 'round', 'data-o': r(), 'data-k': r() }, g));
    // half-submerged farmhouse and a lone tree in the foreground
    house(g, 1580, 860, 0.95, { depth: 0.35 });
    poplar(g, 300, 980, 220, '#232320');
    const rain = s('g', { stroke: '#d4d4cc', 'stroke-width': 1.1, opacity: 0.32 }, g);
    const drops = Array.from({ length: 110 }, () => s('line', { x1: 0, y1: 0, x2: -14, y2: 46, 'data-x': r() * 2000, 'data-y': r() * 1080 }, rain));
    K.on((t) => {
      const u = t - t0;
      clouds.setAttribute('transform', `translate(${(u * 46).toFixed(1)} 0)`);
      for (const l of capEls) { const x = (+l.dataset.x - u * +l.dataset.v + 4000) % 2000 - 40; l.setAttribute('transform', `translate(${x.toFixed(1)} 0)`); }
      for (const p of streaks) {
        const o = (+p.dataset.o + u * 0.8) % 1, k = +p.dataset.k;
        const xa = 870 + k * 180, ya = 515 - k * 30;                  // gap mouth
        const xb = 560 + k * 760, yb = 1090;                          // fan edge
        const x0 = xa + (xb - xa) * o, y0 = ya + (yb - ya) * o, x1 = xa + (xb - xa) * Math.min(1, o + 0.12), y1 = ya + (yb - ya) * Math.min(1, o + 0.12);
        p.setAttribute('d', `M${x0.toFixed(1)},${y0.toFixed(1)}L${x1.toFixed(1)},${y1.toFixed(1)}`);
      }
      for (const d of drops) { const y = (+d.dataset.y + u * 900) % 1120 - 40, x = (+d.dataset.x - u * 280 + 4000) % 2000; d.setAttribute('transform', `translate(${x.toFixed(0)} ${y.toFixed(0)})`); }
    });
  };
})();
