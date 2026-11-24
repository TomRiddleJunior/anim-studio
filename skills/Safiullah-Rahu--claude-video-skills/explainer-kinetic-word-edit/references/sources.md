# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfMKeK6iPDN` by @themotionaddict_ (a lyric-edit account, 61 reels on its audio), 37.1 s, 720 × 720, 310,658 likes and 252 comments as of 2026-11-06. Audio credited "Original audio" but it is a commercial song (Billie Eilish). | Analysed locally for reference only. **No frame, lyric, song audio, album art, photo or likeness is reused, and the lyrics are not transcribed anywhere in this skill or its sample.** |
| Measurements | The engine analyzer's `metrics.json` (cuts 0/min, scene changes 9.69/min, motion 13.98, brightness 0.415, colourfulness 29.2, −14.1 LUFS) and a 1 fps sheet, kept in the owner's research folder (not included) | Measured 2026-11-06. |
| Frame-by-frame analysis | 5 fps sheets, 10 fps transition sheets (title → type, trail → desk, desk → fire, fire → desk, desk → question), per-frame luma/histogram differences, a librosa beat grid (≈ 99 BPM), onsets, energy per 0.5 s and a spectrogram with kick/hat envelopes, made locally (not included) | Made with `tools/analyze_src.py`, `tools/tile.py`, `tools/spec.py` (in this skill's tools). The scene-change events were reproduced with `tools/scene_est.py` (same rule as the analyzer). |
| Brief | `briefs\batch8\BUILD_BRIEF_BATCH8.md`, build D | Full format replication + slight variations, original words, 9:16 delivery, two mixes, gates. |
| three.js r170 | `assets/template/assets/lib/three.global.js` (MIT, `three.LICENSE.txt`) | Vendored. |
| Fonts | Playfair Display, Inter, Archivo Black, Montserrat, Roboto Mono, Permanent Marker, Caveat (SIL OFL / Apache-2.0) from `explainer-styles/engine/fonts/` | |
| Voice | Kokoro-82M (Apache-2.0), `af_heart` at 0.82, via `explainer-engine/engine/audio/tts.py` | Synthetic; disclose in the post. |
| Music and SFX | Synthesized in `tools/sound_design.py` + `tools/audiolib.py` | No samples, no licences. |
| Sample words | "Undertow", an original spoken-word poem written for the sample (34 words) | Original. |
