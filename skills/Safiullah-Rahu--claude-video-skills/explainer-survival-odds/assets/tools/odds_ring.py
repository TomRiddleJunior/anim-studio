"""Survival Odds · the AI odds ring (HUD overlay for the survival-scenario build step). Pure Python: it emits markup, CSS
and GSAP timeline lines for compositions/hud.html, plus sound cues for the sound design. Every state is a tl.set /
tween at a fixed time, so the ring is seek-safe in HyperFrames.

    from odds_ring import OddsRing
    ring = OddsRing(start=71)                         # frame 1: the ring already shows the starting odds
    ring.chip("YOU, AT HOME: 4%", 0.0, 6.2, "r")       # the comparison chip under the ring (frame 1)
    ring.recalc(32.43, -13, "OUTBREAK")                # a delta chip beside the ring, the digits roll, the arc sweeps
    ring.pulse(81.54, 83.6)                            # "Ninety-seven percent": the ring at its biggest
    ring.glitch(85.33)                                 # "forgot one thing": RGB split, scramble 0.6 s, lands on red ??
    ring.compact(40.2, 43.3)                           # shrink to a compact badge in a close-up (never over a face)
    # Day 2: open at ?? and reveal
    ring = OddsRing(start=None, reveal_from=97)        # frame 1: a red ?? (dashed, turning); the sting
    ring.reveal(4.08, 23, "SHORE LINK LOST")           # ?? -> scramble -> rolls 97 -> 23 in strides; chip -74% (red)
    html_, tl_ = mini_ring("cA", 0.0, 9.0)             # a small ?? ring for an option card (spins while shown)
    els, tl, cues = ring.build()                       # markup strings, timeline lines, [{t, type, ...}] for the sound
    css = ring.css()

Spec (identity constants): top-right, clear of the HUD clock; ring 210 px, stroke 12 px over a thin track; tabular
digits 64 px; "AI ODDS" 20 px letter-spaced under it; colour by value (>= 75 green #46d483, 45-74 amber #f7b733,
< 45 red #ff5a45, ?? red). Recalculations at least 3 s apart; digits roll ~0.5 s (one tick cue per step), the arc
sweeps 0.6 s ease-out, a delta chip (+15% THE DEAD SINK green, -13% OUTBREAK red) pops on the fact's word.
"""
import html
import random

GREEN, AMBER, RED = "#46d483", "#f7b733", "#ff5a45"


def col_of(v):
    if v is None:
        return RED
    return GREEN if v >= 75 else AMBER if v >= 45 else RED


class OddsRing:
    def __init__(self, start=71, t_on=0.0, size=210, stroke=12, right=64, top=168, uid="od", roll=0.5, sweep=0.6, reveal_from=None):
        self.start, self.t_on, self.size, self.stroke, self.right, self.top, self.uid = start, t_on, size, stroke, right, top, uid
        self.reveal_from = reveal_from          # start=None: the ring opens at ?? (Day 2); reveal() rolls from this value
        self.roll, self.sweep = roll, sweep
        self.events = []          # (t, kind, data)
        self.chips = []
        self.compacts = []
        self.hide_ranges = []
        self.r = (size - stroke) / 2 - 4
        self.C = 2 * 3.14159265 * self.r

    # ---------------------------------------------------------------- authoring
    def chip(self, text, t0, t1, col="r"):
        self.chips.append((text, t0, t1, col))

    def recalc(self, t, delta, label):
        self.events.append((t, "recalc", {"delta": delta, "label": label}))

    def pulse(self, t0, t1):
        self.events.append((t0, "pulse", {"t1": t1}))

    def glitch(self, t):
        self.events.append((t, "glitch", {}))

    def reveal(self, t, value, label, scramble=0.35, roll=0.95):
        """?? -> value (Day 2's open): a short scramble, then the digits roll from reveal_from down/up to value in strides"""
        self.events.append((t, "reveal", {"value": value, "label": label, "scr": scramble, "roll": roll}))

    def compact(self, t0, t1):
        self.compacts.append((t0, t1))

    def hide(self, t0, t1):
        self.hide_ranges.append((t0, t1))

    # ---------------------------------------------------------------- track
    def track(self):
        """[(t, value or None for ??)] after each event, for SCRIPT.md / the report"""
        v, out = self.start, [(self.t_on, self.start)]
        for t, k, d in sorted(self.events, key=lambda e: e[0]):
            if k == "reveal":
                v = d["value"]
                out.append((t, v))
            elif k == "recalc":
                v = v + d["delta"]
                out.append((t, v))
            elif k == "glitch":
                out.append((t, None))
        return out

    def dash(self, v):
        return 0.0 if v is None else self.C * (1 - max(0, min(100, v)) / 100.0)

    # ---------------------------------------------------------------- build
    def build(self):
        u, S = self.uid, self.size
        ev = sorted(self.events, key=lambda e: e[0])
        for a, b in zip(ev, ev[1:]):
            if a[1] in ("recalc", "reveal") and b[1] in ("recalc", "reveal"):
                assert b[0] - a[0] >= 3.0, f"recalculations closer than 3 s: {a[0]:.2f} -> {b[0]:.2f}"
        # every value the counter shows (one span each) + the scramble values + ??
        vals = {self.start} if self.start is not None else set()
        v = self.start
        strides = {}
        for t, k, d in ev:
            if k == "reveal":
                a, b = self.reveal_from, d["value"]
                n = abs(b - a)
                stp = max(1, -(-n // 24))
                seq = list(range(a, b, -stp if b < a else stp)) + [b]
                strides[t] = seq
                vals.update(seq)
                v = b
            elif k == "recalc":
                nv = v + d["delta"]
                step = 1 if nv > v else -1
                vals.update(range(v, nv + step, step))
                v = nv
        rnd = random.Random(7)
        scramble = [f"{rnd.randint(10, 99)}" for _ in range(12)]
        spans = "".join(f'<span class="ov" id="{u}v{x}">{x}</span>' for x in sorted(vals))
        spans += "".join(f'<span class="ov sc" id="{u}s{i}">{s}</span>' for i, s in enumerate(scramble))
        spans += f'<span class="ov qq" id="{u}qq">??</span>'
        svg = (f'<svg class="ring" viewBox="0 0 {S} {S}" width="{S}" height="{S}"><circle class="trk" cx="{S/2}" cy="{S/2}" r="{self.r:.2f}" />'
               f'<circle class="arc" id="{u}arc" cx="{S/2}" cy="{S/2}" r="{self.r:.2f}" stroke-dasharray="{self.C:.2f}" stroke-dashoffset="{self.dash(self.start):.2f}" '
               f'transform="rotate(-90 {S/2} {S/2})" /></svg>')
        face = (f'<div class="face">{svg}<div class="val"><div class="digits" id="{u}dg">{spans}</div><span class="pct" id="{u}pct">%</span></div></div>')
        body = (f'<div class="ringbox" id="{u}rb">{face}'
                f'<div class="ghost gr" id="{u}gr">{face.replace(f"id=\"{u}", f"id=\"{u}R")}</div>'
                f'<div class="ghost gc" id="{u}gc">{face.replace(f"id=\"{u}", f"id=\"{u}C")}</div></div>'
                f'<div class="lab" id="{u}lab">AI ODDS</div>')
        els, tl, cues = [], [], []
        T_END = 9999
        els.append(f'<div class="clip oddsw" id="{u}" data-start="{self.t_on:.3f}" data-duration="{T_END:.3f}" '
                   f'style="right:{self.right}px;top:{self.top}px;width:{S}px;"><div class="in odds" id="{u}in">{body}</div></div>')
        # frame 1: on, at the start value, a snap pulse (the sting plays under it)
        tl.append(f'tl.set("#{u}in", {{opacity: 1}}, {self.t_on:.3f});')
        if self.start is None:      # Day 2: a red ?? on frame 1, the dashed arc turning until the reveal
            t_rev = next((e[0] for e in ev if e[1] == "reveal"), self.t_on + 9)
            tl.append(f'tl.set("#{u}qq", {{opacity: 1}}, {self.t_on:.3f});')
            tl.append(f'tl.set("#{u}pct", {{opacity: 0}}, {self.t_on:.3f});')
            tl.append(f'tl.set("#{u}arc", {{stroke: "{RED}", attr: {{"stroke-dashoffset": 0, "stroke-dasharray": "16 11"}}}}, {self.t_on:.3f});')
            tl.append(f'tl.set("#{u}rb", {{"--oc": "{RED}"}}, {self.t_on:.3f});')
            tl.append(f'tl.fromTo("#{u}rb .ring", {{rotation: 0}}, {{rotation: {360 * (t_rev - self.t_on) / 9:.1f}, duration: {t_rev - self.t_on:.3f}, ease: "none"}}, {self.t_on:.3f});')
        else:
            tl.append(f'tl.set("#{u}v{self.start}", {{opacity: 1}}, {self.t_on:.3f});')
            tl.append(f'tl.set("#{u}arc", {{stroke: "{col_of(self.start)}"}}, {self.t_on:.3f});')
            tl.append(f'tl.set("#{u}rb", {{"--oc": "{col_of(self.start)}"}}, {self.t_on:.3f});')
        tl.append(f'tl.fromTo("#{u}rb", {{scale: 1.07}}, {{scale: 1, duration: 0.45, ease: "back.out(2.6)"}}, {self.t_on:.3f});')
        tl.append(f'tl.fromTo("#{u}rb .face", {{filter: "brightness(1.6)"}}, {{filter: "brightness(1)", duration: 0.6, ease: "power2.out"}}, {self.t_on:.3f});')
        cues.append({"t": round(self.t_on, 3), "type": "sting"})
        # comparison chips under the ring
        for i, (text, t0, t1, c) in enumerate(self.chips):
            els.append(f'<div class="clip odcw" id="{u}cc{i}" data-start="{t0:.3f}" data-duration="{t1 - t0:.3f}" style="right:{self.right - 6}px;top:{self.top + S + 44}px;">'
                       f'<div class="in odc {c}">{html.escape(text)}</div></div>')
            tl.append(f'tl.set("#{u}cc{i} > .in", {{opacity: 1}}, {t0:.3f});')
            tl.append(f'tl.to("#{u}cc{i} > .in", {{opacity: 0, duration: 0.25}}, {t1 - 0.25:.3f});')
        cur = self.start
        first_scale = True
        for t, k, d in ev:
            if k == "reveal":
                D, R_ = d["scr"], d["roll"]
                rr = random.Random(int(t * 100))
                tl.append(f'tl.set("#{u}gr", {{opacity: 0.85}}, {t:.3f});')
                tl.append(f'tl.set("#{u}gc", {{opacity: 0.85}}, {t:.3f});')
                prev = f"{u}qq"
                steps = 7
                for i in range(steps):
                    ts = t + D * i / steps
                    nxt = f"{u}s{i % len(scramble)}"
                    tl.append(f'tl.set("#{prev}", {{opacity: 0}}, {ts:.3f});')
                    tl.append(f'tl.set("#{nxt}", {{opacity: 1}}, {ts:.3f});')
                    for gid, s_ in (("gr", 1), ("gc", -1)):
                        tl.append(f'tl.set("#{u}{gid}", {{x: {s_ * rr.randint(4, 14)}, y: {rr.randint(-5, 5)}}}, {ts:.3f});')
                    tl.append(f'tl.set("#{u}rb .face", {{clipPath: "inset({rr.randint(0, 50)}% 0 {rr.randint(0, 50)}% 0)", x: {rr.randint(-8, 8)}}}, {ts:.3f});')
                    prev = nxt
                tR = t + D
                seq = strides[t]
                tl.append(f'tl.set("#{u}rb .face", {{clipPath: "inset(0% 0 0% 0)", x: 0}}, {tR:.3f});')
                tl.append(f'tl.set("#{u}gr", {{opacity: 0, x: 0, y: 0}}, {tR:.3f});')
                tl.append(f'tl.set("#{u}gc", {{opacity: 0, x: 0, y: 0}}, {tR:.3f});')
                tl.append(f'tl.set("#{u}rb .ring", {{rotation: 0}}, {tR:.3f});')
                tl.append(f'tl.set("#{u}pct", {{opacity: 1}}, {tR:.3f});')
                tl.append(f'tl.set("#{u}arc", {{attr: {{"stroke-dasharray": "{self.C:.2f}", "stroke-dashoffset": {self.dash(seq[0]):.2f}}}, stroke: "{col_of(seq[0])}"}}, {tR:.3f});')
                tl.append(f'tl.set("#{u}rb", {{"--oc": "{col_of(seq[0])}"}}, {tR:.3f});')
                n = len(seq)
                for i, x in enumerate(seq):
                    f = i / max(1, n - 1)
                    ts = tR + R_ * (1 - (1 - f) ** 2.0)
                    tl.append(f'tl.set("#{prev}", {{opacity: 0}}, {ts:.3f});')
                    tl.append(f'tl.set("#{u}v{x}", {{opacity: 1}}, {ts:.3f});')
                    if i:
                        cues.append({"t": round(ts, 3), "type": "odds_tick", "up": False, "i": i - 1, "n": n - 1})
                    if i and col_of(x) != col_of(seq[i - 1]):
                        tl.append(f'tl.set("#{u}rb", {{"--oc": "{col_of(x)}"}}, {ts:.3f});')
                        tl.append(f'tl.set("#{u}arc", {{stroke: "{col_of(x)}"}}, {ts:.3f});')
                    prev = f"{u}v{x}"
                tl.append(f'tl.to("#{u}arc", {{attr: {{"stroke-dashoffset": {self.dash(seq[-1]):.2f}}}, duration: {R_:.2f}, ease: "power2.out"}}, {tR:.3f});')
                tl.append(f'tl.fromTo("#{u}rb", {{scale: 1.16}}, {{scale: 1, duration: 0.5, ease: "back.out(2.4)", immediateRender: false}}, {tR + R_:.3f});')
                delta = d["value"] - self.reveal_from
                cid = f"{u}d{int(t * 100)}"
                txt = f'<b>{"+" if delta > 0 else "−"}{abs(delta)}%</b> {html.escape(d["label"])}'
                els.append(f'<div class="clip oddw" id="{cid}" data-start="{tR - 0.05:.3f}" data-duration="3.2" style="right:{self.right + S + 18}px;top:{self.top + S / 2 - 30}px;">'
                           f'<div class="in odd {"g" if delta > 0 else "r"}">{txt}</div></div>')
                tl.append(f'tl.fromTo("#{cid} > .in", {{opacity: 0, x: 40, scale: 0.8}}, {{opacity: 1, x: 0, scale: 1, duration: 0.26, ease: "back.out(2.2)"}}, {tR - 0.05:.3f});')
                tl.append(f'tl.to("#{cid} > .in", {{opacity: 0, x: 16, duration: 0.25, ease: "power1.in"}}, {tR + 2.9:.3f});')
                cues.append({"t": round(t, 3), "type": "odds_glitch", "dur": D})
                cues.append({"t": round(tR - 0.05, 3), "type": "odds_reveal"})
                cues.append({"t": round(tR + R_, 3), "type": "odds_land"})
                cur = d["value"]
                first_scale = False
            elif k == "recalc":
                nv = cur + d["delta"]
                n = abs(nv - cur)
                step = 1 if nv > cur else -1
                seq = list(range(cur + step, nv + step, step))
                prev = cur
                for i, x in enumerate(seq):
                    f = (i + 1) / n
                    ts = t + self.roll * (1 - (1 - f) ** 2.2)          # fast first, slower into the final value
                    tl.append(f'tl.set("#{u}v{prev}", {{opacity: 0}}, {ts:.3f});')
                    tl.append(f'tl.set("#{u}v{x}", {{opacity: 1}}, {ts:.3f});')
                    cues.append({"t": round(ts, 3), "type": "odds_tick", "up": step > 0, "i": i, "n": n})
                    prev = x
                    if (col_of(x) != col_of(x - step)):
                        tl.append(f'tl.set("#{u}rb", {{"--oc": "{col_of(x)}"}}, {ts:.3f});')
                        tl.append(f'tl.set("#{u}arc", {{stroke: "{col_of(x)}"}}, {ts:.3f});')
                tl.append(f'tl.to("#{u}arc", {{attr: {{"stroke-dashoffset": {self.dash(nv):.2f}}}, duration: {self.sweep}, ease: "power3.out"}}, {t:.3f});')
                ir = "" if first_scale else ", immediateRender: false"
                first_scale = False
                tl.append(f'tl.fromTo("#{u}dg", {{y: {-10 if step > 0 else 10}}}, {{y: 0, duration: {self.roll + 0.1:.2f}, ease: "power2.out"{ir}}}, {t:.3f});')
                tl.append(f'tl.fromTo("#{u}rb .face", {{scale: 1}}, {{scale: 1.06, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false}}, {t + self.roll:.3f});')
                # the delta chip beside the ring
                sign = "+" if d["delta"] > 0 else "−"
                cc = "g" if d["delta"] > 0 else "r"
                cid = f"{u}d{int(t * 100)}"
                txt = f'<b>{sign}{abs(d["delta"])}%</b> {html.escape(d["label"])}'
                els.append(f'<div class="clip oddw" id="{cid}" data-start="{t - 0.05:.3f}" data-duration="2.6" style="right:{self.right + S + 18}px;top:{self.top + S / 2 - 30}px;">'
                           f'<div class="in odd {cc}">{txt}</div></div>')
                tl.append(f'tl.fromTo("#{cid} > .in", {{opacity: 0, x: 40, scale: 0.8}}, {{opacity: 1, x: 0, scale: 1, duration: 0.26, ease: "back.out(2.2)"}}, {t - 0.05:.3f});')
                tl.append(f'tl.to("#{cid} > .in", {{opacity: 0, x: 16, duration: 0.25, ease: "power1.in"}}, {t + 2.3:.3f});')
                cues.append({"t": round(t - 0.05, 3), "type": "odds_up" if d["delta"] > 0 else "odds_down"})
                cur = nv
            elif k == "pulse":
                t1 = d["t1"]
                tl.append(f'tl.fromTo("#{u}rb", {{scale: 1}}, {{scale: 1.22, duration: 0.5, ease: "back.out(1.8)", immediateRender: false}}, {t:.3f});')
                tl.append(f'tl.fromTo("#{u}rb .face", {{filter: "brightness(1) drop-shadow(0 0 0px rgba(70,212,131,0))"}}, {{filter: "brightness(1.35) drop-shadow(0 0 26px rgba(70,212,131,0.9))", duration: 0.5, ease: "power2.out", immediateRender: false}}, {t:.3f});')
                tl.append(f'tl.to("#{u}rb", {{scale: 1, duration: 0.6, ease: "power2.inOut"}}, {t1:.3f});')
                tl.append(f'tl.to("#{u}rb .face", {{filter: "brightness(1) drop-shadow(0 0 0px rgba(70,212,131,0))", duration: 0.6}}, {t1:.3f});')
                cues.append({"t": round(t, 3), "type": "odds_pulse"})
            elif k == "glitch":
                D = 0.6
                steps = 12
                rr = random.Random(int(t * 100))
                tl.append(f'tl.set("#{u}gr", {{opacity: 0.85}}, {t:.3f});')
                tl.append(f'tl.set("#{u}gc", {{opacity: 0.85}}, {t:.3f});')
                prev = f"{u}v{cur}"
                for i in range(steps):
                    ts = t + D * i / steps
                    nxt = f"{u}s{i % len(scramble)}"
                    tl.append(f'tl.set("#{prev}", {{opacity: 0}}, {ts:.3f});')
                    tl.append(f'tl.set("#{nxt}", {{opacity: 1}}, {ts:.3f});')
                    for gid, s_ in (("gr", 1), ("gc", -1)):
                        tl.append(f'tl.set("#{u}{gid}", {{x: {s_ * rr.randint(4, 14)}, y: {rr.randint(-5, 5)}}}, {ts:.3f});')
                    top_, bot_ = rr.randint(0, 60), rr.randint(0, 60)
                    tl.append(f'tl.set("#{u}rb .face", {{clipPath: "inset({top_}% 0 {bot_}% 0)", x: {rr.randint(-8, 8)}}}, {ts:.3f});')
                    tl.append(f'tl.set("#{u}arc", {{attr: {{"stroke-dashoffset": {self.dash(rr.randint(5, 95)):.2f}}}}}, {ts:.3f});')
                    prev = nxt
                tE = t + D
                tl.append(f'tl.set("#{prev}", {{opacity: 0}}, {tE:.3f});')
                tl.append(f'tl.set("#{u}qq", {{opacity: 1}}, {tE:.3f});')
                tl.append(f'tl.set("#{u}pct", {{opacity: 0}}, {tE:.3f});')
                tl.append(f'tl.set("#{u}rb .face", {{clipPath: "inset(0% 0 0% 0)", x: 0}}, {tE:.3f});')
                tl.append(f'tl.set("#{u}gr", {{opacity: 0.4, x: 4, y: 0}}, {tE:.3f});')
                tl.append(f'tl.set("#{u}gc", {{opacity: 0.4, x: -4, y: 0}}, {tE:.3f});')
                tl.append(f'tl.to("#{u}gr", {{opacity: 0, x: 0, duration: 0.5}}, {tE + 0.05:.3f});')
                tl.append(f'tl.to("#{u}gc", {{opacity: 0, x: 0, duration: 0.5}}, {tE + 0.05:.3f});')
                tl.append(f'tl.set("#{u}rb", {{"--oc": "{RED}"}}, {tE:.3f});')
                tl.append(f'tl.set("#{u}arc", {{stroke: "{RED}", attr: {{"stroke-dashoffset": 0, "stroke-dasharray": "16 11"}}}}, {tE:.3f});')
                tl.append(f'tl.fromTo("#{u}rb .ring", {{rotation: 0}}, {{rotation: 360, duration: 9, ease: "none", immediateRender: false}}, {tE:.3f});')
                tl.append(f'tl.fromTo("#{u}rb", {{scale: 1.18}}, {{scale: 1, duration: 0.5, ease: "back.out(2.4)", immediateRender: false}}, {tE:.3f});')
                cues.append({"t": round(t, 3), "type": "odds_glitch", "dur": D})
                cues.append({"t": round(tE, 3), "type": "odds_land"})
        for t0, t1 in self.compacts:
            tl.append(f'tl.to("#{u}in", {{scale: 0.62, duration: 0.25, ease: "power2.inOut"}}, {t0:.3f});')
            tl.append(f'tl.to("#{u}lab", {{opacity: 0, duration: 0.15}}, {t0:.3f});')
            tl.append(f'tl.to("#{u}in", {{scale: 1, duration: 0.25, ease: "power2.inOut"}}, {t1 - 0.25:.3f});')
            tl.append(f'tl.to("#{u}lab", {{opacity: 1, duration: 0.15}}, {t1 - 0.15:.3f});')
        for t0, t1 in self.hide_ranges:
            tl.append(f'tl.to("#{u}in", {{opacity: 0, duration: 0.2}}, {t0:.3f});')
            tl.append(f'tl.to("#{u}in", {{opacity: 1, duration: 0.2}}, {t1:.3f});')
        return els, tl, cues

    def css(self):
        S = self.size
        return f"""
    /* the AI odds ring (Survival Odds identity) */
    #root .oddsw {{ height: {S + 40}px; }}
    #root .odds {{ position: relative; width: {S}px; transform-origin: 100% 0; }}
    #root .odds .ringbox {{ position: relative; width: {S}px; height: {S}px; --oc: {AMBER}; transform-origin: 50% 50%; }}
    #root .odds .face {{ position: absolute; inset: 0; transform-origin: 50% 50%; }}
    #root .odds .ring {{ position: absolute; inset: 0; overflow: visible; transform-origin: 50% 50%; }}
    #root .odds .trk {{ fill: rgba(6, 10, 20, 0.58); stroke: rgba(255, 255, 255, 0.16); stroke-width: 5; }}
    #root .odds .arc {{ fill: none; stroke: {AMBER}; stroke-width: {self.stroke}; stroke-linecap: round; filter: drop-shadow(0 0 8px var(--oc)); }}
    #root .odds .val {{ position: absolute; left: 0; right: 0; top: 50%; height: 80px; margin-top: -42px; display: flex; justify-content: center; align-items: baseline; }}
    #root .odds .digits {{ position: relative; width: 96px; height: 80px; }}
    #root .odds .ov {{ position: absolute; right: 0; top: 0; opacity: 0; font: 700 66px/80px Inter, sans-serif; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; color: #fff;
      text-shadow: 0 2px 12px rgba(0,0,0,0.7); }}
    #root .odds .ov.qq {{ color: {RED}; right: -8px; text-shadow: 0 0 18px rgba(255,90,69,0.8), 0 2px 12px rgba(0,0,0,0.7); }}
    #root .odds .pct {{ font: 700 30px/1 Inter, sans-serif; color: rgba(255,255,255,0.86); margin-left: 3px; text-shadow: 0 2px 10px rgba(0,0,0,0.7); }}
    #root .odds .ghost {{ position: absolute; inset: 0; opacity: 0; mix-blend-mode: screen; pointer-events: none; }}
    #root .odds .ghost.gr {{ filter: sepia(1) saturate(9) hue-rotate(-50deg); }}
    #root .odds .ghost.gc {{ filter: sepia(1) saturate(9) hue-rotate(150deg); }}
    #root .odds .lab {{ margin-top: 10px; text-align: center; font: 700 20px/1 Inter, sans-serif; letter-spacing: 0.32em; color: rgba(236, 241, 250, 0.92);
      text-shadow: 0 1px 6px rgba(0,0,0,0.9); padding-left: 0.32em; }}
    #root .odcw {{ display: flex; justify-content: flex-end; }}
    #root .odc {{ padding: 8px 16px; border-radius: 10px; border: 2px solid; background: rgba(9, 13, 26, 0.84); font: 700 25px/1 Inter, sans-serif; letter-spacing: 0.04em; white-space: nowrap; }}
    #root .odc.r {{ border-color: {RED}; color: {RED}; }} #root .odc.g {{ border-color: {GREEN}; color: {GREEN}; }} #root .odc.y {{ border-color: {AMBER}; color: {AMBER}; }}
    #root .oddw {{ display: flex; justify-content: flex-end; }}
    #root .odd {{ padding: 10px 18px 11px; border-radius: 12px; border: 2.5px solid; background: rgba(9, 13, 26, 0.88); font: 600 32px/1 Oswald, sans-serif; letter-spacing: 0.03em; white-space: nowrap;
      box-shadow: 0 8px 24px rgba(0,0,0,0.45); }}
    #root .odd b {{ font: 700 34px/1 Inter, sans-serif; font-variant-numeric: tabular-nums; margin-right: 6px; }}
    #root .odd.g {{ border-color: {GREEN}; color: {GREEN}; }} #root .odd.r {{ border-color: {RED}; color: {RED}; }}
"""


def mini_ring(uid, t0, t1, size=104, col=RED):
    """A small dashed ring at ?? (the option cards' hidden odds): returns (html, timeline lines). It turns while shown."""
    r = size / 2 - 7
    svg = (f'<svg class="mrs" viewBox="0 0 {size} {size}" width="{size}" height="{size}"><circle cx="{size/2}" cy="{size/2}" r="{r:.1f}" fill="rgba(6,10,20,0.6)" stroke="rgba(255,255,255,0.14)" stroke-width="4"/>'
           f'<circle cx="{size/2}" cy="{size/2}" r="{r:.1f}" fill="none" stroke="{col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="11 8" style="filter: drop-shadow(0 0 6px {col})"/></svg>')
    h = f'<div class="mr" id="{uid}" style="width:{size}px;height:{size}px">{svg}<div class="mrq" style="color:{col}">??</div></div>'
    tl = [f'tl.fromTo("#{uid} .mrs", {{rotation: 0}}, {{rotation: {360 * (t1 - t0) / 6:.1f}, duration: {max(0.1, t1 - t0):.3f}, ease: "none"}}, {t0:.3f});']
    return h, tl


MINI_CSS = """
    #root .mr { position: relative; flex: none; }
    #root .mr .mrs { position: absolute; inset: 0; transform-origin: 50% 50%; overflow: visible; }
    #root .mr .mrq { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 700 38px/1 Inter, sans-serif; text-shadow: 0 0 14px rgba(255,90,69,0.7), 0 2px 8px rgba(0,0,0,0.8); }
"""
