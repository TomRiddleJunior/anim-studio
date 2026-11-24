/* layer-stack-emotional — "What it really takes to bring a lost dog home".
 * The layer-stack format (warm canvas, static presenter, a set rebuilt per chapter, the numbered layer stack, red
 * failure stamps, karaoke captions, halftone "months later" wipe, Friday callback) with a warmer tone: one fictional
 * dog (Maple), a slower female read, a soft felt-piano bed, and a callback that ends on a green "SHE'S HOME" stamp. */
X.boot(async (X) => {
  await X.loadVO();
  const spec = await (await fetch('script.json')).json();
  const C = K.C, S = K.S, G = K.G;
  K.canvas();
  K.BUMP.amp = 84;
  const ids = spec.lines.map((l) => l.id);
  const END = X.vo.duration;
  const T0 = ids.map((id, i) => (i === 0 ? 0 : X.line(id).start - 0.1));
  const T1 = ids.map((id, i) => (i < ids.length - 1 ? T0[i + 1] : END));
  const wd = (id, w, n = 0) => X.word(id, w, n);
  const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9$%']/g, '');
  const wx = (id, w, n = 0) => { const ws = X.line(id).words.filter((x) => nrm(x.w) === nrm(w)); return (ws[n] || ws[0] || X.line(id)).start; };
  const W = (p) => G(p, {}); // animation wrapper (never tween a group that carries a transform attribute)
  const NUM = '899 000 417 202 365'; // fictional: 899 is outside the 900-998 manufacturer range
  const PHONE = '555-0142', PHONE2 = '555-0187'; // 555-01xx: reserved for fiction
  const LAY = [['01', 'COLLAR TAG'], ['02', 'MICROCHIP'], ['03', 'REGISTRY'], ['04', 'UPDATES'], ['05', 'UNIVERSAL SCAN'], ['06', 'LOOKUP']].map(([n, label]) => ({ n, label }));
  const TAGS = ['just chip her', 'maple', 'the chip', 'nobody', '53 shelters', 'registry', 'new phone', 'updates', 'silence', 'universal', 'which one?', 'lookup', 'months later', 'one friday'];
  K.tags(ids.map((id, i) => [T0[i], T1[i], `// ${String(i + 1).padStart(2, '0')} — ${TAGS[i]}`]));
  const WIDE = new Set([0, 4, 5, 12, 13]);
  const chap = (i, build) => {
    const holder = WIDE.has(i) ? K.world : G(K.world, { transform: 'translate(660 850) scale(1.15) translate(-660 -850)' });
    const g = X.scene(ids[i], T0[i], T1[i], null, holder);
    const o = X.scene(ids[i] + 'o', T0[i], T1[i], null, K.over);
    build(g, o, T0[i], T1[i], ids[i], i);
  };
  const miniStack = (p, x, y, w, n, tNew, o = {}) => {
    const st = K.stack(p, x, y, w, LAY.slice(0, n), { fresh: n - 1, rh: o.rh || 40, size: o.size || 21, gap: 5 });
    if (tNew != null) {
      const r = st.rows[n - 1];
      K.slideIn(r, tNew, 'right', 320, { dur: 0.22, ease: 'power3.out', sfx: 'slide', gain: 0.22 });
      K.puff(p, x + w / 2, r.y + 44, tNew + 0.2, 0.8);
      X.sfx(tNew + 0.22, 'thud', { gain: 0.2 });
    }
    return st;
  };
  const dog = (p, x, y, s, i, o = {}) => K.dog(p, x, y, s, { t0: T0[i], t1: T1[i], ...o });
  const tick = (t, g = 0.18) => X.sfx(t, 'blip', { gain: g });
  /** Lens card: a round white magnifier inset with a dashed leader to the spot it looks at. */
  const lens = (p, cx, cy, r, tx, ty) => {
    const l = W(p);
    S('path', { d: `M${tx},${ty} L${cx + (tx - cx) * r / Math.hypot(tx - cx, ty - cy)},${cy + (ty - cy) * r / Math.hypot(tx - cx, ty - cy)}`, stroke: C.ink, 'stroke-width': 3, 'stroke-dasharray': '7 7', fill: 'none' }, l);
    S('circle', { cx: tx, cy: ty, r: 9, fill: 'none', stroke: C.ink, 'stroke-width': 3 }, l);
    S('circle', { cx: cx + 6, cy: cy + 8, r, fill: C.shadow }, l);
    S('circle', { cx, cy, r, fill: '#fff', ...K.stroke(3.5) }, l);
    return l;
  };

  // ---------------------------------------------------------------- presenter (static, holds a leash)
  const PW = W(K.pres);
  K.presenter(PW, 14, 590, 1, { prop: 'leash' });
  const zoomT = wd('c01', 'home') - 0.05;
  gsap.set(PW, { autoAlpha: 0 });
  X.tl.set(PW, { autoAlpha: 1 }, zoomT);
  X.tl.fromTo(PW, { x: -190 }, { x: 0, duration: 0.42, ease: 'power3.inOut', immediateRender: false }, zoomT);
  [[T0[4], T0[6]], [T0[12], END + 1]].forEach(([a, b]) => { X.tl.set(PW, { autoAlpha: 0 }, a); X.tl.set(PW, { autoAlpha: 1 }, b); });

  // ================================================================ 01 just chip her
  chap(0, (g, o, t0, t1, id, ci) => {
    const cam = W(g); cam.id = 'c01cam';
    gsap.set(cam, { svgOrigin: '0 0', scale: 1.37, x: -250, y: -500 });
    X.tl.to(cam, { scale: 1, x: 0, y: 0, duration: 0.42, ease: 'power3.inOut' }, zoomT);
    X.sfx(zoomT, 'woosh_low', { gain: 0.3 });
    const back = W(cam);
    S('path', { d: 'M240,1188 L1080,1188', stroke: '#d8d3ca', 'stroke-width': 3 }, back);
    K.tree(back, 300, 1188, 1.05); K.tree(back, 1040, 1188, 0.85);
    const hw = W(cam); K.house(hw, 905, 1188, 1.15, { heart: true });
    const dw = W(cam); const d = dog(dw, 560, 1188, 1.25, ci);
    d.wag(t0 + 0.1, wd(id, 'home') + 0.8, 14, 3);
    // everyone thinks...
    const bubbles = [[290, 630, "she's chipped!", false, 0.15], [580, 570, 'the chip finds her', false, 0.45], [360, 735, 'it tracks her, right?', true, 0.75]]
      .map(([x, y, s, red, dt]) => { const b = W(cam); K.bubble(b, x, y, s, { red, size: 28 }); K.pop(b, t0 + dt, { gain: 0.18, pitch: 0.9 + dt / 3 }); return b; });
    // the chip pops beside her
    const chw = W(cam); K.chip(chw, 800, 800, 1.0);
    K.pop(chw, wd(id, 'microchip'), { sfx: 'sparkle', gain: 0.2 });
    K.pulse(cam, 800, 800, 120, wd(id, 'microchip'), { before: chw, hold: 0.6 });
    // ... brings a lost dog home: a dashed path from the dog to the door
    const path = S('path', { d: 'M800,840 C880,880 905,960 905,1070', fill: 'none', stroke: C.red, 'stroke-width': 5, 'stroke-dasharray': '12 10', opacity: 0 }, cam);
    K.march(path, 40);
    X.tl.to(path, { opacity: 1, duration: 0.2 }, wd(id, 'brings'));
    X.sfx(wd(id, 'brings'), 'swoosh', { gain: 0.18 });
    d.perk(wd(id, 'lost'));
    K.pop(hw, zoomT + 0.2, { sfx: 'pop', gain: 0.2 });
    // it's a chip the size of a grain of rice
    const tC = wd(id, 'chip');
    bubbles.forEach((b, i) => K.popOut(b, tC - 0.1 + i * 0.03));
    X.tl.to(path, { opacity: 0, duration: 0.15 }, tC - 0.05);
    K.popOut(chw, tC - 0.08, 0.1);
    const big = W(cam); K.chip(big, 680, 495, 2.3);
    K.pop(big, tC, { sfx: false, bump: false });
    X.tl.to([back, hw], { opacity: 0.35, duration: 0.3 }, tC);
    X.sfx(tC - 0.05, 'whoosh', { gain: 0.22 });
    const rw = W(cam); K.rice(rw, 660, 640, 2.3);
    K.pop(rw, wd(id, 'rice') - 0.05, { sfx: 'pop', gain: 0.2 });
    const eq = K.text(cam, 410, 600, '≈', { size: 80, weight: 800, anchor: 'middle', fill: C.grey });
    K.show(eq, wd(id, 'grain'));
    const lab = W(cam);
    K.mono(lab, 1010, 508, 'microchip', { size: 22, weight: 700, anchor: 'end', fill: '#7d7b77' });
    K.mono(lab, 1010, 648, 'rice', { size: 22, weight: 700, anchor: 'end', fill: '#7d7b77' });
    K.show(lab, wd(id, 'size'));
    // with one number on it
    const nw = W(cam);
    K.card(nw, 330, 728, 640, 92, { r: 46 });
    const ntx = K.mono(nw, 650, 790, '', { size: 40, weight: 700, anchor: 'middle' });
    K.pop(nw, wd(id, 'one') - 0.05, { sfx: 'pop', gain: 0.2 });
    K.type(ntx, NUM, wd(id, 'number'), 34);
    K.pulse(cam, 650, 774, 200, wd(id, 'number') + 0.2, { before: nw, hold: 0.5 });
    // that's it
    const tI = wd(id, "That's");
    const ring = S('circle', { cx: 650, cy: 560, r: 40, fill: 'none', stroke: C.red, 'stroke-width': 2.5, opacity: 0 }, cam);
    X.tl.to(ring, { attr: { r: 430 }, opacity: 0.7, duration: 0.45, ease: 'power2.out' }, tI);
    X.tl.to(ring, { opacity: 0, duration: 0.25 }, tI + 0.4);
    X.sfx(tI, 'swoosh', { gain: 0.2 });
    const only = W(cam); K.pill(only, 880, 836, "that's all it holds", { anchor: 'middle', fill: C.dark, size: 26, padX: 18, padY: 16 });
    K.pop(only, wd(id, 'it', 2), { sfx: 'blip_up', gain: 0.2 });
    d.tilt(tI + 0.1, 12);
    K.camTo(g, wd(id, 'number') - 0.1, 1.08, 650, 780, 0.4); K.camTo(g, tI - 0.05, 1.0, 650, 780, 0.4);
    K.still(back, hw, dw);
  });

  // ================================================================ 02 maple
  chap(1, (g, o, t0, t1, id, ci) => {
    const dw = W(g); const d = dog(dw, 540, 1190, 1.3, ci);
    K.dropIn(dw, t0 + 0.03, 700, { dur: 0.24, sfx: 'drop' });
    d.wag(t0 + 0.3, wd(id, 'slips'), 20, 3.6);
    d.perk(wd(id, 'Maple') + 0.1);
    const nm = W(g);
    K.pill(nm, 470, 715, 'MAPLE', { anchor: 'middle', fill: C.teal, size: 36, padX: 24, padY: 18, font: K.F.label, weight: 900, ls: 4 });
    K.pop(nm, wd(id, 'Maple'), { sfx: 'pop', gain: 0.22 });
    gsap.set(g, { scale: 1.08, svgOrigin: '560 960' }); K.camTo(g, wd(id, 'Maple') - 0.1, 1.0, 560, 960, 0.45);
    const wf = W(g); K.bubble(wf, 700, 840, 'woof!', { size: 30, tail: 'left' });
    K.pop(wf, wd(id, 'Maple') + 0.3, { sfx: 'bubble', gain: 0.15 }); K.popOut(wf, wd(id, 'tag') - 0.05);
    // her tag: lens on it with your phone number
    const tagX = 540 + 50 * 1.3, tagY = 1190 - 124 * 1.3;
    const lw = lens(g, 860, 620, 120, tagX, tagY);
    const big = W(lw);
    S('circle', { cx: 860, cy: 606, r: 74, fill: C.brass, ...K.stroke(3) }, big);
    S('circle', { cx: 860, cy: 545, r: 9, fill: '#fff', ...K.stroke(2.5) }, big);
    K.text(big, 860, 598, 'MAPLE', { size: 26, weight: 900, anchor: 'middle', fill: '#5a4512', ls: 2 });
    const ph = K.mono(big, 860, 640, '', { size: 24, weight: 700, anchor: 'middle', fill: '#5a4512' });
    K.pop(lw, wd(id, 'tag') - 0.05, { sfx: 'pop', gain: 0.2 });
    K.type(ph, '☎ ' + PHONE, wd(id, 'phone'), 30);
    K.pulse(g, tagX, tagY, 70, wd(id, 'tag'), { before: dw, hold: 0.6 });
    d.swingTag(wd(id, 'number'));
    K.camTo(g, wd(id, 'tag') - 0.1, 1.1, 640, 820, 0.4); K.camTo(g, wd(id, 'until') - 0.2, 1.0, 640, 820, 0.35);
    // until she slips her collar under a fence
    const tU = wd(id, 'until');
    K.popOut(lw, tU - 0.05, 0.12); K.popOut(nm, tU, 0.1);
    const fw = W(g); K.fence(fw, 300, 1090, 1200, 230, { gap: 40 });
    K.slideIn(fw, tU, 'down', 400, { dur: 0.22, sfx: 'slide' });
    K.still(fw);
    const tS = wd(id, 'slips');
    d.droop(tS - 0.1);
    X.tl.to(dw, { x: 120, y: 30, duration: 0.25, ease: 'power2.in' }, tS);
    X.tl.to(dw, { x: 760, duration: 0.45, ease: 'power2.in' }, tS + 0.25);
    X.sfx(tS, 'swoosh', { gain: 0.2 }); X.sfx(tS + 0.3, 'whoosh', { gain: 0.18 });
    d.tagOff(wd(id, 'collar')); X.tl.set(d.collar, { autoAlpha: 0 }, wd(id, 'collar'));
    // the collar stays on the fence nail, swinging
    const cw = W(g); const cp = K.collarProp(cw, 560, 1010, 1.15);
    K.show(cw, wd(id, 'collar'));
    X.tl.fromTo(cp.sw, { rotation: 38 }, { rotation: 0, duration: 1.6, ease: 'elastic.out(1,0.25)', immediateRender: false }, wd(id, 'collar'));
    X.sfx(wd(id, 'collar') + 0.05, 'click', { gain: 0.3 });
    K.shake(fw, wd(id, 'fence'), 5, 0.3);
    // paw prints away to the right
    [0, 1, 2, 3, 4].forEach((i) => { const pp = W(g); K.paw(pp, 760 + i * 70, 1240 - (i % 2) * 22, 0.7, '#b9b3a8'); K.pop(pp, wd(id, 'under') + i * 0.12, { sfx: i % 2 ? false : 'tick', gain: 0.1, bump: false }); });
    // and the tag stays behind
    const tB = wd(id, 'behind');
    K.pulse(g, 560, 1100, 110, wd(id, 'stays'), { before: cw, hold: 0.9 });
    X.tl.fromTo(cp.sw, { rotation: -14 }, { rotation: 0, duration: 1.2, ease: 'elastic.out(1,0.3)', immediateRender: false }, wd(id, 'stays'));
    const st = K.stamp(o, 615, 820, 'LEFT BEHIND', { size: 112, rot: -7 });
    K.pulse(o, 615, 820, 240, tB, { hold: 0.7 });
    K.slam(st, tB, { gain: 0.3 });
  });

  // ================================================================ 03 the chip
  chap(2, (g, o, t0, t1, id, ci) => {
    const dw = W(g); const d = dog(dw, 470, 1190, 1.2, ci, { tag: false });
    K.slideIn(dw, t0 + 0.03, 'left', 500, { dur: 0.2, sfx: 'swoosh', gain: 0.18 });
    d.wag(t0 + 0.3, t0 + 1.6, 12, 2.5);
    // the stack: 01 collar tag, 02 microchip
    const sw = W(g); miniStack(sw, 760, 1060, 260, 2, wd(id, 'chip') + 0.1, { rh: 44, size: 22 });
    K.still(sw);
    // lens: the chip under her skin
    const sx = 470 - 6 * 1.2, sy = 1190 - 132 * 1.2;
    const lw = lens(g, 860, 600, 115, sx, sy);
    const chip = K.chip(lw, 860, 600, 1.3);
    K.mono(lw, 860, 686, 'under the skin', { size: 18, weight: 600, anchor: 'middle', fill: '#8d8a84' });
    K.pop(lw, wd(id, 'chip') - 0.08, { sfx: 'pop', gain: 0.22 });
    K.pulse(g, sx, sy, 70, wd(id, 'chip'), { before: dw, hold: 0.5 });
    // what it holds: a terminal card types it out (id, no power, no GPS)
    const tw = W(g);
    const term = K.terminal(tw, 300, 440, 410, 210, 'MICROCHIP', { ver: 'passive', n: 3, size: 24 });
    K.slideIn(tw, t0 + 0.05, 'left', 700, { rot: -6, dur: 0.24, origin: '505 545', sfx: 'slide', gain: 0.2 });
    term.typeLine(0, 'id   ' + NUM, wd(id, 'chip') + 0.15, 42);
    term.typeLine(1, 'battery  none ✗', wd(id, 'battery') - 0.05, 40);
    term.typeLine(2, 'GPS      none ✗', wd(id, 'GPS') - 0.05, 40);
    X.tl.set(term.lines[1], { attr: { fill: '#ff8a7a' } }, wd(id, 'battery') + 0.35);
    X.tl.set(term.lines[2], { attr: { fill: '#ff8a7a' } }, wd(id, 'GPS') + 0.35);
    K.pulse(g, 505, 590, 150, wd(id, 'GPS') + 0.2, { before: tw, hold: 0.6 });
    // a scanner wakes it up
    const tSc = wd(id, 'scanner');
    const scw = W(g); const sc = K.scanner(scw, 440, 1035, 0.82, { up: true, label: 'SCANNER' });
    K.slideIn(scw, tSc - 0.05, 'right', 600, { dur: 0.22, sfx: 'whoosh', gain: 0.2 });
    X.tl.to(scw, { x: 30, duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, tSc + 0.25);
    sc.beam(wd(id, 'wakes'), wd(id, 'Now'));
    chip.lit(wd(id, 'wakes'));
    K.pulse(g, 860, 600, 150, wd(id, 'wakes'), { before: lw, hold: 0.8, fill: C.yellow });
    K.camTo(g, wd(id, 'wakes') - 0.1, 1.08, 640, 800, 0.4); K.camTo(g, wd(id, 'Now') - 0.12, 1.0, 640, 800, 0.4);
    X.sfx(wd(id, 'wakes'), 'rise', { gain: 0.15 });
    // ... and it answers with one number
    const tA = wd(id, 'answers');
    K.stream(g, 6, (it, i) => K.mono(it, 0, 0, '89904172'[i] || '0', { size: 30, weight: 800, fill: C.blue, anchor: 'middle' }), (u) => [860 - u * 400, 620 + u * 170], tA, 0.12, 0.45, { fade: true, sfx: false });
    X.tl.set(sc.disp, { textContent: 'BEEP ✓' }, wd(id, 'number'));
    X.sfx(wd(id, 'number'), 'beep', { gain: 0.18 });
    K.say(g, 300, 688, NUM, wd(id, 'with'), { tail: 'left', size: 30, font: K.F.mono, out: wd(id, 'Now') - 0.05 });
    d.perk(wd(id, 'number'));
    // now she carries it everywhere
    const tN = wd(id, 'Now');
    K.flyOut(scw, tN - 0.05, 600, -200, 0.22); K.flyOut(lw, tN - 0.02, 500, -300, 0.22); K.flyOut(tw, tN - 0.04, -600, -100, 0.22);
    const places = [[340, 790, 'park', (p) => K.tree(p, 340, 760, 1.1)], [540, 720, 'home', (p) => K.house(p, 540, 690, 0.62)], [760, 790, 'car', (p) => K.van(p, 760, 762, 0.62, { fill: C.blueL })]];
    places.forEach(([x, y, s, ic], i) => { const pw = W(g); ic(pw); K.pill(pw, x, y + 10, s + ' ✓', { anchor: 'middle', fill: C.green, size: 22, padX: 12, padY: 12 }); K.pop(pw, wd(id, 'carries') + i * 0.12, { sfx: i ? false : 'sparkle', gain: 0.16 }); });
    d.hop(wd(id, 'everywhere')); d.happy(wd(id, 'everywhere')); d.wag(wd(id, 'carries'), t1, 20, 4);
  });

  // ================================================================ 04 nobody
  chap(3, (g, o, t0, t1, id, ci) => {
    const shw = W(g); K.shelter(shw, 560, 790, 290, 200, { label: 'SHELTER' });
    K.dropIn(shw, wd(id, 'shelter') - 0.15, 600, { dur: 0.24 });
    K.still(shw);
    const dw = W(g); const d = dog(dw, 440, 1190, 1.1, ci, { tag: false });
    K.slideIn(dw, t0 + 0.05, 'left', 600, { dur: 0.2 });
    const out = W(g); K.pill(out, 300, 1240, 'out again', { fill: C.red, size: 20, padX: 12, padY: 12 });
    K.pop(out, wd(id, 'out'), { sfx: 'blip', gain: 0.18 }); K.popOut(out, wd(id, 'shelter'));
    const vw = W(g); K.person(vw, 900, 1290, 1.25, { skin: C.skin2, shirt: '#5b8c86', hairC: '#5a3b22' });
    K.slideIn(vw, wd(id, 'shelter'), 'right', 500, { dur: 0.2, gain: 0.18 });
    const who = W(g); K.bubble(who, 700, 920, 'who do you belong to?', { size: 24, tail: 'right' });
    K.pop(who, wd(id, 'shelter') + 0.25, { sfx: 'bubble', gain: 0.15 }); K.popOut(who, wd(id, 'reads') - 0.05);
    // the scan
    const scw = W(g); const sc = K.scanner(scw, 410, 1035, 0.62, { up: true });
    K.slideIn(scw, wd(id, 'scans') - 0.1, 'right', 400, { dur: 0.2, sfx: 'swoosh', gain: 0.18 });
    X.tl.to(scw, { x: 24, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, wd(id, 'scans') + 0.1);
    sc.beam(wd(id, 'scans'), wd(id, 'points'));
    X.tl.set(sc.disp, { textContent: 'BEEP' }, wd(id, 'reads'));
    X.sfx(wd(id, 'reads'), 'beep', { gain: 0.16 });
    K.say(g, 520, 820, NUM, wd(id, 'reads'), { tail: 'left', size: 26, font: K.F.mono });
    // it points to nobody
    const tP = wd(id, 'points');
    const ar = S('path', { d: 'M890,820 C960,760 950,700 900,664', fill: 'none', stroke: C.ink, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, g);
    gsap.set(ar, { opacity: 0 }); X.tl.to(ar, { opacity: 1, duration: 0.15 }, tP - 0.1); K.march(ar, 40);
    { const L = ar.getTotalLength(); K.stream(g, 10, (it) => S('circle', { cx: 0, cy: 0, r: 9, fill: C.blue, ...K.stroke(2) }, it), (u) => { const pt = ar.getPointAtLength(u * L); return [pt.x, pt.y]; }, tP, 0.3, 0.5, { sfx: false, until: t1 }); }
    const rc = W(g); const card = K.recordCard(rc, 712, 440, 300, [['NUMBER', '…417 202 365'], ['OWNER', ''], ['PHONE', '']], { rh: 50, size: 18, title: 'REGISTRY' });
    K.dropIn(rc, tP - 0.05, 500, { dur: 0.24, sfx: 'paper', gain: 0.2 });
    const tNb = wd(id, 'nobody');
    card.vals.slice(1).forEach((v, i) => { X.tl.set(v, { textContent: '— none —', attr: { fill: C.red } }, tNb + i * 0.12); tick(tNb + i * 0.12, 0.14); });
    K.pulse(g, 880, 560, 170, tNb, { before: rc, hold: 0.9 });
    [[960, 500], [1000, 600], [690, 470]].forEach(([x, y], i) => { const q = W(g); K.qmark(q, x, y, 52, '#9a978f'); K.pop(q, tNb + 0.15 + i * 0.1, { gain: 0.12, bump: false }); });
    d.droop(tNb); d.tilt(tNb + 0.1, -6);
    K.camTo(g, tNb - 0.1, 1.1, 900, 600, 0.4); K.camTo(g, wd(id, 'registered') - 0.2, 1.0, 900, 600, 0.35);
    // you never registered it
    const st = K.stamp(o, 615, 770, 'UNREGISTERED', { size: 104, rot: -8 });
    K.pulse(o, 615, 770, 250, wd(id, 'registered'), { hold: 0.7 });
    K.slam(st, wd(id, 'registered'), { gain: 0.3 });
    K.still(rc);
  });

  // ================================================================ 05 53 shelters (full frame, no presenter)
  chap(4, (g, o, t0, t1, id, ci) => {
    gsap.set(g, { scale: 1.14, svgOrigin: '540 700' }); K.camTo(g, t0 + 0.1, 1.0, 540, 700, 0.5);
    const top = W(g);
    K.mono(top, 80, 410, 'ONE STUDY · 53 US SHELTERS · 2007–08', { size: 24, weight: 700, fill: C.tagGrey, ls: 2 });
    K.show(top, t0 + 0.05);
    const hs = W(g);
    const t53 = wd(id, 'study');
    for (let i = 0; i < 53; i++) {
      const r = Math.floor(i / 18), c = i % 18;
      const hh = W(hs); K.house(hh, 102 + c * 52 + (r % 2) * 14, 512 + r * 66, 0.24, { heart: false, lit: (i * 7) % 5 !== 0 });
      gsap.set(hh, { autoAlpha: 0 });
      X.tl.set(hh, { autoAlpha: 1 }, t53 + i * 0.018);
      X.tl.fromTo(hh, { y: -40 }, { y: 0, duration: 0.14, ease: 'back.out(2)', immediateRender: false }, t53 + i * 0.018);
      if (i % 9 === 0) X.sfx(t53 + i * 0.018, 'tick', { gain: 0.08, pitch: 1 + i * 0.01 });
    }
    // 100 looked-up chips
    const grid = W(g); const chips = [];
    const tG = wd(id, 'only') - 0.12;
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
      const cg = W(grid); const ch = K.chipMini(cg, 130 + c * 91, 760 + r * 56, 1.45);
      chips.push(ch);
      gsap.set(cg, { autoAlpha: 0 });
      X.tl.set(cg, { autoAlpha: 1 }, tG + r * 0.035);
      X.tl.fromTo(cg, { y: 60 }, { y: 0, duration: 0.16, ease: 'back.out(1.6)', immediateRender: false }, tG + r * 0.035);
    }
    X.sfx(tG, 'slide', { gain: 0.2 });
    const lab = W(g); K.mono(lab, 80, 708, 'CHIPS THE SHELTERS LOOKED UP', { size: 22, weight: 700, fill: C.tagGrey, ls: 2 });
    const cnt = K.text(lab, 1000, 712, 'registered: 0', { size: 40, weight: 900, font: 'Oswald, sans-serif', anchor: 'end', fill: C.green });
    K.show(lab, tG);
    const tCh = wd(id, 'chips') - 0.1;
    X.countUp(cnt, 0, 58, tCh, 0.85, (v) => 'registered: ' + Math.round(v));
    chips.forEach((ch, i) => {
      if (i < 58) { X.tl.set(ch.body, { attr: { fill: C.greenL } }, tCh + i * 0.0145); if (i % 6 === 0) tick(tCh + i * 0.0145, 0.07); }
      else X.tl.to(ch, { opacity: 0.45, duration: 0.15 }, tCh + 0.9);
    });
    X.sfx(tCh, 'riser', { gain: 0.16, dur: 0.85 });
    K.camTo(g, tG, 1.04, 540, 1000, 1.6, 'power1.inOut');
    // blow-up: the huge number
    const tR = wd(id, 'registered');
    const blob = S('path', { d: 'M520,560 C800,470 1100,620 1070,930 C1040,1230 760,1330 470,1260 C130,1180 40,900 200,700 C290,600 400,580 520,560 Z', fill: C.salmon, opacity: 0 }, g);
    X.tl.to(blob, { opacity: 0.92, duration: 0.08 }, tR);
    X.tl.to(g, { scale: 1.12, duration: 0.12, ease: 'power3.out', svgOrigin: '540 1000' }, tR);
    const big = W(o);
    K.text(big, 560, 1010, '58%', { size: 300, weight: 900, font: 'Oswald, sans-serif', fill: C.red, anchor: 'middle', attrs: { stroke: C.ink, 'stroke-width': 4, 'paint-order': 'stroke' } });
    K.pill(big, 560, 1050, 'OF LOOKED-UP CHIPS WERE REGISTERED', { anchor: 'middle', fill: C.dark, size: 24, padX: 16, padY: 14 });
    K.mono(big, 560, 1140, 'Lord et al., JAVMA 2009', { size: 20, weight: 600, anchor: 'middle', fill: '#6b5a52' });
    K.slam(big, tR, { sfx: 'impact', gain: 0.35 });
    K.papers(o, 560, 900, 18, tR, { dist: 520, dur: 1.1, seed: 8 });
    // drain before the cut
    X.tl.to([grid, hs], { y: 520, duration: 0.24, ease: 'power2.in' }, t1 - 0.26);
    X.tl.to([blob, top, lab], { opacity: 0, duration: 0.22, ease: 'none' }, t1 - 0.24);
    X.tl.to(big, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', duration: 0.2 }, t1 - 0.22);
  });

  // ================================================================ 06 registry (wide pipeline, no presenter)
  chap(5, (g, o, t0, t1, id, ci) => {
    K.papers(g, 540, 600, 8, t0 - 0.4, { dist: 600, dur: 1.1, seed: 12 });
    const sw = W(g); miniStack(sw, 50, 420, 300, 3, wd(id, 'registry'), { rh: 40, size: 20 });
    const belt = W(g); const cv = K.conveyor(belt, 30, 1110, 1020, ['01 SCAN', '02 NUMBER', '03 REGISTRY', '04 HOME']);
    K.slideIn(belt, t0 + 0.02, 'down', 700, { dur: 0.24 });
    const gate = W(g); K.station(gate, 70, 800, 200, 310, 'SCAN');
    K.slideIn(gate, t0 + 0.12, 'up', 500, { dur: 0.22, sfx: 'slide', gain: 0.2 });
    const dbw = W(g); const db = K.db(dbw, 560, 830, 190, 190, { label: 'registry' });
    K.dropIn(dbw, wd(id, 'registry') + 0.05, 700, { dur: 0.24 });
    const hw = W(g); const house = K.house(hw, 955, 1106, 0.62, { heart: false, lit: false });
    K.dropIn(hw, t0 + 0.3, 500, { dur: 0.24, sfx: false });
    K.still(gate, dbw, hw);
    // record card types as she rides the belt
    const rc = W(g); const card = K.recordCard(rc, 390, 420, 650, [['NUMBER', ''], ['OWNER', ''], ['PHONE', '']], { rh: 56, size: 26, title: 'REGISTRY RECORD · MAPLE' });
    K.slideIn(rc, wd(id, 'registry') - 0.1, 'right', 600, { dur: 0.22, sfx: 'paper', gain: 0.2 });
    const tk = W(g); K.ticket(tk, 80, 1036, '…202 365', { sub: 'Maple', w: 180, stub: C.teal });
    gsap.set(tk, { autoAlpha: 0, y: -200 });
    X.tl.set(tk, { autoAlpha: 1 }, t0 + 0.2);
    X.tl.to(tk, { y: 0, duration: 0.25, ease: 'bounce.out' }, t0 + 0.2);
    X.sfx(t0 + 0.4, 'drop', { gain: 0.2 });
    cv.light(t0 + 0.3, 0);
    const steps = [['number', 1, 270], ['name', 2, 520], ['home', 3, 780]];
    steps.forEach(([w, si, x], k) => {
      const tt = wd(id, w);
      X.tl.to(tk, { x, duration: 0.3, ease: 'power2.inOut' }, tt - 0.15);
      cv.light(tt, si - 1, false); cv.light(tt, si);
      K.camTo(g, tt - 0.15, 1.08, 200 + x, 1000, 0.4);
    });
    K.camTo(g, wd(id, 'home') + 0.35, 1.0, 540, 1000, 0.45);
    K.type(card.vals[0], NUM, wd(id, 'number'), 40);
    K.type(card.vals[1], 'Robin Ellis', wd(id, 'name'), 30);
    K.type(card.vals[2], PHONE, wd(id, 'phone'), 30);
    [0, 1, 2].forEach((i) => { const ck = K.check(rc, 1000, card.rowY[i], 15); gsap.set(ck, { scale: 0, transformOrigin: '50% 50%' }); X.tl.to(ck, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, wd(id, ['number', 'name', 'phone'][i]) + 0.5); X.sfx(wd(id, ['number', 'name', 'phone'][i]) + 0.5, 'blip_up', { gain: 0.14 }); });
    X.tl.to(db.rows[0], { attr: { fill: C.green }, duration: 0.1 }, wd(id, 'phone') + 0.3);
    // now that number points home
    const tH = wd(id, 'home');
    X.tl.set(house.win, { attr: { fill: C.yellow } }, tH + 0.1);
    const hh = W(g); K.heart(hh, 955, 965, 1.4, C.red);
    K.pop(hh, tH + 0.12, { sfx: 'sparkle', gain: 0.2 });
    K.pulse(g, 955, 1040, 130, tH + 0.1, { before: hw, hold: 0.9, fill: C.greenL });
    const arr = S('path', { d: 'M560,860 C620,700 860,760 940,960', fill: 'none', stroke: C.green, 'stroke-width': 5, 'stroke-dasharray': '12 9' }, g);
    gsap.set(arr, { opacity: 0 }); X.tl.to(arr, { opacity: 1, duration: 0.2 }, wd(id, 'points')); K.march(arr, 50);
    X.sfx(tH + 0.1, 'success', { gain: 0.16 });
  });

  // ================================================================ 07 new phone
  chap(6, (g, o, t0, t1, id, ci) => {
    const oh = W(g); K.house(oh, 430, 780, 0.9, { lit: false });
    const sold = W(oh); K.pill(sold, 430, 800, 'MOVED OUT', { anchor: 'middle', fill: '#8d8a84', size: 18, padX: 10, padY: 10 });
    K.dropIn(oh, t0 + 0.03, 500, { dur: 0.24 });
    const vw = W(g);
    K.rrect(vw, 460, 1000, 70, 60, 4, '#d9a066', 3); K.rrect(vw, 540, 990, 80, 70, 4, '#e2b07a', 3);
    K.van(vw, 560, 1200, 1.15, { fill: '#e9e2d4', label: 'MOVING' });
    K.slideIn(vw, wd(id, 'move') - 0.1, 'left', 700, { dur: 0.22, sfx: 'whoosh', gain: 0.22 });
    X.tl.to(vw, { x: 900, duration: 0.5, ease: 'power2.in' }, wd(id, 'phone') + 0.25);
    X.sfx(wd(id, 'phone') + 0.25, 'horn', { gain: 0.12 });
    K.pop(sold, wd(id, 'move') + 0.2, { sfx: 'paper', gain: 0.15, bump: false });
    // old phone out, new phone in
    const op = W(g); const opp = K.phone(op, 700, 440, 130, 230);
    K.mono(opp.screen, 765, 560, PHONE, { size: 18, weight: 700, anchor: 'middle' });
    K.pop(op, t0 + 0.2, { gain: 0.15 });
    K.flyOut(op, wd(id, 'new') - 0.05, -300, 300, 0.24);
    const np = W(g); const npp = K.phone(np, 860, 440, 130, 230, { screen: C.greenL });
    K.mono(npp.screen, 925, 560, PHONE2, { size: 18, weight: 700, anchor: 'middle' });
    K.pill(np, 925, 400, 'NEW', { anchor: 'middle', fill: C.green, size: 18, padX: 10, padY: 10 });
    K.pop(np, wd(id, 'new'), { sfx: 'notif', gain: 0.18 });
    K.camTo(g, wd(id, 'new') - 0.1, 1.08, 860, 560, 0.4); K.camTo(g, wd(id, 'shelter') - 0.15, 1.0, 860, 560, 0.4);
    // the shelter calls your old number
    const tSh = wd(id, 'shelter');
    const pw = W(g); K.person(pw, 410, 1290, 1.25, { skin: C.skin2, shirt: '#5b8c86', hairC: '#5a3b22', phone: true });
    K.slideIn(pw, tSh - 0.1, 'down', 500, { dur: 0.2, gain: 0.16 });
    const ghost = W(g);
    K.rrect(ghost, 690, 700, 130, 230, 24, '#f4f2ee', 3, { 'stroke-dasharray': '10 8' });
    K.mono(ghost, 755, 800, 'old', { size: 18, weight: 700, anchor: 'middle', fill: '#9a978f' });
    K.mono(ghost, 755, 828, 'number', { size: 18, weight: 700, anchor: 'middle', fill: '#9a978f' });
    K.pop(ghost, wd(id, 'calls'), { gain: 0.15 });
    const line = S('path', { d: 'M470,1150 C520,960 600,880 688,820', fill: 'none', stroke: C.blue, 'stroke-width': 5, 'stroke-dasharray': '12 9' }, g);
    gsap.set(line, { opacity: 0 }); X.tl.to(line, { opacity: 1, duration: 0.15 }, wd(id, 'calls')); K.march(line, 60);
    K.stream(g, 4, (it) => S('circle', { cx: 0, cy: 0, r: 9, fill: C.blue, ...K.stroke(2) }, it), (u) => [470 + u * 218, 1150 - u * 330], wd(id, 'calls'), 0.22, 0.4, { sfx: false, until: wd(id, 'Disconnected') });
    const on = W(g); K.pill(on, 520, 960, PHONE, { fill: '#fff', color: C.ink, sw: 3, size: 22, padX: 12, padY: 12 });
    K.pop(on, wd(id, 'old'), { sfx: 'blip', gain: 0.16 });
    X.sfx(wd(id, 'calls') + 0.1, 'beep', { gain: 0.1 }); X.sfx(wd(id, 'calls') + 0.55, 'beep', { gain: 0.1 });
    // disconnected
    const tD = wd(id, 'Disconnected');
    X.tl.set(line, { attr: { stroke: '#c9c6c0' } }, tD);
    const brk = W(g); K.cross(brk, 600, 890, 22);
    K.pop(brk, tD, { sfx: 'error', gain: 0.2, bump: false });
    const nis = W(ghost); K.mono(nis, 755, 880, 'not in', { size: 16, weight: 700, anchor: 'middle', fill: C.red }); K.mono(nis, 755, 902, 'service', { size: 16, weight: 700, anchor: 'middle', fill: C.red });
    K.show(nis, tD);
    const st = K.stamp(o, 615, 900, 'DISCONNECTED', { size: 104, rot: -8 });
    K.pulse(o, 615, 900, 240, tD, { hold: 0.6 });
    K.slam(st, tD, { gain: 0.3 });
    K.camTo(g, tD - 0.12, 1.1, 700, 820, 0.35);
    // the most common reason owners aren't found
    const tM = wd(id, "It's") + 0.3;
    [oh, np, pw, ghost, on, brk].forEach((e, i) => K.flyOut(e, tM - 0.1 + i * 0.02, i % 2 ? 600 : -600, 0, 0.2));
    X.tl.to([line, st], { opacity: 0, duration: 0.12 }, tM - 0.1);
    const bc = W(g);
    K.card(bc, 300, 470, 730, 420, { r: 18 });
    K.mono(bc, 330, 520, "WHY OWNERS WEREN'T FOUND", { size: 22, weight: 700, fill: C.tagGrey, ls: 2 });
    K.mono(bc, 330, 860, '876 chipped animals, owner not found · Lord et al. 2009', { size: 17, weight: 600, fill: '#9a978f' });
    K.slideIn(bc, tM - 0.05, 'right', 700, { dur: 0.22, sfx: 'slide', gain: 0.2 });
    K.camTo(g, tM - 0.15, 1.0, 700, 820, 0.35);
    const bars = [['wrong or disconnected phone', 35.4, C.red], ['no reply to calls or letters', 24.3, '#c9c4bb'], ['registered to another group', 17.2, '#c9c4bb']];
    bars.forEach(([lab, v, col], i) => {
      const y = 580 + i * 92;
      K.text(bc, 330, y, lab, { size: 24, weight: 700, fill: i ? '#6b6862' : C.ink });
      const b = K.rrect(bc, 330, y + 14, v * 18, 34, 6, col, 2.5);
      gsap.set(b, { scaleX: 0, svgOrigin: `330 ${y + 30}` });
      X.tl.to(b, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, wd(id, 'common') - 0.25 + i * 0.32);
      tick(wd(id, 'common') - 0.25 + i * 0.32, 0.12);
    });
    const n1 = W(bc); K.excl(n1, 330 + 35.4 * 18 + 40, 625, 22, C.red, '1');
    K.pop(n1, wd(id, 'reason'), { sfx: 'ding', gain: 0.16, bump: false });
    K.pulse(g, 650, 620, 200, wd(id, 'reason'), { before: bc, hold: 0.9 });
  });

  // ================================================================ 08 updates
  chap(7, (g, o, t0, t1, id, ci) => {
    const sw = W(g); miniStack(sw, 300, 1050, 270, 4, wd(id, 'updates'), { rh: 38, size: 19 });
    K.still(sw);
    const rc = W(g); const card = K.recordCard(rc, 320, 430, 620, [['ADDRESS', '14 Alder Ct'], ['PHONE', PHONE]], { rh: 64, size: 26, title: 'REGISTRY RECORD · MAPLE' });
    K.dropIn(rc, t0 + 0.04, 800, { dur: 0.24, sfx: 'paper', gain: 0.2 });
    // change the record when you move
    const tCh = wd(id, 'Change');
    card.vals.forEach((v, i) => {
      const y = card.rowY[i] + 0;
      const strike = S('path', { d: `M466,${y} L${466 + (i ? 150 : 190)},${y}`, stroke: C.red, 'stroke-width': 4 }, rc);
      gsap.set(strike, { opacity: 0 });
      X.tl.set(strike, { opacity: 1 }, tCh + i * 0.15);
      X.drawOn(strike, tCh + i * 0.15, 0.2);
      X.tl.set(strike, { opacity: 0 }, wd(id, 'move') - 0.02);
      X.tl.set(v, { textContent: '', attr: { fill: C.green } }, wd(id, 'move') - 0.02);
      const orig = v.textContent;
      K.type(v, i ? PHONE2 : '7 Linden Way', wd(id, 'move') + i * 0.18, 34);
      v.textContent = orig;
    });
    const ok = W(rc); K.check(ok, 900, 400 + 70, 18);
    K.pop(ok, wd(id, 'move') + 0.5, { sfx: 'success', gain: 0.16, bump: false });
    K.pulse(g, 630, 530, 220, wd(id, 'record'), { before: rc, hold: 0.7, fill: C.greenL });
    K.camTo(g, wd(id, 'Change') - 0.1, 1.08, 630, 530, 0.4); K.camTo(g, wd(id, 'check') - 0.1, 1.08, 760, 820, 0.4); K.camTo(g, wd(id, 'year') + 0.3, 1.0, 760, 820, 0.4);
    const bx = W(g); K.rrect(bx, 640, 690, 80, 66, 5, '#d9a066', 3); S('path', { d: 'M640,712 l80,0', ...K.stroke(2) }, bx);
    K.pop(bx, wd(id, 'when'), { sfx: 'pop', gain: 0.14 }); K.popOut(bx, wd(id, 'check') - 0.1);
    K.say(g, 680, 760, 'record updated ✓', wd(id, 'move') + 0.6, { tail: 'left', size: 26, out: wd(id, 'check') - 0.05 });
    // and check it once a year
    const tC = wd(id, 'check');
    const cal = W(g); const cg = K.calendar(cal, 640, 700, 'AUGUST', '15', { w: 240, h: 230, bigSize: 110, sub: 'check the chip', head: C.teal });
    K.dropIn(cal, tC - 0.1, 600, { dur: 0.24, sfx: 'paper', gain: 0.2 });
    const loop = S('path', { d: 'M760,668 A150,150 0 1,1 612,830', fill: 'none', stroke: C.teal, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    const head = S('path', { d: 'M598,812 l14,22 l18,-16', fill: 'none', stroke: C.teal, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    X.drawOn(loop, wd(id, 'once'), 0.4);
    K.show(head, wd(id, 'once') + 0.38);
    const yr = W(g); K.pill(yr, 760, 960, 'every year', { anchor: 'middle', fill: C.teal, size: 20, padX: 12, padY: 12 });
    K.pop(yr, wd(id, 'year'), { sfx: 'ding', gain: 0.16 });
    const bl = W(g); K.bell(bl, 885, 680, 0.8);
    K.pop(bl, wd(id, 'it') + 0.05, { sfx: 'notif', gain: 0.14 });
    X.tl.to(bl, { rotation: 14, transformOrigin: '50% 10%', duration: 0.06, repeat: 5, yoyo: true, ease: 'none' }, wd(id, 'it') + 0.15);
    const dw = W(g); const d = dog(dw, 895, 1240, 0.85, ci, { tag: false });
    K.slideIn(dw, t0 + 0.2, 'right', 400, { dur: 0.2, sfx: false });
    d.wag(wd(id, 'move'), t1, 16, 3.5);
    K.still(dw);
  });

  // ================================================================ 09 silence
  chap(8, (g, o, t0, t1, id, ci) => {
    const dw = W(g); const d = dog(dw, 500, 1190, 1.25, ci, { tag: false });
    K.dropIn(dw, t0 + 0.03, 600, { dur: 0.22 });
    const shs = W(g); K.pill(shs, 300, 470, 'another shelter', { fill: '#8d8a84', size: 22, padX: 14, padY: 14 });
    K.pop(shs, wd(id, 'shelter'), { gain: 0.15 });
    const scw = W(g); const sc = K.scanner(scw, 440, 1040, 0.8, { up: true, fill: '#b9b6b0', label: 'OLD READER', dusty: true, btn: '#d9d6d0', beamC: '#b9b6b0' });
    K.slideIn(scw, wd(id, 'old') - 0.1, 'right', 600, { dur: 0.22, sfx: 'swoosh', gain: 0.18 });
    const tPs = wd(id, 'passes');
    X.tl.fromTo(scw, { x: -50 }, { x: 40, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 3, immediateRender: false }, tPs - 0.1);
    sc.beam(tPs - 0.1, wd(id, 'silent') + 0.2, true);
    K.camTo(g, tPs - 0.2, 1.06, 440, 980, 0.9, 'power1.inOut');
    K.flicker(sc.disp, tPs - 0.1, wd(id, 'silent'), (k) => ['·', '· ·', '· · ·'][k % 3]);
    X.sfx(tPs, 'swoosh', { gain: 0.12 }); X.sfx(tPs + 0.6, 'swoosh', { gain: 0.12 });
    const tSi = wd(id, 'silent');
    X.tl.set(sc.disp, { textContent: 'NO CHIP', attr: { fill: '#ff8a7a' } }, tSi);
    d.tilt(wd(id, 'stays'), 12); d.droop(tSi);
    const st = K.stamp(o, 615, 690, 'NO BEEP', { size: 165, rot: -8 });
    K.pulse(o, 615, 690, 240, tSi, { hold: 0.6 });
    K.slam(st, tSi + 0.05, { gain: 0.3 });
    K.camTo(g, tSi - 0.12, 1.12, 440, 820, 0.35);
    // not every scanner reads every chip
    const tN = wd(id, 'Not');
    K.flyOut(scw, tN - 0.1, 600, -100, 0.2); K.popOut(shs, tN - 0.1); K.popOut(st, tN + 0.15, 0.14);
    K.restage(dw, tN - 0.1, { x: -100, y: 30, scale: 0.75, svgOrigin: '500 1190' }, 0.3);
    K.camTo(g, tN - 0.15, 1.0, 440, 820, 0.35);
    const tb = W(g);
    K.card(tb, 520, 450, 500, 470, { r: 18 });
    K.mono(tb, 545, 500, 'CHIP TYPE', { size: 18, weight: 700, fill: C.tagGrey, ls: 2 });
    K.mono(tb, 995, 500, 'OLD READER', { size: 18, weight: 700, fill: C.tagGrey, ls: 2, anchor: 'end' });
    K.slideIn(tb, tN - 0.05, 'right', 600, { dur: 0.22, sfx: 'slide', gain: 0.2 });
    const types = [['125 kHz', true], ['128 kHz', false], ['134.2 kHz · ISO', false]];
    types.forEach(([lab, ok], i) => {
      const y = 590 + i * 110;
      K.chipMini(tb, 580, y - 10, 1.4);
      K.text(tb, 630, y, lab, { size: 28, weight: 700 });
      const m = W(tb); (ok ? K.check : K.cross)(m, 940, y - 10, 22);
      K.pop(m, wd(id, 'every') + i * 0.2, { sfx: ok ? 'blip_up' : 'error', gain: 0.14, bump: false });
      if (i < 2) S('path', { d: `M545,${y + 45} L995,${y + 45}`, stroke: '#e3e0da', 'stroke-width': 2 }, tb);
    });
    K.pulse(g, 770, 800, 200, wd(id, 'every', 1), { before: tb, hold: 0.7 });
  });

  // ================================================================ 10 universal
  chap(9, (g, o, t0, t1, id, ci) => {
    const sw = W(g); miniStack(sw, 300, 1040, 270, 5, wd(id, 'universal'), { rh: 34, size: 17 });
    K.still(sw);
    const dw = W(g); const d = dog(dw, 790, 1250, 0.95, ci, { tag: false });
    K.slideIn(dw, t0 + 0.05, 'right', 500, { dur: 0.2, sfx: false });
    const tb = W(g);
    K.card(tb, 320, 440, 430, 360, { r: 18 });
    K.mono(tb, 345, 486, 'CHIP TYPE', { size: 17, weight: 700, fill: C.tagGrey, ls: 2 });
    K.mono(tb, 725, 486, 'UNIVERSAL', { size: 17, weight: 700, fill: C.blue, ls: 2, anchor: 'end' });
    K.dropIn(tb, t0 + 0.1, 700, { dur: 0.24, sfx: 'paper', gain: 0.18 });
    ['125 kHz', '128 kHz', '134.2 kHz'].forEach((lab, i) => {
      const y = 560 + i * 86;
      K.chipMini(tb, 375, y - 9, 1.2);
      K.text(tb, 420, y, lab, { size: 26, weight: 700 });
      const m = W(tb); K.check(m, 690, y - 9, 20);
      K.pop(m, wd(id, 'scanner') + i * 0.14, { sfx: 'blip_up', gain: 0.14, bump: false });
    });
    const scw = W(g); const sc = K.scanner(scw, 768, 1128, 0.72, { up: true, label: 'UNIVERSAL' });
    K.dropIn(scw, wd(id, 'universal') - 0.05, 700, { dur: 0.24, sfx: 'drop', gain: 0.2 });
    K.pulse(g, 780, 900, 180, wd(id, 'universal') + 0.1, { before: scw, hold: 0.7, fill: C.blueL });
    // the ISO chip standard
    const iso = W(g); K.pill(iso, 320, 840, 'ISO 11784 / 11785 · 134.2 kHz', { fill: C.blue, size: 22, padX: 14, padY: 16 });
    K.pop(iso, wd(id, 'ISO'), { sfx: 'stamp', gain: 0.16 });
    K.pulse(g, 520, 860, 170, wd(id, 'ISO'), { before: iso, hold: 0.7, fill: C.blueL });
    K.camTo(g, wd(id, 'ISO') - 0.1, 1.08, 520, 860, 0.4); K.camTo(g, wd(id, 'second') - 0.4, 1.0, 520, 860, 0.35);
    // and a second pass, every time
    const tP = wd(id, 'second');
    X.tl.to(scw, { x: -60, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 3 }, tP - 0.3);
    sc.beam(tP - 0.3, t1);
    const pc = W(g); K.pill(pc, 360, 930, 'pass 1 of 2', { fill: C.dark, size: 22, padX: 14, padY: 14 });
    K.pop(pc, tP - 0.1, { gain: 0.15 });
    const pc2 = W(g); K.pill(pc2, 360, 930, 'pass 2 of 2 ✓', { fill: C.green, size: 22, padX: 14, padY: 14 });
    K.show(pc2, wd(id, 'pass') + 0.1); X.tl.set(pc, { autoAlpha: 0 }, wd(id, 'pass') + 0.1);
    tick(wd(id, 'pass') + 0.1, 0.16);
    X.tl.set(sc.disp, { textContent: 'BEEP ✓', attr: { fill: '#7fe0a0' } }, wd(id, 'every'));
    X.sfx(wd(id, 'every'), 'beep', { gain: 0.16 });
    d.perk(wd(id, 'every')); d.wag(wd(id, 'every'), t1, 18, 3.8);
    const ev = W(g); K.pill(ev, 600, 990, 'every time', { fill: C.green, size: 20, padX: 12, padY: 12 });
    K.pop(ev, wd(id, 'time'), { sfx: 'ding', gain: 0.15 });
  });

  // ================================================================ 11 which one?
  chap(10, (g, o, t0, t1, id, ci) => {
    const scw = W(g); const sc = K.scanner(scw, 420, 600, 0.82, { label: 'UNIVERSAL', disp: 'BEEP ✓' });
    X.tl.set(sc.disp, { attr: { fill: '#7fe0a0' } }, t0);
    K.slideIn(scw, t0 + 0.03, 'left', 500, { dur: 0.2 });
    K.say(g, 540, 440, NUM, wd(id, 'number') - 0.05, { tail: 'left', size: 28, font: K.F.mono });
    const dw = W(g); const d = dog(dw, 820, 920, 0.78, ci, { tag: false });
    K.slideIn(dw, t0 + 0.12, 'right', 400, { dur: 0.2, sfx: false });
    // which registry?
    const tR = wd(id, 'registry');
    const hd = W(g); K.pill(hd, 660, 990, 'REGISTRIES', { anchor: 'middle', fill: C.dark, size: 20, padX: 12, padY: 12 });
    K.pop(hd, tR - 0.1, { gain: 0.15 });
    const dbs = ['A', 'B', 'C', 'D', 'E'].map((L, i) => {
      const b = W(g); K.db(b, 320 + i * 140, 1070, 100, 110, { label: L }); K.still(b);
      K.dropIn(b, tR + i * 0.07, 500, { dur: 0.22, sfx: i ? false : 'drop', gain: 0.18 });
      return b;
    });
    const tW = wd(id, 'has');
    dbs.forEach((b, i) => { const q = W(g); K.qmark(q, 370 + i * 140, 1050, 48, C.red); K.pop(q, tW + i * 0.08, { gain: 0.1, pitch: 1 + i * 0.06, bump: false }); });
    d.tilt(tW, 14);
    K.camTo(g, tR, 1.08, 620, 1100, 0.4); K.camTo(g, wd(id, 'one') - 0.2, 1.0, 620, 1100, 0.35);
    K.stream(g, 5, (it) => S('circle', { cx: 0, cy: 0, r: 10, fill: C.blue, ...K.stroke(2) }, it), (u, i) => [480 + (370 + i * 140 - 480) * u, 900 + 160 * u], tW, 0.18, 0.45, { sfx: false });
    const st = K.stamp(o, 615, 1010, 'WHICH ONE?', { size: 124, rot: -8 });
    K.pulse(o, 615, 1010, 240, wd(id, 'one'), { hold: 0.6 });
    K.slam(st, wd(id, 'one'), { gain: 0.3 });
    K.still(...dbs);
  });

  // ================================================================ 12 lookup
  chap(11, (g, o, t0, t1, id, ci) => {
    const sw = W(g); miniStack(sw, 300, 1030, 270, 6, wd(id, 'lookup'), { rh: 30, size: 15 });
    K.still(sw);
    const ww = W(g); const win = K.window(ww, 300, 420, 620, 270, 'universal lookup', { addr: true, logo: false, dot: C.teal });
    K.dropIn(ww, t0 + 0.08, 800, { dur: 0.24, sfx: 'pop', gain: 0.2 });
    K.type(win.addr, NUM, wd(id, 'Type'), 26);
    const btn = W(ww); K.pill(btn, 610, 580, 'LOOK UP', { anchor: 'middle', fill: C.teal, size: 22, padX: 18, padY: 16, font: K.F.label, weight: 800 });
    K.pop(btn, wd(id, 'once'), { sfx: 'click', gain: 0.2, bump: false });
    K.pulse(g, 610, 600, 120, wd(id, 'once'), { before: ww, hold: 0.5, fill: C.tealL });
    const xs = [600, 720, 840, 960];
    const dbs = xs.map((x, i) => { const b = W(g); K.db(b, x - 45, 860, 90, 100, { label: ['A', 'B', 'C', 'D'][i] }); K.still(b); K.dropIn(b, wd(id, 'number') + i * 0.07, 500, { dur: 0.22, sfx: i ? false : 'drop', gain: 0.16 }); return b; });
    const cables = xs.map((x, i) => {
      const c = S('path', { d: `M610,690 C610,760 ${x},780 ${x},850`, fill: 'none', stroke: C.dark2, 'stroke-width': 6, 'stroke-dasharray': '12 9' }, g);
      K.march(c, 60); gsap.set(c, { opacity: 0 }); X.tl.to(c, { opacity: 1, duration: 0.12 }, wd(id, 'once') + 0.1 + i * 0.06);
      return c;
    });
    // ... it points to the registry that knows her
    const tP = wd(id, 'points');
    cables.forEach((c, i) => X.tl.set(c, { attr: { stroke: i === 2 ? C.green : '#d4d0c8' } }, tP));
    dbs.forEach((b, i) => { if (i !== 2) X.tl.to(b, { opacity: 0.4, duration: 0.15 }, tP); });
    const ck = W(g); K.check(ck, 880, 840, 22);
    K.pop(ck, tP + 0.05, { sfx: 'success', gain: 0.18, bump: false });
    K.pulse(g, 840, 920, 130, tP, { before: dbs[2], hold: 0.9, fill: C.greenL });
    K.stream(g, 5, (it) => K.rrect(it, -16, -12, 32, 24, 5, C.green, 2.5), (u) => [610 + (840 - 610) * u, 690 + 160 * u], tP, 0.2, 0.4, { sfx: false });
    const fc = W(g); const card = K.recordCard(fc, 640, 1060, 380, [['DOG', 'Maple'], ['CALL', PHONE2]], { rh: 48, size: 22, title: 'FOUND IN REGISTRY C', head: C.green });
    K.slideIn(fc, wd(id, 'knows') - 0.1, 'right', 500, { dur: 0.22, sfx: 'notif', gain: 0.18 });
    const ht = W(fc); K.heart(ht, 975, 1150, 1.1, C.red);
    K.pop(ht, wd(id, 'her'), { sfx: 'sparkle', gain: 0.15, bump: false });
    K.say(g, 640, 740, 'found ✓', tP + 0.2, { tail: 'left', size: 24 });
    K.still(...dbs, ww);
  });

  // ================================================================ 13 months later (halftone wipe, full checked stack)
  chap(12, (g, o, t0, t1, id, ci) => {
    K.halftone(t0 - 0.34, 0.84, { ox: 760, oy: 700 });
    const cal = W(g);
    const cg = K.calendar(cal, 360, 560, '2026', 'JUN', { w: 340, h: 330, bigSize: 150, head: C.teal });
    X.tl.set(cg.big, { textContent: 'AUG' }, t0 + 0.56);
    X.tl.set(cg.big, { textContent: 'OCT' }, t0 + 0.68);
    X.tl.set(cg.big, { textContent: 'DEC' }, t0 + 0.8);
    [0.56, 0.68, 0.8].forEach((dt) => X.sfx(t0 + dt, 'paper', { gain: 0.2 }));
    X.tl.to(cal, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.12 }, t0 + 0.9);
    const tS = t0 + 0.96;
    const all = W(g);
    X.tl.fromTo(all, { scale: 0.92 }, { scale: 1.03, svgOrigin: '540 900', duration: t1 - tS, ease: 'none', immediateRender: false }, tS);
    K.show(all, tS);
    X.sfx(tS, 'whoosh', { gain: 0.22 });
    K.halo(all, 540, 520, 175, C.greenL);
    const st = K.stack(all, 250, 650, 580, LAY, { rh: 64, gap: 10, size: 32 });
    K.statusBar(all, 230, 650 + 6 * 74 + 4, 620, 'MAPLE · ' + NUM, 'HOME');
    const dw = W(all); const d = dog(dw, 530, 646, 0.95, ci, { tag: true });
    d.wag(tS, t1, 18, 3.5); d.happy(tS);
    st.rows.forEach((r, i) => { gsap.set(r, { x: 400, opacity: 0 }); X.tl.to(r, { x: 0, opacity: 1, duration: 0.18, ease: 'power3.out' }, tS + i * 0.04); });
    [[2, 'registered'], [3, 'current'], [4, 'readable'], [5, 'findable']].forEach(([ri, w]) => st.addCheck(wd(id, w), ri));
    [0, 1].forEach((ri, k) => st.addCheck(wd(id, 'findable') + 0.2 + k * 0.08, ri));
    // callouts at the sides, each an icon over a dark label (as in the base recap)
    const lab = (p, x, y, str) => K.pill(p, x, y, str, { anchor: 'middle', fill: C.dark, size: 20, padX: 12, padY: 12 });
    const c3 = W(g); K.scanner(c3, 125, 470, 0.5, { label: '', disp: 'BEEP' }); lab(c3, 125, 650, 'readable');
    const c1 = W(g); K.recordCard(c1, 25, 880, 200, [['', '✓']], { rh: 46, size: 26, title: 'RECORD', head: C.teal }); lab(c1, 125, 1020, 'registered');
    const c4 = W(g); K.magnifier(c4, 935, 470, 58); lab(c4, 955, 600, 'findable');
    const c2 = W(g); K.calendar(c2, 870, 860, 'AUG', '15', { w: 170, h: 170, bigSize: 76, head: C.teal }); lab(c2, 955, 1050, 'current');
    K.pop(c1, wd(id, 'registered'), { gain: 0.16 });
    K.pop(c2, wd(id, 'current'), { gain: 0.16 });
    K.pop(c3, wd(id, 'readable'), { gain: 0.16 });
    K.pop(c4, wd(id, 'findable'), { sfx: 'sparkle', gain: 0.16 });
    const live = W(g); K.mono(live, 1040, 290, '// all six layers', { size: 24, weight: 400, fill: C.tagGrey, anchor: 'end' });
    K.show(live, tS);
  });

  // ================================================================ 14 one friday
  chap(13, (g, o, t0, t1, id, ci) => {
    // first half: two years later, forty miles away, a scanner beeps
    const all = W(g);
    const st = K.stack(all, 30, 760, 400, LAY, { rh: 40, gap: 6, size: 20 });
    st.rows.forEach((r, i) => st.addCheck(null, i));
    K.statusBar(all, 20, 760 + 6 * 46 + 2, 420, 'MAPLE', 'ALL CHECKS ✓');
    K.slideIn(all, t0 + 0.02, 'left', 500, { dur: 0.22, sfx: 'slide', gain: 0.2 });
    const cal = W(g); const cg = K.calendar(cal, 480, 400, 'FRIDAY', 'FRI', { w: 250, h: 230, bigSize: 100, sub: 'two years later', head: C.teal });
    K.dropIn(cal, wd(id, 'Friday') - 0.12, 700, { dur: 0.24, sfx: 'paper', gain: 0.2 });
    K.camTo(g, wd(id, 'Friday') + 0.05, 1.08, 40, 520, 0.4); K.camTo(g, wd(id, 'scanner') - 0.2, 1.0, 40, 520, 0.35);
    const scw = W(g); const sc = K.scanner(scw, 880, 560, 0.72, { label: 'UNIVERSAL' });
    K.pop(scw, wd(id, 'scanner') - 0.05, { gain: 0.16 });
    const tBp = wd(id, 'beeps');
    X.tl.set(sc.disp, { textContent: 'BEEP ✓', attr: { fill: '#7fe0a0' } }, tBp);
    X.sfx(tBp, 'beep', { gain: 0.22 }); X.sfx(tBp + 0.22, 'beep', { gain: 0.18 });
    sc.beam(tBp - 0.1, wd(id, 'Her') - 0.1);
    K.pulse(g, 880, 560, 160, tBp, { before: scw, hold: 0.9, fill: C.greenL });
    K.camTo(g, tBp - 0.1, 1.06, 40, 640, 0.4); K.camTo(g, wd(id, 'forty') - 0.2, 1.0, 40, 640, 0.4);
    const shw = W(g); K.shelter(shw, 870, 1250, 260, 170, { label: 'SHELTER', lit: true });
    K.dropIn(shw, wd(id, 'shelter') - 0.1, 500, { dur: 0.24, sfx: 'drop', gain: 0.16 });
    const road = S('path', { d: 'M520,990 C600,880 760,900 820,960', fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-dasharray': '14 10' }, g);
    gsap.set(road, { opacity: 0 }); X.tl.to(road, { opacity: 1, duration: 0.2 }, wd(id, 'forty') - 0.1); K.march(road, 30);
    const hp = W(g); K.house(hp, 520, 1060, 0.45, { lit: true });
    K.pop(hp, wd(id, 'forty') - 0.1, { gain: 0.14 });
    const mi = W(g); K.pill(mi, 670, 860, '40 mi', { anchor: 'middle', fill: C.dark, size: 26, padX: 16, padY: 14 });
    K.pop(mi, wd(id, 'miles'), { sfx: 'blip_up', gain: 0.16 });
    // second half: the drawer, the phone
    const tH = wd(id, 'Her');
    [cal, scw, shw, hp, mi].forEach((e, i) => K.flyOut(e, tH - 0.15 + i * 0.02, i % 2 ? 600 : -600, -100, 0.2));
    X.tl.to(road, { opacity: 0, duration: 0.12 }, tH - 0.15);
    K.flyOut(all, tH - 0.12, -500, 0, 0.22);
    X.sfx(tH - 0.15, 'whoosh', { gain: 0.2 });
    const dr = W(g); const drawer = K.drawer(dr, 200, 1270, 440);
    K.slideIn(dr, tH - 0.05, 'left', 600, { dur: 0.22, sfx: 'slide', gain: 0.18 });
    K.still(dr);
    const [tgx, tgy] = drawer.tagAt;
    K.pulse(g, tgx, tgy, 90, wd(id, 'tag'), { before: dr, hold: 1.4, fill: C.yellow });
    const sp = W(g); K.sparkle(sp, tgx + 30, tgy - 26, 1.3, C.brass);
    K.pop(sp, wd(id, 'still'), { sfx: 'sparkle', gain: 0.12, bump: false });
    // lens on the old tag: her name and the old phone number (it would not have reached you)
    const lw = lens(g, 380, 640, 120, tgx, tgy - 6);
    S('circle', { cx: 380, cy: 628, r: 76, fill: C.brass, ...K.stroke(3) }, lw);
    S('circle', { cx: 380, cy: 565, r: 9, fill: '#fff', ...K.stroke(2.5) }, lw);
    K.text(lw, 380, 620, 'MAPLE', { size: 28, weight: 900, anchor: 'middle', fill: '#5a4512', ls: 2 });
    K.mono(lw, 380, 664, '☎ ' + PHONE, { size: 23, weight: 700, anchor: 'middle', fill: '#5a4512' });
    K.pop(lw, wd(id, 'tag') + 0.05, { sfx: 'pop', gain: 0.16 });
    K.camTo(g, wd(id, 'tag') - 0.05, 1.08, 400, 900, 0.4); K.camTo(g, wd(id, 'And') - 0.2, 1.0, 400, 900, 0.35);
    const tDr = wd(id, 'drawer');
    const strike = S('path', { d: 'M318,657 L444,657', stroke: C.red, 'stroke-width': 4 }, lw);
    X.drawOn(strike, tDr + 0.1, 0.25);
    const oldp = W(lw); K.pill(oldp, 380, 778, 'old number', { anchor: 'middle', fill: '#8d8a84', size: 18, padX: 10, padY: 10 });
    K.pop(oldp, tDr + 0.3, { sfx: 'blip_down', gain: 0.12, bump: false });
    X.tl.fromTo(drawer.drawer, { y: 0 }, { y: 10, duration: 0.18, ease: 'power2.out', immediateRender: false }, tDr);
    X.sfx(tDr, 'slide', { gain: 0.14 });
    // and your phone rings
    const PX = 640, PY = 390, PWd = 220, PH = 400, pcx = PX + PWd / 2;
    const pw = W(g); const ph = K.phone(pw, PX, PY, PWd, PH, { screen: '#f3efe6' });
    const scr = ph.screen;
    S('circle', { cx: pcx, cy: PY + 125, r: 46, fill: C.tealL, ...K.stroke(2.5) }, scr);
    K.paw(scr, pcx, PY + 131, 1.15, C.teal);
    K.text(scr, pcx, PY + 215, 'Animal shelter', { size: 26, weight: 800, anchor: 'middle' });
    const sub = K.mono(scr, pcx, PY + 247, 'incoming call', { size: 17, weight: 600, anchor: 'middle', fill: '#8d8a84' });
    S('circle', { cx: pcx - 50, cy: PY + 315, r: 26, fill: '#d9534f', ...K.stroke(2.5) }, scr);
    const acc = S('circle', { cx: pcx + 50, cy: PY + 315, r: 26, fill: C.warmGreen, ...K.stroke(2.5) }, scr);
    K.dropIn(pw, wd(id, 'And') - 0.1, 800, { dur: 0.24, sfx: 'drop', gain: 0.16 });
    const tRg = wd(id, 'rings');
    ph.ring(tRg - 0.05, 1.2);
    X.sfx(tRg, 'chime', { gain: 0.2 }); X.sfx(tRg + 0.55, 'chime', { gain: 0.18 });
    K.pulse(g, pcx, PY + 200, 220, tRg, { before: pw, hold: 2.0, fill: C.greenL });
    // she's home
    const tHome = tRg + 0.75;
    X.tl.set(sub, { textContent: 'connected · 0:01' }, tHome);
    X.tl.to(acc, { attr: { r: 32 }, duration: 0.1, yoyo: true, repeat: 1 }, tHome - 0.15);
    const stp = K.stamp(o, 540, 905, "SHE'S HOME", { size: 150, rot: -7, color: C.warmGreen, sub: 'two years · forty miles · one number' });
    K.pulse(o, 540, 905, 280, tHome, { hold: 3, fill: C.greenL });
    K.slam(stp, tHome, { sfx: 'stamp', gain: 0.22 });
    // Maple comes in; the old tag goes back on her collar
    const dw = W(g); const d = dog(dw, 840, 1260, 1.0, ci, { tag: false, t0: tHome });
    K.slideIn(dw, tHome + 0.55, 'right', 500, { dur: 0.22, sfx: 'swoosh', gain: 0.14 });
    d.wag(tHome + 0.6, END + 1, 22, 4); d.happy(tHome + 0.6); d.perk(tHome + 0.8);
    const tT = tHome + 1.25;
    const ftag = W(g); S('circle', { cx: 0, cy: 0, r: 13, fill: C.brass, ...K.stroke(2.5) }, ftag);
    gsap.set(ftag, { x: tgx, y: tgy, autoAlpha: 0 });
    X.tl.set(drawer.tag, { autoAlpha: 0 }, tT);
    X.tl.set(ftag, { autoAlpha: 1 }, tT);
    const tx = 840 + 50, ty = 1260 - 124;
    const prox = { u: 0 };
    X.tl.to(prox, { u: 1, duration: 0.55, ease: 'power2.inOut', onUpdate: () => { const u = prox.u; ftag.setAttribute('transform', `translate(${(tgx + (tx - tgx) * u).toFixed(1)} ${(tgy + (ty - tgy) * u - Math.sin(u * Math.PI) * 50).toFixed(1)})`); } }, tT);
    X.tl.set(ftag, { autoAlpha: 0 }, tT + 0.56);
    d.tagOn(tT + 0.56);
    X.sfx(tT + 0.56, 'chime', { gain: 0.16, pitch: 1.3 });
    const ht = W(g); K.heart(ht, 905, 960, 1.4, C.red);
    K.pop(ht, tT + 0.7, { sfx: false, bump: false });
    K.flicker(sub, tHome + 0.1, END, (k) => 'connected · 0:' + String(1 + Math.floor(k / 10)).padStart(2, '0'));
    K.stream(g, 6, (it, i) => K.heart(it, 0, 0, 0.7 + (i % 3) * 0.15, i % 2 ? C.red : '#e48e86'), (u, i) => [905 + Math.sin(u * 6 + i) * 26 + (i % 3 - 1) * 30, 940 - u * 260], tT + 0.9, 0.28, 1.4, { fade: true, sfx: false });
    K.still(dw, pw);
  });

  // ---------------------------------------------------------------- captions (on top of everything)
  const keys = {};
  spec.lines.forEach((l) => { keys[l.id] = l.keys || []; });
  K.captions({ keys, merges: [{ line: 'c05', from: '58', n: 2, show: '58%' }] });
  // emphasis: on every caption keyword the newest element of the chapter thumps and nudges its neighbours
  spec.lines.forEach((l) => {
    const cg = document.getElementById(l.id + 'cam') || document.getElementById(l.id);
    const has = (k) => X.line(l.id).words.some((w) => nrm(w.w).startsWith(nrm(k)));
    const kt = (keys[l.id] || []).filter(has).map((k) => (wx(l.id, k) !== X.line(l.id).start ? wx(l.id, k) : wd(l.id, k)));
    kt.forEach((t, k) => K.emphasize(cg, t, { win: 9, halo: k % 2 ? C.tealL : C.salmon }));
    // the slower read leaves more room: lighter beats on words of 4+ letters, at least 0.45 s apart
    let last = -9, n = 0; const all = [...kt];
    X.line(l.id).words.forEach((w) => {
      if (nrm(w.w).length < 4 || all.some((t) => Math.abs(t - w.start) < 0.45) || w.start - last < 0.45) return;
      K.emphasize(cg, w.start, { amt: 0.07, nudge: 0.55, back: ++n, win: 9 }); last = w.start; all.push(w.start);
    });
  });
  X.end(END);
});
