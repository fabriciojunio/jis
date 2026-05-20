# Contribuindo com o JIS

## Pré-requisitos
- Java 21+
- Python 3.11+
- Node.js 20+
- Docker e Docker Compose
- PostgreSQL 15+

## Setup Local

```bash
# 1. Subir infraestrutura
docker compose up -d db

# 2. Backend
cd backend && mvn spring-boot:run

# 3. ML Service
cd ml-service && pip install -r requirements.txt && uvicorn main:app --port 8001

# 4. Frontend
cd frontend && npm install && npm run dev
```

## Padrão de Commits

```
feat(backend): adicionar scraper para LinkedIn
fix(ml): corrigir vazamento de dados no cross-validation
perf(db): adicionar índice na coluna score
docs: atualizar diagrama de arquitetura
```
