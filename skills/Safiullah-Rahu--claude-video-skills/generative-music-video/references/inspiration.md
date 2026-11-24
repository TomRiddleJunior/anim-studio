# External references (collected by the user)

Design, motion and three.js resources to consult when a plate needs ideas: composition and typography,
choreography and easing, UI anatomy for plates that stage an interface, design-system discipline, 3D/shader
starting points. Use them for **ideas and technique**, never to lift a design wholesale (treatment.md §8:
originality, no imitation of real product UIs or logos). Browse them with the built-in browser or a web fetch
when you need them; ask the user before downloading code or assets, and credit sources whose licences ask for it.

Entries marked *(reviewed)* were checked on 2026-09-27; the others are described from the user's notes and
their names — open them before relying on specifics.

## Motion and choreography
- **https://motionin.design** — "Motion Sections" *(reviewed)*: premium interactive web sections (heroes,
  portfolios, product showcases, immersive pages) with copy-a-prompt code and technical breakdowns: scroll
  choreography, 3D CSS transforms, canvas physics, WebGL, optical effects (glass refraction, displacement),
  typographic animations. Use for choreography ideas and how a sequence builds; translate scroll-driven motion
  into beat-driven motion (scroll position → song time).
- **https://transitions.dev** *(reviewed)*: a curated library of UI transitions (card resize, text swaps,
  modal enters, shimmer and skeleton effects, button/dropdown interactions) with copyable code and an agent
  skill (Pro tier exists). Use for text-swap and reveal patterns → adapt to karaoke line hand-offs and word reveals.
- **https://emilkowal.ski/ui/you-dont-need-animations** — Emil Kowalski's essay on when animation earns its place
  and when it gets in the way. The lesson for this medium: every move needs a purpose (reveal the lyric, mark
  the beat, carry the motif); decorative motion competes with the words.
- **https://ui-skills.com** *(reviewed)*: a catalogue of design-engineering skills and prompts for AI agents
  (CLI `npx ui-skills`, MCP), including motion skills ("improve-animations", "12-principles-of-animation",
  "interaction-design") and typography polish. Useful checklists when refining a plate's motion and type.

## Visual references: layout, typography, colour
- **https://landdding.com** — "Visual references" *(reviewed)*: a daily-updated gallery of 2,400+ landing pages
  (Webflow, Framer, …) browsable by category, colour and typography. Great for type pairings, grid layouts,
  palettes and big-type compositions to adapt into plates and style.json presets.
- **https://wedoflow.com** — "1,300+ website pages": a large library of page designs; mine it for layout systems
  and section compositions (hero / grid / editorial) to reinterpret as plates.
- **https://modulify.ai/templates** — "Templates": website templates/sections; the same use as above.
- **https://beautifului.dev**, **https://rareui.com** — curated UI design / component showcases; look here for
  unusual, crafted interface moments when a plate stages an interface.

## UI anatomy (for plates that stage an interface — invented, never imitations of real products)
- **https://ui.shadcn.com** — shadcn/ui: open-source, accessible React component recipes (Radix primitives +
  Tailwind). Reference for believable component anatomy (fields, dialogs, menus, toasts, spacing, states)
  when a plate is a prompt field, a form, a dialog or a notification.
- **https://coss.com/ui**, **https://reui.io/components**, **https://beui.dev** — further component libraries in
  the same spirit (many shadcn-compatible, some animated); same use.

## Design-system discipline
- **https://designsystemchecklist.com** — a checklist for building design systems. Apply its thinking to
  style.json: colour roles with contrast, a type scale and pairing, spacing/grid, motion tokens (durations,
  eases), consistency across every plate.

## three.js starting points
- **ThreeUI** — https://threeui.com · repo https://github.com/MengTo/threeui *(site reviewed)*: an open-source
  library of three.js components and landing pages — procedural 3D hero sections, WebGL backgrounds, shader
  buttons, text animations, icons and motion designs (160+ free per the author; copy the prompt or source, then
  change theme, lighting, motion or layout). Good raw material for 3D plates and backgrounds: port with
  cookbook.md §14 (song time instead of a clock, seeded randomness, the shared renderer, palette colours,
  closed-form motion) and restyle it into the video's idiom.
- **mexicat/pdoom-video** — https://github.com/mexicat/pdoom-video: the reference video this skill generalizes;
  its `app/src/scenes/` are the best examples of complete plates (references/scenes.md maps them to techniques).
