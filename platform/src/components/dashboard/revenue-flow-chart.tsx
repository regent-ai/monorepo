"use client";

import { useState } from "react";
import type { TooltipContentProps } from "recharts";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart2,
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  LineChartIcon,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { ClientOnly } from "~/components/client-only";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

const fullYearData = [
  { month: "Jan", thisYear: 0, prevYear: 0 },
  { month: "Feb", thisYear: 0, prevYear: 0 },
  { month: "Mar", thisYear: 0, prevYear: 0 },
  { month: "Apr", thisYear: 0, prevYear: 0 },
  { month: "May", thisYear: 0, prevYear: 0 },
  { month: "Jun", thisYear: 0, prevYear: 0 },
  { month: "Jul", thisYear: 0, prevYear: 0 },
  { month: "Aug", thisYear: 0, prevYear: 0 },
  { month: "Sep", thisYear: 0, prevYear: 0 },
  { month: "Oct", thisYear: 0, prevYear: 0 },
  { month: "Nov", thisYear: 0, prevYear: 0 },
  { month: "Dec", thisYear: 0, prevYear: 0 },
];

type ChartType = "bar" | "line" | "area";
type TimePeriod = "3months" | "6months" | "year" | "q1" | "q2" | "q3" | "q4";

const periodLabels: Record<TimePeriod, string> = {
  "3months": "Last 3 Months",
  "6months": "Last 6 Months",
  year: "Full Year",
  q1: "Q1 (Jan-Mar)",
  q2: "Q2 (Apr-Jun)",
  q3: "Q3 (Jul-Sep)",
  q4: "Q4 (Oct-Dec)",
};

const insights = [
  "No x402 income recorded yet.",
  "Once payments are enabled, this chart will show x402 income over time.",
  "Use /explorer to browse agents and their endpoints.",
  "Revenue insights will appear here when data is available.",
];

function getDataForPeriod(period: TimePeriod) {
  switch (period) {
    case "3months":
      return fullYearData.slice(-3);
    case "6months":
      return fullYearData.slice(-6);
    case "q1":
      return fullYearData.slice(0, 3);
    case "q2":
      return fullYearData.slice(3, 6);
    case "q3":
      return fullYearData.slice(6, 9);
    case "q4":
      return fullYearData.slice(9, 12);
    default:
      return fullYearData;
  }
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<any, any>) {
  if (!active || !payload?.length) return null;

  const thisYear =
    payload.find((p: any) => p.dataKey === "thisYear")?.value ?? 0;
  const prevYear =
    payload.find((p: any) => p.dataKey === "prevYear")?.value ?? 0;
  const diff = Number(thisYear) - Number(prevYear);
  const percentage = prevYear
    ? Math.round((diff / Number(prevYear)) * 100)
    : 0;

  return (
    <div className="rounded-lg border border-border bg-popover p-2 shadow-lg sm:p-3">
      <p className="mb-1.5 text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
        {label}
      </p>
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="size-2 rounded-full sm:size-2.5"
            style={{ background: "#6e3ff3" }}
          />
          <span className="text-[10px] text-muted-foreground sm:text-sm">
            This period:
          </span>
          <span className="text-[10px] font-medium text-foreground sm:text-sm">
            {formatCurrency(Number(thisYear))}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="size-2 rounded-full sm:size-2.5"
            style={{ background: "#e255f2" }}
          />
          <span className="text-[10px] text-muted-foreground sm:text-sm">
            Previous:
          </span>
          <span className="text-[10px] font-medium text-foreground sm:text-sm">
            {formatCurrency(Number(prevYear))}
          </span>
        </div>
        <div className="mt-1 border-t border-border pt-1">
          <span
            className={`text-[10px] font-medium sm:text-xs ${
              diff >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {diff >= 0 ? "+" : ""}
            {percentage}% vs last year
          </span>
        </div>
      </div>
    </div>
  );
}

export function RevenueFlowChart() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [period, setPeriod] = useState<TimePeriod>("6months");
  const [showGrid, setShowGrid] = useState(true);
  const [showThisYear, setShowThisYear] = useState(true);
  const [showPrevYear, setShowPrevYear] = useState(true);
  const [smoothCurve, setSmoothCurve] = useState(true);
  const [currentInsight, setCurrentInsight] = useState(0);

  const chartData = getDataForPeriod(period);
  const totalRevenue = chartData.reduce((acc, item) => acc + item.thisYear, 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl border bg-card p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex flex-1 items-center gap-2 sm:gap-2.5">
          <Button variant="outline" size="icon" className="size-7 sm:size-8">
            <BarChart2 className="size-4 text-muted-foreground sm:size-[18px]" />
          </Button>
          <span className="text-sm font-medium sm:text-base">x402 Income Flow</span>
        </div>
        <div className="hidden items-center gap-3 sm:flex sm:gap-5">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-[#6e3ff3] sm:size-3" />
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              This period
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-[#e255f2] sm:size-3" />
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              Previous
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 sm:size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Chart Options</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <BarChart3 className="mr-2 size-4" />
                Chart Type
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setChartType("bar")}>
                  <BarChart3 className="mr-2 size-4" />
                  Bar Chart
                  {chartType === "bar" ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("line")}>
                  <LineChartIcon className="mr-2 size-4" />
                  Line Chart
                  {chartType === "line" ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("area")}>
                  <TrendingUp className="mr-2 size-4" />
                  Area Chart
                  {chartType === "area" ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Calendar className="mr-2 size-4" />
                Time Period
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.keys(periodLabels) as TimePeriod[]).map((key) => (
                  <DropdownMenuItem key={key} onClick={() => setPeriod(key)}>
                    {periodLabels[key]}
                    {period === key ? <Check className="ml-auto size-4" /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
              <Grid3X3 className="mr-2 size-4" />
              Show Grid Lines
            </DropdownMenuCheckboxItem>

            {chartType === "line" || chartType === "area" ? (
              <DropdownMenuCheckboxItem
                checked={smoothCurve}
                onCheckedChange={setSmoothCurve}
              >
                <TrendingUp className="mr-2 size-4" />
                Smooth Curve
              </DropdownMenuCheckboxItem>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Data Series</DropdownMenuLabel>

            <DropdownMenuCheckboxItem checked={showThisYear} onCheckedChange={setShowThisYear}>
              <div className="mr-2 size-3 rounded-full" style={{ background: "#6e3ff3" }} />
              Show This Year
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem checked={showPrevYear} onCheckedChange={setShowPrevYear}>
              <div className="mr-2 size-3 rounded-full" style={{ background: "#e255f2" }} />
              Show Prev Year
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                setChartType("bar");
                setPeriod("6months");
                setShowGrid(true);
                setShowThisYear(true);
                setShowPrevYear(true);
                setSmoothCurve(true);
              }}
            >
              <RefreshCw className="mr-2 size-4" />
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-10">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[200px] xl:w-[220px]">
          <div className="space-y-2 sm:space-y-4">
            <p className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl lg:text-[28px]">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Total x402 income ({periodLabels[period]})
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-muted/50 p-3 sm:space-y-4 sm:p-4">
            <p className="text-xs font-semibold sm:text-sm">Insight</p>
            <p className="text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
              {insights[currentInsight]}
            </p>
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <ChevronLeft
                className="size-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground sm:size-3.5"
                onClick={() =>
                  setCurrentInsight((prev) =>
                    prev === 0 ? insights.length - 1 : prev - 1
                  )
                }
              />
              <div className="flex flex-1 items-center gap-1">
                {insights.map((_, index) => (
                  <div
                    key={index}
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      index === currentInsight
                        ? "bg-foreground"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <ChevronRight
                className="size-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground sm:size-3.5"
                onClick={() =>
                  setCurrentInsight((prev) =>
                    prev === insights.length - 1 ? 0 : prev + 1
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="h-[180px] min-w-0 flex-1 sm:h-[200px] lg:h-[240px]">
          <ClientOnly fallback={<div className="h-full w-full rounded-lg bg-muted/50 animate-pulse" />}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData} barGap={2}>
                  <defs>
                    <linearGradient id="thisYearGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6e3ff3" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6e3ff3" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="prevYearGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e255f2" stopOpacity={1} />
                      <stop offset="100%" stopColor="#e255f2" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  {showGrid ? (
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke={"var(--border)"}
                      vertical={false}
                    />
                  ) : null}
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dx={-5}
                    tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    content={(props) => <CustomTooltip {...props} />}
                    cursor={{ fill: "var(--muted)", radius: 4 }}
                  />
                  {showThisYear ? (
                    <Bar
                      dataKey="thisYear"
                      fill="url(#thisYearGradient)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                  ) : null}
                  {showPrevYear ? (
                    <Bar
                      dataKey="prevYear"
                      fill="url(#prevYearGradient)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                  ) : null}
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={chartData}>
                  {showGrid ? (
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke={"var(--border)"}
                      vertical={false}
                    />
                  ) : null}
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dx={-5}
                    tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    content={(props) => <CustomTooltip {...props} />}
                    cursor={{ stroke: "var(--border)" }}
                  />
                  {showThisYear ? (
                    <Line
                      type={smoothCurve ? "monotone" : "linear"}
                      dataKey="thisYear"
                      stroke="#6e3ff3"
                      strokeWidth={2}
                      dot={{ fill: "#6e3ff3", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#6e3ff3" }}
                    />
                  ) : null}
                  {showPrevYear ? (
                    <Line
                      type={smoothCurve ? "monotone" : "linear"}
                      dataKey="prevYear"
                      stroke="#e255f2"
                      strokeWidth={2}
                      dot={{ fill: "#e255f2", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "#e255f2" }}
                    />
                  ) : null}
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="thisYearAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6e3ff3" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6e3ff3" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="prevYearAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e255f2" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#e255f2" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  {showGrid ? (
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke={"var(--border)"}
                      vertical={false}
                    />
                  ) : null}
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    dx={-5}
                    tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    content={(props) => <CustomTooltip {...props} />}
                    cursor={{ stroke: "var(--border)" }}
                  />
                  {showThisYear ? (
                    <Area
                      type={smoothCurve ? "monotone" : "linear"}
                      dataKey="thisYear"
                      stroke="#6e3ff3"
                      strokeWidth={2}
                      fill="url(#thisYearAreaGradient)"
                    />
                  ) : null}
                  {showPrevYear ? (
                    <Area
                      type={smoothCurve ? "monotone" : "linear"}
                      dataKey="prevYear"
                      stroke="#e255f2"
                      strokeWidth={2}
                      fill="url(#prevYearAreaGradient)"
                    />
                  ) : null}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}


