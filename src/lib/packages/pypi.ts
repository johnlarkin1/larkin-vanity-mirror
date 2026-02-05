// PyPI API client for fetching package download statistics

import type { PackageDownloads } from "./types";

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

// PyPI Stats API response types
interface PyPIOverallResponse {
  data: Array<{
    category: string;
    date: string;
    downloads: number;
  }>;
  package: string;
  type: "overall_downloads";
}

/**
 * Format date as YYYY-MM-DD for comparison
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Fetch download stats for a PyPI package over a date range
 * Note: PyPI Stats only keeps ~180 days of data
 */
export async function fetchPyPIPackage(
  packageName: string,
  startDate: Date,
  endDate: Date
): Promise<PackageDownloads> {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const cacheKey = `pypi:${packageName}:${start}:${end}`;
  const cached = getCached<PackageDownloads>(cacheKey);
  if (cached) return cached;

  // Fetch overall history (PyPI Stats keeps ~180 days)
  const response = await fetch(
    `https://pypistats.org/api/packages/${packageName}/overall?mirrors=true`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`PyPI package '${packageName}' not found`);
    }
    throw new Error(`PyPI API error for package '${packageName}'`);
  }

  const overallData: PyPIOverallResponse = await response.json();

  // Filter for "without_mirrors" category, fallback to all data if not found
  const withoutMirrors = overallData.data.filter((d) => d.category === "without_mirrors");
  const dataToUse = withoutMirrors.length > 0 ? withoutMirrors : overallData.data;

  // Build daily downloads map
  const dailyMap = new Map<string, number>();
  dataToUse.forEach((d) => {
    dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.downloads);
  });

  // Filter by date range and sort
  const dailyDownloads = Array.from(dailyMap.entries())
    .filter(([date]) => date >= start && date <= end)
    .map(([date, downloads]) => ({ date, downloads }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate totals from filtered data
  const totalDownloads = dailyDownloads.reduce((sum, d) => sum + d.downloads, 0);

  // Calculate weekly (last 7 days of the range)
  const last7Days = dailyDownloads.slice(-7);
  const weeklyDownloads = last7Days.reduce((sum, d) => sum + d.downloads, 0);

  // Calculate monthly (last 30 days of the range)
  const last30Days = dailyDownloads.slice(-30);
  const monthlyDownloads = last30Days.reduce((sum, d) => sum + d.downloads, 0);

  const result: PackageDownloads = {
    name: packageName,
    registry: "pypi",
    totalDownloads,
    weeklyDownloads,
    monthlyDownloads,
    dailyDownloads,
    url: `https://pypi.org/project/${packageName}/`,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Fetch download stats for multiple PyPI packages
 * Uses Promise.allSettled for error isolation
 */
export async function fetchPyPIPackages(
  packageNames: string[],
  startDate: Date,
  endDate: Date
): Promise<{ successful: PackageDownloads[]; errors: Array<{ name: string; error: string }> }> {
  if (packageNames.length === 0) {
    return { successful: [], errors: [] };
  }

  const results = await Promise.allSettled(
    packageNames.map((name) => fetchPyPIPackage(name, startDate, endDate))
  );

  const successful: PackageDownloads[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      errors.push({
        name: packageNames[index],
        error: result.reason instanceof Error ? result.reason.message : "Unknown error",
      });
    }
  });

  return { successful, errors };
}
