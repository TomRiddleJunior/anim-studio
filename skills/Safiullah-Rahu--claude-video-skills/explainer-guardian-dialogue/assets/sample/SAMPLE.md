# Ten Rules for Ten Years · how it was built, the gates, what reads well and what is weaker

First episode of the user's series **The Guardian & the girl** (brief: `explainer-styles/BUILD_BRIEF_GUARDIAN.md`;
script: `SCRIPT.md`, used as written). Film `out/guardian-ten-years.mp4` (1080×1920, 30 fps, 87.85 s, H.264 CRF 20,
56.6 MB) with `out/guardian-ten-years.srt`, `out/cover.jpg` and `out/qa/`. The skill made from it:
`~/.claude/skills/explainer-guardian-dialogue/` (SKILL.md, EPISODE_GUIDE.md, plate, voices, runnable template).

## What was built
1. **The plate** (`tools/plate_build.py` → `plate/`). GrabCut per character, seeded by hand-measured outer/inner
   polygons (and darkness for the Guardian); a 13 px dilated hole inpainted with Telea at half scale and blurred for
   the background, plus the painted vertical clock hand erased so code hands can turn; the girl's eyes filled with
   skin by multi-scale normalised convolution for the closed-lid texture; the cyan line mask by hue; soft region maps
   (her head, ponytail, torso; his hood, raised hand, low hand, torso); lanczos 2× with an edge-limited unsharp mask.
   Every coordinate (eye polylines at 32 columns, mouth curve, pivots, medallion, hood opening) in `landmarks.json`.
2. **The renderer** (`assets/lib/guardian-gl.js`, `guardian-overlay.js`, `guardian-film.js`), WebGL2 inside a
   HyperFrames composition: a background pass (plate bg, code-drawn sky and clock rings above the plate and a warm
   void below it in the wide layouts, the clock hands with angular motion blur), additive particles (dust at three
   depths, blue sparks on his voice pulses, a faint drift inside the hood), a character pass (gaussian liquify warps
   masked by the region maps; her blinks and mouth; his line pulses and medallion; the stone parapet), 3-level bloom,
   a soft ACES grade with grain and vignette; a 2-D overlay for the question, counter, cards (16 abstract icons),
   captions, "NOW" and the end card.
3. **Voices**: Qwen3-TTS 1.7B VoiceDesign (the brief's two descriptions + each line's delivery), 3 seeds per line and
   3 anchor candidates per character (`tools/voice_qwen.py`, 66 clips, RTF 5–10 on 8 threads while other work ran).
   `tools/pick_takes.py`: every take through faster-whisper `small.en`; the anchor = the candidate most similar on
   average to all of that character's takes (G seed 1, mean cosine 0.788; L seed 1, 0.686); per line, the passing take
   with the highest VoiceEncoder cosine to the anchor (Guardian 0.77–0.87, girl 0.60–0.79; her whispered and one-word
   lines score lowest). Picked seeds: l01 2 · l02 3 · l03 1 · l04 3 · l05 2 · l06 1 · l07 2 · l08 2 · l09 2 · l10 2 ·
   l11 2 · l12 1 · l13 3 · l14 2 · l15 2 · l16 1 · l17 3 · l18 1 · l19 3. The girl's F0 medians 290–460 Hz (child-like).
4. **Timing**: `tools/join_vo.py` (trim, pause cap 0.28 s, Guardian tempo 1.07 except rule 2 at 1.0, per-line
   levelling to −17 dB), `tools/align_vo.py` (faster-whisper `small`, 183/186 words matched directly),
   `tools/timeline.py` (shots, cards, counter, captions, clock schedule, envelopes, acting) — every cut and cue is a word.
5. **Sound** (`tools/score.py`): Guardian chorus + air shimmer + clock-tower reverb, girl dry with a small room; pads and
   a music box in D major; ticks on the clock schedule; whirr; the clunk; chimes, whooshes, sparkle, shimmer, bell;
   two-pass loudnorm.

## Gates (final render)
| gate | target | measured | status |
|---|---|---|---|
| length | 70–90 s | 87.85 s | pass |
| first word · frame 0 | ≤ 0.4 s · girl + question | voice onset 0.12 s (Whisper stamps "What's" at 0.00) · frame 0 = the girl looking up with the question above her (`out/qa/frame0.png`) | pass |
| loudness | −14 ±1 LUFS | −14.2 LUFS (ebur128 on the mp4) | pass |
| true peak | ≤ −1 dBTP | −1.3 dBTP (mp4, AAC) · −1.5 (final.wav) | pass |
| voice over bed | ≥ 10 dB | 20.2 dB while speaking (lowest line, rule 2: 13.6 dB) | pass |
| Whisper | every line right | 100 % (186/186) with `small` on the final mix, speech span, no VAD; every picked take passed `small.en` | pass (see note) |
| open loop | by 15 % | "And the last one?" 12.24 s = 13.9 % ("almost nobody follows it" 15.2 %) | pass |
| re-hook | 40–50 % | "Is number one the secret?" 42.38 s = 48.3 % | pass |
| pattern break | clock stops, ~1 s silence | clunk at 70.52 s, first word of rule one 1.18 s later; hands at exactly 12:00 | pass |
| payoff | 75–85 % | "One." 71.70 s = 81.6 % ("…now." 92.7 %) | pass |
| cuts | 12–16 / min | 22 shots = 14.35 / min (analyzer 13.66, it misses one cut between two similar wides) | pass |
| contact sheets | look at all of it | `out/qa/sweep_2fps_1.jpg`, `_2.jpg` (176 frames) | done |
| her face | blinks and lines natural | `faces_blinks.jpg` (11 blinks × 4 phases), `faces_lines.jpg` (her 3 lines × 6) | pass, see weaker points |
| captions vs cards/faces | none | 0 violations in 2634 frames (`out/qa/layout.json`) | pass |
| warp tearing | none at layer edges | hood edge across nods and the push-in, ponytail across sways: clean | pass |
| safe areas | top 220 / bottom 400 px clear of key text | counter 228–372, cards ≥ 390 and ≤ 1300, captions 1375–1465, end card 230–520 | pass |
| brightness | no unplanned YAVG dips | 0 flagged (min 45.0, mean 71.4, max 89.4) | pass |
| no third character · faceless | — | icons abstract; hood opening dark in every check (`out/qa/hood.jpg`) | pass |

Whisper note: with faster-whisper's default Silero VAD on the whole mix, the final "Now." is dropped (VAD ends its last
speech region before it, although the bed under that word is 29 dB down) and the score is 99.5 %. Transcribing the
speech span without VAD hears all 186 words; on an isolated tail clip the VAD version hears it too. Rule 2's "you're
becoming" first came out as "you'll become" under the busiest part of the bed; levelling the lines, lowering the ticks
and the whirr, and leaving rule 2 at tempo 1.0 fixed it.

## What reads well
- **The characters look like the key art**, because they are the key art: the girl's close-ups at 2.0–2.3× hold up,
  and the warps (breathing, head tilts, ponytail, hood nods, hand drift) read as life, not as distortion.
- **Blinks** look natural at phone size: the lid closes column by column with a tapered lash line and a soft shadow.
- **The wide layout** works: the procedural rings continue the painted clock convincingly, so the clock reads huge
  above the two of them, with the parapet and warm void below.
- **The clock as a device**: hands ticking faster, blurring into a time-lapse for rules 3–2, then the dead stop at
  twelve with frozen dust and silence, held through rule one and restarted on "Now." The frozen vertical hands behind
  the hood during the push-in are the strongest image in the film.
- **The faceless speaker** is legible: medallion glow and pulses along the cloak lines follow his voice.
- Layout discipline: no caption ever touches a card or a face; the counter hides on face close-ups.

## What is weaker
- **Lip-sync is subtle.** Her mouth opens 5.4 px at the chin (≈ 11 screen px at 2.2×) with a dark interior; it reads
  as speaking but not as precise visemes, and her smile line stays a smile. Bigger openings looked uncanny on the
  painted lips, so it stays small (the brief's rule).
- **The closed lids are flat skin**: no lid crease or eyelid shading beyond a 4.5 % darkening, and the far eye's lid
  is a little lighter than its rim-lit surroundings. Fine at blink speed, visible on a paused frame.
- **The Guardian's acting is small**: a 0.03 rad nod and a few pixels of hand drift. His presence comes mostly from
  light (medallion, pulses), not from gesture; a wider gesture would stretch the robe visibly.
- **Static composition limits**: every shot is the same painting, so the variety comes from framing, cards and light.
  There is no new angle or pose, and the end shot repeats the opening framing by design.
- **The parapet and void** under the wide band are plain code-drawn stone; they read as "ledge over a glowing drop"
  but not as painterly as the plate.
- **Voices**: the girl's VoiceDesign voice is convincingly young on her question, but her whispered and one-word lines
  are less consistent with her anchor (cosine 0.60–0.77). The Guardian at tempo 1.07 is a little less "slow and
  deliberate" than the brief's description, to fit 90 s.
- **Upscale** (2026-11-02, the user approved the download): the plate now takes its fine detail from Real-ESRGAN x4plus_anime_6B (17.9 MB, BSD-3-Clause; `tools/sr_upscale.py`, 36 s on the CPU) over the lanczos colour, so eyes, lashes, hair strands and the medallion rim are crisper in close-ups. Re-rendered with the same audio; the lanczos-only film is kept in `scratch/v1_lanczos/`. Bloom, grade and grain soften the gain in the final frames, so it reads as moderate, not dramatic.

## Re-voice / rebuild
```bash
cd "samples/guardian-ten-years"
export HF_HOME="tts-bench\\hf" TORCH_THREADS=8
"tts-bench/venvs/qwen/Scripts/python.exe" -I tools/voice_qwen.py --seeds 1,2,3     # resumes
"tts-bench/venvs/chatterbox/Scripts/python.exe" -I tools/pick_takes.py
PY="$HOME/.generative-music-video/venv/Scripts/python.exe"
"$PY" -I tools/join_vo.py && python -I tools/align_vo.py && "$PY" -I tools/timeline.py && python -I tools/layout_check.py
"$PY" -I tools/score.py && "ffmpeg-bin/node_modules/ffmpeg-static/ffmpeg.exe" -y -i score/audio/final.wav -c:a aac -b:a 256k assets/audio/final.m4a
bash "tools/render_locked.sh" "$PWD" out/guardian-ten-years.master.mp4 delivery
# then x264 CRF 20 -> out/guardian-ten-years.mp4, and QA: analyze_video.py, tools/qa_sheets.py all, tools/whisper_check.py, tools/make_cover.py
```

## Iterations
- Snapshots 1: medallion and cloak lines blown out → glow reduced ~60 %; cards overlapping the counter → every card zone
  starts at y ≥ 390; narrow cards cramped → a row layout (text left, icon right) for wide zones.
- Snapshots 2: the counter sat on her forehead in girl close-ups and on the hood opening in HANDS → hidden on face
  close-ups, moved left in HANDS; first closed lids showed a seam and a dark smudge → skin-only fill, wider blend band;
  the mouth barely opened on her whisper → envelope normalised per line, jaw 5.4 px, darker interior.
- Layout checker: CLOCK_MED put her face in the caption band during the tilt → the tilt starts higher.
- Voice: the first join ran 105 s (VoiceDesign pauses up to 1.9 s) → pause cap, tempo 1.07, tighter gaps → 87.8 s.
- Draft render sweep: a long card title overflowed ("UNCOMFORTABLE") → titles shrink to fit; the void was too orange and the
  parapet flat → darker void, block joints. Delivery render 2 (final): lids darkened 3 %.
