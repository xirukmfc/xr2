#!/bin/bash

# Быстрая пересборка frontend с использованием BuildKit и кеша

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}⚡ Быстрая пересборка frontend с BuildKit${NC}"

# Включаем BuildKit для использования cache mounts
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

cd /opt/xr2

echo -e "${YELLOW}Останавливаем frontend...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml stop frontend || true

echo -e "${YELLOW}Пересобираем frontend с кешем...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend

echo -e "${YELLOW}Запускаем frontend...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d frontend

echo -e "${GREEN}✅ Frontend пересобран и запущен!${NC}"
echo -e "${YELLOW}Проверка статуса...${NC}"
sleep 5
docker compose --env-file .env.prod -f docker-compose.prod.yml ps frontend
