# Scenes: the starter library, the planner, and the reference plates

## Starter scenes (`app/src/scenes/`)

All of them: work in dark and paper styles (`plate()`), read defaults from `style.json` → `scenes.<name>`,
render every lyric line that starts in their window with per-word sync, snap to the beat grid, are pure functions
of `t`. Use them as a first cut and as code to copy from; bespoke plates replace them.

| scene | what it is | params (defaults) | good for |
|---|---|---|---|
| `title` | masthead: rules drawn by the motif, artist typed, title rising word by word on beats, tempo/metre/key/length row; early lines sung small | `size` 300, `weight` 900, `width`, `hatch`, `meta`, `invert` | intros |
| `lines` | Swiss-grid karaoke: the line large, glyph wipes, accent on the sung word + tracking rule, next-line cue, mono annotations, downbeat punch | `align` left/center, `size` 170, `weight` 800, `width`, `hatch`, `grid`, `cue`, `annotate`, `case`, `invert` | verses, anything |
| `wave` | oscilloscope (dark) / pen plotter (paper) trace from the envelopes with persistence echoes; the line rides the wave glyph by glyph | `size` 84, `echoes` 7, `grid`, `invert` | verses, instrument idioms |
| `writer` | the line written by the motif in a single-stroke font on ruled paper; rows scroll like a page | `font` (stroke font), `size` 150, `rules`, `invert` | intimate verses, ballads, letters |
| `tunnel` | corridor of hairline frames; camera advances one frame per beat (hold, snap), each line hung on a frame ahead | `frames` 16, `spacing` 4, `invert` | driving verses, builds |
| `pressure` | copies of the line packing the title-safe box on every kick while the type condenses and thickens; the sung line on a band | `maxRows` 26, `guides`, `invert` | pre-choruses, build-ups |
| `slam` | one full-frame word per sung word, widest cut for short words, mono caption rail; `n` 1–4 escalates (clean → accent field → hairline breakdown → maximal) | `n`, `weight` 900, `case`, `rail`, `invert` | choruses / hooks |
| `particles` | each word assembles from drifting atoms when sung, released when the next line arrives | `size` 190, `step` 5, `dot` 2.2, `invert` | bridges, dreamy parts |
| `interlude` | audio-reactive instrument: `rings` (kick shockwaves, bar hand), `bars` (engraved spectrum), `flow` (curl-noise streamlines) | `variant`, `label`, `invert` | instrumentals, breaks, drops |
| `outro` | last lines centred, end card (title, rule, artist, credits), collapse into the motif, fade to the ground | `size` 140, `weight` 800, `fade` 1.6, `invert` | endings |

Shared: `_kit.ts` (`plate`, `Ground`, `label`, `hair`, `timecode`, `motifHead`, `motifSparks`).

## The planner (`gmv.py plan`)

Maps `data/audio.json` sections to entries: intro → `title` (dropped if < 2 bars), verse k → `lines`, `wave`,
`writer`, `tunnel` (cycling), pre → `pressure`, chorus k → `slam` n=k, post / bridge → `particles`,
break / drop / part → `interlude`, outro → `outro`. A line belongs to the section holding its start + 2 beats
(short pickups join the next section); each window starts on the beat before its first line (`cut('…')`) or on
the section downbeat when nothing is sung across it; instrumentals after a held note start on the first downbeat
after it (`after('…')`); sections longer than 16 bars split at the line nearest the middle with an alternate scene.
Mark `timeline.ts` with `// EDITED` in its header once you edit it (plan then refuses to overwrite without --force).

## Writing a bespoke plate

Copy the closest starter (or start from the template in engine.md §4) to `scenes/<plate>.ts`, rename the class,
register it, and design against the treatment row. Keep helpers in `scenes/<plate>-*.ts`. Typical structure:
`init()` precomputes layouts/geometry for the lines the window owns; `render()` draws background (FSPass/Ground)
→ world (LineBatch / three.js scene / raymarch) → lyric layer (Layer2D) → returns post overrides.

## The reference plates (mexicat/pdoom-video `app/src/scenes/`)

Clone it (`git clone https://github.com/mexicat/pdoom-video`) and read these when you need the technique. They
use the original palette names: ink→`bg`, ink2→`bg2`, graphite→`dim`, ash→`mid`, bone→`fg`, signal→`accent`,
ember→`hot`, blood→`deep`, acid→`rare` (GLSL `C_INK`→`C_BG`, `C_BONE`→`C_FG`, `C_SIGNAL`→`C_ACCENT` …), and
fonts `F.archivo(w, wt)`→`F.display(w, wt)`, `F.serif`→`F.text`, `F.mono` unchanged; their HUD P(doom) code is gone.

| file(s) | techniques worth stealing |
|---|---|
| `open.ts`, `open-geo.ts` | plotter pen drawing primitives on the beat, TikZ listing typing, camera dive onto a detail, strokes re-routing into PCB traces |
| `loss.ts` | plot axes drawing in, text on a curve with per-word appearance, a plunge from 2D chart into a 3D contour landscape, 180° world roll |
| `prompt.ts`, `prompt-data.ts` | tokens typed on the sung words with tiny probability distributions, caret, ⏎ launching the next plate; three variants from one module |
| `hook.ts` | full-frame word slams, rolling digits, per-hook escalation and exits that land on the cut, hand-off geometry to the next plate |
| `room.ts`, `room-geo.ts`, `room-shrooms.ts` | exponential branching explosion, crash-dolly camera cutting on every beat, stamped signage, a raymarched hairline room, the rare-accent moment |
| `shoggoth.ts`, `shoggoth-glsl.ts` | raymarched SDF creature rendered as engraving hatching, an x-ray reveal band, name tags with leader lines, a flatline hand-off |
| `spacetime.ts`, `spacetime-lens.ts` | oscilloscope persistence, a black hole lensing typography, corkscrew camera through a vortex |
| `ascent.ts` (+ `-eye`, `-note`, `-odo`) | engraved eye, stock chart with the motif as price, banknote guilloche, an odometer of digit drums |
| `bureau.ts` | paper form with typewritten fields, rubber stamp slam, mirrored "backward" typesetting, a stuttered "repeat", diagram struck through |
| `leftturn.ts` (+ `-gantt`, `-map`) | roadmap + whip pan, survey map whose contours are a face, Gantt schedule with stamps and a playhead |
| `paperclips.ts` (+ `-geo`, `-glsl`) | duplication on the beat into a raymarched lattice, an out-of-office card typed as sung |
| `fuse.ts`, `fuse-pitch.ts` | a burning fuse with text charring to ash, a guitar-string line bending to the singer's actual pitch |
| `stack.ts`, `stack-kit.ts` | infinite stack of technical drawings, falling one block per beat, a word that "disobeys" the karaoke |
| `dense.ts` (+ `-askew`, `-gpu`, `-press`) | typographic pressure in safe-area guides, a 100k-cell GPU grid, a tilting world rolled on kicks |
| `loom.ts` (+ `-glsl`, `-tree`) | a tree of continuations generated token by token, [MASK] blocks unmasking, Droste recursion |
| `ilya.ts` (+ `-glsl`, `-room`) | raymarched room in white line, a laptop closing word by word, curtains collapsing to the motif |
| `outro.ts` | numbers escalating per beat to ∞/NaN, equation typesetting, a rewind montage of every plate, a seamless loop to frame 1 |
| `_motifs.ts` | the spark head and deterministic spark particles (the `_kit.ts` motif is a generalized copy) |
