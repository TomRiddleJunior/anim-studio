"""Event timeline for a phone chat reel: ONE source of truth for the picture (assets/lib/timing.js ->
window.CHAT_TIMING) and for the sound (score/timing.json, read by tools/sound.py).

Reads chat.json (the conversation and its pacing), writes every key press, send, keyboard slide, thinking dot,
streamed word and "done" moment as a time in seconds, and patches the data-duration values in index.html.
Typing jitter is seeded, so the film is deterministic.

usage: python -X utf8 -I tools/build_timing.py [chat.json] [--dry]
  --dry   print the timeline only (to size a script before building it)

chat.json:
  { "title": "ChatGPT", "day": "Today", "time": "3:29 am", "clock": "3:29", "seed": 20261111,
    "turns": [ { "user": "text, \\n for a line break",
                 "reply": ["a paragraph, **bold** allowed", "the next paragraph"],
                 "cps": 12,          keys per second (9 = calm, 13 = fast, 17 = panic)
                 "think": 0.8,       seconds of the pulsing dot before the reply
                 "wps": 7,           streamed words per second
                 "hold": 2.0,        seconds the finished reply stays before the next message (default: by length)
                 "pre": 0.0,         extra pause before this message is typed
                 "handover": false   the phone swings as someone else takes it (adds a 0.95 s pause)
               } ] }
"""
import json
import math
import os
import random
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
SYM = set("[]{}#%^*+=_\\|~<>€£¥•")
APOS = "’'"
QUOT = "“”\""
ELLIPSIS = "…"
MODE_PATH = {("abc", "123"): ["123"], ("123", "abc"): ["ABC"], ("123", "sym"): ["#+="], ("sym", "123"): ["123"],
             ("abc", "sym"): ["123", "#+="], ("sym", "abc"): ["ABC"]}
MODE_TO = {"123": "123", "ABC": "abc", "#+=": "sym"}


def runs_of(par):
    """'a **bold** b' -> [[text, bold], ...]; a list of runs passes through."""
    if not isinstance(par, str):
        return par
    return [[tx, i % 2] for i, tx in enumerate(par.split("**")) if tx]


def para_words(runs):
    """A paragraph's runs -> words; a word = segments [text, bold] that never break apart."""
    chars = [(c, b) for tx, b in runs for c in tx]
    words, cur = [], []
    for c, b in chars:
        if c == " ":
            if cur:
                words.append(cur)
                cur = []
        else:
            cur.append((c, b))
    if cur:
        words.append(cur)
    out = []
    for w in words:
        segs = []
        for c, b in w:
            if segs and segs[-1][1] == b:
                segs[-1][0] += c
            else:
                segs.append([c, b])
        out.append(segs)
    return out


def plan_keys(text, cps, t0, rnd):
    """Key presses for one message. Each event: t, k (key id), lay (layout while pressed), la (layout after),
    kind (char | space | return | mode), n (UTF-16 length of the field's text after it), sh (shift lit after it),
    c (the glyph typed)."""
    ev, t, lay, base, n = [], t0, "abc", 1.0 / cps, 0
    chars = list(text)
    caps = False                                   # caps lock, for a run of two or more capitals (NOT, WAIT)
    for i, ch in enumerate(chars):
        nxt = chars[i + 1] if i + 1 < len(chars) else ""
        if ch.isalpha():
            need, key = "abc", ch.lower()
        elif ch == " ":
            need, key = lay, "space"
        elif ch == "\n":
            need, key = lay, "return"
        elif ch in SYM:
            need, key = "sym", ch
        elif ord(ch) > 0x2000 and ch not in APOS + QUOT + ELLIPSIS:
            need, key = lay, "emoji"               # an emoji: a click, no key lights up
        else:                                      # digits and the number-layout punctuation
            need, key = "123", ("'" if ch in APOS else '"' if ch in QUOT else "." if ch == ELLIPSIS else ch)
        if need != lay:
            for mk in MODE_PATH[(lay, need)]:
                t += base * rnd.uniform(0.9, 1.3) + 0.05
                new = MODE_TO[mk]
                ev.append(dict(t=round(t, 4), k=mk, lay=lay, la=new, kind="mode", n=n, sh=False, c=""))
                lay = new
        upper = ch.isalpha() and ch.isupper()
        auto_cap = i == 0 or chars[i - 1] == "\n" or (i >= 2 and chars[i - 1] == " " and chars[i - 2] in ".?!")
        run_next = bool(nxt and nxt.isalpha() and nxt.isupper())
        if upper and not caps and (run_next or not auto_cap):
            t += base * rnd.uniform(0.8, 1.2)      # a shift tap (it stands for the double tap when capitals follow)
            ev.append(dict(t=round(t, 4), k="shift", lay=lay, la=lay, kind="mode", n=n, sh=True, c=""))
            caps = run_next
        dt = base * rnd.uniform(0.62, 1.45)
        if i > 0 and chars[i - 1] == " ":
            dt *= 1.12
        if i > 0 and chars[i - 1] in ",.?!\n":
            dt *= 1.5
        if i == 0:
            dt = 0.0
        t += dt
        n += len(ch.encode("utf-16-le")) // 2
        la = lay
        if ch in APOS or (ch == " " and lay != "abc"):
            la = "abc"                             # iOS drops back to letters after an apostrophe or a space
        if caps and not run_next:
            caps = False
        sh_after = caps or bool(nxt and nxt.isalpha() and nxt.isupper()
                                and (ch == "\n" or (ch == " " and i >= 1 and chars[i - 1] in ".?!")))
        kind = "space" if ch == " " else "return" if ch == "\n" else "char"
        ev.append(dict(t=round(t, 4), k=key, lay=lay, la=la, kind=kind, n=n, sh=sh_after, c=ch if kind == "char" else ""))
        lay = la
    return ev, t


def build(chat):
    rnd = random.Random(chat.get("seed", 20261111))
    t, turns, handovers = 0.0, [], []
    for i, T in enumerate(chat["turns"]):
        cps, think_d, wps = T.get("cps", 12.0), T.get("think", 0.8), T.get("wps", 7.0)
        paras = [para_words(runs_of(p)) for p in T["reply"]]
        n_words = sum(len(p) for p in paras)
        hold = T.get("hold", round(min(4.0, max(1.6, 1.3 + 0.045 * n_words)), 2))
        if i == 0:
            kb_up, type_start = -1.0, 0.36
        else:
            pre = T.get("pre", 0.95 if T.get("handover") else 0.0)
            if T.get("handover"):
                handovers.append(dict(t0=round(t + 0.05, 4), dur=round(pre + 0.25, 4)))
            kb_up = t + pre
            type_start = kb_up + 0.52
        keys, type_end = plan_keys(T["user"], cps, type_start, rnd)
        send = type_end + 0.42
        kb_down = send + 0.05
        think = send + 0.62
        stream = think + think_d
        words, tw = [], stream
        for pi, p in enumerate(paras):
            if pi:
                tw += 0.2
            for _ in p:
                words.append(round(tw, 4))
                tw += (1.0 / wps) * rnd.uniform(0.7, 1.3)
        done = words[-1] + 0.26
        end = done + hold
        turns.append(dict(user=T["user"], reply=paras, sh0=T["user"][0].isupper(), kbUp=round(kb_up, 4),
                          typeStart=round(type_start, 4), keys=keys, typeEnd=round(type_end, 4), send=round(send, 4),
                          kbDown=round(kb_down, 4), think=round(think, 4), stream=round(stream, 4), words=words,
                          done=round(done, 4), end=round(end, 4)))
        t = end
    dur = math.ceil((t + 0.5) * 10) / 10          # a whole tenth of a second: an exact frame count and sample count
    meta = dict(title=chat.get("title", "ChatGPT"), day=chat.get("day", "Today"), time=chat.get("time", "3:29 am"),
                clock=chat.get("clock", "3:29"))
    return dict(fps=FPS, dur=round(dur, 4), frames=int(round(dur * FPS)), meta=meta, turns=turns, handovers=handovers)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    src = args[0] if args else os.path.join(ROOT, "chat.json")
    chat = json.load(open(src, encoding="utf-8"))
    data = build(chat)
    print(f"duration {data['dur']:.1f} s, {data['frames']} frames, {len(data['turns'])} messages")
    for i, tn in enumerate(data["turns"]):
        nw = len(tn["words"])
        print(f"  {i + 1}: type {tn['typeStart']:.2f}-{tn['typeEnd']:.2f} ({len(tn['keys'])} presses)  send {tn['send']:.2f}  "
              f"dot {tn['think']:.2f}  stream {tn['stream']:.2f}-{tn['words'][-1]:.2f} ({nw} words)  done {tn['done']:.2f}  next {tn['end']:.2f}")
        if nw > 60:
            print(f"     note: {nw} words in one reply; the screen scrolls to follow it, but shorter reads better")
    for h in data["handovers"]:
        print(f"  handover {h['t0']:.2f}-{h['t0'] + h['dur']:.2f}")
    if dry:
        return
    os.makedirs(os.path.join(ROOT, "score"), exist_ok=True)
    with open(os.path.join(ROOT, "score", "timing.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, "assets", "lib", "timing.js"), "w", encoding="utf-8") as f:
        f.write("// generated by tools/build_timing.py: do not edit\nwindow.CHAT_TIMING = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    idx = os.path.join(ROOT, "index.html")
    if os.path.exists(idx):
        html = open(idx, encoding="utf-8").read()
        new = re.sub(r'data-duration="[0-9.]*"', f'data-duration="{data["dur"]:g}"', html)
        if new != html:
            open(idx, "w", encoding="utf-8", newline="").write(new)
            print("  index.html: data-duration ->", f'{data["dur"]:g}')


if __name__ == "__main__":
    main()
