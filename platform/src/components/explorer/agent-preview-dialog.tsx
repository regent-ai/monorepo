import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { animate, spring } from "animejs";
import { ExternalLink, MessageSquare, Zap } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { Agent } from "~/lib/erc8004/subgraph";
import { formatAddress, formatTimestamp } from "~/lib/erc8004/utils";

export function AgentPreviewDialog({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const name = agent?.registrationFile?.name || (agent ? `Agent #${agent.agentId}` : "");
  const description = agent?.registrationFile?.description;
  const image = agent?.registrationFile?.image;
  const trusts = agent?.registrationFile?.supportedTrusts || [];
  const mcpEndpoint = agent?.registrationFile?.mcpEndpoint;
  const a2aEndpoint = agent?.registrationFile?.a2aEndpoint;
  const feedbackCount = agent ? parseInt(agent.totalFeedback) : 0;

  useEffect(() => {
    if (!open || !contentRef.current) return;

    animate(contentRef.current, {
      opacity: [{ to: 1, duration: 220, ease: "out(3)" }],
      translateY: [{ to: 0, duration: 520, ease: spring({ stiffness: 260, damping: 22 }) }],
      scale: [{ to: 1, duration: 520, ease: spring({ stiffness: 260, damping: 24 }) }],
      duration: 520,
      begin: () => {
        contentRef.current?.style.setProperty("opacity", "0");
        contentRef.current?.style.setProperty("transform", "translate3d(0, 14px, 0) scale(0.98)");
      },
    });
  }, [agent?.id, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="max-h-[85vh] overflow-y-auto border-border/60 p-0 sm:max-w-xl"
      >
        {agent ? (
          <div className="flex h-full flex-col">
            <DialogHeader className="relative overflow-hidden border-b bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-4/20 p-6">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[1px]"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-background/15 to-transparent" />
              <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_60%),radial-gradient(circle_at_80%_100%,color-mix(in_oklch,var(--chart-2)_22%,transparent),transparent_60%)]" />

              <div className="relative">
                <DialogTitle className="font-display truncate text-xl tracking-tight">
                  {name}
                </DialogTitle>
                <DialogDescription className="mt-1 line-clamp-2 text-sm">
                  {description || "No description provided."}
                </DialogDescription>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    ERC-8004 • {agent.id}
                  </Badge>
                  {feedbackCount > 0 && (
                    <Badge variant="secondary">
                      <MessageSquare />
                      {feedbackCount}
                    </Badge>
                  )}
                  {(mcpEndpoint || a2aEndpoint) && (
                    <Badge variant="secondary">
                      <Zap />
                      API
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 rounded-xl border border-border/50 bg-card/40 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Token</span>
                  <span className="font-mono">{agent.chainId}:{agent.agentId}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-mono">{formatAddress(agent.owner)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatTimestamp(agent.createdAt)}</span>
                </div>
              </div>

              {trusts.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Trust models</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trusts.map((trust) => (
                      <Badge key={trust} variant="outline">
                        {trust}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(mcpEndpoint || a2aEndpoint) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Endpoints</div>
                  {mcpEndpoint ? (
                    <a
                      href={mcpEndpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/30 px-3 py-2 text-sm hover:bg-card/50"
                    >
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          MCP
                        </span>
                        {mcpEndpoint}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : null}
                  {a2aEndpoint ? (
                    <a
                      href={a2aEndpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/30 px-3 py-2 text-sm hover:bg-card/50"
                    >
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          A2A
                        </span>
                        {a2aEndpoint}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            <div className="border-t p-6">
              <Button
                asChild
                className="w-full bg-linear-to-b from-foreground to-foreground/90 text-background"
                onClick={() => onOpenChange(false)}
              >
                <Link to="/agent/$id" params={{ id: agent.id }}>
                  Open full profile
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
