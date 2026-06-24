"use client";

import { useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/types";
import { getUserProfile, type Prioridade } from "@/lib/userProfile";

type Filtro = "all" | "alta" | "remote" | "bauru" | "hybrid";

function ehBauru(loc: string): boolean {
  return /bauru|agudos|jaú|jau|lençóis|lencois|pederneiras/.test(loc);
}
function ehBrasil(loc: string): boolean {
  return ehBauru(loc) || /brasil|brazil/.test(loc);
}

/** Rank de região conforme a prioridade do perfil (maior aparece antes). */
function regionRank(job: Job, prioridade: Prioridade): number {
  const loc = (job.location ?? "").toLowerCase();
  if (prioridade === "bauru") return ehBauru(loc) ? 2 : ehBrasil(loc) ? 1 : 0;
  if (prioridade === "brasil") return ehBrasil(loc) ? 1 : 0;
  if (prioridade === "internacional") return ehBrasil(loc) ? 0 : 1;
  return 0;
}

export function VagasClient({ jobs }: { jobs: Job[] }) {
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [busca, setBusca] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("brasil");

  useEffect(() => {
    const reload = () => setPrioridade(getUserProfile().prioridade);
    reload();
    window.addEventListener("jis:profile-changed", reload);
    return () => window.removeEventListener("jis:profile-changed", reload);
  }, []);

  const filtradas = useMemo(() => {
    let r = jobs;
    if (filtro === "alta") r = r.filter((j) => j.chanceLabel === "Alta");
    else if (filtro === "remote") r = r.filter((j) => j.remote);
    else if (filtro === "hybrid") r = r.filter((j) => j.hybrid);
    else if (filtro === "bauru")
      r = r.filter((j) => (j.location ?? "").toLowerCase().includes("bauru"));

    if (busca.trim()) {
      const q = busca.toLowerCase();
      r = r.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.companyName ?? "").toLowerCase().includes(q) ||
          (j.techs ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (j.description ?? "").toLowerCase().includes(q)
      );
    }

    // Ordena pela prioridade de região do perfil e, dentro dela, pela chance.
    return [...r].sort((a, b) => {
      const dr = regionRank(b, prioridade) - regionRank(a, prioridade);
      return dr !== 0 ? dr : (b.chance ?? 0) - (a.chance ?? 0);
    });
  }, [jobs, filtro, busca, prioridade]);

  const filtros: { label: string; value: Filtro }[] = [
    { label: "Todas", value: "all" },
    { label: "Alta chance", value: "alta" },
    { label: "Remoto", value: "remote" },
    { label: "Bauru", value: "bauru" },
    { label: "Híbrido", value: "hybrid" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Vagas</h1>
        <span className="text-sm text-stone-500">{filtradas.length} vagas</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por título, empresa ou tecnologia"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input flex-1"
        />
        <div className="flex gap-1.5 flex-wrap">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                filtro === f.value
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "border-[#3b3326] text-stone-400 hover:text-stone-200 hover:border-amber-500/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-stone-500">Nenhuma vaga com esses filtros.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((job, i) => (
            <JobCard key={job.id} job={job} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
