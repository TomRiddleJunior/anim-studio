# THE STATE OF AI · OCTOBER 2026 — "Who's at the Wheel?"

A 3:00 data-journalism music video about AI as of 18 October 2026. It runs on the ESCAPE VELOCITY remake engine:
- a MiniMax-Music3 electroclash song at **128 BPM**, with deadpan spoken-word verses that carry verified facts, sung choruses that make no claims, and a chanted list of dates;
- **royalty-free real footage** cleared for commercial use, underneath;
- a code-drawn broadcast chrome and explaining layer on top, with every number sourced on screen.

**Output** (in `out/`)
- `the-state-of-ai-oct-2026.mp4`: 1920×1080, 24 fps, H.264, with the song.
- `.web.mp4`: a smaller web copy. `.srt` / `.vtt`: 49 lyric cues.
- `DESCRIPTION.md`: the video description, with the disclosure, credits, corrections and sources S1–S101 with links.

## 1 · Facts
- **Research:** `research/` holds eight desk sweeps: frontier, compute, money, safety, science, work, policy, open/global. Each one was re-checked by an adversarial verifier (`verify_*.md`).
- **Fact sheet:** an editor built `FACTSHEET_AI.md` from them. It has:
  - 16 beats (B01–B16), each with the exact on-screen strings, a source line and the caveats it must carry;
  - a balance check;
  - a "do not say" list;
  - S1–S100 sources.
- **Disclosure rule:** the film is made with an Anthropic model, so Anthropic is held to the same standard as every other lab. Labs appear in equal type, and the film never leads with Anthropic.
- **Lyric review:** an adversarial agent checked the lyrics against live sources before any audio was generated. It fixed:
  - the Fed date (the 2026 FOMC is 27–28 Oct);
  - the UK AISI line ("not a case of a model escaping");
  - the dropped qualifiers on the 77% poll line;
  - an election-sounding chorus line;
  - several clarity issues in the dates chant.

  These are recorded in fact-sheet section 7.

## 2 · Song: MiniMax-Music3 (open weights, ComfyUI 0.39)
- **Brief:** `song/caption.txt` follows the ESCAPE VELOCITY caption: fashion-show electroclash, `BPM: 128`, deadpan female spoken verses, a euphoric sung chorus with the crowd answer "EYES ON THE ROAD!", and a chanted list of dates.
- **Tempo is not controllable.** The model largely ignores `BPM:`.
  - Across seeds, the EV caption gave 82, 90, 117, 117 and 137 BPM.
  - Ten takes were generated; a power loss or hard hang cut the batch at six.
  - Each take was measured with `tools/tempo.py`: a Demucs drum stem plus the gmv tempo estimator.
- **The take:** seed 19 measured 125.1 BPM. It had the lowest-risk transcript, every fact line present, and a Whisper WER of 0.27. It was nudged +2.3% to **128.0 BPM** with ffmpeg atempo (`tools/nudge.py`).
- **Cleanup:**
  - MiniMax added a 1.6 s a cappella ad-lib that is not in the lyrics. It was removed by subtracting the Demucs vocal stem, and the silence was filled with a reversed swell built from the song's own chorus instrumental (`tools/mute_vocal.py`).
  - A 4-bar cold-open pre-roll was built from the song's own stems (`tools/bookend_audio.py`), plus a 6 s tail. The result is `audio/song.wav`, 180.1 s.
- **Analysis:** `gmv.py analyze` ran stems, CTC + Whisper alignment of all 336 words (0 low-confidence after 13 manual fixes in `lyrics/fixes.json`) and a beat grid.
  - The quiet pre-roll made the tracker mislock (136 BPM), so `tools/fix_grid.py` pins a constant 127.99 BPM grid fitted to the song's kicks. Residual drift is within ±31 ms, under one frame. The downbeat phase comes from the snare backbeat.
- **Lyrics:** the display lyrics (`lyrics/lyrics.txt`) match what was actually sung; the chorus answer lines were adjusted to the take. `song/lyrics.txt` is the version MiniMax received.

## 3 · Footage: royalty-free, cleared for commercial use
- **Sources:** Coverr (Coverr License), Pixabay (Pixabay Content License), NASA (public domain), Internet Archive public-domain collections, and Mixkit clips under the **Mixkit Free License only**.
- **Mixkit licensing:** Mixkit licenses each clip separately, and most tech clips are under its *Restricted* licence (personal use only).
  - `tools/footage.py` now checks every Mixkit page's `data-license` and refuses Restricted clips.
  - `tools/mixkit_license.py audit|used` audits a library or the clips a film uses. 79 Restricted clips were rejected from this library.
- **Library refill:** nine agents refilled 20 sets (`footage/raw/<set>/manifest.jsonl`, with `rejects.jsonl` alongside). They peeked at every clip before adding it and self-reviewed the contact sheets. AI-generated and CG clips, logos and readable signage were rejected.
- **Picks:** for each chapter group, a picker viewed frames and chose clip, in-point, speed and camera move. A supervisor then verified each pick by frames, and a film-wide pass checked reuse and adjacency (`footage/picks.json`, `storyboard.json`'s `pick_reason`).
- **Processing:** the picks were conformed to 24 fps frame sequences (`tools/conform.py`) and tracked with YOLO11 + ByteTrack for the CV boxes (`tools/track.py`).
- **Credits:** `media/CREDITS.md`.

## 4 · Motion: code (three.js + Canvas2D, EV engine)
- **Engine:** `app/src/scenes/ev.ts` draws the film from `storyboard.json`, written by `tools/make_storyboard.py`. It has 23 chapters, and every cut is anchored to lyric words.
- **Chrome** (`ev/chrome.ts`):
  - the `STORY nn / 16` counter, or CHORUS / WHAT TO WATCH / SOURCES;
  - the title and spectrum;
  - a split-flap headline board, which never holds a fact through a chorus;
  - a bar ruler, a ticker (disclosure and credits) and a timecode.
- **Explaining layer** (`ev/chapters/*.ts`): seven groups, each made by a designer, then an adversarial fact-checker and an art director, then a fix pass, then a whole-film beat-coverage audit. Every on-screen number matches the fact sheet exactly, with its source line and required caveats.
- **Integration round** over the real footage (`ev/brief.ts`):
  - shared panel, caveat and source-line primitives;
  - grades for bright plates;
  - CV boxes on tracked subjects;
  - counters that land directly on their value (no invented intermediate numbers).
  - It was reviewed again in the same way.

## 5 · Final integrity fixes (lead)
- **Split-flap board** (`ev/flaps.ts`):
  - A flipping cell never shows a digit it isn't settling on: letters spin only on letter cells, and other cells flip blank leaves.
  - A token that contains a digit ("$1.4", "485", "09-10") lands all at once and clears all at once, so no frame shows a partial or invented number.
  - Verified by a frame-by-frame text scan across every flip.
- **Board timing** (`tools/make_storyboard.py`):
  - Each fact row changes on its chapter's cut, after a blank flip one beat earlier.
  - Date rows land on the day word together with the chapter's date tile, which carries its source.
  - The choruses and builds use fact-free rows, and the last date row hands off before the final chorus.
- **Sources** (`ev/brief.ts`): a typed source line never shows a cut-off number token ("MAY 20", "n=1,2"), and it completes 0.1 s before its number lands.
- **Clips:**
  - N01 (the Reichstag under "Brussels") was re-picked to a generic civic building at dusk.
  - S01 (a brain-MRI monitor under "mammograms") was re-picked to a dim hospital room.
  - Bright plates were graded into the night-blue verse.
- **Checks:** a full-film text scan at 24 fps, plus 60 fps at the previously flagged moments. Every sung word is on screen (336/336). Every Mixkit clip used is under the Free licence.

## Re-render
```
cd app
node scripts/render.mjs video --fps 24 --samples 4 --shutter 0.5 --crf 16 --preset slow --out ../out/the-state-of-ai-oct-2026.mp4
```
