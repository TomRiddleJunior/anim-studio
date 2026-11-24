/* Template film for explainer-rules-horror-3d: 4 lines, 6 shots on the Level −4 garage set.
 * Copy this pattern: every cut and event is keyed to a narration word (V.w = onset, V.we = end); reset(t) poses the
 * world from t only (frames render out of order); each shot's fn poses the cast, places the focal light (G.key) and
 * returns render state; overlay draws the numbered choice labels. The full 34-shot film is in ../sample/.
 */
window.FILM_CREATE = { look: { bloom: 0.13, streak: 0.06, sat: 0.9, vig: 0.42, grain: 0.04, ca: 0.0016, contrast: 1.05 } };
window.FILM = function (K, V) {
  const ss = K.sstep;
  const G = RH3D.garage(K, {});
  const hero = RH3D.mannequin(K, { name: "hero" });
  const w = (id, word, k) => V.w(id, word, k), we = (id, word, k) => V.we(id, word, k);
  const cut = (id, word, k) => V.w(id, word, k) - 0.06;
  G.bakeEnvs();
  const W = G.white, RED = G.red;
  const HERO = [0.15, 0, -12.4];

  // rows switch white -> red, far end first, toward the hero
  const SW = { 12: w("l02", "red"), 11: w("l03", "row"), 10: w("l03", "next", 1) };
  const FLK = [1, 0.12, 0.85, 0, 0.6, 0.05, 0, 0.35, 0];
  function rowAt(i, t) {
    const T0 = SW[i];
    if (T0 == null || t < T0) return [1, 0];
    const d = t - T0;
    return [d < 0.36 ? FLK[Math.min(FLK.length - 1, Math.floor(d / 0.04))] : 0, ss(0.08, 0.34, d)];
  }
  function reset(t) {
    for (let i = 0; i < 13; i++) { const r = rowAt(i, t); G.setRow(i, r[0], r[1]); }
    G.shutter(0); G.exit(0); G.trail(0); G.card(false); G.beacon(0);
    G.clock.set(t < w("l02", "midnight") ? "23:59" : "00:00");
    hero.root.visible = true;
    G.keyAt(G.key2, 0, 2.6, W, 0);
  }
  const FOGW = { dens: 0.021, hFall: 0.22, noise: 0.55, scale: 0.3, g: 0.45, maxDist: 46, lightGain: 1 };
  const FOGR = Object.assign({}, FOGW, { dens: 0.02, lightGain: 0.34 });
  const heroFace = (o) => Object.assign({ breathe: o.t }, o);

  const S = [];
  const add = (o) => S.push(o);
  // S1 hook: one-point wide, low, behind the lone figure
  add({ t0: 0, cam: [[0.55, 0.78, -4.6], [0.5, 0.8, -6.0]], look: [[0.05, 1.15, -46], [0.05, 1.18, -46]], fov: 50, focus: [0.15, 1, -12.4], aperture: 7, hand: 0.8,
    fn: (t) => { hero.set(heroFace({ t, pos: HERO, ry: 180, pose: "stand", look: [Math.sin(t * 1.3) * 22, -4], face: "neutral" }));
      G.keyAt(G.key, 0.1, -11.8, W, 12); return { fog: FOGW, env: "white", envI: 1.0 }; } });
  // S2 the clock: 23:59 -> 00:00 on "midnight"
  add({ t0: cut("l02", "at"), cam: [[1.55, 1.98, 1.66], [1.8, 2.02, 1.6]], look: [[4.22, 2.12, 1.55], [4.22, 2.12, 1.55]], fov: 30, focus: [4.22, 2.12, 1.55], aperture: 9, hand: 0.5,
    fn: (t) => { hero.root.visible = false; G.keyAt(G.key, 3.4, 1.6, W, 3); return { fog: FOGW, env: "white", envI: 1.0, bloom: 0.2 }; } });
  // S3 his POV down the aisle: the far row turns red
  add({ t0: cut("l02", "the"), cam: [[0.12, 1.66, -12.7], [0.1, 1.64, -13.4]], look: [[0, 1.45, -46], [0, 1.45, -46]], fov: 26, focus: [0, 1.4, -26], aperture: 5, hand: 1.4,
    fn: (t) => { hero.root.visible = false; G.keyAt(G.key, 0, -12.4, W, 0); return { fog: FOGR, env: "red", envI: 0.9, sat: 0.84 }; } });
  // S4 frontal: white face, the red closing in behind
  add({ t0: cut("l03", "then"), cam: [[0.36, 1.53, -9.85], [0.31, 1.53, -10.45]], look: [[0.17, 1.52, -12.4], [0.17, 1.53, -12.4]], fov: 34, focus: [0.15, 1.6, -12.3], aperture: 14, hand: 0.9,
    fn: (t) => { const k = ss(w("l03", "next", 1) - 0.3, we("l03", "next", 1), t);
      hero.set(heroFace({ t, pos: HERO, ry: 0, pose: "stand", pose2: "freeze", mix: 0.4 + 0.6 * k, face: "worried", face2: "scared", faceMix: k }));
      G.keyAt(G.key, 0.1, -9.8, W, 9, 0.15, -12.4); return { fog: FOGR, env: "red", envI: 0.9, sat: 0.84 }; } });
  // S5 the choice frame from behind him: 1 RUN toward the ramp, 2 STAND STILL at his feet
  add({ t0: cut("l04", "you"), cam: [[0.45, 2.15, -16.9], [0.42, 2.1, -16.45]], look: [[0.1, 0.92, 3.0], [0.1, 0.95, 3.0]], fov: 40, focus: [0.25, 1.0, -12.6], aperture: 3, hand: 0.6,
    fn: (t) => { hero.set(heroFace({ t, pos: HERO, ry: 0, pose: "freeze", face: "scared" }));
      G.keyAt(G.key, 0.2, -12.4, RED, 7, 0.2, -12.6); return { fog: FOGR, env: "mixed", envI: 0.95, streak: 0.1 }; } });
  // S6 final ECU, labels top, hold
  add({ t0: cut("l04", "so"), cam: [[0.2, 1.71, -11.42], [0.19, 1.71, -11.62]], look: [[0.17, 1.71, -12.36], [0.17, 1.71, -12.36]], fov: 31, focus: [0.16, 1.72, -12.28], aperture: 22, hand: 0.6,
    fn: (t) => { hero.set(heroFace({ t, pos: HERO, ry: 0, pose: "freeze", face: "shocked", breathRate: 0.8, breathAmt: 1.2 }));
      G.keyAt(G.key, 0.2, -10.6, "#ffe0d8", 8, 0.17, -12.36); return { fog: FOGR, env: "mixed", envI: 0.9 }; } });

  // ---------------------------------------------------------------- choice labels (2-D overlay)
  const T_CH = cut("l04", "you"), T_TOP = cut("l04", "so");
  const BLUE = "#2f7cf6", REDL = "#ff3b30";
  function pill(g, x, y, n, text, col, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.font = '800 38px "MontserratRH", "Montserrat", Arial, sans-serif';
    const tw = g.measureText(text).width, h = 66, wd = tw + 102;
    g.shadowColor = "rgba(0,0,0,0.5)"; g.shadowBlur = 16; g.shadowOffsetY = 4;
    g.fillStyle = "rgba(12,12,14,0.9)"; g.beginPath(); g.roundRect(-wd / 2, -h / 2, wd, h, 16); g.fill();
    g.shadowColor = "transparent"; g.lineWidth = 3.5; g.strokeStyle = "#ffffff"; g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(-wd / 2 + 34, 0, 18, 0, 7); g.fill();
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = '800 24px "MontserratRH", Arial, sans-serif'; g.fillText(String(n), -wd / 2 + 34, 1);
    g.font = '800 38px "MontserratRH", "Montserrat", Arial, sans-serif'; g.textAlign = "left"; g.fillText(text, -wd / 2 + 68, 2);
    g.restore();
  }
  function leader(g, x0, y0, x1, y1, col) {
    g.save(); g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 6;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x1, y1, 9, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(x1, y1, 5, 0, 7); g.fill(); g.restore();
  }
  function overlay(g, t) {
    if (t < T_CH) return;
    const pop = (t0) => { const d = t - t0; if (d < 0) return 0; return d < 0.18 ? 1 + 0.18 * Math.sin((d / 0.18) * Math.PI) * (1 - d / 0.18) - (1 - d / 0.18) * 0.6 : 1; };
    if (t < T_TOP) {
      const a = K.project([0, 2.55, 17.4]), b = K.project([0.12, 0.02, -12.15]);
      const sA = pop(T_CH + 0.15), sB = pop(T_CH + 0.45);
      if (sA > 0) { const lx = a.x - 170, ly = a.y - 250; leader(g, lx + 40, ly + 30, a.x, a.y, BLUE); pill(g, lx, ly, 1, "RUN", BLUE, sA); }
      if (sB > 0) { const lx = Math.min(1080 - 240, b.x + 230), ly = Math.min(b.y - 420, 1080); leader(g, lx - 30, ly + 30, b.x, b.y, REDL); pill(g, lx, ly, 2, "STAND STILL", REDL, sB); }
    } else {
      const s = pop(T_TOP) || 1;
      pill(g, 205, 214, 1, "RUN", BLUE, Math.max(0.01, s));
      pill(g, 1080 - 290, 214, 2, "STAND STILL", REDL, Math.max(0.01, s));
    }
  }
  return { shots: S, reset, overlay, G, hero };
};
