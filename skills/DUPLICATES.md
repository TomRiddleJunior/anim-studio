# Duplicate & Overlap Map

Same skill name appeared in multiple source repos. Skills are namespaced by repo directory, so
nothing was overwritten — all variants are kept and listed here so the right one gets loaded.

## Exact name collisions (different content, both kept)

| Skill name | Variants (namespace / directory) | Difference |
|---|---|---|
| `video-shotcraft` | `faisalfaisu--claude-video-skills/video-shotcraft` · `VisualxIntelligence--motion-tools-and-skills/video-shotcraft` | Content differs (diff-verified); one is shot-grammar craft, the other shot-list tooling |
| `painted-animation` | `faisalfaisu--...` · `VisualxIntelligence--...` | Content differs |
| `remotion-to-hyperframes` | `heygen-com--hyperframes/remotion-to-hyperframes` · `faisalfaisu--claude-video-skills/remotion-to-hyperframes` | Content differs; **prefer the heygen one** (upstream author of HyperFrames) |
| ~17 more shared names across faisalfaisu / VisualxIntelligence / Safiullah-Rahu explainer suites (e.g. explainer-engine variants) | see INDEX.md | Same genre, different reverse-engineered source reels; pick by desired style |

## Verified identical (installed once)

- `heygen-com/hyperframes` ships the same skills under `.agents/skills/` and `.claude/skills/`;
  byte-identical SKILL.md (diff-verified), installed once from `.agents/skills/`.

## Same genre, different names (not collisions, but overlapping)

- Reverse-engineering a reference video: `reverse-any-video` (heygen, Pro-gated) vs the 62
  `explainer-*` skills (Safiullah-Rahu), which are themselves reverse-engineered formats —
  use `reverse-any-video` for arbitrary videos, the explainer suite for known styles.
- Kinetic typography: `kinetic-typography` (VisualxIntelligence) vs `kinetic-word-edit`
  (Safiullah-Rahu) vs `hyperframes-kinetic-type` (heygen blocks).
- Code-to-video: `code-video` (Win-Hao) vs `remotion-best-practices` (remotion-dev).
