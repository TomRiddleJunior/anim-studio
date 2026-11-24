# REVERSE-ENGINEERING TOOLKIT

Mission 00 §3: analyzing successful animated videos and extracting technical blueprints.
131 of the 256 installed skills are in the `reverse-engineering` category — the full list is in
[SKILL-REGISTRY.json](SKILL-REGISTRY.json) (filter `category == "reverse-engineering"`).

## Core workflow (load these first)

| Step | Skill | Path | Cost |
|---|---|---|---|
| 1. Decompose reference video | `reverse-any-video` | `skills/heygen-com--hyperframes/reverse-any-video` | free skill; **full workflow needs HyperFrames Pro** |
| 2. Sample the visual style | `style-sampling` | `skills/heygen-com--hyperframes/style-sampling` | free skill; **Pro for full workflow** |
| 3. Rebuild as HyperFrames project | `hyperframes` + `hyperframes-cli` | `skills/heygen-com--hyperframes/` | free |
| 4. Migrate existing Remotion project | `remotion-to-hyperframes` | `skills/heygen-com--hyperframes/remotion-to-hyperframes` | free |
| 5. QA the rebuild | `hyperframes check` (via `hyperframes-cli`) + contact-sheet compare | — | free |

## Capability → installed skills

- **Reference video decomposition / scene-shot segmentation** — `reverse-any-video`;
  `video-shotcraft` (faisalfaisu + Visualx variants); `video-source-index`.
- **Contact sheet generation** — documented inside `reverse-any-video` workflow; FFmpeg
  `tile`/`select` one-liners (ffmpeg present on this box).
- **Frame-level measurements / camera movement / motion curves** — `reverse-any-video`
  measurement pass; `optical-flow`-style estimation via OpenCV (needs `pip install opencv-python`).
- **Color palette extraction** — palette step in `style-sampling`; fallback: ImageMagick
  (`magick convert frame.png -colors 8 -unique-colors txt:`) or Python (PIL + k-means).
- **Character proportion analysis** — proportion-measurement guidance in the explainer-engine
  skills (Safiullah-Rahu set) and blender character skills.
- **Lighting / shadow analysis** — `seam-craft`, `motion-doctrine` (heygen) + blender lighting
  skills (Visualx pack).
- **Audio timeline extraction** — `voice-subtitle-sync`, `embedded-captions` (Safiullah-Rahu);
  ffmpeg for waveform/beat extraction.
- **Reference-to-render comparison / iterative fidelity** — `reverse-any-video` compare step;
  Playwright screenshot diff of HyperFrames frames vs reference frames (browser tool built in).
- **Ready-made blueprint library** — 62 reverse-engineered explainer formats
  (`skills/Safiullah-Rahu--claude-video-skills/`), 41 more (`faisalfaisu--…`), 16 explainer
  genres (`madhavsomani--…`). Pick by target look before writing anything new.

## Free vs paid vs local vs service

- **Free & local:** hyperframes CLI skills, remotion-dev skills, all explainer blueprint skills,
  ffmpeg/opencv/Playwright-based measurement (tools already on this box or pip-installable).
- **Paid:** HyperFrames Pro unlocks the full `reverse-any-video` and `style-sampling` pipelines.
  The skill files document their steps and are still usable as methodology, and most measurement
  steps are reproducible with ffmpeg + OpenCV + ImageMagick at zero cost.
- **No AI model downloads / no paid APIs** per Mission §5 — analysis runs on local tools.
