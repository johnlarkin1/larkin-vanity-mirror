"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SourceInfo, SourceStatus } from "@/hooks/use-overview-analytics";

const EXTERNAL_URLS: Record<string, string> = {
  blog: "https://johnlarkin1.github.io",
  github: "https://github.com/johnlarkin1",
  youtube: "https://www.youtube.com/@johnlarkin1",
  "tennis-scorigami": "https://tennis-scorigami.com",
  scrollz: "https://scrollz.co",
  "walk-in-the-parquet": "https://www.walkintheparquet.com",
};

interface ConnectionStatusProps {
  sources: SourceInfo[];
  isLoading?: boolean;
}

function StatusIndicator({ status }: { status: SourceStatus }) {
  switch (status) {
    case "connected":
      return (
        <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-green-600/50 bg-background px-3 text-green-600 dark:border-green-400/50 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Connected</span>
        </div>
      );
    case "error":
      return (
        <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-600/50 bg-background px-3 text-red-600 dark:border-red-400/50 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Error</span>
        </div>
      );
    case "loading":
      return (
        <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs font-medium">Checking...</span>
        </div>
      );
    case "not-configured":
    default:
      return (
        <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Not configured</span>
        </div>
      );
  }
}

function StatusDot({ status }: { status: SourceStatus }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        status === "connected" && "bg-green-500",
        status === "error" && "bg-red-500",
        status === "loading" && "animate-pulse bg-yellow-500",
        status === "not-configured" && "bg-gray-400"
      )}
    />
  );
}

function SourceRow({ source }: { source: SourceInfo }) {
  const router = useRouter();
  const externalUrl = EXTERNAL_URLS[source.id];

  const handleClick = () => {
    router.push(source.href);
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <StatusDot status={source.status} />
        <div>
          <p className="font-medium">{source.name}</p>
          <p className="text-xs text-muted-foreground">{source.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusIndicator status={source.status} />
        <span className="inline-flex h-8 w-[62px] items-center justify-center">
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalClick}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={`Open ${source.name} in new tab`}
            >
              Visit
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}

export function ConnectionStatus({ sources, isLoading = false }: ConnectionStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
        <CardDescription>
          Connect your data sources to see your metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceRow key={source.id} source={source} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
