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
      <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-4 text-center ${
              c.highlight ? "bg-[#0f3460] border-[#0f3460] text-white" : "bg-white border-gray-200"
            }`}
          >
            <p className={`text-2xl font-bold ${c.highlight ? "text-white" : "text-[#0f3460]"}`}>
              {c.value}
            </p>
            <p className={`text-xs mt-1 ${c.highlight ? "text-blue-200" : "text-gray-500"}`}>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Funil de candidaturas</h2>
        {total === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Sem dados ainda. Marque vagas como aplicadas para acompanhar seu funil.
          </p>
        ) : (
          <div className="space-y-2">
            {porEstagio.map((e) => (
              <div key={e.stage} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 shrink-0">{e.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#0f3460] rounded flex items-center justify-end pr-2"
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-emerald-800">
          🎉 Você tem {ofertas} {ofertas === 1 ? "oferta" : "ofertas"}! Parabéns.
        </div>
      )}
    </div>
  );
}
