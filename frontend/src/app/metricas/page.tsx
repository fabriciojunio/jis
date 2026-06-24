"use client";

import { useEffect, useState } from "react";
import type { Application } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { getApplications, callbackRate } from "@/lib/applications";

export default function MetricasPage() {
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    const reload = () => setApps(getApplications());
    reload();
    window.addEventListener("jis:applications-changed", reload);
    return () => window.removeEventListener("jis:applications-changed", reload);
  }, []);

  const total = apps.length;
  const respostas = apps.filter((a) => a.responseAt).length;
  const entrevistas = apps.filter((a) => a.stage === "technical" || a.stage === "hr").length;
  const ofertas = apps.filter((a) => a.stage === "offer").length;
  const taxa = callbackRate(apps);

  // distribuição por estágio
  const porEstagio = Object.keys(STAGE_LABELS).map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: apps.filter((a) => a.stage === stage).length,
  }));
  const maxCount = Math.max(...porEstagio.map((e) => e.count), 1);

  const cards = [
    { label: "Candidaturas", value: total },
    { label: "Respostas", value: respostas },
    { label: "Entrevistas", value: entrevistas },
    { label: "Taxa de callback", value: `${taxa.toFixed(1)}%`, highlight: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Métricas</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-4 ${
              c.highlight
                ? "bg-amber-600/15 border-amber-500/30"
                : "card"
            }`}
          >
            <p className={`text-2xl font-bold ${c.highlight ? "text-amber-200" : "text-stone-100"}`}>
              {c.value}
            </p>
            <p className="text-xs mt-1 text-stone-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-stone-100 mb-4">Funil de candidaturas</h2>
        {total === 0 ? (
          <p className="text-stone-500 text-center py-8">
            Sem dados ainda. Marque vagas como aplicadas para acompanhar seu funil.
          </p>
        ) : (
          <div className="space-y-2">
            {porEstagio.map((e) => (
              <div key={e.stage} className="flex items-center gap-3">
                <span className="text-sm text-stone-400 w-24 shrink-0">{e.label}</span>
                <div className="flex-1 h-6 bg-[#16130e] rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((e.count / maxCount) * 100, e.count ? 8 : 0)}%` }}
                  >
                    {e.count > 0 && <span className="text-xs text-white font-medium">{e.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ofertas > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center text-emerald-300">
          Você tem {ofertas} {ofertas === 1 ? "oferta" : "ofertas"}. Parabéns.
        </div>
      )}
    </div>
  );
}
