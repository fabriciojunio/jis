import type { Job } from "../types";
import { baseJob, isRemote, safeFetch, stripHtml } from "./util";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
}

export function mapArbeitnow(j: ArbeitnowJob): Job {
  const remote = j.remote || isRemote(j.location, j.title);
  return baseJob({
    id: `arbeitnow:${j.slug}`,
    title: j.title,
    companyName: j.company_name || "Empresa",
    link: j.url,
    source: "Arbeitnow",
    remote,
    location: j.location || (remote ? "Remoto" : null),
    techs: j.tags?.length ? j.tags.slice(0, 6) : null,
    description: stripHtml(j.description ?? "").slice(0, 4000),
    publishedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
  });
}

export async function fetchArbeitnow(): Promise<Job[]> {
  const res = await safeFetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res) return [];
  try {
    const data = (await res.json()) as { data: ArbeitnowJob[] };
    // só vagas de tech/remoto interessam ao perfil
    return (data.data ?? [])
      .filter((j) => j.remote || /develop|engineer|software|program/i.test(j.title))
      .map(mapArbeitnow);
  } catch {
    return [];
  }
}
