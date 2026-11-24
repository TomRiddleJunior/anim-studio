# SKILL-REGISTRY — animation / video / motion arsenal

Machine-readable twin: [SKILL-REGISTRY.json](SKILL-REGISTRY.json) (256 skills, full fields).
Full per-skill catalog with descriptions: [skills/INDEX.md](skills/INDEX.md).
Installed under `skills/<org>--<repo>/<skill>/`, each with its own `SKILL.md`.

Field definitions follow Mission 00 §6. Per-skill "usage triggers" are the quoted trigger
phrases in each SKILL.md description; "verification" = frontmatter valid + file readable
through the project-local router (no render executed).

## Sources (14 repositories, exact commit SHAs at install time)

| Source repo | SHA | Skills installed | License | Status |
|---|---|---|---|---|
| heygen-com/hyperframes | `5a15b549b65b523e2ffcad0bd4ffe3ecb730ef76` | 22 | Apache-2.0 | installed, load-verified |
| remotion-dev/skills | `a3f4098a2afd0e13f6a6f8c8760e275f75457ea9` | 14 | Remotion terms | installed, load-verified |
| greensock/gsap-skills | `aed9cfd3277740755f6bfc1155c7aa645403b760` | 8 | MIT | installed, load-verified |
| Hmzbo/animation-skills | `42dd41ec0b700999d2d013f19affa3c72333f265` | 6 | MIT | installed, load-verified |
| VisualxIntelligence/motion-tools-and-skills | `69eb0c3d362d4740cacf7b619b1bdf40d3c2c752` | 64 | MIT | installed, load-verified |
| faisalfaisu/claude-video-skills | `67b36164386277703c5cfbdf2c6f66f8856f6cc5` | 41 | MIT | installed, load-verified |
| Safiullah-Rahu/claude-video-skills | `3842756bd657b227e2b791024358abb92f714d78` | 62 | MIT | installed, load-verified |
| madhavsomani/animation-skills | `d2b562dd4a0aa1a8cf7d6a35b6719318cf372c51` | 16 | MIT | installed, load-verified |
| mromidev/claude-animated-shorts | `e3b817b6afc6cd413466d43f11ba31209e034bbf` | 1 | MIT | installed, load-verified |
| nessalazne/animation-agent-skill | `51c22ed815ff799222d1d9a6883734245e25692f` | 1 | MIT | installed, load-verified |
| cumalibilgic/cinematic-3d-video | `ef6cbdc15c55788348402aa42f1caab8396bb496` | 1 | MIT | installed, load-verified |
| Win-Hao/code-video | `6e806a5a14d7270f5e726cd07d16b4ef7fb4d2c9` | 1 | MIT | installed, load-verified |
| clonn/awesome-agent-video-skills | `5747288335fffc2f599cde0d41f0dd54d700f51d` | 0 | — | rejected as skill source (link list, no SKILL.md) |
| anthropics/skills | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | 19 (relevant subset) | MIT | installed, load-verified |

Web sources investigated with no additional skills found: skills.sh (aggregator — indexes the
GitHub repos above), createmotion.io/resources/agent-skills (gallery → same repos), pdoom.video
(portfolio site, no skills). **Total repos investigated: 17.**

## Capability categories (skills organized for automatic selection)

| Category | Count | Load for tasks about… |
|---|---|---|
| reverse-engineering | 131 | reference-video decomposition, shot/frame/palette/proportion analysis, explainer format reconstruction |
| 3d-blender | 26 | Blender Python, rigging, NPR, simulation, procedural modeling |
| general-video | 19 | general video production that doesn't fit a named engine |
| format-explainer | 17 | finished explainer genres (board, canvas, dossier, pixel-arcade, dioramas) |
| engine-remotion | 16 | Remotion projects and programmatic video |
| audio-sound | 14 | music, voice-over, subtitle sync, sound design |
| 3d-web | 12 | Three.js, R3F, shaders, particles, cinematic 3D |
| documents | 6 | pptx/xlsx/docx/pdf outputs |
| 2d-web | 6 | SVG/Canvas 2D/CSS/kinetic typography |
| motion-language-gsap | 5 | GSAP timelines, ScrollTrigger, performance |
| character-animation | 2 | character systems |
| tooling-pipeline | 2 | skill authoring, GIF tooling |

Paid/plan gates: `reverse-any-video` and `style-sampling` (HyperFrames Pro for full workflow);
Remotion company license for commercial rendering. Everything else free.

## How this CLI loads them

This workspace's agent loads skills through the repo-root `AGENTS.md` router (Mission 00 §4
"project-local skill library"): it points every animation/video/motion request at
`skills/INDEX.md`, and INDEX.md routes by category table above. No CLI-specific install path was
overwritten; no core source was modified.
