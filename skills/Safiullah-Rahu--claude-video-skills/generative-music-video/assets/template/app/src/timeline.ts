// The edit: which scene plays when. `gmv.py plan` rewrites this file with a first cut built from the
// song's sections and lyric lines; edit it freely afterwards. Cut points come from editTools (engine/edit.ts):
// anchored to lyric lines by content and snapped to the analysed beat grid, never hard-coded seconds.
// This fallback version (before `plan` has run) works for any song: title → lines → outro.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { editTools } from './engine/edit';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const { E, cutLine } = editTools(ly, au, scene);
  const end = au.duration;
  if (!ly.lines.length) {
    // instrumental: a title, then the music itself
    const t1 = Math.min(end, au.timeOfBar(4));
    return [E('title', 'title', 0, t1), E('outro', 'outro', t1, end)];
  }
  const first = cutLine(0);
  const last = ly.lines[ly.lines.length - 1]!;
  // the outro starts on the first downbeat after the last word (if there is room for it)
  const db = au.downbeats.find((d) => d > last.end + 0.25) ?? end;
  const outro = end - db > 2 ? db : end;
  const out: TimelineEntry[] = [];
  if (first > 1.5) out.push(E('title', 'title', 0, first));
  out.push(E('lines', 'lines', first > 1.5 ? first : 0, outro));
  if (outro < end) out.push(E('outro', 'outro', outro, end));
  return out;
}
