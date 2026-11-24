# Rendering: preview, stills, sheets, video, 4K

Everything goes through `app/scripts/render.mjs` (Node ≥ 20). It starts a private Vite server without hot
reload (or uses `--url http://localhost:5173` if one is running), launches headless Chrome/Edge through
playwright-core, loads `/?export=1`, and either screenshots stills or streams raw RGBA frames over a WebSocket
into ffmpeg (libx264 + AAC, `-movflags +faststart`).

## Modes

```bash
node scripts/render.mjs gpu                                      # WebGL renderer string (must be your GPU)
node scripts/render.mjs stills --t 10.2,24.0 [--only id] [--out dir] [--samples 4 --shutter 0.2]
node scripts/render.mjs stills --entries [--at 0.5]              # one still per timeline entry, named by id
node scripts/render.mjs sheet --entries --cols 5 --out f.png     # storyboard
node scripts/render.mjs sheet --from 20 --to 30 --n 16 --cols 4  # range; --times a,b,c ; --cuts
node scripts/render.mjs perf --from 20 --to 25 [--only id] [--samples N]
node scripts/render.mjs video [--from a] [--to b] [--fps 60] [--crf 16] [--preset slow] [--samples auto|N] [--shutter 0.2] [--x264 …] [--noaudio] [--out f.mp4]
node scripts/render.mjs concat --inputs a.mp4,b.mp4 --out full.mp4 [--from 0]   # lossless video concat + the song's audio
```

`--scale 2` works with every mode (true 3840×2160; stills saved from the full-resolution pixel buffer).
`--headed` shows the browser (debugging). Stills default to 1 sample (no motion blur): pass `--samples 12
--shutter 0.2` to see blur. Sheets use 4 samples.

## Sampling and motion blur

`--samples auto` (final renders) chooses 4/12/36/108/324 sub-frames per frame until converged (`--tol 3` levels,
`--max-samples 324`); the log prints the histogram (`sub-frames per frame (count:frames): 12:4210 36:3007 108:120`).
`--samples 4` is a good draft; `--samples 1` is fastest (aliased motion). `--shutter 0.2` = 1/5 of the frame
time (crisp but continuous streaks); 0.5 is dreamier. Stateful scenes need a fixed `--samples N`.
A noisy entry that never converges: `maxSamples: 108` on its timeline entry.

## Time and size estimates

1080p60 with `--samples auto`: roughly 0.3–2 s of wall time per frame depending on the plates (3-min song ≈
10,800 frames → ~1–3 h on a desktop GPU). `--samples 4 --preset veryfast` drafts run ~5–10× faster. 4K is GPU-bound,
3–4× slower; the grain makes 4K expensive to encode (CRF 16 ≈ 670 Mbit/s; use `--crf 18` ~450, `--crf 20` ~230)
and keep `--x264 aq-mode=3:rc-lookahead=30` to bound ffmpeg's memory. Run long renders in the background and
report progress (the script prints frames, fps and ETA).

Splitting: render parts with `--from/--to --noaudio` (in parallel if the GPU has headroom, each process ~2–5 GB
RAM at 4K), then `render.mjs concat --inputs p1.mp4,p2.mp4 --out full.mp4` (copies the video, adds the song's audio
once — no AAC seams). Cut points at frame boundaries: use times that are multiples of 1/60 s.

## Platform notes

- **Browser**: Chrome is preferred; on Windows Edge works out of the box (`MV_BROWSER=msedge`, auto-tried).
  `MV_BROWSER_PATH=<exe>` for anything else. GPU flags per OS: `--use-angle=d3d11` (Windows), `metal` (macOS),
  `vulkan` (Linux). `node scripts/render.mjs gpu` must print the GPU (e.g. "ANGLE (NVIDIA, … Direct3D11)"),
  not "SwiftShader" (software: 10–50× slower; on Linux servers you may need a GPU-enabled Chrome and `xvfb`).
- **ffmpeg**: `--ffmpeg <path>`, `FFMPEG_PATH`, the project's `ffmpeg-static` (installed by npm), or PATH.
- **Audio**: `song.json` `audio` (relative to the project). The export muxes `-ss from -t duration` of it, AAC 320k.
  The analysis timeline is ffmpeg's gapless decode, so sync holds for mp3/m4a/wav/flac.
- **Windows specifics**: Python/Node print UTF-8 (the scripts set it); the analysis venv lives in
  `%USERPROFILE%\.generative-music-video` (not AppData, which packaged apps sandbox); no symlinks are needed.

## Troubleshooting

| problem | cause / fix |
|---|---|
| `app failed to boot` | read the error: usually a TS error in a scene module, missing data files, or a `cut('…')` query that matches no lyric |
| a plate is dark red | the scene threw — `SCENE ERRORS` in the output has the stack |
| `[http 404] …/fonts/…` | fonts.json lists a file that isn't there → `gmv.py fonts` again |
| first frames black / half black | nothing covers t=0: the first entry must start at 0 |
| visible stepping on fast motion | final renders use `--samples auto`; drafts with 1–4 samples step |
| flicker in the export but not the preview | a scene uses `Math.random`, `Date.now`, `Math.floor(t*60)` or counts frames |
| ffmpeg exits early | disk full, or `--x264` params invalid; run with a short `--from/--to` to see the error |
| out of memory at 4K | lower `rc-lookahead`, render in parts, close other GPU apps |
