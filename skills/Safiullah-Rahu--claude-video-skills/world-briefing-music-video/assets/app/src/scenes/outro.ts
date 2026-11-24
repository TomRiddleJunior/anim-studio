// OUTRO — the end card. Lyric lines that start inside the window are sung centred; after the last one
// the title, artist and credits are set small on the grid, word by word on the beats; on the last
// downbeat everything collapses into the motif at the centre, which dims as the frame fades to the ground.
// params: invert · size (max px for the sung lines, 140) · weight (800) · hatch 0..1 · fade (seconds, 1.6)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, fitWords, drawWord, lineVis, activeWord, type Flow } from '../engine/karaoke';
import { clamp, ease, lerp, prog } from '../engine/util';
import { Ground, plate, label, hair, motifHead, type Plate } from './_kit';

export default class Outro extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  fam = '';
  lines: Line[] = [];
  flows = new Map<number, Flow>();
  tCard = 0; tCollapse = 0; tFade = 0;
  o = { size: 140, weight: 800, hatch: 0, fade: 1.6 };

  override init() {
    const { params, lyrics, audio: au, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.outro ?? {}, params);
    this.P = plate(!!params.invert);
    this.lb = new LineBatch(1024, { blend: this.P.lineBlend });
    this.fam = F.display(100, this.o.weight);
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    for (const l of this.lines) this.flows.set(l.i, fitWords(l.words, this.fam, W - 2 * SAFE, 420, { max: this.o.size, maxRows: 2, align: 'center', text: (w) => styleCase(w.w) }));
    const lastEnd = this.lines.length ? this.lines[this.lines.length - 1]!.end + 0.6 : start;
    this.tCard = Math.min(lastEnd, end - 3);
    // collapse on the last downbeat that leaves time for the fade (or 2.2 s before the end)
    const dbs = au.downbeats.filter((d) => d > this.tCard + 1.5 && d < end - this.o.fade - 0.3);
    this.tCollapse = dbs.length ? dbs[dbs.length - 1]! : Math.max(this.tCard + 0.5, end - this.o.fade - 0.6);
    this.tFade = end - this.o.fade;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, song } = this.ctx;
    const t = f.t, P = this.P;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick, hatch: this.o.hatch, seed: 5.3 });
    const L = this.L; L.clear();
    const c = L.ctx;
    const col = ease.inExpo(clamp((t - this.tCollapse) / 0.45)); // collapse toward the centre
    c.save();
    c.translate(W / 2, H / 2); c.scale(1 - col * 0.98, 1 - col * 0.98); c.translate(-W / 2, -H / 2);
    c.globalAlpha = 1 - col;

    // ---- the last sung lines, centred
    for (const l of this.lines) {
      const v = lineVis(l, t, 0.45, 0.5);
      if (v <= 0) continue;
      const fl = this.flows.get(l.i)!;
      const x0 = (W - fl.width) / 2, y0 = H * 0.5 - fl.height / 2 + fl.size * 0.74 + (1 - v) * 30;
      const cur = activeWord(l, t);
      c.save(); c.globalAlpha *= v;
      fl.boxes.forEach((b, i) => drawWord(c, b.text, this.fam, fl.size, x0 + b.x, y0 + b.y, Lyrics.wordProgress(b.word, t), i === cur && t < b.word.end + 0.06 ? rgba('accent') : P.inkA(1), P.faint, 'glyph', 0, b.word));
      c.restore();
    }
    // ---- end card: title / rule / artist / credits, staggered in
    if (t >= this.tCard) {
      const a = (d: number) => ease.outExpo(clamp((t - this.tCard - d) / 0.5));
      const title = styleCase(song.title || '');
      const fam = F.display(100, 900);
      const size = Math.min(120, (W - 2 * SAFE) * 100 / Math.max(1, measure(title, fam, 100)));
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.font = font(fam, size);
      c.fillStyle = P.inkA(a(0));
      c.fillText(title, W / 2, H / 2 + size * 0.3 + (1 - a(0)) * 24);
      const rw = lerp(0, 360, a(0.15));
      const ry = H / 2 + size * 0.3 + size * 0.42;
      hair(c, W / 2 - rw / 2, ry, W / 2 + rw / 2, ry, P.inkA(0.5));
      c.textAlign = 'left';
      if (song.artist) { c.globalAlpha = a(0.3); label(c, String(song.artist).toUpperCase(), W / 2, ry + 40, P.inkA(0.85), 16, { align: 'center' }); c.globalAlpha = 1; }
      if (song.credits) {
        c.font = font(F.text(400, true), 24);
        c.textAlign = 'center';
        c.fillStyle = P.inkA(0.6 * a(0.5));
        c.fillText(String(song.credits), W / 2, H - SAFE - 20);
        c.textAlign = 'left';
      }
    }
    c.restore();
    comp.draw(renderer, L.upload(), out);

    // ---- the motif holds the centre after the collapse, then dims with the fade
    const lb = this.lb; lb.clear();
    if (t >= this.tCollapse) motifHead(lb, P, W / 2, H / 2, t, 1.1 * (1 - 0.5 * prog(t, this.tFade, this.ctx.end)), 1 - prog(t, this.tFade, this.ctx.end));
    lb.render(renderer, out);
    return { fade: ease.inOutCubic(prog(t, this.tFade, this.ctx.end - 0.05)), paper: P.light ? 1 : 0, flash: 0.25 * Math.pow(0.5, Math.max(0, t - this.tCollapse - 0.45) / 0.08) * (t >= this.tCollapse + 0.45 ? 1 : 0) };
  }
}
