# klets

## 0.4.1

### Patch Changes

- 3dc565d: Fix person detail screen and link opening
  - Fix person detail API response parsing (nested `data.person` + `data.episodes` structure)
  - Show person name, job title, tagline, and social links on person detail screen
  - Add tab switching (h/l) between Links and Afleveringen sections, defaulting to Links
  - Fix `openUrl` to use `spawn` with detached process instead of `exec`
  - Hide misleading "enter open" hint in footer on detail screens

## 0.4.0

### Minor Changes

- 58f6572: Add transcript search results, open links in browser, help screen, tag browsing, playback speed control, progress bar, global playback controls, listen history with resume, favorites, and episode queue

### Patch Changes

- 58f6572: Fix update check cache bypassing new releases

  Skip the cache when no update was previously found, so new releases are discovered immediately instead of waiting for the 24-hour TTL to expire.

## 0.3.0

### Minor Changes

- 26362ce: Add animated banner, Konami easter egg, and startup chiptune
  - Home banner now cycles through a baby blue ↔ pink gradient wave animation
  - Typing ↑↑↓↓←→←→ba on the home screen activates party mode (fast rainbow cycling + secret message)
  - 80's-style chiptune jingle plays on startup (pulse wave synth, requires audio backend)

### Patch Changes

- 196b456: Add matrix rain effect to Konami easter egg
  - Falling katakana/digit characters animate between the banner and menu during party mode
  - Bright cyan head with fading green trail for classic Matrix look
  - Adapts to terminal size automatically

## 0.2.0

### Minor Changes

- f3424d3: Add update check and auto-update: non-blocking startup check against npm registry with 24h cache, update banner, and one-key auto-update with `u`

## 0.1.3

### Patch Changes

- 7926e54: Fix transcript tracking lag by reducing poll intervals from 1s to 300ms and returning sub-second precision from player position

## 0.1.2

### Patch Changes

- 0513889: Add changesets for automated versioning and publishing, fix CI lint rule error, reorder CI steps to build before test, and drop Node 18 support

## 0.1.1

### Patch Changes

- Upgrade dependencies: ink 6, react 19, vitest 4, typescript 5.9
- Switch API base URL to production (codeklets.nl)
- Add npm trusted publishing workflow with OIDC provenance
- Add gradient effect to splash screen logo

## 0.1.0

### Minor Changes

- Initial release: browse episodes, topics, guests & listen from the terminal
- Audio player with mpv IPC, seeking, and transport controls
- Transcript follow-playback, seek-to-segment, and selection indicator
- Scrollable lists with j/k navigation, h/l pagination
- CLI flags, error boundary, empty states, resize handling
