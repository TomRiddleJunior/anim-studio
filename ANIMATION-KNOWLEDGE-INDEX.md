# ANIMATION KNOWLEDGE INDEX

Consolidated findings from studying the installed skills. Each entry points at the installed
skill — read its `SKILL.md` (and `references/`) rather than re-deriving content here.

## Engines (pick one first, per task)

| Engine | Entry skill | When |
|---|---|---|
| HyperFrames | `skills/heygen-com--hyperframes/hyperframes` + `hyperframes-cli` | HTML→MP4 deterministic video, motion blocks, registry of ready scenes |
| Remotion | `skills/remotion-dev--skills/remotion-best-practices` | React-based programmatic video, programmatic composition |
| Motion Canvas | `skills/Hmzbo--animation-skills/motion-canvas` | code-first 2D explainer animation, beat-synced |
| Manim | `skills/Hmzbo--animation-skills/manim` | math/formula animation |
| Three.js / R3F | `skills/Hmzbo--animation-skills/threejs`, `img2threejs` | 3D scenes in video |

## Best practices distilled (from the engine skills)

- **Deterministic over improvised**: every engine skill insists on fixed seed, fixed duration,
  data-driven scenes so renders are reproducible and diffable (`hyperframes check`,
  remotion's `--props` input pattern).
- **QA as a build step**: `hyperframes check` (errors, silent frames, overshoot), remotion's
  preview-then-render loop; treat QA as part of authoring, not an afterthought.
- **Beat-driven structure**: music-first workflows (`explainer-launch-promo`,
  `motion-graphics-music-video`, `world-briefing-music-video`) place cuts on audio beats; share
  the same timeline data between audio and scene files.
- **Type safety across the pipeline**: typed scene schemas (zod-style) in the Safiullah-Rahu
  explainer engines; validate scene JSON before render, fail early.
- **GSAP as the motion language**: `gsap-timeline` (master timeline = single source of truth),
  `gsap-scrolltrigger` (scrub-driven reveals), `gsap-performance` (transform-only properties,
  `will-change` discipline) — applies inside HyperFrames/Remotion DOM scenes too.

## Advanced rendering techniques found

- WebGL/WGPU shader pipelines: `skills/Hmzbo--animation-skills/wgpu-shaders`, `shader-glsl`
  (3d-web) — fragment-shader backgrounds, post-processing chains.
- 3D diorama / glass-bubble / luminous-cosmos looks (madhavsomani 3D set): layered
  orthographic/isometric cameras, emissive materials, fog for depth.
- Cel/NPR: Blender NPR pack (see `skills/VisualxIntelligence--motion-tools-and-skills/` —
  28 blender-agent skills incl. rigging, simulation, procedural modeling).
- Particle systems: `particle-system` (3d-web) — GPU-instanced particles with CPU fallback.

## Reusable character systems

- `skills/nessalazne--animation-agent-skill/animate` — grammar for character animation styles.
- VisualxIntelligence blender-agent pack — rigging, IK, facial expression, lip sync skills.
- Character proportion analysis appears in the reverse-engineering set (below).

## Reverse-engineering implementations (the priority, §3)

See [REVERSE-ENGINEERING-TOOLKIT.md](REVERSE-ENGINEERING-TOOLKIT.md) — 131 skills catalogued
under category `reverse-engineering`, led by HyperFrames `reverse-any-video` (Pro-gated),
`style-sampling`, `remotion-to-hyperframes`, plus the Safiullah-Rahu explainer suite as a
ready-made library of reverse-engineered formats.

## Known rendering defects & performance techniques

- Silent-frame and overshoot detection: documented in `hyperframes check` (engine-hyperframes).
- Font flicker/loading races in headless render: remotion `delay-render` / HyperFrames
  font-prefetch patterns (check each engine's CLI skill before first render).
- Memory: low-memory rendering guidance in `gsap-performance` and remotion's concurrency
  settings; on this 16 GB box render at concurrency 2–4, 720p test first (Mission §5 allows
  3–5 s / 720p validation renders).

## Quality-control methodology

Author → `hyperframes check` / schema validation → 3–5 s 720p test render → contact sheet
compare (reverse-engineering skills) → full render. Keep renders out of git (gitignored).

## Duplicates/overlap discipline

Before writing a new technique, check `skills/DUPLICATES.md` — several explainer skills exist
in 2–3 variants; prefer the upstream author's (heygen for HyperFrames-related, remotion-dev for
Remotion-related).
