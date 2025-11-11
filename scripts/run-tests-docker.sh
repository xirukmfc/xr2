#!/bin/bash

# Скрипт для запуска автотестов в Docker контейнере на сервере
# Использует существующий app контейнер для запуска тестов

set -e

echo "=========================================="
echo "Запуск автотестов через Docker"
echo "=========================================="
echo ""

# Проверка, что Docker Compose запущен
if ! docker ps | grep -q "xr2_app_prod"; then
    echo "❌ Контейнер xr2_app_prod не запущен!"
    echo "Запустите проект: make up"
    exit 1
fi

echo "✅ Контейнеры запущены"
echo ""

# Установка зависимостей для тестов в контейнере (если нужно)
echo "Проверка зависимостей в контейнере..."
docker exec xr2_app_prod pip install requests aiohttp playwright > /dev/null 2>&1 || true

# Запуск тестов внутри контейнера
echo "Запуск тестов..."
echo ""

docker exec \
    -e FRONTEND_URL="https://xr2.uk" \
    -e BACKEND_URL="https://xr2.uk" \
    xr2_app_prod \
    python3 /app/auto-test.py

echo ""
echo "=========================================="
echo "Тесты завершены"
echo "=========================================="
