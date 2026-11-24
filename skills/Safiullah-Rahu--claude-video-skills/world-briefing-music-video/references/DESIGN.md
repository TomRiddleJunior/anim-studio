# THE STATE OF THE WORLD · OCTOBER 2026 — design brief

A ~4–5 minute narrated documentary briefing on world affairs as of mid-October 2026. Calm, factual and balanced:
attribute claims, show sources on screen, and give each story its context. Not only doom: end on what is improving
and what to watch.

## Concept: the newsroom atlas
The spine of the film is a **night globe**: navy oceans, slate land, hairline borders, a graticule. Between stories the
globe turns and flies to the next region. Countries light up in vermilion, and arcs and city pins appear on the words
that name them. Each story then opens into an **editorial plate**. These are Qwen-Image 2.1 illustrations in one
consistent risograph style: two-colour navy and vermilion on warm paper, symbolic, never a real person's likeness. Over
the plate sit the **data graphics**: big serif numerals counting up, simple charts drawing on, timelines. Every number
carries a mono source line: "SOURCE · UNHCR · JUN 2026".

## Visual system
- Palette: night `#0A1020`, panel `#111A2E`, paper `#F3EFE6`, ink `#0B1220`, vermilion accent `#E4572E` (one hot
  value per frame), teal `#4FB3A5` for hopeful notes, slate `#8A93A8` for secondary text.
- Type:
  - Newsreader (serif) for headlines and numerals.
  - Inter Tight for body and captions.
  - IBM Plex Mono for kickers, labels, sources and dates.
- Chrome:
  - top-left `WORLD BRIEFING · OCTOBER 2026`;
  - top-right a segment counter `04 / 10` and the segment kicker;
  - a hairline progress bar at the bottom;
  - captions in a quiet band above it.
- Motion:
  - outExpo entries of 0.3–0.5 s on the word they illustrate;
  - fast exits;
  - the globe turns with inOutCubic over 1–2 s;
  - numerals count over 0.8–1.2 s;
  - charts draw on left to right;
  - nothing decorative moves without meaning.
- Plates: 1664×928, slow Ken Burns (1.00 → 1.06), a paper-grain overlay, and a navy duotone grade when text sits on them.
  Plate prompt style suffix: *"editorial risograph illustration, two-colour print in deep navy blue and vermilion red
  on warm off-white paper, visible halftone grain and slight misregistration, bold simplified shapes, symbolic and
  restrained documentary tone, no text, no letters, no logos, no flags with readable symbols, no recognizable real
  people"*.

## Ethics
- Facts come from the verified fact sheet only (`research/FACTSHEET.md`), with sources on screen and in the credits.
- Contested claims are attributed ("Ukraine says…", "Israel says…").
- No graphic violence. People are depicted symbolically or as anonymous silhouettes.
- No generated image imitates a news photo or a real person.
