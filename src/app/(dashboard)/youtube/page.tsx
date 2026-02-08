"use client";

import { Eye, Users, Video, Trophy, RefreshCw, ExternalLink } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/data-display/metric-card";
import { DataTable } from "@/components/data-display/data-table";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Button } from "@/components/ui/button";
import { useYouTubeAnalytics, type YouTubeVideo } from "@/hooks/use-youtube-analytics";
import { ExternalLinkButton } from "@/components/ui/external-link-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

const columns: ColumnDef<YouTubeVideo>[] = [
  {
    accessorKey: "rank",
    header: "#",
    cell: ({ row }) => {
      const rank = row.index + 1;
      if (rank <= 3) {
        const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
        return <span className="text-lg">{medals[rank - 1]}</span>;
      }
      return <span className="text-muted-foreground">{rank}</span>;
    },
  },
  {
    accessorKey: "title",
    header: "Video",
    cell: ({ row }) => {
      const video = row.original;
      return (
        <div className="flex items-center gap-3">
          {video.thumbnailUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-9 w-16 rounded object-cover shrink-0"
            />
          )}
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-medium hover:underline line-clamp-2"
          >
            <span>{video.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "viewCount",
    header: "Views",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.viewCount.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "likeCount",
    header: "Likes",
    cell: ({ row }) => row.original.likeCount.toLocaleString(),
  },
  {
    accessorKey: "commentCount",
    header: "Comments",
    cell: ({ row }) => row.original.commentCount.toLocaleString(),
  },
  {
    accessorKey: "publishedAt",
    header: "Published",
    cell: ({ row }) => {
      const date = new Date(row.original.publishedAt);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      );
    },
  },
];

export default function YouTubePage() {
  const { data, isLoading, error, refetch, isFetching } = useYouTubeAnalytics();

  const topVideo = data?.videos[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">YouTube Metrics</h1>
          <p className="text-muted-foreground">
            Video analytics and channel performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <ExternalLinkButton
              href={data.metrics.channelUrl}
              icon={<Video className="h-4 w-4" />}
            >
              Channel
            </ExternalLinkButton>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load YouTube data"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Views"
          value={data ? formatNumber(data.metrics.totalViews) : "--"}
          icon={Eye}
          trendLabel="All videos"
          isLoading={isLoading}
        />
        <MetricCard
          title="Subscribers"
          value={data ? formatNumber(data.metrics.subscribers) : "--"}
          icon={Users}
          trendLabel="Channel"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Videos"
          value={data?.metrics.totalVideos ?? "--"}
          icon={Video}
          trendLabel="Published"
          isLoading={isLoading}
        />
        <MetricCard
          title="Most Viewed"
          value={topVideo ? topVideo.title : "--"}
          icon={Trophy}
          trendLabel={topVideo ? `${formatNumber(topVideo.viewCount)} views` : undefined}
          isLoading={isLoading}
        />
      </div>

      <TimeSeriesChart
        title="Views by Publish Month"
        data={(data?.viewsByMonth ?? []).map(({ month, views, videoCount }) => ({ month, views, videoCount }))}
        series={[
          { dataKey: "views", name: "Views", color: "#ef4444" },
        ]}
        xAxisKey="month"
        isLoading={isLoading}
      />

      <DataTable
        title="Video Performance"
        columns={columns}
        data={data?.videos ?? []}
        isLoading={isLoading}
        enableFiltering
        filterColumn="title"
        filterPlaceholder="Filter videos..."
        enablePagination
        pageSize={20}
      />
    </div>
  );
}
