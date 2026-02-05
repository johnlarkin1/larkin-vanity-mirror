# Larkin Vanity Mirror - Task Breakdown

## Current Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | All scaffolding, layout, components done |
| Phase 2: GitHub | ✅ Complete | Full integration with star tracking, velocity |
| Phase 3: Google Analytics | ✅ Complete | Blog metrics with time series charts |
| Phase 4: PostHog | ✅ Complete | Tennis Scorigami analytics |
| Phase 5: Scrollz | ⏸️ Deferred | Page exists as stub, integration skipped |
| Phase 6: Package Stats | ✅ Complete | npm, PyPI, crates.io + App Store Connect |
| Phase 7: Dashboard | 🔄 Partial | Overview page complete, anomaly detection pending |
| Phase 8: Auth & Security | ⚠️ Pending | Security review needed before deployment |
| Phase 9: Deployment | ⚠️ Pending | Ready for Vercel deployment |
| Phase 10: Extensibility | 📋 Future | Not started |

---

## Next Steps (Priority Order)

1. **Security Review for Vercel Deployment**
   - [ ] Audit API routes for server-only key access
   - [ ] Verify no client-side API key exposure
   - [ ] Add rate limiting to API routes
   - [ ] Review CORS and CSP headers

2. **Vercel Deployment**
   - [ ] Configure Vercel project
   - [ ] Set up environment variables securely
   - [ ] Deploy to production
   - [ ] Verify build and runtime behavior

3. **Optional Enhancements**
   - [ ] Anomaly detection (Phase 7.2)
   - [ ] Error boundaries and fallback UI
   - [ ] Mobile responsive tweaks

---

## Phase 1: Project Foundation ✅

### 1.1 Project Scaffolding
- [x] Initialize Next.js 16 project with TypeScript
- [x] Configure Tailwind CSS v4
- [x] Install and configure shadcn/ui
- [x] Set up project structure (app router layout)
- [x] Configure ESLint and Prettier
- [x] Create `.env.local.example` with all required env vars
- [x] Add `.gitignore` entries for secrets

### 1.2 Base Dashboard Layout
- [x] Create root layout with sidebar navigation
- [x] Build dashboard shell component (header, main content area)
- [x] Add dark/light mode toggle
- [x] Create loading skeletons for data cards
- [x] Set up TanStack Query provider
- [x] **Bonus:** Draggable/resizable sidebar with collapse functionality

### 1.3 Shared Components
- [x] MetricCard component (displays single metric with trend)
- [x] TimeSeriesChart component (line/area chart wrapper)
- [x] DataTable component (for detailed breakdowns)
- [x] DateRangePicker component (for filtering)
- [x] StatGroup component (DAU/WAU/MAU display)

---

## Phase 2: GitHub Integration ✅

### 2.1 GitHub API Setup
- [x] Create GitHub API client (`/lib/github.ts`)
- [x] Implement authenticated requests with token
- [x] Add rate limit handling

### 2.2 Star Tracking
- [x] Fetch star count for configured repos
- [x] Fetch stargazers with timestamps (for velocity calculation)
- [x] Calculate star velocity (daily/weekly trends)
- [x] Detect "aggressive starring" anomalies

### 2.3 GitHub Dashboard Section
- [x] Create `/app/(dashboard)/github/page.tsx`
- [x] RepoStarsCard component (per-repo star count + trend)
- [x] StarVelocityChart component (stars over time)
- [x] RepoList component (all tracked repos)
- [x] API route: `GET /api/github/analytics`

---

## Phase 3: Google Analytics Integration (Blog) ✅

### 3.1 Google Analytics API Setup
- [x] Set up Google Cloud project with Analytics Data API
- [x] Create service account and download credentials
- [x] Create GA client (`/lib/google-analytics.ts`)
- [x] Implement authentication with service account

### 3.2 Blog Metrics
- [x] Fetch daily/weekly/monthly visitors
- [x] Fetch daily/weekly/monthly unique visitors
- [x] Fetch top pages by pageviews (for "most popular post")
- [x] Calculate period-over-period comparisons

### 3.3 Blog Dashboard Section
- [x] Create `/app/(dashboard)/blog/page.tsx`
- [x] VisitorStatsCard component (visitors + uniques)
- [x] TrafficChart component (visitors over time)
- [x] TopPostsTable component (popular posts ranking)
- [x] API route: `GET /api/blog/analytics`

---

## Phase 4: PostHog Integration (Tennis Scorigami) ✅

### 4.1 PostHog API Setup
- [x] Create PostHog client (`/lib/posthog.ts`)
- [x] Configure API key and project ID
- [x] Implement query builder for insights

### 4.2 Tennis Scorigami Metrics
- [x] Fetch daily/weekly/monthly visitors
- [x] Fetch daily/weekly/monthly unique visitors
- [x] Fetch session duration and bounce rate (bonus)

### 4.3 Tennis Scorigami Dashboard Section
- [x] Create `/app/(dashboard)/tennis-scorigami/page.tsx`
- [x] VisitorStatsCard component
- [x] TrafficChart component
- [x] API route: `GET /api/tennis-scorigami/analytics`

---

## Phase 5: Supabase Integration (Scrollz.co) ⏸️ Deferred

*Note: This phase has been deferred. A stub page exists at `/app/(dashboard)/scrollz/page.tsx` but the backend integration has been skipped for now.*

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
- [x] Create `/app/(dashboard)/scrollz/page.tsx` (stub only)
- [ ] DownloadStatsCard component
- [ ] ActiveUsersCard component (DAU/WAU/MAU)
- [ ] CannyFeedbackList component
- [ ] API routes: `GET /api/scrollz/metrics`, `GET /api/scrollz/canny`

---

## Phase 6: Package Stats & App Store Connect ✅

### 6.1 Package Registry APIs
- [x] Determine package registries (npm, PyPI, crates.io)
- [x] Create npm stats client (`/lib/packages/npm.ts`)
- [x] Create PyPI stats client (`/lib/packages/pypi.ts`)
- [x] Create crates.io stats client (`/lib/packages/crates.ts`)

### 6.2 Download Metrics
- [x] Fetch total downloads
- [x] Fetch download trends (daily/weekly)

### 6.3 Published Packages Dashboard
- [x] Create `/app/(dashboard)/published-packages/page.tsx`
- [x] DownloadStatsCard component
- [x] DownloadTrendChart component
- [x] API route: `GET /api/packages/analytics`

### 6.4 Walk in the Parquet Page
- [x] Create `/app/(dashboard)/walk-in-the-parquet/page.tsx`
- [x] Package download stats integration
- [x] API route: `GET /api/walk-in-the-parquet/analytics`

### 6.5 App Store Connect Integration (Bonus - Not in Original Plan)
- [x] Create App Store Connect client (`/lib/app-store-connect.ts`)
- [x] Implement JWT authentication with Apple API keys
- [x] Fetch iOS app downloads, revenue, ratings
- [x] Integrate with Walk in the Parquet dashboard

---

## Phase 7: Unified Dashboard Home

### 7.1 Overview Page ✅
- [x] Create `/app/(dashboard)/page.tsx` (dashboard home)
- [x] Summary cards for each data source
- [x] "At a glance" metrics (total visitors across all properties)
- [x] Recent activity feed

### 7.2 Alerts & Anomalies (Pending)
- [ ] Define anomaly detection rules (e.g., >2 std dev from mean)
- [ ] AlertBanner component for important notifications
- [ ] AlertsList component showing recent anomalies

---

## Phase 8: Authentication & Security ⚠️

*Note: For a personal dashboard, full auth may not be needed. Focus on ensuring API keys stay server-side and the deployment is secure.*

### 8.1 Auth Setup (Optional for Personal Use)
- [ ] Install and configure NextAuth.js
- [ ] Set up authentication provider (GitHub OAuth or simple password)
- [ ] Create login page
- [ ] Protect all dashboard routes with middleware

### 8.2 API Security (Required)
- [ ] Audit all API routes for server-only key access
- [ ] Verify no API keys leak to client-side bundle
- [ ] Rate limiting on API routes
- [ ] Review security headers (CORS, CSP)

---

## Phase 9: Deployment & Polish

### 9.1 Security-First Vercel Deployment
- [ ] Run `pnpm build` and verify no client-side key exposure
- [ ] Configure Vercel project
- [ ] Set up environment variables securely in Vercel dashboard
- [ ] Deploy to production
- [ ] Verify all API routes work in production
- [ ] Set up custom domain (optional)

### 9.2 Polish
- [ ] Add error boundaries and fallback UI
- [ ] Improve loading states
- [x] Add refresh buttons for manual data reload
- [ ] Mobile responsive tweaks
- [x] Performance optimization (TanStack Query caching)

### 9.3 Documentation
- [x] Update README with setup instructions
- [x] CLAUDE.md with architecture overview
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

## What's Been Built

### Dashboard Pages (7 total)
1. **Overview** - `/app/(dashboard)/page.tsx` - Aggregated metrics across all sources
2. **Blog** - `/app/(dashboard)/blog/page.tsx` - Google Analytics for blog
3. **GitHub** - `/app/(dashboard)/github/page.tsx` - Repo stars and velocity
4. **Tennis Scorigami** - `/app/(dashboard)/tennis-scorigami/page.tsx` - PostHog analytics
5. **Scrollz** - `/app/(dashboard)/scrollz/page.tsx` - Stub page (deferred)
6. **Walk in the Parquet** - `/app/(dashboard)/walk-in-the-parquet/page.tsx` - Package + App Store stats
7. **Published Packages** - `/app/(dashboard)/published-packages/page.tsx` - npm/PyPI/crates.io

### API Routes (5 total)
- `GET /api/blog/analytics`
- `GET /api/github/analytics`
- `GET /api/packages/analytics`
- `GET /api/walk-in-the-parquet/analytics`
- `GET /api/tennis-scorigami/analytics`

### Data Clients (5 total)
- `lib/google-analytics.ts`
- `lib/github.ts`
- `lib/posthog.ts`
- `lib/app-store-connect.ts`
- `lib/packages/` (npm.ts, pypi.ts, crates.ts)

### Custom Hooks (8 total)
- `useBlogAnalytics`
- `useGithubAnalytics`
- `usePackagesAnalytics`
- `useWalkInTheParquetAnalytics`
- `useTennisScorigamiAnalytics`
- `useOverviewAnalytics`
- `useSidebar`
- `useSidebarCollapseResize`

### UI Features
- Draggable/resizable sidebar with collapse
- Dark/light mode toggle
- Responsive component library (shadcn/ui)
- Time series charts (Recharts)
- Data tables with sorting

---

## Resolved Questions

- **Analytics for walk-in-the-parquet**: Uses App Store Connect API for iOS app metrics
- **Package registries**: npm, PyPI, and crates.io all supported
- **Specific repos for GitHub**: Configured via environment variable
- **Scrollz integration**: Deferred for now

## Remaining Questions

- **Auth method**: TBD if needed (personal dashboard may not require auth)
- **Custom domain**: TBD for Vercel deployment
