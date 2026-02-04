export type Granularity = "daily" | "weekly" | "monthly" | "yearly";

export interface MetricValue {
  value: number;
  previousValue?: number;
  trend?: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface VisitorMetrics {
  visitors: MetricValue;
  uniqueVisitors: MetricValue;
  timeOnSite?: MetricValue;
  bounceRate?: MetricValue;
}

export interface BlogMetrics extends VisitorMetrics {
  mostPopularPost?: {
    title: string;
    views: number;
    url?: string;
  };
}

export interface GitHubRepoMetrics {
  name: string;
  fullName: string;
  stars: number;
  starsTrend: number;
  newStars: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  url: string;
}

export interface AppMetrics extends VisitorMetrics {
  dau: number;
  wau: number;
  mau: number;
  downloads?: number;
}

export interface PackageMetrics {
  totalDownloads: number;
  downloadsTrend: number;
  weeklyDownloads: number;
  pageVisitors?: VisitorMetrics;
}

export interface DashboardOverview {
  totalVisitors: number;
  totalStars: number;
  totalDownloads: number;
  activeProjects: number;
}
