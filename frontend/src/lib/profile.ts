/**
 * Perfil do candidato. Tudo que personaliza a busca e a pontuação vive aqui:
 * basta editar este arquivo para reajustar o que conta como vaga boa.
 */

export interface Profile {
  nome: string;
  cidade: string;
  estado: string;
  /** Termos da cidade que indicam vaga presencial aceitável (Bauru e arredores). */
  cidadesAceitas: string[];
  /** Níveis de senioridade desejados. */
  senioridade: string[];
  /** Faixa salarial alvo em R$/mês (referência para junior/pleno no Brasil). */
  salario: { min: number; ideal: number };
  /** Tecnologias dominadas, com peso positivo no score. */
  techs: Record<string, number>;
  /** Tecnologias/áreas fora do perfil, com peso negativo. */
  techsNegativas: Record<string, number>;
  /** Termos de nível e seus pesos. */
  niveis: Record<string, number>;
  /** Termos que denunciam vaga sênior real (penaliza forte). */
  termosSenior: string[];
  /** Tecnologias-núcleo: ter pelo menos uma sinaliza match real de stack. */
  coreTechs: string[];
  /** Regiões/locais que indicam que a vaga pode contratar o candidato (LATAM/Brasil/global). */
  regioesAceitas: string[];
  /** Termos que indicam requisito eliminatório (experiência alta, clearance, etc.). */
  requisitosDuros: string[];
  /** Projetos do portfólio — usados como contexto/keywords. */
  projetos: { nome: string; stack: string[] }[];
  /** Consultas de busca enviadas às fontes (LinkedIn, The Muse, etc.). */
  consultas: string[];
}

export const PROFILE: Profile = {
  nome: "Fabricio Antonio",
  cidade: "Bauru",
  estado: "SP",
  cidadesAceitas: [
    "bauru",
    "agudos",
    "pederneiras",
    "lençóis paulista",
    "lencois paulista",
    "jaú",
    "jau",
  ],
  senioridade: ["junior", "júnior", "jr", "trainee", "estágio", "estagio", "pleno"],
  salario: { min: 3000, ideal: 8000 },

  // Stack do candidato — quanto maior o peso, mais decisivo para o match.
  techs: {
    java: 3.0,
    "spring boot": 3.0,
    spring: 2.0,
    python: 3.0,
    fastapi: 2.0,
    "node.js": 2.0,
    nodejs: 2.0,
    "node": 1.5,
    nestjs: 2.0,
    react: 2.0,
    "react native": 1.5,
    "next.js": 1.5,
    nextjs: 1.5,
    typescript: 1.5,
    javascript: 1.5,
    postgresql: 2.0,
    postgres: 2.0,
    supabase: 1.5,
    sql: 1.0,
    "machine learning": 2.0,
    "aprendizado de máquina": 2.0,
    "scikit-learn": 2.0,
    sklearn: 1.5,
    pandas: 1.5,
    xgboost: 1.5,
    nlp: 1.5,
    docker: 1.0,
    "api rest": 1.0,
    "rest api": 1.0,
    "rest": 0.5,
    git: 0.5,
    "full stack": 1.0,
    fullstack: 1.0,
    backend: 1.0,
    "back-end": 1.0,
    frontend: 0.8,
    "front-end": 0.8,
    tailwind: 0.5,
  },

  // Stack que NÃO é do perfil — empurra a vaga para baixo.
  techsNegativas: {
    ".net": -3.0,
    "c#": -3.0,
    "asp.net": -3.0,
    kotlin: -2.5,
    flutter: -2.0,
    swift: -2.0,
    "objective-c": -2.5,
    cobol: -3.0,
    delphi: -3.0,
    php: -1.5,
    laravel: -1.5,
    ruby: -1.5,
    rails: -1.5,
    golang: -1.0,
    rust: -1.0,
    "computer vision": -2.0,
    "totvs": -2.0,
    salesforce: -2.0,
    sap: -2.5,
    abap: -3.0,
  },

  niveis: {
    trainee: 3.0,
    "estágio": 2.5,
    estagio: 2.5,
    junior: 3.0,
    "júnior": 3.0,
    jr: 3.0,
    "entry level": 3.0,
    "júnior/pleno": 3.0,
    pleno: 2.0,
    mid: 2.0,
    "mid-level": 2.0,
    "pleno/sênior": 0.0,
    senior: -3.0,
    "sênior": -3.0,
    sr: -2.0,
    especialista: -2.0,
    specialist: -2.0,
    staff: -3.0,
    principal: -3.0,
    "tech lead": -3.0,
    "líder técnico": -3.0,
  },

  termosSenior: [
    "arquiteto de software",
    "software architect",
    "tech lead",
    "liderança técnica",
    "leadership",
    "8+ years",
    "10+ years",
    "kubernetes obrigatório",
    "kafka obrigatório",
  ],

  coreTechs: [
    "java",
    "spring boot",
    "spring",
    "python",
    "fastapi",
    "node.js",
    "nodejs",
    "node",
    "react",
    "next.js",
    "nextjs",
    "typescript",
    "javascript",
    "postgresql",
    "machine learning",
  ],

  // Locais que indicam que dá para contratar um dev no Brasil.
  regioesAceitas: [
    "worldwide",
    "anywhere",
    "global",
    "remote",
    "remoto",
    "latam",
    "latin america",
    "américa latina",
    "america latina",
    "south america",
    "américa do sul",
    "americas",
    "brazil",
    "brasil",
    // países e cidades da América Latina (mesmo fuso, contratam BR)
    "argentina",
    "buenos aires",
    "mexico",
    "méxico",
    "chile",
    "santiago",
    "colombia",
    "colômbia",
    "bogota",
    "bogotá",
    "peru",
    "perú",
    "lima",
    "uruguay",
    "uruguai",
    "montevideo",
    "paraguay",
    "bolivia",
    "ecuador",
    "venezuela",
    "costa rica",
  ],

  requisitosDuros: [
    "security clearance",
    "5+ years",
    "6+ years",
    "7+ years",
    "8+ years",
    "10+ years",
    "5+ anos",
    "6+ anos",
    "7+ anos",
    "8+ anos",
    "10+ anos",
    "cinco anos",
    "must be authorized to work in the united states",
    "us citizen",
    "us work authorization",
  ],

  projetos: [
    { nome: "MyCondPets", stack: ["Next.js", "TypeScript", "Supabase", "PostgreSQL"] },
    { nome: "ConectAgente", stack: ["React", "Node.js", "TypeScript"] },
    { nome: "Paiol Tech", stack: ["Next.js", "React", "TypeScript"] },
    { nome: "KoraCRM", stack: ["Next.js", "PostgreSQL", "TypeScript"] },
    { nome: "bot-sinais (GolData)", stack: ["Python", "Machine Learning", "FastAPI"] },
    { nome: "Pontual", stack: ["Java", "Spring Boot", "PostgreSQL", "React"] },
    { nome: "QuantBot", stack: ["Python", "scikit-learn", "FastAPI", "Machine Learning"] },
  ],

  // Termos de busca: misturam stack do perfil com foco BR/remoto.
  consultas: [
    "desenvolvedor java",
    "desenvolvedor python",
    "desenvolvedor full stack",
    "desenvolvedor backend",
    "node.js typescript",
    "react developer",
    "spring boot",
    "machine learning",
  ],
};

/** Lista achatada de termos de tech para extração rápida em descrições. */
export const TECH_KEYWORDS: string[] = Object.keys(PROFILE.techs);
