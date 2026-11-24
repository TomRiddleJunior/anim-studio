/* psa-reel sample — "BE FAST": a 70 s Hindi stroke-awareness reel in the medical-plate PSA style (original work).
 * 17 hard-cut cards; every card = ground + top rule (label · FIG. n) + two-line Hinglish heading + one picture. */
X.boot(async (X) => {
  await X.loadVO();
  PK.init(X);
  const C = PK.C, W = X.W, H = X.H;
  const L = (id) => X.line(id);
  const w = (id, word, nth = 0) => PK.w(id, word, nth);
  const ids = ['hook', 'galat', 'stroke', 'minute', 'window', 'befast', 'b', 'e', 'f', 'a', 's', 't', 'note', 'paani', 'koibhi', 'family', 'comment'];
  const END = X.vo.duration || 70;
  const cutAt = ids.map((id, i) => (i === 0 ? 0 : L(id).start - 0.14));
  const span = (i) => [cutAt[i], i + 1 < ids.length ? cutAt[i + 1] : END];
  const card = (i, o) => { const [a, b] = span(i); return PK.card(i + 1, a, b, o); };
  X.grain(0.05, 12, 'overlay');

  // Dadaji — the same cut-out patient on every sign card (cream kurta, brown Nehru jacket, white hair, glasses)
  const dadaji = (g, x, y, s, o = {}) => PK.person(g, x, y, Object.assign({
    scale: s, skin: '#b9794f', hair: 'white', hairC: '#e6e1d6', top: 'kurta', topC: '#ece3d0', print: '#d9cdb2',
    jacket: '#6a4a34', bottom: 'pyjama', botC: '#f1ebdf', shoe: '#6b4a2e', glasses: true, moustache: '#e9e5dc',
  }, o));

  // ============================================================ 1 HOOK — Sunday lunch, Dadaji's speech stalls, cup drops
  {
    const c = card(0, { ground: 'cream', label: 'Emergency' });
    const g = c.layer;
    const gar = PK.garland(g, 470, { sag: 60, seed: 3 });
    X.every((t) => gar.g.setAttribute('transform', `translate(0,${(Math.sin(t * 1.3) * 3).toFixed(2)})`));
    const DX = 400, DY = 1650, DS = 1.45, A = 38 * Math.PI / 180;
    const sway = X.svg('g', {}, g);
    const p = dadaji(sway, DX, DY, DS, { armR: -38, armL: 8 });
    // the cup sits in his raised hand, then drops onto the table
    const hand = { x: DX + DS * (86 + Math.sin(A) * 246), y: DY + DS * (-544 + Math.cos(A) * 246) };
    const cup = PK.cup(g, hand.x + 14, hand.y + 18);
    cup.saucer.setAttribute('opacity', 0);
    PK.table(g, 540, 1335, 860, { drop: 345 });
    PK.plate(g, 290, 1318);
    const spill = X.svg('ellipse', { cx: hand.x + 70, cy: 1338, rx: 90, ry: 16, fill: '#8a5a33', opacity: 0 }, g);
    PK.head(c, 'Sunday lunch pe...', 'achanak atke', 0.05, w('hook', 'अचानक'));
    const tb = w('hook', 'बोलते');
    PK.bubble(g, '"Beta, wo... w-wo..."', 745, 560, { t: tb, size: 46, tail: -0.36 });
    const tAtak = w('hook', 'अटक');
    p.droop(tAtak, 0.4);
    X.tl.fromTo(sway, { rotation: 0 }, { rotation: 2.2, svgOrigin: `${DX} ${DY}`, duration: 0.6, ease: 'power2.inOut', immediateRender: false }, tAtak);
    PK.stamp(g, 'Boli atki', 800, 790, { t: tAtak + 0.35, rot: -6, size: 58 });
    // cup falls on "gir": gravity drop from the hand onto the table, rolls onto its side, chai spills
    const tg = w('hook', 'गिर');
    gsap.set(cup.cup, { svgOrigin: '0 0' });
    X.tl.fromTo(cup.cup, { x: 0, y: 0, rotation: 0 }, { x: 60, y: 1326 - (hand.y + 18), rotation: 96, duration: 0.34, ease: 'power2.in', immediateRender: false }, tg - 0.12);
    X.sfx(tg + 0.22, 'drop', { gain: 0.4 }); X.sfx(tg + 0.22, 'thud', { gain: 0.35 });
    X.tl.fromTo(spill, { opacity: 0, attr: { rx: 20 } }, { opacity: 0.85, attr: { rx: 110 }, duration: 0.5, ease: 'power2.out', immediateRender: false }, tg + 0.22);
    X.tl.fromTo(p.armR, { rotation: -38 }, { rotation: -16, svgOrigin: '0 0', duration: 0.4, ease: 'power2.out', immediateRender: false }, tg);
    PK.push(c, 1.0, 1.035, { origin: [DX, 1100] });
    PK.hand(g, 'aap kya karoge?', 110, 1770, { t: w('hook', 'आप'), rot: -9, size: 92, dur: 0.6 });
    for (let k = 0; k < 6; k++) X.sfx(0.15 + k * 0.82, 'heartbeat', { dur: 0.45, gain: 0.32 });
  }

  // ============================================================ 2 GALAT — "lie down, you'll be fine by morning"
  {
    const c = card(1, { ground: 'cream', label: 'Galat' });
    const g = c.layer;
    PK.head(c, 'Zyaada log', 'ye kehte hain', c.t0 + 0.06, w('galat', 'कहते'));
    const pil = PK.place(g, 360, 820); PK.pillow(pil, 0, 0, { s: 1.05 });
    PK.pop(pil, w('galat', 'लेट') - 0.1);
    PK.tape(g, 'Let jao', 360, 1000, { t: w('galat', 'लेट') + 0.1, rot: -3 });
    PK.x(g, 360, 830, 330, w('galat', 'जाओ') + 0.15);
    const al = PK.place(g, 700, 1290); PK.alarm(al, 0, 0, { s: 1.0 });
    PK.pop(al, w('galat', 'सुबह') - 0.08);
    PK.tape(g, 'Subah tak', 700, 1470, { t: w('galat', 'तक'), rot: 2 });
    PK.x(g, 700, 1290, 330, w('galat', 'जाओगे') + 0.1);
  }

  // ============================================================ 3 STROKE — brain plate, vessel, clot, bleed
  {
    const c = card(2, { ground: 'grid', label: 'Stroke' });
    const g = c.layer;
    PK.head(c, 'Shayad', 'brain stroke', c.t0 + 0.05, w('stroke', 'ब्रेन'));
    const br = PK.brain(g, 520, 1030, { s: 1.38, dark: true });
    PK.show(br.g, c.t0 + 0.1, 0.12);
    br.beat(c.t0, w('stroke', 'रुकता'), 1.15, 0.6);
    br.vessels(w('stroke', 'दिमाग'), 0.7);
    br.clot(w('stroke', 'रुकता'));
    br.spread(w('stroke', 'रुकता') + 0.1, c.t1 - 0.05, 0.9);
    for (let n = 0; c.t0 + (n + 0.25) / 1.15 < w('stroke', 'रुकता'); n++) X.sfx(c.t0 + (n + 0.25) / 1.15 - 0.04, 'heartbeat', { dur: 0.45, gain: 0.3 });  // pulses stop at the clot
    // haemorrhagic alternative: a red burst where a vessel "phat-ti hai"
    const burst = PK.place(g, 520 + 1.38 * -120, 1030 + 1.38 * -120);
    X.svg('path', { d: 'M0,-34 L10,-12 L34,-16 L16,4 L28,28 L2,16 L-16,34 L-14,8 L-36,0 L-12,-10 Z', fill: '#d8434a', filter: 'url(#pkGlowRedS)' }, burst);
    PK.pop(burst, w('stroke', 'फटती'), { sfx: 'pop', pitch: 0.7 });
    PK.tape(g, 'Clot  ya  bleed', 540, 1560, { t: w('stroke', 'या'), rot: -2, size: 44 });
  }

  // ============================================================ 4 HAR MINUTE — time is brain, flip counter
  {
    const c = card(3, { ground: 'grid', label: 'Time is brain · Saver 2006' });
    const g = c.layer;
    PK.head(c, 'Har minute', '~19 lakh neurons', c.t0 + 0.05, w('minute', 'उन्नीस'));
    const br = PK.brain(g, 520, 900, { s: 1.12, dark: true, seed: 11 });
    br.spread(c.t0, c.t1, 1.1);
    br.dim(c.t0 + 0.4, 0.15, c.t1 - c.t0 - 0.6);
    gsap.set(br.vg, { opacity: 0.85 });
    br.beat(c.t0, c.t1, 0.9, 0.4);
    const t0 = w('minute', 'हर');
    const rowA = PK.flip(g, '0 MIN', 520, 1290, { t: t0 - 0.2, w: 96, h: 130 });
    const rowB = PK.flip(g, '00 LAKH', 520, 1450, { t: t0 - 0.1, w: 96, h: 130 });
    const t1 = c.t1 - 0.25;
    const valsB = [], valsA = [];
    for (let k = 0; k <= 95; k += 1) valsB.push(String(k).padStart(2, '0') + ' LAKH');
    rowB.run(t0 + 0.1, t1, valsB, 4);
    for (let m = 1; m <= 5; m++) rowA.set(t0 + 0.1 + (t1 - t0 - 0.1) * (m * 19 / 95), `${m} MIN`);
    X.svg('text', { x: 520, y: 1572, 'text-anchor': 'middle', 'font-family': PK.F.mono, 'font-weight': 500, 'font-size': 20, 'letter-spacing': 5, fill: '#8d877c', text: 'NEURONS LOST · LARGE-VESSEL STROKE · EST.' }, g);
  }

  // ============================================================ 5 TREATMENT WINDOW — clock pie, 4.5 h
  {
    const c = card(4, { ground: 'cream', label: 'Treatment window' });
    const g = c.layer;
    PK.head(c, 'Clot-buster ilaaj', '~4.5 ghante', c.t0 + 0.06, w('window', 'साढ़े'));
    PK.push(c, 1.0, 1.05, { origin: [530, 990] });
    PK.clockPie(g, 530, 990, 300, 4.5, w('window', 'आम') - 0.1, { label: '4.5 H', dur: 1.3 });
    PK.tape(g, [{ text: 'Jitna jaldi,', t: w('window', 'जितना') }, { text: 'utna behtar', t: w('window', 'उतना') }], 530, 1480, { rot: -2, gap: 26, size: 48 });
  }

  // ============================================================ 6 BE FAST — glowing letters on the dark board
  {
    const c = card(5, { ground: 'brown', label: '6 signs', spot: [W * 0.5, H * 0.56], spotColor: C.spotWarm });
    const g = c.layer;
    PK.head(c, 'Pehchaanna', 'aapko hai', c.t0 + 0.05, w('befast', 'आपको'));
    const gB = PK.glowWord(g, 'B', 400, 900, w('befast', 'बी') - 0.03, c.t1, { size: 380 });
    const gE = PK.glowWord(g, 'E', 680, 900, w('befast', 'ई') - 0.03, c.t1, { size: 380 });
    const gF = PK.glowWord(g, 'FAST', 540, 1300, w('befast', 'फ़ास्ट') - 0.03, c.t1, { size: 380, color: C.redHi, red: true, sfx: 'impact', gain: 0.45 });
    [gB, gE, gF].forEach((e, k) => PK.flicker(e.firstChild, c.t0, c.t1, { lo: 0.8, hz: 2.1 + k * 0.4 }));
  }

  // ============================================================ 7–11 the signs, one card each (Dadaji every time)
  const signCard = (i, letter, l1, l2, id, stress) => {
    const c = card(i, { ground: 'cream', label: `Sign ${letter}` });
    PK.head(c, l1, l2, c.t0 + 0.05, w(id, stress));
    PK.circle(c.g, letter, 132, 610, { t: c.t0 + 0.12, r: 84 });
    return c;
  };
  { // B — balance: he sways about his feet, dizzy swirls
    const c = signCard(6, 'B', 'B · Balance', 'chakkar?', 'b', 'चक्कर');
    const g = c.layer;
    const sway = X.svg('g', {}, g);
    dadaji(sway, 560, 1720, 1.45);
    const t = w('b', 'अचानक');
    gsap.set(sway, { rotation: 0, svgOrigin: '560 1720' });
    X.tl.to(sway, { keyframes: [{ rotation: -5, duration: 0.35 }, { rotation: 6, duration: 0.5 }, { rotation: -3, duration: 0.45 }, { rotation: 2, duration: 0.4 }], ease: 'sine.inOut' }, t);
    // dizzy orbit: a dashed red ring over his head with three stars circling it; sway brackets either side
    const tc = w('b', 'चक्कर');
    const orb = X.svg('g', {}, sway);
    X.svg('ellipse', { cx: 560, cy: 650, rx: 120, ry: 34, fill: 'none', stroke: C.red, 'stroke-width': 5, 'stroke-dasharray': '14 12' }, orb);
    const star = 'M0,-20 L6,-6 L21,-6 L9,3 L13,18 L0,9 L-13,18 L-9,3 L-21,-6 L-6,-6 Z';
    const stars = [0, 1, 2].map(() => X.svg('path', { d: star, fill: C.red }, orb));
    X.every((tt) => stars.forEach((e, k) => { const a = (tt - tc) * 3.2 + k * 2.09; e.setAttribute('transform', `translate(${(560 + Math.cos(a) * 120).toFixed(1)},${(650 + Math.sin(a) * 34).toFixed(1)}) scale(${(0.8 + 0.25 * Math.sin(a)).toFixed(3)})`); }));
    PK.pop(orb, tc - 0.05, { dur: 0.18, sfx: 'chime', gain: 0.25 });
    for (const sx of [-1, 1]) {
      const br = X.svg('path', { d: `M${560 + sx * 250},880 Q${560 + sx * 300},1050 ${560 + sx * 250},1220`, fill: 'none', stroke: C.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      X.drawOn(br, t + 0.2 + (sx > 0 ? 0.1 : 0), 0.3);
    }
    X.sfx(t, 'woosh_low', { dur: 0.8, gain: 0.3 });
  }
  { // E — eyes: engraving + chart that blurs and half-veils
    const c = signCard(7, 'E', 'E · Eyes', 'dhundhla?', 'e', 'धुंधला');
    const g = c.layer;
    const ey = PK.eye(g, 560, 860, { s: 0.92, dark: false });
    PK.pop(ey.g, c.t0 + 0.15, { dur: 0.18, sfx: 'paper' });
    const sn = PK.snellen(g, 560, 1370, { w: 500, h: 520, rot: 2 });
    PK.pop(sn.g, w('e', 'आइज़') - 0.05, { dur: 0.18, sfx: 'paper' });
    sn.blur(w('e', 'धुंधला'), 7);
    PK.push(c, 1.0, 1.05, { origin: [560, 1100] });
  }
  { // F — face: close-up bust, smile request, one side droops
    const c = signCard(8, 'F', 'F · Face', 'ek taraf latka?', 'f', 'लटके');
    const g = c.layer;
    const bust = X.svg('g', {}, g);
    const cid = PK.uid('pkBust'); const cp = X.svg('clipPath', { id: cid }, X.defs); X.svg('rect', { x: 0, y: 0, width: W, height: H * 0.95 }, cp);
    bust.setAttribute('clip-path', `url(#${cid})`);
    const p = dadaji(bust, 560, 3080, 3.2, { edge: 3 });
    PK.bubble(g, '"Zara muskuraiye!"', 640, 640, { t: w('f', 'मुस्कुराओ'), size: 50, tail: -0.25 });
    p.droop(w('f', 'लटके') - 0.15, 0.45);
    const ring = X.svg('ellipse', { cx: 560 + 3.2 * 13, cy: 3080 + 3.2 * -600, rx: 66, ry: 44, fill: 'none', stroke: C.red, 'stroke-width': 6, 'stroke-dasharray': '16 12' }, g);
    PK.show(ring, w('f', 'लटके') + 0.25, 0.1);
    PK.push(c, 1.0, 1.07, { origin: [600, 1150] });
    X.sfx(w('f', 'लटके') + 0.25, 'blip_down', { gain: 0.25 });
  }
  { // A — arms: both up, one drifts down
    const c = signCard(9, 'A', 'A · Arms', 'ek haath gira?', 'a', 'गिरे');
    const g = c.layer;
    const p = dadaji(g, 560, 1760, 1.3, { armL: 6, armR: -6 });
    const tu = w('a', 'उठाओ') - 0.15;
    X.tl.fromTo(p.armL, { rotation: 6 }, { rotation: 168, svgOrigin: '0 0', duration: 0.32, ease: 'back.out(1.6)', immediateRender: false }, tu);
    X.tl.fromTo(p.armR, { rotation: -6 }, { rotation: -168, svgOrigin: '0 0', duration: 0.32, ease: 'back.out(1.6)', immediateRender: false }, tu + 0.04);
    X.sfx(tu, 'swoosh', { gain: 0.3 });
    const tf = w('a', 'नीचे') - 0.1;
    X.tl.to(p.armR, { rotation: -112, svgOrigin: '0 0', duration: 0.9, ease: 'power1.inOut' }, tf);
    const arc = X.svg('path', { d: 'M800,610 C900,690 930,790 900,900', fill: 'none', stroke: C.red, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    X.drawOn(arc, tf + 0.25, 0.5);
    const head = X.svg('path', { d: 'M878,880 L902,912 L922,872 Z', fill: C.red }, g);
    PK.show(head, tf + 0.7, 0.08);
    X.sfx(tf, 'blip_down', { dur: 0.6, gain: 0.25 });
  }
  { // S — speech: bubble garbles, check card crossed
    const c = signCard(10, 'S', 'S · Speech', 'boli atki?', 's', 'अटके');
    const g = c.layer;
    const bust = X.svg('g', {}, g);
    const cid = PK.uid('pkBust'); const cp = X.svg('clipPath', { id: cid }, X.defs); X.svg('rect', { x: 0, y: 0, width: W, height: 1290 }, cp);
    bust.setAttribute('clip-path', `url(#${cid})`);
    dadaji(bust, 560, 2300, 2.05, { edge: 3 });
    const b = PK.bubble(g, '"Aaj mausam achha hai"', 600, 640, { t: w('s', 'स्पीच'), size: 48, tail: -0.2 });
    const tA = w('s', 'अटके');
    const alt = ['"Aaj mau... m-mausam..."', '"Aaj... s-sam... ha..."'];
    X.every((t) => { const s = t < tA ? '"Aaj mausam achha hai"' : t < tA + 0.45 ? alt[0] : alt[1]; if (b.text.textContent !== s) b.text.textContent = s; });
    X.sfx(tA, 'glitch', { dur: 0.25, gain: 0.25 });
    const ck = PK.check(g, 'Check', ['Saaf bole?', 'Sentence dohraaye?'], 560, 1480, { t: tA - 0.1, w: 640, rowH: 80 });
    ck.cross(0, tA + 0.15);
    ck.cross(1, w('s', 'उलझे'));
  }

  // ============================================================ 12 T — TIME: dial 112, tape 108, ambulance on the floor band
  {
    const c = card(11, { ground: 'mint', label: 'Sign T' });
    const g = c.layer;
    PK.head(c, 'T · Time', '112 call', c.t0 + 0.05, w('t', 'बारह'));
    const ph = PK.phone(g, 520, 1030, { mode: 'dial', t: c.t0 + 0.12, w: 440, h: 790, rot: -4 });
    ph.type([w('t', 'एक'), w('t', 'सौ'), w('t', 'बारह') + 0.05], '112');
    ph.ring(w('t', 'बारह') + 0.35);
    PK.tape(g, 'Ambulance: 108', 560, 1530, { t: w('t', 'आठ'), rot: -2, size: 50 });
    const amb = X.svg('g', {}, g);
    PK.ambulance(amb, 720, 1840, { s: 0.62 });
    PK.slide(amb, w('t', 'कॉल') - 0.05, { dx: 700, dur: 0.36 });
    for (let k = 0; k < 4; k++) X.sfx(w('t', 'कॉल') + k * 0.32, 'beep', { dur: 0.3, pitch: k % 2 ? 0.86 : 0.69, gain: 0.16 });
  }

  // ============================================================ 13 NOTE — when did it start? flip clock
  {
    const c = card(12, { ground: 'brown', label: 'Note', spot: [W * 0.5, H * 0.5], spotColor: C.spotWarm });
    const g = c.layer;
    PK.head(c, 'Kab shuru hua?', 'time note karo', c.t0 + 0.05, w('note', 'नोट'), { max2: W * 0.84 });
    const fl = PK.flip(g, '2:35', 540, 950, { t: c.t0 + 0.15, w: 150, h: 210, gap: 14 });
    fl.set(w('note', 'वो') + 0.05, '2:36');
    PK.push(c, 1.0, 1.06, { origin: [540, 1000] });
    const tm = X.svg('text', { x: 540, y: 1135, 'text-anchor': 'middle', 'font-family': PK.F.mono, 'font-weight': 600, 'font-size': 30, 'letter-spacing': 8, fill: '#bdb3a2', text: 'PM · SYMPTOMS SHURU' }, g);
    PK.show(tm, w('note', 'शुरू'), 0.1);
    PK.hand(g, 'doctor ko batana hai!', 540, 1330, { t: w('note', 'टाइम'), rot: -7, size: 84, color: '#eadbc6', anchor: 'middle', dur: 0.7 });
    X.sfx(c.t0 + 0.2, 'tick', { gain: 0.3 }); X.sfx(c.t0 + 1.2, 'tock', { gain: 0.25 });
  }

  // ============================================================ 14 DON'T — no water, no food
  {
    const c = card(13, { ground: 'mint', label: "Don't" });
    const g = c.layer;
    PK.head(c, 'Paani, khaana?', 'abhi nahi', c.t0 + 0.05, w('paani', 'मत'));
    const gl = PK.place(g, 320, 1100); PK.glass(gl, 0, 160, { s: 1.5 });
    PK.pop(gl, w('paani', 'पानी') - 0.05);
    const pl = PK.place(g, 750, 1080, 0, 1.9); PK.plate(pl, 0, 0);
    PK.pop(pl, w('paani', 'खाना') - 0.05);
    PK.x(g, 320, 1090, 360, w('paani', 'मत') + 0.1);
    PK.x(g, 750, 1070, 360, w('paani', 'देना'));
    PK.stamp(g, 'Nigalna mushkil', 540, 1440, { t: w('paani', 'निगलने') + 0.1, rot: -4, size: 64 });
  }

  // ============================================================ 15 KOI BHI — anyone can spot it
  {
    const c = card(14, { ground: 'cream', label: 'Anyone' });
    const g = c.layer;
    PK.head(c, 'Koi bhi', 'pehchaan sakta hai', c.t0 + 0.05, w('koibhi', 'पहचान'));
    const fam = X.svg('g', {}, g);
    const y = 1840;
    PK.person(fam, 175, y, { scale: 1.32, skin: '#c48a5c', hair: 'short', hairC: '#1a1410', top: 'shirt', topC: '#9cbbe0', bottom: 'trousers', botC: '#2c3446', shoe: '#2a1d14', moustache: true, armL: 4, armR: -3 });
    PK.person(fam, 410, y, { scale: 1.22, f: true, skin: '#c98e62', hair: 'long', hairC: '#20160f', top: 'kameez', topC: '#3aa5a0', print: '#e7f2ec', bottom: 'salwar', botC: '#3aa5a0', dupatta: '#e8efe6', shoe: '#8a5a3a', bindi: true, armL: 3, armR: -3 });
    PK.person(fam, 655, y, { scale: 1.25, skin: '#b8794d', hair: 'short', hairC: '#16110d', top: 'hoodie', topC: '#2b3654', bottom: 'jeans', botC: '#4b6b98', shoe: '#ece8e0', armL: 3, armR: -4 });
    PK.person(fam, 900, y, { scale: 1.2, f: true, skin: '#b8804f', hair: 'bun', hairC: '#dcd7cd', top: 'saree', topC: '#8b2f3a', border: '#d6b25e', shoe: '#6b4a2e', glasses: true, bindi: true, armL: 3, armR: -3 });
    PK.pop(fam, c.t0 + 0.1, { from: 0.85, dur: 0.22 });
    PK.push(c, 1.0, 1.06, { origin: [540, 1400] });
    const lbl = (txt, x, yy, t) => { const e = X.svg('text', { x, y: yy, 'text-anchor': 'middle', 'font-family': PK.F.head, 'font-weight': 700, 'font-size': 50, fill: C.ink, text: txt }, g); PK.pop(e, t, { sfx: 'pop', gain: 0.22 }); };
    const tk = w('koibhi', 'कोई');
    lbl('PAPA', 175, 880, tk); lbl('DIDI', 410, 950, tk + 0.12); lbl('BETA', 655, 935, tk + 0.24); lbl('DADI', 900, 925, tk + 0.36);
    PK.hand(g, 'aap bhi!', 560, 740, { t: w('koibhi', 'सकता'), rot: -6, size: 90, anchor: 'middle', dur: 0.4 });
  }

  // ============================================================ 16 SHARE — family group chat
  {
    const c = card(15, { ground: 'mint', label: 'Share' });
    const g = c.layer;
    PK.head(c, 'Family group', 'mein bhejo', c.t0 + 0.05, w('family', 'भेजो'));
    const ph = PK.phone(g, 520, 1080, { mode: 'chat', title: 'Family', t: c.t0 + 0.1, w: 520, h: 900, rot: 3 });
    ph.card('BE FAST', 'Stroke ke 6 sign, zaroor dekho!', w('family', 'वीडियो'));
    ph.msg('Bahut kaam ki baat', w('family', 'ग्रुप'));
    ph.msg('Forward kar diya', w('family', 'भेजो') + 0.2, { me: true });
    PK.push(c, 1.0, 1.05, { origin: [520, 1080] });
  }

  // ============================================================ 17 COMMENT — poll + follow pill + disclaimer
  {
    const c = card(16, { ground: 'brown', label: 'Tell us', spot: [W * 0.5, H * 0.52] });
    const g = c.layer;
    PK.head(c, 'Comment', 'karo', c.t0 + 0.05, w('comment', 'कमेंट'));
    const pl = PK.poll(g, 'Kya aap BE FAST jaante the?', 'Haan', 'Na', 540, 950, { t: w('comment', 'क्या') - 0.15, rot: -2 });
    const pill = PK.pill(g, 'FOLLOW + SHARE', 540, 1380, { t: w('comment', 'फ़ास्ट') + 0.1, size: 50 });
    PK.pulse(pill, w('comment', 'फ़ास्ट') + 0.6, END, { amp: 0.06, hz: 1.1 });
    pl.tick(0, w('comment', 'हाँ') + 0.05, '✓');
    pl.tick(1, w('comment', 'ना') + 0.1, '?');
    const disc = X.svg('g', {}, g);
    ['SIRF JAAGRUKTA KE LIYE · YE MEDICAL SALAH NAHI', 'EMERGENCY: 112 · AMBULANCE: 108'].forEach((s, k) =>
      X.svg('text', { x: 540, y: 1540 + k * 36, 'text-anchor': 'middle', 'font-family': PK.F.mono, 'font-weight': 500, 'font-size': 21, 'letter-spacing': 3, fill: '#a39a8a', text: s }, disc));
    PK.show(disc, w('comment', 'जानते'), 0.2);
    PK.fadeOut(END - 0.65, 0.6);
  }

  X.end(END);
});
