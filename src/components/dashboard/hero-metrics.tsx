"use client";

import { Users, Star, Download, Activity } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import type { AggregatedMetrics } from "@/hooks/use-overview-analytics";

interface HeroMetricsProps {
  metrics: AggregatedMetrics;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

export function HeroMetrics({ metrics, isLoading = false }: HeroMetricsProps) {
  const { totalVisitors, githubStars, packageDownloads, activeSources } = metrics;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <MetricCard
        title="Total Visitors"
        value={isLoading ? "--" : formatNumber(totalVisitors.value)}
        icon={Users}
        trend={isLoading ? undefined : Math.round(totalVisitors.trend)}
        trendLabel="Across all projects"
        isLoading={isLoading}
      />
      <MetricCard
        title="GitHub Stars"
        value={isLoading ? "--" : formatNumber(githubStars.value)}
        icon={Star}
        trend={isLoading ? undefined : githubStars.trend}
        trendLabel={
          isLoading
            ? "All repositories"
            : `+${githubStars.newThisWeek} this week`
        }
        isLoading={isLoading}
      />
      <MetricCard
        title="Package Downloads"
        value={isLoading ? "--" : formatNumber(packageDownloads.value)}
        icon={Download}
        trend={isLoading ? undefined : Math.round(packageDownloads.trend)}
        trendLabel="Total downloads"
        isLoading={isLoading}
      />
      <MetricCard
        title="Data Sources"
        value={
          isLoading
            ? "--"
            : `${activeSources.connected}/${activeSources.total}`
        }
        icon={Activity}
        trendLabel="Connected"
        isLoading={isLoading}
      />
    </div>
  );
}
