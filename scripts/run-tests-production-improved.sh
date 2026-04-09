#!/bin/bash

# Улучшенный скрипт для запуска автотестов на production сервере
# Запускать на сервере: ./scripts/run-tests-production-improved.sh
# Или через cron для автоматического запуска

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🤖 Запуск автотестов на production${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Определяем директорию проекта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_DIR"

echo -e "${YELLOW}📁 Рабочая директория: $PROJECT_DIR${NC}"
echo ""

# Проверка, что скрипт запущен на сервере (опционально)
if [[ ! "$PROJECT_DIR" =~ "/opt/xr2" ]] && [[ ! "$PROJECT_DIR" =~ "xR2" ]]; then
    echo -e "${YELLOW}⚠️  Внимание: возможно запущено не из правильной директории${NC}"
    echo "Текущая директория: $PROJECT_DIR"
    echo ""
fi

# Настройка переменных окружения для production
export FRONTEND_URL="${FRONTEND_URL:-https://xr2.uk}"
export BACKEND_URL="${BACKEND_URL:-https://xr2.uk}"
export LOG_TO_FILE="true"
export LOG_DIR="logs/auto-tests"
export LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Учетные данные для тестов — обязательно задавать через переменные окружения
# (TEST_USERNAME, TEST_PASSWORD или ADMIN_PASSWORD). Хардкодить пароли в репозитории нельзя.
export TEST_USERNAME="${TEST_USERNAME:-www}"
export TEST_PASSWORD="${TEST_PASSWORD:-${ADMIN_PASSWORD:-}}"

if [ -z "$TEST_PASSWORD" ]; then
    echo -e "${RED}❌ TEST_PASSWORD (или ADMIN_PASSWORD) не задан.${NC}"
    echo -e "${YELLOW}   Пример: export TEST_PASSWORD='...' && $0${NC}"
    exit 1
fi

echo -e "${GREEN}📋 Конфигурация тестов:${NC}"
echo "  FRONTEND_URL: $FRONTEND_URL"
echo "  BACKEND_URL:  $BACKEND_URL"
echo "  LOG_TO_FILE:  $LOG_TO_FILE"
echo "  LOG_DIR:      $LOG_DIR"
echo "  LOG_LEVEL:    $LOG_LEVEL"
echo "  TEST_USERNAME: $TEST_USERNAME"
echo "  TEST_PASSWORD: ${TEST_PASSWORD:0:3}***"
echo ""

# Проверка наличия Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 не найден!${NC}"
    echo "Установите: apt-get install python3 python3-pip"
    exit 1
fi

# Проверка наличия необходимых пакетов
echo -e "${YELLOW}🔍 Проверка зависимостей...${NC}"
MISSING_DEPS=()

if ! python3 -c "import requests" 2>/dev/null; then
    MISSING_DEPS+=("requests")
fi

if ! python3 -c "import aiohttp" 2>/dev/null; then
    MISSING_DEPS+=("aiohttp")
fi

if ! python3 -c "import playwright" 2>/dev/null; then
    MISSING_DEPS+=("playwright")
fi

if ! python3 -c "import dotenv" 2>/dev/null; then
    MISSING_DEPS+=("python-dotenv")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Не установлены зависимости: ${MISSING_DEPS[*]}${NC}"
    echo ""
    if [ -t 0 ]; then  # Проверяем что есть интерактивный терминал
        echo "Установить зависимости? (y/n)"
        read -r answer
        if [ "$answer" = "y" ]; then
        echo "Установка зависимостей..."
        pip3 install requests aiohttp playwright python-dotenv
        playwright install chromium
        echo -e "${GREEN}✅ Зависимости установлены${NC}"
            echo -e "${GREEN}✅ Зависимости установлены${NC}"
        else
            echo -e "${RED}❌ Для запуска тестов необходимы зависимости${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Неинтерактивный режим: зависимости должны быть установлены заранее${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Все зависимости установлены${NC}"
fi

# Проверка доступности сервисов
echo ""
echo -e "${YELLOW}🔍 Проверка доступности сервисов...${NC}"

if curl -s -f -k "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend доступен: $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Frontend недоступен: $FRONTEND_URL${NC}"
    exit 1
fi

if curl -s -f -k "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend доступен: $BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check недоступен, но продолжаем...${NC}"
fi

# Создание директории для результатов
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_DIR="test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$LOG_DIR"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Запуск тестов...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Запуск тестов с сохранением вывода
LOG_FILE="$RESULTS_DIR/test-output.log"
echo -e "${YELLOW}📝 Логи сохраняются в: $LOG_FILE${NC}"
echo ""

python3 auto-test.py 2>&1 | tee "$LOG_FILE"

# Сохранение кода возврата
TEST_EXIT_CODE=${PIPESTATUS[0]}

# Копируем test_report.json если он создан
if [ -f "test_report.json" ]; then
    cp test_report.json "$RESULTS_DIR/"
    echo -e "${GREEN}📊 Отчет сохранен: $RESULTS_DIR/test_report.json${NC}"
fi

# Копируем скриншоты если они есть
if [ -d "test_screenshots" ] && [ "$(ls -A test_screenshots)" ]; then
    cp -r test_screenshots "$RESULTS_DIR/"
    echo -e "${GREEN}📸 Скриншоты сохранены: $RESULTS_DIR/test_screenshots${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Результаты тестов${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Все тесты пройдены успешно!${NC}"
else
    echo -e "${RED}❌ Тесты завершились с ошибками (код: $TEST_EXIT_CODE)${NC}"
fi

echo ""
echo -e "${GREEN}📁 Результаты сохранены в: $RESULTS_DIR${NC}"
echo "  - Логи: $RESULTS_DIR/test-output.log"
if [ -f "$RESULTS_DIR/test_report.json" ]; then
    echo "  - Отчет: $RESULTS_DIR/test_report.json"
fi
if [ -d "$RESULTS_DIR/test_screenshots" ]; then
    SCREENSHOT_COUNT=$(find "$RESULTS_DIR/test_screenshots" -type f | wc -l)
    echo "  - Скриншоты: $RESULTS_DIR/test_screenshots ($SCREENSHOT_COUNT файлов)"
fi

# Показываем последние логи из файла логов (если есть)
if [ -d "$LOG_DIR" ]; then
    LATEST_LOG=$(ls -t "$LOG_DIR"/auto-test-*.log 2>/dev/null | head -1)
    if [ -n "$LATEST_LOG" ]; then
        echo "  - Лог файл: $LATEST_LOG"
    fi
fi

echo ""
echo -e "${YELLOW}💡 Для просмотра логов используйте:${NC}"
echo "  tail -f $LOG_FILE"
echo "  или"
echo "  cat $RESULTS_DIR/test-output.log"

exit $TEST_EXIT_CODE

