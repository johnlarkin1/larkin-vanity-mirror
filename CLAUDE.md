# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Run development server (localhost:3000)
pnpm build        # Build for production
pnpm lint         # Run ESLint
```

## Architecture

Personal analytics dashboard aggregating metrics from multiple data sources (Google Analytics, PostHog, Supabase, GitHub API, npm/PyPI stats).

### Tech Stack

- Next.js 16 with App Router + React 19
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Recharts for visualizations

### Route Structure

- `src/app/layout.tsx` - Root layout with Providers wrapper (TanStack Query + next-themes)
- `src/app/(dashboard)/` - Dashboard route group with shared sidebar/header layout
  - `page.tsx` - Overview dashboard (Blog analytics)
  - `blog/`, `github/`, `scrollz/`, `tennis-scorigami/`, `walk-in-the-parquet/` - Data source pages

### Data Flow Pattern

```
Page Component
    └── use[Source]Analytics hook (TanStack Query)
            └── /api/[source]/analytics route
                    └── lib/[source].ts (API client)
```

New data sources should follow this pattern:
1. Create lib module for API client (e.g., `lib/posthog.ts`)
2. Add API route in `app/api/[source]/`
3. Create hook in `hooks/use-[source]-analytics.ts`
4. Build page in `app/(dashboard)/[source]/`

### Key Directories

- `src/components/ui/` - shadcn/ui primitives
- `src/components/data-display/` - Dashboard components (MetricCard, DataTable, StatGroup)
- `src/components/charts/` - Recharts wrappers (TimeSeriesChart)
- `src/providers/` - React context providers (QueryClient, ThemeProvider)
- `src/types/` - Shared TypeScript types

### Path Alias

`@/*` maps to `./src/*`

## Environment Variables

Copy `.env.local.example` to `.env.local`. Currently implemented:
- `GOOGLE_ANALYTICS_PROPERTY_ID` - GA4 property ID (numeric)
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Base64-encoded service account JSON

See `.env.local.example` for all planned integrations (PostHog, Supabase, GitHub, Canny, npm/PyPI).
