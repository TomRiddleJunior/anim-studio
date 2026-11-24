# SKILL INSTALLATION REPORT

Date: 2026-11-24 · Cloud box: Ubuntu, 8 CPU, 16 GB RAM, 51 GB free at start.

## Headline numbers

| Metric | Value |
|---|---|
| Repositories investigated | **17** (13 mandatory GitHub + anthropics/skills + 3 web directories) |
| Unique skills discovered | **343** SKILL.md files across 14 cloned repos |
| Skills installed | **256** (nonredundant after dedup pass; `.claude`/`.agents` copies de-duplicated) |
| Skills verified loadable | **256/256** — valid `name`+`description` frontmatter, file readable end-to-end |
| Rejected | 87 discovered-but-not-installed: 37 anthropics skills out of scope, 50 via dedup (see below) |
| Disk consumed | ~560 MB clones in /tmp (dropped after install) · 265 MB installed skills on disk · **~122 MB committed** (media/fonts/binaries git-ignored) |

## Method

1. Probed all 13 mandatory repos with `git ls-remote` — 13/13 exist; captured HEAD SHAs.
2. Shallow-cloned (`--depth 1`) all 13 + `anthropics/skills` in parallel (~10 s total).
3. Extracted `name`/`description` from every SKILL.md → master catalog (343 entries).
4. Security screen: grep for pipe-to-shell, `eval`, `base64 -d`, `Invoke-Expression`, hardcoded
   API keys across all 343 files — **zero hits**; flagged `npm install` mentions were benign docs.
5. Installed per skill directory with `rsync -a --max-size=900k` (drops oversized binaries at
   source), excluding node_modules and media extensions.
6. De-duplicated: hyperframes `.claude` == `.agents` (diff-verified, installed once); ~20 name
   collisions between faisalfaisu / VisualxIntelligence / Safiullah-Rahu kept as namespaced
   variants (content differs — see skills/DUPLICATES.md).
7. Validated frontmatter on all installed skills: 256 valid / 0 invalid.
8. Wrote `.gitignore` rules (fonts, audio, images, video, archives, 3D formats, vendored JS
   bundles) so the commit holds text only, per Mission 00 §5.

## Status classification (Mission 00 §8)

- **Installed and load-verified:** 256.
- **Installed but runtime dependencies pending:** Blender-dependent skills (26 in 3d-blender) —
  Blender is not installed on this box; skills read fine, `blender` binary needed to execute.
  Playwright-dependent skills — `playwright` not yet in python3 env (browser tool exists for
  agent-side checks; install on first render need). OpenCV-dependent skills — not installed.
- **Downloaded for research only:** clonn/awesome-agent-video-skills (list repo, no skills);
  ~37 anthropics/skills outside animation scope.
- **Incompatible:** none found.
- **Duplicate:** hyperframes `.claude` set; overlapping explainer variants kept deliberately
  (genuinely different content), catalogued in skills/DUPLICATES.md.
- **Rejected:** no skill rejected for security reasons (screen was clean).
- **Requires paid services:** `reverse-any-video`, `style-sampling` (HyperFrames Pro core
  workflow); Remotion company license for commercial-scale rendering.

## Toolchain present on the box (checked)

Node 24.22.1 ✓ · ffmpeg 8.0.1 ✓ · Python 3.14 ✓ · Playwright Chromium via built-in browser tool ✓
Missing on demand: `blender` (apt-installable when a 3D task needs it), `opencv` (pip).

## Environment used for install

- Clones: `/tmp/skillresearch/<org>__<repo>` — safe to delete; reinstall procedure in
  [skills/INSTALL-MANIFEST.md](skills/INSTALL-MANIFEST.md).
- Install destination: `skills/` in this repo (project-local library, Mission 00 §4).
