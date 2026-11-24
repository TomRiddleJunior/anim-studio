# Sources

| what | where | notes |
|---|---|---|
| Source reel | Instagram reel `DfYdn-mSWSg` by @app.engineering (https://www.instagram.com/reel/DfYdn-mSWSg/), a 66 s dark 3D engineering explainer about an automatic train-safety system. About 241,000 likes and 750 comments on 9 Nov 2026. Audio: original audio. | Analysed locally for reference only. No frame, script line, caption, artwork, logo or audio is reused. |
| What was measured (9 Nov 2026) | Duration, cuts and scene changes (engine analyzer and a hand count from 2 fps sweeps of every shot), WPM from a Whisper transcript, loudness, brightness, colourfulness, motion, the 8-colour palette, HUD and caption geometry in px from full-resolution frames, caption timing (words go from grey to white on their onsets), music tempo (~117 BPM by beat tracking) and narrator pitch (median f0 ~132 Hz). | The numbers are in SKILL.md §2 and Appendix A. |
| Sample reel | "The sea gate that closes itself": the Maeslantkering storm surge barrier closing automatically during Storm Pia, 21 Dec 2023. | Every number double-sourced in the sample's `FACTS.md` (Rijkswaterstaat, Wikipedia, Schuttevaer, Water News Europe, H2O Waternetwerk, Watersnoodmuseum, Structurae, Euronews, NOAA). |
| Photo inset (sample only) | "Bij Maasdijk, de Maeslantkering foto1 2014-03-09" by Michielverbeek, CC BY-SA 3.0, Wikimedia Commons | Not shipped in the skill folder; the sample's README says where to get it. Credit is shown on screen. |
| Map data | Natural Earth 1:10m admin-0 countries (public domain) | Read locally by `tools/make_geo.py`; the GeoJSON is not shipped. |
| three.js 0.186 | `assets/sample/assets/lib/three/` (MIT, `LICENSE`) | Vendored ES modules + the post-processing addons. |
| Fonts | Inter, Space Grotesk (SIL OFL) | Captions (Inter 800), HUD and tags (Space Grotesk 700). |
| Voice | Kokoro-82M (Apache-2.0), `am_michael` at speed 1.12 | Synthetic. Disclose it in the post. |
| Music and SFX | Synthesized in `tools/sound_design.py` with `tools/audiolib.py` | No samples, no licences. |
