# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfQTUGYxxyb` by @oddhourtales, "Seven Nights at the Lighthouse · Part 1" (Night 1 of 7), 96.3 s, 720×1280, 30 fps. 82,886 likes and 644 comments as of 2026-11-06. Audio credited "Original audio (oddhourtales)". | Analysed locally for reference only. Nothing from it ships in this skill: no frame, drawing, character, name or rule text. The weather-station sample made with this skill echoed some of the source's script lines, so it is not included in this repository. |
| Measurements | The engine analyzer's `metrics.json` and a faster-whisper read-back of the source, kept in the owner's research folder (not included) | Engine analyzer (cuts, scene changes, motion, brightness, colourfulness, LUFS) plus faster-whisper `small` (VAD on; it drops the radio lines, so its WPM reads low). |
| rea-video decompose | The source was measured with rea-video; its outputs are not included | 16 shots, 14 cuts + 1 flash cut, voice 37 % of the runtime, the caption timeline (110 lines), 39 SFX hits. Its music tempo (152 / 76 BPM) is a weak guess on an ambient bed with no clear beat. |
| Own frame work (2026-11-06) | Contact sheets, transition strips and a spectrogram made with the scripts `grab.py`, `strip.py`, `audio_probe.py`, `pitch.py` (in `tools/`); the sheets are not included | Every shot looked at; transition type, HUD and caption geometry measured; voice pitch per speaker; the bed level compared with the voice. |
| Brief | `briefs\batch8\BUILD_BRIEF_BATCH8.md`, agent C (not included) | Replicate the format fully, vary the story, original audio only (full mix + no-music mix), the gates. |
| Fonts | Oswald, Inter, Caveat (SIL OFL), from `explainer-styles/engine/fonts/` | Captions, HUD, cards (Oswald/Inter); the rules sheet, log card and rule card (Caveat). |
| Voice | Kokoro-82M (Apache-2.0) via `explainer-styles/engine/audio/tts.py`: narrator blend `am_onyx,am_michael`, Pell `am_fenrir`, the voice outside `af_sky` | Synthetic. Disclose it in the post. |
| Music and SFX | Synthesized in `tools/score.py` (engine `audio/sound.py` primitives) | No samples, no licences. |
| Sample story | Kestrel Peak weather station, the observer Ida, the cable-car operator Pell, the station rules, the 120 steps, the knock in the fog | Fictional. Any real place that shares the name is a coincidence. The sample project is not included in this repository. |
