import { getTopJobs, getTodayMetrics, getCallbackRate, triggerCollection } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { JobCard } from "@/components/JobCard";
import type { Job, DailyMetrics } from "@/lib/types";
import Link from "next/link";

export const revalidate = 300;

async function fetchAll() {
  const [jobs, metrics, rate] = await Promise.allSettled([
    getTopJobs(20),
    getTodayMetrics(),
    getCallbackRate(),
  ]);

  return {
    jobs: jobs.status === "fulfilled" ? jobs.value : ([] as Job[]),
    metrics: metrics.status === "fulfilled" ? metrics.value : (null as DailyMetrics | null),
    callbackRate: rate.status === "fulfilled" ? rate.value.callbackRate : 0,
  };
}

async function collectAction() {
  "use server";
  await triggerCollection();
  revalidatePath("/");
}

export default async function Dashboard() {
  const { jobs, metrics, callbackRate } = await fetchAll();

  const stats = [
    { label: "Vagas Hoje", value: metrics?.jobsCollected ?? 0 },
    { label: "Avaliadas", value: metrics?.jobsScored ?? 0 },
    { label: "Notificadas", value: metrics?.jobsNotified ?? 0 },
    { label: "Taxa Callback", value: `${callbackRate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Top vagas de hoje ordenadas por score de compatibilidade
          </p>
        </div>
        <form action={collectAction}>
          <button
            type="submit"
            className="text-sm font-semibold bg-[#e94560] text-white px-4 py-2 rounded-lg hover:bg-[#c73652] transition-colors"
          >
            Coletar agora
          </button>
        </form>
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
          <p className="text-gray-400 text-lg">Nenhuma vaga encontrada.</p>
          <p className="text-gray-400 text-sm mt-1">
            Clique em &quot;Coletar agora&quot; para iniciar a busca.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} rank={i + 1} />
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="text-center">
          <Link
            href="/vagas"
            className="text-sm font-medium text-[#0f3460] hover:underline"
          >
            Ver todas as vagas →
          </Link>
        </div>
      )}
    </div>
  );
}
