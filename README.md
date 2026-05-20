# JIS — Job Intelligence System 🤖

Sistema inteligente que coleta vagas de emprego de múltiplas plataformas, aplica Machine Learning para pontuar compatibilidade e envia as melhores oportunidades diariamente via Telegram.

## Arquitetura

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Gupy +     │───▶│ Spring Boot  │───▶│  FastAPI    │
│  GeekHunter │    │  Scraping    │    │  ML Score   │
└─────────────┘    └──────┬───────┘    └──────┬──────┘
                          │                    │
┌─────────────┐    ┌──────▼───────┐    ┌──────▼──────┐
│  Telegram   │◀───│  PostgreSQL  │◀───│  Random     │
│  Bot        │    │  + Dashboard │    │  Forest     │
└─────────────┘    └──────────────┘    └─────────────┘
```

## Componentes

### Backend (Spring Boot 3 + Java 21)
- Scraping de vagas: Gupy, GeekHunter, Programathor e Remotivo
- Motor de score com regras de negócio e pesos
- Agendador diário às 19h via `@Scheduled`
- API REST para o dashboard
- Integração com Telegram Bot API

### Serviço ML (FastAPI + scikit-learn)
- Modelo RandomForest treinado com histórico de candidaturas
- Feature engineering: keywords, localização, senioridade, salário
- Walk-Forward Validation para evitar data leakage
- Endpoint `POST /score` com resposta em < 50ms

### Frontend (Next.js 15)
- Dashboard com vagas do dia ordenadas por score
- Histórico de candidaturas com funil de seleção
- Métricas de acurácia do modelo ML
- Estatísticas: taxa de callback, vagas por plataforma

## Como Executar

```bash
# Docker (recomendado)
docker compose up -d

# Banco de dados
docker exec -it jis-db psql -U postgres -d jis
```

## Variáveis de Ambiente

Consulte `.env.example` para todas as variáveis necessárias.

## Licença

MIT
