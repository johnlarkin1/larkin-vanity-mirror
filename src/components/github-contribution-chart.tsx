"use client";

import { Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DARK_SVG_URL =
  "https://raw.githubusercontent.com/johnlarkin1/johnlarkin1/main/profile-3d-contrib/night.svg";
const LIGHT_SVG_URL =
  "https://raw.githubusercontent.com/johnlarkin1/johnlarkin1/main/profile-3d-contrib/day.svg";

function ContributionImage({ className }: { className?: string }) {
  return (
    <picture className={className}>
      <source srcSet={DARK_SVG_URL} media="(prefers-color-scheme: dark)" />
      <source srcSet={LIGHT_SVG_URL} media="(prefers-color-scheme: light)" />
      <img
        src={LIGHT_SVG_URL}
        alt="GitHub contribution chart"
        className="h-full w-full object-contain object-center"
      />
    </picture>
  );
}

export function GitHubContributionChart() {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-base font-semibold">
          Contribution Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-2 overflow-hidden">
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="group relative block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              aria-label="Click to enlarge contribution chart"
            >
              <ContributionImage className="block h-full w-full" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10 rounded-md">
                <div className="flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" />
                  <span>Click to enlarge</span>
                </div>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>GitHub Contribution Activity</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-auto mt-4">
              <ContributionImage className="block w-full h-full object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
