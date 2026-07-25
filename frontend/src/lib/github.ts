import type { Projeto } from "./userProfile";

/**
 * Importa dados públicos do GitHub: repositórios viram projetos e as linguagens
 * viram skills. Funciona sem autenticação (limite de 60 req/h por IP); um token
 * opcional aumenta o limite e permite repositórios privados.
 */

interface GhRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
}

export interface GithubImport {
  projetos: Projeto[];
  skills: string[];
  total: number;
}

function normLang(l: string): string {
  const m: Record<string, string> = {
    "c#": "C#",
    "c++": "C++",
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    go: "Go",
    php: "PHP",
    ruby: "Ruby",
    html: "HTML",
    css: "CSS",
    shell: "Shell",
    dockerfile: "Docker",
  };
  return m[l.toLowerCase()] ?? l;
}

/** Usuário do GitHub: 1-39 caracteres alfanuméricos, hífen não nas pontas. */
const GH_USER = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

export async function importFromGithub(username: string, token?: string): Promise<GithubImport> {
  const user = username.trim().replace(/^@/, "").replace(/.*github\.com\//, "").replace(/\/$/, "");
  if (!user) throw new Error("Informe o usuário do GitHub.");
  if (!GH_USER.test(user)) throw new Error("Usuário do GitHub inválido.");

  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  // O token só pode conter caracteres seguros de header (evita header injection).
  const t = token?.trim();
  if (t) {
    if (!/^[\w.\-~+/=]+$/.test(t)) throw new Error("Token do GitHub inválido.");
    headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`,
    { headers }
  );
  if (res.status === 404) throw new Error("Usuário do GitHub não encontrado.");
  if (res.status === 403) throw new Error("Limite do GitHub atingido. Tente novamente mais tarde ou use um token.");
  if (!res.ok) throw new Error(`GitHub: erro ${res.status}.`);

  const repos = (await res.json()) as GhRepo[];
  const relevantes = repos.filter((r) => !r.fork && !r.archived);

  const projetos: Projeto[] = relevantes
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map((r) => ({
      nome: r.name,
      descricao: r.description ?? "",
      stack: [r.language, ...(r.topics ?? [])].filter((x): x is string => Boolean(x)).map(normLang).slice(0, 6),
      url: r.html_url,
    }));

  const skills = [
    ...new Set(relevantes.map((r) => r.language).filter((l): l is string => Boolean(l)).map(normLang)),
  ];

  return { projetos, skills, total: relevantes.length };
}
