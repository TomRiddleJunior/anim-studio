"""Every hash the film shows is real: SHA-256 of the example passwords, salted SHA-256 (salt || password) for the users
table, and one real scrypt (N=2^17, r=8, p=1, OWASP's scrypt baseline) with its measured time on this PC.
Salts are 16 bytes derived from a fixed seed so the film is reproducible (a real system uses os.urandom / a CSPRNG).

usage: python -I tools/hashes.py   -> assets/lib/hash-data.js, scratch/hashes.json
"""
import hashlib
import json
import os
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USERS = [("ana", "sunflower42"), ("ben", "123456"), ("cy", "123456"), ("dee", "maple-tree-88")]
WORDLIST = ["123456", "password", "qwerty", "111111", "iloveyou", "dragon", "letmein", "sunflower42"]


def sha(s):
    return hashlib.sha256(s if isinstance(s, bytes) else s.encode()).hexdigest()


def main():
    d = {"sha": {p: sha(p) for p in ["sunflower42", "sunflower43", "a", "This whole sentence is a single input."] + WORDLIST}}
    rows = []
    for u, p in USERS:
        salt = hashlib.sha256(("film-salt-v1-" + u).encode()).digest()[:16]
        rows.append({"user": u, "pw": p, "plain_hash": sha(p), "salt": salt.hex(), "salted": sha(salt + p.encode())})
    d["users"] = rows
    salt = bytes.fromhex(rows[0]["salt"])
    t0 = time.perf_counter()
    sc = hashlib.scrypt(b"sunflower42", salt=salt, n=2 ** 17, r=8, p=1, maxmem=256 * 1024 * 1024, dklen=32)
    dt = time.perf_counter() - t0
    d["scrypt"] = {"params": "N=2^17, r=8, p=1", "hash": sc.hex(), "seconds": round(dt, 3)}
    # the one-letter change: how many hex characters differ
    a, b = d["sha"]["sunflower42"], d["sha"]["sunflower43"]
    d["diff_chars"] = sum(x != y for x, y in zip(a, b))
    os.makedirs(os.path.join(ROOT, "scratch"), exist_ok=True)
    json.dump(d, open(os.path.join(ROOT, "scratch", "hashes.json"), "w"), indent=1)
    open(os.path.join(ROOT, "assets", "lib", "hash-data.js"), "w", encoding="utf-8").write("window.HASHES = " + json.dumps(d) + ";\n")
    print(json.dumps(d, indent=1))


if __name__ == "__main__":
    main()
