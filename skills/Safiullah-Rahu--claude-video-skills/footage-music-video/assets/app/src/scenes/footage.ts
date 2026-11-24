// FOOTAGE — the base cut of a generated-footage video, driven by the storyboard (<project>/media/shots.json,
// written by the ai-music-video skill's conform step). For every shot:
//   base        its footage: a Seedance clip in song time (shot.segments switch to a divergence cover at the cut),
//               a 2.5D plate moved by a treatment read from the shot's camera note, or the ground (code shots)
//   type        the lyric in the shot's type modes (subtitle · coverline · masthead · mass), every word on its time
//   cv          computer-vision boxes from the tracks of the clip or plate ('a woman', 'a face')
//   chrome      split-flap countdown, look counter, garment tag (shot.chrome)
//   post        the shot's (else its chapter's) print screen, exposure lift and paper
//   transition  shot.transition = wipe-l | wipe-r | wipe-u | wipe-d | box | bands | flash (shot.transition_dur, s);
//               anything else is a hard cut (the default, and right most of the time)
// Chapter scenes extend this class: override overlay() for the explaining graphics, treatment() for bespoke 2.5D
// moves, post() for looks (ai-music-video skill: references/motion-design.md).
// params: screen (default print screen) · cv (true) · cvLabels · chrome (true) · invert
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { rgba, styleCase, STYLE } from '../engine/palette';
import { F, font, measure, fitSize, metrics } from '../engine/type';
import { Lyrics, type Line } from '../engine/lyrics';
import { SAFE, fitWords, drawWord, activeWord, markWord, type Flow } from '../engine/karaoke';
import { FootageLayer, Plate25D, boxToFrame, type Cam, type Grade } from '../engine/media';
import { clamp, ease, hash, lerp, pulse } from '../engine/util';
import { Ground, plate, type Plate } from './_kit';
import { splitFlap, cvBox, tag, counter } from './_hud';

export const SCREENS: Record<string, number> = { none: 0, grain: 0, dot: 1, line: 2, bit: 3, color: 4, colour: 4, tone: 5 };

export interface TypeEntry { line: number; mode?: string; placement?: string }
export interface Segment { t0: number; t1: number; clip: string }
export interface Shot {
  id: string; t0: number; t1: number; chapter?: string; motion_tier?: string; clip?: string; plate?: string; camera?: string;
  segments?: Segment[]; type?: TypeEntry[]; chrome?: { countdown?: string; look?: string; tag?: string[] } | null;
  accent?: string; screen?: string; lift?: number; transition?: string; transition_dur?: number; [k: string]: any;
}
/** What the base layer drew: which clip/plate, its source size and the camera (to map track boxes onto the frame). */
export interface Base { kind: 'clip' | 'plate'; id: string; w: number; h: number; cam: Cam }
export interface Treatment { pan?: [number, number]; dolly?: number; focus?: number; strength?: number; cam?: Cam; grade?: Grade }

const WIPES = new Set(['wipe-l', 'wipe-r', 'wipe-u', 'wipe-d', 'box', 'bands']);

export default class Footage extends Scene {
  L = new Layer2D();
  ground = new Ground();
  foot = [new FootageLayer(), new FootageLayer()];
  p25 = [new Plate25D(), new Plate25D()];
  P!: Plate;
  shots: Shot[] = [];
  allShots: Shot[] = [];
  chapters: any[] = [];
  clipT0 = new Map<string, number>();
  flows = new Map<string, Flow>();
  o = { screen: 'none', cv: true, cvLabels: ['a woman', 'a face'], chrome: true };

  override init() {
    const { params, media, start, end } = this.ctx;
    Object.assign(this.o, STYLE.scenes?.footage ?? {}, params);
    this.P = plate(!!params.invert);
    this.allShots = ((media.shots?.shots ?? []) as Shot[]).slice().sort((a, b) => a.t0 - b.t0);
    this.chapters = media.shots?.chapters ?? [];
    this.shots = this.allShots.filter((s) => s.t1 > start && s.t0 < end);
    // where frame 0 of each clip sits in song time: the window start plus the offset avsync measured;
    // conform's manifest (song_t0) wins when present
    for (const sd of media.shots?.seedance ?? []) if (sd.clip != null && sd.song_t0 != null) this.clipT0.set(sd.clip, sd.song_t0 + (sd.offset ?? 0));
    for (const [id, c] of Object.entries(media.manifest.clips ?? {})) if ((c as any).song_t0 != null) this.clipT0.set(id, (c as any).song_t0);
  }

  // ------------------------------------------------------------------ lookups
  protected shotAt(t: number) { return this.shots.find((s) => t >= s.t0 && t < s.t1) ?? null; }
  protected prevOf(s: Shot) { const i = this.allShots.indexOf(s); return i > 0 ? this.allShots[i - 1]! : null; }
  protected chapterOf(s: Shot | null) { return s?.chapter ? this.chapters.find((c: any) => c.id === s.chapter) ?? null : null; }
  /** The clip playing in shot s at song time t (segments hand over to divergence covers). */
  protected clipAt(s: Shot, t: number) {
    const g = s.segments?.find((x) => t >= x.t0 && t < x.t1);
    return g?.clip ?? s.clip ?? null;
  }
  /** Song time of frame 0 of a clip. */
  protected clipBase(id: string, s?: Shot) { return this.clipT0.get(id) ?? s?.t0 ?? 0; }
  protected transitionOf(s: Shot) {
    const ty = s.transition ?? '';
    if (!WIPES.has(ty) && ty !== 'flash') return null;
    return { type: ty, dur: s.transition_dur ?? (ty === 'flash' ? 0.08 : 0.3) };
  }

  override async prepare(t0: number, t1: number) {
    const { media } = this.ctx;
    for (const s of this.shots) {
      // a shot stays on screen under the next shot's transition
      const nx = this.allShots[this.allShots.indexOf(s) + 1];
      const tr = nx ? this.transitionOf(nx) : null;
      const until = s.t1 + (tr && tr.type !== 'flash' ? tr.dur : 0);
      if (until <= t0 || s.t0 > t1) continue;
      const a = Math.max(t0, s.t0), b = Math.min(t1, until);
      const parts: Segment[] = s.segments?.length ? s.segments : s.clip ? [{ t0: s.t0, t1: until, clip: s.clip }] : [];
      for (const g of parts) {
        if (g.t1 < a || g.t0 > b || !media.manifest.clips?.[g.clip]) continue;
        const base = this.clipBase(g.clip, s);
        await media.prepareClip(g.clip, Math.max(0, Math.max(a, g.t0) - base), Math.max(0, Math.min(b, g.t1 + 0.05) - base));
        await media.prepareTrack(g.clip);
      }
      if (s.plate && media.manifest.plates?.[s.plate]) { await media.preparePlate(s.plate); await media.prepareTrack(s.plate); }
    }
  }

  // ------------------------------------------------------------------ overridable looks
  /** 2.5D treatment of a plate shot, read from its camera note, eased across the shot and nudged on downbeats.
   *  Override per shot for bespoke moves (never the same treatment on two consecutive plate shots). */
  protected treatment(s: Shot, t: number, f: Frame): Treatment {
    const u = clamp((t - s.t0) / Math.max(0.1, s.t1 - s.t0)), e = ease.inOutCubic(u);
    const cam = (s.camera ?? '').toLowerCase(), sign = /left/.test(cam) ? -1 : 1;
    let pan: [number, number] = [0, 0], dolly = 0, rot = 0;
    if (/pan|truck|slide|track/.test(cam)) pan = [sign * lerp(-1, 1, e), 0];
    else if (/tilt|crane|rise|boom/.test(cam)) pan = [0, (/down/.test(cam) ? -1 : 1) * lerp(-1, 1, e)];
    else if (/pull|reveal|back/.test(cam)) dolly = lerp(0.1, -0.02, e);
    else if (/orbit|arc|around/.test(cam)) { pan = [lerp(-1, 1, e), 0.25 * Math.sin(e * Math.PI)]; rot = lerp(-0.012, 0.012, e); }
    else if (/static|lock/.test(cam)) dolly = 0.012 * Math.sin(u * Math.PI);
    else dolly = lerp(-0.02, 0.1, e); // push (the default)
    const db = this.ctx.audio.timeOfBar(Math.floor(f.bar + 1e-4));
    return { pan, dolly, focus: 0.45, strength: 0.06, cam: { zoom: 1.06 + 0.01 * pulse(t, db, 0.12), rot }, grade: this.gradeOf(s) };
  }
  /** Camera on a clip shot: a slow creep so held takes breathe. */
  protected clipCam(s: Shot, t: number): Cam { return { zoom: 1.02 + 0.03 * clamp((t - s.t0) / Math.max(0.1, s.t1 - s.t0)) }; }
  /** Colour grade of the footage (chapter.grade, then shot.grade: exposure, contrast, saturation, tint). Keep it
   *  colourful: generation inputs stay in colour and the look is applied in post. */
  protected gradeOf(s: Shot): Grade { return { ...(this.chapterOf(s)?.grade ?? {}), ...(s.grade ?? {}) }; }
  /** The explaining layer: draw this shot's motion graphics here (Canvas2D, logical 1920×1080, pure function of t).
   *  `base` tells where the footage is (map track boxes with boxToFrame). Call markWord() for lyric words you draw. */
  protected overlay(_c: CanvasRenderingContext2D, _s: Shot, _t: number, _f: Frame, _base: Base | null): void {}
  /** Adjust the post overrides of a shot (screen, exposure, invert, flash, zoom, shake …). */
  protected post(_s: Shot, _t: number, _f: Frame, o: PostOverrides): PostOverrides { return o; }

  // ------------------------------------------------------------------ base layer
  protected drawBase(s: Shot, t: number, f: Frame, out: THREE.WebGLRenderTarget, k = 0): Base | null {
    const { renderer, media } = this.ctx;
    const clip = this.clipAt(s, Math.min(t, s.t1 - 1e-3));
    if (clip && media.manifest.clips?.[clip]) {
      const bmp = media.frame(clip, t - this.clipBase(clip, s)), cam = this.clipCam(s, t);
      if (this.foot[k]!.draw(renderer, out, bmp, cam, this.gradeOf(s))) return { kind: 'clip', id: clip, w: bmp!.width, h: bmp!.height, cam };
    }
    const pl = s.plate ? media.plate(s.plate) : null;
    if (s.plate && pl) {
      const tr = this.treatment(s, t, f);
      this.p25[k]!.draw(renderer, out, pl, tr);
      return { kind: 'plate', id: s.plate, w: pl.image.width, h: pl.image.height, cam: tr.cam ?? {} };
    }
    return null;
  }

  /** Scissor rectangles (logical px, top-left origin) that reveal the incoming shot at transition progress u. */
  protected wipeRects(type: string, u: number): [number, number, number, number][] {
    const e = ease.inOutCubic(clamp(u));
    switch (type) {
      case 'wipe-l': return [[W * (1 - e), 0, W * e, H]];
      case 'wipe-r': return [[0, 0, W * e, H]];
      case 'wipe-u': return [[0, H * (1 - e), W, H * e]];
      case 'wipe-d': return [[0, 0, W, H * e]];
      case 'box': { const w = W * e, h = H * e; return [[(W - w) / 2, (H - h) / 2, w, h]]; }
      case 'bands': {
        const n = 6, bh = H / n;
        return Array.from({ length: n }, (_, i) => { const ei = ease.inOutCubic(clamp(u * 1.6 - i * 0.12)); return [i % 2 ? W * (1 - ei) : 0, i * bh, W * ei, bh] as [number, number, number, number]; });
      }
      default: return [[0, 0, W, H]];
    }
  }

  private scissored(out: THREE.WebGLRenderTarget, r: [number, number, number, number], draw: () => void) {
    const sx = out.width / W, sy = out.height / H;
    const x = Math.floor(r[0] * sx), w = Math.ceil(r[2] * sx), h = Math.ceil(r[3] * sy), y = Math.floor(out.height - (r[1] + r[3]) * sy);
    if (w <= 0 || h <= 0) return;
    out.scissor.set(x, y, w, h); out.scissorTest = true;
    try { draw(); } finally { out.scissorTest = false; }
  }

  // ------------------------------------------------------------------ type
  private flow(key: string, words: Line['words'], fam: string, maxW: number, maxH: number, o: Parameters<typeof fitWords>[4]) {
    let fl = this.flows.get(key);
    if (!fl) { fl = fitWords(words, fam, maxW, maxH, o); this.flows.set(key, fl); }
    return fl;
  }

  /** The lyric of one type entry, in its mode, while its line is on screen. */
  protected drawType(c: CanvasRenderingContext2D, e: TypeEntry, t: number, light: boolean) {
    const l = this.ctx.lyrics.lines[e.line];
    if (!l || t < l.start - 0.35 || t > l.end + 0.7) return;
    const mode = e.mode ?? 'subtitle', place = e.placement ?? (mode === 'coverline' ? 'left' : 'bottom');
    const ink = light ? 'rgba(12,12,12,0.95)' : 'rgba(246,244,238,0.97)', faint = light ? 'rgba(12,12,12,0.25)' : 'rgba(246,244,238,0.3)';
    const ai = activeWord(l, t), kase = STYLE.type?.case;
    if (mode === 'masthead') {
      // one giant word at a time, slammed in on its start
      const w = l.words[Math.max(0, ai)]!;
      if (t < w.start) return;
      const txt = styleCase(w.w, kase === 'lower' ? 'lower' : 'upper'), fam = F.display(F.widths('display')[0] ?? 100, 900);
      const size = Math.min(fitSize(txt, fam, W - 2 * SAFE, 700), 520 / Math.max(0.5, metrics(fam).cap));
      const hit = 1 + 0.08 * (1 - ease.outExpo(clamp((t - w.start) / 0.2)));
      c.save();
      c.translate(W / 2, place === 'top' ? SAFE + size * 0.75 : place === 'bottom' ? H - SAFE - 30 : H / 2 + (size * metrics(fam).cap) / 2);
      c.scale(hit, hit);
      c.font = font(fam, size); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = t < w.end + 0.05 ? rgba('accent') : ink;
      c.fillText(txt, 0, 0);
      c.restore();
      markWord(w);
      return;
    }
    if (mode === 'mass') {
      // a declared mass of micro text, re-lit on every eighth; the line also runs as a subtitle below
      const fam = F.mono(500), size = 15, x0 = place === 'right' ? W / 2 : SAFE, x1 = place === 'left' ? W / 2 : W - SAFE;
      const text = l.words.map((w) => w.w).join(' ') + '  ';
      c.save(); c.font = font(fam, size); c.textBaseline = 'alphabetic';
      const eighth = Math.floor(this.ctx.audio.beatAt(t) * 2);
      for (let y = SAFE + 40, r = 0; y < H - SAFE - 120; y += size * 1.35, r++) {
        const on = hash(r, eighth) < 0.55 + 0.4 * clamp((t - l.start) / Math.max(0.3, l.end - l.start));
        c.fillStyle = on ? ink : faint;
        let x = x0 - ((r * 37) % 180);
        while (x < x1) { c.fillText(text, x, y); x += measure(text, fam, size); }
      }
      c.restore();
    }
    const coverline = mode === 'coverline';
    const fam = F.display(100, coverline ? 800 : 600);
    const fl = this.flow(`${l.i}:${coverline ? 'c' : 's'}`, l.words, fam, coverline ? 640 : 1400, coverline ? 620 : 150,
      { max: coverline ? 112 : 50, min: 24, maxRows: coverline ? 6 : 2, lineHeight: coverline ? 0.96 : 1.1, align: coverline ? (place === 'right' ? 'right' : 'left') : 'center', text: (w) => styleCase(w.w, kase) });
    const x0 = coverline ? (place === 'right' ? W - SAFE - fl.width : SAFE) : (W - fl.width) / 2;
    const y0 = coverline ? H / 2 - fl.height / 2 + fl.size * 0.8 : place === 'top' ? SAFE + fl.size * 0.8 : H - SAFE - fl.height + fl.size * 0.78;
    const vis = Math.min(clamp((t - (l.start - 0.3)) / 0.2), 1 - clamp((t - (l.end + 0.45)) / 0.25));
    c.save(); c.globalAlpha *= vis;
    if (!coverline) { // a quiet band keeps subtitles legible over any footage (typographic, not a glow)
      c.fillStyle = light ? 'rgba(246,244,238,0.55)' : 'rgba(8,8,10,0.45)';
      c.fillRect(x0 - 18, y0 - fl.size * 1.02, fl.width + 36, fl.height + fl.size * 0.4);
    }
    fl.boxes.forEach((b, i) => {
      const w = b.word;
      if (coverline && t < w.start) return; // coverline words land as they are sung
      drawWord(c, b.text, fam, fl.size, x0 + b.x, y0 + b.y, Lyrics.wordProgress(w, t), i === ai && t < w.end + 0.06 ? rgba('accent') : ink, faint, coverline ? 'word' : 'glyph', 0, w);
    });
    c.restore();
  }

  /** Type entries of a shot; without any, every line overlapping it runs as a subtitle. */
  protected entriesOf(s: Shot): TypeEntry[] {
    if (s.type?.length) return s.type;
    return this.ctx.lyrics.lines.filter((l) => l.end + 0.7 > s.t0 && l.start - 0.35 < s.t1).map((l) => ({ line: l.i, mode: 'subtitle' }));
  }

  // ------------------------------------------------------------------ frame
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, media } = this.ctx;
    const t = f.t, P = this.P;
    const s = this.shotAt(t);
    const ch = this.chapterOf(s);
    this.ground.render(renderer, out, P, { t, lift: f.a.kick * 0.4, seed: 2.9 });
    let base: Base | null = null;
    const tr = s ? this.transitionOf(s) : null, prev = s ? this.prevOf(s) : null;
    const u = s && tr ? (t - s.t0) / tr.dur : 1;
    if (s && tr && tr.type !== 'flash' && prev && u < 1) {
      this.drawBase(prev, t, f, out, 1);
      for (const r of this.wipeRects(tr.type, u)) this.scissored(out, r, () => { base = this.drawBase(s, t, f, out, 0) ?? base; });
    } else if (s) base = this.drawBase(s, t, f, out, 0);

    const L = this.L; L.clear();
    const c = L.ctx;
    const light = (s?.lift ?? 0) > 0.5 || (!base && P.light);
    if (s) {
      for (const e of this.entriesOf(s)) this.drawType(c, e, t, light);
      const b = base as Base | null;
      if (this.o.cv && b) {
        const lt = b.kind === 'clip' ? t - this.clipBase(b.id, s) : 0;
        this.o.cvLabels.forEach((lab, i) => {
          const bx = media.box(b.id, lab, lt);
          if (!bx || bx.score < 0.3) return;
          const r = boxToFrame(bx.box, b.w, b.h, b.cam);
          cvBox(c, r.x, r.y, r.w, r.h, lab, bx.score, i ? rgba('accent', 0.95) : 'rgba(240,240,236,0.85)', { cross: i > 0 });
        });
      }
      if (this.o.chrome && s.chrome) {
        if (s.chrome.countdown) {
          // the board flips when its text changes from the previous shot's
          let tc = s.t0;
          for (let i = this.allShots.indexOf(s) - 1; i >= 0 && this.allShots[i]!.chrome?.countdown === s.chrome.countdown; i--) tc = this.allShots[i]!.t0;
          const txt = s.chrome.countdown.toUpperCase();
          const cw = Math.min(30, (W * 0.55) / Math.max(1, txt.length) - 4);
          splitFlap(c, W - SAFE - txt.length * (cw + 4), SAFE - 20, txt, t, tc, { cellW: cw, cellH: cw * 1.45 });
        }
        if (s.chrome.look) counter(c, SAFE, SAFE + 30, 'LOOK', s.chrome.look, light ? plate(!P.light) : P, 34);
        if (s.chrome.tag?.length) tag(c, W - SAFE - 230, H - SAFE - 40 - (s.chrome.tag.length * 17 + 58), s.chrome.tag, { seed: s.t0 * 10, appear: clamp((t - s.t0) / 0.3) });
      }
      if (tr && tr.type !== 'flash' && u < 1) {
        // the wipe's leading edge, in the accent
        c.fillStyle = rgba('accent', 0.95);
        for (const r of this.wipeRects(tr.type, u)) {
          if (tr.type === 'wipe-l') c.fillRect(r[0] - 3, 0, 6, H);
          else if (tr.type === 'wipe-r') c.fillRect(r[0] + r[2] - 3, 0, 6, H);
          else if (tr.type === 'wipe-u') c.fillRect(0, r[1] - 3, W, 6);
          else if (tr.type === 'wipe-d') c.fillRect(0, r[1] + r[3] - 3, W, 6);
          else { c.strokeStyle = rgba('accent', 0.95); c.lineWidth = 4; c.strokeRect(r[0], r[1], r[2], r[3]); }
        }
      }
      this.overlay(c, s, t, f, base);
    }
    comp.draw(renderer, L.upload(), out);

    const scr = SCREENS[(s?.screen ?? ch?.screen ?? this.o.screen) || 'none'] ?? 0;
    const o: PostOverrides = { screen: scr, screenCell: scr === 3 ? 3 : 5, exposure: 1 + 0.5 * (s?.lift ?? 0), paper: light ? 1 : 0 };
    if (s && tr?.type === 'flash') o.flash = 0.9 * (1 - clamp(u));
    return s ? this.post(s, t, f, o) : o;
  }
}
