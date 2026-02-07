"use client";

import { Users, Eye, MousePointerClick, Timer, RefreshCw, Globe } from "lucide-react";
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
import {
  useTennisScorigamiAnalytics,
  type TopEvent,
} from "@/hooks/use-tennis-scorigami-analytics";
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

function TopEventsTable({
  events,
  isLoading,
}: {
  events: TopEvent[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
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
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-12" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground">No custom events tracked in this period</p>
      </div>
    );
  }

  return (
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
          {events.map((event, index) => (
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
  );
}

export default function TennisScorigamiPage() {
  const { dateRange, setDateRange } = useDateRange();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useTennisScorigamiAnalytics({ dateRange });

  const chartSeries = [
    { dataKey: "visitors", name: "Pageviews", color: "hsl(var(--chart-1))" },
    { dataKey: "uniqueVisitors", name: "Unique Visitors", color: "hsl(var(--chart-2))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Tennis Scorigami</h1>
          <p className="text-muted-foreground">
            PostHog analytics for tennis-scorigami.com
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLinkButton
            href="https://tennis-scorigami.com"
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
          value={
            isLoading ? "--" : data?.metrics.uniqueVisitors.value.toLocaleString() ?? "--"
          }
          trend={data?.metrics.uniqueVisitors.trend}
          trendLabel="vs previous period"
          icon={Eye}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Events"
          value={
            isLoading ? "--" : data?.metrics.totalEvents.value.toLocaleString() ?? "--"
          }
          trend={data?.metrics.totalEvents.trend}
          trendLabel="vs previous period"
          icon={MousePointerClick}
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg. Session"
          value={
            isLoading ? "--" : formatDuration(data?.metrics.avgSessionDuration.value ?? 0)
          }
          trend={data?.metrics.avgSessionDuration.trend}
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
            value: isLoading ? "--" : data?.activeUsers.dau.toLocaleString() ?? "--",
          },
          {
            label: "WAU",
            value: isLoading ? "--" : data?.activeUsers.wau.toLocaleString() ?? "--",
          },
          {
            label: "MAU",
            value: isLoading ? "--" : data?.activeUsers.mau.toLocaleString() ?? "--",
          },
        ]}
      />

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
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
          <CardDescription>Most triggered custom events on the site</CardDescription>
        </CardHeader>
        <CardContent>
          <TopEventsTable events={data?.topEvents ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
