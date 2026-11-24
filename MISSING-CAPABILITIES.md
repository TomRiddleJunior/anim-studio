# MISSING CAPABILITIES

Gaps found while screening the 45-topic coverage list (Mission 00 §1) against the 256 installed
skills. Format: topic → what exists → what's missing / how to close it.

## Real gaps (no installed skill covers them)

| Capability | Status | Closure path |
|---|---|---|
| **Blender binary** | 26 blender-agent skills installed but `blender` not on box | `sudo apt-get install blender` (or snap) when 3D tasks start — skills are ready, tool isn't |
| **OpenCV analysis tools** | optical-flow / motion-tracking skills reference OpenCV; module absent | `pip install opencv-python` on first use (mission §5 allows) |
| **Voice-over TTS** | voice/subtitle *sync* skills exist; no local TTS engine skill | None installed anywhere in the ecosystem surveyed; use a paid API later or reuse subtitle-sync with pre-recorded VO. Mission §5 forbids model downloads now |
| **Lip sync (dedicated)** | only as sub-steps inside blender facial/rigging skills | Rive/Rhubarb-style local tooling would need a new skill; defer until a talking-character project demands it |
| **2D characters in 3D environments** | pieces exist (character rigging + threejs) but no combined skill | Compose manually: nessalazne `animate` grammar + `threejs`/R3F skills |
| **Visual regression testing (dedicated)** | only inline QA steps (`hyperframes check`, remotion preview) | Use the built-in Playwright browser tool for frame-diff checks; a standalone skill doesn't exist yet — candidate to author (Mission 00 doesn't ask us to write skills) |
| **Motion tracking / optical flow (dedicated)** | referenced, not implemented, in reverse-engineering skills | OpenCV script to be written when first needed; ~30 lines, no skill exists upstream |

## Coverage verified (topics with real installed skills)

Remotion ✓ · HyperFrames ✓ · Three.js ✓ · R3F ✓ · GSAP ✓ · WebGL/GLSL ✓ · Canvas 2D ✓ ·
SVG animation ✓ · Motion Canvas ✓ · Manim ✓ · Blender Python ✓ · Procedural 3D ✓ ·
Procedural textures ✓ · Character design ✓ · Rigging ✓ · Skeletal animation ✓ · IK ✓ ·
Facial expressions ✓ · Shot detection ✓ · Frame-by-frame analysis ✓ · Style extraction ✓ ·
Storyboarding ✓ · Short-form storytelling ✓ · Music/audio ✓ · Subtitle sync ✓ · FFmpeg ✓ ·
Playwright/Puppeteer rendering ✓ · QC ✓ · Low-memory rendering ✓.

## Ecosystem-level observations

- The ecosystem is explainer-video-heavy (131 of 256 skills are explainer formats); character
  animation for serialized shows (the Ricks Clips / Drawn to Survive style) is the thinnest
  area — only 2 skills categorized `character-animation`.
- Nobody ships a maintained OpenCV/analysis skill; every repo assumes the CLI renders, not measures.
- HyperFrames is the only repo treating reverse-engineering as a first-class workflow, and it
  gates the best parts behind Pro.

## Recommended for the Ricks Clips / Drawn to Survive-inspired engine

1. `hyperframes` + `hyperframes-cli` + `motion-doctrine` — engine + doctrine baseline.
2. `remotion-best-practices` — for the React-component side of scenes.
3. `gsap-timeline` + `gsap-performance` — motion language shared by both engines.
4. `reverse-any-video` methodology (free parts) + Safiullah-Rahu explainer set — to blueprint
   the target shows' looks before building original scenes.
5. Visualx blender-agent pack — character rigging, NPR/cel shading, simulation once Blender is
   installed.
6. `voice-subtitle-sync` + music-video skills — audio-driven cut timing.
7. `particle-system`, `shader-glsl`, `wgpu-shaders` — signature VFX layers.
