# SAMPLE — lofi-otter ("There is a calm in …")

Skill: `~/.claude/skills/explainer-lofi-mascot-lines` · source `DfTu_Jcs-NV` (@sadgoose42, 22.4 s, 811k likes).
Built 2026-11-06 by batch-8 agent C.

## Build
- `vo/script.json` (6 lines, `at` = cut + 0.15–0.2 s) → `tts.py` (Kokoro `am_michael`) → `tools/build.py` (captions,
  world, index, SRT) → `assets/lib/film.js` (six scenes, `assets/lib/lofi-kit.js`) → `tools/score.py` (two mixes) →
  render (HyperFrames 0.8.210, `delivery`, 2 workers) → `tools/deliver.sh` (FILM_DUR=22.3; CRF 19 + no-music remux) →
  `tools/qa_all.sh` → `tools/cover.py`.
- Renders: 2 of 2 (HyperFrames `delivery`, 2 workers, ~65 s each).
  - Render 1: every gate passed (scene changes 10.76/min against 10.72); the crowd read as brown haze (walkers too
    blurred and too dark) and the sleeping otter's belly read as a pale disc.
  - Render 2 (delivered): the passers-by are drawn as people (hair, a face tone, a scarf, coat, legs, umbrellas or bags)
    with a 4–9 px blur and lighter coats, so the crowd reads; the belly is a crescent along the top of the body. The
    analyzer now counts one scene change fewer (explained below).
- Snapshots before render 1: all six scenes, three rounds (the mascot scale, the texture strength, the bed's window
  shadow and the crowd's contrast were fixed there).

## Gates (out/qa/gates.json)
| gate | source | ours | pass |
|---|---|---|---|
| length ±15 % | 22.4 s | 22.3 s (−0.4 %) | yes |
| cuts / min | 5 hard cuts (analyzer 0) | 5 hard cuts on bar lines (analyzer 2 → 5.38) | yes (same cut count) |
| scene changes / min ±20 % | 10.72 | 8.07 (−25 %; render 1: 10.76) | **no — explained below** |
| WPM ±20 % | 118 | 126.5 (+7 %) | yes |
| first word ≤ 0.4 s, first frame a still | 0.0 s | 0.24 s (caption from 0.12 s), the café still | yes |
| −14 LUFS ±1, TP ≤ −1 dBTP | −14.1 | full −13.8 / −2.9 dBTP · no-music −13.8 / −3.3 dBTP | yes |
| voice ≥ 10 dB over the bed | ~6 dB | 11.7 dB over music + rain + foley (no-music 16.9; music alone 13.3) | yes |
| Whisper hears every line | 6/6 | 6/6, recall 1.00 on every line | yes |
| captions in the safe area, none over a face | — | y 600 (31 %), a 440 px column; never over the otter (checked on every sweep tile) | yes |
| no unplanned black / flash frames | — | 0 flags | yes |
| stream lengths match, no `-shortest` | — | 22.300 / 22.300 (both files) | yes |
| look (brightness · colourfulness · motion) | 0.286 · 25.7 · 2.71 | 0.340 · 32.7 · 4.23 | brightness and colour within ±30 %; motion higher (the crowd) |

## Source → ours
| source | ours |
|---|---|
| A goose mascot (white, orange beak), eyes closed | A small river otter (brown, cream muzzle, side ears, whiskers), eyes closed or half closed |
| Café window in the rain, a cup with steam | Café window in the rain, the otter in a teal scarf with two cups (one empty: "the second cup"), a passer-by outside |
| Floating in a puddle with headphones and a player, people's shoes at the top | Floating on its back (what otters do) with mustard headphones and a player; ripples, rings, a paper boat |
| In bed from above, phone glowing | In bed from above, the phone face down with its light leaking at the edges ("switching off"); rain shadows in the window light |
| Standing still in a hoodie while blurred people pass | Standing still in a yellow raincoat while blurred people with umbrellas pass both ways |
| Sprawled on a bed, warm lamp, rainy city window | Same set-up, our room: pothos, prints, a steaming mug, books |
| Window seat wrapped in a plaid blanket, headphones, mug | Same set-up with snow outside instead of rain, a river of lights |
| one sentence frame ×6, a quiet voice | "There is a calm in …" ×6, original endings, a quiet Kokoro voice |
| A lo-fi track (70 BPM, C major) | An original code-made lo-fi bed (70 BPM, F major), cuts on its bar lines |

**Visible upgrades**: (1) the cuts sit exactly on the music's bar lines (one chord per scene); (2) parallax by depth in
every scene (background, middle, mascot and foreground move at different rates) instead of a near-static frame; (3)
small story props that pay off each line (the empty second cup, the face-down phone, the paper boat, the umbrella crowd).

## What reads well
- The mascot reads at a glance in every scene (closed eyes, whiskers, cream muzzle), and each scene's prop pays off its
  line: the empty second cup, the paper boat, the phone face down, the umbrella crowd, the lamp, the snow.
- Floating on its back in the puddle is the strongest image (it is what otters do): ripples, rings, the reflected lamp.
- The cuts land on the bar lines of the 70 BPM bed, one chord per scene, so the reel feels edited to the music; the
  hard end loops into the first chord.
- Whisper hears all six lines exactly; the voice sits clearly on top of a soft bed.

## What is weaker
- The painting is simpler than the source's illustrations: flat shapes with gradients and a brush texture, no hand-drawn
  line work or detailed props; next to the source it reads as "vector with texture" rather than painted.
- The otter's poses are built from beans and tubes; the sleeping and sprawled poses are the least convincing (the
  sprawl reads as a long brown shape on a blanket).
- The crowd now passes in front of the otter often; on some frames it covers most of the body (the source lets the
  goose show more), and the faceless passers-by's heads cross the caption height (they are blurred blobs, not faces).
- Motion is higher than the source's (4.23 against 2.71), mostly the crowd scene.

## Deviations
- **Scene changes (explained miss).** Both reels have 5 hard cuts (source at 3.60, 6.53, 9.93, 14.60, 18.53 s; ours on
  the bars at 3.43, 6.86, 10.29, 15.43, 18.86 s). The analyzer finds palette jumps at 4 of the source's and 3 of ours
  (render 1, with the darker crowd, found 4 = 10.76/min). The legible crowd scene shares its warm-grey palette with the
  bedroom that follows, so that cut no longer registers. The real cut count and shot lengths match (median shot 3.43 s
  against 3.71 s).
- Voice level: 11.7 dB over the bed (the brief's gate) where the source sits ~6 dB over its music; the full mix is
  therefore a little drier than the source.
- Rain is replaced by snow in the last scene, and every scene drifts with parallax (the source is nearly static).
