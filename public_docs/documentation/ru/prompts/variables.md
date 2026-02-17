# Переменные

Переменные позволяют внедрять динамический контент в промпты во время выполнения. Это ключ к созданию переиспользуемых промптов для различных контекстов.

## Синтаксис переменных

Используйте двойные фигурные скобки для определения переменных:

```
Hello {{customer_name}}, welcome to {{company_name}}!

Your order #{{order_id}} will arrive on {{delivery_date}}.
```

## Автоматическое обнаружение

Редактор автоматически обнаруживает переменные по мере ввода:

1. Введите `{{variable_name}}` в любом поле промпта
2. Переменная появится в левой панели под **Variables**
3. Желтый индикатор показывает, что она **не определена**
4. Нажмите, чтобы определить ее свойства

## Определение переменных

Нажмите на любую переменную для настройки:

### Имя

Идентификатор переменной. Используйте `snake_case`:

- `customer_name`
- `order_total`
- `is_premium_user`

### Тип

Выберите тип данных:

| Тип | Случай использования | Пример |
|------|----------|---------|
| **String** | Текстовые значения | Имена, описания, сообщения |
| **Number** | Числовые значения | Цены, количества, ID |
| **Boolean** | Флаги true/false | `is_subscribed`, `has_discount` |
| **Array** | Списки элементов | Списки продуктов, теги |

### Значение по умолчанию

Что использовать, если значение не предоставлено:

- String: `"Guest"`
- Number: `0`
- Boolean: `false`
- Array: `[]`

### Обязательность

Отметьте как обязательную, чтобы гарантировать, что API-вызов включает эту переменную.

## Состояния переменных

Переменные имеют три состояния:

| Состояние | Индикатор | Значение |
|-------|-----------|---------|
| **Определена** | Зеленый | Полностью настроена с типом и значением по умолчанию |
| **Не определена** | Желтый | Обнаружена в тексте, но не настроена |
| **Не используется** | Серый | Определена, но не используется ни в одном промпте |

> ⚠️ **Предупреждение:** Неопределенные переменные будут работать, но могут вызвать неожиданное поведение. Всегда определяйте переменные перед развертыванием.

## Использование переменных в промптах

### Базовое использование

```
System: You are assisting {{customer_name}}.

User: The customer asks: {{question}}
```

### Списки и массивы

Для переменных-массивов:

```
Recent orders: {{recent_orders}}
Interests: {{user_interests}}
```

Передавайте массивы как JSON в API-вызове:

```json
{
  "recent_orders": ["Order #123", "Order #456"],
  "user_interests": ["electronics", "gaming"]
}
```

## Рендеринг переменных в коде

### Без SDK (прямой API + Python)

Получите промпт через API и замените плейсхолдеры вручную:

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug": "welcome", "source_name": "my_app"}'
```

```python
import requests

resp = requests.post(
    "https://xr2.uk/api/v1/get-prompt",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"slug": "welcome", "source_name": "my_app"},
).json()

# Задаём значения переменных
var_values = {"customer_name": "Alice", "language": "en"}

# Применяем значения по умолчанию для отсутствующих переменных
for var in resp["variables"]:
    name = var["name"]
    if name not in var_values and var.get("default") is not None:
        var_values[name] = var["default"]

# Заменяем плейсхолдеры
system = resp.get("system_prompt") or ""
user = resp.get("user_prompt") or ""
for name, val in var_values.items():
    system = system.replace("{{" + name + "}}", str(val))
    user = user.replace("{{" + name + "}}", str(val))

# Используем с LLM
messages = [
    {"role": "system", "content": system},
    {"role": "user", "content": user},
]
```

### С Python SDK

SDK автоматически обрабатывает валидацию, значения по умолчанию и преобразование типов:

```python
from xr2_sdk import xR2Client, VariableError

client = xR2Client(api_key="YOUR_API_KEY")
prompt = client.get_prompt(slug="welcome").data

# Рендерим с подстановкой значений
rendered = prompt.render({"customer_name": "Alice", "language": "en"})

print(rendered.system_prompt)     # Плейсхолдеры заменены
print(rendered.user_prompt)       # Плейсхолдеры заменены
print(rendered.trace_id)          # Сохранён для трекинга событий
print(rendered.variables_used)    # {"customer_name": "Alice", "language": "en"}

# Обработка отсутствующих обязательных переменных
try:
    rendered = prompt.render({})
except VariableError as e:
    print(f"Отсутствуют: {e.missing_variables}")

# Переменные-массивы
rendered = prompt.render({
    "customer_name": "Alice",
    "tags": ["vip", "returning"],
})
# tags рендерится как: ["vip", "returning"]

# Или с пользовательским разделителем
rendered = prompt.render(
    {"customer_name": "Alice", "tags": ["vip", "returning"]},
    array_separator=", ",
)
# tags рендерится как: vip, returning
```

### n8n (с нодой xR2)

[Нода xR2 для n8n](/documentation/ru/sdks/n8n/) подставляет переменные напрямую — нода Code не нужна.

1. Добавьте ноду **xR2** → **Prompt** → **Get**
2. Введите **Slug** промпта
3. В разделе **Variable Values** нажмите **Add Variable** для каждого плейсхолдера
4. Укажите **Name** — имя переменной, **Value** — статическое значение или n8n-выражение

| Name | Value |
|------|-------|
| `customer_name` | `{{ $json.customer_name }}` |
| `language` | `en` |

Нода вернёт промпты с подставленными значениями вместо `{{плейсхолдеров}}`. Для отсутствующих переменных автоматически используются значения по умолчанию.

Затем подключите выход напрямую к ноде **LLM** (OpenAI, Anthropic и т.д.) — используйте `{{ $json.system_prompt }}` и `{{ $json.user_prompt }}`.

### Make.com (с модулем xR2)

[Модуль xR2 для Make.com](/documentation/ru/sdks/make/) возвращает сырые шаблоны. Используйте функцию `replace()` или модули **Text Parser: Replace** для подстановки переменных. Подробные примеры со скриншотами — в [документации Make.com SDK](/documentation/ru/sdks/make/).

```
{{replace(replace(4.system_prompt; "{customer_name}"; 2.customer_name); "{plan_name}"; 2.plan_name)}}
```

### Zapier (с действием xR2)

[Действие xR2 для Zapier](/documentation/ru/sdks/zapier/) подставляет переменные напрямую. В поле **Variable Values (JSON)** передайте JSON-объект:

```json
{"customer_name": "Alice", "plan_name": "Enterprise"}
```

Действие вернёт промпты с подставленными значениями. Подробнее в [документации Zapier SDK](/documentation/ru/sdks/zapier/).

## Лучшие практики

### 1. Соглашения об именовании

**Правильно:**

- `customer_name` — понятно, описательно
- `order_total_usd` — включает единицу измерения
- `is_returning_customer` — префикс для boolean

**Неправильно:**

- `n` — слишком коротко
- `customerNameValue` — camelCase
- `x1` — бессмысленно

### 2. Минимизируйте количество переменных

Включайте только переменные, которые действительно влияют на ответ AI:

**Необходимо:**
```
{{customer_tier}} — affects recommendations
{{language}} — affects response language
{{product_category}} — affects expertise needed
```

**Не нужно:**
```
{{request_id}} — AI doesn't use this
{{timestamp}} — rarely relevant
{{internal_user_id}} — no impact on response
```

### 3. Обрабатывайте отсутствующие значения

Всегда устанавливайте разумные значения по умолчанию:

| Переменная | Плохое значение | Хорошее значение |
|----------|-------------|--------------|
| `customer_name` | `""` | `"valued customer"` |
| `discount_percent` | `null` | `0` |
| `language` | undefined | `"en"` |

## Переменные в API-ответе

При получении промпта через API ответ включает определения переменных:

```json
{
  "slug": "welcome-message",
  "user_prompt": "Hello {{customer_name}}!",
  "variables": [
    {
      "name": "customer_name",
      "type": "string",
      "default": "valued customer",
      "required": true
    }
  ]
}
```

Используйте это для валидации входных данных в вашем приложении перед вызовом LLM.

## Синхронизация переменных

Если вы добавляете или удаляете переменные в тексте промпта:

1. Новые переменные автоматически появляются в панели
2. Удаленные переменные становятся **Не используется**

## Следующие шаги

- [Тестирование промптов](testing.md) — Тестируйте переменные с реальными значениями
- [Версии и развертывание](versions.md) — Зафиксируйте определения переменных
