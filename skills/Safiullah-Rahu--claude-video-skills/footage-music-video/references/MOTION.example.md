# THE STATE OF AI · OCTOBER 2026 — motion-design brief for chapter animators

This is a data-journalism music video built on the ESCAPE VELOCITY engine. It has three layers:
- an EV-style electroclash song: deadpan spoken-word verses that carry **verified facts**, sung choruses, and a chanted list of dates;
- **royalty-free real footage** underneath: data centres, power grids, trading screens, crowds, orbital hurricanes, radiology;
- a **broadcast chrome** plus an **explaining layer** of cards, counters, charts, split-flap boards and CV boxes that land on the words.

You write the explaining layer for a few chapters.

Before you start, look at:
- the reference frames `ref/ev_*.jpg`, which are the visual language of the original ESCAPE VELOCITY;
- a finished set of chapters, if you need examples: footage-music-video's `examples/state-of-ai-chapters/*.ts` (read only, never edit).

## The facts come first
- **Source of truth:** `research/FACTSHEET_AI.md`. It has beat cards B01–B16, section 5 "Do not say", and section 7 "Lyric review corrections".
- Every on-screen number and label must be printed **exactly** as the fact sheet's "On screen" line gives it. Do not round, extend or add numbers.
- Each fact chapter shows its **source line** (`SOURCE · PUBLISHER · MON YYYY`) in small mono type, near the headline number, while that number is on screen.
- Use one headline number plus at most one supporting graphic per beat.
- Carry the caveats the fact sheet requires on screen, for example:
  - `IN TESTING · SAFEGUARDS OFF OR MISCONFIGURED` on B08 and B09;
  - `PROJECTION` on 2030 figures;
  - `UNLESS EXTENDED` on the export-pause and truce dates;
  - `ALLEGATIONS` and `INVESTIGATIONS, NOT FINDINGS` where they apply.
- **Neutrality:**
  - Name no winner and draw no crown or ranking.
  - When labs are named, use equal type in the fact sheet's order. Never lead with Anthropic: this film is made with an Anthropic model.
  - Use no company logos. Labs appear as plain text names only, and only where the fact sheet prints them.
  - Show no flags or seals, and no real person's likeness.
- The lyric says "AI". The chrome never adopts "SI" except to report the rename in B11.
- If a graphic idea needs a number the fact sheet does not have, drop the idea.

## What is already there (do not rebuild it)
`app/src/scenes/ev.ts` renders each frame in this order:
1. footage, or a black/white ground;
2. storyboard CV boxes;
3. **your chapter graphics**;
4. lyric type;
5. broadcast chrome;
6. a colour-halftone print pass on the footage only.

**Lyrics are drawn for you.**
- By default they are a top-left grotesk block. The current word is coral and future words are ghosted.
- Choruses use the masthead mode. The dates chapter uses `mass`.
- Don't draw lyric lines yourself unless the storyboard sets that line's mode to `none`. In that case you must draw its words on time and call `X.mark(word)` for each one.

**Chrome is drawn for you.** Its zones:

| Element | Position |
|---|---|
| Corner crosses | all four corners |
| `STORY nn / 16` | top-left (72, 66) |
| Title `THE STATE OF AI · OCT 2026` and spectrum | top-right |
| Split-flap headline board | top-right (x 1454–1830, y 130–235) |
| Left bar ruler | x < 80 |
| Ticker band | y > 1015 |
| Timecode | bottom-right (1824, 1004) |

The flap board already shows each story's two-row headline, from `countdown` in `storyboard.json`.

**Storyboard:** `storyboard.json` holds:
- shots, each with a `note` (the idea, with its B-beat id), `set` (default footage) and `clip`;
- chapters with `story` numbers;
- `countdown` flap states.

`out/board.json` holds the resolved times: shot t0/t1, every line with word times, and the flap states.

## Your contract — `app/src/ev/chapters/<group>.ts`
```ts
import type { Chapter, X } from '../x';
export const chapters: Record<string, Chapter> = {
  s05: {
    draw(c, X) { /* Canvas2D, logical 1920×1080, called every frame while t is inside the chapter */ },
    post(X, o) { /* optional: o.flash, o.zoom (punch-in), o.shake, o.invert … */ return o; },
    chrome(X) { return 1; /* optional: chrome opacity 0..1 */ },
  },
};
```

`X` is defined in `app/src/ev/x.ts`:

| Member | What it gives you |
|---|---|
| `X.t` | the current time |
| `X.shot` | the current shot (id, t0, t1, clip) |
| `X.ch` | the chapter span (t0, t1) |
| `X.L(q, nth)` | the lyric line containing q |
| `X.W(q, k, nth)` | word k of that line (negative k counts from the end) |
| `X.at(anchor)` | the time of an anchor |
| `X.S(shotId)` | a shot's window |
| `X.beat()`, `X.bar()`, `X.tBeat()`, `X.tBar()` | the beat and bar grid |
| `X.env(name)` | an envelope 0..1: rms, low, mid, high, vocal, drums, bass, other |
| `X.hit('kick'\|'snare'\|'hat'\|'vocal')` | decaying pulses |
| `X.px(box01)` | a source-footage box mapped to frame px |
| `X.track(label)` | a tracked subject's box |
| `X.u(a, b)` | progress between a and b |
| `X.ink` | 1 on white chapters: draw in ink instead of white |
| `X.mark(word)` | marks a word you drew yourself |

## Rules
1. **Pure function of `X.t`.** Keep no state between frames, and never use `Math.random`, `Date` or `performance`. For deterministic jitter, use `hash()` from `../../engine/util`.
2. **Anchor every time to lyric content.** For example, `const w = X.W('Nine major', 0)` then use `w.start`. Never write seconds. Shot windows come from `X.S('A02')`. The song is about 128 BPM, so a bar is about 1.9 s and lines are short: most fact chapters last only 3–7 s.
3. **Respect the zones.**
   - The lyric block lives top-left: x 72–1100, y 110–430.
   - Put graphics in the right two-thirds (x 1080–1830, y 250–990) and/or the lower-left (x 110–1000, y 560–990).
   - Never cover the chrome zones.
4. **One idea per line, and at most two or three elements on screen.**
   - Elements enter on the word they illustrate: outExpo over 0.25–0.45 s, counters `countUp`, lines drawn on, stamps slamming.
   - They hold, then leave fast (0.2 s) on the next idea or at the shot cut.
5. **Palette:**
   - white `WHITE(a)`;
   - cream paper cards `C.paper` with ink `INK(a)`;
   - ONE accent, coral `CORAL(a)`, for the hot value;
   - **mint `C.mint` for the hopeful bridge (s15, s16) instead of coral**;
   - dark panels `rgba(12,13,16,0.9)`.

   Use no other colours, no decorative gradients and no glows. Fonts come only through `FONT.grot(w)`, `FONT.mono(w)` and `FONT.flap(w)`.
6. **Legibility over any footage.** Text sits on a card or panel, or is big and bold. Hairlines are 1–1.5 px. Source lines are mono, 11–13 px, on the panel.
7. **Use the kit before inventing.**
   - `../kit`: text, label, typed, hair, drawOn, dotLeader, cross, barcode, stamp, waveBars, countUp, meter, sparkline, life/appear/vanish/win.
   - `../cards`: showCard, panel, figure, cvBox, connector, careLabel, spark.
   - `../flaps`: drawBoard, pad.

   Read those files. Write extra primitives locally in your own module, and don't edit shared files. List any wishes in your report.

## Verify (every iteration)
- **Sheet** (from `app/`): `node scripts/render.mjs sheet --times 31.2,32.5,34 --cols 3 --out ../out/dev/<group>_v1.png`, then Read the PNG.
  - Take the times from `out/board.json`: the word starts of the numbers you land, mid-shot, and just before cuts.
- **Single stills:** `node scripts/render.mjs stills --t 33.4 --out ../out/dev/<group>`.
- **Typecheck:** `node_modules/.bin/tsc --noEmit -p .`. Fix every error in YOUR file.
- **Shot tweaks** (cam, grade, cv, speed, or line specs such as `annotation`) go in `storyboard.d/<group>.json`, never in `storyboard.json`.
  - Shape: `{ "shots": { "<id>": {...} }, "lines": { "<text>": {...} } }`.
  - A line `annotation` is a typed mono caret note under the lyric block. Use it for the source line when you don't draw a panel. It must be factual and come from the fact sheet.
