---
name: explainer-lofi-mascot-lines
description: "Makes a vertical 9:16 lo-fi 'quiet lines' mascot reel (~22 s) in the format of a viral Instagram account (@sadgoose42, one sentence frame with six endings, 811k likes): six painterly night scenes of one small animal mascot, ~3.5 s each, hard cuts on the bar of a slow lo-fi beat (a café window in the rain, floating on its back in a puddle with headphones, curled in bed seen from above, standing still while a blurred crowd streams past, sprawled on a bed in a warm lamp-lit room with a rainy city window, wrapped in a blanket on a window seat at night); one small centred white line per scene (sample: 'There is a calm in the second cup.') read once by a soft voice; warm practical lights against cool rain, grain, a slow camera drift with parallax; ends hard so it loops. Everything is painted in code on a Canvas 2D (soft gradients, brush-stroke texture laid only on painted pixels, glows, bokeh, rain streaks, drops on glass, ripples, steam, pre-blurred crowd sprites) with a posable otter mascot (six poses) and an original synthesized 70 BPM lo-fi bed (tremolo electric piano, boom-bap kit, vinyl crackle) plus per-scene rain and foley; two mixes (full + no-music). Use for 'lofi reel', 'cozy rainy night animation', 'there is a calm in…', 'quiet reminder reel', 'mascot mood reel', 'sad goose style' (with your own animal), 'self-care lines over illustrations', 'lofi animal vibes', or any short calm loop of one character in a few painted scenes with one line each. Builds on explainer-engine (TTS, QA) and hyperframes."
---
# Lofi mascot lines — one small animal, six quiet places, one line each

Reverse-engineered frame by frame from one Instagram reel (**@sadgoose42**, `DfTu_Jcs-NV`, 22.4 s, 810,561 likes,
885 comments; sources in `references/sources.md`). The format is a **mood loop**: a recurring mascot in six painted
night scenes, a slow lo-fi bed, and a sentence frame repeated six times with a different ending ("There is a ___ in …"
plus six short endings, each about something the mascot is quietly doing or not doing). It works because it asks
nothing: no hook question, no CTA, just a line the viewer finishes in their head.

Sample: `the sample film (the render is not included in this repository)` (22.3 s) — a small river otter:
"There is a calm in the second cup / in drifting / in switching off / in standing still, while everyone rushes by / in
an early night / in being here." Its `SCRIPT.md`, `SAMPLE.md` and `POST.md` are in
`assets/sample/`, a copy of the project (its `out/qa/` and cover are not included).

## 1. Signature traits
- **One mascot, always calm**: eyes closed or half closed, a small smile, doing nothing in particular (sipping, floating,
  lying, standing still). Accessories that mean "me time": headphones, a mug, a blanket, a hood.
- **Six scenes, one per line**, each a different place and a different light: a café window (teal rain + warm lamp),
  a top-down puddle (slate blue), a top-down bed (moon blue), a street with a passing crowd (grey, desaturated), a warm
  bedroom with a rainy city window (amber + navy), a window seat at night (violet blue + one warm plaid).
- **The line**: small (29–30 px at 1080), white, centred high (31 % of the height), wrapped in a narrow column so most
  lines break in two; read once by a soft low voice; no keyword colour, no animation beyond a fade.
- **Living stills**: the camera barely moves (motion mean 2.7); life comes from rain, ripples, steam, a kicking foot,
  passing blurred people, a breathing blanket.
- **Lo-fi bed** at ~70 BPM, continuous across the cuts, hard-cut at the end so the reel loops.

## 2. Measured metrics (source vs sample vs gate)
Source: the engine analyzer's metrics + rea + own measurements (not included). Sample: the owner's QA (not included).

| metric | source | sample | gate |
|---|---|---|---|
| duration | 22.4 s (video 22.27) | 22.3 s | ±15 % |
| cuts | 5 hard cuts (3.60, 6.53, 9.93, 14.60, 18.53 s); the analyzer counts 0 | 5 hard cuts (bar lines) · analyzer 2 (5.38/min) | — |
| scene changes / min | 10.72 (median scene 3.83 s) | 8.07 (render 1: 10.76; explained: the legible crowd shares the bedroom's palette) | ±20 % |
| WPM | 118 (44 words) | 126.5 (47 words, +7 %) | ±20 % |
| brightness · colourfulness · motion | 0.286 · 25.7 · 2.71 | 0.340 · 32.7 · 4.23 (the crowd scene moves most) | ±30 % |
| loudness | −14.1 LUFS | −13.8 LUFS, −2.9 / −3.3 dBTP (full / no-music) | −14 ±1, TP ≤ −1 |
| voice over bed | ~6 dB (rea stems: voice −14…−21 dB, music −20…−27 dB) | 11.7 dB (music alone 13.3 dB under) | ≥ 10 dB (brief) |
| first word / first line on screen | 0.0 s / 0.0 s | 0.24 s / 0.12 s | ≤ 0.4 s |
| Whisper `small` | 6/6 lines | 6/6 lines, recall 1.00 | every line |

## 3. Beat map and script formula
| scene | source t (s) | source line (shape) | sample t (s) | sample line |
|---|---|---|---|---|
| 1 café window, rain | 0.00–3.60 | frame line + 2–4 word ending | 0.00–3.43 | There is a calm in the second cup. |
| 2 floating in a puddle (top-down) | 3.60–6.53 | frame line + 2–4 word ending | 3.43–6.86 | There is a calm in drifting. |
| 3 in bed (top-down) | 6.53–9.93 | frame line (contracted) + 2–4 word ending | 6.86–10.29 | There is a calm in switching off. |
| 4 still in a passing crowd | 9.93–14.60 | frame line + the longest ending, split over two captions | 10.29–15.43 | There is a calm in standing still, / while everyone rushes by. |
| 5 sprawled on a bed, warm lamp | 14.60–18.53 | frame line + 2–4 word ending | 15.43–18.86 | There is a calm in an early night. |
| 6 window seat at night | 18.53–22.27 | frame line + a one-word ending (the shortest, most final) | 18.86–22.30 | There is a calm in being here. |
- **Formula**: one fixed frame ("There is a ___ in …") + six endings, 5–9 words each, the longest one split across two
  captions in the longest scene; the last line the shortest and most final. ~45 words → ~120 WPM overall.
- The ending of each line matches what the mascot is doing in that scene (the cup, drifting, the phone face down,
  standing still, the bed, the window).
- **Voice**: soft, low, close, unhurried (Kokoro `am_michael` at 0.76; 0.86 for the long line), each line starting
  0.1–0.25 s after its cut and ending ~0.5 s before the next.

## 4. Visual system
- **Painterly in code** (`assets/kit/lofi-kit.js`): every static layer is painted once into an offscreen canvas with an
  80–90 px bleed (seeded, so every render worker paints the same pixels), then a brush-stroke texture (dark + light
  stroke tiles, made once) is laid with `source-atop` so it only lands on painted pixels; far layers are pre-blurred
  (2–4 px) for depth; foreground props are blurred more (4–5 px).
- **Light**: one warm practical per scene (pendant lamp, street lamp, doorway, bedside lamp) as additive radial glows
  and soft cones, against cool rain light; bokeh for out-of-focus city lights; a vignette (0.55) and animated grain
  (overlay 7 %).
- **Palettes**: café `#1b3a44`/`#2a5560` + shop orange `#e08a45`; puddle asphalt `#2e3743`, water `#47678c`→`#2c4566`;
  bed `#151c38` + sheets `#5b6fa5`, light patch `rgba(130,160,235,.3)`; street `#3a3b44` + door amber; bedroom `#262b40`
  + lamp `#e0b070`, blanket `#4c5a45`; window seat `#20264d`→`#373e70` + plaid `#a8432c`.
- **The mascot** (otter): fur `#7b5134` (dark `#55361f`, light `#a37650`), cream muzzle/belly `#e8d6b8`, nose `#2a1a12`;
  wide head with side ears, cheek puffs, whiskers, closed-arc or half-closed eyes, blush; ~25–40 % of the frame height.
- **Caption**: Inter 500, 30 px / 1.32, `#f7f4ee`, a 440 px column, centre y 600 (31 %), soft shadow
  (0 1px 2px .45 + 0 0 18px .35); fade in 0.28 s, out 0.22 s. Nothing in the bottom 20 % except scenery.

## 5. Shot grammar and transitions
- Six shots, **hard cuts** on bar lines (70 BPM → 3.43 s; the crowd scene 1.5 bars). Camera angles alternate: eye
  level (café) → top-down (puddle, bed) → eye level (street, bedroom) → front (window). Mascot centred or on a third.
- Each shot drifts: zoom 1.00 → 1.03–1.04 (in-out ease) plus a 10–30 px pan; layers move by depth (background 0.5,
  middle 0.8, mascot 1.0, foreground 1.25–1.3), which reads as parallax.

## 6. Motion grammar
- Breathing (body scale ±1.2 %), a slow head sway, ear twitches, a kicking foot and a swaying tail; steam (three puffs
  cycling), rain streaks (seeded, 1100–2100 px/s), drops on glass with a few sliding trails, raindrop ripples (expanding
  ellipses), rings round the floating mascot, a paper boat, a passer-by outside, curtains swaying, lights flickering a
  few percent. Nothing snaps; no text animation beyond the fade.

## 7. Caption system (`tools/build.py`)
- One caption per scene (two for a split line), shown from the voice's first word −0.12 s until 0.35 s before the next
  cut (or the line end + 1.2 s); same style for every line; the SRT carries the same text for the WPM measure.

## 8. Sound (`tools/score.py`)
- Source: a quiet low voice reading each line (~6 dB over the music) over a stock-sounding lo-fi bed (70 BPM, C major),
  one small pop; the music is hard-cut at the end.
- Sample: an original lo-fi bed at 70 BPM in F (Bbmaj9 · Am7 · Gm9 · C9sus4 · Fmaj9 · Dm9 · Bbmaj9, one chord per bar /
  scene): tremolo electric piano rolled on 1 and re-struck on the 'and' of 3, sine bass, soft boom-bap kit with swung
  hats, sparse bells, tape wow, a 5.2 kHz low-pass, vinyl crackle, a little reverb; drums drop in the last bar. Per-scene
  rain (dull behind glass, open outdoors, on the window), room tone, and foley on visible actions (the cup, water lapping
  and plinks, a blanket rustle, footsteps and murmur of the crowd, a page turn and the lamp hum, the mug on the sill).
- Voice 11–13 dB over everything (the brief's gate; the source sits ~6 dB over its music). Two masters at −14 LUFS,
  TP −2 dBTP: `score/final.wav` (+ `assets/audio/final.m4a`) and `score/final_nomusic.wav`.

## 9. Retention devices
- A finished painted still on frame 0 with the line already fading in; a new place every 3.4 s; the repeated sentence
  frame (the viewer completes it); the split line that holds the middle; a hard end that loops into the first scene; a
  caption that asks "which one did you need tonight?" for comments.

## 10. Do / don't
- **Do**: one mascot with closed eyes in every scene; one warm light against cool rain; the line high and small; cut on
  the bar; keep the mascot big (25–40 % of the frame height) — the first pass had it at 12 % and the scenes read empty.
- **Don't**: animate the text; use keyword colours; put the line over the mascot's face; let the brush texture read
  as diagonal rain (first pass: alpha 0.5 looked like scratches; 0.2 reads as paint); put a dark shadow line across the
  mascot's face (the bed's window cross did).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-lofi-mascot-lines/assets/template my-lofi && cd my-lofi
# 1) vo/script.json: six lines with "at" = cut + 0.15 (cuts on bars: 60/BPM*4); "split": "<word>" to show a line in two parts
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I "engine/audio/tts.py" vo
python -X utf8 -I tools/build.py                 # vo-data.js, captions.html, world.html, index.html, out/<name>.srt
# 2) assets/lib/film.js: six scenes {paint() -> this.bg/mid/fg layers, cam(u) -> [zoom, panX, panY], draw(c, lt, {px})}
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I tools/score.py    # both mixes
bash tools/snap.sh 1.5,5,8.5,12,17,20.5          # one still per scene (locked)
bash "tools/render_locked.sh" "$PWD" out/<name>_master.mp4 delivery
FILM_DUR=22.3 bash "tools/with_render_lock.sh" bash tools/deliver.sh
bash "tools/with_render_lock.sh" bash tools/qa_all.sh
python -X utf8 -I tools/cover.py 22.1 "There is a calm in being here."
```
- Kit API (`LOFI`): `LOFI.canvas`, `LOFI.brush(ctx, kd, kl)` (texture on painted pixels), `LOFI.grain(ctx, t, a)`,
  `LOFI.vignette`, `LOFI.glow`, `LOFI.lin/rad` (gradients), `LOFI.rr`, `LOFI.blob(ctx, pts, jitter, seed)` (hand-painted
  closed shapes), `LOFI.rain(ctx, t, {seed,n,area,speed,len,slant,col,lw})`, `LOFI.drops`, `LOFI.bokeh`, `LOFI.steam`,
  `LOFI.otter(ctx, pose, {x, y, s, t, eyes, rot, paws})` with poses `cafe | float | curl | stand | sprawl | sill`,
  `LOFI.head`, `LOFI.paw`, `LOFI.tail`, `LOFI.headphones`. A new mascot: write a new `head()` and swap the body colours;
  the poses are bean bodies, tube limbs and a tapered tail, so most animals (cat, fox, red panda, frog) fit.
- Film API: `layer(paint, {blur, kd, kl})` paints a bleed canvas once; `px(c, depth, fn)` applies the camera at a depth;
  `LOFI.char(ctx, x => LOFI.otter(x, pose, o), {lights: [[x, y, r, rgba]], shade})` draws the mascot into a buffer,
  lays the brush texture on it and lights it with source-atop washes, so it sits in the painted scene.
- Performance: 22.3 s renders in ~65 s at `delivery` with 2 workers (static layers painted once).

## 12. Gotchas
- **Paint static layers once** (in `ready`), not per frame: six full-frame blurred layers per frame would cost seconds.
- **Seed everything** (`rng(seed)`): workers render different frame ranges; unseeded noise flickers at the joins.
- **`ctx.filter = blur()`** on an offscreen canvas is the cheap way to pre-blur a layer or a sprite; never per frame.
- **Clip window contents** (rain, drops, passers-by) to the glass rectangle or they draw over the wall.
- **Dark on dark**: the first crowd pass (near-black, 10–20 px blurred silhouettes) read as brown haze; draw passers-by as
  people (hair, a face tone, a scarf, a coat, legs, an umbrella or a bag), blur 4–9 px, 50–80 % alpha, two motion-blur
  ghosts. Expect the scene-change count to move with the crowd's palette (render 1: 4 changes, render 2: 3).
- **Analyzer cuts**: between two dark painted scenes the analyzer may count 0 cuts (it did on the source); report the
  real cut count from the cut list.

Files: references/sources.md · assets/kit/lofi-kit.js · assets/template/ (runnable project: index.html, compositions/,
assets/lib/{lofi-kit.js, film.js, vo-data.js}, assets/fonts/, assets/audio/final.m4a, vo/script.json + vo/data/vo.json,
tools/) · assets/sample/ (the otter project with SCRIPT.md, SAMPLE.md, POST.md; out/qa and out/cover.jpg are not included) · tools/ (build.py,
score.py, qa.py, qa_all.sh, deliver.sh, deliver_qa.sh, whisper_check.py, cover.py, snap.sh, tile.py, and the analysis
scripts spec_zoom.py, music_probe.py)

## Appendix A — source analysis (`DfTu_Jcs-NV`), frame by frame
Measured from the 1 fps and 4 fps sweeps, the first and last frame of every scene at 540 px, 10 fps strips around each
cut, the caption band at 5 fps across the whole reel, the analyzer and rea (this appendix stands in for
`references/analysis.md`). Caption wording is described, not quoted.

| t (s) | scene | picture | caption on screen | motion |
|---|---|---|---|---|
| 0.00–3.60 | café window, rain | dark café, big window onto a teal rainy street (lit windows, orange shop fronts), pendant lamp top centre, goose in a sweater at a round table with a steaming cup, bentwood chairs in front | frame line, two-line wrap (5 words / 1 word) 0.0–2.5 | steam, rain; camera ~static |
| 3.60–6.53 | puddle, top-down | goose floating on its back, headphones, a player in its hand; ripples; shoes and heels at the top edge | frame line, two-line wrap 3.4–6.3 (arrives 0.2 s before the cut) | ripples, rain streaks |
| 6.53–9.93 | bed, top-down, moon blue | goose curled under a white blanket, phone glowing on the bed, headphones, window-frame shadow | frame line, two-line wrap 7.0–9.9 | near static |
| 9.93–14.60 | street, crowd | goose in a dark hoodie standing still by a lamp post; translucent blurred people cross in front | two captions: frame line, two-line wrap 10.0–12.5 · the rest of the ending 12.6–13.9 | the crowd streams (the reel's most motion) |
| 14.60–18.53 | bedroom, warm lamp | goose sprawled on its back on a bed, lamp left, plants, a big window with a rainy city | frame line, two-line wrap 14.8–18.1 | a leg kicks, the body rolls |
| 18.53–22.27 | window seat | goose wrapped in a plaid blanket with headphones, a mug, sheer curtains, snowy city at night | frame line on one line 18.6–21.7 | snow; hard end |
- Captions: white, Inter/SF-like medium ~19–20 px on the 720 frame (29–30 px at 1080), centred at 31 % of the height,
  a ~290 px column (440 at 1080), no box, hardly any shadow; in with the voice, out 0.2–0.5 s before the cut.
- Voice: six spoken segments on the vocals stem (~2.3 s each), soft and low, ~6 dB over the music; Whisper transcribes
  every line exactly.
- Music: 70 BPM by the 8th-note onsets (0.43 s apart) on the separated music stem; key C major (rea 0.86); continuous
  across the cuts; ends hard. rea's 97.5 BPM beat track has strength 0.06 (unreliable).
- Analyzer: 22.38 s · 0 cuts (dark-to-dark hard cuts are not counted) · 10.72 scene changes/min · motion 2.71
  (p90 6.51) · hold 0.27 · brightness 0.286 · colourfulness 25.7 · −14.1 LUFS · 118 WPM. rea: 6 shots, 5 hard cuts,
  13.5 cuts/min, average shot 3.71 s; it calls one shot (the puddle) AI video and the rest "code / template render" —
  the scenes look like AI-generated illustrations with light image-to-video motion.
