# Sources

This skill derives from the page's own survival-scenario format and code. Nothing in it is copied from a third-party
reel: no frames, no script lines, no characters, no account names, no logos.

| what | where | notes |
|---|---|---|
| Parent skill | `~/.claude/skills/explainer-survival-scenario/` (its SKILL.md, kit v2.2, template, tools, sound design, QA and delivery scripts) | The engine of this series: the beat map, the HUD/caption system, the lit-3D diorama look, the maquette-grade lead, the black beats, the end cards. Its own source analysis (Appendix A there: @survival.stories_en "The Lighthouse · Day 1", analysed locally, nothing reused) is the root of the format. |
| Performance evidence | `explainer-styles/research/identity/FINDINGS.md` (copied as `references/performance.md`) | The page's own Insights, read-only, 9 Nov 2026. Why the identity keeps the survival engine and adds the odds ring. |
| Device: a running number on screen | Seen in the reference reels the user sent (a PS1 "what if" reel's AGE / LIVED counter; a strike-counter reel; "40 DEAD" tags in a 2D survival reel) | Only the idea that a number that keeps changing holds viewers. The ring's design, maths, sounds and code are ours. |
| Device: the A/B vote ending | A stickman "night choice" reel (A or B in the comments) | Only the idea of a two-option vote as the Day 2 ending. The wording, cards and odds framing are ours. |
| Edge-band QA | `samples/survival2d-mine/tools/qa.py`, `band_scan` | Copied into `assets/tools/qa.py`. |
| three.js r170 | `assets/template/assets/lib/three.global.js` (MIT, `three.LICENSE.txt`) | Vendored. |
| Fonts | Oswald and Inter (SIL OFL), from `explainer-styles/engine/fonts/` | HUD, ring, tags, captions, in-scene labels. |
| Voice | Kokoro-82M (Apache-2.0), blend `am_onyx,am_michael`, via `explainer-styles/engine/audio/tts.py` | Synthetic. Disclose it in the post. |
| Music, SFX, the ring's sting and ticks | Synthesized in `tools/sound_design.py` and `assets/kit/odds_sound.py` | No samples, no licences. |
| Episode 1 story | Original: Mira, a fictional normally-unmanned gas platform, Port Ness, the shore base | Fiction. Plausibility notes with real-world sources in `assets/sample/FACTS.md`. |
