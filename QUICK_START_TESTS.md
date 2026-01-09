# 🚀 Быстрый старт: Запуск автотестов на проде

## 📍 На сервере

### 1. Подключиться к серверу
```bash
ssh root@<PROD_HOST>
cd /opt/xr2
```

### 2. Запустить тесты
```bash
# Используйте улучшенный скрипт (рекомендуется)
./scripts/run-tests-production-improved.sh

# Или напрямую
python3 auto-test.py
```

### 3. Посмотреть результаты
```bash
# Последний запуск
ls -lt test-results-* | head -1

# Посмотреть логи
tail -f test-results-*/test-output.log

# Посмотреть JSON отчет
cat test-results-*/test_report.json | python3 -m json.tool
```

---

## 📊 Где смотреть логи и ошибки

### Логи тестов
```bash
# Последний запуск
LATEST=$(ls -td test-results-* | head -1)
cat $LATEST/test-output.log

# Только ошибки
grep -i "error\|failed\|❌" test-results-*/test-output.log

# Только предупреждения
grep -i "warning\|⚠️" test-results-*/test-output.log
```

### JSON отчет с результатами
```bash
# Весь отчет
cat test-results-*/test_report.json | python3 -m json.tool

# Только упавшие тесты
cat test-results-*/test_report.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
failed = [t for t in data if t.get('status') == 'failed']
print(json.dumps(failed, indent=2))
"
```

### Скриншоты ошибок
```bash
# Посмотреть скриншоты
ls -lh test-results-*/test_screenshots/

# Скачать скриншоты на локальную машину
scp -r root@<PROD_HOST>:/opt/xr2/test-results-*/test_screenshots ./
```

### Логи из файлов (если LOG_TO_FILE=true)
```bash
# Последний лог файл
ls -t logs/auto-tests/auto-test-*.log | head -1 | xargs tail -f

# Все логи
ls -lh logs/auto-tests/
```

---

## 🤖 Автоматический запуск (Cron)

### Настроить запуск каждые 6 часов
```bash
crontab -e

# Добавить строку:
0 */6 * * * cd /opt/xr2 && ./scripts/run-tests-production-improved.sh >> /opt/xr2/logs/cron-auto-tests.log 2>&1
```

### Посмотреть cron логи
```bash
tail -f /opt/xr2/logs/cron-auto-tests.log
```

---

## 🔍 Быстрый анализ ошибок

```bash
# Найти все ошибки в последнем запуске
LATEST=$(ls -td test-results-* | head -1)
grep -i "error\|failed\|❌" $LATEST/test-output.log | tail -20

# Статистика тестов
cat $LATEST/test_report.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
total = len(data)
passed = len([t for t in data if t.get('status') == 'passed'])
failed = len([t for t in data if t.get('status') == 'failed'])
print(f'Всего: {total}, ✅ Пройдено: {passed}, ❌ Упало: {failed}')
"
```

---

## 📝 Что создается после запуска

```
test-results-YYYYMMDD-HHMMSS/
├── test-output.log          # Полный вывод тестов
├── test_report.json         # JSON отчет
└── test_screenshots/        # Скриншоты ошибок
    ├── error_*.png
    └── ...

logs/auto-tests/             # Если LOG_TO_FILE=true
└── auto-test-YYYYMMDD-HHMMSS.log
```

---

## 💡 Полезные команды

```bash
# Запустить в фоне
nohup ./scripts/run-tests-production-improved.sh > /dev/null 2>&1 &

# Очистить старые результаты (старше 7 дней)
find test-results-* -type d -mtime +7 -exec rm -rf {} \;

# Посмотреть размер результатов
du -sh test-results-*
```

---

Подробная документация: `AUTO_TESTS_PRODUCTION.md`

