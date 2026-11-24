# Designing the video: treatment, plates, rules

The engine makes anything possible; the treatment decides whether the result is a music video or a lyric
slideshow. Write `docs/TREATMENT.md` before scene code, keep it current, and design every plate against it.

## Contents
1. Read the song (without ears)
2. The idea, the frame, the motif
3. Plates: one idiom each, one system overall
4. Lyric integration devices
5. Choreography vocabulary (and its engine mapping)
6. Escalation, rhythm, transitions
7. Karaoke rules
8. Tone and anti-slop rules
9. Typography craft
10. Worked example: "I'm Upping My P(doom)"

## 1. Read the song (without ears)

You can't listen, so read it: the lyrics top to bottom (what is it *about*, underneath?), `data/audio.json`
sections (how long is each part, where are the breaks), `analysis/qa/audio_overview.png` (the energy curve:
where it builds, drops, goes quiet), tempo and key, and the align report's long held notes (moments that want
a visual sustain). Note the hook (the line repeated most), the quiet breakdown, the climax, the ending.
Ask the user what the song means to them if the lyrics are ambiguous — one sentence helps a lot.

## 2. The idea, the frame, the motif

- **One paragraph** that says what the video *is*. The best ideas are a **frame** that every plate can live
  in: "plates from an illustrated treatise on the end of the world" (P(doom)); "a field guide to a city at 3 am";
  "the operating manual of a heart"; "a museum catalogue of lost things"; "a night drive read through its road
  signs"; "a scientific paper about falling in love"; "a zine made in one night". The frame gives you a
  vocabulary of objects (plates, figures, forms, diagrams, signs) and a dry, consistent voice.
- **A running motif** threads all plates and carries the cuts: P(doom)'s spark (one orange point dragging a
  line) writes the first lyric, draws a loss curve, becomes a stock chart, bends into a paperclip, is revealed
  as a burning fuse, then detonates. Choose one that can *transform* (a thread, a dot, a cursor, a comet,
  a paper plane, a drop of ink, a light beam). The starter scenes carry a point-of-light / ink-dot motif
  (`motifHead`); replace or extend it.
- **The ending**: does the video loop (last frame = first frame), collapse to the motif, cut to black?

## 3. Plates: one idiom each, one system overall

A plate is one timeline window (usually a section or half of one) with its own **idiom** — a borrowed visual
language — and its own **device** for staging the lyric. P(doom) used engraving, an oscilloscope, a
bureaucratic form, banknote guilloche, a blueprint, a raymarched room, a woven textile, a UI. The video changes
look often, yet it's one piece because everything shares one palette, one type system, one grain and one tone.

For each plate write: what we see; **what transforms into what** (visual puns, never literal illustration of
each line: a lyric about an anime death-god's eyes became name-tags with lifespans wired to eyes, not an anime character); which words
get special treatment (the hook word, the long held note, the joke); where the motif is; what happens on the
downbeats, kicks and snares; how the plate hands off to the next.

Idioms that work in this engine: engraving / hatching (GLSL `hatch`, `engrave`), instruments (scopes, meters,
radar, odometers), paper documents (forms, receipts, letters, stamps), maps and blueprints, charts and
diagrams, typographic systems (pressure, stacks, grids), signage and wayfinding, textiles and patterns, UI
(prompts, notifications, dialogs — invented, not imitations of real products), 3D line worlds (tunnels,
lattices, terrains), raymarched rooms rendered as engravings, particles/atoms, handwriting.

## 4. Lyric integration devices

Each plate integrates the lyric **graphically and differently**; the words are part of the image, not subtitles:
written by a pen or the motif (stroke fonts) · riding a curve or a trace (text on path) · typed as tokens in a
field · stamped onto a form · set as signage / map labels / specimen labels with leader lines · slammed one
word per hit · packed as pressure copies · assembled from atoms · woven into cloth · masked / redacted then
revealed · embossed, engraved, projected · hung on frames of a tunnel · on the pages of a flip-book · as the
readout of an instrument · stacked like blocks · mirrored when the lyric says "backward" · stuttered on "repeat".
Let the *meaning* of a word pick the device ("drop" falls, "rise" rises, "free" leaves the frame).

## 5. Choreography vocabulary (engine mapping)

Something is always moving, but motion is shaped: **holds, then snaps** into beats; strong eases
(`ease.outExpo`, `inOutCubic`, `springStep`); no floaty screensaver drift.

| move | how |
|---|---|
| cut on the downbeat / the beat before a line | timeline windows (`cut()`, `section()`, `after()`) |
| punch-in on a downbeat | `return { zoom: 1 + 0.02 * pulse(t, downbeatTime, 0.1) }` |
| hit on the kick / snare | `f.a.kick`, `f.a.snare` (decaying pulses) or `au.events('kick', t0, t1)` |
| flash / strobe | `flash: 0.3 * f.a.snare`; `invert: 1` for a beat |
| shake | `shake: [x, y]` keyed to `frameIdx(t)` hashes, scaled by a pulse |
| camera advancing one step per beat | `travel = floor(beat) + ease(clamp((frac - 0.55) / 0.45))` (tunnel.ts) |
| whip pan / crash zoom | keyframes with `keys(t, [[t0, 0], [t1, 1, ease.inOutExpo]])` + motion blur does the streak |
| stutter on a repeated word | time-remap: `tt = t0 + ((t - t0) % beatLen)` for a bar |
| held note sustain | `held(word, t)`, `Lyrics.wordProgress` → stretch width / creep scale / glow |
| build-up | pack density on kicks (pressure.ts), tighten the camera, raise grain/vignette with `f.p` |

## 6. Escalation, rhythm, transitions

- **Escalation across repeats**: a returning chorus must not look the same. P(doom)'s hook: (1) bone on ink,
  clean → (2) ink on the signal field, heavier → (3) the breakdown: hairline, tiny, eerie → (4) maximal: strobes,
  stacks, shake. The `slam` starter does exactly this with `params.n`.
- **Light/dark rhythm**: alternate dark plates with paper plates (`plate(true)` / `invert: true`) for contrast
  across the edit; one or two per video is enough.
- **Hand-offs, not transitions**: most cuts are hard cuts on the beat, made invisible by continuity — the motif
  ends a plate where the next one picks it up, a shape becomes the next plate's first element, a line collapses
  into the next plate's horizon. Crossfades are rare; custom transitions composite `f.under` (engine.md §4).
- **The rare accent** (`rare` in the palette) belongs to one moment only (P(doom)'s acid green: the shrooms, 2 s).

## 7. Karaoke rules (all plates)

- Every lyric line is **readable** and **synced per word**: a word appears or highlights exactly at its `start`
  and completes by its `end` (`Lyrics.wordProgress`). Anticipation is OK (show the line dim up to ~0.4 s early),
  but highlighting never runs ahead of the voice.
- Default emphasis: sung portion in the accent or full ink, unsung in ~25–35 % ink.
- A window owns the lines that start inside it (`lyrics.linesStartingIn(start - 0.35, end)`), must show all of
  them, and must not show another window's lines. The planner never cuts inside a sung line; neither should you.
- Keep lyric text inside the title-safe area (≥ 96 px from the edges) unless the plate is about breaking it.
- Long held notes deserve a visual sustain (stretch, creep, glow, a pen still moving).
- Backing vocals / ad-libs not in the lyrics (align report "vocals not covered") can be staged small or ignored;
  never let them displace the lead line.

## 8. Tone and anti-slop rules

- **Impressive, not cute**: precise hairlines, high-contrast typography, restraint in colour, depth through
  lighting, bloom only on the accent.
- **Funny/moving the way the song is**: match the song's register (deadpan, tender, furious, euphoric) and keep
  it consistent. Captions, footnotes and labels are where the voice lives.
- **Not slop**: no purple/cyan neon cyberpunk, glowing brains, Matrix rain, lens-flare soup, generic particle
  nebulae, stock "AI" imagery, random 3D blobs, gradients for their own sake. Nothing that looks auto-generated.
  (If the user explicitly asks for one of these looks, do it with craft.)
- **Originality**: don't copy existing artworks, memes, characters, logos or other videos. Brand and product
  names may appear as words in the lyric; no logos or imitation product UIs. External references
  (references/inspiration.md) are for ideas and technique, not for lifting designs.
- **Faces**: realistic human faces/eyes read as uncanny in this medium — prefer objects, diagrams, abstractions.

## 9. Typography craft

- Kerning everywhere (engine.md §7); typographic punctuation (’ “ ” … – — ×) except in the mono UI voice.
- Hierarchy: one voice for the lyric (display), one for annotations (mono, small, letter-spaced), one rare
  register (text serif/italic). Swiss-grid discipline, asymmetric compositions, generous negative space.
- Animate the font's **width and weight** for expression (stretch on held notes, condense under pressure) when
  the display family has a width axis (`F.widths('display')`); otherwise scale or track.
- No outlined or haloed type; no drop shadows to "fix" legibility — fix the composition instead.

## 10. Worked example: "I'm Upping My P(doom)" (https://github.com/mexicat/pdoom-video, condensed; the song's lyrics belong to their authors and are not quoted here)

**Idea.** Plates from an illustrated treatise on the end of the world; each set piece has its own instrument,
idiom and dry humour; the P(doom) value ticks up each time the singer "ups" it, staged inside the plates.
**Motif.** The spark (see §2). **Palette.** ink #0A0A0B, bone #EEE9DF, signal #FF4D12 (+ ember, blood), one rare
acid #D8FF3C. **Type.** Archivo (width axis) for the lyric voice, IBM Plex Mono for the machine, Cormorant
Garamond italic for the prophetic register, single-stroke fonts for text written by the spark.

| plate | beat | idiom → device |
|---|---|---|
| open | opening verse: a first glimpse of AGI | TikZ construction sheet; the spark plots a unicorn, the lyric is written by the pen |
| loss | verse: the training-loss line | a training-loss plot; the lyric rides the curve, which plunges into a 3D contour landscape |
| prompt ×3 | verse: a plea typed to a chatbot | a prompt field; words typed as tokens with joke next-token probabilities; ⏎ launches the chorus |
| hook ×4 | chorus: the title line | full-frame slams per word, the number rolls full-screen; escalates each time |
| room | chorus: the thought-experiment room | FOOM shockwave into a hairline library; the sign stamps each word; the acid moment |
| shoggoth | verse: the masked-creature line | an x-ray band reveals an engraved raymarched creature behind a bland mask; words as name tags |
| bureau | bridge: a too-easy safety sign-off | bone-paper safety form; a rubber stamp slams the key phrase; a word about reversal set mirrored, one about repetition stutters |
| dense | fast verse: dense scaling jargon | typographic pressure inside the frame's own safe-area guides, which each stressed word breaks |
| outro | (instrumental) | P(doom) keeps rising past 1.00 to ∞ to NaN; a "Regenerate" button rewinds every plate; loops to frame 1 |

Read the full treatment in the repo (`docs/TREATMENT.md`) for the level of detail per plate that makes this work.
