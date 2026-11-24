export const meta = {
  name: 'ai-integration',
  description: 'Integration round over the real song + real footage: shared panel/caveat/source primitives, per-group fit to footage (grades, CV boxes, legibility, landed counters), adversarial fact-check + art direction, fixes, final film audit',
  phases: [
    { title: 'Kit', detail: 'one agent adds shared brief primitives (panel, caveatTag, sourceLine) to the kit' },
    { title: 'Integrate', detail: 'one agent per chapter group fits its graphics to the real footage' },
    { title: 'Review', detail: 'per group: adversarial fact-check + art director over footage renders' },
    { title: 'Fix', detail: 'per group fix pass' },
    { title: 'Audit', detail: 'film-wide audit: beats, lyrics coverage, licences, consistency' },
  ],
}
const P = 'state-of-ai'
const GROUPS = [
  { key: 'bookends', chapters: ['cold', 'intro', 'outro'], extra: `
- Credits FOOTAGE line must match the sources actually used: read ${P}/media/CREDITS.md / media/credits.json (built from the picks) and list
  exactly those source families (e.g. COVERR, PIXABAY, MIXKIT (FREE LICENSE), NASA, INTERNET ARCHIVE (PUBLIC DOMAIN)) — nothing unused.
- Add S101 (FEDERAL RESERVE · FOMC MEETING CALENDARS · READ 18 OCT 2026) to the source roll: the dates chapter cites it.
- C03's footage has two out-of-focus CPU badges at about x1290–1350 (y110–220, y715–810): if the cold system card or a cam tweak can keep
  them small/unreadable or covered, do it (storyboard.d cam on C03 within ±0.08 pan); note what you did.
- intro: HUMANS / MODELS / EVERYONE tags should sit on the real subjects now (tracks in media/tracks/p_I0*.json, or static boxes); never box a
  single identifiable person.` },
  { key: 'race-a', chapters: ['s01', 's02', 's03'], extra: `
- s01: the 9 lands ~0.7 s before its source line finishes typing — make the source readable while the 9 is up (type faster or start earlier).
- B01 (s02) footage is bright/daylight: add a grade override (exposure ≈0.6–0.7, cool tint) in storyboard.d/race-a.json so the white
  type and panels read.` },
  { key: 'race-b', chapters: ['s04', 's05', 's06'], extra: `
- MUST: the counters pass through invented intermediate values while their label/source are visible (+75% shows +9%, +71%; 6,831 shows 4,859,
  6,479; the 41% sweeps). Make every number land directly on its final value (a slam/flip/stamp, or a count that finishes before its label and
  source appear and in ≤0.25 s) — the film never shows a number the fact sheet doesn't print.
- B03 footage (it is in race-a's s03 — not yours) — ignore. Check your own plates for brightness and grade them if needed.` },
  { key: 'hooks', chapters: ['s07', 'chorus1', 'chorus2', 'chorus3'], extra: `
- Choruses over real footage now: make the masthead word and any chorus elements read over bright crowd/strobe plates; K04/K14/K24 "Who's
  at the wheel?" shots — a DRIVER tag on the empty seat/wheel if the footage supports it (tracks or static box).
- chorus3 is the white chapter (paper polarity): check every plate reads as high-key white, not muddy grey; grade overrides as needed.` },
  { key: 'brakes-a', chapters: ['s08', 's09', 's10'], extra: `
- Fix the B09 Anthropic row orphan wrap ("… JAN–JUL · A / TEST PACKAGE…" → keep "A TEST PACKAGE" together).
- The 19's source line fades in 0.1–0.4 s after the number: bring it in with the number.
- H02 footage is bright: grade override (exposure ≈0.6–0.7, cool tint).` },
  { key: 'brakes-b', chapters: ['s11', 's12', 's13', 's14'], extra: `
- Q01 (s14) is high-key white marble: grade it down to sit in the night-blue verse (exposure ≈0.42 per the footage editor's sim
  out/picks/global/sim_Q01_dim.jpg) so the ghosted lyric words, the chrome ticker and the 77% panel read.
- O01 (s13 office) is bright: grade override (exposure ≈0.6–0.7, cool tint).` },
  { key: 'good-dates', chapters: ['s15', 's16', 'dates'], extra: `
- MUST: counters pass through invented values while label/source/caveat are visible (+29 H at 119.45, 76.4%/70.1% at 122.75, −34% at 125.12):
  make every number land directly on its final value.
- The 02 DEC source must name S93 exactly like the outro roll: ARTIFICIALINTELLIGENCEACT.EU (not "AI ACT EXPLORER").
- The 28 OCT tile cites the Federal Reserve FOMC calendar (S101) — keep that source line.
- S02 (white radiology studio in the teal bridge) and T02 (daylight Capitol) are bright: grade overrides (exposure ≈0.6–0.7; S02 keep the
  teal/mint feel, T02 cool).` },
]
const COMMON = `Project ${P}: "THE STATE OF AI · OCTOBER 2026", 3:00 fact-checked music video on the ESCAPE VELOCITY engine. ROUND 2 —
INTEGRATION over the REAL song and REAL footage. READ: ${P}/MOTION.md (contract, zones, palette, verify commands), ${P}/research/FACTSHEET_AI.md
(beat cards, section 5 do-not-say, section 7 — section 7 and its "on-screen wordings agreed" bullets win), ${P}/out/board.json (real windows,
word times). Footage is now in: every shot has its picked clip (${P}/footage/picks.json; reasons in storyboard.json 'pick_reason'), conformed
to media/clips/p_<shot>/, with YOLO tracks media/tracks/p_<shot>.json (labels person, car, chair, keyboard, … see media/tracks/_labels.json if
present). The colour-halftone print pass applies to footage only. Renders now include footage (they are slower; that's fine).
Shot tweaks WITHOUT touching storyboard.json: ${P}/storyboard.d/<group>.json = { "shots": { "<id>": { "cam": {"z":[1,1.06],"x":[0,0.02],"y":[0,0]},
"cv": [...], "grade": {"exposure":0.65,"contrast":1.05,"saturation":0.9,"tint":[0.95,1,1.08]}, "speed": 0.9 } }, "lines": { "<text>": {...} } }
(merged at load; only YOUR group's file; keep anything already in it unless you mean to change it). CV entry: {"label":"…","track":"person","score":0.97}
follows a tracked subject, or a static {"label":"…","box":[x0,y0,x1,y1]} in 0..1 frame coords (optionally "to" for a moving box). Clip/in-point
changes are NOT possible this round (they need a re-conform) — list such wishes.
Hard rules unchanged: every on-screen number/label exactly per the fact sheet; source line visible while its number is up; required caveats
visible; no logos/flags/likeness; labs as plain names in equal type, never leading with Anthropic; NO intermediate/invented values ever on
screen (no count-ups through numbers the sheet doesn't print while a label/source is visible); anchor to lyric words; pure function of X.t.
Only edit ${P}/app/src/ev/chapters/<group>.ts and ${P}/storyboard.d/<group>.json (and nothing shared, except that you MAY import the shared
primitives from ${P}/app/src/ev/brief.ts). Verify: from ${P}/app \`node scripts/render.mjs sheet --times a,b,c --cols 3 --out ../out/dev/r2_<group>_<n>.png\`,
Read it; \`node scripts/render.mjs lyrics --from A --to B\` (every sung word on screen); typecheck \`node_modules/.bin/tsc --noEmit -p .\`.`
const ISSUES = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['must-fix', 'should-fix', 'nit'] }, chapter: { type: 'string' }, where: { type: 'string' },
      problem: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'chapter', 'problem', 'fix'] } },
    verdict: { type: 'string' },
  },
  required: ['issues', 'verdict'],
}
phase('Kit')
const kit = await agent(`${COMMON}

You build the SHARED explaining-layer primitives so all seven chapter groups draw panels, caveat tags and source lines the same way. The last
audit found 4 panel styles (registration ticks; FIG title bar; white left spine; plain), fill alpha split 0.9 vs 0.96 (0.9 lets bright plates
show through), 5 caveat-tag treatments, source lines at 12 vs 13 px. Read all ${P}/app/src/ev/chapters/*.ts and ${P}/app/src/ev/{kit,cards}.ts,
pick ONE house style that fits the EV language (look at ${P}/ref/ev_*.jpg and the audit stills in ${P}/out/dev/final-audit/), and write
${P}/app/src/ev/brief.ts exporting at least:
  panel(c, x, y, w, h, opts?)            dark panel (alpha ≥0.94 over footage), optional cream/paper variant, the house edge treatment
  caveatTag(c, text, x, y, opts?)         the one caveat-tag style (returns its rect), legible over footage, ink variant for white chapters
  sourceLine(c, text, x, y, opts?)        "SOURCE · …" mono caps 12 px, optional typed reveal by progress u, returns width
  land(t, tWord, opts?)                   an entrance envelope for a number that lands on a word (no intermediate values)
with doc comments and an example. Pure functions, no state. Do NOT edit any chapter file or other shared file. Typecheck clean. Render a test
sheet of a scratch usage if you need (don't leave scratch code in the app). Return the API and the style rationale.`, { label: 'kit', phase: 'Kit' })
const results = await pipeline(
  GROUPS,
  (g) => agent(`${COMMON}

Shared primitives now exist in ${P}/app/src/ev/brief.ts (the kit agent reported: ${String(kit ?? '').slice(0, 2500)}).

You integrate group "${g.key}" (chapters ${g.chapters.join(', ')}) over the real footage:
1. Adopt brief.ts for panels, caveat tags and source lines (keep your designs, unify the treatment).
2. Fit to the footage: render each shot (word starts of landed numbers, mid-shot, before cuts) and fix legibility (panel alpha, scrims, grade
   overrides for bright plates), don't cover the main subject or its face with a card, move graphics where the footage needs it, add
   meaningful CV boxes on real subjects where the note/idea calls for it (tracks or static boxes), set cam moves if a subject sits under a panel.
3. Group-specific items:${g.extra}
4. Re-check every sung word is on screen (render.mjs lyrics over your chapters' range) and typecheck clean.
Return: what changed per chapter, every on-screen string per chapter with its beat id, grade/cam/cv overrides you set, the render files that show
the final state, and wishes (clip changes etc.).`, { label: `integrate:${g.key}`, phase: 'Integrate' }),
  (rep, g) => parallel([
    () => agent(`${COMMON}

ADVERSARIAL fact-checker for group "${g.key}" (chapters ${g.chapters.join(', ')}), round 2. Default to suspicion. Extract EVERY string/number
that can appear on screen from ${P}/app/src/ev/chapters/${g.key}.ts (+ storyboard.d/${g.key}.json lines/cv labels + the flap rows of these
chapters in storyboard.json countdown) and compare against FACTSHEET_AI.md (section 7 wins). Render stills at the moments numbers land AND
at 0.1–0.3 s before they land (to catch intermediate values), and confirm source lines/caveats are visible and legible over the real footage.
Also flag CV-box labels on footage that imply facts not in the sheet, and anything singling out a lab. The integrator reported:
${String(rep ?? '').slice(0, 5000)}
Return issues with exact fixes (do not edit files).`, { label: `factcheck:${g.key}`, phase: 'Review', schema: ISSUES }),
    () => agent(`${COMMON}

ART DIRECTOR for group "${g.key}" (chapters ${g.chapters.join(', ')}), round 2 over real footage. Render sheets across each chapter (times from
out/board.json) and Read them. Judge: legibility of type/panels/source lines over the actual plates; graphics fighting the footage subject or
covering faces; grade continuity (verses night-blue, choruses neon, bridge teal/mint, chorus3 white, outro black) and whether any plate looks
washed out or muddy; consistent use of the shared brief.ts styles; zones (lyric block top-left; chrome); entrances on words, clean exits at cuts;
CV boxes on real subjects (never boxing one identifiable person as a label like HUMAN). The integrator reported:
${String(rep ?? '').slice(0, 4000)}
Return issues with concrete fixes (do not edit files).`, { label: `artdir:${g.key}`, phase: 'Review', schema: ISSUES }),
  ]).then((rv) => ({ rep, fc: rv[0], ad: rv[1] })),
  (x, g) => agent(`${COMMON}

You integrated group "${g.key}" (chapters ${g.chapters.join(', ')}); now the fix pass. Your report:
${String(x.rep ?? '').slice(0, 3000)}
Fact-checker (must-fix non-negotiable):
${JSON.stringify(x.fc ?? { issues: [] }).slice(0, 8000)}
Art director:
${JSON.stringify(x.ad ?? { issues: [] }).slice(0, 8000)}
Apply the fixes in ${P}/app/src/ev/chapters/${g.key}.ts and storyboard.d/${g.key}.json; re-render the affected moments over footage and Read
them; lyrics check over your range; typecheck clean. Return each issue → fixed / rejected (why), the final on-screen strings per chapter, and
the render files of the final state, plus any wishes for shared files or clip changes.`, { label: `fix:${g.key}`, phase: 'Fix' }),
)
phase('Audit')
const audit = await agent(`${COMMON}

FINAL film-wide audit after the integration round (all chapters are in ${P}/app/src/ev/chapters/*.ts, shared primitives in ev/brief.ts).
1. Typecheck the app; dump the board (node scripts/dump-board.mjs: 0 errors expected).
2. \`node scripts/render.mjs lyrics\` over the whole film: every sung word on screen while sung (report the count).
3. For EVERY beat B01–B16, the five date tiles, the cold/intro, the three choruses and the outro: render a still at the landed moment over the
   real footage (write to ${P}/out/dev/final-audit-r2/) and check headline + label + source line + required caveat are visible, legible and
   exactly per the fact sheet (section 7 wins); check 0.2 s before each number lands for intermediate values; choruses carry no facts; the
   flap board rows (storyboard.json countdown) are correct; the end card credits match media/CREDITS.md source families; disclosure present.
4. Licences: run \`python tools/mixkit_license.py used\` (all Free expected) and confirm no picked file is in any rejects.jsonl.
5. Consistency: panels/caveats/source lines use the shared style; grade continuity across sections.
The group fix reports:
${results.map((r, i) => `[${GROUPS[i].key}] ${String(r ?? '').slice(0, 1500)}`).join('\n\n')}
Fix nothing yourself except trivial, clearly-wrong typos vs the fact sheet (say exactly what you changed). Return a coverage table and a list of
remaining problems by group with severity.`, { label: 'audit', phase: 'Audit' })
return { kit: String(kit ?? '').slice(0, 3000), groups: GROUPS.map((g, i) => ({ group: g.key, report: String(results[i] ?? '').slice(0, 3000) })), audit }