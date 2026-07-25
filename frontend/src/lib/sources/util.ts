import type { Job } from "../types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Revalidação padrão das fontes: 1h. As vagas não mudam de minuto em minuto. */
const REVALIDATE = 3600;

/** Tamanho máximo de resposta aceito de uma fonte (8 MB) para evitar exaustão de memória. */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Endereços internos que uma URL de fonte jamais deve alcançar. Proteção
 * anti-SSRF: mesmo que uma constante de fonte seja alterada por engano para
 * apontar a um host interno, o fetch é recusado antes de sair.
 */
const HOST_BLOQUEADO =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|::1|\[?::1\]?|metadata\.google\.internal)/i;

function ehHostPrivado(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (HOST_BLOQUEADO.test(h)) return true;
  // Faixa privada 172.16.0.0 – 172.31.255.255
  const m = /^172\.(\d{1,3})\./.exec(h);
  if (m) {
    const oct = Number(m[1]);
    if (oct >= 16 && oct <= 31) return true;
  }
  return false;
}

/**
 * Só permite buscar URLs https públicas. Bloqueia http em claro, esquemas
 * exóticos (file:, gopher:, ftp:) e hosts internos/loopback. É a barreira
 * anti-SSRF do agregador, aplicada a toda ida à rede.
 */
export function urlPermitida(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (!u.hostname || ehHostPrivado(u.hostname)) return false;
  return true;
}

/** GET com timeout, User-Agent de navegador e cache do Next. Nunca lança. */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response | null> {
  if (!urlPermitida(url)) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      redirect: "error", // um redirect da fonte não pode nos levar a um host arbitrário
      headers: { "User-Agent": UA, Accept: "*/*", ...(init.headers ?? {}) },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const len = Number(res.headers.get("content-length") ?? "0");
    if (len > MAX_BYTES) return null;
    return res;
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
