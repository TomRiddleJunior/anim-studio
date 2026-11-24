---
name: explainer-choice-night-story
description: "Makes a vertical 9:16 interactive 'night story' reel (90-100 s) in the format of a viral Instagram series (@oddhourtales, 'Seven Nights at the Lighthouse · Part 1', Night 1 of 7, 83k likes): flat 2D night art with a stick-figure keeper, second-person past-tense narration (the hook: you took the job nobody wanted), a departing driver who shouts the stakes (three short exclamations, the last a rule in disguise) under a small coloured speaker tag, the vanished predecessor, his RULES SHEET pinned to the wall with the rules handwritten one by one as they are read and the last rule scratched out, a counted ritual with a STEP counter (a big painted step number), a light-on flash that brings in a HUD (● NIGHT 1 / 7, a big clock, the place, status chips), a log card, a wall clock that turns the hour red, a call from outside (radio / knock) in amber captions with a device-and-channel style tag, the rule that forbids answering popping up as a red card, and a two-button vote card (a yes/no question, two one-word buttons, a 'comment your choice' footer) held in silence. Caps captions 1-3 words, Oswald, yellow and red keywords. Built in code with HyperFrames + a Canvas 2D shot player (seek-exact), Kokoro voices, a synthesized ambient bed + foley, two mixes (full + no-music). Use for 'seven nights at the …', 'night 1 of 7', 'rules horror for kids / PG rules story', 'keeper rules sheet', 'interactive story where the comments decide', 'comment A or B', 'answer or silent', 'oddhourtales style', 'night-shift job story with rules', or any series story whose part ends on a rule-versus-instinct vote. Builds on explainer-engine (TTS, QA) and hyperframes."
---
# Choice night story — rules on the wall, one night, one vote

Reverse-engineered frame by frame from one Instagram reel (**@oddhourtales**, `DfQTUGYxxyb`, "Seven Nights at the
Lighthouse · Part 1", 96.3 s, 82,886 likes, 644 comments; sources in `references/sources.md`). The format is a
second-person **night-shift story with found rules** that ends by handing the next part to the comments. The look is
flat 2D vector at night (navy sky, warm interiors), a stick-figure keeper, a HUD that arrives with the light, and a
cream vote card.

Sample: `the sample film (the render is not included in this repository)` —
"Seven Nights at the Weather Station · Part 1" (95.9 s): you take the winter job at a mountain weather station; the
cable-car man shouts the stakes; the last observer, Ida, vanished; her station rules are taped by the door (rule 5
scratched out twice, one word left: *window*); 120 steps to the wind mast; at 2 AM the fog comes in and someone knocks,
asking to be let in from the cold with a little brother — and rule 2 says never open the door once the fog is in.
Vote: OPEN or SHUT. The sample project and the runnable template are not included in this release; build from
`assets/kit/ns-kit.js` and the scripts in `tools/` (see §11).

## 1. Signature traits
- **Second person, past tense, plain words.** "You answered an advert…", "You write it down". The keeper is "you"; the
  predecessor has a name (amber caption); the speakers who are not the narrator get a coloured tag above the caption.
- **The stakes shouted by someone leaving** (boatman / driver / cable car): three short exclamations, the last one a
  rule in disguise (sample: "The car never runs after dark!"). Speaker tag in green.
- **The predecessor vanished** (one short line, the verb in red) and **the rules are still on the wall**.
- **The rules sheet** is the centrepiece (~25 % of the runtime): lined cream paper, red margin, pin, torn corner,
  handwritten title, rules typed in as the narrator reads them, red numbers. Four readable rules, **rule 5 scratched
  out** with a jagged black scribble (a one-word emphatic line on it), a push-in on it.
- **A counted ritual**: a number with a condition ("N steps to the <place>. If you count N + 1, go back down."), then
  the count itself with a STEP counter box top-right (amber, green on the last number) and a close-up of the number
  painted on the step.
- **The light event** (a white flash) brings the **HUD** in: red "● NIGHT 1 / 7", a big Oswald clock, the place line,
  outlined chips (a green status chip with a check, a white counter chip at 0). From here the HUD stays until the vote
  card.
- **The log card** (a short handwritten entry for the night) — the routine closes. Then **the clock** jumps to the
  forbidden hour; the label turns red.
- **The call**: a device close-up (a radio with a channel number and a moving waveform) with amber captions and a tag;
  a cutaway that proves it is impossible (the impossibility line: a fact, then "and" + the thing that cannot be there);
  the plea escalates with a child; the keeper reacts; **the rule card** pops (dark red, handwritten rule).
- **The vote card**: cream, rounded; a red line with the hour of the event, a big yes/no question, green and red
  one-word buttons, a footer asking for the choice in the comments (the majority decides the next part); the narrator
  reads the two lines, then ~5 s of silence on the card. The post caption repeats the two button words.

## 2. Measured metrics (source vs sample vs gate)
Source: the engine analyzer's metrics + rea (not included). Sample: the owner's weather-station QA (not included).

| metric | source | sample | gate |
|---|---|---|---|
| duration | 96.3 s | 95.9 s | ±15 % |
| analyzer cuts / min | 6.23 (10 cuts) | 8.76 (14 of 16 transitions; explained in SAMPLE.md) | ±20 % |
| scene changes / min | 8.1 (median scene 4.9 s) | 10.01 (+24 %, explained: warm/cold palette swaps + the flash) | ±20 % |
| real shots | 16-17 (rea: 14 cuts + 1 flash cut) | 17 | — |
| WPM | 94.7 analyzer (Whisper misses the radio lines) · **107** from the 172 caption words | 118.3 (189 words, +10 %) | ±20 % of 107 |
| brightness · colourfulness · motion | 0.334 · 30.6 · 4.04 | 0.418 · 27.0 · 4.44 | dark film, ±30 % |
| loudness | −14.1 LUFS | −14.0 LUFS, −2.8 dBTP (both mixes) | −14 ±1, TP ≤ −1 |
| voice over bed | ~20 dB (rea stems: voice −15…−22 dB, bed −30…−45 dB) | 15.5 dB (music alone 19.9 dB under) | ≥ 10 dB |
| first word | 0.1 s | 0.18 s | ≤ 0.4 s |
| Whisper `small` | — | 21/21 lines (the name returns as "Aida") | every line |

## 3. Beat map (% of runtime) and script formula
| % | beat | what the line does |
|---|---|---|
| 0–3 | **Hook** over the hero still (the place under the moon, slow push-in) | second person: why you took a job no one else would |
| 3–10 | **The stakes, shouted** by someone leaving, tag in green | three short shouted lines from the departing driver; the last is a rule in disguise |
| 10–17 | **The predecessor** at the door (the keeper walks in) | the last keeper's name, years served, and that they vanished |
| 17–20 | **The rules on the wall** (interior wide) | one line: their rules are still pinned up |
| 20–45 | **The rules sheet**, typed as read; rule 5 scratched out + push-in | the five rules read one by one; the last one scratched out |
| 45–54 | **The counted ritual**: steps + STEP counter, the big number | a number to count, and the predecessor always counted it |
| 54–58 | **Light on**: flash, the HUD arrives | the time, the light, the first duty |
| 58–63 | **The log** card | you write the first entry, the predecessor's way |
| 63–66 | **The clock** turns the hour (red) | the hour the rule names, and what changes outside |
| 66–74 | **The call** (device close-up, amber captions, tag) | a voice outside asks for help (sound cue + tag) |
| 74–79 | **The impossibility** (cutaway) | why no one could be out there at this hour |
| 79–92 | **The plea + a child**, reaction, **rule card** | the plea raises the stakes; the forbidding rule pops up |
| 92–100 | **The vote card**, read once, then silence | a yes/no question, two one-word buttons |

- **170–190 words**, ~21 lines, phrases of 1–3 words on screen. Narrator ~107–118 WPM overall (≈170 while speaking).
- **The rules (5)**: (1) a duty with "Always." / "Every time.", (2) **the rule the ending tests** ("Never <do the
  thing> after <the hour>" / sample: "Never open the door once the fog is in"), (3) the rule that makes the call
  impossible ("Nobody comes to <the place> at night."), (4) the counted ritual with a trap number, (5) scratched out
  (plant a word).
- **The dilemma** = rule 2 against a human instinct (help a voice with a child in danger), proven impossible by rule 3.
  Two single words for the comments (sample: OPEN / SHUT). Keep it PG: no gore, no monster shown — a sound, a voice, a
  faint shape at most.
- Voices: narrator a calm low male (source f0 ~115 Hz; Kokoro `am_onyx,am_michael` speed 0.92); the shouter a gruff
  male outdoors (`am_fenrir` 1.06, two ridge echoes); the caller a younger voice through a door/radio (`af_sky`,
  band-limited). Gaps 0.3–0.75 s; 1.3–2.4 s before the ritual, the flash and the call; 4 s before the vote line
  (the rule card beat).

## 4. Visual system
| role | source | sample |
|---|---|---|
| night exterior | navy sky `#16213d`→`#0d1428`, moon `#e9e4cf` top right with glow, small clouds, rain streaks | sky `#090f21`→`#1d2b50`, stars, the same moon, snow (3 sizes, seeded) |
| interior | dark brick wall, warm lamp pool (`#ffb347`), round window with rain, desk (radio, logbook, lamp) | plank wall `#3a2a22`, porthole with snow, barometer, green desk lamp, radio, logbook, mug |
| keeper | white round head, dot eyes + brow strokes, yellow sou'wester, navy coat, stick legs, white round hands | same build: red beanie with a pom-pom, olive parka, mustard scarf, brown boots (`K.keeper`) |
| paper | cream `#f4ecd8`, blue rules, red margin, red pin, torn corner, Caveat-like hand | same recipe (`K.sheet`), title "Station rules", signature "— I." |
| accent | yellow `#f5b52e` (names, numbers, "Always"), red `#ef5a4a` (danger), green `#47c98a` (OK chip, speaker tag) | same |
- **Safe areas (1080×1920)**: captions centred at y 1400 (73 %); HUD from x 62, "● NIGHT" y 113, clock baseline 238,
  place 278, chips 300–346; STEP counter at (712, 398) 200×138; rule card y 560–780; vote card x 90–990, y 560–1200;
  log card x 120–900, y 440–690. Faces never in y 1320–1480.
- Type: captions Oswald 700 76 px CAPS (source ~25 px on a 360 view), soft dark shadow, no box; tags Oswald 600 27 px
  letter-spaced 2.5; HUD clock Oswald 700 104 px + 36 px AM/PM; chips Oswald 500 25 px in outlined pills; sheet
  Caveat 52 px on 80 px rules.

## 5. Shot grammar and transitions
- 16–17 shots: hero wide (slow push) → hard cut → departure (vehicle shrinks away, keeper foreground) → door (keeper walks
  in from frame right) → interior wide → **sheet** (long hold, push-in, zoom to rule 5 + shake) → ritual wide → climb
  (camera tracks, counter) → number close-up (low angle, boots) → arrival → **flash** (light on, HUD in) → log (desk
  closer) → clock → (fog / device close-up) → the call → impossibility cutaway → reaction close + rule card → vote card.
- **Every new shot fades up from black in ~0.2 s** (the source's signature; the first frame of each shot is near black);
  S1→S2 is a hard cut; the light event is a white flash (0.1 s up, 0.6 s down); the vote card comes in over a dimmed,
  blurred last set.
- Every shot drifts (push-in 4–10 %); the sheet pushes 1.0→1.07 while reading, then 1.42 on rule 5.

## 6. Motion grammar
- Keeper: walk cycles (phase = time × 6–7), climbing with a step rise, blinks every ~3 s, expressions per beat
  (neutral → worried at the stakes → side-eye at the door → determined on the ritual → shock at the plea), a hand that
  reaches toward the forbidden action as the rule card lands.
- Sheet: each rule writes on over its spoken span (characters revealed in reading order); the scribble draws in 0.75 s
  on "Rule five…", a second pass on "Twice"; a glint on the one readable word afterwards.
- Counter: the number steps with each stair (amber), the last number turns green; a progress tube fills.
- HUD: fades in 0.25 s after the flash; the clock changes on the narration; a chip flips with a 1.25× pop and turns red
  (sample: VISITORS: 0 → VISITORS: 1? on the first knock).
- Cards: rule card scale 0.88 → 1 (back-out), vote card 0.86 → 1 (back-out), buttons pulse alternately in the hold.

## 7. Caption system (`tools/build.py`)
- One 1–3-word CAPS phrase at a time (≤ 18 characters), Oswald 700 76 px, white, centred at 73 %, appearing on the
  first word (−0.05 s, 0.08 s rise), staying until the next phrase. Break after punctuation; a lone plain word borrows
  the previous one ("ELSE WOULD."), emphatic singles stay alone ("KID!", "GONE.", "TWICE.").
- Keywords: the script's `kw` map per line → yellow `#f5b52e` (names, numbers, rewards) or red `#ef5a4a` (danger,
  never/nobody, the hour). Other speakers: a small tag above the phrase (script `tags`: who → label, colour); the caller's
  phrases are amber `#ffd27a` with red keywords (the source's radio lines).

## 8. Sound (`tools/score.py`)
- Source: voice + a quiet ambient bed (rain under the opening, a low drone pad from 18 s that swells under the radio and
  the vote, ~20 dB under the voice; no clear beat) + ~39 small hits (caption pops, counter ticks, a lamp hit).
- Sample: narrator dry and close; the shouter outdoors with two ridge echoes; the voice outside low-passed through the
  door; per-voice look-ahead peak limiting (crest 11 dB) so the master stays linear. Ambience: wind with gusts (muffled
  indoors), cable-car motor that recedes, room tone. Foley: snow footsteps on the walk cycles, wire clatter, paper,
  pencil for each rule, the scratch-out, the step-120 hit, lever + lamp thunk + hum, writing, clock ticks, the fog swell,
  three wooden knocks, a heartbeat, the rule-card sting, the vote pop. **Music (full mix only)**: an original sparse
  suspense bed at 76 BPM in D minor (pad, a five-note music-box motif at the hook / sheet / ritual / vote, a soft pulse
  through the rules and the ritual, a lamp swell, silence under the clock, a dissonant tremolo drone under the knock).
- Two masters: `score/final.wav` (+ `assets/audio/final.m4a`) and `score/final_nomusic.wav`; each −14 LUFS, TP −2 dBTP
  before AAC. `tools/deliver.sh` makes `out/<name>.mp4` (CRF 19) and remuxes the same video with the no-music mix.

## 9. Retention devices
- First word ≤ 0.2 s over a finished hero still; the stakes in 9 s; an open loop at 15 % ("vanished"); the rules as a
  read-along list; a hidden readable word in the scratched rule (rewatch); a counted ritual with a payoff number; a
  light event at 55 %; the forbidden hour at 63 %; a chip that flips; the rule card right before the vote; a two-word
  comment vote (the majority decides Night 2) and the series counter (NIGHT 1 / 7) for the follow.

## 10. Do / don't
- **Do**: keep the beat map and the sheet's 25 %; put the tested rule at #2 and the impossibility rule at #3; give the
  predecessor a name; plant one detail in rule 5; make the vote two single words; keep the HUD from the light event to
  the vote; let the card sit in silence for 4–5 s.
- **Don't**: show the threat (PG: a voice, a knock, a shape at most); put faces in the caption band (y 1320–1480); let a
  rule's text run past the sheet's right edge (wrap at ~31 characters); use more than two caption colours per phrase.

## 11. Code recipe
```bash
# The runnable weather-station template is not included in this release. Start a project from the kit + tools:
# hyperframes.json / package.json / meta.json from any explainer template (e.g. explainer-lofi-mascot-lines/assets/template),
# the Oswald / Inter / Caveat OFL fonts in assets/fonts/ (file names as in tools/build.py), and your own assets/lib/film.js.
S=~/.claude/skills/explainer-choice-night-story
mkdir -p my-night/assets/lib my-night/assets/fonts my-night/vo my-night/tools && cd my-night
cp "$S/assets/kit/ns-kit.js" assets/lib/ && cp "$S"/tools/*.py "$S"/tools/*.sh "$S/tools/qa_config.json" tools/
# 1) vo/script.json: lines {id, text, who?, voice?, speed?, gap, kw:{word: y|r}}; "tags": {who: [LABEL, colour]}
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I "engine/audio/tts.py" vo
python -X utf8 -I tools/build.py        # vo-data.js, compositions/captions.html + world.html, index.html, out/<name>.srt
# 2) assets/lib/film.js: the place (set pieces) + the 17 shots {id, t0 (from line/word times), fadeIn, cam(u)->[zoom,fx,fy,ox,oy], draw(lt,u,t), post(...)}
#    keep the shot clock T.* in tools/score.py in sync with film.js
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I tools/score.py   # both mixes, levels.json
bash tools/snap.sh 1.8,5.5,11.5,18.5,23,45.6,50.2,52,57.5,61,64.8,66.3,70.5,76,85.5,89   # one still per shot (locked)
bash "tools/render_locked.sh" "$PWD" out/<name>_master.mp4 delivery        # ~3 min
bash "tools/with_render_lock.sh" bash tools/deliver.sh                     # CRF 19 + no-music remux
bash "tools/with_render_lock.sh" bash tools/qa_all.sh                      # analyzer, sweep, gates, Whisper
# optional reference compare: python -X utf8 -I tools/qa.py --ref <a video you may use> --ref-metrics <its metrics.json>
```
- Kit API (`assets/kit/ns-kit.js`, `NS.create({canvas})` → K): `K.keeper({x, y, s, view: front|side|back, dir, walk,
  stepRise, expr: neutral|worried|shock|determined|side|smile, look, blink, armL/armR [dx,dy], lantern, seated, colors})`
  → head/hand positions; `K.sheet({x,y,w,h,title,rules:[{n,lines,typed}],lh,px,gap,rule0,text0,scratch:{i,k,k2,peek,
  peekAt,glint},sign,signA})`; `K.hud({a,night,time,ampm,place,chips:[{text,col,check,pop}]})`; `K.counter(n,a,done,x,y,
  prog)`; `K.clock(cx,cy,r,h,m,s)`; `K.logCard`, `K.ruleCard`, `K.voteCard({y,h,a,s,series,head,q,qpx,b1,b2,foot,pulse})`,
  `K.tag`; scenery: `K.sky`, `K.stars`, `K.moon`, `K.cloud`, `K.snow`, `K.rain`, `K.fog`, `K.glow`, `K.vignette`,
  `K.fade`, `K.poly`, `K.rr`, `K.text` (fonts NSOswald / NSInter / NSCaveat). All pure functions of their arguments.
- Performance: Canvas 2D on CPU, 2 workers: 96 s rendered in ~3 min at `delivery` (render 1: 183 s). Snapshots ~1 s per
  still. The lock is shared: expect 5–15 min waits per locked job; chain deliver + cover + QA in one job
  (`tools/deliver_qa.sh`).

## 12. Gotchas
- **Screen-space camera**: the world draws in frame coordinates under a camera transform; backgrounds must over-fill
  (−2000…+4000 px) or a panning shot shows black at the edge (the climb did, first pass).
- **Clip fog and glows** to their window or they bloom over the frame (the door window's fog spilled out).
- **The cross of a window shadow** or a caption must never sit on the keeper's face; check every close shot.
- **Align the ruled lines with the handwriting** (`rule0` = `text0` + 8, `gap` 0) or the sheet reads as typed over paper.
- **Kokoro peaks**: a speech mix at −14 LUFS with Kokoro's syllable peaks pushed the master limiter to 8 dB; limit each
  voice stem first (crest 11 dB over its speech RMS) and loudnorm stays linear.
- **deliver.sh on Windows**: Python can't open `/a/...` paths; pass `cygpath -m` paths. Never `-shortest`.
- **A shouted line needs clean consonants**: grit (tanh ×2.2) plus a 0.36 s ridge echo turned "I'm back up Sunday" into
  "on backup Sunday" for Whisper; ×1.5 grit, a 0.42 s echo at −16 dB and the rephrase "I'll be back on Sunday" fixed it.
- **Whisper with VAD drops quiet radio/door lines** — count the source's words from its captions, and run our check
  with `vad_filter=False`.

## 13. Series parts (a story told over several reels)
Parts 2–4 of the owner's weather-station series show how to continue the format across parts. Those projects, their
series bible and the modules named below (`ws-sets.js`, `series-props.js`, `SERIES_PROPS.md`, `score_lib.py`,
`regate.py`) are not included in this repository; the notes describe how they were built:
- **Shape per part:** the last vote's result as the hook (0–8 s, over a still of the place the last part ended), a
  daytime clue (radio with the driver on CH 16, a found object), the night ritual (9 PM lamp + flash + HUD, the log card,
  the steps where it fits), the 2 AM event, the rule card that matters, the dilemma, the vote card. NIGHT n / 7;
  READINGS opens at 4(n−1)+1; VISITORS keeps a red count with a "?".
- **Write both results.** Build the A result; script the B line with its shot note and timing in SCRIPT.md ("If the vote
  went the other way") so a re-voice is one line + one shot and converges by 10 s.
- **Modules:** `assets/lib/ws-sets.js` (Part 1's set pieces moved out of film.js + shared shot bodies: day sky, footprint
  trails, the door by day, the radio close-up with a live waveform, the step close-up with an unpainted riser, the climb,
  the lamp, the clock, the anemometer, the barometer, the window view down the wire, the docked car, the vote
  background), `assets/lib/series-props.js` (Ida's logbook, the drawer, frost letters outside, condensation letters inside,
  the pencil rubbing, Ida's lantern; spec in `SERIES_PROPS.md`), `tools/score_lib.py` (foley, voice treatments incl.
  radio CH 16, the door, a read-aloud room and the fog's double, the 76 BPM bed, both masters). Each part keeps only its
  film.js (times + shots), vo/script.json and tools/score.py (clock + events).
- **Kit additions** (`ns-kit.js`, additive): `fam: "print"` (Patrick Hand) for the keeper's log entries next to Ida's
  Caveat; a red, overflowing counter (121); rule-card tones red / amber / green; vote-button font size.
- **Gotchas:** white captions on daylight snow need a dark scrim (y 1240–1560); a hard cut from a bright page to a night
  shot trips the dip check (list it in `qa_config.json` `planned_dips`, then `tools/regate.py`); sparse noise clicks
  (frost crackle) need a soft clip or the master limiter goes dynamic.

Files: references/sources.md · assets/kit/ns-kit.js · tools/ (build.py, score.py, qa.py, qa_all.sh, whisper_check.py,
deliver.sh, snap.sh, tile.py, and the analysis scripts grab.py, strip.py, audio_probe.py, pitch.py). The runnable
template (`assets/template/`) and the weather-station sample (`assets/sample/`) are not included in this release.

## Appendix A — source analysis (`DfQTUGYxxyb`), frame by frame
Measured from 2 fps sweeps, full-size key frames, 6 fps strips around every transition, the analyzer and rea (this
appendix stands in for `references/analysis.md`). Spoken lines are given as beats, not quoted.

| t (s) | shot | picture / overlay | sound |
|---|---|---|---|
| 0.0–3.0 | 1 hero | red-white lighthouse on a rock, moon top right, clouds, rain, wooden pier to bottom right, keeper tiny; push-in ~1.1× | rain; VO: hook (one keyword red) |
| 3.0–9.8 | 2 departure | hard cut: boat with a green mast light leaving on the sea, captain in orange; keeper in the foreground on the dock (head ~85 % of the height); the boatman's name tag in green above the captions | shouted stakes, three exclamations (the number yellow, the last rule's "never" red); echoey shout ~262 Hz |
| 10.0–16.6 | 3 door | fade up: tower base, studded wooden door with porthole; keeper slides in from the right, side-eyes the door | VO: predecessor (name yellow, the vanishing red) |
| 16.7–19.6 | 4 interior | fade up: brick wall, round window with rain, the sheet pinned at right, desk: radio, logbook, glowing lamp; keeper behind the desk | VO: the rules on the wall |
| 19.7–43.8 | 5 sheet | fade up: a handwritten title on lined paper over dark planks; rules write on; rule 5 scratched; push-in from 40.5 s | VO: the five rules (duty words yellow, never / nobody red, the step number yellow, the trap number red, the scratch-out word red) |
| 43.9–48.2 | 6–7 stairs | fade up: keeper at the foot of a stair (orange window), then climbing; STEP counter (94→98) amber box top right + a vertical gauge | VO: the ritual (number, "count them") |
| 48.3–49.2 | 8 close | the last step number painted on the riser, the one before below it, two stick legs with white feet; counter green | VO: the predecessor always did it |
| 49.3–52.4 | 9–10 arrival | top of the stairs, lit doorway; the lamp room: big Fresnel lens, keeper at the switch | — |
| 52.5–56.1 | 11 flash | white flash; lens lit; HUD fades in: ● NIGHT 1 / 7 · clock · the place name · a green status chip · a white counter chip at 0 | VO: light on (two short lines) |
| 56.2–60.6 | 12 log | desk; log card types a two-line entry (the night, the time the light went on) | VO: the log |
| 60.7–63.9 | 13 clock | wall clock ticks over to the forbidden hour, the time label red | VO: the hour |
| 64.0–70.9 | 14 radio | radio with a channel number and a moving waveform; an amber device tag; amber captions | the call: a distress plea over the radio (female-leaning, ~300 Hz, band-limited) |
| 71.0–75.5 | 15 window | rainy window, the beam sweeping | VO: the impossibility (one phrase red) |
| 75.6–88.5 | 16 reaction | desk: keeper shocked, hand to the mic; RULE 2 card (dark red, handwritten) 85–88 s | the plea escalates (a child is with them) |
| 88.6–96.3 | 17 vote | dark fade; card in; read once, then ~4.5 s silent | VO: the hour + the vote question |
