# Analysis: timing data for any song

`gmv.py analyze <dir> [--plots]` runs these scripts from `<skill>/scripts/analysis/` with the shared venv
(`~/.generative-music-video/venv`), each caching into `<dir>/analysis/work/`:

| step (`--from`) | script | output |
|---|---|---|
| `separate` | `separate.py` — ffmpeg decode → `work/mix.wav` (the time reference), Demucs `htdemucs_ft` → stems; stem offset checked by cross-correlation | `analysis/stems/{vocals,drums,bass,other}.wav` |
| `feats` | `vocal_feats.py` — vocal RMS, pYIN pitch, spectral-flux onsets, sibilance (5 ms hop) | `work/vocal_feats.npz` |
| `emissions` | `ctc_emissions.py` — CTC log-probs (20 ms) from MMS_FA (+ wav2vec2 LV60K for English) on the vocal stem's mono/L/R | `work/emission_*.npy` |
| `whisper` | `transcribe.py` — Whisper large-v3-turbo word timestamps (cross-check; `--draft` lyrics when none) | `work/whisper.json`, `lyrics/lyrics.draft.txt` |
| `align` | `align.py` — one global constrained Viterbi over the whole song on the fused emissions (garbage token between lines), signal refinement, manual fixes, confidence, report, `--plots` | `data/lyrics.json`, `qa/align_report.md`, `qa/line_NN.png` |
| `audio` | `analyze_audio.py` — beat grid, bar phase, sections, key, envelopes, onsets, `--plots` | `data/audio.json`, `qa/audio_*.png` |

Run a single script by hand: `~/.generative-music-video/venv/Scripts/python.exe <skill>/scripts/analysis/align.py --project <dir> --plots`
(`venv/bin/python` on macOS/Linux). All times are in the timeline of ffmpeg's gapless decode, which is what
browsers play and what the export muxes.

## Data formats

`data/lyrics.json`
```json
{ "lines": [ { "i": 0, "text": "This is the state of AGI", "start": 1.407, "end": 5.88, "section": "intro",
    "words": [ { "w": "AGI", "start": 3.677, "end": 4.704, "conf": 0.84, "syl": [[3.677, 4.06], [4.06, 4.355], [4.355, 4.704]] }, … ] } ],
  "extras": [ { "start": 140.6, "end": 153.5, "desc": "vocal not in the lyrics …" } ], "notes": "…" }
```
`data/audio.json` (compact): `duration, bpm, beat_period, time_signature, key, beats[], downbeats[], sections[{name,start,end}],
fps (100), rms/low/mid/high/vocal/drums/bass/other[] (0..1 envelopes), onsets{kick,snare,hat,vocal: [[t, strength]]}, notes`.

The renderer falls back to `data/lyrics.approx.json` / `data/audio.approx.json` if the real files are missing.

## QA procedure (do it every time)

1. **Console of `analyze`**: `tempo … (candidates 132.0:1.35, 66.0:1.43, …)` — the chosen tempo applies a mild
   prior toward 80–160 BPM over raw fit; a close half/double candidate is worth a look. `bar phase … margin` —
   below ~0.25 the downbeat choice is a guess. `sections (lyrics|audio novelty|sections.json)`.
2. **`qa/align_report.md`**: low-confidence words (< 0.6), very long words (> 2.2 s: a real held note, or a word
   that swallowed a gap/outro), words Whisper didn't hear (clusters mean a wrong or missing lyric line, or Whisper
   hallucinating over a vocalise), vocals not covered by any lyric word (unlisted lines, ad-libs).
3. **`qa/line_NN.png`** for each suspect (Read the image): top — vocal spectrogram with pitch (cyan, ×2); middle —
   RMS, >2.5 kHz energy, sibilance, onset strength (green); bottom — word spans from the final result, the fused
   CTC path, each model/channel, and Whisper, over the beat grid. A word starts at the onset of its first sound
   (the consonant's burst or frication, or the vowel's energy/pitch onset for vowel-initial words). Where the
   models disagree and Whisper sits on a clear onset, Whisper is usually right.
4. **`qa/audio_*.png`** (one per section start) and `audio_overview.png`: grey = beats, thick = downbeats;
   triangles = kick (red), snare (white), hat (yellow). Downbeats should sit on the first kick of the bar / the
   chord change; section starts (red) on downbeats.

## Fixes

- `lyrics/fixes.json` — manual word timings, keys `"<line>:<word>"` (0-based, as printed in the report):
  `{"5:3": {"start": 20.27}, "5:5": {"start": 21.35}, "40:0": {"start": 124.52, "conf": 0.4}, "45:4": {"end": 141.0},
    "12:3": {"start": 34.73, "syl": [35.0, 35.2]}}` (`syl` = starts of the 2nd, 3rd… sub-words). Then `analyze <dir> --from align`.
- `lyrics/pron.json` — spoken spellings for tokens the rules get wrong: `{"NVDA": "en vee dee ay", "Neumann's": "noymans"}`.
  Default rules: digits → words (years read as years), all-caps tokens of ≤ 3 letters or with no vowel are spelled
  (GPU → gee pee you, OK → oh kay), CamelCase acronyms split (ChatGPT → chat gee pee tee), lone letters spelled,
  accents folded, hyphens split. Check odd tokens with `python <skill>/scripts/analysis/pron.py`-style tests.
- LRC timestamps (`[01:23.45] line`) in `lyrics.txt` constrain each line to ±1.5 s of its stamp — use them when
  the aligner confuses repeated lines.
- `gmv.py analyze <dir> --from align --margin 2.0` makes lyric words win more easily over the garbage token (dense backing vocals).
- Beat grid: `analyze <dir> --from audio --bpm 128` (octave / exact tempo), `--downbeat 12.34` (any downbeat's
  time), `--meter 3`, `--dynamic` (force a non-constant beat track: live recordings, rubato). A drifting tempo is
  detected automatically (phase drift > 35 ms → dynamic).
- Sections: `analysis/sections.json` — `[["intro", null], ["verse1", 1], ["pre1", 9], ["chorus1", 12]]` (bar
  numbers, bar 0 = first downbeat) or `[{"name": "drop", "start": 61.2}]` (seconds) → `--from audio`.
  Without an override: `[Section]` tags from the lyrics (canonical names verse/pre/chorus/post/bridge/break/
  drop/intro/outro, numbered when repeated), instrumental gaps ≥ 2 bars become `break`, the tail `outro`; with
  no tags, repeated blocks become `chorus`; with no lyrics at all, audio novelty segments `part1…`.

## Edge cases

- **No lyrics**: `analyze` runs Whisper with `--draft` → `lyrics/lyrics.draft.txt`. Whisper mishears sung words
  and loops on long vowels ("oo oo oo"): the user (or you, with the user) must correct it before it becomes
  `lyrics.txt`; then `analyze --from emissions`.
- **Instrumental**: skip lyrics entirely; sections come from audio novelty; the plan uses title/interludes/outro.
- **Wrong or partial lyrics** (a verse missing, a repeat not written out): Whisper-unmatched clusters and uncovered
  vocals in the report. Fix the text, re-run `--from align` (emissions don't depend on the text).
- **Non-English**: set `"language"` in song.json (ISO code, e.g. "es"); MMS_FA covers ~1100 languages in romanized
  form — Latin-script lyrics work after accent folding; for non-Latin scripts add a romanized copy of the lyrics
  for alignment (e.g. with the `uroman` package) and map back for display, or accept Whisper timings.
- **Heavy backing vocals / doubles**: the L/R channel emissions help (choruses are often doubled and panned);
  if the lead is buried, place words by rhythm from other choruses (fixes.json) — the reference repo did.
- **Very long intro / fade**: the beat grid is extrapolated through drumless parts; check the first downbeat.
- **Timing budget** (RTX 3090, 3-min song, models cached): separate ~60 s, feats 15 s, emissions ~40 s, whisper ~40 s,
  align 25 s, audio 10 s. First run adds ~4 GB of downloads.
