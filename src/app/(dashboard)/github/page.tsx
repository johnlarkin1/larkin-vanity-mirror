import { Star, TrendingUp, GitFork, Eye } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GitHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GitHub Metrics</h1>
        <p className="text-muted-foreground">
          Star tracking and repository analytics across your GitHub projects
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Stars" value="--" icon={Star} trendLabel="All repos" />
        <MetricCard title="New Stars (Week)" value="--" icon={TrendingUp} trendLabel="This week" />
        <MetricCard title="Total Forks" value="--" icon={GitFork} trendLabel="All repos" />
        <MetricCard title="Watchers" value="--" icon={Eye} trendLabel="All repos" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Star History</CardTitle>
          <CardDescription>Star accumulation over time across all repositories</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect GitHub to view star history
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repository Overview</CardTitle>
          <CardDescription>Your tracked repositories and their metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect GitHub to view repository details
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
