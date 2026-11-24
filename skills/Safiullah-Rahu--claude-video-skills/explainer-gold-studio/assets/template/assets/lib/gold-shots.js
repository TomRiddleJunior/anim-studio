/* Gold-studio starter film (about 7 s): two flag spheres drop onto drums, the gold glow comes up, one coin stack
 * rises with a gold label, then a gold serif title card. Copy a block from the full sample
 * (samples/gold-studio/assets/lib/gold-shots.js: hero + people, ring gauge, safe pour, chart, dotted map, coin grid,
 * red title, plant, ending) for every further beat.
 *   window.GOLD_FILM(K, V) -> { shots: [{ t0, set, fn(t) -> state, mb(t) -> sub-samples, shutter }], reset: { set: fn } }
 *   V.w(line, word, k) = start of the k-th word of a line that starts with `word`; V.line(id) = { start, end, words }
 */
window.GOLD_FILM = function (K, V) {
  "use strict";
  const T = K.T;
  const w = V.w, L = V.line;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const win = (t, a, b) => clamp((t - a) / (b - a));
  const io = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : -(Math.cos(Math.PI * u) - 1) / 2);
  const o3 = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const big = (text, size, color, extra) => ({ lines: [Object.assign({ text, size, color, weight: 800, font: K.FONT_BOLD }, extra || {})] });
  const rev = (l, t, a, b) => { if (t < a) return l.show(0, 0); const k = win(t, a, a + 0.16); const out = b == null ? 1 : 1 - win(t, b, b + 0.12); l.show(k * out, out > 0 ? 1 : 0); };

  // two drums + flag spheres + coin stacks + the gold glow + a gold number label
  const open = K.set("open");
  K.barrel({ x: -1.0, text: "ALASKA", parent: open });
  K.barrel({ x: 1.0, text: "ALBERTA", parent: open });
  const spA = K.flagSphere({ flag: "alaska", parent: open });
  const spB = K.flagSphere({ flag: "alberta", parent: open });
  const stA = K.coinStack({ x: -1.0, y: 1.3, r: 0.44, max: 56, parent: open, seed: 3 });
  const glow = K.glow({ color: "#c98a3a", size: 7.5, x: -0.5, y: 4.4, z: -6, parent: open, soft: 1.7 });
  const labN = K.label(big("$XX", 220, "gold", { depth: 0.09 }), { parent: open, gain: 1.15 });
  const labS = K.label(big("BILLION", 120, "#f4efe9"), { parent: open, gain: 1.05 });
  // title card
  const title = K.set("title", { env: "dim", floor: false });
  const tW1 = K.label({ lines: [{ text: "Here's", size: 150, color: "#f6f1ec", weight: 600, font: K.FONT_SANS }] }, { parent: title, gain: 1.15 });
  const tW2 = K.label({ lines: [{ text: "how.", size: 300, color: "gold", weight: 400, italic: true, font: K.FONT_SERIF, depth: 0, bold: 0.022 }] }, { parent: title, gain: 1.6, flash: 2.2 });
  const tGlow = K.glow({ color: "#b07a2c", size: 4.2, x: 0, y: -0.5, z: -3, parent: title, soft: 1.5, noRefl: true });

  function drop(sp, x0, restY, tLand, t, dx) {
    const tf = 0.26;
    if (t < tLand - tf) { sp.visible = false; return; }
    sp.visible = true;
    let y, xo = 0;
    if (t < tLand) { const u = (t - (tLand - tf)) / tf; y = restY + 6.5 * (1 - u * u); xo = dx * (1 - u); }
    else { const u = clamp((t - tLand) / 0.22); y = restY + Math.sin(Math.PI * u) * 0.12 * (1 - u); }
    sp.position.set(x0 + xo, y, 0);
  }
  const reset = {
    open() { stA.set(0); glow.setK(0); labN.show(0, 0); labS.show(0, 0); spA.position.set(-1, 1.86, 0); spB.position.set(1, 1.86, 0); },
    title() { tW1.show(0, 0); tW2.show(0, 0); tGlow.setK(0); },
  };
  const LIGHT = { keyPos: [-3.5, 9, 7], keyTarget: [0, 1.2, 0], keyI: 70, rimI: 0.8, warmPos: [-0.6, 4.2, -2.2] };
  const tPull = w("l02", "one") - 0.05, tS0 = w("l02", "saved") - 0.1, tS1 = V.line("l02").end + 0.5;
  const S = [];
  S.push({ t0: 0, set: "open", mb: (t) => (t < 0.95 || (t > tPull && t < tPull + 0.32) ? 6 : 1), shutter: 1 / 40,
    fn(t) {
      drop(spA, -1, 1.86, 0.2, t, -0.25);
      drop(spB, 1, 1.86, 0.7, t, 0.25);
      const g = io(win(t, w("l01", "same") - 0.2, w("l01", "same") + 0.6));
      glow.setK(0.55 * g);
      const h = stA.set(46 * o3(win(t, tS0, tS1)));
      if (t > 0.2) spA.position.y = 1.3 + h + 0.56;
      const pull = io(win(t, tPull, tPull + 0.32));
      const cam = mix3(mix3([0, 2.15, 11.6], [0, 1.95, 9.6], io(win(t, 0, tPull))), [0.1, 4.6, 20.5], pull);
      const look = mix3([0, 1.45, 0], [0.15, 3.55, 0], pull);
      rev(labN, t, tS0); rev(labS, t, tS0 + 0.3);
      return Object.assign({ set: "open", cam, look, fov: 34, focus: lerp(11.6, 20, pull), aperture: 0.9, warmI: 7 * g, bloom: 0.5,
        after() { const hw = K.atScreen(labN.mesh, 0.73, 0.255, 12.5); labN.fit(0.072 * hw); K.atScreen(labS.mesh, 0.73, 0.345, 12.5); labS.fit(0.021 * hw); } }, LIGHT);
    } });
  const tT = V.line("l03").start - 0.12;
  S.push({ t0: tT, set: "title",
    fn(t) {
      rev(tW1, t, w("l03", "here") - 0.06); rev(tW2, t, w("l03", "how") - 0.04);
      tGlow.setK(0.6 * io(win(t, w("l03", "how") - 0.05, w("l03", "how") + 0.35)));
      return { set: "title", cam: [0, 0, lerp(10, 9.4, win(t, tT, V.dur))], look: [0, 0, 0], fov: 34, aperture: 0, bloom: 0.75, keyI: 0, rimI: 0, fillI: 0,
        after() { const hw = K.atScreen(tW1.mesh, 0.5, 0.375, 10); tW1.fit(0.028 * hw); K.atScreen(tW2.mesh, 0.5, 0.53, 10); tW2.fit(0.085 * hw); K.atScreen(tGlow, 0.5, 0.53, 10.5); } };
    } });
  return { shots: S, reset };
};
