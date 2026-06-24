# Changelog

## [2.0.0] - 2026-06-23

### Mudou

- Arquitetura unificada em Node/Next.js. O backend Spring Boot e o serviço de ML em Python foram removidos: a coleta, a pontuação e a geração de currículo agora rodam dentro da própria aplicação Next.js, sem necessidade de Java, Docker ou banco de dados.

### Adicionado

- Coleta de vagas reais de 8 fontes sem API key: LinkedIn (guest), Remotive, RemoteOK, Jobicy, Himalayas, Arbeitnow, The Muse e WeWorkRemotely.
- Motor de pontuação em TypeScript baseado no perfil, com a regra remoto OU Bauru.
- Geração de currículo sob medida para cada vaga usando a Claude, com aviso de "sem token" e prompt pronto quando a chave não está configurada.
- Acompanhamento de candidaturas e métricas via localStorage.
- Testes com Vitest cobrindo scoring e os parsers das fontes.

### Removido

- backend Spring Boot, serviço FastAPI de ML, docker-compose e blueprint do Render (substituídos pela aplicação Next.js única, com deploy na Vercel).

## [1.0.0] - 2026-05-19

### Adicionado
- Scraping de vagas: Gupy, GeekHunter, Programathor e Remotivo
- Motor de score híbrido: regras + RandomForest
- Notificação diária às 19h via Telegram Bot
- Dashboard Next.js com histórico e métricas
- Serviço ML FastAPI com Walk-Forward Validation
- Docker Compose com todos os serviços
- GitHub Actions CI/CD
