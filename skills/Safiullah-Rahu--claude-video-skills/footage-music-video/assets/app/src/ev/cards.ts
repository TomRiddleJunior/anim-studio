// Explaining graphics: cream show cards (tickets, model cards, garment tags), dark terminal panels, figure panels
// with axes, computer-vision boxes with label tabs and connector lines. All animate in on their own timeline
// (appear at t0), are pure functions of t, and are drawn in logical 1920×1080 pixels.
import { font, measure } from '../engine/type';
import { clamp, ease, hash, lerp } from '../engine/util';
import { FONT, C, WHITE, CORAL, INK, rgbaHex, text, label, hair, dotLeader, barcode, appear, fi } from './kit';

export interface Box { x: number; y: number; w: number; h: number }

// ---------------------------------------------------------------- the cream show card
export interface Row { k: string; v: string; hot?: boolean; dot?: boolean }
export interface CardSpec {
  x: number; y: number; w: number;
  kicker?: string;      // tiny mono header ("ESCAPE VELOCITY · SS27")
  sub?: string;         // second header line
  title?: string;       // big grotesk title (\n for lines)
  rows?: Row[];         // key ... value rows with dotted leaders
  rowsHeader?: string;
  foot?: string;        // barcode caption
  footRight?: string;
  rot?: number;
  mark?: boolean;       // the coral spark mark
  titleSize?: number;
}
/** Cream paper card, slid + rotated in at t0. Returns the card's box (for connectors). */
export function showCard(c: CanvasRenderingContext2D, s: CardSpec, t: number, t0: number, alpha = 1): Box {
  const k = appear(t, t0, 0.45);
  if (k <= 0 || alpha <= 0) return { x: s.x, y: s.y, w: s.w, h: 0 };
  const pad = 32, ts = s.titleSize ?? 56;
  const titleLines = (s.title ?? '').split('\n').filter(Boolean);
  const rows = s.rows ?? [];
  const h = pad + (s.kicker ? 28 : 0) + (s.sub ? 26 : 0) + (titleLines.length ? 16 + titleLines.length * ts * 0.98 + 18 : 0) +
    (rows.length ? (s.rowsHeader ? 36 : 12) + rows.length * 34 + 12 : 0) + (s.foot ? 86 : 0) + pad * 0.6;
  c.save();
  c.globalAlpha *= alpha * clamp(k * 1.6);
  c.translate(s.x + s.w / 2, s.y + h / 2 + (1 - k) * 40);
  c.rotate((s.rot ?? -0.02) + (1 - k) * 0.06);
  c.translate(-s.w / 2, -h / 2);
  // shadow + paper
  c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 26; c.shadowOffsetY = 12;
  c.fillStyle = C.paper; c.fillRect(0, 0, s.w, h);
  c.shadowColor = 'transparent';
  // paper fibre
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(0,0,0,${0.02 + hash(i, 3) * 0.03})`; c.fillRect(hash(i, 1) * s.w, hash(i, 2) * h, 1 + hash(i, 4) * 18, 1); }
  let y = pad;
  if (s.kicker) { text(c, s.kicker.toUpperCase(), pad, y + 12, FONT.mono(600), 15, INK(0.85), { track: 2.4 }); y += 28; }
  if (s.sub) { text(c, s.sub.toUpperCase(), pad, y + 10, FONT.mono(400), 12, INK(0.6), { track: 2 }); y += 26; }
  if (s.mark) spark(c, s.w - pad - 12, pad + 6, 12, CORAL());
  if (titleLines.length) {
    hair(c, pad, y + 4, s.w - pad, y + 4, CORAL(0.9), 3);
    y += 16;
    titleLines.forEach((ln) => { y += ts * 0.98; text(c, ln, pad, y, FONT.grot(900), ts, INK(0.96), { track: -ts * 0.02 }); });
    y += 18;
    hair(c, pad, y, s.w - pad, y, INK(0.7), 1.5);
  }
  if (rows.length) {
    y += s.rowsHeader ? 36 : 12;
    if (s.rowsHeader) text(c, s.rowsHeader.toUpperCase(), pad, y - 12, FONT.mono(400), 12, INK(0.55), { track: 2 });
    rows.forEach((r, i) => {
      const ri = clamp((t - t0 - 0.25 - i * 0.12) / 0.25);
      if (ri <= 0) return;
      c.save(); c.globalAlpha *= ri;
      const ry = y + i * 34 + 22, col = r.hot ? CORAL() : INK(0.9);
      if (r.dot !== false) { c.fillStyle = col; c.beginPath(); c.arc(pad + 4, ry - 6, 3.5, 0, Math.PI * 2); c.fill(); }
      const kw = text(c, r.k.toUpperCase(), pad + 18, ry, FONT.mono(600), 17, col, { track: 1.5 });
      const vw = measure(r.v.toUpperCase(), FONT.mono(600), 17, 1.5);
      dotLeader(c, pad + 26 + kw, s.w - pad - vw - 10, ry - 4, INK(0.35));
      text(c, r.v.toUpperCase(), s.w - pad, ry, FONT.mono(600), 17, col, { align: 'right', track: 1.5 });
      c.restore();
    });
    y += rows.length * 34 + 12;
    hair(c, pad, y, s.w - pad, y, INK(0.7), 1.5);
  }
  if (s.foot) {
    barcode(c, pad, y + 18, Math.min(220, s.w * 0.45), 42, Math.floor(s.x + s.y));
    text(c, s.foot.toUpperCase(), pad, y + 78, FONT.mono(400), 12, INK(0.7), { track: 1.5 });
    if (s.footRight) text(c, s.footRight.toUpperCase(), s.w - pad, y + 78, FONT.mono(400), 12, INK(0.7), { align: 'right', track: 1.5 });
  }
  c.restore();
  return { x: s.x, y: s.y, w: s.w, h };
}

/** The coral 8-point spark mark. */
export function spark(c: CanvasRenderingContext2D, x: number, y: number, r: number, col = CORAL()) {
  c.save(); c.strokeStyle = col; c.lineWidth = Math.max(1.5, r * 0.22); c.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); }
  c.restore();
}

// ---------------------------------------------------------------- the dark panel (terminal / file list / dashboard)
export interface PanelSpec { x: number; y: number; w: number; title: string; titleRight?: string; lines: { s: string; right?: string; hot?: boolean; dim?: boolean }[]; lineH?: number; size?: number }
export function panel(c: CanvasRenderingContext2D, p: PanelSpec, t: number, t0: number, alpha = 1, o: { cps?: number; lineGap?: number } = {}): Box {
  const k = appear(t, t0, 0.3);
  const lh = p.lineH ?? 34, size = p.size ?? 16;
  const h = 46 + p.lines.length * lh + 16;
  if (k <= 0 || alpha <= 0) return { x: p.x, y: p.y, w: p.w, h };
  c.save();
  c.globalAlpha *= alpha * k;
  const hh = h * ease.outExpo(k);
  c.fillStyle = 'rgba(10,11,14,0.9)'; c.fillRect(p.x, p.y, p.w, hh);
  c.strokeStyle = WHITE(0.22); c.lineWidth = 1; c.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, hh - 1);
  c.beginPath(); c.rect(p.x, p.y, p.w, hh); c.clip();
  text(c, p.title.toUpperCase(), p.x + 16, p.y + 29, FONT.mono(600), 14, WHITE(0.9), { track: 1.8 });
  if (p.titleRight) text(c, p.titleRight.toUpperCase(), p.x + p.w - 16, p.y + 29, FONT.mono(400), 13, WHITE(0.5), { align: 'right', track: 1.5 });
  hair(c, p.x, p.y + 44, p.x + p.w, p.y + 44, WHITE(0.18));
  p.lines.forEach((ln, i) => {
    const li = clamp((t - t0 - 0.2 - i * (o.lineGap ?? 0.1)) / 0.12);
    if (li <= 0) return;
    const y = p.y + 46 + i * lh + lh * 0.68;
    if (ln.hot) { c.fillStyle = CORAL(0.28 * li); c.fillRect(p.x + 1, p.y + 46 + i * lh + 3, p.w - 2, lh - 6); }
    const col = ln.hot ? rgbaHex(C.coralHot, 1) : ln.dim ? WHITE(0.4) : WHITE(0.88);
    const chars = o.cps ? Math.floor(clamp((t - t0 - 0.2 - i * (o.lineGap ?? 0.1)) * o.cps, 0, ln.s.length)) : ln.s.length;
    text(c, ln.s.toUpperCase().slice(0, chars), p.x + 18, y, FONT.mono(400), size, col, { track: 1.2, alpha: li });
    if (ln.right) text(c, ln.right.toUpperCase(), p.x + p.w - 18, y, FONT.mono(400), size, col, { align: 'right', track: 1.2, alpha: li });
  });
  c.restore();
  return { x: p.x, y: p.y, w: p.w, h };
}

// ---------------------------------------------------------------- figure panel (axes + caption), for charts and diagrams
export function figure(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, caption: string, t: number, t0: number,
  draw: (c: CanvasRenderingContext2D, plot: Box, k: number) => void, alpha = 1) {
  const k = appear(t, t0, 0.4);
  if (k <= 0 || alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha;
  label(c, caption, x, y, WHITE(0.75), 13);
  const plot = { x: x, y: y + 22, w, h: h - 22 };
  hair(c, plot.x, plot.y + plot.h, plot.x + plot.w * ease.outCubic(k), plot.y + plot.h, WHITE(0.7));
  hair(c, plot.x, plot.y + plot.h, plot.x, plot.y + plot.h - plot.h * ease.outCubic(k), WHITE(0.7));
  draw(c, plot, k);
  c.restore();
}

// ---------------------------------------------------------------- computer-vision boxes
/** Corner-bracket box with a label tab ("AGENT 0.97"); coral variant for the accented subject. */
/** Width of a cvBox label tab for `s` (already including the score text). */
export const tabWidth = (s: string) => measure(s.toUpperCase(), FONT.mono(600), 13, 1) + 12;
/** Corner-bracket CV box. `tab`: where the label tab sits ('top' default, 'bottom' = inside the box's lower edge, so a
 *  box whose top runs under the lyric block keeps its label clear). Returns the drawn box and tab rects (or null). */
export function cvBox(c: CanvasRenderingContext2D, b: Box, labelText: string, t: number, t0: number, o: { hot?: boolean; score?: number; cross?: boolean; alpha?: number; jitter?: number; tab?: 'top' | 'bottom'; ink?: boolean } = {}): { box: Box; tab: Box } | null {
  const k = appear(t, t0, 0.22);
  if (k <= 0) return null;
  const col = o.hot ? CORAL() : o.ink ? INK(0.9) : WHITE(0.92);
  const j = (o.jitter ?? 1) * 1.2;
  const x = b.x + (hash(fi(t), 1) - 0.5) * j, y = b.y + (hash(fi(t), 2) - 0.5) * j;
  const w = b.w * lerp(1.25, 1, ease.outExpo(k)), h = b.h * lerp(1.25, 1, ease.outExpo(k));
  const cx = x + b.w / 2, cy = y + b.h / 2, x0 = cx - w / 2, y0 = cy - h / 2;
  const l = Math.min(w, h) * 0.16;
  c.save();
  c.globalAlpha *= (o.alpha ?? 1) * clamp(k * 2);
  c.strokeStyle = col; c.lineWidth = 1.6;
  c.beginPath();
  for (const [px, py, sx, sy] of [[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]] as const) {
    c.moveTo(px + sx * l, py); c.lineTo(px, py); c.lineTo(px, py + sy * l);
  }
  c.stroke();
  // thin full outline at low alpha
  c.strokeStyle = o.hot ? CORAL(0.35) : o.ink ? INK(0.25) : WHITE(0.22); c.lineWidth = 1; c.strokeRect(x0, y0, w, h);
  if (o.cross) { hair(c, cx - 9, cy, cx + 9, cy, col, 1.2); hair(c, cx, cy - 9, cx, cy + 9, col, 1.2); }
  const sc = o.score != null ? ` ${o.score.toFixed(2)}` : '';
  const s = (labelText + sc).toUpperCase();
  c.font = font(FONT.mono(600), 13);
  const tw = tabWidth(s);
  const ty = o.tab === 'bottom' ? y0 + h - 21 : y0 - 21;
  c.fillStyle = o.hot ? CORAL() : o.ink ? INK(0.95) : WHITE(0.95);
  c.fillRect(x0, ty, tw, 19);
  text(c, s, x0 + 6, ty + 14, FONT.mono(600), 13, o.hot || o.ink ? WHITE() : INK(), { track: 1 });
  c.restore();
  return { box: { x: x0, y: y0, w, h }, tab: { x: x0, y: ty, w: tw, h: 19 } };
}
/** Thin connector from a point to a point, drawn on, with end dots. */
export function connector(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, t: number, t0: number, hot = false, o: { ink?: boolean } = {}) {
  const k = ease.outCubic(clamp((t - t0) / 0.35));
  if (k <= 0) return;
  const col = hot ? CORAL(0.8) : o.ink ? INK(0.6) : WHITE(0.55);
  hair(c, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), col, 1);
  c.save(); c.strokeStyle = col; c.fillStyle = o.ink ? 'rgba(244,242,238,0.8)' : 'rgba(0,0,0,0.6)';
  c.beginPath(); c.arc(x0, y0, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
  if (k >= 1) { c.beginPath(); c.arc(x1, y1, 3.5, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.restore();
}

// ---------------------------------------------------------------- garment / care label
/** A white woven care label with stitched edge and laundry symbols. lines appear one by one from t0. */
export function careLabel(c: CanvasRenderingContext2D, x: number, y: number, w: number, lines: string[], t: number, t0: number, o: { rot?: number; hotLine?: number } = {}) {
  const k = appear(t, t0, 0.45);
  if (k <= 0) return;
  const h = 60 + lines.length * 40 + 70;
  c.save();
  c.translate(x + w / 2, y + h / 2 + (1 - k) * 30); c.rotate(o.rot ?? 0.03); c.translate(-w / 2, -h / 2);
  c.globalAlpha *= clamp(k * 1.5);
  c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
  c.fillStyle = '#F7F5F0'; c.fillRect(0, 0, w, h);
  c.shadowColor = 'transparent';
  // woven texture
  for (let yy = 0; yy < h; yy += 3) { c.fillStyle = `rgba(0,0,0,${0.025 + 0.02 * (yy % 6 === 0 ? 1 : 0)})`; c.fillRect(0, yy, w, 1); }
  c.setLineDash([6, 5]); c.strokeStyle = INK(0.35); c.lineWidth = 1.2; c.strokeRect(10, 10, w - 20, h - 20); c.setLineDash([]);
  lines.forEach((s, i) => {
    const li = clamp((t - t0 - 0.3 - i * 0.45) / 0.2);
    if (li <= 0) return;
    text(c, s.toUpperCase(), w / 2, 62 + i * 40, FONT.mono(600), 20, i === o.hotLine ? CORAL() : INK(0.9), { align: 'center', track: 3, alpha: li });
  });
  // laundry symbols: tub, triangle, iron (crossed), circle
  const sy = h - 44, cx0 = w / 2 - 105;
  c.strokeStyle = INK(0.85); c.lineWidth = 2;
  c.beginPath(); c.moveTo(cx0 - 20, sy - 12); c.lineTo(cx0 - 14, sy + 12); c.lineTo(cx0 + 14, sy + 12); c.lineTo(cx0 + 20, sy - 12); c.stroke();
  text(c, '30', cx0, sy + 7, FONT.mono(600), 13, INK(0.85), { align: 'center' });
  c.beginPath(); c.moveTo(cx0 + 70 - 18, sy + 12); c.lineTo(cx0 + 70, sy - 14); c.lineTo(cx0 + 70 + 18, sy + 12); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(cx0 + 140 - 18, sy + 12); c.lineTo(cx0 + 140 + 18, sy + 12); c.lineTo(cx0 + 140 + 14, sy - 8); c.lineTo(cx0 + 140 - 8, sy - 8); c.closePath(); c.stroke();
  hair(c, cx0 + 140 - 18, sy - 14, cx0 + 140 + 18, sy + 16, INK(0.85), 2); hair(c, cx0 + 140 + 18, sy - 14, cx0 + 140 - 18, sy + 16, INK(0.85), 2);
  c.beginPath(); c.arc(cx0 + 210, sy, 14, 0, Math.PI * 2); c.stroke();
  c.restore();
}
export { hash };
