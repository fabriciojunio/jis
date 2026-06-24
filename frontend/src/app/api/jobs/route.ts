import { NextResponse } from "next/server";
import { getJobs } from "@/lib/jobs";

export const runtime = "nodejs";
// Revalida a cada 30 min; as fontes já têm cache próprio de 1h.
export const revalidate = 1800;

export async function GET() {
  const payload = await getJobs();
  return NextResponse.json(payload);
}
