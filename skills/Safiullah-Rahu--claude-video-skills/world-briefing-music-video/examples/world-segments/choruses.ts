// THE STATE OF THE WORLD — the chorus system: pre1 · chorus1 · pre2 · chorus2 · chorus3.
//
// One design for all five, so the chorus reads as a recurring, iconic beat of the film:
//  - The night globe (the shared camera, X.view()) turns exactly ONE revolution per chorus, ticking forward on every
//    beat; a bezel of beat ticks around it fills as it turns. A full turn ends where it started, so the hand-off to the
//    next segment's globe is seamless.
//  - The sung words land one at a time as huge Newsreader type, phrase by phrase, each word on its sung word.
//  - The crowd answer "Still turning!" is the one vermilion moment: zoom punch, a red halo flare and ring pulses.
//  - The pre-chorus winds the globe back (tension), types the IMF report title on the voice, and "Urgent choices."
//    slams in; the chorus's first word releases the wind-up.
// Variations are only globe angle (film.json focus) and intensity; chorus3 (the last) adds teal and a slow push.
import type { Segment, SegInfo, X } from '../x';
import type { Line, Word } from '../../engine/lyrics';
import type { PostOverrides } from '../../engine/scene';
import type { GlobeView } from '../globe';
import { C, PAPER, RED, TEAL, NIGHT, FONT, rgbaHex, clamp, ease, lerp, hash, measure, fi, text, wrap } from '../kit';
import { font } from '../../engine/type';

const W = 1920, H = 1080, CX = 960;
type Ctx = CanvasRenderingContext2D;

// The places verse 1 names under fighting or violence (Iran, Yemen, Ukraine, Gaza, Sudan, Tigray, Pakistan and
// Afghanistan, eastern Congo, Myanmar, Haiti); verse 2 adds Nepal's glacier collapse (Congo's Ebola is already lit).
const STRAIN = ['Iran', 'Yemen', 'Ukraine', 'Palestine', 'Sudan', 'Ethiopia', 'Pakistan', 'Afghanistan', 'Dem. Rep. Congo', 'Myanmar', 'Haiti'];
const STRAIN2 = [...STRAIN, 'Nepal'];

interface Cfg { pre?: string; hl: string[]; amp: number; teal: number; push: number }
const CFG: Record<string, Cfg> = {
  chorus1: { pre: 'pre1', hl: STRAIN, amp: 1, teal: 0, push: 0 },
  chorus2: { pre: 'pre2', hl: STRAIN2, amp: 1.1, teal: 0, push: 0 },
  chorus3: { hl: STRAIN2, amp: 1.25, teal: 1, push: 0.11 },
};

// ------------------------------------------------------------------------------------------------ helpers
const linesOf = (X: X, id: string): Line[] => X.ly.lines.filter((l) => l.section === id);
const segOf = (X: X, id: string): SegInfo => X.segs.find((s) => s.id === id)!;
/** 1 at t0, halving every hl seconds after; 0 before. */
const decay = (t: number, t0: number, hl = 0.12) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));
const smooth = (e0: number, e1: number, x: number) => { const u = clamp((x - e0) / (e1 - e0)); return u * u * (3 - 2 * u); };
const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

/** Timing of one chorus (and its pre-chorus, if any). */
interface CT { id: string; ch: SegInfo; pre?: SegInfo; lines: Line[]; w0: number; wl: number; wEnd: number; ans: Word[] }
function info(X: X, chId: string): CT {
  const ch = segOf(X, chId), cfg = CFG[chId]!, lines = linesOf(X, chId);
  const w0 = lines[0]!.words[0]!.start, wl = lines[lines.length - 1]!.end;
  // the answer words ("Still", "turning!") of the call-and-answer lines only (not "keeps turning")
  const ans = lines.filter((l) => /still/i.test(l.text)).flatMap((l) => l.words.slice(l.words.findIndex((w) => w.w.includes(')')) + 1));
  return { id: chId, ch, pre: cfg.pre ? segOf(X, cfg.pre) : undefined, lines, w0, wl, wEnd: Math.min(wl + 0.15, ch.t1 - 0.7), ans };
}

// ------------------------------------------------------------------------------------------------ the turning globe
/** Beat index, eased so the globe ticks forward on each beat (outCubic over the first 38% of the beat). */
const ticked = (X: X, t: number) => { const b = X.beat(t), f = Math.floor(b); return f + ease.outCubic(clamp((b - f) / 0.38)); };
const WIND = 14; // degrees the pre-chorus winds the globe back
/** 0..1: the pre-chorus winds up (inCubic) to the chorus's first word, which releases it. */
function windup(t: number, I: CT) {
  if (!I.pre) return 0;
  if (t < I.w0) return ease.inCubic(clamp((t - (I.pre.t0 + 0.5)) / (I.w0 - I.pre.t0 - 0.5)));
  return 1 - ease.outCubic(clamp((t - I.w0) / 0.7));
}
/** Extra rotation (deg): one full turn from the first sung word to the last, ticking on the beat. */
function spin(X: X, t: number, I: CT) {
  const a = ticked(X, I.w0), b = ticked(X, I.wEnd);
  const lin = clamp((X.beat(t) - X.beat(I.w0)) / (X.beat(I.wEnd) - X.beat(I.w0)));
  const tk = clamp((ticked(X, t) - a) / (b - a));
  return 360 * clamp(0.78 * tk + 0.22 * lin) - WIND * windup(t, I);
}
/** The shared camera + the chorus spin. The shared camera jumps at every segment boundary (its idle drift restarts
 *  and its fly-in starts 6% of the way along, because the fly begins before t0 but the previous focus still rules
 *  until t0). At each boundary this module enters (the pre-chorus's t0, the chorus's t0) the jump is blended out over
 *  1.2 s. From t0 on this segment is opaque over its outgoing neighbour, so no ghost shows. */
function camera(X: X, t: number, I: CT): GlobeView {
  const v: GlobeView = { ...X.view(t) };
  for (const tb of I.pre ? [I.pre.t0, I.ch.t0] : [I.ch.t0]) {
    const k = t < tb ? 0 : 1 - ease.inOutCubic(clamp((t - tb) / 1.2));
    if (k <= 0) continue;
    const a = X.view(tb - 1e-3), b = X.view(tb);
    v.lon += wrapDeg(a.lon - b.lon) * k;
    v.lat += (a.lat - b.lat) * k;
    v.r *= Math.pow(a.r / b.r, k);
    v.cx = (v.cx ?? 960) + ((a.cx ?? 960) - (b.cx ?? 960)) * k;
    v.cy = (v.cy ?? 540) + ((a.cy ?? 540) - (b.cy ?? 540)) * k;
  }
  v.lon += spin(X, t, I);
  return v;
}
/** chorus3's slow push: 0 → 1 across the chorus, pulled back after the last word lands. */
function pushK(t: number, I: CT) {
  const last = I.lines[I.lines.length - 1]!.words, lw = last[last.length - 1]!;
  const up = ease.inOutQuad(clamp((t - I.w0) / (lw.start - I.w0)));
  const down = ease.inOutCubic(clamp((t - lw.start) / Math.max(0.35, I.ch.t1 - 0.62 - lw.start)));
  return up * (1 - down);
}
/** 0..1: the strain builds under the call (from its last word to the answer's "Still"), released by the answer. */
function build(t: number, I: CT) {
  let b = 0;
  for (const l of I.lines) {
    const ci = l.words.findIndex((w) => w.w.includes(')')), st = l.words.find((w) => /^still/i.test(w.w));
    if (ci < 0 || !st) continue;
    const ts = l.words[ci]!.start, te = st.start;
    if (t >= ts && t < te + 0.05) b = Math.max(b, ease.inCubic(clamp((t - ts) / Math.max(0.2, te - ts))));
  }
  return b;
}
/** The answer's punch: "Still" hits hardest, "turning!" follows; plus the chorus's first word (the drop). */
function punch(t: number, I: CT, hl = 0.11) {
  let p = 0.55 * decay(t, I.w0, hl);
  for (const w of I.ans) p += (/^still/i.test(w.w) ? 1 : 0.6) * decay(t, w.start, hl);
  return p;
}

function drawGlobe(c: Ctx, X: X, t: number, I: CT, cfg: Cfg | null) {
  const v = camera(X, t, I), kick = X.hit('kick');
  if (cfg) {
    v.r *= 1 + cfg.push * pushK(t, I);
    const hk = smooth(I.w0 - 0.2, I.w0 + 0.6, t);
    v.highlights = cfg.hl.map((name) => ({ name, col: C.deep, alpha: hk * (0.42 + 0.3 * kick), outline: false }));
  }
  v.r *= 1 + 0.01 * kick * (cfg?.amp ?? 0.6);
  const cx = v.cx ?? 960, cy = v.cy ?? 540, r = v.r;
  // chorus3: a teal outer glow under the globe's own atmosphere
  if (cfg?.teal) {
    const a = cfg.teal * smooth(I.ch.t0 - 0.6, I.w0 + 0.5, t) * (0.2 + 0.12 * kick);
    const g = c.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.42);
    g.addColorStop(0, TEAL(a)); g.addColorStop(0.35, TEAL(a * 0.4)); g.addColorStop(1, TEAL(0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.42, 0, Math.PI * 2); c.fill();
  }
  X.globe(c, v);
  return v;
}

/** Faint paper rings on each downbeat; the vermilion (and, in chorus3, teal) rings and halo on the answer. */
function drawRings(c: Ctx, X: X, t: number, I: CT, v: GlobeView, cfg: Cfg) {
  const cx = v.cx ?? 960, cy = v.cy ?? 540, r = v.r;
  c.save();
  for (let b = Math.ceil(X.bar(I.w0 - 0.1)); X.tBar(b) < I.wEnd; b++) {
    const td = X.tBar(b), k = clamp((t - td) / 0.9);
    if (t < td || k >= 1) continue;
    c.strokeStyle = PAPER(0.2 * (1 - k)); c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, r * (1.005 + 0.2 * ease.outCubic(k)), 0, Math.PI * 2); c.stroke();
  }
  // halo: builds under the call, flares on the answer
  const P = Math.max(0.6 * build(t, I), Math.min(1.4, punch(t, I, 0.32) - 0.55 * decay(t, I.w0, 0.32)) * cfg.amp);
  if (P > 0.01) {
    const R1 = r * 1.5;
    const g = c.createRadialGradient(cx, cy, r * 0.985, cx, cy, R1);
    g.addColorStop(0, RED(0.62 * Math.min(1, P))); g.addColorStop(0.22, RED(0.26 * Math.min(1, P)));
    g.addColorStop(0.55, cfg.teal ? TEAL(0.1 * Math.min(1, P)) : RED(0.06 * Math.min(1, P))); g.addColorStop(1, RED(0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R1, 0, Math.PI * 2); c.arc(cx, cy, r * 0.985, 0, Math.PI * 2, true); c.fill('evenodd');
  }
  // while an answer holds, every strong kick or snare sends a thin ring off the globe
  I.lines.forEach((l, li) => {
    const st = l.words.find((w) => /^still/i.test(w.w));
    if (!st) return;
    const next = I.lines[li + 1], end = next ? next.words[0]!.start : I.wl + 0.6;
    const ev = [...X.au.events('kick', st.start + 0.12, end), ...X.au.events('snare', st.start + 0.12, end)].filter((e) => e[1] > 0.45);
    ev.forEach(([te, str], j) => {
      const k = clamp((t - te) / 0.75);
      if (t < te || k >= 1) return;
      const a = str * Math.pow(1 - k, 1.4) * 0.7;
      c.strokeStyle = cfg.teal && j % 2 ? TEAL(a) : RED(a); c.lineWidth = lerp(4, 1, k);
      c.beginPath(); c.arc(cx, cy, r * (1.01 + 0.3 * ease.outCubic(k)), 0, Math.PI * 2); c.stroke();
    });
  });
  // answer rings
  I.ans.forEach((w, i) => {
    const k = clamp((t - w.start) / 1.15);
    if (t < w.start || k >= 1) return;
    const still = /^still/i.test(w.w), teal = cfg.teal && !still;
    const e = ease.outExpo(k), a = Math.pow(1 - k, 1.6);
    c.strokeStyle = teal ? TEAL(0.95 * a) : RED(0.95 * a); c.lineWidth = lerp(still ? 12 : 7, 1, e) * cfg.amp;
    c.beginPath(); c.arc(cx, cy, r * (1.01 + (still ? 0.62 : 0.4) * cfg.amp * e), 0, Math.PI * 2); c.stroke();
    if (cfg.teal && still && i === I.ans.length - 2) { // the last answer of the film: a second, wider teal ring
      c.strokeStyle = TEAL(0.7 * a); c.lineWidth = 2;
      c.beginPath(); c.arc(cx, cy, r * (1.01 + 0.95 * e), 0, Math.PI * 2); c.stroke();
    }
  });
  c.restore();
}

/** The bezel: one tick per beat of the chorus around the globe, lit as the globe turns (a full turn = a full dial). */
function drawBezel(c: Ctx, X: X, t: number, I: CT, v: GlobeView, cfg: Cfg) {
  const k0 = Math.round(X.beat(I.w0)), k1 = Math.round(X.beat(I.wEnd)), n = Math.max(1, k1 - k0) * 4;
  const show = smooth(I.w0 - 0.5, I.w0 + 0.2, t);
  if (show <= 0) return;
  const cx = v.cx ?? 960, cy = v.cy ?? 540, R0 = v.r * 1.045 + 6;
  const P = Math.min(1, punch(t, I, 0.25) - 0.55 * decay(t, I.w0, 0.25));
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const tb = X.tBeat(k0 + i / 4), ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const bar = X.bar(tb), down = i % 4 === 0 && Math.abs(bar - Math.round(bar)) < 0.08, beat = i % 4 === 0;
    const lit = t >= tb, hot = beat ? decay(t, tb, 0.18) : 0;
    const len = (down ? 22 : beat ? 11 : 5) * (1 + 0.7 * hot);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const x0 = cx + ca * R0, y0 = cy + sa * R0, x1 = cx + ca * (R0 + len), y1 = cy + sa * (R0 + len);
    const ya = smooth(116, 168, Math.min(y0, y1)) * (1 - smooth(990, 1030, Math.max(y0, y1)));
    if (ya <= 0) continue;
    let col: string;
    if (!lit) col = PAPER((beat ? 0.14 : 0.08) * show * ya);
    else if (P > 0.05) col = RED((0.45 + 0.55 * P) * show * ya);
    else col = (cfg.teal ? TEAL : PAPER)(((beat ? 0.5 : 0.3) + 0.5 * hot) * show * ya);
    c.strokeStyle = col; c.lineWidth = down ? 2.6 : beat ? 2 : 1.4;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  c.restore();
}

/** Tension: the frame closes in during the pre-chorus and opens on the chorus's first word. */
function drawTension(c: Ctx, k: number) {
  if (k <= 0.001) return;
  const g = c.createRadialGradient(960, 540, 260, 960, 540, 1150);
  g.addColorStop(0, 'rgba(4,7,15,0)'); g.addColorStop(1, `rgba(4,7,15,${0.62 * k})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------------------------------------ type
interface Tok { w: Word; s: string; row: number; echo?: boolean }
interface Phrase { line: Line; ans: boolean; toks: Tok[]; call: Tok[]; t0: number; t1: number }

function phrases(I: CT): Phrase[] {
  return I.lines.map((l, i) => {
    const next = I.lines[i + 1];
    const t0 = l.words[0]!.start - 0.04, t1 = next ? next.words[0]!.start - 0.05 : I.ch.t1 + 0.8;
    if (/still/i.test(l.text)) {
      const ci = l.words.findIndex((w) => w.w.includes(')'));
      return {
        line: l, ans: true, t0, t1,
        call: l.words.slice(0, ci + 1).map((w) => ({ w, s: w.w.toUpperCase(), row: 0 })),
        toks: l.words.slice(ci + 1).map((w) => ({ w, s: w.w, row: 0 })),
      };
    }
    const n = l.words.length, n0 = n <= 3 ? n : Math.ceil(n / 2);
    // the first line repeats itself ("Under strain, under strain,"): the repeat is set as a hollow echo
    return { line: l, ans: false, t0, t1, call: [], toks: l.words.map((w, j) => ({ w, s: w.w, row: j < n0 ? 0 : 1, echo: i === 0 && j >= n0 })) };
  });
}

/** Extra tracking while a word is held (a sung note stretches the word); it springs back when the note ends. */
function heldTrack(w: Word, t: number, size: number, maxEm = 0.11, rate = 0.075) {
  const d = w.end - w.start;
  if (d < 0.7) return 0;
  const grow = ease.outCubic(clamp((t - w.start) / d)), relax = ease.inOutCubic(clamp((t - w.end) / 0.28));
  return size * Math.min(maxEm, (d - 0.5) * rate) * grow * (1 - relax);
}

interface RowOpts { stretch?: [number, number]; fam: string; size: number; cy: number; lh?: number; col: (a: number) => string; vis: number; lift: number; pop?: number; glow?: string; glowBlur?: number; space?: number; rise?: number }
/** Rows of words, centred on CX; each word lands on its sung start (rise + settle). Rows re-centre as held words stretch. */
function drawRows(c: Ctx, X: X, t: number, toks: Tok[], o: RowOpts) {
  const out: { x0: number; x1: number; base: number; words: [number, number][] }[] = [];
  const nRows = Math.max(...toks.map((k) => k.row)) + 1, lh = o.size * (o.lh ?? 1.0), sp = o.size * (o.space ?? 0.27);
  for (let r = 0; r < nRows; r++) {
    const rt = toks.filter((k) => k.row === r);
    const tr = rt.map((k) => heldTrack(k.w, t, o.size, ...(o.stretch ?? [0.11, 0.075])));
    // only the letters stretch: leading/trailing punctuation keeps its natural spacing
    const parts = rt.map((k) => { const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(k.s)!; return [m[1]!, m[2]!, m[3]!] as const; });
    // (no tracking after the last letter: trailing punctuation sits tight, and a stretched word stays centred)
    const pw = parts.map(([a, b, z], i) => [measure(a, o.fam, o.size), measure(b, o.fam, o.size, tr[i]!), measure(z, o.fam, o.size)] as const);
    const ws = pw.map((q) => q[0] + q[1] + q[2]);
    const gap = sp + Math.max(0, ...tr) * 1.6; // the word gap opens with the stretch so words stay words
    const rowW = ws.reduce((a, b) => a + b, 0) + gap * (rt.length - 1);
    let x = CX - rowW / 2;
    const base = o.cy + (r - (nRows - 1) / 2) * lh + o.size * 0.34 - o.lift;
    const words: [number, number][] = [];
    out.push({ x0: x, x1: x + rowW, base, words });
    rt.forEach((k, i) => {
      const t0 = k.w.start - 0.04, ww = ws[i]!;
      words.push([x, x + ww]);
      if (t >= t0) {
        X.mark(k.w);
        const u = clamp((t - t0) / 0.34), e = ease.outExpo(u);
        const sc = 1 + (1 - e) * (o.pop ?? 0.08);
        c.save();
        c.globalAlpha *= o.vis * clamp(u * 2.6);
        c.translate(x + ww / 2, base + (1 - e) * o.size * (o.rise ?? 0.16));
        c.scale(sc, sc);
        c.font = font(o.fam, o.size);
        c.textBaseline = 'alphabetic'; c.textAlign = 'left';
        if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.glowBlur ?? 30; }
        c.strokeStyle = o.col(0.95); c.lineWidth = Math.max(1.5, o.size * 0.016); c.fillStyle = o.col(1);
        let px = -ww / 2;
        parts[i]!.forEach((str, j) => {
          (c as any).letterSpacing = `${j === 1 ? tr[i] : 0}px`;
          if (str) { if (k.echo) c.strokeText(str, px, 0); else c.fillText(str, px, 0); }
          px += pw[i]![j]!;
        });
        c.restore();
      }
      x += ww + gap;
    });
  }
  return out;
}

/** A widest-row fit: the largest size <= max at which every row fits maxW. */
function fit(toks: Tok[], fam: string, max: number, maxW: number) {
  const nRows = Math.max(...toks.map((k) => k.row)) + 1;
  let wMax = 0;
  for (let r = 0; r < nRows; r++) wMax = Math.max(wMax, measure(toks.filter((k) => k.row === r).map((k) => k.s).join(' '), fam, 100) / 100);
  return Math.min(max, maxW / Math.max(1e-3, wMax));
}

function drawChorusType(c: Ctx, X: X, t: number, I: CT, cfg: Cfg) {
  const ps = phrases(I), serif = FONT.serif(800), mono = FONT.mono(600);
  const pk = cfg.push ? pushK(t, I) : 0;
  for (const p of ps) {
    if (t < p.t0 || t > p.t1) continue;
    const vis = 1 - ease.inCubic(clamp((t - (p.t1 - 0.2)) / 0.2)), lift = (1 - vis) * 36;
    c.save();
    // the slow push (chorus3) scales the type plane a little with the globe
    if (pk > 0) { const s = 1 + 0.05 * pk; c.translate(CX, 560); c.scale(s, s); c.translate(-CX, -560); }
    if (!p.ans) {
      const size = fit(p.toks, serif, 172, 1540), cy = 548;
      // a soft pool of night behind the words, so the land under them recedes
      pool(c, cy, 0.5 * vis * smooth(p.t0, p.t0 + 0.3, t));
      drawRows(c, X, t, p.toks, { fam: serif, size, cy, col: PAPER, vis, lift });
    } else {
      const size = fit(p.toks, serif, 236, 1580), cy = 640;
      const P = Math.min(1, punch(t, I, 0.2));
      pool(c, 580, 0.55 * vis * smooth(p.t0, p.t0 + 0.3, t));
      // the call: small mono, a question
      if (p.call.length) drawRows(c, X, t, p.call, { fam: mono, size: 38 * (1 + 0.6 * build(t, I)), cy: 416, col: (a) => PAPER(0.85 * a), vis, lift, space: 0.45, pop: 0.02, rise: 0.4, stretch: [0.6, 0.3] });
      // the answer: the brightest thing in the film's chorus — vermilion, glowing on the punch
      const rows = drawRows(c, X, t, p.toks, { fam: serif, size, cy, col: RED, vis, lift, pop: 0.16, glow: RED(0.38 + 0.5 * P), glowBlur: 16 + 54 * P, rise: 0.08 });
      // the film's last answer (chorus3): a teal rule draws across the held "Still" and completes on "turning!"
      const w0 = p.toks[0]!.w, w1 = p.toks[p.toks.length - 1]!.w;
      const R = rows[0];
      if (cfg.teal && p === ps[ps.length - 1] && R && t >= w0.start) {
        // under "Still" while it is held, then out under "turning!" as it lands
        const a = R.words[0]![1], u0 = ease.outCubic(clamp((t - w0.start) / Math.max(0.3, w0.end - w0.start)));
        const u1 = ease.outExpo(clamp((t - w1.start) / 0.45));
        const xe = lerp(R.x0, a, u0) + (R.x1 - a) * u1, y = R.base + size * 0.17;
        c.save(); c.globalAlpha *= vis; c.fillStyle = TEAL(0.95); c.shadowColor = TEAL(0.6); c.shadowBlur = 14;
        c.fillRect(R.x0, y, xe - R.x0, 5);
        c.restore();
      }
    }
    c.restore();
  }
}

function pool(c: Ctx, cy: number, a: number) {
  if (a <= 0.001) return;
  c.save(); c.translate(CX, cy); c.scale(2.1, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 380);
  g.addColorStop(0, `rgba(5,9,20,${a})`); g.addColorStop(0.6, `rgba(5,9,20,${a * 0.55})`); g.addColorStop(1, 'rgba(5,9,20,0)');
  c.fillStyle = g; c.fillRect(-380, -380, 760, 760);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ pre-chorus type
const QUOTE = ['‘RESILIENCE', ' UNDER', ' STRAIN’'];
// the report's title; date and label as FACTSHEET S84 gives them ("IMF WEO, 13 Oct 2026")
const ATTR = '— IMF WORLD ECONOMIC OUTLOOK · 13 OCT 2026';

interface PT { pre: SegInfo; q: Word[]; says: Word[]; urg: Word[]; out: number; a0: number; a1: number }
function preInfo(X: X, preId: string, chId: string): PT {
  const pre = segOf(X, preId), L = linesOf(X, preId);
  const q = L[0]!.words.slice(0, 3), says = L[0]!.words.slice(3), urg = L[1]!.words;
  const out = linesOf(X, chId)[0]!.words[0]!.start - 0.06;
  // the attribution types on "the IMF says" (pre1), or straight after "strain." where the line has no attribution (pre2)
  const a0 = says.length ? says[0]!.start : q[2]!.end - 0.05;
  // pre2: finish typing before "Urgent" slams, so the two never move at once
  const a1 = says.length ? says[says.length - 1]!.end - 0.08 : Math.max(a0 + 0.22, Math.min(a0 + 0.5, urg[0]!.start - 0.06));
  return { pre, q, says, urg, out, a0, a1 };
}

function drawPreType(c: Ctx, X: X, t: number, P: PT) {
  const vis = 1 - ease.inCubic(clamp((t - (P.out - 0.22)) / 0.22));
  if (vis <= 0 || t < P.q[0]!.start - 0.35) return;
  // --- the quote card
  const x0 = 150, y0 = 236, pad = 32, qs = 46, as = 19;
  const qf = FONT.mono(600), af = FONT.mono(500), qtr = qs * 0.03, atr = as * 0.14;
  const qW = measure(QUOTE.join(''), qf, qs, qtr), aW = measure(ATTR, af, as, atr);
  const cw = Math.max(qW, aW) + pad * 2 + 12, chh = 148;
  const ka = ease.outExpo(clamp((t - (P.q[0]!.start - 0.32)) / 0.45));
  c.save();
  c.globalAlpha *= vis * ka;
  c.translate(-(1 - ka) * 46 - (1 - vis) * 40, 0);
  c.fillStyle = rgbaHex(C.panel, 0.9); c.beginPath(); c.roundRect(x0, y0, Math.max(8, cw * ka), chh, 3); c.fill();
  c.strokeStyle = PAPER(0.14); c.lineWidth = 1; c.stroke();
  c.fillStyle = RED(); c.fillRect(x0, y0, 5, chh * ka);
  // typed quote, word by word on the voice
  let s = '', typing = false;
  QUOTE.forEach((part, i) => {
    const w = P.q[i]!;
    if (t < w.start - 0.02) return;
    X.mark(w);
    const dur = clamp(w.end - w.start, 0.14, 0.42), u = clamp((t - (w.start - 0.02)) / dur);
    if (u < 1) typing = true;
    s += part.slice(0, Math.max(1, Math.ceil(part.length * u)));
  });
  const tx = x0 + pad + 12, qy = y0 + pad + qs * 0.78, ay = qy + 52;
  c.font = font(qf, qs); (c as any).letterSpacing = `${qtr}px`; c.fillStyle = PAPER(0.97); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(s, tx, qy);
  const sw = measure(s, qf, qs, qtr) + qtr;
  // attribution
  const an = t < P.a0 ? 0 : Math.max(1, Math.ceil(ATTR.length * clamp((t - P.a0) / Math.max(0.2, P.a1 - P.a0))));
  for (const w of P.says) if (t >= w.start - 0.02) X.mark(w);
  if (an > 0) {
    c.font = font(af, as); (c as any).letterSpacing = `${atr}px`; c.fillStyle = PAPER(0.62);
    c.fillText(ATTR.slice(0, an), tx, ay);
  }
  // caret: solid while typing, blinking on the beat while it waits
  const onAttr = an > 0, aTyping = onAttr && an < ATTR.length;
  const blink = X.beat() % 1 < 0.5;
  if (typing || aTyping || blink) {
    c.fillStyle = onAttr ? PAPER(0.62) : RED();
    if (onAttr) c.fillRect(tx + measure(ATTR.slice(0, an), af, as, atr) + atr + 4, ay - as * 0.8, as * 0.55, as * 0.95);
    else c.fillRect(tx + sw + 4, qy - qs * 0.78, qs * 0.5, qs * 0.92);
  }
  c.restore();
  // --- "Urgent choices." slams in
  const ss = 176, sf = FONT.serif(800);
  P.urg.forEach((w, i) => {
    const t0 = w.start - 0.02;
    if (t < t0) return;
    X.mark(w);
    const u = clamp((t - t0) / 0.17), e = ease.outQuart(u), sc = lerp(1.6, 1, e);
    const ww = measure(w.w, sf, ss, -ss * 0.012);
    const x = 144 - (1 - vis) * 40, y = 618 + i * ss * 0.97;
    c.save();
    c.globalAlpha *= vis * clamp(u * 3.5);
    c.translate(x + ww / 2, y - ss * 0.33); c.scale(sc, sc); c.translate(-(x + ww / 2), -(y - ss * 0.33));
    c.font = font(sf, ss); (c as any).letterSpacing = `${-ss * 0.012}px`; c.fillStyle = PAPER(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText(w.w, x, y);
    c.restore();
  });
}

/** Slam punches of "Urgent" / "choices." (shared by the pre-chorus and the chorus that inherits its tail). */
function slam(t: number, P: PT) {
  return P.urg.reduce((a, w, i) => a + (i ? 1 : 0.7) * decay(t, w.start - 0.02, 0.09), 0);
}
function slamPost(X: X, P: PT, o: PostOverrides): PostOverrides {
  const s = slam(X.t, P), f = fi(X.t);
  return {
    ...o,
    zoom: (o.zoom ?? 1) * (1 + 0.03 * s),
    shake: [((o.shake?.[0] ?? 0) + (hash(f * 3 + 1) - 0.5) * 14 * s), ((o.shake?.[1] ?? 0) + (hash(f * 5 + 2) - 0.5) * 10 * s)],
  };
}

// ------------------------------------------------------------------------------------------------ carried caption
/** Chorus segments switch the scene's captions off. A story line still being sung when one of them begins would lose
 *  its caption mid-line (watch's "The trade truce, January 10th." runs 0.5 s into chorus3), so it is carried here to its
 *  end, drawn exactly as scenes/brief.ts draws captions. Lines of chorus-kind segments are excluded (pre-chorus tails
 *  are set as big type instead). */
function carryCaption(c: Ctx, X: X, t: number) {
  const s0 = X.seg.t0;
  if (t < s0) return;
  const l = X.ly.lines.find((x) => x.section !== X.seg.id && x.start < s0 && t >= x.start - 0.15 && t <= x.end + 0.35);
  if (!l || X.segs.find((s) => s.id === l.section)?.kind === 'chorus') return;
  const fam = FONT.sans(500), size = 30, rows = wrap(l.text, fam, size, 1240);
  const k = Math.min(clamp((t - (l.start - 0.15)) / 0.15), 1 - clamp((t - (l.end + 0.2)) / 0.15));
  if (k <= 0) return;
  c.save(); c.globalAlpha *= k;
  const y0 = H - 72 - (rows.length - 1) * 40, bandW = Math.max(...rows.map((r) => measure(r, fam, size))) + 56;
  c.fillStyle = 'rgba(6,10,20,0.62)'; c.fillRect((W - bandW) / 2, y0 - 36, bandW, rows.length * 40 + 18);
  let wi = 0;
  rows.forEach((r, ri) => {
    let x = (W - measure(r, fam, size)) / 2;
    for (const tok of r.split(' ')) {
      const w: Word | undefined = l.words[wi++], sung = w ? t >= w.start - 0.02 : true;
      text(c, tok, x, y0 + ri * 40, fam, size, sung ? PAPER(0.98) : PAPER(0.42));
      if (w && sung) X.mark(w);
      x += measure(tok + ' ', fam, size);
    }
  });
  c.restore();
}

// ------------------------------------------------------------------------------------------------ segments
function preSegment(preId: string, chId: string): Segment {
  return {
    draw(c, X) {
      const t = X.t, I = info(X, chId), P = preInfo(X, preId, chId);
      c.fillStyle = NIGHT(); c.fillRect(0, 0, W, H);
      drawGlobe(c, X, t, I, null);
      drawTension(c, windup(t, I));
      drawPreType(c, X, t, P);
      carryCaption(c, X, t);
    },
    post(X, o) { return slamPost(X, preInfo(X, preId, chId), o); },
  };
}

function chorusSegment(chId: string): Segment {
  return {
    draw(c, X) {
      const t = X.t, I = info(X, chId), cfg = CFG[chId]!;
      c.fillStyle = NIGHT(); c.fillRect(0, 0, W, H);
      const v = drawGlobe(c, X, t, I, cfg);
      drawRings(c, X, t, I, v, cfg);
      drawBezel(c, X, t, I, v, cfg);
      drawTension(c, Math.max(windup(t, I), 0.7 * build(t, I)));
      // the pre-chorus's last words run into this segment's cross-fade: draw its tail here too (same place, same look)
      if (I.pre && t < I.w0 + 0.1) drawPreType(c, X, t, preInfo(X, I.pre.id, chId));
      drawChorusType(c, X, t, I, cfg);
      carryCaption(c, X, t);
    },
    post(X, o) {
      const I = info(X, chId), cfg = CFG[chId]!, t = X.t;
      if (I.pre && t < I.w0) o = slamPost(X, preInfo(X, I.pre.id, chId), o);
      const p = punch(t, I);
      return { ...o, zoom: (o.zoom ?? 1) * (1 + 0.048 * cfg.amp * Math.min(1.3, p) + 0.004 * X.hit('kick')), flash: (o.flash ?? 0) + 0.004 * cfg.amp * Math.min(1, p - 0.55 * decay(t, I.w0)) };
    },
  };
}

export const segments: Record<string, Segment> = {
  pre1: preSegment('pre1', 'chorus1'),
  chorus1: chorusSegment('chorus1'),
  pre2: preSegment('pre2', 'chorus2'),
  chorus2: chorusSegment('chorus2'),
  chorus3: chorusSegment('chorus3'),
};
