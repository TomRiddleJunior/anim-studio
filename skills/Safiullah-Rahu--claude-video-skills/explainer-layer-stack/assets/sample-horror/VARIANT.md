# VARIANT — layer-stack · horror ("What it really takes to run a haunted house")

Film: `out/layer-stack-horror.mp4`, 1080×1920, 30 fps, 89.7 s, 14 chapters. Base: `samples/layer-stack/`.
Built 2026-10-29 for Halloween posting.

## The recipe in one line
Play the format completely straight for 13 chapters (same canvas, presenter, chapter tags, karaoke captions, a build
on every stressed word, red stamps, stack rows, crowd blow-up, halftone wipe), dim the paper a little from about the
55 % mark, then let the **callback** be the horror: the very first fix (the headcount) comes back wrong. The lights go
down, pale ink on near-black, the clickers read 12 out / 11 in, one tall faceless figure walks out last, silence,
a 6-frame blackout, one sting, a red "12 / 11" stamp, and the chapter tag turns into `// 15 — count again`.

## What changed against the base format

| | base layer-stack | horror variant |
|---|---|---|
| length · chapters | 131 s · 20 | 89.7 s · 14 (13 + the turn) |
| script | 434 words, "Then / So you add / Now" ladder, recap "Months later, X is …", callback = failure 1 returns through a Friday edit | 296 words, same ladder and beat map compressed; recap "A year later, Hollow Pines is safe, timed, counted, and very, very scary." (a seasonal attraction comes back next October; also Whisper heard "Months later" as "Once later"); callback = the first fix (clicker headcount) returns wrong, split into three short lines |
| delivery | am_puck 1.24, gap 0.1 | am_puck 1.22, gap 0.1; last chapter slows: 1.10 → 1.00 → 0.94 with 0.6 / 0.75 s gaps; 5.2 s tail (1.45 s of true silence + blackout + 3.9 s hold) |
| canvas | `#faf8f4`, never changes | `#faf8f4` for ch. 01–08, then one small step per chapter cut: 09 `#f5f2ec`, 10 `#f0ece5`, 11 `#ebe7df`, 12 `#e7e2d9`, 13 `#e3ded4`, 14 (day) `#ddd7cc` — **deliberate deviation**, changed only on cuts |
| last chapter | same paper, red stamp on white | a 0.45 s crossfade (on "closing") to a night copy of the same set: `#121216` canvas, pale ink `#d4cec2`, dark fills, EXIT sign off; only the OUT counter glows (`#ff4b33` + blurred red glow); 6-frame fade to black on the blackout; stamp red on black |
| captions | dark / grey on white | identical system; chunks after the lights go down switch to pale `#ece7dd` / grey `#77736c`, selection box navy `#2a3550` with `#5b84d6` line |
| sound | UI SFX, no music | UI SFX unchanged for most of it; a synthesized bed (`tools/score.py` → `audio/bed.wav`, `music_file`): low beating drone from the ch. 09 cut (49 / 49.55 Hz, 98 / 98.9 Hz, 147 / 156 Hz + band-passed air, 9 s fade-in), +5 dB swell on the lights-down, a lub-dub heartbeat from "match" to the end of the last line (period 0.92 → 0.72 s), true silence 1.45 s, one sting on the blackout (sub boom 80 → 30 Hz + a dissonant saw cluster 311/330/466/494/740/784/1109 Hz + a noise hit + 2.4 s reverb). `sound.json`: `music_under_voice_db -23`, `duck_db 4`, `sfx_db -4`, `lufs -14.2` |
| characters | admin presenter, browser-window mascot | same presenter; the mascot becomes the attraction: a red barn on legs with the same dark screen face (warm lantern glow instead of cyan) and a witch hat for `hatOn`; three original scare actors (sheet ghost, sack-head scarecrow, pumpkin head); one tall faceless figure |
| ending | stamp "ONE WRONG DIGIT" | stamp "12 / 11" (sub "OUT / IN") on black, then the tag `// 15 — count again` |
| re-watch device | — | the figure is hidden twice before the turn: a pale shape among the pines in ch. 01 ("hire three scare actors" — four figures stand there) and a grey head in the back row of the Halloween crowd (ch. 11); the final tag sends people back to count |

Ladder used (each failure gets a red stamp, each fix a stack row): lost guest asleep in a coffin (LOST GUEST) →
HEADCOUNT · actor jumps too early, the queue sees the trick, one kid waves (SPOILED) → TRIGGER PADS as the 4-stage
pipeline (STEP · DELAY · BUZZ · BOO, with a trigger-log terminal) · benefit chapter · fog sets off the alarm, three
fire trucks join the queue (FALSE ALARM) → HAZE · DETECTORS · guest panics, the exit is painted to look like a wall
(PANIC) → SAFE WORD · Halloween sells out, 2,000 people, the maze jams (crowd blow-up into a red "2,000") →
TIMED TICKETS · a year later (halftone wipe, full checked stack) · one Friday at closing.

## Kit additions
`kit-horror.js` (new file, loaded after `kit.js`):
- `K.canvasTo(t, fill, dur)` — set or tween the canvas colour (needs `K.bgRect`, below).
- `K.NIGHT`, `K.inNight(fn)` — build anything with the night palette; kit functions read `C.*` at call time, so the
  same set can be built twice (day + night) and cross-faded, with identical `X.every` motion keeping both in sync.
- `K.pine`, `K.barn(p, x, y, w, h, {sign})` — scenery; the barn is front-oblique with a gambrel gable and X-braced door.
- `K.haunt(p, x, y, s, {face, hat})` — the product mascot (same API as `K.mascot`, extra face `spooky`, witch hat).
- `K.scarer(p, x, y, s, 'ghost'|'scarecrow'|'pumpkin')` → `.boo(t)` (hop, arms up, mouth).
- `K.figure(p, x, y, s, {fill, line, lineOp, eyes})` — tall, thin, faceless; `.head` group can tilt. No gore.
- `K.guest(p, x, y, s, {skin, shirt, pants, hairC, cap, eye, back})` — full-body person; `K.walk(el, x0, x1, y, t0, t1)`
  walks it (legs swing, body bobs; pure function of t).
- `K.clicker(p, x, y, s, {label, n, fill, face, metal})` → `.press(t, value)`; digits are a pure function of t.
- `K.headBoard(p, x, y, w, h, {in, out, delta})` → `.inN`, `.outN`, `.delta`, `.dot`.
- `K.maze(p, x, y, cols, rows, cell, seed)` → `.cell(c, r)`, `.route` (entrance → farthest dead end).
- `K.coffin`, `K.fog(p, x, y, t0, t1, {dx, dy, n, r, op})`, `K.fogMachine(…, {label})`, `K.detector` (`.led`),
  `K.firetruck`, `K.pad` (`.press(t)`), `K.earpiece` (`.buzz(t)`), `K.beacon` (`.on(t)`), `K.wall(…, {dx, dw})`
  (`.open(t)`, `.seam`), `K.floorplan` (`.dots`), `K.pumpkin`, `K.booBubble`, `K.redGlow(p, cx, cy, r, op)`.

`kit.js` edits (small, marked "horror variant"): `K.canvas` keeps the background rect as `K.bgRect`; `K.captions`
takes `night: {t, dark, grey, selFill, selLine, handle}` (chunks starting after `t` are drawn pale) and `lastHold`
(seconds the last chunk stays up; default 1.6).

## Gates (brief D) — measured on `out/layer-stack-horror.mp4`

| metric | gate | measured |
|---|---|---|
| duration | 70–100 s | 89.7 s ✓ |
| WPM (captions.srt, 296 words) | 175–205 | 198.1 ✓ |
| build events / min (`events.py`, peaks > 5 · > 1.5) | 75–110 | 82.3 · 103.0 ✓ |
| motion mean / p90 | ≥ 4.5 | 5.09 / 9.21 ✓ |
| brightness, whole film | 0.65–0.92 | 0.781 ✓ |
| brightness, first 70 % (0–63 s, analyzer method) | ≥ 0.85 | 0.899 ✓ (lowest single second 0.835 at 1–3 s: the dark hallway on the opening postcard) |
| colourfulness | 12–35 | 20.9 ✓ |
| loudness | −14.2 ±1 LUFS | −14.3 ✓ |
| analyzer hard cuts | (keep honest) | 0; max ffmpeg scene score 0.28 (< 0.33) |
| scene changes / min | — | 2.01 = 3: crowd blow-up, halftone wipe, lights-down crossfade |
| YAVG dips (`v < 0.6·min(neighbours)` or `v < prev − 50`) | explain each | 0 flagged; the blackout is a 6-frame fade (YAVG 37 → 20), the halftone wipe ramps over 25 frames |
| hold_frac | — | 0.082 (the 3.9 s hold on the final stamp is deliberate) |

Mix check (`tools/levels.py`): voice −22 dB RMS; drone under speech −46 dB (≈ −23 dB under the voice), heartbeat in
the gaps −27 dB on the final master, silence before the blackout −49 dB, sting −16 dB (about speech level, louder
peaks).

## Gotchas found while building
- **GSAP turns numeric strings into numbers** in `X.tl.set(el, {textContent: '0009'})` → shows "9"; `'0.0'` shows "0".
  Use an `X.every` lookup for padded digits (done in `K.clicker`) or a non-numeric string ("GO").
- `K.flicker` only writes inside [t0, t1]; a worker that starts after t1 shows the initial text. Pin the final value
  with an `X.tl.set` at t1.
- Never tween a group that carries a `transform` attribute (the first `K.earpiece` shook its own translated group and
  jumped to the origin). Every new prop has an outer transformed group and an inner animatable one.
- A hard chapter cut from the light recap to a set with a large saturated block (the red barn wall + dark board) scored
  0.41 and counted as a cut; sliding the wall and board in 1–3 frames after the cut brought it to 0.25.
- The red barn behind the red "2,000" made the number unreadable: big set pieces must fly out on the blow-up.
- Kokoro + Whisper: "scarers" was heard as "scanners" / "scorer" even though misaki's phonemes were already right
  (`skˈɛɹəɹz`), so the script says "scare actors"; "Months later" was heard as "Once later" (also as the base film's
  line shape), so the recap says "A year later".
- `sound.py` levels a `music_file` against the music under speech. Keep the heartbeat and the sting inside the bed
  file: as an SFX the heartbeat would become the loudest SFX and the normaliser would push every UI sound down.
- `X.word` matches prefixes ("a" also matches "and", "out" matches "outside"); anchor builds on distinctive words.
- Day/night copies double the SVG for one chapter; render speed stayed ~23 fps full-res with 2 workers.

## Files
`scene.js` (14 chapters), `kit.js` (base kit + 3 small edits), `kit-horror.js` (additions), `script.json`,
`sound.json`, `tools/score.py` (bed), `tools/yavg.py`, `tools/bright70.py`, `tools/levels.py`,
`tools/compare_beats.py`, `FACTS.md`, `POST.md`, `out/qa/` (metrics.json, events.json, yavg.json, sweep_01–04.jpg,
compare.jpg).
