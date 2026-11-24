---
name: x-posts-news-reel
description: "Makes a vertical 9:16 news-recap reel (60-95 s, 1080x1920, 30 fps) from a list of X/Twitter post links: every post captured as a clean, real screenshot through the public embed (no login, nothing retyped), read and sorted for slurs, jokes about deaths and other unusable content before anything is cut, ordered into short chapters on a beat grid, each held long enough to read (<= 4 words/s, 2.5 s minimum), with varied fast transitions (slam with flash, whip, feed-push, zoom-through, 3D flip, slice glitch), slow pushes and pull-backs on the cards, chapter tags, like-count / SATIRE / timing chips, a sourced results ticker, word-synced kinetic voice cards carrying a short, neutral, fact-checked narration (Kokoro), and a beat-driven news/trap bed synthesized in numpy with whooshes and slams on the cuts. Use for 'reel from these tweets', 'X posts recap video', 'reactions to the election / verdict / game / launch', 'Twitter reactions reel', 'news recap built from posts', 'compile these X links into a video', 'internet reacts' shorts. Built in code with HyperFrames; the posts.json record (URL, handle, name, exact text, media, time) is the audit trail. Builds on explainer-engine (Kokoro TTS) and hyperframes."
---
# X-posts news reel: real posts, read in full, cut on the beat

A reel made only of other people's posts lives or dies on two things: **the posts are exactly what was published**
(no retyping, no crop mid-sentence, no caption that changes their meaning) and **every one stays up long enough to read**.
Everything else (energy, transitions, music) serves those two. The narration is a connector, never a commentator.

Sample: `the sample film (the render is not included in this repository)`: "Midterms 2026 · X reacts"
(the 3 Nov 2026 U.S. midterms; 133 s, 23 of 24 linked posts). The sample project's own `SAMPLE.md` (gates, what reads
well or weak) is not included; its `edit.json`, shipped as `references/sample-edit.json`, is a complete worked edit.

## 1. Format
| element | spec |
|---|---|
| frame | 1080x1920, 30 fps; words and post cards only inside the 168-1330 px band (X / Reels / TikTok UI covers the rest); below 1330 only the grid floor |
| post card | the embed screenshot, **unchanged**, 980 px wide (max 850 px tall, scaled down to fit), centred at y = 780; rounded corners + deep shadow; body text lands at ~38 px |
| stage | near-black navy, a red glow left and a blue glow right drifting on 8-bar phrases (symmetric: no side gets the "good" colour), a perspective grid floor scrolling forward, a giant outlined year, a light pulse on each downbeat, overlay grain, vignette |
| HUD | top-left `● TOPIC 2026` (blinking dot), top-right post counter `07 / 13` (Roboto Mono), chapter tag above the card (Barlow Condensed, red/blue left rule), chips stuck on the card's lower-right corner (likes = pink, notes = white), a `RESULTS` ticker at y 1262-1320 |
| voice cards | the narration as kinetic type (Bebas Neue, 150-230 px), word by word on its spoken time, pages of 2-3 lines; party colours only as a consistent code (blue = Democrat, red = Republican), one amber keyword; a kicker pill and a small source line |
| hook (frame 0) | kicker pill + a two-word title ("AMERICA / VOTED.") over three of the reel's own posts fanned and dimmed (22 %); the voice starts at 0.12 s |
| end card | a neutral question ("What did your feed look like?"), "Posts shown as published on X, <dates>" and the AI-voice / code-music line |

## 2. Workflow (a new run with new links is: capture -> review -> order -> voice -> build -> sound -> render -> QA)
```bash
python -X utf8 -I ~/.claude/skills/x-posts-news-reel/assets/new_project.py "samples/<name>" --urls links.txt
cd "samples/<name>"
node tools/capture_posts.mjs urls.txt posts            # 1 capture: posts/NN_handle.png + posts/raw/NN_id.json + capture_log.json
python -X utf8 -I tools/dump_posts.py posts/raw     #   2 READ EVERY POST (text, quote, images, video still) -> posts/review.json (§4); ask the user
python -X utf8 -I tools/posts_json.py                  # 3 posts/posts.json: the audit record (exact text, media, ET time, status)
#   4 write vo/script.json (§6) and edit.json (§3, §5); check every fact the voice or ticker states (§6)
bash tools/voice.sh                                    # 5 Kokoro under the render lock -> vo/tts/ (raw take)
python -X utf8 -I tools/build.py                       # 6 compositions + index.html + score/timeline.json + SRT + reading gate
~/.generative-music-video/venv/Scripts/python.exe -I tools/sound_design.py   # 7 bed + sfx + voice -> assets/audio/final.m4a
bash "tools/with_render_lock.sh" npx -y hyperframes@0.8.210 check --json > scratch/check.json
python -X utf8 -I tools/check_summary.py scratch/check.json
bash "tools/with_render_lock.sh" npx -y hyperframes@0.8.210 snapshot --at 0,2,5.6,... --no-end -o scratch/snap1
bash "tools/render_locked.sh" "$PWD" scratch/master.mp4 delivery  # background; CRF 15 master
FF="engine/node_modules/ffmpeg-static/ffmpeg.exe"       # delivery encode: CRF 20, audio copied
bash "tools/with_render_lock.sh" "$FF" -v error -y -i scratch/master.mp4 -map 0:v:0 -map 0:a:0   -c:v libx264 -crf 20 -preset slow -profile:v high -pix_fmt yuv420p -r 30 -c:a copy -movflags +faststart out/<name>.mp4
python -X utf8 -I tools/qa_gates.py && python -X utf8 -I tools/cover.py --at 0
```
`build.py` prints the schedule with the reading gate per post (`scratch/schedule.txt`); a `FAIL` there means raise
`extra` on that post or lower `wps` — never shorten a hold below the gate. Re-running steps 6-7 after any edit is
seconds; only voice (5) and render are slow.
`tools/with_render_lock.sh` and `tools/render_locked.sh` are the author's local wrappers that let parallel sessions
render one at a time on a shared machine; they are not included. Without them, drop the `bash "tools/with_render_lock.sh"`
prefix and render the master with `npx -y hyperframes@0.8.210 render -o scratch/master.mp4 -q delivery -w 2`.

## 3. Pacing numbers
| quantity | value | why |
|---|---|---|
| beat grid | 120 BPM (0.5 s beat); every segment length is a whole number of beats, so every cut lands on a beat | music-led cuts without a beat tracker |
| post hold | readable time = max(2.5 s, words / 3.75) after the entry settles and before the exit starts, then rounded **up** to beats | "about 3.5-4 words per second of on-screen time, with a minimum hold" |
| words counted | the post's visible text + the quoted post's text (t.co links dropped); attached images with text get `extra` (e.g. +1.5 s for a screenshot collage) | the viewer reads the quote too |
| voice card | lead 0.22 s + the line + 0.30 s tail, rounded up to beats | the line finishes before the next cut |
| entry / exit | slam 0.16 / 0 · whip 0.30 / 0.22 · push 0.34 / 0.26 · zoom 0.36 / 0.28 · flip 0.30 / 0.18 · glitch 0.22 / 0 s | counted out of the readable time |
| sample | 133 s: 23 posts (2.6-8.9 s readable), 7 voice lines (75 words, 26 s of speech), 29 segments (13 cuts/min) | — |
| length cap | X plays 2:20 (140 s) for standard accounts: about 24 posts with 6-7 voice lines; more posts = two reels | — |

Short posts (4-8 words) get the 2.5 s floor and read fast; long ones (25-32 words with a quote) hold 7-9 s with a
pull-back so the frame still moves. 13 posts make ~90 s, 23 posts ~133 s.
Per-post keys in edit.json: `words` (override the count, e.g. text inside an attached image), `extra` (seconds),
`move` (`push` | `pull`), `punch`, `chips`, `tag`, `energy`, and the card's `maxh` / `cy` / `card_w` when a tall media
post would otherwise shrink its text under 28 px (the build prints `text~NNpx` per card).

## 4. Content review (before ordering; never skip)
Read every post in full: its text, the quoted post, every attached image (screenshots of other posts count) and the
video still. Sort them into `posts/review.json`:
- **A — recommend cutting** (tell the user exactly why, quoting the text): slurs (also lightly censored ones), sexual
  jokes about real people, jokes about a real person's death or killing, child-abuse references, threats. A
  dehumanizing attack on a group that is not even a reaction to the topic stays out whatever else is kept (the
  sample's #16).
- **B — the user decides** (recommend cutting for a neutral news recap): religion or ethnicity memes, terror-group
  jokes, execution / violence metaphors about named people, edited or AI images of real people (a coffin, an arrest).
- **C — keep, shown as-is**: profanity (no blur: blurring edits the post), parody, pointed opinions about officials.
- **ok** — clean.
Send the user ONE question with the A list (recommend cutting) and the B list (keep or cut) before voicing; put the
full table in a notes file. It is the user's editorial call. When offensive posts stay in:
- never in the hook or the closing slot, never right after a voice card; mid-chapter, between ordinary posts;
- no zoom punch, no chip, no tag or voice line that points at them; let them read and move on; plain transitions;
- POST.md gets a content note in every caption ("strong language and offensive jokes, shown as posted"), the advice to
  flag the media **Sensitive** on X, a reach warning (slurs fall under X's hateful-conduct rules even when quoted;
  Instagram / TikTok / YouTube may limit or remove the reel), and, if one exists, a cleaner cut for other platforms.
A deleted, protected or age-gated post fails in `capture_log.json` (the embed renders nothing): list it as
unreachable, never recreate it. Note when the linked set leans one way; the narration and overlays stay neutral anyway.

## 5. Transitions and moves (catalogue; `tin` on each segment)
- **slam** — the card drops from scale 1.42 in 0.16 s (power4.out), a 4-frame shake, a 0.38 white flash; for the first
  post after the hook, the first post of a chapter of memes, and the final post (3 per reel).
- **whip** — out: x -1250 with skewX 14 (power3.in 0.24 s); in: from x +1250 with skewX -14 (0.30 s).
- **push** — the feed scroll: out up 1600 px with -2.5°, in from below with +2.5°.
- **zoom** — out: scale 2.3 + fade; in: from 0.55. Used for every post -> voice card -> post boundary (a consistent chapter device).
- **flip** — 3D card flip on rotationY (perspective 1700 px): out to 88° in 0.18 s, in from -88° in 0.30 s.
- **glitch** — five horizontal slices jump ±50 px for three 2-frame steps with a red and a blue scan bar, then the clean card.
Rules: never the same transition twice in a row; slam ≤ 3 per reel; hold moves are a slow push (1.0 -> 1.045, y -12)
or, for tall cards with a quote, a top-anchored pull-back (1.055 -> 1.0 over 60 % of the hold); a beat punch
(1.0 -> 1.03 -> 1.0 in 0.18 s) on at most 2 posts. Nothing scales a card past 1.06 (it would crop text at the edges).

## 6. Narration and overlays
- 5-7 lines, 50-70 words, Kokoro `am_michael` at 1.15 (≈ 165 WPM while speaking). Only context and connectors: what
  happened (hook), the one fact the next chapter needs, a chapter connector ("Then came the memes."), what happens next,
  a neutral question. No adjectives about the posters, no verdicts, no jokes of our own.
- **Every fact the voice, a card or the ticker states is checked** with WebSearch and the source pages (WebFetch), two
  outlets each, and listed in the project's notes file. Where outlets disagree, say the weaker claim both support (sample: NBC wrote
  "first Senate victory in Texas since 1994", Houston Public Media "since 1988"; both support "the party's first
  statewide win there in 32 years", so the voice says that).
- Overlays never put words in a poster's mouth: chapter tags name topics ("TEXAS", "THE MEMES", "THE PARODY"), chips
  state data (`612K LIKES` from the JSON at capture time), or a label that prevents a misreading: `SATIRE` on a post
  written as fake news ("BREAKING: …", an invented quote of a real person), `POSTED BEFORE THE RESULTS` when the time
  stamp shows it. Party colours, if any, as a fixed code for both sides.
- Burned-in captions: the voice cards ARE the captions (word-synced); `out/<name>.srt` carries the same phrases.

## 7. Music and sound (`tools/sound_design.py`, numpy only)
A minor, i-VI-III-VII (Am F C G), 120 BPM; energy per segment (`energy` in edit.json; defaults hook 2, post 2, voice
card 1, end 0): e1 half-time kick + clap on 3 + 8th hats + sub + pad; e2 four-on-the-floor + claps on 2 and 4 + off-beat
saw stabs + open hat; e3 16th hats, kick pickups, full stab syncopation, filter open. A high 16th "wire" ostinato (the
newsroom pulse) throughout. Sidechain pump on every kick; saturated sub so phones hear the bass. Riser into every
energy rise, impact on its downbeat; a final impact on the end card and a 1.5 s tail. SFX only on visible actions:
three rotated whoosh takes on whip/push/zoom, a slam (sub thump + crack) on slams, paper flicks on flips, a bit-crush
burst on glitches, a pop on each chip, a tick when a card lands. Mix: the bed alone sits ~1.5 dB under the voice level,
ducks to voice -15 dB under speech (150 ms ramps); two-pass loudnorm -14 LUFS, TP -2.0 dBTP; when loudnorm overshoots
(it falls back to dynamic mode), a 4x-oversampled limiter at -2.2 dBFS; the AAC is measured again (`aac_true_peak_dbtp`
in `score/levels.json`), since AAC adds ~0.4 dB of true peak.

## 8. Gates (`tools/qa_gates.py` -> out/qa/gates.json)
| gate | target | sample (23 posts, 133 s) |
|---|---|---|
| format | 1080x1920, 30 fps, h264 CRF 19-22, yuv420p, AAC | CRF 20.0 after the re-encode (the HyperFrames delivery preset alone is CRF 15), 38.6 MB |
| stream lengths | video = audio = composition ± 0.1 s | 133.000 / 133.013 / 133.000 s |
| loudness · true peak | -14 ± 1 LUFS · ≤ -1 dBTP, measured on the mp4 | -14.4 LUFS · -1.3 dBTP |
| voice over bed (+sfx) | ≥ 10 dB under speech | 14.5 dB |
| frame 0 | a lit stage with a bright title (mean luma > 12, 99th pct > 200) | 29.6 · 249 |
| reading time | every post ≥ 2.5 s readable and ≤ 4 words/s | 23/23, slowest 3.64 w/s |
| screenshots unaltered | the shown PNG is byte-identical to the capture | 23/23 |
| first word | ≤ 0.4 s | 0.12 s |
| length | ≤ 140 s if it is for X standard accounts | 133.0 s |
The engine analyzer (`explainer-engine/engine/qa/analyze_video.py`) counts only the flash slams as cuts (3): motion
transitions over a constant stage don't register, so count boundaries from `score/timeline.json` instead (13/min).
Then look at a 0.5 fps sweep of the delivered mp4 (`ffmpeg -vf fps=0.5,scale=216:384` tiled): every card, every
voice page, the ticker still running at the end. The fps filter's frames sit up to ~1 s after their label, so a card
caught mid-exit is a transition, not a bug.

## 9. Capture method and gotchas
- **The public embed works without login**: `https://platform.twitter.com/embed/Tweet.html?id=<id>&theme=dark&dnt=true&lang=en`
  in headless Edge (playwright-core from the explainer engine). The embed fills the viewport width: a **440 px viewport
  at DPR 3** gives a 1320 px-wide card whose body text is ~50 px, ~38 px on the 980 px card. 550 px at DPR 2 reads
  noticeably smaller.
- Crop to the card's own bordered box (the article's parent) so the rounded corners are kept; wait for every `<img>`
  (`complete && naturalWidth`) and `document.fonts.ready` before the shot.
- **Timestamps print in the browser's time zone**: set `timezoneId: 'America/New_York'` for a U.S. audience, otherwise
  an evening post shows the next morning's date. Record UTC and ET in posts.json.
- `https://cdn.syndication.twimg.com/tweet-result?id=<id>&token=x` gives the JSON (text, display_text_range, user,
  mediaDetails, quoted_tweet, favorite_count, created_at). Like counts in chips come from it and are frozen at capture.
- `display_text_range` counts **UTF-16 code units** (an emoji is 2): slice the text through UTF-16 (`posts_json.py`
  does), or a post with emoji keeps the first letters of its t.co link and the word count is off.
- Video posts: the embed shows the poster frame with a play button and "Watch on X": that is the still to use.
- Photo grids are cropped by X's own layout in the embed (as in the timeline): fine, that is how X shows the post.
- Twemoji render as images inside the embed, so they survive the screenshot.
- `hyperframes check`: an outlined decorative year in HTML fails `text_not_painted`; draw it as SVG. Mark the blobs,
  grain, floor and ticker with `data-layout-allow-overflow` / `-overlap`. Repeated `fromTo` on one element needs
  `immediateRender: false` on all but the first.
- `np.convolve` with a 0.15-0.25 s box over a 90 s 48 kHz signal takes minutes; use the cumulative-sum moving average.
- The raw Kokoro take lives in `vo/tts/`; `build.py` writes `vo/data/vo.json` in **film time** (the upload kit's
  scripts PDF reads start times from there). Run `tools/voice.sh`, never tts.py on `vo/` directly.
- Kokoro glues an opening quote mark to the word before it (`posted,“` + `Let's`); `build.py` moves it onto the next
  word so the card and the SRT read `“Let's get to work.”`.
- The ticker repeats its run enough times to cover the whole scroll (110 px/s); a fixed 3 copies ran dry at ~105 s.
- Chips sit on the card's lower-right corner but never below y 1180 (the ticker starts at 1262).
- When outlets disagree on a number or a year, the voice says what they all support; re-voice rather than keep a
  claim one source contradicts (`tools/voice.sh` + build + sound is about a minute).
- The render lock (author's machine only, not included): every check, snapshot, TTS and render went through
  `with_render_lock.sh` / `render_locked.sh`.
  A delivery render of 133 s took about 5 minutes with 2 workers on the iGPU machine.
