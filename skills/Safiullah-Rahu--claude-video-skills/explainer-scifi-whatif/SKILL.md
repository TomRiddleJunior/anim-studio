---
name: explainer-scifi-whatif
description: "Makes a long-form 16:9 (1920x1080) second-person sci-fi 'what if' story (2.5-5 min; 3 min when it must post as a reel) in flat-vector night-navy animation, in the format of a viral Instagram/YouTube what-if (@explanators, cryosleep, 406k likes): a cold open that states the twist's facts in numbers and withholds the why, a robot companion's line, a tape-style rewind with a scrambling year counter back to the start, a NOW HIRING card with a big yellow salary and a cyan button, real science told as clean fact cards (two to six verified facts), the person who matters introduced with a leader-line tag, a quiet middle with the robot, a turn, a reveal built from records (logs, IDs, documents), the twist that reframes the cold open, a final countdown in the HUD and a question for the comments. A HUD box top-right (label, right label, a mono timer ticking to the microsecond) re-labels itself per act (TIME ASLEEP, TIME AWAKE, FLASHBACK, SHE WAKES IN...). No burned-in captions; on-screen labels carry the facts. Built in code with HyperFrames + one Canvas 2D composition and a reusable kit: night grounds, star fields and warp streaks, round-headed people (kid / adult / old variants, poses, expressions), OTTO a hover robot with a screen face (eyes, doodles, text), ships, planets, cards, tags with leader lines, speech bubbles, typed text, rolling counters, cross-dissolves, grain and vignette; a synthesized D-minor ambient score and UI/space SFX with a no-music mix. Use for 'sci-fi what if', 'what if you slept for 1000 years', 'time dilation story', 'robot companion story', 'explanators style', 'long-form what-if with a twist', 'NOW HIRING what if', 'future world explainer story', or any second-person speculative story that pays off real science. Builds on explainer-engine (TTS, analyzer) and hyperframes."
---
# Sci-fi what-if — a job, real science, a robot, a twist (16:9)

Reverse-engineered frame by frame from one Instagram reel (**@explanators**, `DffMkrzTg5q`, 301.8 s, 1920×1080,
406 k likes; analysed locally for reference only; details in **Appendix A** and `references/sources.md`). The format is a
**second-person speculative story with a twist**, told like a documentary: the cold open gives the shocking facts, a robot
speaks one line, the film rewinds to the start, a job ad explains how you got here, real science makes it plausible, the
future world is explored through fact cards, records reveal why it happened, and the twist turns the villain (or the
mystery) into love. Everything sits on one night-navy palette with soft glows; a HUD box ticks in the corner.

Sample (original work): `samples/scifi-oneyear/out/scifi-oneyear.mp4` (explainer-styles workspace; full sources in `assets/sample/`) — **"One Year
Away"** (176.3 s, kept ≤ 180 s so it posts as a reel; the source is 302 s): you take a one-year courier flight at 99.99 %
of light speed; 70 years pass on Earth; your little sister, 8 when you left, spends fifty years writing the updates that
turn your maintenance robot into her. Real facts: time dilation, GPS clock corrections, the NASA twins study, the Parker
Solar Probe record, the Lorentz factor and the relativistic Doppler effect (double-sourced in `FACTS.md`).

## 1. Signature traits
- **Cold open = the twist's numbers**: big mono year counters (PLAN vs ACTUAL; SHIP vs EARTH) and a "POV:" hook line
  top-left, a 1–2 s flashback to the inciting act; the narration says what happened, never why.
- **The robot companion** delivers one line in the cold open and carries the middle (shows, points, looks away, holds up
  the record). Ours: OTTO, a hover robot whose screen face shows eyes, text and drawings (the twist lives on its screen).
- **Rewind** to the start: the frame smears, ◀◀ and a scrambling year counter run back (≈ 1.5 s).
- **NOW HIRING card**: letter-spaced yellow "NOW HIRING · <year>", the program in white bold, a huge yellow amount
  rolling up, a cyan pill button with the deal ("SLEEP 10 YEARS" / ours "FLY 1 YEAR"), the vehicle to the left (READY).
- **Fact cards** for real science: one idea each, a number in a glowing colour, a tag with a leader line to the thing.
- **HUD box** top-right, always on: a small letter-spaced label, a grey right label (the act or the year), a mono timer
  with microseconds (cyan; yellow for the final countdown). It re-labels at each act.
- **Records** drive the reveal (a court document, a list, a newspaper / ours: an update log, a staff ID).
- **The final countdown** in the HUD and a question pill low-centre (the source asks what you would say to her; ours "WOULD YOU TAKE
  THE JOB?"), then a comments card and a follow card.

## 2. Target metrics
Source: `research/insta10/frames/DffMkrzTg5q/metrics.json` + our sweeps and audio study. Sample: `assets/sample/out/qa/gates.json`.

| metric | source | sample "One Year Away" | gate |
|---|---|---|---|
| duration | 301.8 s | 176.3 s | ≤ 180 s (brief: post as a reel; a deliberate −42 %) |
| hard cuts / min | 3.58 | 3.06 (9 cuts) | ±20 % |
| scene changes / min | 4.37 | 2.72 (**explained miss**: 8 bright inserts in 3 min vs the source's ~20 in 5 min; render 1 on one palette measured 0.34) | ±20 % |
| WPM overall | 162.6 | 152.5 | ±20 % |
| first word · frame 0 | 0.0 s · complete still | 0.21 s · complete still | ≤ 0.4 s |
| brightness · colourfulness · dark frames | 0.224 · 21.3 · 82.5 % | 0.219 · 25.6 · 77 % | night-navy film |
| loudness | −14.1 LUFS | -14.1 LUFS · -1.8 dBTP | −14 ±1, ≤ −1 dBTP |
| voice over bed+SFX | ≈ 14 dB (gaps −32 dB vs speech −18 dB) | 14.5 dB | ≥ 10 dB |

## 3. Beat map (% of runtime) and script formula
| % | beat | source (shape) | ours ("One Year Away") |
|---|---|---|---|
| 0–7 | **Cold open**: the twist's facts as numbers + who did it; a flash of the act | planned years vs actual years; she stopped your wake-up | one year vs seventy; the robot started talking like your little sister; she was eight |
| 7–13 | **The robot speaks one line**; "but let's go back"; rewind | the robot greets you in the far future | the docking light turns green; "someone's waiting at the gate" |
| 13–21 | **NOW HIRING**: the job, the money, the catch | a long-sleep program for Mars research | a deep-space courier job; the fine print: Earth time ≈ 70 years |
| 21–41 | **Real science, 3–6 facts**, each its own card | a frog that freezes and thaws; nobody brought back yet | relativity, GPS clocks, the twins study, the fastest probe, 99.99 % c, γ ≈ 70.7 |
| 41–50 | **The person who matters**, a tag with a leader line; a promise; a planted object | the engineer who got you in | Mia, 8; "one year"; her drawing of a robot holding a flower |
| 50–61 | **The robot and the quiet**: what the world is like without them | the future world tour (Earth dark, cities on the Moon, language changed) | OTTO's three phrases; Earth's messages can't catch up (1 day of news in 6 months) |
| 61–70 | **The turn**: the world comes back at you | the robot looks away; what the future can't read | turnaround: 70 years of messages in 6 months; Mia at 12, 18, 25 |
| 70–78 | **The strangeness**: the clue in plain sight | records of the crime | OTTO hums your lullaby, tells her jokes, draws flowers |
| 78–90 | **The reveal from records** | the list, the cover-up, why she did it | the update log: 4,112 patches, one author: Mia; her staff ID ages 22 → 72 |
| 90–97 | **The twist pays the cold open off; final countdown** | a second pod; she wakes in 7 minutes | the gate opens; she's 78, holding a flower; "you kept it, so did she" |
| 97–100 | **Question + comments + follow cards** | a question about the first words to her | would you take the job? |

- **Words:** 160 WPM overall (≈ 185 while speaking): ~450 words for 3 min, ~800 for 5. Second person, present tense
  after the rewind; past tense in the cold open. Short declaratives; the robot's lines reported ("…, it says.").
- **The twist must reframe, not add:** the cold open's strangest fact gets a loving reason. Plant its evidence three
  times (ours: the lullaby at 6 s, the drawing at 88 s, the flower at the gate).
- **Facts:** every number on a card is sourced twice (FACTS.md); fiction is labelled as fiction there.
- **Voice:** Kokoro blend `am_onyx,am_michael`, speed 1.08, gaps 0.24–0.88 s (longest before act changes).

## 4. Visual system
| role | source (measured) | ours |
|---|---|---|
| grounds | navy/black `#04070f` `#0a0e17` `#010205` `#151b29` `#22313e`; dark frames 82 % | gradients `#141c2c`→`#070b14`, `#0c1424`→`#04070f`, a dusk scene `#36345e`→`#f2a86a`; vignette 0.55, grain 5 % |
| accents | cyan `#68f0f8` (buttons, timers, tags), yellow `#f8d858` (money, countdown, PLAN), red (ACTUAL, alarms), cream paper `#d6d3cc` | cyan `#62e8f4`, yellow `#f5c84a`, red `#ff5a6a`, green `#5fe0a0` (the gate), paper `#efe6d2`, suit orange `#e8743b`, Mia yellow `#f2c94c` |
| type | geometric sans bold, letter-spaced caps for labels; mono for counters; serif for documents | Poppins 500–800 (labels ls 3–9 px), JetBrains Mono (HUD, counters, the log), Caveat (the child's drawing) — all OFL |
| HUD box | x 1380–1890, y 30–142, radius ~14, 1–2 px grey border, near-black fill; label 16–17 px ls ~4.5; right label 14–15 px grey; value mono ~30 px right-aligned at y 105 | identical geometry; label/right label/value re-labelled per act |
| people | faceless round heads with glowing eyes, puffer jackets | round heads with simple faces (dot eyes, blush, a mouth line), padded suits; kid / adult / 78-year-old variants |
| robot | white humanoid, black visor with an orange light bar | OTTO: a white egg that hovers on a cyan thruster glow, a dark rounded screen face (cyan eyes / text / drawings), an orange antenna bulb |
| tags | cyan filled label + thin leader line to a ringed dot | same grammar (`G.tag(text, x, y, {px, py})`) |

- **Safe area (16:9):** keep labels inside x 120–1800, y 140–990; the HUD owns the top-right corner; the question pill sits at
  y 890–1006 (low-centre, inside title-safe).

## 5. Shot grammar and transitions
- Scenes are illustrations with slow camera moves (zoom into a card, a pan across a set); ~10–12 hard cuts in 3 min, the
  rest cross-dissolves (0.5–0.7 s) and builds inside a scene (cards pop on words). Source: 18 cuts in 302 s.
- Act changes are hard cuts; fact-to-fact steps inside an act dissolve.
- The rewind is a smear (blur, light streaks rolling) plus the year scramble, dissolving in over 0.35 s.

## 6. Motion grammar
- Pops: alpha 0 → 1 with a back-out scale 0.85 → 1 over 0.3–0.45 s, keyed to the word that names the thing.
- Counters roll with an ease-out cubic (money, years, patches); timers tick in real time with microseconds.
- Characters breathe (1–2 px bob) and blink; the robot bobs (±6 px at 0.35 Hz) and turns by squeezing its screen.
- Typed text at 26 chars/s for robot lines.

## 7. Captions
- The source burns in **no narration captions**: on-screen labels carry the key facts; the question at the end is the only
  caption-like pill. Keep it that way (the SRT ships beside the mp4 for platforms that read it).

## 8. Sound
- Source (measured): one narrator; a tonal ambient bed in **D minor** (chroma D, C♯, A, F, E in the gaps) with no pulse,
  about 14 dB under the voice, fuller at the start and swelling on the closing cards (−17 dB RMS there).
- Ours: `tools/sound_design.py` (numpy, original): drone D2/A2, pads Dm9 – B♭maj7 – Gm – A every 8 s, sparse soft-piano notes,
  a 120 BPM eighth-note arpeggio under the reveal, a D-major lift with a shimmer on the gate; OTTO's lullaby (an original
  six-note tune) hummed twice; UI pops, ticks, chirps, whooshes, pings, a door, chimes. `final.m4a` + `nomusic.m4a`.

## 9. Retention devices
- Frame 0 is a complete still (hook line, counters, characters, HUD). The cold open poses a "why" that is answered at 85 %.
- A pop, a counter or a tag every 3–6 s; act changes every 15–25 s; the rewind at ~11 %.
- Science gives the viewer something to repeat in the comments; the question at the end is a debate (YES/NO or one line).

## 10. Do / don't
- **Do:** double-source every fact; keep the twist kind; keep one palette; let the HUD re-label per act; put the twist on
  the robot or a record the viewer has already seen.
- **Don't:** copy the source's premise (cryosleep), its robot, its twist (the saboteur who saved you), its future world
  or its lines; draw real people (two generic figures stand in for the twins study); add burned-in narration captions.

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-scifi-whatif/assets/template my-film && cd my-film      # runnable demo
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I <explainer-engine>/audio/tts.py vo
END_CARD=5.3 python -X utf8 -I tools/build.py my-film       # film-vo.js, out/<key>.srt, index duration
# the film: assets/lib/<film>.js — window.ONEYEAR-style factory: scene(t0, {xf, draw(G, t, lt)}) + hudFor(t)
node tools/scenes.cjs --mids                                 # scene mid times for snapshots
npx -y hyperframes@0.8.210 snapshot --at "<times>" --no-end -o scratch/snap && python -X utf8 -I tools/sheet.py scratch/snap 5 384
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I tools/sound_design.py
bash <tools>/render_locked.sh "$PWD" out/master_r1.mp4 delivery
python -X utf8 -I tools/qa.py encode out/master_r1.mp4 1.0 && python -X utf8 -I tools/qa.py qa <source metrics.json> --len-lo 150 --len-hi 180
<python with faster_whisper> -X utf8 -I tools/whisper_check.py
```
- **Kit API** (`assets/lib/scifi-kit.js`): `SCIFI.kit(ctx)` → `G` with `ground(top, bottom, glow)`, `stars(t, {seed, n, speed, drift,
  x, y, w, h})`, `grain`, `vignette`, `glowDot`, `hud(label, right, value, {valC})`, `person({x, y, s, t, suit, suitD, skin, hair,
  style, age, expr: calm|smile|happy|worried|sad|open|wide|closed, look, walk, seat, armL/armR: down|wave|reach|hold|lap|cane|hug,
  holding(fn), badge, cap, braces, glasses, coat, buns, flip})`, `YOU`, `MIA(age)`, `otto({x, y, s, t, face: idle|happy|flat|worried,
  turn, arm, screen(fn)})`, `flower`, `kidDrawing`, `ship(x, y, s, {thrust, rot, flip, label})`, `planet(x, y, r, {seed, rot})`,
  `card`, `tag(text, x, y, {px, py, bg})`, `bubble(text, x, y)`, `text(s, x, y, {size, weight, fam, color, align, ls, glow, a})`,
  `typed`, `pop(t, t0, d)`, `rr`, easing helpers.
- **Film structure** (`assets/sample/assets/lib/oneyear-film.js`): scenes are full redraws; a scene with `xf` dissolves in
  (the outgoing scene keeps moving, drawn on an off-screen canvas). `hudFor(t)` returns the HUD's label/right/value per act.
- Fonts load before the first draw (`document.fonts.load` in `buildReady`); a hidden span per weight warms them.
- Performance: 5,289 frames at 1080p in ~10 min on the iGPU (2 workers).

## 12. Gotchas
- **Canvas text alpha:** restore `globalAlpha` explicitly after each label (dividing it back drifts to 0/∞ when a = 0).
- **A zoom into a card collides with the HUD box**; fade the card's top lines while zooming (or zoom toward the bottom).
- **Frame 0 must be complete:** don't pop the cold-open text in from alpha 0 at t = 0.
- **Labels over figures:** a leader-line tag must not sit on a head; measure the figure's head height (≈ 1.6 × scale × 120 px).
- **The scene-change metric is palette-based:** a one-palette film registers few changes; plan act changes as hard cuts
  between differently lit grounds (cabin, hangar, dusk, space) to land near the source's 4.4/min.
- **One palette hides the cuts.** Render 1 (all night-navy) measured 0.68 cuts/min and 0.34 scene changes/min against the
  source's 3.58 / 4.37: the detector needs a mean frame difference of ~33/255 across a cut and a 64-bin histogram jump for
  a scene change. The source gets them from its paper cards (contract, newspaper, letters, court documents) and coloured
  inserts. Render 2 added the same device (a paper contract, a textbook page for the physics, a printed update log, the
  child's drawing full-frame, light gate doors, bright message tiles) and was checked first with `tools/cut_est.py`.
- **Shell heredocs with Python triple quotes fail here**; write patch scripts with the Write tool.
- **Whisper writes numbers as digits** ("2031", "99.99%", "$5 million"); give those lines a digit form in
  `vo/whisper_alt.json` so the check compares like with like.
- **Never `-shortest`** when muxing; `qa.py encode` maps both streams and the QA checks lengths and frame counts.

Files: `references/sources.md` · `assets/template/` · `assets/sample/` (the full "One Year Away" project) · `tools/`
(study.py, audio_study.py, build.py, qa.py, whisper_check.py, sound_design.py, audiolib.py, scenes.cjs, sheet.py)

## Appendix A — source analysis (`DffMkrzTg5q`)
Measured from the analyzer output, our 2 fps sweep (13 sheets), 8 fps strips around all 18 detected cuts, 26 full-size
grabs, a spectrogram, a tempogram and the chroma of the speech gaps.

**Numbers.** 301.77 s, 1920×1080, 30 fps · 18 analyzer cuts (3.58/min; median shot 12.3 s; first cut 12.3 s) · 22 scene
changes (4.37/min; median 10.7 s) · 818 words, 162.6 WPM · brightness 0.224, colourfulness 21.3, saturation 0.512, flat
0.709 (vector), dark frames 82.5 % · motion mean 3.12, holds 34 % · −14.1 LUFS · bed D minor, no pulse.

**Cut times (s).** 12.30 39.37 45.07 91.90 115.97 144.60 149.67 177.47 179.13 196.63 201.87 207.40 217.67 232.20 234.90
240.00 243.80 278.80. Scene events: 10.67 45.17 46.83 67.67 94.67 99.50 111.0 115.67 144.17 149.33 167.67 177.17 180.83
206.83 217.17 231.67 234.50 240.33 243.67 267.33 278.33 295.50.

| t (s) | act | picture / overlay |
|---|---|---|
| 0–5.5 | cold open | a frosted pod centre-right (label tag on top), "POV: …" hook top-left, YEAR counter 2026 → 2036 with a yellow PLAN line, then 3026 cyan with a red ACTUAL line; HUD TIME ASLEEP · PLANNED: 10y |
| 5.5–12 | flashback | a row of pods, a silhouette at a terminal panel (WAKE-UP SYSTEM · STATUS: ARMED), a red wash |
| 12–21 | the robot | the pod opens; a white humanoid robot; an alien-script sign; YEAR 3026 rolls in; HUD TIME AWAKE · YEAR 3026 |
| 21–23 | rewind | ◀◀ + the year scrambling 2975 → 2027, horizontal smear |
| 23–29 | NOW HIRING | the empty pod (READY) left, the card right: NOW HIRING · 2026, the program, $2,000,000 rolling, a cyan button |
| 29–51 | why + science | Earth → Mars with a ship (~7 MONTHS), a contract ("deal" stamp), a frog frozen (0 BPM) then alive (SPRING), a grid of humans: 0 brought back |
| 51–60 | the person | you and her by the pods; a cyan tag with a leader line to her (engineer); body temperature card falling |
| 60–132 | the future | orbit view, Earth dark with city tags at 0 lights, the Moon's night side lit, Earth green and protected, the pod found under a forest (place tag), language cards, the robot's training data |
| 132–162 | digital dark age | a timeline with "???", a cloud, hard drive / 404 / old formats, a newspaper headline, a letter vs a camera roll, a museum fork |
| 162–196 | the record | security-camera replay (REC), a court document with GUILTY, a defendant card, BANKRUPT stamp, the pod alone with a year counter as roots grow |
| 196–259 | the letter | the robot hands over a note, a list of 46 names struck through (SURVIVED 0/45), a cell with ice crystals, a family letter (STILL RECOVERING), WAKE-UP: CANCELLED · STATUS: ALIVE, a newspaper (CRIMINAL), CELL REPAIR → COMPLETE |
| 259–296 | the twist | a second pod beside yours (her name), BUILT 2040, her garage, FROZEN, a note with her last request; HUD SHE WAKES IN 00:06:59 (yellow); the question pill |
| 296–302 | closing | TELL ME IN THE COMMENTS (yellow) + a speech icon; a self-promo card |

**What we keep / change.** Kept: the act structure and its proportions (compressed to 3 min), the HUD box and its
re-labelling, year counters, the rewind, the NOW HIRING card grammar, fact cards with leader-line tags, a robot companion,
records for the reveal, the final countdown + question + comments card, one night-navy palette, no burned-in captions,
a D-minor ambient bed. Changed: the premise (time dilation instead of cryosleep), the robot (a hover robot with a screen
face), the twist (the robot was her), all science, characters, lines and music; a follow card instead of a self-promo.
