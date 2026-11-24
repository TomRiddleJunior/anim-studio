"""Prints the 'baseT:oursT:label' beat list for compare.py from both projects' vo.json (base sample left, horror right)."""
import json
from pathlib import Path

H = Path(__file__).resolve().parent.parent
B = H.parent / 'layer-stack'


def load(p):
    v = json.loads((p / 'data' / 'vo.json').read_text(encoding='utf-8'))
    L = {l['id']: l for l in v['lines']}

    def w(lid, x, n=0):
        ws = [a for a in L[lid]['words'] if a['w'].lower().strip(',.:').startswith(x.lower())]
        return ws[n]['start']
    return L, w, v['duration']


bL, bw, bd = load(B)
hL, hw, hd = load(H)
end_v = hL['c14c']['end']
beats = [
    (0.7, 1.2, 'hook'),
    (bw('c01', 'rent') + 0.9, hw('c01', 'rent') + 0.55, 'naive build'),
    (bw('c01', 'customers') + 0.4, hw('c01', 'Friday') + 0.35, 'goes live'),
    (bw('c02', 'garage') + 0.5, hw('c02', 'coffin') + 0.45, 'failure 1 stamp'),
    (bw('c03', 'record') + 0.6, hw('c03', 'board') + 0.3, 'fix 1 + stack row'),
    (bw('c07', 'write') + 0.2, hw('c05', 'buzz') + 0.35, '4-stage pipeline'),
    (bw('c15', 'melts') + 0.35, hw('c11', 'jams') + 0.35, 'crowd blow-up'),
    (bw('c19', 'watched') + 0.3, hw('c13', 'scary') + 0.3, 'months later'),
    (bw('c20', 'Because') + 0.6, hw('c14', 'match') + 0.8, 'callback turns'),
    (bd - 0.8, end_v + 1.45 + 1.0, 'final stamp'),
]
print(' '.join(f'"{a:.2f}:{b:.2f}:{c}"' for a, b, c in beats))
