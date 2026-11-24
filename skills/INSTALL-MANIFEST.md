# Installation Manifest — Mission 00

Date: 2026-11-24 · Machine: ML.ai cloud box (Ubuntu, 8 CPU, 16 GB RAM) · Method: shallow clone
(`git clone --depth 1`) + `rsync -a --max-size=900k` per skill directory.

## Source commit SHAs (HEAD at install time)

```
mromidev/claude-animated-shorts             e3b817b6afc6cd413466d43f11ba31209e034bbf
remotion-dev/skills                         a3f4098a2afd0e13f6a6f8c8760e275f75457ea9
heygen-com/hyperframes                      5a15b549b65b523e2ffcad0bd4ffe3ecb730ef76
greensock/gsap-skills                       aed9cfd3277740755f6bfc1155c7aa645403b760
Hmzbo/animation-skills                      42dd41ec0b700999d2d013f19affa3c72333f265
VisualxIntelligence/motion-tools-and-skills 69eb0c3d362d4740cacf7b619b1bdf40d3c2c752
faisalfaisu/claude-video-skills             67b36164386277703c5cfbdf2c6f66f8856f6cc5
Safiullah-Rahu/claude-video-skills          3842756bd657b227e2b791024358abb92f714d78
madhavsomani/animation-skills               d2b562dd4a0aa1a8cf7d6a35b6719318cf372c51
nessalazne/animation-agent-skill            51c22ed815ff799222d1d9a6883734245e25692f
cumalibilgic/cinematic-3d-video             ef6cbdc15c55788348402aa42f1caab8396bb496
Win-Hao/code-video                          6e806a5a14d7270f5e726cd07d16b4ef7fb4d2c9
clonn/awesome-agent-video-skills            5747288335fffc2f599cde0d41f0dd54d700f51d
anthropics/skills                           e4bb5d960d87126ff3b3a8af1a104b7db67560ba
```

## What was installed

- Destination: `skills/<org>--<repo>/<skill-name>/` — each directory contains the skill's
  `SKILL.md` plus its references/scripts/templates.
- `256` SKILL.md files installed; frontmatter validated: **256 valid / 0 invalid**.
- HyperFrames registry blocks are under `skills/heygen-com--hyperframes/blocks/<block>/`.
- The `nessalazne` plugin skill is flattened to `skills/nessalazne--animation-agent-skill/animate/`.
- Single-skill repos (`mromidev`, `cumalibilgic`) keep their skill name, not the repo name.

## What was NOT committed (on disk only)

Per mission section 5 ("do not commit media/binaries"), the repo `.gitignore` excludes, inside
`skills/` only:

- Fonts: `*.ttf *.otf *.woff *.woff2`
- Audio: `*.m4a *.mp3 *.wav *.aiff *.aac *.ogg *.flac`
- Images/video: `*.jpg *.jpeg *.png *.webp *.gif *.bmp *.mp4 *.mov *.webm *.mkv *.avi`
- Archives/documents/3D: `*.zip *.tar* *.tgz *.pdf *.psd *.blend* *.glb *.gltf *.fbx *.obj *.exr *.hdr`
- Vendored JS bundles: `three.module*.js`, `three.core*.js`, `three.main.js`, `glass-main.js`,
  `opentype.module.js`, `gsap.min.js`
- Any single file > 900 KB was dropped at rsync time (`--max-size=900k`), so no oversized
  assets exist even on disk.

## Known plan/feature gates (documented in skill bodies, not errors)

- `heygen-com--hyperframes/reverse-any-video`: core workflow needs a **HyperFrames Pro** plan.
- `heygen-com--hyperframes/style-sampling`: Pro-plan gated.
- `remotion-dev/skills`: Remotion's own license applies to the videos you render (free for
  individuals and small companies; buy a company license otherwise) — `/remotion-license`.

## Reinstall / update procedure

```bash
git clone --depth 1 https://github.com/<org>/<repo> /tmp/skillresearch/<org>__<repo>
rsync -a --max-size=900k --exclude node_modules --exclude '.git' \
      /tmp/skillresearch/<org>__<repo>/<skillPath>/ skills/<org>--<repo>/<skill>/
python3 -c "import re,pathlib; [print(f) for f in pathlib.Path('skills').rglob('SKILL.md') \
  if not re.match(r'^---\n.*\bname:', f.read_text(errors='ignore'), re.S)]"
```

Then update `skills/INDEX.md` (regenerate from frontmatter), bump the SHA in this file, commit.
