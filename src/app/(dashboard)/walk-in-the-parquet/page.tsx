import { Download, TrendingUp, Users, Package } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatGroup } from "@/components/data-display/stat-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalkInTheParquetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Walk in the Parquet</h1>
        <p className="text-muted-foreground">
          Package download statistics and documentation site metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Downloads" value="--" icon={Download} trendLabel="All time" />
        <MetricCard title="Weekly Downloads" value="--" icon={TrendingUp} trendLabel="This week" />
        <MetricCard title="Page Visitors" value="--" icon={Users} trendLabel="This period" />
        <MetricCard title="Package Version" value="--" icon={Package} trendLabel="Latest" />
      </div>

      <StatGroup
        title="Documentation Visitors"
        stats={[
          { label: "DAU", value: "--" },
          { label: "WAU", value: "--" },
          { label: "MAU", value: "--" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Download Trends</CardTitle>
          <CardDescription>Package downloads over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect npm/PyPI to view download trends
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Download by Version</CardTitle>
            <CardDescription>Distribution across package versions</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              Connect npm/PyPI to view version data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Pages</CardTitle>
            <CardDescription>Most visited documentation pages</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              Connect analytics to view page data
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
