"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dailyProgress, type DailyProgress } from "@/lib/goals";

/**
 * Painel de "Plano do dia": meta diária de candidaturas + sequência de dias
 * ativos. Implementa metas e proatividade, que a pesquisa associa a mais
 * entrevistas e ofertas.
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
    <div className="bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] text-white rounded-xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg">Plano do dia</h2>
          <p className="text-sm text-blue-100 mt-0.5">
            {bateu
              ? `Meta batida! ${p.hoje} candidatura(s) hoje. Continue enquanto há vagas novas.`
              : `Aplique em ${p.faltam} vaga(s) hoje. Marque "aplicado" ao enviar cada uma.`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">🔥 {p.streak}</p>
          <p className="text-xs text-blue-200">dias seguidos</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${bateu ? "bg-emerald-400" : "bg-[#e94560]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-semibold">
          {p.hoje}/{p.meta}
        </span>
        <Link
          href="/vagas"
          className="text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 transition-colors"
        >
          Ver vagas
        </Link>
      </div>
    </div>
  );
}
