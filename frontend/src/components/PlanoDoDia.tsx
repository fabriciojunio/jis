"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dailyProgress, type DailyProgress } from "@/lib/goals";

/**
 * Plano do dia: meta diária de candidaturas e sequência de dias ativos.
 * Metas e proatividade aumentam a chance de contratação (pesquisa de busca de emprego).
 */
export function PlanoDoDia() {
  const [p, setP] = useState<DailyProgress | null>(null);

  useEffect(() => {
    const reload = () => setP(dailyProgress());
    reload();
    window.addEventListener("jis:applications-changed", reload);
    return () => window.removeEventListener("jis:applications-changed", reload);
  }, []);

  if (!p) return null;

  const bateu = p.hoje >= p.meta;
  const pct = Math.min(100, (p.hoje / p.meta) * 100);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">Plano do dia</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {bateu
              ? `Meta concluída: ${p.hoje} candidatura(s) hoje. Continue enquanto há vagas novas.`
              : `Aplique em ${p.faltam} vaga(s) hoje e marque "aplicado" ao enviar cada uma.`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-100">{p.streak}</p>
          <p className="text-xs text-slate-500">dias seguidos</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-2 bg-[#1e2638] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${bateu ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-300">
          {p.hoje}/{p.meta}
        </span>
        <Link href="/vagas" className="btn-ghost py-1.5 px-3 text-xs">
          Ver vagas
        </Link>
      </div>
    </div>
  );
}
