# Sources

| item | detail |
|---|---|
| Source reel | Instagram `https://www.instagram.com/reel/DfIjwMcN-XQ/`, account `play.malo` (2K followers), 480,123 likes, 5,283 comments (on 2026-11-01), 98 s, titled "Subway Part 1". Analysed locally for reference only. |
| Measurements | engine `qa/analyze_video.py` metrics and a Whisper `small` transcript (not included) |
| Frame sheets | opening (2 fps, 0–16 s), timeline (48 evenly spaced), shots_1 (one per detected shot), strips (8 fps around cuts and motion peaks), ending (last 12 s at 1 fps), a sweep sheet (every 2.2 s); not included |

The format is reused; the story is original. The format traits (second-person rules story, mannequin hero with a drawn face, a dark twin, numbered in-scene
choice labels) are general conventions of the genre; our mannequin is two-tone (ivory shell, graphite joints) with an
egg-shaped head and our own face drawing, and our story is set in a parking garage with its own rules card.

Tools and assets used to build the sample: three.js r170 (MIT, bundled as `assets/kit/three.global.js`), HyperFrames
0.8.210, GSAP 3.14.2 (CDN), Montserrat (SIL OFL, `explainer-styles/engine/fonts`), Kokoro-82M (Apache-2.0) voice
`am_michael`, faster-whisper `small` for the check. All textures, the set, the cars, the mannequins and every sound are
generated in code.
