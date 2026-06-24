interface ScoreBarProps {
  /** Score de compatibilidade, 0 a 100. */
  score: number;
}

export function ScoreBar({ score }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 70 ? "bg-emerald-500" :
    pct >= 45 ? "bg-sky-500" :
    pct >= 25 ? "bg-orange-500" :
    "bg-stone-600";

  return (
    <div className="h-1.5 bg-[#2b251c] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
