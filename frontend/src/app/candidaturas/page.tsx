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
import { precisaFollowUp } from "@/lib/goals";

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
      <div className="flex items-end justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Candidaturas</h1>
        <div className="flex gap-4 text-sm text-slate-400">
          <span>{total} total</span>
          <span>{respostas} respostas</span>
          <span className="font-semibold text-indigo-300">{taxa}% callback</span>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="card border-dashed text-center py-16 text-slate-500">
          Nenhuma candidatura ainda. Clique em &quot;Marcar aplicado&quot; em uma vaga.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <a
                  href={app.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-100 truncate hover:text-indigo-300"
                >
                  {app.jobTitle}
                </a>
                <p className="text-sm text-slate-500">
                  {app.companyName ? `${app.companyName} · ` : ""}{app.source}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aplicado em {new Date(app.appliedAt).toLocaleDateString("pt-BR")}
                </p>
                {precisaFollowUp(app.appliedAt, app.stage, app.responseAt) && (
                  <span className="inline-block mt-1.5 text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                    Hora de dar follow-up
                  </span>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[app.stage] ?? "chip"}`}>
                  {STAGE_LABELS[app.stage] ?? app.stage}
                </span>
                <select
                  value={app.stage}
                  onChange={(e) => handleStage(app.id, e.target.value as Stage)}
                  className="text-xs bg-[#0d1320] border border-[#1e2638] text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemove(app.id)}
                  className="text-xs text-slate-500 hover:text-red-400 px-1"
                  title="Remover"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
