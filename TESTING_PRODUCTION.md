# Запуск автотестов на production сервере

## Обзор

Файл `auto-test.py` содержит автоматические тесты для всех функций xR2 Platform.
Тесты используют переменные окружения для настройки URL.

## Два способа запуска

### Способ 1: Напрямую на сервере (рекомендуется)

**Преимущества:**
- Полный доступ к браузеру Playwright
- Можно смотреть screenshots
- Проще отладка

**Шаги:**

1. Скопируйте файлы на сервер:
```bash
# На вашем локальном компьютере
scp auto-test.py root@<PROD_HOST>:/opt/xr2/
scp scripts/run-tests-production.sh root@<PROD_HOST>:/opt/xr2/scripts/
```

2. Подключитесь к серверу:
```bash
ssh root@<PROD_HOST>
```

3. Перейдите в директорию проекта:
```bash
cd /opt/xr2
```

4. Запустите скрипт тестирования:
```bash
./scripts/run-tests-production.sh
```

Скрипт автоматически:
- Проверит зависимости
- Установит недостающие пакеты (если нужно)
- Настроит URL на `https://xr2.uk`
- Запустит тесты
- Сохранит результаты

### Способ 2: Через Docker контейнер

**Преимущества:**
- Не нужно устанавливать зависимости на сервер
- Быстрый запуск

**Ограничения:**
- Нет браузера (Playwright тесты не сработают)
- Только API тесты

**Шаги:**

1. Скопируйте скрипт на сервер:
```bash
scp scripts/run-tests-docker.sh root@<PROD_HOST>:/opt/xr2/scripts/
```

2. На сервере запустите:
```bash
cd /opt/xr2
./scripts/run-tests-docker.sh
```

## Ручной запуск

Если нужно больше контроля, можно запустить тесты вручную:

```bash
# На сервере
cd /opt/xr2

# Установите зависимости (если еще не установлены)
pip3 install requests aiohttp playwright
playwright install chromium

# Запустите тесты с custom URL
FRONTEND_URL="https://xr2.uk" \
BACKEND_URL="https://xr2.uk" \
python3 auto-test.py
```

## Переменные окружения

Тесты используют следующие переменные:

| Переменная | По умолчанию | Production значение |
|------------|--------------|---------------------|
| `FRONTEND_URL` | `http://127.0.0.1:3000` | `https://xr2.uk` |
| `BACKEND_URL` | `http://127.0.0.1:8000` | `https://xr2.uk` |

## Установка зависимостей

### На Ubuntu/Debian сервере:

```bash
# Установка Python пакетов
pip3 install requests aiohttp playwright

# Установка браузера для Playwright
playwright install chromium

# Установка системных зависимостей для браузера
playwright install-deps
```

### В Docker контейнере:

Добавьте в `Dockerfile`:
```dockerfile
RUN pip install playwright requests aiohttp && \
    playwright install chromium && \
    playwright install-deps
```

## Результаты тестов

После запуска тестов результаты сохраняются в:

```
test-results-YYYYMMDD-HHMMSS/
├── test-output.log        # Полный лог тестов
└── screenshots/           # Скриншоты (если были ошибки)
```

## Примеры использования

### Запуск только API тестов

```bash
# Установите фильтр через код или параметры
FRONTEND_URL="https://xr2.uk" \
BACKEND_URL="https://xr2.uk" \
python3 auto-test.py --api-only  # если поддерживается
```

### Запуск с подробным логированием

```bash
FRONTEND_URL="https://xr2.uk" \
BACKEND_URL="https://xr2.uk" \
python3 auto-test.py --verbose
```

### Запуск конкретного теста

Если `auto-test.py` поддерживает фильтрацию:
```bash
FRONTEND_URL="https://xr2.uk" \
BACKEND_URL="https://xr2.uk" \
python3 auto-test.py --test="test_authentication"
```

## Troubleshooting

### Проблема: Playwright не может найти браузер

**Решение:**
```bash
playwright install chromium
playwright install-deps
```

### Проблема: SSL certificate verification failed

**Решение:** Добавьте опцию игнорирования SSL в тестах или используйте валидный сертификат.

Для временного решения:
```python
# В коде тестов
requests.get(url, verify=False)
```

### Проблема: Connection refused

**Решение:** Проверьте что сервисы запущены:
```bash
docker ps
curl https://xr2.uk/health
```

### Проблема: Тесты проходят локально, но не на сервере

Возможные причины:
1. Разные версии зависимостей
2. Firewall блокирует запросы
3. Разные данные в БД

**Решение:**
```bash
# Проверьте версии
python3 --version
pip3 list | grep -E "requests|aiohttp|playwright"

# Проверьте firewall
ufw status

# Проверьте логи
docker logs xr2_app_prod
docker logs xr2_nginx_prod
```

## CI/CD Integration

Для автоматического запуска тестов при деплое, добавьте в pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Run tests on production
  run: |
    ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/run-tests-production.sh"
```

## Расписание автотестов

Для регулярного запуска тестов, добавьте cron job на сервере:

```bash
# Запуск тестов каждый день в 3:00 утра
0 3 * * * cd /opt/xr2 && ./scripts/run-tests-production.sh >> /var/log/xr2-tests.log 2>&1
```

Добавить в crontab:
```bash
crontab -e
# Добавьте строку выше
```

## Мониторинг результатов

Создайте скрипт для отправки уведомлений:

```bash
# scripts/run-tests-with-notification.sh
#!/bin/bash
./scripts/run-tests-production.sh
if [ $? -eq 0 ]; then
    echo "✅ Тесты пройдены" | mail -s "xR2 Tests: PASSED" admin@example.com
else
    echo "❌ Тесты провалены" | mail -s "xR2 Tests: FAILED" admin@example.com
fi
```

## Быстрые команды

```bash
# Установка и запуск (полный цикл)
cd /opt/xr2 && ./scripts/run-tests-production.sh

# Только запуск (если зависимости установлены)
cd /opt/xr2 && FRONTEND_URL="https://xr2.uk" BACKEND_URL="https://xr2.uk" python3 auto-test.py

# Проверка что тесты найдут сервисы
curl -I https://xr2.uk
curl -I https://xr2.uk/health

# Просмотр последних результатов
ls -lt test-results-* | head -1
tail -f test-results-*/test-output.log
```

---

**Важно:** Перед запуском тестов на production убедитесь, что:
1. ✅ Сервисы запущены и доступны
2. ✅ SSL сертификаты валидны
3. ✅ База данных заполнена тестовыми данными
4. ✅ API ключи настроены
