/* rewind-hud-config.js — the HUD timeline of "Rewind" (read by ps1-hud.js). window.HUD_CONFIG(V) -> config:
   title [line1, big word, line3], flip time for the big word's red -> blue; rewinds / plays (label times);
   takes [t0, t1, from, to, label, holdUntil]; ages [t, value]; lived [t0, t1, from, to]; hudOn; titleOff; end; endText. */
window.HUD_CONFIG = function (V) {
    const S = (id) => V.L(id).start, w = (id, word) => V.w(id, word);
    const rewinds = [S("h3") - 0.05, S("a2") - 0.05, S("j2") - 0.05, w("i1", "twice") - 0.05, S("b2") - 0.05, S("g3") - 0.05, S("l3") - 0.05, S("t2") - 0.05, S("t4") - 0.05];
    const plays = [S("h4") - 0.05, S("a3") - 0.1, w("j2", "New") - 0.1, w("i1", "twice") + 0.5, S("b3") - 0.1, S("g4") - 0.12, S("l5") - 0.1, S("t3") - 0.1, S("t6") - 0.1];
    // TAKE counter segments: [t0, t1, from, to, label, holdUntil]
    const takes = [
      [S("a2"), S("a3"), 1, 2, "TAKE", S("a3")], [S("a3"), w("a4", "times"), 2, 60, "TAKE", S("j1") - 0.1],
      [S("j2"), S("j3"), 1, 9, "TAKE", S("i1") - 0.1],
      [w("i1", "twice"), w("i1", "twice") + 0.4, 1, 2, "TAKE", S("b1") - 0.2],
      [S("b2"), S("b3") - 0.1, 1, 31, "TAKE", S("m1") - 0.1],
      [S("g3"), S("g4"), 1, 14, "TAKE", S("d1") - 0.12],
      [S("d1"), V.L("d1").end, 1, 7, "TAKE", S("d2") - 0.1],
      [w("w1", "forty") - 0.1, w("w1", "versions") + 0.2, 1, 40, "TAKE", S("c1") - 0.1],
      [S("l3"), S("l4"), 1, 3, "LOOP", S("l4")], [S("l4"), w("l4", "hundred") + 0.6, 3, 9999, "LOOP", S("t1") - 0.1],
      [S("t2"), S("t5"), 1, 3, "TAKE", S("t5")], [S("t5"), w("t5", "same"), 3, 200, "TAKE", S("t7") - 0.1],
      [S("t7") - 0.1, S("t7"), 14, 14, "TAKE", S("t8") - 0.1],
    ];
    const ages = [[0, 24], [S("g1") - 0.1, 25], [S("d1") - 0.12, 26], [S("w1") - 0.1, 27], [S("c1") - 0.1, 30], [S("l1") - 0.1, 31]];
    // LIVED: [t0, t1, from, to]
    const lived = [[0, 0.01, 24, 24], [S("g1") - 0.1, S("g1"), 24, 25], [S("d1") - 0.12, S("d1"), 25, 27], [S("w1") - 0.1, S("w1"), 27, 29],
      [S("c1") - 0.1, S("c1"), 29, 33], [S("c2"), w("c3", "forty"), 33, 41], [S("l1") - 0.1, S("l1"), 41, 43],
      [w("l4", "year"), w("l4", "year") + 0.4, 43, 44], [w("l4", "hundred") - 0.1, w("l4", "years") + 0.4, 44, 144]];
    return { rewinds, plays, takes, ages, lived, hudOn: S("a1") - 0.12, end: V.endCard, titleOff: S("h2") + 0.25,
      title: ["WHAT IF YOU COULD", "REWIND", "10 SECONDS?"], flip: 1.0, endText: ["Would you", "press REWIND?"], skipCaps: ["h1"], age0: 24 };
}
