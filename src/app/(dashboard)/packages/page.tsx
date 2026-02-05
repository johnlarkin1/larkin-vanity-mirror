"use client";

import { Download, TrendingUp, Boxes, Trophy, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/data-display/metric-card";
import { DataTable } from "@/components/data-display/data-table";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDateRange } from "@/hooks/use-date-range";
import {
  usePackagesAnalytics,
  type PackageDownloads,
  type PackageRegistry,
} from "@/hooks/use-packages-analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Registry color mapping for badges
const registryColors: Record<PackageRegistry, string> = {
  npm: "bg-red-500",
  pypi: "bg-blue-500",
  crates: "bg-orange-500",
};

const registryLabels: Record<PackageRegistry, string> = {
  npm: "npm",
  pypi: "PyPI",
  crates: "crates.io",
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

function formatPackageCount(packages: PackageDownloads[]): string {
  const counts: Record<PackageRegistry, number> = {
    npm: 0,
    pypi: 0,
    crates: 0,
  };

  packages.forEach((pkg) => {
    counts[pkg.registry]++;
  });

  const parts: string[] = [];
  if (counts.npm > 0) parts.push(`${counts.npm} npm`);
  if (counts.pypi > 0) parts.push(`${counts.pypi} PyPI`);
  if (counts.crates > 0) parts.push(`${counts.crates} crate${counts.crates > 1 ? "s" : ""}`);

  return parts.join(", ");
}

const columns: ColumnDef<PackageDownloads>[] = [
  {
    accessorKey: "rank",
    header: "#",
    cell: ({ row }) => {
      const rank = row.index + 1;
      if (rank <= 3) {
        const medals = ["🥇", "🥈", "🥉"];
        return <span className="text-lg">{medals[rank - 1]}</span>;
      }
      return <span className="text-muted-foreground">{rank}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Package",
    cell: ({ row }) => {
      const pkg = row.original;
      return (
        <a
          href={pkg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-medium hover:underline"
        >
          {pkg.name}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    },
  },
  {
    accessorKey: "registry",
    header: "Registry",
    cell: ({ row }) => {
      const registry = row.original.registry;
      const colorClass = registryColors[registry];
      return (
        <Badge variant="secondary" className="gap-1.5">
          <span className={`h-2 w-2 rounded-full ${colorClass}`} />
          {registryLabels[registry]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalDownloads",
    header: "Downloads",
    cell: ({ row }) => (
      <span className="font-medium">{formatNumber(row.original.totalDownloads)}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        Released
      </div>
    ),
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return <span className="text-muted-foreground">-</span>;
      const date = new Date(createdAt);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      );
    },
  },
];

export default function PackagesPage() {
  const { dateRange, setDateRange } = useDateRange();
  const { data, isLoading, error, refetch, isFetching } = usePackagesAnalytics({
    dateRange,
  });

  const handleRefresh = () => {
    refetch();
  };

  // Transform time series data for the chart (npm + PyPI only, crates doesn't provide daily data)
  const chartData =
    data?.timeSeries.map((point) => ({
      date: point.date,
      npm: point.npm,
      pypi: point.pypi,
    })) ?? [];

  const chartSeries = [
    { dataKey: "npm", name: "npm", color: "#ef4444" },
    { dataKey: "pypi", name: "PyPI", color: "#3b82f6" },
  ];

  // Check if we have any crates packages configured
  const hasCratesPackages = data?.packages.some((p) => p.registry === "crates") ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Published Packages</h1>
          <p className="text-muted-foreground">
            Download statistics from npm, PyPI, and crates.io
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load package data"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Downloads"
          value={data ? formatNumber(data.metrics.totalDownloads) : "--"}
          icon={Download}
          trendLabel="Selected period"
          isLoading={isLoading}
        />
        <MetricCard
          title="Daily Average"
          value={
            data && data.timeSeries.length > 0
              ? formatNumber(Math.round(data.metrics.totalDownloads / data.timeSeries.length))
              : "--"
          }
          icon={TrendingUp}
          trendLabel="Downloads per day"
          isLoading={isLoading}
        />
        <MetricCard
          title="Package Count"
          value={data?.metrics.packageCount ?? "--"}
          icon={Boxes}
          trendLabel={data?.packages ? formatPackageCount(data.packages) : ""}
          isLoading={isLoading}
        />
        <MetricCard
          title="Top Package"
          value={data?.topPackage?.name ?? "--"}
          icon={Trophy}
          trendLabel={
            data?.topPackage
              ? `${formatNumber(data.topPackage.weeklyDownloads)} downloads`
              : ""
          }
          isLoading={isLoading}
        />
      </div>

      {chartData.length > 0 && (
        <div className="space-y-2">
          <TimeSeriesChart
            title={hasCratesPackages ? "Daily Downloads (npm + PyPI)" : "Daily Downloads"}
            data={chartData}
            series={chartSeries}
            height={300}
          />
          {hasCratesPackages && (
            <p className="text-sm text-muted-foreground px-1">
              crates.io does not provide daily download statistics. Crate totals are included in the metrics above.
            </p>
          )}
        </div>
      )}

      <DataTable
        title="Package Overview"
        columns={columns}
        data={data?.packages ?? []}
        isLoading={isLoading}
        enableFiltering
        filterColumn="name"
        filterPlaceholder="Filter packages..."
        enablePagination
        pageSize={10}
      />
    </div>
  );
}
