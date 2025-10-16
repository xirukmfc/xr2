#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Подготовка сервера к деплою${NC}"
echo ""

# 1. Остановить все контейнеры
echo -e "${YELLOW}1. Остановка всех контейнеров...${NC}"
docker compose --env-file .env.prod -f docker-compose.prod.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Остановлено${NC}"
echo ""

# 2. Очистить Docker кэш и неиспользуемые образы
echo -e "${YELLOW}2. Очистка Docker (неиспользуемые образы, кэш)...${NC}"
docker system prune -f
echo -e "${GREEN}✅ Очищено${NC}"
echo ""

# 3. Удалить старые образы frontend (если есть)
echo -e "${YELLOW}3. Удаление старых образов frontend...${NC}"
docker images | grep xr2.*frontend | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
echo -e "${GREEN}✅ Удалено${NC}"
echo ""

# 4. Проверить swap
echo -e "${YELLOW}4. Проверка swap...${NC}"
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo -e "${RED}⚠️  Swap не настроен!${NC}"
    echo -e "${YELLOW}Создаю 4GB swap...${NC}"

    if [ ! -f /swapfile ]; then
        sudo fallocate -l 4G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile

        # Добавить в fstab для постоянного использования
        if ! grep -q '/swapfile' /etc/fstab; then
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        fi
        echo -e "${GREEN}✅ Swap создан и активирован (4GB)${NC}"
    else
        sudo swapon /swapfile
        echo -e "${GREEN}✅ Swap активирован${NC}"
    fi
else
    echo -e "${GREEN}✅ Swap уже настроен:${NC}"
    swapon --show
fi
echo ""

# 5. Проверить место на диске
echo -e "${YELLOW}5. Проверка места на диске...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo -e "${RED}⚠️  Мало места на диске (${DISK_USAGE}% использовано)${NC}"
    echo -e "${YELLOW}Очистка Docker volumes и build cache...${NC}"
    docker system prune -a --volumes -f
    echo -e "${GREEN}✅ Дополнительная очистка выполнена${NC}"
else
    echo -e "${GREEN}✅ Достаточно места (${DISK_USAGE}% использовано)${NC}"
fi
df -h / | grep -v Filesystem
echo ""

# 6. Включить BuildKit
echo -e "${YELLOW}6. Настройка Docker BuildKit...${NC}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Добавить в .bashrc если нет
if ! grep -q "DOCKER_BUILDKIT" ~/.bashrc; then
    echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
    echo 'export COMPOSE_DOCKER_CLI_BUILD=1' >> ~/.bashrc
    echo -e "${GREEN}✅ BuildKit добавлен в .bashrc${NC}"
else
    echo -e "${GREEN}✅ BuildKit уже настроен${NC}"
fi
echo ""

# 7. Перезапустить Docker daemon для применения изменений
echo -e "${YELLOW}7. Перезапуск Docker daemon...${NC}"
sudo systemctl restart docker
sleep 3
echo -e "${GREEN}✅ Docker перезапущен${NC}"
echo ""

# 8. Показать статистику
echo -e "${GREEN}📊 Статистика после очистки:${NC}"
echo ""
echo -e "${YELLOW}Память:${NC}"
free -h
echo ""
echo -e "${YELLOW}Диск:${NC}"
df -h / | grep -v Filesystem
echo ""
echo -e "${YELLOW}Docker:${NC}"
docker system df
echo ""

echo -e "${GREEN}✅ Сервер подготовлен к деплою!${NC}"
echo ""
echo -e "${YELLOW}Теперь можно запустить:${NC}"
echo "  export DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1"
echo "  make deploy-fast"
