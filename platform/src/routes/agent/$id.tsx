import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Zap,
  User,
  Calendar,
  Star,
  Shield,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import * as z from "zod";
import {
  fetchAgentWithFeedback,
  type Agent,
  type Feedback,
} from "~/lib/erc8004/subgraph";
import {
  formatAddress,
  formatTimestamp,
  isReadableText,
} from "~/lib/erc8004/utils";
import {
  ensureFleetTenant,
  fetchFleetChat,
  fetchFleetCommandAgents,
  fetchFleetEvents,
  fetchFleetOrchestrator,
  sendFleetChat,
} from "~/lib/fleet/api";
import type { FleetWsMessage } from "~/lib/fleet/types";
import { useFleetWebSocket } from "~/lib/fleet/ws";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/agent/$id")({
  validateSearch: (search) =>
    z
      .object({ tab: z.enum(["profile", "ops"]).optional() })
      .parse(search),
  loader: async ({ params }) => {
    const { agent, feedback } = await fetchAgentWithFeedback(params.id);
    if (!agent) {
      throw new Error("Agent not found");
    }
    return { agent, feedback };
  },
  component: AgentDetailPage,
  errorComponent: ({ error }) => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <h2 className="text-xl font-semibold">Agent not found</h2>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-4">
        <Link to="/explorer">Back to Explorer</Link>
      </Button>
    </div>
  ),
});

function AgentDetailPage() {
  const { agent, feedback } = Route.useLoaderData();
  const { tab } = Route.useSearch();
  const activeTab = tab ?? "profile";

  const name = agent.registrationFile?.name || `Agent #${agent.agentId}`;
  const description = agent.registrationFile?.description;
  const image = agent.registrationFile?.image;
  const mcpEndpoint = agent.registrationFile?.mcpEndpoint;
  const a2aEndpoint = agent.registrationFile?.a2aEndpoint;
  const trusts = agent.registrationFile?.supportedTrusts || [];
  const feedbackCount = parseInt(agent.totalFeedback);

  // Calculate average score
  const avgScore =
    feedback.length > 0
      ? Math.round(
          feedback.reduce((sum, f) => sum + parseInt(f.score), 0) /
            feedback.length
        )
      : null;

  return (
    <div className="min-h-full">
      {/* Back navigation */}
      <div className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Explorer
            </Link>

            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                variant={activeTab === "profile" ? "default" : "outline"}
              >
                <Link
                  to="/agent/$id"
                  params={{ id: agent.id }}
                  search={(prev) => ({ ...prev, tab: undefined })}
                >
                  Profile
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant={activeTab === "ops" ? "default" : "outline"}
              >
                <Link
                  to="/agent/$id"
                  params={{ id: agent.id }}
                  search={(prev) => ({ ...prev, tab: "ops" })}
                >
                  Operations
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: Agent info */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Agent header card */}
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                {/* Avatar */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-4/20">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent info */}
                <div className="p-5">
                  <h1 className="text-xl font-semibold">{name}</h1>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    Token ID: {agent.agentId}
                  </p>

                  {description && (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <StatCard
                      icon={<MessageSquare className="h-4 w-4" />}
                      label="Reviews"
                      value={feedbackCount.toString()}
                    />
                    {avgScore !== null && (
                      <StatCard
                        icon={<Star className="h-4 w-4" />}
                        label="Avg Score"
                        value={`${avgScore}/100`}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Endpoints card */}
              {(mcpEndpoint || a2aEndpoint) && (
                <div className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-primary" />
                    API Endpoints
                  </h3>
                  <div className="space-y-3">
                    {mcpEndpoint && (
                      <EndpointLink label="MCP" url={mcpEndpoint} />
                    )}
                    {a2aEndpoint && (
                      <EndpointLink label="A2A" url={a2aEndpoint} />
                    )}
                  </div>
                </div>
              )}

              {/* Trust models card */}
              {trusts.length > 0 && (
                <div className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-chart-2" />
                    Trust Models
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trusts.map((trust) => (
                      <span
                        key={trust}
                        className="rounded-lg bg-muted px-3 py-1.5 text-sm"
                      >
                        {trust}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata card */}
              <div className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-medium">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-mono">{formatAddress(agent.owner)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain</span>
                    <span>{agent.chainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatTimestamp(agent.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{formatTimestamp(agent.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Feedback */}
          <div className="lg:col-span-2">
            {activeTab === "profile" ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Reviews ({feedback.length})
                  </h2>
                  {avgScore !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Average
                      </span>
                      <ScoreBadge score={avgScore} size="lg" />
                    </div>
                  )}
                </div>

                {feedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/30 py-16">
                    <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-lg font-medium">No reviews yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Be the first to leave feedback for this agent
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((fb, index) => (
                      <FeedbackCard key={fb.id} feedback={fb} index={index} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <AgentOperationsPanel erc8004Id={agent.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Components
// =============================================================================

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function EndpointLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/50"
    >
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="max-w-[200px] truncate font-mono text-sm">{url}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </a>
  );
}

function ScoreBadge({
  score,
  size = "default",
}: {
  score: number;
  size?: "default" | "lg";
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-chart-2 bg-chart-2/10";
    if (score >= 60) return "text-chart-3 bg-chart-3/10";
    if (score >= 40) return "text-chart-5 bg-chart-5/10";
    return "text-destructive bg-destructive/10";
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg font-mono font-semibold ${getScoreColor(score)} ${
        size === "lg" ? "px-3 py-1.5 text-base" : "px-2 py-1 text-sm"
      }`}
    >
      {score}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-chart-2 to-chart-2/50";
    if (score >= 60) return "from-chart-3 to-chart-3/50";
    if (score >= 40) return "from-chart-5 to-chart-5/50";
    return "from-destructive to-destructive/50";
  };

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getScoreColor(score)} transition-all`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function FeedbackCard({
  feedback,
  index,
}: {
  feedback: Feedback;
  index: number;
}) {
  const score = parseInt(feedback.score);
  const text = feedback.feedbackFile?.text;
  const capability = feedback.feedbackFile?.capability;
  const skill = feedback.feedbackFile?.skill;
  const tag1 = isReadableText(feedback.tag1) ? feedback.tag1 : null;
  const tag2 = isReadableText(feedback.tag2) ? feedback.tag2 : null;

  return (
    <div
      className="group overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-border"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ScoreBadge score={score} />
          <ScoreBar score={score} />
        </div>
      </div>

      {/* Review text */}
      {text && (
        <p className="mb-4 text-sm leading-relaxed text-foreground/90">{text}</p>
      )}

      {/* Tags */}
      {(capability || skill || tag1 || tag2) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {capability && (
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
              {capability}
            </span>
          )}
          {skill && (
            <span className="rounded-md bg-chart-2/10 px-2 py-1 text-xs text-chart-2">
              {skill}
            </span>
          )}
          {tag1 && (
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {tag1}
            </span>
          )}
          {tag2 && (
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {tag2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span className="font-mono">{formatAddress(feedback.clientAddress)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatTimestamp(feedback.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Operations tab (fleet)
// =============================================================================

function AgentOperationsPanel({ erc8004Id }: { erc8004Id: string }) {
  const queryClient = useQueryClient();

  const orchestratorQuery = useQuery({
    queryKey: ["fleet-orchestrator", erc8004Id],
    queryFn: async () => fetchFleetOrchestrator(erc8004Id),
    retry: false,
  });

  const orchestrator = orchestratorQuery.data ?? null;
  const hasTenant = Boolean(orchestrator);

  const agentsQuery = useQuery({
    queryKey: ["fleet-command-agents", erc8004Id],
    queryFn: async () => fetchFleetCommandAgents(erc8004Id),
    enabled: hasTenant,
    retry: false,
  });

  const eventsQuery = useQuery({
    queryKey: ["fleet-events", erc8004Id],
    queryFn: async () => fetchFleetEvents(erc8004Id, { limit: 50 }),
    enabled: hasTenant,
    retry: false,
  });

  const chatQuery = useQuery({
    queryKey: ["fleet-chat", erc8004Id],
    queryFn: async () => fetchFleetChat(erc8004Id, { limit: 200 }),
    enabled: hasTenant,
    retry: false,
  });

  const ensureMutation = useMutation({
    mutationFn: async () => ensureFleetTenant(erc8004Id),
    onSuccess: (data) => {
      queryClient.setQueryData(["fleet-orchestrator", erc8004Id], data.orchestrator);
      queryClient.invalidateQueries({ queryKey: ["fleet-command-agents", erc8004Id] });
      queryClient.invalidateQueries({ queryKey: ["fleet-events", erc8004Id] });
      queryClient.invalidateQueries({ queryKey: ["fleet-chat", erc8004Id] });
    },
  });

  const [eventQuery, setEventQuery] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  const onWsMessage = useCallback(
    (msg: FleetWsMessage) => {
      if (msg.type === "orchestrator_updated") {
        const updated = (msg as any).orchestrator as Record<string, unknown> | undefined;
        if (!updated) return;
        queryClient.setQueryData(
          ["fleet-orchestrator", erc8004Id],
          (prev: unknown) => {
            if (!prev || typeof prev !== "object") return prev;
            return { ...(prev as Record<string, unknown>), ...updated };
          }
        );
        return;
      }

      if (
        msg.type === "agent_created" ||
        msg.type === "agent_updated" ||
        msg.type === "agent_deleted" ||
        msg.type === "agent_status_changed" ||
        msg.type === "agent_log" ||
        msg.type === "agent_summary_update"
      ) {
        queryClient.invalidateQueries({ queryKey: ["fleet-command-agents", erc8004Id] });
        queryClient.invalidateQueries({ queryKey: ["fleet-events", erc8004Id] });
      }

      if (msg.type === "chat_message") {
        queryClient.invalidateQueries({ queryKey: ["fleet-chat", erc8004Id] });
        queryClient.invalidateQueries({ queryKey: ["fleet-events", erc8004Id] });
      }

      if (msg.type === "chat_stream" && Boolean((msg as any).is_complete)) {
        queryClient.invalidateQueries({ queryKey: ["fleet-chat", erc8004Id] });
      }
    },
    [erc8004Id, queryClient]
  );

  const ws = useFleetWebSocket({
    erc8004Id,
    enabled: hasTenant,
    onMessage: onWsMessage,
  });

  const sendChatMutation = useMutation({
    mutationFn: async () => {
      setAdminError(null);
      const message = chatDraft.trim();
      if (!message) return { status: "error", message: "Missing message" };
      return await sendFleetChat(erc8004Id, message);
    },
    onSuccess: () => setChatDraft(""),
    onError: (err) => setAdminError(String((err as Error).message || err)),
  });

  const visibleEvents = useMemo(() => {
    const events = eventsQuery.data?.events ?? [];
    if (!eventQuery.trim()) return events;
    const q = eventQuery.toLowerCase();
    return events.filter((e) => JSON.stringify(e).toLowerCase().includes(q));
  }, [eventQuery, eventsQuery.data]);

  const chatMessages = chatQuery.data?.messages ?? [];
  const commandAgents = agentsQuery.data?.agents ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">Operations</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Tenant key: <span className="font-mono">{erc8004Id}</span>
              </p>
            </div>
            {orchestratorQuery.isLoading ? (
              <Badge variant="outline">loading</Badge>
            ) : orchestratorQuery.isError ? (
              <Badge variant="destructive">error</Badge>
            ) : orchestrator ? (
              <Badge variant={opsStatusToBadgeVariant(orchestrator.status as any)}>
                {String(orchestrator.status ?? "unknown")}
              </Badge>
            ) : (
              <Badge variant="outline">not enabled</Badge>
            )}
          </div>

          {orchestratorQuery.isLoading ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : orchestratorQuery.isError ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-destructive">Failed to load ops status.</p>
              <p className="text-xs text-muted-foreground">
                {(orchestratorQuery.error as Error).message}
              </p>
            </div>
          ) : orchestrator ? (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens</span>
                <span className="tabular-nums">
                  {(Number((orchestrator as any).input_tokens ?? 0) +
                    Number((orchestrator as any).output_tokens ?? 0)) as number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="tabular-nums">
                  ${Number((orchestrator as any).total_cost ?? 0).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>
                  {formatIsoDateTime(String((orchestrator as any).updated_at ?? ""))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WebSocket</span>
                <span className="flex items-center gap-2">
                  {ws.isConfigured ? (
                    <>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          ws.isConnected ? "bg-chart-2" : "bg-muted"
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {ws.isConnected ? "connected" : "disconnected"}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      not configured
                    </span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Ops isn’t enabled for this agent yet.
              </p>
              <Button
                onClick={() => ensureMutation.mutate()}
                disabled={ensureMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Enable ops
              </Button>
              {ensureMutation.isError && (
                <p className="text-xs text-destructive">
                  {(ensureMutation.error as Error).message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">Orchestrator stream</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Live response stream (WebSocket)
              </p>
            </div>
            {ws.isTyping ? <Badge variant="secondary">typing</Badge> : null}
          </div>

          <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {ws.streamText || "—"}
            </p>
          </div>

          {ws.lastError && (
            <p className="mt-2 text-xs text-destructive">{ws.lastError}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-medium">Command agents</h3>
          <span className="text-xs text-muted-foreground">
            {commandAgents.length}
          </span>
        </div>
        <div className="p-5">
          {!hasTenant ? (
            <p className="text-sm text-muted-foreground">Enable ops to view agents.</p>
          ) : agentsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : agentsQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load agents.</p>
          ) : commandAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No command agents yet.</p>
          ) : (
            <div className="space-y-3">
              {commandAgents.map((a: any) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {a.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={opsStatusToBadgeVariant(String(a.status) as any)}>
                      {String(a.status ?? "unknown")}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ${(Number(a.total_cost ?? 0)).toFixed(4)}
                    </span>
                    {typeof a.log_count === "number" && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {a.log_count} logs
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium">Events</h3>
          <div className="w-full sm:max-w-xs">
            <Input
              value={eventQuery}
              onChange={(e) => setEventQuery(e.target.value)}
              placeholder="Filter events…"
            />
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto p-5">
          {!hasTenant ? (
            <p className="text-sm text-muted-foreground">Enable ops to view events.</p>
          ) : eventsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : eventsQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load events.</p>
          ) : visibleEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {visibleEvents.map((e: any, idx: number) => (
                <div key={e.id ?? idx} className="rounded-xl bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {renderEventTitle(e)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {renderEventBody(e)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatIsoDateTime(
                        String(e.timestamp ?? e.created_at ?? e.updated_at ?? "")
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-medium">Orchestrator chat</h3>
          <span className="text-xs text-muted-foreground">
            {chatQuery.data?.turn_count ? `${chatQuery.data.turn_count} turns` : ""}
          </span>
        </div>
        <div className="p-5">
          {!hasTenant ? (
            <p className="text-sm text-muted-foreground">Enable ops to view chat.</p>
          ) : chatQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : chatQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load chat.</p>
          ) : (
            <div className="max-h-[360px] space-y-3 overflow-auto rounded-xl border border-border/50 bg-muted/20 p-3">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chat yet.</p>
              ) : (
                chatMessages.map((m: any) => (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {String(m.sender_type ?? "unknown")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatIsoDateTime(String(m.created_at ?? ""))}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">
                      {renderChatMessage(m)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              placeholder="Admin: send a message to this agent’s orchestrator…"
              className="h-9 w-full rounded-md border border-border/50 bg-background px-3 text-sm shadow-sm"
              disabled={!hasTenant || sendChatMutation.isPending}
            />
            <Button
              onClick={() => sendChatMutation.mutate()}
              disabled={!hasTenant || sendChatMutation.isPending}
            >
              Send
            </Button>
          </div>

          {adminError && <p className="mt-2 text-xs text-destructive">{adminError}</p>}
        </div>
      </div>
    </div>
  );
}

function opsStatusToBadgeVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" {
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
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderEventTitle(event: Record<string, unknown>): string {
  const sourceType = String(event.sourceType ?? "");
  if (sourceType === "agent_log") {
    const agentName = String(event.agent_name ?? "agent");
    const eventType = String(event.event_type ?? "");
    return `${agentName}${eventType ? ` • ${eventType}` : ""}`;
  }
  if (sourceType === "orchestrator_chat") return "orchestrator_chat";
  if (sourceType === "system_log") return "system_log";
  return sourceType || "event";
}

function renderEventBody(event: Record<string, unknown>): string {
  const sourceType = String(event.sourceType ?? "");
  if (sourceType === "agent_log") {
    const summary = typeof event.summary === "string" ? event.summary : null;
    const content = typeof event.content === "string" ? event.content : null;
    return summary || content || "—";
  }
  if (sourceType === "orchestrator_chat") {
    const sender = String(event.sender_type ?? "unknown");
    const message = typeof event.message === "string" ? event.message : "";
    return `${sender}: ${message}`.trim() || "—";
  }
  if (sourceType === "system_log") {
    const level = String(event.level ?? "INFO");
    const message = typeof event.message === "string" ? event.message : "";
    return `${level}: ${message}`.trim() || "—";
  }
  return JSON.stringify(event);
}

function renderChatMessage(message: Record<string, unknown>): string {
  const text = typeof message.message === "string" ? message.message : "";
  if (text) return text;

  const metadata = message.metadata;
  if (metadata && typeof metadata === "object") {
    const type = String((metadata as any).type ?? "");
    if (type === "thinking") return String((metadata as any).thinking ?? "");
    if (type === "tool_use") {
      const toolName = String((metadata as any).tool_name ?? "");
      return toolName ? `Tool: ${toolName}` : "Tool use";
    }
  }

  return "—";
}
