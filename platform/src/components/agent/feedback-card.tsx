import { Calendar, User } from "lucide-react";

import type { Feedback } from "~/lib/erc8004/subgraph";
import { formatAddress, formatTimestamp, isReadableText } from "~/lib/erc8004/utils";
import { ScoreBadge } from "./score-badge";
import { ScoreBar } from "./score-bar";

export function FeedbackCard({
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
