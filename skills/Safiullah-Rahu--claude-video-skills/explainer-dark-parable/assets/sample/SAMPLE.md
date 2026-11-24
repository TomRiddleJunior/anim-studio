# SAMPLE — "The Rope" (parable-elephant)

The first film built with the `explainer-dark-parable` skill (batch 8, build agent A, 2026-11-06).
- **Source format:** @unkindtruth_ `DfHxCPwTzrp`, "Trauma Bonding, Explained in 88 Seconds" (88.4 s).
- **Ours:** learned helplessness, told through the public-domain parable of the elephant tied to a small stake (90.1 s).

## Deliverables
- **`out/parable-elephant.mp4`:** 1080×1920, 30 fps, x264 CRF 19, AAC. The full mix: voice, an original dark-ambient bed and SFX.
- **`out/parable-elephant_nomusic.mp4`:** the same video stream (stream-copied, not re-rendered) with voice + SFX only.
- **`out/parable-elephant.srt`:** every spoken word in phrases. **`out/cover.jpg`:** the cover.
- **`out/qa/`:** the 2 fps sweeps (5 sheets, all 180 tiles looked at), metrics, gates, yavg, compare.jpg and the Whisper check.

## Build
1. **Voice:** `vo/script.json` (28 lines, 215 words) → Kokoro `am_onyx,am_michael`, speed 1.05 (0.97 on the last line) → `vo/audio/vo.wav`, `vo/data/vo.json`.
2. **Build:** `tools/build.py` writes the word-time data, 215 one-word caption clips, the world host, the index and the SRT.
3. **Film:** `assets/lib/kit.js` (Canvas2D shot player + line-art kit) + `assets/lib/film.js` (27 shots, each anchored on a word).
4. **Sound:** `tools/sound_design.py` + `tools/audio_kit.py` write both mixes (−14 LUFS, TP −2).
5. **Render:** HyperFrames 0.8.210 (`render_locked.sh`, delivery, 2 workers), about 90–180 s per render on the iGPU.
6. **Deliver:** `tools/deliver.sh` → `tools/qa_all.sh` (analyzer, Whisper small, `tools/qa.py`).

## Gates (final render, `out/qa/gates.json`)
| gate | target | result | |
|---|---|---|---|
| length | 88.4 s ±15 % | 90.13 s (+2.0 %) | pass |
| WPM | 153.4 ±20 % | 143.1 (−6.7 %) | pass |
| cuts / min (analyzer) | source 0.0 | 1.33 | explained ↓ |
| scene changes / min | 3.39 ±20 % | 1.33 (−61 %) | **explained miss** ↓ |
| first frame a still; first word ≤ 0.4 s | — | frame 1 = hand + stake + elephant; first word 0.18 s | pass |
| loudness full / no-music | −14 ±1 LUFS, TP ≤ −1 | −14.4 / −1.8 dBTP; −14.5 / −1.6 dBTP | pass |
| voice over bed | ≥ 10 dB | 22.0 dB (bed alone); 12.0 dB over bed + SFX | pass |
| Whisper hears every line | all lines ≥ 0.85 recall | all 28 lines, mean 0.991 | pass |
| captions in the safe area, none over a face | y 885 (46 %) | checked on all 180 sweep tiles | pass |
| unplanned black / flash frames | 0 | 0 YAVG flags | pass |
| stream lengths match | no `-shortest` | video 90.134 s / audio 90.115 s (both files) | pass |

**Whisper notes:**
- Kokoro says "traveller" and Whisper writes "traveler".
- "Steven Maier" comes back as "Stephen Mayer" (homophones).
- "1967" is heard correctly. Every line is heard.

**Cuts.** The analyzer finds 2 hard cuts, where the source has 0. The source has about 28 real shot changes and ours has 27. Neither registers, because on a near-black frame ffmpeg's scene score stays below 0.33. The 2 detections are the cuts into the two biggest colour fields: the giant legs at 26.6 s and, from the shot lengths, the giant maroon trainer at ≈ 37.2 s.

**Scene changes, an explained miss.** The analyzer counts a scene change when the colour histogram of frames 1 s apart moves by ≥ 0.28.
- On a frame that is 80 % black, that only happens when a very large colour field arrives or leaves.
- The source fires 5 times, each when the giant maroon robe or the king close-up fills most of the frame.
- Ours fires twice, on the same two scale cuts.
- **Render 2 tried to close the gap.** It added a giant maroon trainer (S12), a larger drain-to-black two-shot (S14) and a navy boss twice (S19b, S21), and made the victim's fill warmer. Colourfulness rose 6.2 → 9.7 and motion 1.07 → 1.41, but the scene count did not move. Our big fields cover 35–45 % of the frame; the source's robe covers 70–90 %.
- **To hit the metric next time:** make two or three shots where the antagonist's robe or coat fills ≥ 70 % of the frame for over 1 s (a true "giant robe" shot, as at the source's 27 s and 55 s). Also make the concept shot a robe close-up that drains to black.
- A third render needs approval, so this film ships with the miss documented.

**Other measured differences.**
- Motion 1.41 against 3.44 (the source's plucking hands, falling feathers and walking king move more than our pushes).
- Brightness 0.094 against 0.105; colourfulness 9.7 against 15.1 (less maroon on screen).

## Renders
1. **Render 1** (180 s): every gate passed except scene changes (1.33/min) and low motion (1.07).
2. **Render 2, final** (90 s). Changes from render 1:
   - push rates ×2.4 on every shot and a faster crowd pan;
   - dust puffs on every tug and 40 dust motes;
   - S12 reframed with a giant maroon trainer, S14 enlarged, a navy boss in S19b and S21;
   - a warmer victim fill (`#a9857d`);
   - S03 re-centred so the raised trunk stays in frame;
   - the falling tree kept in frame;
   - a new final callback shot (S26: the loose stake and the gold rope trailing after the elephant walking away).

## What reads well
- **The opening still** works on its own: a maroon sleeve, a stake and a baby elephant on black.
- **The gold rope** is the single accent. It carries the idea from the parable to the dog's leg, the kid's wrist and the worker's ankle, and becomes the lamp of control.
- **The scale cuts land:** the giant elephant pushing the tree, then the tilt down two giant legs to a tiny stake.
- **The source tags** (SELIGMAN & MAIER, 1967 → the year rolling to 2016) make the psychology checkable on screen. This is a visible upgrade over the source.
- **The 2016 twist** gives a sharper ending than a plain moral, and it is accurate. The callback image answers the first frame.

## What is weaker
- **Scene changes and motion are below the source** (see above). The film is calmer than the source.
- **The art is simpler than the source's.** Our trainer and crowds are plainer than the king, robe details and ministers. The elephant is a stylised kit figure, not a drawn character.
- **The modern section (S19–S23) is pure line art on black.** It reads as quieter than the parable, and the boss shots are the only colour there.
- **The experiment beat shows dogs and shocks abstractly** (zigzags, a lying line-art dog). It is tasteful, but less emotional than the parable.

## Deviations from the source
- **The concept is named at 49 % of the runtime**, against 66 % in the source, to make room for the evidence beat. The source has no study citation.
- **Sound:** the source is voice only; ours adds a quiet bed (22 dB under) and SFX. The `_nomusic` mix drops the bed for a library track.
- **Captions:** one word at a time as in the source; the font is Inter 700 44 px (the source looks like Helvetica/Inter bold, ~29 px on 720).

## Facts and sources (all claims in the narration)
- **"In 1967, Martin Seligman and Steven Maier gave dogs shocks they could not stop. Later, one jump over a barrier would have ended them. Most of the dogs didn't even try."**
  - Source: Seligman, M. E. P., & Maier, S. F. (1967). Failure to escape traumatic shock. *J Exp Psychol, 74*(1), 1–9. https://doi.org/10.1037/h0024514 (via PubMed, PMID 6032570).
  - The procedure: dogs given inescapable shock in a harness, then a shuttle box 24 h later where jumping the barrier ended the shock. Most of the inescapable-shock group failed to escape (secondary accounts report a mean of about 7 failures in 10 trials for the yoked group, and describe dogs that stop moving, lie down and whine). See https://en.wikipedia.org/wiki/Learned_helplessness and https://ppc.sas.upenn.edu/sites/default/files/lhtheoryevidence.pdf.
  - Secondary sources disagree on the barrier's height, so the film says only "a barrier".
- **"Pain had taught them one rule: nothing I do matters."** This is the original 1967 interpretation, that outcomes were independent of their responses. It is quoted in Maier & Seligman (2016) as what the original theory claimed.
- **"Half a century later, the same scientists found the twist. Giving up is the brain's default. Control is what we learn."**
  - Source: Maier, S. F., & Seligman, M. E. P. (2016). Learned helplessness at fifty: Insights from neuroscience. *Psychol Rev, 123*(4), 349–367. https://doi.org/10.1037/rev0000033 (PMID 27337390). The abstract says passivity "is the default, unlearned response to prolonged aversive events", that it "can be overcome by learning control", and that "the original theory got it backward".
  - The on-screen tag reads "LEARNED HELPLESSNESS AT FIFTY, 2016".
- **"She grew to three tons"**: adult female Asian elephants weigh about 2–3.5 t (many 2.7–3 t), so the figure is in range. **"Strong enough to push over a tree"**: elephants routinely push trees over while feeding.
- **The elephant-and-rope story** is a traditional parable in the public domain, retold here in our own words. **The classroom and worker examples** are illustrations, not study claims.
