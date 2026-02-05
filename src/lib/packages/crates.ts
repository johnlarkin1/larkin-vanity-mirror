// crates.io API client for fetching package download statistics
// Rate limit: 1 request per second required
// Note: crates.io does not provide daily download breakdown

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

// crates.io API response types
interface CratesApiResponse {
  crate: {
    id: string;
    name: string;
    downloads: number;
    recent_downloads: number;
    description: string;
    homepage: string | null;
    repository: string | null;
    created_at: string;
  };
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch download stats for a crates.io package
 * Note: crates.io only provides total + 90-day recent downloads, not daily breakdown
 * The startDate/endDate params are accepted for API consistency but cannot filter the data
 */
export async function fetchCratesPackage(
  packageName: string,
  _startDate: Date,
  _endDate: Date
): Promise<PackageDownloads> {
  // Cache key doesn't include dates since crates.io doesn't support date filtering
  const cacheKey = `crates:${packageName}`;
  const cached = getCached<PackageDownloads>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`https://crates.io/api/v1/crates/${packageName}`, {
    headers: {
      "User-Agent": "larkin-vanity-mirror (https://github.com/johnlarkin1)",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`crates.io package '${packageName}' not found`);
    }
    if (response.status === 429) {
      throw new Error(`crates.io rate limit exceeded for '${packageName}'`);
    }
    throw new Error(`crates.io API error for package '${packageName}'`);
  }

  const data: CratesApiResponse = await response.json();

  // crates.io only provides total + 90-day recent, no daily breakdown
  // Estimate weekly/monthly from recent_downloads (90-day)
  const dailyAverage = data.crate.recent_downloads / 90;
  const estimatedWeekly = Math.round(dailyAverage * 7);
  const estimatedMonthly = Math.round(dailyAverage * 30);

  const result: PackageDownloads = {
    name: packageName,
    registry: "crates",
    totalDownloads: data.crate.downloads,
    weeklyDownloads: estimatedWeekly,
    monthlyDownloads: estimatedMonthly,
    dailyDownloads: [], // No daily breakdown available from crates.io
    url: `https://crates.io/crates/${packageName}`,
    createdAt: data.crate.created_at ?? null,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Fetch download stats for multiple crates.io packages
 * IMPORTANT: Must fetch sequentially with 1 second delay between requests
 */
export async function fetchCratesPackages(
  packageNames: string[],
  startDate: Date,
  endDate: Date
): Promise<{ successful: PackageDownloads[]; errors: Array<{ name: string; error: string }> }> {
  if (packageNames.length === 0) {
    return { successful: [], errors: [] };
  }

  const successful: PackageDownloads[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  for (let i = 0; i < packageNames.length; i++) {
    const name = packageNames[i];

    try {
      const result = await fetchCratesPackage(name, startDate, endDate);
      successful.push(result);
    } catch (error) {
      errors.push({
        name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Rate limit: wait 1 second between requests (except after the last one)
    if (i < packageNames.length - 1) {
      await sleep(1000);
    }
  }

  return { successful, errors };
}
