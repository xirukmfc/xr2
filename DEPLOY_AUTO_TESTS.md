# 🚀 Деплой автотестов на Production

## Быстрый деплой

### Вариант 1: Автоматический деплой (если установлен sshpass)

```bash
# Локально, из директории проекта
./scripts/deploy-auto-tests-to-prod.sh
```

### Вариант 2: Ручной деплой

#### 1. Локально: Закоммитить и запушить изменения

```bash
cd /Users/pavelkuzko/Documents/channeler/xR2

# Добавить все изменения
git add auto-test.py AUTO_TESTS_PRODUCTION.md QUICK_START_TESTS.md TEST_ANALYSIS.md scripts/

# Закоммитить
git commit -m "Улучшение автотестов: логирование, поиск элементов, деплой на прод"

# Запушить
git push origin master
```

#### 2. На сервере: Обновить код

```bash
# Подключиться к серверу
ssh root@<PROD_HOST>

# Перейти в директорию проекта
cd /opt/xr2

# Обновить код
git pull origin master

# Установить зависимости для автотестов (если еще не установлены)
pip3 install requests aiohttp playwright python-dotenv
playwright install chromium

# Создать директории для логов
mkdir -p logs/auto-tests

# Установить права на выполнение скриптов
chmod +x scripts/run-tests-production-improved.sh
```

#### 3. Проверить что все готово

```bash
# Проверить что файлы на месте
ls -la auto-test.py
ls -la scripts/run-tests-production-improved.sh
ls -la AUTO_TESTS_PRODUCTION.md

# Проверить зависимости
python3 -c "import requests, aiohttp, playwright; print('✅ Все зависимости установлены')"
```

---

## Что было обновлено

### Файлы для деплоя:

1. **auto-test.py** - улучшенное логирование, поиск элементов
2. **scripts/run-tests-production-improved.sh** - скрипт запуска на проде
3. **scripts/deploy-auto-tests-to-prod.sh** - скрипт автоматического деплоя
4. **AUTO_TESTS_PRODUCTION.md** - полная документация
5. **QUICK_START_TESTS.md** - быстрый старт
6. **TEST_ANALYSIS.md** - анализ проблем

---

## После деплоя

### Запустить тесты:

```bash
cd /opt/xr2
./scripts/run-tests-production-improved.sh
```

### Посмотреть результаты:

```bash
# Последний запуск
LATEST=$(ls -td test-results-* | head -1)
tail -f $LATEST/test-output.log
```

---

## Проверка деплоя

После деплоя проверьте что:

1. ✅ Файлы обновлены: `ls -la auto-test.py`
2. ✅ Скрипты исполняемые: `ls -la scripts/run-tests-production-improved.sh`
3. ✅ Зависимости установлены: `python3 -c "import playwright"`
4. ✅ Директории созданы: `ls -la logs/auto-tests`

