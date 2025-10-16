#!/bin/bash
# Скрипт для запуска автотестов на сервере

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Запуск автотестов xR2 Platform на сервере${NC}"
echo "=================================="

# Проверка переменных окружения
if [ -z "$SERVER_URL" ]; then
    echo -e "${YELLOW}⚠️  SERVER_URL не установлен, используем https://xr2.uk${NC}"
    export SERVER_URL="https://xr2.uk"
fi

if [ -z "$ADMIN_USERNAME" ]; then
    echo -e "${YELLOW}⚠️  ADMIN_USERNAME не установлен, используем admin${NC}"
    export ADMIN_USERNAME="admin"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ ADMIN_PASSWORD не установлен!${NC}"
    echo "Установите переменную окружения ADMIN_PASSWORD"
    exit 1
fi

# Настройка переменных для автотестов
export FRONTEND_URL="$SERVER_URL"
export BACKEND_URL="$SERVER_URL"
export TEST_USERNAME="$ADMIN_USERNAME"
export TEST_PASSWORD="$ADMIN_PASSWORD"

echo -e "${GREEN}📋 Конфигурация тестов:${NC}"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Backend URL:  $BACKEND_URL"
echo "  Username:     $TEST_USERNAME"
echo "  Password:     ${TEST_PASSWORD:0:3}***"
echo ""

# Проверка доступности сервера
echo -e "${YELLOW}🔍 Проверка доступности сервера...${NC}"
if curl -s -f "$SERVER_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Сервер доступен${NC}"
else
    echo -e "${RED}❌ Сервер недоступен по адресу $SERVER_URL${NC}"
    exit 1
fi

# Запуск тестов
echo -e "${YELLOW}🚀 Запуск автотестов...${NC}"
python auto-test.py

echo -e "${GREEN}✅ Автотесты завершены!${NC}"
echo -e "${YELLOW}📊 Результаты сохранены в test_report.json${NC}"
echo -e "${YELLOW}📸 Скриншоты сохранены в test_screenshots/${NC}"
