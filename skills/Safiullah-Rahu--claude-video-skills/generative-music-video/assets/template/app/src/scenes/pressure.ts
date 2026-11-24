// PRESSURE — typographic pressure for build-ups (pre-choruses, bridges): the current line is repeated
// in flat copies that fill the title-safe box; every kick packs another row in while the type condenses
// (width axis) and gets heavier across the window. The sung line rides on a ground-coloured band in the
// middle, karaoke-wiped; hairline safe-area guides and a deadpan density counter annotate the frame.
// params: maxRows (26) · invert · guides (true)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, drawWord, activeWord, featuredLine } from '../engine/karaoke';
import { clamp, ease, lerp, pulse } from '../engine/util';
import { Ground, plate, label, hair, type Plate } from './_kit';

export default class Pressure extends Scene {
  L = new Layer2D();
  ground = new Ground();
  P!: Plate;
  lines: Line[] = [];
  kicks: number[] = [];
  o = { maxRows: 26, guides: true };

  override init() {
    const { params, lyrics, audio: au, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.pressure ?? {}, params);
    this.P = plate(!!params.invert);
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    // pressure steps: kicks if the drums play here, else beats
    const ks = au.events('kick', start, end).map(([t]) => t);
    this.kicks = ks.length >= 4 ? ks : Array.from({ length: Math.ceil((end - start) * au.bpm / 60) }, (_, i) => au.timeOfBeat(Math.ceil(au.beatAt(start)) + i)).filter((t) => t < end);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics } = this.ctx;
    const t = f.t, P = this.P;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick, seed: 4.4 });
    const L = this.L; L.clear();
    const c = L.ctx;
    const p = clamp(f.p);
    let steps = 0;
    for (const k of this.kicks) if (k <= t) steps++;
    const rows = Math.min(this.o.maxRows, 3 + steps);
    const lastK = this.kicks.filter((k) => k <= t).pop() ?? -9;
    const jolt = pulse(t, lastK, 0.07);
    const line = featuredLine(lyrics, t, this.ctx.start, this.ctx.end, 0.6, 2) ?? this.lines[this.lines.length - 1] ?? null;
    const text = line ? styleCase(line.text, 'upper') : styleCase(this.ctx.song.title ?? '', 'upper');

    // safe areas
    const ts = { x: W * 0.05, y: H * 0.05, w: W * 0.9, h: H * 0.9 };
    const as = { x: W * 0.035, y: H * 0.035, w: W * 0.93, h: H * 0.93 };
    // copies: width condenses and weight rises with the window's progress
    const widths = F.widths('display');
    const wd = widths[Math.round(lerp(widths.length - 1, 0, ease.inOutCubic(p)))] ?? 100;
    const wt = lerp(300, 900, ease.inCubic(p));
    const fam = F.display(wd, wt);
    const rowH = ts.h / rows;
    const size = Math.min(rowH * 1.18, (ts.w * 100) / Math.max(1, measure(text, fam, 100)));
    c.save();
    c.beginPath(); c.rect(ts.x, ts.y, ts.w, ts.h); c.clip();
    c.font = font(fam, size);
    c.textBaseline = 'alphabetic';
    for (let r = 0; r < rows; r++) {
      const y = ts.y + (r + 1) * rowH - rowH * 0.12 + (r % 2 ? 1 : -1) * jolt * 3;
      c.fillStyle = P.inkA(r % 2 ? 0.1 : 0.17);
      c.fillText(text, ts.x + (ts.w - measure(text, fam, size)) / 2, y);
    }
    c.restore();

    // the sung line on a band in the middle
    if (line) {
      const lf = F.display(Math.min(100, widths[widths.length - 1] ?? 100), 800);
      const words = line.words.map((w) => styleCase(w.w, 'upper'));
      let sz = Math.min(150, ts.h / 5);
      const sp = () => measure(' ', lf, sz);
      const wsum = () => words.reduce((a, w) => a + measure(w, lf, sz), 0) + sp() * (words.length - 1);
      while (wsum() > ts.w - 80 && sz > 30) sz *= 0.95;
      const bandH = sz * 1.25, by = H / 2 - bandH / 2;
      c.fillStyle = rgba(P.ground, 1);
      c.fillRect(ts.x, by, ts.w, bandH);
      let x = W / 2 - wsum() / 2;
      const ai = activeWord(line, t);
      line.words.forEach((w, i) => {
        drawWord(c, words[i]!, lf, sz, x, by + bandH / 2 + sz * 0.36, Lyrics.wordProgress(w, t), i === ai && t < w.end + 0.06 ? rgba('accent') : P.inkA(1), P.faint, 'glyph', 0, w);
        x += measure(words[i]!, lf, sz) + sp();
      });
    }
    if (this.o.guides) {
      c.save(); c.setLineDash([6, 6]);
      c.strokeStyle = P.inkA(0.35); c.lineWidth = 1.25;
      c.strokeRect(ts.x, ts.y, ts.w, ts.h);
      c.strokeStyle = P.inkA(0.18);
      c.strokeRect(as.x, as.y, as.w, as.h);
      c.restore();
      label(c, 'TITLE SAFE 90%', ts.x + 8, ts.y - 8, P.inkA(0.45), 12);
      label(c, 'ACTION SAFE 93%', as.x + as.w - 8, as.y - 6, P.inkA(0.3), 12, { align: 'right' });
      label(c, `DENSITY ×${rows}   WIDTH ${Math.round(wd)}   WEIGHT ${Math.round(wt)}`, ts.x + ts.w, H - as.y + 4, P.inkA(0.45), 12, { align: 'right' });
      hair(c, ts.x, H - as.y - 4, ts.x + ts.w * p, H - as.y - 4, rgba('accent', 0.9), 2);
    }
    comp.draw(renderer, L.upload(), out);
    return { zoom: 1 + 0.015 * jolt + 0.02 * ease.inCubic(p), paper: P.light ? 1 : 0, vignette: lerp(0.3, 0.6, p) };
  }
}
