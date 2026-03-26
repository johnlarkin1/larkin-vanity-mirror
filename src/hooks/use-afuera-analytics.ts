"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { PostHogAnalyticsData } from "@/lib/posthog";

export type { PostHogAnalyticsData };

export interface AfueraAnalyticsData {
  website: PostHogAnalyticsData;
  appStore: null;  // TODO: integrate App Store Connect data once Afuera ships
  signups: null;   // TODO: add signup tracking (PostHog custom events or Clerk API)
}

interface AfueraAnalyticsResponse {
  success: boolean;
  data?: AfueraAnalyticsData;
  error?: string;
}

interface UseAfueraAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchAfueraAnalytics(
  startDate: string,
  endDate: string
): Promise<AfueraAnalyticsData> {
  const response = await fetch(
    `/api/afuera/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: AfueraAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch Afuera analytics");
  }

  return json.data!;
}

export function useAfueraAnalytics({
  dateRange,
  enabled = true,
}: UseAfueraAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["afuera-analytics", startDate, endDate],
    queryFn: () => fetchAfueraAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
