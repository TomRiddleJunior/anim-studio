/* Character sheet for the kit: one frame per face (ECU) and per pose (full body), in a neutral studio lit with the
 * kit's lights (key spot with soft shadow, cool rim, warm practical, haze). Use it as FILM in any project that loads
 * rh3d-core.js + rh3d-mannequin.js, snapshot at SHEET_TIMES (window.SHEET_TIMES after load), then tile the stills.
 * Shot k runs from k * 0.25 s to (k + 1) * 0.25 s. Faces first (ivory, then the black "glow" twin), then poses.
 */
window.FILM_CREATE = { look: { bloom: 0.12, sat: 0.95, vig: 0.3, grain: 0.02, ca: 0.0 } };
window.FILM = function (K, V) {
  const T = K.T;
  // studio: matte floor, curved backdrop, softbox key, cool rim, warm practical
  K.M(new T.PlaneGeometry(30, 30), K.mat("#6d6c69", { rough: 0.85 }), { rx: -90, cast: false, layer: K.LAYER.FLOOR });
  const cyc = new T.CylinderGeometry(6, 6, 8, 48, 1, true, Math.PI * 0.75, Math.PI * 0.5);
  K.M(cyc, K.mat("#5b5a57", { rough: 0.9, side: T.BackSide }), { y: 4, z: 3.5, cast: false });
  const key = K.light.spot({ pos: [1.6, 3.0, 2.4], at: [0, 1.2, 0], color: "#fff4e6", I: 40, angle: 32, pen: 0.85, range: 14, cast: 1024, radius: 5, vol: 0.5 });
  const rim = K.light.spot({ pos: [-1.8, 2.6, -1.8], at: [0, 1.4, 0], color: "#b8d0ff", I: 26, angle: 30, pen: 0.8, range: 12, vol: 0.4 });
  const prac = K.light.point({ pos: [-1.2, 1.1, 1.0], color: "#ffbf7a", I: 1.2, range: 5, vol: 0.4 });
  K.light.hemi({ sky: "#8a8f96", ground: "#2a2826", I: 0.35 });
  const hero = RH3D.mannequin(K, { name: "hero" });
  const twin = RH3D.mannequin(K, { name: "twin", skin: "black", face: "glow", eyeGlow: 7 });
  K.env.bake("studio", [0, 1.4, 1.5]);
  const FACES = Object.keys(RH3D.FACES).filter((f) => f !== "glow");
  const POSES = Object.keys(RH3D.POSES);
  const items = FACES.map((f) => ({ kind: "face", name: f })).concat([{ kind: "glow", name: "glow (twin)" }]).concat(POSES.map((p) => ({ kind: "pose", name: p })));
  const D = 0.25;
  window.SHEET_TIMES = items.map((_, i) => +(i * D + D / 2).toFixed(3));
  window.SHEET_ITEMS = items.map((x) => x.kind + ":" + x.name);
  const shots = items.map((it, i) => {
    const face = it.kind !== "pose";
    const lie = it.name === "lie" || it.name === "liePhone";
    return {
      t0: i * D, hand: 0, fov: face ? 24 : 34, aperture: face ? 10 : 4,
      cam: face ? [[0.0, 1.72, 1.05], [0.0, 1.72, 1.05]] : (lie ? [[0.0, 2.6, 2.2], [0.0, 2.6, 2.2]] : [[0.25, 1.05, 4.3], [0.25, 1.05, 4.3]]),
      look: face ? [[0, 1.71, 0], [0, 1.71, 0]] : (lie ? [[0, 0.4, 0], [0, 0.4, 0]] : [[0, 0.95, 0], [0, 0.95, 0]]),
      focus: face ? [0, 1.72, 0.12] : [0, 1.0, 0],
      fn: (t) => {
        hero.root.visible = it.kind !== "glow"; twin.root.visible = it.kind === "glow";
        if (it.kind === "face") hero.set({ pos: [0, 0, 0], pose: "stand", face: it.name });
        if (it.kind === "glow") twin.set({ pos: [0, 0, 0], pose: "stand" });
        if (it.kind === "pose") hero.set({ pos: [0, lie ? 0.12 : 0, lie ? 0.9 : 0], rx: lie ? -90 : 0, pose: it.name, face: "neutral", phone: /phone/i.test(it.name) });
        return { env: "studio", envI: 0.9, fog: { dens: 0.012, lightGain: 1 }, refl: 0 };
      },
    };
  });
  return { shots, reset() {} };
};
