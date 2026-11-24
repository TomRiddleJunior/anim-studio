"""Static server for the sample folder + PUT /scratch/shots/<name>.png to save renders from the test page."""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "scratch", "shots")
os.makedirs(OUT, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_PUT(self):
        rel = self.path.split("?")[0].split("/scratch/shots/")[-1]
        dest = os.path.join(OUT, *[x for x in rel.split("/") if x not in ("", "..")])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        n = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(n)
        with open(dest, "wb") as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8732), H).serve_forever()
