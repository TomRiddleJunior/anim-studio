// THE STATE OF AI · OCT 2026 — the explaining layer's HOUSE STYLE: one panel, one caveat tag, one source line and one
// number entrance, shared by every chapter group so the film's graphics read as one desk's work.
//
// The style (taken from the ESCAPE VELOCITY panels in ref/ev_63, ev_118, ev_255, ev_298):
//   PANEL      the palette's dark rgb(12,13,16), OPAQUE. The 2D layer composites in LINEAR light, so translucency
//              costs far more than it looks: measured over the bright s14 crowd plate (sRGB ~209) a panel reads 71 at
//              alpha 0.9, 47 at 0.96 and 31 at 0.985 — and at 0.985 the walkers under the panel are still plainly
//              visible behind the type. Only alpha 1 gives the clean EV panel (ev_118). Edge: a 1 px hairline border
//              at 22 % and EV's corner brackets (14 px, 1.5 px, 85 %) drawn INSIDE the edge — the bottom pair rides
//              the unrolling edge. Optional header strip (mono 13 px caps title, dim right note, hairline under it)
//              and an optional footer strip that carries the source line. Unrolls from its top edge (outExpo).
//              `paper`: the same panel in cream with ink type and ink edges (flat, no tilt; a soft drop shadow over
//              footage). On a white chapter (`ink`) the dark panel is solid ink and the paper panel gets a firmer edge.
//              No spine, no title-bar colours, no coral on the frame: coral stays on the hot value.
//   CAVEAT     a cream label-printer tag: ink mono 13 px caps after a hatched ink "caution" block, wiped on from the
//              left. Its own opaque backing, so it reads over any footage or panel; never coral (coral = the value).
//              `ink`: the same tag in solid ink with paper type, for white chapters and for cream cards.
//   SOURCE     mono 12 px, exactly the fact sheet's string (case kept: xAI, n=1,202), "SOURCE ·" in a dimmer tone
//              than the publisher/date, optional typed reveal (block caret while typing). It belongs ON a panel or
//              card (the footer strip does that for you); off a panel pass `back: true` — bare 12 px mono over a
//              bright plate is unreadable.
//   LAND       a number never counts: the exact final string is the only one ever drawn. It slams in (scale from
//              1+amp with an outBack settle) timed so the CONTACT frame — the moment it reaches full size and full
//              opacity — is the lyric word's start. Optional rise, exit and an impact pulse for post().
//
// Everything here is a pure function of its arguments (no state, no caches, no Math.random/Date); positions are
// logical 1920×1080 px. Progress arguments (`k`, `u`) are LINEAR 0..1 — the primitives apply the house easing, so
// every chapter moves the same way. Get them with `enter(t, t0, DUR.x)`, or `typedBy(t, tDone)` for a source line
// that must be complete by a given moment (the word its number lands on).
//
// Example (a headline panel landing ~700 on "seven", source in the footer complete by then, caveat above it):
//
//   import { panel, caveatTag, landText, enter, typedBy, leave, DUR } from '../brief';
//   const t = X.t, tNum = X.W('seven hundred', 0).start, tIn = tNum - 0.45, a = leave(t, X.ch.t1);
//   caveatTag(c, 'IN TESTING · SAFEGUARDS OFF OR MISCONFIGURED', 1110, 300, { k: enter(t, tIn, DUR.tag), alpha: a });
//   panel(c, 1110, 340, 720, 260, {
//     k: enter(t, tIn, DUR.panel), alpha: a, ink: X.ink, title: 'FIG. 08 · THE BREAK-IN',
//     source: 'SOURCE · METR / REDWOOD · AUG 2026', sourceU: typedBy(t, tNum),
//     draw: (p) => {
//       landText(c, '~700', p.inner.x, p.inner.y + 120, FONT.grot(900), 140, CORAL(), t, tNum);
//       text(c, 'AGENTS JOINED THE ATTACK', p.inner.x, p.inner.y + 170, FONT.grot(800), 30, p.fg(0.95));
//     },
//   });
import { measure } from '../engine/type';
import { clamp, ease, hash } from '../engine/util';
import { FONT, C, WHITE, INK, rgbaHex, text } from './kit';
import type { Box } from './cards';

// ============================================================================================ tokens
/** The house dark panel fill: opaque (any translucency re-exposes the plate in linear-light compositing; see top). */
export const PANEL_BG = 'rgb(12,13,16)';
/** Paper (cream) and its ink, as css strings, for chapter shapes that must match the panels. */
export const PAPER = (a = 1) => rgbaHex(C.paper, a);
/** Inner padding of a panel's content (`PanelBox.inner` is the body inset by this). */
export const PAD = 24;
/** Header / footer strip heights. */
export const HEAD_H = 40, FOOT_H = 32;
/** Corner-bracket length and weight. */
export const BRACKET = 14, BRACKET_W = 1.5;
/** House durations (s) for the linear progress you pass in as `k` / `u` (see `enter`). */
export const DUR = { panel: 0.32, tag: 0.24, source: 0.3, land: 0.2, out: 0.2 } as const;
/** Source-line type: mono 12 px, regular, 1.5 px tracking (the floor is 11 px when `maxW` forces it). */
export const SRC = { size: 12, min: 11, weight: 400, track: 1.5 } as const;
/** Caveat-tag type: mono 13 px semibold (ranked above the 12 px source), 1.6 px tracking. */
export const TAG = { size: 13, weight: 600, track: 1.6, hatch: 22, gap: 10, padR: 12, lineGap: 6 } as const;

/** Linear progress of t through [t0, t0 + d] (0 before, 1 after): the `k` / `u` every primitive here takes. */
export const enter = (t: number, t0: number, d: number) => clamp((t - t0) / Math.max(1e-3, d));
/** Linear progress that reaches 1 0.1 s before tDone: a typed source line already complete on the frame
 *  its number lands (pass the number's word start). */
export const typedBy = (t: number, tDone: number, d: number = DUR.source) => clamp((t - (tDone - 0.1 - d)) / Math.max(1e-3, d));
/** The house exit: 1 → 0 over the last `d` s before t1 (fast, inCubic; gone AT t1, e.g. the cut). Multiply into `alpha`. */
export const leave = (t: number, t1: number, d: number = DUR.out) => 1 - ease.inCubic(clamp((t - (t1 - d)) / d));

const isInk = (v: boolean | number | undefined) => (typeof v === 'number' ? v > 0.5 : !!v);
/** Advance of a string drawn by kit.text() with tracking (canvas letterSpacing adds after every glyph). */
const adv = (s: string, fam: string, size: number, tr: number) => (s ? measure(s, fam, size, tr) + tr : 0);

// ============================================================================================ panel
export interface PanelOpts {
  /** Linear reveal 0..1 (default 1 = open). The panel unrolls from its top edge with outExpo. */
  k?: number;
  /** Multiplies everything (exit fades: `leave`). */
  alpha?: number;
  /** Cream paper variant (ink type, ink edges) instead of the dark panel. */
  paper?: boolean;
  /** X.ink: on a white chapter the dark panel fills solid ink and the paper panel's edge prints firmer. */
  ink?: boolean | number;
  /** Header strip: mono 13 px caps title (e.g. 'FIG. 07 · CIRCULAR FLOW'), drawn as given. */
  title?: string;
  /** Dim right-aligned header note (e.g. 'FIG. 06', '2027'). */
  titleRight?: string;
  /** Footer strip with the source line in the house style (prefixed 'SOURCE · ' if missing). */
  source?: string;
  /** Typed reveal of the footer source, linear 0..1 (default 1). */
  sourceU?: number;
  /** Sample note appended to the footer source, case kept ("n=1,202, ±3.5"). */
  note?: string;
  /** Corner brackets (default true). */
  corners?: boolean;
  /** Paper only: soft drop shadow (default true over footage, false when `ink`). */
  shadow?: boolean;
  /** Contents, drawn clipped to the unrolled part of the panel, after the frame and strips. */
  draw?: (p: PanelBox) => void;
}
export interface PanelBox extends Box {
  /** Unrolled height this frame (0 while hidden). */
  hh: number;
  /** Eased reveal (outExpo of opts.k). */
  e: number;
  /** Area between the header and footer strips (full width). */
  body: Box;
  /** `body` inset by PAD on every side: where content starts. */
  inner: Box;
  /** The panel's foreground colour at alpha a (WHITE on dark, INK on paper): use it for content type and hairlines. */
  fg: (a?: number) => string;
}

/** EV corner brackets drawn inside a rect's edge (the panel frame; usable on their own for a registration frame). */
export function brackets(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string,
  o: { len?: number; lw?: number; top?: boolean; bottom?: boolean } = {}) {
  const lw = o.lw ?? BRACKET_W, l = Math.min(o.len ?? BRACKET, w / 2, h / 2), i = lw / 2;
  const x0 = x + i, x1 = x + w - i, y0 = y + i, y1 = y + h - i;
  c.save();
  c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'butt';
  c.beginPath();
  if (o.top !== false) { c.moveTo(x0, y0 + l); c.lineTo(x0, y0); c.lineTo(x0 + l, y0); c.moveTo(x1 - l, y0); c.lineTo(x1, y0); c.lineTo(x1, y0 + l); }
  if (o.bottom !== false) { c.moveTo(x0, y1 - l); c.lineTo(x0, y1); c.lineTo(x0 + l, y1); c.moveTo(x1 - l, y1); c.lineTo(x1, y1); c.lineTo(x1, y1 - l); }
  c.stroke();
  c.restore();
}

/**
 * The house panel. Opaque dark (PANEL_BG) with a 1 px hairline border and EV corner brackets; optional header
 * (title / titleRight) and footer (source) strips; `paper` for the cream variant. Unrolls from its top edge by `k`.
 * Returns the geometry (also while hidden, so callers can lay out against it); `draw` gets it clipped to the reveal.
 *
 *   const p = panel(c, 1110, 290, 720, 318, { k: enter(t, tIn, DUR.panel), title: 'FIG. 16', source: SRC16,
 *     draw: (p) => text(c, '80.5%', p.inner.x + p.inner.w, p.inner.y + 60, FONT.grot(900), 74, p.fg(), { align: 'right' }) });
 */
export function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: PanelOpts = {}): PanelBox {
  const ink = isInk(o.ink), paper = !!o.paper;
  const fg = paper ? INK : WHITE;
  const headH = o.title || o.titleRight ? HEAD_H : 0, footH = o.source ? FOOT_H : 0;
  const body: Box = { x, y: y + headH, w, h: Math.max(0, h - headH - footH) };
  const inner: Box = { x: body.x + PAD, y: body.y + PAD, w: Math.max(0, body.w - 2 * PAD), h: Math.max(0, body.h - 2 * PAD) };
  const k = clamp(o.k ?? 1), e = k >= 1 ? 1 : ease.outExpo(k), hh = h * e;
  const box: PanelBox = { x, y, w, h, hh: 0, e, body, inner, fg };
  const alpha = o.alpha ?? 1;
  if (hh < 0.5 || alpha <= 0) return box;
  box.hh = hh;
  c.save();
  c.globalAlpha *= alpha;
  // fill (+ paper fibre and shadow)
  if (paper) {
    if (o.shadow ?? !ink) { c.shadowColor = 'rgba(0,0,0,0.42)'; c.shadowBlur = 22; c.shadowOffsetY = 10; }
    c.fillStyle = C.paper; c.fillRect(x, y, w, hh);
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    const seed = Math.round(x * 3 + y * 7);
    for (let i = 0; i < 64; i++) {
      const fy = y + hash(seed, i, 2) * h;
      if (fy > y + hh) continue;
      c.fillStyle = `rgba(0,0,0,${0.02 + hash(seed, i, 3) * 0.03})`;
      c.fillRect(x + hash(seed, i, 1) * (w - 18), fy, 1 + hash(seed, i, 4) * 18, 1);
    }
  } else {
    c.fillStyle = ink ? INK(1) : PANEL_BG; c.fillRect(x, y, w, hh);
  }
  // edge: hairline border + corner brackets (the bottom pair rides the unrolling edge)
  const edge = paper ? (ink ? 0.6 : 0.3) : 0.22;
  c.strokeStyle = fg(edge); c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, Math.max(1, hh - 1));
  if (o.corners !== false) brackets(c, x, y, w, hh, fg(0.85));
  // strips + contents, clipped to the reveal
  c.beginPath(); c.rect(x, y, w, hh); c.clip();
  if (headH) {
    if (o.title) text(c, o.title, x + 16, y + 25, FONT.mono(600), 13, fg(0.92), { track: 2 });
    if (o.titleRight) text(c, o.titleRight, x + w - 16, y + 25, FONT.mono(400), 12, fg(0.58), { align: 'right', track: 1.8 });
    c.fillStyle = fg(paper ? 0.28 : 0.18); c.fillRect(x, y + headH - 1, w, 1);
  }
  if (footH && o.source) {
    const fy = y + h - footH;
    c.fillStyle = fg(paper ? 0.28 : 0.18); c.fillRect(x, fy, w, 1);
    sourceLine(c, o.source, x + 16, fy + 21, { u: o.sourceU, ink: paper, note: o.note, maxW: w - 32 });
  }
  o.draw?.(box);
  c.restore();
  return box;
}

// ============================================================================================ source line
export interface SourceOpts {
  /** Typed reveal, linear 0..1 (default 1 = fully shown). A block caret leads while typing. */
  u?: number;
  /** Ink type (for paper cards and white chapters). */
  ink?: boolean | number;
  /** 'right': x is the line's right edge (the line types into its final place). */
  align?: 'left' | 'right';
  /** Sample note appended after '  ·  ', case kept ("n=1,202, ±3.5"). */
  note?: string;
  /** Fit: above this width the line drops to 11 px, then tightens its tracking. */
  maxW?: number;
  /** A dark (ink: paper) backing strip, for a source line sitting straight on footage. */
  back?: boolean;
  alpha?: number;
}
/** The exact string sourceLine() draws for `s` (+ note): 'SOURCE · ' is prefixed when missing; case is kept. */
export const sourceText = (s: string, note?: string) => {
  const full = /^SOURCE\b/i.test(s) ? s : `SOURCE · ${s}`;
  return note ? `${full}  ·  ${note}` : full;
};
function sourceFit(full: string, maxW?: number) {
  const fam = FONT.mono(SRC.weight);
  let size: number = SRC.size, tr: number = SRC.track;
  if (maxW != null && adv(full, fam, size, tr) > maxW) {
    size = SRC.min;
    if (adv(full, fam, size, tr) > maxW) {
      const n = Math.max(1, Array.from(full).length);
      tr = Math.max(0.4, tr - (adv(full, fam, size, tr) - maxW) / n);
    }
  }
  return { fam, size, tr, w: adv(full, fam, size, tr) };
}
/** Width the source line will take (for layout before drawing). */
export const sourceWidth = (s: string, o: { note?: string; maxW?: number } = {}) => sourceFit(sourceText(s, o.note), o.maxW).w;

/**
 * The house source line at baseline y: "SOURCE · PUBLISHER · MON YYYY", mono 12 px, the SOURCE prefix dimmer than the
 * rest. Draws the fact-sheet string exactly as given (pass it verbatim). Returns its full width.
 *
 *   sourceLine(c, 'SOURCE · IEA · APR 2026', p.inner.x, p.inner.y + p.inner.h, { u: enter(t, tIn, DUR.source) });
 *   sourceLine(c, F14.src, 1830, 990, { align: 'right', back: true, note: 'n=1,202, ±3.5' });   // straight on footage
 */
export function sourceLine(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: SourceOpts = {}): number {
  const full = sourceText(s, o.note);
  const { fam, size, tr, w } = sourceFit(full, o.maxW);
  const u = clamp(o.u ?? 1), alpha = o.alpha ?? 1;
  if (u <= 0 || alpha <= 0) return w;
  const chars = Array.from(full);
  let n = u >= 1 ? chars.length : Math.floor(u * chars.length);
  // never show a cut-off number while typing ("29" of "29 SEP", "n=1,2" of "n=1,202", "MAY 20" of "MAY 2026"): if the
  // reveal stops inside a token that contains a digit, hold the whole token back until it can appear complete
  if (n > 0 && n < chars.length && /\S/.test(chars[n]!) && /\S/.test(chars[n - 1]!)) {
    let a = n; while (a > 0 && /\S/.test(chars[a - 1]!)) a--;
    let b = n; while (b < chars.length && /\S/.test(chars[b]!)) b++;
    if (/\d/.test(chars.slice(a, b).join(''))) n = a;
  }
  const ink = isInk(o.ink), fg = ink ? INK : WHITE;
  const x0 = o.align === 'right' ? x - w : x;
  c.save();
  c.globalAlpha *= alpha;
  if (o.back) { c.fillStyle = ink ? PAPER(1) : PANEL_BG; c.fillRect(x0 - 8, y - size - 3, w + 14, size + 10); }
  const m = /^SOURCE\s*·\s*/i.exec(full), pre = m ? Array.from(m[0]).length : 0;
  const shown = chars.slice(0, n);
  const a = shown.slice(0, pre).join(''), b = shown.slice(pre).join('');
  text(c, a, x0, y, fam, size, fg(ink ? 0.62 : 0.56), { track: tr });
  if (b) text(c, b, x0 + adv(a, fam, size, tr), y, fam, size, fg(ink ? 0.9 : 0.86), { track: tr });
  if (n < chars.length) {
    c.fillStyle = fg(0.9);
    c.fillRect(x0 + adv(shown.join(''), fam, size, tr) + 1, y - size * 0.82, size * 0.55, size * 0.98);
  }
  c.restore();
  return w;
}

// ============================================================================================ caveat tag
export interface TagOpts {
  /** Linear reveal 0..1 (default 1). The tag wipes on from the left, hatch block first. */
  k?: number;
  /** Solid-ink tag with paper type: for white chapters and for tags on cream cards. Default: cream tag, ink type. */
  ink?: boolean | number;
  /** 'right': x is the tag's right edge. */
  align?: 'left' | 'right';
  /** Wrap to two balanced lines above this width (a break never strands a leading '·'). */
  maxW?: number;
  alpha?: number;
}
function tagLines(s: string, maxW?: number): string[] {
  const fam = FONT.mono(TAG.weight);
  const chrome = TAG.hatch + TAG.gap + TAG.padR;
  if (maxW == null || adv(s, fam, TAG.size, TAG.track) + chrome <= maxW) return [s];
  const ws = s.split(' ');
  let best: string[] = [s], bw = Infinity;
  for (let i = 1; i < ws.length; i++) {
    if (ws[i] === '·') continue; // keep "·" at the end of line 1
    const l1 = ws.slice(0, i).join(' '), l2 = ws.slice(i).join(' ');
    const m = Math.max(adv(l1, fam, TAG.size, TAG.track), adv(l2, fam, TAG.size, TAG.track));
    if (m < bw) { bw = m; best = [l1, l2]; }
  }
  return best;
}
/** Size of the caveat tag for `s` (for layout before drawing). */
export function caveatTagSize(s: string, o: { maxW?: number } = {}) {
  const fam = FONT.mono(TAG.weight), lines = tagLines(s, o.maxW);
  const tw = Math.max(...lines.map((l) => adv(l, fam, TAG.size, TAG.track)));
  const lh = TAG.size + TAG.lineGap;
  return { w: Math.ceil(TAG.hatch + TAG.gap + tw + TAG.padR), h: TAG.size * 2 + (lines.length - 1) * lh, lines };
}

/**
 * The one caveat tag: a cream label-printer strip, ink mono 13 px caps after a hatched ink "caution" block, wiped on
 * from the left. Text is drawn exactly as given (pass the fact sheet's caveat verbatim). (x, y) is its top-left (or
 * top-right with align 'right'). Returns its rect.
 *
 *   caveatTag(c, 'PROJECTION', 1600, 420, { k: enter(t, tProj, DUR.tag) });
 *   caveatTag(c, 'AI DOES NOT REPLACE RADIOLOGISTS', 26, 184, { ink: true });          // on a cream card
 */
export function caveatTag(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: TagOpts = {}): Box {
  const { w, h, lines } = caveatTagSize(s, o);
  const x0 = o.align === 'right' ? x - w : x;
  const rect: Box = { x: x0, y, w, h };
  const k = clamp(o.k ?? 1), alpha = o.alpha ?? 1;
  if (k <= 0 || alpha <= 0) return rect;
  const ink = isInk(o.ink);
  const bg = ink ? INK(1) : C.paper, fgc = ink ? PAPER(1) : INK(1);
  const fam = FONT.mono(TAG.weight), lh = TAG.size + TAG.lineGap;
  c.save();
  c.globalAlpha *= alpha * clamp(k * 4);
  c.beginPath(); c.rect(x0 - 1, y - 1, (w + 2) * (k >= 1 ? 1 : ease.outExpo(k)), h + 2); c.clip();
  c.fillStyle = bg; c.fillRect(x0, y, w, h);
  // the hatched "caution" block
  c.save();
  c.beginPath(); c.rect(x0, y, TAG.hatch, h); c.clip();
  c.strokeStyle = fgc; c.lineWidth = 3;
  c.beginPath();
  for (let i = -h; i < TAG.hatch + 7; i += 7) { c.moveTo(x0 + i, y + h); c.lineTo(x0 + i + h, y); }
  c.stroke();
  c.restore();
  c.fillStyle = fgc; c.fillRect(x0 + TAG.hatch, y, 1.5, h);
  lines.forEach((l, i) => text(c, l, x0 + TAG.hatch + TAG.gap, y + TAG.size + TAG.size * 0.36 + i * lh, fam, TAG.size, fgc, { track: TAG.track }));
  c.restore();
  return rect;
}

// ============================================================================================ number entrance
export interface LandOpts {
  /** Entrance length (s), default 0.2. */
  dur?: number;
  /** Scale overshoot at the start (1 + amp), default 0.32. */
  amp?: number;
  /** outBack strength, default 2 (the contact frame falls at 1/(back+1) of `dur`). */
  back?: number;
  /** Rise (px) from below into place, on the same curve (0 = none). */
  rise?: number;
  /** Exit: the number is gone at tOut (fast inCubic fade over `outDur`, default 0.2 s). */
  tOut?: number;
  outDur?: number;
  /** Half-life (s) of the impact pulse `hit` after the word, default 0.08. */
  hl?: number;
}
export interface Land {
  /** Draw anything at all this frame. */
  on: boolean;
  /** Opacity (full from the contact frame). */
  a: number;
  /** Scale about the number's centre (1 + amp → overshoot → 1). */
  s: number;
  /** Vertical offset px (0 unless `rise`). */
  dy: number;
  /** Linear entrance progress 0..1. */
  k: number;
  /** Impact pulse: 1 at the word's start, decaying (drive post() flash/shake or a ring with it). */
  hit: number;
}

/**
 * Entrance envelope for a headline number landing on a lyric word. The number is drawn WHOLE (its exact fact-sheet
 * string) for every visible frame — never counted, never partially typed — and its CONTACT frame (full size, full
 * opacity) is exactly tWord: it starts dur/(back+1) s before the word. Pure function of t.
 *
 *   const L = land(t, X.W('Seventy-seven', 0).start, { tOut: X.ch.t1 });
 *   if (L.on) { c.save(); applyLand(c, L, cx, cy); text(c, '77%', x, y, FONT.grot(900), 160, CORAL()); c.restore(); }
 */
export function land(t: number, tWord: number, o: LandOpts = {}): Land {
  const dur = o.dur ?? DUR.land, back = o.back ?? 2, amp = o.amp ?? 0.32;
  const contact = 1 / (back + 1), t0 = tWord - dur * contact;
  const out = o.tOut == null ? 1 : 1 - ease.inCubic(clamp((t - (o.tOut - (o.outDur ?? DUR.out))) / (o.outDur ?? DUR.out)));
  const on = t >= t0 && (o.tOut == null || t < o.tOut) && out > 0;
  const k = clamp((t - t0) / dur), b = ease.outBack(k, back);
  return {
    on, k,
    a: on ? Math.min(clamp(k / contact), out) : 0,
    s: 1 + amp * (1 - b),
    dy: (o.rise ?? 0) * (1 - b),
    hit: t >= tWord ? Math.pow(0.5, (t - tWord) / (o.hl ?? 0.08)) : 0,
  };
}
/** Apply a Land to the context: alpha, then scale about (cx, cy) and the rise. Wrap in save()/restore(). */
export function applyLand(c: CanvasRenderingContext2D, L: Land, cx: number, cy: number) {
  c.globalAlpha *= L.a;
  c.translate(cx, cy + L.dy); c.scale(L.s, L.s); c.translate(-cx, -cy);
}
/**
 * Convenience: draw the exact string `s` (kit.text at x/baseline y) landing on tWord, scaled about its visual centre.
 * Returns its width (also before it lands, for layout). Tracking defaults to the house display tightening (-2 %).
 */
export function landText(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string,
  t: number, tWord: number, o: LandOpts & { align?: CanvasTextAlign; track?: number } = {}): number {
  const tr = o.track ?? -size * 0.02, w = measure(s, fam, size, tr);
  const L = land(t, tWord, o);
  if (!L.on) return w;
  const left = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  c.save();
  applyLand(c, L, left + w / 2, y - size * 0.36);
  text(c, s, x, y, fam, size, col, { align: o.align, track: tr });
  c.restore();
  return w;
}
