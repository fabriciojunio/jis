# Arquitetura do JIS

## Visão Geral

O JIS é composto por 3 serviços independentes que se comunicam via HTTP REST.

## Fluxo de Dados

1. **Coleta** (diária, às 18h30): O backend Spring Boot executa scrapers para cada plataforma
2. **Scoring** (após coleta): Cada vaga é enviada ao serviço ML para receber uma pontuação 0-100
3. **Notificação** (diária, às 19h): As top 10 vagas são enviadas via Telegram Bot
4. **Dashboard**: Frontend exibe vagas, candidaturas e métricas em tempo real

## Backend Spring Boot

### Padrões Utilizados
- **Strategy Pattern**: Cada scraper implementa `ScraperStrategy`
- **Factory Pattern**: `ScraperFactory` instancia o scraper correto por plataforma
- **Repository Pattern**: Acesso ao banco via Spring Data JPA
- **Service Layer**: Lógica de negócio isolada dos controllers

### Endpoints Principais
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/v1/jobs/top | Top vagas por score |
| POST | /api/v1/jobs/collect | Disparar coleta manual |
| GET | /api/v1/metrics/today | Métricas do dia |
| POST | /api/v1/applications/job/{id} | Registrar candidatura |

## Serviço ML (FastAPI)

### Features Utilizadas
- Presença de keywords de tech stack (TypeScript, React, Java, etc.)
- Nível de senioridade detectado no título
- Regime de trabalho (remoto, híbrido, presencial)
- Faixa salarial (quando disponível)
- Score de compatibilidade das skills

### Modelo
- **Algoritmo**: Random Forest Classifier
- **Validação**: Walk-Forward com TimeSeriesSplit
- **Atualização**: Re-treina mensalmente com novos dados de candidaturas
