import { BetaAnalyticsDataClient } from "@google-analytics/data";

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Validate required environment variables for blog analytics
function getConfig() {
  const propertyId = process.env.BLOG_GA_PROPERTY_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!propertyId) {
    throw new Error("Missing BLOG_GA_PROPERTY_ID environment variable");
  }

  if (!serviceAccountKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable");
  }

  // Decode base64 service account key
  let credentials: ServiceAccountCredentials;
  try {
    const decoded = Buffer.from(serviceAccountKey, "base64").toString("utf-8");
    credentials = JSON.parse(decoded);
  } catch {
    throw new Error(
      "Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY. Ensure it is valid base64-encoded JSON."
    );
  }

  // Validate required fields
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "Invalid service account key: missing client_email or private_key"
    );
  }

  // Ensure private key has proper newlines (they might get escaped)
  if (credentials.private_key.includes("\\n")) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  return { propertyId, credentials };
}

// Singleton client instance
let analyticsClient: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (!analyticsClient) {
    const { credentials } = getConfig();
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });
  }
  return analyticsClient;
}

export interface MetricWithTrend {
  value: number;
  previousValue: number;
  trend: number;
}

export interface TimeSeriesPoint {
  date: string;
  visitors: number;
  uniqueVisitors: number;
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

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

async function fetchAggregateMetrics(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
  daysDiff: number
): Promise<{
  visitors: MetricWithTrend;
  uniqueVisitors: MetricWithTrend;
  avgSessionDuration: MetricWithTrend;
  avgUsersPerDay: MetricWithTrend;
}> {
  // Fetch current period metrics
  const [currentResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "averageSessionDuration" },
    ],
  });

  // Fetch previous period metrics for comparison
  const [previousResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "averageSessionDuration" },
    ],
  });

  const currentRow = currentResponse.rows?.[0];
  const previousRow = previousResponse.rows?.[0];

  const currentSessions = parseInt(currentRow?.metricValues?.[0]?.value ?? "0", 10);
  const currentUsers = parseInt(currentRow?.metricValues?.[1]?.value ?? "0", 10);
  const currentDuration = parseFloat(currentRow?.metricValues?.[2]?.value ?? "0");

  const previousSessions = parseInt(previousRow?.metricValues?.[0]?.value ?? "0", 10);
  const previousUsers = parseInt(previousRow?.metricValues?.[1]?.value ?? "0", 10);
  const previousDuration = parseFloat(previousRow?.metricValues?.[2]?.value ?? "0");

  // Calculate average users per day
  const currentAvgUsersPerDay = daysDiff > 0 ? Math.round(currentUsers / daysDiff) : 0;
  const previousAvgUsersPerDay = daysDiff > 0 ? Math.round(previousUsers / daysDiff) : 0;

  return {
    visitors: {
      value: currentSessions,
      previousValue: previousSessions,
      trend: calculateTrend(currentSessions, previousSessions),
    },
    uniqueVisitors: {
      value: currentUsers,
      previousValue: previousUsers,
      trend: calculateTrend(currentUsers, previousUsers),
    },
    avgSessionDuration: {
      value: Math.round(currentDuration),
      previousValue: Math.round(previousDuration),
      trend: calculateTrend(currentDuration, previousDuration),
    },
    avgUsersPerDay: {
      value: currentAvgUsersPerDay,
      previousValue: previousAvgUsersPerDay,
      trend: calculateTrend(currentAvgUsersPerDay, previousAvgUsersPerDay),
    },
  };
}

async function fetchTimeSeries(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<TimeSeriesPoint[]> {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  return (response.rows ?? []).map((row) => ({
    date: formatDate(row.dimensionValues?.[0]?.value ?? ""),
    visitors: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    uniqueVisitors: parseInt(row.metricValues?.[1]?.value ?? "0", 10),
  }));
}

function formatDate(dateString: string): string {
  // GA4 returns dates as YYYYMMDD, convert to more readable format
  if (dateString.length === 8) {
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${month}/${day}`;
  }
  return dateString;
}

async function fetchTopPages(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopPage[]> {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "totalUsers" },
      { name: "userEngagementDuration" },
      { name: "bounceRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (response.rows ?? []).map((row) => {
    const pageviews = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
    const uniqueVisitors = parseInt(row.metricValues?.[1]?.value ?? "0", 10);
    const engagementDuration = parseFloat(row.metricValues?.[2]?.value ?? "0");
    const bounceRate = parseFloat(row.metricValues?.[3]?.value ?? "0") * 100;

    // Calculate average time on page (engagement duration / unique visitors)
    const avgTimeOnPage = uniqueVisitors > 0 ? Math.round(engagementDuration / uniqueVisitors) : 0;

    return {
      pagePath: row.dimensionValues?.[0]?.value ?? "",
      pageTitle: row.dimensionValues?.[1]?.value ?? "(not set)",
      pageviews,
      uniqueVisitors,
      avgTimeOnPage,
      bounceRate: Math.round(bounceRate * 10) / 10, // Round to 1 decimal
    };
  });
}

/**
 * Fetch analytics for a specific GA4 property.
 * Use this for properties other than the default blog property.
 */
export async function fetchAnalyticsForProperty(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<BlogAnalyticsData> {
  const client = getClient();

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

  // Run all queries in parallel for better performance
  const [metrics, timeSeries, topPages] = await Promise.all([
    fetchAggregateMetrics(client, propertyId, startDate, endDate, prevStartDate, prevEndDate, daysDiff),
    fetchTimeSeries(client, propertyId, startDate, endDate),
    fetchTopPages(client, propertyId, startDate, endDate),
  ]);

  return {
    metrics,
    timeSeries,
    topPages,
  };
}

export async function fetchBlogAnalytics(
  startDate: string,
  endDate: string
): Promise<BlogAnalyticsData> {
  const { propertyId } = getConfig();
  return fetchAnalyticsForProperty(propertyId, startDate, endDate);
}
