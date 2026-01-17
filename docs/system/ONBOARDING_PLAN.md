# План реализации Onboarding для xR2

## 🎯 Цель
Пользователь должен получить **работающий промпт через API** за **менее 5 минут** после регистрации.

---

## 📋 Что нужно сделать

### 1. Автоматическая генерация первого API ключа

**Когда:** При регистрации нового пользователя

**Как:**
- В `app/api/auth.py` после создания пользователя и workspace
- Автоматически создать ProductAPIKey с именем "Default Key"
- Сохранить ключ в сессии/контексте для показа в onboarding

**Код:**
```python
# В register_user и google_login после создания workspace
default_api_key = ProductAPIKey(
    name="Default Key",
    description="Auto-generated default API key",
    user_id=new_user.id,
    key_hash=key_hash,
    key_prefix=key_prefix,
    encrypted_key=encrypted_key
)
session.add(default_api_key)
```

**Frontend:**
- Сохранить API ключ в localStorage после регистрации
- Использовать в onboarding flow

---

### 2. Welcome Screen после регистрации

**Когда:** Первый вход пользователя (проверка по `created_at` или флагу `onboarding_completed`)

**Где:** Новая страница `/onboarding` или модальное окно

**Содержание:**

```
┌─────────────────────────────────────────────┐
│  🎉 Welcome to xR2!                        │
│                                             │
│  Let's get you started in 3 steps:        │
│                                             │
│  1️⃣  Create your first prompt              │
│  2️⃣  Get your API endpoint                 │
│  3️⃣  Start using it in your app           │
│                                             │
│  [Get Started]  [Skip for now]             │
└─────────────────────────────────────────────┘
```

**Реализация:**
- Проверка в `prompt-editor/app/prompts/page.tsx` или `app/page.tsx`
- Если пользователь новый → редирект на `/onboarding`
- Или показ модального окна поверх основного интерфейса

---

### 3. Путь после создания первого промпта

**Проблема:** Пользователь создал промпт, но не знает что делать дальше.

**Решение:** Показывать **"Integration Guide"** сразу после создания промпта.

**Где:** После создания промпта в редакторе или на странице промптов

**Что показывать:**

#### Вариант A: Модальное окно "How to use this prompt"

```
┌─────────────────────────────────────────────┐
│  ✅ Prompt created successfully!           │
│                                             │
│  Your API endpoint:                        │
│  ┌─────────────────────────────────────┐   │
│  │ GET /api/v1/get-prompt/{slug}       │   │
│  │ https://xr2.uk/api/v1/get-prompt/  │   │
│  │        welcome-message              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Your API Key:                              │
│  ┌─────────────────────────────────────┐   │
│  │ xr2_prod_abc123...                  │   │
│  │ [Copy]                               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  How do you want to use it?                │
│                                             │
│  [Make.com]  [n8n]  [Zapier]             │
│  [Code]      [Other]                      │
│                                             │
│  [Show me examples]                        │
└─────────────────────────────────────────────┘
```

#### Вариант B: Баннер на странице промпта

После создания промпта показывать баннер сверху:

```
┌─────────────────────────────────────────────┐
│  🎉 New prompt created!                    │
│                                             │
│  Ready to use? Get your integration code:  │
│  [Show Integration Guide]                  │
│                                             │
│  [Dismiss]                                 │
└─────────────────────────────────────────────┘
```

---

### 4. Integration Guide (вместо Swagger)

**Проблема:** Swagger слишком сложен для основной ЦА.

**Решение:** Простая страница `/prompts/[id]/integrate` с примерами для разных платформ.

**Структура:**

```
┌─────────────────────────────────────────────┐
│  How to use: "Welcome Message"             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ API Endpoint                         │   │
│  │ https://xr2.uk/api/v1/get-prompt/   │   │
│  │        welcome-message              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ API Key                              │   │
│  │ xr2_prod_abc123...                  │   │
│  │ [Copy]  [Show]                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Choose your platform:                     │
│  [Make.com] [n8n] [Zapier] [Code]         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Make.com Integration                │   │
│  │                                     │   │
│  │ 1. Add HTTP module                  │   │
│  │ 2. Set URL:                          │   │
│  │    https://xr2.uk/api/v1/get-      │   │
│  │    prompt/welcome-message          │   │
│  │ 3. Add header:                      │   │
│  │    Authorization: Bearer YOUR_KEY   │   │
│  │                                     │   │
│  │ [Copy code]  [Open Make.com]       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Need help? [View full docs]               │
└─────────────────────────────────────────────┘
```

**Что показывать для каждой платформы:**

#### Make.com / n8n:
- Пошаговая инструкция с скриншотами (опционально)
- Пример конфигурации модуля
- Кнопка "Copy configuration JSON"
- Ссылка на документацию платформы

#### Code (для разработчиков):
- Примеры на разных языках (cURL, Python, JavaScript, PHP)
- Простые примеры без сложных библиотек
- Кнопка "Copy code"

#### Zapier / Bubble.io:
- Инструкции по настройке
- Примеры использования

---

## 🗂 Структура файлов

### Новые компоненты:

1. **`prompt-editor/components/onboarding-welcome.tsx`**
   - Welcome screen компонент
   - Показывается при первом входе

2. **`prompt-editor/components/integration-guide.tsx`**
   - Компонент с примерами интеграции
   - Табы для разных платформ
   - Копирование кода

3. **`prompt-editor/app/prompts/[id]/integrate/page.tsx`**
   - Страница с полным integration guide
   - Можно открыть из любого промпта

4. **`prompt-editor/components/prompt-integration-banner.tsx`**
   - Баннер после создания промпта
   - Показывает quick start

### Изменения в существующих файлах:

1. **`app/api/auth.py`**
   - Добавить автогенерацию API ключа при регистрации
   - Возвращать API ключ в ответе регистрации

2. **`prompt-editor/app/prompts/page.tsx`**
   - Проверка нового пользователя
   - Редирект на onboarding или показ welcome modal

3. **`prompt-editor/components/new-prompt-modal.tsx`**
   - После создания промпта показывать integration guide
   - Или редирект на страницу интеграции

---

## 📝 Примеры кода для Integration Guide

### cURL:
```bash
curl -X GET "https://xr2.uk/api/v1/get-prompt/welcome-message" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Python:
```python
import requests

response = requests.get(
    "https://xr2.uk/api/v1/get-prompt/welcome-message",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
prompt = response.json()
print(prompt['content'])
```

### JavaScript:
```javascript
fetch('https://xr2.uk/api/v1/get-prompt/welcome-message', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(res => res.json())
.then(data => console.log(data.content));
```

### Make.com модуль:
```json
{
  "url": "https://xr2.uk/api/v1/get-prompt/welcome-message",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

---

## 🎨 UI/UX детали

### Welcome Screen:
- **Дизайн:** Чистый, дружелюбный
- **Анимация:** Легкая анимация появления
- **CTA:** Одна главная кнопка "Get Started"
- **Опции:** "Skip for now" внизу

### Integration Guide:
- **Табы:** Переключение между платформами
- **Копирование:** Одна кнопка "Copy" для каждого примера
- **Визуализация:** Подсветка синтаксиса для кода
- **Действия:** Кнопки "Open Make.com", "View Docs"

### Баннер после создания промпта:
- **Позиция:** Вверху страницы промптов
- **Дизайн:** Success стиль (зеленый)
- **Действия:** "Show Integration Guide", "Dismiss"
- **Автозакрытие:** Через 24 часа или после первого использования API

---

## ✅ Чеклист реализации

### Фаза 1: Автогенерация API ключа
- [ ] Добавить создание API ключа в `register_user`
- [ ] Добавить создание API ключа в `google_login`
- [ ] Вернуть API ключ в ответе регистрации
- [ ] Сохранить API ключ в localStorage на фронтенде

### Фаза 2: Welcome Screen
- [ ] Создать компонент `onboarding-welcome.tsx`
- [ ] Добавить проверку нового пользователя
- [ ] Показывать welcome screen при первом входе
- [ ] Добавить кнопку "Skip"

### Фаза 3: Integration Guide
- [ ] Создать компонент `integration-guide.tsx`
- [ ] Создать страницу `/prompts/[id]/integrate`
- [ ] Добавить примеры для разных платформ
- [ ] Реализовать копирование кода
- [ ] Добавить подсветку синтаксиса

### Фаза 4: Интеграция в flow
- [ ] Показывать integration guide после создания промпта
- [ ] Добавить баннер на странице промпта
- [ ] Добавить ссылку "How to use" в меню промпта

---

## 🚀 Приоритеты

**Высокий приоритет:**
1. Автогенерация API ключа ✅
2. Welcome screen ✅
3. Integration Guide с примерами кода ✅

**Средний приоритет:**
4. Примеры для Make.com/n8n
5. Баннер после создания промпта

**Низкий приоритет:**
6. Скриншоты для платформ
7. Видео-туториалы

---

*Последнее обновление: 2025-01-09*

