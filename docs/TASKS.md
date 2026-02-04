# Larkin Vanity Mirror - Task Breakdown

## Phase 1: Project Foundation

### 1.1 Project Scaffolding
- [ ] Initialize Next.js 16 project with TypeScript
- [ ] Configure Tailwind CSS v4
- [ ] Install and configure shadcn/ui
- [ ] Set up project structure (app router layout)
- [ ] Configure ESLint and Prettier
- [ ] Create `.env.local.example` with all required env vars
- [ ] Add `.gitignore` entries for secrets

### 1.2 Base Dashboard Layout
- [ ] Create root layout with sidebar navigation
- [ ] Build dashboard shell component (header, main content area)
- [ ] Add dark/light mode toggle
- [ ] Create loading skeletons for data cards
- [ ] Set up TanStack Query provider

### 1.3 Shared Components
- [ ] MetricCard component (displays single metric with trend)
- [ ] TimeSeriesChart component (line/area chart wrapper)
- [ ] DataTable component (for detailed breakdowns)
- [ ] DateRangePicker component (for filtering)
- [ ] StatGroup component (DAU/WAU/MAU display)

---

## Phase 2: GitHub Integration

### 2.1 GitHub API Setup
- [ ] Create GitHub API client (`/lib/github.ts`)
- [ ] Implement authenticated requests with token
- [ ] Add rate limit handling

### 2.2 Star Tracking
- [ ] Fetch star count for configured repos
- [ ] Fetch stargazers with timestamps (for velocity calculation)
- [ ] Calculate star velocity (daily/weekly trends)
- [ ] Detect "aggressive starring" anomalies

### 2.3 GitHub Dashboard Section
- [ ] Create `/app/github/page.tsx`
- [ ] RepoStarsCard component (per-repo star count + trend)
- [ ] StarVelocityChart component (stars over time)
- [ ] RepoList component (all tracked repos)
- [ ] API route: `GET /api/github/stars`

---

## Phase 3: Google Analytics Integration (Blog)

### 3.1 Google Analytics API Setup
- [ ] Set up Google Cloud project with Analytics Data API
- [ ] Create service account and download credentials
- [ ] Create GA client (`/lib/google-analytics.ts`)
- [ ] Implement authentication with service account

### 3.2 Blog Metrics
- [ ] Fetch daily/weekly/monthly visitors
- [ ] Fetch daily/weekly/monthly unique visitors
- [ ] Fetch top pages by pageviews (for "most popular post")
- [ ] Calculate period-over-period comparisons

### 3.3 Blog Dashboard Section
- [ ] Create `/app/blog/page.tsx`
- [ ] VisitorStatsCard component (visitors + uniques)
- [ ] TrafficChart component (visitors over time)
- [ ] TopPostsTable component (popular posts ranking)
- [ ] API route: `GET /api/blog/analytics`

---

## Phase 4: PostHog Integration (Tennis Scorigami)

### 4.1 PostHog API Setup
- [ ] Create PostHog client (`/lib/posthog.ts`)
- [ ] Configure API key and project ID
- [ ] Implement query builder for insights

### 4.2 Tennis Scorigami Metrics
- [ ] Fetch daily/weekly/monthly visitors
- [ ] Fetch daily/weekly/monthly unique visitors
- [ ] Fetch session duration and bounce rate (bonus)

### 4.3 Tennis Scorigami Dashboard Section
- [ ] Create `/app/tennis-scorigami/page.tsx`
- [ ] VisitorStatsCard component
- [ ] TrafficChart component
- [ ] API route: `GET /api/tennis-scorigami/analytics`

---

## Phase 5: Supabase Integration (Scrollz.co)

### 5.1 Supabase Setup
- [ ] Create Supabase client (`/lib/supabase.ts`)
- [ ] Configure connection with anon key

### 5.2 Scrollz Metrics
- [ ] Query for iOS app download count (if stored in Supabase)
- [ ] Calculate DAU/WAU/MAU from user activity tables
- [ ] Set up real-time subscription for live updates (optional)

### 5.3 Canny Integration
- [ ] Create Canny client (`/lib/canny.ts`)
- [ ] Fetch recent feedback/feature requests
- [ ] Fetch notification count or changelog items

### 5.4 Scrollz Dashboard Section
- [ ] Create `/app/scrollz/page.tsx`
- [ ] DownloadStatsCard component
- [ ] ActiveUsersCard component (DAU/WAU/MAU)
- [ ] CannyFeedbackList component
- [ ] API routes: `GET /api/scrollz/metrics`, `GET /api/scrollz/canny`

---

## Phase 6: Package Stats (walk-in-the-parquet)

### 6.1 Package Registry APIs
- [ ] Determine package registries (npm, PyPI, or both)
- [ ] Create npm stats client (`/lib/npm-stats.ts`) if applicable
- [ ] Create PyPI stats client (`/lib/pypi-stats.ts`) if applicable

### 6.2 Download Metrics
- [ ] Fetch total downloads
- [ ] Fetch download trends (daily/weekly)

### 6.3 Page Analytics
- [ ] Determine analytics provider for walk-in-the-parquet site
- [ ] Integrate with appropriate API (GA, PostHog, etc.)
- [ ] Fetch DAU/WAU/MAU for the page

### 6.4 Package Dashboard Section
- [ ] Create `/app/walk-in-the-parquet/page.tsx`
- [ ] DownloadStatsCard component
- [ ] DownloadTrendChart component
- [ ] PageVisitorsCard component
- [ ] API route: `GET /api/walk-in-the-parquet/stats`

---

## Phase 7: Unified Dashboard Home

### 7.1 Overview Page
- [ ] Create `/app/page.tsx` (dashboard home)
- [ ] Summary cards for each data source
- [ ] "At a glance" metrics (total visitors across all properties)
- [ ] Recent activity feed

### 7.2 Alerts & Anomalies
- [ ] Define anomaly detection rules (e.g., >2 std dev from mean)
- [ ] AlertBanner component for important notifications
- [ ] AlertsList component showing recent anomalies

---

## Phase 8: Authentication & Security

### 8.1 Auth Setup
- [ ] Install and configure NextAuth.js
- [ ] Set up authentication provider (GitHub OAuth or simple password)
- [ ] Create login page
- [ ] Protect all dashboard routes with middleware

### 8.2 API Security
- [ ] Add authentication checks to all API routes
- [ ] Rate limiting on API routes (optional)

---

## Phase 9: Deployment & Polish

### 9.1 Deployment
- [ ] Configure Vercel project
- [ ] Set up environment variables in Vercel
- [ ] Deploy to production
- [ ] Set up custom domain (optional)

### 9.2 Polish
- [ ] Add error boundaries and fallback UI
- [ ] Improve loading states
- [ ] Add refresh buttons for manual data reload
- [ ] Mobile responsive tweaks
- [ ] Performance optimization (caching strategies)

### 9.3 Documentation
- [ ] Update README with setup instructions
- [ ] Document how to add new data sources
- [ ] Create configuration guide for other developers

---

## Phase 10: Extensibility (Future)

### 10.1 Configuration System
- [ ] Create config file format for data sources
- [ ] Build "add new source" UI
- [ ] Plugin architecture for custom integrations

### 10.2 Additional Features
- [ ] Email/Slack alerts for anomalies
- [ ] Historical data storage (beyond API limits)
- [ ] Export functionality (CSV, PDF reports)
- [ ] Scheduled refresh with cron jobs

---

## Priority Order (Recommended)

1. **Phase 1** - Foundation (required for everything else)
2. **Phase 2** - GitHub (simplest API, good for proving out the pattern)
3. **Phase 7.1** - Basic home page (ties it together early)
4. **Phase 3** - Google Analytics (blog metrics)
5. **Phase 4** - PostHog (similar pattern to GA)
6. **Phase 5** - Supabase/Scrollz (more complex, app-specific)
7. **Phase 6** - Package stats (depends on registry used)
8. **Phase 8** - Auth (can be added once core functionality works)
9. **Phase 9** - Deploy & polish
10. **Phase 10** - Future extensibility

---

## Open Questions

- [ ] What is the analytics provider for walk-in-the-parquet website?
- [ ] Is walk-in-the-parquet on npm, PyPI, or both?
- [ ] How is Scrollz.co download data tracked? (App Store Connect API vs stored in Supabase)
- [ ] Preferred auth method? (GitHub OAuth, magic link, simple password)
- [ ] Any specific repos to track for GitHub stars, or all public repos?
