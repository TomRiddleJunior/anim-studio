"""Analyse a textaudit.mjs scan for number integrity. Every digit-bearing string drawn on screen is listed per chapter
with its first and last frame. Three kinds of string are flagged for review against the fact sheet:
- PARTIAL: a string whose last token is a cut-off number while it types or flips ("MAY 20", "n=1,2", "$1." …);
- FLAP: the split-flap board's text, rebuilt per frame from single-character cells in its zone;
- NEW: any digit string missing from an allow-list (the fact sheet's on-screen strings, plus lyric tokens).

  python scan_numbers.py scan.jsonl --board out/board.json [--allow allow.txt] [--flap-zone 1440,130,1840,215]
"""
import argparse, json, re
from collections import defaultdict


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scans", nargs="+"); ap.add_argument("--board", required=True); ap.add_argument("--allow")
    ap.add_argument("--flap-zone", default="1440,130,1840,215")
    a = ap.parse_args()
    board = json.load(open(a.board, encoding="utf-8"))
    chs = board["chapters"] if isinstance(board["chapters"], list) else list(board["chapters"].values())
    ch_at = lambda t: next((c["id"] for c in chs if c["t0"] <= t < c["t1"]), "?")
    lyric = {w.get("w", w[0] if isinstance(w, list) else "") for l in board["lines"] for w in l["words"]}
    allow = set(open(a.allow, encoding="utf-8").read().split("\n")) if a.allow else set()
    x0, y0, x1, y1 = map(int, a.flap_zone.split(","))
    frames = []
    for p in a.scans:
        frames += [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]
    frames.sort(key=lambda f: f["t"])
    by = defaultdict(lambda: [1e9, -1, 0])
    flap_states = []
    for f in frames:
        cells = defaultdict(list)
        for e in f["log"]:
            s, x, y = e[0], e[1], e[2]
            if x0 <= x <= x1 and y0 <= y <= y1 and len(s) == 1:
                cells[round(y / 10)].append((x, s)); continue
            if not re.search(r"\d", s) or (s in lyric and x < 1110 and y < 470):
                continue
            k = (ch_at(f["t"]), s)
            by[k][0] = min(by[k][0], f["t"]); by[k][1] = max(by[k][1], f["t"]); by[k][2] += 1
        txt = " / ".join("".join(c for _, c in sorted(v)) for _, v in sorted(cells.items()))
        if not flap_states or flap_states[-1][1] != txt:
            flap_states.append((f["t"], txt))
    partial = re.compile(r"(\b\d{1,3}$|\b20\d?$|n=\d?[,.]?\d{0,2}$|\$\d+\.?$|·\s*\d{1,2}$)")
    print("== digit strings by chapter (first–last, frames) ==")
    for (ch, s), (t0, t1, n) in sorted(by.items(), key=lambda kv: kv[1][0]):
        flag = " PARTIAL?" if partial.search(s.rstrip()) else ""
        flag += " NEW" if allow and s not in allow else ""
        print(f"{ch:10} {t0:8.3f}-{t1:8.3f} n={n:4}  {s!r}{flag}")
    # every intermediate state of the board while it flips: any number that is not a whole token of the settled row
    # (e.g. "$1" before "$1.4", "38 OCT" between "28 OCT" and "03 NOV") is an invented number on screen
    targets = [" / ".join(r.upper().replace(" ", "") for r in c["rows"]) for c in board.get("countdown", [])]
    print("\n== flap board states (* = not a settled countdown row) ==")
    for t, txt in flap_states:
        mark = "" if txt.replace(" ", "").replace("/", " / ") in targets or not re.search(r"\d", txt) else " *"
        print(f"{t:8.3f}  {txt}{mark}")


if __name__ == "__main__":
    main()
