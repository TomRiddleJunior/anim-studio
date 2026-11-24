// LINES — Swiss-grid karaoke, the general-purpose lyric plate.
// The featured line is set large on the grid; words wipe glyph by glyph from faint to ink as they are
// sung, the word being sung in the accent with an underline that tracks it; the next line is cued
// small above the bottom rule; mono annotations (section, bar·beat, timecode, line n/N) frame the plate;
// the ground lifts on kicks and the frame punches in on downbeats.
// params: align 'left'|'center' · size (max px, 170) · weight (800) · width (100) · invert (swap ground/ink)
//         hatch 0..1 (engraved field) · grid 0..1 (hairline grid) · cue (next-line cue, true) · annotate (true)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { F } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, fitWords, drawWord, activeWord, type Flow } from '../engine/karaoke';
import { clamp, ease, pulse } from '../engine/util';
import { Ground, plate, label, timecode, hair, type Plate } from './_kit';

const PRE = 0.45; // anticipation: a line starts entering this long before its first word
const HOLD = 0.9; // a line holds this long after its last word (unless the next one pushes it out)

export default class Lines extends Scene {
  L = new Layer2D();
  ground = new Ground();
  P!: Plate;
  fam = '';
  lines: Line[] = [];
  flows = new Map<number, Flow>();
  o = { align: 'left' as 'left' | 'center', size: 170, weight: 800, width: 100, hatch: 0, grid: 0, cue: true, annotate: true };

  override init() {
    const { params, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.lines ?? {}, params);
    this.P = plate(!!params.invert);
    this.fam = F.display(this.o.width, this.o.weight);
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    const maxW = this.o.align === 'center' ? W - 2 * SAFE : W - 2 * SAFE - 200;
    const kase = params.case ?? undefined;
    for (const l of this.lines) {
      this.flows.set(l.i, fitWords(l.words, this.fam, maxW, 560, {
        max: this.o.size, min: 40, maxRows: 3, lineHeight: 1.0, align: this.o.align === 'center' ? 'center' : 'left',
        text: (w) => styleCase(w.w, kase),
      }));
    }
  }

  /**
   * When a line owns the slot: it enters up to PRE before its first word, but never before the previous
   * line's last word has been sung (legato lines hand over on the new line's first word); it leaves when
   * the next line takes the slot, or HOLD after its own last word.
   */
  private slot(k: number): [number, number] {
    const l = this.lines[k]!, prev = this.lines[k - 1], next = this.lines[k + 1];
    const tIn = prev ? Math.min(l.start - 0.04, Math.max(l.start - PRE, prev.end)) : l.start - PRE;
    const tOut = next ? this.slot(k + 1)[0] : Math.min(l.end + HOLD, this.ctx.end);
    return [tIn, Math.max(tIn + 0.1, tOut)];
  }
  /** Visibility and vertical offset of a line: snaps in from below, leaves upward fast (no overlap with the next). */
  private motion(l: Line, t: number) {
    const [tIn, tOut] = this.slot(this.lines.indexOf(l));
    const eIn = ease.outExpo(clamp((t - tIn) / 0.34));
    const eOut = ease.inCubic(clamp((t - tOut) / 0.1));
    return { vis: eIn * (1 - eOut), dy: (1 - eIn) * 56 - eOut * 40, on: t >= tIn && t < tOut + 0.1 };
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, audio: au, lyrics } = this.ctx;
    const t = f.t, P = this.P, o = this.o;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick, hatch: o.hatch, grid: o.grid, gridPx: 96, seed: 3.1 });

    const L = this.L; L.clear();
    const c = L.ctx;
    c.textBaseline = 'alphabetic';

    // ---- the lyric
    for (const l of this.lines) {
      const m = this.motion(l, t);
      if (!m.on || m.vis <= 0.001) continue;
      const fl = this.flows.get(l.i)!;
      const x0 = o.align === 'center' ? (W - fl.width) / 2 : SAFE + 96;
      const y0 = H * 0.5 - fl.height / 2 + fl.size * 0.74 + m.dy;
      c.save();
      c.globalAlpha = m.vis;
      const cur = activeWord(l, t);
      fl.boxes.forEach((b, i) => {
        const w = b.word;
        const p = Lyrics.wordProgress(w, t);
        const singing = i === cur && t < w.end + 0.06;
        if (singing) {
          // a rule under the word tracks its sung part (drawn first: descenders sit over it)
          const uy = y0 + b.y + fl.size * 0.2;
          hair(c, x0 + b.x, uy, x0 + b.x + b.w * p, uy, rgba('accent'), Math.max(1.5, fl.size * 0.022));
        }
        drawWord(c, b.text, this.fam, fl.size, x0 + b.x, y0 + b.y, p, singing ? rgba('accent') : P.inkA(1), P.faint, 'glyph', 0, w);
      });
      c.restore();
    }

    // ---- next-line cue (mono, small, above the bottom rule)
    const featured = this.lines.find((l) => { const m = this.motion(l, t); return m.on && m.vis > 0.5; }) ?? null;
    if (o.cue) {
      const idx = featured ? this.lines.indexOf(featured) : -1;
      const nxt = idx >= 0 ? this.lines[idx + 1] : this.lines.find((l) => l.start > t);
      if (nxt && nxt.start - t < 6 && nxt.start > t) {
        const a = clamp((6 - (nxt.start - t)) / 1.5) * clamp((nxt.start - PRE - t) / 0.2 + 1);
        c.save(); c.globalAlpha = a * 0.9;
        label(c, `→  ${styleCase(nxt.text, 'none')}`, SAFE, H - SAFE - 44, P.inkA(0.42), 16, { weight: 400, spacing: 0.5 });
        c.restore();
      }
    }

    // ---- annotations and rules
    if (o.annotate) {
      const sec = au.section(t)?.name ?? '';
      const bar = Math.max(0, Math.floor(f.bar)) + 1, beat = Math.floor(((f.beat % au.meter) + au.meter) % au.meter) + 1;
      label(c, `${sec.toUpperCase()}  ·  BAR ${String(bar).padStart(3, '0')}.${beat}`, SAFE, SAFE, P.inkA(0.5));
      label(c, timecode(t), W - SAFE, SAFE, P.inkA(0.5), 13, { align: 'right' });
      hair(c, SAFE, SAFE + 16, W - SAFE, SAFE + 16, P.inkA(0.16));
      const yb = H - SAFE - 16;
      hair(c, SAFE, yb, W - SAFE, yb, P.inkA(0.16));
      // song progress on the bottom rule, a tick per beat of the current bar
      hair(c, SAFE, yb, SAFE + (W - 2 * SAFE) * clamp(t / au.duration), yb, rgba('accent', 0.9), 2);
      for (let i = 0; i < au.meter; i++) {
        const x = W - SAFE - (au.meter - 1 - i) * 14;
        c.fillStyle = i + 1 === beat ? rgba('accent') : P.inkA(0.3);
        c.fillRect(x - 1, yb + 8, 2, i + 1 === beat ? 9 : 5);
      }
      const all = lyrics.lines.length;
      if (featured) label(c, `LINE ${String(featured.i + 1).padStart(2, '0')} / ${String(all).padStart(2, '0')}`, SAFE, H - SAFE + 12, P.inkA(0.42));
      const title = (this.ctx.song.title ?? '').toUpperCase();
      if (title) label(c, title, W - SAFE - au.meter * 14 - 18, H - SAFE + 12, P.inkA(0.42), 13, { align: 'right' });
    }

    comp.draw(renderer, L.upload(), out);
    // punch-in on downbeats
    const db = au.timeOfBar(Math.floor(f.bar + 1e-4));
    return { zoom: 1 + 0.007 * pulse(t, db, 0.1), paper: P.light ? 1 : 0 };
  }
}

