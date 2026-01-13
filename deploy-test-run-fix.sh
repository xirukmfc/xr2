#!/bin/bash

# Скрипт для деплоя исправления test-run на продакшн сервер
# Использование: ./deploy-test-run-fix.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

REMOTE_HOST="root@<PROD_HOST>"
REMOTE_PATH="/opt/xr2"
LOCAL_PATH="$(pwd)"

echo -e "${BLUE}🚀 Деплой исправления test-run на продакшн${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}📋 Изменения:${NC}"
echo "  ✅ prompt-editor/components/test-modal.tsx - изменен URL на /internal/llm/test-run"
echo "  ✅ nginx/nginx.prod.conf - убрано ненужное правило для /api/test-run"
echo ""

# Копирование измененных файлов на сервер
echo -e "${YELLOW}📦 Копирование файлов на сервер...${NC}"
scp prompt-editor/components/test-modal.tsx "${REMOTE_HOST}:${REMOTE_PATH}/prompt-editor/components/test-modal.tsx"
scp nginx/nginx.prod.conf "${REMOTE_HOST}:${REMOTE_PATH}/nginx/nginx.prod.conf"

echo -e "${GREEN}✅ Файлы скопированы${NC}"

# Выполнение обновления на сервере
echo -e "${YELLOW}🔨 Выполнение обновления на сервере...${NC}"
ssh "${REMOTE_HOST}" << 'ENDSSH'
    set -e
    cd /opt/xr2
    
    echo "📋 Проверка файлов..."
    ls -la prompt-editor/components/test-modal.tsx nginx/nginx.prod.conf
    
    echo "🔨 Пересборка фронтенда..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml build frontend
    
    echo "🔄 Перезапуск nginx..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
    
    echo "🔄 Перезапуск фронтенда..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml up -d frontend
    
    echo "⏳ Ожидание запуска сервисов..."
    sleep 10
    
    echo "📊 Статус сервисов:"
    docker compose --env-file .env.prod -f docker-compose.prod.yml ps frontend nginx
    
    echo ""
    echo "✅ Обновление завершено!"
ENDSSH

echo ""
echo -e "${GREEN}🎉 Деплой завершен успешно!${NC}"
echo ""
echo -e "${YELLOW}🧪 Проверьте работу:${NC}"
echo "  1. Откройте https://xr2.uk/editor/[prompt-id]"
echo "  2. Нажмите 'Test with AI'"
echo "  3. Убедитесь, что запрос идет на /internal/llm/test-run и возвращает результат"
echo ""
echo -e "${YELLOW}📋 Полезные команды для отладки:${NC}"
echo "  docker logs xr2_frontend_prod --tail 50 -f"
echo "  docker logs xr2_nginx_prod --tail 50 -f"
echo "  docker logs xr2_app_prod --tail 50 -f"
echo ""
