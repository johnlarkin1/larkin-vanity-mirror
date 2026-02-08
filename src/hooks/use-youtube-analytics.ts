"use client";

import { useQuery } from "@tanstack/react-query";

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface ViewsByMonthPoint {
  month: string;
  views: number;
  videoCount: number;
}

export interface YouTubeAnalyticsData {
  metrics: {
    totalViews: number;
    subscribers: number;
    totalVideos: number;
    channelTitle: string;
    channelUrl: string;
  };
  videos: YouTubeVideo[];
  viewsByMonth: ViewsByMonthPoint[];
}

interface YouTubeAnalyticsResponse {
  success: boolean;
  data?: YouTubeAnalyticsData;
  error?: string;
}

interface UseYouTubeAnalyticsOptions {
  enabled?: boolean;
}

async function fetchYouTubeAnalytics(): Promise<YouTubeAnalyticsData> {
  const response = await fetch("/api/youtube/analytics");
  const json: YouTubeAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch YouTube analytics");
  }

  return json.data!;
}

export function useYouTubeAnalytics({ enabled = true }: UseYouTubeAnalyticsOptions = {}) {
  return useQuery({
    queryKey: ["youtube-analytics"],
    queryFn: fetchYouTubeAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
