// Shared types for package registry analytics

export type PackageRegistry = "npm" | "pypi" | "crates";

export interface PackageDownloads {
  name: string;
  registry: PackageRegistry;
  totalDownloads: number;
  weeklyDownloads: number;
  monthlyDownloads: number;
  dailyDownloads: Array<{ date: string; downloads: number }>;
  url: string;
  createdAt: string | null;
}

export interface PackagesAnalyticsData {
  metrics: {
    totalDownloads: number;
    weeklyDownloads: number;
    packageCount: number;
    weeklyTrend: number;
  };
  packages: PackageDownloads[];
  timeSeries: Array<{ date: string; npm: number; pypi: number; crates: number }>;
  topPackage: { name: string; registry: PackageRegistry; weeklyDownloads: number } | null;
}
