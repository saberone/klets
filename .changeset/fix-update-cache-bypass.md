---
"klets": patch
---

Fix update check cache bypassing new releases

Skip the cache when no update was previously found, so new releases are discovered immediately instead of waiting for the 24-hour TTL to expire.
