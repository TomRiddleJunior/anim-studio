# Skill Registry — animation / video / motion arsenal

Mission 00. Every public skill repository for animation, video and motion that could be
discovered, screened and installed as of 2026-11-24. Installed skills live in this directory,
one subdirectory per source repo. See [INDEX.md](INDEX.md) for the full per-skill catalog and
[DUPLICATES.md](DUPLICATES.md) for name collisions.

Sources probed but **not** skill registries: `skills.sh` (aggregator listing the repos below),
`createmotion.io/resources/agent-skills` (gallery, links back to hyperframes/remotion),
`pdoom.video` (portfolio, no skills).

## Install decision (all 13 mandatory sources)

| # | Repository | Skills | Installed | License | Notes |
|---|------------|--------|-----------|---------|-------|
| 1 | `heygen-com/hyperframes` | 22 (9 skills + 6 agent skills + 7 registry blocks) | ✅ all | Apache-2.0 | **Highest priority.** Core engine: `hyperframes`, `hyperframes-cli`, `reverse-any-video`, `style-sampling`, `remotion-to-hyperframes`. Paid-plan gates noted in CURATION.md |
| 2 | `remotion-dev/skills` | 14 | ✅ all | Custom (Remotion terms; free for individuals/small teams) | `remotion-best-practices` + programmatic-video suite |
| 3 | `greensock/gsap-skills` | 8 | ✅ all | MIT | GSAP core, ScrollTrigger, timeline, React, performance |
| 4 | `Hmzbo/animation-skills` | 6 | ✅ all | MIT | OSS / proprietary-free / source-available animation packs |
| 5 | `VisualxIntelligence/motion-tools-and-skills` | 64 | ✅ all | MIT | Largest collection: 28 Blender agent skills, video-production suite, motionmaxxing runtime |
| 6 | `faisalfaisu/claude-video-skills` | 41 | ✅ all | MIT | Explainer/video craft; shares ~20 skill names with #5 (kept both, namespaced) |
| 7 | `Safiullah-Rahu/claude-video-skills` | 62 | ✅ all | MIT | 62 explainer-engine variants reverse-engineered from viral reels; largest repo (453 MB, media stripped here) |
| 8 | `madhavsomani/animation-skills` | 16 | ✅ all | MIT | Explainer formats (board, canvas, dossier, pixel-arcade, 3D dioramas) |
| 9 | `mromidev/claude-animated-shorts` | 1 | ✅ | MIT | Single top-level `animated-shorts` skill |
| 10 | `nessalazne/animation-agent-skill` | 1 | ✅ | MIT | `animate` plugin skill (grammar, styles, kit, templates) |
| 11 | `cumalibilgic/cinematic-3d-video` | 1 | ✅ | MIT | Single `cinematic-3d-video` skill |
| 12 | `Win-Hao/code-video` | 1 | ✅ | MIT | `code-video` (code-to-video explainers) |
| 13 | `clonn/awesome-agent-video-skills` | 0 SKILL.md | ➖ nothing to install | — | Curated *list* repo (awesome-list), links out only |

Plus one non-mandatory addition:

| Source | Skills | Installed | License | Why |
|--------|--------|-----------|---------|-----|
| `anthropics/skills` | 19 of ~40 | ✅ relevant subset | MIT-style (anthropics) | Upstream canonical examples (canvas-design, docx, pptx, xlsx, pdf, artifacts-builder…) — useful utilities, not animation-specific |

**Totals: 256 skills installed across 14 repos.** All 256 have valid `name`/`description`
frontmatter (verified programmatically).

## Env-report artifacts (install report)

- **Clones:** `/tmp/skillresearch/<org>__<repo>` (shallow, depth 1).
- **Registry decision tree:** web sources checked first (skills.sh, createmotion.io, pdoom.video),
  all pointed back to GitHub repos in the table above — no additional registries found.
- **Security screen:** grep over all 343 discovered SKILL.md for pipe-to-shell, `eval`,
  `base64 -d`, hardcoded API keys — **zero hits**. `.claude` duplicates in hyperframes verified
  byte-identical to `.agents` and installed once.
- **Push safety:** media/fonts/audio/binary assets are on disk but git-ignored (see `.gitignore`
  at repo root); vendored JS bundles (`three.*.js`, `gsap.min.js`, …) likewise. Only text
  (SKILL.md, references, scripts, templates) is committed.

## Priority skills (mission-specified)

1. `heygen-com--hyperframes/reverse-any-video` — reverse-engineer any video into a HyperFrames project. **Requires HyperFrames Pro plan for full functionality.**
2. `heygen-com--hyperframes/style-sampling` — sample a style and apply it to renders. **Requires HyperFrames Pro plan.**
3. `heygen-com--hyperframes/remotion-to-hyperframes` — migrate Remotion projects to HyperFrames.
4. `heygen-com--hyperframes/hyperframes` — the core engine skill ("read first" for any video work).
