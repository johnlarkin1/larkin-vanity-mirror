"use client";

import { useState, useCallback } from "react";
import { subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";

const DEFAULT_RANGE: DateRange = {
  from: subMonths(new Date(), 6),
  to: new Date(),
};

export function useDateRange(initialRange: DateRange = DEFAULT_RANGE) {
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);

  const updateDateRange = useCallback((range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  }, []);

  const resetDateRange = useCallback(() => {
    setDateRange(DEFAULT_RANGE);
  }, []);

  return {
    dateRange,
    setDateRange: updateDateRange,
    resetDateRange,
  };
}
