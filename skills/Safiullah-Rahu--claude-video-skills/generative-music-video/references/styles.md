# Styles: presets, palette roles, fonts, making a new one

A style is `style.json` at the project root (+ the font files it names). Apply a preset with
`gmv.py style <dir> <preset>` (writes style.json, downloads the fonts as static instances into
`app/public/fonts/`, rewrites `fonts.json`), then edit freely. Presets live in `<skill>/assets/styles/*.json`.

## The ten presets

| preset | ground | display / text / mono | fits | idiom in one line |
|---|---|---|---|---|
| `engraved` (default, bundled fonts) | dark | Archivo (width axis) / Cormorant Garamond / IBM Plex Mono | conceptual, witty, electronic, pop | plates from a treatise: engraving, instruments, forms; only the signal glows |
| `swiss-poster` | paper | Instrument Sans (wdth 75–100) / Instrument Serif / JetBrains Mono | indie, minimal, art-pop, post-rock | grid-first, flush left, big contrasts, one red |
| `risograph` | paper | Bricolage Grotesque (wdth) / Fraunces / Space Mono | indie/bedroom/dream pop, playful | two spot inks (blue + pink), misregistration (CA), halftone, nothing glows |
| `blueprint` | dark (Prussian blue) | Saira (wdth 50–125) / Newsreader / IBM Plex Mono | math rock, techno, prog, songs about systems | everything drafted: dimension lines, callouts, revision stamps; yellow marks change |
| `noir` | dark | Oswald / Playfair Display / Courier Prime | dark, cinematic, trip-hop, rock, heartbreak | light is the subject: blinds, a lamp, smoke; red once per scene |
| `bauhaus` | paper | Jost / DM Serif Display / DM Mono | upbeat, funk, synth-pop, rhythmic | primitives only (circle, square, triangle), primaries, lowercase |
| `botanical` | paper (ivory) | Fraunces / EB Garamond / Courier Prime | folk, acoustic, ballads, nature | copperplate engraving, specimen labels, vermilion rubric |
| `strobe` | dark (black) | Anybody (wdth 50–150) / Instrument Serif / Space Mono | EDM, techno, DnB, hyperpop | club light: cuts on kicks in drops, white strobes, width jumping 50↔150 |
| `xerox-zine` | paper | Big Shoulders Display / Special Elite / Courier Prime | punk, hip-hop, garage, protest | cut-and-paste ransom strips, stamps, photocopy grit, frame jitter |
| `amber-scope` | dark (warm black) | Space Grotesk / Newsreader / IBM Plex Mono | ambient, retro-futurist, night drive, space | instrument faces glowing under glass; the only style where fg blooms |

Each preset also carries `mood` (when to pick it), `scenes` (default params per starter scene, e.g. `lines.grid`)
and `idiom` (the sentence to design plates against). Picking: match the song's register first (tender / furious /
euphoric / deadpan), then its genre; when two fit, propose both with one sentence each and recommend one.

## style.json

```json
{
  "name": "…", "description": "…", "idiom": "the design sentence plates follow",
  "palette": { "bg": "#…", "bg2": "#…", "dim": "#…", "mid": "#…", "fg": "#…", "accent": "#…", "hot": "#…", "deep": "#…", "rare": "#…", "anyExtra": "#…" },
  "fonts": { "display": "Family", "text": "Family", "mono": "Family", "stroke": "script" },
  "post": { "bloom": 0.55, "bloomThreshold": 1.0, "bloomKnee": 0.25, "halation": 0.25, "ca": 1.2, "grain": 0.055, "vignette": 0.35 },
  "type": { "case": "none|upper|lower", "tracking": 0 },
  "motif": "spark|dot|none",
  "scenes": { "lines": { "grid": 0.5 }, "slam": { "weight": 900 }, "interlude": { "variant": "bars" } }
}
```

Scenes read it through `engine/palette.ts` (`HEX`, `LIN`, `rgba()`, `DARK`, `STYLE`) and GLSL constants
(`C_BG` … `C_RARE`, extras uppercased, `DARK`). The post block merges over the engine defaults (light styles get
their own defaults when `bg` is lighter than `fg`).

## Palette roles — rules that keep it looking designed

- **Roles, not hues.** `bg` ground, `bg2` raised panels, `dim` hairlines/secondary, `mid` labels/unsung,
  `fg` type and ink, `accent` the one signal colour, `hot` its lighter/hotter core, `deep` its shadow
  (halation tint derives from accent+deep), `rare` a second accent owned by one moment of the video.
- **Contrast**: fg on bg ≥ 12:1 for dark styles, ≥ 10:1 for paper; `mid` must still read on bg for small mono labels.
- **One accent.** Everything else is neutral (warm or cool, not both). The accent marks the sung word, the motif,
  and the one thing that matters in a plate. If you need two accents, make it a deliberate two-ink system
  (risograph) and still keep one per plate.
- **Warmth**: pure #000/#FFF look digital; slightly warm blacks (#0A0A0B) and papers (#F3F0E8) look printed —
  unless the style is about the digital (strobe).
- **Glow belongs to dark styles and to the accent.** With `bloomThreshold: 1.0` fg type (~0.85 linear) stays
  crisp and the accent glows only when pushed above 1 (`glow('accent', 2.5)` in LineBatch colours).
  Paper styles: `bloomThreshold` > 1.2, low bloom, halation ≈ 0; shade with hatching, not light.
- **Polarity inside the edit**: `plate(true)` flips ground and ink for one plate (paper plate in a dark video or
  the reverse); the accent stays. Return `paper: 1` from light plates so HUD elements switch colour.

## Fonts

`gmv.py fonts <dir> --role display --family "<Google family>" [--weights 300,500,700,900] [--widths 62.5,75,100,125] [--italic]`
downloads **static instances** from Google Fonts (Canvas2D text and opentype.js outlines must match exactly, so no
variable fonts at runtime) and rewrites `app/public/fonts/fonts.json`; licences are appended to `LICENSES.txt`
(Google Fonts are OFL/Apache). Roles: `display` (the lyric voice), `text` (a rare second register), `mono`
(annotations/UI), plus the single-stroke `stroke` fonts (script, hscript, sans, readable, tech, serif, osmotron,
felix) that ship with the engine for pen-written text.

Display faces with a **width axis** are the most expressive (condense under pressure, stretch on held notes):
Archivo (62–125), Anybody (50–150), Saira (50–125), Instrument Sans (75–100), Bricolage Grotesque (75–100),
Sofia Sans (with Condensed/Extra Condensed families), Roboto Flex, Encode Sans, Big Shoulders (family of widths).
Good text registers: Cormorant Garamond, Instrument Serif, Fraunces, Newsreader, EB Garamond, Playfair Display,
DM Serif Display. Mono: IBM Plex Mono, JetBrains Mono, Space Mono, DM Mono, Courier Prime.
Check a font covers the lyric's language (accents, non-Latin scripts) before committing to it.

## Making a new style

1. Start from the closest preset: `cp <skill>/assets/styles/noir.json <skill>/assets/styles/<new>.json` (to reuse it
   across projects) or edit the project's `style.json` directly.
2. Write the idiom sentence first — it decides the palette and fonts, not the other way round.
3. Palette: pick bg/fg (polarity + temperature), then the accent (its meaning in this video), derive hot (lighter,
   more saturated) and deep (darker), dim/mid as steps between bg and fg, rare last.
4. Fonts: one display family (ideally with a width axis), one text register, one mono.
5. Post: grain (0.03 clean – 0.1 gritty), vignette, CA (misregistration / lens), bloom/halation (dark only).
6. Render the storyboard (`sheet --entries`) and look at it before writing scenes.
