// ESCAPE VELOCITY · SS27 — shared drawing kit (Canvas2D, logical 1920×1080, pure functions of t).
// Palette, fonts, easing helpers, and primitives every chapter uses: text with tracking, hairlines, dotted
// leaders, barcodes, stamps, waveform bars, gauges, number tickers, typed text with a block caret.
import { F, font, measure, pick } from '../engine/type';
import { clamp, ease, hash, lerp } from '../engine/util';

export const W = 1920, H = 1080;
export const FPS = 24;
export const fi = (t: number) => Math.round(t * FPS); // frame index (deterministic flicker / glyph spin)

// ---------------------------------------------------------------- palette (sRGB css)
export const C = {
  ink: '#121316', black: '#07080A', paper: '#EFEBE2', paper2: '#E4DED2', white: '#F2EFE8',
  coral: '#E8553D', coralHot: '#FF7A5C', coralDeep: '#A8321F', mint: '#7FE0D2', grey: '#9AA0A8', dim: '#4A4E55',
};
export const rgbaHex = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};
export const WHITE = (a = 1) => rgbaHex(C.white, a);
export const CORAL = (a = 1) => rgbaHex(C.coral, a);
export const INK = (a = 1) => rgbaHex(C.ink, a);

// ---------------------------------------------------------------- fonts
export const FONT = {
  grot: (w = 700) => F.display(100, w),
  mono: (w = 400) => F.mono(w),
  flap: (w = 700) => pick('flap', { weight: w }),
};

// ---------------------------------------------------------------- timing helpers
export const win = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1e-3, b - a));
export const appear = (t: number, t0: number, d = 0.35, fn = ease.outExpo) => fn(clamp((t - t0) / d));
export const vanish = (t: number, t1: number, d = 0.25) => 1 - ease.inCubic(clamp((t - (t1 - d)) / d));
export const life = (t: number, t0: number, t1: number, din = 0.3, dout = 0.25) => Math.min(appear(t, t0, din), vanish(t, t1, dout));

// ---------------------------------------------------------------- text
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, fam: string, size: number, col: string,
  o: { align?: CanvasTextAlign; track?: number; base?: CanvasTextBaseline; alpha?: number } = {}) {
  c.save();
  c.font = font(fam, size);
  c.fillStyle = col;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.base ?? 'alphabetic';
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  (c as any).letterSpacing = `${o.track ?? 0}px`;
  c.fillText(s, x, y);
  c.restore();
  return measure(s, fam, size, o.track ?? 0);
}
/** Mono label, small caps style (tracking), the HUD voice. */
export const label = (c: CanvasRenderingContext2D, s: string, x: number, y: number, col = WHITE(0.9), size = 13, o: { align?: CanvasTextAlign; w?: number; alpha?: number } = {}) =>
  text(c, s.toUpperCase(), x, y, FONT.mono(o.w ?? 400), size, col, { align: o.align, track: size * 0.18, alpha: o.alpha });

/** Text typed character by character from t0 at cps chars/s, with a block caret while typing (and blinking after). */
export function typed(c: CanvasRenderingContext2D, s: string, x: number, y: number, t: number, t0: number, cps = 28,
  o: { size?: number; col?: string; caret?: boolean; w?: number; upper?: boolean } = {}) {
  const size = o.size ?? 13, fam = FONT.mono(o.w ?? 400);
  const str = o.upper === false ? s : s.toUpperCase();
  const n = Math.max(0, Math.min(str.length, Math.floor((t - t0) * cps)));
  if (t < t0) return 0;
  const shown = str.slice(0, n);
  const wpx = text(c, shown, x, y, fam, size, o.col ?? WHITE(0.92), { track: size * 0.12 });
  if (o.caret !== false && (n < str.length || Math.floor(t * 2.4) % 2 === 0)) {
    c.fillStyle = o.col ?? WHITE(0.92);
    c.fillRect(x + wpx + 2, y - size * 0.82, size * 0.55, size * 0.98);
  }
  return wpx;
}

// ---------------------------------------------------------------- lines & marks
export function hair(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col = WHITE(0.55), w = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
/** A line drawn from a to b up to fraction u (draw-on). */
export function drawOn(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, u: number, col = WHITE(0.6), w = 1) {
  if (u <= 0) return;
  hair(c, x0, y0, lerp(x0, x1, clamp(u)), lerp(y0, y1, clamp(u)), col, w);
}
export function dotLeader(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, col = INK(0.45)) {
  c.save(); c.fillStyle = col;
  for (let x = x0; x < x1; x += 7) c.fillRect(x, y - 1, 2, 1.4);
  c.restore();
}
export function cross(c: CanvasRenderingContext2D, x: number, y: number, s = 12, col = WHITE(0.6), w = 1) {
  hair(c, x - s, y, x + s, y, col, w); hair(c, x, y - s, x, y + s, col, w);
}
export function barcode(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, col = INK(0.95)) {
  c.save(); c.fillStyle = col;
  let px = x;
  for (let i = 0; px < x + w; i++) {
    const bw = 1 + Math.floor(hash(seed, i) * 3.4);
    if (i % 2 === 0) c.fillRect(px, y, bw, h);
    px += bw + (hash(seed, i, 7) < 0.3 ? 2 : 1);
  }
  c.restore();
}
/** A rubber stamp: rotated box + text, slammed in at t0 (scale overshoot), slightly worn. */
export function stamp(c: CanvasRenderingContext2D, s: string, x: number, y: number, t: number, t0: number, o: { size?: number; col?: string; rot?: number } = {}) {
  if (t < t0) return;
  const k = clamp((t - t0) / 0.18), sc = 1 + 0.6 * (1 - ease.outBack(k));
  const size = o.size ?? 44, col = o.col ?? CORAL(0.92);
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? -0.12); c.scale(sc, sc);
  c.globalAlpha *= clamp(k * 2);
  c.font = font(FONT.grot(900), size);
  const w = measure(s, FONT.grot(900), size) + size * 0.6, h = size * 1.25;
  c.strokeStyle = col; c.lineWidth = size * 0.08;
  c.strokeRect(-w / 2, -h / 2, w, h);
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(s, 0, size * 0.04);
  // wear: knock out specks
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) c.fillRect(-w / 2 + hash(i, 1) * w, -h / 2 + hash(i, 2) * h, 1 + hash(i, 3) * 3, 1 + hash(i, 4) * 2);
  c.restore();
}

// ---------------------------------------------------------------- data viz primitives
/** Waveform bars (audio-reactive via `level`), centred vertically on y. */
export function waveBars(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, level: number, o: { n?: number; col?: string; hot?: string; seed?: number } = {}) {
  const n = o.n ?? 48, bw = w / n;
  for (let i = 0; i < n; i++) {
    const v = clamp(0.12 + 0.88 * level * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.9 + t * 7 + (o.seed ?? 0)) * hash(i, fi(t) >> 1, o.seed ?? 3))));
    c.fillStyle = i === n - 1 ? (o.hot ?? CORAL()) : (o.col ?? WHITE(0.85));
    c.fillRect(x + i * bw, y - (v * h) / 2, Math.max(1, bw * 0.55), v * h);
  }
}
/** A number that counts up from a to b between t0 and t1 (formatted with thousands separators). */
export function countUp(t: number, t0: number, t1: number, a: number, b: number, dec = 0) {
  const v = lerp(a, b, ease.outCubic(clamp((t - t0) / Math.max(1e-3, t1 - t0))));
  return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
/** Horizontal meter: track + fill (0..1) + ticks. */
export function meter(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, o: { col?: string; track?: string; ticks?: number } = {}) {
  c.fillStyle = o.track ?? WHITE(0.18); c.fillRect(x, y, w, h);
  c.fillStyle = o.col ?? CORAL(); c.fillRect(x, y, w * clamp(v), h);
  const n = o.ticks ?? 10;
  for (let i = 1; i < n; i++) hair(c, x + (w * i) / n, y + h + 2, x + (w * i) / n, y + h + 6, WHITE(0.4));
}
/** A small line chart through values (0..1), drawn on to u. */
export function sparkline(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vals: number[], u: number, col = WHITE(0.9), lw = 1.6) {
  const n = vals.length;
  if (n < 2 || u <= 0) return;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  const m = Math.max(1, Math.floor((n - 1) * clamp(u)));
  for (let i = 0; i <= m; i++) {
    const px = x + (w * i) / (n - 1), py = y + h - h * vals[i]!;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke(); c.restore();
}
