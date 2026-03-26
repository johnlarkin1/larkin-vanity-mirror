"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { PostHogAnalyticsData } from "@/lib/posthog";
import type { GitHubReleasesData } from "@/lib/github";

export type { PostHogAnalyticsData, GitHubReleasesData };

export interface OdysseyAnalyticsData {
  website: PostHogAnalyticsData;
  releases: GitHubReleasesData | null;
  appStore: null; // TODO: integrate App Store Connect data (downloads, proceeds, reviews) once Odyssey ships
}

interface OdysseyAnalyticsResponse {
  success: boolean;
  data?: OdysseyAnalyticsData;
  error?: string;
}

interface UseOdysseyAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchOdysseyAnalytics(
  startDate: string,
  endDate: string
): Promise<OdysseyAnalyticsData> {
  const response = await fetch(
    `/api/odyssey/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: OdysseyAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch Odyssey analytics");
  }

  return json.data!;
}

export function useOdysseyAnalytics({
  dateRange,
  enabled = true,
}: UseOdysseyAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["odyssey-analytics", startDate, endDate],
    queryFn: () => fetchOdysseyAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
