import type { Job } from "../types";
import { baseJob, parseSalary, safeFetch, stripHtml } from "./util";

interface HimalayasJob {
  guid?: string;
  title: string;
  companyName: string;
  applicationLink?: string;
  url?: string;
  locationRestrictions?: string[];
  categories?: string[];
  pubDate?: number | string;
  excerpt?: string;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  seniority?: string[];
}

export function mapHimalayas(j: HimalayasJob): Job | null {
  if (!j.title) return null;
  const sal =
    j.minSalary || j.maxSalary
      ? { min: j.minSalary ?? null, max: j.maxSalary ?? null, informed: true }
      : parseSalary(null);
  const pub =
    typeof j.pubDate === "number"
      ? new Date(j.pubDate * 1000).toISOString()
      : j.pubDate
        ? new Date(j.pubDate).toISOString()
        : null;
  return baseJob({
    id: `himalayas:${j.guid ?? j.applicationLink ?? j.title}`,
    title: j.title,
    companyName: j.companyName || "Empresa",
    link: j.applicationLink || j.url || "https://himalayas.app/jobs",
    source: "Himalayas",
    remote: true,
    location: j.locationRestrictions?.join(", ") || "Remoto",
    level: j.seniority?.[0] || null,
    techs: j.categories?.length ? j.categories.slice(0, 4) : null,
    description: stripHtml(`${j.excerpt ?? ""} ${j.description ?? ""}`).slice(0, 4000),
    salaryMin: sal.min,
    salaryMax: sal.max,
    salaryInformed: sal.informed,
    publishedAt: pub,
  });
}

export async function fetchHimalayas(): Promise<Job[]> {
  const res = await safeFetch("https://himalayas.app/jobs/api?limit=50");
  if (!res) return [];
  try {
    const data = (await res.json()) as { jobs: HimalayasJob[] };
    return (data.jobs ?? [])
      .map(mapHimalayas)
      .filter((j): j is Job => j !== null);
  } catch {
    return [];
  }
}
