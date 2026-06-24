"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import { CvPanel } from "./CvPanel";
import { addApplication, isApplied } from "@/lib/applications";

interface JobCardProps {
  job: Job;
  rank?: number;
}

function tempoRelativo(iso: string | null): string | null {
  if (!iso) return null;
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(dias)) return null;
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) return `há ${Math.floor(dias / 7)} sem`;
  return `há ${Math.floor(dias / 30)} meses`;
}

export function JobCard({ job, rank }: JobCardProps) {
  const [applied, setApplied] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showCv, setShowCv] = useState(false);

  useEffect(() => {
    setApplied(isApplied(job.id));
  }, [job.id]);

  function handleApply() {
    addApplication(job);
    setApplied(true);
  }

  const workMode = job.remote ? "Remoto" : job.hybrid ? "Híbrido" : "Presencial";
  const workColor = job.remote
    ? "bg-emerald-100 text-emerald-700"
    : job.hybrid
      ? "bg-sky-100 text-sky-700"
      : "bg-gray-100 text-gray-600";
  const quando = tempoRelativo(job.publishedAt);
  const chanceColor =
    job.chanceLabel === "Alta"
      ? "bg-emerald-600 text-white"
      : job.chanceLabel === "Média"
        ? "bg-amber-500 text-white"
        : "bg-gray-300 text-gray-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {rank && (
            <span className="inline-block text-xs font-bold text-gray-400 mb-1">#{rank}</span>
          )}
          <h3 className="font-semibold text-gray-900 text-base leading-tight">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{job.companyName}</p>
          {job.location && (
            <p className="text-xs text-gray-400 mt-0.5">📍 {job.location}</p>
          )}
        </div>
        {job.chance != null && (
          <div className="shrink-0 w-28 text-right">
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${chanceColor}`}>
              Chance {job.chanceLabel} · {job.chance}%
            </span>
            <div className="mt-1.5">
              <ScoreBar score={job.chance} />
            </div>
          </div>
        )}
      </div>

      {job.fitReasons && job.fitReasons.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {job.fitReasons.map((r) => (
            <li key={r} className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
              ✓ {r}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${workColor}`}>{workMode}</span>
        {job.level && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{job.level}</span>
        )}
        {job.salaryInformed && (job.salaryMin || job.salaryMax) && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {job.salaryMin ? job.salaryMin.toLocaleString("pt-BR") : "?"}
            {job.salaryMax ? ` – ${job.salaryMax.toLocaleString("pt-BR")}` : "+"}
          </span>
        )}
        {(job.techs ?? []).slice(0, 5).map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{job.source}</span>
        {quando && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">{quando}</span>
        )}
      </div>

      {job.description && (
        <div className="mb-3">
          <button
            onClick={() => setShowDesc((v) => !v)}
            className="text-xs font-medium text-[#0f3460] hover:underline"
          >
            {showDesc ? "Ocultar descrição" : "Ver descrição completa"}
          </button>
          {showDesc && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border-l-2 border-gray-100 pl-3">
              {job.description}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[100px] text-center text-sm font-semibold text-white bg-[#0f3460] hover:bg-[#1a1a2e] rounded-lg py-2 transition-colors"
        >
          Ver vaga
        </a>
        <button
          onClick={handleApply}
          disabled={applied}
          className={`flex-1 min-w-[100px] text-sm font-semibold rounded-lg py-2 transition-colors border ${
            applied
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
              : "bg-white text-gray-700 border-gray-200 hover:border-[#e94560] hover:text-[#e94560]"
          }`}
        >
          {applied ? "✓ Aplicado" : "Marcar aplicado"}
        </button>
        <button
          onClick={() => setShowCv((v) => !v)}
          className="flex-1 min-w-[100px] text-sm font-semibold rounded-lg py-2 border border-[#e94560] text-[#e94560] hover:bg-[#e94560] hover:text-white transition-colors"
        >
          {showCv ? "Fechar currículo" : "Gerar currículo"}
        </button>
      </div>

      {showCv && <CvPanel job={job} />}
    </div>
  );
}
