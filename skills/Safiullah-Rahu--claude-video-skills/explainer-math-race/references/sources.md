# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfJVCp_Mm-E` by @matheorem.s, "x - sin x vs x - cos x" (15.6 s, 720x1280). 177,000 likes and 896 comments as of 2026-11-06. | Analysed locally for reference only; nothing of its commercial song is used (the source's audio is a commercial song uploaded as "original audio"; its tempo and key were measured only). No brand line, title, curve pair or particle art is reused. |
| Measurements | The engine analyzer's metrics (one shot, 0 cuts, motion 4.74, brightness 0.119, colourfulness 14.4) and the rea-video report (103.4 BPM, F major, section change at 4.0 s, music ends ~15.0 s), kept in the owner's research folder (not included) | Engine analyzer and rea-video. Measured on 2026-11-06. |
| Own sweeps | A 4 fps sweep, key frames, a 10 fps strip of the iris reveal and a per-half-second loudness curve with the beat grid, made locally (not included) | ffmpeg + librosa. |
| Brief | `briefs\batch8\BUILD_BRIEF_BATCH8.md`, agent B | Full replication + slight variation, two mixes, the gates. |
| Fonts | Poppins (SIL OFL) and Libre Baskerville regular + italic (SIL OFL), from `explainer-styles/engine/fonts/` | Header (Poppins), the LaTeX-style curve labels (Baskerville italic letters, upright digits). |
| Music and SFX | Synthesized in `tools/sound_design.py` | No samples, no licences. |
| Sample maths | `tools/verify_math.py` (sign scan + bisection over [-2.6, 5.72]) and the closed form of the negative root, x = -(2/ln 2) W(ln 2 / 2) (Lambert W), which agree to 15 digits | See the sample's `SAMPLE.md`. |
