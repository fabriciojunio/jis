import type { Job } from "../types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Revalidação padrão das fontes: 1h. As vagas não mudam de minuto em minuto. */
const REVALIDATE = 3600;

/** GET com timeout, User-Agent de navegador e cache do Next. Nunca lança. */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "*/*", ...(init.headers ?? {}) },
      next: { revalidate: REVALIDATE },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Remove tags HTML e normaliza espaços (descrições vêm cheias de markup). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Tenta extrair faixa salarial de uma string livre. */
export function parseSalary(raw?: string | null): {
  min: number | null;
  max: number | null;
  informed: boolean;
} {
  if (!raw || !raw.trim()) return { min: null, max: null, informed: false };
  const nums = raw.match(/\d[\d.,]*/g);
  if (!nums || nums.length === 0) return { min: null, max: null, informed: false };
  const toInt = (s: string) => {
    const n = parseInt(s.replace(/[.,]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };
  return { min: toInt(nums[0]), max: nums[1] ? toInt(nums[1]) : null, informed: true };
}

/** Detecta se um texto/local indica trabalho remoto. */
export function isRemote(...parts: (string | null | undefined)[]): boolean {
  const t = parts.filter(Boolean).join(" ").toLowerCase();
  return /(remoto|remote|home office|anywhere|worldwide|100% remoto|fully remote)/.test(t);
}

/** Detecta trabalho híbrido. */
export function isHybrid(...parts: (string | null | undefined)[]): boolean {
  const t = parts.filter(Boolean).join(" ").toLowerCase();
  return /(híbrido|hibrido|hybrid)/.test(t);
}

/** Decodifica entidades básicas em atributos/títulos do HTML. */
export function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Molde base de Job; os campos de score são preenchidos depois. */
export function baseJob(partial: Partial<Job> & Pick<Job, "id" | "title" | "link" | "source">): Job {
  return {
    companyName: "Empresa",
    remote: false,
    hybrid: false,
    level: null,
    techs: null,
    description: null,
    salaryMin: null,
    salaryMax: null,
    salaryInformed: false,
    location: null,
    finalScore: null,
    scoreBreakdown: null,
    chance: null,
    chanceLabel: null,
    fitReasons: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}
