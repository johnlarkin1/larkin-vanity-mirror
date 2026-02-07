"use client";

import { useState } from "react";
import { FileText, Users, Eye, Clock, RefreshCw, TrendingUp, Timer, ArrowUpRight, LayoutList, LayoutGrid, Globe } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDateRange } from "@/hooks/use-date-range";
import { useBlogAnalytics, type TopPage } from "@/hooks/use-blog-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLinkButton } from "@/components/ui/external-link-button";

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function formatCompactDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Rank badge component with visual distinction for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white shadow-md shadow-amber-500/30">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-xs font-bold text-white shadow-md shadow-slate-400/30">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-xs font-bold text-white shadow-md shadow-amber-700/30">
        3
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {rank}
    </div>
  );
}

// Progress bar with gradient
function ViewsProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

// Enhanced table row for top pages
function TopPageRow({
  page,
  rank,
  totalViews,
  maxViews,
}: {
  page: TopPage;
  rank: number;
  totalViews: number;
  maxViews: number;
}) {
  const viewsPercentage = totalViews > 0 ? (page.pageviews / totalViews) * 100 : 0;
  const relativeWidth = maxViews > 0 ? (page.pageviews / maxViews) * 100 : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border p-4 transition-all hover:bg-muted/50",
        rank <= 3 && "border-l-2",
        rank === 1 && "border-l-amber-500",
        rank === 2 && "border-l-slate-400",
        rank === 3 && "border-l-amber-700"
      )}
    >
      <div className="flex items-start gap-4">
        <RankBadge rank={rank} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium leading-tight" title={page.pageTitle}>
            {page.pageTitle}
          </h3>
          <code className="mt-1 block truncate text-xs text-muted-foreground" title={page.pagePath}>
            {page.pagePath}
          </code>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-lg font-bold tabular-nums">
            {page.pageviews.toLocaleString()}
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">
            {viewsPercentage.toFixed(1)}% of total
          </span>
        </div>
      </div>

      <ViewsProgressBar percentage={relativeWidth} />

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-cyan-500" />
          <span className="text-muted-foreground">Unique:</span>
          <span className="font-medium tabular-nums">{page.uniqueVisitors.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground">Avg time:</span>
          <span className="font-medium tabular-nums">{formatCompactDuration(page.avgTimeOnPage)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
          <span className="text-muted-foreground">Bounce:</span>
          <span className={cn(
            "font-medium tabular-nums",
            page.bounceRate > 70 && "text-rose-500",
            page.bounceRate < 40 && "text-emerald-500"
          )}>
            {page.bounceRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for top pages (detailed view)
function TopPageSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="flex gap-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Compact table view for top pages
function TopPagesCompactTable({
  pages,
  totalViews,
  isLoading,
}: {
  pages: TopPage[];
  totalViews: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Page</TableHead>
              <TableHead className="hidden sm:table-cell">Path</TableHead>
              <TableHead className="text-right">Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">No data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Page</TableHead>
            <TableHead className="hidden sm:table-cell">Path</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="hidden md:table-cell text-right">% Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page, index) => {
            const rank = index + 1;
            const percentage = totalViews > 0 ? (page.pageviews / totalViews) * 100 : 0;
            return (
              <TableRow key={`${index}-${page.pagePath}`}>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      rank === 1 && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                      rank === 2 && "bg-slate-500/20 text-slate-600 dark:text-slate-400",
                      rank === 3 && "bg-amber-700/20 text-amber-700 dark:text-amber-500",
                      rank > 3 && "text-muted-foreground"
                    )}
                  >
                    {rank}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[250px] truncate font-medium" title={page.pageTitle}>
                    {page.pageTitle}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <code className="text-xs text-muted-foreground">{page.pagePath}</code>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {page.pageviews.toLocaleString()}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right text-muted-foreground tabular-nums">
                  {percentage.toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function BlogPage() {
  const { dateRange, setDateRange } = useDateRange();
  const { data, isLoading, isError, error, refetch, isFetching } = useBlogAnalytics({
    dateRange,
  });
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");

  const chartSeries = [
    { dataKey: "visitors", name: "Visitors", color: "hsl(var(--chart-1))" },
    { dataKey: "uniqueVisitors", name: "Unique Visitors", color: "hsl(var(--chart-2))" },
  ];

  // Calculate totals for percentage displays
  const totalViews = data?.topPages.reduce((sum, page) => sum + page.pageviews, 0) ?? 0;
  const maxViews = data?.topPages[0]?.pageviews ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Blog Analytics</h1>
          <p className="text-muted-foreground">
            Metrics for johnlarkin1.github.io from Google Analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLinkButton
            href="https://johnlarkin1.github.io"
            icon={<Globe className="h-4 w-4 mr-1" />}
          >
            Visit Blog
          </ExternalLinkButton>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Failed to load analytics data"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <MetricCard
          title="Total Visitors"
          value={isLoading ? "--" : data?.metrics.visitors.value.toLocaleString() ?? "--"}
          trend={data?.metrics.visitors.trend}
          trendLabel="vs previous period"
          icon={Users}
          isLoading={isLoading}
        />
        <MetricCard
          title="Unique Visitors"
          value={isLoading ? "--" : data?.metrics.uniqueVisitors.value.toLocaleString() ?? "--"}
          trend={data?.metrics.uniqueVisitors.trend}
          trendLabel="vs previous period"
          icon={Eye}
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg. Users/Day"
          value={isLoading ? "--" : data?.metrics.avgUsersPerDay.value.toLocaleString() ?? "--"}
          trend={data?.metrics.avgUsersPerDay.trend}
          trendLabel="vs previous period"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg. Session Duration"
          value={
            isLoading ? "--" : formatDuration(data?.metrics.avgSessionDuration.value ?? 0)
          }
          trend={data?.metrics.avgSessionDuration.trend}
          trendLabel="vs previous period"
          icon={Clock}
          isLoading={isLoading}
        />
        <MetricCard
          title="Top Pages"
          value={isLoading ? "--" : data?.topPages.length ?? 0}
          icon={FileText}
          trendLabel="pages with views"
          isLoading={isLoading}
        />
      </div>

      {data?.timeSeries && data.timeSeries.length > 0 ? (
        <TimeSeriesChart
          title="Visitor Trends"
          data={data.timeSeries}
          series={chartSeries}
          isLoading={isLoading}
        />
      ) : isLoading ? (
        <TimeSeriesChart
          title="Visitor Trends"
          data={[]}
          series={chartSeries}
          isLoading={true}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Visitor Trends</CardTitle>
            <CardDescription>Daily visitors over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">
              No data available for the selected period
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold">Most Popular Posts</CardTitle>
              <CardDescription>
                Top performing content ranked by page views
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border p-1">
                <Button
                  variant={viewMode === "compact" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("compact")}
                >
                  <LayoutList className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1.5">Compact</span>
                </Button>
                <Button
                  variant={viewMode === "detailed" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("detailed")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1.5">Detailed</span>
                </Button>
              </div>
              {!isLoading && data?.topPages && (
                <div className="hidden text-right sm:block">
                  <div className="text-2xl font-bold tabular-nums">
                    {totalViews.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">total views</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "compact" ? (
            <TopPagesCompactTable
              pages={data?.topPages ?? []}
              totalViews={totalViews}
              isLoading={isLoading}
            />
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <TopPageSkeleton key={i} />
              ))}
            </div>
          ) : data?.topPages && data.topPages.length > 0 ? (
            <div className="space-y-3">
              {data.topPages.map((page, index) => (
                <TopPageRow
                  key={`${index}-${page.pagePath}`}
                  page={page}
                  rank={index + 1}
                  totalViews={totalViews}
                  maxViews={maxViews}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">
                No data available for the selected period
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
