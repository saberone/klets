# klets

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
