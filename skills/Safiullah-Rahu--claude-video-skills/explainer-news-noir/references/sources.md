# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfcftGoIo4D` by @thelondonletter (https://www.instagram.com/reel/DfcftGoIo4D/), a 66 s black-and-white news summary. About 75,000 likes and 740 comments on 9 Nov 2026. Audio: original audio. | Analysed locally for reference only. No frame, photo, script line, caption, artwork, logo or audio is reused; its subject matter (allegations about named people) is deliberately not this skill's kind of story. |
| What was measured (9 Nov 2026) | Duration, cuts and scene changes (engine analyzer and a hand count from 2 fps sweeps of every shot), WPM from a Whisper transcript, loudness, brightness, saturation, the 8-tone palette, caption size and position, label/ring/line geometry from full-resolution frames, music tempo (~144 BPM ticks by beat tracking, read here as 72 BPM half-time) and narrator pitch (median f0 ~104 Hz). | The numbers are in SKILL.md §2 and Appendix A. |
| Sample reel | "Hungary opens the secret police files": the 4 Nov 2026 release of communist-era state security records. | Double-sourced in the sample's `FACTS.md` (Reuters, Euronews/MTI, Daily News Hungary, Portfolio/MTI, Origo). |
| Photos (sample only) | Hook: "Magyar Péter beszéde az Országgyűlés megalakulása alkalmából (2).jpg" by Elekes Andor, CC BY 4.0. Portrait: "Peter-Magyar-portrait-2026.jpg" by Norbert Banhalmi, CC BY-SA 4.0. Both Wikimedia Commons. | Not shipped in the skill folder (see the sample README). Credit lines are drawn on screen. |
| Map data | Natural Earth 1:10m admin-0 countries (public domain) | Read locally by `tools/make_geo.py`; not shipped. |
| three.js 0.186 | `assets/sample/assets/lib/three/` (MIT, `LICENSE`) | Vendored ES modules + post-processing addons. |
| Fonts | Inter, Roboto Mono (SIL OFL / Apache-2.0) | Captions and quotes (Inter), labels (Roboto Mono). |
| Voice | Kokoro-82M (Apache-2.0), `bm_george` at speed 1.25 | Synthetic. Disclose it in the post. |
| Music and SFX | Synthesized in `tools/sound_design.py` with `tools/audiolib.py` | No samples, no licences. |
