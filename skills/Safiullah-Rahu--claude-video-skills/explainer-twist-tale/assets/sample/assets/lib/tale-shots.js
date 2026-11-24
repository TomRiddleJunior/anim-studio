/* "The Man Who Moved Every Clock" — sets and shots for the twist-tale kit.
 * TALE_FILM(K, V) builds every set once and returns the shot list. V.w(line, word, k) = start time of a narration
 * word (vo/data/vo.json via tale-vo.js). Each shot: { t0, set, cam: [from, to], look: [from, to], fov, ease, light, fn(t, u) }
 * — t1 is the next shot's t0; fn poses actors and props for absolute time t (u = 0..1 through the shot).
 */
window.TALE_FILM = function (K, V) {
  const P = (n) => `assets/props/${n}.svg`, C = (n) => `assets/chars/${n}.svg`;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const w = (l, wd, k) => V.w(l, wd, k);
  const setM = (c, M) => { M = ((M % 720) + 720) % 720; c.userData.set(Math.floor(M / 60), M % 60); };

  // =============================================================== chamber (House of Commons, simplified)
  const ch = K.set("chamber", { bg: "#2a1d16", fog: ["#2a1d16", 13, 32], sky: "#ffe6c4", ground: "#3a2618", sun: "#ffe0b0", sunI: 1.35, hemiI: 1.05, sunPos: [4, 11, 7], shadow: 10, ink: "#1a1410" });
  K.box(18, 0.2, 18, "#5a3b26", { y: -0.2, parent: ch });
  K.box(2.6, 0.02, 14, "#3f6b4a", { y: 0, parent: ch });
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const x = s * (2.1 + k * 1.15), y = k * 0.42;
      if (k) K.box(1.15, y, 12, "#4a3020", { x, parent: ch });
      K.box(1.1, 0.45, 12, "#2f7a4f", { x, y, z: -0.5, parent: ch });
      K.box(0.16, 0.55, 12, "#2a6b45", { x: x + s * 0.5, y: y + 0.45, z: -0.5, parent: ch });
    }
  }
  K.box(16, 7, 0.4, "#7b5233", { z: -6.6, parent: ch });
  K.box(0.4, 7, 14, "#6e4a2e", { x: -7.2, parent: ch });
  K.box(0.4, 7, 14, "#6e4a2e", { x: 7.2, parent: ch });
  for (const x of [-4.5, -1.5, 1.5, 4.5]) K.plane(1.3, 1.9, P("win-lit"), { x, y: 4.4, z: -6.38, parent: ch });
  K.box(1.8, 2.8, 1, "#5a3b26", { z: -5.8, parent: ch });
  K.roof(2.2, 0.9, 1.3, "#4a2c1a", { y: 2.8, z: -5.8, parent: ch });
  K.box(1.8, 0.92, 3.4, "#6b4a2e", { z: -0.4, parent: ch });
  K.plane(0.5, 0.64, P("report"), { x: 0.2, y: 0.93, z: -0.2, rx: -90, rz: 8, parent: ch });
  K.plane(0.5, 0.64, P("bill"), { x: -0.35, y: 0.93, z: 0.4, rx: -90, rz: -12, parent: ch });
  for (const x of [-3, 0, 3]) K.sphere(0.28, "#ffe2a0", { x, y: 5.2, z: -1, mat: { basic: true }, noink: true, cast: false, parent: ch });
  const mps = [];
  let n = 0;
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) for (const z of [-4.2, -1.6, 1.4]) {
    const id = `mp${n % 4}`;
    const a = K.actor(`mpsit${n}`, { bored: C(`${id}-bored-sit`), yawn: C(`${id}-yawn-sit`), happy: C(`${id}-happy-sit`), neutral: C(`${id}-neutral-sit`), sleep: C(`${id}-sleep-sit`) },
      { h: 1.25, x: s * (2.1 + k * 1.15), y: k * 0.42 + 0.42, z: z + (n % 3) * 0.25, parent: ch });
    mps.push(a);
    n++;
  }
  const willCh = K.actor("will_ch", { plead: C("willett-plead-plead"), worried: C("willett-worried-think"), sad: C("willett-sad") }, { h: 1.6, x: 0, z: 1.9, parent: ch });
  const mpStand = K.actor("mp_stand", { hold: C("mp1-neutral-hold"), up: C("mp1-happy-arms_up") }, { h: 1.6, x: 0.9, z: 1.6, parent: ch });
  const mpCheer = [0, 2, 3].map((k, i) => K.actor(`mpcheer${i}`, { up: C(`mp${k}-happy-arms_up`), sit: C(`mp${k}-happy-sit`) }, { h: 1.55, x: -2.1 - i * 1.15, y: i * 0.42 + 0.42, z: 3.0, parent: ch }));
  const mpLook = [0, 1, 2, 3].map((k, i) => K.actor(`mplook${i}`, { look: C(`mp${k}-determined-think`) }, { h: 1.55, x: [-1.25, 1.25, -1.15, 1.15][i], z: [-1.6, -1.4, 0.9, 1.1][i], parent: ch }));
  const weed = K.plane(0.7, 0.7, P("tumbleweed"), { y: 0.36, z: 2.6, parent: ch, cast: true });

  // =============================================================== clock wall (close-ups)
  const cw = K.set("clockwall", { bg: "#e9d9b8", sky: "#fff4dc", ground: "#a88e6a", sun: "#fff3dc", sunI: 1.3, hemiI: 1.1, sunPos: [3, 6, 8], shadow: 4 });
  K.box(10, 7, 0.3, "#d9c49a", { z: -0.35, parent: cw });
  for (let k = -4; k <= 4; k++) K.box(0.06, 7, 0.02, "#cdb689", { x: k * 0.55, z: -0.19, parent: cw, cast: false });
  K.box(10, 0.4, 2, "#8a6a4a", { y: 0.6, z: 0.5, parent: cw });
  const bigClock = K.clock(1.15, { y: 2.65, z: -0.05, parent: cw });
  const cals = {};
  for (const c of ["cal-april", "cal-sept", "cal-apr1916"]) cals[c] = K.plane(0.95, 1.08, P(c), { x: 1.95, y: 2.35, z: -0.17, parent: cw });
  K.cyl(0.25, 0.2, 0.45, "#c0623a", { x: -1.9, y: 1.0, z: 0.4, parent: cw });
  K.sphere(0.42, "#4f9a5c", { x: -1.9, y: 1.75, z: 0.4, parent: cw });

  // =============================================================== towers (Germany, Britain)
  function tower(name, o) {
    const g = K.set(name, { bg: o.bg, fog: [o.bg, 16, 44], sky: o.sky, ground: "#8a7a6a", sun: "#fff1d4", sunI: 1.5, hemiI: 1.05, sunPos: [7, 12, 6], shadow: 12 });
    K.box(40, 0.2, 40, o.ground, { y: -0.2, parent: g });
    K.box(2.4, o.h, 2.4, o.stone, { z: -2, parent: g });
    K.box(2.7, 0.3, 2.7, o.trim, { y: o.h - 2.6, z: -2, parent: g });
    K.cone(2.05, 2.6, o.roof, { y: o.h, z: -2, seg: 4, ry: 45, parent: g });
    const clk = K.clock(0.82, { y: o.h - 1.6, z: -0.72, parent: g, rim: o.trim });
    const cols = o.houses;
    [-3.4, -6.6, 3.4, 6.6].forEach((x, i) => {
      const hh = 3 + (i % 2) * 0.8;
      K.box(3, hh, 3, cols[i % cols.length], { x, z: -2.5, parent: g });
      K.roof(3.2, 1.3, 3.2, o.roofs, { x, y: hh, z: -2.5, parent: g });
      K.plane(0.8, 1.15, P("win-day"), { x: x - 0.7, y: hh - 1.2, z: -0.99, parent: g });
      K.plane(0.8, 1.15, P("win-day"), { x: x + 0.7, y: hh - 1.2, z: -0.99, parent: g });
    });
    K.cyl(0.05, 0.06, 5.2, "#e8e4dc", { x: 3.2, z: 1.6, parent: g });
    K.plane(1.5, 1.0, P(o.flag), { x: 3.98, y: 4.6, z: 1.6, parent: g });
    return { g, clk };
  }
  const de = tower("tower_de", { bg: "#bfe0ff", sky: "#ffffff", ground: "#b9a98f", stone: "#c8a878", trim: "#7a5a3a", roof: "#5a3324", roofs: "#7a3b2a", h: 9, houses: ["#e8d9b5", "#d98c5f", "#c9d6a8", "#e3b9a2"], flag: "flag-de" });
  const uk = tower("tower_uk", { bg: "#cfe2f2", sky: "#ffffff", ground: "#a8a39a", stone: "#d9c08a", trim: "#8a7448", roof: "#3b4a5a", roofs: "#4a4f5a", h: 11, houses: ["#b55a3c", "#c9b8a0", "#a85a48", "#d6c4a4"], flag: "flag-uk" });
  const deClerk = K.actor("de_clerk", { point: C("clerk_de-determined-point"), smug: C("clerk_de-smug-point"), watch: C("clerk_de-smug-hold") }, { h: 1.6, x: 1.1, z: 1.4, parent: de.g });
  const deCrowd = [0, 1, 2].map((k, i) => K.actor(`de_w${i}`, { a: C(`worker-${["neutral", "happy", "worried"][i]}-shovel`), b: C("worker-hug") }, { h: 1.6, x: -1.6 - i * 1.0, z: 1.8 + (i % 2) * 0.6, parent: de.g }));
  const ukClerk = K.actor("uk_clerk", { paper: C("clerk_uk-neutral-hold"), shock: C("clerk_uk-shock-hold"), smug: C("clerk_uk-smug-point") }, { h: 1.6, x: -0.35, z: 1.6, parent: uk.g });
  const ukCal = K.plane(0.8, 0.91, P("cal-may1916"), { x: 0.75, y: 1.6, z: 1.3, parent: uk.g });
  K.cyl(0.04, 0.04, 1.2, "#6b4a2e", { x: 0.75, z: 1.28, parent: uk.g });

  // =============================================================== street (dawn / evening)
  const st = K.set("street", { bg: "#ffcf96", fog: ["#ffcf96", 14, 44], sky: "#ffe4c0", ground: "#8a7a6a", sun: "#ffd29a", sunI: 1.7, hemiI: 1.15, sunPos: [-9, 5, 9], shadow: 14 });
  K.box(60, 0.1, 9, "#8d8a86", { y: -0.1, z: 1.5, parent: st });
  K.box(60, 0.16, 2.2, "#c9c2b6", { z: -2.7, parent: st });
  const lampsSt = [];
  for (let i = -6; i <= 6; i++) {
    const x = i * 3.1, c = ["#b55a3c", "#e8d9b5", "#c47a52", "#d9c8a0"][(i + 12) % 4];
    K.box(3, 4.2, 3, c, { x, z: -5.3, parent: st });
    K.roof(3.25, 1.4, 3.25, "#6b3a2a", { x, y: 4.2, z: -5.3, parent: st });
    K.box(0.4, 0.9, 0.4, "#8a4a38", { x: x + 0.8, y: 4.6, z: -5.6, parent: st });
    K.plane(0.85, 1.25, P("win-blinds"), { x: x - 0.7, y: 2.9, z: -3.79, parent: st });
    K.plane(0.85, 1.25, P("win-blinds"), { x: x + 0.7, y: 2.9, z: -3.79, parent: st });
    K.plane(0.7, 1.3, P("door"), { x, y: 0.65, z: -3.79, parent: st });
    if (i % 2 === 0) {
      K.cyl(0.06, 0.08, 2.8, "#2b2b33", { x: x + 1.5, z: -1.8, parent: st });
      lampsSt.push(K.box(0.36, 0.42, 0.36, "#3b3b44", { x: x + 1.5, y: 2.8, z: -1.8, parent: st }));
    }
  }
  // scaffold on Willett's building site (house at x = 0)
  for (const x of [-1.6, 1.6]) K.box(0.08, 4.4, 0.08, "#b88a52", { x, z: -3.5, parent: st });
  for (const y of [1.4, 2.8]) K.box(3.4, 0.08, 0.5, "#b88a52", { y, z: -3.4, parent: st });
  const sunSt = K.sphere(1.7, "#ffd36b", { x: -22, y: 4.5, z: -30, mat: { basic: true }, noink: true, cast: false, parent: st });
  const horse = K.actor("horse", { a: C("willett-horse-0"), b: C("willett-horse-1") }, { h: 2.1, aspect: 480 / 450, x: -8, z: 0.4, parent: st });
  const willSite = K.actor("will_site", { trowel: C("willett-trowel"), happy: C("willett-happy") }, { h: 1.6, x: 0.3, z: -1.6, parent: st });
  const kids = [0, 1, 2].map((k) => K.actor(`kid${k}`, { happy: C(`kid${k}-happy-arms_up`), laugh: C(`kid${k}-laugh-arms_up`) }, { h: 1.15, x: -1.6 + k * 1.4, z: 0.6 + (k % 2) * 0.7, parent: st }));

  // =============================================================== bedroom
  const br = K.set("bedroom", { bg: "#6a4c40", sky: "#ffe9cf", ground: "#6b4a3a", sun: "#fff0c8", sunI: 1.45, hemiI: 1.0, sunPos: [-5, 6, 2], shadow: 6 });
  K.box(9, 0.1, 9, "#a77c55", { y: -0.1, parent: br });
  K.box(9, 5, 0.2, "#b9cfe0", { z: -2.4, parent: br });
  K.box(0.2, 5, 9, "#a9c2d6", { x: -3.4, parent: br });
  K.plane(1.4, 2.0, P("win-blinds"), { x: -1.4, y: 2.7, z: -2.28, parent: br });
  K.box(2.8, 0.5, 3, "#8a5a3a", { z: -0.6, parent: br });
  K.box(2.8, 1.35, 0.2, "#7a4a2e", { z: -2.05, parent: br });
  K.box(2.6, 0.25, 2.8, "#ffffff", { y: 0.5, z: -0.6, parent: br });
  K.box(0.95, 0.22, 0.5, "#f4f0e6", { x: -0.62, y: 0.75, z: -1.72, parent: br });
  K.box(0.95, 0.22, 0.5, "#f4f0e6", { x: 0.62, y: 0.75, z: -1.72, parent: br });
  K.box(2.7, 0.32, 2.1, "#e0573c", { y: 0.62, z: -0.25, parent: br });
  const beam = K.box(0.9, 0.05, 4.2, "#fff1b8", { x: -0.9, y: 2.0, z: -0.5, rx: -28, ry: 12, mat: { basic: true, transparent: true, opacity: 0.32 }, noink: true, cast: false, receive: false, parent: br });
  const sleepers = [K.actor("sl0", { z: C("sleeper0-sleep") }, { h: 0.78, aspect: 400 / 330, x: -0.62, y: 0.78, z: -1.6, parent: br }),
    K.actor("sl1", { z: C("sleeper1-sleep") }, { h: 0.78, aspect: 400 / 330, x: 0.62, y: 0.78, z: -1.6, parent: br })];
  K.box(0.7, 0.7, 0.6, "#8a5a3a", { x: 1.9, z: -1.7, parent: br });
  const alarm = K.clock(0.2, { x: 1.9, y: 0.95, z: -1.62, parent: br, rim: "#c4342a" });

  // =============================================================== study (Willett's desk)
  const sd = K.set("study", { bg: "#3d2a20", sky: "#ffe9c8", ground: "#4a3020", sun: "#ffe2b0", sunI: 1.35, hemiI: 1.0, sunPos: [3, 7, 6], shadow: 6, ink: "#1d1712" });
  K.box(10, 0.1, 10, "#7a5236", { y: -0.1, parent: sd });
  K.box(10, 5.2, 0.2, "#4f7a5c", { z: -2.6, parent: sd });
  K.box(0.2, 5.2, 10, "#46705a", { x: -3.6, parent: sd });
  K.plane(1.3, 1.9, P("win-day"), { x: -2.2, y: 2.7, z: -2.48, parent: sd });
  K.box(2.8, 0.95, 1.3, "#6b4a2e", { z: -1.0, parent: sd });
  const stack = [];
  for (let k = 0; k < 8; k++) stack.push(K.box(0.42, 0.035, 0.58, "#f1e4c3", { x: 0.75, y: 0.95 + k * 0.036, z: -1.0, ry: (k % 3 - 1) * 3, parent: sd }));
  const stackTop = K.plane(0.42, 0.58, P("pamphlet"), { x: 0.75, y: 1.247, z: -1.0, rx: -90, parent: sd });
  K.cyl(0.07, 0.08, 0.12, "#22202b", { x: -0.6, y: 0.95, z: -0.8, parent: sd });
  K.cyl(0.05, 0.08, 0.5, "#c9a35a", { x: -1.1, y: 0.95, z: -1.3, parent: sd });
  K.cone(0.28, 0.3, "#2f5d3a", { x: -1.1, y: 1.4, z: -1.3, parent: sd });
  const studyClock = K.clock(0.42, { x: 1.0, y: 2.9, z: -2.46, parent: sd });
  const scal = {};
  for (const c of ["cal-1907", "cal-1908", "cal-1909", "cal-1910", "cal-1911", "cal-1912", "cal-1913", "cal-1914", "cal-mar1915"]) scal[c] = K.plane(0.82, 0.93, P(c), { x: -0.5, y: 2.75, z: -2.47, parent: sd });
  K.box(1.2, 0.5, 1.1, "#8a3b2e", { x: -2.1, z: -0.2, parent: sd });
  K.box(1.2, 1.1, 0.25, "#8a3b2e", { x: -2.1, y: 0.5, z: -0.7, parent: sd });
  K.box(0.2, 0.35, 1.1, "#7a3328", { x: -2.65, y: 0.5, z: -0.2, parent: sd });
  K.box(0.2, 0.35, 1.1, "#7a3328", { x: -1.55, y: 0.5, z: -0.2, parent: sd });
  const hatOnChair = K.cyl(0.2, 0.2, 0.18, "#2b2b33", { x: -2.1, y: 0.5, z: -0.15, parent: sd });
  const hatBrim = K.cyl(0.32, 0.32, 0.03, "#2b2b33", { x: -2.1, y: 0.5, z: -0.15, parent: sd });
  const coins = [];
  for (let k = 0; k < 7; k++) coins.push(K.cyl(0.11, 0.11, 0.5, "#f2c14e", { x: -0.2 + (k % 4) * 0.24, y: 0.95, z: -0.75 - Math.floor(k / 4) * 0.25, parent: sd }));
  const letters = [];
  for (let k = 0; k < 12; k++) letters.push(K.box(0.36, 0.03, 0.26, "#ffffff", { x: 0.0 + (k % 2) * 0.06, y: 0.95 + k * 0.032, z: -0.65, ry: (k * 23) % 30 - 15, parent: sd }));
  const willSt = K.actor("will_st", { proud: C("willett-proud-hold"), happyhold: C("willett-happy-hold"), up: C("willett-happy-arms_up"), write: C("willett-old-write"), oldsad: C("willett-old-sad") }, { h: 1.6, x: 0.2, z: 0.35, parent: sd });

  // =============================================================== coal yard (Germany 1916)
  const cy = K.set("coalyard", { bg: "#bdbcc6", fog: ["#bdbcc6", 16, 42], sky: "#ecebf2", ground: "#5a5048", sun: "#fff1d8", sunI: 1.35, hemiI: 1.0, sunPos: [6, 10, 5], shadow: 12 });
  K.box(40, 0.2, 40, "#6d6253", { y: -0.2, parent: cy });
  K.box(7, 4, 4, "#9a5a44", { x: -4, z: -8, parent: cy });
  K.roof(7.2, 1.4, 4.2, "#5a3a2e", { x: -4, y: 4, z: -8, parent: cy });
  const smoke = [];
  for (const x of [-6, -2.6]) {
    K.cyl(0.5, 0.65, 8.5, "#8a4a38", { x, z: -9, parent: cy });
    for (let k = 0; k < 4; k++) smoke.push(K.sphere(0.7, "#d9d8de", { x, y: 9 + k * 1.2, z: -9, parent: cy, cast: false }));
  }
  const pile = new K.T.Group();
  pile.position.set(1.6, 0, -2.4);
  cy.add(pile);
  for (let k = 0; k < 70; k++) {
    const a = k * 2.399, r = 2.1 * Math.sqrt((k + 0.5) / 70);
    const y = Math.max(0.1, (1 - r / 2.2) * 2.0) + (k % 3) * 0.05;
    K.ico(0.28 + (k % 4) * 0.05, "#2a2a30", { x: r * Math.cos(a), y, z: r * Math.sin(a), rx: k * 37, ry: k * 53, parent: pile });
  }
  K.cyl(0.05, 0.05, 2.2, "#6b4a2e", { x: 4.2, z: 0.2, parent: cy });
  K.plane(1.4, 0.65, P("sign-coal"), { x: 4.2, y: 2.3, z: 0.25, parent: cy });
  K.cyl(0.05, 0.06, 5, "#e8e4dc", { x: -5, z: 0, parent: cy });
  K.plane(1.4, 0.93, P("flag-de"), { x: -4.27, y: 4.4, z: 0, parent: cy });
  const workers = [0, 1, 2].map((k) => K.actor(`cw${k}`, { a: C(`worker-${["determined", "worried", "neutral"][k]}-shovel`), hug: C("worker-hug") }, { h: 1.6, x: -0.6 + k * 1.3, z: 0.6 + (k % 2) * 0.5, parent: cy }));

  // =============================================================== day chart (the mechanism, schematic)
  const mc = K.set("mech", { bg: "#2f3e63", sky: "#d6e2ff", ground: "#2f3e63", sun: "#fff6e0", sunI: 1.3, hemiI: 1.1, sunPos: [3, 8, 9], shadow: 8, ink: "#141a2c" });
  K.cyl(4.2, 4.4, 0.4, "#e8dcc4", { y: -0.4, parent: mc });
  const CH_W = 3.2, CH_H = CH_W * 1340 / 640, CH_Y = 0.5 + CH_H / 2;
  K.box(CH_W + 0.3, CH_H + 0.3, 0.2, "#7a5236", { y: 0.35, z: -0.12, parent: mc });
  K.plane(CH_W, CH_H, P("daychart"), { y: CH_Y, z: 0.0, parent: mc });
  const hourY = (h) => CH_Y + CH_H / 2 - (150 + h * 46) / 1340 * CH_H;   // chart px -> world y
  const hourX = (px) => -CH_W / 2 + px / 640 * CH_W;
  const BR_H = (16 * 46 + 20) / 1340 * CH_H, BR_W = 190 / 640 * CH_W;
  const bracketP = K.plane(BR_W, BR_H, P("bracket"), { x: hourX(380 + 95), z: 0.04, parent: mc });
  const lampOn = [], lampOff = [];
  [20, 21, 22].forEach((h) => {
    const y = hourY(h + 0.5), x = hourX(575);
    lampOn.push(K.plane(0.34, 0.34, P("lamp-on"), { x, y, z: 0.05, parent: mc }));
    lampOff.push(K.plane(0.34, 0.34, P("lamp-off"), { x, y, z: 0.05, parent: mc }));
  });
  const sunM = K.sphere(0.36, "#ffd36b", { mat: { basic: true }, noink: true, cast: false, parent: mc });
  const placeBracket = (shift) => (bracketP.position.y = (hourY(7 - shift) + hourY(23 - shift)) / 2);

  // =============================================================== living room (Sunday 1 Nov 2026)
  const lv = K.set("living", { bg: "#1d2a4a", sky: "#ffe2b8", ground: "#3a2a24", sun: "#ffd59a", sunI: 1.25, hemiI: 0.95, sunPos: [-3, 6, 5], shadow: 6 });
  K.box(10, 0.1, 10, "#7d6a8a", { y: -0.1, parent: lv });
  K.box(10, 5, 0.2, "#c9b8e0", { z: -2.5, parent: lv });
  K.box(0.2, 5, 10, "#b9a8d0", { x: -3.6, parent: lv });
  K.plane(1.3, 1.9, P("win-night"), { x: 1.6, y: 2.7, z: -2.38, parent: lv });
  K.box(2.6, 0.5, 1.0, "#e0573c", { x: -1.1, z: -1.6, parent: lv });
  K.box(2.6, 0.8, 0.3, "#d04a32", { x: -1.1, y: 0.5, z: -2.05, parent: lv });
  K.box(0.3, 0.45, 1.0, "#d04a32", { x: -2.4, y: 0.5, z: -1.6, parent: lv });
  K.box(0.3, 0.45, 1.0, "#d04a32", { x: 0.2, y: 0.5, z: -1.6, parent: lv });
  K.box(1.2, 0.45, 0.7, "#8a6a4a", { x: -1.0, z: -0.2, parent: lv });
  K.plane(0.18, 0.34, P("phone"), { x: -0.8, y: 0.46, z: -0.2, rx: -90, rz: 20, parent: lv });
  K.cyl(0.05, 0.08, 1.5, "#c9a35a", { x: 0.9, z: -1.8, parent: lv });
  K.cone(0.35, 0.4, "#ffe2a0", { x: 0.9, y: 1.5, z: -1.8, mat: { basic: true }, noink: true, parent: lv });
  const lvClock = K.clock(0.55, { x: -1.1, y: 2.75, z: -2.36, parent: lv });
  K.box(0.95, 0.6, 0.65, "#c99a5b", { x: 1.6, z: -0.3, parent: lv });
  K.plane(0.6, 0.4, P("box-winter"), { x: 1.6, y: 0.32, z: 0.03, parent: lv });
  const yank = K.actor("yank", { neutral: C("yank-neutral"), shock: C("yank-shock"), happy: C("yank-happy"), smug: C("yank-smug-point"), hold: C("yank-happy-hold") }, { h: 1.6, x: -0.2, z: 0.6, parent: lv });

  // =============================================================== shots
  const T = (l, wd, k, d) => w(l, wd, k) - (d == null ? 0.06 : d);
  const pend = (t, a, b) => sm(a, a + 0.18, t) * (1 - sm(b - 0.18, b, t));
  const S = [];
  const add = (o) => S.push(o);

  add({ t0: 0, set: "chamber", fov: 52, cam: [[0, 1.95, 6.0], [0, 1.8, 4.9]], look: [[0, 1.25, 0.8], [0, 1.25, 0.9]], fn(t) {
    willCh.set(t < 1.0 ? "plead" : "worried");
    mps.forEach((a, i) => a.set(i % 3 === 0 ? "yawn" : i % 3 === 1 ? "bored" : "neutral"));
    weed.visible = false;
  } });
  add({ t0: T("l01", "change"), set: "clockwall", fov: 40, cam: [[0.5, 2.7, 3.6], [0.1, 2.65, 2.6]], look: [[0, 2.65, 0], [0, 2.65, 0]], fn(t) {
    setM(bigClock, 610 + (t - 1.8) * 900);
    Object.values(cals).forEach((c) => (c.visible = false));
  } });
  add({ t0: T("l01", "and", 0, 0.1), set: "tower_de", fov: 44, cam: [[3.2, 1.2, 8], [1.6, 2.6, 5.6]], look: [[0, 5.6, -1], [0, 7, -1]], fn(t) {
    const jump = sm(w("l01", "enemy") - 0.1, w("l01", "enemy") + 0.35, t);
    setM(de.clk, 9 * 60 + 10 + jump * 60);
    deClerk.set(t > w("l01", "enemy") ? "smug" : "point");
    deCrowd.forEach((a) => a.set("a"));
  } });
  add({ t0: T("l02", "you", 0, 0.1), set: "street", fov: 44, cam: [[0.9, 1.5, 2.2], [0.5, 1.45, 1.4]], look: [[0.2, 1.25, -1.6], [0.2, 1.3, -1.6]], light: { bg: "#bfe0ff", fog: ["#bfe0ff", 14, 44], sunPos: [6, 10, 6], sun: "#fff3dc" }, fn(t) {
    willSite.mesh.visible = true; willSite.set(t > w("l02", "builder") ? "trowel" : "happy");
    horse.mesh.visible = false; kids.forEach((k) => (k.mesh.visible = false)); sunSt.visible = false;
  } });
  add({ t0: T("l02", "and", 0, 0.1), set: "street", fov: 46, cam: [[-5, 1.6, 6.5], [1.2, 1.7, 6.2]], look: [[-5.5, 1.4, -1.5], [0.6, 1.4, -1.5]], fn(t, u) {
    willSite.mesh.visible = false; sunSt.visible = true; kids.forEach((k) => (k.mesh.visible = false));
    horse.mesh.visible = true;
    horse.mesh.position.x = -7 + u * 7.4;
    horse.set(Math.floor(t / 0.16) % 2 ? "b" : "a");
  } });
  add({ t0: T("l02", "blinds", 0, 0.12), set: "street", fov: 34, cam: [[3.6, 2.9, 0.4], [3.6, 2.9, -1.2]], look: [[3.3, 2.9, -3.8], [3.4, 2.9, -3.8]], fn(t) {
    horse.mesh.visible = true; horse.mesh.position.x = 0.9 + (t - 10.7) * 2.1; horse.set(Math.floor(t / 0.16) % 2 ? "b" : "a");
  } });
  add({ t0: T("l03", "the", 0, 0.1), set: "bedroom", fov: 46, cam: [[2.2, 2.3, 3.6], [1.2, 1.7, 2.2]], look: [[0, 0.8, -1.3], [-0.2, 0.9, -1.5]], fn(t) {
    beam.visible = true;
    alarm.userData.set(6, 40 + (t - 12) * 6);
  } });
  add({ t0: T("l04", "so", 0, 0.1), set: "study", fov: 46, cam: [[0.9, 1.7, 4.2], [0.6, 1.6, 3.3]], look: [[0.35, 1.25, -0.5], [0.35, 1.25, -0.5]], fn(t) {
    willSt.mesh.visible = true; willSt.mesh.position.set(0.0, 0, 0.1); willSt.set("proud");
    stack.forEach((b, k) => (b.visible = k < 2 + Math.floor(sm(14.9, 16.3, t) * 6)));
    stackTop.position.y = 0.97 + (2 + Math.floor(sm(14.9, 16.3, t) * 6)) * 0.036;
    coins.forEach((c) => (c.visible = false)); letters.forEach((l) => (l.visible = false));
    Object.entries(scal).forEach(([k, p]) => (p.visible = k === "cal-1907"));
    hatOnChair.visible = hatBrim.visible = false;
  } });
  add({ t0: T("l04", "waste", 0, 0.2), set: "study", fov: 30, cam: [[0.9, 2.15, -0.55], [0.8, 1.85, -0.75]], look: [[0.75, 1.0, -1.0], [0.75, 1.0, -1.0]], fn() {
    stack.forEach((b) => (b.visible = true)); stackTop.position.y = 0.97 + 8 * 0.036;
  } });
  add({ t0: T("l05", "every"), set: "clockwall", fov: 44, cam: [[1.6, 2.6, 6.4], [1.2, 2.55, 5.3]], look: [[1.0, 2.5, 0], [1.0, 2.5, 0]], fn(t) {
    Object.entries(cals).forEach(([k, c]) => (c.visible = k === "cal-april"));
    let m = 0;
    ["push", "clock", "twenty", "minutes"].forEach((wd) => { m += 20 * sm(w("l05", wd) - 0.02, w("l05", wd) + 0.12, t); });
    setM(bigClock, 120 + m);
  } });
  add({ t0: T("l05", "then"), set: "clockwall", fov: 44, cam: [[0.2, 2.55, 6.2], [0.6, 2.55, 5.1]], look: [[1.0, 2.5, 0], [1.0, 2.5, 0]], fn(t) {
    Object.entries(cals).forEach(([k, c]) => (c.visible = k === "cal-sept"));
    setM(bigClock, 120 + 80 * (1 - sm(w("l05", "wind"), w("l05", "september") + 0.2, t)));
  } });
  add({ t0: T("l06", "he"), set: "study", fov: 48, cam: [[0.0, 1.65, 3.6], [0.0, 1.5, 2.8]], look: [[0.0, 1.2, -0.6], [0.0, 1.2, -0.6]], fn(t) {
    willSt.mesh.visible = true; willSt.mesh.position.set(-0.5, 0, -0.1); willSt.set(t > w("l06", "million") ? "up" : "happyhold");
    const g = sm(w("l06", "save"), w("l06", "pounds") + 0.3, t);
    coins.forEach((c, k) => { c.visible = true; c.scale.y = Math.max(0.02, g * (0.5 + (k % 3) * 0.35)); });
  } });
  add({ t0: T("l07", "an"), set: "chamber", fov: 48, cam: [[1.7, 1.7, 6.2], [1.2, 1.6, 5.2]], look: [[0.7, 1.2, 1.4], [0.7, 1.25, 1.4]], fn(t) {
    willCh.mesh.visible = false; mpStand.mesh.visible = true; mpStand.set("hold");
    mpCheer.forEach((a) => (a.mesh.visible = false)); mpLook.forEach((a) => (a.mesh.visible = false));
    mps.forEach((a, i) => a.set(i % 2 ? "neutral" : "bored"));
  } });
  add({ t0: T("l07", "winston"), set: "chamber", fov: 50, cam: [[-1.6, 2.4, 8.6], [-3.0, 2.2, 8.0]], look: [[-3.3, 1.3, 1.6], [-3.4, 1.3, 1.2]], fn(t) {
    mpCheer.forEach((a, i) => { a.mesh.visible = true; a.set(t > w("l07", "backed") - 0.1 + i * 0.08 ? "up" : "sit"); });
    mps.forEach((a) => a.set("happy"));
  } });
  add({ t0: T("l07", "and", 0, 0.1), set: "chamber", fov: 56, cam: [[0.3, 4.3, 3.8], [0.2, 3.8, 3.1]], look: [[0, 0.9, -0.2], [0, 0.9, -0.2]], fn() {
    mpStand.mesh.visible = false; mpCheer.forEach((a) => (a.mesh.visible = false)); willCh.mesh.visible = false;
    mpLook.forEach((a) => { a.mesh.visible = true; a.set("look"); });
  } });
  add({ t0: T("l08", "and", 0, 0.08), set: "chamber", fov: 50, cam: [[0, 2.5, 8.4], [0, 2.4, 7.6]], look: [[0, 1.0, -2], [0, 1.0, -2]], light: { sunI: 1.0, hemiI: 0.85 }, fn(t, u) {
    mpLook.forEach((a) => (a.mesh.visible = false)); willCh.mesh.visible = false; mpStand.mesh.visible = false;
    mps.forEach((a) => a.set("sleep"));
    weed.visible = true; weed.position.set(-1.4 + u * 2.8, 0.36, 3.2); weed.rotation.z = -u * 7;
  } });
  add({ t0: T("l09", "year"), set: "study", fov: 46, cam: [[0.3, 1.9, 3.3], [0.2, 1.85, 2.6]], look: [[-0.2, 1.85, -1.8], [-0.25, 1.95, -1.9]], fn(t) {
    willSt.mesh.visible = true; willSt.mesh.position.set(0.15, 0, -2.0); willSt.set("write");
    coins.forEach((c) => (c.visible = false)); stack.forEach((b, k) => (b.visible = k < 3)); stackTop.position.y = 0.97 + 3 * 0.036;
    const yi = Math.min(7, 1 + Math.floor((t - 31.3) / 0.3));
    Object.entries(scal).forEach(([k, p]) => (p.visible = k === `cal-${1907 + yi}`));
    letters.forEach((l, k) => (l.visible = k < yi * 1.6));
  } });
  add({ t0: T("l09", "the", 0, 0.1), set: "clockwall", fov: 40, cam: [[0, 2.65, 3.8], [0, 2.65, 2.8]], look: [[0, 2.65, 0], [0, 2.65, 0]], light: { sunI: 1.1 }, fn() {
    Object.values(cals).forEach((c) => (c.visible = false));
    bigClock.userData.set(10, 10);
  } });
  add({ t0: T("l10", "in"), set: "study", fov: 46, cam: [[0.25, 1.9, 3.1], [0.05, 1.85, 2.4]], look: [[-0.3, 1.95, -1.8], [-0.35, 2.0, -1.9]], light: { sunI: 1.1, hemiI: 0.9 }, fn(t) {
    willSt.mesh.visible = true; willSt.mesh.position.set(0.2, 0, -2.0); willSt.set("oldsad");
    Object.entries(scal).forEach(([k, p]) => (p.visible = k === "cal-mar1915"));
  } });
  add({ t0: T("l10", "died", 0, 0.12), set: "study", fov: 40, cam: [[-0.6, 1.5, 2.6], [-1.2, 1.3, 1.9]], look: [[-2.1, 0.7, -0.3], [-2.1, 0.7, -0.3]], light: { sunI: 0.8, hemiI: 0.75, sun: "#ffc98a" }, fn(t) {
    willSt.mesh.visible = false; hatOnChair.visible = hatBrim.visible = true;
    studyClock.userData.set(4, (t - 36) * 40);
  } });
  add({ t0: T("l11", "just"), set: "tower_de", fov: 48, cam: [[-4.5, 2.6, 11], [-3.0, 2.3, 9.0]], look: [[0, 3.5, -2], [0, 3.8, -2]], fn() {
    de.clk.userData.set(9, 10); deClerk.mesh.visible = false; deCrowd.forEach((a) => (a.mesh.visible = false));
  } });
  add({ t0: T("l11", "at", 0, 0.1), set: "coalyard", fov: 48, cam: [[5.5, 2.4, 7.5], [3.6, 2.0, 6.0]], look: [[0.8, 1.2, -2], [1.0, 1.2, -2]], fn(t, u) {
    workers.forEach((a) => { a.mesh.visible = true; a.set("a"); });
    pile.scale.setScalar(1 - 0.35 * sm(40.3, 42.2, t));
    smoke.forEach((s, k) => (s.position.y = 9 + ((k % 4) * 1.2 + (t - 40) * 0.8) % 4.8));
  } });
  add({ t0: T("l11", "coal", 0, 0.25), set: "coalyard", fov: 34, cam: [[1.4, 1.75, 3.2], [0.9, 1.6, 2.6]], look: [[0.7, 1.2, 1.1], [0.7, 1.25, 1.1]], fn() {
    workers[1].set("hug"); workers[0].mesh.visible = workers[2].mesh.visible = false;
  } });
  add({ t0: T("l12", "so"), set: "clockwall", fov: 36, cam: [[2.4, 2.3, 2.9], [2.05, 2.35, 1.9]], look: [[1.95, 2.35, 0], [1.95, 2.35, 0]], fn() {
    Object.entries(cals).forEach(([k, c]) => (c.visible = k === "cal-apr1916"));
    bigClock.userData.set(10, 10);
  } });
  add({ t0: T("l12", "it", 0, 0.08), set: "tower_de", fov: 44, cam: [[2.6, 1.5, 6.4], [1.4, 2.4, 5.0]], look: [[0, 6.0, -1], [0, 7.2, -1]], fn(t) {
    const j = sm(w("l12", "forward") - 0.1, w("l12", "hour") + 0.2, t);
    setM(de.clk, 120 + j * 60);
    deClerk.mesh.visible = true; deClerk.set("watch");
    deCrowd.forEach((a) => { a.mesh.visible = true; a.set("a"); });
  } });
  add({ t0: T("l13", "three"), set: "tower_uk", fov: 54, cam: [[0.35, 1.6, 6.4], [0.25, 1.55, 5.5]], look: [[0.2, 1.3, 1.3], [0.2, 1.3, 1.3]], fn(t) {
    ukClerk.set("paper");
  } });
  add({ t0: T("l13", "britain", 0, 0.1), set: "tower_uk", fov: 42, cam: [[-1.6, 3.2, 6.4], [-0.9, 4.2, 5.2]], look: [[0, 8.4, -1], [0, 9.0, -1]], fn(t) {
    const j = sm(w("l13", "copied") - 0.05, w("l13", "enemy") + 0.25, t);
    setM(uk.clk, 120 + j * 60);
    ukClerk.set(t < w("l13", "britain") ? "paper" : t < w("l13", "copied") ? "shock" : "smug");
  } });
  add({ t0: T("l14", "you", 0, 0.1), set: "mech", fov: 50, cam: [[-2.2, 3.0, 9.6], [1.6, 3.2, 9.0]], look: [[0, 2.9, 0], [0, 3.0, 0]], fn(t) {
    const a = sm(50.4, 52.9, t);
    sunM.position.set(-2.6 + a * 5.2, 6.6 + Math.sin(a * Math.PI) * 0.9, 0.6);
  } });
  add({ t0: T("l15", "moving"), set: "mech", fov: 46, cam: [[1.4, 2.4, 6.2], [0.9, 2.0, 5.2]], look: [[0.35, 2.0, 0], [0.4, 1.7, 0]], fn(t) {
    const sh = sm(w("l15", "moves"), w("l15", "already") + 0.2, t);
    placeBracket(sh);
    const off = sh > 0.9;
    lampOn.forEach((l, k) => (l.visible = !(k === 2 && off))); lampOff.forEach((l, k) => (l.visible = k === 2 && off));
    sunM.position.set(2.0, 6.8, 0.6);
  } });
  add({ t0: T("l15", "so", 0, 0.1), set: "street", fov: 46, cam: [[2.2, 1.6, 6.8], [1.0, 1.5, 5.6]], look: [[0, 1.1, -0.5], [0, 1.1, -0.5]], light: { bg: "#ffd59a", fog: ["#ffd59a", 14, 44], sunPos: [14, 5, 4], sun: "#ffd8a0" }, fn(t) {
    horse.mesh.visible = false; willSite.mesh.visible = false; sunSt.visible = false;
    kids.forEach((k, i) => { k.mesh.visible = true; k.set(Math.floor(t * 3 + i) % 2 ? "laugh" : "happy"); k.mesh.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.25; });
  } });
  add({ t0: T("l16", "and", 0, 0.1), set: "living", fov: 48, cam: [[0.6, 1.9, 5.2], [0.2, 2.0, 4.2]], look: [[-0.3, 2.0, -2], [-0.5, 2.2, -2.2]], fn(t) {
    const back = sm(w("l16", "back") - 0.05, w("l16", "back") + 0.45, t);
    setM(lvClock, t < w("l16", "clocks") ? 119 : 120 - 60 * back);
    yank.mesh.position.set(0.7, 0, -0.7); yank.set(t < w("l16", "set") ? "neutral" : t < w("l16", "back") ? "smug" : "shock");
  } });
  add({ t0: T("l16", "they're", 0, 0.08), set: "living", fov: 44, cam: [[-1.2, 1.6, 4.4], [0.4, 1.5, 3.9]], look: [[0.6, 0.8, -0.3], [1.2, 0.7, -0.3]], fn(t) {
    setM(lvClock, 60);
    const k = sm(w("l16", "putting"), w("l16", "winter") + 0.3, t);
    yank.mesh.position.set(-0.2 + k * 1.15, 0, 0.6 - k * 0.2);
    yank.set(t < w("l16", "winter") + 0.25 ? "hold" : "happy");
  } });
  S.sort((a, b) => a.t0 - b.t0);
  // every shot starts from its set's defaults, so any frame renders the same on its own (seek-safe)
  const show = (list, v) => list.forEach((a) => ((a.mesh || a).visible = v));
  const reset = {
    chamber() { willCh.mesh.visible = true; willCh.set("plead"); show([mpStand, ...mpCheer, ...mpLook], false); weed.visible = false; mps.forEach((a) => a.set("neutral")); },
    clockwall() { Object.values(cals).forEach((c) => (c.visible = false)); bigClock.userData.set(10, 10); },
    tower_de() { deClerk.mesh.visible = true; show(deCrowd, true); de.clk.userData.set(9, 10); },
    tower_uk() { ukClerk.mesh.visible = true; uk.clk.userData.set(2, 0); },
    street() { show([willSite, horse, ...kids], false); kids.forEach((k) => (k.mesh.position.y = 0)); sunSt.visible = true; },
    bedroom() { beam.visible = true; },
    study() { willSt.mesh.visible = true; willSt.mesh.position.set(0.2, 0, 0.35); show(stack, true); stackTop.position.y = 0.97 + 8 * 0.036;
      show(coins, false); show(letters, false); Object.values(scal).forEach((p) => (p.visible = false)); hatOnChair.visible = hatBrim.visible = false; studyClock.userData.set(10, 10); },
    coalyard() { show(workers, true); workers.forEach((a) => a.set("a")); pile.scale.setScalar(1); },
    mech() { placeBracket(0); lampOn.forEach((l) => (l.visible = true)); lampOff.forEach((l) => (l.visible = false)); },
    living() { yank.mesh.position.set(-0.2, 0, 0.6); yank.set("neutral"); setM(lvClock, 60); },
  };
  return { shots: S, reset };
};
