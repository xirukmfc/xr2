#!/bin/bash

# Скрипт для настройки SSL сертификатов через Let's Encrypt для xr2.uk
# Запускать на сервере с правами root или через sudo

set -e

DOMAIN="xr2.uk"
EMAIL="your-email@example.com"  # Замените на ваш email

echo "=========================================="
echo "Настройка SSL для домена $DOMAIN"
echo "=========================================="

# Проверка, что скрипт запущен с правами root
if [ "$EUID" -ne 0 ]; then
    echo "Пожалуйста, запустите скрипт с правами root (sudo)"
    exit 1
fi

# Установка certbot если его нет
if ! command -v certbot &> /dev/null; then
    echo "Установка certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Остановка nginx для получения сертификата
echo "Остановка nginx..."
docker-compose stop nginx || systemctl stop nginx || true

# Получение сертификата через standalone режим
echo "Получение SSL сертификата для $DOMAIN и www.$DOMAIN..."
certbot certonly --standalone \
    --preferred-challenges http \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Создание директории для сертификатов в проекте (для Docker)
echo "Создание символических ссылок для Docker..."
mkdir -p /etc/letsencrypt
chmod 755 /etc/letsencrypt

# Настройка автообновления сертификата
echo "Настройка автообновления сертификата..."
cat > /etc/cron.d/certbot-renew << 'EOF'
0 3 * * * root certbot renew --quiet --deploy-hook "docker-compose -f /path/to/xR2/docker-compose.yml restart nginx"
EOF

echo "=========================================="
echo "SSL сертификаты успешно установлены!"
echo "=========================================="
echo ""
echo "Следующие шаги:"
echo "1. Проверьте, что домен $DOMAIN указывает на IP вашего сервера"
echo "2. Запустите проект с обновленной конфигурацией nginx"
echo "3. Откройте https://$DOMAIN в браузере"
echo ""
echo "Сертификат будет автоматически обновляться каждые 3 месяца"
