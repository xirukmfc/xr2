# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## КРИТИЧЕСКИЕ ПРАВИЛА БЕЗОПАСНОСТИ

- **НИКОГДА** не удалять и не изменять данные в базе данных без явного письменного разрешения
- **НИКОГДА** не выполнять деструктивные SQL команды (DROP, DELETE, TRUNCATE) без подтверждения
- **НИКОГДА** не переписывать существующий код целиком — только редактирование с согласования

## Production окружение

- Инструкция по подключению к production серверу: @PRODUCTION_SERVER.md
- Production содержит реальные данные пользователей — относиться максимально внимательно
- Все изменения для прода ДОЛЖНЫ проходить через git с описательными коммитами
- Не выполнять команды напрямую на production сервере без крайней необходимости
- Перед деплоем убедиться, что изменения протестированы локально
- **КРИТИЧНО: На production сервере ВСЕГДА использовать `docker compose -f docker-compose.prod.yml --env-file .env.prod`**
- **НИКОГДА** не запускать `docker compose up` без `-f docker-compose.prod.yml` на проде — это запустит dev-конфиг с другими volumes и потеряет данные
- Сервер ДОЛЖЕН быть на ветке `master`. Перед деплоем проверять `git branch`

## Работа с кодом

- При изменении кода — редактировать существующий, а не переписывать с нуля
- Обсуждать значительные изменения архитектуры перед реализацией
- Сохранять существующий стиль кода в проекте

## Работа с миграциями (Alembic)

- Всегда создавать обратимые миграции с функцией downgrade
- Тестировать миграции локально перед применением на прод
- Не удалять и не модифицировать существующие миграции

---

## Development Commands

### Local Development (Full Stack)

```bash
./start.sh                    # Start all local services
make up-local                 # Start backend only (no frontend/nginx)
make down                     # Stop all services
```

### Backend (FastAPI)

```bash
# Run dev server directly (without Docker)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Run tests
make test-local               # Run autotests locally
```

### Frontend (Next.js — prompt-editor/)

```bash
cd prompt-editor
npm run dev                   # Dev server on :3000
npm run build                 # Production build
npm run lint                  # ESLint
```

### Useful Makefile Commands

```bash
make logs-app                 # Backend logs
make logs-frontend            # Frontend logs
make db-shell                 # PostgreSQL CLI
make db-backup                # Backup database
make health                   # Health check all services
make rebuild-frontend-fast    # Fast frontend rebuild (BuildKit)
```

### Deploy to Production

```bash
make deploy                   # Deploy (without nginx container)
make deploy-fast              # Fast deploy with BuildKit
```

---

## Architecture Overview

xR2 is a SaaS platform for prompt management, A/B testing, and LLM analytics. Deployed at **xr2.uk** (EN) and **xr2.site** (RU).

### Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11), SQLAlchemy async, Alembic |
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Database | PostgreSQL 15 |
| Cache | Redis 7 (rate limiting, caching) |
| Task Queue | Celery (statistics aggregation) |
| Proxy | Nginx |
| Monitoring | Prometheus + Grafana |

### Backend (`app/`)

Layered: **API routes → Services → Models**

- `app/api/` — Route handlers. Key files: `llm.py` (LLM providers), `ab_tests_simple.py` (A/B testing), `analytics.py`, `public_api.py` (SDK-facing)
- `app/services/` — Business logic. Key: `subscription.py` (billing), `analytics.py` (metrics), `scheduler.py` (Celery)
- `app/models/` — SQLAlchemy ORM models
- `app/core/` — Config, DB session, JWT auth, API key validation
- `app/middleware/` — Rate limiting (Redis), security headers, request logging, Swagger auth
- `app/admin/` — SQLAdmin interface (at `/admin`, user `www`)
- `main.py` — Entry point: middleware stack, router registration, lifespan events

### Frontend (`prompt-editor/`)

- `app/[lang]/` — i18n routing (en/ru). Landing page is SSG (`app/[lang]/page.tsx`)
- `middleware.ts` — Bot detection, language routing by domain (xr2.uk → en, xr2.site → ru)
- `lib/api.ts` — All API calls to backend (30KB)
- `components/` — UI components. Key: `left-panel.tsx`, `center-panel.tsx`, `full-screen-editor.tsx`, `model-picker.tsx`
- Uses Monaco Editor for prompt editing, Recharts for analytics dashboards, Radix UI for primitives

### Docker Environments

- `docker-compose.yml` — Dev (volumes: `postgres_data`, `redis_data`)
- `docker-compose.prod.yml` — Prod (volumes: `postgres_data_prod`, `redis_data_prod`, containers named `*_prod`)

The `postgres_data` vs `postgres_data_prod` volume distinction is why bare `docker compose up` on prod connects to an empty database.

### LLM Integration

`app/api/llm.py` supports multiple providers: OpenAI, Anthropic, Google Gemini, DeepSeek. Provider selection, model routing, and token counting happen here. Frontend tokenizer lives in `prompt-editor/lib/deepseek_v3_tokenizer/` and `tokens.client.ts`.

### Public API / SDKs

`app/api/public_api.py` exposes the customer-facing API. SDKs in `sdk/` (Python, Node.js, Make, n8n, Zapier).
