/* satire-cartoon starter (vertical 1080×1920): claim → "So why…?" → cost to you → callback on the counter.
 * Four hard-cut shots, every move placed on a word from data/vo.json. Replace the cast, sets and lines; keep the
 * grammar: one sentence = one shot = one literal gag, hard cuts ~2 frames before the sentence, the camera always
 * drifting, a flash frame on the reveal, counters that scramble and then explode on the last line.
 * Write your own lines and stage your own opening — reuse the beat map, never the source's sentences or compositions. */
X.boot(async (X) => {
  await X.loadVO();
  K.init(X);
  const C = K.C, W = (id, w, n = 0) => X.word(id, w, n), cut = (id) => X.line(id).start - 0.07;
  const END = X.vo.duration + 0.4;
  // cast (original): a mayor in a burgundy suit and the viewer in loungewear
  const MAYOR = { skin: '#f4b9a0', top: '#8e2f3c', topKind: 'suit', tie: '#2b417e', pants: '#6e2430', shoes: '#2b2235', hair: 'mayor', hairC: '#ece6db', stache: 'walrus', browC: '#e6e1d6', body: 'round', chain: true, cuffs: true };
  const YOU = { skin: '#f0c9a4', top: '#e2a93b', topKind: 'hoodie', pants: '#c8453c', pantsKind: 'tartan', shoes: '#4a6fd1', shoeKind: 'slipper', hair: 'messy', hairC: '#2f2630', stubble: true };
  const toon = (L, ctx, spec, o) => K.toon(L, { ...spec, ...o, vis: ctx.vis });

  // 1 — the reveal: a ribbon cutting in front of the prize; snip + flash + gleam; orbit to the circled calendar
  const c1 = cut('why');
  K.shot('ribbon', 0, c1, { bg: '#d6effc', drift: [0, 0, 0.012] }, (ctx) => {
    const bg = ctx.layer(0.6), mid = ctx.layer(1), fg = ctx.layer(1.5);
    K.outdoor(bg, { horizon: 900 });
    X.svg('rect', { x: -900, y: 520, width: 3200, height: 900, fill: K.paint('#ead3ab', 'vert') }, bg);
    for (let x = -720; x < 2300; x += 210) K.sr(bg, x, 562, 72, 830, '#f6ead2', 'cyl', 6);
    K.floor(mid, -900, 1380, 3200, 1100, '#efdcbf', { vpy: 700, n: 22, rows: 5, op: 0.3 });
    K.steamroller(mid, 790, 1660, 0.8, { label: 'ELM STREET' });
    const rib = K.ribbon(mid, 455, 1080, 1370, { h: 320 });
    const stand = K.g(mid);
    K.sr(stand, 1420, 1500, 22, 300, '#8a5a32', 'cyl', 6); K.sr(stand, 1800, 1500, 22, 300, '#8a5a32', 'cyl', 6);
    const cal = K.calendar(stand, 1380, 820, 450, { circle: [1, 5], cones: true });
    const mayor = toon(mid, ctx, MAYOR, { x: 245, y: 1800, s: 1.0, face: 'happy', pose: 'holdR' });
    const sc = K.scissors(mayor.slotR, 1.0);
    const plant = K.g(fg, { transform: 'translate(1460 1900)' });
    K.sr(plant, -90, -170, 180, 170, '#c9534a', 'side', 10);
    [[-60, -330, 120], [40, -380, 130], [-10, -460, 110]].forEach(([x, y, r]) => K.se(plant, x, y, r, r * 0.8, '#4f9d55', 'sphere'));
    K.move(ctx, 0, { s: 1.14, y: -40 }, 0.01); K.move(ctx, 0.02, { s: 1, y: 0 }, 1.0, 'power2.out');
    const ts = W('hook', 'every');
    sc.snip(ts); rib.snip(ts + 0.02);
    K.flash(ts + 0.05, 0.8);
    K.sparkles(mid, [[620, 1300, 54], [900, 1120, 42], [470, 1480, 34], [1010, 1380, 44]], ts + 0.1);
    const to = W('hook', 'and') - 0.05;
    K.orbit(ctx, to, 900, 1.0, { r: -2, to: { s: 1.06 } });
    mayor.pose(to, 'rest', 0.2); mayor.face(to, 'smug'); mayor.turn(to, 0.9);
    mayor.walk(to + 0.05, to + 0.95, { x: 1215, y: 1800 });
    mayor.pose(W('hook', 'week') - 0.15, 'pointR', 0.22);
    const te = W('hook', 'election');
    X.drawOn(cal.ring, te - 0.05, 0.35); X.sfx(te - 0.05, 'scribble', { dur: 0.35, gain: 0.4 });
  });

  // 2 — "So why…?": the viewer at the calendar, fist on chin
  const c2 = cut('cost');
  K.shot('why', c1, c2, { bg: C.pink, drift: [-26, 0, 0.032] }, (ctx) => {
    const bg = ctx.layer(0.85), mid = ctx.layer(1);
    X.svg('rect', { x: -900, y: -600, width: 3000, height: 3200, fill: X.linear('pinkwall', [[0, C.pinkTop], [0.18, '#c9a6ad'], [0.32, C.pink], [1, '#e3c8c1']]) }, bg);
    const cal = K.calendar(bg, 560, 250, 500, { circle: [1, 5], cones: true });
    const you = toon(mid, ctx, YOU, { x: 330, y: 2260, s: 1.62, face: 'think', pose: 'chin' });
    you.look(0, 14, -10);
    const te = W('why', 'election');
    you.look(te, 18, -16, 0.1);
    X.tl.fromTo(cal.hl, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, te);
  });

  // shared consequence set: street + price-sign counter + repair-bill read-out
  const street = (ctx) => {
    const bg = ctx.layer(0.8), mid = ctx.layer(1);
    K.outdoor(bg, { horizon: 980 });
    K.tree(bg, 1500, 1040, 1.2);
    K.shopfront(bg, -330, 1180, 790, 540, { name: 'TYRES & BIKES' });
    const led = K.led(bg, 150, 800, 390, 140, '$0.00', { label: 'YOUR REPAIR BILL' });
    const sign = K.priceSign(bg, 600, 160, { rows: [['POTHOLES', '3'], ['FIXED', '0']], w: 400, pole: 900 });
    K.road(mid, 1300, 1300);
    return { bg, mid, led, sign };
  };
  // 3 — the cost to you: the counter scrambles as you find the hole
  const c3 = cut('punch');
  K.shot('cost', c2, c3, { bg: '#d6effc', drift: [20, 0, 0.02] }, (ctx) => {
    const E = street(ctx);
    const holes = K.counter(E.sign.rows[0], '3'), bill = K.counter(E.led.text, '$0.00', (v) => '$' + v.toFixed(2));
    K.pothole(E.mid, 600, 1720, 330, 96, 31);
    const you = toon(E.mid, ctx, YOU, { x: 330, y: 1800, s: 1.12, face: 'tired', pose: 'rest' });
    const th = W('cost', 'hit');
    you.moveTo(th - 0.25, { x: 600, y: 1760 }, 0.25, 'power2.in'); you.set(th, { sink: 140 }, 0.12, 'power3.in');
    K.splash(E.mid, 600, 1720, th + 0.02, { n: 12, r: 80 });
    you.face(th, 'shocked'); you.face(th + 0.5, 'sad');
    holes.slot(th, th + 0.4, '212');
    bill.roll(th + 0.1, th + 0.8, 0, 148.7);
  });

  // 4 — the callback: the meter explodes and your pothole wins a rosette
  K.shot('punch', c3, END, { bg: '#d6effc', drift: [0, 0, 0.02] }, (ctx) => {
    const E = street(ctx);
    const holes = K.counter(E.sign.rows[0], '212', (v) => Math.round(v).toLocaleString('en-US'));
    const bill = K.counter(E.led.text, '$148.70', (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    K.pothole(E.mid, 690, 1700, 520, 150, 41);
    const you = toon(E.mid, ctx, YOU, { x: 690, y: 1760, s: 1.16, face: 'tired', pose: 'rest' });
    you.set(0, { sink: 150 }, 0.01);
    const front = K.g(E.mid);
    X.svg('path', { d: 'M430,1700 Q690,1830 950,1700 Q960,1770 690,1800 Q420,1770 430,1700Z', fill: C.holeRim, stroke: C.ink, 'stroke-width': 4 }, front);
    const t0 = c3 + 0.2;
    holes.exp(t0, END, 212, 2191); bill.exp(t0, END, 148.7, 2191.73);
    for (let tt = t0; tt < END - 0.1; tt += Math.max(0.05, 0.16 - 0.04 * (tt - t0))) X.sfx(tt, 'tick', { gain: 0.16 });
    const tr = W('punch', 'Re-elected');
    const stake = K.g(E.mid);
    X.svg('line', { x1: 400, y1: 1720, x2: 400, y2: 1500, stroke: '#b98552', 'stroke-width': 10, 'stroke-linecap': 'round' }, stake);
    K.rosette(stake, 400, 1480, 0.7, 'RE-ELECTED', { above: true });
    gsap.set(stake, { scale: 0, transformOrigin: '400px 1720px' });
    X.tl.fromTo(stake, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)', immediateRender: false }, tr - 0.05);
    X.sfx(tr - 0.05, 'success', { gain: 0.35 });
    K.confetti(E.mid, tr, END + 0.1, { n: 60, seed: 9, pre: false });
    you.face(tr, 'sad');
  });

  K.captions(X.vo, { size: 37 });
  X.grain(0.035, 12);
  X.end(END);
});
