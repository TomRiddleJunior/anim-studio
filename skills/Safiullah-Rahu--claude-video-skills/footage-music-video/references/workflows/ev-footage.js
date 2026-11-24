export const meta = {
  name: 'ev-footage',
  description: 'ESCAPE VELOCITY remake: source royalty-free/public-domain footage per visual set, review licence + fit, fill gaps',
  phases: [
    { title: 'Source', detail: 'one agent per set searches, peeks and downloads the best clips' },
    { title: 'Review', detail: 'an art director + licence checker judges each set sheet and rejects misfits' },
    { title: 'Fill', detail: 'replace rejected or missing clips' },
  ],
}

const P = 'ev-remake'
const TOOL = `python "${P}\\tools\\footage.py"`
const COMMON = `You are sourcing footage for a remake study of the music video ESCAPE VELOCITY (a techwear fashion show where each "Look" is a San Francisco AI meme, with a split-flap countdown board and a white-pilled takeoff ending). A code motion-design layer and a colour-halftone print pass will sit on top of every shot, so pick footage for composition, motion and mood, not colour.

Project folder: ${P}. READ FIRST: ${P}\\footage\\SETS.json (the film, the global "rules", and your set's role/look/queries/sources).
Tool (use exactly these; run from any folder):
  ${TOOL} search <mixkit|coverr|nasa|archive|openverse|pixabay> "<query>" --n 12   -> JSON lines of candidates (source, id, title, page, url, license)
  ${TOOL} peek <source> <url>        -> six frames of the clip from a low-res variant; prints {"peek": <jpg path>, "duration", "times"}; Read the jpg to SEE it
  ${TOOL} add <set> <url> --source <src> --title "<title>" --page "<page>" --use "<a-b[,c-d]>" --tags "<t1,t2>" --score <1-5> [--notes "..."] [--start s --end s]
       (downloads the full clip, probes it, makes a strip; --start/--end trims long archive films to the excerpt you want)
  ${TOOL} sheet <set>                -> contact sheet of the set's clips (Read it)
  ${TOOL} list <set> · ${TOOL} reject <file> --reason "..."
Facts: mixkit/coverr/nasa/archive are reliable; pixabay often answers 403 (skip it if so). Mixkit category slugs come from the query (e.g. "server room" -> server-room); try several phrasings. archive = only Prelinger/FedFlix public-domain films (trim with --start/--end to 5-15 s excerpts). NASA clips begin/end with title slates and logos: exclude them via --use. Bandwidth is shared and slow (~3 MB/s for everyone): ALWAYS peek before add, never add a clip you have not looked at, skip anything over ~120 MB, never fetch 4K.
Quality bar (from the rules): royalty-free/PD only; no watermarks, readable brand logos, celebrities, children, violence; no cheesy corporate stock; cinematic, moody, strong composition; >= 4 s usable.`

const SOURCED = {
  type: 'object',
  properties: {
    set: { type: 'string' },
    added: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, score: { type: 'integer' }, use: { type: 'string' }, why: { type: 'string' } }, required: ['file', 'score', 'use', 'why'] } },
    searched: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'string' },
  },
  required: ['set', 'added', 'searched', 'gaps'],
}
const REVIEW = {
  type: 'object',
  properties: {
    set: { type: 'string' },
    verdicts: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, keep: { type: 'boolean' }, reason: { type: 'string' } }, required: ['file', 'keep', 'reason'] } },
    need_more: { type: 'integer' },
    guidance: { type: 'string' },
  },
  required: ['set', 'verdicts', 'need_more', 'guidance'],
}

const sets = args

const source = (s) => agent(`${COMMON}

YOUR SET: "${s.id}" — target ${s.need} clips (find ${s.need + 1} good ones if you can; quality over quantity).
Steps: (1) read your set in SETS.json; (2) search at least 3 sources/phrasings (use the set's suggested sources first); (3) peek the promising candidates and Read each peek image; (4) add only clips that pass, with an honest --score, a --use range that skips slates/logos/text, and tags describing content+mood; (5) run sheet for your set and Read it; reject anything that turned out wrong; (6) report.
Return what you added (file paths as printed by add), the queries you tried, and any gap (what you could not find).`, { label: `source:${s.id}`, phase: 'Source', schema: SOURCED })

const review = (src, s) => agent(`${COMMON}

You are the ART DIRECTOR + LICENCE CHECKER for set "${s.id}" (target ${s.need} clips). Do not trust the sourcing agent's notes; look yourself.
1. ${TOOL} sheet ${s.id}  and Read the sheet image (each row = one clip, 6 frames across its length).
2. Read ${P}\\footage\\raw\\${s.id}\\manifest.jsonl: source must be one of mixkit/coverr/nasa/archive/openverse/pixabay with a royalty-free/PD licence; archive items must be Prelinger/FedFlix public domain.
3. For every clip decide keep/reject against the set's role and look in SETS.json and the rules (fit to the role, composition, no watermark/brand logo/celebrity/children in the usable range, not cheesy, not near-duplicate of another kept clip). For each reject run: ${TOOL} reject <file> --reason "<why>".
4. need_more = how many more clips the set needs to reach a strong ${s.need}; guidance = exactly what to look for.
The sourcing agent reported: ${JSON.stringify(src ? { added: src.added, gaps: src.gaps } : 'nothing (it failed)')}`, { label: `review:${s.id}`, phase: 'Review', schema: REVIEW })

const fill = (rev, s) => (!rev || rev.need_more <= 0) ? Promise.resolve({ set: s.id, added: [], searched: [], gaps: '' }) : agent(`${COMMON}

YOUR SET: "${s.id}". The art director kept/rejected clips and wants ${rev.need_more} more. Guidance: ${rev.guidance}
Verdicts so far: ${JSON.stringify(rev.verdicts)}
Find and add ${rev.need_more} more clips that satisfy the guidance (peek first; different from what is already kept), then run sheet for the set, Read it, and reject anything that fails. Return what you added.`, { label: `fill:${s.id}`, phase: 'Fill', schema: SOURCED })

const results = await pipeline(sets, (s) => source(s), (src, s) => review(src, s), (rev, s) => fill(rev, s).then((f) => ({ set: s.id, review: rev, fill: f })))
const short = results.filter(Boolean).map((r) => ({ set: r.set, kept: r.review ? r.review.verdicts.filter((v) => v.keep).length : 0, rejected: r.review ? r.review.verdicts.filter((v) => !v.keep).length : 0, filled: r.fill ? r.fill.added.length : 0, gap: r.fill && r.fill.gaps ? r.fill.gaps : (r.review ? r.review.guidance : '') }))
log(`sets done: ${short.length}/${sets.length}`)
return short