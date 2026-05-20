interface ScoreBarProps {
  score: number;
  max?: number;
}

export function ScoreBar({ score, max = 15 }: ScoreBarProps) {
  const pct = Math.min(100, (score / max) * 100);
  const color =
    score >= 9 ? "bg-green-500" :
    score >= 6 ? "bg-yellow-400" :
    score >= 3 ? "bg-orange-400" :
    "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
