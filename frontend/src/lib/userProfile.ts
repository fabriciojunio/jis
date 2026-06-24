import { PROFILE } from "./profile";

/**
 * Perfil do usuário, editável e persistido no navegador (localStorage).
 * É a fonte de verdade das informações da pessoa: dados, skills, projetos,
 * experiências, formação, cursos e preferências de busca. Alimenta a geração
 * de currículo e a priorização das vagas, e vai sendo atualizado ao longo do
 * tempo conforme a pessoa conecta o GitHub ou adiciona itens manualmente.
 *
 * A estrutura é pensada para virar multiusuário (um perfil por conta) no futuro.
 */

export type Prioridade = "bauru" | "brasil" | "internacional" | "equilibrado";

export interface Projeto {
  nome: string;
  descricao: string;
  stack: string[];
  url?: string;
}
export interface Experiencia {
  cargo: string;
  empresa: string;
  periodo: string;
  descricao?: string;
}
export interface Formacao {
  curso: string;
  instituicao: string;
  periodo?: string;
}
export interface Curso {
  nome: string;
  instituicao?: string;
}

export interface UserProfile {
  nome: string;
  titulo: string;
  cidade: string;
  estado: string;
  resumo: string;
  links: { github: string; linkedin: string; portfolio: string };
  prioridade: Prioridade;
  senioridade: string[];
  skills: string[];
  projetos: Projeto[];
  experiencias: Experiencia[];
  formacao: Formacao[];
  cursos: Curso[];
  /** ISO da última atualização. */
  atualizadoEm: string;
}

const KEY = "jis:user-profile";

/** Perfil padrão já preenchido com os dados do Fabricio. */
export function defaultProfile(): UserProfile {
  const skills = Object.keys(PROFILE.techs)
    .filter((t) => PROFILE.techs[t] >= 1.5)
    .map(nomeBonito);

  const projetos: Projeto[] = PROFILE.projetos.map((p) => ({
    nome: p.nome,
    descricao: "",
    stack: p.stack,
  }));

  return {
    nome: PROFILE.nome,
    titulo: "Desenvolvedor Full Stack (Java, Python, Node, React)",
    cidade: PROFILE.cidade,
    estado: PROFILE.estado,
    resumo:
      "Desenvolvedor full stack focado em back-end com Java/Spring Boot, Python/FastAPI e Node, e front-end com React/Next.js. Experiência com projetos próprios de ponta a ponta.",
    links: { github: "fabriciojunio", linkedin: "", portfolio: "" },
    prioridade: "brasil",
    senioridade: ["Júnior", "Pleno"],
    skills,
    projetos,
    experiencias: [],
    formacao: [],
    cursos: [],
    atualizadoEm: new Date().toISOString(),
  };
}

function nomeBonito(t: string): string {
  if (t === "node.js" || t === "nodejs" || t === "node") return "Node.js";
  if (t === "next.js" || t === "nextjs") return "Next.js";
  if (t === "spring boot") return "Spring Boot";
  if (t === "machine learning") return "Machine Learning";
  if (t === "postgresql") return "PostgreSQL";
  if (t === "fastapi") return "FastAPI";
  if (t === "javascript") return "JavaScript";
  if (t === "typescript") return "TypeScript";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const d = defaultProfile();
      window.localStorage.setItem(KEY, JSON.stringify(d));
      return d;
    }
    return { ...defaultProfile(), ...(JSON.parse(raw) as UserProfile) };
  } catch {
    return defaultProfile();
  }
}

export function saveUserProfile(p: UserProfile): void {
  if (typeof window === "undefined") return;
  const next = { ...p, atualizadoEm: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("jis:profile-changed"));
}

/** Mescla skills e projetos novos sem duplicar (usado pela importação do GitHub). */
export function mergeImport(
  p: UserProfile,
  novo: { skills?: string[]; projetos?: Projeto[] }
): UserProfile {
  const skills = [...new Set([...p.skills, ...(novo.skills ?? [])])];
  const nomesExistentes = new Set(p.projetos.map((x) => x.nome.toLowerCase()));
  const projetos = [
    ...p.projetos,
    ...(novo.projetos ?? []).filter((x) => !nomesExistentes.has(x.nome.toLowerCase())),
  ];
  return { ...p, skills, projetos };
}
