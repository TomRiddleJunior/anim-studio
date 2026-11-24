export const meta = {
  name: 'sotw-segment-animation',
  description: 'Animate the 15 segments of The State of the World: one motion designer per group writes its module and iterates on renders; an art director checks facts, sources and design and fixes',
  phases: [
    { title: 'Animate', detail: 'one motion designer per segment group' },
    { title: 'Direct', detail: 'art director + fact check per group, fixes in place' },
  ],
}
const P = 'state-of-the-world'
const GROUPS = [
  { key: 'open', segs: ['cold', 'bigpicture'], brief: `cold: the hook over the hormuz_dusk plate — a quiet editorial opening: the plate breathes (slow push), a small mono dateline "14 OCT 2026 · STRAIT OF HORMUZ" types on with the first line, then "BRENT $109.86" with source on the second, then the title card "The State of the World" (serif, big) with "OCTOBER 2026" kicker on the third line; transition into the globe for bigpicture. bigpicture: the night globe slowly turning (X.view()), five counters landing one per line: IMF growth 3.1% (2025: 3.5%) and inflation 4.7%; 117.8 million forcibly displaced (end-2025); UN appeals 42% funded (a half-filled bar: $14.86bn of $35.06bn); August +1.65 °C joint-hottest month (Copernicus). Exact sources from FACTSHEET section 0.` },
  { key: 'gulf', segs: ['gulf'], brief: `The longest story (~55 s). Globe flies to the Gulf: highlight Iran; on "Washington"/"Tehran" two attributed quote chips (self-defence vs aggression). The contested tolls as two separate attributed figures (Iran's government 3,528 killed in Iran; Pentagon 21 US military deaths) — never summed. A dated timeline strip for the ceasefire (Apr 8) → June deal → collapse (Jul 8) → blockade (Jul 14). Hormuz flow bar pair: ~11.6 mb/d vs 17.15 mb/d pre-war (Kpler, week to 13 Oct). Yemen: switch to the yemen_highlands plate; Taiz pin; the WHO count 1,282 deaths (6 Aug–11 Oct) and the Riyadh airport strike (12–13 killed). Keep it calm and attributed.` },
  { key: 'ukraine-gaza', segs: ['ukraine', 'gaza'], brief: `ukraine: ukraine_grid plate then globe on Ukraine (highlight, Kyiv pin). UN HRMMU chart: civilians killed Jan–Sep 2026 = 2,570, +59% y/y; September 249 (2025) vs 328 (2026) as a bar pair. "About 600,000 without power" counter attributed to Ukrainian authorities via UN News. Oct 16 waiver: two attributed reaction chips (Rubio "60-day review"; Zelensky "wrong"; Russia's envoy "historic"). gaza: gaza_tents plate; attributed counters (Gaza Health Ministry: 1,490+ killed since the ceasefire; UNICEF: 340+ children; 5 Israeli soldiers); positions of Israel and Hamas as two parallel attributed cards; "~65% in tents or makeshift shelters" stat; map shade of Israeli-held share 53% → ~63% is optional (Times of Israel) — only if clean.` },
  { key: 'sudan-map', segs: ['sudan', 'montage'], brief: `sudan: sudan_drought plate → globe on Sudan (highlight; Darfur/Kordofan hatching via an overlay); counters: ~20 million in acute hunger (UN, 16 Oct), 8.6 million internally displaced (IOM); "famine-RISK alert" wording exact (IPC, 12 Oct). Horn: horn_road plate, Tigray/Eritrea map with attributed claims (Ethiopia accuses Eritrea; Eritrea denies). montage ("Also on the map", ~14 s): the globe hops across four places on their words — Pakistan–Afghanistan border, eastern DR Congo, Myanmar (Rakhine), Haiti — each a pin + one-line mono caption with its fact-sheet fact (UNAMA 1,100+ civilian casualties; Kabila coalition incl. M23; Kyauktaw market strike 33+ killed (Reuters); Haiti ~1.5 million displaced (UN) — the narration says only "gang violence in Haiti", so caption Haiti as "GANG VIOLENCE · ELECTIONS POSTPONED").` },
  { key: 'aid-ballots', segs: ['aid', 'ballots'], brief: `aid: aid_warehouse plate; a big half-empty funding bar: humanitarian funding $47.4bn (2023) → $33.3bn (2025), "almost 30%" (GHA Report 2026); appeals 42.4% funded. ebola_clinic plate with Ebola counter 9,066 cases / 4,381 deaths (WHO, 13 Oct) and "no approved vaccine for this strain". Venezuela: globe pin + 6,509 dead (official, 24 Aug). Displacement line: 117.8M first decline in a decade + "returns under pressure" quote attributed to UNHCR. ballots: ballots plate; a ballot calendar of the year's results as compact cards (Hungary: Orbán concedes 12 Apr, Tisza 141/199; Bangladesh BNP 209/300 — note the Awami League was barred; Nepal RSP 182/275; Chile/Peru/Colombia right-wing presidents, Peru 50.13 / Colombia 49.66); Brazil split bar first round 47.03% vs 45.16% and "runoff 25 Oct · within the margin of error".` },
  { key: 'forces', segs: ['economy', 'ai', 'climate'], brief: `economy: oil_chip plate → Brent line chart over 2026 (≈$72 late-June low → ≈$112.6 late-March peak → $109.86 on 16 Oct; use the fact-sheet points only, mark them as weekly closes) with "+77–79% y/y"; rate steps: Fed 3.75–4.00% (16 Sep), ECB 2.50%; IMF Gulf contractions bars: Kuwait −16.7%, Iraq −16.0%, Qatar −15.6%. ai: datacenter plate; IEA capex bar pair: >$400bn (2025) → ~+75% (2026), "now above global oil & gas production investment"; the labs' stated safety moves as two attributed cards (OpenAI cancelled a release citing safety; Anthropic's CEO: pace the frontier); IMF Georgieva ~40% of jobs. climate: el_nino plate + "NOAA: 83% chance of a historic El Niño (Oct–Dec)"; glacier_valley plate + Nepal counter (1,400+ dead, ~5,300 missing, Nepal authorities) + "no formal attribution study"; COP31 card: 9–20 Nov, Antalya; "1.5 °C in jeopardy" — COP31 President (Climate Home, 8 Oct).` },
  { key: 'end', segs: ['hope', 'watch', 'close'], brief: `hope (the lift, TEAL accents): solar_dawn plate + renewables share bar 33% (2025) → 37% (2027, IEA) with the honest footnote "coal demand also at a record (~8.94 bn t)"; moon_capsule plate + Artemis 2 distance counter 406,771 km ticking past Apollo 13's 400,171 km (6 Apr 2026); child_hand plate + "FDA: Casgevy approved for children aged 2+ (1 Jul 2026)". watch: the calendar component — 25 OCT Brazil runoff · 27 OCT Israel votes · 3 NOV US midterms · 9 NOV COP31 opens · 10 JAN 2027 US–China truce expires — each tile landing on its word, over the night globe. close: hormuz_dawn plate (the hook's strait, now at dawn) with the closing line as a serif title "A world under strain, facing urgent choices." then a short end card: "THE STATE OF THE WORLD · OCTOBER 2026" + "Sources: research/FACTSHEET.md · 173 sources" + credits (Narration Kokoro-82M · Score MiniMax-Music3 · Plates Qwen-Image 2.1 · Maps Natural Earth) in mono.` },
]
const COMMON = `Project ${P}: "The State of the World — October 2026", a ~6.6-minute narrated documentary rendered in code.
FIRST read ${P}/BRIEF.md (the contract, rules, verify loop) and ${P}/DESIGN.md, then app/src/brief/{x,kit,globe,charts}.ts and
app/src/scenes/brief.ts. Facts: ${P}/research/FACTSHEET.md is the ONLY permitted source of numbers (print them exactly, with the sheet's
source label and date); ${P}/research/SCRIPT_NOTES.md says what the narration cut — never chart what is no longer said. The narration
with word times: ${P}/data/vo.json (lines[].words[].start/end) and ${P}/tools/script.json; segment windows: ${P}/data/film.json; plates:
${P}/tools/plates_map.json and media/plates/*.jpg (look at them). Work from ${P}/app; never pass --url to render.mjs; edit ONLY your module.`
const RES = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    verdict: { type: 'string', enum: ['ship', 'ship-with-notes', 'needs-work'] },
    moments: { type: 'array', items: { type: 'object', properties: { t: { type: 'number' }, what: { type: 'string' } }, required: ['t', 'what'] } },
    numbers_on_screen: { type: 'array', items: { type: 'string' }, description: 'every number/claim shown on screen with its source label' },
    stills: { type: 'array', items: { type: 'string' } },
    typecheck_clean: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['file', 'verdict', 'moments', 'numbers_on_screen', 'stills', 'typecheck_clean'],
}
const results = await pipeline(
  GROUPS,
  (g) => agent(`${COMMON}

You are the motion designer for segments ${g.segs.join(', ')}. Write ${P}/app/src/brief/segments/${g.key}.ts exporting \`segments\` with an
entry for each of: ${g.segs.map((s) => `'${s}'`).join(', ')}.

Direction:
${g.brief}

Make it look like a premium broadcast documentary (think the best data-journalism explainers): restrained, precise, typographic,
every graphic landing on the word it illustrates, plates breathing, the shared globe (X.view()) flying between stories. Each story opens
with its kicker pill + serif headline for ~2.5 s (seg.kicker / seg.title from film.json). Process: write → typecheck → render a sheet at the
word starts of every line of your segments + mid-points → Read it critically → improve. At least THREE iterations; finish with 4 full-res
stills of your best moments (Read them). Return the file, the key moments, EVERY number/claim on screen with its source label, stills, notes.`, { label: `animate:${g.key}`, phase: 'Animate', schema: RES }),
  (a, g) => agent(`${COMMON}

You are the ART DIRECTOR and FACT CHECKER for segments ${g.segs.join(', ')} (module app/src/brief/segments/${g.key}.ts). The designer reported:
${JSON.stringify(a ?? { note: 'designer returned nothing: build the module yourself' }).slice(0, 6000)}

1. Fact check: every number, date, name and quote on screen must match FACTSHEET.md exactly (value, unit, date, attribution) and must not
   contradict or go beyond the narration; contested figures attributed; "Do not say" items absent. Fix any discrepancy.
2. Design: render your own sheet + at least 5 full-res stills; judge hierarchy, legibility over the plates (light paper plates → ink
   type or duo), collisions with the chrome/caption bands, timing against the words (check each graphic on its word and 0.4 s later),
   restraint (one headline number + one support graphic at a time), the globe continuity at segment boundaries (view() based).
3. FIX everything directly, re-render, verify, typecheck. Return your verdict, the final list of on-screen numbers with sources, stills, notes.`, { label: `direct:${g.key}`, phase: 'Direct', schema: RES }),
)
return GROUPS.map((g, i) => ({ group: g.key, segs: g.segs, result: results[i] }))
