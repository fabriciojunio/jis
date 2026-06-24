import type { Job } from "./types";
import { getUserProfile, type UserProfile } from "./userProfile";

/**
 * Monta um prompt completo para o Claude gerar um currículo sob medida para a
 * vaga, usando TODAS as informações da vaga e o perfil real do usuário (skills,
 * projetos, experiências, formação e cursos do editor de perfil).
 */
export function buildCvPrompt(job: Job, profile?: UserProfile): string {
  const p = profile ?? getUserProfile();

  const techs = (job.techs ?? []).join(", ") || "não informadas";
  const modo = job.remote ? "Remoto" : job.hybrid ? "Híbrido" : "Presencial";
  const salario =
    job.salaryInformed && (job.salaryMin || job.salaryMax)
      ? `${job.salaryMin ?? "?"} a ${job.salaryMax ?? "?"}`
      : "não informado";

  const projetos =
    p.projetos.length > 0
      ? p.projetos.map((x) => `- ${x.nome}${x.stack.length ? ` (${x.stack.join(", ")})` : ""}${x.descricao ? `: ${x.descricao}` : ""}${x.url ? ` [${x.url}]` : ""}`).join("\n")
      : "(nenhum projeto cadastrado)";

  const experiencias =
    p.experiencias.length > 0
      ? p.experiencias.map((x) => `- ${x.cargo} na ${x.empresa} (${x.periodo})${x.descricao ? `: ${x.descricao}` : ""}`).join("\n")
      : "(nenhuma experiência cadastrada)";

  const formacao =
    p.formacao.length > 0
      ? p.formacao.map((x) => `- ${x.curso}, ${x.instituicao}${x.periodo ? ` (${x.periodo})` : ""}`).join("\n")
      : "(não informada)";

  const cursos =
    p.cursos.length > 0
      ? p.cursos.map((x) => `- ${x.nome}${x.instituicao ? ` (${x.instituicao})` : ""}`).join("\n")
      : "(nenhum curso cadastrado)";

  return `Você é um especialista em recrutamento técnico. Crie um currículo em português, em Markdown, sob medida para a vaga abaixo, destacando os pontos do meu perfil que mais conversam com o que a vaga pede. Seja honesto: use apenas o que está no meu perfil, sem inventar experiências.

## VAGA
- Título: ${job.title}
- Empresa: ${job.companyName || "não informada"}
- Fonte: ${job.source}
- Local: ${job.location ?? "não informado"} (${modo})
- Nível: ${job.level ?? "não informado"}
- Faixa salarial: ${salario}
- Tecnologias citadas: ${techs}
- Link: ${job.link}

### Descrição completa da vaga
${job.description?.trim() || "(sem descrição detalhada; baseie-se no título e nas tecnologias)"}

## MEU PERFIL
- Nome: ${p.nome}
- Título: ${p.titulo}
- Localização: ${p.cidade}/${p.estado} (aberto a remoto)
- Resumo: ${p.resumo || "não informado"}
- Senioridade alvo: ${p.senioridade.join(", ") || "júnior/pleno"}
- Skills: ${p.skills.join(", ") || "não informadas"}

### Projetos
${projetos}

### Experiências
${experiencias}

### Formação
${formacao}

### Cursos e certificações
${cursos}

## O QUE EU PRECISO
1. Um resumo profissional de 3 a 4 linhas focado nesta vaga.
2. Seção de habilidades técnicas, priorizando o que a vaga pede e que eu domino.
3. Projetos e experiências reordenados para destacar os mais relevantes para esta vaga, com 1 a 2 bullets de impacto cada.
4. Uma carta de apresentação curta (3 parágrafos).
Responda apenas com o currículo e a carta, em Markdown.`;
}
