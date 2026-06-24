import type { Application, Job, Stage } from "./types";
import { RESPONSE_STAGES } from "./types";

/**
 * Persistência de candidaturas no navegador (localStorage). Sem backend:
 * o funil de seleção fica salvo localmente no dispositivo do candidato.
 */

const KEY = "jis:applications";

function read(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}

function write(apps: Application[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(apps));
  window.dispatchEvent(new Event("jis:applications-changed"));
}

export function getApplications(): Application[] {
  return read().sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );
}

export function isApplied(jobId: string): boolean {
  return read().some((a) => a.jobId === jobId);
}

export function addApplication(job: Job): Application {
  const apps = read();
  const existing = apps.find((a) => a.jobId === job.id);
  if (existing) return existing;

  const app: Application = {
    id: `${job.id}:${Date.now()}`,
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.companyName,
    link: job.link,
    source: job.source,
    stage: "applied",
    appliedAt: new Date().toISOString(),
    responseAt: null,
    notes: null,
  };
  write([app, ...apps]);
  return app;
}

export function updateStage(id: string, stage: Stage): void {
  const apps = read().map((a) => {
    if (a.id !== id) return a;
    const gotResponse = RESPONSE_STAGES.includes(stage);
    return {
      ...a,
      stage,
      responseAt: gotResponse && !a.responseAt ? new Date().toISOString() : a.responseAt,
    };
  });
  write(apps);
}

export function removeApplication(id: string): void {
  write(read().filter((a) => a.id !== id));
}

export function callbackRate(apps: Application[]): number {
  if (apps.length === 0) return 0;
  const responded = apps.filter((a) => RESPONSE_STAGES.includes(a.stage)).length;
  return (responded / apps.length) * 100;
}
