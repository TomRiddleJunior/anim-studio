// The storyboard (<project>/storyboard.json) resolved against the song: every cut, chrome change and lyric
// placement is anchored to lyric content, sections or the beat grid — never to hard-coded seconds — so the
// same board re-times itself when the analysis changes (placeholder grid → the generated song).
//
// Anchor (all fields optional, combined in this order):
//   { "t": 12.5 }                          absolute seconds (avoid; for the very first shot only)
//   { "line": "Hold the line", "nth": 0, "word": 2 }   start of that word (default 0) of the nth line containing the text
//   { "end": "Hold the line" }             end of the line's last word
//   { "section": "chorus", "nth": 1 }      section start
//   { "prev": true }                       the previous shot's start (with "beats"/"bars" for even montage cuts)
//   "snap": "beat" (default for line anchors: last beat at/before) | "bar" | "near" | "none"
//   "beats": n, "bars": n                  offsets on the grid (after snapping)
import type { Lyrics, Line } from '../engine/lyrics';
import type { AudioData } from '../engine/audio';

export interface Anchor {
  t?: number; line?: string; end?: string; nth?: number; word?: number; section?: string; prev?: boolean;
  snap?: 'beat' | 'bar' | 'near' | 'none'; beats?: number; bars?: number;
}
export interface CamMove { z?: [number, number]; x?: [number, number]; y?: [number, number]; r?: [number, number] }
export interface CvSpec { label: string; box?: [number, number, number, number]; to?: [number, number, number, number]; track?: string; hot?: boolean; score?: number; at?: Anchor; until?: Anchor; cross?: boolean }
export interface ShotCore {
  id: string; ch: string;
  clip?: string | null;             // library clip id (media/manifest.json), null = ground only
  ground?: 'black' | 'white' | 'paper' | 'ink';
  in?: number; speed?: number; loop?: 'hold' | 'pingpong' | 'loop';
  cam?: CamMove; grade?: { exposure?: number; contrast?: number; saturation?: number; tint?: [number, number, number] };
  screen?: string; ink?: number; transition?: string; transition_dur?: number;
  cv?: CvSpec[]; note?: string;
  /** Montage: split this shot into sub-shots every `every` beats, cycling through clips. */
  split?: { every: number; clips: string[]; ins?: number[] };
  chrome?: boolean; chromeAlpha?: number;
}
/** A storyboard shot as written (known fields typed; free-form extras allowed). */
export type ShotSpec = ShotCore & { at: Anchor } & { [k: string]: any };
/** A resolved shot: its window in song time and its index in the cut. */
export type Shot = ShotCore & { t0: number; t1: number; idx: number } & { [k: string]: any };
export interface ChapterSpec { id: string; title?: string; story?: number; counter?: string; ink?: number; screen?: string; grade?: ShotCore['grade']; type?: TypeSpec; ticker?: string[] }
export interface TypeSpec {
  mode?: 'block' | 'masthead' | 'mass' | 'coverline' | 'none';
  anchor?: 'top' | 'bottom'; x?: number; y?: number; size?: number; maxW?: number; weight?: number;
  annotation?: string; ink?: number; ghost?: boolean;
  /** start typing the annotation on word k of the line (negative from the end) instead of just after the line starts */
  annotateWord?: number;
  /** masthead baseline y (default: centred) */
  mastheadY?: number;
}
export interface Storyboard {
  chapters: ChapterSpec[];
  shots: ShotSpec[];
  lines?: Record<string, TypeSpec & { nth?: number }>;
  countdown?: { at: Anchor; rows: string[] }[];
  ticker?: string[];
}
export interface LineType extends TypeSpec { line: Line; showAt: number; hideAt: number; ch: string }

export class Board {
  shots: Shot[] = [];
  chapters = new Map<string, ChapterSpec & { t0: number; t1: number }>();
  lineTypes: LineType[] = [];
  countdown: [number, string[]][] = [];
  looks: [number, number][] = [];
  counters: [number, string][] = [];
  errors: string[] = [];

  constructor(public sb: Storyboard, public ly: Lyrics, public au: AudioData) {
    this.resolve();
  }

  /** Resolve an anchor to song seconds. */
  at(a: Anchor, prevT0 = 0): number {
    const au = this.au, ly = this.ly;
    let t = a.t ?? 0, snapDefault: Anchor['snap'] = 'none';
    if (a.line != null) {
      const l = ly.get(a.line, a.nth ?? 0);
      const k = a.word ?? 0;
      const w = l.words[k < 0 ? Math.max(0, l.words.length + k) : Math.min(l.words.length - 1, k)]!;
      t = w.start; snapDefault = 'beat';
    } else if (a.end != null) {
      t = ly.get(a.end, a.nth ?? 0).end; snapDefault = 'none';
    } else if (a.section != null) {
      const s = au.sections.filter((x) => x.name === a.section)[a.nth ?? 0];
      if (!s) throw new Error(`no section ${a.section} #${a.nth ?? 0}`);
      t = s.start; snapDefault = 'bar';
    } else if (a.prev) {
      t = prevT0; snapDefault = 'none';
    }
    const snap = a.snap ?? snapDefault;
    if (snap === 'beat') t = au.timeOfBeat(Math.floor(au.beatAt(t + 0.02)));
    else if (snap === 'bar') t = au.timeOfBar(Math.round(au.barAt(t)));
    else if (snap === 'near') t = au.nearestBeat(t);
    if (a.bars) t = au.timeOfBar(au.barAt(t) + a.bars);
    if (a.beats) t = au.timeOfBeat(au.beatAt(t) + a.beats);
    return Math.max(0, t);
  }

  private resolve() {
    const { sb, au, ly } = this;
    const raw: Shot[] = [];
    let prev = 0;
    sb.shots.forEach((s, i) => {
      let t0: number;
      try { t0 = this.at(s.at, prev); } catch (e: any) { this.errors.push(`shot ${s.id}: ${e.message}`); return; }
      const { at, ...rest } = s;
      raw.push({ ...rest, t0, t1: 0, idx: i });
      prev = t0;
    });
    raw.sort((a, b) => a.t0 - b.t0);
    for (let i = 0; i < raw.length; i++) raw[i]!.t1 = i + 1 < raw.length ? raw[i + 1]!.t0 : au.duration;
    // montage splits
    const out: Shot[] = [];
    for (const s of raw) {
      if (s.t1 - s.t0 < 1e-3) continue;
      if (!s.split) { out.push(s); continue; }
      const b0 = au.beatAt(s.t0), b1 = au.beatAt(s.t1), ev = s.split.every;
      let k = 0;
      for (let b = b0; b < b1 - 1e-3; b += ev, k++) {
        const t0 = au.timeOfBeat(b), t1 = Math.min(s.t1, au.timeOfBeat(b + ev));
        out.push({ ...s, id: `${s.id}.${k}`, clip: s.split.clips[k % s.split.clips.length]!, in: s.split.ins?.[k % s.split.clips.length] ?? s.in, t0, t1, split: undefined });
      }
    }
    out.forEach((s, i) => (s.idx = i));
    this.shots = out;
    // chapters: span of their shots
    for (const c of sb.chapters) {
      const mine = out.filter((s) => s.ch === c.id);
      if (!mine.length) continue;
      this.chapters.set(c.id, { ...c, t0: mine[0]!.t0, t1: mine[mine.length - 1]!.t1 });
    }
    // lyric placement: per line, from the chapter it starts in, overridden by storyboard.lines
    const over = new Map<number, TypeSpec>();
    // keys are lyric text; "text#n" (or an "nth" field) picks the nth line containing it
    for (const [key, spec] of Object.entries(sb.lines ?? {})) {
      const m = /^(.*)#(\d+)$/.exec(key);
      const q = m ? m[1]! : key, nth = m ? +m[2]! : spec.nth ?? 0;
      try { over.set(ly.get(q, nth).i, spec); } catch (e: any) { this.errors.push(`lines["${key}"]: ${e.message}`); }
    }
    ly.lines.forEach((l, i) => {
      const s = this.shotAt(l.start + 0.01);
      const ch = s ? this.chapters.get(s.ch) : undefined;
      const spec = { ...(ch?.type ?? { mode: 'block' }), ...(over.get(i) ?? {}) };
      const next = ly.lines[i + 1];
      // gone before the next line appears, and never held across its chapter's last cut
      // gone (fade 0.12 s) before the next line appears, cleared at its chapter's last cut unless still being sung
      // across it, and never before its last word has been on screen for a moment
      let hideAt = l.end + 0.9;
      if (next) hideAt = Math.min(hideAt, next.start - 0.14);
      if (ch) hideAt = Math.min(hideAt, Math.max(l.end - 0.05, ch.t1 - 0.14));
      hideAt = Math.max(hideAt, l.words[l.words.length - 1]!.start + 0.12);
      const prevHide = this.lineTypes[i - 1]?.hideAt ?? -Infinity;
      // a line appears (ghosted) a little before its first word, but never while the previous line is still up
      const showAt = Math.min(l.start - 0.02, Math.max(l.start - 0.35, prevHide + 0.13));
      this.lineTypes.push({ ...spec, line: l, showAt, hideAt, ch: s?.ch ?? '' });
    });
    // countdown history and the LOOK counter
    for (const c of sb.countdown ?? []) {
      try { this.countdown.push([this.at(c.at), c.rows]); } catch (e: any) { this.errors.push(`countdown: ${e.message}`); }
    }
    this.countdown.sort((a, b) => a[0] - b[0]);
    // the STORY counter: each chapter with a story number sets it from its first shot; other chapters show their
    // own counter label (CHORUS, WHAT TO WATCH, SOURCES …) and reset the number
    for (const c of sb.chapters) {
      const ch = this.chapters.get(c.id);
      if (!ch) continue;
      this.looks.push([ch.t0, c.story ?? 0]);
      this.counters.push([ch.t0, c.story ? `STORY ${String(c.story).padStart(2, '0')} / 16` : (c.counter ?? '')]);
    }
    this.looks.sort((a, b) => a[0] - b[0]);
    this.counters.sort((a, b) => a[0] - b[0]);
  }

  shotAt(t: number) {
    // binary search would be nicer; a few hundred shots is fine
    for (let i = this.shots.length - 1; i >= 0; i--) if (t >= this.shots[i]!.t0) return this.shots[i]!;
    return this.shots[0] ?? null;
  }
  lookAt(t: number) { let n = 0; for (const [tt, k] of this.looks) if (t >= tt) n = k; return n; }
  counterAt(t: number) { let s = ''; for (const [tt, k] of this.counters) if (t >= tt) s = k; return s; }
  chapterAt(t: number) { const s = this.shotAt(t); return s ? this.chapters.get(s.ch) ?? null : null; }
}
