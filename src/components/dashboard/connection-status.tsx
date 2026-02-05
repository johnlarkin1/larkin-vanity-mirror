"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SourceInfo, SourceStatus } from "@/hooks/use-overview-analytics";

interface ConnectionStatusProps {
  sources: SourceInfo[];
  isLoading?: boolean;
}

function StatusIndicator({ status }: { status: SourceStatus }) {
  switch (status) {
    case "connected":
      return (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Connected</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Error</span>
        </div>
      );
    case "loading":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Checking...</span>
        </div>
      );
    case "not-configured":
    default:
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
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
            <Link
              key={source.id}
              href={source.href}
              className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <StatusDot status={source.status} />
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground">{source.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status={source.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
