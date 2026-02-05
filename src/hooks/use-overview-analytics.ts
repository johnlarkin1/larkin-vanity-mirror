"use client";

import { useMemo, useCallback } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";

import { useBlogAnalytics, type BlogAnalyticsData } from "./use-blog-analytics";
import { useGitHubAnalytics, type GitHubAnalyticsData } from "./use-github-analytics";
import { usePackagesAnalytics, type PackagesAnalyticsData } from "./use-packages-analytics";
import {
  useTennisScorigamiAnalytics,
  type TennisScorigamiAnalyticsData,
} from "./use-tennis-scorigami-analytics";
import {
  useWalkInTheParquetAnalytics,
  type WalkInTheParquetAnalyticsData,
} from "./use-walk-in-the-parquet-analytics";

export type SourceStatus = "connected" | "error" | "loading" | "not-configured";

export type DataSource =
  | "blog"
  | "github"
  | "packages"
  | "tennis-scorigami"
  | "walk-in-the-parquet";

export interface SourceInfo {
  id: DataSource;
  name: string;
  description: string;
  status: SourceStatus;
  href: string;
}

export interface AggregatedMetrics {
  totalVisitors: {
    value: number;
    trend: number;
  };
  githubStars: {
    value: number;
    newThisWeek: number;
    trend: number;
  };
  packageDownloads: {
    value: number;
    trend: number;
  };
  activeSources: {
    connected: number;
    total: number;
  };
}

export interface ActivityItem {
  id: string;
  source: DataSource;
  type: string;
  title: string;
  description?: string;
  timestamp?: Date;
  value?: number;
  href?: string;
}

export interface OverviewAnalyticsData {
  metrics: AggregatedMetrics;
  sources: SourceInfo[];
  activityFeed: ActivityItem[];
  rawData: {
    blog: BlogAnalyticsData | null;
    github: GitHubAnalyticsData | null;
    packages: PackagesAnalyticsData | null;
    tennisScorigami: TennisScorigamiAnalyticsData | null;
    walkInTheParquet: WalkInTheParquetAnalyticsData | null;
  };
}

interface UseOverviewAnalyticsOptions {
  dateRange: DateRange;
  enabled?: boolean;
}

function getSourceStatus(query: UseQueryResult<unknown, Error>): SourceStatus {
  if (query.isLoading || query.isFetching) return "loading";
  if (query.isError) {
    const msg = query.error?.message ?? "";
    if (
      msg.toLowerCase().includes("not configured") ||
      msg.toLowerCase().includes("missing") ||
      msg.toLowerCase().includes("environment")
    ) {
      return "not-configured";
    }
    return "error";
  }
  if (query.data) return "connected";
  return "not-configured";
}

function computeWeightedTrend(
  metrics: Array<{ value: number; trend: number } | undefined | null>
): number {
  const validMetrics = metrics.filter(
    (m): m is { value: number; trend: number } => m !== null && m !== undefined
  );

  if (validMetrics.length === 0) return 0;

  const totalValue = validMetrics.reduce((sum, m) => sum + m.value, 0);
  if (totalValue === 0) return 0;

  // Weight each trend by its contribution to total
  const weightedTrend = validMetrics.reduce((sum, m) => {
    const weight = m.value / totalValue;
    return sum + m.trend * weight;
  }, 0);

  return Math.round(weightedTrend * 10) / 10;
}

export function useOverviewAnalytics({
  dateRange,
  enabled = true,
}: UseOverviewAnalyticsOptions) {
  // Fetch all data sources
  const blogQuery = useBlogAnalytics({ dateRange, enabled });
  const githubQuery = useGitHubAnalytics({ enabled });
  const packagesQuery = usePackagesAnalytics({ dateRange, enabled });
  const tennisScorigamiQuery = useTennisScorigamiAnalytics({ dateRange, enabled });
  const walkInTheParquetQuery = useWalkInTheParquetAnalytics({ dateRange, enabled });

  // Compute source statuses
  const sources = useMemo((): SourceInfo[] => {
    return [
      {
        id: "blog",
        name: "Google Analytics",
        description: "Blog metrics",
        status: getSourceStatus(blogQuery),
        href: "/blog",
      },
      {
        id: "github",
        name: "GitHub API",
        description: "Star tracking",
        status: getSourceStatus(githubQuery),
        href: "/github",
      },
      {
        id: "packages",
        name: "npm/PyPI/crates.io",
        description: "Package downloads",
        status: getSourceStatus(packagesQuery),
        href: "/published-packages",
      },
      {
        id: "tennis-scorigami",
        name: "PostHog",
        description: "Tennis Scorigami",
        status: getSourceStatus(tennisScorigamiQuery),
        href: "/tennis-scorigami",
      },
      {
        id: "walk-in-the-parquet",
        name: "GA + App Store",
        description: "Walk in the Parquet",
        status: getSourceStatus(walkInTheParquetQuery),
        href: "/walk-in-the-parquet",
      },
    ];
  }, [blogQuery, githubQuery, packagesQuery, tennisScorigamiQuery, walkInTheParquetQuery]);

  // Compute aggregated metrics
  const metrics = useMemo((): AggregatedMetrics => {
    const blog = blogQuery.data;
    const github = githubQuery.data;
    const packages = packagesQuery.data;
    const tennisScorigami = tennisScorigamiQuery.data;
    const walkInTheParquet = walkInTheParquetQuery.data;

    // Total visitors from all visitor sources
    const totalVisitors =
      (blog?.metrics.visitors.value ?? 0) +
      (tennisScorigami?.metrics.visitors.value ?? 0) +
      (walkInTheParquet?.documentation?.metrics.visitors.value ?? 0);

    const visitorTrend = computeWeightedTrend([
      blog?.metrics.visitors,
      tennisScorigami?.metrics.visitors,
      walkInTheParquet?.documentation?.metrics.visitors,
    ]);

    // GitHub stars
    const githubStars = github?.metrics.totalStars ?? 0;
    const newStarsThisWeek = github?.metrics.newStarsThisWeek ?? 0;
    const starsTrend = github?.metrics.starsTrend ?? 0;

    // Package downloads
    const packageDownloads = packages?.metrics.totalDownloads ?? 0;
    const downloadsTrend = packages?.metrics.weeklyTrend ?? 0;

    // Active sources count
    const connectedSources = sources.filter((s) => s.status === "connected").length;

    return {
      totalVisitors: {
        value: totalVisitors,
        trend: visitorTrend,
      },
      githubStars: {
        value: githubStars,
        newThisWeek: newStarsThisWeek,
        trend: starsTrend,
      },
      packageDownloads: {
        value: packageDownloads,
        trend: downloadsTrend,
      },
      activeSources: {
        connected: connectedSources,
        total: sources.length,
      },
    };
  }, [
    blogQuery.data,
    githubQuery.data,
    packagesQuery.data,
    tennisScorigamiQuery.data,
    walkInTheParquetQuery.data,
    sources,
  ]);

  // Build activity feed
  const activityFeed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    const blog = blogQuery.data;
    const github = githubQuery.data;
    const packages = packagesQuery.data;
    const tennisScorigami = tennisScorigamiQuery.data;
    const walkInTheParquet = walkInTheParquetQuery.data;

    // Top blog posts
    if (blog?.topPages) {
      blog.topPages.slice(0, 3).forEach((page, i) => {
        items.push({
          id: `blog-page-${i}`,
          source: "blog",
          type: "top-page",
          title: page.pageTitle || page.pagePath,
          description: `${page.pageviews.toLocaleString()} views`,
          value: page.pageviews,
          href: page.pagePath,
        });
      });
    }

    // Recent GitHub activity (most starred repos)
    if (github?.repositories) {
      github.repositories
        .filter((repo) => !repo.isArchived)
        .slice(0, 3)
        .forEach((repo, i) => {
          items.push({
            id: `github-repo-${i}`,
            source: "github",
            type: "repository",
            title: repo.name,
            description: `${repo.stars} stars`,
            timestamp: repo.pushedAt ? new Date(repo.pushedAt) : undefined,
            value: repo.stars,
            href: repo.url,
          });
        });
    }

    // Top packages
    if (packages?.packages) {
      packages.packages.slice(0, 3).forEach((pkg, i) => {
        items.push({
          id: `package-${i}`,
          source: "packages",
          type: "package",
          title: pkg.name,
          description: `${pkg.weeklyDownloads.toLocaleString()}/week on ${pkg.registry}`,
          value: pkg.weeklyDownloads,
          href: pkg.url,
        });
      });
    }

    // Tennis Scorigami top events
    if (tennisScorigami?.topEvents) {
      tennisScorigami.topEvents.slice(0, 2).forEach((event, i) => {
        items.push({
          id: `tennis-event-${i}`,
          source: "tennis-scorigami",
          type: "event",
          title: event.eventName,
          description: `${event.count.toLocaleString()} occurrences`,
          value: event.count,
        });
      });
    }

    // Walk in the Parquet reviews
    if (walkInTheParquet?.appStore?.reviews?.recentReviews) {
      walkInTheParquet.appStore.reviews.recentReviews.slice(0, 2).forEach((review, i) => {
        items.push({
          id: `review-${i}`,
          source: "walk-in-the-parquet",
          type: "review",
          title: review.title,
          description: `${"★".repeat(review.rating)} by ${review.reviewerNickname}`,
          timestamp: new Date(review.createdDate),
        });
      });
    }

    // Sort by value (importance) and take top 10
    return items
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 10);
  }, [
    blogQuery.data,
    githubQuery.data,
    packagesQuery.data,
    tennisScorigamiQuery.data,
    walkInTheParquetQuery.data,
  ]);

  // Unified loading state
  const isLoading =
    blogQuery.isLoading ||
    githubQuery.isLoading ||
    packagesQuery.isLoading ||
    tennisScorigamiQuery.isLoading ||
    walkInTheParquetQuery.isLoading;

  const isFetching =
    blogQuery.isFetching ||
    githubQuery.isFetching ||
    packagesQuery.isFetching ||
    tennisScorigamiQuery.isFetching ||
    walkInTheParquetQuery.isFetching;

  // Refetch all function
  const refetchAll = useCallback(async () => {
    await Promise.all([
      blogQuery.refetch(),
      githubQuery.refetch(),
      packagesQuery.refetch(),
      tennisScorigamiQuery.refetch(),
      walkInTheParquetQuery.refetch(),
    ]);
  }, [blogQuery, githubQuery, packagesQuery, tennisScorigamiQuery, walkInTheParquetQuery]);

  const data: OverviewAnalyticsData = useMemo(
    () => ({
      metrics,
      sources,
      activityFeed,
      rawData: {
        blog: blogQuery.data ?? null,
        github: githubQuery.data ?? null,
        packages: packagesQuery.data ?? null,
        tennisScorigami: tennisScorigamiQuery.data ?? null,
        walkInTheParquet: walkInTheParquetQuery.data ?? null,
      },
    }),
    [
      metrics,
      sources,
      activityFeed,
      blogQuery.data,
      githubQuery.data,
      packagesQuery.data,
      tennisScorigamiQuery.data,
      walkInTheParquetQuery.data,
    ]
  );

  return {
    data,
    isLoading,
    isFetching,
    refetchAll,
  };
}
