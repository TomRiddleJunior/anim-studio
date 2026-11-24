// The contract between the main scene (scenes/brief.ts) and the segment modules (brief/segments/*.ts).
//
// A segment module exports `segments: Record<string, Segment>` keyed by the segment id of data/film.json (= the scene
// ids of the narration script). The scene calls draw(c, X) every frame while t is inside [seg.t0 - 0.6, seg.t1 + 0.6]
// (the 0.6 s overlaps cross-fade with the neighbours: X.fade is the segment's opacity, already applied to the context).
// A segment draws EVERYTHING of itself: its background (globe / plate / ground), its graphics. The scene adds the
// broadcast chrome and the narration captions on top. Pure functions of X.t. Anchor times to narration words with X.W.
import type { Frame, PostOverrides } from '../engine/scene';
import type { Lyrics, Line, Word } from '../engine/lyrics';
import type { AudioData } from '../engine/audio';
import type { Media } from '../engine/media';
import type { GlobeView } from './globe';

export interface SegInfo {
  id: string; i: number; n: number;           // index and count of story segments (for "04 / 10")
  t0: number; t1: number;                     // segment window (song time)
  vo0: number; vo1: number;                   // first/last narration word of the segment
  kicker?: string; title?: string; region?: string; kind?: string;
  [k: string]: any;
}

export interface X {
  t: number;
  f: Frame;
  seg: SegInfo;
  /** all segments (to coordinate globe hand-offs) */
  segs: SegInfo[];
  ly: Lyrics; au: AudioData; media: Media;
  /** the narration lines of this segment */
  lines: Line[];
  /** the first word whose text matches q (case/punctuation-insensitive; multi-word q matches a phrase) at/after
   *  nth match within THIS segment's narration. Throws if missing. */
  W(q: string, nth?: number): Word;
  /** u(a, b): 0..1 progress of t through [a, b] */
  u(a: number, b: number): number;
  env(name: string, t?: number): number;
  /** The song's beat grid: continuous beat / bar index at t, their inverses, and decaying hits ('kick', 'snare', 'hat', 'vocal'). */
  beat(t?: number): number;
  bar(t?: number): number;
  tBeat(b: number): number;
  tBar(b: number): number;
  hit(kind: string, t?: number, halfLife?: number): number;
  /** draw a plate (Qwen image by id) full-frame with a Ken Burns move (zoom z0→z1, drift dx,dy in frame fractions)
   *  over [a, b]; duotone 0..1 darkens it toward night navy for type. Returns false until loaded. */
  plate(c: CanvasRenderingContext2D, id: string, o?: { a?: number; b?: number; z?: [number, number]; x?: [number, number]; y?: [number, number]; duo?: number; alpha?: number }): boolean;
  /** draw the globe with a view (usually {...X.view(), highlights, pins, arcs}). */
  globe(c: CanvasRenderingContext2D, v: GlobeView): void;
  /** The SHARED globe camera at t: it rests on each segment's focus (film.json) and flies between neighbouring
   *  segments' focuses across their boundary (inOutCubic, ~1.6 s), with a slow idle drift. Use it as the base of every
   *  globe you draw so cross-fading neighbours show the same globe. Override fields only for deliberate moves. */
  view(t?: number): GlobeView;
  mark(w: Word): void;
}

export interface Segment {
  draw(c: CanvasRenderingContext2D, X: X): void;
  post?(X: X, o: PostOverrides): PostOverrides;
}
