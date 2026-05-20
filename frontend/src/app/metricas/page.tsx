import { getLast30Days, getCallbackRate } from "@/lib/api";
import type { DailyMetrics } from "@/lib/types";

export const revalidate = 600;

export default async function MetricasPage() {
  const [days, rate] = await Promise.allSettled([
    getLast30Days(),
    getCallbackRate(),
  ]);

  const metrics: DailyMetrics[] =
    days.status === "fulfilled" ? days.value : [];
  const callbackRate =
    rate.status === "fulfilled" ? rate.value.callbackRate : 0;

  const totals = metrics.reduce(
    (acc, d) => ({
      collected: acc.collected + d.jobsCollected,
      notified: acc.notified + d.jobsNotified,
      applications: acc.applications + d.applicationsSent,
      interviews: acc.interviews + d.interviewsScheduled,
    }),
    { collected: 0, notified: 0, applications: 0, interviews: 0 }
  );

  const maxCollected = Math.max(...metrics.map((d) => d.jobsCollected), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Vagas Coletadas (30d)" value={totals.collected} />
        <StatCard label="Notificações Enviadas" value={totals.notified} />
        <StatCard label="Candidaturas" value={totals.applications} />
        <StatCard
          label="Taxa de Callback"
          value={`${callbackRate.toFixed(1)}%`}
          highlight
        />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Vagas coletadas por dia (últimos 30 dias)
        </h2>
        {metrics.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Sem dados ainda.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {[...metrics].reverse().map((d) => {
              const pct = (d.jobsCollected / maxCollected) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full bg-[#0f3460] rounded-t hover:bg-[#e94560] transition-colors"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  <span className="text-[9px] text-gray-400 hidden group-hover:block absolute -bottom-5 whitespace-nowrap">
                    {new Date(d.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      {metrics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {["Data", "Coletadas", "Avaliadas", "Notificadas", "Candidaturas", "Respostas"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.map((d) => (
                <tr key={d.date} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    {new Date(d.date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{d.jobsCollected}</td>
                  <td className="px-4 py-2">{d.jobsScored}</td>
                  <td className="px-4 py-2">{d.jobsNotified}</td>
                  <td className="px-4 py-2">{d.applicationsSent}</td>
                  <td className="px-4 py-2">{d.responsesReceived}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight
          ? "bg-[#0f3460] border-[#0f3460] text-white"
          : "bg-white border-gray-200"
      }`}
    >
      <p className={`text-2xl font-bold ${highlight ? "text-white" : "text-[#0f3460]"}`}>
        {value}
      </p>
      <p className={`text-xs mt-1 ${highlight ? "text-blue-200" : "text-gray-500"}`}>
        {label}
      </p>
    </div>
  );
}
