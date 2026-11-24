# FACTS — layer-stack sample "Just put it online"

Crumbwell (the bakery), crumbwell.shop, its orders, numbers on its dashboards (lookups, rows, visitors, 8 s page
load, 2,814 orders, 152 days live) and the café / blogger / TV events are **fictional story elements**. Every
general engineering statement in the narration or on screen is listed below with a source. Checked 2026-10-29.

| # | statement (where) | value / claim | source | checked |
|---|---|---|---|---|
| 1 | IP shown for the server (c01, c02, c03, c20) | `203.0.113.7` is in 203.0.113.0/24 (TEST-NET-3), reserved for documentation, so it points at no real server; the "wrong digit" `203.0.118.7` is a made-up address in the story | RFC 5737, https://datatracker.ietf.org/doc/html/rfc5737 | 2026-10-29 |
| 2 | "A DNS record that turns crumbwell dot shop into your server's address" (c03) | an A record returns a 32-bit IPv4 address and maps a hostname to the host's IP | Wikipedia, List of DNS record types, https://en.wikipedia.org/wiki/List_of_DNS_record_types | 2026-10-29 |
| 3 | TTL 3600 on the DNS card (c03) | TTL = seconds a caching resolver keeps a record before fetching it again (3600 = 1 h; a display value) | Wikipedia, Time to live (DNS), https://en.wikipedia.org/wiki/Time_to_live | 2026-10-29 |
| 4 | "two people order the last loaf at the same second … confirms both"; "two saves at once trample each other" (c05, c06) | concurrent read-modify-write / check-then-act updates on shared state can lose an update or both succeed (race condition) | Wikipedia, Race condition, https://en.wikipedia.org/wiki/Race_condition | 2026-10-29 |
| 5 | "Every order is a transaction … All of it, or none of it" (c07) | atomicity: a transaction's operations either all take effect or none do | Wikipedia, Atomicity (database systems), https://en.wikipedia.org/wiki/Atomicity_(database_systems) | 2026-10-29 |
| 6 | "three copies, two kinds of storage, one in another city" (c10) | the 3-2-1 rule: at least three copies, on two different types of media, one copy offsite | Wikipedia, Backup (3-2-1 rule), https://en.wikipedia.org/wiki/Backup | 2026-10-29 |
| 7 | "the browser says not secure, because plain HTTP crosses the room as readable text" (c11) | HTTP is not encrypted and is open to eavesdropping; Google announced in Feb 2018 that Chrome would mark HTTP sites "Not Secure" after July 2018 | Wikipedia, HTTPS, https://en.wikipedia.org/wiki/HTTPS | 2026-10-29 |
| 8 | "A certificate proves the site is yours, everything gets encrypted" (c12) | HTTPS encrypts traffic; authentication uses server certificates signed by a trusted third party (certificate authority) | Wikipedia, HTTPS, https://en.wikipedia.org/wiki/HTTPS | 2026-10-29 |
| 9 | "copies of your images on servers close to every customer" (c14) | a CDN stores duplicate copies on geographically distributed servers and serves each request from the server closest to the user | MDN Glossary, CDN, https://developer.mozilla.org/en-US/docs/Glossary/CDN | 2026-10-29 |
| 10 | "503 SERVICE UNAVAILABLE" when the server melts (c15) | 503 = the server is temporarily unable to handle the request, typically down for maintenance or overloaded | MDN, 503 Service Unavailable, https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503 | 2026-10-29 |
| 11 | "a load balancer that spreads visitors over three servers and skips any that's sick" (c16) | load balancers spread requests across backend servers and poll server health, removing failed servers from the pool | Wikipedia, Load balancing (computing), https://en.wikipedia.org/wiki/Load_balancing_(computing) | 2026-10-29 |
| 12 | "a cache for pages that never change" (c16) | general caching practice: serve stored copies of unchanged content instead of rebuilding them (no number claimed) | same as 9 (CDN/caching definition) | 2026-10-29 |
| 13 | "An uptime check every minute … an alert that wakes someone up" (c18) | website monitoring checks availability at set intervals (commonly from once per hour to once per minute) and notifies administrators by email, SMS, phone or pager | Wikipedia, Website monitoring, https://en.wikipedia.org/wiki/Website_monitoring | 2026-10-29 |
| 14 | "This site can't be reached" + `ERR_CONNECTION_TIMED_OUT` (c20) | Chrome's page-loading error ERR_CONNECTION_TIMED_OUT = "The page took too long to connect"; Chrome help lists "A site can't be reached" among its connection errors. A wrong IP in an A record sends visitors to an address that does not answer, which ends in this timeout | Google Chrome Help, Fix page-loading errors, https://support.google.com/chrome/answer/95669 | 2026-10-29 |

Not claimed anywhere: certificate lifetimes, DNS propagation times, prices, provider names, real companies or people.
Sources that refused automated access (Cloudflare Learning, 403) were not used and not worked around.
