import type { Job } from "../types";
import { baseJob, safeFetch, stripHtml } from "./util";

interface RemoteOkJob {
  id?: string;
  slug?: string;
  url?: string;
  position?: string;
  company?: string;
  date?: string;
  tags?: string[];
  description?: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
}

export function mapRemoteOk(j: RemoteOkJob): Job | null {
  if (!j.id || !j.position) return null;
  return baseJob({
    id: `remoteok:${j.id}`,
    title: j.position,
    companyName: j.company || "Empresa",
    link: j.url || `https://remoteok.com/remote-jobs/${j.slug ?? j.id}`,
    source: "RemoteOK",
    remote: true,
    location: j.location || "Remoto",
    techs: j.tags?.length ? j.tags.slice(0, 6) : null,
    description: stripHtml(j.description ?? "").slice(0, 4000),
    salaryMin: j.salary_min ?? null,
    salaryMax: j.salary_max ?? null,
    salaryInformed: Boolean(j.salary_min),
    publishedAt: j.date ? new Date(j.date).toISOString() : null,
  });
}

export async function fetchRemoteOk(): Promise<Job[]> {
  const res = await safeFetch("https://remoteok.com/api");
  if (!res) return [];
  try {
    const data = (await res.json()) as RemoteOkJob[];
    // o primeiro item é um aviso legal, não uma vaga
    return data
      .filter((j) => j && j.id)
      .map(mapRemoteOk)
      .filter((j): j is Job => j !== null);
  } catch {
    return [];
  }
}
