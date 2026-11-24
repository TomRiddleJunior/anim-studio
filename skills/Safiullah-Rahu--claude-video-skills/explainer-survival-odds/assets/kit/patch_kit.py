"""Kit v2.2 -> v2.3 (additive): a screen-space heat shimmer in the composite (st.warpAt [x,y,z], st.warpK, st.warpR [sx, sy]
in screen uv). Without warpK every frame renders exactly as v2.2. Applies exact replacements, each asserted once.
usage: python -I tools/patch_kit.py [assets/lib/survival-kit.js]"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "assets", "lib", "survival-kit.js")
s = open(P, encoding="utf-8").read()
if "warpK" in s:
    print("already v2.3"); sys.exit(0)
R = [
    (" *   mats.skinV (the vertex-coloured head skin) and mats.lipM. skinMat(hex, sheenColor) takes an optional sheen.\n */",
     " *   mats.skinV (the vertex-coloured head skin) and mats.lipM. skinMat(hex, sheenColor) takes an optional sheen.\n"
     " *\n * v2.3 (Survival Odds, additive): a heat shimmer in the composite: render(st) reads st.warpAt [x,y,z] (a world point,\n"
     " *   e.g. above a flare), st.warpK (0 = off, ~1 = a gentle ripple) and st.warpR [sx, sy] (the region's size in screen uv).\n"
     " *   A world module's K.onRender hook may set them (hooks run before the composite). Without warpK, v2.2 output.\n */"),
    ("lift: { value: new T.Vector3(0.006, 0.008, 0.016) }, black: { value: 0 } },",
     "lift: { value: new T.Vector3(0.006, 0.008, 0.016) }, black: { value: 0 },\n        warpC: { value: new T.Vector2(0.5, 0.5) }, warpS: { value: new T.Vector2(0.05, 0.09) }, warpK: { value: 0 }, wt: { value: 0 } },"),
    ("uniform vec3 rayCol, lift; uniform vec4 tint; uniform vec2 res; varying vec2 vUv; ${LIN}",
     "uniform vec3 rayCol, lift; uniform vec4 tint; uniform vec2 res; varying vec2 vUv; uniform vec2 warpC, warpS; uniform float warpK, wt; ${LIN}"),
    ("          vec3 sharp = vec3(texture2D(tC, vUv + off).r, texture2D(tC, vUv).g, texture2D(tC, vUv - off).b);\n          vec4 b = texture2D(tB, vUv);",
     "          vec2 wv = vUv;\n"
     "          if (warpK > 0.0) { vec2 dd = (vUv - warpC) / warpS; float wm = exp(-dot(dd, dd));\n"
     "            float wa = sin(vUv.y * res.y * 0.045 - wt * 9.0) + 0.6 * sin(vUv.y * res.y * 0.021 + vUv.x * res.x * 0.012 - wt * 6.3);\n"
     "            float wb = sin(vUv.x * res.x * 0.05 + wt * 7.1 + vUv.y * 30.0);\n"
     "            wv += vec2(wa, wb * 0.5) * warpK * wm * 0.0022; }\n"
     "          vec3 sharp = vec3(texture2D(tC, wv + off).r, texture2D(tC, wv).g, texture2D(tC, wv - off).b);\n          vec4 b = texture2D(tB, wv);"),
    ("          c += texture2D(tG, vUv).rgb * bloom;", "          c += texture2D(tG, wv).rgb * bloom;"),
    ("      cu.seed.value = Math.round(t * 30) % 251;\n      pass(comp, null);",
     "      cu.seed.value = Math.round(t * 30) % 251;\n"
     "      cu.wt.value = t; cu.warpK.value = 0;   // v2.3: heat shimmer round a world point\n"
     "      if (st.warpK && st.warpAt) { proj.fromArray(st.warpAt).project(camera); if (proj.z < 1) { cu.warpC.value.set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5); cu.warpK.value = st.warpK; const wr = st.warpR || [0.05, 0.09]; cu.warpS.value.set(wr[0], wr[1]); } }\n"
     "      pass(comp, null);"),
]
for a, b in R:
    n = s.count(a)
    assert n == 1, (a[:70], n)
    s = s.replace(a, b)
open(P, "w", encoding="utf-8").write(s)
print("patched", P)
