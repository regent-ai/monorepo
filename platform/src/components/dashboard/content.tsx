import { TopAgentsTable } from "~/components/dashboard/top-agents-table";
import { LeadSourcesChart } from "~/components/dashboard/lead-sources-chart";
import { RevenueFlowChart } from "~/components/dashboard/revenue-flow-chart";
import { StatsCards } from "~/components/dashboard/stats-cards";
import { WelcomeSection } from "~/components/dashboard/welcome-section";
import type { Agent } from "~/lib/erc8004/subgraph";

export function DashboardContent({ agents }: { agents: Agent[] }) {
  return (
    <main className="w-full flex-1 overflow-auto space-y-4 bg-background p-3 sm:space-y-6 sm:p-4 md:p-6">
      <WelcomeSection />
      <StatsCards />
      <div className="flex flex-col gap-4 sm:gap-6 xl:flex-row">
        <LeadSourcesChart />
        <RevenueFlowChart />
      </div>
      <TopAgentsTable agents={agents} />
    </main>
  );
}


