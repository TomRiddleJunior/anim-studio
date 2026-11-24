// Word-timed lyrics (data/lyrics.json) with queries for karaoke rendering.
import { smart } from './type';

export interface Word {
  w: string; // display token (punctuation attached, typographic quotes: don’t, ’cause)
  start: number;
  end: number;
  conf?: number;
  /** Sub-word units (syllables / spelled letters of an acronym): [start, end] each. */
  syl?: [number, number][];
  /** filled in by Lyrics: */
  line: number;
  index: number; // index within line
  gi: number; // global word index
}
export interface Line {
  i: number;
  text: string;
  start: number;
  end: number;
  words: Word[];
  /** Section tag from the lyrics source ([Chorus] …), when the aligner knew it. */
  section?: string;
}

export class Lyrics {
  lines: Line[];
  words: Word[];
  constructor(j: { lines: any[] }) {
    // display text gets curly apostrophes and quotes (the data keeps the typed ones); mono UI
    // text that wants them straight uses plain()
    this.lines = (j.lines ?? []).map((l, li) => ({
      ...l,
      i: li,
      text: smart(l.text),
      words: (l.words as any[]).map((w, wi) => ({ ...w, w: smart(w.w), line: li, index: wi, gi: 0 })),
    }));
    this.words = this.lines.flatMap((l) => l.words);
    this.words.forEach((w, i) => (w.gi = i));
  }

  static async load(): Promise<Lyrics> {
    for (const url of ['data/lyrics.json', 'data/lyrics.approx.json']) {
      const r = await fetch(url);
      if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) return new Lyrics(await r.json());
    }
    console.warn('no lyrics data found (data/lyrics.json): rendering as an instrumental');
    return new Lyrics({ lines: [] });
  }

  /** The line being sung at t (or null in gaps). */
  lineAt(t: number): Line | null {
    return this.lines.find((l) => t >= l.start && t < l.end) ?? null;
  }
  /** Most recent line that started at or before t. */
  lastLine(t: number): Line | null {
    let best: Line | null = null;
    for (const l of this.lines) if (l.start <= t) best = l;
    return best;
  }
  nextLine(t: number): Line | null {
    return this.lines.find((l) => l.start > t) ?? null;
  }
  /** Lines overlapping [t0, t1). */
  linesIn(t0: number, t1: number): Line[] {
    return this.lines.filter((l) => l.end > t0 && l.start < t1);
  }
  /** Lines that START inside [t0, t1) — the lines a scene window "owns". */
  linesStartingIn(t0: number, t1: number): Line[] {
    return this.lines.filter((l) => l.start >= t0 && l.start < t1);
  }
  /** Lines whose text includes `s` (case/accents/quotes-insensitive). Handy for finding a lyric by content. */
  find(s: string): Line[] {
    const q = fold(s);
    return this.lines.filter((l) => fold(l.text).includes(q));
  }
  /** nth line containing `s`; throws if missing (fail loudly while authoring). */
  get(s: string, nth = 0): Line {
    const l = this.find(s)[nth];
    if (!l) throw new Error(`lyric not found: ${s}${nth ? ` (#${nth})` : ''}`);
    return l;
  }
  wordAt(t: number): Word | null {
    return this.words.find((w) => t >= w.start && t < w.end) ?? null;
  }
  lastWord(t: number): Word | null {
    let best: Word | null = null;
    for (const w of this.words) if (w.start <= t) best = w;
    return best;
  }
  /** Words whose normalized text matches (e.g. 'love', 'p(doom)'). */
  findWords(s: string): Word[] {
    const q = norm(s);
    return this.words.filter((w) => norm(w.w) === q);
  }

  /**
   * Sung progress of a word at time t: 0 before start, 1 after end, linear inside
   * (or piecewise across syllables when available). Use for karaoke wipes.
   */
  static wordProgress(w: Word, t: number): number {
    if (t <= w.start) return 0;
    if (t >= w.end) return 1;
    if (w.syl && w.syl.length > 1) {
      const n = w.syl.length;
      for (let i = 0; i < n; i++) {
        const [a, b] = w.syl[i]!;
        if (t < a) return i / n;
        if (t < b) return (i + (t - a) / Math.max(1e-3, b - a)) / n;
      }
      return 1;
    }
    return (t - w.start) / Math.max(1e-3, w.end - w.start);
  }

  /** Progress through a whole line in characters (0..text.length), for per-glyph wipes. */
  static lineCharProgress(l: Line, t: number): number {
    let chars = 0;
    for (const w of l.words) {
      const p = Lyrics.wordProgress(w, t);
      chars += p * w.w.length;
      if (p < 1) break;
      chars += 1; // the space
    }
    return Math.min(chars, l.text.length);
  }

  /** [start, end] per character of a line's text, from its word timings (spaces take the gap). For stroke writing. */
  static charTimes(l: Line): [number, number][] {
    const out: [number, number][] = [];
    l.words.forEach((w, wi) => {
      const n = Array.from(w.w).length, d = (w.end - w.start) / Math.max(1, n);
      for (let k = 0; k < n; k++) out.push([w.start + k * d, w.start + (k + 1) * d]);
      if (wi < l.words.length - 1) out.push([w.end, l.words[wi + 1]!.start]);
    });
    return out;
  }
}

/** Letters/digits only, lowercased, accents removed (keeps parentheses so 'P(doom)' stays distinct). */
export const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}()]/gu, '');
const fold = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
