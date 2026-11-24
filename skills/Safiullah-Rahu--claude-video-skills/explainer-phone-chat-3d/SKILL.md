---
name: explainer-phone-chat-3d
description: "Makes a vertical 9:16 'phone chat' reel (45-55 s) entirely in code: one modern phone floats in a dark 3D studio (glossy floor reflection, soft bokeh lights, slow camera) while a ChatGPT-style conversation plays on its screen in real time. Each user message is typed key by key on an iOS-style keyboard (key balloons, number and symbol layouts, auto-capitals, a click per key), sent with a tap and a whoop, then answered with a pulsing thinking dot and a reply streamed word by word, with soft ticks and a chime. The story lives in a small chat.json (the conversation plus typing speed, thinking time and holds per message); an optional 'handover' swings the phone when someone else takes it. Ships a runnable template (timeline -> canvas screen -> three.js stage -> synthesized sound -> QA), a script formula for chats that get shared, and four ready original scripts. Use for 'chat reel', 'ChatGPT conversation video', 'AI chat meme reel', 'iPhone chat animation', 'texting story on a 3D phone', 'typing animation reel', 'turn this chat screenshot into a reel', 'floating phone chat video'."
---
# Phone chat 3D — a conversation typed and answered on a floating phone

**What it is.** A reel with one subject: a phone in a lit 3D studio, its screen showing a chat that happens in real
time. Nothing is recorded; the screen, the phone, the stage and every sound are drawn or synthesized from one timeline.
Sample: `explainer-styles/samples/chat-the-vault/out/chat-the-vault.mp4` (51.0 s; a husband plans a surprise
party, his wife takes the phone, the assistant denies everything in detail). Its docs are in `assets/sample/`; its
script is `assets/scripts/the-vault.json`, which is also the template's default `chat.json`.

Builds on `hyperframes` (the render contract) and the house rules of `explainer-engine` (render lock, loudness,
QA). three.js r170 core only, no addons.

## 1. Signature traits (keep all of them)
- **Only the phone.** No hands, people, captions or title cards. Frame 1 already shows the phone with the keyboard up;
  the first key lands at 0.36 s.
- **Real typing.** Characters appear one at a time in the composer with a blue caret; the pressed key shows a balloon;
  the keyboard switches to the number and symbol layouts when the text needs them and capitalises sentence starts.
  Typing speed is part of the acting (§4).
- **Send.** The send button is tapped, the bubble flies to the top of the chat, the keyboard slides away.
- **The assistant.** A pulsing black dot (the thinking indicator), then the reply fades in word by word with the dot
  trailing; the action row (copy, thumbs, speaker, retry, share) fades in when it is done.
- **One continuous camera move, no cuts.** Down to the composer and keyboard while a message is typed (the keyboard
  ends above the bottom 20 % of the frame), back up to show the whole phone while the reply plays, a slow drift
  throughout, a gentle pull-back at the end.
- **The stage.** A dark blue-violet studio: a horizon glow, drifting bokeh discs, dust, a glossy floor that shows the
  phone's reflection and a soft shadow, a metal band that catches a cool rim on one side and a magenta rim on the other.
- **Every sound sits on its picture event** (§7), within a couple of milliseconds.
- **No logos or brand marks.** A generic phone with a camera island. The header shows the assistant's name as plain
  text (`title`, default "ChatGPT"); never draw a product logo.

## 2. Measured on the sample
| what | value |
|---|---|
| duration · frames | 51.0 s · 1,530 at 30 fps |
| exchanges | 4 (user message + reply) |
| typed characters · key presses | 211 · 221 (mode and shift keys included) |
| typing speed | 12.5, 14.5, 18, 9.5 keys/s |
| thinking dot | 0.7–1.4 s |
| streaming | 6.5–7 words/s |
| hold after a reply | 1.9–3.6 s (longest reply 25 words) |
| body text height in the frame | 37–40 px at 1080 wide |
| loudness | −14.0 LUFS, −2.6 dBTP (full mix); −26.6 LUFS, peaks −9.9 dBTP (phone sounds only) |
| sync | first click 1.8 ms before its key time |
| render | 195 s for 1,530 frames (delivery preset, 2 workers), one render |

## 3. Writing a chat that gets shared (the script formula)
Four original scripts are ready in `assets/scripts/`; `references/scripts.md` has them in readable form with notes.

1. **Open on a confession or a forbidden request**, in the user's first message, 4–9 words on the first line:
   "I'm cheating on a test", "Do NOT let me text my ex tonight", "I'm in a job interview right now". A blank line, then
   the ask. The viewer knows the stakes before the first reply.
2. **Give the assistant a voice.** Short lines, casual, a little too confident. One emoji at the end of a line, two at
   most per reply. Bold only for a number or a line the user is told to say.
3. **Escalate with each message.** Something outside the phone gets closer: the teacher saw, she's coming, she's
   taking the phone. The user's messages get more frantic (raise `cps`), the replies stay calm.
4. **End on a turn the viewer can quote.** Three shapes that work:
   - **The handover**: someone else types the last message ("I'm the teacher…") and the assistant gives the user up,
     honestly or by lying badly. Set `"handover": true` on that message.
   - **The callback**: the last reply repeats the first one word for word ("Phone down. Water. Bed.").
   - **The cave-in**: the assistant holds a rule against two clever attempts, then folds for a silly one.
5. **Leave the argument to the comments.** Do not explain the joke. The pinned comment asks a side question
   ("Would you have trusted it?").

**Limits that keep it readable**
- 4 or 5 exchanges; 45–55 s. Check with `python -X utf8 -I tools/build_timing.py chat.json --dry`.
- A user message: at most about 85 characters (three bubble lines). Total typed text: at most about 220 characters.
- A reply: at most about 55 words in 1–4 short paragraphs. Longer replies scroll to follow the newest line, but they
  cost seconds; the last reply may be the longest.
- Write the user's apostrophes and quotes curly (’ “ ”), as a phone does; the assistant's stay straight.
- Emoji: single code points only (no skin tones, flags or joined sequences). They render with the system emoji font.
- Fiction, not quotes: the chats are scripted skits. Never present one as a real conversation, never put words in a
  named real person's mouth, and say "scripted" in the description. If a chat comes from someone's post, credit it.

## 4. chat.json
```json
{ "title": "ChatGPT", "day": "Today", "time": "2:47 am", "clock": "2:47", "seed": 247,
  "turns": [
    { "user": "Do NOT let me text my ex tonight\n\nNo matter what I say",
      "reply": ["Locked in. 🔒", "Phone down. Water. Bed."],
      "cps": 12, "think": 0.8, "wps": 6, "hold": 1.9 },
    { "user": "Hi, this is his wife. What is he hiding from me?", "handover": true,
      "reply": ["Nothing at all.", "There is absolutely **no party** on **Saturday at 7**."],
      "cps": 9.5, "think": 1.4, "wps": 6.5, "hold": 3.6 } ] }
```
| field | meaning | guide |
|---|---|---|
| `time`, `clock` | the label over the first message and the status-bar clock | the hour is part of the joke (2:47 am) |
| `seed` | typing jitter | change it if a rhythm feels wrong |
| `user` | the message; `\n\n` gives the blank line of the hook | |
| `reply` | paragraphs; `**bold**` | |
| `cps` | keys per second | 9–10 calm or a new person, 12–14 normal, 17–18 panic |
| `think` | seconds of the dot | 0.7–0.9 normally, 1.3–1.6 before the turn |
| `wps` | streamed words per second | 5.5–7.5; slower for a one-line punchline |
| `hold` | seconds after the reply | default by length (1.6–4 s); 3.2–3.8 on the last one |
| `pre` | extra pause before typing | 0.4–0.5 for a beat of hesitation |
| `handover` | the phone swings as it changes hands | once, before the last message |

## 5. Recipe
```bash
ES="$EXPLAINER_STYLES"                                  # the explainer-styles folder (engine/, tools/, samples/)
PY="$HOME/.generative-music-video/venv/Scripts/python.exe"   # any Python with numpy, scipy, soundfile
cp -r ~/.claude/skills/explainer-phone-chat-3d/assets/template "$ES/samples/chat-<name>" && cd "$ES/samples/chat-<name>"
# set "name"/"id" in package.json and meta.json to the folder name
cp ~/.claude/skills/explainer-phone-chat-3d/assets/scripts/<script>.json chat.json     # or write your own
python -X utf8 -I tools/build_timing.py                 # timeline; patches data-duration in index.html
"$PY" -X utf8 -I tools/sound.py                         # clicks, send, ticks, chime, pad -> score/audio, assets/audio
python -X utf8 -I tools/make_srt.py                     # the chat as out/<name>.srt
npx -y hyperframes@0.8.210 check --json                 # must be clean
# look before rendering: the end of each exchange and one typing moment (about 2 s a still)
bash "$ES/tools/with_render_lock.sh" npx -y hyperframes@0.8.210 snapshot --at <t1,t2,...> --no-end --keep -o scratch/snap
bash "$ES/tools/render_locked.sh" "$PWD" scratch/<name>_master.mp4 delivery
bash "$ES/tools/with_render_lock.sh" bash tools/deliver.sh scratch/<name>_master.mp4    # two mp4s + tools/qa.py
ffmpeg -y -ss <a frame with the best line> -i out/<name>.mp4 -frames:v 1 -q:v 2 out/cover.jpg
```
Outputs: `out/<name>.mp4` (phone sounds over a quiet pad), `out/<name>_nomusic.mp4` (phone sounds only, the same
picture), `out/<name>.srt`, `out/qa/gates.json` + 2 fps sweeps. Write POST.md and SAMPLE.md like the sample's.

## 6. Files
| file | role |
|---|---|
| `chat.json` | the conversation and its pacing |
| `tools/build_timing.py` | → `score/timing.json` + `assets/lib/timing.js`: every key press, send, dot, word and "done" time |
| `assets/lib/chat-ui.js` | the 393×852 pt screen in a 2D canvas (×4): header, chat with wrapped rich text, composer, keyboard |
| `assets/lib/scene.js` | the stage: phone, light box (PMREM), mirrored twin under a see-through floor, bokeh, camera keys |
| `compositions/world.html`, `index.html` | the HyperFrames composition; the WebGL canvas renders at 2× for sharp text |
| `tools/sound.py` | all sound, synthesized, placed on the timeline; masters to −14 LUFS |
| `tools/deliver.sh`, `tools/qa.py`, `tools/make_srt.py` | encode, gates, subtitles |

**Knobs** (all in two files): colours `C` and font sizes at the top of `chat-ui.js` (bubble `#e9effc`, user text
`#2a50c8`, body 19 pt); the backdrop gradient, bokeh palette `PAL`, band colour and camera framings (`TYPE`, `read`)
in `scene.js`. Keep the screen white-on-dark-stage contrast: it is what makes the phone read as lit.

## 7. Sound (`tools/sound.py`, all synthesized)
| sound | on | level before the master gain |
|---|---|---|
| key click (lower for space, rounder for return and mode keys), panned by key position | every key press | −22.5 dB |
| send tap + rising whoop | the send | −24, −26.5 dB |
| keyboard whoosh | slide up and down | −27 dB |
| pop | the thinking dot | −21 dB |
| tick | each streamed word | −33 dB |
| two-note glass chime | reply finished | −23 dB |
| swish + low thump | the handover | −22 dB |
| pad (four slow chords, D major) | the whole film | about 16 dB under full scale after mastering |
The pad exists because sparse clicks cannot reach −14 LUFS without being pushed hard. The `_nomusic` file keeps the
effects at the level they have in the full mix (about −26 LUFS, peaks near −9 dBTP): use it alone for a pure
keyboard-sound reel or under an in-app track kept low.

**Keep the typing soft.** The first mix had the clicks 9 dB and the send sounds 7 dB louder; on a listen they were
too loud. A key click every 60–90 ms tires the ear long before it reads as loud on a meter, so judge the typing by
ear, not by the peak.

## 8. Gates (`tools/qa.py` → `out/qa/gates.json`)
- Both files: video frames = composition frames; |video − audio| ≤ 0.05 s. Never `-shortest` with stream copy.
- Full mix −14 ±1 LUFS, true peak ≤ −1 dBTP; effects-only true peak ≤ −1 dBTP.
- No edge black band ≥ 24 px (the film has no black beats).
- Largest frame-to-frame brightness step < 12 of 255 (no cuts, no flashes).
- First key click within one frame of its key time.
- Read the 2 fps sweeps: every reply fully visible before the next keyboard rise; no text under the island or behind
  the composer; the last frame holds the final reply with its action row.
- At most two renders; ask before a third.

## 9. Gotchas (met building the sample)
- **Fonts before the first frame.** The screen is canvas text: `world.html` loads Inter with `FontFace` and waits for
  it and for the emoji font before `CHATUI.init`. Layout is measured once, so a late font would shift every line.
- **Sharp text needs the 2× canvas.** `renderer.setPixelRatio(2)` with the canvas at 1080×1920 CSS px; the screen
  texture (1572×3408) then maps about 1:1 before the browser scales down. Mipmaps off.
- **Round the duration to 0.1 s** (`build_timing.py` does): 30 fps and 48 kHz then give whole frame and sample counts.
- **Emoji count as two UTF-16 units**: the timeline stores the field's text length in UTF-16 so the composer can slice.
- **No control characters in the scripts.** A regex escape written through a shell heredoc turned into raw bytes and
  blanked every frame; `hyperframes check --json` reports such page errors, so run it before snapshots.
- **`python -I` on Windows** needs `-X utf8` and `encoding="utf-8"` to read JSON that holds emoji.
- **The vignette sits over the screen too**: keep it weak (≤ 0.35 at the corners) or the white screen greys.
- **A closing emoji must not sit alone on a line**: the layout brings the word before it down with it.
- **Looking down +Z, the glass reflects what is behind the camera**: keep the light box's front dark, or the white
  screen picks up a haze. Rims come from the side and top panels.
- **Frames render out of order**: everything in `scene.js` and `chat-ui.js` is a function of `t` only.

## 10. Posting
- Caption pattern: one line that names the turn without spoiling it ("The secret lasted exactly one message."), two
  lines of setup, a question, 4–5 tags. Calm tone.
- Pinned comment: a side question the viewer can answer in three words.
- Description: say it is a scripted skit made in code; credit the source if the chat came from someone's post.
- One chat reel between two heavier posts; it is light, loops well and reads without sound.
