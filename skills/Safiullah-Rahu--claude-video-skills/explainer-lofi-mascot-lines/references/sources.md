# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfTu_Jcs-NV` by @sadgoose42, 22.4 s, 720×1280, 30 fps, 810,561 likes and 885 comments as of 2026-11-06. Audio credited "Original audio (sadgoose42)". | Analysed locally for reference only. No frame, line, character (the goose mascot), artwork or audio is reused. |
| Measurements | The engine analyzer's `metrics.json` and a faster-whisper read-back, kept in the owner's research folder (not included) | Engine analyzer + faster-whisper `small` (it hears every line: there is a quiet voice reading them). |
| rea-video decompose | The source was measured with rea-video; its outputs are not included | 6 shots, 5 hard cuts; key C major (0.86); its voice detector says "none", but the vocals stem has six clear spoken segments ~6 dB over the music; its 97.5 BPM beat track is weak (strength 0.06). |
| Own frame work (2026-11-06) | Sweeps, cut strips, a caption-band sheet and spectrograms made with the scripts `spec_zoom.py`, `music_probe.py` (in `tools/`); the sheets are not included | Cut times, caption in/out per scene, the caption size and position, scene drift, the tempo (70 BPM from 8th-note onsets every 0.43 s on the music stem) and key. |
| Brief | `briefs\batch8\BUILD_BRIEF_BATCH8.md`, agent C (not included) | A NEW mascot (not a goose), 5–6 painterly night scenes in code, original lines, ~22 s, original audio, two mixes. |
| Fonts | Inter (SIL OFL), from `explainer-styles/engine/fonts/` | The caption. |
| Voice | Kokoro-82M (Apache-2.0) `am_michael` speed 0.76–0.86, via `explainer-styles/engine/audio/tts.py` | Synthetic. Disclose it in the post. |
| Music and SFX | Synthesized in `tools/score.py` (engine `audio/sound.py` primitives) | An original 70 BPM lo-fi bed; no samples, no licences. |
| Sample | Original: the otter mascot, six scenes, six lines ("There is a calm in …") | All drawn in code (`assets/kit/lofi-kit.js`). |
