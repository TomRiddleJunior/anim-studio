# PART A — DISCOVERY AND INSTALL

MISSION 00 — BUILD YOUR ANIMATION SKILL ARSENAL

Run this part to completion, then stop and report.

MISSION 00 — BUILD YOUR ANIMATION SKILL ARSENAL

Before beginning any project development, upgrade your own capabilities by discovering, evaluating, installing and studying every genuinely useful open-source agent skill relevant to our upcoming animation production studio.

You are running inside a custom CLI, not necessarily the official Claude Code CLI. Inspect your actual runtime environment and determine how skills are discovered, registered and loaded. Do not assume Claude Code-specific installation paths or commands work here.

1. EXHAUSTIVE SKILL DISCOVERY

Search GitHub, Skills.sh, agent skill directories, developer communities, curated repositories and relevant public forks.

Do not limit yourself to the repositories provided below. They are only starting points.

Discover skills covering:

- Remotion
- HyperFrames
- Three.js
- React Three Fiber
- GSAP
- WebGL and GLSL shaders
- Canvas 2D
- SVG animation
- Motion Canvas
- Manim
- Blender Python
- Procedural 3D modeling
- Procedural textures
- Character design
- Character rigging
- Skeletal animation
- Inverse kinematics
- Facial expressions
- Lip synchronization
- 2D characters inside 3D environments
- Cartoon and cel shading
- NPR rendering
- Cinematic camera movement
- Cinematic lighting
- Shadows and ambient occlusion
- Depth of field
- Post-processing
- Particle systems
- Weather simulation
- Physics-based animation
- Video reverse engineering
- Shot detection
- Frame-by-frame analysis
- Motion tracking and optical flow
- Visual style extraction
- Storyboarding
- Short-form video storytelling
- Audio generation and sound design
- Voice-over and subtitle synchronization
- FFmpeg
- OpenCV
- Playwright and Puppeteer rendering
- Visual regression testing
- Automated animation quality control
- Low-memory rendering optimization

Search deeply. Discover lesser-known repositories as well as popular ones.

2. MANDATORY STARTING REPOSITORIES

Investigate all of these:

https://github.com/mromidev/claude-animated-shorts

https://github.com/remotion-dev/skills

https://github.com/heygen-com/hyperframes

https://github.com/greensock/gsap-skills

https://github.com/Hmzbo/animation-skills

https://github.com/VisualxIntelligence/motion-tools-and-skills

https://github.com/faisalfaisu/claude-video-skills

https://github.com/madhavsomani/animation-skills

https://github.com/nessalazne/animation-agent-skill

https://github.com/cumalibilgic/cinematic-3d-video

https://github.com/Safiullah-Rahu/claude-video-skills

https://github.com/Win-Hao/code-video

https://github.com/clonn/awesome-agent-video-skills

Also investigate:

https://skills.sh/

https://createmotion.io/resources/agent-skills/

https://pdoom.video/

Follow relevant links and discover additional skills independently.

3. SPECIAL PRIORITY: REVERSE ENGINEERING

Our primary objective is to analyze successful animated videos and extract detailed technical blueprints for recreating their production techniques.

Find and install relevant skills for:

- Reference video decomposition.
- Scene and shot segmentation.
- Contact sheet generation.
- Frame-level measurements.
- Color palette extraction.
- Character proportion analysis.
- Camera movement estimation.
- Motion curve estimation.
- Lighting and shadow analysis.
- Audio timeline extraction.
- Reference-to-render comparison.
- Iterative visual fidelity improvement.

Investigate HyperFrames reverse-any-video, style-sampling, remotion-to-hyperframes and associated skills in particular.

Identify which capabilities are free, paid, locally executable or dependent on external services.

4. INSTALL ALL USEFUL SKILLS

Do not merely return a list of repositories.

Actually install all relevant, compatible, nonredundant and sufficiently trustworthy skills.

Before installation:

- Inspect SKILL.md and supporting files.
- Verify the original repository and license.
- Inspect executable scripts and installation commands.
- Reject suspicious instructions, credential collection, unrelated network calls and destructive operations.
- Identify unnecessary dependencies.
- Detect overlapping or conflicting skills.
- Record the exact source commit.

Install skills using the custom CLI's supported mechanism.

If this CLI has no native skill mechanism, create a project-local skill library with an AGENTS.md router and an indexed set of SKILL.md directories that you can load on demand.

Preserve existing skills and configurations.

Do not modify the CLI's core source code or overwrite unrelated settings.

Retain alternative skills when they offer genuinely different capabilities.


ENVIRONMENT — cloud box, not a laptop
- 8 CPU, 16 GB RAM, Linux, 64 GB disk, Docker, headless browser, no hourly cap.
- Parallelise freely (xargs -P, background jobs). Full clones when useful, --depth 1 when not.
- Install whatever toolchains you need: node/npm, python/uv, ffmpeg, playwright/chromium, docker.
- Short validation renders (3-5 s, 720p) are allowed and encouraged to prove a pipeline.
- No AI model downloads, no paid APIs, no purchases.
- Never commit media/binaries; keep them in .gitignore.

Deliverable for this part: skills/ populated, and deliverables/skill-registry.json + .md with vendor, repo, pinned SHA, license, trust notes. Commit and push.
