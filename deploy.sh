#!/bin/bash

# xR2 Platform - Quick Deployment Script
# ======================================

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 xR2 Platform - Quick Deployment${NC}"
echo "=================================="

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен. Установите Docker и попробуйте снова.${NC}"
    exit 1
fi

# Проверка наличия Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова.${NC}"
    exit 1
fi

# Проверка наличия Make
if ! command -v make &> /dev/null; then
    echo -e "${YELLOW}⚠️  Make не установлен. Установите make для удобного управления.${NC}"
    echo "Вы можете использовать docker-compose команды напрямую."
fi

# Создание .env файла если его нет
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Создание .env файла...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ .env файл создан из env.example${NC}"
        echo -e "${RED}⚠️  ВАЖНО: Измените пароли в .env файле перед production развертыванием!${NC}"
    else
        echo -e "${RED}❌ Файл env.example не найден${NC}"
        exit 1
    fi
fi

# Создание необходимых директорий
echo -e "${YELLOW}📁 Создание директорий...${NC}"
mkdir -p logs nginx/ssl monitoring/grafana/dashboards monitoring/grafana/datasources

# Проверка режима развертывания
if [ "$1" = "production" ]; then
    echo -e "${YELLOW}🏭 Production развертывание...${NC}"
    
    # Проверка SSL сертификатов
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        echo -e "${RED}❌ SSL сертификаты не найдены в nginx/ssl/${NC}"
        echo "Создайте SSL сертификаты или используйте режим разработки:"
        echo "  ./deploy.sh dev"
        exit 1
    fi
    
# Сборка и запуск
    echo -e "${YELLOW}🔨 Сборка образов...${NC}"
    docker-compose build --no-cache
    
    echo -e "${YELLOW}🗄️  Инициализация базы данных...${NC}"
    docker-compose up db-init
    
    echo -e "${YELLOW}🚀 Запуск сервисов...${NC}"
    docker-compose up -d
    
elif [ "$1" = "dev" ]; then
    echo -e "${YELLOW}🛠️  Development развертывание...${NC}"
    
    # Сборка и запуск
    echo -e "${YELLOW}🔨 Сборка образов...${NC}"
    docker-compose build
    
    echo -e "${YELLOW}🗄️  Инициализация базы данных...${NC}"
    docker-compose up db-init
    
    echo -e "${YELLOW}🚀 Запуск сервисов...${NC}"
    docker-compose up -d
    
else
    echo -e "${YELLOW}❓ Неизвестный режим. Используйте:${NC}"
    echo "  ./deploy.sh dev        - для разработки"
    echo "  ./deploy.sh production - для production"
    exit 1
fi

# Ожидание запуска сервисов
echo -e "${YELLOW}⏳ Ожидание запуска сервисов...${NC}"
sleep 10

# Проверка статуса
echo -e "${YELLOW}📊 Проверка статуса сервисов...${NC}"
docker-compose ps

# Проверка здоровья
echo -e "${YELLOW}🏥 Проверка здоровья сервисов...${NC}"
sleep 5

# Проверка приложения
if curl -s http://localhost/internal/health > /dev/null; then
    echo -e "${GREEN}✅ Приложение работает${NC}"
else
    echo -e "${RED}❌ Приложение недоступно${NC}"
fi

# Проверка Nginx
if curl -s http://localhost/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx работает${NC}"
else
    echo -e "${RED}❌ Nginx недоступен${NC}"
fi

# Итоговая информация
echo ""
echo -e "${GREEN}🎉 Развертывание завершено!${NC}"
echo "=================================="
echo -e "${YELLOW}Доступные сервисы:${NC}"
echo "  🌐 Приложение:     http://localhost"
echo "  📚 API Docs:       http://localhost/docs"
echo "  🔐 Admin Panel:    http://localhost/admin"
echo "  🔧 Admin Docs:     http://localhost/admin-docs"
echo ""
echo -e "${YELLOW}Полезные команды:${NC}"
echo "  📋 Статус:         make status"
echo "  📝 Логи:           make logs"
echo "  🏥 Здоровье:       make health"
echo "  🛑 Остановка:      make down"
echo "  🔄 Перезапуск:     make restart"
echo ""
echo -e "${RED}⚠️  Не забудьте изменить пароли в .env файле!${NC}"
