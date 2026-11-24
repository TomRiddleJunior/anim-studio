export const meta = {
  name: 'ev-integration',
  description: 'Integrate each chapter group over the real song timing and real footage: review renders, re-pace graphics, tune shots, fix',
  phases: [
    { title: 'Integrate', detail: 'one motion designer per chapter group re-paces and fixes its chapters over footage' },
    { title: 'Review', detail: 'an art director per group checks full-res stills and fixes what is left' },
  ],
}

const ROOT = 'ev-remake'
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
const COMMON = `Project ${ROOT}: a remake study after anabology's ESCAPE VELOCITY (fashion-show music video, code-rendered motion design over
royalty-free footage). Read ${ROOT}/MOTION.md fully — especially "Round 2" at the end — then your module, the shared kit it uses
(app/src/ev/kit.ts, cards.ts, flaps.ts, type.ts, x.ts) and app/src/scenes/ev.ts. Times: ${ROOT}/out/board.json (regenerate after
editing storyboard.d with \`node scripts/dump-board.mjs\` from app/). Reference look: ${ROOT}/ref/ev_*.jpg.
Work from ${ROOT}/app. Render: \`node scripts/render.mjs sheet --times a,b,c --cols 3 --out ../out/int/<group>_vN.png\` and
\`node scripts/render.mjs stills --t a,b --out ../out/int/<group>\` (never pass --url). Typecheck: node_modules/.bin/tsc --noEmit -p .
You may edit ONLY app/src/ev/chapters/<group>.ts and ${ROOT}/storyboard.d/<group>.json.`

const RES = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ship', 'ship-with-notes', 'needs-work'] },
    changes: { type: 'array', items: { type: 'string' } },
    remaining: { type: 'array', items: { type: 'string' } },
    wishes: { type: 'array', items: { type: 'string' }, description: 'clip/in-point changes or shared-file changes you could not make' },
    stills: { type: 'array', items: { type: 'string' } },
    typecheck_clean: { type: 'boolean' },
  },
  required: ['verdict', 'changes', 'remaining', 'stills', 'typecheck_clean'],
}

const results = await pipeline(
  GROUPS,
  (g) => agent(`${COMMON}

You are the motion designer integrating chapters ${g.chapters.join(', ')} (module app/src/ev/chapters/${g.key}.ts) now that the real song
and the picked footage are in. Steps:
1. Render a contact sheet across your chapters at the word starts of every lyric line (from out/board.json) and mid-shot, and Read it.
2. Re-pace: the real lines are shorter/faster than the dev timing — every graphic must land on its word and have time to read; drop or
   simplify what can't fit; nothing should still be animating in when the next idea arrives.
3. Integrate with the footage: graphics must not cover the subject's face/main action (look at the frames); CV boxes should sit on
   real subjects — set storyboard.d/${g.key}.json "cv" entries using the tracked labels in media/tracks/_labels.json (e.g. track
   "person") or static boxes measured on the frame; tune "cam" (push/pull/pan) per shot so subjects sit clear of the lyric block (top-left)
   and of your graphics; adjust "grade" if a plate fights the overlay.
4. Iterate at least three render/review rounds, ending with full-res stills of the 4 most important moments (Read them).
Return your verdict, the changes, what remains, wishes, still paths, and typecheck status for your file.`, { label: `integrate:${g.key}`, phase: 'Integrate', schema: RES }),
  (a, g) => agent(`${COMMON}

You are the ART DIRECTOR for chapters ${g.chapters.join(', ')}. The integrator reported:
${JSON.stringify(a ?? { note: 'integrator returned nothing — do the integration yourself' }).slice(0, 5000)}
Render your own full-res stills (at least 6, spread over the chapters, at word starts and mid-shot) and a sheet; Read them with fresh eyes
against ref/ev_*.jpg. Judge: does each frame look like a finished broadcast-quality EV frame — footage, lyric, one or two graphics, chrome
— with clear hierarchy, nothing colliding, faces clear, CV boxes on real subjects, type legible, coral used once per frame? Is the
graphic timing right against the words (check two frames per line: on the word, and 0.3 s later)? FIX what is wrong directly
(module + storyboard.d/${g.key}.json), re-render, verify. Return verdict, fixes, remaining issues, wishes, final still paths, typecheck.`, { label: `direct:${g.key}`, phase: 'Review', schema: RES }),
)
return GROUPS.map((g, i) => ({ group: g.key, result: results[i] }))
