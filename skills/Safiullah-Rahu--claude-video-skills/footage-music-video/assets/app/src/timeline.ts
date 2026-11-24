// The edit: ESCAPE VELOCITY is one scene (scenes/ev.ts) over the whole song; its cuts live in
// <project>/storyboard.json, anchored to lyric lines and the beat grid (ev/board.ts).
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';
import { editTools } from './engine/edit';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const { E } = editTools(ly, au, scene);
  return [E('ev', 'ev', 0, au.duration)];
}
