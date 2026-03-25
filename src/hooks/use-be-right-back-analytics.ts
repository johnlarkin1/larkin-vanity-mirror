"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { PostHogAnalyticsData } from "@/lib/posthog";
import type { GitHubReleasesData } from "@/lib/github";

export type { PostHogAnalyticsData, GitHubReleasesData };

export interface BeRightBackAnalyticsData {
  website: PostHogAnalyticsData;
  downloads: GitHubReleasesData | null;
}

interface BeRightBackAnalyticsResponse {
  success: boolean;
  data?: BeRightBackAnalyticsData;
  error?: string;
}

interface UseBeRightBackAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchBeRightBackAnalytics(
  startDate: string,
  endDate: string
): Promise<BeRightBackAnalyticsData> {
  const response = await fetch(
    `/api/be-right-back/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: BeRightBackAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch Be Right Back analytics");
  }

  return json.data!;
}

export function useBeRightBackAnalytics({
  dateRange,
  enabled = true,
}: UseBeRightBackAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["be-right-back-analytics", startDate, endDate],
    queryFn: () => fetchBeRightBackAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
