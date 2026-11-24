---
name: explainer-dark-parable
description: "Makes a vertical 9:16 'X, explained in 88 seconds' psychology parable reel (80-95 s) in the format of a viral Instagram explainer (@unkindtruth_, 'Trauma Bonding, Explained in 88 Seconds', 336k likes): a minimal flat 2D parable on near-black (#0e0e0f) with a faint perspective floor grid, ONE caption word at a time in the centre (white bold grotesk, fading in from grey), a muted palette (maroon robe, dusty rose victim, pale line-art crowds, cream feathers) with ONE glowing gold accent object that carries the idea, slow camera pushes and scale cuts (a giant hand from above, a giant robe, a low-angle power figure with a grey halo), a deep calm male narrator. Beat map: the parable told in the past tense (~60 %), a power line from the antagonist, the concept named in one line, the mechanism in plain words, a modern turn (three everyday settings), and a one-line moral over a callback image of the opening object. Built in code with HyperFrames + a Canvas2D shot player (seek-safe), Kokoro voice, a synthesized dark-ambient bed + SFX, and two mixes (full + no-music). Use for 'explained in 60/88 seconds' psychology or philosophy reels, 'parable explainer', 'dark minimal story explainer', 'unkindtruth style', 'one-word captions on black', 'king and chicken style story', fables that teach a bias, a defence mechanism or a social effect (learned helplessness, trauma bonding, sunk cost, the frog in boiling water, the crab bucket, the boy who cried wolf). Builds on explainer-engine (TTS, QA) and hyperframes."
---
# Dark parable — one old story, one named concept, one gold object (≈ 88 s)

Reverse-engineered frame by frame from one Instagram reel: **@unkindtruth_ `DfHxCPwTzrp`**, "Trauma Bonding, Explained in
88 Seconds", 88.4 s, 336,213 likes, 4,766 comments. Sources and what was measured are in `references/sources.md`; the
analysis is below (§A). Sample built with this skill:
`the sample film (the render is not included in this repository)`, "The Rope" (90.1 s). It covers
learned helplessness through the public-domain elephant-and-stake parable, and every claim is sourced in its `SAMPLE.md`.
Batch 9 added two more, both at 5 scene changes (≈ 3.3/min, the source's 3.39) thanks to planned colour fields and the
pre-render probe (§12): `samples/parable-emperor` ("The Cloth", pluralistic ignorance, Andersen 1837; the gold accent is a
dashed robe outline that is not there) and `samples/parable-horse` ("Maybe", the impact bias, *Huainanzi* ch. 18; a rigged
gold horse that becomes a chess knight). Neither of these two projects is included in this repository.

**Original work only.** Never reuse the source's script, king, chicken, corn or ministers. Bring a new parable (public
domain: Aesop, folk tales, Zen koans, Panchatantra, Jataka; or your own), a new antagonist silhouette and a new gold object.

## 1. Signature traits
- **Near-black stage**: bg `#0e0e0f`, 78–82 % of every frame is black. A faint one-point **perspective floor grid**
  (`#1d1d20`) and faint architecture lines (hall pillars in the source; camp posts and tents in ours) give depth.
- **One word at a time**, centred, white bold grotesk, no box; each word fades in from grey and is held until the next.
- **Flat 2D line art**: thin off-white outlines (`#e8e2d6`, 2.6 px at 1080) on muted fills. People are either filled
  (the antagonist: maroon robe, tan head with no face) or pure line art (crowds, modern figures, round heads with two dot eyes).
- **One glowing accent object** (the source's gold corn) carries the idea from the parable into the modern turn. In ours it is a gold rope:
  - it ties the elephant;
  - it then appears on the dog's leg, the kid's wrist and the worker's ankle;
  - it becomes the lamp of "control".
- **Scale cuts** every ~20 s: a giant hand from above, a giant robe filling the frame with the victim tiny, a low-angle power
  figure with a soft grey **halo** behind the head, a giant navy-suited modern figure.
- **The antagonist drains to black** when the concept is named (the robe fades to a silhouette while the victim keeps its colour).
- **Callback ending**: the last image answers the first (a mountain of feathers with one corn on top in the source; the loose stake
  and the gold rope trailing after the elephant walking away in ours).

## 2. Measured metrics (source → sample → gate)
Source: the engine analyzer's metrics + rea stems (not included). Sample: the owner's render-2 QA (not included).

| metric | source | sample (final) | gate |
|---|---|---|---|
| duration | 88.4 s | 90.13 s (+2.0 %) | ±15 % |
| WPM overall | 153.4 (226 words; ~165 while speaking) | 143.1 (−6.7 %; 177 while speaking) | ±20 % |
| hard cuts / min (analyzer) | 0.0 (≈ 28 real shot changes; the dark frames keep ffmpeg's scene score < 0.33) | 1.33 (27 real shot changes, 2 detected) | explained (see §2.1) |
| scene changes / min | 3.39 (median scene 12.4 s) | 1.33 (−61 %, explained miss, §2.1) | ±20 % or explained |
| motion mean · p90 | 3.44 · 9.14 (hold 15 %) | 1.41 · 2.07 (hold 41 %) | — |
| brightness · colourfulness | 0.105 · 15.1 (98.9 % dark frames) | 0.094 · 9.7 | dark film, ±30 % |
| palette | `#0b0b0b` 78 %, maroon `#4c1b1e` 7.6 %, beige `#b79e8e` 5.6 %, navy `#202732` 2 % | `#0c0c0c` 81 %, rose `#a3837c` 6.5 %, maroon `#503331` 1.6 % | — |
| loudness | −14.5 LUFS | −14.4 LUFS, TP −1.8 (no-music −14.5) | −14 ±1, TP ≤ −1 |
| voice | one deep male, f0 101 Hz (p10/p90 75/144), dry | `am_onyx,am_michael` 1.05 | — |
| music | none (music stem −61 dB = separation residue) | an original dark-ambient bed, 22 dB under the voice | ≥ 10 dB voice over bed |
| first word | 0.0 s | 0.18 s | ≤ 0.4 s |

### 2.1 Why the cut metrics look odd
- The analyzer reports **0 hard cuts** for the source although it has ~28 shot changes.
  - The cause: on a 78 %-black frame, ffmpeg's scene score stays below 0.33 even at a hard cut. The same is true of ours.
  - So keep the black ground and the muted fills, and cut freely.
  - Use 0.4–0.6 s cross-dissolves in 4–6 places, where the source dissolves (into the wide, at the concept, back to the object).
- **Scene changes** (a histogram distance ≥ 0.28 between frames 1 s apart) only fire when a **large colour field** comes or goes:
  - the source's giant maroon robe, the king close-up, the navy suit;
  - ours: the giant elephant, the giant maroon trainer, the navy boss.
  - Plan 5–6 such "big colour" moments in 88 s, or the scene rate falls to ~1.3/min (our render 1).

## 3. Beat map (% of runtime) and script formula
| % | beat | source (shape only) | sample (The Rope) |
|---|---|---|---|
| 0–5 | **Hook**: the antagonist does one shocking physical act; a giant hand from above in frame 1 | the antagonist seizes a small, helpless animal before an audience | a trainer ties a baby elephant to a stake with a thin rope |
| 5–20 | **The victim fights**: 3–4 two-word sentences, then the crowd says nothing | the victim struggles; the crowd stays silent | she pulled, cried, pulled until her leg ached; the camp watched, nobody helped |
| 20–30 | **The low point**: alone, tiny in the dark | the victim is left alone and small | day after day the rope won; one morning she stopped pulling |
| 30–55 | **The strange turn**: the antagonist does the second, quieter thing; the victim's response; a scale cut | a small gift from the antagonist; the victim follows him | she grows to three tons, strong enough to push a tree, still beside the same small stake; one step would free her; she never takes it |
| 55–60 | **The power line** (low angle, halo) | a one-line power claim from the antagonist | "I don't hold her. Her memory does." |
| 60–66 | **Named**: the concept gets its real name in one line. The antagonist drains to black | Trauma bonding | Learned helplessness (at 49 %: our evidence beat needs room) |
| 66–88 | **Mechanism in plain words** (2–4 lines, one picture each), with **evidence** as an upgrade | the mechanism in two or three plain steps (loss, a small return, attachment to the giver) | Seligman & Maier 1967: inescapable shock, the shuttle-box barrier, most did not try; "nothing I do matters" |
| 88–94 | **Modern turn**: 3 places on 3 words, then 1–2 people | three settings, from private to national | classrooms, work, home; the kid who stopped raising her hand; the worker who stopped speaking up |
| 94–100 | **Moral + callback image** (one line, slower) | a one-line moral warning against gratitude to the abuser | the 2016 twist (default passivity, learned control), then "So before you stop pulling, look at the stake. It's smaller than you remember." |

- **210–230 words**, 26–30 lines. The parable is in the past tense, third person; the modern turn is in the second person. Sentences
  of 2–12 words; triplets of two-word sentences in the struggle.
- **Facts**: the named concept must be the real term for the mechanism shown. Cite the study by name and year on screen (our
  upgrade, a dim mono tag), and keep every number defensible (SAMPLE.md lists the sources). If the classic finding was later
  revised (as learned helplessness was in 2016), say so; it makes a strong twist.
- **Voice**: one deep, calm male narrator: Kokoro `am_onyx,am_michael` at 1.05 (≈ 177 WPM while speaking, 143 overall), with
  gaps of 0.3–0.6 s and 0.6–0.9 s before the big turns. Slow the last line to 0.97.

## 4. Visual system
| role | hex | notes |
|---|---|---|
| ground | `#0e0e0f` | + grid `#1d1d20` (1.6 px) from a vanishing point, horizon at 55–75 % |
| far architecture | `#18181a` | posts, arches, tents; 3 px; alpha 0.5–1 |
| line | `#e8e2d6` | every outline, 2.6 px; dim line `#8d8a84` for secondary figures |
| antagonist | robe `#4e1a20` (dark `#2a0e12`), skin `#b8826a`, cuff `#d9cfbf`, hat/crown `#8b9096` | head has no face; halo `rgba(200,200,205,.13)` |
| victim | dusty rose `#a9857d` (dark `#8b6b66`, ear `#9a7871`) | the source's plucked-chicken pink `#c48a7c` family |
| accent | gold `#f2b630`, highlight `#ffd76a`, glow blur 14–22 | the ONE glowing object |
| modern power | navy suit `#1f293b`, shoes `#3a2a24` | giant, cropped by the frame |
| props | wood `#6e4b35`, cream `#d8ccb4` | |

- **Safe area**: the caption sits at y 885 (46 %); keep eyes and faces out of the band y 840–930 near the centre. Frame faces
  either above 800 or below 1000. Tags (mono, 30–34 px, `#97928a`) sit at y 360. Nothing sits in the bottom 15 % except
  ground and feet.
- **Composition**: subjects sit low (the ground line at 70–85 %); the top 40 % is often empty black (the source does this too).
  Scale cuts break that rule on purpose.

## 5. Shot grammar and transitions
- 25–30 shots in ~88 s (median 3 s). The order of shot types:
  1. hand from above (frame 1) → dissolve to a symmetric one-point wide (the court / the camp, crowds in rows on both sides);
  2. medium on the victim's struggle → a close insert on the object (corn / stake) → the crowd row (busts with dot eyes, a slow pan);
  3. a tiny-in-the-dark wide → a scale cut (giant) → a tilt down the giant to the tiny object;
  4. a two-shot (the outsider and the antagonist) → low angle with a halo (the power line);
  5. the concept beat (the antagonist drains to black) → 3–4 mechanism shots → 3 flash vignettes on 3 words → 2 modern people;
  6. back to the object (push in) → the callback image.
- Hard cuts on the beat word (the cut lands 0.1–0.25 s before the line). Use cross-dissolves of 0.35–0.6 s into the wide, into the concept beat, into the modern turn and back to the object.
- No whip pans, no shakes, no colour flashes.

## 6. Motion grammar
- Every shot pushes slowly: scale 1 → 1.03–1.08 per second about a fixed point (`D.push(c, fx, fy, 1 + lt*k)` with k
  0.024–0.085). Tilt down to reveal scale (ease in-out cubic over 2–3 s).
- Character motion is small and readable:
  - the victim's tug cycle (0.8 Hz), with dust puffs at the feet on every tug;
  - a raised trunk on a cry, an eye that closes;
  - the falling tree, the walk-away.
- Ambient life: 40 slow dust motes drifting upward (alpha 0.1–0.26), drawn after every shot (our upgrade; the source has
  falling feathers for the same job).

## 7. Caption system
- ONE word at a time (punctuation stays on the word: "stake.", "pulling."). Inter 700, 44 px, `#f3f1ec`, letter-spacing −0.3 px,
  `text-shadow: 0 2px 8px rgba(0,0,0,.85)`; centred at y 885 (46 %).
- On at word start − 0.03 s, fading from opacity 0.32 to 1 in 0.16 s (the grey→white look of the source). It holds until the
  next word (max 1.6 s; the last word holds 1.4 s past its end).
- `tools/build.py` writes the whole caption track from `vo/data/vo.json` (215 clips for 215 words).
- The SRT beside the render uses ≤ 7-word phrases (for WPM and accessibility).

## 8. Sound
- The source is **voice only**: a dry, deep narration, gaps at −60 to −66 dB, no bed. Ours adds:
  - **Bed** (music; dropped in `nomusic.m4a`), 22 dB under the voice: a slow pad in F minor at 95.7 BPM (the rea tempo/2), i–VI–III–VII
    every 2 bars; felt-piano notes on beats 1 and 3; colder and thinner during the evidence beat; a lift toward the major chord for
    the twist; resolving to A-flat major on the last line. Sub thumps sit on the scale cuts.
  - **SFX** (in both mixes), about 12 dB under the voice:
    - stake knocks, rope creaks on every tug, a soft synthesized call on "cried";
    - day whooshes, footstep thuds, the tree creak, crack and fall;
    - a low boom on the concept, a 6 Hz buzz flicker under the experiment, a jump whoosh;
    - gold shimmers whenever the rope motif appears, a bubble pop, ticks while the year rolls;
    - a warm chime for "control", and the stake pop with dust.
- `tools/sound_design.py` + `tools/audio_kit.py` (numpy/scipy only). Two-pass loudnorm to −14 LUFS with TP −2 (AAC adds
  ~0.3 dB). It writes `assets/audio/final.m4a` and `nomusic.m4a`; `tools/deliver.sh` remuxes the no-music file (`-c:v copy`), it never re-renders.
- Library suggestion (POST.md): search the in-app library for "dark ambient piano", "sad cinematic piano" or
  "melancholy drone", at 60–80 or ~96 BPM, without drums.

## 9. Retention devices
- Frame 1 is a still that already tells the story (the hand, the object, the victim); the first word lands ≤ 0.2 s.
- Every ~20 s there is a scale cut or a colour drain; the gold object reappears in each act, so the viewer tracks it.
- The concept is named at 50–66 %, never in the first half of the parable.
- The callback image rewards a rewatch (the object from frame 1, changed). The modern turn names three places in three words.
- No pause is longer than 1 s; the longest gaps carry a riser or a boom.

## 10. Do / don't
- **Do**: one accent colour only; keep every face out of the caption band; a public-domain or original parable; the real
  psychological term; cite the study on screen; keep the antagonist faceless; make the victim's eye carry the emotion.
- **Don't**: gore (the source plucks a live chicken; keep cruelty off-screen or abstract); real people or brands; preachy
  hashtags; bright backgrounds; more than one word on screen; music that swells under the parable (the bed stays far down).

## 11. Code recipe
```bash
cp -r ~/.claude/skills/explainer-dark-parable/assets/template my-parable && cd my-parable   # runnable 3-shot demo
cp ~/.claude/skills/explainer-dark-parable/tools/*.py ~/.claude/skills/explainer-dark-parable/tools/*.sh tools/
# 1) vo/script.json: lines {id, text, gap, speed}; voice "am_onyx,am_michael", speed 1.05
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "engine/audio/tts.py" vo
python -I tools/build.py                       # vo-data.js, captions.html (1 word/clip), world.html, index.html, SRT, timing
# 2) assets/lib/film.js: window.DP_FILM(K, V) -> {shots:[{t0, xf, draw(c, lt, u, t)}], T}; anchor t0 on V.L(id)/V.w(id, word)
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/sound_design.py     # edit the SFX list per film
npx -y hyperframes@0.8.210 check --json
bash "tools/with_render_lock.sh" python -I tools/snap.py scratch/snap <t1,t2,...>   # one still per shot
bash "tools/render_locked.sh" "$PWD" scratch/master.mp4 delivery
bash "tools/with_render_lock.sh" bash tools/deliver.sh scratch/master.mp4   # both mp4s + QA
```
- **Kit API** (`assets/template/assets/lib/kit.js`):
  - `DP.create({canvas,width,height})` → `K` with `play(shots)`, `render(t)` (cross-dissolves via an offscreen canvas, dust motes),
    `K.D` drawing helpers, `K.P` palette, `K.E` eases, `ramp(t,a,b,ease)`, `rng(seed)`.
  - `D.grid(c, horizonY, vanishX, alpha)`, `D.camp(c, horizonY, alpha)`, `D.push(c, fx, fy, s)`, `D.cam(c, x, y, s)`.
  - `D.elephant(c, {x, y, s, f, baby, lean, trunk, head, leg, ear, eye: open|closed|sad|wide, fill})` → `{ankle, back, head, hr}`.
  - `D.trainer(c, {x, y, s, f, view: front|profile, halo, arm, smile, coat, hat, skin})`.
  - `D.person(c, {x, y, s, f, pose: stand|bust|kneel|sit, slump, arm, pack, stick, wrap, look, col})`.
  - `D.stake`, `D.rope(c, ax, ay, bx, by, {sag, taut, w, blur})` (the gold glow), `D.handDown`, `D.handUp`, `D.dog(c, {pose: lie|stand})`, `D.radial` (halo).
- Film-local props in the sample's `film.js`: `tree`, `dust`, `scuffs`, `label` (the mono source tag), `box` (shuttle box),
  `desk`, `bigFoot` (giant legs + belly), `headProfile`, `boss` (giant navy figure).
- **Preview without the lock** (fast iteration):
  1. The template has `scratch/preview.html` + `scratch/inline.py` (copies are in `tools/`). Run `python -I scratch/inline.py scratch/preview.html scratch/preview_inline.html`;
  2. open it in the Browser pane;
  3. run `sheet([t1, t2, t3])` with javascript_tool;
  4. screenshot.
  Each `navigate` to a file opens a new tab, so pass the returned tabId on every call. Other agents share the pane.
- Render cost (Intel iGPU, 2 workers): about 3 min for 90 s, because Canvas2D is cheap.

## 12. Gotchas
- **Expose every helper on K.** `film.js` destructures `{D, P, E, ...} = K`. A missing `D` threw at the first draw, and the
  preview went black.
- **Shell `sed` with `\n` inside a JS string literal** inserts a real newline and breaks the script. Patch with a Python file instead.
- **A word lookup that misses throws.** `V.w(id, "word")` matches a prefix after stripping punctuation and apostrophes, so
  `didn't` → `didnt`.
- **A tiny subject reads as empty.** At 0.4 scale, a 1080-wide wide shot looks empty. Push in (1.15–1.3) on every medium shot,
  and keep the victim ≥ 25 % of the frame width.
- **Keep the falling object in frame.** A tree rotating 1.2 rad left the frame before its word. Cap the rotation at about 0.6–0.7 rad.
- **Watch the sitting/standing heights against the caption band** after every change of scale.
- **Low motion and few scene changes.**
  - Render 1 measured motion 1.07 (source 3.44) and 1.33 scene changes/min (source 3.39).
  - Render 2 added push rates ×2.4, a faster crowd pan, dust at the feet, a giant maroon trainer, a navy boss and warmer
    victim fills. That raised motion to 1.41 and colourfulness 6.2 → 9.7, but scene changes stayed at 1.33.
  - The lesson: plan 2–3 shots where one colour field (the robe) covers ≥ 70 % of the frame for over 1 s, as the source
    does at 27 s and 55 s. Animate more inside shots (walks, falling objects) rather than pushing harder.
- **The Browser pane is shared with other agents.** Navigating to a file opens a new tab; read `tabs_context` and pass that
  tabId to every `javascript_tool` and `computer` call. A screenshot without a tabId once captured another agent's page.
- **Don't `cat > file` in a chain without a heredoc**: it waits on stdin and stalls the shell. Write the script with the Write tool.
- **Probe the scene-change rate before rendering** (batch 9, The Cloth / Maybe): `python -X utf8 -I tools/edge_preview.py probe`
  draws the canvas film in headless Edge and applies the analyzer's rule (64-bin histograms of 160×90 frames at 6 fps;
  distance between frames 1 s apart ≥ 0.28; peaks ≥ 1.5 s apart). It takes about 10 s; `sheet t1,t2,… out.png` gives
  labelled stills and `times` gives mid-shot times for `snap.py`. Use it when the Browser pane is hidden (its screenshots
  time out) or busy. Both batch-9 films probed at 5 events with a margin of ≥ 0.1 over the threshold, and the analyzer on the final mp4s
  agreed exactly (3.34 and 3.30/min against the source's 3.39).
- **Which colours count.** The histogram bins at 64-level steps, so any colour with all channels < 64 lands in the black
  bin: a navy suit (`#1f293b`) never fires a scene change, however big. A field fires only when one channel is ≥ 64 (maroon
  R 78, slate-blue B 80, cream, rose), and it must cover about 45 % or more of the frame. Use this both ways: make the
  giant robe or banner fire, and keep a big modern screen (`#252e3b`) dark enough not to.
- **A field that lasts < 1.5 s counts once** (the 1.5 s peak gap). Arrival plus departure = 2 events only if they are ≥ 1.5 s apart.
- **Arms in a front view:** `rotate(-sx * a)` spreads them; `rotate(sx * a)` crosses them over the chest.
- **Keep loud SFX off the word they illustrate.** A crowd cheer placed on "cheered" made Whisper hear "cheer" (line
  recall 0.83, a gate fail); starting the swell at the word's end fixed it (an audio-only change: re-run sound_design.py and deliver.sh).
- **White captions over cream fields** (an undershirt, a cream horse at low angle) lose contrast: dim the figure as if
  back-lit, or move it off-centre, and dim the neighbouring shot the same way so the cut does not add a scene change.
- **`pad_note` crashed** when the last chord started less than 1.2 s before the end (attack longer than the note). It now
  caps the attack and release at 40 % of the note. Sum SFX arrays of different lengths with a padded helper, not `+`.

## 13. Files
`references/sources.md` · `tools/` (build.py, sound_design.py, audio_kit.py, snap.py, qa.py, qa_config.json, whisper_check.py,
deliver.sh, qa_all.sh, cover.py, world_frame.py (a caption-free frame for the cover), inline.py, preview.html, edge_preview.py
(headless-Edge stills + the pre-render scene-change probe); analysis helpers:
sheet.py (contact sheets), grab.py (full-size grabs), stems.py (rea stem levels), gaps.py (pause levels), pitch.py (narrator f0)) · `assets/template/` (a runnable 3-shot, 12 s demo) ·
`assets/sample/` (the full "The Rope" sources: film.js, kit.js, script.json, SCRIPT.md).

## Appendix A — source analysis (`DfHxCPwTzrp`)
Measured with the engine analyzer (metrics, Whisper), rea (stems, BPM 191.4 / 95.7, F major), a 2 fps sweep (177 frames)
and full-size frames of key moments. Spoken lines are described, not quoted.

| t (s) | beat | picture |
|---|---|---|
| 0.0–2.0 | hook | a giant tan fist in a maroon sleeve with a cream cuff holds a cream chicken by the legs, upside down, on black; a perspective floor grid |
| 2.0–4.3 | wide (dissolve) | the hall in one-point perspective: pillars and an arch, courtiers in white line art in rows on both sides, the king (maroon robe, grey crown) in the centre |
| 4.3–9.0 | plucking | close-up: the second hand pulls feathers; they fall and pile up on the floor |
| 9–14 | struggle | a wider shot of the hanging chicken, the feathers swirling, the pile growing |
| 14–16.5 | silence | a horizontal row of line-art busts (round heads, dot eyes), panning |
| 16.5–24 | dropped | the plucked pink chicken; the hand lets go; it stands by the feather pile |
| 24–27 | tiny | the chicken tiny in the dark, then in the courtier corridor |
| 27–30 | scale | a giant maroon robe fills the frame, the chicken tiny in front; the king's head with a grey halo |
| 30–34 | the turn | the king reaches into his pocket; a hand scatters glowing gold corn |
| 34–52 | following | the chicken eats and follows the king across the hall (profile walk), ending pressed against his boots |
| 52–55 | ministers | a row of line-art ministers (tall hats) behind the king |
| 55–58 | power line | a low angle, the king with a halo, as he speaks the power line |
| 58–62 | named | the robe drains to black; the chicken stays pink; the concept is named (trauma bonding) |
| 62–72 | mechanism | a line-art stick figure loses a house, coins and feathers (three kinds of loss); a hand drops one corn; the figure kneels |
| 72–77 | modern power | a giant navy-suited man (huge legs), the crown's shadow behind him; the figure clings to his leg |
| 77–82.5 | places | homes (a house outline, a tall blue figure and a bent one), offices (an auditorium of heads), countries (a domed capitol on a skyline) |
| 82.5–86 | moral | a navy-cuffed hand holds the glowing corn in its palm |
| 86–88.4 | callback | a mountain of cream feathers with one gold corn on top; a feather falls |

- **Numbers**:
  - 88.4 s, 720×1280, 30 fps. The analyzer finds 0 hard cuts (≈ 28 real shot changes, 2 of them dissolves).
  - Scene changes 3.39/min. Motion 3.44, hold 15 %. Brightness 0.105, colourfulness 15.1.
  - 226 words, 153 WPM. Voice f0 101 Hz. −14.5 LUFS; silence 5.7 s in total.
- **Caption**: one word, ~29 px bold (Helvetica/Inter-like), white, centred at 46 % (y 590 of 1280). Short words are caught
  mid-fade in grey at 2 fps. The last word holds through the pauses.
- **What we keep / change**:
  - Kept: the beat map, the one-word captions, the palette roles, the scale cuts, the halo, the drain to black, the callback ending and the voice register.
  - Changed:
    - a new parable, topic and characters;
    - the evidence beat with on-screen citations (a visible upgrade);
    - the accent object travels into the modern turn;
    - dust motes;
    - a synthesized bed plus SFX (the source is voice only) and a no-music mix.
