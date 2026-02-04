import { FileText, Users, Eye, Clock } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blog Analytics</h1>
        <p className="text-muted-foreground">
          Metrics for johnlarkin1.github.io from Google Analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Visitors" value="--" icon={Users} trendLabel="This period" />
        <MetricCard title="Unique Visitors" value="--" icon={Eye} trendLabel="This period" />
        <MetricCard title="Avg. Time on Site" value="--" icon={Clock} trendLabel="Per session" />
        <MetricCard title="Total Posts" value="--" icon={FileText} trendLabel="Published" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitor Trends</CardTitle>
          <CardDescription>Daily visitors over the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect Google Analytics to view visitor trends
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Popular Posts</CardTitle>
          <CardDescription>Top performing content by page views</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect Google Analytics to view popular posts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
