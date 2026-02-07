"use client";

import { Star, TrendingUp, GitFork, Eye, FolderGit2, RefreshCw, ExternalLink, Calendar, Lock, Globe } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/data-display/metric-card";
import { DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGitHubAnalytics, type GitHubRepository, type LanguageBreakdown } from "@/hooks/use-github-analytics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function LanguageBar({ languages }: { languages: LanguageBreakdown[] }) {
  if (languages.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const top3 = languages.slice(0, 3);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1.5 min-w-[120px]">
        {/* Stacked bar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {languages.map((lang, i) => {
                const colorClass = languageColors[lang.language] ?? "bg-gray-500";
                return (
                  <div
                    key={i}
                    className={colorClass}
                    style={{ width: `${lang.percentage}%` }}
                  />
                );
              })}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              {languages.map((lang, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${languageColors[lang.language] ?? "bg-gray-500"}`} />
                    {lang.language}
                  </span>
                  <span className="text-muted-foreground">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
        {/* Top 3 languages with percentages */}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {top3.map((lang, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${languageColors[lang.language] ?? "bg-gray-500"}`} />
              {lang.language} {lang.percentage}%
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
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
            {repo.isFork && <GitFork className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span>{repo.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          {repo.description && (
            <p className="text-xs text-muted-foreground">
              {repo.description}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "languages",
    header: "Languages",
    cell: ({ row }) => <LanguageBar languages={row.original.languages} />,
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
      const badges = [];
      // Visibility badge
      if (row.original.isPrivate) {
        badges.push(
          <Badge key="private" variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        );
      } else {
        badges.push(
          <Badge key="public" variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        );
      }
      // Fork badge
      if (row.original.isFork) {
        badges.push(
          <Badge key="fork" variant="secondary" className="gap-1">
            <GitFork className="h-3 w-3" />
            Fork
          </Badge>
        );
      }
      // Archive status
      if (row.original.isArchived) {
        badges.push(<Badge key="archived" variant="outline">Archived</Badge>);
      }
      return <div className="flex flex-wrap gap-1">{badges}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        Created
      </div>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      );
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">GitHub Metrics</h1>
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
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
          trendLabel="All repos"
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
        pageSize={20}
      />
    </div>
  );
}
