export const meta = {
  name: 'ai-clip-picks',
  description: 'Pick the best commercially-safe library clip, in-point, speed and camera move for every storyboard shot of THE STATE OF AI by viewing frames; supervisor check per group; global reuse/adjacency pass',
  phases: [
    { title: 'Pick', detail: 'one picker per chapter group views candidate clips and chooses per shot' },
    { title: 'Check', detail: 'a footage supervisor verifies each pick by frames' },
    { title: 'Global', detail: 'film-wide reuse / adjacency / variety pass' },
  ],
}
const ROOT = 'state-of-ai'
const FF = 'ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe'
const GROUPS = [
  { key: 'bookends', chapters: ['cold', 'intro', 'outro'] },
  { key: 'race', chapters: ['s01', 's02', 's03', 's04', 's05', 's06'] },
  { key: 'hooks', chapters: ['s07', 'chorus1', 'chorus2', 'chorus3'] },
  { key: 'brakes', chapters: ['s08', 's09', 's10', 's11', 's12', 's13', 's14'] },
  { key: 'good-dates', chapters: ['s15', 's16', 'dates'] },
]
const PICKS = {
  type: 'object',
  properties: {
    picks: { type: 'array', items: { type: 'object', properties: {
      shot: { type: 'string', description: 'storyboard shot id (e.g. B02); for split montage shots the base id (e.g. P03)' },
      file: { type: 'string', description: 'library file, repo-relative (footage/raw/<set>/<name>.mp4); omit for split shots or ground-only shots' },
      in: { type: 'number', description: 'seconds into that FILE where the shot starts' },
      speed: { type: 'number', description: 'playback speed, default 1 (0.5–1.5 fine; <1 slow-mo)' },
      cam: { type: 'object', description: 'optional camera move {z:[z0,z1], x:[x0,x1], y:[y0,y1]} — zoom ≥ 1 (1 = cover), pans in frame fractions ±0.08' },
      split: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, in: { type: 'number' } }, required: ['file', 'in'] }, description: 'for montage (split) shots: the clips in order, one per sub-shot' },
      ground: { type: 'string', description: '"black"/"white" to keep a ground-only shot' },
      reason: { type: 'string' } }, required: ['shot', 'reason'] } },
    notes: { type: 'string' },
  },
  required: ['picks'],
}
const BRIEF = `Project ${ROOT}: "THE STATE OF AI · OCTOBER 2026", a 3:00 fact-checked music video (128 BPM electroclash, deadpan spoken facts,
sung choruses) on the ESCAPE VELOCITY engine: real royalty-free footage under a broadcast chrome and a code-drawn explaining layer.
Grade/mood: cold blue-black night tech for the verses, neon/strobe energy in choruses 1–2, a hopeful teal-ish bridge (s15–s16: orbit
hurricanes, radiology), a white high-key final chorus (chorus3, paper polarity), black for the outro. READ: ${ROOT}/MOTION.md (zones: lyric
block top-left x72–1100 y110–430; chapter graphics mostly in the right two-thirds x1080–1830 y250–990 and lower-left; chrome edges),
${ROOT}/storyboard.json (each shot: 'set' = default footage set, 'note' = the idea + beat id), ${ROOT}/out/board.json (resolved t0/t1 per shot
in seconds = the duration each shot needs; lyric lines with word times = what is said on each shot). The explaining layer is already
designed: dev renders in ${ROOT}/out/dev/ and the final-audit stills in ${ROOT}/out/dev/final-audit/ (f_<time>.png) show where each
chapter's panels sit — prefer footage whose subject/energy sits where the graphics are NOT (often centre-left or a clean wide), and whose
motion lands on the cut.
Library: ${ROOT}/footage/raw/<set>/manifest.jsonl (one JSON per clip: file, duration, w×h, 'use' range, score, notes, tags, licence) — skip
anything in that set's rejects.jsonl (rejected = Mixkit Restricted licence, AI-generated, CG, logos, weak). ONLY pick from the library.
Contact sheets: \`python tools/footage.py sheet <set>\` → footage/raw/<set>/_sheet.jpg (Read it). Inspect a moment:
\`"${FF}" -v error -ss <sec> -i <file> -frames:v 1 -vf scale=640:-2 ${ROOT}/out/picks/<name>.jpg\` and Read it (mkdir out/picks first).
Rules: honour each clip's 'use' range and notes (e.g. avoid windows with logos/signage/readable UI; some clips are only good for N s);
no readable brand logos/signage/insignia in the chosen window; no identifiable celebrity/politician; enough footage after the in-point for
the shot's duration at the chosen speed (the renderer ping-pongs past the end — avoid needing that); any set may serve a shot if it fits the
note better; avoid the same file in adjacent shots unless it's a deliberate continuation; vary sources so the film doesn't look like one
reel. Split (montage) shots: give one clip per sub-shot (sub-shot = 'every' beats ≈ 0.469 s/beat), punchy and varied.`
const results = await pipeline(
  GROUPS,
  (g) => agent(`${BRIEF}

You pick footage for chapters ${g.chapters.join(', ')}. For EVERY shot of these chapters (ids in storyboard.json with ch in that list) choose
the clip file, in-point, optional speed and camera move, after LOOKING at the sheets of every set you consider and at frames at your chosen
in-points (write them to out/picks/${g.key}_<shot>.jpg). Ground-only shots (clip null, e.g. C01, Z01) stay ground-only unless the note
clearly wants footage. Return one pick per shot with a short reason.`, { label: `pick:${g.key}`, phase: 'Pick', schema: PICKS }),
  (p, g) => agent(`${BRIEF}

You are the footage supervisor checking clip picks for chapters ${g.chapters.join(', ')}. The picker proposed:
${JSON.stringify(p ?? { picks: [] }).slice(0, 14000)}

Verify EVERY pick by looking at frames at the in-point, mid-shot and end (\`"${FF}" -v error -ss <sec> -i <file> -frames:v 1 -vf scale=640:-2
${ROOT}/out/picks/check_<shot>_<n>.jpg\`, Read them): file exists in the library and is not rejected; the moment shows what the reason
claims and fits the note/lyric; no logos/legible signs/insignia/readable UI; no identifiable bystander face in close-up; duration suffices;
no adjacent repeats; split lists complete. Fix any weak pick with a better library clip/in-point. Return the FINAL full list of picks for
these chapters (same schema) with reasons.`, { label: `check:${g.key}`, phase: 'Check', schema: PICKS }),
)
phase('Global')
const all = GROUPS.map((g, i) => ({ group: g.key, picks: results[i]?.picks ?? [] }))
const glob = await agent(`${BRIEF}

You are the film's footage editor doing the GLOBAL pass over all picks (in cut order via out/board.json). The groups' final picks:
${JSON.stringify(all).slice(0, 60000)}

Check across group boundaries: the same file used in adjacent shots (or within ~3 shots) that isn't a deliberate continuation; the same
moment of one file reused in two different chapters (reuse of a file is OK only at clearly different in-points and far apart); one reel
dominating a stretch; mood/grade continuity per section (verses night-blue, choruses neon, bridge teal, chorus3 white, outro black); and
any pick whose file is missing from the library or listed in a rejects.jsonl. Look at frames where needed. Return ONLY the shots you change,
as full replacement picks (same schema), with reasons; return an empty list if nothing needs changing.`, { label: 'global', phase: 'Global', schema: PICKS })
return { groups: all, global: glob }