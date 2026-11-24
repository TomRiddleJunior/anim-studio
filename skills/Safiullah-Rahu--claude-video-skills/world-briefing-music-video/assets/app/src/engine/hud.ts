// Global overlay drawn over every scene (under post): the crop-mark frame (off by default; a video
// can use it at its bookends, see PostParams.frame) and optional plate captions from timeline entries.
// Anything else that looks like a HUD belongs inside the scenes, in their own idiom.
import { Layer2D, W, H } from './gl';
import { rgba } from './palette';
import { F, font } from './type';
import { clamp, ease, lerp, prog, smoothstep } from './util';

export interface Caption { start: number; end: number; fig: string; text: string }

export interface HudState {
  /** Overall opacity (post.hud). */
  opacity: number;
  /** 0..1 the crop-mark frame: 1 in place, 0 flown out past the edges. */
  frame: number;
  /** 0..1: the plate is light — draw in the dark colour. */
  paper: number;
}

export class Hud {
  layer = new Layer2D();
  private light = false;
  constructor(public captions: Caption[]) {}

  draw(t: number, st: HudState) {
    const L = this.layer;
    L.clear();
    const c = L.ctx;
    if (st.opacity <= 0.001) return L.upload();
    c.globalAlpha = st.opacity;
    this.light = st.paper > 0.5;
    if (st.frame > 0.001) this.cropMarks(c, st.frame);
    this.caption(c, t);
    return L.upload();
  }

  /** Ink colour for the current plate: fg on dark plates, bg on paper plates (roles swap with polarity). */
  private ink(a: number) { return this.light ? rgba('bg', a) : rgba('fg', a); }

  /** Corner marks; as `k` drops they fly out along the diagonals and past the edges. */
  private cropMarks(c: CanvasRenderingContext2D, k: number) {
    const e = ease.inOutCubic(clamp(k));
    c.save();
    c.globalAlpha *= clamp(k * 3);
    c.strokeStyle = this.ink(0.4);
    c.lineWidth = 1.25;
    const m = lerp(-40, 36, e), l = 22;
    c.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const) {
      c.moveTo(x + sx * l, y + 0.5 * sy); c.lineTo(x, y + 0.5 * sy); c.lineTo(x, y + sy * l);
    }
    c.stroke();
    c.restore();
  }

  private caption(c: CanvasRenderingContext2D, t: number) {
    const cap = this.captions.find((k) => t >= k.start && t < k.end);
    if (!cap) return;
    const a = Math.min(smoothstep(cap.start, cap.start + 0.5, t), 1 - smoothstep(cap.end - 0.6, cap.end, t));
    if (a <= 0) return;
    c.save();
    c.globalAlpha *= a;
    const x = W - 64, y = H - 66;
    c.textBaseline = 'alphabetic';
    c.font = font(F.text(400, true), 26);
    c.fillStyle = this.ink(0.85);
    // reveal letters left-to-right quickly
    const n = Math.floor(cap.text.length * prog(t, cap.start, cap.start + 0.8));
    const full = c.measureText(cap.text).width;
    c.fillText(cap.text.slice(0, n), x - full, y);
    c.font = font(F.mono(500), 13);
    c.letterSpacing = '3px';
    c.fillStyle = rgba('accent', 1);
    c.fillText(cap.fig, x - full, y - 34);
    c.restore();
  }
}
