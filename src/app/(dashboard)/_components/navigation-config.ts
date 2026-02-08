import {
  LayoutDashboard,
  FileText,
  Github,
  Youtube,
  Gamepad2,
  Smartphone,
  Package,
  Boxes,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  description?: string;
}

export const DEFAULT_NAVIGATION: NavigationItem[] = [
  {
    id: "overview",
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
    iconColor: "text-indigo-500",
  },
  {
    id: "blog",
    name: "Blog",
    href: "/blog",
    icon: FileText,
    iconColor: "text-emerald-500",
    description: "johnlarkin1.github.io",
  },
  {
    id: "github",
    name: "GitHub",
    href: "/github",
    icon: Github,
    iconColor: "text-violet-500",
    description: "Star tracking",
  },
  {
    id: "youtube",
    name: "YouTube",
    href: "/youtube",
    icon: Youtube,
    iconColor: "text-red-500",
    description: "Video analytics",
  },
  {
    id: "tennis-scorigami",
    name: "Tennis Scorigami",
    href: "/tennis-scorigami",
    icon: Gamepad2,
    iconColor: "text-amber-500",
    description: "PostHog analytics",
  },
  {
    id: "scrollz",
    name: "Scrollz",
    href: "/scrollz",
    icon: Smartphone,
    iconColor: "text-cyan-500",
    description: "iOS app metrics",
  },
  {
    id: "walk-in-the-parquet",
    name: "Walk in the Parquet",
    href: "/walk-in-the-parquet",
    icon: Package,
    iconColor: "text-rose-500",
    description: "Package downloads",
  },
  {
    id: "packages",
    name: "Published Packages",
    href: "/packages",
    icon: Boxes,
    iconColor: "text-orange-500",
    description: "npm, PyPI, Cargo",
  },
  {
    id: "vanity-mirror",
    name: "Vanity Mirror Dashboard",
    href: "/vanity-mirror",
    icon: Sparkles,
    iconColor: "text-purple-500",
    description: "Analytics for this very dashboard",
  },
];
