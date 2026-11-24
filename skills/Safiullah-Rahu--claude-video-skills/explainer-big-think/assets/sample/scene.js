/* "Why forgetting helps you learn" — Big Think-style graphics package around an illustrated, fictional expert.
 * Every cut sits on a word from data/vo.json. Layers: world (shots) · over (type) · cards (paper) · top (bug). */
X.boot(async (X) => {
  await X.loadVO();
  const F = BT.F, W = (id, w, n) => X.word(id, w, n), line = (id) => X.line(id);
  const L = BT.layers();

  // ------------------------------------------------------------------ edit decision list (all from word times)
  const T = {
    s2: W('hook', 'I') - 0.05,                 // punch-in on the second sentence
    s3: line('thesis').start - 0.09,           // wide + kinetic words
    s4: W('fade', 'brain') - 0.06,             // CGI neurons (glitch in)
    s5: W('fade', 'and') - 0.06,               // medium, backdrop edge visible
    series: line('fade').end + 0.27,
  };
  T.topic = T.series + 1.65;
  T.topicOut = W('ebb', 'In') - 0.49;
  T.slide = W('ebb', 'German') - 0.08;
  T.book = W('ebb', 'published') - 0.07;
  T.wide2 = W('ebb', 'on') - 0.05;
  T.med2 = W('syll', 'He') - 0.05;
  T.strip = W('syll', 'nonsense') - 0.07;
  T.zoom = W('syll', 'measured') - 0.45;
  T.watch = W('syll', 'measured') - 0.03;
  T.card1 = line('syll').end - 0.1;
  T.card1Out = W('curve', 'Memory') + 0.19;
  T.curve = T.card1 + 0.45;
  T.curveWide = W('curve', "That's") - 0.05;
  T.card2 = line('curve').end + 0.14;
  T.card2Out = W('miss', 'miss') - 0.42;
  T.med3 = T.card2 + 0.45;
  T.saw = W('miss', 'relearned') - 0.04;
  T.med4 = W('spread', 'And') - 0.03;
  T.bars = W('spread', 'took') - 0.04;
  T.wide3 = W('cram', 'Cramming') - 0.47;
  T.card3 = line('cram').end + 0.24;
  T.card3Out = W('recall', 'rereading') - 0.55;
  T.doc = T.card3 + 0.45;
  T.crash = W('recall', "It's") - 0.48;
  T.desk = W('recall', "It's") - 0.05;
  T.med5 = line('struggle').start - 0.06;
  T.syn = W('struggle', 'Psychologists') - 0.05;
  T.wide4 = W('close', 'So') - 0.14;
  T.med6 = W('close', "don't") - 0.07;
  T.punch2 = W('close', "That's") - 0.07;
  T.credits = line('close').end + 0.53;
  T.end = W('cta', 'For') - 0.08;
  const END = X.vo.duration;

  // ------------------------------------------------------------------ the interview set + fictional expert
  const st = BT.studio(L.world, { seed: 11 });
  BT.shot(st, 0, T.s2, 'med');
  BT.shot(st, T.s2, T.s3, 'punch');
  BT.shot(st, T.s3, T.s4, 'wide');
  BT.shot(st, T.s5, T.series, 'medR');
  BT.shot(st, T.topicOut, T.slide, 'med');
  BT.shot(st, T.wide2, T.med2, 'wide');
  BT.shot(st, T.med2, T.strip, 'medR');
  BT.shot(st, T.curveWide, T.med3, 'wide');
  BT.shot(st, T.med3, T.saw, 'med');
  BT.shot(st, T.med4, T.bars, 'medR');
  BT.shot(st, T.wide3, T.doc, 'wide');
  BT.shot(st, T.med5, T.syn, 'med');
  BT.shot(st, T.wide4, T.med6, 'wide');
  BT.shot(st, T.med6, T.punch2, 'med');
  BT.shot(st, T.punch2, T.credits, 'punch');
  const G = (id, w, d, arm, amt = 1) => ({ t: W(id, w), d, arm, amt });
  BT.expert(st.subject, {
    lines: X.vo.lines.map((l) => l.id).filter((i) => i !== 'cta'),
    visible: st.visibleAt,
    gestures: [
      G('hook', 'failure', 0.7, 'R'), G('hook', 'backwards', 0.8, 'B'), G('thesis', 'memory', 0.6, 'R', 0.8),
      G('fade', 'not', 0.7, 'B'), G('ebb', 'eighty-five', 0.7, 'R', 0.8), G('syll', 'lists', 0.6, 'L', 0.8),
      G('miss', 'miss', 0.5, 'R'), G('miss', 'Each', 0.5, 'B', 0.7), G('spread', 'spreading', 0.9, 'B'),
      G('cram', 'Cramming', 0.8, 'L'), G('cram', 'Spacing', 1.0, 'R'), G('struggle', 'struggle', 0.9, 'B'),
      G('hook', 'treat', 0.45, 'L', 0.6), G('syll', 'He', 0.5, 'R', 0.7), G('spread', 'several', 0.5, 'R', 0.8), G('cram', 'productive', 0.5, 'L', 0.7),
      G('struggle', 'point', 0.4, 'R', 0.7), G('close', 'away', 0.4, 'L', 0.6), G('close', 'slipping', 0.6, 'R', 0.8), G('close', 'panic', 0.4, 'B', 0.6), G('close', 'moment', 0.9, 'R'),
    ],
    nods: [W('hook', 'backwards'), W('thesis', 'memory'), W('fade', 'bug'), W('miss', 'miss'), W('cram', 'works'), W('struggle', 'point'), W('close', 'practice')],
  });
  BT.lowerThird(L.over, 'Ines Halvorsen, PhD', 'Cognitive psychologist · Author, “Remember on Purpose”', 0.85, T.s3 - 0.66);

  // ------------------------------------------------------------------ cold open
  X.scene('kinetic', T.s3, T.s4, (g) => {
    BT.kinetic(g, [
      { text: 'Forgetting', t: W('thesis', 'Forgetting') },
      { text: 'is part of', t: W('thesis', 'is') },
      { text: 'memory', t: W('thesis', 'memory') },
    ], { x: 312, y: 392, maxW: 372 });
  }, L.over);
  BT.cgi(L.world, T.s4, T.s5, { mode: 'field', seed: 7, n: 14, fadeAt: W('fade', 'fade') - T.s4, push: 0.14 });
  BT.glitch(L.world, T.s4);
  X.sfx(W('fade', 'fade'), 'woosh_low', { gain: 0.2, dur: 0.8 });

  // series card (original) on CGI sphere, then the topic card rolls down over it
  BT.cgi(L.world, T.series, T.topic + 0.45, { mode: 'sphere', seed: 3, n: 240 });
  X.scene('seriesTitle', T.series, T.topic + 0.45, (g) => {
    BT.seriesTitle(g, 'Thinking', 'in Long Form', 'an Open Question original series', T.series + 0.12);
  }, L.over);
  X.sfx(T.series, 'whoosh', { gain: 0.3, dur: 0.7 });
  BT.paperCard(L.cards, T.topic, { topic: true, title: 'Why forgetting helps you learn', tOut: T.topicOut });

  // ------------------------------------------------------------------ the experiment (slide projector archival)
  BT.slideFrame(L.world, T.slide, T.wide2, [
    {
      t: T.slide, build: (g, w, h) => {
        BT.plates.portrait(g, w, h);
        BT.annotate(g, 'Hermann Ebbinghaus', w * 0.6, h * 0.2, W('ebb', 'Hermann'),
          `M${w * 0.76},${h * 0.25} C${w * 0.74},${h * 0.33} ${w * 0.68},${h * 0.36} ${w * 0.6},${h * 0.33}`);
        const dates = BT.text(g, '1850–1909', w * 0.6, h * 0.2 + 56, { size: 30, italic: true, weight: 400, fill: '#eee' });
        X.tl.fromTo(dates, { opacity: 0 }, { opacity: 1, duration: F(6) }, W('ebb', 'Hermann') + F(8));
      },
    },
    {
      t: T.book, build: (g, w, h) => BT.plates.book(g, w, h, [
        { text: 'ÜBER', size: 34 }, { text: 'DAS GEDÄCHTNIS.', size: 56, gap: 22 },
        { text: 'Untersuchungen zur', size: 30, italic: true, gap: 26 }, { text: 'experimentellen Psychologie', size: 30, italic: true },
        { rule: true, gap: 14 }, { text: 'von', size: 26, italic: true, gap: 4 }, { text: 'Hermann Ebbinghaus', size: 38 },
        { rule: true, gap: 70 }, { text: 'LEIPZIG', size: 30, gap: 50 }, { text: '1885', size: 34 },
      ]),
    },
  ]);

  // nonsense syllables on a drifting film strip, zoom into the stopwatch frame
  const reveal = (el, cg, w, h, t) => {
    const cp = BT.clipRect(-w * 0.36, -h * 0.3, 0, h * 0.6);
    el.setAttribute('clip-path', cp.url);
    X.tl.to(cp.rect, { attr: { width: w * 0.72 }, duration: F(7), ease: 'power1.inOut' }, t);
    X.sfx(t, 'scribble', { gain: 0.14, dur: 0.3 });
  };
  const syl = (word, t, seed) => (g, w, h) => {
    const el = BT.plates.indexCard(g, w, h, word, { seed });
    if (t != null) reveal(el, null, w, h, t);
  };
  BT.filmStrip(L.world, T.strip, T.watch, [
    syl('MEP', null, 2), syl('DAX', W('syll', 'dax'), 4), syl('BOK', W('syll', 'bok'), 6), syl('ZIF', W('syll', 'zif'), 8),
    (g, w, h) => BT.plates.watch(g, w, h, { r: 0.36 }), syl('TUV', null, 10),
  ], { c0: 31, v: 150, zoomTo: 4, zoomAt: T.zoom });
  X.scene('watch', T.watch, T.curve, (g) => {
    const cam = X.svg('g', {}, g);
    const wt = BT.plates.watch(cam, 1920, 1080, { r: 0.466, cy: 0.552 });
    X.tl.fromTo(cam, { scale: 1 }, { scale: 1.07, duration: T.curve - T.watch, ease: 'none', svgOrigin: '960 560' }, T.watch);
    BT.tickWatch(wt, T.watch, T.curve, 18);
    BT.sepia(g, 0, 0, 1920, 1080, 0.28);
    BT.filmNoise(g, 0.2, { t0: T.watch, t1: T.curve, seed: 23 });
  }, L.world);

  // ------------------------------------------------------------------ 1 · the forgetting curve
  BT.paperCard(L.cards, T.card1, { num: 1, title: 'The forgetting curve', tOut: T.card1Out });
  // Ebbinghaus savings (fraction remembered) at 20 min, 1 h, 9 h, 1 d, 2 d, 6 d, 31 d; x = (t / 31 d)^0.35
  const EBB = [[0, 1], [0.067, 0.58], [0.099, 0.44], [0.213, 0.36], [0.30, 0.34], [0.383, 0.28], [0.563, 0.25], [1, 0.21]];
  const TICKS = [[0.099, '1 hour'], [0.30, '1 day'], [0.563, '6 days'], [1, '31 days']];
  const pushOn = (g, t0, t1) => { const c = X.svg('g', {}, g); X.tl.fromTo(c, { scale: 1 }, { scale: 1.045, duration: t1 - t0, ease: 'none', svgOrigin: '960 560' }, t0); return c; };
  X.scene('curve', T.curve, T.curveWide, (g0) => {
    BT.paperBG(g0, { seed: 12 });
    const g = pushOn(g0, T.card1Out, T.curveWide);
    const ax = BT.diagram.axes(g, { yLabel: 'Memory', xLabel: 'Time', ticks: TICKS, y0: 330, y1: 800 });
    const p = BT.diagram.curve(ax, EBB, g, { width: 6 });
    const t0 = T.card1Out + 0.25, dur = W('curve', 'off') - t0 + 0.1;
    X.drawOn(p, t0, dur, 'power1.inOut');
    X.sfx(t0, 'scribble', { gain: 0.16, dur });
    BT.text(g, 'After Ebbinghaus (1885): relearning savings', 1580, 920, { size: 26, italic: true, weight: 400, anchor: 'end', fill: '#555' });
    const Ltot = p.getTotalLength();
    EBB.slice(1).forEach(([u, v]) => { // dot pops when the line reaches it
      const px = ax.X(u), py = ax.Y(v);
      let best = 0, bd = 1e9;
      for (let s = 0; s <= 200; s++) { const q = p.getPointAtLength(Ltot * s / 200); const d = Math.hypot(q.x - px, q.y - py); if (d < bd) { bd = d; best = s / 200; } }
      const dot = X.svg('circle', { cx: px, cy: py, r: 11, fill: BT.C.ink }, g);
      const k = gsap.parseEase('power1.inOut');
      let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (k(m) < best) lo = m; else hi = m; }
      X.pop(dot, t0 + dur * lo, { dur: F(6), ease: 'back.out(2)', sfx: false });
    });
  }, L.world);

  X.scene('curveEcho', T.curveWide, T.med3, (g) => BT.kinetic(g, [
    { text: 'The', t: W('curve', 'the', 1) },
    { text: 'forgetting', t: W('curve', 'forgetting') },
    { text: 'curve', t: W('curve', 'curve') },
  ], { x: 312, y: 392, maxW: 372 }), L.over);

  // ------------------------------------------------------------------ 2 · the spacing effect
  BT.paperCard(L.cards, T.card2, { num: 2, title: 'The spacing effect', tOut: T.card2Out });
  X.scene('saw', T.saw, T.med4, (g0) => {
    BT.paperBG(g0, { seed: 14 });
    const g = pushOn(g0, T.saw, T.med4);
    const ax = BT.diagram.axes(g, { yLabel: 'Memory', xLabel: 'Time', y0: 330, y1: 800 });
    const ghost = BT.diagram.curve(ax, EBB, g, { width: 4, stroke: '#9A9A9A', attrs: { 'stroke-dasharray': '12 12' } });
    ghost.setAttribute('opacity', 0.8);
    const seg = (u0, u1, v1) => { // exponential-looking decay from 1.0 at u0 to v1 at u1
      const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14, u = u0 + (u1 - u0) * k; pts.push([u, v1 + (1 - v1) * Math.exp(-3.2 * k) * (1 - k * 0.04) - (1 - v1) * Math.exp(-3.2) * k]); }
      return BT.diagram.curve(ax, pts, g, { width: 6 });
    };
    const reviews = [0.16, 0.4, 0.68], floors = [0.5, 0.66, 0.78, 0.87];
    const times = [T.saw + 0.05, W('miss', 'relearned') + 0.3, W('miss', 'faded'), W('miss', 'slowly') + 0.05];
    const bounds = [0, ...reviews, 1];
    for (let i = 0; i < 4; i++) {
      const p = seg(bounds[i], bounds[i + 1], floors[i]);
      X.drawOn(p, times[i], i ? 0.48 : 0.38, 'power1.out');
      if (i > 0) { // the review: jump back to the top, marker on the baseline
        const x = ax.X(bounds[i]);
        const jump = X.svg('path', { d: `M${x},${ax.Y(floors[i - 1])} L${x},${ax.Y(1)}`, stroke: BT.C.ink, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, g);
        X.drawOn(jump, times[i] - F(3), F(3), 'power2.out');
        const m = X.svg('rect', { x: x - 9, y: ax.y1 - 9, width: 18, height: 18, fill: BT.C.ink }, g);
        X.pop(m, times[i] - F(3), { dur: F(6), ease: 'back.out(2)', sfx: 'blip_up', gain: 0.12 });
        const lab = BT.text(g, 'review', x, ax.y1 + 48, { size: 28, italic: true, weight: 400, anchor: 'middle' });
        X.tl.fromTo(lab, { opacity: 0 }, { opacity: 1, duration: F(4) }, times[i]);
      }
    }
    BT.text(g, 'Schematic', 1580, 920, { size: 26, italic: true, weight: 400, anchor: 'end', fill: '#555' });
    const tt = BT.text(g, 'Spaced reviews', 1100, 250, { size: 64, anchor: 'middle' });
    X.tl.fromTo(tt, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: F(6), ease: 'power3.out' }, T.saw + 0.1);
  }, L.world);

  X.scene('bars', T.bars, T.wide3, (g0) => {
    BT.paperBG(g0, { seed: 16 });
    const g = pushOn(g0, T.bars, T.wide3);
    BT.text(g, 'After Ebbinghaus (1885), to scale', 1460, 880, { size: 26, italic: true, weight: 400, anchor: 'end', fill: '#555' });
    const ttl = BT.text(g, 'Repetitions needed', 960, 330, { size: 70, anchor: 'middle' });
    X.tl.fromTo(ttl, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: F(6), ease: 'power3.out' }, T.bars + 0.08);
    // Ebbinghaus: spread over 3 days ≈ 38 repetitions vs ≈ 68 in a single day (bars to scale, no numbers shown)
    const rows = [
      { label: 'Spread over three days', y: 520, len: 1000 * 38 / 68, t: W('spread', 'fewer') - 0.1 },
      { label: 'Crammed into one day', y: 710, len: 1000, t: W('spread', 'cramming') - 0.05 },
    ];
    rows.forEach((r) => {
      const lab = BT.text(g, r.label, 460, r.y - 26, { size: 40, italic: true, weight: 400 });
      X.tl.fromTo(lab, { opacity: 0 }, { opacity: 1, duration: F(5) }, r.t - F(4));
      const bar = X.svg('rect', { x: 460, y: r.y, width: 0, height: 70, fill: BT.C.ink }, g);
      X.tl.fromTo(bar, { attr: { width: 0 } }, { attr: { width: r.len }, duration: r.len > 900 ? 0.85 : 0.6, ease: 'power3.out' }, r.t);
      X.sfx(r.t, 'slide', { gain: 0.16 });
    });
  }, L.world);

  X.scene('tapes', T.wide3, T.doc, (g) => {
    BT.labelTape(g, 'Cramming feels productive.', 1096, 404, W('cram', 'Cramming'), { size: 46 });
    BT.labelTape(g, 'Spacing actually works.', 1096, 486, W('cram', 'Spacing'), { size: 46 });
  }, L.over);

  // ------------------------------------------------------------------ 3 · retrieval
  BT.paperCard(L.cards, T.card3, { num: 3, title: 'Recall, don’t reread', tOut: T.card3Out });
  BT.docPush(L.world, T.doc, T.desk, (g) => {
    const page = X.svg('g', { transform: 'rotate(-2.5 960 560)' }, g);
    X.svg('rect', { x: 548, y: 96, width: 830, height: 960, fill: '#000', opacity: 0.4, transform: 'translate(10 12)' }, page);
    X.svg('rect', { x: 548, y: 96, width: 830, height: 960, fill: '#F3F0E7' }, page);
    X.svg('rect', { x: 640, y: 96, width: 2.5, height: 960, fill: '#D9A0A0' }, page);
    for (let y = 200; y < 1050; y += 70) X.svg('rect', { x: 548, y, width: 830, height: 1.6, fill: '#B9C7D8' }, page);
    const lines = ['Memory: ch. 3 notes', '• Ebbinghaus, 1885', '• nonsense syllables', '• savings = time to relearn', '• steep drop, then it levels', '• reread before the exam!!'];
    lines.forEach((s, i) => BT.text(page, s, 668, 188 + i * 140 - (i ? 0 : 0), { size: i ? 60 : 64, family: BT.hand, weight: 700, fill: '#23335A' }));
    const hl = (i, w, t) => {
      const r = X.svg('rect', { x: 660, y: 188 + i * 140 - 46, width: 0, height: 58, rx: 10, fill: BT.C.marker, opacity: 0.7, style: { mixBlendMode: 'multiply' } }, page);
      X.tl.fromTo(r, { attr: { width: 0 } }, { attr: { width: w }, duration: F(7), ease: 'power1.inOut' }, t);
      X.sfx(t, 'scribble', { gain: 0.14, dur: 0.3 });
    };
    hl(3, 560, W('recall', 'rereading') - 0.05);
    hl(4, 600, W('recall', 'your'));
    hl(5, 610, W('recall', 'notes') + 0.12);
  }, { crashAt: T.crash, focus: [930, 880], crashScale: 2.3, push: 1.1 });

  // desk at night: "Retrieval practice" tucked behind the mug (text-behind-object)
  X.scene('desk', T.desk, T.med5, (g) => {
    const bg = X.svg('g', {}, g), fg = X.svg('g', {});
    deskNight(bg);
    BT.titleOver(g, 'Retrieval practice', W('recall', 'recall') - F(1), { size: 128, y: 600 });
    g.appendChild(fg);
    const mug = mugArt(fg);
    for (const c of [bg, fg]) X.tl.fromTo(c, { scale: 1 }, { scale: 1.06, duration: T.med5 - T.desk, ease: 'none', svgOrigin: '960 600' }, T.desk);
    X.sfx(W('recall', 'recall'), 'whoosh', { gain: 0.12, dur: 0.5 });
    BT.filmNoise(g, 0.08, { t0: T.desk, t1: T.med5, seed: 29 });
  }, L.world);

  BT.cgi(L.world, T.syn, T.wide4, { mode: 'synapse', seed: 5, build: W('struggle', 'difficulty') - T.syn });
  BT.glitch(L.world, T.syn);
  X.scene('synTitle', T.syn, T.wide4, (g) => BT.titleOver(g, 'Desirable difficulty', W('struggle', 'desirable') - F(1), { size: 120, y: 940, shadow: true }), L.over);
  X.sfx(W('struggle', 'desirable'), 'sparkle', { gain: 0.08, dur: 0.8 });

  // ------------------------------------------------------------------ credits + end card (different voice CTA)
  BT.cgi(L.world, T.credits, T.end, { mode: 'tunnel', seed: 19, n: 12 });
  X.scene('credits', T.credits, T.end, (g) => {
    const lines = ['Illustration & animation: original work', 'Voice: Kokoro text-to-speech  ·  Score: synthesized', 'Ines Halvorsen is a fictional expert'];
    lines.forEach((s, i) => BT.text(g, s, 960, 462 + i * 54, { size: 30, italic: i === 2, weight: i === 2 ? 400 : 700, fill: '#E8EEF8', anchor: 'middle' }));
  }, L.over);
  X.sfx(T.credits, 'woosh_low', { gain: 0.2, dur: 0.8 });
  BT.cgi(L.world, T.end, END, { mode: 'sphere', seed: 9, n: 200, dim: 0.75, radius: 460, cy: 560 });
  BT.endCard(L.world, T.end, END, [
    { text: 'For more conversations like this', t: W('cta', 'For') },
    { text: 'Follow Open Question', t: W('cta', 'follow') },
  ], { small: 'New conversations every week', dark: true });

  BT.bug(L.top, 'O', 'Q', { t: 0.5, tHide: T.end });
  X.grain(0.045, 12);
  X.end(END);

  // ------------------------------------------------------------------ scene-specific art
  function deskNight(g) {
    X.svg('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: X.linear('dnWall', [[0, '#131A2B'], [1, '#232B40']]) }, g);
    const win = X.svg('g', {}, g);
    X.svg('rect', { x: 130, y: 80, width: 640, height: 470, fill: X.linear('dnWin', [[0, '#2C416B'], [1, '#1A2643']]) }, win);
    X.svg('circle', { cx: 640, cy: 170, r: 34, fill: '#DCE6F5', opacity: 0.85 }, win);
    X.svg('circle', { cx: 640, cy: 170, r: 90, fill: X.radial('dnMoon', [[0, '#BFD0F0', 0.35], [1, '#BFD0F0', 0]]) }, win);
    const r = X.rand(4);
    for (let i = 0; i < 46; i++) X.svg('rect', { x: 140 + r() * 620, y: 380 + r() * 160, width: 3 + r() * 5, height: 3 + r() * 4, fill: r() < 0.7 ? '#F2C77A' : '#9FC2F0', opacity: 0.5 + r() * 0.5 }, win);
    X.svg('path', { d: 'M130,470 L210,430 L260,450 L330,400 L400,440 L470,410 L560,450 L640,420 L770,460 L770,550 L130,550Z', fill: '#121A2E' }, win);
    X.svg('path', { d: 'M450,80 L450,550 M130,315 L770,315', stroke: '#0E1320', 'stroke-width': 14 }, win);
    X.svg('rect', { x: 130, y: 80, width: 640, height: 470, fill: 'none', stroke: '#0E1320', 'stroke-width': 20 }, win);
    X.svg('ellipse', { cx: 560, cy: 560, rx: 760, ry: 520, fill: X.radial('dnPool', [[0, '#FFC979', 0.42], [0.55, '#FFB65E', 0.12], [1, '#FFB65E', 0]]) }, g);
    // desk
    X.svg('rect', { x: 0, y: 770, width: 1920, height: 310, fill: X.linear('dnDesk', [[0, '#4A3020'], [1, '#22150D']]) }, g);
    X.svg('rect', { x: 0, y: 770, width: 1920, height: 5, fill: '#7A5034' }, g);
    X.svg('ellipse', { cx: 640, cy: 850, rx: 640, ry: 150, fill: X.radial('dnDeskPool', [[0, '#FFC27A', 0.42], [1, '#FFC27A', 0]]) }, g);
    // lamp
    X.svg('ellipse', { cx: 300, cy: 812, rx: 120, ry: 22, fill: '#1A1714' }, g);
    X.svg('path', { d: 'M300,806 L360,560 L520,410', fill: 'none', stroke: '#24201C', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    X.svg('path', { d: 'M470,330 L620,390 L585,470 L430,412Z', fill: '#2B2622' }, g);
    X.svg('path', { d: 'M430,412 L585,470 L900,840 L120,840Z', fill: X.linear('dnCone', [[0, '#FFD89A', 0.42], [1, '#FFD89A', 0]], 0, 0, 0, 1) }, g);
    X.svg('ellipse', { cx: 508, cy: 442, rx: 80, ry: 16, fill: '#FFE6B4', transform: 'rotate(21 508 442)' }, g);
    // open notebook + pencil + index cards
    X.svg('path', { d: 'M420,880 L760,850 L760,1010 L380,1050Z', fill: '#E9DBBD' }, g);
    X.svg('path', { d: 'M760,850 L1080,875 L1110,1045 L760,1010Z', fill: '#DCCCAA' }, g);
    X.svg('path', { d: 'M760,850 L760,1010', stroke: '#A08C68', 'stroke-width': 3 }, g);
    for (let i = 0; i < 6; i++) {
      X.svg('path', { d: `M${440 - i * 6},${905 + i * 22} L${740},${878 + i * 21}`, stroke: '#8D99B0', 'stroke-width': 2, opacity: 0.7 }, g);
      X.svg('path', { d: `M${780},${880 + i * 21} L${1070 + i * 5},${905 + i * 23}`, stroke: '#8D99B0', 'stroke-width': 2, opacity: 0.7 }, g);
    }
    X.svg('path', { d: 'M820,995 L1020,930', stroke: '#C9A042', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
    X.svg('path', { d: 'M1020,930 L1040,924', stroke: '#2A2A2A', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    X.svg('rect', { x: 1160, y: 880, width: 170, height: 110, fill: '#D9D3C7', transform: 'rotate(-6 1245 935)' }, g);
    X.svg('rect', { x: 1170, y: 868, width: 170, height: 110, fill: '#ECE7DC', transform: 'rotate(4 1255 923)' }, g);
    X.svg('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: X.radial('dnVig', [[0, '#000', 0.06], [0.7, '#000', 0.24], [1, '#000', 0.68]], 0.5, 0.5, 0.75) }, g);
  }
  function mugArt(g) {
    const m = X.svg('g', { transform: 'translate(150 0)' }, g);
    X.svg('ellipse', { cx: 1450, cy: 905, rx: 140, ry: 26, fill: '#000', opacity: 0.45 }, m);
    X.svg('path', { d: 'M1560,640 C1660,640 1666,800 1556,812', fill: 'none', stroke: '#BDB4A5', 'stroke-width': 30 }, m);
    X.svg('path', { d: 'M1330,560 L1570,560 L1556,880 C1556,915 1344,915 1344,880Z', fill: X.linear('mugBody', [[0, '#9D9486'], [0.25, '#DCD5C8'], [0.6, '#C9C1B3'], [1, '#7E7669']], 0, 0, 1, 0) }, m);
    X.svg('ellipse', { cx: 1450, cy: 560, rx: 120, ry: 26, fill: '#E7E1D6' }, m);
    X.svg('ellipse', { cx: 1450, cy: 563, rx: 104, ry: 19, fill: '#2B1A10' }, m);
    X.svg('path', { d: 'M1336,600 C1340,700 1346,800 1352,870', stroke: '#FFD9A0', 'stroke-width': 6, opacity: 0.45, fill: 'none' }, m);
    const steam = [0, 1, 2].map((i) => X.svg('path', { fill: 'none', stroke: '#E8E4F0', 'stroke-width': 9 - i * 2, 'stroke-linecap': 'round', opacity: 0.16 }, m));
    X.every((t) => {
      if (t < T.desk || t > T.med5) return;
      steam.forEach((p, i) => {
        const x0 = 1410 + i * 38, ph = t * 1.4 + i * 2;
        let d = `M${x0},545`;
        for (let k = 1; k <= 6; k++) d += ` L${(x0 + Math.sin(ph + k * 0.9) * (6 + k * 5)).toFixed(1)},${545 - k * 42}`;
        p.setAttribute('d', d);
      });
    });
    return m;
  }
});
