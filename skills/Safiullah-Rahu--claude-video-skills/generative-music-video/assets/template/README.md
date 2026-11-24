# Music video project

A code-rendered music video: a small three.js web app that renders any song time deterministically,
with word-synced lyrics and cuts locked to the analysed beat grid, exported offline with motion blur.
Made with the `generative-music-video` skill (engine derived from mexicat/pdoom-video, MIT — see
LICENSE-engine.txt).

| file / folder | what |
|---|---|
| `song.json` | title, artist, audio file, lyrics file, language |
| `style.json` | the look: palette roles, fonts, post-processing, per-scene defaults |
| `lyrics/lyrics.txt` | the lyrics as sung (`fixes.json`, `pron.json` for alignment fixes) |
| `data/` | `lyrics.json` (word timings) and `audio.json` (beats, sections, envelopes) from the analysis |
| `docs/TREATMENT.md` | the concept, style bible and plate list |
| `app/src/timeline.ts` | the edit: which scene plays when |
| `app/src/scenes/` | one module per plate |
| `out/` | renders |

Commands (from `app/`):

```bash
npx vite                                                        # live preview with sound: http://localhost:5173
node scripts/render.mjs sheet --entries --out ../out/board.png  # storyboard
node scripts/render.mjs video --samples 4 --preset veryfast --out ../out/draft.mp4
node scripts/render.mjs video --samples auto --shutter 0.2 --out ../out/final.mp4
```

Re-running the analysis or re-planning: `python <skill>/scripts/gmv.py analyze . --plots`, `gmv.py plan .`,
`gmv.py status .` (where `<skill>` is the generative-music-video skill folder).

The song and lyrics belong to their authors. Fonts in `app/public/fonts/` keep their own licences: the .ttf faces
(Archivo, Cormorant, IBM Plex Mono) are SIL OFL 1.1, listed in each folder's `FONT-LICENSES.txt` (faces added later by
`gmv.py style` / `gmv.py fonts` are listed in `LICENSES.txt`, which that command writes); the EMS stroke fonts are
SIL OFL 1.1 (see `OFL.txt`). Hershey fonts: originally by Dr. A. V. Hershey, U.S. National Bureau of Standards; distributed
with the Hershey font use conditions (kept in each SVG's metadata); SVG conversion by Windell H. Oskay / Evil Mad Scientist.
