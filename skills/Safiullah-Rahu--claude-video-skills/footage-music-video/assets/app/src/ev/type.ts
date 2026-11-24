// Lyric typography for ESCAPE VELOCITY · SS27 — every sung/spoken word on screen on its time.
//   block:     big grotesk line(s) top- or bottom-left; sung words white, the current word coral, the words still to
//              come ghosted in coral at low alpha; a hairline under the block and a typed mono caret annotation.
//   masthead:  one giant word at a time, slammed on its start (choruses, chants).
//   mass:      a field of micro mono text re-lit on every eighth (the drop), with the line as a block.
//   cover:     a narrow coverline column beside the subject, words landing as they are spoken.
import type { Line, Word } from '../engine/lyrics';
import { Lyrics } from '../engine/lyrics';
import { markWord } from '../engine/karaoke';
import { font, measure } from '../engine/type';
import { clamp, ease, hash } from '../engine/util';
import { FONT, W, H, WHITE, CORAL, INK, text, hair, typed, fi } from './kit';

export interface BlockOpts {
  x?: number; y?: number;           // top-left of the first baseline region
  maxW?: number; size?: number;
  anchor?: 'top' | 'bottom';
  ink?: number;                     // 1 = dark ink type (white chapters)
  annotation?: string;              // typed caret line under the block
  annotateAt?: number;
  ghost?: boolean;                  // show words still to come (default true)
  quote?: boolean;
  weight?: number;
}

interface Laid { w: Word; s: string; x: number; y: number; width: number }

function layout(words: Word[], fam: string, size: number, maxW: number) {
  const sp = measure(' ', fam, size);
  const out: Laid[] = [];
  let x = 0, y = 0;
  for (const w of words) {
    const s = w.w;
    const ww = measure(s, fam, size, -size * 0.02);
    if (x > 0 && x + ww > maxW) { x = 0; y += size * 1.02; }
    out.push({ w, s, x, y, width: ww });
    x += ww + sp;
  }
  return { laid: out, height: y + size };
}

/** The block's rectangle (logical px) as lyricBlock lays it out — for scrims and collision checks. */
export function blockRect(line: Line, o: BlockOpts = {}) {
  const size = o.size ?? 74, fam = FONT.grot(o.weight ?? 800), maxW = o.maxW ?? 980;
  const { laid, height } = layout(line.words, fam, size, maxW);
  const x0 = o.x ?? 72;
  const yTop = o.anchor === 'bottom' ? (o.y ?? 900) - height : (o.y ?? 160);
  const w = Math.max(...laid.map((l) => l.x + l.width), 0);
  return { x: x0, y: yTop, w, h: height + 26 + (o.annotation ? 34 : 0) };
}

/** The main lyric block. Visible from the line's start - pre until its end + hold. */
export function lyricBlock(c: CanvasRenderingContext2D, line: Line, t: number, o: BlockOpts = {}, pre = 0.35, hold = 0.6) {
  if (t < line.start - pre || t > line.end + hold + 0.3) return;
  const size = o.size ?? 74, fam = FONT.grot(o.weight ?? 800), maxW = o.maxW ?? 980;
  const { laid, height } = layout(line.words, fam, size, maxW);
  const x0 = o.x ?? 72;
  const yTop = o.anchor === 'bottom' ? (o.y ?? 900) - height : (o.y ?? 160);
  const fadeOut = 1 - ease.inCubic(clamp((t - (line.end + hold)) / 0.3));
  const inK = ease.outExpo(clamp((t - (line.start - pre)) / 0.25));
  const ink = o.ink ?? 0;
  c.save();
  c.globalAlpha *= fadeOut;
  const ai = (() => { let k = -1; line.words.forEach((w, i) => { if (t >= w.start - 0.02) k = i; }); return k; })();
  laid.forEach((l, i) => {
    const sung = t >= l.w.start - 0.02;
    const current = i === ai && t < l.w.end + 0.08;
    let colr: string;
    if (current) colr = CORAL();
    else if (sung) colr = ink > 0.5 ? INK(0.96) : WHITE(0.97);
    else if (o.ghost !== false) colr = CORAL(0.22 * inK);
    else return;
    const pop = sung ? 1 + 0.06 * (1 - ease.outCubic(clamp((t - l.w.start) / 0.18))) : 1;
    c.save();
    c.translate(x0 + l.x, yTop + l.y + size * 0.8);
    c.scale(pop, pop);
    text(c, l.s, 0, 0, fam, size, colr, { track: -size * 0.02 });
    c.restore();
    if (sung) markWord(l.w);
  });
  // hairline + typed annotation
  const ruleY = yTop + height + 26;
  const rk = ease.outCubic(clamp((t - line.start) / 0.5));
  hair(c, x0, ruleY, x0 + Math.min(maxW, 620) * rk, ruleY, ink > 0.5 ? INK(0.7) : WHITE(0.7), 1.2);
  if (o.annotation) typed(c, o.annotation, x0, ruleY + 26, t, o.annotateAt ?? line.start + 0.2, 26, { col: ink > 0.5 ? INK(0.85) : WHITE(0.9) });
  c.restore();
}

/** One giant word at a time (the current word of the line), slammed in on its start. */
export function masthead(c: CanvasRenderingContext2D, line: Line, t: number, o: { y?: number; ink?: number; max?: number; align?: 'center' | 'left' } = {}) {
  let w: Word | null = null;
  for (const x of line.words) if (t >= x.start - 0.02) w = x;
  if (!w || t > line.end + 0.5) return;
  const s = w.w.replace(/[(),.!?"]/g, '').toUpperCase();
  const fam = FONT.grot(900);
  const size = Math.min(o.max ?? 420, ((W - 160) * 100) / Math.max(1, measure(s, fam, 100, -2)));
  const k = clamp((t - w.start) / 0.16), sc = 1 + 0.18 * (1 - ease.outExpo(k));
  c.save();
  c.translate(o.align === 'left' ? 72 : W / 2, o.y ?? H / 2 + size * 0.36);
  c.scale(sc, sc);
  text(c, s, 0, 0, fam, size, t < w.end + 0.05 ? CORAL() : (o.ink ?? 0) > 0.5 ? INK() : WHITE(), { align: o.align === 'left' ? 'left' : 'center', track: -size * 0.03 });
  c.restore();
  markWord(w);
}

/** A declared mass of micro text (the line repeated), re-lit on every eighth note. */
export function mass(c: CanvasRenderingContext2D, line: Line, t: number, eighth: number, o: { ink?: number; alpha?: number } = {}) {
  if (t < line.start - 0.2 || t > line.end + 0.4) return;
  const s = line.words.map((w) => w.w.toUpperCase()).join(' ') + '   ';
  const fam = FONT.mono(600), size = 15;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.font = font(fam, size);
  const sw = measure(s, fam, size);
  const prog = clamp((t - line.start) / Math.max(0.3, line.end - line.start));
  for (let r = 0, y = 150; y < H - 120; y += 21, r++) {
    const on = hash(r, eighth) < 0.25 + 0.6 * prog;
    c.fillStyle = on ? ((o.ink ?? 0) > 0.5 ? INK(0.7) : WHITE(0.55)) : ((o.ink ?? 0) > 0.5 ? INK(0.12) : WHITE(0.1));
    for (let x = -((r * 97 + eighth * 31) % sw); x < W; x += sw) c.fillText(s, x, y);
  }
  c.restore();
}

/** Narrow coverline column (words land as spoken), e.g. beside a model. */
export function coverline(c: CanvasRenderingContext2D, line: Line, t: number, x: number, y: number, o: { size?: number; maxW?: number; ink?: number } = {}) {
  if (t < line.start - 0.2 || t > line.end + 0.9) return;
  const size = o.size ?? 64, fam = FONT.grot(900);
  const { laid } = layout(line.words, fam, size, o.maxW ?? 520);
  c.save();
  c.globalAlpha *= 1 - clamp((t - line.end - 0.6) / 0.3);
  laid.forEach((l) => {
    if (t < l.w.start - 0.02) return;
    const k = ease.outExpo(clamp((t - l.w.start) / 0.2));
    text(c, l.s.toUpperCase(), x + l.x, y + l.y + size * 0.8 + (1 - k) * 18, fam, size, Lyrics.wordProgress(l.w, t) < 1 ? CORAL() : (o.ink ?? 0) > 0.5 ? INK() : WHITE(), { track: -size * 0.02, alpha: k });
    markWord(l.w);
  });
  c.restore();
}
export { fi };
