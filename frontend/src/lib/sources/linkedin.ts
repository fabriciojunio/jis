import type { Job } from "../types";
import { baseJob, decode, isHybrid, isRemote, safeFetch } from "./util";

/**
 * LinkedIn — API "guest" pública (sem login) que devolve cards HTML.
 * É a nossa fonte para vagas de BAURU e remotas no Brasil, além de internacionais.
 */

const ENDPOINT =
  "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

interface LinkedinQuery {
  keywords: string;
  location: string;
  /** f_WT=2 = remoto no filtro do LinkedIn. */
  remoteFilter?: boolean;
}

/** Card individual extraído do HTML. */
function parseCard(card: string): Job | null {
  const id =
    /data-entity-urn="urn:li:jobPosting:(\d+)"/.exec(card)?.[1] ??
    /jobs\/view\/[^"]*?-(\d+)\?/.exec(card)?.[1];

  const link = decode(
    /<a[^>]+base-card__full-link[^>]+href="([^"]+)"/.exec(card)?.[1] ?? ""
  ).split("?")[0];

  const title = decode(
    /base-search-card__title">\s*([\s\S]*?)\s*<\/h3>/.exec(card)?.[1] ?? ""
  ).replace(/\s+/g, " ");

  const company = decode(
    /hidden-nested-link[^>]*>\s*([\s\S]*?)\s*<\/a>/.exec(card)?.[1] ??
      /base-search-card__subtitle"[^>]*>\s*([^<]+?)\s*</.exec(card)?.[1] ??
      ""
  ).replace(/\s+/g, " ");

  const location = decode(
    /job-search-card__location">\s*([\s\S]*?)\s*<\/span>/.exec(card)?.[1] ?? ""
  ).replace(/\s+/g, " ");

  const datetime =
    /datetime="([^"]+)"/.exec(card)?.[1] ?? null;

  if (!id || !title || !link) return null;

  const remote = isRemote(location, title);
  const hybrid = !remote && isHybrid(location, title);

  return baseJob({
    id: `linkedin:${id}`,
    title,
    companyName: company || "Empresa",
    link,
    source: "LinkedIn",
    remote,
    hybrid,
    location: location || null,
    description: title,
    publishedAt: datetime ? new Date(datetime).toISOString() : null,
  });
}

/** Parser puro do HTML do LinkedIn (exportado para testes). */
export function parseLinkedinHtml(html: string): Job[] {
  const jobs: Job[] = [];
  // cada vaga abre num <li> contendo um div base-card
  const cards = html.split("<li>").slice(1);
  for (const card of cards) {
    const job = parseCard(card);
    if (job) jobs.push(job);
  }
  return jobs;
}

async function fetchQuery(q: LinkedinQuery): Promise<Job[]> {
  const params = new URLSearchParams({
    keywords: q.keywords,
    location: q.location,
    start: "0",
  });
  if (q.remoteFilter) params.set("f_WT", "2");
  // TPR = vagas das últimas 2 semanas
  params.set("f_TPR", "r1209600");

  const res = await safeFetch(`${ENDPOINT}?${params.toString()}`);
  if (!res) return [];
  try {
    return parseLinkedinHtml(await res.text());
  } catch {
    return [];
  }
}

export async function fetchLinkedin(): Promise<Job[]> {
  const queries: LinkedinQuery[] = [
    // Bauru e região (presencial/híbrido local)
    { keywords: "desenvolvedor", location: "Bauru, São Paulo, Brazil" },
    { keywords: "programador", location: "Bauru, São Paulo, Brazil" },
    { keywords: "java OR python OR node", location: "Bauru, São Paulo, Brazil" },
    // Remoto no Brasil
    { keywords: "desenvolvedor java", location: "Brazil", remoteFilter: true },
    { keywords: "desenvolvedor python", location: "Brazil", remoteFilter: true },
    { keywords: "full stack developer", location: "Brazil", remoteFilter: true },
    { keywords: "node typescript", location: "Brazil", remoteFilter: true },
    // Remoto internacional ("gringa")
    { keywords: "java backend developer", location: "Worldwide", remoteFilter: true },
    { keywords: "python developer", location: "Worldwide", remoteFilter: true },
  ];

  const results = await Promise.allSettled(queries.map(fetchQuery));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
