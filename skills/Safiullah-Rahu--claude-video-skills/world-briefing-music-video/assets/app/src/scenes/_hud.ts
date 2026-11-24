// Chrome kit for footage-based videos (Canvas2D, deterministic): split-flap board, computer-vision boxes,
// garment tags / spec labels with barcodes, a look counter and a generic info card. Colours come from the
// palette through the plate roles; everything is a pure function of t (flicker keyed to frameIdx).
import { rgba } from '../engine/palette';
import { F, font } from '../engine/type';
import { clamp, ease, hash, frameIdx } from '../engine/util';
import type { Plate } from './_kit';

const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Split-flap board: one cell per character. When the text changes at tChange, each cell flips through
 * random glyphs (staggered left to right) before settling on its new character.
 */
export function splitFlap(c: CanvasRenderingContext2D, x: number, y: number, text: string, t: number, tChange: number, o: { cellW?: number; cellH?: number; gap?: number; ink?: string; cell?: string; accent?: string; stagger?: number; spin?: number } = {}) {
  const cw = o.cellW ?? 30, ch = o.cellH ?? 44, gap = o.gap ?? 4, stag = o.stagger ?? 0.018, spin = o.spin ?? 0.26;
  const chars = Array.from(text.toUpperCase());
  c.save();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = font(F.mono(600), ch * 0.62);
  chars.forEach((chr, i) => {
    const cx = x + i * (cw + gap);
    c.fillStyle = o.cell ?? 'rgba(18,18,20,0.92)';
    c.fillRect(cx, y, cw, ch);
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(cx, y + ch / 2 - 0.5, cw, 1);
    const k = (t - tChange - i * stag) / spin;
    let g = chr;
    if (k >= 0 && k < 1 && chr !== ' ') g = FLAP[Math.floor(hash(i, frameIdx(t), 3) * FLAP.length)]!;
    if (g !== ' ') {
      c.fillStyle = k >= 0 && k < 1 ? (o.accent ?? rgba('accent')) : (o.ink ?? 'rgba(240,238,232,0.95)');
      c.fillText(g, cx + cw / 2, y + ch / 2 + 1);
    }
  });
  c.restore();
  return chars.length * (cw + gap) - gap;
}

/** Computer-vision box: corner brackets, a label tab with a confidence, optional crosshair. */
export function cvBox(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, score: number, col: string, o: { t?: number; cross?: boolean; lw?: number } = {}) {
  const l = Math.min(w, h) * 0.18, lw = o.lw ?? 1.6;
  c.save();
  c.strokeStyle = col; c.lineWidth = lw;
  c.beginPath();
  for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const) {
    c.moveTo(px + sx * l, py); c.lineTo(px, py); c.lineTo(px, py + sy * l);
  }
  c.stroke();
  if (o.cross) {
    const mx = x + w / 2, my = y + h / 2;
    c.beginPath(); c.moveTo(mx - 8, my); c.lineTo(mx + 8, my); c.moveTo(mx, my - 8); c.lineTo(mx, my + 8); c.stroke();
  }
  const s = `${label} ${score.toFixed(2)}`;
  c.font = font(F.mono(500), 12);
  const tw = c.measureText(s).width + 10;
  c.fillStyle = col;
  c.fillRect(x, y - 18, tw, 16);
  c.fillStyle = 'rgba(0,0,0,0.9)';
  c.textBaseline = 'middle';
  c.fillText(s, x + 5, y - 10);
  c.restore();
}

/** A barcode of seeded bar widths. */
export function barcode(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, col = 'rgba(10,10,10,0.95)') {
  c.save();
  c.fillStyle = col;
  let px = x;
  for (let i = 0; px < x + w; i++) {
    const bw = 1 + Math.floor(hash(seed, i) * 3.2);
    if (i % 2 === 0) c.fillRect(px, y, bw, h);
    px += bw + (hash(seed, i, 7) < 0.3 ? 2 : 1);
  }
  c.restore();
}

/** Garment tag / spec label: a card with mono lines, an accent key line, a barcode and a grommet. */
export function tag(c: CanvasRenderingContext2D, x: number, y: number, lines: string[], o: { w?: number; accentLine?: number; paper?: string; ink?: string; seed?: number; appear?: number } = {}) {
  const w = o.w ?? 230, lh = 17, pad = 12, h = pad * 2 + lines.length * lh + 34;
  const a = clamp(o.appear ?? 1);
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y + (1 - ease.outExpo(a)) * 18);
  c.fillStyle = o.paper ?? 'rgba(244,242,236,0.97)';
  c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.arc(w - 16, 16, 5, 0, Math.PI * 2); c.fill();
  c.font = font(F.mono(500), 12);
  c.textBaseline = 'alphabetic';
  lines.forEach((s, i) => {
    c.fillStyle = i === (o.accentLine ?? 0) ? rgba('accent') : (o.ink ?? 'rgba(12,12,12,0.92)');
    c.fillText(s, pad, pad + (i + 1) * lh - 4);
  });
  barcode(c, pad, h - 30, w - pad * 2 - 40, 20, o.seed ?? 1);
  c.restore();
  return { w, h };
}

/** "LOOK 05 / 11"-style counter: label + big digits. */
export function counter(c: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, P: Plate, size = 40) {
  c.save();
  c.textBaseline = 'alphabetic';
  c.font = font(F.mono(500), 12); c.letterSpacing = '3px';
  c.fillStyle = P.inkA(0.6); c.fillText(label, x, y - size * 0.9);
  c.letterSpacing = '0px';
  c.font = font(F.display(100, 700), size);
  c.fillStyle = P.inkA(0.95); c.fillText(value, x, y);
  c.restore();
}

/** A generic info card (invented UI, never an imitation of a real product): title bar, key/value rows. */
export function infoCard(c: CanvasRenderingContext2D, x: number, y: number, w: number, title: string, rows: [string, string][], o: { appear?: number; accentRow?: number; dark?: boolean } = {}) {
  const a = clamp(o.appear ?? 1), rh = 22, h = 34 + rows.length * rh + 10;
  const bg = o.dark === false ? 'rgba(246,245,241,0.96)' : 'rgba(16,16,18,0.9)', fg = o.dark === false ? 'rgba(15,15,15,0.92)' : 'rgba(236,234,228,0.92)';
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y + (1 - ease.outExpo(a)) * 14);
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.fillStyle = fg; c.globalAlpha *= 0.14; c.fillRect(0, 26, w, 1); c.globalAlpha /= 0.14;
  c.font = font(F.mono(600), 12); c.fillStyle = fg; c.textBaseline = 'middle';
  c.fillText(title, 10, 14);
  c.font = font(F.mono(400), 12);
  rows.forEach(([k, v], i) => {
    const yy = 34 + i * rh + rh / 2;
    c.fillStyle = fg; c.globalAlpha *= 0.6; c.fillText(k, 10, yy); c.globalAlpha /= 0.6;
    c.fillStyle = i === o.accentRow ? rgba('accent') : fg;
    c.textAlign = 'right'; c.fillText(v, w - 10, yy); c.textAlign = 'left';
  });
  c.restore();
  return { w, h };
}
