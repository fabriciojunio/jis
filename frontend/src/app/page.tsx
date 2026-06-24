import { getJobs } from "@/lib/jobs";
import { JobCard } from "@/components/JobCard";
import Link from "next/link";

export const revalidate = 1800;

export default async function Dashboard() {
  const { jobs, sources, collectedAt } = await getJobs();
  const top = jobs.slice(0, 12);

  const fontesOk = sources.filter((s) => s.ok && s.count > 0).length;
  const altaChance = jobs.filter((j) => j.chanceLabel === "Alta").length;
  const remotas = jobs.filter((j) => j.remote).length;

  const stats = [
    { label: "Vagas com chance real", value: jobs.length },
    { label: "Alta chance", value: altaChance },
    { label: "Remotas", value: remotas },
    { label: "Fontes ativas", value: `${fontesOk}/${sources.length}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Só vagas com chance real de contratação: stack compatível, nível adequado, recentes e que contratam no Brasil
          </p>
        </div>
        <span className="text-xs text-gray-400">
          Atualizado {new Date(collectedAt).toLocaleString("pt-BR")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-[#0f3460]">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-lg">Nenhuma vaga encontrada agora.</p>
          <p className="text-sm text-gray-400 mt-1">
            As fontes podem estar temporariamente indisponíveis. Tente recarregar em alguns minutos.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {top.map((job, i) => (
              <JobCard key={job.id} job={job} rank={i + 1} />
            ))}
          </div>
          <div className="text-center">
            <Link href="/vagas" className="text-sm font-medium text-[#0f3460] hover:underline">
              Ver todas as {jobs.length} vagas →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
