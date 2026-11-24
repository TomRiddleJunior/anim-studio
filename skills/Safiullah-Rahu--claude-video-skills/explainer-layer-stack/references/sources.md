# Sources — Layer-stack (presenter + piece-by-piece system diagram reel)

The style was built from frame-by-frame analysis of one Instagram reel (measured and studied; the format and its line
pattern are studied, and the presenter, mascot, brand, story and every drawing are original). Analysis: `references/analysis.md`.

| field | value |
|---|---|
| reel | https://www.instagram.com/reel/DfCi2s4zNno/ |
| account | virex.explains (24K followers on 2026-10-29) |
| format | 720×1280 (9:16), 30 fps, H.264 + HE-AAC, 128.6 s |
| likes · comments (on 2026-10-29) | 30,467 · 346 |
| audio | "Original audio" — one fast male narrator + UI sound effects, no music |
| caption hook | a one-line thesis (a company's own AI is the system around the model), then the eight layers listed and a closing warning about one untested edit |
| what it is about | a company builds "its own AI": model → system prompt → RAG pipeline → tools/MCP → access control → guardrails → cache + router → observability, each layer added after a concrete failure (recommending a competitor, a made-up refund limit, a payroll leak, prompt injection, a Monday token-bill explosion, an untraceable wrong answer); it ends with the first failure coming back after one untested late-week edit to the first layer |
| presenter | a well-known TV cartoon scientist drawn full-body at the left (copyrighted character — not reproduced; the skill ships an original presenter) |

## Key measurements (engine `qa/analyze_video.py` plus my own scripts; analysed locally for reference only)

| metric | value |
|---|---|
| chapters (hard cuts on white, counted from the chapter tag) | 20 in 128.6 s (mean 6.4 s) |
| hard cuts / min (analyzer) | 0 (white-canvas cuts do not trigger the detector) |
| scene changes / min · median scene | 0.93 · 20.7 s (only the crowd explosion and the halftone wipe register) |
| build events / min (diagram-region peaks, 10 fps) | 105.6 (> 1.5 levels) · 87.4 (> 5 levels) |
| motion mean / p90 · hold_frac | 6.47 / 13.65 · 0.012 |
| colourfulness · saturation · brightness | 17.7 · 0.052 · 0.904 |
| palette (k-means) | `#f8f5f2` 77 % · `#232529` 5.3 % · `#bab5b2` 4.6 % · `#766f74` 4.4 % · `#fcfcfc` 3.9 % · `#dadcde` 3.4 % |
| loudness | −14.2 LUFS; VO gaps fall to −55…−65 dB (no music bed) |
| WPM | 197.9 overall (425 Whisper words), ≈ 234 while speaking |
