# Writing a new episode of "The Guardian & the girl"

Every episode is the same conversation shape on a new question: the girl asks, the Guardian answers with a short
countdown, she pushes once in the middle, the clock stops for the last item, and the answer turns the Guardian's own
world (time, the clock) into the lesson. Two voices only, 160–200 words, 70–90 s. The template turns the finished
`episode.json` into a film (SKILL.md §12).

## 1. The structure (with % of runtime)

| % | beat | role in `episode.json` | rules for writing it |
|---|---|---|---|
| 0–4 | **Hook: the question** | `question` (L) | 6–10 words, a question a viewer has asked themselves. It is on screen from frame 0, so it must work as a title. No setup line before it. |
| 4–10 | **Authority** | `intro` (G) | One line that only an ancient being in a clock could say ("I've watched ten thousand decades…"). Concrete number or image. |
| 10–13 | **The stakes** | `intro` (G) | One short, slightly sad line: what most people get wrong. 5–8 words. |
| 12–15 | **Open loop** | `openloop` (G) | Announce the count and tease the last item: "So… N rules. And the last one? Almost nobody follows it." Set `counter_at` to the count word and `cut_at` to the word where we cut to the girl. |
| 15–45 | **Countdown, first half** | `rule` × 4–5 | Each rule: the number alone ("Ten."), an imperative of 4–8 words, then a twist sentence of 5–10 words that makes it quotable. Vary the rhythm (one rule with no twist, one with a question). Each gets a card title (≤ 6 words, caps) and an abstract icon. |
| 45–50 | **Re-hook** | `rehook` (L) | The girl asks the question the viewer is thinking ("Is number one the secret?"). 3–6 words, whisper or impatient. |
| 50–55 | **Aside** | `aside` (G) | The Guardian deflects with warmth or humour in ≤ 6 words ("Patience. You'll want to hear it."). Set `wink_at` for the medallion's wink. |
| 55–75 | **Countdown, second half** | `rule` × 3–4 | Escalate: each rule a little more personal than the last. The second-to-last should make the girl react (`widen_at` a word for her eyes). |
| 75–76 | **Pattern break** | (automatic) | The clock stops dead, 1–1.5 s of silence, the dust freezes. Nothing to write: the last rule gets `break_before` automatically. |
| 76–88 | **Payoff: rule one** | `rule` n=1 | Three sentences: the rule ("Stop waiting for the right time."), the proof from his world ("I've watched every clock in the world."), the turn ("The right time has never arrived."). The cut to the hood push-in lands on the second sentence. |
| 88–94 | **The word** | `payoff` (G) | One line that lands on a single word that becomes the takeaway ("It only ever comes as… now."). Set `now_at` to that word: it forms in blue light. |
| 94–97 | **Echo** | `echo` (L) | The girl repeats the word as a question ("Now?"). One word. |
| 97–100 | **Loop ending** | `final` (G) | The Guardian repeats it as an answer ("Now."). The clock restarts, the light warms, the end card asks the comment question, and the last frame matches frame 0 (her face looking up). |

Count rules: 10 is the house format, but 5 or 7 work (the counter ring adapts to the first number). With 5 rules the
film runs ~50–60 s; add a third intro line or a twist sentence to most rules to reach 70 s.

## 2. Writing rules
- **Different from the obvious list.** Before writing, list the 15 answers everybody gives (sleep, save money, read
  books, exercise…) and do not use any of them, reworded or not. Aim for advice that is behavioural, specific, and
  has a reason built in.
- **Short sentences, spoken numbers.** Write numbers as words ("ten thousand", "Ten."). Avoid abbreviations and
  digits; Whisper must hear every word right (`pick_takes.py` rejects takes that fail).
- **The ellipsis is a pause.** Use "…" where the Guardian should breathe ("So… ten rules."). The pipeline caps pauses
  at 0.28 s, so ellipses read as beats, not silences.
- **Every rule gets a card.** `card.title` ≤ 6 words in caps on screen; `card.icon` from the icon library (§4).
  Icons are abstract: no people, no faces, no silhouettes.
- **The girl speaks three times**: the question, the re-hook, the echo. More lines dilute her; fewer lose the duet.
- **No financial, medical or legal claims.** Life advice only. Keep it kind; the Guardian never mocks.
- **Delivery notes** (the `delivery` field) go straight into the VoiceDesign instruct: describe tone and pace in a
  few words ("Slower and grave.", "Wry.", "A soft, impatient whisper.").

## 3. Shot grammar (automatic; override with `shot` per line)
- question → GIRL_Q (her face low, the question typed above her) · intro → CLOCK_MED, HOOD · openloop → WIDE then
  GIRL_MCU at `cut_at` · rules cycle HANDS, WIDE_LOW, CARD_HERO, CARD_GAP, OTS_GIRL, WIDE, HANDS, CLOCK_CARD, CARD_GAP ·
  rehook → GIRL_MCU (she leans in) · aside → HOOD · last rule → CLOCK_FROZEN then HOOD_PUSH · payoff → WIDE with the
  word in light · echo → GIRL_MCU · final → WIDE (restart, warm swell) · END (girl, end card).
- Keep 12–16 cuts a minute: one per line plus the two in-line cuts. Do not add cuts inside a rule.

## 4. Icon library (`assets/template/assets/lib/guardian-overlay.js`, `GOV.ICONS`)
steps · flames · moon_bubble · question_door · heartbeat_path · ring_mend · progress_ring · seed · mirror ·
clock_stop · hourglass · key · compass · heart · mountain · bulb. Each is `fn(ctx, cx, cy, size, u, t)` with
`u` = progress over the card's life (draw the "story" of the icon: steps lighting, a ring closing, a seed sprouting).
Add new ones in the same file: line art in cyan `#6fe8ff` with warm `#ffe2a8` highlights, glow via `shadowBlur`.

## 5. Three example outlines

### A. "What should I do when I feel left behind?" (7 rules, ~78 s)
- L: "Why does everyone else seem so far ahead?"
- G intro: "Every second that has ever passed went through this clock. None of them raced." / "Most people measure the wrong distance."
- Open loop: "So… seven truths. And the last one? It's about the clock itself."
- 7 "Compare yourself to who you were last spring." (card: COMPARE TO LAST SPRING · icon `mountain`)
- 6 "Other people's highlights are not your middle." (OTHERS' HIGHLIGHTS · `mirror`)
- 5 "Slow is fine. Stopped is the only problem." (SLOW IS FINE · `hourglass`)
- 4 "Finish one thing this week. Small counts." (FINISH ONE THING · `progress_ring`)
- Re-hook L: "What if I'm already too late?" · Aside G: "Late for what? Tell me."
- 3 "Ask for help before you need rescue." (ASK BEFORE RESCUE · `key`)
- 2 "Your pace is a choice. Not a verdict." (YOUR PACE IS YOURS · `compass`)
- 1 (frozen clock) "There is no race. I've timed every one of them. Nobody ever crossed a finish line."
- Payoff: "There's only ever… your next step." · Echo: "My next step?" · Final: "Your next step."
- End card: WHICH TRUTH DO YOU NEED TODAY? / COMMENT THE NUMBER

### B. "How do I make a real friend?" (5 rules, ~60 s; add twists to reach 70 s)
- L: "How do I make a real friend?"
- G intro: "I've seen a million friendships begin under this clock." / "Almost none began with the perfect words."
- Open loop: "So… five steps. And the last one? It feels like losing. It isn't."
- 5 "Remember one small thing they said. Say it back next week." (REMEMBER SMALL THINGS · `bulb`)
- 4 "Ask a second question. Most people stop at one." (ASK A SECOND QUESTION · `question_door`)
- Re-hook L: "Is the last one scary?" · Aside G: "A little. That's how you know."
- 3 "Show up twice when it's not convenient." (SHOW UP TWICE · `steps`)
- 2 "Let them help you. Owing each other is the glue." (LET THEM HELP · `flames`)
- 1 (frozen clock) "Go first. Say hello first, say sorry first, say 'I missed you' first. I've watched the ones who wait. They're still waiting."
- Payoff: "Friendship only ever starts… first." · Echo: "First?" · Final: "First."
- End card: WHICH STEP WILL YOU TRY? / COMMENT THE NUMBER

### C. "What do you wish you'd told your younger self?" (10 rules, ~85 s)
- L: "If you could talk to little you, what would you say?"
- G intro: "I was never little. But I've watched a billion childhoods pass this clock." / "They all forgot the same things."
- Open loop: "So… ten reminders. And the last one? You'll want to keep it secret. Don't."
- 10 "Curiosity is not a phase." (`question_door`) · 9 "Being bad at something is the first level of good." (`steps`) · 8 "Laugh at yourself before anyone else can." (`heart`) · 7 "Your weird is your map." (`compass`) · 6 "Rest is not quitting." (`moon_bubble`)
- Re-hook L: "Did you know all this when you were me?" · Aside G: "I'm still learning number two."
- 5 "Keep the friends who knew you before you were cool." (`flames`) · 4 "Write it down. Memory edits." (`bulb`) · 3 "Mistakes are receipts. Proof you tried." (`ring_mend`) · 2 "Say thank you out loud. Thoughts don't travel." (`heartbeat_path`)
- 1 (frozen clock) "You're allowed to start over. Any day. I've watched every morning there ever was. Every single one was a beginning."
- Payoff: "And the best one is always… today." · Echo: "Today?" · Final: "Today."
- End card: WHICH ONE DO YOU NEED TO HEAR? / COMMENT THE NUMBER

## 6. Checklist before voicing
- 160–200 words total; each Guardian rule line ≤ 18 words; the girl's lines ≤ 10 words.
- The question works as a title on its own.
- The open loop names the count and teases the last item; the re-hook is a question about it.
- Rule one has three sentences, and its last sentence turns the clock/time into the lesson.
- The payoff word appears in `now_at`, in the echo and in the final line.
- No rule repeats an item from the "obvious list".
