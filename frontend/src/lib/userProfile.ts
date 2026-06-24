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
  /** Versão do prefill; quando muda, recarrega os dados base. */
  seedVersion: number;
  /** ISO da última atualização. */
  atualizadoEm: string;
}

const KEY = "jis:user-profile";
const SEED_VERSION = 2;

/** Perfil padrão já preenchido com os dados reais do Fabrício. */
export function defaultProfile(): UserProfile {
  return {
    nome: "Fabrício Júnio",
    titulo: "Fullstack Developer e AI Engineer",
    cidade: "Bauru",
    estado: "SP",
    resumo:
      "Construo produtos completos, do back-end ao front-end, e integro IA para resolver problemas reais. Analista de Sistemas Júnior na Nexum Tecnologia (automações em Java, integrações via API REST e fluxos BPM) e estudante de Ciência da Computação na UNISAGRADO. Aberto a oportunidades como Fullstack Developer ou AI Engineer.",
    links: {
      github: "fabriciojunio",
      linkedin: "",
      portfolio: "https://portfolio-a3qn.vercel.app/",
    },
    prioridade: "brasil",
    senioridade: ["Júnior", "Pleno"],
    skills: [
      "Java", "Spring Boot", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
      "Express", "SQL", "PostgreSQL", "MySQL", "Python", "FastAPI", "Machine Learning",
      "NLP", "Scikit-Learn", "XGBoost", "React Native", "Prisma", "Supabase", "API REST",
      "Git", "BPM",
    ],
    projetos: [
      {
        nome: "QuantBot ML",
        descricao:
          "Sistema de trading quantitativo com IA. Ensemble de Random Forest, XGBoost e Gradient Boosting com análise de sentimento via FinBERT (B3, EUA e cripto). Detecção de regimes de mercado, gestão de risco com Monte Carlo, stop-loss por ATR e Walk-Forward Validation. API FastAPI e dashboard React. Cerca de 13 mil linhas e 233 testes. Open source.",
        stack: ["Python", "Scikit-Learn", "XGBoost", "FastAPI", "React", "Machine Learning"],
        url: "https://github.com/fabriciojunio/quantbot-ml",
      },
      {
        nome: "ConectAgente",
        descricao:
          "Gestão de visitas domiciliares para Agentes Comunitários de Saúde. App mobile em React Native (Expo) e painel web em Next.js. Backend Node.js com Express e Prisma sobre PostgreSQL (Supabase), JWT, controle de acesso por perfis e LGPD. HealthTech incubada na Saruê (UNESP Bauru).",
        stack: ["React Native", "Next.js", "Node.js", "Express", "Prisma", "PostgreSQL", "Supabase"],
      },
      {
        nome: "MyCondPets",
        descricao:
          "Plataforma web de gestão de pets em condomínios, com motor próprio de NLP em PT-BR (tokenização, remoção de stop words, sinônimos e scoring ponderado). Next.js 15, React 19 e PostgreSQL. Cerca de 17,9 mil linhas, 245 testes, 27 rotas e 10 tabelas. Projeto em equipe na UNISAGRADO.",
        stack: ["Next.js", "React", "PostgreSQL", "NLP", "Python"],
      },
    ],
    experiencias: [
      {
        cargo: "Analista de Sistemas Júnior",
        empresa: "Nexum Tecnologia",
        periodo: "jan 2026 - atual",
        descricao:
          "Implementação e customização da plataforma Lecom BPM. Integração com a API do IBGE (lookup de cidade e estado, reduzindo o cadastro manual em 80%), robôs Java de automação (IDWALL), formulários, validações e fluxos BPM completos. Java, JavaScript, MySQL, API REST e Git.",
      },
      {
        cargo: "Estágio em Desenvolvimento",
        empresa: "Nexum Tecnologia",
        periodo: "jun 2025 - jan 2026",
        descricao:
          "Desenvolvimento e manutenção de processos em BPMS com JavaScript e Java: formulários customizados e validações para o setor financeiro, robôs de automação e integrações. Git e Scrum.",
      },
      {
        cargo: "Operador de telemarketing",
        empresa: "Paschoalotto",
        periodo: "dez 2024 - mai 2025",
        descricao:
          "Cobrança ativa da carteira Santander. Bati a meta mensal em 3 meses consecutivos. Comunicação, negociação e foco em resultados.",
      },
    ],
    formacao: [
      {
        curso: "Bacharelado em Ciência da Computação",
        instituicao: "UNISAGRADO",
        periodo: "2024 - 2027",
      },
    ],
    cursos: [
      { nome: "Proteção das Informações (Terceiros)", instituicao: "Sicoob" },
      { nome: "Conscientização em Riscos e Segurança Cibernéticos 2026", instituicao: "Sicoob" },
      { nome: "Data Science do Zero", instituicao: "Joel Grus" },
    ],
    seedVersion: SEED_VERSION,
    atualizadoEm: new Date().toISOString(),
  };
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
    const stored = JSON.parse(raw) as Partial<UserProfile>;
    // Re-semeia quando o prefill base é atualizado (mantém o usuário em dia).
    if (!stored.seedVersion || stored.seedVersion < SEED_VERSION) {
      const d = defaultProfile();
      window.localStorage.setItem(KEY, JSON.stringify(d));
      return d;
    }
    return { ...defaultProfile(), ...stored } as UserProfile;
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
