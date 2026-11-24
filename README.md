# Animation Studio — cloud workspace

Mission 00: build the animation/video/motion skill arsenal. See `prompts/`.

## What's here

- `skills/` — project-local skill library: **256 skills** installed from 14 GitHub repos
  (HyperFrames, Remotion, GSAP, 3 explainer-video libraries, Blender agent pack, …).
  Full catalog: `skills/INDEX.md`. Install/update notes: `skills/INSTALL-MANIFEST.md`.
- Repo-root deliverables (Mission 00 §6):
  - `SKILL-REGISTRY.md` + `SKILL-REGISTRY.json` — every skill: source, SHA, capabilities,
    triggers, dependencies, license, cost, status.
  - `SKILL-INSTALLATION-REPORT.md` — how many found/installed/verified, method, rejections.
  - `ANIMATION-KNOWLEDGE-INDEX.md` — best practices, advanced techniques, QC methodology.
  - `REVERSE-ENGINEERING-TOOLKIT.md` — the reference-video analysis workflow.
  - `MISSING-CAPABILITIES.md` — gaps in topic coverage.
- `AGENTS.md` — router: how the agent picks and loads a skill for a given task.

Media/font/binary assets of the skills are on disk but **git-ignored** (no binaries in git).
