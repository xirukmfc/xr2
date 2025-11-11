# Настройка домена xr2.uk для работы через HTTPS

## Текущая проблема
Сайт доступен только по IP-адресу (<PROD_HOST>), но не работает через домен https://xr2.uk/

## Решение

### Шаг 1: Настройка DNS записей

Необходимо настроить DNS записи у вашего регистратора домена (где вы купили домен xr2.uk):

1. Войдите в панель управления доменом у вашего регистратора
2. Найдите раздел DNS настроек / DNS Management / DNS Records
3. Добавьте следующие записи:

```
Тип    Имя    Значение           TTL
A      @      <PROD_HOST>     3600
A      www    <PROD_HOST>     3600
```

**Важно:** После добавления DNS записей может потребоваться до 24-48 часов для полного распространения изменений (обычно 1-2 часа).

### Шаг 2: Проверка DNS записей

Перед установкой SSL сертификата убедитесь, что DNS записи работают:

```bash
# Проверка основного домена
dig xr2.uk +short
# Должно вывести: <PROD_HOST>

# Проверка www поддомена
dig www.xr2.uk +short
# Должно вывести: <PROD_HOST>

# Альтернативная проверка
nslookup xr2.uk
nslookup www.xr2.uk
```

### Шаг 3: Установка SSL сертификатов на сервере

**На сервере (<PROD_HOST>):**

1. Подключитесь к серверу по SSH:
```bash
ssh root@<PROD_HOST>
```

2. Перейдите в директорию проекта:
```bash
cd /path/to/xR2
```

3. Сделайте скрипт установки SSL исполняемым:
```bash
chmod +x scripts/setup-ssl.sh
```

4. Отредактируйте скрипт и укажите ваш email:
```bash
nano scripts/setup-ssl.sh
# Измените строку: EMAIL="your-email@example.com"
```

5. Запустите скрипт установки SSL:
```bash
sudo ./scripts/setup-ssl.sh
```

### Шаг 4: Обновление Docker Compose конфигурации

Убедитесь, что в вашем `docker-compose.yml` nginx использует правильный конфиг и монтирует SSL сертификаты:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
  depends_on:
    - app
    - frontend
```

### Шаг 5: Перезапуск проекта

```bash
# Остановка проекта
docker-compose down

# Запуск с новой конфигурацией
docker-compose up -d

# Проверка логов nginx
docker-compose logs -f nginx
```

### Шаг 6: Проверка работы

1. Откройте браузер и перейдите по адресу: https://xr2.uk
2. Проверьте, что:
   - Сайт открывается по HTTPS
   - SSL сертификат валидный (зеленый замок в браузере)
   - Редирект с HTTP на HTTPS работает (http://xr2.uk → https://xr2.uk)

## Альтернативный способ (без остановки сервера)

Если вы не хотите останавливать nginx, можно использовать certbot с плагином nginx:

```bash
# Установка certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Получение сертификата (certbot автоматически настроит nginx)
certbot --nginx -d xr2.uk -d www.xr2.uk
```

## Troubleshooting

### Проблема: DNS не резолвится

**Решение:**
- Подождите 1-2 часа после изменения DNS
- Проверьте правильность записей у регистратора
- Используйте `dig xr2.uk` для проверки

### Проблема: Certbot не может получить сертификат

**Ошибка:** "Failed to connect to <PROD_HOST>"

**Решение:**
- Убедитесь, что порт 80 открыт: `sudo ufw allow 80/tcp`
- Проверьте, что nginx остановлен: `docker-compose stop nginx`
- Проверьте DNS записи: `dig xr2.uk +short`

### Проблема: ERR_SSL_PROTOCOL_ERROR

**Решение:**
- Проверьте, что порт 443 открыт: `sudo ufw allow 443/tcp`
- Проверьте монтирование сертификатов в docker-compose.yml
- Проверьте логи nginx: `docker-compose logs nginx`

### Проблема: Mixed Content (HTTP на HTTPS странице)

**Решение:**
- Убедитесь, что `X-Forwarded-Proto` заголовок передается в приложение
- Проверьте, что фронтенд использует относительные пути или HTTPS URL

## Настройка Firewall (UFW)

Если используете UFW, откройте необходимые порты:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status
```

## Автообновление SSL сертификатов

Let's Encrypt сертификаты действительны 90 дней. Certbot автоматически настраивает cron job для обновления.

Проверка автообновления:
```bash
# Тестовый запуск обновления
certbot renew --dry-run

# Проверка cron задачи
cat /etc/cron.d/certbot-renew
```

## Проверка конфигурации

```bash
# Проверка конфигурации nginx
docker-compose exec nginx nginx -t

# Перезагрузка конфигурации без остановки
docker-compose exec nginx nginx -s reload
```

## Полезные команды

```bash
# Статус сертификатов
certbot certificates

# Принудительное обновление сертификата
certbot renew --force-renewal

# Удаление сертификата
certbot delete --cert-name xr2.uk
```
