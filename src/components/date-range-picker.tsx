"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const presets = [
  {
    label: "Last 7 days",
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: "Last 90 days",
    getValue: () => ({
      from: subDays(new Date(), 90),
      to: new Date(),
    }),
  },
  {
    label: "Last 6 months",
    getValue: () => ({
      from: subMonths(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "Last year",
    getValue: () => ({
      from: subYears(new Date(), 1),
      to: new Date(),
    }),
  },
];

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  disableFuture?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  disableFuture = true,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    value ?? { from: subDays(new Date(), 30), to: new Date() }
  );

  // Sync internal state when external value changes (controlled mode)
  React.useEffect(() => {
    if (value !== undefined) {
      setDate(value);
    }
  }, [value]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onChange?.(newDate);
  };

  const handlePresetClick = (preset: (typeof presets)[number]) => {
    const newRange = preset.getValue();
    handleDateChange(newRange);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="end">
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="rounded-md border">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            disabled={disableFuture ? { after: new Date() } : undefined}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
