"use client";

import { useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/types";

type Filtro = "all" | "alta" | "remote" | "bauru" | "hybrid";

export function VagasClient({ jobs }: { jobs: Job[] }) {
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [busca, setBusca] = useState("");

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
          j.companyName.toLowerCase().includes(q) ||
          (j.techs ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (j.description ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [jobs, filtro, busca]);

  const filtros: { label: string; value: Filtro }[] = [
    { label: "Todas", value: "all" },
    { label: "Alta chance", value: "alta" },
    { label: "Remoto", value: "remote" },
    { label: "Bauru", value: "bauru" },
    { label: "Híbrido", value: "hybrid" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
        <span className="text-sm text-gray-500">{filtradas.length} vagas</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por título, empresa, tecnologia..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3460]"
        />
        <div className="flex gap-1">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtro === f.value
                  ? "bg-[#0f3460] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#0f3460]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Nenhuma vaga com esses filtros.</div>
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
