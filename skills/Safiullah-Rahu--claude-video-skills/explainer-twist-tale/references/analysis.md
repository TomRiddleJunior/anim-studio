# Ricks Clips (@RicksClips3000) — teardown of a 92M-view Shorts channel (29 Oct 2026)

**Channel:** "Ricks Clips" · 115k subscribers · a one-narrator voiceover channel · Shorts
only (no long videos, no streams) · 12 Shorts uploaded 17–28 Oct 2026 · **92.4M views in 12 days** · 11 of 12 over 1M ·
median 6.3M · likes 1.8–4.4 % of views. All 12 analysed (720×1280, 30 fps) and
measured with `tools/analyze_video.py` (timeline, shot, filmstrip and hook sheets).

## Every video
| views | title | s | likes/views | comments | wpm | scenes/min (median s) | "You see" at | kind | hook (paraphrased) |
|---|---|---|---|---|---|---|---|---|---|
| 28.5M | The Ancient Jar That Warned an Empire | 65 | 2.9% | 1,300 | 218 | 25.0 (1.8) | 7.2s (11%) | real history (Zhang Heng seismoscope, 132 AD) dramatized | a seismoscope jar that warns the emperor |
| 14.6M | The Job Nobody Wants in Japan | 61 | 3.9% | 10,000 | 223 | 26.8 (2.0) | 49.2s (81%) | real workplace practice (Japan "banishment rooms") | a rule (nobody gets fired) and something worse in its place |
| 9.1M | What the Grave Bell Really Meant | 60 | 2.3% | 407 | 222 | 19.1 (2.6) | 3.2s (5%), 53.7s (90%) | real object (safety-coffin bell) + fictional twist | a burial with a bell on the finger |
| 8.0M | Levels of Pirate Cannonballs | 64 | 2.4% | 405 | 208 | 21.7 (2.2) | — | real history, "levels of" escalation list | second person: a cannonball hit is the lucky case |
| 7.6M | An Unstoppable Spear vs an Unbreakable Shield | 45 | 1.8% | 391 | 218 | 17.3 (2.6) | 33.0s (73%) | classic paradox fable (Han Feizi spear/shield) | a smith sells the perfect spear and the perfect shield to rival kings |
| 6.9M | The Burglar Who Only Moved Furniture | 58 | 2.6% | 350 | 243 | 20.5 (2.2) | 51.0s (87%) | fiction heist with a twist | a nightly intruder who shifts everything slightly |
| 5.7M | Why Cashiers Keep Winning The Lottery | 58 | 3.2% | 395 | 208 | 19.7 (2.1) | 43.7s (76%) | real (lottery stings on retailers), dramatized | a cashier and a customer's ticket |
| 4.0M | He Could Spot Winning Tickets Just by Looking | 63 | 3.2% | 460 | 219 | 17.1 (2.8) | — | real (cracked scratch-card game), dramatized | a challenge to the viewer: two scratch cards |
| 3.9M | Why the Second Draw Always Wins | 56 | 3.5% | 283 | 235 | 17.1 (2.8) | 36.4s (65%) | real psychology (reaction beats decision) as a western | a gunslinger's rule about who draws first |
| 1.5M | The Town Built Around a Button | 66 | 3.0% | 142 | 224 | 19.2 (2.9) | — | pure fiction mystery | a town button nobody may press |
| 1.5M | This Knight Found the Ultimate Loophole | 41 | 2.6% | 165 | 233 | 23.6 (2.0) | 3.5s (9%) | historical loophole fable (indulgences) | forgiveness bought before the crime |
| 0.3M | Every Memory Has a Price | 78 | 4.4% | 93 | 227 | 19.3 (2.6) | 3.4s (4%) | pure fiction (memory economy) | a memory sold over a counter |

## The mechanism (what every video does)
1. **Hook = one concrete, impossible-sounding act in one sentence (13–22 words, 3–5 s).** A person does a strange thing
   to a powerful/ordinary target and the stakes are named: a warning device handed to an emperor · a burial with a bell
   · forgiveness bought before the crime. Variants: a rule (in place X, Y is impossible, but…), second person (you are
   put in the situation), a challenge to the viewer (look at two objects and pick one).
2. **"You see," = the pivot word.** Either early (5–11 % of runtime) to give the one line of context the hook needs, or
   late (65–90 %) to open the reveal. Several videos use both.
3. **Escalation with doubters.** Authorities laugh it off (a court, a police officer, a gate guard); repetition beats
   (one event, then a second, then all of them at once).
4. **Twist + mechanism.** The last 15–35 % explains how it really works (a pendulum inside the jar; Japanese labour law;
   lottery stings; reaction vs decision) and the final line re-reads the hook. No call to action, no outro — the video
   ends on the punchline, which helps replays.
5. **Title = curiosity gap about an object or practice:** "The Ancient Jar That Warned an Empire", "The Job Nobody Wants
   in Japan", "Why Cashiers Keep Winning The Lottery", "Levels of Pirate Cannonballs", "An Unstoppable Spear vs an
   Unbreakable Shield".

**What wins:** the top five (7.6–28.5M) are real history or real systems dramatized; the two pure-fiction fables are the
weakest (1.5M and 0.3M). The Japan video (relatable workplace + a culture people argue about) drew 10,000 comments.
Real mechanism + a doubter + a twist that teaches something is the format; fiction alone underperforms.

## Delivery and edit (measured)
- **Length** 41–78 s (median 60). **Voice** one casual male narrator, 208–243 wpm overall, almost no pauses (speech gaps
  are 8–14 % of runtime), a few character voices in dialogue. **Loudness** −14 LUFS; a music/SFX bed sits ~6–9 dB under
  the voice (gaps measure −22 to −25 dB against −16.5 dB speech).
- **Edit** 17–27 scene changes per minute (median shot 1.8–2.9 s), mostly hard cuts with occasional 1–2-frame
  dissolves; the camera never stops (push-ins, orbits, POV, prop close-ups: a clock, a phone, a red button).
- **Picture** cel-shaded, saturated 3D sets with warm light (colourfulness 58–87, brightness 0.52–0.72, motion
  13.5–21) and flat 2D doodle characters — round white heads with heavy outlines, dot or arc eyes, stick limbs, capsule
  bodies in patterned clothes — that change expression shot to shot.
- **Captions** 1–2 words at a time, white heavy rounded sans with a dark outline and soft shadow, centred at ~70 % of
  the frame height.

## Our replication, with a different taste (`explainer-twist-tale`)
- Same script mechanism and pacing; facts verified and logged in `FACTS.md`; a timely hook.
- Code-rendered instead of generated: toon-shaded three.js sets with an ink-outline pass (normal + depth edges), our own
  doodle cast (cream bean heads, oval eyes with highlights, blush, heavy ink), passport/calendar/clock props, captions
  in Fredoka with keyword highlights in yellow, a Kokoro narrator at ~216 wpm, a synthesized marimba bed + SFX.
- Sample: "The Man Who Moved Every Clock" (William Willett and daylight saving, released for the 1 Nov 2026 US clock
  change) — project in `assets/sample/` (the rendered film is not included).
