/* explainer-psa-reel template — a 5-card, ~18 s vertical awareness reel. Copy this folder, rewrite script.json
 * (one line per card), then edit the card blocks below. Run: ENGINE/make.sh <project> --draft --workers 3 */
X.boot(async (X) => {
  await X.loadVO();
  PK.init(X);
  const C = PK.C, W = X.W, H = X.H;
  const L = (id) => X.line(id);
  const w = (id, word, nth = 0) => PK.w(id, word, nth);           // VO word time (Devanagari-safe)
  const ids = ['hook', 'galat', 'minute', 'call', 'poll'];        // one VO line per card
  const END = X.vo.duration || 18;
  const cutAt = ids.map((id, i) => (i === 0 ? 0 : L(id).start - 0.14));   // hard cut just before each line
  const card = (i, o) => PK.card(i + 1, cutAt[i], i + 1 < ids.length ? cutAt[i + 1] : END, o);
  X.grain(0.05, 12, 'overlay');

  { // 1 HOOK — cream card, cut-out person, stamp, handwritten question
    const c = card(0, { ground: 'cream', label: 'Emergency' });
    PK.head(c, 'Baat karte karte...', 'achanak atke', 0.05, w('hook', 'अचानक'));
    const p = PK.person(c.layer, 540, 1630, { scale: 1.4, f: true, skin: '#b8804f', hair: 'bun', hairC: '#dcd7cd', top: 'saree', topC: '#8b2f3a', border: '#d6b25e', glasses: true, bindi: true });
    PK.bubble(c.layer, '"Beta, wo... w-wo..."', 700, 500, { t: w('hook', 'बोलते'), size: 46 });
    p.droop(w('hook', 'अटक'), 0.4);
    PK.stamp(c.layer, 'Boli atki', 830, 760, { t: w('hook', 'अटक') + 0.3 });
    PK.hand(c.layer, 'aap kya karoge?', 100, 1800, { t: w('hook', 'आप'), size: 90 });
    PK.push(c, 1, 1.035);
  }
  { // 2 GALAT — the wrong reaction, red X
    const c = card(1, { ground: 'cream', label: 'Galat' });
    PK.head(c, 'Zyaada log', 'ye kehte hain', c.t0 + 0.06, w('galat', 'कहते'));
    const al = PK.place(c.layer, 540, 1050); PK.alarm(al, 0, 0, { s: 1.3 });
    PK.pop(al, w('galat', 'सुबह') - 0.1);
    PK.tape(c.layer, 'Subah tak', 540, 1300, { t: w('galat', 'तक') });
    PK.x(c.layer, 540, 1050, 380, w('galat', 'जाएंगी'));
  }
  { // 3 STAKES — dark specimen board, engraving + flip counter
    const c = card(2, { ground: 'grid', label: 'Time is brain' });
    PK.head(c, 'Stroke mein', 'har minute', c.t0 + 0.05, w('minute', 'हर'));
    const br = PK.brain(c.layer, 520, 950, { s: 1.15 });
    br.beat(c.t0, c.t1, 1.1, 0.5);
    br.spread(c.t0 + 0.3, c.t1, 1.0);
    const f = PK.flip(c.layer, '0 MIN', 520, 1400, { t: c.t0 + 0.3 });
    for (let m = 1; m <= 3; m++) f.set(c.t0 + 0.3 + m * (c.t1 - c.t0 - 0.5) / 3, `${m} MIN`);
  }
  { // 4 ACTION — mint card with the red floor band, phone dials 112
    const c = card(3, { ground: 'mint', label: 'Step 1' });
    PK.head(c, 'Turant', '112 call', c.t0 + 0.05, w('call', 'बारह'));
    const ph = PK.phone(c.layer, 540, 1050, { t: c.t0 + 0.1 });
    ph.type([w('call', 'एक'), w('call', 'सौ'), w('call', 'बारह')], '112');
    ph.ring(w('call', 'कॉल'));
  }
  { // 5 POLL — brown board, two-option poll, follow pill, disclaimer, fade
    const c = card(4, { ground: 'brown', label: 'Tell us' });
    PK.head(c, 'Comment', 'karo', c.t0 + 0.05, w('poll', 'कमेंट'));
    const pl = PK.poll(c.layer, 'Kya aap ye jaante the?', 'Haan', 'Na', 540, 950, { t: w('poll', 'क्या') - 0.1 });
    const pill = PK.pill(c.layer, 'FOLLOW + SHARE', 540, 1380, { t: w('poll', 'जानते') });
    PK.pulse(pill, w('poll', 'जानते') + 0.5, END);
    pl.tick(0, w('poll', 'हाँ'), '✓'); pl.tick(1, w('poll', 'ना'), '?');
    X.svg('text', { x: 540, y: 1540, 'text-anchor': 'middle', 'font-family': PK.F.mono, 'font-size': 21, 'letter-spacing': 3, fill: '#a39a8a', text: 'SIRF JAAGRUKTA KE LIYE · EMERGENCY: 112' }, c.layer);
    PK.fadeOut(END - 0.65, 0.6);
  }
  X.end(END);
});
