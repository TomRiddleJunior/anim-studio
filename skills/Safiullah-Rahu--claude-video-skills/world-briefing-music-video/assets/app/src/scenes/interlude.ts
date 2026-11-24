// INTERLUDE — instrumental passages: an audio-reactive instrument in the style's idiom, locked to the beat.
//   variant 'rings': concentric hairline rings breathing with the bass; every kick launches a ring from the
//                    centre; a hand sweeps once per bar with the motif at its tip; bar counter.
//   variant 'bars':  a row of hatched bars (a hand-engraved spectrum) driven by the band envelopes;
//                    snares strike the tallest bar in the accent.
//   variant 'flow':  streamlines of a slowly turning curl-noise field; density follows the loudness, kicks
//                    fire accent streaks.
// Any lyric line that starts inside the window (ad-libs, a spoken line) is sung small in the lower left.
// params: variant ('rings'|'bars'|'flow') · invert · label (section label, true)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba, styleCase, STYLE } from '../engine/palette';
import { F } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, fitWords, drawWord, lineVis, type Flow } from '../engine/karaoke';
import { clamp, ease, fbm2, hash, noise2, pulse, TAU } from '../engine/util';
import { Ground, plate, label, timecode, motifHead, type Plate } from './_kit';

type RGB = [number, number, number];

export default class Interlude extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  variant = 'rings';
  lines: Line[] = [];
  flows = new Map<number, Flow>();
  kicks: number[] = [];
  o = { variant: 'rings', label: true };

  override init() {
    const { params, lyrics, audio: au, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.interlude ?? {}, params);
    this.variant = this.o.variant;
    this.P = plate(!!params.invert);
    this.lb = new LineBatch(60000, { blend: this.P.lineBlend });
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    for (const l of this.lines) this.flows.set(l.i, fitWords(l.words, F.display(100, 700), 900, 160, { max: 54, maxRows: 2, text: (w) => styleCase(w.w) }));
    this.kicks = au.events('kick', start - 2, end).map(([t]) => t);
  }

  private col(key: string, k: number): RGB {
    const c = LIN[key]!;
    return this.P.light ? c : [c[0] * k, c[1] * k, c[2] * k];
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = this.P, a = f.a;
    this.ground.render(renderer, out, P, { t, lift: a.kick, hatch: this.variant === 'bars' ? 0.25 : 0, seed: 7.7 });
    const lb = this.lb; lb.clear();
    const ink = this.col(P.ink, 1), acc = this.col('accent', 2.2);
    const cx = W / 2, cy = H / 2;

    if (this.variant === 'rings') {
      const n = 26;
      for (let i = 1; i <= n; i++) {
        const r0 = 22 * i + 8 * Math.sin(i * 0.7 + t * 0.6) * a.bass + 30 * a.low * Math.exp(-i / 9);
        const segs = 120;
        const alpha = 0.16 + 0.5 * Math.exp(-i / 6) * (0.4 + a.rms);
        for (let s = 0; s < segs; s++) {
          const a0 = (s / segs) * TAU, a1 = ((s + 1) / segs) * TAU;
          const wob = (q: number) => r0 * (1 + 0.012 * noise2(Math.cos(q) * 2 + i, Math.sin(q) * 2 + t * 0.4, 3));
          lb.seg2(cx + Math.cos(a0) * wob(a0), cy + Math.sin(a0) * wob(a0), cx + Math.cos(a1) * wob(a1), cy + Math.sin(a1) * wob(a1), 1.1, ink, alpha);
        }
      }
      // shockwave rings from kicks (pure function of the kick times)
      for (const k of this.kicks) {
        const age = t - k;
        if (age < 0 || age > 1.6) continue;
        const r = 30 + ease.outCubic(age / 1.6) * 900, fade = 1 - age / 1.6;
        for (let s = 0; s < 160; s++) {
          const a0 = (s / 160) * TAU, a1 = ((s + 1) / 160) * TAU;
          lb.seg2(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 1.6 * fade + 0.4, acc, 0.9 * fade * fade);
        }
      }
      // the bar hand with the motif at its tip
      const ang = f.barPhase * TAU - Math.PI / 2;
      const R = 22 * n + 10;
      lb.seg2(cx, cy, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 1.25, this.col('accent', 1.6), 0.85);
      motifHead(lb, P, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, t, 0.8 + 0.4 * a.kick);
    } else if (this.variant === 'bars') {
      const N = 48, x0 = SAFE, x1 = W - SAFE, base = H - SAFE - 90, top = SAFE + 90;
      const bw = (x1 - x0) / N;
      const bands = ['low', 'bass', 'drums', 'mid', 'other', 'vocal', 'high'] as const;
      let tallest = 0, tallestH = 0;
      const hs: number[] = [];
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const bi = Math.min(bands.length - 1, Math.floor(u * bands.length));
        const e = (a as any)[bands[bi]!] as number;
        const h = (base - top) * clamp(0.04 + 0.85 * e * (0.55 + 0.45 * (0.5 + 0.5 * fbm2(i * 0.37, t * 1.7, 3, 11))));
        hs.push(h);
        if (h > tallestH) { tallestH = h; tallest = i; }
      }
      const snare = a.snare;
      for (let i = 0; i < N; i++) {
        const x = x0 + i * bw + bw * 0.5, h = hs[i]!;
        const hot = i === tallest && snare > 0.2;
        // hatched bar: horizontal hatch lines, denser toward the base
        for (let y = base; y > base - h; y -= 5) {
          const d = (base - y) / Math.max(1, h);
          lb.seg2(x - bw * 0.36, y, x + bw * 0.36, y, 1.1 + (1 - d) * 0.8, hot ? acc : ink, hot ? 0.95 : 0.35 + 0.45 * (1 - d));
        }
        lb.seg2(x - bw * 0.42, base - h, x + bw * 0.42, base - h, 2, hot ? acc : ink, 0.9);
      }
      lb.seg2(x0, base + 8, x1, base + 8, 1.25, ink, 0.4);
    } else {
      // flow: streamlines through a turning curl-noise field, integrated from seeded points (pure function of t)
      const n = Math.round(260 + 900 * a.rms);
      const steps = 26, h = 9;
      for (let i = 0; i < n; i++) {
        let x = hash(i, 1) * W, y = hash(i, 2) * H;
        const hot = hash(i, 3) < 0.05 * (0.3 + a.kick * 3);
        for (let s = 0; s < steps; s++) {
          const fx = fbm2(x * 0.0016 + 3.1, y * 0.0016 + t * 0.05, 3, 5), fy = fbm2(x * 0.0016 - 7.7, y * 0.0016 - t * 0.05, 3, 6);
          const ang = Math.atan2(fy, fx) * 2 + t * 0.1;
          const nx = x + Math.cos(ang) * h, ny = y + Math.sin(ang) * h;
          const fade = Math.sin((s / (steps - 1)) * Math.PI);
          lb.seg2(x, y, nx, ny, hot ? 1.6 : 1.0, hot ? acc : ink, (hot ? 0.9 : 0.28) * fade);
          x = nx; y = ny;
        }
      }
    }
    lb.render(renderer, out);

    // ---- labels and any sung lines
    const L = this.L; L.clear();
    const c = L.ctx;
    if (this.o.label) {
      const sec = au.section(t)?.name ?? '';
      label(c, `${sec.toUpperCase()}  ·  INSTRUMENTAL`, SAFE, SAFE, P.inkA(0.5));
      label(c, `BAR ${String(Math.max(0, Math.floor(f.bar)) + 1).padStart(3, '0')}   ${timecode(t)}`, W - SAFE, SAFE, P.inkA(0.5), 13, { align: 'right' });
    }
    for (const l of this.lines) {
      const v = lineVis(l, t, 0.5, 0.6);
      if (v <= 0) continue;
      const fl = this.flows.get(l.i)!;
      c.save(); c.globalAlpha = v;
      fl.boxes.forEach((b) => drawWord(c, b.text, fl.family, fl.size, SAFE + b.x, H - SAFE - fl.height + fl.size * 0.8 + b.y, Lyrics.wordProgress(b.word, t), rgba('accent'), P.faint, 'glyph', 0, b.word));
      c.restore();
    }
    comp.draw(renderer, L.upload(), out);
    const db = au.timeOfBar(Math.floor(f.bar + 1e-4));
    return { zoom: 1 + 0.008 * pulse(t, db, 0.12), paper: P.light ? 1 : 0 };
  }
}
