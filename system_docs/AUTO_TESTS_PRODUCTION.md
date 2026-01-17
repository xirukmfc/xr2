# 🧪 Запуск автотестов на Production

## 📋 Быстрый старт

### 1. Подключение к серверу

```bash
ssh root@<PROD_HOST>
cd /opt/xr2
```

### 2. Запуск тестов

```bash
# Простой запуск
./scripts/run-tests-production-improved.sh

# Или напрямую через Python
python3 auto-test.py
```

---

## 🔧 Настройка

### Переменные окружения

Скрипт автоматически настраивает переменные для production:

```bash
export FRONTEND_URL="https://xr2.uk"
export BACKEND_URL="https://xr2.uk"
export LOG_TO_FILE="true"        # Сохранять логи в файл
export LOG_DIR="logs/auto-tests" # Директория для логов
export LOG_LEVEL="INFO"         # Уровень логирования (DEBUG, INFO, WARNING, ERROR)
```

### Установка зависимостей

Если зависимости не установлены, скрипт предложит их установить:

```bash
pip3 install requests aiohttp playwright python-dotenv
playwright install chromium
```

---

## 📊 Просмотр результатов

### Где находятся результаты

После запуска тестов создается директория с результатами:

```
test-results-YYYYMMDD-HHMMSS/
├── test-output.log          # Полный вывод тестов
├── test_report.json         # JSON отчет с результатами
└── test_screenshots/        # Скриншоты ошибок (если есть)
    ├── error_*.png
    └── ...
```

### Просмотр логов

```bash
# Посмотреть последние строки лога
tail -f test-results-*/test-output.log

# Посмотреть весь лог
cat test-results-*/test-output.log

# Поиск ошибок в логах
grep -i "error\|failed\|❌" test-results-*/test-output.log

# Поиск предупреждений
grep -i "warning\|⚠️" test-results-*/test-output.log
```

### Просмотр JSON отчета

```bash
# Красивый вывод JSON
cat test-results-*/test_report.json | python3 -m json.tool

# Только упавшие тесты
cat test-results-*/test_report.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
failed = [t for t in data if t.get('status') == 'failed']
print(json.dumps(failed, indent=2))
"
```

### Просмотр логов из файлов

Если включено `LOG_TO_FILE=true`, логи также сохраняются в:

```
logs/auto-tests/auto-test-YYYYMMDD-HHMMSS.log
```

```bash
# Посмотреть последний лог файл
ls -t logs/auto-tests/auto-test-*.log | head -1 | xargs tail -f

# Все логи
ls -lh logs/auto-tests/
```

---

## 🤖 Автоматический запуск (Cron)

### Настройка cron для ежедневного запуска

```bash
# Редактировать crontab
crontab -e

# Добавить строку для запуска каждый день в 3:00 ночи
0 3 * * * cd /opt/xr2 && ./scripts/run-tests-production-improved.sh >> /opt/xr2/logs/cron-auto-tests.log 2>&1

# Или запускать каждые 6 часов
0 */6 * * * cd /opt/xr2 && ./scripts/run-tests-production-improved.sh >> /opt/xr2/logs/cron-auto-tests.log 2>&1
```

### Настройка cron для запуска каждые 4 часа

```bash
# Добавить в crontab
0 */4 * * * cd /opt/xr2 && /usr/bin/python3 /opt/xr2/scripts/run-tests-production-improved.sh >> /opt/xr2/logs/cron-auto-tests.log 2>&1
```

### Просмотр cron логов

```bash
# Посмотреть последние запуски
tail -f /opt/xr2/logs/cron-auto-tests.log

# Посмотреть все запуски
cat /opt/xr2/logs/cron-auto-tests.log
```

---

## 📧 Уведомления об ошибках

### Настройка отправки email при ошибках

Можно добавить в скрипт отправку email:

```bash
# В конце скрипта run-tests-production-improved.sh добавить:
if [ $TEST_EXIT_CODE -ne 0 ]; then
    # Отправить email (требует настройки mail)
    echo "Тесты завершились с ошибками. Проверьте логи: $RESULTS_DIR" | \
        mail -s "xR2 Auto-tests Failed" your-email@example.com
fi
```

### Настройка через Telegram бота

Можно использовать Telegram бота для уведомлений:

```bash
# Добавить в скрипт функцию отправки в Telegram
send_telegram() {
    local message="$1"
    local bot_token="YOUR_BOT_TOKEN"
    local chat_id="YOUR_CHAT_ID"
    curl -s -X POST "https://api.telegram.org/bot${bot_token}/sendMessage" \
        -d chat_id="${chat_id}" \
        -d text="${message}"
}

# Использовать при ошибках
if [ $TEST_EXIT_CODE -ne 0 ]; then
    send_telegram "❌ xR2 Auto-tests Failed. Check logs: $RESULTS_DIR"
fi
```

---

## 🔍 Анализ ошибок

### Типичные проблемы

1. **Сервер недоступен**
   ```bash
   # Проверить статус сервисов
   docker ps
   docker logs xr2_backend_prod --tail 50
   ```

2. **Playwright не установлен**
   ```bash
   playwright install chromium
   ```

3. **Недостаточно памяти**
   ```bash
   # Проверить использование памяти
   free -h
   # Очистить кэш Docker если нужно
   docker system prune -a
   ```

4. **Проблемы с сетью**
   ```bash
   # Проверить доступность
   curl -I https://xr2.uk
   curl -I https://xr2.uk/health
   ```

### Поиск конкретных ошибок

```bash
# Найти все ошибки в последнем запуске
grep -i "error\|failed\|❌" test-results-*/test-output.log | tail -20

# Найти конкретный тест
grep -A 10 "T17.9" test-results-*/test-output.log

# Найти все предупреждения
grep -i "warning\|⚠️" test-results-*/test-output.log | wc -l
```

---

## 📈 Мониторинг

### Создание дашборда для мониторинга

Можно создать простой скрипт для мониторинга результатов:

```bash
#!/bin/bash
# scripts/check-test-status.sh

LATEST_RESULT=$(ls -td test-results-* 2>/dev/null | head -1)
if [ -z "$LATEST_RESULT" ]; then
    echo "❌ Нет результатов тестов"
    exit 1
fi

if [ -f "$LATEST_RESULT/test_report.json" ]; then
    TOTAL=$(cat "$LATEST_RESULT/test_report.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))")
    PASSED=$(cat "$LATEST_RESULT/test_report.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len([t for t in d if t.get('status')=='passed']))")
    FAILED=$(cat "$LATEST_RESULT/test_report.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len([t for t in d if t.get('status')=='failed']))")
    
    echo "📊 Статус тестов:"
    echo "  Всего: $TOTAL"
    echo "  ✅ Пройдено: $PASSED"
    echo "  ❌ Упало: $FAILED"
    echo "  📁 Результаты: $LATEST_RESULT"
fi
```

---

## 🛠️ Полезные команды

```bash
# Запустить тесты в фоне
nohup ./scripts/run-tests-production-improved.sh > /dev/null 2>&1 &

# Посмотреть запущенные процессы тестов
ps aux | grep auto-test

# Очистить старые результаты (старше 7 дней)
find test-results-* -type d -mtime +7 -exec rm -rf {} \;

# Очистить старые логи (старше 30 дней)
find logs/auto-tests -name "*.log" -mtime +30 -delete

# Посмотреть размер директорий с результатами
du -sh test-results-*
```

---

## 📝 Примеры использования

### Запуск с отладкой

```bash
export LOG_LEVEL="DEBUG"
./scripts/run-tests-production-improved.sh
```

### Запуск только определенных тестов

Отредактируйте `auto-test.py` и закомментируйте ненужные тесты в функции `main()`.

### Запуск с сохранением только ошибок

```bash
./scripts/run-tests-production-improved.sh 2>&1 | grep -E "(ERROR|FAILED|❌|⚠️)" > errors.log
```

---

## 🔐 Безопасность

⚠️ **Важно:**
- Не коммитьте пароли и токены в репозиторий
- Используйте переменные окружения для чувствительных данных
- Ограничьте доступ к директории с логами: `chmod 700 logs/auto-tests`
- Регулярно очищайте старые логи и результаты

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `tail -f test-results-*/test-output.log`
2. Проверьте статус сервисов: `docker ps`
3. Проверьте доступность: `curl -I https://xr2.uk`
4. Проверьте зависимости: `pip3 list | grep -E "requests|aiohttp|playwright"`

