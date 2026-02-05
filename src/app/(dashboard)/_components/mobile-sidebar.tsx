"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Github,
  Gamepad2,
  Smartphone,
  Package,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Blog",
    href: "/blog",
    icon: FileText,
    description: "johnlarkin1.github.io",
  },
  {
    name: "GitHub",
    href: "/github",
    icon: Github,
    description: "Star tracking",
  },
  {
    name: "Tennis Scorigami",
    href: "/tennis-scorigami",
    icon: Gamepad2,
    description: "PostHog analytics",
  },
  {
    name: "Scrollz",
    href: "/scrollz",
    icon: Smartphone,
    description: "iOS app metrics",
  },
  {
    name: "Walk in the Parquet",
    href: "/walk-in-the-parquet",
    icon: Package,
    description: "Package downloads",
  },
  {
    name: "Published Packages",
    href: "/packages",
    icon: Boxes,
    description: "npm, PyPI, Cargo",
  },
];

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold text-sidebar-foreground">Vanity Mirror</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
