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
import { useVanityMirrorAnalytics } from "./use-vanity-mirror-analytics";
import { useYouTubeAnalytics, type YouTubeAnalyticsData } from "./use-youtube-analytics";
import { useOdoziAnalytics, type OdoziAnalyticsData } from "./use-odozi-analytics";
import { useAfueraAnalytics, type AfueraAnalyticsData } from "./use-afuera-analytics";
import {
  useBeRightBackAnalytics,
  type BeRightBackAnalyticsData,
} from "./use-be-right-back-analytics";

export type SourceStatus = "connected" | "error" | "loading" | "not-configured";

export type DataSource =
  | "blog"
  | "github"
  | "youtube"
  | "packages"
  | "tennis-scorigami"
  | "walk-in-the-parquet"
  | "vanity-mirror"
  | "odozi"
  | "afuera"
  | "be-right-back";

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

export interface LoadingStates {
  blog: boolean;
  github: boolean;
  youtube: boolean;
  packages: boolean;
  tennisScorigami: boolean;
  walkInTheParquet: boolean;
  vanityMirror: boolean;
  odozi: boolean;
  afuera: boolean;
  beRightBack: boolean;
}

export interface OverviewAnalyticsData {
  metrics: AggregatedMetrics;
  sources: SourceInfo[];
  activityFeed: ActivityItem[];
  rawData: {
    blog: BlogAnalyticsData | null;
    github: GitHubAnalyticsData | null;
    youtube: YouTubeAnalyticsData | null;
    packages: PackagesAnalyticsData | null;
    tennisScorigami: TennisScorigamiAnalyticsData | null;
    walkInTheParquet: WalkInTheParquetAnalyticsData | null;
    vanityMirror: BlogAnalyticsData | null;
    odozi: OdoziAnalyticsData | null;
    afuera: AfueraAnalyticsData | null;
    beRightBack: BeRightBackAnalyticsData | null;
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
  const youtubeQuery = useYouTubeAnalytics({ enabled });
  const packagesQuery = usePackagesAnalytics({ dateRange, enabled });
  const tennisScorigamiQuery = useTennisScorigamiAnalytics({ dateRange, enabled });
  const walkInTheParquetQuery = useWalkInTheParquetAnalytics({ dateRange, enabled });
  const vanityMirrorQuery = useVanityMirrorAnalytics({ dateRange, enabled });
  const odoziQuery = useOdoziAnalytics({ dateRange, enabled });
  const afueraQuery = useAfueraAnalytics({ dateRange, enabled });
  const beRightBackQuery = useBeRightBackAnalytics({ dateRange, enabled });

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
        id: "youtube",
        name: "YouTube Data API",
        description: "Video analytics",
        status: getSourceStatus(youtubeQuery),
        href: "/youtube",
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
        description: "Tennis Scorigami (tennis-scorigami.com)",
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
      {
        id: "vanity-mirror",
        name: "Google Analytics",
        description: "This dashboard",
        status: getSourceStatus(vanityMirrorQuery),
        href: "/vanity-mirror",
      },
      {
        id: "odozi",
        name: "PostHog",
        description: "Odozi (odozi.app)",
        status: getSourceStatus(odoziQuery),
        href: "/odozi",
      },
      {
        id: "afuera",
        name: "PostHog",
        description: "Afuera (afuera.app)",
        status: getSourceStatus(afueraQuery),
        href: "/afuera",
      },
      {
        id: "be-right-back",
        name: "PostHog + GitHub",
        description: "Be Right Back",
        status: getSourceStatus(beRightBackQuery),
        href: "/be-right-back",
      },
    ];
  }, [blogQuery, githubQuery, youtubeQuery, packagesQuery, tennisScorigamiQuery, walkInTheParquetQuery, vanityMirrorQuery, odoziQuery, afueraQuery, beRightBackQuery]);

  // Compute aggregated metrics
  const metrics = useMemo((): AggregatedMetrics => {
    const blog = blogQuery.data;
    const github = githubQuery.data;
    const packages = packagesQuery.data;
    const tennisScorigami = tennisScorigamiQuery.data;
    const walkInTheParquet = walkInTheParquetQuery.data;
    const vanityMirror = vanityMirrorQuery.data;
    const odozi = odoziQuery.data;
    const afuera = afueraQuery.data;
    const beRightBack = beRightBackQuery.data;

    // Total visitors from all visitor sources
    const totalVisitors =
      (blog?.metrics.visitors.value ?? 0) +
      (tennisScorigami?.metrics.visitors.value ?? 0) +
      (walkInTheParquet?.documentation?.metrics.visitors.value ?? 0) +
      (vanityMirror?.metrics.visitors.value ?? 0) +
      (odozi?.website.metrics.visitors.value ?? 0) +
      (afuera?.website.metrics.visitors.value ?? 0) +
      (beRightBack?.website.metrics.visitors.value ?? 0);

    const visitorTrend = computeWeightedTrend([
      blog?.metrics.visitors,
      tennisScorigami?.metrics.visitors,
      walkInTheParquet?.documentation?.metrics.visitors,
      vanityMirror?.metrics.visitors,
      odozi?.website.metrics.visitors,
      afuera?.website.metrics.visitors,
      beRightBack?.website.metrics.visitors,
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
    vanityMirrorQuery.data,
    odoziQuery.data,
    afueraQuery.data,
    beRightBackQuery.data,
    sources,
  ]);

  // Build activity feed
  const activityFeed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    const blog = blogQuery.data;
    const github = githubQuery.data;
    const youtube = youtubeQuery.data;
    const packages = packagesQuery.data;
    const tennisScorigami = tennisScorigamiQuery.data;
    const walkInTheParquet = walkInTheParquetQuery.data;
    const odozi = odoziQuery.data;
    const afuera = afueraQuery.data;
    const beRightBack = beRightBackQuery.data;

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

    // Top YouTube videos
    if (youtube?.videos) {
      youtube.videos.slice(0, 3).forEach((video, i) => {
        items.push({
          id: `youtube-video-${i}`,
          source: "youtube",
          type: "video",
          title: video.title,
          description: `${video.viewCount.toLocaleString()} views`,
          timestamp: new Date(video.publishedAt),
          value: video.viewCount,
          href: video.url,
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

    // Odozi top events
    if (odozi?.website.topEvents) {
      odozi.website.topEvents.slice(0, 2).forEach((event, i) => {
        items.push({
          id: `odozi-event-${i}`,
          source: "odozi",
          type: "event",
          title: event.eventName,
          description: `${event.count.toLocaleString()} occurrences (Odozi)`,
          value: event.count,
        });
      });
    }

    // Afuera top events
    if (afuera?.website.topEvents) {
      afuera.website.topEvents.slice(0, 2).forEach((event, i) => {
        items.push({
          id: `afuera-event-${i}`,
          source: "afuera",
          type: "event",
          title: event.eventName,
          description: `${event.count.toLocaleString()} occurrences (Afuera)`,
          value: event.count,
        });
      });
    }

    // Be Right Back downloads
    if (beRightBack?.downloads && beRightBack.downloads.totalDownloads > 0) {
      items.push({
        id: "brb-downloads",
        source: "be-right-back",
        type: "downloads",
        title: `Be Right Back ${beRightBack.downloads.latestVersion ?? ""}`,
        description: `${beRightBack.downloads.totalDownloads.toLocaleString()} total downloads`,
        value: beRightBack.downloads.totalDownloads,
      });
    }

    // Sort by value (importance) and take top 10
    return items
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 10);
  }, [
    blogQuery.data,
    githubQuery.data,
    youtubeQuery.data,
    packagesQuery.data,
    tennisScorigamiQuery.data,
    walkInTheParquetQuery.data,
    odoziQuery.data,
    afueraQuery.data,
    beRightBackQuery.data,
  ]);

  // Per-source loading states for progressive rendering
  const loadingStates = useMemo((): LoadingStates => ({
    blog: blogQuery.isLoading,
    github: githubQuery.isLoading,
    youtube: youtubeQuery.isLoading,
    packages: packagesQuery.isLoading,
    tennisScorigami: tennisScorigamiQuery.isLoading,
    walkInTheParquet: walkInTheParquetQuery.isLoading,
    vanityMirror: vanityMirrorQuery.isLoading,
    odozi: odoziQuery.isLoading,
    afuera: afueraQuery.isLoading,
    beRightBack: beRightBackQuery.isLoading,
  }), [
    blogQuery.isLoading,
    githubQuery.isLoading,
    youtubeQuery.isLoading,
    packagesQuery.isLoading,
    tennisScorigamiQuery.isLoading,
    walkInTheParquetQuery.isLoading,
    vanityMirrorQuery.isLoading,
    odoziQuery.isLoading,
    afueraQuery.isLoading,
    beRightBackQuery.isLoading,
  ]);

  // Unified loading state - true only when ALL sources are loading
  const isLoading =
    blogQuery.isLoading &&
    githubQuery.isLoading &&
    youtubeQuery.isLoading &&
    packagesQuery.isLoading &&
    tennisScorigamiQuery.isLoading &&
    walkInTheParquetQuery.isLoading &&
    vanityMirrorQuery.isLoading &&
    odoziQuery.isLoading &&
    afueraQuery.isLoading &&
    beRightBackQuery.isLoading;

  // True if any source is still fetching
  const isFetching =
    blogQuery.isFetching ||
    githubQuery.isFetching ||
    youtubeQuery.isFetching ||
    packagesQuery.isFetching ||
    tennisScorigamiQuery.isFetching ||
    walkInTheParquetQuery.isFetching ||
    vanityMirrorQuery.isFetching ||
    odoziQuery.isFetching ||
    afueraQuery.isFetching ||
    beRightBackQuery.isFetching;

  // Refetch all function
  const refetchAll = useCallback(async () => {
    await Promise.all([
      blogQuery.refetch(),
      githubQuery.refetch(),
      youtubeQuery.refetch(),
      packagesQuery.refetch(),
      tennisScorigamiQuery.refetch(),
      walkInTheParquetQuery.refetch(),
      vanityMirrorQuery.refetch(),
      odoziQuery.refetch(),
      afueraQuery.refetch(),
      beRightBackQuery.refetch(),
    ]);
  }, [blogQuery, githubQuery, youtubeQuery, packagesQuery, tennisScorigamiQuery, walkInTheParquetQuery, vanityMirrorQuery, odoziQuery, afueraQuery, beRightBackQuery]);

  const data: OverviewAnalyticsData = useMemo(
    () => ({
      metrics,
      sources,
      activityFeed,
      rawData: {
        blog: blogQuery.data ?? null,
        github: githubQuery.data ?? null,
        youtube: youtubeQuery.data ?? null,
        packages: packagesQuery.data ?? null,
        tennisScorigami: tennisScorigamiQuery.data ?? null,
        walkInTheParquet: walkInTheParquetQuery.data ?? null,
        vanityMirror: vanityMirrorQuery.data ?? null,
        odozi: odoziQuery.data ?? null,
        afuera: afueraQuery.data ?? null,
        beRightBack: beRightBackQuery.data ?? null,
      },
    }),
    [
      metrics,
      sources,
      activityFeed,
      blogQuery.data,
      githubQuery.data,
      youtubeQuery.data,
      packagesQuery.data,
      tennisScorigamiQuery.data,
      walkInTheParquetQuery.data,
      vanityMirrorQuery.data,
      odoziQuery.data,
      afueraQuery.data,
      beRightBackQuery.data,
    ]
  );

  return {
    data,
    isLoading,
    isFetching,
    loadingStates,
    refetchAll,
  };
}
