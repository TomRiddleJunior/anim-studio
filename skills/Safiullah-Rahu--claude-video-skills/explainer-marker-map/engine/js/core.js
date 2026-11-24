/* map-films engine · core: math, easing, the pop spring, seeded noise, word keys.
   Everything here is a pure function of its arguments (no clocks, no Math.random). */
(function () {
  'use strict';
  const MF = (window.MF = window.MF || {});

  MF.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  MF.lerp = (a, b, u) => a + (b - a) * u;
  MF.smooth = (e0, e1, x) => { const u = MF.clamp((x - e0) / (e1 - e0)); return u * u * (3 - 2 * u); };
  MF.ease = {
    linear: (u) => u,
    quart: (u) => (u < 0.5 ? 8 * u * u * u * u : 1 - Math.pow(-2 * u + 2, 4) / 2),   // in-out quartic (zooms)
    sine: (u) => -(Math.cos(Math.PI * u) - 1) / 2,                                       // drifts
    out: (u) => 1 - Math.pow(1 - u, 3),
    in: (u) => u * u * u,
    inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    outQuad: (u) => 1 - (1 - u) * (1 - u),
    inQuad: (u) => u * u,
  };

  /* Pop-in spring: damping 0.48, 19 rad/s, from 0 to 1 with overshoot. dt in seconds since the pop. */
  MF.spring = function (dt, zeta = 0.48, w = 19) {
    if (dt <= 0) return 0;
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * dt) * (Math.cos(wd * dt) + ((zeta * w) / wd) * Math.sin(wd * dt));
  };
  /* scale/alpha/rotation of a physical pop-in that exits by shrinking + fading in 0.22 s */
  MF.popState = function (t, t0, t1, rot0 = 0, rotFrom = 7) {
    if (t < t0 || (t1 != null && t >= t1 + 0.22)) return null;
    const s = MF.spring(t - t0);
    let scale = 0.55 + 0.45 * s, alpha = MF.clamp((t - t0) / 0.06), rot = rot0 + rotFrom * (1 - s);
    if (t1 != null && t > t1) {
      const u = MF.ease.inQuad(MF.clamp((t - t1) / 0.22));
      scale *= 1 - 0.45 * u; alpha *= 1 - u;
    }
    return { scale, alpha, rot: (rot * Math.PI) / 180 };
  };

  /* hashing + seeded noise */
  MF.hash = function (n) {          // integer-ish → [0,1)
    let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
  MF.hash2 = (a, b) => MF.hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));
  MF.rng = function (seed) {        // mulberry32
    let a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  MF.noise = function (x, seed = 0) { // smooth 1-D value noise in [-1, 1]
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = MF.hash2(i, seed) * 2 - 1, b = MF.hash2(i + 1, seed) * 2 - 1;
    return a + (b - a) * u;
  };

  /* ── word keys ───────────────────────────────────────────────────────────────────────────────────────────
     Every event is keyed to a word, never to a second:
       "tomorrow"            start of the 1st "tomorrow" in the script
       "Diomede#2"           start of the 2nd "Diomede"
       "Date Line"           a word sequence (start of "Date")       "Date Line>"  end of "Line"
       "dateline/the#2"      the 2nd "the" inside line id "dateline"
       "1987@+0.15"          an offset in seconds after "@"
       "line:swim" / "line:swim>"   start / end of a line          "END"  end of the last word   "START"  0
     Matching ignores case, apostrophes and outer punctuation (normWord). */
  MF.normWord = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/^[.,;:!?"()\[\]{}…—–]+|[.,;:!?"()\[\]{}…—–]+$/g, '');

  MF.Timing = class {
    constructor(tm) {
      this.tm = tm;
      this.words = [];
      tm.lines.forEach((ln, li) => ln.words.forEach((w, wi) => this.words.push({ ...w, n: MF.normWord(w.w), line: ln.id, li, wi })));
      this.lines = Object.fromEntries(tm.lines.map((l) => [l.id, l]));
      this.speechEnd = tm.speechEnd != null ? tm.speechEnd : this.words[this.words.length - 1].end;
      this.duration = tm.duration;
      this.cache = new Map();
    }
    key(spec) {
      if (typeof spec === 'number') throw new Error(`key ${spec}: key events to words, not seconds`);
      if (this.cache.has(spec)) return this.cache.get(spec);
      let s = String(spec).trim(), off = 0;
      const at = s.lastIndexOf('@');
      if (at >= 0) { off = parseFloat(s.slice(at + 1)); s = s.slice(0, at).trim(); if (!isFinite(off)) throw new Error(`bad offset in key "${spec}"`); }
      let t;
      if (s === 'START') t = 0;
      else if (s === 'END') t = this.speechEnd;
      else if (s.startsWith('line:')) {
        const end = s.endsWith('>'), id = s.slice(5).replace(/>$/, '');
        const ln = this.lines[id];
        if (!ln) throw new Error(`key "${spec}": no line "${id}"`);
        t = end ? ln.end : ln.start;
      } else {
        let end = false, nth = 1, line = null;
        if (s.endsWith('>')) { end = true; s = s.slice(0, -1); }
        const h = s.match(/#(\d+)$/);
        if (h) { nth = +h[1]; s = s.slice(0, h.index); }
        const sl = s.indexOf('/');
        if (sl >= 0) { line = s.slice(0, sl); s = s.slice(sl + 1); if (!this.lines[line]) throw new Error(`key "${spec}": no line "${line}"`); }
        const seq = s.split(/\s+/).map(MF.normWord).filter(Boolean);
        let count = 0, hit = null;
        for (let i = 0; i + seq.length <= this.words.length && !hit; i++) {
          if (line && this.words[i].line !== line) continue;
          let ok = true;
          for (let k = 0; k < seq.length; k++) if (this.words[i + k].n !== seq[k]) { ok = false; break; }
          if (ok && ++count === nth) hit = [this.words[i], this.words[i + seq.length - 1]];
        }
        if (!hit) throw new Error(`key "${spec}": word not found (occurrence ${nth})`);
        t = end ? hit[1].end : hit[0].start;
      }
      t += off;
      this.cache.set(spec, t);
      return t;
    }
    /* the word being spoken at time t (for debugging overlays) */
    wordAt(t) { return this.words.find((w) => t >= w.start && t < w.end) || null; }
  };

  /* per-format values: {h: <16:9 value>, v: <9:16 value>} anywhere in the story resolves to one of them */
  MF.resolveFmt = function (obj, vertical) {
    if (Array.isArray(obj)) return obj.map((o) => MF.resolveFmt(o, vertical));
    if (obj && typeof obj === 'object' && !(obj instanceof Function)) {
      const k = Object.keys(obj);
      if (k.length === 2 && k.includes('h') && k.includes('v')) return MF.resolveFmt(vertical ? obj.v : obj.h, vertical);
      const out = {};
      for (const key of k) out[key] = MF.resolveFmt(obj[key], vertical);
      return out;
    }
    return obj;
  };
})();
