# Larkin Vanity Mirror

A personal analytics dashboard aggregating metrics from multiple data sources into a single unified view.

## Mission

Create an internal dashboard providing near real-time visibility into personal project metrics across:
- Websites and blogs
- Mobile applications
- Open source projects

The architecture should be extensible for other developers to adapt for their own use.

## Data Sources

### 1. Blog (johnlarkin1.github.io)
**Provider:** Google Analytics

| Metric | Granularity |
|--------|-------------|
| Visitors | Daily, Weekly, Monthly |
| Unique Visitors | Daily, Weekly, Monthly |
| Most Popular Post | Weekly, Monthly, Yearly |

### 2. Tennis Scorigami
**Provider:** PostHog

| Metric | Granularity |
|--------|-------------|
| Visitors | Daily, Weekly, Monthly |
| Unique Visitors | Daily, Weekly, Monthly |

### 3. Scrollz.co (iOS App)
**Provider:** Supabase

| Metric | Granularity |
|--------|-------------|
| App Store Downloads | Total, Trend |
| Active Users | DAU, WAU, MAU |
| Canny Notifications | Real-time alerts |

### 4. walk-in-the-parquet
**Provider:** TBD (likely npm/PyPI stats + website analytics)

| Metric | Granularity |
|--------|-------------|
| Package Downloads | Total, Trend |
| Page Visitors | DAU, WAU, MAU |

### 5. GitHub Repositories
**Provider:** GitHub API

| Metric | Granularity |
|--------|-------------|
| Stars | Total per repo |
| Star Velocity | Temporal trends (detect aggressive starring) |
| New Stars | Daily, Weekly alerts |

## Architecture (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Dashboard                        │
│                      (Next.js 16 + React 19)                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
│                    (Next.js API Routes)                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────┬───────────┼───────────┬────────────┐
        ▼            ▼           ▼           ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Google  │  │ PostHog │  │Supabase │  │ Package │  │ GitHub  │
   │Analytics│  │   API   │  │   API   │  │ Stats   │  │   API   │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

## Tech Stack

- **Frontend:** Next.js 16 with App Router
- **UI Framework:** React 19
- **Styling:** Tailwind CSS + shadcn/ui
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts or Tremor
- **Auth:** NextAuth.js (for securing the dashboard)
- **Deployment:** Vercel

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

Required API keys and secrets (to be configured in `.env.local`):

```
# Google Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=
GOOGLE_SERVICE_ACCOUNT_KEY=

# PostHog
POSTHOG_API_KEY=
POSTHOG_PROJECT_ID=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# GitHub
GITHUB_TOKEN=

# Canny (for Scrollz notifications)
CANNY_API_KEY=
```

## Roadmap

- [ ] Project scaffolding (Next.js 16 + React 19 + Tailwind + shadcn/ui)
- [ ] GitHub integration (star tracking with trends)
- [ ] Google Analytics integration
- [ ] PostHog integration
- [ ] Supabase integration (Scrollz metrics)
- [ ] Package download stats (npm/PyPI)
- [ ] Unified dashboard UI
- [ ] Alerting system for anomalies
- [ ] Make extensible/configurable for other developers
