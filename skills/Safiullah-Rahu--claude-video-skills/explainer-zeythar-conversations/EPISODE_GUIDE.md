# Writing a new episode of "Conversations Beyond Time"

The writing authority is `WRITING_BIBLE.md` (the user's own series bible, copied verbatim). This guide turns it into
an `episode.json` the template can build, gives beat maps for the three lengths, the orb-morph library, the shot
grammar, and six new outlines. Built and measured on episode 1, "The 2:30 AM Committee"
(`assets/sample/`).

## 1. From the bible to `episode.json`
The bible asks for ten things per episode. They map like this:

| bible item | where it goes |
|---|---|
| 1 episode title | `"title"` |
| 2 main topic + category | `"category"`, the top chip for the first seconds, e.g. `"SLEEP · OVERTHINKING"` (two words, caps, a middle dot) |
| 3 angle | not a field: it shapes the line order (comedy → honest → comedy is the house rhythm) |
| 4 opening hook | line 1, always the girl, always naming him ("Zeythar, …"), on `GIRL_OPEN` so frame 0 shows her, the chip and the clock |
| 5 dialogue | `"lines"`: one object per line, `who` + `line` |
| 6 expressions and gestures | `"acting"` (the speaker) and `"react"` (the listener) tags, below |
| 7 scene and camera | `"picture"` (a shot preset), optional `"cuts"`, `"beat_before"`, `"pause_before"`, `"tint"` |
| 8 closing line | the last line (often his, often deadpan); `"final_tick_at"` if it lands on the clock |
| 9 caption · 10 hashtags | `POST.md` (not built into the film) |

One line object:
```json
{"who": "Z",                                  // "L" the girl, "Z" Zeythar
 "line": "You have said that four times.",    // exactly as captioned (digits allowed: 2:30, 2019)
 "say": "...",                                // optional: what the TTS reads (spell out times: "two forty-seven")
 "delivery": "Dry deadpan, flat monotone, no sing-song.",   // appended to the character's VoiceDesign description
 "acting": ["still"],                         // tag or tag@word (the word as written in "line")
 "react": ["smile@times."],                   // optional: the listener's acting (shows in wides)
 "picture": "HOOD_ORB",                       // shot preset; omit for the default grammar
 "orb": {"morph": "tally", "at": "four", "count": 4},       // optional orb morph
 "pluck": "times."}                           // optional light pluck on a punchline (<= 3 per episode)
```
Episode-level: `"title"`, `"series"`, `"category"`, `"clock": {"from": "2:30", "to": "2:47"}` (the big clock's code
hands, first shot → last line; default 11:52 → 11:54), `"end_card": {"rows": [two caps rows], "sub": "COMMENT BELOW"}`,
`"cover_hook": [big row, small row]`, `"accent_words"` (caption keywords; the word as written, lower case, with its
punctuation: `"records."`), optional `"end_hold"` (s of end card, default 3.8).

Timing fields: `"gap"` (s of silence before the line; default 0.26 on a speaker change, 0.34 same speaker),
`"beat_before": {"dur": 0.8, "shot": "WIDE_QUIET"}` (a silent beat with its own quiet shot; the music drops to one
pad), `"pause_before": 0.75` (his pause, held inside his shot), `"max_pause"` (cap on the line's internal pauses,
default 0.32 s; raise it for a written beat inside a line, e.g. 0.6 before "Your species declined.").
Flags: `"tag": true` (his name tag forms on this line; default his first line), `"turn": true` (the honest line: the
warm light softens, the bed thins), `"tint": "dawn"` (a warm dawn light grows on her side), `"final_tick_at": "2:47."`
(the clock's last minute step lands on that word with a dry tick), `"alt_say"`/`"alt_delivery"` (a fallback read,
voiced as seeds 11 and 12: use it for a laugh, e.g. `"say": "(laughs) ...Rude."`, `"alt_say": "Rude."`).

### Acting tags
| her (`acting` on her lines, `react` on his) | what it does |
|---|---|
| `blink_slow` | a slow tired blink (0.7 s) |
| `head_tilt` | tilts her head toward him for the line (pivot at the chin on her hand) |
| `brows_up` · `brows_together` · `brow_one` | brow raise · knit · one brow up (the near one) |
| `eyes_up` · `eyes_down` · `eyes_orb` · `eyes_to_him` | iris moves up (eye roll) · down and away · to the orb · back to him (default) |
| `eyes_widen` | the eyes open a touch wider + brows (realisation) |
| `half_smile` · `smile` · `smile_wide` | mouth corners up 0.45 / 0.8 / 1.0, cheek lift |
| `laugh` | three shoulder bobs, a squint, a wide smile (use with a laugh read) |
| `head_drop` · `chin_lift` · `nod` | head down a little (whiny) · chin lifts off her hand (challenge) · a small nod |

| him | what it does |
|---|---|
| `orb_bright` · `orb_dim` · `orb_pulse` | the orb brightens for the line · dims to a soft glow · one pulse on the word |
| `hood_tilt` · `hood_nod` | a small hood tilt · a nod (both small: big moves stretch the robe) |
| `hand_turn` · `hand_lift` | the open hand turns slightly · lifts a little |
| `still` | idle motion damped for the line (deadpan) |

Every line of his also gets a tiny hood tilt on its first word, and the orb's brightness and ring speed follow his
voice; her mouth follows her voice (jaw + dark interior), her blinks come every 2.4–4.6 s plus one into each of her
shots. You never write those.

## 2. Writing rules (from the bible, plus what the build taught)
- She opens, names him in the first line, and states the situation in one breath (≤ 12 words, ≤ 3 s).
- He rarely gives the expected answer: dry records, a funny name for the problem, a practical answer she mocks, an
  insight she did not expect, a question that leaves her speechless. Keep his lines ≤ 16 words.
- She challenges him at least once and owns the honest moment; she is never only the straight man.
- At least one silence: a `beat_before` before the honest line or a `pause_before` on his answer.
- The last word can be a joke. Do not force a moral.
- Deadpan lines need "deadpan" and "flat monotone, no sing-song" in the delivery: the picker then takes the flattest
  read (smallest pitch range) among the takes close to the anchor voice.
- Numbers and times: caption with digits (`2:30`), make the TTS read words (`"say": "two thirty"`).
- No third person or figure anywhere, not even in an orb morph; no medical, legal or financial claims in the dialogue
  (put any grounding in `POST.md`).

## 3. Beat maps (% of runtime)
**Short (30–60 s; 6–10 lines, 40–110 words).** The bible's sample conversations are this size (38–51 words ≈ 25–35 s
with the end card).
| % | beat |
|---|---|
| 0–10 | her hook (GIRL_OPEN) |
| 10–25 | his dry reply (HOOD_ORB_TAG: the tag forms) |
| 25–45 | her push-back (GIRL_CU) |
| 45–60 | his twist, an orb morph (ORB_INSERT) |
| 60–75 | her one-word reaction (GIRL_CU2) |
| 75–92 | his closing line (WIDE or HOOD_ORB) |
| 92–100 | end card over the last shot |

**Standard (60–90 s; 16–24 lines, 150–200 words).** Episode 1's map:
| % | beat | ep. 1 |
|---|---|---|
| 0–6 | hook | "Zeythar. It's 2:30 AM. I said I'd sleep at ten." (GIRL_OPEN → GIRL_CU) |
| 6–12 | his dry records + the tag | "I keep records." (HOOD_ORB_TAG, log morph) |
| 12–30 | the comic premise, named | "The committee is in session." (ORB_INSERT bubbles, WIDE stamps) |
| 30–45 | his first real point; she challenges | "…you never give it an appointment." / "Okay, wise one." |
| 45–60 | the practical answer she mocks; his punchline; her laugh | "Your species declined." / "…Rude." |
| 60–63 | the quiet beat | WIDE_QUIET, one pad, the clock ticks |
| 63–72 | **the turn**: her honest line, his insight | "Night is the only time nobody needs anything from me." / "You are taking back your day." |
| 72–85 | the warm resolution; the callback joke | "…while the sun is up." (dawn tint) / "You have said that four times." |
| 85–95 | the last word | "Goodnight, Zeythar." / "It is 2:47." (CLOCK_CU, final tick) |
| 95–100 | end card | the comment question |

**Extended (2–4 min; 35–70 lines).** Two or three standard arcs chained, each with its own quiet beat; a WIDE every
45–60 s to reset the eye; change the clock's `from/to` so the time-lapse spans the whole night (e.g. 1:10 → 2:05);
let her tell a short story in 2–3 consecutive lines (GIRL_CU → GIRL_MCU2 → GIRL_CU2) and give him one longer answer
split over two shots (HOOD_MCU → ORB_INSERT). Keep every line ≤ 20 words; the template handles any length.

## 4. The orb-morph library (`assets/template/assets/lib/zeythar-holo.js`, `ZHOLO.MORPH`)
Each morph grows out of the orb in ~0.4 s at its word, holds to the next cut (max 1.2 s after the line), and folds
back into the orb. All abstract: never a figure.
| morph | picture | fields |
|---|---|---|
| `log` | a small ledger panel, rows typed in, the last row amber | `rows: ["MON 2:41", …]` |
| `bubbles` | the rings break into a ring of seven speech bubbles | — |
| `bubbles_reviewed` | (in a WIDE) the bubbles orbit in the gap between them; each gets a small REVIEWED stamp, then one big stamp | `stamp_at`, `count` |
| `notepad` | a notepad with a pen writing lines and a timer that runs from "pen" | `timer: "10:00"` |
| `sun_moon` | a soft arc: a crescent moon on the left, a sun climbing on the right | — |
| `tally` | tally marks, one per beat, the last amber | `count` |
| `heart` · `phone` · `hourglass` · `coin` · `question` · `bulb` · `graph_up` · `graph_down` · `document` | generic icons for future topics (love, social media, time, money, confusion, ideas, progress, loss, terms and conditions) | — |
New morphs: add a function to `MORPH` (draw around `sx, sy` with `s` = screen px per world px, alpha `k`), and a
world-space box to `tools/layout_check.py`'s `MORPH_BOX` so captions keep clear of it.

## 5. Shot grammar (presets in `tools/timeline.py`, `P`)
A hard cut on every speaker change (her shots start 0.16 s before her first sound, his 0.10 s), plus any `cuts`.
| preset | framing | use |
|---|---|---|
| `GIRL_OPEN` | sky layout, z 1.40: the girl on the right, the clock and its hands on the left | line 1 (frame 0) |
| `GIRL_MCU` / `GIRL_MCU2` | z 1.9: face, hand under the chin, watch | her longer lines |
| `GIRL_CU` / `GIRL_CU2` | z 2.2–2.3: face (lip-sync close-ups) | her short lines, reactions |
| `GIRL_CU_PUSH` | z 2.04 → 2.30, slow | her honest line (the turn) |
| `HOOD_ORB_TAG` | sky layout, z 1.30: name tag + hood + orb | his first line |
| `HOOD_MCU` | z 1.9: hood, medallion, hand and orb | his points |
| `HOOD_ORB` | z 1.9, a little right: the orb bigger in frame | a morph on his line |
| `HOOD_CU_PUSH` | z 2.0 → 2.3 on the hood, slow | his driest punchline |
| `ORB_INSERT` | z 2.3 on the orb | a morph that needs reading |
| `WIDE` | sky layout, z 0.82: both, the clock rings above, a dark ledge below | two-shot lines, listening reactions |
| `WIDE_QUIET` | sky layout, z 0.83–0.85, near-still | a `beat_before` |
| `CLOCK_CU` | sky layout, z 2.0 on the clock centre | the last line when it is about time |
Every single stays ≤ 2.3× over the 1402 px key art. Default grammar when `picture` is omitted: her first line
GIRL_OPEN, his first HOOD_ORB_TAG, then she alternates GIRL_MCU/GIRL_CU and he HOOD_MCU/HOOD_ORB/WIDE.

## 6. Six new outlines (different bible categories)
**A · "Read Receipts" (A, love; short ~40 s).** L: "Zeythar, he left me on read. With the little 'Seen' and
everything." Z: "Then he has seen it." L: "That's not the point!" Z: "It is precisely the point." (orb `phone`,
the "Seen" stamp) L: "So what do I do?" Z: "Reply to someone who answers." End card: "HOW LONG IS TOO LONG TO
REPLY?"

**B · "Group Project" (B, study; short ~45 s).** L: "Zeythar, I'm in a group of five. I'm doing all of it." Z: "Then
you are not in a group. You have an audience." L: "Very funny." Z: "Civilizations fell for less." (orb `graph_down`) L: "Okay, but what do I do?" Z: "Write
down who does what. In the group chat. With dates." (orb `notepad`, timer off) L: "…That's terrifying." Z: "For them."

**C · "The 47 Tabs" (H, sarcastic observation; standard ~65 s).** She has 47 unfinished tasks and just started a
48th (learning Italian). He keeps a running `tally`; the turn: "Finishing one thing feels worse than starting ten" —
he names it ("Starting is a promise. Finishing is a verdict."); callback: she closes one tab, the tally drops to 46,
he says "Progress. Slow, but measurable." Clock 11:40 → 11:55.

**D · "Busy When You Need Them" (D, friendship; standard ~70 s).** Hook from the bible: "Zeythar, why does everyone
suddenly become busy when you need them?" He asks who she is busy for; she lists four people (`tally`); the turn: she
admits nobody asks how she is; his insight: "You are everyone's listener. Let one of them listen back. Ask." Last
word is hers, a small smile: "…You're kind of annoying when you're right." Z: "I am usually annoying."

**E · "The Highlight Reel" (G, modern life; standard ~75 s).** She scrolls at 1 AM (`phone`); "Everyone's in Bali."
He: "Everyone in Bali is also scrolling." The turn uses `sun_moon`: her ordinary day had good moments she did not
post. Ending: she puts the phone face down; he: "The screen will survive the night." Clock 1:05 → 1:18.

**F · "Family Dinner Forecast" (E, family; extended ~2.5 min).** Tomorrow's family dinner: the cousin who is a
doctor, the marriage question, the salary question. Three rounds, each a prediction he makes (`log` with "Q1 MARRIAGE
· Q2 SALARY · Q3 COUSIN") and a rehearsed answer she tries; a quiet beat before she admits she wants them to be proud;
his insight about pressure and love being delivered in the same sentence; a WIDE per round; the last joke: he
predicts the dessert. Handle with care: affectionate, never mocking her family.

## 7. Checklist before voicing
- `python -I tools/episode.py episode.json voices.json` prints the word count: short 40–110, standard 150–200.
- Line 1 is hers, on GIRL_OPEN; his first line frames the tag (HOOD_ORB_TAG); the last line is short.
- Every `acting@word` / `orb.at` / `pluck` word exists in that line as written (the timeline stops on a missing word).
- Deadpan lines say "deadpan" and "flat monotone"; times and years have a `say`.
- At most three plucks; no third figure in any morph; nothing posted anywhere.
