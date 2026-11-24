"""Derive the riddle-cutaway skill template (3 shots: rising track + counter, the observer's desk, a 3-second countdown card)
from the sample's film.js and build.py (read-only), writing into the skill's assets/template/.
usage: python -I tools/make_template.py [sample_project_dir] [template_dir]
  (defaults: samples/riddle-hotel, and this skill's assets/template next to this script)"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
S = sys.argv[1] if len(sys.argv) > 1 else os.path.join("samples", "riddle-hotel")
T = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "assets", "template")
src = open(os.path.join(S, "assets", "lib", "film.js"), encoding="utf-8").read()
a = src.index("  // ---------------------------------------------------------------- timing (anchored to the voice)")
b = src.index("  // ---------------------------------------------------------------- exterior and card")
mid = '''  // ---------------------------------------------------------------- timing (anchored to the voice)
  const CD_N = 3;                    // the template counts 3; the format counts 10
  const cd0 = Le("r10") - 0.25;
  const T = { o1: 0, o4: L("r04") - 0.25, card: L("r10") - 0.15 };
  const F3 = Y(3);
  const shots = [
    { // hook: rising up the cutaway with the man climbing the stairs (floor counter 1 -> 3)
      t0: T.o1, draw(c, lt, u, t) {
        const p = ramp(t, 0, L("r04") - 0.4, E.io) * 2;
        const pos = stairPos(Math.min(p, 1.999));
        D.cam(c, 540, lerp(Y(1) - 560, F3 - 330, ramp(t, 0.05, L("r04") - 0.3, E.io)), 1.12);
        hotel(c, t, { lit: { "205": 1, "206": 1, "405": 1, "506": 1 }, r305: { bed: { occupied: false } }, r306: { bed: { sit: 0, eyes: "closed" }, dark: 0.3 },
          people: (c) => D.person(c, Object.assign({ x: pos.x, y: pos.y, s: 0.62, f: pos.face, walk: Math.sin(t * 9), carry: "case" }, GUEST)) });
        counter(c, String(Math.min(3, 1 + Math.floor(p + 0.05))));
      } },
    { // the observer: the switchboard lights 305 -> 306, "?" marks
      t0: T.o4, draw(c, lt, u, t) {
        D.cam(c, 600, Y(1) - 175, 2.0 + lt * 0.012);
        const lit = ramp(t, w("r04", "light") - 0.2, w("r04", "light") + 0.2), q = ramp(t, w("r04", "crazy") - 0.5, w("r04", "crazy"));
        hotel(c, t, { lobby: { lit: { "305": lit, "306": lit }, patch: lit, look: 1 - q * 0.5, armL: q > 0.5 ? -2.6 : -0.4, eyes: q > 0.5 ? "wide" : "open", mouth: q > 0.5 ? "o" : "flat", clock: "1:12" } });
        if (q > 0) for (let k = 0; k < 3; k++) D.qmark(c, 500 + k * 44, Y(1) - 290 - Math.abs(Math.sin(t * 5 + k)) * 12, 40, q);
      } },
    { // the countdown card
      t0: T.card, bg: P.cream, draw(c, lt, u, t) { card(c, t); } },
  ];

'''
out = src[:a] + mid + src[b:]
# the card: CD_N instead of 10
out = out.replace("const shown = Math.max(0, 10 - Math.floor(sec));", "const shown = Math.max(0, CD_N - Math.floor(sec));")
out = out.replace("const sec = t < cd0 ? 0 : Math.min(10, t - cd0);", "const sec = t < cd0 ? 0 : Math.min(CD_N, t - cd0);")
out = out.replace("const frac = sec >= 10 ? 0 : 1 - (sec % 1);", "const frac = sec >= CD_N ? 0 : 1 - (sec % 1);")
out = out.replace("* (sec > 0 && sec < 10 ? 1 : 0)", "* (sec > 0 && sec < CD_N ? 1 : 0)")
out = out.replace("D.text(c, String(shown), 0, 6, 110, P.ink);", "D.text(c, String(shown), 0, 6, 110, P.ink);")
out = out.replace('/* "The 1:12 Call" (riddle-hotel)', '/* TEMPLATE derived from "The 1:12 Call" (riddle-hotel)')
assert "CD_N - Math.floor" in out and "Math.min(CD_N" in out
os.makedirs(os.path.join(T, "assets", "lib"), exist_ok=True)
open(os.path.join(T, "assets", "lib", "film.js"), "w", encoding="utf-8").write(out)

bsrc = open(os.path.join(S, "tools", "build.py"), encoding="utf-8").read()
a = bsrc.index("def pills():")
b = bsrc.index("def main():")
pills = '''def pills():
    cd0 = Le("r10") - 0.25
    return [
        ("Room 305, every Friday", 0.12, L("r04") - 0.3, "top", "n"),
        ("Every single Friday", wd("r04", "light") - 0.1, L("r10") - 0.3, "bottom", "n"),
        ("Why?", L("r10") - 0.1, wd("r10", "you") - 0.1, "bottom", "n"),
    ], cd0


'''
open(os.path.join(T, "tools", "build.py"), "w", encoding="utf-8").write(bsrc[:a] + pills + bsrc[b:])
print("template film.js + build.py written")
