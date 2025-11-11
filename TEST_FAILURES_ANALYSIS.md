# Анализ провалившихся тестов

## Статистика

**Всего тестов:** 46
**Пройдено:** 35 ✅ (76%)
**Провалено:** 11 ❌ (24%)

## Категории проблем

### 🔴 Критические (блокируют основную функциональность)

#### 1. External API - 500 Internal Server Error
**Тесты:** T3.4, T17.4
**Ошибка:** `RuntimeError: Unexpected message received: http.request`

**Проблема:**
```
POST /api/v1/get-prompt → 500 Internal Server Error
Error: Unexpected message received: http.request
```

**Причина:**
- Проблема с middleware в Starlette/FastAPI
- Клиент закрывает соединение до чтения тела запроса
- Возможно, timeout на стороне клиента

**Решение:**
1. Увеличить timeout в middleware
2. Добавить graceful shutdown handling
3. Обработать exception в middleware

**Код для исправления:**
```python
# app/middleware/error_handler.py
from starlette.middleware.base import BaseHTTPMiddleware

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            return response
        except RuntimeError as e:
            if "Unexpected message received" in str(e):
                # Client disconnected, log and return 499
                logger.warning(f"Client disconnected: {request.url}")
                return Response(
                    status_code=499,  # Client Closed Request
                    content="Client disconnected"
                )
            raise
```

### 🟡 Средние (функции работают, но есть проблемы)

#### 2. События и аналитика не отслеживаются
**Тесты:** T17.5, T17.8, T17.10
**Ошибка:** События не сохраняются/не отображаются

**Проблема:**
- Recent Events пусты
- Funnel не найдена
- A/B тест не чередует версии

**Возможные причины:**
1. Events не записываются из-за ошибки 500 в get-prompt
2. Задержка в обработке событий
3. Проблема с БД или кешем

**Решение:**
1. Исправить get-prompt API (см. выше)
2. Проверить что events middleware работает
3. Добавить логирование событий

#### 3. Публичные ссылки - контент не загружается
**Тесты:** T16.3, T16.4
**Ошибка:** Страница загрузилась, но контент не найден

**Проблема:**
```
Публичная страница загрузилась, но контент не найден
Недостаточная функциональность: 1/6
```

**Возможные причины:**
1. Селекторы изменились в UI
2. Задержка загрузки данных
3. SSR проблемы в Next.js

**Решение:**
1. Обновить селекторы в тестах
2. Добавить wait для загрузки данных
3. Проверить что API возвращает данные

#### 4. Пользовательские лимиты - пользователь не найден
**Тесты:** T6.1
**Ошибка:** `Option for 'User: eee' not found`

**Проблема:**
- Тест ищет пользователя 'eee'
- Пользователь не создан или селектор неверный

**Решение:**
1. Создать тестового пользователя перед тестом
2. Или использовать существующего (admin)

#### 5. API Tracking
**Тесты:** T7.2
**Ошибка:** `Недостаточно API запросов (0/3)`

**Проблема:**
- API запросы не логируются
- Или логируются не в том месте, где ищет тест

**Решение:**
1. Проверить что API logs middleware включен
2. Проверить таблицу product_api_logs

#### 6. Аналитика
**Тесты:** T11.2
**Ошибка:** `Не все функции сбора данных работают: 3/4 (требуется 100%)`

**Проблема:**
- Одна из четырех функций аналитики не работает

**Решение:**
1. Проверить какая именно функция не работает
2. Проверить логи

#### 7. AI Response в редакторе
**Тесты:** T7.3
**Ошибка:** `AI Response блок не найден`

**Проблема:**
- Тест не может найти блок с AI ответом
- Возможно, селектор изменился или нужен wait

**Решение:**
1. Обновить селектор
2. Добавить wait для появления блока

## Рекомендации по исправлению

### Приоритет 1 (Критично) 🔴

1. **Исправить External API (500 errors)**
   - Файл: `app/api/v1/external.py`
   - Добавить обработку RuntimeError в middleware
   - Увеличить timeouts
   - Тестирование: `curl -X POST https://xr2.uk/api/v1/get-prompt -H "Authorization: Bearer KEY" -d '{"slug":"test"}'`

### Приоритет 2 (Важно) 🟡

2. **Проверить Events tracking**
   - Проверить middleware
   - Проверить запись в БД
   - Добавить логирование

3. **Исправить публичные ссылки**
   - Обновить UI тесты
   - Проверить SSR

### Приоритет 3 (Желательно) 🟢

4. **Обновить тесты**
   - Обновить селекторы
   - Добавить waits
   - Использовать существующих пользователей

## Быстрое исправление для production

### 1. Временный workaround для External API

Добавить в `docker-compose.prod.yml`:
```yaml
app:
  environment:
    # Увеличить timeouts
    TIMEOUT: 60
    KEEP_ALIVE: 300
```

Перезапустить:
```bash
cd /opt/xr2
make down && make up
```

### 2. Проверить что ошибки логируются

```bash
# Проверить логи
docker logs xr2_app_prod | grep "500 Internal"

# Проверить БД
PGPASSWORD=***REMOVED_PG_PWD*** psql -U xr2_user -d xr2_db -h localhost \
  -c "SELECT COUNT(*) FROM product_api_logs WHERE status_code = 500;"
```

### 3. Мониторинг

Добавить алерты на 500 ошибки:
```bash
# Cron job для проверки ошибок
*/5 * * * * docker logs xr2_app_prod --since 5m 2>&1 | grep -c "500 Internal" | \
  awk '{if($1>10) print "Too many 500 errors: "$1}' | mail -s "xR2 Errors" admin@example.com
```

## Детальный лог ошибок

### External API Error (T3.4)
```
Request: POST /api/v1/get-prompt
Payload: {"slug": "auto-test-prompt-c425c441", "source_name": "admin", "status": "draft"}
Response: 500 Internal Server Error
Error: Unexpected message received: http.request
Latency: 0.017-0.019s
```

**15 запросов** - все вернули 500

### События (T17.4, T17.5)
```
Problem: Не удалось получить промпт (статус 500)
Result: События не могут быть отправлены
Impact: Recent Events пусты, аналитика не работает
```

### A/B тест (T17.10)
```
Problem: Чередование не обнаружено
Versions received: set() (пусто)
Reason: Промпты не возвращаются из-за 500 ошибки
```

## Проверка здоровья системы

```bash
# 1. Проверка API
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer xr2_prod_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug":"test-prompt","source_name":"admin"}' \
  -v

# 2. Проверка БД
docker exec xr2_postgres_prod psql -U xr2_user -d xr2_db -c "SELECT version();"

# 3. Проверка Redis
docker exec xr2_redis_prod redis-cli PING

# 4. Проверка логов
docker logs xr2_app_prod --tail 100 2>&1 | grep -i error
```

## Статус тестов по категориям

| Категория | Всего | Пройдено | Провалено | %  |
|-----------|-------|----------|-----------|-----|
| Аутентификация | 2 | 2 | 0 | 100% ✅ |
| Промпты | 3 | 3 | 0 | 100% ✅ |
| API Keys | 2 | 1 | 1 | 50% ⚠️ |
| Теги | 2 | 2 | 0 | 100% ✅ |
| Поиск | 2 | 2 | 0 | 100% ✅ |
| Лимиты | 1 | 0 | 1 | 0% ❌ |
| Логи | 3 | 1 | 2 | 33% ❌ |
| Редактор | 3 | 2 | 1 | 67% ⚠️ |
| Настройки | 1 | 1 | 0 | 100% ✅ |
| Безопасность | 2 | 2 | 0 | 100% ✅ |
| Аналитика | 3 | 2 | 1 | 67% ⚠️ |
| Производительность | 1 | 1 | 0 | 100% ✅ |
| Версии | 2 | 2 | 0 | 100% ✅ |
| Hotkeys | 2 | 2 | 0 | 100% ✅ |
| Массовые операции | 4 | 4 | 0 | 100% ✅ |
| Публичные ссылки | 4 | 2 | 2 | 50% ⚠️ |
| События/Аналитика | 10 | 6 | 4 | 60% ⚠️ |

## Выводы

**Хорошие новости:**
- ✅ 76% тестов проходят
- ✅ Базовая функциональность работает
- ✅ Аутентификация, промпты, теги, версии - всё OK
- ✅ UI тесты в основном проходят

**Что нужно исправить:**
- 🔴 External API (критично для production использования)
- 🟡 Events tracking (важно для аналитики)
- 🟡 Публичные ссылки (важно для sharing)

**Следующие шаги:**
1. Исправить middleware error handling
2. Перезапустить приложение
3. Запустить тесты снова
4. Ожидаемый результат: 45/46 тестов (98%)
