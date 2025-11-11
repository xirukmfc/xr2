#!/bin/bash

# Скрипт диагностики nginx
# Запускать на сервере

echo "=========================================="
echo "Диагностика nginx"
echo "=========================================="
echo ""

echo "1. Проверка статуса контейнера nginx:"
docker ps -a | grep nginx

echo ""
echo "2. Логи nginx (последние 30 строк):"
docker logs xr2_nginx_prod 2>&1 | tail -30

echo ""
echo "3. Проверка файлов SSL внутри контейнера:"
docker exec xr2_nginx_prod ls -la /etc/nginx/ssl/ 2>&1 || echo "Контейнер не запущен"

echo ""
echo "4. Проверка конфигурации nginx:"
docker exec xr2_nginx_prod nginx -t 2>&1 || echo "Контейнер не запущен"

echo ""
echo "5. Проверка сертификата fullchain.pem:"
if [ -f /opt/xr2/nginx/ssl/fullchain.pem ]; then
    openssl x509 -in /opt/xr2/nginx/ssl/fullchain.pem -noout -subject -dates
else
    echo "Файл fullchain.pem не найден!"
fi

echo ""
echo "6. Проверка ключа key.pem:"
if [ -f /opt/xr2/nginx/ssl/key.pem ]; then
    echo "✅ Файл key.pem существует"
    ls -lh /opt/xr2/nginx/ssl/key.pem
else
    echo "❌ Файл key.pem не найден!"
fi

echo ""
echo "=========================================="
