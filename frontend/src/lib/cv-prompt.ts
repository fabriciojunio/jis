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

  return `Prepare a minha candidatura completa para a vaga abaixo. Você já me conhece: se tiver memória deste projeto, leia as anotações sobre currículo, histórias de entrevista e posicionamento antes de começar.

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

## AS MINHAS HISTÓRIAS COM NÚMERO
Use estas, e não invente outras. Escolha as duas ou três que a vaga pede.

- **O simulador dos 331 processos.** Um fluxo de aprovação pulava a etapa do gestor por causa de uma comparação entre dois campos vazios, que dá verdadeiro. Antes de tocar no código, escrevi um simulador da regra como estava gravada e rodei contra 331 processos reais. Acertou 330. Só então mudei uma linha, sabendo quantos dos 77 processos afetados mudariam. Serve para: método, senso de dono, trabalhar em produção.
- **"Teste verde não é prova."** Vi correção passar em homologação pelo motivo errado, porque naquele ambiente o defeito nem acontecia. Serve para: maturidade técnica.
- **O contador desfeito pelo rollback.** Na Vitrine Bauru, o contador de senha errada e a revogação de sessão eram desfeitos pelo rollback da mesma exceção que os disparava: o bloqueio por tentativa existia no código e não na prática. Resolvido com REQUIRES_NEW, e quem achou foi um teste de integração. Serve para: entrevista técnica sobre transação.
- **A integração do IBGE, 80%.** Preenchimento automático de cidade e estado em abertura de conta digital bancária, com 80% menos tempo de cadastro. Serve para: resultado de negócio e vaga do setor financeiro.
- **Meta batida três meses seguidos** em cobrança, meio período, enquanto estudava. Serve para: cultura de resultado. Não use em contexto puramente técnico.

**Um ângulo que costuma ficar escondido:** eu sou do setor financeiro desde o primeiro dia. Comecei em abertura de conta digital bancária e hoje atendo seguros, financeiro e cooperativas de crédito. Se a vaga for de banco, corretora, seguradora ou fintech, **isso abre o texto**, e não a lista de tecnologias.

## O QUE EU PRECISO DE VOLTA

**1. Vale a pena?** Diga com franqueza, antes de tudo. Compare o que a vaga exige com o que eu tenho, e aponte o que eu não tenho. Se não valer, diga que não vale e por quê.

**2. Currículo sob medida**, gerado em PDF e salvo em \`C:/Users/junio/Documents/Curriculos/\`. Regras que o leitor automático impõe, e que já me custaram erro: coluna única, sem tabela de layout, data curta no formato "ago 2026 - atual" (por extenso não é extraída), nome da empresa sozinho na linha com o cargo abaixo, contato no corpo e nunca em cabeçalho de página, nada de texto dentro de imagem. Confira no fim que cada palavra-chave da vaga aparece no texto extraível. **Palavra que eu não tenho não entra**: trate a lacuna no campo de texto aberto, admitindo antes de perguntarem.

**3. As respostas do formulário**, campo a campo, prontas para colar. **Meça os caracteres** de cada uma e me diga o número: campo de vaga costuma cortar em 250, 750 ou 2000, e texto cortado no meio queima a candidatura.

**4. A mensagem de contato**, em três versões: para o campo do formulário, para e-mail e para o LinkedIn, esta última medida em 300 caracteres se for nota de convite.

**5. Onde essa empresa recebe candidatura.** Site, página de carreiras e e-mail, **conferidos com navegador**, e não chutados. Metade dos endereços que aparecem em busca está fora do ar.

**6. Pesquise a empresa**: o que ela faz, o que diz valorizar, e onde exatamente eu encaixo. Se ela usa palavras próprias no site, use as palavras dela.

## AS REGRAS
- **Não invente nada.** Só o que está no meu perfil e nas histórias acima.
- **Sem travessão** e com acentuação correta em tudo.
- Fato com número no lugar de adjetivo. "330 acertos em 331" faz o trabalho que "proativo" não faz.
- Se a vaga for full stack, o currículo é full stack; se for back-end, é back-end. **Mas nunca mude o meu LinkedIn**: o perfil é back-end Java, e isso é posicionamento permanente.
- Me avise para perguntar a faixa salarial cedo se a vaga for de júnior, porque eu já entrego em produção e falo com cliente.`;
}
