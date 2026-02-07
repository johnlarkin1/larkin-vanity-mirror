"use client";

import { Users, Star, Download, Activity } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import type { AggregatedMetrics, LoadingStates } from "@/hooks/use-overview-analytics";

interface HeroMetricsProps {
  metrics: AggregatedMetrics;
  loadingStates?: LoadingStates;
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

export function HeroMetrics({ metrics, loadingStates, isLoading = false }: HeroMetricsProps) {
  const { totalVisitors, githubStars, packageDownloads, activeSources } = metrics;

  // For visitors, we need blog, tennisScorigami, walkInTheParquet, and vanityMirror to be loaded
  const visitorsLoading = loadingStates
    ? loadingStates.blog && loadingStates.tennisScorigami && loadingStates.walkInTheParquet && loadingStates.vanityMirror
    : isLoading;

  // GitHub stars only depends on GitHub
  const githubLoading = loadingStates ? loadingStates.github : isLoading;

  // Package downloads only depends on packages
  const packagesLoading = loadingStates ? loadingStates.packages : isLoading;

  // Data sources status updates progressively as each source loads
  const sourcesLoading = isLoading;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <MetricCard
        title="Total Visitors"
        value={visitorsLoading ? "--" : formatNumber(totalVisitors.value)}
        icon={Users}
        trend={visitorsLoading ? undefined : Math.round(totalVisitors.trend)}
        trendLabel="Across all projects"
        isLoading={visitorsLoading}
      />
      <MetricCard
        title="GitHub Stars"
        value={githubLoading ? "--" : formatNumber(githubStars.value)}
        icon={Star}
        trend={githubLoading ? undefined : githubStars.trend}
        trendLabel={
          githubLoading
            ? "All repositories"
            : `+${githubStars.newThisWeek} this week`
        }
        isLoading={githubLoading}
      />
      <MetricCard
        title="Package Downloads"
        value={packagesLoading ? "--" : formatNumber(packageDownloads.value)}
        icon={Download}
        trend={packagesLoading ? undefined : Math.round(packageDownloads.trend)}
        trendLabel="Total downloads"
        isLoading={packagesLoading}
      />
      <MetricCard
        title="Data Sources"
        value={
          sourcesLoading
            ? "--"
            : `${activeSources.connected}/${activeSources.total}`
        }
        icon={Activity}
        trendLabel="Connected"
        isLoading={sourcesLoading}
      />
    </div>
  );
}
