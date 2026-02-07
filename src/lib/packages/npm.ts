// npm API client for fetching package download statistics

import { fetchWithTimeout } from "../fetch-with-timeout";
import type { PackageDownloads } from "./types";

const API_TIMEOUT = 15000; // 15 seconds

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

// npm API response types
interface NpmRangeResponse {
  downloads: Array<{ downloads: number; day: string }>;
  start: string;
  end: string;
  package: string;
}

interface NpmRegistryResponse {
  time?: {
    created?: string;
    modified?: string;
    [version: string]: string | undefined;
  };
}

/**
 * Encode package name for npm API (handles scoped packages)
 * @scope/name -> %40scope%2Fname
 */
function encodePackageName(name: string): string {
  return encodeURIComponent(name);
}

/**
 * Format date as YYYY-MM-DD for npm API
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Fetch download stats for an npm package over a date range
 */
export async function fetchNpmPackage(
  packageName: string,
  startDate: Date,
  endDate: Date
): Promise<PackageDownloads> {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const cacheKey = `npm:${packageName}:${start}:${end}`;
  const cached = getCached<PackageDownloads>(cacheKey);
  if (cached) return cached;

  const encodedName = encodePackageName(packageName);

  // Fetch daily downloads and registry info in parallel
  const [downloadResponse, registryResponse] = await Promise.all([
    fetchWithTimeout(
      `https://api.npmjs.org/downloads/range/${start}:${end}/${encodedName}`,
      {},
      API_TIMEOUT
    ),
    fetchWithTimeout(`https://registry.npmjs.org/${encodedName}`, {}, API_TIMEOUT),
  ]);

  if (!downloadResponse.ok) {
    if (downloadResponse.status === 404) {
      throw new Error(`npm package '${packageName}' not found`);
    }
    throw new Error(`npm API error for package '${packageName}'`);
  }

  const data: NpmRangeResponse = await downloadResponse.json();

  // Try to get creation date from registry
  let createdAt: string | null = null;
  if (registryResponse.ok) {
    try {
      const registryData: NpmRegistryResponse = await registryResponse.json();
      createdAt = registryData.time?.created ?? null;
    } catch {
      // Ignore registry errors, just leave createdAt as null
    }
  }

  // Calculate totals from the daily data
  const dailyDownloads = data.downloads.map((d) => ({
    date: d.day,
    downloads: d.downloads,
  }));

  const totalDownloads = dailyDownloads.reduce((sum, d) => sum + d.downloads, 0);

  // Calculate weekly (last 7 days of the range)
  const last7Days = dailyDownloads.slice(-7);
  const weeklyDownloads = last7Days.reduce((sum, d) => sum + d.downloads, 0);

  // Calculate monthly (last 30 days of the range)
  const last30Days = dailyDownloads.slice(-30);
  const monthlyDownloads = last30Days.reduce((sum, d) => sum + d.downloads, 0);

  const result: PackageDownloads = {
    name: packageName,
    registry: "npm",
    totalDownloads,
    weeklyDownloads,
    monthlyDownloads,
    dailyDownloads,
    url: `https://www.npmjs.com/package/${packageName}`,
    createdAt,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Fetch download stats for multiple npm packages
 * Uses Promise.allSettled for error isolation
 */
export async function fetchNpmPackages(
  packageNames: string[],
  startDate: Date,
  endDate: Date
): Promise<{ successful: PackageDownloads[]; errors: Array<{ name: string; error: string }> }> {
  if (packageNames.length === 0) {
    return { successful: [], errors: [] };
  }

  const results = await Promise.allSettled(
    packageNames.map((name) => fetchNpmPackage(name, startDate, endDate))
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
