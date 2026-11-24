---
name: explainer-kinetic-word-edit
description: "Makes a vertical 9:16 kinetic word edit (35-40 s) in the format of a viral Instagram lyric edit (@themotionaddict_, 311k likes), rebuilt on ORIGINAL words: a spoken-word poem (Kokoro) or on-screen words over an original code-made beat. Six scenes chained without a single hard cut: an underwater title (focus pull, tone-on-tone condensed serif behind a sinking faceless figure, god rays, bubbles); huge glowing 3D type that swings in like a door through a light burst, one word per beat, the next word ghosted grey before it lights; a stretched vowel (SLOOOOW) that grows letter by letter while the camera whips and the trail falls into the dark; a top-down desk collage (painted planks, window-blind light, a torn spiral sheet with typed lines and a highlighter that sweeps the spoken line, taped polaroids with code-painted scenes, a ticket, a mug, a pen); fire-lit outline words that ignite on their syllables and burn back to the desk; a crumpled note (a real mesh) that drops in, unfolds and writes itself in marker; and a whip into black where a giant speckled question mark is revealed by a pull-back, the closing question's words orbit it (one in red neon), then a slow fade. Built in code with HyperFrames + three.js (bloom, defocus, velocity motion blur, grade, grain), all imagery drawn on canvases, a synthesized minor-key ballad beat with a phase-vocoded stretched vowel, two mixes (full + no-music). Use for 'lyric edit', 'kinetic lyric video', 'kinetic typography reel', 'spoken word video', 'poem reel', 'aesthetic text edit', 'themotionaddict style', 'underwater title + 3D text + desk collage + fire text + question mark', 'motion addict edit', or any song-or-poem-driven word edit where every spoken word appears on screen. Never with a commercial song's lyrics, audio, album art or artist photos. Builds on explainer-engine (Kokoro TTS, analyzer) and hyperframes."
---
# Kinetic word edit — six worlds, every word on screen, no hard cuts

Reverse-engineered frame by frame from one Instagram reel (**@themotionaddict_**, `DfMKeK6iPDN`, 37.1 s, 1:1, 311k likes;
`references/sources.md`). The source is a lyric edit of a commercial song with the artist's album art and photos: **none
of that is reused, and the song's words are not written anywhere in this skill**. What is kept is the edit grammar: the
scene chain, the way each word enters, the transitions, the beat-matched timing and the closing question. The words
come from an original spoken-word poem.

Sample: `the sample film (the render is not included in this repository)` — "Undertow"
(37.2 s, 9:16; `_nomusic.mp4` beside it; SCRIPT.md, SAMPLE.md, POST.md, out/qa/; the sample project is not included).

## 1. Signature traits
- **One continuous edit**: six visual worlds chained by focus pulls, whips, flashes, burns and crossfades. The analyzer
  finds **0 hard cuts**; the pace comes from words landing on beats (one every 0.3–0.6 s in the type scenes).
- **Every sung/spoken word is on screen**, each time in a different material: tone-on-tone title in the water, glowing
  3D letters, a highlighter on typed paper, fire, marker on a crumpled note, white type around a question mark.
- **Ghost-then-light**: the next word sits grey and dim ~0.3–0.4 s before its syllable, then lights (a read-ahead).
- **A stretched vowel**: the last word of the type section grows letters (ours: SLOOOOW) while the camera follows
  and whips; the trail of letters falls into black and is still visible over the first frames of the next scene.
- **A desk collage with a light source**: top-down, window-blind shadow bands across everything, soft drop shadows,
  tape, a sheet whose ONE highlighted line is what is being sung/spoken.
- **Fire-lit outline words** over the dimmed desk, then a flare that burns back to the bright desk.
- **A closing yes/no question** built around a giant question mark in black space with dust; one word in red neon;
  a ~5 s slow fade while the music plays on.

## 2. Measured metrics (engine analyzer)
Source: the engine analyzer's metrics (not included). Sample: the owner's QA `metrics.json` / `gates.json` (not included).

| metric | source | sample | gate |
|---|---|---|---|
| duration | 37.14 s (1:1) | 37.2 s (9:16) | ±15 % |
| hard cuts / min | 0.0 | 0.0 | ±20 % |
| scene changes / min | 9.69 (6 events: 7.0, 10.7, 16.8, 19.2, 20.8, 26.2 s) | 9.68 (6 events: 3.2, 10.5, 12.0, 16.0, 19.7, 27.0 s) | ±20 % |
| words / min | Whisper 11.3 (sung; it hears 7 words) — on-screen kinetic words ≈ 31 → **≈ 50** | 54.8 (34 spoken words, +10 %) | ±20 % of the on-screen rate |
| motion mean | 13.98 | 11.72 | — |
| brightness · colourfulness | 0.415 · 29.2 | 0.372 · 29.4 | — |
| loudness | −14.1 LUFS | −14.3 LUFS, TP −1.3 dBTP (no-music twin −13.8 / −1.3) | −14 ±1, ≤ −1 dBTP |
| voice over music · over music+SFX | (sung) | 14.0 dB · 10.6 dB | ≥ 10 dB |
| Whisper small (both mixes) | — | every line heard (recall 1.0) | every line |
| first visual change · first word | frame 0 (focus pull) | frame 0 (focus pull 0.75 s) · 0.56 s | ≤ 0.4 s |

- Measure the source's word rate from what is ON SCREEN, never from Whisper on a song.
- The scene-change rule (64-bin histograms 1 s apart, ≥ 0.28, ≥ 1.5 s apart) is predicted exactly by `tools/scene_est.py`
  on any mp4, and by the same loop in the browser harness before rendering (§12).

## 3. Beat map (% of runtime) and script formula
BPM 99 (source ≈ 99 by librosa). Scene starts sit on beats: b19 = 11.52 s, b27 = 16.36 s, b28 = 16.97 s, b44 = 26.67 s.

| % | source (s) | beat | ours ("Undertow") |
|---|---|---|---|
| 0–10 | 0–3.9 | underwater title: blur → sharp in 0.6 s, condensed serif title behind a sinking figure, surface light at top | "Some nights, / I go under." title SOME NIGHTS / I GO UNDER, figure sinking feet first, arms up |
| 10–24 | 3.9–8.9 | first line swings in from the left through a light burst; one word per beat; next word ghosted | EVERY / WAVE / SAYS / YOUR / NAME (5-line stack), then AND I / SINK / SO replace it |
| 24–31 | 8.9–11.5 | stretched vowel grows; whip right; stack tilts away; letters trail into black | SLOOOOOOW (13 Os, 8.8 → 10.3 s), whip at 10.0, trail falls to the bottom |
| 31–45 | 11.5–16.6 | desk collage, slow drift; the sheet's highlighted line = the sung line | push-in on the sheet; highlighter sweeps "I kept what I never said" word by word |
| 45–53 | 16.6–19.6 | pull back + warm flash; fire outline words ignite on syllables | STILL / ON FIRE / UNDER / WATER (ghosts first) |
| 53–56 | 19.6–20.7 | flare → bright desk returns (the note is already falling) | flare 19.85, burn dissolve to 20.75, crumpled note drops in |
| 56–72 | 20.7–26.6 | crumpled note unfolds, handwriting | note unfolds, push-in, "come up for air" writes itself on the spoken words |
| 72–79 | 26.6–29.4 | last line fades in over the desk, the question mark sweeps in, pull back into black space | "Did I / ever let go?" DID · I · EVER · LET · GO (red neon) |
| 79–100 | 29.4–37.1 | hold, slow orbit, ~5 s fade | hold, orbit ±3°, fade 31.5 → 37.2 |

**Script formula (original words only):** 6–7 short lines, 30–36 words for ~37 s (≈ 50–55 WPM). Line 1 = an image of
going under / inside; line 2 = 4–6 words to stack (one per line); line 3 = 3–5 words ending in a word with a long
vowel to stretch (slow, gone, home, low, go, cold); line 4 = the confession (the highlighted sheet line, 5–7 words);
line 5 = 2–4 words of fire / heat (split one compound word across two lines); line 6 = a note-sized imperative
(3–4 words); line 7 = a yes/no question of 4–6 words whose last word goes red. Voice each phrase as its own TTS line
with `at` on a beat (`vo/script.json`), so phrase onsets land on the grid.

## 4. Visual system (9:16, 1080 × 1920)
| world | palette | type |
|---|---|---|
| underwater | bottom `#020a14` → mid `#092b47` → near surface `#3f8cb3`, surface band `#5c99b3`, rays `#61a8cc`; title tone-on-tone `#3b7fb3` at 78 % | title: Playfair Display 900 squeezed to 58 % width, 2 lines, 300 px |
| 3D type | white → `#cfe5fb` gradient, soft blue glow; ghost `#7f8b99` at 45 % | Inter 600, 250 px, tracking −3.5 %, one word per line, left at x 80 |
| desk | planks `#d6d3cc` with dark seams, paper `#fbfaf6`, highlighter `#f2dc3a` (multiply), blind shadows ×0.66, tape `#d6c4a0` 78 % | sheet: Roboto Mono 500 50 px; polaroid captions Caveat 600; ticket Montserrat |
| fire | ramp black → `#8c1a00` → `#ff6a10` → `#ffd27a`, desk dimmed to 22 % and desaturated | Archivo Black outlines (9 px stroke), 4 lines fitted to 930 px |
| note | paper `#f3f1ea`, marker `#151417` | Permanent Marker 104 px |
| question | black, dust specks, mark `#f3f3f1` speckled; words `#f4f4f2`; one red neon `#ff3346` with glow | Montserrat 700/800 |

- **Safe area**: words between y 380 and 1500 (20–78 %); nothing that must be read below 80 % (Instagram UI) or
  within 6 % of the sides (the Q scene's words drift outward as the camera pushes in: inset them ≥ 45 px).
- **Square → vertical re-composition** (a visible change from the source): the 3-line stack becomes a 5-line stack (one
  word per line); the desk becomes a tall arrangement (sheet top, polaroids middle, ticket bottom); the camera pushes
  into the highlighted line and the note so 9:16 phones can read them.

## 5. Shot grammar and transitions
| from → to | build | when |
|---|---|---|
| open | defocus 9 px → 0 over 0.75 s (ease-out) | frame 0 |
| title → type (same world) | the first word swings in on a left hinge (rotY 1.25 → 0, x −900 px → 80, z +1.6 → 0, outExpo 0.42 s) + burst | first word of line 2 |
| word → word | ghost (45 %) 0.38 s early → lit in 0.08 s with a 7 % scale pop | each syllable |
| stack 1 → stack 2 | old lines fly out toward camera (0.22 s), new centred words rise in | first word of line 3 |
| type → dark | camera follows the growing word, whip 0.32 s in + 0.45 s out (motion blur from camera velocity), water dims to 92 % | stretch end |
| dark → desk | the desk fades up under the trail (additive mix), trail falls and fades by +0.9 s | b19 |
| desk → fire | pull back 2.4 m + warm flash 0.55, fire words slam in at 1.85× → 1 | b27 → b28 |
| fire → desk | flare (heat ×2.3), warm flash 0.42, noise char-dissolve of the letters, desk exposure back | ~0.55 s after the last ignition |
| desk → question | crossfade 1.05 s while the Q camera pulls back from inside the mark (1.5 → 9.5 m, out3) with −22° roll + a 70 px whip blur | b44 |
| end | 5.6 s ease-in-out fade to black, music continues | b52 → end |

## 6. Motion grammar
- Every frame moves: the underwater camera pushes 10 → 9.45 m with ±0.06 m drift and ±0.6° roll; the figure sinks
  0.13 m/s turning ±4°; bubbles rise from the head.
- The desk camera arrives high (+1.2 m) and settles, drifts, pushes in 4.3 m onto the highlighted line, pulls back for
  the fire, then pushes 3.2 m onto the note.
- Motion blur and the focus pull are post effects (`K.post`: `mb` = camera velocity × px/m / 30, `defocus` px).
- Light pulses are events: the burst kicks on each lit word (exp decay 2.2/s); the red neon flickers on at its word.

## 7. Caption system
There are no separate captions: **the kinetic type is the caption**. Every spoken word is shown in one of the worlds.
`out/<slug>.srt` has one cue per spoken phrase (for platforms and the analyzer).

## 8. Sound
| layer | build | level |
|---|---|---|
| beat | 99 BPM Dm–Bb–F–C, one chord per bar: detuned additive pad (LP 1.7 kHz), driven sub per bar, soft kick, finger snaps on 2 & 4, hats in the type section, a bell motif + dotted-8th delay in the desk/question sections | 14 dB under the voice |
| underwater intro | the whole beat low-passed at 380 Hz until the first 3D word, then open | — |
| sections | full on the type, drops out for the whip, soft desk groove, heavy fire bars, half-time question bars, fades with the picture | — |
| SFX | bubbles, swell + hit into the type, whooshes on whips, paper settle, highlighter squeak per word, swell + hit into the fire, ignitions per word + crackle, flare whoosh, note flutter / land / crinkle, marker scribble, whoosh into the question, a low hit on its first word, neon buzz | peaks −4 dB re voice, ducked 7 dB under speech |
| voice | Kokoro `af_heart` 0.82, one TTS line per phrase with `at` on beats; light reverb | — |
| stretched vowel | the word's vowel is phase-vocoded (librosa `time_stretch`, rate ≈ 0.5) to end with the last appended letter, + a half-beat echo throw | — |

Two mixes from the same stems at the same gain: `final.m4a` (full, −14 LUFS, TP −1.5) and `nomusic.m4a` (voice + SFX;
it reads louder integrated because silence is gated out — same gain is the rule, not the same LUFS).
No commercial song is ever embedded. POST.md suggests in-app library tracks by mood and BPM.

## 9. Retention devices
- Frame 0 is a full still (title + figure + light); the focus pull is motion from the first frame.
- A word lands every 0.3–0.6 s for the first 10 s; the ghost word makes the eye read ahead.
- A new world every ~5 s; each one is a different material for the same words.
- The trail of the stretched word crosses a scene boundary (curiosity carry-over).
- The closing question asks the viewer something; the slow fade loops back to a blurred blue first frame.

## 10. Do / don't
- Do: write original words; keep each phrase onset on a beat; one red accent, only at the end; let the desk carry a
  coherent story (photos, ticket, note) that matches the poem.
- Don't: use a commercial song's lyrics, audio, album art, artist photos or likeness; put text below 80 %; hard-cut;
  blow out the type (keep lit colour ≈ 1.0 and bloom threshold ≥ 0.78); let fire heat exceed 1 (it turns blue-white).

## 11. Code recipe
```bash
SK=~/.claude/skills/explainer-kinetic-word-edit; PY="$HOME/.generative-music-video/venv/Scripts/python.exe"
cp -r "$SK/assets/template" "samples/kinetic-word-<name>"; cd "$_"
# 1) words: vo/script.json (one line per phrase, "at" on beats of film.json bpm); film.json (dur, bpm, stretch.to)
"$PY" -X utf8 -I ~/.claude/skills/explainer-engine/engine/audio/tts.py vo
python -X utf8 -I tools/build_timing.py          # -> assets/lib/timing.js + out/<slug>.srt
# 2) picture: edit assets/lib/film.js (word lists per scene, sheet lines, note text, question words) and kw-art.js
#    (figure, polaroid paintings, ticket); look-dev with no lock:
python -m http.server 8765 --bind 127.0.0.1      # then open your look-dev page (scratch/dev.html, not included) ; sheet([t...]) / crop()
# 3) sound: full + no-music mixes, levels.json
"$PY" -X utf8 -I tools/sound_design.py
# 4) snapshots of every scene, render, deliver + QA (all through the lock)
bash "tools/with_render_lock.sh" npx --yes hyperframes@0.8.210 snapshot --at <t,...> --no-end -o scratch/snap
bash "tools/render_locked.sh" "$PWD" scratch/master.mp4 delivery
bash "tools/with_render_lock.sh" bash tools/deliver.sh scratch/master.mp4
```
- `assets/lib/kw-kit.js` — renderer + passes: `K.rt`, `K.quad`, `K.shader`, `K.render(scene, cam, target, bgMat)`,
  `K.mix(a, b, amt, mode 0 crossfade | 1 burn | 2 add, target, ga, gb)`, `K.post(src, {bloom, thr, knee, exposure,
  defocus, mb, ca, vig, grain, flash, flashCol, fade, sat, contrast, lift, gain})` (dual-filter bloom, 24-tap
  defocus + motion blur, soft shoulder), `K.text(str, {font, grad, glow, stroke, ls, scaleX})`, `K.plane`, `KW.ease`,
  `KW.seg`, `KW.n1` (smooth noise), `KW.noiseGLSL`.
- `assets/lib/kw-art.js` — canvases: `figure()`, `title(lines)`, `wood()`, `sheet(lines, hi)` (returns word x-ranges of
  the highlighted line), `polaroid(kind, caption)` with `lighthouse | moon | boat` paintings, `tape`, `ticket`, `mug`,
  `pen`, `shadow(canvas)`, `note(canvas, lines, prog)` (handwriting reveal), `qmark()`.
- `assets/lib/film.js` — the six worlds: water shader (gradient, surface, caustics, god rays, light burst, marine
  snow), word stacks with ghost/lit states, the stretched word (pre-built textures per letter count), desk scene
  (multiply highlighter and window-blind planes, dust motes, the crumple mesh), fire pass (4 words in the 4 channels
  of one DataTexture), question scene (mark, words at different depths, dust), and `draw(t)`.
- `tools/`: `build_timing.py`, `sound_design.py` + `audiolib.py` (synth, reverb, delay, true-peak limiter, `master()` for
  both mixes), `scene_est.py` (analyzer's scene-change rule on any mp4), `deliver.sh` (CRF 19 + remux of the no-music
  twin + analyzer + qa + Whisper), `qa.py` (YAVG flags, 2 fps sweep sheets, a blurred reference compare sheet with the optional `--ref`, gates.json),
  `whisper_check.py` (both mixes), `analyze_src.py`, `tile.py`, `spec.py` (source analysis: per-frame diffs, beat
  grid, spectrogram).

## 12. Gotchas (hit on the sample)
- **Canvas premultiplies alpha**: a 4-channel mask drawn into a canvas loses R/G/B wherever A = 0. Build multi-word
  masks as a `THREE.DataTexture` from a Uint8Array (rows flipped).
- **Opaque before transparent**: a `MeshStandardMaterial` with `depthTest: false` is drawn in the opaque pass, i.e.
  under every transparent plane. The crumpled note vanished until it was marked `transparent: true`.
- **Fire ramp**: heat above 1 with a cubic blue term turns the letters blue-white blobs under bloom. Clamp heat to 1,
  keep the blue coefficient ≈ 0.55, the inner letter fill ≤ 5 %, bloom 0.5 at threshold 0.85.
- **3D type blow-out**: lit colour 1.35 + bloom 0.95 at threshold 0.62 turned words into white slabs; lit ≈ 1.0, bloom
  0.5, threshold 0.78. The light burst needs ≈ 0.55 shafts + 0.3 core, not more.
- **Hair as strands reads as antennae** on a silhouette: one floating mass plus a few thin strands.
- **Look-dev without the lock**: `python -m http.server` + `scratch/dev.html` (not included in this repository: a page with
  the same libs, `sheet(times)` /
  `crop(t, x, y, w, h)` helpers) in the Browser pane; bump `?v=N` or the page keeps old scripts. Run the scene-change
  histogram loop there to predict the gate before any render (it matched the analyzer to 0.01/min).
- Whisper on a song is useless for WPM (11.3 here); compare on-screen word rates.
- A closing question voiced as two TTS phrases ("Did I" / "ever let go?") gave "ever" a breathy onset that Whisper
  heard as "never"/"sever" in both mixes; voice a question as one line. `whisper_check.py` also accepts a compound word
  heard as two ("under water").
- The generative-music-video venv has librosa but not faster-whisper; anaconda `python` has faster-whisper.
- A global `sed` of the duration (`14.2` → `14.0`) also rewrote `gsap@3.14.2`; replace attribute values, not numbers.
- Delivery: CRF 19 with grain is ~80 MB for 37 s; acceptable, or lower `grain` to 0.03.
- The compare sheet blurs the source side (`compare_src_blur`) so no lyric, album art or face is reproduced in QA files.
