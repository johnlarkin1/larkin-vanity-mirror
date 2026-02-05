"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

const COLLAPSED_KEY = "vanity-mirror-sidebar-collapsed";
const WIDTH_KEY = "vanity-mirror-sidebar-width";

const DEFAULT_WIDTH = 256; // 16rem = 256px
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 60;

// Module-level cache for collapsed state
let cachedCollapsed: boolean | null = null;
let cachedCollapsedValue: string | null = null;

function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(COLLAPSED_KEY);

  if (stored === cachedCollapsedValue) {
    return cachedCollapsed ?? false;
  }

  cachedCollapsedValue = stored;
  cachedCollapsed = stored === "true";
  return cachedCollapsed;
}

// Module-level cache for width
let cachedWidth: number | null = null;
let cachedWidthValue: string | null = null;

function getStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const stored = localStorage.getItem(WIDTH_KEY);

  if (stored === cachedWidthValue) {
    return cachedWidth ?? DEFAULT_WIDTH;
  }

  cachedWidthValue = stored;
  const parsed = stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
  cachedWidth = isNaN(parsed) ? DEFAULT_WIDTH : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed));
  return cachedWidth;
}

function subscribeCollapsed(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === COLLAPSED_KEY) {
      cachedCollapsedValue = null;
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function subscribeWidth(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === WIDTH_KEY) {
      cachedWidthValue = null;
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getCollapsedSnapshot(): boolean {
  return getStoredCollapsed();
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function getWidthSnapshot(): number {
  return getStoredWidth();
}

function getWidthServerSnapshot(): number {
  return DEFAULT_WIDTH;
}

export function useSidebarState() {
  const storedCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot
  );

  const storedWidth = useSyncExternalStore(
    subscribeWidth,
    getWidthSnapshot,
    getWidthServerSnapshot
  );

  const [optimisticCollapsed, setOptimisticCollapsed] = useState<boolean | null>(null);
  const [optimisticWidth, setOptimisticWidth] = useState<number | null>(null);

  const isCollapsed = optimisticCollapsed ?? storedCollapsed;
  const width = optimisticWidth ?? storedWidth;

  const toggleCollapsed = useCallback(() => {
    const newValue = !getStoredCollapsed();
    setOptimisticCollapsed(newValue);
    localStorage.setItem(COLLAPSED_KEY, String(newValue));
    cachedCollapsedValue = String(newValue);
    cachedCollapsed = newValue;
    setOptimisticCollapsed(null);
  }, []);

  const setWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
    setOptimisticWidth(clampedWidth);
    localStorage.setItem(WIDTH_KEY, String(clampedWidth));
    cachedWidthValue = String(clampedWidth);
    cachedWidth = clampedWidth;
    setOptimisticWidth(null);
  }, []);

  return {
    isCollapsed,
    width: isCollapsed ? COLLAPSED_WIDTH : width,
    expandedWidth: width,
    toggleCollapsed,
    setWidth,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    collapsedWidth: COLLAPSED_WIDTH,
  };
}
