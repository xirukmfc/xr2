#!/bin/bash

# Скрипт для перезапуска бэкенда на продакшн сервере
# Использование: ./restart-backend.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Хост берётся из .deploy.env (в .gitignore) или из окружения
[ -f "$(dirname "$0")/.deploy.env" ] && . "$(dirname "$0")/.deploy.env"
REMOTE_HOST="${XR2_PROD_HOST:?не задан XR2_PROD_HOST — создайте .deploy.env по образцу .deploy.env.example}"
REMOTE_PATH="/opt/xr2"

echo -e "${BLUE}🔄 Перезапуск бэкенда на продакшн${NC}"
echo "=============================================="

# Перезапуск бэкенда на сервере
ssh "${REMOTE_HOST}" << 'ENDSSH'
    set -e
    cd /opt/xr2
    
    echo "🔄 Перезапуск бэкенда..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml restart app
    
    echo "⏳ Ожидание запуска бэкенда..."
    sleep 10
    
    echo "📊 Статус бэкенда:"
    docker compose --env-file .env.prod -f docker-compose.prod.yml ps app
    
    echo ""
    echo "✅ Бэкенд перезапущен!"
ENDSSH

echo ""
echo -e "${GREEN}🎉 Перезапуск завершен успешно!${NC}"
echo ""
echo -e "${YELLOW}🧪 Проверьте работу:${NC}"
echo "  https://xr2.uk/internal/ab-tests-simple/test/{test_id}/results"
echo ""
