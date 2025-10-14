# Инструкция по настройке базы данных для деплоя

## Шаги инициализации при деплое

### 1. Запустить миграции базы данных
```bash
alembic upgrade head
```

### 2. Инициализировать LLM провайдеры
```bash
python scripts/init_db.py
```

### 3. (Опционально) Обновить существующие провайдеры
```bash
python scripts/init_db.py --update
```

## Альтернативный вариант

Если структура проекта требует, используйте напрямую:
```bash
python -m app.scripts.populate_llm_providers --update
```

## В Docker

Добавьте в `docker-entrypoint.sh` или `docker-compose.yml`:
```bash
#!/bin/bash
set -e

# Wait for database
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "Waiting for database..."
  sleep 1
done

# Run migrations
alembic upgrade head

# Initialize default data
python scripts/init_db.py

# Start application
exec "$@"
```

## В CI/CD

Пример для GitHub Actions:
```yaml
- name: Run database migrations
  run: alembic upgrade head

- name: Initialize database
  run: python scripts/init_db.py
```

## Что будет создано

После выполнения скрипта в базе данных будут доступны следующие LLM провайдеры:

1. **OpenAI** - GPT-5, GPT-4.5, GPT-4o, GPT-4, GPT-3.5
2. **Anthropic** - Claude 4.5 Sonnet, Claude 4.1 Opus, Claude 4.1, Claude 4, Claude 3.5 Sonnet, Claude 3 Opus, Claude 2.1
3. **Google (DeepMind)** - Gemini 2.5, Gemini 2, Gemini 1.5 Pro, Gemini 1.5 Flash, PaLM 2
4. **xAI (Grok)** - Grok 4, Grok 4 Heavy, Grok 4 Fast, Grok 3, Grok 3 Reasoning
5. **DeepSeek** - DeepSeek-V3, DeepSeek-V2, DeepSeek-Coder-V2, DeepSeek-Coder-V1, DeepSeek-LLM
