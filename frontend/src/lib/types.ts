export interface Job {
  id: string;
  title: string;
  companyName: string;
  link: string;
  source: string;
  remote: boolean;
  hybrid: boolean;
  level: string | null;
  techs: string[] | null;
  /** Texto usado pelo motor de score; não é renderizado. */
  description: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryInformed: boolean;
  location: string | null;
  finalScore: number | null;
  scoreBreakdown: Record<string, number> | null;
  /** Probabilidade estimada de conseguir a vaga (0-100), baseada em evidências. */
  chance: number | null;
  chanceLabel: "Alta" | "Média" | "Baixa" | null;
  /** Motivos curtos que explicam o match (exibidos no card). */
  fitReasons: string[] | null;
  publishedAt: string | null;
  createdAt: string;
}

/** Vaga registrada como candidatura (persistida em localStorage no navegador). */
export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  link: string;
  source: string;
  stage: Stage;
  appliedAt: string;
  responseAt: string | null;
  notes: string | null;
}

export type Stage =
  | "applied"
  | "screening"
  | "hr"
  | "technical"
  | "offer"
  | "rejected";

export const STAGE_LABELS: Record<string, string> = {
  applied: "Aplicado",
  screening: "Triagem",
  hr: "RH",
  technical: "Técnica",
  offer: "Oferta",
  rejected: "Rejeitado",
};

export const STAGE_COLORS: Record<string, string> = {
  applied: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  screening: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20",
  hr: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
  technical: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
  offer: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  rejected: "bg-red-500/15 text-red-300 border border-red-500/20",
};

/** Estágios que contam como "tive resposta" para a taxa de callback. */
export const RESPONSE_STAGES: Stage[] = ["screening", "hr", "technical", "offer"];
