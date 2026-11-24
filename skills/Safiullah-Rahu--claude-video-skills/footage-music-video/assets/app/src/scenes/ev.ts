// THE STATE OF AI · OCT 2026 (ESCAPE VELOCITY engine) — the whole film in one scene, driven by <project>/storyboard.json (ev/board.ts).
// Layers, bottom to top:
//   ground      black / white / paper / ink plate (code shots, and behind letterboxed footage)
//   footage     the shot's library clip (media/manifest.json frame sequences), camera move + grade, wipes
//   cv          storyboard CV boxes (static/moving boxes, or media tracks)
//   chapter     the explaining graphics of the chapter on screen (ev/chapters/*.ts)
//   type        every lyric line in its mode (ev/type.ts), each word on its time
//   chrome      the broadcast frame: STORY counter, title + spectrum, countdown flaps, bar ruler, ticker, timecode
// Post: colour halftone print screen per chapter/shot, paper polarity on white chapters.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { FootageLayer, type Cam, type Grade } from '../engine/media';
import { markWord } from '../engine/karaoke';
import { hexToLinear, clamp, ease, lerp } from '../engine/util';
import { Board, type Shot, type Storyboard, type LineType, type ChapterSpec } from '../ev/board';
import { makeX, type Base, type Chapter } from '../ev/x';
import { drawChrome, levelsAt, chromeScrim } from '../ev/chrome';
import { lyricBlock, masthead, mass, coverline, blockRect } from '../ev/type';
import { cvBox } from '../ev/cards';
import { C, CORAL } from '../ev/kit';
import storyboardBase from '@root/storyboard.json';

// per-group overrides (<project>/storyboard.d/<group>.json: { "shots": { "<id>": {partial shot} }, "lines": {...} }),
// merged over storyboard.json so parallel reviewers each own one file
const OVERRIDES = import.meta.glob<any>('../../../storyboard.d/*.json', { eager: true, import: 'default' });
const storyboard: any = (() => {
  const sb = JSON.parse(JSON.stringify(storyboardBase));
  for (const o of Object.values(OVERRIDES)) {
    for (const [id, part] of Object.entries<any>(o?.shots ?? {})) {
      const s = sb.shots.find((x: any) => x.id === id);
      if (s) Object.assign(s, part); else console.warn(`[storyboard.d] unknown shot ${id}`);
    }
    Object.assign(sb.lines ??= {}, o?.lines ?? {});
  }
  return sb;
})();

const SCREENS: Record<string, number> = { none: 0, dot: 1, line: 2, bit: 3, color: 4, colour: 4, tone: 5 };
const GROUNDS: Record<string, [number, number, number]> = {
  black: hexToLinear(C.black), white: hexToLinear('#F4F2EE'), paper: hexToLinear(C.paper), ink: hexToLinear(C.ink),
};
const WIPES = new Set(['wipe-l', 'wipe-r', 'wipe-u', 'wipe-d', 'box', 'bands']);

// chapter modules (each exports `chapters`), loaded one by one so a broken module only blanks its own chapters
const MODS = import.meta.glob<{ chapters: Record<string, Chapter> }>('../ev/chapters/*.ts');
const CHAPTERS: Record<string, Chapter> = {};

const DEFAULT_TICKER = [
  'THE STATE OF AI · OCTOBER 2026', 'EVERY NUMBER SOURCED ON SCREEN', 'FACTS CHECKED 18 OCT 2026',
  'MUSIC: MINIMAX-MUSIC3 (AI-GENERATED)', 'FOOTAGE: ROYALTY-FREE STOCK & PUBLIC DOMAIN',
];

export default class EV extends Scene {
  L = new Layer2D();
  foot = [new FootageLayer(), new FootageLayer()];
  board!: Board;
  /** per shot: local clip time at its t0 (continuations carry on from the previous shot of the same clip). */
  private lt0 = new Map<string, number>();
  private chErr = new Set<string>();
  /** this frame has footage under the type (scrims only then) */
  private footageUnder = false;

  override async init() {
    const { lyrics, audio } = this.ctx;
    await Promise.all(Object.entries(MODS).map(([path, load]) => load()
      .then((m) => Object.assign(CHAPTERS, m.chapters ?? {}))
      .catch((e) => console.error(`[chapters] ${path} failed to load`, e))));
    this.board = new Board(storyboard as unknown as Storyboard, lyrics, audio);
    for (const e of this.board.errors) console.warn('[storyboard]', e);
    let prev: Shot | null = null;
    for (const s of this.board.shots) {
      if (s.clip && s.in == null && prev && prev.clip === s.clip) this.lt0.set(s.id, this.lt0.get(prev.id)! + (s.t0 - prev.t0) * (prev.speed ?? 1));
      else this.lt0.set(s.id, s.in ?? 0);
      prev = s;
    }
    (window as any).__ev = this; // debugging: board, shots
  }

  // ------------------------------------------------------------------ footage
  private clipOk(id: string | null | undefined): id is string { return !!id && !!this.ctx.media.manifest.clips?.[id]; }
  /** Local clip time of shot s at song time t (hold / ping-pong / loop past the clip's end). */
  private localT(s: Shot, t: number) {
    const c = this.ctx.media.clip(s.clip!);
    const len = c.frames / c.fps - 1e-3;
    let lt = this.lt0.get(s.id)! + (t - s.t0) * (s.speed ?? 1);
    const mode = s.loop ?? 'pingpong';
    if (lt > len) {
      if (mode === 'hold') lt = len;
      else if (mode === 'loop') lt = lt % len;
      else { const p = lt % (2 * len); lt = p > len ? 2 * len - p : p; }
    }
    return Math.max(0, lt);
  }
  private cam(s: Shot, t: number): Cam {
    const u = ease.inOutQuad(clamp((t - s.t0) / Math.max(0.1, s.t1 - s.t0)));
    const m = s.cam ?? {};
    const v = (k: [number, number] | undefined, d: number) => (k ? lerp(k[0], k[1], u) : d);
    return { zoom: v(m.z, 1.02 + 0.035 * u), x: v(m.x, 0), y: v(m.y, 0), rot: v(m.r, 0) };
  }
  private grade(s: Shot): Grade {
    const ch = this.board.chapters.get(s.ch);
    // the print screen goes on the footage only: type, cards and chrome drawn over it stay crisp (as in EV)
    const scr = SCREENS[s.screen ?? ch?.screen ?? 'color'] ?? 4;
    // dark chapters: footage graded down a touch (EV's plates sit low so the overlay reads); white chapters set their own
    const ink = s.ink ?? ch?.ink ?? 0;
    const base: Grade = ink > 0.5 ? {} : { exposure: 0.84, contrast: 1.06, saturation: 0.86 };
    return { screen: scr, screenCell: 3.2, screenAmt: 0.62, ...base, ...(ch?.grade ?? {}), ...(s.grade ?? {}) };
  }

  override async prepare(t0: number, t1: number) {
    const { media } = this.ctx;
    for (const s of this.board.shots) {
      const nx = this.board.shots[s.idx + 1];
      const tr = nx && WIPES.has(nx.transition ?? '') ? (nx.transition_dur ?? 0.3) : 0;
      if (s.t1 + tr <= t0 || s.t0 > t1 || !this.clipOk(s.clip)) continue;
      const a = Math.max(t0, s.t0), b = Math.min(t1, s.t1 + tr);
      const la = this.localT(s, a), lb = this.localT(s, b);
      await media.prepareClip(s.clip, Math.min(la, lb), Math.max(la, lb));
      await media.prepareTrack(s.clip);
    }
  }

  private drawBase(s: Shot, t: number, out: THREE.WebGLRenderTarget, k: number): Base | null {
    const { renderer, media } = this.ctx;
    clearRT(renderer, out, GROUNDS[s.ground ?? 'black'] ?? GROUNDS.black!);
    if (!this.clipOk(s.clip)) return { kind: 'ground', id: s.ground ?? 'black', w: W, h: H, cam: {}, lt: 0 };
    const lt = this.localT(s, Math.min(t, s.t1 - 1e-3));
    const bmp = media.frame(s.clip, lt), cam = this.cam(s, t);
    if (this.foot[k]!.draw(renderer, out, bmp, cam, this.grade(s))) return { kind: 'clip', id: s.clip, w: bmp!.width, h: bmp!.height, cam, lt };
    return null;
  }

  private wipeRects(type: string, u: number): [number, number, number, number][] {
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
  /** One lyric line: pass 'scrim' (the soft pool under block/mass type over footage — drawn below the graphics) or
   *  'text' (the type itself). */
  private drawLine(c: CanvasRenderingContext2D, lt: LineType, t: number, ink: number, pass: 'scrim' | 'text') {
    const l = lt.line;
    if (t < lt.showAt || t > lt.hideAt + 0.13) return;
    const pre = l.start - lt.showAt;
    const mode = lt.mode ?? 'block';
    if (mode === 'none') return;
    const fade = 1 - ease.inCubic(clamp((t - lt.hideAt) / 0.12));
    if (fade <= 0) return;
    const tinkLine = lt.ink ?? ink;
    c.save();
    c.globalAlpha *= fade;
    if (pass === 'scrim') {
      if (this.footageUnder && (mode === 'block' || mode === 'mass')) {
        const r = blockRect(l, { ...lt, anchor: mode === 'mass' ? 'bottom' : lt.anchor });
        const vis = clamp((t - lt.showAt) / 0.2);
        const cx = r.x + r.w * 0.45, cy = r.y + r.h * 0.5, rx = r.w * 0.78 + 160, ry = r.h * 0.95 + 120;
        c.globalAlpha *= vis;
        c.translate(cx, cy); c.scale(rx / ry, 1);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
        const rgb = tinkLine > 0.5 ? '244,242,238' : '5,6,8';
        g.addColorStop(0, `rgba(${rgb},${tinkLine > 0.5 ? 0.62 : 0.58})`); g.addColorStop(0.55, `rgba(${rgb},0.34)`); g.addColorStop(1, `rgba(${rgb},0)`);
        c.fillStyle = g; c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
      }
      c.restore();
      return;
    }
    const aw = lt.annotateWord;
    const annotateAt = aw != null ? l.words[aw < 0 ? Math.max(0, l.words.length + aw) : Math.min(aw, l.words.length - 1)]!.start : undefined;
    if (mode === 'masthead') masthead(c, l, t, { ink: tinkLine, y: lt.mastheadY });
    else if (mode === 'mass') { mass(c, l, t, Math.floor(this.ctx.audio.beatAt(t) * 2), { ink: tinkLine, alpha: 0.9 }); lyricBlock(c, l, t, { ...lt, ink: tinkLine, anchor: 'bottom', annotateAt }, pre, 99); }
    else if (mode === 'coverline') coverline(c, l, t, lt.x ?? 72, lt.y ?? 200, { size: lt.size, maxW: lt.maxW, ink: tinkLine });
    else lyricBlock(c, l, t, { ...lt, ink: tinkLine, annotateAt }, pre, 99);
    c.restore();
  }

  // ------------------------------------------------------------------ chrome
  private tickerItems(t: number, look: number, months: string) {
    const ch = this.board.chapterAt(t);
    const items = ch?.ticker ?? (storyboard as any).ticker ?? DEFAULT_TICKER;
    const tokens = Math.floor(226_060_000 + t * 1_234_567 + (t > 200 ? (t - 200) ** 2 * 40_000 : 0)).toLocaleString('en-US');
    const agents = Math.floor(1_456_566 + t * 3_211).toLocaleString('en-US');
    return (items as string[]).map((s) => s.replace('{tokens}', tokens).replace('{agents}', agents).replace('{look}', String(look).padStart(2, '0')).replace('{months}', months));
  }

  // ------------------------------------------------------------------ frame
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, media, audio } = this.ctx;
    const t = f.t, B = this.board;
    const s = B.shotAt(t);
    if (!s) { clearRT(renderer, out, GROUNDS.black!); return {}; }
    const ch: ChapterSpec & { t0: number; t1: number } = B.chapters.get(s.ch) ?? { id: s.ch, t0: s.t0, t1: s.t1 };
    // footage (with the incoming wipe over the previous shot)
    let base: Base | null = null;
    const prev = s.idx > 0 ? B.shots[s.idx - 1]! : null;
    const wipe = WIPES.has(s.transition ?? '') ? s.transition! : null, wdur = s.transition_dur ?? 0.3;
    const u = wipe ? (t - s.t0) / wdur : 1;
    if (wipe && prev && u < 1) {
      this.drawBase(prev, t, out, 1);
      for (const r of this.wipeRects(wipe, u)) this.scissored(out, r, () => { base = this.drawBase(s, t, out, 0) ?? base; });
    } else base = this.drawBase(s, t, out, 0);

    const ink = s.ink ?? ch.ink ?? (s.ground === 'white' || s.ground === 'paper' ? 1 : 0);
    this.footageUnder = (base as Base | null)?.kind === 'clip';
    const L = this.L; L.clear();
    const c = L.ctx;
    const X = makeX({ t, f, shot: s, ch: ch as any, board: B, media, ink, base, mark: markWord });

    // chrome opacity (chapters can boot/dim it) — known first, the scrims follow it
    const chapter = CHAPTERS[s.ch];
    let chromeAlpha = s.chrome === false ? 0 : s.chromeAlpha ?? 1;
    if (chapter?.chrome) { try { chromeAlpha *= clamp(chapter.chrome(X)); } catch { /* reported by draw */ } }
    // scrims below everything drawn: chrome backings and lyric pools (so graphics and boxes are never dimmed)
    if (this.footageUnder) chromeScrim(c, ink, chromeAlpha);
    for (const lt of B.lineTypes) this.drawLine(c, lt, t, ink, 'scrim');
    // storyboard CV boxes
    for (const cv of s.cv ?? []) {
      const a = cv.at ? B.at(cv.at) : s.t0, z = cv.until ? B.at(cv.until) : s.t1;
      if (t < a || t > z) continue;
      let r = null as null | { x: number; y: number; w: number; h: number; score?: number };
      if (cv.track) r = X.track(cv.track);
      if (r && r.w * r.h > 0.8 * W * H) r = null; // a box the size of the frame says nothing
      if (!r && cv.box) {
        const k = ease.inOutQuad(clamp((t - a) / Math.max(0.1, z - a)));
        const b = cv.to ? (cv.box.map((v: number, i: number) => lerp(v, cv.to![i]!, k)) as [number, number, number, number]) : cv.box;
        r = X.px(b);
      }
      if (r) {
        // keep boxes off the ticker band, and their label tabs out of the lyric block
        const y1 = Math.min(r.y + r.h, 1000), y0 = Math.max(r.y, 96);
        const rb = { x: r.x, y: y0, w: r.w, h: Math.max(20, y1 - y0) };
        const tab = rb.y < 460 && rb.x < 1120 ? 'bottom' : 'top';
        cvBox(c, rb, cv.label, t, a, { hot: cv.hot, score: cv.score ?? r.score, cross: cv.cross, alpha: 1 - clamp((t - (z - 0.12)) / 0.12), tab, ink: ink > 0.5 });
      }
    }
    // chapter graphics
    if (chapter?.draw) {
      try { c.save(); chapter.draw(c, X); } catch (e: any) { if (!this.chErr.has(s.ch)) { this.chErr.add(s.ch); console.error(`[chapter ${s.ch}]`, e); } } finally { c.restore(); }
    }
    // lyric type
    for (const lt of B.lineTypes) this.drawLine(c, lt, t, ink, 'text');
    // the wipe's leading edge
    if (wipe && u < 1) {
      c.fillStyle = CORAL(0.95);
      for (const r of this.wipeRects(wipe, u)) {
        if (wipe === 'wipe-l') c.fillRect(r[0] - 3, 0, 6, H);
        else if (wipe === 'wipe-r') c.fillRect(r[0] + r[2] - 3, 0, 6, H);
        else if (wipe === 'wipe-u') c.fillRect(0, r[1] - 3, W, 6);
        else if (wipe === 'wipe-d') c.fillRect(0, r[1] + r[3] - 3, W, 6);
      }
    }
    // chrome
    const look = B.lookAt(t);
    const cd = [...B.countdown].reverse().find((h) => t >= h[0]);
    const months = cd && /^\d+$/.test(cd[1][0]!.trim()) ? `-${cd[1][0]!.trim()}` : '0';
    drawChrome(c, {
      t, look, counter: B.counterAt(t), countdown: B.countdown, bar: audio.barAt(t), levels: levelsAt((n, tt) => audio.env(n, tt), t),
      ticker: this.tickerItems(t, look, months), ink, alpha: chromeAlpha, boardMode: 'phrase',
    });
    comp.draw(renderer, L.upload(), out);

    // post
    let o: PostOverrides = { screen: 0, paper: ink > 0.5 ? 1 : 0 };
    if (s.transition === 'flash') o.flash = 0.9 * (1 - clamp((t - s.t0) / 0.1));
    if (chapter?.post) { try { o = chapter.post(X, o); } catch (e) { /* reported by draw */ } }
    return o;
  }
}
