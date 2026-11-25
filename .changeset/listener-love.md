---
"klets": minor
---

Add resume listening, listening history, share links, transcript search, CLI subcommands and the new brand colours
- Home shows "Verder luisteren" for the latest unfinished episode; new "Geschiedenis" screen (enter open, `p` resume, `x` remove)
- `y` copies a share link to the episode, the selected chapter or transcript segment (with `?t=`), with an OSC 52 fallback
- Search inside a transcript with `/`, `n`/`N`, a match counter and highlighting (case- and accent-insensitive); text inputs no longer trigger global keys
- New commands: `klets play <slug|latest>`, `klets search <query> [--json]` and `klets transcript <slug|latest> [--vtt | --json]`
- Rebrand: cyan with coral (#f4a6b8) replaces purple, including the banner wave
- Follow API changes: TRAILER/BONUS badges, episodes without numbers, duration or audio no longer break, links show the person, topic detail works again; favorites.json/history.json from older versions keep loading
