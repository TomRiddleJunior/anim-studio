/* Survival Odds template demo (~23 s): the hook with the ring at 71 % (A1), the radio wakes (H: -13 % OUTBREAK),
 * the underwater cut-away (L2: +15 % THE DEAD SINK), the black aerial where the coast goes dark and the ring glitches
 * to ?? (S), the two end cards (Z1, Z2). World: survival-rig.js; shot boundaries from FILM_VO.T (tools/build.py).
 * The full 32-shot episode is assets/sample/assets/lib/film.js. */
window.FILM_CREATE = Object.assign({}, window.SURVIVAL.rig.CREATE);
window.FILM_BUILD = function (K) {
  const Rg = window.SURVIVAL.rig(K);
  const hz = K.hazel(window.SURVIVAL.rig.MIRA);
  const mira = window.SURVIVAL.rig.dressMira(K, hz);
  return { Rg, hz, mira };
};
window.FILM = function (K, V, X) {
  const { Rg, hz } = X;
  const T = window.FILM_VO.T, P = Rg.P, DU = P.DU;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ramp = (t, a, b) => { const u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const w = (id, word) => V.w(id, word);
  const GREEN = [0.25, 0.95, 0.5], AMBER = [1.0, 0.55, 0.2];
  const tintAt = (t, col, a, t0) => [col[0], col[1], col[2], a * ramp(t, t0, t0 + 0.3)];
  const EXT = { moonI: 1.4, hemiI: 0.35, envI: 0.45, exposure: 1.0, aperture: 0.6, fogD: 0.00022, starK: 0.15, moonK: 0, flareI: 1, floodI: 1, crI: 0.8, lampI: 1, monI: 1, scrK: 1,
    rainK: 0.7, cloudK: 1, heliDeckK: 1, coastK: 1, glowK: 0.3, glowDir: [0, 0, -1], glowCol: "#ff8a4a", winGlow: 1, warpK: 1 };
  const INT = Object.assign({}, EXT, { moonI: 0.35, hemiI: 0.12, envI: 0.3, flareI: 0.12, floodI: 0.15, crI: 1, rainK: 0, winGlow: 0, warpK: 0, aperture: 3.5 });
  const AERIAL = Object.assign({}, EXT, { exposure: 0.85, aperture: 0, vig: 0.62, rainK: 0.35, shoreEyesK: 1, shoreEyeS: 4, shoreEyeSep: 1.6, warpK: 0, starK: 0.05, townS: 1.6, cloudGlow: 0.45 });
  const sit = (t, e) => { hz.setHat(false); hz.set(Object.assign({ pos: P.SEAT, ry: 180, pose: "desk", head: [0, 4], expr: "calm", t }, e || {})); };
  const crackle = w("l02", "crackled"), forgot = w("l04", "forgot");
  const shots = [
    { key: "A1", t0: T.A1, cam: [[-72, 47, 37], [-61, 42, 31]], look: [[11, 26.5, -10], [11, 26.5, -10]], fov: 46,
      st: Object.assign({}, EXT, { aperture: 0.5, focus: 80, flareShadow: 1 }),
      fn(t) { sit(t); return { tint: tintAt(t, GREEN, 0.15, w("l01", "lucky") - 0.1) }; } },
    { key: "H", t0: T.H, cam: [[-5.62, DU + 1.27, -10.33], [-5.66, DU + 1.25, -10.38]], look: [[-6.16, DU + 0.9, -11.3], [-6.16, DU + 0.9, -11.3]], fov: 40,
      st: Object.assign({}, INT, { focus: [-6.1, DU + 0.88, -11.2] }),
      fn(t) { const on = ramp(t, crackle - 0.15, crackle + 0.25); sit(t);
        return { radioK: on > 0.01 ? 1 : 0, txK: t > crackle && Math.sin(t * 11) > 0.3 ? 1 : 0, exposure: lerp(0.72, 1.0, on), crI: lerp(0.45, 1, on), tint: [AMBER[0], AMBER[1] * 0.6, AMBER[2] * 0.6, 0.14 * on] }; } },
    { key: "L2", t0: T.L2, cam: [[5.5, -5.0, 21.5], [5.2, -5.6, 20.8]], look: [[1, -9.5, 6], [1, -10.5, 6]], fov: 58,
      st: Object.assign({}, EXT, { under: 1, deadK: 1, rainK: 0, moonI: 0.25, hemiI: 0.5, rays: 0.5, rayThr: 0.12, rayAt: [0, 40, 0], rayCol: "#7fd0d0", aperture: 0, warpK: 0, flareI: 0.6, winGlow: 0 }),
      fn(t) { sit(t); return { sinkT: t - T.L2 + 1.0, tint: tintAt(t, GREEN, 0.12, w("l03", "sink")) }; } },
    { key: "S", t0: T.S, cam: [[0, 57, 290], [0, 52, 268]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL),
      fn(t) { sit(t); const cut = Math.floor(clamp((t - (forgot - 0.45)) / 0.3, 0, 6)); return { coastCut: cut, glowK: 0.3 * (1 - cut / 6) + 0.01, black: 0.22 + 0.78 * (1 - ramp(t, T.S, T.S + 0.28)) }; } },
    { key: "Z1", t0: T.Z1, cam: [[0, 52, 268], [0, 49, 256]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL, { vig: 0.68 }), fn(t) { sit(t); return { coastCut: 6, glowK: 0.01, black: 0.45 }; } },
    { key: "Z2", t0: T.Z2, cam: [[0, 49, 256], [0, 47, 248]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL, { vig: 0.7 }), fn(t) { sit(t); return { coastCut: 6, glowK: 0.01, black: lerp(0.45, 0.94, ramp(t, T.Z2, T.Z2 + 0.5)) }; } },
  ];
  return { shots, reset() {}, base: { sat: 0.95 } };
};
