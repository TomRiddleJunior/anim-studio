export const meta = {
  name: 'ai-footage',
  description: 'Source royalty-free / public-domain footage for 13 AI-themed sets (no AI-generated clips, no logos), then review each set and fill gaps',
  phases: [
    { title: 'Source', detail: 'one agent per set: search, peek, add windowed 720p clips' },
    { title: 'Review', detail: 'contact-sheet review per set: reject logos/AI-generated/bad fits, fill gaps' },
  ],
}
const P = 'state-of-ai'
const SETS = [
  { id: 'robots_humanoid', need: 5, role: 'humanoid robots walking, working, a robot face or hand close-up; also robot dogs', q: ['humanoid robot', 'robot walking', 'robot hand', 'android robot face', 'robot dog'] },
  { id: 'robot_arms_factory', need: 5, role: 'industrial robot arms, automated assembly lines, warehouse robots, sorting machines', q: ['robotic arm', 'industrial robot', 'automated factory', 'warehouse robot', 'assembly line robots'] },
  { id: 'chip_fab', need: 5, role: 'semiconductor cleanroom workers in bunny suits, silicon wafers, microchip and circuit-board macro shots', q: ['semiconductor', 'microchip', 'circuit board macro', 'silicon wafer', 'cleanroom'] },
  { id: 'power_grid', need: 5, role: 'high-voltage transmission lines and pylons, substations, cooling towers steaming, power plants at night, turbines', q: ['power lines', 'electricity pylons', 'cooling towers', 'power plant night', 'electrical substation'] },
  { id: 'phone_ai_users', need: 6, role: 'people using phones and laptops (typing a message, scrolling), faces not the focus or anonymous; screens generic with no brand UI', q: ['typing on phone', 'using smartphone night', 'laptop typing', 'person using phone city', 'scrolling phone'] },
  { id: 'autonomous_car', need: 4, role: 'self-driving / sensor-equipped car, car driving at night from inside without a driver visible, lidar-like sensors, traffic flow', q: ['self driving car', 'autonomous vehicle', 'car sensors', 'driving at night pov', 'traffic aerial night'] },
  { id: 'trading_screens', need: 5, role: 'stock market tickers and charts on screens, red/green numbers, financial district skyline, trading desk monitors (no readable brand)', q: ['stock market', 'stock chart screen', 'trading screens', 'financial district', 'stock ticker'] },
  { id: 'cyber_security', need: 4, role: 'cybersecurity atmosphere: code with alerts, network monitoring screens, server-room lights, a lock, binary data (real screens preferred over CG)', q: ['cyber security', 'hacker code', 'network monitoring', 'data security', 'binary code screen'] },
  { id: 'government_buildings', need: 5, role: 'parliament or capitol-style buildings, a legislative chamber, flags of the EU (no other emblems), a courthouse, a press-conference podium without a person, documents being signed (hands only)', q: ['parliament building', 'capitol building', 'european union flags', 'courthouse', 'signing document'] },
  { id: 'classroom_students', need: 4, role: 'students in a classroom or lecture hall, studying with laptops, a teacher at a whiteboard (anonymous wide shots)', q: ['students classroom', 'lecture hall', 'students laptops studying', 'university library'] },
  { id: 'medical_ai', need: 5, role: 'MRI/CT scanners, radiology screens with scans, hospital lab work, DNA/protein models, a doctor reviewing images (faces not the focus)', q: ['mri scan', 'radiology', 'hospital laboratory', 'dna', 'medical research'] },
  { id: 'world_cities', need: 6, role: 'establishing aerials or skylines at dusk/night of Shanghai or Shenzhen, Seoul, Bengaluru or Mumbai, Paris or Brussels, Dubai, San Francisco Bay', q: ['shanghai skyline', 'seoul night', 'mumbai skyline', 'paris aerial', 'dubai night', 'san francisco aerial'] },
  { id: 'data_network', need: 5, role: 'fiber optics, flowing light data, network nodes, data streams on screens, glowing cables (real footage preferred; tasteful CG motion graphics acceptable, but NEVER AI-generated video)', q: ['fiber optic', 'data network', 'digital data flow', 'network cables', 'server lights'] },
]
const COMMON = `Project ${P}: a music video "The State of AI — October 2026" in the style of anabology's ESCAPE VELOCITY (128 BPM electroclash, broadcast
chrome over footage). Footage library tool: \`python tools/footage.py\` (run from ${P}; commands: search <mixkit|coverr|nasa|archive|pixabay|openverse> "<q>" --n 12,
peek <source> <url> (six frames → footage/_peek/<id>.jpg — Read it BEFORE adding), add <set> <url> --source S --title T --page URL --use "a-b"
--tags t1,t2 --score 1-5 (fetches only the usable ≤14 s window at 720p), sheet <set> (→ footage/raw/<set>/_sheet.jpg), list, reject <file> --reason R).
Rules: royalty-free licences only (Mixkit, Coverr, Pixabay content licence, NASA public domain, Internet Archive public-domain collections);
REJECT anything labelled AI-generated (check the title/page — the user wants real footage); no readable brand logos or legible product UI, no
identifiable celebrities or real politicians; no readable signage text; prefer 1080p sources (the tool fetches 720p windows), real camera
footage, cinematic mood (night, neon, cold blue, dramatic light) that sits under a dark broadcast overlay. Note in --use the best usable range.`
const results = await pipeline(
  SETS,
  (s) => agent(`${COMMON}

Fill the set "${s.id}" with ${s.need} strong, varied clips. Role: ${s.role}. Start with queries like: ${s.q.join(' · ')} — try several sources
(Mixkit and Coverr first; Pixabay is intermittent; NASA/Archive where relevant) and your own variations. Peek before adding. Score honestly.
Return a short report: what you added (file, why, usable range), what you could not find.`, { label: `source:${s.id}`, phase: 'Source' }),
  (r, s) => agent(`${COMMON}

Review the set "${s.id}" (role: ${s.role}). Build its sheet (\`python tools/footage.py sheet ${s.id}\`) and Read it; peek further at any clip
you doubt. Reject clips with logos/legible brands or text, AI-generated labels, identifiable public figures, poor quality, or a weak fit
(\`reject <file> --reason\`). If fewer than ${s.need} good clips remain, source more until the set is full. The sourcer reported:
${String(r ?? '').slice(0, 3000)}
Return: kept, rejected (why), filled, gaps.`, { label: `review:${s.id}`, phase: 'Review' }),
)
return SETS.map((s, i) => ({ set: s.id, report: String(results[i] ?? '').slice(0, 1500) }))
