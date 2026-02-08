// YouTube Data API v3 client for fetching channel and video analytics

import { fetchWithTimeout } from "./fetch-with-timeout";

const API_TIMEOUT = 15000; // 15 seconds
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeConfig {
  apiKey: string;
  channelId: string;
}

function getConfig(): YouTubeConfig {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY environment variable");
  }
  if (!channelId) {
    throw new Error("Missing YOUTUBE_CHANNEL_ID environment variable");
  }

  return { apiKey, channelId };
}

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// YouTube API types
interface YouTubeChannelResponse {
  items: Array<{
    snippet: {
      title: string;
      customUrl?: string;
    };
    statistics: {
      viewCount: string;
      subscriberCount: string;
      videoCount: string;
    };
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  nextPageToken?: string;
  items: Array<{
    contentDetails: {
      videoId: string;
    };
  }>;
}

interface YouTubeVideosResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails: {
        medium?: { url: string };
        default?: { url: string };
      };
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
  }>;
}

// Public interfaces
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
  month: string; // YYYY-MM
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

async function fetchYouTubeApi<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set("key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetchWithTimeout(
    url.toString(),
    { headers: { Accept: "application/json" } },
    API_TIMEOUT
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("YouTube API quota exceeded or access forbidden");
    }
    if (response.status === 401) {
      throw new Error("YouTube API authentication failed. Check your YOUTUBE_API_KEY.");
    }
    if (response.status === 404) {
      throw new Error("YouTube channel not found");
    }
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function fetchChannelInfo(
  channelId: string,
  apiKey: string
): Promise<{
  title: string;
  customUrl: string | undefined;
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  uploadsPlaylistId: string;
}> {
  const data = await fetchYouTubeApi<YouTubeChannelResponse>("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelId,
  }, apiKey);

  if (!data.items || data.items.length === 0) {
    throw new Error("YouTube channel not found");
  }

  const channel = data.items[0];
  return {
    title: channel.snippet.title,
    customUrl: channel.snippet.customUrl,
    viewCount: parseInt(channel.statistics.viewCount, 10),
    subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
    videoCount: parseInt(channel.statistics.videoCount, 10),
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
  };
}

async function fetchAllVideoIds(
  uploadsPlaylistId: string,
  apiKey: string
): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  while (true) {
    const params: Record<string, string> = {
      part: "contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await fetchYouTubeApi<YouTubePlaylistItemsResponse>(
      "playlistItems",
      params,
      apiKey
    );

    for (const item of data.items) {
      videoIds.push(item.contentDetails.videoId);
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return videoIds;
}

async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];

  // Batch in groups of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await fetchYouTubeApi<YouTubeVideosResponse>("videos", {
      part: "snippet,statistics",
      id: batch.join(","),
    }, apiKey);

    for (const item of data.items) {
      videos.push({
        id: item.id,
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        thumbnailUrl:
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          "",
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
        likeCount: parseInt(item.statistics.likeCount ?? "0", 10),
        commentCount: parseInt(item.statistics.commentCount ?? "0", 10),
      });
    }
  }

  return videos;
}

function computeViewsByMonth(videos: YouTubeVideo[]): ViewsByMonthPoint[] {
  const monthMap = new Map<string, { views: number; videoCount: number }>();

  for (const video of videos) {
    const date = new Date(video.publishedAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(month) ?? { views: 0, videoCount: 0 };
    existing.views += video.viewCount;
    existing.videoCount += 1;
    monthMap.set(month, existing);
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, views: data.views, videoCount: data.videoCount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function fetchYouTubeAnalytics(): Promise<YouTubeAnalyticsData> {
  const { apiKey, channelId } = getConfig();

  const cacheKey = `youtube-analytics:${channelId}`;
  const cached = getCached<YouTubeAnalyticsData>(cacheKey);
  if (cached) return cached;

  // 1. Fetch channel info
  const channel = await fetchChannelInfo(channelId, apiKey);

  // 2. Fetch all video IDs from uploads playlist
  const videoIds = await fetchAllVideoIds(channel.uploadsPlaylistId, apiKey);

  // 3. Fetch video details in batches
  const videos = await fetchVideoDetails(videoIds, apiKey);

  // Sort by views descending
  videos.sort((a, b) => b.viewCount - a.viewCount);

  // 4. Compute views by publish month
  const viewsByMonth = computeViewsByMonth(videos);

  const channelUrl = channel.customUrl
    ? `https://www.youtube.com/${channel.customUrl}`
    : `https://www.youtube.com/channel/${channelId}`;

  const data: YouTubeAnalyticsData = {
    metrics: {
      totalViews: channel.viewCount,
      subscribers: channel.subscriberCount,
      totalVideos: channel.videoCount,
      channelTitle: channel.title,
      channelUrl,
    },
    videos,
    viewsByMonth,
  };

  setCache(cacheKey, data);
  return data;
}
