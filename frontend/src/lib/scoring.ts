import { PROFILE, TECH_KEYWORDS } from "./profile";
import type { Job } from "./types";

/**
 * Motor de pontuação e de probabilidade de sucesso.
 *
 * Além do score de compatibilidade (finalScore), calcula uma estimativa de
 * CHANCE de conseguir a vaga (0-100), baseada em evidências de recrutamento:
 *  - match de stack 50-60%+ já iguala a chance de quem dá 90%+ (CNBC/InHerSight);
 *  - aplicar em vagas recentes rende muito mais; postagens > 30 dias são
 *    provavelmente "ghost jobs" (Greenhouse/Clarify);
 *  - aplicar acima do nível de senioridade tem retorno baixíssimo;
 *  - vagas remotas restritas a outra região não contratam quem está no Brasil.
 *
 * A regra de ouro do perfil continua: remoto OU Bauru.
 */

// ───────────────────────── score de compatibilidade ─────────────────────────

function techScore(text: string): { score: number; matched: string[] } {
  const matched: string[] = [];
  let score = 0;
  for (const [tech, weight] of Object.entries(PROFILE.techs)) {
    if (text.includes(tech)) {
      score += weight;
      matched.push(tech);
    }
  }
  for (const [tech, weight] of Object.entries(PROFILE.techsNegativas)) {
    if (text.includes(tech)) score += weight;
  }
  return { score, matched };
}

function levelScore(text: string): { score: number; label: string | null } {
  for (const [termo, peso] of Object.entries(PROFILE.niveis)) {
    if (text.includes(termo)) return { score: peso, label: rotuloNivel(termo) };
  }
  return { score: 0, label: null };
}

function rotuloNivel(termo: string): string {
  const t = termo.toLowerCase();
  if (["junior", "júnior", "jr", "entry level"].includes(t)) return "Júnior";
  if (["pleno", "mid", "mid-level"].includes(t)) return "Pleno";
  if (["trainee"].includes(t)) return "Trainee";
  if (["estágio", "estagio"].includes(t)) return "Estágio";
  if (["senior", "sênior", "sr"].includes(t)) return "Sênior";
  if (["staff", "principal", "tech lead", "líder técnico"].includes(t)) return "Lead";
  if (["especialista", "specialist"].includes(t)) return "Especialista";
  return termo;
}

function workModeScore(job: Job): number {
  if (job.remote) return 3.0;
  const local = String(job.location ?? "").toLowerCase();
  const ehBauru = PROFILE.cidadesAceitas.some((c) => local.includes(c));
  if (job.hybrid) return ehBauru ? 2.0 : -1.0;
  if (ehBauru) return 2.0;
  if (local.trim() === "") return 0.0;
  return -4.0;
}

function timingScore(publishedAt: string | null): number {
  if (!publishedAt) return 0;
  const dias = diasDesde(publishedAt);
  if (dias === null) return 0;
  if (dias <= 1) return 2.0;
  if (dias <= 3) return 1.0;
  if (dias > 30) return -1.0;
  return 0;
}

function seniorPenalty(text: string): number {
  return PROFILE.termosSenior.some((t) => text.includes(t.toLowerCase())) ? -3.0 : 0;
}

function salaryScore(job: Job): number {
  if (!job.salaryInformed) return 0;
  if (job.salaryMin && job.salaryMin >= PROFILE.salario.ideal) return 2.0;
  if (job.salaryMin && job.salaryMin < PROFILE.salario.min) return -1.0;
  return 1.0;
}

// ──────────────────────────── chance de sucesso ─────────────────────────────

function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return Number.isNaN(d) ? null : d;
}

/** Quão alinhada a stack da vaga está com o que o candidato domina (0-1). */
export function skillMatch(text: string): { ratio: number; matched: string[]; cores: string[] } {
  const lower = text.toLowerCase();
  const cores = PROFILE.coreTechs.filter((t) => lower.includes(t));
  const todas = TECH_KEYWORDS.filter((t) => lower.includes(t));
  const outras = todas.filter((t) => !PROFILE.coreTechs.includes(t));
  // 3 techs-núcleo (ou equivalentes) já dão match pleno.
  const ratio = Math.min(1, (cores.length * 1.0 + outras.length * 0.5) / 3);
  return { ratio, matched: [...new Set(todas)], cores: [...new Set(cores)] };
}

/** 1 se o nível é adequado (júnior/pleno/sem nível); 0 se é sênior/gestão. */
export function seniorityFit(text: string): { fit: number; label: string | null } {
  const lower = text.toLowerCase();

  // Cargos de gestão/liderança: descartados sempre (não são vaga de dev júnior/pleno).
  const ehGestao =
    /\b(manager|head of|director|diretor|gerente|coordenador|coordinator|tech lead|team lead|staff engineer|principal|architect|arquiteto|vp |c-level|cto)\b/.test(
      lower
    );
  if (ehGestao) return { fit: 0, label: "Lead" };

  if (PROFILE.requisitosDuros.some((r) => lower.includes(r))) return { fit: 0, label: "Sênior" };

  const ehSenior = /\b(senior|sênior|sr\.?|especialista|specialist|lead|líder)\b/.test(lower);
  if (ehSenior) {
    // "Pleno/Sênior" ou "Júnior/Pleno/Sênior" ainda pode valer.
    const tambemBaixo = /\b(j[úu]nior|jr\.?|pleno|trainee|est[áa]gio|entry)\b/.test(lower);
    return tambemBaixo ? { fit: 0.6, label: "Pleno" } : { fit: 0, label: "Sênior" };
  }
  const { label } = levelScore(lower);
  return { fit: 1, label };
}

/** Sinaliza que o título/texto é de uma vaga de desenvolvimento/engenharia. */
export function ehVagaDev(text: string): boolean {
  return /(desenvolvedor|desenvolvedora|develop|engenheir|engineer|programa|full[\s-]?stack|back[\s-]?end|front[\s-]?end|software|data scien|machine learning|\bqa\b|devops|sre)/.test(
    text.toLowerCase()
  );
}

/** Recência: vaga nova rende muito mais; > 30 dias é descartada. */
export function recencyFit(publishedAt: string | null): number {
  const dias = diasDesde(publishedAt);
  if (dias === null) return 0.5; // desconhecido: neutro
  if (dias <= 2) return 1.0;
  if (dias <= 7) return 0.85;
  if (dias <= 14) return 0.6;
  if (dias <= 30) return 0.35;
  return 0; // ghost job provável
}

/** Aderência de região: a vaga pode contratar alguém no Brasil? (0-1) */
export function regionFit(job: Job): { fit: number; permitida: boolean } {
  const local = String(job.location ?? "").toLowerCase();

  if (!job.remote) {
    const ehBauru = PROFILE.cidadesAceitas.some((c) => local.includes(c));
    return { fit: ehBauru ? 1 : 0, permitida: ehBauru };
  }

  if (local.trim() === "") return { fit: 0.9, permitida: true }; // remoto genérico
  const aceita = PROFILE.regioesAceitas.some((r) => local.includes(r));
  if (aceita) return { fit: 1, permitida: true };
  // Local estrangeiro específico (não LATAM/Brasil): assume que contrata só lá.
  return { fit: 0, permitida: false };
}

function hardReqPenalty(text: string): number {
  return PROFILE.requisitosDuros.some((r) => text.includes(r)) ? 0.2 : 0;
}

const REF = 14;

export function scoreJob(job: Job): Job {
  const declaredTechs = job.techs && job.techs.length > 0 ? job.techs : null;
  const text = [job.title, job.description ?? "", (declaredTechs ?? []).join(" "), job.location ?? ""]
    .join(" ")
    .toLowerCase();

  const { score: techPts } = techScore(text);
  const { score: levelPts, label } = levelScore(text);
  const workPts = workModeScore(job);
  const salPts = salaryScore(job);
  const timePts = timingScore(job.publishedAt);
  const seniorPts = seniorPenalty(text);

  const raw = techPts + levelPts + workPts + salPts + timePts + seniorPts;
  const finalScore = Math.max(0, Math.min(100, Math.round((raw / REF) * 100)));

  // ── chance de sucesso ──
  const sm = skillMatch(text);
  const sf = seniorityFit(text);
  const rf = recencyFit(job.publishedAt);
  const gf = regionFit(job);
  const base = 0.42 * sm.ratio + 0.2 * sf.fit + 0.13 * rf + 0.25 * gf.fit;
  const chance = Math.max(0, Math.min(100, Math.round((base - hardReqPenalty(text)) * 100)));
  const chanceLabel = chance >= 65 ? "Alta" : chance >= 45 ? "Média" : "Baixa";

  const fitReasons = buildReasons(sm, sf.label ?? label, rf, gf, job);

  const breakdown: Record<string, number> = {
    techs: round(techPts),
    nivel: round(levelPts),
    modo: round(workPts),
    recencia: round(timePts),
    skill_match: round(sm.ratio),
    senioridade: round(sf.fit),
    regiao: round(gf.fit),
  };

  return {
    ...job,
    techs: declaredTechs ?? (sm.matched.length ? extractTechs(text).slice(0, 6) : null),
    level: job.level ?? sf.label ?? label,
    finalScore,
    scoreBreakdown: breakdown,
    chance,
    chanceLabel,
    fitReasons,
  };
}

function buildReasons(
  sm: { cores: string[] },
  level: string | null,
  rf: number,
  gf: { fit: number },
  job: Job
): string[] {
  const reasons: string[] = [];
  if (sm.cores.length) {
    const nomes = [...new Set(sm.cores.map(nomeTech))].slice(0, 3);
    reasons.push(`Stack alinhada (${nomes.join(", ")})`);
  }
  if (level && ["Júnior", "Pleno", "Trainee", "Estágio"].includes(level)) {
    reasons.push(`Nível ${level}`);
  }
  if (job.remote && gf.fit >= 1) reasons.push("Remoto aceita Brasil/LATAM");
  else if (!job.remote && gf.fit >= 1) reasons.push("Em Bauru/região");
  if (rf >= 0.85) reasons.push("Publicada há poucos dias");
  if (job.salaryInformed) reasons.push("Salário informado");
  return reasons;
}

function nomeTech(t: string): string {
  if (t === "node.js" || t === "nodejs" || t === "node") return "Node.js";
  if (t === "next.js" || t === "nextjs") return "Next.js";
  if (t === "spring boot") return "Spring Boot";
  if (t === "machine learning") return "ML";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function extractTechs(text: string): string[] {
  const lower = text.toLowerCase();
  const found = TECH_KEYWORDS.filter((t) => lower.includes(t));
  return [...new Set(found.map(nomeTech))];
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

// ─────────────────────────────── elegibilidade ──────────────────────────────

/** Base: remota OU em Bauru/região (com sinal de remoto quando local é desconhecido). */
export function isRemoteOrBauru(job: Job): boolean {
  if (job.remote) return true;
  const local = String(job.location ?? "").toLowerCase();
  if (PROFILE.cidadesAceitas.some((c) => local.includes(c))) return true;
  const text = `${job.title} ${job.description ?? ""}`.toLowerCase();
  if (local.trim() === "" && /(remoto|remote|home office|anywhere|worldwide)/.test(text)) return true;
  return false;
}

/** Chance mínima para uma vaga ser considerada "vale a pena aplicar". */
export const CHANCE_MIN = 45;

/**
 * Gate rígido de "altas chances": a vaga já deve estar pontuada (scoreJob).
 * Garante stack compatível, nível adequado, vaga recente, região que contrata
 * no Brasil e chance acima do piso.
 */
export function aprovada(job: Job): boolean {
  if (!isRemoteOrBauru(job)) return false;
  const text = [job.title, job.description ?? "", (job.techs ?? []).join(" "), job.location ?? ""]
    .join(" ")
    .toLowerCase();

  if (regionFit(job).permitida === false) return false;
  if (seniorityFit(text).fit === 0) return false;
  if (recencyFit(job.publishedAt) === 0) return false;

  // O CARGO precisa ser de desenvolvimento — avaliado só no título (descrições
  // e tags citam "software"/techs e enganariam o filtro).
  const titulo = job.title.toLowerCase();
  const coreNoTitulo = PROFILE.coreTechs.some((t) => titulo.includes(t));
  if (!coreNoTitulo && !ehVagaDev(titulo)) return false;

  // Estágio só vale a pena em empresa grande/notável.
  if (/est[áa]gio|estagi|internship|\bintern\b/.test(text)) {
    const empresa = `${job.companyName} ${job.title}`.toLowerCase();
    if (!PROFILE.grandesEmpresas.some((e) => empresa.includes(e))) return false;
  }

  return (job.chance ?? 0) >= CHANCE_MIN;
}
