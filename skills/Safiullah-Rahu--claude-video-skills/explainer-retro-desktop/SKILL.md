---
name: explainer-retro-desktop
description: "Makes a vertical 9:16 '<Topic> 101' computer-science explainer reel (2:20-2:40) in the format of a viral Instagram explainer (@rick.theengineer, 'Encryption 101'): the whole frame is a beige CRT monitor; on its teal screen a generic retro desktop (an invented 'TerraOS 96') with grey bevelled windows, blue gradient title bars, a taskbar with a Start button, task buttons and a tray clock, and a pixel cursor that clicks, types, drags, right-clicks Cascade/Tile/Minimize; one window per idea popping on its word (Notepad text that scrambles, a browser form, a users table, a red-titled attacker .exe with a magnifier, a generator with random dots, a System Monitor pegged at 100 %, a Setup Wizard with < Back / Next >, an error box, a minimised strip for the recap); an ORIGINAL toon presenter standing on the taskbar at the left who gets dragged centre stage by the cursor for speech-bubble callouts (SIMPLE. / PROBLEM. / BUT WAIT... / RECAP!); karaoke captions in a cream box on the monitor's chin with the spoken word in a navy block; a fast TTS narrator (~190-205 WPM), 150-240 synthesized UI sounds, and a zoom-out ending onto two monitors on a dark grid. Everything is drawn in code on one canvas (an original 5x7 bitmap font, pixel icons, windows, the presenter). Use for 'Encryption 101 style', 'retro computer explainer', 'Windows-95 style explainer' (with no real OS branding), 'CS concept reel', 'how X works on a desktop', 'pixel desktop animation', 'rick.theengineer style', passwords/hashing/DNS/TCP/cookies/git/compilers explained, or any technical topic told through windows on an old desktop. Builds on explainer-engine (TTS, QA) and hyperframes."
---
# Retro desktop explainer — "<Topic> 101" on an old computer

Reverse-engineered from one Instagram reel (**@rick.theengineer**, `DfK9WY0Mri4`, "Encryption 101", 155.2 s, 22.8k likes;
`references/sources.md`). The format is a **narrated tour through windows**: every sentence gets a desktop layout,
every keyword gets a pop (a window, a field, a stamp, a click), a presenter stands at the left and is pulled to the
centre for one-word callouts, and the captions sit on the monitor's chin.
Sample: `the sample film (the render is not included in this repository)`, "Passwords 101"
(155.4 s): how websites store passwords (plain text, hashing, guessing and rainbow tables, salt, fast GPUs, slow
memory-hard hashes, the forgot-password test, your side, recap), presented by **Pia**, an original character.

## 1. Signature traits
- **The frame is a monitor.** Beige case (`#cac1a4`), a rounded teal screen (`#007a7c`) filling the top 72 %, a chin
  with the caption box, a vent grille, a floppy slot, a power LED (blinks on disk activity) and a power button.
- **A generic retro OS.** Grey bevelled windows (3 px bevels), navy-to-blue title bars (grey when inactive, red for the
  attacker), `_ □ ×` buttons, `File Edit Search Help` menus, a taskbar (Start + one button per open window + a clock),
  a pixel arrow/hand/grab/hourglass cursor. Invent the OS name; never show a real OS name, logo or start flag.
- **One layout per sentence, one pop per keyword.** Hard swaps on sentence boundaries; inside a layout things appear
  on their words with a Win-95 dashed "zoom rect" (0.14 s) and a UI sound.
- **The presenter at the left**, feet on the taskbar, lip-flap from the voice envelope, blinks, 6 poses. For
  callouts the desktop clears and the cursor **drags her centre stage** (lift, swing, drop squash) — a bubble with one
  letter-spaced word pops above her head.
- **Karaoke captions on the chin**: 1-4 words in a cream box (`#fdfdde`, 3 px black border, offset shadow), the
  spoken word inside a navy block (`#0b0b86`) in white, spoken words black, upcoming words grey.
- **Recurring desktop gags**: a cascade of term windows then right-click > Tile with a `?` in each; a red-titled
  attacker `.exe` with a magnifier; a generator with random dots; `Not Responding`; a Setup Wizard; an error box that
  shakes; everything minimised into a strip for the recap; the outro zooms out to two monitors on a dark grid with
  eavesdropper magnifiers circling.

## 2. Target metrics
Source: the engine analyzer's metrics + rea (not included). Sample: the owner's QA (not included).

| metric | source | sample (render 2) | gate |
|---|---|---|---|
| duration | 155.18 s | 155.43 s | ±15 % |
| layouts (rea shots) / analyzer cuts per min | 35 / 7.35 | 33 / 8.88 | ±20 % (ours +20.8 %: one cut over; explained) |
| scene changes / min (median scene) | 8.12 (5.17 s) | 8.88 (5.42 s) | ±20 % |
| words · WPM overall | 528 · 204 | 491 · 189.5 | ±20 % |
| first word · first change | 0.0 s · frame 0 | 0.18 s · 0.25 s | ≤ 0.4 s |
| motion mean (p90) · held | 3.67 (5.1) · 25 % | 3.58 (4.95) · 32 % | — |
| brightness · colourfulness | 0.663 · 80.4 | 0.642 · 69.4 | ±30 % |
| voice | TTS ~220 Hz | Kokoro af_heart 1.27x | — |
| SFX / bed | ~143 / none | 235 / chiptune bed 27 dB under (full mix only) | voice ≥ 10 dB over bed+SFX (19.3) |
| loudness · true peak | −14.1 LUFS | −14.01 LUFS · −2.29 dBTP | −14 ±1, ≤ −1 |
| Whisper small | — | 0.980 match, every line ≥ 0.85 recall | every line heard |

## 3. Beat map (% of runtime) and script formula
| % | beat | source (Encryption 101) | sample (Passwords 101) |
|---|---|---|---|
| 0-3 | **Title hook**: the title window on frame 0; the cursor drags a tool onto the secret, which scrambles | ENCRYPTION 101 Notepad, card number, a key dragged on | PASSWORDS 101 login.txt, `sunflower42`, a fingerprint dragged on, it scrambles into its real SHA-256 |
| 3-6 | **The jargon list**: one window per term on its word, cascading; presenter pops in | public key, private key, AES, RSA, TLS, certificates | plain text, hashing, salt, rainbow tables, bcrypt, Argon2 |
| 6-7 | **The open question** + right-click > Tile, a `?` in every tile | the open question about how the terms fit together | "what does a website actually keep…?" |
| 7-12 | **A concrete scenario** in a browser, then the network, then the threat window | checkout, router/ISP/backbone, eve.exe reads the card | sign-up, login wire to the server, users.db in plain text, dump.exe copies it, reuse unlocks other accounts |
| 12-18 | **The core idea, defined and shown** | plaintext -> ciphertext; wrong/wrong/right keys | hash.exe: fixed-length fingerprint, same in -> same out, one letter -> 62/64 characters change, an error box for "backwards" |
| 18-31 | **SIMPLE. / PROBLEM.** centre stage, then the problem shown | symmetric; key distribution | the login check; then guessing, common.txt, rainbow tables, identical hashes |
| 31-46 | **The fix** with a generator window | asymmetric: key-pair generator, public key everywhere | salt: Salt Generator (dots + 16 bytes), a salt column, different hashes, tables useless |
| 46-60 | **The catch** (System Monitor 100 %) and **the combination** | asymmetric is slow; hybrid | SHA-256 is fast; a GPU tries billions/s; weak passwords fall; why not slow on purpose? |
| 60-74 | **A Setup Wizard** walks the modern answer step by step | the TLS handshake (4 steps) | Slow Hash Setup: bcrypt/scrypt/Argon2id, cost, memory per guess, the real login time; billions -> thousands |
| 74-85 | **BUT WAIT…** a second question and its check | certificates, CA, the browser's checks | forgot-password test: the mail that shows your password vs the reset link |
| 85-87 | **One more concept** | digital signatures | your side: long random passwords, a manager |
| 87-95 | **RECAP!**: windows minimise into a strip; one card per idea, each strip icon ticks | 5 cards | 4 cards |
| 95-100 | **Title again + the zoom-out**, the clever-part line | two monitors, a handshake, eavesdroppers | two monitors, the fingerprint travels, eavesdroppers, "check it without ever keeping it" |

- **450-530 words**, 50-55 short lines, 190-205 WPM overall (Kokoro `af_heart` at 1.27x, line gaps 0.02 s + 0.21 s
  trim = ~0.25 s; 0.14 s more before a section). The source voice is a ~220 Hz TTS, so a female voice fits.
- Every technical claim must be right **and sourced** in `SAMPLE.md`; every value on screen (hashes, salts, timings)
  should be computed, not typed (`tools/hashes.py` pattern).

## 4. Visual system
| role | value |
|---|---|
| case | gradient `#d5cdb5` -> `#cac1a4` -> `#bdb497`; bezel `#b3aa8c` + `#3a3a36`; chin seam lines |
| screen | `SCR = {x 21, y 21, w 1038, h 1356, r 24}`; teal radial `#0b8b8c` -> `#006466`; 4 px scanlines (7.5 %), 12 fps noise, corner falloff 22 %, a glass sheen |
| taskbar | y 1329-1377; Start 150 px with a spark icon; task buttons 130-250 px with 28 px icons; tray 160 px with `7:30 PM` (+1 min per minute) |
| windows | face `#c0c0c0`, bevel `#fff/#dfdfdf/#808080/#0b0b0b`, active title `#0a2479 -> #2a78d2`, inactive `#7a7a7a -> #b9b9b9`, attacker `#7a0d0d -> #d23a3a`, paper `#fafaf5`, drop shadow `rgba(0,20,25,.32)` +10/+12 |
| content column | x 330-1035 while the presenter is at the left (her hand reaches x ~380); full width when she is away |
| type | the kit's 5x7 bitmap font (`K.text`, scales 3-13, bold = 1 px smear, `mono` cells, letter spacing); body 4, titles 3, labels 5, hero numbers 8-9 |
| accents | navy `#0b0b86`, red `#d22b2b`, green `#22a046`, amber/gold `#f2c026`, link blue `#1d4fd8` |
| captions | box centred at y 1470 (77 %), bottom edge <= 1518 (inside the 80 % title-safe line), font scale 5 bold, 30 px word gap |

## 5. The presenter (original — design your own per film)
- `K.pia(ctx, {x, y, s, pose, pose2, pk, mouth, blink, look, lift, swing, brow, t})` in `retro-kit.js`: a flat toon
  with a 5 px dark outline. Pia = dark-brown skin, a high afro puff with a pencil through it and a coral head band,
  round red glasses, gold hoops, a navy tee with a pixel key, an open mustard cardigan, olive trousers, white high-tops
  with coral soles, a steaming mug in one hand. 730 px tall at `s 0.86`, feet on the taskbar at x 150.
- Poses (`K.POSE`, shoulder/elbow angles from straight down): `idle`, `point` (index finger up beside the shoulder:
  pointing outward would cover the windows), `explain` (palm up), `present`, `shrug` (both arms), `thumbs`, `wave`,
  `hold`. Blend two with `pose2` + `pk` (0.28 s).
- **Never a lookalike**: the source's presenter imitates a copyrighted cartoon. Change silhouette, hair, age, clothes
  and props together, and say who she is in `SAMPLE.md`.

## 6. Shot grammar and transitions
- 30-35 layouts in 155 s (the source: 35 shots, all cuts). Change layout on a sentence boundary; keep the presenter,
  taskbar and chin constant so the cut reads as the computer, not the film, changing.
- Inside a layout: windows open with the dashed zoom rect from their centre (or from a strip icon / the taskbar),
  fields type at 12-22 cps with key clicks, hex scrambles through random glyphs (0.45-0.6 s), progress bars fill in
  navy blocks, stamps slam in (1.8x -> 1x, -5°), error boxes shake, network wires draw on.
- Callouts: the cursor arrives at her shoulder (hand), grabs (0.08 s), drags 0.5 s with a 26 px lift and a swing,
  releases (6 px squash) and moves away; the bubble pops (back-out 2.2, 0.22 s); the music bed cuts out under it.
- Recap: four or five 166x150 minimised windows across the top; each card zooms out of its icon; a tick lands on
  the icon 0.6 s later.
- Outro (last ~6 s): the monitor shrinks to 37 % at the left of a dark `#0b1316` dotted grid, a second monitor slides
  in from the right, a token travels on a gold line between them, 12 red magnifiers orbit; captions stay on the chin
  position.

## 7. Motion grammar
- Cursor: keyframes `[t, x, y, kind, click]`; moves take min(0.55 s, gap) with in-out cubic and arrive on the word;
  a click presses 3 px for 0.12 s. Kinds: arrow, hand (links, buttons, grabbing), grab (dragging), wait (hourglass
  while a job runs).
- Presenter: breath 3.6 s, blinks every ~3.4 s (jittered), head tilt, steam on the mug; the lip-flap is the voice
  envelope at 30 fps (`vo-data.js env`, attack fast, release 0.55).
- Everything is a pure function of `t` (seeded `rnd`), so any frame renders identically.

## 8. Caption system
- `tools/build.py` splits each line into chunks of <= 4 words / <= 22 characters, breaking after `, . ? ! : ;`; a chunk
  shows from its first word - 0.06 s to the next chunk (or +0.45 s), fading in over 0.06 s.
- The highlight follows the spoken word (word start - 0.02 s). Spoken words `#151515`, upcoming `#5c5c5c`.
- The SRT beside the render (sentence lines, <= 9 words) feeds the analyzer's WPM.

## 9. Sound
- **Source**: TTS voice + ~143 library UI sounds (pops on caption/label appearances, whooshes, dings, hits); **no
  music bed** (rea; the "music" stem sits at a -41 dB median).
- **Ours** (`tools/sound_design.py`, all synthesized): the voice (80 Hz high-pass, a little 2.5-5 kHz presence, 3:1
  above -16 dB, a look-ahead limiter); ~235 SFX from the film's own cue list (`node tools/dump_cues.mjs` ->
  `score/cues.json`): clicks, key taps, window bloops (pulse sweep 520 -> 1040 Hz), menu ticks, whooshes, drop thuds,
  hard-disk chatter, scramble bleeps, an original two-note error tone, success chimes, stamps, a GPU fan, a power-down
  sweep; SFX ride 13 dB under the voice and never peak above 55 % of the voice peak.
- **Full mix** adds a soft original chiptune bed (100 BPM, Cmaj7-Am7-Fmaj7-G6 pulse pads, triangle bass, a quiet
  1/8 arpeggio, lo-fi kick/hat) ~27 dB under the voice (24 + a 3 dB duck), cut out under the four centre callouts and
  swelling on the outro. **No-music mix** = voice + SFX (the source's own recipe), remuxed onto the same video.
- Both mixes: -14 LUFS, true peak <= -2 dBTP before AAC, padded to the exact film length.

## 10. Retention devices
- Frame 0 is a finished still that already names the topic; the cursor moves at 0.25 s; the secret scrambles at 1 s.
- The jargon list + `?` tiles promise to decode the headline words (open loop at 6 %).
- A visible change at least every ~1.5 s (235 cues in 155 s); centre-stage callouts every 15-30 s break the layout rhythm.
- Real values reward pausing (real SHA-256 hashes, salts, the measured login time).
- The ending turns the topic into one clever-part sentence over the zoom-out (ours: "check it without ever keeping
  it").

## 11. Do / don't
- **Do** keep the monitor, taskbar and chin fixed; keep windows inside the content column while she is at the left;
  draw every number from a computation; give the attacker a red title; tick the recap strip; credit the AI voice.
- **Don't** reuse the source's presenter or any copyrighted character; show a real OS name, logo, start flag, browser
  brand or system sound; name real companies or breaches; let her pointing hand cover window text; put captions below
  y 1518 or text outside the 1059 px screen edge (the bitmap font is wide: measure with `K.tw`).

## 12. Code recipe
```bash
cp -r ~/.claude/skills/explainer-retro-desktop/assets/template my-reel && cd my-reel   # runnable 9 s "Hashing 101" demo
# 1) vo/script.json (Kokoro af_heart, speed 1.27, gap 0.02)
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I "engine/audio/tts.py" vo
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/build.py   # vo-data.js (words, mouth env, caption chunks), index.html, world.html, out/<name>.srt
# 2) assets/lib/film.js: shot(t0, t1, name, draw(t), tasks) per layout, keyed to words: w("l05","password"); cue(t, kind) per action;
#    POSES / DRAGS / BUBBLES for the presenter; CK cursor keys. Real values in assets/lib/hash-data.js (tools/hashes.py pattern).
node tools/dump_cues.mjs                                                       # score/cues.json + score/shots.json
"$HOME/.generative-music-video/venv/Scripts/python.exe" -I tools/sound_design.py   # final.m4a (full) + score/nomusic.m4a
node tools/dryrun.mjs && npx -y hyperframes@0.8.210 lint                # every frame drawn in node: 0 exceptions before any render
bash "tools/with_render_lock.sh" python -I tools/snap.py scratch/snap1   # one still per shot + sheet
bash "tools/render_locked.sh" "$PWD" out/master.mp4 delivery            # ~2.3 fps on the iGPU box
bash "tools/with_render_lock.sh" bash tools/deliver.sh out/master.mp4 0.5   # CRF 19 + mixes + cover + QA + Whisper
python -I tools/script_md.py                                                   # SCRIPT.md from the voice + shots
```
- Kit API (`window.RETRO`): `text(ctx,str,x,y,scale,col,{bold,mono,sp,align,shadow})`, `tw()`, `icon(ctx,name,x,y,size,{rot,alpha})`
  (doc, fingerprint, salt, rainbow, hourglass, chip, key, lock, unlock, pc, server, globe, db, magnifier, warn, error,
  check, question, mail, bank, cart, cloud, gpu, stopwatch, vault, folder, floppy, monitor, gear, spark, table,
  wordlist, shield, user, u_ana/u_ben/u_cy/u_dee), `win(ctx,x,y,w,h,{title,icon,active,red,big,menu,menuRight,fill,small,buttons})`
  -> client rect, `panel/sunken/button/checkbox/radio/progress/field/menu/bubble/zoomRect`, `caseBack/desktop/screenFX/taskbar/chin/caption`,
  `cursor(ctx,kind,x,y)`, `pia(ctx,state)`.
- film.js helpers: `win(t, o, fn)` (open/close zoom rect, `move`, `shake`), `typed`, `typeCues`, `scramble`, `label`,
  `stamp`, `tableRows`, `wire`, `arrowDown/Right`, `withCtx(g, fn)` (redraw the whole monitor into an offscreen canvas
  for the outro).

## 13. QA gates
- `tools/qa.py` (reads `tools/qa_config.json`): 2 fps sweeps, compare.jpg (17 matched beats; only with an optional `--ref` reference video), YAVG dips, the analyzer,
  `gates.json` (length +-15 %, cuts/min and scene changes/min +-20 %, WPM +-20 %, -14 +-1 LUFS, TP <= -1, stream lengths,
  1080x1920 / 30 fps / AAC, the no-music file). `tools/whisper_check.py`: Whisper small with a topic prompt, per-line recall.
- Look at every tile of the sweep: windows inside the screen, no text under her hand, bubbles inside the screen,
  captions never clipped.

## 14. Gotchas met on the sample
- **The bitmap font is wide** (bold advance = 7 px x scale). "rainbow tables" at scale 6 overflowed a 600 px window;
  `M W m w` needed 7-px glyphs or bold fills their gaps. Measure every label with `K.tw`.
- **An outward point covers the windows** (a 245 px arm). Point up beside the shoulder instead and move the content
  column to x 330.
- **The tray clock and Start text overflowed** at scale 3 bold: Start 150 px, tray 160 px.
- **Kokoro reads "SHA-256" slowly** (1.3 s). Budget it.
- **Python heredocs with triple quotes break in this shell**: write patch scripts as files.
- **Rebinding `ctx`** (a `let`) lets the same `frame(t)` draw into an offscreen canvas; the K helpers take `ctx` as
  an argument, the film's `TX/IC` read the closure, so both follow.
- **A snapshot right on a caption chunk start shows it faded** (0.06 s fade). Not a bug.

- **An exception inside a clipped window leaks the clip into every later frame of that render worker.** Render 1 of
  the sample read a hash that `tools/hashes.py` had not generated yet; one worker then drew 32.7-77.3 s clipped to the
  hash window (no presenter, no captions, stale pixels from the last good frame) while every numeric gate still passed.
  Now: `ctx.reset()` at the top of every frame, each layout inside save/try/catch/restore, and `node tools/dryrun.mjs`
  (all frames against a fake context; logged shot errors count) before every render. Look at every sweep tile: the
  analyzer cannot see this.
- **Re-run the value generators after editing them** (`tools/hashes.py` -> `hash-data.js`), then the dry run.
- **The music cut-outs come from the film** (`film.music = {cut, swell}`, written by `dump_cues.mjs`); the sample's
  own `sound_design.py` falls back to its line ids.
- **Render speed**: the canvas film renders at ~11 fps with 2 workers here (425 s for 155 s); the lock queue was the
  slow part (up to 5 min per job). Batch snapshot + render + deliver in one locked job when you can.

Files: references/sources.md · assets/template/ (runnable 9 s demo) · tools/ (build.py, dump_cues.mjs, dryrun.mjs, hashes.py, sound_design.py,
snap.py, qa.py, qa_config.json, whisper_check.py, deliver.sh, script_md.py, floor_probe.py) · assets/kit/retro-kit.js ·
assets/sample/film.js (the full 33-layout "Passwords 101" film)

## Appendix A — source analysis (`DfK9WY0Mri4`)
Measured with the engine analyzer (metrics, transcript), the rea report, three 1 fps sheets, our six 2 fps sweeps,
full-size key frames and a 10 fps caption strip (none included). This appendix stands in for `references/analysis.md`.
Spoken lines and on-screen strings are described, not quoted.

**Numbers.** 155.18 s, 720x1280, 30 fps · 19 analyzer cuts (7.35/min, the first at 1.53 s), scene changes 8.12/min
(median scene 5.17 s); rea: 35 shots, 4.43 s average, all hard cuts · motion 3.67 (p90 5.1, 25 % held frames) ·
brightness 0.663, colourfulness 80.4 · palette teal `#02797a` 30 %, beige `#c4bc9e` 29 %, white `#f8f8f6` 16 %, grey
`#b4b6b8` 10 %, near-black `#1b2124` 6 %, slate `#737c80` 4 %, navy `#0f2d8c` 3 % · 528 words, 204 WPM · a TTS voice at
~220-232 Hz · voice + 143 library SFX, no music bed (the separated "music" stem sits at a −41 dB median) · −14.1 LUFS.

**Layout (720 px).** Screen x 14-706, y 14-918, radius ~14, teal `#007a7c` with scanlines; taskbar y 888-918 (Start
with a key icon, the presenter's own `.exe` button, one button per window, a constant 7:00 PM); chin below: caption box
centred at y 985 (77 %), vent grille at y 1108 (x 40-185), floppy slot (x 255-465), LED `#3ed268` (x 627), power button.
Presenter x 25-155, y 420-890, feet on the taskbar; content windows from x ~180.

| t (s) | beat | picture |
|---|---|---|
| 0-1.5 | title hook | ENCRYPTION 101 Notepad (a 4242… card number, exp, cvc); the hand cursor drags a gold key from the bottom-right onto the number, which scrambles |
| 1.5-5 | terms | the desktop clears; a small window pops per spoken term (public key, private key, AES, RSA, TLS, certificates), cascading down-right |
| 5-9.5 | question | the presenter appears at the left (5.0 s); right-click on the last window -> Cascade / Tile / Minimize -> Tile -> a 2x3 grid, a `?` in each |
| 9.5-18 | scenario + threat | a "Surf" browser checkout (card typed, Pay, "http:// - not secure"); a network of router / ISP / backbone / data center with a tracert console; `eve.exe` (red title, magnifier) reads the card; a bubble "ENCRYPTION." at the left |
| 18-26 | definition | card.txt selected -> an "Encrypting card.txt" progress box -> ciphertext; PLAINTEXT -> CIPHERTEXT labels; three keys: wrong, wrong, right |
| 26-30 | two ways | a C:\Crypto explorer: Symmetric (one key) / Asymmetric (a key pair) |
| 30-37 | symmetric | ALICE-PC and BOB-PC windows on an "internet" wire; shared.key copied to both; lock / unlock |
| 37 | SIMPLE. | centre stage, the desktop clear, a marquee drag-select |
| 37.5-42.8 | AES | shared.key Properties (AES, 256 bits); a big folder of personal files encrypted in a second over a grid of files |
| 43 | PROBLEM. | centre stage |
| 43.7-49 | the problem | a copy-progress box sends the shared key to Bob's PC; eve.exe grabs the key and reads the secret message |
| 49-63 | asymmetric | a Key Pair Generator that asks for mouse movement (dots trail the cursor) -> bob.pub PUBLIC / bob.key PRIVATE; a Network window gives bob.pub to every PC (EVE-PC too); an error box when Eve tries to open the message |
| 63-71 | the catch | two progress boxes (one second vs hours for the heavier maths), "Not Responding" ghosts, a System Monitor at CPU 100 % (rsa_math 99 %); fast vs safe windows; Hybrid encryption STEP 1 / STEP 2 |
| 71-96 | TLS | http:// -> https (the s highlighted, a padlock); browser and server with a status line that is not secure yet; a TLS Setup Wizard (blue banner, < Back / Next > / Cancel): agree on settings (checkbox columns), swap the shares, ephemeral keys, an elliptic-curve plot, session keys, a completed-handshake checklist |
| 96-117 | BUT WAIT... | centre stage; an impostor shop window with a joking reassurance; a Certificate window, a CA window with an engraved portrait, a Security Check list whose hourglasses turn into ticks |
| 117-133 | signatures | note.txt with a small payment instruction, signed with a seal; Signature check Valid, then INVALID! after $10 -> $1000; CONFIDENTIALITY vs AUTHENTICITY / INTEGRITY cards |
| 133-148 | RECAP! | centre stage; every window minimises into a strip at the top; cards for Symmetric, Asymmetric, TLS, Certificates open from it; the strip icons tick |
| 148-151 | title again | the ENCRYPTION 101 window, scrambled |
| 151-155 | zoom-out | the monitor shrinks left onto a dark dotted grid; a second monitor (the stranger's computer) slides in; two pixel hands shake under a padlock; red magnifier eyes orbit; no end card |

**Presenter.** A lookalike of a copyrighted cartoon scientist (never reuse); a still illustration with a moving mouth,
holding a sticker-covered laptop; dragged nowhere: he simply appears centre stage for each callout.

**Captions.** 1-4 words per chunk in a cream box with a black border and an offset shadow; the spoken word in a navy
block (white text) that moves word by word (the 10 fps strip shows it); spoken words black, upcoming words dark grey;
a bold pixel-like font ~22 px cap height.

**What we keep / change.** Kept: every element above, the beat map shape, the pacing (a cut per sentence, a pop per
keyword), the TTS register and speed, the sound recipe (voice + UI SFX). Changed: the topic, an original presenter and
OS, an original font, the drag gag, real computed values, a quiet bed in the full mix.
