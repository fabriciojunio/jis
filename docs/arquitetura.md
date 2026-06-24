# Arquitetura do JIS

## Visão geral

Aplicação Next.js única (Node/TypeScript). Não há backend separado, banco de dados nem serviço de ML: coleta, pontuação e geração de currículo rodam na própria aplicação.

## Fluxo de dados

1. **Coleta** — `lib/sources/*` busca vagas das 8 fontes em paralelo (tolerante a falhas; uma fonte fora do ar não derruba as outras).
2. **Filtro e pontuação** — `lib/jobs.ts` mantém apenas vagas elegíveis (remoto ou Bauru), aplica o motor de score (`lib/scoring.ts`) baseado no perfil (`lib/profile.ts`), deduplica e ordena.
3. **Cache** — as fontes têm cache de 1h; as páginas e a rota `/api/jobs` usam ISR de 30 min.
4. **UI** — dashboard, lista de vagas, candidaturas e métricas. Candidaturas e métricas são persistidas no `localStorage`.
5. **Currículo** — a rota `/api/cv` monta o prompt da vaga + perfil e chama a Claude (`@anthropic-ai/sdk`). Sem `ANTHROPIC_API_KEY`, devolve o aviso "sem token" e o prompt pronto.

## Fontes de vagas

| Fonte | Cobertura | Formato |
|-------|-----------|---------|
| LinkedIn (guest) | Bauru, remoto BR e internacional | HTML (parser próprio) |
| Remotive, RemoteOK, Jobicy, Himalayas, Arbeitnow, The Muse | Remoto internacional | JSON |
| WeWorkRemotely | Remoto (programação) | RSS/XML |

## Motor de pontuação

Soma ponderada de: techs do perfil (positivo) e incompatíveis (negativo), nível de senioridade, modo de trabalho (remoto/Bauru sobem; presencial fora da região afunda), salário e recência. O resultado bruto é normalizado para 0–100. A regra de ouro: **a vaga só é elegível se for remota OU em Bauru/região**.

## Personalização

Tudo que define "vaga boa" está em `lib/profile.ts`: pesos das tecnologias, stack incompatível, níveis aceitos, cidades da região de Bauru, faixa salarial, projetos e termos de busca enviados às fontes.

## Estrutura

```
frontend/src/
  app/            páginas (dashboard, vagas, candidaturas, métricas) + rotas /api/jobs e /api/cv
  components/     JobCard, CvPanel, ScoreBar, Navbar
  lib/
    profile.ts    perfil do candidato (parâmetros centrais)
    scoring.ts    motor de pontuação + elegibilidade
    jobs.ts       agregação, filtro, dedupe, ordenação
    cv-prompt.ts  montagem do prompt de currículo
    applications.ts  candidaturas em localStorage
    sources/      uma fonte por arquivo + agregador
```
