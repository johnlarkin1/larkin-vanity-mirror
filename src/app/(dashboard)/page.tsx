"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDateRange } from "@/hooks/use-date-range";
import { useOverviewAnalytics } from "@/hooks/use-overview-analytics";
import {
  HeroMetrics,
  ConnectionStatus,
  ActivityFeed,
  QuickStats,
} from "@/components/dashboard";

export default function DashboardPage() {
  const { dateRange } = useDateRange();
  const { data, isLoading, isFetching, loadingStates, refetchAll } = useOverviewAnalytics({
    dateRange,
  });

  const handleRefresh = () => {
    refetchAll();
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Your personal analytics at a glance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <HeroMetrics metrics={data.metrics} loadingStates={loadingStates} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        <ActivityFeed items={data.activityFeed} loadingStates={loadingStates} isLoading={isLoading} />
        <QuickStats data={data} loadingStates={loadingStates} isLoading={isLoading} />
      </div>

      <ConnectionStatus sources={data.sources} isLoading={isLoading} />
    </div>
  );
}
