// TITLE — the masthead for the intro. Hairline rules draw in behind the motif on the first beat, the
// artist types in (mono), the title rises word by word on the beats (display, fitted to the safe width),
// a metadata row sets tempo · metre · key · length. Lyric lines that start inside the window are sung
// small in the upper left (karaoke rules still apply). On the last beat the plate wipes away.
// params: invert · size (max px, 300) · weight (900) · width (100) · hatch 0..1 · meta (true)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { F, font, layout } from '../engine/type';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { SAFE, fitWords, drawWord, lineVis, type Flow } from '../engine/karaoke';
import { clamp, ease, lerp, prog, pulse } from '../engine/util';
import { Ground, plate, label, hair, motifHead, motifSparks, type Plate } from './_kit';

export default class Title extends Scene {
  L = new Layer2D();
  ground = new Ground();
  lb!: LineBatch;
  P!: Plate;
  fam = '';
  flow!: Flow;
  words: Word[] = [];
  wordT: number[] = [];
  lines: Line[] = [];
  lineFlows = new Map<number, Flow>();
  tRule0 = 0; tRule1 = 0; tArtist = 0; tExit = 0;
  o = { size: 300, weight: 900, width: 100, hatch: 0, meta: true };

  override init() {
    const { params, song, audio: au, lyrics, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.title ?? {}, params);
    this.P = plate(!!params.invert);
    this.lb = new LineBatch(8192, { blend: this.P.lineBlend });
    this.fam = F.display(this.o.width, this.o.weight);
    const title = styleCase(song.title || 'Untitled');
    // title words as pseudo lyric words so the karaoke flow/fit code lays them out
    this.words = title.split(/\s+/).filter(Boolean).map((w, i) => ({ w, start: 0, end: 0, line: -1, index: i, gi: -1 }));
    this.flow = fitWords(this.words, this.fam, W - 2 * SAFE, 520, { max: this.o.size, min: 60, maxRows: 2, lineHeight: 0.92, text: (w) => w.w });
    const D = end - start;
    const beats: number[] = [];
    for (let b = Math.ceil(au.beatAt(start + 1e-3)); au.timeOfBeat(b) < end - 1e-3; b++) beats.push(au.timeOfBeat(b));
    const at = (u: number) => start + D * u;
    this.tRule0 = beats[0] ?? start; this.tRule1 = Math.max(this.tRule0 + 0.4, Math.min(at(0.3), this.tRule0 + 2.2));
    this.tArtist = lerp(this.tRule0, this.tRule1, 0.5);
    // title words land on successive beats inside [30%, 75%] of the window (or spread evenly if beats are scarce)
    const slots = beats.filter((b) => b >= at(0.28) && b <= at(0.75));
    this.wordT = this.words.map((_, i) => slots.length >= this.words.length ? slots[Math.floor((i * slots.length) / this.words.length)]! : at(0.3 + (0.4 * i) / Math.max(1, this.words.length)));
    this.tExit = Math.max(at(0.85), end - Math.min(0.5, 60 / au.bpm));
    this.lines = lyrics.linesStartingIn(start - 0.35, end);
    for (const l of this.lines) this.lineFlows.set(l.i, fitWords(l.words, F.display(100, 700), 1100, 200, { max: 58, maxRows: 2, text: (w) => styleCase(w.w) }));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, song, audio: au } = this.ctx;
    const t = f.t, P = this.P, o = this.o;
    this.ground.render(renderer, out, P, { t, lift: f.a.kick, hatch: o.hatch, seed: 1.7 });
    const L = this.L; L.clear();
    const c = L.ctx;
    const exit = ease.inCubic(clamp((t - this.tExit) / Math.max(0.12, this.ctx.end - this.tExit)));
    const fl = this.flow;
    const baseY = H - SAFE - 40 - (fl.rows - 1) * fl.size * fl.lineHeight;
    const ruleY = baseY - fl.size * 0.95 - 30;
    const x0 = SAFE;

    // ---- rules drawn by the motif head
    const ruleP = ease.inOutCubic(prog(t, this.tRule0, this.tRule1));
    const headX = lerp(x0, W - SAFE, ruleP);
    hair(c, x0, ruleY, headX, ruleY, P.inkA(0.55), 1.25);
    hair(c, x0, SAFE + 16, x0 + (W - 2 * SAFE) * ease.outExpo(prog(t, this.tRule0 + 0.1, this.tRule1 + 0.4)), SAFE + 16, P.inkA(0.18));
    // ---- artist (typed) and metadata
    const artist = (song.artist ?? '').toUpperCase();
    if (artist) {
      const n = Math.floor(artist.length * prog(t, this.tArtist, this.tArtist + Math.min(0.9, artist.length * 0.05)));
      label(c, artist.slice(0, n), x0, ruleY - 22, P.inkA(0.85), 18, { weight: 500 });
    }
    if (o.meta) {
      const len = `${Math.floor(au.duration / 60)}:${String(Math.round(au.duration % 60)).padStart(2, '0')}`;
      const meta = [`${Math.round(au.bpm)} BPM`, `${au.meter}/4`, au.key ? au.key.toUpperCase() : '', len].filter(Boolean).join('   ·   ');
      c.save(); c.globalAlpha = prog(t, this.tRule0 + 0.2, this.tRule0 + 0.6);
      label(c, meta, x0, SAFE, P.inkA(0.5));
      if (song.year) label(c, String(song.year), W - SAFE, SAFE, P.inkA(0.5), 13, { align: 'right' });
      c.restore();
    }
    // ---- the title, word by word on the beats, glyphs rising with a small stagger, clipped at the baseline
    c.textBaseline = 'alphabetic';
    c.font = font(this.fam, fl.size);
    fl.boxes.forEach((b, i) => {
      const t0 = this.wordT[i]!;
      if (t < t0) return;
      const lay = layout(b.text, this.fam, fl.size);
      const by = baseY + b.y;
      c.save();
      c.beginPath(); c.rect(0, by - fl.size * 1.05, W, fl.size * 1.45); c.clip();
      lay.glyphs.forEach((g, k) => {
        const e = ease.outExpo(clamp((t - t0 - k * 0.028) / 0.42));
        const dy = (1 - e) * fl.size * 1.05 + exit * fl.size * 1.1;
        c.fillStyle = P.inkA(1);
        c.fillText(g.ch, x0 + b.x + g.x, by + dy);
      });
      c.restore();
    });
    // ---- lyric lines that start inside the intro (sung small, upper left)
    for (const l of this.lines) {
      const v = lineVis(l, t, 0.5, 0.6);
      if (v <= 0) continue;
      const lf = this.lineFlows.get(l.i)!;
      c.save(); c.globalAlpha = v * (1 - exit);
      lf.boxes.forEach((b) => drawWord(c, b.text, lf.family, lf.size, SAFE + b.x, SAFE + 110 + b.y, Lyrics.wordProgress(b.word, t), rgba('accent'), P.faint, 'glyph', 0, b.word));
      c.restore();
    }
    comp.draw(renderer, L.upload(), out);

    // ---- the motif head on the rule, pulsing on kicks
    const lb = this.lb; lb.clear();
    if (t >= this.tRule0 && exit < 1) {
      const headAt = (tb: number) => (tb >= this.tRule0 && tb <= this.tRule1 + 0.05 ? { x: lerp(x0, W - SAFE, ease.inOutCubic(prog(tb, this.tRule0, this.tRule1))), y: ruleY } : null);
      if (t < this.tRule1 + 0.5) motifSparks(lb, P, t, headAt, { rate: 70, intensity: 0.9 });
      motifHead(lb, P, headX, ruleY, t, 0.9 + 0.35 * f.a.kick, 1 - exit);
    }
    lb.render(renderer, out);
    const ov: PostOverrides = { zoom: 1 + 0.01 * pulse(t, this.tRule0, 0.2), paper: P.light ? 1 : 0 };
    if (!P.light) ov.bloom = 0.6;
    return ov;
  }
}

