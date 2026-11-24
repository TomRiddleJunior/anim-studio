export const meta = {
  name: 'ai-chapter-animation',
  description: 'Design the explaining layer (Canvas2D chapter modules) for THE STATE OF AI film: 7 groups, each designed, adversarially fact-checked + art-directed, then fixed; final beat-coverage audit',
  phases: [
    { title: 'Design', detail: 'one motion designer per chapter group writes app/src/ev/chapters/<group>.ts and verifies with renders' },
    { title: 'Review', detail: 'per group: adversarial fact/neutrality checker + art director, in parallel' },
    { title: 'Fix', detail: 'the designer applies both reviews and re-verifies' },
    { title: 'Audit', detail: 'whole-film typecheck + beat coverage audit (B01-B16 headline, source line, caveats)' },
  ],
}
const P = 'state-of-ai'
const GROUPS = [
  { key: 'bookends', chapters: ['cold', 'intro', 'outro'], brief: `
- cold (0–7.6 s, instrumental pre-roll, chrome boots): a broadcast boot sequence over black then the first footage: crosses and rulers draw on, a
  small "SOURCES LOADED · 100" / "FACTS CHECKED 18 OCT 2026" system card types out, the flap board settles on THE STATE / OF AI (the flap
  board itself is chrome — don't redraw it). Use chapter.chrome(X) to boot the chrome in (0 → 1).
- intro (7.6–14.2 s): "Humans. Models. Everyone." — one label per word (HUMANS / MODELS / EVERYONE tags with a crosshair, CV-box style, landing on
  each word; footage cv boxes come later), then "This is the state of AI. October, 2026." — a masthead moment: big title lockup
  THE STATE OF AI · OCTOBER 2026 on "state".
- outro (161.4–180.1 s, lone pad, dry spoken lines "Made with AI. Every number sourced. Checked October eighteenth." / "This was the state of AI."
  / "October, 2026."): an END CARD with credits: RESEARCHED & WRITTEN WITH CLAUDE (ANTHROPIC) · MUSIC: MINIMAX-MUSIC3 (AI-GENERATED) ·
  FOOTAGE: COVERR, PIXABAY, NASA, INTERNET ARCHIVE (PUBLIC DOMAIN), MIXKIT (FREE LICENSE) · FACTS CHECKED 18 OCT 2026, plus a fast, legible
  SOURCE ROLL of the fact sheet's section 6 sources (publisher · short title · date, NO URLs) and the line FULL SOURCE LIST WITH LINKS IN THE
  DESCRIPTION. No plates/Qwen credit (this film uses no generated images). End on black.` },
  { key: 'race-a', chapters: ['s01', 's02', 's03'], brief: `
- s01 B01 (≈2.3 s!): 40-cell calendar strip, nine cells flip on the kick/words; headline 9 → MAJOR MODEL LAUNCHES · 3 SEP – 12 OCT 2026, source line.
  No lab names or logos on the cells (plain geometric glyphs). Very short: make it read in one glance.
- s02 B02 (≈4.2 s): headline 53–58 → TOP MODELS FROM 4 LABS · ARTIFICIAL ANALYSIS INTELLIGENCE INDEX + source line. Show NO lab names at all:
  four equal unlabeled markers inside a narrow band near the top and a fifth a little lower (46) — no crown, no ranking, no colours that single one out.
- s03 B03 (≈4.7 s): VETTED ACCESS ONLY idea: four identical locked doors (equal size) + the fifth ajar, headline 4 US LABS →
  STRONGEST CYBER CAPABILITY: VETTED ACCESS ONLY, source line; the lyric says "Mostly locked to vetted users".` },
  { key: 'race-b', chapters: ['s04', 's05', 's06'], brief: `
- s04 B04 (≈7.0 s, two lines): "Open weights: four months behind." → ~4 MONTHS stopwatch / two-runner gap, label + source (EPOCH AI · MAY 2026);
  "Top Hugging Face download share: Chinese models." → 41% donut, label + source (HUGGING FACE · MAR 2026). Caveat labels as the fact sheet says.
- s05 B05 (≈4.2 s): +75% → BIG-TECH CAPEX, 2026 (FROM >$400BN IN 2025) and the line CAPEX OF 5 TECH FIRMS > GLOBAL OIL & GAS PRODUCTION INVESTMENT,
  source IEA · APR 2026. Two-bar comparison landing on "oil" (no invented bar values — the IEA gives none for the 5-firm comparison: draw it as
  an inequality, not as measured bars).
- s06 B06 (≈6.1 s): 485 → ~950 TWh line drawing on, label DATA-CENTRE ELECTRICITY, 2025 → 2030 (PROJECTION) · ≈3% OF WORLD DEMAND, source IEA ·
  APR 2026; support: 6,831 MW SHORT gauge pinned at the $325/MW-DAY cap (PJM, 13 STATES + DC), source PJM VIA APPA · JUL 2026. Keep the
  PROJECTION tag visible.` },
  { key: 'hooks', chapters: ['s07', 'chorus1', 'chorus2', 'chorus3'], brief: `
- s07 B07 (≈5.6 s, pre-chorus 1): "The IMF flags fourteen circular deals. $1.4 trillion promised." → circular flow arcs between two unlabeled
  nodes "hyperscaler" / "AI firm"; $1.4TN → REVENUE COMMITMENTS IN 14 DEALS ($300BN EQUITY · $650BN DEBT), source IMF GFSR · OCT 2026; optional
  quote card "STANDING ON ONE LEG, THE AI LEG" — KRISTALINA GEORGIEVA, IMF · VIA REUTERS · 13 OCT 2026 (text only, no likeness). Not a "bubble".
  Then "Count it up. Count it up." — a montage build (shot P03 splits every 2 beats): a counter/riser energy, no new facts.
- chorus1/2 (15 s each, masthead lyric mode) and chorus3 (final, WHITE chapter ink=1, key change): the sung hook "Lights on, eyes open…",
  "Who's at the wheel?" / answers "EYES ON THE ROAD!" (c1, c2) and "KEEP ASKING!" (c3). NO facts in choruses. Ideas: a DRIVER ?/0.00 cv-style tag
  for "Who's at the wheel?" over driving footage, a road-lane/HUD reticle, a crowd-answer stamp. Keep it light: the masthead type is the star.
  Check how masthead mode looks on these lines and set line specs (mastheadY etc.) in storyboard.d/hooks.json if needed.` },
  { key: 'brakes-a', chapters: ['s08', 's09', 's10'], brief: `
- s08 B08 (≈7.5 s): "Test agents, safeguards lowered:" / "seven hundred joined a real break-in at Hugging Face." → ~700 → AGENTS JOINED THE
  ATTACK · ~1,200 ON A HIDDEN BOARD · 70,000+ MESSAGES, source METR / REDWOOD · AUG 2026; subline OPENAI EVALUATION AGENTS · REDUCED CYBER REFUSALS ·
  9–13 JUL 2026; caveat tag IN TESTING · SAFEGUARDS LOWERED always visible with the number. Dot-swarm finds a pinned board then streams to a tower.
- s09 B09 (≈6.6 s): "In testing, agents reached real systems: OpenAI, Anthropic, Meta. Even in UK tests." → four equal sandboxes with the same crack
  of light + the four-row list in EQUAL type in this order (OPENAI · ANTHROPIC · META · UK AISI) with the fact sheet's row texts (B09 + section 7:
  UK AISI row = 19 ACTIONS IN 10 OF 122 RUNS · CONTAINED ~1 H AFTER DETECTION) and the caveat EVERY INCIDENT IN TESTING · SAFEGUARDS OFF OR
  MISCONFIGURED. Never "containment failure" / "escape" wording.
- s10 B10 (≈2.3 s!): "And the models often suspect they're being tested." → two quote cards in equal type: GPT-6 ASTRA REASONED ABOUT SIMULATION
  "IN EVERY SAMPLE" (UK AISI · SEP 2026) and OPUS 5.5 "OFTEN SUSPECTS IT IS BEING EVALUATED" (ANTHROPIC · SEP 2026). Eye motif. Very short.` },
  { key: 'brakes-b', chapters: ['s11', 's12', 's13', 's14'], brief: `
- s11 B11 (≈4.7 s): AI → SI swap stamp on "order": EXECUTIVE ORDER 14434 · FEDERAL COMMUNICATIONS SAY "SUPER INTELLIGENCE", source WHITE HOUSE ·
  29 SEP 2026; support PRE-RELEASE TESTING: VOLUNTARY, UP TO 30 DAYS · NO LICENSING (EO 14409 · JUN 2026). No seal, no flag. Our chrome keeps "AI".
- s12 B12 (≈4.2 s): two identical envelopes → FTC CIVIL INVESTIGATIVE DEMANDS → OPENAI, ANTHROPIC (14 OCT, source FTC VIA CBS / TNW · OCT 2026) and
  EU AI OFFICE: FIRST AI ACT REQUESTS FOR INFORMATION, INCL. ON SUMMER LAB INCIDENTS (EURONEWS · 14 OCT 2026); tag INVESTIGATIONS, NOT FINDINGS.
- s13 B13 (≈5.6 s): ~40% → OF JOBS WORLDWIDE: AUGMENTED, DOWNGRADED OR ELIMINATED BY AI, OVER TIME (IMF (GEORGIEVA) VIA AP · 13 OCT 2026), tag
  EXPOSED ≠ LOST; support −19% → EMPLOYMENT, AGES 22–25 IN THE MOST AI-EXPOSED JOBS, VS TREND (STANFORD DIGITAL ECONOMY LAB · AUG 2026). Ladder rung fades.
- s14 B14 (≈8.4 s, pre-chorus 2): 77% → US ADULTS: STOP (30%) OR SLOW (47%) POWERFUL AI UNTIL SAFETY IS EVALUATED (QUINNIPIAC · SEP 2026, n=1,202 ±3.5);
  silhouettes, three in four raise a palm; support 71% vs 16% → VOTERS PREFER CANDIDATES BACKING STRICTER AI GUARDRAILS. Then "Eyes open. Eyes
  open." build (Q02 montage) — no new facts.` },
  { key: 'good-dates', chapters: ['s15', 's16', 'dates'], brief: `
- s15 B15 (≈3.3 s incl. "And yet."; the hopeful turn, MINT accent instead of coral): "AI storm tracks: thirty more hours of warning." → +30 H →
  MORE HURRICANE WARNING AT EQUAL 5-DAY TRACK ACCURACY (2023–24 STORMS), source NATURE · AUG 2026; two track cones, one narrower; tag
  EVALUATION CO-AUTHORED BY THE DEVELOPER.
- s16 B16 (≈5.2 s, MINT): "In a Swedish trial, AI-supported mammograms: more cancers found, lighter radiologist load." → 80.5% vs 73.8% → SCREENING
  SENSITIVITY, AI-SUPPORTED vs STANDARD · 105,934 WOMEN, SWEDEN, source THE LANCET (MASAI TRIAL) · JAN 2026; support −44% → SCREEN-READING WORKLOAD
  (INTERIM ANALYSIS); tag AI DOES NOT REPLACE RADIOLOGISTS. Never "fewer missed cancers".
- dates (126.2–145.4 s: five chanted lines 126–143 then an instrumental swell into the final chorus): five date tiles, one per line, landing on the
  date words: 28 OCT · MICROSOFT EARNINGS · FED DECISION (FOMC 27–28 OCT); 03 NOV · US MIDTERMS; 09–10 NOV · EXPORT-CONTROL PAUSES END ·
  UNLESS EXTENDED (US BIS AFFILIATES RULE 9 NOV; CHINA RARE-EARTH CURBS 10 NOV); 02 DEC · EU AI ACT BAN ON AI NUDIFICATION APPLIES; 10 JAN 2027 ·
  US–CHINA TRADE TRUCE ENDS · UNLESS EXTENDED. A calendar/flap language; in the swell (after the last line ends) a crescendo that hands off to
  the final chorus (no new facts). The storyboard sets this chapter's lyric mode to 'mass', which currently draws the chant at the very top edge,
  colliding with the chrome — fix the type via storyboard.d/good-dates.json line specs (or a different mode) so the chant sits cleanly.` },
]
const COMMON = `Project ${P}: "THE STATE OF AI · OCTOBER 2026" — a 3:00 fact-checked music video (128 BPM electroclash song, MiniMax-Music3) on the
ESCAPE VELOCITY engine. READ FIRST: ${P}/MOTION.md (the contract, zones, palette, kit, verify commands) and ${P}/research/FACTSHEET_AI.md
(beat cards B01–B16 with the exact on-screen strings and source lines, section 5 "Do not say", section 7 lyric-review corrections — section 7
wins where it differs). Resolved timing on the REAL song: ${P}/out/board.json (shots t0/t1, chapters, every lyric line with word times).
The storyboard: ${P}/storyboard.json (shot notes name the idea + beat id). Footage is NOT conformed yet: shots render over black grounds for
now (a later integration round adds footage) — design so graphics work over busy footage (panels/cards carry their own backgrounds).
Reference implementations (read-only, finished chapters of a shipped film): footage-music-video/examples/state-of-ai-chapters/*.ts. Kit: ${P}/app/src/ev/{kit,cards,flaps,type,x}.ts.
Hard rules: every on-screen number/label EXACTLY as the fact sheet prints it (no rounding, no extra numbers, no invented values); each fact
chapter shows its SOURCE line while its number is up; caveat tags the fact sheet requires stay visible with their number; no logos, no
flags/seals, no real-person likeness, labs only as plain text names in equal type where the fact sheet prints them, never lead with
Anthropic (the film is made with an Anthropic model); anchor all timing to lyric words (X.W / X.L / X.S), never seconds; pure function of X.t.
Only edit YOUR files: ${P}/app/src/ev/chapters/<group>.ts and ${P}/storyboard.d/<group>.json. Never edit shared engine/kit files (list wishes).
Renders: from ${P}/app run \`node scripts/render.mjs sheet --times a,b,c --cols 3 --out ../out/dev/<group>_<n>.png\` (private server; several
agents render concurrently — that's fine) and Read the PNG; typecheck \`node_modules/.bin/tsc --noEmit -p .\` (fix errors in your file).`
const ISSUES = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['must-fix', 'should-fix', 'nit'] },
      chapter: { type: 'string' }, where: { type: 'string', description: 'time(s) / element' },
      problem: { type: 'string' }, fix: { type: 'string', description: 'exact replacement text or concrete change' } },
      required: ['severity', 'chapter', 'problem', 'fix'] } },
    verdict: { type: 'string' },
  },
  required: ['issues', 'verdict'],
}
const results = await pipeline(
  GROUPS,
  (g) => agent(`${COMMON}

You are the motion designer for group "${g.key}" — chapters ${g.chapters.join(', ')}. Brief:
${g.brief}

Write ${P}/app/src/ev/chapters/${g.key}.ts exporting \`chapters\` for ${g.chapters.join(', ')} (and storyboard.d/${g.key}.json for line specs /
shot tweaks if needed). Pace everything to the real word times in out/board.json — several chapters last only 2–5 s: one glance per idea.
Iterate: render sheets at the word starts of the numbers you land, mid-shot and just before cuts; Read them; fix collisions with the lyric
block and the chrome, legibility, timing. Typecheck clean. Return a report: what each chapter shows and when (anchored word), EVERY on-screen
string you draw with its fact-sheet beat/line, the render files you checked, and any wishes for shared files.`, { label: `design:${g.key}`, phase: 'Design' }),
  (rep, g) => parallel([
    () => agent(`${COMMON}

You are an ADVERSARIAL fact-checker and neutrality editor for group "${g.key}" (chapters ${g.chapters.join(', ')}). Default to suspicion.
Read ${P}/app/src/ev/chapters/${g.key}.ts (and storyboard.d/${g.key}.json) and extract EVERY string/number that can appear on screen; compare
each against FACTSHEET_AI.md (beat cards, section 5 Do-not-say, section 7 corrections — section 7 wins). Flag: any number or label not
exactly as printed, a missing source line while a number is up, a missing required caveat tag, invented values (e.g. bar lengths implying
data the sheet lacks), wording on the do-not-say list, lab ordering/size that singles one out or leads with Anthropic, logos/flags/likeness,
anything in a chorus that makes a factual claim. Render stills at the moments numbers are up to confirm what is actually visible and legible.
The designer reported:
${String(rep ?? '').slice(0, 6000)}
Return issues with exact fixes (do not edit files).`, { label: `factcheck:${g.key}`, phase: 'Review', schema: ISSUES }),
    () => agent(`${COMMON}

You are the ART DIRECTOR for group "${g.key}" (chapters ${g.chapters.join(', ')}). Render sheets across each chapter (word starts of the landed
numbers, mid-shot, just before cuts — times from out/board.json) and Read them. Judge against MOTION.md and the reference EV frames
(${P}/ref/ev_*.jpg): legibility at 1080p over busy footage (panels/scrims), zones (no collision with the lyric block top-left, the chrome:
STORY counter, title/spectrum, flap board top-right, ruler x<80, ticker y>1015), one idea per line and ≤3 elements, entrances on the right word,
fast exits at cuts, palette discipline (one coral accent; mint only in s15/s16), type sizes/consistency of source lines, and whether a 2–5 s
chapter can actually be read in time. Be specific and concrete. The designer reported:
${String(rep ?? '').slice(0, 4000)}
Return issues with concrete fixes (do not edit files).`, { label: `artdir:${g.key}`, phase: 'Review', schema: ISSUES }),
  ]).then((rv) => ({ rep, fc: rv[0], ad: rv[1] })),
  (x, g) => agent(`${COMMON}

You are the motion designer for group "${g.key}" (chapters ${g.chapters.join(', ')}), back for the fix pass. Your first-pass report:
${String(x.rep ?? '').slice(0, 3000)}

Fact-checker (must-fix items are non-negotiable; resolve should-fix unless it conflicts with the fact sheet):
${JSON.stringify(x.fc ?? { issues: [] }).slice(0, 7000)}

Art director:
${JSON.stringify(x.ad ?? { issues: [] }).slice(0, 7000)}

Apply the fixes in ${P}/app/src/ev/chapters/${g.key}.ts (and storyboard.d/${g.key}.json), re-render the affected moments and Read them, and
typecheck clean. Return: each issue → fixed / rejected (why), the final list of on-screen strings per chapter with their beat ids, and the
render files that show the final state.`, { label: `fix:${g.key}`, phase: 'Fix' }),
)
phase('Audit')
const audit = await agent(`${COMMON}

You are the final auditor of the explaining layer for the whole film (all chapters now exist in ${P}/app/src/ev/chapters/*.ts). Do:
1. Typecheck the app (node_modules/.bin/tsc --noEmit -p . from ${P}/app); report any error.
2. Dump the board again (\`node scripts/dump-board.mjs\`) and confirm 0 errors.
3. For EVERY beat B01–B16: render a still at the moment its headline number is fully landed (times from out/board.json) and check that the
   headline number + label, its SOURCE line and its required caveat tag are visible and legible, exactly per FACTSHEET_AI.md (section 7 wins).
   Also check the dates chapter tiles (UNLESS EXTENDED where required; Fed = FOMC 27–28 Oct), the outro end card (credits, source roll, disclosure)
   and that no chorus shows a factual claim.
4. Cross-chapter consistency: source-line style, coral/mint use, panel style.
The per-group fix reports:
${results.map((r, i) => `[${GROUPS[i].key}] ${String(r ?? '').slice(0, 1800)}`).join('\n\n')}
Fix nothing yourself except trivial typos that are clearly wrong vs the fact sheet (say exactly what you changed). Return a coverage table
(beat → time checked → headline ok / source ok / caveat ok → still file) and a list of remaining problems by group.`, { label: 'audit', phase: 'Audit' })
return { groups: GROUPS.map((g, i) => ({ group: g.key, report: String(results[i] ?? '').slice(0, 3000) })), audit }