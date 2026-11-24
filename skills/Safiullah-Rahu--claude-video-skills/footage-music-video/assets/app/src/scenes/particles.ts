// PARTICLES — text made of atoms. Each word of the featured line is sampled into points (glyph fill);
// before it is sung its points drift in a slow flow field, faint; on its start they spring into the
// letters; after the line they are released back into the flow. Kicks shiver the settled letters.
// Everything is a pure function of t (homes, hashed scatter offsets, analytic flow), so it motion-blurs.
// params: size (max px, 190) · step (point spacing px, 5) · dot (point size, 2.2) · invert
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, styleCase, STYLE } from '../engine/palette';
import { F, textPoints } from '../engine/type';
import { type Line } from '../engine/lyrics';
import { SAFE, fitWords, activeWord, markWord } from '../engine/karaoke';
import { clamp, fbm2, hash, springStep, pulse, frameIdx } from '../engine/util';
import { Ground, plate, label, type Plate } from './_kit';

type RGB = [number, number, number];
interface Pt { hx: number; hy: number; sx: number; sy: number; seed: number }
interface WordPts { pts: Pt[]; start: number; end: number }
interface LinePts { line: Line; words: WordPts[] }

export default class Particles extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  lines: LinePts[] = [];
  o = { size: 190, step: 5, dot: 2.2 };

  override init() {
    const { params, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.particles ?? {}, params);
    this.P = plate(!!params.invert);
    const fam = F.display(100, 900);
    let cap = 0;
    for (const l of lyrics.linesStartingIn(start - 0.35, end)) {
      const fl = fitWords(l.words, fam, W - 2 * SAFE, 600, { max: this.o.size, maxRows: 3, align: 'center', text: (w) => styleCase(w.w) });
      const x0 = (W - fl.width) / 2, y0 = H / 2 - fl.height / 2 + fl.size * 0.74;
      const words: WordPts[] = fl.boxes.map((b, bi) => {
        const pts = textPoints(b.text, fam, fl.size, this.o.step, 11 + bi).map((p, k) => {
          const seed = hash(l.i, bi, k);
          const ang = seed * Math.PI * 2, r = 250 + 650 * hash(l.i, bi, k, 7);
          return { hx: x0 + b.x + p.x, hy: y0 + b.y + p.y, sx: W / 2 + Math.cos(ang) * r * 1.4, sy: H / 2 + Math.sin(ang) * r * 0.7, seed };
        });
        cap += pts.length;
        return { pts, start: b.word.start, end: b.word.end };
      });
      this.lines.push({ line: l, words });
    }
    this.lb = new LineBatch(Math.max(4096, Math.min(250000, cap * 2)), { blend: this.P.lineBlend });
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au } = this.ctx;
    const t = f.t, P = this.P, a = f.a;
    this.ground.render(renderer, out, P, { t, lift: a.kick * 0.5, seed: 8.1 });
    const lb = this.lb; lb.clear();
    const dark = !P.light;
    const ink: RGB = dark ? (LIN[P.ink]! as RGB) : (LIN[P.ink]! as RGB);
    const acc: RGB = dark ? [LIN.accent[0] * 2, LIN.accent[1] * 2, LIN.accent[2] * 2] : (LIN.accent as RGB);
    const shiver = 3 * a.kick;
    this.lines.forEach((lp, li) => {
      const l = lp.line;
      if (t < l.start - 2.5 || t > l.end + 3.5) return;
      // released when the next line arrives (or 0.9 s after the last word), gone 1.1 s later
      const nxt = this.lines[li + 1]?.line;
      const tRel = Math.min(l.end + 0.9, nxt ? nxt.start - 0.35 : Infinity);
      const ai = activeWord(l, t);
      lp.words.forEach((wp, wi) => {
        const inT = wp.start - 0.12;
        const k = springStep(t - inT, 2.2, 0.55); // 0 scattered -> 1 home (with a little overshoot)
        const rel = clamp((t - tRel) / 1.1);
        const cur = wi === ai && t < wp.end + 0.06;
        const waiting = t < inT;
        if (!waiting && t < l.end + 1.5) markWord(l.words[wi]);
        for (const p of wp.pts) {
          if (waiting && p.seed > 0.12) continue; // before it is sung a word is a sparse dust
          // flow drift (analytic): position of a particle scattered in the field at time t
          const fx = fbm2(p.sx * 0.002 + t * 0.07, p.sy * 0.002, 2, 3) * 90, fy = fbm2(p.sx * 0.002, p.sy * 0.002 - t * 0.07, 2, 4) * 90;
          const scx = p.sx + fx, scy = p.sy + fy;
          const kk = Math.max(0, k) * (1 - rel * rel);
          const fi = frameIdx(t), jx = (hash(p.seed, fi) - 0.5) * shiver, jy = (hash(p.seed, fi, 2) - 0.5) * shiver;
          const x = scx + (p.hx - scx) * kk + jx + rel * rel * fx * 3, y = scy + (p.hy - scy) * kk + jy + rel * rel * (fy * 3 - 120 * p.seed);
          const fly = waiting ? 0 : Math.max(0, 1 - Math.abs(kk - 0.5) * 2) * (1 - rel); // streak only mid-flight
          const vx = (p.hx - scx) * 0.035 * fly, vy = (p.hy - scy) * 0.035 * fly;
          const al = (waiting ? (P.light ? 0.16 : 0.35) : 0.95) * (1 - rel);
          if (al < 0.01) continue;
          lb.seg2(x - vx, y - vy, x + 0.01, y, this.o.dot, cur ? acc : ink, al);
        }
      });
    });
    lb.render(renderer, out);
    const L = this.L; L.clear();
    const c = L.ctx;
    label(c, `${(au.section(t)?.name ?? '').toUpperCase()}`, SAFE, SAFE, P.inkA(0.45));
    comp.draw(renderer, L.upload(), out);
    const db = au.timeOfBar(Math.floor(f.bar + 1e-4));
    return { zoom: 1 + 0.008 * pulse(t, db, 0.12), paper: P.light ? 1 : 0 };
  }
}
