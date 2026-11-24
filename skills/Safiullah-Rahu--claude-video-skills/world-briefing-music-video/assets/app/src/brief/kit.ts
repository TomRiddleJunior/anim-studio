// THE STATE OF THE WORLD — shared drawing kit (Canvas2D, logical 1920×1080, pure functions of t).
// Palette, fonts, timing helpers and the primitives every segment uses: text with tracking, mono labels with sources,
// typed text, hairlines, number counters, pills and tags.
import { F, font, measure } from '../engine/type';
import { clamp, ease, hash, lerp } from '../engine/util';

export const W = 1920, H = 1080, FPS = 24;
export const fi = (t: number) => Math.round(t * FPS);

export const C = {
  night: '#0A1020', panel: '#111A2E', panel2: '#18233B', paper: '#F3EFE6', paper2: '#E7E1D4', ink: '#0B1220',
  red: '#E4572E', hot: '#FF7A4D', deep: '#9E3418', teal: '#4FB3A5', slate: '#8A93A8', dim: '#3A4560', land: '#24304A', land2: '#2C3A58',
};
export const rgbaHex = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};
export const PAPER = (a = 1) => rgbaHex(C.paper, a);
export const INK = (a = 1) => rgbaHex(C.ink, a);
export const RED = (a = 1) => rgbaHex(C.red, a);
export const TEAL = (a = 1) => rgbaHex(C.teal, a);
export const SLATE = (a = 1) => rgbaHex(C.slate, a);
export const NIGHT = (a = 1) => rgbaHex(C.night, a);

export const FONT = {
  serif: (w = 700) => F.display(100, w),
  sans: (w = 500) => F.text(w),
  mono: (w = 400) => F.mono(w),
};

// ---------------------------------------------------------------- timing
export const win = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1e-3, b - a));
export const appear = (t: number, t0: number, d = 0.4, fn = ease.outExpo) => fn(clamp((t - t0) / d));
export const vanish = (t: number, t1: number, d = 0.25) => 1 - ease.inCubic(clamp((t - (t1 - d)) / d));
/** 0..1 visibility: in at t0 (din), out ending at t1 (dout). */
export const life = (t: number, t0: number, t1: number, din = 0.4, dout = 0.25) => Math.min(appear(t, t0, din), vanish(t, t1, dout));

// ---------------------------------------------------------------- text
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string,
  o: { align?: CanvasTextAlign; track?: number; base?: CanvasTextBaseline; alpha?: number; maxW?: number } = {}) {
  c.save();
  c.font = font(fam, size);
  c.fillStyle = col;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.base ?? 'alphabetic';
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  (c as any).letterSpacing = `${o.track ?? 0}px`;
  if (o.maxW) c.fillText(s, x, y, o.maxW); else c.fillText(s, x, y);
  c.restore();
  return measure(s, fam, size, o.track ?? 0);
}
/** Mono caps label (the data voice). */
export const label = (c: CanvasRenderingContext2D, s: string, x: number, y: number, col = PAPER(0.85), size = 14, o: { align?: CanvasTextAlign; w?: number; alpha?: number } = {}) =>
  text(c, s.toUpperCase(), x, y, FONT.mono(o.w ?? 500), size, col, { align: o.align, track: size * 0.14, alpha: o.alpha });
/** "SOURCE · UNHCR · JUN 2026" line. */
export const source = (c: CanvasRenderingContext2D, s: string, x: number, y: number, col = SLATE(0.9), o: { align?: CanvasTextAlign; alpha?: number } = {}) =>
  label(c, `SOURCE · ${s}`, x, y, col, 12, { ...o, w: 400 });

/** Word-wrap s into lines no wider than maxW (returns the lines). */
export function wrap(s: string, fam: string, size: number, maxW: number, track = 0) {
  const words = s.split(/\s+/).filter(Boolean), out: string[] = [];
  let line = '';
  for (const w of words) {
    const tryL = line ? `${line} ${w}` : w;
    if (line && measure(tryL, fam, size, track) > maxW) { out.push(line); line = w; } else line = tryL;
  }
  if (line) out.push(line);
  return out;
}
/** A wrapped paragraph; returns its height. */
export function para(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string, maxW: number, lh = 1.25, o: { alpha?: number; align?: CanvasTextAlign } = {}) {
  const ls = wrap(s, fam, size, maxW);
  ls.forEach((l, i) => text(c, l, x, y + i * size * lh, fam, size, col, { alpha: o.alpha, align: o.align }));
  return ls.length * size * lh;
}
/** Characters typed from t0 at cps, with a block caret while typing. */
export function typed(c: CanvasRenderingContext2D, s: string, x: number, y: number, t: number, t0: number, cps = 32, o: { size?: number; col?: string; w?: number; upper?: boolean } = {}) {
  if (t < t0) return 0;
  const size = o.size ?? 14, fam = FONT.mono(o.w ?? 500);
  const str = o.upper === false ? s : s.toUpperCase();
  const n = Math.min(str.length, Math.floor((t - t0) * cps));
  const wpx = text(c, str.slice(0, n), x, y, fam, size, o.col ?? PAPER(0.9), { track: size * 0.1 });
  if (n < str.length || Math.floor(t * 2.2) % 2 === 0) { c.fillStyle = o.col ?? PAPER(0.9); c.fillRect(x + wpx + 2, y - size * 0.8, size * 0.5, size * 0.95); }
  return wpx;
}

// ---------------------------------------------------------------- marks
export function hair(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col = PAPER(0.5), w = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
export function drawOn(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, u: number, col = PAPER(0.6), w = 1) {
  if (u > 0) hair(c, x0, y0, lerp(x0, x1, clamp(u)), lerp(y0, y1, clamp(u)), col, w);
}
/** Rounded rect path. */
export function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 6) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}
/** A pill tag (kicker) with text; returns its width. */
export function pill(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { fill?: string; col?: string; size?: number; alpha?: number } = {}) {
  const size = o.size ?? 13, fam = FONT.mono(600), tw = measure(s.toUpperCase(), fam, size, size * 0.14) + size * 1.4;
  c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
  c.fillStyle = o.fill ?? RED(); rrect(c, x, y - size * 1.2, tw, size * 1.75, size * 0.9); c.fill();
  text(c, s.toUpperCase(), x + size * 0.7, y, fam, size, o.col ?? PAPER(), { track: size * 0.14 });
  c.restore();
  return tw;
}
/** A soft dark (or paper) pool behind type over imagery — legibility without a hard box. */
export function scrim(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a = 0.6, col = '6,10,20') {
  c.save();
  const cx = x + w / 2, cy = y + h / 2, rx = w * 0.65 + 120, ry = h * 0.75 + 90;
  c.translate(cx, cy); c.scale(rx / ry, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.6, `rgba(${col},${a * 0.55})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
  c.restore();
}

// ---------------------------------------------------------------- numbers
/** Value counting from a to b between t0 and t0+d (eased), formatted. */
export function countTo(t: number, t0: number, a: number, b: number, d = 1.0, dec = 0) {
  const v = lerp(a, b, ease.outCubic(clamp((t - t0) / d)));
  return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
/**
 * A headline number: big serif numeral (counting), unit, a label above and a source line below.
 * Returns the block's bounding box.
 */
export function bigNumber(c: CanvasRenderingContext2D, x: number, y: number, t: number, t0: number,
  o: { value: number; from?: number; dec?: number; prefix?: string; suffix?: string; label: string; source: string; size?: number; col?: string; align?: 'left' | 'right'; ink?: boolean; hot?: boolean }) {
  const k = appear(t, t0, 0.45);
  if (k <= 0) return { x, y, w: 0, h: 0 };
  const size = o.size ?? 150, fam = FONT.serif(700);
  const s = `${o.prefix ?? ''}${countTo(t, t0, o.from ?? 0, o.value, 1.1, o.dec ?? 0)}${o.suffix ?? ''}`;
  const full = `${o.prefix ?? ''}${o.value.toLocaleString('en-US', { minimumFractionDigits: o.dec ?? 0, maximumFractionDigits: o.dec ?? 0 })}${o.suffix ?? ''}`;
  const w = measure(full, fam, size, -size * 0.02);
  const ax = o.align === 'right' ? x - w : x;
  const fg = o.ink ? INK() : PAPER();
  c.save();
  c.globalAlpha *= k;
  c.translate(0, (1 - k) * 18);
  label(c, o.label, ax, y - size * 0.82, o.ink ? INK(0.75) : PAPER(0.8), 15);
  text(c, s, ax, y, fam, size, o.col ?? (o.hot ? RED() : fg), { track: -size * 0.02 });
  hair(c, ax, y + 22, ax + w * ease.outCubic(clamp((t - t0 - 0.2) / 0.6)), y + 22, o.ink ? INK(0.4) : PAPER(0.35), 1);
  source(c, o.source, ax, y + 46, o.ink ? INK(0.6) : SLATE(0.95));
  c.restore();
  return { x: ax, y: y - size * 0.95, w, h: size * 0.95 + 50 };
}
export { clamp, ease, hash, lerp, measure };
