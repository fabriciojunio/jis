interface ScoreBarProps {
  /** Score de compatibilidade, 0 a 100. */
  score: number;
}

export function ScoreBar({ score }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 70 ? "bg-emerald-500" :
    pct >= 45 ? "bg-amber-400" :
    pct >= 25 ? "bg-orange-400" :
    "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">{Math.round(pct)}</span>
    </div>
  );
}
