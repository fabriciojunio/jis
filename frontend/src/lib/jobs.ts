import type { Job } from "./types";
import { aprovada, isRemoteOrBauru, scoreJob } from "./scoring";
import { fetchAllSources, type SourceResult } from "./sources";

export interface JobsPayload {
  jobs: Job[];
  sources: SourceResult[];
  collectedAt: string;
}

/** Chave de deduplicação: link normalizado, ou título+empresa como reserva. */
function dedupeKey(job: Job): string {
  const link = job.link.split("?")[0].replace(/\/$/, "").toLowerCase();
  if (link && link.length > 12) return link;
  return `${job.title}|${job.companyName}`.toLowerCase().replace(/\s+/g, " ");
}

function dedupe(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const key = dedupeKey(job);
    const existing = seen.get(key);
    // mantém a de maior score quando há duplicata entre fontes
    if (!existing || (job.finalScore ?? 0) > (existing.finalScore ?? 0)) {
      seen.set(key, job);
    }
  }
  return [...seen.values()];
}

/**
 * Pipeline completo: coleta → filtra elegíveis (remoto ou Bauru) → pontua →
 * deduplica → ordena por score. É a única função que as páginas consomem.
 */
export async function getJobs(): Promise<JobsPayload> {
  const { jobs: raw, results } = await fetchAllSources();

  // Só vagas com altas chances reais: remoto/Bauru + stack compatível +
  // nível adequado + recente + região que contrata no Brasil + chance >= piso.
  const scored = raw
    .filter(isRemoteOrBauru)
    .map(scoreJob)
    .filter(aprovada);

  const jobs = dedupe(scored).sort((a, b) => {
    const dc = (b.chance ?? 0) - (a.chance ?? 0);
    return dc !== 0 ? dc : (b.finalScore ?? 0) - (a.finalScore ?? 0);
  });

  return { jobs, sources: results, collectedAt: new Date().toISOString() };
}

/** Busca uma vaga específica pelo id (para a tela de detalhe/currículo). */
export async function getJobById(id: string): Promise<Job | null> {
  const { jobs } = await getJobs();
  return jobs.find((j) => j.id === id) ?? null;
}
