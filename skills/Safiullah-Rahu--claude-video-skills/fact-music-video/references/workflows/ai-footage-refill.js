export const meta = {
  name: 'ai-footage-refill',
  description: 'Refill the State-of-AI footage library with commercially-safe royalty-free clips only (Mixkit Free License, Coverr, Pixabay, NASA, PD archive), sets mapped to the 16 fact beats',
  phases: [
    { title: 'Refill', detail: 'one agent per 2-3 sets: search, peek, add, then sheet self-review' },
  ],
}
const P = 'state-of-ai'
const GROUPS = [
  [ { id: 'server_hall', need: 6, role: 'data-centre aisles, server-rack lights, cable trays, engineers walking a server aisle (faces not the focus) — beats: AI labs, test incidents' },
    { id: 'data_network', need: 5, role: 'fiber optics, glowing cables, network switches with blinking ports, data streams on monitors, download progress (generic, no brand UI) — beat: open-weight models & downloads' } ],
  [ { id: 'cyber_security', need: 5, role: 'security operations: code with alerts on screens, network monitoring, a padlock, keycard access door, badge reader, locked glass door — beats: vetted-only cyber capability, an agent break-in' },
    { id: 'trading_screens', need: 5, role: 'stock tickers and red/green charts on monitors, a trading floor (no readable brands), financial district skyline — beat: IMF warning on circular AI deals' } ],
  [ { id: 'datacenter_exterior', need: 4, role: 'large data-centre buildings, construction cranes on a data-centre site, rooftop cooling units, aerial of a server campus — beat: big-tech capex' },
    { id: 'oil_gas', need: 4, role: 'oil pumpjacks at sunset, offshore platform, refinery at night, gas flare — beat: tech capex now exceeds oil & gas production investment (comparison)' } ],
  [ { id: 'hurricane_satellite', need: 5, role: 'hurricanes seen from orbit (NASA/ISS/NOAA public domain is ideal), satellite cloud imagery, weather radar, storm surf on a coastline, forecasters at weather screens — beat: AI storm-track forecasts give 30 more hours of warning' },
    { id: 'medical_ai', need: 5, role: 'radiology: mammography or X-ray/CT images on a reading monitor, a radiologist reviewing scans (face not the focus), MRI/CT scanner, hospital corridor — beat: AI-supported mammogram screening trial' } ],
  [ { id: 'government_buildings', need: 5, role: 'neoclassical government buildings and columns, a legislative chamber, the European Parliament / EU Commission buildings in Brussels, Washington DC monuments at dusk (avoid prominent national flags as the subject) — beats: US executive order, EU and FTC questions' },
    { id: 'documents_stamp', need: 4, role: 'a rubber stamp hitting paper, hands signing a document, envelopes or letters being sealed or sorted, a printing press, paperwork stacks — beats: executive order rename, regulators sending information requests' } ],
  [ { id: 'office_startup', need: 6, role: 'office workers at desks and screens, open-plan office at night, young professionals in a meeting, an empty office, someone carrying a box out of an office (anonymous) — beat: IMF says 40% of jobs exposed to AI' },
    { id: 'robot_arms_factory', need: 4, role: 'industrial robot arms, automated assembly lines, warehouse automation, sorting machines — beat: automation and jobs' } ],
  [ { id: 'world_cities', need: 5, role: 'night skylines/aerials: Shanghai or Shenzhen or Hangzhou, Seoul, Mumbai or Bengaluru, Paris or Brussels, generic megacity aerial — beats: Chinese open models, worldwide jobs' },
    { id: 'crowd_city', need: 6, role: 'crowds crossing a street, commuters on a platform, a busy plaza from above, people walking at night (anonymous, no single identifiable face as the focus) — beat: 77% of Americans want AI slowed or stopped' } ],
  [ { id: 'eye_lens_test', need: 4, role: 'macro of a human eye opening or looking (anonymous), a camera lens iris, a scientist looking through a microscope or a one-way glass observation room, laboratory test rigs — beat: models often suspect they are being tested' },
    { id: 'typing_hands', need: 4, role: 'hands typing on a keyboard, code being written, a developer at night with monitor glow (no readable brand UI) — beat: nine model launches in forty days' },
    { id: 'split_flap', need: 4, role: 'split-flap departure board flipping, flip clock, calendar pages turning, a wall calendar being marked (no readable brand/airport names) — the chanted list of upcoming dates' } ],
  [ { id: 'abstract_light', need: 4, role: 'real abstract light: neon tubes, lens flares, light leaks, laser beams in haze, bokeh city lights — choruses' },
    { id: 'concert_crowd', need: 4, role: 'club/concert crowd with hands up in strobe light, festival lasers over a crowd, DJ booth lights (no readable branding) — choruses' },
    { id: 'singer_mic', need: 4, role: 'a female singer at a microphone in moody stage light (stock talent, not a celebrity), close-up of a mic, singer silhouette — choruses' } ],
]
const COMMON = `Project ${P}: a music video "The State of AI — October 2026" (128 BPM electroclash, broadcast chrome over real footage). Footage tool:
\`python tools/footage.py\` (run from ${P}; commands: search <mixkit|coverr|nasa|archive|pixabay|openverse> "<q>" --n 12, peek <source> <url>
(six frames → footage/_peek/<id>.jpg — Read it BEFORE adding), add <set> <url> --source S --title T --page URL --use "a-b" --tags t1,t2 --score 1-5
(fetches only the usable ≤14 s window at 720p), list [set], sheet <set> (→ footage/raw/<set>/_sheet.jpg), reject <file> --reason R).

LICENCE RULE (hard): the film must be usable commercially. Allowed: Coverr (Coverr License), Pixabay (Pixabay Content License), NASA public-domain
media (no NASA insignia as the subject), Internet Archive public-domain collections, and Mixkit ONLY under the Mixkit Free License. Mixkit labels
every clip individually and most tech clips are "Mixkit Restricted License" = personal use only. The tool now checks this: \`search mixkit\` only
returns Free-licensed clips and \`add --source mixkit\` refuses Restricted ones — never try to work around that. Never use any other site.
Many clips in this library were already rejected for that licence; do not re-add them.

CONTENT RULES: REJECT anything AI-generated (check title/page; the user wants real footage) and 3D/CG renders that look synthetic; no readable
brand logos, legible product UI or signage text; no identifiable celebrities or real politicians; no gore. Prefer 1080p real camera footage with
a cinematic mood (night, neon, cold blue, dramatic light) that will sit under a dark broadcast overlay. Coverr and Pixabay are the deepest pools;
NASA for anything orbital/weather. Put the best usable range in --use and score honestly.`
const results = await pipeline(
  GROUPS,
  (g) => agent(`${COMMON}

Refill these sets (some already hold surviving clips — run \`python tools/footage.py list <set>\` first and count only those):
${g.map(s => `- "${s.id}": reach ${s.need} strong, varied clips. Role: ${s.role}`).join('\n')}

Try several sources and your own query variations; peek before every add. When a set is full, build its sheet and Read it as a self-review:
reject anything that fails the rules or is a weak fit, then top up. Return a short report per set: final count, what you added (file, usable
range, licence/source), what you rejected and why, and any gap you could not fill.`, { label: `refill:${g.map(s => s.id).join('+')}`, phase: 'Refill' }),
)
return GROUPS.map((g, i) => ({ sets: g.map(s => s.id), report: String(results[i] ?? '').slice(0, 2500) }))