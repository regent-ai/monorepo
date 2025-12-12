import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { useMemo } from "react";

import { fetchAgents } from "~/lib/erc8004/subgraph";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface FleetTenantRow {
  id: string;
  erc8004_id: string | null;
  session_id: string | null;
  status: "idle" | "executing" | "waiting" | "blocked" | "complete" | null;
  working_dir: string | null;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

interface FleetTenantsResponse {
  status: "success" | "error";
  tenants: FleetTenantRow[];
  count: number;
}

export const Route = createFileRoute("/dashboard")({
  component: FleetDashboardRoute,
});

function FleetDashboardRoute() {
  const agentsQuery = useQuery({
    queryKey: ["erc8004-agents", { first: 500 }],
    queryFn: async () => fetchAgents(500, 0),
  });

  const tenantsQuery = useQuery({
    queryKey: ["fleet-tenants"],
    queryFn: async (): Promise<FleetTenantsResponse> => {
      const res = await fetch("/api/fleet/tenants?limit=1000&offset=0", {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as FleetTenantsResponse;
    },
  });

  const tenantsByErc8004Id = useMemo(() => {
    const tenants = tenantsQuery.data?.tenants ?? [];
    const map = new Map<string, FleetTenantRow>();
    for (const t of tenants) {
      if (t.erc8004_id) map.set(t.erc8004_id, t);
    }
    return map;
  }, [tenantsQuery.data]);

  const rows = useMemo(() => {
    const agents = agentsQuery.data ?? [];
    return agents.map((agent) => ({
      agent,
      tenant: tenantsByErc8004Id.get(agent.id),
    }));
  }, [agentsQuery.data, tenantsByErc8004Id]);

  return (
    <main className="w-full flex-1 space-y-4 bg-background p-3 sm:space-y-6 sm:p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fleet Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Aggregate operations view (ERC-8004 agents × fleet runtime tenants)
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/explorer">
            Explore agents
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents (loaded)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {agentsQuery.isLoading ? "…" : (agentsQuery.data?.length ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ops tenants (enabled)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {tenantsQuery.isLoading ? "…" : (tenantsQuery.data?.count ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ops coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {agentsQuery.data?.length
                ? `${Math.round(
                    ((tenantsQuery.data?.count ?? 0) / agentsQuery.data.length) * 100
                  )}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Agents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(agentsQuery.isLoading || tenantsQuery.isLoading) && (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}

          {(agentsQuery.isError || tenantsQuery.isError) && (
            <div className="p-4 text-sm text-destructive">
              Failed to load dashboard data.
            </div>
          )}

          {!agentsQuery.isLoading &&
            !tenantsQuery.isLoading &&
            !agentsQuery.isError &&
            !tenantsQuery.isError && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Ops</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ agent, tenant }) => (
                    <TableRow key={agent.id}>
                      <TableCell className="max-w-[360px]">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {agent.registrationFile?.name || `Agent #${agent.agentId}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {agent.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant ? (
                          <Badge variant={statusToBadgeVariant(tenant.status)}>
                            {tenant.status || "unknown"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">not enabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tenant?.updated_at ? formatIsoDateTime(tenant.updated_at) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {tenant
                          ? (tenant.input_tokens ?? 0) + (tenant.output_tokens ?? 0)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {tenant ? `$${Number(tenant.total_cost ?? 0).toFixed(4)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            to="/agent/$id"
                            params={{ id: agent.id }}
                            search={{ tab: "ops" }}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </main>
  );
}

function statusToBadgeVariant(status: FleetTenantRow["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "blocked":
      return "destructive";
    case "executing":
      return "default";
    case "waiting":
      return "outline";
    case "complete":
      return "secondary";
    case "idle":
      return "secondary";
    default:
      return "outline";
  }
}

function formatIsoDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


