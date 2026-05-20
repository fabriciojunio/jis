export interface Job {
  id: number;
  title: string;
  companyName: string;
  link: string;
  source: string;
  remote: boolean;
  hybrid: boolean;
  level: string | null;
  techs: string[] | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryInformed: boolean;
  location: string | null;
  finalScore: number | null;
  scoreMl: number | null;
  scoreBreakdown: Record<string, number> | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  stage: string;
  responseReceived: boolean;
  appliedAt: string | null;
  responseAt: string | null;
  notes: string | null;
}

export interface DailyMetrics {
  date: string;
  jobsCollected: number;
  jobsScored: number;
  jobsNotified: number;
  applicationsSent: number;
  responsesReceived: number;
  interviewsScheduled: number;
  callbackRate: number;
}

export interface CollectionResult {
  totalAnalyzed: number;
  newJobs: number;
  scrapersRun: number;
  errors: string[];
}

export type Stage =
  | "applied"
  | "screening"
  | "hr"
  | "technical"
  | "offer"
  | "rejected"
  | "pending";

export const STAGE_LABELS: Record<string, string> = {
  applied: "Aplicado",
  screening: "Triagem",
  hr: "RH",
  technical: "Técnica",
  offer: "Oferta",
  rejected: "Rejeitado",
  pending: "Pendente",
};

export const STAGE_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800",
  screening: "bg-yellow-100 text-yellow-800",
  hr: "bg-purple-100 text-purple-800",
  technical: "bg-orange-100 text-orange-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-700",
};
