import { Users, Eye, MousePointerClick, Timer } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatGroup } from "@/components/data-display/stat-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TennisScorigamiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tennis Scorigami</h1>
        <p className="text-muted-foreground">
          PostHog analytics for tennis-scorigami.com
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Visitors" value="--" icon={Users} trendLabel="This period" />
        <MetricCard title="Unique Visitors" value="--" icon={Eye} trendLabel="This period" />
        <MetricCard title="Total Events" value="--" icon={MousePointerClick} trendLabel="Interactions" />
        <MetricCard title="Avg. Session" value="--" icon={Timer} trendLabel="Duration" />
      </div>

      <StatGroup
        title="Active Users"
        stats={[
          { label: "DAU", value: "--" },
          { label: "WAU", value: "--" },
          { label: "MAU", value: "--" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Visitor Trends</CardTitle>
          <CardDescription>Daily visitors over the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect PostHog to view visitor trends
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
          <CardDescription>Most triggered events on the site</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect PostHog to view event analytics
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
