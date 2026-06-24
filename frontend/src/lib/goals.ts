import { getApplications } from "./applications";

/**
 * Metas de busca baseadas em evidência. Meta-análise de intervenções de busca
 * de emprego (Liu, Huang & Wang, 2014) mostra que metas claras, proatividade e
 * autoeficácia elevam muito a chance de contratação; a intensidade de busca
 * prediz entrevistas e ofertas. Aqui isso vira uma meta diária + sequência.
 */

export const META_DIARIA = 3;

function ymd(iso: string | number | Date): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export interface DailyProgress {
  meta: number;
  hoje: number;
  streak: number;
  /** Dias que faltam para bater a meta de hoje. */
  faltam: number;
}

export function dailyProgress(): DailyProgress {
  const apps = getApplications();
  const dias = new Set(apps.map((a) => ymd(a.appliedAt)));

  const hojeKey = ymd(new Date());
  const hoje = apps.filter((a) => ymd(a.appliedAt) === hojeKey).length;

  // Sequência: dias consecutivos com pelo menos uma candidatura, contando de
  // hoje (ou de ontem, se ainda não aplicou hoje) para trás.
  let streak = 0;
  const cursor = new Date();
  if (!dias.has(ymd(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dias.has(ymd(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { meta: META_DIARIA, hoje, streak, faltam: Math.max(0, META_DIARIA - hoje) };
}

/**
 * Candidaturas que merecem follow-up: ainda no estágio "applied", sem resposta,
 * há mais de N dias. A proatividade (acompanhar a candidatura) é um dos
 * componentes que mais aumentam a eficácia da busca.
 */
export const DIAS_FOLLOWUP = 5;

export function precisaFollowUp(appliedAt: string, stage: string, responseAt: string | null): boolean {
  if (stage !== "applied" || responseAt) return false;
  const dias = (Date.now() - new Date(appliedAt).getTime()) / 86_400_000;
  return dias >= DIAS_FOLLOWUP;
}
