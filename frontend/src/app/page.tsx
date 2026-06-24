import { getJobs } from "@/lib/jobs";
import { JobCard } from "@/components/JobCard";
import { PlanoDoDia } from "@/components/PlanoDoDia";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      <PlanoDoDia />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Foco no Brasil (remoto ou Bauru): só vagas com chance real, stack compatível, nível adequado e recentes. Internacional aparece abaixo.
          </p>
        </div>
        <span className="text-xs text-slate-500">
          Atualizado {new Date(collectedAt).toLocaleString("pt-BR")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="card border-dashed text-center py-16">
          <p className="text-slate-400">Nenhuma vaga encontrada agora.</p>
          <p className="text-sm text-slate-500 mt-1">
            As fontes podem estar temporariamente indisponíveis. Recarregue em alguns minutos.
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
            <Link href="/vagas" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
              Ver todas as {jobs.length} vagas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
