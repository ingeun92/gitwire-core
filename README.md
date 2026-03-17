<h1 align="center">GitWire Core</h1>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel" alt="Vercel" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" /></a>
</p>

<p align="center">
  Backend API hub for the GitWire platform.<br/>
  Collects GitHub trending data, manages Supabase persistence, and serves REST endpoints<br/>
  consumed by both the <a href="https://github.com/ingeun92/gitwire-cli">CLI</a> and <a href="https://github.com/ingeun92/gitwire-web">Web</a> frontend.
</p>

---

## Architecture

```
                        +------------------+
                        |   GitHub API     |
                        +--------+---------+
                                 |
                        Vercel Cron (hourly)
                                 |
                                 v
               +-----------------+-----------------+
               |          gitwire-core             |
               |       (Next.js API Routes)        |
               |                                   |
               |   /api/cron/fetch-github          |
               |   /api/v1/trends                  |
               |   /api/v1/insights                |
               +--------+----------+-------+-------+
                        |          |       |
                        v          |       v
                +-------+---+     |   +---+-----------+
                |  Supabase |     |   |  gitwire-web  |
                |  (PgSQL)  |     |   |  (Frontend)   |
                +-----------+     |   +---------------+
                                  v
                           +------+------+
                           | gitwire-cli |
                           |  (Terminal) |
                           +-------------+
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Next.js 15 (App Router, API Routes only) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Data Pipeline | Vercel Cron |

## Getting Started

### Prerequisites

- Node.js >= 18
- A [Supabase](https://supabase.com) project

### Install & Run

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev                         # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `CRON_SECRET` | Yes | Secret token for cron endpoint auth |
| `GITHUB_TOKEN` | No | GitHub PAT for higher rate limits |

### Database Setup

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Run SQL manually in Supabase Dashboard
# File: supabase/migrations/001_initial_schema.sql
```

## API Reference

### `GET /api/v1/trends`

Returns top trending repositories by star growth.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `window` | `24h` \| `1w` \| `1m` | `24h` | Time window for star growth |

<details>
<summary><b>Response Example</b></summary>

```json
{
  "data": [
    {
      "id": "uuid",
      "snapshot_time": "2026-03-17T00:00:00Z",
      "stars_24h": 150,
      "stars_1w": 800,
      "stars_1m": 3200,
      "repository": {
        "id": "uuid",
        "github_url": "https://github.com/owner/repo",
        "name": "repo-name",
        "description": "A cool project",
        "language": "TypeScript",
        "total_stars": 12000,
        "total_forks": 450,
        "updated_at": "2026-03-17T00:00:00Z"
      }
    }
  ],
  "window": "24h"
}
```

</details>

### `GET /api/v1/insights`

Returns published investment insights.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | `10` | Number of insights to return (1-100) |

<details>
<summary><b>Response Example</b></summary>

```json
{
  "data": [
    {
      "id": "uuid",
      "content": "# Markdown insight content...",
      "is_published": true,
      "created_at": "2026-03-17T00:00:00Z",
      "repository": {
        "id": "uuid",
        "name": "repo-name",
        "github_url": "https://github.com/owner/repo",
        "language": "Python",
        "total_stars": 5000,
        "total_forks": 200
      },
      "investments": [
        {
          "id": "uuid",
          "round_type": "Series A",
          "investor_name": "Sequoia Capital",
          "news_url": "https://example.com/news"
        }
      ]
    }
  ],
  "total": 42
}
```

</details>

## Database Schema

| Table | Description |
|-------|-------------|
| `repositories` | GitHub repository metadata (URL, name, stars, forks) |
| `trend_metrics` | Star growth snapshots (24h, 1w, 1m) per repository |
| `investments` | Funding round data linked to repositories |
| `insights` | Markdown editorial content with publish status |

## Deployment

```bash
vercel
```

Set environment variables in the Vercel dashboard. The cron job is auto-configured via `vercel.json` to run hourly.

## Related

- [`gitwire-cli`](https://github.com/ingeun92/gitwire-cli) - Terminal interface for developers & AI agents
- [`gitwire-web`](https://github.com/ingeun92/gitwire-web) - Cyberpunk media dashboard

## License

[MIT](LICENSE)
