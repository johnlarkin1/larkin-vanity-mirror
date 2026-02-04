"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

export interface MetricWithTrend {
  value: number;
  previousValue: number;
  trend: number;
}

export interface TimeSeriesPoint {
  date: string;
  visitors: number;
  uniqueVisitors: number;
  [key: string]: string | number;
}

export interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageviews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number; // in seconds
  bounceRate: number; // as percentage 0-100
}

export interface BlogAnalyticsData {
  metrics: {
    visitors: MetricWithTrend;
    uniqueVisitors: MetricWithTrend;
    avgSessionDuration: MetricWithTrend;
    avgUsersPerDay: MetricWithTrend;
  };
  timeSeries: TimeSeriesPoint[];
  topPages: TopPage[];
}

interface BlogAnalyticsResponse {
  success: boolean;
  data?: BlogAnalyticsData;
  error?: string;
}

interface UseBlogAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchBlogAnalytics(startDate: string, endDate: string): Promise<BlogAnalyticsData> {
  const response = await fetch(
    `/api/blog/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: BlogAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch blog analytics");
  }

  return json.data!;
}

export function useBlogAnalytics({ dateRange, enabled = true }: UseBlogAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["blog-analytics", startDate, endDate],
    queryFn: () => fetchBlogAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}
