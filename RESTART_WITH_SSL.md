# Перезапуск проекта с существующими SSL сертификатами

## Текущая ситуация

✅ SSL сертификаты от Namecheap уже установлены на сервере: `/opt/xr2/nginx/ssl/`
✅ Конфигурация nginx обновлена для использования ваших сертификатов
✅ Docker Compose настроен правильно

## Шаги для перезапуска

### 1. Подключитесь к серверу

```bash
ssh root@<PROD_HOST>
```

### 2. Перейдите в директорию проекта

```bash
cd /opt/xr2
```

### 3. Проверьте, что сертификаты на месте

```bash
ls -la nginx/ssl/
```

Должны быть файлы:
- `fullchain.pem` (или `xr2.uk.crt` + `xr2.uk.ca-bundle`)
- `key.pem` (или `xr2.uk.key`)

### 4. Создайте fullchain.pem если его нет

Если у вас есть отдельные файлы `xr2.uk.crt` и `xr2.uk.ca-bundle`, объедините их:

```bash
cd nginx/ssl
cat xr2.uk.crt xr2.uk.ca-bundle > fullchain.pem
cp xr2.uk.key key.pem
```

### 5. Проверьте права доступа к сертификатам

```bash
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/key.pem
```

### 6. Скопируйте обновленные конфигурационные файлы на сервер

С вашего локального компьютера:

```bash
# Скопируйте обновленную конфигурацию nginx
scp /Users/pavelkuzko/Documents/channeler/xR2/nginx/nginx.prod.conf root@<PROD_HOST>:/opt/xr2/nginx/

# Скопируйте обновленный docker-compose
scp /Users/pavelkuzko/Documents/channeler/xR2/docker-compose.prod.yml root@<PROD_HOST>:/opt/xr2/
```

### 7. Перезапустите проект

```bash
cd /opt/xr2

# Остановите текущие контейнеры
docker-compose -f docker-compose.prod.yml down

# Запустите с новой конфигурацией
docker-compose -f docker-compose.prod.yml up -d

# Проверьте логи nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 8. Проверьте работу

```bash
# Проверка HTTP (должен редиректить на HTTPS)
curl -I http://xr2.uk

# Проверка HTTPS
curl -I https://xr2.uk

# Проверка SSL сертификата
openssl s_client -connect xr2.uk:443 -servername xr2.uk
```

## Откройте в браузере

Перейдите на: **https://xr2.uk**

Должно работать с зеленым замочком!

## Troubleshooting

### Ошибка: "cannot load certificate"

**Решение:**
```bash
# Проверьте существование файлов
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/ssl/

# Проверьте содержимое сертификата
docker-compose -f docker-compose.prod.yml exec nginx cat /etc/nginx/ssl/fullchain.pem | head -n 5
```

### Ошибка: "SSL: error:0200100D:system library:fopen:Permission denied"

**Решение:**
```bash
# Исправьте права доступа
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/key.pem

# Перезапустите nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Ошибка: "nginx: [emerg] cannot load certificate key"

**Решение:**
Убедитесь, что файл `key.pem` содержит приватный ключ:
```bash
cat nginx/ssl/key.pem | head -n 1
# Должно быть: -----BEGIN PRIVATE KEY-----
```

### Браузер показывает "NET::ERR_CERT_COMMON_NAME_INVALID"

**Решение:**
Убедитесь, что в сертификате указан правильный домен:
```bash
openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep "Subject:"
```

### DNS не резолвится

**Проверка:**
```bash
dig xr2.uk +short
# Должно показать: <PROD_HOST>
```

Если не показывает - проверьте DNS записи у регистратора.

## Проверка конфигурации nginx

```bash
# Проверка синтаксиса конфигурации
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Перезагрузка конфигурации без перезапуска
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Структура сертификатов

Для Namecheap SSL сертификатов обычно нужны:

1. **fullchain.pem** = Сертификат сервера + Промежуточные сертификаты
   ```bash
   cat xr2.uk.crt xr2.uk.ca-bundle > fullchain.pem
   ```

2. **key.pem** = Приватный ключ
   ```bash
   cp xr2.uk.key key.pem
   ```

## Срок действия сертификата

Проверьте срок действия вашего сертификата:

```bash
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates
```

Установите напоминание для продления сертификата перед истечением срока!
