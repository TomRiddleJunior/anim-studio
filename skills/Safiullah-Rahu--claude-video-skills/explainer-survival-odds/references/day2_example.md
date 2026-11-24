# Day 2 example — "Survival Odds · The Rig · Day 2" (measured)

88.25 s · 21 lines · 206 words · Kokoro `am_onyx,am_michael` 1.06 (last line 0.95) · 140.0 WPM overall, 184.0 while
speaking · first word 0.18 s · two black beats · 33 shots · 45 caption phrases. Voice-only respellings: `Meera`,
`[A](/ˈA/)`, `[B](/bˈi/)` (Kokoro's inline phoneme override for the option letters), `A.I.`.

## Script (times = line starts)
| # | t | line | the beat |
|---|---|---|---|
| l01 | 0.18 | Seventy-two hours after the shore went quiet, the platform switched itself off. | cold open + the reveal word ("off") |
| l02 | 6.01 | No gas. No power. No lights. | three inserts, black beat 1 |
| l03 | 9.22 | That was the one thing Mira forgot. | the answer, plainly |
| l04 | 12.23 | This platform was never really hers. It was run from the shore. | the mechanism |
| l05 | 16.80 | It was on the wall screen. | replay P1 |
| l06 | 19.25 | It was on the radio. The shore control room closed at midnight. | replay P2 |
| l07 | 23.69 | And it was on the generator door. Seventy-two hours without the shore… and it shuts itself down. | replay P3 |
| l08 | 30.02 | On the first night, the coast went dark. Nobody was left to keep the link alive. | replay P4 |
| l09 | 35.38 | Even the seagull left. | the gag pays off |
| l10 | 37.80 | So what did she still have? | the recount opens (dawn) |
| l11 | 40.05 | A year of food. Cold, but it's food. | +4 |
| l12 | 43.14 | The watermaker was dead. Forty litres left in the tank. | −6 |
| l13 | 47.33 | But out here, it rains almost every day. | +5 |
| l14 | 50.63 | And without power, there's no heat. The nights drop to five degrees. | −5 |
| l15 | 55.70 | Mira had two choices. | the split |
| l16 | 58.16 | A. Restart the platform by hand. One wrong valve, and the whole rig burns. | option A, its cost |
| l17 | 63.56 | And a lit flare can be seen for miles, by every boat still out there. | option A, its upside |
| l18 | 68.60 | B. Take the lifeboat. Fuel for a day. A hundred and forty kilometres… | option B, its cost |
| l19 | 73.46 | to the same coast she refused to fly to. | black beat 2 |
| l20 | 76.82 | The AI has run the numbers on both. | both cards, both ?? |
| l21 | 80.13 | A or B? What would you do? | the face, determined |
| — | 82.50 | (end card 1) A OR B? + both cards + COMMENT A OR B · THE MOST VOTES DECIDES DAY 3 | the vote |
| — | 85.31 | (end card 2) SURVIVAL ODDS · THE RIG · DAY 3 · FOLLOW FOR DAY 3 | |

## Odds track
| t (s) | % | word | move | value |
|---|---|---|---|---|
| 0.00 | 0 | frame 1 | opens at ?? (chip `DAY 1: 97%`) | ?? |
| 4.08 | 4.6 | "off" | glitch 0.35 s + roll 97 → 23 (strides of 3, 0.95 s), `−74% SHORE LINK LOST` | 23 |
| 40.47 | 45.9 | "food" | +4 FOOD · 1 YEAR | 27 |
| 45.06 | 51.1 | "litres" | −6 WATER · 40 L | 21 |
| 48.15 | 54.6 | "rains" | +5 RAIN | 26 |
| 52.00 | 58.9 | "heat" | −5 COLD | 21 |
Option cards A and B: `??` from their first frame to the end. The main ring holds 21 % through both end cards.

```python
ring = OddsRing(start=None, reveal_from=97)                 # frame 1: a red ?? (dashed, turning) + the sting
ring.chip("DAY 1: 97%", 0.0, T["B1"] - 0.1, "g")
ring.reveal(w("l01", "off"), 23, "SHORE LINK LOST")          # ?? -> 97 -> 23, chip -74%
ring.recalc(w("l11", "food"), +4, "FOOD · 1 YEAR")
ring.recalc(w("l12", "litres"), -6, "WATER · 40 L")
ring.recalc(w("l13", "rains"), +5, "RAIN")
ring.recalc(w("l14", "heat"), -5, "COLD")
ring.compact(T["FACE"], T["Z1"])                             # the face close-up
html_, tl_ = mini_ring("oAm", t0, t1, 104, "#2f7cf6")        # an option card's own ?? ring
```

## Shot list (key, start, what, light state)
| key | t | shot | light |
|---|---|---|---|
| A1 | 0.00 | Day 1's hero framing; on "off" lamps die in 4 sections, floods one by one, helideck + windows dark, the flare shrinks out | EXT → off |
| B1 | 5.82 | console gauges fall to 0 | INT |
| B2 | 6.37 | the monitors along the console flicker and die (0.1 s slots, never one bright frame) | INT → dark |
| B3 | 6.92 | the emergency lights over the door flicker, then die | dark + red |
| BK | 8.21 | black beat 1: the dark rig, red eyes on the shore | aerial, off |
| C | 9.07 | Mira by the console, a handheld torch at chest height, its beam a cone + a pool on the console; face 3/4, worried; HUD DAY 4 · 11:59 PM | dark room + cold window light + fill |
| D | 11.94 | closer, from behind her: the torch sweeps from the console to the dark wall screen; tag REMOTE OPERATED | dark room + cold window light + torch (YAVG ≥ 60) |
| P1 | 16.50 | REPLAY 0:17: the wall screen whole; LINK → LINK LOST | Day 1 INT, desaturated + cool |
| P2 | 18.95 | REPLAY 0:35: Mira with the handset; the panel's 3rd line lit amber | Day 1 INT, desaturated |
| P3a | 23.39 | night: her torch finds the generator door | night, off |
| P3b | 25.39 | the sticker full frame, torchlit; red on "shuts"; the torch clicks off | night + free torch |
| P4 | 29.73 | REPLAY 1:24: Day 1's shot S, the coast going dark | Day 1 aerial, desaturated |
| W1 | 33.42 | the dark window from outside, her torch inside, the gull on the sill | night |
| W2 | 35.13 | the gull looks in, cries, flies off on "left" | night |
| R1 | 37.49 | dawn (DAY 5 · 6:40 AM): Mira with the torch in the storeroom; the card | dawn interior |
| R2 | 39.80 | RATIONS shelves, torch dolly (+4) | dawn interior + free torch |
| R3 | 42.89 | the dead watermaker | dawn interior + torch |
| R3b | 44.49 | the tank's sight glass, 40 L (−6) | dawn interior, darkening into the cut |
| R4 | 47.08 | rain into the tarp, into the barrels (+5) | dawn exterior |
| R5 | 50.38 | Mira in a blanket, her breath (−5) | dawn interior |
| R6 | 52.41 | the thermometer: 5 °C | dawn interior |
| F0 | 55.40 | Mira at the rail; the split | dawn exterior |
| FA1 | 57.95 | card A; the restart panel, her hands on the wheel | dawn |
| FA2 | 60.14 | the wheel turns; the what-if flame on "burns" (fading before the cut) | dawn + red |
| FA3 | 63.37 | what if: the flare relit over the rig's silhouette; five boats (hulls, lit cabins, masthead + side lights) turn toward it | night, cool grade |
| FB1 | 68.40 | card B; the lifeboat in its davit, FUEL · 24 H | dawn |
| FB2 | 70.67 | above the lifeboat; the map card | dawn |
| BK2 | 73.26 | black beat 2: the dark coast, red eyes, the lifeboat's light | aerial, off |
| CARDS | 76.57 | both cards; the rig at dawn, dimmed | dawn |
| FACE | 79.88 | Mira close, determined | dawn + fill |
| Z1 | 82.50 | end card 1 | dawn, dark |
| Z2 | 85.31 | end card 2 | near black |
