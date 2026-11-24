/* kit-warm.js — additions for the emotional layer-stack variant ("What it really takes to bring a lost dog home").
 * Loaded after kit.js. Same flat 3 px ink-outline style, same canvas. Everything is seek-safe (pure functions of t).
 *   K.leashOn (presenter prop) · K.dog (Maple, original design) · K.rice · K.chip · K.chipMini · K.scanner · K.paw
 *   K.shelter · K.house · K.phone · K.drawer · K.fence · K.battery · K.satellite · K.recordCard · K.road        */
(function () {
  const C = K.C, S = K.S, G = K.G, stroke = K.stroke;
  // warm accents for this variant (canvas, ink, terracotta and caption colours are unchanged)
  Object.assign(C, {
    coat: '#cf9864', coatS: '#b37a47', cream: '#f4e6cc', teal: '#3e8a83', tealL: '#d3e9e4', brass: '#e2b54f',
    copper: '#c47f4a', glass: '#eef4f5', warmGreen: '#3c9a5f', sage: '#a9c4a0',
  });
  const ell = (cx, cy, rx, ry) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0 Z`;

  // ------------------------------------------------------------------ presenter prop: a leash in the right hand
  /** Drawn inside the presenter group (local coords 200x716) under the hand: a loop handle and a strap that hangs
   *  down beside the trousers to a brass clip. Same teal as Maple's collar. */
  K.leashOn = (g) => {
    const L = G(g, {});
    S('path', { d: 'M166,330 C150,338 152,372 170,372 C188,372 190,338 176,330', fill: 'none', stroke: C.ink, 'stroke-width': 11, 'stroke-linecap': 'round' }, L);
    S('path', { d: 'M166,330 C150,338 152,372 170,372 C188,372 190,338 176,330', fill: 'none', stroke: C.teal, 'stroke-width': 6, 'stroke-linecap': 'round' }, L);
    const strap = 'M172,372 C178,430 160,470 166,530 C170,566 160,590 150,612';
    S('path', { d: strap, fill: 'none', stroke: C.ink, 'stroke-width': 11, 'stroke-linecap': 'round' }, L);
    S('path', { d: strap, fill: 'none', stroke: C.teal, 'stroke-width': 6, 'stroke-linecap': 'round' }, L);
    S('rect', { x: 141, y: 610, width: 16, height: 26, rx: 5, fill: C.brass, ...stroke(2.5) }, L);
    S('circle', { cx: 149, cy: 642, r: 7, fill: 'none', stroke: C.ink, 'stroke-width': 3 }, L);
    return L;
  };

  // ------------------------------------------------------------------ Maple (original dog design)
  /* A small scruffy terrier mix, sitting, facing right: honey coat, cream bib and muzzle, one perked ear and one
   * floppy ear, a white blaze, a teal collar with a round brass tag. Origin = ground under her chest; ~280 px tall.
   * d.wag(t0, t1, amp, hz) · d.perk(t) · d.droop(t) · d.tilt(t, deg) · d.hop(t) · d.tagOff(t) · d.tagOn(t) · d.look(t, dx) */
  K.dog = (p, x, y, s = 1, o = {}) => {
    const root = G(p, { transform: `translate(${x} ${y}) scale(${(o.flip ? -1 : 1) * s} ${s})` });
    const breathe = G(root, {});
    const ph0 = (x * 0.017 + y * 0.009) % 6.28;
    const body = G(breathe, {});
    gsap.set(body, { svgOrigin: '0 0' });
    const coat = o.coat || C.coat, shade = o.shade || C.coatS, cream = C.cream;
    const ink = stroke(3);
    S('ellipse', { cx: 0, cy: 2, rx: 112, ry: 12, fill: C.shadow }, body);
    // tail (behind the haunch)
    const tail = G(body, {});
    S('path', { d: 'M-80,-50 C-104,-58 -124,-84 -116,-116 C-113,-127 -101,-125 -102,-113 C-104,-90 -92,-74 -72,-64 Z', fill: coat, ...ink }, tail);
    S('path', { d: 'M-116,-116 l-6,-6 M-110,-120 l-2,-8', ...stroke(2.5) }, tail);
    gsap.set(tail, { svgOrigin: '-78 -56' });
    // haunch + body
    S('path', { d: 'M-92,-4 C-108,-40 -100,-94 -54,-106 C-20,-114 8,-94 10,-60 C12,-30 2,-4 -20,-2 Z', fill: coat, ...ink }, body);
    S('path', { d: 'M-70,-96 l-4,-9 l9,3 l1,-9 l7,7', fill: 'none', ...stroke(2.5) }, body);
    S('path', { d: 'M-40,-98 C-36,-142 -6,-174 30,-178 C52,-180 68,-162 68,-140 C68,-100 58,-60 54,-10 L10,-6 C6,-40 -10,-72 -40,-98 Z', fill: coat, ...ink }, body);
    S('path', { d: 'M-36,-110 C-26,-130 -14,-140 -4,-146', fill: 'none', stroke: shade, 'stroke-width': 4, 'stroke-linecap': 'round' }, body);
    // cream bib with a scruffy edge
    S('path', { d: 'M44,-154 l-7,10 l6,4 l-8,12 l7,5 l-8,14 l7,6 l-7,16 l6,8 l-5,18 l5,10 l-4,22 L48,-12 C54,-50 64,-112 44,-154 Z', fill: cream, ...stroke(2.5) }, body);
    // back paw, legs, front paws
    S('ellipse', { cx: -8, cy: -7, rx: 28, ry: 10, fill: coat, ...ink }, body);
    S('path', { d: 'M-24,-12 l0,7 M-14,-14 l0,8', ...stroke(2) }, body);
    S('path', { d: 'M14,-74 L12,-8 L32,-8 L34,-74 Z', fill: shade, ...ink }, body);
    S('path', { d: 'M36,-84 L36,-8 L58,-8 L60,-84 Z', fill: coat, ...ink }, body);
    S('ellipse', { cx: 24, cy: -6, rx: 16, ry: 8, fill: shade, ...ink }, body);
    S('ellipse', { cx: 50, cy: -6, rx: 17, ry: 8, fill: cream, ...ink }, body);
    S('path', { d: 'M46,-12 l0,7 M54,-12 l0,7', ...stroke(2) }, body);
    // collar + tag
    const collar = G(body, {});
    S('path', { d: 'M16,-158 C34,-150 60,-148 74,-154 L76,-140 C60,-134 34,-136 14,-144 Z', fill: o.collar || C.teal, ...stroke(2.5) }, collar);
    const tag = G(collar, {});
    S('circle', { cx: 50, cy: -139, r: 4.5, fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, tag);
    S('circle', { cx: 50, cy: -124, r: 12, fill: C.brass, ...stroke(2.5) }, tag);
    S('path', { d: 'M44,-126 l12,0 M46,-120 l8,0', stroke: '#9b7a2a', 'stroke-width': 2 }, tag);
    gsap.set(tag, { svgOrigin: '50 -139' });
    if (o.tag === false) gsap.set(tag, { autoAlpha: 0 });
    // head
    const sway = G(body, {});
    const head = G(sway, {});
    gsap.set(head, { svgOrigin: '40 -172' });
    const earB = G(head, {});
    S('path', { d: 'M6,-226 L-6,-270 L32,-240 Z', fill: shade, ...ink }, earB);
    S('path', { d: 'M4,-234 L0,-254 L16,-240', fill: 'none', stroke: '#e8b98f', 'stroke-width': 3, 'stroke-linecap': 'round' }, earB);
    gsap.set(earB, { svgOrigin: '14 -232' });
    S('path', { d: 'M2,-212 C2,-246 34,-262 60,-252 C82,-244 92,-226 90,-206 C88,-186 72,-172 48,-170 C22,-168 2,-186 2,-212 Z', fill: coat, ...ink }, head);
    S('path', { d: 'M66,-252 C74,-240 80,-228 84,-216', fill: 'none', stroke: cream, 'stroke-width': 7, 'stroke-linecap': 'round' }, head);
    S('path', { d: 'M70,-222 C92,-228 118,-222 124,-206 C128,-194 118,-184 102,-182 C88,-180 76,-184 66,-190 Z', fill: cream, ...ink }, head);
    S('path', { d: 'M8,-190 l7,8 l4,-7 l7,10 l5,-8 l7,9 l5,-6', fill: 'none', stroke: shade, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, head);
    const mouth = S('path', { d: 'M120,-196 C112,-188 100,-188 94,-194', fill: 'none', ...stroke(2.6) }, head);
    const tongue = S('path', { d: 'M100,-191 C100,-180 110,-178 112,-188', fill: '#e48e86', ...stroke(2), opacity: o.tongue ? 1 : 0 }, head);
    S('path', { d: 'M114,-224 C122,-226 130,-220 128,-212 C126,-206 118,-205 112,-209 C108,-215 108,-221 114,-224 Z', fill: C.ink }, head);
    S('circle', { cx: 120, cy: -219, r: 2.2, fill: '#fff' }, head);
    const eyes = G(head, {});
    S('circle', { cx: 66, cy: -216, r: 7, fill: C.ink }, eyes);
    S('circle', { cx: 68.5, cy: -218.5, r: 2.4, fill: '#fff' }, eyes);
    gsap.set(eyes, { svgOrigin: '66 -216' });
    S('path', { d: 'M54,-232 l5,-7 l4,6 l6,-8 l3,8', fill: 'none', ...stroke(2.4) }, head);
    S('circle', { cx: 80, cy: -198, r: 6, fill: '#e8a48f', opacity: 0.5 }, head);
    const earF = G(head, {});
    S('path', { d: 'M22,-250 C32,-264 56,-262 58,-246 C60,-230 52,-212 40,-204 C32,-214 24,-232 22,-250 Z', fill: shade, ...ink }, earF);
    gsap.set(earF, { svgOrigin: '30 -250' });
    // idle life: breathing + a gentle tail sway; wag spans make it fast
    const spans = [];
    X.every((t) => {
      const br = Math.sin(t * 6.9 + ph0);
      breathe.setAttribute('transform', `translate(0 ${(br * (o.bob ?? 3.6)).toFixed(2)}) scale(1 ${(1 + br * 0.012).toFixed(4)})`);
      sway.setAttribute('transform', `rotate(${(Math.sin(t * 4.1 + ph0 * 1.7) * 2.6).toFixed(2)} 40 -172)`);
      let a = o.idle === false ? 0 : Math.sin(t * 8.2 + ph0) * 11, hz = 0;
      for (const [t0, t1, amp, f] of spans) if (t >= t0 && t <= t1) { const k = Math.min(1, (t - t0) / 0.15, (t1 - t) / 0.2); a = Math.sin((t - t0) * f * 6.283) * amp * k + 8 * k; hz = f; }
      tail.setAttribute('transform', `rotate(${a.toFixed(2)} -78 -56)`);
    });
    const d = { root, body, head, tail, tag, collar, earF, earB, eyes, mouth, tongue };
    d.wag = (t0, t1, amp = 20, hz = 4) => spans.push([t0, t1, amp, hz]);
    d.perk = (t) => { X.tl.to(earF, { rotation: -26, duration: 0.14, ease: 'back.out(3)' }, t); X.tl.to(earB, { rotation: -8, duration: 0.14, ease: 'back.out(3)' }, t); };
    d.relax = (t) => { X.tl.to([earF, earB], { rotation: 0, duration: 0.25, ease: 'power2.out' }, t); };
    d.droop = (t) => { X.tl.to(earF, { rotation: 22, duration: 0.3, ease: 'power2.out' }, t); X.tl.to(earB, { rotation: 14, duration: 0.3, ease: 'power2.out' }, t); };
    d.tilt = (t, deg = 10, dur = 0.22) => X.tl.to(head, { rotation: deg, duration: dur, ease: 'back.out(2)' }, t);
    d.happy = (t) => { X.tl.set(tongue, { opacity: 1 }, t); X.tl.set(mouth, { attr: { d: 'M122,-198 C112,-186 98,-186 92,-196' } }, t); };
    d.calm = (t) => { X.tl.set(tongue, { opacity: 0 }, t); X.tl.set(mouth, { attr: { d: 'M120,-196 C112,-188 100,-188 94,-194' } }, t); };
    d.blink = (t) => { X.tl.to(eyes, { scaleY: 0.1, duration: 0.05 }, t); X.tl.to(eyes, { scaleY: 1, duration: 0.07 }, t + 0.09); };
    d.hop = (t, h = 22) => {
      X.tl.to(body, { y: -h, duration: 0.14, ease: 'power2.out' }, t);
      X.tl.to(body, { y: 0, duration: 0.16, ease: 'power2.in' }, t + 0.14);
      X.tl.to(body, { scaleY: 0.93, scaleX: 1.04, duration: 0.05 }, t + 0.3);
      X.tl.to(body, { scaleY: 1, scaleX: 1, duration: 0.2, ease: 'back.out(3)' }, t + 0.35);
    };
    d.tagOff = (t) => X.tl.to(tag, { autoAlpha: 0, duration: 0.06 }, t);
    d.tagOn = (t) => { gsap.set(tag, { autoAlpha: 0 }); X.tl.set(tag, { autoAlpha: 1 }, t); X.tl.fromTo(tag, { rotation: -40 }, { rotation: 0, duration: 0.6, ease: 'elastic.out(1,0.35)', immediateRender: false }, t); };
    d.swingTag = (t) => X.tl.fromTo(tag, { rotation: 28 }, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,0.3)', immediateRender: false }, t);
    // blink every ~2.6 s
    if (o.blinks !== false) for (let tb = (o.t0 ?? 0) + 1.1 + (ph0 % 1); tb < (o.t1 ?? 0); tb += 2.6) d.blink(tb);
    return d;
  };
  /** A loose collar with its tag (left behind on the fence). Origin at the nail. */
  K.collarProp = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const sw = G(g, {});
    S('circle', { cx: 0, cy: 0, r: 5, fill: '#8d929c', ...stroke(2) }, g);
    S('path', { d: ell(0, 34, 30, 30), fill: 'none', stroke: C.ink, 'stroke-width': 13 }, sw);
    S('path', { d: ell(0, 34, 30, 30), fill: 'none', stroke: C.teal, 'stroke-width': 8 }, sw);
    S('circle', { cx: 0, cy: 72, r: 4.5, fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, sw);
    S('circle', { cx: 0, cy: 88, r: 14, fill: C.brass, ...stroke(2.5) }, sw);
    S('path', { d: 'M-7,86 l14,0 M-5,92 l10,0', stroke: '#9b7a2a', 'stroke-width': 2 }, sw);
    gsap.set(sw, { svgOrigin: '0 0' });
    g.sw = sw;
    return g;
  };
  /** One grain of rice (for scale). */
  K.rice = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-58,4 C-58,-14 -30,-20 6,-18 C40,-16 60,-8 60,2 C60,14 38,20 4,20 C-32,20 -58,18 -58,4 Z', fill: '#fbf6ea', ...stroke(3) }, g);
    S('path', { d: 'M-34,-6 C-12,-10 18,-10 38,-4', fill: 'none', stroke: '#e3dccb', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    return g;
  };
  /** The microchip: a glass capsule with a ferrite rod + copper coil and a tiny IC. Local 120 x 36 around (x,y).
   *  .lit(t, on) lights the coil (the scanner's field powers it). */
  K.chip = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('rect', { x: -58, y: -14, width: 124, height: 36, rx: 18, fill: C.shadow }, g);
    S('rect', { x: -62, y: -18, width: 124, height: 36, rx: 18, fill: C.glass, ...stroke(3) }, g);
    S('rect', { x: -48, y: -5, width: 58, height: 10, rx: 3, fill: '#6b6e77', ...stroke(1.5) }, g);
    const coil = G(g, {});
    for (let i = 0; i < 12; i++) S('path', { d: `M${-46 + i * 4.8},-9 l0,18`, stroke: C.copper, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, coil);
    S('rect', { x: 18, y: -9, width: 20, height: 18, rx: 2, fill: C.ink }, g);
    S('path', { d: 'M38,-4 l8,0 M38,4 l8,0 M10,0 l8,0', stroke: C.ink, 'stroke-width': 2 }, g);
    S('rect', { x: 46, y: -6, width: 6, height: 12, rx: 1, fill: '#9aa0aa' }, g);
    S('path', { d: 'M-46,-11 C-20,-14 20,-14 44,-11', fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    g.coil = coil;
    g.lit = (t, on = true) => X.tl.set(coil.children, { attr: { stroke: on ? '#ffb347' : C.copper } }, t);
    return g;
  };
  /** Small chip glyph for dot-matrix counts. state: 'grey' | 'home' | 'none' */
  K.chipMini = (p, x, y, s = 1, fill = '#fff') => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    g.body = S('rect', { x: -22, y: -8, width: 44, height: 16, rx: 8, fill, ...stroke(2.5) }, g);
    S('path', { d: 'M-14,-3 l0,6 M-9,-3 l0,6 M-4,-3 l0,6', stroke: C.copper, 'stroke-width': 2.2 }, g);
    S('rect', { x: 5, y: -4, width: 8, height: 8, rx: 1, fill: C.ink }, g);
    return g;
  };
  /** Handheld microchip scanner: a loop head over a chunky body with a screen. Origin = loop centre.
   *  .disp (text) · .beam(t0, t1) pulsing field arcs · colour via o.fill (universal = blue, old = grey) */
  K.scanner = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const fill = o.fill || C.blue;
    const beam = G(g, {});
    const arcs = [0, 1, 2].map((i) => S('path', { d: ell(0, 0, 92 + i * 26, 72 + i * 20), fill: 'none', stroke: o.beamC || C.blue2, 'stroke-width': 4, 'stroke-dasharray': '10 12', opacity: 0 }, beam));
    S('path', { d: `${ell(5, 6, 78, 60)}`, fill: C.shadow }, g);
    S('path', { d: `${ell(0, 0, 78, 60)} ${ell(0, 0, 50, 34)}`, fill, 'fill-rule': 'evenodd', ...stroke(3.5) }, g);
    // o.up: the body stands above the loop (the loop hovers over a dog's back); otherwise it hangs below
    const Y = (v, h = 0) => (o.up ? -(v + h) : v);
    S('rect', { x: -30, y: Y(52, 40), width: 60, height: 40, fill, ...stroke(3) }, g);
    S('rect', { x: -66, y: Y(86, 220) + (o.up ? 6 : 0), width: 140, height: 220, rx: 26, fill: C.shadow }, g);
    K.rrect(g, -70, Y(80, 220), 140, 220, 26, fill, 3.5);
    const sy = o.up ? -284 : 100;
    K.rrect(g, -54, sy, 108, 74, 10, '#1d2233', 3);
    g.disp = K.mono(g, 0, sy + 48, o.disp || '', { size: o.dispSize || 24, weight: 700, fill: '#bff1ff', anchor: 'middle' });
    S('circle', { cx: 0, cy: o.up ? -150 : 230, r: 22, fill: o.btn || '#fde099', ...stroke(3) }, g);
    if (o.label) K.mono(g, 0, o.up ? -100 : 282, o.label, { size: 18, weight: 700, fill: '#fff', anchor: 'middle', ls: 2 });
    if (o.dusty) [[-40, 196], [30, 260], [-20, 270], [44, 200]].forEach(([dx, dy]) => S('circle', { cx: dx, cy: o.up ? -dy : dy, r: 5, fill: '#7d7b77', opacity: 0.6 }, g));
    g.beam = (t0, t1, weak = false) => X.every((t) => {
      arcs.forEach((a, i) => {
        if (t < t0 || t > t1) { a.setAttribute('opacity', 0); return; }
        const u = ((t - t0) * (weak ? 1.2 : 2.2) - i / 3) % 1;
        a.setAttribute('opacity', (u < 0 ? 0 : (weak ? 0.35 : 0.85) * (1 - u)).toFixed(2));
        a.setAttribute('transform', `scale(${(0.85 + 0.3 * Math.max(0, u)).toFixed(3)})`);
      });
    });
    return g;
  };
  K.paw = (p, x, y, s = 1, fill = C.ink) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-14,10 C-16,-2 -8,-8 0,-8 C8,-8 16,-2 14,10 C12,16 -12,16 -14,10 Z', fill }, g);
    [[-15, -14, 6], [-5, -22, 6.5], [6, -22, 6.5], [16, -14, 6]].forEach(([cx, cy, r]) => S('ellipse', { cx, cy, rx: r * 0.85, ry: r, fill }, g));
    return g;
  };
  /** Small animal shelter: flat front with a paw sign, door and windows. x,y = bottom centre. */
  K.shelter = (p, x, y, w = 300, h = 230, o = {}) => {
    const g = G(p, {});
    S('rect', { x: x - w / 2 + 8, y: y - h + 10, width: w, height: h, fill: C.shadow }, g);
    S('path', { d: `M${x - w / 2 - 18},${y - h} L${x},${y - h - 70} L${x + w / 2 + 18},${y - h} Z`, fill: o.roof || '#8aa7a2', ...stroke(3) }, g);
    K.rrect(g, x - w / 2, y - h, w, h, 4, o.base || '#f3ede3', 3);
    K.rrect(g, x - w / 2 + 24, y - h + 18, w - 48, 46, 8, C.dark, 3);
    K.paw(g, x - w / 2 + 50, y - h + 42, 0.62, '#fde099');
    K.mono(g, x + 14, y - h + 50, o.label || 'SHELTER', { size: 22, weight: 700, fill: '#fff', anchor: 'middle', ls: 3 });
    K.rrect(g, x - 30, y - 96, 60, 96, 6, '#c9a067', 3);
    S('circle', { cx: x + 18, cy: y - 48, r: 4, fill: C.ink }, g);
    [[x - w / 2 + 30], [x + w / 2 - 90]].forEach(([wx]) => { K.rrect(g, wx, y - 140, 60, 52, 4, o.lit ? C.yellow : '#dfe6f3', 3); S('path', { d: `M${wx + 30},${y - 140} l0,52 M${wx},${y - 114} l60,0`, ...stroke(2) }, g); });
    S('path', { d: `M${x - w / 2 - 30},${y} L${x + w / 2 + 30},${y}`, ...stroke(3) }, g);
    return g;
  };
  /** Home: a small house with a lit window and an optional heart over the door. x,y = bottom centre. */
  K.house = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('rect', { x: -66, y: -112, width: 140, height: 118, fill: C.shadow }, g);
    S('path', { d: 'M-84,-110 L0,-178 L84,-110 Z', fill: o.roof || C.red, ...stroke(3) }, g);
    K.rrect(g, -70, -112, 140, 112, 3, o.base || '#fff', 3);
    K.rrect(g, -20, -62, 40, 62, 4, o.door || C.teal, 3);
    g.win = K.rrect(g, 28, -90, 30, 28, 3, o.lit === false ? '#dfe6f3' : C.yellow, 2.5);
    K.rrect(g, -58, -90, 30, 28, 3, o.lit === false ? '#dfe6f3' : C.yellow, 2.5);
    if (o.heart) K.heart(g, 0, -134, 0.9, C.red);
    return g;
  };
  /** Phone (big, upright). .screen group, .title/.sub texts, .ring(t, dur) shakes with ring arcs. */
  K.phone = (p, x, y, w = 230, h = 420, o = {}) => {
    const g = G(p, {});
    const arcs = G(g, {});
    S('rect', { x: x + 8, y: y + 10, width: w, height: h, rx: 34, fill: C.shadow }, g);
    const body = G(g, {});
    K.rrect(body, x, y, w, h, 34, C.dark, 3.5);
    K.rrect(body, x + 14, y + 40, w - 28, h - 80, 12, o.screen || '#eef3f8', 0);
    S('rect', { x: x + w / 2 - 30, y: y + 16, width: 60, height: 10, rx: 5, fill: '#45464d' }, body);
    g.screen = G(body, {});
    g.body = body;
    gsap.set(body, { svgOrigin: `${x + w / 2} ${y + h / 2}` });
    const cx = x + w / 2, cy = y + h * 0.36;
    const ra = [0, 1, 2].map((i) => S('path', { d: `M${x - 26 - i * 24},${cy - 50 - i * 14} q-22,${50 + i * 14} 0,${100 + i * 28} M${x + w + 26 + i * 24},${cy - 50 - i * 14} q22,${50 + i * 14} 0,${100 + i * 28}`, fill: 'none', stroke: o.ringC || C.warmGreen, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, arcs));
    g.ring = (t, dur = 1.6) => {
      X.tl.to(body, { rotation: 4, duration: 0.05, repeat: Math.round(dur / 0.05), yoyo: true, ease: 'none' }, t);
      X.tl.to(body, { rotation: 0, duration: 0.05 }, t + dur);
      X.every((tt) => ra.forEach((a, i) => { const on = tt >= t && tt <= t + dur && Math.floor((tt - t) * 6 + i) % 3 !== 0; a.setAttribute('opacity', on ? (1 - i * 0.25).toFixed(2) : 0); }));
    };
    g.cx = cx; g.cy = cy;
    return g;
  };
  /** Dresser with the top drawer pulled open; the old tag lies inside. x,y = bottom-left. returns .tag, .drawer */
  K.drawer = (p, x, y, w = 340, o = {}) => {
    const g = G(p, {});
    const h = 230;
    S('rect', { x: x + 8, y: y - h + 10, width: w, height: h, rx: 8, fill: C.shadow }, g);
    K.rrect(g, x, y - h, w, h, 8, '#c9a067', 3);
    K.rrect(g, x + 18, y - 104, w - 36, 80, 6, '#d9b57e', 3);
    S('circle', { cx: x + w / 2, cy: y - 64, r: 8, fill: C.brass, ...stroke(2) }, g);
    S('path', { d: `M${x + 18},${y} l0,14 M${x + w - 18},${y} l0,14`, ...stroke(5) }, g);
    const dr = G(g, {});
    S('path', { d: `M${x + 6},${y - h + 30} L${x + w - 6},${y - h + 30} L${x + w + 22},${y - h + 70} L${x - 22},${y - h + 70} Z`, fill: '#6f5232', ...stroke(3) }, dr);
    K.rrect(dr, x - 22, y - h + 70, w + 44, 80, 6, '#d9b57e', 3);
    S('circle', { cx: x + w / 2, cy: y - h + 110, r: 8, fill: C.brass, ...stroke(2) }, dr);
    // things in the drawer: a folded paper, a pencil, the old tag on its ring
    S('path', { d: `M${x + 40},${y - h + 58} l70,-10 l6,14 l-70,10 Z`, fill: '#fff', ...stroke(2) }, dr);
    S('path', { d: `M${x + w - 120},${y - h + 46} l70,14`, stroke: C.yellow2, 'stroke-width': 7, 'stroke-linecap': 'round' }, dr);
    const tag = G(dr, {});
    S('circle', { cx: x + w / 2 + 6, cy: y - h + 44, r: 7, fill: 'none', stroke: C.ink, 'stroke-width': 3 }, tag);
    S('ellipse', { cx: x + w / 2 + 6, cy: y - h + 58, rx: 18, ry: 11, fill: C.brass, ...stroke(2.5) }, tag);
    S('path', { d: `M${x + w / 2 - 4},${y - h + 57} l18,0`, stroke: '#9b7a2a', 'stroke-width': 2 }, tag);
    g.tag = tag; g.drawer = dr;
    g.tagAt = [x + w / 2 + 6, y - h + 58];
    return g;
  };
  /** Picket fence across [x0,x1], bottom at y, with the gap underneath and a nail on post k. */
  K.fence = (p, x0, x1, y, h = 220, o = {}) => {
    const g = G(p, {});
    const gap = o.gap ?? 34;
    S('rect', { x: x0, y: y - h * 0.72, width: x1 - x0, height: 18, fill: '#e9dcc4', ...stroke(3) }, g);
    S('rect', { x: x0, y: y - h * 0.3, width: x1 - x0, height: 18, fill: '#e9dcc4', ...stroke(3) }, g);
    for (let xx = x0 + 10; xx < x1 - 30; xx += 54) S('path', { d: `M${xx},${y - gap} L${xx},${y - h + 22} L${xx + 19},${y - h} L${xx + 38},${y - h + 22} L${xx + 38},${y - gap} Z`, fill: '#fbf3e4', ...stroke(3) }, g);
    S('path', { d: `M${x0 - 20},${y} L${x1 + 20},${y}`, ...stroke(3) }, g);
    [[x0 + 80, y - 6], [x1 - 140, y - 4]].forEach(([tx, ty]) => S('path', { d: `M${tx},${ty} l6,-16 l4,12 l6,-14 l4,18`, fill: 'none', stroke: C.tree2, 'stroke-width': 3, 'stroke-linecap': 'round' }, g));
    return g;
  };
  K.battery = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    K.rrect(g, -40, -22, 74, 44, 7, '#fff', 3);
    S('rect', { x: 34, y: -9, width: 9, height: 18, rx: 2, fill: C.ink }, g);
    S('rect', { x: -33, y: -15, width: 16, height: 30, rx: 2, fill: C.sage }, g);
    return g;
  };
  K.satellite = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    K.rrect(g, -60, -14, 40, 28, 3, C.blueL, 3);
    K.rrect(g, 20, -14, 40, 28, 3, C.blueL, 3);
    S('path', { d: 'M-40,-14 l0,28 M40,-14 l0,28', stroke: C.ink, 'stroke-width': 2 }, g);
    K.rrect(g, -18, -18, 36, 36, 6, '#d9d6d0', 3);
    S('path', { d: 'M0,18 l0,14 M-10,40 q10,-10 20,0', fill: 'none', ...stroke(3) }, g);
    return g;
  };
  /** Registry record card: rows [[label, value]]; returns .vals (text els) so rows can type in or be struck. */
  K.recordCard = (p, x, y, w, rows, o = {}) => {
    const g = G(p, {});
    const rh = o.rh || 58, h = 70 + rows.length * rh;
    K.card(g, x, y, w, h, { r: 16 });
    K.rrect(g, x, y, w, 52, 16, o.head || C.dark, 0);
    S('rect', { x, y: y + 30, width: w, height: 22, fill: o.head || C.dark }, g);
    K.mono(g, x + 22, y + 34, o.title || 'REGISTRY RECORD', { size: 19, weight: 700, fill: '#fff', ls: 2 });
    g.vals = []; g.rowY = [];
    rows.forEach(([lab, val], i) => {
      const ry = y + 70 + i * rh;
      K.mono(g, x + 22, ry + 26, lab, { size: 17, weight: 600, fill: '#8d8a84', ls: 1 });
      g.vals.push(K.mono(g, x + 150, ry + 28, val, { size: o.size || 24, weight: 700 }));
      g.rowY.push(ry + 20);
      if (i < rows.length - 1) S('path', { d: `M${x + 18},${ry + rh - 6} L${x + w - 18},${ry + rh - 6}`, stroke: '#e3e0da', 'stroke-width': 2 }, g);
    });
    g.h = h;
    return g;
  };
})();
