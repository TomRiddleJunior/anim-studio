---
name: generative-music-video
description: Make a code-rendered music video for any song — word-synced kinetic lyrics, cuts locked to the beat, illustrated / 3D "plates" in a chosen visual style — with a three.js engine derived from mexicat/pdoom-video, automatic lyric alignment and beat / section analysis (Demucs stems, CTC forced alignment, Whisper), and an offline motion-blurred 1080p60 or 4K MP4 export. Use this whenever someone wants a music video, lyric video, karaoke video, visualizer or animated typography for a song or audio track (an mp3/wav plus lyrics, a Suno/Udio song, "make a video for my track", "something like the P(doom) video"), or wants to restyle, extend or re-render one made this way — even if they never say "generative", "three.js" or "code". Not for AI-generated footage (Seedance/Higgsfield prompts) or for editing existing video clips; for programmatic videos that are not driven by a song (explainers, promos, title cards, social clips) prefer the fframes-video skill.
---

# Generative music video

You build a small web app per song that renders any song time `t` deterministically (three.js + Canvas2D +
GLSL), preview it in a browser, and export it frame by frame through headless Chrome/Edge into ffmpeg with
real motion blur. The lyrics are timed per word from the vocal itself and every cut and hit lands on the
analysed beat grid. The reference for the quality bar is https://github.com/mexicat/pdoom-video
("I'm Upping My P(doom)"): 17 bespoke plates, each with its own visual idiom, one palette, one type system,
a running motif, and every word staged inside the image exactly when it is sung.

A first cut from the starter scenes takes about an hour of compute and review. A video at the reference's level
is dozens of iterations of plate-by-plate scene writing. Make that trade-off visible to the user rather than
silently stopping at the first cut.

`<skill>` below is this skill's directory (the folder containing this file). Everything runs from a normal shell;
on Windows the bundled scripts are tested in Git Bash/PowerShell with Python 3.12, Node 22, Edge or Chrome, NVIDIA GPU.

## Pipeline

```
song + lyrics ─► gmv.py new ─► gmv.py analyze ─► QA the timing ─► docs/TREATMENT.md ─► style.json
   ─► gmv.py plan (first cut) ─► storyboard ─► bespoke plates (stills → look → fix) ─► QA ─► render.mjs video
```

Resuming a project in a later session: `python <skill>/scripts/gmv.py status <dir>` lists what exists and the next step.

## 0. Machine setup (once)

```bash
python <skill>/scripts/gmv.py doctor
python <skill>/scripts/gmv.py setup
```

`setup` builds the shared analysis venv (~5 GB: CUDA PyTorch, Demucs, Whisper, librosa) in
`~/.generative-music-video` (GMV_HOME); first analyses download ~4 GB of models into the same place.
Per project, `npm install` brings Vite, three.js, playwright-core and ffmpeg-static (done by `new`).

## 1. Inputs

- **Audio** (mp3/wav/m4a/flac). Confirm the user may use it; note the credits.
- **Lyrics exactly as sung**: one sung line per line, *every* repeat written out (no "x2", no "[Chorus] repeat"),
  optional `[Verse 1]` / `[Pre-Chorus]` / `[Chorus]` / `[Bridge]` tags on their own lines (they become the sections),
  ad-libs in parentheses only if they are clearly sung. LRC files with timestamps work too (they constrain the aligner).
  No lyrics? `analyze` writes a Whisper draft (`lyrics/lyrics.draft.txt`) that someone must correct by ear —
  sung words are misheard. Instrumental? Fine: the plan becomes title → interludes → outro.
- **Title / artist**, and **the look**: a preset, a reference, a mood. If they don't say, read the lyrics and
  propose two or three presets that fit (see references/styles.md), recommend one, proceed.

## 2. Scaffold

```bash
python <skill>/scripts/gmv.py new <dir> --audio song.mp3 --lyrics lyrics.txt --title "…" --artist "…" --style <preset>
```

Copies the template, the audio and lyrics, applies the style (downloads its Google Fonts as static instances),
runs `npm install`. Presets: `gmv.py style --list` (engraved, swiss-poster, risograph, blueprint, noir, bauhaus,
botanical, strobe, xerox-zine, amber-scope).

## 3. Analyze — then QA it (the video is only as good as its timing)

```bash
python <skill>/scripts/gmv.py analyze <dir> --plots
```

Stems (Demucs) → vocal features → CTC emissions (MMS_FA + wav2vec2 for English, mono/L/R) → Whisper cross-check →
global forced alignment + signal refinement → beats, downbeats, sections, envelopes, onsets. 2–10 min on a GPU.
Tested on the reference song against its hand-verified data: tempo exact, beats within 1 ms, downbeats 100 %,
word starts median 0 ms / 92 % within 50 ms; most of the handful of wrong words were flagged by the report.

Then check, in this order:
1. The console: tempo and its octave candidates, the bar-phase **margin** (LOW = look), the sections.
2. `analysis/qa/align_report.md` — low-confidence words, very long words (a held note that swallowed an outro?),
   words Whisper didn't hear (clusters = wrong/missing lyric lines), vocals not covered by any lyric.
   For each suspect, **Read `analysis/qa/line_NN.png`**: a word starts at the onset of its first sound.
3. `analysis/qa/audio_*.png`: thick downbeat lines should sit on the bar's first kick / chord change.

Fix and re-run only what changed:
- word timing → `lyrics/fixes.json` `{"5:3": {"start": 20.27}, "45:4": {"end": 141.0}}` (line:word from the report) → `analyze <dir> --from align`
- odd words / acronyms → `lyrics/pron.json` `{"NVDA": "en vee dee ay"}` → `--from align`
- tempo octave → `--bpm 132` · bar phase → `--downbeat <time of any downbeat>` · waltz → `--meter 3` (all `--from audio`)
- sections → `analysis/sections.json` `[["intro", null], ["verse1", 1], ["chorus1", 9]]` (names, bar numbers) → `--from audio`

Details, edge cases (no drums, rubato, non-English, instrumentals): references/analysis.md.

## 4. Treatment — design before code

Write `<dir>/docs/TREATMENT.md` (a template is there): the concept in one paragraph, the running motif,
palette / type decisions, and a plate list — one row per timeline window with its idiom, how the lyric lives
inside the image, the beat choreography and the hand-off to the next plate. references/treatment.md has the
method, the karaoke and anti-slop rules, a vocabulary of lyric devices and camera moves, and the P(doom)
treatment as a worked example. If the user is engaged, show them the treatment before building.

## 5. Style

`style.json` is the look: palette **roles** (bg, bg2, dim, mid, fg, accent, hot, deep, rare), font families by
role (display / text / mono / stroke), post-processing, letter case, motif, per-scene defaults, and an "idiom"
sentence. Adjust a preset or write one (references/styles.md). Fonts:
`gmv.py fonts <dir> --role display --family "Anybody" --widths 50,75,100,125,150 --weights 300,600,900`.

## 6. First cut

```bash
python <skill>/scripts/gmv.py plan <dir>
cd <dir>/app && node scripts/render.mjs sheet --entries --cols 5 --out ../out/wip/board.png
```

`plan` writes `app/src/timeline.ts` from the sections: each window starts on the beat before its first lyric
line (never inside a sung line) with a starter scene — `title`, `lines` / `wave` / `writer` / `tunnel` for
verses, `pressure` for pre-choruses, `slam` n=1..4 for successive choruses, `particles` for bridges,
`interlude` for instrumentals, `outro`. **Read the storyboard PNG.** This is scaffolding for the edit, not the
video: it is readable and on the beat, but generic.

Live preview with sound (for the user, or you through the Browser pane): `cd <dir>/app && npx vite` →
http://localhost:5173 (space play/pause, ←/→ seek, `[`/`]` previous/next plate, `l` loop the plate, `?t=42` start time).
It hot-reloads a scene when its file is saved.

## 7. Make it yours — plate by plate

For each row of the treatment: write or adapt a scene in `app/src/scenes/<name>.ts`, register it in
`timeline.ts`, then loop: `npx tsc --noEmit -p tsconfig.json` → stills at the moments that matter (the cut in,
first word, each hit, the hand-off out) → **Read the PNGs** → fix. `--only <id>` keeps it fast.

- API and rules: references/engine.md · techniques with code (karaoke wipes, text on paths, pen writing, atoms,
  beat choreography, custom transitions, engraved shaders, 3D, instruments): references/cookbook.md
- The starter scenes and their params, and the reference repo's 17 plates as advanced examples:
  references/scenes.md (clone https://github.com/mexicat/pdoom-video and read its `app/src/scenes/*.ts`).
- External design / motion / three.js references the user collected: references/inspiration.md.

What separates a great video from a lyric slideshow: one idea per plate, staged as a visual pun rather than an
illustration of the words; the motif carried across cuts as a hand-off; choreography that holds and then snaps
into beats; type set with care (kerning, real punctuation, hierarchy); a light/dark rhythm across the edit; the
rare accent saved for one moment; and restraint — no generic "AI" imagery.

## 8. QA before the final render

```bash
node scripts/render.mjs sheet --entries --cols 5 --out ../out/wip/board.png   # the whole edit
node scripts/render.mjs sheet --cuts --out ../out/wip/cuts.png                # 4 frames around every cut
node scripts/render.mjs perf --from 40 --to 45 --only verse2                  # < 25 ms/frame
node scripts/render.mjs video --from 20 --to 30 --samples 4 --preset veryfast --out ../out/wip/clip.mp4
```

Karaoke check: every line readable, each word lights exactly at its sung start (stills at a few `words[i].start + 0.03`),
nothing important outside the 96 px safe margin, no plate shows a line that starts in another window.

## 9. Render

```bash
node scripts/render.mjs video --samples 4 --preset veryfast --out ../out/draft.mp4          # quick full draft
node scripts/render.mjs video --samples auto --shutter 0.2 --out ../out/<slug>.mp4          # final 1080p60
node scripts/render.mjs video --scale 2 --samples auto --shutter 0.2 --crf 18 --x264 aq-mode=3:rc-lookahead=30 --out ../out/<slug>-4k.mp4
```

Final renders take 30 min – several hours: run them in the background, report progress, split with
`--from/--to` + `render.mjs concat` if needed (references/render.md).

## 10. Deliver

The MP4 path, length and size; the storyboard PNG; where the treatment, style and timeline live so the user can
iterate; the song's credits (and that the fonts are OFL). Offer the obvious next steps (4K, a plate to push further).

## Non-negotiables (and why)

- **Deterministic scenes**: output is a pure function of `f.t` (seeded hashes, no `Math.random`/clock). The
  export averages up to 324 out-of-order sub-frames per frame; anything else flickers or smears.
- **Lyrics are exact and part of the image**: a word lights at its sung start and never runs ahead of the voice;
  a window owns the lines that start inside it and shows them readably; never cut inside a sung line.
- **The beat grid drives the edit**: cuts on the beat before a line or on downbeats, hits on kicks/snares, moves
  that ease into the beat. Use the data (`cut('lyric text')`, `au.events('kick', …)`), never hard-coded seconds.
- **One visual system**: one palette (the accent is rare and means something; only it glows), one type system,
  one grain. Many idioms, one style.
- **Look at everything you change** (Read the stills). Code that hasn't been seen rendered isn't done.
- **Engine stays generic**: scene code lives in `app/src/scenes/`; change `app/src/engine/` only deliberately.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `gpu` mode prints SwiftShader / renders are very slow | install Chrome, or set `MV_BROWSER_PATH`; check GPU drivers (references/render.md) |
| a plate renders dark red | a scene threw: read `SCENE ERRORS` / `BROWSER LOG` in the render output |
| text in a fallback font / 404 in BROWSER LOG | `app/public/fonts/fonts.json` lists a missing file: re-run `gmv.py fonts` |
| "lyric not found" at boot | a `cut('…')` query doesn't match `data/lyrics.json` after editing lyrics: fix the query |
| words late/early by a syllable | `lyrics/fixes.json` + `analyze --from align` (step 3) |
| everything is on the off-beat / half speed | `--downbeat` / `--bpm` (step 3) |
| analysis can't find CUDA | `gmv.py doctor`; `gmv.py setup --cuda cu128` for RTX 50-series |

## References

- `references/analysis.md` — the analysis pipeline, data formats, QA and fixes, edge cases
- `references/treatment.md` — how to design the video: concept, motif, plates, karaoke & anti-slop rules, worked example
- `references/styles.md` — the ten presets, palette roles and polarity, choosing fonts, making a new style
- `references/scenes.md` — starter scene catalogue, the planner's mapping, the reference repo's plates
- `references/engine.md` — engine API for scene authors (data, Scene class, toolbox, rules, 4K, motion blur)
- `references/cookbook.md` — techniques with code
- `references/render.md` — render modes, sampling, 4K, timing, platform notes, troubleshooting
- `references/inspiration.md` — external design / motion / three.js resources and how to use them
