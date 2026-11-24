---
name: world-briefing-music-video
description: Make a fact-checked WORLD-NEWS briefing music video in the "newsroom atlas" look, the "State of the World — October 2026" pipeline. A night d3-geo globe flies between stories; each story opens on an AI-illustrated editorial plate (Qwen-Image 2.1, two-ink risograph, no likeness or text); serif numerals count up with a mono source line; and an AI song (MiniMax-Music3, EV-style, with deadpan spoken facts, sung chorus) carries verified, attributed facts cut to its beat grid. Use it whenever someone wants a world-affairs or geopolitics recap video, "the state of the world this month", a news briefing with a globe and maps, a sourced current-events video that needs illustrations instead of stock footage, or "like the State of the World video" — and whenever map/globe storytelling suits the topic (conflicts, elections, climate, trade). Research and fact-checking follow fact-music-video; this skill swaps the footage for illustrated plates plus a globe.
---

# World briefing music video (the State of the World pipeline)

The reference result is `state-of-the-world\out\the-state-of-the-world-oct-2026.mp4`: 3:46 at 97 BPM, 20 segments, 173 sources, 506/506 sung words on screen. Read `references/PRODUCTION.md`, `references/DESIGN.md` and `references/BRIEF.md`: they are the design brief, the animator brief and the production log.

**User preference (recorded):** for videos like this, keep the sound like the ESCAPE VELOCITY remake: a MiniMax song with spoken-word verses and a sung chorus, **not a slow narrator**. The first version used Kokoro narration; the user asked for the song instead.

## The look: "newsroom atlas"

- **Spine:** a night globe in d3-geo orthographic over Natural Earth 1:50m: navy oceans, slate land, hairline borders, graticule.
  - One **shared camera** flies between story focuses, so dissolves never double the globe.
  - Countries light up vermilion, and arcs and pins draw on the words that name them.
- **Plates:** one Qwen-Image 2.1 illustration per story, all in **one style**: two-ink risograph (navy + vermilion on warm paper), symbolic.
  - No faces, logos or readable text, and nothing that could pass for a news photo.
  - 2048×1152, then the paper border is trimmed and the image cropped to 16:9.
- **Data:** Newsreader numerals count up; simple charts draw on; Plex Mono kickers, labels and **source lines**.
- **Palette:** night `#0A1020`, panel `#111A2E`, paper `#F3EFE6`, vermilion `#E4572E` (one hot value per frame), teal for hopeful notes.
- **Chrome:** a WORLD BRIEFING band, a story counter, a progress bar, and word-revealed lyrics. Choruses set the sung words as big serif type.

## Pipeline

1. **Research and fact sheet.** Follow **fact-music-video** §1, with ten desks for world news (conflicts, geopolitics, economy, elections, climate, technology, humanitarian, science and space, energy, regions) plus adversarial verification. Workflow: `references/workflows/world-affairs-research.js`.
   - Per story, the fact sheet holds: headline facts with sources, attributed framing for contested claims, a "do not say" list, and a visual idea.
2. **Script → lyrics.**
   - First write a narration script and review it on four counts (accuracy, neutrality, freshness, spoken clarity): `references/workflows/sotw-script-review.js`.
   - Then condense it line by line into song lyrics, keeping the same figures and attributions.
   - Contested claims are always attributed ("Washington cites self-defence. Tehran calls it aggression.").
   - The chorus states no facts. The post-chorus is a chanted list of dates.
   - Keep verse lines shorter than the reference's dense ones. Long lines produced a slow 97 BPM take.
3. **Song.** MiniMax-Music3 via `scripts/gen_song.py`, with the structured caption in `references/caption.example.txt`.
   - Generate several takes and choose with `scripts/pick_song.py`: lowest Whisper WER, no hallucinated lines. For tempo targeting, use the tools in footage-music-video.
   - Normalise to about −14 LUFS and add a short tail (`scripts/mix.py`).
   - Run `gmv.py analyze` (forced alignment of every word, beat grid).
4. **Plates.**
   - Run ComfyUI with the official Qwen-Image 2.1 Turbo template: `EmptyLatentImage`, `SamplerCustomAdvanced`, 8 `ManualSigmas`, euler, `CFGGuider` cfg 1, `QwenImage21Cache`. About 14–22 s per 2048×1152 image on a 3090.
   - Generate with `scripts/gen_plate.py plates.json --seeds 1 2`, two seeds per plate; the house style suffix is appended automatically.
   - Pick the better seed, then run `scripts/plates_prep.py`. Trim only the paper border common to all four sides; trimming each side separately over-cropped light skies.
   - **Licence:** Qwen-Image 2.1 is licensed for non-commercial use only. Monetising the film needs a separate licence.
5. **Segments and cuts.**
   - `references/segments.json` lists the segments and their line counts.
   - `scripts/segmap.py` cuts each segment on the last beat **after** the previous line's last word, never mid-line → `data/film.json`.
   - `references/focus.json` gives the globe focus per segment.
6. **Segment modules** (`assets/app/src/brief/segments/<group>.ts`, contract in `src/brief/x.ts`). Each draws its plate, the globe through the shared camera, and its graphics.
   - Worked examples: `examples/world-segments/*.ts`. The shared kit is `src/brief/{kit,globe,charts}.ts`.
   - Workflows: `references/workflows/sotw-segment-animation.js` and `sotw-song-animation.js`. Each pairs a motion designer with an art director plus fact-checker who checks every on-screen number and source line against the fact sheet.
7. **Scene and chrome.** `src/scenes/brief.ts` handles:
   - a dissolve after each cut (0.45 s);
   - globe camera keyframes (the last segment with `t >= t0 - 0.4`);
   - adaptive chrome: ink on paper over light plates, white over dark plates, judged from the top-band luminance;
   - captions: the newest *started* line wins, with a 0.15 s lead-in only when nothing is being sung;
   - choruses set the sung words as large serif type.
8. **Render.** `node scripts/render.mjs video --fps 24 --samples 4 --shutter 0.5 --crf 16 --preset slow --out ../out/<name>.mp4`.
   - Make a web copy and subtitles (`scripts/captions.py`).
   - Check lyric coverage with `render.mjs lyrics`.
   - For 9:16 versions use the **vertical-reels** skill. For a 3-minute cut, splice out a whole verse at segment cuts that sit the same beat-phase before a downbeat.

## Rules that kept it fair

- Attribute every contested claim to its source, and present both sides' framing where a conflict has two.
- Use a neutral, documentary tone: "under strain", not doom. End on what is improving and what to watch.
- No likeness of real people, no national flags with readable emblems, no gore.
- Every number on screen carries a mono `SOURCE · PUBLISHER · MON YYYY` line from the fact sheet.
- If the research is done with an Anthropic model and the film mentions Anthropic, add a disclosure ("Researched and written with Claude (Anthropic)") and hold Anthropic to the same standard as everyone else.

## Files

| Path | What it is |
|---|---|
| `assets/app/` | The brief engine. `src/scenes/brief.ts`, and `src/brief/{globe,charts,kit,x}.ts`. `segments/` is left empty for the new film. `npm i` installs d3-geo, topojson-client and world-atlas. |
| `examples/world-segments/` | The seven segment modules of the reference film. |
| `scripts/` | `gen_plate.py`, `plates_prep.py`, `segmap.py`, `mix.py`, `captions.py`, `gen_song.py`, `pick_song.py`, `audiojson.py`, `film.py`. |
| `references/` | `PRODUCTION.md`, `DESIGN.md`, `BRIEF.md` (the animator brief, including its "SONG VERSION" notes), the lyric and caption examples, `segments.json`, `focus.json`, workflows. |

Machine notes are the same as footage-music-video: GPU jobs sequential, ffmpeg path, and the 3090 is dead as of 2026-10-19.
