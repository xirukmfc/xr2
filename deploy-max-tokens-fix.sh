#!/bin/bash

# Скрипт для деплоя исправления max_tokens/max_completion_tokens
# Использование: ./deploy-max-tokens-fix.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

REMOTE_HOST="root@<PROD_HOST>"
REMOTE_PATH="/opt/xr2"
LOCAL_PATH="$(pwd)"

echo -e "${BLUE}🚀 Деплой исправления max_tokens/max_completion_tokens${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}📋 Изменения:${NC}"
echo "  ✅ app/api/llm.py - добавлена поддержка моделей o4, o3, gpt-5"
echo "     Используется max_completion_tokens для моделей: gpt-5, o1, o3, o4"
echo ""

# Копирование измененного файла на сервер
echo -e "${YELLOW}📦 Копирование файла на сервер...${NC}"
scp app/api/llm.py "${REMOTE_HOST}:${REMOTE_PATH}/app/api/llm.py"

echo -e "${GREEN}✅ Файл скопирован${NC}"

# Пересборка и перезапуск бэкенда на сервере
echo -e "${YELLOW}🔨 Пересборка и перезапуск бэкенда на сервере...${NC}"
ssh "${REMOTE_HOST}" << 'ENDSSH'
    set -e
    cd /opt/xr2
    
    echo "📋 Проверка файла..."
    ls -la app/api/llm.py
    
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
    docker logs xr2_app_prod --tail 20
    
    echo ""
    echo "✅ Бэкенд пересобран и перезапущен!"
ENDSSH

echo ""
echo -e "${GREEN}🎉 Деплой завершен успешно!${NC}"
echo ""
echo -e "${YELLOW}🧪 Проверьте работу:${NC}"
echo "  1. Test with AI с моделью o4-mini"
echo "     - Должен использоваться max_completion_tokens вместо max_tokens"
echo "  2. Проверьте другие модели: o1, o3, o4, gpt-5"
echo ""
