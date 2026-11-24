# Sources analysed — satire cartoon

Measured with `explainer-engine/engine/qa/analyze_video.py` (cuts = ffmpeg scene score; scene changes = colour-histogram
change 1 s apart; motion = mean grey change at 6 fps; anim = flat-shaded share) plus frame-by-frame strips (see
references/analysis.md). Public post metadata collected 2026-10-27. Analysed locally for reference only.

| reel | account | audio | likes | dur | cuts/min | median shot s | scene changes/min | median scene s | motion mean / p90 | hold | colourful | sat | bright | WPM | LUFS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [De6-7n8I4Q4](https://www.instagram.com/reel/De6-7n8I4Q4/) | potatocrimesofficial | original audio | 252,523 | 64.8 s | 18.51 | 2.71 | 21.29 | 2.33 | 13.15 / 33.0 | 0.013 | 68.5 | 0.359 | 0.755 | 228.6 | −14.1 |

**What it is about.** A fast satirical cartoon (vertical 720×1280, 24 fps) claiming that two named heads of government
time a large bombing around their respective elections: one needs a war to pause a corruption trial and lift his polls
before his country votes; the other wants it only after his midterms because fuel prices would spike as people vote.
It ends on a callback punchline about fuel prices over a pump meter that explodes. Told by a dry, very fast male
narrator over no music, with hard cuts every ~2.7 s, toy-like cel-shaded bobble-head figures, props that literalise each clause and small yellow captions.

**Use in this skill.** Only the formula (structure, pacing, look, prop grammar, caption system) is reused. The reel
depicts and attributes claims to real, living politicians; samples made with this skill must use fictional people and
places (see SKILL.md §3 and the sample's FACTS.md).

Other measured facts: shot length p10/p90 1.54/4.75 s · first cut 2.0 s (a flash frame) · 6 cuts in the first 15 s ·
4 of 20 detected cuts are 1-frame white flashes · `animated_frac` 0.677 (gradients + grain fool the flat detector) ·
silence 0.7 s · palette `#f2f0e4` `#3b405f` `#e5cda8` `#90613c` `#cf8a52` `#5094e2` `#9dceee` `#82918f`.
