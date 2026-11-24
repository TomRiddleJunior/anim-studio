/* chat-ui.js — the phone's screen: a ChatGPT-style chat (light theme), its composer and an iOS-style keyboard, drawn
 * into a 2D canvas as a PURE FUNCTION OF TIME from window.CHAT_TIMING (tools/build_timing.py).
 *   CHATUI.init(canvas)   after the fonts are loaded: measures and lays out every message once
 *   CHATUI.draw(t)        paints the screen at time t (seconds)
 * Units are iOS points (393 x 852); the canvas is S times larger. No logos or brand marks are drawn. */
(function () {
  const TM = window.CHAT_TIMING, META = Object.assign({ title: "ChatGPT", day: "Today", time: "3:29 am", clock: "3:29" }, TM.meta || {});
  const S = 4, W = 393, H = 852, NAV = 98, KBH = 291;
  const C = { ink: "#0d0d0d", grey: "#8e8e93", bubble: "#e9effc", blue: "#2a50c8", kb: "#d0d3da", keyS: "#abb0ba", caret: "#2f6bff" };
  const FF = '"Inter","Segoe UI","Segoe UI Emoji",sans-serif';
  const F = (px, w) => (w || 400) + " " + px + "px " + FF;
  const BODY = 19, LH = 27, PGAP = 14, UB = 19, ULH = 26, CF = 18, CLH = 24;
  const VIEW = H - 40 - 48 - 8 - NAV;                         // the chat's height with the keyboard down
  let cv, g, L = null;

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const eoc = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const eio = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
    g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
    g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }
  function wrapPlain(text, maxW, font) {
    g.font = font;
    const lines = [];
    for (const para of text.split("\n")) {
      if (para === "") { lines.push(""); continue; }
      let cur = "";
      for (const w of para.split(" ")) {
        const tryS = cur ? cur + " " + w : w;
        if (cur && g.measureText(tryS).width > maxW) { lines.push(cur); cur = w; } else cur = tryS;
      }
      lines.push(cur);
    }
    return lines;
  }
  function layoutReply(paras, maxW) {
    g.font = F(BODY, 400);
    const spaceW = g.measureText(" ").width, words = [];
    let y = 0;
    paras.forEach((p, pi) => {
      if (pi) y += PGAP;
      let x = 0;
      p.forEach((wd, wi) => {
        let w = 0;
        const segs = wd.map((sg) => { g.font = F(BODY, sg[1] ? 680 : 400); const sw = g.measureText(sg[0]).width; const o = { tx: sg[0], b: sg[1], dx: w }; w += sw; return o; });
        if (x > 0 && x + w > maxW) {
          x = 0; y += LH;
          // never leave a closing emoji alone on a line: bring the word before it down too
          const txt = wd.map((sg) => sg[0]).join("");
          if (wi === p.length - 1 && wi > 0 && [...txt].every((ch) => ch.codePointAt(0) > 255)) { const pv = words[words.length - 1]; pv.x = 0; pv.y = y; x = pv.w + spaceW; }
        }
        words.push({ x, y, w, segs });
        x += w + spaceW;
      });
      y += LH;
    });
    return { words, h: y };
  }

  // ------------------------------------------------------------------ keyboard geometry
  const KW = 33.3, KP = 39.3, KH = 42, RP = 54;
  function keyRects(lay) {
    const out = [], row = (chars, x0, r, w, pitch) => { [...chars].forEach((c, i) => out.push({ id: c, x: x0 + i * (pitch || KP), y: 8 + r * RP, w: w || KW, ch: c })); };
    if (lay === "abc") {
      row("qwertyuiop", 3, 0); row("asdfghjkl", 22.65, 1); row("zxcvbnm", 61.95, 2);
      out.push({ id: "shift", x: 3, y: 8 + 2 * RP, w: 44, sp: 1 });
    } else {
      row(lay === "123" ? "1234567890" : "[]{}#%^*+=", 3, 0);
      row(lay === "123" ? "-/:;()$&@\"" : "_\\|~<>€£¥•", 3, 1);
      row(".,?!'", 68, 2, 46.6, 52.6);
      out.push({ id: lay === "123" ? "#+=" : "123", x: 3, y: 8 + 2 * RP, w: 44, sp: 1, label: lay === "123" ? "#+=" : "123" });
    }
    out.push({ id: "bksp", x: 346, y: 8 + 2 * RP, w: 44, sp: 1 });
    out.push({ id: lay === "abc" ? "123" : "ABC", x: 3, y: 8 + 3 * RP, w: 90.5, sp: 1, label: lay === "abc" ? "123" : "ABC" });
    out.push({ id: "space", x: 99.5, y: 8 + 3 * RP, w: 194, label: "space" });
    out.push({ id: "return", x: 299.5, y: 8 + 3 * RP, w: 90.5, sp: 1, label: "return" });
    return out;
  }
  const RECTS = { abc: keyRects("abc"), "123": keyRects("123"), sym: keyRects("sym") };

  // ------------------------------------------------------------------ init: layout once
  function init(canvas) {
    cv = canvas; cv.width = W * S; cv.height = H * S;
    g = cv.getContext("2d");
    const turns = [];
    let y = 56;                                               // below the "Today 3:29 am" row
    TM.turns.forEach((tn) => {
      const lines = wrapPlain(tn.user, 246, F(UB, 400));
      g.font = F(UB, 400);
      const tw = Math.max.apply(null, lines.map((l) => g.measureText(l).width));
      const bw = Math.ceil(tw) + 34, bh = lines.length * ULH + 24;
      const rep = layoutReply(tn.reply, W - 20 - 22);
      const o = { bubbleTop: y, lines, bw, bh, replyTop: y + bh + 24, rep };
      o.actionsTop = o.replyTop + rep.h + 8;
      // how far the chat has to scroll past "bubble at the top" to keep each new line on screen (0 for most replies)
      const target = turns.length === 0 ? 0 : o.bubbleTop - 16;
      o.need = rep.words.map((wd) => Math.max(0, o.replyTop + wd.y + LH + 44 - (target + VIEW)));
      o.needEnd = Math.max(0, o.actionsTop + 24 + 22 - (target + VIEW));
      y = o.actionsTop + 24 + 34;
      turns.push(o);
    });
    L = { turns };
    return L;
  }

  // ------------------------------------------------------------------ state at time t
  function kbK(t) {                                           // keyboard up 0..1
    let k = 0;
    TM.turns.forEach((tn) => {
      if (t >= tn.kbUp) k = eoc((t - tn.kbUp) / 0.36);
      if (t >= tn.kbDown) k = 1 - eio((t - tn.kbDown) / 0.34);
    });
    return k;
  }
  function typing(t) {                                        // the turn being typed, its last key event
    for (let i = 0; i < TM.turns.length; i++) {
      const tn = TM.turns[i];
      if (t >= tn.kbUp && t < tn.send) {
        let ev = null;
        for (const e of tn.keys) { if (e.t <= t) ev = e; else break; }
        return { i, tn, ev, n: ev ? ev.n : 0, lay: ev ? ev.la : "abc", sh: ev ? ev.sh : tn.sh0, press: ev && t - ev.t < 0.105 ? ev : null };
      }
    }
    return null;
  }
  function scrollY(t) {
    let y = 0, prev = 0;
    TM.turns.forEach((tn, i) => {
      const o = L.turns[i], target = i === 0 ? 0 : o.bubbleTop - 16;
      if (t >= tn.send) {
        y = lerp(prev, target, eoc((t - tn.send) / 0.6));
        let extra = 0;
        for (let k = 0; k < o.need.length && tn.words[k] <= t; k++) if (o.need[k] > 0) extra = Math.max(extra, o.need[k] * eoc((t - tn.words[k]) / 0.45));
        if (t >= tn.done && o.needEnd > 0) extra = Math.max(extra, o.needEnd * eoc((t - tn.done) / 0.45));
        y += extra;
      }
      prev = target + Math.max(o.needEnd, o.need.length ? Math.max.apply(null, o.need) : 0);
    });
    return y;
  }

  // ------------------------------------------------------------------ small icons (generic line glyphs)
  function iconCopy(x, y, c) { g.strokeStyle = c; g.lineWidth = 1.6; rr(x + 5, y + 5, 11, 12, 3); g.stroke(); g.beginPath(); g.moveTo(x + 12, y + 2.5); g.lineTo(x + 4.5, y + 2.5); g.arcTo(x + 2, y + 2.5, x + 2, y + 5, 2.5); g.lineTo(x + 2, y + 13.5); g.stroke(); }
  function iconSpeaker(x, y, c) { g.strokeStyle = c; g.lineWidth = 1.6; g.lineJoin = "round"; g.beginPath(); g.moveTo(x + 2, y + 7); g.lineTo(x + 5.5, y + 7); g.lineTo(x + 10, y + 3); g.lineTo(x + 10, y + 15); g.lineTo(x + 5.5, y + 11); g.lineTo(x + 2, y + 11); g.closePath(); g.stroke(); g.beginPath(); g.arc(x + 10.5, y + 9, 4.2, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(x + 10.5, y + 9, 7.4, -0.8, 0.8); g.stroke(); }
  function iconRetry(x, y, c) { g.strokeStyle = c; g.lineWidth = 1.6; g.lineCap = "round"; g.beginPath(); g.arc(x + 9, y + 9, 6.4, -0.3, Math.PI * 1.55); g.stroke(); g.beginPath(); g.moveTo(x + 15.6, y + 2.8); g.lineTo(x + 15.4, y + 7.4); g.lineTo(x + 11, y + 6.6); g.stroke(); }
  function iconShare(x, y, c) { g.strokeStyle = c; g.lineWidth = 1.6; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(x + 9, y + 11.5); g.lineTo(x + 9, y + 2); g.moveTo(x + 5.4, y + 5.4); g.lineTo(x + 9, y + 1.8); g.lineTo(x + 12.6, y + 5.4); g.stroke(); g.beginPath(); g.moveTo(x + 3, y + 9.5); g.lineTo(x + 3, y + 15.5); g.lineTo(x + 15, y + 15.5); g.lineTo(x + 15, y + 9.5); g.stroke(); }
  function iconThumb(x, y, c, down) {
    g.save(); g.translate(x + 9, y + 9); if (down) g.scale(1, -1); g.translate(-9, -9);
    g.strokeStyle = c; g.lineWidth = 1.6; g.lineJoin = "round"; g.lineCap = "round";
    rr(2, 8, 3.4, 8, 1); g.stroke();
    g.beginPath(); g.moveTo(5.6, 8.6); g.lineTo(8.6, 2.2); g.quadraticCurveTo(11.2, 2.2, 10.8, 5); g.lineTo(10.2, 7.6); g.lineTo(14.4, 7.6);
    g.quadraticCurveTo(16.2, 7.8, 15.8, 9.8); g.lineTo(14.6, 14.4); g.quadraticCurveTo(14.2, 15.8, 12.6, 15.8); g.lineTo(5.6, 15.8); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------------ pieces
  function drawStatus() {
    g.fillStyle = "#000"; g.font = F(17, 620); g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillText(META.clock, 52, 34);
    for (let i = 0; i < 4; i++) { const h = 4.2 + i * 2.5; rr(296 + i * 5.2, 33 - h, 3.4, h, 1); g.fill(); }
    g.strokeStyle = "#000"; g.lineWidth = 2.1; g.lineCap = "round";
    for (let i = 1; i <= 2; i++) { g.beginPath(); g.arc(330, 33, 3.2 + i * 4, -Math.PI * 0.76, -Math.PI * 0.24); g.stroke(); }
    g.beginPath(); g.arc(330, 32, 1.9, 0, 7); g.fill();
    g.globalAlpha = 0.42; g.lineWidth = 1.1; rr(344.5, 21.5, 25, 12.5, 3.8); g.stroke(); rr(370.6, 25.4, 1.7, 4.6, 0.9); g.fill();
    g.globalAlpha = 1; rr(346.4, 23.4, 16, 8.7, 2.2); g.fill();
    rr(134, 11, 125, 37, 18.5); g.fill();                     // the camera island
    g.textAlign = "left";
  }
  function drawNav() {
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, NAV);
    const fade = g.createLinearGradient(0, NAV, 0, NAV + 16);
    fade.addColorStop(0, "rgba(255,255,255,1)"); fade.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = fade; g.fillRect(0, NAV, W, 16);
    g.strokeStyle = C.ink; g.lineWidth = 2.2; g.lineCap = "round";
    g.beginPath(); g.moveTo(20, 71); g.lineTo(40, 71); g.moveTo(20, 80); g.lineTo(33, 80); g.stroke();
    g.fillStyle = C.ink; g.font = F(17.5, 620); g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillText(META.title, 192, 82);
    const tw = g.measureText(META.title).width;
    g.strokeStyle = C.grey; g.lineWidth = 1.9; g.lineJoin = "round";
    g.beginPath(); g.moveTo(192 + tw / 2 + 7, 71.5); g.lineTo(192 + tw / 2 + 11.5, 76); g.lineTo(192 + tw / 2 + 7, 80.5); g.stroke();
    g.strokeStyle = C.ink; g.lineWidth = 1.9;                 // new-chat glyph: a square with a pencil
    g.beginPath(); g.moveTo(357, 66); g.lineTo(350, 66); g.arcTo(346, 66, 346, 70, 4); g.lineTo(346, 82); g.arcTo(346, 86, 350, 86, 4); g.lineTo(362, 86); g.arcTo(366, 86, 366, 82, 4); g.lineTo(366, 75); g.stroke();
    g.beginPath(); g.moveTo(368.5, 63.5); g.lineTo(357.5, 74.5); g.lineTo(356.6, 77.6); g.lineTo(359.7, 76.7); g.lineTo(370.7, 65.7); g.closePath(); g.stroke();
    g.textAlign = "left";
  }
  function drawBubble(o, a) {
    const x = W - 16 - o.bw, y = o.bubbleTop + (1 - a) * 22;
    g.save();
    g.globalAlpha = a;
    g.translate(W - 16, y + o.bh); g.scale(0.9 + 0.1 * a, 0.9 + 0.1 * a); g.translate(-(W - 16), -(y + o.bh));
    g.fillStyle = C.bubble; rr(x, y, o.bw, o.bh, 22); g.fill();
    g.fillStyle = C.blue; g.font = F(UB, 400); g.textBaseline = "alphabetic";
    o.lines.forEach((ln, i) => g.fillText(ln, x + 17, y + 12 + 19.5 + i * ULH));
    g.restore();
  }
  function drawReply(o, tn, t) {
    const x0 = 20, y0 = o.replyTop, words = o.rep.words;
    g.textBaseline = "alphabetic";
    let last = null;
    for (let k = 0; k < words.length; k++) {
      const a = clamp((t - tn.words[k]) / 0.16, 0, 1);
      if (a <= 0) break;
      const wd = words[k];
      g.globalAlpha = a; g.fillStyle = C.ink;
      wd.segs.forEach((sg) => { g.font = F(BODY, sg.b ? 680 : 400); g.fillText(sg.tx, x0 + wd.x + sg.dx, y0 + wd.y + 20); });
      last = wd;
    }
    g.globalAlpha = 1;
    if (t < tn.done) {                                        // the thinking / streaming dot
      const pulse = 1 + 0.2 * Math.sin((t - tn.think) * 2 * Math.PI / 0.85);
      const appear = eoc((t - tn.think) / 0.18), gone = 1 - clamp((t - (tn.done - 0.12)) / 0.12, 0, 1);
      let dx = x0 + 8, dy = y0 + 13.5, r = 7.2 * pulse;
      if (last) { dx = x0 + last.x + last.w + 10; dy = y0 + last.y + 13.5; r = 6.2; if (dx > W - 24) { dx = x0 + 8; dy += LH; } }
      g.globalAlpha = appear * gone; g.fillStyle = C.ink;
      g.beginPath(); g.arc(dx, dy, r * appear, 0, 7); g.fill(); g.globalAlpha = 1;
    } else {                                                  // the action row under a finished reply
      const a = eoc((t - tn.done) / 0.35), y = o.actionsTop + (1 - a) * 5;
      g.globalAlpha = a;
      iconCopy(20, y, C.grey); iconThumb(55, y, C.grey, false); iconThumb(90, y, C.grey, true); iconSpeaker(125, y, C.grey); iconRetry(161, y, C.grey); iconShare(196, y, C.grey);
      g.globalAlpha = 1;
    }
  }
  function drawComposer(t, ty, k) {
    const text = ty ? ty.tn.user.slice(0, ty.n) : "";
    const lines = text ? wrapPlain(text, 250, F(CF, 400)) : [""];
    const cb = lerp(H - 40, H - KBH - 8, k), hc = 48 + (lines.length - 1) * CLH, top = cb - hc;
    const fade = g.createLinearGradient(0, top - 26, 0, top - 4);
    fade.addColorStop(0, "rgba(255,255,255,0)"); fade.addColorStop(1, "rgba(255,255,255,1)");
    g.fillStyle = fade; g.fillRect(0, top - 26, W, 24);
    g.fillStyle = "#fff"; g.fillRect(0, top - 3, W, H - top + 3);
    g.save(); g.shadowColor = "rgba(0,0,0,0.10)"; g.shadowBlur = 14 * S; g.shadowOffsetY = 2 * S;
    g.fillStyle = "#fff"; rr(12, top, W - 24, hc, 24); g.fill(); g.restore();
    g.strokeStyle = "#e3e4e8"; g.lineWidth = 1; rr(12, top, W - 24, hc, 24); g.stroke();
    g.strokeStyle = C.ink; g.lineWidth = 1.9; g.lineCap = "round";               // plus
    g.beginPath(); g.moveTo(29, cb - 24); g.lineTo(43, cb - 24); g.moveTo(36, cb - 31); g.lineTo(36, cb - 17); g.stroke();
    g.font = F(CF, 400); g.textBaseline = "alphabetic";
    if (!text) { g.fillStyle = "#9a9aa1"; g.fillText("Ask anything", 58, top + 30.5); }
    else { g.fillStyle = C.ink; lines.forEach((ln, i) => g.fillText(ln, 58, top + 30.5 + i * CLH)); }
    if (ty) {                                                  // caret: solid while keys are landing, blinking when idle
      const lastT = ty.ev ? ty.ev.t : -9, idle = t - Math.max(lastT, ty.tn.kbUp);
      const on = idle < 0.45 || Math.floor((idle - 0.45) / 0.53) % 2 === 1;
      if (on && k > 0.6) {
        const ln = lines[lines.length - 1], cx = 58 + g.measureText(ln).width + 1.2, cy = top + 12 + (lines.length - 1) * CLH;
        g.fillStyle = C.caret; rr(cx, cy, 2.2, 24, 1.1); g.fill();
      }
    }
    // right side: the mic and the voice button when empty, the send button when there is text
    const bx = 357, by = cb - 24;
    let sendA = 0;
    if (ty && ty.n > 0) { const first = ty.tn.keys.find((e) => e.n > 0); sendA = eoc((t - first.t) / 0.16); }
    if (sendA < 1) {
      g.globalAlpha = 1 - sendA;
      g.strokeStyle = C.ink; g.lineWidth = 1.8;
      rr(314.5, by - 10, 7, 13, 3.5); g.stroke();
      g.beginPath(); g.arc(318, by - 1, 6.6, 0.15, Math.PI - 0.15); g.stroke(); g.beginPath(); g.moveTo(318, by + 5.6); g.lineTo(318, by + 9.5); g.stroke();
      g.fillStyle = C.ink; g.beginPath(); g.arc(bx, by, 17, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 2.1;
      [[-7.5, 3], [-2.5, 7], [2.5, 5], [7.5, 2.5]].forEach(([dx, hh]) => { g.beginPath(); g.moveTo(bx + dx, by - hh); g.lineTo(bx + dx, by + hh); g.stroke(); });
      g.globalAlpha = 1;
    }
    if (sendA > 0) {
      let sc = 0.6 + 0.4 * sendA;
      if (ty && t > ty.tn.send - 0.13) sc *= 0.86;             // pressed just before the message leaves
      g.globalAlpha = sendA; g.fillStyle = C.ink; g.beginPath(); g.arc(bx, by, 17 * sc, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 2.4 * sc; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(bx, by + 7.5 * sc); g.lineTo(bx, by - 7.5 * sc); g.moveTo(bx - 6.2 * sc, by - 1.4 * sc); g.lineTo(bx, by - 7.6 * sc); g.lineTo(bx + 6.2 * sc, by - 1.4 * sc); g.stroke();
      g.globalAlpha = 1;
    }
    if (k < 1) { g.globalAlpha = 1 - k; g.fillStyle = "#0d0d0d"; rr(129.5, H - 13, 134, 5, 2.5); g.fill(); g.globalAlpha = 1; }
    return top;
  }
  function drawKeyboard(t, ty, k) {
    if (k <= 0.001) return;
    const ky = H - KBH + (1 - k) * (KBH + 12);
    const lay = ty ? ty.lay : "abc", sh = ty ? ty.sh : false, press = ty ? ty.press : null;
    const shown = press ? press.lay : lay;                     // the layout under the finger while a key is down
    g.fillStyle = C.kb; g.fillRect(0, ky, W, KBH + 20);
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    let pop = null;
    RECTS[shown].forEach((kr) => {
      const x = kr.x, y = ky + kr.y, down = press && press.k === kr.id;
      let fill = kr.sp ? C.keyS : "#fff";
      if (down && kr.sp) fill = "#fff";
      if (down && kr.id === "space") fill = "#b9bec8";
      if (kr.id === "shift" && sh && !press) fill = "#fff";
      g.fillStyle = "#86898f"; rr(x, y + 1.2, kr.w, KH, 5.2); g.fill();
      g.fillStyle = fill; rr(x, y, kr.w, KH, 5.2); g.fill();
      g.fillStyle = "#000"; g.strokeStyle = "#000";
      if (kr.ch) {
        const up = shown === "abc" && (press ? press.c && press.c === press.c.toUpperCase() && press.c !== press.c.toLowerCase() : sh);
        g.font = F(shown === "abc" ? (up ? 22 : 24.5) : 22, 400);
        g.fillText(shown === "abc" && up ? kr.ch.toUpperCase() : kr.ch, x + kr.w / 2, y + (shown === "abc" && !up ? 27.5 : 29));
        if (down) pop = { x, y, w: kr.w, ch: press.c || kr.ch };
      } else if (kr.label) { g.font = F(16, 400); g.fillText(kr.label, x + kr.w / 2, y + 27); }
      else if (kr.id === "shift") {
        g.lineWidth = 1.7; g.lineJoin = "round"; const cx = x + kr.w / 2, cy = y + 21;
        g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 9.5, cy + 0.5); g.lineTo(cx + 4.6, cy + 0.5); g.lineTo(cx + 4.6, cy + 8); g.lineTo(cx - 4.6, cy + 8); g.lineTo(cx - 4.6, cy + 0.5); g.lineTo(cx - 9.5, cy + 0.5); g.closePath();
        if (sh && !press) g.fill(); else g.stroke();
      } else if (kr.id === "bksp") {
        g.lineWidth = 1.7; g.lineJoin = "round"; g.lineCap = "round"; const cx = x + kr.w / 2, cy = y + 21;
        g.beginPath(); g.moveTo(cx - 12, cy); g.lineTo(cx - 5, cy - 8); g.lineTo(cx + 11, cy - 8); g.lineTo(cx + 11, cy + 8); g.lineTo(cx - 5, cy + 8); g.closePath(); g.stroke();
        g.beginPath(); g.moveTo(cx - 0.5, cy - 3.6); g.lineTo(cx + 6, cy + 3.6); g.moveTo(cx + 6, cy - 3.6); g.lineTo(cx - 0.5, cy + 3.6); g.stroke();
      }
    });
    if (pop) {                                                 // the key balloon
      const pw = pop.w + 20, px = clamp(pop.x - 10, 2, W - pw - 2), py = pop.y - 58;
      g.save(); g.shadowColor = "rgba(0,0,0,0.28)"; g.shadowBlur = 9 * S; g.shadowOffsetY = 2 * S;
      g.fillStyle = "#fff"; rr(px, py, pw, 58 + KH, 9); g.fill(); g.restore();
      g.fillStyle = "#000"; g.font = F(35, 400); g.fillText(pop.ch === "’" ? "'" : pop.ch, px + pw / 2, py + 40);
    }
    // bottom strip: a smiley and a mic glyph, the home bar
    const by = ky + 250;
    g.strokeStyle = "#52555b"; g.fillStyle = "#52555b"; g.lineWidth = 1.7; g.lineCap = "round";
    g.beginPath(); g.arc(38, by, 11.5, 0, 7); g.stroke();
    g.beginPath(); g.arc(34, by - 3, 1.5, 0, 7); g.fill(); g.beginPath(); g.arc(42, by - 3, 1.5, 0, 7); g.fill();
    g.beginPath(); g.arc(38, by + 0.5, 6.2, 0.25, Math.PI - 0.25); g.stroke();
    rr(351, by - 12, 8, 15, 4); g.stroke();
    g.beginPath(); g.arc(355, by - 1.5, 7.6, 0.15, Math.PI - 0.15); g.stroke(); g.beginPath(); g.moveTo(355, by + 6); g.lineTo(355, by + 11); g.stroke();
    g.fillStyle = "#0d0d0d"; rr(129.5, ky + 277, 134, 5, 2.5); g.fill();
    g.textAlign = "left";
  }

  // ------------------------------------------------------------------ the frame
  function draw(t) {
    g.setTransform(S, 0, 0, S, 0, 0);
    g.globalAlpha = 1; g.textAlign = "left";
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const k = kbK(t), ty = typing(t);
    // composer geometry first (the chat is clipped above it)
    const text = ty ? ty.tn.user.slice(0, ty.n) : "";
    const nLines = text ? wrapPlain(text, 250, F(CF, 400)).length : 1;
    const compTop = lerp(H - 40, H - KBH - 8, k) - (48 + (nLines - 1) * CLH);
    // chat
    g.save();
    g.beginPath(); g.rect(0, NAV, W, compTop - NAV); g.clip();
    g.translate(0, NAV - scrollY(t));
    g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillStyle = C.grey;
    g.font = F(13.5, 650); const w1 = g.measureText(META.day).width; g.font = F(13.5, 400); const w2 = g.measureText(" " + META.time).width;
    const sx = (W - w1 - w2) / 2; g.textAlign = "left";
    g.font = F(13.5, 650); g.fillText(META.day, sx, 30); g.font = F(13.5, 400); g.fillText(" " + META.time, sx + w1, 30);
    TM.turns.forEach((tn, i) => {
      const o = L.turns[i];
      if (t >= tn.send) drawBubble(o, eoc((t - tn.send) / 0.24));
      if (t >= tn.think) drawReply(o, tn, t);
    });
    g.restore();
    drawNav();
    drawComposer(t, ty, k);
    drawKeyboard(t, ty, k);
    drawStatus();
  }

  window.CHATUI = { init, draw, kbK, S, W, H, get layout() { return L; } };
})();
