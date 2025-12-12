import { Coins, MessageCircle, Shield, Users } from "lucide-react";

const statsData = [
  {
    title: "x402 Income (24h)",
    value: "$0.00",
    change: "0%",
    changeValue: "($0.00)",
    isPositive: true,
    icon: Coins,
  },
  {
    title: "Active Agents (24h)",
    value: "0",
    change: "0%",
    changeValue: "(0)",
    isPositive: true,
    icon: Users,
  },
  {
    title: "Agents (total)",
    value: "0",
    change: "0%",
    changeValue: "(0)",
    isPositive: true,
    icon: Shield,
  },
  {
    title: "Reviews (24h)",
    value: "0",
    change: "0%",
    changeValue: "",
    isPositive: true,
    icon: MessageCircle,
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 sm:gap-4 sm:p-4 lg:grid-cols-4 lg:gap-6 lg:p-6">
      {statsData.map((stat, index) => (
        <div key={stat.title} className="flex items-start">
          <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
            <div className="flex items-center gap-1 text-muted-foreground sm:gap-1.5">
              <stat.icon className="size-3.5 sm:size-[18px]" />
              <span className="truncate text-[10px] font-medium sm:text-xs lg:text-sm">
                {stat.title}
              </span>
            </div>
            <p className="text-lg font-semibold leading-tight tracking-tight sm:text-xl lg:text-[28px]">
              {stat.value}
            </p>
            <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium sm:gap-2 sm:text-xs lg:text-sm">
              <span className={stat.isPositive ? "text-emerald-600" : "text-red-600"}>
                {stat.change}
                <span className="hidden sm:inline">{stat.changeValue}</span>
              </span>
              <span className="hidden text-muted-foreground sm:inline">vs Last Months</span>
            </div>
          </div>
          {index < statsData.length - 1 ? (
            <div className="mx-4 hidden h-full w-px bg-border lg:block xl:mx-6" />
          ) : null}
        </div>
      ))}
    </div>
  );
}


