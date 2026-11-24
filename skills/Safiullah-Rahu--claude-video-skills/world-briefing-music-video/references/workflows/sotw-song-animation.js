export const meta = {
  name: 'sotw-song-animation',
  description: 'Animate the 20 song-driven segments of The State of the World: one motion designer per group, then an art director + fact checker per group',
  phases: [
    { title: 'Animate', detail: 'one motion designer per segment group' },
    { title: 'Direct', detail: 'art director + fact check per group, fixes in place' },
  ],
}
const P = 'state-of-the-world'
const GROUPS = [
  { key: 'open', segs: ['cold', 'bigpicture'], brief: `cold (intro, spoken over a sparse beat): hormuz_dusk plate breathing; mono dateline "OCTOBER 2026" then "STRAIT OF HORMUZ · 14 OCT" on "container ship"; "BRENT $109.86 · 16 OCT CLOSE" with source on "Brent"; title card "The State of the World" (big serif) on "This is the state of the world" (the chrome boots after the last intro line). bigpicture (verse lines 1-4): night globe (X.view()) turning; one counter per line ON its numbers: IMF growth 3.1% (2025: 3.5%) / inflation 4.7%; 117.8 million forcibly displaced (UNHCR, end-2025); UN appeals 42% funded (a 42.4% bar: $14.86bn of $35.06bn, OCHA FTS 18 Oct); August +1.65 °C joint-hottest month (Copernicus).` },
  { key: 'gulf', segs: ['gulf', 'ukraine'], brief: `gulf (5 lines, ~20 s): globe flies to the Gulf; highlight Iran; "In February… Supreme Leader" → a dated tag "28 FEB 2026"; "Washington cites self-defence. Tehran calls it aggression." → two parallel attributed quote chips; "A ceasefire froze the fighting. The US blockade holds." → mini timeline (8 APR ceasefire · 14 JUL blockade reinstated); "Tanker data… 30% below" → bar pair ~11.6 vs 17.15 mb/d (Kpler, week to 13 Oct); Yemen line → yemen_highlands plate + Taiz pin + "WHO: 1,282 dead · 6 AUG–11 OCT". ukraine (1 line, ~8 s): ukraine_grid plate → "UN HRMMU: 2,570 civilians killed · JAN–SEP 2026 · +59% y/y" counter landing on "2,570".` },
  { key: 'gaza-sudan', segs: ['gaza', 'sudan', 'montage'], brief: `gaza (3 lines): gaza_tents plate; line 1 "aid groups… in name only" → attributed chip "100+ AID & RIGHTS GROUPS"; line 2 → counter "1,490+ KILLED SINCE THE CEASEFIRE · GAZA HEALTH MINISTRY" and "5 ISRAELI SOLDIERS" as a parallel smaller figure; line 3 → two parallel attributed position cards (Israel / Hamas). sudan (2 lines): sudan_drought plate → "~20 MILLION IN ACUTE HUNGER · UN · 16 OCT" + "FAMINE-RISK ALERT · IPC · 12 OCT" (exact wording: risk, not famine); Tigray line → horn_road plate or globe on Ethiopia/Eritrea with two attributed claims (Ethiopia accuses / Eritrea denies). montage (1 line, ~5.6 s): the globe hops across Pakistan–Afghanistan border, eastern DR Congo, Myanmar, Haiti — a pin + mono label each, landing on each name.` },
  { key: 'choruses', segs: ['pre1', 'chorus1', 'pre2', 'chorus2', 'chorus3'], brief: `All five chorus segments share ONE design system (they recur: make it iconic and consistent, variations only in globe angle and intensity). pre-chorus ("Resilience under strain, the IMF says. / Urgent choices."): tension build — a mono quote card "‘RESILIENCE UNDER STRAIN’ — IMF WORLD ECONOMIC OUTLOOK, OCT 2026" types on; "Urgent choices." slams in serif. chorus (sung, captions OFF — you draw the lyrics): the night globe big and turning faster with the beat (X.view() rotated by beat); the sung words as huge serif typography, one phrase at a time ("Under strain, under strain," / "the world keeps turning all the same." / "Urgent choices, every day," / "this is the state of the world today.") each word landing on its sung word (X.mark each); the call "(Under strain?)" small mono, the answer "Still turning!" the brightest moment — vermilion, a zoom punch (post: o.zoom) and a ring pulse on the globe on the kick. chorus3 (final) is the brightest: add teal accents and a slow push.` },
  { key: 'aid-ballots', segs: ['aid', 'ballots', 'economy'], brief: `aid (2 lines): aid_warehouse plate → bar "HUMANITARIAN AID $47.4bn (2023) → $33.3bn (2025) · GHA REPORT 2026" on "almost 30%"; Ebola line → ebola_clinic plate + "9,066 CASES · 4,381 DEATHS · WHO · 13 OCT" + "NO APPROVED VACCINE FOR THIS STRAIN". ballots (2 lines): ballots plate; result cards landing on the names: HUNGARY — ORBÁN CONCEDES · 12 APR; BANGLADESH · NEPAL — NEW GOVERNMENTS; CHILE · PERU · COLOMBIA — RIGHT-WING PRESIDENTS; "Brazil's runoff is too close to call" → split bar 47.03% vs 45.16% (first round) + "RUNOFF 25 OCT · WITHIN THE MARGIN OF ERROR". economy (1 line, ~6 s): oil_chip plate → Brent line (weekly closes: ~$72 late June → $109.86 16 Oct; +77–79% y/y) and rate steps "FED 3.75–4.00% · ECB 2.50%" on "raising rates again".` },
  { key: 'tech-climate', segs: ['ai', 'climate'], brief: `ai (2 lines): datacenter plate → bar pair "BIG TECH CAPEX >$400bn (2025) → +~75% (2026) · IEA" + "NOW ABOVE GLOBAL OIL & GAS PRODUCTION INVESTMENT"; line 2 → two attributed cards: "OPENAI — CANCELLED A RELEASE, CITING SAFETY · 29 SEP" / "ANTHROPIC CEO — ‘PACE THE FRONTIER’ · 12 SEP". climate (3 lines): el_nino plate + "NOAA: 83% CHANCE OF A HISTORIC EL NIÑO (OCT–DEC)"; Nepal line → glacier_valley plate + "1,400+ DEAD · ~5,300 MISSING · NEPAL AUTHORITIES"; COP31 line → globe on Türkiye + card "COP31 · ANTALYA · 9–20 NOV" + "‘1.5C TARGET IN JEOPARDY’ — COP31 PRESIDENT · 8 OCT".` },
  { key: 'end', segs: ['hope', 'watch', 'close'], brief: `hope (bridge: kick + warm strings, TEAL accents): "And yet." → a pause card; renewables line → solar_dawn plate + bar "RENEWABLES' SHARE OF ELECTRICITY 33% (2025) → 37% (2027) · IEA" + honest footnote "COAL DEMAND ALSO AT A RECORD (~8.94bn t)"; Artemis line → moon_capsule plate + counter 406,771 km passing Apollo 13's 400,171 km; gene therapy line → child_hand plate + "FDA · CASGEVY · CHILDREN AGED 2+ · 1 JUL 2026". watch (chanted dates): night globe; calendar tiles landing exactly on each chanted date: 25 OCT Brazil runoff · 27 OCT Israel votes · 3 NOV US midterms · 9 NOV COP31 · 10 JAN 2027 US–China truce expires. close (spoken outro over a lone pad): hormuz_dawn plate (the hook's strait at dawn); "A world under strain, facing urgent choices." as a serif title; then the end card: "THE STATE OF THE WORLD · OCTOBER 2026" + "FACTS: 173 SOURCES · research/FACTSHEET.md" + credits in mono (Song MiniMax-Music3 · Plates Qwen-Image 2.1 · Maps Natural Earth · Motion code). Chrome fades out at the end.` },
]
const COMMON = `Project ${P}: "The State of the World — October 2026", now a 3:46 MUSIC VIDEO (song "Under Strain", MiniMax-Music3,
97 BPM, deadpan spoken-word verses carrying the facts + sung choruses) rendered in code. FIRST read ${P}/BRIEF.md — especially the final
"SONG VERSION" section, which supersedes the narration notes — and ${P}/DESIGN.md, then app/src/brief/{x,kit,globe,charts}.ts and
app/src/scenes/brief.ts. Lyrics with word times: ${P}/data/lyrics.json (each line's section = its segment id); segment windows: ${P}/data/film.json;
lyrics text: ${P}/lyrics/lyrics.txt. Facts: ${P}/research/FACTSHEET.md is the ONLY source of numbers (print them exactly with the sheet's
source label/date). Plates: ${P}/media/plates/*.jpg (look at them; they are light paper-toned two-ink prints). Work from ${P}/app; never pass
--url to render.mjs; edit ONLY your module app/src/brief/segments/<group>.ts.`
const RES = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    verdict: { type: 'string', enum: ['ship', 'ship-with-notes', 'needs-work'] },
    moments: { type: 'array', items: { type: 'object', properties: { t: { type: 'number' }, what: { type: 'string' } }, required: ['t', 'what'] } },
    numbers_on_screen: { type: 'array', items: { type: 'string' } },
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

Make it look like a premium broadcast data-journalism music video: restrained, typographic, every graphic landing on the word it
illustrates and moving with the beat (X.beat(), X.hit('kick')), plates breathing (Ken Burns), the shared globe (X.view()) flying between
stories. Story segments open with seg.kicker as a pill + seg.title as a serif headline for ~1.5–2 s where there is room (segments are short).
Process: write → typecheck → render a sheet at the word starts of every line of your segments + mid-points → Read it critically → improve.
At least THREE iterations; finish with 4 full-res stills of your best moments (Read them). Return the file, key moments, EVERY number/claim
on screen with its source label, stills, notes.`, { label: `animate:${g.key}`, phase: 'Animate', schema: RES }),
  (a, g) => agent(`${COMMON}

You are the ART DIRECTOR and FACT CHECKER for segments ${g.segs.join(', ')} (module app/src/brief/segments/${g.key}.ts). The designer reported:
${JSON.stringify(a ?? { note: 'designer returned nothing: build the module yourself' }).slice(0, 6000)}

1. Fact check: every number, date, name and quote on screen must match FACTSHEET.md exactly (value, unit, date, attribution) and must not
   contradict or go beyond the lyrics; contested figures attributed; nothing from the "Do not say" lists.
2. Design: render your own sheet + at least 5 full-res stills; judge hierarchy, legibility over the light plates (ink type or duo),
   collisions with chrome (top band) and captions (bottom band; off in choruses), timing against the words (each graphic on its word and
   0.4 s later), beat feel, restraint, globe continuity at segment boundaries.
3. FIX everything directly, re-render, verify, typecheck. Return your verdict, the final on-screen numbers with sources, stills, notes.`, { label: `direct:${g.key}`, phase: 'Direct', schema: RES }),
)
return GROUPS.map((g, i) => ({ group: g.key, segs: g.segs, result: results[i] }))
