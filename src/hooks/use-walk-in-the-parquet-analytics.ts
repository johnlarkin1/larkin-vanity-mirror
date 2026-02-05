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
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface CustomerReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  reviewerNickname: string;
  createdDate: string;
  territory: string;
}

export interface DocumentationAnalytics {
  metrics: {
    visitors: MetricWithTrend;
    uniqueVisitors: MetricWithTrend;
    avgSessionDuration: MetricWithTrend;
    avgUsersPerDay: MetricWithTrend;
  };
  timeSeries: TimeSeriesPoint[];
  topPages: TopPage[];
}

export interface AppStoreAnalytics {
  sales: {
    totalDownloads: MetricWithTrend;
    weeklyDownloads: MetricWithTrend;
    totalRevenue: MetricWithTrend;
    weeklyRevenue: MetricWithTrend;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    recentReviews: CustomerReview[];
  };
  downloadTrends: Array<{
    date: string;
    downloads: number;
    revenue: number;
  }>;
}

export interface WalkInTheParquetAnalyticsData {
  documentation: DocumentationAnalytics | null;
  appStore: AppStoreAnalytics | null;
}

interface AnalyticsResponse {
  success: boolean;
  data?: WalkInTheParquetAnalyticsData;
  error?: string;
}

interface UseWalkInTheParquetAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

async function fetchAnalytics(
  startDate: string,
  endDate: string
): Promise<WalkInTheParquetAnalyticsData> {
  const response = await fetch(
    `/api/walk-in-the-parquet/analytics?startDate=${startDate}&endDate=${endDate}`
  );

  const json: AnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch Walk in the Parquet analytics");
  }

  return json.data!;
}

export function useWalkInTheParquetAnalytics({
  dateRange,
  enabled = true,
}: UseWalkInTheParquetAnalyticsOptions) {
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  return useQuery({
    queryKey: ["walk-in-the-parquet-analytics", startDate, endDate],
    queryFn: () => fetchAnalytics(startDate!, endDate!),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
