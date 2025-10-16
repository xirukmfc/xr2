#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Оптимизированный деплой xR2 Platform${NC}"
echo ""

# Проверка Docker BuildKit
echo -e "${YELLOW}⚙️  Включение Docker BuildKit для ускорения сборки...${NC}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Проверка .env.prod
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Файл .env.prod не найден!${NC}"
    echo -e "${YELLOW}Создаю из .env.example...${NC}"
    cp .env.example .env.prod
    echo -e "${RED}⚠️  ВАЖНО: Отредактируйте .env.prod с production паролями!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Сборка backend сервисов...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml build redis postgres db-init app

echo ""
echo -e "${YELLOW}🎨 Сборка frontend (это может занять 5-10 минут)...${NC}"
echo -e "${YELLOW}💡 Следите за прогрессом ниже:${NC}"
echo ""

# Сборка frontend с выводом прогресса
docker compose --env-file .env.prod -f docker-compose.prod.yml build --progress=plain frontend

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Ошибка при сборке frontend!${NC}"
    echo -e "${YELLOW}Проверьте логи выше для деталей${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Все образы собраны успешно!${NC}"
echo ""
echo -e "${YELLOW}🚀 Запуск сервисов...${NC}"

docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --remove-orphans

echo ""
echo -e "${YELLOW}⏳ Ожидание запуска сервисов (30 сек)...${NC}"
sleep 30

echo ""
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}✅ Платформа развернута!${NC}"
echo -e "${YELLOW}🌐 Приложение: https://xr2.uk${NC}"
echo -e "${YELLOW}📚 API Docs:   https://xr2.uk/docs${NC}"
echo -e "${YELLOW}🔐 Admin:      https://xr2.uk/admin${NC}"
echo ""
echo -e "${YELLOW}📋 Для просмотра логов:${NC}"
echo "   docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f frontend"
