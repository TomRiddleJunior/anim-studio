/* film.js — "Passwords 101" on the TerraOS 96 desktop. One canvas; draw(t) is a pure function of t.
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
  const T = {
    plain: w("l02", "plain"), hashing: w("l02", "hashing"), salt: w("l02", "salt"), rainbow: w("l02", "rainbow"), bcrypt: w("l02", "bcrypt"), argon: w("l02", "argon"),
    youve: S("l03"), l04: S("l04"), l05: S("l05"), l06: S("l06"), l07: S("l07"), l08: S("l08"), l09: S("l09"), l10: S("l10"), l11: S("l11"),
    l12: S("l12"), l13: S("l13"), l14: S("l14"), l15: S("l15"), l16: S("l16"), l17: S("l17"), l18: S("l18"), l19: S("l19"), l20: S("l20"),
    l21: S("l21"), l22: S("l22"), l23: S("l23"), l24: S("l24"), l25: S("l25"), l26: S("l26"), l27: S("l27"), l28: S("l28"), l29: S("l29"),
    l30: S("l30"), l31: S("l31"), l32: S("l32"), l33: S("l33"), l34: S("l34"), l35: S("l35"), l36: S("l36"), l37: S("l37"), l38: S("l38"),
    l39: S("l39"), l40: S("l40"), l41: S("l41"), l42: S("l42"), l43: S("l43"), l44: S("l44"), l45: S("l45"), l46: S("l46"), l47: S("l47"),
    l48: S("l48"), l49: S("l49"), l50: S("l50"), l51: S("l51"), l52: S("l52"),
  };
  const shots = [];
  const shot = (t0, t1, name, draw, tasks) => shots.push({ t0, t1, name, draw, tasks: tasks || [] });

  // ================================================================ S01 title: PASSWORDS 101 (frame 0 = a still)
  const tScr = 0.98;
  shot(0, T.plain - 0.12, "title", (t) => {
    const o = { x: 60, y: 300, w: 960, h: 780, t0: -1, title: "PASSWORDS 101", big: 7, menu: ["File", "Edit", "Search", "Help"], menuRight: "login.txt - Notepad", t1: T.plain - 0.3 };
    win(t, o, (cr) => {
      TX("username:", cr.x + 34, cr.y + 40, 5, C.grey, {});
      TX("ana", cr.x + 34, cr.y + 104, 6, C.ink, { mono: 5 });
      TX("password:", cr.x + 34, cr.y + 210, 5, C.grey, {});
      const hx = H.sunflower42;
      if (t < tScr) TX("sunflower42", cr.x + 34, cr.y + 280, 9, C.ink, { mono: 5 });
      else {
        const sc = scramble("sunflower42", hx.slice(0, 22), t, tScr, 0.55, 3, HEXCH + JUNK);
        const l1 = sc.slice(0, 11), l2 = sc.slice(11, 22);
        TX(l1, cr.x + 34, cr.y + 280, 9, C.ink, { mono: 5 });
        TX(l2, cr.x + 34, cr.y + 390, 9, C.ink, { mono: 5 });
        if (t > tScr + 0.6) TX("… 64 hex characters", cr.x + 34, cr.y + 505, 4, C.grey, {});
      }
      if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = C.ink; ctx.fillRect(cr.x + 34, cr.y + 580, 28, 6); }
    });
    // the fingerprint "tool" icon dragged by the hand cursor onto the password
    const k = eio((t - 0.25) / 0.6);
    if (t < tScr + 0.05) {
      const ix = lerp(880, 330, k), iy = lerp(1170, 620, k);
      IC("fingerprint", ix, iy, 96);
    }
  }, [{ label: "login.txt - Notepad", icon: "doc" }]);
  cue(0.25, "grab", 0.8); cue(tScr - 0.04, "drop", 0.8); cue(tScr, "scramble", 1, { dur: 0.6 });

  // ================================================================ S02 the six terms cascade, then Tile with "?"
  const TERMS = [["plain text", "doc", T.plain], ["hashing", "fingerprint", T.hashing], ["salt", "salt", T.salt], ["rainbow tables", "rainbow", T.rainbow], ["bcrypt", "hourglass", T.bcrypt], ["Argon2", "chip", T.argon]];
  const tMenu = w("l03", "breach") - 0.15, tTile = w("l04", "but") - 0.2;
  shot(T.plain - 0.12, T.l05 - 0.15, "terms", (t) => {
    const tileK = eio((t - tTile) / 0.32);
    TERMS.forEach((tm, i) => {
      const cx = LX + i * 20, cy = 150 + i * 148, cw = 600, chh = 200;
      const col = i % 2, row = Math.floor(i / 2), gx = LX + col * (CW / 2 + 4), gy = 60 + row * 418, gw = CW / 2 - 4, gh = 410;
      const x = lerp(cx, gx, tileK), y = lerp(cy, gy, tileK), ww = lerp(cw, gw, tileK), hh = lerp(chh, gh, tileK);
      const active = tileK > 0 ? true : i === TERMS.filter((q) => q[2] - 0.1 <= t).length - 1;
      win(t, { x, y, w: ww, h: hh, t0: tm[2] - 0.05, title: tm[0], icon: tm[1], active, small: true, fill: "face" }, (cr) => {
        if (tileK < 0.5) { IC(tm[1], cr.x + 18, cr.y + 26, 84); TX(tm[0], cr.x + 122, cr.y + 56, 4, C.ink, { bold: true }); }
        else { IC(tm[1], cr.x + 16, cr.y + 14, 60); TX(tm[0], cr.x + 90, cr.y + 34, 3, C.ink, { bold: true }); IC("question", cr.x + cr.w / 2 - 48, cr.y + cr.h / 2 - 20, 96); }
      });
    });
    if (t > tMenu && t < tTile + 0.05) {
      const hi = t < tMenu + 0.35 ? -1 : 1;
      K.menu(ctx, 690, 1000, ["Cascade", "Tile", "Minimize"], hi, 5);
    }
  }, TERMS.map((q) => ({ label: q[0], icon: q[1] })));
  TERMS.forEach((q) => openCue(q[2] - 0.05, 0.75));
  cue(tMenu, "click", 0.8); cue(tMenu + 0.02, "menu", 0.6); cue(tTile - 0.05, "click", 0.9); cue(tTile, "swoosh", 0.7);

  // ================================================================ S03 sign up with sunflower42
  const tType = w("l05", "password") + 0.05, tSign = E("l05") - 0.05;
  shot(T.l05 - 0.15, T.l06 - 0.08, "signup", (t) => {
    win(t, { x: LX, y: 150, w: CW, h: 860, t0: T.l05 - 0.02, title: "Surf - site.example", icon: "globe" }, (cr) => {
      sunken(cr.x + 10, cr.y + 10, cr.w - 20, 56, "#fff");
      TX("http://site.example/signup", cr.x + 26, cr.y + 26, 3, C.ink, { mono: 5 });
      TX("CREATE ACCOUNT", cr.x + 40, cr.y + 110, 6, C.ink, { bold: true, sp: 0.6 });
      TX("Email", cr.x + 40, cr.y + 210, 4, C.grey, {});
      K.field(ctx, cr.x + 40, cr.y + 250, cr.w - 80, 76, "ana@mail.example", { s: 4 });
      TX("Password", cr.x + 40, cr.y + 360, 4, C.grey, {});
      const pw = typed("sunflower42", t, tType, 12);
      K.field(ctx, cr.x + 40, cr.y + 400, cr.w - 80, 90, pw, { s: 6, mono: 5, caret: t < tSign && Math.floor(t * 3) % 2 === 0 });
      IC("check", cr.x + 40, cr.y + 512, 34); TX("show password", cr.x + 86, cr.y + 520, 3, C.grey, {});
      K.button(ctx, cr.x + cr.w - 300, cr.y + 600, 260, 80, "Sign up", { s: 4, down: t > tSign && t < tSign + 0.15, focus: true });
    });
  }, [{ label: "Surf", icon: "globe" }]);
  openCue(T.l05 - 0.02); typeCues("sunflower42", tType, 12); cue(tSign, "click", 1);

  // ================================================================ S04 every log in, the site checks it
  const tPk = w("l06", "log") - 0.1, tChk = w("l06", "check");
  shot(T.l06 - 0.08, T.l07 - 0.08, "check", (t) => {
    win(t, { x: LX, y: 70, w: CW, h: 330, t0: T.l06 - 0.08, title: "Surf - site.example/login", icon: "globe" }, (cr) => {
      TX("LOG IN", cr.x + 30, cr.y + 26, 5, C.ink, { bold: true });
      K.field(ctx, cr.x + 30, cr.y + 100, cr.w - 300, 76, "ana", { s: 4 });
      K.field(ctx, cr.x + 30, cr.y + 190, cr.w - 300, 76, "sunflower42", { s: 4, mono: 5 });
      K.button(ctx, cr.x + cr.w - 240, cr.y + 190, 210, 76, "Log in", { s: 4, down: t > tPk - 0.05 && t < tPk + 0.1 });
    });
    const k = clamp((t - tPk) / 0.9, 0, 1);
    wire(LX + CW / 2, 410, LX + CW / 2, 880, clamp((t - T.l06) / 0.3, 0, 1));
    if (t > T.l06 + 0.2) { panelLbl(LX + CW / 2 + 30, 620, "internet"); }
    if (t > tPk && t < tChk + 0.1) { const y = lerp(430, 830, eio(k)); IC("doc", LX + CW / 2 - 32, y, 64); TX("sunflower42", LX + CW / 2 + 44, y + 22, 3, "#fff", { mono: 5, shadow: "rgba(0,0,0,.6)" }); }
    win(t, { x: LX, y: 880, w: CW, h: 400, t0: T.l06 + 0.1, title: "site.example (server)", icon: "server" }, (cr) => {
      IC("server", cr.x + 30, cr.y + 40, 120);
      TX("checks the password", cr.x + 190, cr.y + 60, 4, C.ink, {});
      if (t > tChk) { IC("check", cr.x + 190, cr.y + 130, 80); TX("same as before", cr.x + 290, cr.y + 158, 4, C.greenDk, { bold: true }); }
    });
  }, [{ label: "Surf", icon: "globe" }, { label: "server", icon: "server" }]);
  cue(T.l06 - 0.2, "open", 0.7); cue(tPk, "click", 0.9); cue(tPk + 0.05, "send", 0.8); cue(T.l06 + 0.0, "open", 0.6); cue(tChk, "ok", 0.9);
  function panelLbl(x, y, s) { ctx.fillStyle = "#fff"; const ww = K.tw(s, 3, { bold: true }) + 20; ctx.fillRect(x, y, ww, 40); ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, ww - 3, 37); TX(s, x + 10, y + 9, 3, C.ink, { bold: true }); }
  function sunken(x, y, ww, hh, f) { K.sunken(ctx, x, y, ww, hh, f); }

  // ================================================================ S05 users.db in plain text
  const DBW = { x: LX, y: 120, w: CW, h: 640 };
  const tSave = w("l07", "save"), tPlainL = w("l08", "plain");
  function usersTable(cr, t, mode, ex) { // mode: plain | hash | salted
    ex = ex || {};
    const cols = mode === "plain" ? [{ w: 220, title: "user" }, { w: cr.w - 230, title: "password" }] :
      mode === "hash" ? [{ w: 220, title: "user" }, { w: cr.w - 230, title: "hash (SHA-256)" }] :
        [{ w: 180, title: "user" }, { w: 250, title: "salt" }, { w: cr.w - 440, title: "hash" }];
    const rows = USERS.map((u, i) => {
      const vis = ex.rowT ? t > ex.rowT[i] : true;
      const uc = { v: u.user, icon: "u_" + u.user, s: 3, bold: true };
      if (!vis) return mode === "salted" ? [uc, "", ""] : [uc, ""];
      if (mode === "plain") return [uc, { v: u.pw, s: 4, mono: 5, col: ex.red ? C.red : C.ink, bg: ex.rowBg && ex.rowBg[i] }];
      if (mode === "hash") return [uc, { v: short(u.plain_hash, 16), s: 3, mono: 5, bg: ex.rowBg && ex.rowBg[i], col: ex.rowCol && ex.rowCol[i] }];
      const sv = ex.saltK != null ? (ex.saltK > i * 0.18 ? short(u.salt, 8) : "") : short(u.salt, 8);
      return [uc, { v: sv, s: 3, mono: 5, col: "#2a5a9a", bg: ex.saltBg }, { v: short(ex.saltedHash ? u.salted : u.plain_hash, 12), s: 3, mono: 5, bg: ex.rowBg && ex.rowBg[i], col: ex.rowCol && ex.rowCol[i] }];
    });
    return tableRows(cr, cr.x + 6, cr.y + 6, cols, rows, { rh: 84, s: 3 });
  }
  shot(T.l07 - 0.08, T.l09 - 0.06, "plaintext", (t) => {
    win(t, Object.assign({ t0: T.l07, title: "users.db", icon: "db", menu: ["File", "Edit", "View"] }, DBW), (cr) => {
      usersTable(cr, t, "plain", { rowT: [tSave - 0.05, tSave + 0.35, tSave + 0.6, tSave + 0.85] });
    });
    if (t > tPlainL) {
      label(LX + 70, 800, "PLAIN TEXT", { s: 5 });
      TX("anyone can read it", LX + 74, 900, 4, "#fff", { bold: true, shadow: "rgba(0,0,0,.45)" });
    }
  }, [{ label: "users.db", icon: "db" }]);
  openCue(T.l07); [0, 0.35, 0.6, 0.85].forEach((d) => cue(tSave - 0.05 + d, "row", 0.6)); cue(tPlainL, "pop", 0.9);

  // ================================================================ S06 the database leaks (dump.exe)
  const tLeak = w("l09", "leaks"), tThere = w("l09", "every");
  shot(T.l09 - 0.06, T.l10 - 0.06, "leak", (t) => {
    win(t, Object.assign({ t0: -1, title: "users.db", icon: "db", active: false, menu: ["File", "Edit", "View"] }, DBW), (cr) => usersTable(cr, t, "plain", { red: t > tThere }));
    win(t, { x: 460, y: 700, w: 570, h: 560, t0: tLeak - 0.25, title: "dump.exe", icon: "magnifier", red: true, small: true }, (cr) => {
      IC("magnifier", cr.x + 20, cr.y + 22, 90);
      TX(t < tThere ? "Copying users.db…" : "Copied.", cr.x + 130, cr.y + 52, 4, C.ink, { bold: true });
      K.progress(ctx, cr.x + 20, cr.y + 136, cr.w - 40, 46, clamp((t - tLeak) / 0.75, 0, 1), C.red);
      USERS.forEach((u, i) => { if (t > tThere + i * 0.16) TX(u.user + " : " + u.pw, cr.x + 24, cr.y + 220 + i * 56, 4, C.red, { mono: 5, bold: true }); });
    });
    wire(LX + 380, 760, 560, 860, clamp((t - tLeak + 0.2) / 0.4, 0, 1), C.redDk);
  }, [{ label: "users.db", icon: "db" }, { label: "dump.exe", icon: "magnifier" }]);
  cue(tLeak - 0.25, "alarm", 0.7); cue(tLeak, "disk", 0.9, { dur: 0.8 }); USERS.forEach((u, i) => cue(tThere + i * 0.16, "row", 0.6));

  // ================================================================ S07 reuse: one leaked password opens other accounts
  const APPS = [["email", "mail", w("l10", "email")], ["bank", "bank", w("l10", "bank")], ["shop", "cart", w("l10", "everything")], ["cloud", "cloud", w("l10", "everything") + 0.18]];
  shot(T.l10 - 0.06, T.l11 - 0.1, "reuse", (t) => {
    win(t, { x: LX, y: 110, w: CW, h: 1150, t0: T.l10, title: "Accounts", icon: "user", fill: "face" }, (cr) => {
      TX("same password everywhere:", cr.x + 30, cr.y + 30, 4, C.ink, {});
      IC("key", cr.x + 30, cr.y + 90, 80); TX("sunflower42", cr.x + 130, cr.y + 112, 5, C.red, { mono: 5, bold: true });
      APPS.forEach((a, i) => {
        const col = i % 2, row = Math.floor(i / 2), bx = cr.x + 30 + col * (cr.w / 2 - 14), by = cr.y + 250 + row * 400, bw = cr.w / 2 - 46, bh = 360;
        K.panel(ctx, bx, by, bw, bh, "#fff", false);
        IC(a[1], bx + bw / 2 - 64, by + 40, 128);
        TX(a[0], bx + bw / 2, by + 190, 5, C.ink, { bold: true, align: "center" });
        const open = t > a[2];
        IC(open ? "unlock" : "lock", bx + bw / 2 - 40, by + 250, 80);
        if (open && t < a[2] + 0.5) { ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12); }
        if (open) TX("OPEN", bx + bw / 2, by + 336 - 6, 3, C.red, { bold: true, align: "center", sp: 1 });
      });
    });
  }, [{ label: "Accounts", icon: "user" }]);
  openCue(T.l10); APPS.forEach((a) => cue(a[2], "unlock", 0.9));

  // ================================================================ S08-S10 hash.exe: fixed-length fingerprint, same in -> same out, one letter, no way back
  const HW = { x: LX, y: 110, w: CW, h: 1150 };
  const tStore = w("l11", "stores"), tAny = w("l12", "any"), tFixed = w("l12", "fixed"), tSame = w("l13", "same"), tSameOut = w("l13", "output");
  const tChange = w("l14", "change"), tLetter = w("l14", "letter"), tWhole = w("l14", "whole"), tNo = w("l15", "no"), tBack = w("l15", "backwards");
  function hashWin(t, inp, out, opt) {
    opt = opt || {};
    return win(t, Object.assign({ t0: opt.t0 != null ? opt.t0 : -1, title: "hash.exe", icon: "fingerprint", menu: ["File", "Help"] }, HW), (cr) => {
      TX("input", cr.x + 30, cr.y + 26, 4, C.grey, {});
      K.field(ctx, cr.x + 30, cr.y + 70, cr.w - 60, 96, inp, { s: inp.length > 22 ? 3 : 6, mono: 5 });
      if (opt.inHi != null) { const cw2 = 6 * 6; hl(cr.x + 44 + opt.inHi * cw2 - 3, cr.y + 82, cw2, 72, "#ffe04a", 0.55); }
      arrowDown(cr.x + cr.w / 2, cr.y + 190, 150, C.ink);
      IC("fingerprint", cr.x + cr.w / 2 + 40, cr.y + 210, 90); TX("SHA-256", cr.x + cr.w / 2 + 142, cr.y + 238, 4, C.ink, { bold: true });
      TX("output (the fingerprint)", cr.x + 30, cr.y + 370, 4, C.grey, {});
      sunken(cr.x + 30, cr.y + 414, cr.w - 60, 340, "#fff");
      const lines = hexLines(out, 16);
      lines.forEach((ln, i) => {
        if (opt.diff) for (let j = 0; j < ln.length; j++) if (ln[j] !== opt.diff[i * 16 + j]) hl(cr.x + 76 + j * 36 - 3, cr.y + 446 + i * 76 - 6, 34, 60, "#ffe04a", 0.6);
        TX(ln, cr.x + 76, cr.y + 446 + i * 76, 6, C.ink, { mono: 5 });
      });
      if (opt.foot) opt.foot(cr);
    });
  }
  shot(T.l11 - 0.1, T.l13 - 0.08, "hash1", (t) => {
    let inp = "sunflower42", out = H.sunflower42;
    if (t > tAny - 0.05 && t < tFixed - 0.05) {
      const q = Math.floor((t - tAny + 0.05) / ((tFixed - tAny) / 3));
      inp = ["a", "This whole sentence is a single input.", "sunflower42"][clamp(q, 0, 2)];
      out = H[inp];
    }
    const sc = t < tStore ? "" : t < tStore + 0.45 ? scramble("", out, t, tStore, 0.45, 5, HEXCH) : out;
    hashWin(t, inp, sc, { t0: T.l11, foot: (cr) => {
      if (t > tFixed) { label(cr.x + 30, cr.y + 800, "ALWAYS 64 CHARACTERS", { s: 4 }); TX("(256 bits)", cr.x + 30, cr.y + 880, 4, C.grey, {}); }
    } });
    if (t < tStore) {
      ctx.fillStyle = "rgba(0,0,0,0)";
    }
  }, [{ label: "hash.exe", icon: "fingerprint" }]);
  openCue(T.l11); cue(tStore, "scramble", 0.8, { dur: 0.45 }); [0, 1, 2].forEach((q) => cue(tAny + q * (tFixed - tAny) / 3, "tick", 0.7)); cue(tFixed, "pop", 0.8);

  shot(T.l13 - 0.08, T.l14 - 0.08, "hash2", (t) => {
    const inp = typed("sunflower42", t, T.l13 + 0.05, 16);
    const out = t > tSame + 0.25 ? H.sunflower42 : "";
    hashWin(t, inp, out, { foot: (cr) => { if (t > tSameOut) { IC("check", cr.x + 30, cr.y + 790, 80); TX("same input, same output", cr.x + 130, cr.y + 818, 4, C.greenDk, { bold: true }); } } });
  }, [{ label: "hash.exe", icon: "fingerprint" }]);
  typeCues("sunflower42", T.l13 + 0.05, 16, 0.6); cue(tSame + 0.25, "scramble", 0.6, { dur: 0.2 }); cue(tSameOut, "ok", 0.8);

  shot(T.l14 - 0.08, T.l15 - 0.08, "hash3", (t) => {
    const inp = t < tLetter ? "sunflower42" : "sunflower43";
    const out = t < tWhole ? H.sunflower42 : scramble(H.sunflower42, H.sunflower43, t, tWhole, 0.5, 9, HEXCH);
    hashWin(t, inp, out, { inHi: t > tLetter ? 10 : null, diff: t > tWhole + 0.5 ? H.sunflower42 : null, foot: (cr) => {
      if (t > tWhole + 0.55) TX(HS.diff_chars + " of 64 characters changed", cr.x + 30, cr.y + 812, 5, C.ink, { bold: true });
    } });
  }, [{ label: "hash.exe", icon: "fingerprint" }]);
  cue(tLetter, "key", 0.9); cue(tWhole, "scramble", 0.9, { dur: 0.5 });

  shot(T.l15 - 0.08, T.l16 - 0.08, "hash4", (t) => {
    hashWin(t, "sunflower42", H.sunflower42, {});
    // a reverse arrow, then the error box
    if (t > tNo - 0.1) {
      ctx.save(); ctx.translate(LX + 120, 0);
      ctx.fillStyle = C.red; ctx.fillRect(-6, 330, 12, 230); ctx.beginPath(); ctx.moveTo(-26, 340); ctx.lineTo(26, 340); ctx.lineTo(0, 300); ctx.closePath(); ctx.fill();
      TX("?", 30, 400, 8, C.red, { bold: true }); ctx.restore();
    }
    win(t, { x: 380, y: 560, w: 640, h: 330, t0: w("l15", "practical"), title: "hash.exe", icon: "error", small: true, fill: "face", shake: tBack }, (cr) => {
      IC("error", cr.x + 26, cr.y + 30, 90);
      TX("Can't run a hash", cr.x + 140, cr.y + 40, 4, C.ink, { bold: true });
      TX("backwards.", cr.x + 140, cr.y + 90, 4, C.ink, { bold: true });
      TX("There is no undo.", cr.x + 140, cr.y + 150, 3, C.grey, {});
      K.button(ctx, cr.x + cr.w / 2 - 90, cr.y + cr.h - 84, 180, 64, "OK", { s: 4, focus: true });
    });
  }, [{ label: "hash.exe", icon: "fingerprint" }]);
  cue(w("l15", "practical"), "error", 1);

  // ================================================================ S11 login compares fingerprints; never keeps the password
  const tCmp = w("l16", "compares"), tHashes = w("l16", "hashes"), tKeep = w("l17", "keep");
  shot(T.l16 - 0.08, T.l18 - 0.7, "login", (t) => {
    win(t, { x: LX, y: 70, w: CW, h: 300, t0: T.l16 - 0.05, title: "Surf - site.example/login", icon: "globe", active: false }, (cr) => {
      TX("LOG IN", cr.x + 30, cr.y + 26, 5, C.ink, { bold: true });
      K.field(ctx, cr.x + 30, cr.y + 100, cr.w - 60, 80, "sunflower42", { s: 5, mono: 5 });
    });
    win(t, { x: LX, y: 420, w: CW, h: 330, t0: tHashes - 0.1, title: "hash.exe", icon: "fingerprint", small: true }, (cr) => {
      IC("fingerprint", cr.x + 24, cr.y + 30, 80);
      TX("typed now:", cr.x + 130, cr.y + 34, 4, C.grey, {});
      TX(short(H.sunflower42, 16), cr.x + 130, cr.y + 84, 5, C.ink, { mono: 5 });
      if (t > tCmp) { TX("stored:", cr.x + 130, cr.y + 160, 4, C.grey, {}); TX(short(H.sunflower42, 16), cr.x + 130, cr.y + 210, 5, C.ink, { mono: 5 }); }
    });
    win(t, { x: LX, y: 800, w: CW, h: 460, t0: T.l16 + 0.1, title: "users.db", icon: "db", small: true, active: false }, (cr) => {
      tableRows(cr, cr.x + 6, cr.y + 6, [{ w: 220, title: "user" }, { w: cr.w - 230, title: "hash" }], [[{ v: "ana", icon: "u_ana", bold: true }, { v: short(H.sunflower42, 16), mono: 5, bg: t > tCmp ? "#d9f5df" : null }]], { rh: 84 });
      if (t > tCmp + 0.2) { IC("check", cr.x + 40, cr.y + 210, 80); TX("MATCH! welcome", cr.x + 140, cr.y + 236, 4, C.greenDk, { bold: true }); }
      if (t > tKeep) stamp(cr.x + cr.w / 2, cr.y + 360, "NO PASSWORD STORED", C.red, (t - tKeep) / 0.4);
    });
  }, [{ label: "Surf", icon: "globe" }, { label: "hash.exe", icon: "fingerprint" }, { label: "users.db", icon: "db" }]);
  cue(T.l16 - 0.2, "open", 0.6); cue(tHashes - 0.2, "open", 0.7); cue(tCmp + 0.2, "ok", 1); cue(tKeep, "stamp", 0.9);

  // ================================================================ S12/S13 SIMPLE. / PROBLEM. (presenter dragged to centre)
  shot(T.l18 - 0.7, T.l20 - 0.2, "simple", () => {}, []);

  // ================================================================ S14 crack.exe: they guess
  const GUESS = ["123456", "password", "qwerty", "111111", "iloveyou", "dragon", "letmein", "sunflower42"];
  const tG0 = w("l20", "they") - 0.05, tMatch = w("l21", "matches");
  shot(T.l20 - 0.2, T.l22 - 0.08, "crack", (t) => {
    win(t, { x: LX, y: 90, w: CW, h: 1180, t0: T.l20 - 0.05, title: "crack.exe", icon: "magnifier", red: true }, (cr) => {
      TX("target:", cr.x + 26, cr.y + 26, 4, C.grey, {}); TX(short(H.sunflower42, 16), cr.x + 200, cr.y + 26, 4, C.ink, { mono: 5, bold: true });
      IC("wordlist", cr.x + 26, cr.y + 90, 60); TX("common.txt", cr.x + 100, cr.y + 108, 4, C.ink, { bold: true });
      const step = (tMatch - tG0) / GUESS.length;
      GUESS.forEach((g, i) => {
        const ti = tG0 + i * step;
        if (t < ti) return;
        const y = cr.y + 190 + i * 104, ok = i === GUESS.length - 1;
        if (ok) hl(cr.x + 14, y - 14, cr.w - 28, 80, "#c9f2d3", 1);
        TX(g, cr.x + 26, y, 4, C.ink, { mono: 5 });
        TX("→ " + short(H[g], 8), cr.x + 300, y, 4, C.grey, { mono: 5 });
        if (t > ti + step * 0.5 || ok) IC(ok ? "check" : "error", cr.x + cr.w - 90, y - 10, 56);
      });
      if (t > tMatch + 0.15) TX("FOUND: sunflower42", cr.x + 26, cr.y + 1040, 5, C.greenDk, { bold: true });
    });
  }, [{ label: "crack.exe", icon: "magnifier" }]);
  openCue(T.l20 - 0.05); GUESS.forEach((g, i) => cue(tG0 + i * (tMatch - tG0) / GUESS.length, i === GUESS.length - 1 ? "ok" : "tick", 0.7));

  // ================================================================ S15 rainbow tables
  const tRb = w("l22", "rainbow"), tPre = w("l22", "precomputed");
  shot(T.l22 - 0.08, T.l23 - 0.08, "rainbow", (t) => {
    win(t, { x: LX, y: 90, w: CW, h: 1180, t0: T.l22, title: "rainbow.tbl", icon: "rainbow" }, (cr) => {
      const cols = ["#e8423c", "#f39a2b", "#f5d531", "#3fb64b", "#2f8ee0", "#7b49d6"];
      for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(cr.x, cr.y + i * 10, cr.w, 10); }
      TX("precomputed: hash → password", cr.x + 24, cr.y + 88, 3, C.ink, { bold: true });
      const scroll = Math.max(0, t - tPre) * 260;
      ctx.save(); ctx.beginPath(); ctx.rect(cr.x, cr.y + 140, cr.w, cr.h - 260); ctx.clip();
      const keys = Object.keys(H).filter((k) => k.length < 14);
      for (let i = -1; i < 16; i++) {
        const n = i + Math.floor(scroll / 72), y = cr.y + 150 + i * 72 - (scroll % 72);
        const kk = keys[((n % keys.length) + keys.length) % keys.length];
        const fake = (rnd(n, 77) * 1e16).toString(16).slice(0, 8);
        ctx.fillStyle = n % 2 ? "#f3f3ee" : "#fff"; ctx.fillRect(cr.x, y, cr.w, 72);
        ctx.fillStyle = cols[((n % 6) + 6) % 6]; ctx.fillRect(cr.x, y, 12, 72);
        TX((n % 3 === 0 ? H[kk].slice(0, 8) : fake) + "…", cr.x + 30, y + 22, 4, C.ink, { mono: 5 });
        TX("→ " + (n % 3 === 0 ? kk : "pw" + ((n * 7919) % 99991)), cr.x + 330, y + 22, 4, C.ink, { mono: 5 });
      }
      ctx.restore();
      if (t > tRb) { const ww = label(cr.x + 24, cr.y + cr.h - 100, "LOOKUP: INSTANT", { s: 4 }); }
    });
  }, [{ label: "rainbow.tbl", icon: "rainbow" }]);
  openCue(T.l22); cue(tPre, "disk", 0.6, { dur: 1.2 }); cue(tRb, "pop", 0.7);

  // ================================================================ S16 identical hashes
  const tSameH = w("l23", "same", 1), tCrack = w("l23", "crack"), tBoth = w("l23", "both");
  shot(T.l23 - 0.08, T.l24 - 0.1, "identical", (t) => {
    win(t, Object.assign({ t0: T.l23, title: "users.db", icon: "db", menu: ["File", "Edit", "View"] }, DBW), (cr) => {
      const bg = [null, t > tSameH ? "#fff1a8" : null, t > tSameH ? "#fff1a8" : null, null];
      const col = [null, t > tCrack ? C.red : null, t > tBoth ? C.red : null, null];
      usersTable(cr, t, "hash", { rowBg: bg, rowCol: col });
    });
    if (t > tSameH) { ctx.strokeStyle = C.amber; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(RX + 2, 330); ctx.lineTo(RX + 18, 330); ctx.lineTo(RX + 18, 414); ctx.lineTo(RX + 2, 414); ctx.stroke(); }
    if (t > tSameH + 0.2) { label(LX + 70, 800, "SAME HASH", { s: 5 }); TX("same password", LX + 74, 900, 4, "#fff", { bold: true, shadow: "rgba(0,0,0,.45)" }); }
    if (t > tCrack) TX("ben = 123456", LX + 74, 960, 4, "#ffd2d2", { bold: true, mono: 5, shadow: "rgba(0,0,0,.5)" });
    if (t > tBoth) TX("cy  = 123456", LX + 74, 1012, 4, "#ffd2d2", { bold: true, mono: 5, shadow: "rgba(0,0,0,.5)" });
    if (t > tBoth) stamp(LX + CW / 2 + 140, 1130, "2 CRACKED", "#ff5a5a", (t - tBoth) / 0.4);
  }, [{ label: "users.db", icon: "db" }]);
  openCue(T.l23); cue(tSameH, "pop", 0.8); cue(tCrack, "stamp", 0.7); cue(tBoth, "stamp", 0.9);

  // ================================================================ S17 salt generator (the source's key-pair generator)
  const tRand = w("l25", "random"), tUnique = w("l25", "unique"), tMixed = w("l25", "mixed");
  shot(T.l24 - 0.1, T.l26 - 0.08, "saltgen", (t) => {
    win(t, { x: LX, y: 90, w: CW, h: 1190, t0: T.l24, title: "Salt Generator", icon: "salt" }, (cr) => {
      TX("Collecting randomness", cr.x + 26, cr.y + 22, 5, C.ink, { bold: true });
      sunken(cr.x + 26, cr.y + 90, cr.w - 52, 330, "#fff");
      const n = Math.floor(clamp((t - T.l24) / 2.0, 0, 1) * 60);
      for (let i = 0; i < n; i++) { const x = cr.x + 50 + rnd(i, 4) * (cr.w - 110), y = cr.y + 110 + rnd(i, 5) * 280; ctx.fillStyle = i % 3 ? "#111" : "#888"; ctx.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, 12, 12); }
      K.progress(ctx, cr.x + 26, cr.y + 440, cr.w - 52, 50, clamp((t - T.l24) / 2.0, 0, 1));
      TX(t < tRand ? "Generating…" : "salt (16 random bytes):", cr.x + 26, cr.y + 520, 4, C.ink, { bold: true });
      if (t > tRand) { const s = typed(USERS[0].salt, t, tRand, 60); TX(s.slice(0, 16), cr.x + 26, cr.y + 580, 5, "#2a5a9a", { mono: 5 }); TX(s.slice(16), cr.x + 26, cr.y + 650, 5, "#2a5a9a", { mono: 5 }); }
      if (t > tUnique) {
        USERS.forEach((u, i) => { if (t < tUnique + i * 0.14) return; const x = cr.x + 26 + i * 160; IC("u_" + u.user, x, cr.y + 740, 70); TX(u.salt.slice(0, 6), x, cr.y + 824, 3, "#2a5a9a", { mono: 5 }); });
      }
      if (t > tMixed) {
        const y = cr.y + 900;
        IC("salt", cr.x + 30, y, 64); TX("+", cr.x + 104, y + 18, 5, C.ink, { bold: true }); IC("key", cr.x + 140, y, 64);
        arrowRight(cr.x + 214, y + 32, 70, C.ink); IC("fingerprint", cr.x + 294, y, 64);
        arrowRight(cr.x + 368, y + 32, 70, C.ink); TX(short(USERS[0].salted, 6), cr.x + 450, y + 20, 4, C.ink, { mono: 5 });
        TX("salt + password → hash", cr.x + 30, y + 100, 4, C.grey, {});
      }
    });
  }, [{ label: "Salt Generator", icon: "salt" }]);
  openCue(T.l24); cue(T.l24 + 0.1, "noise", 0.6, { dur: 1.9 }); cue(tRand, "ok", 0.7); cue(tUnique, "pop", 0.6); cue(tMixed, "swoosh", 0.6);

  // ================================================================ S18-S20 salt column, different hashes, tables useless
  const tSecret = w("l26", "secret"), tNext = w("l26", "stored"), tDiff = w("l27", "different"), tUseless = w("l28", "useless"), tEach = w("l28", "each");
  shot(T.l26 - 0.08, T.l28 - 0.08, "saltcol", (t) => {
    const salted = t > tDiff - 0.1;
    win(t, Object.assign({ t0: T.l26, title: "users.db", icon: "db", menu: ["File", "Edit", "View"] }, DBW), (cr) => {
      const sk = clamp((t - tNext) / 0.6, 0, 1);
      const bg = salted ? [null, "#d9ecff", "#ffe0e0", null] : null;
      usersTable(cr, t, "salted", { saltK: sk, saltedHash: salted, rowBg: bg, saltBg: t > tNext && t < tNext + 0.8 ? "#e8f2ff" : null });
    });
    if (t > tSecret) { label(LX + 70, 800, "NOT SECRET", { s: 5 }); if (t > tNext) TX("stored next to the hash", LX + 74, 900, 4, "#fff", { bold: true, shadow: "rgba(0,0,0,.45)" }); }
    if (salted) {
      label(LX + 70, 960, "ben " + short(USERS[1].salted, 8), { s: 4, col: "#1d4f8f" });
      TX("≠", LX + 120, 1034, 7, "#fff", { bold: true, shadow: "rgba(0,0,0,.45)" });
      label(LX + 70, 1100, "cy  " + short(USERS[2].salted, 8), { s: 4, col: C.redDk });
      TX("both: 123456", LX + 74, 1196, 4, "#fff", { bold: true, shadow: "rgba(0,0,0,.45)" });
    }
  }, [{ label: "users.db", icon: "db" }]);
  openCue(T.l26); cue(tSecret, "pop", 0.8); cue(tNext, "row", 0.7); cue(tDiff - 0.1, "scramble", 0.7, { dur: 0.3 });

  shot(T.l28 - 0.08, T.l29 - 0.12, "useless", (t) => {
    win(t, { x: LX, y: 90, w: CW, h: 520, t0: T.l28, title: "rainbow.tbl", icon: "rainbow", active: false }, (cr) => {
      TX("lookup " + short(USERS[1].salted, 8), cr.x + 24, cr.y + 30, 4, C.ink, { mono: 5 });
      if (t > tUseless - 0.3) { IC("error", cr.x + 24, cr.y + 110, 90); TX("0 matches", cr.x + 136, cr.y + 136, 6, C.red, { bold: true }); }
      if (t > tUseless) stamp(cr.x + cr.w - 200, cr.y + 330, "USELESS", C.red, (t - tUseless) / 0.4);
    });
    win(t, { x: LX, y: 660, w: CW, h: 620, t0: tEach - 0.25, title: "crack.exe", icon: "magnifier", red: true, small: true }, (cr) => {
      TX("one account at a time:", cr.x + 24, cr.y + 24, 4, C.ink, { bold: true });
      USERS.forEach((u, i) => {
        const y = cr.y + 100 + i * 110, tt = tEach + 0.1 + i * 0.35;
        IC("u_" + u.user, cr.x + 24, y, 70);
        K.progress(ctx, cr.x + 120, y + 10, cr.w - 150, 50, i === 0 ? clamp((t - tt) / 1.4, 0, 1) * 0.8 : clamp((t - tt) / 3, 0, 0.12), i === 0 ? C.red : C.lgrey);
      });
    });
  }, [{ label: "rainbow.tbl", icon: "rainbow" }, { label: "crack.exe", icon: "magnifier" }]);
  openCue(T.l28); cue(tUseless - 0.3, "error", 0.8); cue(tUseless, "stamp", 0.8); cue(tEach - 0.25, "open", 0.7);

  // ================================================================ S21 the catch: fast by design
  const tSha = w("l29", "sha"), tFast = w("l29", "fast");
  shot(T.l29 - 0.12, T.l30 - 0.1, "fast", (t) => {
    win(t, { x: LX, y: 200, w: CW, h: 760, t0: tSha - 0.3, title: "Benchmark", icon: "stopwatch" }, (cr) => {
      TX("SHA-256", cr.x + 30, cr.y + 30, 7, C.ink, { bold: true });
      TX("general-purpose hash", cr.x + 30, cr.y + 120, 4, C.grey, {});
      TX("speed", cr.x + 30, cr.y + 230, 4, C.ink, { bold: true });
      const k = eo((t - tSha) / 1.1);
      K.progress(ctx, cr.x + 30, cr.y + 280, cr.w - 60, 70, k, C.green);
      TX("slow", cr.x + 30, cr.y + 370, 3, C.grey, {}); TX("FAST", cr.x + cr.w - 30, cr.y + 370, 3, C.greenDk, { bold: true, align: "right" });
      if (t > tFast) { IC("spark", cr.x + 30, cr.y + 470, 100); TX("built for speed", cr.x + 150, cr.y + 500, 5, C.greenDk, { bold: true }); }
    });
  }, [{ label: "Benchmark", icon: "stopwatch" }]);
  cue(tSha - 0.3, "open", 0.7); cue(tSha, "riser", 0.6, { dur: 1.1 }); cue(tFast, "pop", 0.8);

  // ================================================================ S22 one graphics card: billions of guesses a second
  const tGpu = w("l30", "graphics"), tBil = w("l30", "billions");
  function gpuWin(t, t0, rateFn, opt) {
    opt = opt || {};
    return win(t, { x: LX, y: 110, w: CW, h: 960, t0, title: "System Monitor", icon: "monitor" }, (cr) => {
      IC("gpu", cr.x + 24, cr.y + 22, 100); TX("graphics card", cr.x + 140, cr.y + 34, 4, C.ink, { bold: true });
      const use = opt.use != null ? opt.use : clamp((t - t0) / 1.0, 0, 1);
      TX("GPU usage: " + Math.round(use * 100) + "%", cr.x + 140, cr.y + 84, 4, C.ink, {});
      ctx.fillStyle = "#050805"; ctx.fillRect(cr.x + 24, cr.y + 160, cr.w - 48, 420);
      ctx.strokeStyle = "#174d22"; ctx.lineWidth = 2;
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cr.x + 24, cr.y + 160 + i * 70); ctx.lineTo(cr.x + cr.w - 24, cr.y + 160 + i * 70); ctx.stroke(); }
      ctx.strokeStyle = "#3ed268"; ctx.lineWidth = 5; ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const tt = t - (60 - i) * 0.05, u = opt.useAt ? opt.useAt(tt) : clamp((tt - t0) / 1.0, 0, 1);
        const v = u * (0.92 + 0.06 * Math.sin(i * 1.7 + t * 9));
        const x = cr.x + 24 + i * (cr.w - 48) / 60, y = cr.y + 570 - v * 390;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      const r = rateFn(t);
      TX("guesses per second", cr.x + 24, cr.y + 620, 4, C.grey, {});
      TX(r[0], cr.x + 24, cr.y + 680, 8, r[1] || C.ink, { bold: true });
      if (r[2]) TX(r[2], cr.x + 24, cr.y + 800, 4, C.ink, { mono: 5 });
    });
  }
  shot(T.l30 - 0.1, T.l31 - 0.08, "gpu", (t) => {
    gpuWin(t, tGpu - 0.2, (tt) => {
      if (tt < tBil) return ["…", C.grey];
      const n = Math.floor((tt - tBil) * 1e10);
      return ["BILLIONS", C.greenDk, "tried: " + n.toLocaleString("en-US")];
    });
    if (t > tBil + 0.6) { ctx.fillStyle = "#fff"; ctx.fillRect(LX - 6, 66, 260, 44); ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.strokeRect(LX - 4, 68, 256, 40); TX("Not Responding", LX + 8, 78, 3, C.ink, { bold: true }); }
  }, [{ label: "System Monitor", icon: "monitor" }]);
  cue(tGpu - 0.2, "open", 0.7); cue(tGpu, "fan", 0.8, { dur: 3.6 }); cue(tBil, "riser", 0.6, { dur: 0.8 });

  // ================================================================ S23 salted or not, weak passwords fall
  const tFalls = w("l31", "falls"), tShort = w("l31", "short");
  shot(T.l31 - 0.08, T.l32 - 0.1, "falls", (t) => {
    win(t, { x: LX, y: 110, w: CW, h: 1150, t0: T.l31, title: "crack.exe", icon: "magnifier", red: true }, (cr) => {
      TX("salted hashes, one by one", cr.x + 24, cr.y + 24, 4, C.ink, { bold: true });
      USERS.forEach((u, i) => {
        const y = cr.y + 110 + i * 230, tt = tShort - 0.3 + i * 0.55;
        IC("u_" + u.user, cr.x + 24, y, 90);
        TX(u.user, cr.x + 136, y + 10, 5, C.ink, { bold: true });
        TX("salt " + u.salt.slice(0, 8), cr.x + 136, y + 70, 3, "#2a5a9a", { mono: 5 });
        if (t > tt) { TX("cracked: " + u.pw, cr.x + 136, y + 120, 4, C.red, { mono: 5, bold: true }); stamp(cr.x + cr.w - 130, y + 50, "FOUND", C.red, (t - tt) / 0.3, -0.12); }
      });
    });
  }, [{ label: "crack.exe", icon: "magnifier" }]);
  openCue(T.l31); USERS.forEach((u, i) => cue(tShort - 0.3 + i * 0.55, "stamp", 0.7));

  // ================================================================ S24 why not slow on purpose?
  const tSlowW = w("l32", "slow");
  shot(T.l32 - 0.1, T.l33 - 0.1, "slow", (t) => {
    win(t, { x: LX, y: 260, w: 340, h: 520, t0: T.l32, title: "fast", icon: "spark", small: true, active: false }, (cr) => {
      IC("spark", cr.x + cr.w / 2 - 60, cr.y + 40, 120); TX("SHA-256", cr.x + cr.w / 2, cr.y + 200, 5, C.ink, { bold: true, align: "center" }); TX("fast", cr.x + cr.w / 2, cr.y + 270, 4, C.greenDk, { bold: true, align: "center" });
      TX("for files", cr.x + cr.w / 2, cr.y + 320, 3, C.grey, { align: "center" });
    });
    win(t, { x: LX + 365, y: 260, w: 340, h: 520, t0: tSlowW - 0.1, title: "slow", icon: "hourglass", small: true }, (cr) => {
      IC("hourglass", cr.x + cr.w / 2 - 60, cr.y + 40, 120, { rot: (t - tSlowW) * 2.5 }); TX("on purpose", cr.x + cr.w / 2, cr.y + 200, 5, C.ink, { bold: true, align: "center" });
      TX("for passwords", cr.x + cr.w / 2, cr.y + 270, 4, C.purple, { bold: true, align: "center" });
    });
  }, [{ label: "fast", icon: "spark" }, { label: "slow", icon: "hourglass" }]);
  openCue(T.l32); openCue(tSlowW - 0.1);

  // ================================================================ S25 the Slow Hash Setup Wizard
  const tB = w("l34", "bcrypt"), tS = w("l34", "scrypt"), tA = w("l34", "argon2"), tRep = w("l34", "repeat"), tCost = w("l34", "cost"), tRaise = w("l34", "raise");
  const tMem = w("l35", "memory"), tGC = w("l35", "graphics"), tExp = w("l35", "expensive"), tFrac = w("l36", "fraction"), tLogin = w("l36", "login");
  const tBil2 = w("l37", "billions"), tThou = w("l37", "thousands");
  function wizard(t, step, title, body) {
    return win(t, { x: LX - 10, y: 80, w: CW + 20, h: 1200, t0: T.l33, title: "Slow Hash Setup", icon: "hourglass", fill: "face" }, (cr) => {
      // left banner
      const g = ctx.createLinearGradient(0, cr.y, 0, cr.y + cr.h); g.addColorStop(0, "#0a2479"); g.addColorStop(1, "#2a9ad2");
      ctx.fillStyle = g; ctx.fillRect(cr.x + 10, cr.y + 10, 170, cr.h - 120);
      IC("lock", cr.x + 45, cr.y + 40, 100); IC("hourglass", cr.x + 45, cr.y + 170, 100);
      if (step) TX(step, cr.x + 210, cr.y + 22, 3, C.grey, {});
      if (title) TX(title, cr.x + 210, cr.y + 62, 4, C.ink, { bold: true });
      body(cr, cr.x + 210, cr.y + 140, cr.w - 230);
      ctx.fillStyle = C.faceSh; ctx.fillRect(cr.x + 10, cr.y + cr.h - 100, cr.w - 20, 3);
      K.button(ctx, cr.x + cr.w - 560, cr.y + cr.h - 80, 170, 64, "< Back", { s: 3 });
      K.button(ctx, cr.x + cr.w - 380, cr.y + cr.h - 80, 170, 64, step && step.startsWith("Step 3") && t > tFrac - 0.4 ? "Finish" : "Next >", { s: 3, focus: true });
      K.button(ctx, cr.x + cr.w - 190, cr.y + cr.h - 80, 170, 64, "Cancel", { s: 3 });
    });
  }
  shot(T.l33 - 0.1, T.l36 - 0.08, "wizard", (t) => {
    if (t < tB - 0.05) {
      wizard(t, "", "", (cr, x, y, ww) => {
        TX("Welcome to", x, y - 60, 4, C.ink, {});
        TX("SLOW", x, y + 20, 13, C.ink, { bold: true, sp: 1 });
        TX("HASH", x, y + 160, 13, C.ink, { bold: true, sp: 1 });
        TX("Setup Wizard", x, y + 300, 5, C.ink, { bold: true });
        TX("for storing passwords", x, y + 370, 4, C.navy, {});
      });
    } else if (t < tCost - 0.1) {
      wizard(t, "Step 1 of 3", "Choose an algorithm", (cr, x, y, ww) => {
        const opts = [["SHA-256", "fast - not for passwords", -1], ["bcrypt", "slow, adjustable cost", tB], ["scrypt", "slow + memory-hard", tS], ["Argon2id", "slow + memory-hard", tA]];
        opts.forEach((o, i) => {
          const yy = y + i * 150, on = o[2] > 0 && t > o[2];
          if (on && i === 3) hl(x - 10, yy - 14, ww, 128, "#dfe8ff", 1);
          K.radio(ctx, x, yy, i === 3 && t > tA + 0.1 ? 1 : 0, 40);
          TX(o[0], x + 60, yy + 2, 5, i === 0 ? C.lgrey : C.ink, { bold: true });
          TX(o[1], x + 60, yy + 62, 3, i === 0 ? C.lgrey : on ? C.navy : C.grey, {});
          if (on && t < o[2] + 0.4) { ctx.strokeStyle = C.navy; ctx.lineWidth = 4; ctx.strokeRect(x - 12, yy - 16, ww, 132); }
        });
        if (t > tRep) {
          const yy = y + 640; IC("gear", x, yy, 90, { rot: (t - tRep) * 4 }); TX("repeat the work", x + 110, yy + 10, 4, C.ink, { bold: true });
          TX("× " + Math.min(4096, Math.floor((t - tRep) * 1400)).toLocaleString("en-US") + " rounds", x + 110, yy + 56, 4, C.navy, { mono: 5 });
        }
      });
    } else if (t < T.l35 - 0.1) {
      wizard(t, "Step 2 of 3", "Set the cost", (cr, x, y, ww) => {
        TX("work per guess", x, y, 4, C.ink, {});
        const k = 0.45 + 0.4 * eio((t - tRaise) / 0.8);
        sunken(x, y + 70, ww - 20, 24, C.face);
        const kx = x + (ww - 60) * k;
        K.panel(ctx, kx, y + 46, 40, 72, C.face, true);
        TX("low", x, y + 140, 3, C.grey, {}); TX("high", x + ww - 20, y + 140, 3, C.grey, { align: "right" });
        TX("cost: " + (t > tRaise + 0.4 ? "12" : t > tRaise ? "11" : "10"), x, y + 220, 6, C.navy, { bold: true, mono: 5 });
        if (t > tRaise) { IC("pc", x, y + 340, 100); TX("faster computers?", x + 120, y + 360, 4, C.ink, {}); TX("raise the cost", x + 120, y + 410, 4, C.navy, { bold: true }); }
      });
    } else {
      wizard(t, "Step 3 of 3", "Memory per guess", (cr, x, y, ww) => {
        const k = clamp((t - tMem + 0.2) / 1.0, 0, 1);
        TX("each guess fills", x, y, 4, C.ink, {});
        for (let i = 0; i < 24; i++) {
          const cx = x + (i % 6) * 78, cy = y + 60 + Math.floor(i / 6) * 80;
          IC(i < k * 24 ? "chip" : "doc", cx, cy, 64, { alpha: i < k * 24 ? 1 : 0.15 });
        }
        if (t > tMem) TX("19 MiB (Argon2id baseline)", x, y + 420, 3, C.navy, { bold: true });
        if (t > tGC) {
          IC("gpu", x, y + 520, 100);
          TX("thousands of cores,", x + 120, y + 524, 4, C.ink, {}); TX("not enough memory", x + 120, y + 574, 4, C.red, { bold: true });
        }
        if (t > tExp) stamp(x + ww / 2, y + 760, "COST $$$", C.red, (t - tExp) / 0.4);
      });
    }
  }, [{ label: "Slow Hash Setup", icon: "hourglass" }]);
  openCue(T.l33); [tB, tS, tA].forEach((tt) => cue(tt, "click", 0.7)); cue(tB - 0.05, "page", 0.7); cue(tRep, "gear", 0.6, { dur: 1.2 });
  cue(tCost - 0.1, "page", 0.7); cue(tRaise, "slide", 0.7); cue(T.l35 - 0.1, "page", 0.7); cue(tMem - 0.2, "disk", 0.7, { dur: 1.0 }); cue(tExp, "stamp", 0.9);

  shot(T.l36 - 0.08, T.l38 - 0.25, "result", (t) => {
    if (t < T.l37 - 0.1) {
      win(t, { x: LX, y: 280, w: CW, h: 700, t0: T.l36, title: "Slow Hash Setup", icon: "check", fill: "face" }, (cr) => {
        IC("check", cr.x + 30, cr.y + 30, 100); TX("Done.", cr.x + 150, cr.y + 60, 7, C.ink, { bold: true });
        IC("stopwatch", cr.x + 30, cr.y + 220, 100);
        TX("one login check", cr.x + 150, cr.y + 230, 4, C.ink, {});
        const sec = HS.scrypt.seconds, k = clamp((t - tLogin) / 0.6, 0, 1);
        TX((sec * k).toFixed(2) + " s", cr.x + 150, cr.y + 290, 8, C.navy, { bold: true, mono: 5 });
        TX("scrypt " + HS.scrypt.params + ", this PC", cr.x + 30, cr.y + 420, 3, C.grey, {});
        if (t > tFrac) TX("a fraction of a second", cr.x + 30, cr.y + 500, 4, C.greenDk, { bold: true });
      });
    } else {
      gpuWin(t, T.l37 - 0.1, (tt) => {
        if (tt < tThou) return ["BILLIONS", C.greenDk, ""];
        return ["THOUSANDS", C.red, ""];
      }, { useAt: () => 1 });
      if (t > tThou) stamp(LX + CW / 2, 1150, "SLOW HASH ON", C.navy, (t - tThou) / 0.4);
    }
  }, [{ label: "Slow Hash Setup", icon: "check" }, { label: "System Monitor", icon: "monitor" }]);
  cue(T.l36 - 0.1, "ok", 0.8); cue(tLogin, "tick", 0.7); cue(T.l37 - 0.25, "open", 0.7); cue(tThou, "down", 0.9); cue(tThou + 0.1, "stamp", 0.8);

  // ================================================================ S26 BUT WAIT… (presenter centre) ; S27-S29 forgot password + mail
  shot(T.l38 - 0.25, T.l39 - 0.1, "butwait", () => {}, []);
  const tForgot = w("l39", "forgot"), tMail = w("l40", "email"), tRead = w("l40", "read"), tReset = w("l41", "reset"), tNever = w("l41", "never");
  shot(T.l39 - 0.1, T.l40 - 0.1, "forgot", (t) => {
    win(t, { x: LX, y: 260, w: CW, h: 700, t0: T.l39 - 0.05, title: "Surf - site.example/login", icon: "globe" }, (cr) => {
      TX("LOG IN", cr.x + 30, cr.y + 30, 5, C.ink, { bold: true });
      K.field(ctx, cr.x + 30, cr.y + 110, cr.w - 60, 80, "ana", { s: 4 });
      K.field(ctx, cr.x + 30, cr.y + 220, cr.w - 60, 80, "", { s: 4 });
      K.button(ctx, cr.x + 30, cr.y + 340, 220, 76, "Log in", { s: 4 });
      const hov = t > tForgot - 0.15;
      TX("Forgot password?", cr.x + 30, cr.y + 470, 5, hov ? "#c81e1e" : "#1d4fd8", { bold: true });
      ctx.fillStyle = hov ? "#c81e1e" : "#1d4fd8"; ctx.fillRect(cr.x + 30, cr.y + 470 + 48, K.tw("Forgot password?", 5, { bold: true }), 5);
    });
  }, [{ label: "Surf", icon: "globe" }]);
  openCue(T.l39 - 0.05); cue(tForgot + 0.1, "click", 1);
  shot(T.l40 - 0.1, T.l42 - 0.12, "mail", (t) => {
    win(t, { x: LX, y: 90, w: CW, h: 1190, t0: T.l40, title: "Inbox - 2 new", icon: "mail", menu: ["File", "Message"] }, (cr) => {
      // message 1: the bad one
      K.panel(ctx, cr.x + 16, cr.y + 16, cr.w - 32, 470, "#fff", false);
      IC("mail", cr.x + 36, cr.y + 36, 60); TX("From: site.example", cr.x + 110, cr.y + 52, 3, C.grey, {});
      TX("Your password is:", cr.x + 40, cr.y + 140, 4, C.ink, {});
      TX("sunflower42", cr.x + 40, cr.y + 210, 7, C.ink, { mono: 5, bold: true });
      if (t > tRead) stamp(cr.x + cr.w / 2, cr.y + 380, "STORED READABLY", C.red, (t - tRead) / 0.4);
      if (t > tNever) { ctx.strokeStyle = C.red; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cr.x + 30, cr.y + 470); ctx.lineTo(cr.x + cr.w - 30, cr.y + 30); ctx.stroke(); }
      // message 2: the good one
      if (t > T.l41 - 0.1) {
        K.panel(ctx, cr.x + 16, cr.y + 520, cr.w - 32, 500, "#fff", false);
        IC("mail", cr.x + 36, cr.y + 540, 60); TX("From: good-site.example", cr.x + 110, cr.y + 556, 3, C.grey, {});
        TX("Reset your password:", cr.x + 40, cr.y + 640, 4, C.ink, {});
        K.button(ctx, cr.x + 40, cr.y + 700, 440, 84, "Set a new one", { s: 4, focus: true });
        if (t > tReset) { IC("check", cr.x + 40, cr.y + 830, 80); TX("we can't see it either", cr.x + 140, cr.y + 856, 4, C.greenDk, { bold: true }); }
      }
    });
  }, [{ label: "Inbox", icon: "mail" }]);
  openCue(T.l40); cue(tMail, "mail", 0.8); cue(tRead, "stamp", 1); cue(T.l41 - 0.1, "mail", 0.8); cue(tReset, "ok", 0.9); cue(tNever, "swoosh", 0.6);

  // ================================================================ S30-S31 your side: long + random, unique (manager)
  const tYears = w("l43", "years"), tLong = w("l43", "long"), tBuys = w("l43", "buys"), tDiffer = w("l44", "different"), tRem = w("l44", "remember");
  shot(T.l42 - 0.12, T.l44 - 0.1, "strength", (t) => {
    win(t, { x: LX, y: 160, w: CW, h: 1000, t0: T.l43 - 0.1, title: "Password Check", icon: "shield" }, (cr) => {
      IC("hourglass", cr.x + 30, cr.y + 26, 80, { rot: Math.max(0, t - tBuys) * 2 }); TX("against a slow hash:", cr.x + 130, cr.y + 56, 3, C.ink, { bold: true });
      TX("sunflower42", cr.x + 30, cr.y + 190, 5, C.ink, { mono: 5 });
      K.progress(ctx, cr.x + 30, cr.y + 260, cr.w - 60, 54, 0.18, C.red); TX("short and common: found fast", cr.x + 30, cr.y + 334, 3, C.red, { bold: true });
      if (t > tLong) {
        const pw = typed("orbit-plum-taxi-gravel-moss", t, tLong, 22);
        TX(pw, cr.x + 30, cr.y + 460, 4, C.ink, { mono: 5 });
        K.progress(ctx, cr.x + 30, cr.y + 530, cr.w - 60, 54, clamp((t - tLong) / 1.4, 0, 1), C.green);
        if (t > tYears) { TX("long and random: years", cr.x + 30, cr.y + 604, 4, C.greenDk, { bold: true }); IC("check", cr.x + cr.w - 120, cr.y + 600, 80); }
      }
    });
  }, [{ label: "Password Check", icon: "shield" }]);
  cue(T.l42, "pop", 0.8); cue(T.l43 - 0.22, "open", 0.7); typeCues("orbit-plum-taxi-gravel-moss", tLong, 22, 0.5); cue(tYears, "ok", 0.9);
  shot(T.l44 - 0.1, T.l45 - 0.6, "vault", (t) => {
    win(t, { x: LX, y: 160, w: CW, h: 1000, t0: T.l44 - 0.05, title: "vault.exe", icon: "vault" }, (cr) => {
      IC("vault", cr.x + 30, cr.y + 26, 100); TX("password manager", cr.x + 150, cr.y + 60, 4, C.ink, { bold: true });
      const rows = [["mail", 14], ["bank", 18], ["cart", 12], ["cloud", 16]];
      rows.forEach((r, i) => {
        const y = cr.y + 180 + i * 130;
        if (t < tDiffer - 0.2 + i * 0.12) return;
        IC(r[0], cr.x + 30, y, 80);
        TX("•".repeat(0) + "*".repeat(r[1]), cr.x + 140, y + 22, 5, C.ink, { mono: 5 });
      });
      if (t > tRem) { label(cr.x + 30, cr.y + 760, "YOU REMEMBER: 1", { s: 5 }); }
    });
  }, [{ label: "vault.exe", icon: "vault" }]);
  openCue(T.l44 - 0.05); [0, 1, 2, 3].forEach((i) => cue(tDiffer - 0.2 + i * 0.12, "row", 0.6)); cue(tRem, "pop", 0.9);

  // ================================================================ S32 RECAP: minimised strip + cards
  const RC = [["plain text", "doc", T.l46], ["hashing", "fingerprint", T.l47], ["salt", "salt", T.l48], ["slow hash", "hourglass", T.l49]];
  shot(T.l45 - 0.6, T.l50 - 0.12, "recap", (t) => {
    // strip of minimised windows at the top
    RC.forEach((r, i) => {
      const x = LX + i * 176, y = 50;
      K.win(ctx, x, y, 166, 150, { title: "", icon: r[1], small: true, buttons: [], fill: "face", active: t > r[2] - 0.1 });
      IC(r[1], x + 51, y + 70, 64);
      if (t > r[2] + 0.6) IC("check", x + 112, y + 100, 44);
    });
    const cur = RC.filter((r) => t > r[2] - 0.1).length - 1;
    if (cur < 0) return;
    const r = RC[cur];
    win(t, { x: LX, y: 260, w: CW, h: 980, t0: r[2] - 0.05, title: r[0], icon: r[1], from: { x: LX + cur * 176, y: 50, w: 166, h: 150 } }, (cr) => {
      IC(r[1], cr.x + 30, cr.y + 30, 140);
      TX(r[0].toUpperCase(), cr.x + 200, cr.y + 76, 7, C.ink, { bold: true });
      if (cur === 0) { IC("error", cr.x + 30, cr.y + 260, 120); TX("never", cr.x + 180, cr.y + 290, 8, C.red, { bold: true }); }
      if (cur === 1) { TX("sunflower42", cr.x + 30, cr.y + 250, 5, C.ink, { mono: 5 }); arrowDown(cr.x + 120, cr.y + 320, 120); TX(short(H.sunflower42, 16), cr.x + 30, cr.y + 470, 5, C.ink, { mono: 5 }); TX("one-way fingerprint", cr.x + 30, cr.y + 570, 5, C.navy, { bold: true }); }
      if (cur === 2) { USERS.slice(1, 3).forEach((u, i) => { IC("u_" + u.user, cr.x + 30, cr.y + 240 + i * 140, 90); TX(short(u.salted, 10), cr.x + 140, cr.y + 270 + i * 140, 5, C.ink, { mono: 5 }); }); TX("unique per user", cr.x + 30, cr.y + 560, 5, C.navy, { bold: true }); IC("rainbow", cr.x + 30, cr.y + 650, 100); TX("tables: useless", cr.x + 150, cr.y + 680, 5, C.red, { bold: true }); }
      if (cur === 3) { TX("bcrypt · scrypt · Argon2", cr.x + 30, cr.y + 250, 4, C.ink, {}); IC("chip", cr.x + 30, cr.y + 340, 100); IC("gear", cr.x + 150, cr.y + 340, 100, { rot: t * 2 }); TX("every guess", cr.x + 30, cr.y + 500, 5, C.ink, {}); TX("expensive", cr.x + 30, cr.y + 570, 7, C.red, { bold: true }); }
    });
  }, RC.map((r) => ({ label: r[0], icon: r[1] })));
  cue(T.l45 - 0.6, "swoosh", 0.8); RC.forEach((r) => openCue(r[2] - 0.05, 0.8)); RC.forEach((r) => cue(r[2] + 0.6, "ok", 0.5));

  // ================================================================ S33 title again, S34 the zoom-out ending
  function title2(t, t0) {
    win(t, { x: LX, y: 260, w: CW, h: 800, t0, title: "PASSWORDS 101", big: 4, menu: ["File", "Edit", "Help"], from: K.taskSlot(1) }, (cr) => {
      TX("username:", cr.x + 30, cr.y + 36, 4, C.grey, {});
      TX("ana", cr.x + 30, cr.y + 90, 6, C.ink, { mono: 5 });
      TX("stored (scrypt, salted):", cr.x + 30, cr.y + 200, 4, C.grey, {});
      TX(HS.scrypt.hash.slice(0, 12), cr.x + 30, cr.y + 270, 8, C.ink, { mono: 5 });
      TX(HS.scrypt.hash.slice(12, 24), cr.x + 30, cr.y + 370, 8, C.ink, { mono: 5 });
      TX("… one-way, slow, unique", cr.x + 30, cr.y + 480, 4, C.grey, {});
    });
    IC("fingerprint", 900, 1150, 96);
  }
  shot(T.l50 - 0.12, T.l51 - 0.1, "title2", (t) => title2(t, T.l50 - 0.02), [{ label: "login.txt - Notepad", icon: "doc" }]);
  openCue(T.l50 - 0.02);
  const tZoom = T.l51 - 0.1;
  shot(tZoom, DUR + 1, "outro", (t) => title2(t, -1), [{ label: "login.txt - Notepad", icon: "doc" }]);
  cue(tZoom, "zoomout", 1, { dur: 1.2 }); cue(w("l52", "check"), "send", 0.7); cue(w("l52", "without"), "ok", 0.6);

  // ---------------------------------------------------------------- presenter track
  const PIA_IN = T.youve - 0.15;
  const DRAGS = [
    [T.l18 - 0.65, T.l18 - 0.12, PIA_L, PIA_C], [T.l20 - 0.62, T.l20 - 0.12, PIA_C, PIA_L],
    [T.l38 - 0.55, T.l38 - 0.05, PIA_L, PIA_C], [T.l39 - 0.55, T.l39 - 0.12, PIA_C, PIA_L],
    [T.l45 - 0.55, T.l45 - 0.02, PIA_L, PIA_C], [T.l46 - 0.55, T.l46 - 0.12, PIA_C, PIA_L],
  ];
  DRAGS.forEach((d) => { cue(d[0], "grab", 0.8); cue(d[0] + 0.1, "whoosh", 0.7, { dur: d[1] - d[0] }); cue(d[1], "drop", 0.9); });
  const BUBBLES = [
    [w("l08", "plain") - 0.05, E("l08") + 0.5, "PLAIN TEXT.", "L"], [T.l18 - 0.02, T.l19 - 0.1, "SIMPLE.", "C"], [w("l19", "problem") - 0.05, T.l20 - 0.65, "PROBLEM.", "C"],
    [T.l38 - 0.02, T.l39 - 0.6, "BUT WAIT...", "C"], [T.l42 - 0.03, T.l43 - 0.15, "YOUR SIDE.", "L"], [T.l45 - 0.02, T.l46 - 0.6, "RECAP!", "C"],
    [w("l29", "catch") - 0.05, w("l29", "sha") - 0.1, "THE CATCH.", "L"], [w("l24", "salt") - 0.05, T.l25 - 0.05, "SALT.", "L"],
  ];
  BUBBLES.forEach((b) => cue(b[0], "pop", 0.9));
  const POSES = [
    [0, "idle"], [T.l04, "explain"], [T.l05 + 0.4, "idle"], [T.l07, "point"], [T.l09, "idle"], [T.l10, "explain"], [T.l11, "point"], [T.l13, "idle"],
    [T.l15, "explain"], [T.l16 + 0.5, "point"], [T.l18 - 0.1, "thumbs"], [T.l19 + 0.1, "shrug"], [T.l20 - 0.1, "idle"], [T.l22, "point"], [T.l23 + 1.2, "explain"],
    [T.l24, "present"], [T.l25 + 1.0, "idle"], [T.l27, "point"], [T.l28 + 1.3, "explain"], [T.l29, "explain"], [T.l30, "point"], [T.l31 + 0.5, "shrug"], [T.l32 + 0.6, "explain"],
    [T.l34, "point"], [T.l35 + 0.8, "idle"], [T.l36, "explain"], [T.l37, "point"], [T.l38 - 0.1, "shrug"], [T.l39 - 0.1, "idle"], [T.l40 + 0.6, "point"], [T.l41 + 0.5, "thumbs"],
    [T.l42, "present"], [T.l43 + 0.5, "explain"], [T.l44, "point"], [T.l45 - 0.1, "wave"], [T.l46 - 0.1, "point"], [T.l48, "explain"], [T.l49, "point"], [T.l50, "present"], [T.l51, "idle"],
  ];
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
  const CK = [[0, 640, 1180, "hand"], [0.25, 920, 1205, "grab"], [tScr - 0.04, 380, 660, "grab"], [tScr + 0.1, 400, 680, "hand"], [1.6, 760, 1240, "arrow"]];
  TERMS.forEach((q, i) => CK.push([q[2] + 0.12, 560 + i * 24, 260 + i * 148, "arrow"]));
  CK.push([tMenu, 690, 1000, "arrow", 1], [tMenu + 0.35, 760, 1102, "arrow"], [tTile - 0.05, 768, 1104, "arrow", 1], [tTile + 0.6, 880, 1240, "arrow"]);
  CK.push([tType - 0.3, 700, 650, "arrow"], [tSign, RX - 150, 900, "hand", 1], [tPk, RX - 120, 340, "hand", 1], [tChk + 0.2, 900, 1180, "arrow"]);
  CK.push([tSave + 0.2, 820, 330, "arrow"], [tLeak, 760, 960, "wait"], [tThere + 0.8, 880, 1230, "arrow"]);
  APPS.forEach((a, i) => CK.push([a[2] - 0.05, LX + 30 + (i % 2) * (CW / 2 - 14) + 170, 110 + 250 + Math.floor(i / 2) * 400 + 300, "hand", i < 2 ? 1 : 0]));
  CK.push([tStore, 860, 1100, "arrow"], [tLetter - 0.1, 640, 330, "arrow", 1], [tBack + 0.5, 650, 840, "hand", 1], [tCmp, 900, 1150, "arrow"]);
  DRAGS.forEach((d) => { CK.push([d[0], d[2] + 50, 820, "hand"], [d[0] + 0.08, d[2] + 50, 820, "grab"], [d[1], d[3] + 50, 820, "grab"], [d[1] + 0.1, d[3] + 56, 826, "hand"], [d[1] + 0.6, d[3] + (d[3] > 300 ? 300 : 520), 1120, "arrow"]); });
  CK.sort((a, b) => a[0] - b[0]);
  CK.push(...[[tMatch, 960, 1180, "arrow"], [tRb + 0.5, 980, 1220, "arrow"], [tCrack, 940, 420, "arrow"], [tRand, 700, 400, "arrow"], [tNext, 560, 300, "arrow", 1],
    [tUseless, 860, 560, "arrow"], [tFast, 980, 1180, "arrow"], [tBil, 900, 1220, "wait"], [tSlowW + 0.2, 860, 700, "hand", 1], [tA + 0.1, LX + 210, 80 + 140 + 450 + 20, "arrow", 1],
    [tCost - 0.15, LX + CW - 300, 1240, "arrow", 1], [tRaise, LX + 200 + (CW - 290) * 0.85, 80 + 140 + 230, "grab"], [T.l35 - 0.15, LX + CW - 300, 1240, "arrow", 1], [tFrac - 0.45, LX + CW - 300, 1240, "arrow", 1],
    [tForgot, LX + 200, 260 + 66 + 470 + 30, "hand", 1], [tReset + 0.1, LX + 250, 90 + 66 + 40 + 700 + 40, "hand", 1], [tYears + 0.2, 960, 1180, "arrow"], [tRem, 900, 1180, "arrow"]]);
  RC.forEach((r, i) => CK.push([r[2] - 0.15, LX + i * 176 + 83, 130, "arrow", 1]));
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
  const ACT = [[tScr, tScr + 0.6], [tLeak, tLeak + 0.8], [tPre, tPre + 1.2], [T.l24, T.l24 + 2.0], [tMem - 0.2, tMem + 0.8], [tG0, tMatch]];
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
    cues: cues.sort((a, b) => a.t - b.t), shots: shots.map((s) => ({ name: s.name, t0: +s.t0.toFixed(2) })), T,
    draw(t) {
      if (ctx.reset) ctx.reset();
      if (t >= tZoom) outro(t);
      else frame(t);
      captions(t);
    },
  };
};
