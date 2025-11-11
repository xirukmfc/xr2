#!/bin/bash

# Скрипт для запуска автотестов на production сервере
# Запускать на сервере: ./scripts/run-tests-production.sh

set -e

echo "=========================================="
echo "Запуск автотестов на production сервере"
echo "=========================================="
echo ""

# Проверка, что скрипт запущен на сервере
CURRENT_DIR=$(pwd)
if [[ ! "$CURRENT_DIR" =~ "/opt/xr2" ]]; then
    echo "⚠️  Внимание: запущено не из /opt/xr2"
    echo "Текущая директория: $CURRENT_DIR"
fi

# Настройка переменных окружения для production
export FRONTEND_URL="https://xr2.uk"
export BACKEND_URL="https://xr2.uk"

echo "Конфигурация тестов:"
echo "  FRONTEND_URL: $FRONTEND_URL"
echo "  BACKEND_URL: $BACKEND_URL"
echo ""

# Проверка наличия Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден!"
    echo "Установите: apt-get install python3 python3-pip"
    exit 1
fi

# Проверка наличия необходимых пакетов
echo "Проверка зависимостей..."
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

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "⚠️  Не установлены зависимости: ${MISSING_DEPS[*]}"
    echo ""
    echo "Установить зависимости? (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        echo "Установка зависимостей..."
        pip3 install requests aiohttp playwright
        playwright install chromium
        echo "✅ Зависимости установлены"
    else
        echo "❌ Для запуска тестов необходимы зависимости"
        exit 1
    fi
fi

# Проверка доступности сервисов
echo ""
echo "Проверка доступности сервисов..."

if curl -s -f -k "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend доступен: $FRONTEND_URL"
else
    echo "❌ Frontend недоступен: $FRONTEND_URL"
    exit 1
fi

if curl -s -f -k "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Backend доступен: $BACKEND_URL"
else
    echo "❌ Backend недоступен: $BACKEND_URL"
    exit 1
fi

# Создание директории для результатов
RESULTS_DIR="test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo ""
echo "=========================================="
echo "Запуск тестов..."
echo "=========================================="
echo ""

# Запуск тестов
python3 auto-test.py 2>&1 | tee "$RESULTS_DIR/test-output.log"

# Сохранение кода возврата
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "=========================================="
echo "Результаты тестов"
echo "=========================================="
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Все тесты пройдены успешно!"
else
    echo "❌ Тесты завершились с ошибками (код: $TEST_EXIT_CODE)"
fi

echo ""
echo "Результаты сохранены в: $RESULTS_DIR"
echo "  - Логи: $RESULTS_DIR/test-output.log"
echo "  - Скриншоты: screenshots/"
echo ""

exit $TEST_EXIT_CODE
