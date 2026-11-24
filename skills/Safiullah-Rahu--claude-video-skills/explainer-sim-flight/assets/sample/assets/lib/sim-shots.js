/* X-59 sample — the shot list. window.SIM_FILM(K, C, V) -> { shots, render(t) }.
 * Each shot: { t0, name, fn(t) -> state } where state = { env, cam, look, fov, roll, hero, ... } (see sim-kit render()).
 * render(t) evaluates the active shot at t - 1/60 (previous camera + hero matrix, for motion blur) and at t, then draws.
 * Cuts are hard cuts on (or ~0.28 s before) the narration line that starts the beat, as in the source format.
 */
(function () {
  "use strict";
  window.SIM_FILM = function (K, C, V) {
    const T = K.T, D2R = Math.PI / 180, lerp = K.lerp, clamp = K.clamp, sm = K.smooth;
    const E = K.envs;
    const ease = (u) => -(Math.cos(Math.PI * clamp(u, 0, 1)) - 1) / 2;
    const H = (env, x, z) => K.height(env, x, z);

    // ---- cast
    const x59 = C.x59(); K.actors.add(x59);
    const gear = x59.userData.gear;
    const f15 = C.fighter({ twin: true, len: 19.4, paint: "#5a626a", belly: "#7a828a" }); K.actors.add(f15);
    const f5 = C.fighter({ twin: false, len: 14.4, paint: "#d7dadc", belly: "#c4c8cb" }); K.actors.add(f5);
    const prop = C.turboprop(); K.actors.add(prop);
    // shock shells: X-59 = several weak, separated cones; fighters = one strong merged cone
    const xs = [
      C.shock(x59, { at: [0, -0.1, 17.0], len: 80, strength: 0.22, bands: 3 }),
      C.shock(x59, { at: [0, 0.8, 5.0], len: 80, strength: 0.16, bands: 3.4 }),
      C.shock(x59, { at: [0, -0.2, -3.0], len: 80, strength: 0.18, bands: 2.6 }),
      C.shock(x59, { at: [0, 1.6, -12.5], len: 80, strength: 0.16, bands: 3.1 }),
    ];
    const fsh = [C.shock(f15, { at: [0, 0, 10], len: 120, strength: 0.75, bands: 2.2, col: "#f1f5ff" }), C.shock(f15, { at: [0, 0, 6.5], len: 120, strength: 0.55, bands: 2.0 })];
    const f5sh = [C.shock(f5, { at: [0, 0, 7.5], mach: 2.0, len: 20, strength: 0.3, bands: 2.5 }), C.shock(f5, { at: [0, 0, 1.5], mach: 2.0, len: 20, strength: 0.22, bands: 2.8 })];
    const rings = [0, 1, 2, 3].map(() => C.ring(K.actors, { col: "#ffe6bf", width: 0.05, i: 2.4 }));
    const cast = [x59, f15, f5, prop, ...rings];
    function hideAll() {
      cast.forEach((o) => (o.visible = false));
      xs.concat(fsh, f5sh).forEach((s) => (s.visible = false));
      gear.visible = false;
      f15.userData.ab(0, 0); f5.userData.ab(0, 0); f15.userData.gear.visible = false; f5.userData.gear.visible = false;
    }

    // ---- helpers
    // place craft along a straight path: p0 + dir * speed * (t - t0), with altitude above terrain optional
    function along(obj, env, p0, dir, speed, t, t0, o) {
      o = o || {};
      const L = Math.hypot(dir[0], dir[1], dir[2]), d = [dir[0] / L, dir[1] / L, dir[2] / L];
      const s = speed * (t - t0);
      const p = [p0[0] + d[0] * s, p0[1] + d[1] * s, p0[2] + d[2] * s];
      if (o.agl != null) p[1] = H(env, p[0], p[2]) * (o.follow != null ? o.follow : 0.0) + o.agl;
      const bank = typeof o.bank === "function" ? o.bank(t) : (o.bank || 0);
      const pitch = typeof o.pitch === "function" ? o.pitch(t) : (o.pitch || 0);
      C.fly(obj, p, d, bank, pitch);
      obj.visible = true;
      return p;
    }
    const loc = (obj, x, y, z) => C.local(obj, x, y, z);
    const st = (env, cam, look, fov, extra) => Object.assign({ env, cam, look, fov }, extra || {});
    const shockT = (t) => t * 1.6;
    const w = V.w, line0 = (id) => V.l(id) - 0.28;

    // ---- shots (t0 from the narration). Every cut changes environment, angle or light so it reads as a new scene.
    const S = [];
    const add = (t0, name, fn) => S.push({ t0, name, fn });
    const A = () => E.desert.spec.AIR;

    // 1 hook — desert chase, rear-left above, whole jet on a diagonal, ground streaking
    function desertChase(t, t0) {
      const p = along(x59, "desert", [-40, 0, -1700], [0.15, 0, 1], 195, t, t0, { agl: 16, bank: -14 + 3 * Math.sin(t * 0.7), pitch: 1.5 });
      return st("desert", loc(x59, -19, 9.5, -38), loc(x59, 1, -3, 3), 50, { hero: x59, shadowAt: p, shadowExt: 45, blur: 1.0, near: 0.3 });
    }
    add(0, "desert-chase", (t) => desertChase(t, 0));
    // 2 reveal — 3/4 front-left over the forest, treetops streaking; note + info card
    add(line0("l02"), "hills-reveal", (t) => {
      const t0 = line0("l02"), u = t - t0;
      const x = 760 - 160 * u, z = 300 - 9.1 * u;
      const y = Math.max(H("hills", x, z), H("hills", x, z + 40)) + 46;
      C.fly(x59, [x, y, z], [-1, 0.0, -0.057], 2, 0); x59.visible = true;
      const c = loc(x59, 88, 12, 44 - u * 2.5);
      c[1] = Math.max(H("hills", c[0], c[2]) + 22, c[1]);
      return st("hills", c, loc(x59, 0, -4, -1), 36, { hero: x59, shadowAt: [x, y, z], shadowExt: 60, blur: 1.0 });
    });
    // 3 comparison — airliner over forested hills, camera on a grassy slope
    add(line0("l03"), "hills-airliner", (t) => {
      const t0 = line0("l03"), u = t - t0;
      const x = 3930 - 62 * u, z = 2640 + 10 * u, y = 84;
      C.fly(prop, [x, y, z], [-1, 0, 0.15], 4, 0); prop.visible = true;
      prop.userData.spin(t);
      const cx = 3800, cz = 2300, cy = H("hills", cx, cz) + 10;
      return st("hills", [cx, cy, cz], [x + 10, y - 14, z], 30, { hero: prop, shadowAt: [x, y, z], shadowExt: 60, blur: 0.5 });
    });
    // 4 comparison — fighter on afterburner down the runway, low rear-left, heat shimmer, hangars and tower behind
    add(line0("l04"), "runway-fighter", (t) => {
      const t0 = line0("l04"), a = A(), u = t - t0;
      const z = a.z - 700 + 42 * u + 7 * u * u;
      const rot = sm(1.4, 3.0, u) * 9;
      const gearH = f15.userData.gear.visible ? 0 : 0;
      const y = 2.05 + 2.0 + sm(2.0, 3.8, u) * 5 * (u - 2.0);
      C.fly(f15, [a.x - 3, y, z], [0, 0, 1], 0, rot); f15.visible = true;
      f15.userData.gear.visible = u < 3.2;
      f15.userData.ab(1, t);
      const n = f15.userData.nozzles.map((q) => C.local(f15, q[0], q[1], q[2] - 2));
      const cz = z - 38 - 2.6 * u * u;
      return st("desert", [a.x - 11, 3.2, cz], [a.x - 3, y + 1.6, z + 1], 46, { hero: f15, shadowAt: [a.x, 2, z], shadowExt: 32, blur: 0.9, near: 0.2,
        heat: n.map((p) => ({ p, r: 3.2, k: 0.007 })) });
    });
    // 5 "This one wants both." — passing over the meadow edge, camera looking up from the grass
    add(w("l05", "this") - 0.45, "pines-pass", (t) => {
      const t0 = w("l05", "this") - 0.45;
      const p = along(x59, "pines", [-250, 0, 250], [1, 0.0, -0.12], 110, t, t0, { bank: 14 });
      const y = 72; C.fly(x59, [p[0], y, p[2]], [1, 0.03, -0.12], 14, 3);
      const cy = H("pines", -40, 170) + 2.0;
      return st("pines", [-40, cy, 170], [p[0], y + 2, p[2]], 46, { hero: x59, shadowAt: [p[0], y, p[2]], shadowExt: 50, blur: 0.7 });
    });
    // 6 1973 — dawn: low in the grass, backlit pines with ground fog, the jet crossing in front of the treeline
    add(line0("l06"), "pines-mist", (t) => {
      const t0 = line0("l06"), u = t - t0;
      const p = along(x59, "pines", [122, 0, 262], [-1, 0, 0.05], 28, t, t0, { bank: 2 });
      const y = H("pines", p[0], p[2]) * 0.3 + 58; C.fly(x59, [p[0], y, p[2]], [-1, 0, 0.05], 2, 0);
      const cx = 30 - 1.2 * u, cz = 150;
      return st("pines", [cx, H("pines", cx, cz) + 1.6, cz], [cx + 56, 40, cz + 108], 56, { hero: x59, shadowAt: [p[0], y, p[2]], shadowExt: 70, blur: 0.5, near: 0.1 });
    });
    // 7 ... banned — chase over the pine canopy, sun low ahead
    add(w("l06", "banned") - 0.1, "pines-tops", (t) => {
      const t0 = w("l06", "banned") - 0.1;
      const p = along(x59, "pines", [-300, 0, 600], [1, 0, 0.25], 195, t, t0, { bank: -8 });
      const y = H("pines", p[0], p[2]) + 40; C.fly(x59, [p[0], y, p[2]], [1, 0, 0.25], -8, 0);
      return st("pines", loc(x59, 16, 14, -44), loc(x59, 0, -5, 8), 46, { hero: x59, shadowAt: [p[0], y, p[2]], shadowExt: 60, blur: 1.0 });
    });
    // 8 "The secret is its shape." — planform from above over the green canopy
    add(line0("l07"), "canopy-shape", (t) => {
      const t0 = line0("l07"), u = t - t0;
      const p = along(x59, "hills", [200, 0, -400], [0.3, 0, 1], 150, t, t0, {});
      const y = H("hills", p[0], p[2]) + 120; C.fly(x59, [p[0], y, p[2]], [0.3, 0, 1], -22 - u * 6, 0);
      return st("hills", loc(x59, 34, 64, -44 + u * 3), loc(x59, 0, -6, 4), 42, { hero: x59, shadowAt: [p[0], y, p[2]], shadowExt: 160, blur: 0.8 });
    });
    // 9 a conventional jet: nose + wing shocks merge into one strong cone — over the desert, chase side-rear
    add(line0("l08"), "desert-merge", (t) => {
      const t0 = line0("l08"), u = t - t0;
      const p = along(f15, "desert", [-500, 0, -900], [0.2, 0, 1], 240, t, t0, { bank: 4 });
      const y = 140; C.fly(f15, [p[0], y, p[2]], [0.2, 0, 1], 4, 0);
      f15.userData.ab(0.35, t);
      fsh.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.1, (i ? 0.32 : 0.55) * sm(0.0, 0.6, u)); });
      return st("desert", loc(f15, -36 + u * 2, 14, -64 + u * 4), loc(f15, 0, -1, 4), 40, { hero: f15, shadowAt: [p[0], y, p[2]], shadowExt: 60, blur: 0.8 });
    });
    // 9b ... into one big boom — green canopy from high: the jet crossing, rings sweeping the forest
    add(w("l08", "merge") - 0.2, "canopy-boom", (t) => {
      const t0 = w("l08", "merge") - 0.2, u = t - t0;
      const p = along(f15, "hills", [-400, 0, 900], [1, 0, -0.05], 140, t, t0, {});
      const g = H("hills", p[0], p[2]);
      const y = g + 260; C.fly(f15, [p[0], y, p[2]], [1, 0, -0.05], 0, 0);
      f15.userData.ab(0.35, t);
      fsh.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.1, i ? 0.2 : 0.34); });
      rings.forEach((r, i) => {
        const k = ((u * 0.9 + i * 0.25) % 1);
        r.position.set(p[0] - 160 - i * 40, g + 22, p[2]); r.visible = true;
        r.userData.set(40 + k * 360, Math.sin(k * Math.PI) * 0.55);
      });
      return st("hills", [p[0] - 46, g + 318, p[2] - 132], [p[0] - 6, g + 238, p[2]], 46, { hero: f15, shadowAt: [p[0], g, p[2]], shadowExt: 200, blur: 0.6 });
    });
    // 10 the long nose — 3/4 front-right against the cliff
    add(line0("l09"), "rocky-nose", (t) => {
      const t0 = line0("l09"), u = t - t0;
      const p = along(x59, "rocky", [-450, 0, -1000], [0.02, 0, 1], 240, t, t0, { bank: 4 });
      const y = 130; C.fly(x59, [p[0], y, p[2]], [0.02, 0, 1], 4, 0);
      return st("rocky", loc(x59, -82 + u * 3, 8, 58 - u * 4), loc(x59, 0, 1, 2), 34, { hero: x59, shadowAt: [p[0], y, p[2]], shadowExt: 60, blur: 0.9 });
    });
    // 11 shocks stay apart — above the clouds, front 3/4 with separated weak cones
    add(line0("l10"), "clouds-shocks", (t) => {
      const t0 = line0("l10"), u = t - t0;
      const p = along(x59, "clouds", [0, 270, -300], [0, 0, 1], 330, t, t0, { bank: 6 });
      xs.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.27, [0.3, 0.22, 0.25, 0.22][i]); });
      return st("clouds", loc(x59, 42 - u * 11, 12, 66 - u * 6), loc(x59, 0, 0, -4), 42, { hero: x59, shadowAt: p, shadowExt: 60, blur: 0.7 });
    });
    // 12 engine on top — above-behind, deep-blue sky
    add(line0("l11"), "clouds-engine", (t) => {
      const t0 = line0("l11"), u = t - t0;
      const p = along(x59, "stratos", [80, 640, -100], [0.1, 0, 1], 320, t, t0, { bank: -4 });
      return st("stratos", loc(x59, -9 + u * 5, 14 - u * 1.5, -46 + u * 3), loc(x59, 0, 3, 8), 42, { roll: -5 * u, hero: x59, shadowAt: p, shadowExt: 40, blur: 0.5, far: 120000 });
    });
    // 13 soft thump — from above-behind, rings settling onto the cloud tops below the jet
    add(w("l11", "away") - 0.1, "clouds-thump", (t) => {
      const t0 = w("l11", "away") - 0.1, u = t - t0;
      const p = along(x59, "clouds", [-200, 480, 0], [1, 0, 0.1], 330, t, t0, { bank: 2 });
      xs.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.27, 0.12); });
      rings.forEach((r, i) => {
        const k = ((u * 0.45 + i * 0.25) % 1);
        r.position.set(p[0] - 200, 150, p[2]); r.visible = true;
        r.userData.set(60 + k * 650, (1 - k) * 0.55);
      });
      return st("clouds", loc(x59, 40 - u * 14, 45, -95 + u * 4), loc(x59, 0, -70, 60), 50, { hero: x59, shadowAt: p, shadowExt: 120, blur: 0.6 });
    });
    // 14 no forward window — close on the nose and canopy against the deep-blue sky (detail shot)
    add(line0("l13"), "high-cockpit", (t) => {
      const t0 = line0("l13"), u = t - t0;
      const p = along(x59, "stratos", [0, 620, 0], [0, 0, 1], 320, t, t0, { bank: 3 });
      return st("stratos", loc(x59, Math.sin(1.57 - u * 0.32) * 112, 15 - u * 3, Math.cos(1.57 - u * 0.32) * 112), loc(x59, 0, 0, 1), 34, { roll: 3 * u, hero: x59, shadowAt: p, shadowExt: 30, blur: 0.6, far: 120000 });
    });
    // 15 4K screen — chase over the river, jet in the lower half under the XVS picture-in-picture (from l14)
    add(w("l13", "with") - 0.1, "river-xvs", (t) => {
      const t0 = w("l13", "with") - 0.1, u = t - t0, ui = t - line0("l14");
      const z = -900 + 260 * u, rx = E.river.spec.riverX(z, K.NZ), rx2 = E.river.spec.riverX(z + 30, K.NZ);
      C.fly(x59, [rx, 62, z], [rx2 - rx, 0, 30], -6 + 4 * Math.sin(u), 0); x59.visible = true;
      const ic = loc(x59, 0, 0.2, 17.6), il = loc(x59, 0, -6, 220), insetOn = ui > 0.06;
      return st("river", loc(x59, 14, 16, -56), loc(x59, 0, 10, 14), 46, { hero: x59, shadowAt: [rx, 95, z], shadowExt: 40, blur: 0.9,
        inset: insetOn && { cam: ic, look: il, fov: 58, rect: [48 / 1080, 285 / 1920, 1032 / 1080, 840 / 1920], alpha: sm(0.06, 0.21, ui) } });
    });
    // 16 Mach 1.4 — fast 3/4 front pass over the valley
    add(line0("l15"), "river-fast", (t) => {
      const t0 = line0("l15"), u = t - t0;
      const z = -2200 + 310 * u, rx = E.river.spec.riverX(z, K.NZ), rx2 = E.river.spec.riverX(z + 40, K.NZ);
      C.fly(x59, [rx + 30, 110, z], [rx2 - rx, 0, 40], -5, 0); x59.visible = true;
      return st("river", loc(x59, 52, 11, 60 - u * 6), loc(x59, 0, -1, -3), 44, { hero: x59, shadowAt: [rx, 150, z], shadowExt: 50, blur: 1.0 });
    });
    // 17 about 925 mph — low rear chase down the river, water and forest streaking
    add(w("l15", "about") - 0.1, "river-chase", (t) => {
      const t0 = w("l15", "about") - 0.1, u = t - t0;
      const z = 300 + 360 * u, rx = E.river.spec.riverX(z, K.NZ), rx2 = E.river.spec.riverX(z + 40, K.NZ);
      C.fly(x59, [rx, 32, z], [rx2 - rx, 0, 40], -4 + 6 * Math.sin(u * 1.3), 0); x59.visible = true;
      return st("river", loc(x59, -20, 13, -44), loc(x59, 0, -4, 12), 50, { hero: x59, shadowAt: [rx, 42, z], shadowExt: 50, blur: 1.0 });
    });
    // 18 towns — illustration at dusk; the jet crossing above the rooftops with a soft pressure ring under it
    add(line0("l16"), "dusk-town", (t) => {
      const t0 = line0("l16"), u = t - t0;
      const p = along(x59, "dusk", [-230, 105, 80], [1, 0, -0.1], 90, t, t0, { bank: 0 });
      const k = (u * 0.35) % 1;
      rings[0].position.set(p[0] - 40, 100 - k * 85, p[2]); rings[0].visible = true; rings[0].userData.set(50 + k * 120, 0.5 * (1 - k));
      return st("dusk", [6 + u * 6, 10 + u * 3, -230 + u * 14], [p[0] * 0.95, 72, 88], 50, { hero: x59, shadowAt: [0, 0, 0], shadowExt: 220, blur: 0.4 });
    });
    // 19 regulators — microphones in a field, rings arriving, LEDs pulse
    add(w("l17", "noise") - 0.25, "dusk-mics", (t) => {
      const t0 = w("l17", "noise") - 0.25, u = t - t0;
      x59.visible = false;
      const leds = K.build("dusk").group.userData.leds || [];
      leds.forEach((l, i) => { const ph = (u * 1.2 - i * 0.08) % 1; l.scale.setScalar(ph < 0.15 ? 1.8 : 0.8); });
      rings.forEach((r, i) => { const k = ((u * 0.6 + i * 0.25) % 1); r.position.set(-30, H("dusk", -30, 592) + 0.4, 592); r.visible = true; r.userData.set(4 + k * 70, 0.7 * (1 - k)); });
      const gy = H("dusk", 0, 590);
      return st("dusk", [-14 + u * 2.2, gy + 1.9, 583], [1, gy + 2.4, 591], 40, { shadowAt: [0, gy, 592], shadowExt: 30, blur: 0.3, near: 0.1 });
    });
    // 20 the hard part — over snowy mountains, from above-behind
    add(line0("l18"), "snow-cross", (t) => {
      const t0 = line0("l18"), u = t - t0;
      const p = along(x59, "snow", [-500, 1950, -800], [0.4, 0, 1], 380, t, t0, { bank: -12 });
      return st("snow", loc(x59, 46, 34, -86), loc(x59, 0, -6, 12), 34, { hero: x59, shadowAt: p, shadowExt: 60, blur: 0.6 });
    });
    // 21 F-5E recreation (2003) — low over the desert, slow orbit, softer cones
    add(line0("l19"), "desert-f5", (t) => {
      const t0 = line0("l19"), u = t - t0;
      const p = along(f5, "desert", [1000, 0, 400], [-1, 0, 0.3], 170, t, t0, { agl: 26, bank: 8 });
      f5sh.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.2, i ? 0.06 : 0.09); });
      return st("desert", loc(f5, 13 + u * 1.5, 4, 34 - u * 2.2), loc(f5, 0, -1, -1), 40, { hero: f5, shadowAt: p, shadowExt: 40, blur: 0.7 });
    });
    // 22 first flight, Oct 28 2025 — take-off with the gear down, whole jet from the runway side
    add(line0("l20"), "runway-x59", (t) => {
      const t0 = line0("l20"), a = A(), u = t - t0;
      const z = a.z + 120 + 55 * u + 3 * u * u, rot = sm(0.5, 1.8, u) * 8, y = 2 + 2.05 + sm(1.2, 4.5, u) * 3.2 * (u - 1.2);
      C.fly(x59, [a.x + 2, y, z], [0, 0, 1], 0, rot); x59.visible = true; gear.visible = true;
      return st("desert", [a.x - 82, 5.5 + u * 0.8, z - 50], [a.x + 2, y + 2.5, z + 1], 38, { hero: x59, shadowAt: [a.x, 2, z], shadowExt: 40, blur: 0.8, near: 0.3 });
    });
    // 23 first supersonic flight, June 5 2026 — with the F-15 chase plane
    add(line0("l21"), "high-chase", (t) => {
      const t0 = line0("l21"), u = t - t0;
      const p = along(x59, "stratos", [0, 700, 0], [0, 0, 1], 330, t, t0, { bank: 2 });
      C.fly(f15, loc(x59, -20, 3, -26), [0, 0, 1], 3, 0); f15.visible = true;
      return st("stratos", loc(x59, -18 + u * 3, 5 + u * 3, -150 + u * 10), loc(x59, -12, 1, -15), 32, { roll: 4 * Math.sin(u * 0.9), hero: x59, shadowAt: p, shadowExt: 60, blur: 0.4, far: 120000 });
    });
    // 24 the chase plane's booms drowned it out — the F-15 with its strong cone, the X-59 beyond
    add(line0("l22"), "high-f15", (t) => {
      const t0 = line0("l22"), u = t - t0;
      const p = along(f15, "high", [0, 13180, 300], [0, 0, 1], 330, t, t0, { bank: 4 });
      C.fly(x59, loc(f15, 30, 10, 26), [0, 0, 1], 2, 0); x59.visible = true;
      fsh.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.1, i ? 0.5 : 0.85); });
      xs.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.27, 0.1); });
      return st("high", loc(f15, -24 + u * 5, -7 - u * 1.0, -56 + u * 4), loc(f15, 3, 3, 8), 42, { roll: 2 * u, hero: f15, shadowAt: p, shadowExt: 60, blur: 0.4, far: 120000 });
    });
    // 25 Mach 1.4 at 55,000 ft — alone, slow orbit
    add(line0("l23"), "high-cruise", (t) => {
      const t0 = line0("l23"), u = t - t0;
      const p = along(x59, "stratos", [0, 760, -2000], [0.05, 0, 1], 410, t, t0, { bank: -3 });
      const a = -0.9 + u * 0.4;
      return st("stratos", loc(x59, Math.sin(a) * 52, 46 + u * 2, Math.cos(a) * 52), loc(x59, 0, -6, 0), 40, { hero: x59, shadowAt: p, shadowExt: 60, blur: 0.4, far: 120000 });
    });
    // 26 ending — microphones ("Next, NASA measures the thump"), then the opening chase (the loop)
    add(line0("l24"), "dusk-mics-end", (t) => {
      const t0 = line0("l24"), u = t - t0;
      x59.visible = false;
      const leds = K.build("dusk").group.userData.leds || [];
      leds.forEach((l, i) => { const ph = (u * 1.2 - i * 0.08) % 1; l.scale.setScalar(ph < 0.15 ? 1.8 : 0.8); });
      rings.forEach((r, i) => { const k = ((u * 0.6 + i * 0.25) % 1); r.position.set(-30, H("dusk", -30, 592) + 0.4, 592); r.visible = true; r.userData.set(4 + k * 70, 0.7 * (1 - k)); });
      const gy = H("dusk", 0, 590);
      return st("dusk", [22 - u * 4, gy + 1.6, 584], [-6, gy + 2.6, 594], 40, { shadowAt: [0, gy, 592], shadowExt: 30, blur: 0.3, near: 0.1 });
    });
    add(w("l24", "then") - 0.15, "desert-chase-end", (t) => desertChase(t, w("l24", "then") - 0.15 - 3.4));

    function stateAt(i, t) { hideAll(); return S[i].fn(t); }
    const tmpPrev = new T.Matrix4();
    function render(t) {
      let i = 0;
      while (i < S.length - 1 && t >= S[i + 1].t0) i++;
      const dt = 1 / 60;
      const p = stateAt(i, Math.max(S[i].t0, t - dt));
      const prevHero = p.hero ? (p.hero.updateMatrixWorld(true), tmpPrev.copy(p.hero.matrixWorld)) : null;
      const prev = { cam: p.cam, look: p.look, fov: p.fov, roll: p.roll, near: p.near, far: p.far, hero: prevHero ? tmpPrev.clone() : null };
      const s = stateAt(i, t);
      if (t - S[i].t0 < dt * 0.5) s.blur = 0; // first frame after a cut has no history
      s.prev = prev;
      s.frame = Math.round(t * 30);
      K.render(s);
      return S[i].name;
    }
    return { shots: S, render, cast: { x59, f15, f5, prop }, h: { along, loc, st, H, sm, x59, f15, f5, prop, xs, fsh, f5sh, rings, E, C, K, gear, desertChase, line0, w, shockT, hideAll } };
  };
})();
