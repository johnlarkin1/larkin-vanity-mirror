import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string | number;
  trend?: number;
}

interface StatGroupProps {
  title: string;
  stats: Stat[];
  isLoading?: boolean;
  className?: string;
}

export function StatGroup({ title, stats, isLoading = false, className }: StatGroupProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend?: number) => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getTrendColor = (trend?: number) => {
    if (trend === undefined || trend === 0) {
      return "text-muted-foreground";
    }
    return trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
              {stat.trend !== undefined && (
                <p className={cn("flex items-center gap-0.5 text-xs", getTrendColor(stat.trend))}>
                  {getTrendIcon(stat.trend)}
                  <span>
                    {stat.trend > 0 ? "+" : ""}
                    {stat.trend}%
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
