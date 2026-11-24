"""posts/raw/*.json (syndication) + posts/capture_log.json + posts/review.json -> posts/posts.json

One record per post, in the order of the link list:
  n, url, id, handle, name, verified, created_at (UTC ISO) + created_et (America/New_York, as the embed prints it),
  text (exact, as the API returns it, t.co media links included), display_text (the visible part: display_text_range),
  quoted {handle, name, text} | null, reply_to handle | null, media [{type, url, poster}], likes_at_capture,
  screenshot (png in posts/), screenshot_px [w, h], words_on_screen (post + quoted text, the reading-time count),
  status ("used" | "excluded" | "unreachable"), review {tier, note}

review.json (written by hand after reading every post): {"<n>": {"tier": "A|B|C|ok", "note": "...", "use": true|false}}

usage: python -X utf8 -I tools/posts_json.py [project_dir]
"""
import datetime as dt
import glob
import json
import os
import re
import struct
import sys

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "posts")
log = {r["n"]: r for r in json.load(open(os.path.join(P, "capture_log.json"), encoding="utf-8"))}
review = json.load(open(os.path.join(P, "review.json"), encoding="utf-8")) if os.path.exists(os.path.join(P, "review.json")) else {}


def png_size(f):
    with open(f, "rb") as fh:
        h = fh.read(24)
    return list(struct.unpack(">II", h[16:24]))


def et(iso):
    t = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    # US Eastern: EDT until the first Sunday of November 02:00, EST after (enough for a timestamp label)
    y = t.year
    nov1 = dt.datetime(y, 11, 1, tzinfo=dt.timezone.utc)
    first_sun_nov = nov1 + dt.timedelta(days=(6 - nov1.weekday()) % 7)
    mar1 = dt.datetime(y, 3, 1, tzinfo=dt.timezone.utc)
    second_sun_mar = mar1 + dt.timedelta(days=(6 - mar1.weekday()) % 7 + 7)
    dst = second_sun_mar + dt.timedelta(hours=7) <= t < first_sun_nov + dt.timedelta(hours=6)
    off = -4 if dst else -5
    loc = t + dt.timedelta(hours=off)
    return loc.strftime("%Y-%m-%d %I:%M %p ") + ("EDT" if dst else "EST")


def u16slice(s, a, b):
    """display_text_range counts UTF-16 code units (an emoji is 2), not Python code points"""
    e = s.encode("utf-16-le")
    return e[2 * a:2 * b].decode("utf-16-le", errors="ignore")


def words(s):
    s = re.sub(r"https?://\S+", "", s or "")
    return len(re.findall(r"[A-Za-z0-9$%'’]+", s))


out = []
for f in sorted(glob.glob(os.path.join(P, "raw", "*.json"))):
    n = int(os.path.basename(f).split("_")[0])
    d = json.load(open(f, encoding="utf-8"))
    lg = log.get(n, {})
    rv = review.get(str(n), {})
    if d.get("__typename") != "Tweet" or not lg.get("ok"):
        out.append({"n": n, "url": lg.get("url"), "status": "unreachable", "typename": d.get("__typename"), "error": lg.get("error")})
        continue
    u = d["user"]
    a, b = d.get("display_text_range", [0, len(d["text"])])
    q = d.get("quoted_tweet")
    shot = os.path.join(P, lg["png"])
    rec = {
        "n": n,
        "url": f"https://x.com/{u['screen_name']}/status/{d['id_str']}",
        "id": d["id_str"],
        "handle": "@" + u["screen_name"],
        "name": u["name"],
        "verified": bool(u.get("is_blue_verified") or u.get("verified")),
        "created_at": d["created_at"],
        "created_et": et(d["created_at"]),
        "text": d["text"],
        "display_text": u16slice(d["text"], a, b) if b else d["text"],
        "quoted": {"handle": "@" + q["user"]["screen_name"], "name": q["user"]["name"], "text": q["text"],
                   "media": [m.get("type") for m in q.get("mediaDetails", [])]} if q else None,
        "reply_to": d.get("in_reply_to_screen_name"),
        "media": [{"type": m.get("type"), "url": m.get("media_url_https"),
                   "video_poster_shown": m.get("type") == "video"} for m in d.get("mediaDetails", [])],
        "likes_at_capture": d.get("favorite_count"),
        "replies_at_capture": d.get("conversation_count"),
        "edited": bool(d.get("isEdited")),
        "screenshot": lg["png"],
        "screenshot_px": png_size(shot),
        "words_on_screen": words(u16slice(d["text"], a, b) if b else d["text"]) + (words(q["text"]) if q else 0),
        "status": "used" if rv.get("use", True) else "excluded",
        "review": {"tier": rv.get("tier", "ok"), "note": rv.get("note", "")},
    }
    out.append(rec)
json.dump({"captured": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "method": "public embed platform.twitter.com/embed/Tweet.html (dark, en, America/New_York, 440 css px at DPR 3) "
                     "+ cdn.syndication.twimg.com/tweet-result JSON; no login, nothing retyped",
           "posts": out}, open(os.path.join(P, "posts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(out)} posts -> posts/posts.json; used {sum(1 for r in out if r.get('status') == 'used')}, "
      f"excluded {sum(1 for r in out if r.get('status') == 'excluded')}, unreachable {sum(1 for r in out if r.get('status') == 'unreachable')}")
