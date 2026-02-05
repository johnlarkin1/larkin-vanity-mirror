"use client";

import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";

export type PackageRegistry = "npm" | "pypi" | "crates";

export interface PackageDownloads {
  name: string;
  registry: PackageRegistry;
  totalDownloads: number;
  weeklyDownloads: number;
  monthlyDownloads: number;
  dailyDownloads: Array<{ date: string; downloads: number }>;
  url: string;
}

export interface PackagesAnalyticsData {
  metrics: {
    totalDownloads: number;
    weeklyDownloads: number;
    packageCount: number;
    weeklyTrend: number;
  };
  packages: PackageDownloads[];
  timeSeries: Array<{ date: string; npm: number; pypi: number; crates: number }>;
  topPackage: { name: string; registry: PackageRegistry; weeklyDownloads: number } | null;
}

interface PackagesAnalyticsResponse {
  success: boolean;
  data?: PackagesAnalyticsData;
  error?: string;
}

interface UsePackagesAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function fetchPackagesAnalytics(dateRange: DateRange): Promise<PackagesAnalyticsData> {
  const params = new URLSearchParams();
  if (dateRange.from) {
    params.set("startDate", formatDate(dateRange.from));
  }
  if (dateRange.to) {
    params.set("endDate", formatDate(dateRange.to));
  }

  const response = await fetch(`/api/packages/analytics?${params.toString()}`);
  const json: PackagesAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch packages analytics");
  }

  return json.data!;
}

export function usePackagesAnalytics({ dateRange, enabled = true }: UsePackagesAnalyticsOptions) {
  return useQuery({
    queryKey: [
      "packages-analytics",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () => fetchPackagesAnalytics(dateRange),
    enabled: enabled && !!dateRange.from && !!dateRange.to,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
