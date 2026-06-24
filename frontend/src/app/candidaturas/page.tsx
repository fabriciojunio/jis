"use client";

import { useEffect, useState } from "react";
import type { Application, Stage } from "@/lib/types";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/types";
import {
  getApplications,
  updateStage,
  removeApplication,
  callbackRate,
} from "@/lib/applications";

const STAGES: Stage[] = ["applied", "screening", "hr", "technical", "offer", "rejected"];

export default function CandidaturasPage() {
  const [apps, setApps] = useState<Application[]>([]);

  function reload() {
    setApps(getApplications());
  }

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener("jis:applications-changed", onChange);
    return () => window.removeEventListener("jis:applications-changed", onChange);
  }, []);

  function handleStage(id: string, stage: Stage) {
    updateStage(id, stage);
    reload();
  }

  function handleRemove(id: string) {
    removeApplication(id);
    reload();
  }

  const total = apps.length;
  const respostas = apps.filter((a) => a.responseAt).length;
  const taxa = callbackRate(apps).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Candidaturas</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{total} total</span>
          <span>{respostas} respostas</span>
          <span className="font-semibold text-[#0f3460]">{taxa}% callback</span>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhuma candidatura ainda. Clique em &quot;Marcar aplicado&quot; em uma vaga.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <a
                  href={app.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-900 truncate hover:text-[#0f3460]"
                >
                  {app.jobTitle}
                </a>
                <p className="text-sm text-gray-500">
                  {app.companyName} · {app.source}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Aplicado em {new Date(app.appliedAt).toLocaleDateString("pt-BR")}
                </p>
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
                  onChange={(e) => handleStage(app.id, e.target.value as Stage)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0f3460]"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemove(app.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
