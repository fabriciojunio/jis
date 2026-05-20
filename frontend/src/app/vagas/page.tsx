"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllJobs } from "@/lib/api";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/types";

type Filter = "all" | "remote" | "hybrid" | "presencial";

export default function VagasPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllJobs()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = jobs;

    if (filter === "remote") result = result.filter((j) => j.remote);
    else if (filter === "hybrid") result = result.filter((j) => j.hybrid && !j.remote);
    else if (filter === "presencial") result = result.filter((j) => !j.remote && !j.hybrid);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.companyName ?? "").toLowerCase().includes(q) ||
          (j.techs ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
  }, [jobs, filter, search]);

  const filters: { label: string; value: Filter }[] = [
    { label: "Todas", value: "all" },
    { label: "Remoto", value: "remote" },
    { label: "Híbrido", value: "hybrid" },
    { label: "Presencial", value: "presencial" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
        <span className="text-sm text-gray-500">{filtered.length} vagas</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por título, empresa ou tecnologia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3460]"
        />
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-[#0f3460] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#0f3460]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhuma vaga encontrada com esses filtros.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job, i) => (
            <JobCard key={job.id} job={job} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
