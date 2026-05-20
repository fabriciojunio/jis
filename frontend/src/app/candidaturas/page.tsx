"use client";

import { useEffect, useState } from "react";
import { getApplications, updateStage } from "@/lib/api";
import type { Application } from "@/lib/types";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/types";

const STAGES = ["applied", "screening", "hr", "technical", "offer", "rejected"];

export default function CandidaturasPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplications()
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleStageChange(id: number, stage: string) {
    try {
      const updated = await updateStage(id, stage);
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e) {
      console.error(e);
    }
  }

  const total = apps.length;
  const responses = apps.filter((a) => a.responseReceived).length;
  const rate = total > 0 ? ((responses / total) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Candidaturas</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{total} total</span>
          <span>{responses} respostas</span>
          <span className="font-semibold text-[#0f3460]">{rate}% callback</span>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhuma candidatura registrada. Clique em &quot;Marcar aplicado&quot; em uma vaga!
        </div>
      ) : (
        <div className="space-y-3">
          {apps
            .sort((a, b) => new Date(b.appliedAt ?? 0).getTime() - new Date(a.appliedAt ?? 0).getTime())
            .map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                onStageChange={handleStageChange}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function ApplicationRow({
  app,
  onStageChange,
}: {
  app: Application;
  onStageChange: (id: number, stage: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{app.jobTitle}</p>
        <p className="text-sm text-gray-500">{app.companyName}</p>
        {app.appliedAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            Aplicado em {new Date(app.appliedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            STAGE_COLORS[app.stage] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {STAGE_LABELS[app.stage] ?? app.stage}
        </span>

        <select
          value={app.stage}
          onChange={(e) => onStageChange(app.id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f3460]"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
