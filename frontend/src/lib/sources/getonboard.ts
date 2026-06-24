import type { Job } from "../types";
import { baseJob, safeFetch, stripHtml } from "./util";

/**
 * Get on Board (getonbrd.com) — vagas de tecnologia com forte presença na
 * América Latina. Ótima fonte de remoto LATAM (mesmo fuso, contrata Brasil).
 */

interface GobJob {
  id: string;
  links?: { public_url?: string };
  attributes?: {
    title?: unknown;
    description?: unknown;
    company?: unknown;
    remote?: unknown;
    remote_modality?: unknown;
    remote_zone?: unknown;
    countries?: unknown;
    location_cities?: unknown;
    tags?: unknown;
    published_at?: unknown;
  };
}

/** Coage qualquer valor para string limpa (a API mistura strings, arrays e refs). */
function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join(", ");
  return "";
}

export function mapGetOnBoard(j: GobJob): Job | null {
  const a = j.attributes ?? {};
  const title = asText(a.title);
  if (!title) return null;

  const remote = a.remote === true || asText(a.remote_modality) === "fully_remote";
  const hybrid = asText(a.remote_modality) === "hybrid";

  const zone = asText(a.remote_zone);
  const cities = asText(a.location_cities);
  const countries = asText(a.countries);
  // Get on Board é LATAM; vagas remotas contratam no Brasil/região.
  const location = remote ? zone || countries || "LATAM" : cities || countries || "LATAM";

  const tags = Array.isArray(a.tags) ? a.tags.filter((t): t is string => typeof t === "string") : [];
  const company = asText(a.company) || "Empresa";

  return baseJob({
    id: `getonbrd:${j.id}`,
    title,
    companyName: company,
    link: j.links?.public_url || `https://www.getonbrd.com/jobs/${j.id}`,
    source: "Get on Board",
    remote,
    hybrid,
    location,
    techs: tags.length ? tags.slice(0, 6) : null,
    description: stripHtml(asText(a.description)).slice(0, 4000),
    publishedAt: typeof a.published_at === "number" ? new Date(a.published_at * 1000).toISOString() : null,
  });
}

export async function fetchGetOnBoard(): Promise<Job[]> {
  const res = await safeFetch(
    "https://www.getonbrd.com/api/v0/categories/programming/jobs?per_page=50"
  );
  if (!res) return [];
  try {
    const data = (await res.json()) as { data: GobJob[] };
    return (data.data ?? [])
      .map(mapGetOnBoard)
      .filter((j): j is Job => j !== null);
  } catch {
    return [];
  }
}
