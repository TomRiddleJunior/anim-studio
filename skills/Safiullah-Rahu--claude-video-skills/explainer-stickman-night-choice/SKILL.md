---
name: explainer-stickman-night-choice
description: "Makes a vertical 9:16 stick-figure night horror choice reel (50-65 s, one part of a series) in the format of a viral Instagram series (@stick.dimension, Part 2, 57 s, 132k likes, 11.5k comments): a white-outline stick figure in dark navy flat rooms and cityscapes, a top-left HUD that never leaves (a red ● DAY line, a big condensed clock that ticks with the story, BATTERY nn% and one POPULATION-style stat in mono), a phone text thread (dark UI, grey bubbles, a blue sent bubble, typing dots, a lock-screen notification, a red flash), a red RULE #n tag over the city, an escalation told as something spreading or climbing toward you through a building in section, captions of 1-2 heavy Montserrat Black caps words with lime keywords, then a vote stack (WHAT DO YOU DO? / A pill / B pill typed in / COMMENT A OR B / THE MOST VOTED CHOICE DECIDES / the next part in red) and a black FOLLOW FOR PART n card while the stat glitches. The opening frame is lit, and the light dies at ~0.15 s: the reel's only hard cut; everything after is dark-to-dark, so the analyzer sees ~1 cut and 0 scene changes. Built in code with HyperFrames + one Canvas 2D composition (seek-exact) and a reusable kit (stick figure poses, HUD, phone UI, RULE tag, vote stack, facades and building sections) with cross-dissolves through an offscreen buffer; Kokoro narration and an original 50 BPM horror bed with a no-music mix. Use for 'stickman horror choice', 'stick.dimension style', 'last one awake / time loop / night choice story', 'HUD with DAY clock BATTERY', 'comment A or B horror series', 'phone text horror reel', 'Part 1 of a choose-what-happens series'. Builds on hyperframes and the explainer engine (TTS, analyzer)."
---
# Stickman night choice — a HUD, a phone, one rule, something coming, A or B

Reverse-engineered frame by frame from one Instagram reel (@stick.dimension, `DfViPqtSRxY`, Part 2 of a series,
57.0 s; sources in `references/sources.md`, the full analysis in Appendix A). The format is a **second-person
micro-horror told in under a minute**: a premise in the first sentence, a phone that talks, a rule, something that
gets closer step by step on a building drawn in section, a message that contradicts the rule, and a vote that decides
the next part. Everything is dark navy; the only colours are the HUD red, the caption lime, the phone blue and one
red flash.

Sample: `assets/sample/` — **"Same Night · Part 1"** (60.6 s, one render), the first part of an original series. You have lived
the same night four times (the HUD stat is LOOP 4); at midnight everything resets except your phone, and its battery
never comes back. A text arrives from your own number (it's you, from loop 3: rule one is wrong). Rule one, from the
first loop: when the lights die, don't move. At 11:59 the windows across the street go dark one by one, block by block,
then your own building floor by floor, then your lamp. Your phone lights up — the last light in the city — with the
next texts: last loop I froze, it found me anyway, run for the roof. A) freeze like the rule says, B) trust yourself.
The vote decides loop 5. Its SCRIPT.md, SAMPLE.md, POST.md and out/qa are in the sample folder.
How it differs from the house's other night stories: explainer-choice-night-story is a 95 s keeper story with a
handwritten rules sheet and a knock; explainer-rules-horror-3d is a 3D mannequin in a lit location with in-scene
choice labels. This one is a sub-minute stick figure with a permanent HUD, a phone thread and a building section.

## 1. Signature traits
- **The premise in sentence one** ("Imagine…"), second person, present tense; ~130 words in 57 s (≈ 137 WPM overall,
  fast while speaking, many 0.4-0.8 s pauses).
- **The HUD** (always on, top-left): a red dot + `DAY 1` (red mono, letter-spaced), a big condensed clock `11:48` +
  small `PM`, a thin rule, `BATTERY 90%` and one story stat (`POPULATION 1` in the reference, `LOOP 4` in ours) in grey
  mono with the value white or red. The clock and battery change with the story; the stat glitches on the end card.
- **The phone** (centre, tilted ~2°): header (back chevron, round avatar, a name, a red sub-line), grey bubbles in,
  a blue bubble out, Delivered, typing dots, a lock screen with a notification, a keyboard; one red flash on the key
  word of the last message.
- **RULE #n**: a red rectangle tag with a thin white inner frame, condensed white caps, rotated −4°, slammed in over
  the city.
- **The approach**: the thing that comes closer is shown on a building in section (stairwell zig-zags, floor numbers,
  rooms as dark boxes) — footsteps as ring icons in the reference, lights dying floor by floor in ours — then it stops
  at your floor.
- **Captions**: 1-2 heavy caps words at a time (Montserrat Black), white, keywords lime, a pop on each group; none on
  the vote card.
- **The vote stack**: question (condensed white), A pill (appears empty with its letter disc, then the words type
  in), B pill, `COMMENT A OR B` (lime letters), a tiny mono line, the next part in red; then a black card `FOLLOW FOR
  PART n` (part in red) between two tiny mono lines.

## 2. Measured metrics (reference vs sample vs gate)
| metric | reference | sample | gate |
|---|---|---|---|
| duration | 57.0 s | 60.6 s (+6 %) | ±15 % |
| analyzer cuts / min | 1.05 (one cut: the lamp at 0.2 s, ffmpeg scene score 0.357; every other change ≤ 0.22) | 0.99 (one cut: 0.554 at 0.13 s; every other change ≤ 0.17) | ±20 % |
| scene changes / min | 0 | 0 | 0 |
| WPM | 137.0 (130 words) | 132.7 (134 words) | ±20 % |
| first word · first change | 0.0 s · 0.2 s | 0.18 s · 0.13 s | ≤ 0.4 s |
| Whisper `small` | — | 16/16 lines, worst recall 1.00 | every line |
| loudness | −14.2 LUFS | −14.0 / −14.1 LUFS (full / no-music), TP −2.0 dBTP | −14 ±1, TP ≤ −1 |
| voice over bed | ~10 dB (quietest frames −25 dB vs speech −16 dB) | 14 dB over everything, 17.5 dB over the music | ≥ 10 dB |
| brightness · colourfulness · motion | 0.106 · 14.6 · 2.46 | 0.14 · 19.1 · 1.96 | look |
| tempo | onset candidates ~50 BPM | 50 BPM pulse (1.2 s) | match feel |

**How the analyzer sees this format.** A cut needs a mean absolute YUV difference > 33/255 between two frames; a scene
change needs ≥ 28 % of pixels to change 64-level colour bins over 1 s. Dark-to-dark changes never reach either, so the
whole film after the opening counts as one shot. The opening light must do two things at once: lift the luma a lot
(the cut) while keeping most pixels inside the darkest bin (no scene change). Our recipe: a `lighten` wash of
`rgb(63,60,52)` (just under 64) over the whole frame + two warm glows, lit for frames 0-3 only (off at 0.13 s), so the
6 fps histogram sampler sees the lit frame only at t = 0, where it never counts.

## 3. Beat map (% of runtime) and script formula
| % | beat | reference (shape) | sample |
|---|---|---|---|
| 0-7 | **Premise** over the figure in the phone glow (the lamp dies on frame ~5) | the last person alive gets a text | you have lived this night four times |
| 7-18 | **The phone talks** (thread / a device detail) | a stranger sends three short orders | everything resets except your phone; the battery never comes back; a text from your own number |
| 18-28 | **The rule** (RULE #n tag over the city) | a rule about staying dark | rule one: when the lights die, don't move |
| 28-37 | **A reply that goes nowhere** / the time jump (clock to the hour) | you text back, delivered, typing… nothing; midnight | 11:59 |
| 37-70 | **The approach** on the building in section, beat by beat, until it stops at your floor | a door slams below, footsteps climb, stop at your door, three knocks | windows go dark across the street, block by block, your building floor by floor, six, your lamp |
| 70-77 | **The phone lights up** — too bright / the last light | a new message | the last light in the city |
| 77-77 | **The contradiction** (red flash) | the sender denies it was them | "last loop I froze, it found me anyway" + "run for the roof" |
| 77-95 | **The vote**, read: A (do the dangerous instinct), B (trust the phone / yourself) | the door vs the phone | freeze / run for the roof |
| 95-100 | **Follow card** (the stat glitches) | follow for part 3 | follow for part 2 |

- 125-140 words, 15-18 lines; Kokoro `am_onyx` at 1.08 (≈ 184 WPM while speaking). Gaps 0.35-0.7 s; read the vote
  lines with 0.45-0.75 s between them.
- **The stat** (POPULATION / LOOP / AWAKE …) is the series hook: one number that the premise hangs on and that the end
  card questions ("2?", "5?").
- **The rule vs the message** is the dilemma; both options must be defensible. Keep it PG: no monster is shown.

## 4. Visual system
| role | reference (measured) | sample |
|---|---|---|
| background | navy-black `#0c1223 → #000105`, rooms as flat dark blocks with faint lighter edges | `#05070d / #0b1122`, blocks `#151c31` edge `#232c47` |
| figure | white-grey outline (~13 px), round head ring r ≈ 85, single-line limbs, a cool glow from the phone | `#c9cdd6`, `K.stick({pose:"sit|sitlow|stand|freeze|run", phone, phoneLit})` |
| HUD | x 70; ● at (78, 249) r 8 red; DAY y 261 mono 30 px ls 7 `#e8434a`; clock cap height ~85 px (y 290-373) condensed; rule y 408 x 70-450; rows y 447 / 488 mono 26 px ls 5 grey `#8d93a0`, values white / red | the same geometry (`K.hud`) with Oswald 600 124 px for the clock, Roboto Mono for the lines |
| phone | 600 × 1240 dark rounded rect, 2° tilt, Inter UI, grey `#2a2c33` / blue `#2d5bd1` bubbles, red sub-line | `K.phone({screen:"lock"|"thread", lock:{…}, thread:{msgs, typing, kb}, tint})` |
| accents | lime `#c0f838`, red `#e8434a`, phone blue | the same |
| captions | Montserrat Black, cap height ~69 px, centred y ≈ 1480 (77 %) | Montserrat 900 92 px at **y 1258** (safe area), keywords lime |

- **Safe areas**: HUD y 235-500; phone y 460-1700 (its lower half under the captions is empty UI); RULE tag y ≈ 640;
  vote stack y 800-1300; captions y ≈ 1210-1310; nothing important below 1320.

## 5. Shot grammar and transitions
- ~12 sets in ~60 s: room (lit → dark) → push on the phone hand → lock screen → thread → city + RULE → facade across
  the street → city pull-back → building section (pan up) → floors 6-7 close → the dark city with one light → thread 2 →
  vote → black card.
- Every change after the opening is a **0.25-0.3 s cross-dissolve** through an offscreen buffer (the reference uses
  quick dissolves and soft cuts between dark sets); the end card is a hard cut to black.
- Camera: slow push-ins (4-10 %), pans along the building, a pull-back over the city, a zoom from your window out to
  the whole dark city.

## 6. Motion grammar
- The figure barely moves (sitting, a phone at the face); life comes from light: glows, windows switching off in
  order (0.07 s apart), floors dying on their words, a phone buzz shake (7 px, 0.5 s), messages popping (back-out
  0.3 s), typing dots, the rewind glitch (horizontal slices slipping for 0.6 s), the red flash (0.08 s up, 0.3 s down),
  HUD values popping 1.25× on their words, the clock turning lime for 0.3 s when it jumps.

## 7. Caption system (`tools/build.py`)
- 1-2 words per group (≤ 14 characters), a break after punctuation; Montserrat 900, 92 px (82 px for long pairs),
  white `#f3f3ee`, keywords lime `#c8f53c` from the script's `kw` map; a 1.12 → 1 pop in 0.09 s on the first word
  (−0.04 s); a soft black shadow (no outline). Lines listed in `no_caption_lines` (the vote) are not captioned; every
  spoken line still goes into the SRT.

## 8. Sound (`tools/score.py` + `tools/audiokit.py`)
- Reference: a synthetic narrator, a faint high whine under the first half, a low drone, footsteps and knocks as hits,
  phone tones, stings.
- Sample: voice (Kokoro, close, slightly dark, 10.5 dB crest), ambience (room tone, a city hum that dies with its
  lights, a 4.4 kHz whine at −40 dB-ish in the first 25 s), foley/UI (lamp switch + filament, the rewind, a battery
  chirp, phone buzz + notification, message pops, the RULE slam, a switch click per window, relay clunks per block and
  per floor, the lamp power-down, a distorted sting on the red flash, vote pops, an end boom + glitch ticks), **music in
  the full mix only**: an original 50 BPM D-minor bed (sub drone with beating, a soft pulse from 11:59 that doubles
  while your building goes dark, silence on the lamp, a glass bell when the phone lights up, a five-note bell motif on
  the hook and the vote, a pad under the vote).
- Stem levels relative to the voice's speaking RMS (music −17, ambience −25, sfx −13 dB), then everything else is
  pulled under until ≥ 12 dB; each mix levelled separately to −14 LUFS, true peak −2 dBTP before AAC.

## 9. Retention devices
- A premise with a number in sentence one; the HUD as a ticking clock; a text that arrives (everyone reads texts);
  a rule; a visible approach in countable steps; a contradiction; a vote with a red PART n; the stat glitching as the
  last frame (rewatch / follow).

## 10. Do / don't
- **Do**: keep the HUD on every frame; make the stat matter to the premise; keep every set dark; read the texts the
  narrator needs and let the screen carry the rest; type the vote options in; end on the follow card.
- **Don't**: show the threat; add hard cuts between dark sets with big luma jumps (they register as cuts); put a bright
  set (more than ~25 % of pixels above 64/255) anywhere after the opening; reuse the reference's premise or lines.

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-stickman-night-choice/assets/template my-night && cd my-night   # runnable 4-shot demo
python -X utf8 -I "$EXPLAINER_ENGINE/audio/tts.py" vo        # Kokoro: vo/audio/vo.wav + vo/data/vo.json
python -X utf8 -I tools/build.py                             # vo-data.js, captions.html, world.html, index.html, out/<name>.srt
python -X utf8 -I tools/devserve.py .. 8765 &                # lock-free drawing: scratch/dbg.html#t=…&save=…, #analyze=…, #times=…
python -X utf8 -I tools/score.py                             # needs score/shots.json (export with dbg.html#times=<project>/score/shots.json)
bash tools/snap.sh 0.05,0.3,2.4,…                            # under the shared render lock
bash "<styles>/tools/render_locked.sh" "$PWD" out/<name>_master.mp4 delivery
bash "<styles>/tools/with_render_lock.sh" bash tools/deliver.sh
python -X utf8 -I tools/qa.py --analyzer "$EXPLAINER_ENGINE/qa/analyze_video.py" --source-metrics <ref metrics.json> --source-clip <ref.mp4>
python -X utf8 -I tools/whisper_check.py
```
- Kit (`assets/kit/sm-kit.js`, `SM.create({canvas})` → K): `rr`, `text({fam:"mono"|"ui"})`, `measure`, `glow`, `fill`,
  `fade`, `vgrad`, `vignette`, `block`; `stick({x,y,s,dir,pose,pose2,mix,walk,phone,phoneLit,headFill,col,lw})` →
  `{head, hand}`; `hud({day,time,ampm,timeCol,dot,rows:[[label,value,valueCol,pop]]})`; `phone({x,y,s,rot,screen,
  lock:{time,date,battery,batteryK,note,noteK},thread:{name,sub,avatar,msgs:[{me,t,k,status,hi}],typing,input,kb},tint,
  dim,glow,t})`; `ruleTag(txt,x,y,{s,rot,px})`; `voteStack({y0,q,qk,A:{t,k,tk},B,fk,sk,small,pk,part})`.
- The sample's film (`assets/sample/assets/lib/film.js`): `bedroom({lamp, cityLit})`, `facade(x,y,w,h,cols,rows,lit)`,
  `city({lit(x,y), bldg(f,i), street})`, `section({fl(f), mark7, phoneLit})`, a dissolve player (`xf` per shot) and the
  HUD state per time (`hud(t)`).

## 12. Gotchas
- **The one cut is a calibration**: a warm wash at 35 % alpha scored 0.24 (no cut); two bright glows scored 0.40 but
  made a scene change (0.49 over 1 s); the lighten-to-63 wash + glows + lit only for frames 0-3 gives the cut and no
  scene change. Measure with `dbg.html#analyze=…&extra=0.13`.
- **A red flash over the whole phone is a scene change** (the phone is ~36 % of the frame): keep the tint's red channel
  under 64 (`rgba(110,10,22,0.45)`).
- **Lit windows add up**: warm windows at 85 % on a big facade made the frame bright; 55-62 % and fewer lit windows
  keep it in the format's darkness.
- **Export shot times with `#times=`** after every timing change; the score reads `score/shots.json` (a stale export
  put the lamp click 0.07 s late).
- **Draw into the dissolve buffer with the same kit**: the player draws the previous shot, copies the canvas to a
  buffer, draws the current shot and lays the buffer on top with falling alpha.

Files: references/sources.md · assets/kit/sm-kit.js · assets/template/ (runnable demo) · assets/sample/ ("Same Night ·
Part 1" with SCRIPT.md, SAMPLE.md, POST.md, out/qa without compare.jpg, which shows reference frames) · tools/ (build.py, score.py, audiokit.py, qa.py, qa_config.json,
whisper_check.py, deliver.sh, snap.sh, tile.py, cover.py, devserve.py, dbg.html, study.py, grab.py, words.py,
audio_probe.py, pitch.py)


The sample ships without its voice WAV and score WAVs (size): re-run the engine's `tts.py` on `vo/` (same script, same voice → the same timings) and `tools/score.py` to rebuild them; `assets/audio/final.m4a` is the finished mix. `$EXPLAINER_ENGINE` is the explainer engine folder (`audio/tts.py`, `qa/analyze_video.py`); `$FFMPEG` / `$FFPROBE` point at the binaries when they are not on the PATH; `LOCK_WRAPPER` makes `snap.sh` run under a shared render lock.

## Appendix A — reference analysis (`DfViPqtSRxY`), frame by frame
Measured from 10 fps frame differences (full frame, caption band, HUD band), per-frame ffmpeg scene scores, 2 fps
sheets, 25 full-size key frames, Whisper word times and the analyzer.

| t (s) | set | picture and overlays | sound |
|---|---|---|---|
| 0.0-0.2 | room, lamp on | warm wash over the whole frame, the figure (filled white) sitting on a dresser with the phone; window with stars right; HUD from frame 1 | voice from 0.0 s |
| 0.2-2.4 | room, lamp off | the light dies (scene score 0.357); the figure in a cool phone glow; push-in | a high whine starts under the voice |
| 2.5-5.2 | thread | phone (tilt ~2°): unknown sender, red "last seen", three grey bubbles | |
| 5.3-9.0 | room | the figure stands, walks, sits on the floor under the window | |
| 9.0-11.3 | phone | the brightness slider goes down; the screen dims | |
| 11.5-15.7 | city | navy skyline, one lit window dims; RULE #2 tag (red, rotated) | |
| 15.8-20.3 | thread | keyboard; a blue sent bubble; Delivered; typing dots; nothing | key clicks |
| 20.5-22.9 | room | the figure on the floor; clock 12:00 AM, DAY 2 | |
| 23.0-39.5 | building section | pan down to the ground floor; a door slams (dust); ring icons climb the stairs floor by floor; they stop at your floor; three knocks (concentric rings); your window glows (phone) | footsteps, knocks |
| 39.6-43.8 | lock screen → thread | the notification; two new grey bubbles; a red flash on one word | phone tones |
| 44.0-54.5 | vote stack | question (y ≈ 1050); A pill empty then typed; B pill; COMMENT A OR B (lime letters); a tiny mono line; PART 3 in red; no captions | a sting, pad |
| 54.6-57.0 | black card | tiny spaced line, FOLLOW FOR PART 3 (part red), tiny COMMENT A OR B; the stat glitches to "2?" / "3?" in red | end sting |
