import { NextResponse } from "next/server";
import { getJobs } from "@/lib/jobs";

export const runtime = "nodejs";
// Roda em runtime (não no build); as fontes têm cache próprio de 1h e o cron
// diário atualiza o cache de dados.
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getJobs();
  return NextResponse.json(payload);
}
