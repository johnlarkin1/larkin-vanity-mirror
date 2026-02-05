// Package analytics aggregation

import type { PackagesAnalyticsData, PackageDownloads } from "./types";
import { fetchNpmPackages } from "./npm";
import { fetchPyPIPackages } from "./pypi";
import { fetchCratesPackages } from "./crates";

export * from "./types";

export interface PackagesConfig {
  npm: string[];
  pypi: string[];
  crates: string[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get configured packages from environment variables
 */
export function getPackagesConfig(): PackagesConfig {
  return {
    npm: (process.env.NPM_PACKAGES ?? "").split(",").filter(Boolean).map((s) => s.trim()),
    pypi: (process.env.PYPI_PACKAGES ?? "").split(",").filter(Boolean).map((s) => s.trim()),
    crates: (process.env.CRATES_PACKAGES ?? "").split(",").filter(Boolean).map((s) => s.trim()),
  };
}

/**
 * Build time series data from package daily downloads
 * Combines npm and PyPI data (crates doesn't provide daily breakdown)
 */
function buildTimeSeries(
  packages: PackageDownloads[]
): Array<{ date: string; npm: number; pypi: number; crates: number }> {
  const dateMap = new Map<string, { npm: number; pypi: number; crates: number }>();

  // Aggregate npm packages
  packages
    .filter((p) => p.registry === "npm")
    .forEach((pkg) => {
      pkg.dailyDownloads.forEach(({ date, downloads }) => {
        const existing = dateMap.get(date) || { npm: 0, pypi: 0, crates: 0 };
        existing.npm += downloads;
        dateMap.set(date, existing);
      });
    });

  // Aggregate PyPI packages
  packages
    .filter((p) => p.registry === "pypi")
    .forEach((pkg) => {
      pkg.dailyDownloads.forEach(({ date, downloads }) => {
        const existing = dateMap.get(date) || { npm: 0, pypi: 0, crates: 0 };
        existing.pypi += downloads;
        dateMap.set(date, existing);
      });
    });

  // crates doesn't provide daily data, so crates column will be 0

  // Sort by date
  return Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fetch analytics data for all configured packages within a date range
 */
export async function fetchPackagesAnalytics(dateRange: DateRange): Promise<PackagesAnalyticsData> {
  const config = getPackagesConfig();
  const { startDate, endDate } = dateRange;

  const totalConfigured =
    config.npm.length + config.pypi.length + config.crates.length;

  if (totalConfigured === 0) {
    throw new Error(
      "No packages configured. Set NPM_PACKAGES, PYPI_PACKAGES, or CRATES_PACKAGES environment variables."
    );
  }

  // Fetch npm and PyPI in parallel, crates sequentially (due to rate limiting)
  const [npmResults, pypiResults] = await Promise.all([
    fetchNpmPackages(config.npm, startDate, endDate),
    fetchPyPIPackages(config.pypi, startDate, endDate),
  ]);

  // Fetch crates sequentially (rate limited)
  const cratesResults = await fetchCratesPackages(config.crates, startDate, endDate);

  // Combine all successful results
  const allPackages: PackageDownloads[] = [
    ...npmResults.successful,
    ...pypiResults.successful,
    ...cratesResults.successful,
  ];

  // Log any errors (but don't fail the whole request)
  const allErrors = [
    ...npmResults.errors,
    ...pypiResults.errors,
    ...cratesResults.errors,
  ];

  if (allErrors.length > 0) {
    console.warn("Some packages failed to fetch:", allErrors);
  }

  // If all packages failed, throw an error
  if (allPackages.length === 0 && allErrors.length > 0) {
    throw new Error(
      `Failed to fetch any packages. Errors: ${allErrors.map((e) => `${e.name}: ${e.error}`).join(", ")}`
    );
  }

  // Calculate aggregate metrics (totalDownloads here means total for the selected period)
  const totalDownloads = allPackages.reduce((sum, p) => sum + p.totalDownloads, 0);
  const weeklyDownloads = allPackages.reduce((sum, p) => sum + p.weeklyDownloads, 0);
  const packageCount = allPackages.length;

  // Find top package by total downloads in the period
  const topPackage =
    allPackages.length > 0
      ? allPackages.reduce((top, pkg) =>
          pkg.totalDownloads > (top?.totalDownloads ?? 0) ? pkg : top
        )
      : null;

  // Build time series
  const timeSeries = buildTimeSeries(allPackages);

  // Calculate weekly trend (would need historical data for real trend)
  // For now, set to 0 as we don't have previous period data
  const weeklyTrend = 0;

  return {
    metrics: {
      totalDownloads,
      weeklyDownloads,
      packageCount,
      weeklyTrend,
    },
    packages: allPackages.sort((a, b) => b.totalDownloads - a.totalDownloads),
    timeSeries,
    topPackage: topPackage
      ? {
          name: topPackage.name,
          registry: topPackage.registry,
          weeklyDownloads: topPackage.totalDownloads, // Use period total for display
        }
      : null,
  };
}
