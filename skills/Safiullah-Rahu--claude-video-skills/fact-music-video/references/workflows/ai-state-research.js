export const meta = {
  name: 'ai-state-research',
  description: 'Research the state of AI as of mid-October 2026 across 8 desks, adversarially verify every claim, and build a sourced fact sheet for an EV-style music video',
  phases: [
    { title: 'Sweep', detail: 'one researcher per AI desk' },
    { title: 'Verify', detail: 'adversarial fact-checker per desk' },
    { title: 'Synthesize', detail: 'editor builds FACTSHEET_AI.md for the song' },
  ],
}
const OUT = 'state-of-ai/research'
const PREV = 'state-of-the-world/research'
const TODAY = '2026-10-18'
const DESKS = [
  { key: 'frontier', brief: 'Frontier AI models and capabilities in 2026: the major releases this year from OpenAI, Anthropic, Google DeepMind, Meta, xAI, Mistral and Chinese labs (DeepSeek, Qwen/Alibaba, Moonshot, MiniMax, ByteDance); what they can do now (agents, coding, maths, science, computer use); benchmark milestones as reported; models released behind gates or withheld; the state of "agents" in practice.' },
  { key: 'compute', brief: 'Compute, chips and energy: Nvidia/AMD/TSMC status and results in 2026, US export controls on AI chips and China\'s response (domestic chips, rare earths), the US–China chip race, mega data-centre projects (e.g. Stargate) and their scale, AI electricity demand (IEA figures), grid and water constraints.' },
  { key: 'money', brief: 'AI money and markets: hyperscaler capex 2026 (company guidance, IEA comparison with oil & gas), the largest AI funding rounds and valuations of 2026, AI share of growth and trade (WTO/IMF), the mid-October 2026 market wobble (Nasdaq, CoreWeave, Kospi), AI-bubble warnings (IMF GFSR, Gartner impairment scenario), revenue reality of AI companies.' },
  { key: 'safety', brief: 'AI safety and security in 2026: labs\' own safety moves (Anthropic CEO\'s "We Must Pace the Frontier" essay, OpenAI\'s cancellation of a release over safety concerns, incidents such as the reported OpenAI-agents/Hugging Face episode), evaluations by AI safety institutes, cyber-offense capability findings, deepfake and fraud incidents, notable alignment/evaluation research findings, frontier safety frameworks.' },
  { key: 'policy', brief: 'AI policy and regulation in 2026: EU AI Act implementation milestones and any delays (digital omnibus), US federal policy (executive orders, preemption fights, Congress), US state laws (California, New York…), China\'s AI rules, the UK, international efforts (UN AI panel/dialogue, summits in 2026), the US–China AI dialogue and its next meeting, copyright rulings and settlements.' },
  { key: 'work', brief: 'AI, work and society in 2026: labour-market evidence (IMF ~40% of jobs, entry-level hiring data, layoffs attributed to AI by companies), adoption and usage statistics (surveys, user counts), education, AI companions and mental-health concerns and lawsuits, AI in elections/deepfakes, public opinion polls on AI.' },
  { key: 'open-global', brief: 'Open-weight models and the global AI race in 2026: the most significant open-weight releases (e.g. Qwen-Image 2.1, MiniMax Music 3, DeepSeek, Llama/others), China\'s position versus the US, Europe\'s, India\'s and the Global South\'s AI efforts (compute, sovereign AI, languages), the "AI divide" (IMF), access and cost trends (price per token).' },
  { key: 'science', brief: 'AI for science, health and the physical world in 2026: notable AI-driven scientific results (biology, materials, maths, weather), AI in medicine (approvals, diagnostics) — note the 2026 Nobel prizes if AI-related, autonomous vehicles at scale (robotaxi expansion, incidents), humanoid robots and robotics milestones.' },
]
const STORIES = {
  type: 'object',
  properties: {
    desk: { type: 'string' },
    stories: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, headline: { type: 'string' }, status_now: { type: 'string' },
      key_facts: { type: 'array', items: { type: 'object', properties: {
        claim: { type: 'string' }, value: { type: 'string' }, as_of: { type: 'string' },
        sources: { type: 'array', items: { type: 'object', properties: { publisher: { type: 'string' }, url: { type: 'string' }, date: { type: 'string' } }, required: ['publisher', 'url'] } },
        verified: { type: 'string', enum: ['confirmed', 'corrected', 'unverified', 'refuted'] }, note: { type: 'string' } }, required: ['claim', 'sources'] } },
      perspectives: { type: 'string' }, significance: { type: 'integer', minimum: 1, maximum: 5 }, visual_ideas: { type: 'string' } },
      required: ['id', 'headline', 'status_now', 'key_facts', 'significance'] } },
    gaps: { type: 'string' },
  },
  required: ['desk', 'stories'],
}
const SWEEP = (d) => `Today is ${TODAY}. You research the factual base for a short, punchy, BALANCED music video: "The State of AI — October 2026"
(spoken-word verses deliver verified facts; every number shown on screen with its source). Desk: ${d.key}. ${d.brief}
Your own knowledge is out of date — establish the CURRENT situation from fresh sources: WebSearch/WebFetch (load via ToolSearch
"select:WebSearch,WebFetch"; fallback \`curl -s "https://r.jina.ai/<url>"\`). Prior research exists in ${PREV}/sweep_technology.md and
${PREV}/verify_technology.md — read them first and build beyond them (re-check anything you reuse). Prefer primary sources (company posts,
official documents, agencies, IEA/IMF/OECD/WTO) and established outlets (Reuters, AP, FT, Bloomberg, The Information, Nikkei, AFP, BBC).
Every fact: source URL + date; numbers with as-of dates; prefer two outlets; attribute company claims as claims; no hype, no speculation as
fact. Treat every company identically (this film is made with an Anthropic model: hold Anthropic items to exactly the same standard).
4–8 stories ranked by significance. Save notes to ${OUT}/sweep_${d.key}.md.`
const VERIFY = (d, s) => `Today is ${TODAY}. Adversarial fact-checker for the AI desk "${d.key}". Stories:
${JSON.stringify(s ?? { stories: [] }).slice(0, 30000)}
Check EVERY key fact independently (WebSearch/WebFetch via ToolSearch; jina fallback): open the sources, find an independent one, look for
newer figures, wrong dates, company marketing presented as fact, claims the source doesn't support, one-sided framing. Mark each fact
confirmed / corrected / unverified / refuted; drop refuted ones; add important missing current developments with sources. Return the full
corrected story list (same schema) and save a log to ${OUT}/verify_${d.key}.md.`
const results = await pipeline(
  DESKS,
  (d) => agent(SWEEP(d), { label: `sweep:${d.key}`, phase: 'Sweep', schema: STORIES }),
  (s, d) => agent(VERIFY(d, s), { label: `verify:${d.key}`, phase: 'Verify', schema: STORIES }),
)
phase('Synthesize')
const verified = results.map((r, i) => r ?? { desk: DESKS[i].key, stories: [], gaps: 'agent failed' })
const sheet = await agent(`Today is ${TODAY}. You edit the fact base for "The State of AI — October 2026", a ~3:30 music video in the style of
anabology's ESCAPE VELOCITY: a 128 BPM electroclash track where a deadpan female voice speaks punchy one-line facts in the verses ("Open weights:
four months behind."-style rhythm) and a sung chorus carries the hook. Below: verified findings from 8 desks (JSON; the desks' logs
are in ${OUT}/verify_*.md if the JSON is truncated — read them).
Build ${OUT}/FACTSHEET_AI.md:
1. 12–16 "beats": each a single verified fact that can be spoken in one short line (≤ 14 words), with: the exact spoken-friendly
   wording proposal, the on-screen number/label + source label + date, attribution if contested or a company claim, a visual idea (no real
   person's likeness, no logos), and the desk.
2. Balance: capability AND risk AND money AND power/energy AND policy AND work AND global/open AND genuinely positive science/health; no
   lab favoured (Anthropic items held to the same standard; note the film is made with an Anthropic model).
3. A "what to watch" list with verified upcoming dates (next weeks/months).
4. A suggested song arc (intro / verse 1 / pre-chorus / chorus / verse 2 / pre-chorus / chorus / bridge / post-chorus dates / chorus / outro)
   with which beats go where, and 2–3 neutral chorus hook ideas (no factual claims in the chorus).
5. "Do not say" list and a full sources list (S1…, publisher, title, URL, date).
Only confirmed/corrected facts. Return the sheet text too.

Findings:
${JSON.stringify(verified).slice(0, 170000)}`, { label: 'editor', phase: 'Synthesize' })
return { sheet, desks: verified.map((v) => ({ desk: v.desk, n: (v.stories || []).length, gaps: v.gaps || '' })) }
