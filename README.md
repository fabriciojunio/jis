# JIS: Job Intelligence System 🤖

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

## Como rodar localmente

### Pré-requisitos

- **Docker** e **Docker Compose**
- **Telegram Bot Token**: crie um bot via [@BotFather](https://t.me/BotFather) no Telegram

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/fabriciojunio/JIS.git
cd JIS

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais (veja a seção abaixo)

# 3. Suba todos os serviços
docker compose up -d
```

Após iniciar, acesse:
- **Dashboard:** [http://localhost:3000](http://localhost:3000)
- **API Spring Boot:** [http://localhost:8080](http://localhost:8080)
- **API ML (Swagger):** [http://localhost:8001/docs](http://localhost:8001/docs)
- **Banco de dados:** `docker exec -it jis-db psql -U postgres -d jis`

## Variáveis de Ambiente

Edite `.env` com suas credenciais:

```env
# Banco de dados PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/jis
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=senha_segura

# Telegram — crie um bot em https://t.me/BotFather
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# Serviço ML (FastAPI)
ML_SERVICE_URL=http://localhost:8001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Licença

MIT
