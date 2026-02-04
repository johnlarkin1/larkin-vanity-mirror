// PostHog API client for fetching Tennis Scorigami analytics

interface PostHogConfig {
  apiKey: string;
  projectId: string;
  host: string;
}

function getConfig(): PostHogConfig {
  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.POSTHOG_HOST ?? "https://us.posthog.com";

  if (!apiKey) {
    throw new Error("Missing POSTHOG_API_KEY environment variable");
  }

  if (!projectId) {
    throw new Error("Missing POSTHOG_PROJECT_ID environment variable");
  }

  return { apiKey, projectId, host };
}

// In-memory cache with TTL (following github.ts pattern)
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

// Public interfaces
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

// PostHog API response types
interface PostHogTrendsResult {
  data: number[];
  days?: string[];
  labels?: string[];
  label?: string;
  count?: number;
  aggregated_value?: number;
}

interface PostHogQueryResponse {
  results?: PostHogTrendsResult[];
  result?: PostHogTrendsResult[];
  columns?: string[];
  is_cached?: boolean;
}

interface PostHogHogQLResponse {
  results?: (string | number)[][];
  columns?: string[];
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

async function postHogFetch<T>(
  endpoint: string,
  config: PostHogConfig,
  body?: unknown
): Promise<T> {
  const url = `${config.host}/api/projects/${config.projectId}${endpoint}`;

  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("PostHog authentication failed. Check your POSTHOG_API_KEY.");
    }
    if (response.status === 404) {
      throw new Error("PostHog project not found. Check your POSTHOG_PROJECT_ID.");
    }
    if (response.status === 429) {
      throw new Error("PostHog API rate limit exceeded. Please try again later.");
    }

    const errorText = await response.text();
    throw new Error(`PostHog API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// PostHog valid math types:
// BaseMathType: 'total', 'dau', 'weekly_active', 'monthly_active', 'unique_session', 'first_time_for_user', 'first_matching_event_for_user'
type PostHogMathType = "total" | "dau" | "weekly_active" | "monthly_active" | "unique_session";

async function fetchTrendsQuery(
  config: PostHogConfig,
  eventName: string,
  startDate: string,
  endDate: string,
  uniqueUsers?: boolean
): Promise<PostHogQueryResponse> {
  const query = {
    kind: "TrendsQuery",
    dateRange: {
      date_from: startDate,
      date_to: endDate,
    },
    series: [
      {
        kind: "EventsNode",
        event: eventName,
        math: uniqueUsers ? "dau" : "total",
      },
    ],
    interval: "day",
  };

  return postHogFetch<PostHogQueryResponse>("/query/", config, { query });
}

async function fetchAggregateMetric(
  config: PostHogConfig,
  eventName: string,
  startDate: string,
  endDate: string,
  mathType: PostHogMathType = "total"
): Promise<number> {
  const query = {
    kind: "TrendsQuery",
    dateRange: {
      date_from: startDate,
      date_to: endDate,
    },
    series: [
      {
        kind: "EventsNode",
        event: eventName,
        math: mathType,
      },
    ],
    trendsFilter: {
      display: "BoldNumber",
    },
  };

  const response = await postHogFetch<PostHogQueryResponse>("/query/", config, { query });
  const results = response.results ?? response.result ?? [];

  if (results.length > 0 && results[0].aggregated_value !== undefined) {
    return Math.round(results[0].aggregated_value);
  }

  // Fallback to summing the data array
  if (results.length > 0 && results[0].data) {
    return results[0].data.reduce((sum, val) => sum + val, 0);
  }

  return 0;
}

async function fetchSessionDuration(
  config: PostHogConfig,
  startDate: string,
  endDate: string
): Promise<number> {
  // Use HogQL to calculate average session duration
  // Query from events table with session join (per PostHog docs)
  const query = {
    kind: "HogQLQuery",
    query: `
      SELECT avg(session.$session_duration) as avg_duration
      FROM events
      WHERE
        event = '$pageview'
        AND timestamp >= toDateTime('${startDate} 00:00:00')
        AND timestamp <= toDateTime('${endDate} 23:59:59')
    `,
  };

  try {
    const response = await postHogFetch<PostHogHogQLResponse>("/query/", config, { query });

    if (response.results && response.results.length > 0) {
      const avgDuration = response.results[0][0];
      return typeof avgDuration === "number" ? Math.round(avgDuration) : 0;
    }
  } catch (error) {
    // If HogQL query fails, return 0 - session duration is optional
    console.warn("Failed to fetch session duration from PostHog:", error);
  }

  return 0;
}

async function fetchActiveUsers(
  config: PostHogConfig
): Promise<ActiveUsersMetrics> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Calculate date ranges for DAU, WAU, MAU
  const dayAgo = new Date(now);
  dayAgo.setDate(dayAgo.getDate() - 1);
  const dayAgoStr = dayAgo.toISOString().split("T")[0];

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().split("T")[0];

  // Fetch all in parallel - use 'dau' math type with appropriate date ranges
  const [dau, wau, mau] = await Promise.all([
    fetchAggregateMetric(config, "$pageview", dayAgoStr, today, "dau"),
    fetchAggregateMetric(config, "$pageview", weekAgoStr, today, "dau"),
    fetchAggregateMetric(config, "$pageview", monthAgoStr, today, "dau"),
  ]);

  return { dau, wau, mau };
}

async function fetchTimeSeries(
  config: PostHogConfig,
  startDate: string,
  endDate: string
): Promise<PostHogTimeSeriesPoint[]> {
  // Fetch both total pageviews and unique users in parallel
  const [totalResponse, uniqueResponse] = await Promise.all([
    fetchTrendsQuery(config, "$pageview", startDate, endDate, false),
    fetchTrendsQuery(config, "$pageview", startDate, endDate, true),
  ]);

  const totalResults = totalResponse.results ?? totalResponse.result ?? [];
  const uniqueResults = uniqueResponse.results ?? uniqueResponse.result ?? [];

  if (totalResults.length === 0) {
    return [];
  }

  const totalData = totalResults[0].data ?? [];
  const totalDays = totalResults[0].days ?? totalResults[0].labels ?? [];
  const uniqueData = uniqueResults[0]?.data ?? [];

  return totalDays.map((day, index) => {
    // PostHog returns dates as "YYYY-MM-DD" or full ISO strings
    const dateStr = day.includes("T") ? day.split("T")[0] : day;
    // Format as MM/DD for consistency with Google Analytics
    const parts = dateStr.split("-");
    const formattedDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : dateStr;

    return {
      date: formattedDate,
      visitors: totalData[index] ?? 0,
      uniqueVisitors: uniqueData[index] ?? 0,
    };
  });
}

async function fetchTopEvents(
  config: PostHogConfig,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopEvent[]> {
  // Use HogQL to get top custom events (excluding PostHog internal events)
  // Filter out internal events client-side since NOT LIKE may not work in all cases
  const query = {
    kind: "HogQLQuery",
    query: `
      SELECT
        event,
        count() as count,
        count(DISTINCT person_id) as unique_users
      FROM events
      WHERE
        timestamp >= toDateTime('${startDate} 00:00:00')
        AND timestamp <= toDateTime('${endDate} 23:59:59')
      GROUP BY event
      ORDER BY count DESC
      LIMIT ${limit * 2}
    `,
  };

  try {
    const response = await postHogFetch<PostHogHogQLResponse>("/query/", config, { query });

    if (response.results) {
      // Filter out internal events (starting with $) client-side
      return response.results
        .filter((row) => !String(row[0]).startsWith("$"))
        .slice(0, limit)
        .map((row) => ({
          eventName: String(row[0]),
          count: Number(row[1]),
          uniqueUsers: Number(row[2]),
        }));
    }
  } catch (error) {
    console.warn("Failed to fetch top events:", error);
  }

  return [];
}

// Helper to fetch total events (all events, not just pageviews)
async function fetchTotalEvents(
  config: PostHogConfig,
  startDate: string,
  endDate: string
): Promise<number> {
  const query = {
    kind: "TrendsQuery",
    dateRange: {
      date_from: startDate,
      date_to: endDate,
    },
    series: [
      {
        kind: "EventsNode",
        event: null, // All events
        math: "total",
      },
    ],
    trendsFilter: {
      display: "BoldNumber",
    },
  };

  const response = await postHogFetch<PostHogQueryResponse>("/query/", config, { query });
  const results = response.results ?? response.result ?? [];

  if (results.length > 0 && results[0].aggregated_value !== undefined) {
    return Math.round(results[0].aggregated_value);
  }

  if (results.length > 0 && results[0].data) {
    return results[0].data.reduce((sum, val) => sum + val, 0);
  }

  return 0;
}

export async function fetchTennisScorigamiAnalytics(
  startDate: string,
  endDate: string
): Promise<TennisScorigamiAnalyticsData> {
  const config = getConfig();

  const cacheKey = `tennis-scorigami:${startDate}:${endDate}`;
  const cached = getCached<TennisScorigamiAnalyticsData>(cacheKey);
  if (cached) return cached;

  // Calculate previous period for comparison
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff + 1);

  const prevStartDate = prevStart.toISOString().split("T")[0];
  const prevEndDate = prevEnd.toISOString().split("T")[0];

  // Fetch metrics, active users, time series, and top events in parallel
  const [
    currentVisitors,
    prevVisitors,
    currentUniqueVisitors,
    prevUniqueVisitors,
    currentEvents,
    prevEvents,
    currentSessionDuration,
    prevSessionDuration,
    activeUsers,
    timeSeries,
    topEvents,
  ] = await Promise.all([
    fetchAggregateMetric(config, "$pageview", startDate, endDate, "total"),
    fetchAggregateMetric(config, "$pageview", prevStartDate, prevEndDate, "total"),
    fetchAggregateMetric(config, "$pageview", startDate, endDate, "dau"),
    fetchAggregateMetric(config, "$pageview", prevStartDate, prevEndDate, "dau"),
    fetchTotalEvents(config, startDate, endDate),
    fetchTotalEvents(config, prevStartDate, prevEndDate),
    fetchSessionDuration(config, startDate, endDate),
    fetchSessionDuration(config, prevStartDate, prevEndDate),
    fetchActiveUsers(config),
    fetchTimeSeries(config, startDate, endDate),
    fetchTopEvents(config, startDate, endDate),
  ]);

  const data: TennisScorigamiAnalyticsData = {
    metrics: {
      visitors: {
        value: currentVisitors,
        previousValue: prevVisitors,
        trend: calculateTrend(currentVisitors, prevVisitors),
      },
      uniqueVisitors: {
        value: currentUniqueVisitors,
        previousValue: prevUniqueVisitors,
        trend: calculateTrend(currentUniqueVisitors, prevUniqueVisitors),
      },
      totalEvents: {
        value: currentEvents,
        previousValue: prevEvents,
        trend: calculateTrend(currentEvents, prevEvents),
      },
      avgSessionDuration: {
        value: currentSessionDuration,
        previousValue: prevSessionDuration,
        trend: calculateTrend(currentSessionDuration, prevSessionDuration),
      },
    },
    activeUsers,
    timeSeries,
    topEvents,
  };

  setCache(cacheKey, data);
  return data;
}
