# klets

Terminal UI for the [CodeKlets](https://codeklets.nl) podcast. Browse episodes, topics, guests, and listen — all from the terminal. Built with Ink, React, and Zustand.

## Screenshots

### Home

<img src="assets/home.gif" alt="Home screen with CodeKlets banner and menu" width="600">

### Episodes

<img src="assets/episodes.gif" alt="Episodes list with filtering and sorting" width="600">

### Episode detail

<img src="assets/episode-detail.gif" alt="Episode detail with tabbed sections" width="600">

### Search

<img src="assets/search.gif" alt="Full-text search with results" width="600">

### Transcript

<img src="assets/transcript.gif" alt="Episode transcript with speaker segments" width="600">

## Installation

```bash
npm install -g klets
```

**Requirements:** Node.js >= 20

## Usage

```bash
klets                                  # Launch the TUI
klets play <slug|latest>               # Launch the TUI and play an episode (resumes where you left off)
klets search <query> [--json]          # Search episodes and transcripts
klets transcript <slug|latest>         # Print a transcript as plain text
klets transcript <slug|latest> --vtt   # ...as WebVTT subtitles
klets transcript <slug|latest> --json  # ...as JSON
klets --help                           # Show usage info
klets --version                        # Print version
```

The print commands (`search`, `transcript`) are pipe-friendly:

- `--json` prints only the API's `data` value as pretty JSON, e.g. `klets search react --json | jq '.episodes[].title'`.
- No colour when stdout is not a terminal or `NO_COLOR` is set.
- Errors go to stderr (in Dutch). Exit codes: `0` success, `1` runtime/API error (not found, network), `2` usage error.
- Plain text transcripts are one line per segment: `[h:mm:ss] Speaker: text`.

## Features

- Browse episodes with season filtering and sorting (trailers and bonus episodes are marked)
- Resume where you left off ("Verder luisteren" on Home) and browse your listening history ("Geschiedenis")
- Copy share links to an episode, chapter or transcript segment (`?t=` timestamps)
- Search inside a transcript, vim style (`/`, `n`, `N`), case- and accent-insensitive
- Explore topics and guest profiles
- Full-text search across episodes and transcripts
- Audio playback with chapter navigation
- Real-time transcript following during playback
- Responsive scrollable lists

## Keybindings

| Key | Action |
|---|---|
| `j` / `k` | Navigate up / down |
| `enter` | Open item |
| `esc` | Go back |
| `q` | Quit |
| `h` / `l` | Previous / next page or tab |
| `f` | Filter by season |
| `s` | Cycle sort order |
| `p` | Play / stop audio (resume in history) |
| `<` / `>` | Seek -15s / +15s (mpv only) |
| `[` / `]` | Previous / next chapter |
| `t` | Open transcript |
| `y` | Copy share link (episode; chapter on the chapters tab; segment in a transcript) |
| `/` | Search in transcript (`enter` jump to first match) |
| `n` / `N` | Next / previous match (wraps around) |
| `esc` | Clear transcript search (a second `esc` goes back) |
| `x` | Remove entry from history |
| `b` | Toggle favourite |
| `a` | Add to queue |
| `r` | Retry on error |

## Audio backends

| Backend | Seek | Position tracking | Platform |
|---|---|---|---|
| mpv | Yes | Yes | All |
| ffplay | No | No | All |
| afplay | No | No | macOS |

Install [mpv](https://mpv.io) for the best experience.

## Development

```bash
npm run dev        # Launch in dev mode (tsx)
npm run build      # Production build (tsup)
npm run typecheck  # Type check
npm run lint       # ESLint
npm run format     # Prettier
npm test           # Run tests
```

## License

MIT
