"""Summarise `hyperframes check --json` output (tolerates a leading lock line). usage: python -I check_summary.py <check.json>"""
import json
import sys

raw = open(sys.argv[1], encoding="utf-8").read()
d = json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
print("ok:", d.get("ok"))
for sec, v in d.items():
    if isinstance(v, dict) and "findings" in v:
        print(f"[{sec}] ok={v.get('ok')} errors={v.get('errorCount')} warnings={v.get('warningCount')}")
        for f in v["findings"]:
            print(f"  {f.get('severity')}: {f.get('code')} | {f.get('selector', '')} | t={f.get('time')} | {f.get('message', '')[:240]}")
    elif isinstance(v, dict):
        keys = [k for k in v if isinstance(v[k], list)]
        for k in keys:
            for f in v[k][:30]:
                print(f"  [{sec}.{k}] {json.dumps(f)[:300]}")
