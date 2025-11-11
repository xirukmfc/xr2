# 🧪 Запуск тестов на production сервере xr2.uk

## Быстрый старт

### 1. Быстрая проверка (smoke tests)

Запускает простые проверки доступности основных endpoints:

```bash
# На сервере
cd /opt/xr2
./scripts/quick-test-prod.sh
```

**Результат:** ~10 секунд, проверка основных endpoints

### 2. Полные автотесты

Запускает полный набор тестов из `auto-test.py`:

```bash
# На сервере
cd /opt/xr2
./scripts/run-tests-production.sh
```

**Результат:** несколько минут, полная проверка всех функций

## Три способа запуска

### Способ 1: Скрипт быстрой проверки (самый простой)

```bash
# Скопируйте скрипт на сервер
scp scripts/quick-test-prod.sh root@<PROD_HOST>:/opt/xr2/scripts/

# Запустите на сервере
ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/quick-test-prod.sh"
```

**Что проверяет:**
- ✅ Frontend главная страница
- ✅ Backend health check
- ✅ API документация
- ✅ OpenAPI schema
- ✅ Admin panel
- ✅ HTTP → HTTPS редирект
- ✅ SSL сертификат
- ✅ Response time
- ✅ Docker контейнеры

### Способ 2: Полные автотесты (подробно)

```bash
# Скопируйте файлы на сервер
scp auto-test.py root@<PROD_HOST>:/opt/xr2/
scp scripts/run-tests-production.sh root@<PROD_HOST>:/opt/xr2/scripts/

# Запустите на сервере
ssh root@<PROD_HOST>
cd /opt/xr2
chmod +x scripts/run-tests-production.sh
./scripts/run-tests-production.sh
```

**Что делает скрипт:**
1. Проверяет установлены ли зависимости
2. Устанавливает недостающие (requests, aiohttp, playwright)
3. Проверяет доступность сервисов
4. Запускает полный набор тестов
5. Сохраняет результаты в `test-results-YYYYMMDD-HHMMSS/`

### Способ 3: Ручной запуск с параметрами

```bash
# На сервере
cd /opt/xr2

# Установите зависимости (один раз)
pip3 install requests aiohttp playwright
playwright install chromium

# Запустите тесты
FRONTEND_URL="https://xr2.uk" \
BACKEND_URL="https://xr2.uk" \
python3 auto-test.py
```

## Установка зависимостей

### Минимальный набор (для API тестов):

```bash
pip3 install requests aiohttp
```

### Полный набор (включая UI тесты):

```bash
pip3 install requests aiohttp playwright
playwright install chromium
playwright install-deps  # Системные зависимости
```

## Результаты тестов

### Быстрая проверка

Вывод в консоль:
```
==========================================
Быстрый тест xR2 Production
==========================================

Тест: Frontend главная...              ✅ OK (200)
Тест: Backend health...                ✅ OK (200)
Тест: API документация...              ✅ OK (200)
...

==========================================
Результаты
==========================================
Всего тестов:   10
Пройдено:       10 ✅
Провалено:      0 ❌

🎉 Все тесты пройдены успешно!
```

### Полные автотесты

Файлы результатов:
```
test-results-20251111-180000/
├── test-output.log        # Полный лог
└── screenshots/           # Скриншоты (при ошибках)
    ├── error-1.png
    └── error-2.png
```

## Переменные окружения

| Переменная | Описание | Production | Local |
|------------|----------|------------|-------|
| `FRONTEND_URL` | URL фронтенда | `https://xr2.uk` | `http://127.0.0.1:3000` |
| `BACKEND_URL` | URL бэкенда | `https://xr2.uk` | `http://127.0.0.1:8000` |

## Примеры команд

### Проверка доступности перед тестами

```bash
# Проверка frontend
curl -I https://xr2.uk

# Проверка backend
curl -I https://xr2.uk/health

# Проверка API
curl -I https://xr2.uk/docs
```

### Просмотр результатов

```bash
# Последние результаты
ls -lt test-results-* | head -1

# Просмотр лога
cat test-results-*/test-output.log | less

# Поиск ошибок
grep -i "error\|fail" test-results-*/test-output.log

# Просмотр скриншотов
ls -lh screenshots/
```

### Очистка старых результатов

```bash
# Удалить результаты старше 7 дней
find test-results-* -type d -mtime +7 -exec rm -rf {} \;

# Удалить все результаты
rm -rf test-results-*
```

## Автоматизация

### Cron job для регулярных тестов

```bash
# Добавить в crontab
crontab -e

# Запуск каждый день в 3:00 утра
0 3 * * * cd /opt/xr2 && ./scripts/quick-test-prod.sh >> /var/log/xr2-tests.log 2>&1

# Полные тесты каждую неделю в воскресенье
0 2 * * 0 cd /opt/xr2 && ./scripts/run-tests-production.sh
```

### Отправка уведомлений

```bash
# Создайте скрипт с уведомлениями
cat > scripts/test-with-notify.sh << 'EOF'
#!/bin/bash
cd /opt/xr2
./scripts/quick-test-prod.sh
if [ $? -eq 0 ]; then
    echo "✅ xR2 Tests PASSED" | mail -s "xR2 Tests" admin@example.com
else
    echo "❌ xR2 Tests FAILED" | mail -s "xR2 Tests FAILED" admin@example.com
fi
EOF

chmod +x scripts/test-with-notify.sh
```

## Troubleshooting

### Проблема: Cannot find playwright

```bash
pip3 install playwright
playwright install chromium
```

### Проблема: Permission denied

```bash
chmod +x scripts/*.sh
```

### Проблема: Connection refused

Проверьте что сервисы запущены:
```bash
docker ps | grep xr2
make up
```

### Проблема: SSL certificate error

Добавьте `-k` флаг в curl или используйте:
```bash
curl --insecure https://xr2.uk
```

Или в Python:
```python
requests.get(url, verify=False)
```

### Проблема: Тесты долго выполняются

Playwright тесты могут быть медленными. Используйте:
- Быструю проверку: `quick-test-prod.sh`
- Только API тесты (если поддерживается в auto-test.py)
- Headless mode для Playwright

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test-production.yml
name: Test Production
on:
  schedule:
    - cron: '0 3 * * *'  # Каждый день в 3 AM
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests on server
        run: |
          ssh root@<PROD_HOST> << 'EOF'
            cd /opt/xr2
            ./scripts/quick-test-prod.sh
          EOF
```

## Чек-лист перед тестированием

- [ ] Сервисы запущены (`docker ps`)
- [ ] SSL сертификаты валидны
- [ ] База данных доступна
- [ ] Достаточно места на диске
- [ ] Зависимости установлены
- [ ] Порты 80, 443 открыты

## Полезные команды

```bash
# Статус системы
docker ps
df -h
free -h

# Логи сервисов
docker logs xr2_nginx_prod
docker logs xr2_app_prod
docker logs xr2_frontend_prod

# Перезапуск сервисов
make down && make up

# Быстрая проверка
curl -I https://xr2.uk && echo "OK" || echo "FAIL"
```

---

**Готово!** Теперь вы можете запускать тесты на production сервере тремя разными способами.

**Рекомендация:** Начните с быстрой проверки (`quick-test-prod.sh`), а полные тесты запускайте периодически или после важных изменений.
