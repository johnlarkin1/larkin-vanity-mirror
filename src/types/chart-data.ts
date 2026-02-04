export interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface ChartConfig {
  title: string;
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number;
  chartType?: "line" | "area";
}

export interface DateRange {
  from: Date;
  to: Date;
}

export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
} as const;
