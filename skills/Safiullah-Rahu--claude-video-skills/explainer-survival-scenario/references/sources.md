# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `De0HQ6Mpycw` by @survival.stories_en (57K followers), "The Lighthouse · Day 1" (https://www.instagram.com/reel/De0HQ6Mpycw/). 504,014 likes and 3,078 comments on 2026-11-01. | Analysed locally for reference only. Format studied; the template script is original. No frame, character, account name or logo is reused. |
| Measurements | Engine metrics, frame sheets and a 2 fps sweep (not included) | Engine analyzer plus faster-whisper `small`. |
| Brief | `BUILD_BRIEF_BATCH5.md`, build A | Realism, eye-catching shots, retention, and the gates. |
| Base renderer | `~/.claude/skills/explainer-lowpoly-skit/assets/kit/lowpoly-kit.js` | The half-res scatter-as-gather bokeh DOF, bloom and ACES composite were adapted from that kit (the user's own code). Fog, light shafts, washes, grain, terrain, forest, tower and character are new. |
| three.js r170 | `assets/lib/three.global.js` (MIT, `three.LICENSE.txt`) | Vendored. |
| Fonts | Oswald and Inter (SIL OFL), from `explainer-styles/engine/fonts/` | Captions, HUD, tags and in-scene labels. |
| Voice | Kokoro-82M (Apache-2.0), blend `am_onyx,am_michael`, via `explainer-styles/engine/audio/tts.py` | Synthetic. Disclose it in the post. |
| Music and SFX | Synthesized in `tools/sound_design.py` | No samples, no licences. |
| Sample story | Original: Hazel, a fire lookout, "Silver Fork", the County Dispatch message, the inventory numbers | Fictional. Any real place that shares the name is a coincidence. |
