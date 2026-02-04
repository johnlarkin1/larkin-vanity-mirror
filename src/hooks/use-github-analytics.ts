"use client";

import { useQuery } from "@tanstack/react-query";

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  watchers: number;
  language: string | null;
  isArchived: boolean;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface StarHistoryPoint {
  date: string;
  totalStars: number;
  newStars: number;
}

export interface GitHubAnalyticsData {
  metrics: {
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    repoCount: number;
    newStarsThisWeek: number;
    starsTrend: number;
  };
  repositories: GitHubRepository[];
  starHistory: StarHistoryPoint[];
}

interface GitHubAnalyticsResponse {
  success: boolean;
  data?: GitHubAnalyticsData;
  error?: string;
}

interface UseGitHubAnalyticsOptions {
  enabled?: boolean;
}

async function fetchGitHubAnalytics(): Promise<GitHubAnalyticsData> {
  const response = await fetch("/api/github/analytics");
  const json: GitHubAnalyticsResponse = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Failed to fetch GitHub analytics");
  }

  return json.data!;
}

export function useGitHubAnalytics({ enabled = true }: UseGitHubAnalyticsOptions = {}) {
  return useQuery({
    queryKey: ["github-analytics"],
    queryFn: fetchGitHubAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (higher due to rate limits)
    retry: 1, // Lower to avoid burning rate limit
  });
}
