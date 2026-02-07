"use client";

import { Download, TrendingUp, Users, Star, Clock, DollarSign, RefreshCw, Eye, MessageSquare } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateRange } from "@/hooks/use-date-range";
import {
  useWalkInTheParquetAnalytics,
  type CustomerReview,
  type TopPage,
} from "@/hooks/use-walk-in-the-parquet-analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Star rating display component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

// Review card component
function ReviewCard({ review }: { review: CustomerReview }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-xs text-muted-foreground">
              {formatDate(review.createdDate)}
            </span>
          </div>
          <h4 className="mt-1 font-medium truncate" title={review.title}>
            {review.title}
          </h4>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {review.body}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{review.reviewerNickname}</span>
        <span>·</span>
        <span>{review.territory}</span>
      </div>
    </div>
  );
}

// Top documentation pages table
function TopPagesTable({
  pages,
  isLoading,
}: {
  pages: TopPage[];
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
              <TableHead className="text-right">Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
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
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const totalViews = pages.reduce((sum, page) => sum + page.pageviews, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Page</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="hidden md:table-cell text-right">% Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.slice(0, 10).map((page, index) => {
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

export default function WalkInTheParquetPage() {
  const { dateRange, setDateRange } = useDateRange();
  const { data, isLoading, isError, error, refetch, isFetching } = useWalkInTheParquetAnalytics({
    dateRange,
  });

  const hasAppStore = !!data?.appStore;
  const hasDocumentation = !!data?.documentation;

  // Chart series for downloads
  const downloadChartSeries = [
    { dataKey: "downloads", name: "Downloads", color: "hsl(var(--chart-1))" },
  ];

  // Chart series for documentation visitors
  const visitorChartSeries = [
    { dataKey: "visitors", name: "Sessions", color: "hsl(var(--chart-1))" },
    { dataKey: "uniqueVisitors", name: "Unique Visitors", color: "hsl(var(--chart-2))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Walk in the Parquet</h1>
          <p className="text-muted-foreground">
            App Store metrics and documentation site analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* App Store Metrics */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">App Store</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            title="Total Downloads"
            value={
              isLoading
                ? "--"
                : hasAppStore
                  ? data.appStore!.sales.totalDownloads.value.toLocaleString()
                  : "--"
            }
            trend={hasAppStore ? data.appStore!.sales.totalDownloads.trend : undefined}
            trendLabel={hasAppStore ? "vs previous period" : "Connect App Store"}
            icon={Download}
            isLoading={isLoading}
          />
          <MetricCard
            title="Weekly Downloads"
            value={
              isLoading
                ? "--"
                : hasAppStore
                  ? data.appStore!.sales.weeklyDownloads.value.toLocaleString()
                  : "--"
            }
            trend={hasAppStore ? data.appStore!.sales.weeklyDownloads.trend : undefined}
            trendLabel={hasAppStore ? "vs previous period" : "Connect App Store"}
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <MetricCard
            title="Revenue"
            value={
              isLoading
                ? "--"
                : hasAppStore
                  ? formatCurrency(data.appStore!.sales.totalRevenue.value)
                  : "--"
            }
            trend={hasAppStore ? data.appStore!.sales.totalRevenue.trend : undefined}
            trendLabel={hasAppStore ? "vs previous period" : "Connect App Store"}
            icon={DollarSign}
            isLoading={isLoading}
          />
          <MetricCard
            title="Average Rating"
            value={
              isLoading
                ? "--"
                : hasAppStore
                  ? data.appStore!.reviews.averageRating.toFixed(1)
                  : "--"
            }
            icon={Star}
            trendLabel={
              hasAppStore
                ? `${data.appStore!.reviews.totalReviews} reviews`
                : "Connect App Store"
            }
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Documentation Metrics */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Documentation Site</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            title="Page Visitors"
            value={
              isLoading
                ? "--"
                : hasDocumentation
                  ? data.documentation!.metrics.visitors.value.toLocaleString()
                  : "--"
            }
            trend={hasDocumentation ? data.documentation!.metrics.visitors.trend : undefined}
            trendLabel={hasDocumentation ? "vs previous period" : "Connect Google Analytics"}
            icon={Users}
            isLoading={isLoading}
          />
          <MetricCard
            title="Unique Visitors"
            value={
              isLoading
                ? "--"
                : hasDocumentation
                  ? data.documentation!.metrics.uniqueVisitors.value.toLocaleString()
                  : "--"
            }
            trend={hasDocumentation ? data.documentation!.metrics.uniqueVisitors.trend : undefined}
            trendLabel={hasDocumentation ? "vs previous period" : "Connect Google Analytics"}
            icon={Eye}
            isLoading={isLoading}
          />
          <MetricCard
            title="Avg. Session Duration"
            value={
              isLoading
                ? "--"
                : hasDocumentation
                  ? formatDuration(data.documentation!.metrics.avgSessionDuration.value)
                  : "--"
            }
            trend={hasDocumentation ? data.documentation!.metrics.avgSessionDuration.trend : undefined}
            trendLabel={hasDocumentation ? "vs previous period" : "Connect Google Analytics"}
            icon={Clock}
            isLoading={isLoading}
          />
          <MetricCard
            title="Avg. Users/Day"
            value={
              isLoading
                ? "--"
                : hasDocumentation
                  ? data.documentation!.metrics.avgUsersPerDay.value.toLocaleString()
                  : "--"
            }
            trend={hasDocumentation ? data.documentation!.metrics.avgUsersPerDay.trend : undefined}
            trendLabel={hasDocumentation ? "vs previous period" : "Connect Google Analytics"}
            icon={TrendingUp}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Download Trends */}
        {hasAppStore && data.appStore!.downloadTrends.length > 0 ? (
          <TimeSeriesChart
            title="Download Trends"
            data={data.appStore!.downloadTrends}
            series={downloadChartSeries}
            isLoading={isLoading}
          />
        ) : isLoading ? (
          <TimeSeriesChart
            title="Download Trends"
            data={[]}
            series={downloadChartSeries}
            isLoading={true}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Download Trends</CardTitle>
            </CardHeader>
            <CardContent className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">
                Connect App Store to view download trends
              </p>
            </CardContent>
          </Card>
        )}

        {/* Documentation Visitor Trends */}
        {hasDocumentation && data.documentation!.timeSeries.length > 0 ? (
          <TimeSeriesChart
            title="Documentation Visitors"
            data={data.documentation!.timeSeries}
            series={visitorChartSeries}
            isLoading={isLoading}
          />
        ) : isLoading ? (
          <TimeSeriesChart
            title="Documentation Visitors"
            data={[]}
            series={visitorChartSeries}
            isLoading={true}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Documentation Visitors</CardTitle>
            </CardHeader>
            <CardContent className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">
                Connect Google Analytics to view visitor trends
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Documentation Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Documentation Pages</CardTitle>
            <CardDescription>Most visited pages on the documentation site</CardDescription>
          </CardHeader>
          <CardContent>
            {hasDocumentation ? (
              <TopPagesTable
                pages={data.documentation!.topPages}
                isLoading={isLoading}
              />
            ) : isLoading ? (
              <TopPagesTable pages={[]} isLoading={true} />
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">
                  Connect Google Analytics to view page data
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Reviews</CardTitle>
                <CardDescription>Latest customer reviews from the App Store</CardDescription>
              </div>
              {hasAppStore && (
                <div className="flex items-center gap-1.5 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.appStore!.reviews.totalReviews}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : hasAppStore && data.appStore!.reviews.recentReviews.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.appStore!.reviews.recentReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">
                  {hasAppStore ? "No reviews yet" : "Connect App Store to view reviews"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
