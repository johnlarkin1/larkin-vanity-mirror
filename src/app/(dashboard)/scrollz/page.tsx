import { Download, Users, Bell, Smartphone } from "lucide-react";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatGroup } from "@/components/data-display/stat-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScrollzPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scrollz</h1>
        <p className="text-muted-foreground">
          iOS app metrics from Supabase and Canny notifications
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="App Downloads" value="--" icon={Download} trendLabel="Total" />
        <MetricCard title="Active Users" value="--" icon={Users} trendLabel="This period" />
        <MetricCard title="Canny Alerts" value="--" icon={Bell} trendLabel="Pending" />
        <MetricCard title="Sessions" value="--" icon={Smartphone} trendLabel="This period" />
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
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Daily active users over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Connect Supabase to view user growth
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Download Trends</CardTitle>
            <CardDescription>App store downloads over time</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              Connect Supabase to view download data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Canny Notifications</CardTitle>
            <CardDescription>Latest feedback and feature requests</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              Connect Canny to view notifications
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
