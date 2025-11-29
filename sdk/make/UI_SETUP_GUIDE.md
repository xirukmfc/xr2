# Пошаговая настройка xR2 в Make.com через UI

## 📋 Общий обзор

Это детальная инструкция по созданию приложения xR2 в Make.com через веб-интерфейс.
Вам НЕ нужно кодировать - всё делается через UI в браузере.

**Время настройки:** ~30-45 минут

---

## Шаг 1: Доступ к Developer Console

1. Перейдите на https://eu2.make.com/
2. Войдите в свой аккаунт Make.com
3. В левом меню найдите **"Apps"** или **"Custom Apps"**
4. Нажмите **"Create a new app"** или **"+"**

---

## Шаг 2: Основная информация о приложении

### 2.1 Создание приложения

Заполните форму создания приложения:

| Поле | Значение |
|------|----------|
| **Name** | `xr2` |
| **Label** | `xR2 - Prompt Management` |
| **Description** | `AI prompt management platform: versioning, A/B testing, analytics. Get prompts from xR2 and track usage events.` |
| **Version** | `1.0.0` |
| **Categories** | AI Tools, Marketing Automation, Development Tools |
| **Icon Color** | `#6366F1` |
| **Audience** | All |

### 2.2 Загрузка иконки (опционально)

- Загрузите логотип xR2 (формат PNG или SVG, размер 256x256px)
- Если нет иконки, Make.com создаст иконку автоматически на основе цвета

---

## Шаг 3: Base Configuration

1. Перейдите на вкладку **"Base"** в настройках приложения
2. Если есть режим **"Advanced"** или **"JSON"** - включите его
3. Вставьте следующую конфигурацию:

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

### Если JSON режима нет - заполните через UI:

**Base URL:**
```
https://xr2.uk/api/v1
```

**Default Headers** (нажмите "Add Header" два раза):
- Header 1:
  - Name: `Content-Type`
  - Value: `application/json`
- Header 2:
  - Name: `Accept`
  - Value: `application/json`

**Logging → Sanitize:**
- Добавьте: `request.headers.authorization`

**Error Handling:**
- Message template: `{{body.detail.message}}`
- Error type: `{{body.detail.error}}`

---

## Шаг 4: Connection (Авторизация)

1. Перейдите на вкладку **"Connections"**
2. Нажмите **"Add Connection"** или **"Create Connection"**

### 4.1 Основные настройки Connection

| Поле | Значение |
|------|----------|
| **Name** | `xr2_api_key` |
| **Label** | `xR2 API Key Connection` |
| **Type** | `API Key` (выберите из dropdown) |

### 4.2 Parameters (параметры подключения)

Нажмите **"Add Parameter"** и заполните:

| Поле | Значение |
|------|----------|
| **Name** | `apiKey` |
| **Type** | `text` |
| **Label** | `API Key` |
| **Help Text** | `Enter your xR2 Product API Key. Get it at: https://xr2.uk/api-keys` |
| **Required** | ✅ Yes |

### 4.3 Common (заголовки для всех запросов)

В секции **"Common"** → **"Headers"** добавьте:

| Header Name | Header Value |
|-------------|--------------|
| `Authorization` | `Bearer {{parameters.apiKey}}` |

⚠️ **Важно:** Точно скопируйте `Bearer {{parameters.apiKey}}` - это шаблон, который будет подставлять API ключ пользователя.

### 4.4 Test (тест подключения)

Настройте тест, который проверит работу API ключа:

**Request:**
- **URL:** `/get-prompt`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
      "slug": "test",
      "source_name": "make_connection_test"
  }
  ```

**Response Validation:**
- **Valid condition:**
  ```
  {{if(body.trace_id, true, if(body.detail.error == 'Prompt not found', true, false))}}
  ```

Это означает: соединение валидно если:
- Получен `trace_id` (промпт найден) ИЛИ
- Получена ошибка "Prompt not found" (API работает, просто промпта нет)

4. Нажмите **"Save"** или **"Create"**

---

## Шаг 5: Модуль "Get Prompt"

1. Перейдите на вкладку **"Modules"**
2. Нажмите **"Add Module"** или **"Create Module"**

### 5.1 Основная информация

| Поле | Значение |
|------|----------|
| **Name** | `getPrompt` |
| **Label** | `Get Prompt` |
| **Description** | `Retrieve prompt content by slug. Returns system, user, and assistant prompts, variables, and trace_id for event tracking.` |
| **Connection** | `xr2_api_key` (выберите из списка) |
| **Module Type** | `Action` |

### 5.2 Parameters (входные параметры)

Добавьте 3 параметра (кнопка **"Add Parameter"**):

#### Параметр 1: Prompt Slug

| Поле | Значение |
|------|----------|
| **Name** | `slug` |
| **Type** | `text` |
| **Label** | `Prompt Slug` |
| **Help** | `Unique prompt identifier (slug). Find it in the xR2 editor.` |
| **Required** | ✅ Yes |

#### Параметр 2: Version Number

| Поле | Значение |
|------|----------|
| **Name** | `version_number` |
| **Type** | `integer` |
| **Label** | `Version Number` |
| **Help** | `Specific version number (optional). If not specified, returns the production version.` |
| **Required** | ❌ No |

#### Параметр 3: Status Filter

| Поле | Значение |
|------|----------|
| **Name** | `status` |
| **Type** | `select` |
| **Label** | `Status Filter` |
| **Help** | `Filter by version status (optional)` |
| **Required** | ❌ No |

**Options для Status Filter** (нажмите "Add Option" 5 раз):

| Label | Value |
|-------|-------|
| `Production` | `production` |
| `Testing` | `testing` |
| `Draft` | `draft` |
| `Inactive` | `inactive` |
| `Deprecated` | `deprecated` |

### 5.3 Communication (настройка API запроса)

**URL:**
```
/get-prompt
```

**Method:**
```
POST
```

**Body (JSON):**
```json
{
    "slug": "{{parameters.slug}}",
    "source_name": "make_sdk",
    "version_number": "{{if(parameters.version_number, parameters.version_number, undefined)}}",
    "status": "{{if(parameters.status, parameters.status, undefined)}}"
}
```

### 5.4 Interface (выходные данные)

Добавьте следующие поля через **"Add Output Field"**:

| Name | Type | Label |
|------|------|-------|
| `slug` | text | Prompt Slug |
| `source_name` | text | Source Name |
| `version_number` | integer | Version Number |
| `status` | text | Status |
| `system_prompt` | text | System Prompt |
| `user_prompt` | text | User Prompt |
| `assistant_prompt` | text | Assistant Prompt |
| `trace_id` | text | Trace ID |
| `deployed_at` | date | Deployed At |
| `created_at` | date | Created At |
| `updated_at` | date | Updated At |
| `ab_test_id` | text | A/B Test ID |
| `ab_test_name` | text | A/B Test Name |
| `ab_test_variant` | text | A/B Test Variant |
| `model_config` | collection | Model Config |
| `variables` | array | Variables |

#### Для поля `variables` (тип: array):

Нажмите на поле `variables` → **"Define Structure"** → добавьте подполя:

| Name | Type | Label |
|------|------|-------|
| `name` | text | Variable Name |
| `type` | text | Variable Type |
| `defaultValue` | text | Default Value |

### 5.5 Samples (примеры для тестирования)

```json
{
    "slug": "customer-support-greeting"
}
```

5. Нажмите **"Save"** или **"Create"**

---

## Шаг 6: Модуль "Track Event"

1. В **"Modules"** нажмите **"Add Module"**

### 6.1 Основная информация

| Поле | Значение |
|------|----------|
| **Name** | `trackEvent` |
| **Label** | `Track Event` |
| **Description** | `Send a prompt usage event for analytics. Use the trace_id from the Get Prompt response.` |
| **Connection** | `xr2_api_key` |
| **Module Type** | `Action` |

### 6.2 Parameters

#### Параметр 1: Trace ID

| Поле | Значение |
|------|----------|
| **Name** | `trace_id` |
| **Type** | `text` |
| **Label** | `Trace ID` |
| **Help** | `Request identifier from the Get Prompt response (trace_id field)` |
| **Required** | ✅ Yes |

#### Параметр 2: Event Name

| Поле | Значение |
|------|----------|
| **Name** | `event_name` |
| **Type** | `text` |
| **Label** | `Event Name` |
| **Help** | `Event name (e.g., conversion, purchase, click, signup)` |
| **Required** | ✅ Yes |

#### Параметр 3: Category

| Поле | Значение |
|------|----------|
| **Name** | `category` |
| **Type** | `select` |
| **Label** | `Category` |
| **Help** | `Event category` |
| **Required** | ✅ Yes |

**Options:**

| Label | Value |
|-------|-------|
| `Conversion` | `conversion` |
| `Revenue` | `revenue` |
| `Engagement` | `engagement` |
| `Custom` | `custom` |

#### Параметр 4: Event Fields

| Поле | Значение |
|------|----------|
| **Name** | `fields` |
| **Type** | `collection` |
| **Label** | `Event Fields` |
| **Help** | `Additional event data (key-value pairs)` |
| **Required** | ❌ No |

**Spec для `fields`** (подполя):

| Name | Type | Label | Help |
|------|------|-------|------|
| `amount` | number | Amount | Amount (for revenue events) |
| `currency` | text | Currency | Currency code (USD, EUR, etc.) |
| `product_id` | text | Product ID | |
| `user_id` | text | User ID | |
| `custom_field_1` | text | Custom Field 1 | |
| `custom_field_2` | text | Custom Field 2 | |

### 6.3 Communication

**URL:**
```
/events
```

**Method:**
```
POST
```

**Body (JSON):**
```json
{
    "trace_id": "{{parameters.trace_id}}",
    "event_name": "{{parameters.event_name}}",
    "category": "{{parameters.category}}",
    "fields": "{{ifempty(parameters.fields, emptyobject)}}"
}
```

### 6.4 Interface (выходные данные)

| Name | Type | Label |
|------|------|-------|
| `success` | boolean | Success |
| `event_id` | text | Event ID |
| `trace_id` | text | Trace ID |
| `message` | text | Message |

### 6.5 Samples

```json
{
    "trace_id": "evt_abc123_1634567890_xyz",
    "event_name": "purchase",
    "category": "revenue",
    "fields": {
        "amount": 99.99,
        "currency": "USD"
    }
}
```

6. Нажмите **"Save"**

---

## Шаг 7: Тестирование

### 7.1 Тест Connection

1. Перейдите в **Connections** → `xr2_api_key`
2. Нажмите **"Test Connection"**
3. Введите настоящий API ключ из https://xr2.uk/api-keys
4. Должно появиться: ✅ "Connection successful"

### 7.2 Тест модуля Get Prompt

1. Создайте новый **Scenario** в Make.com
2. Добавьте модуль **xR2** → **Get Prompt**
3. Выберите connection (или создайте новое подключение с API ключом)
4. Введите slug существующего промпта (например, тестового)
5. Нажмите **"Run once"**
6. Проверьте результат - должны вернуться поля `system_prompt`, `user_prompt`, `trace_id` и т.д.

### 7.3 Тест модуля Track Event

1. В том же сценарии добавьте модуль **xR2** → **Track Event**
2. В поле `trace_id` вставьте значение из предыдущего шага (используйте mapping)
3. Event Name: `test_event`
4. Category: `custom`
5. Нажмите **"Run once"**
6. Должно вернуться: `{"success": true, "event_id": "...", ...}`

---

## Шаг 8: Публикация (опционально)

### Если хотите опубликовать в Make.com Marketplace:

1. Убедитесь, что все тесты прошли успешно
2. В настройках приложения нажмите **"Submit for Review"**
3. Заполните форму:
   - **Support Email:** ваш email
   - **Documentation URL:** https://xr2.gitbook.io/docs
   - **Privacy Policy URL:** ссылка на политику конфиденциальности
4. Дождитесь одобрения (обычно 3-7 дней)

### Если используете приватно:

- Приложение уже доступно в вашем аккаунте Make.com
- Вы можете использовать его в любых сценариях
- Другие пользователи его не увидят

---

## ✅ Чеклист готовности

Перед завершением проверьте:

- ✅ Приложение создано с именем `xr2`
- ✅ Base URL указывает на `https://xr2.uk/api/v1`
- ✅ Connection `xr2_api_key` настроена и тестируется успешно
- ✅ Модуль `Get Prompt` создан со всеми параметрами и output fields
- ✅ Модуль `Track Event` создан со всеми параметрами
- ✅ Оба модуля протестированы на реальных данных
- ✅ Authorization header в формате `Bearer {{parameters.apiKey}}`

---

## 🆘 Частые проблемы

### Ошибка: "Invalid API key"

**Причина:** Неправильный формат Authorization header

**Решение:** Убедитесь, что в Connection → Common → Headers указано точно:
```
Authorization: Bearer {{parameters.apiKey}}
```

### Ошибка: "Module not found"

**Причина:** Модуль не связан с Connection

**Решение:** В настройках модуля проверьте, что выбрана connection `xr2_api_key`

### Ошибка: "Base URL not set"

**Причина:** Не заполнена конфигурация Base

**Решение:** Проверьте, что в Base указан `https://xr2.uk/api/v1`

### Connection Test не работает

**Причина:** Промпта с slug "test" может не существовать

**Решение:** Это нормально - тест проверяет, что API отвечает. Ошибка "Prompt not found" тоже считается успехом.

---

## 📚 Полезные ссылки

- **Make.com Docs:** https://www.make.com/en/help
- **Custom Apps Guide:** https://www.make.com/en/help/app-development
- **xR2 API Docs:** https://xr2.gitbook.io/docs
- **xR2 Dashboard:** https://xr2.uk
- **Get API Key:** https://xr2.uk/api-keys

---

## 🎉 Готово!

Теперь вы можете использовать xR2 в Make.com сценариях:

**Пример workflow:**
1. **Webhook** (триггер) → получает данные от пользователя
2. **xR2 - Get Prompt** → получает промпт для AI
3. **OpenAI/Claude** → генерирует ответ с использованием промпта
4. **xR2 - Track Event** → отправляет событие для аналитики
5. **Email/Slack** → отправляет результат пользователю

Успехов! 🚀
