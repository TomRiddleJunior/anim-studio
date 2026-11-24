/* rewind-film.js — the shot list of "Rewind" (PS1 what-if). window.FILM(K, W, V) -> { frame(t) }
   Every shot: { t0, sets, light, fn(tt, u, t) -> render state (cam, look, fov, ...) } ; tt = time in shot, u = 0..1.
   Story actions are functions of a story clock, so a rewind is just that clock running backward (with rew > 0). */
window.FILM = function (K, W, V) {
  const T = K.T, C = W.cast;
  const clamp = K.clamp, lerp = K.lerp, sm = K.smooth;
  const eio = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const v3 = (v) => [v.x, v.y, v.z];
  const w = (id, word, k) => V.w(id, word, k);
  const S = (id) => V.L(id).start, E = (id) => V.L(id).end;
  const APT = 300, OFF = -300;
  // camera in front of a rig's face: d metres along its facing, side metres to its right, up metres
  const faceCam = (rig, d, side, up, lk) => {
    const hp = v3(rig.headPos()); const ry = rig.root.rotation.y + (lk || 0);
    const f = [Math.sin(ry), 0, Math.cos(ry)], r = [Math.cos(ry), 0, -Math.sin(ry)];
    return { cam: [hp[0] + f[0] * d + r[0] * side, hp[1] + (up || 0), hp[2] + f[2] * d + r[2] * side], look: [hp[0], hp[1] - 0.03, hp[2]] };
  };

  // ---------- light presets ----------
  const LIGHT = {
    day: { sun: { dir: [-0.45, -1, 0.35], col: "#fff1dc", k: 0.95 }, amb: { sky: "#c3cbd8", gnd: "#958a7c" }, fog: { col: "#cfd4da", near: 45, far: 260 }, bloom: 0.5, haze: 0.7 },
    gold: { sun: { dir: [-0.85, -0.42, 0.3], col: "#ffcf9a", k: 1.05 }, amb: { sky: "#b8b0c8", gnd: "#8a7464" }, fog: { col: "#e7c3a8", near: 40, far: 240 }, bloom: 0.65, haze: 0.8, tint: [1.04, 0.98, 0.94] },
    dusk: { sun: { dir: [-0.9, -0.2, 0.25], col: "#ffa070", k: 0.75 }, amb: { sky: "#86809e", gnd: "#5a4a50" }, fog: { col: "#8a7a92", near: 30, far: 200 }, bloom: 0.7, haze: 0.5, tint: [1.0, 0.95, 1.02] },
    office: { sun: { dir: [0.2, -0.8, 0.5], col: "#f4f6f8", k: 0.55 }, amb: { sky: "#e2e6ea", gnd: "#a8acb0" }, fog: { col: "#dfe3e6", near: 14, far: 40 }, bloom: 0.45, haze: 0.6, bg: "#dfe3e6" },
    bed: { sun: { dir: [0.5, -0.6, -0.6], col: "#ffe2b8", k: 0.8 }, amb: { sky: "#d8d0c6", gnd: "#94806e" }, fog: { col: "#d8ccbc", near: 8, far: 30 }, bloom: 0.6, haze: 0.8, bg: "#d8ccbc" },
    aptDay: { sun: { dir: [-0.2, -0.5, 0.85], col: "#fff0d8", k: 0.8 }, amb: { sky: "#d8d2c8", gnd: "#8c7c6c" }, fog: { col: "#d6cdc0", near: 10, far: 34 }, bloom: 0.55, haze: 0.7, bg: "#d6cdc0" },
    aptEve: { sun: { dir: [-0.2, -0.5, 0.85], col: "#ffb070", k: 0.45 }, amb: { sky: "#9298ae", gnd: "#6a5c56" }, fog: { col: "#262c3e", near: 10, far: 34 }, bloom: 0.75, haze: 0.35, bg: "#262c3e", expo: 1.22 },
    aptNight: { sun: { dir: [-0.2, -0.5, 0.85], col: "#8aa0d0", k: 0.3 }, amb: { sky: "#6c7694", gnd: "#463f48" }, fog: { col: "#1a2030", near: 9, far: 30 }, bloom: 0.75, haze: 0.25, bg: "#1a2030", expo: 1.22 },
    resto: { sun: { dir: [0, -1, 0], col: "#ffb070", k: 0.15 }, amb: { sky: "#7a5a4c", gnd: "#3a2a24" }, fog: { col: "#2a1c18", near: 6, far: 18 }, bloom: 0.85, haze: 0.35, bg: "#2a1c18" },
    cafe: { sun: { dir: [0.3, -0.8, 0.5], col: "#fff0d8", k: 0.6 }, amb: { sky: "#e0d0b8", gnd: "#9a8670" }, fog: { col: "#d8c8b0", near: 8, far: 26 }, bloom: 0.6, haze: 0.7, bg: "#d8c8b0" },
  };

  // ---------- ground + walking helpers ----------
  const stepY = (z) => {
    if (z <= -14) return 1.6;
    if (z >= -10.8) return 0.16;
    const i = Math.floor((-10.8 - z) / 0.4);
    return 0.2 * (i + 1);
  };
  const phaseOf = (dist) => dist / 0.69 * Math.PI;

  // the trip on the library steps; a = story seconds (a = 0 at the top step), clean = the second take
  function tripAct(a, clean) {
    const v = 1.05, z0 = -14.6, aT = 1.4;
    if (clean || a < aT) {
      const z = z0 + v * a;
      const y = stepY(z);
      const st = { pos: [0.55, y, z], ry: 0, walk: { phase: phaseOf(z + 30), amt: 1 }, expr: clean && a > aT + 0.2 ? "smile" : "neutral", blink: a };
      if (clean) { const b = Math.max(0, 1 - Math.abs(a - aT) / 0.3); st.add = { hipL: [-0.55 * b, 0, 0], knL: [0.9 * b, 0, 0] }; st.pos[1] += 0.06 * b; }
      return st;
    }
    const u = sm((a - aT) / 0.6);
    const zT = z0 + v * aT;
    const z = zT + 1.5 * u;
    const y = lerp(stepY(zT), stepY(z) - 0.62, u);
    return { pos: [0.55, y, z], ry: 0.12 * u, pose: "relaxed", pose2: "fall", k: u, expr: u < 0.15 ? "surprised" : "worried", walk: { phase: phaseOf(zT + 30), amt: 1 - u } };
  }

  // plaza extras: [index, x, z, ry, mode]
  const plaza = [[0, -3.5, -9.0, 0.4, "walk"], [1, 5.0, -8.6, -2.6, "walk"], [2, 2.6, -9.2, 3.0, "phone"], [3, -6.0, -12.6, 0.2, "sit"], [5, 7.8, -16.5, -1.2, "stand"], [6, -2.4, -17.5, 0.8, "stand"], [7, 9.5, -12.0, -0.3, "sit"], [9, -9.0, -8.2, 1.6, "walk"]];
  function plazaExtras(t, lookAt, react) {
    for (const [i, x, z, ry, mode] of plaza) {
      const r = C.extras[i];
      let st = { pos: [x, stepY(z), z], ry, blink: t + i, breathe: t + i };
      if (mode === "walk") { const d = (t * 1.1) % 20; const dir = [Math.sin(ry), Math.cos(ry)]; const px = x + dir[0] * (d - 6), pz = z + dir[1] * (d - 6) * 0.15; st.pos = [px, stepY(pz), pz]; st.walk = { phase: phaseOf(d), amt: 1 }; }
      if (mode === "sit") { st.pose = "sit"; st.pos = [x, stepY(z + 0.4) - 0.47 + 0.95 - 0.95, z]; }
      if (mode === "phone") st.pose = "phone";
      if (react && lookAt) { // turn toward the fallen hero
        const dx = lookAt[0] - st.pos[0], dz = lookAt[2] - st.pos[2];
        const want = Math.atan2(dx, dz); st.walk = st.walk ? { phase: st.walk.phase, amt: st.walk.amt * (1 - react) } : null;
        let d = want - ry; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        st.ry = ry + d * react * 0.85; st.expr = react > 0.5 ? "surprised" : "neutral";
        if (mode === "phone") { st.pose = "phone"; }
      }
      r.set(st);
    }
  }

  // ---------- shots ----------
  const sh = [];
  const shot = (t0, o) => { o.t0 = t0; sh.push(o); return o; };
  const RW = (t, a, b, inn, out) => { // rewind envelope inside [a, b]
    if (t < a || t > b) return 0;
    return Math.min(1, (t - a) / (inn || 0.08), (b - t) / (out || 0.12));
  };

  // S1 title wide: the library steps from across the street
  const aOf = (t) => t - 1.95; // trip story clock (trip at ~3.35 s)
  shot(0, { sets: ["city"], light: "day", fn(tt, u, t) {
    C.you.set(tripAct(aOf(t), false)); plazaExtras(t);
    return { cam: L3([5.6, 2.3, -1.0], [4.8, 2.2, -2.6], eio(u)), look: L3([0.2, 2.6, -14], [0.3, 2.4, -14], u), fov: 52 };
  } });
  // S2a the trip, side view
  shot(S("h2"), { sets: ["city"], light: "day", fn(tt, u, t) {
    C.you.set(tripAct(aOf(t), false)); plazaExtras(t);
    return { cam: L3([5.6, 2.3, -11.2], [5.3, 2.2, -11.0], u), look: L3([0.5, 1.4, -12.8], [0.5, 0.9, -12.0], eio(u)), fov: 50 };
  } });
  // S2b everyone turns
  const tFell = w("h2", "front");
  shot(tFell - 0.1, { sets: ["city"], light: "day", fn(tt, u, t) {
    const st = tripAct(aOf(t), false); C.you.set(st);
    plazaExtras(t, st.pos, sm((t - tFell) / 0.5));
    return { cam: L3([-4.6, 1.0, -6.4], [-4.2, 1.05, -6.9], u), look: [0.2, 0.9, -11.6], fov: 46 };
  } });
  // S3 rewind (same side view): the story clock runs back from the fall to the top
  const rw1a = S("h3") - 0.05, rw1b = S("h4") - 0.05;
  shot(rw1a, { sets: ["city"], light: "day", fn(tt, u, t) {
    const a = lerp(aOf(rw1a), 0.55, eio(u));
    C.you.set(tripAct(a, false)); plazaExtras(rw1a - (t - rw1a) * 2.0);
    return { cam: [5.4, 2.25, -11.1], look: [0.5, 1.2, -12.5], fov: 50, rew: RW(t, rw1a, rw1b, 0.06, 0.16) };
  } });
  // S4 play: the clean take, from the bottom of the steps
  shot(rw1b, { sets: ["city"], light: "day", fn(tt, u, t) {
    const a = 0.55 + (t - rw1b) * 1.05; C.you.set(tripAct(a, true)); plazaExtras(t - 2.4);
    return { cam: L3([1.4, 1.0, -7.6], [1.2, 1.05, -8.2], u), look: L3([0.55, 1.9, -13.2], [0.55, 1.4, -11.0], eio(u)), fov: 50 };
  } });
  // S5 a passer-by never looked up
  shot(S("h5") - 0.05, { sets: ["city"], light: "day", fn(tt, u, t) {
    const r = C.extras[2]; r.set({ pos: [2.2, 0.16, -8.6], ry: 2.6, pose: "phone", expr: "blank", blink: t + 0.7 });
    C.you.set(tripAct(0.55 + (t - rw1b) * 1.05, true)); plazaExtras(t - 2.4);
    return Object.assign(faceCam(r, 0.95, 0.3, 0.06), { fov: 46, expo: 1.22 });
  } });
  // S6 alarm (bedroom), HUD comes on
  shot(S("a1") - 0.12, { sets: ["apt"], light: "bed", fn(tt, u, t) {
    W.clock.rotation.z = Math.sin(t * 70) * 0.09; W.clock.position.y = 0.7 + Math.abs(Math.sin(t * 35)) * 0.02;
    C.you.set({ pos: [APT - 5.5, -0.28, -4.45], pose: "sleep", expr: "closed" });
    return { cam: L3([APT - 4.6, 1.15, -4.1], [APT - 4.6, 1.1, -4.3], u), look: [APT - 4.3, 0.7, -5.2], fov: 50, pts: [{ p: [APT - 3.2, 1.6, -5.0], c: "#ffd8a8", k: 0.5, r: 5 }] };
  } });
  // S7 rewind on the bed (top view): the slap undoes itself
  const rw2a = S("a2") - 0.05, rw2b = S("a3") - 0.1;
  shot(rw2a, { sets: ["apt"], light: "bed", fn(tt, u, t) {
    const slap = 1 - eio(u); W.clock.rotation.z = Math.sin(t * 70) * 0.09 * (1 - slap * 0.8); W.clock.position.y = 0.7;
    C.you.set({ pos: [APT - 5.5, -0.28, -4.45], pose: "sleep", add: { shR: [-1.2 * slap, 0, -0.9 * slap], elR: [0.8 * slap, 0, 0] }, expr: "closed" });
    return { cam: [APT - 3.4, 2.3, -3.6], look: [APT - 5.0, 0.6, -4.8], fov: 54, rew: RW(t, rw2a, rw2b, 0.06, 0.14) };
  } });
  // S8 face on the pillow, sixty takes
  shot(rw2b, { sets: ["apt"], light: "bed", fn(tt, u, t) {
    W.clock.rotation.z = 0; W.clock.position.y = 0.7;
    C.you.set({ pos: [APT - 5.5, -0.28, -4.45], pose: "sleep", expr: (t % 0.62) < 0.08 ? "closed" : "smile", add: { neck: [0, 0, 0] } });
    C.you.setExpr((t % 0.62) < 0.08 ? "closed" : (u > 0.15 ? "laugh" : "closed"));
    C.you.setExpr("closed");
    const hp = v3(C.you.headPos());
    const pulse = t > w("a4", "Sixty") - 0.2 ? Math.max(0, Math.sin(t * 11)) * 0.55 : 0;
    return { cam: L3(add3(hp, [0.12, 0.62, 0.42]), add3(hp, [0.1, 0.5, 0.34]), u), look: add3(hp, [0, 0, 0.02]), fov: 46, rew: pulse };
  } });
  // S9 meeting: the joke dies
  const coworkers = [[0, -5.2, -1.15, 0], [3, -3.8, -1.15, 0], [5, -2.4, -1.15, 0], [6, -4.6, 1.15, Math.PI], [9, -3.0, 1.15, Math.PI]];
  function meeting(t, laugh) {
    for (const [i, x, z, ry] of coworkers) {
      const lk = Math.atan2(-6.7 - x, 0 - z) - ry;
      const st = { pos: [OFF + x, 0, z], ry, pose: "sit", look: [lk * 0.8, laugh ? -0.15 : 0], expr: laugh ? "laugh" : "blank", blink: t + i };
      if (laugh) { st.pose2 = "laugh"; st.k = 0.7; st.add = { spine: [-0.06 * Math.sin(t * 14 + i), 0, 0] }; }
      C.extras[i].set(st);
    }
  }
  shot(S("j1") - 0.1, { sets: ["office"], light: "office", fn(tt, u, t) {
    meeting(t, false);
    C.you.set({ pos: [OFF - 6.7, 0, 0], ry: Math.PI / 2, pose: "present", talk: t < E("j1") - 0.3 ? t : null, expr: u > 0.6 ? "worried" : "smile", blink: t });
    return { cam: L3([OFF - 0.4, 2.05, 0.4], [OFF - 0.9, 2.0, 0.35], u), look: [OFF - 6.2, 1.25, -0.1], fov: 48 };
  } });
  // S10 rewind. new joke
  const rw3a = S("j2") - 0.05, rw3b = w("j2", "New") - 0.1;
  shot(rw3a, { sets: ["office"], light: "office", fn(tt, u, t) {
    meeting(t, false);
    const take = Math.floor((t - rw3a) * 4.5);
    C.you.set({ pos: [OFF - 6.7, 0, 0], ry: Math.PI / 2, pose: take % 2 ? "shrug" : "present", talk: t, blink: t });
    return { cam: [OFF - 5.0, 1.62, 0.95], look: [OFF - 6.7, 1.45, -0.05], fov: 44, rew: Math.max(RW(t, rw3a, rw3b, 0.06, 0.1), t > rw3b ? 0.45 * Math.max(0, Math.sin((t - rw3b) * 9)) : 0) };
  } });
  // S11 take nine: the room laughs
  shot(S("j3") - 0.1, { sets: ["office"], light: "office", fn(tt, u, t) {
    meeting(t, t > w("j3", "whole") - 0.2);
    C.you.set({ pos: [OFF - 6.7, 0, 0], ry: Math.PI / 2, pose: "shrug", expr: "grin", blink: t });
    return { cam: L3([OFF - 3.0, 1.25, 2.6], [OFF - 3.2, 1.3, 2.2], u), look: [OFF - 4.2, 1.0, -0.3], fov: 50 };
  } });
  // S12 interview, over your shoulder
  shot(S("i1") - 0.1, { sets: ["office"], light: "office", fn(tt, u, t) {
    C.interviewer.set({ pos: [OFF + 4.5, 0, -2.45], ry: 0, pose: "sit", add: { shL: [-0.5, 0, 0], shR: [-0.5, 0, 0], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0] }, talk: t < w("i1", "twice") ? t : null, expr: "neutral", blink: t });
    C.you.set({ pos: [OFF + 4.4, 0, -0.55], ry: Math.PI, pose: "sit", expr: "smile", blink: t });
    const tw = w("i1", "twice");
    return { cam: L3([OFF + 5.15, 1.32, 0.5], [OFF + 5.0, 1.3, 0.25], u), look: [OFF + 4.45, 1.22, -2.4], fov: 42, rew: RW(t, tw - 0.05, tw + 0.55, 0.05, 0.1) * 0.85 };
  } });
  // S13 hired: handshake
  shot(S("i2") - 0.1, { sets: ["office"], light: "office", fn(tt, u, t) {
    const up = sm((t - S("i2")) / 0.8);
    C.interviewer.set({ pos: [OFF + 4.5, 0, -2.3 + 0.6 * up], ry: 0, pose: "sit", pose2: "handOut", k: up, expr: "smile", blink: t });
    C.you.set({ pos: [OFF + 4.4, 0, -0.55 - 0.2 * up], ry: Math.PI, pose: "sit", pose2: "handOut", k: up, expr: "grin", blink: t + 1 });
    return { cam: L3([OFF + 7.7, 1.45, -1.3], [OFF + 7.3, 1.45, -1.4], u), look: [OFF + 4.5, 1.15, -1.5], fov: 46 };
  } });
  // S14 free throw?
  function ballArc(p, miss) { // p 0..1 flight from the hands to the rim (and a bounce off on a miss)
    const a = [55.15, 2.25, -23.4], b = [55, 3.12, -28.0];
    if (miss && p > 1) { const q = p - 1; return [55.0 + q * 1.2, 3.12 + q * 1.5 - q * q * 4.5, -28 + q * 1.8]; }
    const x = lerp(a[0], b[0], p), z = lerp(a[2], b[2], p), y = lerp(a[1], b[1], p) + Math.sin(Math.PI * Math.min(p, 1)) * 2.0;
    return [x, y, z];
  }
  shot(S("b1") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    C.you.set({ pos: [55.1, 0.1, -23.0], ry: Math.PI, pose: "shootLoad", expr: "neutral", blink: t, look: [0, 0.15] });
    const h = C.you.at("elR", [0.05, -0.32, 0.12]); W.ball.position.set(55.12, h.y + 0.1, h.z - 0.1);
    W.ballShadow.position.set(55.1, 0.12, -23.3);
    return { cam: L3([55.9, 0.9, -19.2], [55.8, 0.95, -19.8], u), look: [55.0, 2.6, -27.0], fov: 52 };
  } });
  // S15 take thirty-one: shots and rewinds
  const b2a = S("b2") - 0.1, b2b = S("b3") - 0.1;
  shot(b2a, { sets: ["city"], light: "gold", fn(tt, u, t) {
    const cyc = 0.62, k = ((t - b2a) % cyc) / cyc; // forward 0..0.6, rewind 0.6..1
    const fwd = k < 0.6; const p = fwd ? k / 0.6 * 1.35 : (1 - (k - 0.6) / 0.4) * 1.35;
    const bp = ballArc(p, true); W.ball.position.set(...bp); W.ballShadow.position.set(bp[0], 0.12, bp[2]);
    C.you.set({ pos: [55.1, 0.1, -23.0], ry: Math.PI, pose: "shoot", expr: "worried", blink: t });
    return { cam: [43.6, 2.0, -25.4], look: [55.0, 2.3, -25.5], fov: 56, rew: fwd ? 0 : 0.85 };
  } });
  // S16 nothing but net (under the hoop)
  shot(b2b, { sets: ["city"], light: "gold", fn(tt, u, t) {
    const p = clamp((t - b2b) / 0.9, 0, 1.6);
    let bp = ballArc(Math.min(p, 1), false);
    if (p > 1) { const q = p - 1; bp = [55, 3.12 - q * 3.2 - q * q * 3, -28.0]; }
    W.ball.position.set(...bp); W.ballShadow.position.set(bp[0], 0.12, bp[2]);
    W.net.scale.set(1, 1 + (p > 1 && p < 1.3 ? Math.sin((p - 1) * 30) * 0.15 : 0), 1);
    C.you.set({ pos: [55.1, 0.1, -23.0], ry: Math.PI, pose: "shoot", pose2: "armsUp", k: sm((p - 1.05) / 0.3), expr: p > 1.1 ? "grin" : "neutral", blink: t });
    return { cam: L3([56.4, 2.3, -24.9], [56.3, 2.35, -25.3], u), look: [55.0, 2.75, -28.0], fov: 52 };
  } });
  // S17 every typo (phone)
  shot(S("m1") - 0.1, { sets: ["cafe"], light: "cafe", fn(tt, u, t) {
    const p = W.phone; p.visible = true; p.position.set(0.0, 1.25, -299.4); p.rotation.set(-0.25, 0.1, 0);
    const k = (t - S("m1")) / 1.2; const txt = k < 0.35 ? "see yuo" : k < 0.55 ? "see y" : "see you";
    W.drawPhone(txt, Math.floor(t * 4) % 2 === 0);
    return { cam: [0.04, 1.43, -299.08], look: [0.0, 1.25, -299.4], fov: 44, rew: RW(t, S("m1") + 0.42, S("m1") + 0.66, 0.04, 0.06) };
  } });
  // S18 every wrong turn (overhead)
  shot(S("m2") - 0.1, { sets: ["city"], light: "day", fn(tt, u, t) {
    const k = (t - S("m2") + 0.1) / 1.85; // 0..1
    let s = k < 0.45 ? k : k < 0.6 ? 0.45 - (k - 0.45) * 2.0 : 0.15 + (k - 0.6) * 1.3; // turn, rewind, go straight
    const turned = k < 0.6;
    const car = W.cars[1]; car.visible = true;
    let x = 14 + s * 26, z = -2.6, ry = 0;
    if (turned && s > 0.25) { const q = (s - 0.25) / 0.2; ry = -q * 1.0; z = -2.6 - q * q * 2.8; x = 14 + 0.25 * 26 + q * 4.0; }
    car.position.set(x, 0, z); car.rotation.set(0, ry, 0);
    for (let i = 0; i < W.cars.length; i++) if (i !== 1) { const c = W.cars[i]; c.visible = true; const sp = i % 2 ? 1 : -1; c.position.set(((i * 37 + t * 9 * sp) % 120) - 30, 0, sp > 0 ? -2.6 : 2.6); c.rotation.set(0, sp > 0 ? 0 : Math.PI, 0); }
    return { cam: [25, 24, 9], look: [25, 0, -1], fov: 50, rew: k > 0.45 && k < 0.6 ? 0.9 : 0 };
  } });
  // S19 every awkward word (cafe counter)
  shot(S("m3") - 0.1, { sets: ["cafe"], light: "cafe", fn(tt, u, t) {
    const k = (t - S("m3")) / 1.5;
    C.barista.set({ pos: [0.2, 0, -301.75], ry: 0, pose: "relaxed", expr: k < 0.45 ? "worried" : "smile", blink: t });
    C.you.set({ pos: [0.0, 0, -299.6], ry: Math.PI, pose: "relaxed", talk: t, blink: t });
    return { cam: L3([-0.45, 1.68, -298.55], [-0.4, 1.66, -298.75], u), look: [0.18, 1.5, -301.7], fov: 46, rew: RW(t, S("m3") + 0.55, S("m3") + 0.85, 0.04, 0.08) };
  } });
  // S20 no mistakes, only takes (street walk)
  shot(S("m4") - 0.1, { sets: ["city"], light: "day", fn(tt, u, t) {
    const x = -8 + (t - S("m4")) * 1.25;
    C.you.set({ pos: [x, 0.16, 7.6], ry: Math.PI / 2, walk: { phase: phaseOf(x + 40), amt: 1 }, expr: "smile", blink: t });
    const ex = [[1, -1, 8.6, -Math.PI / 2], [4, 1, 7.2, -Math.PI / 2], [8, 1, 8.8, Math.PI / 2]];
    for (const [i, off, z, ry] of ex) { const xx = x + 9 * off + (t - S("m4")) * 1.1 * Math.sin(ry) - 2; C.extras[i].set({ pos: [xx, 0.16, z], ry, walk: { phase: phaseOf(xx), amt: 1 }, blink: t + i }); }
    return { cam: [x + 4.2, 1.55, 5.6], look: [x - 0.4, 1.25, 7.9], fov: 50 };
  } });
  // S21 the girl at the bus stop
  const herSit = (t, extra) => C.her.set(Object.assign({ pos: [20.3, -0.16, 9.35], ry: Math.PI, pose: "sit", add: { shL: [-0.5, 0, 0.1], shR: [-0.5, 0, -0.1], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0], neck: [0.25, 0, 0] }, expr: "neutral", blink: t }, extra || {}));
  shot(S("g1") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    herSit(t);
    const x = 15.2 + (t - S("g1")) * 0.95; C.you.set({ pos: [x, 0.16, 7.9], ry: Math.PI / 2, walk: { phase: phaseOf(x), amt: 1 }, blink: t });
    return { cam: L3([16.4, 1.5, 3.6], [16.8, 1.45, 3.9], u), look: [19.6, 1.0, 9.0], fov: 50 };
  } });
  // S22 hello, wrong
  const helloCam = { cam: [22.9, 1.5, 5.2], look: [19.85, 1.15, 8.85], fov: 50 };
  shot(S("g2") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    const k = (t - S("g2")) / 2.2;
    herSit(t, { add: { neck: [0.05, 0, 0] }, look: [0.6, 0], expr: k > 0.45 ? "worried" : "neutral" });
    C.you.set({ pos: [19.4, 0.16, 8.25], ry: 2.3, pose: "relaxed", pose2: "handOut", k: sm(k * 3) * 0.7, add: { elR: [-0.9 * Math.max(0, Math.sin(t * 9)), 0, 0] }, talk: k < 0.5 ? t : null, expr: k > 0.55 ? "worried" : "smile", blink: t });
    return Object.assign({}, helloCam);
  } });
  // S23 rewind (takes 2..14)
  const rw4a = S("g3") - 0.05, rw4b = S("g4") - 0.12;
  shot(rw4a, { sets: ["city"], light: "gold", fn(tt, u, t) {
    const k = ((t - rw4a) * 3.2) % 1;
    herSit(t, { look: [0.6, 0], expr: k < 0.5 ? "worried" : "neutral" });
    C.you.set({ pos: [19.4, 0.16, 8.25], ry: 2.3, pose: "relaxed", pose2: "handOut", k: 0.7 * (1 - k), talk: t, blink: t });
    return Object.assign({ rew: RW(t, rw4a, rw4b, 0.06, 0.1) }, helloCam);
  } });
  // S24 take fourteen: she laughs
  shot(rw4b, { sets: ["city"], light: "gold", fn(tt, u, t) {
    herSit(t, { look: [0.55, 0.05], expr: t > w("g4", "laughs") - 0.5 ? "laugh" : "smile", add: { neck: [-0.1, 0, 0], spine: [-0.05 * Math.sin(t * 12), 0, 0] } });
    C.you.set({ pos: [19.4, 0.16, 8.25], ry: 2.3, pose: "relaxed", blink: t });
    const hp = v3(C.her.headPos());
    return { cam: L3(add3(hp, [-0.65, 0.02, -0.62]), add3(hp, [-0.55, 0.02, -0.52]), u), look: add3(hp, [0, -0.02, 0]), fov: 44 };
  } });
  // S25 effortless: walking together
  shot(S("g5") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    const x = 26 + (t - S("g5")) * 1.0;
    C.you.set({ pos: [x, 0.16, 7.5], ry: Math.PI / 2, walk: { phase: phaseOf(x), amt: 1 }, look: [-0.5, 0], expr: "smile", blink: t });
    C.her.set({ pos: [x, 0.16, 8.3], ry: Math.PI / 2, walk: { phase: phaseOf(x) + Math.PI, amt: 1 }, look: [0.5, 0], expr: "grin", blink: t + 1 });
    return { cam: [x + 3.6, 1.5, 6.9], look: [x, 1.35, 7.9], fov: 46 };
  } });
  // S26 the date (restaurant): micro rewinds before every sentence
  const date = (t, talk) => {
    C.you.set({ pos: [-0.62, 0, 298.8], ry: Math.PI / 2, pose: "sit", add: { shL: [-0.6, 0, 0], shR: [-0.6, 0, 0], elL: [-0.8, 0, 0], elR: [-0.8, 0, 0] }, talk: talk ? t : null, expr: "smile", blink: t });
    C.her.set({ pos: [0.62, 0, 298.8], ry: -Math.PI / 2, pose: "sit", add: { shR: [-1.6, 0, 0], elR: [-1.9, 0, 0], neck: [0, 0, 0.1] }, expr: "smile", blink: t + 2 });
  };
  const restoPts = (t) => [{ p: [0, 1.05, 298.8], c: "#ffb060", k: 1.5 + Math.sin(t * 13) * 0.08, r: 3.4 }, { p: [-3, 2.8, 298], c: "#ffcf80", k: 0.6, r: 7 }, { p: [3, 2.8, 301.5], c: "#ffcf80", k: 0.6, r: 7 }];
  shot(S("d1") - 0.12, { sets: ["resto"], light: "resto", fn(tt, u, t) {
    date(t, true); W.flame.scale.setScalar(1 + Math.sin(t * 17) * 0.15);
    const pulses = [w("d1", "test"), w("d1", "sentence"), w("d1", "she")];
    let r = 0; for (const p of pulses) r = Math.max(r, RW(t, p - 0.25, p + 0.05, 0.04, 0.06));
    return { cam: L3([-1.45, 1.42, 298.35], [-1.3, 1.4, 298.45], u), look: [0.55, 1.12, 298.85], fov: 48, pts: restoPts(t), rew: r * 0.8 };
  } });
  // S27 she always feels understood
  shot(S("d2") - 0.1, { sets: ["resto"], light: "resto", fn(tt, u, t) {
    date(t, false); W.flame.scale.setScalar(1 + Math.sin(t * 17) * 0.15);
    return Object.assign(faceCam(C.her, lerp(0.95, 0.8, u), 0.25, 0.02), { fov: 44, pts: restoPts(t) });
  } });
  // S28 wedding: forty versions of your vows
  function petals(t, on) {
    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
    W.petals.visible = on;
    W.petalSeeds.forEach((s, i) => {
      const fall = (t * (0.35 + s[2] * 0.3) + s[3] * 5) % 5;
      const p = new T.Vector3(-55 + (s[0] - 0.5) * 7 + Math.sin(t * 1.3 + i) * 0.3, 4.6 - fall, -30 + (s[1] - 0.3) * 6);
      e.set(t * 2 + i, t * 3 + i * 0.7, 0); q.setFromEuler(e); m.compose(p, q, new T.Vector3(1, 1, 1)); W.petals.setMatrixAt(i, m);
    });
    W.petals.instanceMatrix.needsUpdate = true;
  }
  const guests = [[0, -56.6, -25], [3, -53.4, -25], [5, -57.35, -23.8], [6, -52.65, -23.8], [8, -56.6, -22.6], [9, -53.4, -22.6]];
  function wedding(t) {
    C.youW.set({ pos: [-55.75, 0.1, -29.6], ry: Math.PI / 2, pose: "vows", talk: t, blink: t, expr: "smile" });
    C.herW.set({ pos: [-54.25, 0.1, -29.6], ry: -Math.PI / 2, pose: "vows", expr: "smile", blink: t + 1 });
    for (const [i, x, z] of guests) C.extras[i].set({ pos: [x, 0.1 - 0.0, z + 0.2], ry: Math.PI, pose: "sit", expr: "smile", blink: t + i });
    petals(t, true);
  }
  shot(S("w1") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    wedding(t);
    const r = t > w("w1", "forty") - 0.1 && t < w("w1", "versions") + 0.3 ? 0.6 * Math.max(0, Math.sin(t * 14)) : 0;
    return { cam: L3([-55, 1.6, -24.0], [-55, 1.6, -25.4], eio(u)), look: [-55, 1.45, -29.8], fov: 48, rew: r };
  } });
  // S29 she remembers one
  shot(S("w2") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    wedding(t);
    return Object.assign(faceCam(C.herW, lerp(1.0, 0.85, u), -0.35, 0.03), { fov: 44 });
  } });
  // S30 nobody sees the cost (window at night)
  shot(S("c1") - 0.1, { sets: ["apt"], light: "aptNight", fn(tt, u, t) {
    W.skyBack.uniforms.uColor.value.set("#1a2240"); W.skyBack2.uniforms.uColor.value.set("#8090b0");
    C.you.set({ pos: [APT + 3.5, 0, -4.7], ry: Math.PI, pose: "relaxed", look: [0, 0.05], blink: t });
    return { cam: L3([APT + 3.1, 1.45, -1.2], [APT + 3.2, 1.5, -1.8], u), look: [APT + 3.5, 1.5, -6.5], fov: 50, pts: [{ p: [APT + 5.4, 1.6, -2.4], c: "#ffc890", k: 1.0, r: 6 }] };
  } });
  // S31 ECU: thirty, lived forty-one
  shot(S("c2") - 0.1, { sets: ["apt"], light: "aptNight", fn(tt, u, t) {
    C.you.set({ pos: [APT + 3.5, 0, -4.7], ry: 0, pose: "relaxed", expr: u > 0.55 ? "sad" : "blank", blink: t });
    const hp = v3(C.you.headPos());
    return { cam: L3(add3(hp, [0.04, 0.0, 0.95]), add3(hp, [0.02, 0.01, 0.52]), eio(u)), look: add3(hp, [0, 0.0, 0]), fov: 42, pts: [{ p: [APT + 4.6, 1.8, -3.6], c: "#ffd0a0", k: 1.1, r: 5 }, { p: [APT + 2.3, 1.7, -4.0], c: "#7a90c8", k: 0.6, r: 4 }] };
  } });
  // S32 heard every joke twice (dinner with friends)
  const friends = [[1, -5.05, 2.4, 0], [8, -3.95, 2.4, 0], [3, -4.5, 3.75, Math.PI]];
  shot(S("c4") - 0.1, { sets: ["apt"], light: "aptEve", fn(tt, u, t) {
    W.skyBack.uniforms.uColor.value.set("#2a3050");
    const lol = t > w("c4", "heard") - 0.4;
    for (const [i, x, z, ry] of friends) C.extras[i].set({ pos: [APT + x, 0, z - (ry ? -0.2 : 0.2)], ry: ry ? Math.PI : 0, pose: "sit", pose2: lol ? "laugh" : null, k: lol ? 0.6 : 0, expr: lol ? "laugh" : "smile", talk: i === 1 && !lol ? t : null, blink: t + i });
    C.you.set({ pos: [APT - 3.75, 0, 3.0], ry: -Math.PI / 2, pose: "sit", expr: "blank", blink: t });
    return { cam: L3([APT - 1.6, 1.6, 4.9], [APT - 1.9, 1.55, 4.6], u), look: [APT - 4.3, 1.0, 3.0], fov: 52, pts: [{ p: [APT - 4.5, 2.4, 3.0], c: "#ffcf90", k: 1.4, r: 5 }] };
  } });
  // living room loop: her laughing on the couch
  const tv = (t) => 0.75 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 2.1);
  function couch(t, loopK) {
    const lt = loopK ? (t % 0.9) : t;
    C.her.set({ pos: [APT + 3.0, 0, -1.75], ry: 0, pose: "sitBack", pose2: "laugh", k: 0.75, add: { spine: [-0.05 * Math.sin(lt * 12), 0, 0] }, expr: "laugh", blink: lt });
    C.you.set({ pos: [APT + 4.05, 0, -1.75], ry: 0, pose: "sitBack", look: [0.45, 0], expr: "smile", blink: t + 1 });
    W.tvScreen.uniforms.uColor.value.setRGB(0.5 * tv(t), 0.66 * tv(t), 0.85 * tv(t));
  }
  const tvPt = (t) => ({ p: [APT + 3.5, 1.1, 3.6], c: "#7aa0e0", k: 2.3 * tv(t), r: 7 });
  shot(S("l1") - 0.1, { sets: ["apt"], light: "aptEve", fn(tt, u, t) {
    W.skyBack.uniforms.uColor.value.set("#38406a"); couch(t, false);
    return { cam: L3([APT + 2.0, 1.6, 3.4], [APT + 2.3, 1.5, 3.0], u), look: [APT + 3.5, 0.9, -1.8], fov: 50, pts: [tvPt(t), { p: [APT + 5.4, 1.6, -2.4], c: "#ffc890", k: 0.9, r: 5 }] };
  } });
  const herCU = (t, u) => { const hp = v3(C.her.headPos()); return { cam: L3(add3(hp, [-0.15, 0.0, 0.85]), add3(hp, [-0.12, 0.0, 0.7]), u), look: add3(hp, [0, -0.02, 0]), fov: 42, pts: [tvPt(t), { p: [APT + 5.4, 1.6, -2.4], c: "#ffc890", k: 0.8, r: 5 }] }; };
  shot(S("l2") - 0.1, { sets: ["apt"], light: "aptEve", fn(tt, u, t) { couch(t, false); return herCU(t, u); } });
  // S35 and you loop it
  const lp0 = S("l3") - 0.08;
  shot(lp0, { sets: ["apt"], light: "aptEve", fn(tt, u, t) {
    const k = ((t - lp0) % 0.55) / 0.55; couch(lp0 + k * 0.4, true);
    return Object.assign(herCU(t, 0.5), { rew: k > 0.78 ? 0.9 : 0 });
  } });
  // S36 a weekend, a year, a hundred years: the window cycles
  const l4a = S("l4") - 0.1;
  shot(l4a, { sets: ["apt"], light: "aptEve", fn(tt, u, t) {
    const sp = 0.6 + 4.5 * sm((t - w("l4", "hundred")) / 1.0) + 1.5 * sm((t - w("l4", "year")) / 0.5);
    const ph = (t - l4a) * sp; const day = 0.5 + 0.5 * Math.sin(ph * 2.0);
    W.skyBack.uniforms.uColor.value.setRGB(lerp(0.08, 0.62, day), lerp(0.1, 0.76, day), lerp(0.2, 0.9, day));
    W.skyBack2.uniforms.uColor.value.setRGB(lerp(0.9, 1, day), lerp(0.9, 1, day), lerp(1, 1, day));
    const k = ((t - l4a) % 0.55) / 0.55; couch(l4a + k * 0.4, true);
    const st = { cam: L3([APT + 3.5, 1.35, 2.6], [APT + 3.5, 1.4, 2.0], u), look: [APT + 3.5, 1.3, -4.5], fov: 54, pts: [tvPt(t), { p: [APT + 3.5, 2.2, -5.2], c: "#cfe0ff", k: 1.2 * day, r: 7 }] };
    st.rew = k > 0.82 ? 0.6 : 0; st.expo = 1.12 + 0.1 * day;
    return st;
  } });
  // S37 in the loop she always laughs (your face, TV-lit)
  shot(S("l5") - 0.1, { sets: ["apt"], light: "aptEve", fn(tt, u, t) {
    W.skyBack.uniforms.uColor.value.set("#20284a");
    const k = ((t - S("l5")) % 0.9) / 0.9; couch(t, true);
    const hp = v3(C.you.headPos());
    return { tint: [0.84, 0.96, 1.14], expo: 1.32, cam: L3(add3(hp, [0.1, 0.0, 0.9]), add3(hp, [0.08, 0.0, 0.72]), u), look: add3(hp, [-0.05, -0.02, 0]), fov: 42, pts: [tvPt(t), { p: [APT + 5.4, 1.6, -2.4], c: "#ffc890", k: 0.7, r: 5 }], rew: k > 0.9 ? 0.35 : 0 };
  } });
  // the leaving (kitchen, night)
  const leave = (t, talk) => C.her.set({ pos: [APT - 6.2, 0, 4.9], ry: Math.PI * 0.92, pose: "relaxed", add: { shR: [0.05, 0, -0.05] }, talk: talk ? t : null, expr: "sad", blink: t });
  const youTable = (t, e) => C.you.set({ pos: [APT - 4.5, 0, 2.2], ry: 0, pose: "sit", add: { shL: [-0.55, 0, 0], shR: [-0.55, 0, 0], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0] }, expr: e || "worried", blink: t });
  const kitPts = [{ p: [APT - 4.5, 2.5, 3.0], c: "#ffcf90", k: 2.0, r: 6 }, { p: [APT - 6.3, 2.3, 4.2], c: "#ffc890", k: 1.6, r: 3.5 }];
  const youPts = [{ p: [APT - 4.2, 1.9, 3.1], c: "#8fb4ff", k: 2.2, r: 3.0 }, { p: [APT - 4.5, 2.5, 3.0], c: "#ffcf90", k: 0.8, r: 6 }];
  const ots = { cam: [APT - 4.15, 1.38, 1.15], look: [APT - 6.1, 1.35, 4.8], fov: 44 };
  shot(S("t1") - 0.1, { sets: ["apt"], light: "aptNight", fn(tt, u, t) {
    leave(t, t > w("t1", "says") - 0.1); youTable(t);
    return Object.assign({ pts: kitPts }, ots, { cam: L3([APT - 4.15, 1.38, 1.15], [APT - 4.2, 1.38, 1.35], u) });
  } });
  const rw5a = S("t2") - 0.05, rw5b = S("t3") - 0.1;
  shot(rw5a, { sets: ["apt"], light: "aptNight", fn(tt, u, t) { leave(t, true); youTable(t); return Object.assign({ pts: kitPts, rew: RW(t, rw5a, rw5b, 0.06, 0.12) }, ots); } });
  const herLeaveCU = (u) => { const hp = v3(C.her.headPos()); return { cam: L3(add3(hp, [0.45, -0.02, -0.75]), add3(hp, [0.38, -0.02, -0.62]), u), look: add3(hp, [0, -0.03, 0]), fov: 42, pts: kitPts, tint: [1.08, 0.98, 0.86], expo: 1.34 }; };
  const youCU = (u) => { const hp = v3(C.you.headPos()); return { cam: L3(add3(hp, [-0.3, 0.0, 0.8]), add3(hp, [-0.25, 0.0, 0.66]), u), look: add3(hp, [0, -0.02, 0]), fov: 42, pts: youPts, tint: [0.86, 0.96, 1.12] }; };
  shot(rw5b, { sets: ["apt"], light: "aptNight", fn(tt, u, t) { leave(t, true); youTable(t); return herLeaveCU(u); } });
  const rw6a = S("t4") - 0.05, rw6b = S("t5") - 0.1;
  shot(rw6a, { sets: ["apt"], light: "aptNight", fn(tt, u, t) { leave(t, true); youTable(t, "surprised"); return Object.assign(youCU(u), { rew: RW(t, rw6a, rw6b, 0.06, 0.12) }); } });
  // S42 two hundred takes: a flicker montage
  const t5 = rw6b, t5d = (S("t6") - 0.1 - t5) / 4;
  for (let i = 0; i < 4; i++) shot(t5 + i * t5d, { sets: ["apt"], light: "aptNight", fn(tt, u, t) {
    leave(t, true); youTable(t, "sad");
    const st = i % 2 ? youCU(u) : herLeaveCU(u);
    st.rew = Math.max(0, Math.sin(tt * 10)) * 0.7; return st;
  } });
  // S43 she is gone
  shot(S("t6") - 0.1, { sets: ["apt"], light: "aptNight", fn(tt, u, t) {
    W.door.rotation.y = -1.2 * (1 - sm(tt / 0.8)); W.bag.visible = false;
    C.her.set({ visible: false }); youTable(t, "sad");
    return { cam: L3([APT - 1.4, 1.75, 0.6], [APT - 1.9, 1.65, 0.9], eio(u)), look: [APT - 4.7, 0.95, 2.9], fov: 52, pts: kitPts, expo: 0.98 };
  } });
  // S44 take fourteen (the bus stop again, faded tape)
  shot(S("t7") - 0.1, { sets: ["city"], light: "gold", fn(tt, u, t) {
    W.bag.visible = true;
    herSit(t, { look: [0.55, 0.05], expr: "laugh", add: { neck: [-0.1, 0, 0], spine: [-0.05 * Math.sin(t * 12), 0, 0] } });
    C.you.set({ pos: [19.4, 0.16, 8.25], ry: 2.3, pose: "relaxed", blink: t });
    const hp = v3(C.her.headPos());
    return { cam: add3(hp, [-0.6, 0.02, -0.57]), look: add3(hp, [0, -0.02, 0]), fov: 44, sat: 0.35, tint: [1.08, 1.0, 0.86], noise: 1, track: 1.6 };
  } });
  // S45 she never met take one (alone at the bus stop, dusk)
  shot(S("t8") - 0.1, { sets: ["city"], light: "dusk", fn(tt, u, t) {
    C.you.set({ pos: [20.0, -0.16, 9.35], ry: Math.PI, pose: "sit", add: { neck: [0.35, 0, 0], shL: [-0.6, 0, 0], shR: [-0.6, 0, 0], elL: [-1.0, 0, 0], elR: [-1.0, 0, 0] }, expr: "sad", blink: t });
    return { cam: L3([16.2, 1.35, 4.4], [16.8, 1.4, 4.9], u), look: [20.0, 0.95, 9.1], fov: 48, pts: [{ p: [20, 2.4, 9.0], c: "#ffd8a0", k: 1.0, r: 5 }] };
  } });
  // S46 end card: the city from above
  shot(V.endCard, { sets: ["city"], light: "dusk", fn(tt, u, t) {
    for (let i = 0; i < W.cars.length; i++) { const c = W.cars[i]; c.visible = true; const sp = i % 2 ? 1 : -1; c.position.set(((i * 29 + t * 7 * sp) % 90) - 20, 0, sp > 0 ? -2.6 : 2.6); c.rotation.set(0, sp > 0 ? 0 : Math.PI, 0); }
    C.you.set({ pos: [20.0, -0.16, 9.35], ry: Math.PI, pose: "sit", expr: "sad" });
    return { cam: L3([24, 40, 14], [24, 44, 15], u), look: [22, 0, 2], fov: 50, pts: [{ p: [20, 2.4, 9.0], c: "#ffd8a0", k: 1.0, r: 5 }] };
  } });

  sh.sort((a, b) => a.t0 - b.t0);

  // ---------- frame ----------
  function frame(t) {
    let i = 0; while (i < sh.length - 1 && t >= sh[i + 1].t0) i++;
    const s = sh[i], t1 = i < sh.length - 1 ? sh[i + 1].t0 : V.dur;
    const tt = t - s.t0, u = clamp(tt / Math.max(0.001, t1 - s.t0), 0, 1);
    W.show(s.sets); W.hideCast(); W.phone.visible = false; W.petals.visible = false;
    for (const c of W.cars) c.visible = s.sets.indexOf("city") >= 0;
    W.net.scale.set(1, 1, 1); W.door.rotation.y = 0; W.bag.visible = true;
    W.skyBack.uniforms.uColor.value.set("#9cc4e4"); W.skyBack2.uniforms.uColor.value.set("#ffffff");
    // parked / moving traffic default
    for (let k = 0; k < W.cars.length; k++) { const c = W.cars[k]; const sp = k % 2 ? 1 : -1; c.position.set(((k * 41 + t * 6 * sp) % 160 + 160) % 160 - 80, 0, sp > 0 ? -2.6 : 2.6); c.rotation.set(0, sp > 0 ? 0 : Math.PI, 0); }
    W.ball.position.set(55.12, 1.2, -23.5); W.ballShadow.position.set(55.1, 0.12, -23.3);
    const st = s.fn(tt, u, t) || {};
    const Lp = LIGHT[s.light] || LIGHT.day;
    const out = Object.assign({ t, sun: Lp.sun, amb: Lp.amb, fog: Lp.fog, bloom: Lp.bloom, haze: Lp.haze, tint: Lp.tint, bg: Lp.bg, expo: Lp.expo || 1.08 }, st);
    if (st.fog) out.fog = st.fog;
    out.shot = i;
    return out;
  }
  return { frame, shots: sh, LIGHT };
};
