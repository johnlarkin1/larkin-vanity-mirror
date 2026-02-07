"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { BlogAnalyticsData } from "./use-blog-analytics";

interface VanityMirrorAnalyticsResponse {
  success: boolean;
  data?: BlogAnalyticsData;
  error?: string;
}

interface UseVanityMirrorAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchVanityMirrorAnalytics(startDate: string, endDate: string): Promise<BlogAnalyticsData> {
  const response = await fetch(
    `/api/vanity-mirror/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: VanityMirrorAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch vanity mirror analytics");
  }

  return json.data!;
}

export function useVanityMirrorAnalytics({ dateRange, enabled = true }: UseVanityMirrorAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["vanity-mirror-analytics", startDate, endDate],
    queryFn: () => fetchVanityMirrorAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}
