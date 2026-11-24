export const meta = {
  name: 'sotw-script-review',
  description: 'Review the world-affairs narration script for accuracy, neutrality, freshness and spoken clarity; merge into a final script; final accuracy check',
  phases: [
    { title: 'Review', detail: 'four independent reviewers with different lenses' },
    { title: 'Merge', detail: 'an editor applies the findings and trims to ~800 words' },
    { title: 'Final check', detail: 'adversarial accuracy pass on the merged script' },
  ],
}
const P = 'state-of-the-world'
const TODAY = '2026-10-18'
const CTX = `Project: ${P}. The film "The State of the World, October 2026" is a narrated documentary (Kokoro TTS, ~5 min). The narration
script is ${P}/tools/script.json (scenes → lines; "[word](/phonemes/)" marks a pronunciation override, keep those). The ONLY permitted
fact base is ${P}/research/FACTSHEET.md (verified facts, "Do not say" lists, attributed framing, sources) plus the desk verification logs
${P}/research/verify_*.md. Today is ${TODAY}. Read the script and the whole fact sheet first.`
const FINDINGS = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: {
      scene: { type: 'string' }, line: { type: 'integer' }, quote: { type: 'string' },
      problem: { type: 'string' }, severity: { type: 'string', enum: ['must-fix', 'should-fix', 'nit'] },
      fix: { type: 'string', description: 'replacement wording (or "cut")' }, evidence: { type: 'string' } },
      required: ['scene', 'line', 'quote', 'problem', 'severity', 'fix'] } },
    summary: { type: 'string' },
  },
  required: ['findings'],
}
const LENSES = [
  { key: 'accuracy', prompt: `You are an adversarial fact-checker. For EVERY sentence of the narration, find the fact-sheet fact(s) it rests on.
Flag anything unsupported, overstated, imprecise (dates, numbers, units, who said what), anything on a "Do not say" list, causal claims the
sheet does not make, and words that change meaning ("collapsed", "record", "all", "killed by"). Default to flagging when unsure.` },
  { key: 'neutrality', prompt: `You review neutrality and attribution for a global audience. Every contested claim must be attributed to who makes
it; parties to a conflict should be treated with parallel language; casualty figures must name their source; no loaded adjectives; no
implied blame the facts do not establish; Global South stories should carry weight. Flag imbalances between the stories and within them.` },
  { key: 'freshness', prompt: `You check freshness: today is ${TODAY}. Pick the 12 most time-sensitive claims in the script (prices, polls,
tolls, "this week", "in three weeks", dates of upcoming events, the Hormuz ship sinking, Brazil polls, Ebola cases, Brent price) and
re-verify each with a fresh web search (WebSearch/WebFetch via ToolSearch "select:WebSearch,WebFetch"; jina reader fallback
\`curl -s "https://r.jina.ai/<url>"\`). Flag anything that has changed or is contradicted by newer reporting, with the newer source.` },
  { key: 'clarity', prompt: `You are the spoken-word editor. The script is ~973 words (~6.5 min); the target is 780–820 words (~5:15) WITHOUT
losing any story or the balance. Propose cuts and rewrites line by line: short, concrete, rhythmic spoken sentences (max ~28 words), no
nested clauses, numbers easy to hear, smooth transitions between segments, a strong opening and closing. Note TTS pitfalls (words a TTS
might mispronounce: list them with a suggested IPA override). Never add facts that are not in the fact sheet.` },
]
phase('Review')
const reviews = await parallel(LENSES.map((l) => () => agent(`${CTX}\n\n${l.prompt}\nReturn findings (scene id, 0-based line index, quote, problem, severity, fix, evidence).`,
  { label: `review:${l.key}`, phase: 'Review', schema: FINDINGS })))
phase('Merge')
const merged = await agent(`${CTX}

You are the editor. Four reviewers returned findings (JSON below). Produce the FINAL narration script:
- apply every must-fix; apply should-fix items unless they conflict with accuracy or balance (accuracy wins, then neutrality, then
  freshness, then clarity); use judgement on nits;
- trim to 780–820 words total while keeping all 15 scenes, their ids, kinds, kickers, titles, regions, lead/tail and purpose fields (you
  may adjust gaps); keep pronunciation overrides "[word](/ipa/)" and add any the clarity reviewer proposes for names a TTS may garble;
- every factual sentence must be supported by FACTSHEET.md (or by a fresher source the freshness reviewer cited — then note it);
- write the result to ${P}/tools/script.json (same JSON structure, UTF-8, indent 1) and ${P}/research/SCRIPT_NOTES.md (what changed and
  why, which fact/source supports each line, and any fresher sources used).
Return a short summary with the final word count.

Findings:
${JSON.stringify(reviews.map((r, i) => ({ lens: LENSES[i].key, ...(r ?? { findings: [], summary: 'reviewer failed' }) }))).slice(0, 60000)}`, { label: 'merge', phase: 'Merge' })
phase('Final check')
const final = await agent(`${CTX}

FINAL adversarial accuracy pass on the merged script now in ${P}/tools/script.json (also read ${P}/research/SCRIPT_NOTES.md). For every
sentence: is it supported exactly by FACTSHEET.md or by a cited fresher source? Any "Do not say" violations? Any unattributed contested
claim? Fix problems DIRECTLY in tools/script.json (minimal edits), and return the list of edits you made (or "none").`, { label: 'final-check', phase: 'Final check', schema: FINDINGS })
return { merged, final, reviews: reviews.map((r, i) => ({ lens: LENSES[i].key, n: r?.findings?.length ?? 0, summary: r?.summary ?? '' })) }
