#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Генерация .htpasswd для admin-docs${NC}"
echo ""

# Проверка наличия .env.prod
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Файл .env.prod не найден!${NC}"
    exit 1
fi

# Загрузка переменных из .env.prod
source .env.prod

# Проверка наличия необходимых переменных
if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ ADMIN_USERNAME или ADMIN_PASSWORD не установлены в .env.prod${NC}"
    exit 1
fi

echo -e "${YELLOW}👤 Пользователь: ${ADMIN_USERNAME}${NC}"
echo ""

# Создание директории nginx если не существует
mkdir -p nginx

# Генерация хэша пароля с помощью openssl
# Используем apr1 алгоритм (Apache MD5)
HASHED_PASSWORD=$(openssl passwd -apr1 "$ADMIN_PASSWORD")

# Создание .htpasswd файла
echo "${ADMIN_USERNAME}:${HASHED_PASSWORD}" > nginx/.htpasswd

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Файл nginx/.htpasswd создан успешно${NC}"
    echo ""
    echo -e "${YELLOW}Файл содержит:${NC}"
    cat nginx/.htpasswd
    echo ""
    echo -e "${GREEN}🔒 Admin-docs теперь защищены Basic Auth${NC}"
    echo -e "${YELLOW}Для применения изменений перезапустите nginx:${NC}"
    echo "  docker compose --env-file .env.prod -f docker-compose.prod.yml restart nginx"
else
    echo -e "${RED}❌ Ошибка при создании .htpasswd${NC}"
    exit 1
fi
