/* Template shot list for the survival-scenario kit: hook (A1) · black beat with red eyes (B) · meet the character in the
 * cab (C) · cliffhanger aerial with the eyes gathered (Q) · end cards (R, S). Shot boundaries come from FILM_VO.T
 * (tools/build.py, from "shot" keys in vo/script.json; run the voice step and build.py first). The full 23-shot sample film
 * is not included in this release. */
window.FILM_CREATE = { forest: { near: 1500, mid: 3300, far: 4200, ring: 70 }, cars: 0, eyes: 76 };
window.FILM = function (K, V, X) {
  const { Tw, hz } = X;
  const T = window.FILM_VO.T;
  const F = Tw.TOP + 0.1;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ramp = (t, a, b) => { const u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const tintAt = (t, col, a, t0, t1) => [col[0], col[1], col[2], a * ramp(t, t0, t0 + 0.3) * (1 - ramp(t, t1, t1 + 0.4))];
  const GREEN = [0.25, 0.95, 0.5];
  const NIGHT = { moonI: 2.4, hemiI: 0.55, envI: 0.6, lampI: 9, lanI: 5, exposure: 1.0, aperture: 2, fogK: 1, eyesK: 0, wind: 0.012 };
  const INT = { exposure: 1.0, lampI: 3.4, lanI: 1.4, moonI: 1.6, hemiI: 0.25, envI: 0.45 };
  const AERIAL = Object.assign({}, NIGHT, { exposure: 0.9, moonI: 1.4, aperture: 0, vig: 0.62, eyesScale: 3.0, starK: 0.5, lampI: 14, lanI: 8, yardI: 0 });
  const lucky = V.w("l01", "consider");
  function reset() { Tw.low.position.y = 0; Tw.trap.rotation.z = 0; Tw.disp.material.color.setRGB(0.3, 0.3, 0.3); }
  const shots = [
    { t0: T.A1, cam: [[-17, 20, 50], [-13.5, 20.5, 40]], look: [[0, 22.5, 0], [0, 22.5, 0]], fov: 46,
      st: Object.assign({}, NIGHT, { aperture: 1.0, rays: 0.55, raySky: true, rayLen: 0.55, focus: 60 }),
      fn(t) { hz.set({ pos: [1.45, F, -1.25], ry: 160, pose: "stand", t }); return { tint: tintAt(t, GREEN, 0.3, lucky - 0.05, 99) }; } },
    { t0: T.B, cam: [[0, 168, 150], [0, 140, 126]], look: [[0, 8, 0], [0, 8, 0]], fov: 24, ease: (u) => u, st: AERIAL,
      fn(t) { hz.set({ pos: [1.45, F, -1.25], ry: 160, pose: "stand", t }); return { eyesK: lerp(0.08, 0.85, ramp(t, T.B + 0.3, T.C - 0.5)), eyesGather: 0, black: 0.22 + 0.78 * (1 - ramp(t, T.B, T.B + 0.28)) }; } },
    { t0: T.C, cam: [[1.78, F + 1.52, 1.06], [1.6, F + 1.5, 0.96]], look: [[-0.95, F + 1.52, 0.45], [-0.95, F + 1.54, 0.45]], fov: 40,
      st: Object.assign({}, NIGHT, INT, { aperture: 10, focus: [-0.95, F + 1.7, 0.45] }),
      fn(t) { hz.set({ pos: [-0.95, F, 0.45], ry: 80, pose: "stand", head: [-4, -2], t }); return {}; } },
    { t0: T.Q, cam: [[0, 150, 128], [0, 126, 108]], look: [[0, 8, 0], [0, 8, 0]], fov: 24, ease: (u) => u, st: AERIAL,
      fn(t) { hz.set({ pos: [0.15, F, -1.18], ry: 180, pose: "sit", t }); return { eyesK: 1, eyesGather: 0.6 + 0.4 * ramp(t, T.Q, T.R), black: 0.2 + 0.8 * (1 - ramp(t, T.Q, T.Q + 0.28)) }; } },
    { t0: T.R, cam: [[0, 126, 108], [0, 118, 101]], look: [[0, 8, 0], [0, 8, 0]], fov: 24, ease: (u) => u, st: AERIAL,
      fn(t) { hz.set({ pos: [0.15, F, -1.18], ry: 180, pose: "sit", t }); return { eyesK: 1, eyesGather: 1, black: 0.42 }; } },
    { t0: T.S, cam: [[0, 118, 101], [0, 114, 98]], look: [[0, 8, 0], [0, 8, 0]], fov: 24, ease: (u) => u, st: AERIAL,
      fn(t) { hz.set({ pos: [0.15, F, -1.18], ry: 180, pose: "sit", t }); return { eyesK: 1, eyesGather: 1, black: lerp(0.42, 0.95, ramp(t, T.S, T.S + 0.5)) }; } },
  ];
  return { shots, reset, base: { sat: 0.92 } };
};
