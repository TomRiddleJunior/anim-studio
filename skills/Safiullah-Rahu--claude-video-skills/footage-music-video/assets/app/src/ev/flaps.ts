// Split-flap boards. Each cell flips through random glyphs (staggered) before settling when its text changes;
// the flap shows a split line, a half-cell shading and a little squash while it falls. Pure function of t:
// a board is described by its text history [(time, text)], and every cell knows when it last changed.
import { font } from '../engine/type';
import { clamp, ease, hash } from '../engine/util';
import { FONT, fi, WHITE, CORAL, rgbaHex, C } from './kit';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export interface Board {
  x: number; y: number;
  cols: number; rows: number;
  cw: number; ch: number; gap?: number;
  /** text history, oldest first: [time, rows of text] */
  states: [number, string[]][];
  ink?: string; cell?: string; accent?: string;
  stagger?: number; spin?: number;
  weight?: number;
  /** spin-glyph seed (default: from the board's position, so separate boards never spin in lockstep) */
  seed?: number;
  /** colour washed over a flipping cell (default: the coral accent; null = no wash) */
  wash?: string | null;
  /** letters a flipping cell may show while settling on a letter (digits are always stripped; other cells flip blank) */
  glyphs?: string;
  /** per-cell colour override: (row, col, char) -> css or undefined */
  tint?: (r: number, k: number, ch: string) => string | undefined;
}

function charAt(rows: string[], r: number, k: number) {
  const line = (rows[r] ?? '').toUpperCase();
  return line[k] ?? ' ';
}

/** Draw a board at time t. Returns the board's pixel size. */
export function drawBoard(c: CanvasRenderingContext2D, b: Board, t: number, alpha = 1) {
  const gap = b.gap ?? Math.max(2, b.cw * 0.08), stag = b.stagger ?? 0.03, spin = b.spin ?? 0.32;
  // which state is current, and the previous one
  let si = -1;
  for (let i = 0; i < b.states.length; i++) if (t >= b.states[i]![0]) si = i;
  if (si < 0) return { w: 0, h: 0 };
  const [tc, cur] = b.states[si]!, prev = si > 0 ? b.states[si - 1]![1] : null;
  c.save();
  c.globalAlpha *= alpha;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const fam = FONT.flap(b.weight ?? 700);
  const seed = b.seed ?? Math.round(b.x * 7.31 + b.y * 3.17);
  c.font = font(fam, b.ch * 0.74);
  for (let r = 0; r < b.rows; r++) for (let k = 0; k < b.cols; k++) {
    const x = b.x + k * (b.cw + gap), y = b.y + r * (b.ch + gap);
    const ch = charAt(cur, r, k), was = prev ? charAt(prev, r, k) : ' ';
    const changed = prev === null || ch !== was;
    // a token that contains a digit ("$1.4", "485", "09-10") lands all at once, on its last cell's beat: settling left
    // to right would flash partial numbers ("$1", "48") for a frame or two
    // (and an outgoing numeric token clears all at once, on its first cell's beat: "~950" never passes "50", "0")
    const span = (line: string): [number, number] | null => {
      if (!line[k] || line[k] === ' ') return null;
      let a = k; while (a > 0 && line[a - 1] && line[a - 1] !== ' ') a--;
      let e = k; while (line[e + 1] && line[e + 1] !== ' ') e++;
      return /\d/.test(line.slice(a, e + 1)) ? [a, e] : null;
    };
    const row = (cur[r] ?? '').toUpperCase(), prow = (prev?.[r] ?? '').toUpperCase();
    const sIn = ch !== ' ' ? span(row) : null, sOut = was !== ' ' && changed ? span(prow) : null;
    const kk = sIn ? sIn[1] : sOut ? sOut[0] : k;
    const local = (t - tc - (r * b.cols + kk) * stag * 0.5 - kk * stag) / spin;
    const flipping = changed && local >= 0 && local < 1;
    const waiting = changed && local < 0;
    // cell body
    c.fillStyle = b.cell ?? 'rgb(14,15,18)'; // opaque: the 2D layer composites in linear light, so 0.9 alpha lets a bright plate through
    c.fillRect(x, y, b.cw, b.ch);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.fillRect(x, y, b.cw, b.ch / 2);
    let g = waiting ? was : ch;
    // A flipping cell never shows a digit it isn't settling on: this is a fact-checked film, and a random spin
    // digit next to a source line reads as an invented number ("38 OCT", "K8 0%"). Cells settling on a letter spin
    // letters; cells settling on a digit, a symbol or a blank flip blank leaves (the squash and wash still move).
    const set = (b.glyphs ?? GLYPHS).replace(/[0-9]/g, '');
    const hv = hash(r, k, fi(t), seed);
    if (flipping) g = /[A-Z]/i.test(ch) && set.length ? set[Math.floor(hv * set.length)]! : ' ';
    if (g !== ' ') {
      c.save();
      if (flipping) { // squash the falling half
        const ph = (local * 6) % 1, sq = 0.55 + 0.45 * Math.abs(Math.cos(ph * Math.PI));
        c.translate(x + b.cw / 2, y + b.ch / 2); c.scale(1, sq); c.translate(-(x + b.cw / 2), -(y + b.ch / 2));
      }
      c.fillStyle = b.tint?.(r, k, g) ?? (flipping ? (b.accent ?? CORAL()) : (b.ink ?? WHITE(0.96)));
      c.fillText(g, x + b.cw / 2, y + b.ch / 2 + b.ch * 0.03);
      c.restore();
    }
    // split line + hinge
    c.fillStyle = 'rgba(0,0,0,0.65)';
    c.fillRect(x, y + b.ch / 2 - 0.75, b.cw, 1.5);
    if (flipping && b.wash !== null) { c.save(); c.globalAlpha *= 0.25 * (1 - local); c.fillStyle = b.wash ?? rgbaHex(C.coral, 1); c.fillRect(x, y, b.cw, b.ch); c.restore(); }
  }
  c.restore();
  return { w: b.cols * (b.cw + gap) - gap, h: b.rows * (b.ch + gap) - gap };
}

/** Pad/centre strings for a board row. */
export const pad = (s: string, n: number, align: 'left' | 'center' | 'right' = 'left') => {
  s = s.toUpperCase().slice(0, n);
  const sp = n - s.length;
  if (align === 'right') return ' '.repeat(sp) + s;
  if (align === 'center') return ' '.repeat(Math.floor(sp / 2)) + s + ' '.repeat(Math.ceil(sp / 2));
  return s + ' '.repeat(sp);
};
export { clamp, ease };
