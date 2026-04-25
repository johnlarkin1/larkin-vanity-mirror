"use client";

import {
  Users,
  Eye,
  MousePointerClick,
  Timer,
  RefreshCw,
  Globe,
  Tag,
  Download,
  TrendingUp,
  DollarSign,
  Star,
  MessageSquare,
  Apple,
} from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatGroup } from "@/components/data-display/stat-group";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateRange } from "@/hooks/use-date-range";
import { useOdoziAnalytics } from "@/hooks/use-odozi-analytics";
import { ExternalLinkButton } from "@/components/ui/external-link-button";
import type { CustomerReview } from "@/lib/app-store-connect";
import { cn } from "@/lib/utils";

const APP_STORE_URL = "https://apps.apple.com/us/app/odozi/id6760240423";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

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
      <p className="text-sm text-muted-foreground line-clamp-3">{review.body}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{review.reviewerNickname}</span>
        <span>·</span>
        <span>{review.territory}</span>
      </div>
    </div>
  );
}

export default function OdoziPage() {
  const { dateRange, setDateRange } = useDateRange();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useOdoziAnalytics({ dateRange });

  const website = data?.website;
  const releases = data?.releases;
  const appStore = data?.appStore;
  const hasAppStore = !!appStore;

  const visitorChartSeries = [
    { dataKey: "visitors", name: "Pageviews", color: "hsl(var(--chart-1))" },
    { dataKey: "uniqueVisitors", name: "Unique Visitors", color: "hsl(var(--chart-2))" },
  ];

  const downloadChartSeries = [
    { dataKey: "downloads", name: "Downloads", color: "hsl(var(--chart-1))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Odozi</h1>
          <p className="text-muted-foreground">
            Analytics for odozi.app — daily journaling
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExternalLinkButton
            href="https://odozi.app"
            icon={<Globe className="h-4 w-4" />}
          >
            Visit Site
          </ExternalLinkButton>
          <ExternalLinkButton
            href={APP_STORE_URL}
            icon={<Apple className="h-4 w-4" />}
          >
            App Store
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

      {/* Latest Version */}
      {releases?.latestVersion && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            title="Latest Version"
            value={releases.latestVersion}
            icon={Tag}
            isLoading={isLoading}
          />
        </div>
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
                  ? appStore.sales.totalDownloads.value.toLocaleString()
                  : "--"
            }
            trend={hasAppStore ? appStore.sales.totalDownloads.trend : undefined}
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
                  ? appStore.sales.weeklyDownloads.value.toLocaleString()
                  : "--"
            }
            trend={hasAppStore ? appStore.sales.weeklyDownloads.trend : undefined}
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
                  ? formatCurrency(appStore.sales.totalRevenue.value)
                  : "--"
            }
            trend={hasAppStore ? appStore.sales.totalRevenue.trend : undefined}
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
                  ? appStore.reviews.averageRating.toFixed(1)
                  : "--"
            }
            trendLabel={
              hasAppStore
                ? `${appStore.reviews.totalReviews} reviews`
                : "Connect App Store"
            }
            icon={Star}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Website Analytics */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Website</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            title="Total Visitors"
            value={isLoading ? "--" : website?.metrics.visitors.value.toLocaleString() ?? "--"}
            trend={website?.metrics.visitors.trend}
            trendLabel="vs previous period"
            icon={Users}
            isLoading={isLoading}
          />
          <MetricCard
            title="Unique Visitors"
            value={isLoading ? "--" : website?.metrics.uniqueVisitors.value.toLocaleString() ?? "--"}
            trend={website?.metrics.uniqueVisitors.trend}
            trendLabel="vs previous period"
            icon={Eye}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Events"
            value={isLoading ? "--" : website?.metrics.totalEvents.value.toLocaleString() ?? "--"}
            trend={website?.metrics.totalEvents.trend}
            trendLabel="vs previous period"
            icon={MousePointerClick}
            isLoading={isLoading}
          />
          <MetricCard
            title="Avg. Session"
            value={isLoading ? "--" : formatDuration(website?.metrics.avgSessionDuration.value ?? 0)}
            trend={website?.metrics.avgSessionDuration.trend}
            trendLabel="vs previous period"
            icon={Timer}
            isLoading={isLoading}
          />
        </div>
      </div>

      <StatGroup
        title="Active Users"
        stats={[
          {
            label: "DAU",
            value: isLoading ? "--" : website?.activeUsers.dau.toLocaleString() ?? "--",
          },
          {
            label: "WAU",
            value: isLoading ? "--" : website?.activeUsers.wau.toLocaleString() ?? "--",
          },
          {
            label: "MAU",
            value: isLoading ? "--" : website?.activeUsers.mau.toLocaleString() ?? "--",
          },
        ]}
      />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Download Trends */}
        {hasAppStore && appStore.downloadTrends.length > 0 ? (
          <TimeSeriesChart
            title="Download Trends"
            data={appStore.downloadTrends}
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
                {hasAppStore ? "No downloads in this period" : "Connect App Store to view download trends"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Visitor Trends */}
        {website?.timeSeries && website.timeSeries.length > 0 ? (
          <TimeSeriesChart
            title="Visitor Trends"
            data={website.timeSeries}
            series={visitorChartSeries}
            isLoading={isLoading}
          />
        ) : isLoading ? (
          <TimeSeriesChart
            title="Visitor Trends"
            data={[]}
            series={visitorChartSeries}
            isLoading={true}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Visitor Trends</CardTitle>
              <CardDescription>Daily visitors over the selected period</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">
                No data available for the selected period
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Events</CardTitle>
            <CardDescription>Most triggered custom events on odozi.app</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (website?.topEvents?.length ?? 0) === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">No custom events tracked in this period</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Unique Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {website?.topEvents.map((event, index) => (
                      <TableRow key={`${index}-${event.eventName}`}>
                        <TableCell className="font-medium">{event.eventName}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {event.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {event.uniqueUsers.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  <span className="font-medium">{appStore.reviews.totalReviews}</span>
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
            ) : hasAppStore && appStore.reviews.recentReviews.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {appStore.reviews.recentReviews.map((review) => (
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
