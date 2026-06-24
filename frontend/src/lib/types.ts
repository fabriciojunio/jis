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
  applied: "bg-blue-100 text-blue-800",
  screening: "bg-yellow-100 text-yellow-800",
  hr: "bg-purple-100 text-purple-800",
  technical: "bg-orange-100 text-orange-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

/** Estágios que contam como "tive resposta" para a taxa de callback. */
export const RESPONSE_STAGES: Stage[] = ["screening", "hr", "technical", "offer"];
