---
name: explainer-guardian-dialogue
description: "Makes episodes of the user's original vertical 9:16 series 'The Guardian & the girl' with its original little-girl cast (70-90 s; the new series, 'Conversations Beyond Time' with Zeythar the Sage AI and the 20-year-old girl, uses explainer-zeythar-conversations instead): a faceless hooded AI mentor (the Wise Guardian, dark navy robe, glowing cyan circuit lines, a gold medallion) and a curious little girl in a red hoodie sit on a stone ledge before a giant glowing clock; she asks one question, he answers with a countdown (ten to one by default) built for retention: the question on screen from frame 0, an open loop by 15 %, a top countdown counter, holographic rule cards with animated abstract icons, a re-hook question from her at ~45 %, the clock stopping dead with a second of silence before rule one, a payoff that turns the clock into the lesson at ~80 %, a one-word ending she echoes, and a loop-friendly last frame. Animated from the user's key art itself (no redraw): GrabCut layers with an inpainted background, a WebGL liquify warp per layer masked by region maps (breathing, hood nods, hand gestures, head tilts, ponytail sway), the girl's blinks (closed-lid texture + drawn lash line) and lip-sync (jaw warp + dark interior from her voice envelope), the Guardian's voice made visible as medallion glow and light pulses along his cloak lines, code-drawn clock hands that tick faster through the countdown, a code-drawn sky and clock rings above the plate for the wide shot. Qwen3-TTS VoiceDesign voices picked by speaker-embedding similarity to saved anchors, word-synced captions, a synthesized music-box score and clock sounds, HyperFrames render. Use for 'Guardian and the girl', 'the Guardian episode', 'new episode with the hooded AI and the girl', 'ask the Guardian', 'clock mentor reel', 'countdown advice reel with my two characters', or any new question/topic for this series."
---
# The Guardian & the girl — one question, a countdown, the clock stops, "Now."

A series format, not a one-off: the user's two characters (key art `assets/plate/keyart.png`, 1402×1122, the user's
own image) answer a new question in every episode. First episode: **"Ten Rules for Ten Years"**,
`the sample film (the render is not included in this repository)` (87.8 s). Write new episodes
with `EPISODE_GUIDE.md`; build them with the template (§12). Only these two characters ever appear (holograms and icons
stay abstract), the Guardian stays faceless (darkness and a faint drift of blue particles inside the hood, never eyes),
and the characters are always animated from the key art, never redrawn.

## Source analysis (what the brief and the key art give us)
- **The user's request** (2026-11-02, `explainer-styles/BUILD_BRIEF_GUARDIAN.md`): "create a reel with the following
  characters" — the Wise Guardian (mysterious, faceless, hooded AI mentor who lives within the ancient clock; glowing
  blue details = AI, knowledge, wisdom) and the Little Girl (curious, expressive; asks, challenges, explores). The scene:
  she asks "Your advice for the next 10 years"; he answers with something different from two reference lists the
  user supplied (not included; generic items such as sleep 8 hours, lift weights, index funds, no consumer debt, call
  your parents, read books not feeds…), written to hook and hold to the end. "After reel creation
  add this as a skill for future."
- **The key art**: a Pixar-like render. Guardian on the left (x 0–906, hood 35–470, the hood opening x 470–715 /
  y 240–455 pure black, medallion at (521, 527), cyan lines on the hood edge, collar and robe, two dark gloved hands
  palm-up at (330, 612) and (605, 808)); the girl on the right (x 873–1402, face 940–1112 / 372–584 in 3/4 view looking
  up-left at him, chin on her hand, ponytail with a pink scrunchie at (1272, 405)); behind them a huge clock: golden
  rings, Roman numerals, a deep starry-blue face; a stone ledge bottom right. Warm gold rim light from behind, cool
  blue from the Guardian. Everything a 9:16 frame cannot hold (the 1402×1122 plate is landscape) is solved by the
  wide layout (§4) and by singles at ≤ 2.3× over the source.
- **What the format borrows from viral "ask the wise one" reels**: the question as the title card at frame 0, a
  visible countdown so the viewer knows how much is left, an open loop on the last item, a mid-video re-hook spoken by
  the viewer's stand-in (the girl), a pattern break before the payoff, a one-word takeaway and a comment prompt that
  makes the comment section a vote ("comment the number").

## 1. Identity
- **Two voices, one place.** A tiny curious girl and an ancient faceless mentor on a ledge before a giant clock. She
  speaks three times (question, re-hook, echo); he answers.
- **A countdown with a visible counter**, one holographic card per item (numeral, a caps title, an animated abstract
  icon), cyan corner circuitry matching his cloak lines.
- **The clock is the story's instrument**: its code-drawn hands tick calmly, speed up through the countdown, blur
  into a time-lapse for the last items, **stop dead** (a clunk, then ~1.2 s of silence, the dust frozen, a cool tint),
  stay at twelve through rule one, and restart on the last "Now." with a warm light swell.
- **The faceless speaker made visible**: the medallion glows with his voice and light pulses run outward along his
  cyan lines on every syllable onset; blue data sparks rise from the medallion.
- **The key art is the character plate**: every frame is the user's painting, layered and warped, never a redraw.

## 2. Pacing targets (measured on the sample; `samples/guardian-ten-years/out/qa/`)
| metric | target | sample |
|---|---|---|
| duration | 70–90 s | 87.8 s |
| first word · frame 0 | ≤ 0.4 s · the girl + the question | voice at 0.12 s (Whisper stamps 0.00) · GIRL_Q with the typed question |
| words · pace | 160–200 words | 186 words · 125.7 WPM overall, 154 WPM while speaking |
| shots · cuts / min | a cut on every line + 2 in-line cuts; 12–16 / min | 22 shots · 14.35 / min (analyzer: 13.66) · median 3.8 s (1.3–6.9) |
| open loop | by 15 % | "And the last one?" at 12.24 s (13.9 %) |
| re-hook | 40–50 % | "Is number one the secret?" at 42.38 s (48.3 %) |
| pattern break | ≥ 1 s of silence after the clunk | 1.18 s (clunk at 70.52 s → "One." at 71.70 s) |
| payoff | 75–85 % | "One." at 71.70 s (81.6 %); "…now." at 92.7 % |
| loudness | −14 ±1 LUFS, TP ≤ −1 dBTP, voice ≥ 10 dB over the bed | −14.2 LUFS · −1.3 dBTP (mp4) · voice 20.2 dB over the bed |
| Whisper `small` | every word | 100 % (186/186, clipped to the speech span, no VAD) |
| layout | no caption on a card or a face; key text inside the safe areas | 0 violations in 2634 frames (`tools/layout_check.py`) |
| brightness | no unplanned YAVG dips | 0 flagged (min 45, mean 71) |

## 3. Beat map (% runtime)
| % | beat | sample line | picture |
|---|---|---|---|
| 0–4 | **Question** (L) | "What's your advice… for the next ten years?" | GIRL_Q: her face low in frame, the question ghosted above her at frame 0, each word lighting as she says it |
| 4–9 | Authority (G) | "I've watched ten thousand decades pass through this clock." | CLOCK_MED: the giant clock, sky and rings above the plate, hands sweeping, gold dust |
| 9–12 | Stakes (G) | "Most people lose theirs the same way." | HOOD close-up, medallion glowing with his voice, head slightly bowed |
| 12–17 | **Open loop** (G) | "So… ten rules. And the last one? Almost nobody follows it." | WIDE (the counter "10" appears on "ten") → cut to GIRL_MCU on "And" |
| 17–48 | Rules 10–6 (G) | "Ten. Learn one hard thing every year…" | HANDS, WIDE_LOW, CARD_HERO, CARD_GAP, OTS_GIRL; a card per rule, the counter ticks, the clock ticks faster |
| 48–51 | **Re-hook** (L) | "Is number one the secret?" | GIRL_MCU, she leans in, brows up, a whisper |
| 51–55 | Aside (G) | "Patience. You'll want to hear it." | HOOD, the medallion pulses once like a wink |
| 55–80 | Rules 5–2 (G) | "…Who you are when no one is watching… is who you're becoming." | WIDE, HANDS, CLOCK_CARD (the hands blur into a time-lapse), CARD_GAP (her eyes widen) |
| 80–81 | **Pattern break** | (clunk, silence) | CLOCK_FROZEN: every hand stopped at twelve, dust frozen, cool tint |
| 81–90 | **Rule one** (G) | "One. Stop waiting for the right time. I've watched every clock in the world. The right time has never arrived." | card 1 on the frozen clock → HOOD_PUSH: the slowest push of the film (z 1.95 → 2.30), medallion brightening, a low drone |
| 90–94 | The word (G) | "It only ever comes as… now." | WIDE, "NOW" forms in blue light over the clock |
| 94–96 | Echo (L) | "Now?" | GIRL_MCU, head tilt, brows up |
| 96–98 | Final (G) | "Now." | WIDE: the clock restarts as the word lands, warm swell |
| 98–100 | End card + loop | — | END: the girl looking up and smiling (like frame 0), "WHICH RULE ARE YOU / STARTING TODAY?" + "COMMENT THE NUMBER" |

## 4. Visual system
- **Plate** (`assets/plate/`, all 2× = 2804×2244: lanczos colour and tone + fine detail from a learned 2× upscale, `keyart_sr2x.png` = Real-ESRGAN x4plus_anime_6B 4× → box 2×, made by `tools/sr_upscale.py` in 36 s on the CPU; weights at `models\realesrgan\`, BSD-3-Clause. Inpainted areas keep a lanczos unsharp. Re-run both tools only for new key art): `bg.jpg` (both characters and the
  painted vertical clock hand removed: Telea at half scale, blurred), `guardian.png`, `girl.png` (GrabCut seeded by
  hand-measured polygons + darkness), `girl_closed.png` (her face with both eyes filled from surrounding skin by
  multi-scale normalised convolution — no hair or lashes pulled in), `lines.png` (R = cyan circuit-line mask, G =
  medallion core), `regions_*.png` (soft region maps for the warp controls), `landmarks.json` (every coordinate in
  source px, incl. the eye polylines sampled at 32 columns, the mouth curve, pivots, the hood opening).
- **Wide layout** (WIDE, WIDE_LOW, MED2, CLOCK_MED, CLOCK_CARD): the plate across the middle band (zoom 0.77 → 1080 px
  wide, 864 tall). Above: a code-drawn sky (gradient `#0d1033` → `#191f54`, fbm nebula, twinkling stars) and the
  clock's golden rings continued from the plate (outer ring centre (700, 442), r 690, a rim, two inner rings, spokes
  every 30°, numeral blocks), feathered into the plate over its top 60 px. Below: a foreground stone parapet (lit lip,
  block joints every ~210 px, warm bounce) over a warm void with soft bokeh.
- **Singles** stay inside the plate at zoom 1.75–2.30 over the source (the plate fills 9:16 from 1.71×): GIRL_Q,
  GIRL_MCU, END, HOOD, HOOD_PUSH, HANDS, OTS_GIRL, CARD_GAP, CARD_HERO (bg and characters defocused for a hero card),
  CLOCK_FROZEN. Depth of field through mip LOD (bg 0.9–1.1, characters 0; CARD_HERO bg 2.3 / characters 1.9);
  parallax: bg offset −6 % of the camera travel.
- **Clock hands** (code): hour 205 px, minute 318 px, second 336 px with a 78 px tail, gold `#ffcc80` with halos and an
  8-tap angular motion blur, a blue gem at the hub, centre (755, 478) where the painted hand met the rings. The
  schedule makes the minute and hour hands start near 12:05 (visible between the characters) and stop **exactly at
  twelve**, the second hand too (tick count solved backwards from the stop).
- **Grade**: soft ACES shoulder (35 %), saturation 1.02, contrast 1.04, vignette 0.4, bloom 0.42 (singles, threshold
  0.72) / 0.55 (wide, threshold 0.64), grain 0.032; the freeze adds a cool tint (0.35) that eases out after the
  restart, the restart adds a warm swell (0.6 over 2.6 s).
- **Palette**: navy `#080d37` / `#19285d`, warm gold `#c07d5d` / `#f3d5aa`, her red `#731b1c`, Guardian cyan
  `#6fe8ff` (cards, counter, accents), card fill `rgba(14,44,96,.66)`.

## 5. Characters (warps and acting; `assets/template/assets/lib/guardian-film.js`)
Each control is `{c: [cx, cy, radius, type + 10 × region channel], p: [...]}`; type 0 translate (dx, dy), 1 rotate
(pivot x, y, angle), 2 scale (pivot x, y, sx, sy); the gaussian weight is multiplied by the region map channel
(1 R, 2 G, 3 B, 4 A). The shader samples backwards (body controls first, then face controls).
- **Guardian**: breathing (scale about (460, 1120), sy 1 ± 0.0075 at 4.6 s, torso mask), hood nod (rotate about the
  neck (585, 470), 0.03 rad × nod on every rule numeral and on "now", hood mask), hood lean (translate, 6 px; on the
  open loop and through rule one), raised hand drift + gesture lift (translate/rotate, raised-hand mask), low hand
  drift. Voice: `medGlow = 0.15 + 0.95·env`, `lineBase = 0.04 + 0.42·env`, pulses from syllable onsets travel outward
  from the medallion at 430 px/s, 3 blue sparks rise per pulse. No eyes, ever: 16 faint particles drift inside the
  hood opening (alpha ≤ 0.22).
- **Girl**: breathing (3.4 s), head tilt about the neck (base ± 0.006 rad + events: −0.012 during the question, −0.04
  on rule 7, −0.03 on the echo), lean-in on the re-hook (−6.5 px), ponytail swing (rotate about the scrunchie, follows
  the head with a 0.3 s lag), brows (2–3 px up on her questions and when her eyes widen), eyes widen (scale 1.05–1.08)
  on the second-to-last rule, smile (mouth corners up 1.5–1.9 px, cheek up) from the last "Now." to the end.
- **Blinks**: every 2.2–4.6 s plus ~0.55 s into each girl shot; 75 ms close, 55 ms hold, 160 ms open. The lid edge
  moves from the resting lid line to the lower lid per column; above it the closed-lid texture (darkened 4.5 %, a
  little more near the edge), a tapered lash line (0.55 → 1.45 px source, thicker at the outer corner) and a 3 px
  shadow below. Judged in `out/qa/faces_blinks.jpg`.
- **Lip-sync**: her voice envelope (normalised per line so the whispered re-hook still moves) drives a jaw warp
  (5.4 px at the chin) and a dark interior lens between the lip line and the lowered lower lip (`#1a0608` → `#4d1717`,
  88 % opacity, tapered at the corners). Judged in `out/qa/faces_lines.jpg`.

## 6. Transitions
| name | build | when |
|---|---|---|
| hard cut | `t0 = first word − 0.10 s` (G) / `− 0.16 s` (L) | every line, and the in-line cuts (`cuts` / `cut_at`) |
| clock stop | the clunk, all hands at 12, dust frozen, cool tint over 0.4 s, music cut in 60 ms | end of the second-to-last rule + 0.14 s |
| card boot / out | scaleY back-out 0.42 s with a hologram flicker, title types on over 0.5 s; collapse 0.28 s at the cut | every rule |
| counter tick | old number grows and fades up, new number drops in with a glow flash | each rule numeral |
| "NOW" | left-to-right light reveal with a bright leading edge, 0.7 s | the payoff word |
| restart | ticks resume, warm grade swell, hand glow flash | the last "Now." lands |
No dissolves, no whip pans: the film is calm and the cuts carry the rhythm.

## 7. Motion grammar
- Every shot moves: an eased push/drift between `cam0` and `cam1` (3–9 % zoom) plus a small hand-held float
  (1.3/0.6 px sine pairs; 0.5–0.6 on wides, 0 on the frozen clock).
- The rule-one push-in is the slowest and longest move of the film (4.3 s, 18 % zoom, rising toward the hood).
- Characters never stop: breathing always on, the Guardian's hands drift, the girl's ponytail swings, dust drifts
  upward (three depths, front motes big and soft) — except in the freeze, where everything holds.
- Acting is keyed to words (numerals, "now", her questions), never to seconds.

## 8. Captions and on-screen text (`guardian-overlay.js`, drawn per frame on a 2-D canvas over the plate)
- **Spoken captions**: 1–3 words (≤ 16 chars), each word appearing on its onset with a 1.10 → 1.0 pop, Montserrat 800
  72 px caps, white with a dark stroke + shadow; keywords (rule numerals, "now", "patience", "secret?") in cyan
  `#6fe8ff`; the girl's lines in warm white `#fff0d8` with gold `#ffc46b` keywords. Centre y = 1420 (lower third, the
  caption box ends at 1465, inside the 400 px bottom safe area). The question line has no caption (it is typed).
- **Question** (frame 0): three rows (74/74/124 px) at y 282–494, ghosted at 34 % until each word is spoken.
- **Counter**: top centre (y 300, ring of one segment per rule), hidden on face close-ups (GIRL_*, HOOD, HOOD_PUSH, END);
  moved to x 275 in HANDS (the hood opening is under the centre there).
- **Cards**: zones per shot preset in screen px, never over a face, never below y 1300, always below the counter
  (y ≥ 390); three layouts (wide: numeral beside the title, icon below; tall; row: text left, icon right).
- **End card**: "WHICH RULE ARE YOU / STARTING TODAY?" (70/92 px, warm white) + a cyan pill "COMMENT THE NUMBER".
- `tools/layout_check.py` projects both faces through every frame's camera and tests captions, cards, counter and safe
  areas; it must print 0 violations before rendering.

## 9. Sound (`tools/score.py`, all synthesized)
| layer | level | when |
|---|---|---|
| Guardian voice: +low warmth, chorus (14/19.5 ms, −19 dB), high "air" shimmer (−27 dB), clock-tower reverb (RT60 2.5 s, −15.5 dB) | 0 dB | his lines |
| girl voice: dry + small room (RT60 0.38 s, −19 dB) | 0 dB | her lines |
| dialogue levelling: each line's speech RMS → −17 dB (whispers −19.5), gain −4…+6 dB | — | join_vo.py |
| pads (Dmaj9 – Bm9 – Gmaj9 – Asus, 68 BPM, 2 bars each, brightening toward the stop) + music box (sparse, denser after the re-hook) | ~19.5 dB under the voice, ducked 4 dB while speaking | to the stop |
| ticks/tocks (2.1/1.55 kHz bodies) on the clock schedule, −28 dB; mechanism whirr (240–1100 Hz) −37 dB | — | to the stop |
| clunk (thump + inharmonic ring, 0.75 s), −9 dB, then silence | — | the stop |
| low drone + soft pad under rule one, fading to a hush on her "Now?" | — | rule one |
| holographic chime per card −21 dB · soft whoosh per cut −33 dB · sparkle for the wink · shimmer on "now" | — | cues |
| warm pad swell + music-box motif after the last "Now."; bell swell (D5 + A5) on the end card | — | ending |
Mix: two-pass ffmpeg loudnorm to −14 LUFS / −1.5 dBTP. Voice-over-bed margin measured on the stems while speaking.

## 10. Retention devices
- The question is the title and is on screen at frame 0; the first word lands by 0.12 s.
- The open loop names the count and teases the last item ("almost nobody follows it") by 14 %.
- The counter and the speeding clock make the remaining time visible; every card is a new picture every 3–7 s.
- The girl's re-hook voices the viewer's impatience at ~48 %; the aside promises the payoff.
- The pattern break (the clock stops, silence, frozen dust) is the only silence in the film, right before rule one.
- Rule one turns the setting into the lesson (the Guardian has watched every clock: "the right time has never arrived").
- A one-word takeaway, echoed by her and confirmed by him; the last frame matches frame 0 so the reel loops.
- The end card makes the comment a vote ("comment the number").

## 11. Do / don't
- Do: animate only from the plate; keep every shot ≤ 2.3× over the source; key every cut and cue to a word; check
  close-ups of her face (blinks, lip-sync) in the real mp4; keep the counter off faces; keep icons abstract.
- Don't: draw eyes, a mouth or any face in the hood (only darkness and a few drifting particles); add a third
  character in any form (no human silhouettes in icons or holograms); redraw the characters in another style; put a
  caption over a card or a face; use the obvious advice list; make financial, medical or legal claims; post anything.

## 12. Code recipe
```bash
SK=~/.claude/skills/explainer-guardian-dialogue
# 1) a new episode project (template + plate). The series voice anchors (.wav) are not included in this repository:
#    after `bash make_episode.sh script`, run tools/voice_qwen.py --skip-lines once (Qwen venv) for anchor candidates;
#    the pick step keeps the most typical one as vo/anchors/<who>_anchor.wav.
bash $SK/assets/tools/new_episode.sh "samples/guardian-<topic>"
cd "samples/guardian-<topic>"
# 2) write episode.json (EPISODE_GUIDE.md: roles question/intro/openloop/rule/rehook/aside/payoff/echo/final)
# 3) everything, step by step or all at once (voice and render go through the shared render lock)
bash make_episode.sh            # = script voice pick join align timeline score render qa
bash make_episode.sh timeline   # any single step, e.g. after editing a shot preset
```
- **Steps and files** (all in `tools/`):
  - `episode.py` episode.json → `vo/script.json` (ids, gaps, shot grammar, rule-one break and push-in, accents).
  - `voice_qwen.py` Qwen3-TTS 1.7B VoiceDesign, 3 seeds per line (`venvs/qwen`, `HF_HOME=tts-bench\hf`,
    8 threads, RTF ≈ 5–10 on this CPU: ~25–40 min for 19 lines × 3 seeds). Instruct = the character description +
    the line's delivery.
  - `pick_takes.py` (`venvs/chatterbox`): faster-whisper `small.en` must hear every word; among passing takes the
    highest VoiceEncoder cosine to `vo/anchors/<who>_anchor.wav` wins → `vo/lines/`. New episodes keep the series
    anchors when you have them, so the voices stay the same (the anchor .wav files are not included in this
    repository; make them once as in step 1).
  - `join_vo.py`: trim by energy, cap internal pauses at 0.28 s, tempo (G 1.07 via ffmpeg atempo), level each line,
    lay out with the gaps → `vo/audio/vo.wav`. `align_vo.py`: faster-whisper `small` word times → `vo/data/vo.json`.
  - `timeline.py` (shot presets `P`, the rule-shot cycle, cards, counter, captions, question, NOW, end card, the clock
    schedule, voice envelopes + pulses, acting events) → `assets/lib/film-data.js`, `compositions/world.html`,
    `index.html`, `out/<name>.srt`, `score/data/cues.json`.
  - `score.py` → `score/audio/final.wav` (−14 LUFS) + `score/data/levels.json`.
  - render: `explainer-styles/tools/render_locked.sh <proj> out/<name>.master.mp4 delivery` (≈ 3.6 min for 88 s on the
    iGPU), then x264 CRF 20 → `out/<name>.mp4` (≈ 55 MB).
  - QA: engine `analyze_video.py`, `qa_sheets.py all` (2 fps sweep, faces at her lines and blinks, the hood opening,
    YAVG), `whisper_check.py`, `layout_check.py`, `make_cover.py` (wide two-shot + the question).
- **Renderer** (`assets/lib/`): `guardian-gl.js` (WebGL2: bg pass with sky/rings/void and the clock hands; particles;
  characters pass with warps, lids, mouth, line glow, parapet; 3-level bloom; final grade), `guardian-overlay.js`
  (cards, 16 icons, counter, captions, question, NOW, end card), `guardian-film.js` (per-frame state from the data).
- **Re-cutting the plate** (new key art of the same two characters): `tools/plate_build.py` — edit the polygons
  (`G_OUTER/G_INNER/L_OUTER/L_INNER`, `REGIONS`), the eye polylines and the mouth curve in `LANDMARKS` (measure them on
  7× grid crops), then check `plate/masks_preview.jpg` and a closed-eye crop before anything else.
- **Gotchas met on the sample**:
  - `HF_HUB_OFFLINE=1` breaks Qwen's processor load (it calls `model_info`); leave it unset (weights are cached).
  - VoiceDesign leaves 0.6–1.9 s pauses at full stops and ellipses: the first join ran 105 s; pause capping + tempo
    1.07 + tighter gaps brought it to 87.8 s.
  - Whisper hears "10,000" for "ten thousand": normalise "N,000" before comparing.
  - A dense bed under a quiet line flips words ("you're becoming" → "you'll be coming"): level the lines, keep ticks
    at −28 dB and the whirr low (240–1100 Hz), and hush the bed before the last word.
  - Silero VAD drops a lone final word after a short exchange; `whisper_check.py` transcribes the speech span without VAD.
  - `np.convolve` with a 12 000-tap box over 4 M samples takes minutes: use `scipy.ndimage.uniform_filter1d`.
  - The counter sat on her forehead in GIRL_MCU and on the hood opening in HANDS: hide or move it per shot; the layout
    checker finds these from the data in a second.
  - The closed-lid fill must blend into the original over ~4 px outside the eye hole, or the lid shows a seam.
  - The painted vertical clock hand must be erased from `bg.jpg`, or the code hands double.
  - `hyperframes check` flags `dead_stretch` (it watches the DOM, and everything here is drawn on canvases) and an
    unreadable audio source when ffprobe is not on PATH (`render_locked.sh` adds it); lint, runtime and layout pass.
  - Qwen runs at RTF 5 on an idle CPU and 17–27 when other agents load the machine: budget the voice step accordingly.
- **Verified template run**: the template's example `episode.json` ("Five Steps to Brave", 5 rules, 1 seed per line)
  went through every step of `make_episode.sh` unchanged: 55.4 s, 17 shots, 5 cards, layout 0 violations, Whisper
  100 %, voice 20.5 dB over the bed, −14.3 LUFS in `final.m4a` but −15.0 LUFS / −1.5 dBTP in the rendered mp4 (the
  render's audio pass took 0.7 LU off that one; the main sample matched to 0.0): always measure the mp4 itself
  (`samples/guardian-ten-years/scratch/template_test/guardian-brave/`).

## 13. QA gates (fix or explain each miss)
- Length 70–90 s; first word ≤ 0.4 s; frame 0 = the girl + the question.
- −14 ±1 LUFS, TP ≤ −1 dBTP, voice ≥ 10 dB over the bed (`score/data/levels.json`, ebur128 on the mp4).
- Whisper: every word (`out/qa/whisper.json`); every take passed `small.en` at pick time.
- Open loop ≤ 15 %, re-hook 40–50 %, payoff 75–85 % (from `vo/data/vo.json`).
- Pictures: the 2 fps sweeps (`out/qa/sweep_2fps_*.jpg`), her face at her three lines and at every blink
  (`faces_lines.jpg`, `faces_blinks.jpg`), the hood opening faceless (`hood.jpg`), no warp tearing at layer edges (crop
  the hood edge and the ponytail across a nod), `layout_check.py` 0 violations, YAVG 0 unplanned dips.
- Files: `EPISODE_GUIDE.md` · `assets/plate/` (layers, region maps, landmarks, key art) · `assets/voices/` (VoiceDesign
  descriptions, the sample's picks; the anchor .wav files are not included) · `assets/template/` (runnable: `make_episode.sh`, tools, renderer,
  example `episode.json` "Five Steps to Brave") · `assets/tools/new_episode.sh` · `assets/sample/` (the
  "Ten Rules for Ten Years" source: tools, renderer, script, aligned words, score cues and levels; the picked voice
  lines (.wav), SRT, cover and QA sheets are not included, so to rebuild it copy `assets/plate/*` into `sample/plate/`
  and run `make_episode.sh` from `voice` after making the anchors as in step 1).
