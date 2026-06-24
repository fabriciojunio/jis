# JIS: Job Intelligence System

Agregador de vagas que coleta oportunidades reais de várias plataformas, pontua cada uma pela compatibilidade com o seu perfil e foca no que interessa: **vagas em Bauru ou remotas** dentro da sua stack. Para cada vaga, gera um **currículo sob medida com a Claude**, direto na tela.

## O que faz

- Coleta vagas reais de **8 fontes** (sem necessidade de API key):
  - **LinkedIn** (API guest pública) — Bauru, remoto no Brasil e internacional
  - **Remotive, RemoteOK, Jobicy, Himalayas, Arbeitnow, The Muse** — remoto internacional
  - **WeWorkRemotely** — feed RSS de vagas remotas
- Mostra **só vagas com chance real de contratação** e estima a **Chance (0–100)** de cada uma, com base em evidências de recrutamento:
  - **Match de stack**: estudos mostram que cobrir ~50–60% dos requisitos já iguala a taxa de entrevista de quem cobre 90%+, e que alinhar o currículo às palavras-chave da vaga multiplica os callbacks. → exige aderência mínima de stack.
  - **Recência**: vagas antigas (>30 dias) são provavelmente "ghost jobs" (20–35% das vagas) e aplicar cedo rende mais. → descarta vagas velhas, prioriza recentes.
  - **Senioridade**: aplicar acima do nível tem retorno baixíssimo. → filtra sênior/lead/gestão e "X+ anos".
  - **Região**: vaga remota restrita a outro país não contrata quem está no Brasil. → mantém só Brasil/LATAM/Worldwide; descarta US-only, Europe-only, etc.
  - **Regra de ouro do perfil**: remoto OU Bauru. Cada card mostra os motivos do match e o selo de Chance (Alta/Média).
- **Gera currículo específico para a vaga** usando a Claude: o botão "Gerar currículo" monta um prompt com todos os dados da vaga + o seu perfil e devolve o currículo pronto. Sem chave configurada, o sistema avisa que está sem token e entrega o prompt para você gerar manualmente.
- **Acompanha candidaturas** (funil de seleção) e **métricas** (taxa de callback), salvos localmente no navegador.

## Stack

- **Next.js 15** + React 19 + TypeScript + Tailwind
- **SDK da Anthropic** (`@anthropic-ai/sdk`) para gerar currículos
- **Vitest** para os testes
- Sem banco de dados: as candidaturas ficam no `localStorage`; as vagas vêm das fontes em tempo real com cache (ISR de 30 min)

## Como rodar localmente

```bash
cd frontend
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Para gerar currículos com a Claude dentro do sistema, crie `frontend/.env.local`:

```env
ANTHROPIC_API_KEY=sua_chave_aqui
# opcional
JIS_CV_MODEL=claude-opus-4-8
```

Sem a chave, tudo funciona — a geração de currículo mostra o aviso "sem token" e disponibiliza o prompt pronto para copiar.

## Testes

```bash
cd frontend
npm test
```

## Personalizar o perfil

Todo o seu perfil (skills com pesos, stack incompatível, níveis aceitos, cidades da região de Bauru, salário e projetos) vive em [frontend/src/lib/profile.ts](frontend/src/lib/profile.ts). Edite esse arquivo para reajustar o que conta como vaga boa — o scoring e as buscas se adaptam.

## Deploy (Vercel)

```bash
cd frontend
vercel
```

No painel da Vercel, em **Settings → Environment Variables**, adicione `ANTHROPIC_API_KEY` para habilitar a geração automática de currículos em produção.

## Licença

MIT
