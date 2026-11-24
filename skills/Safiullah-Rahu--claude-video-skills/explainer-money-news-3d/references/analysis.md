# Money-news 3D — frame-by-frame notes on the source

Analysed 2026-11-01, locally for reference only (720×1280, 30 fps, 75.62 s): engine metrics, opening/timeline/shots/
strips/ending/animated sheets, a 2.2 s sweep, 18 full-resolution stills, the analyzer's own cut / scene-change times
(`tools/scene_times.py`) and an audio probe (RMS per 100 ms and band energy in the gaps).

---

## 1. Identity

A 75-second **market-news explainer** for a finance account: one company's bad day told as a fast, confident chain of
"devices". It opens on a **photoreal 3D money image** (an endless warehouse of cash pallets), states the loss and the
worry in one breath, then alternates two worlds: **dark, spot-lit 3D props** (poker chips on felt, a receipt printing
endless $1,000,000,000 lines, columns of cash, server racks with LEDs) and **cream editorial cards** (a serif
"The strange part?" headline over white stat cards, a yellow-tape "TWIST", two-card logic, a split-flap board). Dark
**chart cards** (a crashing line with a red tag, a year counter, a bar that flips negative, a slider with two mini
charts) bridge them. Every line is captioned in **heavy condensed caps built word by word**, one keyword coloured.
The voice is a fast male narrator (176 WPM overall) over a continuous low bed with whooshes and ticks. The close is a
split-flap reframe (not whether, but when), a comment question and the account's profile on a tilted
phone.

## 2. Beat map (measured times; % of 75.6 s)

| t (s) | % | device | what is on screen | VO (paraphrased) |
|---|---|---|---|---|
| 0.0–3.3 | 0–4 | **hook · 3D money** | dolly forward high over an aisle between cash pallets, ceiling LED rows converge; captions centred at ~30 % height, word by word: the company and the loss verb (the verb red), then the amount | the loss |
| 3.3–4.0 | 4–5 | light-out beat | the time span (red); the camera tilts down and the hall goes dark | the time span |
| 4.0–7.0 | 5–9 | **hook 2 · 3D prop** | poker chips on green felt under one spotlight drop in one by one; a gold "AI" chip lands last; captions top-left: the open-loop line in two rows | the open loop |
| 7.0–10.2 | 9–13 | **cream ticker card** | label "…'S PARENT COMPANY", wordmark slides in, "TICKER" + a 5-tile split-flap flips to the ticker; black chip "ON THE NASDAQ" | company, ticker, exchange |
| 10.2–13.5 | 13–18 | **dark chart card** | ticker pill, "FELL AS MUCH AS", red "↓ 13 %" counting 10 → 13, white line flat then a vertical cliff, red tail, red end tag with the price, "CLOSED $…" label | the % drop |
| 13.5–16.5 | 18–22 | dark "worst" card | a two-line "worst day" label (red / white), a "since" label, a year counter running 2026 → 2004 over a tick ruler with a red marker | the historical frame |
| 16.5–24.4 | 22–32 | **"The strange part?"** | serif headline typed word by word on cream; white stat card 1 (A YEAR AGO grey bar vs NOW blue bar, green "2×" chip), card 2 (EXPECTED vs ACTUAL, "+12 %" chip) | the contradiction |
| 24.5 | 32 | cut (3-frame crossfade) | dark: the question in two rows over a stock photo of traders (real people) | the question |
| 26.2–33.1 | 35–44 | **the receipt** | push-up to a grey wall: a clip holds a long thermal receipt (company · CAPITAL SPENDING · quarter); lines "001 $1,000,000,000…"; fast motion-blurred scroll to "TOTAL $51.36B · THANK YOU"; captions low-left in black | "The bill." + the amount |
| 33.2–39.1 | 44–52 | **bar that flips** | dark: "FREE CASH FLOW", a green positive bar, then the bar drops through zero to a red negative value | the swing |
| 39.1–41.8 | 52–55 | **"TWIST"** | cream: the twist line, its key word black on a yellow tape block (RGB-split glitch in), and a grey second line | the third loop |
| 41.8–51.6 | 55–68 | **second company · 3D** | light-streak wipe to a dark hall with spotlights: a time caption (its last word blue), the second company's logo, two columns of cash pallets with an outlined "$5B" floor tile; then two server racks whose LEDs turn green → red | the knock-on effect |
| 51.7–57.6 | 68–76 | **"Why does that matter?"** | vertical push to cream: serif headline; two white cards → a red "COST" chip and a green "REVENUE" chip; a banknote flies between them | cost for one, revenue for another |
| 57.7–63.1 | 76–84 | **slider** | dark: "SPEND TOO MUCH" knob right, two mini charts (red-bordered falling, green rising); "SPEND TOO LITTLE" knob left, the cards swap | the trade-off |
| 63.2–68.4 | 84–90 | **split-flap reframe** | blocky tile wipe to cream; a header; an 8×3 board with the first half of the reframe; a second header; the board flips to the second half (its key word yellow) | the last line recontextualises |
| 68.5–75.6 | 90–100 | **phone CTA** | the cream frame shrinks into a 3D-tilted phone on dark purple; comments sheet opens; swipe to the account's profile, its logo above the phone; "NOT FINANCIAL ADVICE" small at the bottom | comment question, follow |

Scene changes (analyzer): 3.3 · 6.7 · 10.2 · 15.8 · 24.0 · 25.8 · 27.8 · 33.2 · 38.7 · 41.3 · 44.0 · 48.2 · 51.7 · 57.7 ·
63.2 · 68.5 s — median 4.2 s apart, never more than 8.2 s. Hard cuts: only 4 (24.5, 26.2, 39.1, 41.8): the rest are
3–8-frame pushes, a light-streak wipe, a tile wipe and the phone shrink.

## 3. Caption system (full-res stills, scaled ×1.5 to 1080×1920)
- Font: heavy condensed grotesque, all caps (Anton / Oswald-Bold class), leading ≈ 1.0, cap height 75–105 px.
- Build: one word appears at a time on its spoken syllable (1–2-frame fade + small rise); a phrase holds 2–4 words on
  one or two lines and is replaced, not scrolled.
- Position: on 3D and dark shots left-aligned at ≈ 12 % from the left, block top at 15–17 % of the height; the opening
  shot centred at ≈ 30 %; the receipt shot low-left (≈ 73 %) in black; on cream ink-black, centred, top ≈ 17 %.
- Colour: white with a soft dark shadow on dark, near-black on cream; exactly one keyword per phrase coloured: red for
  a loss ("LOST", "SINGLE DAY", "SPOOKED", "WORST", "MUCH"), gold for amounts and the subject ("WORRY", "AI", "$5B"),
  blue for time or the cool side ("NIGHT", "LITTLE").
- Cards replace captions while their own text carries the line (ticker card, chart card, stat cards, "TWIST", serif
  headlines, split-flap).

## 4. Visual system
- Two worlds: **dark** (#0c1018 → #060b0e, spot-lit 3D props, dark chart cards) and **cream** (#eae7dd paper with a
  faint grain, white stat cards with soft shadows and 1 px edges). Cream is 33 % of all pixels; dark frames 43 %.
- 3D props: one hard top spotlight each with a visible cone in haze, dark concrete floors, mild depth of field, money
  always banknote-textured (bundles with straps).
- Charts: white line, red crash segment with glow and a red price tag, mono labels; green/red bars; a blue → red
  slider track; mini charts with red/green borders.
- Accent rule: red = loss, green = gain / revenue, yellow = the subject or the twist, blue = baseline / "now".

## 5. Sound (audio probe)
- A continuous bed: the energy in every gap sits in 30–400 Hz (sub pulses / bass); the quietest 100 ms windows reach
  −50 … −58 dB at only three points; total silence 1.0 s (the final second).
- Whooshes on every push and wipe, ticks under the split-flaps and the receipt, impacts on big numbers and "TWIST".
- One male narrator, fast and level (≈ 190 WPM while speaking, 176 overall), gaps of 0.3–1.0 s between sentences.
- −14.1 LUFS integrated.

## 6. Retention devices in the source
1. Stakes in the first second on a money image, no logo or title.
2. An open loop at 5 % (a reason that should worry a whole group of viewers).
3. A contradiction at 22 % ("The strange part?"): good numbers before the bad one.
4. A question + one-word answer at 33 %.
5. A twist promise at 52 % (an overlooked angle).
6. "Why does that matter?" at 69 % → a simple economic logic.
7. A reframe at 84 % on a split-flap (not whether → when).
8. A comment question and a follow CTA on a phone mockup.

## 7. What not to copy
The account name and logo, the real company logos the source draws, the stock photo of real traders, the script and the
story. The skill replaces logos with plain wordmarks or tickers, the photo with a 3D set, and asks for a new, current,
double-sourced story.
