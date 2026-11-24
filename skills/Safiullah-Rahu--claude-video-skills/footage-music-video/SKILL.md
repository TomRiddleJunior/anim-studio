---
name: footage-music-video
description: Make (or remake) a broadcast-style music video from REAL royalty-free footage — an AI-generated song (MiniMax-Music3, local ComfyUI) cut to its beat grid, stock / public-domain clips picked shot by shot, and a code-drawn motion layer on top (broadcast chrome with a counter, title + spectrum, split-flap board, bar ruler, ticker; kinetic word-timed lyrics; cards, counters and CV boxes that land on the words; a colour-halftone print pass on the footage only). This is the "ESCAPE VELOCITY" pipeline. Use it whenever someone wants a music video made from stock or public-domain footage, wants a music video in the style of a reference they describe, asks for "a fashion-show / runway music video with motion graphics", "a song with royalty-free footage and kinetic type", or a MiniMax song plus footage plus motion-design layer. For a fact-checked news or explainer music video use fact-music-video (it builds on this skill); for illustrated plates with a globe use world-briefing-music-video; for AI-generated character footage this is the wrong skill.
---

# Footage music video (the ESCAPE VELOCITY pipeline)

Every layer of the video comes from an open source:
- an open-weights AI song;
- royalty-free or public-domain footage;
- a code-rendered motion layer that unifies mismatched footage into one broadcast look.

The pipeline was first built for a personal, unpublished study after anabology's ESCAPE VELOCITY (it reused the original's published lyrics): 3:24, 1080p24, 124 shots, 425 sung words on screen. The State of AI film (see fact-music-video) is the shipped example.

The engine is the generative-music-video engine (three.js + Canvas2D, offline frame-by-frame export), extended with an EV layer. Read `~/.claude/skills/generative-music-video/SKILL.md` once for the base engine: project layout, `gmv.py analyze`, render script.

## What's in this skill

| Path | What it is |
|---|---|
| `assets/app/` | The EV engine app, latest version. The scene is `src/scenes/ev.ts`. `src/ev/` holds board, chrome, flaps, cards, type, kit, the chapter contract `x.ts` and the shared panel/caveat/source primitives `brief.ts`. The `src/ev/chapters/` folder is not included: create it and write the film's chapters there. `node_modules` is not included: run `npm i`. |
| `examples/state-of-ai-chapters/` | One complete set of chapter modules from a shipped film. Read them before writing new ones. |
| `scripts/` | The Python tools listed by phase below. Copy them into `<project>/tools/`; they resolve paths from `tools/..`. |
| `references/MOTION.example.md` | The brief given to chapter animators: contract, zones, palette, verify loop. Adapt it per film. |
| `references/caption.example.txt` | A structured MiniMax caption that worked (style descriptors adapted from anabology's published ESCAPE VELOCITY making-of). |
| `references/workflows/*.js` | The multi-agent workflows actually used. They hard-code a project path and its sets, so edit those before reuse. |

## Pipeline at a glance

1. **Concept and lyrics.** If remaking a reference, review it frame by frame first.
2. **Song.** MiniMax-Music3 → choose a take → clean up → analyse.
3. **Footage library.** Licence-checked, peeked before adding, organised in sets mapped to story beats.
4. **Storyboard.** Every cut, flap state and counter is anchored to lyric words.
5. **Picks.** The best clip, in-point, speed and camera move for each shot, chosen by looking at frames → conform → track.
6. **Chapters.** The explaining layer: one designer per chapter group, then review, then fixes. Then an integration round over the real footage.
7. **Render.** Lyric coverage check, master and web copy, credits, licence audit, `PRODUCTION.md`. Optionally 9:16 versions with the vertical-reels skill.

Multi-agent workflows (Workflow tool) suit phases 3, 5 and 6. Use them only when the user has opted into workflows or ultracode. Otherwise do the same steps with a few Agent subagents or inline.

## 0 · Reviewing a reference video (remakes)

- **The reference.** Work from a reference the user is entitled to keep locally; this skill does not download other people's videos.
- **Cut detection and contact sheets:**
  - cuts: `ffmpeg -vf "select='gt(scene,0.28)',showinfo"`;
  - 12 fps sheets with burned-in timestamps: `fps=12,scale=384:-2,drawtext=…%{pts\:hms}…,tile=6x6`;
  - full-resolution first, middle and last frame per shot.
- **Song analysis.** Run `gmv.py new <dir> --audio ref.wav`, then `gmv.py analyze` with no lyrics; Whisper drafts them. That gives BPM, key, sections and a lyric draft.
- **Frame-by-frame review.** Split the reference into segments and have reviewers log timing, structure, camera and transitions per shot (the reviewer workflow itself is not included); do not transcribe lyrics or on-screen text verbatim. A synthesis step then writes `BREAKDOWN.md`, and a critic checks it for gaps.
- **For a remake, decide with the user** what to keep: structure, look, jokes. Do not copy lyrics or identifiable people. The song is regenerated.

## 1 · Song (MiniMax-Music3 in ComfyUI)

- **Lyrics.**
  - Short lines: one per bar for verses (about 6–10 syllables), 3–6 syllables for chorus lines.
  - Every repeat written out, with `[Intro] [Verse] [Pre-Chorus] [Chorus] [Post-Chorus] [Bridge] [Outro]` tags.
  - In the sung copy `song/lyrics.txt`, spell out numbers and space acronyms ("A I", "I M F"). Keep a separate display copy in `lyrics/lyrics.txt`.
  - Long, dense lines make the model pick a slow tempo: about 97 BPM in the world film.
- **Caption** (`song/caption.txt`): three paragraphs, `Global Metadata: …` (genre, `BPM: 128`, key, emotional arc, production), `Vocal Details: …` and `Arrangement: …`. See `references/caption.example.txt`.
- **Generate with `scripts/gen_song.py --seeds … --duration 240`.** The model decides the song's tempo and length, and the caption's BPM is barely obeyed: one caption gave 82, 90, 117, 117 and 137 BPM across five seeds. Generate about 10 seeds.
- **Measure tempo with `scripts/tempo.py --target 128`.** It runs a Demucs drum stem through the gmv tempo estimator and writes `song/candidates/tempo.json`.
- **Check intelligibility with `scripts/pick_song.py`.** It reports Whisper WER per section, plus the transcript. Read the transcript: MiniMax sometimes adds an a cappella ad-lib or drops a call-and-response.
- **Nudge the take with `scripts/nudge.py in from_bpm to_bpm out.wav`** (ffmpeg atempo, at most ±6%; past that, regenerate).
- **Remove a stray ad-lib with `scripts/mute_vocal.py --win t0 t1`.** It subtracts the Demucs vocal stem. If the window was a cappella, add `--swell-from <chorus downbeat>` to fill it with the song's own reversed instrumental.
- **Pre-roll with `scripts/bookend_audio.py --take audio/take.wav --bars 4 --tail 6`.** It builds a 4-bar pre-roll from the song's own stems, so the chrome can boot before the vocal, plus a tail.
- **Analyse with `gmv.py analyze <project>`.**
  - Move the old `analysis/` folder aside first: cached stems and emissions are reused by existence, not by content.
  - The quiet pre-roll makes the beat tracker mislock (it found 136 BPM in a 128 song). Run `scripts/fix_grid.py`: it fits a constant grid to the song's kicks and takes the downbeat phase from the snare backbeat.
  - Correct low-confidence words in `lyrics/fixes.json` (`{"line:word": {"start": t}}`), using Whisper times and vocal-stem onsets, then re-run `align.py`. Aim for 0 low-confidence words.
  - Make the display lyrics match what was actually sung.

## 2 · Footage library (royalty-free only)

`scripts/footage.py` commands:
- `search <mixkit|coverr|pixabay|nasa|archive|openverse> "<q>"`;
- `peek <source> <url>` (six frames; look before downloading);
- `add <set> <url> --source S --use "a-b" --tags … --score 1-5` (fetches only a ≤14 s window at 720p over HTTP seek);
- `sheet <set>`, `list`, `reject <file> --reason`.

**Licence rules.** These are the reason this pipeline is safe to publish.
- Allowed: Coverr (Coverr License), Pixabay (Content License), NASA (public domain; no insignia as the subject), Internet Archive public-domain collections (Prelinger, FedFlix), Openverse CC0/PDM images.
- **Mixkit labels each clip separately.** Most tech and city clips are under the *Mixkit Restricted License*: personal use only.
  - `footage.py` now refuses Restricted clips at search and add.
  - `scripts/mixkit_license.py audit [--reject]` or `used --project DIR` audits a library or the clips a film uses.
  - Audit every film with `mixkit_license.py used` before publishing; one early film was found to contain Restricted clips after the fact.
- Reject anything labelled AI-generated, and 3D/CG renders; the user wants real footage.
- Reject readable logos, signage or product UI, identifiable celebrities or politicians, children in close-up, and gore.
- **Check that the subject matches the claim.**
  - A brain-MRI monitor under a mammography line was caught late.
  - So was the Reichstag under "Brussels".
- Organise sets by story beat (`server_hall`, `power_grid`, `hurricane_satellite`, …), at 4–6 strong clips per set. Real data-centre exteriors, Brussels and real split-flap boards were not available, so use stand-ins and say so.
- Sourcing is a good workflow job: one agent per two or three sets, with a self-review of each set's contact sheet. See `references/workflows/ev-footage.js` (the state-of-ai refill variant lives in fact-music-video).

## 3 · Storyboard (lyric-anchored)

`storyboard.json` is written by a generator such as `scripts/make_storyboard.py`. Read it as a template.

- **Chapters:** `{id, title, story?, counter?, ink?, grade?, type}`.
  - `story` drives the `STORY nn / N` counter.
  - `counter` labels the chapters that have no story (CHORUS, WHAT TO WATCH, SOURCES).
  - `ink: 1` makes a white chapter (paper polarity).
- **Shots:** `{id, ch, at, set, note, clip?, cam?, split?}`.
  - `at` is an anchor: `{"line": "text", "word": k, "nth": n, "snap": "beat|bar|near|none", "beats": ±n, "bars": ±n}`, or `{"end": "text"}`. Never use raw seconds, except `{"t": 0}` for the first shot.
  - `split: {every: 2, clips: […]}` makes a beat montage.
- **Flap board states (`countdown`):** `{at, rows: [row1, row2]}`, rows of 14 characters or fewer.
- **Ticker:** a list of items. Make them true or obviously non-claims; credits and disclosure work well.
- **Check it:** `node scripts/dump-board.mjs` (from `app/`) resolves everything against the song and writes `out/board.json`. Fix every error it reports.

## 4 · Picks → conform → track

- **Picking is a workflow job** (`references/workflows/ev-clip-picks.js`).
  - One picker per chapter group views the set sheets and frames at its chosen in-points.
  - A supervisor re-checks each pick by frames.
  - A global pass catches the same clip in adjacent shots and checks grade continuity.
  - Output schema per shot: `{shot, file, in, speed, cam, split[], reason}`.
- **Apply and process:**
  - `scripts/apply_picks.py <result.json>`. Fix its `norm()` project-name split if you rename the project.
  - `scripts/conform.py run` → `media/clips/p_<shot>/` 24 fps JPEGs.
  - `scripts/track.py` → YOLO11s + ByteTrack tracks for CV boxes, run in a venv with ultralytics. These tracks are what lets a box follow a subject.
  - `scripts/conform.py credits` → `media/CREDITS.md`.

## 5 · Chapters (the explaining layer)

- **The contract** is in `assets/app/src/ev/x.ts`. A chapter module exports `chapters: Record<id, {draw(c, X), post?, chrome?}>`.
  - It is a pure function of `X.t`.
  - Anchor timing to words: `X.W('line', k)`, `X.S('shotId')`.
  - Draw into the 1920×1080 logical canvas.
- **Zones:**
  - lyrics top-left: x 72–1100, y 110–430;
  - graphics in the right two-thirds or the lower-left;
  - never on the chrome: counter (72, 66), title and spectrum top-right, flap board at x 1454–1830, y 130–235, ruler at x < 80, ticker at y > 1015.
- **Palette:** white, cream paper, one coral accent per frame, dark panels. Fonts: Inter Tight, JetBrains Mono, Barlow Condensed for the flaps.
- **Shared primitives** in `src/ev/brief.ts`: `panel`, `caveatTag`, `sourceLine` (typed reveal that never shows a half number), `land` (a number lands whole). Use them so the panels are consistent.
- **Brief the animators** with `references/MOTION.example.md`, adapted. Give each agent its chapter group, the board windows and the verify commands:
  - `node scripts/render.mjs sheet --times a,b,c --out …png`, then read the PNG;
  - `node scripts/render.mjs lyrics --from A --to B`: every sung word must be on screen while it is sung;
  - `tsc --noEmit`.
- **Round structure** (`references/workflows/ev-integration.js`, and fact-music-video's `references/workflows/ai-chapter-animation.js` for round 1):
  - Round 1 runs on black grounds: designer → art director (+ a fact-checker for fact films) → fix.
  - Round 2 runs over the conformed footage: grades for bright plates, CV boxes on tracked subjects, legibility.
  - Shot tweaks go in `storyboard.d/<group>.json` (cam, grade, cv, line specs) and are merged at load, so parallel agents never edit `storyboard.json`.
- **Shared-file edits** (chrome, flaps, kit, board) are the orchestrator's job. Collect them from the agents' reports as wishes.

## 6 · Render and deliver

- **Master:** `node scripts/render.mjs video --fps 24 --samples 4 --shutter 0.5 --crf 16 --preset slow --out ../out/<name>.mp4`.
  - It renders through a GPU WebGL headless browser, at about 6.6 fps on an RTX 3090 for a 3-minute film.
  - Then make a web copy: CRF 23–24, `-maxrate 10M`, `+faststart`.
- **Check the output:**
  - a contact sheet of the real MP4 (`select='…gte(t-prev_selected_t,7.5)',tile=6x4`);
  - loudness at about −14 LUFS (`loudnorm=print_format=summary`).
- **Subtitles:** `scripts/captions.py` → `.srt` and `.vtt`.
- **Deliverables:** `PRODUCTION.md` (pipeline and choices), `media/CREDITS.md`, the licence audit (`mixkit_license.py used`). For vertical versions see the **vertical-reels** skill.

## Machine and run notes (this PC)

- **GPU:**
  - Keep GPU jobs strictly sequential: the 3090 crashed under ComfyUI load, with PCIe completion-timeout bluescreens.
  - Never run two VRAM-heavy jobs at once (another session's training run slowed MiniMax 10–100×). Check `nvidia-smi` and any other Claude sessions first.
  - As of 2026-10-19 the RTX 3090 is dead, so MiniMax, Qwen-Image and H3 can't run locally until a GPU is back. Rendering and ffmpeg still work on the CPU and iGPU, slowly.
- **Tools:**
  - ffmpeg: `ffmpeg-bin\node_modules\ffmpeg-static\ffmpeg.exe`. Put its folder on PATH for Whisper.
  - Analysis venv: `~/.generative-music-video/venv`.
  - Downloads: use `scripts/hf_resume.py` (multi-connection, append-only, SHA-verified); `curl -C -` silently restarts files.
- **Windows:** cp1252 consoles choke on arrows and emoji, so set `PYTHONIOENCODING=utf-8`.
