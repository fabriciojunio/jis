import { PROFILE } from "./profile";
import type { Job } from "./types";

/**
 * Monta um prompt completo para o Claude gerar um currículo sob medida para a
 * vaga. Leva TODAS as informações disponíveis da vaga + o perfil do candidato,
 * para que o currículo destaque exatamente o que aquela vaga pede.
 */
export function buildCvPrompt(job: Job): string {
  const techs = (job.techs ?? []).join(", ") || "não informadas";
  const modo = job.remote ? "Remoto" : job.hybrid ? "Híbrido" : "Presencial";
  const salario =
    job.salaryInformed && (job.salaryMin || job.salaryMax)
      ? `${job.salaryMin ?? "?"} – ${job.salaryMax ?? "?"}`
      : "não informado";

  const projetos = PROFILE.projetos
    .map((p) => `- ${p.nome} (${p.stack.join(", ")})`)
    .join("\n");

  const stackPerfil = Object.keys(PROFILE.techs)
    .filter((t) => PROFILE.techs[t] >= 1.5)
    .join(", ");

  return `Você é um especialista em recrutamento técnico. Crie um currículo em português, em Markdown, sob medida para a vaga abaixo, destacando os pontos do meu perfil que mais conversam com o que a vaga pede. Seja honesto: use apenas o que está no meu perfil, sem inventar experiências.

## VAGA
- Título: ${job.title}
- Empresa: ${job.companyName}
- Fonte: ${job.source}
- Local: ${job.location ?? "não informado"} (${modo})
- Nível: ${job.level ?? "não informado"}
- Faixa salarial: ${salario}
- Tecnologias citadas: ${techs}
- Link: ${job.link}

### Descrição completa da vaga
${job.description?.trim() || "(sem descrição detalhada; baseie-se no título e nas tecnologias)"}

## MEU PERFIL
- Nome: ${PROFILE.nome}
- Localização: ${PROFILE.cidade}/${PROFILE.estado} (aberto a remoto)
- Senioridade alvo: ${PROFILE.senioridade.slice(0, 4).join(", ")}
- Stack principal: ${stackPerfil}

### Projetos
${projetos}

## O QUE EU PRECISO
1. Um resumo profissional de 3-4 linhas focado nesta vaga.
2. Seção de habilidades técnicas, priorizando as tecnologias que a vaga pede e que eu domino.
3. Projetos reordenados para destacar os mais relevantes para esta vaga, com 1-2 bullets de impacto cada.
4. Uma sugestão curta de carta de apresentação (3 parágrafos).
Responda apenas com o currículo e a carta, em Markdown.`;
}
