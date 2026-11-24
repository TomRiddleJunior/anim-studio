// Shared kit for the starter scenes: plate polarity (ground/ink roles), a background field pass,
// mono annotations, time/bar formatting and the running motif (a point of light dragging a line).
// Everything reads the palette/fonts from style.json, so the same scenes restyle with the project.
import * as THREE from 'three';
import { FSPass } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { DARK, LIN, rgba, type PaletteKey } from '../engine/palette';
import { F, font } from '../engine/type';
import { hash, TAU, frameIdx } from '../engine/util';

type RGB = [number, number, number];

/**
 * Colour roles of one plate. By default the style's own polarity (ground = bg, ink = fg); `invert`
 * swaps them (a paper plate inside a dark video, or a dark plate inside a paper video). The accent
 * stays the accent on both.
 */
export function plate(invert = false) {
  const ground: PaletteKey = invert ? 'fg' : 'bg';
  const ink: PaletteKey = invert ? 'bg' : 'fg';
  const light = invert ? DARK : !DARK; // is the ground light?
  return {
    ground, ink, light,
    groundLin: LIN[ground] as RGB,
    inkLin: LIN[ink] as RGB,
    /** Canvas colour of the ink at alpha a. */
    inkA: (a: number) => rgba(ink, a),
    groundA: (a: number) => rgba(ground, a),
    /** Unsung / secondary text: ink at reduced opacity (a bit more on light grounds, which read fainter). */
    faint: rgba(ink, light ? 0.3 : 0.24),
    /** Blend for glowing line work: additive on dark grounds, normal ink on light ones. */
    lineBlend: (light ? 'normal' : 'add') as 'normal' | 'add',
  };
}
export type Plate = ReturnType<typeof plate>;

/**
 * Background field: the ground colour with a subtle large-scale mottle (film/paper), optional engraved
 * hatch field (`hatchAmt`), optional hairline grid (`gridAmt`, spacing in px), and a kick-driven lift.
 */
export class Ground {
  pass = new FSPass(/* glsl */ `
    uniform float t, lift, hatchAmt, gridAmt, grid, seed;
    uniform vec3 ground, ink;
    void main() {
      vec2 p = FRAG_PX;
      float n = fbm(p / 850.0 + vec2(seed, t * 0.015), 3);
      vec3 col = ground * (1.0 + 0.045 * n) + (ink - ground) * 0.012 * lift;
      if (hatchAmt > 0.0) {
        float d = sat(0.5 + 0.9 * fbm(p / 520.0 + vec2(t * 0.02, seed), 3)) * hatchAmt;
        float h = hatch((rot2(0.62) * p).y / 6.0, d * 0.55);
        col = mix(col, ink, h * 0.11);
      }
      if (gridAmt > 0.0) {
        vec2 g = abs(fract(p / grid + 0.5) - 0.5) * grid;
        float l = max(pxLine(g.x, 0.35, 1.25), pxLine(g.y, 0.35, 1.25));
        col = mix(col, ink, l * gridAmt * 0.08);
      }
      fragColor = vec4(col, 1.0);
    }`, {
    t: { value: 0 }, lift: { value: 0 }, hatchAmt: { value: 0 }, gridAmt: { value: 0 }, grid: { value: 96 }, seed: { value: 0 },
    ground: { value: new THREE.Vector3() }, ink: { value: new THREE.Vector3() },
  });
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, P: Plate, o: { t: number; lift?: number; hatch?: number; grid?: number; gridPx?: number; seed?: number }) {
    const u = this.pass.u;
    u.t!.value = o.t; u.lift!.value = o.lift ?? 0; u.hatchAmt!.value = o.hatch ?? 0; u.gridAmt!.value = o.grid ?? 0;
    u.grid!.value = o.gridPx ?? 96; u.seed!.value = o.seed ?? 0;
    (u.ground!.value as THREE.Vector3).set(...P.groundLin);
    (u.ink!.value as THREE.Vector3).set(...P.inkLin);
    this.pass.render(renderer, out);
  }
}

/** A small mono label (UI voice), letter-spaced, at (x, baseline y). Returns its width. */
export function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, size = 13, o: { align?: CanvasTextAlign; weight?: number; spacing?: number } = {}) {
  c.save();
  c.font = font(F.mono(o.weight ?? 500), size);
  c.letterSpacing = `${o.spacing ?? size * 0.22}px`;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = col;
  c.fillText(s, x, y);
  const w = c.measureText(s).width;
  c.restore();
  return w;
}

/** mm:ss.cc */
export const timecode = (t: number) => {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
};

/** A hairline (Canvas2D), crisp at any scale. */
export function hair(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, w = 1.25) {
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.restore();
}

/**
 * The motif head (a point of light / an ink dot) drawn into a 2D LineBatch: white-hot core and accent halo
 * on dark grounds; a solid accent dot with a thin ring on light ones. Flicker keyed to frameIdx (stable
 * within a frame's motion-blur shutter).
 */
export function motifHead(lb: LineBatch, P: Plate, x: number, y: number, t: number, scale = 1, intensity = 1) {
  const fl = 0.88 + 0.12 * hash(frameIdx(t), 7);
  const I = intensity * fl;
  const a = LIN.accent, h = LIN.hot;
  if (!P.light) {
    lb.seg2(x, y, x + 0.01, y, 26 * scale, [a[0] * 0.5 * I, a[1] * 0.5 * I, a[2] * 0.5 * I], 0.35);
    lb.seg2(x, y, x + 0.01, y, 12 * scale, [h[0] * 2.5 * I, h[1] * 2.5 * I, h[2] * 2.5 * I], 0.8);
    lb.seg2(x, y, x + 0.01, y, 5 * scale, [6 * I, 5 * I, 4 * I], 1);
    for (let i = 0; i < 4; i++) {
      const ang = i * (TAU / 4) + t * 3 + 0.4;
      const r = (9 + 5 * hash(frameIdx(t), i)) * scale;
      lb.seg2(x, y, x + Math.cos(ang) * r, y + Math.sin(ang) * r, 1.2 * scale, [a[0] * 3 * I, a[1] * 3 * I, a[2] * 3 * I], 0.8);
    }
  } else {
    lb.seg2(x, y, x + 0.01, y, 11 * scale, a, 1);
    lb.seg2(x, y, x + 0.01, y, 3 * scale, LIN.deep, 1);
  }
}

/** Sputtering sparks behind a moving head `headAt(tb)` (deterministic: births on a fixed clock, hashed velocities). */
export function motifSparks(lb: LineBatch, P: Plate, t: number, headAt: (t: number) => { x: number; y: number } | null, o: { rate?: number; life?: number; speed?: number; gravity?: number; intensity?: number; seed?: number } = {}) {
  const life = o.life ?? 0.45, speed = o.speed ?? 240, g = o.gravity ?? 480, I = o.intensity ?? 1, seed = o.seed ?? 1, rate = o.rate ?? 80;
  const n0 = Math.floor((t - life) * rate), n1 = Math.floor(t * rate);
  for (let n = n0; n <= n1; n++) {
    const tb = n / rate;
    if (tb > t) continue;
    const age = t - tb, h = headAt(tb);
    if (!h) continue;
    const ang = hash(n, seed) * TAU, sp = speed * (0.25 + hash(n, seed + 1) ** 2 * 1.2);
    const lf = life * (0.35 + 0.65 * hash(n, seed + 2));
    if (age > lf) continue;
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - speed * 0.3;
    const pos = (a: number) => [h.x + vx * a, h.y + vy * a + 0.5 * g * a * a] as const;
    const [x, y] = pos(age), [x0, y0] = pos(Math.max(0, age - 0.018));
    const k = 1 - age / lf;
    const c = P.light ? LIN.accent : ([LIN.accent[0] * (1 + 2 * k * k) * I, LIN.accent[1] * (1 + 1.4 * k * k) * I, LIN.accent[2] * (1 + k * k) * I] as RGB);
    lb.seg2(x0, y0, x, y, 1.5 * (0.5 + k * 0.7), c, Math.min(1, k * 1.4));
  }
}
