---
name: explainer-riddle-cutaway
description: "Makes a vertical 9:16 lateral-thinking riddle reel (85-92 s) in the format of a viral Instagram riddle (@oddlinearchive, a classic lift riddle with a rain condition, 606k likes): a flat-vector CUTAWAY building with pastel rooms, a stair core and a dark top-centre counter pill that rolls as the camera tracks (floor numbers / a clock); a routine shown as a loop, an observer at a desk with monitors who can't explain it ('?' marks), the anomaly (sample: 'Then 306 is empty'), the question as a bottom pill, a cream 10-second COUNTDOWN CARD (two side-by-side comparison panels, a ring timer with a red arc, 'Comment your answer', then a 'Time's up' pill), the reveal through a framed camera / x-ray view (REC label, timestamp, corner brackets), a short 'limit' tag (sample: 'Two quiet minutes'), the observer laughing, the morning after, 'Did you get it right?' + 'Follow for more', and a last frame that loops into the first. Captions are short PARAPHRASE pills (navy rounded, white slab serif), not word-by-word. Energetic narrator ~165 WPM. Built in code with HyperFrames + a Canvas2D shot player and a flat character/building kit, Kokoro voice, a synthesized bed + SFX, two mixes. Use for 'riddle reel', 'lateral thinking puzzle video', 'guess-the-answer riddle', 'comment your answer countdown', 'cutaway building animation', 'oddlinearchive style', 'why does he only… riddle', classic riddles with a visual reveal (the man in the elevator, the snoring neighbour, the bridge guard, the masked men waiting at home)."
---
# Riddle cutaway — one routine, one anomaly, ten seconds, one reveal

Reverse-engineered frame by frame from one Instagram reel: **@oddlinearchive `DfLF1TVgTXf`** (87.7 s, 606,515 likes, 5,714
comments). Its riddle is the classic lift riddle (a resident who rides only part of the way up, except on rainy days). Sources and measurements
are in `references/sources.md`; the analysis is below (§A).
Sample built with this skill: `the sample film (the render is not included in this repository)`, "The 1:12 Call"
(91.2 s). It uses a different classic lateral-thinking riddle: the hotel guest who phones the next room at night, says
nothing, hangs up and falls asleep, because the neighbour snores.
Two more samples (2026-11-07), both PG:
- `samples\riddle-diner\out\riddle-diner.mp4`, "One Fright, No Water" (87.0 s). The hiccups riddle made non-violent: a cook
  bangs two pans instead of anything harmful, and the reveal is a diner-camera replay where the HIC bubbles stop on the BANG.
- `samples\riddle-twins\out\riddle-twins.mp4`, "Born Second, Born First" (88.9 s). The daylight-saving twins riddle,
  revealed by a framed view of the ward clock as its hands sweep back from 2:00 to 1:00.

**Original work only.** Never reuse the source's lift riddle, its observer character, the tower or the source's art. Each film needs a classic riddle with a
**visual** answer, a new place, new characters and its own comparison card.

## 1. Signature traits
- **Cutaway building**: the front wall is removed. Pastel rooms (peach, pink, lavender, mint, cream) with a few icon props sit
  in a slate structure; a light stair core with zigzag flights carries big grey-brown floor numbers and small "Stairs" plates.
  The street and road markings sit at the bottom, the sky at the top.
- **The counter pill** (top centre, dark navy, amber digits): it rolls as the camera tracks a person between floors
  (1 → 10 → 20 in the source; 1 → 3 and 1:11 → 1:12 in ours). It is the hook's motion.
- **A routine told as a loop**, then **an observer at a desk** (a security guard with CCTV in the source; a night
  receptionist with a call switchboard in ours) who watches it every day; "?" marks bounce over the observer's head.
- **The anomaly** comes on an exterior shot with a bottom pill (sample: "Then 306 is empty").
- **"Why only when …?"** is a bottom pill over the exterior.
- **The countdown card**:
  - a cream background with two side-by-side comparison panels (dry day vs rainy day bars / 306 booked vs 306 empty);
  - a ring timer 10 → 0 (a red arc, black numeral, a one-second pulse);
  - a speech-bubble icon with "Comment your answer", which turns into an amber "Time's up" pill.
- **The reveal through a framed view**: corner brackets, a "● REC …" label top left, a timestamp bottom right. Ours is
  an x-ray view recoloured as night vision (a teal `color`-blend wash plus scan lines). It is a visible upgrade, and each
  reveal shot gets its own palette, which the scene-change metric needs. Then a short
  **limit tag** pill (sample: "Two quiet minutes"), the observer laughing, the morning after, and the end pills.
- **Loop ending**: the last 0.4 s returns to the opening composition with the first pill, so the reel replays seamlessly.

## 2. Measured metrics (source → sample → gate)
Source: the engine analyzer's metrics + rea (not included). Sample: the owner's final-render QA (not included).

| metric | source | sample (final) | gate |
|---|---|---|---|
| duration | 87.7 s | 91.2 s (+3.9 %) | ±15 % |
| WPM overall | 163.4 (239 words; ~199 while speaking) | 151.3 (−7.4 %; 208 while speaking) | ±20 % |
| hard cuts / min | 14.36 (21 cuts, median shot 2.7 s, first cut 5.2 s) | 14.47 (+0.8 %; median shot 3.3 s, first cut 3.9 s) | ±20 % |
| scene changes / min | 10.94 (median scene 3.8 s) | 9.87 (−9.8 %; render 1 was 7.89 before the night-vision reveal tint) | ±20 % |
| motion mean · p90 | 7.62 · 25.9 (hold 50 %) | 5.55 · 11.5 (hold 19 %) | — |
| brightness · colourfulness | 0.70 · 39.6 | 0.59 · 36.3 (night) | — (ours is a night story; see §4) |
| palette | slate `#424b59` 25 %, cream `#f0e9d8` 22 %, beige `#ded4ba` 17.5 %, sky `#b7d0dc` 12 %, grey `#828993` 12 %, brown `#895c33` 8 %, amber `#d1964a` 2 % | slate `#333f4d` 20 %, grey `#a09b9b` 19 %, cream `#ece3cc` 17 %, teal `#63898b` 13 % (night-vision), brown `#775439` 13 % | — |
| loudness | −14.1 LUFS, TP −1.3 | −14.0 LUFS, TP −1.9 (no-music −14.0 / −1.8) | −14 ±1, TP ≤ −1 |
| voice | one male narrator, f0 ~165 Hz (p10/p90 134/239), lively | Kokoro `am_eric` 1.12 (160 Hz) | — |
| music | **none** (rea: no sustained bed); ~78 editor SFX; the countdown is near-silent, one click per second | an original 100 BPM marimba bed, 21 dB under the voice (dropped in `nomusic`) | ≥ 10 dB voice over bed |
| first word | 0.5 s | 0.21 s | ≤ 0.4 s |

The later samples (final render 3s; `samples/riddle-diner/out/qa/`, `samples/riddle-twins/out/qa/`):

| metric | source | One Fright, No Water (diner) | Born Second, Born First (twins) |
|---|---|---|---|
| duration | 87.7 s | 87.0 s | 89.0 s |
| WPM | 163.4 | 161.4 (`am_eric` 1.07) | 149.0 (`am_eric` 1.12) |
| cuts / min | 14.36 | 15.86 (render 1: 8.98, before the inserts) | 15.51 (render 1: 10.12) |
| scene changes / min | 10.94 | 11.03 (render 1: 6.90) | 10.79 (render 1: 8.77) |
| motion mean | 7.62 | 4.67 | 5.25 |
| brightness · colourfulness | 0.70 · 39.6 | 0.68 · 55.2 | 0.78 · 28.8 |
| bed | none | 112 BPM diner jazz (upright bass, brushes, vibraphone) | 84 BPM lullaby (music box, pizzicato, woodblock ticks) |
| Whisper | — | 20/20 lines, mean 1.00 | 19/19 lines, mean 1.00 |

## 3. Beat map (% of runtime) and script formula
| % | beat | source (shape only) | sample (The 1:12 Call) |
|---|---|---|---|
| 0–10 | **Setup loop**: who, where, the routine; the counter rolls | lives on 20, lift to 10, climbs 10 floors | checks into 305 every Friday; at exactly 1:12 he calls next door, says nothing, hangs up, asleep in two minutes |
| 10–18 | **The observer** sees it daily; "?" marks | a named security guard with CCTV; the routine repeats every day and puzzles him | Nadia, the switchboard lamps 305 → 306, "every single Friday" |
| 18–31 | **The anomaly** (exterior), then the same routine with one change | on one condition (the weather) the routine changes: the lift takes him to the top | then 306 is empty: 1:12, wide awake, no call, he just sleeps |
| 31–38 | **Rule out the boring answers** | the lift isn't broken; nobody else does this | the phone works fine; nobody else does this |
| 38–40 | **The question** (bottom pill) | why only under that one condition? | "Why only when 306 is booked?" |
| 40–56 | **Countdown card** 10 s, "Comment your answer", "Time's up" | dry vs rainy bars | 306 booked (1 call) vs 306 empty (no call) |
| 56–62 | **The look**: the observer checks the footage / goes up | the guard pulls the lift footage | Nadia takes a late tea upstairs, hears it through the wall |
| 62–84 | **The reveal in two steps**, the limit tag, the device | the man cannot reach the higher button; the rain prop reaches it for him | 306 snores like a chainsaw; he dials 306, it rings, "Hello?", click; two quiet minutes |
| 84–91 | **The observer laughs** + the morning after | the guard laughs and spills his drink; the rain prop is left behind | Nadia drops her pen; 305 moves to the top floor, the switchboard stays dark |
| 91–100 | **End pills + loop** | "Did you get it right?" + "Follow for more" → the first pill | same |

- **220–240 words**, present tense, second person only in the question ("You have ten seconds"). Name only the observer.
- **The riddle must be fair**: the anomaly must be the clue. Rain = the umbrella, 306 empty = no snoring. Write the comparison card
  so a careful viewer can solve it.
- **The countdown is real**: show "10" from the card's entry through "…your answer now", then tick 1 per second to 0, then "Time's up".
  Put a 10.6 s `gap` before the "Time's up." line in `vo/script.json`.

## 4. Visual system
| role | hex | notes |
|---|---|---|
| outline | `#2b2f38` 3 px | every shape |
| structure | slate `#424b59`, light `#5a6474`, slabs `#828993` | |
| rooms | `#f6d9c0 #f4cfcf #dcdcef #d5e8d4 #f2e8c8 #e3d3ea` | night: overlay `rgba(20,26,48,.18–.55)` per room |
| stairs | `#c9ccd6` / `#aeb3c0` | plates `#f0e9d8` |
| wood | desk `#9a6638`, doors `#9b6a3e`, bed frames `#8a5a36` | |
| accent | amber `#e8a53a` (counter digits, "Time's up", "Did you get it right?"), gold call line `#f2b630`, red `#d9544a` ("?", timer arc, "EMPTY") | |
| sky | night `#2a3350` + stars + moon; day `#8fcbe6` + clouds + sun | the source is day + rain; ours is night → morning |
| card | cream `#f0e9d8`, panels `#dfe8f2` / `#c9d0dc`, pill `#1f2633` | |

- **Type**: a slab serif. The source looks like Bree Serif; we use **Roboto Slab** (SIL OFL), not shipped: download it from
  https://fonts.google.com/specimen/Roboto+Slab into `assets/fonts/` as `RobotoSlab_wght_.ttf` (see
  `assets/template/assets/fonts/README.md`). It is declared with `@font-face` as "RSlab" (700) and "RSlabR" (400); no
  system-name fallback in CSS, or the lint fails. (The samples were rendered with a locally installed Rockwell Bold.)
- **Pills**:
  - navy `#1f2633`, radius 0.34 em, padding 0.26/0.55 em, white 50 px text;
  - the big reveal pill is 66 px, the limit tag 40 px;
  - "Did you get it right?" has amber text.
- **Layout**:
  - counter pill at y 219 (11 %);
  - top caption pill at y 369 (19 %);
  - bottom pill at y 1500 (78 %; the source sits at 85 %, we keep it out of Instagram's bottom 20 %);
  - x-ray/REC frame brackets at 60/1020 × 470/1760, label at y 508, timestamp at y 1714.
- **Scale**: a floor is 340 world units; the building shots run at camera 1.12 (~4.5 floors visible, as in the source),
  room close-ups at 1.9–2.3, the desk at 2.0–2.3. People are 0.62 scale in the building (~220 px tall), 0.66 at the desk.

## 5. Shot grammar and transitions
- 24–26 shots, hard cuts only, one every 2–5 s (the card holds 13 s).
- The order of shot types:
  1. a rising building track with the counter;
  2. a two-room night view, then a close-up of the routine;
  3. the observer's desk (monitors / switchboard);
  4. the exterior with the anomaly pill;
  5. the cutaway anomaly, then its close-up;
  6. the desk again (the boring answers ruled out);
  7. the exterior with the question;
  8. the CARD;
  9. the observer goes to look (a rising track);
  10. the framed reveal (x-ray / CCTV);
  11. close-ups of the mechanism (the device, the ring, "Hello?", the click);
  12. the framed two-shot with the limit tag;
  13. the observer laughs;
  14. the morning exterior;
  15. the observer waves;
  16. the opening composition with the end pills.
- No dissolves; a soft whoosh under every cut. The last 0.45 s is the first frame again, with the first pill.

## 6. Motion grammar
- **Tracking**: the camera rises with the climber (ease in-out over the line), and the counter number changes when the person passes each floor.
- **Every shot drifts**: a push of 0.01–0.03 scale per second.
- **Character acting**: sit up 0.3–0.6 s, receiver to the ear, a "…" bubble, "?" bounces (|sin| 5 Hz), a back-ease pop for
  bubbles; phone ring lines and a 60 Hz jitter; snore waves (arcs expanding through the wall) and Z's drifting across.
- **Pills** pop with `back.out(2.2)` from scale 0.82 in 0.18 s, one at a time.
- **The countdown ring** drains each second (the arc refills at each tick); the number pulses 8 % on the tick.

## 7. Caption system (paraphrase pills, not word-by-word)
- 20–24 pills for ~90 s, 2–6 words each, written to reinforce the narration rather than transcribe it ("Every single Friday",
  "No call", "The phone works fine", "Why only when 306 is booked?"). The countdown text ("Comment your answer", "Time's up") is drawn on the card.
- One pill at a time; it switches on a word anchor (`tools/build.py` → `pills()`), top by default, bottom for the anomaly and the question.
- The SRT beside the render holds every spoken word (for WPM and accessibility), even though the screen shows paraphrases.

## 8. Sound
- The source has no music bed: a lively male narrator and editor SFX. There are whooshes on cuts, pops on pills and dings.
  The countdown has one click per second over near-silence (the voice track falls to −69 dB).
- Ours (`tools/sound_design.py`):
  - **Bed** (music; dropped in `nomusic.m4a`), 21 dB under the voice: 100 BPM marimba ostinato + pizzicato bass + shaker.
    D minor through the mystery, F major from the payoff.
    During the card it drops to a low 1 Hz tension pulse under the clicks.
  - **SFX** (both mixes):
    - a whoosh into every cut, a pop on every pill, stair footsteps and counter ticks;
    - the receiver lifted and hung up, two phone rings, switchboard lamp pops;
    - one click per countdown second, a ding at 0, a hit on "Time's up";
    - snores (a buzzy inhale plus an airy exhale) from the first hint to the dial, a picture-frame rattle, dial clicks;
    - the ring that wakes the snorer, the big click, a chime on "two quiet minutes", the pen drop and a sign-off chime.
- Loudness: two-pass loudnorm to −14 LUFS, TP −2. Library suggestion (POST.md): search the in-app library for "quirky
  mystery pizzicato", "playful detective" or "curious marimba", at 95–110 BPM, light.

## 9. Retention devices
- The counter rolls from frame 1 (motion plus a number to read) and the first word lands by 0.2 s.
- The observer's "?" makes the viewer the second detective.
- The anomaly is introduced with "Then … something strange happens".
- The boring answers are ruled out before the question, so commenters can't take the easy way out.
- A real 10-second countdown with an instruction ("Comment your answer") gives the comment section its fuel.
- The reveal is shown, not just told: the framed camera view, then the device in close-up.
- A limit tag gives a quotable line; the observer's laugh releases the tension; the end loops for rewatches.

## 10. Do / don't
- **Do**: a riddle whose answer is a picture; a fair clue in the anomaly; the observer named once; the counter tied to the
  camera; comparison panels that hint without answering; the end loop.
- **Don't**:
  - violent classics (shootings, deaths): pick a harmless one;
  - brands on the building;
  - pills in the bottom 20 %;
  - characters taller than a floor (heads cross the slab: keep sitting heads ≤ 250 units above the floor);
  - a structural column through an open-plan lobby (render 1 of the snapshot cut the clock in half).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-riddle-cutaway/assets/template my-riddle && cd my-riddle   # runnable 3-shot demo
cp ~/.claude/skills/explainer-riddle-cutaway/tools/* tools/
# 0) the slab serif is not shipped: put Roboto Slab (OFL) in assets/fonts/RobotoSlab_wght_.ttf (assets/fonts/README.md)
# 1) vo/script.json (voice am_eric, speed 1.12; a 10.6 s gap before "Time's up.")
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "engine/audio/tts.py" vo
# 2) tools/build.py: edit pills() (text, start, end, top|bottom, n|big|small|amber) -> captions.html, world.html, index.html, SRT, timing.json
python -I tools/build.py
# 3) assets/lib/film.js: window.RC_FILM(K, V) -> {shots, T}; building / lobby / exterior / card drawers are film-local
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/sound_design.py
npx -y hyperframes@0.8.210 check --json
bash "tools/with_render_lock.sh" python -I tools/snap.py scratch/snap <t1,...>
bash "tools/render_locked.sh" "$PWD" scratch/master.mp4 delivery
bash "tools/with_render_lock.sh" bash tools/deliver.sh scratch/master.mp4
```
- **Kit API** (`assets/template/assets/lib/kit.js`):
  - `RC.create({canvas,width,height})` → `K.play(shots)` and `K.render(t)` (per-shot `bg`, optional `xf` dissolve).
  - `D.cam(c, x, y, s)`, `D.rect`, `D.rr`, `D.ell`, `D.line`, `D.text(c, txt, x, y, size, col, {weight, align})`,
    `D.pill(c, txt, cx, cy, size, {col, bg, a, scale})` (screen space).
  - `D.head(c, {x, y, r, skin, hair: bald|bun|beard|short, eyes: open|closed|wide|laugh, mouth: flat|smile|open|o|snore|laugh, glasses, look, tilt})`.
  - `D.person(c, {x, y, s, f, shirt, stripes, vest, pants, arm, armL, walk, carry: case|tray, …head opts})`.
  - `D.bed(c, x0, x1, floorY, {head: ±1, sit 0..1, arm (receiver), lump, blanket, occupied, …head opts})`.
  - `D.phone(c, x, y, s, {ring, t, lifted, col})`, `D.zz`, `D.qmark`, `D.waves(c, x, y, t, k, dir, col, n, span)`.
- **Kit extension** (`assets/lib/kit-ext.js`, loaded after kit.js; build.py and preview.html include it):
  - `D.headX` / `D.personX`: everything `D.head` / `D.person` take, plus `hairType: curly|kid|long`, `hairCol`,
    `hat: chef|cap|nurse|bandana`, `moustache`, `coat`, `apron`, `carry: pans|glass|clipboard`, `panUp`, `glassLevel`.
    `D.bed` still calls the plain `D.head`, so a person in bed takes `hair: bun|short|bald|beard` only.
  - `D.frameView(c, label, stamp, tint, {scan})`: the framed reveal (a `color`-blend tint, scan lines, brackets, ● label, stamp).
  - `D.counterPill(c, txt)`, `D.stairCore(c, n, y, FH, x0, x1)`, `D.wallClock(c, x, y, r, h, m, {numerals, rim})`,
    `D.burst(c, x, y, r, txt, k)` (a BANG! star), `D.ringTimer(c, x, y, r, n, frac, pulse)`, `D.cardFooter(c, t, upT, cy)`.
- **Insert shots by camera override** (the cheap way to reach the source's cut density). The film keeps a module-level
  `OV = null` and a wrapper `const cam = (c, x, y, s) => (OV ? D.cam(c, OV[0], OV[1], OV[2]) : D.cam(c, x, y, s));` that every
  shot calls instead of `D.cam`. An insert re-draws an existing shot with a tighter framing, so it is a hard cut with a new
  palette:
  ```js
  const at = (t0) => shots.find((s) => s.t0 === t0);
  const insert = (t0, baseT0, ov) => { const base = at(baseT0);
    return { t0, bg: base.bg, draw(c, lt, u, t) { OV = typeof ov === "function" ? ov(lt) : ov; base.draw(c, lt, u, t); OV = null; } }; };
  shots.push(insert(T.o2i, T.o2, (lt) => [330, F2 - 204, 3.4 + lt * 0.05]));   // [world x, world y, zoom] with a slow push
  ```
  Anchor each insert on a word (`w("r02", "exactly") - 0.1`). Screen-space overlays drawn after a zoomed drawer (a
  certificate card, a speech bubble) need `c.setTransform(1, 0, 0, 1, 0, 0)` first, or they are zoomed and cropped too.
- Film-local (sample `film.js`): `hotel(c, t, state)` (5 floors, rooms 305/306 with states, lobby, stairs, street, sky), `stairPos(p)`,
  `counter(c, txt)`, `clockTxt()`, `xray(c, label, stamp)`, `callLine()`, `exterior(c, t, {day, dark306, move})`, `card(c, t)`.
- **Preview without the lock**: copy the skill's `tools/preview.html` + `tools/inline.py` into `scratch/`. Run
  `python -I scratch/inline.py scratch/preview.html scratch/preview_inline.html`, open the result in the Browser pane, then call
  `sheet([t1, t2, t3])` with javascript_tool and take a screenshot. Pills are DOM, so the preview shows the world only.
  The pane is shared with other agents: always pass your tabId. **When the pane is hidden its screenshots time out**; use
  headless Edge instead: copy `tools/edge_sheet.py` to `scratch/`, then
  `bash .../with_render_lock.sh python -I scratch/edge_sheet.py 6.3,12.6,28.0 scratch/p1.png` (preview.html draws the
  sheet from the `#t=` hash). Check the pills over the world with `tools/snap.py` (it renders the real composition).
- **Cover**: run `tools/world_frame.py <t> scratch/cover_world.png` under the lock (it drops the captions host for one snapshot),
  then `tools/cover.py "Question?" "Can you solve it?" scratch/cover_world.png [title_y sub_y]`. The default pill
  heights are 560 and 700; pass others to keep the key prop clear (inside the 3:4 grid crop, y 240–1680). Long titles
  shrink to fit with a 40 px margin.
- Render: about 3 min for 91 s at `delivery` with 2 workers (Canvas2D).

## 12. Gotchas
- **A CSS font fallback with a system name** (`"RSlab", Rockwell, serif`) fails `hyperframes check` (font_family_without_font_face).
  Declare the file with `@font-face` and fall back to `serif` only.
- **Pills come from build.py.** Pill times are word anchors; a missing word aborts the build with "no word id:word".
- **Desk scale.** At 0.95 scale the receptionist's head rose above the lobby ceiling. People in a 340-unit floor must stay ≤ 0.66.
- **Count from the card's entry.** If the countdown starts at the end of "…now" plus 0.75 s, "Time's up" lands on 1, not 0.
  Start the ticks at the end of the "now" line − 0.25 s, so 0 shows ~0.8 s before "Time's up".
- **A file navigate opens a new tab** in the Browser pane each time; call `tabs_context` and use the new tabId.
- **Scene changes run low when every shot is the same cutaway palette.** Render 1 measured 7.89/min against the source's
  10.94. Give the reveal its own look (the night-vision tint) and alternate the cutaway, desk, exterior and card. Render 2
  measured 9.87.
- **The `drop>50` YAVG rule flags hard cuts from a bright card to a dark building.** Mark these planned cuts in
  `tools/qa_config.json` → `planned_dips`. They are not black frames.
- **Cuts run low with ~20 word-anchored shots.** The diner and twins films measured 8.98 and 10.12 cuts/min in render 1
  (gate ≥ 11.5). Six to nine camera-override inserts (§11) on strong words fixed both without new drawings.
- **A pill over the key prop in an insert.** The top pill sits at y 330–410. In a close insert, a clock, a BANG! or a
  name tag at that height disappears. Snapshot every insert with pills (`snap.py`) and move the camera centre until the
  prop sits clear of the pill (world y shift = screen shift / zoom).
- **Don't cut away from the reveal's moving part.** In twins render 2, a calendar close-up ran across "the clocks went
  back", so the first 2:00 → 1:00 spin played at the frame edge. Render 3 reframed that insert to hold the whole clock,
  with the calendar small at its left. An insert that falls during the motion the riddle hinges on must keep that
  motion in frame.
- **Pills state the case, not a rule.** "Water doesn't stop hiccups" read as a general health claim (and a wrong one).
  The pill now says "The water didn't work", which matches the narration. Keep reveal pills about this story.
- **Exterior signs vs the bottom pill (y 1500).** A shop sign drawn at screen y ~1450 sits under the bottom pill. Lift
  the exterior (the diner's `setTransform(..., 1100 - 1100 * z - 120)`) so the sign clears it.
- **Gags one at a time.** Three "HIC!" bubbles at once overlapped each other and the pill. Show one bubble per spoken
  word and put a running counter (HIC ×3) in a corner.
- **Clock stamps from a running time** come out fractional ("SUN 01:56.8224…"). `Math.floor` the minute.
- **`hyperframes check` reports `dead_stretch`** on canvas-only motion (the canvas changes, the DOM does not). It is a
  warning, not an error; judge motion on snapshots.
- **Whisper returns numbers as digits** ("1.55", "25", "10"). `tools/whisper_check.py` spells heard digits as words
  ("one fifty five", "twenty five") and maps "a.m." → "am" before it scores each line.
- **Time facts in the script.** A clock riddle must be exact and say which country's rule it uses. The twins film states
  the US/Canada rule on screen (first Sunday in November, 2:00 → 1:00) and gives the EU rule in the pinned comment.

## 13. Files
`references/sources.md` · `tools/` (build.py, sound_design.py, audio_kit.py, snap.py, qa.py, qa_config.json, whisper_check.py,
deliver.sh, qa_all.sh, cover.py, world_frame.py, inline.py, preview.html, make_template.py; analysis helpers: sheet.py, grab.py,
stems.py, gaps.py, pitch.py, voicetest.py (Kokoro voice pitch match)) · `assets/template/` (a runnable 3-shot, ~14 s demo: rising track + counter, desk, card) ·
`assets/sample/` (the full "The 1:12 Call" film.js, kit.js, script.json, SCRIPT.md) · `assets/sample-diner/` and
`assets/sample-twins/` (film.js with insert shots, script.json, build.py with their pills, sound_design.py with a jazz and
a music-box bed, SCRIPT.md, SAMPLE.md) · `tools/edge_sheet.py` (headless preview) · `assets/template/assets/lib/kit-ext.js`.

## Appendix A — source analysis (`DfLF1TVgTXf`)
Measured with the engine analyzer (metrics, Whisper), rea (stems: no music bed; voice 165.8 Hz), a 2 fps sweep
(175 frames) and full-size frames of key moments. Pill wording is described, not quoted.

| t (s) | beat | picture / pills |
|---|---|---|
| 0–5.2 | setup | the cutaway rises with the lift (counter 1 → 10); two setup pills (where he lives, where the lift stops) |
| 5.2–9.5 | the routine | the lift opens at 10; the man (yellow shirt, moustache) climbs the stairs 11 → 19; sky at the top |
| 9.5–16 | observer | the security desk (brown wood, a name plate), the guard (navy cap), CCTV: the lift cam, a floor readout, the stairs cam; a routine pill (bottom); "?" marks at 14 s |
| 16–19 | anomaly | the exterior tower in rain, the anomaly pill (bottom) |
| 19–27 | anomaly in the cutaway | the rainy lobby, the lift rising 1 → 20, two pills on the change, a rain cloud over the roof |
| 27–31 | ruled out | the lobby: other residents ride up; two ruling-out pills |
| 31–33.5 | question | the exterior in rain, the question pill (bottom) |
| 33.5–49 | card | cream: two labelled comparison bars (one to 10, dashed to 20; one full); the ring timer 10 (held 3 s) → 0; the comment prompt; the time-up pill at 47.5 |
| 49–53.5 | the look | the night desk; the guard pulls the lift footage; zoom into the monitor |
| 53.5–62.5 | reveal 1 | the lift cam (REC, timestamp): the man is short next to a tall woman, tiptoes to 10; the limit pill (58.5); a second pill + a red bracket |
| 62.5–66.5 | so | the building with the lift's usual stop marked, a pill; a rainy-day entrance with an umbrella |
| 66.5–73.5 | reveal 2 | the lift cam: a big reveal pill; the umbrella tip presses 20 |
| 73.5–79 | ride + laugh | the lift rises 1 → 19; the night desk: the floor readout, the guard laughs and spills his drink |
| 79–84 | after | the rain clears to sun; the roof: a closing pill; the day desk: the guard waves |
| 84–87.7 | end | the lobby: the amber "did you get it right" pill + a follow pill; the last frame: the first pill again (loop) |

- **Numbers**:
  - 87.7 s, 720×1280, 30 fps; 21 cuts (14.36/min), scene changes 10.94/min; motion 7.62.
  - Brightness 0.70; 239 words, 163 WPM; −14.1 LUFS.
- **Pills**: a Bree-Serif-like slab, ~33 px on 720, on navy `#1f2633`. Top at 19 %, bottom at 85 %; the counter at 11 %.
- **What we keep / change**:
  - Kept: the grammar beat for beat, the pills, the counter, the card, the framed reveal, the limit tag, the laugh, the loop.
  - Changed:
    - a new riddle, place, characters and time of day (night → morning);
    - the comparison card redrawn for the new clue;
    - the reveal via an x-ray cutaway instead of CCTV (hotels don't film rooms);
    - an original music bed, plus a no-music mix.
