# 🧪 Автотесты xR2 Platform

## 📋 Обзор

Автотесты xR2 Platform позволяют автоматически проверить все функции приложения как локально, так и на сервере.

## 🚀 Запуск автотестов

### Локальный запуск

```bash
# Запуск автотестов локально (требует запущенное приложение)
make test-local

# Или напрямую
python auto-test.py
```

### Запуск на сервере

```bash
# Запуск автотестов на production сервере
make test-server ADMIN_PASSWORD=your_admin_password

# С дополнительными параметрами
make test-server ADMIN_PASSWORD=***REMOVED_ADMIN_PWD*** ADMIN_USERNAME=www
```

### Запуск через Docker Compose

```bash
# Запуск тестов в Docker контейнере
docker-compose -f docker-compose.test.yml run --rm autotest

# С переменными окружения
SERVER_URL=https://xr2.uk ADMIN_PASSWORD=your_password docker-compose -f docker-compose.test.yml run --rm autotest
```

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `SERVER_URL` | URL сервера для тестирования | `https://xr2.uk` |
| `FRONTEND_URL` | URL фронтенда | `https://xr2.uk` |
| `BACKEND_URL` | URL бэкенда | `https://xr2.uk` |
| `TEST_USERNAME` | Имя пользователя для тестов | `admin` |
| `TEST_PASSWORD` | Пароль для тестов | **Обязательно** |
| `HEADLESS` | Запуск браузера в headless режиме | `true` |
| `BROWSER_TIMEOUT` | Таймаут браузера (мс) | `30000` |
| `TEST_TIMEOUT` | Таймаут тестов (сек) | `300` |

### Локальная конфигурация

Для локальных тестов автотесты используют:
- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- Тестовый пользователь: `www` / `***REMOVED_ADMIN_PWD***`

## 📊 Результаты тестов

### Файлы результатов

- **`test_report.json`** - Детальный отчет о результатах тестов
- **`test_screenshots/`** - Скриншоты ошибок и ключевых моментов

### Структура отчета

```json
{
  "test_run_id": "uuid",
  "start_time": "2025-10-16T19:30:00Z",
  "end_time": "2025-10-16T19:35:00Z",
  "duration": 300,
  "total_tests": 25,
  "passed": 23,
  "failed": 2,
  "skipped": 0,
  "tests": [
    {
      "test_id": "auth_login",
      "name": "Authentication Login",
      "status": "passed",
      "duration": 5.2,
      "screenshots": []
    }
  ]
}
```

## 🔧 Настройка для разных окружений

### Development

```bash
# Локальная разработка
make test-local
```

### Staging

```bash
# Тестирование staging сервера
SERVER_URL=https://staging.xr2.uk make test-server ADMIN_PASSWORD=staging_password
```

### Production

```bash
# Тестирование production сервера
make test-server ADMIN_PASSWORD=production_password
```

## 🐛 Отладка

### Проблемы с подключением

1. **Сервер недоступен**
   ```bash
   curl -f https://xr2.uk/health
   ```

2. **Неправильные учетные данные**
   - Проверьте `ADMIN_USERNAME` и `ADMIN_PASSWORD`
   - Убедитесь, что пользователь существует в системе

3. **Проблемы с браузером**
   - Увеличьте `BROWSER_TIMEOUT`
   - Проверьте доступность Playwright браузеров

### Логи тестов

```bash
# Просмотр логов Docker контейнера
docker logs xr2_autotest

# Просмотр логов приложения
make logs-app
```

## 📝 Добавление новых тестов

1. Создайте новый метод в классе `AutoTester`
2. Добавьте тест в список `tests` в методе `run_all_tests`
3. Обновите документацию

## 🔒 Безопасность

- **Никогда не коммитьте пароли** в репозиторий
- Используйте переменные окружения для чувствительных данных
- Ограничьте доступ к результатам тестов

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи тестов
2. Убедитесь в доступности сервера
3. Проверьте правильность учетных данных
4. Создайте issue в репозитории
