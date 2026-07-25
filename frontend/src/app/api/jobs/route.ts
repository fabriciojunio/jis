import { NextResponse, type NextRequest } from "next/server";
import { getJobs } from "@/lib/jobs";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
// Roda em runtime (não no build); as fontes têm cache próprio de 1h e o cron
// diário atualiza o cache de dados.
export const dynamic = "force-dynamic";

/** Extrai o IP do cliente respeitando os headers de proxy da Vercel. */
function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "desconhecido";
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const limite = rateLimit(`jobs:${ip}`, 30, 60_000);
  if (!limite.ok) {
    log.warn("rate_limit_excedido", { rota: "/api/jobs", ip });
    return NextResponse.json(
      { erro: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(limite.resetEmSeg) } }
    );
  }

  try {
    const payload = await getJobs();
    const indisponiveis = payload.sources.filter((s) => !s.ok).map((s) => s.source);
    if (indisponiveis.length) log.warn("fontes_indisponiveis", { fontes: indisponiveis });

    return NextResponse.json(payload, {
      headers: {
        // Cache de borda: serve por 1h e revalida em segundo plano por mais 1h.
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
        "X-RateLimit-Remaining": String(limite.restante),
      },
    });
  } catch (err) {
    // Nunca vaza stack/detalhes para o cliente; o rastro fica só no log do servidor.
    log.error("jobs_falhou", { msg: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { erro: "Não foi possível coletar as vagas agora." },
      { status: 502 }
    );
  }
}
