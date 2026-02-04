"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

// Re-export types from lib for page consumption
export interface MetricWithTrend {
  value: number;
  previousValue: number;
  trend: number;
}

export interface PostHogTimeSeriesPoint {
  date: string;
  visitors: number;
  uniqueVisitors: number;
  [key: string]: string | number;
}

export interface ActiveUsersMetrics {
  dau: number;
  wau: number;
  mau: number;
}

export interface TopEvent {
  eventName: string;
  count: number;
  uniqueUsers: number;
}

export interface TennisScorigamiAnalyticsData {
  metrics: {
    visitors: MetricWithTrend;
    uniqueVisitors: MetricWithTrend;
    totalEvents: MetricWithTrend;
    avgSessionDuration: MetricWithTrend;
  };
  activeUsers: ActiveUsersMetrics;
  timeSeries: PostHogTimeSeriesPoint[];
  topEvents: TopEvent[];
}

interface TennisScorigamiAnalyticsResponse {
  success: boolean;
  data?: TennisScorigamiAnalyticsData;
  error?: string;
}

interface UseTennisScorigamiAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchTennisScorigamiAnalytics(
  startDate: string,
  endDate: string
): Promise<TennisScorigamiAnalyticsData> {
  const response = await fetch(
    `/api/tennis-scorigami/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: TennisScorigamiAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch tennis scorigami analytics");
  }

  return json.data!;
}

export function useTennisScorigamiAnalytics({
  dateRange,
  enabled = true,
}: UseTennisScorigamiAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["tennis-scorigami-analytics", startDate, endDate],
    queryFn: () => fetchTennisScorigamiAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Preserve rate limit - don't retry too many times
  });
}
