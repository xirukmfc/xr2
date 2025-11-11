# 🚀 Инструкция: Запуск xr2.uk с HTTPS

## Ваша ситуация
✅ Сервер: <PROD_HOST>
✅ Домен: xr2.uk
✅ SSL сертификаты от Namecheap уже на сервере: `/opt/xr2/nginx/ssl/`
✅ Конфигурация обновлена

## 3 простых шага

### Шаг 1: Скопируйте обновленные файлы на сервер

**На вашем локальном компьютере выполните:**

```bash
# Скопируйте nginx конфигурацию
scp /Users/pavelkuzko/Documents/channeler/xR2/nginx/nginx.prod.conf root@<PROD_HOST>:/opt/xr2/nginx/

# Скопируйте docker-compose
scp /Users/pavelkuzko/Documents/channeler/xR2/docker-compose.prod.yml root@<PROD_HOST>:/opt/xr2/

# Скопируйте скрипт подготовки SSL
scp /Users/pavelkuzko/Documents/channeler/xR2/scripts/prepare-ssl-namecheap.sh root@<PROD_HOST>:/opt/xr2/scripts/
```

### Шаг 2: Подготовьте сертификаты на сервере

**На сервере выполните:**

```bash
# Подключитесь к серверу
ssh root@<PROD_HOST>

# Перейдите в директорию проекта
cd /opt/xr2

# Сделайте скрипт исполняемым
chmod +x scripts/prepare-ssl-namecheap.sh

# Запустите скрипт подготовки сертификатов
./scripts/prepare-ssl-namecheap.sh
```

Скрипт проверит ваши сертификаты и создаст нужные файлы `fullchain.pem` и `key.pem`.

### Шаг 3: Перезапустите проект

**На сервере выполните:**

```bash
cd /opt/xr2

# Перезапустите с новой конфигурацией
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Проверьте логи
docker-compose -f docker-compose.prod.yml logs -f nginx
```

Нажмите `Ctrl+C` чтобы выйти из логов.

## ✅ Проверка

Откройте в браузере: **https://xr2.uk**

Должно работать! 🎉

## Дополнительные проверки

```bash
# Проверка HTTP → HTTPS редиректа
curl -I http://xr2.uk

# Проверка HTTPS
curl -I https://xr2.uk

# Проверка DNS
dig xr2.uk +short
```

## Что если не работает?

### 1. DNS не резолвится

```bash
dig xr2.uk +short
```

Если не показывает `<PROD_HOST>` - проверьте DNS записи у регистратора домена.

### 2. Ошибка SSL в nginx

```bash
# Проверьте логи nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Проверьте конфигурацию nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Проверьте файлы сертификатов внутри контейнера
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/ssl/
```

### 3. Сертификат не загружается

Проверьте что файлы `fullchain.pem` и `key.pem` существуют:

```bash
ls -la /opt/xr2/nginx/ssl/
```

Если нет - запустите снова скрипт подготовки:

```bash
cd /opt/xr2
./scripts/prepare-ssl-namecheap.sh
```

## Важные файлы

- **nginx.prod.conf** - конфигурация nginx с HTTPS
- **docker-compose.prod.yml** - docker compose с правильными volume
- **scripts/prepare-ssl-namecheap.sh** - скрипт подготовки сертификатов

## Что было изменено

1. **nginx/nginx.prod.conf** - добавлен HTTPS и редирект с HTTP
2. **docker-compose.prod.yml** - обновлен volume для SSL сертификатов
3. Пути к сертификатам изменены с Let's Encrypt на ваши Namecheap сертификаты

---

**Время выполнения:** ~5 минут
**Сложность:** Легко 😊
