"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import { CvPanel } from "./CvPanel";
import { addApplication, isApplied } from "@/lib/applications";
import { isNewAndMark, isCvGenerated, markCvGenerated } from "@/lib/tracking";

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
  const [isNew, setIsNew] = useState(false);
  const [cvDone, setCvDone] = useState(false);

  useEffect(() => {
    setApplied(isApplied(job.id));
    setCvDone(isCvGenerated(job.id));
    setIsNew(isNewAndMark(job.id));
  }, [job.id]);

  function handleApply() {
    addApplication(job);
    setApplied(true);
  }

  const workMode = job.remote ? "Remoto" : job.hybrid ? "Híbrido" : "Presencial";
  const quando = tempoRelativo(job.publishedAt);
  const chanceColor =
    job.chanceLabel === "Alta"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : job.chanceLabel === "Média"
        ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
        : "text-slate-400 border-slate-600/40 bg-slate-700/20";

  return (
    <div className="card p-5 flex flex-col hover:border-[#2c374e] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {rank && <span className="text-xs font-semibold text-slate-600">{rank}</span>}
            {isNew && !applied && (
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5">
                Novo
              </span>
            )}
            {cvDone && (
              <span className="text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded px-1.5 py-0.5">
                Currículo pronto
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-100 text-[15px] leading-snug">{job.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {job.companyName ? `${job.companyName} · ` : ""}
            {job.location ?? "Remoto"}
          </p>
        </div>
        {job.chance != null && (
          <div className="shrink-0 w-28 text-right">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${chanceColor}`}>
              {job.chanceLabel} · {job.chance}%
            </span>
            <div className="mt-2">
              <ScoreBar score={job.chance} />
            </div>
          </div>
        )}
      </div>

      {job.fitReasons && job.fitReasons.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {job.fitReasons.map((r) => (
            <li key={r} className="text-[11px] text-emerald-300/90 bg-emerald-500/[0.07] border border-emerald-500/15 rounded px-1.5 py-0.5">
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="chip">{workMode}</span>
        {job.level && <span className="chip">{job.level}</span>}
        {job.salaryInformed && (job.salaryMin || job.salaryMax) && (
          <span className="chip text-amber-300/90">
            {job.salaryMin ? job.salaryMin.toLocaleString("pt-BR") : "?"}
            {job.salaryMax ? ` a ${job.salaryMax.toLocaleString("pt-BR")}` : "+"}
          </span>
        )}
        {(job.techs ?? []).slice(0, 5).map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
        <span className="chip text-slate-500">{job.source}</span>
        {quando && <span className="chip text-slate-600">{quando}</span>}
      </div>

      {job.description && (
        <div className="mb-3">
          <button
            onClick={() => setShowDesc((v) => !v)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            {showDesc ? "Ocultar descrição" : "Ver descrição completa"}
          </button>
          {showDesc && (
            <p className="mt-2 text-sm text-slate-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border-l-2 border-[#283041] pl-3">
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
          className="btn-primary flex-1 min-w-[100px]"
        >
          Ver vaga
        </a>
        <button
          onClick={handleApply}
          disabled={applied}
          className={`flex-1 min-w-[100px] text-sm font-medium rounded-lg py-2 px-3 transition-colors border ${
            applied
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 cursor-default"
              : "text-slate-300 border-[#283041] hover:border-emerald-500/60 hover:text-emerald-300"
          }`}
        >
          {applied ? "Aplicado" : "Marcar aplicado"}
        </button>
        <button onClick={() => setShowCv((v) => !v)} className="btn-ghost flex-1 min-w-[100px]">
          {showCv ? "Fechar" : "Currículo"}
        </button>
      </div>

      {showCv && (
        <CvPanel
          job={job}
          onGenerated={() => {
            markCvGenerated(job.id);
            setCvDone(true);
          }}
        />
      )}
    </div>
  );
}
