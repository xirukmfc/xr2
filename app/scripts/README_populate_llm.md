# Заполнение LLM провайдеров

Скрипт `populate_llm_providers.py` автоматически заполняет базу данных популярными LLM провайдерами и их актуальными моделями.

## Включенные провайдеры

1. **OpenAI** - GPT-5, GPT-4.5, GPT-4o, GPT-4, GPT-3.5
2. **Anthropic** - Claude 4.5 Sonnet, Claude 4.1 Opus, Claude 4.1, Claude 4, Claude 3.5 Sonnet, Claude 3 Opus, Claude 2.1
3. **Google (DeepMind)** - Gemini 2.5, Gemini 2, Gemini 1.5 Pro, Gemini 1.5 Flash, PaLM 2
4. **xAI (Grok)** - Grok 4, Grok 4 Heavy, Grok 4 Fast, Grok 3, Grok 3 Reasoning
5. **DeepSeek** - DeepSeek-V3, DeepSeek-V2, DeepSeek-Coder-V2, DeepSeek-Coder-V1, DeepSeek-LLM

## Использование из командной строки

### Добавление новых провайдеров (пропуск существующих)
```bash
python -m app.scripts.populate_llm_providers
```

### Обновление существующих провайдеров
```bash
python -m app.scripts.populate_llm_providers --update
```

## Использование в коде

```python
from app.scripts.populate_llm_providers import populate_llm_providers

# Добавить только новые провайдеры
summary = populate_llm_providers()

# Обновить существующие провайдеры
summary = populate_llm_providers(update_existing=True)

# Использование с существующей сессией
from app.core.database import SyncSessionLocal

with SyncSessionLocal() as session:
    summary = populate_llm_providers(session=session, update_existing=True)
```

## Просмотр в админ-панели

После запуска скрипта провайдеры будут доступны по адресу:
http://localhost:8000/admin/llm-provider/list

## Обновление списка моделей

Чтобы добавить новые модели или провайдеры, отредактируйте функцию `get_popular_providers()` в файле `populate_llm_providers.py`.
