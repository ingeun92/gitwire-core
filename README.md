# GitWire Core

Backend API hub for the GitWire platform. Collects GitHub trending data, manages Supabase persistence, and serves REST endpoints consumed by both the CLI and Web frontend.

## Architecture

```
GitWire Platform
================

                   +------------------+
                   |   GitHub API     |
                   +--------+---------+
                            |
                   Vercel Cron (hourly)
                            |
                            v
              +-------------+-------------+
              |       gitwire-core        |
              |    (Next.js API Routes)   |
              |                           |
              |  /api/cron/fetch-github   |
              |  /api/v1/trends           |
              |  /api/v1/insights         |
              +---+---------+----+--------+
                  |         |    |
                  v         |    v
          +-------+--+     |  +-+----------+
          | Supabase |     |  | gitwire-web|
          |  (PgSQL) |     |  | (Frontend) |
          +----------+     |  +------------+
                           v
                    +------+------+
                    | gitwire-cli |
                    |  (Terminal) |
                    +-------------+
```

## Tech Stack

- **Runtime:** Next.js 15 (App Router - API Routes only)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Data Pipeline:** Vercel Cron

## Getting Started

### Prerequisites

- Node.js >= 18
- A [Supabase](https://supabase.com) project

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `CRON_SECRET` | Yes | Secret token for cron endpoint auth |
| `GITHUB_TOKEN` | No | GitHub personal access token (higher rate limits) |

### Database Setup

Run the migration SQL against your Supabase project:

```bash
# Via Supabase CLI
supabase db push

# Or manually execute the SQL in Supabase Dashboard
# File: supabase/migrations/001_initial_schema.sql
```

### Development

```bash
npm run dev
```

The API server starts at `http://localhost:3000`.

## API Reference

### GET `/api/v1/trends`

Returns top trending repositories by star growth.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `window` | `24h` \| `1w` \| `1m` | `24h` | Time window for star growth |

**Response:**

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
        "description": "A description",
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

### GET `/api/v1/insights`

Returns published investment insights.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `10` | Number of insights to return (1-100) |

**Response:**

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
        "total_forks": 200,
        "updated_at": "2026-03-17T00:00:00Z"
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

## Database Schema

| Table | Description |
|-------|-------------|
| `repositories` | GitHub repository metadata (URL, name, stars, forks) |
| `trend_metrics` | Star growth snapshots (24h, 1w, 1m) |
| `investments` | Funding round data linked to repositories |
| `insights` | Markdown editorial content with publish status |

## Deployment

Deploy to Vercel with one click or via CLI:

```bash
vercel
```

Set environment variables in the Vercel dashboard. The cron job is configured in `vercel.json` to run hourly.

## License

[MIT](LICENSE)
