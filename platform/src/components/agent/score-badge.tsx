function getScoreColor(score: number) {
  if (score >= 80) return "text-chart-2 bg-chart-2/10";
  if (score >= 60) return "text-chart-3 bg-chart-3/10";
  if (score >= 40) return "text-chart-5 bg-chart-5/10";
  return "text-destructive bg-destructive/10";
}

export function ScoreBadge({
  score,
  size = "default",
}: {
  score: number;
  size?: "default" | "lg";
}) {
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
