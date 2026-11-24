export const meta = {
  name: 'world-affairs-research',
  description: 'Research the state of world affairs as of mid-October 2026 across 10 domains, adversarially verify every claim, and synthesize a sourced fact sheet',
  phases: [
    { title: 'Sweep', detail: 'one researcher per domain gathers the current situation with sources' },
    { title: 'Verify', detail: 'an adversarial fact-checker per domain re-checks every claim and number' },
    { title: 'Synthesize', detail: 'an editor builds the film fact sheet: the arc, verified facts, numbers, balance notes' },
  ],
}

const OUT = 'state-of-the-world/research'
const TODAY = '2026-10-18'
const DOMAINS = [
  { key: 'conflicts', brief: 'Wars and armed conflicts: Russia–Ukraine (front line, talks/ceasefire efforts, casualties), Israel/Gaza and the wider Middle East (Lebanon, Iran, Yemen/Red Sea, Syria), Sudan, DR Congo, Myanmar, the Sahel, Haiti, India–Pakistan tensions, any new conflicts in 2026. Current status as of now, what changed in 2026.' },
  { key: 'geopolitics', brief: 'Great-power relations and diplomacy: US foreign policy under the current administration, US–China (trade truce/tariffs, Taiwan, tech controls), Russia–China, NATO and European defence spending, the Korean peninsula, major summits in 2026 (G7, G20, NATO, BRICS, UNGA Sept 2026, APEC), alliances shifting.' },
  { key: 'economy', brief: 'The global economy: IMF World Economic Outlook (October 2026) growth/inflation numbers, US/euro area/China/India growth, central bank rates (Fed, ECB, others) and recent moves, tariffs and trade flows, stock markets (records? AI boom/valuations), debt levels, the dollar, gold price, commodity prices, recession risks.' },
  { key: 'elections', brief: 'Elections and domestic politics in 2026: results of the year\'s major elections so far and what is upcoming (e.g. US midterms on 3 November 2026, Brazil general election October 2026, others in 2026 worldwide), leadership changes, protests and political crises. Exact dates and results.' },
  { key: 'climate', brief: 'Climate and environment: 2026 global temperature status (on track for record? ENSO state), major 2026 disasters (heatwaves, floods, wildfires, cyclones) with tolls, emissions trends, COP31 (date, host, agenda), climate policy changes, renewables deployment records.' },
  { key: 'technology', brief: 'Technology and AI: the state of AI in late 2026 (frontier model releases, capabilities, adoption), AI investment/datacenter build-out and power demand, chip export controls and the semiconductor race, AI regulation (EU AI Act timelines, US policy, China), notable tech-industry events of 2026, labour-market effects of AI as reported.' },
  { key: 'humanitarian', brief: 'Humanitarian crises and global health: displaced people (UNHCR latest figures), famine/IPC classifications (Gaza, Sudan, others), humanitarian funding gaps and aid cuts, disease outbreaks in 2026 (cholera, mpox, measles, H5N1, others), WHO matters, migration flows.' },
  { key: 'science-space', brief: 'Science and space in 2026: crewed and robotic missions (Artemis II status, Moon landers, Mars, China\'s programme, Starship), major scientific results, notable breakthroughs in medicine/energy (e.g. fusion milestones), big science facilities.' },
  { key: 'energy', brief: 'Energy and resources: oil and gas prices and OPEC+ policy in 2026, energy security, the clean-energy transition (solar/EV/battery records, China\'s role), critical minerals and rare-earth export controls, nuclear revival, electricity demand growth.' },
  { key: 'regions', brief: 'Regional round-ups beyond the headlines: South Asia (Pakistan, India, Bangladesh, Afghanistan — politics, economy, disasters), Africa (major developments), Latin America (Venezuela, Argentina, Mexico, Brazil, Colombia…), Europe (politics, economy, migration), East and Southeast Asia (Japan, South Korea, Indonesia, Philippines…).' },
]

const STORIES = {
  type: 'object',
  properties: {
    domain: { type: 'string' },
    as_of: { type: 'string' },
    stories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'short slug' },
          headline: { type: 'string' },
          status_now: { type: 'string', description: 'the current situation in 3-6 factual sentences, with dates' },
          what_changed_2026: { type: 'string' },
          key_facts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                claim: { type: 'string' },
                value: { type: 'string', description: 'the number or date if any, with unit' },
                as_of: { type: 'string' },
                sources: { type: 'array', items: { type: 'object', properties: { publisher: { type: 'string' }, url: { type: 'string' }, date: { type: 'string' } }, required: ['publisher', 'url'] } },
                verified: { type: 'string', enum: ['confirmed', 'corrected', 'unverified', 'refuted'], description: 'set by the verifier' },
                note: { type: 'string' },
              },
              required: ['claim', 'sources'],
            },
          },
          perspectives: { type: 'string', description: 'how the main parties describe it (attributed), where contested' },
          global_significance: { type: 'integer', minimum: 1, maximum: 5 },
          visual_ideas: { type: 'string', description: 'what could illustrate it: map region, chart with which numbers, symbolic image (no real-person likeness needed)' },
        },
        required: ['id', 'headline', 'status_now', 'key_facts', 'global_significance'],
      },
    },
    gaps: { type: 'string' },
  },
  required: ['domain', 'stories'],
}

const SWEEP = (d) => `Today is ${TODAY}. You are a news researcher building the factual base for a short, balanced documentary video:
"The State of the World — October 2026". Your domain: ${d.key}. ${d.brief}

Your own knowledge is out of date: establish the CURRENT situation (as of ${TODAY}) from fresh sources. Use WebSearch (load it via
ToolSearch "select:WebSearch,WebFetch") with several queries per topic, prefer recent wire services and primary sources (Reuters, AP,
AFP, BBC, Al Jazeera, FT, Bloomberg, Nikkei, UN agencies, IMF/World Bank, WMO/Copernicus, official statements), and read the articles
(WebFetch, or \`curl -s "https://r.jina.ai/<url>"\` if a fetch fails). Every fact needs at least one source URL with its date; numbers
must carry their as-of date. Prefer facts confirmed by two outlets. Attribute contested claims to who makes them; do not editorialize.
If something you expect cannot be confirmed as current, say so in gaps rather than guessing. Cover 4–8 stories, ranked by global
significance. Also save your full notes to ${OUT}/sweep_${d.key}.md (create the folder if needed).`

const VERIFY = (d, s) => `Today is ${TODAY}. You are an adversarial fact-checker for a documentary on world affairs (domain: ${d.key}).
A researcher produced these stories:
${JSON.stringify(s ?? { stories: [] }).slice(0, 30000)}

Check EVERY key fact independently: search for it yourself (WebSearch/WebFetch via ToolSearch "select:WebSearch,WebFetch"; jina reader
\`curl -s "https://r.jina.ai/<url>"\` as fallback), open the cited sources, and find at least one independent source. Look specifically
for: outdated figures (a newer number exists), wrong dates, numbers attributed to the wrong body, claims the source does not actually
support, one-sided framing, and anything that changed in the last weeks. Mark each fact confirmed / corrected (fix the value and cite) /
unverified / refuted; drop refuted facts from status_now. Add any important current development the researcher missed (with sources).
Return the full corrected story list in the same schema, and save a log to ${OUT}/verify_${d.key}.md.`

const results = await pipeline(
  DOMAINS,
  (d) => agent(SWEEP(d), { label: `sweep:${d.key}`, phase: 'Sweep', schema: STORIES }),
  (s, d) => agent(VERIFY(d, s), { label: `verify:${d.key}`, phase: 'Verify', schema: STORIES }),
)

phase('Synthesize')
const verified = results.map((r, i) => r ?? { domain: DOMAINS[i].key, stories: [], gaps: 'agent failed' })
const sheet = await agent(`Today is ${TODAY}. You are the editor of a ~4–5 minute narrated documentary video, "The State of the World — October 2026",
for a global audience. Below are verified research findings from 10 desks (JSON). Build the film's fact sheet:

1. Choose 8–10 stories that together give an honest, balanced picture of the world right now — the biggest conflicts and diplomacy,
   the economy, politics/elections, climate, technology/AI, humanitarian needs, and at least one or two genuinely hopeful developments
   (science, health, energy) so the film is not only doom. Avoid regional bias; give the Global South its weight.
2. For each chosen story: a one-line headline, 3–5 verified facts (only facts marked confirmed/corrected), the 1–2 numbers best suited
   for an on-screen chart or counter (with unit, as-of date, source), the map region(s), a neutral attributed framing for contested
   matters, and a visual idea that does NOT require a real person's likeness.
3. A proposed running order (an arc: hook → the big picture → story by story → the forces underneath → what to watch next → close).
4. "What to watch" items with dates in the coming weeks (e.g. elections, summits, COP31) — verified dates only.
5. A sources list (publisher, title if known, URL, date) for every fact used.
Write it as Markdown to ${OUT}/FACTSHEET.md and also return it as text. Be strict: no unverified claims, no speculation presented as fact.

Findings:
${JSON.stringify(verified).slice(0, 180000)}`, { label: 'editor', phase: 'Synthesize' })

return { sheet, domains: verified.map((v) => ({ domain: v.domain, n: (v.stories || []).length, gaps: v.gaps || '' })) }
