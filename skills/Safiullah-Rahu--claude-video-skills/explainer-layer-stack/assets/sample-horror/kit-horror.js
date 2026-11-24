/* layer-stack-horror kit additions — props for "What it really takes to run a haunted house".
 * Same flat ink style as kit.js (3 px ink outlines, flat fills, hard grey offset shadows, seek-safe tweens).
 * Loaded after kit.js. Every prop here is an original design: the haunt mascot (a barn on legs with the format's dark
 * screen face), three scarers (sheet ghost, sack-head scarecrow, pumpkin head), a tall faceless figure, guests,
 * tally clickers, a live headcount board, a hedge maze, a coffin, fog, a smoke detector, a fire truck, a trigger pad,
 * an earpiece, a red beacon, a wall with a hidden door, a floor plan, pines and a barn. Nothing gory. */
(function () {
  const C = K.C, S = K.S, G = K.G, stroke = K.stroke;
  Object.assign(C, {
    barn: '#a9533b', barnS: '#87412f', roof: '#4a4b52', trim: '#f4efe6', pine: '#7c9c7b', pine2: '#5f8462',
    pumpkin: '#e39a3c', pumpkinS: '#c47c26', straw: '#e2c46a', sack: '#d2b27c', hedge: '#7fa37c', hedgeD: '#5f8462',
    ground: '#ece9e2', night: '#121216', glow: '#ff4b33',
  });

  // ------------------------------------------------------------------ canvas tone (the variant dims the paper)
  /** Set the canvas colour at t (hard switch, used on chapter cuts) or tween it over dur. */
  K.canvasTo = (t, fill, dur = 0) => {
    if (!K.bgRect) return;
    if (dur) X.tl.to(K.bgRect, { attr: { fill }, duration: dur, ease: 'none' }, t);
    else X.tl.set(K.bgRect, { attr: { fill } }, t);
  };
  /** Build something with the night palette: pale ink on near-black. kit functions read C.* at call time. */
  K.NIGHT = { ink: '#d4cec2', ink2: '#bdb7ab', shadow: '#09090b', dark: '#2a2b31', dark2: '#34353c', dark3: '#45464d', white: '#1f2026', paper: '#1d1e23', line: '#3a3a40' };
  K.inNight = (fn) => {
    const keep = {};
    for (const k in K.NIGHT) { keep[k] = C[k]; C[k] = K.NIGHT[k]; }
    try { return fn(); } finally { Object.assign(C, keep); }
  };

  // ------------------------------------------------------------------ scenery
  K.pine = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M0,0 L0,-24', ...stroke(3) }, g);
    S('path', { d: 'M0,-158 L-30,-108 L-17,-108 L-44,-66 L-27,-66 L-58,-22 L58,-22 L27,-66 L44,-66 L17,-108 L30,-108 Z', fill: o.fill || C.pine, ...stroke(2.5) }, g);
    S('path', { d: 'M-5,-134 L-18,-112 M-12,-90 L-28,-70', stroke: o.hi || '#a9c2a6', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    return g;
  };
  /** Red barn, front-oblique: gambrel front gable, side wall, roof, X-braced door, hay-loft, sign. x,y = front bottom-left. */
  K.barn = (p, x, y, w = 300, h = 200, o = {}) => {
    const g = G(p, {});
    const d = o.depth ?? w * 0.32, k = 0.5;
    const r1 = [x + w * 0.14, y - h - h * 0.34], top = [x + w / 2, y - h - h * 0.56], r2 = [x + w * 0.86, y - h - h * 0.34];
    K.shadow(g, x + w / 2 + d * 0.6, y + 6, w * 0.72, 18, 0.9);
    S('path', { d: `M${x + w},${y} L${x + w + d},${y - d * k} L${x + w + d},${y - h - d * k} L${x + w},${y - h} Z`, fill: o.side || C.barnS, ...stroke(3) }, g);
    S('path', { d: `M${r2[0]},${r2[1]} L${x + w},${y - h} L${x + w + d},${y - h - d * k} L${r2[0] + d},${r2[1] - d * k} Z`, fill: C.roof, ...stroke(3) }, g);
    S('path', { d: `M${top[0]},${top[1]} L${r2[0]},${r2[1]} L${r2[0] + d},${r2[1] - d * k} L${top[0] + d},${top[1] - d * k} Z`, fill: '#5b5c64', ...stroke(3) }, g);
    S('path', { d: `M${x},${y} L${x},${y - h} L${r1[0]},${r1[1]} L${top[0]},${top[1]} L${r2[0]},${r2[1]} L${x + w},${y - h} L${x + w},${y} Z`, fill: o.fill || C.barn, ...stroke(3) }, g);
    S('path', { d: `M${x + 8},${y - h + 4} L${r1[0] + 4},${r1[1] + 10} L${top[0]},${top[1] + 12} L${r2[0] - 4},${r2[1] + 10} L${x + w - 8},${y - h + 4}`, fill: 'none', stroke: C.trim, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    // door
    const dw = w * 0.44, dh = h * 0.66, dx = x + w / 2 - dw / 2, dy = y - dh;
    const door = G(g, {});
    K.rrect(door, dx, dy, dw, dh, 3, o.doorFill || C.barnS, 3);
    S('path', { d: `M${dx + 6},${dy + 6} L${dx + dw - 6},${dy + dh - 6} M${dx + dw - 6},${dy + 6} L${dx + 6},${dy + dh - 6} M${dx + dw / 2},${dy + 4} L${dx + dw / 2},${dy + dh - 4}`, stroke: C.trim, 'stroke-width': 7, 'stroke-linecap': 'round' }, door);
    S('rect', { x: dx + 4, y: dy + 4, width: dw - 8, height: dh - 8, fill: 'none', stroke: C.trim, 'stroke-width': 6 }, door);
    // hay loft
    const lw = w * 0.2, ly = y - h - h * 0.1;
    K.rrect(g, x + w / 2 - lw / 2, ly - lw * 0.5, lw, lw * 0.82, 3, o.loft || '#26272d', 3);
    S('rect', { x: x + w / 2 - lw / 2 + 4, y: ly - lw * 0.5 + 4, width: lw - 8, height: lw * 0.82 - 8, fill: 'none', stroke: C.trim, 'stroke-width': 4 }, g);
    if (o.sign) {
      const pl = K.pill(g, x + w / 2, dy - 54, o.sign, { anchor: 'middle', size: o.signSize || 20, padX: 12, padY: 12, fill: C.dark });
      g.sign = pl;
    }
    g.door = door; g.doorBox = { x: dx, y: dy, w: dw, h: dh };
    return g;
  };

  // ------------------------------------------------------------------ the haunt mascot (the product)
  /* "Hollow Pines": the attraction as a little red barn on legs with the format's dark screen face, mitten hands and
   * boots. Same API as K.mascot: m.face(t, 'happy|grin|worried|shock|sad|sleep|dizzy|wink|spooky'), m.hatOn(t) (witch hat),
   * m.wave(t), m.hop(t), m.squash(t), m.armUp(t), m.tilt(t); m.jit for K.jitter. Local coords: feet at 0, ~210 tall. */
  K.haunt = (p, x, y, s = 1, o = {}) => {
    const root = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const hov = G(root, {});
    const ph0 = (x * 0.013 + y * 0.007) % 6.28;
    X.every((t) => hov.setAttribute('transform', `translate(0 ${(-Math.abs(Math.sin(t * Math.PI / 0.62 + ph0)) * (o.hover ?? 9)).toFixed(1)})`));
    const jit = G(hov, {}); jit.__cx = 0; jit.__cy = -100;
    const g = G(jit, {});
    gsap.set(g, { svgOrigin: '0 0' });
    K.shadow(g, 0, 4, 70, 10);
    S('path', { d: 'M-24,-40 L-24,-12 M24,-40 L24,-12', ...stroke(7) }, g);
    S('path', { d: 'M-42,0 C-42,-12 -34,-16 -20,-16 L-12,-16 L-12,0 Z M42,0 C42,-12 34,-16 20,-16 L12,-16 L12,0 Z', fill: C.dark, ...stroke(3) }, g);
    const armL = G(g, {});
    S('path', { d: 'M-70,-110 C-92,-96 -96,-78 -94,-64', fill: 'none', ...stroke(7) }, armL);
    S('circle', { cx: -94, cy: -60, r: 12, fill: '#fff', ...stroke(3) }, armL);
    const armR = G(g, {});
    S('path', { d: 'M70,-110 C92,-96 96,-78 94,-64', fill: 'none', ...stroke(7) }, armR);
    S('circle', { cx: 94, cy: -60, r: 12, fill: '#fff', ...stroke(3) }, armR);
    gsap.set(armR, { svgOrigin: '70 -110' });
    const body = 'M-70,-38 L-70,-160 L-50,-192 L0,-212 L50,-192 L70,-160 L70,-38 Z';
    S('path', { d: body, fill: C.shadow, transform: 'translate(5 6)' }, g);
    S('path', { d: body, fill: C.barn, ...stroke(3.5) }, g);
    S('path', { d: 'M-66,-158 L-47,-188 L0,-207 L47,-188 L66,-158', fill: 'none', stroke: C.trim, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    S('path', { d: 'M-70,-160 L-50,-192 L0,-212 L50,-192 L70,-160', fill: 'none', ...stroke(3.5) }, g);
    K.rrect(g, -13, -190, 26, 22, 3, '#26272d', 2.5);
    K.rrect(g, -56, -152, 112, 96, 14, '#1d2233', 3);
    S('path', { d: 'M-46,-140 q20,-6 40,0', stroke: '#3a4260', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    const faces = {};
    const F = (name) => (faces[name] = G(g, {}));
    const lit = '#ffd9a0'; // warm screen glow (lantern), the base mascot's is cyan
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
    f = F('spooky'); S('path', { d: 'M-32,-104 l10,-16 l10,16 Z M12,-104 l10,-16 l10,16 Z', fill: lit }, f); S('path', { d: 'M-22,-88 l8,8 l7,-8 l7,8 l7,-8 l7,8 l8,-8', fill: 'none', ...fs(4) }, f);
    S('circle', { cx: -40, cy: -90, r: 7, fill: C.salmon, opacity: 0.6 }, g);
    S('circle', { cx: 40, cy: -90, r: 7, fill: C.salmon, opacity: 0.6 }, g);
    // witch hat (hidden until m.hatOn)
    const hat = G(g, {});
    S('ellipse', { cx: 0, cy: -208, rx: 62, ry: 12, fill: '#2c2d33', ...stroke(3) }, hat);
    S('path', { d: 'M-32,-212 C-26,-246 -12,-276 6,-298 C14,-306 30,-300 34,-290 C22,-292 16,-280 18,-260 C20,-240 26,-226 32,-212 Z', fill: '#2c2d33', ...stroke(3) }, hat);
    S('path', { d: 'M-31,-224 L31,-224', stroke: C.pumpkin, 'stroke-width': 9 }, hat);
    gsap.set(hat, { autoAlpha: o.hat ? 1 : 0 });
    const state0 = o.face || 'happy';
    Object.entries(faces).forEach(([k, el]) => gsap.set(el, { autoAlpha: k === state0 ? 1 : 0 }));
    const m = { root, jit, g, armR, hat, faces };
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
    m.tilt = (t, deg = 8) => X.tl.to(g, { rotation: deg, duration: 0.2, ease: 'power2.out' }, t);
    return m;
  };

  // ------------------------------------------------------------------ scarers (original costumes, no gore)
  /* kind: 'ghost' (bedsheet with eye holes, sneakers), 'scarecrow' (sack head, straw hat, plaid), 'pumpkin'
   * (jack-o'-lantern head, dark hoodie). Feet at (0,0), ~240 tall. sc.boo(t): hop + arms up + mouth open. */
  K.scarer = (p, x, y, s = 1, kind = 'ghost', o = {}) => {
    const root = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const g = G(root, {});
    gsap.set(g, { svgOrigin: '0 0' });
    const sc = { root, g, kind };
    K.shadow(g, 0, 4, 64, 10);
    const armsUp = [];
    let mouth = null;
    if (kind === 'ghost') {
      K.rrect(g, -38, -16, 30, 15, 7, C.red, 2.5); K.rrect(g, 8, -16, 30, 15, 7, C.red, 2.5);
      const aL = G(g, {}), aR = G(g, {});
      S('path', { d: 'M-50,-150 C-80,-150 -92,-118 -88,-96 C-76,-104 -62,-108 -50,-104 Z', fill: '#fbfaf7', ...stroke(3) }, aL);
      S('path', { d: 'M50,-150 C80,-150 92,-118 88,-96 C76,-104 62,-108 50,-104 Z', fill: '#fbfaf7', ...stroke(3) }, aR);
      gsap.set(aL, { svgOrigin: '-50 -128', rotation: 40 }); gsap.set(aR, { svgOrigin: '50 -128', rotation: -40 });
      armsUp.push([aL, -70, 40], [aR, 70, -40]);
      S('path', { d: 'M-62,-14 C-64,-70 -60,-150 -50,-184 C-38,-236 38,-236 50,-184 C60,-150 64,-70 62,-14 Q50,-26 38,-14 Q26,-2 14,-14 Q2,-26 -10,-14 Q-22,-2 -34,-14 Q-48,-26 -62,-14 Z', fill: '#fbfaf7', ...stroke(3) }, g);
      S('path', { d: 'M30,-200 C46,-170 48,-90 50,-24', stroke: '#e3e0d9', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, g);
      S('ellipse', { cx: -17, cy: -180, rx: 8, ry: 12, fill: C.ink }, g);
      S('ellipse', { cx: 17, cy: -180, rx: 8, ry: 12, fill: C.ink }, g);
      mouth = S('ellipse', { cx: 0, cy: -150, rx: 10, ry: 13, fill: C.ink, opacity: 0 }, g);
    } else if (kind === 'scarecrow') {
      S('path', { d: 'M-22,-96 L-24,-12 M22,-96 L24,-12', stroke: C.ink, 'stroke-width': 22, 'stroke-linecap': 'round' }, g);
      S('path', { d: 'M-22,-96 L-24,-12 M22,-96 L24,-12', stroke: '#56709a', 'stroke-width': 15, 'stroke-linecap': 'round' }, g);
      K.rrect(g, -40, -16, 30, 15, 6, C.dark, 2.5); K.rrect(g, 10, -16, 30, 15, 6, C.dark, 2.5);
      const aL = G(g, {}), aR = G(g, {});
      [[aL, -1], [aR, 1]].forEach(([a, k]) => {
        S('path', { d: `M${k * 30},-168 L${k * 92},-150`, stroke: C.ink, 'stroke-width': 24, 'stroke-linecap': 'round' }, a);
        S('path', { d: `M${k * 30},-168 L${k * 92},-150`, stroke: '#b5654a', 'stroke-width': 17, 'stroke-linecap': 'round' }, a);
        S('path', { d: `M${k * 100},-150 l${k * 16},-10 M${k * 100},-148 l${k * 18},2 M${k * 100},-146 l${k * 14},12`, stroke: C.straw, 'stroke-width': 4, 'stroke-linecap': 'round' }, a);
        gsap.set(a, { svgOrigin: `${k * 30} -168` });
      });
      armsUp.push([aL, 35, 0], [aR, -35, 0]);
      S('path', { d: 'M-40,-178 C-44,-140 -40,-112 -34,-92 L34,-92 C40,-112 44,-140 40,-178 C24,-186 -24,-186 -40,-178 Z', fill: '#b5654a', ...stroke(3) }, g);
      S('path', { d: 'M-20,-182 L-20,-94 M4,-184 L4,-92 M26,-180 L26,-94 M-42,-148 L42,-148 M-40,-120 L40,-120', stroke: '#8f4a35', 'stroke-width': 3, opacity: 0.8 }, g);
      S('path', { d: 'M-8,-178 l8,10 l8,-10', fill: 'none', ...stroke(2.5) }, g);
      S('path', { d: 'M-30,-190 C-36,-226 -26,-250 0,-250 C26,-250 36,-226 30,-190 C14,-184 -14,-184 -30,-190 Z', fill: C.sack, ...stroke(3) }, g);
      S('path', { d: 'M-28,-192 C-12,-186 12,-186 28,-192', stroke: '#8a6a3a', 'stroke-width': 5, fill: 'none' }, g);
      S('path', { d: 'M-20,-228 l10,10 M-10,-228 l-10,10 M10,-228 l10,10 M20,-228 l-10,10', ...stroke(3) }, g);
      mouth = S('path', { d: 'M-16,-204 q16,12 32,0', fill: 'none', ...stroke(3) }, g);
      S('path', { d: 'M-12,-208 l0,8 M0,-204 l0,8 M12,-208 l0,8', ...stroke(2) }, g);
      S('ellipse', { cx: 0, cy: -246, rx: 54, ry: 11, fill: C.straw, ...stroke(3) }, g);
      S('path', { d: 'M-26,-248 C-24,-272 -14,-280 0,-280 C14,-280 24,-272 26,-248 Z', fill: C.straw, ...stroke(3) }, g);
      S('path', { d: 'M-25,-256 L25,-256', stroke: C.red, 'stroke-width': 6 }, g);
    } else { // pumpkin
      S('path', { d: 'M-18,-90 L-20,-12 M18,-90 L20,-12', stroke: C.ink, 'stroke-width': 22, 'stroke-linecap': 'round' }, g);
      S('path', { d: 'M-18,-90 L-20,-12 M18,-90 L20,-12', stroke: '#5c5e66', 'stroke-width': 15, 'stroke-linecap': 'round' }, g);
      K.rrect(g, -38, -16, 30, 15, 6, C.dark, 2.5); K.rrect(g, 8, -16, 30, 15, 6, C.dark, 2.5);
      const aL = G(g, {}), aR = G(g, {});
      [[aL, -1], [aR, 1]].forEach(([a, k]) => {
        S('path', { d: `M${k * 34},-160 C${k * 52},-140 ${k * 56},-116 ${k * 54},-96`, fill: 'none', stroke: C.ink, 'stroke-width': 22, 'stroke-linecap': 'round' }, a);
        S('path', { d: `M${k * 34},-160 C${k * 52},-140 ${k * 56},-116 ${k * 54},-96`, fill: 'none', stroke: '#2f3037', 'stroke-width': 15, 'stroke-linecap': 'round' }, a);
        S('circle', { cx: k * 54, cy: -90, r: 11, fill: '#fff', ...stroke(3) }, a);
        gsap.set(a, { svgOrigin: `${k * 34} -160` });
      });
      armsUp.push([aL, 150, 0], [aR, -150, 0]);
      S('path', { d: 'M-38,-168 C-44,-130 -40,-104 -34,-84 L34,-84 C40,-104 44,-130 38,-168 C22,-178 -22,-178 -38,-168 Z', fill: '#2f3037', ...stroke(3) }, g);
      S('path', { d: 'M-14,-170 C-14,-150 14,-150 14,-170', fill: 'none', stroke: '#55565e', 'stroke-width': 3 }, g);
      S('path', { d: 'M-4,-238 C-6,-252 0,-262 10,-262', fill: 'none', stroke: '#5f8462', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
      S('ellipse', { cx: 0, cy: -204, rx: 46, ry: 36, fill: C.pumpkin, ...stroke(3) }, g);
      S('path', { d: 'M-14,-238 C-24,-220 -24,-188 -14,-170 M14,-238 C24,-220 24,-188 14,-170', fill: 'none', stroke: C.pumpkinS, 'stroke-width': 3.5 }, g);
      S('path', { d: 'M-26,-206 l10,-16 l10,16 Z M6,-206 l10,-16 l10,16 Z', fill: '#4a2a12' }, g);
      mouth = S('path', { d: 'M-26,-190 l7,7 l7,-6 l6,7 l6,-7 l7,6 l7,-7 C18,-176 -18,-176 -26,-190 Z', fill: '#4a2a12' }, g);
    }
    sc.mouth = mouth;
    sc.boo = (t, dur = 0.55) => {
      X.tl.to(g, { y: -34, duration: 0.1, ease: 'power2.out' }, t);
      X.tl.to(g, { y: 0, duration: 0.14, ease: 'power2.in' }, t + 0.1);
      X.tl.to(g, { scaleY: 0.92, scaleX: 1.08, duration: 0.05 }, t + 0.24);
      X.tl.to(g, { scaleY: 1, scaleX: 1, duration: 0.2, ease: 'back.out(3)' }, t + 0.29);
      armsUp.forEach(([a, r, r0]) => { X.tl.to(a, { rotation: r, duration: 0.1, ease: 'back.out(2)' }, t); X.tl.to(a, { rotation: r0, duration: 0.2 }, t + dur); });
      if (kind === 'ghost') { X.tl.set(mouth, { opacity: 1 }, t); X.tl.set(mouth, { opacity: 0 }, t + dur); }
    };
    sc.freeze = (t) => X.tl.to(g, { rotation: 0, scale: 1, duration: 0.01 }, t);
    return sc;
  };

  // ------------------------------------------------------------------ the figure (never explained)
  /* Tall, thin, faceless. Feet at (0,0), ~330 tall at s=1 (a guest is ~200). No features, no gore.
   * o.fill / o.line / o.lineOp; o.eyes adds two faint pale points (off by default). */
  K.figure = (p, x, y, s = 1, o = {}) => {
    const root = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const g = G(root, {});
    const fill = o.fill || '#d8d3ca', line = o.line || fill, sw = o.sw ?? 2.5, lo = o.lineOp ?? 1;
    const ln = { stroke: line, 'stroke-width': sw, 'stroke-opacity': lo, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    const limb = (d, w) => { S('path', { d, fill: 'none', stroke: line, 'stroke-opacity': lo, 'stroke-width': w + sw * 2, 'stroke-linecap': 'round' }, g); S('path', { d, fill: 'none', stroke: fill, 'stroke-width': w, 'stroke-linecap': 'round' }, g); };
    if (o.shadow !== false) S('ellipse', { cx: 0, cy: 3, rx: 34, ry: 6, fill: o.shadowFill || C.shadow, opacity: 0.8 }, g);
    limb('M-9,-150 L-12,-2', 9); limb('M9,-150 L12,-2', 9);
    limb('M-19,-236 C-33,-196 -37,-132 -35,-74', 8); limb('M19,-236 C33,-196 37,-132 35,-74', 8);
    S('path', { d: 'M-23,-240 C-27,-204 -19,-172 -15,-146 L15,-146 C19,-172 27,-204 23,-240 C12,-250 -12,-250 -23,-240 Z', fill, ...ln }, g);
    limb('M0,-248 L1,-266', 9);
    const head = G(g, {});
    S('ellipse', { cx: 2, cy: -296, rx: 20, ry: 31, fill, ...ln, transform: 'rotate(7 2 -296)' }, head);
    if (o.eyes) { S('circle', { cx: -5, cy: -298, r: 2.2, fill: '#e9e4da', opacity: 0.55 }, head); S('circle', { cx: 9, cy: -297, r: 2.2, fill: '#e9e4da', opacity: 0.55 }, head); }
    root.inner = g; root.head = head;
    return root;
  };

  // ------------------------------------------------------------------ guests (full body, can walk)
  K.guest = (p, x, y, s = 1, o = {}) => {
    const root = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const g = G(root, {});
    const skin = o.skin || C.skin2, shirt = o.shirt || '#5b6b8c', pants = o.pants || '#45464d';
    if (o.shadow !== false) K.shadow(g, 0, 3, 34, 6);
    const legs = [-1, 1].map((k) => {
      const lg = G(g, {});
      S('path', { d: `M${k * 11},-72 L${k * 12},-8`, stroke: C.ink, 'stroke-width': 17, 'stroke-linecap': 'round' }, lg);
      S('path', { d: `M${k * 11},-72 L${k * 12},-8`, stroke: pants, 'stroke-width': 11, 'stroke-linecap': 'round' }, lg);
      S('ellipse', { cx: k * 14, cy: -4, rx: 13, ry: 7, fill: C.dark, ...stroke(2) }, lg);
      gsap.set(lg, { svgOrigin: `${k * 11} -72` });
      return lg;
    });
    [-1, 1].forEach((k) => {
      S('path', { d: `M${k * 28},-136 C${k * 38},-118 ${k * 40},-100 ${k * 38},-82`, fill: 'none', stroke: C.ink, 'stroke-width': 15, 'stroke-linecap': 'round' }, g);
      S('path', { d: `M${k * 28},-136 C${k * 38},-118 ${k * 40},-100 ${k * 38},-82`, fill: 'none', stroke: shirt, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      S('circle', { cx: k * 38, cy: -78, r: 7, fill: skin, ...stroke(2) }, g);
    });
    S('path', { d: 'M-30,-140 C-34,-110 -30,-84 -27,-68 L27,-68 C30,-84 34,-110 30,-140 C16,-150 -16,-150 -30,-140 Z', fill: shirt, ...stroke(3) }, g);
    S('rect', { x: -7, y: -158, width: 14, height: 14, fill: skin, ...stroke(2.5) }, g);
    S('circle', { cx: 0, cy: -176, r: 24, fill: skin, ...stroke(3) }, g);
    if (o.cap) S('path', { d: 'M-25,-180 C-25,-206 25,-206 25,-180 Z M14,-184 L38,-182 L37,-176 L14,-178 Z', fill: o.cap, ...stroke(2.5) }, g);
    else S('path', { d: 'M-25,-172 C-28,-198 -12,-206 2,-205 C18,-205 28,-196 25,-172 C22,-186 14,-190 0,-190 C-12,-190 -20,-186 -25,-172 Z', fill: o.hairC || '#2a1d19', ...stroke(2.5) }, g);
    const eyes = G(g, {});
    if (o.back) { /* seen from behind: no face */ } else {
      S('circle', { cx: -8, cy: -175, r: 3, fill: o.eye || C.ink }, eyes); S('circle', { cx: 8, cy: -175, r: 3, fill: o.eye || C.ink }, eyes);
      g.mouth = S('path', { d: o.frown ? 'M-6,-161 q6,-5 12,0' : 'M-6,-164 q6,5 12,0', fill: 'none', ...stroke(2.2) }, g);
    }
    root.inner = g; root.legs = legs; root.eyes = eyes;
    return root;
  };
  /** Walk a guest/figure from (x0,y) to (x1,y) between t0 and t1 (pure function of t): legs swing, body bobs. */
  K.walk = (el, x0, x1, y, t0, t1, o = {}) => {
    const s = o.s || 1, step = o.step || 0.36;
    X.every((t) => {
      const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
      const x = x0 + (x1 - x0) * (o.ease ? o.ease(u) : u);
      const moving = t > t0 && t < t1;
      const ph = moving ? Math.sin(((t - t0) / step) * Math.PI) : 0;
      const bob = moving ? -Math.abs(ph) * 5 : 0;
      el.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + bob).toFixed(1)}) scale(${s})`);
      if (el.legs) { el.legs[0].setAttribute('transform', `rotate(${(ph * 16).toFixed(1)} -11 -72)`); el.legs[1].setAttribute('transform', `rotate(${(-ph * 16).toFixed(1)} 11 -72)`); }
    });
  };

  // ------------------------------------------------------------------ counting
  /** Hand tally counter: chrome disc, 4-digit window, plunger, finger ring. c.press(t, value) clicks it. */
  K.clicker = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('circle', { cx: 0, cy: 62, r: 22, fill: 'none', stroke: C.ink, 'stroke-width': 11 }, g);
    S('circle', { cx: 0, cy: 62, r: 22, fill: 'none', stroke: o.metal || '#b9bcc4', 'stroke-width': 5 }, g);
    const pl = G(g, {});
    K.rrect(pl, -11, -80, 22, 32, 5, o.metal || '#b9bcc4', 3);
    K.rrect(pl, -20, -88, 40, 13, 5, '#9a9ea8', 3);
    S('circle', { cx: 6, cy: 7, r: 54, fill: C.shadow }, g);
    S('circle', { cx: 0, cy: 0, r: 54, fill: o.fill || '#c9ccd3', ...stroke(3.5) }, g);
    S('circle', { cx: 0, cy: 0, r: 44, fill: o.face || '#e3e5ea', stroke: '#9a9ea8', 'stroke-width': 2 }, g);
    K.rrect(g, -38, -17, 76, 34, 5, '#17181d', 2.5);
    const disp = K.mono(g, 0, 9, o.n || '0000', { size: 24, weight: 700, fill: '#f2f0ea', anchor: 'middle', ls: 2 });
    if (o.label) g.label = K.pill(g, 0, -150, o.label, { anchor: 'middle', size: 20, padX: 12, padY: 12, fill: o.labelFill || C.dark });
    g.disp = disp; g.plunger = pl;
    // the digits are a pure function of t (a timeline set of "0009" would be read by GSAP as the number 9)
    const vals = [[-1, o.n || '0000']];
    X.every((t) => { let v = vals[0][1]; for (const [tt, s] of vals) if (t >= tt) v = s; if (disp.textContent !== v) disp.textContent = v; });
    g.press = (t, val, sfx = true) => {
      X.tl.to(pl, { y: 12, duration: 0.05, ease: 'power2.in' }, t);
      X.tl.to(pl, { y: 0, duration: 0.09, ease: 'power2.out' }, t + 0.06);
      if (val != null) { vals.push([t + 0.04, String(val).padStart(4, '0')]); vals.sort((a, b) => a[0] - b[0]); }
      if (sfx) X.sfx(t, 'click', { gain: 0.32, pitch: 0.9 });
    };
    return g;
  };
  /** Live headcount board: dark card, IN and OUT counters, a difference line. */
  K.headBoard = (p, x, y, w = 380, h = 250, o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 7, y: y + 9, width: w, height: h, rx: 14, fill: C.shadow }, g);
    K.rrect(g, x, y, w, h, 14, o.fill || '#17181d', 3);
    g.dot = S('circle', { cx: x + 26, cy: y + 30, r: 6, fill: C.green }, g);
    K.mono(g, x + 42, y + 37, o.title || 'LIVE HEADCOUNT', { size: 19, weight: 600, fill: '#e9e7e2', ls: 1.5 });
    S('path', { d: `M${x + 16},${y + 54} L${x + w - 16},${y + 54} M${x + w / 2},${y + 66} L${x + w / 2},${y + h - 62}`, stroke: '#33353c', 'stroke-width': 2 }, g);
    K.mono(g, x + w / 4, y + 92, 'IN', { size: 20, weight: 600, fill: '#8d909a', anchor: 'middle', ls: 2 });
    K.mono(g, x + w * 3 / 4, y + 92, 'OUT', { size: 20, weight: 600, fill: '#8d909a', anchor: 'middle', ls: 2 });
    g.inN = K.text(g, x + w / 4, y + 166, o.in ?? '0', { size: 72, weight: 900, font: 'Oswald, sans-serif', fill: '#f2f0ea', anchor: 'middle' });
    g.outN = K.text(g, x + w * 3 / 4, y + 166, o.out ?? '0', { size: 72, weight: 900, font: 'Oswald, sans-serif', fill: '#f2f0ea', anchor: 'middle' });
    S('path', { d: `M${x + 16},${y + h - 54} L${x + w - 16},${y + h - 54}`, stroke: '#33353c', 'stroke-width': 2 }, g);
    g.delta = K.mono(g, x + w / 2, y + h - 20, o.delta || 'in − out = 0', { size: 22, weight: 700, fill: '#7fe0a0', anchor: 'middle', ls: 1 });
    g.box = { x, y, w, h };
    return g;
  };

  // ------------------------------------------------------------------ the maze (top view)
  /** Hedge maze (depth-first, seeded). Returns g with .cell(c, r) -> [x, y] centre and .route: the cell path from the
   *  entrance (0,0) to the farthest dead end. */
  K.maze = (p, x, y, cols, rows, cell, seed = 7) => {
    const g = G(p, {});
    const rnd = X.rand(seed);
    const id = (c, r) => r * cols + c;
    const wallsR = new Array(cols * rows).fill(true), wallsB = new Array(cols * rows).fill(true);
    const seen = new Array(cols * rows).fill(false);
    const parent = new Array(cols * rows).fill(-1), depth = new Array(cols * rows).fill(0);
    const stack = [[0, 0]]; seen[0] = true;
    while (stack.length) {
      const [c, r] = stack[stack.length - 1];
      const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows && !seen[id(a, b)]);
      if (!nb.length) { stack.pop(); continue; }
      const [a, b] = nb[Math.floor(rnd() * nb.length)];
      if (a > c) wallsR[id(c, r)] = false; else if (a < c) wallsR[id(a, b)] = false; else if (b > r) wallsB[id(c, r)] = false; else wallsB[id(a, b)] = false;
      seen[id(a, b)] = true; parent[id(a, b)] = id(c, r); depth[id(a, b)] = depth[id(c, r)] + 1;
      stack.push([a, b]);
    }
    const W = cols * cell, H = rows * cell;
    S('rect', { x: x + 8, y: y + 10, width: W, height: H, rx: 10, fill: C.shadow }, g);
    K.rrect(g, x, y, W, H, 10, '#e7eedf', 3);
    let d = `M${x + cell},${y} L${x + W},${y} L${x + W},${y + H - cell} M${x + W - cell},${y + H} L${x},${y + H} L${x},${y} `;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const X0 = x + c * cell, Y0 = y + r * cell;
      if (wallsR[id(c, r)] && c < cols - 1) d += `M${X0 + cell},${Y0} L${X0 + cell},${Y0 + cell} `;
      if (wallsB[id(c, r)] && r < rows - 1) d += `M${X0},${Y0 + cell} L${X0 + cell},${Y0 + cell} `;
    }
    S('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    S('path', { d, fill: 'none', stroke: C.hedge, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    g.cell = (c, r) => [x + (c + 0.5) * cell, y + (r + 0.5) * cell];
    let far = 0;
    for (let i = 0; i < depth.length; i++) if (depth[i] > depth[far]) far = i;
    const route = [];
    for (let i = far; i >= 0; i = parent[i]) { route.unshift([i % cols, Math.floor(i / cols)]); if (i === 0) break; }
    g.route = route; g.box = { x, y, W, H };
    return g;
  };

  // ------------------------------------------------------------------ props
  /** Coffin prop with the lost guest asleep inside, lid slid aside, popcorn. */
  K.coffin = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    K.shadow(g, 10, 44, 190, 14);
    const hex = 'M-170,0 L-130,-44 L150,-38 L184,0 L150,38 L-130,44 Z';
    S('path', { d: hex, fill: '#6b4a3a', ...stroke(3) }, g);
    S('path', { d: 'M-150,0 L-120,-30 L140,-26 L166,0 L140,26 L-120,30 Z', fill: '#e9ddd2', ...stroke(2.5) }, g);
    S('ellipse', { cx: -104, cy: 0, rx: 30, ry: 22, fill: '#fff', ...stroke(2.5) }, g);
    K.rrect(g, -80, -24, 210, 48, 22, '#5b6b8c', 2.5);
    S('path', { d: 'M-60,-24 L-60,24', stroke: '#4a5878', 'stroke-width': 3 }, g);
    S('circle', { cx: -100, cy: 0, r: 22, fill: C.skin2, ...stroke(2.5) }, g);
    S('path', { d: 'M-122,-4 C-126,-24 -110,-30 -96,-26 C-84,-24 -78,-14 -80,-4 C-86,-14 -100,-18 -122,-4 Z', fill: '#5a3b22', ...stroke(2) }, g);
    S('path', { d: 'M-108,2 q4,4 8,0 M-96,2 q4,4 8,0', fill: 'none', ...stroke(2.2) }, g);
    const pop = G(g, {});
    S('path', { d: 'M40,-62 L76,-62 L72,-22 L44,-22 Z', fill: '#fff', ...stroke(2.5) }, pop);
    S('path', { d: 'M50,-62 L52,-22 M60,-62 L60,-22 M70,-62 L66,-22', stroke: C.red, 'stroke-width': 5 }, pop);
    [[46, -66], [56, -72], [66, -68], [74, -64], [60, -62]].forEach(([cx, cy]) => S('circle', { cx, cy, r: 7, fill: '#fbf2d5', ...stroke(2) }, pop));
    const lid = G(g, {});
    S('path', { d: hex, fill: '#7d5845', ...stroke(3), transform: 'translate(60 -96) rotate(-7)' }, lid);
    S('path', { d: 'M-120,0 L140,0', stroke: '#5f4334', 'stroke-width': 4, transform: 'translate(60 -96) rotate(-7)' }, lid);
    g.lid = lid; g.pop = pop;
    return g;
  };
  /** Fog bank: soft white blobs that roll out from (x,y), grow, drift and fade (pure function of t). */
  K.fog = (p, x, y, t0, t1, o = {}) => {
    const g = G(p, {});
    const rnd = X.rand(o.seed || 3), n = o.n || 12;
    const blobs = [];
    for (let i = 0; i < n; i++) blobs.push([S('circle', { cx: x, cy: y, r: 1, fill: o.fill || '#ffffff', stroke: o.line || '#dcd8d1', 'stroke-width': 2.5, opacity: 0 }, g), rnd(), rnd(), rnd()]);
    X.every((t) => blobs.forEach(([c, a, b, d], i) => {
      const u = t - t0 - i * (o.gap ?? 0.1);
      if (u < 0 || t > t1 + 0.5) { c.setAttribute('opacity', 0); return; }
      const k = 1 - Math.exp(-u / (o.grow ?? 0.7));
      const r = (o.r || 56) * (0.35 + 0.65 * k) * (0.7 + 0.6 * a);
      c.setAttribute('cx', (x + (o.dx ?? 300) * k * (0.25 + 0.95 * b) + Math.sin(t * 1.1 + i) * 8).toFixed(1));
      c.setAttribute('cy', (y - (o.dy ?? 60) * k * (d - 0.3) + Math.cos(t * 0.9 + i) * 5).toFixed(1));
      c.setAttribute('r', r.toFixed(1));
      c.setAttribute('opacity', (Math.min(1, u * 6) * (t > t1 ? Math.max(0, 1 - (t - t1) / 0.5) : 1) * (o.op ?? 0.96)).toFixed(2));
    }));
    return g;
  };
  K.fogMachine = (p, x, y, s = 1, o = {}) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    K.shadow(g, 6, 4, 90, 10);
    S('path', { d: 'M-70,-90 L-58,-102 L78,-102 L66,-90 Z', fill: C.dark3, ...stroke(3) }, g);
    S('path', { d: 'M66,-90 L78,-102 L78,-12 L66,0 Z', fill: '#0f1013', ...stroke(3) }, g);
    K.rrect(g, -70, -90, 136, 90, 6, C.dark, 3);
    K.rrect(g, 66, -62, 34, 22, 4, '#3a3c43', 3);
    K.mono(g, -54, -54, o.label || 'FOG', { size: 24, weight: 800, fill: '#fff', ls: 2 });
    g.led = S('circle', { cx: 46, cy: -66, r: 6, fill: '#3fd48a' }, g);
    for (let i = 0; i < 3; i++) S('path', { d: `M-54,${-34 + i * 9} l60,0`, stroke: '#34363d', 'stroke-width': 3 }, g);
    g.nozzle = [x + 100 * s, y - 51 * s];
    return g;
  };
  K.detector = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-60,-26 L60,-26', ...stroke(4) }, g);
    S('path', { d: 'M-46,-22 L46,-22 L42,2 C30,12 -30,12 -42,2 Z', fill: '#fff', ...stroke(3) }, g);
    S('path', { d: 'M-24,-6 l48,0 M-18,2 l36,0', stroke: '#c9c6c0', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    g.led = S('circle', { cx: 30, cy: -10, r: 5, fill: '#3fd48a', ...stroke(1.5) }, g);
    return g;
  };
  K.firetruck = (p, x, y, s = 1) => {
    const g = K.van(p, x, y, s, { fill: '#c9533d', label: 'FIRE', labelFill: '#fff' });
    S('rect', { x: -112, y: -128, width: 140, height: 12, fill: '#d9d6d0', ...stroke(2.5) }, g);
    for (let i = 0; i < 7; i++) S('path', { d: `M${-104 + i * 20},-128 l0,12`, ...stroke(2) }, g);
    K.rrect(g, 52, -96, 34, 12, 4, '#4a79ce', 2);
    S('path', { d: 'M-118,-40 L40,-40', stroke: '#fff', 'stroke-width': 6 }, g);
    return g;
  };
  /** Pressure mat on the floor (seen from slightly above) with hazard stripes; pad.press(t) lights it. */
  K.pad = (p, x, y, w = 220, o = {}) => {
    const g = G(p, {});
    const h = w * 0.3, sk = w * 0.16;
    S('path', { d: `M${x + 6},${y + 8} L${x + w + 6},${y + 8} L${x + w + sk + 6},${y + h + 8} L${x + sk + 6},${y + h + 8} Z`, fill: C.shadow }, g);
    S('path', { d: `M${x},${y} L${x + w},${y} L${x + w + sk},${y + h} L${x + sk},${y + h} Z`, fill: '#3a3c43', ...stroke(3) }, g);
    const lit = S('path', { d: `M${x + 10},${y + 6} L${x + w - 10},${y + 6} L${x + w + sk - 14},${y + h - 6} L${x + sk + 14},${y + h - 6} Z`, fill: C.yellow, opacity: 0 }, g);
    for (let i = 0; i < 8; i++) { const xx = x + sk + 10 + i * (w - 20) / 8; S('path', { d: `M${xx},${y + h} l${(w - 20) / 16},0 l-8,-10 l${-(w - 20) / 16},0 Z`, fill: C.yellow2 }, g); }
    K.mono(g, x + w / 2 + sk / 2, y + h / 2 + 8, o.label || 'PAD', { size: 22, weight: 800, fill: '#fff', anchor: 'middle', ls: 3 });
    g.press = (t, hold = 0.35) => { X.tl.set(lit, { opacity: 0.85 }, t); X.tl.to(lit, { opacity: 0, duration: 0.25 }, t + hold); };
    g.lit = lit;
    return g;
  };
  /** Radio earpiece with a coiled wire; ep.buzz(t) shakes it and pulses three arcs. */
  K.earpiece = (p, x, y, s = 1) => {
    const outer = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const g = G(outer, {});
    S('path', { d: 'M0,10 C-4,40 14,50 6,74 C0,92 16,100 10,120', fill: 'none', ...stroke(4) }, g);
    S('path', { d: 'M-26,10 C-44,-14 -32,-50 -2,-52 C26,-54 36,-24 20,-2 C10,12 -12,22 -26,10 Z', fill: C.dark2, ...stroke(3) }, g);
    S('circle', { cx: -4, cy: -22, r: 12, fill: '#55576a', ...stroke(2) }, g);
    const waves = G(g, {});
    [22, 40, 58].forEach((r) => S('path', { d: `M${36 + r * 0.2},${-22 - r * 0.7} A${r},${r} 0 0,1 ${36 + r * 0.2},${-22 + r * 0.7}`, fill: 'none', stroke: C.red, 'stroke-width': 6, 'stroke-linecap': 'round' }, waves));
    gsap.set(waves, { opacity: 0 });
    g.buzz = (t, n = 3) => {
      for (let i = 0; i < n; i++) { X.tl.set(waves, { opacity: 1 }, t + i * 0.16); X.tl.set(waves, { opacity: 0.25 }, t + i * 0.16 + 0.08); }
      X.tl.set(waves, { opacity: 0 }, t + n * 0.16);
      K.shake(g, t, 5, n * 0.16);
      X.sfx(t, 'beep', { gain: 0.18, pitch: 0.7, dur: 0.3 });
    };
    outer.buzz = g.buzz;
    return outer;
  };
  /** Red warning beacon; b.on(t) lights it and spins two rays. */
  K.beacon = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    const rays = G(g, {});
    S('path', { d: 'M0,-62 L150,-110 L150,-14 Z M0,-62 L-150,-110 L-150,-14 Z', fill: '#ff6a4d', opacity: 0.28 }, rays);
    gsap.set(rays, { opacity: 0 });
    K.rrect(g, -46, -22, 92, 22, 5, C.dark, 3);
    const dome = S('path', { d: 'M-34,-22 L-34,-62 C-34,-92 34,-92 34,-62 L34,-22 Z', fill: '#efd2c8', ...stroke(3) }, g);
    S('path', { d: 'M-18,-70 C-18,-80 -8,-84 0,-84', stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    g.on = (t, t1 = Infinity) => {
      X.tl.set(dome, { attr: { fill: '#e2452e' } }, t);
      X.tl.set(rays, { opacity: 1 }, t);
      X.every((tt) => { if (tt < t || tt > t1) return; rays.setAttribute('transform', `rotate(${(((tt - t) * 260) % 360).toFixed(1)} 0 -62)`); });
    };
    return g;
  };
  /** Brick wall with a hidden door painted to match; w.open(t) swings the door to reveal a lit EXIT. */
  K.wall = (p, x, y, w, h, o = {}) => {
    const g = G(p, {});
    S('rect', { x: x + 7, y: y + 9, width: w, height: h, rx: 6, fill: C.shadow }, g);
    const bricks = (gg, x0, y0, ww, hh) => {
      K.rrect(gg, x0, y0, ww, hh, 4, o.fill || '#e8dccd', 3);
      let d = '';
      for (let r = 1; r * 34 < hh; r++) { d += `M${x0},${y0 + r * 34} L${x0 + ww},${y0 + r * 34} `; for (let c = (r % 2) * 36; c < ww; c += 72) d += `M${x0 + c},${y0 + (r - 1) * 34} L${x0 + c},${y0 + r * 34} `; }
      S('path', { d, stroke: '#cdbca8', 'stroke-width': 3 }, gg);
    };
    bricks(g, x, y, w, h);
    const dw = o.dw || 130, dh = o.dh || h * 0.72, dx = x + (o.dx ?? (w - dw) / 2), dy = y + h - dh;
    const hole = G(g, {});
    K.rrect(hole, dx, dy, dw, dh, 3, '#1b1c21', 3);
    K.pill(hole, dx + dw / 2, dy + 22, 'EXIT', { anchor: 'middle', fill: C.green, size: 22, padX: 12, padY: 10, font: K.F.label, weight: 800 });
    S('path', { d: `M${dx + dw / 2},${dy + dh - 20} l0,-60 M${dx + dw / 2 - 18},${dy + dh - 62} l18,-20 l18,20`, stroke: '#3fd48a', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, hole);
    const door = G(g, {});
    const clip = S('clipPath', { id: 'wd' + Math.round(dx) + Math.round(dy) }, X.defs);
    S('rect', { x: dx, y: dy, width: dw, height: dh }, clip);
    const dg = G(door, { 'clip-path': `url(#${clip.id})` });
    bricks(dg, x, y, w, h);
    const seam = S('rect', { x: dx, y: dy, width: dw, height: dh, fill: 'none', stroke: o.seam || '#cdbca8', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, door);
    gsap.set(door, { svgOrigin: `${dx} ${dy}` });
    g.open = (t) => {
      X.tl.to(door, { scaleX: 0.08, duration: 0.28, ease: 'power3.inOut' }, t);
      X.sfx(t, 'slide', { gain: 0.3 });
    };
    g.seam = seam; g.hole = hole; g.door = door; g.doorBox = { x: dx, y: dy, w: dw, h: dh };
    return g;
  };
  /** Floor plan card: four rooms, a corridor, detector dots (g.dots, hidden until shown). */
  K.floorplan = (p, x, y, w = 420, h = 300, o = {}) => {
    const g = K.card(p, x, y, w, h, { r: 14 });
    K.mono(g, x + 20, y + 36, o.title || 'FLOOR PLAN', { size: 20, weight: 700, ls: 1 });
    const ix = x + 20, iy = y + 54, iw = w - 40, ih = h - 74;
    S('rect', { x: ix, y: iy, width: iw, height: ih, fill: '#f4f2ee', ...stroke(3) }, g);
    S('path', { d: `M${ix + iw / 2},${iy} L${ix + iw / 2},${iy + ih * 0.42} M${ix + iw / 2},${iy + ih * 0.62} L${ix + iw / 2},${iy + ih} M${ix},${iy + ih / 2} L${ix + iw * 0.2},${iy + ih / 2} M${ix + iw * 0.32},${iy + ih / 2} L${ix + iw * 0.68},${iy + ih / 2} M${ix + iw * 0.8},${iy + ih / 2} L${ix + iw},${iy + ih / 2}`, ...stroke(3) }, g);
    const rc = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
    rc.forEach(([fx, fy], i) => K.mono(g, ix + iw * fx - 30, iy + ih * fy - 18, String(i + 1), { size: 20, weight: 700, fill: '#9a978f' }));
    g.dots = rc.map(([fx, fy], i) => { const d = G(g, {}); S('circle', { cx: ix + iw * fx + 12, cy: iy + ih * fy + 8, r: 13, fill: '#fff', stroke: C.red, 'stroke-width': 4 }, d); S('circle', { cx: ix + iw * fx + 12, cy: iy + ih * fy + 8, r: 5, fill: C.red }, d); gsap.set(d, { autoAlpha: 0 }); return d; });
    g.rooms = rc.map(([fx, fy]) => [ix + iw * fx, iy + ih * fy]);
    return g;
  };
  /** A pumpkin (decor). */
  K.pumpkin = (p, x, y, s = 1) => {
    const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
    S('path', { d: 'M-2,-40 C-4,-52 2,-58 10,-58', fill: 'none', stroke: '#5f8462', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    S('ellipse', { cx: 0, cy: -20, rx: 34, ry: 24, fill: C.pumpkin, ...stroke(3) }, g);
    S('path', { d: 'M-10,-43 C-18,-30 -18,-10 -10,3 M10,-43 C18,-30 18,-10 10,3', fill: 'none', stroke: C.pumpkinS, 'stroke-width': 3 }, g);
    return g;
  };
  /** Speech bubble for the narrator-less "BOO!" moments (thick, condensed). */
  K.booBubble = (p, x, y, str = 'BOO!', o = {}) => K.bubble(p, x, y, str, { size: o.size || 48, weight: 900, font: 'Oswald, sans-serif', fill: o.fill || '#fff', tail: o.tail || 'left', ...o });
  /** A soft red glow (for the last counter): blurred circle, own filter. */
  K.redGlow = (p, cx, cy, r, op = 0.5) => {
    if (!X.defs.querySelector('#rglow')) { const f = S('filter', { id: 'rglow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, X.defs); S('feGaussianBlur', { stdDeviation: 34 }, f); }
    return S('ellipse', { cx, cy, rx: r, ry: r * 0.62, fill: C.glow, opacity: op, filter: 'url(#rglow)' }, p);
  };
})();
