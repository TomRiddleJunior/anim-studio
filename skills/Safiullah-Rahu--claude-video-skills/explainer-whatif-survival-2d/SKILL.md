---
name: explainer-whatif-survival-2d
description: "Makes a vertical 9:16 'what-if survival' story reel (130-170 s) in flat 2D inked cartoon, in the format of a viral Instagram series (@what_if_survival, 148 s, 58k likes): a red threat-count tag on frame 1 (40 DEAD), a chase that ends in an escape exploiting ONE physical rule about the dead (a big two-line title, then the science told with a magnifier diagram), descent or ascent tags (−100 M, −200 M), a hidden station nobody knows about, how you get in (labels + arrows), cream inventory cards with numbers (FOOD 600 PACKS / 2 A DAY / = 10 MONTHS), the one lifeline that depends on the outside world (a yellow tag, a bar meter with a red X), a RULE 1 card with a red stamp and an explainer sheet with a second stamp, DAY 1 / 5 / 10 / 14 tags, the dead waiting above, a YOUR PLAN checklist whose last row turns into the forgotten dependency, a GOOD→BAD gauge with an X DAYS tag, strangers nearby who don't know you exist, a cream route map with clocks and a dashed red route through the dead, and a two-button dilemma card (CALL / ALONE) for the comments. Captions are 2-4 word Poppins ExtraBold caps with a dark outline and the spoken word in yellow (karaoke). Built in code with HyperFrames + one Canvas 2D composition (seek-exact) and a reusable kit: inked shapes with a seeded wobble, paper grain, scratch hatching, a stick-limbed hero with joint-angle poses, a seeded crowd of the dead, tags, title, cards, stamps, checklist, gauge, meter, vote card; a lock-free analyzer emulation to tune cuts and scene changes before rendering; Kokoro narration and an original 80 BPM bed with a no-music mix. Use for 'what if survival reel', 'zombie what-if cartoon', 'the dead can't X so you…', 'secret bunker / hidden station story', 'what_if_survival style', 'call or go alone dilemma', 'survival story with inventory cards and a fatal dependency'. Builds on hyperframes and the explainer engine (TTS, analyzer)."
---
# What-if survival 2D — one rule about the dead, one hidden station, one dependency, two bad options

Reverse-engineered frame by frame from one Instagram reel (@what_if_survival, `DfUvZx9Bl_f`, 148.4 s; sources in
`references/sources.md`, the full analysis in Appendix A). The format is a **second-person what-if** told like an
illustrated explainer: every sentence gets a picture and most get a label, a number or a stamp. The story escapes
through one rule about the dead, hides in a station nobody knows, inventories it, then reveals that the station's
lifeline depends on the outside — and hands the comments a choice between two costly options.

Sample: `assets/sample/` — **"The Dark Mine"** (155.4 s, three renders). Forty of the dead chase you into a mine; twenty metres in,
the daylight is gone and they stop: *the dead can't see in the dark* (a dead cornea clouds over). You walk down 300 m
in the dark to a refuge chamber you fixed up alone. Its air comes down one shaft, pushed by a fan that runs on the line
from an unmanned dam. On Day 14 the fan stops: someone at the dam is switching off every line they think is dead.
CALL them and they'll know you're here, or go up ALONE — two hours of ladder in the dark, then 600 m across the yard
to open an old capped shaft so the mine breathes by itself. Its SCRIPT.md, SAMPLE.md (gates, what reads well, what is
weaker), POST.md and FACTS.md are in the sample folder.

## 1. Signature traits
- **Second person, present tense, short declaratives.** About 400 words in 148 s; a picture changes at least every
  2-3 s; almost every sentence lands on a label (tag, card line, stamp, pill or arrow).
- **Frame 1 = threat count**: a big red rounded tag (white heavy number + noun, dark outline, slight tilt, scratch
  hatching) over a wide of the chase. It fades at ~2 s.
- **The rule about the dead** is a two-line title (white line + yellow line, heavy outline, −2° tilt) at ~5 % of the
  runtime, then **the science** in 2-3 lines with a diagram (the reference used buoyancy; ours a magnifier on a dead
  eye). The escape exploits it physically.
- **Depth/height tags** (dark rounded pills, white text) pop on the spoken numbers during a long pan.
- **The hidden station**: its lights come on in the dark, "abandoned N years", "you fixed it up alone", "nobody knows
  it's here" (a pull-out that shows how small and hidden it is).
- **How you get in** (a physical principle: air pressure) with coloured pills and arrows.
- **Inventory cards** (cream paper, ink outline, icon in a circle, a grey label, 1-3 lines in red / ink / green / blue,
  appearing line by line on the words) over a cutaway interior.
- **The lifeline**: one yellow tag ("AIR: 1 SHAFT"), a bar meter card (small source vs big need, red X), the outside
  thing it depends on (diesel / a dam line), its rhythm (a calendar or "nobody's there").
- **RULE 1** card + red stamp, then an **explainer sheet** with a magnified diagram and a second stamp: the rule that
  makes the solo option slow and dangerous (the reference: decompression; ours: daylight blindness after weeks in the
  dark → only at night, 2 hours of ladder).
- **Days montage** (DAY 1 / 5 / 10 dark tags at the top) + **the dead waiting above** (a circle looking up at them).
- **The break** (DAY 14: the supply stops), **YOUR PLAN** checklist (✓ ✓ ✓, then the last row "?" → red tag with the
  dependency), the **gauge** GOOD→BAD + a red "X DAYS" tag.
- **Strangers nearby** who have what you need and don't know you exist (a distance tag, a family silhouette).
- **The route map** (a cream paper diagram in section: you, the route, clocks, a dashed red line through the crowd,
  a distance tag, a zoom into "through them").
- **The dilemma card**: question at the top (white, outlined), a yellow-ringed medallion with the scene as an icon, a
  green button (option 1, the social cost) and a blue button (option 2, the physical risk), each with an icon, a big
  word and a check-circle sub-line, a dark footer pill `COMMENT "A" OR "B"` in yellow; held ~5 s after the last word.

## 2. Measured metrics (reference vs sample vs gate)
Reference: the engine analyzer on `DfUvZx9Bl_f` + Whisper words. Sample: `assets/sample/out/qa/` (gates.json).

| metric | reference | sample | gate |
|---|---|---|---|
| duration | 148.4 s | 155.4 s (+4.8 %) | ±15 % |
| analyzer cuts / min | 10.52 (26 cuts; ~54 visible changes by eye) | 10.81 (renders 2 and 3; render 1 was 14.67 before ten dissolves) | ±20 % |
| scene changes / min | 19.01 | 16.99 | ±20 % |
| WPM | 161.8 (400 words; ~244 while speaking by Whisper word times) | 162.9 analyzer (430 words) | ±20 % |
| first word · first change | 0.0 s · tag on frame 1 | 0.16 s · tag on frame 1 | ≤ 0.4 s |
| loudness | −14.1 LUFS, a soft continuous bed | −14.0 LUFS both mixes, TP −2.0 dBTP | −14 ±1, TP ≤ −1 |
| voice over bed | ~15-20 dB (quietest frames −30 dB vs speech −17 dB) | 15.9 dB over everything, 19.6 dB over the music | ≥ 10 dB |
| Whisper `small` | — | 45/45 lines, worst recall 0.86 | every line |
| edge black bands (10 fps) | — | 0 frames with a band ≥ 24 px, worst 2 px (render 3; render 2 had up to 524 px) | none ≥ 24 px |
| brightness · colourfulness · motion | 0.50 · 46.1 · 7.29 | 0.41 · 37.8 · 5.28 (a mine is darker than a sea) | look |
| tempo | onset candidates 160 (≈ 80 BPM half-time) | 80 BPM bed | match feel |

The analyzer counts a cut only when ffmpeg's scene score > 0.33 (≈ a mean absolute YUV difference over 33/255 between
two frames) and a scene change only when ≥ 28 % of pixels change 64-level colour bins over 1 s. Flat cartoons cut
between similar palettes score low; tune with `tools/dbg.html#analyze=…` (§12) before the first render.

## 3. Beat map (% of runtime) and script formula
| % | beat | reference (shape) | sample |
|---|---|---|---|
| 0-5 | **Hook**: threat count + chase + the escape move | a horde, a dead end, a jump | 40 dead, a mine yard, run into the adit |
| 5-9 | **They follow — and fail** + the **title rule** | the dead go in after you and fail | they follow in, the daylight ends, they stop; THE DEAD / CAN'T SEE IN THE DARK |
| 9-13 | **The science** (2-3 lines + a diagram) | decay → gas → floats | the cornea clouds within hours; shapes by day, nothing in the dark |
| 13-18 | **The escape in action** + depth tags | swim down, 10 M, 20 M | lamp off, hand on the rail, −100 M, −200 M |
| 18-25 | **The hidden station** (lights, years abandoned, fixed alone, nobody knows) | a seabed lab | a refuge chamber, 12 YEARS, ALONE, a pull-out |
| 25-28 | **How you get in** (a physical principle, pills + arrows) | air holds the sea back | an airlock, positive pressure, BAD AIR stays out |
| 28-37 | **Inventory cards** (food, water, power, first aid, a weapon/tool) | 5 cards | FOOD / WATER / POWER / FIRST AID / TOOL |
| 37-47 | **The lifeline** (tag, meter with X, the outside source, its rhythm) | air via a hose, pump on diesel, a boat every 2 weeks | air via one shaft, a fan the turbine can't spin, the dam's line, "nobody's there" |
| 47-58 | **RULE 1** (card + stamp) + **explainer** (diagram + stamp) + the slow safe way | never go up; 17 h in a back room | never go up by day; pupils, BLIND, 1 MIN; only at night, 300 M, 2 H |
| 58-66 | **Days montage** + **the dead waiting** | DAY 1/5/10, a porthole full of the dead | DAY 1 (camera feed), 5, 10, a circle of faces looking down the shaft |
| 66-69 | **The break** (DAY 14) | the boat doesn't come | the fan stops (a ribbon on the vent drops) |
| 69-76 | **YOUR PLAN** ✓✓✓ + "but you forgot one thing" → the dependency tag | AIR → DIESEL | AIR → THE DAM |
| 76-80 | **Countdown**: gauge GOOD→BAD + X DAYS tag | 6 days of fuel | AIR: 6 DAYS |
| 80-86 | **Strangers** (night radio, distance, who, what they have, they don't know you) | a family on a boat, full tanks | someone at the dam, a family switching lines off |
| 86-96 | **Two options** told: one call…; or alone (the route map, clocks, distance, "through them") | call the boat / 17 h + 600 m | call the dam / 2 h ladder + 600 m to the capped shaft, cold air in, warm air out |
| 96-100 | **The dilemma card**, read once, held | CALL / ALONE | CALL / ALONE |

- **Words**: ~400-430, 45-52 lines, phrases of 2-4 words on screen. Kokoro `am_michael` at speed 1.2-1.25 lands near
  the reference's ~162 WPM overall. Gaps 0.3-0.45 s inside a beat, 0.6-0.8 s before a new beat.
- **The rule about the dead** must be physical, plausible and stated as the story's rule, then explained by one real
  fact (FACTS.md). It must make the escape work AND shape where the dead wait later.
- **The dependency** must be planted early and innocently (the lifeline beat at ~40 %), and the solo option must cost
  something because of RULE 1 (time, darkness, a route through the dead).
- **The two options**: one social (reveal yourself to strangers), one physical (go through the dead). Two single words
  for the comments.

## 4. Visual system
| role | reference | sample |
|---|---|---|
| ink | dark brown outlines 4-7 px, round joins, slightly wobbly | `#2b2420`, `K.rrough` seeded wobble (never boils) |
| texture | paper grain over everything, light diagonal scratch strokes on tags/cards/buttons | `K.grain(0.07)` overlay pattern, `K.hatch` |
| palette | sunset (purple → orange), sea blues `#295a7a #628c9d`, steel whites, cream `#e8e0d0`, red `#c83830`, green `#389048`, blue `#304878`, yellow `#e0b840` | sunset sky, rock strata browns `#a77a52 → #4e3828`, steel `#cfd3cc`, the same cream/red/green/blue/yellow |
| hero | stick legs/arms, round white head, beanie, olive jacket | a miner: white head, yellow hard hat + headlamp, orange hi-vis vest over a navy jacket, dot eyes, brows by expression |
| the dead | grey-green heads, messy hair, coloured worn jackets, arms forward | same build, our own hair/cloth sets (seeded), **milky white eyes** (the rule) |
| tags | red rounded tag (frame 1), dark pills (depths, DAY n), yellow labels with leader lines, coloured pills | `K.tagRed`, `K.tagDark`, `K.tagYellow`, `K.pill` |
| cards | cream, ink outline, icon circle, grey label + coloured lines | `K.card`, `K.ruleCard`, `K.stamp`, `K.checklist`, `K.gauge`, `K.meter`, `K.vote` |

- **Layout (1080×1920)**: the reference puts captions at y ≈ 1695 (88 %). This skill keeps key text inside the 9:16
  safe area: **captions centred at y 1258**, the action in y 300-1180, the lower frame is scenery (ground, the world
  underneath). Tags/cards live at y 200-650; the vote stack spans y 214-1212.
- **Type**: Poppins ExtraBold for everything heavy (captions 74 px, tags 46-118 px, card lines 56-96 px), Poppins Bold
  for labels; caption outline 11 px `#2b2420` + a hard drop shadow.

## 5. Shot grammar and transitions
- ~48 shots in ~150 s: wide chase → closer → inside → the rule title over the failed dead → a diagram → the escape
  (long pan with tags) → station reveal → close details → pull-out → cutaway (entry) → inventory close-ups (one item
  per card) → section pan up the lifeline → the outside source → meter card → map pan → RULE card → explainer sheet →
  glare insert → the safe way (section) → days (interior / monitor) → looking up at the dead → the break (a small
  physical sign) → checklist over the section → gauge → night radio → the strangers → section with YOU → the call →
  the route map (three framings) → zoom "through them" → vote card.
- **Hard cuts** on word onsets (−0.06 s), plus a 0.26 s cross-dissolve where two similar shots meet (ten in the
  sample, chosen to bring the analyzer's cut rate to the reference's); the camera always moves (push 4-10 %, pans along
  sections, pull-outs). Tags pop with back-out (0.3 s), stamps slam (1.6 → 1.0 scale), card lines appear on their words.
- **Tune for the analyzer**: consecutive shots should differ in palette (alternate warm exterior / cool or dark /
  pale interior / cream card / green monitor). Close-ups of single objects (the tank, the batteries, the first-aid box)
  both read better and register as scene changes.

## 6. Motion grammar
- Run cycle 11 rad/s, zombie shuffle 6.5-8 rad/s with per-figure phase/speed; arms forward with a slow sway; the
  crowd moves as a field (`vx` per second). The dead **stop** in the dark: arms out, "?" pops.
- Lights are events: a lamp clicks off on its word, a green beacon fades up, a vent ribbon drops when the fan stops.
- Camera eases in-out cubic for reveals, linear for long pans; pull-outs 0.95 → 0.36 zoom.

## 7. Caption system (`tools/build.py`)
- One 2-4 word CAPS phrase at a time (≤ 20 characters), a break after punctuation, a lone word joins its neighbour.
- Poppins ExtraBold 74 px, white `#fbf8f0`, 11 px dark outline (`paint-order: stroke fill`) + a 6 px hard shadow.
- **Karaoke**: the word being spoken turns yellow `#f4c430` from its start (−0.03 s) to the next word's start.
- Appear: scale 0.92 → 1 in 0.07 s on the first word (−0.06 s); held until the next phrase.

## 8. Sound (`tools/score.py` + `tools/audiokit.py`)
- Reference: dry narration over a soft continuous bed, ~15-20 dB under, a few hits.
- Sample: voice (Kokoro, look-ahead peak limit at 11 dB crest, small room), ambience (wind outside, mine air + drips
  inside, the chamber fan hum **that stops on Day 14**), story foley + UI (stamp hits, pops per tag/card line, ticks
  per checklist row, groans PG, relay clunks, radio crackle, whooshes on cuts), **music in the full mix only**: an
  original 80 BPM D-minor bed (marimba ostinato on 8ths, soft kick + shaker, pads, a lift to F major at the hideout, a
  minor-second drone under RULE 1, silence when the fan stops, a snare roll into "through them").
- Levels are set relative to the voice's speaking RMS (music −19 dB, ambience −27 dB, sfx −15 dB where active), then
  everything but the voice is pulled down together until it sits ≥ 12.5 dB under; each mix is levelled separately to
  −14 LUFS with a true-peak-aware limiter at −2 dBTP (AAC adds ~0.5 dB).

## 9. Retention devices
- A number on frame 1; the rule title by 7 %; a label on almost every sentence; read-along cards; a stamp every
  ~20 s; DAY tags as a clock; the planted dependency paid off by the checklist at ~70 %; a countdown tag; a map that
  makes the solo option concrete; a two-word vote with a social vs physical cost.

## 10. Do / don't
- **Do**: one rule about the dead, physical and explained once; plant the dependency innocently; give every number a
  tag; keep the hero's face out of the caption band (y 1200-1320); end on the card in silence-ish (music only).
- **Don't**: copy the reference's place, rule, lines or button sub-lines; show gore (the dead stand, reach, groan,
  float or stop — never bite); let a card line run past x 1010; put text in the bottom 20 %.

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-whatif-survival-2d/assets/template my-whatif && cd my-whatif   # runnable 3-shot demo
# 1) vo/script.json: {"voice","speed","lead":0.1,"tail","lines":[{id,text,gap}]}
python -X utf8 -I "$EXPLAINER_ENGINE/audio/tts.py" vo      # Kokoro: vo/audio/vo.wav + vo/data/vo.json
python -X utf8 -I tools/build.py                           # vo-data.js, captions.html (karaoke), world.html, index.html, out/<name>.srt
# 2) assets/lib/film.js: shots {id, t0 (from word times), cam(u)->{z,cx,cy}, draw(lt,u,t), post(lt,u,t)} on the kit
python -X utf8 -I tools/devserve.py .. 8765 &              # lock-free drawing iterations (serves the samples folder)
#    open http://127.0.0.1:8765/<project>/scratch/dbg.html#shots=1&cols=8&w=240&band=1&save=<project>/scratch/dbg/s.jpg
#    analyzer emulation:  #analyze=<project>/scratch/analysis.json      shot times for the score: #times=<project>/score/shots.json
python -X utf8 -I tools/score.py                           # both mixes (needs score/shots.json), levels.json, assets/audio/final.m4a
bash tools/snap.sh 0.05,2.4,…                              # one still per shot, under the shared render lock
bash "<styles>/tools/render_locked.sh" "$PWD" out/<name>_master.mp4 delivery
bash "<styles>/tools/with_render_lock.sh" bash tools/deliver.sh       # CRF 19 + no-music remux, prints stream lengths + frame counts
python -X utf8 -I tools/qa.py --analyzer "$EXPLAINER_ENGINE/qa/analyze_video.py" --source-metrics <ref metrics.json> --source-clip <ref.mp4>
python -X utf8 -I tools/whisper_check.py                   # under the lock, with faster-whisper
python -X utf8 -I tools/cover.py <t> "THE DARK MINE" "WHAT IF…" "CALL OR ALONE?"
```
- Kit (`assets/kit/sv-kit.js`, `SV.create({canvas})` → K): primitives `rr`, `rrough` (seeded wobble), `poly`, `line`,
  `circle`, `ell`, `fs`, `text`, `glow`, `arrow`, `dashed(pts, k)`, `hatch`, `grain`, `vignette`, `fade`; scenery
  `sunsetSky`, `sun`, `cloud`, `birds`, `strata` (rock bands + speckles + cracks; `floor: true` continues the deepest band down without end), `timberSet`, `rails`; characters
  `hero({x,y,s,dir,walk,run,pose:"run|climb|sit|crouch|shield|reach|radio",lamp,expr,lampGlare,dark,arms,legs,lean})`
  → `{head, lamp}`, `dead({seed,…})`, `horde(list,t)`, `beam(p,ang,L,hw,a)`; overlays `tagRed`, `tagDark`,
  `tagYellow({leader})`, `pill`, `title2(l1,l2,…,{k2})`, `icon(name)` (ration, drop, bolt, cross, pick, fan, eye, sun,
  radio, mine), `card({icon,label,lines:[{t,col,px,k}]})`, `ruleCard({n,stamp,stampK})`, `stamp`, `checklist({rows:
  [{icon,t,mark:"ok"|"?"|{tag,col},k}]})`, `gauge({v})`, `meter({rows:[{t,icon,v,col,x}]})`, `clockFace`, `vote({q,
  medal,b1,b2,foot,k1,k2,kf,pulse,layout})`. All pure functions of their arguments.
- Film sets in the sample (`assets/sample/assets/lib/film.js`): the mine yard with the world underneath (`under()`),
  the portal, the horizontal tunnel with daylight falloff (`tunnel()` + `tunnelDark()`), the mountain section
  (`mountain()`, `msPoint(u)` along the decline), the cave + refuge chamber, the chamber interior cutaway
  (`interior({tally, flow, dim, monitorOn, radioOn})`), the monitor feed, the valley with pylons and the dam, looking up
  a shaft (`shaftUp({kind, heads})`), the route map (`routeMap({capK, flowK, coldK, warmK, routeK})`).
- Performance: Canvas 2D on CPU; one frame of the sample draws in ~0.1-0.3 s; `render_locked.sh … delivery` with 2
  workers. Iterate in the browser (devserve + dbg.html), snapshot once, render at most twice.

## 12. Gotchas
- **Captions under 1300**: the reference's 88 % caption line would be covered by the app UI; at y 1258 the action has
  to stay above ~1180, so every set is built with its walking line at y 1160-1190 and scenery below.
- **Emulate the analyzer at full resolution.** Our first emulation measured ffmpeg's scene score on 270×480 frames:
  averaging fine detail away under-reported every cut (8.5 → 10.8/min after tuning), and render 1 measured 14.67/min.
  `dbg.html#analyze=` now scores full 1080×1920 frames (slower: ~10 min for 150 s). The fix in render 2 was a 0.26 s
  cross-dissolve on ten cuts between similar-palette shots (`XF` in film.js), which spreads the change over ~8 frames.
- **Flat art can also under-report cuts** when consecutive shots share a palette: close-ups of single items, a
  blue-hour grade on one exterior and a glare insert raise both cut and scene-change counts.
- **Check partial black bands, not only whole-frame dips.** Zoomed-out section shots (zoom 0.36-0.62) looked past
  the bottom of the drawn rock and left a black band up to 524 px tall that the whole-frame YAVG check cannot see.
  `K.strata(…, { floor: true })` now continues the deepest band 12,000 px down (with its own speckles); use it on every
  set whose camera can pull back. `tools/qa.py` now scans every frame at 10 fps for solid black rows (mean luma < 6,
  std < 3) touching the top or bottom edge and writes `out/qa/bands.json` (gate: no band ≥ 24 px outside the
  `planned_dark` beats in `qa_config.json`).
- **The YAVG check must ignore steps**: a hard cut from a bright set to a dark one is not a black frame; `qa.py`
  flags a frame only when it differs from both neighbours.
- **Python triple quotes in bash heredocs fail when the text has apostrophes** — write patch scripts with the editor
  or keep them free of `'`.
- **Sums of sounds with different lengths**: use `audiokit.mix()`; `a + b` on arrays of different lengths throws.
- **Levels**: Kokoro + a pad stack summed raw put the music 2 dB *over* the voice; level stems relative to the voice's
  speaking RMS (§8) instead of by hand.
- **Exported shot times**: `window.SV_TIMES` holds the film's own `T`; never name a key `end` (it collided with the
  duration in the export).
- **The browser pane is shared and may be hidden**: a long synchronous `#analyze` run blocks the page for minutes;
  wait for the file instead of calling into the page.
- **Never `-shortest`** when remuxing the no-music mix; `deliver.sh` cuts both streams with `-t` and prints frame counts.

Files: references/sources.md · assets/kit/sv-kit.js · assets/template/ (runnable 3-shot demo: index.html, compositions/,
assets/lib/{sv-kit.js, film.js, vo-data.js}, assets/fonts/, assets/audio/final.m4a, vo/, score/shots.json, tools/) ·
assets/sample/ ("The Dark Mine": the full project with SCRIPT.md, SAMPLE.md, POST.md, FACTS.md, out/qa without compare.jpg, which shows reference frames) · tools/
(build.py, score.py, audiokit.py, qa.py, qa_config.json, whisper_check.py, deliver.sh, snap.sh, tile.py, cover.py,
devserve.py, dbg.html, and the analysis tools study.py, grab.py, words.py, audio_probe.py, pitch.py)


The sample ships without its voice WAV and score WAVs (size): re-run the engine's `tts.py` on `vo/` (same script, same voice → the same timings) and `tools/score.py` to rebuild them; `assets/audio/final.m4a` is the finished mix. `$EXPLAINER_ENGINE` is the explainer engine folder (`audio/tts.py`, `qa/analyze_video.py`); `$FFMPEG` / `$FFPROBE` point at the binaries when they are not on the PATH; `LOCK_WRAPPER` makes `snap.sh` run under a shared render lock.

## Appendix A — reference analysis (`DfUvZx9Bl_f`), frame by frame
Measured from 10 fps frame differences (full frame + caption/top/middle bands), 2 fps sheets, 31 full-size key frames,
Whisper word times and the analyzer. Visible shot changes ≈ 54 (the analyzer registers 26: flat palettes score low).

| t (s) | shot / beat | picture and overlays | caption / sound |
|---|---|---|---|
| 0.0-2.3 | wide chase at sunset | pier, city skyline with smoke, sun low right; ~24 dead (grey-green heads, coloured jackets) chasing the hero; red tag "40 DEAD" (x 240-840, y 345-535, −3°), fades 1.8-2.1 s | 2-4 word karaoke from 0.0 s; voice + a soft bed from frame 1 |
| 2.4-6.0 | pier end, the jump | pan right to the railing (NO DIVING sign), the hero dives, the horde leaps after | |
| 6.0-7.8 | the dead in the water | floating heads at sunset; two-line title (white + yellow, outlined, −4°) at 6.5 s, y ≈ 460-600 | |
| 7.8-14.0 | underwater, the science | the dead float at the surface, the hero by a pile; diver gear appears | rule explained in three short lines |
| 14.0-19.2 | descent | the hero swims down past a fish school; dark pills "10 M" (16.2), "20 M" (17.7) at y ≈ 290 | |
| 19.2-29.7 | the station | lights switch on in the dark; exterior on stilts; "abandoned" + "fixed it up alone"; wide with the surface crowded | |
| 29.7-35.2 | how you get in | cutaway: entry from below, blue pills SEA / AIR with up/down arrows | |
| 35.2-52.6 | inventory | 5 cream cards at y 230-640 (icon circle, grey label, red/ink/green/blue lines on the words) over the interior | |
| 52.6-64.6 | the lifeline | yellow tag with a leader line; bar meter card (two rows, red X); a fuel gauge close-up; a supply boat + a calendar card | |
| 64.6-84.6 | RULE 1 + explainer | RULE [1] card with a red stamp; an explainer sheet (a magnifier on blood, bubbles, a soda bottle, a stamp); a back-room cutaway + tag; a hatch with gauges and a clock + an hours tag | |
| 84.6-96.0 | days | DAY 1 / 5 / 10 dark tags at the top over interior beats; a round porthole looking up at the floating dead | |
| 96.0-100.4 | the break | DAY 14 tag; the calendar day crossed out | |
| 100.4-110.1 | the plan | YOUR PLAN card (three rows, ✓ ✓, "?" → a red tag); the source up above with a yellow tag and a depth tag | |
| 110.1-115.0 | countdown | a red "FUEL: X DAYS" tag over the gauge; an AIR gauge card GOOD → BAD | |
| 115.0-124.0 | strangers | night: the radio; a boat 2 KM away (yellow tag + dashed line); a family; a fuel gauge card E → F | |
| 124.0-138.0 | the options | the radio close; the route map card (section, clocks with hours, a red route, a distance, a zoom into the crowd) | |
| 138.0-148.4 | the vote | question (white, outlined) at y ≈ 230; medallion (yellow ring) at y ≈ 560; green button y 770-1060, blue y 1080-1370; footer pill y 1395-1505 (yellow text); the narrator reads both options; ~4.5 s hold | captions continue under the card at y ≈ 1695 |
