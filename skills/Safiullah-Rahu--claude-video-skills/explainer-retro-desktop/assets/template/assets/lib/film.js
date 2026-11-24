/* film.js (template) — a 4-line "Hashing 101" demo on the TerraOS 96 desktop; copy a shot pattern from the sample
   (assets/sample/film.js) for each new layout. One canvas; draw(t) is a pure function of t.
   Shots are keyed to the voice-over's word times (window.VO); every hash on screen is real (window.HASHES).
   FILM_CREATE(canvas) -> {draw(t), cues, shots}. cues = SFX list for tools/sound_design.py (dumped by tools/dump_cues.mjs). */
window.FILM_CREATE = function (canvas) {
  "use strict";
  const K = window.RETRO, VO = window.VO, HS = window.HASHES;
  const { clamp, lerp, sm, eo, eio, back, rnd } = K.util;
  const C = K.C, TX = (...a) => K.text(ctx, ...a), IC = (...a) => K.icon(ctx, ...a);
  let ctx = canvas.getContext("2d");
  const DUR = VO.dur;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
  function hits(id, word) {
    const l = VO.lines[id];
    if (!l) throw new Error("no line " + id);
    const h = l.words.filter((x) => norm(x[0]).startsWith(norm(word)));
    if (!h.length) throw new Error("no word " + id + ":" + word);
    return h;
  }
  const w = (id, word, k) => { const h = hits(id, word); return h[Math.min(k || 0, h.length - 1)][1]; };
  const we = (id, word, k) => { const h = hits(id, word); return h[Math.min(k || 0, h.length - 1)][2]; };
  const S = (id) => VO.lines[id].s, E = (id) => VO.lines[id].e;
  const H = HS.sha, USERS = HS.users;
  const LX = 330, RX = 1035, CW = RX - LX;
  const PIA_L = 150, PIA_C = 540, FEET = K.TASK_Y, PS = 0.86;
  const cues = [];
  const cue = (t, kind, gain, extra) => cues.push(Object.assign({ t: +t.toFixed(3), kind, gain: gain == null ? 1 : gain }, extra || {}));

  // ---------------------------------------------------------------- helpers
  const HEXCH = "0123456789abcdef";
  const JUNK = "#$%&*+=?@ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789{}[]<>/\\^~";
  function typed(str, t, t0, cps) { if (t < t0) return ""; return str.slice(0, Math.min(str.length, Math.floor((t - t0) * (cps || 14)) + 1)); }
  function typeCues(str, t0, cps, gain) { for (let i = 0; i < str.length; i++) if (str[i] !== " ") cue(t0 + i / (cps || 14), "key", gain == null ? 0.7 : gain); }
  // scramble from a to b over [t0, t0+dur]
  function scramble(a, b, t, t0, dur, seed, set) {
    set = set || JUNK;
    const n = Math.max(a.length, b.length);
    let o = "";
    for (let i = 0; i < n; i++) {
      const ti = t0 + dur * (0.65 * i / n + 0.35 * rnd(i, seed || 1));
      if (t < t0) o += a[i] || "";
      else if (t >= ti) o += b[i] || "";
      else o += set[Math.floor(rnd(i * 31 + Math.floor(t * 24), seed || 1) * set.length)];
    }
    return o;
  }
  // window with a Win-95 zoom-rect on open (0.14 s) ; o.t0 open, o.t1 close (zoom to o.to or the task bar)
  function win(t, o, fn) {
    if (t < o.t0 - 0.14) return null;
    const rect = { x: o.x, y: o.y, w: o.w, h: o.h };
    const from = o.from || { x: o.x + o.w / 2 - 40, y: o.y + o.h / 2 - 30, w: 80, h: 60 };
    if (t < o.t0) { K.zoomRect(ctx, from, rect, eo((t - (o.t0 - 0.14)) / 0.14)); return null; }
    if (o.t1 != null && t >= o.t1) {
      const k = (t - o.t1) / 0.16;
      if (k < 1) K.zoomRect(ctx, rect, o.to || K.taskSlot(o.slot || 1), eo(k));
      return null;
    }
    let x = o.x, y = o.y;
    if (o.move) { const m = o.move, k = eio((t - m[0]) / (m[1] - m[0])); x = lerp(o.x, m[2], k); y = lerp(o.y, m[3], k); }
    if (o.shake) { const s = o.shake; if (t > s && t < s + 0.4) x += Math.sin((t - s) * 70) * 12 * (1 - (t - s) / 0.4); }
    const cr = K.win(ctx, x, y, o.w, o.h, o);
    if (fn) { ctx.save(); ctx.beginPath(); ctx.rect(cr.x, cr.y, cr.w, cr.h); ctx.clip(); fn(cr, t - o.t0, x, y); ctx.restore(); }
    return cr;
  }
  function openCue(t0, g) { cue(t0 - 0.12, "open", g == null ? 0.8 : g); }
  function label(x, y, str, opt) { // boxed letter-spaced label (PLAIN TEXT)
    opt = opt || {};
    const s = opt.s || 4, ww = K.tw(str, s, { bold: true, sp: 1.4 }) + 40, hh = 9 * s + 18;
    ctx.fillStyle = opt.bg || "#fff"; ctx.fillRect(x, y, ww, hh);
    ctx.strokeStyle = opt.border || C.black; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, ww - 4, hh - 4);
    TX(str, x + 20, y + 11, s, opt.col || C.ink, { bold: true, sp: 1.4 });
    return ww;
  }
  function stamp(cx, cy, str, col, k, rot) {
    if (k <= 0) return;
    const s = str.length > 11 ? 4 : 5;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot == null ? -0.08 : rot);
    const sc = lerp(1.8, 1, eo(k / 0.6)); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(k / 0.25, 0, 1);
    const ww = K.tw(str, s, { bold: true, sp: 1.2 }) + 44, hh = 9 * s + 24;
    ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.strokeRect(-ww / 2, -hh / 2, ww, hh);
    TX(str, 0, -3.5 * s - 3, s, col, { bold: true, align: "center", sp: 1.2 });
    ctx.restore();
  }
  function hexLines(hex, per) { const o = []; for (let i = 0; i < hex.length; i += per) o.push(hex.slice(i, i + per)); return o; }
  function short(hex, n) { return hex.slice(0, n || 8) + "…"; }
  function arrowDown(x, y, len, col) { ctx.fillStyle = col || C.ink; ctx.fillRect(x - 5, y, 10, len - 18); ctx.beginPath(); ctx.moveTo(x - 18, y + len - 20); ctx.lineTo(x + 18, y + len - 20); ctx.lineTo(x, y + len); ctx.closePath(); ctx.fill(); }
  function arrowRight(x, y, len, col) { ctx.fillStyle = col || C.ink; ctx.fillRect(x, y - 4, len - 16, 8); ctx.beginPath(); ctx.moveTo(x + len - 18, y - 14); ctx.lineTo(x + len, y); ctx.lineTo(x + len - 18, y + 14); ctx.closePath(); ctx.fill(); }
  function wire(x1, y1, x2, y2, k, col) { // dashed network line drawing on
    const x = lerp(x1, x2, clamp(k, 0, 1)), y = lerp(y1, y2, clamp(k, 0, 1));
    ctx.save(); ctx.strokeStyle = col || "#1b1b1b"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x, y); ctx.stroke();
    ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.restore();
  }
  function hl(x, y, wdt, hgt, col, a) { ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.fillStyle = col; ctx.fillRect(x, y, wdt, hgt); ctx.restore(); }
  function tableRows(cr, x, y, cols, rows, opt) { // simple grid table; cols [{w, title}], rows [[cells]] with optional {col, bg}
    opt = opt || {};
    const s = opt.s || 3, rh = opt.rh || 50;
    let cx = x;
    cols.forEach((c) => { K.panel(ctx, cx, y, c.w, rh, C.face, true); TX(c.title, cx + 12, y + rh / 2 - 3.5 * s, s, C.ink, { bold: true }); cx += c.w; });
    rows.forEach((r, i) => {
      let cx2 = x; const yy = y + rh * (i + 1);
      cols.forEach((c, j) => {
        const cell = r[j], v = typeof cell === "object" && cell ? cell : { v: cell };
        ctx.fillStyle = v.bg || (i % 2 ? "#f1f1ec" : "#fff"); ctx.fillRect(cx2, yy, c.w, rh);
        ctx.strokeStyle = "#c9c9c4"; ctx.lineWidth = 2; ctx.strokeRect(cx2 + 1, yy + 1, c.w - 2, rh - 2);
        if (v.icon) IC(v.icon, cx2 + 8, yy + (rh - 34) / 2, 34);
        if (v.v != null) TX(v.v, cx2 + (v.icon ? 50 : 12), yy + rh / 2 - 3.5 * (v.s || s), v.s || s, v.col || C.ink, { bold: v.bold, mono: v.mono });
        cx2 += c.w;
      });
    });
    return y + rh * (rows.length + 1);
  }

  // ---------------------------------------------------------------- shot timing (word anchors)
  function sunken(x, y, ww, hh, f) { K.sunken(ctx, x, y, ww, hh, f); }
  function panelLbl(x, y, s) { ctx.fillStyle = "#fff"; const ww = K.tw(s, 3, { bold: true }) + 20; ctx.fillRect(x, y, ww, 40); ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, ww - 3, 37); TX(s, x + 10, y + 9, 3, C.ink, { bold: true }); }
  const T = { l01: S("l01"), l02: S("l02"), l03: S("l03"), l04: S("l04") };
  const shots = [];
  const shot = (t0, t1, name, draw, tasks) => shots.push({ t0, t1, name, draw, tasks: tasks || [] });

  // S1 the title window is a finished still on frame 0; the cursor drags a fingerprint onto the word; it scrambles
  const tScr = 0.95;
  shot(0, T.l02 - 0.1, "title", (t) => {
    win(t, { x: 60, y: 300, w: 960, h: 700, t0: -1, title: "HASHING 101", big: 7, menu: ["File", "Edit", "Help"], menuRight: "note.txt - Notepad" }, (cr) => {
      TX("input:", cr.x + 34, cr.y + 40, 5, C.grey, {});
      const s = t < tScr ? "sunflower42" : scramble("sunflower42", H.sunflower42.slice(0, 11), t, tScr, 0.5, 3, HEXCH + JUNK);
      TX(s, cr.x + 34, cr.y + 130, 9, C.ink, { mono: 5 });
    });
    if (t < tScr + 0.05) { const k = eio((t - 0.25) / 0.6); IC("fingerprint", lerp(880, 340, k), lerp(1170, 470, k), 96); }
  }, [{ label: "note.txt", icon: "doc" }]);
  cue(0.25, "grab", 0.8); cue(tScr - 0.04, "drop", 0.8); cue(tScr, "scramble", 1, { dur: 0.5 });

  // S2 hash.exe: input -> SHA-256 -> a 64-character fingerprint (the hex appears on the word "fingerprint")
  const tFp = w("l02", "fingerprint");
  function hashWin(t, t0, foot) {
    return win(t, { x: LX, y: 140, w: CW, h: 1000, t0, title: "hash.exe", icon: "fingerprint", menu: ["File", "Help"] }, (cr) => {
      TX("input", cr.x + 30, cr.y + 26, 4, C.grey, {});
      K.field(ctx, cr.x + 30, cr.y + 70, cr.w - 60, 96, "sunflower42", { s: 6, mono: 5 });
      arrowDown(cr.x + cr.w / 2, cr.y + 190, 150);
      IC("fingerprint", cr.x + cr.w / 2 + 40, cr.y + 210, 90); TX("SHA-256", cr.x + cr.w / 2 + 142, cr.y + 238, 4, C.ink, { bold: true });
      sunken(cr.x + 30, cr.y + 414, cr.w - 60, 340, "#fff");
      const out = t < tFp ? "" : t < tFp + 0.45 ? scramble("", H.sunflower42, t, tFp, 0.45, 5, HEXCH) : H.sunflower42;
      hexLines(out, 16).forEach((ln, i) => TX(ln, cr.x + 76, cr.y + 446 + i * 76, 6, C.ink, { mono: 5 }));
      if (foot) foot(cr);
    });
  }
  shot(T.l02 - 0.1, T.l03 - 0.6, "hash", (t) => hashWin(t, T.l02), [{ label: "hash.exe", icon: "fingerprint" }]);
  openCue(T.l02); cue(tFp, "scramble", 0.8, { dur: 0.45 });

  // S3 the callout: the desktop clears, the cursor drags the presenter centre stage, a bubble pops
  shot(T.l03 - 0.6, T.l04 - 0.1, "simple", () => {}, []);

  // S4 the same input again: the same fingerprint, a green tick
  shot(T.l04 - 0.1, DUR + 1, "same", (t) => hashWin(t, -1, (cr) => {
    if (t > w("l04", "output")) { IC("check", cr.x + 30, cr.y + 790, 80); TX("same input, same output", cr.x + 130, cr.y + 818, 4, C.greenDk, { bold: true }); }
  }), [{ label: "hash.exe", icon: "fingerprint" }]);
  cue(w("l04", "output"), "ok", 0.9);
  const tZoom = DUR + 10; // the template has no outro (see the sample for the zoom-out)

  // ---------------------------------------------------------------- presenter track
  const PIA_IN = T.l02 - 0.2;
  const DRAGS = [[T.l03 - 0.55, T.l03 - 0.05, PIA_L, PIA_C], [T.l04 - 0.5, T.l04 - 0.05, PIA_C, PIA_L]];
  DRAGS.forEach((d) => { cue(d[0], "grab", 0.8); cue(d[0] + 0.1, "whoosh", 0.7, { dur: d[1] - d[0] }); cue(d[1], "drop", 0.9); });
  const BUBBLES = [[T.l03 - 0.02, T.l04 - 0.55, "SIMPLE.", "C"]];
  BUBBLES.forEach((b) => cue(b[0], "pop", 0.9));
  const POSES = [[0, "idle"], [T.l02, "point"], [T.l03 - 0.1, "thumbs"], [T.l04, "explain"]];
  function piaState(t) {
    let x = PIA_L, lift = 0, swing = 0;
    for (const d of DRAGS) {
      if (t >= d[1]) x = d[3];
      else if (t >= d[0]) { const k = eio((t - d[0] - 0.08) / (d[1] - d[0] - 0.08)); x = lerp(d[2], d[3], k); lift = 26 * Math.sin(Math.PI * clamp((t - d[0]) / (d[1] - d[0]), 0, 1)); swing = -0.08 * Math.sin(Math.PI * k) * Math.sign(d[3] - d[2]); break; }
      else break;
    }
    // drop squash after a drag
    for (const d of DRAGS) if (t >= d[1] && t < d[1] + 0.2) lift = -6 * Math.sin(Math.PI * (t - d[1]) / 0.2);
    let pi = 0;
    for (let i = 0; i < POSES.length; i++) if (POSES[i][0] <= t) pi = i;
    const pose = POSES[pi][1], prev = pi ? POSES[pi - 1][1] : pose, pk = sm((t - POSES[pi][0]) / 0.28);
    const f = Math.min(VO.env.length - 1, Math.max(0, Math.floor(t * 30)));
    const mouth = VO.env[f] * (0.75 + 0.25 * Math.sin(t * 31));
    const kb = Math.floor(t / 3.4), tb = kb * 3.4 + rnd(kb, 9) * 1.8;
    const blink = Math.abs(t - tb) < 0.075 ? 1 - Math.abs(t - tb) / 0.075 : 0;
    const centre = Math.abs(x - PIA_C) < 5;
    return { x, y: FEET, s: PS, pose: prev, pose2: pose, pk, mouth, blink, lift, swing, t, look: centre ? [0, 0.1] : [0.9, 0.1], brow: pose === "shrug" ? 1 : pose === "thumbs" ? 0.5 : 0 };
  }

  // ---------------------------------------------------------------- cursor track: [t, x, y, kind, click]
  const CK = [[0, 640, 1180, "hand"], [0.25, 920, 1205, "grab"], [tScr - 0.04, 390, 510, "grab"], [tScr + 0.1, 410, 530, "hand"], [1.6, 760, 1240, "arrow"], [tFp, 900, 1200, "arrow"]];
  DRAGS.forEach((d) => { CK.push([d[0], d[2] + 50, 820, "hand"], [d[0] + 0.08, d[2] + 50, 820, "grab"], [d[1], d[3] + 50, 820, "grab"], [d[1] + 0.1, d[3] + 56, 826, "hand"], [d[1] + 0.6, d[3] + (d[3] > 300 ? 300 : 520), 1120, "arrow"]); });
  CK.sort((a, b) => a[0] - b[0]);
  CK.filter((k) => k[4]).forEach((k) => cue(k[0], "click", 0.55));
  function cursorAt(t) {
    let i = 0;
    while (i + 1 < CK.length && CK[i + 1][0] <= t) i++;
    const a = CK[i], b = CK[i + 1];
    if (!b || t < a[0]) return { x: a[1], y: a[2], kind: a[3], press: 0 };
    const mv = Math.min(0.55, b[0] - a[0]);
    const u = eio((t - (b[0] - mv)) / mv);
    const press = a[4] && t - a[0] < 0.12 ? 1 : 0;
    const kind = a[3] === "grab" && b[3] === "grab" ? "grab" : u >= 1 ? b[3] : a[3];
    return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), kind, press };
  }

  // ---------------------------------------------------------------- disk LED activity
  const ACT = [[tScr, tScr + 0.6]];
  function led(t) { for (const a of ACT) if (t > a[0] && t < a[1]) return rnd(Math.floor(t * 18), 3) > 0.45 ? 1 : 0.2; return 1; }

  // ---------------------------------------------------------------- frame (ctx can be re-bound so the outro can draw whole monitors off-screen)
  function withCtx(g, fn) { const keep = ctx; ctx = g; try { fn(); } finally { ctx = keep; } }
  function frame(t) {
    if (ctx.reset) ctx.reset(); else ctx.setTransform(1, 0, 0, 1, 0, 0); // a fresh state every frame: no leaked clip or alpha
    K.caseBack(ctx);
    K.desktop(ctx, t);
    ctx.save(); K.rr(ctx, K.SCR.x, K.SCR.y, K.SCR.w, K.SCR.h, K.SCR.r); ctx.clip();
    let sh = shots[0];
    for (const s of shots) if (t >= s.t0) sh = s;
    ctx.save();
    try { sh.draw(t); } catch (e) { console.error("shot " + sh.name + " at " + t.toFixed(2) + ": " + e.message); }
    ctx.restore();
    if (t > PIA_IN - 0.14) {
      const st = piaState(t);
      if (t < PIA_IN) K.zoomRect(ctx, K.taskSlot(0), { x: st.x - 110, y: FEET - 730, w: 220, h: 730 }, eo((t - PIA_IN + 0.14) / 0.14));
      else {
        const pop = back(clamp((t - PIA_IN) / 0.25, 0, 1), 2);
        ctx.save(); ctx.translate(st.x, FEET); ctx.scale(pop, pop); ctx.translate(-st.x, -FEET);
        K.pia(ctx, st);
        ctx.restore();
        for (const b of BUBBLES) if (t >= b[0] && t < b[1]) {
          const atC = b[3] === "C";
          K.bubble(ctx, atC ? PIA_C + 30 : PIA_L + 110, 470, b[2], clamp((t - b[0]) / 0.22, 0, 1), atC ? -10 : -50);
        }
      }
    }
    const tasks = t > PIA_IN ? [{ label: "pia.exe", icon: "user" }].concat(sh.tasks) : sh.tasks;
    const mins = 30 + Math.floor(t / 60);
    K.taskbar(ctx, tasks, "7:" + String(mins).padStart(2, "0") + " PM", tasks.length - 1, false);
    if (t < tZoom) { const c = cursorAt(t); K.cursor(ctx, c.kind, c.x, c.y + c.press * 3, 3); }
    ctx.restore();
    K.screenFX(ctx, t);
    K.chin(ctx, t, led(t));
  }
  function captions(t) {
    let cap = null;
    for (const c of VO.caps) if (t >= c.s && t < c.e) cap = c;
    if (!cap) return;
    let cur = -1;
    cap.words.forEach((x, i) => { if (t >= x[1] - 0.02) cur = i; });
    K.caption(ctx, cap.words.map((x) => ({ w: x[0] })), cur, clamp((t - cap.s) / 0.06, 0, 1));
  }
  // the website's monitor for the outro
  function serverFrame(t) {
    K.caseBack(ctx); K.desktop(ctx, t);
    ctx.save(); K.rr(ctx, K.SCR.x, K.SCR.y, K.SCR.w, K.SCR.h, K.SCR.r); ctx.clip();
    const cr = K.win(ctx, 70, 240, 940, 900, { title: "site.example (server)", icon: "server" });
    K.icon(ctx, "db", cr.x + 40, cr.y + 40, 150);
    K.text(ctx, "users.db", cr.x + 220, cr.y + 84, 7, C.ink, { bold: true });
    K.text(ctx, "ana", cr.x + 40, cr.y + 250, 7, C.ink, { mono: 5 });
    K.text(ctx, HS.scrypt.hash.slice(0, 11), cr.x + 40, cr.y + 360, 9, C.ink, { mono: 5 });
    K.text(ctx, HS.scrypt.hash.slice(11, 22), cr.x + 40, cr.y + 470, 9, C.ink, { mono: 5 });
    if (t > w("l52", "without") - 0.1) { K.icon(ctx, "check", cr.x + 40, cr.y + 630, 120); K.text(ctx, "no password", cr.x + 180, cr.y + 640, 7, C.greenDk, { bold: true }); K.text(ctx, "kept", cr.x + 180, cr.y + 730, 7, C.greenDk, { bold: true }); }
    K.taskbar(ctx, [{ label: "server", icon: "server" }], "7:32 PM", 0, false);
    ctx.restore();
    K.screenFX(ctx, t); K.chin(ctx, t, 1);
  }
  let offA = null, offB = null;
  const MS = 0.37, MW = 1080 * MS, MH = 1920 * MS, MY = 300;
  function outro(t) {
    if (!offA) { offA = document.createElement("canvas"); offA.width = 1080; offA.height = 1920; offB = document.createElement("canvas"); offB.width = 1080; offB.height = 1920; }
    const k = eio((t - tZoom) / 1.2);
    withCtx(offA.getContext("2d"), () => frame(t));
    ctx.fillStyle = "#0b1316"; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "rgba(120,160,170,.18)";
    for (let y = 30; y < 1920; y += 44) for (let x = 22; x < 1080; x += 44) ctx.fillRect(x, y, 3, 3);
    const s = lerp(1, MS, k), x1 = lerp(0, 40, k), y1 = lerp(0, MY, k);
    ctx.drawImage(offA, x1, y1, 1080 * s, 1920 * s);
    if (k <= 0.02) return;
    const x2 = lerp(1200, 1040 - MW, eio((t - tZoom - 0.25) / 1.0));
    withCtx(offB.getContext("2d"), () => serverFrame(t));
    ctx.drawImage(offB, x2, MY, MW, MH);
    const a = clamp((t - tZoom - 1.0) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    K.text(ctx, "a computer", 40 + MW / 2, MY + MH + 30, 5, "#fff", { bold: true, align: "center" });
    K.text(ctx, "the website", x2 + MW / 2, MY + MH + 30, 5, "#fff", { bold: true, align: "center" });
    const lx1 = 40 + MW, lx2 = x2, ly = MY + 230;
    ctx.fillStyle = "#f2c026"; ctx.fillRect(lx1, ly - 5, Math.max(0, lx2 - lx1), 10);
    const p = ((t - tZoom - 1.0) * 0.7) % 1;
    K.icon(ctx, "fingerprint", lerp(lx1 - 10, lx2 - 60, Math.max(0, p)), ly - 36, 72);
    for (let i = 0; i < 12; i++) {
      const ang = rnd(i, 21) * 6.28 + (t - tZoom) * (0.35 + rnd(i, 22) * 0.4) * (i % 2 ? 1 : -1);
      const rad = 60 + rnd(i, 23) * 100, cx = 540 + Math.cos(ang) * rad * 0.62, cy = ly + 170 + Math.sin(ang) * rad * 2.6;
      K.icon(ctx, "magnifier", cx - 28, cy - 28, 46 + (i % 3) * 14);
    }
    ctx.restore();
  }

  return {
    music: { cut: BUBBLES.filter((b) => b[3] === "C").map((b) => [b[0] - 0.25, b[1] + 0.1]), swell: Math.min(tZoom, DUR) },
    cues: cues.sort((a, b) => a.t - b.t), shots: shots.map((s) => ({ name: s.name, t0: +s.t0.toFixed(2) })), T,
    draw(t) {
      if (ctx.reset) ctx.reset();
      if (t >= tZoom) outro(t);
      else frame(t);
      captions(t);
    },
  };
};
