"use client";

import type { Job } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import { applyToJob } from "@/lib/api";
import { useState } from "react";

interface JobCardProps {
  job: Job;
  rank?: number;
}

export function JobCard({ job, rank }: JobCardProps) {
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    if (applied || loading) return;
    setLoading(true);
    try {
      await applyToJob(job.id);
      setApplied(true);
    } catch {
      // ignora (pode já ter aplicado)
      setApplied(true);
    } finally {
      setLoading(false);
    }
  }

  const workMode = job.remote ? "Remoto" : job.hybrid ? "Híbrido" : "Presencial";
  const workColor = job.remote
    ? "bg-green-100 text-green-700"
    : job.hybrid
    ? "bg-blue-100 text-blue-700"
    : "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {rank && (
            <span className="inline-block text-xs font-bold text-gray-400 mb-1">
              #{rank}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
            {job.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {job.companyName ?? "Empresa"}
          </p>
        </div>
        {job.finalScore != null && (
          <div className="shrink-0 w-32">
            <ScoreBar score={job.finalScore} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${workColor}`}>
          {workMode}
        </span>
        {job.level && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            {job.level}
          </span>
        )}
        {job.salaryInformed && job.salaryMin && job.salaryMax ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            R$ {job.salaryMin.toLocaleString("pt-BR")} – {job.salaryMax.toLocaleString("pt-BR")}
          </span>
        ) : job.salaryInformed ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            Salário informado
          </span>
        ) : null}
        {(job.techs ?? []).slice(0, 4).map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {t}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
          {job.source}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-semibold text-white bg-[#0f3460] hover:bg-[#1a1a2e] rounded-lg py-2 transition-colors"
        >
          Ver Vaga
        </a>
        <button
          onClick={handleApply}
          disabled={applied || loading}
          className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors border ${
            applied
              ? "bg-green-50 text-green-700 border-green-200 cursor-default"
              : "bg-white text-gray-700 border-gray-200 hover:border-[#e94560] hover:text-[#e94560]"
          }`}
        >
          {loading ? "..." : applied ? "Aplicado!" : "Marcar aplicado"}
        </button>
      </div>
    </div>
  );
}
