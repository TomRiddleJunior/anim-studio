# Adapted from mexicat/pdoom-video (MIT); see LICENSE-pdoom-video.
"""Display token -> spoken spelling(s) for CTC alignment.

Each display token (a lyric line split on spaces) maps to one or more sub-words made of plain letters
(a-z and inner apostrophes). Multi-part tokens (acronyms, numbers, hyphenated compounds) get per-part
timings in lyrics.json ("syl"), which the renderer uses for letter-by-letter reveals.

Rules: project overrides (lyrics/pron.json) first; digits -> English number words; ALL-CAPS tokens of
2-3 letters, or with no vowel, are spelled letter by letter (GPU -> gee pee you, OK -> oh kay); a lone
letter other than I / a is spelled (E -> ee); accents are folded (café -> cafe); anything else is split on
non-letters (P(doom) -> p doom -> pee doom, Post-Chinchilla -> post chinchilla).
"""
import re
import unicodedata

LETTER = dict(a="ay", b="bee", c="see", d="dee", e="ee", f="eff", g="gee", h="aitch", i="i", j="jay", k="kay", l="el",
              m="em", n="en", o="oh", p="pee", q="cue", r="are", s="ess", t="tee", u="you", v="vee", w="double you",
              x="ex", y="why", z="zee")
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def num_words(n: int) -> list[str]:
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if 1100 <= n <= 1999 or 2010 <= n <= 2099:  # years: nineteen ninety-nine, twenty twenty-six
        hi, lo = divmod(n, 100)
        return num_words(hi) + (["hundred"] if lo == 0 else (["oh"] + num_words(lo) if lo < 10 else num_words(lo)))
    if n < 1000:
        h, r = divmod(n, 100)
        return [ONES[h], "hundred"] + (num_words(r) if r else [])
    if n < 1_000_000:
        k, r = divmod(n, 1000)
        return num_words(k) + ["thousand"] + (num_words(r) if r else [])
    return [ONES[int(d)] for d in str(n)]


def fold(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")


def pron(token: str, overrides: dict | None = None) -> list[str]:
    ov = overrides or {}
    if token in ov:
        return ov[token].lower().split()
    core = token.strip(" .,;:!?\"“”‘’()[]{}—–-…*")
    if core in ov:
        return ov[core].lower().split()
    core = core.replace("’", "'").replace("‘", "'")
    core = re.sub(r"([a-z])([A-Z]{2,})\b", r"\1 \2", core)  # ChatGPT -> Chat GPT
    out: list[str] = []
    for part in re.split(r"[\s\-–—/]+", core):
        if not part:
            continue
        bare = re.sub(r"[^\w']", "", part)
        if re.fullmatch(r"\d+", bare):
            out += num_words(int(bare))
            continue
        m = re.fullmatch(r"(\d+)(s|st|nd|rd|th)", bare.lower())
        if m:
            out += num_words(int(m.group(1)))
            continue
        letters = re.sub(r"[^A-Za-z]", "", fold(bare))
        if letters and letters.isupper() and (len(letters) <= 3 or not re.search(r"[AEIOUY]", letters)) and len(letters) > 1:
            out += [w for c in letters.lower() for w in LETTER[c].split()]
            continue
        if len(letters) == 1 and letters.lower() not in ("i", "a") and bare.isalpha():
            out += LETTER[letters.lower()].split()
            continue
        w = fold(part).lower()
        w = re.sub(r"[^a-z' ]", " ", w)
        # pieces split off by punctuation: a lone letter is spoken as its name (P(doom) -> pee doom)
        for p in (q.strip("'") for q in w.split()):
            if p:
                out += LETTER[p].split() if len(p) == 1 and p not in ("i", "a", "o") else [p]
    return out or [re.sub(r"[^a-z]", "", fold(token).lower()) or "a"]


def units(token: str, overrides: dict | None = None) -> list[str]:
    """Alignment sub-words of a token (each gets its own timing)."""
    return pron(token, overrides)


if __name__ == "__main__":
    for t in ["AGI", "P(doom)", "ChatGPT,", "FOOM", "NVDA", "E", "MLP,", "RLHF", "'cause", "Post-Chinchilla,", "1999", "42", "OK", "café", "I", "a", "Neumann's", "1e30"]:
        print(f"{t:18} -> {' | '.join(pron(t))}")
