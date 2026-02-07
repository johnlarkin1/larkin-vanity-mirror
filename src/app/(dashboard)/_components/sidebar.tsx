"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSidebarOrder } from "@/hooks/use-sidebar-order";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { SortableNavItem } from "./sortable-nav-item";

export function Sidebar() {
  const pathname = usePathname();
  const { navigation, updateOrder } = useSidebarOrder();
  const { isCollapsed, width, expandedWidth, toggleCollapsed, setWidth, minWidth, maxWidth } =
    useSidebarState();

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = navigation.findIndex((item) => item.id === active.id);
      const newIndex = navigation.findIndex((item) => item.id === over.id);
      updateOrder(arrayMove(navigation, oldIndex, newIndex));
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return;

      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = expandedWidth;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (e.clientX - startX);
        setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isCollapsed, expandedWidth, setWidth, minWidth, maxWidth]
  );

  return (
    <aside
      ref={sidebarRef}
      style={{ width }}
      className={cn(
        "relative hidden flex-shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block",
        isResizing && "transition-none"
      )}
    >
      {/* Resize handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30"
        />
      )}

      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link
          href="/"
          className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}
        >
          <Image
            src="/android-chrome-48x48.png"
            alt="Larkin Vanity Mirror"
            width={32}
            height={32}
          />
          <span
            className={cn(
              "text-xl font-semibold text-sidebar-foreground transition-opacity",
              isCollapsed && "sr-only"
            )}
          >
            Larkin Vanity Mirror
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-4rem-3rem)]">
        <nav className={cn("flex flex-col gap-1 p-2", isCollapsed && "items-center")}>
          {isCollapsed ? (
            // Collapsed view - icons only, no drag
            navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.name}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-sidebar-accent-foreground" : item.iconColor
                    )}
                  />
                </Link>
              );
            })
          ) : (
            // Expanded view - full items with drag
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={navigation.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {navigation.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    isActive={pathname === item.href}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="absolute bottom-0 left-0 right-0 flex h-12 items-center justify-center border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="h-8 w-8 p-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
