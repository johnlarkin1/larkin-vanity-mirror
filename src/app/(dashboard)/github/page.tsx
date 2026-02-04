"use client";

import { Star, TrendingUp, GitFork, Eye, FolderGit2, RefreshCw, ExternalLink } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/data-display/metric-card";
import { DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGitHubAnalytics, type GitHubRepository } from "@/hooks/use-github-analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Language color mapping for badges
const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-500",
  Python: "bg-green-600",
  Rust: "bg-orange-600",
  Go: "bg-cyan-500",
  Java: "bg-red-600",
  "C++": "bg-pink-600",
  C: "bg-gray-600",
  Ruby: "bg-red-500",
  Swift: "bg-orange-500",
  Kotlin: "bg-purple-500",
  PHP: "bg-indigo-400",
  Shell: "bg-green-500",
  HTML: "bg-orange-400",
  CSS: "bg-blue-400",
  Jupyter: "bg-orange-500",
};

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

const columns: ColumnDef<GitHubRepository>[] = [
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
    header: "Repository",
    cell: ({ row }) => {
      const repo = row.original;
      return (
        <div className="flex flex-col gap-1">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-medium hover:underline"
          >
            {repo.name}
            <ExternalLink className="h-3 w-3" />
          </a>
          {repo.description && (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {repo.description}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "language",
    header: "Language",
    cell: ({ row }) => {
      const language = row.original.language;
      if (!language) return <span className="text-muted-foreground">-</span>;
      const colorClass = languageColors[language] ?? "bg-gray-500";
      return (
        <Badge variant="secondary" className="gap-1.5">
          <span className={`h-2 w-2 rounded-full ${colorClass}`} />
          {language}
        </Badge>
      );
    },
  },
  {
    accessorKey: "stars",
    header: () => (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4" />
        Stars
      </div>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatNumber(row.original.stars)}</span>
    ),
  },
  {
    accessorKey: "forks",
    header: () => (
      <div className="flex items-center gap-1">
        <GitFork className="h-4 w-4" />
        Forks
      </div>
    ),
    cell: ({ row }) => formatNumber(row.original.forks),
  },
  {
    accessorKey: "isArchived",
    header: "Status",
    cell: ({ row }) => {
      if (row.original.isArchived) {
        return <Badge variant="outline">Archived</Badge>;
      }
      return <Badge variant="default">Active</Badge>;
    },
  },
];

export default function GitHubPage() {
  const { data, isLoading, error, refetch, isFetching } = useGitHubAnalytics();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Metrics</h1>
          <p className="text-muted-foreground">
            Star tracking and repository analytics across your GitHub projects
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load GitHub data"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Stars"
          value={data ? formatNumber(data.metrics.totalStars) : "--"}
          icon={Star}
          trendLabel="All repos"
          isLoading={isLoading}
        />
        <MetricCard
          title="New Stars (Week)"
          value={data?.metrics.newStarsThisWeek ?? "--"}
          icon={TrendingUp}
          trend={data?.metrics.starsTrend}
          trendLabel="vs last week"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Forks"
          value={data ? formatNumber(data.metrics.totalForks) : "--"}
          icon={GitFork}
          trendLabel="All repos"
          isLoading={isLoading}
        />
        <MetricCard
          title="Watchers"
          value={data ? formatNumber(data.metrics.totalWatchers) : "--"}
          icon={Eye}
          trendLabel="All repos"
          isLoading={isLoading}
        />
        <MetricCard
          title="Repositories"
          value={data?.metrics.repoCount ?? "--"}
          icon={FolderGit2}
          trendLabel="Public repos"
          isLoading={isLoading}
        />
      </div>

      <DataTable
        title="Repository Overview"
        columns={columns}
        data={data?.repositories ?? []}
        isLoading={isLoading}
        enableFiltering
        filterColumn="name"
        filterPlaceholder="Filter repositories..."
        enablePagination
        pageSize={10}
      />
    </div>
  );
}
