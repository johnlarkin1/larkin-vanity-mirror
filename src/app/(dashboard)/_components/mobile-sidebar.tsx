"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebarOrder } from "@/hooks/use-sidebar-order";

interface MobileSidebarProps {
  onLinkClick?: () => void;
}

export function MobileSidebar({ onLinkClick }: MobileSidebarProps) {
  const pathname = usePathname();
  const { navigation } = useSidebarOrder();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/android-chrome-48x48.png"
            alt="Larkin Vanity Mirror"
            width={32}
            height={32}
          />
          <span className="text-lg font-semibold text-sidebar-foreground">Larkin Vanity Mirror</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-sidebar-accent-foreground" : item.iconColor
                  )}
                />
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
