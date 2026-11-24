# THE STATE OF THE WORLD · OCTOBER 2026 — "Under Strain"

A 3:46 data-journalism music video about world affairs as of 18 October 2026. It is built like the ESCAPE VELOCITY
remake: a MiniMax-Music3 song whose deadpan spoken-word verses carry verified facts, with sung choruses, Qwen-Image 2.1
editorial plates, and a code-rendered motion layer (night globe, counters, charts, calendar).

**Output** (in `out/`)
- `the-state-of-the-world-oct-2026.mp4`: 1920×1080, 24 fps, H.264 CRF 16, 4-sub-frame motion blur, with the song.
- `.srt` / `.vtt`: 63 lyric cues.

## 1 · Facts: research → verification → script
- `research/`: 10 desk sweeps (conflicts, geopolitics, economy, elections, climate, technology, humanitarian,
  science and space, energy, regions), each re-verified by an adversarial fact-checker (`verify_*.md`). An editor then
  built `FACTSHEET.md`: 10 stories, verified facts only, attributed framing for contested claims, "do not say" lists
  and 173 sources (S173 was added during script review).
- The narration script (`tools/script.json`) was reviewed on four counts (accuracy, neutrality, freshness, spoken
  clarity), merged, and given a final adversarial accuracy pass (`research/SCRIPT_NOTES.md`).
- The song lyrics (`lyrics/lyrics.txt`) condense that reviewed script line by line, keeping the same figures and
  attributions. `song/lyrics.txt` is the version MiniMax sings, with numbers spelled out and acronyms spaced.

## 2 · Song: MiniMax-Music3 (open weights, ComfyUI 0.39)
- Brief: `song/caption.txt`, adapted from the EV remake (electroclash techno, female deadpan spoken-word verses,
  euphoric sung chorus, call-and-response "Still turning!", chanted dates).
- Five takes were generated (`tools/gen_song.py`). All five said every fact and number correctly when transcribed
  by Whisper.
- Seed 37 was chosen (`tools/pick_song.py`). It has the lowest WER, its verse is the cleanest, and it adds no
  hallucinated lyrics after the outro. MiniMax set it at 97 BPM.
- The take was given a 4 s tail and loudness-normalised to about −14 LUFS → `audio/song.wav`.
- Analysis with `gmv.py analyze`: Demucs stems, CTC + Whisper forced alignment of all 506 words (0 low-confidence),
  and a constant 97.1 BPM beat grid.

## 3 · Plates: Qwen-Image 2.1 Turbo (ComfyUI, official turbo template)
- 18 symbolic editorial illustrations in one risograph style: two inks, navy and vermilion, on paper.
- No faces, logos, readable text or gore, and nothing that could pass for a news photo.
- Two seeds per plate; the best was picked (`plates/picks.json`), the border trimmed and the image cropped to 16:9
  (`tools/plates_prep.py`) → `media/plates/`.

## 4 · Motion: code (three.js + Canvas2D, gmv engine)
- One scene, `app/src/scenes/brief.ts`, draws `data/film.json`: 20 segments cut on beats AFTER each line's last word
  (`tools/segmap.py` from `tools/segments.json`), with 0.45 s dissolves after each cut.
- Each segment module in `app/src/brief/segments/*.ts` draws its own plate, globe and graphics.
- Shared kit: `app/src/brief/{kit,globe,charts}.ts`.
  - The globe is a d3-geo orthographic projection over Natural Earth 1:50m.
  - It uses one shared camera that flies between story focuses, so dissolves never double the globe.
- Chrome: a WORLD BRIEFING band that switches to ink on paper over light plates, a story counter, and a progress bar.
- Captions: word-revealed lyrics. Choruses set the sung words themselves as large serif type. 506/506 words are on
  screen while sung (`render.mjs lyrics`).
- Built by multi-agent rounds: seven motion designers, each followed by an art director and fact-checker who checked
  every on-screen number and source against FACTSHEET.md.

## Re-render
```
cd app
node scripts/render.mjs video --fps 24 --samples 4 --shutter 0.5 --crf 16 --preset slow --out ../out/the-state-of-the-world-oct-2026.mp4
```
