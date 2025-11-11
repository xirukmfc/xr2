#!/bin/bash

# Скрипт для подготовки SSL сертификатов от Namecheap
# Запускать на сервере в директории /opt/xr2

set -e

echo "=========================================="
echo "Подготовка SSL сертификатов от Namecheap"
echo "=========================================="

cd /opt/xr2/nginx/ssl

echo "Текущие файлы в директории:"
ls -lh

echo ""
echo "Проверка существующих файлов сертификатов..."

# Проверяем наличие файлов
if [ -f "fullchain.pem" ] && [ -f "key.pem" ]; then
    echo "✅ Файлы fullchain.pem и key.pem уже существуют"
    echo ""
    echo "Проверка валидности сертификатов..."
    openssl x509 -in fullchain.pem -noout -dates
    openssl x509 -in fullchain.pem -noout -subject
    echo ""
    echo "Сертификаты готовы к использованию!"
    exit 0
fi

echo "⚠️  Файлы fullchain.pem или key.pem не найдены"
echo ""

# Создаем fullchain.pem из отдельных файлов
if [ -f "xr2.uk.crt" ] && [ -f "xr2.uk.ca-bundle" ]; then
    echo "Создание fullchain.pem из xr2.uk.crt и xr2.uk.ca-bundle..."
    # ВАЖНО: добавляем пустую строку между сертификатами
    cat xr2.uk.crt > fullchain.pem
    echo "" >> fullchain.pem
    cat xr2.uk.ca-bundle >> fullchain.pem
    echo "✅ fullchain.pem создан"
else
    echo "❌ Файлы xr2.uk.crt или xr2.uk.ca-bundle не найдены!"
    echo "Пожалуйста, убедитесь что SSL сертификаты загружены в /opt/xr2/nginx/ssl/"
    exit 1
fi

# Копируем правильный приватный ключ
if [ -f "xr2.uk.key" ]; then
    echo "Создание key.pem из xr2.uk.key..."
    cp xr2.uk.key key.pem
    echo "✅ key.pem создан"
elif [ -f "cert.key" ]; then
    echo "Создание key.pem из cert.key..."
    cp cert.key key.pem
    echo "✅ key.pem создан"
else
    echo "❌ Приватный ключ не найден!"
    echo "Ожидаемые имена: xr2.uk.key или cert.key"
    exit 1
fi

# Устанавливаем правильные права доступа
echo ""
echo "Установка прав доступа..."
chmod 644 fullchain.pem
chmod 600 key.pem
echo "✅ Права доступа установлены"

# Проверка сертификатов
echo ""
echo "Проверка валидности сертификатов..."
openssl x509 -in fullchain.pem -noout -dates
openssl x509 -in fullchain.pem -noout -subject

# Проверка совместимости ключа и сертификата
CERT_MODULUS=$(openssl x509 -noout -modulus -in fullchain.pem | openssl md5)
KEY_MODULUS=$(openssl rsa -noout -modulus -in key.pem | openssl md5)

if [ "$CERT_MODULUS" = "$KEY_MODULUS" ]; then
    echo "✅ Сертификат и ключ совместимы"
else
    echo "❌ ВНИМАНИЕ: Сертификат и ключ НЕ совместимы!"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ SSL сертификаты готовы к использованию!"
echo "=========================================="
echo ""
echo "Итоговые файлы:"
ls -lh fullchain.pem key.pem

echo ""
echo "Теперь можно перезапустить проект:"
echo "cd /opt/xr2 && docker-compose -f docker-compose.prod.yml restart nginx"
