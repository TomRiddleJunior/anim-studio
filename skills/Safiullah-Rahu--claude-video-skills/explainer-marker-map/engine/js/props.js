/* map-films engine · props: every callout is physical paper, drawn in code (no icon packs).
   Tag (cream, colour bar, tape, Oswald 700 54 px title, Special Elite 28 px subtitle typed in), CountTag (black, counts
   up), Strip (torn, yellow highlighter swipe), Calendar (tear-off page that flips), Stamp (red rubber stamp that slams),
   Tracker (date/time/counter card), EndCard (number scribbled out, punchline written in marker), SwimPath (dotted path
   with a moving marker). Static paper is baked once into an offscreen canvas; only the moving parts draw per frame.
   Pop-ins: spring (damping 0.48, 19 rad/s) from 55 % with a small rotation settle; exits shrink + fade in 0.22 s. */
(function () {
  'use strict';
  const MF = window.MF;
  const FONT = { title: '"Oswald"', type: '"Special Elite"', hand: '"Permanent Marker"' };
  MF.PAPER = { cream: '#F1E8D2', light: '#F6F0E1', strip: '#EEE7D5', ink: '#1E1A16', inkSoft: '#6B5948', black: '#1B1917', tape: 'rgba(228,216,182,0.80)' };

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

  /* fill a shape with paper: colour × paper texture × soft edge darkening, with a baked drop shadow */
  MF.paper = function (x, shape, w, h, color, film, o = {}) {
    x.save();
    if (o.shadow !== false) {
      x.save();
      x.shadowColor = o.shadowColor || 'rgba(24,14,6,0.45)'; x.shadowBlur = o.blur || 18;
      x.shadowOffsetX = o.sx != null ? o.sx : 5; x.shadowOffsetY = o.sy != null ? o.sy : 9;
      x.fillStyle = color; shape(x); x.fill();
      x.restore();
    }
    shape(x); x.clip();
    x.fillStyle = color; x.fillRect(-10, -10, w + 20, h + 20);
    if (film && film.paperImg) {
      const r = MF.rng(o.seed || 5);
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = o.tex != null ? o.tex : 0.7;
      x.drawImage(film.paperImg, -r() * 1200, -r() * 1200);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
    if (o.edge !== false) {
      const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.62);
      g.addColorStop(0, 'rgba(120,90,50,0)'); g.addColorStop(1, `rgba(120,90,50,${o.edgeA || 0.18})`);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    x.restore();
  };

  /* a strip of tape with torn ends */
  MF.tape = function (x, cx, cy, w, h, rot, seed) {
    const r = MF.rng(seed);
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.beginPath();
    x.moveTo(-w / 2, -h / 2);
    x.lineTo(w / 2, -h / 2);
    for (let k = 0; k <= 6; k++) x.lineTo(w / 2 + (k % 2 ? 4 : -2) * (0.5 + r()), -h / 2 + (h * k) / 6);
    x.lineTo(-w / 2, h / 2);
    for (let k = 6; k >= 0; k--) x.lineTo(-w / 2 + (k % 2 ? -4 : 2) * (0.5 + r()), -h / 2 + (h * k) / 6);
    x.closePath();
    x.shadowColor = 'rgba(30,20,10,0.18)'; x.shadowBlur = 3; x.shadowOffsetY = 1.5;
    x.fillStyle = MF.PAPER.tape; x.fill();
    x.shadowColor = 'transparent';
    x.globalAlpha = 0.25; x.strokeStyle = '#fff'; x.lineWidth = 1; x.stroke();
    x.restore();
  };

  function rectShape(w, h, r = 3) { return (x) => { x.beginPath(); x.roundRect(0, 0, w, h, r); }; }

  function tornShape(w, h, seed, amp = 2.6, step = 7, side = 6) {
    const r = MF.rng(seed), top = [], bot = [];
    for (let X = 0; X <= w; X += step) { top.push([X, (r() - 0.5) * 2 * amp]); bot.push([X, h + (r() - 0.5) * 2 * amp]); }
    return (x) => {
      x.beginPath();
      x.moveTo(top[0][0], top[0][1]);
      for (const p of top) x.lineTo(p[0], p[1]);
      for (let Y = 0; Y <= h; Y += h / 5) x.lineTo(w + (MF.hash2(Y | 0, seed) - 0.5) * 2 * side, Y);
      for (let i = bot.length - 1; i >= 0; i--) x.lineTo(bot[i][0], bot[i][1]);
      for (let Y = h; Y >= 0; Y -= h / 5) x.lineTo((MF.hash2((Y | 0) + 99, seed) - 0.5) * 2 * side, Y);
      x.closePath();
    };
  }

  /* ── base: positioned, popping paper thing ──────────────────────────────────────────────────────────── */
  class Prop {
    constructor(o, film) {
      this.o = Object.assign({ rot: 0, rotFrom: 7, scale: 1, off: [0, 0], t1: null }, o);
      this.film = film;
    }
    pos(cam) {
      const o = this.o;
      let x, y;
      if (o.anchor) [x, y] = cam.toScreen(o.anchor[0], o.anchor[1]); else [x, y] = cam.shake(o.screen[0], o.screen[1]);
      return [x + o.off[0], y + o.off[1]];
    }
    state(t) { return MF.popState(t, this.o.t0, this.o.t1, this.o.rot, this.o.rotFrom * (MF.hash(this.o.seed || 1) > 0.5 ? 1 : -1)); }
    begin(ctx, t, cam) {
      const ps = this.state(t);
      if (!ps) return null;
      const [x, y] = this.pos(cam);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ps.rot + cam.rot);
      ctx.scale(ps.scale * this.o.scale, ps.scale * this.o.scale);
      ctx.globalAlpha = ps.alpha;
      return ps;
    }
    blit(ctx, b) { ctx.drawImage(b.c, -b.w / 2 - b.pad, -b.h / 2 - b.pad); }
    bake(w, h, pad, fn) { const c = canvas(w + 2 * pad, h + 2 * pad), x = c.getContext('2d'); x.translate(pad, pad); fn(x); return { c, w, h, pad }; }
  }
  MF.Prop = Prop;

  /* cream tag: colour bar, tape, title, subtitle typed in on its own word */
  MF.Tag = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ color: '#2F5D8A', rot: -2, tsize: 54, ssize: 28, cps: 26 }, o), film);
      const o2 = this.o, m = canvas(4, 4).getContext('2d');
      m.font = `700 ${o2.tsize}px ${FONT.title}`; m.letterSpacing = '1.5px';
      const tw = m.measureText(o2.title).width;
      m.font = `${o2.ssize}px ${FONT.type}`; m.letterSpacing = '0px';
      const sw = o2.sub ? m.measureText(o2.sub).width : 0;
      const padL = 40, padR = 30;
      const w = Math.round(Math.max(tw, sw) + padL + padR), h = Math.round(o2.sub ? o2.tsize * 1.18 + o2.ssize * 1.35 + 40 : o2.tsize * 1.18 + 34);
      this.lay = { w, h, padL, ty: 20 + o2.tsize * 0.58, sy: 20 + o2.tsize * 1.18 + o2.ssize * 0.62 };
      this.b = this.bake(w, h, 34, (x) => {
        MF.paper(x, rectShape(w, h, 3), w, h, o2.paper || MF.PAPER.cream, film, { seed: o2.seed });
        x.fillStyle = o2.color; x.fillRect(0, 0, 14, h);
        x.globalAlpha = 0.18; x.fillStyle = '#000'; x.fillRect(14, 0, 2, h); x.globalAlpha = 1;
        x.font = `700 ${o2.tsize}px ${FONT.title}`; x.letterSpacing = '1.5px'; x.textBaseline = 'middle';
        x.fillStyle = o2.ink || MF.PAPER.ink; x.fillText(o2.title, padL, this.lay.ty);
        if (o2.tape !== false) MF.tape(x, w * 0.5 + (MF.hash(o2.seed || 2) - 0.5) * w * 0.3, -2, Math.min(130, w * 0.42), 34, (MF.hash((o2.seed || 2) + 7) - 0.5) * 0.18, o2.seed || 2);
      });
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, L = this.lay;
      this.blit(ctx, this.b);
      if (o.sub && o.subAt != null && t >= o.subAt) {
        const n = Math.min(o.sub.length, Math.floor((t - o.subAt) * o.cps) + 1);
        ctx.font = `${o.ssize}px ${FONT.type}`; ctx.textBaseline = 'middle'; ctx.fillStyle = o.subInk || '#3A3026';
        ctx.fillText(o.sub.slice(0, n), -L.w / 2 + L.padL, -L.h / 2 + L.sy);
      }
      ctx.restore();
    }
  };

  /* black tag whose number counts up */
  MF.CountTag = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: 2, size: 58, decimals: 1, from: 0, unit: '', countDur: 0.9 }, o), film);
      const o2 = this.o, m = canvas(4, 4).getContext('2d');
      m.font = `700 ${o2.size}px ${FONT.title}`; m.letterSpacing = '1.5px';
      const full = this.fmt(o2.value);
      const tw = m.measureText(full).width;
      m.font = `22px ${FONT.type}`;
      const lw = o2.label ? m.measureText(o2.label).width : 0;
      const w = Math.round(Math.max(tw, lw) + 64), h = Math.round(o2.size * 1.2 + (o2.label ? 34 : 0) + 34);
      this.lay = { w, h, vy: (o2.label ? 34 : 0) + 17 + o2.size * 0.6 };
      this.b = this.bake(w, h, 34, (x) => {
        MF.paper(x, rectShape(w, h, 3), w, h, MF.PAPER.black, film, { seed: o2.seed, tex: 0.35, edgeA: 0.3 });
        if (o2.label) { x.font = `22px ${FONT.type}`; x.fillStyle = 'rgba(241,232,210,0.72)'; x.textBaseline = 'middle'; x.fillText(o2.label, 32, 30); }
        if (o2.tape !== false) MF.tape(x, w * 0.5, -2, Math.min(110, w * 0.45), 32, -0.06, (o2.seed || 3) + 1);
      });
    }
    fmt(v) {   // optional `sep` (e.g. ','): thousands separator in the integer part
      const o = this.o;
      let n = v.toFixed(o.decimals);
      if (o.sep) { const [i, f] = n.split('.'); n = i.replace(/\B(?=(\d{3})+$)/g, o.sep) + (f != null ? '.' + f : ''); }
      return n + (o.unit ? ' ' + o.unit : '');
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, L = this.lay;
      this.blit(ctx, this.b);
      const c0 = o.countAt != null ? o.countAt : o.t0;
      const u = MF.ease.out(MF.clamp((t - c0) / o.countDur));
      const v = o.from + (o.value - o.from) * u;
      ctx.font = `700 ${o.size}px ${FONT.title}`; ctx.letterSpacing = '1.5px'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#F3EBD8';
      ctx.fillText(this.fmt(v), -L.w / 2 + 32, -L.h / 2 + L.vy);
      ctx.restore();
    }
  };

  /* torn paper strip with a yellow highlighter swipe over part of its text */
  MF.Strip = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: -2, size: 44, font: 'type', hlDur: 0.4 }, o), film);
      const o2 = this.o, m = canvas(4, 4).getContext('2d');
      const font = o2.font === 'title' ? `700 ${o2.size}px ${FONT.title}` : `${o2.size}px ${FONT.type}`;
      this.font = font;
      m.font = font; m.letterSpacing = o2.font === 'title' ? '2px' : '1px';
      const tw = m.measureText(o2.text).width;
      const w = Math.round(tw + 70), h = Math.round(o2.size * 1.9);
      this.lay = { w, h, tx: 35, ty: h / 2 + 2 };
      if (o2.highlight) {
        const i = o2.text.toUpperCase().indexOf(o2.highlight.toUpperCase());
        const a = m.measureText(o2.text.slice(0, Math.max(0, i))).width, b = m.measureText(o2.text.slice(0, Math.max(0, i) + o2.highlight.length)).width;
        this.hl = [35 + a - 8, 35 + b + 8];
      }
      this.b = this.bake(w, h, 30, (x) => {
        MF.paper(x, tornShape(w, h, o2.seed || 11), w, h, o2.paper || MF.PAPER.strip, film, { seed: o2.seed, blur: 12, sx: 3, sy: 6, edgeA: 0.12 });
        x.font = font; x.letterSpacing = o2.font === 'title' ? '2px' : '1px'; x.textBaseline = 'middle'; x.fillStyle = MF.PAPER.ink;
        x.fillText(o2.text, this.lay.tx, this.lay.ty);
      });
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, L = this.lay;
      this.blit(ctx, this.b);
      if (this.hl && o.hlAt != null && t >= o.hlAt) {
        const u = MF.ease.out(MF.clamp((t - o.hlAt) / o.hlDur));
        const x0 = -L.w / 2 + this.hl[0], x1 = x0 + (this.hl[1] - this.hl[0]) * u, hh = o.size * 0.95;
        const r = MF.rng((o.seed || 11) + 5);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(247,214,32,0.88)';
        ctx.beginPath();
        ctx.moveTo(x0, -hh / 2 + 2);
        for (let X = x0; X < x1; X += 24) ctx.lineTo(X, -hh / 2 + (r() - 0.5) * 3);
        ctx.lineTo(x1, -hh / 2 + 1); ctx.lineTo(x1 + 3, hh / 2 - 2);
        for (let X = x1; X > x0; X -= 24) ctx.lineTo(X, hh / 2 + (r() - 0.5) * 3);
        ctx.lineTo(x0 - 3, hh / 2 - 1);
        ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }
  };

  /* tear-off calendar page; on `flipAt` the front page flips up over the binding and reveals the page beneath */
  MF.Calendar = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: -3, w: 300, h: 330, band: '#9B2B22', flipDur: 0.55 }, o), film);
      const o2 = this.o, { w, h } = o2, bh = 56;
      this.bh = bh;
      const page = (x, front) => {
        MF.paper(x, rectShape(w, h - bh, 2), w, h - bh, MF.PAPER.light, film, { seed: (o2.seed || 4) + (front ? 0 : 9), shadow: false, edgeA: 0.12 });
        x.textAlign = 'center'; x.textBaseline = 'middle';
        const f = front ? o2.front : o2.back;
        if (!f) return;
        x.font = `700 ${f.bigSize || 118}px ${FONT.title}`; x.letterSpacing = '2px'; x.fillStyle = f.color || MF.PAPER.ink;
        x.fillText(f.big, w / 2, (h - bh) * 0.42);
        if (f.small) { x.font = `${f.smallSize || 38}px ${FONT.type}`; x.letterSpacing = '1px'; x.fillStyle = f.smallColor || '#3A3026'; x.fillText(f.small, w / 2, (h - bh) * 0.8); }
      };
      this.front = this.bake(w, h - bh, 0, (x) => page(x, true));
      this.backPage = this.bake(w, h - bh, 0, (x) => page(x, false));
      this.flipBack = this.bake(w, h - bh, 0, (x) => MF.paper(x, rectShape(w, h - bh, 2), w, h - bh, '#E4DAC2', film, { seed: 21, shadow: false }));
      this.body = this.bake(w, h, 34, (x) => {
        MF.paper(x, rectShape(w, h, 4), w, h, MF.PAPER.light, film, { seed: o2.seed, edge: false });
      });
      this.binding = this.bake(w, bh, 10, (x) => {
        x.fillStyle = o2.band; x.beginPath(); x.roundRect(0, 0, w, bh, [4, 4, 0, 0]); x.fill();
        if (film.paperImg) { x.save(); x.clip(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.drawImage(film.paperImg, -300, -500); x.restore(); }
        x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, bh - 3, w, 3);
        for (const hx of [w * 0.22, w * 0.78]) { x.beginPath(); x.arc(hx, 14, 6.5, 0, Math.PI * 2); x.fillStyle = '#2A1A14'; x.fill(); }
        if (o2.header) {
          x.font = `600 21px ${FONT.title}`; x.letterSpacing = '3px'; x.textAlign = 'center'; x.textBaseline = 'middle';
          x.fillStyle = '#F6EBD6'; x.fillText(o2.header, w / 2, bh * 0.62);
        }
      });
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, { w, h } = o, bh = this.bh;
      ctx.translate(-w / 2, -h / 2);
      ctx.drawImage(this.body.c, -34, -34);
      ctx.drawImage(this.backPage.c, 0, bh);
      let th = 0, gone = 1;
      if (o.flipAt != null && t >= o.flipAt) {
        th = Math.PI * MF.ease.inOut(MF.clamp((t - o.flipAt) / o.flipDur));
        gone = 1 - MF.clamp((t - o.flipAt - o.flipDur) / 0.18);
      }
      if (gone > 0) {
        const c = Math.cos(th), sx = 1 + 0.07 * Math.sin(th);
        ctx.save();
        ctx.translate(w / 2, bh);
        ctx.scale(sx, c === 0 ? 0.0001 : c);
        ctx.translate(-w / 2, 0);
        const g = ctx.globalAlpha;
        ctx.globalAlpha = g * gone;
        if (c >= 0) {
          ctx.drawImage(this.front.c, 0, 0);
          if (th > 0) { ctx.fillStyle = `rgba(40,25,10,${0.45 * Math.sin(th)})`; ctx.fillRect(0, 0, w, h - bh); }
        } else {
          ctx.drawImage(this.flipBack.c, 0, 0);
          ctx.fillStyle = `rgba(40,25,10,${0.35 * Math.sin(th)})`; ctx.fillRect(0, 0, w, h - bh);
        }
        ctx.globalAlpha = g;
        ctx.restore();
      }
      ctx.drawImage(this.binding.c, -10, -10);
      ctx.restore();
    }
  };

  /* red rubber stamp: slams in (impact exactly at t0), slight bounce; the film adds the camera shake */
  MF.Stamp = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: -8, size: 150, color: '#DA2C1F' }, o), film);
      const o2 = this.o, m = canvas(4, 4).getContext('2d');
      m.font = `700 ${o2.size}px ${FONT.title}`; m.letterSpacing = '6px';
      const tw = m.measureText(o2.text).width;
      const w = Math.round(tw + 90), h = Math.round(o2.size * 1.25 + 40);
      this.b = this.bake(w, h, 10, (x) => {
        x.strokeStyle = o2.color; x.fillStyle = o2.color;
        x.lineWidth = 9; x.beginPath(); x.roundRect(5, 5, w - 10, h - 10, 14); x.stroke();
        x.lineWidth = 3; x.beginPath(); x.roundRect(18, 18, w - 36, h - 36, 8); x.stroke();
        x.font = `700 ${o2.size}px ${FONT.title}`; x.letterSpacing = '6px'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(o2.text, w / 2 + 3, h / 2 + 4);
        const r = MF.rng(o2.seed || 9);                          // worn rubber: speckles and scuffs
        x.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 900; i++) {
          x.globalAlpha = 0.25 + r() * 0.6;
          x.beginPath(); x.ellipse(r() * w, r() * h, 0.6 + r() * 2.4, 0.5 + r() * 1.6, r() * 3, 0, Math.PI * 2); x.fill();
        }
        x.globalAlpha = 0.5; x.lineWidth = 2;
        for (let i = 0; i < 14; i++) { x.beginPath(); const a = r() * w, b2 = r() * h; x.moveTo(a, b2); x.lineTo(a + (r() - 0.5) * 120, b2 + (r() - 0.5) * 14); x.stroke(); }
        x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      });
    }
    state(t) {
      const o = this.o, ts = o.t0 - 0.11;
      if (t < ts || (o.t1 != null && t >= o.t1 + 0.22)) return null;
      let scale, alpha = MF.clamp((t - ts) / 0.05);
      if (t < o.t0) scale = 2.1 - 1.1 * MF.ease.inQuad((t - ts) / 0.11);
      else { const d = t - o.t0; scale = 1 - 0.06 * Math.exp(-d * 16) * Math.cos(d * 44); }
      if (o.t1 != null && t > o.t1) { const u = MF.ease.inQuad(MF.clamp((t - o.t1) / 0.22)); scale *= 1 - 0.45 * u; alpha *= 1 - u; }
      return { scale, alpha: alpha * 0.96, rot: (o.rot * Math.PI) / 180 };
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      this.blit(ctx, this.b);
      ctx.restore();
    }
  };

  /* tracker card: rows of label + value; a value can be a timer counting between two words */
  MF.Tracker = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: 1.5, w: 440, title: '', bar: '#2B2724' }, o), film);
      const o2 = this.o, rows = o2.rows, w = o2.w, th = o2.title ? 50 : 14, rh = 66, h = th + rows.length * rh + 18;
      this.lay = { w, h, th, rh };
      this.b = this.bake(w, h, 34, (x) => {
        MF.paper(x, rectShape(w, h, 3), w, h, MF.PAPER.cream, film, { seed: o2.seed });
        if (o2.title) {
          x.fillStyle = o2.bar; x.fillRect(0, 0, w, th - 6);
          x.font = `600 24px ${FONT.title}`; x.letterSpacing = '4px'; x.textBaseline = 'middle'; x.fillStyle = '#F2E9D3';
          x.fillText(o2.title, 24, (th - 6) / 2 + 1);
        }
        x.font = `22px ${FONT.type}`; x.letterSpacing = '1px'; x.textBaseline = 'middle';
        rows.forEach((r, i) => {
          const y = th + i * rh + rh / 2 + 6;
          x.fillStyle = MF.PAPER.inkSoft; x.fillText(r.label, 24, y);
          if (i) { x.fillStyle = 'rgba(90,70,50,0.25)'; x.fillRect(20, th + i * rh + 6, w - 40, 1.5); }
        });
        if (o2.tape !== false) MF.tape(x, w - 70, -4, 110, 32, 0.12, (o2.seed || 5) + 3);
      });
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, L = this.lay;
      this.blit(ctx, this.b);
      ctx.font = `700 ${o.vsize || 42}px ${FONT.title}`; ctx.letterSpacing = '1px'; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
      o.rows.forEach((r, i) => {
        const y = -L.h / 2 + L.th + i * L.rh + L.rh / 2 + 6;
        let v = r.value;
        if (r.timer) {
          const T = r.timer, u = MF.clamp((t - T.t0) / Math.max(0.01, T.t1 - T.t0));
          const m = Math.round(T.from + (T.value - T.from) * u);
          v = T.fmt === 'n' ? `${m}${T.unit ? ' ' + T.unit : ''}` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;   // fmt 'n': a plain counter
          ctx.fillStyle = u > 0 && u < 1 ? '#B3261C' : MF.PAPER.ink;
        } else ctx.fillStyle = MF.PAPER.ink;
        if (r.valueAt != null && t < r.valueAt) return;
        ctx.fillText(v, L.w / 2 - 26, y);
      });
      ctx.restore();
    }
  };

  /* price tag on a string: a pointed manila tag with a punched hole and a colour band; `front` / `back`:
     {title, big, small, color, band, bigSize, smallSize, titleSize}. On `flipAt` (KEY) it turns over about its vertical
     axis (flipDur 0.5 s) to the back, whose pointed end is mirrored, like a real tag. Fields: w (330), h (196), color. */
  MF.PriceTag = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: -4, w: 330, h: 196, color: '#2F5D8A', flipDur: 0.5 }, o), film);
      const o2 = this.o, { w, h } = o2, nk = Math.round(h * 0.34), hx = nk * 0.7;
      this.hx = hx;
      const outline = (x, mir) => {
        const X = (v) => (mir ? w - v : v);
        x.beginPath(); x.moveTo(X(nk), 0); x.lineTo(X(w), 0); x.lineTo(X(w), h); x.lineTo(X(nk), h); x.lineTo(X(0), h / 2); x.closePath();
      };
      this.outline = outline;
      const face = (x, f, mir, seed) => {
        MF.paper(x, (c) => outline(c, mir), w, h, o2.paper || '#EEE0BE', film, { seed });
        x.save(); outline(x, mir); x.clip();
        x.fillStyle = (f && f.band) || o2.color; x.fillRect(0, 0, w, 15);
        x.globalAlpha = 0.18; x.fillStyle = '#000'; x.fillRect(0, 15, w, 2); x.globalAlpha = 1;
        x.restore();
        const cx = mir ? w - hx : hx;                      // punched hole with a reinforcement ring
        x.beginPath(); x.arc(cx, h / 2, 17, 0, Math.PI * 2); x.lineWidth = 7; x.strokeStyle = 'rgba(150,118,70,0.35)'; x.stroke();
        x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx, h / 2, 10.5, 0, Math.PI * 2); x.fill(); x.restore();
        if (!f) return;
        const mid = mir ? (w - nk) / 2 + 6 : nk + (w - nk) / 2 - 6;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        if (f.title) { x.font = `600 ${f.titleSize || 25}px ${FONT.title}`; x.letterSpacing = '3px'; x.fillStyle = MF.PAPER.inkSoft; x.fillText(f.title, mid, 44); }
        x.font = `700 ${f.bigSize || 70}px ${FONT.title}`; x.letterSpacing = '1px'; x.fillStyle = f.color || MF.PAPER.ink;
        x.fillText(f.big, mid, f.small ? h * 0.55 : h * 0.6);
        if (f.small) { x.font = `${f.smallSize || 26}px ${FONT.type}`; x.letterSpacing = '1px'; x.fillStyle = f.smallColor || '#3A3026'; x.fillText(f.small, mid, h * 0.83); }
      };
      this.front = this.bake(w, h, 34, (x) => face(x, o2.front, false, o2.seed || 4));
      this.backFace = this.bake(w, h, 34, (x) => face(x, o2.back, true, (o2.seed || 4) + 9));
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, { w, h } = o;
      let th = 0;
      if (o.flipAt != null && o.back && t >= o.flipAt) th = Math.PI * MF.ease.inOut(MF.clamp((t - o.flipAt) / o.flipDur));
      const c = Math.cos(th), back = c < 0;
      ctx.save();
      ctx.scale(Math.max(Math.abs(c), 0.004), 1 + 0.05 * Math.sin(th));
      this.blit(ctx, back ? this.backFace : this.front);
      if (th > 0 && th < Math.PI) {
        ctx.translate(-w / 2, -h / 2); this.outline(ctx, back);
        ctx.fillStyle = `rgba(40,25,10,${0.4 * Math.sin(th)})`; ctx.fill();
      }
      ctx.restore();
      // the string: tied through the hole, running up and off to the side
      const hx = (this.hx - w / 2) * c, sgn = hx <= 0 ? -1 : 1;
      ctx.strokeStyle = 'rgba(62,46,30,0.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, -6); ctx.bezierCurveTo(hx + sgn * 18, -h * 0.45, hx + sgn * 34, -h * 0.62, hx + sgn * (52 + 20 * Math.abs(c)), -h * 0.78); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx, 6); ctx.bezierCurveTo(hx - sgn * 6, -h * 0.3, hx + sgn * 26, -h * 0.6, hx + sgn * (60 + 16 * Math.abs(c)), -h * 0.74); ctx.stroke();
      ctx.restore();
    }
  };

  /* end card: a number, scribbled out in marker, then the real punchline written in marker */
  MF.EndCard = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: -1.5, w: 640, h: 420, size: 150, handSize: 104 }, o), film);
      const o2 = this.o, { w, h } = o2;
      this.b = this.bake(w, h, 40, (x) => {
        MF.paper(x, rectShape(w, h, 4), w, h, MF.PAPER.cream, film, { seed: o2.seed, blur: 24, sy: 12 });
        if (o2.label) { x.font = `26px ${FONT.type}`; x.letterSpacing = '2px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = MF.PAPER.inkSoft; x.fillText(o2.label, w / 2, 46); }
        x.font = `700 ${o2.size}px ${FONT.title}`; x.letterSpacing = '3px'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillStyle = MF.PAPER.ink; x.fillText(o2.text, w / 2, h * 0.36);
        MF.tape(x, w * 0.5, -4, 150, 36, -0.04, (o2.seed || 6) + 2);
      });
      const m = canvas(4, 4).getContext('2d');
      m.font = `700 ${o2.size}px ${FONT.title}`; m.letterSpacing = '3px';
      const tw = m.measureText(o2.text).width;
      this.scrib = new MF.Stroke({ pts: MF.scribblePts(tw + 40, o2.size * 0.7, 11, o2.seed || 3), space: 'screen', t0: o2.scribbleAt, dur: 0.55, width: 12, ease: 'linear', seed: 5 });
      this.hand = new MF.Hand({ text: o2.replace, t0: o2.replaceAt, size: o2.handSize, rot: -5, screen: [0, 0], seed: 13 });
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o;
      this.blit(ctx, this.b);
      if (o.scribbleAt != null && t >= o.scribbleAt) {
        ctx.save(); ctx.translate(0, -o.h / 2 + o.h * 0.36);
        MF.inkPaths(ctx, this.scrib.runs(t, film, MF.Cam.identity), 12, 1);
        ctx.restore();
      }
      if (o.replaceAt != null && t >= o.replaceAt) {
        ctx.save(); ctx.translate(0, -o.h / 2 + o.h * 0.76);
        this.hand.draw(ctx, t, film, MF.Cam.identity);
        ctx.restore();
      }
      ctx.restore();
    }
  };

  /* paper clock face: the minute hand sweeps `minutes` from `sweepAt` over `sweepDur` s (keys resolved by the film),
     the swept sector fills with red marker, and a strip tucked under the face counts up ("40 MIN"). */
  MF.Clock = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: 3, r: 112, minutes: 40, startMin: 0, unit: 'MIN', sweepDur: 1.2 }, o), film);
      const o2 = this.o, R = o2.r, TAU = Math.PI * 2;
      const sw = Math.round(R * 1.55), sh = 62, w = 2 * R + 16, h = 2 * R + 16 + (o2.unit ? sh - 14 : 0);
      this.lay = { w, h, R, cy: -h / 2 + 8 + R, sy: -h / 2 + 2 * R + 2 + sh / 2 };
      this.b = this.bake(w, h, 34, (x) => {
        const cx = w / 2, cy = 8 + R;
        if (o2.unit) {                                     // the label strip, peeking out under the face
          x.save(); x.translate(cx - sw / 2, 2 * R + 2);
          MF.paper(x, tornShape(sw, sh, (o2.seed || 8) + 4, 2, 7, 4), sw, sh, MF.PAPER.strip, film, { seed: (o2.seed || 8) + 4, blur: 10, sx: 3, sy: 5, edgeA: 0.1 });
          x.restore();
        }
        x.save(); x.translate(cx - R, cy - R);
        MF.paper(x, (c) => { c.beginPath(); c.arc(R, R, R, 0, TAU); }, 2 * R, 2 * R, MF.PAPER.light, film, { seed: o2.seed, blur: 16, edgeA: 0.16 });
        x.restore();
        x.strokeStyle = '#2B2420'; x.lineWidth = 7; x.beginPath(); x.arc(cx, cy, R - 3.5, 0, TAU); x.stroke();
        x.lineWidth = 1.5; x.globalAlpha = 0.5; x.beginPath(); x.arc(cx, cy, R - 12, 0, TAU); x.stroke(); x.globalAlpha = 1;
        x.lineCap = 'round';
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * TAU - TAU / 4, big = i % 5 === 0, r0 = R - (big ? (i % 15 === 0 ? 30 : 24) : 18), r1 = R - 13;
          x.lineWidth = big ? (i % 15 === 0 ? 5 : 3.5) : 1.6; x.strokeStyle = big ? '#2B2420' : 'rgba(43,36,32,0.6)';
          x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.stroke();
        }
        x.font = `600 ${Math.round(R * 0.25)}px ${FONT.title}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2B2420';
        [[12, 0], [3, 1], [6, 2], [9, 3]].forEach(([n, k]) => { const a = (k / 4) * TAU - TAU / 4, rr = R - 48; x.fillText(String(n), cx + Math.cos(a) * rr, cy + Math.sin(a) * rr + 1); });
        if (o2.tape !== false) MF.tape(x, cx + (MF.hash(o2.seed || 2) - 0.5) * R * 0.5, 10, 104, 30, (MF.hash((o2.seed || 2) + 3) - 0.5) * 0.3, (o2.seed || 2) + 6);
      });
    }
    swept(t) {
      const o = this.o, s0 = o.sweepAt != null ? o.sweepAt : o.t0 + 0.25;
      return o.minutes * MF.ease.inOut(MF.clamp((t - s0) / Math.max(0.05, o.sweepDur)));
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, L = this.lay, R = L.R, cy = L.cy, TAU = Math.PI * 2;
      this.blit(ctx, this.b);
      const m = this.swept(t), a0 = -TAU / 4, a1 = a0 + (m / 60) * TAU;
      if (m > 0.05) {
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.arc(0, cy, R - 15, a0, a1); ctx.closePath();
        ctx.fillStyle = 'rgba(217,41,29,0.26)'; ctx.fill();
        const pts = [];
        for (let k = 0; k <= 40; k++) { const a = a0 + (a1 - a0) * (k / 40); pts.push([Math.cos(a) * (R - 17), cy + Math.sin(a) * (R - 17)]); }
        MF.inkPaths(ctx, [pts], 6, ctx.globalAlpha);
      }
      const hand = (ang, len, wd, col) => {
        ctx.save(); ctx.translate(0, cy); ctx.rotate(ang);
        ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = wd;
        ctx.shadowColor = 'rgba(30,20,10,0.3)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
        ctx.beginPath(); ctx.moveTo(-len * 0.16, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.restore();
      };
      const tot = o.startMin + m;
      hand((tot / 720) * TAU - TAU / 4, R * 0.5, 9, '#1E1A16');
      hand((tot / 60) * TAU - TAU / 4, R * 0.8, 5.5, '#1E1A16');
      ctx.beginPath(); ctx.arc(0, cy, 8, 0, TAU); ctx.fillStyle = MF.INK.core; ctx.fill();
      if (o.unit) {
        ctx.font = `700 ${o.usize || 40}px ${FONT.title}`; ctx.letterSpacing = '1.5px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = MF.PAPER.ink; ctx.fillText(`${Math.round(m)} ${o.unit}`, 0, L.sy + 3);
      }
      ctx.restore();
    }
  };

  /* passport: a closed booklet pops in; on `flipAt` the cover swings open over its spine and `stamps` thump onto the
     page one by one (each at its own key `at`, else `stampGap` s apart once the cover is open).
     stamps: [{text, sub, color, at?}] — up to 4 sit in a 2 x 2 grid. */
  MF.Passport = class extends Prop {
    constructor(o, film) {
      super(Object.assign({ rot: -3, w: 236, h: 326, cover: '#22344E', title: 'PASSPORT', flipDur: 0.5, stampGap: 0.3, stamps: [], header: '' }, o), film);
      const o2 = this.o, { w, h } = o2, sd = o2.seed || 9;
      this.coverB = this.bake(w, h, 34, (x) => {
        MF.paper(x, rectShape(w, h, 6), w, h, o2.cover, film, { seed: sd, tex: 0.45, edgeA: 0.4 });
        const g = x.createLinearGradient(0, 0, 22, 0);
        g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(0, 0, 22, h);
        x.fillStyle = '#C8A65C'; x.strokeStyle = '#C8A65C'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = `600 30px ${FONT.title}`; x.letterSpacing = '6px'; x.fillText(o2.title, w / 2 + 6, h * 0.2);
        const ex = w / 2 + 4, ey = h * 0.53, er = Math.min(w, h) * 0.2;
        x.lineWidth = 3; x.beginPath(); x.arc(ex, ey, er, 0, Math.PI * 2); x.stroke();
        x.lineWidth = 1.5; x.beginPath(); x.arc(ex, ey, er - 8, 0, Math.PI * 2); x.stroke();
        x.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? er * 0.3 : er * 0.68; x.lineTo(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr); }
        x.closePath(); x.fill();
        x.fillRect(w * 0.3, h * 0.84, w * 0.42, 3);
      });
      this.insideB = this.bake(w, h, 0, (x) => MF.paper(x, rectShape(w, h, 6), w, h, '#DCCFB2', film, { seed: sd + 5, shadow: false, edgeA: 0.2 }));
      this.pageB = this.bake(w, h, 34, (x) => {
        MF.paper(x, rectShape(w, h, 4), w, h, '#EFE6CF', film, { seed: sd + 3, edgeA: 0.14 });
        x.save(); x.beginPath(); x.rect(0, 0, w, h); x.clip();
        x.strokeStyle = 'rgba(60,120,120,0.16)'; x.lineWidth = 1;
        for (let k = 0; k < 26; k++) {             // faint guilloche lines, as on a visa page
          x.beginPath();
          for (let X = 0; X <= w; X += 4) x.lineTo(X, (k + 0.5) * (h / 26) + 5 * Math.sin(X * 0.06 + k * 0.7));
          x.stroke();
        }
        x.restore();
        const gs = x.createLinearGradient(0, 0, 18, 0);
        gs.addColorStop(0, 'rgba(60,40,20,0.28)'); gs.addColorStop(1, 'rgba(60,40,20,0)');
        x.fillStyle = gs; x.fillRect(0, 0, 18, h);
        if (o2.header) { x.font = `17px ${FONT.type}`; x.letterSpacing = '2px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#6B5948'; x.fillText(o2.header, w / 2 + 6, 24); }
      });
      this.stampB = o2.stamps.map((s, i) => {
        const sw = Math.round(w * 0.4), shh = 66, col = s.color || '#2E4E9E', r = MF.rng(sd * 31 + i);
        return this.bake(sw, shh, 6, (x) => {
          x.strokeStyle = col; x.fillStyle = col; x.globalAlpha = 0.88;
          x.lineWidth = 3.5; x.beginPath(); x.roundRect(2, 2, sw - 4, shh - 4, i % 2 ? 30 : 7); x.stroke();
          x.lineWidth = 1.4; x.beginPath(); x.roundRect(8, 8, sw - 16, shh - 16, i % 2 ? 24 : 4); x.stroke();
          x.textAlign = 'center'; x.textBaseline = 'middle';
          x.font = `700 21px ${FONT.title}`; x.letterSpacing = '1.5px'; x.fillText(s.text, sw / 2, s.sub ? shh * 0.4 : shh / 2);
          if (s.sub) { x.font = `13px ${FONT.type}`; x.letterSpacing = '1px'; x.fillText(s.sub, sw / 2, shh * 0.72); }
          x.globalCompositeOperation = 'destination-out';
          for (let k = 0; k < 140; k++) { x.globalAlpha = 0.3 + r() * 0.6; x.beginPath(); x.ellipse(r() * sw, r() * shh, 0.5 + r() * 1.8, 0.4 + r() * 1.2, r() * 3, 0, Math.PI * 2); x.fill(); }
          x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
        });
      });
      const base = o2.flipAt != null ? o2.flipAt + o2.flipDur * 0.9 : o2.t0 + 0.35;
      this.stampT = o2.stamps.map((s, i) => (s.t != null ? s.t : base + i * o2.stampGap));
      this.stampPos = o2.stamps.map((s, i) => [(i % 2 ? 0.27 : -0.21) * w, (i < 2 ? -0.17 : 0.2) * h, ((MF.hash(sd + i * 13) - 0.5) * 22 * Math.PI) / 180]);
    }
    draw(ctx, t, film, cam) {
      if (!this.begin(ctx, t, cam)) return;
      const o = this.o, { w, h } = o;
      const u = o.flipAt != null && t >= o.flipAt ? MF.ease.inOut(MF.clamp((t - o.flipAt) / o.flipDur)) : 0;
      ctx.translate((w / 2) * u, 0);             // keep the spread centred as the cover opens
      if (u > 0) {
        ctx.drawImage(this.pageB.c, -w / 2 - 34, -h / 2 - 34);
        this.stampB.forEach((b, i) => {
          const ts = this.stampT[i];
          if (t < ts - 0.07) return;
          const d = t - ts, [sx, sy, sr] = this.stampPos[i];
          const sc = d < 0 ? 1.7 - 0.7 * MF.ease.inQuad((d + 0.07) / 0.07) : 1 - 0.05 * Math.exp(-d * 18) * Math.cos(d * 50);
          const g = ctx.globalAlpha;
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(sr); ctx.scale(sc, sc);
          ctx.globalAlpha = g * MF.clamp((d + 0.07) / 0.04);
          ctx.drawImage(b.c, -b.w / 2 - b.pad, -b.h / 2 - b.pad);
          ctx.restore();
        });
      }
      const th = Math.PI * u, c = Math.cos(th);
      ctx.save();
      ctx.translate(-w / 2, 0);
      ctx.scale(Math.abs(c) < 1e-4 ? 1e-4 : c, 1);
      if (c >= 0) {
        ctx.drawImage(this.coverB.c, -34, -h / 2 - 34);
        if (th > 0) { ctx.fillStyle = `rgba(10,15,25,${0.4 * Math.sin(th)})`; ctx.fillRect(0, -h / 2, w, h); }
      } else {
        ctx.drawImage(this.insideB.c, 0, -h / 2);
        ctx.fillStyle = `rgba(40,25,10,${0.3 * Math.sin(th)})`; ctx.fillRect(0, -h / 2, w, h);
      }
      ctx.restore();
      ctx.restore();
    }
  };

  /* dotted path with a moving marker; `crossAt` is the word on which the marker crosses `crossFrac` of the path */
  MF.SwimPath = class {
    constructor(o) {
      this.o = Object.assign({ dot: 5.2, gap: 23, r: 13, t1: null }, o);
      const P = o.pts;
      this.cum = [0];
      for (let i = 1; i < P.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      this.L = this.cum[this.cum.length - 1];
    }
    prog(t) {
      const o = this.o;
      if (t <= o.t0) return 0;
      if (o.crossAt != null && o.crossFrac != null) {   // piecewise: reach the line exactly on the crossing word
        if (t < o.crossAt) return o.crossFrac * this.ramp((t - o.t0) / (o.crossAt - o.t0), true);
        return o.crossFrac + (1 - o.crossFrac) * this.ramp((t - o.crossAt) / (o.tEnd - o.crossAt), false);
      }
      return MF.ease.inOut(MF.clamp((t - o.t0) / (o.tEnd - o.t0)));
    }
    /* eased start (first leg) or eased stop (second leg), linear in between */
    ramp(u, first) {
      u = MF.clamp(u);
      if (first) return (u < 0.3 ? (u * u) / 0.6 : u - 0.15) / 0.85;
      return (u < 0.7 ? u : 0.85 - ((1 - u) * (1 - u)) / 0.6) / 0.85;
    }
    at(s) {
      const P = this.o.pts;
      for (let i = 1; i < P.length; i++) if (this.cum[i] >= s) { const u = (s - this.cum[i - 1]) / (this.cum[i] - this.cum[i - 1] || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u]; }
      return P[P.length - 1];
    }
    draw(ctx, t, film, cam) {
      const o = this.o;
      if (t < o.t0) return;
      let a = 1;
      if (o.t1 != null && t > o.t1) { a = 1 - MF.clamp((t - o.t1) / 0.22); if (a <= 0) return; }
      const p = MF.clamp(this.prog(t)), s = p * this.L;
      const sp = o.gap / film.camAt(o.t0).S;
      ctx.save();
      ctx.globalAlpha = a;
      for (let k = 0; k * sp <= s; k++) {
        const [wx, wy] = this.at(k * sp), [x, y] = cam.toScreen(wx, wy);
        ctx.beginPath(); ctx.arc(x, y, o.dot, 0, Math.PI * 2); ctx.fillStyle = MF.INK.under; ctx.fill();
        ctx.beginPath(); ctx.arc(x - 0.4, y - 0.4, o.dot - 0.8, 0, Math.PI * 2); ctx.fillStyle = MF.INK.core; ctx.fill();
      }
      const [wx, wy] = this.at(s), [x, y] = cam.toScreen(wx, wy);
      const pulse = ((t - o.t0) % 1.1) / 1.1;
      ctx.beginPath(); ctx.arc(x, y, o.r + 18 * pulse, 0, Math.PI * 2); ctx.strokeStyle = `rgba(217,41,29,${0.6 * (1 - pulse)})`; ctx.lineWidth = 3; ctx.stroke();
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      ctx.beginPath(); ctx.arc(x, y, o.r + 3.5, 0, Math.PI * 2); ctx.fillStyle = '#F6EEDC'; ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.beginPath(); ctx.arc(x, y, o.r, 0, Math.PI * 2); ctx.fillStyle = MF.INK.core; ctx.fill();
      ctx.beginPath(); ctx.arc(x - 3, y - 3, o.r * 0.35, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,200,190,0.5)'; ctx.fill();
      ctx.restore();
    }
  };
})();
