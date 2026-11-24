"""Resumable, verified, multi-connection Hugging Face downloads (the partial file is only ever appended to).

  python tools/hf_resume.py Comfy-Org/MiniMax-Music-3 <dest_root> <repo_path> [...] [--conns 6] [--chunk-mb 48]

The bytes after a file's current size are split into chunks fetched by --conns parallel connections (Range requests,
206 required) into side files <name>.chunk_<offset>; an assembler appends finished chunks to the file strictly in
order and deletes them, so an interrupted run resumes from the file's size (finished side chunks are reused).
At full size the SHA-256 is checked against the LFS oid; a mismatch renames the file to .bad.
"""
import argparse, hashlib, json, os, queue, threading, time, urllib.request, urllib.error
from pathlib import Path

UA = "Mozilla/5.0 hf-resume/2.0"


def api_sizes(repo):
    with urllib.request.urlopen(urllib.request.Request(f"https://huggingface.co/api/models/{repo}?blobs=true", headers={"User-Agent": UA}), timeout=60) as r:
        m = json.loads(r.read())
    return {s["rfilename"]: (s.get("size"), (s.get("lfs") or {}).get("sha256")) for s in m["siblings"]}


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 24), b""):
            h.update(b)
    return h.hexdigest()


class Stats:
    def __init__(self):
        self.lock, self.got = threading.Lock(), 0

    def add(self, n):
        with self.lock:
            self.got += n


def get_chunk(url, part: Path, a, b, st: Stats):
    """Fetch bytes [a, b] into `part` (resuming inside the chunk)."""
    fails = 0
    while True:
        have = part.stat().st_size if part.exists() else 0
        if have >= b - a + 1:
            return
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Range": f"bytes={a + have}-{b}"})
            with urllib.request.urlopen(req, timeout=60) as r:
                if r.status != 206:
                    raise IOError(f"status {r.status}")
                with open(part, "ab") as f:
                    for blk in iter(lambda: r.read(1 << 18), b""):
                        f.write(blk); st.add(len(blk))
            fails = 0
        except (urllib.error.URLError, IOError, TimeoutError, ConnectionError, OSError) as e:
            fails += 1
            time.sleep(min(30, 2 * fails))


def fetch(repo, root, rp, size, sha, conns, chunk):
    dst = Path(root) / rp
    dst.parent.mkdir(parents=True, exist_ok=True)
    url = f"https://huggingface.co/{repo}/resolve/main/{rp}"
    have = dst.stat().st_size if dst.exists() else 0
    if have < size:
        offs = list(range(have, size, chunk))
        q = queue.Queue()
        for o in offs:
            q.put(o)
        done = {}
        st = Stats()
        cv = threading.Condition()

        def worker():
            while True:
                try:
                    o = q.get_nowait()
                except queue.Empty:
                    return
                part = dst.with_name(dst.name + f".chunk_{o}")
                get_chunk(url, part, o, min(size, o + chunk) - 1, st)
                with cv:
                    done[o] = part; cv.notify_all()

        th = [threading.Thread(target=worker, daemon=True) for _ in range(conns)]
        for t in th:
            t.start()
        t0, last = time.time(), 0.0
        with open(dst, "ab") as out:
            for o in offs:
                with cv:
                    while o not in done:
                        cv.wait(timeout=5)
                        now = time.time()
                        if now - last > 30:
                            cur = dst.stat().st_size
                            print(f"{rp}: {cur / 1e9:.2f}/{size / 1e9:.2f} GB on disk · {st.got / max(1e-3, now - t0) / 1e6:.2f} MB/s over {conns} conns", flush=True)
                            last = now
                part = done.pop(o)
                assert out.tell() == o, (out.tell(), o)
                with open(part, "rb") as f:
                    for blk in iter(lambda: f.read(1 << 24), b""):
                        out.write(blk)
                out.flush(); os.fsync(out.fileno())
                part.unlink()
    if dst.stat().st_size != size:
        raise SystemExit(f"{rp}: size {dst.stat().st_size} != {size}")
    if sha:
        got = sha256(dst)
        if got != sha:
            dst.rename(dst.with_suffix(dst.suffix + ".bad"))
            raise SystemExit(f"{rp}: SHA-256 mismatch; renamed to .bad")
    print(f"{rp}: complete and verified ({size} bytes)", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo"); ap.add_argument("root"); ap.add_argument("paths", nargs="+")
    ap.add_argument("--conns", type=int, default=6); ap.add_argument("--chunk-mb", type=int, default=48)
    a = ap.parse_args()
    info = api_sizes(a.repo)
    errs = []

    def run(rp):
        try:
            fetch(a.repo, a.root, rp, *info[rp], a.conns, a.chunk_mb << 20)
        except SystemExit as e:
            errs.append(str(e)); print(e, flush=True)
    th = [threading.Thread(target=run, args=(rp,)) for rp in a.paths]
    for t in th:
        t.start()
    for t in th:
        t.join()
    print("ALL DONE" if not errs else f"ERRORS: {errs}", flush=True)


if __name__ == "__main__":
    main()
