# Sources — Money-news 3D

One Instagram reel, analysed frame by frame (see `analysis.md`), plus the news sources of the sample film.

| | |
|---|---|
| Reel | https://www.instagram.com/reel/DfGDek3RLcC/ |
| Account | a finance-news account (≈ 6K followers; its name and logo are not used anywhere in this skill) |
| Likes / comments | 37,118 / 131 (on 2026-11-01) |
| Duration | 75.62 s · 720×1280 · 30 fps |
| Post caption (summary) | Alphabet dropped up to 13 % on its Q3 results; cloud sales doubled to $30.7 B, search +12 %, capex $51.4 B, free cash flow from +$24.5 B to −$9.1 B. |
| What it is | A market-news explainer: photoreal 3D props (warehouse of cash pallets, poker chips, a receipt printing $1,000,000,000 lines, cash columns, server racks) alternating with cream serif editorial cards, dark chart cards, a slider, a split-flap board and a phone-mockup CTA; heavy condensed captions built word by word; a fast male narrator. |

## Key metrics (engine analyzer + `tools/scene_times.py`; analysed locally for reference only)

| metric | value |
|---|---|
| hard cuts | 4 (3.17 / min) at 24.5 · 26.2 · 39.1 · 41.8 s; first cut at 24.5 s |
| scene changes | 16 (12.70 / min), median scene 4.17 s: 3.3 · 6.7 · 10.2 · 15.8 · 24.0 · 25.8 · 27.8 · 33.2 · 38.7 · 41.3 · 44.0 · 48.2 · 51.7 · 57.7 · 63.2 · 68.5 s |
| motion | mean 10.38 · p90 28.6 · hold fraction 0.225 · animated_frac 0.895 |
| look | colourfulness 24.0 · saturation 0.278 · brightness 0.472 · dark-frame fraction 0.434 |
| palette | `#eae7dd` 33 % (cream) · `#0c1018` 17 % · `#060b0e` 15 % · `#151921` 10 % · `#bbb7a4` 10 % · `#4d5151` 6 % · `#2d2d30` 5 % · `#917060` 4 % |
| speech | 222 words · 176 WPM overall (≈ 190 while speaking) |
| loudness | −14.1 LUFS · 1.0 s of silence in total (the last second) |

Only the format is replicated: the device sequence, card system, caption system, pacing and sound. The account's name,
logo, script, story, brand colours and its use of real company logos and a stock photo of real people are not copied;
the sample uses a different, current story with its own sources.

## Sample film: news sources (all numbers, with URLs, in `assets/sample/FACTS.md`)
- Boeing Form 8-K Ex. 99.1, Q3 2026: https://www.sec.gov/Archives/edgar/data/0000012927/000162828026067411/a202609sep308kprex991.htm
- Boeing Q3 2026 deliveries release (Oct 13): https://boeing.mediaroom.com/2026-10-13-Boeing-Announces-Third-Quarter-Deliveries
- Reuters (Catchpole, Tiwary), via Euronext, Oct 27 2026: https://live.euronext.com/en/financial-news/boeing-shares-sell-slower-expected-737-production-weaker-free-cash-flow-outlook
- CNBC Investing Club, Oct 27 2026: https://www.cnbc.com/investingclub/2026/10/27/boeing-shares-slide-on-a-disappointing-cash-flow-update-why-this-dip-is-buyable-.html
- Simple Flying, Oct 28 2026: https://simpleflying.com/boeing-miss-737-max-delivery-target-wing-production/
- Air Data News, Oct 28 2026: https://www.airdatanews.com/boeing-pushes-737-production-recovery-into-2027-as-wing-bottleneck-persists
- Leeham News, Sep 16 2026: https://leehamnews.com/2026/09/16/rate-of-47-max-jets-per-month-still-eludes-boeing/
- Trefis, Oct 28 2026: https://www.trefis.com/stock/ba/articles/621038/why-is-boeing-stock-falling/2026-10-28
- Price history: Yahoo Finance chart API (BA, daily) · market cap cross-check: https://stockanalysis.com/stocks/ba/market-cap/
- Q3 2025 comparison: https://www.sec.gov/Archives/edgar/data/12927/000162828025046915/a202509sep308kprex991.htm
- "Bulk of the price at delivery": Reuters 2022 (https://www.investing.com/news/stock-market-news/boeing-delivered-29-737-max-jets-in-may-notches-widebody-orders-2836906) and Reuters 2025 (https://in.marketscreener.com/quote/stock/BOEING-4816/news/Boeing-deliveries-jump-to-60-in-June-including-8-to-China-50459127/)
