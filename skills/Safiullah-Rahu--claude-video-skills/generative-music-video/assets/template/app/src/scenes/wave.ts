// WAVE — an instrument trace (oscilloscope on dark styles, pen plotter on graph paper for paper styles)
// driven by the song's envelopes, with phosphor persistence (echoes of earlier traces, a pure function of t).
// The beam sweeps once per bar with the motif at its head. The featured line rides ON the wave: glyphs
// follow the trace's slow fundamental, each word written in as it is sung (the current word in the accent).
// params: invert · size (text px, 84) · echoes (7) · grid (true)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba, styleCase, STYLE } from '../engine/palette';
import { F, font, layout, type TextLayout } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, activeWord, featuredLine, markWord } from '../engine/karaoke';
import { clamp, ease, polylineLengths, pointAtLength, pulse } from '../engine/util';
import { Ground, plate, label, timecode, motifHead, type Plate } from './_kit';

type RGB = [number, number, number];

export default class Wave extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  lines: Line[] = [];
  lays = new Map<number, { lay: TextLayout; wordOf: number[] }>();
  fam = '';
  o = { size: 84, echoes: 7, grid: true };

  override init() {
    const { params, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.wave ?? {}, params);
    this.P = plate(!!params.invert);
    this.lb = new LineBatch(40000, { blend: this.P.lineBlend });
    this.fam = F.display(100, 700);
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    for (const l of this.lines) {
      const text = l.words.map((w) => styleCase(w.w)).join(' ');
      let size = this.o.size;
      let lay = layout(text, this.fam, size);
      while (lay.width > W * 1.25 && size > 36) { size *= 0.92; lay = layout(text, this.fam, size); }
      // glyph -> word index
      const wordOf: number[] = [];
      l.words.forEach((w, wi) => { for (let k = 0; k < Array.from(styleCase(w.w)).length; k++) wordOf.push(wi); if (wi < l.words.length - 1) wordOf.push(-1); });
      this.lays.set(l.i, { lay, wordOf });
    }
  }

  /** The trace at time t: y(x) with amplitude/harmonics from the envelopes (sampled at time tt). */
  private trace(tt: number, x: number) {
    const au = this.ctx.audio;
    const a = au.sample(tt);
    const u = x / W;
    const amp = 40 + 210 * a.low + 60 * a.kick;
    const ph = tt * 1.3;
    return H * 0.54 + amp * Math.sin(u * Math.PI * 2 * 1.5 + ph) * (0.6 + 0.4 * Math.sin(u * Math.PI))
      + 55 * a.mid * Math.sin(u * Math.PI * 2 * 7 + ph * 3.1) + 18 * a.high * Math.sin(u * Math.PI * 2 * 23 - ph * 5.3);
  }
  /** The slow fundamental the text rides on (readable, still moving with the bass). */
  private textPath(tt: number, x: number) {
    const a = this.ctx.audio.sample(tt);
    const amp = 30 + 120 * a.low;
    return H * 0.54 - 120 + amp * Math.sin((x / W) * Math.PI * 2 * 1.5 + tt * 1.3) * 0.8;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio: au } = this.ctx;
    const t = f.t, P = this.P;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick * 0.5, seed: 2.2 });
    const lb = this.lb; lb.clear();
    const c3 = (key: string, k: number): RGB => { const c = LIN[key]!; return P.light ? c : [c[0] * k, c[1] * k, c[2] * k]; };
    const ink = c3(P.ink, 1), dim = c3(P.light ? 'mid' : 'dim', 1), trace = P.light ? LIN[P.ink]! : c3('accent', 1.7);

    // graticule
    if (this.o.grid) {
      const gx = (W - 2 * SAFE) / 10, gy = (H - 2 * SAFE) / 8;
      for (let i = 0; i <= 10; i++) lb.seg2(SAFE + i * gx, SAFE, SAFE + i * gx, H - SAFE, i === 5 ? 1.2 : 0.9, dim, i === 5 ? 0.55 : 0.3);
      for (let j = 0; j <= 8; j++) lb.seg2(SAFE, SAFE + j * gy, W - SAFE, SAFE + j * gy, j === 4 ? 1.2 : 0.9, dim, j === 4 ? 0.55 : 0.3);
      for (let i = 0; i <= 50; i++) lb.seg2(SAFE + (i * gx) / 5, SAFE + 4 * gy - 5, SAFE + (i * gx) / 5, SAFE + 4 * gy + 5, 0.8, dim, 0.35);
    }
    // persistence echoes: earlier traces, fading
    const N = 220;
    for (let e = this.o.echoes; e >= 0; e--) {
      const te = t - e / 30;
      const alpha = e === 0 ? 1 : 0.5 * Math.pow(0.62, e);
      let px = 0, py = this.trace(te, 0);
      for (let i = 1; i <= N; i++) {
        const x = (i / N) * W, y = this.trace(te, x);
        lb.seg2(px, py, x, y, e === 0 ? 2.2 : 1.4, trace, alpha);
        px = x; py = y;
      }
    }
    // beam: one sweep per bar
    const bx = f.barPhase * W;
    motifHead(lb, P, bx, this.trace(t, bx), t, 0.9 + 0.5 * f.a.kick);
    lb.render(renderer, out);

    // ---- the line riding the wave
    const L = this.L; L.clear();
    const c = L.ctx;
    const line = featuredLine(lyrics, t, this.ctx.start, this.ctx.end, 0.5, 0.9);
    if (line) {
      const { lay, wordOf } = this.lays.get(line.i)!;
      // sample the text path, place glyphs by arc length (centred), rotate to the path
      const pts = Array.from({ length: 97 }, (_, i) => ({ x: SAFE / 2 + ((W - SAFE) * i) / 96, y: this.textPath(t, SAFE / 2 + ((W - SAFE) * i) / 96) }));
      const Ls = polylineLengths(pts), total = Ls[Ls.length - 1]!;
      const s0 = Math.max(0, (total - lay.width) / 2);
      const enter = ease.outExpo(clamp((t - (line.start - 0.5)) / 0.4));
      const leave = ease.inCubic(clamp((t - (line.end + 0.9 - 0.25)) / 0.25));
      const ai = activeWord(line, t);
      c.font = font(this.fam, lay.size);
      c.textBaseline = 'alphabetic';
      lay.glyphs.forEach((g, gi) => {
        const wi = wordOf[gi] ?? -1;
        if (wi < 0) return;
        const w = line.words[wi]!;
        const p = pointAtLength(pts, Ls, s0 + g.x + g.w / 2);
        const sungK = Lyrics.wordProgress(w, t);
        const charInWord = gi - wordOf.indexOf(wi);
        const nChars = wordOf.filter((x) => x === wi).length;
        const on = sungK * nChars > charInWord; // glyphs switch on as the word is sung
        if (on) markWord(w);
        c.save();
        c.translate(p.x, p.y - 26 * (1 - enter) + 60 * leave);
        c.rotate(p.angle);
        c.globalAlpha = enter * (1 - leave) * (on ? 1 : 0.28);
        c.fillStyle = on && wi === ai && t < w.end + 0.06 ? rgba('accent') : P.inkA(1);
        c.fillText(g.ch, -g.w / 2, 0);
        c.restore();
      });
    }
    label(c, `CH1  ${Math.round(au.bpm)} BPM   ${au.section(t)?.name.toUpperCase() ?? ''}`, SAFE, SAFE - 14, P.inkA(0.5));
    label(c, timecode(t), W - SAFE, SAFE - 14, P.inkA(0.5), 13, { align: 'right' });
    label(c, `${(0.2 + f.a.low * 1.8).toFixed(2)} V/div   ${(60000 / au.bpm / 10).toFixed(1)} ms/div`, SAFE, H - SAFE + 30, P.inkA(0.42));
    comp.draw(renderer, L.upload(), out);
    const db = au.timeOfBar(Math.floor(f.bar + 1e-4));
    return { zoom: 1 + 0.006 * pulse(t, db, 0.1), paper: P.light ? 1 : 0, bloom: P.light ? 0.2 : 0.75 };
  }
}

