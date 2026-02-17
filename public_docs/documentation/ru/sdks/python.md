# Python SDK

Официальный Python SDK для xR2 с поддержкой синхронного и асинхронного режимов.

[![PyPI](https://img.shields.io/pypi/v/xr2-sdk)](https://pypi.org/project/xr2-sdk/)

## Установка

```bash
pip install xr2-sdk
```

## Быстрый старт (синхронный режим)

```python
from xr2_sdk.client import xR2Client

client = xR2Client(api_key="YOUR_PRODUCT_API_KEY")

# Check API key validity
key_response = client.check_api_key()
if key_response.ok:
    print(f"API key valid for user: {key_response.data.user}")

# Get prompt
prompt_response = client.get_prompt(slug="welcome")

if prompt_response.ok:
    prompt = prompt_response.data
    print(f"slug: {prompt.slug}")
    print(f"version_number: {prompt.version_number}")
    print(f"system_prompt: {prompt.system_prompt}")
    print(f"user_prompt: {prompt.user_prompt}")
    print(f"variables: {prompt.variables}")
    print(f"trace_id: {prompt.trace_id}")

    # Track an event
    event_response = client.track_event(
        trace_id=prompt.trace_id,
        event_name="sign_up",
        user_id="user_123",
        metadata={},
    )

    if event_response.ok:
        print(f"Event tracked: {event_response.data.event_id}")
```

## Быстрый старт (асинхронный режим)

```python
import asyncio
from xr2_sdk.client import AsyncxR2Client

async def main():
    client = AsyncxR2Client(api_key="YOUR_PRODUCT_API_KEY")
    try:
        # Check API key validity
        key_response = await client.check_api_key()
        if key_response.ok:
            print(f"API key valid for user: {key_response.data.user}")

        # Get prompt
        prompt_response = await client.get_prompt(slug="welcome")

        if prompt_response.ok:
            prompt = prompt_response.data
            print(f"trace_id: {prompt.trace_id}")

            # Track an event
            event_response = await client.track_event(
                trace_id=prompt.trace_id,
                event_name="sign_up",
                user_id="user_123",
            )
    finally:
        await client.aclose()

asyncio.run(main())
```

## Конфигурация

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `api_key` | API-ключ продукта | Обязательный |
| `timeout` | Таймаут запроса (секунды) | 10 |
| `total_retries` | Количество повторных попыток | 3 |
| `backoff_factor` | Экспоненциальная задержка | 0.5 |

## Методы API

### `check_api_key()`

Проверяет валидность API-ключа и возвращает связанное имя пользователя.

**Возвращает:** `Response[CheckAPIKeyResponse]`

```python
response = client.check_api_key()
if response.ok:
    print(response.data.user)
```

### `get_prompt()`

Получает промпт по slug-идентификатору.

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `slug` | str | Да | Идентификатор промпта |
| `version_number` | int | Нет | Конкретная версия |
| `status` | str | Нет | `draft`, `testing`, `production`, `inactive`, `deprecated` |

**Возвращает:** `Response[PromptContentResponse]`

```python
response = client.get_prompt(
    slug="welcome",
    version_number=2,
    status="production"
)
```

### `track_event()`

Отправляет аналитическое событие.

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `trace_id` | str | Да | Из ответа get_prompt() |
| `event_name` | str | Да | Название события из дашборда |
| `user_id` | str | Нет | Идентификатор пользователя |
| `session_id` | str | Нет | Идентификатор сессии |
| `value` | float | Нет | Числовое значение (выручка) |
| `currency` | str | Нет | Код валюты |
| `metadata` | dict | Нет | Произвольные поля |

**Возвращает:** `Response[EventResponse]`

```python
response = client.track_event(
    trace_id=prompt.trace_id,
    event_name="purchase_completed",
    user_id="user_123",
    value=99.99,
    currency="USD",
    metadata={"order_id": "order_67890"}
)
```

### `prompt.render()`

Рендерит шаблон промпта, заменяя плейсхолдеры `{{variable}}` значениями. Вызывается на объекте `PromptContentResponse`, полученном из `get_prompt()`.

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `values` | dict | Нет | Значения переменных для подстановки |
| `strict` | bool | Нет | Выбрасывать `VariableError` при отсутствии обязательных переменных (по умолчанию: `True`) |
| `use_defaults` | bool | Нет | Применять значения по умолчанию из определений переменных (по умолчанию: `True`) |
| `array_separator` | str | Нет | Соединять массивы этим разделителем вместо JSON |

**Возвращает:** `RenderedPrompt`

- `system_prompt`, `user_prompt`, `assistant_prompt` — отрендеренный текст (или `None`)
- `trace_id` — сохранён из исходного промпта
- `variables_used` — словарь всех разрешённых значений, включая значения по умолчанию

```python
from xr2_sdk import VariableError

response = client.get_prompt(slug="welcome")
prompt = response.data

# Рендерим переменные
rendered = prompt.render({"customer_name": "Alice"})
print(rendered.system_prompt)
print(rendered.variables_used)  # {"customer_name": "Alice", "language": "en"}

# Обработка отсутствующих обязательных переменных
try:
    rendered = prompt.render({})
except VariableError as e:
    print(e.missing_variables)  # ["customer_name"]

# Нестрогий режим: оставить плейсхолдеры для отсутствующих переменных
rendered = prompt.render({}, strict=False)
```

## Обработка ошибок

```python
response = client.get_prompt(slug="unknown")

if response.ok:
    print(response.data)
else:
    print(f"Error: {response.error}")
```

## Ссылки

* PyPI: [https://pypi.org/project/xr2-sdk/](https://pypi.org/project/xr2-sdk/)
