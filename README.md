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

## Installation

```bash
npm install -g klets
```

**Requirements:** Node.js >= 18

## Usage

```bash
klets              # Launch the TUI
klets --help       # Show usage info
klets --version    # Print version
```

## Features

- Browse episodes with season filtering and sorting
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
| `p` | Play / stop audio |
| `<` / `>` | Seek -15s / +15s (mpv only) |
| `[` / `]` | Previous / next chapter |
| `t` | Open transcript |
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
