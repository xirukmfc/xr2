# Быстрая настройка домена xr2.uk

## Краткая инструкция (5 шагов)

### 1. Настройте DNS записи у регистратора домена

Добавьте A-записи, которые указывают на ваш сервер:

```
xr2.uk      →  <PROD_HOST>
www.xr2.uk  →  <PROD_HOST>
```

### 2. Подождите распространения DNS (1-2 часа)

Проверьте командой:
```bash
dig xr2.uk +short
```
Должно показать: `<PROD_HOST>`

### 3. На сервере установите SSL сертификаты

```bash
# Подключитесь к серверу
ssh root@<PROD_HOST>

# Остановите nginx (если запущен)
docker-compose -f docker-compose.prod.yml stop nginx

# Установите certbot
apt-get update && apt-get install -y certbot

# Получите SSL сертификат (замените email на ваш)
certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  -d xr2.uk \
  -d www.xr2.uk
```

### 4. Перезапустите проект

```bash
# В директории проекта
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Проверьте работу

Откройте в браузере: https://xr2.uk

## Что изменено в проекте

✅ **nginx/nginx.prod.conf** - добавлена поддержка HTTPS и редирект с HTTP
✅ **docker-compose.prod.yml** - добавлено монтирование SSL сертификатов
✅ **scripts/setup-ssl.sh** - скрипт для автоматической установки SSL

## Файлы конфигурации

- `/Users/pavelkuzko/Documents/channeler/xR2/nginx/nginx.prod.conf` - обновленная конфигурация nginx
- `/Users/pavelkuzko/Documents/channeler/xR2/docker-compose.prod.yml` - обновленный docker-compose
- `/Users/pavelkuzko/Documents/channeler/xR2/DOMAIN_SETUP.md` - подробная инструкция

## Troubleshooting

**Проблема:** certbot не может получить сертификат

**Решение:**
- Убедитесь что DNS работает: `dig xr2.uk +short`
- Убедитесь что порт 80 открыт: `ufw allow 80/tcp`
- Остановите nginx перед запуском certbot

**Проблема:** браузер показывает ошибку SSL

**Решение:**
- Проверьте что сертификаты установлены: `ls -la /etc/letsencrypt/live/xr2.uk/`
- Проверьте логи nginx: `docker-compose -f docker-compose.prod.yml logs nginx`
- Убедитесь что порт 443 открыт: `ufw allow 443/tcp`
