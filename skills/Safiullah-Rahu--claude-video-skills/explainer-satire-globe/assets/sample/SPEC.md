# SPEC v3 — Holding Pattern: the week in world news, from the flight deck

GOAL:    A deadpan airline captain reads the week as cabin announcements; the viewer laughs at the framing and leaves
         knowing six real stories of 22–28 Oct 2026, each backed by the outlet's own page and one sourced number.
OUTPUT:  HyperFrames 0.8.210, 1920 x 1080, 30 fps, 145.84 s (4375 frames). Narration Kokoro bm_george 1.18 (opening
         1.08–1.1) with a light cabin-PA EQ (170 Hz–7.2 kHz, +2.5 dB at 2.6 kHz). Music: the engine's synthesized
         tech-glow score (120 BPM); synthesized SFX. (A MiniMax-Music3 bed was tried and set aside by the user.) Every cut, flap, whip, count and stamp sits on a narration word.
NO:      "Earth OS", version numbers, tickets, patch notes, bug/user jargon (v1/v2 framing, removed on request).
OPENING: 0–12.1 split-flap DEPARTURES board (STOP · DESTINATION · STATUS; letters spin, numbers land whole):
         destinations flip on "Good evening, ladies and gentlemen…", the stop numbers land on "six stops", the six
         statuses (CLOSED · IN COURT · DELAYED · DISPUTED · CONCEDED · ARRIVED) flip on "none of them are on time".
         12.1 whip (0.46 s expo.inOut, blur 16 px) from the board to a cabin wall with a window; the dotted orb
         assembles outside; the seatbelt sign lights on "seatbelts". 13.6–15.3 push through the window (scale 6.5,
         power3.in) while the camera closes from alt 4.5 to 2.6, then the first flight.
STOPS:   six desks of dossier paper pinned to the NASA terrain (v2 grammar: dive, whips with matched motion blur,
         breathing holds, pull-out with paper still pinned). Cabin chime (ding-dong) before each announcement. Top bar
         "HOLDING PATTERN · the week in world news · 28 Oct 2026 · STOP n OF 6"; arrival strip "STOP 0n · place ·
         lat/long · STATUS [EN ROUTE → status]"; data cards titled "| IN-FLIGHT BRIEFING · STOP 0n / 06"; statuses as
         red passport-style stamps (small "STATUS · date" line, word, place line).
SUMMARY: 123.5 pull back; 124.0–125.7 the planet unwraps into a flat map (the music's final section enters here);
         split-flap ARRIVALS board slides in; each status flips on its word in "One strait, closed. One lawsuit, in
         court…"; the matching map label (01–06) flashes amber.
END:     "ALL STOPS COMPLETE · 28 OCT 2026 / Next departure: / 3 Nov / Thank you for flying with us." and the title
         lands last as an exit stamp "HOLDING PATTERN" on "patience"; sources + "Score and sound synthesized in code".
PALETTE: board #0b0d10 with flap cells, flap ink #f4f1e8, status amber #ffb020; cabin wall #d9d3c8 plastic; rest as v2
         (ground #050F19, ice ink, data orange #c14800, stamp red #c4342a, paper creams).
SOUND:   tech-glow 120 BPM — energy 1 under the board, 2 from the window, 3 into the recap, 1 for the end card, end
         hit after the title stamp; music −16 dB under the voice, flap clicks per row, ding-dong per stop, swoosh per whip, whoosh/woosh_low on flights and dives,
         stamps, riser + impact on the unwrap; −14 LUFS.
