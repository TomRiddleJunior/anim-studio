"""Wrap the vendor JSON as JS globals (file:// and some loaders can't fetch JSON): writes engine/data/*.js

  python -I engine/tools/vendor.py

  engine/data/atlas-50m.js   window.MF_ATLAS50 = {countries, land}   (world-atlas 2.0.2 topojson)
  engine/data/atlas-10m.js   window.MF_ATLAS10 = {countries, land}
  engine/data/lines.js       window.MF_LINES   = ne_10m_geographic_lines (date line, equator, tropics, circles)
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mfcommon import ENGINE, VENDOR  # noqa: E402

WA = VENDOR / "node_modules" / "world-atlas"
out = ENGINE / "data"
out.mkdir(parents=True, exist_ok=True)

for res in ("50m", "10m"):
    c = (WA / f"countries-{res}.json").read_text(encoding="utf-8")
    l = (WA / f"land-{res}.json").read_text(encoding="utf-8")
    (out / f"atlas-{res}.js").write_text(f"window.MF_ATLAS{res[:-1]} = {{countries: {c}, land: {l}}};\n", encoding="utf-8")
    print(f"atlas-{res}.js", round((out / f'atlas-{res}.js').stat().st_size / 1e6, 2), "MB")

g = json.loads((VENDOR / "geo" / "ne_10m_geographic_lines.geojson").read_text(encoding="utf-8"))
for f in g["features"]:  # keep only what the engine uses
    f["properties"] = {"name": f["properties"].get("name")}
(out / "lines.js").write_text("window.MF_LINES = " + json.dumps(g, separators=(",", ":")) + ";\n", encoding="utf-8")
print("lines.js", [f["properties"]["name"] for f in g["features"]])
