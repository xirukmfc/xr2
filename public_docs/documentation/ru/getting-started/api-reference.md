# Справочник API

Базовый URL: `https://xr2.uk/api/v1`

**Интерактивная документация:** [https://xr2.uk/docs](https://xr2.uk/docs) — Swagger UI для тестирования API прямо в браузере.

Все запросы требуют аутентификации через Bearer-токен. См. [Аутентификация](authentication.md).

## Эндпоинты

| Эндпоинт | Метод | Описание |
|----------|-------|----------|
| `/check-api-key` | GET | Проверка API-ключа |
| `/get-prompt` | POST | Получение промпта по slug |
| `/events` | POST | Отслеживание аналитического события |

---

## Проверка API-ключа

Проверка вашего API-ключа и получение связанного имени пользователя.

```http
GET /api/v1/check-api-key
```

**Заголовки:**

| Заголовок | Значение |
|-----------|----------|
| Authorization | `Bearer xr2_prod_xxx` |

**Ответ (200 OK):**

```json
{
  "ok": true,
  "user": "your_username"
}
```

**Ошибки:**
- `401` — Недействительный или отсутствующий API-ключ

---

## Получение промпта

Получение промпта по его slug-идентификатору.

```http
POST /api/v1/get-prompt
```

**Заголовки:**

| Заголовок | Значение |
|-----------|----------|
| Authorization | `Bearer xr2_prod_xxx` |
| Content-Type | `application/json` |

**Тело запроса:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `slug` | string | Да | Уникальный идентификатор промпта |
| `source_name` | string | Да | Идентификатор источника (например, `web_app`, `mobile_app`) |
| `version_number` | integer | Нет | Конкретная версия (не указывайте для получения последней продакшн-версии) |
| `status` | string | Нет | Фильтр по статусу: `draft`, `testing`, `production`, `inactive`, `deprecated` |

**Пример запроса:**

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "customer-support",
    "source_name": "web_app"
  }'
```

**Ответ (200 OK):**

```json
{
  "slug": "customer-support",
  "source_name": "web_app",
  "version_number": 2,
  "status": "production",
  "system_prompt": "You are a helpful customer support assistant.",
  "user_prompt": "Customer: {{customer_name}}\nQuestion: {{question}}",
  "assistant_prompt": null,
  "variables": [
    {
      "name": "customer_name",
      "type": "string",
      "defaultValue": ""
    },
    {
      "name": "question",
      "type": "string",
      "defaultValue": ""
    }
  ],
  "deployed_at": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "trace_id": "evt_abc123_1634567890_xyz",
  "ab_test_id": null,
  "ab_test_name": null,
  "ab_test_variant": null
}
```

**Поля ответа:**

| Поле | Тип | Описание |
|------|-----|----------|
| `slug` | string | Идентификатор промпта |
| `source_name` | string | Источник из запроса |
| `version_number` | integer | Номер версии |
| `status` | string | Статус версии |
| `system_prompt` | string | Содержимое системного промпта |
| `user_prompt` | string | Шаблон пользовательского промпта |
| `assistant_prompt` | string | Промпт ассистента (опционально) |
| `variables` | array | Определения переменных |
| `deployed_at` | datetime | Время деплоя в продакшн |
| `created_at` | datetime | Временная метка создания |
| `updated_at` | datetime | Временная метка последнего обновления |
| `trace_id` | string | **Сохраните это значение!** Используется для отслеживания событий |
| `ab_test_id` | string | ID A/B-теста (если тест запущен) |
| `ab_test_name` | string | Название A/B-теста (если тест запущен) |
| `ab_test_variant` | string | Какой вариант: `version_a` или `version_b` |

**Важно:** Сохраните `trace_id` из ответа. Он необходим для отслеживания событий, связанных с этим запросом промпта.

**Ошибки:**
- `400` — Недопустимое значение статуса
- `401` — Недействительный или отсутствующий API-ключ
- `404` — Промпт не найден или отсутствует продакшн-версия
- `429` — Превышен лимит запросов

---

## Отслеживание события

Запись аналитического события, связанного с запросом промпта.

```http
POST /api/v1/events
```

**Заголовки:**

| Заголовок | Значение |
|-----------|----------|
| Authorization | `Bearer xr2_prod_xxx` |
| Content-Type | `application/json` |

**Тело запроса:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `trace_id` | string | Да | Trace ID из ответа get-prompt |
| `event_name` | string | Да | Название события (должно быть определено в панели управления) |
| `source_name` | string | Да | Идентификатор источника |
| `user_id` | string | Нет | Идентификатор пользователя |
| `session_id` | string | Нет | Идентификатор сессии |
| `value` | number | Нет | Числовое значение (для отслеживания выручки) |
| `currency` | string | Нет | Код валюты (USD, EUR и т.д.) |
| `metadata` | object | Нет | Пользовательские поля (должны соответствовать определению события) |

**Пример запроса:**

```bash
curl -X POST https://xr2.uk/api/v1/events \
  -H "Authorization: Bearer xr2_prod_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "evt_abc123_1634567890_xyz",
    "event_name": "purchase_completed",
    "source_name": "web_app",
    "user_id": "user_123",
    "value": 99.99,
    "currency": "USD",
    "metadata": {
      "order_id": "order_789"
    }
  }'
```

**Ответ (200 OK):**

```json
{
  "status": "success",
  "event_id": "evt_def456_1634567899_abc",
  "trace_id": "evt_abc123_1634567890_xyz",
  "event_name": "purchase_completed",
  "timestamp": "2025-01-15T10:35:00Z",
  "is_duplicate": false
}
```

**Поля ответа:**

| Поле | Тип | Описание |
|------|-----|----------|
| `status` | string | Всегда `"success"` при коде 200 |
| `event_id` | string | Уникальный идентификатор события |
| `trace_id` | string | Trace ID из запроса |
| `event_name` | string | Название отслеженного события |
| `timestamp` | datetime | Время записи события |
| `is_duplicate` | boolean | `true`, если такое событие уже существует |

События дедуплицируются по комбинации `trace_id` + `event_name`. Повторная отправка того же события безопасна — вернется `is_duplicate: true`.

**Ошибки:**
- `400` — Отсутствуют обязательные поля или недопустимые метаданные
- `401` — Недействительный или отсутствующий API-ключ
- `404` — Определение события не найдено (сначала создайте в панели управления)

---

## Рабочий процесс

Типичный процесс интеграции:

```
1. POST /get-prompt       → Получение содержимого промпта + trace_id
2. Use prompt with LLM    → Код вашего приложения
3. POST /events           → Отслеживание конверсии с trace_id
```

**Пример:**

```python
# Step 1: Get prompt
prompt = api.get_prompt(slug="onboarding")
trace_id = prompt["trace_id"]

# Step 2: Use with LLM
response = openai.chat.completions.create(
    messages=[
        {"role": "system", "content": prompt["system_prompt"]},
        {"role": "user", "content": prompt["user_prompt"]}
    ]
)

# Step 3: Track conversion
api.track_event(
    trace_id=trace_id,
    event_name="signup_completed",
    user_id="user_123"
)
```

---

## Формат ошибок

Все ошибки имеют следующую структуру:

```json
{
  "detail": {
    "error": "error_code",
    "message": "Human-readable error message"
  }
}
```
