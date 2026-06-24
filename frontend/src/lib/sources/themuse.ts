import type { Job } from "../types";
import { baseJob, isRemote, safeFetch, stripHtml } from "./util";

interface MuseJob {
  id: number;
  name: string;
  contents: string;
  company: { name: string };
  locations: { name: string }[];
  levels: { name: string }[];
  publication_date: string;
  refs: { landing_page: string };
}

export function mapMuse(j: MuseJob): Job {
  const locations = j.locations?.map((l) => l.name).join(", ") || "";
  const remote = isRemote(locations);
  return baseJob({
    id: `themuse:${j.id}`,
    title: j.name,
    companyName: j.company?.name || "Empresa",
    link: j.refs?.landing_page || "https://www.themuse.com/jobs",
    source: "The Muse",
    remote,
    location: locations || (remote ? "Remoto" : null),
    level: j.levels?.[0]?.name || null,
    description: stripHtml(j.contents ?? "").slice(0, 4000),
    publishedAt: j.publication_date ? new Date(j.publication_date).toISOString() : null,
  });
}

export async function fetchMuse(): Promise<Job[]> {
  // categorias de engenharia + foco em vagas recentes
  const url =
    "https://www.themuse.com/api/public/jobs?category=Software%20Engineering&category=Data%20Science&page=1";
  const res = await safeFetch(url);
  if (!res) return [];
  try {
    const data = (await res.json()) as { results: MuseJob[] };
    return (data.results ?? []).map(mapMuse);
  } catch {
    return [];
  }
}
