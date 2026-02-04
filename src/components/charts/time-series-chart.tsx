"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Series {
  dataKey: string;
  name: string;
  color: string;
}

type ChartDataPoint = { [key: string]: string | number };

interface TimeSeriesChartProps {
  title: string;
  data: ChartDataPoint[];
  series: Series[];
  xAxisKey?: string;
  height?: number;
  chartType?: "line" | "area";
  isLoading?: boolean;
  className?: string;
}

// Vibrant color palette with excellent contrast for data visualization
// Works beautifully in both light and dark modes
const CHART_COLORS = {
  primary: {
    stroke: "#6366f1", // Indigo - excellent visibility
    fill: "rgba(99, 102, 241, 0.25)",
    glow: "rgba(99, 102, 241, 0.5)",
  },
  secondary: {
    stroke: "#22d3ee", // Cyan - great contrast with indigo
    fill: "rgba(34, 211, 238, 0.2)",
    glow: "rgba(34, 211, 238, 0.4)",
  },
  tertiary: {
    stroke: "#f472b6", // Pink - adds warmth
    fill: "rgba(244, 114, 182, 0.2)",
    glow: "rgba(244, 114, 182, 0.4)",
  },
  quaternary: {
    stroke: "#34d399", // Emerald
    fill: "rgba(52, 211, 153, 0.2)",
    glow: "rgba(52, 211, 153, 0.4)",
  },
  quinary: {
    stroke: "#fbbf24", // Amber
    fill: "rgba(251, 191, 36, 0.2)",
    glow: "rgba(251, 191, 36, 0.4)",
  },
};

const COLOR_SEQUENCE = ["primary", "secondary", "tertiary", "quaternary", "quinary"] as const;

function getColorForIndex(index: number) {
  const colorKey = COLOR_SEQUENCE[index % COLOR_SEQUENCE.length];
  return CHART_COLORS[colorKey];
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
  }>;
  label?: string;
  series: Series[];
}

function CustomTooltip({ active, payload, label, series }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-popover px-4 py-3 shadow-xl shadow-black/10">
      <div className="mb-3 border-b pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const colors = getColorForIndex(index);
          const seriesInfo = series.find((s) => s.dataKey === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors.stroke }}
                />
                <span className="text-sm text-muted-foreground">
                  {seriesInfo?.name ?? entry.name}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {entry.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimeSeriesChart({
  title,
  data,
  series,
  xAxisKey = "date",
  height = 300,
  chartType = "area",
  isLoading = false,
  className,
}: TimeSeriesChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton style={{ height }} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = chartType === "line" ? LineChart : AreaChart;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {series.map((s, index) => {
                const colors = getColorForIndex(index);
                return (
                  <linearGradient
                    key={s.dataKey}
                    id={`gradient-${s.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.4} />
                    <stop offset="50%" stopColor={colors.stroke} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
              {/* Glow filter for line effects */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              dy={8}
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor", fillOpacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
              }
            />
            <Tooltip
              content={<CustomTooltip series={series} />}
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingBottom: "8px",
              }}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--foreground))", fontSize: "13px", fontWeight: 500 }}>
                  {value}
                </span>
              )}
            />
            {series.map((s, index) => {
              const colors = getColorForIndex(index);
              return chartType === "line" ? (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={colors.stroke}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: colors.stroke,
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                    filter: "url(#glow)",
                  }}
                  filter="url(#glow)"
                />
              ) : (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={colors.stroke}
                  strokeWidth={2.5}
                  fill={`url(#gradient-${s.dataKey})`}
                  activeDot={{
                    r: 6,
                    fill: colors.stroke,
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
