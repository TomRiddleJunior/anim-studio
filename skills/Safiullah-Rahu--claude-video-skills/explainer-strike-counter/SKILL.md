---
name: explainer-strike-counter
description: "Makes a 12-16 s vertical 9:16 minimal motivational loop in the 'strike counter' format (a viral Instagram reel, 279k likes): pure black, a white stick figure repeating one physical action at a big object, a large mono counter with a small letter-spaced label racing 0 -> 100 under motion-smeared repetitions while a caption says nothing is changing, a scan line that reveals hidden progress inside the object, the 101st repetition releasing it in gold light (counter turns gold, rays, sparks), two closing caption cards that credit the hundred before it, and (our upgrade) a seamless loop back to frame 0. No narration: music and sound effects only. Built in code (HyperFrames + one Canvas 2D composition, pure function of time) with a reusable kit: stick figure with two-bone IK and ghosted smear, counter with pop/flash/roll, caption cards, scan line, rays, glow, particles; synthesized sound (numpy) with a no-music mix. Use for 'strike counter reel', '100 strikes loop', 'counter motivational loop', 'hidden progress metaphor', 'the 101st hit', 'consistency / patience micro-reel', 'stick figure plus counter animation', or any one-action metaphor of cumulative effort (a key in a rusted lock, a seed under pavement, a drip on stone, a stuck crate). Builds on hyperframes."
---
# Strike counter — one action, a counter, hidden progress, a gold release (a 14 s loop)

Reverse-engineered from one Instagram reel (`DfWaJJlIbPT`, 14.1 s, 279k likes; `references/sources.md`), analysed
locally for reference only. The format is a wordless metaphor: a figure repeats one action against something that does
not give; a counter makes the effort visible; a reveal shows that the effort was working all along where nobody could
see it; one more repetition finishes it, and the last two captions say the finish belongs to everything before it.
This skill keeps the beat map, timings, layout and type, and adds a **seamless loop** (the last frame is frame 0) and a
reveal that shows the progress as a thing (our sample: a heap of rust dust).

Sample: `assets/sample/` — "The Rusted Lock" (14.0 s): a figure cranks the key of a giant rusted padlock; TURNS 0 → 100;
the scan shows the rust round the bolt cracked through and a heap of dust in the case; turn 101 snaps the shackle open in
gold light; a new locked padlock fades in and the counter rolls back to 0. Template: `assets/template/` (6 s, a figure
pushing a crate: PUSHES 0 → 20, the wheels underneath loosening, push 21 rolls it).

## 1. Signature traits
- **Black, one object, one figure, one counter.** Nothing else on screen but four short caption cards. No camera move,
  no cut, no scene change: 0 cuts/min, 0 scene changes/min.
- **The counter is the protagonist**: a big mono number (slashed/dotted zero) with a small grey letter-spaced plural
  label under it that turns **singular at 1**; it pops on the first slow counts, races at ~30/s, glows white on 100 and
  turns **gold** on 101.
- **The race**: the action speeds up past what the eye can count; the counter outruns the visible repetitions, and the
  motion is drawn as smear (3-4 ghost copies of the tool, ghost arms, an arc trail) plus sparks/flakes at the contact.
- **Hidden progress, revealed by a scan line**: the figure stops, exhausted; a bright line sweeps down the object and
  above it the object turns x-ray blue and shows the damage inside (the source: one glowing crack).
- **The release**: one more repetition; the object opens in gold light (warm glow from the break, the object lit warm,
  rays fanning upward, the floor glowing), the figure turns cream in the light, the counter gold.
- **Four caption cards** (one or two lines each): no visible effect → but inside it was changing → the final hit didn't
  do it alone → the earlier hits did the work. Short, plain, white.

## 2. Measured metrics
Source: the engine analyzer on the source (metrics.json) + our frame/region/audio measurements (Appendix A). Sample:
`assets/sample/out/qa/` after delivery (run `tools/qa.py`).

| metric | source | sample | gate |
|---|---|---|---|
| duration | 14.06 s | 14.00 s | ±15 % |
| cuts / scene changes per min | 0 / 0 | 0 / 0 | ±20 % |
| motion mean (p90) | 1.69 (3.45) | 2.49 (4.10) | may exceed (denser smear) |
| hold fraction | 0.155 | 0.190 | — |
| brightness · colourfulness | 0.070 · 9.6 | 0.079 · 12.1 | ±30 % |
| dark frames | 100 % | 100 % | — |
| loudness | -14.2 LUFS | -14.2 LUFS, TP -1.4 dBTP (no-music -14.2, -1.5) | -14 ±1, TP ≤ -1 |
| narration / WPM | none | none | n/a |
| first visual change | frame 1 | 0.03 s | ≤ 0.4 s |
| loop seam | not a loop | last vs first frame mean diff 0.17/255; audio -41.5 dB end, -48.5 dB start | diff ≤ 3 |
| streams | — | 14.000 / 14.000 s, 420 = 420 frames in both files | equal |

## 3. Beat map (% of runtime) and script formula
| % (s of 14) | beat | source | sample |
|---|---|---|---|
| 0 (0.0) | **Frame 0**: figure mid-action at the object, counter 0, plural label | wind-up, counter 0 | gripping the key, 0 TURNS |
| 0-4 (0-0.5) | **Count 1**, slow and heavy, label singular | first hit at 0.45-0.5 s | first turn, strained, clunk at 0.50 |
| 4-11 (0.5-1.5) | a pause, count 2 | second hit at 1.5 s | pause, second turn |
| 11-43 (1.5-6.0) | **The race** to 100: ~30 counts/s from 2.2 to 4.7 s, easing 85 → 99 → 100 at 6.0 s; caption 1 in at 15 % | smeared swings, sparks | smeared turns, flakes, sparks |
| 15-46 (2.07-6.4) | **Caption 1**: nothing changes (3-4 words) | — | four new words |
| 43 (6.0) | **100** lands with a white glow pop | — | — |
| 44-62 (6.2-8.7) | **Rest**: the figure stops, bent, breathing | leans on the tool | hands on knees, panting |
| 46-70 (6.5-9.85) | **Caption 2**: but inside it was changing | — | — |
| 48-53 (6.8-7.4) | **Scan line** sweeps top to bottom; x-ray above it; the hidden damage glows | one crack | cracked rust + a dust heap |
| 62-70 (8.7-9.85) | stands, steps in, winds up | — | — |
| 71 (10.0) | **101**: the release; counter gold | the split, gold light | the shackle jumps, gold light |
| 75-85 (10.5-11.9) | **Caption 3** (2 lines): the final repetition didn't do it alone | — | — |
| 86-95 (12.0-13.3) | **Caption 4** (2 lines): credit to the earlier repetitions | holds to the end | — |
| 95-100 (13.2-14.0) | (source: lit hold) **ours: the loop**: light fades, a fresh object replaces the old one, the counter rolls back to 0, the figure resumes the frame-0 pose | — | a new locked padlock, 101 → 0 |

**Script formula.** Pick one action and one object where (a) the action repeats cleanly, (b) the object can hide
progress inside, and (c) the release can emit light. Write four captions with these jobs, 3-8 words each, no numbers
in captions (the counter carries them), past tense. The metaphor must stay a metaphor: no claim that real objects
behave this way. Examples that fit: a key in a rusted lock (sample), a crate on stuck wheels (template), a seed under a
paving slab (watering; the roots revealed), a chisel on ice (the fracture plane), a rope on a bell (the clapper freeing).

## 4. Visual system
| role | source | sample |
|---|---|---|
| background | pure black `#000000` (64 % of pixels) | same |
| floor | hairline at y 1330, band `#101018` → `#0a0b10` → black by y ~1520 | same (`K.ground`) |
| object | blue-grey `#434850` boulder, rim `#535860`, fine stone texture, ~600 px wide, x 455-1055, y 770-1330 | laminated padlock `#474d56` → `#272a30`, rust blotches/streaks `rgba(118,60,28,.15-.45)`, rim highlight, x 490-1030, y 950-1330 + shackle to y 610 |
| x-ray | the object tinted `#2a3444`, top band `#4e5b6c`, crack core `#ffe1a9`, orange glow | `#3a4c63` → `#1f2836`, grid lines, parts outlined `rgba(190,222,255,.7)`, rust crust `#70381a`, cracks `#ffebb9` core / `#ffaf50` glow, heap `#a0592a` → `#5a2d12` |
| figure | white `#fbfbfb`, back limbs `#c3c7cd`, dark outline on the front arm; lit: `#feefdb` | same (`K.figure`) |
| tool | grey head `#a6abb3`, brown handle | steel key bar `#c4c9cf` → `#7c828a`, rust patches |
| counter | white `#f3f3f3`, gold `#f3b753` (hi `#ffd385`) | same |
| release light | warm `#ffcf7a` rays, glow on the floor `#644e38`, the object lit `#736457` | glow `rgb(255,170,80)` / `rgb(255,205,130)`, rays `rgb(255,196,110)`, floor pool, `screen` warm overlay on the case |

- **Type.** Counter: a bold monospace with a dotted/slashed zero, ~88 px, centred x 540, digits y ~372-432 (JetBrains
  Mono 700). Label: ~26 px semibold caps, letter-spacing 8 px, `#8a8e98`, centred at y 473-482 (Inter). Captions:
  ~46 px bold sentence case, `#f3f3f3`, centred; the source sits at y 1450 (two lines 1450/1508); we use y 1430 (two
  lines 1401/1459) to stay in the house safe band.
- **Layout (1080×1920).** Counter y 360-490; object and figure on a floor at y 1330, object right of centre, figure
  left; captions in the floor band; nothing in the top 18 % except (in the source) a small creator logo at (990, 140),
  which we leave out. Keep the figure's silhouette clear of the object where possible (the source never overlaps them;
  a crank forces some overlap, see §12).

## 5. Shot grammar and transitions
One locked shot for the whole reel. No cuts, no camera moves, no zooms. Every change happens inside the frame: the
counter, the action, the caption cards, the scan, the light. The only "transition" is the release (light ramps up over
0.8 s, rays over 2.7 s) and, in ours, the loop reset (0.7 s cross-fade of the object, counter roll, figure back to pose).

## 6. Motion grammar
- **Count curve** (source): 0 → 1 at 0.45-0.50 s, 2 at 1.5 s, then 4/7/11/16/21 at 1.83/2.0/2.17/2.33/2.5 s, linear
  ~30/s to 85 at 4.67 s, 89/92/95/97/98/99 at 4.83/5.0/5.17/5.33/5.5/5.67 s, 100 at 6.0 s. Ours copies the table
  (`RACE` in film.js).
- **The action** speeds up independently of the counter: first two repetitions slow and strained (ease-in, a wobble
  before the second), then ~2.5 → 5 repetitions/s, easing to ~2/s into 100; the last repetition of the race lands
  exactly on 6.0 s (the speed table is integrated and rescaled to land on a whole repetition).
- **Smear**: when the action is faster than ~1.1 rep/s, draw 3 ghost copies of the tool and the arms at t-0.024 s
  steps (alpha 0.34/0.22/0.12, scaled by speed) and an arc trail over the last 0.07 s (alpha 0.11, 40 px wide).
- **Counter**: pop 1.10× on counts 1 and 2 (0.25 s), 1.10× + white glow on 100, 1.16× + gold glow on 101 (0.5 s), a
  roll (old number up and out, new in from below, 0.28 s) for the loop reset.
- **Captions**: fade in 0.33 s with a 10 px rise (ease-out), fade out 0.15 s; measured on the source: in at 2.07,
  6.53, 10.53, 12.03 s; out at 6.33-6.5, 9.83-10.0, 11.85-12.0 s.
- **Scan line**: 0.6 s top to bottom, in-out ease; a 3 px white core and a 52 px cyan bloom; the x-ray is clipped above
  it, so the reveal follows the line.
- **Release**: object light eout over 0.8 s (source rock luma 52 → 86), sky/rays slow over 2.7 s, figure warms over
  0.6 s, sparks and chips burst for ~0.9 s, a gentle 4 % pulse after.
- **Figure**: two-bone IK for arms and legs; poses blend with ease-in-out and feet lift 22 px when they move; breathing
  (hip ±2.5 px at ~1.4 Hz) during the rest.

## 7. Caption system
Four cards, centred, white bold sentence case, one or two lines, ≤ 30 characters a line, no box, no outline (black
background). They are on-screen text, not subtitles of a voice: the reel has no narration. Card jobs as in §3; never
more than one card on screen. Write an SRT of the cards (`tools/srt.py`) for accessibility uploads.

## 8. Sound
- **Source** (measured, Appendix A): no voice. Quiet start (-43 dB), heavy hits on counts 1 and 2, a continuous
  hammering roll through the race (-12 dB, flat), a drop to -29 dB just before 100, a hit on 100, a quiet suspense
  stretch (-18 to -23 dB) under the rest and the scan, a sub-heavy boom on 101 (-5 dB) decaying to -13 dB by 12 s
  under a warm pad (F-A-C, F major), fading at the end. No measurable tempo.
- **Ours** (`tools/score.py`, all numpy): sfx stem — rusty creaks on the slow turns, a clunk on each slow count, a
  ratchet click on every count in the race over a whir that follows the turn speed, soft clunks per visible turn,
  panting, a scan sweep, an x-ray hum and faint crackle, the snap + shackle clack + sub boom + shimmer on 101, flakes
  tinkling, counter-roll ticks and a soft thud for the new lock, a circularly filtered room tone that wraps across the
  loop. Music stem — a low D drone that swells with the race and drops out at 5.9 s, soft pulses on the visible turns,
  a heartbeat and a high suspended chord under the reveal, a riser into 101, a warm D-major chord + bells on 101 that
  is silent by 13.94 s. Energy curve matched to the source's (race -15, rest -19, release -8 dB RMS).
- **Two masters**: full (music + sfx) and no-music (sfx only), each -14 LUFS, true peak -2 dBTP before AAC (AAC adds
  ~0.5 dB). Remux the same video with the no-music mix; never re-render.

## 9. Retention devices
- Motion and a number from frame 1; the singular label at 1 rewards attention.
- The race: a number moving too fast to read against a caption that says nothing is happening (tension).
- The reveal at ~48 %, the release at ~71 % with a colour change on the counter (white → gold).
- Two closing cards that reframe the release; a seamless loop that restarts the count (rewatch without a seam).

## 10. Do / don't
- **Do** keep one shot, one object, one figure, one counter; keep captions to four cards; keep the race at ~30
  counts/s; make the label singular at 1; make the reveal show the progress as a visible thing; land the counts exactly
  on the visible impacts (1, 2, 100, 101); end on a frame that equals frame 0.
- **Do** keep the figure's limbs the source's build (thick white capsules, round head and feet, grey back limbs, a dark
  outline on the front arm) and light it warm in the release.
- **Don't** add narration, a second object, cuts or camera moves; don't put numbers in captions; don't flash the whole
  frame at the release (it reads as a flash frame; use a local glow); don't let the release light overflow as a hard
  rectangle (draw the floor glow as a clipped ellipse); don't claim a real-world fact (it's a metaphor).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-strike-counter/assets/template my-loop && cd my-loop        # 6 s runnable demo
# 1) assets/lib/film.js: your object + action + reveal + release (the sample's film.js is the full 14 s reference)
#    keep: the count table, the visible-action speed table landing on whole repetitions, T.c1..c4, the loop reset
npx -y hyperframes@0.8.210 check --json
WITH_LOCK=<lock wrapper, optional> bash tools/snap.sh 0,0.5,2.6,6.0,7.1,8.2,9.9,10.2,11.2,12.6,13.5,13.966
# 2) sound: copy the sample's tools/score.py and edit the event list (FFMPEG env var or ffmpeg on PATH)
python -X utf8 -I tools/score.py                    # score/final.wav, final_nomusic.wav, assets/audio/final.m4a
#    then add <audio id="mix" class="clip" src="assets/audio/final.m4a" ...> to index.html (as in the sample)
npx -y hyperframes@0.8.210 render -o out/<name>_master.mp4 -q delivery -w 2
bash tools/deliver.sh                               # out/<name>.mp4 (CRF 19) + out/<name>_nomusic.mp4 (same video)
python -X utf8 -I tools/srt.py                      # caption cards as SRT
python -X utf8 -I tools/qa.py --source <source.mp4> --source-metrics <its metrics.json> --analyzer <explainer-engine qa/analyze_video.py>
python -X utf8 -I tools/cover.py <caption-free still.png> "TITLE" "line"   # snapshot a copy with window.SK_NO_CAPTIONS = true
```
- **Kit API** (`assets/lib/strike-kit.js`, `SK.create({canvas})` → K): `K.clear(col)`, `K.ground({y, warm, glowX,
  glowW})`, `K.counter({n, label, x, y, px, gold, pop, flash, roll:{from,to,u}, labelY})`, `K.caption({lines, a, rise,
  y, px, lh})`, `K.figure({hip, torso, tlen, headR, headTilt, hands:[front, back], feet:[front, back], warm, a,
  armsOnly, arm:[l1,l2], leg:[l1,l2], bendF, bendB})` → joint positions, `K.glow(x,y,r,rgb,a)`, `K.rays({x,y,k,t,n,a0,
  a1,len,width,rgb,seed})`, `K.scan({y,x0,x1,a})`, `K.particles(list, t, floorY)` (spark/flake/chip events with t0, x,
  y, vx, vy, g, life), `K.flash(rgb,a)`, `K.rr`, `SK.ik`, `SK.util`. Fonts: SKMono, SKInter (loaded in world.html).
- **Film contract** (`window.SK_FILM(K) → {draw(t), DUR, T}`): a pure function of t; `t >= DUR` draws frame 0.
- **Tools** (`tools/`): `sweep.py` (dense timestamped sweeps of any video), `regions.py` (per-frame luma of named
  regions: caption fades, counter changes, light ramps), `audio_probe.py` (RMS curve, onsets, tempo, band energy,
  chroma), `qa.py`, `deliver.sh`, `snap.sh` + `tile.py`, `cover.py`, `srt.py`. All take ffmpeg from `FFMPEG` / PATH.
- **Performance**: Canvas 2D on CPU: 420 frames rendered in 35 s with 2 workers; snapshots ~1 s each.

## 12. Gotchas
- **A full-frame additive flash on the release** turned every pixel brown and reads as a flash frame; use a local
  radial glow at the break instead.
- **The floor glow as a radial gradient in a short rectangle** showed a hard horizontal edge under the captions;
  clip to the floor and scale the gradient into an ellipse (`K.ground` does this).
- **A crank or a twist needs reach**: the hands must stay on the moving grip, so the body leans and the hip shifts with
  the grip angle; check the extreme angles in snapshots (arms clamp straight and the hands leave the grip if the reach
  is short). Lengthen the arms a little (110/104) rather than move the figure into the object.
- **Fast repetitions alias** (5 turns/s at 30 fps is 60° a frame): decouple the visible action from the counter and
  draw ghosts from real past times so smear length follows speed.
- **Seamless loop**: make every state at `DUR` equal its state at 0 (pose, angles, counter, colours, light), and end the
  music stem silent ~60 ms before the seam; filter the room tone circularly (FFT) so it wraps.
- **Singular label**: `count === 1 ? "TURN" : "TURNS"`, and keep it plural during the 101 → 0 roll.
- **Seeking at the very end** of a video can return no frame; grab at t - 0.05 when comparing the last frame.

Files: references/sources.md · assets/template/ (6 s demo) · assets/sample/ (The Rusted Lock: film, kit, tools, SCRIPT,
SAMPLE, POST, audio) · tools/ (study + QA tools).

## Appendix A — source analysis (`DfWaJJlIbPT`)
Measured from the analyzer output, 1 fps and 6 fps sweeps, 9 full-resolution grabs, per-frame region luma at 30 fps
(caption band, counter, object, whole frame, sky) and the audio RMS/onset/band/chroma probe.

| t (s) | what happens |
|---|---|
| 0.00 | Frame 0: figure in a wind-up, tool raised behind; object; counter 0 + plural label |
| 0.45-0.50 | first impact, sparks; counter 1, label singular; object luma +3 (impact flash) |
| 1.50 | second impact; counter 2 |
| 1.8-5.7 | the race: 4, 7, 11, 16, 21 … 85 (4.67) … 99 (5.67); 3-4 ghost tools per frame, sparks at contact |
| 2.07-2.40 | caption 1 fades in (caption-band luma 6 → 22) |
| 6.00 | 100 with a glow pop (counter-region luma 33 → 63 → 54) |
| 6.33-6.50 | caption 1 out; 6.53-6.85 caption 2 in |
| 6.5-8.7 | the figure rests, bent over the tool |
| 6.83-7.42 | scan line top to bottom; object luma 43 → 52 (blue x-ray); the crack glows |
| 8.67-9.10 | stands; 9.4-9.85 wind-up |
| 9.83-10.0 | caption 2 out |
| 10.00 | 101: counter flashes (78) then gold; the crack bursts; object luma 52 → 86 by 10.8 s; sky glow 2.3 → 6.9 by 12.7 s |
| 10.53-10.90 | caption 3 (two lines) in; out 11.85-12.0 |
| 12.03-12.40 | caption 4 in; holds to 14.06 |

Audio per 0.25 s (dB): 0-0.5 -43/-31; impacts -9.7 (0.5) and -9.6 (1.5); race -12 flat (2.0-5.5); -29 at 5.75; -14 at
6.0; -18 to -23 (6.25-10); -5 at 10.0, -12.7 by 12, -20 at 13.75. Chroma C, F, A (F major) after 10 s; centroid falls
from ~2.6 kHz (metal hits) to ~0.8 kHz (pad) after the release.
