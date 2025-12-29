# xR2 Make.com - Быстрый старт

## 🚀 Что нужно сделать

1. Зайти на https://eu2.make.com/apps
2. Создать новое приложение "xR2"
3. Скопировать JSON из файлов ниже
4. Протестировать
5. Готово!

---

## Шаг 1: Base

Перейдите в **Base** → вставьте:

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

---

## Шаг 2: Connection

Перейдите в **Connections** → Add Connection → вставьте содержимое файла:

**Файл:** `connections/xr2_api_key.json`

Или прямо отсюда:

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

---

## Шаг 3: Модуль "Get Prompt"

Перейдите в **Modules** → Add Module → вставьте содержимое файла:

**Файл:** `modules/getPrompt.json`

---

## Шаг 4: Модуль "Track Event"

**Modules** → Add Module → вставьте содержимое файла:

**Файл:** `modules/trackEvent.json`

---

## ✅ Тестирование

### Тест Connection:
1. Connections → xr2_api_key → Test
2. Введите API key с https://xr2.uk/api-keys
3. Должно быть ✅ Connection successful

### Тест модулей:
1. Создайте новый Scenario
2. Добавьте xR2 → Get Prompt
3. Введите slug существующего промпта (source_name подставится автоматически как `make_sdk`)
4. Run once → проверьте output
5. Добавьте xR2 → Track Event
6. Замапьте trace_id из Get Prompt
7. Укажите event_name (из настроек Analytics); source_name заполнится `make_sdk` если не менять
8. При необходимости заполните user_id/session_id/value/currency/metadata
9. Run once → должно вернуть статус success и event_id

---

## 📁 Файлы SDK

```
sdk/make/
├── app.json                    # Метаданные (версия, название)
├── base.json                   # Базовая конфигурация
├── connections/
│   └── xr2_api_key.json       # Connection JSON (скопируйте в UI)
└── modules/
    ├── getPrompt.json         # Модуль Get Prompt (скопируйте в UI)
    └── trackEvent.json        # Модуль Track Event (скопируйте в UI)
```

Просто откройте каждый `.json` файл и скопируйте содержимое в соответствующий раздел Make.com UI.

---

## 🆘 Проблемы?

### Connection test не проходит
- Проверьте API key на https://xr2.uk/api-keys
- Убедитесь что в common.headers есть: `"Authorization": "Bearer {{parameters.apiKey}}"`

### Модуль не отправляет JSON
- В communication.body добавьте: `"type": "json"`

### Optional параметры отправляются как null
- Используйте: `"{{if(parameters.field, parameters.field)}}"`

---

## 📚 Полная документация

Читайте **MAKE_SETUP_GUIDE.md** для подробных объяснений каждого блока.

---

## 🎯 Готово!

После настройки можете использовать xR2 в любых сценариях Make.com:

```
Webhook → xR2 Get Prompt → OpenAI → xR2 Track Event → Response
```

Успехов! 🚀
