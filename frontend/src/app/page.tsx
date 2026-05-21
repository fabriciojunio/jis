import { getTopJobs, getTodayMetrics, getCallbackRate } from "@/lib/api";
import { fetchRemotiveJobs } from "@/lib/remotive";
import { MOCK_METRICS } from "@/lib/mock-data";
import { JobCard } from "@/components/JobCard";
import type { Job, DailyMetrics } from "@/lib/types";
import Link from "next/link";
import { collectAction } from "./actions";

export const dynamic = "force-dynamic";

async function fetchAll() {
  const [jobs, metrics, rate] = await Promise.allSettled([
    getTopJobs(20),
    getTodayMetrics(),
    getCallbackRate(),
  ]);

  const apiJobs = jobs.status === "fulfilled" ? jobs.value : ([] as Job[]);
  const apiOnline = jobs.status === "fulfilled" && apiJobs.length > 0;

  return {
    jobs: apiJobs,
    metrics: metrics.status === "fulfilled" ? metrics.value : (null as DailyMetrics | null),
    callbackRate: rate.status === "fulfilled" ? rate.value.callbackRate : 0,
    apiOnline,
  };
}

export default async function Dashboard() {
  let jobs: Job[] = [];
  let metrics: DailyMetrics | null = null;
  let callbackRate = 0;
  let apiOnline = false;

  try {
    ({ jobs, metrics, callbackRate, apiOnline } = await fetchAll());
  } catch {
    // ignora
  }

  // Backend offline: busca vagas reais do Remotive
  if (!apiOnline) {
    jobs = await fetchRemotiveJobs(20);
    metrics = MOCK_METRICS;
    callbackRate = MOCK_METRICS.callbackRate;
  }

  const isDemo = !apiOnline;

  const stats = [
    { label: "Vagas Hoje", value: metrics?.jobsCollected ?? jobs.length },
    { label: "Avaliadas", value: metrics?.jobsScored ?? jobs.length },
    { label: "Notificadas", value: metrics?.jobsNotified ?? 0 },
    { label: "Taxa Callback", value: `${callbackRate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
          <span>🌐</span>
          <span>
            <strong>Vagas ao vivo</strong> — exibindo vagas coletadas da internet em tempo real. Configure{" "}
            <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> para conectar o backend completo com ML.
          </span>
        </div>
      )}

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
          <p className="text-gray-400 text-lg">Carregando vagas...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} rank={i + 1} />
          ))}
        </div>
      )}

      {jobs.length > 0 && !isDemo && (
        <div className="text-center">
          <Link href="/vagas" className="text-sm font-medium text-[#0f3460] hover:underline">
            Ver todas as vagas →
          </Link>
        </div>
      )}
    </div>
  );
}
