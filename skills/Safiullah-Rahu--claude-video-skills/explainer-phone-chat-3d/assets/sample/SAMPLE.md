# SAMPLE — chat-the-vault ("The Vault", 3D phone chat reel)

The second reel made with the `explainer-phone-chat-3d` skill, and the first from one of its ready scripts
(`assets/scripts/the-vault.json`, copied here as `chat.json`). 1080×1920, 30 fps, 51.0 s. An original, scripted skit:
a husband plans a surprise party, his wife takes the phone, and the assistant gives the party away while denying it.

Built from the skill's template with no code changes: `build_timing.py` → `sound.py` → `make_srt.py` → check →
stills → one render → `deliver.sh`.

## Timing (s)
| turn | typed | sent | dot | reply streams | done | next |
|---|---|---|---|---|---|---|
| 1 | 0.36–7.08 (78 presses, with caps for NOT) | 7.50 | 8.12 | 8.92–11.39 (15 words) | 11.65 | 13.65 |
| 2 | 14.17–17.41 (48) | 17.83 | 18.45 | 19.20–21.54 (16) | 21.80 | 24.10 |
| 3 | 24.62–27.38 (44, the fastest) | 27.80 | 28.42 | 29.12–30.18 (7) | 30.44 | 32.34 |
| handover | 32.39–33.59 | | | | | |
| 4 | 33.81–39.90 (51, the slowest) | 40.32 | 40.94 | 42.34–46.63 (25) | 46.89 | 50.49 |

## Gates (delivered files, render 1)
| gate | result | pass |
|---|---|---|
| Streams | both files: video 51.000 s, 1,530 frames; audio 51.000 s | ✓ |
| Loudness, full mix | −14.1 LUFS, −1.8 dBTP | ✓ |
| Loudness, effects only | −21.2 LUFS, −2.2 dBTP (quieter by design) | ✓ |
| Edge black bands | 0 | ✓ |
| Largest brightness step | 2.5 of 255, at 33.1 s (the handover) | ✓ |
| Sync | first key click 1.8 ms before its key time | ✓ |
| Sweeps | 102 tiles at 2 fps in `out/qa/sweep_01–03.jpg`, all read | ✓ |

One render (195 s, delivery preset, 2 workers). The master is `scratch/chat-the-vault_master_r1.mp4`.

## Notes
- The first message is the longest part of the reel (6.7 s of typing for 74 characters). It carries the hook, so it
  stays; a shorter first line would save about 2 s.
- The sound was checked by measurement, not by ear.
- Same deviations as the first chat reel: no logos, Inter and the system emoji font, a quiet pad in the full mix,
  the keyboard slides away after each send.

## Sound update (12 Nov, after a listen)
The typing clicks were too loud. They are now 9 dB lower and the send tap and whoop 7 dB lower; the click's bright
tick is softer. Both files were re-encoded from the same render master (the picture is unchanged). New numbers:
full mix −14.0 LUFS, −2.6 dBTP; phone sounds only −26.6 LUFS, peaks −9.9 dBTP. All gates pass.
