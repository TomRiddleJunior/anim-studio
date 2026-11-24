# Agent Router — animation skill library (Mission 00)

This repo is an animation production studio. Before doing ANY animation, video, motion,
rendering or reverse-engineering task, consult the project-local skill library instead of
re-deriving techniques:

1. **Route by task** using the category table in `SKILL-REGISTRY.md` (§ Capability categories).
2. **Find the exact skill** in `skills/INDEX.md` (full catalog, 256 skills) or filter
   `SKILL-REGISTRY.json` by `category` / `usage_triggers`.
3. **Read the chosen skill's `SKILL.md`** (plus its `references/`) from
   `skills/<org>--<repo>/<skill>/` and follow it.
4. For reverse-engineering a reference video, start with `REVERSE-ENGINEERING-TOOLKIT.md`.
5. Check `skills/DUPLICATES.md` before picking between same-named variants.

Rules of engagement:

- Do not commit media/binaries: fonts, images, audio, video and vendored JS bundles under
  `skills/` are on disk but git-ignored (`.gitignore`). Reinstall missing assets per
  `skills/INSTALL-MANIFEST.md`.
- Validate renders cheaply first: 3–5 s at 720p (the box has no GPU; keep concurrency low).
- Load-verified status per skill is recorded in `SKILL-REGISTRY.json` (`verification_status`).
- Registry docs at repo root: `SKILL-REGISTRY.md` · `SKILL-REGISTRY.json` ·
  `SKILL-INSTALLATION-REPORT.md` · `ANIMATION-KNOWLEDGE-INDEX.md` ·
  `REVERSE-ENGINEERING-TOOLKIT.md` · `MISSING-CAPABILITIES.md`.
