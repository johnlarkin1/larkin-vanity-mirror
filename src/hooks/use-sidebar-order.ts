"use client";

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_NAVIGATION, type NavigationItem } from "@/app/(dashboard)/_components/navigation-config";

const STORAGE_KEY = "vanity-mirror-sidebar-order";

// Module-level cache to ensure getSnapshot returns the same reference
let cachedOrder: string[] | null = null;
let cachedOrderJson: string | null = null;

function getStoredOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);

  // Return cached value if localStorage hasn't changed
  if (stored === cachedOrderJson) {
    return cachedOrder;
  }

  // Update cache
  cachedOrderJson = stored;
  if (!stored) {
    cachedOrder = null;
    return null;
  }

  try {
    cachedOrder = JSON.parse(stored) as string[];
    return cachedOrder;
  } catch {
    cachedOrder = null;
    return null;
  }
}

function reorderNavigation(order: string[] | null): NavigationItem[] {
  if (!order) return DEFAULT_NAVIGATION;

  // Reorder navigation based on stored order
  const reordered = order
    .map((id) => DEFAULT_NAVIGATION.find((item) => item.id === id))
    .filter((item): item is NavigationItem => item !== undefined);

  // Add any items not in the stored order (e.g., newly added items)
  const storedIds = new Set(order);
  const newItems = DEFAULT_NAVIGATION.filter((item) => !storedIds.has(item.id));

  return [...reordered, ...newItems];
}

// Store for localStorage with proper caching
function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      // Invalidate cache on external changes
      cachedOrderJson = null;
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): string[] | null {
  return getStoredOrder();
}

function getServerSnapshot(): string[] | null {
  return null;
}

export function useSidebarOrder() {
  // Use useSyncExternalStore for hydration-safe localStorage access
  const storedOrder = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Local state for optimistic updates (used when we make changes)
  const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null);

  // If we have an optimistic update pending, use it; otherwise use stored
  // After a re-render from storage update, optimisticOrder will be cleared
  const order = optimisticOrder ?? storedOrder;

  // Derive navigation from order
  const navigation = useMemo(() => reorderNavigation(order), [order]);

  const updateOrder = useCallback((newNavigation: NavigationItem[]) => {
    const newOrder = newNavigation.map((item) => item.id);

    // Optimistic update
    setOptimisticOrder(newOrder);

    // Update localStorage and cache
    const json = JSON.stringify(newOrder);
    localStorage.setItem(STORAGE_KEY, json);
    cachedOrderJson = json;
    cachedOrder = newOrder;

    // Clear optimistic state after storage is updated
    // The useSyncExternalStore will pick up the cached value
    setOptimisticOrder(null);
  }, []);

  const resetOrder = useCallback(() => {
    setOptimisticOrder(null);
    localStorage.removeItem(STORAGE_KEY);
    cachedOrderJson = null;
    cachedOrder = null;
  }, []);

  return {
    navigation,
    updateOrder,
    resetOrder,
  };
}
