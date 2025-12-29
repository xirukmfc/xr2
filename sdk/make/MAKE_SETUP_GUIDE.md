# Настройка xR2 в Make.com - Актуальная инструкция

Эта инструкция основана на официальной документации Make.com Custom Apps.

## 📋 Обзор

В Make.com все настраивается через **JSON конфигурацию** в веб-интерфейсе Make Apps Editor.

**Структура приложения:**
- **Base** - базовая конфигурация (URL, заголовки, обработка ошибок)
- **Connection** - настройка авторизации (API Key)
- **Modules** - функциональные модули (Get Prompt, Track Event)

---

## Шаг 1: Доступ к Make Apps Editor

1. Перейдите на https://eu2.make.com/
2. Войдите в аккаунт
3. В меню найдите **Apps** или перейдите напрямую: https://eu2.make.com/apps
4. Нажмите **Create a new app** (кнопка "+" или "Add")

---

## Шаг 2: Создание приложения

### 2.1 Основная информация

Заполните основные поля:

| Поле | Значение |
|------|----------|
| **Name** | `xr2` |
| **Label** | `xR2 - Prompt Management` |
| **Description** | `AI prompt management platform: versioning, A/B testing, analytics. Get prompts from xR2 and track usage events.` |
| **Version** | `1.0.0` |

### 2.2 Загрузка логотипа (опционально)

- Размер: 256x256px
- Формат: PNG или SVG
- Если логотипа нет - Make создаст автоматически

---

## Шаг 3: Base Configuration

Перейдите в раздел **Base** и вставьте JSON:

```json
{
    "baseUrl": "https://xr2.uk/api/v1",
    "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    "log": {
        "sanitize": ["request.headers.authorization"]
    },
    "response": {
        "error": {
            "message": "{{body.detail.message}}",
            "type": "{{body.detail.error}}"
        }
    }
}
```

### Что означает каждое поле:

- **baseUrl** - базовый URL API для всех запросов
- **headers** - заголовки по умолчанию для всех модулей
- **log.sanitize** - скрывает API ключ в логах (безопасность)
- **response.error** - как обрабатывать ошибки от API

---

## Шаг 4: Connection (API Key авторизация)

1. Перейдите в раздел **Connections**
2. Нажмите **Add Connection**
3. Вставьте JSON:

```json
{
    "name": "xr2_api_key",
    "label": "xR2 API Key Connection",
    "type": "apikey",
    "parameters": [
        {
            "name": "apiKey",
            "type": "text",
            "label": "API Key",
            "help": "Enter your xR2 Product API Key. Get it at: https://xr2.uk/api-keys",
            "required": true
        }
    ],
    "common": {
        "headers": {
            "Authorization": "Bearer {{parameters.apiKey}}"
        }
    },
    "test": {
        "request": {
            "url": "/check-api-key",
            "method": "GET"
        },
        "response": {
            "valid": "{{body.ok}}"
        }
    }
}
```

### Важные моменты:

- **type: "apikey"** - тип авторизации
- **common.headers** - добавляет Authorization header ко всем запросам
- **test** - проверяет, что API работает (даже если промпт не найден)
- **{{parameters.apiKey}}** - IML выражение для подстановки ключа пользователя

4. Сохраните connection

---

## Шаг 5: Модуль "Get Prompt"

1. Перейдите в раздел **Modules**
2. Нажмите **Add Module**
3. Вставьте JSON:

```json
{
    "name": "getPrompt",
    "label": "Get Prompt",
    "description": "Retrieve prompt content by slug. Returns system, user, and assistant prompts, variables, and trace_id for event tracking.",
    "connection": "xr2_api_key",
    "parameters": [
        {
            "name": "slug",
            "type": "text",
            "label": "Prompt Slug",
            "help": "Unique prompt identifier (slug). Find it in the xR2 editor.",
            "required": true
        },
        {
            "name": "version_number",
            "type": "integer",
            "label": "Version Number",
            "help": "Specific version number (optional). If not specified, returns the production version.",
            "required": false
        },
        {
            "name": "status",
            "type": "select",
            "label": "Status Filter",
            "help": "Filter by version status (optional)",
            "required": false,
            "options": [
                {"label": "Production", "value": "production"},
                {"label": "Testing", "value": "testing"},
                {"label": "Draft", "value": "draft"},
                {"label": "Inactive", "value": "inactive"},
                {"label": "Deprecated", "value": "deprecated"}
            ]
        }
    ],
    "interface": [
        {"name": "slug", "type": "text", "label": "Prompt Slug"},
        {"name": "source_name", "type": "text", "label": "Source Name"},
        {"name": "version_number", "type": "integer", "label": "Version Number"},
        {"name": "status", "type": "text", "label": "Status"},
        {"name": "system_prompt", "type": "text", "label": "System Prompt"},
        {"name": "user_prompt", "type": "text", "label": "User Prompt"},
        {"name": "assistant_prompt", "type": "text", "label": "Assistant Prompt"},
        {"name": "variables", "type": "array", "label": "Variables", "spec": [
            {"name": "name", "type": "text", "label": "Variable Name"},
            {"name": "type", "type": "text", "label": "Variable Type"},
            {"name": "defaultValue", "type": "text", "label": "Default Value"}
        ]},
        {"name": "model_config", "type": "collection", "label": "Model Config", "spec": []},
        {"name": "trace_id", "type": "text", "label": "Trace ID"},
        {"name": "deployed_at", "type": "date", "label": "Deployed At"},
        {"name": "created_at", "type": "date", "label": "Created At"},
        {"name": "updated_at", "type": "date", "label": "Updated At"},
        {"name": "ab_test_id", "type": "text", "label": "A/B Test ID"},
        {"name": "ab_test_name", "type": "text", "label": "A/B Test Name"},
        {"name": "ab_test_variant", "type": "text", "label": "A/B Test Variant"}
    ],
    "communication": {
        "url": "/get-prompt",
        "method": "POST",
        "body": {
            "type": "json",
            "slug": "{{parameters.slug}}",
            "source_name": "make_sdk",
            "version_number": "{{if(parameters.version_number, parameters.version_number)}}",
            "status": "{{if(parameters.status, parameters.status)}}"
        },
        "response": {
            "output": "{{body}}"
        }
    },
    "samples": {
        "parameters": {
            "slug": "customer-support-greeting"
        }
    }
}
```

### Разбор структуры модуля:

#### **parameters** (входные поля для пользователя)
Это mappable parameters - пользователь может вводить значения или мапить из предыдущих модулей:
- `slug` - обязательный текстовый параметр
- `version_number` - опциональное число
- `status` - выпадающий список с опциями

#### **interface** (выходные поля)
Определяет, какие данные вернет модуль и будут доступны в следующих шагах:
- Простые поля: `slug`, `trace_id`, `system_prompt`
- **Array** с структурой (`variables`):
  ```json
  {
      "name": "variables",
      "type": "array",
      "label": "Variables",
      "spec": [
          {"name": "name", "type": "text", "label": "Variable Name"},
          {"name": "type", "type": "text", "label": "Variable Type"}
      ]
  }
  ```
- **Collection** с неизвестной структурой (`model_config`):
  ```json
  {"name": "model_config", "type": "collection", "label": "Model Config", "spec": []}
  ```
  Пустой `spec: []` означает, что структура динамическая

#### **communication** (API запрос)
- **url**: относительный путь (добавляется к baseUrl)
- **method**: HTTP метод
- **body.type**: `"json"` - отправлять как JSON
- **body**: объект с данными для отправки
  - Использует IML: `{{parameters.slug}}` - подставляет значение параметра
  - `{{if(parameters.version_number, parameters.version_number)}}` - отправляет только если есть значение
- **response.output**: `"{{body}}"` - возвращает весь ответ API

#### **samples** (примеры для тестирования)
Пример данных для быстрого теста модуля

4. Сохраните модуль

---

## Шаг 6: Модуль "Track Event"

1. В разделе **Modules** нажмите **Add Module**
2. Вставьте JSON:

```json
{
    "name": "trackEvent",
    "label": "Track Event",
    "description": "Track a business event linked to a prompt trace_id. Use trace_id from the Get Prompt response.",
    "connection": "xr2_api_key",
    "parameters": [
        {
            "name": "trace_id",
            "type": "text",
            "label": "Trace ID",
            "help": "Request identifier from the Get Prompt response (trace_id field)",
            "required": true
        },
        {
            "name": "event_name",
            "type": "text",
            "label": "Event Name",
            "help": "Event name configured in xR2 Analytics (e.g., signup, purchase_completed).",
            "required": true
        },
        {
            "name": "source_name",
            "type": "text",
            "label": "Source Name",
            "help": "Where the event happened (web_app, chatbot, workspace, etc.). Auto-fills to make_sdk if пусто.",
            "required": false
        },
        {
            "name": "user_id",
            "type": "text",
            "label": "User ID",
            "help": "Optional user identifier.",
            "required": false
        },
        {
            "name": "session_id",
            "type": "text",
            "label": "Session ID",
            "help": "Optional session identifier.",
            "required": false
        },
        {
            "name": "value",
            "type": "number",
            "label": "Value",
            "help": "Numeric value for the event (e.g., revenue).",
            "required": false
        },
        {
            "name": "currency",
            "type": "text",
            "label": "Currency",
            "help": "Currency code for value (USD, EUR, etc.).",
            "required": false
        },
        {
            "name": "metadata",
            "type": "collection",
            "label": "Metadata",
            "help": "Custom fields defined in the event metadata schema.",
            "required": false,
            "spec": []
        }
    ],
    "interface": [
        {"name": "status", "type": "text", "label": "Status"},
        {"name": "event_id", "type": "text", "label": "Event ID"},
        {"name": "trace_id", "type": "text", "label": "Trace ID"},
        {"name": "event_name", "type": "text", "label": "Event Name"},
        {"name": "timestamp", "type": "date", "label": "Timestamp"},
        {"name": "is_duplicate", "type": "boolean", "label": "Is Duplicate"}
    ],
    "communication": {
        "url": "/events",
        "method": "POST",
        "body": {
            "type": "json",
            "trace_id": "{{parameters.trace_id}}",
            "event_name": "{{parameters.event_name}}",
            "source_name": "{{ifempty(parameters.source_name, \"make_sdk\")}}",
            "user_id": "{{if(parameters.user_id, parameters.user_id)}}",
            "session_id": "{{if(parameters.session_id, parameters.session_id)}}",
            "value": "{{if(parameters.value, parameters.value)}}",
            "currency": "{{if(parameters.currency, parameters.currency)}}",
            "metadata": "{{ifempty(parameters.metadata, emptyobject)}}"
        },
        "response": {
            "output": "{{body}}"
        }
    },
    "samples": {
        "parameters": {
            "trace_id": "evt_abc123_1634567890_xyz",
            "event_name": "purchase_completed",
            "source_name": "make_sdk",
            "user_id": "user_123",
            "value": 99.99,
            "currency": "USD",
            "metadata": {
                "order_id": "order_456",
                "plan": "premium"
            }
        }
    }
}
```

### Особенности этого модуля:

#### **Collection parameter** (`metadata`)
Позволяет передавать любые дополнительные поля, определенные в схеме события в xR2 Analytics. `spec: []` оставляет структуру динамической.

#### **IML функция ifempty**
```json
"metadata": "{{ifempty(parameters.metadata, emptyobject)}}"
```
Если `metadata` пустой - отправит пустой объект `{}`, иначе - данные пользователя.

3. Сохраните модуль

---

## Шаг 7: Тестирование

### 7.1 Тест Connection

1. В разделе **Connections** → `xr2_api_key`
2. Нажмите **Test** или **Test Connection**
3. Введите реальный API Key из https://xr2.uk/api-keys
4. Должно появиться: ✅ **Connection successful**

Даже если API вернет ошибку "Prompt not found" - это нормально, connection валиден.

### 7.2 Тест модуля Get Prompt

1. Создайте новый **Scenario** в Make.com
2. Добавьте модуль **xR2** → **Get Prompt**
3. Настройте connection (выберите существующее или создайте новое)
4. Введите slug существующего промпта
5. Нажмите **Run once**
6. Проверьте output - должны быть все поля из `interface`

### 7.3 Тест модуля Track Event

1. Добавьте в сценарий модуль **xR2** → **Track Event**
2. Замапьте `trace_id` из предыдущего модуля Get Prompt
3. Заполните:
   - Event Name: `test_event` (или имя из настроек Analytics)
   - Source Name: можно оставить пустым (по умолчанию `make_sdk`) или указать свой идентификатор
   - При необходимости: user_id, session_id, value/currency, metadata
4. Нажмите **Run once**
5. Должно вернуться: `{"status": "success", "event_id": "...", "is_duplicate": false, ...}`

---

## Шаг 8: Публикация (опционально)

### Для приватного использования:
Приложение уже работает в вашем аккаунте - можете использовать в сценариях.

### Для публикации в Make.com Marketplace:

1. Убедитесь, что все тесты прошли
2. Нажмите **Submit for Review** в настройках приложения
3. Заполните форму:
   - Support Email
   - Documentation URL: https://xr2.gitbook.io/docs
   - Privacy Policy URL
4. Ждите одобрения (3-7 дней)

После одобрения приложение появится здесь:
```
https://www.make.com/en/integrations/xr2
```

---

## 🔍 Важные концепции Make.com

### IML (Integromat Markup Language)

Это язык для работы с данными в Make:

```
{{parameters.slug}}              - значение параметра slug
{{body.trace_id}}                - значение trace_id из ответа API
{{connection.apiKey}}            - API ключ из connection
{{if(condition, true_val, false_val)}} - условие
{{ifempty(value, default)}}      - значение или дефолт
```

### Типы данных

| Type | Описание | Пример |
|------|----------|--------|
| `text` | Обычный текст | "hello" |
| `integer` | Целое число | 42 |
| `number` | Число с дробной частью | 99.99 |
| `boolean` | true/false | true |
| `date` | Дата | "2024-01-01" |
| `select` | Выпадающий список | options: [...] |
| `array` | Массив | spec: [...] |
| `collection` | Объект/группа полей | spec: [...] |

### Array vs Collection

**Array** - список одинаковых элементов:
```json
{
    "type": "array",
    "spec": [
        {"name": "email", "type": "email"},
        {"name": "name", "type": "text"}
    ]
}
```

**Collection** - группа полей (как объект):
```json
{
    "type": "collection",
    "spec": [
        {"name": "city", "type": "text"},
        {"name": "country", "type": "text"}
    ]
}
```

### Динамическая структура

Если API возвращает неизвестную структуру:
- Для array: не указывайте `spec`
- Для collection: укажите `"spec": []`

```json
{"name": "metadata", "type": "collection", "spec": []}
```

---

## ✅ Чеклист перед публикацией

- ✅ Base: baseUrl указывает на `https://xr2.uk/api/v1`
- ✅ Base: headers содержит `Content-Type: application/json`
- ✅ Base: log.sanitize скрывает `request.headers.authorization`
- ✅ Connection: тип `apikey`
- ✅ Connection: common.headers содержит `Authorization: Bearer {{parameters.apiKey}}`
- ✅ Connection: test проверяет API через `/check-api-key`
- ✅ Модуль Get Prompt: connection указан `xr2_api_key`
- ✅ Модуль Get Prompt: parameters определены (slug, version_number, status)
- ✅ Модуль Get Prompt: interface содержит все output поля
- ✅ Модуль Get Prompt: communication.body.type = "json"
- ✅ Модуль Track Event: параметры и interface соответствуют API
- ✅ Модуль Track Event: collection parameter `metadata` со свободной схемой
- ✅ Оба модуля протестированы на реальных данных
- ✅ Connection test проходит успешно

---

## 🆘 Частые проблемы

### "Invalid API key" при тесте connection

**Причина:** Неправильный формат Authorization header

**Решение:** Проверьте в Connection → common.headers:
```json
"Authorization": "Bearer {{parameters.apiKey}}"
```

### Модуль не отправляет JSON

**Причина:** Не указан `"type": "json"` в body

**Решение:** В communication.body добавьте:
```json
{
    "type": "json",
    "field1": "value1"
}
```

### Optional параметры отправляются как null

**Причина:** Используется `undefined` вместо условия

**Решение:** Используйте IML условие:
```json
"version_number": "{{if(parameters.version_number, parameters.version_number)}}"
```

### Interface не показывает вложенные поля

**Причина:** Не указан `spec` для array/collection

**Решение:** Для array/collection определите структуру через `spec`:
```json
{
    "name": "items",
    "type": "array",
    "spec": [
        {"name": "id", "type": "text"},
        {"name": "name", "type": "text"}
    ]
}
```

### Connection test не проходит

**Причина:** Неверный API ключ

**Решение:** Проверьте API key на https://xr2.uk/api-keys. Connection test теперь использует endpoint `/check-api-key`, который просто проверяет валидность ключа.

---

## 📚 Официальная документация

**Make.com Custom Apps:**
- [Developer Hub](https://developers.make.com/custom-apps-documentation)
- [Base Configuration](https://developers.make.com/custom-apps-documentation/app-components/base)
- [Connections](https://developers.make.com/custom-apps-documentation/app-components/connections)
- [Modules](https://developers.make.com/custom-apps-documentation/app-components/modules)
- [Communication Block](https://developers.make.com/custom-apps-documentation/component-blocks/api)
- [Mappable Parameters](https://developers.make.com/custom-apps-documentation/component-blocks/mappable-parameters)
- [Interface](https://developers.make.com/custom-apps-documentation/component-blocks/interface)
- [Data Types](https://developers.make.com/custom-apps-documentation/block-elements/types)

**xR2 Docs:**
- [API Documentation](https://xr2.gitbook.io/docs)
- [Dashboard](https://xr2.uk)
- [API Keys](https://xr2.uk/api-keys)

---

## 🎯 Пример готового сценария

```
1. Webhook (Trigger)
   ↓
2. xR2 - Get Prompt
   - slug: "customer-greeting"
   ↓ (возвращает: system_prompt, user_prompt, trace_id)
   ↓
3. OpenAI - Create Completion
   - Prompt: {{2.system_prompt}} + {{2.user_prompt}}
   ↓ (возвращает: completion)
   ↓
4. xR2 - Track Event
   - trace_id: {{2.trace_id}}
   - event_name: "ai_response_generated"
   - source_name: "web_app"
   - metadata: {"model": "gpt-4o-mini"}
   ↓
5. Webhook Response
   - Body: {{3.completion}}
```

---

## 🚀 Готово!

Теперь ваше приложение xR2 настроено в Make.com и готово к использованию!

Любые вопросы - пишите в support@xr2.uk или читайте документацию.
