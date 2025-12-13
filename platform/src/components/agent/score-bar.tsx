function getScoreBarColor(score: number) {
  if (score >= 80) return "from-chart-2 to-chart-2/50";
  if (score >= 60) return "from-chart-3 to-chart-3/50";
  if (score >= 40) return "from-chart-5 to-chart-5/50";
  return "from-destructive to-destructive/50";
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getScoreBarColor(score)} transition-all`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
