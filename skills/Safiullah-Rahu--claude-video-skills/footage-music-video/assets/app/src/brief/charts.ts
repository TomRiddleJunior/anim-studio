// Data graphics that draw on with the narration: horizontal bars, a line chart, a stat stack, a timeline / calendar.
// Every chart carries its source line. Pure functions of t.
import { clamp, ease, lerp } from '../engine/util';
import { PAPER, INK, RED, TEAL, SLATE, FONT, text, label, source, hair, appear, measure, rgbaHex, C } from './kit';

export interface Bar { label: string; value: number; display?: string; hot?: boolean; good?: boolean }
/** Horizontal bars growing from t0, one after another (stagger). */
export function bars(c: CanvasRenderingContext2D, x: number, y: number, w: number, t: number, t0: number,
  o: { title: string; source: string; items: Bar[]; max?: number; rowH?: number; ink?: boolean; stagger?: number; unit?: string }) {
  const k = appear(t, t0, 0.4);
  if (k <= 0) return;
  const rowH = o.rowH ?? 46, max = o.max ?? Math.max(...o.items.map((b) => b.value)), lw = 250;
  const fg = o.ink ? INK : PAPER;
  c.save(); c.globalAlpha *= k;
  label(c, o.title, x, y, fg(0.9), 15, { w: 600 });
  hair(c, x, y + 14, x + w, y + 14, fg(0.3));
  o.items.forEach((b, i) => {
    const tb = t0 + 0.25 + i * (o.stagger ?? 0.18), u = ease.outCubic(clamp((t - tb) / 0.8));
    const yy = y + 48 + i * rowH;
    text(c, b.label, x, yy + 6, FONT.sans(500), 19, fg(0.92), { maxW: lw - 16 });
    const bw = (w - lw - 110) * (b.value / max) * u;
    c.fillStyle = b.hot ? RED() : b.good ? TEAL() : fg(0.55);
    c.fillRect(x + lw, yy - 12, Math.max(2, bw), 22);
    if (u > 0.05) text(c, b.display ?? `${b.value.toLocaleString('en-US')}${o.unit ?? ''}`, x + lw + bw + 12, yy + 6, FONT.mono(600), 17, b.hot ? RED() : fg(0.95), { alpha: clamp(u * 2) });
  });
  source(c, o.source, x, y + 48 + o.items.length * rowH + 8, o.ink ? INK(0.55) : SLATE(0.95));
  c.restore();
}

/** A line chart drawn on from t0 over d seconds; points [x-label, value]. Optional highlighted last point. */
export function lineChart(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, t0: number,
  o: { title: string; source: string; pts: [string, number][]; d?: number; ink?: boolean; unit?: string; min?: number; max?: number; hotLast?: boolean; good?: boolean; dec?: number; zero?: boolean }) {
  const k = appear(t, t0, 0.4);
  if (k <= 0) return;
  const fg = o.ink ? INK : PAPER, n = o.pts.length;
  const vs = o.pts.map((p) => p[1]);
  const lo = o.min ?? (o.zero ? 0 : Math.min(...vs)), hi = o.max ?? Math.max(...vs), pad = (hi - lo) * 0.12 || 1;
  const X = (i: number) => x + (w * i) / Math.max(1, n - 1), Y = (v: number) => y + h - ((v - (lo - (o.zero ? 0 : pad))) / (hi + pad - (lo - (o.zero ? 0 : pad)))) * h;
  c.save(); c.globalAlpha *= k;
  label(c, o.title, x, y - 26, fg(0.9), 15, { w: 600 });
  hair(c, x, y + h, x + w, y + h, fg(0.35));
  for (let g = 1; g <= 3; g++) hair(c, x, y + h - (h * g) / 4, x + w, y + h - (h * g) / 4, fg(0.08));
  o.pts.forEach((p, i) => { if (i === 0 || i === n - 1 || n <= 8 || i % Math.ceil(n / 6) === 0) text(c, p[0], X(i), y + h + 24, FONT.mono(400), 13, fg(0.65), { align: 'center' }); });
  const u = clamp((t - t0 - 0.2) / (o.d ?? 1.6)), m = (n - 1) * ease.inOutQuad(u);
  const col = o.good ? TEAL() : RED();
  c.strokeStyle = col; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
  for (let i = 0; i <= Math.floor(m); i++) { if (i === 0) c.moveTo(X(i), Y(vs[i]!)); else c.lineTo(X(i), Y(vs[i]!)); }
  const fr = m - Math.floor(m), i1 = Math.min(n - 1, Math.floor(m) + 1);
  if (fr > 0) c.lineTo(lerp(X(Math.floor(m)), X(i1), fr), lerp(Y(vs[Math.floor(m)]!), Y(vs[i1]!), fr));
  c.stroke();
  // area wash
  c.globalAlpha *= 0.12; c.lineTo(lerp(X(Math.floor(m)), X(i1), fr), y + h); c.lineTo(X(0), y + h); c.closePath(); c.fillStyle = col; c.fill(); c.globalAlpha /= 0.12;
  // end value
  const ix = Math.min(n - 1, Math.round(m)), lv = vs[ix]!;
  c.fillStyle = col; c.beginPath(); c.arc(lerp(X(Math.floor(m)), X(i1), fr), lerp(Y(vs[Math.floor(m)]!), Y(vs[i1]!), fr), 5, 0, Math.PI * 2); c.fill();
  if (u >= 1 || o.hotLast) text(c, `${lv.toLocaleString('en-US', { maximumFractionDigits: o.dec ?? 1 })}${o.unit ?? ''}`, X(n - 1) + 14, Y(vs[n - 1]!) + 6, FONT.mono(600), 18, col, { alpha: clamp((u - 0.8) * 5) });
  source(c, o.source, x, y + h + 52, o.ink ? INK(0.55) : SLATE(0.95));
  c.restore();
}

export interface Stat { k: string; v: string; hot?: boolean; good?: boolean; t?: number }
/** A stack of key/value rows (a fact card), each row landing at its own time. */
export function statCard(c: CanvasRenderingContext2D, x: number, y: number, w: number, t: number, t0: number,
  o: { title: string; rows: Stat[]; source?: string; ink?: boolean; rowH?: number; kicker?: string }) {
  const k = appear(t, t0, 0.4);
  if (k <= 0) return { h: 0 };
  const rowH = o.rowH ?? 44, h = 64 + o.rows.length * rowH + (o.source ? 34 : 10);
  c.save(); c.globalAlpha *= k; c.translate((1 - k) * 24, 0);
  c.fillStyle = o.ink ? rgbaHex(C.paper, 0.97) : 'rgb(16,24,42)';
  c.fillRect(x, y, w, h);
  c.fillStyle = RED(); c.fillRect(x, y, 4, h);
  const fg = o.ink ? INK : PAPER;
  if (o.kicker) label(c, o.kicker, x + 24, y + 30, RED(), 12, { w: 600 });
  text(c, o.title, x + 24, y + (o.kicker ? 54 : 40), FONT.serif(700), o.kicker ? 22 : 26, fg());
  o.rows.forEach((r, i) => {
    const kr = appear(t, r.t ?? t0 + 0.2 + i * 0.15, 0.35);
    const yy = y + 64 + (o.kicker ? 14 : 0) + i * rowH + 22;
    c.save(); c.globalAlpha *= kr;
    hair(c, x + 24, yy - 30, x + w - 24, yy - 30, fg(0.12));
    text(c, r.k, x + 24, yy, FONT.sans(500), 18, fg(0.8));
    text(c, r.v, x + w - 24, yy, FONT.mono(600), 18, r.hot ? RED() : r.good ? TEAL() : fg(), { align: 'right' });
    c.restore();
  });
  if (o.source) source(c, o.source, x + 24, y + h - 14, o.ink ? INK(0.5) : SLATE(0.9));
  c.restore();
  return { h };
}

export interface CalItem { date: string; title: string; where?: string; t?: number; hot?: boolean }
/** "What to watch": a row of date tiles landing one by one. */
export function calendar(c: CanvasRenderingContext2D, x: number, y: number, t: number, t0: number, items: CalItem[], o: { tileW?: number; gap?: number; ink?: boolean } = {}) {
  const tw = o.tileW ?? 300, gap = o.gap ?? 24;
  items.forEach((it, i) => {
    const k = appear(t, it.t ?? t0 + i * 0.35, 0.45);
    if (k <= 0) return;
    const xx = x + i * (tw + gap);
    c.save(); c.globalAlpha *= k; c.translate(0, (1 - k) * 30);
    c.fillStyle = o.ink ? rgbaHex(C.paper, 0.97) : 'rgb(16,24,42)'; c.fillRect(xx, y, tw, 210);
    c.fillStyle = it.hot ? RED() : TEAL(); c.fillRect(xx, y, tw, 6);
    const fg = o.ink ? INK : PAPER;
    text(c, it.date.toUpperCase(), xx + 22, y + 52, FONT.mono(600), 20, it.hot ? RED() : fg(0.95), { track: 2 });
    const lines = wrapLines(it.title, tw - 44, 26);
    lines.forEach((l, j) => text(c, l, xx + 22, y + 98 + j * 32, FONT.serif(700), 26, fg()));
    if (it.where) label(c, it.where, xx + 22, y + 190, fg(0.6), 12);
    c.restore();
  });
}
function wrapLines(s: string, maxW: number, size: number) {
  const fam = FONT.serif(700), out: string[] = [];
  let line = '';
  for (const w of s.split(' ')) { const tl = line ? `${line} ${w}` : w; if (line && measure(tl, fam, size) > maxW) { out.push(line); line = w; } else line = tl; }
  if (line) out.push(line);
  return out.slice(0, 3);
}
