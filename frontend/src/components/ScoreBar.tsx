interface ScoreBarProps {
  /** Score de compatibilidade, 0 a 100. */
  score: number;
}

export function ScoreBar({ score }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 70 ? "bg-emerald-500" :
    pct >= 45 ? "bg-amber-500" :
    pct >= 25 ? "bg-orange-500" :
    "bg-slate-600";

  return (
    <div className="h-1.5 bg-[#1e2638] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
