"""Tiny dev server for drawing iterations without the render lock: serves <root> statically and accepts
POST /save?path=<relative png path> with a data-URL body (written under <root>, only into a scratch/ folder).
scratch/dbg.html posts its contact sheet here, so the sheet can be read at full resolution.
usage: python -X utf8 -I devserve.py <root> [port]"""
import base64
import http.server
import os
import sys
import urllib.parse

ROOT = os.path.abspath(sys.argv[1])
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8765


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_POST(self):
        q = urllib.parse.urlparse(self.path)
        rel = urllib.parse.parse_qs(q.query).get("path", [""])[0]
        dst = os.path.abspath(os.path.join(ROOT, rel))
        if q.path != "/save" or not dst.startswith(ROOT) or "scratch" not in dst.replace("\\", "/").split("/"):
            self.send_response(403); self.end_headers(); return
        body = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("ascii")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(base64.b64decode(body.split(",", 1)[1]))
        self.send_response(200); self.end_headers(); self.wfile.write(b"ok")


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
