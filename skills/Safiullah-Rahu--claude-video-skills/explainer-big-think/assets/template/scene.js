/* Big Think-style starter: medium + lower-third → numbered paper card → CGI b-roll → wide + kinetic words → punch-in.
 * Copy this folder, edit script.json, then: ENGINE/make.sh <project> --fps 24 --workers 3 */
X.boot(async (X) => {
  await X.loadVO();
  const F = BT.F, W = (id, w, n) => X.word(id, w, n), line = (id) => X.line(id);
  const L = BT.layers();
  const END = X.vo.duration || 12;

  // edit decision list: every cut on a word
  const T = {};
  T.card = line('hook').end + 0.15;               // roll the card down in the gap
  T.cardOut = line('point').start + 0.35;          // voice starts under the card (J-cut), card rolls up
  T.cgi = T.card + 0.45;                           // revealed under the card
  T.wide = W('point', 'fifth') - 0.2;              // cut to the wide just before the stressed word
  T.punch = line('close').start - 0.05;

  const st = BT.studio(L.world);
  BT.shot(st, 0, T.cgi, 'med');
  BT.shot(st, T.wide, T.punch, 'wide');
  BT.shot(st, T.punch, END, 'punch');
  BT.expert(st.subject, {
    visible: st.visibleAt,
    gestures: [{ t: W('hook', 'two'), d: 0.7, arm: 'R' }, { t: W('close', 'price'), d: 0.8, arm: 'B' }],
    nods: [W('hook', 'weight'), W('close', 'thinking')],
  });
  BT.lowerThird(L.over, 'Dana Ferreira, PhD', 'Neuroscientist (fictional)', 0.7, T.card - 0.2);

  BT.paperCard(L.cards, T.card, { num: 1, title: 'The expensive organ', tOut: T.cardOut });
  BT.cgi(L.world, T.cgi, T.wide, { mode: 'field', seed: 7, push: 0.14 });
  BT.glitch(L.world, T.wide);

  X.scene('kin', T.wide, T.punch, (g) => BT.kinetic(g, [
    { text: 'A fifth', t: W('point', 'fifth') },
    { text: 'of your', t: W('point', 'of') },
    { text: 'energy', t: W('point', 'energy') },
  ], { x: 312, y: 392, maxW: 372 }), L.over);

  BT.bug(L.top, 'O', 'Q', { t: 0.5 });
  X.grain(0.045, 12);
  X.end(END);
});
