"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "./navigation-config";

interface SortableNavItemProps {
  item: NavigationItem;
  isActive: boolean;
}

export function SortableNavItem({ item, isActive }: SortableNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center rounded-lg transition-colors",
        isDragging && "opacity-50",
        isActive
          ? "bg-sidebar-accent"
          : "hover:bg-sidebar-accent"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex h-full w-8 cursor-grab items-center justify-center py-2 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
        suppressHydrationWarning
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Link
        href={item.href}
        className={cn(
          "flex flex-1 items-center gap-3 px-2 py-2 text-sm transition-colors",
          isActive
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
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
    </div>
  );
}
