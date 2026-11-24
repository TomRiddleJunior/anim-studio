// Karaoke helpers shared by scenes: which line to feature, balanced line wrapping, kerned per-word
// wipes, visibility envelopes and word-onset pulses. Rules they implement (see references/treatment.md):
//  - a word highlights exactly from its start and completes by its end (never ahead of the voice);
//  - a line may appear (dim) up to ~0.4-0.6 s before its first word (anticipation), and holds briefly after;
//  - pieces of a word drawn separately keep the font's kerning (glyphX), never measure(text.slice()).
import { Lyrics, type Line, type Word } from './lyrics';
import { font, glyphX, layout, measure } from './type';
import { clamp, ease, smoothstep } from './util';
import { styleCase } from './palette';

/** Title-safe margin (logical px): keep lyric text at least this far from the frame edges. */
export const SAFE = 96;

/**
 * Lyric coverage: global indices of the words drawn in the last rendered frame. Scenes mark a word when
 * they put it on screen (drawWord does it when given the Word); `render.mjs lyrics` checks every sung
 * word is on screen while it is sung.
 */
export const DRAWN = new Set<number>();
export const markWord = (w: Word | null | undefined) => { if (w && w.gi >= 0) DRAWN.add(w.gi); };

export interface WordBox { word: Word; text: string; x: number; y: number; w: number; row: number }
export interface Flow { boxes: WordBox[]; rows: number; width: number; height: number; size: number; family: string; lineHeight: number; rowWidths: number[] }

type FlowOpts = { lineHeight?: number; tracking?: number; align?: 'left' | 'center' | 'right'; text?: (w: Word) => string; balance?: boolean; space?: number };

/**
 * Lay out words in rows no wider than maxWidth at `size` (origin: left end of the first row's baseline;
 * rows go down by lineHeight*size). With `balance` (default) a wrapped line gets rows of similar width
 * instead of a long row and an orphan. `text(w)` maps a word to its display string (default: style case).
 */
export function flowWords(words: Word[], family: string, size: number, maxWidth: number, o: FlowOpts = {}): Flow {
  const lh = o.lineHeight ?? 1.02, tr = o.tracking ?? 0, txt = o.text ?? ((w: Word) => styleCase(w.w));
  const texts = words.map(txt);
  const ws = texts.map((s) => measure(s, family, size, tr));
  const sp = (o.space ?? 0.26) * size;
  const wrap = (limit: number) => {
    const rows: number[][] = [];
    let cur: number[] = [], cw = 0;
    ws.forEach((w, i) => {
      const add = cur.length ? sp + w : w;
      if (cur.length && cw + add > limit) { rows.push(cur); cur = [i]; cw = w; } else { cur.push(i); cw += add; }
    });
    if (cur.length) rows.push(cur);
    return rows;
  };
  let rows = wrap(maxWidth);
  if ((o.balance ?? true) && rows.length > 1) {
    // smallest limit that keeps the same number of rows -> balanced rows
    let lo = Math.max(...ws), hi = maxWidth;
    for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (wrap(mid).length <= rows.length) hi = mid; else lo = mid; }
    rows = wrap(hi);
  }
  const rowW = rows.map((r) => r.reduce((a, i, k) => a + ws[i]! + (k ? sp : 0), 0));
  const width = Math.max(0, ...rowW);
  const boxes: WordBox[] = [];
  rows.forEach((r, ri) => {
    let x = o.align === 'center' ? (width - rowW[ri]!) / 2 : o.align === 'right' ? width - rowW[ri]! : 0;
    for (const i of r) {
      boxes.push({ word: words[i]!, text: texts[i]!, x, y: ri * lh * size, w: ws[i]!, row: ri });
      x += ws[i]! + sp;
    }
  });
  return { boxes, rows: rows.length, width, height: (rows.length - 1) * lh * size + size, size, family, lineHeight: lh, rowWidths: rowW };
}

/** Largest size in [min, max] at which the words fit in maxRows rows of maxWidth and maxHeight. */
export function fitWords(words: Word[], family: string, maxWidth: number, maxHeight: number, o: FlowOpts & { max?: number; min?: number; maxRows?: number } = {}): Flow {
  let lo = o.min ?? 24, hi = o.max ?? 320;
  const ok = (s: number) => { const f = flowWords(words, family, s, maxWidth, o); return f.rows <= (o.maxRows ?? 3) && f.height <= maxHeight && f.width <= maxWidth + 0.5 ? f : null; };
  if (ok(hi)) return flowWords(words, family, hi, maxWidth, o);
  for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
  return flowWords(words, family, lo, maxWidth, o);
}

/**
 * Draw one word with a karaoke wipe at (x, baselineY). `p` = sung progress 0..1 (Lyrics.wordProgress).
 * mode 'glyph' (default): glyphs switch colour one by one (the current glyph cross-fades) — kerning kept;
 * 'clip': a hard vertical wipe edge; 'word': the whole word switches at its start.
 */
export function drawWord(c: CanvasRenderingContext2D, text: string, family: string, size: number, x: number, y: number, p: number,
  sung: string, unsung: string, mode: 'glyph' | 'clip' | 'word' = 'glyph', tracking = 0, word?: Word) {
  markWord(word);
  c.font = font(family, size);
  c.letterSpacing = `${tracking}px`;
  const chars = Array.from(text), n = chars.length;
  if (mode === 'word' || p <= 0 || p >= 1 || n === 0) {
    c.fillStyle = (mode === 'word' ? p > 0 : p >= 1) ? sung : unsung;
    c.fillText(text, x, y);
    c.letterSpacing = '0px';
    return;
  }
  if (mode === 'clip') {
    const lay = layout(text, family, size, tracking);
    const k = Math.min(n - 1, Math.floor(p * n)), fr = p * n - k;
    const ex = x + lay.glyphs[k]!.x + lay.glyphs[k]!.w * fr;
    c.fillStyle = unsung; c.fillText(text, x, y);
    c.save(); c.beginPath(); c.rect(x - size, y - size * 1.5, ex - x + size, size * 2.5); c.clip();
    c.fillStyle = sung; c.fillText(text, x, y);
    c.restore();
    c.letterSpacing = '0px';
    return;
  }
  const k = Math.min(n - 1, Math.floor(p * n)), fr = p * n - k;
  const head = chars.slice(0, k).join(''), cur = chars[k]!, tail = chars.slice(k + 1).join('');
  if (head) { c.fillStyle = sung; c.fillText(head, x, y); }
  const cx = x + glyphX(text, k, family, size, tracking);
  c.fillStyle = unsung; c.fillText(cur, cx, y);
  c.save(); c.globalAlpha *= fr; c.fillStyle = sung; c.fillText(cur, cx, y); c.restore();
  if (tail) { c.fillStyle = unsung; c.fillText(tail, x + glyphX(text, k + 1, family, size, tracking), y); }
  c.letterSpacing = '0px';
}

/**
 * The line a scene should feature at t, among lines that start inside the scene window [t0, t1):
 * the line being sung, else the next one if it starts within `pre` s, else the last one while it
 * holds for `hold` s after its end. Null in longer gaps (an instrumental passage).
 */
export function featuredLine(ly: Lyrics, t: number, t0: number, t1: number, pre = 0.6, hold = 1.2): Line | null {
  const own = ly.lines.filter((l) => l.start >= t0 - 0.35 && l.start < t1);
  let best: Line | null = null;
  for (const l of own) {
    if (t >= l.start - pre && t < l.end + hold) {
      // prefer the line being sung / the next one over one that is only holding
      if (!best || (t >= l.start - pre && l.start > best.start && t >= best.end)) best = l;
    }
  }
  return best;
}

/** Lines of the window that are visible at t (anticipation `pre` before, `hold` after), in order. */
export function visibleLines(ly: Lyrics, t: number, t0: number, t1: number, pre = 0.6, hold = 1.2): Line[] {
  return ly.lines.filter((l) => l.start >= t0 - 0.35 && l.start < t1 && t >= l.start - pre && t < l.end + hold);
}

/** Opacity envelope of a line: fades in over [start - pre, start - pre + fin], out over [end + hold - fout, end + hold]. */
export function lineVis(l: Line, t: number, pre = 0.4, hold = 0.35, fin = 0.15, fout = 0.25) {
  return Math.min(smoothstep(l.start - pre, l.start - pre + fin, t), 1 - smoothstep(l.end + hold - fout, l.end + hold, t));
}

/** Index of the word being sung (or the last one started) in a line; -1 before the first word. */
export function activeWord(l: Line, t: number): number {
  let k = -1;
  l.words.forEach((w, i) => { if (t >= w.start) k = i; });
  return k;
}

/** 1 at each word onset of the line, decaying with half-life hl (for per-word punches). */
export function wordHit(l: Line, t: number, hl = 0.12): number {
  let v = 0;
  for (const w of l.words) if (t >= w.start) v = Math.max(v, Math.pow(0.5, (t - w.start) / hl));
  return v;
}

/** 0..1 "held note" amount of a word: how long past a nominal short word it has been sustained. */
export function held(w: Word, t: number, after = 0.35, over = 0.8) {
  if (t < w.start) return 0;
  return clamp((Math.min(t, w.end) - w.start - after) / over);
}

/** Eased entrance 0→1 over `dur` s starting at t0 (outExpo): the standard "snap in". */
export const snapIn = (t: number, t0: number, dur = 0.28) => ease.outExpo(clamp((t - t0) / dur));
