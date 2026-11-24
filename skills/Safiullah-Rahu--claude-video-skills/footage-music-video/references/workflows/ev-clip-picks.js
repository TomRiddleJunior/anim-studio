export const meta = {
  name: 'ev-clip-picks',
  description: 'Pick the best royalty-free clip, in-point, speed and camera move for every storyboard shot, by viewing the footage',
  phases: [
    { title: 'Pick', detail: 'one picker per chapter group views candidate clips and chooses per shot' },
    { title: 'Check', detail: 'a second agent checks the picks for repeats, logos and fit' },
  ],
}

const ROOT = 'ev-remake'
const FF = 'ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe'
const GROUPS = [
  { key: 'bookends', chapters: ['cold', 'intro', 'end'] },
  { key: 'looks-a', chapters: ['look01', 'look02', 'look03'] },
  { key: 'looks-b', chapters: ['look04', 'look05', 'look06'] },
  { key: 'chorus-a', chapters: ['pre1', 'chorus1', 'break1'] },
  { key: 'looks-c', chapters: ['look07', 'look08', 'look09'] },
  { key: 'looks-d', chapters: ['look10', 'look11', 'pre2'] },
  { key: 'bridge', chapters: ['chorus2', 'break2', 'bridge'] },
  { key: 'drop', chapters: ['drop'] },
  { key: 'white', chapters: ['chorus3', 'outro'] },
]

const PICKS = {
  type: 'object',
  properties: {
    picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          shot: { type: 'string', description: 'storyboard shot id (e.g. B02); for split montage shots the base id (e.g. K01)' },
          file: { type: 'string', description: 'library file, repo-relative (footage/raw/<set>/<name>.mp4); omit for split shots or ground-only shots' },
          in: { type: 'number', description: 'seconds into that FILE where the shot starts' },
          speed: { type: 'number', description: 'playback speed, default 1 (0.5–1.5 is fine; < 1 for slow-mo)' },
          cam: { type: 'object', description: 'optional camera move {z:[z0,z1], x:[x0,x1], y:[y0,y1]} — zoom ≥ 1 (1 = cover), pans in frame fractions ±0.08' },
          split: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, in: { type: 'number' } }, required: ['file', 'in'] }, description: 'for montage (split) shots: the clips in order' },
          ground: { type: 'string', description: 'set "black"/"white" to keep a ground-only (code) shot as is' },
          reason: { type: 'string' },
        },
        required: ['shot', 'reason'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['picks'],
}

const results = await pipeline(
  GROUPS,
  (g) => agent(`You pick footage for chapters ${g.chapters.join(', ')} of a remake study after anabology's ESCAPE VELOCITY fashion-show music video
(project ${ROOT}). Read ${ROOT}/MOTION.md (the film and its look), ${ROOT}/footage/SETS.json (the film brief and what each footage set is
for), the shots of your chapters in ${ROOT}/storyboard.json (each has a 'note' with its idea, its current clip id '<set>_<k>' and maybe a
'split' montage list), and their resolved windows in ${ROOT}/out/board.json (t0/t1 in seconds: the duration each shot needs; lyric lines with
word times tell you what is being said on each shot).

The library: ${ROOT}/footage/raw/<set>/manifest.jsonl (one JSON per clip: file, duration, w×h, 'use' range, score, notes, tags, licence) —
skip anything listed in that set's rejects.jsonl. Contact sheets: \`python tools/footage.py sheet <set>\` writes footage/raw/<set>/_sheet.jpg
(Read it). To inspect a moment: \`"${FF}" -v error -ss <sec> -i <file> -frames:v 1 -vf scale=640:-2 <scratch>.jpg\` (write into
${ROOT}/out/picks/ and Read the jpg). Look at the actual frames before deciding — at least the sheet of every set you use and frames at
your chosen in-points.

For EVERY shot of your chapters choose: the clip file (any set may serve if it fits the note better than the default set), an in-point
(seconds into the file) where the action best fits the shot — motion that lands on the cut, the subject framed so the lyric block (top-left)
and the right-hand graphics have room, no visible brand logos or legible signage (honour the manifest notes/use ranges), and enough
footage after the in-point for the shot's duration at the chosen speed. Keep the LOOK shots (runway walks) the strongest, most
fashion-show material and never reuse the same runway take for two different looks unless it's a deliberate continuation. Avoid the same
file in two adjacent shots unless it is a continuation. For split (montage) shots give the ordered list of clips with in-points (one per
sub-shot, each sub-shot lasts 'every' beats ≈ 0.44 s per beat at 137 BPM). Ground-only shots (clip null) stay ground-only unless the note
clearly wants footage. Optional: a camera move (slow push 1.0→1.08 is the default; a pull, pan or punch when the beat calls for it).
Return one pick per shot with a short reason.`, { label: `pick:${g.key}`, phase: 'Pick', schema: PICKS }),
  (p, g) => agent(`You are the footage supervisor checking clip picks for chapters ${g.chapters.join(', ')} of ${ROOT} (read ${ROOT}/MOTION.md
and the shots in ${ROOT}/storyboard.json + ${ROOT}/out/board.json). The picker proposed:
${JSON.stringify(p ?? { picks: [] }).slice(0, 12000)}

Verify each pick by looking at frames (\`"${FF}" -v error -ss <sec> -i <file> -frames:v 1 -vf scale=640:-2 ${ROOT}/out/picks/check_<shot>.jpg\`,
Read it): the file exists in the library and is not rejected; the in-point shows what the reason claims; no brand logos / legible
signs / readable faces of identifiable bystanders in close-up; enough duration after the in-point; no file repeated in adjacent shots or
across looks unintentionally. Fix any bad pick (choose a better clip/in-point from the library manifests — footage/raw/<set>/manifest.jsonl,
sheets via \`python tools/footage.py sheet <set>\`). Return the final full list of picks (same schema), with reasons.`, { label: `check:${g.key}`, phase: 'Check', schema: PICKS }),
)
return GROUPS.map((g, i) => ({ group: g.key, picks: results[i]?.picks ?? null, notes: results[i]?.notes ?? '' }))
