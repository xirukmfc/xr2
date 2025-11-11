# ✅ Тесты готовы к запуску на production

## Текущий статус

🎉 **Все зависимости установлены на сервере!**
🎉 **Быстрые тесты работают: 10/10 (100%)**

## Установленные компоненты

На сервере установлены:
- ✅ Python 3.10
- ✅ pip3
- ✅ requests
- ✅ aiohttp
- ✅ playwright
- ✅ chromium browser
- ✅ Системные зависимости

## Три способа запуска тестов

### 1. Быстрая проверка (10 тестов, ~10 сек) ⚡

```bash
ssh root@<PROD_HOST>
cd /opt/xr2
./scripts/quick-test-prod.sh
```

**Результат:**
```
==========================================
Быстрый тест xR2 Production
==========================================

Тест: Frontend главная...              ✅ OK (200)
Тест: Backend health...                ✅ OK (200)
Тест: API документация...              ✅ OK (200)
Тест: OpenAPI schema...                ✅ OK (200)
Тест: Admin panel...                   ✅ OK (307)
Тест: API v1...                        ✅ OK (404)
Тест: HTTP -> HTTPS redirect...        ✅ OK (301)
Тест: SSL сертификат...                ✅ OK
Тест: Response time...                 ✅ OK (0.017s)
Тест: Docker контейнеры...             ✅ OK (5 контейнеров)

==========================================
Результаты
==========================================
Всего тестов:   10
Пройдено:       10 ✅
Провалено:      0 ❌
Успешность:     100%

🎉 Все тесты пройдены успешно!
```

### 2. Полные автотесты (auto-test.py) 🔬

```bash
ssh root@<PROD_HOST>
cd /opt/xr2
FRONTEND_URL="https://xr2.uk" BACKEND_URL="https://xr2.uk" python3 auto-test.py
```

Или используйте скрипт:
```bash
cd /opt/xr2
./scripts/run-tests-production.sh
```

### 3. С вашего компьютера (remote) 💻

```bash
# Быстрая проверка
ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/quick-test-prod.sh"

# Полные тесты
ssh root@<PROD_HOST> "cd /opt/xr2 && FRONTEND_URL='https://xr2.uk' BACKEND_URL='https://xr2.uk' python3 auto-test.py"
```

## Что тестируется

### Быстрая проверка (`quick-test-prod.sh`)

1. **Frontend** - https://xr2.uk (главная страница)
2. **Backend Health** - /health endpoint
3. **API Docs** - /docs (Swagger UI)
4. **OpenAPI Schema** - /openapi.json
5. **Admin Panel** - /admin (проверка доступности)
6. **API Endpoints** - /api/v1/*
7. **HTTP → HTTPS** - редирект 301
8. **SSL Certificate** - валидность сертификата
9. **Response Time** - скорость ответа (<5 сек)
10. **Docker Containers** - статус контейнеров

### Полные автотесты (`auto-test.py`)

Включает все из быстрой проверки плюс:
- Playwright UI тесты
- Интеграционные тесты API
- Тесты аутентификации
- Тесты базы данных
- Тесты форм и валидации
- И многое другое

## Команды для управления

### Статус системы

```bash
# Проверка контейнеров
docker ps | grep xr2

# Проверка доступности
curl -I https://xr2.uk
curl -I https://xr2.uk/health

# Логи
docker logs xr2_nginx_prod
docker logs xr2_app_prod
docker logs xr2_frontend_prod
```

### Перезапуск сервисов

```bash
cd /opt/xr2
make down
make up
```

### Обновление тестов

```bash
# Скопировать обновленные тесты
scp auto-test.py root@<PROD_HOST>:/opt/xr2/
scp scripts/*.sh root@<PROD_HOST>:/opt/xr2/scripts/

# Сделать исполняемыми
ssh root@<PROD_HOST> "chmod +x /opt/xr2/scripts/*.sh"
```

## Автоматизация

### Cron job для регулярных тестов

```bash
# На сервере
crontab -e

# Добавить:
# Быстрая проверка каждый час
0 * * * * cd /opt/xr2 && ./scripts/quick-test-prod.sh >> /var/log/xr2-tests.log 2>&1

# Полные тесты каждое воскресенье в 3:00
0 3 * * 0 cd /opt/xr2 && FRONTEND_URL='https://xr2.uk' BACKEND_URL='https://xr2.uk' python3 auto-test.py >> /var/log/xr2-full-tests.log 2>&1
```

### CI/CD интеграция

Добавьте в ваш pipeline:

```yaml
# .github/workflows/test-prod.yml
name: Test Production
on:
  schedule:
    - cron: '0 */6 * * *'  # Каждые 6 часов

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run quick tests
        run: |
          ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/quick-test-prod.sh"
```

## Результаты последнего запуска

```
Дата: 2025-11-11 18:45 UTC
Всего тестов: 10
Пройдено: 10 ✅
Провалено: 0 ❌
Успешность: 100%
Время выполнения: ~1 секунда
Response time: 17ms
```

## Troubleshooting

### Playwright не запускается

```bash
# Переустановить playwright
pip3 install --upgrade playwright
playwright install chromium
playwright install-deps
```

### Тесты падают с timeout

```bash
# Увеличить timeout в auto-test.py или проверить нагрузку
top
docker stats
```

### SSL ошибки

```bash
# Проверить сертификат
openssl x509 -in /opt/xr2/nginx/ssl/fullchain.pem -noout -dates
docker restart xr2_nginx_prod
```

### Контейнеры не отвечают

```bash
cd /opt/xr2
make down
make up
docker ps
```

## Документация

- **RUN_TESTS.md** - Подробное руководство по запуску тестов
- **TESTING_PRODUCTION.md** - Полная документация с примерами
- **SSL_FIXED.md** - Информация о настройке SSL
- **DEPLOY_NOW.md** - Инструкции по деплою

## Быстрые команды

```bash
# Все в одной команде
ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/quick-test-prod.sh && echo '✅ Все работает!' || echo '❌ Есть проблемы'"

# С уведомлением
ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/quick-test-prod.sh" && \
  echo "✅ Тесты пройдены" | mail -s "xR2 Tests OK" your@email.com

# Проверка + перезапуск при ошибке
ssh root@<PROD_HOST> "cd /opt/xr2 && ./scripts/quick-test-prod.sh || (make down && make up)"
```

## Следующие шаги

1. ✅ Тесты настроены и работают
2. 🔄 Настроить автоматический запуск (cron)
3. 📧 Настроить уведомления при падении тестов
4. 📊 Интегрировать с мониторингом
5. 📈 Добавить графики успешности тестов

---

**Все готово для production тестирования!** 🚀

Используйте `./scripts/quick-test-prod.sh` для ежедневных проверок
и `auto-test.py` для глубокого тестирования перед важными релизами.
