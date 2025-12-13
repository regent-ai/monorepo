import { memo, useCallback, useMemo, useRef } from "react";
import { animate, spring } from "animejs";
import { Crown, MessageSquare, Zap } from "lucide-react";

import type { Agent } from "~/lib/erc8004/subgraph";
import { formatAddress, formatTimestamp } from "~/lib/erc8004/utils";

export const AgentGridCell = memo(function AgentGridCell({
  agent,
  gridIndex,
  isMoving,
  onOpen,
}: {
  agent: Agent;
  gridIndex: number;
  isMoving: boolean;
  onOpen: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);

  const name = agent.registrationFile?.name || `Agent #${agent.agentId}`;
  const description = agent.registrationFile?.description;
  const trusts = agent.registrationFile?.supportedTrusts || [];
  const feedbackCount = parseInt(agent.totalFeedback);
  const hasEndpoint =
    agent.registrationFile?.mcpEndpoint || agent.registrationFile?.a2aEndpoint;
  const image = agent.registrationFile?.image;

  const isRegent = useMemo(() => {
    const supported = trusts ?? [];
    return (
      supported.some((t) => t.toLowerCase().includes("regent")) ||
      (agent.registrationFile?.mcpEndpoint && agent.registrationFile?.a2aEndpoint)
    );
  }, [agent.registrationFile?.a2aEndpoint, agent.registrationFile?.mcpEndpoint, trusts]);

  const handleOpen = useCallback(() => {
    if (isMoving) return;

    if (cardRef.current) {
      animate(cardRef.current, {
        scale: [
          { to: 0.985, ease: "inOut(3)", duration: 90 },
          { to: 1.04, ease: spring({ stiffness: 320, damping: 18 }) },
          { to: 1, ease: spring({ stiffness: 420, damping: 26 }) },
        ],
        duration: 520,
      });
    }

    onOpen();
  }, [isMoving, onOpen]);

  return (
    <button
      type="button"
      ref={cardRef}
      onClick={handleOpen}
      className={`agent-card logo-border logo-border--solid absolute inset-2 flex flex-col overflow-hidden rounded-3xl text-left backdrop-blur-sm transition-[transform,box-shadow,filter] ${
        isMoving
          ? "shadow-xl"
          : "shadow-md hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.02]"
      }`}
      style={{
        pointerEvents: isMoving ? "none" : "auto",
        cursor: isMoving ? "default" : "pointer",
      }}
    >
      <div className="relative h-16 shrink-0 bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-4/20">
        {image && (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-transparent" />

        <div className="absolute right-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground backdrop-blur-sm">
          #{gridIndex}
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1">
          {isRegent && (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[10px] text-primary-foreground">
              <Crown className="h-2.5 w-2.5" />
              Regent
            </span>
          )}
          {hasEndpoint && (
            <span className="flex items-center gap-0.5 rounded-full bg-chart-1/90 px-1.5 py-0.5 text-[10px] text-white">
              <Zap className="h-2.5 w-2.5" />
              API
            </span>
          )}
          {feedbackCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-chart-2/90 px-1.5 py-0.5 text-[10px] text-white">
              <MessageSquare className="h-2.5 w-2.5" />
              {feedbackCount}
            </span>
          )}
        </div>
      </div>

      <div className="card-content flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-medium">{name}</h3>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          ID: {agent.agentId}
        </p>

        {description && (
          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {trusts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trusts.slice(0, 2).map((trust) => (
              <span
                key={trust}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {trust}
              </span>
            ))}
            {trusts.length > 2 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{trusts.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          <span className="font-mono">{formatAddress(agent.owner)}</span>
          <span>{formatTimestamp(agent.createdAt)}</span>
        </div>
      </div>
    </button>
  );
});
