# THE STATE OF THE WORLD · OCTOBER 2026 — brief for segment animators

Read `DESIGN.md` first: the look, the palette, the type and the ethics. The narration is `tools/script.json`. Its
resolved timings, with every word's start and end, are in `data/vo.json` and `data/lyrics.json`. The segment
windows are in `data/film.json`. The ONLY permitted facts and numbers are in `research/FACTSHEET.md`; its
"On-screen numbers" lines tell you what to chart, with the exact source label to print.

## The contract — `app/src/brief/segments/<group>.ts`
```ts
import type { Segment } from '../x';
export const segments: Record<string, Segment> = {
  gulf: { draw(c, X) { /* everything of this segment: background + graphics */ }, post?(X, o) { return o; } },
};
```
- The scene calls `draw` while t is in [seg.t0 − 0.6, seg.t1 + 0.6]. Neighbours cross-fade, and `c.globalAlpha` is
  already the segment's fade. Draw your OWN background: a plate, the globe, or a plain night or paper ground.
- `X`: `t`, `seg` (t0/t1/vo0/vo1/kicker/title/focus…), `lines` (this segment's narration lines with word times),
  `X.W('Hormuz')` (a word or phrase in THIS segment's narration → `{start, end}`), `X.u(a, b)`, `X.env('vocal'|'music')`,
  `X.plate(c, id, {a, b, z:[1, 1.06], x, y, duo})`, `X.view()` (the shared globe camera), `X.globe(c, {...X.view(), highlights, pins, arcs})`.
- Kit: `brief/kit.ts`:
  - text: `text`, `label`, `source`, `para`, `wrap`, `typed`, `pill`, `scrim`;
  - numbers and marks: `bigNumber`, `countTo`, `hair`, `drawOn`;
  - timing: `appear`, `vanish`, `life`.
- Globe and maps: `brief/globe.ts`: `drawFlatMap`, `country(name)`, `flyTo`; arcs and pins via `X.globe`.
- Charts: `brief/charts.ts`: `bars`, `lineChart`, `statCard`, `calendar`. Read these files before inventing anything.
- **Globe continuity:** any globe you draw starts from `X.view()`, the shared camera that rests on the segment's
  focus and flies at the boundaries. You may add highlights, pins and arcs, or nudge `r`/`cx` for a deliberate move.
  If you move the camera, ease back toward `X.view()` before your segment ends.

## Rules
1. **Pure function of `X.t`.** No state, no `Math.random`, no `Date`. Use `hash()` for any deterministic jitter.
2. **Anchor to words**: `X.W('117.8').start` and the like. Never write seconds. Each graphic enters on the word it
   illustrates, holds while relevant, and leaves (0.25 s) before the next idea, or at the segment end.
3. **Numbers:**
   - Only fact-sheet numbers, printed exactly as the sheet gives them, with a source line in the sheet's format:
     `SOURCE · UNHCR · JUN 2026`.
   - Contested numbers carry their attribution ("GAZA HEALTH MINISTRY", "UN HRMMU").
   - Never show a number the narration contradicts.
4. **Zones:**
   - The chrome takes the top band (y < 110). Captions sit in the bottom band (y > 880 while narration is on screen).
     The progress bar is at y 1046.
   - The content area is x 120–1800, y 130–860. Keep text off the busiest part of a plate, or put a `scrim` behind it.
5. **Density:**
   - At most one headline number plus one supporting graphic at a time.
   - Titles: kicker (`pill`) plus a serif headline (`FONT.serif(800)`, 64–96 px) on each story's first line, for
     about 2.5 s.
6. **Plates:**
   - Each segment's plates are listed in its notes in `tools/plates_map.json`.
   - Show a plate with a slow Ken Burns move (`z: [1.02, 1.08]`), and use `duo: 0.4–0.6` when type sits on it.
   - Alternate plate and globe within a story so it breathes: plate, then globe with data, then plate.
7. **Palette:**
   - Paper and white text on night; vermilion `RED` for the one hot value per frame; `TEAL` only for hopeful numbers.
   - Plates are already two-ink, so do not tint them.
8. **No real-person likeness, no flags, no logos** in anything you draw.

## Verify (every iteration)
From `app/`:
- `node scripts/render.mjs sheet --times a,b,c --cols 3 --out ../out/seg/<group>_vN.png`, then Read the image.
  Take the times from `data/vo.json` word starts.
- `node scripts/render.mjs stills --t a,b --out ../out/seg/<group>` for full-res checks.
- `node_modules/.bin/tsc --noEmit -p .` must be clean for your file.

Never pass `--url`. Edit only your own segment file.

## Notes from the first plate test
- The plates are **light**: warm paper skies, two inks. White type over them needs `duo: 0.5–0.65`, or an `INK` type
  set on the paper area (often better: editorial, like a magazine cover). A dark `scrim` on cream reads as a grey
  smudge, so use a paper-coloured scrim (`scrim(c, x, y, w, h, 0.6, '243,239,230')`) behind ink type instead.
- Captions are always on while narration plays (bottom band). The chrome fades in after the cold open's last line.
- `research/SCRIPT_NOTES.md` lists the script lines that were cut and the `purpose` fields that are now stale. Never chart
  something the narration no longer says. The narration in `tools/script.json` is the truth for what is said.
- Times: segment windows are in `data/film.json`. Word times come from `data/vo.json` (`lines[].words[]`, each with
  `start` and `end`).

## SONG VERSION (supersedes the narration notes above)
The film is now a **music video** built like the ESCAPE VELOCITY remake. The soundtrack is a MiniMax-Music3 song,
"Under Strain": 97 BPM electroclash (MiniMax chose 97; the caption asked for 128). A female voice performs deadpan spoken-word verses that carry the facts, and
euphoric sung choruses.
- **Lyrics:**
  - Display lyrics: `lyrics/lyrics.txt`. Aligned word times: `data/lyrics.json`; each line's `section` is its segment id.
  - Segments: `data/film.json` (20 segments, built by `tools/segmap.py` from `tools/segments.json`).
  - `X.lines` / `X.W('Hormuz')` work on the song lyrics of your segment.
- **Pace:** story segments last about 5–15 s, one or two lyric lines each. One strong graphic per line, landing on its
  word. Choose the single best number for the line and print it with its source; there is no room for three.
- **Beat:** `X.beat()`, `X.bar()`, `X.tBeat(b)`, `X.tBar(b)` and `X.hit('kick')` give the 97 BPM grid. Cut plate moves,
  zoom punches (`post` → `o.zoom`) and entrances on downbeats where it serves the word; never at the expense of the
  word timing.
- **Chorus segments** (`pre1`, `chorus1`, `pre2`, `chorus2`, `chorus3`, `kind: 'chorus'`):
  - Captions are OFF, so you draw the sung lyric yourself as big EV-style typography: serif or grotesk, one phrase or
    word at a time, landing on its word.
  - Mark each drawn word with `X.mark(word)`.
  - Over the globe at night, spinning with the beat. "Still turning!" is the crowd answer, so make it the brightest
    moment, with a vermilion accent.
- **What to watch** (post-chorus): the five dated items are chanted. The calendar tiles land on each date word.
- Everything else (facts only from FACTSHEET.md with sources on screen, plates, globe continuity via `X.view()`,
  zones, palette) still holds.
