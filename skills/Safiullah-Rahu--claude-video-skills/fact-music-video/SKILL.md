---
name: fact-music-video
description: Make a fact-checked data-journalism MUSIC VIDEO about the news on a topic ("the state of AI / climate / the economy / <topic> this month"), the "State of AI — October 2026" pipeline. Research desks plus adversarial verification build a sourced fact sheet; the lyrics (deadpan spoken facts, a sung chorus that makes no claims, a chanted list of dates) are fact-checked against live sources before any audio exists; an AI song (MiniMax-Music3) is cut to its beat grid over royalty-free real footage; and a broadcast chrome and explaining layer show every number with its source line and caveats, audited frame by frame so no invented or partial number ever appears on screen. Use it whenever someone wants a news recap, "state of X" video, explainer song, data-journalism or fact-checked music video, a topical video with sources on screen, or "like the State of AI / State of the World videos" — even if they only say "make a video about what's happening in X right now". It builds on footage-music-video (engine, footage, song tools). For an illustrated globe-and-plates version see world-briefing-music-video.
---

# Fact-checked music video (the State of AI pipeline)

The reference result is `state-of-ai\out\the-state-of-ai-oct-2026.mp4`: 3:00 at 128 BPM, 16 fact beats, 101 sources, every on-screen number audited frame by frame. Read its `PRODUCTION.md` (copied to `references/PRODUCTION.example.md`) for the full story of one run.

This skill adds the **fact layer** on top of **footage-music-video**. Load that skill too: it covers the engine, song tools, footage library, storyboard, picks, chapters and render. Everything below is what is different when the words are claims.

## Why the extra machinery

A music video compresses facts into 3-second lines and 2-second cards. That compression is where errors creep in:
- a dropped qualifier ("powerful AI … until safety is evaluated");
- the wrong year's date (the Fed's 2025 calendar);
- a lab-incident framing the source itself rejects ("containment failure" vs UK AISI's "not a case of a model escaping");
- a split-flap animation that flashes "38 OCT" while flipping from 28 OCT to 03 NOV.

Every gate below caught one of these in a real run.

## 1 · Research → fact sheet

- **Research workflow** (`references/workflows/ai-state-research.js`): one desk per beat area. For AI the desks were frontier, compute, money, safety, science, work, policy and open/global.
  - Each desk does a web sweep.
  - An **adversarial verifier** then re-checks every claim against primary sources and labels it confirmed [C], corrected [X] or unverified.
  - An editor builds `research/FACTSHEET.md`.
  - Pass the fixed "as of" date to every agent; scripts cannot read the clock.
- **The fact sheet is the single source of truth.** Use `references/FACTSHEET.example.md` as the template. It has:
  - **Beat cards (B01…B16):** the spoken line (≤14 words, 2 bars), the anchor word, the exact on-screen string, the source line `SOURCE · PUBLISHER · MON YYYY`, the attribution and required caveats, and a visual idea with no likeness, logos or flags.
  - **Balance check:** categories covered; lab mentions held to one standard. If the film is made with an Anthropic model, never lead with Anthropic and never praise its products.
  - **A "What to watch" table** of verified future dates.
  - **"Do not say":** the wordings that verification rejected.
  - **Sources S1…Sn** with URLs and dates.
  - **Section 7, "Corrections".** Anything changed later goes here, and it wins over the beat cards.

## 2 · Lyrics, fact-checked before audio

- **Write from the beat cards.**
  - The verse lines are the spoken facts, deadpan, one line per beat.
  - The chorus is **fact-free**: a neutral hook and a crowd answer, e.g. "Who's at the wheel? / EYES ON THE ROAD!".
  - The post-chorus is a chant of dated events, each conditional where needed ("could return", "due to end").
- **Run an adversarial lyric review before generating the song** (see `references/lyrics.example.txt` for the result). It should:
  - re-read live sources for the riskiest 3–5 claims;
  - flag dropped qualifiers, crowned or singled-out labs, election-sounding chorus lines, and anything mishearable when sung fast ("nudify" heard as "nudity"; "export pauses" read as pauses on exports);
  - return exact replacement lines.
- **Record every correction** in fact-sheet section 7.

## 3 · Song and footage

Follow footage-music-video §1–§2. For fact films specifically:
- **Aim for a fast take** (about 128 BPM), and read the take's Whisper transcript line by line for mangled numbers.
- **Footage must match the claim:**
  - no anatomy mismatch (radiology lines get radiology or a neutral hospital shot, never a brain MRI under "mammograms");
  - no identifiable city standing in for another;
  - no real politician's face;
  - stock of a 1958 burglary is fine for a cyber break-in, but label nothing on it as if it were the real event.

## 4 · Storyboard rules for facts

`scripts` live in footage-music-video. Copy its `make_storyboard.py` and adapt it.
- **Chapters:** one per beat (`story: n`), plus intro, choruses (`counter: "CHORUS"`), dates (`counter: "WHAT TO WATCH"`) and outro (`counter: "SOURCES"`).
- **The split-flap board** in the chrome shows a two-row headline per story. Rules:
  - A **fact row changes on its chapter's cut**, after a **blank flip one beat earlier**. A fact row must never sit next to another story's source, or with no source at all.
  - **Date rows land on the day word**, together with the chapter's own date tile, which carries the source.
  - **Choruses and builds get fact-free rows** (LIGHTS ON / EYES OPEN). Hand the last date row off during any instrumental swell before the final chorus.
  - Conditional events read conditionally on the board too: `PAUSES MAY END`, `TRUCE MAY END`.
- **The ticker** carries only true, non-claim text: title, "every number sourced on screen", the checked date, the AI-music label, the footage credit and the research disclosure.

## 5 · Chapters with a fact-checker in the loop

Use `references/workflows/ai-chapter-animation.js`, then `ai-integration.js`. The structure for each chapter group is design → (adversarial fact-check ∥ art direction) → fix. A film-wide audit follows.
- **The fact-checker** extracts every string the chapter can draw and compares it with the fact sheet (section 7 wins). It renders stills both at and just before each landing.
- **Hard rules given to every designer:**
  - On-screen numbers and labels are **exactly** as printed in the fact sheet.
  - The **source line** is visible while its number is up.
  - Required caveats stay visible: `IN TESTING · SAFEGUARDS OFF`, `PROJECTION`, `UNLESS EXTENDED`, `INVESTIGATIONS, NOT FINDINGS`.
  - **No intermediate values:** no count-ups through numbers the sheet doesn't print while a label or source is visible.
  - No logos, flags or likenesses. Labs appear in equal type.
- **The shared primitives** in `assets/app/src/ev/brief.ts` (footage-music-video) enforce part of this:
  - `sourceLine` never reveals a half-typed numeric token ("MAY 20", "n=1,2");
  - `typedBy` finishes the source 0.1 s before its number lands;
  - `land` makes a number arrive whole.
- **The engine's `flaps.ts`:**
  - never spins a digit;
  - settles and clears a numeric token as a whole ("$1.4", "485", "09-10"), so a flip never shows "$1" or "50".

## 6 · The final integrity audit

1. **Text scan.**
   - Run `node scripts/textaudit.mjs --app <project>/app --from 0 --to <dur> --out scan.jsonl` (24 fps; about 1 minute per minute of film). Run it again at 60 fps around anything that animates numbers.
   - Then run `python scripts/scan_numbers.py scan.jsonl --board out/board.json`. It lists every digit string per chapter, marks partial tokens, and rebuilds every flap-board state; a `*` marks any state that is not a settled row.
2. **Coverage.** For every beat, render a still at the landed moment over the real footage. Headline, label, source and caveat must all be there and legible.
3. **Lyrics.** `render.mjs lyrics` must report every sung word on screen while sung (336/336 in the reference).
4. **Licences.** `mixkit_license.py used` must show all Free. Credits must match the sources actually used.

## 7 · Description and corrections log

`out/DESCRIPTION.md` (see `references/DESCRIPTION.example.md`) contains:
- the disclosure ("Researched and written with Claude (Anthropic)…");
- credits;
- **corrections made during fact-checking**;
- the full source list with links.

That list feeds the long-form video description. For short-form posts use the vertical-reels skill and its caption guide.

## Files

| Path | What it is |
|---|---|
| `scripts/textaudit.mjs` | Logs every `fillText` on the overlay at given times (needs the project's `playwright-core` and `vite`). |
| `scripts/scan_numbers.py` | Number-integrity report from a scan. |
| `references/workflows/` | The research, footage, picks, chapter-animation and integration workflows as run. Edit the paths, sets and groups before reuse. |
| `references/FACTSHEET.example.md`, `lyrics.example.txt`, `DESCRIPTION.example.md`, `PRODUCTION.example.md` | Worked examples from the State of AI run. |
