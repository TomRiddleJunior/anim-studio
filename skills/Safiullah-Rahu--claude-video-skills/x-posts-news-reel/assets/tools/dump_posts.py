"""Print every captured post for the content review: handle, name, time, likes, exact text, media, quoted post, reply.
Read all of it (and look at every screenshot with media) before writing posts/review.json.

usage: python -X utf8 -I tools/dump_posts.py posts/raw
"""
import json, glob, os, sys
for f in sorted(glob.glob(os.path.join(sys.argv[1], "*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    u = d.get("user", {})
    media = [(m.get("type"), m.get("media_url_https")) for m in d.get("mediaDetails", [])]
    q = d.get("quoted_tweet")
    print(os.path.basename(f), "|", d.get("__typename"), "|", u.get("screen_name"), "|", u.get("name"), "|", d.get("created_at"), "| likes", d.get("favorite_count"))
    print("   TEXT:", repr(d.get("text")))
    if media: print("   MEDIA:", media)
    if d.get("card"): print("   CARD:", d["card"].get("name"))
    if q: print("   QUOTE:", q.get("user", {}).get("screen_name"), repr(q.get("text")), [(m.get("type")) for m in q.get("mediaDetails", [])])
    if d.get("parent"): print("   REPLY-TO:", d["parent"].get("user", {}).get("screen_name"), repr(d["parent"].get("text"))[:200])
    if d.get("in_reply_to_screen_name"): print("   in_reply_to:", d.get("in_reply_to_screen_name"))
