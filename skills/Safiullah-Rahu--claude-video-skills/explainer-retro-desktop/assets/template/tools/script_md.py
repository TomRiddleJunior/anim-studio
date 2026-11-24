"""Write SCRIPT.md: every voice line with its time, the shot on screen and what it shows.
usage: python -I tools/script_md.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "vo", "data", "vo.json"), encoding="utf-8"))
SH = json.load(open(os.path.join(ROOT, "score", "shots.json"), encoding="utf-8"))["shots"]
DESC = {
    "title": "PASSWORDS 101 title window (login.txt, Notepad-style): `password: sunflower42`; the hand cursor drags a fingerprint icon onto it and it scrambles into its real SHA-256",
    "terms": "one window per term pops on its word (plain text, hashing, salt, rainbow tables, bcrypt, Argon2), cascading; Pia pops in from the taskbar; right-click > Tile: six tiles, each with a ?",
    "signup": "Surf browser: CREATE ACCOUNT form, `sunflower42` typed with the caret, Sign up clicked",
    "check": "Log in form above, the server below, a dashed network wire; the password travels down; the server ticks it",
    "plaintext": "users.db: user | password, rows type in (ana sunflower42, ben 123456, cy 123456, dee maple-tree-88); PLAIN TEXT label; Pia's bubble PLAIN TEXT.",
    "leak": "dump.exe (red title, magnifier) copies users.db; every password appears in red",
    "reuse": "Accounts: the same password; email, bank, shop and cloud padlocks spring open on their words",
    "hash1": "hash.exe: input -> SHA-256 -> a 64-character fingerprint; 'any input' cycles a / a whole sentence / sunflower42; ALWAYS 64 CHARACTERS (256 bits)",
    "hash2": "the same input typed again gives the same fingerprint (green tick)",
    "hash3": "sunflower43: the changed letter highlighted, the output scrambles to the new hash, changed characters in yellow, '62 of 64 characters changed'",
    "hash4": "a red reverse arrow with ?, then an error box: Can't run a hash backwards. There is no undo.",
    "login": "login -> hash.exe (typed now / stored) -> users.db row turns green, MATCH!, stamp NO PASSWORD STORED",
    "simple": "the cursor grabs Pia by the shoulder and drags her centre stage: SIMPLE. (thumbs up), then PROBLEM. (shrug); dragged back",
    "crack": "crack.exe: target hash; common.txt guesses hashed one by one (x, x, x ...) until sunflower42 matches: FOUND",
    "rainbow": "rainbow.tbl: a rainbow-striped precomputed hash -> password table scrolling; LOOKUP: INSTANT",
    "identical": "users.db with unsalted hashes: ben and cy share a hash (yellow); SAME HASH; ben = 123456, cy = 123456; 2 CRACKED",
    "saltgen": "Salt Generator: randomness dots, progress, 16 random bytes in hex; four users get four salts; salt + password -> hash",
    "saltcol": "users.db gains a salt column (NOT SECRET, stored next to the hash); ben and cy now have different hashes (ben != cy, both 123456)",
    "useless": "rainbow.tbl: 0 matches, USELESS; crack.exe works one account at a time",
    "fast": "Benchmark: SHA-256 speed bar to FAST, 'built for speed'",
    "gpu": "System Monitor: graphics card, GPU usage to 100 %, BILLIONS of guesses per second, a running count, 'Not Responding'",
    "falls": "crack.exe on salted hashes: ana, ben, cy FOUND one by one (dee's long password survives)",
    "slow": "two windows: fast (SHA-256, for files) and slow (on purpose, for passwords)",
    "wizard": "Slow Hash Setup wizard: welcome; step 1 choose bcrypt / scrypt / Argon2id (rounds counter); step 2 cost 10 -> 12; step 3 memory chips fill, 19 MiB, GPU cores starved, COST $$$",
    "result": "Done: one login check timed for real (scrypt N=2^17 r=8 p=1 on this PC); then System Monitor drops from BILLIONS to THOUSANDS, SLOW HASH ON",
    "butwait": "Pia dragged centre: BUT WAIT...",
    "forgot": "the login page; the cursor clicks Forgot password?",
    "mail": "Inbox: 'Your password is: sunflower42' stamped STORED READABLY and struck out; a second mail with a reset button, 'we can't see it either'",
    "strength": "YOUR SIDE. bubble; Password Check: sunflower42 found fast (red) vs orbit-plum-taxi-gravel-moss years (green)",
    "vault": "vault.exe password manager: four accounts, four different passwords; YOU REMEMBER: 1",
    "recap": "RECAP! centre; four minimised windows at the top; recap cards open from them one by one (plain text never / hashing / salt / slow hash), each strip icon ticks",
    "title2": "the title window again, now storing ana's real scrypt hash",
    "outro": "zoom-out: the monitor shrinks onto a dark dotted grid, 'the website' monitor slides in; the fingerprint travels between them while red magnifiers circle; 'no password kept'",
}


def main():
    rows = ["# Passwords 101 - script and screen", "", f"Voice: Kokoro `af_heart` at 1.27x, {VO['words']} words, {VO['duration']:.1f} s, {VO['wpm_overall']} WPM overall "
            f"({VO['wpm_speech']} while speaking). Captions: the line's words in 1-4 word chunks on the monitor's chin, the spoken word in a navy block.", "",
            "| line | time (s) | words | shot | on screen |", "|---|---|---|---|---|"]
    for l in VO["lines"]:
        sh = SH[0]
        for s in SH:
            if s["t0"] <= l["start"] + 0.05:
                sh = s
        rows.append(f"| {l['id']} | {l['start']:.2f}-{l['end']:.2f} | {l['text']} | {sh['name']} | {DESC.get(sh['name'], '')} |")
    rows += ["", "## Shots", "", "| shot | starts (s) | what it shows |", "|---|---|---|"]
    for s in SH:
        rows.append(f"| {s['name']} | {s['t0']:.2f} | {DESC.get(s['name'], '')} |")
    rows += ["", "## Retention devices", "",
             "- Frame 0 is a finished still (the title window with the password); the cursor moves at 0.25 s and the password scrambles at 1.0 s.",
             "- Open loop at 6 % ('what does a website actually keep?') over six windows with a ? each.",
             "- A visible change at least every 1.5 s: a window, a typed field, a stamp, a bubble, a cursor click (the cue list has 235 SFX).",
             "- Four centre-stage callouts with the music cut (SIMPLE, PROBLEM, BUT WAIT, RECAP) and two at the left (PLAIN TEXT, YOUR SIDE).",
             "- The payoff ladder: plain text -> hash -> guessing -> salt -> fast GPUs -> slow hashes -> how to tell -> your side -> recap.",
             "- Real values reward a pause: every hash, salt and the login timing on screen is computed, not typed in."]
    open(os.path.join(ROOT, "SCRIPT.md"), "w", encoding="utf-8").write("\n".join(rows) + "\n")
    print("SCRIPT.md", len(VO["lines"]), "lines")


if __name__ == "__main__":
    main()
