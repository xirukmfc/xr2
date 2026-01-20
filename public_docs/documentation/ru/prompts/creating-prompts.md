# Создание промптов

Узнайте, как создавать и структурировать промпты в xR2.

## Создание нового промпта

1. Перейдите на страницу **Prompts**
2. Нажмите кнопку **+ New Prompt**
3. Заполните обязательные поля:
    - **Name** — Понятное название (например, "Customer Support Bot")
4. Нажмите **Create**

## Написание эффективных промптов

### System Prompt

System prompt определяет поведение, личность и ограничения AI. Лучшие практики:

```
You are a customer support assistant for TechStore.

Your responsibilities:
- Answer product questions accurately
- Help with order status and returns
- Escalate complex issues to human agents

Guidelines:
- Be friendly but professional
- Keep responses under 150 words
- Never discuss competitor products
- If unsure, say "Let me connect you with a specialist"
```

**Советы:**

- Конкретно указывайте роль AI
- Перечисляйте четкие правила, что делать и чего избегать
- Определяйте формат и длину ответа
- Указывайте поведение в граничных случаях

### User Prompt

User prompt — это шаблон, который заполняется динамическими данными. Используйте переменные для персонализации:

```
Customer: {{customer_name}}
Membership: {{membership_tier}}
Previous purchases: {{purchase_count}}

Question: {{question}}

Please provide a helpful response appropriate for their membership level.
```

**Советы:**

- Используйте описательные имена переменных
- Предоставляйте контекст, необходимый AI
- Структурируйте входные данные четко

## Организация с помощью тегов

Теги помогают категоризировать и фильтровать промпты:

1. Начните вводить тег и система покажет доступны
2. Если у вас еще нет тегов, то вы можете ввести его название в поиске и потом нажать **Create Tag**
3. Выберите цвет
4. Нажмите **Save**

**Распространенные стратегии тегирования:**

- По области продукта: `checkout`, `profile`, `search`
- По команде: `marketing`, `support`, `product`
- По стадии: `experimental`, `production`, `deprecated`

## Лучшие практики структурирования промптов

### 1. Делайте System Prompts сфокусированными

Одна ответственность на промпт. Вместо мега-промпта, который делает все, создавайте специализированные промпты:

- `support-general` — Общие вопросы
- `support-returns` — Запросы на возврат
- `support-technical` — Технические проблемы

### 2. Используйте переменные стратегически

Включайте только те переменные, которые действительно влияют на поведение AI:

**Хорошо:**
```
Customer tier: {{tier}} — affects discount eligibility
Order history: {{recent_orders}} — for context
```

**Избегайте:**
```
Current timestamp: {{timestamp}} — rarely useful
Request ID: {{request_id}} — AI doesn't need this
```

### 3. Тестируйте граничные случаи

Перед развертыванием тестируйте с:

- Пустыми значениями переменных
- Очень длинными входными данными
- Неожиданными типами данных
- Граничными сценариями

## Следующие шаги

- [Переменные](variables.md) — Настройка динамического контента
- [Тестирование промптов](testing.md) — Валидация перед развертыванием
- [Версии и развертывание](versions.md) — Выпуск в продакшен
