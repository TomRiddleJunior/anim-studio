# Sources

| what | where | notes |
|---|---|---|
| Reference reel | Instagram reel `DfUvZx9Bl_f` by @what_if_survival (https://www.instagram.com/reel/DfUvZx9Bl_f/), a flat 2D cartoon zombie what-if, 148.4 s, 1080×1920, 30 fps, 58,016 likes and 518 comments when measured on 9 Nov 2026. Audio credited "Original audio". | Analysed locally for reference only. No frame, drawing, character, script line, caption, place or rule from it is reused; the format (beat map, tag/card/caption grammar, pacing) is described in SKILL.md in our own words. |
| What was measured (9 Nov 2026) | the engine analyzer (cuts/min, scene changes/min, WPM, LUFS, brightness, colourfulness, motion, palette), faster-whisper `small` word timings (`tools/words.py`), 10 fps frame differences per band (`tools/study.py`: cut times, caption and tag change times), 2 fps contact sheets, 31 full-size key frames (`tools/grab.py`: tag/card/caption geometry, pixel colours), spectrogram + RMS + tempo candidates (`tools/audio_probe.py`), voice pitch (`tools/pitch.py`) | Numbers are in SKILL.md §2 and Appendix A. |
| Sample reel | "The Dark Mine" (`assets/sample/`), an original story: a mine, a refuge chamber, the rule *the dead can't see in the dark*, a fan that runs on a dam's power line, a natural-ventilation shaft for the solo option | Fiction. Real-world claims are checked in the sample's FACTS.md. |
| Fonts | Poppins (SIL OFL 1.1, Google Fonts), Patrick Hand (SIL OFL 1.1) | Captions, tags, cards (Poppins 600/700/800). |
| Voice | Kokoro-82M (Apache-2.0) through the explainer engine's `audio/tts.py`, voice `am_michael` at speed 1.25 | Synthetic voice: disclose it in the post. |
| Music and SFX | Synthesized in `tools/score.py` with `tools/audiokit.py` (numpy/scipy) | No samples, no licences; the reference's audio is not used. |
