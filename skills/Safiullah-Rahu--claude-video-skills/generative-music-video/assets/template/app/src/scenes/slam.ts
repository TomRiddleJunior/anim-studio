// SLAM — one full-frame word per sung word: the hook / chorus plate. Each word slams in exactly on its
// start (scale overshoot, a flash of the accent), holds and creeps toward the camera while it is held,
// and is replaced by the next. Short words get the widest cut of the display face, long words the most
// condensed (when the font has a width axis), so every word fills the frame. A mono caption rail at the
// bottom keeps the whole line readable (karaoke rule). Escalation by params.n (use 1..4 across choruses):
//   1 fg on the ground, clean · 2 ground-coloured type on an accent field, heavier punches ·
//   3 hairline: light weight, small, words land on grid cells and linger faintly (the eerie breakdown) ·
//   4 maximal: stacked echoes, beat strobes (invert), shake on downbeats.
// params: n (1-4) · weight (900) · case ('upper'|'lower'|'none') · rail (true) · invert
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { F, font, measure, metrics } from '../engine/type';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { SAFE, drawWord, activeWord, fitWords, markWord } from '../engine/karaoke';
import { clamp, ease, hash, pulse, frameIdx } from '../engine/util';
import { Ground, plate, label, type Plate } from './_kit';

interface Slot { w: Word; text: string; fam: string; size: number; cap: number; x: number; y: number; align: CanvasTextAlign }

export default class Slam extends Scene {
  L = new Layer2D();
  ground = new Ground();
  P!: Plate;
  n = 1;
  lines: Line[] = [];
  slots: Slot[] = [];
  o = { weight: 900, rail: true, case: '' as string };

  override init() {
    const { params, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.slam ?? {}, params);
    this.n = Math.max(1, Math.min(4, Number(params.n ?? 1)));
    this.P = plate(!!params.invert);
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    const kase = (this.o.case || (STYLE.type?.case === 'lower' ? 'lower' : 'upper')) as 'upper' | 'lower' | 'none';
    const widths = F.widths('display');
    const hair = this.n === 3;
    const weight = hair ? 300 : this.o.weight;
    const maxW = W - 2 * SAFE, maxCap = hair ? H * 0.2 : H * (this.n === 2 ? 0.5 : 0.56);
    for (const l of this.lines) {
      if (hair) {
        // hairline breakdown: the line set small in a light cut, flush left in the lower third, words landing
        // in reading order and lingering faintly (no overlaps: a real layout, not scattered cells)
        const fam = F.display(100, 300);
        const fl = fitWords(l.words, fam, W * 0.62, H * 0.42, { max: 120, maxRows: 4, lineHeight: 1.08, text: (w) => styleCase(w.w, kase) });
        const capEm = metrics(fam).cap;
        const x0 = SAFE + 40, y0 = H * 0.66 - fl.height / 2 + fl.size * 0.74;
        fl.boxes.forEach((b) => this.slots.push({ w: b.word, text: b.text, fam, size: fl.size, cap: fl.size * capEm, x: x0 + b.x, y: y0 + b.y, align: 'left' }));
        continue;
      }
      l.words.forEach((w) => {
        const text = styleCase(w.w, kase);
        // the width cut that gives the biggest word in the frame
        let best = { fam: F.display(100, weight), size: 10, cap: 7 };
        for (const wd of widths) {
          const fam = F.display(wd, weight);
          const capEm = metrics(fam).cap;
          const size = Math.min((maxW * 100) / Math.max(1, measure(text, fam, 100)), maxCap / capEm, 1100);
          if (size * capEm > best.cap + 0.5) best = { fam, size, cap: size * capEm };
        }
        // placement: centred (1, 4), flush left (2)
        const x = this.n === 2 ? SAFE : W / 2, y = H * 0.5 + best.cap / 2;
        this.slots.push({ w, text, fam: best.fam, size: best.size, cap: best.cap, x, y, align: this.n === 2 ? 'left' : 'center' });
      });
    }
  }

  private idx(t: number) {
    let k = -1;
    for (let i = 0; i < this.slots.length; i++) if (t >= this.slots[i]!.w.start - 1e-4) k = i;
    return k;
  }

  private drawSlot(c: CanvasRenderingContext2D, s: Slot, t: number, col: string, alpha: number, scale = 1, dx = 0, dy = 0) {
    c.save();
    c.globalAlpha *= alpha;
    c.translate(s.x + dx, s.y - s.cap / 2 + dy);
    c.scale(scale, scale);
    c.textAlign = s.align;
    c.textBaseline = 'alphabetic';
    c.font = font(s.fam, s.size);
    c.fillStyle = col;
    c.fillText(s.text, 0, s.cap / 2);
    c.restore();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, lyrics, audio: au } = this.ctx;
    const t = f.t, n = this.n, P = this.P;
    const k = this.idx(t);
    const cur = this.slots[k];
    const since = cur ? t - cur.w.start : 99;
    const hit = cur ? pulse(t, cur.w.start, 0.09) : 0;
    const o: PostOverrides = { paper: P.light ? 1 : 0 };

    // ---- ground (n=2: an accent field)
    this.ground.render(renderer, out, P, { t, lift: f.a.kick * (n === 3 ? 0.3 : 1), seed: 9.2 });
    const L = this.L; L.clear();
    const c = L.ctx;
    if (n === 2) { c.fillStyle = rgba('accent'); c.fillRect(0, 0, W, H); }
    const inkCol = n === 2 ? rgba(P.ground) : P.inkA(1);

    // ---- the word(s)
    if (n === 3) {
      // hairline breakdown: this line's words linger faintly where they landed
      const line = cur ? cur.w.line : -1;
      for (let i = 0; i <= k; i++) {
        const s = this.slots[i]!;
        if (s.w.line !== line) continue;
        const age = t - s.w.start;
        this.drawSlot(c, s, t, i === k ? rgba('accent') : P.inkA(1), i === k ? 1 : 0.28 * clamp(1 - age / 6), 1 + 0.02 * Math.min(age, 3));
        markWord(s.w);
      }
    } else if (cur) {
      const creep = 1 + 0.035 * Math.min(Math.max(0, since - 0.2), 4); // held words creep toward camera
      const slam = 1 + (n === 1 ? 0.1 : 0.16) * (1 - ease.outExpo(clamp(since / 0.18)));
      const sung = Lyrics.wordProgress(cur.w, t);
      if (n === 4) {
        // the word stacked in receding copies, the stack deepening on every beat it is held
        const depth = Math.min(4, 1 + Math.floor(Math.max(0, since) / (60 / this.ctx.audio.bpm)));
        for (let e = depth; e >= 1; e--) this.drawSlot(c, cur, t, P.inkA(1), 0.07 + 0.05 * (depth - e), (1 - 0.07 * e) * creep, -e * 26, -e * 26);
      }
      // accent flash on the slam, then the ink colour; the sung wipe is the accent's retreat
      const flashK = clamp(1 - since / 0.28);
      const col = n === 2 ? inkCol : flashK > 0.02 && sung < 1 ? rgba('accent') : inkCol;
      this.drawSlot(c, cur, t, col, 1, slam * creep);
      markWord(cur.w);
    }

    // ---- caption rail: the whole line in mono, per-word highlight
    if (this.o.rail) {
      const line = cur ? lyrics.lines[cur.w.line]! : this.lines.find((l) => l.start - t < 0.6 && l.start >= t) ?? null;
      if (line) {
        const fam = F.mono(500), size = 22, y = H - SAFE + 20;
        c.font = font(fam, size);
        const words = line.words.map((w) => w.w);
        const sp = measure(' ', fam, size);
        const tot = words.reduce((a, w) => a + measure(w, fam, size), 0) + sp * (words.length - 1);
        let x = W / 2 - tot / 2;
        const ai = activeWord(line, t);
        const railInk = n === 2 ? rgba(P.ground, 0.9) : P.inkA(0.9), railFaint = n === 2 ? rgba(P.ground, 0.4) : P.faint;
        line.words.forEach((w, i) => {
          drawWord(c, w.w, fam, size, x, y, Lyrics.wordProgress(w, t), i === ai && n !== 2 ? rgba('accent') : railInk, railFaint, 'word', 0, w);
          x += measure(w.w, fam, size) + sp;
        });
        label(c, `${String(line.i + 1).padStart(2, '0')}`, SAFE, y, n === 2 ? rgba(P.ground, 0.6) : P.inkA(0.4), 13);
      }
    }
    comp.draw(renderer, L.upload(), out);

    // ---- post: punches, strobes, shake
    const db = au.timeOfBar(Math.floor(f.bar + 1e-4));
    if (n === 1) o.zoom = 1 + 0.012 * hit;
    if (n === 2) { o.zoom = 1 + 0.03 * hit; o.bloom = 0.3; }
    if (n === 3) { o.grain = (STYLE.post?.grain ?? 0.055) * 1.3; o.vignette = 0.55; }
    if (n === 4) {
      o.zoom = 1 + 0.035 * hit;
      const bi = Math.floor(f.beat + 1e-4);
      o.invert = f.beatPhase < 0.12 && bi % 2 === 1 ? 1 : 0; // strobe on the off-beat quarters
      const sh = 14 * pulse(t, db, 0.08);
      o.shake = [sh * (hash(frameIdx(t), 1) - 0.5) * 2, sh * (hash(frameIdx(t), 2) - 0.5) * 2];
      o.flash = 0.25 * f.a.snare;
    }
    return o;
  }
}
