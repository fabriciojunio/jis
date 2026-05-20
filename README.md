# JIS — Sistema de Inteligência de Vagas

> Sistema inteligente de coleta e análise de vagas com Machine Learning integrado.
> Encontra, pontua e notifica as melhores oportunidades todos os dias às 19h via Telegram.

---

## Demonstração

```
🤖 JIS — Vagas do Dia (19:00)
📊 132 vagas analisadas · 18 qualificadas

━━━━━━━━━━━━━━━━━━━━━━━━
🥇 Score 9.2 | 87% chance de retorno

Backend Java Jr — Nubank
💰 R$ 5.000 – 7.000 · 🌍 Remoto
🔧 Java · Spring Boot · PostgreSQL
🔗 Ver vaga
━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Arquitetura

```
┌─────────────────────────────────────────┐
│           COLETA DE VAGAS               │
│   Gupy · GeekHunter · Programathor      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         PROCESSAMENTO DE DADOS          │
│   Limpeza · Extração · Deduplicação     │
└──────────┬──────────────────┬───────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼──────────┐
│  MOTOR DE SCORE │  │   SERVIÇO DE ML   │
│  Regras + Pesos │  │  RandomForest     │
└──────────┬──────┘  └────────┬──────────┘
           │                  │
┌──────────▼──────────────────▼───────────┐
│           BACKEND (Spring Boot)         │
│         API REST + Agendador            │
└──────────┬──────────────────┬───────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼──────────┐
│  TELEGRAM BOT   │  │    DASHBOARD      │
│  Notificações   │  │   Next.js 15      │
└─────────────────┘  └───────────────────┘
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Java 21 · Spring Boot 3.2 |
| Serviço de ML | Python 3.11 · FastAPI |
| Banco de dados | PostgreSQL 16 (Supabase) |
| Cache | Redis (Upstash) |
| Frontend | Next.js 15 · TypeScript · Tailwind |
| Infraestrutura | Docker · GitHub Actions |
| Notificação | Telegram Bot |

---

## Padrões de Projeto Utilizados

- **Strategy** — cada fonte de vagas é uma estratégia de coleta intercambiável
- **Observer** — ao salvar uma vaga, o score é calculado automaticamente via eventos
- **Factory** — `ScraperFactory` decide qual coletor instanciar por nome
- **Repository** — separação total entre lógica de negócio e acesso ao banco

---

## Estrutura do Projeto

```
jis/
├── backend/
│   └── src/main/java/com/jis/
│       ├── agendador/       # Pipeline diário às 19h
│       ├── coletor/         # Scrapers (Strategy + Factory)
│       ├── configuracao/    # Beans Spring
│       ├── controlador/     # Endpoints REST
│       ├── excecao/         # Tratamento de erros global
│       ├── modelo/          # Entidades JPA
│       ├── pontuacao/       # Motor de score
│       ├── repositorio/     # Acesso ao banco (Repository Pattern)
│       ├── servico/         # Regras de negócio
│       └── transferencia/   # DTOs
│
├── ml-service/
│   ├── scoring/motor.py     # Motor de regras Python
│   ├── ml/preditor.py       # RandomForestClassifier
│   └── tests/testes.py      # 28 testes pytest
│
├── frontend/                # Dashboard Next.js
├── .github/workflows/       # CI/CD GitHub Actions
├── docker-compose.yml
└── .env.example
```

---

## Como Rodar Localmente

### Pré-requisitos

- Java 21+
- Python 3.11+
- Docker e Docker Compose
- Conta no [Supabase](https://supabase.com) (gratuito)
- Bot no Telegram (ver configuração abaixo)

### 1. Clonar o repositório

```bash
git clone https://github.com/fabriciojunio/jis
cd jis
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Subir com Docker Compose

```bash
docker-compose up -d
```

### 4. Acessar

| Serviço | Endereço |
|---------|----------|
| API Backend | http://localhost:8080 |
| Documentação Swagger | http://localhost:8080/swagger-ui.html |
| Serviço de ML | http://localhost:8000 |
| Dashboard | http://localhost:3000 |

---

## Configurar Telegram

1. Abrir [@BotFather](https://t.me/BotFather) no Telegram
2. Enviar `/newbot` e seguir as instruções
3. Copiar o token gerado para `TELEGRAM_BOT_TOKEN` no `.env`
4. Enviar qualquer mensagem para o seu bot
5. Acessar `https://api.telegram.org/bot{SEU_TOKEN}/getUpdates`
6. Copiar o `chat_id` da resposta para `TELEGRAM_CHAT_ID` no `.env`

---

## Rodando os Testes

### Backend Java

```bash
cd backend
./mvnw test
```

### Serviço de ML Python

```bash
cd ml-service
pip install -r requirements.txt
python -m pytest tests/testes.py -v
```

Resultado esperado: **28 testes passando**

---

## Deploy Gratuito

| Serviço | Plataforma | Plano |
|---------|-----------|-------|
| Frontend | Vercel | Gratuito |
| Backend Java | Render | Gratuito (750h/mês) |
| Serviço ML | Render | Gratuito (segundo serviço) |
| Banco de dados | Supabase | Gratuito |
| Cache Redis | Upstash | Gratuito |

---

## CI/CD

O pipeline `pipeline.yml` executa automaticamente a cada push:

1. Testes Java (JUnit 5 + Mockito)
2. Testes Python (pytest + cobertura)
3. Build das imagens Docker
4. Deploy no Render e Vercel (apenas na branch `main`)

---

## Motor de Pontuação

Cada vaga recebe uma pontuação baseada em critérios calibrados para o perfil:

| Critério | Pontos |
|----------|--------|
| Java / Spring Boot | +3 cada |
| Python / FastAPI | +3 / +2 |
| React / Node.js | +2 cada |
| Machine Learning / NLP | +2 cada |
| Trabalho remoto | +3 |
| Trabalho híbrido | +1 |
| Salário informado | +2 |
| Vaga publicada há menos de 24h | +2 |
| .NET / C# | -3 cada |
| Presencial fora de Bauru | -3 |
| Vaga sênior obrigatória | -3 |
| Vaga com mais de 30 dias | -1 |

**Pontuação final = regras (50%) + ML (30%) + empresa (20%)**

---

## Métricas Acompanhadas

- Vagas coletadas por dia
- Taxa de callback (candidaturas com retorno / total)
- Estágio de cada candidatura (triagem → RH → técnica → oferta)
- Evolução do modelo de ML ao longo do tempo

---

## Autor

**Fabrício Júnio**
[linkedin.com/in/fabriciojunio](https://linkedin.com/in/fabriciojunio) · [github.com/fabriciojunio](https://github.com/fabriciojunio)
