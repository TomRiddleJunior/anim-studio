"""Inline local <script src> files into one HTML page (for previewing a canvas test page as a static snapshot).
usage: python -I inline.py in.html out.html"""
import os
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
base = os.path.dirname(os.path.abspath(src))
html = open(src, encoding="utf-8").read()


def rep(m):
    p = os.path.normpath(os.path.join(base, m.group(1)))
    return "<script>\n" + open(p, encoding="utf-8").read() + "\n</script>"


html = re.sub(r'<script src="([^"]+)"></script>', rep, html)
open(dst, "w", encoding="utf-8").write(html)
print(dst, len(html))
