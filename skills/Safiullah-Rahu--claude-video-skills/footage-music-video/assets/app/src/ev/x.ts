// The contract between the main scene (scenes/ev.ts) and the chapter modules (ev/chapters/*.ts).
//
// A chapter module exports `chapters: Record<string, Chapter>` keyed by storyboard chapter id. While song time is
// inside a chapter's span (its first shot's start → its last shot's end) the scene calls, every frame:
//   draw(c, X)   the explaining graphics, Canvas2D in logical 1920×1080 px, drawn OVER the footage and UNDER the
//                lyric type and the broadcast chrome. Pure function of X.t — no state, no Math.random/Date.
//   post?(X, o)  adjust the post overrides (flash, zoom punch, shake, invert, screen…) and return them.
// Anchor everything to lyric content (X.L / X.W / X.at), never to seconds: the song is re-timed after analysis.
import type { Frame, PostOverrides } from '../engine/scene';
import type { Lyrics, Line, Word } from '../engine/lyrics';
import type { AudioData } from '../engine/audio';
import type { Media, Cam } from '../engine/media';
import { boxToFrame } from '../engine/media';
import type { Board, Shot, Anchor, ChapterSpec } from './board';
import type { Box } from './cards';
import { clamp } from '../engine/util';

export interface Base { kind: 'clip' | 'ground'; id: string; w: number; h: number; cam: Cam; lt: number }

export interface X {
  t: number;
  f: Frame;
  shot: Shot;
  ch: ChapterSpec & { t0: number; t1: number };
  board: Board;
  ly: Lyrics;
  au: AudioData;
  media: Media;
  /** 0 = white type/chrome on dark footage, 1 = ink on a light plate. */
  ink: number;
  /** What the footage layer drew this frame (clip id, source size, camera, local clip time). */
  base: Base | null;
  /** nth lyric line containing q (throws if missing — the scene reports it). */
  L(q: string, nth?: number): Line;
  /** word k of the nth line containing q (negative k counts from the end). */
  W(q: string, k: number, nth?: number): Word;
  /** Song time of an anchor. */
  at(a: Anchor): number;
  /** Shot by storyboard id (its resolved window), or null. */
  S(id: string): Shot | null;
  /** Continuous beat / bar at t, and their inverses. */
  beat(t?: number): number;
  bar(t?: number): number;
  tBeat(b: number): number;
  tBar(b: number): number;
  /** Audio envelope (rms, low, mid, high, vocal, drums, bass, other) and decaying hits (kick, snare, hat, vocal). */
  env(name: string, t?: number): number;
  hit(kind: string, t?: number, halfLife?: number): number;
  /** Map a 0..1 box of the SOURCE footage to frame px under the current camera (for CV boxes on the image). */
  px(b: [number, number, number, number]): Box;
  /** Tracked box of the current clip (media tracks), mapped to frame px, or null. */
  track(label: string): (Box & { score: number }) | null;
  /** 0..1 progress of t through [a, b]. */
  u(a: number, b: number): number;
  /** Mark a lyric word as drawn (karaoke coverage check) when a chapter draws words itself. */
  mark(w: Word): void;
}

export interface Chapter {
  draw?(c: CanvasRenderingContext2D, X: X): void;
  post?(X: X, o: PostOverrides): PostOverrides;
  /** Opacity 0..1 of the broadcast chrome this frame (default 1): the cold-open boot, full-frame moments. */
  chrome?(X: X): number;
}

export function makeX(o: { t: number; f: Frame; shot: Shot; ch: X['ch']; board: Board; media: Media; ink: number; base: Base | null; mark: (w: Word) => void }): X {
  const { board, media } = o;
  const ly = board.ly, au = board.au;
  const X: X = {
    ...o, ly, au,
    L: (q, nth = 0) => ly.get(q, nth),
    W: (q, k, nth = 0) => { const l = ly.get(q, nth); return l.words[k < 0 ? l.words.length + k : Math.min(k, l.words.length - 1)]!; },
    at: (a) => board.at(a),
    S: (id) => board.shots.find((s) => s.id === id) ?? null,
    beat: (t = o.t) => au.beatAt(t),
    bar: (t = o.t) => au.barAt(t),
    tBeat: (b) => au.timeOfBeat(b),
    tBar: (b) => au.timeOfBar(b),
    env: (n, t = o.t) => au.env(n, t),
    hit: (k, t = o.t, hl = 0.11) => au.hit(k, t, hl),
    px: (b) => (o.base ? boxToFrame(b, o.base.w, o.base.h, o.base.cam) : { x: b[0] * 1920, y: b[1] * 1080, w: (b[2] - b[0]) * 1920, h: (b[3] - b[1]) * 1080 }),
    track: (label) => {
      if (!o.base || o.base.kind !== 'clip') return null;
      const bx = media.box(o.base.id, label, o.base.lt);
      if (!bx) return null;
      return { ...boxToFrame(bx.box, o.base.w, o.base.h, o.base.cam), score: bx.score };
    },
    u: (a, b) => clamp((o.t - a) / Math.max(1e-3, b - a)),
    mark: o.mark,
  };
  return X;
}
