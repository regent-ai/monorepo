import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";

import { fetchAgents } from "~/lib/erc8004/subgraph";
import { StatsCards } from "~/components/dashboard/stats-cards";
import { WelcomeSection } from "~/components/dashboard/welcome-section";

const LeadSourcesChart = lazy(() =>
  import("~/components/dashboard/lead-sources-chart").then((m) => ({
    default: m.LeadSourcesChart,
  }))
);

const RevenueFlowChart = lazy(() =>
  import("~/components/dashboard/revenue-flow-chart").then((m) => ({
    default: m.RevenueFlowChart,
  }))
);

const TopAgentsTable = lazy(() =>
  import("~/components/dashboard/top-agents-table").then((m) => ({
    default: m.TopAgentsTable,
  }))
);

export function DashboardContent() {
  const isClient = typeof window !== "undefined";
  const agentsQuery = useQuery({
    queryKey: ["dashboard-home-agents", { first: 50 }],
    queryFn: async () => fetchAgents(50, 0),
    enabled: isClient,
  });

  return (
    <main className="w-full flex-1 overflow-auto space-y-4 bg-background p-3 sm:space-y-6 sm:p-4 md:p-6">
      <WelcomeSection />
      <StatsCards />
      <Suspense
        fallback={
          <div className="flex flex-col gap-4 sm:gap-6 xl:flex-row">
            <div className="h-[340px] w-full rounded-xl border bg-card/60 animate-pulse xl:w-[410px]" />
            <div className="h-[340px] w-full flex-1 rounded-xl border bg-card/60 animate-pulse" />
          </div>
        }
      >
        <div className="flex flex-col gap-4 sm:gap-6 xl:flex-row">
          <LeadSourcesChart />
          <RevenueFlowChart />
        </div>
      </Suspense>

      <Suspense
        fallback={<div className="h-[520px] w-full rounded-xl border bg-card/60 animate-pulse" />}
      >
        <TopAgentsTable agents={agentsQuery.data ?? []} />
      </Suspense>
    </main>
  );
}


