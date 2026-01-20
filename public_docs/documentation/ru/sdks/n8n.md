# Интеграция с n8n

Пользовательская нода для n8n, интегрирующаяся с API xR2.

[![npm](https://img.shields.io/npm/v/n8n-nodes-xr2)](https://www.npmjs.com/package/n8n-nodes-xr2)

## Установка

### Через интерфейс n8n (рекомендуется)

1. Перейдите в **Settings** → **Community Nodes**
2. Нажмите **Install**
3. Введите `n8n-nodes-xr2`
4. Нажмите **Install**
5. Перезапустите n8n

### Ручная установка

```bash
cd ~/.n8n/custom
npm install n8n-nodes-xr2
```

## Настройка учетных данных

1. В n8n перейдите в **Settings** → **Credentials**
2. Нажмите **New** → найдите "xR2 API"
3. Вставьте ваш API-ключ (из [xr2.uk/api-keys](https://xr2.uk/api-keys))
4. Нажмите **Save**

## Доступные операции

| Ресурс | Операция | Описание |
|--------|----------|----------|
| API Key | Check | Проверка API-ключа |
| Prompt | Get | Получение промпта по slug |
| Event | Track | Отправка аналитического события |

## Получение промпта

Получает промпт из xR2.

**Параметры:**

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| Slug | Да | Идентификатор промпта |
| Version Number | Нет | Конкретная версия (0 = последняя) |
| Status | Нет | `production`, `testing`, `draft` и т.д. |

**Вывод:**

```json
{
  "slug": "welcome",
  "system_prompt": "You are a helpful assistant",
  "user_prompt": "Hello {{name}}",
  "variables": [...],
  "trace_id": "evt_xxx",
  "version_number": 2,
  "status": "production"
}
```

## Отслеживание событий

Отправляет аналитическое событие в xR2.

**Параметры:**

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| Trace ID | Да | Из ответа Get Prompt |
| Event Name | Да | Название события из дашборда |
| User ID | Нет | Идентификатор пользователя |
| Session ID | Нет | Идентификатор сессии |
| Value | Нет | Числовое значение |
| Currency | Нет | Код валюты |
| Metadata | Нет | JSON-объект |

## Примеры сценариев

### Базовый сценарий

```
[Manual Trigger] → [xR2: Get Prompt] → [xR2: Track Event]
```

1. **Нода xR2** (Get Prompt):
   - Slug: `welcome`

2. **Нода xR2** (Track Event):
   - Trace ID: `{{ $('xR2').item.json.trace_id }}`
   - Event Name: `sign_up`
   - User ID: `user_123`

### С OpenAI

```
[Webhook] → [xR2: Get Prompt] → [OpenAI] → [xR2: Track Event]
```

1. Получите промпт из xR2
2. Используйте `system_prompt` и `user_prompt` в ноде OpenAI
3. Отследите событие конверсии

## Доступ к данным в выражениях

```javascript
// Get prompt content
{{ $('xR2').item.json.user_prompt }}

// Get trace_id
{{ $('xR2').item.json.trace_id }}

// Get variables
{{ $('xR2').item.json.variables }}
```

## Устранение неполадок

### Нода не отображается

* Перезапустите n8n после установки
* Проверьте наличие пакета в `~/.n8n/custom/node_modules/`
* Запустите `n8n start --verbose` для просмотра ошибок

### Ошибка аутентификации

* Убедитесь, что API-ключ корректен
* Убедитесь, что ключ начинается с `xr2_prod_`
* Проверьте, что ключ активен в дашборде

### Промпт не найден

* Убедитесь, что slug существует на [xr2.uk/prompts](https://xr2.uk/prompts)
* Убедитесь, что у промпта есть развернутая версия
* Проверьте правильность написания

## Ссылки

* npm: [https://www.npmjs.com/package/n8n-nodes-xr2](https://www.npmjs.com/package/n8n-nodes-xr2)
* Сообщество n8n: [https://community.n8n.io](https://community.n8n.io)
