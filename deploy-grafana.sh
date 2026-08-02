#!/bin/bash

# Скрипт для деплоя Grafana и Prometheus на продакшн сервер
# Использование: ./deploy-grafana.sh

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
LOCAL_PATH="$(pwd)"

echo -e "${BLUE}🚀 Деплой Grafana и Prometheus на продакшн${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}📋 Изменения:${NC}"
echo "  ✅ docker-compose.prod.yml - добавлены сервисы prometheus и grafana"
echo "  ✅ nginx/nginx.prod.conf - добавлены правила для /grafana/ и /prometheus/"
echo ""

# Копирование измененных файлов на сервер
echo -e "${YELLOW}📦 Копирование файлов на сервер...${NC}"
scp docker-compose.prod.yml "${REMOTE_HOST}:${REMOTE_PATH}/docker-compose.prod.yml"
scp nginx/nginx.prod.conf "${REMOTE_HOST}:${REMOTE_PATH}/nginx/nginx.prod.conf"

echo -e "${GREEN}✅ Файлы скопированы${NC}"

# Запуск Grafana и Prometheus на сервере
echo -e "${YELLOW}🔨 Запуск Grafana и Prometheus на сервере...${NC}"
ssh "${REMOTE_HOST}" << 'ENDSSH'
    set -e
    cd /opt/xr2
    
    echo "📋 Проверка файлов..."
    ls -la docker-compose.prod.yml nginx/nginx.prod.conf
    
    echo "🚀 Запуск Prometheus и Grafana..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml up -d prometheus grafana
    
    echo "🔄 Перезапуск nginx..."
    docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx
    
    echo "⏳ Ожидание запуска сервисов..."
    sleep 10
    
    echo "📊 Статус сервисов:"
    docker compose --env-file .env.prod -f docker-compose.prod.yml ps prometheus grafana nginx
    
    echo ""
    echo "✅ Grafana и Prometheus запущены!"
ENDSSH

echo ""
echo -e "${GREEN}🎉 Деплой завершен успешно!${NC}"
echo ""
echo -e "${YELLOW}🔗 Доступ к Grafana:${NC}"
echo "  https://xr2.uk/grafana/"
echo ""
echo -e "${YELLOW}🔐 Учетные данные по умолчанию:${NC}"
echo "  Username: admin"
echo "  Password: admin (или значение из переменной GRAFANA_PASSWORD в .env.prod)"
echo ""
echo -e "${YELLOW}📊 Prometheus доступен по адресу:${NC}"
echo "  https://xr2.uk/prometheus/"
echo ""
echo -e "${YELLOW}📋 Полезные команды:${NC}"
echo "  docker logs xr2_grafana_prod --tail 50 -f"
echo "  docker logs xr2_prometheus_prod --tail 50 -f"
echo ""
