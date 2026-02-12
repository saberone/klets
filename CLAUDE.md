# CodeKlets CLI (klets)

## Project Overview
Terminal UI for the CodeKlets podcast. Built with Ink 6, React 19, Zustand, and got.

## Commands
- `npm run dev` — Launch TUI in dev mode (tsx)
- `npm run build` — Production build (tsup)
- `npm run typecheck` — Type check without emit
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run test` — Vitest

## Architecture
- **ESM only** — All files use ESM imports, `.js` extensions in imports
- **Ink 6 + React 19** — Functional components, hooks
- **Zustand** — Single store with navigation/player/cache slices
- **got** — HTTP client for API calls
- **Stack router** — No external router; Zustand navigation slice manages screen stack

## API
- Base URL: `https://codeklets.nl/api/v1`
- All endpoints return `{ data, meta? }` or `{ error, code }`
- Episodes identified by slug, persons by numeric id

## Conventions
- TypeScript strict mode
- Tabs for indentation, single quotes
- React components in PascalCase, files in kebab-case
- Hooks prefixed with `use-`
- Keep components focused — one screen per file
- Dutch UI strings (this is a Dutch podcast)

## Key Directories
- `src/api/` — API client and typed endpoint functions
- `src/store/` — Zustand store slices
- `src/screens/` — Full-page screen components
- `src/components/` — Reusable UI components
- `src/hooks/` — Custom React hooks
- `src/theme/` — Colors and formatters
