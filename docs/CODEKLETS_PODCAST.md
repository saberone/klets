# CodeKlets Podcast Reference

## What is CodeKlets?

**CodeKlets** is a Dutch-language podcast for software developers. Every two weeks, the hosts invite expert guests to discuss the latest trends, tools, and techniques in software development — from front-end to back-end, from AI to DevOps.

- **Full name:** CodeKlets - Nederlandse Podcast voor Developers
- **Language:** Dutch (nl-NL)
- **Frequency:** Biweekly (every two weeks)
- **Website:** https://codeklets.nl
- **RSS Feed:** https://codeklets.nl/feed/xml

## Tagline & Mission

**Tagline:** _Jouw tweewekelijkse dosis developer kennis_

**Short description:** De podcast voor Nederlandse developers. Elke twee weken de nieuwste trends, tools en technieken in softwareontwikkeling.

**Mission:** CodeKlets is ontstaan uit de passie voor softwareontwikkeling en het delen van kennis. We geloven dat de beste manier om te leren, is door te luisteren naar ervaringen van anderen en praktische inzichten te delen.

## Origin Story

The podcast started when Kishen & Saber asked themselves: "Why are all the good dev podcasts in English?" So they decided to create a Dutch-language podcast about software development — one that's informative but where you don't need a terminal open to follow along. By covering various sub-categories, the podcast gives listeners a peek into different specializations, so a seasoned Java developer can finally understand why their Rust colleague gets so enthusiastic about ownership and borrowing, or why frontend devs cry when you say "JavaScript fatigue."

## Hosts

| Name | Role | Notes |
|---|---|---|
| Kishen Simbhoedatpanday | Co-founder & host | Original co-creator |
| Saber Karmous | Co-founder & host | Original co-creator |
| Pauline Vos | Host | Asked after episode 1, joined after returning from abroad |
| Bernard Kroes | Host | Joined as the team grew |
| Johnny Dongelmans | Host | Joined as the team grew |
| Wouter Dijks | Co-host | Brings the fresh perspective of a beginning developer |
| Ivo Toby | Host | Newest addition to the team |

Contact: `{firstname}@codeklets.nl`

## Target Audience

- Dutch-speaking software developers at all experience levels
- Web developers (front-end and back-end)
- DevOps engineers
- AI/ML practitioners
- Tech leads and engineering managers
- Beginning developers looking to learn

## Content Pillars

1. **Praktische Code** — Concrete examples and best practices you can apply directly in your projects
2. **Expert Gasten** — Interviews with experienced developers and tech leaders from the Dutch tech scene
3. **Laatste Trends** — Stay up-to-date with the newest developments in web development and software engineering
4. **Career Tips** — Advice on career development, job searching, and growing as a developer

## Episode Structure

Each episode can contain:

- **Title & introduction** — Short intro text (max 500 chars)
- **Show notes** — Full markdown content with detailed notes
- **Chapters** — Timestamped markers for navigation, with optional resource URLs
- **Learning points** — Structured educational takeaways
- **Links/tips** — Per-person recommendations and resources (each host shares their picks)
- **Tags/topics** — Categorization (e.g., AI, TypeScript, DevOps, Career)
- **Transcript** — Full transcript with speaker names, timestamps, and confidence scores
- **Featured moments** — Curated highlights from transcripts

Episodes are organized by **seasons** and **episode numbers**.

## Distribution Platforms

| Platform | URL |
|---|---|
| Apple Podcasts | https://podcasts.apple.com/us/podcast/codeklets/id1478629613?uo=4 |
| Spotify | https://open.spotify.com/show/0Sf8c3aGZmtGiNUEwgDTSu |
| Overcast | https://overcast.fm/itunes1478629613/codeklets |
| Pocket Casts | https://pca.st/pjOKXK |
| YouTube | (available) |
| Amazon Music | (available) |
| Castro | (available) |
| Podcast Addict | (available) |
| RSS | https://codeklets.nl/feed/xml |

## Social Media

| Platform | URL |
|---|---|
| BlueSky | https://bsky.app/profile/codeklets.nl |
| LinkedIn | https://linkedin.com/company/codeklets |
| GitHub | https://github.com/codeklets |
| Slack | https://join.slack.com/t/codeklets/... |

## Branding

### Colors

| Name | Hex | Usage |
|---|---|---|
| Primary Cyan | `#00f0ff` | Main accent, links, highlights |
| Secondary Purple | `#bf00ff` | Secondary accent, gradients |
| Background | `#0a0a0f` | Dark background |
| Text Primary | `#e4e4e7` | Main text |
| Text Muted | `#a1a1aa` | Secondary text |
| Text Subtle | `#71717a` | Tertiary text |
| Border | `#27272a` | Borders, dividers |

### Fonts

- **Display:** Unbounded (headings, branding)
- **Code/Mono:** JetBrains Mono (code, terminal UI)

### Design Theme

Terminal/developer aesthetic — dark mode with neon cyan accents, code symbols (`{ } < /> // => []`), monospace fonts, command-line style elements, animated elements, grid pattern backgrounds.

### Logo

Microphone icon in cyan (`#00f0ff`) on a square background with glow effect.

## Public API (v1)

Base URL: `https://codeklets.nl/api/v1`

All endpoints are public, read-only, rate-limited (60 req/min, 10/min for search), and cached.

| Endpoint | Description | Cache |
|---|---|---|
| `GET /episodes` | Paginated episode list (filter by season, tag, search; sort by newest/oldest/alpha/longest/shortest) | 5 min |
| `GET /episodes/:slug` | Episode detail with chapters, persons, links, learning points, tags | 10 min |
| `GET /episodes/:slug/transcript` | Full transcript segments with timestamps and speakers | 10 min |
| `GET /topics` | All topics with episode counts | 1 hr |
| `GET /topics/:slug` | Topic detail with paginated episodes | 10 min |
| `GET /persons` | All persons with social links, images, episode counts | 1 hr |
| `GET /persons/:id` | Person detail with paginated episodes | 10 min |
| `GET /search?q=...` | Search episodes and transcripts (min 2 chars, type=episodes/transcripts/all) | 1 min |
| `GET /seasons` | List of available seasons | 24 hr |

### Response Formats

**Paginated:**
```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3, "hasMore": true }
}
```

**Single resource:**
```json
{ "data": { ... } }
```

**Error:**
```json
{ "error": "Not found", "code": "NOT_FOUND" }
```

### Episode List Query Params

| Param | Description |
|---|---|
| `page` | Page number (default: 1) |
| `limit` | Items per page (max 50, default: 20) |
| `season` | Filter by season number |
| `search` | Search in title/intro |
| `tag` | Comma-separated topic slugs (AND logic, max 10) |
| `sort` | `newest` (default), `oldest`, `alpha`, `longest`, `shortest` |

### Key Data Rules

- Episodes identified by **slug** (never numeric ID)
- Persons identified by numeric **id**
- Dates as ISO 8601 strings
- `null` for missing optional fields
- Person social URLs in a `socialLinks` object
- `artworkUrl` for episode/person images
- `hasTranscript` boolean on episode list items

## Friendly Podcast Network

CodeKlets is part of a Dutch tech podcast network:

- Met Nerds om Tafel — https://www.metnerdsomtafel.nl/
- HazCast — https://www.hazcast.nl/
- De Heetste Podcast — https://deheetste.nl/
- Beginnen met Bitcoin — https://beginnenmetbitcoin.com/
- Signaalwaarde — https://signaalwaarde.nl/
- AppForce1 — https://appforce1.net/podcast/
- Geldvrienden — https://geldvrienden.nl/podcast
