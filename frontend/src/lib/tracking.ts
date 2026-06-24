/**
 * Rastreamento local (no navegador) do que o candidato já viu e já trabalhou.
 * - "vistas": ids de vagas já exibidas; uma vaga é "Nova" na primeira vez que aparece.
 * - "currículo gerado": ids de vagas para as quais o currículo já foi gerado.
 * (As candidaturas ficam em applications.ts.)
 */

const SEEN = "jis:seen";
const CV = "jis:cv-generated";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify([...set]));
}

/** Retorna true se a vaga nunca foi vista antes e a marca como vista. */
export function isNewAndMark(jobId: string): boolean {
  const seen = readSet(SEEN);
  if (seen.has(jobId)) return false;
  seen.add(jobId);
  writeSet(SEEN, seen);
  return true;
}

export function isCvGenerated(jobId: string): boolean {
  return readSet(CV).has(jobId);
}

export function markCvGenerated(jobId: string): void {
  const set = readSet(CV);
  if (!set.has(jobId)) {
    set.add(jobId);
    writeSet(CV, set);
  }
}
