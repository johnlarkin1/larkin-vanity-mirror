"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OverviewAnalyticsData, LoadingStates } from "@/hooks/use-overview-analytics";

interface QuickStatsProps {
  data: OverviewAnalyticsData;
  loadingStates?: LoadingStates;
  isLoading?: boolean;
}

interface StatRowProps {
  label: string;
  value: string | number;
  trend?: number;
  sparklineData?: Array<{ value: number }>;
  color?: string;
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

function Sparkline({
  data,
  color = "#6366f1",
}: {
  data: Array<{ value: number }>;
  color?: string;
}) {
  if (!data || data.length < 2) {
    return <div className="h-5 w-12" />;
  }

  return (
    <div className="h-5 w-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatRow({ label, value, trend, sparklineData, color }: StatRowProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) {
      return "text-muted-foreground";
    }
    return trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color={color} />
        )}
        <span className="w-16 text-right text-sm font-semibold tabular-nums">{value}</span>
        {trend !== undefined && (
          <div className={cn("flex w-12 items-center justify-end gap-0.5 text-xs", getTrendColor())}>
            {getTrendIcon()}
            <span>
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function QuickStats({ data, loadingStates, isLoading = false }: QuickStatsProps) {
  // Show skeleton only if ALL sources are loading
  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <StatRowSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { rawData, metrics } = data;

  // Determine which specific sources are still loading
  const blogLoading = loadingStates?.blog ?? false;
  const githubLoading = loadingStates?.github ?? false;
  const youtubeLoading = loadingStates?.youtube ?? false;
  const packagesLoading = loadingStates?.packages ?? false;
  const tennisLoading = loadingStates?.tennisScorigami ?? false;
  const parquetLoading = loadingStates?.walkInTheParquet ?? false;

  // Extract 7-day sparkline data from time series
  const blogSparkline =
    rawData.blog?.timeSeries
      ?.slice(-7)
      .map((p) => ({ value: p.visitors })) ?? [];

  const tennisSparkline =
    rawData.tennisScorigami?.timeSeries
      ?.slice(-7)
      .map((p) => ({ value: p.visitors })) ?? [];

  const packagesSparkline =
    rawData.packages?.timeSeries
      ?.slice(-7)
      .map((p) => ({ value: p.npm + p.pypi + p.crates })) ?? [];

  // Calculate DAU if available
  const dau = rawData.tennisScorigami?.activeUsers?.dau ?? 0;
  const wau = rawData.tennisScorigami?.activeUsers?.wau ?? 0;

  // App downloads if available
  const appDownloads = rawData.walkInTheParquet?.appStore?.sales?.weeklyDownloads?.value ?? 0;
  const appTrend = rawData.walkInTheParquet?.appStore?.sales?.weeklyDownloads?.trend ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>Key metrics from the past 7 days</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="divide-y">
          {blogLoading ? (
            <StatRowSkeleton />
          ) : (
            <StatRow
              label="Blog Visitors"
              value={formatCompactNumber(rawData.blog?.metrics.visitors.value ?? 0)}
              trend={rawData.blog?.metrics.visitors.trend}
              sparklineData={blogSparkline}
              color="#6366f1"
            />
          )}
          {githubLoading ? (
            <StatRowSkeleton />
          ) : (
            <StatRow
              label="GitHub Stars"
              value={formatCompactNumber(metrics.githubStars.value)}
              trend={metrics.githubStars.trend}
              color="#a855f7"
            />
          )}
          {packagesLoading ? (
            <StatRowSkeleton />
          ) : (
            <StatRow
              label="Package Downloads"
              value={formatCompactNumber(metrics.packageDownloads.value)}
              trend={Math.round(metrics.packageDownloads.trend)}
              sparklineData={packagesSparkline}
              color="#22c55e"
            />
          )}
          {youtubeLoading ? (
            <StatRowSkeleton />
          ) : (
            rawData.youtube && (
              <StatRow
                label="YouTube Views"
                value={formatCompactNumber(rawData.youtube.metrics.totalViews)}
                color="#ef4444"
              />
            )
          )}
          {tennisLoading ? (
            <StatRowSkeleton />
          ) : (
            <>
              {dau > 0 && (
                <StatRow
                  label="Daily Active Users"
                  value={formatCompactNumber(dau)}
                  sparklineData={tennisSparkline}
                  color="#f97316"
                />
              )}
              {wau > 0 && (
                <StatRow
                  label="Weekly Active Users"
                  value={formatCompactNumber(wau)}
                  color="#f97316"
                />
              )}
            </>
          )}
          {parquetLoading ? (
            <StatRowSkeleton />
          ) : (
            appDownloads > 0 && (
              <StatRow
                label="App Downloads (Week)"
                value={formatCompactNumber(appDownloads)}
                trend={Math.round(appTrend)}
                color="#ec4899"
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
