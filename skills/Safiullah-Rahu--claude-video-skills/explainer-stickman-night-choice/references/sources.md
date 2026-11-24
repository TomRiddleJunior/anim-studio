# Sources

| what | where | notes |
|---|---|---|
| Reference reel | Instagram reel `DfViPqtSRxY` by @stick.dimension (https://www.instagram.com/reel/DfViPqtSRxY/), a stick-figure night horror choice story (Part 2 of a series), 57.0 s, 1080×1920, 30 fps, 131,937 likes and 11,550 comments when measured on 9 Nov 2026. Audio credited "Original audio" (a synthetic narrator voice). | Analysed locally for reference only. No frame, drawing, script line, caption, message text, premise or rule from it is reused; the format (HUD, phone thread, RULE tag, caption system, vote stack, pacing) is described in SKILL.md in our own words. |
| What was measured (9 Nov 2026) | the engine analyzer (cuts/min, scene changes/min, WPM, LUFS, brightness, palette), ffmpeg scene scores per frame (the one cut: 0.357 at 0.2 s; every other change ≤ 0.22), faster-whisper `small` word timings (`tools/words.py`), 10 fps frame differences per band (`tools/study.py`), 2 fps contact sheets, 25 full-size key frames (`tools/grab.py`: HUD and caption geometry, pixel colours), spectrogram + RMS + tempo candidates (`tools/audio_probe.py`) | Numbers are in SKILL.md §2 and Appendix A. |
| Sample reel | "Same Night · Part 1" (`assets/sample/`), an original series premise: a time loop where only your phone (and its battery) survives each reset, texts from your own number, a rule from loop one, the city going dark toward you, an A/B vote that decides loop 5 | Fiction. |
| Fonts | Oswald, Roboto Mono, Inter, Montserrat (all SIL OFL 1.1, Google Fonts) | HUD clock + vote (Oswald), HUD lines (Roboto Mono), phone UI (Inter), captions (Montserrat 900). |
| Voice | Kokoro-82M (Apache-2.0) through the explainer engine's `audio/tts.py`, voice `am_onyx` at speed 1.08 | Synthetic voice: disclose it in the post. |
| Music and SFX | Synthesized in `tools/score.py` with `tools/audiokit.py` (numpy/scipy) | No samples, no licences; the reference's audio is not used. |
