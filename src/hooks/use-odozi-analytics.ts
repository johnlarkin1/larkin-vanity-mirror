"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { PostHogAnalyticsData } from "@/lib/posthog";
import type { GitHubReleasesData } from "@/lib/github";
import type { AppStoreAnalyticsData } from "@/lib/app-store-connect";

export type { PostHogAnalyticsData, GitHubReleasesData, AppStoreAnalyticsData };

export interface OdoziAnalyticsData {
  website: PostHogAnalyticsData;
  releases: GitHubReleasesData | null;
  appStore: AppStoreAnalyticsData | null;
}

interface OdoziAnalyticsResponse {
  success: boolean;
  data?: OdoziAnalyticsData;
  error?: string;
}

interface UseOdoziAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchOdoziAnalytics(
  startDate: string,
  endDate: string
): Promise<OdoziAnalyticsData> {
  const response = await fetch(
    `/api/odozi/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: OdoziAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch Odozi analytics");
  }

  return json.data!;
}

export function useOdoziAnalytics({
  dateRange,
  enabled = true,
}: UseOdoziAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["odozi-analytics", startDate, endDate],
    queryFn: () => fetchOdoziAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
