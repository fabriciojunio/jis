import type { Job } from "../types";
import { baseJob, parseSalary, safeFetch, stripHtml } from "./util";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  tags: string[];
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

export function mapRemotive(j: RemotiveJob): Job {
  const sal = parseSalary(j.salary);
  return baseJob({
    id: `remotive:${j.id}`,
    title: j.title,
    companyName: j.company_name || "Empresa",
    link: j.url,
    source: "Remotive",
    remote: true,
    location: j.candidate_required_location || "Remoto",
    techs: j.tags?.length ? j.tags.slice(0, 6) : null,
    description: stripHtml(j.description ?? "").slice(0, 4000),
    salaryMin: sal.min,
    salaryMax: sal.max,
    salaryInformed: sal.informed,
    publishedAt: j.publication_date ? new Date(j.publication_date).toISOString() : null,
  });
}

export async function fetchRemotive(): Promise<Job[]> {
  const res = await safeFetch(
    "https://remotive.com/api/remote-jobs?category=software-dev&limit=80"
  );
  if (!res) return [];
  try {
    const data = (await res.json()) as { jobs: RemotiveJob[] };
    return (data.jobs ?? []).map(mapRemotive);
  } catch {
    return [];
  }
}
