# Bir Tawil: "Nobody's Land" (`bir-tawil`)

A 41.9 s map film in two formats, made with the marker-map engine (`../engine/README.md`) from `story.js` and
`script.json`. The script is SCRIPTS.md section C, approved by the user as written.

| file | what |
|---|---|
| `out/bir-tawil_16x9.mp4`, `out/bir-tawil_9x16.mp4` | masters: H.264 CRF 19, AAC 256k, −14 LUFS |
| `out/bir-tawil_16x9_upload.mp4`, `out/bir-tawil_9x16_upload.mp4` | upload copies: CRF 22, maxrate 16M / bufsize 32M, AAC 192k, +faststart |
| `out/qa/` | contact sheets (page and mp4, 2 fps sweeps and 1 fps sheets), mp4 frames, `qa_*.json`, the Diomede regression stills |
| `POST.md` | captions, titles, credits and the cover frame |
| `data/geo.json` | the constructed Bir Tawil and Hala'ib polygons and the 1902 line (see below) |
| `tools/` | this film's helpers (below) |

## Rebuild

From `map-films`:

```
python -I bir-tawil/tools/build_geo.py                 # polygons + 1902 line → data/geo.json (pasted into story.js)
python -I bir-tawil/tools/sat_slow.py bir-tawil         # satellite.py at ≤ 1.8 req/s (a sibling film fetched at the same time)
python -I bir-tawil/tools/regrade.py                    # tone the mosaics down (always after satellite.py)
<kokoro> -I engine/tools/voice.py bir-tawil ; python -I engine/tools/align.py bir-tawil
python -I engine/tools/mix.py bir-tawil
bash engine/tools/render_locked.sh bir-tawil 16x9 9x16 --workers 3
python -I engine/tools/qa.py bir-tawil --fmt 16x9 ; python -I engine/tools/qa.py bir-tawil --fmt 9x16
python -I bir-tawil/tools/final_qa.py                   # whisper on the mixed mp4 audio, 1 fps sheets, upload copies
```

## The geometry: constructed from Wikipedia's figures

No vendored source has the 1902 administrative boundary or a Bir Tawil polygon. world-atlas `countries-10m` (Natural
Earth) draws the de-facto Egypt–Sudan border straight along 22°N (21.996° after quantisation) from Libya to the Red Sea.
Halaib sits inside Egypt, Bir Tawil inside Sudan (it is not a separate feature), and the Wadi Halfa salient is inside
Sudan. The only trace of Bir Tawil is the topology vertices at 33.180°E and 34.083/34.091°E on the parallel.

So `tools/build_geo.py` builds the shapes from what Wikipedia states (checked 2026-10-31). They are schematic: right in
size, position and shape class, but not surveyed.

- **Bir Tawil:** a quadrilateral whose north edge is the 22nd parallel, from 33.18°E to 34.09°E (94 km; Wikipedia gives
  95 km). These are the world-atlas vertices, and they match "the border diverges about 183 km east of the salient".
  The hand-jagged sides are 52 / 47 / 28 km (Wikipedia: W 49, S 46, E 26). The area is 2,063 km² (Wikipedia: 2,060). The
  centroid (33.70°E, 21.88°N) is 4 km from Wikipedia's point (33.75°E, 21.87°N). Its north-east corner is the quadripoint
  with Hala'ib.
- **Hala'ib Triangle:** the south edge is 22°N from the quadripoint to the coast (36.884°E). The east edge is the
  world-atlas 10m Red Sea coast. The north-west edge is jagged, bulging north-west, and meets the coast at 23.165°N, just
  north of Alshalateen (23.1317°N, 35.5856°E), which Wikipedia places "on the northern administrative boundary". The area
  is 20,554 km² (Wikipedia: 20,580), 10.0× Bir Tawil.
- **The 1902 line** (blue marker) runs from the parallel at Bir Tawil's NW corner, around Bir Tawil's west, south and
  east sides, to the quadripoint, then up Hala'ib's north-west edge to the coast. Only the stretch that departs from 22°N
  is drawn, so the two lines stay distinct. **The 1899 line** (red marker) is 22°N from the Libya tripoint (24.998°E) to
  the coast.

The pronunciations, the respelling attempts and whisper's readings are in `script.json` → `respellNotes`:
"Bir Tawil" → bˈɪɹ təwˈil and "Halaib" → hˌɑlɑjˈib.

## Film-specific choices

- **Imagery:** EOX Sentinel-2 cloudless 2016 at z7 (wide fallback during zooms), z9 (Nile, Lake Nasser, Red Sea) and
  z10 (Bir Tawil, Hala'ib, the coast, 20.3–24.2°N). That is 56 + 182 + 162 tiles, fetched once at ≤ 1.8 requests/s into the
  shared cache. Bir Tawil has no coast, so the land mask covers the whole frame on the close-ups. The Red Sea coast,
  reefs, Lake Nasser and the Nile mask correctly on the wider shots (checked on `tiles/z*_check.jpg`). `satStyle.fadeIn`
  is [1.4, 0.65], so z10 is fully in by Z 9.35, where both territories fit the 16:9 frame.
- **Grade:** the engine's grade blows bright Nubian sand out to yellow under the warm paper multiply. `tools/regrade.py`
  applies gamma 1.24, saturation 0.74 and a 3 % green cut to the land mosaics. It keeps `z*_land.orig.png` and always
  starts from those.
- **Colour logic:** red = Egypt and the 1899 line (Egypt holds to it, which puts Halaib in Egypt). Blue = Sudan and the
  1902 line. The split at 22°N tints the north red and the south blue, and leaves Bir Tawil untinted (`holes`).
- **9:16:** in the "Each country picks…" beat the reel sits at Z 8.8 (84 % satellite, 16 % paper), because the
  385 km from Bir Tawil to the coast does not fit 1080 px at a fully satellite zoom. Bir Tawil's west corner is cropped
  there.

## Engine changes made for this film

All are additive and opt-in, and are logged in `engine/CHANGES.md` (bir-tawil entries 1–6). Diomede stills were verified
pixel-identical after each change with `tools/diomede_check.py`.

- second marker colour `ink`
- `area` event (tint / hatch a region)
- `pricetag` event (a tag on a string that flips)
- `count` `sep: ','`
- `split` `holes`
- story `hud: {shade}` (a darker band behind the lat/long and credit over bright imagery)

## QA results (2026-10-31)

- Both masters: 41.83 s video / 41.85 s audio (speech ends 40.35 s, plus the 1.5 s hold), −14.1 LUFS, −1.0 dBTP.
  No YAVG dips, no freezes. The voice sits 18.8–24.2 dB over the bed in every phrase (`mix.py`).
- Upload copies: 86.1 MB each, 16.5 Mb/s, AAC 192k.
- **Whisper on the final mixed mp4 audio** (`tools/final_qa.py`): 96.8 % word match in both formats. "Bir Tawil" and
  the first "Halaib" are heard correctly, and the remaining differences are spelling ("22nd", "a round"). The second
  "Halaib", at the end of the 2000 line, comes out as "Hala'i". This is not masking. The voice alone, or the mix with the
  bed 6 dB or 20 dB lower, gives "Halaib". The mix with the bed 12 dB lower, or the bare voice plus white noise at
  −48 dB, gives "Hala'i". So whisper is on the fence about that soft final b, and the music level is not the cause. The
  mix was left at the engine defaults.
- Contact sheets looked at: page sheets (`sheet_*_v2.jpg`), 2 fps mp4 sweeps (`sweep_*`), 1 fps mp4 sheets
  (`sheet1fps_*`), and full-size mp4 frames (`mp4_*`).
- `engine/tools/render_locked.sh` printed `exit 1` after both formats had rendered with exit 0. The script's last line,
  `[ $rc -ne 0 ] && exit $rc`, returns 1 when rc is 0. Harmless.
