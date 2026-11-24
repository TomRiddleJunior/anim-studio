---
name: explainer-fable-storybook
description: "Makes a 50-62 s vertical 9:16 narrated animal fable that turns into a social-psychology lesson, in the format of a viral Instagram reel (188k likes): flat storybook vector in a dusky purple palette, 60 fps, one continuous camera that pushes and pulls instead of cutting, a cream label card at the top for every beat, a DAY pill with tally marks that fill the wall, a promise written on a hanging sign that later gets crossed out in red, speech bubbles (the predator's offer, the crowd's chorus), an irony banner in a beam of light, then the frame shrinks into an 'A FABLE' photo card and the reel steps onto a navy stage to name the real pattern with simple figures, a stamp, a YOU tag and a red target, and returns to the fable for a closing question that loops into the opening shot. Karaoke captions: current word yellow, said words cream, coming words grey. Built in code (HyperFrames + one Canvas 2D composition, pure function of time) with a reusable kit: skies (dusk/night/day), hills, a hen house outside and inside, original characters (hen, fox, owl narrator), label, stamp, DAY pill, tally, sign + scribble, bubbles, banner, photo card, navy stage, house icons, billboard, peg person, karaoke captions; Kokoro narration, an original 80 BPM storybook bed (numpy) and a no-music mix. Use for 'animal fable reel', 'fable about power / manipulation / psychology', 'storybook explainer', 'unspoken.feels style', 'a fable then the study', 'foot in the door / bystander / conformity fable', 'parable with a day counter'. Builds on explainer-engine (TTS, analyzer) and hyperframes."
---
# Fable storybook — a fable, then the real pattern, then the question (60 fps)

Reverse-engineered from one Instagram reel (`DfYRSYODSwC`, 55.6 s, 60 fps, 188k likes; `references/sources.md`),
analysed locally for reference only. The format: a short animal fable told in eleven beats (a threat arrives, the crowd
panics, the predator offers a reasonable-sounding rule, the crowd accepts, days pass, the rule quietly changes, the
crowd rationalises, the end); then "it's a fable" — the frame becomes a photo card and the reel names the real pattern
in the human world on a navy stage with simple figures; then the card returns and the reel ends on a question over the
opening shot. Our variation keeps the grammar and the timing, changes the story, the animals and the idea, and makes the
lesson section carry real numbers from a cited study.

Sample: `assets/sample/` — "The Fox at the Door" (60.6 s): a fox gets into a hen house one small request at a time
(one paw, one feather, one egg … the key); the lesson is the **foot-in-the-door effect** (Freedman & Fraser, 1966,
Experiment II: 76.0 % of people first asked to show a tiny safe-driving sign agreed two weeks later to a huge lawn sign,
against 16.7 % asked cold; FACTS.md in the sample). Template: `assets/template/` (a runnable 11 s demo of the kit: hook outside, the promise as a bubble that becomes a sign, DAY 1-3, the photo-card turn to the navy stage).

## 1. Signature traits
- **A label card for every beat** (cream, heavy caps, slightly tilted, a short mustard underline): a muted viewer can
  follow the story from the labels alone.
- **The fable's devices**: a DAY pill + tally marks that fill a wall (days → months), a promise written on a hanging
  sign that gets **crossed out** with a red scribble when it is broken, the predator's offer as a speech bubble that
  **turns into the sign**, the crowd's self-reassurance as a chorus of small bubbles, an **irony banner** held up in a
  beam of light, and a "one by one" turn.
- **No hard cuts.** One continuous camera: tilt/push into the set, pull out to the exterior for a time-lapse, push back
  in; dissolves under the moves; brief dark dips for nights.
- **The turn into the lesson**: "it's a fable" — the frame shrinks into a cream-bordered photo card with a yellow
  **A FABLE** tag and slides away; a navy stage, a small spaced overline + a big two-colour title; simple figures
  (pegs, houses), a dark card with a yellow **stamp** across it, a **YOU** tag and a red **target** ring.
- **The return**: the photo card flies back in and fills the frame; a question label; pull out to the opening
  composition (a loop).
- **A narrator character** watches from the edge of the fable (on the well's rim / the fence) and stands bottom-left on
  the navy stage, gesturing.
- **Karaoke captions**: 1-6 words on up to two lines, word-synchronous colour (current yellow, said cream, coming grey).

## 2. Measured metrics
| metric | source | sample (render 2) | gate |
|---|---|---|---|
| duration | 55.55 s | 60.63 s | ±15 % |
| fps | 60 | 60 | like the source |
| hard cuts / min | 0 | 0 | ±20 % |
| scene changes / min (median scene) | 8.64 (2.84 s) | 8.91 (2.25 s) | ±20 % |
| WPM (words) | 160.9 (149) | 150.4 (156) | ±20 % |
| first word · first change | 0.0 s · frame 1 | 0.18 s · 0.017 s | ≤ 0.4 s |
| narrator f0 median (p10/p90) | 148 Hz (106/248) | ~141 Hz (bm_george) | — |
| music | ~79.5 BPM, F major, ~14 dB under the voice | 80 BPM, F major, 15.7 dB under | voice ≥ 10 dB over the rest (14.6) |
| loudness | -14.1 LUFS | -14.2 LUFS, TP -1.9 (no-music -14.2, -1.9) | -14 ±1, TP ≤ -1 |
| motion mean (p90) · hold | 6.08 (17.7) · 27 % | 4.47 (10.1) · 0.3 % | — (ours never holds: grain + breathing) |
| brightness · colourfulness | 0.329 · 27.8 | 0.382 · 34.2 | ±30 % |
| dark frames | 26.8 % | 1.6 % | (our interiors are lifted by the lantern) |
| Whisper | — | 18/18 lines heard (worst 0.83: "paw" heard as "poor") | every line |

## 3. Beat map (% of runtime) and script formula
| % | beat | source (job) | sample |
|---|---|---|---|
| 0-5 | **Hook** at dusk outside: the threat arrives; label 1; the first caption already on screen (grey) | the predator falls in | the fox walks up to the hen house |
| 5-9 | camera move into the set | tilt down the well | zoom through the door (dissolve) |
| 5-12 | **Panic**; label 2 | crowd + predator | the hens bolt the door, flapping |
| 12-22 | **The offer**: the predator's words in a bubble, the bubble becomes a **sign** | a "reasonable" rule | "just one paw" → sign ONE PAW / ONLY |
| 22-28 | **Acceptance + the counter**: label, DAY pill, tallies, night dips | every N days | DAY 1-3, feather, egg |
| 28-32 | **The chorus**: small bubbles of self-reassurance | each one believes it is safe | "it's only a little" |
| 32-35 | **Time-lapse**: "… LATER", pull out, day/night cycles | months | weeks |
| 35-40 | **The rule breaks**: the sign crossed out, the tally wall full | the predator takes more | the fox asks for the key |
| 40-45 | **Irony**: a banner in a beam | the crowd praises the predator | THANK YOU, FOX! |
| 45-53 | **The turn**: one by one / the habit; label | isolation spotlights | the door swings wide, "Yes." × 5 |
| 53-57 | "It's a fable" → **photo card** → navy | — | — |
| 57-60 | **The name**: overline + big two-colour title | a warning | THE PATTERN / FOOT IN THE DOOR |
| 60-88 | **The real pattern** with figures: a dark card + stamp; the mechanism; YOU + target | pegs, dividers, bubbles | a street, tiny signs, a billboard, two grids with the study's numbers, a peg person, growing asks |
| 88-92 | the question to the viewer | is your own safety real | "no step feels big" |
| 92-100 | **Return**: the card flies back, a question label, pull out to the opening shot | what would unite the crowd | which yes should they have refused? |

**Script formula.** ~150 words, 17-19 lines, past tense in the fable, present in the lesson. Fable lines 2-8 words;
the predator's offer in one line ending in a short quoted rule (that becomes the sign); the chorus as a 3-5 word quote;
one irony line; the habit line. Lesson: "It's a fable. But …" + a name; 3-4 lines with the evidence (who, what, when,
the numbers); one line of mechanism; one line that turns it on the viewer; the closing question about the fable's
characters. Pick an idea with a named, checkable study (the sample uses a primary paper; double-source the numbers in
FACTS.md and keep explanations the authors only proposed as "their guess").

## 4. Visual system
| role | source (measured) | sample |
|---|---|---|
| dusk sky | pink `#b88ea6`-ish → peach `#e9b38c`, low sun | `#b88ea6` → `#e9b38c`, sun `#f7e3b2` + glow; night `#1d2240` → `#4b3c66`; day `#a9c3d9` → `#efd9b9` |
| hills / ground | `#9d7ca3`, `#7d5f88`; dark plum ground | same tones (`K.hills`, `K.ground`) |
| set walls | purple bricks `#21172d` / `#342438` / `#483547` | plum planks `#3f2e48` / `#372840` / `#43314d`, beam `#2a1f33`, straw floor `#6a5266` → `#21182b` |
| light | warm shafts, glows behind the predator | lantern cone `rgb(255,205,140)` 13 %, floor pool, beam for the banner |
| navy stage | `#1d2c4c` / `#293c65`, radial | `#30457a` centre → `#1b2646` |
| label card | cream `#f6ecda`, text `#362541`, underline `#dca635` | `#f3eadb`, `#2a1d33`, `#e2a93b` |
| DAY pill · tallies | navy `#1c264a`, pale text; cream chalk marks | `#22355f`, `#d6ddf3`; `#ebe1d2` 6 px strokes, groups of 5 |
| sign · scribble | wood `#86644f`-ish, cream caps; pink-red `#cd556b` zig-zag | `#86644f`, `#f1e2c9`; `#d64b6e` 9 px |
| bubbles | cream `#fdf7eb` (offer), lavender (crowd) | `#f7f0e6`, `#e9def0` |
| accents | yellow tags `#e0a636`, A FABLE tag `#d3a25e` | `#e5b23e`, `#f2c14e` |
| captions | cream `#f7e9d6`, current `#eec460`, coming grey; dark outline | `#fbf3e6`, `#f2c14e`, `#a89cb2`; outline `rgba(34,22,44,.92)` 10 px + shadow |

- **Type** (Nunito, OFL): captions 900 64 px (source ~68 px rounded heavy sans); labels 900 42 px caps, letter-spacing
  7 %; DAY pill 900 34 px; bubbles 900 38 px (crowd 30 px sentence case); the lesson title 96/124 px.
- **Layout (1080×1920).** Label centre y 300 (source ~300); captions centred at y 1432 (two lines 1395/1468; the
  source sits lower at ~1608, we keep the house safe band); DAY pill + tallies on the left wall at y 470-600; the sign
  beside the door at y ~760; characters' heads stay above y 1340 in every shot; the narrator bottom-left at x 90-210,
  y 1170-1340.
- **Grain + vignette**: 4 cycled noise tiles in overlay at 5 %, a radial vignette at 32 %.

## 5. Characters (kit, all original)
- `K.hen(x, y, s, {col 0-3, dir, bob, look, eye: n|wide|happy|worried|closed, talk, flap, peck})`: egg body with a
  shaded belly, tail fan, wing, three-bump comb, beak with an opening lower half, wattle, blush; four colourways (cream,
  speckled tan, lavender-grey, white).
- `K.fox(x, y, s, {dir, walk (phase), look, eye: sly|open|glow, dark, tail})`: long body, cream belly, four legs with
  dark socks in a walk cycle, a bushy tail with a cream tip, pointed ears, half-lidded sly eyes; `dark` + `glow` makes the
  silhouette in a doorway.
- `K.paw(x, y, s, angle)` for a paw through a gap. `K.owl(x, y, s, {wing, blink, look, worried, bob, t})`: the narrator
  (lilac body, cream face disc, mustard striped scarf, a wing that gestures).
- Lesson figures: `K.house(x, y, s, {c, roof, sign, board})`, `K.billboard`, `K.peg(x, y, s, {col, badge, smile})`.

## 6. Shot grammar and transitions
- One camera, no hard cuts: 2D camera `cam(zoom, cx, cy)` per beat with in-out eases; push-ins 1.0 → 1.42 on the
  offer, pull-back on the acceptance, push to the crowd on the chorus, slow push through the turn.
- **Zoom-through** a doorway/opening (exterior zooms 1 → 4.2 into the door while the interior dissolves in from 1.1 → 1.0
  over 0.5 s; reversed for the pull-outs) — the source's tilt down the well.
- **Night dips**: a navy shade to 42 % for ±0.22 s around each new day.
- **Time-lapse**: the exterior sky cycles dusk → night → day twice in ~1.2 s, the predator comes and goes.
- **Photo card**: render the scene to a buffer, draw it with a cream border into a card that scales 1 → 0.74 and
  tilts -2°, the tag pops, then it slides down 1300 px; reversed on the return (from y 2400 up, scaling to full).
- Scene changes come from the palette swaps (dusk exterior, plum interior, night dips, the time-lapse, the navy stage);
  the analyzer counted 8.9/min on ours against 8.6 on the source.

## 7. Motion grammar
- Labels pop (scale 0.82 → 1 with back-out over 0.28 s), swap on the beat, fade out 0.15 s.
- Bubbles pop from the tail tip (0.6 → 1, back-out 2.2); the offer bubble holds ~1.5 s, then the sign drops in with a
  damped swing (12° → 0, e^-2.2t); the scribble draws on in 0.55 s; tally marks draw on (0.25 s each).
- Characters breathe/bob; the crowd flaps and jitters in panic, closes its eyes on "yes", turns and nods in sequence
  (0.16-0.22 s apart) on the habit beat; the predator walks with a 4-leg cycle and a tail sway.
- The lesson builds by staggered pops (houses 20 ms apart, billboards 75 ms apart, numbers counted up with ease-out
  over 1-1.4 s), the stamp slams (scale 1.6 → 1), the asks slide in 0.32 s apart, the target ring pops on the last.

## 8. Caption system (`tools/build.py` + `K.captions`)
- Groups: a new group at every script line and sentence end, after a comma once it has 3+ words, never more than 6
  words / 32 characters; a group never ends on a function word (a, the, to, for, of …); a lone word joins the previous
  group when it fits. Split into two balanced lines when longer than 16 characters.
- On = first word - 0.06 s (frame 0 shows the first group already, all grey), off = next group - 0.07 s or last word +
  0.55 s. Each word is grey until its onset, yellow while spoken (≥ 0.12 s), cream after.
- Nunito 900 64 px, dark plum outline (10 px, round joins) + soft shadow, centred at y 1432.

## 9. Sound
- **Source**: one expressive male storyteller voice (TTS-like, f0 median 148 Hz) carrying ~81 % of the runtime; a soft
  stock-like bed at ~79.5 BPM in F major (triplet onsets 0.25 s apart, ~14 dB under the voice, sections changing near
  5, 9, 18, 30.5, 46.5, 51 s); ~20 small sound effects on labels, bubbles and stamps; the tail ~-35 dB.
- **Ours** (`tools/score.py`): Kokoro `bm_george` at speed 1.25 (British storyteller, f0 ~141 Hz); an original bed at
  80 BPM in F major — a music-box arpeggio in triplets over a pad and a round bass, sections that follow the story (theme
  → held D minor under the bolted door → theme → minor for the key → plucked for the lesson → bass build for the numbers
  → thin for the explanation → theme, ending on C so the loop to the opening F resolves); ~70 synthesized effects
  (label pops + paper whooshes, clucks and a flutter, the bolt, door creaks, night whums, chalk per tally, the feather,
  the egg, whispers, the scribble, the banner ding, the yes pops, whooshes for every camera move and card, the title
  hit, window-sign pops, the stamp slam, grid pops, the badge ding, the asks, the target ping). Music ducked ~5 dB under
  speech; voice 14.6 dB over music + sfx.
- Two masters at -14 LUFS / -2 dBTP: full and no-music (voice + sfx).

## 10. Retention devices
A label per beat; the first caption on frame 0; a counter that climbs (DAY 1 → 41) and a wall that fills; a promise in
writing that gets broken on screen; the chorus; the photo-card turn ("it was about us"); real numbers counted up on
screen with the real group sizes (25 and 24 houses); a YOU tag; a closing question the comments can answer; an ending
that is the opening shot.

## 11. Do / don't
- **Do** cite a real study for the lesson, read the paper, double-source the numbers in FACTS.md, and word tentative
  explanations as tentative; show the real counts when you draw a percentage.
- **Do** keep the eleven fable beats and the label-per-beat rhythm, the sign → crossed-out sign arc, the photo-card
  turn and the return; keep characters' faces above the caption band in every push-in.
- **Don't** reuse the source's animals, objects (a well, a snake, mice), lines or labels; don't show violence (the
  predator appears as a silhouette in a doorway, the outcome is implied); don't make claims about real groups of people.
- **Don't** let the camera zoom crop the wall counter at the frame edge (keep cx so the DAY pill stays in frame).

## 12. Code recipe
```bash
cp -r ~/.claude/skills/explainer-fable-storybook/assets/template my-fable && cd my-fable     # runnable 11 s demo
# 1) vo/script.json: lines {id, text, gap}; voice bm_george, speed 1.25 (see the sample's)
<kokoro venv python> -X utf8 -I <explainer-engine>/audio/tts.py vo           # vo/audio/vo.wav + vo/data/vo.json
python -X utf8 -I tools/build.py --fps 60          # vo-data.js (word times + caption groups), world.html, index.html, out/<name>.srt
# 2) assets/lib/film.js: T (the clock from V.w(line, word)), the sets, intState()/intCam() per beat, the lesson stage
npx -y hyperframes@0.8.210 check --json
WITH_LOCK=<lock wrapper, optional> bash tools/snap.sh 0,2.5,4,7.6,9.8,12.4,16.2,18.3,21,23,26.6,28.5,29.2,31.2,35.9,40.2,44,47.6,52,55.2,57.2,60.4
python -X utf8 -I tools/score.py                   # copy it from assets/sample/tools and edit its event list (T): voice + music + sfx,
                                                   # both masters, assets/audio/final.m4a; then add the <audio id="mix"> line to index.html
npx -y hyperframes@0.8.210 render -o out/<name>_master.mp4 -q delivery -w 2     # data-fps=60 in index.html
FILM_FPS=60 bash tools/deliver.sh                  # CRF 19 + no-music remux, prints frame counts
python -X utf8 -I tools/qa.py --source <source.mp4> --source-metrics <its metrics.json> --analyzer <explainer-engine>/qa/analyze_video.py
<python with faster-whisper> -X utf8 -I tools/whisper_check.py
python -X utf8 -I tools/cover.py <caption-free still.png> "TITLE" "line"       # snapshot a copy with window.FB_NO_CAPTIONS = true
```
- **Kit** (`assets/lib/fb-kit.js`, `FB.create({canvas})` → K): `K.setCtx(c)` (draw into offscreen buffers), skies
  `K.sky(tod)`, `K.sun(x,y,r,a,moon)`, `K.stars`, `K.hills`, `K.ground`, `K.fence`; sets `K.coopOut(cx, by, {tod, door,
  glow})`, `K.coopIn({t, lamp, lx})`, `K.doorIn({ajar, bolt})`; characters §5; overlays `K.label({lines, a, pop, y,
  dark})`, `K.stamp`, `K.dayPill`, `K.tally({n, x, y, perRow, lastU})`, `K.sign({lines, x, y, swing, cross})`,
  `K.bubble({lines, x, y, tx, ty, pop, small, quote})`, `K.banner`, `K.photo({img, x, y, s, rot, tagA, border})`,
  `K.tag`, `K.navy()`; light `K.glow`, `K.cone`, `K.shade`, `K.vignette`, `K.grain`; captions `K.captions(chunks, t)`.
- **Film contract**: `window.FB_FILM(K, V) → {draw(t), T}`; `V.w(line, word)` gives word onsets, so every beat follows
  the narration; `FB_NO_CAPTIONS` hides captions for covers.
- **Tools**: `build.py`, `score.py`, `qa.py`, `deliver.sh`, `snap.sh` + `tile.py`, `whisper_check.py`, `cover.py`; study
  tools in `tools/` (`sweep.py`, `grab.py`, `regions.py`, `audio_probe.py`, `stems_probe.py`).
- **Performance**: Canvas 2D on CPU; 3,638 frames at 60 fps rendered in 241-336 s with 2 workers; snapshots ~0.6 s each.

## 13. Gotchas
- **The kit's drawing context is a closure**: to render a scene into a buffer (zoom-throughs, the photo card) switch it
  with `K.setCtx(buf)` and switch the film's own context with it, then back.
- **Push-ins put faces under the captions**: with zoom z centred at cy, a world y maps to 960 + z·(y - cy); solve cy so
  head tops stay above ~1340 (the offer push needed cy 975, not 900).
- **A zoomed camera crops the wall counter** (the DAY pill at x 70 vanished at zoom 1.2, cx 600): keep cx ≤ 960/z… in
  practice cx ≤ 545 at 1.16.
- **Empty gaps in the lesson**: build every new figure group with staggered pops starting on the line's first word, or
  the stage sits empty for half a second.
- **British TTS and "paw"**: `bm_george` says "paw" like "poor" (non-rhotic); Whisper heard "one poor". The on-screen
  bubble carries it; for a cleaner read pick a word without the vowel or an American voice for that line.
- **Kokoro speed**: `bm_george` at 1.08 gave 170 WPM while speaking and a 69.5 s cut; 1.25 gave 195 WPM (the source's
  rate while speaking) and 60.6 s.
- **60 fps** is set by `data-fps="60"` on the root composition (the render picks it up); deliver with `FILM_FPS=60`.
- **Percentages need the right denominator**: Freedman & Fraser's 76 % includes everyone asked the small request, not
  only those who agreed; the line says "asked for", the grid shows 19 of 25.

Files: references/sources.md · assets/template/ · assets/sample/ (The Fox at the Door: film, kit, vo, tools, SCRIPT,
SAMPLE, POST, FACTS, audio) · tools/.

## Appendix A — source analysis (`DfYRSYODSwC`)
Measured from the analyzer, 1 fps and 4 fps sweeps (222 frames), 18 full-resolution grabs, pixel colours, the audio
probe and a stem split (voice vs music: levels, f0, onsets).

| t (s) | beat (job, not the words) |
|---|---|
| 0.0 | dusk exterior; label 1 already up; the first caption group visible in grey; the narrator on the rim; the predator on a branch |
| 0.5-1.25 | the predator falls in; the camera tilts down into the set (continuous) |
| 1.25-3.5 | the crowd and the predator on the floor; caption "of …" |
| 3.5-5.7 | label 2 (fear); the crowd packed |
| 5.75-8.7 | a glow behind the predator; push-in |
| 8.75-11.0 | the offer as a cream speech bubble (two lines of caps in quotes) |
| 11.25 | the bubble becomes a wooden sign on the wall (string + nail) |
| 12.25-15.5 | label 3 (every N days); DAY 0 → 3 → 6 → 9 pill + tallies; a dark dip for each step; one of the crowd disappears each time |
| 15.75-18.0 | push to the crowd; three small lavender bubbles of self-reassurance |
| 18.0-19.5 | label "… LATER"; pull out to the exterior; night/day cycling |
| 19.75-22.5 | DAY 180, the tally wall full; the predator takes the healthy; the sign scribbled out in red |
| 22.75-25.0 | a vertical beam; the crowd holds a yellow banner praising the predator |
| 25.5-29.0 | each one alone in its own spotlight; label (one by one); the predator takes them |
| 29.25-30.75 | pull out to the night exterior; the frame becomes a photo card with an "A FABLE" tag; slides away |
| 31.0-33.0 | navy stage: small overline, then a big two-colour title |
| 33.25-36.5 | a row of peg figures on a shelf; the narrator bottom-left; a dark card + a yellow stamp across it |
| 37.0-43.0 | label (divide); dividers between the pegs; the predator enters from the right; two speech bubbles |
| 43.25-46.0 | the dividers lift; one peg pushed out toward the predator |
| 46.5-50.5 | a YOU tag with a dashed ring; a red target on the next one; label (the question to the viewer); zoom |
| 50.75-53.5 | the card flies back and fills the frame; the question label; the crowd huddles |
| 53.75-55.55 | pull out to the dusk exterior (the opening composition) with the question label |

Audio: voice 81 % of the time, median -14 dB RMS while speaking; music -28.6 dB (14 dB under), 79.5 BPM, F major,
triplet onsets 0.25 s apart; tail -35 dB; ~20 effects on labels, bubbles and stamps.
