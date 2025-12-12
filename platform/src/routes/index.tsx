import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "~/components/dashboard/content";
import { fetchAgents } from "~/lib/erc8004/subgraph";

export const Route = createFileRoute("/")({
  loader: async () => {
    const agents = await fetchAgents(500, 0);
    return { agents };
  },
  component: DashboardHomeRoute,
});

function DashboardHomeRoute() {
  const { agents } = Route.useLoaderData();
  return <DashboardContent agents={agents} />;
}


