import type { Job, Application, DailyMetrics, CollectionResult } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// Jobs
export const getTopJobs = (limit = 20) =>
  get<Job[]>(`/api/v1/jobs/top?limit=${limit}`);

export const getAllJobs = () => get<Job[]>("/api/v1/jobs");

export const triggerCollection = () =>
  post<CollectionResult>("/api/v1/jobs/collect");

export const countToday = () =>
  get<{ count: number }>("/api/v1/jobs/count/today");

// Applications
export const getApplications = () => get<Application[]>("/api/v1/applications");

export const getApplicationsByStage = (stage: string) =>
  get<Application[]>(`/api/v1/applications/stage/${stage}`);

export const applyToJob = (jobId: number, notes?: string) =>
  post<Application>(`/api/v1/applications/job/${jobId}`, notes ? { notes } : undefined);

export const updateStage = (id: number, stage: string) =>
  put<Application>(`/api/v1/applications/${id}/stage`, { stage });

// Metrics
export const getTodayMetrics = () => get<DailyMetrics>("/api/v1/metrics/today");

export const getLast30Days = () =>
  get<DailyMetrics[]>("/api/v1/metrics/last30days");

export const getCallbackRate = () =>
  get<{ callbackRate: number }>("/api/v1/metrics/callback-rate");
