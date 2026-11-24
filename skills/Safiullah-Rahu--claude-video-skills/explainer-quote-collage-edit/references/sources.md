# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfWiiKOshhF` by @ebiko_editz, caption "DISCIPLINE", 14.1 s, 720 × 720, 160,693 likes and 143 comments as of 2026-11-06. Audio credited "Original audio (ebiko_editz, 2 reels)": a phonk-style beat. | Analysed locally for reference only. No frame, quote, card design, engraving image or audio is reused. |
| Measurements | The engine analyzer's `metrics.json` (3 cuts = 12.73/min, scene changes 16.97/min, motion 20.13, brightness 0.739, colourfulness 13.5, −14.1 LUFS, no speech), kept in the owner's research folder (not included) | Measured 2026-11-06. |
| Frame-by-frame analysis | 10 fps sheets and key moments (pink card, push, pillow pop, page, whip, engraving, plate, concrete pillow, stencil, sketch), a beat grid (103.4 BPM), onsets, energy and a spectrogram (808 slides, break, drop at 4.9 s, stop at 13.1 s), made locally (not included) | `tools/analyze_src.py`, `tools/tile.py`, `tools/spec.py`; both analyzer rules reproduced by `tools/scene_est.py` (cuts at 2.40, 8.37, 10.70 s; scene events at 1.83, 4.83, 6.50, 10.50 s). |
| Brief | `briefs\batch8\BUILD_BRIEF_BATCH8.md`, build D | Full format replication + slight variations, public-domain aphorisms, own cards and figures, 9:16, two mixes, gates. |
| Quotes (sample) | Lao Tzu, *Tao Te Ching* ch. 64 (traditional English rendering "A journey of a thousand miles begins with a single step"); Marcus Aurelius, *Meditations* 5.20, tr. George Long (1862): "…and that which is an obstacle on the road helps us on this road"; Seneca, *Hercules Furens* l. 437, "non est ad astra mollis e terris via" (our translation: "There is no easy way from the earth to the stars"); Seneca, *De Providentia* 5.10, "ignis aurum probat" ("Fire tests gold") | All public domain (ancient texts; Long's translation is 19th-century). |
| three.js r170 | `assets/template/assets/lib/three.global.js` (MIT) | Used only as a full-screen compositor (kw-kit). |
| Fonts | Inter, Libre Baskerville (+ Italic), Bebas Neue (SIL OFL) from `explainer-styles/engine/fonts/` | |
| Music and SFX | Synthesized in `tools/sound_design.py` + `tools/audiolib.py` | No samples, no licences, no voice. |
| Figures | Drawn by `assets/lib/qc-art.js` (engraving engine + sketch strokes) | Original; the myth subjects (a boulder pusher, a Titan holding the sky) are public-domain iconography. |
