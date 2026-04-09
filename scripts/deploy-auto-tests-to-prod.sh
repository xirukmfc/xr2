#!/bin/bash

# Скрипт для деплоя автотестов на production сервер
# Запускать локально: ./scripts/deploy-auto-tests-to-prod.sh
#
# Требуется настроенный SSH-ключ для подключения к production серверу.
# Хост задаётся через переменную окружения PROD_SERVER (например, root@1.2.3.4).

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Деплой автотестов на production${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Параметры подключения
if [ -z "${PROD_SERVER:-}" ]; then
    echo -e "${RED}❌ Переменная окружения PROD_SERVER не задана.${NC}"
    echo -e "${YELLOW}   Пример: export PROD_SERVER=root@your-server${NC}"
    exit 1
fi

SERVER="$PROD_SERVER"
SERVER_DIR="${PROD_SERVER_DIR:-/opt/xr2}"

# Функция для выполнения команд на сервере (через SSH-ключ)
run_on_server() {
    ssh -o StrictHostKeyChecking=no "$SERVER" "$1"
}

# Функция для копирования файлов на сервер
copy_to_server() {
    scp -o StrictHostKeyChecking=no "$1" "$SERVER:$2"
}

echo -e "${YELLOW}📋 Шаг 1: Проверка подключения к серверу...${NC}"
if run_on_server "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Подключение к серверу успешно${NC}"
else
    echo -e "${RED}❌ Не удалось подключиться к серверу${NC}"
    echo -e "${YELLOW}   Проверьте, что SSH-ключ добавлен в ~/.ssh/authorized_keys на сервере.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Шаг 2: Обновление кода на сервере...${NC}"
run_on_server "cd $SERVER_DIR && git pull origin master"
echo -e "${GREEN}✅ Код обновлен${NC}"

echo ""
echo -e "${YELLOW}📋 Шаг 3: Проверка и установка зависимостей для автотестов...${NC}"
run_on_server "cd $SERVER_DIR && python3 -c 'import requests, aiohttp, playwright' 2>/dev/null || (echo 'Установка зависимостей...' && pip3 install requests aiohttp playwright python-dotenv && playwright install chromium)"
echo -e "${GREEN}✅ Зависимости проверены/установлены${NC}"

echo ""
echo -e "${YELLOW}📋 Шаг 4: Создание директорий для логов...${NC}"
run_on_server "cd $SERVER_DIR && mkdir -p logs/auto-tests"
echo -e "${GREEN}✅ Директории созданы${NC}"

echo ""
echo -e "${YELLOW}📋 Шаг 5: Проверка прав на выполнение скриптов...${NC}"
run_on_server "cd $SERVER_DIR && chmod +x scripts/run-tests-production-improved.sh 2>/dev/null || true"
echo -e "${GREEN}✅ Права установлены${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Следующие шаги:${NC}"
echo "  1. Подключитесь к серверу:"
echo "     ssh $SERVER"
echo ""
echo "  2. Перейдите в директорию проекта:"
echo "     cd $SERVER_DIR"
echo ""
echo "  3. Запустите тесты:"
echo "     ./scripts/run-tests-production-improved.sh"
echo ""
echo "  4. Или посмотрите инструкцию:"
echo "     cat QUICK_START_TESTS.md"
echo ""
