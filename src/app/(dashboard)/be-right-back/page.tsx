"use client";

import { Users, Eye, MousePointerClick, Timer, RefreshCw, Globe, Download, Tag } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useDateRange } from "@/hooks/use-date-range";
import { useBeRightBackAnalytics } from "@/hooks/use-be-right-back-analytics";
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BeRightBackPage() {
  const { dateRange, setDateRange } = useDateRange();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useBeRightBackAnalytics({ dateRange });

  const website = data?.website;
  const downloads = data?.downloads;

  const chartSeries = [
    { dataKey: "visitors", name: "Pageviews", color: "hsl(var(--chart-1))" },
    { dataKey: "uniqueVisitors", name: "Unique Visitors", color: "hsl(var(--chart-2))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Be Right Back</h1>
          <p className="text-muted-foreground">
            Analytics for berightback.xyz — macOS app
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLinkButton
            href="https://berightback.xyz"
            icon={<Globe className="h-4 w-4" />}
          >
            Visit Site
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

      {/* Downloads Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Downloads"
          value={isLoading ? "--" : downloads?.totalDownloads.toLocaleString() ?? "--"}
          icon={Download}
          isLoading={isLoading}
        />
        <MetricCard
          title="Latest Version"
          value={isLoading ? "--" : downloads?.latestVersion ?? "No releases"}
          icon={Tag}
          isLoading={isLoading}
        />
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
      </div>

      {/* Releases Table */}
      {downloads && downloads.releases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>GitHub Releases</CardTitle>
            <CardDescription>Download counts from GitHub Releases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Release</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead className="text-right">Downloads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads.releases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{release.name}</span>
                          {release.tagName === downloads.latestVersion && (
                            <Badge variant="secondary">Latest</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(release.publishedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {release.assets.map((asset) => (
                            <span key={asset.name} className="text-xs text-muted-foreground">
                              {asset.name} ({formatBytes(asset.size)}) — {asset.downloadCount.toLocaleString()} downloads
                            </span>
                          ))}
                          {release.assets.length === 0 && (
                            <span className="text-xs text-muted-foreground">No assets</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {release.totalDownloads.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Website Analytics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

      {website?.timeSeries && website.timeSeries.length > 0 ? (
        <TimeSeriesChart
          title="Visitor Trends"
          data={website.timeSeries}
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
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
          <CardDescription>Most triggered custom events on berightback.xyz</CardDescription>
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
    </div>
  );
}
