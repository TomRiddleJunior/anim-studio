/* Sim-flight template — a three-shot demo shot list (the X-59 sample in assets/sample-x59 has all 28 patterns). window.SIM_FILM(K, C, V) -> { shots, render(t) }.
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
    // 11 shocks stay apart — above the clouds, front 3/4 with separated weak cones
    add(line0("l03"), "clouds-shocks", (t) => {
      const t0 = line0("l03"), u = t - t0;
      const p = along(x59, "clouds", [0, 270, -300], [0, 0, 1], 330, t, t0, { bank: 6 });
      xs.forEach((s, i) => { s.visible = true; s.userData.set(shockT(t) + i * 0.27, [0.3, 0.22, 0.25, 0.22][i]); });
      return st("clouds", loc(x59, 42 - u * 11, 12, 66 - u * 6), loc(x59, 0, 0, -4), 42, { hero: x59, shadowAt: p, shadowExt: 60, blur: 0.7 });
    });

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
