import type { Job } from "../types";
import { baseJob, safeFetch, stripHtml } from "./util";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  jobLevel?: string;
  jobIndustry?: string[];
  pubDate: string;
  jobExcerpt?: string;
  jobDescription?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
}

export function mapJobicy(j: JobicyJob): Job {
  return baseJob({
    id: `jobicy:${j.id}`,
    title: j.jobTitle,
    companyName: j.companyName || "Empresa",
    link: j.url,
    source: "Jobicy",
    remote: true,
    location: j.jobGeo || "Remoto",
    level: j.jobLevel || null,
    techs: j.jobIndustry?.length ? j.jobIndustry.slice(0, 4) : null,
    description: stripHtml(`${j.jobExcerpt ?? ""} ${j.jobDescription ?? ""}`).slice(0, 4000),
    salaryMin: j.annualSalaryMin ?? null,
    salaryMax: j.annualSalaryMax ?? null,
    salaryInformed: Boolean(j.annualSalaryMin),
    publishedAt: j.pubDate ? new Date(j.pubDate).toISOString() : null,
  });
}

export async function fetchJobicy(): Promise<Job[]> {
  const res = await safeFetch(
    "https://jobicy.com/api/v2/remote-jobs?count=50&industry=dev"
  );
  if (!res) return [];
  try {
    const data = (await res.json()) as { jobs: JobicyJob[] };
    return (data.jobs ?? []).map(mapJobicy);
  } catch {
    return [];
  }
}
