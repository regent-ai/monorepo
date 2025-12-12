"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { ChartLine, Download, Maximize2, MoreHorizontal, RefreshCw, Settings2, Share2 } from "lucide-react";

import { ClientOnly } from "~/components/client-only";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const allData = {
  "7days": [
    { name: "Skills", value: 0, color: "#35b9e9" },
    { name: "MCP", value: 0, color: "#6e3ff3" },
    { name: "A2A", value: 0, color: "#375dfb" },
    { name: "Other", value: 0, color: "#e255f2" },
  ],
  "30days": [
    { name: "Skills", value: 0, color: "#35b9e9" },
    { name: "MCP", value: 0, color: "#6e3ff3" },
    { name: "A2A", value: 0, color: "#375dfb" },
    { name: "Other", value: 0, color: "#e255f2" },
  ],
  "90days": [
    { name: "Skills", value: 0, color: "#35b9e9" },
    { name: "MCP", value: 0, color: "#6e3ff3" },
    { name: "A2A", value: 0, color: "#375dfb" },
    { name: "Other", value: 0, color: "#e255f2" },
  ],
} as const;

type TimeRange = keyof typeof allData;

const timeRangeLabels: Record<TimeRange, string> = {
  "7days": "Last 7 days",
  "30days": "Last 30 days",
  "90days": "Last 90 days",
};

export function LeadSourcesChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const data = allData[timeRange].map((item) => ({ ...item }));
  const totalIncome = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 xl:w-[410px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button variant="outline" size="icon" className="size-7 sm:size-8">
            <ChartLine className="size-4 text-muted-foreground sm:size-[18px]" />
          </Button>
          <span className="text-sm font-medium sm:text-base">x402 Income Sources</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 sm:size-8">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>Time Range</DropdownMenuLabel>
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <DropdownMenuCheckboxItem
                key={range}
                checked={timeRange === range}
                onCheckedChange={() => setTimeRange(range)}
              >
                {timeRangeLabels[range]}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Display Options</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={showLabels} onCheckedChange={setShowLabels}>
              Show labels
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download className="mr-2 size-4" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Maximize2 className="mr-2 size-4" />
              Full Screen
            </DropdownMenuItem>
            <DropdownMenuItem>
              <RefreshCw className="mr-2 size-4" />
              Refresh Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <div className="relative size-[220px] shrink-0">
          <ClientOnly
            fallback={<div className="size-full rounded-lg bg-muted/50 animate-pulse" />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="42%"
                  outerRadius="70%"
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  shape={(props, index) => {
                    const typedProps = props as {
                      cx: number;
                      cy: number;
                      innerRadius: number;
                      outerRadius: number;
                      startAngle: number;
                      endAngle: number;
                      fill: string;
                    };

                    const isActive = activeIndex === index;

                    return (
                      <Sector
                        cx={typedProps.cx}
                        cy={typedProps.cy}
                        innerRadius={typedProps.innerRadius}
                        outerRadius={typedProps.outerRadius + (isActive ? 8 : 0)}
                        startAngle={typedProps.startAngle}
                        endAngle={typedProps.endAngle}
                        fill={typedProps.fill}
                      />
                    );
                  }}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ClientOnly>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold sm:text-xl">
              {currencyFormatter.format(totalIncome)}
            </span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              Total x402 income
            </span>
          </div>
        </div>

        {showLabels ? (
          <div className="grid w-full flex-1 grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-4">
            {data.map((item, index) => (
              <div
                key={item.name}
                className={`flex cursor-pointer items-center gap-2 transition-opacity sm:gap-2.5 ${
                  activeIndex !== null && activeIndex !== index ? "opacity-50" : ""
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="h-4 w-1 shrink-0 rounded-sm sm:h-5"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 truncate text-xs text-muted-foreground sm:text-sm">
                  {item.name}
                </span>
                <span className="tabular-nums text-xs font-semibold sm:text-sm">
                  {currencyFormatter.format(item.value)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Settings2 className="size-3" />
        <span>{timeRangeLabels[timeRange]}</span>
      </div>
    </div>
  );
}


