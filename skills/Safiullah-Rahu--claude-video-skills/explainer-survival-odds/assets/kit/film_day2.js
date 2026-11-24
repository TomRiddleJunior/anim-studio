/* "Survival Odds · The Rig · Day 2" — shot list for the survival-scenario kit v2.3 + the world module survival-rig.js.
 * Day 2 opens on the shutdown (DAY 4 · 11:59 PM), replays the four Day 1 plants, recounts at a grey storm dawn
 * (DAY 5 · 6:40 AM) and ends on the A/B fork. Shot boundaries come from tools/build.py (FILM_VO.T); every prop state is
 * a pure function of t; the HUD (ring, cards, captions) is compositions/hud.html. */
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
  const P = Rg.P, DU = P.DU, DM = P.DM, G = P.GEN, VALVE = P.VALVE, LB = P.LB;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ss = (x) => x * x * (3 - 2 * x);
  const ramp = (t, a, b) => ss(clamp((t - a) / (b - a), 0, 1));
  const L = (id) => V.L(id), w = (id, word, k) => V.w(id, word, k);
  const XD = window.FILM_DEBUG_EXPO;
  const V3 = K.T.Vector3;
  const headAt = () => { hz.root.updateMatrixWorld(true); const h = hz.headWorld(new V3()); return [h.x, h.y, h.z]; };

  // ---------------------------------------------------------------- story times
  const offT = w("l01", "off"), gasT = w("l02", "gas"), powT = w("l02", "power"), litT = w("l02", "lights");
  const scrT = w("l05", "screen"), midT = w("l06", "midnight"), shutT = w("l07", "shuts"), darkT = w("l08", "dark");
  const gullLeftT = w("l09", "left"), burnT = w("l16", "burns"), fuelT = w("l18", "Fuel");
  const DX = (G.x0 + G.x1) / 2 - 1.4;                                    // the generator door's x (plant 3)

  // ---------------------------------------------------------------- light states
  const EXT = { moonI: 1.4, hemiI: 0.35, envI: 0.45, exposure: 1.0 * XD, aperture: 0.8, fogD: 0.00022, starK: 0.15, moonK: 0, flareI: 1, flareS: 1, floodI: 1, crI: 0.8, lampI: 1, monI: 1, scrK: 1,
    rainK: 0.7, cloudK: 1, heliDeckK: 1, coastK: 1, glowK: 0.3, glowDir: [0, 0, -1], glowCol: "#ff8a4a", winGlow: 1, warpK: 1, rays: 0, shoreEyesK: 0, obstK: 1, monOn: 1 };
  const INT = Object.assign({}, EXT, { moonI: 0.35, hemiI: 0.12, envI: 0.3, flareI: 0.12, floodI: 0.15, crI: 1, rainK: 0, winGlow: 0, warpK: 0, aperture: 3 });
  const AERIAL = Object.assign({}, EXT, { exposure: 0.85 * XD, aperture: 0, vig: 0.62, rainK: 0.35, shoreEyesK: 1, shoreEyeS: 4, shoreEyeSep: 1.6, warpK: 0, starK: 0.05, townS: 2.6, cloudGlow: 0.45, glowK: 0.42 });
  // after the shutdown: no flare, no floods, no deck lamps, no helideck, no screens; the coast dark since Day 1
  const OFF = { flareI: 0, flareS: 0, floodI: 0, lampCut: 4, obstK: 0, heliDeckK: 0, winGlow: 0, monOn: 0, crI: 0, lampI: 0, monI: 0, coastCut: 6, glowK: 0.01, warpK: 0, cloudGlow: 0 };
  const NIGHT = Object.assign({}, EXT, OFF, { moonI: 1.7, hemiI: 0.5, envI: 0.4, exposure: 1.15 * XD, rainK: 0.8 });
  const DARKROOM = Object.assign({}, INT, OFF, { moonI: 0.6, hemiI: 0.6, envI: 0.35, exposure: 1.35 * XD, aperture: 2.4 });
  // a grey storm dawn (DAY 5 · 6:40 AM): the dome, clouds, sea and fog go grey; soft cool light, rain
  const DAWN = Object.assign({}, EXT, OFF, { dawn: 1, moonI: 1.3, hemiI: 1.9, envI: 1.0, exposure: 1.0 * XD, starK: 0, rainK: 0.85, fogD: 0.0009, aperture: 0.8 });
  const DAWNIN = Object.assign({}, DAWN, { moonI: 0.6, hemiI: 0.9, envI: 0.5, rainK: 0, aperture: 2.6, exposure: 1.2 * XD });
  // the Day 1 replays: the Day 1 look, desaturated and cooled
  const FLASH = { sat: 0.42, tint: [0.62, 0.78, 1.0, 0.1], vig: 0.62 };
  const tintAt = (t, col, a, t0, t1, fin, fout) => { const k = ramp(t, t0, t0 + (fin || 0.3)) * (1 - ramp(t, t1, t1 + (fout || 0.4))); return [col[0], col[1], col[2], a * k]; };
  const GREEN = [0.25, 0.95, 0.5], RED = [1.0, 0.18, 0.12], BLUE = [0.3, 0.55, 1.0], COOL = [0.55, 0.75, 1.0];
  const FLK = [1, 1, 0.2, 1, 1, 1, 0.2, 0.2, 1, 1, 0.35, 1, 1, 0.2, 1, 1];
  const flick = (t, seed) => FLK[(Math.floor(t * 10) + Math.round(seed * 7)) % FLK.length];
  const WORLD = (t) => ({ ladder: 1, chain: 1, heliK: 0, gull: t < gullLeftT + 1.6 ? 1 : 0, linkLost: 1, gaugeK: 0, monOn: 0, coastCut: 6, glowK: 0.01 });

  // Mira's marks
  const SEAT = P.SEAT, RAIL = [11.2, DU, -0.6];
  const sitAt = (t, e) => { hz.setHat(false); hz.setBlanket(false); hz.set(Object.assign({ pos: SEAT, ry: 180, pose: "desk", head: [0, 4], expr: "calm", t }, e || {})); };
  const standAt = (t, pos, ry, e, hat) => { hz.setHat(!!hat); hz.setBlanket(false); hz.set(Object.assign({ pos, ry, pose: "stand", t }, e || {})); };
  const hide = (t) => { hz.setBlanket(false); hz.set({ visible: false, t }); };
  const torchOut = (st, I, A, beam) => { const [p, d] = hz.torchWorld(); hz.torchHalo(st.cam); return { torchK: 1, torchP: p, torchAt: [p[0] + d[0] * 6, p[1] + d[1] * 6, p[2] + d[2] * 6], torchI: I || 30, torchA: A || 17, torchBeam: beam == null ? 2.2 : beam, torchBeamL: 5 }; };
  const COLDROOM = { winColdI: 1.0, winGlow: 0.5, winGlowCol: "#6f86b0" };

  const shots = [
    // A1 — frame 1: the rig lit in the storm (the Day 1 hero framing), the flare burning; the ring at ??. On "off" the
    //      deck lamps die section by section, the floods go out one by one, the helideck and windows go dark, the flare
    //      shrinks and goes out.
    { key: "A1", t0: T.A1, cam: [[-72, 47, 37], [-63, 43, 32]], look: [[11, 26.5, -10], [11, 26.0, -10]], fov: 46,
      st: Object.assign({}, EXT, { aperture: 0.5, focus: 80, flareShadow: 1 }),
      fn(t) { sitAt(t); const k = (t - offT) / 1.2;
        return { lampCut: clamp(Math.floor(k * 5), 0, 4), floodCut: clamp(Math.floor(k * 6 + 0.5), 0, 5), heliDeckK: t < offT + 0.35 ? 1 : 0, winGlow: t < offT + 0.55 ? 1 : 0,
          obstK: t < offT + 0.9 ? 1 : 0, flareS: 1 - ramp(t, offT + 0.15, offT + 1.4), flareI: 1 - ramp(t, offT + 0.5, offT + 1.55), cloudGlow: 1 - ramp(t, offT + 0.3, offT + 1.6),
          monOn: 1, linkLost: 0, gaugeK: 1, coastCut: 6, glowK: 0.01, exposure: lerp(1.0, 1.25, ramp(t, offT + 0.5, offT + 1.8)) * XD }; } },
    // B1 — "No gas.": the console's pressure gauges fall to zero
    { key: "B1", t0: T.B1, cam: [[-4.58, DU + 1.36, -10.42], [-4.55, DU + 1.35, -10.47]], look: [[-4.05, DU + 1.03, -11.31], [-4.05, DU + 1.03, -11.31]], fov: 42,
      st: Object.assign({}, INT, { aperture: 3.5, focus: [-4.05, DU + 1.03, -11.31], flareI: 0, floodI: 0, winGlow: 0 }),
      fn(t) { sitAt(t); return { gaugeK: 1 - ramp(t, gasT - 0.02, gasT + 0.45), monOn: 1, linkLost: 0 }; } },
    // B2 — "No power.": the console monitors flicker and black out, the ceiling lights die
    { key: "B2", t0: T.B2, cam: [[-9.55, DU + 1.48, -10.2], [-9.45, DU + 1.47, -10.26]], look: [[-7.0, DU + 1.2, -11.45], [-7.0, DU + 1.2, -11.45]], fov: 46,
      st: Object.assign({}, INT, { aperture: 2.2, focus: [-8.25, DU + 1.29, -11.5], flareI: 0, floodI: 0, winGlow: 0 }),
      fn(t) { hide(t); const dt = t - powT, on = dt < 0 ? 1 : dt < 0.067 ? 0.2 : dt < 0.134 ? 1 : 0;   // dark 2 frames, back 2 frames, dead: never one lone bright frame
        return { monOn: on, crI: on, lampI: on, monI: on, linkLost: 0, exposure: lerp(1.0, 1.3, 1 - on) * XD }; } },
    // B3 — "No lights.": the emergency lights over the door flicker on, then die
    { key: "B3", t0: T.B3, cam: [[-7.6, DU + 1.55, -6.2], [-7.55, DU + 1.56, -6.0]], look: [[-6.9, DU + 2.1, -2.3], [-6.9, DU + 2.12, -2.3]], fov: 48,
      st: Object.assign({}, DARKROOM, { aperture: 1.6, focus: [-6.9, DU + 2.4, -2.4] }),
      fn(t) { hide(t); const e = t < litT - 0.15 ? flick(t, 0.7) : t < litT + 0.6 ? flick(t, 2.1) * (1 - ramp(t, litT + 0.15, litT + 0.6)) : 0; return { emergK: e, exposure: 1.0 * XD }; } },
    // BK — black beat: the dark rig small in the black sea; the coast dark, red eyes along the shore
    { key: "BK", t0: T.BK, cam: [[0, 62, 305], [0, 58, 288]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL, OFF, { moonI: 1.6, exposure: 0.95 * XD, shoreEyesK: 1 }),
      fn(t) { hide(t); return { black: 0.2 + 0.8 * (1 - ramp(t, T.BK, T.BK + 0.3)) }; } },
    // C — the dark control room: Mira with the torch, worried (the clock: DAY 4 · 11:59 PM)
    { key: "C", t0: T.C, cam: [[-6.9, DU + 1.62, -8.8], [-7.05, DU + 1.6, -8.95]], look: [[-8.7, DU + 1.4, -10.3], [-8.72, DU + 1.4, -10.3]], fov: 44,
      st: Object.assign({}, DARKROOM, COLDROOM, { aperture: 2.4, fill: { p: [-7.9, DU + 1.95, -9.55], c: "#b4c4e0", i: 3.2 } }),
      fn(t, u, e, st) { standAt(t, [-8.95, DU, -10.25], 115, { pose: "torch", tool: "torch", head: [lerp(-46, -56, u), 6], look: [-4, -2], expr: "worried" });
        return Object.assign({ focus: headAt() }, torchOut(st, 32, 17, 2.4)); } },
    // D — the control room wide in torchlight; her beam sweeps to the dark wall screen (tag REMOTE OPERATED)
    { key: "D", t0: T.D, cam: [[-6.15, DU + 1.6, -5.55], [-6.4, DU + 1.58, -5.8]], look: [[-9.5, DU + 1.25, -8.9], [-9.6, DU + 1.27, -9.0]], fov: 48,
      st: Object.assign({}, DARKROOM, COLDROOM, { aperture: 1.6, hemiI: 1.15, winColdI: 1.5, exposure: 1.5 * XD, focus: [-8.6, DU + 1.4, -7.6], fill: { p: [-7.6, DU + 2.1, -7.0], c: "#a9bcdc", i: 3.0 } }),
      fn(t, u, e, st) { const ry = lerp(200, 238, ss(clamp(u * 1.25, 0, 1)));
        standAt(t, [-8.6, DU, -7.6], ry, { pose: "torch", tool: "torch", head: [lerp(-4, -10, u), 4], look: [0, 0], expr: "worried" });
        return torchOut(st, 34, 18, 2.2); } },
    // P1 — REPLAY (Day 1, 0:17): the wall screen, now the focus; LINK ● -> LINK LOST on "screen"
    { key: "P1", t0: T.P1, cam: [[-6.1, DU + 1.98, -9.55], [-6.45, DU + 1.98, -9.55]], look: [[-11.65, DU + 1.98, -9.55], [-11.65, DU + 1.98, -9.55]], fov: 46,
      st: Object.assign({}, INT, FLASH, { aperture: 0.4, focus: [-11.65, DU + 1.98, -9.55] }),
      fn(t) { hide(t); const ll = t < scrT ? 0 : t < scrT + 0.25 ? (Math.sin(t * 70) > 0 ? 1 : 0) : 1; return { linkLost: ll, monOn: 1, gull: 1 }; } },
    // P2 — REPLAY (Day 1, 0:35): Mira with the handset at 9:40 PM; the panel's third line highlighted (HUD)
    { key: "P2", t0: T.P2, cam: [[-8.8, DU + 1.45, -11.6], [-8.72, DU + 1.44, -11.54]], look: [[-7.5, DU + 1.3, -10.05], [-7.5, DU + 1.3, -10.05]], fov: 40,
      st: Object.assign({}, INT, FLASH, { aperture: 2.6, tint: [0.75, 0.75, 1.0, 0.12] }),
      fn(t) { sitAt(t, { pose: "micsit", tool: "handset", head: [16, 6], look: [6, 0], expr: "worried" }); return { focus: headAt(), monOn: 1, linkLost: 0, radioK: 1, gaugeK: 1 }; } },
    // P3a — night: her torch finds the generator door
    { key: "P3a", t0: T.P3a, cam: [[DX + 1.25, DU + 1.78, -0.9], [DX + 1.05, DU + 1.74, -1.5]], look: [[DX - 0.05, DU + 1.35, G.z1], [DX - 0.05, DU + 1.45, G.z1]], fov: 48,
      st: Object.assign({}, NIGHT, { aperture: 1.0, focus: [DX, DU + 1.4, G.z1], fill: { p: [DX + 1.0, DU + 2.2, -1.6], c: "#9fb2d4", i: 0.8 } }),
      fn(t, u, e, st) { standAt(t, [DX + 0.35, DU, -2.7], 186, { pose: "torch", tool: "torch", head: [0, 8], look: [0, -6], expr: "worried" }, true); return torchOut(st, 60, 16, 1.6); } },
    // P3b — the sticker full frame in the torchlight; red on "shuts itself down"
    { key: "P3b", t0: T.P3b, cam: [[DX + 0.08, DU + 1.6, G.z1 + 3.0], [DX + 0.04, DU + 1.58, G.z1 + 2.62]], look: [[DX, DU + 1.56, G.z1], [DX, DU + 1.56, G.z1]], fov: 44, ease: (u) => u,
      st: Object.assign({}, NIGHT, { aperture: 0.6, focus: [DX, DU + 1.56, G.z1 + 0.06] }),
      fn(t) { hide(t); const sw = Math.sin(t * 1.3) * 0.05;
        return { torchK: 1 - ramp(t, T.P4 - 0.42, T.P4 - 0.3), torchP: [DX + 0.55, DU + 1.75, G.z1 + 2.2], torchAt: [DX + sw, DU + 1.5 + sw * 0.5, G.z1], torchI: 22, torchA: 16, tint: tintAt(t, RED, 0.3, shutT - 0.1, 99) }; } },
    // P4 — REPLAY (Day 1, 1:24): the rig in the black sea, the flare burning; the coast's lights go out section by section
    { key: "P4", t0: T.P4, cam: [[0, 57, 290], [0, 53, 272]], look: [[0, -263, -2000], [0, -263, -2000]], fov: 40, ease: (u) => u,
      st: Object.assign({}, AERIAL, FLASH),
      fn(t) { hide(t); const cut = Math.floor(clamp((t - (darkT - 0.45)) / 0.3, 0, 6)); return { coastCut: cut, glowK: 0.42 * (1 - cut / 6) + 0.01, ladder: 1 }; } },
    // W1 — present: the dark window from outside in the rain, her torch moving inside, the gull on the sill
    { key: "W1", t0: T.W1, cam: [[-8.0, DU + 1.22, -15.2], [-7.98, DU + 1.23, -15.0]], look: [[-7.55, DU + 1.27, -10.05], [-7.55, DU + 1.27, -10.05]], fov: 34,
      st: Object.assign({}, NIGHT, { aperture: 1.0, rainK: 0.55, crI: 0, winGlow: 0.35, fill: { p: [-7.6, DU + 1.75, -13.3], c: "#c9d6ee", i: 1.6 } }),
      fn(t, u, e, st) { standAt(t, [-7.4, DU, -10.6], 178 + Math.sin(t * 0.9) * 12, { pose: "torch", tool: "torch", head: [0, 22], look: [0, -10], expr: "worried" }); const to = torchOut(st, 22, 18, 1.0);
        return Object.assign({ gullRy: -62, gullHead: -20, focus: [-7.45, DU + 1.15, -12.3] }, to); } },
    // W2 — the gull looks in at the dark window, then flies off into the rain on "left"
    { key: "W2", t0: T.W2, cam: [[-5.3, DU + 1.55, -15.6], [-5.36, DU + 1.56, -15.5]], look: [[-7.4, DU + 1.45, -12.6], [-7.45, DU + 1.5, -12.6]], fov: 44,
      st: Object.assign({}, NIGHT, { aperture: 1.0, rainK: 0.75, winGlow: 0.2, fill: { p: [-6.4, DU + 2.3, -14.0], c: "#d4def0", i: 4.0 } }),
      fn(t) { hide(t); const look = ramp(t, T.W2 + 0.2, T.W2 + 0.7); return { gullRy: -62, gullHead: lerp(-20, 70, look), gullFly: clamp((t - (gullLeftT + 0.05)) / 1.6, 0, 1), focus: [-7.45, DU + 1.15, -12.3] }; } },
    // R1 — DAWN (DAY 5 · 6:40 AM): Mira with the torch in the dark storeroom; the supplies card (empty)
    { key: "R1", t0: T.R1, cam: [[0.75, DU + 1.55, -10.9], [0.7, DU + 1.56, -10.75]], look: [[-1.7, DU + 1.78, -9.0], [-1.7, DU + 1.78, -9.0]], fov: 44,
      st: Object.assign({}, DAWNIN, { storeI: 0, fill: { p: [-0.55, DU + 2.0, -9.9], c: "#b8c6dc", i: 3.5 } }),
      fn(t, u, e, st) { standAt(t, [-1.7, DU, -9.0], 142, { pose: "torch", tool: "torch", head: [-10, 4], look: [-6, 0], expr: "worried" }); return Object.assign({ focus: headAt() }, torchOut(st, 30, 18, 1.8)); } },
    // R2 — the RATIONS shelves in the torchlight (a dolly); the card: FOOD ≈ 1 year
    { key: "R2", t0: T.R2, cam: [[1.45, DU + 1.75, -7.45], [-0.6, DU + 1.7, -7.6]], look: [[0.2, DU + 1.6, -11.6], [-1.4, DU + 1.55, -11.6]], fov: 58,
      st: Object.assign({}, DAWNIN, { storeI: 0, aperture: 2, focus: 4, fill: { p: [-0.6, DU + 2.6, -8.6], c: "#b8c6dc", i: 0.6 } }),
      fn(t, u) { hide(t); return { torchK: 1, torchP: [lerp(1.2, -0.4, u), DU + 1.6, -7.7], torchAt: [lerp(0.4, -1.6, u), DU + 1.35, -11.6], torchI: 55, torchA: 24, torchBeam: 0.4 }; } },
    // R3 — the watermaker's tap: a last drip; the tank's sight glass at 40 L
    { key: "R3", t0: T.R3, cam: [[-0.55, DU + 1.82, -4.25], [-0.52, DU + 1.8, -4.12]], look: [[-0.35, DU + 1.7, -3.06], [-0.35, DU + 1.7, -3.06]], fov: 46,
      st: Object.assign({}, DAWNIN, { utilI: 0, aperture: 2.2, focus: [-0.3, DU + 1.5, -3.06], fill: { p: [-0.6, DU + 2.1, -4.0], c: "#b8c6dc", i: 1.0 } }),
      fn(t) { hide(t); const sw = Math.sin(t * 1.2) * 0.12; return { dripK: 1, waterK: 0, jugK: 0.06, torchK: 1, torchP: [0.2, DU + 1.8, -4.4], torchAt: [-0.35 + sw, DU + 1.45, -3.06], torchI: 9, torchA: 22 }; } },
    // R3b — the tank's sight glass: 40 L (the card: WATER 40 L, red)
    { key: "R3b", t0: T.R3b, cam: [[-2.62, DU + 1.08, -4.75], [-2.65, DU + 1.06, -4.6]], look: [[-2.75, DU + 0.89, -3.36], [-2.75, DU + 0.89, -3.36]], fov: 42,
      st: Object.assign({}, DAWNIN, { utilI: 0, aperture: 2.2, exposure: 0.78 * XD, focus: [-2.75, DU + 0.96, -3.36], fill: { p: [-2.4, DU + 1.8, -4.1], c: "#b8c6dc", i: 0.5 } }),
      fn(t) { hide(t); const sw = Math.sin(t * 1.1) * 0.06; return { torchK: 1, torchP: [-2.2, DU + 1.6, -4.5], torchAt: [-2.75 + sw, DU + 0.95, -3.36], torchI: 3, torchA: 20, exposure: lerp(0.72, 0.5, ramp(t, T.R4 - 0.9, T.R4 - 0.05)) * XD }; } },
    // R4 — dawn on deck: rain into the tarp, the tarp into the blue barrels (+5 % RAIN)
    { key: "R4", t0: T.R4, cam: [[-4.35, DU + 1.6, 3.25], [-4.5, DU + 1.58, 3.05]], look: [[-6.65, DU + 0.95, 0.55], [-6.65, DU + 0.95, 0.55]], fov: 50,
      st: Object.assign({}, DAWN, { rainK: 1.0, aperture: 1.0, exposure: 1.25 * XD, focus: [-6.6, DU + 1.0, 0.8] }),
      fn(t) { hide(t); return { rainCatchK: 1 }; } },
    // R5 — the cold control room: Mira in a blanket at the console, her breath in the air
    { key: "R5", t0: T.R5, cam: [[-8.85, DU + 1.55, -11.62], [-8.8, DU + 1.54, -11.55]], look: [[-7.5, DU + 1.32, -10.05], [-7.5, DU + 1.32, -10.05]], fov: 40,
      st: Object.assign({}, DAWNIN, { aperture: 2.6, fill: { p: [-7.7, DU + 1.75, -11.05], c: "#c8d4e6", i: 3.5 } }),
      fn(t) { sitAt(t, { head: [12, 2], look: [6, -2], expr: "worried", br: Math.sin(t * 2.6) * 0.008 }); hz.setBlanket(true);
        const h = headAt(); return { focus: h, breathK: 1, breathAt: [h[0] + 0.02, h[1] - 0.075, h[2] - 0.1], breathDir: [0.25, -0.1, -1] }; } },
    // R6 — the thermometer on the console: 5 °C
    { key: "R6", t0: T.R6, cam: [[-8.62, DU + 1.08, -10.42], [-8.64, DU + 1.06, -10.5]], look: [[-8.7, DU + 0.86, -11.0], [-8.7, DU + 0.86, -11.0]], fov: 40,
      st: Object.assign({}, DAWNIN, { aperture: 3.5, focus: [-8.7, DU + 0.86, -10.98], fill: { p: [-8.5, DU + 1.4, -10.6], c: "#c4d0e2", i: 0.5 } }),
      fn(t) { hide(t); return {}; } },
    // F0 — Mira at the rail at dawn, the grey sea; the screen splits in two (HUD) on "choices"
    { key: "F0", t0: T.F0, cam: [[8.3, DU + 1.95, 2.3], [8.45, DU + 1.92, 2.0]], look: [[12.4, DU + 1.25, -2.0], [12.4, DU + 1.25, -2.0]], fov: 50,
      st: Object.assign({}, DAWN, { aperture: 1.0, focus: RAIL }),
      fn(t) { standAt(t, RAIL, -69 + 180, { pose: "rail", head: [0, -4], look: [0, 0], expr: "worried" }, true); return {}; } },
    // FA1 — A · RESTART THE RIG: the manual restart panel; her hands on the big valve wheel
    { key: "FA1", t0: T.FA1, cam: [[2.4, DU + 1.9, -3.4], [2.6, DU + 1.86, -3.65]], look: [[5.3, DU + 1.2, -6.6], [5.3, DU + 1.2, -6.6]], fov: 46,
      st: Object.assign({}, DAWN, { aperture: 1.6, focus: [VALVE[0] - 0.2, DU + 1.2, VALVE[2]], fill: { p: [VALVE[0] - 1.0, DU + 2.2, VALVE[2] + 1.0], c: "#d8e0ec", i: 3.0 } }),
      fn(t) { standAt(t, [VALVE[0] - 0.78, DU, VALVE[2] + 0.12], 90, { pose: "winch", head: [-4, 14], look: [0, -8], expr: "determined" }, true); return { wheelA: 0 }; } },
    // FA2 — the valve close; it turns; on "burns" the what-if: a flame bursts at the valve (red)
    { key: "FA2", t0: T.FA2, cam: [[VALVE[0] - 1.75, DU + 1.52, VALVE[2] + 1.3], [VALVE[0] - 1.6, DU + 1.5, VALVE[2] + 1.18]], look: [[VALVE[0] - 0.1, DU + 1.25, VALVE[2]], [VALVE[0] - 0.1, DU + 1.3, VALVE[2]]], fov: 40,
      st: Object.assign({}, DAWN, { aperture: 1.8, focus: [VALVE[0] - 0.24, DU + 1.15, VALVE[2]], fill: { p: [VALVE[0] - 1.2, DU + 2.0, VALVE[2] + 1.0], c: "#d8e0ec", i: 2.5 } }),
      fn(t) { hide(t); const f = ramp(t, burnT - 0.12, burnT + 0.18) * (1 - 0.85 * ramp(t, T.FA3 - 0.55, T.FA3 - 0.12));
        return { wheelA: lerp(0, 55, ramp(t, T.FA2 + 0.2, burnT)), valveFire: f, tint: tintAt(t, RED, 0.2, burnT - 0.1, 99, 0.15), exposure: lerp(1.0, 0.8, f) * XD, sat: lerp(0.95, 0.8, f) }; } },
    // FA3 — what if: the flare relit, its light on the clouds; far off, boats' lights turn toward it (a cool grade)
    { key: "FA3", t0: T.FA3, cam: [[110, 4.5, 150], [106, 4.8, 145]], look: [[0, 19, 0], [0, 19, 0]], fov: 52,
      st: Object.assign({}, EXT, OFF, { flareI: 1, flareS: 1, cloudGlow: 1, moonI: 1.7, hemiI: 0.55, exposure: 1.2 * XD, aperture: 0, rainK: 0.3, sat: 0.72 }),
      fn(t) { hide(t); const on = ramp(t, T.FA3, T.FA3 + 0.7); return { flareS: lerp(0.15, 1, on), flareI: lerp(0.2, 1, on), cloudGlow: on, boatsK: ramp(t, T.FA3 + 0.4, T.FA3 + 1.0), boatT: t - T.FA3, tint: [COOL[0], COOL[1], COOL[2], 0.14] }; } },
    // FB1 — B · LIFEBOAT TO SHORE: the enclosed lifeboat in its davit; FUEL · 24 H on "Fuel"
    { key: "FB1", t0: T.FB1, cam: [[-10.2, DM + 2.3, 7.4], [-10.9, DM + 2.2, 6.4]], look: [[-13.6, DM + 1.9, 3.8], [-13.45, DM + 2.0, 3.95]], fov: 44,
      st: Object.assign({}, DAWN, { aperture: 1.2, focus: [LB[0] + 1.2, LB[1], LB[2] + 1.0], fill: { p: [-11.4, DM + 3.0, 5.6], c: "#d8e0ec", i: 3.0 } }),
      fn(t) { hide(t); return {}; } },
    // FB2 — above the lifeboat, the grey sea beyond; the map card again (140 KM)
    { key: "FB2", t0: T.FB2, cam: [[-10.0, DU + 3.6, 9.8], [-10.3, DU + 3.8, 9.4]], look: [[-16.8, DM + 3.2, -1.0], [-17.0, DM + 3.0, -1.4]], fov: 50,
      st: Object.assign({}, DAWN, { aperture: 0.6, focus: 12 }),
      fn(t) { hide(t); return {}; } },
    // BK2 — black beat: the dark coast, the red eyes along the shore, the lifeboat's tiny light in the black sea between
    { key: "BK2", t0: T.BK2, cam: [[260, 120, -700], [255, 116, -760]], look: [[220, -40, -6000], [220, -40, -6000]], fov: 42, ease: (u) => u,
      st: Object.assign({}, AERIAL, OFF, { moonI: 1.4, exposure: 0.95 * XD, shoreEyesK: 1, shoreEyeS: 4.5, shoreEyeSep: 1.6 }),
      fn(t) { hide(t); return { black: 0.2 + 0.8 * (1 - ramp(t, T.BK2, T.BK2 + 0.3)), lbLightK: ramp(t, T.BK2 + 0.3, T.BK2 + 0.8), lbP: [230, 4, -2900 - (t - T.BK2) * 20], lbLightS: 70 }; } },
    // CARDS — both options side by side (HUD); the rig at dawn from the sea, dimmed
    { key: "CARDS", t0: T.CARDS, cam: [[-72, 40, 37], [-68, 39, 34]], look: [[11, 24, -10], [11, 24, -10]], fov: 46,
      st: Object.assign({}, DAWN, { aperture: 0.4, focus: 80 }),
      fn(t) { hide(t); return { black: 0.42 }; } },
    // FACE — Mira close at the rail, looking at us: determined (open lids, narrowed brows)
    { key: "FACE", t0: T.FACE, cam: [[RAIL[0] - 1.05, DU + 1.63, RAIL[2] + 0.38], [RAIL[0] - 0.92, DU + 1.63, RAIL[2] + 0.33]], look: [[RAIL[0], DU + 1.6, RAIL[2]], [RAIL[0], DU + 1.6, RAIL[2]]], fov: 32,
      st: Object.assign({}, DAWN, { aperture: 3.0, exposure: 0.78 * XD, fill: { p: [RAIL[0] - 1.1, DU + 2.0, RAIL[2] + 0.75], c: "#e2e8f2", i: 2.2 } }),
      fn(t) { const k = ramp(t, T.FACE + 0.2, T.FACE + 0.9); standAt(t, RAIL, -69, { head: [0, lerp(-6, 0, k)], look: [0, 0], expr: "worried", expr2: "determined", ek: k }, true); return { focus: headAt() }; } },
    // Z1 — end card 1 (A OR B? + both cards) over the rig at dawn, darker
    { key: "Z1", t0: T.Z1, cam: [[-68, 39, 34], [-65, 38, 32]], look: [[11, 24, -10], [11, 24, -10]], fov: 46,
      st: Object.assign({}, DAWN, { aperture: 0.4, focus: 80, vig: 0.7 }),
      fn(t) { hide(t); return { black: 0.32 }; } },
    // Z2 — end card 2: near black
    { key: "Z2", t0: T.Z2, cam: [[-65, 38, 32], [-63, 37, 31]], look: [[11, 24, -10], [11, 24, -10]], fov: 46,
      st: Object.assign({}, DAWN, { aperture: 0.4, vig: 0.72 }),
      fn(t) { hide(t); return { black: lerp(0.32, 0.95, ramp(t, T.Z2, T.Z2 + 0.5)) }; } },
  ];
  function WY(dy) { return P.WY0 + dy; }
  for (const s of shots) {
    const fn = s.fn;
    s.fn = function (t, u, e, st) { const Wd = WORLD(t); const o = fn.call(this, t, u, e, st) || {}; return Object.assign(Wd, o); };
  }
  return { shots, reset() {}, base: { sat: 0.95 } };
};
