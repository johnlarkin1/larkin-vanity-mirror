import { Smartphone, Clock, Globe, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkButton } from "@/components/ui/external-link-button";

export default function ScrollzPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Scrollz</h1>
          <p className="text-muted-foreground">iOS app metrics and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLinkButton
            href="https://scrollz.co"
            icon={<Globe className="h-4 w-4" />}
          >
            Website
          </ExternalLinkButton>
          <ExternalLinkButton
            href="https://apps.apple.com/us/app/scrollz-for-reddit/id1600011510"
            icon={<Download className="h-4 w-4" />}
          >
            App Store
          </ExternalLinkButton>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Smartphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription>
            Analytics and metrics for the Scrollz iOS app are under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Check back later for app download trends, user engagement, and feedback tracking.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
