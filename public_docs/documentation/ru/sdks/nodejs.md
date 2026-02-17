# Node.js SDK

Официальный Node.js SDK для xR2 с поддержкой TypeScript.

[![npm](https://img.shields.io/npm/v/xr2-sdk)](https://www.npmjs.com/package/xr2-sdk)

## Установка

```bash
npm install xr2-sdk
```

## Быстрый старт

```typescript
import { XR2Client } from "xr2-sdk";

const client = new XR2Client("YOUR_PRODUCT_API_KEY");

// Check API key
const keyResponse = await client.checkApiKey();
if (keyResponse.ok) {
  console.log(`API key valid for user: ${keyResponse.data.user}`);
}

// Get prompt
const promptResponse = await client.getPrompt({ slug: "welcome" });
if (promptResponse.ok) {
  const prompt = promptResponse.data;
  console.log("trace_id:", prompt.trace_id);

  // Track event
  const eventResponse = await client.trackEvent({
    traceId: prompt.trace_id,
    eventName: "sign_up",
    userId: "user_123",
    metadata: {},
  });

  if (eventResponse.ok) {
    console.log("Event tracked:", eventResponse.data.event_id);
  }
}
```

## Конфигурация

```typescript
const client = new XR2Client("YOUR_PRODUCT_API_KEY", {
  baseUrl: "https://xr2.uk",      // Override API URL
  timeoutMs: 15000,               // Request timeout
  totalRetries: 2,                // Retry count
  backoffFactor: 0.5,             // Exponential backoff
  sourceName: "my_backend",       // Source identifier
});
```

| Опция | Описание | По умолчанию |
|-------|----------|--------------|
| `baseUrl` | Базовый URL API | `https://xr2.uk` |
| `timeoutMs` | Таймаут запроса (мс) | 10000 |
| `totalRetries` | Количество повторных попыток | 3 |
| `backoffFactor` | Множитель задержки | 0.5 |
| `sourceName` | Источник аналитики | `nodejs_sdk` |

## Методы API

### `checkApiKey()`

Проверяет API-ключ и возвращает связанное имя пользователя.

```typescript
const response = await client.checkApiKey();
// { ok: true, data: { ok: true, user: "username" } }
```

### `getPrompt()`

Получает промпт по slug-идентификатору.

```typescript
const response = await client.getPrompt({
  slug: "welcome",
  versionNumber: 2,        // Optional: specific version
  status: "production",    // Optional: filter by status
});
```

**Ответ:**

```typescript
{
  ok: true,
  data: {
    slug: "welcome",
    version_number: 2,
    status: "production",
    system_prompt: "You are a helpful assistant",
    user_prompt: "Hello {{name}}",
    variables: [...],
    trace_id: "evt_xxx",
    model_config: { ... }
  }
}
```

### `trackEvent()`

Отправляет аналитическое событие.

```typescript
const response = await client.trackEvent({
  traceId: "evt_xxx",           // Required
  eventName: "purchase",        // Required
  userId: "user_123",           // Optional
  sessionId: "session_456",     // Optional
  value: 99.99,                 // Optional: for revenue
  currency: "USD",              // Optional
  metadata: {                   // Optional: custom fields
    order_id: "order_67890"
  }
});
```

### `renderPrompt()`

Рендерит шаблон промпта, заменяя плейсхолдеры `{{variable}}` значениями.

```typescript
import { XR2Client, renderPrompt, VariableError } from "xr2-sdk";

const client = new XR2Client("YOUR_API_KEY");
const response = await client.getPrompt({ slug: "welcome" });
const prompt = response.data;

// Рендерим переменные
const rendered = renderPrompt(prompt, {
  values: { customer_name: "Alice" },
});

console.log(rendered.systemPrompt);    // Плейсхолдеры заменены
console.log(rendered.variablesUsed);   // { customer_name: "Alice", language: "en" }

// Обработка отсутствующих обязательных переменных
try {
  renderPrompt(prompt, { values: {} });
} catch (e) {
  if (e instanceof VariableError) {
    console.log(e.missingVariables);   // ["customer_name"]
  }
}

// Нестрогий режим: оставить плейсхолдеры для отсутствующих переменных
const loose = renderPrompt(prompt, { values: {}, strict: false });
```

**Опции:**

| Опция | Тип | По умолчанию | Описание |
|-------|-----|--------------|----------|
| `values` | object | `{}` | Значения переменных для подстановки |
| `strict` | boolean | `true` | Выбрасывать `VariableError` при отсутствии обязательных переменных |
| `useDefaults` | boolean | `true` | Применять значения по умолчанию из определений переменных |
| `arraySeparator` | string | — | Соединять массивы этим разделителем вместо JSON |

**Возвращает:** `RenderedPrompt`

- `systemPrompt`, `userPrompt`, `assistantPrompt` — отрендеренный текст (или `null`)
- `traceId` — сохранён из исходного промпта
- `variablesUsed` — объект со всеми разрешёнными значениями, включая значения по умолчанию

## Типы TypeScript

SDK экспортирует все типы TypeScript:

```typescript
import {
  XR2Client,
  PromptResponse,
  EventResponse,
  CheckApiKeyResponse
} from "xr2-sdk";
```

## Обработка ошибок

```typescript
const response = await client.getPrompt({ slug: "unknown" });

if (response.ok) {
  console.log(response.data);
} else {
  console.error("Error:", response.error);
}
```

## Ссылки

* npm: [https://www.npmjs.com/package/xr2-sdk](https://www.npmjs.com/package/xr2-sdk)
* GitHub: [https://github.com/channeler-ai/xr2-nodejs-sdk](https://github.com/channeler-ai/xr2-nodejs-sdk)
