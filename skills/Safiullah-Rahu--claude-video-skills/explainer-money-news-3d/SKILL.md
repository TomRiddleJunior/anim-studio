---
name: explainer-money-news-3d
description: "Makes a vertical 9:16 market-news explainer reel (60-80 s) about one real, current, double-sourced market story, in the format of a finance Instagram reel (DfGDek3RLcC, 37k likes): a '$X lost in a single day' hook on a photoreal 3D money image, the facts on a cream ticker card with a split-flap and a dark crashing-line chart card, 'The strange part?' serif stat cards, a question answered by a long receipt that prints line after line to a total, a bar/stack that drops, a twist card, a second 3D set, 'Why does that matter?' two-card logic, a slider, a split-flap reframe (not whether, but when) and a two-choice comment question with a follow CTA on a tilted phone. Heavy condensed caps captions built word by word with one coloured keyword; a fast male narrator (~176 WPM) over a low bed, whooshes and flap ticks. Built in code with HyperFrames + three.js and made more realistic than the source: physically lit sets (a banknote-pallet warehouse whose light rows go out, a window seat with a wing outside at golden hour, a primer-green wing on assembly jigs under volumetric lamps, a thermal printer slip, banknote-brick stacks on glossy concrete with planar reflections, a split-flap departures board), half-res bokeh depth of field, bloom, haze, dust, motion blur on whips, film grain, ACES grade. Use for 'market news reel', 'stock drop explainer', 'earnings explainer short', 'finance news Instagram reel', 'company lost $X billion in a day', 'finance-account style reel', 'daily market story', 'why did the stock fall' or any one-company market story told in 60-80 s. Facts must be real and sourced (FACTS.md). Builds on explainer-engine."
---
# Money-news 3D — one company's bad day, told as a chain of devices

Reverse-engineered from one Instagram reel (`DfGDek3RLcC`, a finance-news account, 75.6 s, 37,118 likes;
`references/analysis.md`, `references/sources.md`). The format is a **device chain**: every 3–8 s the story changes
device (3D money image → ticker card → crash chart → "worst" counter → serif stat cards → 3D question prop → receipt →
dropping bar → TWIST card → second 3D set → two-card logic → slider → split-flap → phone). It is a news format, so
**every number is real, current and sourced twice** (`FACTS.md`). Original work only: our own story, sets, script and
an invented channel ("Ledger Lane"); no real logos, no real people.
Sample: `the sample film (the render is not included in this repository)` — "Boeing's $16 billion day" (Oct 27,
2026; 76.4 s).

## 1. Signature traits
- **Hook on money, not on a logo**: frame 0 is a photoreal 3D money image (an endless warehouse of banknote pallets)
  with the company name already captioned; the first sentence states the loss, the second opens a loop.
- **Two worlds, alternating**: dark spot-lit 3D props and dark chart cards ↔ cream (#ebe7dc) editorial cards with a
  serif headline and white stat cards. About a third of the film is cream.
- **Fixed device chain** (§3) with the same rhetorical hinges: a contradiction ("The strange part?"), a question with a one-word answer,
  a twist teaser, "Why does that matter?" and a not-A-but-B reframe.
- **Captions**: heavy condensed caps (Oswald 700), one word at a time on its syllable, 2–4 words per phrase, one keyword
  coloured (red loss, yellow amount/subject, blue baseline, green gain); cards replace captions when their text speaks.
- **Split-flaps** twice (the ticker, the closing reframe), a **receipt** for "the bill", a **phone mockup** for the CTA.
- **Fast, level narrator** ≈ 176 WPM overall (≈ 190 while speaking); a continuous low bed, whooshes on every
  transition, ticks under flaps and the printer, impacts on the big numbers.

## 2. Target metrics
Source: engine analyzer metrics (+ `assets/tools/scene_times.py`), analysed locally for reference only. Sample:
the sample render's `out/qa/metrics.json` (not included; the project is `assets/sample/`).

| metric | source | sample (final render) | gate |
|---|---|---|---|
| duration | 75.6 s | 76.4 s | 60–80 s |
| WPM overall | 176 | 168 (−4.6 %) | ±20 % |
| scene changes / min · median scene | 12.7 · 4.17 s | 11.8 · 4.34 s (−7 %) | ±20 % |
| hard cuts | 4 | 8 (3D→3D cuts; the rest are pushes/wipes) | not a gate |
| motion mean | 10.4 | 8.4 | — |
| colourfulness · brightness | 24.0 · 0.47 | 24.1 · 0.53 | — |
| loudness · true peak | −14.1 LUFS | −14.3 LUFS · −1.1 dBTP | −14 ±1 · ≤ −1 |
| voice over music | — | +17.7 dB | ≥ 10 dB |
| first word | 0.0 s | 0.18 s | ≤ 0.4 s |

Deviation: more hard cuts (our 3D sets cut to each other where the source used one 3D world per device); fine.

## 3. Script formula (beat map)
| % runtime | device | line shape | sample line |
|---|---|---|---|
| 0–5 | **3D money hook** (stakes) | [company] + [the loss] + [the time span] | "Boeing just lost about sixteen billion dollars in a single day." |
| 5–9 | **open loop** on a second 3D prop | a reason, held back, that concerns [the viewer's group] | "And the reason is sitting right outside your window seat." |
| 9–14 | cream **ticker card** → dark **crash chart** | [company], [ticker], [exchange], [the % drop] | "Boeing, ticker B-A, fell almost eleven percent on Tuesday," |
| 14–18 | dark **"worst" counter** | the historical frame for the drop | "its worst day in more than a year and a half." |
| 18–29 | **"The strange part?"** + 1–2 stat cards | the good numbers (a year ago vs now; expected vs actual) | record $745B backlog, 6,300+ jets |
| 29–33 | **question + one-word answer** on a 3D prop | a question, then a one-word answer | "So what spooked investors? The wait." (departures board → DELAYED) |
| 33–46 | **the receipt** (long slip printing to a total) | the cost, line by line | 367 delivered vs ~500 target; TARGET MISSED stamp |
| 46–52 | **a bar / stack that drops** | the swing (+ → −; expected vs actual) | 2027 free cash $3B vs $5.5B expected (brick stacks) |
| 52–56 | **"TWIST"** tape card | a one-line promise of an overlooked angle | a one-line twist teaser |
| 56–68 | **second 3D set** (the knock-on / the real cause) | a second company or the hidden cause | "It isn't demand, and it isn't engines. It's the wings." (window → wing on jigs) |
| 68–78 | **"Why does that matter?"** two-card logic | who pays and who earns, as two linked cards | "airlines pay most of a jet's price on delivery. An order is a promise. A delivery is cash." |
| 78–84 | **slider** + two mini cards | spend too much / too little | a steady 47 a month slips to early 2027 (plan: this summer) |
| 84–91 | **split-flap reframe** | the reframe: the question is not [A] but [B] | "… if Boeing can sell planes. It's asking if it can build the wings." |
| 91–100 | **phone CTA** | comment question + follow | "Buying chance, or warning sign? Tell me in the comments. And follow for the daily market story." |

- 20–22 lines, 200–225 words, sentences of 3–20 words. Kokoro `am_michael` at speed **1.28** (≈ 193 WPM while
  speaking); `gap` 0.12–0.36 s. Spell tickers with phonemes: `[B-A](/bˈi ˈA/)`. Write "seven-thirty-seven", and avoid
  number runs ("five hundred seven-thirty-sevens" was heard as "507.37s": say "five hundred of its seven-thirty-seven jets").
- **Facts**: pick a story from the last 7 days; confirm every number in two reputable sources (wire, CNBC/FT/Bloomberg,
  company filings), list each with URLs in `FACTS.md`; derived numbers ("about $16 billion" = price change × shares)
  show their arithmetic and inputs. Prefer the weaker claim that two sources share over a stronger one only one has.
- No real logos (plain wordmark in Inter or the ticker), no real people, invented channel name, neutral CTA
  ("Follow for the daily market story"), "NOT FINANCIAL ADVICE" on the end card, no buy/sell advice in the question.

## 4. Visual system
| role | source | ours |
|---|---|---|
| cream card | `#eae7dd` + grain | `#ebe7dc`, SVG fractal-noise grain at 9 %, a warm radial highlight |
| dark card | `#0c1018` → `#060b0e` | radial `#182031` → `#0c111b` → `#06080d` |
| ink / grey text | near-black / warm grey | `#141414` / `#8a857a` |
| loss · gain · subject · baseline | red · green · yellow · blue | `#ff3b30` · `#1ea152` / `#2ecc71` · `#ffc93c` (ink captions: `#1f5fd6`) · `#2a63d8` |
| stat card | white, soft shadow | `#fbfaf7 → #f2f0ea`, radius 30, shadow 0 30 70 rgba(70,60,40,.18) |
| fonts | heavy condensed caps · high-contrast serif · mono | Oswald 700 · DM Serif Display · Roboto Mono · Inter 700–800 (labels) |

- **3D look** (`assets/lib/money-kit.js`): MeshStandardMaterial with per-set PMREM environments, one shadowed key per
  set (spot or sun), hemisphere fill, exponential fog, additive light cones + dust motes, HDR emissives that bloom;
  post = 4× MSAA HDR → half-res scatter-as-gather bokeh DOF → bloom → directional motion blur (`mblur`) → ACES, grade,
  vignette, grain. Planar floor reflections on the stacks and board sets.
- Safe zones (1080×1920): captions inside x 118–962; caption tops 210–560 px or the low band 1330 px (receipt);
  nothing important below 1536 px except the small "NOT FINANCIAL ADVICE".

## 5. Sets and props (`assets/lib/money-kit.js`)
`K = MONEYKIT.create({canvas, width, height, look})`; `K.render({set, cam, look, fov, focus, aperture, maxBlur, exposure,
mblur:[px,py], flash, fade, p:{…}, t})`. Sets (`K.SETS.*`), each a group with its own lights, fog, background and env:
- `warehouse`: 10 × 66 instanced banknote pallets (drawn notes: generic "100" with a geometric seal, mustard straps),
  wooden bases, concrete floor, ceiling LED strips (instance colour), 4 spots + cones. `p.dark` = world z beyond which
  everything is dark (the light rows go out from the far end), `p.darkK` the residual.
- `cabin`: window seat at golden hour: wall with a bevelled oval opening, reveal, scratched pane, a shade (`p.shade`
  0 open … 1 closed), a wing group (`S.WG`: lofted NACA-like airfoil with sweep, dihedral, winglet, panel lines,
  flap-track fairings, a high-bypass nacelle + pylon), sky dome, cloud deck, sun disc. `p.sun`, `p.inside`.
- `hangar`: the same wing in green primer on yellow jig towers with clamp arms and floor rails, work platforms, roof
  trusses, clerestory windows, six high-bay lamps with cones (`p.lights` 0…1 switches them on in sequence), a warm work
  light (`p.warm`), dust.
- `receipt`: thermal printer (grey, label plate, power LED) on a plaster wall; a slip as long as its text (768×8160
  canvas: header, 367 lines, TOTAL, TARGET/SHORT, THANK YOU); `S.yOf(canvasY)` maps a text row to scene y for the
  camera; a red rubber stamp (`p.stamp` 0…1 scales in).
- `stacks`: two stacks of banknote bricks (1 brick = $1B; the last can be half) on glossy reflective concrete, floor
  tiles with the amounts, one spot + cone each. `p.a`, `p.b` = bricks dropped (fraction = the current brick falling with
  a bounce), `p.la`, `p.lb` = the two spots.
- `board`: a split-flap departures board (canvas redrawn per frame: rows flip from ON TIME to DELAYED with cycling
  characters, `p.flip` 0…1, `p.t`), terminal ceiling strips, bokeh lights, reflective floor.
- Banknotes, wordmarks and boards are drawn in code. Fonts used inside canvases must be loaded first (`world.html`
  waits on `document.fonts.load` with a 6 s timeout).

## 6. Motion grammar
- **Every 3D shot moves**: dolly (warehouse 5.9 m in 3.8 s), push-in (window, board), orbit (stacks 20°), tilt along the
  slip (receipt: slow tilt, then a 2 s eased tilt down 367 lines with vertical motion blur ∝ speed), lamp-lit dolly
  (hangar). Add `drift(t, a)` (two incommensurate sines, 4–30 mm) for a hand-held weight.
- Light changes land on words: rows go out on "single day", the board flips on "spooked" and is all red on "wait",
  the spot on each stack comes on as it is named, the lamps bang on with "It's the wings", focus pulls to the engine on
  "engines".
- Cards: elements enter on their words (0.1–0.3 s, power3.out, back.out for chips); counters ease out to their number
  exactly on the spoken number; bars grow from the left (scaleX). Nothing on a card is still for more than ~2 s.

## 7. Transitions
| name | build | length | where |
|---|---|---|---|
| push-up | the next card panel slides from y = 1920 to 0 over the previous scene | 0.30 s, power3.out | most 3D→card and card→card |
| hard cut | world switches set; a short whip (`mblur` 150–170 px + 14° yaw) on the way out | 0–0.16 s | 3D→3D |
| quick fade | the card fades off the next 3D shot | 0.14 s | "The strange part?" → "spooked" board |
| light streak | the card slides off left with a bright edge | 0.26 s, power3.in | TWIST → window |
| dive + flash | camera pushes into the window, fov 44 → 20, flash 0 → 0.9, then the next set opens on a decaying flash | 0.3 s + 0.3 s | window → wing hangar |
| tile wipe | 6 × 10 cream tiles scale in diagonally | 0.36 s | slider → split-flap |
| shrink into phone | the cream card scales to 0.49 into the phone screen while the dark CTA fades in | 0.45 s | split-flap → phone |

## 8. Caption system (`compositions/captions.html`, generated)
- `font: 700 104px/1.02 "Oswald"`, uppercase; one `<span>` per word, `opacity 0 → 1, y 26 → 0` in 0.09 s at the word
  start − 0.03 s; a phrase fades out 0.075 s before the next phrase.
- Styles: `hero` (centred, top 560, 118 px — the opening shot), `top` (left x 118, top 300, white, dark shadow),
  `low` (receipt: left, top 1330, ink with a cream halo), `inkTop` (cream cards: centred, top 330, 84 px), `cta`
  (centred, top 210, 92 px). Struck words (`strike`) get a red bar drawn across after 0.32 s ("DEMAND", "ENGINES").
- The very first word is on screen at frame 0.

## 9. Sound
- `engine/audio/sound.py` with `score/sound.json`: preset `doc-pulse`, 100 BPM, key −2, energy 2 → 1 (stat cards) →
  3 (from 0.9 s before the TWIST) → 2 → 1 (CTA); `music_under_voice_db −19`, `duck_db 5`, `sfx_db −7`, `lufs −14`.
- SFX cues come from `build.py` (`cues()`): whoosh on every push/tile/shrink, swoosh on the streak, low woosh on cuts,
  impacts on 0.0 s, the chart tag, WORST DAY, TWIST and the wing reveal; ticks under each split-flap and every 70 ms
  under the receipt; thuds as bricks land and lights clunk; stamp, paper + coin (banknote), click (slider, follow),
  notif (comments).
- Gates (`assets/tools/audio_qa.py`): −14 ±1 LUFS, true peak ≤ −1 dBTP, voice ≥ 10 dB over the music.

## 10. Retention devices (all required)
1. Stakes in the first 1.0 s; frame 0 shows the subject (money + the company's name).
2. An open loop by 15 % (sample: "right outside your window seat", paid off at 59 % by the wing).
3. A contradiction ("The strange part?"), a question with a one-word answer, a twist promise.
4. A new reveal or escalation every 8–12 s at most (sample: largest gap 4.3 s).
5. The turn at 70–85 % ("Why does that matter?" logic + the split-flap reframe that recontextualises the hook).
6. A two-choice comment prompt ("Buying chance, or warning sign?") and a neutral follow line.
7. No dead air over 0.8 s (sample max 0.57 s), bed and SFX under every gap.

## 11. Do / don't
- Do: one device per beat; real numbers only; the weaker double-sourced claim over a stronger single-sourced one; the
  ticker on split-flaps; a receipt that prints the actual count; brick stacks drawn to scale; captions on every line.
- Don't: real logos, real people, stock photos, the source account's name or script, buy/sell advice, a title card or
  logo before the hook, yellow text on cream (use the ink blue), captions over the receipt total or the stamp.
- Gotchas hit on the sample:
  - **MSAA NaNs**: `pow(uv.y, k)` in the light-cone shader goes NaN at extrapolated MSAA samples → black 8-px squares
    after bloom. Clamp shader inputs (`clamp(vV,0,1)`) and keep the `isnan/isinf` guard in the DOF prefilter.
  - Fonts in canvas textures must be loaded before the kit is created, or boards and receipts draw in a fallback font.
  - A 9:16 frame is narrow: the departures board had to become two columns (type + status), and the receipt camera
    must stand ≥ 3.5 units off a 1-unit slip to keep both edges in frame.
  - From a window seat the wing is below and aft: turn the wing group (`ry` ≈ 112°) and put the sun behind the camera,
    or the visible side of the nacelle and wing is in shadow (navy) and the wing never enters the window.
  - Jig crossbeams above a wing hide it; keep the towers at wing height and shoot from above the leading edge.
  - GSAP `onUpdate` text (flaps, counters) must be computed from one clock tween, not per-tween state, so random-order
    seeks give the same frame.
  - Only flip split-flap tiles whose letter changes, and finish the last row ≥ 0.6 s before the next transition.

## 12. Build recipe
```bash
cp -r ~/.claude/skills/explainer-money-news-3d/assets/template my-story && cd my-story   # runnable full project
# 0) find the story: last 7 days, two reputable sources per number -> FACTS.md (copy the sample's table layout)
# 1) write vo/script.json (line ids are referenced by tools/build.py: keep them or edit SCENES / CAPS / cards_html)
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "engine/audio/tts.py" vo
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/whisper_check.py        # fix misread names/numbers
# 2) edit tools/build.py: SCENES (device per scene + transition), ANCH (word anchors for 3D moves), CAPS (phrases),
#    the card blocks (numbers!), CLOSES (real closes for the chart), cues(); edit assets/lib/mn-shots.js per 3D scene
python -I tools/build.py                      # timeline, cards.html, captions.html, index.html, score/, out/<key>.srt
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "engine/audio/sound.py" score
ffmpeg -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
npx -y hyperframes@0.8.210 check --json
python -I scratch/devserver.py &   # look-dev page scratch/debug.html: dbg.shot(name, t, overrides) -> scratch/dbg/*.png
npx -y hyperframes@0.8.210 snapshot --at <times> --no-end -o scratch/snap
bash "tools/render_locked.sh" "$PWD" "out/<key>.mp4" delivery   # run_in_background
```
- Render cost on the Intel UHD 770 with 2 workers: ≈ 2.7 min for 76 s (the world skips frames a card fully covers).
- 16:9: set `W, H = 1920, 1080` in `build.py` and the kit size, widen every fov ×0.56, move captions to top ≈ 120 px,
  and give the boards back their third column.

## 13. QA gates (before you stop)
```bash
python -I "engine/qa/analyze_video.py" out/<key>.mp4 out/qa   # SRT beside the mp4
python -I tools/sweep.py out/<key>.mp4 2          # 2 fps sweep sheets out/qa/sweep_N.jpg — look at every one
python -I tools/yavg_dips.py out/<key>.mp4        # brightness dips (flash frames are intended: list them)
python -I tools/compare.py out/<key>.mp4 --ref <reference.mp4>   # out/qa/compare.jpg: 15 matched beats vs a reference
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/audio_qa.py out/<key>.mp4
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/whisper_check.py out/<key>.mp4
python -I tools/scene_times.py out/<key>.mp4      # cut + scene-change times with the analyzer's thresholds
```
Gates: duration 60–80 s; WPM and scene changes/min within ±20 % of 176 and 12.7; −14 ±1 LUFS, TP ≤ −1 dBTP, voice
≥ 10 dB over music; first word ≤ 0.4 s with the subject in frame 0; Whisper `small` reads every name and number; every
number in `FACTS.md` with two URLs.

Files: references/analysis.md · references/sources.md · assets/template/ (runnable project: kit, shots, world player,
build/QA tools, look-dev page) · assets/sample/ (the full Boeing film source incl. FACTS.md and SCRIPT.md) ·
assets/tools/ (build.py, compare.py, sweep.py, audio_qa.py, whisper_check.py, scene_times.py, yavg_dips.py)
