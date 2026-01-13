#!/bin/bash

# Скрипт для обновления исправления test-run на продакшене
# Использование: ./update-test-run-fix.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Обновление исправления test-run на продакшене${NC}"
echo "=============================================="

# Проверка, что мы на сервере
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Файл docker-compose.prod.yml не найден${NC}"
    echo "Убедитесь, что вы находитесь в директории проекта (/opt/xr2)"
    exit 1
fi

echo -e "${YELLOW}📋 Проверка измененных файлов...${NC}"
echo "  - nginx/nginx.prod.conf (добавлено правило для /api/test-run)"
echo "  - prompt-editor/app/api/test-run/route.ts (исправлен BACKEND_URL)"

# Пересборка фронтенда (так как изменился код Next.js)
echo -e "${YELLOW}🔨 Пересборка фронтенда...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend

# Перезапуск nginx (так как изменилась конфигурация)
echo -e "${YELLOW}🔄 Перезапуск nginx...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx

# Перезапуск фронтенда с новым образом
echo -e "${YELLOW}🔄 Перезапуск фронтенда...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d frontend

# Ожидание запуска
echo -e "${YELLOW}⏳ Ожидание запуска сервисов...${NC}"
sleep 10

# Проверка статуса
echo -e "${YELLOW}📊 Статус сервисов:${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml ps frontend nginx

# Проверка логов
echo -e "${YELLOW}📝 Последние логи nginx:${NC}"
docker logs xr2_nginx_prod --tail 20

echo ""
echo -e "${GREEN}✅ Обновление завершено!${NC}"
echo ""
echo -e "${YELLOW}🧪 Проверьте работу:${NC}"
echo "  1. Откройте https://xr2.uk/editor/[prompt-id]"
echo "  2. Нажмите 'Test with AI'"
echo "  3. Убедитесь, что запрос идет на /api/test-run и возвращает результат"
echo ""
echo -e "${YELLOW}📋 Полезные команды для отладки:${NC}"
echo "  docker logs xr2_frontend_prod --tail 50 -f"
echo "  docker logs xr2_nginx_prod --tail 50 -f"
echo "  curl -X POST https://xr2.uk/api/test-run -H 'Authorization: Bearer TOKEN' -H 'Content-Type: application/json' -d '{}'"
