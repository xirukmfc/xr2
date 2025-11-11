# ✅ SSL Сертификаты настроены успешно!

## Статус

🎉 **Сайт https://xr2.uk работает!**

- ✅ HTTPS работает корректно
- ✅ HTTP → HTTPS редирект настроен
- ✅ HTTP/2 включен
- ✅ SSL сертификат валидный
- ✅ Все заголовки безопасности на месте

## Что было исправлено

### 1. Проблема с fullchain.pem
**Проблема:** Между сертификатами не было переноса строки
```
-----END CERTIFICATE----------BEGIN CERTIFICATE-----  ❌
```

**Решение:** Добавлена пустая строка между сертификатами
```bash
cat xr2.uk.crt > fullchain.pem
echo "" >> fullchain.pem
cat xr2.uk.ca-bundle >> fullchain.pem
```

### 2. Проблема с ключом
**Проблема:** Использовался неправильный ключ (`key.pem` не соответствовал сертификату)

**Решение:** Использован правильный ключ `xr2.uk.key`
```bash
cp xr2.uk.key key.pem
```

### 3. Устаревшая директива nginx
**Проблема:** `listen 443 ssl http2;` устарела

**Решение:** Обновлено на новый формат
```nginx
listen 443 ssl;
http2 on;
```

## Текущая конфигурация

### nginx/nginx.prod.conf
```nginx
# HTTP → HTTPS редирект
server {
    listen 80;
    server_name xr2.uk www.xr2.uk;
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер
server {
    listen 443 ssl;
    http2 on;
    server_name xr2.uk www.xr2.uk;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... остальная конфигурация
}
```

### Файлы сертификатов на сервере
```
/opt/xr2/nginx/ssl/
├── fullchain.pem      # Сертификат + цепочка CA
├── key.pem           # Приватный ключ
├── xr2.uk.crt        # Исходный сертификат
├── xr2.uk.ca-bundle  # CA bundle
└── xr2.uk.key        # Исходный ключ
```

## Проверка работы

### 1. HTTP редирект
```bash
curl -I http://xr2.uk
# HTTP/1.1 301 Moved Permanently
# Location: https://xr2.uk/
```

### 2. HTTPS
```bash
curl -I https://xr2.uk
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains
```

### 3. В браузере
Откройте: **https://xr2.uk**

Должен быть виден зеленый замочек 🔒

## Команды для управления

### Перезапуск nginx
```bash
cd /opt/xr2
docker restart xr2_nginx_prod
```

### Проверка логов
```bash
docker logs xr2_nginx_prod
```

### Проверка конфигурации
```bash
docker exec xr2_nginx_prod nginx -t
```

### Перезагрузка конфигурации без остановки
```bash
docker exec xr2_nginx_prod nginx -s reload
```

## Обновленные файлы в репозитории

1. **nginx/nginx.prod.conf** - Конфигурация nginx с HTTPS
2. **docker-compose.prod.yml** - Docker Compose с монтированием SSL
3. **scripts/prepare-ssl-namecheap.sh** - Скрипт подготовки сертификатов (исправлен)

## Срок действия сертификата

Проверьте срок действия:
```bash
openssl x509 -in /opt/xr2/nginx/ssl/fullchain.pem -noout -dates
```

Не забудьте продлить сертификат перед истечением срока!

## Автоматизация на будущее

При обновлении сертификатов в будущем:

```bash
cd /opt/xr2/nginx/ssl

# Загрузите новые файлы: xr2.uk.crt, xr2.uk.ca-bundle, xr2.uk.key

# Запустите скрипт подготовки
/opt/xr2/scripts/prepare-ssl-namecheap.sh

# Перезапустите nginx
docker restart xr2_nginx_prod
```

---

**Дата настройки:** 2025-11-11
**Домен:** xr2.uk
**IP:** <PROD_HOST>
