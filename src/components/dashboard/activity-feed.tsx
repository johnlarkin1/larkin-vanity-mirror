"use client";

import { useState, useMemo } from "react";
import { FileText, Star, Package, Zap, MessageSquare, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ActivityItem, DataSource } from "@/hooks/use-overview-analytics";

interface ActivityFeedProps {
  items: ActivityItem[];
  isLoading?: boolean;
}

type FilterOption = "all" | DataSource;

const sourceConfig: Record<
  DataSource,
  { label: string; color: string; bgColor: string; icon: typeof FileText }
> = {
  blog: {
    label: "Blog",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20 data-[active=true]:bg-blue-500/25",
    icon: FileText,
  },
  github: {
    label: "GitHub",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20 data-[active=true]:bg-purple-500/25",
    icon: Star,
  },
  packages: {
    label: "Packages",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 data-[active=true]:bg-green-500/25",
    icon: Package,
  },
  "tennis-scorigami": {
    label: "Tennis",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20 data-[active=true]:bg-orange-500/25",
    icon: Zap,
  },
  "walk-in-the-parquet": {
    label: "Parquet",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10 hover:bg-pink-500/20 data-[active=true]:bg-pink-500/25",
    icon: MessageSquare,
  },
};

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "blog", label: "Blog" },
  { value: "github", label: "GitHub" },
  { value: "packages", label: "Packages" },
  { value: "tennis-scorigami", label: "Tennis" },
  { value: "walk-in-the-parquet", label: "Parquet" },
];

function FilterChip({
  label,
  isActive,
  onClick,
  count,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
        isActive
          ? "bg-foreground text-background"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "ml-0.5 tabular-nums",
            isActive ? "text-background/70" : "text-muted-foreground/70"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CompactActivityItem({ item }: { item: ActivityItem }) {
  const config = sourceConfig[item.source];
  const Icon = config.icon;

  const content = (
    <div className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded",
          config.bgColor,
          config.color
        )}
        data-active="true"
      >
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
          {item.href && (
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {item.description}
          {item.description && item.timestamp && " · "}
          {item.timestamp && formatDistanceToNow(item.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}

function CompactItemSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5">
      <Skeleton className="h-6 w-6 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ActivityFeed({ items, isLoading = false }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  // Count items per source for filter badges
  const sourceCounts = useMemo(() => {
    const counts: Partial<Record<FilterOption, number>> = { all: items.length };
    items.forEach((item) => {
      counts[item.source] = (counts[item.source] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.source === activeFilter);
  }, [items, activeFilter]);

  // Only show filters that have items
  const availableFilters = useMemo(() => {
    return filterOptions.filter(
      (opt) => opt.value === "all" || (sourceCounts[opt.value] ?? 0) > 0
    );
  }, [sourceCounts]);

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="mb-3 flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-14 rounded-full" />
            ))}
          </div>
          <div className="space-y-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <CompactItemSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasItems = items.length > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events across your projects</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {hasItems ? (
          <>
            {/* Filter chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {availableFilters.map((filter) => (
                <FilterChip
                  key={filter.value}
                  label={filter.label}
                  isActive={activeFilter === filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  count={filter.value === "all" ? undefined : sourceCounts[filter.value]}
                />
              ))}
            </div>

            {/* Scrollable activity list */}
            <ScrollArea className="h-[280px]">
              <div className="space-y-0.5 pr-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <CompactActivityItem key={item.id} item={item} />
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No activity for this filter
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Activity feed will appear here once integrations are connected.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
