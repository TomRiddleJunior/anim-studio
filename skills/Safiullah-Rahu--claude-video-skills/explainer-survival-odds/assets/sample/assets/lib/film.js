/* "Survival Odds · The Rig · Day 1" — shot list for the survival-scenario kit v2.3 + the world module survival-rig.js.
 * Shot boundaries come from tools/build.py (FILM_VO.T, derived from voice-over words); every prop state is a pure function
 * of t (the world module's per-frame hook reads it from the state); every shot sets its camera move, light state and
 * Mira's pose. The odds ring, tags, panels and captions are the HUD (compositions/hud.html, built by tools/build.py). */
window.FILM_CREATE = Object.assign({}, window.SURVIVAL.rig.CREATE);
window.FILM_BUILD = function (K) {
  const Rg = window.SURVIVAL.rig(K);
  const hz = K.hazel(window.SURVIVAL.rig.MIRA);
  const mira = window.SURVIVAL.rig.dressMira(K, hz);
  return { Rg, hz, mira };
};
window.FILM_DEBUG_EXPO = window.FILM_DEBUG_EXPO || 1;
window.FILM = function (K, V, X) {
  const { Rg, hz } = X;
  const T = window.FILM_VO.T;
  const P = Rg.P, DU = P.DU, DM = P.DM, G = P.GEN;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => x * x * (3 - 2 * x);
  const ramp = (t, a, b) => ss(clamp((t - a) / (b - a), 0, 1));
  const L = (id) => V.L(id), w = (id, word, k) => V.w(id, word, k);
  const XD = window.FILM_DEBUG_EXPO;
  const V3 = K.T.Vector3;
  const headAt = () => { hz.root.updateMatrixWorld(true); const h = hz.headWorld(new V3()); return [h.x, h.y, h.z]; };

  // ---------------------------------------------------------------- story times
  const noT = w("l09", "no"), stayT = w("l11", "So"), sinkT0 = T.L2;
  const ladT0 = w("l15", "pulled") - 0.1, ladT1 = w("l15", "ladder") + 0.3;
  const chT0 = w("l15", "chained") - 0.05, chT1 = w("l15", "heli") - 0.05;
  const opT = w("l17", "On"), forgotT = w("l18", "forgot");
  // the helicopter: in J it approaches from the coast; in K2 it turns back and its lights shrink toward the coast
  const heli = (t) => {
    if (t < T.K) { const u = ramp(t, T.J - 0.4, T.K); return { heliK: 1, heliP: [lerp(-60, -26, u), lerp(120, 80, u), lerp(-760, -300, u)], heliYaw: 0, heliBank: 0, heliHalo: 18 }; }
    const a = ramp(t, T.K2 + 0.2, T.K2 + 1.9), r = Math.max(0, t - (T.K2 + 1.5));
    const yaw = lerp(0, 180, a), bank = Math.sin(a * Math.PI) * 24;
    return { heliK: 1, heliP: [-26 - 30 * a - r * 9, 80 + 14 * a + r * 9, -300 + 40 * Math.sin(a * Math.PI) - r * r * 34 - r * 60], heliYaw: yaw, heliBank: bank, heliHalo: 18 };
  };

  // ---------------------------------------------------------------- light states
  const EXT = { moonI: 1.4, hemiI: 0.35, envI: 0.45, exposure: 1.0 * XD, aperture: 0.8, fogD: 0.00022, starK: 0.15, moonK: 0, flareI: 1, floodI: 1, crI: 0.8, lampI: 1, monI: 1, scrK: 1,
    rainK: 0.7, cloudK: 1, heliDeckK: 1, coastK: 1, glowK: 0.3, glowDir: [0, 0, -1], glowCol: "#ff8a4a", winGlow: 1, warpK: 1, rays: 0, shoreEyesK: 0 };
  const INT = Object.assign({}, EXT, { moonI: 0.35, hemiI: 0.12, envI: 0.3, flareI: 0.12, floodI: 0.15, crI: 1, rainK: 0, winGlow: 0, warpK: 0, aperture: 3 });
  const AERIAL = Object.assign({}, EXT, { exposure: 0.85 * XD, aperture: 0, vig: 0.62, rainK: 0.35, shoreEyesK: 1, shoreEyeS: 4, shoreEyeSep: 1.6, warpK: 0, starK: 0.05, townS: 2.6, cloudGlow: 0.45, glowK: 0.42 });
  const tintAt = (t, col, a, t0, t1, fin, fout) => { const k = ramp(t, t0, t0 + (fin || 0.3)) * (1 - ramp(t, t1, t1 + (fout || 0.4))); return [col[0], col[1], col[2], a * k]; };
  const GREEN = [0.25, 0.95, 0.5], RED = [1.0, 0.18, 0.12], AMBER = [1.0, 0.55, 0.2];
  const WORLD = (t) => Object.assign({ ladder: t < ladT0 ? 0 : ramp(t, ladT0, ladT1), chain: t < chT0 ? 0 : ramp(t, chT0, chT1), heliK: 0, gull: t < T.F1 ? 1 : 0, micro: t >= T.F3 - 0.2 && t < T.G ? 1 : 0,
    radioK: t >= w("l07", "crackled") - 0.15 ? 1 : 0, txK: (t > w("l07", "crackled") - 0.1 && t < T.J && Math.sin(t * 11) > 0.3) ? 1 : 0, heliBlink: t >= T.I2 + 0.2 && t < T.K ? 1 : 0 },
    t > T.J - 0.5 && t < T.L1 ? heli(t) : {});

  // Mira's marks
  const SEAT = P.SEAT, STAIRF = [3.1, DU, 1.15], RAIL = [10.9, DU, -1.4], WINCH = [5.6, DM, 10.95], GATEP = [3.1, DU, 1.0];
  const sitAt = (t, e) => { hz.setHat(false); hz.set(Object.assign({ pos: SEAT, ry: 180, pose: "desk", head: [0, 4], expr: "calm", t }, e || {})); };

  const shots = [
    // A1 — hook: the rig in the storm at night, the flare on its boom, clouds lit orange from below, deck floods; drifting in
    { key: "A1", t0: T.A1, cam: [[-72, 47, 37], [-61, 42, 31]], look: [[11, 26.5, -10], [11, 26.5, -10]], fov: 46,
      st: Object.assign({}, EXT, { aperture: 0.5, focus: 80, flareShadow: 1 }),
      fn(t) { sitAt(t); return {}; } },
    // A2 — closer drone along the helideck toward the flare (green wash on "lucky")
    { key: "A2", t0: T.A2, cam: [[-40, 30, 30], [-33, 32, 36]], look: [[6, 31, -8], [8, 32, -8]], fov: 50,
      st: Object.assign({}, EXT, { aperture: 0.8, focus: 40, flareShadow: 1 }),
      fn(t) { sitAt(t); return { tint: tintAt(t, GREEN, 0.15, w("l01", "lucky") - 0.1, 99) }; } },
    // B — black beat: the rig small in the dark sea, the coast's low orange glow on the horizon, red eyes along the shore
    { key: "B", t0: T.B, cam: [[0, 62, 305], [0, 57, 282]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL),
      fn(t) { sitAt(t); return { shoreEyesK: lerp(0.2, 1, ramp(t, T.B + 0.3, T.C - 1.2)), black: 0.24 + 0.76 * (1 - ramp(t, T.B, T.B + 0.28)) }; } },
    // C — the control room: Mira at the console (3/4 from the window side); the wall screen behind her (plant 1, background)
    { key: "C", t0: T.C, cam: [[-8.85, DU + 1.6, -11.62], [-8.75, DU + 1.58, -11.56]], look: [[-7.5, DU + 1.36, -10.05], [-7.5, DU + 1.36, -10.05]], fov: 40,
      st: Object.assign({}, INT, { aperture: 2.6 }),
      fn(t, u, e, st) { sitAt(t, { head: [14, 3], look: [6, -2] }); return { focus: headAt() }; } },
    // D — pull back out through the window: up and away until the height and the sea read (140 KM)
    { key: "D", t0: T.D, cam: [[-7.9, DU + 1.42, -11.75], [-9, DU + 13, -96]], look: [[-7.5, DU + 1.3, -10.05], [-4, 9, -4]], fov: 40,
      ease: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
      st: Object.assign({}, INT),
      fn(t, u, e, st) { sitAt(t, { head: [0, 6], look: [0, -6] }); const out = ramp(e, 0.04, 0.12);
        return { focus: st.look, aperture: lerp(2.6, 0.6, out), moonI: lerp(0.35, 1.4, out), hemiI: lerp(0.12, 0.35, out), flareI: lerp(0.12, 1, out), floodI: lerp(0.15, 1, out), rainK: 0.7 * out, winGlow: out, warpK: out }; } },
    // E — the control room wide: two empty chairs; the wall screen (plant 1) in the background; "nobody lives here"
    { key: "E", t0: T.E, cam: [[-3.9, DU + 1.74, -10.9], [-4.05, DU + 1.72, -10.75]], look: [[-10.0, DU + 1.5, -9.9], [-10.0, DU + 1.5, -9.9]], fov: 46,
      st: Object.assign({}, INT, { aperture: 1.1, focus: [-7.5, DU + 1.3, -10.05] }),
      fn(t) { sitAt(t, { head: [-6, 6], look: [0, -4] }); return {}; } },
    // E2 — outside: the gull on the rail, watching her through the window (dry gag: it turns to the lens on "seagulls")
    { key: "E2", t0: T.E2, cam: [[-8.0, DU + 1.22, -15.2], [-7.98, DU + 1.22, -15.05]], look: [[-7.55, DU + 1.27, -10.05], [-7.55, DU + 1.27, -10.05]], fov: 34,
      st: Object.assign({}, EXT, { aperture: 1.0, rainK: 0.45, winGlow: 0, warpK: 0, floodI: 0.6, crI: 1, fill: { p: [-7.6, DU + 1.75, -13.3], c: "#e6eeff", i: 0.85 } }),
      fn(t) { sitAt(t, { head: [0, 8], look: [0, -8] }); const turn = ramp(t, w("l04", "seagulls") + 0.25, w("l04", "seagulls") + 0.6);
        return { gullRy: -62, gullHead: lerp(0, -112, turn), focus: [-7.45, DU + 1.15, -12.3] }; } },
    // F1 — the pressure gauges (check the pressures)
    { key: "F1", t0: T.F1, cam: [[-4.58, DU + 1.36, -10.42], [-4.53, DU + 1.34, -10.5]], look: [[-4.05, DU + 1.03, -11.31], [-4.05, DU + 1.03, -11.31]], fov: 42,
      st: Object.assign({}, INT, { aperture: 3.5, focus: [-4.05, DU + 1.03, -11.31] }),
      fn(t) { sitAt(t); return {}; } },
    // F2 — the weather log: her pen writing
    { key: "F2", t0: T.F2, cam: [[-6.9, DU + 1.46, -10.22], [-6.93, DU + 1.44, -10.28]], look: [[-7.22, DU + 0.82, -10.86], [-7.22, DU + 0.82, -10.86]], fov: 42,
      st: Object.assign({}, INT, { aperture: 3.5, focus: [-7.22, DU + 0.82, -10.86] }),
      fn(t) { sitAt(t, { pose: "write", tool: "pen", head: [-6, 26], look: [0, -14] }); return {}; } },
    // F3 — dinner for one, turning in the microwave
    { key: "F3", t0: T.F3, cam: [[-5.6, DU + 1.5, -6.5], [-5.52, DU + 1.48, -6.54]], look: [[-3.95, DU + 1.0, -6.62], [-3.95, DU + 1.0, -6.62]], fov: 40,
      st: Object.assign({}, INT, { aperture: 2.5, focus: [-3.95, DU + 1.05, -6.62], crI: 0.5, exposure: 0.82 }),
      fn(t) { sitAt(t); return {}; } },
    // G — red wash: her face as she looks up from the screens
    { key: "G", t0: T.G, cam: [[-7.72, DU + 1.4, -11.68], [-7.72, DU + 1.39, -11.6]], look: [[-7.5, DU + 1.42, -10.05], [-7.5, DU + 1.42, -10.05]], fov: 38,
      st: Object.assign({}, INT, { aperture: 3.2 }),
      fn(t, u, e, st) { const up = ramp(t, w("l06", "her") - 0.35, w("l06", "her") + 0.25); sitAt(t, { head: [0, lerp(12, 0, up)], look: [0, lerp(-10, 2, up)], expr: "calm", expr2: "worried", ek: up });
        return { focus: headAt(), tint: tintAt(t, RED, 0.5, w("l06", "her") - 0.1, 99) }; } },
    // H — dim: 9:40; the radio on the desk wakes (rings over it), Mira beyond
    { key: "H", t0: T.H, cam: [[-5.62, DU + 1.27, -10.33], [-5.66, DU + 1.25, -10.38]], look: [[-6.16, DU + 0.9, -11.3], [-6.16, DU + 0.9, -11.3]], fov: 40,
      st: Object.assign({}, INT, { aperture: 3.5, focus: [-6.1, DU + 0.88, -11.2] }),
      fn(t) { const on = ramp(t, w("l07", "crackled") - 0.15, w("l07", "crackled") + 0.25); sitAt(t, { head: [lerp(-4, -28, on), 12], look: [-8, -6], expr: "neutral", expr2: "worried", ek: on });
        return { exposure: lerp(0.72, 1.0, on) * XD, crI: lerp(0.45, 1, on), monI: lerp(0.5, 1, on), vig: lerp(0.6, 0.4, on), tint: [AMBER[0], AMBER[1] * 0.6, AMBER[2] * 0.6, 0.14 * on] }; } },
    // H2 — the radio close; the typed panel above (the third, smaller line is plant 2)
    { key: "H2", t0: T.H2, cam: [[-8.8, DU + 1.45, -11.6], [-8.74, DU + 1.44, -11.55]], look: [[-7.5, DU + 1.3, -10.05], [-7.5, DU + 1.3, -10.05]], fov: 40,
      st: Object.assign({}, INT, { aperture: 2.6, tint: [AMBER[0], AMBER[1] * 0.6, AMBER[2] * 0.6, 0.1] }),
      fn(t) { sitAt(t, { pose: "micsit", tool: "handset", head: [16, 6], look: [6, 0], expr: "worried" }); return { focus: headAt() }; } },
    // I — Mira with the handset: the helicopter calls
    { key: "I", t0: T.I, cam: [[-7.55, DU + 1.42, -11.8], [-7.55, DU + 1.41, -11.72]], look: [[-7.5, DU + 1.34, -10.05], [-7.5, DU + 1.34, -10.05]], fov: 38,
      st: Object.assign({}, INT, { aperture: 3 }),
      fn(t) { sitAt(t, { pose: "micsit", tool: "handset", head: [-6, 2], look: [-4, 0], expr: "worried" }); return { focus: headAt() }; } },
    // I2 — outside: the helideck lights blink on; the countdown starts
    { key: "I2", t0: T.I2, cam: [[8.6, DU + 1.3, 5.6], [8.3, DU + 1.25, 5.2]], look: [[-2.5, P.HD.c[1] + 0.4, -7.5], [-2.5, P.HD.c[1] + 0.8, -7.5]], fov: 50,
      st: Object.assign({}, EXT, { aperture: 1.0, focus: 14 }),
      fn(t) { hz.setHat(true); hz.set({ pos: STAIRF, ry: 180, pose: "stand", head: [0, -10], visible: false, t }); return {}; } },
    // J — at the foot of the helideck stair she looks up; a helicopter's lights approach in the sky; "?"
    { key: "J", t0: T.J, cam: [[4.0, DU + 1.45, 3.4], [3.95, DU + 1.44, 3.3]], look: [[2.2, DU + 2.4, -3.5], [2.2, DU + 2.45, -3.5]], fov: 56,
      st: Object.assign({}, EXT, { aperture: 1.0, flareShadow: 1, fill: { p: [4.0, DU + 2.4, 2.0], c: "#ffd8b8", i: 1.2 } }),
      fn(t) { hz.setHat(true); hz.set({ pos: STAIRF, ry: 172, pose: "lookup", head: [-8, -24], look: [0, -10], expr: "neutral", expr2: "worried", ek: ramp(t, T.J, T.J + 0.8), t }); return { focus: headAt() }; } },
    // J2 — front: she shakes her head on "no"
    { key: "J2", t0: T.J2, cam: [[3.05, DU + 1.95, -1.2], [3.05, DU + 1.93, -1.08]], look: [[3.1, DU + 1.52, 1.15], [3.1, DU + 1.52, 1.15]], fov: 40,
      st: Object.assign({}, EXT, { aperture: 2.2, flareShadow: 1, fill: { p: [3.3, DU + 2.6, -0.2], c: "#ffd2a8", i: 1.4 } }),
      fn(t) { hz.setHat(true); const sh = t > noT - 0.12 && t < noT + 0.75 ? Math.sin((t - noT + 0.12) * Math.PI * 2 * 2.6) * 20 * (1 - ramp(t, noT + 0.3, noT + 0.75)) : 0;
        hz.set({ pos: STAIRF, ry: 180, pose: "stand", head: [sh, 6], look: [0, 4], expr: "worried", expr2: "determined", ek: ramp(t, noT - 0.2, noT + 0.3), t }); return { focus: headAt() }; } },
    // K — telephoto at the coast: the heliport's lights, a crowd at its fence (silhouettes, red eyes)
    { key: "K", t0: T.K, cam: [[700, 4.6, -5932], [700, 4.6, -5946]], look: [[700, 4.2, -6065], [700, 4.2, -6065]], fov: 14,
      st: Object.assign({}, EXT, { crowdK: 1, heliportI: 1, townS: 0.3, rainK: 0.3, aperture: 0, warpK: 0, winGlow: 0, shadowAt: [700, 0, -6040] }),
      fn(t, u, e) { sitAt(t); return { fov: lerp(14, 12.5, e), tint: tintAt(t, RED, 0.3, w("l10", "heliport") - 0.3, 99, 1.0) }; } },
    // K2 — from the helideck: the helicopter turns back to the coast, its lights shrinking (deadpan)
    { key: "K2", t0: T.K2, cam: [[-5.5, P.HD.c[1] + 1.6, -15.6], [-5.5, P.HD.c[1] + 1.6, -15.8]], look: [[-26, 52, -600], [-30, 54, -640]], fov: 46,
      st: Object.assign({}, EXT, { aperture: 0, warpK: 0, rainK: 0.6, townS: 1.4 }),
      fn(t) { sitAt(t); return { tint: tintAt(t, RED, 0.22, T.K2, 99) }; } },
    // L1 — on the deck by the rail: "So Mira decided to stay." (worried -> determined, green)
    { key: "L1", t0: T.L1, cam: [[9.62, DU + 1.72, -0.02], [9.72, DU + 1.71, -0.08]], look: [[11.2, DU + 1.6, -0.6], [11.2, DU + 1.6, -0.6]], fov: 36,
      st: Object.assign({}, EXT, { aperture: 2.6, flareShadow: 1, fill: { p: [10.1, DU + 2.05, -0.1], c: "#ffd8b8", i: 2.0 } }),
      fn(t) { hz.setHat(true); const k = ramp(t, stayT + 0.1, stayT + 0.8); hz.set({ pos: [11.2, DU, -0.6], ry: -69, pose: "stand", head: [lerp(20, 0, k), lerp(22, 2, k)], look: [lerp(6, 0, k), lerp(-12, 0, k)], expr: "worried", expr2: "determined", ek: k, t });
        return { focus: headAt(), tint: tintAt(t, GREEN, 0.2, stayT + 0.2, 99) }; } },
    // L2 — underwater: the dead sink past the jacket legs into black (silhouettes, red eyes dimming)
    { key: "L2", t0: T.L2, cam: [[5.5, -5.0, 21.5], [5.2, -5.6, 20.8]], look: [[1, -9.5, 6], [1, -10.5, 6]], fov: 58,
      st: Object.assign({}, EXT, { under: 1, deadK: 1, rainK: 0, moonI: 0.25, hemiI: 0.5, rays: 0.5, rayThr: 0.12, rayAt: [0, 40, 0], rayCol: "#7fd0d0", aperture: 0, warpK: 0, flareI: 0.6, winGlow: 0 }),
      fn(t) { sitAt(t); return { sinkT: t - sinkT0 + 1.0, tint: tintAt(t, GREEN, 0.12, w("l11", "sink"), 99) }; } },
    // M — crane up from the waterline (foam at the leg) to above the deck: the sea all round (140 KM map)
    { key: "M", t0: T.M, cam: [[15.5, 1.3, 13.5], [24, 40, 26]], look: [[10.2, 2.2, 10.2], [0, 18, -14]], fov: 50,
      ease: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
      st: Object.assign({}, EXT, { aperture: 0.8 }),
      fn(t, u, e, st) { sitAt(t); return { focus: st.look, tint: tintAt(t, GREEN, 0.14, w("l12", "Better") - 0.15, 99) }; } },
    // N — the storeroom: a dolly along the labelled shelves (RATIONS · 12 CREW · 30 DAYS)
    { key: "N", t0: T.N, cam: [[1.45, DU + 1.75, -7.45], [-1.0, DU + 1.7, -7.55]], look: [[0.2, DU + 2.0, -11.6], [-1.6, DU + 1.95, -11.6]], fov: 58,
      st: Object.assign({}, INT, { storeI: 1, crI: 0, aperture: 2, focus: 4 }),
      fn(t) { sitAt(t); return {}; } },
    // O1 — the watermaker: water runs into a jug
    { key: "O1", t0: T.O1, cam: [[-1.02, DU + 1.36, -4.15], [-1.05, DU + 1.35, -4.08]], look: [[-1.58, DU + 1.06, -3.25], [-1.58, DU + 1.06, -3.25]], fov: 44,
      st: Object.assign({}, INT, { utilI: 1.2, crI: 0, aperture: 1.6, focus: [-1.6, DU + 1.0, -3.27] }),
      fn(t) { sitAt(t); return { waterK: 1, jugK: lerp(0.2, 0.85, ramp(t, T.O1, T.O2)) }; } },
    // O2 — the flare and the generator skid: the platform burns its own gas (heat shimmer over the flame)
    { key: "O2", t0: T.O2, cam: [[0.9, DU + 1.5, 2.9], [1.3, DU + 1.5, 2.5]], look: [[22, DU + 13, -13], [22, DU + 13.5, -13]], fov: 54,
      st: Object.assign({}, EXT, { genI: 1, aperture: 0.8, focus: 20, flareShadow: 1 }),
      fn(t) { sitAt(t); return {}; } },
    // O3 — the generator's door (plant 3: the small yellow sticker), the card back with POWER ∞
    { key: "O3", t0: T.O3, cam: [[5.3, DU + 1.3, 0.9], [5.38, DU + 1.3, 0.75]], look: [[8.2, DU + 2.2, -6.0], [8.2, DU + 2.22, -6.0]], fov: 46,
      st: Object.assign({}, EXT, { genI: 0.45, floodI: 0.4, exposure: 0.72, aperture: 0.8, focus: [7.4, DU + 1.6, -5.4], flareShadow: 1 }),
      fn(t) { sitAt(t); return {}; } },
    // Q1 — night action: the boat-landing ladder winched up out of the waves; Mira at the winch above
    { key: "Q1", t0: T.Q1, cam: [[8.8, 4.6, 17.8], [8.6, 4.8, 17.5]], look: [[4.3, 5.5, 12.0], [4.3, 6.2, 12.0]], fov: 52,
      st: Object.assign({}, EXT, { aperture: 1.0, focus: 7, rainK: 0.8 }),
      fn(t) { hz.setHat(true); const c = Math.sin(t * 6.5); hz.set({ pos: WINCH, ry: 0, pose: "crank", lean: 6 + 6 * c, twist: 4 * c, head: [0, 22], expr: "determined", t }); return {}; } },
    // Q2 — the chain and the padlock on the helideck stair gate (CUT OFF)
    { key: "Q2", t0: T.Q2, cam: [[4.35, DU + 1.45, 1.05], [4.3, DU + 1.43, 0.98]], look: [[3.2, DU + 0.75, 0.32], [3.2, DU + 0.75, 0.32]], fov: 44,
      st: Object.assign({}, EXT, { aperture: 2.5, focus: [3.25, DU + 0.68, 0.35], flareShadow: 1, fill: { p: [4.0, DU + 2.0, 1.2], c: "#ffd8b4", i: 0.9 } }),
      fn(t) { hz.setHat(true); hz.set({ pos: GATEP, ry: 186, pose: "chain", head: [0, 30], look: [0, -10], expr: "determined", t }); return {}; } },
    // R — the desk: the plan ticks (Food? Check. Water? Check. Power? Check.)
    { key: "R", t0: T.R, cam: [[-8.85, DU + 1.55, -11.62], [-8.78, DU + 1.53, -11.56]], look: [[-7.5, DU + 1.28, -10.05], [-7.5, DU + 1.28, -10.05]], fov: 40,
      st: Object.assign({}, INT, { aperture: 2.6 }),
      fn(t) { sitAt(t, { pose: "write", tool: "pen", head: [12, 10], look: [4, -8], expr: "calm" }); return { focus: headAt() }; } },
    // R2 — "Ninety-seven percent. On paper." Slow push; on "On paper" the lamp flickers and the room dims; she looks up
    { key: "R2", t0: T.R2, cam: [[-8.72, DU + 1.52, -11.56], [-8.45, DU + 1.48, -11.32]], look: [[-7.5, DU + 1.3, -10.05], [-7.5, DU + 1.3, -10.05]], fov: 38,
      st: Object.assign({}, INT, { aperture: 2.8 }),
      fn(t) { const up = ramp(t, opT + 0.05, opT + 0.6); sitAt(t, { pose: "write", tool: "pen", head: [lerp(12, 16, up), lerp(10, -2, up)], look: [lerp(4, 6, up), lerp(-8, 4, up)], expr: "calm", expr2: "worried", ek: up });
        const fl = (t > opT - 0.05 && t < opT + 0.09) || (t > opT + 0.3 && t < opT + 0.42) ? 0.3 : 1;
        return { focus: headAt(), lampI: fl * lerp(1, 0.7, ramp(t, opT, opT + 0.8)), crI: fl * lerp(1, 0.75, ramp(t, opT, opT + 0.8)), exposure: lerp(1.0, 0.86, ramp(t, opT, opT + 0.8)) * XD }; } },
    // S — black beat: the rig small in the black sea, flare burning; the coast's glow goes out section by section (plant 4)
    { key: "S", t0: T.S, cam: [[0, 57, 290], [0, 52, 268]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL),
      fn(t) { sitAt(t); const cut = Math.floor(clamp((t - (forgotT - 0.45)) / 0.3, 0, 6)); return { coastCut: cut, glowK: 0.42 * (1 - cut / 6) + 0.01, black: 0.22 + 0.78 * (1 - ramp(t, T.S, T.S + 0.28)) }; } },
    // Z1 — end card 1 over the same aerial, dimmer (the coast dark, the eyes on the shore)
    { key: "Z1", t0: T.Z1, cam: [[0, 52, 268], [0, 49, 256]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL, { vig: 0.68 }),
      fn(t) { sitAt(t); return { coastCut: 6, glowK: 0.01, black: 0.45 }; } },
    // Z2 — end card 2: near black
    { key: "Z2", t0: T.Z2, cam: [[0, 49, 256], [0, 47, 248]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL, { vig: 0.7 }),
      fn(t) { sitAt(t); return { coastCut: 6, glowK: 0.01, black: lerp(0.45, 0.94, ramp(t, T.Z2, T.Z2 + 0.5)) }; } },
  ];
  for (const s of shots) {
    const fn = s.fn;
    s.fn = function (t, u, e, st) { const Wd = WORLD(t); const o = fn.call(this, t, u, e, st) || {}; return Object.assign(Wd, o); };
  }
  return { shots, reset() {}, base: { sat: 0.95 } };
};
