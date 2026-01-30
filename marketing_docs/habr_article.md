# A/B тестирование в реальном времени: архитектура на FastAPI и PostgreSQL

Когда нам потребовалось добавить A/B тесты в production-систему для управления промптами, оказалось что готовых решений под наши требования нет. Пришлось строить с нуля. В этой статье разберу архитектуру, грабли и код.

## Задача

Есть SaaS-платформа, которая хранит AI-промпты и отдаёт их через API. Пользователи хотят понять какая версия промпта работает лучше. Нужно:

1. Распределять трафик 50/50 между двумя версиями
2. Связывать события конверсии с конкретными запросами
3. Считать статистическую значимость в реальном времени
4. Автоматически завершать тест при достижении нужного объёма данных

## Модель данных

Начнём со схемы БД. Используем PostgreSQL + SQLAlchemy 2.0 с async.

```python
from sqlalchemy import Column, String, UUID, TIMESTAMP, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime


class ABTest(Base):
    __tablename__ = "ab_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="SET NULL"))

    # Две версии для сравнения
    version_a_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id", ondelete="SET NULL"))
    version_b_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id", ondelete="SET NULL"))

    # Счётчики запросов
    total_requests = Column(Integer, nullable=False)  # Лимит запросов для теста
    version_a_requests = Column(Integer, default=0)   # Сколько уже отдали версию A
    version_b_requests = Column(Integer, default=0)   # Сколько уже отдали версию B

    # Связь с воронкой конверсии (опционально)
    funnel_config_id = Column(UUID(as_uuid=True), ForeignKey("custom_funnel_configurations.id"), nullable=True)

    # Статус: draft → running → completed/cancelled
    status = Column(String(50), default='draft')

    # Временные метки
    started_at = Column(TIMESTAMP(timezone=True))
    ended_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index('idx_ab_test_prompt', 'prompt_id', 'status'),
    )
```

**Важный момент**: храним `total_requests` — это лимит, после которого тест автоматически завершается. Без этого тесты будут висеть вечно.

## Модель событий

Для связывания конверсий с запросами нужна таблица событий:

```python
class PromptEvent(Base):
    __tablename__ = "prompt_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Ключевое поле — связывает событие с запросом
    trace_id = Column(String(100), nullable=False, index=True)

    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="SET NULL"))
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id", ondelete="SET NULL"))

    event_type = Column(String(50), nullable=False)  # prompt_request, custom_event, etc.
    event_metadata = Column(JSONB)  # Произвольные данные от клиента

    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index('idx_events_workspace_created', 'workspace_id', 'created_at'),
    )
```

`trace_id` — это клей между запросом промпта и последующими событиями. Клиент получает его в ответе на запрос промпта и передаёт обратно при отправке события конверсии.

## Генерация trace_id

```python
import time
import secrets


def generate_trace_id(slug: str) -> str:
    """
    Генерируем уникальный trace_id.
    Формат: evt_{slug}_{timestamp}_{random}
    """
    timestamp = str(int(time.time()))
    random_part = secrets.token_hex(4)  # 8 символов
    return f"evt_{slug}_{timestamp}_{random_part}"
```

Почему такой формат:
- `slug` — для debugging (сразу видно к какому промпту относится)
- `timestamp` — для сортировки и TTL
- `random_part` — для уникальности (secrets, не random — криптографически безопасный)

Пример: `evt_onboarding_1706534400_a1b2c3d4`

## Распределение трафика: random vs round-robin

Первая идея была использовать round-robin: чётные запросы → A, нечётные → B. Кажется логичным, да?

**Нет.** Round-robin создаёт проблемы:

1. **Selection bias при неравномерном трафике.** Если утром приходит один тип пользователей, а вечером другой — round-robin создаст корреляцию между временем и вариантом.

2. **Race conditions.** Два запроса одновременно читают счётчик = 100, оба решают что "чётный", оба получают версию A.

3. **Детерминированность.** Злоумышленник может предсказать какую версию получит, отправив тестовый запрос.

**Решение — случайное распределение:**

```python
import random


async def get_ab_test_version(session, prompt_id: UUID) -> Optional[dict]:
    """
    Определяем какую версию промпта отдать в рамках A/B теста.
    Возвращает None если нет активного теста.
    """
    # Находим активный тест для этого промпта
    result = await session.execute(
        select(ABTest)
        .where(
            ABTest.prompt_id == prompt_id,
            ABTest.status == 'running'
        )
    )
    ab_test = result.scalar_one_or_none()

    if not ab_test:
        return None

    # Проверяем не исчерпан ли лимит
    current_total = ab_test.version_a_requests + ab_test.version_b_requests
    if current_total >= ab_test.total_requests:
        # Автоматически завершаем тест
        ab_test.status = 'completed'
        ab_test.ended_at = datetime.utcnow()
        await session.commit()
        return None

    # Случайное распределение 50/50
    if random.random() < 0.5:
        ab_test.version_a_requests += 1
        version_id = ab_test.version_a_id
        variant = "A"
    else:
        ab_test.version_b_requests += 1
        version_id = ab_test.version_b_id
        variant = "B"

    await session.commit()

    return {
        "ab_test_id": str(ab_test.id),
        "ab_test_name": ab_test.name,
        "ab_test_variant": variant,
        "version_id": version_id
    }
```

Да, при малом количестве запросов распределение может быть не ровно 50/50 (например, 48/52). Но это **нормально** — статистические тесты учитывают неравномерность выборок.

## Проблема: race condition при инкременте

Код выше имеет баг. Два параллельных запроса:

1. Запрос 1 читает `version_a_requests = 100`
2. Запрос 2 читает `version_a_requests = 100`
3. Запрос 1 пишет `version_a_requests = 101`
4. Запрос 2 пишет `version_a_requests = 101`

Потеряли один инкремент.

**Решение 1 — атомарный UPDATE:**

```python
from sqlalchemy import update

# Вместо ab_test.version_a_requests += 1
await session.execute(
    update(ABTest)
    .where(ABTest.id == ab_test.id)
    .values(version_a_requests=ABTest.version_a_requests + 1)
)
```

**Решение 2 — SELECT FOR UPDATE:**

```python
result = await session.execute(
    select(ABTest)
    .where(ABTest.id == ab_test_id)
    .with_for_update()  # Блокируем строку
)
ab_test = result.scalar_one()
ab_test.version_a_requests += 1
await session.commit()
```

Мы используем первый вариант — он проще и не создаёт блокировок.

## Хранение контекста в Redis

Клиент получает trace_id и потом (через минуты, часы, дни) отправляет событие конверсии. Нам нужно знать к какой версии A/B теста относится это событие.

```python
import json
from datetime import datetime, timezone


async def store_trace_context(redis_client, trace_id: str, context: dict):
    """
    Сохраняем контекст запроса в Redis.
    TTL = 30 дней (достаточно для большинства воронок).
    """
    trace_context = {
        "prompt_id": str(context["prompt_id"]),
        "version_id": str(context["version_id"]),
        "ab_test_id": context.get("ab_test_id"),
        "ab_test_variant": context.get("ab_test_variant"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await redis_client.setex(
        f"trace:{trace_id}",
        30 * 24 * 60 * 60,  # 30 дней в секундах
        json.dumps(trace_context)
    )
```

Почему Redis, а не PostgreSQL:
- Быстрее для key-value lookup
- Встроенный TTL (не нужен cron для очистки)
- Не нагружаем основную БД

## Расчёт статистической значимости

Это самая интересная часть. Используем z-test для сравнения двух пропорций.

```python
import math
from typing import Dict, Any


def calculate_statistical_significance(
    conversions_a: int,
    total_a: int,
    conversions_b: int,
    total_b: int
) -> Dict[str, Any]:
    """
    Рассчитываем статистическую значимость различий между A и B.

    Используем z-test для сравнения двух пропорций.
    Возвращаем confidence level и p-value.
    """
    # Защита от деления на ноль
    if total_a == 0 or total_b == 0:
        return {
            "confidence": 0,
            "is_significant": False,
            "p_value": 1.0,
            "message": "Not enough data"
        }

    # Conversion rates
    rate_a = conversions_a / total_a
    rate_b = conversions_b / total_b

    # Pooled conversion rate (общая конверсия)
    pooled_rate = (conversions_a + conversions_b) / (total_a + total_b)

    # Крайние случаи
    if pooled_rate == 0 or pooled_rate == 1:
        return {
            "confidence": 0,
            "is_significant": False,
            "p_value": 1.0,
            "message": "Conversion rate is 0% or 100%"
        }

    # Standard error (стандартная ошибка разности пропорций)
    se = math.sqrt(pooled_rate * (1 - pooled_rate) * (1/total_a + 1/total_b))

    if se == 0:
        return {
            "confidence": 0,
            "is_significant": False,
            "p_value": 1.0,
            "message": "Standard error is zero"
        }

    # Z-score
    z_score = abs(rate_a - rate_b) / se

    # Проверка минимального размера выборки
    # Z-test требует нормального распределения, которое достигается при n >= 30
    # Или минимум 5 успехов И 5 неудач в каждой группе
    min_sample_size = 30
    min_successes = 5

    group_a_ok = (total_a >= min_sample_size) or \
                 (conversions_a >= min_successes and (total_a - conversions_a) >= min_successes)
    group_b_ok = (total_b >= min_sample_size) or \
                 (conversions_b >= min_successes and (total_b - conversions_b) >= min_successes)

    has_sufficient_sample = group_a_ok and group_b_ok

    # Преобразуем z-score в confidence level
    # 1.645 → 90%, 1.96 → 95%, 2.576 → 99%
    if z_score >= 2.576:
        base_confidence = 99
    elif z_score >= 1.96:
        base_confidence = 95
    elif z_score >= 1.645:
        base_confidence = 90
    elif z_score >= 1.28:
        base_confidence = 80
    else:
        base_confidence = min(int(z_score / 1.96 * 95), 79)

    # Для малых выборок снижаем confidence
    if not has_sufficient_sample:
        if base_confidence >= 95:
            confidence = max(85, base_confidence - 10)
        else:
            confidence = max(75, base_confidence - 5)
        message = f"Small sample size ({total_a}+{total_b}) - results may not be reliable"
    else:
        confidence = base_confidence
        message = "Statistically significant" if confidence >= 95 else "Need more data"

    # Значимость при z >= 1.96 (95% confidence)
    is_significant = z_score >= 1.96

    # P-value (упрощённая аппроксимация)
    p_value = 2 * (1 - min(0.5 + z_score * 0.2, 0.9999))

    return {
        "confidence": confidence,
        "is_significant": is_significant,
        "p_value": round(p_value, 4),
        "z_score": round(z_score, 3),
        "message": message
    }
```

**Почему z-test, а не t-test?**

Для больших выборок (n > 30) z-test и t-test дают практически одинаковые результаты. Z-test проще в реализации и не требует scipy.

**Почему не chi-square?**

Chi-square тоже подходит для сравнения пропорций. Математически эквивалентен z-test (χ² = z²). Мы выбрали z-test потому что он даёт z-score, который легче интерпретировать.

## Подсчёт конверсий по trace_id

Когда клиент отправляет событие конверсии, нужно найти к какому A/B тесту оно относится:

```python
async def get_ab_test_results(
    db: AsyncSession,
    ab_test: ABTest
) -> Dict[str, Any]:
    """
    Получаем результаты A/B теста.
    Находим все события, связанные с запросами этого теста через trace_id.
    """

    # Шаг 1: Находим все trace_id для каждой версии
    # Это запросы промптов во время теста
    trace_conditions_a = [
        PromptEvent.prompt_version_id == ab_test.version_a_id,
        PromptEvent.event_type == 'prompt_request'
    ]

    if ab_test.started_at:
        trace_conditions_a.append(PromptEvent.created_at >= ab_test.started_at)
    if ab_test.ended_at:
        trace_conditions_a.append(PromptEvent.created_at <= ab_test.ended_at)

    # Получаем уникальные trace_id для версии A
    trace_ids_a_result = await db.execute(
        select(PromptEvent.trace_id.distinct())
        .where(and_(*trace_conditions_a))
    )
    trace_ids_a = {row[0] for row in trace_ids_a_result}

    # Аналогично для версии B
    trace_conditions_b = [
        PromptEvent.prompt_version_id == ab_test.version_b_id,
        PromptEvent.event_type == 'prompt_request'
    ]
    # ... добавляем фильтры по датам ...

    trace_ids_b_result = await db.execute(
        select(PromptEvent.trace_id.distinct())
        .where(and_(*trace_conditions_b))
    )
    trace_ids_b = {row[0] for row in trace_ids_b_result}

    # Шаг 2: Находим конверсии по этим trace_id
    # Важно: события конверсии могут прийти ПОСЛЕ завершения теста
    # Поэтому не фильтруем по дате

    if trace_ids_a:
        events_a_result = await db.execute(
            select(
                PromptEvent.event_type,
                func.count(func.distinct(PromptEvent.trace_id)).label('count')
            )
            .where(PromptEvent.trace_id.in_(trace_ids_a))
            .group_by(PromptEvent.event_type)
        )
        events_a = {row.event_type: row.count for row in events_a_result}
    else:
        events_a = {}

    # Аналогично для версии B...

    return {
        "version_a_requests": ab_test.version_a_requests,
        "version_b_requests": ab_test.version_b_requests,
        "events_a": events_a,
        "events_b": events_b
    }
```

**Важный момент**: считаем уникальные trace_id, а не общее количество событий. Один пользователь может отправить несколько событий с одним trace_id — это одна конверсия, а не несколько.

## API Response

Вот как выглядит ответ на запрос промпта когда активен A/B тест:

```json
{
  "slug": "onboarding",
  "system_prompt": "You are a helpful assistant...",
  "user_prompt": "Help the user with: {issue}",
  "trace_id": "evt_onboarding_1706534400_a1b2c3d4",
  "ab_test_id": "550e8400-e29b-41d4-a716-446655440000",
  "ab_test_name": "Tone Experiment",
  "ab_test_variant": "A"
}
```

Клиент сохраняет `trace_id` и потом отправляет:

```json
POST /api/v1/events
{
  "trace_id": "evt_onboarding_1706534400_a1b2c3d4",
  "event_name": "user_signup",
  "category": "conversion"
}
```

## Грабли на которые наступили

### 1. Кэширование ломает A/B тест

Первая версия использовала Redis-кэш для промптов:

```python
# Плохо!
cached = await redis.get(f"prompt:{slug}")
if cached:
    return cached  # Все получают одну версию!
```

Решение — кэшировать версии отдельно:

```python
# Хорошо
version_id = await get_ab_test_version(...)  # Выбираем A или B
cached = await redis.get(f"prompt:{slug}:{version_id}")
```

### 2. События приходят после завершения теста

Пользователь получил промпт в понедельник, конвертировался в пятницу. Тест уже завершён. Событие нужно засчитать или нет?

Мы решили засчитывать. Логика: тест измеряет "какая версия приводит к конверсии", а не "какая версия приводит к быстрой конверсии". Поэтому фильтр по дате применяем только к `prompt_request` событиям, но не к событиям конверсии.

### 3. Слишком ранняя остановка теста

"У нас 50 запросов, версия B на 30% лучше — победа!"

Нет. При 50 запросах разница в 30% может быть случайной. Калькулятор размера выборки:

| Ожидаемая разница | Нужно запросов (на вариант) |
|-------------------|----------------------------|
| 50% improvement   | ~100                       |
| 20% improvement   | ~400                       |
| 10% improvement   | ~1,600                     |
| 5% improvement    | ~6,400                     |

Правило: если ожидаете небольшую разницу — нужно много данных. Лучше тестировать радикальные изменения (разный тон, структура) где разница будет заметной.

### 4. Множественные A/B тесты на одном промпте

Что если запущено два теста на одном промпте? Первый выигрывает — запрос попадает в него. Но это создаёт взаимозависимость тестов.

Решение: разрешаем только один активный тест на промпт:

```python
existing_test = await session.execute(
    select(ABTest).where(
        ABTest.prompt_id == prompt_id,
        ABTest.status == 'running'
    )
)
if existing_test.scalar_one_or_none():
    raise HTTPException(400, "Another A/B test is already running for this prompt")
```

## Мониторинг

Добавили Prometheus метрики:

```python
from prometheus_client import Counter, Histogram

ab_test_requests = Counter(
    'ab_test_requests_total',
    'Total A/B test requests',
    ['test_id', 'variant']
)

ab_test_conversions = Counter(
    'ab_test_conversions_total',
    'Total A/B test conversions',
    ['test_id', 'variant', 'event_type']
)
```

Grafana дашборд показывает:
- Распределение трафика (должно быть ~50/50)
- Конверсии по вариантам в реальном времени
- Статистическую значимость

## Итого

Архитектура:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  FastAPI    │────▶│ PostgreSQL  │
│             │     │             │     │  (ABTest,   │
│             │     │             │     │   Events)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │ (trace_id   │
                    │   context)  │
                    └─────────────┘
```

Ключевые решения:
1. **Random 50/50** вместо round-robin — избегаем selection bias
2. **trace_id** связывает запрос с конверсией — работает даже если конверсия приходит через дни
3. **Z-test** для статистической значимости — простой и достаточный для большинства случаев
4. **Redis для контекста** — быстрый lookup, встроенный TTL
5. **Атомарные UPDATE** — избегаем race conditions при инкременте счётчиков

Код работает в production, обрабатывает тысячи запросов. Это часть платформы [xR2](https://xr2.uk) для управления AI-промптами.

---

*Вопросы? Буду рад ответить в комментариях.*

**Теги:** python, fastapi, postgresql, a/b-testing, architecture, statistics
