# Документация xR2 Make.com SDK

## 📚 Навигация по файлам

### Для быстрого старта

| Файл | Назначение | Когда использовать |
|------|------------|-------------------|
| **[QUICK_START.md](QUICK_START.md)** | Быстрая настройка за 5 минут | ⭐ Начните отсюда! Копи-паста JSON в Make.com |
| **[readme.md](readme.md)** | Обзор проекта | Краткая информация о проекте |

### Для глубокого изучения

| Файл | Назначение | Когда использовать |
|------|------------|-------------------|
| **[MAKE_SETUP_GUIDE.md](MAKE_SETUP_GUIDE.md)** | Полная документация | Детальное объяснение каждого блока, troubleshooting |
| **[ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md)** | Справочник разработчика | Архитектура, типы данных, IML, чеклисты |

### Конфигурационные файлы

| Файл | Описание | Куда копировать |
|------|----------|-----------------|
| **[app.json](app.json)** | Метаданные приложения | Основные настройки приложения |
| **[base.json](base.json)** | Базовая конфигурация | Make.com → Base |
| **[connections/xr2_api_key.json](connections/xr2_api_key.json)** | Connection с API Key | Make.com → Connections |
| **[modules/getPrompt.json](modules/getPrompt.json)** | Модуль Get Prompt | Make.com → Modules |
| **[modules/trackEvent.json](modules/trackEvent.json)** | Модуль Track Event | Make.com → Modules |

### Устаревшие файлы

| Файл | Статус |
|------|--------|
| **UI_SETUP_GUIDE.md** | ❌ Устарело - не используйте (основано на старой документации) |

---

## 🚀 Сценарий использования

### Первая настройка (5-10 минут)

```
1. Откройте QUICK_START.md
2. Следуйте инструкциям
3. Скопируйте JSON из файлов в Make.com UI
4. Протестируйте
```

### При возникновении проблем

```
1. Откройте MAKE_SETUP_GUIDE.md
2. Найдите раздел "Частые проблемы"
3. Следуйте решению
```

### Для понимания архитектуры

```
1. Откройте ИНСТРУКЦИЯ.md
2. Изучите разделы:
   - Основные компоненты
   - Как работает Make.com Custom App
   - IML и типы данных
```

### Обновление приложения

```
1. Измените нужный .json файл
2. Скопируйте обновленный JSON в Make.com UI
3. Протестируйте
4. Обновите версию в app.json (если нужно)
```

---

## 📖 Содержание файлов

### QUICK_START.md
- Минимальная инструкция без лишних слов
- Готовые JSON блоки
- 3 простых шага: создать → скопировать → протестировать

### MAKE_SETUP_GUIDE.md
- Пошаговая настройка с объяснениями
- Разбор структуры каждого блока
- **Communication** - как работает API запрос
- **Parameters** - входные поля (mappable parameters)
- **Interface** - выходные поля
- **IML** - язык выражений Make.com
- Примеры использования
- Troubleshooting

### ИНСТРУКЦИЯ.md
- Архитектура Make.com Custom App
- Схема взаимодействия Base → Connection → Module
- Справочник по IML функциям
- Типы данных (text, array, collection, etc.)
- Разница между Array и Collection
- Динамические структуры
- Тестирование (connection test, curl, scenario)
- Публикация в Marketplace
- Версионирование
- Частые ошибки с решениями
- Чеклисты перед тестированием и публикацией

### base.json
```json
{
    "baseUrl": "https://xr2.uk/api/v1",
    "headers": {...},
    "log": {"sanitize": [...]},
    "response": {"error": {...}}
}
```

### connections/xr2_api_key.json
```json
{
    "type": "apikey",
    "parameters": [...],
    "common": {"headers": {...}},
    "test": {...}
}
```

### modules/getPrompt.json
```json
{
    "parameters": [...],        // Входные поля
    "interface": [...],         // Выходные поля
    "communication": {...}      // API запрос/ответ
}
```

### modules/trackEvent.json
```json
{
    "parameters": [...],        // trace_id, event_name, source_name, user/session/value/currency, metadata
    "interface": [...],         // status, event_id, trace_id, event_name, timestamp, is_duplicate
    "communication": {...}      // POST /events
}
```

---

## 🎯 Рекомендуемый порядок чтения

### Новый пользователь:
1. **readme.md** - что это за проект
2. **QUICK_START.md** - настроить за 5 минут
3. Тестирование
4. **MAKE_SETUP_GUIDE.md** - если нужны детали

### Опытный разработчик:
1. **ИНСТРУКЦИЯ.md** - архитектура и справочник
2. **JSON файлы** - просмотр структуры
3. Настройка в Make.com
4. **MAKE_SETUP_GUIDE.md** - при необходимости

### При проблемах:
1. **MAKE_SETUP_GUIDE.md** → раздел "Частые проблемы"
2. **ИНСТРУКЦИЯ.md** → раздел "Частые ошибки"
3. Официальная документация Make.com

---

## 🔗 Внешние ссылки

### Make.com
- Apps Console: https://eu2.make.com/apps
- Developer Hub: https://developers.make.com/custom-apps-documentation
- Community: https://community.make.com/

### xR2
- Dashboard: https://xr2.uk
- API Keys: https://xr2.uk/api-keys
- API Docs: https://xr2.gitbook.io/docs

---

## ✅ Быстрый чеклист

### Настройка завершена если:
- ✅ Скопировал base.json в Base
- ✅ Скопировал connection в Connections
- ✅ Скопировал 2 модуля в Modules
- ✅ Connection test прошел
- ✅ Scenario с Get Prompt работает
- ✅ Track Event отправляет события

### Готов к публикации если:
- ✅ Все из предыдущего чеклиста
- ✅ Протестировано на реальных данных
- ✅ Обновлена версия в app.json
- ✅ Есть ссылка на документацию
- ✅ Указан support email

---

## 💡 Советы

1. **Начинайте с QUICK_START.md** - это сэкономит время
2. **Держите ИНСТРУКЦИЯ.md под рукой** - там справочник по IML и типам данных
3. **Используйте curl для локального тестирования** - быстрее чем через Make UI
4. **Читайте validation ошибки в Make.com** - они обычно точно указывают на проблему
5. **Проверяйте API ответы** - Make показывает полный request/response в режиме отладки

---

Начните с **QUICK_START.md** и вы будете готовы к работе через 5 минут! 🚀
