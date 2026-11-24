// Tools for writing the edit (src/timeline.ts): cut points anchored to lyric lines and snapped to
// the analysed beat grid, so they follow the data when the analysis is re-run.
import type { Lyrics } from './lyrics';
import type { AudioData } from './audio';
import type { TimelineEntry } from './engine';
import type { SceneClass } from './scene';

type Loader = (file: string) => () => Promise<{ default: SceneClass }>;

export function editTools(ly: Lyrics, au: AudioData, load: Loader) {
  /** Cut on the last beat at/before the first word of the nth line containing `q` (never after the word). */
  const cut = (q: string, nth = 0, tol = 0.02) => {
    const s = ly.get(q, nth).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + tol)));
  };
  /** Same, by line index. */
  const cutLine = (i: number, tol = 0.02) => {
    const l = ly.lines[i];
    if (!l) throw new Error(`no lyric line ${i}`);
    return au.timeOfBeat(Math.floor(au.beatAt(l.words[0]!.start + tol)));
  };
  /** First downbeat at/after the end of the nth line containing `q` (a held last note is never cut). */
  const after = (q: string, nth = 0) => {
    const e = ly.get(q, nth).end - 0.05;
    return au.downbeats.find((d) => d >= e) ?? au.duration;
  };
  /** Nearest downbeat to t. */
  const downbeat = (t: number) => au.downbeats.reduce((b, d) => (Math.abs(d - t) < Math.abs(b - t) ? d : b), au.downbeats[0] ?? t);
  /** Nearest beat to t. */
  const beat = (t: number) => au.nearestBeat(t);
  /** Start of bar k (0 = first downbeat; fractional ok). */
  const bar = (k: number) => au.timeOfBar(k);
  /** Start of the nth section called `name` (from data/audio.json). */
  const section = (name: string, nth = 0) => {
    const s = au.sections.filter((x) => x.name === name)[nth];
    if (!s) throw new Error(`no section ${name}${nth ? ` #${nth}` : ''} (have: ${au.sections.map((x) => x.name).join(', ')})`);
    return s.start;
  };
  /** A timeline entry: id, scene module file (src/scenes/<file>.ts), window, extras (params, post, caption…). */
  const E = (id: string, file: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, file, load: load(file), start, end, ...extra });
  return { cut, cutLine, after, downbeat, beat, bar, section, E };
}
