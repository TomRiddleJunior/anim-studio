---
name: explainer-math-race
description: "Makes a vertical 9:16 ~15 s maths 'curve race' reel in the format of a viral Instagram maths loop (@matheorem.s, 'x - sin x vs x - cos x', 177k likes): two functions are traced live by glowing dot heads with LaTeX-style labels on a dark plot with a faint grid and axis ticks; the camera follows the heads (x locked to centre) and keeps both in view; the first crossing fires an iris ring that reveals a pink-violet gradient full of drifting glowing particles on the music's drop; the camera keeps pulling back as the race grows; a small letter-spaced brand line and the title sit in a dark header band; music only, no voice, no captions. Ours adds exact crossing markers (split-colour dot + 'x = 2'), a 'lead changes: n / N' counter, labels that swap leader-above / trailer-below without overlapping, star particles instead of hearts, and a final pull-back that shows the whole race. Everything is code on one canvas (monotone-cubic head path, a smoothed follow camera, 1-2-5 grid with fading tick labels, glow sprites, seeded particles) with an original synthesized 103 BPM track. Use for 'math race reel', 'two curves race', 'which function grows faster', 'x vs sin x animation', 'graph race loop', 'matheorems style', '2^x vs x^2', 'e^x vs x^e', 'Taylor polynomial hugging sin x', 'harmonic series vs ln n', or any short satisfying two-curve reveal with a precise caption. Builds on hyperframes."
---
# Maths curve race — two curves, one follow-cam, one reveal (15 s loop)

Reverse-engineered from one Instagram reel (**@matheorem.s**, `DfJVCp_Mm-E`, "x − sin x vs x − cos x", 15.6 s, 177k likes;
`references/sources.md`). The whole reel is **one continuous shot**: two glowing heads trace two curves, the camera
follows them, and the background blooms into a particle field on the music's drop. The caption states the maths
precisely in one sentence (who leads, how often the lead changes, how the race ends).
Sample: `the sample film (the render is not included in this repository)`, "2ˣ vs x²" (15.6 s): x²
leads from x = −2.6, 2ˣ takes the lead at x ≈ −0.767 (the reveal), x² retakes it at x = 2, 2ˣ takes it back at x = 4
and never looks back; the end pulls back to show all three crossings labelled.

## 1. Signature traits
- **Two functions, two colours, two glowing heads** (halo + ring + white core) drawing their curves live, each
  with a LaTeX-style label (`y = …` in an italic serif, upright digits, raised exponents) beside its head.
- **Follow-cam**: the heads' x stays at screen centre; the view keeps both heads in frame and zooms out as the race
  grows (the source: ~370 px per unit at 0 s, 125 at 6.5 s, 16 at 15.5 s on 720 px; equal aspect).
- **The reveal**: at the first crossing a bright ring expands from the crossing point (0.7 s) with a white flash,
  revealing a magenta-violet gradient (bottom-left glow `#512741`) with drifting glowing particles (hearts in the
  source) and twinkling 4-point sparkles; it lands on the music's section change.
- **Header band** (top 15.6 %): a tiny letter-spaced grey brand line and a bold white title "f vs g"; the plot fills
  15.6-96.5 % of the height with soft top/bottom edges.
- **No voice, no captions**: a song does the pacing; the reel loops.

## 2. Target metrics
| metric | source | sample | gate |
|---|---|---|---|
| duration | 15.63 s | 15.60 s | ±15 % |
| cuts / scene changes per min | 0 / 0 (one shot) | 0 / 0 | ±20 % (both 0) |
| first visual change | frame 0 | frame 0 | ≤ 0.4 s |
| motion mean (p90) | 4.74 (6.64) | 2.61 (3.57) | (explained: a calmer approach) |
| held frames | 1.1 % | 1.1 % | — |
| brightness · colourfulness | 0.119 · 14.4 | 0.143 · 21.9 | dark reel, ±30 % |
| tempo · key | 103.4 BPM · F major | 103.4 BPM (same tracker) · D minor / F major | match |
| loudness · true peak | −14.0 LUFS | −14.03 LUFS · −1.86 dBTP | −14 ±1, ≤ −1 dBTP |
| no-music mix | — | SFX only at the full mix's gain: −15.4 LUFS | streams equal |

Measured with `tools/qa.py` (engine analyzer + gates) on `out/math-race-powers.mp4`, `tools/audio_probe.py` on the mixes.

## 3. Beat map and formula
| % (s) | beat | source | sample |
|---|---|---|---|
| 0 (0.0) | frame 0: both heads moving, zoomed in | x ≈ −0.8, both heads, dark plot | x = −2.6, x² far above 2ˣ, dark plot |
| 0-28 (0-4.4) | **approach**: the camera follows; the intro of the track | x − sin x flat, x − cos x rising | x² falls, 2ˣ creeps up; the camera zooms in as the gap closes |
| 28-32 (4.4-5.0) | **first crossing = the drop = the iris reveal** | x = π/4 at ~4.7 s | x ≈ −0.767 at 4.40 s (bar 2 downbeat) |
| 32-88 (5-13.7) | **the race**, pulling back; more crossings | a crossing every π | x = 2 at 9.06 s (beat 16), x = 4 at 11.97 s (beat 21) |
| 88-100 (13.7-15.6) | **the end** | still following, very wide | pull back to the whole race: three split dots with their x values, 2ˣ running away |

- Choose a pair whose story fits in one sentence and whose crossings you can **prove**: equal values and a sign
  change of f − g (a tangency is not a lead change). Put crossings on beats (the first on the drop), 2-5 s apart.
- Good pairs: `x − sin x` / `x − cos x` (the source), `2ˣ` / `x²` (crossings −0.767, 2, 4), `eˣ` / `xᵉ` (a single
  tangency at x = e: a "touch, not a cross" story), `sin x` / its Taylor polynomials, `H_n` / `ln n + γ`.
- Caption formula: what races, how many lead changes and where, how it ends. Sample: "2ˣ and x² swap the lead three
  times: at x ≈ −0.767, at x = 2 and at x = 4. After 4, 2ˣ never looks back."

## 4. Visual system
| role | source | ours |
|---|---|---|
| header / plot bg | `#0d0a10` / `#141117`, a faint centre glow | `#0b0a0f` / `#0d0c12` + radial `rgba(40,34,52,.55)` r 520 |
| grid / axes / ticks | `#2a2d3a` lines, `#24222e` axes, tick labels `#3d3b4b` ~16 px (720) | 1-2-5 grid, alpha by spacing, labelled level (spacing >= 100 px) fading in; axes `rgba(225,220,240,.62)` 2.5 px; ticks Poppins 500 25 px `#7b7688` (clamped to the edges when an axis leaves the frame) |
| curves | green `#5fe0a0` (core `#adf4c5`), pink `#ff5c8a` (core `#ffc4db`) | coral `#ff7a59` (2ˣ), sky `#59c8ff` (x²); 16/8/4.2 px strokes at 16/35/100 % alpha |
| heads | glow + ring + core | glow sprite r 58, ring r 22 (pulsing), core r 10.5 + white r 5 |
| labels | `y = x − sin x`, KaTeX-like serif, next to the head, overlapping at crossings | Libre Baskerville italic 44 px (letters), regular (digits, =), 30 px raised 20 px for exponents; the leader above (−28 px), the trailer below (+66 px), a 0.32 s arc swap after each crossing |
| reveal | ring from the crossing point, flash, gradient, hearts + sparkles | same timing; 74 five-point stars (gold, pink, lavender, cream) with glow + 34 sparkles, drifting up 14-44 px/s |
| header | "MATHEOREMS" ~14 px letter-spaced grey, title Poppins-like 28 px (720) | "PLOT TWISTS" Poppins 500 22 px, 7 px tracking, `#6f6a7a`; title Poppins 600 48 px; `lead changes: n / N` Poppins 500 24 px `#8c8799` |
| crossings | a split two-tone dot | split dot r 12 + white rim + an expanding ring (0.9 s) + "x = 2" (Poppins 600 28 px), flipped to the right near the left edge |

- Safe area: the title at y 190 (10 %), nothing else above the plot; the plot's lower part carries only ticks and
  curves (Instagram's UI covers the bottom 18 % — never put the heads there at the end).

## 5. Camera and motion
- Head path `x(t)`: a monotone cubic (Fritsch-Carlson) through `(0, xStart)`, each crossing at its beat, `(reveal, xReveal)`
  and `(dur, xEnd)`, so every crossing lands exactly on its beat.
- Camera target per time: before the drop, equal aspect with `spanY = max(1.05, 1.9·gap + 0.45)` (it zooms in as the
  heads converge); after it, `spanX` grows 2.2 -> 3.0 + 0.24/s and `spanY = max(spanX·H/W, slope·spanX·(H/W)/1.7,
  2.5·gap + 0.8)` (anisotropic once the curves get steep, so slopes stay ~60° on screen); from `reveal − 0.2 s` it
  eases to fit the whole race (`xStart − 0.7 … x + 30 %`, the curves' range +8 %/+12 %).
- A one-pole smoother runs once at load on a 1/120 s grid (τ 0.22 before the drop, 0.32 after, 0.25 on the reveal;
  centre x 2.2x faster) and is interpolated per frame: seek-safe, no jitter. x stays locked to the heads until the reveal.
- Particles live in screen space (drift + sway + twinkle), seeded; the iris centre is the first crossing's screen point.

## 6. Sound
- **Source**: a commercial song (vocals) uploaded as original audio: 103.4 BPM, F major, a quiet intro (−37 → −21 dB
  per 0.5 s), full from ~3.5 s (~−15.5 dB), a section change at 4.0 s, the music ending ~15.0 s. Never reuse it.
- **Ours** (`tools/sound_design.py`): an original track at 103 BPM in D minor / F major, the first beat at −0.26 s so
  bar 2 (the drop) lands on the first crossing at 4.40 s: bars 0-1 warm saw pad + felt-pluck 1/8 arpeggio (Dm-Bb), a
  light kick/hat/sub from bar 1, a noise riser; bar 2 a sub hit, kick/clap/hats, 1/8 sub bass, an open pad and a 4-note
  FM-bell hook over F-C-Dm-Bb (bars 2-5); bar 6 the final F(add9) with a shimmer; a 0.25 s fade (loop-friendly).
- **SFX** (the whole no-music mix, at the same gain as in the full mix): an FM bell + sparkle arpeggio at each
  crossing, a whoosh into the iris, a sparkle on the final pull-back.
- Loudness −14 LUFS, true peak <= −2 dBTP before AAC (the script lowers its limiter ceiling until it does).

## 7. Retention devices
- Motion from frame 0; the first lead change is the drop, the reveal and a chime at once (28 %).
- The `lead changes: n / N` counter promises more swaps; each one rings.
- The last 1.9 s pull back to show the whole race with every crossing labelled: a rewatch reward and a loop point.
- The caption gives the exact numbers; viewers check them in the comments.

## 8. Do / don't
- **Do** prove every crossing (`tools/verify_math.py`: sign scan + bisection, a lead change at each, the right leader
  at the start), show exact values (`x = 2`, `x ≈ −0.767`), keep labels from colliding, keep the heads out of the
  bottom 18 % at the end, keep the brand line original.
- **Don't** reuse the source's pair, brand, hearts or song; claim "every π" or "forever" without a proof; let the
  camera cut; add a voice or captions (the format is music-only).

## 9. Code recipe
```bash
cp -r ~/.claude/skills/explainer-math-race/assets/template my-race && cd my-race
# 1) assets/lib/race.js: brand, title tokens, f1/f2, label tokens, colours, firstLead, xStart/xReveal/xEnd, crossings [{x, lab}]
#    tools/verify_math.py: mirror f1/f2 in Python; it must print "ok": true
python -I tools/verify_math.py
# 2) tools/build.py: CFG {dur, bpm, beat0, crossBeats, dropBeat, revealBeat} -> score/config.json, index.html, world.html
python -I tools/build.py && node tools/dryrun.mjs                      # every frame drawn in node: 0 exceptions
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/sound_design.py   # final.m4a + score/nomusic.m4a
bash "tools/with_render_lock.sh" python -I tools/snap.py scratch/snap1 "0,2,4.38,4.5,4.8,9.1,12,15.5"
bash "tools/render_locked.sh" "$PWD" out/master.mp4 delivery
bash "tools/with_render_lock.sh" bash tools/deliver.sh out/master.mp4 15.0
```
- `film.js` = `window.MATH_FILM(canvas, cfg)` -> `{draw(t), T, xh, cam}`; everything else comes from `race.js`.
- `tools/audio_probe.py <media>`: tempo, beat grid, the per-0.5 s loudness curve and band shares of a reference.

## 10. QA gates
- Length within ±15 % of 15.6 s; 0 cuts and 0 scene changes (one shot); first change ≤ 0.4 s (the heads move from
  frame 0); −14 ±1 LUFS, TP ≤ −1 dBTP; streams equal; no dips; `verify_math.py` ok.
- Sweep at 4 fps around each crossing (labels never overlap) and the last 2 s (labels inside the frame).

## 11. Gotchas met on the sample
- **The first crossing must be the climax.** Starting next to it (x = −1.6, crossing at 0.9 s) wasted it; starting at
  x = −2.6 makes the camera zoom in as the curves converge and puts the crossing, the drop and the reveal together.
- **The iris belongs to the crossing point**, not the screen centre (the source's ring grows out of the crossing).
- **Labels collide at every crossing** if their offsets are interpolated from the value gap. Swap leader/trailer on a
  timer after each crossing (0.32 s) and push the new trailer's label out along an arc while it dims.
- **The end frame needs margins**: labels to the right of the heads (fit to x + 30 % of the race), 36 % of the range
  under the curves (the first crossing would otherwise sit in the bottom 18 % under the app's caption UI) and 20 %
  above (the leader's label touched the plot's top fade).
- **Equal aspect fails for exponentials**: after the drop the y-span may exceed the equal-aspect span (`slope·sx·(H/W)/1.7`);
  the tick labels keep it honest.
- **Smooth the camera once at load** on a fixed grid and interpolate; never smooth with state carried between draws
  (seeks and parallel workers would differ).
- **Reset the context every frame** (`ctx.reset()`): an exception inside a clip leaks into every later frame of that
  render worker. Run `node tools/dryrun.mjs` before rendering.
- **Fonts on a canvas** must be loaded before the first draw: `document.fonts.load(...)` for every face and weight,
  resolved inside `window.__hf.buildReady.world`.
- **Masks**: tick labels are not hidden behind crossing labels; keep crossing labels clear of axis ticks (the sample's
  `x ≈ −0.767` sits on the tick `−2` in the last frames).

Files: references/sources.md · assets/template/ (the sample project, runnable: race.js + film.js + tools) ·
tools/ (build.py, sound_design.py, verify_math.py, audio_probe.py, dryrun.mjs, snap.py, qa.py, qa_config.json, deliver.sh)

## Appendix A — source analysis (`DfJVCp_Mm-E`)
Measured with the engine analyzer, the rea report, a 1 fps sheet, our 4 fps sweep, key frames and a 10 fps strip of
4.4-5.2 s (none included). This appendix stands in for
`references/analysis.md`.

**Numbers.** 15.63 s, 720x1280, 30 fps · 1 shot, 0 cuts · motion 4.74 (p90 6.64, 1.1 % held) · brightness 0.119,
colourfulness 14.4, saturation 0.357, 100 % dark frames · palette `#0c0b10` 30 %, `#261722` 22 %, `#19121b` 15 %,
`#110e15` 12 %, `#0a080c` 9 %, `#391e2f` 9 %, `#654f59`, `#b18693` · music only (a song with vocals, uploaded as original
audio): 103.4 BPM, F major, beat interval 0.58 s, loudness per 0.5 s −37.5, −24.5, −21.7, −18.8 … −15.8 from 3.5 s;
a section change at 4.0 s; the song stops ~15.0 s · −14.0 LUFS.

| t (s) | picture |
|---|---|
| 0.0 | header: "MATHEOREMS" (tiny, letter-spaced, grey) at 6 % and "x - sin x  vs  x - cos x" (bold white) at 9 %; the plot from 15.6 %: x ≈ −0.8, the green head of y = x − sin x near 0 and the pink head of y = x − cos x at −1.5, both labelled; y-axis at the right with ticks every 0.2; equal aspect, ~370 px per unit |
| 0-4.5 | the heads move right; the camera keeps x centred and both heads in view, zooming out slowly; a faint lighter disc behind the centre |
| 4.5-4.9 | the curves cross at x = π/4: a bright ring expands from the crossing with a white flash, revealing a pink-violet gradient (magenta glow from the bottom-left) and dozens of glowing hearts (pink, beige) with 4-point white sparkles; the music's section change |
| 4.9-15.6 | the race continues: the curves braid around the diagonal and trade places every π, each crossing marked with a two-tone dot; the camera keeps zooming out (125 px per unit at 6.5 s, 16 px per unit at 15.5 s, x ≈ 73); the labels overlap whenever the heads meet; no end card |

**What we keep / change.** Kept: one shot, the follow-cam, glowing heads with LaTeX labels, the faint grid and moving
ticks, the ring reveal of the particle field on the music's change, the header, music only, the length and the tempo.
Changed: the pair and its story (three lead changes with exact values), colours, star particles, a lead counter,
crossing labels, non-overlapping labels, an anisotropic end and a full-race pull-back, an original track.
