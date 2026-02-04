import { Users, Star, Download, FolderGit2 } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Your personal analytics at a glance. Metrics will update once integrations are connected.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Visitors"
          value="--"
          icon={Users}
          trendLabel="Across all projects"
        />
        <MetricCard
          title="GitHub Stars"
          value="--"
          icon={Star}
          trendLabel="All repositories"
        />
        <MetricCard
          title="Package Downloads"
          value="--"
          icon={Download}
          trendLabel="Total downloads"
        />
        <MetricCard
          title="Active Projects"
          value="5"
          icon={FolderGit2}
          trendLabel="Being tracked"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events across your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will appear here once integrations are connected.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key metrics from the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stats will appear here once integrations are connected.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Connect your data sources to see your metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Google Analytics", status: "Not connected", for: "Blog metrics" },
              { name: "PostHog", status: "Not connected", for: "Tennis Scorigami" },
              { name: "Supabase", status: "Not connected", for: "Scrollz app" },
              { name: "GitHub API", status: "Not connected", for: "Star tracking" },
              { name: "npm/PyPI", status: "Not connected", for: "Package downloads" },
              { name: "Canny", status: "Not connected", for: "Notifications" },
            ].map((source) => (
              <div key={source.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground">{source.for}</p>
                </div>
                <span className="text-xs text-muted-foreground">{source.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
