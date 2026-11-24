# REVIEW — "The Man Who Moved Every Clock" (twist-tale sample)

Render: `out/twist-tale.mp4` — 66.3 s, 1080 x 1920, 30 fps, HyperFrames 0.8.210 (three.js on the Intel iGPU).
Rebuild: `python -I tools/make_assets.py` → `python -I tools/build_tale.py` → `sound.py score` → encode `final.m4a` → render.

## Choices
- Topic: daylight saving's origin, released for the 1 Nov 2026 US clock change; the format's best performers are real
  history with a doubter arc and a twist — here, eight years of nothing, death, then the enemy adopts it first.
- No claim the sources don't make (no "laughed at"); every fact line maps to `FACTS.md`.
- Taste changes vs the source channel: code-rendered toon sets with an ink pass instead of generated video; our own
  doodle cast; Fredoka captions with yellow keywords; a schematic day chart for the mechanism.

## Fixed during review
- Ink lines invisible at 1–2 px after scaling → 12-tap edge detection at 3 px.
- Characters cropped in the narrow 9:16 frame (coins, MP, cheering benches) → framing recomputed from width ≈ 0.48·d.
- Willett hidden behind the letters pile and the coins → moved beside the props; hidden in the committee shot.
- Clock hands double-counted the hour (the living-room clock showed 3:00) → animate by total minutes.
- A horizontal day strip was unreadable in portrait → vertical labelled chart with an AWAKE bracket and lamps.
- Street facades were back-lit into darkness → key light moved to the front-left.
- Colour flatter than the source (colourfulness 43 vs 58–87) → a light grade in the ink pass (saturation x1.22, gamma 0.9).
- WebGL "missing fragment shader outputs" from the ink-hiding shader → it now writes a colour after `discard`.

## Not done / weakest
- Shot changes are hard cuts; the source mixes in 1–3-frame dissolves.
- Characters do not lip-sync or walk; they swap expressions and slide.
- The soundtrack (voice, marimba bed, 50 effects) was measured, not listened to.
