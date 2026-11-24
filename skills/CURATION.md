# Curation — why each source made the cut, and what was skipped

## Selection criteria

1. Does it teach the agent to **make video/animation** (not just talk about it)?
2. Is it maintained and does it ship a real `SKILL.md` with trigger descriptions?
3. License permits redistribution with attribution (MIT / Apache / Remotion terms).
4. No security red flags (see INSTALL-MANIFEST.md screen).

## Kept, and what each adds

- **heygen-com/hyperframes** — the one engine skill set that treats "HTML → deterministic video"
  as a first-class workflow, with CLI, QA checks, style sampling and reverse-engineering.
  Highest value per byte; loaded first for any video task.
- **remotion-dev/skills** — canonical programmatic-video practices straight from Remotion.
- **greensock/gsap-skills** — the motion-language layer (timelines, easing, scroll) used by both
  engines above.
- **Safiullah-Rahu & faisalfaisu & madhavsomani & VisualxIntelligence** — large libraries of
  finished *formats* (explainer genres, Blender pipelines, motion runtimes). Treat as a style
  library: pick by target look, don't load wholesale.
- **anthropics/skills (subset)** — adjacent craft (canvas-design, artifacts) and generic document
  skills; installed only the 19 relevant to visual/document output.

## Skipped / not installed, and why

- `clonn/awesome-agent-video-skills` — an awesome-list; contains **no SKILL.md** files, only
  links (its value is already reflected in REGISTRY.md).
- `anthropics/skills` non-visual skills (e.g. server/admin-type skills) — out of scope for an
  animation arsenal; on disk in `/tmp/skillresearch` if ever needed.
- Media/fonts/binary assets inside every skill — git-ignored by policy; rsync dropped files
  > 900 KB entirely.

## Plan gates to know before first use

- HyperFrames Pro (paid) unlocks the full `reverse-any-video` and `style-sampling` workflows;
  the skills install and read fine, feature runs will tell you when the plan is required.
- Remotion: rendering company-owned videos at scale needs Remotion's company license.
