import type { Job } from "../types";
import { fetchLinkedin } from "./linkedin";
import { fetchRemotive } from "./remotive";
import { fetchRemoteOk } from "./remoteok";
import { fetchJobicy } from "./jobicy";
import { fetchHimalayas } from "./himalayas";
import { fetchArbeitnow } from "./arbeitnow";
import { fetchWeWorkRemotely } from "./weworkremotely";
import { fetchMuse } from "./themuse";
import { fetchGetOnBoard } from "./getonboard";

export interface Source {
  name: string;
  fetch: () => Promise<Job[]>;
}

export const SOURCES: Source[] = [
  { name: "LinkedIn", fetch: fetchLinkedin },
  { name: "Remotive", fetch: fetchRemotive },
  { name: "RemoteOK", fetch: fetchRemoteOk },
  { name: "Jobicy", fetch: fetchJobicy },
  { name: "Himalayas", fetch: fetchHimalayas },
  { name: "Arbeitnow", fetch: fetchArbeitnow },
  { name: "WeWorkRemotely", fetch: fetchWeWorkRemotely },
  { name: "The Muse", fetch: fetchMuse },
  { name: "Get on Board", fetch: fetchGetOnBoard },
];

export interface SourceResult {
  source: string;
  count: number;
  ok: boolean;
}

/** Busca todas as fontes em paralelo; nenhuma falha derruba as outras. */
export async function fetchAllSources(): Promise<{
  jobs: Job[];
  results: SourceResult[];
}> {
  const settled = await Promise.allSettled(
    SOURCES.map(async (s) => ({ source: s.name, jobs: await s.fetch() }))
  );

  const jobs: Job[] = [];
  const results: SourceResult[] = [];

  settled.forEach((r, i) => {
    if (r.status === "fulfilled") {
      jobs.push(...r.value.jobs);
      results.push({ source: r.value.source, count: r.value.jobs.length, ok: true });
    } else {
      results.push({ source: SOURCES[i].name, count: 0, ok: false });
    }
  });

  return { jobs, results };
}
