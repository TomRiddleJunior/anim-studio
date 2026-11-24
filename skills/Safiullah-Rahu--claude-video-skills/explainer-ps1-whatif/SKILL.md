---
name: explainer-ps1-whatif
description: "Makes a vertical 9:16 second-person 'what if you had a power' reel (100-130 s) in PS1-era low-poly 3D seen through a VHS tape, in the format of a viral Instagram what-if (@yastor200, 'stop time', 1.1M likes): a pixel-font title question over a street, a power used on a small everyday mishap, a tape-transport HUD (PAUSE / PLAY or REWIND / PLAY with a big label that shrinks to a blinking icon), an AGE / LIVED counter that stays equal and then splits as the power is overused, a DAY / TAKE counter on the right, one sentence per caption in a pixel monospace, three quick everyday uses, one big use, a relationship told in four beats, the cost said plainly, an escalation with the counter racing, a quiet twist scene and an end card that asks 'Would you press …?' for a YES/NO vote. Built in code with HyperFrames + three.js and a reusable PS1 kit done the way the hardware did it: a low-res render target (270x480) upscaled nearest, vertex snapping, affine texture mapping, Gouraud vertex lighting, vertex fog, 15-bit colour through a Bayer dither, blob shadows, chunky 16-64 px canvas textures, procedural posable low-poly people with 32x32 pixel faces, and a VHS layer (tracking band with a dotted line, chroma bleed, grain, a rewind tear); an original bitmap pixel font (no font file); a synthesized D-minor pad bed and VCR SFX. Use for 'PS1 what-if', 'low-poly what if reel', 'what if you could stop time / rewind / fast-forward / skip / read minds', 'VHS HUD reel', 'yastor200 style', 'superpower with a cost', 'AGE vs LIVED counter', 'would you press pause', or any second-person power fantasy that turns on its cost. Builds on explainer-engine (TTS, analyzer) and hyperframes."
---
# PS1 what-if — a power, its uses, its cost, one question

Reverse-engineered frame by frame from one Instagram reel (**@yastor200**, `DfDOGC3BP0k`, 119.1 s, 1.10 M likes,
6.8 k comments; analysed locally for reference only; details in **Appendix A** and `references/sources.md`). The format
is a **second-person power fantasy** told as a chain of tiny scenes: the power fixes a small everyday thing, then it
becomes a habit, then it reshapes a relationship, then its cost is said plainly, then a quiet scene shows the cost, and an
end card asks the viewer to vote. The look is a 1990s console game recorded on tape: low-poly people and streets, bloom,
a VHS tracking line, a pixel-font HUD that is the story's scoreboard.

Sample (original work): `samples/ps1-rewind/out/ps1-rewind.mp4` (explainer-styles workspace; full sources in `assets/sample/`) — **"Rewind"**
(121.6 s): what if you could rewind ten seconds? Every mistake gets another take, your life has no mistakes in it, only
takes; you loop the best ten seconds of your week for a hundred years; she leaves, and two hundred takes of the same
sentence change nothing. "She fell in love with take fourteen. She never met take one."

## 1. Signature traits
- **Title = the question**, in pixel caps over the first shot: a small white line ("WHAT IF YOU COULD"), the power in
  one or two huge words (red, flipping to blue on the first beat), optional third line. No intro, the hero is already
  moving in frame 0.
- **The tape transport is the power's UI.** Top-left: a big icon + word (PAUSE / PLAY in the source, ◀◀ REWIND / ▶ PLAY
  in ours) shown for ~0.9 s on the press, then a small blinking icon while the power is on.
- **AGE / LIVED counter** top-centre from ~10 % to the end card: big yellow "AGE n", white "LIVED n YEARS" under it.
  They stay equal while the power is a toy and split when it becomes a habit; LIVED turns light blue while it races.
- **A right-hand counter** for repetitions inside one use (DAY n in the source, TAKE n / LOOP n in ours).
- **One sentence per caption**, pixel monospace, white with a dark outline, low-centre; second person, present tense.
- **Small scenes, hard cuts**, ~21 a minute; one big use as a short travel montage; a relationship in four beats
  (meet, date, marriage, a question); a rapid flicker of cuts in the twist scene.
- **End card over the city from above:** "Would you / press <POWER>?" + the big icon. The post caption asks YES or NO.

## 2. Target metrics
Source: `research/insta10/frames/DfDOGC3BP0k/metrics.json` + our own 2 fps sweep, per-cut strips and audio study
(Appendix A). Sample: `assets/sample/out/qa/gates.json` (measured on the delivered mp4).

| metric | source | sample "Rewind" | gate |
|---|---|---|---|
| duration | 119.1 s | 121.6 s (+2.1 %) | ±15 % |
| hard cuts / min (analyzer) | 21.16 | 14.8 (30 cuts; **explained miss**: the edit has 53 hard cuts = 26.1/min, but same-angle rewinds and dark night cuts fall under the detector's threshold — §12) | ±20 % |
| scene changes / min | 17.64 | 18.25 | ±20 % |
| WPM overall | 133.0 (≈158 while speaking) | 120.4 (164 while speaking) | ±20 % |
| first word · title on frame 0 | 0.0 s · yes | 0.18 s · yes | ≤ 0.4 s |
| brightness · colourfulness | 0.524 · 35.1 | 0.386 · 44.3 | — (ours has night scenes in the last third) |
| loudness · true peak | −14.1 LUFS | -14.2 LUFS · -1.6 dBTP | −14 ±1, ≤ −1 dBTP |
| voice over bed+SFX | ≈ 14 dB (bed in the gaps −34 dB vs speech −20 dB) | 14.9 dB | ≥ 10 dB |

## 3. Beat map (% of runtime) and script formula
| % | beat | source (shape) | ours ("Rewind") |
|---|---|---|---|
| 0–3 | **Hook**: the title question over a busy street; the power is used within 1 s | a pedestrian in danger, the world freezes | you trip on library steps in front of everyone |
| 3–9 | **First use**: a physical fix, then the power released | you move her out of the way, release | ◀◀ the fall plays backwards, ▶ you step over the crack |
| 9–12 | **Nobody knows** (a close-up of someone unaware) | she credits luck | a passer-by never looked up |
| 12 | **HUD on**: AGE = LIVED | AGE 24 / LIVED 24 | AGE 24 / LIVED 24 |
| 12–24 | **Three quick everyday uses**, each set-up → press → result, the right counter ticking | alarm, a rude remark, an exam | alarm (TAKE 60), a joke (TAKE 9), an interview, a free throw (TAKE 31) |
| 24–40 | **The big use / the toy phase**: a montage that makes LIVED move | a walk around the world (travel postcards) | typo, wrong turn, awkward word; "no mistakes, only takes" |
| 40–47 | **Habit**: you use it before everything | every email, every call | (folded into the montage) |
| 47–62 | **Relationship in four beats**: meet (callback to the hook's stranger), date, marriage, a question | the bus girl, the date, marriage, kids | the bus-stop girl (TAKE 14), the date, the wedding (40 versions of the vows) |
| 62–70 | **The cost, said plainly**, ECU on the hero, LIVED racing in blue | body vs mind | "every rewind, you live those seconds again" (AGE 30, LIVED 41) |
| 70–83 | **Escalation**: the power used to escape, the counter explodes | pauses of days → centuries (LIVED 1,200) | looping the best ten seconds for a weekend, a year, a hundred years (LIVED 144, LOOP 9,999) |
| 83–96 | **The twist scene**: the power fails the relationship; a rapid flicker of cuts | her laugh, too loud | she leaves; 200 takes of the same words; "ten seconds can fix a sentence, not a marriage" |
| 96–98 | **The closing line** over a callback image | — | the bus-stop laugh (TAKE 14) on washed-out tape; "she never met take one" |
| 98–100 | **End card**, silent but for music | the question: would you press the pause button? | the question: would you press REWIND? |

- **240–270 words**, 40–50 short sentences, second person, present tense, no names. One fact per sentence; numbers
  are the counters' numbers (the narration and the HUD agree).
- **The cost must be a consequence of the power's mechanics**, not a moral: a pause makes the mind older than the body;
  a rewind means every take is lived; a fast-forward skips the hard parts that were the point.
- **Callback**: the stranger from the hook (or the first big use) returns as the relationship and as the last image.
- **Voice**: one calm male narrator, ~160 WPM while speaking. Kokoro `am_michael`, speed 1.03 (the last line 0.92),
  gaps 0.24–0.64 s; a longer gap before each scene change.

## 4. Visual system
| role | source (measured) | ours |
|---|---|---|
| render | a game engine with soft bloom, pixelated textures, sharp HUD | real PS1 pipeline: 270×480 target → nearest ×4, vertex snap to the 270×480 grid, affine UVs, vertex light + vertex fog, 15-bit colour via 4×4 Bayer dither, blob shadows |
| palette | warm greys `#5f5c5d` `#82807f` `#bbbeba`, brown `#473837`, skin `#bfa288`, cream `#edebe1`, rust `#945843`; dark frames 4 % | the same warm daylight family in the first half (sun `#fff1dc`, ambient `#c3cbd8`/`#958a7c`, fog `#cfd4da`), golden hour `#ffcf9a`, then evening/night interiors (`#7a8098`, `#5a6480`) with a warm lamp and a blue TV light |
| haze | milky lift strongest at the bottom, bloom on highlights | `haze` 0.6–0.8 + bloom 0.5–0.85 in the final pass |
| VHS | a soft light band + dotted tracking line at **y 1605/1920 (83.6 %)**, slight chroma | same band + 14 px dotted line, chroma 0.35 px, grain; rewind: row tear, roll band, noise streaks, chroma ×2.5 |
| title | "WHAT IF YOU COULD" white ~60 px cap height; the power ~95 px, red `#c03a38` → blue at 1.0 s; black outline + drop shadow | pixel font: line 1 s=8 (56 px caps) at y 182, power word s=19 red `#d83c3c` → blue `#7fb0f2` at 1.0 s, line 3 s=9 |
| HUD | "AGE 24" yellow `#f8d868` cap ~90 px centred at y 118; "LIVED 24 YEARS" white ~55 px at y 245; "❚❚ PAUSE" left x 58–445, y 312–405; "DAY 1" yellow right, x 680–910 | AGE s=12 (84 px) at y 176 · LIVED s=7 at y 290 (light blue `#98d8f8` while moving) · ◀◀ REWIND s=9 at x 58, y 372 · TAKE s=8 right-aligned at x 1012, y 384 (moved below y 168 for the app's top bar) |
| captions | white pixel mono with serifs, ~40 px caps, dark outline, centred at y 1338 | original 5×7 bitmap font, s=6 (42 px caps), 2 lines max of ≤ 26 chars, block bottom at y 1296 (inside the 168–1300 safe band) |
| end card | a two-line question (white first line, light blue `#98d8f8` second line naming the button) + a big blue pause icon over a top-down city | "Would you" + "press REWIND?" + ◀◀ icon over the same kind of aerial |

- **Safe area (9:16):** key text between y 168 and 1300; nothing under the right-hand rail (x > 950, y 1100–1700); faces
  framed between y 450 and 1150 in CUs so the caption never covers eyes or mouth.
- **People:** low-poly, readable at 270 px: big head (radius 0.115 m), a 32×32 face texture on a bent decal (eyes 4×3
  with a 2×2 pupil, brows, a 6-px mouth), clothes as flat colours over a 16 px fabric speckle. No real likenesses.

## 5. Shot grammar and transitions
- ~45–50 shots for 120 s (median ≈ 2.3 s), hard cuts only (the press itself is the transition). Shot types: establishing
  street wide (the hook), side wide for the action, reverse wide for the reaction, insert (clock, phone, hoop), OTS for
  dialogue, CU/ECU for the cost, overhead for travel/traffic, aerial for the end card.
- **The press:** label pops on the word; the picture either freezes (pause) or runs backwards with the tear (rewind) for
  0.7–1.7 s; PLAY pops for ~0.9 s when it resumes. Several presses in a row (a counter racing) read as a pulse of tears.
- **Flicker montage** in the twist: 3–6 cuts 0.4–0.8 s apart between two CUs (source 107–110 s: 7 cuts in 2.5 s).
- Cameras: 9:16 at fov 44–56 sees only ±13–17° across; check that both people in a two-shot are inside it (put the
  camera behind one shoulder rather than beside the table).

## 6. Motion grammar
- Every shot drifts: 0.2–1.5 m dolly/push with in-out cubic easing; walk cycles tied to distance (stride 1.38 m).
- Story actions are functions of a story clock, so a rewind is the clock running backwards fast (×2–4) with the tear.
- Counters roll on words; LIVED racing uses an ease-in (u²) so the last digits fly.
- The HUD never animates position; labels pop (no tween) like a real VCR OSD.

## 7. Caption system
- One sentence per caption (split at punctuation only when it exceeds 2 lines of 26 chars), on at the first word − 0.04 s,
  off at the next caption − 0.02 s or 0.6 s after the last word. No caption for the title line; none on the end card.
- Pixel font from `assets/lib/pixfont.js` (an original 5×7 bitmap font, mixed case with descenders; no font file),
  white `#f4f2ec`, outline `#120a14` (½ font pixel), shadow 1 font pixel.

## 8. Sound
- Source (measured): one calm narrator; under it a tonal pad in **D minor** with no steady pulse (tempogram flat, beat
  trackers lock onto speech), about 14 dB under the voice; SFX on the presses.
- Ours: `tools/sound_design.py` (numpy, original): a detuned saw-ish pad Dm–B♭–F–C every 6.7 s, a sparse FM-bell melody on a
  72 BPM grid, tape wow, hiss; energy curve follows the beat map (it drops for the twist and swells on the end card).
  SFX: VCR transport clunks on every REWIND/PLAY, a rising motor whirr while rewinding, alarm beeps, crowd murmur, rim
  clanks, a swish, phone taps, a honk, wedding chimes, loop chirps, a door, an end hit + chime.
- Two mixes: `final.m4a` (full) and `nomusic.m4a` (voice + SFX at the same gain). −14 LUFS, TP −2 dBTP before AAC.

## 9. Retention devices
- Title on frame 0 with the hero moving; first press inside 6 s; a press, tick or counter change every ≤ 4 s until 37 %.
- The counter is the open loop: AGE = LIVED promises they will split; the viewer waits for it.
- Escalating numbers (TAKE 2 → 60 → 9 → 31 → 14 → 40 → LOOP 9,999 → TAKE 200; LIVED 24 → 41 → 144).
- Callback image before the end card; the end card asks a binary question (comments become votes).

## 10. Do / don't
- **Do:** keep the narration and the HUD in agreement; make every press audible and visible; keep faces readable (CUs at
  0.7–1.0 m, a warm key); put the cost in the mechanics; end on a question the viewer can answer in one word.
- **Don't:** quote the source's lines or reuse its power/ending; copy its characters, signage, handles or sponsor slot;
  use real people, brands or logos (our city has a "CITY LIBRARY", a "CAFE", an invented "NORTHLINE" office);
  let captions cover a face; dissolve (this format cuts).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-ps1-whatif/assets/template my-reel && cd my-reel      # runnable 13 s demo
# 1) write vo/script.json (engine tts.py format), voice it, build the VO data + SRT + index duration
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I <explainer-engine>/audio/tts.py vo
python -X utf8 -I tools/build.py my-reel                 # END_CARD=3.0 (env) seconds after the last word
# 2) the film: assets/lib/<film>.js — window.FILM(K, W, V) with shots {t0, sets, light, fn(tt, u, t) -> state}
#    the HUD timeline: assets/lib/<film>-hud-config.js — window.HUD_CONFIG(V) (title, rewinds, plays, takes, ages, lived)
node tools/shots.cjs assets/lib/<film>.js --mids         # one mid time per shot
npx -y hyperframes@0.8.210 snapshot --at "$(node tools/shots.cjs assets/lib/<film>.js --mids)" --no-end -o scratch/snap
python -X utf8 -I tools/sheet.py scratch/snap 10 216     # labelled contact sheet; look at every tile
python -X utf8 -I tools/cut_est.py times <shot starts>   # then snapshot those times and: cut_est.py snaps <dir>
# 3) sound (the sample's tools/sound_design.py; tools/sound_min.py in the template)
"$HOME/.generative-music-video/venv/Scripts/python.exe" -X utf8 -I tools/sound_design.py
# 4) render through the shared lock, deliver, QA
bash <tools>/render_locked.sh "$PWD" out/master_r1.mp4 delivery
python -X utf8 -I tools/qa.py encode out/master_r1.mp4 0.6        # mp4 + _nomusic.mp4 + cover.jpg (no -shortest)
python -X utf8 -I tools/qa.py qa <source metrics.json>            # sweeps, analyzer, gates.json
<python with faster_whisper> -X utf8 -I tools/whisper_check.py   # every line heard?
```
- **Kit API** (`assets/lib/ps1-kit.js`): `PS1.create({canvas, width, height, lowW, lowH})` → `K` with `K.mat({color, map,
  emissive, unlit, noFog, vcol, transparent, double, alpha, wrap, affine})` (the PSX ShaderMaterial), `K.tex.*` (noise, brick,
  tiles, grid, wood, windows, stripes, grass, asphalt, leaves, fabric), `K.signTex(text)` (pixel-font signs),
  `K.box/plane/cyl/ico/taper`, `K.blob(r)`, `K.sky(top, bottom)`, `K.human(opts)` → rig, `K.render(state)`.
- **Render state:** `{cam, look, fov, roll, sun:{dir,col,k}, amb:{sky,gnd,k}, pts:[{p,c,k,r}] (4 point lights), fog:{col,near,far},
  bg, expo, sat, tint, lift, haze, bloom, bloomThr, rew (0..1 tear), noise, track (VHS band), chroma, vig, fade, flash, snap, dither, t}`.
- **Rig:** `K.human({skin, hair, top, bottom, shoes, style: short|fringe|long|bun|bob|bald, fem, jacket, dress, skirt, sleeves, eye,
  lip, blush, beard})` → `rig.set({pos, ry, pose, pose2, k, walk:{phase, amt}, add:{joint:[x,y,z]}, look:[yaw,pitch], expr, talk, blink,
  breathe, visible})`; `rig.headPos()`, `rig.at(joint, offset)`. Poses: stand, relaxed, sit, sitBack, lie, sleep, phone, phoneEar, point,
  armsUp, shoot, shootLoad, present, hands, vows, shrug, laugh, armsCross, fall, hug, typing, wheel, handOut. Faces: neutral, smile,
  grin, laugh, sad, surprised, closed, talk, worried, blank, lookL, lookR.
- **Sets** (`assets/lib/rewind-sets.js`, the sample's): a city (library steps with a cracked step, street, bus stop, cafe front,
  basketball court, wedding lawn, cars, trees, lamps, far skyline), an apartment (bedroom + alarm clock, living room + couch +
  TV + a window whose sky you tint, kitchen + table + door), an office (meeting room, interview desk), a restaurant, a cafe
  interior and a phone prop. `W.show(["city"])` shows one set at a time; `W.hideCast()` before posing.
- **HUD** (`assets/lib/ps1-hud.js`) draws everything 2D from `window.HUD_CONFIG(V)`; for a PAUSE film swap `rewIcon` for two
  bars and the labels.
- Performance (Intel UHD 770 iGPU, 2 workers): 3,649 frames in 275 s (≈ 13 fps); the master is ~630 MB (dither + grain),
  so always re-encode (CRF 19).

## 12. Gotchas
- **9:16 is narrow.** At fov 48 the frame sees ±13.5° across; two people at a café table 1.2 m apart fall outside a
  front camera 1.8 m away. Shoot dialogue over a shoulder, or from far.
- **Close-ups need the face's facing.** Compute the camera from `rig.root.rotation.y` (the sample's `faceCam`), not world
  offsets: a fixed offset put the camera behind a passer-by.
- **Hair caps hide eyes.** The cap is a partial sphere tilted back 0.5 rad so its front edge sits above the brows;
  fringe boxes must sit below the cap's top or they read as a hat.
- **Sloped shoulders** (a second taper on the torso) and a short neck keep CUs from looking like a head on a post.
- **Building rows cover other sets.** Exclude a street-building slot when the building's span overlaps a set, not only
  its start (a building that started at x 38 stood in the middle of the court).
- **Low-res faces need light:** keep faces' ambient ≥ `#c3cbd8`/`#958a7c` in daylight; night scenes need a warm point
  light within 1.5 m of the face.
- **Dark cuts don't count.** The analyzer's cut detector needs a mean frame difference of ~33/255 across the cut; render 1
  detected 26 of 49 cuts because the evening and night apartment third was dark and low-contrast. Render 2 brightened
  those interiors (exposure 1.22, ambient ×1.4), gave alternating close-ups different light (her warm, him cold blue), moved
  a same-angle cut to a close-up, and was checked first with `tools/cut_est.py` (3 snapshots per boundary → predicted cuts).
- **Time-lapse strobe:** keep a day/night window cycle under 2 Hz with a small exposure swing (photosensitivity).
- **Grain on the low-res grid** (one value per 4×4 block) looks right for PS1 and halves the file size at CRF 19.
- **Write patch scripts with the Write tool** (shell heredocs with Python triple quotes fail here).
- **Never `-shortest`** when muxing the mixes; `qa.py encode` maps both streams and checks lengths and frame counts.

Files: `references/sources.md` · `assets/template/` (runnable 13 s demo: the hook, the trip, REWIND, PLAY, end card) ·
`assets/sample/` (the full "Rewind" project, 50 shots) · `tools/` (study.py, audio_study.py, build.py, qa.py,
whisper_check.py, sound_design.py, audiolib.py, shots.cjs, sheet.py)

## Appendix A — source analysis (`DfDOGC3BP0k`)
Measured from the analyzer output (`metrics.json`, sheets), our 2 fps sweep (`sweep_01..04`), 8 fps strips around all
42 detected cuts, full-size grabs at 13 moments, a spectrogram, a tempogram and chroma of the speech gaps.

**Numbers.** 119.08 s, 1080×1920, 30 fps · 42 analyzer cuts (21.2/min; median shot 2.33 s, p10/p90 0.47/5.75 s; first cut
9.7 s — the press at 1.0 s and the play at 8.3 s are not cuts) · 35 scene changes (17.6/min) · 264 words, 133 WPM ·
brightness 0.524, colourfulness 35.1, saturation 0.236, dark frames 4.2 % · motion mean 14.9 (deciles 19.5 → 9.1 at 50 % →
22.9 at the end) · −14.1 LUFS · bed: tonal (chroma in the gaps D 0.66, F/C/A 0.46, B♭ 0.44 → D minor), no pulse (tempogram
peaks all within 2 %), gaps at −34 dB RMS vs −20 dB in speech.

**Cut times (s).** 9.73 11.77 15.97 18.30 21.10 23.10 25.73 27.37 28.30 31.57 34.50 36.00 37.30 41.30 44.20 48.43 51.10
56.23 60.87 62.53 63.93 65.23 67.13 69.33 70.30 72.93 79.27 85.17 87.23 88.40 90.50 97.43 100.03 104.90 107.37 107.83
108.27 108.73 109.10 109.43 109.77 112.27 (the run at 107.4–109.8 is the twist flicker).

| t (s) | beat | picture / overlay |
|---|---|---|
| 0–3.4 | hook | street wide, bus, a pedestrian on the crossing; title 2 lines, the power word red → blue at 1.0 s; ❚❚ PAUSE big at 1.0–2.4, then a small blinking ❚❚ |
| 3.4–9.7 | first use | the frozen street; the hero walks in from behind the camera; ▶ PLAY at 8.3 |
| 9.7–10.1 | sponsor card (not part of the format; skip it) | — |
| 10–12 | nobody knows | CU of the rescued pedestrian |
| 12.0 | HUD on | AGE 24 / LIVED 24 YEARS, stays to 117 s |
| 12–28 | three quick uses | bed + alarm clock; a café insult with DAY 1→3; an exam with DAY 2→19 and a book pile; PLAY between |
| 28–48 | the big use | lunch break → frozen waves, a Paris street, a rainy Tokyo alley, pyramids; LIVED 24 → 27; the coffee still steaming; lying on a beach |
| 48–56 | habit | office: email, call, small talk; AGE 25, LIVED 28 → 30 |
| 56–73 | relationship | date in a bar, wedding arch with petals, kitchen with the kids question (DAY 11 → 90) |
| 73–83 | the cost | ECU push on the hero, LIVED 41 → 200 in light blue; back to the street |
| 83–98 | escalation | days → years → centuries (LIVED 205 → 1,200); a rooftop deck chair over a city |
| 98–112 | twist scene | kitchen, a TV, her laughing; the flicker of cuts; PAUSE |
| 112–117 | closing line | the street from above, a crowd crossing |
| 117–119 | end card | the two-line question naming the pause button + a big pause icon over the aerial |

**What we keep / change.** Kept: the beat map and its percentages, title grammar, tape-transport HUD, AGE/LIVED split,
right-hand counter, one-sentence pixel captions, hard cuts at ~21/min, the flicker, the aerial end card, a D-minor pad bed.
Changed: the power (rewind 10 seconds), every scene and line, original low-poly characters and city, a real PS1 pipeline
(the source is a modern engine), a visible rewind tear (picture running backwards), the TAKE/LOOP counter, captions inside
the 168–1300 safe band, no sponsor slot.
