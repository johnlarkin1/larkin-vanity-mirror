import * as jose from "jose";
import { fetchWithTimeout } from "./fetch-with-timeout";

const API_TIMEOUT = 15000; // 15 seconds

// App Store Connect API configuration
interface AppStoreConnectConfig {
  keyId: string;
  issuerId: string;
  privateKey: string;
  appId: string;
  vendorNumber: string;
}

function getConfig(): AppStoreConnectConfig {
  const keyId = process.env.APP_STORE_CONNECT_KEY_ID;
  const issuerId = process.env.APP_STORE_CONNECT_ISSUER_ID;
  const privateKey = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
  const appId = process.env.APP_STORE_CONNECT_APP_ID;
  const vendorNumber = process.env.APP_STORE_CONNECT_VENDOR_NUMBER;

  if (!keyId) {
    throw new Error("Missing APP_STORE_CONNECT_KEY_ID environment variable");
  }
  if (!issuerId) {
    throw new Error("Missing APP_STORE_CONNECT_ISSUER_ID environment variable");
  }
  if (!privateKey) {
    throw new Error("Missing APP_STORE_CONNECT_PRIVATE_KEY environment variable");
  }
  if (!appId) {
    throw new Error("Missing APP_STORE_CONNECT_APP_ID environment variable");
  }
  if (!vendorNumber) {
    throw new Error("Missing APP_STORE_CONNECT_VENDOR_NUMBER environment variable");
  }

  return { keyId, issuerId, privateKey, appId, vendorNumber };
}

// JWT token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function generateJWT(): Promise<string> {
  // Return cached token if still valid (with 1 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const { keyId, issuerId, privateKey } = getConfig();

  // Decode base64 private key
  let decodedKey: string;
  try {
    decodedKey = Buffer.from(privateKey, "base64").toString("utf-8");
  } catch {
    throw new Error(
      "Failed to decode APP_STORE_CONNECT_PRIVATE_KEY. Ensure it is valid base64."
    );
  }

  // Import the private key for ES256 signing
  const key = await jose.importPKCS8(decodedKey, "ES256");

  // JWT expires in 20 minutes (Apple's maximum)
  const expiresAt = now + 20 * 60;

  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .setAudience("appstoreconnect-v1")
    .sign(key);

  cachedToken = { token, expiresAt };
  return token;
}

// In-memory cache for API responses (5 minutes)
const responseCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCached<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  responseCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// Types for App Store Connect API responses
export interface SalesReport {
  provider: string;
  providerCountry: string;
  sku: string;
  developer: string;
  title: string;
  version: string;
  productTypeIdentifier: string;
  units: number;
  developerProceeds: number;
  beginDate: string;
  endDate: string;
  customerCurrency: string;
  countryCode: string;
  currencyOfProceeds: string;
  appleIdentifier: string;
  customerPrice: number;
  promoCode: string;
  parentIdentifier: string;
  subscription: string;
  period: string;
  category: string;
  cmb: string;
  device: string;
  supportedPlatforms: string;
  proceedsReason: string;
  preservedPricing: string;
  client: string;
  orderType: string;
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

export interface AppStoreSalesData {
  totalUnits: number;
  totalProceeds: number;
  weeklyUnits: number;
  weeklyProceeds: number;
  reportsByDate: Array<{
    date: string;
    units: number;
    proceeds: number;
  }>;
}

export interface AppStoreReviewData {
  averageRating: number;
  totalReviews: number;
  recentReviews: CustomerReview[];
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface MetricWithTrend {
  value: number;
  previousValue: number;
  trend: number;
}

export interface AppStoreAnalyticsData {
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

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Parse TSV sales report data
 * App Store Connect returns gzipped TSV files
 */
function parseSalesReportTSV(tsv: string): SalesReport[] {
  const lines = tsv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t");
  const reports: SalesReport[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t");
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    reports.push({
      provider: row["Provider"] ?? "",
      providerCountry: row["Provider Country"] ?? "",
      sku: row["SKU"] ?? "",
      developer: row["Developer"] ?? "",
      title: row["Title"] ?? "",
      version: row["Version"] ?? "",
      productTypeIdentifier: row["Product Type Identifier"] ?? "",
      units: parseInt(row["Units"] ?? "0", 10),
      developerProceeds: parseFloat(row["Developer Proceeds"] ?? "0"),
      beginDate: row["Begin Date"] ?? "",
      endDate: row["End Date"] ?? "",
      customerCurrency: row["Customer Currency"] ?? "",
      countryCode: row["Country Code"] ?? "",
      currencyOfProceeds: row["Currency of Proceeds"] ?? "",
      appleIdentifier: row["Apple Identifier"] ?? "",
      customerPrice: parseFloat(row["Customer Price"] ?? "0"),
      promoCode: row["Promo Code"] ?? "",
      parentIdentifier: row["Parent Identifier"] ?? "",
      subscription: row["Subscription"] ?? "",
      period: row["Period"] ?? "",
      category: row["Category"] ?? "",
      cmb: row["CMB"] ?? "",
      device: row["Device"] ?? "",
      supportedPlatforms: row["Supported Platforms"] ?? "",
      proceedsReason: row["Proceeds Reason"] ?? "",
      preservedPricing: row["Preserved Pricing"] ?? "",
      client: row["Client"] ?? "",
      orderType: row["Order Type"] ?? "",
    });
  }

  return reports;
}

/**
 * Fetch sales reports for a date range
 * Note: Sales reports are available with a 1-day delay
 */
export async function fetchSalesReports(
  startDate: string,
  endDate: string
): Promise<AppStoreSalesData> {
  const cacheKey = `sales:${startDate}:${endDate}`;
  const cached = getCached<AppStoreSalesData>(cacheKey);
  if (cached) return cached;

  const { vendorNumber } = getConfig();
  const token = await generateJWT();

  // Sales reports API endpoint
  const baseUrl = "https://api.appstoreconnect.apple.com/v1/salesReports";

  const { gunzip } = await import("zlib");
  const { promisify } = await import("util");
  const gunzipAsync = promisify(gunzip);

  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const start = new Date(startDate + "T12:00:00"); // Noon to avoid timezone issues
  const end = new Date(endDate + "T12:00:00");
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Choose frequency based on date range:
  // < 30 days: DAILY (more granular)
  // >= 30 days: WEEKLY (fewer API calls)
  const useWeekly = daysDiff >= 30;
  const frequency = useWeekly ? "WEEKLY" : "DAILY";

  // Build list of dates to fetch
  const datesToFetch: string[] = [];

  if (useWeekly) {
    // For weekly: find all Sundays covering the range
    // Apple's weekly reports use the Sunday that ENDS the week
    const getWeekEndingSunday = (d: Date): Date => {
      const result = new Date(d);
      const dayOfWeek = result.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      result.setDate(result.getDate() + daysToAdd);
      return result;
    };

    const currentSunday = getWeekEndingSunday(start);
    const endSunday = getWeekEndingSunday(end);

    while (currentSunday <= endSunday) {
      datesToFetch.push(formatDateStr(currentSunday));
      currentSunday.setDate(currentSunday.getDate() + 7);
    }
  } else {
    // For daily: fetch each day
    const currentDate = new Date(start);
    while (currentDate <= end) {
      datesToFetch.push(formatDateStr(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Fetch all dates in parallel
  const fetchReport = async (dateStr: string): Promise<SalesReport[]> => {
    const params = new URLSearchParams({
      "filter[frequency]": frequency,
      "filter[reportDate]": dateStr,
      "filter[reportSubType]": "SUMMARY",
      "filter[reportType]": "SALES",
      "filter[vendorNumber]": vendorNumber,
    });

    try {
      const response = await fetchWithTimeout(
        `${baseUrl}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/a-gzip",
          },
        },
        API_TIMEOUT
      );

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const decompressed = await gunzipAsync(Buffer.from(buffer));
        const tsv = decompressed.toString("utf-8");
        return parseSalesReportTSV(tsv);
      } else if (response.status !== 404) {
        // Non-404 errors are silently ignored
      }
      return [];
    } catch {
      return [];
    }
  };

  const results = await Promise.all(datesToFetch.map(fetchReport));
  const allReports = results.flat();

  // Aggregate the data
  let totalUnits = 0;
  let totalProceeds = 0;
  const reportsByDate = new Map<string, { units: number; proceeds: number }>();

  // Product type identifiers for app downloads:
  // F1 = Free - First Time Download
  // F3 = Free - Re-Download
  // 1 = Paid App, 1F = Free iOS App
  // 7 = Paid Mac App, 7F = Free Mac App
  // 1T = Paid Universal, 1TF = Free Universal
  const appProductTypes = new Set(["F1", "F3", "1", "1F", "1T", "1TF", "7", "7F"]);

  for (const report of allReports) {
    // Only count app downloads (not in-app purchases, etc.)
    if (appProductTypes.has(report.productTypeIdentifier)) {
      totalUnits += report.units;
      totalProceeds += report.developerProceeds;

      const date = report.beginDate;
      const existing = reportsByDate.get(date) ?? { units: 0, proceeds: 0 };
      existing.units += report.units;
      existing.proceeds += report.developerProceeds;
      reportsByDate.set(date, existing);
    }
  }

  // Calculate weekly (last 7 days)
  const oneWeekAgo = new Date(end);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let weeklyUnits = 0;
  let weeklyProceeds = 0;

  for (const report of allReports) {
    const reportDate = new Date(report.beginDate);
    if (reportDate >= oneWeekAgo && appProductTypes.has(report.productTypeIdentifier)) {
      weeklyUnits += report.units;
      weeklyProceeds += report.developerProceeds;
    }
  }

  const result: AppStoreSalesData = {
    totalUnits,
    totalProceeds,
    weeklyUnits,
    weeklyProceeds,
    reportsByDate: Array.from(reportsByDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Fetch customer reviews for the app
 */
export async function fetchCustomerReviews(): Promise<AppStoreReviewData> {
  const cacheKey = "reviews";
  const cached = getCached<AppStoreReviewData>(cacheKey);
  if (cached) return cached;

  const { appId } = getConfig();
  const token = await generateJWT();

  const baseUrl = `https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews`;

  const params = new URLSearchParams({
    "sort": "-createdDate",
    "limit": "50",
  });

  const response = await fetchWithTimeout(
    `${baseUrl}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
    API_TIMEOUT
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch customer reviews: ${response.status} - ${error}`);
  }

  const data = await response.json();

  const reviews: CustomerReview[] = (data.data ?? []).map(
    (review: {
      id: string;
      attributes: {
        rating: number;
        title: string;
        body: string;
        reviewerNickname: string;
        createdDate: string;
        territory: string;
      };
    }) => ({
      id: review.id,
      rating: review.attributes.rating,
      title: review.attributes.title,
      body: review.attributes.body,
      reviewerNickname: review.attributes.reviewerNickname,
      createdDate: review.attributes.createdDate,
      territory: review.attributes.territory,
    })
  );

  // Calculate rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  for (const review of reviews) {
    const rating = review.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
      totalRating += rating;
    }
  }

  const result: AppStoreReviewData = {
    averageRating: reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0,
    totalReviews: reviews.length,
    recentReviews: reviews.slice(0, 10),
    ratingDistribution,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Fetch combined App Store analytics
 */
export async function fetchAppStoreAnalytics(
  startDate: string,
  endDate: string
): Promise<AppStoreAnalyticsData> {
  const cacheKey = `analytics:${startDate}:${endDate}`;
  const cached = getCached<AppStoreAnalyticsData>(cacheKey);
  if (cached) return cached;

  // Calculate previous period for trend comparison
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff + 1);

  const prevStartDate = prevStart.toISOString().split("T")[0];
  const prevEndDate = prevEnd.toISOString().split("T")[0];

  // Fetch current and previous period data in parallel
  const [currentSales, previousSales, reviews] = await Promise.all([
    fetchSalesReports(startDate, endDate),
    fetchSalesReports(prevStartDate, prevEndDate),
    fetchCustomerReviews(),
  ]);

  const result: AppStoreAnalyticsData = {
    sales: {
      totalDownloads: {
        value: currentSales.totalUnits,
        previousValue: previousSales.totalUnits,
        trend: calculateTrend(currentSales.totalUnits, previousSales.totalUnits),
      },
      weeklyDownloads: {
        value: currentSales.weeklyUnits,
        previousValue: previousSales.weeklyUnits,
        trend: calculateTrend(currentSales.weeklyUnits, previousSales.weeklyUnits),
      },
      totalRevenue: {
        value: currentSales.totalProceeds,
        previousValue: previousSales.totalProceeds,
        trend: calculateTrend(currentSales.totalProceeds, previousSales.totalProceeds),
      },
      weeklyRevenue: {
        value: currentSales.weeklyProceeds,
        previousValue: previousSales.weeklyProceeds,
        trend: calculateTrend(currentSales.weeklyProceeds, previousSales.weeklyProceeds),
      },
    },
    reviews: {
      averageRating: reviews.averageRating,
      totalReviews: reviews.totalReviews,
      recentReviews: reviews.recentReviews,
    },
    downloadTrends: currentSales.reportsByDate.map((r) => ({
      date: formatDate(r.date),
      downloads: r.units,
      revenue: r.proceeds,
    })),
  };

  setCache(cacheKey, result);
  return result;
}

function formatDate(dateString: string): string {
  // Convert from YYYY-MM-DD to MM/DD format
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateString;
}

/**
 * Check if App Store Connect is configured
 */
export function isAppStoreConnectConfigured(): boolean {
  return !!(
    process.env.APP_STORE_CONNECT_KEY_ID &&
    process.env.APP_STORE_CONNECT_ISSUER_ID &&
    process.env.APP_STORE_CONNECT_PRIVATE_KEY &&
    process.env.APP_STORE_CONNECT_APP_ID &&
    process.env.APP_STORE_CONNECT_VENDOR_NUMBER
  );
}
