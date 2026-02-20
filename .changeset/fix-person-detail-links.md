---
"klets": patch
---

Fix person detail screen and link opening

- Fix person detail API response parsing (nested `data.person` + `data.episodes` structure)
- Show person name, job title, tagline, and social links on person detail screen
- Add tab switching (h/l) between Links and Afleveringen sections, defaulting to Links
- Fix `openUrl` to use `spawn` with detached process instead of `exec`
- Hide misleading "enter open" hint in footer on detail screens
