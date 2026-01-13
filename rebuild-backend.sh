#!/bin/bash

# Скрипт для пересборки и перезапуска бэкенда на продакшн сервере
# Использование: ./rebuild-backend.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

REMOTE_HOST="root@<PROD_HOST>"
REMOTE_PATH="/opt/xr2"

echo -e "${BLUE}🔨 Пересборка и перезапуск бэкенда на продакшн${NC}"
echo "=============================================="

# Пересборка и перезапуск бэкенда на сервере
ssh "${REMOTE_HOST}" << 'ENDSSH'
    set -e
    cd /opt/xr2
    
    echo "🔨 Пересборка бэкенда..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml build app
    
    echo "🔄 Перезапуск бэкенда..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml up -d app
    
    echo "⏳ Ожидание запуска бэкенда..."
    sleep 15
    
    echo "📊 Статус бэкенда:"
    docker compose --env-file .env.prod -f docker-compose.prod.yml ps app
    
    echo ""
    echo "📝 Последние логи бэкенда:"
    docker logs xr2_app_prod --tail 30
    
    echo ""
    echo "✅ Бэкенд пересобран и перезапущен!"
ENDSSH

echo ""
echo -e "${GREEN}🎉 Пересборка завершена успешно!${NC}"
echo ""
echo -e "${YELLOW}🧪 Проверьте работу:${NC}"
echo "  https://xr2.uk/internal/ab-tests-simple/test/{test_id}/results"
echo ""
