// The broadcast chrome that frames every shot of THE STATE OF AI · OCT 2026 (from the ESCAPE VELOCITY engine): corner crosshairs, the STORY counter,
// the show title with a live spectrum meter, the split-flap headline board (one two-row phrase per story), the left bar ruler with a coral playhead, the scrolling news ticker and the timecode. `ink` flips the
// chrome to dark ink for the white chapters.
import { clamp, ease, hash } from '../engine/util';
import { FONT, W, H, fi, WHITE, CORAL, INK, rgbaHex, C, text, label, hair, cross } from './kit';
import { drawBoard, type Board } from './flaps';

export interface ChromeState {
  t: number;
  look: number;             // story 0..16
  looks?: number;           // 16
  counter?: string;         // counter label (STORY nn / 16, CHORUS, …); overrides the number
  countdown: [number, string[]][]; // flap board history (rows: [big digits, 'MONTHS', 'TO GO'] or full phrases)
  bar: number;              // continuous bar index
  levels: number[];         // ~40 spectrum values 0..1
  ticker: string[];
  tickerSpeed?: number;     // px/s
  ink?: number;             // 0 = white chrome on dark footage, 1 = ink chrome on white
  alpha?: number;
  title?: string;
  boardMode?: 'months' | 'phrase';
}

// ink chrome prints a little stronger (thin dark type on light plates reads fainter than white on dark)
const col = (ink: number, a = 1) => (ink > 0.5 ? INK(Math.min(1, a * 1.25 + 0.08)) : WHITE(a));

export function drawChrome(c: CanvasRenderingContext2D, s: ChromeState) {
  const ink = s.ink ?? 0, a = s.alpha ?? 1;
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  // corner crosshairs
  for (const [x, y] of [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]] as const) cross(c, x, y, 11, col(ink, 0.55), 1);
  // look counter
  label(c, s.counter ?? `STORY ${String(s.look).padStart(2, '0')} / ${String(s.looks ?? 16).padStart(2, '0')}`, 72, 66, col(ink, 0.92), 13);
  // title + spectrum
  label(c, s.title ?? 'THE STATE OF AI · OCT 2026', W - 96, 66, col(ink, 0.92), 13, { align: 'right' });
  const n = s.levels.length, x1 = W - 96, bw = 4.4, x0 = x1 - n * bw;
  s.levels.forEach((v, i) => {
    const h = 3 + 16 * clamp(v);
    c.fillStyle = i >= n - 3 ? CORAL(0.95) : col(ink, 0.7);
    c.fillRect(x0 + i * bw, 112 - h, bw - 1.6, h);
  });
  // countdown board
  drawCountdown(c, s, ink);
  // left ruler: a tick per beat, a label per bar, scrolling with the music; coral playhead at mid-height
  const yMid = 540, pxPerBar = 88;
  c.save();
  c.beginPath(); c.rect(18, 210, 60, 830); c.clip();
  for (let b = Math.floor(s.bar) - 7; b <= Math.floor(s.bar) + 8; b++) {
    const y = yMid + (b - s.bar) * pxPerBar;
    hair(c, 30, y, 44, y, col(ink, 0.6), 1);
    for (let q = 1; q < 4; q++) hair(c, 30, y + (q * pxPerBar) / 4, 36, y + (q * pxPerBar) / 4, col(ink, 0.32), 1);
    if (b >= 0) text(c, String(b).padStart(3, '0'), 48, y + 4, FONT.mono(400), 10, col(ink, 0.62));
  }
  c.restore();
  c.fillStyle = CORAL(); c.fillRect(26, yMid - 1, 22, 2);
  // ticker band
  const ty = H - 44;
  hair(c, 0, ty - 18, W, ty - 18, col(ink, 0.35), 1);
  hair(c, 0, ty + 10, W, ty + 10, col(ink, 0.35), 1);
  const item = s.ticker.map((x) => x.toUpperCase()).join('   ✱   ') + '   ✱   ';
  const fam = FONT.mono(400), size = 14;
  c.save();
  c.font = `${size}px "${fam}"`;
  (c as any).letterSpacing = '1.6px';
  const iw = c.measureText(item).width;
  const off = ((s.t * (s.tickerSpeed ?? 70)) % iw);
  c.fillStyle = col(ink, 0.82);
  c.textBaseline = 'alphabetic';
  for (let x = -off; x < W; x += iw) c.fillText(item, x, ty);
  c.restore();
  // timecode (mm:ss:ff)
  const mm = Math.floor(s.t / 60), ss = Math.floor(s.t % 60), ff = fi(s.t) % 24;
  label(c, `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, W - 96, H - 76, col(ink, 0.75), 13, { align: 'right' });
  c.restore();
}

function drawCountdown(c: CanvasRenderingContext2D, s: ChromeState, ink: number) {
  const x = W - 426, y = 136;
  const hist = s.countdown;
  if (!hist.length || s.t < hist[0]![0]) return;
  const cur = [...hist].reverse().find((h) => s.t >= h[0])!;
  const phrase = cur[1].length > 0 && (cur[1][0]!.length > 3 || s.boardMode === 'phrase');
  if (!phrase) {
    // big two-digit number + MONTHS / TO GO
    const big: Board = { x, y, cols: 2, rows: 1, cw: 32, ch: 48, gap: 4, states: hist.map(([tt, rows]) => [tt, [String(rows[0]).padStart(2, ' ')]]),
      tint: () => CORAL(), cell: 'rgb(12,13,16)' };
    drawBoard(c, big, s.t);
    const small: Board = { x: x + 80, y: y + 1, cols: 9, rows: 2, cw: 16, ch: 21, gap: 3,
      states: hist.map(([tt, rows]) => [tt, [rows[1] ?? 'MONTHS', rows[2] ?? 'TO GO']]), cell: 'rgb(12,13,16)' };
    drawBoard(c, small, s.t);
  } else {
    const rows = 2;
    const b: Board = { x: x - 40, y, cols: 14, rows, cw: 21, ch: 31, gap: 3, states: hist.map(([tt, r]) => [tt, r.slice(0, rows)]), cell: 'rgb(12,13,16)' };
    drawBoard(c, b, s.t);
  }
  hair(c, x, y + 62, x + 300, y + 62, col(ink, 0.5), 1);
  text(c, 'THE STATE OF AI', x, y + 76, FONT.mono(600), 9, col(ink, 0.8), { track: 1.6 });
  text(c, 'BRIEFING · OCT 2026 · SOURCED', x, y + 90, FONT.mono(400), 8, col(ink, 0.68), { track: 1.4 });
}

/**
 * Soft backings under the chrome over footage (EV's chrome bugs read on any plate): a top band, the bottom ticker band
 * and a pool behind the countdown block. Dark on dark chapters, paper on white ones. Draw it BELOW the graphics.
 */
export function chromeScrim(c: CanvasRenderingContext2D, ink: number, alpha: number) {
  if (alpha <= 0) return;
  const rgb = ink > 0.5 ? '244,242,238' : '4,5,7';
  const k = ink > 0.5 ? 0.62 : 0.5;
  c.save();
  c.globalAlpha *= alpha;
  let g = c.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, `rgba(${rgb},${k * 0.8})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, W, 150);
  g = c.createLinearGradient(0, H - 120, 0, H);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.55, `rgba(${rgb},${k * 0.85})`); g.addColorStop(1, `rgba(${rgb},${k})`);
  c.fillStyle = g; c.fillRect(0, H - 120, W, 120);
  c.translate(W - 270, 180); c.scale(1.9, 1);
  g = c.createRadialGradient(0, 0, 0, 0, 0, 150);
  g.addColorStop(0, `rgba(${rgb},${k})`); g.addColorStop(0.6, `rgba(${rgb},${k * 0.5})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(-150, -150, 300, 300);
  c.restore();
}

/** ~40 spectrum values from the audio envelopes at t (each bar jittered deterministically). */
export function levelsAt(env: (name: string, t: number) => number, t: number, n = 40) {
  const bands = ['low', 'bass', 'drums', 'mid', 'other', 'vocal', 'high'];
  return Array.from({ length: n }, (_, i) => {
    const b = bands[Math.min(bands.length - 1, Math.floor((i / n) * bands.length))]!;
    return clamp(env(b, t) * (0.55 + 0.45 * hash(i, fi(t) >> 1)) + 0.04 * Math.sin(i + t * 3));
  });
}
export { ease, rgbaHex, C };
